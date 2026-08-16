# =============================================================================
# Logic Detective — imagen de la aplicacion
# -----------------------------------------------------------------------------
# Una sola imagen con Python y SWI-Prolog. No se separan en dos contenedores
# porque PySwip embebe el interprete de Prolog DENTRO del proceso de Python:
# no hay un servicio Prolog al que conectarse por red, es una biblioteca nativa
# que debe estar en la misma imagen.
# =============================================================================

FROM python:3.12-slim

# --- SWI-Prolog -------------------------------------------------------------
# swi-prolog-nox es la variante sin entorno grafico: la mitad de tamaño y
# suficiente para un motor de inferencia. Trae libswipl.so, que es lo que
# PySwip carga por ctypes.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         swi-prolog-nox \
         ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# PySwip localiza la biblioteca nativa a traves de estas rutas. Fijarlas
# explicitamente evita el fallo mas comun al contenerizar: "libswipl.so not
# found", que degradaria el sistema al backend de subproceso sin avisar.
ENV SWI_HOME_DIR=/usr/lib/swi-prolog
ENV LD_LIBRARY_PATH=/usr/lib/swi-prolog/lib/x86_64-linux

WORKDIR /app

# --- Dependencias de Python -------------------------------------------------
# Se copian antes que el codigo para que la capa de dependencias se reutilice
# entre reconstrucciones mientras requirements.txt no cambie.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Codigo -----------------------------------------------------------------
COPY app/    ./app/
COPY prolog/ ./prolog/
COPY tests/  ./tests/

# --- Usuario sin privilegios ------------------------------------------------
RUN useradd --create-home --shell /bin/bash detective \
    && mkdir -p /app/datos \
    && chown -R detective:detective /app

USER detective

ENV LD_DB=/app/datos/logic_detective.db \
    LD_PROLOG_BACKEND=auto \
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/salud').read()"

# UN SOLO WORKER, deliberadamente: PySwip embebe un unico interprete de
# SWI-Prolog por proceso y no es seguro entre hilos.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
