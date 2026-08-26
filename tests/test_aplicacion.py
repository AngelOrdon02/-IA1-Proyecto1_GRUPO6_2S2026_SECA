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
    """La interfaz es una SPA: los casos los entrega la API, no el HTML."""
    datos = cliente.get("/api/casos").json()
    assert datos["ok"] is True
    titulos = {c["Titulo"] for c in datos["casos"]}
    assert titulos == {
        "La Sonrisa Robada",
        "Sombras de Whitechapel",
        "La Ultima Noche de Rasputin",
    }


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
    datos = cliente.post(f"/api/sesiones/{sesion}/lugares/almacen_esculturas").json()
    halladas = {e["Id"] for e in datos["evidencias"]}

    assert halladas == {"e04", "e06", "e08"}, "Solo las evidencias del almacen_esculturas"

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
    cliente.post(f"/api/sesiones/{sesion}/interrogar/peruggia")
    assert cliente.get(ruta).json()["contradicciones"] == []

    # La segunda declaracion ya permite detectar el choque entre testimonios.
    cliente.post(f"/api/sesiones/{sesion}/interrogar/paupardin")
    solo_declaraciones = cliente.get(ruta).json()["contradicciones"]
    assert len(solo_declaraciones) >= 1
    assert all(c["Tipo"] == "entre_declaraciones" for c in solo_declaraciones)

    # Al hallar la evidencia del gran_galeria aparece el choque con la evidencia.
    cliente.post(f"/api/sesiones/{sesion}/lugares/gran_galeria")
    con_evidencia = cliente.get(ruta).json()["contradicciones"]
    assert len(con_evidencia) > len(solo_declaraciones)
    assert any(c["Tipo"] == "declaracion_vs_evidencia" for c in con_evidencia)


def test_35_los_motivos_exigen_haber_interrogado_antes(cliente):
    sesion = _abrir(cliente, "caso1")
    assert cliente.get(f"/api/sesiones/{sesion}/motivos").json()["motivos"] == []

    cliente.post(f"/api/sesiones/{sesion}/interrogar/peruggia")
    motivos = cliente.get(f"/api/sesiones/{sesion}/motivos").json()["motivos"]
    assert any(m["Persona"] == "peruggia" for m in motivos)


def test_36_la_linea_temporal_se_construye_con_lo_investigado(cliente):
    sesion = _abrir(cliente, "caso1")
    assert cliente.get(f"/api/sesiones/{sesion}/linea-temporal").json()["eventos"] == []

    cliente.post(f"/api/sesiones/{sesion}/lugares/salon_carre")
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
    cliente.post(f"/api/sesiones/{sesion}/interrogar/peruggia")
    cliente.post(f"/api/sesiones/{sesion}/lugares/gran_galeria")
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
        f"/api/sesiones/{sesion}/acusar", json={"acusado": "pieret"}
    ).json()["resultado"]

    assert resultado["veredicto"] == "incorrecto"
    assert resultado["responsable"] == "peruggia"


def test_40_no_se_puede_acusar_dos_veces(cliente):
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "peruggia"})
    segunda = cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "pieret"})
    assert segunda.status_code == 400


