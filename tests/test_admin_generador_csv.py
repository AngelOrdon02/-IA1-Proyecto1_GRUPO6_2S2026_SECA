"""Pruebas del importador CSV de casos (segunda mitad del opcional 9).

El enunciado pide generar casos "a partir de archivos JSON o CSV". El
importador CSV traduce a la misma estructura del generador JSON y delega en el,
asi que estas pruebas se centran en la TRADUCCION y en los errores propios del
formato tabular; la generacion en si ya la cubre test_admin_generador.py.
"""

from __future__ import annotations

import pytest

from app import config
from app.services import admin as servicio
from app.services.investigacion import AccionInvalida

CREDENCIALES = (config.USUARIO_ADMIN, config.CLAVE_ADMIN)


def _csv_caso(identificador: str = "caso_csv") -> str:
    """CSV de un caso completo que cumple los minimos del enunciado."""
    filas = [
        "tipo,c1,c2,c3,c4,c5",
        f"caso,{identificador},El expediente tabular,"
        '"Caso de prueba creado desde CSV, con comas incluidas.",facil',
        "incidente,Robo del sello notarial,despacho,2100",
        "ventana,2030,2130",
        "victima,victor",
        "solucion,ana",
        # --- personas: 4 sospechosos + victima + testigo ---
        "persona,victor,Victor Prueba,victima",
        "persona,ana,Ana Ruiz,sospechoso",
        "persona,beto,Beto Lima,sospechoso",
        "persona,carla,Carla Soto,sospechoso",
        "persona,dario,Dario Paz,sospechoso",
        "persona,toni,Toni Testigo,testigo",
        # --- 5 lugares ---
        "lugar,despacho,Despacho,Oficina del notario",
        "lugar,pasillo,Pasillo,Corredor principal",
        "lugar,archivo,Archivo,Sala de expedientes",
        "lugar,bodega,Bodega,Deposito del sotano",
        "lugar,entrada,Entrada,Recepcion del edificio",
        "conexion,entrada,pasillo",
        "conexion,pasillo,despacho",
        "conexion,pasillo,archivo",
        "conexion,archivo,bodega",
        # --- accesos ---
        "acceso,ana,entrada,llave_maestra",
        "acceso,ana,pasillo,llave_maestra",
        "acceso,ana,despacho,llave_maestra",
        "acceso,ana,archivo,llave_maestra",
        "acceso,ana,bodega,llave_maestra",
        "acceso,beto,entrada,gafete",
        "acceso,carla,entrada,gafete",
        "acceso,dario,entrada,gafete",
        # --- ubicaciones ---
        "estuvo,ana,despacho,2100",
        "estuvo,beto,entrada,2100",
        "estuvo,carla,bodega,2040",
        "estuvo,dario,entrada,2110",
        "evento,ev1,2100,despacho,Desaparece el sello",
    ]
    # --- 10 evidencias; la primera vincula y situa a Ana ---
    for n in range(1, 11):
        filas.append(f"evidencia,g{n:02d},indicio,Indicio numero {n},despacho,2100")
    filas.append("vincula,g01,ana")
    filas.append("situa,g01,ana,despacho")
    # --- 5 declaraciones; la de Ana la desmiente la evidencia ---
    for n, autor in enumerate(["ana", "beto", "carla", "dario", "toni"], start=1):
        filas.append(f"declaracion,dec{n},{autor},Declaracion numero {n}")
    filas.append("afirma,dec1,no_estuvo,ana,despacho,2100")
    filas += [
        "coartada,beto,entrada,2100,toni",
        "motivo,ana,financiero,Debe dinero al notario",
        "requiere,llave_del_sello",
        "medio,ana,llave_del_sello",
        "relacion,ana,victor,deuda",
    ]
    # --- 10 reglas propias ---
    for n in range(1, 11):
        filas.append(f"regla,gr{n:02d},Regla numero {n},Descripcion de la regla {n}")
    return "\n".join(filas)


# ---------------------------------------------------------------------------
# Traduccion
# ---------------------------------------------------------------------------

