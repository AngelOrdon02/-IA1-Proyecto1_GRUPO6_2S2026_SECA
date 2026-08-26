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

import json
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
DIR_EJEMPLOS = config.RAIZ / "datos" / "ejemplos"
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


def listar_ejemplos() -> list[dict[str, Any]]:
    """Casos de ejemplo incluidos en el repositorio, en JSON y en CSV.

    El panel los ofrece para probar el generador sin tener que escribir un caso
    entero a mano; cada uno lleva su `formato` para que la interfaz muestre los
    que corresponden a la pestana abierta. Ver datos/ejemplos/README.md.
    """
    ejemplos = []
    for ruta in sorted(DIR_EJEMPLOS.glob("*.json")) + sorted(DIR_EJEMPLOS.glob("*.csv")):
        ficha = _ficha_ejemplo(ruta)
        if ficha:
            ejemplos.append(ficha)
    return ejemplos


def _ficha_ejemplo(ruta: Path) -> dict[str, Any] | None:
    """Identificador, titulo y descripcion de un ejemplo, sea JSON o CSV.

    Devuelve None si el archivo no se puede interpretar: un ejemplo ilegible no
    debe tumbar el listado entero del panel.
    """
    try:
        contenido = ruta.read_text(encoding="utf-8")
    except OSError:
        return None

    if ruta.suffix == ".json":
        try:
            datos = json.loads(contenido)
        except json.JSONDecodeError:
            return None
        identificador = datos.get("id", "")
        titulo = datos.get("titulo", ruta.stem)
        descripcion = datos.get("descripcion", "")
    else:
        # En CSV los metadatos viven en la fila `caso`. Se busca con un lector
        # suelto y no con _filas_csv: ese valida el archivo entero y fallaria en
        # un ejemplo con errores a proposito, que tambien queremos listar.
        import csv as _csv
        import io as _io

        identificador = titulo = descripcion = ""
        for celdas in _csv.reader(_io.StringIO(contenido)):
            if len(celdas) >= 4 and celdas[0].strip().lower() == "caso":
                identificador = celdas[1].strip()
                titulo = celdas[2].strip()
                descripcion = celdas[3].strip()
                break
        if not titulo:
            titulo = ruta.stem

    return {
        "archivo": ruta.name,
        "formato": "json" if ruta.suffix == ".json" else "csv",
        "id": identificador,
        "titulo": titulo,
        "descripcion": descripcion,
    }


def leer_ejemplo(archivo: str) -> str:
    """Devuelve el contenido de un ejemplo, tal cual esta en disco."""
    ruta = (DIR_EJEMPLOS / Path(archivo).name).resolve()
    if ruta.parent != DIR_EJEMPLOS.resolve() or not ruta.exists():
        raise AccionInvalida(f"No existe el ejemplo {archivo}.")
    if ruta.suffix not in {".json", ".csv"}:
        raise AccionInvalida(f"El ejemplo {archivo} no es un JSON ni un CSV.")
    return ruta.read_text(encoding="utf-8")


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


def _registrar_en_cargador(ruta: Path) -> None:
    """Anade el ensure_loaded del caso a prolog/logic_detective.pl.

    Sin esta directiva el archivo existe en disco pero el motor nunca lo
    consulta: el caso no aparece en el panel ni se puede investigar, y no hay
    ningun error que lo delate. Se respalda el cargador antes de tocarlo.
    """
    carga = ARCHIVO_CARGA.read_text(encoding="utf-8")
    directiva = f":- ensure_loaded('casos/{ruta.stem}')."
    if directiva in carga:
        return

    DIR_RESPALDOS.mkdir(parents=True, exist_ok=True)
    (DIR_RESPALDOS / "logic_detective-previo.pl").write_text(carga, encoding="utf-8")

    marcador = "% --- Casos de investigacion -"
    indice = carga.find(marcador)
    fin_bloque = carga.find("\n\n", indice) if indice != -1 else -1
    if fin_bloque == -1:
        carga = carga.rstrip() + f"\n{directiva}\n"
    else:
        carga = carga[:fin_bloque] + f"\n{directiva}" + carga[fin_bloque:]
    ARCHIVO_CARGA.write_text(carga, encoding="utf-8")


