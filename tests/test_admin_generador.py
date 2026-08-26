"""Pruebas del generador de casos desde JSON (opcional 9).

El generador traduce un JSON plano a hechos Prolog, valida la sintaxis en un
interprete aparte, registra el caso en el cargador y recarga el motor. La
prueba genera un caso completo, verifica que el motor lo resuelve y lo elimina
dejando la base de conocimiento como estaba.
"""

from __future__ import annotations

from app import config
from tests.conftest import CASOS

CREDENCIALES = (config.USUARIO_ADMIN, config.CLAVE_ADMIN)


def _caso_json() -> dict:
    """Un caso minimo que cumple los minimos del enunciado."""
    sospechosos = ["ana", "beto", "carla", "dario"]
    return {
        "id": "caso_generado",
        "titulo": "El expediente generado",
        "descripcion": "Caso de prueba creado por el generador JSON.",
        "dificultad": "facil",
        "incidente": {"descripcion": "Robo del sello", "lugar": "despacho", "hora": 2100},
        "ventana": [2030, 2130],
        "victima": "victor",
        "solucion": "ana",
        "personas": (
            [{"id": "victor", "nombre": "Victor Prueba", "rol": "victima"}]
            + [{"id": s, "nombre": s.capitalize(), "rol": "sospechoso"} for s in sospechosos]
            + [{"id": "toni", "nombre": "Toni Testigo", "rol": "testigo"}]
        ),
        "lugares": [
            {"id": l, "nombre": l.capitalize(), "descripcion": f"Lugar {l}."}
            for l in ["despacho", "pasillo", "archivo", "bodega", "entrada"]
        ],
        "conexiones": [
            ["entrada", "pasillo"], ["pasillo", "despacho"],
            ["pasillo", "archivo"], ["archivo", "bodega"],
        ],
        "accesos": [
            {"persona": "ana", "lugar": l, "tipo": "llave_maestra"}
            for l in ["entrada", "pasillo", "despacho", "archivo", "bodega"]
        ] + [
            {"persona": "beto", "lugar": "entrada", "tipo": "gafete"},
            {"persona": "carla", "lugar": "entrada", "tipo": "gafete"},
            {"persona": "dario", "lugar": "entrada", "tipo": "gafete"},
        ],
        "ubicaciones": [
            {"persona": "ana", "lugar": "despacho", "hora": 2100},
            {"persona": "beto", "lugar": "entrada", "hora": 2100},
            {"persona": "carla", "lugar": "bodega", "hora": 2040},
            {"persona": "dario", "lugar": "entrada", "hora": 2110},
        ],
        "eventos": [
            {"id": "ev1", "hora": 2100, "lugar": "despacho", "descripcion": "Desaparece el sello."},
        ],
        "evidencias": [
            {
                "id": f"g{n:02d}", "tipo": "indicio",
                "descripcion": f"Indicio numero {n}.",
                "lugar": "despacho", "hora": 2100,
                **({"vincula": ["ana"], "situa": {"persona": "ana", "lugar": "despacho"}} if n == 1 else {}),
            }
            for n in range(1, 11)
        ],
        "declaraciones": [
            {
                "id": f"dec{n}", "autor": autor, "texto": f"Declaracion {n}.",
                "afirmaciones": (
                    [{"tipo": "no_estuvo", "persona": "ana", "lugar": "despacho", "hora": 2100}]
                    if n == 1 else []
                ),
            }
            for n, autor in enumerate(["ana", "beto", "carla", "dario", "toni"], start=1)
        ],
        "coartadas": [
            {"persona": "beto", "lugar": "entrada", "hora": 2100, "testigo": "toni"},
        ],
        "motivos": [
            {"persona": "ana", "tipo": "financiero", "descripcion": "Debe dinero."},
        ],
        "medios_requeridos": ["llave_del_sello"],
        "medios": [{"persona": "ana", "medio": "llave_del_sello"}],
        "relaciones": [{"a": "ana", "b": "victor", "tipo": "deuda"}],
        "reglas": [
            {"id": f"gr{n:02d}", "nombre": f"Regla {n}", "descripcion": f"Descripcion {n}."}
            for n in range(1, 11)
        ],
    }


