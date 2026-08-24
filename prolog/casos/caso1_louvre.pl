% =============================================================================
% CASO 1 — "La Sonrisa Robada"
% El robo de la Gioconda. Museo del Louvre, Paris, lunes 21 de agosto de 1911.
% Dificultad: facil.
% -----------------------------------------------------------------------------
% Inspirado en el robo real de la Mona Lisa: Vincenzo Peruggia, un vidriero
% italiano que habia instalado el cristal protector del cuadro, entro un lunes
% de cierre vestido con la bata blanca de los operarios, descolgo la tabla,
% abandono el marco en la escalera Visconti y salio con la Gioconda bajo el
% brazo. Firmaba "Leonardo" y aseguraba que la obra debia volver a Italia.
%
% Cumple los minimos del enunciado:
%   4 sospechosos · 10 evidencias · 5 lugares · 5 declaraciones · 10 reglas
%
% Diseno de la solucion: cada inocente se descarta por una razon DISTINTA,
% para que el jugador aprenda a usar los cuatro pilares.
%   - pieret     -> descartado por coartada valida (robo estatuillas, no la Gioconda)
%   - paupardin  -> descartado por falta de motivo y de medios
%   - valfierno  -> descartado por falta de oportunidad y de acceso
%   - peruggia   -> RESPONSABLE: acceso + oportunidad + motivo + medios,
%                   miente y su coartada queda refutada por la evidencia.
%   - lancelotti -> complice: encubre a Peruggia con un testimonio falso.
% =============================================================================

caso(caso1,
     'La Sonrisa Robada',
     'Paris, lunes 21 de agosto de 1911. El Louvre esta cerrado al publico y la Gioconda ha desaparecido del muro del Salon Carre entre las 07:00 y las 07:45. Nadie forzo ninguna puerta: quien se la llevo conocia el museo por dentro y vestia como uno mas del personal.',
     facil).

incidente(caso1, 'Robo de la Gioconda del muro del Salon Carre', salon_carre, 730).
ventana_incidente(caso1, 700, 745).
victima(caso1, homolle).
solucion(caso1, peruggia).

% ---------------------------------------------------------------------------
% PERSONAS  (4 sospechosos + 2 testigos + 1 victima)
% ---------------------------------------------------------------------------
persona(caso1, homolle,    'Theophile Homolle, director del Louvre', victima).
persona(caso1, peruggia,   'Vincenzo Peruggia',                      sospechoso).
persona(caso1, pieret,     'Gery Pieret',                            sospechoso).
persona(caso1, paupardin,  'Maximilien Paupardin',                   sospechoso).
persona(caso1, valfierno,  'Marques Eduardo de Valfierno',           sospechoso).
persona(caso1, beroud,     'Louis Beroud',                           testigo).
persona(caso1, lancelotti, 'Vincenzo Lancelotti',                    testigo).

% ---------------------------------------------------------------------------
% LUGARES  (5)
% ---------------------------------------------------------------------------
lugar(caso1, salon_carre,        'Salon Carre',           'La sala donde cuelga la Gioconda entre un Correggio y un Tiziano.').
lugar(caso1, gran_galeria,       'Gran Galeria',          'El corredor monumental que atraviesa el museo de punta a punta.').
lugar(caso1, cuarto_vidrieros,   'Cuarto de Vidrieros',   'El cuartito de la contrata que fabrico las vitrinas protectoras.').
lugar(caso1, almacen_esculturas, 'Almacen de Esculturas', 'Deposito de piezas menores; alli se guardan las estatuillas ibericas.').
lugar(caso1, cour_carree,        'Cour Carree',           'El patio interior por el que entra y sale el personal en dia de cierre.').

conexion(caso1, gran_galeria,       salon_carre).
conexion(caso1, gran_galeria,       cuarto_vidrieros).
conexion(caso1, gran_galeria,       cour_carree).
conexion(caso1, salon_carre,        almacen_esculturas).
conexion(caso1, almacen_esculturas, cuarto_vidrieros).

% ---------------------------------------------------------------------------
% ACCESOS
% Peruggia trabajo en la contrata de vidrieria: su bata abre todas las puertas
% sin levantar una ceja. Pieret solo llega al almacen. Paupardin vigila las
% salas. Valfierno es un visitante distinguido sin permisos internos.
% ---------------------------------------------------------------------------
acceso(caso1, peruggia, gran_galeria,       contrata_vidrieria).
acceso(caso1, peruggia, cuarto_vidrieros,   contrata_vidrieria).
acceso(caso1, peruggia, salon_carre,        contrata_vidrieria).
acceso(caso1, peruggia, almacen_esculturas, contrata_vidrieria).
acceso(caso1, peruggia, cour_carree,        contrata_vidrieria).

