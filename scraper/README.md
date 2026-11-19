# Scraper

Descarga los resultados de las **Elecciones Regionales y Municipales 2026 (ERM 2026)** de la
ONPE, los completa con datos del JNE y los guarda en `../data/2026-erm/`.

Por cada región obtiene:

- **Gobernador regional**: ranking completo de la región.
- **Alcalde provincial**: ranking de cada provincia.
- **Alcalde distrital**: ranking de cada distrito (los distritos capitales no tienen elección distrital).

## Requisitos

- [uv](https://docs.astral.sh/uv/) (instala Python 3.13 solo).
- Chromium para Playwright, una sola vez:

  ```bash
  uv run playwright install chromium
  ```

## Uso

Todos los comandos se corren desde `scraper/`.

```bash
uv run src/main.py
```

Se abre una ventana de Chromium con la página de la ONPE. Si aparece **"Let's confirm you are human"**,
resuélvelo a mano (hay 3 minutos); después el script sigue solo. Una corrida completa hace
~2 100 consultas a la ONPE (4 en paralelo) y ~1 000 al JNE (unos 8 minutos), y la primera vez
descarga ~2 000 fotos. Al final indica cuánto se demoró y qué quedó pendiente.

Otros comandos, que trabajan sobre lo ya descargado (no vuelven a consultar la ONPE):

| Comando | Qué hace |
|---|---|
| `uv run src/analisis.py` | Regenera los CSV a partir de los JSON. |
| `uv run src/actualizar_jne.py` | Vuelve a consultar al JNE el motivo de las listas sin candidato. |

## Qué genera

En `../data/2026-erm/` (la carpeta `data/` no se sube a git):

| Archivo | Contenido |
|---|---|
| `completo-1ra-vuelta.json` | Todos los participantes de cada ámbito, encadenados región → provincias → distritos. |
| `resumen-1ra-vuelta.json` | Lo mismo, recortado: 2 primeros de gobernador, 1º de cada alcaldía. Es lo que usa el frontend. |
| `completo-1ra-vuelta.csv`, `resumen-1ra-vuelta.csv` | Versión plana para análisis: una fila por candidato y ámbito. |
| `logos/{codigo}.png` | Logo de cada organización política, por código ONPE con 8 dígitos. |
| `fotos/{dni}.jpg` | Foto de cada candidato. |

Los archivos tienen nombre fijo y se sobrescriben en cada corrida; la fecha de descarga queda en
`generado_en`. Si algo no se pudo consultar, aparece en `fallidos`.

Formato de cada participante:

```json
{
  "codigo": "94",
  "organizacion": "PARTIDO DEMOCRÁTICO SOMOS PERÚ",
  "candidato": "AMILCAR DIAZ MENDOZA",
  "dni": "40402651",
  "votos": 52822,
  "porcentaje_validos": 25.905,
  "url_logo": "https://resultadoelectoral.onpe.gob.pe/assets/img-reales/partidos/00000094.png",
  "url_foto": "https://stovotoinformadodev.blob.core.windows.net/contenedor-1/40402651.jpg",
  "estado_jne": null
}
```

Cuando la ONPE trae una lista **sin candidato** (`candidato`, `dni` y `url_foto` en `null`),
`estado_jne` dice por qué según el JNE: `RENUNCIA`, `EXCLUSION`, `IMPROCEDENTE`, `TACHADO`, `RETIRO`…

## De dónde sale la información

| Dato | Fuente | Cómo se obtiene |
|---|---|---|
| Resultados, regiones, provincias y distritos | ONPE — [resultadoelectoral.onpe.gob.pe](https://resultadoelectoral.onpe.gob.pe) | API interna `presentacion-backend/` que usa la propia página (`resumen-general/participantes`, `ubigeos/*`). |
| Logos de los partidos | ONPE | Archivos estáticos de la misma página. |
| Fotos de candidatos | JNE — [Voto Informado](https://votoinformado.jne.gob.pe) | Almacenamiento público de la plataforma; el archivo se llama como el DNI. |
| Motivo de las listas sin candidato | JNE — Voto Informado | API `api/v1/candidatos/organizaciones/*`. |

La página de la ONPE está protegida por el WAF de AWS: por eso se usa un **navegador real**
(Playwright) y las consultas se hacen desde dentro de la página. El JNE no tiene esa protección y
se consulta con `httpx`.

Para no sobrecargar los sitios, las consultas van con concurrencia y pausas acotadas
(`CONCURRENCIA`, `PAUSA_ENTRE_CONSULTAS_S`, `CONCURRENCIA_JNE`… en `src/config.py`). Si la ONPE empieza
a responder 403 o el JNE 429, baja la concurrencia.

## Estructura

| Módulo | Responsabilidad |
|---|---|
| `main.py` | Punto de entrada: recorre las regiones, guarda, completa con el JNE y baja logos y fotos. |
| `config.py` | URLs, endpoints, ids de elección, concurrencia y rutas de salida. |
| `client.py` | Cliente de la ONPE: abre el navegador, pasa el WAF y hace las consultas en lotes paralelos. |
| `resultados.py` | Arma el árbol región → provincias → distritos. |
| `models.py` | Dataclasses: `Participante`, `Distrito`, `Provincia`, `Region`, `ReporteProceso`. |
| `resumen.py` | Recorta el reporte a los primeros puestos (`TOP_RESUMEN`). |
| `jne.py` | Motivo de las listas sin candidato según el JNE. |
| `logos.py`, `fotos.py` | Descarga de logos (ONPE) y fotos (JNE); solo lo que falta en disco. |
| `storage.py`, `analisis.py` | Lectura y escritura de JSON y CSV. |
| `actualizar_jne.py` | Script para completar el JNE sobre un reporte ya guardado. |

## Próximas vueltas

Las salidas llevan el sufijo `config.VUELTA` (`"1ra-vuelta"`). Para la segunda vuelta regional hay
que revisar en la API de la ONPE el nuevo id de elección y ajustar qué etapas se recorren.