def test_53_el_generador_crea_un_caso_desde_json_y_el_motor_lo_resuelve(cliente):
    respuesta = cliente.post(
        "/api/admin/casos/generar", json=_caso_json(), auth=CREDENCIALES
    )
    try:
        assert respuesta.status_code == 200, respuesta.text
        datos = respuesta.json()
        assert datos["ok"] is True
        assert datos["cumple_minimos"] is True
        assert "caso_generado" in datos["casos"]

        # El caso queda disponible para investigar de inmediato.
        listado = cliente.get("/api/casos").json()["casos"]
        assert any(c["Id"] == "caso_generado" for c in listado)

        # Y el motor deduce sobre el: ana reune pilares y no tiene coartada.
        from app.prolog.engine import obtener_engine
        engine = obtener_engine()
        assert engine.es_cierto("tiene_acceso(caso_generado, ana)")
        assert engine.es_cierto("tuvo_oportunidad(caso_generado, ana)")
        assert engine.es_cierto("mintio(caso_generado, ana)")
    finally:
        cliente.post(
            "/api/admin/casos/eliminar",
            json={"archivo": "caso_generado.pl"},
            auth=CREDENCIALES,
        )

    # Tras eliminarlo, la base vuelve a los tres casos originales.
    restantes = cliente.get("/api/casos").json()["casos"]
    assert sorted(c["Id"] for c in restantes) == CASOS


def test_54_el_generador_rechaza_identificadores_invalidos(cliente):
    malo = _caso_json()
    malo["id"] = "caso); halt; %"
    respuesta = cliente.post("/api/admin/casos/generar", json=malo, auth=CREDENCIALES)
    assert respuesta.status_code == 400


def test_55_el_generador_exige_autenticacion(cliente):
    respuesta = cliente.post("/api/admin/casos/generar", json=_caso_json())
    assert respuesta.status_code == 401


# ---------------------------------------------------------------------------
# Creacion de un caso vacio desde el formulario del panel
# ---------------------------------------------------------------------------

def test_56_crear_caso_registra_el_esqueleto_y_lo_deja_visible(cliente):
    """El caso nuevo debe aparecer en el panel, aunque este incompleto.

    Regresion: el servicio escribia el .pl pero no anadia su ensure_loaded al
    cargador, asi que el motor nunca veia el caso. La creacion devolvia 200, la
    interfaz no mostraba error y el caso simplemente no aparecia por ninguna
    parte.
    """
    nuevo = {
        "caso": "caso_esqueleto",
        "titulo": "El expediente en blanco",
        "descripcion": "Creado desde el formulario del panel.",
        "dificultad": "facil",
    }
    respuesta = cliente.post("/api/admin/casos", json=nuevo, auth=CREDENCIALES)
    try:
        assert respuesta.status_code == 200, respuesta.text
        datos = respuesta.json()
        assert datos["archivo"] == "caso_esqueleto.pl"
        assert "caso_esqueleto" in datos["casos"]

        # La plantilla trae sospechosos y lugares, pero no evidencias ni reglas:
        # el panel debe poder mostrarla marcada como incompleta.
        assert datos["cumple_minimos"] is False
        assert int(datos["conteo"]["S"]) >= 4

        listado = cliente.get("/api/admin/casos", auth=CREDENCIALES).json()["casos"]
        creado = next((c for c in listado if c["Id"] == "caso_esqueleto"), None)
        assert creado is not None
        assert creado["archivo"] == "caso_esqueleto.pl"
        assert creado["cumple"] is False
    finally:
        cliente.post(
            "/api/admin/casos/eliminar",
            json={"archivo": "caso_esqueleto.pl"},
            auth=CREDENCIALES,
        )

    restantes = cliente.get("/api/casos").json()["casos"]
    assert sorted(c["Id"] for c in restantes) == CASOS


def test_57_crear_caso_rechaza_los_datos_invalidos_con_un_mensaje(cliente):
    """Un identificador o una dificultad invalidos deben explicar el motivo."""
    base = {
        "caso": "caso_esqueleto",
        "titulo": "El expediente en blanco",
        "descripcion": "",
        "dificultad": "facil",
    }

    malo = {**base, "caso": "Caso Con Espacios"}
    respuesta = cliente.post("/api/admin/casos", json=malo, auth=CREDENCIALES)
    assert respuesta.status_code == 400
    assert "identificador" in respuesta.json()["error"].lower()

    sin_titulo = {**base, "titulo": "   "}
    respuesta = cliente.post("/api/admin/casos", json=sin_titulo, auth=CREDENCIALES)
    assert respuesta.status_code == 400
    assert "titulo" in respuesta.json()["error"].lower()

    dificultad_mala = {**base, "dificultad": "imposible"}
    respuesta = cliente.post("/api/admin/casos", json=dificultad_mala, auth=CREDENCIALES)
    assert respuesta.status_code == 400

    duplicado = {**base, "caso": "caso1"}
    respuesta = cliente.post("/api/admin/casos", json=duplicado, auth=CREDENCIALES)
    assert respuesta.status_code == 400

    # Ninguno de los rechazos debe haber dejado archivos sueltos.
    archivos = cliente.get("/api/admin/archivos", auth=CREDENCIALES).json()["archivos"]
    assert "caso_esqueleto.pl" not in archivos


