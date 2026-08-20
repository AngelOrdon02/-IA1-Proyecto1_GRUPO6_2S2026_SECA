# Plan de Trabajo — Logic Detective (GRUPO 6)

> **Documento de coordinación interna.** Vive en `pruebas/`, que está en `.gitignore`.
> No se sube al repositorio: es la herramienta del coordinador, no un entregable.

- **Curso:** Inteligencia Artificial 1 — Sección A
- **Repositorio:** `https://github.com/AngelOrdon02/-IA1-Proyecto1_GRUPO6_2S2026_SECA`
- **Coordinador:** Angel Ordóñez
- **Fecha de elaboración del plan:** 13/08/2026
- **Fecha límite de entrega:** 28/08/2026 · **Calificación:** 29/08/2026
- **Tiempo restante:** 15 días naturales

---

## 0. Cómo leer este documento

El proyecto se construye de forma centralizada (coordinador + asistencia de IA) y se
**reparte en 5 corrientes de trabajo (workstreams)** verticales. Cada integrante:

1. **Es dueño** de un conjunto de archivos: nadie más los toca sin avisarle.
2. **Debe entender y poder explicar** ese código en la defensa (sección "Debe poder explicar").
3. **Ejecuta tareas reales** sobre esa base: extender, probar, documentar, corregir.
4. **Genera commits propios e identificables** en su área — la rúbrica lo exige.

Esto es deliberado: la rúbrica otorga **30 de 100 puntos a "Gestión de Repositorio y CI/CD"**,
lo que evalúa el rastro de trabajo del equipo, no solo el producto final. Un repo con
commits de una sola persona pierde ese rubro completo aunque el sistema funcione.

---

## 1. Lectura de la rúbrica (dónde están los puntos)

| Área | Pts | Workstream responsable |
|---|---:|---|
| Gestión de Repositorio y CI/CD | **30** | WS5 (+ todos, vía commits) |
| Motor de Inferencia en Prolog | 20 | WS1 + WS2 |
| Desarrollo e Integración en Python | 20 | WS3 + WS4 |
| Contenedorización y Despliegue en la Nube | 20 | WS5 |
| Documentación | 10 | WS5 (+ todos) |
| **TOTAL** | **100** | |

**Conclusión estratégica:** 50 de 100 puntos (CI/CD + Docker/Nube) **no dependen de la
calidad de la IA**. Son los puntos más baratos y los que más grupos pierden por dejarlos
para el final. Por eso el Sprint 0 los ataca primero.

### Requisitos de admisión (checklist Sí/No, pág. 10 del enunciado)

- [ ] Manual técnico, manual de usuario y diagramas arquitectónicos
- [ ] Git correcto, commits descriptivos, CI básico funcional
- [ ] 3 casos modelados; uso comprobable de listas, recursividad, unificación, negación y cortes
- [ ] Interfaz funcional (investigación + administración) con comunicación real vía PySwip
- [ ] Sistema contenerizado y accesible desde una VM en AWS/GCP
- [ ] Informe de participación grupal sumando 100 %

---

## 2. Decisiones de arquitectura (ya tomadas, no re-abrir)

| Decisión | Elección | Razón |
|---|---|---|
| Framework web | **FastAPI + Jinja2** | Server-side rendering: sin build de Node, un solo contenedor, CI simple |
| Puente Prolog | **PySwip** (primario) con backend `subprocess swipl` de respaldo | La rúbrica nombra PySwip explícitamente; el fallback salva el despliegue si falla `libswipl.so` |
| Concurrencia | Lock global + **1 worker** Uvicorn | PySwip no es thread-safe; embebe SWI-Prolog vía ctypes en el proceso |
| Persistencia | **SQLite** (stdlib `sqlite3`) | Sesiones y bitácora; cero dependencias extra, un archivo con volumen Docker |
| Frontend | HTML + CSS + JS vanilla | Sin toolchain; el tiempo se invierte en la lógica, no en webpack |
| Casos | Archivos `.pl` con hechos namespaced por caso | Motor genérico reutilizable; agregar caso = agregar archivo |
| Nube | **GCP `e2-micro`** (free tier) | Más rápido de levantar que AWS para este alcance |

### Restricción de oro

> **Toda deducción vive en Prolog.** Python solo hace `consult`, arma el query,
> serializa la respuesta a JSON y la pinta.

