# AGENTS.md

Indicaciones para agentes de IA que trabajen en este repositorio.

## Proyecto

Resultados de las Elecciones Regionales y Municipales 2026 del Perú.

- `scraper/`: Python 3.13 + uv. Descarga de la ONPE y el JNE y guarda en `data/2026-erm/`.
- `frontend/`: Next.js con exportación estática. Lee los datos ya convertidos en `src/data/` y `public/`.

Detalle de cada parte en `README.md`, `scraper/README.md` y `frontend/README.md`. Antes de cambiar
algo de Next.js, lee `frontend/AGENTS.md`: la versión instalada tiene cambios respecto de lo conocido.

## Comandos

| Dónde | Comando | Para qué |
|---|---|---|
| `scraper/` | `uv run src/main.py` | Scraper completo (abre un navegador; puede pedir resolver un CAPTCHA a mano). |
| `scraper/` | `uv run src/actualizar_jne.py` | Completar el motivo del JNE sin volver a consultar la ONPE. |
| `scraper/` | `uv run ruff check src` y `uv run ruff format src` | Lint y formato. Siempre con `uv run` (Ruff fijado en `uv.lock`). |
| `frontend/` | `npm run dev` | Desarrollo. |
| `frontend/` | `npm run lint` y `npm run build` | Lo mismo que corre el CI; el build también revisa tipos. |
| `frontend/` | `npm run sincronizar-datos` | Convertir la salida del scraper a los datos del frontend. |

Antes de dar un cambio por terminado, corre el lint y el build de la parte que tocaste.

## Estilo de código

Se sigue el Zen de Python también en TypeScript: explícito antes que implícito, simple antes que
complejo, plano antes que anidado, y los errores nunca pasan en silencio.

- Nombres en español, como el resto del código.
- **Python:** docstrings y type hints en todo. Las constantes y la configuración van en
  `scraper/src/config.py`. Un módulo por responsabilidad, nada de scripts de un solo archivo.
- **TypeScript/React:** tipos explícitos, sin `any`. CSS Modules con los tokens de `globals.css`.
  Controles accesibles (`<button>`, `<label>`, foco visible, `aria-*`).
- **Comentarios:** solo cuando explican un porqué que no se ve en el código. Nada de comentarios que
  repiten lo obvio.
- **Logs** del scraper con `loguru`. Un fallo puntual se anota en `fallidos` y se sigue; no se
  traga en silencio.

## Datos

- `data/` es la salida del scraper y **no se sube a git**.
- Los archivos generados del frontend (`src/data/resultados.json`, `meta.json`, `public/logos/`,
  `public/fotos/`) **sí se versionan**, porque el CI no puede correr el scraper. Solo cambian con
  `npm run sincronizar-datos`, nunca a mano.
- Las fotos se publican con un hash del DNI como nombre. No expongas DNIs en URLs ni en la interfaz.
- Las fuentes son la ONPE y el JNE. No se inventan ni se corrigen resultados: si un dato falta,
  se muestra que falta.

## Reglas de negocio (no cambiar sin confirmar antes)

- **Gobierno regional:** gana quien obtiene 30 % o más de los votos válidos; si nadie llega, los dos
  primeros van a segunda vuelta (`frontend/src/lib/reglas.ts`).
- **Alcaldías provinciales y distritales:** siempre hay ganador.
- Los distritos capitales no tienen elección distrital.

## Fuentes externas

- Respeta los límites de los sitios: no subas la concurrencia ni quites las pausas de `config.py`
  sin motivo, y ante un 403 o 429 baja el ritmo.
- No intentes evadir el WAF ni los CAPTCHA de la ONPE (cabeceras falsas, navegadores ocultos, etc.).
  El navegador real y el CAPTCHA resuelto por una persona son parte del diseño.

## Git

- Flujo: `feat/*` → PR a `develop` (corre el CI) → PR a `main` (publica en GitHub Pages).
- Mensajes de commit en español, con prefijo convencional: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`…
- Haz commit, push o abre pull requests solo cuando se pida explícitamente.
