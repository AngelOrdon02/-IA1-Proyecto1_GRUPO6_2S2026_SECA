# Logic Detective

Sistema experto de análisis de casos de investigación. El motor de inferencia
está escrito en **SWI-Prolog**; la interfaz, la API y la integración, en
**Python**.

**Universidad de San Carlos de Guatemala** · Facultad de Ingeniería
Inteligencia Artificial 1 — Sección A · Proyecto 1, 2S2026 · **Grupo 6**

---

## Qué hace

El usuario asume el rol de detective y resuelve casos criminales interrogando
sospechosos, inspeccionando lugares y examinando evidencias. La información no
se entrega de golpe: hay que descubrirla investigando.

Toda deducción —acceso, oportunidad, motivo, medios, validez de coartadas,
contradicciones, nivel de sospecha, cómplices y responsable— se resuelve en la
base de conocimiento Prolog. Python nunca decide sobre culpabilidad.

## Arranque rápido

### Con Docker (recomendado)

```bash
docker compose up --build
```

Abrir <http://localhost:8000>.

### Sin Docker

Requiere SWI-Prolog (`sudo apt install swi-prolog-nox`) y Node 22 con pnpm.

```bash
# Frontend: sin este paso la API responde, pero no hay interfaz que servir
cd frontend && pnpm install && pnpm build && cd ..

# Backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --workers 1
```

Para desarrollar el frontend con recarga en caliente, `pnpm dev` en `frontend/`
levanta Vite en el puerto 5173 con proxy de `/api` hacia el backend.

> **Un solo worker, siempre.** PySwip embebe un único intérprete de SWI-Prolog
> por proceso y no es seguro entre hilos.

### Solo el motor de inferencia

```bash
swipl prolog/logic_detective.pl
?- responsable(caso1, Quien).
?- ranking_sospecha(caso2, Ranking).
?- explicacion_conclusion(caso3, Explicacion).
?- cumple_minimos(caso1).
```

## Pruebas

```bash
.venv/bin/python -m pytest tests/ -v
```

92 pruebas: motor de inferencia, integración Python-Prolog, descubrimiento
progresivo, bitácora, resolución, seguridad y generador de casos. Hoy pasan
todas.

## Los tres casos

| Caso | Título | Dificultad | Escenario |
|---|---|---|---|
| `caso1` | La Sonrisa Robada | Fácil | El robo de la Gioconda en el Louvre (París, 1911) |
| `caso2` | Sombras de Whitechapel | Medio | El otoño de Jack el Destripador (Londres, 1888) |
| `caso3` | La Última Noche de Rasputín | Difícil | La conspiración del Palacio Moika (San Petersburgo, 1916) |

Cada uno cumple los mínimos del enunciado: 4 sospechosos, 10 evidencias,
5 lugares, 5 declaraciones y 10 reglas de inferencia propias.

## Módulo administrativo

<http://localhost:8000/admin> — usuario `admin`, clave `detective2026`.

Configurables con `LD_ADMIN_USER` y `LD_ADMIN_PASS`. **Cambiarlas antes de
desplegar.**

Permite consultar los casos con sus conteos, validar los mínimos, crear casos
desde plantilla, **generar casos completos a partir de JSON** (opcional 9),
editar el código Prolog con validación sintáctica previa, exportar, eliminar
con respaldo y supervisar el historial de sesiones.

## Configuración

| Variable | Por defecto | Qué controla |
|---|---|---|
| `LD_PROLOG_BACKEND` | `auto` | `auto`, `pyswip` o `subprocess` |
| `LD_PROLOG_KB` | `prolog/logic_detective.pl` | Base de conocimiento |
| `LD_SWIPL_BIN` | `swipl` | Ejecutable de SWI-Prolog |
| `LD_DB` | `datos/logic_detective.db` | Base de datos SQLite |
| `LD_TIMEOUT` | `30` | Segundos máximos por consulta |
| `LD_ADMIN_USER` / `LD_ADMIN_PASS` | `admin` / `detective2026` | Credenciales de administración |

Para desplegar, copiar la plantilla y rellenarla — `.env` **no se versiona**:

```bash
cp .env.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(24))"   # clave admin
```

## Documentación

| Documento | Contenido |
|---|---|
| [Arquitectura](docs/arquitectura.md) | Componentes, frontera Python/Prolog, descubrimiento progresivo |
| [Mapa de constructos](docs/mapa_constructos.md) | Dónde vive cada constructo Prolog exigido |
| [Los tres casos](docs/casos.md) | Solución esperada de cada caso (espóileres) |
| [Manual de usuario](docs/manual_usuario.md) | Cómo jugar, paso a paso |
| [Despliegue](docs/despliegue.md) | Puesta en producción en GCP o AWS |

## Estructura

```
prolog/          Motor de inferencia y bases de conocimiento
app/             Backend FastAPI: API JSON, servicios y puente con Prolog
frontend/        Interfaz React (Vite + TypeScript), servida como SPA
tests/           Suite de pruebas
docs/            Documentación técnica
```

## Estado

| Componente | Estado |
|---|---|
| Motor de inferencia (16 predicados) | Completo |
| Tres casos de investigación | Completos y validados |
| Módulo de investigación (16 acciones) | Completo |
| Módulo administrativo | Completo |
| Docker y Docker Compose | Funcionales |
| Pruebas automatizadas | 92 pasando |
| Opcionales del enunciado (10) | Completos: aleatorio, puntuación, temporizador, dificultad, pistas, grafo, PDF, historial, generador JSON, multicaso |
| CI/CD (GitHub Actions) | **Pendiente** — no existe `.github/workflows/` |
| Despliegue en la nube | Pendiente |
| Manual con capturas | Pendiente |

El detalle de lo que falta, con prioridades, está en [TODO.md](TODO.md).
