"""Persistencia en SQLite: sesiones, descubrimientos y bitacora.

Se abre una conexion por operacion en vez de mantener una global. Con el
volumen de este proyecto el costo es despreciable y elimina de raiz los
problemas de compartir conexiones entre hilos.

Aqui no se toma ninguna decision deductiva: esta capa solo recuerda que
descubrio el usuario y que hizo. Toda inferencia ocurre en Prolog.
"""

from __future__ import annotations

import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

from app import config

ESQUEMA = """
CREATE TABLE IF NOT EXISTS sesiones (
    id           TEXT PRIMARY KEY,
    caso         TEXT NOT NULL,
    iniciada     TEXT NOT NULL,
    estado       TEXT NOT NULL DEFAULT 'en_curso',
    acusado      TEXT,
    veredicto    TEXT,
    pistas       INTEGER NOT NULL DEFAULT 0,
    cerrada      TEXT,
    puntuacion   INTEGER NOT NULL DEFAULT 100,
    tiempo_inicio TEXT
);

CREATE TABLE IF NOT EXISTS descubrimientos (
    sesion  TEXT NOT NULL,
    tipo    TEXT NOT NULL,
    ref     TEXT NOT NULL,
    hallado TEXT NOT NULL,
    PRIMARY KEY (sesion, tipo, ref),
    FOREIGN KEY (sesion) REFERENCES sesiones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bitacora (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion   TEXT NOT NULL,
    momento  TEXT NOT NULL,
    accion   TEXT NOT NULL,
    detalle  TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (sesion) REFERENCES sesiones(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bitacora_sesion ON bitacora(sesion);
CREATE INDEX IF NOT EXISTS idx_desc_sesion     ON descubrimientos(sesion);
"""

# Migracion: agrega las columnas nuevas a bases existentes sin romper nada.
# ALTER TABLE ignora el error si la columna ya existe (IGNORE).
MIGRACIONES = """
ALTER TABLE sesiones ADD COLUMN puntuacion    INTEGER NOT NULL DEFAULT 100;
ALTER TABLE sesiones ADD COLUMN tiempo_inicio TEXT;
"""


