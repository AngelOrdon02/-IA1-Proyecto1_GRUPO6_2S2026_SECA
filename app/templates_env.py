"""Entorno de plantillas Jinja2, compartido por todos los routers."""

from __future__ import annotations

from fastapi.templating import Jinja2Templates

from app import config

plantillas = Jinja2Templates(directory=str(config.RAIZ / "app" / "templates"))

# Disponibles en todas las plantillas sin pasarlas en cada contexto.
plantillas.env.globals["nombre_app"] = config.NOMBRE_APP
plantillas.env.globals["version_app"] = config.VERSION


def etiqueta_estado(estado: str) -> str:
    """Traduce el estado interno de una sesion a texto para la interfaz."""
    return {
        "sin_iniciar": "Sin iniciar",
        "en_curso": "En curso",
        "resuelto": "Resuelto",
        "fallido": "Cerrado sin exito",
    }.get(estado, estado)


def etiqueta_categoria(categoria: str) -> str:
    """Traduce la categoria de sospecha que devuelve Prolog."""
    return {
        "muy_alto": "Muy alto",
        "alto": "Alto",
        "medio": "Medio",
        "bajo": "Bajo",
    }.get(categoria, categoria)


# Jinja2 registra los filtros por asignacion en env.filters. El decorador
# @env.filter no existe en Jinja2 puro: es de Flask.
plantillas.env.filters["etiqueta_estado"] = etiqueta_estado
plantillas.env.filters["etiqueta_categoria"] = etiqueta_categoria
