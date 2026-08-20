# Logic Detective — Lo que falta por hacer

> Estado verificado el **16/08/2026** sobre la rama `feature/202300512`.
> Entrega: **28/08/2026** · Calificación: **29/08/2026**.
>
> Todo lo marcado [OK] fue comprobado ejecutando el código, no leyendo la
> documentación. Varios documentos del repo (`README.md`, `pruebas/Plan_Trabajo_*.md`)
> afirman cosas que **no** están en el repositorio; esas discrepancias están
> señaladas abajo.

---

## 0. Resumen ejecutivo

| Rubro de la rúbrica | Pts | Estado real |
|---|---|---|
| 2.1 Motor de Inferencia en Prolog | 20 | [OK] **Completo** — 3 casos válidos, 16 predicados, constructos comprobados |
| 2.2 Desarrollo e Integración en Python | 20 | [En progreso] **Funciona** — API + admin OK; **4 pruebas rotas** tras migrar a React |
| 2.3 Contenedorización y Despliegue | 20 | [En progreso] **Imagen verificada 16/08**, falta desplegar en la nube |
| 1.2 Gestión de Repositorio y CI/CD | 30 | [Critico] **En riesgo** — pipeline **pospuesto por decisión del equipo**, `main` vacío, commits de una sola persona |
| 1.1 Documentación | 10 | [En progreso] **A medias** — 5 docs escritos, faltan capturas y diagrama de flujo |

**Los 30 puntos de repositorio/CI son hoy el mayor riesgo del proyecto**, no el
motor de inferencia.

---

## 0.bis Contenerización — resuelta el 16/08

La app migró de plantillas Jinja a un **frontend React (Vite + TypeScript)**
servido por FastAPI como SPA. Eso rompió el build; lo corregido fue:

- [x] **`main.py`: faltaba `from fastapi.staticfiles import StaticFiles`** — el
      contenedor moría al importar.
- [x] **`.dockerignore` creado.** Era el fallo de fondo: sin él, `COPY frontend/ ./`
      copiaba el `node_modules` del host encima del instalado en la imagen, y
      como pnpm usa enlaces simbólicos a su almacén, llegaban rotos.
- [x] **Stage de Node reescrito.** Se quitó el `|| true` que ocultaba el error
      real del `pnpm install`, se fijó `pnpm@11.9.0` en vez de `corepack` sin
      versión, y se copian `.npmrc` y `pnpm-workspace.yaml` **antes** del
      install: son los que autorizan el script de instalación de esbuild
      (pnpm 10+ lo bloquea por defecto), sin los cuales `vite build` falla.
- [x] **Fallback de la SPA endurecido**: sirve archivos reales con `FileResponse`
      (antes devolvía todo como HTML, rompiendo el content-type), devuelve 404
      en `/api/*` inexistente en vez de la página, y comprueba que la ruta
      resuelta siga dentro de `dist/` para que un `../` no sirva archivos del
      contenedor.

**Verificado end-to-end** con la imagen ya construida: contenedor `healthy`,
backend **pyswip** (no el fallback de subproceso), los 3 casos cargados, la SPA
sirviéndose, `/api/admin` pidiendo autenticación, y una partida completa
`caso1 → acusar a marco → veredicto correcto (136 pts)`.

- [ ] **Pendiente: 4 pruebas rotas.** `test_30`, `test_43`, `test_46` y `test_47`
      siguen apuntando a las rutas Jinja eliminadas (`/`, `/investigacion/{s}/informe`,
      `/admin`), que ahora las atiende el comodín de la SPA y devuelven 200.
      Hay que reescribirlas contra la API JSON. **82 de 86 pasan.**

---

## 1. Verificado que YA funciona (no tocar)

- [OK] Los 3 casos cumplen los mínimos exactos: `conteo(4,10,5,5,10)` en `caso1`,
  `caso2` y `caso3`; `cumple_minimos/1` da verdadero en los tres.
- [OK] Cada caso tiene un culpable único deducible:
  `caso1 → marco`, `caso2 → quim_sofia`, `caso3 → lic_vera`.
