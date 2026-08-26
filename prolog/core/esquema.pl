% =============================================================================
% Logic Detective — Esquema de la Base de Conocimiento
% -----------------------------------------------------------------------------
% Declara todos los predicados que los archivos de caso pueden definir.
% Se declaran dinamicos para que:
%   1. Una consulta sobre un predicado sin hechos falle en vez de lanzar
%      existence_error.
%   2. El modulo administrativo pueda asertar y retractar casos en caliente.
%
% CONVENCION: el primer argumento de todo hecho es el identificador del caso.
% Esto permite tener las tres bases de conocimiento cargadas simultaneamente
% sin colision de nombres, y hace que el motor sea generico.
%
% Las horas se representan como enteros HHMM (ej. 2015 = 20:15), lo que
% permite compararlas directamente con >=, =< y <.
% =============================================================================

% ---------------------------------------------------------------------------
% Metadatos del caso
% ---------------------------------------------------------------------------
:- dynamic caso/4.              % caso(Caso, Titulo, Descripcion, Dificultad)
:- dynamic incidente/4.         % incidente(Caso, Descripcion, Lugar, Hora)
:- dynamic ventana_incidente/3. % ventana_incidente(Caso, HoraInicio, HoraFin)
:- dynamic victima/2.           % victima(Caso, Persona)
:- dynamic requiere_medio/2.    % requiere_medio(Caso, Medio)
:- dynamic solucion/2.          % solucion(Caso, Persona)  -- solo para pruebas

% ---------------------------------------------------------------------------
% Personas
% ---------------------------------------------------------------------------
:- dynamic persona/4.           % persona(Caso, Id, Nombre, Rol)
                                %   Rol in {sospechoso, testigo, victima}
:- dynamic relacion/4.          % relacion(Caso, Persona1, Persona2, Tipo)

% ---------------------------------------------------------------------------
% Lugares y accesos
% ---------------------------------------------------------------------------
:- dynamic lugar/4.             % lugar(Caso, Id, Nombre, Descripcion)
:- dynamic conexion/3.          % conexion(Caso, Lugar1, Lugar2)  -- no dirigida
:- dynamic acceso/4.            % acceso(Caso, Persona, Lugar, TipoDeAcceso)

% ---------------------------------------------------------------------------
% Linea temporal
% ---------------------------------------------------------------------------
:- dynamic estuvo_en/4.         % estuvo_en(Caso, Persona, Lugar, Hora)
:- dynamic evento/5.            % evento(Caso, Id, Hora, Lugar, Descripcion)

% ---------------------------------------------------------------------------
% Evidencias
% ---------------------------------------------------------------------------
:- dynamic evidencia/6.         % evidencia(Caso, Id, Tipo, Descripcion, Lugar, Hora)
:- dynamic vincula/3.           % vincula(Caso, Evidencia, Persona)
:- dynamic evidencia_lugar_persona/4.
                                % evidencia_lugar_persona(Caso, Evidencia, Persona, Lugar)
                                %   la evidencia situa fisicamente a Persona en Lugar

% ---------------------------------------------------------------------------
% Declaraciones
% ---------------------------------------------------------------------------
:- dynamic declaracion/4.       % declaracion(Caso, Id, Autor, Texto)
:- dynamic afirma/3.            % afirma(Caso, Declaracion, Afirmacion)
%
% Afirmaciones estructuradas soportadas:
%   estuvo(Persona, Lugar, Hora)
%   no_estuvo(Persona, Lugar, Hora)
%   vio(Observador, Observado, Lugar, Hora)
%   poseia(Persona, Objeto)
%   desconoce(Persona, Cosa)

% ---------------------------------------------------------------------------
% Coartadas, motivos y medios
% ---------------------------------------------------------------------------
:- dynamic coartada/5.          % coartada(Caso, Persona, Lugar, Hora, Testigo)
:- dynamic motivo/4.            % motivo(Caso, Persona, Tipo, Descripcion)
:- dynamic medio/3.             % medio(Caso, Persona, Medio)

