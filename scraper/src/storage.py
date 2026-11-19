"""Persistencia de los reportes en disco."""

import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

import polars as pl

import config
from models import Distrito, Participante, Provincia, Ranking, Region, ReporteProceso


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


def cargar_json(origen: Path) -> ReporteProceso:
    """Lee un reporte guardado con ``guardar_json`` y lo vuelve a armar como dataclasses."""
    datos = json.loads(origen.read_text(encoding="utf-8"))

    def ranking(raw: dict[str, dict[str, Any]]) -> Ranking:
        return {int(puesto): Participante(**p) for puesto, p in raw.items()}

    def provincia(raw: dict[str, Any]) -> Provincia:
        return Provincia(
            ubigeo=raw["ubigeo"],
            nombre=raw["nombre"],
            alcalde_provincial=ranking(raw["alcalde_provincial"]),
            distritos=[
                Distrito(ubigeo=d["ubigeo"], nombre=d["nombre"], alcalde_distrital=ranking(d["alcalde_distrital"]))
                for d in raw["distritos"]
            ],
        )

    return ReporteProceso(
        proceso=datos["proceso"],
        fuente=datos["fuente"],
        generado_en=datos["generado_en"],
        regiones=[
            Region(
                ubigeo=r["ubigeo"],
                nombre=r["nombre"],
                gobernador=ranking(r["gobernador"]),
                provincias=[provincia(p) for p in r["provincias"]],
            )
            for r in datos["regiones"]
        ],
        fallidos=datos["fallidos"],
    )