acceso(caso1, pieret, almacen_esculturas, llave_almacen).
acceso(caso1, pieret, gran_galeria,       permiso_copista).
acceso(caso1, pieret, cour_carree,        acceso_publico).

acceso(caso1, paupardin, gran_galeria, uniforme_guardia).
acceso(caso1, paupardin, salon_carre,  uniforme_guardia).
acceso(caso1, paupardin, cour_carree,  acceso_publico).

acceso(caso1, valfierno, gran_galeria, pase_de_visita).
acceso(caso1, valfierno, cour_carree,  acceso_publico).

acceso(caso1, beroud,     gran_galeria,       permiso_copista).
acceso(caso1, lancelotti, gran_galeria,       contrata_vidrieria).
acceso(caso1, lancelotti, almacen_esculturas, llave_mantenimiento).

% ---------------------------------------------------------------------------
% LINEA TEMPORAL — ubicaciones reales
% ---------------------------------------------------------------------------
estuvo_en(caso1, peruggia,   cuarto_vidrieros,   705).
estuvo_en(caso1, peruggia,   gran_galeria,       720).
estuvo_en(caso1, pieret,     almacen_esculturas, 715).
estuvo_en(caso1, paupardin,  gran_galeria,       710).
estuvo_en(caso1, valfierno,  cour_carree,        718).
estuvo_en(caso1, beroud,     gran_galeria,       700).
estuvo_en(caso1, lancelotti, almacen_esculturas, 735).

evento(caso1, ev1, 650, cuarto_vidrieros, 'Un recadero entrega un telegrama de Florencia dirigido a "Leonardo".').
evento(caso1, ev2, 700, cour_carree,      'Abre la jornada de limpieza: el museo permanece cerrado al publico por ser lunes.').
evento(caso1, ev3, 705, cuarto_vidrieros, 'Alguien descuelga la bata blanca de repuesto de la contrata de vidrieria.').
evento(caso1, ev4, 722, gran_galeria,     'El plomero Sauvet abre la escalera a un obrero de bata blanca que carga un bulto.').
evento(caso1, ev5, 730, salon_carre,      'Cuatro escarpias vacias: la Gioconda ya no cuelga del muro del Salon Carre.').
evento(caso1, ev6, 740, cour_carree,      'Aparece una bata blanca de obrero abandonada junto a la escalinata del patio.').
evento(caso1, ev7, 745, salon_carre,      'Louis Beroud llega a copiar el cuadro y da la voz de alarma ante el muro desnudo.').

% ---------------------------------------------------------------------------
% EVIDENCIAS  (10)
% ---------------------------------------------------------------------------
evidencia(caso1, e01, huella_digital,     'Huella de un pulgar izquierdo en el cristal de la vitrina, abandonado junto al muro.',       salon_carre,        730).
evidencia(caso1, e02, testimonio_plomero, 'El plomero Sauvet declara haber abierto la puerta a un obrero de bata blanca con un bulto.', gran_galeria,       722).
evidencia(caso1, e03, planilla_contrata,  'Planilla de la contrata: Peruggia instalo el cristal protector de la Gioconda en 1910.',     cuarto_vidrieros,   705).
evidencia(caso1, e04, fibra_textil,       'Hebra de pana adherida a la caja de las estatuillas ibericas del almacen.',                  almacen_esculturas, 715).
evidencia(caso1, e05, bata_abandonada,    'Bata blanca de obrero sin marcas, abandonada junto a la escalinata del patio.',              cour_carree,        740).
evidencia(caso1, e06, recorte_prensa,     'Recorte de Paris-Journal que paga por antiguedades "sin preguntas", con precios anotados.',  almacen_esculturas, 715).
evidencia(caso1, e07, pomo_arrancado,     'El pomo de la puerta de la escalera, arrancado con un destornillador de vidriero.',          salon_carre,        735).
evidencia(caso1, e08, huella_calzado,     'Pisada de bota con clavos, talla pequena, en el polvo del almacen.',                         almacen_esculturas, 717).
evidencia(caso1, e09, telegrama,          'Telegrama de Florencia firmado "Leonardo" que pregunta cuando viaja "la senora".',           cuarto_vidrieros,   650).
evidencia(caso1, e10, marco_vacio,        'El marco y las cuatro escarpias de la Gioconda, hallados en la escalera Visconti.',          salon_carre,        730).

