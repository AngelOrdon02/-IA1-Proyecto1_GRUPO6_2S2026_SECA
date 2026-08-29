# =============================================================================
# Logic Detective — imagen de la aplicacion
# -----------------------------------------------------------------------------
# Multi-stage build:
#   Stage 1: Node.js para compilar el frontend React
#   Stage 2: Python + SWI-Prolog para el backend
# =============================================================================

# --- Stage 1: Frontend -------------------------------------------------------
FROM node:22-slim AS frontend-builder

ENV CI=true

WORKDIR /build

# Version fijada a proposito: pnpm resuelve el lockfile v9 de forma distinta
# entre versiones mayores, y un build reproducible no puede depender de cual
# este publicada como "latest" el dia que se construya.
RUN npm install --global pnpm@11.9.0

# .npmrc y pnpm-workspace.yaml deben estar ANTES del install: son los que
# autorizan el script de instalacion de esbuild (pnpm 10+ los bloquea por
# defecto). Sin ellos el binario de esbuild no se descarga y `vite build` falla
# con "You installed esbuild for another platform".
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/.npmrc frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# El codigo se copia despues para que la capa de dependencias se reaproveche
# mientras el lockfile no cambie.
COPY frontend/ ./
RUN pnpm build

# --- Stage 2: Backend --------------------------------------------------------
FROM python:3.12-slim

# --- SWI-Prolog -------------------------------------------------------------
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         swi-prolog-nox \
         ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV SWI_HOME_DIR=/usr/lib/swi-prolog
ENV LD_LIBRARY_PATH=/usr/lib/swi-prolog/lib/x86_64-linux

WORKDIR /app

# --- Dependencias de Python -------------------------------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Codigo -----------------------------------------------------------------
COPY app/    ./app/
COPY prolog/ ./prolog/
COPY tests/  ./tests/

# Los ejemplos del panel de administracion se sirven desde /app/ejemplos (via
# LD_EJEMPLOS) y no desde /app/datos: el volumen de datos que monta
# docker-compose taparia cualquier cosa copiada bajo /app/datos.
COPY datos/ejemplos/ ./ejemplos/

# --- Frontend compilado -----------------------------------------------------
COPY --from=frontend-builder /build/dist ./frontend/dist

# --- Usuario sin privilegios ------------------------------------------------
RUN useradd --create-home --shell /bin/bash detective \
    && mkdir -p /app/datos \
    && chown -R detective:detective /app

USER detective

ENV LD_DB=/app/datos/logic_detective.db \
    LD_EJEMPLOS=/app/ejemplos \
    LD_PROLOG_BACKEND=auto \
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/salud').read()"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
