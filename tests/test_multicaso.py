"""Pruebas del modo multicaso y las estadisticas de resolucion (opcional 10).

Una campania recorre todos los casos en orden creciente de dificultad. El orden
y la eleccion del siguiente caso los decide Prolog; estas pruebas verifican esa
frontera ademas del avance y las metricas.
"""

from __future__ import annotations

from tests.conftest import CASOS, SOLUCIONES


def _resolver(cliente, sesion: str, caso: str, acertar: bool = True) -> None:
    """Cierra una sesion acusando al culpable o a un inocente."""
    if acertar:
        acusado = SOLUCIONES[caso]
    else:
        sospechosos = cliente.get(f"/api/sesiones/{sesion}/sospechosos").json()["sospechosos"]
        acusado = next(s["Id"] for s in sospechosos if s["Id"] != SOLUCIONES[caso])
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": acusado})


# ---------------------------------------------------------------------------
# El orden lo decide Prolog
# ---------------------------------------------------------------------------

def test_69_prolog_ordena_los_casos_por_dificultad(engine):
    """casos_por_dificultad/1 va de facil a dificil, no en orden alfabetico."""
    orden = engine.uno("casos_por_dificultad(Orden)")["Orden"]
    casos = [c for c in orden.strip("[]").split(",") if c]

    assert sorted(casos) == CASOS
    dificultades = [
        engine.uno(f"caso({c}, _, _, D)")["D"] for c in casos
    ]
    pesos = {"facil": 1, "medio": 2, "dificil": 3}
    valores = [pesos[d] for d in dificultades]
    assert valores == sorted(valores), f"Orden no creciente: {dificultades}"


def test_70_prolog_decide_cual_es_el_siguiente_caso(engine):
    """siguiente_caso/2 falla cuando ya se jugaron todos: asi termina la campania."""
    assert engine.uno("siguiente_caso([], S)") is not None
    todos = ",".join(CASOS)
    assert engine.uno(f"siguiente_caso([{todos}], S)") is None


# ---------------------------------------------------------------------------
# Avance de la campania
# ---------------------------------------------------------------------------

def test_71_iniciar_una_campania_abre_el_primer_caso(cliente):
    datos = cliente.post("/api/multicaso").json()

    assert datos["ok"] is True
    assert datos["total"] == len(CASOS)
    assert datos["completados"] == 0
    assert datos["caso"] == datos["orden"][0]

    # La sesion creada pertenece a la campania y al caso correcto.
    sesion = cliente.get(f"/api/sesiones/{datos['sesion']}").json()["sesion"]
    assert sesion["caso"] == datos["caso"]
    assert sesion["campania"] == datos["campania"]


def test_72_no_se_puede_saltar_al_siguiente_con_una_sesion_abierta(cliente):
    """Obliga a cerrar el caso en curso antes de continuar la campania."""
    inicio = cliente.post("/api/multicaso").json()
    respuesta = cliente.post(f"/api/multicaso/{inicio['campania']}/siguiente")

    assert respuesta.status_code == 400
    assert "investigacion abierta" in respuesta.json()["error"]


def test_73_una_campania_completa_recorre_todos_los_casos(cliente):
    """Recorrido completo: se juegan los tres casos y la campania se cierra."""
    inicio = cliente.post("/api/multicaso").json()
    campania = inicio["campania"]

    _resolver(cliente, inicio["sesion"], inicio["caso"])
    vistos = [inicio["caso"]]

    for _ in range(len(CASOS) - 1):
        paso = cliente.post(f"/api/multicaso/{campania}/siguiente").json()
        assert paso["caso"] not in vistos, "Un caso no debe repetirse en la campania"
        vistos.append(paso["caso"])
        _resolver(cliente, paso["sesion"], paso["caso"])

    assert sorted(vistos) == CASOS

    estado = cliente.get(f"/api/multicaso/{campania}").json()
    assert estado["completada"] is True
    assert estado["estado"] == "completada"
    assert estado["completados"] == len(CASOS)
    assert estado["aciertos"] == len(CASOS)
    assert estado["tasa_exito"] == 100.0
    assert estado["siguiente_caso"] is None