def _resumen_de(caso: str) -> dict[str, Any]:
    """Conteo de elementos y cumplimiento de minimos de un caso ya cargado."""
    engine = obtener_engine()
    return {
        "caso": caso,
        "conteo": engine.uno(f"conteo_caso({caso}, conteo(S, E, L, D, R))") or {},
        "cumple_minimos": engine.es_cierto(f"cumple_minimos({caso})"),
        "casos": engine.valores("caso(Id, _, _, _)", "Id"),
    }


def crear_caso(caso: str, titulo: str, descripcion: str, dificultad: str) -> dict[str, Any]:
    """Crea el esqueleto de un caso nuevo a partir de la plantilla.

    Genera un archivo con la estructura completa comentada, lo registra en el
    cargador y recarga el motor, para que el caso aparezca de inmediato en el
    panel — incompleto y marcado como tal — y se pueda terminar de rellenar en
    el editor. Dejarlo sin registrar, como se hacia antes, lo volvia invisible:
    la creacion parecia no tener efecto y no habia error que lo explicara.
    """
    caso = _validar_id(caso)
    if not (titulo or "").strip():
        raise AccionInvalida("El titulo del caso no puede estar vacio.")
    if dificultad not in {"facil", "medio", "dificil"}:
        raise AccionInvalida("La dificultad debe ser facil, medio o dificil.")

    ruta = _archivo_de(caso)
    if ruta.exists():
        raise AccionInvalida(f"Ya existe un archivo para el caso {caso}.")

    engine = obtener_engine()
    if caso in engine.valores("caso(Id, _, _, _)", "Id"):
        raise AccionInvalida(f"El caso {caso} ya esta cargado en el motor.")

    contenido = _plantilla(caso, titulo, descripcion, dificultad)
    error = _validar_sintaxis(contenido)
    if error:
        raise AccionInvalida(f"La plantilla generada no compila: {error}")

    ruta.write_text(contenido, encoding="utf-8")
    _registrar_en_cargador(ruta)
    reiniciar_engine()

    return {"archivo": ruta.name, "ruta": str(ruta), **_resumen_de(caso)}


def _casos_declarados() -> list[str]:
    """Identificadores de los casos que el cargador sigue declarando.

    Se leen del propio logic_detective.pl y no del motor: es la fuente de
    verdad de que casos deben quedar cargados tras una edicion o un borrado.
    """
    carga = ARCHIVO_CARGA.read_text(encoding="utf-8")
    archivos = re.findall(r"ensure_loaded\('casos/([^']+)'\)", carga)

    identificadores: list[str] = []
    for nombre in archivos:
        ruta = DIR_CASOS / f"{nombre}.pl"
        if not ruta.exists():
            continue
        encontrado = re.search(
            r"^caso\(\s*([a-z][a-zA-Z0-9_]*)\s*,", ruta.read_text(encoding="utf-8"), re.M
        )
        if encontrado:
            identificadores.append(encontrado.group(1))
    return identificadores


def eliminar_caso(archivo: str) -> None:
    """Elimina un archivo de caso, dejando respaldo."""
    ruta = (DIR_CASOS / Path(archivo).name).resolve()
    if ruta.parent != DIR_CASOS.resolve() or not ruta.exists():
        raise AccionInvalida(f"No existe el archivo {archivo}.")
    _respaldar(ruta)
    ruta.unlink()

    # Si el cargador referencia el archivo eliminado hay que quitar la
    # directiva: un ensure_loaded hacia un archivo inexistente dejaria la base
    # de conocimiento entera sin cargar.
    directiva = f":- ensure_loaded('casos/{ruta.stem}')."
    carga = ARCHIVO_CARGA.read_text(encoding="utf-8")
    if directiva in carga:
        carga = "\n".join(
            linea for linea in carga.splitlines() if linea.strip() != directiva
        ) + "\n"
        ARCHIVO_CARGA.write_text(carga, encoding="utf-8")

    # Los casos vigentes son los que siguen declarados en el cargador; el
    # eliminado debe desaparecer tambien del interprete embebido.
    reiniciar_engine(casos_vigentes=_casos_declarados())


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