% Evidencias que apuntan a una persona
vincula(caso1, e01, peruggia).
vincula(caso1, e02, peruggia).
vincula(caso1, e03, peruggia).
vincula(caso1, e07, peruggia).
vincula(caso1, e09, peruggia).
vincula(caso1, e09, valfierno).
vincula(caso1, e04, pieret).
vincula(caso1, e06, pieret).
vincula(caso1, e08, pieret).

% Evidencias que situan fisicamente a alguien en un lugar
evidencia_lugar_persona(caso1, e01, peruggia, salon_carre).
evidencia_lugar_persona(caso1, e02, peruggia, gran_galeria).
evidencia_lugar_persona(caso1, e04, pieret,   almacen_esculturas).
evidencia_lugar_persona(caso1, e08, pieret,   almacen_esculturas).

% ---------------------------------------------------------------------------
% DECLARACIONES  (5)
% ---------------------------------------------------------------------------
declaracion(caso1, d1, peruggia,
    'Pase la manana entera en el cuarto de vidrieros reparando marcos. No pise la Gran Galeria en toda la manana.').
afirma(caso1, d1, no_estuvo(peruggia, gran_galeria, 720)).
afirma(caso1, d1, estuvo(peruggia, cuarto_vidrieros, 720)).

declaracion(caso1, d2, lancelotti,
    'Vincenzo no se movio del cuarto de vidrieros. Estuvimos juntos toda la manana, lo juro por mi madre.').
afirma(caso1, d2, estuvo(peruggia, cuarto_vidrieros, 720)).

declaracion(caso1, d3, paupardin,
    'En mi ronda vi a Peruggia cruzando la Gran Galeria con un bulto envuelto. Iba deprisa hacia el Salon Carre.').
afirma(caso1, d3, vio(paupardin, peruggia, gran_galeria, 720)).

declaracion(caso1, d4, pieret,
    'Estuve en el almacen catalogando piezas para un articulo. El senor Beroud paso con sus pinceles y me vio ahi.').
afirma(caso1, d4, estuvo(pieret, almacen_esculturas, 715)).

declaracion(caso1, d5, valfierno,
    'Paseaba por la Cour Carree esperando mi coche. Y no tengo la menor idea de ningun telegrama de Florencia.').
afirma(caso1, d5, estuvo(valfierno, cour_carree, 718)).
afirma(caso1, d5, desconoce(valfierno, telegrama)).

% ---------------------------------------------------------------------------
% COARTADAS
% ---------------------------------------------------------------------------
coartada(caso1, peruggia,  cuarto_vidrieros,   720, lancelotti). % lancelotti miente -> invalida
coartada(caso1, pieret,    almacen_esculturas, 715, beroud).     % beroud es fiable -> valida
coartada(caso1, paupardin, gran_galeria,       710, valfierno).  % valfierno es sospechoso -> invalida
coartada(caso1, valfierno, cour_carree,        718, lancelotti). % lancelotti miente -> invalida

% ---------------------------------------------------------------------------
% MOTIVOS
% ---------------------------------------------------------------------------
motivo(caso1, peruggia, nacionalismo,
    'Sostiene que Napoleon robo la Gioconda a Italia y que su deber es devolverla a Florencia. El museo, ademas, lo despidio al acabar la contrata y el personal lo humillaba llamandolo "macaroni".').
motivo(caso1, pieret, financiero,
    'Vive de revender piezas sustraidas del propio Louvre; debe dos meses de alquiler y Paris-Journal paga bien los escandalos.').
motivo(caso1, valfierno, coleccionismo,
    'Ya encargo seis copias perfectas de la Gioconda a un falsificador: solo necesita que el original desaparezca para venderlas todas como autenticas.').

% ---------------------------------------------------------------------------
% MEDIOS
% El robo exigia saber desmontar la vitrina protectora Y vestir la bata blanca
% que vuelve invisible a un obrero en dia de cierre.
% ---------------------------------------------------------------------------
requiere_medio(caso1, conocimiento_vitrina).
requiere_medio(caso1, bata_de_obrero).

medio(caso1, peruggia,  conocimiento_vitrina).
medio(caso1, peruggia,  bata_de_obrero).
medio(caso1, pieret,    bata_de_obrero).
medio(caso1, valfierno, conocimiento_vitrina).

