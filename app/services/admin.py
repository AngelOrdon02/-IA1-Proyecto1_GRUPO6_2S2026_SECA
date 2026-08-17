"""Modulo Administrativo: gestion de los casos de investigacion.

NOTA SOBRE EL ALCANCE: el enunciado menciona el modulo administrativo como uno
de los tres componentes del sistema, pero la seccion que deberia describirlo
(pagina 6 del PDF) contiene por error el texto del motor de inferencia. Ante
esa ambiguedad se implemento la interpretacion razonable: gestion del ciclo de
vida de los casos — consultar, validar, crear, editar y eliminar la base de
conocimiento de cada caso — mas la supervision de las sesiones.

Esta suposicion esta documentada en docs/arquitectura.md y deberia
confirmarse con el tutor.
"""

from __future__ import annotations

import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app import config
from app.prolog.engine import obtener_engine, reiniciar_engine
from app.services.investigacion import AccionInvalida
from app.storage import db

DIR_CASOS = config.RAIZ / "prolog" / "casos"
DIR_RESPALDOS = config.RAIZ / "datos" / "respaldos"
ARCHIVO_CARGA = config.RAIZ / "prolog" / "logic_detective.pl"

_ID_CASO = re.compile(r"^[a-z][a-z0-9_]{2,30}$")


def _validar_id(caso: str) -> str:
    if not _ID_CASO.match(caso or ""):
        raise AccionInvalida(
            "El identificador del caso debe empezar por minuscula y usar solo "
            "letras, numeros y guion bajo (3 a 31 caracteres)."
        )
    return caso


def _archivo_de(caso: str) -> Path:
    """Ruta del .pl de un caso, resuelta dentro de prolog/casos.

    La comprobacion final evita que un identificador manipulado escriba fuera
    del directorio de casos.
    """
    ruta = (DIR_CASOS / f"{caso}.pl").resolve()
    if ruta.parent != DIR_CASOS.resolve():
        raise AccionInvalida("Ruta de caso no permitida.")
    return ruta


# ---------------------------------------------------------------------------
# Consulta
# ---------------------------------------------------------------------------

def listar_casos() -> list[dict[str, Any]]:
    """Casos cargados, con sus conteos y si cumplen los minimos del enunciado."""
    engine = obtener_engine()
    casos = engine.consultar("caso(Id, Titulo, Descripcion, Dificultad)")
    estados = db.estado_de_casos()

    for caso in casos:
        identificador = caso["Id"]
        conteo = engine.uno(
            f"conteo_caso({identificador}, conteo(S, E, L, D, R))"
        ) or {}
        caso.update(
            {
                "sospechosos": conteo.get("S", "0"),
                "evidencias": conteo.get("E", "0"),
                "lugares": conteo.get("L", "0"),
                "declaraciones": conteo.get("D", "0"),
                "reglas": conteo.get("R", "0"),
                "cumple": engine.es_cierto(f"cumple_minimos({identificador})"),
                "estado": estados.get(identificador, "sin_iniciar"),
                "archivo": _localizar_archivo(identificador),
            }
        )
    return casos


def _localizar_archivo(caso: str) -> str:
    """Busca el .pl que define un caso; los nombres de archivo no son el id."""
    for ruta in sorted(DIR_CASOS.glob("*.pl")):
        if re.search(rf"^caso\(\s*{re.escape(caso)}\s*,", ruta.read_text(encoding="utf-8"), re.M):
            return ruta.name
    return ""


def leer_fuente(archivo: str) -> str:
    """Devuelve el codigo Prolog de un archivo de caso."""
    ruta = (DIR_CASOS / Path(archivo).name).resolve()
    if ruta.parent != DIR_CASOS.resolve() or not ruta.exists():
        raise AccionInvalida(f"No existe el archivo de caso {archivo}.")
    return ruta.read_text(encoding="utf-8")


def listar_archivos() -> list[str]:
    return sorted(ruta.name for ruta in DIR_CASOS.glob("*.pl"))


