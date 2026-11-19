"""Estructuras de datos de los resultados electorales.

El reporte está encadenado como el país: región → provincias → distritos.
Cada nivel tiene el ranking de su propio cargo (``{1: primero, 2: segundo, …}``).
"""

from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any, Self, TypedDict

import config


class Ubigeo(TypedDict):
    """Un ámbito tal como lo listan los endpoints ``ubigeos/*`` de la API."""

    nombre: str
    ubigeo: str


@dataclass(frozen=True)
class Participante:
    """Una organización política y su candidato, con sus votos en un ámbito.

    ``candidato``, ``dni`` y ``url_foto`` son ``None`` cuando la ONPE no informa
    al candidato (pasa con algunas listas que igual tienen votos). En ese caso,
    ``estado_jne`` dice por qué según el JNE (p. ej. ``"RENUNCIA"`` o ``"EXCLUSION"``).
    """

    codigo: str
    organizacion: str
    candidato: str | None
    dni: str | None
    votos: int
    porcentaje_validos: float
    url_logo: str
    url_foto: str | None
    estado_jne: str | None = None

    @classmethod
    def from_api(cls, raw: dict[str, Any]) -> Self:
        """Construye un ``Participante`` a partir de un registro devuelto por la API.

        La API manda el código como número (``95``); se guarda como texto (``"95"``).
        """
        codigo = str(raw["codigoAgrupacionPolitica"])
        dni = raw.get("dniCandidato") or None
        return cls(
            codigo=codigo,
            organizacion=raw["nombreAgrupacionPolitica"],
            candidato=raw.get("nombreCandidato") or None,
            dni=dni,
            votos=raw["totalVotosValidos"],
            porcentaje_validos=raw["porcentajeVotosValidos"],
            url_logo=config.URL_LOGO_PARTIDO.format(codigo=codigo.zfill(8)),
            url_foto=config.URL_FOTO_CANDIDATO.format(dni=dni) if dni else None,
        )


type Ranking = dict[int, Participante]


@dataclass(frozen=True)
class Distrito:
    """Un distrito con su elección de alcalde distrital."""

    ubigeo: str
    nombre: str
    alcalde_distrital: Ranking


@dataclass(frozen=True)
class Provincia:
    """Una provincia con su elección de alcalde provincial y sus distritos."""

    ubigeo: str
    nombre: str
    alcalde_provincial: Ranking
    distritos: list[Distrito]


@dataclass(frozen=True)
class Region:
    """Una región con su elección de gobernador y sus provincias."""

    ubigeo: str
    nombre: str
    gobernador: Ranking
    provincias: list[Provincia]

    def rankings(self) -> Iterator[Ranking]:
        """Todos los rankings de la región: gobernador, provinciales y distritales."""
        yield self.gobernador
        for provincia in self.provincias:
            yield provincia.alcalde_provincial
            for distrito in provincia.distritos:
                yield distrito.alcalde_distrital

    def participantes(self) -> Iterator[Participante]:
        """Todos los participantes de todos los rankings de la región (con repeticiones)."""
        for ranking in self.rankings():
            yield from ranking.values()


@dataclass(frozen=True)
class ReporteProceso:
    """Resultados del proceso, listos para guardarse como JSON.

    ``fallidos`` describe lo que no se pudo consultar, para saber qué falta en ``regiones``.
    """

    proceso: str
    fuente: str
    generado_en: str
    regiones: list[Region] = field(default_factory=list)
    fallidos: list[str] = field(default_factory=list)
