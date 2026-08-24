% =============================================================================
% CASO 2 — "Sombras de Whitechapel"
% El otono del Destripador. Londres, madrugada del 9 de noviembre de 1888.
% Dificultad: medio.
% -----------------------------------------------------------------------------
% Inspirado en el caso real de Jack el Destripador y en sus sospechosos
% historicos: Aaron Kosminski (el barbero polaco al que apunta el chal de
% Catherine Eddowes), George Chapman (aprendiz de cirujano-barbero y
% envenenador convicto), Montague Druitt (el abogado que aparecio en el
% Tamesis) y Francis Tumblety (el medico charlatan americano). La victima es
% Mary Jane Kelly, del cuarto 13 de Miller's Court; el grito de "¡Asesinato!"
% que oyo Sarah Lewis y el testimonio imposible de George Hutchinson son
% parte del expediente real.
%
% Cumple los minimos del enunciado:
%   4 sospechosos · 10 evidencias · 5 lugares · 5 declaraciones · 10 reglas
%
% Que lo hace mas dificil que el caso 1: DOS sospechosos cuentan con todos los
% medios necesarios (Kosminski y Chapman manejan navaja y anatomia), asi que
% el criterio de los medios ya no basta. Hay que llegar hasta la coartada
% refutada por la evidencia.
%   - chapman   -> descartado por coartada valida (pese a tener medios y motivo)
%   - druitt    -> descartado por falta de medios y de motivo
%   - tumblety  -> descartado por falta de acceso y de oportunidad
%   - kosminski -> RESPONSABLE
%   - hutchinson-> complice: sostiene su coartada con un testimonio falso.
% =============================================================================

caso(caso2,
     'Sombras de Whitechapel',
     'Londres, 9 de noviembre de 1888. Mary Jane Kelly fue asesinada en el cuarto 13 de Miller''s Court entre las 03:30 y las 04:15. Sarah Lewis oyo un grito ahogado de "¡Asesinato!" y la niebla se trago al culpable. Scotland Yard baraja cuatro nombres; el Destripador es uno de ellos.',
     medio).

incidente(caso2, 'Asesinato de Mary Jane Kelly en el cuarto 13 de Miller''s Court', millers_court, 350).
ventana_incidente(caso2, 330, 415).
victima(caso2, mary_kelly).
solucion(caso2, kosminski).

% ---------------------------------------------------------------------------
% PERSONAS  (4 sospechosos + 2 testigos + 1 victima)
% ---------------------------------------------------------------------------
persona(caso2, mary_kelly, 'Mary Jane Kelly',   victima).
persona(caso2, kosminski,  'Aaron Kosminski',   sospechoso).
persona(caso2, chapman,    'George Chapman',    sospechoso).
persona(caso2, druitt,     'Montague Druitt',   sospechoso).
persona(caso2, tumblety,   'Francis Tumblety',  sospechoso).
persona(caso2, lewis,      'Sarah Lewis',       testigo).
persona(caso2, hutchinson, 'George Hutchinson', testigo).

% ---------------------------------------------------------------------------
% LUGARES  (5)
% ---------------------------------------------------------------------------
lugar(caso2, millers_court,   'Miller''s Court',    'Patio interior al que se entra por un pasaje estrecho; el cuarto 13 es el de Mary Kelly.').
lugar(caso2, dorset_street,   'Dorset Street',      'La calle mas temida de Londres; comunica el pasaje, el pub y los callejones.').
lugar(caso2, ten_bells,       'Pub The Ten Bells',  'La taberna de Commercial Street donde bebian las victimas y las miradas lo registran todo.').
lugar(caso2, barberia,        'Barberia de Sion Square', 'El local donde Kosminski afila navajas desde el amanecer.').
lugar(caso2, goulston_street, 'Goulston Street',    'El arco donde una vez aparecio el delantal ensangrentado y el grafiti del Destripador.').

conexion(caso2, dorset_street, millers_court).
conexion(caso2, dorset_street, ten_bells).
conexion(caso2, dorset_street, goulston_street).
conexion(caso2, millers_court, barberia).
conexion(caso2, barberia,      goulston_street).

