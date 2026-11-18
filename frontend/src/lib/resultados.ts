import meta from "@/data/meta.json";
import datos from "@/data/resultados.json";

import { aSlug } from "./texto";
import type { Meta, Resultado, Resultados } from "./tipos";

const resultados: Resultados = datos;

type Arbol = Map<string, Map<string, string[]>>;

/** Región → provincia → distritos, reconstruido a partir de las claves del contrato. */
function construirArbol(): Arbol {
  const raiz: Arbol = new Map();
  const provinciasDe = (region: string) => {
    if (!raiz.has(region)) raiz.set(region, new Map());
    return raiz.get(region)!;
  };

  for (const clave of Object.keys(resultados)) {
    const partes = clave.split("|");
    if (partes[0] === "REG") {
      provinciasDe(partes[1]);
      continue;
    }
    const [region, provincia, distrito] = partes;
    const provinciasRegion = provinciasDe(region);
    if (!provinciasRegion.has(provincia)) provinciasRegion.set(provincia, []);
    if (distrito) provinciasRegion.get(provincia)!.push(distrito);
  }
  return raiz;
}

const arbol = construirArbol();

export const metaDatos: Meta = meta;

export const claves = {
  region: (region: string) => `REG|${region}`,
  provincia: (region: string, provincia: string) => `${region}|${provincia}`,
  distrito: (region: string, provincia: string, distrito: string) => `${region}|${provincia}|${distrito}`,
};

export function resultado(clave: string): Resultado | undefined {
  return resultados[clave];
}

export function regiones(): string[] {
  return [...arbol.keys()];
}

export function provincias(region: string): string[] {
  return [...(arbol.get(region)?.keys() ?? [])];
}

export function distritos(region: string, provincia: string): string[] {
  return arbol.get(region)?.get(provincia) ?? [];
}

export function regionPorSlug(slug: string): string | undefined {
  return regiones().find((r) => aSlug(r) === slug);
}

export function provinciaPorSlug(region: string, slug: string): string | undefined {
  return provincias(region).find((p) => aSlug(p) === slug);
}

export const rutas = {
  nacional: () => "/",
  region: (region: string) => `/${aSlug(region)}`,
  provincia: (region: string, provincia: string) => `/${aSlug(region)}/${aSlug(provincia)}`,
};
