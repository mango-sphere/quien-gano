import type { Candidato } from "@/lib/tipos";

import styles from "./Casilla.module.css";
import { LogoPartido } from "./LogoPartido";

type Props = {
  /** Sin candidato es una casilla vacía (la de la leyenda). */
  candidato?: Candidato;
  /** Marcada con X: ganó. Sin marcar (punteada): segunda vuelta. */
  marcada: boolean;
  tamano: number;
};

export function Casilla({ candidato, marcada, tamano }: Props) {
  return (
    <span
      className={`${styles.casilla} ${marcada ? styles.marcada : styles.vacia}`}
      style={{ width: tamano, height: tamano }}
    >
      {candidato && <LogoPartido candidato={candidato} tamano={tamano} />}
      {marcada && <MarcaX />}
    </span>
  );
}

/** X trazada a mano sobre el logo del ganador. */
function MarcaX() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={styles.x}>
      <path d="M16 14 C38 36 62 62 86 88" />
      <path d="M84 12 C62 38 40 60 14 86" />
    </svg>
  );
}
