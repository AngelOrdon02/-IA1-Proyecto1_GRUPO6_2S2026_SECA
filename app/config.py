"""Configuracion central de Logic Detective.

Todo parametro ajustable vive aqui y se puede sobreescribir por variable de
entorno, que es como el contenedor lo configura sin reconstruir la imagen.
"""

from __future__ import annotations

import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# --- Base de conocimiento ---------------------------------------------------
RUTA_KB = Path(os.getenv("LD_PROLOG_KB", RAIZ / "prolog" / "logic_detective.pl"))

# Backend del puente Prolog: "auto", "pyswip" o "subprocess".
# "auto" intenta PySwip y cae a subprocess si la biblioteca nativa no carga.
BACKEND_PROLOG = os.getenv("LD_PROLOG_BACKEND", "auto").lower()

# Ejecutable de SWI-Prolog usado por el backend de subproceso.
BINARIO_SWIPL = os.getenv("LD_SWIPL_BIN", "swipl")

# Tiempo maximo por consulta, en segundos.
TIMEOUT_CONSULTA = int(os.getenv("LD_TIMEOUT", "30"))

# --- Persistencia -----------------------------------------------------------
RUTA_BD = Path(os.getenv("LD_DB", RAIZ / "datos" / "logic_detective.db"))

# --- Aplicacion -------------------------------------------------------------
NOMBRE_APP = "Logic Detective"
DESCRIPCION_APP = (
    "Sistema experto de analisis de casos de investigacion. "
    "Motor de inferencia en Prolog, interfaz e integracion en Python."
)
VERSION = "1.0.0"

# Credenciales del modulo administrativo. Los valores de por defecto son SOLO
# para desarrollo local: el panel /admin edita la base de conocimiento y ese
# codigo Prolog se ejecuta en el servidor, asi que en un despliegue publico
# equivalen a dar acceso al servidor. Se sobreescriben con .env (ver
# .env.example), nunca editando este archivo.
USUARIO_ADMIN_POR_DEFECTO = "admin"
CLAVE_ADMIN_POR_DEFECTO = "detective2026"

USUARIO_ADMIN = os.getenv("LD_ADMIN_USER", USUARIO_ADMIN_POR_DEFECTO)
CLAVE_ADMIN = os.getenv("LD_ADMIN_PASS", CLAVE_ADMIN_POR_DEFECTO)


def usa_credenciales_por_defecto() -> bool:
    """Cierto si el administrador sigue con las credenciales de fabrica."""
    return (
        USUARIO_ADMIN == USUARIO_ADMIN_POR_DEFECTO
        and CLAVE_ADMIN == CLAVE_ADMIN_POR_DEFECTO
    )

# Numero maximo de pistas por sesion.
MAX_PISTAS = 5
