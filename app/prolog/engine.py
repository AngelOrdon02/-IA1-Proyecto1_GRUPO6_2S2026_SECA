"""Puente entre Python y el motor de inferencia en Prolog.

Este modulo es la UNICA via por la que la aplicacion habla con Prolog. Ningun
otro archivo debe importar pyswip ni invocar swipl directamente.

Dos backends intercambiables:

* ``PySwipBackend``    — SWI-Prolog embebido en el proceso via ctypes. Es el
  que exige la rubrica del curso.
* ``SubprocessBackend`` — invoca el binario ``swipl`` una vez por consulta.
  Mas lento, pero inmune a los problemas de carga de ``libswipl.so`` y
  seguro entre hilos por construccion.

Ambos delegan la serializacion en ``consulta_json/3`` (prolog/core/api_json.pl),
de modo que devuelven exactamente la misma estructura y el cambio de backend es
transparente para el resto de la aplicacion.

Sobre la concurrencia: PySwip no es seguro entre hilos, porque embebe un unico
intérprete de SWI-Prolog en el proceso. Todas las consultas se serializan con
un lock global y el servidor corre con un solo worker. Es una decision
consciente, no un descuido: para tres casos con unas decenas de hechos, el
costo de serializar las consultas es irrelevante.
"""

from __future__ import annotations

import json
import logging
import subprocess
import threading
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from app import config

log = logging.getLogger(__name__)


class ErrorProlog(RuntimeError):
    """Falla al ejecutar una consulta contra la base de conocimiento."""


def _escapar_atomo(texto: str) -> str:
    """Escapa un texto para incrustarlo como atomo entre comillas simples.

    En Prolog, una comilla simple dentro de un atomo se escribe duplicandola:
    'no digas ''hola''' es un atomo valido. La barra invertida tambien debe
    duplicarse.
    """
    return texto.replace("\\", "\\\\").replace("'", "''")


# -----------------------------------------------------------------------------
# NOTA IMPORTANTE — rutas con corchetes
# -----------------------------------------------------------------------------
# El nombre de repositorio que exige el curso es
# "[IA1]Proyecto1_GRUPO6_2S2026_SECA", y los corchetes son METACARACTERES DE
# GLOB para SWI-Prolog: "[IA1]" es una clase de caracteres que coincide con una
# sola letra I, A o 1.
#
# consult/1 expande su argumento con expand_file_name/2. Con la ruta absoluta
# del proyecto, esa expansion devuelve la lista vacia, y consultar una lista
# vacia de archivos TIENE EXITO sin cargar nada. El sintoma es desconcertante:
# consult no falla, pero despues ningun predicado existe.
#
# Por eso nunca se le pasa a Prolog la ruta absoluta de la base de
# conocimiento. Se ejecuta desde su directorio y se consulta por nombre
# relativo, que no contiene corchetes.
# -----------------------------------------------------------------------------


class BackendProlog(ABC):
    """Contrato comun de los dos backends."""

    nombre: str = "abstracto"

    @abstractmethod
    def _ejecutar(self, meta: str, limite: int) -> str:
        """Ejecuta la meta y devuelve la respuesta JSON en crudo."""

    def consultar(self, meta: str, limite: int = 0) -> list[dict[str, str]]:
        """Ejecuta una meta Prolog y devuelve la lista de soluciones.

        Cada solucion es un diccionario ``{nombre_de_variable: valor}``, donde
        el valor es la representacion textual del termino Prolog.

        ``limite=0`` significa "todas las soluciones".
        """
        crudo = self._ejecutar(meta, limite)
        try:
            respuesta = json.loads(crudo)
        except json.JSONDecodeError as exc:
            raise ErrorProlog(
                f"Respuesta no interpretable del motor Prolog: {crudo[:200]!r}"
            ) from exc

        if not respuesta.get("ok", False):
            raise ErrorProlog(respuesta.get("error") or "Error desconocido en Prolog")

        return respuesta.get("soluciones", [])

    def uno(self, meta: str) -> dict[str, str] | None:
        """Devuelve la primera solucion, o ``None`` si la meta falla."""
        soluciones = self.consultar(meta, limite=1)
        return soluciones[0] if soluciones else None

    def es_cierto(self, meta: str) -> bool:
        """Evalua una meta como booleano."""
        return self.uno(meta) is not None

    def valores(self, meta: str, variable: str) -> list[str]:
        """Extrae los valores de una variable en todas las soluciones."""
        return [fila[variable] for fila in self.consultar(meta) if variable in fila]


