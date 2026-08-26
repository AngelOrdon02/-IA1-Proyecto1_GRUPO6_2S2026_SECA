"""API JSON del modulo administrativo.

Endpoints JSON para la interfaz React. Protegidos con HTTP Basic Auth.
"""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from app import config
from app.services import admin as servicio
from app.storage import db

router = APIRouter(prefix="/api/admin", tags=["api-admin"])
seguridad = HTTPBasic(auto_error=False)


def verificar(
    credenciales: Annotated[HTTPBasicCredentials | None, Depends(seguridad)],
) -> str:
    if not credenciales:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales requeridas",
        )
    usuario_ok = secrets.compare_digest(credenciales.username, config.USUARIO_ADMIN)
    clave_ok = secrets.compare_digest(credenciales.password, config.CLAVE_ADMIN)
    if not (usuario_ok and clave_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
        )
    return credenciales.username


Autenticado = Annotated[str, Depends(verificar)]


class CrearCasoRequest(BaseModel):
    caso: str
    titulo: str
    descripcion: str = ""
    dificultad: str = "medio"


class GuardarFuenteRequest(BaseModel):
    contenido: str


class EliminarCasoRequest(BaseModel):
    archivo: str


@router.get("/casos")
async def api_admin_casos(usuario: Autenticado):
    return {"ok": True, "casos": servicio.listar_casos()}


@router.get("/archivos")
async def api_admin_archivos(usuario: Autenticado):
    return {"ok": True, "archivos": servicio.listar_archivos()}


@router.get("/ejemplos")
async def api_admin_ejemplos(usuario: Autenticado):
    """Casos de ejemplo en JSON para probar el generador."""
    return {"ok": True, "ejemplos": servicio.listar_ejemplos()}


@router.get("/ejemplos/{archivo}")
async def api_admin_leer_ejemplo(archivo: str, usuario: Autenticado):
    return {"ok": True, "archivo": archivo, "contenido": servicio.leer_ejemplo(archivo)}


@router.get("/fuente/{archivo}")
async def api_admin_leer_fuente(archivo: str, usuario: Autenticado):
    return {"ok": True, "archivo": archivo, "contenido": servicio.leer_fuente(archivo)}


@router.post("/fuente/{archivo}")
async def api_admin_guardar_fuente(
    archivo: str,
    datos: GuardarFuenteRequest,
    usuario: Autenticado,
):
    resultado = servicio.guardar_fuente(archivo, datos.contenido)
    return {"ok": True, **resultado}


@router.post("/casos")
async def api_admin_crear_caso(datos: CrearCasoRequest, usuario: Autenticado):
    resultado = servicio.crear_caso(
        datos.caso, datos.titulo, datos.descripcion, datos.dificultad
    )
    return {"ok": True, **resultado}


@router.post("/casos/generar")
async def api_admin_generar_caso(datos: dict, usuario: Autenticado):
    """Opcional 9: genera un caso nuevo a partir de su descripcion en JSON."""
    resultado = servicio.generar_caso_desde_json(datos)
    return {"ok": True, **resultado}


@router.post("/casos/eliminar")
async def api_admin_eliminar_caso(datos: EliminarCasoRequest, usuario: Autenticado):
    servicio.eliminar_caso(datos.archivo)
    return {"ok": True, "archivo": datos.archivo}


@router.post("/recargar")
async def api_admin_recargar(usuario: Autenticado):
    resultado = servicio.recargar()
    return {"ok": True, **resultado}


@router.get("/sesiones")
async def api_admin_sesiones(usuario: Autenticado):
    return {"ok": True, "sesiones": db.listar_sesiones(limite=100)}


@router.post("/sesiones/limpiar")
async def api_admin_limpiar_sesiones(usuario: Autenticado):
    db.borrar_todo()
    return {"ok": True, "mensaje": "Historial borrado"}


@router.get("/exportar/{archivo}")
async def api_admin_exportar(archivo: str, usuario: Autenticado):
    from fastapi.responses import PlainTextResponse

    return PlainTextResponse(
        servicio.leer_fuente(archivo),
        headers={"Content-Disposition": f'attachment; filename="{archivo}"'},
    )
