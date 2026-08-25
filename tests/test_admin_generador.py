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