% ---------------------------------------------------------------------------
% Reglas propias de cada caso (definidas en prolog/casos/*.pl)
% ---------------------------------------------------------------------------
:- dynamic regla_caso/4.        % regla_caso(Caso, Id, Nombre, Descripcion)

% ---------------------------------------------------------------------------
% Clausulas repartidas entre varios archivos
% ---------------------------------------------------------------------------
% Cada caso define clausulas de los mismos predicados en su propio archivo.
% Sin multifile, SWI-Prolog advierte de que las clausulas de persona/4 estan
% "dispersas" entre caso1, caso2 y caso3, cuando es exactamente lo que se
% pretende: un esquema comun, tres bases de conocimiento.
:- multifile caso/4.
:- multifile incidente/4.
:- multifile ventana_incidente/3.
:- multifile victima/2.
:- multifile requiere_medio/2.
:- multifile solucion/2.
:- multifile persona/4.
:- multifile relacion/4.
:- multifile lugar/4.
:- multifile conexion/3.
:- multifile acceso/4.
:- multifile estuvo_en/4.
:- multifile evento/5.
:- multifile evidencia/6.
:- multifile vincula/3.
:- multifile evidencia_lugar_persona/4.
:- multifile declaracion/4.
:- multifile afirma/3.
:- multifile coartada/5.
:- multifile motivo/4.
:- multifile medio/3.
:- multifile regla_caso/4.

% ---------------------------------------------------------------------------
% Clausulas no contiguas
% ---------------------------------------------------------------------------
% Los archivos de caso agrupan la informacion por unidad narrativa (cada
% declaracion junto a las afirmaciones que la componen, cada regla junto a su
% descripcion) en vez de por predicado. Es mas legible para quien escribe
% casos nuevos, y estas declaraciones evitan las advertencias del compilador.
:- discontiguous declaracion/4.
:- discontiguous afirma/3.
:- discontiguous regla_caso/4.
:- discontiguous evidencia/6.
:- discontiguous vincula/3.
:- discontiguous evidencia_lugar_persona/4.
:- discontiguous persona/4.
:- discontiguous lugar/4.
:- discontiguous acceso/4.
:- discontiguous estuvo_en/4.
:- discontiguous coartada/5.
:- discontiguous motivo/4.
:- discontiguous medio/3.
:- discontiguous relacion/4.

% ===========================================================================
% PURGA DE UN CASO
% ---------------------------------------------------------------------------
% Necesario porque SWI-Prolog embebido (PySwip) vive en el proceso: reiniciar
% el objeto de Python NO descarta las clausulas ya consultadas. Al eliminar un
% caso desde el modulo administrativo su archivo desaparece del disco, pero sus
% hechos seguirian en memoria y el caso continuaria apareciendo en el listado.
%
% Con el backend de subproceso el problema no existe (cada consulta arranca un
% interprete limpio), pero la aplicacion debe comportarse igual con los dos.
% ===========================================================================

% predicado_de_caso(?Nombre, ?Aridad)
% Predicados del esquema cuyo PRIMER argumento es el identificador del caso.
predicado_de_caso(caso, 4).
predicado_de_caso(incidente, 4).
predicado_de_caso(ventana_incidente, 3).
predicado_de_caso(victima, 2).
predicado_de_caso(requiere_medio, 2).
predicado_de_caso(solucion, 2).
predicado_de_caso(persona, 4).
predicado_de_caso(relacion, 4).
predicado_de_caso(lugar, 4).
predicado_de_caso(conexion, 3).
predicado_de_caso(acceso, 4).
predicado_de_caso(estuvo_en, 4).
predicado_de_caso(evento, 5).
predicado_de_caso(evidencia, 6).
predicado_de_caso(vincula, 3).
predicado_de_caso(evidencia_lugar_persona, 4).
predicado_de_caso(declaracion, 4).
predicado_de_caso(afirma, 3).
predicado_de_caso(coartada, 5).
predicado_de_caso(motivo, 4).
predicado_de_caso(medio, 3).
predicado_de_caso(regla_caso, 4).

% ---------------------------------------------------------------------------
% purgar_caso(+Caso)
% Retracta todos los hechos de un caso. Tiene exito siempre, incluso si el caso
% no estaba cargado: es una operacion idempotente de limpieza.
%
% functor/3 construye una cabecera con la aridad correcta y arg/3 fija el
% primer argumento al caso; retractall/1 borra todo lo que unifique con ella.
% ---------------------------------------------------------------------------
purgar_caso(Caso) :-
    forall(
        predicado_de_caso(Nombre, Aridad),
        ( functor(Cabecera, Nombre, Aridad),
          arg(1, Cabecera, Caso),
          retractall(Cabecera) )
    ).

% ---------------------------------------------------------------------------
% purgar_casos_ausentes(+CasosVigentes)
% Retracta todo caso cargado en memoria que ya no figure en la lista dada.
% Es lo que se llama tras recargar la base de conocimiento: los casos cuyo
% archivo se elimino desaparecen tambien del motor.
% ---------------------------------------------------------------------------
purgar_casos_ausentes(Vigentes) :-
    findall(C, caso(C, _, _, _), Cargados),
    forall(
        ( member(C, Cargados), \+ memberchk(C, Vigentes) ),
        purgar_caso(C)
    ).
