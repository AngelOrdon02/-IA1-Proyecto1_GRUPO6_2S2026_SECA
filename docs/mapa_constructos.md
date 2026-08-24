# Mapa de constructos de Prolog

El enunciado exige **uso comprobable** de diez constructos. Esta tabla dice
exactamente dónde vive cada uno, para que no dependa de que el evaluador lo
encuentre por su cuenta.

> Verificación rápida de que todo carga y responde:
> ```bash
> swipl prolog/logic_detective.pl
> ?- responsable(caso1, Quien).
> ```

---

## 1. Hechos

Toda la base de conocimiento de los tres casos. El primer argumento es siempre
el identificador del caso, lo que permite tener las tres KB cargadas a la vez.

| Archivo | Ejemplo |
|---|---|
| `prolog/casos/caso1_louvre.pl` | `persona(caso1, peruggia, 'Vincenzo Peruggia', sospechoso).` |
| `prolog/casos/caso1_louvre.pl` | `evidencia(caso1, e01, huella_digital, '...', salon_carre, 730).` |
| `prolog/casos/caso2_whitechapel.pl` | Los hechos del caso del Destripador |
| `prolog/casos/caso3_rasputin.pl` | Los hechos de la conspiración del Moika |

El esquema completo, con la aridad y el significado de cada argumento, está
documentado en `prolog/core/esquema.pl`.

## 2. Reglas

| Ubicación | Qué contiene |
|---|---|
| `prolog/core/motor.pl` | Reglas genéricas: acceso, oportunidad, motivo, medios, coartadas, relaciones |
| `prolog/core/contradicciones.pl` | Detección de contradicciones e información falsa |
| `prolog/core/sospecha.pl` | Nivel de sospecha, cómplices, responsable |
| `prolog/casos/*.pl` | **10 reglas propias por caso**, declaradas con `regla_caso/4` |

## 3. Consultas

| Ubicación | Qué hace |
|---|---|
| `prolog/core/api_json.pl:47` | `soluciones/3` ejecuta metas construidas dinámicamente con `read_term_from_atom/3` |
| `prolog/logic_detective.pl:34` | `casos_disponibles/1`, `ficha_caso/2`, `analisis_sospechoso/3`, `verificar_acusacion/3` |
| `docs/consultas_ejemplo.md` | Consultas manuales con su salida esperada |

## 4. Variables

Presentes en toda regla. Ejemplo con recorrido de variables no ligadas:

```prolog
% prolog/core/motor.pl
tiene_acceso(Caso, Persona) :-
    sospechoso(Caso, Persona),
    incidente(Caso, _, LugarIncidente, _),
    acceso(Caso, Persona, LugarConAcceso, _),
    alcanzable_por(Caso, Persona, LugarConAcceso, LugarIncidente, [LugarConAcceso]).
```

## 5. Predicados

67 predicados definidos en `prolog/core/`. Los dieciséis que exige el enunciado
están catalogados en `prolog/core/explicacion.pl:20-60` (`catalogo_regla/3`),
cada uno con identificador estable y descripción legible.

## 6. Listas (Obligatorio)

| Ubicación | Uso |
|---|---|
| `prolog/core/utils.pl` | **Archivo dedicado**: `pertenece/2`, `longitud/2`, `suma_lista/3`, `sin_duplicados/2`, `claves_de/2`, `valores_de/2`, `primera_ocurrencia/2`, `maximo_por_valor/3`, `ordenar_desc/2` |
| `prolog/core/motor.pl:150` | `posee_todos/3` recorre la lista de medios requeridos |
| `prolog/core/sospecha.pl:71` | `factores_de/3` construye la lista de pares `factor-peso` con `findall/3` |
| `prolog/core/contradicciones.pl:150` | `filtrar_decl_decl/3` filtra la lista de contradicciones por lo descubierto |
| `prolog/core/motor.pl:47` | La lista `Visitados` evita ciclos en el grafo de lugares |

Los predicados de lista se implementan a mano en vez de usar los *builtins* de
SWI precisamente para que el uso sea comprobable.

## 7. Recursividad (Obligatorio)

| Predicado | Archivo:línea | Qué recorre |
|---|---|---|
| `alcanzable/4` | `motor.pl:47` | Grafo de lugares (conectividad física) |
| `alcanzable_por/5` | `motor.pl:62` | Grafo de lugares restringido a los accesos de una persona |
| `camino_relacional/5` | `motor.pl:~215` | Cadena de relaciones entre personas |
| `expandir_red/4` | `sospecha.pl:~160` | Red de complicidad, en anchura |
| `suma_lista/3` | `utils.pl:44` | Suma con acumulador |
| `longitud/2` | `utils.pl:36` | Conteo con construcción en el retorno |
| `sin_duplicados/2` | `utils.pl:56` | Filtrado con negación |
| `primera_ocurrencia/2` | `utils.pl:80` | Deduplicación por clave |
| `maximo_por_valor/5` | `utils.pl:~100` | Máximo con acumulador |
| `posee_todos/3` | `motor.pl:150` | Verificación de todos los medios |
| `filtrar_decl_decl/3` | `contradicciones.pl:150` | Filtrado de contradicciones visibles |
| `primeros/3` | `api_json.pl:78` | Límite de soluciones con contador decreciente |

