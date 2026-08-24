"""Configuracion compartida de la suite de pruebas.

Las variables de entorno se fijan ANTES de importar la aplicacion: app.config
las lee al importarse, asi que las pruebas nunca tocan la base de datos real.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_DIRECTORIO = tempfile.mkdtemp(prefix="logic-detective-pruebas-")
os.environ["LD_DB"] = str(Path(_DIRECTORIO) / "pruebas.db")

# El backend de subproceso no requiere que libswipl.so cargue en el proceso de
# pytest, asi que la suite corre igual en cualquier maquina y en CI. Si se
# quiere ejercitar PySwip explicitamente: LD_PROLOG_BACKEND=pyswip pytest
os.environ.setdefault("LD_PROLOG_BACKEND", "subprocess")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.prolog.engine import obtener_engine  # noqa: E402
from app.storage import db  # noqa: E402

CASOS = ["caso1", "caso2", "caso3"]

# Culpable esperado de cada caso, declarado en la propia base de conocimiento
# mediante solucion/2. Las pruebas comparan la deduccion contra ese valor.
SOLUCIONES = {
    "caso1": "peruggia",
    "caso2": "kosminski",
    "caso3": "yusupov",
}


@pytest.fixture(scope="session")
def engine():
    """Motor Prolog compartido por toda la sesion de pruebas."""
    return obtener_engine()


@pytest.fixture(scope="session")
def cliente():
    """Cliente HTTP contra la aplicacion FastAPI."""
    with TestClient(app) as clienteweb:
        yield clienteweb


@pytest.fixture(autouse=True)
def base_limpia():
    """Cada prueba arranca con la base de datos vacia."""
    db.inicializar()
    db.borrar_todo()
    yield