# ---------------------------------------------------------------------------
# Opcional 9: motor para generar casos nuevos a partir de JSON
# ---------------------------------------------------------------------------
#
# El JSON describe el caso con listas planas (personas, lugares, evidencias,
# declaraciones...) y este modulo lo traduce a hechos Prolog con el esquema de
# prolog/core/esquema.pl. El archivo generado pasa por la misma validacion
# sintactica que el editor manual antes de escribirse, y el motor se recarga
# para que el caso quede disponible de inmediato.

def _atomo_admin(valor: Any, campo: str) -> str:
    """Valida un identificador del JSON como atomo Prolog en minuscula."""
    if not isinstance(valor, str) or not re.match(r"^[a-z][a-zA-Z0-9_]*$", valor):
        raise AccionInvalida(
            f"El campo {campo} debe ser un identificador Prolog valido "
            f"(minuscula inicial, letras/numeros/guion bajo): {valor!r}"
        )
    return valor


def _texto_admin(valor: Any, campo: str) -> str:
    """Escapa un texto libre para incrustarlo como atomo entre comillas."""
    if not isinstance(valor, str) or not valor.strip():
        raise AccionInvalida(f"El campo {campo} debe ser un texto no vacio.")
    return valor.replace("\\", "\\\\").replace("'", "''")


def _hora_admin(valor: Any, campo: str) -> int:
    """Valida una hora en formato entero HHMM (ej. 2130 = 21:30)."""
    if not isinstance(valor, int) or not (0 <= valor <= 2359) or valor % 100 >= 60:
        raise AccionInvalida(
            f"El campo {campo} debe ser una hora entera HHMM (0-2359): {valor!r}"
        )
    return valor


def _afirmacion_prolog(caso: str, decl: str, af: dict[str, Any]) -> str:
    """Traduce una afirmacion estructurada del JSON a un hecho afirma/3."""
    tipo = af.get("tipo")
    p = lambda campo: _atomo_admin(af.get(campo), f"declaraciones[].afirmaciones[].{campo}")
    h = lambda campo: _hora_admin(af.get(campo), f"declaraciones[].afirmaciones[].{campo}")
    if tipo == "estuvo":
        termino = f"estuvo({p('persona')}, {p('lugar')}, {h('hora')})"
    elif tipo == "no_estuvo":
        termino = f"no_estuvo({p('persona')}, {p('lugar')}, {h('hora')})"
    elif tipo == "vio":
        termino = f"vio({p('observador')}, {p('observado')}, {p('lugar')}, {h('hora')})"
    elif tipo == "poseia":
        termino = f"poseia({p('persona')}, {p('objeto')})"
    elif tipo == "desconoce":
        termino = f"desconoce({p('persona')}, {p('objeto')})"
    else:
        raise AccionInvalida(
            f"Tipo de afirmacion no soportado: {tipo!r}. "
            "Usa estuvo, no_estuvo, vio, poseia o desconoce."
        )
    return f"afirma({caso}, {decl}, {termino})."