- [OK] Los 16 predicados de inferencia exigidos existen y responden
  (`tiene_acceso`, `tuvo_oportunidad`, `tiene_medios`, `coartada_valida`,
  `coartada_invalida`, `contradice_*`, `informacion_falsa`, `relacion_relevante`,
  `nivel_sospecha`, `posible_complice`, `principal_sospechoso`, `responsable`,
  `explicacion`, `explicacion_conclusion`).
- [OK] Constructos obligatorios presentes: cortes (9 usos), negación `\+` (24),
  `findall`/listas (33), recursividad, unificación.
- [OK] **82 de 86 pruebas pasando** (`pytest tests/ -q`); el SMART pedía ≥10. Las 4
  rotas son de la interfaz vieja, ver sección 0.bis.
- [OK] El módulo de investigación funciona completo, con bitácora por acción.
- [OK] Módulo administrativo con edición de la KB, validación sintáctica, exportar,
  eliminar con respaldo e historial de sesiones.
- [OK] `Dockerfile` multi-stage (Node para el frontend, Python + SWI-Prolog para el
  backend) y `docker-compose.yml`: un worker, healthcheck, usuario sin
  privilegios y volumen persistente. **Build y arranque comprobados el 16/08.**
- [OK] Puente PySwip con fallback a subproceso.

---

## 2. OBLIGATORIO pendiente (bloquea puntos)

### 2.1 CI/CD — GitHub Actions · [Critico] CRÍTICO · [Pospuesto] pospuesto a propósito
> Decisión del equipo (16/08): primero dejar la contenerización funcionando.
> Retomar en cuanto el build esté estable — son 30 puntos de la rúbrica y el
> pipeline necesita margen para ponerse en verde antes del 28/08.

- [ ] **Crear `.github/workflows/ci.yml`. Hoy no existe en ninguna rama.**
      El `README.md` y el plan de trabajo lo dan por hecho ("CI/CD Configurado [OK]"),
      pero `git log --all -- .github` no devuelve nada.
- [ ] Jobs mínimos: (1) instalar SWI-Prolog + dependencias y correr `pytest`,
      (2) validar sintaxis de la KB (`swipl -g "consult('prolog/logic_detective.pl')"`),
      (3) `docker build` de la imagen.
- [ ] Que el pipeline dispare en `push` y `pull_request` sobre `main` y `develop`.
- [ ] Añadir el badge de estado al `README.md`.

### 2.2 Higiene del repositorio · [En progreso] (parcialmente resuelto el 16/08)
- [x] **`.gitignore` creado.** Cubre secretos (`.env`, `*.pem`, `*.key`,
      `service-account*.json`), `__pycache__`, entornos virtuales, caché de
      pytest, `datos/*.db` y `datos/respaldos/`.
- [x] **Artefactos sacados del índice** con `git rm -r --cached`: 20 `.pyc` y
      `datos/logic_detective.db` (contenía 1 sesión, 17 descubrimientos y 17
      entradas de bitácora de partidas de prueba). Los archivos siguen en disco;
      solo dejan de versionarse. Se añadió `datos/.gitkeep` para conservar la carpeta.
- [x] **`.env.example` creado** como plantilla pública sin valores reales.
- [ ] **Fusionar el trabajo a `main`.** `main` y `origin/main` contienen *solo*
      `Proyecto 1 - 2S2026.pdf`; todo el código vive en `develop` y en ramas de
      feature. Si el tutor clona `main`, no encuentra el proyecto.
- [ ] Limpiar/mergear las ramas huérfanas (`feat/infraestructura`,
      `feature/backend`, `feature/motor_prolog_angel`, `feature/prolog_casos_salida_jose`).
- [ ] Decidir si `docs/enunciado/` (el enunciado del curso) se versiona o se
      ignora. Hoy está sin seguimiento.

### 2.3 Commits identificables por integrante · [Critico] CRÍTICO (30 pts)
- [ ] Repartir el trabajo restante de esta lista entre los 5 integrantes para que
      cada uno tenga commits propios y descriptivos. La rúbrica exige "aportes de
      los integrantes mediante commits identificables"; hoy la autoría está
      concentrada.
- [ ] Mantener la convención ya usada: `feat(<carnet>): ...`, `docs(<carnet>): ...`,
      `test(<carnet>): ...`.

