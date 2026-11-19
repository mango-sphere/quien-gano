"""Versión plana del reporte para análisis: una fila por candidato en cada ámbito.

Transforma el JSON encadenado (región → provincias → distritos) en una tabla.
Se puede ejecutar solo, para regenerar los CSV desde los JSON sin volver a scrapear::

    uv run src/analisis.py
"""

import json
from collections.abc import Iterator
from typing import Any

import polars as pl
from loguru import logger

from storage import guardar_csv, ruta_salida

VARIANTES = ("completo", "resumen")

# Tipos explícitos: ``ubigeo``, ``codigo`` y ``dni`` son texto para no perder los ceros iniciales.
ESQUEMA = {
    "cargo": pl.String,
    "ubigeo": pl.String,
    "region": pl.String,
    "provincia": pl.String,
    "distrito": pl.String,
    "puesto": pl.Int32,
    "codigo": pl.String,
    "organizacion": pl.String,
    "candidato": pl.String,
    "dni": pl.String,
    "estado_jne": pl.String,
    "votos": pl.Int64,
    "porcentaje_validos": pl.Float64,
}


def _filas_ranking(
    cargo: str,
    ubigeo: str,
    ranking: dict[Any, dict[str, Any]],
    region: str,
    provincia: str | None = None,
    distrito: str | None = None,
) -> Iterator[dict[str, Any]]:
    """Una fila por participante de un ranking.

    Las claves de ``ranking`` pueden ser ``int`` (recién scrapeado) o ``str`` (leído de JSON).
    """
    for puesto, participante in ranking.items():
        yield {
            "cargo": cargo,
            "ubigeo": ubigeo,
            "region": region,
            "provincia": provincia,
            "distrito": distrito,
            "puesto": int(puesto),
            "codigo": participante["codigo"],
            "organizacion": participante["organizacion"],
            "candidato": participante["candidato"],
            "dni": participante["dni"],
            "estado_jne": participante.get("estado_jne"),
            "votos": participante["votos"],
            "porcentaje_validos": participante["porcentaje_validos"],
        }


def filas(reporte: dict[str, Any]) -> Iterator[dict[str, Any]]:
    """Recorre el árbol del reporte y emite una fila por candidato en cada ámbito."""
    for region in reporte["regiones"]:
        r = region["nombre"]
        yield from _filas_ranking("gobernador", region["ubigeo"], region["gobernador"], r)
        for provincia in region["provincias"]:
            p = provincia["nombre"]
            yield from _filas_ranking("alcalde_provincial", provincia["ubigeo"], provincia["alcalde_provincial"], r, p)
            for distrito in provincia["distritos"]:
                yield from _filas_ranking(
                    "alcalde_distrital", distrito["ubigeo"], distrito["alcalde_distrital"], r, p, distrito["nombre"]
                )


def aplanar(reporte: dict[str, Any]) -> pl.DataFrame:
    """Tabla plana del reporte (el dict es el mismo que se guarda como JSON)."""
    return pl.DataFrame(list(filas(reporte)), schema=ESQUEMA)


def regenerar_csv() -> None:
    """Regenera los CSV a partir de los JSON ya guardados en disco."""
    for variante in VARIANTES:
        origen = ruta_salida(variante)
        tabla = aplanar(json.loads(origen.read_text(encoding="utf-8")))
        destino = ruta_salida(variante, "csv")
        guardar_csv(tabla, destino)
        logger.success("{} → {} ({} filas)", origen.name, destino.name, tabla.height)


if __name__ == "__main__":
    regenerar_csv()
