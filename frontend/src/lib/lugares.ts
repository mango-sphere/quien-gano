import type { Lugar } from "./busqueda";
import { distritos, provincias, regiones, rutas } from "./resultados";

/** Todas las regiones, provincias y distritos, cada uno con el enlace a su página. */
export function indiceLugares(): Lugar[] {
  return regiones().flatMap((region) => [
    { nombre: region, tipo: "región" as const, href: `${rutas.region(region)}/` },
    ...provincias(region).flatMap((provincia) => [
      { nombre: provincia, tipo: "provincia" as const, ubicacion: region, href: `${rutas.provincia(region, provincia)}/` },
      ...distritos(region, provincia).map((distrito) => ({
        nombre: distrito,
        tipo: "distrito" as const,
        ubicacion: `${provincia}, ${region}`,
        href: `${rutas.distrito(region, provincia, distrito)}/`,
      })),
    ]),
  ]);
}
