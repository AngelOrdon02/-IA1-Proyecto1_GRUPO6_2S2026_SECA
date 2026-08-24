% =============================================================================
% CASO 3 — "La Ultima Noche de Rasputin"
% Conspiracion en el Palacio Moika. San Petersburgo, 30 de diciembre de 1916.
% Dificultad: dificil.
% -----------------------------------------------------------------------------
% Inspirado en el asesinato real de Grigori Rasputin: el principe Felix
% Yusupov lo atrajo a su palacio con la promesa de presentarle a la princesa
% Irina, lo sento en el comedor del sotano ante pasteles con cianuro y, cuando
% el veneno no hizo efecto, sono el primer disparo. Arriba, el gramofono
% tocaba una y otra vez la misma cancion para fingir una fiesta. El cuerpo
% aparecio bajo el hielo del Neva con agua en los pulmones.
%
% Cumple los minimos del enunciado:
%   4 sospechosos · 10 evidencias · 5 lugares · 5 declaraciones · 10 reglas
%
% Que lo hace el mas dificil de los tres: la evidencia mas llamativa apunta al
% sospechoso equivocado. El revolver grabado pertenece al gran duque Dmitri,
% pero el nunca bajo al sotano; y Purishkevich, que juro en la Duma acabar con
% Rasputin y tenia todos los medios, tiene una coartada que si se sostiene.
% El culpable es el anfitrion que jura no distinguir un revolver de un
% candelabro.
%   - purishkevich -> descartado por coartada valida (pese a medios y motivo)
%   - dmitri       -> descartado por falta de acceso y de motivo (senuelo)
%   - lazovert     -> descartado por falta de oportunidad y de motivo
%   - yusupov      -> RESPONSABLE
%   - buzhinsky    -> complice: sostiene su coartada con un testimonio falso.
% =============================================================================

caso(caso3,
     'La Ultima Noche de Rasputin',
     'San Petersburgo, madrugada del 30 de diciembre de 1916. Grigori Rasputin, el monje que susurraba a la corona, fue envenenado y baleado en el comedor del sotano del Palacio Moika entre la 01:00 y la 01:45. Arriba sonaba el gramofono; abajo, alguien servia madeira con cianuro. Todos los invitados juran no haber bajado.',
     dificil).

incidente(caso3, 'Envenenamiento y disparo contra Grigori Rasputin en el comedor del sotano', sotano, 120).
ventana_incidente(caso3, 100, 145).
victima(caso3, rasputin).
solucion(caso3, yusupov).

% ---------------------------------------------------------------------------
% PERSONAS  (4 sospechosos + 2 testigos + 1 victima)
% ---------------------------------------------------------------------------
persona(caso3, rasputin,     'Grigori Rasputin',              victima).
persona(caso3, yusupov,      'Principe Felix Yusupov',        sospechoso).
persona(caso3, purishkevich, 'Vladimir Purishkevich',         sospechoso).
persona(caso3, dmitri,       'Gran Duque Dmitri Pavlovich',   sospechoso).
persona(caso3, lazovert,     'Dr. Stanislaus Lazovert',       sospechoso).
persona(caso3, vlasyuk,      'Gendarme Stepan Vlasyuk',       testigo).
persona(caso3, buzhinsky,    'Grigori Buzhinsky, el lacayo',  testigo).

% ---------------------------------------------------------------------------
% LUGARES  (5)
% ---------------------------------------------------------------------------
lugar(caso3, sotano,     'Comedor del Sotano', 'Sala abovedada con chimenea, pasteles servidos y una cruz de marfil sobre la mesa.').
lugar(caso3, gran_salon, 'Gran Salon',         'El salon del gramofono, donde la "fiesta" sono toda la noche sin ningun invitado.').
lugar(caso3, estudio,    'Estudio del Principe','El despacho privado de Yusupov, con la escalera de caracol que baja al sotano.').
lugar(caso3, vestibulo,  'Vestibulo',          'La entrada del palacio, custodiada por la servidumbre.').
lugar(caso3, patio,      'Patio del Palacio',  'El patio nevado que da al porton de la cochera y al muelle del Moika.').

conexion(caso3, vestibulo,  estudio).
conexion(caso3, vestibulo,  gran_salon).
conexion(caso3, vestibulo,  patio).
conexion(caso3, gran_salon, sotano).
conexion(caso3, estudio,    sotano).