% ---------------------------------------------------------------------------
% RELACIONES
% ---------------------------------------------------------------------------
relacion(caso1, peruggia,   homolle,   despido).
relacion(caso1, pieret,     homolle,   laboral).
relacion(caso1, valfierno,  homolle,   rivalidad).
relacion(caso1, lancelotti, peruggia,  subordinado).
relacion(caso1, peruggia,   valfierno, negocios).
relacion(caso1, paupardin,  pieret,    amistad).

% =============================================================================
% REGLAS DE INFERENCIA PROPIAS DEL CASO 1  (10)
% -----------------------------------------------------------------------------
% Reglas especializadas que solo tienen sentido en el contexto de este caso.
% Se suman a las reglas genericas del motor.
% =============================================================================

regla_caso(caso1, c1_01, 'Trabajo dentro del Louvre',
    'Pertenece a la casa quien porta credencial, uniforme o llave institucional.').
personal_del_louvre(caso1, Persona) :-
    persona(caso1, Persona, _, _),
    once(( acceso(caso1, Persona, _, Tipo),
           pertenece(Tipo, [contrata_vidrieria, permiso_copista, uniforme_guardia,
                            llave_almacen, llave_mantenimiento]) )).

regla_caso(caso1, c1_02, 'Conoce el montaje de la vitrina',
    'Conoce la vitrina protectora quien frecuenta el cuarto de los vidrieros.').
conoce_vitrina(caso1, Persona) :-
    acceso(caso1, Persona, cuarto_vidrieros, _).

regla_caso(caso1, c1_03, 'Pudo desmontar el cristal',
    'Pudo desmontar la vitrina quien conoce su montaje y sabe como se arma.').
pudo_desmontar_cristal(caso1, Persona) :-
    conoce_vitrina(caso1, Persona),
    medio(caso1, Persona, conocimiento_vitrina).

regla_caso(caso1, c1_04, 'Pudo descolgar el cuadro',
    'Pudo llegar al muro quien entra al Salon Carre y viste la bata de obrero que no levanta sospechas.').
pudo_descolgar_cuadro(caso1, Persona) :-
    acceso(caso1, Persona, salon_carre, _),
    medio(caso1, Persona, bata_de_obrero).

regla_caso(caso1, c1_05, 'Presente en dia de cierre',
    'Estuvo en las areas internas un lunes, cuando el museo no admite publico.').
presente_en_cierre(caso1, Persona) :-
    estuvo_en(caso1, Persona, Lugar, Hora),
    Hora >= 700,
    pertenece(Lugar, [salon_carre, almacen_esculturas, cuarto_vidrieros]).

regla_caso(caso1, c1_06, 'Beneficio del robo',
    'Obtendria un beneficio economico directo de la desaparicion del cuadro.').
beneficio_del_robo(caso1, Persona) :-
    motivo(caso1, Persona, Tipo, _),
    pertenece(Tipo, [financiero, coleccionismo]).

regla_caso(caso1, c1_07, 'Contacto con el marques',
    'Mantiene tratos de negocios con el marques que encargo las seis copias falsas.').
contacto_con_marques(caso1, Persona) :-
    relacion_bi(caso1, Persona, valfierno, negocios),
    Persona \= valfierno.

regla_caso(caso1, c1_08, 'Rencor contra el Louvre',
    'Fue despedido o humillado por la administracion del museo.').
rencor_contra_louvre(caso1, Persona) :-
    relacion(caso1, Persona, homolle, despido).

regla_caso(caso1, c1_09, 'Patron del robo desde dentro',
    'Combina saber desmontar la vitrina, poder descolgar el cuadro y presencia en dia de cierre: el perfil exacto del ladron interno.').
% El generador va primero y las comprobaciones dentro de once/1. Un corte al
% final seria un CORTE ROJO: con Persona sin ligar se comprometeria con el
% primer candidato que descuelga el cuadro y descartaria a los demas, aunque
% ese primero no cumpliera el resto de condiciones.
patron_robo_interno(caso1, Persona) :-
    persona(caso1, Persona, _, _),
    once(pudo_desmontar_cristal(caso1, Persona)),
    once(pudo_descolgar_cuadro(caso1, Persona)),
    once(presente_en_cierre(caso1, Persona)).

regla_caso(caso1, c1_10, 'Sospechoso prioritario del Louvre',
    'Encaja en el patron del robo desde dentro y ademas guarda rencor contra el museo.').
sospechoso_prioritario(caso1, Persona) :-
    patron_robo_interno(caso1, Persona),
    rencor_contra_louvre(caso1, Persona).