def ahora() -> str:
    """Marca de tiempo UTC en ISO 8601, con precision de segundos."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def conexion() -> Iterator[sqlite3.Connection]:
    """Abre una conexion con claves foraneas activas y commit automatico."""
    config.RUTA_BD.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(config.RUTA_BD, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def inicializar() -> None:
    """Crea las tablas si no existen y aplica migraciones. Se llama al arrancar."""
    with conexion() as con:
        con.executescript(ESQUEMA)
        # Aplica cada ALTER TABLE por separado; ignora si la columna ya existe.
        for sentencia in MIGRACIONES.strip().splitlines():
            sentencia = sentencia.strip()
            if not sentencia:
                continue
            try:
                con.execute(sentencia)
            except sqlite3.OperationalError:
                # "duplicate column name" — la columna ya existia, no pasa nada.
                pass


# ---------------------------------------------------------------------------
# Sesiones
# ---------------------------------------------------------------------------

def crear_sesion(caso: str) -> str:
    """Registra una nueva investigacion y devuelve su identificador."""
    sesion_id = uuid.uuid4().hex[:12]
    with conexion() as con:
        con.execute(
            "INSERT INTO sesiones (id, caso, iniciada, puntuacion, tiempo_inicio) "
            "VALUES (?, ?, ?, ?, ?)",
            (sesion_id, caso, ahora(), 100, ahora()),
        )
    return sesion_id


def obtener_sesion(sesion_id: str) -> dict[str, Any] | None:
    with conexion() as con:
        fila = con.execute(
            "SELECT * FROM sesiones WHERE id = ?", (sesion_id,)
        ).fetchone()
    return dict(fila) if fila else None


def listar_sesiones(limite: int = 50) -> list[dict[str, Any]]:
    with conexion() as con:
        filas = con.execute(
            "SELECT * FROM sesiones ORDER BY iniciada DESC LIMIT ?", (limite,)
        ).fetchall()
    return [dict(f) for f in filas]


def listar_sesiones_con_metricas(
    caso: str | None = None,
    veredicto: str | None = None,
    estado: str | None = None,
    limite: int = 100,
) -> list[dict[str, Any]]:
    """Lista sesiones con conteo de acciones y descubrimientos para el historial."""
    query = """
    SELECT 
        s.id,
        s.caso,
        s.iniciada,
        s.estado,
        s.acusado,
        s.veredicto,
        s.pistas,
        s.cerrada,
        COUNT(DISTINCT b.id) AS total_acciones,
        COUNT(DISTINCT d.tipo || ':' || d.ref) AS total_descubrimientos
    FROM sesiones s
    LEFT JOIN bitacora b ON b.sesion = s.id
    LEFT JOIN descubrimientos d ON d.sesion = s.id
    WHERE 1=1
    """
    params: list[Any] = []
    if caso:
        query += " AND s.caso = ?"
        params.append(caso)
    if veredicto:
        query += " AND s.veredicto = ?"
        params.append(veredicto)
    if estado:
        query += " AND s.estado = ?"
        params.append(estado)
    query += " GROUP BY s.id ORDER BY s.iniciada DESC LIMIT ?"
    params.append(limite)

    with conexion() as con:
        filas = con.execute(query, params).fetchall()
    return [dict(f) for f in filas]


def estadisticas_globales() -> dict[str, Any]:
    """Estadísticas globales de resolución de investigaciones."""
    with conexion() as con:
        total = con.execute("SELECT COUNT(*) FROM sesiones").fetchone()[0]
        resueltas = con.execute(
            "SELECT COUNT(*) FROM sesiones WHERE estado = 'resuelto' AND veredicto = 'correcto'"
        ).fetchone()[0]
        fallidas = con.execute(
            "SELECT COUNT(*) FROM sesiones WHERE estado = 'fallido' OR veredicto = 'incorrecto'"
        ).fetchone()[0]
        en_curso = con.execute(
            "SELECT COUNT(*) FROM sesiones WHERE estado = 'en_curso'"
        ).fetchone()[0]
        prom_pistas_row = con.execute("SELECT AVG(pistas) FROM sesiones").fetchone()[0]
        prom_pistas = float(prom_pistas_row) if prom_pistas_row is not None else 0.0

        por_caso = con.execute(
            "SELECT caso, COUNT(*) as total, "
            "SUM(CASE WHEN veredicto = 'correcto' THEN 1 ELSE 0 END) as correctas, "
            "SUM(CASE WHEN veredicto = 'incorrecto' THEN 1 ELSE 0 END) as incorrectas, "
            "SUM(CASE WHEN estado = 'en_curso' THEN 1 ELSE 0 END) as en_curso "
            "FROM sesiones GROUP BY caso"
        ).fetchall()

    cerradas = resueltas + fallidas
    tasa_exito = round((resueltas / cerradas * 100), 1) if cerradas > 0 else 0.0

    return {
        "total": total,
        "resueltas": resueltas,
        "fallidas": fallidas,
        "en_curso": en_curso,
        "tasa_exito": tasa_exito,
        "promedio_pistas": round(prom_pistas, 1),
        "por_caso": [dict(f) for f in por_caso],
    }


def estado_de_casos() -> dict[str, str]:
    """Estado mas reciente por caso, para la pantalla de inicio.

    El enunciado pide mostrar el "estado de los casos iniciados o completados".
    Un caso resuelto alguna vez se reporta como resuelto aunque despues se
    haya vuelto a jugar.
    """
    with conexion() as con:
        filas = con.execute(
            "SELECT caso, estado, COUNT(*) AS total FROM sesiones GROUP BY caso, estado"
        ).fetchall()

    resumen: dict[str, str] = {}
    for fila in filas:
        caso, estado = fila["caso"], fila["estado"]
        if resumen.get(caso) == "resuelto":
            continue
        resumen[caso] = estado
    return resumen


def cerrar_sesion(sesion_id: str, acusado: str, veredicto: str) -> None:
    estado = "resuelto" if veredicto == "correcto" else "fallido"
    with conexion() as con:
        con.execute(
            "UPDATE sesiones SET estado = ?, acusado = ?, veredicto = ?, cerrada = ? "
            "WHERE id = ?",
            (estado, acusado, veredicto, ahora(), sesion_id),
        )


def incrementar_pistas(sesion_id: str) -> int:
    """Suma una pista a la sesion y devuelve el nuevo total."""
    with conexion() as con:
        con.execute(
            "UPDATE sesiones SET pistas = pistas + 1 WHERE id = ?", (sesion_id,)
        )
        fila = con.execute(
            "SELECT pistas FROM sesiones WHERE id = ?", (sesion_id,)
        ).fetchone()
    return int(fila["pistas"]) if fila else 0


def actualizar_puntuacion(sesion_id: str, delta: int) -> int:
    """Suma delta a la puntuacion (puede ser negativo) y devuelve el nuevo valor.

    La puntuacion nunca baja de 0: el detective no puede quedar en negativo.
    """
    with conexion() as con:
        con.execute(
            "UPDATE sesiones "
            "SET puntuacion = MAX(0, puntuacion + ?) "
            "WHERE id = ?",
            (delta, sesion_id),
        )
        fila = con.execute(
            "SELECT puntuacion FROM sesiones WHERE id = ?", (sesion_id,)
        ).fetchone()
    return int(fila["puntuacion"]) if fila else 0


# ---------------------------------------------------------------------------
# Descubrimientos (estado del descubrimiento progresivo)
# ---------------------------------------------------------------------------

def registrar_descubrimiento(sesion_id: str, tipo: str, ref: str) -> bool:
    """Marca un elemento como descubierto.

    Devuelve True si es la primera vez que se descubre, False si ya se conocia.
    """
    with conexion() as con:
        cursor = con.execute(
            "INSERT OR IGNORE INTO descubrimientos (sesion, tipo, ref, hallado) "
            "VALUES (?, ?, ?, ?)",
            (sesion_id, tipo, ref, ahora()),
        )
    return cursor.rowcount > 0


def descubiertos(sesion_id: str, tipo: str | None = None) -> list[str]:
    """Referencias ya descubiertas, opcionalmente filtradas por tipo."""
    with conexion() as con:
        if tipo is None:
            filas = con.execute(
                "SELECT ref FROM descubrimientos WHERE sesion = ? ORDER BY hallado",
                (sesion_id,),
            ).fetchall()
        else:
            filas = con.execute(
                "SELECT ref FROM descubrimientos WHERE sesion = ? AND tipo = ? "
                "ORDER BY hallado",
                (sesion_id, tipo),
            ).fetchall()
    return [f["ref"] for f in filas]


def fue_descubierto(sesion_id: str, tipo: str, ref: str) -> bool:
    with conexion() as con:
        fila = con.execute(
            "SELECT 1 FROM descubrimientos WHERE sesion = ? AND tipo = ? AND ref = ?",
            (sesion_id, tipo, ref),
        ).fetchone()
    return fila is not None


# ---------------------------------------------------------------------------
# Bitacora de investigacion
# ---------------------------------------------------------------------------

def registrar_accion(sesion_id: str, accion: str, detalle: str = "") -> None:
    """Anota una accion del detective.

    El enunciado exige que CADA accion del usuario quede registrada, asi que
    esto se llama desde todos los endpoints del modulo de investigacion.
    """
    with conexion() as con:
        con.execute(
            "INSERT INTO bitacora (sesion, momento, accion, detalle) VALUES (?, ?, ?, ?)",
            (sesion_id, ahora(), accion, detalle),
        )


def leer_bitacora(sesion_id: str) -> list[dict[str, Any]]:
    with conexion() as con:
        filas = con.execute(
            "SELECT momento, accion, detalle FROM bitacora WHERE sesion = ? "
            "ORDER BY id",
            (sesion_id,),
        ).fetchall()
    return [dict(f) for f in filas]


def borrar_todo() -> None:
    """Vacia la base. Solo lo usan las pruebas y el modulo administrativo."""
    with conexion() as con:
        con.executescript(
            "DELETE FROM bitacora; DELETE FROM descubrimientos; DELETE FROM sesiones;"
        )