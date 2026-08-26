# Casos de ejemplo en JSON

Archivos listos para pegar en **Admin → Casos cargados → Generar desde JSON**
(o para enviar a `POST /api/admin/casos/generar`). El servidor los traduce a
hechos Prolog con el esquema de `prolog/core/esquema.pl`, valida la sintaxis en
un intérprete aparte, registra el caso en `prolog/logic_detective.pl` y recarga
el motor.

| Archivo | Para qué sirve |
|---|---|
| `caso_biblioteca.json` | Caso completo y narrativo. Cumple los mínimos (4 sospechosos, 12 evidencias, 5 lugares, 6 declaraciones, 12 reglas) y el motor concluye `responsable(caso_biblioteca, duarte)` con puntajes 136 / 72 / 42 / 12. |
| `caso_taller.json` | Caso mínimo, el más corto que cumple el enunciado. Sirve como prueba de humo rápida; concluye `responsable(caso_taller, ayala)`. |
| `caso_invalido.json` | Contiene tres errores a propósito (hora `2575`, identificador `Ayala` en mayúscula, tipo de afirmación `sospecho`). Sirve para comprobar que el panel muestra el mensaje de error del servidor. |

Desde la terminal:

```bash
curl -u admin:$LD_ADMIN_PASS -H 'Content-Type: application/json' \
     -d @datos/ejemplos/caso_biblioteca.json \
     http://127.0.0.1:8000/api/admin/casos/generar
```

Para dejar la base como estaba:

```bash
curl -u admin:$LD_ADMIN_PASS -H 'Content-Type: application/json' \
     -d '{"archivo":"caso_biblioteca.pl"}' \
     http://127.0.0.1:8000/api/admin/casos/eliminar
```

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
