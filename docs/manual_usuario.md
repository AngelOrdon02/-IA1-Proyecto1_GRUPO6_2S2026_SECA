# Manual de usuario

> **Pendiente (WS4 + WS5):** sustituir los marcadores `[CAPTURA: ...]` por
> capturas reales. El enunciado exige capturas de pantalla en este documento.

## 1. Acceso

Abrir <http://localhost:8000> (o la IP pública de la VM si está desplegado).

`[CAPTURA: pantalla de inicio con los tres casos]`

La pantalla principal muestra el nombre y propósito del sistema, los tres casos
disponibles con su dificultad y estado (*Sin iniciar*, *En curso*, *Resuelto*),
el historial de investigaciones recientes y el acceso al módulo administrativo.

## 2. Iniciar una investigación

Pulsar **Iniciar investigación** en el caso elegido. Se abre el panel del
detective con el menú de catorce secciones a la izquierda.

`[CAPTURA: panel de investigación, sección Resumen]`

Al empezar solo se conocen las personas y los lugares. **Ninguna evidencia ni
declaración está disponible todavía**: hay que descubrirlas.

## 3. Las acciones del detective

### Interrogar
**Interrogatorios** → botón con el nombre de la persona. Revela su declaración y
su coartada. Los ya interrogados quedan marcados con ✓.

`[CAPTURA: sección Interrogatorios con una declaración visible]`

### Investigar lugares
**Lugares** → *Inspeccionar*. Revela las evidencias halladas ahí y los eventos
ocurridos en ese sitio, que alimentan la línea temporal.

`[CAPTURA: sección Lugares]`

### Examinar evidencias
**Evidencias** → *Examinar*. Muestra el detalle y a qué personas vincula. Solo
aparecen las evidencias ya halladas.

`[CAPTURA: sección Evidencias con el resultado de un examen]`

### Analizar
- **Relaciones** — vínculos entre las personas implicadas.
- **Motivos y oportunidades** — tabla de los cuatro pilares por sospechoso
  (acceso, oportunidad, motivo, medios) más los motivos conocidos. Los motivos
  solo aparecen tras interrogar a esa persona.
- **Coartadas** — cada coartada con su veredicto y el razonamiento que lo
  sostiene.
- **Línea temporal** — eventos descubiertos en orden cronológico.

`[CAPTURA: tabla de los cuatro pilares]`

### Deducciones del sistema
- **Contradicciones** — choques entre testimonios, o entre un testimonio y una
  evidencia. **Solo se analizan los elementos ya descubiertos**, así que
  conviene volver aquí tras cada hallazgo.
- **Nivel de sospecha** — puntaje y categoría de cada sospechoso, con barra
  comparativa.
- **Solicitar pista** (arriba a la derecha) — hasta 5 pistas por partida, en
  orden creciente de revelación.

`[CAPTURA: sección Contradicciones]`
`[CAPTURA: sección Nivel de sospecha]`

### Bitácora
Registro completo de cada acción realizada, con su marca de tiempo.

`[CAPTURA: bitácora]`

## 4. Emitir la acusación

**Acusación final** → botón del sospechoso.

> La acusación **cierra la investigación y no se puede deshacer**.

El sistema compara la acusación con el responsable que deduce el motor y lleva
al informe final.

`[CAPTURA: pantalla de acusación]`

## 5. El informe final

`[CAPTURA: informe con veredicto correcto]`

Incluye el veredicto, el ranking completo de sospecha, la **cadena deductiva**
—cada regla activada con lo que establece y el dato que la disparó—, el estado
de todas las coartadas, las contradicciones del caso, los posibles cómplices,
por qué se descarta a cada inocente y la bitácora completa.

También se puede consultar en JSON con *Ver informe en JSON*.

## 6. Estrategia recomendada

1. Leer el **Resumen**: lugar y hora del incidente acotan la ventana temporal.
2. **Interrogar a todos**, sospechosos y testigos. Sin declaraciones no hay
   contradicciones posibles.
3. **Inspeccionar todos los lugares**, empezando por el del incidente.
4. Revisar **Contradicciones**: la evidencia física siempre gana al testimonio.
5. Contrastar **Coartadas** con **Motivos y oportunidades**.
6. Acusar solo cuando un sospechoso reúna los cuatro pilares y su coartada no
   se sostenga.

**El error más común** es acusar a quien tiene más evidencias en contra. La
evidencia se puede plantar o malinterpretar; la combinación de los cuatro
pilares, no.

## 7. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| «Todavía no has encontrado esa evidencia» | Inspeccionar antes el lugar donde está |
| Contradicciones vacío | Faltan declaraciones: interrogar a más personas |
| Motivos vacío | Los motivos exigen haber interrogado a esa persona |
| Línea temporal vacía | Los eventos se descubren inspeccionando lugares |
| «No quedan pistas disponibles» | Se agotaron las 5 pistas de la partida |
| El servidor no arranca | Comprobar que SWI-Prolog está instalado: `swipl --version` |
| `/salud` responde `backend=subprocess` | PySwip no cargó `libswipl.so`; el sistema funciona igual, más lento. Revisar `SWI_HOME_DIR` |
