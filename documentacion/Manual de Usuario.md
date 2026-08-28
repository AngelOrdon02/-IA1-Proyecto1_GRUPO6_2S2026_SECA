# Manual de Usuario — Logic Detective

Bienvenido. **Logic Detective** es un sistema experto que te pone en el papel de
un detective encargado de resolver casos criminales. Interrogas sospechosos,
inspeccionas lugares y examinas evidencias; un motor de inteligencia artificial
(en Prolog) analiza todo lo que descubres y te ayuda a deducir quién es el
responsable.

- **Público:** estudiantes, profesores y cualquier persona que use el sistema.
- **Duración típica por caso:** 5–15 minutos.
- **Número de casos:** 3 (fácil, medio y difícil), además de casos generados.

---

## 1. Acceder al sistema

1. Abre el navegador.
2. Ve a la dirección donde está publicada la aplicación:

   | Entorno | Dirección |
   |---|---|
   | Local (Docker) | `http://localhost:8000` |
   | Local (desarrollo) | `http://localhost:5173` |
   | Despliegue en la nube | `http://<IP-DE-LA-INSTANCIA>/` |

3. Deberías ver la pantalla de **inicio**. Desde aquí eliges un caso para
   investigar.

[CAPTURA: pantalla de inicio con los casos disponibles]

---

## 2. Pantalla de inicio

La pantalla de inicio te muestra:

- **Los 3 casos disponibles**, cada uno con su título, descripción y nivel de
  dificultad (fácil / medio / difícil).
- Botón **Caso sorpresa**: el sistema elige un caso al azar para ti.
- Enlaces a **Historial** (investigaciones pasadas) y **Estadísticas**.

[CAPTURA: botón "caso sorpresa" y lista de casos]

Para empezar, pulsa el botón **Investigar** del caso que quieras resolver.

---

## 3. El panel del detective

Al entrar a un caso se abre el **panel de investigación**. Tiene tres zonas:

- **Conversación** (centro): aquí hablas con el sistema y ves los resultados de
  tus acciones, escritos en español.
- **Expediente** (lateral derecho): fichas de **personas**, **lugares** y
  **evidencias** conforme las vas conociendo.
- **Barra superior**: título del caso, dificultad, estado, **puntuación** y
  **cronómetro**.

[CAPTURA: panel de investigación con las tres zonas señaladas]

> **Dato clave:** Empezarás conociendo solo a las **personas** y **lugares**.
> Las declaraciones, evidencias y los eventos que ocurrieron deberás
> **descubrirlos** interrogando e inspeccionando. Nada relevante se te entrega
> de golpe.

### Estados de una sesión

| Estado | Significado |
|---|---|
| **En curso** | Sigues investigando; las acciones están habilitadas. |
| **Resuelto** | Emitiste la acusación y acertaste al responsable. |
| **Fallido** | Acusaste a alguien que no era el responsable. |

---

## 4. Las acciones del detective (16)

Selecciona una acción en el **componedor de acciones** (parte inferior de la
conversación). Cada acción consume puntos (−5 pts) y queda registrada en la
bitácora.

### 4.1 Interrogar a una persona

1. En "Interrogatorios" elige a una **persona** del expediente.
2. El sistema te mostrará su **declaración** y su **coartada** (dónde decía
   estar en el momento del suceso).

[CAPTURA: interrogatorio de una persona mostrando declaración y coartada]

### 4.2 Investigar un lugar

1. En "Lugares" elige un **lugar**.
2. El sistema te cuenta qué **eventos** ocurrieron ahí y puede revelar
   **evidencias** que estaban escondidas.

[CAPTURA: inspección de un lugar con evento y evidencia nueva]

### 4.3 Examinar una evidencia

1. En "Evidencias" elige una **evidencia** (se activa al investigar lugares).
2. El sistema te explica qué es y su relevancia.

### 4.4 Analizar

| Acción | Qué te dice |
|---|---|
| **Analizar motivos** | Quién tenía motivo (declarado o derivado) contra la víctima. |
| **Analizar oportunidades** | Quién estuvo cerca del lugar y la hora del suceso. |
| **Consultar relaciones** | Grafo de relaciones sospechosos ↔ evidencias, y relaciones entre personas. |
| **Consultar explicación** | Cadena deductiva de las 16 reglas del motor explicada en español. |

### 4.5 Pedir una pista

Tienes **hasta 5 pistas** por sesión. Se dan en orden de menor a mayor claridad:
la primera es vaga y la última apunta casi al responsable. Úsalas con
moderación: cada una cuesta puntos y tiempo.

### 4.6 Emitir acusación

Cuando creas tener al culpable:

1. Pulsa **Acusar**.
2. En el cuadro de diálogo, elige al sospechoso.
3. Confirma. La sesión se cierra: **acertaste** (resuelto) o **fallaste**
   (fallido). No podrás seguir investigando después de acusar.

---

## 5. Consejos de estrategia

1. **Interroga primero a todas las personas.** Las coartadas te dicen dónde
   decía estar cada quien; comparar coartadas destapa contradicciones.
