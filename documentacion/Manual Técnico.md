# Manual Técnico — Logic Detective

Sistema experto de análisis de casos de investigación. El motor de inferencia
se implementa en **SWI-Prolog**; la interfaz, la API y la integración, en
**Python**. El usuario asume el rol de detective y resuelve casos criminales
interrogando sospechosos, inspeccionando lugares y examinando evidencias.

**Universidad de San Carlos de Guatemala** · Facultad de Ingeniería ·
Inteligencia Artificial 1, Sección A · Proyecto 1, 2S2026 · Grupo 6

---

## 1. Resumen del sistema

| Componente | Rol |
|---|---|
| **Módulo de investigación** | Las acciones del detective en el caso (interrogar, inspeccionar, examinar, analizar, acusar). |
| **Módulo administrativo** | Gestión del ciclo de vida de los casos: crear, editar, validar, exportar, eliminar y generar casos. |
| **Motor de inferencia** | Base de conocimiento en Prolog que deduce acceso, oportunidad, motivo, medios, coartadas, contradicciones, nivel de sospecha, cómplices y responsable. |

**Regla de diseño central:** toda deducción (culpabilidad, validez de coartadas,
contradicciones, sospecha) ocurre **en Prolog**. Python nunca decide sobre
culpabilidad: solo decide *qué* preguntarle a Prolog y *cuándo*, según lo que el
usuario haya descubierto, y registra la bitácora.

---

## 2. Arquitectura general

```
Navegador (SPA React + Vite)
        │  HTTP / JSON
        ▼
FastAPI  ─ app/main.py
  ├── Routers: /api (investigación) · /api/admin (administración) · SPA /salud
  ├── Servicios: investigacion.py · admin.py
  ├── Puente Prolog: prolog/engine.py  (PySwip │ subprocess)
  ├── SQLite: sesiones · descubrimientos · bitácora · campañas
  │
  └──► SWI-Prolog
         ├── api_json.pl      serialización JSON (frontera con Python)
         ├── vistas.pl        redacción de textos en español
         ├── motor · contradicciones · sospecha · explicacion
         └── casos/*.pl       3 bases de conocimiento
```

- **Frontend** → `frontend/` — React (Vite + TypeScript), servida como SPA por
  FastAPI. Rutas: inicio, investigación, informe, historial, estadísticas y admin.
- **Backend** → `app/` — FastAPI; los routers son capas finas sobre los
  servicios, que a su vez consultan al motor Prolog.
- **Motor** → `prolog/` — toda la lógica deductiva.

El diagrama completo de flujo está en `flujo.gv` (Graphviz): se compila con
`dot -Tpng flujo.gv -o flujo.png`.

---

## 3. Estructura del repositorio

| Carpeta / archivo | Contenido |
|---|---|
| `prolog/` | Motor de inferencia y bases de conocimiento (`.pl`). |
| `prolog/core/` | Núcleo genérico del motor (independiente del caso). |
| `prolog/casos/` | Los 3 casos de investigación con sus hechos y reglas. |
| `prolog/logic_detective.pl` | Punto de entrada: carga el núcleo y los casos. |
| `app/` | Backend FastAPI: configuración, routers, servicios, puente, SQLite. |
| `app/prolog/engine.py` | **Único** punto de contacto Python↔Prolog (dos backends). |
| `frontend/` | Interfaz React (Vite + TypeScript), compilada a `dist/`. |
| `tests/` | Suite de pruebas (120 pruebas). |
| `docs/` | Documentación técnica del proyecto (arquitectura, casos, despliegue…). |
| `documentacion/` | Entrega final: este manual, manual de usuario y diagrama de flujo. |
| `datos/` | Base SQLite, respaldos de casos y ejemplos JSON/CSV para el generador. |
| `despliegue/` | Orquestación Docker para la instancia EC2 (compose de producción). |
| `pruebas/` | Plan de trabajo y desarrollo del grupo. |
| `.github/workflows/ci.yml` | Pipeline CI/CD (verificación + publicación + despliegue). |
| `Dockerfile` · `docker-compose.yml` | Imagen multi-stage y orquestación local. |
| `.env.example` | Plantilla de configuración (el `.env` no se versiona). |

---

## 4. Motor de inferencia (SWI-Prolog)

### 4.1 Núcleo del motor — `prolog/core/`

