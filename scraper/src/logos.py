"""Descarga de los logos de las organizaciones políticas."""

from pathlib import Path

from loguru import logger

import config
from client import OnpeApiError, OnpeClient
from models import Participante, Region


def participantes_unicos(regiones: list[Region]) -> dict[str, Participante]:
    """Junta los participantes de todo el árbol, uno por código de organización."""
    return {p.codigo: p for region in regiones for p in region.participantes()}


def ruta_logo(codigo: str) -> Path:
    """Ruta local del logo, p. ej. ``data/2026-erm/logos/00000094.png``."""
    return config.LOGOS_DIR / f"{codigo.zfill(8)}.png"


def descargar_logos(client: OnpeClient, regiones: list[Region]) -> list[str]:
    """Descarga los logos que aún no estén en disco.

    Un logo que falla no detiene al resto: se registra y se devuelve en la lista de fallidos.

    Returns:
        Los códigos de organización cuyo logo no se pudo descargar.
    """
    config.LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    pendientes = {
        codigo: p for codigo, p in participantes_unicos(regiones).items() if not ruta_logo(codigo).exists()
    }
    logger.info("Logos: {} por descargar en {}", len(pendientes), config.LOGOS_DIR)

    fallidos = []
    for codigo, participante in pendientes.items():
        try:
            imagen = client.get_bytes(participante.url_logo, content_type="image/")
        except OnpeApiError as e:
            logger.warning("Logo {} ({}) no se pudo descargar: {}", codigo, participante.organizacion, e)
            fallidos.append(codigo)
            continue
        ruta_logo(codigo).write_bytes(imagen)

    return fallidos