% ---------------------------------------------------------------------------
% ACCESOS
% El gran duque Dmitri es sangre imperial: su rango lo mantiene arriba, lejos
% del sotano. El anfitrion, en cambio, tiene todas las llaves de su palacio.
% ---------------------------------------------------------------------------
acceso(caso3, yusupov, vestibulo, dueno_del_palacio).
acceso(caso3, yusupov, estudio,   dueno_del_palacio).
acceso(caso3, yusupov, sotano,    dueno_del_palacio).
acceso(caso3, yusupov, patio,     porton_cochera).

acceso(caso3, purishkevich, vestibulo,  invitado_conjurado).
acceso(caso3, purishkevich, gran_salon, invitado_conjurado).
acceso(caso3, purishkevich, sotano,     invitado_conjurado).
acceso(caso3, purishkevich, estudio,    invitado_conjurado).
acceso(caso3, purishkevich, patio,      porton_cochera).

acceso(caso3, dmitri, vestibulo,  invitado_imperial).
acceso(caso3, dmitri, gran_salon, invitado_imperial).

acceso(caso3, lazovert, vestibulo,  maletin_medico).
acceso(caso3, lazovert, gran_salon, maletin_medico).
acceso(caso3, lazovert, sotano,     maletin_medico).

acceso(caso3, vlasyuk,   vestibulo, ronda_gendarme).
acceso(caso3, vlasyuk,   patio,     ronda_gendarme).
acceso(caso3, buzhinsky, vestibulo, servidumbre).
acceso(caso3, buzhinsky, estudio,   servidumbre).

% ---------------------------------------------------------------------------
% LINEA TEMPORAL — ubicaciones reales
% ---------------------------------------------------------------------------
estuvo_en(caso3, yusupov,      estudio,    115).
estuvo_en(caso3, yusupov,      sotano,     120).
estuvo_en(caso3, yusupov,      patio,      150).
estuvo_en(caso3, purishkevich, gran_salon, 110).
estuvo_en(caso3, dmitri,       gran_salon, 130).
estuvo_en(caso3, lazovert,     vestibulo,  105).
estuvo_en(caso3, buzhinsky,    estudio,    110).
estuvo_en(caso3, vlasyuk,      vestibulo,  100).

evento(caso3, ev1, 20,  estudio,    'La Ojrana entrega su informe: Rasputin aconseja poner la fortuna Yusupov bajo tutela imperial.').
evento(caso3, ev2, 30,  estudio,    'Alguien quema una invitacion en la chimenea del estudio. No arde entera.').
evento(caso3, ev3, 100, vestibulo,  'Rasputin llega al palacio por la puerta lateral, envuelto en su abrigo de castor.').
evento(caso3, ev4, 115, estudio,    'El gendarme Vlasyuk ve luz y sombras moviendose tras las cortinas del estudio.').
evento(caso3, ev5, 120, sotano,     'Se sirven el madeira y los pasteles en el comedor del sotano. Suena un disparo sordo.').
evento(caso3, ev6, 122, sotano,     'Un revolver queda abandonado al pie de la escalera de caracol.').
evento(caso3, ev7, 140, gran_salon, 'El gramofono vuelve a empezar la misma cancion por cuarta vez.').
evento(caso3, ev8, 150, patio,      'Un automovil cruza el patio nevado hacia el muelle con un bulto en el asiento trasero.').

% ---------------------------------------------------------------------------
% EVIDENCIAS  (10)
% ---------------------------------------------------------------------------
evidencia(caso3, k01, copa_envenenada,  'Copa de madeira con restos de cianuro y las huellas del anfitrion en el cristal.',                sotano,     120).
evidencia(caso3, k02, revolver_grabado, 'Revolver con las iniciales del gran duque Dmitri, abandonado al pie de la escalera.',              sotano,     122).
evidencia(caso3, k03, sombras_estudio,  'El gendarme Vlasyuk declara haber visto al principe moverse tras las cortinas de su estudio.',     estudio,    115).
evidencia(caso3, k04, acta_autopsia,    'Autopsia del Dr. Kosorotov: cianuro en el estomago, tres disparos y agua en los pulmones.',        sotano,     120).
evidencia(caso3, k05, registro_muelle,  'El sereno del muelle anoto un automovil saliendo del porton del palacio hacia el rio a la 01:50.', patio,      150).
evidencia(caso3, k06, nota_quemada,     'Invitacion quemada a medias, recuperada de la chimenea: "Irina te espera a medianoche".',          estudio,    30).
evidencia(caso3, k07, cartuchera,       'Cartuchera de Purishkevich con dos casquillos percutidos, olvidada sobre el gramofono.',           gran_salon, 140).
evidencia(caso3, k08, huellas_nieve,    'Huellas de botas finas de salon entre la puerta del sotano y el patio nevado.',                    sotano,     120).
evidencia(caso3, k09, parte_gendarme,   'Parte del gendarme: el medico del maletin fumaba nervioso en el vestibulo a la 01:05.',            vestibulo,  105).
evidencia(caso3, k10, informe_ojrana,   'Informe de la Ojrana: Rasputin gestionaba poner la fortuna Yusupov bajo tutela de la corona.',     estudio,    20).

