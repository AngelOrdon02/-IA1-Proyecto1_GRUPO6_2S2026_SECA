# Los tres casos de investigación

Solución esperada de cada caso, para validar el motor. **Contiene espóileres.**

Los tres están inspirados en crímenes reales célebres: el robo de la Gioconda
(París, 1911), el otoño de Jack el Destripador (Londres, 1888) y el asesinato
de Rasputín (San Petersburgo, 1916). Los hechos históricos se adaptan a la
mecánica del juego, pero los guiños son reales: la huella en el cristal de la
vitrina, el grito de «¡Asesinato!» que oyó Sarah Lewis, el gramófono del
Palacio Moika sonando toda la noche.

Todos cumplen los mínimos del enunciado: 4 sospechosos, 10 evidencias,
5 lugares, 5 declaraciones y 10 reglas propias. Verificable con:

```bash
swipl -q -g "consult('prolog/logic_detective.pl')" \
      -g "forall(caso(C,_,_,_), (conteo_caso(C,X), format('~w ~w~n',[C,X])))" -t halt
```

---

## Caso 1 — «La Sonrisa Robada» (fácil)

El robo de la Gioconda. Museo del Louvre, lunes 21 de agosto de 1911,
07:00–07:45, con el museo cerrado al público.

**Responsable: Vincenzo Peruggia**, el vidriero que instaló el cristal
protector del cuadro. Puntaje 136. (Es el ladrón histórico: se escondió en el
museo, salió con la tabla bajo la bata y firmaba «Leonardo».)

| Sospechoso | Puntaje | Se descarta por |
|---|---:|---|
| **Vincenzo Peruggia** | **136** | — culpable |
| Marqués de Valfierno | 77 | Sin acceso a las salas ni oportunidad (paseaba por la Cour Carrée) |
| Géry Piéret | 66 | Coartada válida respaldada por Louis Béroud, testigo fiable |
| Maximilien Paupardin | 45 | Sin motivo y sin ninguno de los dos medios |

**Cadena deductiva.** Peruggia es el único que reúne los cuatro pilares: la
bata de la contrata le abre todas las puertas (acceso), el plomero Sauvet lo
vio cruzar la Gran Galería con un bulto a las 07:20 (oportunidad), el museo lo
despidió y jura que la Gioconda debe volver a Italia (motivo), y domina los dos
medios requeridos —el montaje de la vitrina y la bata blanca que vuelve
invisible a un obrero en día de cierre—. Su coartada la sostiene Lancelotti,
cuyo testimonio queda desmentido por la evidencia física (`e01`, `e02`).

**Cómplice: Vincenzo Lancelotti**, su ayudante. Declara que Peruggia no salió
del cuarto de vidrieros; la huella del pulgar y el testimonio del plomero lo
desmienten.

**Pista falsa.** El recorte de Paris-Journal (`e06`) y la hebra de pana (`e04`)
apuntan a Piéret —que efectivamente robó las estatuillas ibéricas, como en la
historia real—, pero su coartada para la Gioconda se sostiene.

**Diseño didáctico:** cada inocente cae por un pilar distinto, para que el
jugador aprenda a usar los cuatro.

---

## Caso 2 — «Sombras de Whitechapel» (medio)

El asesinato de Mary Jane Kelly en el cuarto 13 de Miller's Court. Londres,
madrugada del 9 de noviembre de 1888, 03:30–04:15. Los cuatro sospechosos son
sospechosos históricos del caso del Destripador.

**Responsable: Aaron Kosminski**, el barbero de Sion Square. Puntaje 136.
(Es el sospechoso al que apunta el análisis moderno del chal de Catherine
Eddowes.)

| Sospechoso | Puntaje | Se descarta por |
|---|---:|---|
| **Aaron Kosminski** | **136** | — culpable |
| George Chapman | 87 | Coartada válida (Sarah Lewis), pese a tener medios y motivo |
| Francis Tumblety | 62 | Forastero sin acceso a Miller's Court y sin oportunidad |
| Montague Druitt | 52 | Sin la navaja de precisión y sin motivo |

**Qué lo hace más difícil que el caso 1.** *Dos* sospechosos cuentan con todos
los medios: Kosminski y Chapman manejan navaja y anatomía (Chapman fue
aprendiz de cirujano-barbero). El criterio de los medios ya no basta, hay que
llegar hasta la coartada refutada: Kosminski dice haber pasado la madrugada en
Goulston Street, pero el sereno lo vio salir de la barbería a las 03:45
(`f02`).

**Cómplice: George Hutchinson**, su amigo. Sostiene la coartada con un
testimonio lleno de detalles imposibles —como el Hutchinson real ante
Scotland Yard— que la evidencia desmiente.

**Pista falsa.** El expediente del vitriolo (`f08`) señala a Chapman y el
registro de la taberna (`f05`) a Tumblety, pero uno tiene coartada válida y el
otro ni siquiera pudo entrar al pasaje.

---

## Caso 3 — «La Última Noche de Rasputín» (difícil)

Envenenamiento y disparo contra Grigori Rasputín en el comedor del sótano del
Palacio Moika. San Petersburgo, 30 de diciembre de 1916, 01:00–01:45.

**Responsable: el príncipe Félix Yusúpov**, el anfitrión. Puntaje 136.
(Es el organizador confeso del complot histórico.)

| Sospechoso | Puntaje | Se descarta por |
|---|---:|---|
| **Félix Yusúpov** | **136** | — culpable |
| Vladimir Purishkévich | 87 | Coartada válida (el gendarme Vlasyuk), pese a medios y motivo |
| Gran Duque Dmitri | 47 | Sin acceso al sótano y sin motivo (su revólver es un señuelo) |
| Dr. Lazovert | 37 | Sin oportunidad (nunca pasó del vestíbulo) y sin motivo |

**Qué lo hace el más difícil.** La evidencia más llamativa apunta al
sospechoso equivocado: el revólver de la escena lleva las iniciales del gran
duque Dmitri (`k02`), pero él nunca bajó del gran salón, donde hacía sonar el
gramófono. La regla propia `arma_como_senuelo/2` lo detecta: su arma aparece
en el sótano, pero ninguna evidencia física lo sitúa allí.

Además, el perfil más agresivo —Purishkévich, que juró en la Duma acabar con
«el diablo sagrado» y cuya cartuchera aparece con dos casquillos percutidos—
tiene una coartada que **sí** se sostiene. El culpable resulta ser el anfitrión
que jura no distinguir un revólver de un candelabro.

**Cómplice: Grigori Buzhinsky**, el lacayo. Jura que el príncipe no salió del
estudio; la copa con sus huellas y las pisadas en la nieve lo desmienten.

---

## Cómo añadir un caso nuevo

1. Módulo administrativo → «Crear un caso nuevo». Genera un `.pl` con la
   estructura completa comentada.
2. Rellenar siguiendo el esquema de `prolog/core/esquema.pl`.
3. Registrarlo en `prolog/logic_detective.pl` con `ensure_loaded`.
4. Verificar los mínimos: `?- cumple_minimos(mi_caso).`
5. Verificar que la deducción coincide con lo previsto:
   declarar `solucion(mi_caso, culpable).` y comprobar
   `?- responsable(mi_caso, Quien).`

El paso 5 no es opcional: la CI compara `responsable/2` contra `solucion/2` en
todos los casos y falla si difieren.