### 2.4 Despliegue en la nube (GCP/AWS) · [Critico] 20 pts
- [ ] Crear la VM y desplegar con `docker compose up -d`. Los pasos ya están
      escritos en `docs/despliegue.md`, solo falta **ejecutarlos**.
- [ ] **Cambiar `LD_ADMIN_USER` / `LD_ADMIN_PASS`** antes de exponer el puerto
      — ver la sección 6, es el punto de seguridad más serio del proyecto.
- [ ] Dejar la VM encendida hasta después de la calificación (29/08).
- [ ] Anotar la **IP pública** en `README.md` y en `docs/despliegue.md`, y adjuntar
      capturas del sistema corriendo en la nube.

### 2.5 Documentación · [En progreso] 10 pts + requisito de admisión
- [ ] **Capturas de pantalla en `docs/manual_usuario.md`.** El propio documento
      admite en su línea 4 que faltan; el enunciado las exige explícitamente.
      Mínimo: inicio, panel, interrogatorio, evidencias, contradicciones,
      nivel de sospecha, acusación, informe final, panel admin.
- [ ] **Diagrama de flujo** del sistema (entregable independiente del de
      arquitectura). `docs/arquitectura.md` ya tiene 2 diagramas Mermaid; falta el
      recorrido de acciones del detective de inicio a informe.
- [ ] **Manual técnico** consolidado (o dejar explícito que lo forman
      `arquitectura.md` + `mapa_constructos.md` + `despliegue.md`, enlazados desde
      un índice).
- [ ] `docs/consultas_ejemplo.md`: 10–15 consultas Prolog manuales con su salida
      esperada. Refuerza directamente el rubro 2.1.
- [ ] Corregir el bloque **"Estado"** del `README.md`: hoy declara CI/CD como
      configurado, lo cual es falso. Igual en `pruebas/Plan_Trabajo_Logic_Detective.md`
      (línea ~400, "GitHub Actions (3 jobs) [OK]").

### 2.6 Informe de participación grupal · requisito de admisión
- [ ] El coordinador debe entregar la tabla de actividades y **porcentajes que
      sumen 100 %**, respaldada con evidencia (`git shortlog -sn --all`, PRs, docs).
- [ ] La tabla en `pruebas/Plan_Trabajo_Logic_Detective.md` (líneas 371-375) tiene
      4 de 5 filas como *(pendiente)*: hay que nombrar a cada integrante.

### 2.7 Entrega
- [ ] Subir el proyecto **a Classroom y a UEDI de forma individual** (cada
      integrante, no solo el coordinador).
- [ ] Verificar que el nombre del repositorio siga el formato
      `[IA1]Proyecto1_GRUPO6_2S2026_SECA`.
- [ ] Ensayo de la defensa: cada integrante explica su módulo.

---

## 3. OPCIONALES del enunciado (sección 3.2 "Alcance opcional")

Estado de los 10 opcionales listados en el enunciado:

| # | Funcionalidad | Estado | Esfuerzo |
|---|---|---|---|
| 1 | Selección aleatoria del caso al iniciar | [No] No implementado | Bajo |
| 2 | Puntuación por cantidad de consultas | [No] No implementado | Bajo |
| 3 | Temporizador para resolver el caso | [No] No implementado | Bajo |
| 4 | Niveles de dificultad | [OK] **Hecho** (`facil`/`medio`/`dificil`) | — |
| 5 | Sistema de pistas | [OK] **Hecho** (`pista/3`, 5 por sesión) | — |
| 6 | Visualización gráfica sospechosos–evidencias | [OK] **Hecho** (`GET /api/sesiones/{s}/grafo`, component SVG interactivo) | — |
| 7 | Exportación del informe en PDF | [OK] **Hecho** (Estilos `@media print`, `window.print()` y `/informe/imprimir`) | — |
| 8 | Historial de investigaciones resueltas | [OK] **Hecho** (`/historial`, filtros por caso/veredicto y estadísticas) | — |
| 9 | Generador de casos desde JSON/CSV | [No] No implementado | Alto |
| 10 | Modo multicaso con estadísticas | [No] No implementado | Medio |

### Detalle y ruta de implementación

- [ ] **(1) Caso aleatorio** — botón "Caso sorpresa" en `inicio.html` que llame a
      un `POST /iniciar-aleatorio`; elegir con `random_member/2` en Prolog para que
      la decisión no viva en Python.
