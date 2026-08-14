"""Pruebas del motor de inferencia en Prolog.

Cubren las dieciseis inferencias minimas que exige el enunciado y los minimos
de contenido de cada caso.

El objetivo SMART del enunciado pide "al menos diez casos de prueba,
resolviendo correctamente al menos el 80 % de las consultas evaluadas".
Este archivo aporta la mayor parte de esa cobertura.
"""

from __future__ import annotations

import pytest

from tests.conftest import CASOS, SOLUCIONES

# ---------------------------------------------------------------------------
# 1. Carga de la base de conocimiento
# ---------------------------------------------------------------------------

def test_01_la_base_de_conocimiento_carga_los_tres_casos(engine):
    """La KB debe exponer exactamente los tres casos del enunciado.

    Vale la pena comprobarlo explicitamente: si la ruta contiene corchetes,
    consult/1 puede tener exito sin cargar nada (ver app/prolog/engine.py).
    """
    casos = engine.valores("caso(Id, _, _, _)", "Id")
    assert sorted(casos) == CASOS


@pytest.mark.parametrize("caso", CASOS)
def test_02_cada_caso_cumple_los_minimos_del_enunciado(engine, caso):
    """4 sospechosos, 10 evidencias, 5 lugares, 5 declaraciones, 10 reglas."""
    fila = engine.uno(
        f"conteo_caso({caso}, conteo(Sospechosos, Evidencias, Lugares, "
        f"Declaraciones, Reglas))"
    )
    assert int(fila["Sospechosos"]) >= 4
    assert int(fila["Evidencias"]) >= 10
    assert int(fila["Lugares"]) >= 5
    assert int(fila["Declaraciones"]) >= 5
    assert int(fila["Reglas"]) >= 10
    assert engine.es_cierto(f"cumple_minimos({caso})")


# ---------------------------------------------------------------------------
# 2. Los cuatro pilares (inferencias 1 a 4)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("caso", CASOS)
def test_03_el_responsable_reune_los_cuatro_pilares(engine, caso):
    """Acceso, oportunidad, motivo y medios deben sostenerse para el culpable."""
    culpable = SOLUCIONES[caso]
    assert engine.es_cierto(f"tiene_acceso({caso}, {culpable})")
    assert engine.es_cierto(f"tuvo_oportunidad({caso}, {culpable})")
    assert engine.es_cierto(f"tiene_medios({caso}, {culpable})")
    assert engine.es_cierto(
        f"( tiene_motivo({caso}, {culpable}) ; motivo_derivado({caso}, {culpable}, _) )"
    )


def test_04_el_acceso_respeta_los_permisos_de_cada_lugar(engine):
    """El acceso no es mera conectividad fisica del grafo de lugares.

    Tomas Iriarte puede caminar del jardin a la Sala Jade, pero no esta
    autorizado a entrar: alcanzable_por/5 solo atraviesa lugares permitidos.
    """
    assert engine.es_cierto("alcanzable(caso1, jardin, sala_jade, [jardin])")
    assert not engine.es_cierto("tiene_acceso(caso1, tomas)")
    assert engine.es_cierto("tiene_acceso(caso1, marco)")


def test_05_la_oportunidad_exige_cercania_y_ventana_temporal(engine):
    """Estar lejos del lugar durante la ventana no da oportunidad."""
    assert engine.es_cierto("tuvo_oportunidad(caso1, marco)")
    assert not engine.es_cierto("tuvo_oportunidad(caso1, tomas)")
    assert not engine.es_cierto("tuvo_oportunidad(caso2, sr_hugo)")


def test_06_los_medios_exigen_todos_los_requeridos(engine):
    """posee_todos/3 recorre la lista completa de medios necesarios."""
    assert engine.es_cierto("tiene_medios(caso1, marco)")
    assert not engine.es_cierto("tiene_medios(caso1, elena)")
    faltantes = engine.uno("medios_faltantes(caso1, nadia, Faltan)")
    assert "codigo_alarma" in faltantes["Faltan"]
    assert "llave_vitrina" in faltantes["Faltan"]


# ---------------------------------------------------------------------------
# 3. Coartadas (inferencias 5 y 6)
# ---------------------------------------------------------------------------

def test_07_una_coartada_de_testigo_fiable_es_valida(engine):
    """Elena queda descartada porque Rosa, testigo no sospechosa, la respalda."""
    assert engine.es_cierto("coartada_valida(caso1, elena)")
    assert engine.es_cierto("descartado(caso1, elena, coartada_valida)")


