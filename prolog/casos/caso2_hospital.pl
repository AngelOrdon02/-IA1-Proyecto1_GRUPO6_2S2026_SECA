% CASO 2 — "La dosis fatal"
% Sustitucion de un medicamento en el Hospital San Lucas. Dificultad: medio.
%
% Resolucion prevista:
%   - dra_rios   -> descartada por coartada valida
%   - enf_pablo  -> descartado por falta de medios y de motivo
%   - sr_hugo    -> descartado por falta de acceso y oportunidad
%   - quim_sofia -> RESPONSABLE
%   - rec_ivan   -> complice: sostiene con un testimonio falso su coartada

caso(caso2,
	'La dosis fatal',
	'Don Ernesto Vallejo, paciente de la habitacion 302, murio de madrugada tras recibir una ampolla cuyo contenido habia sido sustituido. La sustitucion ocurrio en la sala de medicacion entre las 03:00 y las 03:45. El acceso al area requiere credencial y quedo registrado.',
	medio).

incidente(caso2, 'Sustitucion del contenido de una ampolla de medicacion', sala_medicacion, 320).
ventana_incidente(caso2, 300, 345).
victima(caso2, don_ernesto).
solucion(caso2, quim_sofia).

% Personas
persona(caso2, don_ernesto, 'Don Ernesto Vallejo', victima).
persona(caso2, quim_sofia,  'Sofia Aguirre',       sospechoso).
persona(caso2, dra_rios,    'Dra. Carla Rios',     sospechoso).
persona(caso2, enf_pablo,   'Pablo Mena',          sospechoso).
persona(caso2, sr_hugo,     'Hugo Bravo',          sospechoso).
persona(caso2, cel_dora,    'Dora Quintana',       testigo).
persona(caso2, rec_ivan,    'Ivan Sandoval',       testigo).

% Lugares
lugar(caso2, sala_medicacion, 'Sala de Medicacion',  'Area restringida donde se preparan las dosis nocturnas.').
lugar(caso2, habitacion_302,  'Habitacion 302',      'Habitacion del paciente fallecido.').
lugar(caso2, pasillo_norte,   'Pasillo Norte',       'Corredor que comunica el ala de internamiento.').
lugar(caso2, farmacia,        'Farmacia Interna',    'Deposito de farmacos controlados.').
lugar(caso2, vestuario,       'Vestuario de Turno',  'Vestidores del personal de guardia.').

conexion(caso2, pasillo_norte,   sala_medicacion).
conexion(caso2, pasillo_norte,   habitacion_302).
conexion(caso2, pasillo_norte,   vestuario).
conexion(caso2, sala_medicacion, farmacia).
conexion(caso2, farmacia,        vestuario).

% Accesos
acceso(caso2, quim_sofia, farmacia,        credencial_farmacia).
acceso(caso2, quim_sofia, sala_medicacion, credencial_farmacia).
acceso(caso2, quim_sofia, pasillo_norte,   credencial_farmacia).
acceso(caso2, quim_sofia, vestuario,       credencial_farmacia).

acceso(caso2, dra_rios, pasillo_norte,   credencial_medica).
acceso(caso2, dra_rios, sala_medicacion, credencial_medica).
acceso(caso2, dra_rios, habitacion_302,  credencial_medica).
acceso(caso2, dra_rios, vestuario,       credencial_medica).

acceso(caso2, enf_pablo, pasillo_norte,   credencial_enfermeria).
acceso(caso2, enf_pablo, sala_medicacion, credencial_enfermeria).
acceso(caso2, enf_pablo, habitacion_302,  credencial_enfermeria).
acceso(caso2, enf_pablo, vestuario,       credencial_enfermeria).

acceso(caso2, sr_hugo, pasillo_norte,  pase_visitante).
acceso(caso2, sr_hugo, habitacion_302, pase_visitante).

acceso(caso2, cel_dora, pasillo_norte,  credencial_servicios).
acceso(caso2, cel_dora, habitacion_302, credencial_servicios).
acceso(caso2, rec_ivan, pasillo_norte,  credencial_administrativa).

% Linea temporal
estuvo_en(caso2, quim_sofia, farmacia,       315).
estuvo_en(caso2, quim_sofia, pasillo_norte,  318).
estuvo_en(caso2, dra_rios,   pasillo_norte,  310).
estuvo_en(caso2, enf_pablo,  pasillo_norte,  305).
estuvo_en(caso2, sr_hugo,    habitacion_302, 330).
estuvo_en(caso2, cel_dora,   pasillo_norte,  310).
estuvo_en(caso2, rec_ivan,   vestuario,      315).