def generar_caso_desde_json(datos: dict[str, Any]) -> dict[str, Any]:
    """Genera, valida y registra un archivo de caso a partir de un JSON.

    Devuelve el nombre del archivo, el conteo de elementos y si el caso cumple
    los minimos del enunciado. El caso queda cargado en el motor.
    """
    if not isinstance(datos, dict):
        raise AccionInvalida("El cuerpo debe ser un objeto JSON con el caso.")

    caso = _validar_id(str(datos.get("id", "")))
    titulo = _texto_admin(datos.get("titulo"), "titulo")
    descripcion = _texto_admin(datos.get("descripcion"), "descripcion")
    dificultad = datos.get("dificultad", "medio")
    if dificultad not in {"facil", "medio", "dificil"}:
        raise AccionInvalida("La dificultad debe ser facil, medio o dificil.")

    ruta = _archivo_de(caso)
    if ruta.exists():
        raise AccionInvalida(f"Ya existe un archivo para el caso {caso}.")

    engine = obtener_engine()
    if caso in engine.valores("caso(Id, _, _, _)", "Id"):
        raise AccionInvalida(f"El caso {caso} ya esta cargado en el motor.")

    lineas: list[str] = [
        "% " + "=" * 77,
        f"% CASO: {datos.get('titulo')}",
        "% Generado automaticamente desde JSON por el modulo administrativo.",
        "% " + "=" * 77,
        "",
        f"caso({caso}, '{titulo}', '{descripcion}', {dificultad}).",
        "",
    ]

    incidente = datos.get("incidente") or {}
    lineas.append(
        f"incidente({caso}, '{_texto_admin(incidente.get('descripcion'), 'incidente.descripcion')}', "
        f"{_atomo_admin(incidente.get('lugar'), 'incidente.lugar')}, "
        f"{_hora_admin(incidente.get('hora'), 'incidente.hora')})."
    )
    ventana = datos.get("ventana") or []
    if not (isinstance(ventana, list) and len(ventana) == 2):
        raise AccionInvalida("El campo ventana debe ser una lista [inicio, fin] en HHMM.")
    lineas.append(
        f"ventana_incidente({caso}, {_hora_admin(ventana[0], 'ventana[0]')}, "
        f"{_hora_admin(ventana[1], 'ventana[1]')})."
    )
    lineas.append(f"victima({caso}, {_atomo_admin(datos.get('victima'), 'victima')}).")
    if datos.get("solucion"):
        lineas.append(f"solucion({caso}, {_atomo_admin(datos.get('solucion'), 'solucion')}).")
    lineas.append("")

    for p in datos.get("personas") or []:
        rol = p.get("rol")
        if rol not in {"sospechoso", "testigo", "victima"}:
            raise AccionInvalida(f"Rol no valido en personas[]: {rol!r}")
        lineas.append(
            f"persona({caso}, {_atomo_admin(p.get('id'), 'personas[].id')}, "
            f"'{_texto_admin(p.get('nombre'), 'personas[].nombre')}', {rol})."
        )
    lineas.append("")

    for l in datos.get("lugares") or []:
        lineas.append(
            f"lugar({caso}, {_atomo_admin(l.get('id'), 'lugares[].id')}, "
            f"'{_texto_admin(l.get('nombre'), 'lugares[].nombre')}', "
            f"'{_texto_admin(l.get('descripcion'), 'lugares[].descripcion')}')."
        )
    for par in datos.get("conexiones") or []:
        if not (isinstance(par, list) and len(par) == 2):
            raise AccionInvalida("Cada conexion debe ser una lista [lugarA, lugarB].")
        lineas.append(
            f"conexion({caso}, {_atomo_admin(par[0], 'conexiones[][0]')}, "
            f"{_atomo_admin(par[1], 'conexiones[][1]')})."
        )
    lineas.append("")

    for a in datos.get("accesos") or []:
        lineas.append(
            f"acceso({caso}, {_atomo_admin(a.get('persona'), 'accesos[].persona')}, "
            f"{_atomo_admin(a.get('lugar'), 'accesos[].lugar')}, "
            f"{_atomo_admin(a.get('tipo'), 'accesos[].tipo')})."
        )
    for u in datos.get("ubicaciones") or []:
        lineas.append(
            f"estuvo_en({caso}, {_atomo_admin(u.get('persona'), 'ubicaciones[].persona')}, "
            f"{_atomo_admin(u.get('lugar'), 'ubicaciones[].lugar')}, "
            f"{_hora_admin(u.get('hora'), 'ubicaciones[].hora')})."
        )
    for ev in datos.get("eventos") or []:
        lineas.append(
            f"evento({caso}, {_atomo_admin(ev.get('id'), 'eventos[].id')}, "
            f"{_hora_admin(ev.get('hora'), 'eventos[].hora')}, "
            f"{_atomo_admin(ev.get('lugar'), 'eventos[].lugar')}, "
            f"'{_texto_admin(ev.get('descripcion'), 'eventos[].descripcion')}')."
        )
    lineas.append("")

    for e in datos.get("evidencias") or []:
        eid = _atomo_admin(e.get("id"), "evidencias[].id")
        lineas.append(
            f"evidencia({caso}, {eid}, {_atomo_admin(e.get('tipo'), 'evidencias[].tipo')}, "
            f"'{_texto_admin(e.get('descripcion'), 'evidencias[].descripcion')}', "
            f"{_atomo_admin(e.get('lugar'), 'evidencias[].lugar')}, "
            f"{_hora_admin(e.get('hora'), 'evidencias[].hora')})."
        )
        for persona in e.get("vincula") or []:
            lineas.append(
                f"vincula({caso}, {eid}, {_atomo_admin(persona, 'evidencias[].vincula[]')})."
            )
        situa = e.get("situa")
        if situa:
            lineas.append(
                f"evidencia_lugar_persona({caso}, {eid}, "
                f"{_atomo_admin(situa.get('persona'), 'evidencias[].situa.persona')}, "
                f"{_atomo_admin(situa.get('lugar'), 'evidencias[].situa.lugar')})."
            )
    lineas.append("")

    for d in datos.get("declaraciones") or []:
        did = _atomo_admin(d.get("id"), "declaraciones[].id")
        lineas.append(
            f"declaracion({caso}, {did}, "
            f"{_atomo_admin(d.get('autor'), 'declaraciones[].autor')}, "
            f"'{_texto_admin(d.get('texto'), 'declaraciones[].texto')}')."
        )
        for af in d.get("afirmaciones") or []:
            lineas.append(_afirmacion_prolog(caso, did, af))
    lineas.append("")

    for c in datos.get("coartadas") or []:
        lineas.append(
            f"coartada({caso}, {_atomo_admin(c.get('persona'), 'coartadas[].persona')}, "
            f"{_atomo_admin(c.get('lugar'), 'coartadas[].lugar')}, "
            f"{_hora_admin(c.get('hora'), 'coartadas[].hora')}, "
            f"{_atomo_admin(c.get('testigo'), 'coartadas[].testigo')})."
        )
    for m in datos.get("motivos") or []:
        lineas.append(
            f"motivo({caso}, {_atomo_admin(m.get('persona'), 'motivos[].persona')}, "
            f"{_atomo_admin(m.get('tipo'), 'motivos[].tipo')}, "
            f"'{_texto_admin(m.get('descripcion'), 'motivos[].descripcion')}')."
        )
    for medio_req in datos.get("medios_requeridos") or []:
        lineas.append(
            f"requiere_medio({caso}, {_atomo_admin(medio_req, 'medios_requeridos[]')})."
        )
    for m in datos.get("medios") or []:
        lineas.append(
            f"medio({caso}, {_atomo_admin(m.get('persona'), 'medios[].persona')}, "
            f"{_atomo_admin(m.get('medio'), 'medios[].medio')})."
        )
    for r in datos.get("relaciones") or []:
        lineas.append(
            f"relacion({caso}, {_atomo_admin(r.get('a'), 'relaciones[].a')}, "
            f"{_atomo_admin(r.get('b'), 'relaciones[].b')}, "
            f"{_atomo_admin(r.get('tipo'), 'relaciones[].tipo')})."
        )
    lineas.append("")

    for r in datos.get("reglas") or []:
        lineas.append(
            f"regla_caso({caso}, {_atomo_admin(r.get('id'), 'reglas[].id')}, "
            f"'{_texto_admin(r.get('nombre'), 'reglas[].nombre')}', "
            f"'{_texto_admin(r.get('descripcion'), 'reglas[].descripcion')}')."
        )
    lineas.append("")

    contenido = "\n".join(lineas)
    error = _validar_sintaxis(contenido)
    if error:
        raise AccionInvalida(f"El caso generado tiene errores de sintaxis: {error}")

    ruta.write_text(contenido, encoding="utf-8")

    # Registrar el caso en el cargador para que el motor lo consulte.
    _registrar_en_cargador(ruta)
    reiniciar_engine()

    return {"archivo": ruta.name, **_resumen_de(caso)}