| Archivo | Responsabilidad |
|---|---|
| `esquema.pl` | Declaraciones `dynamic` / `multifile` de los hechos. |
| `utils.pl` | Recursividad y manejo de listas propio (obligatorio del enunciado). |
| `motor.pl` | Acceso, oportunidad, motivo, medios, coartadas y relaciones. |
| `contradicciones.pl` | Contradicciones entre declaraciones y entre declaración y evidencia; información falsa. |
| `sospecha.pl` | Nivel de sospecha, categorías, cómplices, principal sospechoso y responsable. |
| `explicacion.pl` | Catálogo de las 16 reglas, cadena deductiva, pistas y descartes. |
| `vistas.pl` | Redacción de respuestas legibles para la interfaz. |
| `api_json.pl` | Serialización JSON: la frontera con Python. |

### 4.2 Los 16 predicados de inferencia

`tiene_acceso`, `tuvo_oportunidad`, `tiene_medios`, `coartada_valida`,
`coartada_invalida`, `contradice_*`, `informacion_falsa`, `relacion_relevante`,
`nivel_sospecha`, `posible_complice`, `principal_sospechoso`, `responsable`,
`explicacion`, `explicacion_conclusion`.

### 4.3 Los tres casos — `prolog/casos/`

| Caso | Título | Dificultad | Responsable deducido |
|---|---|---|---|
| `caso1` | La Sonrisa Robada | fácil | Vincenzo Peruggia |
| `caso2` | Sombras de Whitechapel | medio | Aaron Kosminski |
| `caso3` | La Última Noche de Rasputín | difícil | Príncipe Félix Yusúpov |

Cada caso cumple los mínimos del enunciado: **4 sospechosos, 10 evidencias,
5 lugares, 5 declaraciones y 10 reglas propias** (`cumple_minimos/1`).

### 4.4 Modelo de la base de conocimiento

- Todo hecho lleva el **identificador del caso como primer argumento**, lo que
  permite tener las tres KB cargadas a la vez y un motor genérico.
- Las horas se representan como enteros `HHMM` (`2130` = 21:30), comparables
  directamente.
- La verdad del caso completa existe desde el inicio; lo que el usuario conoce
  se controla aparte (ver §6.3).

### 4.5 Constructos obligatorios

El enunciado exige uso comprobable de **listas, recursividad, negación por
fallo (`\+`) y cortes (`!`)**. El pipeline los cuenta en cada ejecución. Todos
los archivos de `prolog/core/` usan estos constructos; por ejemplo, los grafos
de lugares y relaciones se recorren recursivamente con lista de visitados para
evitar ciclos.

---

## 5. Frontera Python / Prolog y el puente

`app/prolog/engine.py` es la **única** vía por la que Python habla con Prolog.
Define un contrato único con **dos backends intercambiables**:

| | `PySwipBackend` | `SubprocessBackend` |
|---|---|---|
| Mecanismo | SWI-Prolog embebido (ctypes) | Un proceso `swipl` por consulta |
| Velocidad | Rápido | Lento |
| Seguridad entre hilos | No (usa un `threading.Lock`) | Sí, por construcción |
| Uso | Principal (lo exige la rúbrica) | Respaldo automático |

Con `LD_PROLOG_BACKEND=auto` (default) se intenta PySwip y, si `libswipl.so` no
carga, se degrada al subproceso: se pierde velocidad, no funcionalidad.

Toda consulta pasa por `consulta_json/3` (`api_json.pl`), que serializa cada
solución a un diccionario JSON. Esto hace que el cambio de backend sea invisible
para el resto de la aplicación.

> **Concurrencia:** PySwip embebe un único intérprete, así que todas las
> consultas se serializan con un lock global y el servidor corre con **un solo
> worker** de Uvicorn (fijado en el `CMD` del `Dockerfile`).

> **Trampa documentada:** el nombre del repositorio contiene corchetes, que son
> metacaracteres de glob para SWI-Prolog. Por eso nunca se le pasa la ruta
> absoluta de la KB: se usa el directorio de trabajo (`working_directory/2`) y
> se consulta por nombre relativo, verificando tras el `consult` que
> `consulta_json/3` exista.

---

## 6. Backend FastAPI

### 6.1 Capa de aplicación — `app/`

| Archivo | Responsabilidad |
|---|---|
| `main.py` | Crea la app, prepara la base, precarga el motor, sirve la SPA, maneja errores. |
| `config.py` | Toda la configuración por variables de entorno (`LD_*`). |
| `routers/api.py` | Endpoints JSON del módulo de investigación (casos, sesiones, acciones, historial, estadísticas, multicaso). |
| `routers/api_admin.py` | Endpoints JSON del módulo administrativo (protegidos con HTTP Basic). |
| `services/investigacion.py` | Las acciones del detective: traduce la acción a una consulta Prolog, registra bitácora y descubrimientos. |
| `services/admin.py` | CRUD de casos, editor con validación sintáctica, generador JSON/CSV. |
| `storage/db.py` | Persistencia SQLite (una conexión por operación). |
| `prolog/engine.py` | El puente con Prolog (ver §5). |

