import { idTarjeta, type Lugar } from "./busqueda";
import { distritos, provincias, regiones, rutas } from "./resultados";

/** Todas las regiones, provincias y distritos. Los distritos no tienen página: llevan a su tarjeta. */
export function indiceLugares(): Lugar[] {
  return regiones().flatMap((region) => [
    { nombre: region, tipo: "región" as const, href: `${rutas.region(region)}/` },
    ...provincias(region).flatMap((provincia) => [
      { nombre: provincia, tipo: "provincia" as const, ubicacion: region, href: `${rutas.provincia(region, provincia)}/` },
      ...distritos(region, provincia).map((distrito) => ({
        nombre: distrito,
        tipo: "distrito" as const,
        ubicacion: `${provincia}, ${region}`,
        href: `${rutas.provincia(region, provincia)}/#${idTarjeta(distrito)}`,
      })),
    ]),
  ]);
}
