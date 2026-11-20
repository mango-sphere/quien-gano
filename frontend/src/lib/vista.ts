import { version } from "../../package.json";

import { vaASegundaVuelta, type TipoEleccion } from "./reglas";
import { claves, distritos, metaDatos, provincias, regiones, resultado, rutas } from "./resultados";
import type { Resultado } from "./tipos";

export type Fila = {
  lugar: string;
  resultado: Resultado;
  segundaVuelta: boolean;
  enlace?: { href: string; texto: string };
};

export type Destacada = Fila & { etiqueta: string };

export type Miga = { nombre: string; href?: string };

export type Unidad = { singular: string; plural: string };

export type Vista = {
  titulo: string;
  migas: Miga[];
  destacada?: Destacada;
  tituloLista: string;
  unidad: Unidad;
  /** "las regiones", "las provincias de Arequipa"… para "Quién lidera en …". */
  ambito: string;
  /** El filtro Todas / Con ganador / Segunda vuelta solo tiene sentido a nivel nacional. */
  conFiltro: boolean;
  filas: Fila[];
};

function fila(lugar: string, clave: string, tipo: TipoEleccion, enlace?: Fila["enlace"]): Fila | null {
  const r = resultado(clave);
  if (!r) return null;
  return { lugar, resultado: r, segundaVuelta: vaASegundaVuelta(r, tipo), enlace };
}

const existe = <T>(x: T | null): x is T => x !== null;

export function vistaNacional(): Vista {
  return {
    titulo: "Todo el Perú",
    migas: [{ nombre: "Todo el Perú" }],
    tituloLista: "Gobiernos regionales",
    unidad: { singular: "región", plural: "regiones" },
    ambito: "las regiones",
    conFiltro: true,
    filas: regiones()
      .map((region) =>
        fila(region, claves.region(region), "regional", {
          href: rutas.region(region),
          texto: `Ver provincias de ${region}`,
        }),
      )
      .filter(existe),
  };
}

export function vistaRegion(region: string): Vista {
  const destacada = fila(region, claves.region(region), "regional");
  return {
    titulo: region,
    migas: [{ nombre: "Todo el Perú", href: rutas.nacional() }, { nombre: region }],
    destacada: destacada ? { ...destacada, etiqueta: `Gobierno regional de ${region}` } : undefined,
    tituloLista: "Alcaldías provinciales",
    unidad: { singular: "provincia", plural: "provincias" },
    ambito: `las provincias de ${region}`,
    conFiltro: false,
    filas: provincias(region)
      .map((provincia) =>
        fila(provincia, claves.provincia(region, provincia), "alcaldia", {
          href: rutas.provincia(region, provincia),
          texto: "Ver distritos",
        }),
      )
      .filter(existe),
  };
}

export function vistaProvincia(region: string, provincia: string): Vista {
  const destacada = fila(provincia, claves.provincia(region, provincia), "alcaldia");
  return {
    titulo: provincia,
    migas: [
      { nombre: "Todo el Perú", href: rutas.nacional() },
      { nombre: region, href: rutas.region(region) },
      { nombre: provincia },
    ],
    destacada: destacada ? { ...destacada, etiqueta: `Alcaldía provincial de ${provincia}` } : undefined,
    tituloLista: "Alcaldías distritales",
    unidad: { singular: "distrito", plural: "distritos" },
    ambito: `los distritos de ${provincia}`,
    conFiltro: false,
    filas: distritos(region, provincia)
      .map((distrito) => fila(distrito, claves.distrito(region, provincia, distrito), "alcaldia"))
      .filter(existe),
  };
}

export type EstadoDatos = { fecha: string; hora: string; version: string };

/** Fecha y hora del corte de datos de la ONPE y versión publicada de la página. */
export function estadoDatos(): EstadoDatos {
  const momento = new Date(metaDatos.generadoEn);
  const formato = (opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-PE", { ...opciones, timeZone: "America/Lima" }).format(momento);
  return { fecha: formato({ dateStyle: "medium" }), hora: formato({ timeStyle: "short" }), version: `v${version}` };
}
