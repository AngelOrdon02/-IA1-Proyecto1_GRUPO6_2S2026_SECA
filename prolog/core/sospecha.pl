% =============================================================================
% Logic Detective — Nivel de sospecha, complices y responsable
% -----------------------------------------------------------------------------
% Cubre los puntos 12 a 15 de las inferencias minimas:
%   - Nivel de sospecha de cada involucrado.
%   - Posibles complices.
%   - Principal sospechoso.
%   - Responsable logico del caso.
%
% IMPORTANTE: la acumulacion del puntaje se hace en Prolog, con findall/3 y
% recursion sobre listas. Sumarlo en Python violaria la restriccion del
% enunciado de que toda deduccion ocurra en el motor logico.
% =============================================================================

% ===========================================================================
% FACTORES DE SOSPECHA
% ---------------------------------------------------------------------------
% Cada factor aporta un peso. Un mismo factor nunca suma dos veces, aunque se
% pueda demostrar por varios caminos: primera_ocurrencia/2 lo garantiza.
% ===========================================================================

factor_sospecha(Caso, Persona, acceso, 10) :-
    tiene_acceso(Caso, Persona).

factor_sospecha(Caso, Persona, oportunidad, 20) :-
    tuvo_oportunidad(Caso, Persona).

factor_sospecha(Caso, Persona, motivo, 20) :-
    tiene_motivo(Caso, Persona).

factor_sospecha(Caso, Persona, motivo_derivado, 10) :-
    motivo_derivado(Caso, Persona, _).

factor_sospecha(Caso, Persona, medios, 15) :-
    tiene_medios(Caso, Persona).

% NEGACION POR FALLO: no poder demostrar una coartada valida es, en si mismo,
% un factor de sospecha.
factor_sospecha(Caso, Persona, sin_coartada_valida, 15) :-
    sospechoso(Caso, Persona),
    \+ coartada_valida(Caso, Persona).

factor_sospecha(Caso, Persona, informacion_falsa, 20) :-
    mintio(Caso, Persona).

% El peso crece con la cantidad de evidencias, con tope para que la evidencia
% fisica no domine por si sola la conclusion.
factor_sospecha(Caso, Persona, evidencia_fisica, Peso) :-
    sospechoso(Caso, Persona),
    total_evidencias(Caso, Persona, Cantidad),
    Cantidad > 0,
    Peso is min(Cantidad * 7, 21).

factor_sospecha(Caso, Persona, vinculo_con_victima, 5) :-
    sospechoso(Caso, Persona),
    victima(Caso, Victima),
    relacion_bi(Caso, Persona, Victima, _).

% ===========================================================================
% 12. NIVEL DE SOSPECHA
% ===========================================================================

% ---------------------------------------------------------------------------
% factores_de(+Caso, +Persona, -ListaDePares)
% Recoge los factores demostrables y elimina los repetidos por nombre.
% ---------------------------------------------------------------------------
factores_de(Caso, Persona, Factores) :-
    findall(Nombre-Peso, factor_sospecha(Caso, Persona, Nombre, Peso), Todos),
    msort(Todos, Ordenados),
    primera_ocurrencia(Ordenados, Factores).

% ---------------------------------------------------------------------------
% nivel_sospecha(+Caso, ?Persona, -Puntaje)
% El puntaje se obtiene sumando recursivamente los pesos de los factores.
% ---------------------------------------------------------------------------
nivel_sospecha(Caso, Persona, Puntaje) :-
    sospechoso(Caso, Persona),
    factores_de(Caso, Persona, Factores),
    valores_de(Factores, Pesos),
    suma_lista(Pesos, Puntaje).

% Clasificacion cualitativa. Los CORTES hacen que cada persona reciba una sola
% categoria: sin ellos, un puntaje de 90 satisfaria tambien "medio" y "bajo".
categoria_sospecha(Caso, Persona, muy_alto) :-
    nivel_sospecha(Caso, Persona, Puntaje),
    Puntaje >= 90, !.
categoria_sospecha(Caso, Persona, alto) :-
    nivel_sospecha(Caso, Persona, Puntaje),
    Puntaje >= 65, !.
categoria_sospecha(Caso, Persona, medio) :-
    nivel_sospecha(Caso, Persona, Puntaje),
    Puntaje >= 40, !.
categoria_sospecha(Caso, Persona, bajo) :-
    nivel_sospecha(Caso, Persona, _).

% Ranking completo de sospechosos, de mayor a menor puntaje.
ranking_sospecha(Caso, Ranking) :-
    findall(Persona-Puntaje, nivel_sospecha(Caso, Persona, Puntaje), Pares),
    ordenar_desc(Pares, Ranking).

% ===========================================================================
% 14. PRINCIPAL SOSPECHOSO
% ---------------------------------------------------------------------------
% El de mayor puntaje. El CORTE lo vuelve determinista: hay un unico principal
% sospechoso, no una solucion por cada camino de prueba.
% ===========================================================================

principal_sospechoso(Caso, Persona) :-
    findall(P-Puntaje, nivel_sospecha(Caso, P, Puntaje), Pares),
    Pares \= [],
    maximo_por_valor(Pares, Persona, _),
    !.

principal_sospechoso(Caso, Persona, Puntaje) :-
    findall(P-Pts, nivel_sospecha(Caso, P, Pts), Pares),
    Pares \= [],
    maximo_por_valor(Pares, Persona, Puntaje),
    !.