# ---------------------------------------------------------------------------
# Casos de ejemplo en JSON (datos/ejemplos/)
# ---------------------------------------------------------------------------

def test_58_los_ejemplos_json_se_listan_y_generan_un_caso_resoluble(cliente):
    """El panel ofrece JSON de ejemplo listos para probar el generador."""
    import json

    listado = cliente.get("/api/admin/ejemplos", auth=CREDENCIALES)
    assert listado.status_code == 200
    ejemplos = {e["archivo"]: e for e in listado.json()["ejemplos"]}
    assert "caso_biblioteca.json" in ejemplos
    assert ejemplos["caso_biblioteca.json"]["id"] == "caso_biblioteca"

    contenido = cliente.get(
        "/api/admin/ejemplos/caso_biblioteca.json", auth=CREDENCIALES
    ).json()["contenido"]
    caso = json.loads(contenido)

    respuesta = cliente.post("/api/admin/casos/generar", json=caso, auth=CREDENCIALES)
    try:
        assert respuesta.status_code == 200, respuesta.text
        assert respuesta.json()["cumple_minimos"] is True

        from app.prolog.engine import obtener_engine
        engine = obtener_engine()
        assert engine.es_cierto("responsable(caso_biblioteca, duarte)")
        assert engine.es_cierto("coartada_valida(caso_biblioteca, salazar)")
        assert engine.es_cierto("mintio(caso_biblioteca, duarte)")
    finally:
        cliente.post(
            "/api/admin/casos/eliminar",
            json={"archivo": "caso_biblioteca.pl"},
            auth=CREDENCIALES,
        )


def test_59_el_ejemplo_invalido_devuelve_un_error_explicado(cliente):
    """caso_invalido.json existe para comprobar el camino de error del panel."""
    import json

    contenido = cliente.get(
        "/api/admin/ejemplos/caso_invalido.json", auth=CREDENCIALES
    ).json()["contenido"]

    respuesta = cliente.post(
        "/api/admin/casos/generar", json=json.loads(contenido), auth=CREDENCIALES
    )
    assert respuesta.status_code == 400
    assert "hora" in respuesta.json()["error"].lower()


def test_60_los_ejemplos_no_permiten_salir_de_su_carpeta(cliente):
    """El nombre del ejemplo se limita a datos/ejemplos/."""
    respuesta = cliente.get(
        "/api/admin/ejemplos/inexistente.json", auth=CREDENCIALES
    )
    assert respuesta.status_code == 400
    assert cliente.get("/api/admin/ejemplos").status_code == 401


def test_61_regenerar_un_caso_borrado_vuelve_a_cargar_sus_hechos(cliente):
    """Borrar un caso y volver a generarlo con el mismo id debe recargarlo.

    Regresion: con el backend PySwip el interprete vive dentro del proceso, y
    ensure_loaded/1 no relee un archivo que ya figura en el registro de fuentes
    — ni siquiera despues de retractar sus clausulas. La directiva del cargador
    se volvia un no-op y el caso quedaba declarado pero sin un solo hecho, de
    modo que dejaba de cumplir los minimos. El backend de subproceso ocultaba
    el fallo, porque arranca un interprete limpio en cada consulta.
    """
    caso = _caso_json()

    primera = cliente.post("/api/admin/casos/generar", json=caso, auth=CREDENCIALES)
    assert primera.status_code == 200, primera.text
    assert primera.json()["cumple_minimos"] is True

    cliente.post(
        "/api/admin/casos/eliminar",
        json={"archivo": "caso_generado.pl"},
        auth=CREDENCIALES,
    )

    segunda = cliente.post("/api/admin/casos/generar", json=caso, auth=CREDENCIALES)
    assert segunda.status_code == 200, segunda.text
    assert segunda.json()["conteo"] == primera.json()["conteo"]
    assert segunda.json()["cumple_minimos"] is True

    cliente.post(
        "/api/admin/casos/eliminar",
        json={"archivo": "caso_generado.pl"},
        auth=CREDENCIALES,
    )