**Punto para la defensa:** todas las recursiones sobre grafos llevan una lista
de visitados. Sin ella, `alcanzable/4` entraría en bucle infinito, porque el
grafo de lugares de los tres casos tiene ciclos. Lo comprueba
`tests/test_motor_prolog.py::test_26`.

## 8. Unificación

| Ubicación | Uso |
|---|---|
| `contradicciones.pl:24` | Dos declaraciones unifican sobre `estuvo(Persona, Lugar, Hora)` para detectar el choque |
| `explicacion.pl:~110` | `es_el_concluido(responsable(Persona, _), Persona)` unifica dentro del término |
| `api_json.pl:47` | `read_term_from_atom/3` con `variable_names` recupera los nombres originales de las variables |
| `sospecha.pl:~180` | `maximo_por_valor(Pares, Persona, PuntajeMaximo)` unifica el par ganador |

## 9. Negación (Obligatorio)

Negación por fallo (`\+`): tiene éxito cuando Prolog **no logra demostrar** la
meta. No afirma que sea falsa en el mundo, solo que no se deduce de la KB.

| Archivo:línea | Qué expresa |
|---|---|
| `utils.pl:28` | `no_pertenece/2`, la negación básica sobre listas |
| `sospecha.pl:41` | No poder demostrar coartada válida **es** un factor de sospecha |
| `sospecha.pl:193` | `\+ hay_empate(...)`: sin unicidad no se declara responsable |
| `sospecha.pl:226-236` | Descarte de inocentes por ausencia de oportunidad, medios o motivo |
| `motor.pl:~170` | `testigo_confiable/2`: el testigo no debe ser sospechoso ni mentiroso |
| `motor.pl:52` | `no_pertenece(Intermedio, Visitados)` corta los ciclos del grafo |

## 10. Cortes (!) (Obligatorio)

| Archivo:línea | Tipo | Qué corta y por qué |
|---|---|---|
| `motor.pl:47` | verde | `alcanzable/4` caso base: deja de explorar al llegar al destino |
| `motor.pl:62` | verde | Ídem para `alcanzable_por/5` |
| `motor.pl:74` | verde | `tiene_acceso/2`: basta una vía de acceso, no interesan todas |
| `motor.pl:170` | verde | `coartada_valida/2`: no se reporta la misma coartada por cada testigo |
| `sospecha.pl:86-92` | **rojo, intencionado** | `categoria_sospecha/3`: sin el corte, 90 puntos satisfarían también «alto», «medio» y «bajo» |
| `sospecha.pl:187` | verde | `principal_sospechoso/2`: hay uno solo, no una solución por camino de prueba |
| `sospecha.pl:195` | verde | `responsable/2`: la conclusión es única |
| `sospecha.pl:201-211` | verde | `conclusion/2`: primera cláusula aplicable, en cascada |
| `utils.pl:60` | verde | `sin_duplicados/2`: evita también la solución «conservando el duplicado» |
| `api_json.pl:69-79` | verde | `valor_texto/2` y `primeros/3`: cada término toma una sola rama |
| `contradicciones.pl:106` | verde | `mintio/2` es semi-determinista: interesa *si* mintió, no cuántas veces |

### Lección aprendida: el corte rojo accidental

Las reglas propias de cada caso (`patron_robo_interno/2`,
`capaz_del_crimen/2`, `capacidad_de_ejecucion/2`) **tenían un corte al final**
y eso las rompía. Con la persona sin ligar, el corte se comprometía con el
primer candidato generado y descartaba a los demás, aunque ese primero no
cumpliera el resto de condiciones. En el caso 3 hacía que
`sospechoso_prioritario_moika/2` no encontrara a nadie: se comprometía con
el primer sospechoso generado y ya no probaba con el verdadero culpable.

La corrección fue poner el **generador primero** y las comprobaciones dentro de
`once/1`:

```prolog
% Antes (corte rojo: descarta candidatos no evaluados)
capacidad_extraccion(caso3, Persona) :-
    puede_abrir_sala(caso3, Persona),
    perfil_tecnico(caso3, Persona),
    !.

% Después (once/1 dedupe sin cortar el generador externo)
capacidad_extraccion(caso3, Persona) :-
    persona(caso3, Persona, _, _),
    once(puede_abrir_sala(caso3, Persona)),
    once(perfil_tecnico(caso3, Persona)).
```

Es el ejemplo más claro del proyecto de la diferencia entre corte verde y corte
rojo, y merece mencionarse en la defensa.
