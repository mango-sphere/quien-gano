"""Completa el motivo de las listas sin candidato en el reporte ya guardado, sin volver a scrapear la ONPE.

Uso (desde ``scraper/``)::

    uv run src/actualizar_jne.py
"""

from loguru import logger

from jne import completar_estados
from main import guardar
from storage import cargar_json, ruta_salida


def actualizar() -> None:
    """Lee ``completo``, consulta el JNE y vuelve a guardar ``completo`` y ``resumen``."""
    origen = ruta_salida("completo")
    reporte = completar_estados(cargar_json(origen))
    guardar(reporte)
    logger.success("Actualizado {}", origen.parent)


if __name__ == "__main__":
    actualizar()