def test_74_al_terminar_no_hay_siguiente_caso(cliente):
    inicio = cliente.post("/api/multicaso").json()
    campania = inicio["campania"]
    _resolver(cliente, inicio["sesion"], inicio["caso"])
    for _ in range(len(CASOS) - 1):
        paso = cliente.post(f"/api/multicaso/{campania}/siguiente").json()
        _resolver(cliente, paso["sesion"], paso["caso"])

    respuesta = cliente.post(f"/api/multicaso/{campania}/siguiente")
    assert respuesta.status_code == 400
    assert "recorrio todos los casos" in respuesta.json()["error"]


def test_75_la_campania_registra_aciertos_y_fallos(cliente):
    """Una acusacion equivocada baja la tasa de exito de la campania."""
    inicio = cliente.post("/api/multicaso").json()
    campania = inicio["campania"]

    _resolver(cliente, inicio["sesion"], inicio["caso"], acertar=False)
    estado = cliente.get(f"/api/multicaso/{campania}").json()

    assert estado["completados"] == 1
    assert estado["aciertos"] == 0
    assert estado["tasa_exito"] == 0.0
    assert estado["completada"] is False


def test_76_una_campania_inexistente_da_error_controlado(cliente):
    assert cliente.get("/api/multicaso/noexiste").status_code == 400


# ---------------------------------------------------------------------------
# Estadisticas de resolucion
# ---------------------------------------------------------------------------

def test_77_las_estadisticas_incluyen_todos_los_casos_cargados(cliente):
    """Un caso que nadie ha jugado aparece en cero, no desaparece."""
    datos = cliente.get("/api/estadisticas").json()

    assert sorted(f["caso"] for f in datos["por_caso"]) == CASOS
    for fila in datos["por_caso"]:
        assert fila["partidas"] == 0
        assert fila["titulo"] and fila["dificultad"]


def test_78_las_estadisticas_reflejan_las_partidas_jugadas(cliente):
    sesion = cliente.post("/api/sesiones", json={"caso": "caso1"}).json()["sesion"]
    cliente.post(f"/api/sesiones/{sesion}/pista")
    _resolver(cliente, sesion, "caso1")

    datos = cliente.get("/api/estadisticas").json()
    caso1 = next(f for f in datos["por_caso"] if f["caso"] == "caso1")

    assert caso1["partidas"] == 1
    assert caso1["cerradas"] == 1
    assert caso1["aciertos"] == 1
    assert caso1["tasa_exito"] == 100.0
    assert caso1["pistas_medias"] == 1.0
    assert caso1["puntuacion_media"] is not None
    # La duracion se mide entre el inicio y el cierre: existe y no es negativa.
    assert caso1["tiempo_medio_seg"] is not None
    assert caso1["tiempo_medio_seg"] >= 0
    assert caso1["tiempo_medio"] is not None

    assert datos["globales"]["total"] == 1
    assert datos["globales"]["resueltas"] == 1


def test_79_las_estadisticas_cuentan_las_campanias(cliente):
    inicio = cliente.post("/api/multicaso").json()
    _resolver(cliente, inicio["sesion"], inicio["caso"])

    datos = cliente.get("/api/estadisticas").json()["multicaso"]
    assert datos["campanias"] == 1
    assert datos["en_curso"] == 1
    assert datos["completadas"] == 0

    detalle = datos["detalle"][0]
    assert detalle["sesiones"] == 1
    assert detalle["aciertos"] == 1
    assert detalle["orden"] == inicio["orden"]


def test_80_las_sesiones_normales_no_pertenecen_a_ninguna_campania(cliente):
    """El modo multicaso no debe contaminar el modo de caso suelto."""
    sesion = cliente.post("/api/sesiones", json={"caso": "caso1"}).json()["sesion"]
    datos = cliente.get(f"/api/sesiones/{sesion}").json()["sesion"]
    assert datos["campania"] is None

    assert cliente.get("/api/estadisticas").json()["multicaso"]["campanias"] == 0
