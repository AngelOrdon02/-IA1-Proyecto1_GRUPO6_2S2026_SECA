% =============================================================================
% Logic Detective — Motor de Inferencia (nucleo generico)
% -----------------------------------------------------------------------------
% Reglas independientes del caso. Todo lo que aqui se deduce vale para
% cualquier caso cargado, porque el identificador del caso viaja como primer
% argumento en cada consulta.
%
% Cubre los puntos 1 a 5 y 10 a 11 de la lista de inferencias minimas del
% enunciado. Las contradicciones viven en contradicciones.pl, el nivel de
% sospecha en sospecha.pl y la justificacion en explicacion.pl.
% =============================================================================

% Margen en minutos (representacion HHMM) para considerar dos horas simultaneas.
margen_temporal(30).

% ===========================================================================
% ROLES
% ===========================================================================

sospechoso(Caso, Persona) :-
    persona(Caso, Persona, _, sospechoso).

testigo(Caso, Persona) :-
    persona(Caso, Persona, _, testigo).

nombre_de(Caso, Persona, Nombre) :-
    persona(Caso, Persona, Nombre, _).

% ===========================================================================
% 1. ACCESO AL LUGAR
% ---------------------------------------------------------------------------
% Una persona tiene acceso si posee acceso directo al lugar del incidente,
% o si puede llegar caminando desde algun lugar al que si tiene acceso.
% ===========================================================================

% conexion_bi/3: las conexiones entre lugares son bidireccionales.
conexion_bi(Caso, A, B) :- conexion(Caso, A, B).
conexion_bi(Caso, A, B) :- conexion(Caso, B, A).

% ---------------------------------------------------------------------------
% alcanzable(+Caso, +Origen, +Destino, +Visitados)
% RECURSIVIDAD sobre el grafo de lugares. La lista Visitados es lo que evita
% el bucle infinito en un grafo con ciclos.
% El CORTE del caso base impide que se sigan explorando caminos una vez que
% ya se demostro que el destino es alcanzable.
% ---------------------------------------------------------------------------
alcanzable(_, Lugar, Lugar, _) :- !.
alcanzable(Caso, Origen, Destino, Visitados) :-
    conexion_bi(Caso, Origen, Intermedio),
    no_pertenece(Intermedio, Visitados),
    alcanzable(Caso, Intermedio, Destino, [Intermedio|Visitados]).

% ---------------------------------------------------------------------------
% alcanzable_por(+Caso, +Persona, +Origen, +Destino, +Visitados)
% Variante restringida: el camino solo puede atravesar lugares en los que la
% persona esta autorizada a entrar. Es la que decide el acceso real.
%
% La diferencia con alcanzable/4 es deliberada: en un grafo conexo, la simple
% conectividad fisica haria que todos tuvieran acceso a todo y el predicado
% no discriminaria nada.
% ---------------------------------------------------------------------------
alcanzable_por(_, _, Lugar, Lugar, _) :- !.
alcanzable_por(Caso, Persona, Origen, Destino, Visitados) :-
    conexion_bi(Caso, Origen, Intermedio),
    no_pertenece(Intermedio, Visitados),
    acceso(Caso, Persona, Intermedio, _),
    alcanzable_por(Caso, Persona, Intermedio, Destino, [Intermedio|Visitados]).

tiene_acceso(Caso, Persona) :-
    sospechoso(Caso, Persona),
    incidente(Caso, _, LugarIncidente, _),
    acceso(Caso, Persona, LugarConAcceso, _),
    alcanzable_por(Caso, Persona, LugarConAcceso, LugarIncidente, [LugarConAcceso]),
    !.

% via_de_acceso/3: por donde entro. Se usa en la explicacion.
via_de_acceso(Caso, Persona, TipoAcceso) :-
    incidente(Caso, _, LugarIncidente, _),
    acceso(Caso, Persona, LugarConAcceso, TipoAcceso),
    alcanzable_por(Caso, Persona, LugarConAcceso, LugarIncidente, [LugarConAcceso]).

% ===========================================================================
% 2. OPORTUNIDAD
% ---------------------------------------------------------------------------
% Tuvo oportunidad quien estuvo en el lugar del incidente (o en un lugar
% conectado) dentro de la ventana temporal del incidente.
% ===========================================================================

