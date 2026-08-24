% =============================================================================
% Logic Detective — Vistas para la interfaz
% -----------------------------------------------------------------------------
% Predicados que entregan una FILA POR SOLUCION con valores escalares ya
% redactados en español.
%
% Por que existe este archivo: si Python recibiera listas de terminos Prolog
% tendria que parsearlas, y ese parseo acabaria conteniendo decisiones sobre el
% significado de cada razon. Redactando aqui, Python se limita a mostrar texto
% y la restriccion del enunciado ("toda deduccion en Prolog") se sostiene sin
% ambiguedad.
% =============================================================================

% ---------------------------------------------------------------------------
% hora_texto(+HHMM, -Texto)
% Convierte el entero 2130 en el texto '21:30'.
% ---------------------------------------------------------------------------
hora_texto(Hora, Texto) :-
    Horas is Hora // 100,
    Minutos is Hora mod 100,
    format(atom(Texto), '~|~`0t~d~2+:~|~`0t~d~2+', [Horas, Minutos]).

% ===========================================================================
% REDACCION DE RAZONES
% ===========================================================================

% ---------------------------------------------------------------------------
% etiqueta(+Caso, +Id, -Texto)
% Traduce un identificador a su nombre legible. Sirve para personas y lugares;
% si el identificador no corresponde a ninguno, se muestra tal cual.
% Los CORTES seleccionan la primera traduccion aplicable.
% ---------------------------------------------------------------------------
etiqueta(Caso, Id, Texto) :- nombre_de(Caso, Id, Texto), !.
etiqueta(Caso, Id, Texto) :- lugar(Caso, Id, Texto, _), !.
etiqueta(_, Id, Id).

% ---------------------------------------------------------------------------
% texto_razon(+Caso, +Razon, -Texto)
% Redacta en español el termino que justifica una deduccion.
% ---------------------------------------------------------------------------
texto_razon(Caso, negacion_directa(Persona, Lugar, Hora), Texto) :-
    etiqueta(Caso, Persona, P), etiqueta(Caso, Lugar, L),
    hora_texto(Hora, HoraTexto),
    format(atom(Texto),
           'Una declaracion situa a ~w en ~w a las ~w y otra lo niega.',
           [P, L, HoraTexto]).

texto_razon(Caso, ubicuidad(Persona, Lugar1, Lugar2, Hora), Texto) :-
    etiqueta(Caso, Persona, P),
    etiqueta(Caso, Lugar1, L1), etiqueta(Caso, Lugar2, L2),
    hora_texto(Hora, HoraTexto),
    format(atom(Texto),
           '~w no puede estar en ~w y en ~w a la misma hora (~w).',
           [P, L1, L2, HoraTexto]).

texto_razon(Caso, testimonio_cruzado(Observador, Observado, Lugar), Texto) :-
    etiqueta(Caso, Observador, O1), etiqueta(Caso, Observado, O2),
    etiqueta(Caso, Lugar, L),
    format(atom(Texto),
           '~w afirma haber visto a ~w en ~w, pero ~w niega haber estado ahi.',
           [O1, O2, L, O2]).

texto_razon(Caso, avistamiento_incompatible(Observado, LugarVisto, LugarDeclarado), Texto) :-
    etiqueta(Caso, Observado, O),
    etiqueta(Caso, LugarVisto, LV), etiqueta(Caso, LugarDeclarado, LD),
    format(atom(Texto),
           'A ~w se le vio en ~w, pero se declara que estaba en ~w.',
           [O, LV, LD]).

texto_razon(Caso, negado_por_evidencia_fisica(Persona, Lugar), Texto) :-
    etiqueta(Caso, Persona, P), etiqueta(Caso, Lugar, L),
    format(atom(Texto),
           '~w niega haber estado en ~w, pero una evidencia fisica lo situa ahi.',
           [P, L]).

texto_razon(Caso, ubicacion_desmentida(Persona, LugarDeclarado, LugarReal), Texto) :-
    etiqueta(Caso, Persona, P),
    etiqueta(Caso, LugarDeclarado, LD), etiqueta(Caso, LugarReal, LR),
    format(atom(Texto),
           'Se declara que ~w estaba en ~w, pero la evidencia lo situa en ~w.',
           [P, LD, LR]).

texto_razon(Caso, desconocimiento_falso(Persona, Objeto), Texto) :-
    etiqueta(Caso, Persona, P),
    format(atom(Texto),
           '~w dice desconocer "~w", pero una evidencia de ese tipo lo vincula.',
           [P, Objeto]).

texto_razon(_, sin_coartada, 'No presento ninguna coartada.').

texto_razon(Caso, testigo_es_sospechoso(T), Texto) :-
    etiqueta(Caso, T, N),
    format(atom(Texto),
           'Su coartada la sostiene ~w, que tambien es sospechoso.', [N]).

texto_razon(Caso, testigo_mintio(T), Texto) :-
    etiqueta(Caso, T, N),
    format(atom(Texto),
           'Su coartada la sostiene ~w, cuyo testimonio quedo desmentido por la evidencia.', [N]).

