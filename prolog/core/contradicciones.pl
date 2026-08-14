% =============================================================================
% Logic Detective — Deteccion de contradicciones e informacion falsa
% -----------------------------------------------------------------------------
% Cubre los puntos 7, 8 y 9 de las inferencias minimas:
%   - Declaraciones que contradicen otras declaraciones.
%   - Declaraciones que contradicen una evidencia.
%   - Sospechosos que proporcionaron informacion falsa.
%
% Criterio de arbitraje: la evidencia fisica gana sobre el testimonio. Cuando
% una declaracion choca con una evidencia, es la declaracion la que se marca
% como falsa, nunca la evidencia.
% =============================================================================

% ===========================================================================
% 7. CONTRADICCIONES ENTRE DECLARACIONES
% ---------------------------------------------------------------------------
% El filtro Decl1 @< Decl2 usa el orden estandar de terminos para reportar
% cada par una sola vez, en lugar de reportar (A,B) y (B,A) por separado.
% ===========================================================================

% --- Tipo 1: negacion directa -------------------------------------------
declaraciones_contradictorias(Caso, Decl1, Decl2, negacion_directa(Persona, Lugar, Hora)) :-
    afirma(Caso, Decl1, estuvo(Persona, Lugar, Hora)),
    afirma(Caso, Decl2, no_estuvo(Persona, Lugar, Hora)),
    Decl1 \= Decl2.

% --- Tipo 2: la misma persona en dos lugares a la misma hora -------------
declaraciones_contradictorias(Caso, Decl1, Decl2, ubicuidad(Persona, Lugar1, Lugar2, Hora1)) :-
    afirma(Caso, Decl1, estuvo(Persona, Lugar1, Hora1)),
    afirma(Caso, Decl2, estuvo(Persona, Lugar2, Hora2)),
    Decl1 @< Decl2,
    Lugar1 \= Lugar2,
    margen_temporal(Margen),
    intervalo_solapa(Hora1, Hora2, Margen).

% --- Tipo 3: alguien afirma haber visto a quien dice no haber estado -----
declaraciones_contradictorias(Caso, Decl1, Decl2, testimonio_cruzado(Observador, Observado, Lugar)) :-
    afirma(Caso, Decl1, vio(Observador, Observado, Lugar, Hora1)),
    afirma(Caso, Decl2, no_estuvo(Observado, Lugar, Hora2)),
    margen_temporal(Margen),
    intervalo_solapa(Hora1, Hora2, Margen).

% --- Tipo 4: alguien fue visto en un lugar pero declara estar en otro ----
declaraciones_contradictorias(Caso, Decl1, Decl2, avistamiento_incompatible(Observado, LugarVisto, LugarDeclarado)) :-
    afirma(Caso, Decl1, vio(_, Observado, LugarVisto, Hora1)),
    afirma(Caso, Decl2, estuvo(Observado, LugarDeclarado, Hora2)),
    LugarVisto \= LugarDeclarado,
    margen_temporal(Margen),
    intervalo_solapa(Hora1, Hora2, Margen).

% Lista consolidada, sin pares repetidos.
contradicciones_declaraciones(Caso, Lista) :-
    findall(contradiccion(D1, D2, Razon),
            declaraciones_contradictorias(Caso, D1, D2, Razon),
            Todas),
    sin_duplicados(Todas, Lista).

% ===========================================================================
% 8. CONTRADICCIONES ENTRE DECLARACION Y EVIDENCIA
% ===========================================================================

% --- Tipo 1: niega haber estado donde la evidencia lo situa --------------
declaracion_contradice_evidencia(Caso, Decl, Evidencia, negado_por_evidencia_fisica(Persona, Lugar)) :-
    afirma(Caso, Decl, no_estuvo(Persona, Lugar, HoraDeclarada)),
    evidencia_lugar_persona(Caso, Evidencia, Persona, Lugar),
    evidencia(Caso, Evidencia, _, _, _, HoraEvidencia),
    margen_temporal(Margen),
    intervalo_solapa(HoraDeclarada, HoraEvidencia, Margen).