def test_41_no_se_puede_acusar_a_quien_no_es_sospechoso(cliente):
    """Lancelotti es testigo y complice, pero no figura como sospechoso."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "lancelotti"})
    assert respuesta.status_code == 400


def test_42_el_informe_final_incluye_la_cadena_deductiva(cliente):
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "peruggia"})
    informe = cliente.get(f"/api/sesiones/{sesion}/informe").json()["informe"]

    assert informe["conclusion"]["Responsable"] == "peruggia"
    assert len(informe["ranking"]) == 4
    assert len(informe["reglas"]) >= 8
    assert len(informe["contradicciones"]) >= 1
    assert len(informe["complices"]) >= 1
    assert len(informe["bitacora"]) >= 2


def test_43_la_pagina_del_informe_se_renderiza(cliente):
    """El informe imprimible refleja el caso y su veredicto."""
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "peruggia"})
    respuesta = cliente.get(f"/api/sesiones/{sesion}/informe/imprimir")
    assert respuesta.status_code == 200
    assert "La Sonrisa Robada" in respuesta.text
    assert "Vincenzo Peruggia" in respuesta.text


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
# Interfaz: endpoints que alimentan cada seccion del panel
# ---------------------------------------------------------------------------
#
# La interfaz migro de plantillas Jinja a una SPA de React. Comprobar el HTML
# de "/investigacion/{sesion}?seccion=X" dejo de tener sentido: el comodin de
# la SPA devuelve 200 para cualquier ruta, asi que la prueba pasaria aunque el
# backend estuviera roto.
#
# Se verifica en su lugar el endpoint de API que alimenta cada seccion, que es
# donde de verdad vive la respuesta del motor de inferencia.

# (seccion del panel, endpoint que la alimenta)
SECCIONES_DEL_PANEL = [
    ("resumen",          "/api/casos/caso1"),
    ("sospechosos",      "/api/sesiones/{s}/sospechosos"),
    ("lugares",          "/api/sesiones/{s}/lugares"),
    ("evidencias",       "/api/sesiones/{s}/evidencias"),
    ("relaciones",       "/api/sesiones/{s}/relaciones"),
    ("motivos",          "/api/sesiones/{s}/motivos"),
    ("oportunidades",    "/api/sesiones/{s}/oportunidades"),
    ("coartadas",        "/api/sesiones/{s}/coartadas"),
    ("tiempo",           "/api/sesiones/{s}/linea-temporal"),
    ("contradicciones",  "/api/sesiones/{s}/contradicciones"),
    ("sospecha",         "/api/sesiones/{s}/sospecha"),
    ("explicacion",      "/api/sesiones/{s}/explicacion"),
    ("bitacora",         "/api/sesiones/{s}/bitacora"),
    ("grafo",            "/api/sesiones/{s}/grafo"),
    ("informe",          "/api/sesiones/{s}/informe"),
]


@pytest.mark.parametrize(
    "seccion,plantilla_ruta",
    SECCIONES_DEL_PANEL,
    ids=[nombre for nombre, _ in SECCIONES_DEL_PANEL],
)
def test_45_cada_seccion_del_panel_tiene_su_endpoint(cliente, seccion, plantilla_ruta):
    """Las secciones que cubren las 16 acciones del enunciado responden."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.get(plantilla_ruta.format(s=sesion))

    assert respuesta.status_code == 200, f"La seccion '{seccion}' no responde"
    cuerpo = respuesta.json()
    assert cuerpo.get("ok") is True, f"La seccion '{seccion}' devolvio ok=false"


def test_45b_la_spa_se_sirve_en_las_rutas_del_navegador(cliente):
    """El comodin de la SPA atiende las rutas de React, pero no las de la API.

    Es la contraparte del cambio anterior: se comprueba que el fallback existe
    y, sobre todo, que NO se traga las rutas de API inexistentes, porque eso
    convertiria un 404 legitimo en un 200 con HTML.
    """
    inexistente = cliente.get("/api/ruta/que/no/existe")
    assert inexistente.status_code == 404
    assert "text/html" not in inexistente.headers.get("content-type", "")


def test_46_una_sesion_inexistente_da_error_controlado(cliente):
    respuesta = cliente.get("/api/sesiones/noexiste/bitacora")
    assert respuesta.status_code == 400


# ---------------------------------------------------------------------------
# Seguridad
# ---------------------------------------------------------------------------

def test_47_el_modulo_administrativo_exige_autenticacion(cliente):
    # Las credenciales se leen de la configuracion, no se escriben aqui: asi
    # rotar la clave de administracion no rompe la suite.
    assert cliente.get("/api/admin/casos").status_code == 401
    assert cliente.get("/api/admin/casos", auth=("intruso", "clave_falsa")).status_code == 401
    credenciales = (config.USUARIO_ADMIN, config.CLAVE_ADMIN)
    assert cliente.get("/api/admin/casos", auth=credenciales).status_code == 200


def test_48_no_se_puede_inyectar_una_meta_prolog(cliente):
    """Los identificadores que llegan del usuario se validan como atomos."""
    sesion = _abrir(cliente, "caso1")
    respuesta = cliente.post(f"/api/sesiones/{sesion}/interrogar/peruggia),halt,foo(")
    assert respuesta.status_code in (400, 404)


def test_49_el_panel_administrativo_valida_los_minimos_de_cada_caso(cliente):
    for caso in CASOS:
        datos = cliente.get(f"/api/casos/{caso}/minimos").json()
        assert datos["cumple"] is True


# ---------------------------------------------------------------------------
# Opcionales 6, 7, 8
# ---------------------------------------------------------------------------