evento(caso2, ev1, 250,  farmacia,        'Se registra un mensaje entre dos telefonos internos del hospital.').
evento(caso2, ev2, 300,  pasillo_norte,   'Comienza el turno de madrugada.').
evento(caso2, ev3, 305,  pasillo_norte,   'Pablo Mena firma la bitacora de turno.').
evento(caso2, ev4, 315,  farmacia,        'El lector registra una apertura del armario de farmacos controlados.').
evento(caso2, ev5, 318,  pasillo_norte,   'Una camara capta a alguien con bata de farmacia cruzando el pasillo.').
evento(caso2, ev6, 320,  sala_medicacion, 'Se prepara la ampolla que despues se administrara al paciente.').
evento(caso2, ev7, 340,  vestuario,       'Aparece un guante desechado en el cesto del vestuario.').
evento(caso2, ev8, 410,  habitacion_302,  'Se declara el fallecimiento de Don Ernesto Vallejo.').

% Evidencias
evidencia(caso2, f01, huella_digital,     'Huella parcial en el cuello de la ampolla sustituida.',            sala_medicacion, 320).
evidencia(caso2, f02, registro_acceso,    'Log del armario de controlados: apertura con credencial de farmacia.', farmacia,    315).
evidencia(caso2, f03, video_camara,       'Grabacion de una persona con bata de farmacia cruzando el pasillo.', pasillo_norte, 318).
evidencia(caso2, f04, ampolla_sustituida, 'Ampolla cuyo contenido no corresponde a la etiqueta.',             sala_medicacion, 320).
evidencia(caso2, f05, registro_visitas,   'Registro de entrada y salida de visitantes de la madrugada.',      pasillo_norte,   330).
evidencia(caso2, f06, guante_desechado,   'Guante de nitrilo desechado, sin restos utilizables.',             vestuario,       340).
evidencia(caso2, f07, mensaje_movil,      'Mensaje entre dos telefonos internos treinta minutos antes.',      farmacia,        250).
evidencia(caso2, f08, historial_clinico,  'Historial con anotaciones de la demanda por mala praxis.',         habitacion_302,  300).
evidencia(caso2, f09, bitacora_turno,     'Bitacora firmada al inicio del turno de madrugada.',               pasillo_norte,   305).
evidencia(caso2, f10, frasco_vacio,       'Frasco del farmaco original, vacio, tras un contenedor.',          farmacia,        315).

vincula(caso2, f01, quim_sofia).
vincula(caso2, f02, quim_sofia).
vincula(caso2, f03, quim_sofia).
vincula(caso2, f07, quim_sofia).
vincula(caso2, f07, rec_ivan).
vincula(caso2, f05, sr_hugo).
vincula(caso2, f08, dra_rios).
vincula(caso2, f09, enf_pablo).

evidencia_lugar_persona(caso2, f01, quim_sofia, sala_medicacion).
evidencia_lugar_persona(caso2, f02, quim_sofia, farmacia).
evidencia_lugar_persona(caso2, f03, quim_sofia, pasillo_norte).
evidencia_lugar_persona(caso2, f09, enf_pablo,  pasillo_norte).

% Declaraciones
declaracion(caso2, c1, quim_sofia,
	'No baje a la farmacia en toda la madrugada. Estuve en el vestuario cambiandome hasta que sono la alarma.').
afirma(caso2, c1, no_estuvo(quim_sofia, farmacia, 315)).
afirma(caso2, c1, estuvo(quim_sofia, vestuario, 315)).

declaracion(caso2, c2, rec_ivan,
	'Sofia estuvo conmigo en el vestuario. Lo puedo asegurar, la vi ahi todo el rato.').
afirma(caso2, c2, estuvo(quim_sofia, vestuario, 315)).

declaracion(caso2, c3, enf_pablo,
	'Yo vi pasar a Sofia por el pasillo norte, iba con prisa hacia la sala de medicacion.').
afirma(caso2, c3, vio(enf_pablo, quim_sofia, pasillo_norte, 318)).

declaracion(caso2, c4, dra_rios,
	'Estuve en el pasillo norte revisando expedientes. Dora paso a mi lado y me saludo.').
afirma(caso2, c4, estuvo(dra_rios, pasillo_norte, 310)).

declaracion(caso2, c5, sr_hugo,
	'Estuve acompanando a mi tio en su habitacion. Y no se nada de ningun registro de visitas.').
afirma(caso2, c5, estuvo(sr_hugo, habitacion_302, 330)).
afirma(caso2, c5, desconoce(sr_hugo, registro_visitas)).

% Coartadas
coartada(caso2, quim_sofia, vestuario,      315, rec_ivan).
coartada(caso2, dra_rios,   pasillo_norte,  310, cel_dora).
coartada(caso2, sr_hugo,    habitacion_302, 330, cel_dora).