# =============================================================================
# OPCIONAL 9 (segunda mitad) — Importador CSV
# -----------------------------------------------------------------------------
# El enunciado pide un motor para generar casos "a partir de archivos JSON o
# CSV". El generador JSON ya existe y esta validado; este importador NO duplica
# esa logica: traduce el CSV a la misma estructura de diccionario y delega en
# generar_caso_desde_json/1.
#
# Asi hay un unico camino de generacion, una unica validacion sintactica y una
# unica comprobacion de minimos. El CSV es solo otro formato de entrada.
#
# FORMATO
# -------
# Un caso completo necesita muchas tablas distintas (personas, lugares,
# evidencias...). En vez de exigir un archivo por tabla, se usa un unico CSV
# donde la PRIMERA COLUMNA (`tipo`) discrimina la clase de fila y el resto de
# columnas se interpretan segun ese tipo:
#
#   tipo,c1,c2,c3,c4,c5
#   caso,mi_caso,El titulo,La descripcion,facil
#   incidente,Robo del sello,despacho,2100
#   ventana,2030,2130
#   victima,victor
#   solucion,ana
#   persona,ana,Ana Ruiz,sospechoso
#   lugar,despacho,Despacho,Oficina del notario
#   conexion,entrada,pasillo
#   acceso,ana,despacho,llave
#   estuvo,ana,despacho,2100
#   evento,ev1,2100,despacho,Se apaga la luz
#   evidencia,e01,huella,Huella en el marco,despacho,2100
#   vincula,e01,ana
#   situa,e01,ana,despacho
#   declaracion,d1,ana,No estuve alli
#   afirma,d1,no_estuvo,ana,despacho,2100
#   coartada,ana,pasillo,2100,toni
#   motivo,ana,financiero,Deudas vencidas
#   requiere,llave
#   medio,ana,llave
#   relacion,ana,victor,deuda
#   regla,r01,Nombre de la regla,Que deduce
#
# La cabecera es opcional: si la primera fila empieza por "tipo" se descarta.
# Las filas vacias y las que empiezan por "#" se ignoran.
# =============================================================================

