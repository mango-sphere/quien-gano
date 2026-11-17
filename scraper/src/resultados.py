"""Construcción del árbol de resultados: región → provincias → distritos.

Las tres elecciones usan el mismo endpoint; solo cambian el id de elección y cuántos
niveles de ubigeo se envían (ver ``consulta_ranking``).

Cada región se arma con 3 lotes de consultas en paralelo (``OnpeClient.get_many``):

1. gobernador + lista de provincias
2. por cada provincia: alcalde provincial + lista de distritos
3. alcalde distrital de todos los distritos de la región

Si algo falla, no se detiene la corrida: se anota en ``fallidos``, se deja el ranking
vacío (o sin hijos) y se sigue con lo demás.
"""

from typing import Any

from loguru import logger

import config
from client import Consulta, OnpeApiError, OnpeClient
from models import Distrito, Participante, Provincia, Ranking, Region, Ubigeo

# --- Consultas ---


def consulta_ranking(id_eleccion: int, *ubigeos: str) -> Consulta:
    """Consulta del ranking (con nombre y DNI de cada candidato) de un ámbito.

    ``ubigeos`` va de lo general a lo particular: ``(región,)``, ``(región, provincia)``
    o ``(región, provincia, distrito)``; de su cantidad sale el ``tipoFiltro``.
    """
    return Consulta(
        config.ENDPOINT_PARTICIPANTES,
        {
            "idEleccion": id_eleccion,
            "idAmbitoGeografico": config.AMBITO_NACIONAL,
            "tipoFiltro": config.FILTROS_POR_NIVEL[len(ubigeos)],
            **dict(zip(config.PARAMS_UBIGEO_POR_NIVEL, ubigeos)),
        },
    )


def consulta_provincias(region: Ubigeo) -> Consulta:
    """Consulta de las provincias de una región con elección provincial."""
    return Consulta(
        config.ENDPOINT_PROVINCIAS,
        {
            "idEleccion": config.ID_ELECCION_PROVINCIAL,
            "idAmbitoGeografico": config.AMBITO_NACIONAL,
            "idUbigeoDepartamento": region["ubigeo"],
        },
    )


def consulta_distritos(provincia: Ubigeo) -> Consulta:
    """Consulta de los distritos de una provincia con elección distrital.

    Con el id de la elección distrital, la API ya excluye el distrito capital.
    """
    return Consulta(
        config.ENDPOINT_DISTRITOS,
        {
            "idEleccion": config.ID_ELECCION_DISTRITAL,
            "idAmbitoGeografico": config.AMBITO_NACIONAL,
            "idUbigeoProvincia": provincia["ubigeo"],
        },
    )


def listar_regiones(client: OnpeClient) -> list[Ubigeo]:
    """Regiones con elección de gobernador."""
    return client.get(
        config.ENDPOINT_DEPARTAMENTOS,
        idEleccion=config.ID_ELECCION_REGIONAL,
        idAmbitoGeografico=config.AMBITO_NACIONAL,
    )


# --- Ranking ---


def ranking(participantes: list[dict[str, Any]]) -> Ranking:
    """Ordena por votos a todos los participantes, sin contar blancos ni nulos.

    Devuelve ``{1: primero, 2: segundo, …}``.
    """
    candidatos = [p for p in participantes if str(p["codigoAgrupacionPolitica"]) not in config.CODIGOS_NO_CANDIDATOS]
    candidatos.sort(key=lambda p: p["totalVotosValidos"], reverse=True)
    return {puesto: Participante.from_api(raw) for puesto, raw in enumerate(candidatos, start=1)}


def _o_vacio[T](resultado: T | OnpeApiError, vacio: T, descripcion: str, fallidos: list[str]) -> T:
    """Devuelve ``resultado``; si es un error, lo anota en ``fallidos`` y devuelve ``vacio``."""
    if isinstance(resultado, OnpeApiError):
        fallidos.append(f"{descripcion}: {resultado}")
        logger.warning("Falló {}: {}", descripcion, resultado)
        return vacio
    return resultado