Cualquier `if` en Python que decida sobre culpabilidad, validez de coartada, contradicción
o nivel de sospecha es una pérdida directa de puntos en el rubro 2.1. El punto de mayor
tentación es el **nivel de sospecha**: debe calcularse con `findall/3` + recursión sobre
listas en Prolog, nunca sumando en Python.

---

## 3. División del trabajo — 5 workstreams

### WS1 · Motor de Inferencia (núcleo Prolog)

**Participación: 20 %**

| | |
|---|---|
| **Archivos propios** | `prolog/core/motor.pl`, `sospecha.pl`, `contradicciones.pl`, `explicacion.pl`, `utils.pl` |
| **Misión** | Las reglas genéricas que resuelven *cualquier* caso |

**Entregables**
- Los 16 predicados de inferencia exigidos por el enunciado (acceso, oportunidad, motivo,
  medios, coartada válida/inválida, contradicción decl-decl, contradicción decl-evidencia,
  información falsa, evidencia por sospechoso, relaciones, nivel de sospecha, cómplices,
  principal sospechoso, responsable, explicación).
- Uso comprobable de los 10 constructos: hechos, reglas, consultas, variables, predicados,
  **listas**, **recursividad**, **unificación**, **negación**, **cortes**.
- `docs/mapa_constructos.md`: tabla que dice archivo y línea donde vive cada constructo.
  *No dependas de que el tutor lo encuentre solo.*

**Debe poder explicar**
- Por qué `\+` es negación por fallo y no negación lógica, y qué implica para un sospechoso
  sin coartada registrada.
- Qué corta exactamente cada `!` del motor y qué pasaría si se quita.
- Cómo `alcanzable/4` recorre el grafo de lugares sin caer en ciclo infinito.
- Cómo se acumula el puntaje de sospecha recursivamente sobre una lista.

**Tareas asignables**
1. Añadir 2 reglas nuevas de inferencia de motivo (p. ej. motivo por herencia, por encubrimiento).
2. Escribir 15 consultas manuales en `swipl` y documentar entrada/salida en `docs/consultas_ejemplo.md`.
3. Auditar que ningún predicado deje choicepoints innecesarios.

---

### WS2 · Base de Conocimiento (los 3 casos)

**Participación: 20 %**

| | |
|---|---|
| **Archivos propios** | `prolog/casos/caso1_museo.pl`, `caso2_hospital.pl`, `caso3_corporativo.pl` |
| **Misión** | Que los casos sean resolubles, no triviales y cumplan los mínimos |

**Mínimos por caso (obligatorio, se cuenta):**

| Elemento | Mínimo |
|---|---:|
| Sospechosos | 4 |
| Evidencias | 10 |
| Lugares | 5 |
| Declaraciones | 5 |
| Reglas de inferencia propias del caso | 10 |

> **Nota de interpretación:** las 10 reglas se cuentan *por caso*, además de las genéricas
> del motor. Cada archivo de caso define sus propias reglas especializadas (motivos
> concretos, accesos restringidos, medios requeridos). Así se cumple la lectura literal
> del enunciado.

**Entregables**
- 3 casos con culpable único deducible y al menos una pista falsa (*red herring*).
- Cada caso debe tener: 1 coartada inválida verificable, 2 contradicciones detectables,
  1 cómplice inferible.
- `docs/casos.md`: solución esperada de cada caso, para validar contra el motor.

**Debe poder explicar**
- La cadena deductiva completa que lleva al culpable en cada caso.
- Por qué los sospechosos inocentes quedan descartados (qué predicado los excluye).
- El esquema de hechos: qué significa cada argumento de `evidencia/6`, `declaracion/4`, `afirma/3`.

**Tareas asignables**
1. Diseñar el caso 3 completo desde cero siguiendo el esquema de hechos.
2. Verificar los mínimos con el script `scripts/validar_casos.py`.
3. Balancear dificultad: que el caso 1 sea fácil, el 2 medio, el 3 difícil.

---

### WS3 · Backend e Integración Python

**Participación: 20 %**

| | |
|---|---|
| **Archivos propios** | `app/prolog/`, `app/services/`, `app/routers/`, `app/storage/` |
| **Misión** | El puente Python↔Prolog y el estado de la partida |

**Entregables**
- `PrologEngine`: abstracción con backends PySwip y subprocess, lock global, `consult` de
  motor + casos al arranque.
