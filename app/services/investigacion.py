"""Modulo de Investigacion: las acciones del detective.

Responsabilidad de esta capa: traducir una accion del usuario a una consulta
Prolog, registrar en la bitacora y llevar la cuenta de lo que el usuario ya
descubrio.

Lo que esta capa NO hace: decidir nada. No evalua coartadas, no compara
puntajes, no determina culpables. Toda esa deduccion ocurre en el motor
logico; aqui solo se decide QUE se le pregunta a Prolog y CUANDO, segun lo que
el detective haya descubierto.

El descubrimiento progresivo funciona asi: la base de conocimiento contiene la
verdad completa del caso desde el inicio, pero la sesion registra que
elementos ha revelado el usuario. Las deducciones sensibles (contradicciones)
reciben esa lista como argumento y Prolog filtra. Nunca se usa assert/retract
sobre la base compartida: eso corromperia el estado entre sesiones
concurrentes.
"""

from __future__ import annotations

import re
from typing import Any

from app.prolog.engine import ErrorProlog, obtener_engine
from app.storage import db

# Identificadores validos de atomo Prolog en minuscula. Todo lo que llega del
# usuario y va a formar parte de una consulta pasa por aqui.
_ATOMO = re.compile(r"^[a-z][a-zA-Z0-9_]*$")


class AccionInvalida(ValueError):
    """La accion solicitada no es posible en el estado actual de la partida."""


def _atomo(valor: str) -> str:
    """Valida que un identificador sea un atomo Prolog seguro.

    Es la unica barrera contra la inyeccion de metas: sin esto, un id como
    ``x), halt, foo(`` alteraria la consulta.
    """
    if not _ATOMO.match(valor or ""):
        raise AccionInvalida(f"Identificador no valido: {valor!r}")
    return valor


def _lista_prolog(ids: list[str]) -> str:
    """Construye el literal de lista Prolog ``[a,b,c]`` a partir de ids."""
    seguros = [i for i in ids if _ATOMO.match(i)]
    return "[" + ",".join(seguros) + "]"


def _sin_duplicados(filas: list[dict[str, str]], clave: str) -> list[dict[str, str]]:
    """Elimina filas repetidas segun el valor de una clave, conservando orden."""
    vistos: set[str] = set()
    salida = []
    for fila in filas:
        marca = fila.get(clave, "")
        if marca not in vistos:
            vistos.add(marca)
            salida.append(fila)
    return salida


# ---------------------------------------------------------------------------
# Catalogo de casos
# ---------------------------------------------------------------------------

def listar_casos() -> list[dict[str, Any]]:
    """Casos disponibles, con su estado de avance."""
    engine = obtener_engine()
    filas = engine.consultar("caso(Id, Titulo, Descripcion, Dificultad)")
    estados = db.estado_de_casos()
    for fila in filas:
        fila["estado"] = estados.get(fila["Id"], "sin_iniciar")
    return filas


def ficha_caso(caso: str) -> dict[str, Any]:
    """Descripcion inicial del incidente: lo primero que ve el detective."""
    caso = _atomo(caso)
    engine = obtener_engine()
    fila = engine.uno(
        f"caso({caso}, Titulo, Descripcion, Dificultad), "
        f"incidente({caso}, Hecho, Lugar, Hora), "
        f"hora_texto(Hora, HoraTexto), "
        f"lugar({caso}, Lugar, LugarNombre, _), "
        f"victima({caso}, V), nombre_de({caso}, V, Victima)"
    )
    if fila is None:
        raise AccionInvalida(f"El caso {caso} no existe.")
    return fila


# ---------------------------------------------------------------------------
# Inicio de una investigacion
# ---------------------------------------------------------------------------