### 6.2 La regla del servicio de investigación

`investigacion.py` **no decide nada deductivo**: no evalúa coartadas, no compara
puntajes, no determina culpables. Solo traduce una acción a una meta Prolog y
lleva la cuenta de lo descubierto. Todo lo que llega del usuario y va a formar
parte de una consulta pasa por un regex de átomo seguro (`_atomo`), la única
barrera contra la inyección de metas.

### 6.3 Descubrimiento progresivo

La información no se entrega de golpe. La solución se consigue con dos fuentes
separadas:

- **La verdad del caso** → archivos `.pl`, inmutables durante la partida.
- **Lo que el usuario sabe** → tabla `descubrimientos` en SQLite, por sesión.

Al iniciar la sesión solo se conocen personas y lugares. Las declaraciones,
evidencias y eventos deben descubrirse interrogando e inspeccionando. Cuando el
motor debe mostrar algo sensible (p. ej. contradicciones), Python le pasa la
lista de elementos ya descubiertos y **Prolog filtra**:

```prolog
vista_contradiccion(caso1, [d1,d3], [e02], Tipo, A, B, Texto)
```

No se usa `assert`/`retract` sobre la KB compartida: corrompería el estado entre
sesiones concurrentes. Las listas de descubiertos viajan como argumento.

### 6.4 Modelo de datos (SQLite)

| Tabla | Contenido |
|---|---|
| `sesiones` | Una investigación: caso, estado (**en_curso / resuelto / fallido**), acusado, veredicto, pistas usadas, puntuación, tiempos y campaña. |
| `descubrimientos` | `(sesión, tipo, ref)` de cada elemento revelado. |
| `bitacora` | Toda acción del usuario con su marca de tiempo UTC. |
| `campanias` | Modo multicaso: agrupa las sesiones de una partida. |

---

## 7. Módulo administrativo

Protegido con HTTP Basic (`LD_ADMIN_USER` / `LD_ADMIN_PASS`). Permite:

- Consultar los casos con sus **conteos** y comprobar los **mínimos**.
- **Crear** un caso desde plantilla (esqueleto con la estructura comentada).
- **Editar** el código Prolog de un caso con **validación sintáctica previa**
  (se compila en un intérprete aparte; si tiene errores, no se escribe nada).
- **Generar casos completos desde JSON o CSV** (opcional 9) con previsualización.
- **Exportar** archivos y **eliminar** con respaldo automático en `datos/respaldos/`.
- Recargar el motor sin reiniciar y **supervisar el historial de sesiones**.

> El panel edita la base de conocimiento, y ese Prolog se ejecuta en el
> servidor. **Cambiar las credenciales de fábrica antes de desplegar** (ver §10).

---

## 8. Frontend React

SPA en `frontend/` con TypeScript. Páginas (`src/pages/`):

| Ruta | Página |
|---|---|
| `/` | Inicio: casos disponibles, caso sorpresa y acceso a historial/multicaso. |
| `/investigacion/:sesion` | Panel del detective (chat + expediente). |
| `/investigacion/:sesion/informe` | Informe final. |
| `/historial` | Historial con filtros y estadísticas. |
| `/estadisticas` | Estadísticas y modo multicaso. |
| `/admin` · `/admin/fuente/:archivo` · `/admin/login` | Módulo administrativo. |

El frontend consume la API JSON (`src/api/`). El `Dockerfile` compila la SPA en
un stage de Node y FastAPI la sirve con fallback a `index.html` (sin que el
comodín se trague los `404` de `/api`).

---

## 9. Opcionales del enunciado (10/10)

1. **Caso aleatorio** — `POST /api/sesiones/aleatorio`.
2. **Puntuación por consultas** — `POST /api/sesiones/{s}/puntos`.
3. **Temporizador** — basado en `sesiones.tiempo_inicio` / `cerrada`.
4. **Niveles de dificultad** — `facil` / `medio` / `dificil`, en la KB.
5. **Sistema de pistas** — 5 por sesión, en orden creciente (`pista/3`).
6. **Grafo sospechosos–evidencias** — `GET /api/sesiones/{s}/grafo` y componente SVG.
7. **Informe PDF** — versión imprimible (`/informe/imprimir` + `@media print`).
8. **Historial** — `GET /api/historial` con filtros y métricas.
9. **Generador de casos JSON/CSV** — `/api/admin/casos/generar*`.
10. **Modo multicaso** — campañas que recorren los casos por dificultad
    (el orden lo decide Prolog con `siguiente_caso/2`).

