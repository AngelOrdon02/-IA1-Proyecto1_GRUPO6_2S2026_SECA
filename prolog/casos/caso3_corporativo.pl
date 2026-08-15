% CASO 3 — "El codigo fuente robado"
% Filtracion del prototipo de TecnoNova S.A. Dificultad: dificil.
%
% Resolucion prevista:
%   - ing_dario  -> descartado por coartada valida
%   - dev_kenji  -> descartado por falta de acceso, medios y motivo (senuelo)
%   - sra_lucia  -> descartada por falta de oportunidad y de motivo
%   - lic_vera   -> RESPONSABLE
%   - sec_pia    -> complice: sostiene su coartada con un testimonio falso

caso(caso3,
	'El codigo fuente robado',
	'El prototipo completo de TecnoNova aparecio publicado en un foro extranjero. La extraccion se hizo desde la sala de servidores entre las 22:30 y las 23:15 de un viernes, con el edificio practicamente vacio. El sistema exige huella biometrica y credencial de administrador.',
	dificil).

incidente(caso3, 'Extraccion no autorizada del repositorio del prototipo', sala_servidores, 2250).
ventana_incidente(caso3, 2230, 2315).
victima(caso3, don_ramiro).
solucion(caso3, lic_vera).

% Personas
persona(caso3, don_ramiro, 'Ramiro Alcantara', victima).
persona(caso3, lic_vera,   'Vera Solis',       sospechoso).
persona(caso3, ing_dario,  'Dario Pena',       sospechoso).
persona(caso3, dev_kenji,  'Kenji Mora',       sospechoso).
persona(caso3, sra_lucia,  'Lucia Ferrer',     sospechoso).
persona(caso3, guard_omar, 'Omar Beltran',     testigo).
persona(caso3, sec_pia,    'Pia Corvalan',     testigo).

% Lugares
lugar(caso3, sala_servidores,   'Sala de Servidores',  'Area de acceso biometrico donde reside el repositorio.').
lugar(caso3, oficina_direccion, 'Oficina de Direccion','Despachos de la alta gerencia.').
lugar(caso3, laboratorio,       'Laboratorio',         'Area de desarrollo y pruebas del prototipo.').
lugar(caso3, recepcion,         'Recepcion',           'Entrada principal con registro de accesos.').
lugar(caso3, estacionamiento,   'Estacionamiento',     'Playa de estacionamiento con barrera y tarjeta.').

conexion(caso3, recepcion,         oficina_direccion).
conexion(caso3, recepcion,         laboratorio).
conexion(caso3, recepcion,         estacionamiento).
conexion(caso3, laboratorio,       sala_servidores).
conexion(caso3, oficina_direccion, sala_servidores).

% Accesos
acceso(caso3, ing_dario, recepcion,         credencial_infraestructura).
acceso(caso3, ing_dario, laboratorio,       credencial_infraestructura).
acceso(caso3, ing_dario, sala_servidores,   credencial_infraestructura).
acceso(caso3, ing_dario, oficina_direccion, credencial_infraestructura).
acceso(caso3, ing_dario, estacionamiento,   tarjeta_estacionamiento).

acceso(caso3, lic_vera, recepcion,         credencial_direccion).
acceso(caso3, lic_vera, oficina_direccion, credencial_direccion).
acceso(caso3, lic_vera, sala_servidores,   credencial_direccion).
acceso(caso3, lic_vera, estacionamiento,   tarjeta_estacionamiento).

acceso(caso3, dev_kenji, recepcion,   credencial_desarrollo).
acceso(caso3, dev_kenji, laboratorio, credencial_desarrollo).

acceso(caso3, sra_lucia, recepcion,       credencial_seguridad).
acceso(caso3, sra_lucia, laboratorio,     credencial_seguridad).
acceso(caso3, sra_lucia, sala_servidores, credencial_seguridad).

acceso(caso3, guard_omar, recepcion,       credencial_vigilancia).
acceso(caso3, guard_omar, estacionamiento, credencial_vigilancia).
acceso(caso3, sec_pia,    recepcion,         credencial_administrativa).
acceso(caso3, sec_pia,    oficina_direccion, credencial_administrativa).

% Linea temporal
estuvo_en(caso3, lic_vera,  oficina_direccion, 2245).
estuvo_en(caso3, lic_vera,  sala_servidores,   2250).
estuvo_en(caso3, lic_vera,  estacionamiento,   2320).
estuvo_en(caso3, ing_dario, laboratorio,       2240).
estuvo_en(caso3, dev_kenji, laboratorio,       2300).
estuvo_en(caso3, sra_lucia, recepcion,         2235).
estuvo_en(caso3, sec_pia,   oficina_direccion, 2240).
estuvo_en(caso3, guard_omar, recepcion,        2230).

