"""Motivo por el que una lista no tiene candidato a alcalde, según el JNE (Voto Informado).

La ONPE cuenta los votos de esas listas pero no informa nombre ni DNI. El JNE sí guarda
el estado del candidato (``RENUNCIA``, ``EXCLUSION``…). Para cada caso hacen falta dos
consultas: las listas de la ubicación (para obtener su ``idSolicitudLista``) y los
candidatos de esa lista. Los códigos de ubicación del JNE coinciden con el ubigeo de la ONPE.
"""

import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, replace
from typing import Any, Literal

import httpx
from loguru import logger

import config
from models import Distrito, Provincia, Ranking, Region, ReporteProceso

type Cargo = Literal["alcalde_provincial", "alcalde_distrital"]

TIPO_ELECCION: dict[Cargo, str] = {
    "alcalde_provincial": "MUNICIPAL PROVINCIAL",
    "alcalde_distrital": "MUNICIPAL DISTRITAL",
}
CARGO_JNE: dict[Cargo, str] = {
    "alcalde_provincial": "ALCALDE PROVINCIAL",
    "alcalde_distrital": "ALCALDE DISTRITAL",
}


@dataclass(frozen=True)
class Caso:
    """Una lista sin candidato en la ONPE, cuyo estado hay que buscar en el JNE."""

    cargo: Cargo
    ubigeo: str
    organizacion: str

    def ubicacion(self) -> dict[str, str]:
        """``{dep, pro, dis}`` para la API del JNE.

        Para la alcaldía provincial cualquier distrito de la provincia sirve; se usa el ``01``.
        """
        dis = self.ubigeo[4:6] if self.cargo == "alcalde_distrital" else "01"
        return {"dep": self.ubigeo[:2], "pro": self.ubigeo[2:4], "dis": dis}


PREFIJO_FALLIDO = "JNE "


class JneError(RuntimeError):
    """El JNE respondió con un error o no tiene la lista buscada."""


def _normalizar(nombre: str) -> str:
    """El JNE escribe los nombres sin tildes: ``"SOMOS PERÚ"`` y ``"SOMOS PERU"`` deben coincidir."""
    sin_tildes = unicodedata.normalize("NFD", nombre).encode("ascii", "ignore").decode()
    return " ".join(sin_tildes.upper().split())


def _post(http: httpx.Client, endpoint: str, cuerpo: dict[str, Any]) -> list[dict[str, Any]]:
    """POST a la API del JNE; devuelve ``data`` o lanza ``JneError`` si ``success`` es falso.

    Ante un 429 espera (``Retry-After`` o 1, 2, 4… s) y reintenta hasta ``REINTENTOS_JNE`` veces.
    """
    for intento in range(config.REINTENTOS_JNE + 1):
        resp = http.post(f"{config.JNE_API_URL}/{endpoint}", json=cuerpo)
        time.sleep(config.PAUSA_JNE_S)
        if resp.status_code != httpx.codes.TOO_MANY_REQUESTS or intento == config.REINTENTOS_JNE:
            break
        espera = float(resp.headers.get("Retry-After", 2**intento))
        logger.debug("JNE 429 en {}; reintento en {} s", endpoint, espera)
        time.sleep(espera)
    resp.raise_for_status()
    payload = resp.json()
    if not payload.get("success"):
        raise JneError(f"success=false en {endpoint} {cuerpo}: {payload.get('message')}")
    return payload["data"]


def _id_lista(organizaciones: list[dict[str, Any]], caso: Caso) -> int:
    """``idSolicitudLista`` de la lista de ``caso.organizacion`` para su tipo de elección."""
    for eleccion in organizaciones:
        if eleccion["tipoEleccion"] != TIPO_ELECCION[caso.cargo]:
            continue
        for org in eleccion["organizaciones"]:
            if _normalizar(org["organizacionPolitica"]) == _normalizar(caso.organizacion):
                return org["listas"][0]["idSolicitudLista"]
    raise JneError(f"el JNE no tiene la lista de {caso.organizacion} en {caso.ubigeo}")


def _estado_alcalde(http: httpx.Client, caso: Caso, id_lista: int) -> str:
    """Estado del candidato a alcalde de una lista, p. ej. ``"RENUNCIA"``."""
    cuerpo = {**caso.ubicacion(), "idSolicitudLista": id_lista}
    for eleccion in _post(http, config.JNE_ENDPOINT_CANDIDATOS, cuerpo):
        for org in eleccion["organizaciones"]:
            for lista in org["listas"]:
                for candidato in lista.get("candidatos", []):
                    if candidato["cargoEleccion"] == CARGO_JNE[caso.cargo]:
                        return candidato["estadoCandidato"]
    raise JneError(f"la lista {id_lista} no tiene candidato a {CARGO_JNE[caso.cargo]}")


