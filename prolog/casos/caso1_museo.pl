% CASO 1 — "El Códice de Jade"
% Robo en el Museo Nacional de Arqueologia. Dificultad: facil.
%
% Resolucion prevista:
%   - elena  -> descartada por coartada valida y falta de acceso
%   - nadia  -> descartada por falta de motivo y medios
%   - tomas  -> descartado por falta de oportunidad y acceso
%   - marco  -> RESPONSABLE: posee acceso, oportunidad, motivo y medios;
%               su coartada queda refutada por evidencia física.
%   - julio  -> complice: encubre a marco con un testimonio falso.

caso(caso1,
	'El Codice de Jade',
	'Durante la gala anual del Museo Nacional, el Codice de Jade desaparecio de su vitrina en la Sala Jade entre las 21:00 y las 21:45. La alarma perimetral nunca se activo, lo que apunta a alguien que conocia el sistema desde dentro.',
	facil).

incidente(caso1, 'Robo del Codice de Jade de su vitrina blindada', sala_jade, 2130).
ventana_incidente(caso1, 2100, 2145).
victima(caso1, dr_salazar).
solucion(caso1, marco).

% Personas
persona(caso1, dr_salazar, 'Dr. Hector Salazar', victima).
persona(caso1, marco,      'Marco Duarte',       sospechoso).
persona(caso1, elena,      'Elena Ruiz',         sospechoso).
persona(caso1, nadia,      'Nadia Ponce',        sospechoso).
persona(caso1, tomas,      'Tomas Iriarte',      sospechoso).
persona(caso1, rosa,       'Rosa Melgar',        testigo).
persona(caso1, julio,      'Julio Cana',         testigo).

% Lugares
lugar(caso1, sala_jade,          'Sala Jade',            'Sala principal, alberga la vitrina blindada del codice.').
lugar(caso1, vestibulo,          'Vestibulo',            'Entrada principal del museo, con registro de visitantes.').
lugar(caso1, oficina_seguridad,  'Oficina de Seguridad', 'Centro de control de camaras y alarmas.').
lugar(caso1, deposito,           'Deposito',             'Almacen de piezas en restauracion.').
lugar(caso1, jardin,             'Jardin Norte',         'Patio exterior donde se sirvio la gala.').

conexion(caso1, vestibulo,         sala_jade).
conexion(caso1, vestibulo,         oficina_seguridad).
conexion(caso1, vestibulo,         jardin).
conexion(caso1, sala_jade,         deposito).
conexion(caso1, deposito,          oficina_seguridad).

% Accesos
acceso(caso1, marco, vestibulo,         credencial_maestra).
acceso(caso1, marco, oficina_seguridad, credencial_maestra).
acceso(caso1, marco, sala_jade,         credencial_maestra).
acceso(caso1, marco, deposito,          credencial_maestra).
acceso(caso1, marco, jardin,            credencial_maestra).

acceso(caso1, elena, deposito,  llave_restauracion).
acceso(caso1, elena, vestibulo, credencial_personal).
acceso(caso1, elena, jardin,    acceso_publico).

acceso(caso1, nadia, vestibulo, credencial_personal).
acceso(caso1, nadia, sala_jade, credencial_guia).
acceso(caso1, nadia, jardin,    acceso_publico).

acceso(caso1, tomas, vestibulo, invitacion_gala).
acceso(caso1, tomas, jardin,    acceso_publico).

acceso(caso1, rosa,  vestibulo, credencial_personal).
acceso(caso1, julio, vestibulo, credencial_personal).
acceso(caso1, julio, deposito,  llave_mantenimiento).

% Linea temporal
estuvo_en(caso1, marco, oficina_seguridad, 2105).
estuvo_en(caso1, marco, vestibulo,         2120).
estuvo_en(caso1, elena, deposito,          2115).
estuvo_en(caso1, nadia, vestibulo,         2110).
estuvo_en(caso1, tomas, jardin,            2118).
estuvo_en(caso1, rosa,  vestibulo,         2100).
estuvo_en(caso1, julio, deposito,          2135).