def test_56_el_csv_se_traduce_a_la_estructura_del_generador():
    """La traduccion respeta cabecera, comillas y agrupacion por entidad."""
    estructura = servicio.csv_a_estructura(_csv_caso())

    assert estructura["id"] == "caso_csv"
    assert estructura["dificultad"] == "facil"
    # La descripcion lleva una coma dentro de comillas: no debe partirse.
    assert "con comas incluidas" in estructura["descripcion"]

    assert estructura["incidente"] == {
        "descripcion": "Robo del sello notarial", "lugar": "despacho", "hora": 2100
    }
    assert estructura["ventana"] == [2030, 2130]
    assert estructura["solucion"] == "ana"

    sospechosos = [p for p in estructura["personas"] if p["rol"] == "sospechoso"]
    assert len(sospechosos) == 4
    assert len(estructura["lugares"]) == 5
    assert len(estructura["evidencias"]) == 10
    assert len(estructura["declaraciones"]) == 5
    assert len(estructura["reglas"]) == 10


def test_57_vincula_y_situa_se_cuelgan_de_su_evidencia():
    """Las filas sueltas se reagrupan bajo la evidencia que referencian."""
    estructura = servicio.csv_a_estructura(_csv_caso())
    primera = next(e for e in estructura["evidencias"] if e["id"] == "g01")

    assert primera["vincula"] == ["ana"]
    assert primera["situa"] == {"persona": "ana", "lugar": "despacho"}

    # Las demas evidencias no heredan nada de la primera.
    segunda = next(e for e in estructura["evidencias"] if e["id"] == "g02")
    assert segunda["vincula"] == []
    assert "situa" not in segunda


def test_58_las_afirmaciones_se_cuelgan_de_su_declaracion():
    estructura = servicio.csv_a_estructura(_csv_caso())
    primera = next(d for d in estructura["declaraciones"] if d["id"] == "dec1")

    assert primera["afirmaciones"] == [
        {"tipo": "no_estuvo", "persona": "ana", "lugar": "despacho", "hora": 2100}
    ]


def test_59_se_ignoran_comentarios_lineas_vacias_y_cabecera():
    csv = "\n".join([
        "tipo,c1,c2,c3,c4",
        "# esto es un comentario",
        "",
        "caso,x_prueba,Titulo,Descripcion,facil",
        "   ",
        "victima,victor",
    ])
    estructura = servicio.csv_a_estructura(csv)
    assert estructura["id"] == "x_prueba"
    assert estructura["victima"] == "victor"


# ---------------------------------------------------------------------------
# Errores del formato
# ---------------------------------------------------------------------------

def test_60_un_tipo_de_fila_desconocido_se_rechaza_con_la_linea():
    with pytest.raises(AccionInvalida) as error:
        servicio.csv_a_estructura("caso,x,T,D,facil\ninventado,a,b")
    assert "inventado" in str(error.value)
    assert "Linea 2" in str(error.value)


def test_61_una_fila_incompleta_se_rechaza():
    with pytest.raises(AccionInvalida) as error:
        servicio.csv_a_estructura("caso,x,T,D,facil\npersona,ana,Ana Ruiz")
    assert "persona" in str(error.value)


def test_62_referenciar_una_evidencia_inexistente_se_rechaza():
    """Un 'vincula' huerfano indicaria una evidencia mal escrita."""
    with pytest.raises(AccionInvalida) as error:
        servicio.csv_a_estructura("caso,x,T,D,facil\nvincula,e99,ana")
    assert "e99" in str(error.value)


def test_63_una_afirmacion_no_soportada_se_rechaza():
    csv = "caso,x,T,D,facil\ndeclaracion,d1,ana,Texto\nafirma,d1,bailo,ana,sala,2100"
    with pytest.raises(AccionInvalida) as error:
        servicio.csv_a_estructura(csv)
    assert "bailo" in str(error.value)


def test_64_un_csv_sin_fila_caso_se_rechaza():
    with pytest.raises(AccionInvalida) as error:
        servicio.csv_a_estructura("victima,victor\npersona,ana,Ana,sospechoso")
    assert "caso" in str(error.value)


