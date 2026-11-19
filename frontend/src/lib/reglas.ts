import type { Resultado } from "./tipos";

const UMBRAL_PCT = 30;

export type TipoEleccion = "regional" | "alcaldia";

/**
 * Gobierno regional: hay ganador si el primero tiene ≥ 30 % de los votos válidos; si no,
 * los dos primeros van a segunda vuelta.
 * Alcaldías provinciales y distritales: siempre hay ganador (mayoría simple).
 */
export function vaASegundaVuelta(resultado: Resultado, tipo: TipoEleccion): boolean {
  if (tipo === "alcaldia") return false;
  return parseFloat(resultado.a.pct) < UMBRAL_PCT;
}
