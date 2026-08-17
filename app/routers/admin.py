"""Modulo Administrativo — rutas web.

Protegido con autenticacion HTTP basica. Las credenciales se configuran por
variable de entorno (LD_ADMIN_USER / LD_ADMIN_PASS); las de por defecto solo
sirven para desarrollo.
"""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, PlainTextResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app import config
from app.services import admin as servicio
from app.storage import db
from app.templates_env import plantillas

router = APIRouter(prefix="/admin", tags=["administracion"])
seguridad = HTTPBasic()


def verificar(credenciales: Annotated[HTTPBasicCredentials, Depends(seguridad)]) -> str:
    """Valida usuario y clave.

    compare_digest evita filtrar informacion por el tiempo de comparacion.
    """
    usuario_ok = secrets.compare_digest(credenciales.username, config.USUARIO_ADMIN)
    clave_ok = secrets.compare_digest(credenciales.password, config.CLAVE_ADMIN)
    if not (usuario_ok and clave_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credenciales.username


Autenticado = Annotated[str, Depends(verificar)]


@router.get("", response_class=HTMLResponse)
async def panel_admin(request: Request, usuario: Autenticado):
    """Panel principal de administracion."""
    return plantillas.TemplateResponse(
        request, "admin.html",
        {
            "usuario": usuario,
            "casos": servicio.listar_casos(),
            "archivos": servicio.listar_archivos(),
            "sesiones": db.listar_sesiones(limite=30),
        },
    )


@router.get("/fuente/{archivo}", response_class=HTMLResponse)
async def ver_fuente(request: Request, archivo: str, usuario: Autenticado):
    """Editor del codigo Prolog de un caso."""
    return plantillas.TemplateResponse(
        request, "admin_editor.html",
        {
            "usuario": usuario,
            "archivo": archivo,
            "contenido": servicio.leer_fuente(archivo),
        },
    )


@router.post("/fuente/{archivo}")
async def guardar_fuente(archivo: str, usuario: Autenticado, contenido: str = Form(...)):
    resultado = servicio.guardar_fuente(archivo, contenido)
    casos = ", ".join(resultado["casos"])
    return RedirectResponse(
        f"/admin?mensaje=Guardado {resultado['archivo']}. Casos cargados: {casos}",
        status_code=303,
    )


@router.post("/casos")
async def crear_caso(
    usuario: Autenticado,
    caso: str = Form(...),
    titulo: str = Form(...),
    descripcion: str = Form(""),
    dificultad: str = Form("medio"),
):
    resultado = servicio.crear_caso(caso, titulo, descripcion, dificultad)
    return RedirectResponse(
        f"/admin/fuente/{resultado['archivo']}", status_code=303
    )


@router.post("/casos/{archivo}/eliminar")
async def eliminar_caso(archivo: str, usuario: Autenticado):
    servicio.eliminar_caso(archivo)
    return RedirectResponse("/admin?mensaje=Caso eliminado", status_code=303)


@router.post("/recargar")
async def recargar(usuario: Autenticado):
    resultado = servicio.recargar()
    casos = ", ".join(resultado["casos"])
    return RedirectResponse(
        f"/admin?mensaje=Motor recargado ({resultado['backend']}). Casos: {casos}",
        status_code=303,
    )


@router.post("/sesiones/limpiar")
async def limpiar_sesiones(usuario: Autenticado):
    """Borra el historial de partidas. No toca la base de conocimiento."""
    db.borrar_todo()
    return RedirectResponse("/admin?mensaje=Historial de sesiones borrado", status_code=303)


@router.get("/exportar/{archivo}", response_class=PlainTextResponse)
async def exportar(archivo: str, usuario: Autenticado):
    """Descarga el codigo Prolog de un caso."""
    return PlainTextResponse(
        servicio.leer_fuente(archivo),
        headers={"Content-Disposition": f'attachment; filename="{archivo}"'},
    )
