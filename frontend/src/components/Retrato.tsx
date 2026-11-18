import Image from "next/image";

import type { Candidato } from "@/lib/tipos";

import { LogoPartido } from "./LogoPartido";
import styles from "./Retrato.module.css";

export type TamanoRetrato = { foto: number; logo: number };

type Props = {
  candidato: Candidato;
  tamano: TamanoRetrato;
};

const PROPORCION_FOTO = 5 / 4;

/** Foto del candidato con el logo de su partido superpuesto en la esquina inferior derecha. */
export function Retrato({ candidato, tamano }: Props) {
  const altoFoto = Math.round(tamano.foto * PROPORCION_FOTO);
  return (
    <span
      className={styles.retrato}
      style={{ width: tamano.foto + tamano.logo * 0.4, height: altoFoto + tamano.logo * 0.35 }}
    >
      <span className={styles.foto} style={{ width: tamano.foto, height: altoFoto }}>
        {candidato.photo ? (
          <Image src={candidato.photo} alt="" fill sizes={`${tamano.foto}px`} className={styles.imagen} />
        ) : (
          <SinFoto />
        )}
      </span>
      <span className={styles.logo} style={{ width: tamano.logo, height: tamano.logo }}>
        <LogoPartido candidato={candidato} tamano={tamano.logo} />
      </span>
    </span>
  );
}

function SinFoto() {
  return (
    <span className={styles.sinFoto} aria-hidden="true">
      <span className={styles.rotulo}>Foto</span>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" className={styles.silueta}>
        <circle cx="50" cy="38" r="20" />
        <path d="M8 100 C8 72 26 60 50 60 C74 60 92 72 92 100 Z" />
      </svg>
    </span>
  );
}