class SubprocessBackend(BackendProlog):
    """Invoca el binario ``swipl`` en un proceso nuevo por consulta.

    Cada consulta parte de un interprete limpio, asi que no hay estado
    compartido ni condiciones de carrera posibles.
    """

    nombre = "subprocess"

    def __init__(self, ruta_kb: Path | None = None, binario: str | None = None):
        self.ruta_kb = Path(ruta_kb or config.RUTA_KB)
        self.binario = binario or config.BINARIO_SWIPL
        if not self.ruta_kb.exists():
            raise ErrorProlog(f"No existe la base de conocimiento: {self.ruta_kb}")

    def _ejecutar(self, meta: str, limite: int) -> str:
        objetivo = (
            f"consulta_json('{_escapar_atomo(meta)}', {int(limite)}, J), "
            f"write(J), nl"
        )
        comando = [
            self.binario,
            "-q",
            # Nombre relativo, no ruta absoluta: ver la nota sobre corchetes.
            "-g",
            f"consult('{_escapar_atomo(self.ruta_kb.name)}')",
            "-g",
            objetivo,
            "-t",
            "halt",
        ]
        try:
            proceso = subprocess.run(
                comando,
                capture_output=True,
                text=True,
                timeout=config.TIMEOUT_CONSULTA,
                check=False,
                cwd=str(self.ruta_kb.parent),
            )
        except subprocess.TimeoutExpired as exc:
            raise ErrorProlog(
                f"La consulta excedio {config.TIMEOUT_CONSULTA}s: {meta}"
            ) from exc

        salida = proceso.stdout.strip()
        if not salida:
            raise ErrorProlog(
                f"El motor no devolvio respuesta. stderr: {proceso.stderr.strip()[:300]}"
            )
        # Las advertencias de carga van a stderr; el JSON sale en una sola
        # linea en stdout (json_write_dict con width(0)).
        return salida.splitlines()[-1]


class PySwipBackend(BackendProlog):
    """SWI-Prolog embebido en el proceso mediante PySwip.

    Todas las consultas pasan por un lock: el interprete embebido es unico y
    compartido por todos los hilos del servidor.
    """

    nombre = "pyswip"

    def __init__(self, ruta_kb: Path | None = None):
        from pyswip import Prolog  # import diferido: puede fallar por libswipl

        self.ruta_kb = Path(ruta_kb or config.RUTA_KB)
        if not self.ruta_kb.exists():
            raise ErrorProlog(f"No existe la base de conocimiento: {self.ruta_kb}")

        self._lock = threading.Lock()
        self._prolog = Prolog()

        # SWI-Prolog mantiene su propio directorio de trabajo, independiente del
        # de Python: un os.chdir() aqui no tendria efecto sobre consult/1. Se
        # cambia con working_directory/2, que ademas resuelve la ruta sin
        # expansion de comodines y por tanto tolera los corchetes del nombre
        # del repositorio (ver la nota de arriba).
        directorio = _escapar_atomo(str(self.ruta_kb.parent))
        list(self._prolog.query(f"working_directory(_, '{directorio}')"))
        list(self._prolog.query(f"consult('{_escapar_atomo(self.ruta_kb.name)}')"))

        # Verificacion explicita: si la base no cargara, consult podria no
        # protestar y sin embargo ningun predicado existiria. Es mejor fallar
        # al arrancar que en la primera consulta del usuario.
        if not list(self._prolog.query("current_predicate(consulta_json/3)")):
            raise ErrorProlog(
                f"PySwip no cargo la base de conocimiento desde {self.ruta_kb}"
            )

    def _ejecutar(self, meta: str, limite: int) -> str:
        objetivo = f"consulta_json('{_escapar_atomo(meta)}', {int(limite)}, J)"
        with self._lock:
            try:
                resultados = list(self._prolog.query(objetivo, maxresult=1))
            except Exception as exc:  # pyswip lanza tipos propios
                raise ErrorProlog(f"PySwip fallo al ejecutar: {meta} — {exc}") from exc

        if not resultados:
            raise ErrorProlog(f"consulta_json/3 no produjo respuesta para: {meta}")

        valor: Any = resultados[0]["J"]
        if isinstance(valor, bytes):
            return valor.decode("utf-8")
        return str(valor)


