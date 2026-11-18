/**
 * Contrato de datos del handoff: un objeto indexado por clave.
 *
 * - `REG|<Región>` → gobierno regional
 * - `<Región>|<Provincia>` → alcaldía provincial
 * - `<Región>|<Provincia>|<Distrito>` → alcaldía distrital
 */
export type Candidato = {
  name: string;
  party: string;
  sym?: string;
  /** Porcentaje de votos válidos con 1 decimal, p. ej. `"34.2"`. */
  pct: string;
  logo?: string;
  /** Agregado al contrato del handoff: foto del candidato. Sin ella se muestra el marcador "FOTO". */
  photo?: string;
};

export type Resultado = {
  a: Candidato;
  /** Ausente si solo hubo un candidato. */
  b?: Candidato;
};

export type Resultados = Record<string, Resultado>;

export type Meta = {
  proceso: string;
  generadoEn: string;
  fuente: string;
};
