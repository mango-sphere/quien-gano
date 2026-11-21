
import { DESCRIPCION_SITIO, resumenResultado } from "./compartir";
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

/** Los lugares de un nivel más abajo (las provincias de una región…), con su ranking de partidos. */
export type Lista = {
  titulo: string;
  unidad: Unidad;
  /** "las regiones", "las provincias de Arequipa"… para "Quién lidera en …". */
  ambito: string;
  /** El filtro Todas / Con ganador / Segunda vuelta solo tiene sentido a nivel nacional. */
  conFiltro: boolean;
  filas: Fila[];
};

export type Vista = {
  titulo: string;
  migas: Miga[];
  destacada?: Destacada;
  /** Ausente en un distrito: es el último nivel. */
  lista?: Lista;
  /** El resultado en una línea, para la vista previa y el botón de compartir. */
  resumen: string;
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
    resumen: DESCRIPCION_SITIO,
    lista: {
      titulo: "Gobiernos regionales",
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
    },
  };
}

export function vistaRegion(region: string): Vista {
  const destacada = fila(region, claves.region(region), "regional");
  return {
    titulo: region,
    migas: [{ nombre: "Todo el Perú", href: rutas.nacional() }, { nombre: region }],
    destacada: destacada ? { ...destacada, etiqueta: `Gobierno regional de ${region}` } : undefined,
    resumen: resumenResultado(destacada ?? undefined, `Gobierno regional de ${region}`),
    lista: {
      titulo: "Alcaldías provinciales",
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
    },
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
    resumen: resumenResultado(destacada ?? undefined, `Alcaldía provincial de ${provincia}`),
    lista: {
      titulo: "Alcaldías distritales",
      unidad: { singular: "distrito", plural: "distritos" },
      ambito: `los distritos de ${provincia}`,
      conFiltro: false,
      filas: distritos(region, provincia)
        .map((distrito) =>
          fila(distrito, claves.distrito(region, provincia, distrito), "alcaldia", {
            href: rutas.distrito(region, provincia, distrito),
            texto: "Ver distrito",
          }),
        )
        .filter(existe),
    },
  };
}

export function vistaDistrito(region: string, provincia: string, distrito: string): Vista {
  const destacada = fila(distrito, claves.distrito(region, provincia, distrito), "alcaldia", {
    href: rutas.provincia(region, provincia),
    texto: `Ver los demás distritos de ${provincia}`,
  });
  return {
    titulo: distrito,
    migas: [
      { nombre: "Todo el Perú", href: rutas.nacional() },
      { nombre: region, href: rutas.region(region) },
      { nombre: provincia, href: rutas.provincia(region, provincia) },
      { nombre: distrito },
    ],
    destacada: destacada ? { ...destacada, etiqueta: `Alcaldía distrital de ${distrito}` } : undefined,
    resumen: resumenResultado(destacada ?? undefined, `Alcaldía distrital de ${distrito}`),
  };
}

export type EstadoDatos = { fecha: string; hora: string };

/** Fecha y hora del corte de datos de la ONPE. */
export function estadoDatos(): EstadoDatos {
  const momento = new Date(metaDatos.generadoEn);
  const formato = (opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-PE", { ...opciones, timeZone: "America/Lima" }).format(momento);
  return { fecha: formato({ dateStyle: "medium" }), hora: formato({ timeStyle: "short" }) };
}
