"""Modulo de Investigacion — interfaz web.

Cada ruta corresponde a una de las acciones que el enunciado exige (pagina 6).
Todas registran en la bitacora a traves de la capa de servicio.
"""

from __future__ import annotations

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from app.services import investigacion as inv
from app.storage import db
from app.templates_env import plantillas

router = APIRouter(tags=["investigacion"])


# ---------------------------------------------------------------------------
# Inicio
# ---------------------------------------------------------------------------

@router.get("/", response_class=HTMLResponse)
async def inicio(request: Request):
    """Pantalla principal: descripcion, casos disponibles y su estado."""
    return plantillas.TemplateResponse(
        request, "inicio.html",
        {
            "casos": inv.listar_casos(),
            "sesiones": db.listar_sesiones(limite=8),
        },
    )


@router.post("/iniciar")
async def iniciar(caso: str = Form(...)):
    """Abre una investigacion nueva y lleva al panel del detective."""
    sesion = inv.iniciar(caso)
    return RedirectResponse(f"/investigacion/{sesion}", status_code=303)


# ---------------------------------------------------------------------------
# Panel de investigacion
# ---------------------------------------------------------------------------

# Secciones del panel. El orden es el del menu lateral.
SECCIONES = [
    ("resumen", "Resumen del caso"),
    ("sospechosos", "Sospechosos"),
    ("interrogatorios", "Interrogatorios"),
    ("lugares", "Lugares"),
    ("evidencias", "Evidencias"),
    ("relaciones", "Relaciones"),
    ("analisis", "Motivos y oportunidades"),
    ("coartadas", "Coartadas"),
    ("tiempo", "Linea temporal"),
    ("contradicciones", "Contradicciones"),
    ("sospecha", "Nivel de sospecha"),
    ("explicacion", "Explicacion logica"),
    ("bitacora", "Bitacora"),
    ("acusacion", "Acusacion final"),
]


def _datos_de_seccion(sesion: str, seccion: str) -> dict:
    """Consulta solo lo que la seccion visible necesita.

    Se evita a proposito cargar las catorce secciones en cada peticion: cada
    una implica consultas al motor de inferencia.
    """
    if seccion == "sospechosos":
        return {"sospechosos": inv.sospechosos(sesion)}
    if seccion == "interrogatorios":
        return {
            "sospechosos": inv.sospechosos(sesion),
            "testigos": inv.personas(sesion, "testigo"),
        }
    if seccion == "lugares":
        return {"lugares": inv.lugares(sesion)}
    if seccion == "evidencias":
        return {"evidencias": inv.evidencias_descubiertas(sesion)}
    if seccion == "relaciones":
        return {"relaciones": inv.relaciones(sesion)}
    if seccion == "analisis":
        return {"pilares": inv.oportunidades(sesion), "motivos": inv.motivos(sesion)}
    if seccion == "coartadas":
        return {"coartadas": inv.coartadas(sesion)}
    if seccion == "tiempo":
        return {"eventos": inv.linea_temporal(sesion)}
    if seccion == "contradicciones":
        return {"contradicciones": inv.contradicciones(sesion)}
    if seccion == "sospecha":
        return {"sospecha": inv.nivel_sospecha(sesion)}
    if seccion == "explicacion":
        return {"explicacion": inv.explicacion(sesion)}
    if seccion == "bitacora":
        return {"bitacora": inv.bitacora(sesion)}
    if seccion == "acusacion":
        return {"sospechosos": inv.sospechosos(sesion)}
    return {}


@router.get("/investigacion/{sesion}", response_class=HTMLResponse)
async def panel(request: Request, sesion: str, seccion: str = "resumen"):
    """Panel del detective. La seccion visible se elige por query string."""
    datos = db.obtener_sesion(sesion)
    if datos is None:
        raise inv.AccionInvalida("La sesion de investigacion no existe.")

    contexto = {
        "sesion": datos,
        "sesion_id": sesion,
        "ficha": inv.ficha_caso(datos["caso"]),
        "secciones": SECCIONES,
        "seccion": seccion,
        "mensaje": request.query_params.get("mensaje"),
        **_datos_de_seccion(sesion, seccion),
    }
    return plantillas.TemplateResponse(request, "panel.html", contexto)


# ---------------------------------------------------------------------------
# Acciones
# ---------------------------------------------------------------------------

@router.post("/investigacion/{sesion}/interrogar")
async def accion_interrogar(sesion: str, persona: str = Form(...)):
    resultado = inv.interrogar(sesion, persona)
    declaraciones = " ".join(d["Texto"] for d in resultado["declaraciones"])
    mensaje = f"{resultado['nombre']}: «{declaraciones}»" if declaraciones else (
        f"{resultado['nombre']} no tiene nada que declarar."
    )
    return RedirectResponse(
        f"/investigacion/{sesion}?seccion=interrogatorios&mensaje={mensaje}",
        status_code=303,
    )


@router.post("/investigacion/{sesion}/investigar-lugar")
async def accion_investigar_lugar(sesion: str, lugar: str = Form(...)):
    resultado = inv.investigar_lugar(sesion, lugar)
    total = len(resultado["evidencias"])
    mensaje = (
        f"{resultado['nombre']}: se hallaron {total} evidencia(s)."
        if total
        else f"{resultado['nombre']}: sin evidencias nuevas."
    )
    return RedirectResponse(
        f"/investigacion/{sesion}?seccion=evidencias&mensaje={mensaje}",
        status_code=303,
    )


@router.post("/investigacion/{sesion}/examinar")
async def accion_examinar(sesion: str, evidencia: str = Form(...)):
    resultado = inv.examinar_evidencia(sesion, evidencia)
    vinculos = ", ".join(v["Nombre"] for v in resultado["vinculos"])
    mensaje = (
        f"{resultado['Descripcion']} Vinculada a: {vinculos}."
        if vinculos
        else f"{resultado['Descripcion']} No vincula a nadie de forma directa."
    )
    return RedirectResponse(
        f"/investigacion/{sesion}?seccion=evidencias&mensaje={mensaje}",
        status_code=303,
    )


@router.post("/investigacion/{sesion}/pista")
async def accion_pista(sesion: str):
    pista = inv.solicitar_pista(sesion)
    mensaje = (
        f"Pista {pista['numero']}: {pista['texto']} (quedan {pista['restantes']})"
        if pista["texto"]
        else "No quedan pistas disponibles."
    )
    return RedirectResponse(
        f"/investigacion/{sesion}?seccion=resumen&mensaje={mensaje}", status_code=303
    )


@router.post("/investigacion/{sesion}/acusar")
async def accion_acusar(sesion: str, acusado: str = Form(...)):
    inv.acusar(sesion, acusado)
    return RedirectResponse(f"/investigacion/{sesion}/informe", status_code=303)


@router.get("/investigacion/{sesion}/informe", response_class=HTMLResponse)
async def informe(request: Request, sesion: str):
    """Informe final del caso, con la cadena deductiva completa."""
    return plantillas.TemplateResponse(
        request, "informe.html", {"sesion_id": sesion, **inv.informe_final(sesion)}
    )