# Numero de columnas (sin contar `tipo`) que exige cada clase de fila.
_COLUMNAS_CSV = {
    "caso": 4, "incidente": 3, "ventana": 2, "victima": 1, "solucion": 1,
    "persona": 3, "lugar": 3, "conexion": 2, "acceso": 3, "estuvo": 3,
    "evento": 4, "evidencia": 5, "vincula": 2, "situa": 3,
    "declaracion": 3, "afirma": 2, "coartada": 4, "motivo": 3,
    "requiere": 1, "medio": 2, "relacion": 3, "regla": 3,
}

# Columnas que necesita cada tipo de afirmacion, despues de `afirma,<decl>,<tipo>`.
_CAMPOS_AFIRMACION = {
    "estuvo":     ["persona", "lugar", "hora"],
    "no_estuvo":  ["persona", "lugar", "hora"],
    "vio":        ["observador", "observado", "lugar", "hora"],
    "poseia":     ["persona", "objeto"],
    "desconoce":  ["persona", "objeto"],
}


def _hora_csv(valor: str, campo: str) -> int:
    """Convierte una hora del CSV a entero HHMM.

    Todo lo que sale de un CSV es texto, pero el generador exige enteros para
    las horas. La conversion se hace aqui, en la capa especifica del formato,
    para no relajar la validacion del generador JSON.
    """
    try:
        return int(str(valor).strip())
    except (TypeError, ValueError):
        raise AccionInvalida(
            f"El campo {campo} debe ser una hora en formato HHMM (por ejemplo 2100), "
            f"y llego {valor!r}."
        ) from None


