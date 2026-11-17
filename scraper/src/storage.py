"""Persistencia de los reportes en disco."""

import json
from dataclasses import asdict
from pathlib import Path

import polars as pl

import config
from models import ReporteProceso


def ruta_salida(variante: str, extension: str = "json") -> Path:
    """Ruta fija de una salida del proceso, p. ej. ``data/2026-erm/resumen-1ra-vuelta.csv``.

    Se sobrescribe en cada corrida; la fecha de descarga queda en ``generado_en`` del JSON.
    """
    return config.PROCESO_DIR / f"{variante}-{config.VUELTA}.{extension}"


def guardar_json(reporte: ReporteProceso, destino: Path) -> None:
    """Escribe el reporte como JSON legible (UTF-8, sin escapar tildes)."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(asdict(reporte), ensure_ascii=False, indent=2), encoding="utf-8")


def guardar_csv(tabla: pl.DataFrame, destino: Path) -> None:
    """Escribe la tabla como CSV UTF-8 con BOM, para que Excel muestre bien las tildes."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    tabla.write_csv(destino, include_bom=True)
