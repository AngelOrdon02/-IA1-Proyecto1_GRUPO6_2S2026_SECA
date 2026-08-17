% =============================================================================
% Logic Detective — Explicacion y trazabilidad del razonamiento
% -----------------------------------------------------------------------------
% Cubre el punto 16 de las inferencias minimas: explicar que reglas se usaron
% para llegar a la conclusion.
%
% El enunciado pide "justificar cada conclusion indicando las reglas activadas".
% Por eso cada regla del motor tiene aqui un identificador estable, un nombre
% legible y una plantilla de texto: la interfaz muestra la cadena deductiva
% completa, no solo el veredicto.
% =============================================================================

% ---------------------------------------------------------------------------
% catalogo_regla(?Id, ?Nombre, ?Descripcion)
% Registro de las reglas genericas del motor.
% ---------------------------------------------------------------------------
catalogo_regla(r01, 'Acceso al lugar',
    'Quien puede llegar al lugar del incidente desde un sitio al que tiene acceso autorizado.').
catalogo_regla(r02, 'Oportunidad',
    'Quien estuvo en el lugar del incidente, o en uno conectado, dentro de la ventana temporal.').
catalogo_regla(r03, 'Motivo declarado',
    'Quien tiene registrado un motivo explicito contra la victima.').
catalogo_regla(r04, 'Motivo derivado',
    'Quien mantiene una relacion conflictiva con la victima, aunque no se le haya registrado motivo.').
catalogo_regla(r05, 'Medios necesarios',
    'Quien posee todos los medios que el incidente requiere.').
catalogo_regla(r06, 'Coartada valida',
    'Coartada respaldada por un testigo no sospechoso y no refutada por evidencia.').
catalogo_regla(r07, 'Coartada invalida',
    'Coartada inexistente, sostenida por un sospechoso o un mentiroso, o refutada por evidencia fisica.').
catalogo_regla(r08, 'Contradiccion entre declaraciones',
    'Dos testimonios que no pueden ser ciertos a la vez.').
catalogo_regla(r09, 'Contradiccion con evidencia',
    'Un testimonio desmentido por una evidencia fisica. La evidencia prevalece.').
catalogo_regla(r10, 'Informacion falsa',
    'El autor de una declaracion desmentida por evidencia proporciono informacion falsa.').
catalogo_regla(r11, 'Evidencia vinculante',
    'Evidencias que apuntan directamente a un sospechoso.').
catalogo_regla(r12, 'Relacion relevante',
    'Vinculo entre sospechoso y victima, o entre dos sospechosos.').
catalogo_regla(r13, 'Nivel de sospecha',
    'Suma recursiva de los pesos de todos los factores demostrables.').
catalogo_regla(r14, 'Posible complice',
    'Quien encubrio, mintio en favor del principal sospechoso o le facilito acceso.').
catalogo_regla(r15, 'Principal sospechoso',
    'El sospechoso con el mayor nivel de sospecha.').
catalogo_regla(r16, 'Responsable logico',
    'Principal sospechoso sin empate que cumple oportunidad, motivo y medios, sin coartada valida.').

% ===========================================================================
% REGLAS ACTIVADAS POR PERSONA
% ---------------------------------------------------------------------------
% Cada clausula corresponde a una regla del motor que se pudo demostrar para
% esa persona. El tercer argumento lleva el dato concreto que la disparo.
% ===========================================================================

regla_activada(Caso, Persona, r01, acceso_por(Tipo)) :-
    via_de_acceso(Caso, Persona, Tipo).

regla_activada(Caso, Persona, r02, estuvo_en(Lugar, Hora)) :-
    detalle_oportunidad(Caso, Persona, Lugar, Hora).

regla_activada(Caso, Persona, r03, motivo(Tipo, Descripcion)) :-
    tiene_motivo(Caso, Persona, Tipo, Descripcion).

regla_activada(Caso, Persona, r04, motivo_derivado(Tipo)) :-
    motivo_derivado(Caso, Persona, Tipo).

regla_activada(Caso, Persona, r05, posee_medios) :-
    tiene_medios(Caso, Persona).

regla_activada(Caso, Persona, r06, coartada_sostenida) :-
    coartada_valida(Caso, Persona).

regla_activada(Caso, Persona, r07, Razon) :-
    coartada_invalida(Caso, Persona, Razon).

regla_activada(Caso, Persona, r09, Razon) :-
    declaracion(Caso, Decl, Persona, _),
    declaracion_contradice_evidencia(Caso, Decl, _, Razon).

regla_activada(Caso, Persona, r10, mintio) :-
    mintio(Caso, Persona).

regla_activada(Caso, Persona, r11, evidencia(Evidencia)) :-
    evidencia_de(Caso, Persona, Evidencia).