vincula(caso3, k01, yusupov).
vincula(caso3, k03, yusupov).
vincula(caso3, k05, yusupov).
vincula(caso3, k06, yusupov).
vincula(caso3, k06, buzhinsky).
vincula(caso3, k08, yusupov).
vincula(caso3, k10, yusupov).
vincula(caso3, k02, dmitri).
vincula(caso3, k07, purishkevich).
vincula(caso3, k09, lazovert).

evidencia_lugar_persona(caso3, k01, yusupov,  sotano).
evidencia_lugar_persona(caso3, k08, yusupov,  sotano).
evidencia_lugar_persona(caso3, k03, yusupov,  estudio).
evidencia_lugar_persona(caso3, k09, lazovert, vestibulo).

% ---------------------------------------------------------------------------
% DECLARACIONES  (5)
% ---------------------------------------------------------------------------
declaracion(caso3, h1, yusupov,
    'Jamas baje al sotano esa noche; no distingo un revolver de un candelabro. Estuve en mi estudio escribiendo cartas.').
afirma(caso3, h1, no_estuvo(yusupov, sotano, 120)).
afirma(caso3, h1, estuvo(yusupov, estudio, 115)).

declaracion(caso3, h2, buzhinsky,
    'El principe no salio de su estudio en toda la noche. Yo custodiaba la puerta y no lo vi bajar. Lo juro por el zar.').
afirma(caso3, h2, estuvo(yusupov, estudio, 120)).

declaracion(caso3, h3, purishkevich,
    'Desde el gran salon vi al principe subir del sotano, palido y con la pechera manchada. Luego pidio su automovil.').
afirma(caso3, h3, vio(purishkevich, yusupov, sotano, 122)).

declaracion(caso3, h4, dmitri,
    'No me movi del gran salon: puse el gramofono una y otra vez, como se me pidio. Y no se nada de ningun revolver.').
afirma(caso3, h4, estuvo(dmitri, gran_salon, 130)).
afirma(caso3, h4, desconoce(dmitri, revolver_grabado)).

declaracion(caso3, h5, lazovert,
    'No baje al sotano. Prepare mi maletin en el vestibulo y sali a calentar el motor del automovil.').
afirma(caso3, h5, no_estuvo(lazovert, sotano, 120)).
afirma(caso3, h5, estuvo(lazovert, vestibulo, 105)).

% ---------------------------------------------------------------------------
% COARTADAS
% ---------------------------------------------------------------------------
coartada(caso3, yusupov,      estudio,    115, buzhinsky). % buzhinsky miente; refutada por k01
coartada(caso3, purishkevich, gran_salon, 110, vlasyuk).   % valida
coartada(caso3, dmitri,       gran_salon, 130, vlasyuk).   % valida
% El Dr. Lazovert no presento coartada alguna.

% ---------------------------------------------------------------------------
% MOTIVOS
% ---------------------------------------------------------------------------
motivo(caso3, yusupov, politico,
    'El informe de la Ojrana confirma que Rasputin gestionaba poner la fortuna Yusupov bajo tutela imperial, y su influencia sobre la zarina crecia sin freno.').
motivo(caso3, purishkevich, patriotico,
    'Denuncio en la Duma que Rasputin destruia la monarquia y juro en publico acabar con "el diablo sagrado".').

% ---------------------------------------------------------------------------
% MEDIOS
% El plan exigia la llave del comedor del sotano Y el cianuro que se sirvio
% en los pasteles y el madeira.
% ---------------------------------------------------------------------------
requiere_medio(caso3, llave_del_sotano).
requiere_medio(caso3, cianuro).

