"""Pruebas de la aplicacion: API, descubrimiento progresivo y bitacora.

Verifican la integracion completa Python-Prolog y las reglas del modulo de
investigacion, incluida la mas delicada: que el detective no pueda ver
informacion que todavia no ha descubierto.
"""

from __future__ import annotations

import pytest

from app import config
from tests.conftest import CASOS, SOLUCIONES


def _abrir(cliente, caso: str) -> str:
    respuesta = cliente.post("/api/sesiones", json={"caso": caso})
    assert respuesta.status_code == 200
    return respuesta.json()["sesion"]


# ---------------------------------------------------------------------------
# Estado del sistema
# ---------------------------------------------------------------------------

def test_29_la_sonda_de_salud_confirma_el_puente_con_prolog(cliente):
    datos = cliente.get("/api/salud").json()
    assert datos["ok"] is True
    assert datos["backend"] in {"pyswip", "subprocess"}
    assert sorted(datos["casos"]) == CASOS


def test_30_la_pantalla_de_inicio_lista_los_casos_con_su_estado(cliente):
    respuesta = cliente.get("/")
    assert respuesta.status_code == 200
    assert "Logic Detective" in respuesta.text
    assert "El Codice de Jade" in respuesta.text


# ---------------------------------------------------------------------------
# Descubrimiento progresivo
# ---------------------------------------------------------------------------

def test_31_al_iniciar_no_hay_ninguna_evidencia_descubierta(cliente):
    """El enunciado exige que la informacion se descubra progresivamente."""
    sesion = _abrir(cliente, "caso1")
    evidencias = cliente.get(f"/api/sesiones/{sesion}/evidencias").json()["evidencias"]
    assert evidencias == []


def test_32_investigar_un_lugar_revela_solo_sus_evidencias(cliente):
    sesion = _abrir(cliente, "caso1")
    datos = cliente.post(f"/api/sesiones/{sesion}/lugares/deposito").json()
    halladas = {e["Id"] for e in datos["evidencias"]}

    assert halladas == {"e04", "e06", "e08"}, "Solo las evidencias del deposito"

    visibles = cliente.get(f"/api/sesiones/{sesion}/evidencias").json()["evidencias"]
    assert {e["Id"] for e in visibles} == halladas


def test_33_no_se_puede_examinar_una_evidencia_no_hallada(cliente):
    """Examinar algo que no se ha encontrado debe rechazarse, no filtrarse."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.post(f"/api/sesiones/{sesion}/evidencias/e01")
    assert respuesta.status_code == 400
    assert "Todavia no has encontrado" in respuesta.json()["error"]


def test_34_las_contradicciones_solo_aparecen_entre_lo_ya_descubierto(cliente):
    """La prueba clave del descubrimiento progresivo.

    El filtrado ocurre en Prolog, que recibe las listas de elementos conocidos.
    """
    sesion = _abrir(cliente, "caso1")
    ruta = f"/api/sesiones/{sesion}/contradicciones"

    assert cliente.get(ruta).json()["contradicciones"] == []

    # Con una sola declaracion no hay con que contrastar.
    cliente.post(f"/api/sesiones/{sesion}/interrogar/marco")
    assert cliente.get(ruta).json()["contradicciones"] == []

    # La segunda declaracion ya permite detectar el choque entre testimonios.
    cliente.post(f"/api/sesiones/{sesion}/interrogar/nadia")
    solo_declaraciones = cliente.get(ruta).json()["contradicciones"]
    assert len(solo_declaraciones) >= 1
    assert all(c["Tipo"] == "entre_declaraciones" for c in solo_declaraciones)

    # Al hallar la evidencia del vestibulo aparece el choque con la evidencia.
    cliente.post(f"/api/sesiones/{sesion}/lugares/vestibulo")
    con_evidencia = cliente.get(ruta).json()["contradicciones"]
    assert len(con_evidencia) > len(solo_declaraciones)
    assert any(c["Tipo"] == "declaracion_vs_evidencia" for c in con_evidencia)


def test_35_los_motivos_exigen_haber_interrogado_antes(cliente):
    sesion = _abrir(cliente, "caso1")
    assert cliente.get(f"/api/sesiones/{sesion}/motivos").json()["motivos"] == []

    cliente.post(f"/api/sesiones/{sesion}/interrogar/marco")
    motivos = cliente.get(f"/api/sesiones/{sesion}/motivos").json()["motivos"]
    assert any(m["Persona"] == "marco" for m in motivos)


def test_36_la_linea_temporal_se_construye_con_lo_investigado(cliente):
    sesion = _abrir(cliente, "caso1")
    assert cliente.get(f"/api/sesiones/{sesion}/linea-temporal").json()["eventos"] == []

    cliente.post(f"/api/sesiones/{sesion}/lugares/sala_jade")
    eventos = cliente.get(f"/api/sesiones/{sesion}/linea-temporal").json()["eventos"]
    assert len(eventos) >= 1
    horas = [e["HoraTexto"] for e in eventos]
    assert horas == sorted(horas), "Los eventos deben salir en orden cronologico"


# ---------------------------------------------------------------------------
# Bitacora
# ---------------------------------------------------------------------------

def test_37_toda_accion_queda_registrada_en_la_bitacora(cliente):
    """El enunciado exige que CADA accion del usuario quede registrada."""
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/interrogar/marco")
    cliente.post(f"/api/sesiones/{sesion}/lugares/vestibulo")
    cliente.get(f"/api/sesiones/{sesion}/coartadas")
    cliente.post(f"/api/sesiones/{sesion}/pista")

    acciones = [b["accion"] for b in cliente.get(f"/api/sesiones/{sesion}/bitacora").json()["bitacora"]]
    for esperada in ("iniciar_investigacion", "interrogar", "investigar_lugar",
                     "revisar_coartadas", "solicitar_pista"):
        assert esperada in acciones


# ---------------------------------------------------------------------------
# Resolucion
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("caso", CASOS)
def test_38_acusar_al_culpable_da_veredicto_correcto(cliente, caso):
    sesion = _abrir(cliente, caso)
    resultado = cliente.post(
        f"/api/sesiones/{sesion}/acusar", json={"acusado": SOLUCIONES[caso]}
    ).json()["resultado"]

    assert resultado["veredicto"] == "correcto"
    assert resultado["responsable"] == SOLUCIONES[caso]


def test_39_acusar_a_un_inocente_da_veredicto_incorrecto(cliente):
    sesion = _abrir(cliente, "caso1")
    resultado = cliente.post(
        f"/api/sesiones/{sesion}/acusar", json={"acusado": "elena"}
    ).json()["resultado"]

    assert resultado["veredicto"] == "incorrecto"
    assert resultado["responsable"] == "marco"


def test_40_no_se_puede_acusar_dos_veces(cliente):
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "marco"})
    segunda = cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "elena"})
    assert segunda.status_code == 400


def test_41_no_se_puede_acusar_a_quien_no_es_sospechoso(cliente):
    """Julio es testigo y complice, pero no figura como sospechoso."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "julio"})
    assert respuesta.status_code == 400