evento(caso3, ev1, 2100, oficina_direccion, 'Se cierra la auditoria financiera trimestral con hallazgos sin explicar.').
evento(caso3, ev2, 2200, oficina_direccion, 'Se borra un intercambio de correos de la cuenta de direccion financiera.').
evento(caso3, ev3, 2230, recepcion,         'El guardia registra la ultima ronda con el edificio casi vacio.').
evento(caso3, ev4, 2245, oficina_direccion, 'Una camara capta movimiento en el pasillo de direccion.').
evento(caso3, ev5, 2250, sala_servidores,   'El lector biometrico registra una apertura de la sala de servidores.').
evento(caso3, ev6, 2252, sala_servidores,   'Se inicia una sesion VPN con credenciales del equipo de desarrollo.').
evento(caso3, ev7, 2310, laboratorio,       'Un disco externo queda conectado a una estacion del laboratorio.').
evento(caso3, ev8, 2320, estacionamiento,   'La barrera registra la salida de un vehiculo con tarjeta corporativa.').

% Evidencias
evidencia(caso3, k01, huella_biometrica,      'Huella registrada en el lector de la sala de servidores.',        sala_servidores,   2250).
evidencia(caso3, k02, registro_vpn,           'Sesion VPN abierta con credenciales del equipo de desarrollo.',   sala_servidores,   2252).
evidencia(caso3, k03, video_camara,           'Grabacion del pasillo de direccion minutos antes de la apertura.', oficina_direccion, 2245).
evidencia(caso3, k04, log_servidor,           'Registro de transferencia masiva del repositorio del prototipo.', sala_servidores,   2250).
evidencia(caso3, k05, tarjeta_estacionamiento,'Registro de salida de la barrera con tarjeta corporativa.',       estacionamiento,   2320).
evidencia(caso3, k06, correo_borrado,         'Intercambio de correos eliminado y recuperado del respaldo.',     oficina_direccion, 2200).
evidencia(caso3, k07, disco_externo,          'Disco externo hallado conectado a una estacion del laboratorio.', laboratorio,       2310).
evidencia(caso3, k08, registro_biometrico,    'Log del control biometrico de la sala de servidores.',            sala_servidores,   2250).
evidencia(caso3, k09, bitacora_guardia,       'Bitacora de la ultima ronda de vigilancia.',                      recepcion,         2235).
evidencia(caso3, k10, auditoria_financiera,   'Informe con desviaciones no justificadas en la direccion financiera.', oficina_direccion, 2100).

vincula(caso3, k01, lic_vera).
vincula(caso3, k03, lic_vera).
vincula(caso3, k05, lic_vera).
vincula(caso3, k06, lic_vera).
vincula(caso3, k06, sec_pia).
vincula(caso3, k08, lic_vera).
vincula(caso3, k10, lic_vera).
vincula(caso3, k02, dev_kenji).
vincula(caso3, k07, ing_dario).
vincula(caso3, k09, sra_lucia).

evidencia_lugar_persona(caso3, k01, lic_vera,  sala_servidores).
evidencia_lugar_persona(caso3, k08, lic_vera,  sala_servidores).
evidencia_lugar_persona(caso3, k03, lic_vera,  oficina_direccion).
evidencia_lugar_persona(caso3, k09, sra_lucia, recepcion).

% Declaraciones
declaracion(caso3, h1, lic_vera,
	'Jamas he entrado a la sala de servidores, no sabria ni encender un rack. Estuve en mi despacho hasta que me fui.').
afirma(caso3, h1, no_estuvo(lic_vera, sala_servidores, 2250)).
afirma(caso3, h1, estuvo(lic_vera, oficina_direccion, 2245)).

declaracion(caso3, h2, sec_pia,
	'La licenciada Solis estuvo en su despacho toda la noche. Yo estaba en el pasillo y no la vi salir.').
afirma(caso3, h2, estuvo(lic_vera, oficina_direccion, 2250)).

declaracion(caso3, h3, ing_dario,
	'Cuando bajaba del laboratorio vi a la licenciada Solis saliendo de la sala de servidores.').
afirma(caso3, h3, vio(ing_dario, lic_vera, sala_servidores, 2252)).

declaracion(caso3, h4, dev_kenji,
	'Me quede terminando pruebas en el laboratorio. No se nada de ningun registro de VPN a esa hora.').
afirma(caso3, h4, estuvo(dev_kenji, laboratorio, 2300)).
afirma(caso3, h4, desconoce(dev_kenji, registro_vpn)).

declaracion(caso3, h5, sra_lucia,
	'No baje a la sala de servidores. Termine mi ronda en recepcion y me retire.').
afirma(caso3, h5, no_estuvo(sra_lucia, sala_servidores, 2250)).
afirma(caso3, h5, estuvo(sra_lucia, recepcion, 2235)).