medio(caso3, yusupov,      llave_del_sotano).
medio(caso3, yusupov,      cianuro).
medio(caso3, purishkevich, llave_del_sotano).
medio(caso3, purishkevich, cianuro).
medio(caso3, lazovert,     cianuro).
medio(caso3, dmitri,       llave_del_sotano).

% ---------------------------------------------------------------------------
% RELACIONES
% ---------------------------------------------------------------------------
relacion(caso3, yusupov,      rasputin,     chantaje).
relacion(caso3, purishkevich, rasputin,     rivalidad).
relacion(caso3, buzhinsky,    yusupov,      subordinado).
relacion(caso3, dmitri,       purishkevich, conjura).
relacion(caso3, lazovert,     rasputin,     paciente).

% =============================================================================
% REGLAS DE INFERENCIA PROPIAS DEL CASO 3  (10)
% =============================================================================

regla_caso(caso3, c3_01, 'Invitado de la conjura',
    'Estuvo en el palacio esa noche con acceso franco: anfitrion, conjurado o servidumbre.').
invitado_esa_noche(caso3, Persona) :-
    persona(caso3, Persona, _, _),
    once(( acceso(caso3, Persona, _, Tipo),
           pertenece(Tipo, [dueno_del_palacio, invitado_conjurado, invitado_imperial,
                            maletin_medico, servidumbre, ronda_gendarme]) )).

regla_caso(caso3, c3_02, 'Presente de madrugada',
    'Seguia dentro del palacio pasada la una de la manana, cuando llego Rasputin.').
presente_de_madrugada(caso3, Persona) :-
    estuvo_en(caso3, Persona, _, Hora),
    Hora >= 100.

regla_caso(caso3, c3_03, 'Manejo del veneno',
    'Tuvo en sus manos el cianuro que aparecio en los pasteles y el madeira.').
manejo_del_veneno(caso3, Persona) :-
    medio(caso3, Persona, cianuro).

regla_caso(caso3, c3_04, 'Puede abrir el sotano',
    'Entra al comedor del sotano por derecho propio y tiene su llave.').
puede_abrir_sotano(caso3, Persona) :-
    acceso(caso3, Persona, sotano, _),
    medio(caso3, Persona, llave_del_sotano).

regla_caso(caso3, c3_05, 'Capacidad de ejecucion',
    'Reune la llave del sotano y el manejo del veneno: pudo servir la mesa de la muerte.').
% Ver la nota sobre cortes rojos en caso1_louvre.pl: el generador va primero y
% las comprobaciones dentro de once/1.
capacidad_de_ejecucion(caso3, Persona) :-
    persona(caso3, Persona, _, _),
    once(puede_abrir_sotano(caso3, Persona)),
    once(manejo_del_veneno(caso3, Persona)).

regla_caso(caso3, c3_06, 'Huida hacia el rio',
    'Cruzo el patio hacia el muelle despues del crimen, cuando el automovil partio hacia el Neva.').
huida_hacia_el_rio(caso3, Persona) :-
    estuvo_en(caso3, Persona, patio, Hora),
    Hora > 145.

regla_caso(caso3, c3_07, 'Amenazado por Rasputin',
    'El informe de la Ojrana lo senala como el gran perjudicado por la influencia del monje.').
amenazado_por_rasputin(caso3, Persona) :-
    motivo(caso3, Persona, politico, _),
    vincula(caso3, k10, Persona).

regla_caso(caso3, c3_08, 'Arma ajena como senuelo',
    'Su arma aparece en la escena, pero ninguna evidencia fisica lo situa en el sotano: alguien la dejo por el.').
arma_como_senuelo(caso3, Persona) :-
    vincula(caso3, k02, Persona),
    \+ evidencia_lugar_persona(caso3, _, Persona, sotano).

regla_caso(caso3, c3_09, 'Perfil del conspirador',
    'Combina la capacidad de ejecucion, la presencia de madrugada y la amenaza directa de Rasputin.').
perfil_conspirador(caso3, Persona) :-
    capacidad_de_ejecucion(caso3, Persona),
    presente_de_madrugada(caso3, Persona),
    amenazado_por_rasputin(caso3, Persona).

regla_caso(caso3, c3_10, 'Sospechoso prioritario del Moika',
    'Encaja en el perfil del conspirador, huyo hacia el rio y su coartada no se sostiene.').
sospechoso_prioritario_moika(caso3, Persona) :-
    perfil_conspirador(caso3, Persona),
    huida_hacia_el_rio(caso3, Persona),
    \+ coartada_valida(caso3, Persona).
