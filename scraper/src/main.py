"""Punto de entrada: descarga los resultados, los guarda como JSON y CSV, y baja los logos."""

from dataclasses import asdict, replace
from datetime import datetime, timedelta

from loguru import logger

import config
from analisis import aplanar
from client import OnpeClient
from fotos import descargar_fotos
from jne import completar_estados
from logos import descargar_logos
from models import Region, ReporteProceso
from resultados import construir_region, listar_regiones
from resumen import resumir_reporte
from storage import guardar_csv, guardar_json, ruta_salida


def guardar(reporte: ReporteProceso) -> None:
    """Guarda ``completo`` (todos los candidatos) y ``resumen``, cada uno en JSON y CSV."""
    for variante, datos in (("completo", reporte), ("resumen", resumir_reporte(reporte))):
        guardar_json(datos, ruta_salida(variante))
        guardar_csv(aplanar(asdict(datos)), ruta_salida(variante, "csv"))


def formatear_duracion(duracion: timedelta) -> str:
    """``timedelta`` legible, p. ej. ``"7 min 32 s"`` o ``"45 s"``."""
    minutos, segundos = divmod(round(duracion.total_seconds()), 60)
    return f"{minutos} min {segundos} s" if minutos else f"{segundos} s"


def main() -> None:
    """Descarga región → provincias → distritos, los logos y las fotos de los candidatos.

    - Ranking completo: ``data/2026-erm/completo-1ra-vuelta.{json,csv}``
    - Primeros puestos: ``data/2026-erm/resumen-1ra-vuelta.{json,csv}``
    - Logos: ``data/2026-erm/logos/`` (solo los que aún no estén descargados)
    - Fotos: ``data/2026-erm/fotos/`` (del JNE; solo las que aún no estén descargadas)

    Los archivos se guardan al terminar cada región: si la corrida se corta, lo avanzado queda.
    """
    inicio = datetime.now().astimezone()
    try:
        _scrapear(inicio)
    finally:
        # En ``finally`` para saber cuánto duró aunque falle o se corte con Ctrl+C.
        logger.info("Se demoró {}", formatear_duracion(datetime.now().astimezone() - inicio))


def _scrapear(inicio: datetime) -> None:
    """Todo el trabajo de ``main``; ``inicio`` queda como ``generado_en`` del reporte."""
    fallidos: list[str] = []
    regiones: list[Region] = []

    with OnpeClient() as client:
        reporte = ReporteProceso(
            proceso=client.get(config.ENDPOINT_PROCESO_ACTIVO)["acronimo"],
            fuente=config.BASE_URL,
            generado_en=inicio.isoformat(timespec="seconds"),
        )
        logger.info("Proceso {}", reporte.proceso)

        por_recorrer = listar_regiones(client)
        for i, region in enumerate(por_recorrer, start=1):
            logger.info("=== Región {}/{}: {} ===", i, len(por_recorrer), region["nombre"])
            regiones.append(construir_region(client, region, fallidos))
            reporte = replace(reporte, regiones=list(regiones), fallidos=list(fallidos))
            guardar(reporte)

        logger.success("Resultados guardados en {}", config.PROCESO_DIR)
        logos_fallidos = descargar_logos(client, reporte.regiones)

    # El JNE no tiene WAF: el motivo de las listas sin candidato y las fotos no necesitan el navegador.
    reporte = completar_estados(reporte)
    guardar(reporte)
    fotos_fallidas = descargar_fotos(reporte.regiones)

    for fallo in reporte.fallidos:
        logger.warning("Faltante: {}", fallo)
    if logos_fallidos:
        logger.warning("{} logos no se pudieron descargar: {}", len(logos_fallidos), ", ".join(logos_fallidos))
    if fotos_fallidas:
        logger.warning("{} fotos no se pudieron descargar: {}", len(fotos_fallidas), ", ".join(fotos_fallidas))
    if reporte.fallidos or logos_fallidos or fotos_fallidas:
        logger.warning(
            "Terminó con {} ámbitos, {} logos y {} fotos faltantes",
            len(reporte.fallidos), len(logos_fallidos), len(fotos_fallidas),
        )
    else:
        logger.success("Todo completo")


if __name__ == "__main__":
    main()