% ---------------------------------------------------------------------------
% ACCESOS
% Tumblety es un forastero americano: nadie le abre el pasaje de Miller's
% Court. Los vecinos del barrio, en cambio, conocen cada arco y cada patio.
% ---------------------------------------------------------------------------
acceso(caso2, kosminski, barberia,        llave_barberia).
acceso(caso2, kosminski, millers_court,   conoce_el_pasaje).
acceso(caso2, kosminski, dorset_street,   vecino_del_barrio).
acceso(caso2, kosminski, goulston_street, vecino_del_barrio).

acceso(caso2, chapman, dorset_street,   vecino_del_barrio).
acceso(caso2, chapman, millers_court,   conoce_el_pasaje).
acceso(caso2, chapman, ten_bells,       parroquiano).
acceso(caso2, chapman, goulston_street, vecino_del_barrio).

acceso(caso2, druitt, dorset_street,   vecino_del_barrio).
acceso(caso2, druitt, millers_court,   conoce_el_pasaje).
acceso(caso2, druitt, ten_bells,       parroquiano).
acceso(caso2, druitt, goulston_street, vecino_del_barrio).

acceso(caso2, tumblety, dorset_street, forastero).
acceso(caso2, tumblety, ten_bells,     forastero).

acceso(caso2, lewis,      dorset_street, vecina_del_barrio).
acceso(caso2, lewis,      ten_bells,     parroquiana).
acceso(caso2, hutchinson, dorset_street, vecino_del_barrio).

% ---------------------------------------------------------------------------
% LINEA TEMPORAL — ubicaciones reales
% ---------------------------------------------------------------------------
estuvo_en(caso2, kosminski,  barberia,        345).
estuvo_en(caso2, kosminski,  dorset_street,   348).
estuvo_en(caso2, chapman,    dorset_street,   340).
estuvo_en(caso2, druitt,     dorset_street,   335).
estuvo_en(caso2, tumblety,   ten_bells,       400).
estuvo_en(caso2, lewis,      dorset_street,   340).
estuvo_en(caso2, hutchinson, goulston_street, 345).

evento(caso2, ev1, 320, barberia,        'Un chico de los recados lleva una nota entre la barberia y Goulston Street.').
evento(caso2, ev2, 330, dorset_street,   'Sarah Lewis llega a Miller''s Court y ve a un hombre montando guardia frente al pasaje.').
evento(caso2, ev3, 335, dorset_street,   'Montague Druitt es visto caminando solo bajo la llovizna de Dorset Street.').
evento(caso2, ev4, 345, barberia,        'El cierre metalico de la barberia se abre y se vuelve a cerrar en plena madrugada.').
evento(caso2, ev5, 348, dorset_street,   'Un hombre de abrigo oscuro cruza deprisa hacia el pasaje de Miller''s Court.').
evento(caso2, ev6, 350, millers_court,   'Un grito ahogado de "¡Asesinato!" sale del patio. Nadie en Whitechapel se asoma.').
evento(caso2, ev7, 410, goulston_street, 'Aparece un chal de seda abandonado bajo el arco de Goulston Street.').
evento(caso2, ev8, 440, millers_court,   'Thomas Bowyer pasa a cobrar el alquiler, mira por la ventana rota y da aviso a la policia.').

% ---------------------------------------------------------------------------
% EVIDENCIAS  (10)
% ---------------------------------------------------------------------------
evidencia(caso2, f01, navaja_de_barbero,  'Navaja de barbero con el filo recien asentado, hallada junto al lecho. El asentado es el de Sion Square.', millers_court, 350).
evidencia(caso2, f02, testimonio_sereno,  'El sereno del turno declara haber visto a Kosminski salir de la barberia a las 03:45.',                    barberia,       345).
evidencia(caso2, f03, avistamiento,       'Sarah Lewis describe a un hombre de abrigo oscuro cruzando hacia el pasaje de Miller''s Court.',           dorset_street,  348).
evidencia(caso2, f04, escena_del_crimen,  'El cuarto 13 presenta la firma que la prensa atribuye al Destripador. La puerta no fue forzada.',          millers_court,  350).
evidencia(caso2, f05, registro_taberna,   'La cuenta del forastero americano en el Ten Bells, pagada a las 04:00 segun el tabernero.',                ten_bells,      400).
evidencia(caso2, f06, chal_abandonado,    'Chal de seda abandonado bajo el arco de Goulston Street, sin marcas que identifiquen a su dueno.',         goulston_street, 410).
evidencia(caso2, f07, nota_recadero,      'Nota sin firma recuperada del recadero: "no digas a nadie que sali esta noche".',                          barberia,       320).
evidencia(caso2, f08, expediente_hospital,'Expediente del Hospital de Londres: Chapman compro vitriolo y fue denunciado por amenazas.',               ten_bells,      330).
evidencia(caso2, f09, avistamiento_druitt,'Un cochero declara haber visto a Druitt vagando por Dorset Street a las 03:35.',                           dorset_street,  335).
evidencia(caso2, f10, delantal_de_cuero,  'Delantal de cuero con manchas oscuras, colgado tras el mostrador de la barberia.',                         barberia,       345).

