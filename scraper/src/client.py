"""Cliente HTTP para la ONPE, autenticado frente al WAF con un navegador real."""

import base64
import json
from types import TracebackType
from typing import Any, NamedTuple, Self, TypedDict
from urllib.parse import urlencode

from playwright.sync_api import Browser, Page, Playwright, sync_playwright

import config

# Se ejecuta dentro de la página: usa la red del navegador (cookies, TLS, headers),
# que es lo único que el WAF acepta. El APIRequestContext de Playwright recibe 403.
#
# Recibe un lote de URLs y las pide con un pool de ``concurrencia`` trabajadores;
# cada trabajador espera ``pausaMs`` entre una petición y la siguiente.
# Devuelve los resultados en el mismo orden que las URLs.
# El cuerpo viaja en base64 para que sirva igual para JSON y para imágenes.
_FETCH_MANY_JS = """
async ([urls, concurrencia, pausaMs]) => {
    const fetchOne = async (url) => {
        const r = await fetch(url);
        const bytes = new Uint8Array(await r.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return {
            ok: r.ok,
            status: r.status,
            statusText: r.statusText,
            contentType: r.headers.get("content-type") ?? "",
            body: btoa(binary),
        };
    };

    const resultados = new Array(urls.length);
    let siguiente = 0;
    const trabajador = async () => {
        while (siguiente < urls.length) {
            const i = siguiente++;
            try {
                resultados[i] = await fetchOne(urls[i]);
            } catch (e) {
                resultados[i] = { ok: false, status: 0, statusText: String(e), contentType: "", body: "" };
            }
            await new Promise((r) => setTimeout(r, pausaMs));
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrencia, urls.length) }, trabajador));
    return resultados;
}
"""


class _FetchResult(TypedDict):
    """Respuesta serializada de cada URL en ``_FETCH_MANY_JS``."""

    ok: bool
    status: int
    statusText: str
    contentType: str
    body: str  # base64


class OnpeApiError(RuntimeError):
    """La ONPE respondió con un error o con un contenido inesperado."""


class Consulta(NamedTuple):
    """Una llamada a la API: endpoint (relativo a ``API_URL``) y sus parámetros."""

    endpoint: str
    params: dict[str, str | int]


class OnpeClient:
    """Abre un navegador para pasar el WAF y hace las peticiones desde la página.

    Úsalo como context manager::

        with OnpeClient() as client:
            client.get("ubigeos/departamentos", idEleccion=1)
            client.get_many([Consulta(...), Consulta(...)])  # en paralelo
    """

    def __init__(self) -> None:
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._page: Page | None = None

    def __enter__(self) -> Self:
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(headless=config.HEADLESS)
        self._page = self._browser.new_page()

        # La SPA solo llama a la API cuando el WAF ya la dejó pasar.
        with self._page.expect_response(
            lambda r: config.ENDPOINT_PROCESO_ACTIVO in r.url and r.ok,
            timeout=config.TIMEOUT_WAF_MS,
        ):
            self._page.goto(config.ENTRY_PAGE)

        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self._browser:
            self._browser.close()
        if self._playwright:
            self._playwright.stop()

    def get(self, endpoint: str, **params: str | int) -> Any:
        """Hace un GET a la API y devuelve el campo ``data`` de la respuesta.

        Raises:
            OnpeApiError: si el status no es 2xx, la respuesta no es JSON
                o la API indica ``success: false``.
        """
        [resultado] = self.get_many([Consulta(endpoint, params)])
        if isinstance(resultado, OnpeApiError):
            raise resultado
        return resultado

    def get_many(self, consultas: list[Consulta]) -> list[Any | OnpeApiError]:
        """Hace varios GET en paralelo (``config.CONCURRENCIA``) y devuelve sus ``data``.

        Un error no corta el lote: en su posición se devuelve el ``OnpeApiError``
        en vez de lanzarlo, para que quien llama decida qué hacer con cada uno.
        El orden de la salida es el mismo que el de ``consultas``.
        """
        urls = [_url(c) for c in consultas]
        return [_parse_json(url, resp) for url, resp in zip(urls, self._fetch_many(urls), strict=True)]

    def get_bytes(self, url: str, content_type: str) -> bytes:
        """Descarga un archivo y verifica que sea del ``content_type`` esperado.

        Raises:
            OnpeApiError: si el status no es 2xx o el tipo de contenido no coincide
                (p. ej. el WAF devolvió HTML en vez de la imagen).
        """
        [resp] = self._fetch_many([url])
        _verificar(url, resp)
        if not resp["contentType"].startswith(content_type):
            raise OnpeApiError(f"Se esperaba {content_type} en {url}, llegó {resp['contentType']!r}")
        return base64.b64decode(resp["body"])

    def _fetch_many(self, urls: list[str]) -> list[_FetchResult]:
        """Ejecuta ``_FETCH_MANY_JS`` en la página con la concurrencia y pausa configuradas."""
        if self._page is None:
            raise RuntimeError("OnpeClient debe usarse dentro de un bloque 'with'.")
        if not urls:
            return []
        pausa_ms = int(config.PAUSA_ENTRE_CONSULTAS_S * 1000)
        return self._page.evaluate(_FETCH_MANY_JS, [urls, config.CONCURRENCIA, pausa_ms])


def _url(consulta: Consulta) -> str:
    """URL completa de una consulta a la API."""
    url = f"{config.API_URL}/{consulta.endpoint}"
    return f"{url}?{urlencode(consulta.params)}" if consulta.params else url


def _verificar(url: str, resp: _FetchResult) -> None:
    """Lanza ``OnpeApiError`` si la respuesta no es 2xx."""
    if not resp["ok"]:
        raise OnpeApiError(f"{resp['status']} {resp['statusText']} en {url}")


def _parse_json(url: str, resp: _FetchResult) -> Any | OnpeApiError:
    """Extrae ``data`` de una respuesta JSON de la API, o devuelve el error encontrado."""
    try:
        _verificar(url, resp)
        body = base64.b64decode(resp["body"]).decode("utf-8")
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as e:
            raise OnpeApiError(f"Respuesta no es JSON en {url}: {body[:200]!r}") from e
        if not payload.get("success"):
            raise OnpeApiError(f"La API respondió success=false en {url}: {payload.get('message')}")
        return payload["data"]
    except OnpeApiError as e:
        return e