def test_50_el_grafo_de_relaciones_incluye_sospechosos_y_evidencias(cliente):
    """Opcional 6: Grafo de relaciones entre sospechosos y evidencias."""
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/lugares/almacen_esculturas")

    datos = cliente.get(f"/api/sesiones/{sesion}/grafo").json()
    assert datos["ok"] is True
    grafo = datos["grafo"]

    tipos_nodos = {n["tipo"] for n in grafo["nodos"]}
    assert "sospechoso" in tipos_nodos
    assert "evidencia" in tipos_nodos

    # Verificar que los enlaces vinculan personas o evidencias
    assert len(grafo["enlaces"]) >= 1
    tipos_enlaces = {e["tipo"] for e in grafo["enlaces"]}
    assert any(t in tipos_enlaces for t in ("evidencia_vinculo", "relacion_personal"))


def test_51_la_vista_imprimible_del_informe_devuelve_html_completo(cliente):
    """Opcional 7: Exportación del informe en formato PDF / HTML imprimible."""
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "peruggia"})

    respuesta = cliente.get(f"/api/sesiones/{sesion}/informe/imprimir")
    assert respuesta.status_code == 200
    assert "text/html" in respuesta.headers.get("content-type", "")
    assert "Informe Final" in respuesta.text
    assert "Ranking de Sospecha" in respuesta.text
    assert "Cadena Deductiva" in respuesta.text
    assert "window.print()" in respuesta.text


def test_52_el_historial_calcula_estadisticas_y_permite_filtrar(cliente):
    """Opcional 8: Historial de investigaciones resueltas con filtros y estadísticas."""
    sesion = _abrir(cliente, "caso1")
    cliente.post(f"/api/sesiones/{sesion}/acusar", json={"acusado": "peruggia"})

    historial = cliente.get("/api/historial").json()
    assert historial["ok"] is True
    assert len(historial["sesiones"]) >= 1

    stats = historial["estadisticas"]
    assert "total" in stats
    assert "resueltas" in stats
    assert "tasa_exito" in stats

    # Modo multicaso: estadisticas de resolucion desglosadas por caso.
    por_caso = {c["caso"]: c for c in stats["por_caso"]}
    assert "caso1" in por_caso
    assert por_caso["caso1"]["correctas"] >= 1

    # Filtro por caso
    filtrado_caso = cliente.get("/api/historial?caso=caso1").json()
    assert all(s["caso"] == "caso1" for s in filtrado_caso["sesiones"])

    # Filtro por veredicto
    filtrado_veredicto = cliente.get("/api/historial?veredicto=correcto").json()
    assert all(s["veredicto"] == "correcto" for s in filtrado_veredicto["sesiones"])


def test_61_la_base_de_datos_migra_desde_un_esquema_antiguo(tmp_path, monkeypatch):
    """Arrancar sobre una base ya existente no debe romperse.

    Regresion: la columna sesiones.campania (modo multicaso) llega por ALTER
    TABLE, pero el indice que la usa vivia dentro del script de esquema, que se
    ejecuta ANTES de las migraciones. En una base creada por una version previa
    el CREATE TABLE IF NOT EXISTS no hace nada, la columna aun no existe y el
    arranque moria con "no such column: campania". La suite no lo veia porque
    cada ejecucion parte de una base vacia.
    """
    import sqlite3

    from app import config
    from app.storage import db

    ruta = tmp_path / "antigua.db"
    monkeypatch.setattr(config, "RUTA_BD", ruta)

    # Base con el esquema anterior: sesiones sin puntuacion, tiempo_inicio ni
    # campania, y sin la tabla de campanias.
    con = sqlite3.connect(ruta)
    con.executescript(
        """
        CREATE TABLE sesiones (
            id        TEXT PRIMARY KEY,
            caso      TEXT NOT NULL,
            iniciada  TEXT NOT NULL,
            estado    TEXT NOT NULL DEFAULT 'en_curso',
            acusado   TEXT,
            veredicto TEXT,
            pistas    INTEGER NOT NULL DEFAULT 0,
            cerrada   TEXT
        );
        INSERT INTO sesiones (id, caso, iniciada)
        VALUES ('vieja', 'caso1', '2026-01-01T00:00:00+00:00');
        """
    )
    con.commit()
    con.close()

    db.inicializar()

    con = sqlite3.connect(ruta)
    columnas = {fila[1] for fila in con.execute("PRAGMA table_info(sesiones)")}
    indices = {fila[1] for fila in con.execute("PRAGMA index_list(sesiones)")}
    con.close()

    assert {"puntuacion", "tiempo_inicio", "campania"} <= columnas
    assert "idx_sesiones_campania" in indices

    # Y la sesion que ya existia sigue ahi: migrar no puede perder datos.
    assert any(s["id"] == "vieja" for s in db.listar_sesiones(limite=10))