% Coartadas
coartada(caso3, lic_vera,  oficina_direccion, 2245, sec_pia).
coartada(caso3, ing_dario, laboratorio,       2240, guard_omar).
coartada(caso3, dev_kenji, laboratorio,       2300, guard_omar).

% Motivos
motivo(caso3, lic_vera, financiero,
	'La auditoria estaba a punto de destapar el desvio de fondos que ella habia ocultado durante dos ejercicios.').
motivo(caso3, ing_dario, laboral,
	'Su puesto figuraba en la lista de recorte que la direccion aprobo esa misma semana.').

% Medios
requiere_medio(caso3, llave_biometrica).
requiere_medio(caso3, credencial_root).

medio(caso3, lic_vera,  llave_biometrica).
medio(caso3, lic_vera,  credencial_root).
medio(caso3, ing_dario, llave_biometrica).
medio(caso3, ing_dario, credencial_root).
medio(caso3, dev_kenji, credencial_root).
medio(caso3, sra_lucia, llave_biometrica).

% Relaciones
relacion(caso3, lic_vera,  don_ramiro, chantaje).
relacion(caso3, ing_dario, don_ramiro, despido).
relacion(caso3, sec_pia,   lic_vera,   subordinado).
relacion(caso3, dev_kenji, ing_dario,  companeros).
relacion(caso3, sra_lucia, don_ramiro, laboral).

% Reglas de inferencia propias del caso

regla_caso(caso3, c3_01, 'Personal con credencial corporativa',
	'Es empleado quien porta una credencial de la empresa.').
empleado(caso3, Persona) :-
	persona(caso3, Persona, _, _),
	once(( acceso(caso3, Persona, _, Tipo),
		pertenece(Tipo, [credencial_infraestructura, credencial_direccion, credencial_desarrollo, credencial_seguridad, credencial_vigilancia, credencial_administrativa]) )).

regla_caso(caso3, c3_02, 'Presencia fuera de horario',
	'Permanecio en el edificio despues del cierre de la jornada.').
presencia_fuera_horario(caso3, Persona) :-
	estuvo_en(caso3, Persona, _, Hora),
	Hora >= 2200.

regla_caso(caso3, c3_03, 'Perfil tecnico',
	'Tiene credenciales de administrador sobre los sistemas.').
perfil_tecnico(caso3, Persona) :-
	medio(caso3, Persona, credencial_root).

regla_caso(caso3, c3_04, 'Puede abrir la sala de servidores',
	'Su huella esta dada de alta en el control biometrico de la sala.').
puede_abrir_sala(caso3, Persona) :-
	acceso(caso3, Persona, sala_servidores, _),
	medio(caso3, Persona, llave_biometrica).

regla_caso(caso3, c3_05, 'Capacidad de extraccion',
	'Reune la apertura biometrica y las credenciales de administrador.').
capacidad_extraccion(caso3, Persona) :-
	persona(caso3, Persona, _, _),
	once(puede_abrir_sala(caso3, Persona)),
	once(perfil_tecnico(caso3, Persona)).

regla_caso(caso3, c3_06, 'Salida registrada tras el incidente',
	'Su vehiculo o su tarjeta salieron del recinto despues de la extraccion.').
salida_tras_incidente(caso3, Persona) :-
	estuvo_en(caso3, Persona, estacionamiento, Hora),
	Hora > 2315.

regla_caso(caso3, c3_07, 'Expuesto por la auditoria',
	'La auditoria en curso comprometia directamente a esa persona.').
expuesto_por_auditoria(caso3, Persona) :-
	motivo(caso3, Persona, financiero, _),
	vincula(caso3, k10, Persona).

regla_caso(caso3, c3_08, 'Credenciales usurpadas',
	'Sus credenciales aparecen en el registro pero la evidencia fisica situa a otra persona en la sala.').
credenciales_usurpadas(caso3, Persona) :-
	vincula(caso3, k02, Persona),
	\+ evidencia_lugar_persona(caso3, _, Persona, sala_servidores).

regla_caso(caso3, c3_09, 'Perfil de filtracion interna',
	'Combina capacidad de extraccion, presencia fuera de horario y exposicion por la auditoria.').
perfil_filtracion_interna(caso3, Persona) :-
	capacidad_extraccion(caso3, Persona),
	presencia_fuera_horario(caso3, Persona),
	expuesto_por_auditoria(caso3, Persona).

regla_caso(caso3, c3_10, 'Sospechoso prioritario corporativo',
	'Encaja en el perfil de filtracion interna, salio tras el incidente y su coartada no se sostiene.').
sospechoso_prioritario_corporativo(caso3, Persona) :-
	perfil_filtracion_interna(caso3, Persona),
	salida_tras_incidente(caso3, Persona),
	\+ coartada_valida(caso3, Persona).
