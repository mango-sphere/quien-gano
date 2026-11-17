"""Versión resumida del reporte: el mismo árbol, recortado a los primeros puestos."""

from dataclasses import replace

import config
from models import Distrito, Provincia, Ranking, Region, ReporteProceso


def recortar(ranking: Ranking, n: int) -> Ranking:
    """Los ``n`` primeros puestos de un ranking (ya viene ordenado)."""
    return {puesto: p for puesto, p in ranking.items() if puesto <= n}


def _resumir_distrito(distrito: Distrito) -> Distrito:
    """Distrito con solo los primeros puestos de alcalde distrital."""
    return replace(
        distrito,
        alcalde_distrital=recortar(distrito.alcalde_distrital, config.TOP_RESUMEN["alcalde_distrital"]),
    )


def _resumir_provincia(provincia: Provincia) -> Provincia:
    """Provincia (y sus distritos) con solo los primeros puestos."""
    return replace(
        provincia,
        alcalde_provincial=recortar(provincia.alcalde_provincial, config.TOP_RESUMEN["alcalde_provincial"]),
        distritos=[_resumir_distrito(d) for d in provincia.distritos],
    )


def _resumir_region(region: Region) -> Region:
    """Región (y todo lo que cuelga de ella) con solo los primeros puestos."""
    return replace(
        region,
        gobernador=recortar(region.gobernador, config.TOP_RESUMEN["gobernador"]),
        provincias=[_resumir_provincia(p) for p in region.provincias],
    )


def resumir_reporte(reporte: ReporteProceso) -> ReporteProceso:
    """Copia del reporte con solo los puestos definidos en ``config.TOP_RESUMEN``."""
    return replace(reporte, regiones=[_resumir_region(r) for r in reporte.regiones])
