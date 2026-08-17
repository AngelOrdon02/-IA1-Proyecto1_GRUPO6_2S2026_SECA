# Proyecto 1: Logic Detective - Guía Completa de Desarrollo

## 1. Enunciado y Descripción del Problema
El proyecto consiste en diseñar e implementar un sistema experto denominado **Logic Detective**, capaz de analizar casos de investigación mediante técnicas de lógica e inferencia. El problema que se resuelve es la dificultad de analizar múltiples evidencias, declaraciones y relaciones de forma objetiva, simulando el razonamiento de un detective.
El motor de inferencia debe analizar evidencias, declaraciones, coartadas y relaciones para determinar sospechosos (oportunidad, motivo, medios), identificar inconsistencias y generar una conclusión fundamentada.

## 2. Arquitectura y Componentes del Sistema
El sistema se compone de tres elementos principales:
*   **Módulo de Investigación:** Para el usuario que resolverá los casos (actuando como detective).
*   **Módulo Administrativo:** Para gestionar la información de los casos de investigación.
*   **Motor de Inferencia (Prolog):** Responsable de toda la lógica deductiva.

**Infraestructura Tecnológica:**
*   **Backend/Frontend:** Python (API, administración de datos, comunicación con la interfaz).
*   **Inferencia:** SWI-Prolog integrado con Python a través de PySwip.
*   **Despliegue:** Arquitectura web, contenedorizada con Docker y Docker Compose.
*   **Nube:** Despliegue en máquina virtual en AWS o Google Cloud Platform (GCP).
*   **CI/CD:** Pruebas automatizadas y proceso básico de integración continua (ej. GitHub Actions).

## 3. Alcance Obligatorio y Requisitos Mínimos
Para obtener los 100 puntos de la calificación (categoría Satisfactorio), se debe cumplir estrictamente lo siguiente:

### Casos de Investigación
Se deben modelar al menos **3 casos** de investigación. Cada caso debe incluir como mínimo:
*   4 sospechosos.
*   10 evidencias.
*   5 lugares.
*   5 declaraciones.
*   10 reglas de inferencia.

### Motor de Inferencia (Prolog)
*Toda deducción relacionada con la resolución debe ejecutarse en Prolog y no puede sustituirse por condiciones en Python.*
La base de conocimiento debe usar obligatoriamente:
*   Hechos, Reglas, Consultas, Variables, Predicados.
*   Listas, Recursividad, Unificación, Negación y Cortes.

El motor debe ser capaz de inferir (como mínimo):
1.  Personas con acceso al lugar, oportunidad, posible motivo y medios necesarios.
2.  Personas con coartadas válidas e inválidas.
3.  Contradicciones entre declaraciones, o entre declaraciones y evidencias.
4.  Sospechosos que proporcionaron información falsa.
5.  Evidencias relacionadas a cada sospechoso y relaciones relevantes entre personas.
6.  Nivel de sospecha, posibles cómplices y el responsable lógico del caso.
7.  Explicación de las reglas utilizadas para obtener la conclusión.

### Funcionalidades de la Interfaz (Módulo de Investigación)
El usuario descubrirá la información progresivamente. El sistema debe permitir:
*   **Inicio:** Pantalla principal con descripción, lista de casos, acceso administrativo.
*   **Acciones:** Interrogar testigos/sospechosos, investigar lugares, examinar evidencias y consultar relaciones.
*   **Análisis:** Analizar motivos, oportunidades, revisar coartadas y consultar la línea temporal.
*   **Deducciones del sistema:** Detectar contradicciones, solicitar pistas, consultar nivel de sospecha.
*   **Resolución:** Emitir una acusación final, visualizar el resultado de la investigación y consultar la explicación lógica generada por el sistema.
*   **Registro:** Cada acción debe quedar registrada en una bitácora de investigación.

## 4. Entregables Obligatorios
1.  **Código Fuente:** Repositorio en GitHub que incluya la interfaz en Python, la base de conocimiento en Prolog y scripts de pruebas.
2.  **Archivos de Despliegue:** `Dockerfile`, `docker-compose.yml` funcionales y configuración del pipeline de CI/CD.
3.  **Documentación Técnica:** Diagramas de arquitectura y flujo del sistema.
4.  **Manual de Usuario:** Explicación de uso con capturas de pantalla y pasos detallados.
5.  **Informe de distribución del trabajo grupal:** Detalle de actividades de cada integrante y porcentaje de participación (sumando 100%), respaldado por commits y tareas.
