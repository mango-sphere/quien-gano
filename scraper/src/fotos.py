"""Descarga de las fotos de los candidatos desde el JNE (Voto Informado).

El blob es público y no está detrás de ningún WAF, así que basta con ``httpx``;
no hace falta el navegador. El nombre del archivo es el DNI que informa la ONPE.
Se descargan en paralelo con ``config.CONCURRENCIA_FOTOS`` hilos.
"""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
from loguru import logger

import config
from models import Participante, Region


def candidatos_con_foto(regiones: list[Region]) -> dict[str, Participante]:
    """Participantes con DNI de todo el árbol, uno por DNI."""
    return {p.dni: p for region in regiones for p in region.participantes() if p.dni}


def ruta_foto(dni: str) -> Path:
    """Ruta local de la foto, p. ej. ``data/2026-erm/fotos/40864538.jpg``."""
    return config.FOTOS_DIR / f"{dni}.jpg"


def _descargar_foto(http: httpx.Client, dni: str, participante: Participante) -> bool:
    """Descarga y guarda una foto. Devuelve ``False`` (y lo registra) si falla."""
    try:
        resp = http.get(participante.url_foto)
        resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.warning("Foto de {} (DNI {}) no se pudo descargar: {}", participante.candidato, dni, e)
        return False

    content_type = resp.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        logger.warning("Foto de DNI {}: llegó {!r} en vez de una imagen", dni, content_type)
        return False

    ruta_foto(dni).write_bytes(resp.content)
    return True


def descargar_fotos(regiones: list[Region]) -> list[str]:
    """Descarga en paralelo las fotos que aún no estén en disco.

    Una foto que falla no detiene al resto: se registra y se devuelve en la lista de fallidas.

    Returns:
        Los DNI cuya foto no se pudo descargar.
    """
    config.FOTOS_DIR.mkdir(parents=True, exist_ok=True)
    pendientes = {dni: p for dni, p in candidatos_con_foto(regiones).items() if not ruta_foto(dni).exists()}
    logger.info("Fotos: {} por descargar en {}", len(pendientes), config.FOTOS_DIR)

    with (
        httpx.Client(timeout=config.TIMEOUT_FOTOS_S) as http,
        ThreadPoolExecutor(max_workers=config.CONCURRENCIA_FOTOS) as pool,
    ):
        ok = pool.map(lambda item: _descargar_foto(http, *item), pendientes.items())
        return [dni for dni, descargada in zip(pendientes, ok, strict=True) if not descargada]
