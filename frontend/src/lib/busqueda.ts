import { normalizar } from "./texto";

export type TipoLugar = "región" | "provincia" | "distrito";

/** Un lugar del buscador general. */
export type Lugar = {
  nombre: string;
  tipo: TipoLugar;
  /** Dónde queda, para distinguir nombres repetidos: "La Convención, Cusco". */
  ubicacion?: string;
  href: string;
};

const ORDEN_TIPO: Record<TipoLugar, number> = { región: 0, provincia: 1, distrito: 2 };

/** Qué tan bien coincide: 0 exacto, 1 empieza igual, 2 alguna palabra empieza igual, 3 solo lo contiene. */
function cercania(nombre: string, consulta: string): number | null {
  if (!nombre.includes(consulta)) return null;
  if (nombre === consulta) return 0;
  if (nombre.startsWith(consulta)) return 1;
  if (nombre.split(/[\s-]+/).some((palabra) => palabra.startsWith(consulta))) return 2;
  return 3;
}

/** Los lugares que coinciden con la consulta (sin mayúsculas ni tildes), los más parecidos primero. */
export function buscarLugares(lugares: Lugar[], consulta: string, limite: number): Lugar[] {
  const texto = normalizar(consulta);
  if (texto.length < 2) return [];
  return lugares
    .map((lugar) => ({ lugar, cercania: cercania(normalizar(lugar.nombre), texto) }))
    .filter((x): x is { lugar: Lugar; cercania: number } => x.cercania !== null)
    .sort(
      (x, y) =>
        x.cercania - y.cercania ||
        ORDEN_TIPO[x.lugar.tipo] - ORDEN_TIPO[y.lugar.tipo] ||
        x.lugar.nombre.localeCompare(y.lugar.nombre, "es"),
    )
    .slice(0, limite)
    .map((x) => x.lugar);
}