def test_08_una_coartada_se_invalida_por_cuatro_vias_distintas(engine):
    """Sin coartada, testigo sospechoso, testigo mentiroso o evidencia que refuta."""
    razones_marco = engine.valores("coartada_invalida(caso1, marco, R)", "R")
    assert any("testigo_mintio" in r for r in razones_marco)
    assert any("refutada_por_evidencia" in r for r in razones_marco)

    razones_nadia = engine.valores("coartada_invalida(caso1, nadia, R)", "R")
    assert any("testigo_es_sospechoso" in r for r in razones_nadia)

    razones_pablo = engine.valores("coartada_invalida(caso2, enf_pablo, R)", "R")
    assert "sin_coartada" in razones_pablo


@pytest.mark.parametrize("caso", CASOS)
def test_09_el_responsable_no_tiene_coartada_valida(engine, caso):
    assert not engine.es_cierto(f"coartada_valida({caso}, {SOLUCIONES[caso]})")


# ---------------------------------------------------------------------------
# 4. Contradicciones e informacion falsa (inferencias 7, 8 y 9)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("caso", CASOS)
def test_10_cada_caso_tiene_contradicciones_entre_declaraciones(engine, caso):
    filas = engine.consultar(f"declaraciones_contradictorias({caso}, D1, D2, Razon)")
    assert len(filas) >= 1


@pytest.mark.parametrize("caso", CASOS)
def test_11_cada_caso_tiene_contradicciones_con_la_evidencia(engine, caso):
    filas = engine.consultar(
        f"declaracion_contradice_evidencia({caso}, D, E, Razon)"
    )
    assert len(filas) >= 1


@pytest.mark.parametrize("caso", CASOS)
def test_12_el_responsable_proporciono_informacion_falsa(engine, caso):
    """En los tres casos el culpable miente, y la evidencia lo desmiente."""
    assert engine.es_cierto(f"mintio({caso}, {SOLUCIONES[caso]})")


def test_13_la_evidencia_fisica_prevalece_sobre_el_testimonio(engine):
    """Ante el choque, se marca falsa la declaracion, nunca la evidencia."""
    razones = engine.valores(
        "informacion_falsa(caso1, marco, mentira(_, _, Razon))", "Razon"
    )
    assert any("negado_por_evidencia_fisica" in r for r in razones)
    # La evidencia nunca queda marcada como falsa; la declaracion si.
    assert engine.es_cierto("declaracion_contradice_evidencia(caso1, d1, e02, _)")


# ---------------------------------------------------------------------------
# 5. Evidencias y relaciones (inferencias 10 y 11)
# ---------------------------------------------------------------------------

def test_14_las_evidencias_se_asocian_a_cada_sospechoso(engine):
    evidencias = engine.uno("evidencias_de(caso1, marco, Lista)")
    for identificador in ("e01", "e02", "e03", "e07"):
        assert identificador in evidencias["Lista"]


def test_15_las_relaciones_relevantes_conectan_con_la_victima(engine):
    filas = engine.consultar("relacion_relevante(caso1, P1, P2, Tipo)")
    assert any(f["P2"] == "dr_salazar" for f in filas)


def test_16_la_cadena_de_relaciones_es_recursiva(engine):
    """conectados/4 encuentra vinculos indirectos sin caer en ciclos."""
    resultado = engine.uno("conectados(caso1, julio, dr_salazar, Cadena)")
    assert resultado is not None
    assert "julio" in resultado["Cadena"]
    assert "dr_salazar" in resultado["Cadena"]


# ---------------------------------------------------------------------------
# 6. Sospecha, complices y responsable (inferencias 12 a 15)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("caso", CASOS)
def test_17_el_responsable_encabeza_el_ranking_sin_empate(engine, caso):
    filas = engine.consultar(f"vista_sospecha({caso}, P, N, Puntaje, C)")
    puntajes = sorted((int(f["Puntaje"]) for f in filas), reverse=True)
    assert puntajes[0] > puntajes[1], "El maximo debe ser unico: un empate seria ambiguo"

    principal = engine.uno(f"principal_sospechoso({caso}, P)")
    assert principal["P"] == SOLUCIONES[caso]