texto_razon(_, refutada_por_evidencia(E), Texto) :-
    format(atom(Texto),
           'La evidencia ~w lo situa en otro lugar a esa hora.', [E]).

texto_razon(_, coartada_valida,
    'Su coartada la respalda un testigo fiable y ninguna evidencia la contradice.').
texto_razon(_, sin_oportunidad,
    'No estuvo cerca del lugar durante la ventana del incidente.').
texto_razon(_, sin_motivo, 'No se le conoce motivo alguno.').

texto_razon(_, sin_medios(Faltantes), Texto) :-
    atomic_list_concat(Faltantes, ', ', Listado),
    format(atom(Texto), 'Le faltaban los medios necesarios: ~w.', [Listado]).

texto_razon(_, encubrimiento_por_coartada,
    'Sostuvo con un testimonio falso la coartada del principal sospechoso.').
texto_razon(_, testimonio_falso_en_favor,
    'Mintio y mantiene una relacion con el principal sospechoso.').
texto_razon(_, facilito_acceso,
    'Tenia acceso al lugar del que el principal sospechoso carecia.').

% Respaldo generico: nunca se queda sin texto que mostrar.
texto_razon(_, Razon, Texto) :-
    \+ razon_conocida(Razon),
    term_string(Razon, Texto).

razon_conocida(Razon) :-
    functor(Razon, Nombre, Aridad),
    pertenece(Nombre/Aridad,
              [negacion_directa/3, ubicuidad/4, testimonio_cruzado/3,
               avistamiento_incompatible/3, negado_por_evidencia_fisica/2,
               ubicacion_desmentida/3, desconocimiento_falso/2,
               sin_coartada/0, testigo_es_sospechoso/1, testigo_mintio/1,
               refutada_por_evidencia/1, coartada_valida/0, sin_oportunidad/0,
               sin_motivo/0, sin_medios/1, encubrimiento_por_coartada/0,
               testimonio_falso_en_favor/0, facilito_acceso/0]).

% ===========================================================================
% VISTAS
% ===========================================================================

% --- Ranking de sospecha ---------------------------------------------------
vista_sospecha(Caso, Persona, Nombre, Puntaje, Categoria) :-
    nivel_sospecha(Caso, Persona, Puntaje),
    nombre_de(Caso, Persona, Nombre),
    categoria_sospecha(Caso, Persona, Categoria).

% --- Analisis por sospechoso ----------------------------------------------
vista_analisis(Caso, Persona, Nombre, Acceso, Oportunidad, Motivo, Medios, Coartada) :-
    persona(Caso, Persona, Nombre, sospechoso),
    ( tiene_acceso(Caso, Persona)     -> Acceso = si       ; Acceso = no ),
    ( tuvo_oportunidad(Caso, Persona) -> Oportunidad = si  ; Oportunidad = no ),
    ( tiene_motivo(Caso, Persona)     -> Motivo = si       ; Motivo = no ),
    ( tiene_medios(Caso, Persona)     -> Medios = si       ; Medios = no ),
    ( coartada_valida(Caso, Persona)  -> Coartada = valida ; Coartada = invalida ).

% --- Motivos ---------------------------------------------------------------
vista_motivo(Caso, Persona, Nombre, Tipo, Descripcion) :-
    tiene_motivo(Caso, Persona, Tipo, Descripcion),
    nombre_de(Caso, Persona, Nombre).

vista_motivo(Caso, Persona, Nombre, derivado, Texto) :-
    motivo_derivado(Caso, Persona, Tipo),
    nombre_de(Caso, Persona, Nombre),
    format(atom(Texto),
           'Motivo deducido de su relacion con la victima (~w).', [Tipo]).

% --- Coartadas -------------------------------------------------------------
vista_coartada(Caso, Persona, Nombre, LugarTexto, HoraTexto, TestigoNombre, Estado, Motivo) :-
    coartada(Caso, Persona, Lugar, Hora, Testigo),
    nombre_de(Caso, Persona, Nombre),
    lugar(Caso, Lugar, LugarTexto, _),
    hora_texto(Hora, HoraTexto),
    ( nombre_de(Caso, Testigo, TestigoNombre) -> true ; TestigoNombre = Testigo ),
    (   coartada_valida(Caso, Persona)
    ->  Estado = valida,
        texto_razon(Caso, coartada_valida, Motivo)
    ;   Estado = invalida,
        ( coartada_invalida(Caso, Persona, Razon) -> true ; Razon = sin_coartada ),
        texto_razon(Caso, Razon, Motivo)
    ).

% Sospechosos que ni siquiera presentaron coartada.
vista_coartada(Caso, Persona, Nombre, '-', '-', '-', invalida, Motivo) :-
    sospechoso(Caso, Persona),
    \+ coartada(Caso, Persona, _, _, _),
    nombre_de(Caso, Persona, Nombre),
    texto_razon(Caso, sin_coartada, Motivo).