regla_activada(Caso, Persona, r12, relacion(Otra, Tipo)) :-
    relacion_relevante(Caso, Persona, Otra, Tipo).

regla_activada(Caso, Persona, r13, puntaje(Puntaje)) :-
    nivel_sospecha(Caso, Persona, Puntaje).

regla_activada(Caso, Persona, r14, complicidad(Razon)) :-
    posible_complice(Caso, Persona, Razon).

regla_activada(Caso, Persona, r15, principal) :-
    principal_sospechoso(Caso, Persona).

regla_activada(Caso, Persona, r16, responsable) :-
    responsable(Caso, Persona).

% ---------------------------------------------------------------------------
% explicacion(+Caso, +Persona, -Lista)
% Lista de reglas activadas para una persona, con su nombre legible.
% ---------------------------------------------------------------------------
explicacion(Caso, Persona, Lista) :-
    findall(regla(Id, Nombre, Detalle),
            ( regla_activada(Caso, Persona, Id, Detalle),
              catalogo_regla(Id, Nombre, _) ),
            Todas),
    sin_duplicados(Todas, SinRepetir),
    msort(SinRepetir, Lista).

% ---------------------------------------------------------------------------
% explicacion_conclusion(+Caso, -Explicacion)
% Justificacion de la conclusion global del caso.
% ---------------------------------------------------------------------------
explicacion_conclusion(Caso, explicacion(Conclusion, Reglas, Descartes)) :-
    conclusion(Caso, Conclusion),
    reglas_de_conclusion(Caso, Conclusion, Reglas),
    findall(descarte(Persona, Razon),
            ( descartado(Caso, Persona, Razon),
              \+ es_el_concluido(Conclusion, Persona) ),
            DescartesTodos),
    sin_duplicados(DescartesTodos, Descartes).

es_el_concluido(responsable(Persona, _), Persona).

reglas_de_conclusion(Caso, responsable(Persona, _), Reglas) :- !,
    explicacion(Caso, Persona, Reglas).
reglas_de_conclusion(Caso, inconcluso(pilares_incompletos, Persona), Reglas) :- !,
    explicacion(Caso, Persona, Reglas).
reglas_de_conclusion(_, _, []).

% ===========================================================================
% INFORME FINAL DEL CASO
% ---------------------------------------------------------------------------
% Exigido por el alcance obligatorio: "Generar un informe final del caso".
% Se construye integramente en Prolog; Python solo lo serializa.
% ===========================================================================

informe_final(Caso, informe(Titulo, Conclusion, Ranking, Complices,
                            ContradiccionesDecl, ContradiccionesEvid,
                            Mentirosos, Reglas)) :-
    caso(Caso, Titulo, _, _),
    conclusion(Caso, Conclusion),
    ranking_sospecha(Caso, Ranking),
    complices(Caso, Complices),
    contradicciones_declaraciones(Caso, ContradiccionesDecl),
    contradicciones_evidencia(Caso, ContradiccionesEvid),
    sospechosos_mentirosos(Caso, Mentirosos),
    reglas_de_conclusion(Caso, Conclusion, Reglas).

% ===========================================================================
% SISTEMA DE PISTAS
% ---------------------------------------------------------------------------
% Las pistas se entregan en orden creciente de revelacion, para no arruinar
% el caso de golpe. Python lleva el contador de pistas ya usadas.
% ===========================================================================

pista(Caso, 1, Texto) :-
    findall(P, (sospechoso(Caso, P), \+ coartada_valida(Caso, P)), Lista),
    longitud(Lista, N),
    format(atom(Texto),
           'Hay ~w sospechoso(s) cuya coartada no se sostiene. Revisa las coartadas.', [N]).

pista(Caso, 2, Texto) :-
    contradicciones_declaraciones(Caso, Lista),
    longitud(Lista, N),
    format(atom(Texto),
           'Se detectan ~w contradiccion(es) entre declaraciones. Vuelve a interrogar.', [N]).

pista(Caso, 3, Texto) :-
    sospechosos_mentirosos(Caso, Lista),
    longitud(Lista, N),
    format(atom(Texto),
           'La evidencia fisica desmiente a ~w sospechoso(s). La evidencia siempre gana al testimonio.', [N]).

pista(Caso, 4, Texto) :-
    findall(P, (sospechoso(Caso, P), tiene_medios(Caso, P)), Lista),
    longitud(Lista, N),
    format(atom(Texto),
           'Solo ~w sospechoso(s) contaba(n) con todos los medios necesarios.', [N]).

pista(Caso, 5, Texto) :-
    principal_sospechoso(Caso, Persona, Puntaje),
    nombre_de(Caso, Persona, Nombre),
    format(atom(Texto),
           'El nivel de sospecha mas alto es de ~w, con ~w puntos.', [Nombre, Puntaje]).