- Estado de **descubrimiento progresivo**: el usuario no ve la KB completa; las deducciones
  operan solo sobre lo ya revelado, pasando la lista de hechos conocidos a Prolog.
- Bitácora: toda acción del usuario persiste en SQLite con timestamp.
- CRUD administrativo de casos.

**Debe poder explicar**
- Por qué PySwip no es thread-safe y qué hace el lock.
- Cómo se separa "la verdad del caso" (KB) de "lo que el usuario sabe" (sesión) — y por qué
  usar `assert`/`retract` sobre la KB compartida habría corrompido el estado entre sesiones.
- El recorrido completo de un request: HTTP → router → service → engine → Prolog → JSON.

**Tareas asignables**
1. Implementar el endpoint de exportación del informe final.
2. Añadir manejo de errores para query malformado (Prolog lanza excepción → 400 legible).
3. Escribir los tests de integración del engine.

---

### WS4 · Frontend / Módulo de Investigación

**Participación: 20 %**

| | |
|---|---|
| **Archivos propios** | `app/templates/`, `app/static/` |
| **Misión** | Las 16 acciones del detective, usables y registradas |

**Las 16 acciones obligatorias (checklist del enunciado, pág. 6):**

- [ ] Seleccionar caso · [ ] Ver descripción inicial · [ ] Lista de sospechosos
- [ ] Interrogar sospechosos y testigos · [ ] Investigar lugares · [ ] Examinar evidencias
- [ ] Consultar relaciones · [ ] Analizar motivos y oportunidades · [ ] Revisar coartadas
- [ ] Línea temporal · [ ] Detectar contradicciones · [ ] Solicitar pista
- [ ] Nivel de sospecha · [ ] Emitir acusación final · [ ] Ver resultado
- [ ] Consultar explicación lógica

Más: pantalla de **Inicio** con nombre, propósito, casos disponibles, acceso a admin y
**estado de casos iniciados/completados**; y **bitácora** visible.

**Debe poder explicar**
- Cómo el descubrimiento progresivo se refleja en la UI (qué está bloqueado y por qué).
- Cómo se renderiza la explicación lógica que devuelve Prolog.

**Tareas asignables**
1. Vista de línea temporal (ordenar eventos descubiertos por hora).
2. Pantalla de resultado de acusación con la cadena de reglas activadas.
3. Capturas de pantalla para el manual de usuario (entregable de WS5).

---

### WS5 · DevOps, QA y Documentación

**Participación: 20 %** — *es el workstream que más puntos controla (60 de 100)*