2. **Inspecciona todos los lugares.** Ahí aparecen las evidencias y los eventos.
3. **Examina las evidencias.** La evidencia física **gana** sobre los
   testimonios: si contradice una coartada, la coartada es falsa.
4. **Usa "Analizar motivos" y "Analizar oportunidades"** para acotar.
5. **El responsable suele reunir**: acceso, oportunidad, motivo y medios… o
   miente torpemente en su coartada.
6. Guarda las pistas para cuando estés frente a dos sospechosos y no puedas
   decidir.

---

## 6. El informe final

Al cerrarse la sesión aparece el botón **Ver informe**. El informe contiene:

- Datos del caso y duración de la investigación.
- Tu acusación y el **veredicto** (correcto / incorrecto).
- Tu **puntuación**, pistas usadas y acciones realizadas.
- La **explicación deductiva** que justifica (o no) tu acusación.

Puedes imprimirlo o guardarlo como PDF desde el navegador.

[CAPTURA: informe final imprimible]

---

## 7. Historial y estadísticas

- **Historial:** todas tus investigaciones, con filtros por estado, caso y
  dificultad, y métricas (tiempo, puntuación, pistas usadas).
- **Estadísticas:** resumen de tu desempeño por caso y por dificultad.

---

## 8. Modo multicaso (campaña)

Si activas el **modo campaña**, el sistema te encadena los casos en orden
creciente de dificultad. Cada caso lo elige el motor según tu desempeño en el
anterior. En cada sesión podrás ver tu avance dentro de la campaña.

---

## 9. Módulo administrativo (para el administrador)

El módulo administrativo gestiona los casos del sistema.

1. Entra a `http://<servidor>/admin`.
2. Inicia sesión con **usuario y contraseña de administrador** (te los da quien
   despliega el sistema).
3. Una vez dentro puedes:

   - **Ver los casos** con sus conteos (sospechosos, evidencias, lugares,
     declaraciones, reglas) y verificar que cumplen los mínimos.
   - **Crear** un caso nuevo desde una plantilla con la estructura ya comentada.
   - **Editar** el código del caso y guardarlo: el sistema **valida la
     sintaxis** antes de aceptar los cambios.
   - **Generar casos desde JSON o CSV** (con previsualización de lo que se va a
     crear).
   - **Exportar** los archivos de un caso.
   - **Eliminar** un caso (se conserva un respaldo automático).
   - **Supervisar** el historial de sesiones de todos los usuarios.

[CAPTURA: panel de administración con la lista de casos]

> **Advertencia de seguridad:** el panel edita código que el servidor ejecuta.
> No compartas las credenciales y **cambia las de fábrica** antes de publicar la
> aplicación (ver sección 10).

---

## 10. Problemas frecuentes y su solución

| Problema | Causa probable | Solución |
|---|---|---|
| No carga la página al entrar a `localhost:8000` | La aplicación no está levantada | Ejecuta `docker compose up --build` en la carpeta del proyecto |
| Veo la API pero no la interfaz | El frontend no está compilado | `cd frontend && pnpm install && pnpm build` |
| El "Caso sorpresa" pide recargar | — | Simplemente recarga la página para ver el caso asignado |
| No puedo interrogar/examinar | La sesión ya se cerró (resuelto/fallido) | Revisa el estado en la barra superior; si está cerrada, inicia otra sesión |
| No aparecen evidencias en el componedor | Aún no has inspeccionado los lugares | Investiga lugares para ir revelando evidencias |
| El panel admin rechaza mis cambios con error de sintaxis | El código Prolog tiene un error | Corrige el error señalado; el sistema guarda el archivo anterior intacto |
| No recuerdo la contraseña del admin | — | Pídesela a quien desplegó el sistema (`LD_ADMIN_USER` / `LD_ADMIN_PASS`) |
| El sistema se ve lento al responder | Estado de respaldo (`subprocess`) | Es normal: la app funciona igual, solo tarda más; en Docker se usa el modo embebido, más rápido |
| Quiero empezar de cero el historial | — | Con los datos en el volumen: `docker compose down -v` (borra todo) |

---

## 11. Preguntas frecuentes

**¿Puedo volver atrás después de acusar?**
No. Al acusar la sesión se cierra y no se puede reabrir. Revisa bien antes de
confirmar.

**¿Puedo jugar el mismo caso varias veces?**
Sí. Cada partida es una **sesión** independiente con su propio progreso y
puntuación.

**¿La puntuación importa?**
Empiezas en 100 pts. Cada acción resta 5; cada pista también. La puntuación es tu
métrica de eficiencia, no un bloqueo del juego.

**¿Qué pasa si gasto las 5 pistas?**
Nada malo; solo dejas de tener pistas disponibles en esa sesión. Puedes seguir
investigando con las demás acciones.

**¿Quién gana el juego?**
Resolver un caso con **veredicto correcto**, la mayor puntuación posible y la
menor cantidad de acciones/pistas. El informe final te resumen todo.