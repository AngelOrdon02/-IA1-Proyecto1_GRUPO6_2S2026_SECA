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

import random
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


def iniciar_aleatorio() -> str:
    """Elige un caso al azar de los disponibles en Prolog y abre una sesion.

    Devuelve el identificador de la sesion creada, igual que iniciar().
    Se usa desde el endpoint POST /api/sesiones/aleatorio.
    """
    engine = obtener_engine()
    ids_casos = engine.valores("caso(Id, _, _, _)", "Id")
    if not ids_casos:
        raise AccionInvalida("No hay casos disponibles en la base de conocimiento.")
    caso_elegido = random.choice(ids_casos)
    return iniciar(caso_elegido)


def registrar_puntos(sesion: str, delta: int) -> dict[str, Any]:
    """Aplica un cambio de puntuacion a la sesion y devuelve el nuevo valor.

    delta puede ser positivo (bonus) o negativo (penalizacion).
    La puntuacion nunca baja de 0.
    Se llama desde los endpoints de accion tras cada consulta del detective.
    """
    _sesion_activa(sesion)  # garantiza que la sesion existe
    nueva = db.actualizar_puntuacion(sesion, delta)
    db.registrar_accion(sesion, "puntuacion", f"delta={delta:+d} nuevo={nueva}")
    return {"puntuacion": nueva, "delta": delta}


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

    db.registrar_descubrimiento(sesion, "lugar_investigado", lugar)
    db.registrar_accion(sesion, "investigar_lugar", ficha["Nombre"])

    return {
        "lugar": lugar,
        "nombre": ficha["Nombre"],
        "descripcion": ficha["Descripcion"],
        "evidencias": evidencias,
        "eventos": eventos,
    }