evento(caso1, ev1, 2050, oficina_seguridad, 'Marco Duarte realiza una llamada de 4 minutos a Tomas Iriarte.').
evento(caso1, ev2, 2100, jardin,            'Comienza formalmente la gala en el Jardin Norte.').
evento(caso1, ev3, 2105, oficina_seguridad, 'Se registra la desactivacion del sector 3 de la alarma.').
evento(caso1, ev4, 2122, vestibulo,         'Una camara capta a Marco Duarte cruzando hacia la Sala Jade.').
evento(caso1, ev5, 2130, sala_jade,         'La vitrina del codice aparece forzada.').
evento(caso1, ev6, 2140, jardin,            'Se encuentra un guante de latex entre los setos.').
evento(caso1, ev7, 2145, sala_jade,         'Se da la alerta: el Codice de Jade no esta en su vitrina.').

% Evidencias
evidencia(caso1, e01, huella_digital,      'Huella parcial en el marco de la vitrina forzada.',                sala_jade,         2130).
evidencia(caso1, e02, video_camara,        'Grabacion que muestra a un hombre de uniforme cruzando el vestibulo.', vestibulo,     2122).
evidencia(caso1, e03, registro_acceso,     'Log del sistema: desactivacion del sector 3 con credencial maestra.', oficina_seguridad, 2105).
evidencia(caso1, e04, fibra_textil,        'Fibra de bata de restauracion adherida a una caja del deposito.',  deposito,          2115).
evidencia(caso1, e05, guante_latex,        'Guante de latex sin ADN utilizable hallado entre los setos.',      jardin,            2140).
evidencia(caso1, e06, nota_manuscrita,     'Nota con cifras y fechas de vencimiento de un prestamo.',          deposito,          2115).
evidencia(caso1, e07, llave_duplicada,     'Copia no autorizada de la llave de la vitrina, bajo un banco.',    sala_jade,         2135).
evidencia(caso1, e08, huella_calzado,      'Pisada de calzado de trabajo talla 37 en el polvo del deposito.',  deposito,          2117).
evidencia(caso1, e09, registro_telefonico, 'Llamada de 4 minutos entre dos telefonos internos antes del robo.', oficina_seguridad, 2050).
evidencia(caso1, e10, vitrina_forzada,     'Marcas de palanca en el cierre de la vitrina blindada.',           sala_jade,         2130).

vincula(caso1, e01, marco).
vincula(caso1, e02, marco).
vincula(caso1, e03, marco).
vincula(caso1, e07, marco).
vincula(caso1, e09, marco).
vincula(caso1, e09, tomas).
vincula(caso1, e04, elena).
vincula(caso1, e06, elena).
vincula(caso1, e08, elena).

evidencia_lugar_persona(caso1, e01, marco, sala_jade).
evidencia_lugar_persona(caso1, e02, marco, vestibulo).
evidencia_lugar_persona(caso1, e04, elena, deposito).
evidencia_lugar_persona(caso1, e08, elena, deposito).

% Declaraciones
declaracion(caso1, d1, marco,
	'Estuve toda la noche en la oficina de seguridad revisando los monitores. No pise el vestibulo despues de las nueve.').
afirma(caso1, d1, no_estuvo(marco, vestibulo, 2120)).
afirma(caso1, d1, estuvo(marco, oficina_seguridad, 2120)).

declaracion(caso1, d2, julio,
	'Yo lo vi: don Marco no se movio de la oficina de seguridad en toda la noche.').
afirma(caso1, d2, estuvo(marco, oficina_seguridad, 2120)).

declaracion(caso1, d3, nadia,
	'Cuando volvia del guardarropa me crucé con Marco en el vestibulo, iba deprisa hacia la Sala Jade.').
afirma(caso1, d3, vio(nadia, marco, vestibulo, 2120)).

declaracion(caso1, d4, elena,
	'Estuve en el deposito catalogando piezas. Rosa paso a dejarme el inventario y me vio ahi.').
afirma(caso1, d4, estuvo(elena, deposito, 2115)).

declaracion(caso1, d5, tomas,
	'Estuve en el jardin toda la gala. Y no tengo la menor idea de ningun registro telefonico.').
afirma(caso1, d5, estuvo(tomas, jardin, 2118)).
afirma(caso1, d5, desconoce(tomas, registro_telefonico)).

% Coartadas
coartada(caso1, marco, oficina_seguridad, 2120, julio).
coartada(caso1, elena, deposito,          2115, rosa).
coartada(caso1, nadia, vestibulo,         2110, tomas).
coartada(caso1, tomas, jardin,            2118, julio).

% Motivos
motivo(caso1, marco, laboral,
	'El Dr. Salazar habia iniciado su expediente de despido por negligencia en la custodia.').