def crear_engine() -> BackendProlog:
    """Construye el backend segun la configuracion, con degradacion elegante.

    Con ``LD_PROLOG_BACKEND=auto`` (por defecto) se intenta PySwip y, si su
    biblioteca nativa no carga, se cae al backend de subproceso dejando
    constancia en el log. El sistema sigue funcionando: se pierde velocidad,
    no funcionalidad.
    """
    preferido = config.BACKEND_PROLOG

    if preferido == "subprocess":
        return SubprocessBackend()

    if preferido == "pyswip":
        return PySwipBackend()

    try:
        engine = PySwipBackend()
        log.info("Motor Prolog: PySwip (embebido)")
        return engine
    except Exception as exc:
        log.warning(
            "PySwip no disponible (%s). Se usa el backend de subproceso.", exc
        )
        return SubprocessBackend()


# --- Instancia compartida ---------------------------------------------------
_engine: BackendProlog | None = None
_lock_creacion = threading.Lock()


def obtener_engine() -> BackendProlog:
    """Devuelve el engine compartido, creandolo la primera vez."""
    global _engine
    if _engine is None:
        with _lock_creacion:
            if _engine is None:
                _engine = crear_engine()
    return _engine


def _intentar(engine: BackendProlog, meta: str, aviso: str) -> None:
    """Ejecuta una meta de limpieza sin dejar que su fallo bloquee la recarga.

    En el peor caso queda un caso fantasma en memoria, que es mejor que un
    motor inservible.
    """
    try:
        engine.consultar(meta, limite=1)
    except ErrorProlog as exc:
        log.warning("%s: %s", aviso, exc)


def reiniciar_engine(casos_vigentes: list[str] | None = None) -> None:
    """Fuerza la reconstruccion del engine.

    Lo usa el modulo administrativo tras modificar los archivos de caso, para
    que la base de conocimiento se recargue sin reiniciar el servidor.

    `casos_vigentes` es la lista de casos que DEBEN quedar cargados. Se necesita
    por como funciona PySwip: el interprete de SWI-Prolog vive dentro del
    proceso de Python, asi que soltar el objeto del engine no descarta las
    clausulas ya consultadas. Al borrar un archivo de caso su .pl desaparece del
    disco, pero sus hechos seguirian en memoria y el caso continuaria
    apareciendo en el listado.

    Por eso, antes de soltar el engine, se purgan del interprete los casos que
    ya no figuran entre los vigentes. Con el backend de subproceso esto es
    innecesario (cada consulta arranca un interprete limpio), pero ejecutarlo
    igual mantiene identico el comportamiento de los dos backends.
    """
    global _engine
    with _lock_creacion:
        if _engine is not None:
            # Primero se releen los archivos de caso desde el disco.
            # ensure_loaded/1 no vuelve a leer un archivo ya registrado, asi
            # que sin esto la recarga no veria ni un caso editado ni uno
            # regenerado con el mismo nombre tras borrarlo.
            _intentar(_engine, "recargar_archivos_de_casos",
                      "No se pudieron recargar los archivos de caso")
            if casos_vigentes is not None:
                # Red de seguridad: si algun archivo no se pudo descargar, esto
                # retracta igualmente los hechos de los casos ya eliminados.
                lista = "[" + ",".join(casos_vigentes) + "]"
                _intentar(_engine, f"purgar_casos_ausentes({lista})",
                          "No se pudieron purgar los casos ausentes")
        _engine = None
