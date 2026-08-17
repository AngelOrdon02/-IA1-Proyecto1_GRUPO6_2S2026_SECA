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

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.prolog.engine import ErrorProlog, obtener_engine
from app.routers import api, api_admin
from app.services.investigacion import AccionInvalida
from app.storage import db

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

    # El panel /admin escribe codigo Prolog que el servidor luego ejecuta. Con
    # las credenciales de fabrica, exponer el puerto a Internet es entregar el
    # servidor. Se avisa en cada arranque para que no pase inadvertido.
    if config.usa_credenciales_por_defecto():
        log.warning(
            "Credenciales de administracion POR DEFECTO en uso. Definir "
            "LD_ADMIN_USER y LD_ADMIN_PASS (ver .env.example) antes de exponer "
            "el sistema fuera de localhost."
        )

    yield
    log.info("Logic Detective detenido.")


app = FastAPI(
    title=config.NOMBRE_APP,
    description=config.DESCRIPCION_APP,
    version=config.VERSION,
    lifespan=ciclo_de_vida,
)

app.include_router(api.router)
app.include_router(api_admin.router)


# ---------------------------------------------------------------------------
# Manejo de errores
# ---------------------------------------------------------------------------

@app.exception_handler(AccionInvalida)
async def error_accion(request: Request, exc: AccionInvalida):
    return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)


@app.exception_handler(ErrorProlog)
async def error_prolog(request: Request, exc: ErrorProlog):
    log.error("Error del motor Prolog: %s", exc)
    return JSONResponse(
        {"ok": False, "error": "Error del motor de inferencia"},
        status_code=500,
    )


@app.get("/salud", response_class=HTMLResponse, include_in_schema=False)
async def salud():
    """Sonda de salud para el healthcheck de Docker."""
    engine = obtener_engine()
    total = len(engine.valores("caso(Id, _, _, _)", "Id"))
    return HTMLResponse(f"ok backend={engine.nombre} casos={total}")


# ---------------------------------------------------------------------------
# SPA: servir el frontend React
# ---------------------------------------------------------------------------

# En el contenedor lo deja aqui el Dockerfile (COPY --from=frontend-builder).
# En desarrollo local aparece al correr `pnpm build` dentro de frontend/. Si no
# existe, la aplicacion sigue sirviendo la API: solo se pierde la interfaz.
FRONTEND_DIST = config.RAIZ / "frontend" / "dist"
FRONTEND_INDEX = FRONTEND_DIST / "index.html"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"

if FRONTEND_ASSETS.is_dir():
    # Los bundles con hash en el nombre los sirve StaticFiles, que ya resuelve
    # el content-type y el cacheado.
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_ASSETS),
        name="frontend-assets",
    )
else:
    log.warning(
        "No se encontro %s. La API funciona, pero no hay interfaz que servir: "
        "ejecutar `pnpm build` en frontend/ o construir la imagen Docker.",
        FRONTEND_ASSETS,
    )


if FRONTEND_INDEX.is_file():

    @app.get("/{ruta_spa:path}", include_in_schema=False)
    async def spa_fallback(ruta_spa: str):
        """Sirve el frontend: el archivo pedido si existe, index.html si no.

        Esta ruta es un comodin y se registra la ultima, asi que solo ve lo que
        ningun router reclamo antes. Aun asi se excluye /api de forma explicita:
        un endpoint mal escrito debe devolver 404, no la pagina de la SPA.
        """
        if ruta_spa == "api" or ruta_spa.startswith("api/"):
            raise HTTPException(status_code=404, detail="Endpoint no encontrado")

        # El destino se resuelve y se comprueba que siga dentro de dist: sin
        # esto, una ruta con ../ serviria cualquier archivo del contenedor.
        destino = (FRONTEND_DIST / ruta_spa).resolve()
        raiz = FRONTEND_DIST.resolve()
        if destino.is_file() and destino.is_relative_to(raiz):
            return FileResponse(destino)

        return FileResponse(FRONTEND_INDEX)