def test_65_un_csv_vacio_se_rechaza():
    with pytest.raises(AccionInvalida):
        servicio.generar_caso_desde_csv("   ")


# ---------------------------------------------------------------------------
# Integracion: generacion real desde CSV
# ---------------------------------------------------------------------------

def test_66_previsualizar_no_escribe_nada(cliente):
    """La previsualizacion valida el formato sin tocar el motor ni el disco."""
    respuesta = cliente.post(
        "/api/admin/casos/previsualizar-csv",
        json={"contenido": _csv_caso("caso_previsualizado")},
        auth=CREDENCIALES,
    )
    assert respuesta.status_code == 200, respuesta.text
    datos = respuesta.json()
    assert datos["conteo"] == {
        "sospechosos": 4, "evidencias": 10, "lugares": 5,
        "declaraciones": 5, "reglas": 10,
    }

    # No se registro ningun caso nuevo.
    listado = cliente.get("/api/casos").json()["casos"]
    assert not any(c["Id"] == "caso_previsualizado" for c in listado)


def test_67_el_importador_csv_crea_un_caso_que_el_motor_resuelve(cliente):
    """Prueba de extremo a extremo del opcional 9 en su variante CSV."""
    respuesta = cliente.post(
        "/api/admin/casos/generar-csv",
        json={"contenido": _csv_caso()},
        auth=CREDENCIALES,
    )
    try:
        assert respuesta.status_code == 200, respuesta.text
        datos = respuesta.json()
        assert datos["ok"] is True
        assert datos["cumple_minimos"] is True
        assert "caso_csv" in datos["casos"]

        # El caso queda disponible para investigar de inmediato.
        listado = cliente.get("/api/casos").json()["casos"]
        assert any(c["Id"] == "caso_csv" for c in listado)

        # Y el motor deduce sobre el igual que sobre un caso escrito a mano.
        from app.prolog.engine import obtener_engine
        engine = obtener_engine()
        assert engine.es_cierto("cumple_minimos(caso_csv)")
        assert engine.es_cierto("tiene_acceso(caso_csv, ana)")
        assert engine.es_cierto("tuvo_oportunidad(caso_csv, ana)")
        assert engine.es_cierto("mintio(caso_csv, ana)")
    finally:
        cliente.post(
            "/api/admin/casos/eliminar",
            json={"archivo": "caso_csv.pl"},
            auth=CREDENCIALES,
        )


def test_68_el_importador_csv_exige_autenticacion(cliente):
    for ruta in ("/api/admin/casos/generar-csv", "/api/admin/casos/previsualizar-csv"):
        assert cliente.post(ruta, json={"contenido": "caso,x,T,D,facil"}).status_code == 401


# ---------------------------------------------------------------------------
# Descarga del motor al eliminar un caso
# ---------------------------------------------------------------------------

def test_69b_eliminar_un_caso_lo_descarga_del_motor(cliente):
    """Un caso eliminado no debe seguir apareciendo en el listado.

    Regresion: con el backend PySwip el interprete de SWI-Prolog vive dentro
    del proceso, asi que soltar el objeto del engine NO descartaba las
    clausulas ya consultadas. El archivo se borraba del disco pero el caso
    seguia respondiendo en /api/casos. El backend de subproceso ocultaba el
    fallo, porque arranca un interprete limpio en cada consulta.
    """
    cliente.post(
        "/api/admin/casos/generar-csv",
        json={"contenido": _csv_caso("caso_efimero")},
        auth=CREDENCIALES,
    )
    listado = [c["Id"] for c in cliente.get("/api/casos").json()["casos"]]
    assert "caso_efimero" in listado

    cliente.post(
        "/api/admin/casos/eliminar",
        json={"archivo": "caso_efimero.pl"},
        auth=CREDENCIALES,
    )

    listado = [c["Id"] for c in cliente.get("/api/casos").json()["casos"]]
    assert "caso_efimero" not in listado, "El caso eliminado sigue cargado en el motor"

    # Y sus hechos tampoco deben quedar sueltos en la base de conocimiento.
    from app.prolog.engine import obtener_engine
    assert not obtener_engine().es_cierto("persona(caso_efimero, _, _, _)")