vincula(caso2, f01, kosminski).
vincula(caso2, f02, kosminski).
vincula(caso2, f03, kosminski).
vincula(caso2, f07, kosminski).
vincula(caso2, f07, hutchinson).
vincula(caso2, f05, tumblety).
vincula(caso2, f08, chapman).
vincula(caso2, f09, druitt).

evidencia_lugar_persona(caso2, f01, kosminski, millers_court).
evidencia_lugar_persona(caso2, f02, kosminski, barberia).
evidencia_lugar_persona(caso2, f03, kosminski, dorset_street).
evidencia_lugar_persona(caso2, f09, druitt,    dorset_street).

% ---------------------------------------------------------------------------
% DECLARACIONES  (5)
% ---------------------------------------------------------------------------
declaracion(caso2, c1, kosminski,
    'Yo no estaba en la barberia: cerre temprano y me fui con Hutchinson a Goulston Street. Alli pasamos la madrugada.').
afirma(caso2, c1, no_estuvo(kosminski, barberia, 345)).
afirma(caso2, c1, estuvo(kosminski, goulston_street, 345)).

declaracion(caso2, c2, hutchinson,
    'Aaron estuvo conmigo en Goulston Street toda la madrugada. Lo recuerdo con todo detalle: el abrigo, el reloj, los botines.').
afirma(caso2, c2, estuvo(kosminski, goulston_street, 345)).

declaracion(caso2, c3, druitt,
    'Vi a Kosminski cruzar Dorset Street casi corriendo, derecho al pasaje de Miller''s Court. La niebla no me deja mentir.').
afirma(caso2, c3, vio(druitt, kosminski, dorset_street, 348)).

declaracion(caso2, c4, chapman,
    'Volvia del pub por Dorset Street y me cruce con Sarah Lewis. Ella misma puede decirlo.').
afirma(caso2, c4, estuvo(chapman, dorset_street, 340)).

declaracion(caso2, c5, tumblety,
    'Pase la noche entera en el Ten Bells con mi cuenta abierta. Y no se nada de ningun registro de taberna.').
afirma(caso2, c5, estuvo(tumblety, ten_bells, 400)).
afirma(caso2, c5, desconoce(tumblety, registro_taberna)).

% ---------------------------------------------------------------------------
% COARTADAS
% ---------------------------------------------------------------------------
coartada(caso2, kosminski, goulston_street, 345, hutchinson). % refutada por f02
coartada(caso2, chapman,   dorset_street,   340, lewis).      % valida
coartada(caso2, tumblety,  ten_bells,       400, lewis).      % valida
% Montague Druitt no presento coartada alguna.

% ---------------------------------------------------------------------------
% MOTIVOS
% ---------------------------------------------------------------------------
motivo(caso2, kosminski, encubrimiento,
    'Mary Kelly lo reconocio la noche de Mitre Square y amenazaba con senalarlo ante la policia si no le pagaba el silencio.').
motivo(caso2, chapman, antecedentes,
    'Fue denunciado por amenazar a su esposa con un cuchillo y compro vitriolo semanas antes del crimen.').
motivo(caso2, tumblety, obsesion,
    'Los informes de Scotland Yard registran su coleccion anatomica y su desprecio declarado hacia las mujeres del East End.').

% ---------------------------------------------------------------------------
% MEDIOS
% El crimen exigia una hoja de precision Y destreza anatomica: el forense
% Bond fue tajante en ese punto.
% ---------------------------------------------------------------------------
requiere_medio(caso2, navaja_de_precision).
requiere_medio(caso2, destreza_anatomica).

medio(caso2, kosminski, navaja_de_precision).
medio(caso2, kosminski, destreza_anatomica).
medio(caso2, chapman,   navaja_de_precision).
medio(caso2, chapman,   destreza_anatomica).
medio(caso2, druitt,    destreza_anatomica).

