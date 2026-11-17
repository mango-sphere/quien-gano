"""Configuración general del scraper de resultados de la ONPE."""

from pathlib import Path

# --- Sitio y API ---
BASE_URL = "https://resultadoelectoral.onpe.gob.pe"
API_URL = f"{BASE_URL}/presentacion-backend"
ENTRY_PAGE = f"{BASE_URL}/main/elecciones-regionales"

# --- Endpoints (relativos a API_URL) ---
ENDPOINT_PROCESO_ACTIVO = "proceso/proceso-electoral-activo"
ENDPOINT_DEPARTAMENTOS = "ubigeos/departamentos"
ENDPOINT_PROVINCIAS = "ubigeos/provincias"
ENDPOINT_DISTRITOS = "ubigeos/distritos"
# Ranking de cualquier elección y nivel; a diferencia de los endpoints ``eleccion-*``,
# trae el nombre y el DNI del candidato (y no incluye votos en blanco ni nulos).
ENDPOINT_PARTICIPANTES = "resumen-general/participantes"

# --- Imágenes ---
# Logos (ONPE, detrás del WAF): código de la organización con ceros a la izquierda, 94 -> 00000094.
URL_LOGO_PARTIDO = f"{BASE_URL}/assets/img-reales/partidos/{{codigo}}.png"
# Fotos (JNE Voto Informado, blob público): el archivo se llama como el DNI del candidato.
URL_FOTO_CANDIDATO = "https://stovotoinformadodev.blob.core.windows.net/contenedor-1/{dni}.jpg"

# --- Parámetros de la API ---
# Cada elección tiene su id; los listados de ubigeos también se filtran por él
# (p. ej. con la distrital no aparecen los distritos capitales, que no eligen alcalde distrital).
ID_ELECCION_REGIONAL = 1
ID_ELECCION_PROVINCIAL = 3
ID_ELECCION_DISTRITAL = 4
AMBITO_NACIONAL = 1
# Según cuántos niveles de ubigeo se envían (1: región, 2: provincia, 3: distrito).
FILTROS_POR_NIVEL = {1: "ubigeo_nivel_01", 2: "ubigeo_nivel_02", 3: "ubigeo_nivel_03"}
PARAMS_UBIGEO_POR_NIVEL = ("idUbigeoDepartamento", "idUbigeoProvincia", "idUbigeoDistrito")
CODIGOS_NO_CANDIDATOS = frozenset({"80", "81"})  # votos en blanco y nulos

# --- Comportamiento ---
HEADLESS = False  # en headless el WAF de AWS siempre muestra CAPTCHA
TIMEOUT_WAF_MS = 180_000  # tiempo para resolver el CAPTCHA a mano si aparece
# ~2 100 consultas a la ONPE por corrida. Cada uno de los CONCURRENCIA trabajadores espera
# PAUSA_ENTRE_CONSULTAS_S entre sus peticiones. Subir mucho la concurrencia puede hacer que
# el WAF empiece a bloquear o a pedir CAPTCHA (y es infraestructura electoral pública).
CONCURRENCIA = 4
PAUSA_ENTRE_CONSULTAS_S = 0.5
# Fotos: blob estático del JNE, sin WAF.
CONCURRENCIA_FOTOS = 8
TIMEOUT_FOTOS_S = 20.0

# --- Salida ---
REPO_ROOT = Path(__file__).resolve().parents[2]  # quien-gano/
OUTPUT_DIR = REPO_ROOT / "data"
PROCESO_SLUG = "2026-erm"
PROCESO_DIR = OUTPUT_DIR / PROCESO_SLUG  # data/2026-erm/
LOGOS_DIR = PROCESO_DIR / "logos"  # data/2026-erm/logos/
FOTOS_DIR = PROCESO_DIR / "fotos"  # data/2026-erm/fotos/
VUELTA = "1ra-vuelta"  # sufijo de los JSON: completo-1ra-vuelta.json

# Puestos que van al resumen por cada cargo.
TOP_RESUMEN = {"gobernador": 2, "alcalde_provincial": 1, "alcalde_distrital": 1}
