import { useId } from "react";

import { pluralizar } from "@/lib/texto";
import type { Candidato } from "@/lib/tipos";
import type { Fila, Unidad } from "@/lib/vista";

import { LogoPartido } from "./LogoPartido";
import styles from "./RankingPartidos.module.css";

type Props = {
  filas: Fila[];
  ambito: string;
  unidad: Unidad;
};

type Liderazgo = { lider: Candidato; cantidad: number };

/** Tonos de los tramos por posición; del 5.º en adelante se repite el último. */
const TONOS = ["#00386b", "#2f6fb8", "#7fa8d8", "#a9c4e6"];
const TONO_OTROS = "#c9d2de";

/** Cuántos lugares lidera cada partido: el que va primero, gane directo o vaya a segunda vuelta. */
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

export function RankingPartidos({ filas, ambito, unidad }: Props) {
  const idTitulo = useId();
  const liderazgos = contarLiderazgos(filas);
  const destacados = liderazgos
    .filter((l) => l.cantidad >= 2)
    .map((l, i) => ({ ...l, tono: TONOS[Math.min(i, TONOS.length - 1)] }));
  const enUno = liderazgos.filter((l) => l.cantidad === 1);
  const otros = `${unidad.singular === "distrito" ? "Otros" : "Otras"} ${unidad.plural}`;
  const lugares = (n: number) => pluralizar(n, unidad.singular, unidad.plural);

  return (
    <section className={styles.ranking} aria-labelledby={idTitulo}>
      <div className={styles.encabezado}>
        <h3 id={idTitulo} className={styles.titulo}>
          Quién lidera en {ambito}
        </h3>
        <span className={styles.nota}>{lugares(filas.length)}</span>
      </div>

      <div className={styles.etiquetas}>
        {destacados.map(({ lider, cantidad, tono }) => (
          <div key={lider.party} className={styles.etiqueta} style={{ flex: `${cantidad} 1 0` }}>
            <span className={styles.logoGrande}>
              <LogoPartido candidato={lider} tamano={32} />
            </span>
            <Conteo nombre={lider.party} cantidad={cantidad} tono={tono} />
          </div>
        ))}
        {enUno.length > 0 && (
          <div className={styles.etiqueta} style={{ flex: `${enUno.length} 1 0` }}>
            <Conteo nombre={otros} cantidad={enUno.length} tono={TONO_OTROS} />
          </div>
        )}
      </div>

      <div
        role="img"
        aria-label={liderazgos.map((l) => `${l.lider.party} ${l.cantidad}`).join(", ")}
        className={styles.barra}
      >
        {destacados.map(({ lider, cantidad, tono }) => (
          <div
            key={lider.party}
            title={`${lider.party}: lidera en ${lugares(cantidad)}`}
            className={styles.tramo}
            style={{ flex: `${cantidad} 1 0`, background: tono }}
          />
        ))}
        {enUno.length > 0 && (
          <div
            title={`${otros}: ${enUno.length}`}
            className={styles.tramo}
            style={{ flex: `${enUno.length} 1 0`, background: TONO_OTROS }}
          />
        )}
      </div>

      {enUno.length > 0 && (
        <>
          <h4 className={styles.subtitulo}>
            Partidos que lideran en 1 {unidad.singular} ({enUno.length})
          </h4>
          <ul className={styles.lista}>
            {enUno.map(({ lider }) => (
              <li key={lider.party} className={styles.partido}>
                <span className={styles.logoChico}>
                  <LogoPartido candidato={lider} tamano={24} />
                </span>
                {lider.party}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Conteo({ nombre, cantidad, tono }: { nombre: string; cantidad: number; tono: string }) {
  return (
    <div className={styles.textoEtiqueta}>
      <span className={styles.nombre} title={nombre}>
        {nombre}
      </span>
      <span className={styles.conteo}>
        <span className={styles.muestra} style={{ background: tono }} />
        <span className={styles.numero}>{cantidad}</span>
      </span>
    </div>
  );
}