% Motivos
motivo(caso2, quim_sofia, encubrimiento,
	'El paciente iba a declarar ante la fiscalia sobre el desvio de farmacos controlados que ella dirigia.').
motivo(caso2, dra_rios, laboral,
	'El paciente habia interpuesto una demanda por mala praxis que comprometia su licencia.').
motivo(caso2, sr_hugo, herencia,
	'Es el unico heredero del patrimonio del paciente y arrastra deudas de juego.').

% Medios
requiere_medio(caso2, acceso_farmacia_controlada).
requiere_medio(caso2, conocimiento_dosis).

medio(caso2, quim_sofia, acceso_farmacia_controlada).
medio(caso2, quim_sofia, conocimiento_dosis).
medio(caso2, dra_rios,   acceso_farmacia_controlada).
medio(caso2, dra_rios,   conocimiento_dosis).
medio(caso2, enf_pablo,  conocimiento_dosis).

% Relaciones
relacion(caso2, quim_sofia, don_ernesto, chantaje).
relacion(caso2, dra_rios,   don_ernesto, rivalidad).
relacion(caso2, sr_hugo,    don_ernesto, herencia).
relacion(caso2, rec_ivan,   quim_sofia,  pareja).
relacion(caso2, enf_pablo,  quim_sofia,  subordinado).
relacion(caso2, cel_dora,   dra_rios,    amistad).

% Reglas de inferencia propias del caso

regla_caso(caso2, c2_01, 'Personal sanitario',
	'Es personal del hospital quien porta una credencial institucional.').
personal_sanitario(caso2, Persona) :-
	persona(caso2, Persona, _, _),
	once(( acceso(caso2, Persona, _, Tipo),
		pertenece(Tipo, [credencial_farmacia, credencial_medica, credencial_enfermeria, credencial_servicios, credencial_administrativa]) )).

regla_caso(caso2, c2_02, 'Turno de madrugada',
	'Estuvo de servicio durante la franja en que se preparo la dosis.').
en_turno_madrugada(caso2, Persona) :-
	estuvo_en(caso2, Persona, _, Hora),
	Hora >= 300, Hora =< 400.

regla_caso(caso2, c2_03, 'Acceso a farmacos controlados',
	'Puede abrir el armario de controlados: entra a la farmacia y tiene la autorizacion.').
acceso_controlados(caso2, Persona) :-
	acceso(caso2, Persona, farmacia, _),
	medio(caso2, Persona, acceso_farmacia_controlada).

regla_caso(caso2, c2_04, 'Competencia farmacologica',
	'Sabe que sustitucion resulta letal para el paciente.').
competencia_farmacologica(caso2, Persona) :-
	medio(caso2, Persona, conocimiento_dosis).

regla_caso(caso2, c2_05, 'Capacidad tecnica de sustitucion',
	'Reune el acceso al armario y el conocimiento de la dosis: pudo preparar la ampolla.').
pudo_sustituir_dosis(caso2, Persona) :-
	persona(caso2, Persona, _, _),
	once(acceso_controlados(caso2, Persona)),
	once(competencia_farmacologica(caso2, Persona)).

regla_caso(caso2, c2_06, 'Perjudicado por el paciente',
	'El paciente representaba una amenaza legal o economica para esa persona.').
amenazado_por_paciente(caso2, Persona) :-
	motivo(caso2, Persona, Tipo, _),
	pertenece(Tipo, [encubrimiento, laboral, herencia]).

regla_caso(caso2, c2_07, 'Vinculo personal con el personal',
	'Mantiene una relacion personal con alguien de la plantilla, lo que abre la puerta al encubrimiento.').
vinculo_personal_interno(caso2, Persona) :-
	relacion_bi(caso2, Persona, Otra, pareja),
	personal_sanitario(caso2, Otra).

regla_caso(caso2, c2_08, 'Visitante sin acceso clinico',
	'Estuvo en el hospital pero su pase no abre las areas restringidas.').
visitante_sin_acceso(caso2, Persona) :-
	acceso(caso2, Persona, _, pase_visitante),
	\+ acceso(caso2, Persona, sala_medicacion, _).

regla_caso(caso2, c2_09, 'Perfil de sustitucion interna',
	'Combina capacidad tecnica, presencia en el turno y amenaza recibida del paciente.').
perfil_sustitucion_interna(caso2, Persona) :-
	pudo_sustituir_dosis(caso2, Persona),
	en_turno_madrugada(caso2, Persona),
	amenazado_por_paciente(caso2, Persona).

regla_caso(caso2, c2_10, 'Sospechoso prioritario clinico',
	'Encaja en el perfil de sustitucion interna y ademas su coartada no se sostiene.').
sospechoso_prioritario_clinico(caso2, Persona) :-
	perfil_sustitucion_interna(caso2, Persona),
	\+ coartada_valida(caso2, Persona).