---

## 10. Configuración y seguridad

### Variables de entorno

| Variable | Default | Qué controla |
|---|---|---|
| `LD_PROLOG_BACKEND` | `auto` | `auto`, `pyswip` o `subprocess` |
| `LD_PROLOG_KB` | `prolog/logic_detective.pl` | Base de conocimiento |
| `LD_SWIPL_BIN` | `swipl` | Ejecutable de SWI-Prolog |
| `LD_DB` | `datos/logic_detective.db` | Base SQLite |
| `LD_TIMEOUT` | `30` | Segundos máximos por consulta |
| `LD_ADMIN_USER` / `LD_ADMIN_PASS` | `admin` / `detective2026` | Credenciales de administración |
| `LD_HOST` / `LD_PORT` | `127.0.0.1` / `8000` | Interfaz y puerto |

### Seguridad implementada

- Inyección de metas: todo identificador pasa por `_atomo` antes de entrar a una
  consulta; el generador JSON/CSV valida campo a campo y **no acepta Prolog
  arbitrario**.
- Path traversal del admin: los nombres de archivo se normalizan y se comprueba
  que queden dentro de `prolog/casos/`.
- Credenciales comparadas con `secrets.compare_digest`.
- Contenedor con usuario sin privilegios (`detective`).
- Respaldo antes de sobrescribir o eliminar cualquier caso.
- Aviso en el log cuando el admin usa credenciales de fábrica.

### Riesgo documentado

El panel `/admin` es **ejecución de código en el servidor** (el Prolog que se
guarda se consulta, y una directiva `:- shell(...)` se ejecuta durante la
validación). No exponer el puerto con las credenciales de fábrica.

---

## 11. Instalación y ejecución

### Docker (recomendado)

```bash
docker compose up --build
# Abrir http://localhost:8000
```

### Sin Docker

```bash
# Frontend (sin esta compilación la API responde, pero no hay interfaz)
cd frontend && pnpm install && pnpm build && cd ..

# Backend — requiere SWI-Prolog
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --workers 1
```

Para desarrollo con recarga en caliente: `pnpm dev` en `frontend/` (Vite en 5173
con proxy de `/api`).

### Solo el motor de inferencia

```bash
swipl prolog/logic_detective.pl
?- responsable(caso1, Quien).
?- explicacion_conclusion(caso3, Explicacion).
```

---

## 12. Pruebas

```bash
.venv/bin/python -m pytest tests/ -v              # backend subprocess
LD_PROLOG_BACKEND=pyswip pytest tests/ -v         # backend embebido
```

**120 pruebas** cubren: motor de inferencia, integración Python–Prolog,
descubrimiento progresivo, bitácora, resolución, seguridad, administración,
generador de casos (JSON y CSV) y modo multicaso. Pasan con **ambos** backends.

---

## 13. CI/CD y despliegue

`.github/workflows/ci.yml` define cinco trabajos encadenados, del más barato al
más caro:

1. `motor-prolog` — compila la KB, valida mínimos, comprueba que el motor deduce
   lo que declara `solucion/2` y que los constructos obligatorios siguen.
2. `frontend` — tipos y build de la SPA.
3. `pruebas` — suite completa contra ambos backends.
4. `contenedor` — construye la imagen, la ejercita y **publica en GHCR**.
5. `desplegar` — instala la imagen en la instancia EC2 y verifica que responde.

Solo al empujar a `main` se publica y despliega. El detalle de la puesta en
producción (GCP o AWS) está en `docs/despliegue.md` y `despliegue/`.

La imagen es multi-stage: Node compila el frontend; Python + SWI-Prolog ejecutan
el backend. En producción `despliegue/docker-compose.prod.yml` usa el puerto 80,
descarga la imagen ya probada de GHCR y persiste los datos en un volumen.

---

## 14. Glosario rápido

| Término | Significado |
|---|---|
| KB | Base de conocimiento (archivos `.pl`). |
| Sesión | Una partida/investigación en curso o cerrada. |
| Descubrimiento | Elemento revelado al usuario (declaración, evidencia, evento…). |
| Veredicto | `correcto` / `incorrecto` según la acusación coincida con `responsable/2`. |
| Pilares | Acceso, oportunidad, motivo y medios; la base de la deducción. |
| Coartada | Declaración de dónde estaba alguien; válida solo si la respalda un testigo fiable y no la refuta evidencia. |
| Campaña | Modo multicaso: secuencia de casos en orden creciente de dificultad. |