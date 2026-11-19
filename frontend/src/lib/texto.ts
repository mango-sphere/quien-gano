/** Minúsculas y sin tildes, para comparar lo que escribe la persona con los nombres. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es").trim();
}

/** `"San Martín"` → `"san-martin"`. */
export function aSlug(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Respaldo cuando no hay logo: iniciales de las palabras con mayúscula, `"Alianza para el Progreso"` → `"APP"`. */
export function sigla(partido: string): string {
  return partido
    .split(/\s+/)
    .filter((palabra) => /^\p{Lu}/u.test(palabra))
    .map((palabra) => palabra[0])
    .join("")
    .slice(0, 3);
}

export function pluralizar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Ruta de un archivo de `public/` con el `basePath` delante: `next/image` no lo agrega solo. */
export function rutaPublica(ruta: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${ruta}`;
}