- [ ] **(2) Puntuación por consultas** — la bitácora ya registra cada acción
      (`app/storage/db.py`, tabla `bitacora`). Basta contar filas por sesión y
      restar puntos por pista usada (`sesiones.pistas` ya existe). Mostrar en el
      informe final.
- [ ] **(3) Temporizador** — `sesiones.iniciada` y `sesiones.cerrada` ya se guardan
      en ISO 8601; solo falta calcular la diferencia y mostrarla, más un contador
      en vivo en `panel.html`.
- [x] **(6) Grafo de relaciones** — Grafo interactivo SVG (`frontend/src/organisms/GrafoRelaciones.tsx`)
      y endpoint `GET /api/sesiones/{sesion}/grafo`. Visualiza sospechosos (con niveles de sospecha),
      evidencias descubiertas, vínculos físicos y relaciones interpersonales. Integrado en el panel
      de expediente (pestaña "Grafo") y en el informe final.
- [x] **(7) PDF del informe** — Botón de exportación e impresión (`window.print()`), estilos
      dedicados `@media print` en `index.css` y ruta de vista imprimible
      `GET /api/sesiones/{sesion}/informe/imprimir`.
- [x] **(8) Historial** — Vista dedicada `/historial` (`frontend/src/pages/HistorialPage.tsx`)
      con métricas globales (tasa de éxito, promedio de pistas), filtros por caso, estado y veredicto,
      búsqueda en tiempo real y enlaces a informes/continuación. Endpoint `GET /api/historial`.
- [ ] **(9) Generador desde JSON/CSV** — el admin hoy crea casos desde una
      plantilla `.pl` (`app/services/admin.py:_plantilla`). Habría que añadir un
      importador que traduzca JSON/CSV a hechos Prolog y valide con
      `cumple_minimos/1` antes de escribir. Es el opcional más caro.
- [ ] **(10) Estadísticas multicaso** — agregar sobre la tabla `sesiones`:
      partidas por caso, % de aciertos, tiempo medio, pistas medias. Mostrar en
      `/admin` o en el nuevo `/historial`.

**Recomendación:** hacer **(2), (3), (7) y (8)** — los cuatro son de esfuerzo bajo,
reutilizan datos que ya se guardan y dan cuatro commits repartibles entre
integrantes distintos. Dejar **(9)** para el final, o no hacerlo.

---

## 4. Orden sugerido de trabajo

| Prioridad | Tarea | Por qué primero |
|---|---|---|
| 1 | `.gitignore` + merge a `main` | Sin esto el tutor no ve el proyecto |
| 2 | `.github/workflows/ci.yml` | 30 pts; hay que dejar tiempo para que el pipeline pase en verde |
| 3 | Despliegue en GCP | 20 pts; depende de que la imagen esté en `main` |
| 4 | Capturas + manual de usuario | Requisito de admisión; necesita la app corriendo |
| 5 | Diagrama de flujo + `consultas_ejemplo.md` | Documentación, 10 pts |
| 6 | Informe de participación | Requisito de admisión, lo hace el coordinador |
| 7 | Opcionales (2), (3), (7), (8) | Suman valor y generan commits repartibles |
| 8 | Corregir `README.md` y el plan | Que la documentación no afirme lo que no existe |

---

## 5. Comprobaciones antes de entregar

```bash
# 1. La KB carga y los tres casos cumplen los mínimos
swipl -q -g "forall(member(C,[caso1,caso2,caso3]), (conteo_caso(C,X), cumple_minimos(C), format('~w ~w ok~n',[C,X])))" -t halt prolog/logic_detective.pl

# 2. Las pruebas pasan (hay 4 pendientes de migrar a la API, ver 0.bis)
python -m pytest tests/ -q

# 3. La imagen construye y arranca
docker compose up --build -d && curl -s localhost:8000/salud

# 4. El pipeline está en verde en GitHub

# 5. La VM en la nube responde
curl -s http://<IP_PUBLICA>:8000/salud
```

---

## 6. Seguridad

Revisión hecha el 16/08/2026 sobre todo el código de la aplicación.

### 6.1 Lo que ya estaba bien resuelto