% ===========================================================================
% 13. POSIBLES COMPLICES
% ---------------------------------------------------------------------------
% Un complice no es quien cometio el hecho, sino quien lo hizo posible:
% encubrio con una coartada falsa, mintio en favor del principal sospechoso,
% o le facilito un medio necesario.
% ===========================================================================

posible_complice(Caso, Complice, encubrimiento_por_coartada) :-
    principal_sospechoso(Caso, Principal),
    coartada(Caso, Principal, _, _, Complice),
    Complice \= Principal,
    mintio(Caso, Complice).

posible_complice(Caso, Complice, testimonio_falso_en_favor) :-
    principal_sospechoso(Caso, Principal),
    Complice \= Principal,
    mintio(Caso, Complice),
    relacion_bi(Caso, Complice, Principal, _).

posible_complice(Caso, Complice, facilito_acceso) :-
    principal_sospechoso(Caso, Principal),
    Complice \= Principal,
    incidente(Caso, _, LugarIncidente, _),
    acceso(Caso, Complice, LugarIncidente, _),
    \+ acceso(Caso, Principal, LugarIncidente, _),
    relacion_bi(Caso, Complice, Principal, _).

complices(Caso, Lista) :-
    findall(Complice-Razon, posible_complice(Caso, Complice, Razon), Todos),
    sin_duplicados(Todos, Lista).

% ---------------------------------------------------------------------------
% red_complicidad(+Caso, +Persona, -Red)
% RECURSIVIDAD: a partir de una persona, recorre la cadena de complices de
% complices. La lista de visitados corta los ciclos.
% ---------------------------------------------------------------------------
red_complicidad(Caso, Persona, Red) :-
    expandir_red(Caso, [Persona], [Persona], Red).

expandir_red(_, [], Acumulada, Acumulada).
expandir_red(Caso, [Actual|Pendientes], Acumulada, Red) :-
    findall(Vecino,
            ( relacion_bi(Caso, Actual, Vecino, _),
              mintio(Caso, Vecino),
              no_pertenece(Vecino, Acumulada) ),
            Nuevos),
    sin_duplicados(Nuevos, NuevosUnicos),
    append(Pendientes, NuevosUnicos, PendientesActualizados),
    append(Acumulada, NuevosUnicos, AcumuladaActualizada),
    expandir_red(Caso, PendientesActualizados, AcumuladaActualizada, Red).

% ===========================================================================
% 15. RESPONSABLE LOGICO DEL CASO
% ---------------------------------------------------------------------------
% No basta con ser el mas sospechoso. Para declarar un responsable el motor
% exige que se sostengan simultaneamente los tres pilares clasicos
% (oportunidad, motivo y medios), que no exista coartada valida, y que no haya
% empate en el puntaje maximo: si dos sospechosos empatan, la deduccion es
% ambigua y el motor prefiere no concluir.
% ===========================================================================

cumple_pilares(Caso, Persona) :-
    tuvo_oportunidad(Caso, Persona),
    tiene_medios(Caso, Persona),
    ( tiene_motivo(Caso, Persona) ; motivo_derivado(Caso, Persona, _) ),
    \+ coartada_valida(Caso, Persona),
    !.

responsable(Caso, Persona) :-
    findall(P-Puntaje, nivel_sospecha(Caso, P, Puntaje), Pares),
    Pares \= [],
    maximo_por_valor(Pares, Persona, PuntajeMaximo),
    \+ hay_empate(Pares, PuntajeMaximo),
    cumple_pilares(Caso, Persona),
    !.

% Si no se puede concluir, se explica por que en vez de fallar en silencio.
conclusion(Caso, responsable(Persona, Puntaje)) :-
    responsable(Caso, Persona),
    nivel_sospecha(Caso, Persona, Puntaje),
    !.
conclusion(Caso, inconcluso(empate, Empatados)) :-
    findall(P-Puntaje, nivel_sospecha(Caso, P, Puntaje), Pares),
    maximo_por_valor(Pares, _, PuntajeMaximo),
    hay_empate(Pares, PuntajeMaximo),
    findall(P, pertenece(P-PuntajeMaximo, Pares), Empatados),
    !.
conclusion(Caso, inconcluso(pilares_incompletos, Persona)) :-
    principal_sospechoso(Caso, Persona),
    \+ cumple_pilares(Caso, Persona),
    !.
conclusion(_, inconcluso(sin_datos, [])).

% ===========================================================================
% DESCARTE DE INOCENTES
% ---------------------------------------------------------------------------
% Simetricamente, el motor explica por que cada sospechoso queda descartado.
% ===========================================================================

descartado(Caso, Persona, coartada_valida) :-
    sospechoso(Caso, Persona),
    coartada_valida(Caso, Persona).

descartado(Caso, Persona, sin_oportunidad) :-
    sospechoso(Caso, Persona),
    \+ tuvo_oportunidad(Caso, Persona).

descartado(Caso, Persona, sin_medios(Faltantes)) :-
    sospechoso(Caso, Persona),
    \+ tiene_medios(Caso, Persona),
    medios_faltantes(Caso, Persona, Faltantes).

descartado(Caso, Persona, sin_motivo) :-
    sospechoso(Caso, Persona),
    \+ tiene_motivo(Caso, Persona),
    \+ motivo_derivado(Caso, Persona, _).
