import type { Resultado } from "./tipos";

const UMBRAL_PCT = 30;
const VENTAJA_MINIMA = 5;

export type TipoEleccion = "regional" | "alcaldia";

/**
 * Gobierno regional: hay ganador si el primero tiene ≥ 30 % y le saca ≥ 5 puntos al segundo.
 * Alcaldías provinciales y distritales: siempre hay ganador (mayoría simple).
 */
export function vaASegundaVuelta(resultado: Resultado, tipo: TipoEleccion): boolean {
  if (tipo === "alcaldia") return false;
  const primero = parseFloat(resultado.a.pct);
  const segundo = resultado.b ? parseFloat(resultado.b.pct) : 0;
  return !(primero >= UMBRAL_PCT && primero - segundo >= VENTAJA_MINIMA);
}