% ---------------------------------------------------------------------------
% RELACIONES
% ---------------------------------------------------------------------------
relacion(caso2, kosminski,  mary_kelly, chantaje).
relacion(caso2, chapman,    mary_kelly, rivalidad).
relacion(caso2, tumblety,   mary_kelly, deuda).
relacion(caso2, hutchinson, kosminski,  amistad).
relacion(caso2, druitt,     kosminski,  conocidos).
relacion(caso2, lewis,      chapman,    vecindad).

% =============================================================================
% REGLAS DE INFERENCIA PROPIAS DEL CASO 2  (10)
% =============================================================================

regla_caso(caso2, c2_01, 'Vecino de Whitechapel',
    'Conoce el laberinto del barrio quien vive o trabaja en el: pasajes, arcos y patios.').
vecino_de_whitechapel(caso2, Persona) :-
    persona(caso2, Persona, _, _),
    once(( acceso(caso2, Persona, _, Tipo),
           pertenece(Tipo, [llave_barberia, conoce_el_pasaje, vecino_del_barrio,
                            vecina_del_barrio, parroquiano, parroquiana]) )).

regla_caso(caso2, c2_02, 'Rondaba de madrugada',
    'Fue visto en la calle durante la franja del crimen, cuando Whitechapel duerme.').
rondaba_de_madrugada(caso2, Persona) :-
    estuvo_en(caso2, Persona, _, Hora),
    Hora >= 330, Hora =< 430.

regla_caso(caso2, c2_03, 'Porta una hoja de precision',
    'Tiene a mano una navaja recien asentada: entra a la barberia y sabe llevarla encima.').
porta_navaja(caso2, Persona) :-
    acceso(caso2, Persona, barberia, _),
    medio(caso2, Persona, navaja_de_precision).

regla_caso(caso2, c2_04, 'Destreza anatomica',
    'Sabe donde cortar: el forense Bond dicto que el culpable conocia la anatomia.').
destreza_quirurgica(caso2, Persona) :-
    medio(caso2, Persona, destreza_anatomica).

regla_caso(caso2, c2_05, 'Capaz del crimen',
    'Reune la hoja de precision y la destreza anatomica: pudo ejecutar la firma del Destripador.').
% Ver la nota sobre cortes rojos en caso1_louvre.pl: el generador va primero y
% las comprobaciones dentro de once/1.
capaz_del_crimen(caso2, Persona) :-
    persona(caso2, Persona, _, _),
    once(porta_navaja(caso2, Persona)),
    once(destreza_quirurgica(caso2, Persona)).

regla_caso(caso2, c2_06, 'Senalado por la victima',
    'Mary Kelly representaba una amenaza directa para esa persona.').
senalado_por_la_victima(caso2, Persona) :-
    motivo(caso2, Persona, Tipo, _),
    pertenece(Tipo, [encubrimiento, antecedentes, obsesion]).

regla_caso(caso2, c2_07, 'Amigo dispuesto a jurar',
    'Cuenta con un amigo intimo en el barrio dispuesto a jurar cualquier cosa por el.').
amigo_dispuesto_a_jurar(caso2, Persona) :-
    relacion_bi(caso2, Persona, Otra, amistad),
    vecino_de_whitechapel(caso2, Otra).

regla_caso(caso2, c2_08, 'Forastero sin llave del barrio',
    'Estuvo en Whitechapel pero nadie le abre el pasaje de Miller''s Court: es un extrano.').
forastero_sin_llave(caso2, Persona) :-
    acceso(caso2, Persona, _, forastero),
    \+ acceso(caso2, Persona, millers_court, _).

regla_caso(caso2, c2_09, 'Perfil del Destripador',
    'Combina la capacidad del crimen, las rondas de madrugada y la amenaza que suponia la victima.').
perfil_destripador(caso2, Persona) :-
    capaz_del_crimen(caso2, Persona),
    rondaba_de_madrugada(caso2, Persona),
    senalado_por_la_victima(caso2, Persona).

regla_caso(caso2, c2_10, 'Sospechoso prioritario de Scotland Yard',
    'Encaja en el perfil del Destripador y ademas su coartada no se sostiene.').
sospechoso_prioritario_yard(caso2, Persona) :-
    perfil_destripador(caso2, Persona),
    \+ coartada_valida(caso2, Persona).