def _filas_csv(contenido: str) -> list[tuple[int, str, list[str]]]:
    """Parsea el CSV y devuelve (numero_de_linea, tipo, columnas_restantes).

    Se apoya en el modulo `csv` de la libreria estandar en vez de partir por
    comas a mano: las descripciones llevan comas y van entrecomilladas.
    """
    import csv
    import io

    filas: list[tuple[int, str, list[str]]] = []
    lector = csv.reader(io.StringIO(contenido))

    for numero, columnas in enumerate(lector, start=1):
        if not columnas:
            continue
        celdas = [c.strip() for c in columnas]
        if not any(celdas) or celdas[0].startswith("#"):
            continue
        tipo = celdas[0].lower()
        # Cabecera opcional. Se compara contra la primera fila UTIL, no contra
        # la linea 1: un archivo de ejemplo suele abrir con comentarios y la
        # cabecera queda mas abajo.
        if not filas and tipo == "tipo":
            continue
        if tipo not in _COLUMNAS_CSV:
            raise AccionInvalida(
                f"Linea {numero}: tipo de fila desconocido {celdas[0]!r}. "
                f"Validos: {', '.join(sorted(_COLUMNAS_CSV))}."
            )
        resto = celdas[1:]
        minimo = _COLUMNAS_CSV[tipo]
        if len([c for c in resto[:minimo] if c]) < minimo:
            raise AccionInvalida(
                f"Linea {numero}: la fila '{tipo}' necesita {minimo} columna(s) "
                f"despues del tipo y llegaron {len([c for c in resto if c])}."
            )
        filas.append((numero, tipo, resto))

    if not filas:
        raise AccionInvalida("El CSV no contiene ninguna fila util.")
    return filas


