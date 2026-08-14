% =============================================================================
% Logic Detective — Punto de entrada de la base de conocimiento
% -----------------------------------------------------------------------------
% Este es el unico archivo que Python necesita consultar. Carga el nucleo del
% motor y los tres casos de investigacion.
%
% Uso manual desde la terminal:
%     swipl prolog/logic_detective.pl
%     ?- responsable(caso1, Quien).
%     ?- ranking_sospecha(caso1, R).
%     ?- explicacion_conclusion(caso1, E).
% =============================================================================

:- set_prolog_flag(double_quotes, codes).

% --- Nucleo del motor (el orden importa: esquema primero) -------------------
:- ensure_loaded('core/esquema').
:- ensure_loaded('core/utils').
:- ensure_loaded('core/motor').
:- ensure_loaded('core/contradicciones').
:- ensure_loaded('core/sospecha').
:- ensure_loaded('core/explicacion').
:- ensure_loaded('core/vistas').
:- ensure_loaded('core/api_json').

% --- Casos de investigacion -------------------------------------------------
:- ensure_loaded('casos/caso1_museo').
:- ensure_loaded('casos/caso2_hospital').
:- ensure_loaded('casos/caso3_corporativo').

% ===========================================================================
% API DE CONSULTA PARA PYTHON
% ---------------------------------------------------------------------------
% Predicados de conveniencia que devuelven estructuras completas en una sola
% consulta, para minimizar el numero de llamadas desde el backend.
% ===========================================================================

% Listado de casos disponibles.
casos_disponibles(Lista) :-
    findall(caso(Id, Titulo, Descripcion, Dificultad),
            caso(Id, Titulo, Descripcion, Dificultad),
            Lista).

% Ficha completa de un caso (lo que se muestra al iniciar la investigacion).
ficha_caso(Caso, ficha(Titulo, Descripcion, Dificultad, Incidente, Lugar, Hora, Victima)) :-
    caso(Caso, Titulo, Descripcion, Dificultad),
    incidente(Caso, Incidente, Lugar, Hora),
    victima(Caso, Victima).

% Personas por rol.
personas_por_rol(Caso, Rol, Lista) :-
    findall(persona(Id, Nombre), persona(Caso, Id, Nombre, Rol), Lista).

% Analisis completo de un sospechoso: los cuatro pilares mas su puntaje.
analisis_sospechoso(Caso, Persona, analisis(Nombre, Acceso, Oportunidad, Motivo,
                                            Medios, Coartada, Puntaje, Categoria)) :-
    persona(Caso, Persona, Nombre, sospechoso),
    ( tiene_acceso(Caso, Persona)      -> Acceso = si      ; Acceso = no ),
    ( tuvo_oportunidad(Caso, Persona)  -> Oportunidad = si ; Oportunidad = no ),
    ( tiene_motivo(Caso, Persona)      -> Motivo = si      ; Motivo = no ),
    ( tiene_medios(Caso, Persona)      -> Medios = si      ; Medios = no ),
    ( coartada_valida(Caso, Persona)   -> Coartada = valida ; Coartada = invalida ),
    nivel_sospecha(Caso, Persona, Puntaje),
    categoria_sospecha(Caso, Persona, Categoria).

% Verificacion de una acusacion emitida por el usuario.
verificar_acusacion(Caso, Acusado, resultado(Veredicto, Real, Puntaje, Reglas)) :-
    conclusion(Caso, Conclusion),
    ( Conclusion = responsable(Real, _) -> true ; Real = ninguno ),
    ( Acusado == Real -> Veredicto = correcto ; Veredicto = incorrecto ),
    ( nivel_sospecha(Caso, Acusado, Puntaje) -> true ; Puntaje = 0 ),
    explicacion(Caso, Acusado, Reglas).

% ===========================================================================
% VALIDACION DE MINIMOS DEL ENUNCIADO
% ---------------------------------------------------------------------------
% Comprueba que cada caso cumpla: 4 sospechosos, 10 evidencias, 5 lugares,
% 5 declaraciones y 10 reglas propias. Lo usa la suite de pruebas.
% ===========================================================================

conteo_caso(Caso, conteo(Sospechosos, Evidencias, Lugares, Declaraciones, Reglas)) :-
    findall(P, persona(Caso, P, _, sospechoso), ListaS), longitud(ListaS, Sospechosos),
    findall(E, evidencia(Caso, E, _, _, _, _), ListaE), longitud(ListaE, Evidencias),
    findall(L, lugar(Caso, L, _, _), ListaL), longitud(ListaL, Lugares),
    findall(D, declaracion(Caso, D, _, _), ListaD), longitud(ListaD, Declaraciones),
    findall(R, regla_caso(Caso, R, _, _), ListaR), longitud(ListaR, Reglas).

cumple_minimos(Caso) :-
    conteo_caso(Caso, conteo(S, E, L, D, R)),
    S >= 4, E >= 10, L >= 5, D >= 5, R >= 10.