@pytest.mark.parametrize("caso", CASOS)
def test_18_el_motor_deduce_el_responsable_correcto(engine, caso):
    """La prueba central: la deduccion coincide con solucion/2 de la KB."""
    resultado = engine.uno(f"responsable({caso}, Quien)")
    assert resultado is not None, f"{caso} deberia tener un responsable deducible"
    assert resultado["Quien"] == SOLUCIONES[caso]

    declarado = engine.uno(f"solucion({caso}, Quien)")
    assert resultado["Quien"] == declarado["Quien"]


@pytest.mark.parametrize("caso", CASOS)
def test_19_cada_caso_tiene_un_complice_deducible(engine, caso):
    filas = engine.consultar(f"posible_complice({caso}, Complice, Razon)")
    assert len(filas) >= 1
    assert all(f["Complice"] != SOLUCIONES[caso] for f in filas)


def test_20_el_nivel_de_sospecha_no_suma_dos_veces_el_mismo_factor(engine):
    """Un sospechoso con varios motivos aporta el factor 'motivo' una sola vez."""
    factores = engine.uno("factores_de(caso1, marco, Factores)")
    assert factores["Factores"].count("motivo-") == 1


# ---------------------------------------------------------------------------
# 7. Explicacion (inferencia 16)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("caso", CASOS)
def test_21_la_conclusion_viene_acompanada_de_sus_reglas(engine, caso):
    """El enunciado exige justificar cada conclusion indicando las reglas."""
    reglas = engine.valores(
        f"vista_explicacion({caso}, {SOLUCIONES[caso]}, Id, N, D, Detalle)", "Id"
    )
    assert "r16" in reglas, "Debe constar la regla del responsable logico"
    assert "r13" in reglas, "Debe constar el nivel de sospecha"
    assert len(set(reglas)) >= 8


@pytest.mark.parametrize("caso", CASOS)
def test_22_el_motor_explica_por_que_descarta_a_los_inocentes(engine, caso):
    filas = engine.consultar(f"vista_descarte({caso}, P, N, Texto)")
    descartados = {f["P"] for f in filas}
    assert SOLUCIONES[caso] not in descartados
    assert len(descartados) >= 2


# ---------------------------------------------------------------------------
# 8. Constructos obligatorios de Prolog
# ---------------------------------------------------------------------------

def test_23_recursividad_sobre_listas(engine):
    """suma_lista/2 y longitud/2 son recursivos y estan operativos."""
    assert engine.uno("suma_lista([10, 20, 30, 5], Total)")["Total"] == "65"
    assert engine.uno("longitud([a, b, c, d], N)")["N"] == "4"


def test_24_negacion_por_fallo(engine):
    """\\+ tiene exito cuando la meta no se puede demostrar."""
    assert engine.es_cierto("no_pertenece(z, [a, b, c])")
    assert not engine.es_cierto("no_pertenece(a, [a, b, c])")


def test_25_los_cortes_hacen_deterministas_las_conclusiones(engine):
    """categoria_sospecha/3 debe dar exactamente una categoria por persona."""
    for caso in CASOS:
        for persona in engine.valores(f"persona({caso}, P, _, sospechoso)", "P"):
            filas = engine.consultar(f"categoria_sospecha({caso}, {persona}, C)")
            assert len(filas) == 1, f"{persona} recibio {len(filas)} categorias"


def test_26_la_recursion_sobre_lugares_no_entra_en_bucle(engine):
    """El grafo de lugares tiene ciclos; la lista de visitados los corta."""
    assert engine.es_cierto("alcanzable(caso1, jardin, deposito, [jardin])")
    assert engine.es_cierto("alcanzable(caso3, estacionamiento, sala_servidores, [estacionamiento])")


# ---------------------------------------------------------------------------
# 9. Robustez del puente
# ---------------------------------------------------------------------------

def test_27_una_meta_invalida_produce_un_error_controlado(engine):
    """Un predicado inexistente no debe tumbar el proceso."""
    from app.prolog.engine import ErrorProlog

    with pytest.raises(ErrorProlog):
        engine.consultar("predicado_que_no_existe(X)")


def test_28_los_dos_backends_producen_el_mismo_resultado(engine):
    """El fallback debe ser transparente: misma consulta, misma respuesta."""
    from app.prolog.engine import SubprocessBackend

    subproceso = SubprocessBackend()
    for caso in CASOS:
        meta = f"ranking_sospecha({caso}, R)"
        assert subproceso.uno(meta) == engine.uno(meta)
