# Casos de ejemplo en JSON y CSV

Archivos listos para cargar desde **Admin → Casos cargados → Generar desde
archivo**, con el botón «Cargar un ejemplo» de la pestaña correspondiente. El
servidor los traduce a hechos Prolog con el esquema de `prolog/core/esquema.pl`,
valida la sintaxis en un intérprete aparte, registra el caso en
`prolog/logic_detective.pl` y recarga el motor.

Cada caso está en los **dos formatos**, y son equivalentes: el `.pl` que genera
el CSV es idéntico byte a byte al que genera el JSON, porque el importador CSV
se traduce a la misma estructura y delega en el generador JSON.

| Caso | Archivos | Para qué sirve |
|---|---|---|
| El manuscrito de la biblioteca | `caso_biblioteca.json` · `caso_biblioteca.csv` | Caso completo y narrativo. Cumple los mínimos (4 sospechosos, 12 evidencias, 5 lugares, 6 declaraciones, 12 reglas) y el motor concluye `responsable(caso_biblioteca, duarte)` con puntajes 136 / 72 / 42 / 12. |
| El taller de la esquina | `caso_taller.json` · `caso_taller.csv` | Caso mínimo, el más corto que cumple el enunciado. Prueba de humo rápida; concluye `responsable(caso_taller, ayala)`. |
| Caso con errores a propósito | `caso_invalido.json` · `caso_invalido.csv` | Errores sembrados para comprobar que el panel muestra el mensaje del servidor. El JSON falla por la hora `2575`; el CSV, por un tipo de fila inexistente, e informa del número de línea. |

Desde la terminal:

```bash
# JSON
curl -u admin:$LD_ADMIN_PASS -H 'Content-Type: application/json' \
     -d @datos/ejemplos/caso_biblioteca.json \
     http://127.0.0.1:8000/api/admin/casos/generar

# CSV (el cuerpo es {"contenido": "<el csv>"}, así que se envuelve antes)
python3 -c 'import json,sys; print(json.dumps({"contenido": open(sys.argv[1]).read()}))' \
     datos/ejemplos/caso_biblioteca.csv \
  | curl -u admin:$LD_ADMIN_PASS -H 'Content-Type: application/json' -d @- \
     http://127.0.0.1:8000/api/admin/casos/generar-csv
```

Para dejar la base como estaba:

```bash
curl -u admin:$LD_ADMIN_PASS -H 'Content-Type: application/json' \
     -d '{"archivo":"caso_biblioteca.pl"}' \
     http://127.0.0.1:8000/api/admin/casos/eliminar
```

El formato CSV está documentado aparte, en `docs/generador_casos.md`.

## Esquema del JSON

Los identificadores (`id`, `lugar`, `persona`, `tipo`…) son **átomos Prolog**:
empiezan por minúscula y solo llevan letras, números y guion bajo. Las horas
son enteros `HHMM` (`2115` = 21:15). Los textos son libres.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | átomo | sí | 3 a 31 caracteres. Da nombre al archivo `.pl`. |
| `titulo`, `descripcion` | texto | sí | |
| `dificultad` | `facil` \| `medio` \| `dificil` | no (`medio`) | |
| `incidente` | `{descripcion, lugar, hora}` | sí | `lugar` debe existir en `lugares`. |
| `ventana` | `[inicio, fin]` HHMM | sí | Define la oportunidad. |
| `victima` | átomo | sí | Persona con rol `victima`. |
| `solucion` | átomo | no | Culpable esperado; solo lo usan las pruebas. |
| `personas[]` | `{id, nombre, rol}` | sí | `rol` ∈ `sospechoso` \| `testigo` \| `victima`. **Mínimo 4 sospechosos.** |
| `lugares[]` | `{id, nombre, descripcion}` | sí | **Mínimo 5.** |
| `conexiones[]` | `[lugarA, lugarB]` | sí | No dirigidas. |
| `accesos[]` | `{persona, lugar, tipo}` | sí | Sin acceso no hay `tiene_acceso/2`. |
| `ubicaciones[]` | `{persona, lugar, hora}` | sí | Genera `estuvo_en/4`; define la oportunidad. |
| `eventos[]` | `{id, hora, lugar, descripcion}` | no | Línea temporal. |
| `evidencias[]` | `{id, tipo, descripcion, lugar, hora, vincula[], situa{persona,lugar}}` | sí | **Mínimo 10.** `situa` genera `evidencia_lugar_persona/4`, que es lo que refuta coartadas y desmiente declaraciones. |
| `declaraciones[]` | `{id, autor, texto, afirmaciones[]}` | sí | **Mínimo 5.** |
| `coartadas[]` | `{persona, lugar, hora, testigo}` | no | Solo vale si el testigo no es sospechoso ni mintió. |
| `motivos[]` | `{persona, tipo, descripcion}` | no | |
| `medios_requeridos[]` | átomos | no | El sospechoso debe poseerlos **todos**. |
| `medios[]` | `{persona, medio}` | no | |
| `relaciones[]` | `{a, b, tipo}` | no | `rivalidad`, `deuda`, `despido`, `chantaje` y `herencia` cuentan como motivo derivado. |
| `reglas[]` | `{id, nombre, descripcion}` | sí | **Mínimo 10.** |

### Tipos de afirmación

| `tipo` | Campos | Hecho generado |
|---|---|---|
| `estuvo` | `persona`, `lugar`, `hora` | `afirma(Caso, Decl, estuvo(P, L, H))` |
| `no_estuvo` | `persona`, `lugar`, `hora` | `afirma(Caso, Decl, no_estuvo(P, L, H))` |
| `vio` | `observador`, `observado`, `lugar`, `hora` | `afirma(Caso, Decl, vio(O, Q, L, H))` |
| `poseia` | `persona`, `objeto` | `afirma(Caso, Decl, poseia(P, O))` |
| `desconoce` | `persona`, `objeto` | `afirma(Caso, Decl, desconoce(P, O))` |

### Para que el motor concluya un responsable

`responsable/2` exige que una sola persona tenga el puntaje máximo (sin empate)
y que se sostengan a la vez: oportunidad, medios, motivo (propio o derivado de
una relación conflictiva) y ausencia de coartada válida. Las palancas para
diseñarlo son:

- **Acceso**: solo llega al lugar del incidente quien tiene `accesos` a una
  cadena de lugares conectados hasta él.
- **Oportunidad**: hay que estar en el lugar del incidente *o en uno adyacente*
  dentro de `ventana`.
- **Coartada rota**: dársela con un testigo que sea sospechoso, o situar a la
  persona en otro lugar con `situa` a menos de 30 minutos de la coartada.
- **Mentira**: negar con `no_estuvo` un lugar donde una evidencia `situa` a la
  persona, o `desconoce` un objeto cuyo `tipo` de evidencia la vincula.