% --- Relaciones ------------------------------------------------------------
vista_relacion(Caso, Nombre1, Nombre2, Tipo) :-
    relacion_relevante(Caso, Persona1, Persona2, Tipo),
    nombre_de(Caso, Persona1, Nombre1),
    nombre_de(Caso, Persona2, Nombre2).

% --- Linea temporal --------------------------------------------------------
vista_evento(Caso, Id, HoraTexto, LugarTexto, Descripcion) :-
    evento(Caso, Id, Hora, Lugar, Descripcion),
    hora_texto(Hora, HoraTexto),
    ( lugar(Caso, Lugar, LugarTexto, _) -> true ; LugarTexto = Lugar ).

% --- Contradicciones visibles ---------------------------------------------
% Solo se reportan las que involucran elementos YA descubiertos por el usuario.
% El filtrado ocurre aqui, no en Python.
vista_contradiccion(Caso, DeclConocidas, _, entre_declaraciones, D1, D2, Texto) :-
    declaraciones_contradictorias(Caso, D1, D2, Razon),
    pertenece(D1, DeclConocidas),
    pertenece(D2, DeclConocidas),
    texto_razon(Caso, Razon, Texto).

vista_contradiccion(Caso, DeclConocidas, EvidConocidas, declaracion_vs_evidencia, D, E, Texto) :-
    declaracion_contradice_evidencia(Caso, D, E, Razon),
    pertenece(D, DeclConocidas),
    pertenece(E, EvidConocidas),
    texto_razon(Caso, Razon, Texto).

% --- Explicacion -----------------------------------------------------------
vista_explicacion(Caso, Persona, Id, Nombre, Descripcion, Detalle) :-
    regla_activada(Caso, Persona, Id, DetalleTermino),
    catalogo_regla(Id, Nombre, Descripcion),
    term_string(DetalleTermino, Detalle).

% --- Descartes -------------------------------------------------------------
vista_descarte(Caso, Persona, Nombre, Texto) :-
    descartado(Caso, Persona, Razon),
    nombre_de(Caso, Persona, Nombre),
    texto_razon(Caso, Razon, Texto).

% --- Complices -------------------------------------------------------------
vista_complice(Caso, Persona, Nombre, Texto) :-
    posible_complice(Caso, Persona, Razon),
    ( nombre_de(Caso, Persona, Nombre) -> true ; Nombre = Persona ),
    texto_razon(Caso, Razon, Texto).

% --- Conclusion ------------------------------------------------------------
vista_conclusion(Caso, resuelto, Persona, Nombre, Puntaje) :-
    conclusion(Caso, responsable(Persona, Puntaje)),
    nombre_de(Caso, Persona, Nombre),
    !.
vista_conclusion(Caso, inconcluso, ninguno, '-', 0) :-
    conclusion(Caso, inconcluso(_, _)).

% --- Evidencias ------------------------------------------------------------
vista_evidencia(Caso, Id, Tipo, Descripcion, LugarTexto, HoraTexto) :-
    evidencia(Caso, Id, Tipo, Descripcion, Lugar, Hora),
    ( lugar(Caso, Lugar, LugarTexto, _) -> true ; LugarTexto = Lugar ),
    hora_texto(Hora, HoraTexto).

vista_evidencia_persona(Caso, Evidencia, Persona, Nombre) :-
    evidencia_de(Caso, Persona, Evidencia),
    nombre_de(Caso, Persona, Nombre).

% ---------------------------------------------------------------------------
% vinculo_evidencia(+Caso, +Evidencia, -Persona, -Nombre, -Relacion)
% Personas a las que una evidencia senala, con la naturaleza del vinculo ya
% redactada. Lo consume el modulo de investigacion al examinar una evidencia.
% La deduccion (vincula/3 directo o situacion fisica por
% evidencia_lugar_persona/4) ocurre aqui, no en Python.
% ---------------------------------------------------------------------------
vinculo_evidencia(Caso, Evidencia, Persona, Nombre, Relacion) :-
    vincula(Caso, Evidencia, Persona),
    etiqueta(Caso, Persona, Nombre),
    (   evidencia_lugar_persona(Caso, Evidencia, Persona, Lugar)
    ->  etiqueta(Caso, Lugar, LugarNombre),
        format(atom(Relacion),
               'La evidencia apunta a esta persona y la situa fisicamente en ~w.',
               [LugarNombre])
    ;   Relacion = 'La evidencia apunta directamente a esta persona.'
    ).
vinculo_evidencia(Caso, Evidencia, Persona, Nombre, Relacion) :-
    evidencia_lugar_persona(Caso, Evidencia, Persona, Lugar),
    \+ vincula(Caso, Evidencia, Persona),
    etiqueta(Caso, Persona, Nombre),
    etiqueta(Caso, Lugar, LugarNombre),
    format(atom(Relacion),
           'La evidencia situa fisicamente a esta persona en ~w.', [LugarNombre]).
