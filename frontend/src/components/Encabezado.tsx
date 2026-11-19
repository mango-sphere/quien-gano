import Link from "next/link";
import { useId } from "react";

import type { RegionMapa } from "@/lib/vista";

import styles from "./Encabezado.module.css";
import { MapaPeru } from "./MapaPeru";

type Props = {
  estadoDatos: string;
  consulta: string;
  onConsulta: (consulta: string) => void;
  etiquetaBuscador: string;
  ejemploBuscador: string;
  regiones: RegionMapa[];
  regionSeleccionada?: string;
};

export function Encabezado({
  estadoDatos,
  consulta,
  onConsulta,
  etiquetaBuscador,
  ejemploBuscador,
  regiones,
  regionSeleccionada,
}: Props) {
  const idBuscador = useId();

  return (
    <header className={styles.encabezado}>
      <div className={styles.contenedor}>
        <div className={styles.portada}>
          <span className={styles.estadoDatos}>{estadoDatos}</span>
          <h1 className={styles.titulo}>
            Quién ganó en <span className={styles.resaltado}>tu distrito</span>
          </h1>
          <p className={styles.bajada}>
            Elecciones Municipales 2026. Solo el ganador, o quiénes pasan a segunda vuelta. Toca tu región en el
            mapa o búscala.
          </p>
          <div className={styles.buscador}>
            <label htmlFor={idBuscador} className={styles.etiquetaBuscador}>
              {etiquetaBuscador}
            </label>
            <input
              id={idBuscador}
              type="search"
              value={consulta}
              onChange={(e) => onConsulta(e.target.value)}
              placeholder={ejemploBuscador}
              autoComplete="off"
              className={styles.campo}
            />
          </div>
        </div>

        <div className={styles.columnaMapa}>
          <div className={styles.cabeceraMapa}>
            <span className={styles.tituloMapa}>Elige en el mapa</span>
            {regionSeleccionada && (
              <Link href="/" className={styles.verPeru}>
                Ver todo el Perú
              </Link>
            )}
          </div>
          <MapaPeru regiones={regiones} seleccionada={regionSeleccionada} />
          <ul className={styles.leyenda}>
            <li>
              <span className={styles.muestra} />
              Ya hay ganador
            </li>
            <li>
              <span className={`${styles.muestra} ${styles.muestraRayada}`} />
              Va a segunda vuelta
            </li>
            <li>
              <span className={styles.muestra} />
              Logo del partido que lidera
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