motivo(caso1, elena, financiero,
	'Arrastra una deuda de tres prestamos vencidos con garantia sobre su vivienda.').
motivo(caso1, tomas, coleccionismo,
	'Lleva ocho anos intentando comprar el codice y el museo rechazo su ultima oferta.').

% Medios
requiere_medio(caso1, codigo_alarma).
requiere_medio(caso1, llave_vitrina).

medio(caso1, marco, codigo_alarma).
medio(caso1, marco, llave_vitrina).
medio(caso1, elena, llave_vitrina).
medio(caso1, tomas, codigo_alarma).

% Relaciones
relacion(caso1, marco, dr_salazar, despido).
relacion(caso1, elena, dr_salazar, laboral).
relacion(caso1, tomas, dr_salazar, rivalidad).
relacion(caso1, julio, marco,      subordinado).
relacion(caso1, marco, tomas,      negocios).
relacion(caso1, nadia, elena,      amistad).

% Reglas de inferencia propias del caso

regla_caso(caso1, c1_01, 'Personal interno',
	'Es personal del museo quien posee credencial o llave institucional.').
personal_interno(caso1, Persona) :-
	persona(caso1, Persona, _, _),
	once(( acceso(caso1, Persona, _, Tipo),
		pertenece(Tipo, [credencial_maestra, credencial_personal, credencial_guia,llave_restauracion, llave_mantenimiento]) )).

regla_caso(caso1, c1_02, 'Conoce el sistema de alarma',
	'Conoce la alarma quien tiene acceso a la oficina de seguridad.').
conoce_alarma(caso1, Persona) :-
	acceso(caso1, Persona, oficina_seguridad, _).

regla_caso(caso1, c1_03, 'Pudo desactivar la alarma',
	'Pudo desactivarla quien conoce el sistema y posee el codigo.').
pudo_desactivar_alarma(caso1, Persona) :-
	conoce_alarma(caso1, Persona),
	medio(caso1, Persona, codigo_alarma).

regla_caso(caso1, c1_04, 'Acceso a la vitrina',
	'Pudo abrir la vitrina quien entra a la Sala Jade y tiene la llave.').
acceso_a_vitrina(caso1, Persona) :-
	acceso(caso1, Persona, sala_jade, _),
	medio(caso1, Persona, llave_vitrina).

regla_caso(caso1, c1_05, 'Presente tras el cierre de sala',
	'Estuvo en el area interna despues de las 21:00, cuando la sala ya estaba cerrada al publico.').
presente_tras_cierre(caso1, Persona) :-
	estuvo_en(caso1, Persona, Lugar, Hora),
	Hora >= 2100,
	pertenece(Lugar, [sala_jade, deposito, oficina_seguridad]).

regla_caso(caso1, c1_06, 'Beneficio economico',
	'Obtendria beneficio economico directo del robo.').
beneficio_economico(caso1, Persona) :-
	motivo(caso1, Persona, Tipo, _),
	pertenece(Tipo, [financiero, coleccionismo]).

regla_caso(caso1, c1_07, 'Contacto con el comprador',
	'Mantiene relacion de negocios con el coleccionista interesado en la pieza.').
contacto_con_comprador(caso1, Persona) :-
	relacion_bi(caso1, Persona, tomas, negocios),
	Persona \= tomas.

regla_caso(caso1, c1_08, 'Rencor institucional',
	'Fue perjudicado por la victima en el ambito laboral.').
rencor_institucional(caso1, Persona) :-
	relacion(caso1, Persona, dr_salazar, despido).

regla_caso(caso1, c1_09, 'Patron de robo interno',
	'Combina conocimiento del sistema, acceso a la vitrina y presencia tras el cierre: el perfil del robo desde dentro.').
patron_robo_interno(caso1, Persona) :-
	persona(caso1, Persona, _, _),
	once(pudo_desactivar_alarma(caso1, Persona)),
	once(acceso_a_vitrina(caso1, Persona)),
	once(presente_tras_cierre(caso1, Persona)).

regla_caso(caso1, c1_10, 'Sospechoso prioritario del museo',
	'Encaja en el patron de robo interno y ademas tiene rencor contra la victima.').
sospechoso_prioritario(caso1, Persona) :-
	patron_robo_interno(caso1, Persona),
	rencor_institucional(caso1, Persona).