# ---------------------------------------------------------------------------
# Modificacion
# ---------------------------------------------------------------------------

def _respaldar(ruta: Path) -> None:
    """Guarda una copia con marca de tiempo antes de sobrescribir."""
    if not ruta.exists():
        return
    DIR_RESPALDOS.mkdir(parents=True, exist_ok=True)
    marca = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    shutil.copy2(ruta, DIR_RESPALDOS / f"{ruta.stem}-{marca}.pl")


def guardar_fuente(archivo: str, contenido: str) -> dict[str, Any]:
    """Sobrescribe un archivo de caso y recarga el motor.

    Antes de aceptar el cambio se valida sintacticamente cargando el archivo en
    un interprete aparte. Un caso con un error de sintaxis dejaria la base de
    conocimiento entera sin cargar, asi que nunca se escribe sin validar.
    """
    ruta = (DIR_CASOS / Path(archivo).name).resolve()
    if ruta.parent != DIR_CASOS.resolve():
        raise AccionInvalida("Ruta de caso no permitida.")

    error = _validar_sintaxis(contenido)
    if error:
        raise AccionInvalida(f"El caso tiene errores de sintaxis Prolog: {error}")

    _respaldar(ruta)
    ruta.write_text(contenido, encoding="utf-8")
    reiniciar_engine()

    engine = obtener_engine()
    return {
        "archivo": ruta.name,
        "casos": engine.valores("caso(Id, _, _, _)", "Id"),
    }


def _validar_sintaxis(contenido: str) -> str | None:
    """Compila el contenido en un proceso swipl aparte. Devuelve el error o None."""
    import subprocess
    import tempfile

    with tempfile.TemporaryDirectory() as carpeta:
        temporal = Path(carpeta) / "caso_en_validacion.pl"
        temporal.write_text(contenido, encoding="utf-8")
        proceso = subprocess.run(
            [
                config.BINARIO_SWIPL, "-q",
                "-g", "consult('caso_en_validacion.pl')",
                "-g", "halt",
                "-t", "halt(1)",
            ],
            capture_output=True, text=True, cwd=carpeta, check=False,
            timeout=config.TIMEOUT_CONSULTA,
        )

    if proceso.returncode != 0 or "ERROR" in proceso.stderr:
        return (proceso.stderr.strip() or "error desconocido")[:400]
    return None


def crear_caso(caso: str, titulo: str, descripcion: str, dificultad: str) -> dict[str, Any]:
    """Crea el esqueleto de un caso nuevo a partir de la plantilla.

    Genera un archivo con la estructura completa comentada, listo para que el
    equipo lo rellene. No se registra en el cargador hasta que cumpla los
    minimos: un caso incompleto romperia la validacion del enunciado.
    """
    caso = _validar_id(caso)
    if dificultad not in {"facil", "medio", "dificil"}:
        raise AccionInvalida("La dificultad debe ser facil, medio o dificil.")

    ruta = _archivo_de(caso)
    if ruta.exists():
        raise AccionInvalida(f"Ya existe un archivo para el caso {caso}.")

    ruta.write_text(_plantilla(caso, titulo, descripcion, dificultad), encoding="utf-8")
    return {"archivo": ruta.name, "ruta": str(ruta)}


def eliminar_caso(archivo: str) -> None:
    """Elimina un archivo de caso, dejando respaldo."""
    ruta = (DIR_CASOS / Path(archivo).name).resolve()
    if ruta.parent != DIR_CASOS.resolve() or not ruta.exists():
        raise AccionInvalida(f"No existe el archivo {archivo}.")
    _respaldar(ruta)
    ruta.unlink()
    reiniciar_engine()


def recargar() -> dict[str, Any]:
    """Fuerza la recarga de la base de conocimiento sin reiniciar el servidor."""
    reiniciar_engine()
    engine = obtener_engine()
    return {"backend": engine.nombre, "casos": engine.valores("caso(Id, _, _, _)", "Id")}