def casos_sin_candidato(regiones: list[Region]) -> set[Caso]:
    """Las listas de alcaldía que la ONPE trae sin nombre de candidato."""
    casos = set()
    for region in regiones:
        for provincia in region.provincias:
            casos |= _sin_nombre("alcalde_provincial", provincia.ubigeo, provincia.alcalde_provincial)
            for distrito in provincia.distritos:
                casos |= _sin_nombre("alcalde_distrital", distrito.ubigeo, distrito.alcalde_distrital)
    return casos


def _sin_nombre(cargo: Cargo, ubigeo: str, ranking: Ranking) -> set[Caso]:
    """Los casos de un ranking cuyo participante no trae nombre."""
    return {Caso(cargo, ubigeo, p.organizacion) for p in ranking.values() if p.candidato is None}


def consultar_estados(casos: set[Caso]) -> tuple[dict[Caso, str], list[str]]:
    """Consulta al JNE el estado de cada caso, en paralelo.

    Returns:
        Los estados encontrados y la descripción de los casos que no se pudieron resolver.
    """
    ubicaciones = {tuple(c.ubicacion().items()) for c in casos}
    logger.info("JNE: {} listas sin candidato en {} ubicaciones", len(casos), len(ubicaciones))

    with (
        httpx.Client(timeout=config.TIMEOUT_JNE_S) as http,
        ThreadPoolExecutor(max_workers=config.CONCURRENCIA_JNE) as pool,
    ):
        def organizaciones(ubicacion: tuple[tuple[str, str], ...]) -> list[dict[str, Any]] | Exception:
            try:
                return _post(http, config.JNE_ENDPOINT_ORGANIZACIONES, dict(ubicacion))
            except (httpx.HTTPError, JneError) as e:
                return e

        por_ubicacion = dict(zip(ubicaciones, pool.map(organizaciones, ubicaciones)))

        def estado(caso: Caso) -> str | Exception:
            try:
                orgs = por_ubicacion[tuple(caso.ubicacion().items())]
                if isinstance(orgs, Exception):
                    raise orgs
                return _estado_alcalde(http, caso, _id_lista(orgs, caso))
            except (httpx.HTTPError, JneError) as e:
                return e

        ordenados = sorted(casos, key=lambda c: (c.ubigeo, c.cargo, c.organizacion))
        resultados = dict(zip(ordenados, pool.map(estado, ordenados)))

    estados = {c: r for c, r in resultados.items() if isinstance(r, str)}
    fallidos = [
        f"{PREFIJO_FALLIDO}{c.cargo} {c.organizacion} ({c.ubigeo}): {r}"
        for c, r in resultados.items()
        if isinstance(r, Exception)
    ]
    for fallo in fallidos:
        logger.warning(fallo)
    return estados, fallidos


def con_estados(reporte: ReporteProceso, estados: dict[Caso, str]) -> ReporteProceso:
    """Copia del reporte con ``estado_jne`` completado en las listas sin candidato."""

    def completar(cargo: Cargo, ubigeo: str, ranking: Ranking) -> Ranking:
        return {
            puesto: replace(p, estado_jne=estados.get(Caso(cargo, ubigeo, p.organizacion)))
            if p.candidato is None
            else p
            for puesto, p in ranking.items()
        }

    def distrito(d: Distrito) -> Distrito:
        return replace(d, alcalde_distrital=completar("alcalde_distrital", d.ubigeo, d.alcalde_distrital))

    def provincia(p: Provincia) -> Provincia:
        return replace(
            p,
            alcalde_provincial=completar("alcalde_provincial", p.ubigeo, p.alcalde_provincial),
            distritos=[distrito(d) for d in p.distritos],
        )

    return replace(
        reporte,
        regiones=[replace(r, provincias=[provincia(p) for p in r.provincias]) for r in reporte.regiones],
    )


def completar_estados(reporte: ReporteProceso) -> ReporteProceso:
    """Busca en el JNE el motivo de cada lista sin candidato y lo agrega al reporte.

    Lo que no se pudo resolver se suma a ``reporte.fallidos``, reemplazando los fallos del JNE
    de una corrida anterior (así se puede volver a correr sin que se acumulen).
    """
    estados, fallidos = consultar_estados(casos_sin_candidato(reporte.regiones))
    logger.success("JNE: {} motivos encontrados, {} sin resolver", len(estados), len(fallidos))
    fallidos_onpe = [f for f in reporte.fallidos if not f.startswith(PREFIJO_FALLIDO)]
    return replace(con_estados(reporte, estados), fallidos=[*fallidos_onpe, *fallidos])