def csv_a_estructura(contenido: str) -> dict[str, Any]:
    """Traduce el CSV de un caso a la estructura que espera el generador JSON.

    Se expone por separado de la generacion para poder probar la traduccion sin
    escribir archivos ni tocar el motor.
    """
    datos: dict[str, Any] = {
        "personas": [], "lugares": [], "conexiones": [], "accesos": [],
        "ubicaciones": [], "eventos": [], "evidencias": [], "declaraciones": [],
        "coartadas": [], "motivos": [], "medios_requeridos": [], "medios": [],
        "relaciones": [], "reglas": [],
    }
    # Indices para poder colgar vincula/situa de su evidencia y las
    # afirmaciones de su declaracion, vengan en el orden que vengan.
    evidencias: dict[str, dict[str, Any]] = {}
    declaraciones: dict[str, dict[str, Any]] = {}

    for numero, tipo, c in _filas_csv(contenido):
        if tipo == "caso":
            datos.update({
                "id": c[0], "titulo": c[1], "descripcion": c[2], "dificultad": c[3],
            })
        elif tipo == "incidente":
            datos["incidente"] = {
                "descripcion": c[0], "lugar": c[1],
                "hora": _hora_csv(c[2], "incidente.hora"),
            }
        elif tipo == "ventana":
            datos["ventana"] = [
                _hora_csv(c[0], "ventana[0]"), _hora_csv(c[1], "ventana[1]"),
            ]
        elif tipo == "victima":
            datos["victima"] = c[0]
        elif tipo == "solucion":
            datos["solucion"] = c[0]
        elif tipo == "persona":
            datos["personas"].append({"id": c[0], "nombre": c[1], "rol": c[2]})
        elif tipo == "lugar":
            datos["lugares"].append({"id": c[0], "nombre": c[1], "descripcion": c[2]})
        elif tipo == "conexion":
            datos["conexiones"].append([c[0], c[1]])
        elif tipo == "acceso":
            datos["accesos"].append({"persona": c[0], "lugar": c[1], "tipo": c[2]})
        elif tipo == "estuvo":
            datos["ubicaciones"].append(
                {"persona": c[0], "lugar": c[1], "hora": _hora_csv(c[2], "estuvo.hora")}
            )
        elif tipo == "evento":
            datos["eventos"].append(
                {
                    "id": c[0], "hora": _hora_csv(c[1], "evento.hora"),
                    "lugar": c[2], "descripcion": c[3],
                }
            )
        elif tipo == "evidencia":
            ficha = {
                "id": c[0], "tipo": c[1], "descripcion": c[2],
                "lugar": c[3], "hora": _hora_csv(c[4], "evidencia.hora"),
                "vincula": [],
            }
            evidencias[c[0]] = ficha
            datos["evidencias"].append(ficha)
        elif tipo == "vincula":
            if c[0] not in evidencias:
                raise AccionInvalida(
                    f"Linea {numero}: 'vincula' referencia la evidencia {c[0]!r}, "
                    "que no se declaro antes con una fila 'evidencia'."
                )
            evidencias[c[0]]["vincula"].append(c[1])
        elif tipo == "situa":
            if c[0] not in evidencias:
                raise AccionInvalida(
                    f"Linea {numero}: 'situa' referencia la evidencia {c[0]!r}, "
                    "que no se declaro antes con una fila 'evidencia'."
                )
            evidencias[c[0]]["situa"] = {"persona": c[1], "lugar": c[2]}
        elif tipo == "declaracion":
            ficha = {"id": c[0], "autor": c[1], "texto": c[2], "afirmaciones": []}
            declaraciones[c[0]] = ficha
            datos["declaraciones"].append(ficha)
        elif tipo == "afirma":
            if c[0] not in declaraciones:
                raise AccionInvalida(
                    f"Linea {numero}: 'afirma' referencia la declaracion {c[0]!r}, "
                    "que no se declaro antes con una fila 'declaracion'."
                )
            clase = c[1]
            campos = _CAMPOS_AFIRMACION.get(clase)
            if campos is None:
                raise AccionInvalida(
                    f"Linea {numero}: afirmacion no soportada {clase!r}. "
                    f"Validas: {', '.join(_CAMPOS_AFIRMACION)}."
                )
            valores = [v for v in c[2:] if v]
            if len(valores) < len(campos):
                raise AccionInvalida(
                    f"Linea {numero}: la afirmacion '{clase}' necesita "
                    f"{len(campos)} valor(es) ({', '.join(campos)})."
                )
            afirmacion: dict[str, Any] = {"tipo": clase}
            for campo, valor in zip(campos, valores):
                afirmacion[campo] = (
                    _hora_csv(valor, f"afirma.{campo}") if campo == "hora" else valor
                )
            declaraciones[c[0]]["afirmaciones"].append(afirmacion)
        elif tipo == "coartada":
            datos["coartadas"].append(
                {
                    "persona": c[0], "lugar": c[1],
                    "hora": _hora_csv(c[2], "coartada.hora"), "testigo": c[3],
                }
            )
        elif tipo == "motivo":
            datos["motivos"].append(
                {"persona": c[0], "tipo": c[1], "descripcion": c[2]}
            )
        elif tipo == "requiere":
            datos["medios_requeridos"].append(c[0])
        elif tipo == "medio":
            datos["medios"].append({"persona": c[0], "medio": c[1]})
        elif tipo == "relacion":
            datos["relaciones"].append({"a": c[0], "b": c[1], "tipo": c[2]})
        elif tipo == "regla":
            datos["reglas"].append(
                {"id": c[0], "nombre": c[1], "descripcion": c[2]}
            )

    if "id" not in datos:
        raise AccionInvalida(
            "Falta la fila 'caso': caso,<id>,<titulo>,<descripcion>,<dificultad>."
        )
    return datos


def generar_caso_desde_csv(contenido: str) -> dict[str, Any]:
    """Genera un caso a partir de un CSV. Opcional 9 del enunciado.

    Traduce y delega en generar_caso_desde_json/1, que valida la sintaxis en un
    interprete aparte, comprueba los minimos y registra el caso en el cargador.
    """
    if not isinstance(contenido, str) or not contenido.strip():
        raise AccionInvalida("El CSV llego vacio.")
    return generar_caso_desde_json(csv_a_estructura(contenido))
