import { readFile } from "node:fs/promises";
import { join } from "node:path";

type Fuente = { name: string; data: Buffer; weight: 500 | 700 | 800; style: "normal" };

const CARPETA_FUENTES = join(process.cwd(), "src/og/fuentes");
const CARPETA_PUBLICA = join(process.cwd(), "public");

/** Tipo según los primeros bytes: varios logos de la ONPE vienen como JPEG aunque se llamen `.png`. */
function tipoImagen(datos: Buffer): string | undefined {
  if (datos.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "image/png";
  if (datos[0] === 0xff && datos[1] === 0xd8) return "image/jpeg";
  return undefined;
}

async function fuente(name: string, archivo: string, weight: Fuente["weight"]): Promise<Fuente> {
  return { name, data: await readFile(join(CARPETA_FUENTES, archivo)), weight, style: "normal" };
}

let fuentes: Promise<Fuente[]> | undefined;

/** Las mismas fuentes de la página, en TTF (`next/og` no lee woff2). Se cargan una sola vez. */
export function cargarFuentes(): Promise<Fuente[]> {
  fuentes ??= Promise.all([
    fuente("Poppins", "Poppins-Medium.ttf", 500),
    fuente("Poppins", "Poppins-Bold.ttf", 700),
    fuente("Poppins", "Poppins-ExtraBold.ttf", 800),
    fuente("Space Mono", "SpaceMono-Bold.ttf", 700),
  ]);
  return fuentes;
}

/** Un archivo de `public/` (`/fotos/…`, `/logos/…`) como data URI, para incrustarlo en la imagen. */
export async function imagenPublica(ruta: string | undefined): Promise<string | undefined> {
  if (!ruta) return undefined;
  const datos = await readFile(join(CARPETA_PUBLICA, ruta));
  const tipo = tipoImagen(datos);
  if (!tipo) return undefined;
  return `data:${tipo};base64,${datos.toString("base64")}`;
}