- [OK] **Inyección de metas Prolog**: todo identificador que llega del usuario pasa
  por `_ATOMO` en `app/services/investigacion.py:30` antes de formar parte de una
  consulta. Hay una prueba que lo verifica (`test_48`).
- [OK] **Path traversal en el módulo administrativo**: `_archivo_de()` y
  `guardar_fuente()` normalizan con `Path(archivo).name` y comprueban que el
  padre resuelto sea `prolog/casos`.
- [OK] **Comparación de credenciales** con `secrets.compare_digest`, sin fuga por
  tiempo de respuesta.
- [OK] **Contenedor sin privilegios**: el `Dockerfile` crea y usa el usuario
  `detective`, no `root`.
- [OK] **Respaldo antes de sobrescribir** cualquier archivo de caso.

### 6.2 [Critico] Riesgo principal: `/admin` es ejecución de código en el servidor

El panel administrativo permite **escribir código Prolog arbitrario**
(`POST /admin/fuente/{archivo}`), y ese contenido se carga con `consult`, tanto
al validarlo (`_validar_sintaxis`) como al recargar el motor. Una directiva
Prolog del tipo `:- shell('...')` se **ejecuta** al consultar el archivo.

**Comprobado el 16/08/2026:** un archivo con `:- shell('echo ... > marca.txt').`
crea el archivo al pasar por `_validar_sintaxis`, es decir, el código corre
*durante la validación*, antes incluso de que el caso se guarde.

Es decir: quien entre a `/admin` puede ejecutar código en la máquina. Con las
credenciales de fábrica (`admin` / `detective2026`, publicadas en el `README`) y
el puerto 8000 abierto a Internet, eso es entregarle la VM a cualquiera que lea
el repositorio.

Mitigaciones, en orden de importancia:

- [ ] **`.env` obligatorio en la VM** con `LD_ADMIN_PASS` larga y aleatoria.
      Generarla con `python3 -c "import secrets; print(secrets.token_urlsafe(24))"`.
- [x] Aviso automático en el log de arranque cuando siguen activas las
      credenciales de fábrica (`app/main.py`, `config.usa_credenciales_por_defecto()`).
- [ ] **Restringir `/admin` por firewall** a la IP del equipo, o dejar el puerto
      8000 abierto solo durante la calificación.
- [ ] Considerar rechazar directivas (`:- ...`) en el contenido enviado desde
      `/admin`, o validar la sintaxis con `swipl` en modo sin efectos secundarios.

### 6.3 Otros puntos a atender antes del despliegue

- [ ] **Sin TLS**: HTTP Basic viaja en claro. Para una VM de curso es aceptable,
      pero conviene dejarlo dicho en `docs/despliegue.md` y no reutilizar ahí una
      contraseña personal.
- [ ] **Base de datos versionada** (ya corregido): contenía bitácoras de
      partidas. No es información sensible, pero el hábito sí importa —
      cualquier `.db` de producción arrastraría datos de usuarios.
- [ ] **`LD_TIMEOUT`** (30 s) limita cada consulta Prolog; verificar que sigue
      vigente en el backend de subproceso para que una regla mal escrita en un
      caso creado desde `/admin` no cuelgue el servidor.
- [ ] **Nunca subir** claves de servicio de GCP/AWS al repo. El `.gitignore` ya
      cubre `service-account*.json`, `credenciales*.json`, `*.pem` y `*.key`.
- [ ] Si alguna vez se sube una contraseña real por error, **no basta con
      borrarla en el commit siguiente**: queda en el historial. Habría que
      rotar la credencial y reescribir el historial.

---

## 7. Checklist antes de cada `push`

```bash
# 1. Que no se cuele nada que deba estar ignorado
git status --short
git check-ignore -v .env datos/logic_detective.db      # deben salir ignorados

# 2. Que no haya secretos en lo que se va a subir
git diff --cached -U0 | grep -inE "password|passwd|secret|api[_-]?key|token" 

# 3. Que las pruebas pasen
python -m pytest tests/ -q                              # hoy: 82 passed, 4 failed

# 4. Que la base de conocimiento cargue
swipl -q -g "consult('prolog/logic_detective.pl'), halt"

# 5. Commit descriptivo y con el carné del autor
git commit -m "chore(<carne>): descripcion en imperativo"
```
