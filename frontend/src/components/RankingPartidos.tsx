import { useId, type ReactNode } from "react";

import { pluralizar } from "@/lib/texto";
import type { Candidato } from "@/lib/tipos";
import type { Fila, Unidad } from "@/lib/vista";

import { LogoPartido } from "./LogoPartido";
import styles from "./RankingPartidos.module.css";

type Props = {
  filas: Fila[];
  ambito: string;
  unidad: Unidad;
  /** Controles que van junto al título (el filtro, a nivel nacional). */
  children?: ReactNode;
};

type Liderazgo = { lider: Candidato; cantidad: number };

function contarLiderazgos(filas: Fila[]): Liderazgo[] {
  const porPartido = new Map<string, Liderazgo>();
  for (const { resultado } of filas) {
    const actual = porPartido.get(resultado.a.party);
    porPartido.set(resultado.a.party, { lider: resultado.a, cantidad: (actual?.cantidad ?? 0) + 1 });
  }
  return [...porPartido.values()].sort(
    (x, y) => y.cantidad - x.cantidad || x.lider.party.localeCompare(y.lider.party, "es"),
  );
}

export function RankingPartidos({ filas, ambito, unidad, children }: Props) {
  const liderazgos = contarLiderazgos(filas);
  const maximo = liderazgos[0]?.cantidad ?? 1;
  const idTitulo = useId();

  return (
    <section className={styles.ranking} aria-labelledby={idTitulo}>
      <div className={styles.encabezado}>
        <h3 id={idTitulo} className={styles.titulo}>
          Quién lidera en {ambito}
        </h3>
        {children}
      </div>
      <ul className={styles.lista}>
        {liderazgos.map(({ lider, cantidad }) => (
          <li key={lider.party} className={styles.partido}>
            <span className={styles.logo}>
              <LogoPartido candidato={lider} tamano={44} />
            </span>
            <div className={styles.datos}>
              <div className={styles.textos}>
                <span className={styles.nombre}>{lider.party}</span>
                <span className={styles.cantidad}>
                  lidera en {pluralizar(cantidad, unidad.singular, unidad.plural)}
                </span>
              </div>
              <div className={styles.barra} aria-hidden="true">
                <div className={styles.relleno} style={{ width: `${(cantidad / maximo) * 100}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