def iniciar(caso: str) -> str:
    """Abre una sesion de investigacion y devuelve su identificador.

    Al iniciar, el detective conoce a las personas y los lugares, pero ninguna
    evidencia ni declaracion: esas debe descubrirlas actuando.
    """
    caso = _atomo(caso)
    engine = obtener_engine()
    if not engine.es_cierto(f"caso({caso}, _, _, _)"):
        raise AccionInvalida(f"El caso {caso} no existe.")

    sesion = db.crear_sesion(caso)
    for fila in engine.consultar(f"persona({caso}, Id, _, _)"):
        db.registrar_descubrimiento(sesion, "persona", fila["Id"])
    for fila in engine.consultar(f"lugar({caso}, Id, _, _)"):
        db.registrar_descubrimiento(sesion, "lugar", fila["Id"])

    db.registrar_accion(sesion, "iniciar_investigacion", f"Caso {caso}")
    return sesion


def _sesion_activa(sesion: str) -> dict[str, Any]:
    datos = db.obtener_sesion(sesion)
    if datos is None:
        raise AccionInvalida("La sesion de investigacion no existe.")
    return datos


# ---------------------------------------------------------------------------
# Acciones de descubrimiento
# ---------------------------------------------------------------------------

def sospechosos(sesion: str) -> list[dict[str, str]]:
    """Lista de sospechosos del caso."""
    datos = _sesion_activa(sesion)
    caso = datos["caso"]
    engine = obtener_engine()
    filas = engine.consultar(f"persona({caso}, Id, Nombre, sospechoso)")
    for fila in filas:
        fila["interrogado"] = db.fue_descubierto(sesion, "interrogatorio", fila["Id"])
    db.registrar_accion(sesion, "consultar_sospechosos", f"{len(filas)} sospechosos")
    return filas


def personas(sesion: str, rol: str = "testigo") -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    return engine.consultar(f"persona({datos['caso']}, Id, Nombre, {_atomo(rol)})")


def interrogar(sesion: str, persona: str) -> dict[str, Any]:
    """Interroga a un sospechoso o testigo.

    Revela su declaracion y su coartada, y las marca como descubiertas para
    que puedan participar en la deteccion de contradicciones.
    """
    datos = _sesion_activa(sesion)
    caso, persona = datos["caso"], _atomo(persona)
    engine = obtener_engine()

    nombre = engine.uno(f"nombre_de({caso}, {persona}, Nombre)")
    if nombre is None:
        raise AccionInvalida(f"En este caso no hay nadie llamado {persona}.")

    declaraciones = engine.consultar(
        f"declaracion({caso}, Id, {persona}, Texto)"
    )
    for decl in declaraciones:
        db.registrar_descubrimiento(sesion, "declaracion", decl["Id"])

    coartadas = engine.consultar(
        f"coartada({caso}, {persona}, Lugar, Hora, Testigo), "
        f"hora_texto(Hora, HoraTexto), "
        f"etiqueta({caso}, Lugar, LugarNombre), "
        f"etiqueta({caso}, Testigo, TestigoNombre)"
    )

    db.registrar_descubrimiento(sesion, "interrogatorio", persona)
    db.registrar_accion(sesion, "interrogar", f"{nombre['Nombre']}")

    return {
        "persona": persona,
        "nombre": nombre["Nombre"],
        "declaraciones": declaraciones,
        "coartadas": coartadas,
    }