def evidencias_descubiertas(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    conocidas = db.descubiertos(sesion, "evidencia")
    if not conocidas:
        return []
    engine = obtener_engine()
    filas = engine.consultar(
        f"pertenece(Id, {_lista_prolog(conocidas)}), "
        f"evidencia({datos['caso']}, Id, Tipo, Descripcion, Lugar, Hora), "
        f"hora_texto(Hora, HoraTexto), "
        f"etiqueta({datos['caso']}, Lugar, LugarNombre)"
    )
    return filas


def examinar_evidencia(sesion: str, evidencia: str) -> dict[str, Any]:
    datos = _sesion_activa(sesion)
    caso, evidencia = datos["caso"], _atomo(evidencia)

    # Descubrimiento progresivo: solo se examina lo ya hallado en un lugar.
    if not db.fue_descubierto(sesion, "evidencia", evidencia):
        raise AccionInvalida(
            f"Todavia no has encontrado la evidencia {evidencia}. "
            "Investiga los lugares del caso para descubrirla."
        )

    engine = obtener_engine()

    ficha = engine.uno(
        f"evidencia({caso}, {evidencia}, Tipo, Descripcion, Lugar, Hora), "
        f"hora_texto(Hora, HoraTexto), "
        f"etiqueta({caso}, Lugar, LugarNombre)"
    )
    if ficha is None:
        raise AccionInvalida(f"La evidencia {evidencia} no existe en este caso.")

    vinculos = engine.consultar(
        f"vinculo_evidencia({caso}, {evidencia}, Persona, Nombre, Relacion)"
    )

    db.registrar_accion(sesion, "examinar_evidencia", ficha["Tipo"])
    return {
        "evidencia": evidencia,
        **ficha,
        "vinculos": vinculos,
    }


def relaciones(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(
        f"relacion({datos['caso']}, PersonaA, PersonaB, Tipo), "
        f"nombre_de({datos['caso']}, PersonaA, NombreA), "
        f"nombre_de({datos['caso']}, PersonaB, NombreB)"
    )
    db.registrar_accion(sesion, "consultar_relaciones", f"{len(filas)} relacion(es)")
    return filas


def motivos(sesion: str) -> list[dict[str, str]]:
    """Motivos de las personas YA interrogadas: el resto sigue oculto."""
    datos = _sesion_activa(sesion)
    interrogados = db.descubiertos(sesion, "interrogatorio")
    if not interrogados:
        db.registrar_accion(sesion, "analizar_motivos", "sin interrogatorios aun")
        return []
    engine = obtener_engine()
    filas = engine.consultar(
        f"pertenece(Persona, {_lista_prolog(interrogados)}), "
        f"vista_motivo({datos['caso']}, Persona, Nombre, Tipo, Descripcion)"
    )
    db.registrar_accion(sesion, "analizar_motivos", f"{len(filas)} motivo(s)")
    return filas


def oportunidades(sesion: str) -> list[dict[str, str]]:
    datos = _sesion_activa(sesion)
    engine = obtener_engine()
    filas = engine.consultar(
        f"vista_analisis({datos['caso']}, Persona, Nombre, "
        f"Acceso, Oportunidad, Motivo, Medios, Coartada)"
    )
    db.registrar_accion(sesion, "analizar_oportunidades", f"{len(filas)} persona(s)")
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


# ---------------------------------------------------------------------------
# Opcionales 6, 7, 8
# ---------------------------------------------------------------------------

def grafo_relaciones(sesion: str) -> dict[str, Any]:
    """Genera la estructura de nodos y enlaces para el grafo de relaciones y evidencias.

    Opcional 6 del enunciado: Visualización gráfica de la relación entre
    sospechosos y evidencias.
    """
    datos = _sesion_activa(sesion)
    caso = datos["caso"]
    engine = obtener_engine()

    # 1. Sospechosos y sus niveles de sospecha
    sospechosos_list = engine.consultar(f"persona({caso}, Id, Nombre, sospechoso)")
    sospecha_map = {
        s["Persona"]: s
        for s in engine.consultar(
            f"vista_sospecha({caso}, Persona, Nombre, Puntaje, Categoria)"
        )
    }

    nodos = []
    for s in sospechosos_list:
        info_s = sospecha_map.get(s["Id"], {})
        nodos.append({
            "id": s["Id"],
            "label": s["Nombre"],
            "tipo": "sospechoso",
            "puntaje": int(info_s.get("Puntaje", 0)),
            "categoria": info_s.get("Categoria", "bajo"),
            "interrogado": db.fue_descubierto(sesion, "interrogatorio", s["Id"]),
        })

    # Otras personas (testigos/cómplices)
    otras_personas = engine.consultar(
        f"persona({caso}, Id, Nombre, Rol), Rol \\= sospechoso"
    )
    for p in otras_personas:
        nodos.append({
            "id": p["Id"],
            "label": p["Nombre"],
            "tipo": "persona",
            "rol": p["Rol"],
            "interrogado": db.fue_descubierto(sesion, "interrogatorio", p["Id"]),
        })

    # 2. Evidencias descubiertas (o todas si la sesión ya finalizó)
    es_cerrada = datos["estado"] != "en_curso"
    if es_cerrada:
        evidencias_visibles = engine.consultar(
            f"vista_evidencia({caso}, Id, Tipo, Descripcion, Lugar, Hora)"
        )
    else:
        evidencias_visibles = evidencias_descubiertas(sesion)

    for ev in evidencias_visibles:
        nodos.append({
            "id": ev["Id"],
            "label": f"{ev['Id'].upper()}: {ev['Tipo']}",
            "tipo": "evidencia",
            "subtipo": ev["Tipo"],
            "descripcion": ev.get("Descripcion", ""),
            "lugar": ev.get("Lugar", ""),
            "hora": ev.get("Hora", ""),
        })

    # 3. Enlaces entre personas y evidencias
    enlaces = []
    evidencias_ids = {ev["Id"] for ev in evidencias_visibles}

    for ev_id in evidencias_ids:
        vinculos = engine.consultar(
            f"vista_evidencia_persona({caso}, {ev_id}, Persona, Nombre)"
        )
        for v in _sin_duplicados(vinculos, "Persona"):
            enlaces.append({
                "origen": v["Persona"],
                "destino": ev_id,
                "tipo": "evidencia_vinculo",
                "etiqueta": f"Vinculado a {ev_id.upper()}",
            })

    # 4. Enlaces de relaciones interpersonales
    relaciones_list = engine.consultar(f"relacion_relevante({caso}, P1, P2, Tipo)")
    vistos_rel: set[tuple[str, str]] = set()
    for r in relaciones_list:
        p1, p2, tipo = r["P1"], r["P2"], r["Tipo"]
        par = (min(p1, p2), max(p1, p2))
        if par not in vistos_rel:
            vistos_rel.add(par)
            enlaces.append({
                "origen": p1,
                "destino": p2,
                "tipo": "relacion_personal",
                "etiqueta": tipo.replace("_", " ").capitalize(),
            })

    # 5. Enlaces de coartadas con testigos
    coartadas_list = engine.consultar(f"coartada({caso}, Persona, Lugar, Hora, Testigo)")
    for c in coartadas_list:
        testigo = c.get("Testigo")
        persona = c.get("Persona")
        if testigo and testigo not in ("nadie", "ninguno", "-", persona):
            enlaces.append({
                "origen": persona,
                "destino": testigo,
                "tipo": "testigo_coartada",
                "etiqueta": "Testigo de coartada",
            })

    db.registrar_accion(
        sesion, "consultar_grafo", f"{len(nodos)} nodos, {len(enlaces)} enlaces"
    )

    return {
        "sesion": sesion,
        "caso": caso,
        "nodos": nodos,
        "enlaces": enlaces,
    }


def historial_investigaciones(
    caso: str | None = None,
    veredicto: str | None = None,
    estado: str | None = None,
    limite: int = 100,
) -> dict[str, Any]:
    """Historial completo de investigaciones resueltas y en curso con métricas.

    Opcional 8 del enunciado: Historial de investigaciones resueltas.
    """
    if caso:
        caso = _atomo(caso)
    if veredicto and veredicto not in ("correcto", "incorrecto"):
        raise AccionInvalida(f"Veredicto no válido: {veredicto}")
    if estado and estado not in ("en_curso", "resuelto", "fallido"):
        raise AccionInvalida(f"Estado no válido: {estado}")

    sesiones_raw = db.listar_sesiones_con_metricas(
        caso=caso, veredicto=veredicto, estado=estado, limite=limite
    )
    engine = obtener_engine()
    casos_info = {
        c["Id"]: c
        for c in engine.consultar("caso(Id, Titulo, Descripcion, Dificultad)")
    }

    sesiones = []
    for s in sesiones_raw:
        c_info = casos_info.get(s["caso"], {})
        duracion_segundos = None
        duracion_texto = "-"
        if s.get("iniciada") and s.get("cerrada"):
            try:
                from datetime import datetime
                t_ini = datetime.fromisoformat(s["iniciada"])
                t_fin = datetime.fromisoformat(s["cerrada"])
                duracion_segundos = int((t_fin - t_ini).total_seconds())
                minutos = duracion_segundos // 60
                segundos = duracion_segundos % 60
                duracion_texto = f"{minutos}m {segundos}s" if minutos > 0 else f"{segundos}s"
            except Exception:
                pass

        nombre_acusado = None
        if s.get("acusado"):
            row = engine.uno(f"nombre_de({s['caso']}, {s['acusado']}, Nombre)")
            nombre_acusado = row["Nombre"] if row else s["acusado"]

        resp_row = engine.uno(f"vista_conclusion({s['caso']}, _, Resp, RespNom, Punt)")

        sesiones.append({
            **s,
            "caso_titulo": c_info.get("Titulo", s["caso"]),
            "caso_dificultad": c_info.get("Dificultad", "medio"),
            "nombre_acusado": nombre_acusado,
            "responsable_real": resp_row["RespNom"] if resp_row else "-",
            "puntaje_sospecha": resp_row["Punt"] if resp_row else "0",
            "duracion_segundos": duracion_segundos,
            "duracion_texto": duracion_texto,
        })

    stats = db.estadisticas_globales()
    return {
        "ok": True,
        "sesiones": sesiones,
        "estadisticas": stats,
    }


def generar_informe_html(sesion: str) -> str:
    """Genera una página HTML imprimible y autocontenida del informe final.

    Opcional 7 del enunciado: Exportación del informe en formato PDF.
    """
    informe = informe_final(sesion)
    s = informe["sesion"]
    f = informe["ficha"]
    c = informe["conclusion"]
    is_correct = s.get("veredicto") == "correcto"

    ranking_rows = "".join(
        f"""
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">{i+1}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{r['Nombre']}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">{r['Puntaje']} pts</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
                <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{r['Categoria'].upper()}</span>
            </td>
        </tr>
        """
        for i, r in enumerate(informe["ranking"])
    )

    reglas_items = "".join(
        f"""
        <li style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-left: 3px solid #0284c7; border-radius: 4px;">
            <strong>{r['Nombre']}</strong> <code style="color: #64748b;">({r['Id']})</code>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">{r['Descripcion']}</p>
        </li>
        """
        for r in informe["reglas"]
    )

    coartadas_rows = "".join(
        f"""
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">{co['Nombre']}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">{co.get('Lugar', '-')} a las {co.get('Hora', '-')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">{co.get('Testigo', '-')}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
                <span style="color: {'#16a34a' if co['Estado'] == 'valida' else '#dc2626'}; font-weight: bold;">
                    {'Válida' if co['Estado'] == 'valida' else 'Inválida'}
                </span>
            </td>
        </tr>
        """
        for co in informe["coartadas"]
    )

    contradicciones_items = "".join(
        f"""
        <div style="margin-bottom: 8px; padding: 10px; background: #fefce8; border: 1px solid #fef08a; border-radius: 6px;">
            <span style="font-size: 12px; font-weight: bold; color: #854d0e;">{ct['A']} ↔ {ct['B']}</span>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #713f12;">{ct['Texto']}</p>
        </div>
        """
        for ct in informe["contradicciones"]
    ) if informe["contradicciones"] else "<p style='color: #64748b;'>No se detectaron contradicciones.</p>"

    bitacora_rows = "".join(
        f"""
        <tr>
            <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">{b['momento']}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">{b['accion']}</td>
            <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">{b['detalle']}</td>
        </tr>
        """
        for b in informe["bitacora"]
    )

    veredicto_bg = "#ecfdf5" if is_correct else "#fef2f2"
    veredicto_border = "#10b981" if is_correct else "#ef4444"
    veredicto_color = "#065f46" if is_correct else "#991b1b"
    veredicto_title = "ACUSACIÓN CORRECTA" if is_correct else "ACUSACIÓN INCORRECTA"

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Informe Final — {f['Titulo']} — Logic Detective</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 1.5cm;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 20px;
        }}
        .header {{
            border-bottom: 2px solid #0284c7;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }}
        .badge {{
            display: inline-block;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 4px;
            background: #e2e8f0;
        }}
        .veredicto-box {{
            background: {veredicto_bg};
            border: 2px solid {veredicto_border};
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 25px;
            color: {veredicto_color};
        }}
        h1 {{ margin: 0 0 5px 0; font-size: 24px; color: #0f172a; }}
        h2 {{ font-size: 16px; color: #0f172a; margin-top: 24px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }}
        th {{ background: #f1f5f9; padding: 8px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; }}
        .no-print {{
            margin-bottom: 20px;
            text-align: right;
        }}
        .btn-print {{
            background: #0284c7;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
        }}
        @media print {{
            .no-print {{ display: none !important; }}
            body {{ padding: 0; }}
            .page-break {{ page-break-before: always; }}
        }}
    </style>
</head>
<body>
    <div class="no-print">
        <button class="btn-print" onclick="window.print()">Imprimir / Guardar en PDF</button>
    </div>

    <div class="header">
        <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
            Universidad de San Carlos de Guatemala · Inteligencia Artificial 1 · Logic Detective
        </div>
        <h1>{f['Titulo']}</h1>
        <div style="font-size: 14px; color: #475569;">
            <strong>Hecho:</strong> {f['Hecho']} | <strong>Lugar:</strong> {f['LugarNombre']} | <strong>Hora:</strong> {f['HoraTexto']} | <strong>Dificultad:</strong> {f['Dificultad'].capitalize()}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            <strong>Sesión:</strong> {s['id']} | <strong>Iniciada:</strong> {s['iniciada']} | <strong>Pistas usadas:</strong> {s['pistas']}
        </div>
    </div>

    <div class="veredicto-box">
        <h3 style="margin: 0 0 8px 0; font-size: 18px;">{veredicto_title}</h3>
        <p style="margin: 0; font-size: 14px;">
            Acusaste a <strong>{s.get('acusado', '-')}</strong>.
            El responsable deducido por el motor Prolog es <strong>{c.get('NombreResponsable', '-')}</strong> con <strong>{c.get('Puntaje', '0')} puntos</strong> de sospecha.
        </p>
    </div>

    <h2>1. Ranking de Sospecha (Motor de Inferencia)</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Sospechoso</th>
                <th>Puntaje</th>
                <th>Nivel</th>
            </tr>
        </thead>
        <tbody>
            {ranking_rows}
        </tbody>
    </table>

    <h2>2. Cadena Deductiva de Reglas Prolog</h2>
    <ol style="padding-left: 20px; margin: 0;">
        {reglas_items}
    </ol>

    <h2>3. Coartadas y Verificación Lógica</h2>
    <table>
        <thead>
            <tr>
                <th>Sospechoso</th>
                <th>Ubicación y Hora</th>
                <th>Testigo</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            {coartadas_rows}
        </tbody>
    </table>

    <h2>4. Contradicciones Detectadas</h2>
    {contradicciones_items}

    <div class="page-break"></div>

    <h2>5. Bitácora Completa de la Investigación</h2>
    <table>
        <thead>
            <tr>
                <th>Momento (UTC)</th>
                <th>Acción</th>
                <th>Detalle</th>
            </tr>
        </thead>
        <tbody>
            {bitacora_rows}
        </tbody>
    </table>

    <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center;">
        Logic Detective — Sistema Experto con SWI-Prolog y Python — Grupo 6, 2S2026
    </div>
</body>
</html>
"""