% --- Tipo 2: dice haber estado en X pero la evidencia lo situa en Y ------
declaracion_contradice_evidencia(Caso, Decl, Evidencia, ubicacion_desmentida(Persona, LugarDeclarado, LugarReal)) :-
    afirma(Caso, Decl, estuvo(Persona, LugarDeclarado, HoraDeclarada)),
    evidencia_lugar_persona(Caso, Evidencia, Persona, LugarReal),
    LugarReal \= LugarDeclarado,
    evidencia(Caso, Evidencia, _, _, _, HoraEvidencia),
    margen_temporal(Margen),
    intervalo_solapa(HoraDeclarada, HoraEvidencia, Margen).

% --- Tipo 3: dice desconocer un objeto que la evidencia le atribuye ------
declaracion_contradice_evidencia(Caso, Decl, Evidencia, desconocimiento_falso(Persona, Objeto)) :-
    afirma(Caso, Decl, desconoce(Persona, Objeto)),
    evidencia(Caso, Evidencia, Objeto, _, _, _),
    vincula(Caso, Evidencia, Persona).

contradicciones_evidencia(Caso, Lista) :-
    findall(contradiccion(Decl, Evidencia, Razon),
            declaracion_contradice_evidencia(Caso, Decl, Evidencia, Razon),
            Todas),
    sin_duplicados(Todas, Lista).

% ===========================================================================
% 9. INFORMACION FALSA
% ---------------------------------------------------------------------------
% Una persona proporciono informacion falsa si es autora de una declaracion
% desmentida por una evidencia fisica.
% ===========================================================================

informacion_falsa(Caso, Persona, mentira(Decl, Evidencia, Razon)) :-
    declaracion(Caso, Decl, Persona, _),
    declaracion_contradice_evidencia(Caso, Decl, Evidencia, Razon).

% Version booleana de conveniencia. El CORTE la vuelve semi-determinista:
% interesa saber si mintio, no cuantas veces.
mintio(Caso, Persona) :-
    informacion_falsa(Caso, Persona, _),
    !.

% Sospechosos que mintieron, sin repetidos.
sospechosos_mentirosos(Caso, Lista) :-
    findall(Persona,
            (sospechoso(Caso, Persona), mintio(Caso, Persona)),
            Todos),
    sin_duplicados(Todos, Lista).

% ===========================================================================
% CONTRADICCIONES VISIBLES PARA EL USUARIO
% ---------------------------------------------------------------------------
% El modulo de investigacion revela la informacion de forma progresiva: el
% detective solo puede detectar contradicciones entre lo que YA descubrio.
% Python pasa la lista de declaraciones y evidencias ya reveladas y el filtrado
% ocurre aqui, en Prolog, por recursion sobre esas listas.
% ===========================================================================

contradicciones_visibles(Caso, DeclConocidas, EvidConocidas, Visibles) :-
    contradicciones_declaraciones(Caso, EntreDecl),
    filtrar_decl_decl(EntreDecl, DeclConocidas, VisiblesDecl),
    contradicciones_evidencia(Caso, ConEvidencia),
    filtrar_decl_evid(ConEvidencia, DeclConocidas, EvidConocidas, VisiblesEvid),
    append(VisiblesDecl, VisiblesEvid, Visibles).

% RECURSIVIDAD sobre la lista de contradicciones, conservando solo aquellas
% cuyos dos extremos ya fueron descubiertos por el usuario.
filtrar_decl_decl([], _, []).
filtrar_decl_decl([contradiccion(D1, D2, R)|Resto], Conocidas,
                  [contradiccion(D1, D2, R)|Filtradas]) :-
    pertenece(D1, Conocidas),
    pertenece(D2, Conocidas),
    !,
    filtrar_decl_decl(Resto, Conocidas, Filtradas).
filtrar_decl_decl([_|Resto], Conocidas, Filtradas) :-
    filtrar_decl_decl(Resto, Conocidas, Filtradas).

filtrar_decl_evid([], _, _, []).
filtrar_decl_evid([contradiccion(D, E, R)|Resto], DeclConocidas, EvidConocidas,
                  [contradiccion(D, E, R)|Filtradas]) :-
    pertenece(D, DeclConocidas),
    pertenece(E, EvidConocidas),
    !,
    filtrar_decl_evid(Resto, DeclConocidas, EvidConocidas, Filtradas).
filtrar_decl_evid([_|Resto], DeclConocidas, EvidConocidas, Filtradas) :-
    filtrar_decl_evid(Resto, DeclConocidas, EvidConocidas, Filtradas).