def lugares(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(f"lugar({datos['caso']}, Id, Nombre, Descripcion)")
    for fila in filas:
        fila["investigado"] = db.fue_descubierto(sesion, "lugar_investigado", fila["Id"])
    return filas


def investigar_lugar(sesion: str, lugar: str) -> dict[str, Any]:
    """Registra un lugar, revelando sus evidencias y los eventos ocurridos ahi."""
    datos = _sesion_activa(sesion)
    caso, lugar = datos["caso"], _atomo(lugar)
    engine = obtener_engine()

    ficha = engine.uno(f"lugar({caso}, {lugar}, Nombre, Descripcion)")
    if ficha is None:
        raise AccionInvalida(f"El lugar {lugar} no pertenece a este caso.")

    evidencias = engine.consultar(
        f"evidencia({caso}, Id, Tipo, Descripcion, {lugar}, Hora), "
        f"hora_texto(Hora, HoraTexto)"
    )
    for ev in evidencias:
        db.registrar_descubrimiento(sesion, "evidencia", ev["Id"])

    eventos = engine.consultar(
        f"evento({caso}, Id, Hora, {lugar}, Descripcion), hora_texto(Hora, HoraTexto)"
    )
    for ev in eventos:
        db.registrar_descubrimiento(sesion, "evento", ev["Id"])

    conexiones = engine.consultar(
        f"conexion_bi({caso}, {lugar}, Otro), lugar({caso}, Otro, NombreOtro, _)"
    )

    db.registrar_descubrimiento(sesion, "lugar_investigado", lugar)
    db.registrar_accion(
        sesion, "investigar_lugar",
        f"{ficha['Nombre']}: {len(evidencias)} evidencia(s)",
    )

    return {
        "lugar": lugar,
        "nombre": ficha["Nombre"],
        "descripcion": ficha["Descripcion"],
        "evidencias": evidencias,
        "eventos": eventos,
        "conexiones": _sin_duplicados(conexiones, "Otro"),
    }


def evidencias_descubiertas(sesion: str) -> list[dict[str, str]]:
    """Evidencias que el detective ya encontro."""
    datos = _sesion_activa(sesion)
    conocidas = db.descubiertos(sesion, "evidencia")
    if not conocidas:
        return []
    engine = obtener_engine()
    filas = engine.consultar(
        f"pertenece(Id, {_lista_prolog(conocidas)}), "
        f"vista_evidencia({datos['caso']}, Id, Tipo, Descripcion, Lugar, Hora)"
    )
    return filas


def examinar_evidencia(sesion: str, evidencia: str) -> dict[str, Any]:
    """Analiza una evidencia y revela a que personas vincula."""
    datos = _sesion_activa(sesion)
    caso, evidencia = datos["caso"], _atomo(evidencia)

    if not db.fue_descubierto(sesion, "evidencia", evidencia):
        raise AccionInvalida(
            "Todavia no has encontrado esa evidencia. Investiga los lugares primero."
        )

    engine = obtener_engine()
    ficha = engine.uno(
        f"vista_evidencia({caso}, {evidencia}, Tipo, Descripcion, Lugar, Hora)"
    )
    if ficha is None:
        raise AccionInvalida(f"La evidencia {evidencia} no existe en este caso.")

    vinculos = engine.consultar(
        f"vista_evidencia_persona({caso}, {evidencia}, Persona, Nombre)"
    )
    db.registrar_accion(sesion, "examinar_evidencia", f"{evidencia}: {ficha['Tipo']}")

    return {"evidencia": evidencia, **ficha, "vinculos": _sin_duplicados(vinculos, "Persona")}


# ---------------------------------------------------------------------------
# Analisis
# ---------------------------------------------------------------------------

def relaciones(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(
        f"vista_relacion({datos['caso']}, Nombre1, Nombre2, Tipo)"
    )
    db.registrar_accion(sesion, "consultar_relaciones", f"{len(filas)} relacion(es)")
    return filas


def motivos(sesion: str) -> list[dict[str, str]]:
    """Motivos de los sospechosos ya interrogados.

    Solo se muestran los de quienes fueron interrogados: el detective no puede
    conocer el movil de alguien con quien no ha hablado.
    """
    datos = _sesion_activa(sesion)
    interrogados = db.descubiertos(sesion, "interrogatorio")
    if not interrogados:
        db.registrar_accion(sesion, "analizar_motivos", "sin interrogatorios previos")
        return []
    engine = obtener_engine()
    filas = engine.consultar(
        f"pertenece(Persona, {_lista_prolog(interrogados)}), "
        f"vista_motivo({datos['caso']}, Persona, Nombre, Tipo, Descripcion)"
    )
    db.registrar_accion(sesion, "analizar_motivos", f"{len(filas)} motivo(s)")
    return filas


def oportunidades(sesion: str) -> list[dict[str, str]]:
    """Los cuatro pilares por sospechoso: acceso, oportunidad, motivo y medios."""
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(
        f"vista_analisis({datos['caso']}, Persona, Nombre, Acceso, Oportunidad, "
        f"Motivo, Medios, Coartada)"
    )
    db.registrar_accion(sesion, "analizar_oportunidades", f"{len(filas)} sospechoso(s)")
    return filas


def coartadas(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(
        f"vista_coartada({datos['caso']}, Persona, Nombre, Lugar, Hora, Testigo, "
        f"Estado, Motivo)"
    )
    db.registrar_accion(sesion, "revisar_coartadas", f"{len(filas)} coartada(s)")
    return filas


def linea_temporal(sesion: str) -> list[dict[str, str]]:
    """Eventos descubiertos, ordenados cronologicamente."""
    datos = _sesion_activa(sesion)
    conocidos = db.descubiertos(sesion, "evento")
    if not conocidos:
        db.registrar_accion(sesion, "consultar_linea_temporal", "sin eventos aun")
        return []
    engine = obtener_engine()
    filas = engine.consultar(
        f"pertenece(Id, {_lista_prolog(conocidos)}), "
        f"evento({datos['caso']}, Id, Hora, Lugar, Descripcion), "
        f"hora_texto(Hora, HoraTexto), "
        f"etiqueta({datos['caso']}, Lugar, LugarNombre)"
    )
    filas.sort(key=lambda f: f["HoraTexto"])
    db.registrar_accion(sesion, "consultar_linea_temporal", f"{len(filas)} evento(s)")
    return filas


def contradicciones(sesion: str) -> list[dict[str, str]]:
    """Contradicciones detectables con lo que el detective ya descubrio.

    El filtrado por elementos conocidos lo hace Prolog: aqui solo se le pasan
    las dos listas.
    """
    datos = _sesion_activa(sesion)
    declaraciones = db.descubiertos(sesion, "declaracion")
    evidencias = db.descubiertos(sesion, "evidencia")

    if not declaraciones:
        db.registrar_accion(sesion, "detectar_contradicciones", "sin declaraciones aun")
        return []

    engine = obtener_engine()
    filas = engine.consultar(
        f"vista_contradiccion({datos['caso']}, {_lista_prolog(declaraciones)}, "
        f"{_lista_prolog(evidencias)}, Tipo, A, B, Texto)"
    )
    filas = _sin_duplicados(filas, "Texto")
    db.registrar_accion(
        sesion, "detectar_contradicciones", f"{len(filas)} contradiccion(es)"
    )
    return filas


def nivel_sospecha(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(
        f"vista_sospecha({datos['caso']}, Persona, Nombre, Puntaje, Categoria)"
    )
    filas.sort(key=lambda f: int(f["Puntaje"]), reverse=True)
    db.registrar_accion(sesion, "consultar_nivel_sospecha", f"{len(filas)} sospechoso(s)")
    return filas


def solicitar_pista(sesion: str) -> dict[str, Any]:
    """Entrega la siguiente pista, en orden creciente de revelacion."""
    from app import config

    datos = _sesion_activa(sesion)
    usadas = int(datos["pistas"])
    if usadas >= config.MAX_PISTAS:
        db.registrar_accion(sesion, "solicitar_pista", "sin pistas disponibles")
        return {"numero": usadas, "texto": None, "restantes": 0}

    numero = usadas + 1
    engine = obtener_engine()
    fila = engine.uno(f"pista({datos['caso']}, {numero}, Texto)")
    texto = fila["Texto"] if fila else "No hay mas pistas para este caso."

    db.incrementar_pistas(sesion)
    db.registrar_accion(sesion, "solicitar_pista", f"Pista {numero}")
    return {
        "numero": numero,
        "texto": texto,
        "restantes": config.MAX_PISTAS - numero,
    }


# ---------------------------------------------------------------------------
# Resolucion
# ---------------------------------------------------------------------------

def acusar(sesion: str, acusado: str) -> dict[str, Any]:
    """Emite la acusacion final y cierra la investigacion."""
    datos = _sesion_activa(sesion)
    if datos["estado"] != "en_curso":
        raise AccionInvalida("Esta investigacion ya fue cerrada con una acusacion.")

    caso, acusado = datos["caso"], _atomo(acusado)
    engine = obtener_engine()

    if not engine.es_cierto(f"persona({caso}, {acusado}, _, sospechoso)"):
        raise AccionInvalida("Solo se puede acusar a un sospechoso del caso.")

    resultado = engine.uno(
        f"vista_conclusion({caso}, Estado, Responsable, NombreResponsable, Puntaje)"
    )
    veredicto = "correcto" if resultado and resultado["Responsable"] == acusado else "incorrecto"

    nombre_acusado = engine.uno(f"nombre_de({caso}, {acusado}, Nombre)")
    db.cerrar_sesion(sesion, acusado, veredicto)
    db.registrar_accion(
        sesion, "emitir_acusacion",
        f"Acusa a {nombre_acusado['Nombre']} — {veredicto}",
    )

    return {
        "acusado": acusado,
        "nombre_acusado": nombre_acusado["Nombre"] if nombre_acusado else acusado,
        "veredicto": veredicto,
        "responsable": resultado["Responsable"] if resultado else "ninguno",
        "nombre_responsable": resultado["NombreResponsable"] if resultado else "-",
        "puntaje": resultado["Puntaje"] if resultado else "0",
    }


def explicacion(sesion: str, persona: str | None = None) -> dict[str, Any]:
    """Explicacion logica: que reglas se activaron y por que.

    Sin persona, explica la conclusion del caso. Con persona, explica el
    razonamiento sobre ese sospechoso en concreto.
    """
    datos = _sesion_activa(sesion)
    caso = datos["caso"]
    engine = obtener_engine()

    conclusion = engine.uno(
        f"vista_conclusion({caso}, Estado, Responsable, NombreResponsable, Puntaje)"
    )
    objetivo = _atomo(persona) if persona else conclusion["Responsable"]

    reglas = engine.consultar(
        f"vista_explicacion({caso}, {objetivo}, Id, Nombre, Descripcion, Detalle)"
    )
    descartes = engine.consultar(f"vista_descarte({caso}, Persona, Nombre, Texto)")
    complices = engine.consultar(f"vista_complice({caso}, Persona, Nombre, Texto)")

    db.registrar_accion(sesion, "consultar_explicacion", f"sobre {objetivo}")

    return {
        "objetivo": objetivo,
        "conclusion": conclusion,
        "reglas": reglas,
        "descartes": descartes,
        "complices": _sin_duplicados(complices, "Persona"),
    }


def informe_final(sesion: str) -> dict[str, Any]:
    """Informe completo del caso, exigido por el alcance obligatorio."""
    datos = _sesion_activa(sesion)
    caso = datos["caso"]
    engine = obtener_engine()

    return {
        "sesion": datos,
        "ficha": ficha_caso(caso),
        "conclusion": engine.uno(
            f"vista_conclusion({caso}, Estado, Responsable, NombreResponsable, Puntaje)"
        ),
        "ranking": sorted(
            engine.consultar(
                f"vista_sospecha({caso}, Persona, Nombre, Puntaje, Categoria)"
            ),
            key=lambda f: int(f["Puntaje"]),
            reverse=True,
        ),
        "coartadas": engine.consultar(
            f"vista_coartada({caso}, Persona, Nombre, Lugar, Hora, Testigo, Estado, Motivo)"
        ),
        # Los findall van ANTES de la vista: las listas deben estar ligadas
        # cuando vista_contradiccion/7 las recorre.
        "contradicciones": _sin_duplicados(
            engine.consultar(
                f"findall(D, declaracion({caso}, D, _, _), DeclTodas), "
                f"findall(E, evidencia({caso}, E, _, _, _, _), EvidTodas), "
                f"vista_contradiccion({caso}, DeclTodas, EvidTodas, Tipo, A, B, Texto)"
            ),
            "Texto",
        ),
        "complices": _sin_duplicados(
            engine.consultar(f"vista_complice({caso}, Persona, Nombre, Texto)"),
            "Persona",
        ),
        "descartes": engine.consultar(
            f"vista_descarte({caso}, Persona, Nombre, Texto)"
        ),
        "reglas": engine.consultar(
            f"vista_conclusion({caso}, _, Responsable, _, _), "
            f"vista_explicacion({caso}, Responsable, Id, Nombre, Descripcion, Detalle)"
        ),
        "bitacora": db.leer_bitacora(sesion),
    }


def bitacora(sesion: str) -> list[dict[str, Any]]:
    _sesion_activa(sesion)
    return db.leer_bitacora(sesion)
