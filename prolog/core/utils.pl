% =============================================================================
% Logic Detective — Utilidades de listas y recursividad
% -----------------------------------------------------------------------------
% Este archivo concentra los predicados RECURSIVOS sobre LISTAS del proyecto.
% Se implementan a mano (en vez de usar los builtins de SWI) porque el
% enunciado exige uso comprobable de listas y recursividad.
%
% Constructos demostrados aqui: LISTAS, RECURSIVIDAD, UNIFICACION,
% NEGACION (\+) y CORTES (!).
% =============================================================================

% ---------------------------------------------------------------------------
% pertenece(?Elemento, ?Lista)
% Recursion clasica sobre listas. El caso base unifica la cabeza; el caso
% recursivo descarta la cabeza y sigue con la cola.
% ---------------------------------------------------------------------------
pertenece(X, [X|_]).
pertenece(X, [_|Resto]) :-
    pertenece(X, Resto).

% ---------------------------------------------------------------------------
% no_pertenece(+Elemento, +Lista)
% NEGACION POR FALLO: no_pertenece/2 tiene exito cuando Prolog no logra
% demostrar pertenece/2. No afirma que el elemento no exista en el mundo,
% solo que no puede deducirse de la base de conocimiento.
% ---------------------------------------------------------------------------
no_pertenece(X, Lista) :-
    \+ pertenece(X, Lista).

% ---------------------------------------------------------------------------
% longitud(+Lista, -N)
% Recursion con construccion del resultado en el retorno.
% ---------------------------------------------------------------------------
longitud([], 0).
longitud([_|Resto], N) :-
    longitud(Resto, N0),
    N is N0 + 1.

% ---------------------------------------------------------------------------
% suma_lista(+ListaDeNumeros, -Total)
% Recursion con acumulador. suma_lista/3 es la version con estado.
% ---------------------------------------------------------------------------
suma_lista(Lista, Total) :-
    suma_lista(Lista, 0, Total).

suma_lista([], Acumulado, Acumulado).
suma_lista([N|Resto], Acumulado, Total) :-
    Acumulado1 is Acumulado + N,
    suma_lista(Resto, Acumulado1, Total).

% ---------------------------------------------------------------------------
% sin_duplicados(+Lista, -ListaSinRepetidos)
% Recursion + negacion. El CORTE del primer caso recursivo evita que, al
% reevaluar, se produzca tambien la solucion "conservando el duplicado".
% ---------------------------------------------------------------------------
sin_duplicados([], []).
sin_duplicados([X|Resto], Limpia) :-
    pertenece(X, Resto), !,
    sin_duplicados(Resto, Limpia).
sin_duplicados([X|Resto], [X|Limpia]) :-
    sin_duplicados(Resto, Limpia).

% ---------------------------------------------------------------------------
% claves_de(+ListaDePares, -ListaDeClaves)
% Transforma [clave-valor, ...] en [clave, ...].
% ---------------------------------------------------------------------------
claves_de([], []).
claves_de([Clave-_|Resto], [Clave|Claves]) :-
    claves_de(Resto, Claves).

% ---------------------------------------------------------------------------
% valores_de(+ListaDePares, -ListaDeValores)
% ---------------------------------------------------------------------------
valores_de([], []).
valores_de([_-Valor|Resto], [Valor|Valores]) :-
    valores_de(Resto, Valores).

% ---------------------------------------------------------------------------
% primera_ocurrencia(+ListaDePares, -ParesSinClaveRepetida)
% Conserva solo el primer par de cada clave. Se usa para que un sospechoso
% con tres motivos distintos no sume tres veces el mismo factor de sospecha.
% Recursion + negacion + corte.
% ---------------------------------------------------------------------------
primera_ocurrencia([], []).
primera_ocurrencia([Clave-Valor|Resto], [Clave-Valor|Filtrados]) :-
    eliminar_clave(Clave, Resto, Limpio),
    primera_ocurrencia(Limpio, Filtrados).

eliminar_clave(_, [], []).
eliminar_clave(Clave, [Clave-_|Resto], Limpio) :- !,
    eliminar_clave(Clave, Resto, Limpio).
eliminar_clave(Clave, [Otra-Valor|Resto], [Otra-Valor|Limpio]) :-
    eliminar_clave(Clave, Resto, Limpio).

% ---------------------------------------------------------------------------
% maximo_por_valor(+ListaDePares, -ClaveGanadora, -ValorMaximo)
% Recursion con acumulador para quedarse con el par de mayor valor.
% El CORTE en cada rama impide que se generen soluciones alternativas
% con un maximo "peor".
% ---------------------------------------------------------------------------
maximo_por_valor([Clave-Valor|Resto], ClaveMax, ValorMax) :-
    maximo_por_valor(Resto, Clave, Valor, ClaveMax, ValorMax).

maximo_por_valor([], Clave, Valor, Clave, Valor).
maximo_por_valor([_-Valor|Resto], ClaveMejor, ValorMejor, ClaveMax, ValorMax) :-
    Valor =< ValorMejor, !,
    maximo_por_valor(Resto, ClaveMejor, ValorMejor, ClaveMax, ValorMax).
maximo_por_valor([Clave-Valor|Resto], _, _, ClaveMax, ValorMax) :-
    maximo_por_valor(Resto, Clave, Valor, ClaveMax, ValorMax).

% ---------------------------------------------------------------------------
% hay_empate(+ListaDePares, +ValorMaximo)
% Verdadero si dos claves distintas comparten el valor maximo. Se usa para
% no declarar un responsable cuando la deduccion es ambigua.
% ---------------------------------------------------------------------------
hay_empate(Pares, ValorMax) :-
    findall(Clave, pertenece(Clave-ValorMax, Pares), Empatados),
    sin_duplicados(Empatados, Unicos),
    longitud(Unicos, N),
    N > 1.

% ---------------------------------------------------------------------------
% ordenar_desc(+ListaDePares, -Ordenada)
% Ordena pares clave-valor de mayor a menor valor.
% ---------------------------------------------------------------------------
ordenar_desc(Pares, Ordenada) :-
    findall(Valor-Clave, pertenece(Clave-Valor, Pares), Invertidos),
    msort(Invertidos, Ascendente),
    reverse(Ascendente, Descendente),
    findall(Clave-Valor, pertenece(Valor-Clave, Descendente), Ordenada).

% ---------------------------------------------------------------------------
% intervalo_solapa(+HoraA, +HoraB, +Margen)
% Dos horas se consideran simultaneas si difieren menos que Margen minutos
% en representacion HHMM.
% ---------------------------------------------------------------------------
intervalo_solapa(HoraA, HoraB, Margen) :-
    Diferencia is abs(HoraA - HoraB),
    Diferencia =< Margen.

% ---------------------------------------------------------------------------
% dentro_de_ventana(+Hora, +Inicio, +Fin)
% ---------------------------------------------------------------------------
dentro_de_ventana(Hora, Inicio, Fin) :-
    Hora >= Inicio,
    Hora =< Fin.