def _plantilla(caso: str, titulo: str, descripcion: str, dificultad: str) -> str:
    """Esqueleto de un caso nuevo con los minimos del enunciado señalados."""
    titulo_seguro = titulo.replace("'", "''")
    descripcion_segura = descripcion.replace("'", "''")
    return f"""% =============================================================================
% CASO: {titulo}
% Generado por el modulo administrativo de Logic Detective.
% -----------------------------------------------------------------------------
% MINIMOS OBLIGATORIOS: 4 sospechosos, 10 evidencias, 5 lugares,
%                       5 declaraciones y 10 reglas propias del caso.
% Verifica con: ?- cumple_minimos({caso}).
% =============================================================================

caso({caso}, '{titulo_seguro}', '{descripcion_segura}', {dificultad}).

incidente({caso}, 'Describe aqui el incidente', lugar_principal, 2000).
ventana_incidente({caso}, 1930, 2030).
victima({caso}, la_victima).

% --- PERSONAS: 4 sospechosos como minimo ------------------------------------
persona({caso}, la_victima,  'Nombre de la victima', victima).
persona({caso}, sospechoso1, 'Sospechoso 1', sospechoso).
persona({caso}, sospechoso2, 'Sospechoso 2', sospechoso).
persona({caso}, sospechoso3, 'Sospechoso 3', sospechoso).
persona({caso}, sospechoso4, 'Sospechoso 4', sospechoso).
persona({caso}, testigo1,    'Testigo 1', testigo).

% --- LUGARES: 5 como minimo -------------------------------------------------
lugar({caso}, lugar_principal, 'Lugar principal', 'Descripcion.').
lugar({caso}, lugar2, 'Lugar 2', 'Descripcion.').
lugar({caso}, lugar3, 'Lugar 3', 'Descripcion.').
lugar({caso}, lugar4, 'Lugar 4', 'Descripcion.').
lugar({caso}, lugar5, 'Lugar 5', 'Descripcion.').

conexion({caso}, lugar_principal, lugar2).
conexion({caso}, lugar2, lugar3).
conexion({caso}, lugar3, lugar4).
conexion({caso}, lugar4, lugar5).

% --- ACCESOS ----------------------------------------------------------------
% acceso({caso}, Persona, Lugar, TipoDeAcceso).

% --- LINEA TEMPORAL ---------------------------------------------------------
% estuvo_en({caso}, Persona, Lugar, HHMM).
% evento({caso}, Id, HHMM, Lugar, 'Descripcion').

% --- EVIDENCIAS: 10 como minimo ---------------------------------------------
% evidencia({caso}, Id, Tipo, 'Descripcion', Lugar, HHMM).
% vincula({caso}, Evidencia, Persona).
% evidencia_lugar_persona({caso}, Evidencia, Persona, Lugar).

% --- DECLARACIONES: 5 como minimo -------------------------------------------
% declaracion({caso}, Id, Autor, 'Texto').
% afirma({caso}, Id, estuvo(Persona, Lugar, HHMM)).
% afirma({caso}, Id, no_estuvo(Persona, Lugar, HHMM)).
% afirma({caso}, Id, vio(Observador, Observado, Lugar, HHMM)).
% afirma({caso}, Id, desconoce(Persona, Objeto)).

% --- COARTADAS, MOTIVOS Y MEDIOS --------------------------------------------
% coartada({caso}, Persona, Lugar, HHMM, Testigo).
% motivo({caso}, Persona, Tipo, 'Descripcion').
% requiere_medio({caso}, Medio).
% medio({caso}, Persona, Medio).
% relacion({caso}, Persona1, Persona2, Tipo).

% --- REGLAS PROPIAS DEL CASO: 10 como minimo --------------------------------
% regla_caso({caso}, r01, 'Nombre', 'Que deduce esta regla').
% nombre_de_la_regla({caso}, Persona) :- ...
"""
