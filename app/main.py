"""Logic Detective — aplicacion FastAPI.

Punto de entrada. Monta los tres routers (investigacion web, API JSON y
administracion), inicializa la base de datos y precarga el motor Prolog.

IMPORTANTE sobre el despliegue: la aplicacion debe ejecutarse con UN SOLO
worker de Uvicorn. PySwip embebe un unico interprete de SWI-Prolog en el
proceso y no es seguro entre hilos; el engine serializa las consultas con un
lock, pero varios workers implicarian varios interpretes compitiendo por la
misma biblioteca nativa.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.prolog.engine import ErrorProlog, obtener_engine
from app.routers import admin, api, web
from app.services.investigacion import AccionInvalida
from app.storage import db
from app.templates_env import plantillas

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)
log = logging.getLogger("logic_detective")


@asynccontextmanager
async def ciclo_de_vida(app: FastAPI):
    """Arranque y apagado de la aplicacion."""
    db.inicializar()
    log.info("Base de datos lista en %s", config.RUTA_BD)

    # Precargar el motor: mejor descubrir aqui un problema de carga de la base
    # de conocimiento que en la primera peticion de un usuario.
    engine = obtener_engine()
    casos = engine.valores("caso(Id, _, _, _)", "Id")
    log.info("Motor Prolog listo (backend=%s). Casos: %s", engine.nombre, casos)

    yield
    log.info("Logic Detective detenido.")


app = FastAPI(
    title=config.NOMBRE_APP,
    description=config.DESCRIPCION_APP,
    version=config.VERSION,
    lifespan=ciclo_de_vida,
)

app.mount("/static", StaticFiles(directory=config.RAIZ / "app" / "static"), name="static")

app.include_router(web.router)
app.include_router(api.router)
app.include_router(admin.router)


# ---------------------------------------------------------------------------
# Manejo de errores
# ---------------------------------------------------------------------------

@app.exception_handler(AccionInvalida)
async def error_accion(request: Request, exc: AccionInvalida):
    """Accion imposible en el estado actual: es culpa del usuario, no del sistema."""
    if request.url.path.startswith("/api"):
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)
    return plantillas.TemplateResponse(
        request, "error.html",
        {"titulo": "Accion no permitida", "mensaje": str(exc)},
        status_code=400,
    )


@app.exception_handler(ErrorProlog)
async def error_prolog(request: Request, exc: ErrorProlog):
    """Falla del motor de inferencia. Se registra completa y se resume al usuario."""
    log.error("Error del motor Prolog: %s", exc)
    if request.url.path.startswith("/api"):
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=500)
    return plantillas.TemplateResponse(
        request, "error.html",
        {
            "titulo": "Error del motor de inferencia",
            "mensaje": "La consulta no pudo resolverse. Revisa el log del servidor.",
            "detalle": str(exc),
        },
        status_code=500,
    )


@app.get("/salud", response_class=HTMLResponse, include_in_schema=False)
async def salud():
    """Sonda de salud para el healthcheck de Docker."""
    engine = obtener_engine()
    total = len(engine.valores("caso(Id, _, _, _)", "Id"))
    return HTMLResponse(f"ok backend={engine.nombre} casos={total}")
