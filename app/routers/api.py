"""API JSON de Logic Detective.

Expone las mismas acciones que la interfaz web en formato JSON. La usan la
suite de pruebas automatizadas y cualquier cliente externo.

Cada endpoint es una capa fina sobre el servicio de investigacion, que a su
vez consulta al motor Prolog.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.prolog.engine import obtener_engine
from app.services import investigacion as inv
from app.storage import db

router = APIRouter(prefix="/api", tags=["api"])


class NuevaSesion(BaseModel):
    caso: str


class Acusacion(BaseModel):
    acusado: str


class DeltaPuntos(BaseModel):
    delta: int


# ---------------------------------------------------------------------------
# Estado del sistema
# ---------------------------------------------------------------------------

@router.get("/salud")
async def salud():
    """Confirma que el puente con Prolog responde y que la base cargo."""
    engine = obtener_engine()
    casos = engine.valores("caso(Id, _, _, _)", "Id")
    return {"ok": True, "backend": engine.nombre, "casos": casos}


@router.get("/casos")
async def casos():
    return {"ok": True, "casos": inv.listar_casos()}


@router.get("/casos/{caso}")
async def caso_detalle(caso: str):
    return {"ok": True, "ficha": inv.ficha_caso(caso)}


@router.get("/casos/{caso}/minimos")
async def minimos(caso: str):
    """Verifica los minimos del enunciado: 4/10/5/5/10.

    Lo comprueba Prolog con conteo_caso/2 y cumple_minimos/1.
    """
    engine = obtener_engine()
    fila = engine.uno(
        f"conteo_caso({caso}, conteo(Sospechosos, Evidencias, Lugares, "
        f"Declaraciones, Reglas))"
    )
    return {
        "ok": True,
        "conteo": fila,
        "cumple": engine.es_cierto(f"cumple_minimos({caso})"),
    }


# ---------------------------------------------------------------------------
# Sesiones de investigacion
# ---------------------------------------------------------------------------

@router.post("/sesiones")
async def crear_sesion(datos: NuevaSesion):
    sesion = inv.iniciar(datos.caso)
    return {"ok": True, "sesion": sesion}


@router.post("/sesiones/aleatorio")
async def crear_sesion_aleatoria():
    """Abre una investigacion con un caso elegido al azar.

    Opcional 1: seleccion aleatoria del caso al iniciar la aplicacion.
    Devuelve el mismo shape que POST /sesiones para que el frontend
    pueda redirigir a /investigacion/{sesion} sin cambios adicionales.
    """
    sesion = inv.iniciar_aleatorio()
    return {"ok": True, "sesion": sesion}


@router.get("/sesiones")
async def listar_sesiones(limite: int = 50):
    """Historial de investigaciones, el mas reciente primero.

    La barra lateral lo usa para reanudar una investigacion o abrir el informe
    de una ya cerrada.
    """
    return {"ok": True, "sesiones": db.listar_sesiones(limite=limite)}


@router.get("/sesiones/{sesion}")
async def ver_sesion(sesion: str):
    return {"ok": True, "sesion": db.obtener_sesion(sesion)}


@router.get("/sesiones/{sesion}/sospechosos")
async def api_sospechosos(sesion: str):
    return {"ok": True, "sospechosos": inv.sospechosos(sesion)}


@router.post("/sesiones/{sesion}/interrogar/{persona}")
async def api_interrogar(sesion: str, persona: str):
    return {"ok": True, **inv.interrogar(sesion, persona)}


@router.get("/sesiones/{sesion}/lugares")
async def api_lugares(sesion: str):
    return {"ok": True, "lugares": inv.lugares(sesion)}


@router.post("/sesiones/{sesion}/lugares/{lugar}")
async def api_investigar_lugar(sesion: str, lugar: str):
    return {"ok": True, **inv.investigar_lugar(sesion, lugar)}


@router.get("/sesiones/{sesion}/evidencias")
async def api_evidencias(sesion: str):
    return {"ok": True, "evidencias": inv.evidencias_descubiertas(sesion)}


@router.post("/sesiones/{sesion}/evidencias/{evidencia}")
async def api_examinar(sesion: str, evidencia: str):
    return {"ok": True, **inv.examinar_evidencia(sesion, evidencia)}


@router.get("/sesiones/{sesion}/relaciones")
async def api_relaciones(sesion: str):
    return {"ok": True, "relaciones": inv.relaciones(sesion)}


@router.get("/sesiones/{sesion}/motivos")
async def api_motivos(sesion: str):
    return {"ok": True, "motivos": inv.motivos(sesion)}


@router.get("/sesiones/{sesion}/oportunidades")
async def api_oportunidades(sesion: str):
    return {"ok": True, "pilares": inv.oportunidades(sesion)}


@router.get("/sesiones/{sesion}/coartadas")
async def api_coartadas(sesion: str):
    return {"ok": True, "coartadas": inv.coartadas(sesion)}


@router.get("/sesiones/{sesion}/linea-temporal")
async def api_linea_temporal(sesion: str):
    return {"ok": True, "eventos": inv.linea_temporal(sesion)}


@router.get("/sesiones/{sesion}/contradicciones")
async def api_contradicciones(sesion: str):
    return {"ok": True, "contradicciones": inv.contradicciones(sesion)}


@router.get("/sesiones/{sesion}/sospecha")
async def api_sospecha(sesion: str):
    return {"ok": True, "sospecha": inv.nivel_sospecha(sesion)}


@router.post("/sesiones/{sesion}/pista")
async def api_pista(sesion: str):
    return {"ok": True, "pista": inv.solicitar_pista(sesion)}


@router.post("/sesiones/{sesion}/acusar")
async def api_acusar(sesion: str, datos: Acusacion):
    return {"ok": True, "resultado": inv.acusar(sesion, datos.acusado)}


@router.get("/sesiones/{sesion}/explicacion")
async def api_explicacion(sesion: str, persona: str | None = None):
    return {"ok": True, **inv.explicacion(sesion, persona)}


@router.get("/sesiones/{sesion}/informe")
async def api_informe(sesion: str):
    return {"ok": True, "informe": inv.informe_final(sesion)}


@router.get("/sesiones/{sesion}/bitacora")
async def api_bitacora(sesion: str):
    return {"ok": True, "bitacora": inv.bitacora(sesion)}


@router.post("/sesiones/{sesion}/puntos")
async def api_puntos(sesion: str, datos: DeltaPuntos):
    """Aplica un cambio de puntuacion a la sesion activa.

    Opcional 2: sistema de puntuacion basado en consultas realizadas.
    El frontend llama este endpoint despues de cada accion del detective,
    pasando el delta correspondiente (negativo para penalizaciones,
    positivo para bonos). La puntuacion nunca baja de 0.

    Body: { "delta": -5 }
    Respuesta: { "ok": true, "puntuacion": 85, "delta": -5 }
    """
    return {"ok": True, **inv.registrar_puntos(sesion, datos.delta)}