def _ranking_o_vacio(resultado: Any | OnpeApiError, descripcion: str, fallidos: list[str]) -> Ranking:
    """Ranking de una respuesta de la API, o ``{}`` si la consulta falló."""
    return ranking(_o_vacio(resultado, [], descripcion, fallidos))


# --- Construcción del árbol ---


def construir_region(client: OnpeClient, region: Ubigeo, fallidos: list[str]) -> Region:
    """Gobernador, provincias y distritos de una región, en 3 lotes de consultas paralelas."""
    nombre_region = f"{region['nombre']} ({region['ubigeo']})"

    # Lote 1: gobernador + provincias.
    resp_gobernador, resp_provincias = client.get_many(
        [consulta_ranking(config.ID_ELECCION_REGIONAL, region["ubigeo"]), consulta_provincias(region)]
    )
    gobernador = _ranking_o_vacio(resp_gobernador, f"gobernador {nombre_region}", fallidos)
    provincias: list[Ubigeo] = _o_vacio(resp_provincias, [], f"provincias de {nombre_region}", fallidos)

    # Lote 2: por cada provincia, su alcalde y su lista de distritos (intercalados).
    lote_2 = client.get_many(
        [
            consulta
            for provincia in provincias
            for consulta in (
                consulta_ranking(config.ID_ELECCION_PROVINCIAL, region["ubigeo"], provincia["ubigeo"]),
                consulta_distritos(provincia),
            )
        ]
    )
    alcaldes_provinciales: list[Ranking] = []
    distritos_por_provincia: list[list[Ubigeo]] = []
    for provincia, resp_alcalde, resp_distritos in zip(provincias, lote_2[0::2], lote_2[1::2]):
        nombre = f"{provincia['nombre']} ({provincia['ubigeo']})"
        alcaldes_provinciales.append(_ranking_o_vacio(resp_alcalde, f"alcalde provincial {nombre}", fallidos))
        distritos_por_provincia.append(_o_vacio(resp_distritos, [], f"distritos de {nombre}", fallidos))

    # Lote 3: alcalde distrital de todos los distritos de la región.
    pares = [
        (provincia, distrito)
        for provincia, distritos in zip(provincias, distritos_por_provincia)
        for distrito in distritos
    ]
    lote_3 = client.get_many(
        [
            consulta_ranking(config.ID_ELECCION_DISTRITAL, region["ubigeo"], provincia["ubigeo"], distrito["ubigeo"])
            for provincia, distrito in pares
        ]
    )
    alcaldes_distritales = iter(
        _ranking_o_vacio(resp, f"alcalde distrital {distrito['nombre']} ({distrito['ubigeo']})", fallidos)
        for (_, distrito), resp in zip(pares, lote_3)
    )

    # Armado del árbol, en el mismo orden en que se pidieron las consultas.
    _log_ganador("Región", region, gobernador)
    resultado_provincias = []
    for provincia, alcalde, distritos in zip(provincias, alcaldes_provinciales, distritos_por_provincia):
        _log_ganador("  Provincia", provincia, alcalde)
        resultado_distritos = []
        for distrito in distritos:
            alcalde_distrital = next(alcaldes_distritales)
            _log_ganador("    Distrito", distrito, alcalde_distrital)
            resultado_distritos.append(
                Distrito(ubigeo=distrito["ubigeo"], nombre=distrito["nombre"], alcalde_distrital=alcalde_distrital)
            )
        resultado_provincias.append(
            Provincia(
                ubigeo=provincia["ubigeo"],
                nombre=provincia["nombre"],
                alcalde_provincial=alcalde,
                distritos=resultado_distritos,
            )
        )

    return Region(
        ubigeo=region["ubigeo"],
        nombre=region["nombre"],
        gobernador=gobernador,
        provincias=resultado_provincias,
    )


def _log_ganador(nivel: str, ambito: Ubigeo, ranking_: Ranking) -> None:
    """Registra el ganador de un ámbito (la sangría en ``nivel`` refleja la jerarquía)."""
    ganador = ranking_.get(1)
    detalle = (
        f"1º {ganador.candidato or '(sin nombre)'} — {ganador.organizacion} ({ganador.votos:,})"
        if ganador
        else "sin resultados"
    )
    logger.info("{} {}: {}", nivel, ambito["nombre"], detalle)
