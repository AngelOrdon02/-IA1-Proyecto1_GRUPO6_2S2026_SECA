# Los tres casos de investigación

Solución esperada de cada caso, para validar el motor.

Todos tienen: 4 sospechosos, 10 evidencias,
5 lugares, 5 declaraciones y 10 reglas propias. Verificable con:

```bash
swipl -q -g "consult('prolog/logic_detective.pl')" \
      -g "forall(caso(C,_,_,_), (conteo_caso(C,X), format('~w ~w~n',[C,X])))" -t halt
```

---

## Caso 1 - "El Códice de Jade"

Robo en el Museo Nacional durante la gala anual, 21:00-21:45.

**Responsable: Marco Duarte**, jefe de seguridad. Puntaje 136.

| Sospechoso | Puntaje | Se descarta por |
|---|---:|---|
| **Marco Duarte** | **136** | - culpable |
| Tomás Iriarte | 77 | No tuvo oportunidad ya que estaba en el jardín, el cual no es adyacente a la sala |
| Elena Ruiz | 66 | Coartada válida respaldada por Rosa, testigo fiable |
| Nadia Ponce | 45 | Sin motivo y sin ninguno de los dos medios |

**Cadena deductiva.** Marco es el único que reúne los cuatro pilares: credencial
maestra, cámara que lo sitúa en el vestíbulo a las 21:20 la cual le da la oportunidad,
expediente de despido abierto por la víctima que le sirve de motivo y ambos medios requeridos,
el código de alarma y la llave de vitrina. Su coartada la sostiene Julio Caña, cuyo
testimonio queda desmentido por la evidencia física.

**Cómplice: Julio Caña**, conserje. Declara que Marco no se movió de la oficina
de seguridad; las evidencias `e01` y `e02` lo desmienten.

**Pista falsa.** La nota manuscrita del préstamo `e06` y las fibras de bata
`e04` apuntan a Elena, pero su coartada se sostiene.

---

## Caso 2 - "La dosis fatal"

Sustitución del contenido de una ampolla en el Hospital San Lucas, 03:00-03:45.

**Responsable: Sofía Aguirre**, química de farmacia. Puntaje 136.

| Sospechoso | Puntaje | Se descarta por |
|---|---:|---|
| **Sofía Aguirre** | **136** | - culpable |
| Dra. Carla Ríos | 87 | Coartada válida respaldada por Dora Quintana, pese a tener medios y motivo |
| Hugo Bravo | 62 | Sin acceso a la sala de medicación y sin oportunidad |
| Pablo Mena | 52 | Sin acceso a controlados y sin motivo |

*Dos* sospechosas cuentan con todos
los medios necesarios: Sofía y la Dra. Ríos. El criterio de los medios ya no
basta, hay que llegar hasta la coartada refutada por la evidencia. Sofía dice
haber estado en el vestuario a las 03:15, pero el log del armario de controlados
`f02` la sitúa en la farmacia a esa misma hora.

**Cómplice: Iván Sandoval**, recepcionista y pareja de Sofía. Sostiene su
coartada con un testimonio que la evidencia desmiente.

---

## Caso 3 - "El código fuente robado"

Extracción del repositorio del prototipo de TecnoNova, 22:30-23:15.

**Responsable: Vera Solís**, directora financiera. Puntaje 136.

| Sospechoso | Puntaje | Se descarta por |
|---|---:|---|
| **Vera Solís** | **136** | - culpable |
| Darío Peña | 87 | Coartada válida respaldada por Omar Beltrán, pese a medios y motivo |
| Kenji Mora | 47 | Sin acceso a la sala de servidores, sin todos los medios, sin motivo |
| Lucía Ferrer | 37 | Sin oportunidad al estar en recepción y sin motivo |

La evidencia más llamativa apunta al sospechoso
equivocado: el registro de VPN `k02` lleva las credenciales de Kenji Mora,
pero fueron usadas por otra persona. La regla propia `credenciales_usurpadas/2`
lo detecta: sus credenciales aparecen en el registro, pero ninguna evidencia
física lo sitúa en la sala.

Además, el perfil técnicamente más capaz, Darío Peña, ingeniero de
infraestructura, tiene una coartada que **sí** se sostiene. La culpable resulta
ser la menos técnica de todos, que llegó a las credenciales de administrador por
otra vía.

**Cómplice: Pía Corvalán**, secretaria de dirección.

---

## Cómo añadir un caso nuevo

1. Módulo administrativo -> "Crear un caso nuevo". Genera un `.pl` con la
   estructura completa comentada.
2. Rellenar siguiendo el esquema de `prolog/core/esquema.pl`.
3. Registrarlo en `prolog/logic_detective.pl` con `ensure_loaded`.
4. Verificar los mínimos: `?- cumple_minimos(mi_caso).`
5. Verificar que la deducción coincide con lo previsto:
   declarar `solucion(mi_caso, culpable).` y comprobar
   `?- responsable(mi_caso, Quien).`

El paso 5 no es opcional: la CI compara `responsable/2` contra `solucion/2` en
todos los casos y falla si difieren.
