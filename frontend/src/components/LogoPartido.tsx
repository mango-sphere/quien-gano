import Image from "next/image";

import { sigla } from "@/lib/texto";
import type { Candidato } from "@/lib/tipos";

import styles from "./LogoPartido.module.css";

type Props = {
  candidato: Candidato;
  /** Ancho aproximado de la caja que lo contiene, para elegir la resolución de la imagen. */
  tamano: number;
};

/** Logo del partido; si no hay, su sigla. Ocupa el 86 % de la caja contenedora (que debe ser `position: relative`). */
export function LogoPartido({ candidato, tamano }: Props) {
  return (
    <span className={styles.logo} aria-hidden="true">
      {candidato.logo ? (
        <Image src={candidato.logo} alt="" fill sizes={`${tamano}px`} className={styles.imagen} />
      ) : (
        <span className={styles.sigla} style={{ fontSize: Math.max(6, tamano / 5) }}>
          {candidato.sym ?? sigla(candidato.party)}
        </span>
      )}
    </span>
  );
}
