# Generador de casos desde JSON y CSV

> Opcional 9 del enunciado: *«Motor para generar nuevos casos a partir de
> archivos JSON o CSV».*

El módulo administrativo puede crear un caso completo a partir de un archivo,
sin escribir Prolog a mano. Ambos formatos comparten el mismo camino:

```
CSV ──► csv_a_estructura() ──┐
                             ├──► generar_caso_desde_json() ──► .pl ──► validación ──► motor
JSON ────────────────────────┘
```

El CSV **no** duplica la lógica: se traduce a la misma estructura y delega. Así
hay una única validación sintáctica y una única comprobación de mínimos.

## Qué hace el generador

1. Valida el identificador y que el caso no exista ya.
2. Traduce cada entrada a hechos Prolog, escapando comillas y validando que los
   átomos y las horas tengan la forma correcta.
3. **Compila el archivo en un intérprete SWI-Prolog aparte.** Si tiene errores
   de sintaxis, se rechaza sin escribir nada: un caso malformado impediría
   cargar la base de conocimiento entera.
4. Escribe el `.pl` en `prolog/casos/`, lo registra en el cargador y recarga el
   motor.
5. Devuelve el conteo y si el caso **cumple los mínimos** (4 sospechosos,
   10 evidencias, 5 lugares, 5 declaraciones, 10 reglas).

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/admin/casos/generar` | Genera un caso desde JSON |
| `POST` | `/api/admin/casos/generar-csv` | Genera un caso desde CSV |
| `POST` | `/api/admin/casos/previsualizar-csv` | Traduce el CSV y devuelve el conteo **sin escribir nada** |

Todos exigen autenticación de administrador.

> Conviene previsualizar antes de generar: un CSV mal formado se detecta ahí, no
> después de haber escrito un `.pl` y tocado el cargador.

## Formato CSV

Un caso necesita muchas tablas distintas (personas, lugares, evidencias…). En
vez de exigir un archivo por tabla, se usa **un único CSV donde la primera
columna discrimina la clase de fila**.

- La cabecera `tipo,c1,c2,...` es opcional.
- Las líneas vacías y las que empiezan por `#` se ignoran.
- Los textos con comas deben ir entre comillas dobles.
- Las horas se escriben en formato `HHMM` sin dos puntos: `2100` = 21:00.

### Filas disponibles

| Fila | Columnas | Ejemplo |
|---|---|---|
| `caso` | id, título, descripción, dificultad | `caso,mi_caso,El robo,Descripción,facil` |
| `incidente` | descripción, lugar, hora | `incidente,Robo del sello,despacho,2100` |
| `ventana` | inicio, fin | `ventana,2030,2130` |
| `victima` | persona | `victima,victor` |
| `solucion` | persona | `solucion,ana` |
| `persona` | id, nombre, rol | `persona,ana,Ana Ruiz,sospechoso` |
| `lugar` | id, nombre, descripción | `lugar,despacho,Despacho,Oficina` |
| `conexion` | lugarA, lugarB | `conexion,entrada,pasillo` |
| `acceso` | persona, lugar, tipo | `acceso,ana,despacho,llave` |
| `estuvo` | persona, lugar, hora | `estuvo,ana,despacho,2100` |
| `evento` | id, hora, lugar, descripción | `evento,ev1,2100,despacho,Se apaga la luz` |
| `evidencia` | id, tipo, descripción, lugar, hora | `evidencia,e01,huella,Huella en el marco,despacho,2100` |
| `vincula` | evidencia, persona | `vincula,e01,ana` |
| `situa` | evidencia, persona, lugar | `situa,e01,ana,despacho` |
| `declaracion` | id, autor, texto | `declaracion,d1,ana,No estuve allí` |
| `afirma` | declaración, tipo, valores… | `afirma,d1,no_estuvo,ana,despacho,2100` |
| `coartada` | persona, lugar, hora, testigo | `coartada,ana,pasillo,2100,toni` |
| `motivo` | persona, tipo, descripción | `motivo,ana,financiero,Deudas vencidas` |
| `requiere` | medio | `requiere,llave_del_sello` |
| `medio` | persona, medio | `medio,ana,llave_del_sello` |
| `relacion` | personaA, personaB, tipo | `relacion,ana,victor,deuda` |
| `regla` | id, nombre, descripción | `regla,r01,Acceso interno,Quién pudo entrar` |

`vincula` y `situa` deben ir **después** de la fila `evidencia` que
referencian; `afirma`, después de su `declaracion`. Si no, el importador avisa
con el número de línea.

### Tipos de afirmación

| Tipo | Valores esperados |
|---|---|
| `estuvo` | persona, lugar, hora |
| `no_estuvo` | persona, lugar, hora |
| `vio` | observador, observado, lugar, hora |
| `poseia` | persona, objeto |
| `desconoce` | persona, objeto |

### Ejemplo mínimo

```csv
tipo,c1,c2,c3,c4,c5
caso,caso_demo,El expediente demo,"Un caso de ejemplo, con coma.",facil
incidente,Robo del sello notarial,despacho,2100
ventana,2030,2130
victima,victor
solucion,ana
persona,victor,Victor Prueba,victima
persona,ana,Ana Ruiz,sospechoso
persona,beto,Beto Lima,sospechoso
lugar,despacho,Despacho,Oficina del notario
lugar,pasillo,Pasillo,Corredor principal
conexion,pasillo,despacho
acceso,ana,despacho,llave_maestra
estuvo,ana,despacho,2100
evidencia,e01,huella,Huella en el marco,despacho,2100
vincula,e01,ana
situa,e01,ana,despacho
declaracion,d1,ana,No estuve en el despacho
afirma,d1,no_estuvo,ana,despacho,2100
motivo,ana,financiero,Debe dinero al notario
requiere,llave_del_sello
medio,ana,llave_del_sello
relacion,ana,victor,deuda
regla,r01,Acceso interno,Quien tenia llave del despacho
```

Este ejemplo es didáctico y **no** cumple los mínimos del enunciado (le faltan
sospechosos, evidencias, lugares, declaraciones y reglas). El generador lo crea
igualmente pero devuelve `cumple_minimos: false`, para poder construir un caso
por partes; `cumple_minimos/1` es la comprobación que se debe cumplir antes de
darlo por bueno.

## Formato JSON

La misma información, en objetos anidados. Las claves son:
`id`, `titulo`, `descripcion`, `dificultad`, `incidente`, `ventana`, `victima`,
`solucion`, `personas`, `lugares`, `conexiones`, `accesos`, `ubicaciones`,
`eventos`, `evidencias` (con `vincula` y `situa` dentro), `declaraciones` (con
`afirmaciones` dentro), `coartadas`, `motivos`, `medios_requeridos`, `medios`,
`relaciones` y `reglas`.

El ejemplo completo y funcional está en `tests/test_admin_generador.py`.

## Seguridad

El generador **no acepta Prolog arbitrario**: construye los hechos a partir de
campos validados uno a uno. Es deliberadamente más restrictivo que el editor de
`/admin`, donde sí se escribe Prolog directo y por tanto se puede ejecutar
código en el servidor (ver la sección 6.2 de `TODO.md`).