def test_42_el_informe_final_incluye_la_cadena_deductiva(cliente):
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "marco"})
    informe = cliente.get(f"/api/sesiones/{sesion}/informe").json()["informe"]

    assert informe["conclusion"]["Responsable"] == "marco"
    assert len(informe["ranking"]) == 4
    assert len(informe["reglas"]) >= 8
    assert len(informe["contradicciones"]) >= 1
    assert len(informe["complices"]) >= 1
    assert len(informe["bitacora"]) >= 2


def test_43_la_pagina_del_informe_se_renderiza(cliente):
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "marco"})
    respuesta = cliente.get(f"/investigacion/{sesion}/informe")
    assert respuesta.status_code == 200
    assert "Acusacion correcta" in respuesta.text


# ---------------------------------------------------------------------------
# Pistas
# ---------------------------------------------------------------------------

def test_44_las_pistas_se_entregan_en_orden_y_se_agotan(cliente):
    sesion = _abrir(cliente, "caso1")
    textos = []
    for numero in range(1, 6):
        pista = cliente.post(f"/api/sesiones/{sesion}/pista").json()["pista"]
        assert pista["numero"] == numero
        textos.append(pista["texto"])

    assert len(set(textos)) == 5, "Cada pista debe revelar algo distinto"
    agotada = cliente.post(f"/api/sesiones/{sesion}/pista").json()["pista"]
    assert agotada["texto"] is None


# ---------------------------------------------------------------------------
# Interfaz web
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "seccion",
    ["resumen", "sospechosos", "interrogatorios", "lugares", "evidencias",
     "relaciones", "analisis", "coartadas", "tiempo", "contradicciones",
     "sospecha", "explicacion", "bitacora", "acusacion"],
)
def test_45_todas_las_secciones_del_panel_responden(cliente, seccion):
    """Las catorce vistas que cubren las dieciseis acciones del enunciado."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.get(f"/investigacion/{sesion}?seccion={seccion}")
    assert respuesta.status_code == 200


def test_46_una_sesion_inexistente_da_error_controlado(cliente):
    respuesta = cliente.get("/investigacion/noexiste")
    assert respuesta.status_code == 400


# ---------------------------------------------------------------------------
# Seguridad
# ---------------------------------------------------------------------------

def test_47_el_modulo_administrativo_exige_autenticacion(cliente):
    # Las credenciales se leen de la configuracion, no se escriben aqui: asi
    # rotar la clave de administracion no rompe la suite.
    assert cliente.get("/admin").status_code == 401
    assert cliente.get("/admin", auth=("intruso", "clave_falsa")).status_code == 401
    credenciales = (config.USUARIO_ADMIN, config.CLAVE_ADMIN)
    assert cliente.get("/admin", auth=credenciales).status_code == 200


def test_48_no_se_puede_inyectar_una_meta_prolog(cliente):
    """Los identificadores que llegan del usuario se validan como atomos."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.post(f"/api/sesiones/{sesion}/interrogar/marco),halt,foo(")
    assert respuesta.status_code in (400, 404)


def test_49_el_panel_administrativo_valida_los_minimos_de_cada_caso(cliente):
    for caso in CASOS:
        datos = cliente.get(f"/api/casos/{caso}/minimos").json()
        assert datos["cumple"] is True