| | |
|---|---|
| **Archivos propios** | `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `tests/`, `docs/` |
| **Misión** | Que exista, se pruebe, se despliegue y se documente |

**Entregables**
- `Dockerfile` (Python 3.12-slim + `swi-prolog-nox` + PySwip) y `docker-compose.yml` funcionales.
- GitHub Actions: lint + `pytest` en cada push y PR.
- **≥10 casos de prueba automatizados**, resolviendo ≥80 % de las consultas evaluadas
  *(criterio medible del objetivo SMART — es el único número de éxito del enunciado).*
- Despliegue en VM GCP `e2-micro`, accesible por IP pública.
- Manual técnico, manual de usuario **con capturas**, diagrama de arquitectura,
  **diagrama de flujo** (son entregables separados en el enunciado).
- Informe de participación grupal, respaldado por commits.

**Debe poder explicar**
- Qué hace cada capa del `Dockerfile` y por qué SWI-Prolog se instala por apt.
- Qué corre el pipeline y qué lo hace fallar.
- El procedimiento de despliegue completo, de cero a IP pública.

**Tareas asignables**
1. Levantar la VM y dejar el despliegue documentado paso a paso.
2. Ampliar la suite de tests hasta cubrir los 16 predicados.
3. Redactar el manual de usuario con las capturas de WS4.

---

## 4. Matriz RACI

| Entregable | WS1 | WS2 | WS3 | WS4 | WS5 |
|---|:-:|:-:|:-:|:-:|:-:|
| Motor de inferencia | **R** | C | C | I | I |
| 3 casos de investigación | C | **R** | I | I | I |
| API + integración PySwip | C | I | **R** | C | I |
| Interfaz de investigación | I | I | C | **R** | I |
| Módulo administrativo | I | C | **R** | C | I |
| Docker + CI/CD | I | I | C | I | **R** |
| Despliegue en nube | I | I | C | I | **R** |
| Pruebas automatizadas | C | C | C | I | **R** |
| Documentación y manuales | C | C | C | C | **R** |
| Informe de participación | I | I | I | I | I |

*(R = Responsable · C = Consultado · I = Informado. El informe de participación es del coordinador.)*

---

## 5. Cronograma — 3 sprints en 15 días

### Sprint 0 — Cimientos (días 1–2 · 13–14 ago)
> **Objetivo: asegurar los 30 puntos de CI/CD desde el primer día.**

- Estructura del repo, `requirements.txt`, esqueleto de la app
- `Dockerfile` + `docker-compose.yml` que ya levanten Python + SWI-Prolog
- GitHub Actions verde con la primera prueba
- **Todos los integrantes hacen al menos 1 commit** (aunque sea de documentación)

**Salida:** `docker compose up` sirve una página y el badge de CI está en verde.

### Sprint 1 — Vertical completo (días 3–7 · 15–19 ago)
> **Objetivo: un caso resuelto de punta a punta. Un caso completo enseña más que tres a medias.**

- Motor de inferencia con los 16 predicados (WS1)
- Caso 1 completo y validado (WS2)
- API + descubrimiento progresivo + bitácora (WS3)
- UI con las 16 acciones (WS4)
- Primeros 10 tests (WS5)

**Salida:** el caso 1 se juega de inicio a acusación con explicación lógica.

### Sprint 2 — Escala y cierre (días 8–12 · 20–24 ago)
- Casos 2 y 3 (WS2) — si el motor está bien parametrizado, esto es solo datos
- Módulo administrativo (WS3)
- Informe final del caso, exportación (WS3+WS4)
- Suite completa de tests, cobertura de los 16 predicados (WS5)
- Despliegue en GCP (WS5)

### Sprint 3 — Entrega (días 13–15 · 25–27 ago)
- Documentación, manuales con capturas, diagramas
- Informe de participación
- Ensayo de la defensa: cada quien explica lo suyo
- **Día 15 = buffer.** Siempre se usa.

> **28/08 — Entrega.** Recordatorio: la entrega es **individual, en Classroom Y en UEDI**,
> por cada integrante. No basta con que la haga el coordinador.

---

## 6. Protocolo de repositorio

**Ramas:** `main` protegida · `ws1-motor`, `ws2-casos`, `ws3-backend`, `ws4-frontend`,
`ws5-devops` · PR hacia `main` con al menos 1 revisor.

**Commits (Conventional Commits, en español):**

```
feat(motor): agrega inferencia de complicidad recursiva
fix(backend): corrige lock de PySwip en peticiones concurrentes
docs(manual): agrega capturas del modulo de investigacion
test(casos): valida minimos del caso 2
```

**Regla no negociable:** cada integrante debe cerrar con commits propios en su área.
La rúbrica pide "aportes de los integrantes mediante commits identificables" y el informe
de participación debe estar "respaldado por evidencias verificables". Un `git log --author`
por persona es literalmente la evidencia que se revisa.

---

## 7. Definición de Terminado (DoD)

Una tarea está terminada cuando:

1. El código corre dentro del contenedor, no solo en la máquina de quien lo escribió.
2. Tiene al menos un test que la cubre y CI está en verde.
3. Está documentada en `docs/` si cambia comportamiento visible.
4. Su dueño puede explicarla sin leer el código.

---

## 8. Riesgos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|:-:|:-:|---|
| R1 | PySwip falla al encontrar `libswipl.so` en Docker | Alta | Alto | Backend `subprocess` de respaldo desde el día 1; `SWI_HOME_DIR` fijado en el Dockerfile |
| R2 | PySwip se rompe con peticiones concurrentes | Alta | Alto | Lock global + 1 worker Uvicorn; documentado como decisión, no como accidente |
| R3 | Lógica deductiva se filtra a Python | Media | **Alto** | Revisión de PR explícita; `grep` de condicionales en `services/`; test que compara resultado vía Prolog puro |
| R4 | La VM en nube se deja para el final | Media | Alto | Sprint 2, no Sprint 3. Verificar que siga encendida el 28/08 |
| R5 | Commits concentrados en una sola persona | **Alta** | **Alto** | Revisión semanal de `git shortlog -sn`; tareas asignables listadas por workstream |
| R6 | Módulo administrativo mal interpretado | Media | Medio | El enunciado **no lo especifica** (error de copiar/pegar en el PDF, pág. 6: el título dice "Módulo Administrativo" pero el texto describe el motor). Consultar al tutor; mientras tanto, CRUD de casos + documentar la suposición |
| R7 | Alcance opcional consume tiempo del obligatorio | Media | Medio | Congelado hasta terminar Sprint 2. Solo entonces: pistas, dificultad, export PDF |

---

## 9. Preguntas abiertas para el tutor

1. ¿Qué alcance exacto debe tener el **módulo administrativo**? El enunciado no lo define.
2. ¿El despliegue debe estar **vivo el día de la calificación** o basta con evidencia?
3. ¿Los 3 casos deben tener solución **determinista única**?
4. ¿Interfaz web es obligatoria? (el alcance dice "escritorio o web", pero la rúbrica de
   despliegue exige VM accesible → en la práctica, web).

---

## 10. Informe de participación (plantilla — suma 100 %)

| Integrante | Workstream | % | Evidencia |
|---|---|---:|---|
| Angel Ordóñez | WS3 Backend + Coordinación | 20 % | commits `ws3-*`, integración, PRs revisados |
| *(pendiente)* | WS1 Motor Prolog | 20 % | commits `ws1-*`, `docs/mapa_constructos.md` |
| *(pendiente)* | WS2 Casos | 20 % | commits `ws2-*`, `docs/casos.md` |
| *(pendiente)* | WS4 Frontend | 20 % | commits `ws4-*`, capturas del manual |
| *(pendiente)* | WS5 DevOps/QA/Docs | 20 % | commits `ws5-*`, pipeline, despliegue |
| **TOTAL** | | **100 %** | |

---

## 11. Estado de avance

> Actualizar al cierre de cada sprint.

- [x] Plan de trabajo y división en 5 workstreams
- [x] **Sprint 0 — Cimientos** (13/08) — repo, Docker, compose, CI, 86 pruebas
- [x] **Sprint 1 — Vertical completo** (13/08) — motor, caso 1, API, UI, informe
- [x] **Sprint 2 — Escala** (13/08) — casos 2 y 3, módulo administrativo, docs
- [ ] Sprint 3 — Entrega

### Lo que ya está construido (commit `d104710`)

| Entregable | Estado |
|---|---|
| Motor de inferencia, 16 predicados | [OK] Completo y validado |
| 3 casos (4/10/5/5/10 cada uno) | [OK] Culpable único deducible en los tres |
| Módulo de investigación, 16 acciones | [OK] 14 secciones funcionando |
| Módulo administrativo | [OK] CRUD con validación sintáctica |
| Puente PySwip + fallback subproceso | [OK] Ambos backends verificados |
| `Dockerfile` + `docker-compose.yml` | [OK] Imagen construida y probada |
| GitHub Actions (3 jobs) | [OK] Pasos verificados localmente |
| Pruebas automatizadas | [OK] 86 pasando (el SMART pedía ≥10) |
| Documentación técnica | [OK] 5 documentos en `docs/` |

### Lo que falta — trabajo real a repartir

| # | Tarea | WS | Bloquea |
|---|---|---|---|
| 1 | **Desplegar en la VM de GCP** y dejarla encendida | WS5 | 20 pts de rúbrica |
| 2 | **Capturas de pantalla** para el manual de usuario | WS4→WS5 | Requisito de admisión |
| 3 | **Diagrama de flujo** (entregable aparte del de arquitectura) | WS5 | Entregable |
| 4 | **Informe de participación** con `git shortlog -sn` | Coordinador | Requisito de admisión |
| 5 | **Commits propios de cada integrante** | Todos | **30 pts de rúbrica** |
| 6 | Confirmar con el tutor el alcance del módulo administrativo | Coordinador | Riesgo R6 |
| 7 | `docs/consultas_ejemplo.md` con 15 consultas manuales | WS1 | Refuerza rubro 2.1 |
| 8 | Ensayo de la defensa: cada quien explica lo suyo | Todos | Nota individual |

> [Alerta] **La tarea 5 es la más urgente.** El proyecto está construido pero todos
> los commits son de una sola persona. La rúbrica otorga 30 puntos a "aportes
> de los integrantes mediante commits identificables". Repartir las tareas
> 1, 2, 3 y 7 entre los cuatro integrantes restantes **esta semana**, no la
> última.
