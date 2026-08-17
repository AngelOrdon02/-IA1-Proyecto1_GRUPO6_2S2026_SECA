% =============================================================================
% Logic Detective — Capa de serializacion JSON
% -----------------------------------------------------------------------------
% Punto unico de contacto entre Prolog y Python.
%
% Existe para que los dos backends del puente (PySwip embebido y swipl por
% subproceso) devuelvan EXACTAMENTE la misma estructura. Si cada uno
% serializara a su manera, cambiar de backend cambiaria el contrato de la API
% y el fallback dejaria de ser transparente.
%
% Formato de respuesta:
%   {"ok": true,  "error": null,      "soluciones": [{"Var": "valor"}, ...]}
%   {"ok": false, "error": "texto",   "soluciones": []}
% =============================================================================

:- use_module(library(http/json)).

% ---------------------------------------------------------------------------
% consulta_json(+MetaAtom, +Limite, -JsonAtom)
% Ejecuta una meta escrita como texto y devuelve sus soluciones en JSON.
% Limite = 0 significa "sin limite".
%
% Toda excepcion se captura y se devuelve como respuesta de error: un objetivo
% mal formado enviado desde la interfaz no debe tumbar el servidor.
% ---------------------------------------------------------------------------
consulta_json(MetaAtom, Limite, JsonAtom) :-
    (   catch(soluciones(MetaAtom, Limite, Lista), Error, true)
    ->  true
    ;   Lista = []
    ),
    (   nonvar(Error)
    ->  term_string(Error, TextoError),
        Respuesta = json{ok: false, error: TextoError, soluciones: []}
    ;   Respuesta = json{ok: true, error: null, soluciones: Lista}
    ),
    % width(0) desactiva el formateo bonito: el JSON sale en una sola linea,
    % que es lo que el backend de subproceso espera leer de stdout.
    with_output_to(atom(JsonAtom),
                   json_write_dict(current_output, Respuesta, [width(0)])).

% ---------------------------------------------------------------------------
% soluciones(+MetaAtom, +Limite, -Lista)
% read_term_from_atom/3 con la opcion variable_names permite recuperar los
% nombres originales de las variables ('Persona', 'Puntaje'), que se vuelven
% las claves del JSON.
% ---------------------------------------------------------------------------
soluciones(MetaAtom, Limite, Lista) :-
    read_term_from_atom(MetaAtom, Meta, [variable_names(Nombres)]),
    findall(Fila, (call(Meta), fila(Nombres, Fila)), Todas),
    primeros(Limite, Todas, Lista).

fila(Nombres, Dict) :-
    maplist(par_clave_valor, Nombres, Pares),
    dict_create(Dict, binding, Pares).

% Los valores viajan como texto: Python no necesita entender terminos Prolog.
par_clave_valor(Nombre=Valor, Nombre-Texto) :-
    valor_texto(Valor, Texto).

% ---------------------------------------------------------------------------
% valor_texto(+Termino, -Texto)
% Los escalares se entregan en limpio: un atomo como 'Marco Duarte' llega a
% Python como "Marco Duarte" y no como "'Marco Duarte'". Solo los terminos
% compuestos conservan su sintaxis Prolog, porque ahi la estructura es
% justamente la informacion.
%
% Los CORTES hacen que cada termino tome exactamente una rama.
% ---------------------------------------------------------------------------
valor_texto(Valor, "_")   :- var(Valor), !.
valor_texto(Valor, Texto) :- atom(Valor),   !, atom_string(Valor, Texto).
valor_texto(Valor, Texto) :- number(Valor), !, number_string(Valor, Texto).
valor_texto(Valor, Valor) :- string(Valor), !.
valor_texto(Valor, Texto) :- term_string(Valor, Texto).

% ---------------------------------------------------------------------------
% primeros(+N, +Lista, -Prefijo)  — RECURSIVIDAD con contador decreciente.
% ---------------------------------------------------------------------------
primeros(0, Lista, Lista) :- !.
primeros(_, [], []) :- !.
primeros(N, [X|Resto], [X|Prefijo]) :-
    N > 0,
    N1 is N - 1,
    primeros(N1, Resto, Prefijo).

% ---------------------------------------------------------------------------
% ping_json(-JsonAtom)
% Sonda de salud: la usa el healthcheck de Docker y la suite de pruebas para
% confirmar que la base de conocimiento cargo completa.
% ---------------------------------------------------------------------------
ping_json(JsonAtom) :-
    findall(Id, caso(Id, _, _, _), Casos),
    length(Casos, Total),
    with_output_to(atom(JsonAtom),
        json_write_dict(current_output,
            json{ok: true, casos: Casos, total: Total})).