% a_un_paso/3: el lugar es el del incidente o uno directamente conectado.
% Se exige adyacencia, no conectividad general: estar en el jardin del museo
% durante el robo no es "estar cerca" de la sala si median tres salas.
a_un_paso(_, Lugar, Lugar).
a_un_paso(Caso, Lugar, LugarIncidente) :-
    conexion_bi(Caso, Lugar, LugarIncidente).

tuvo_oportunidad(Caso, Persona) :-
    detalle_oportunidad(Caso, Persona, _, _),
    !.

% Version con detalle, para la bitacora y la explicacion.
detalle_oportunidad(Caso, Persona, Lugar, Hora) :-
    sospechoso(Caso, Persona),
    incidente(Caso, _, LugarIncidente, _),
    ventana_incidente(Caso, Inicio, Fin),
    estuvo_en(Caso, Persona, Lugar, Hora),
    dentro_de_ventana(Hora, Inicio, Fin),
    a_un_paso(Caso, Lugar, LugarIncidente).

% ===========================================================================
% 3. MOTIVO
% ===========================================================================

tiene_motivo(Caso, Persona) :-
    sospechoso(Caso, Persona),
    motivo(Caso, Persona, _, _).

tiene_motivo(Caso, Persona, Tipo, Descripcion) :-
    sospechoso(Caso, Persona),
    motivo(Caso, Persona, Tipo, Descripcion).

% Motivo derivado: una relacion conflictiva con la victima tambien es motivo,
% aunque no se haya registrado explicitamente.
motivo_derivado(Caso, Persona, conflicto_con_victima) :-
    sospechoso(Caso, Persona),
    victima(Caso, Victima),
    relacion(Caso, Persona, Victima, Tipo),
    relacion_conflictiva(Tipo).

relacion_conflictiva(rivalidad).
relacion_conflictiva(deuda).
relacion_conflictiva(despido).
relacion_conflictiva(chantaje).
relacion_conflictiva(herencia).

% ===========================================================================
% 4. MEDIOS
% ---------------------------------------------------------------------------
% Cuenta con los medios quien posee TODOS los medios que el incidente exige.
% Implementado con recursion sobre la lista de medios requeridos.
% ===========================================================================

tiene_medios(Caso, Persona) :-
    sospechoso(Caso, Persona),
    findall(M, requiere_medio(Caso, M), Requeridos),
    posee_todos(Caso, Persona, Requeridos).

% posee_todos/3 — RECURSIVIDAD sobre lista.
posee_todos(_, _, []).
posee_todos(Caso, Persona, [Medio|Resto]) :-
    medio(Caso, Persona, Medio),
    posee_todos(Caso, Persona, Resto).

% Medios que le faltan a una persona (util para explicar por que se descarta).
medios_faltantes(Caso, Persona, Faltantes) :-
    findall(M, (requiere_medio(Caso, M), \+ medio(Caso, Persona, M)), Faltantes).

% ===========================================================================
% 5. COARTADAS
% ---------------------------------------------------------------------------
% Una coartada es valida si la respalda un testigo que no es sospechoso, que
% no ha dado informacion falsa, y ninguna evidencia la refuta.
% El CORTE evita reportar la misma coartada valida varias veces cuando hay
% mas de un testigo que la respalda.
% ===========================================================================

coartada_valida(Caso, Persona) :-
    coartada(Caso, Persona, Lugar, Hora, Testigo),
    testigo_confiable(Caso, Testigo),
    \+ coartada_refutada(Caso, Persona, Lugar, Hora),
    !.

testigo_confiable(Caso, Testigo) :-
    persona(Caso, Testigo, _, _),
    \+ sospechoso(Caso, Testigo),
    \+ informacion_falsa(Caso, Testigo, _).

% Una coartada queda refutada si una evidencia situa a la persona en otro
% lugar a una hora compatible con la de la coartada.
coartada_refutada(Caso, Persona, Lugar, Hora) :-
    evidencia_lugar_persona(Caso, Evidencia, Persona, OtroLugar),
    OtroLugar \= Lugar,
    evidencia(Caso, Evidencia, _, _, _, HoraEvidencia),
    margen_temporal(Margen),
    intervalo_solapa(Hora, HoraEvidencia, Margen).

