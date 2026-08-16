% Capa de serializacion JSON
% Punto unico de contacto entre Prolog y otros componentes.
%
% Unifica las respuestas para los distintos tipos de llamadas.
%
% Formato de respuesta:
%   {"ok": true,  "error": null,      "soluciones": [{"Var": "valor"}, ...]}
%   {"ok": false, "error": "texto",   "soluciones": []}

:- use_module(library(http/json)).

% consulta_json(+MetaAtom, +Limite, -JsonAtom)
% Ejecuta una consulta textual y retorna los resultados en JSON.
% Un Limite de 0 significa "sin limite".
%
% Retorna errores estructurados en lugar de interrumpir la ejecución.

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
	% Genera el JSON en una sola línea para facilitar su lectura.
	with_output_to(atom(JsonAtom),
				   json_write_dict(current_output, Respuesta, [width(0)])).

% soluciones(+MetaAtom, +Limite, -Lista)
% Recupera las soluciones asignándoles como clave su nombre de variable.

soluciones(MetaAtom, Limite, Lista) :-
	read_term_from_atom(MetaAtom, Meta, [variable_names(Nombres)]),
	findall(Fila, (call(Meta), fila(Nombres, Fila)), Todas),
	primeros(Limite, Todas, Lista).

fila(Nombres, Dict) :-
	maplist(par_clave_valor, Nombres, Pares),
	dict_create(Dict, binding, Pares).

% Convierte los valores de las variables a texto.
par_clave_valor(Nombre=Valor, Nombre-Texto) :-
	valor_texto(Valor, Texto).

% valor_texto(+Termino, -Texto)
% Transforma el valor de Prolog a texto limpio.

valor_texto(Valor, "_")   :- var(Valor), !.
valor_texto(Valor, Texto) :- atom(Valor),   !, atom_string(Valor, Texto).
valor_texto(Valor, Texto) :- number(Valor), !, number_string(Valor, Texto).
valor_texto(Valor, Valor) :- string(Valor), !.
valor_texto(Valor, Texto) :- term_string(Valor, Texto).

% primeros(+N, +Lista, -Prefijo)
% Selecciona las primeras N soluciones de una lista.

primeros(0, Lista, Lista) :- !.
primeros(_, [], []) :- !.
primeros(N, [X|Resto], [X|Prefijo]) :-
	N > 0,
	N1 is N - 1,
	primeros(N1, Resto, Prefijo).

% ping_json(-JsonAtom)
% Comprueba el estado y cuenta los casos cargados correctamente.

ping_json(JsonAtom) :-
	findall(Id, caso(Id, _, _, _), Casos),
	length(Casos, Total),
	with_output_to(atom(JsonAtom),
		json_write_dict(current_output,
			json{ok: true, casos: Casos, total: Total})).