% ---------------------------------------------------------------------------
% coartada_invalida(+Caso, ?Persona, -Razon)
% Enumera las razones concretas por las que una coartada no se sostiene.
% ---------------------------------------------------------------------------
coartada_invalida(Caso, Persona, sin_coartada) :-
    sospechoso(Caso, Persona),
    \+ coartada(Caso, Persona, _, _, _).

coartada_invalida(Caso, Persona, testigo_es_sospechoso(Testigo)) :-
    coartada(Caso, Persona, _, _, Testigo),
    sospechoso(Caso, Testigo).

coartada_invalida(Caso, Persona, testigo_mintio(Testigo)) :-
    coartada(Caso, Persona, _, _, Testigo),
    informacion_falsa(Caso, Testigo, _).

coartada_invalida(Caso, Persona, refutada_por_evidencia(Evidencia)) :-
    coartada(Caso, Persona, Lugar, Hora, _),
    evidencia_lugar_persona(Caso, Evidencia, Persona, OtroLugar),
    OtroLugar \= Lugar,
    evidencia(Caso, Evidencia, _, _, _, HoraEvidencia),
    margen_temporal(Margen),
    intervalo_solapa(Hora, HoraEvidencia, Margen).

% ===========================================================================
% 10. EVIDENCIAS RELACIONADAS CON CADA SOSPECHOSO
% ===========================================================================

evidencia_de(Caso, Persona, Evidencia) :-
    vincula(Caso, Evidencia, Persona).

evidencia_de(Caso, Persona, Evidencia) :-
    evidencia_lugar_persona(Caso, Evidencia, Persona, _).

evidencias_de(Caso, Persona, Lista) :-
    findall(E, evidencia_de(Caso, Persona, E), Todas),
    sin_duplicados(Todas, Lista).

% Conteo de evidencias por sospechoso, usando la recursion propia.
total_evidencias(Caso, Persona, Total) :-
    evidencias_de(Caso, Persona, Lista),
    longitud(Lista, Total).

% ===========================================================================
% 11. RELACIONES RELEVANTES ENTRE PERSONAS
% ---------------------------------------------------------------------------
% Una relacion es relevante si conecta a un sospechoso con la victima, o a
% dos sospechosos entre si.
% ===========================================================================

relacion_relevante(Caso, Persona1, Persona2, Tipo) :-
    relacion(Caso, Persona1, Persona2, Tipo),
    sospechoso(Caso, Persona1),
    victima(Caso, Persona2).

relacion_relevante(Caso, Persona1, Persona2, Tipo) :-
    relacion(Caso, Persona1, Persona2, Tipo),
    sospechoso(Caso, Persona1),
    sospechoso(Caso, Persona2).

% ---------------------------------------------------------------------------
% conectados(+Caso, +Persona1, +Persona2, -Cadena)
% RECURSIVIDAD: encuentra la cadena de relaciones que une a dos personas,
% aunque no se conozcan directamente. La lista Visitados evita los ciclos.
% ---------------------------------------------------------------------------
conectados(Caso, Origen, Destino, Cadena) :-
    camino_relacional(Caso, Origen, Destino, [Origen], Cadena).

camino_relacional(_, Destino, Destino, Visitados, Cadena) :-
    reverse(Visitados, Cadena),
    !.
camino_relacional(Caso, Actual, Destino, Visitados, Cadena) :-
    relacion_bi(Caso, Actual, Siguiente, _),
    no_pertenece(Siguiente, Visitados),
    camino_relacional(Caso, Siguiente, Destino, [Siguiente|Visitados], Cadena).

relacion_bi(Caso, A, B, Tipo) :- relacion(Caso, A, B, Tipo).
relacion_bi(Caso, A, B, Tipo) :- relacion(Caso, B, A, Tipo).

% ===========================================================================
% LINEA TEMPORAL
% ===========================================================================

linea_temporal(Caso, Ordenada) :-
    findall(Hora-evento(Id, Lugar, Descripcion),
            evento(Caso, Id, Hora, Lugar, Descripcion),
            Eventos),
    msort(Eventos, Ordenada).
