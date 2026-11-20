import type { EstadoDatos } from "@/lib/vista";

import styles from "./BarraNavegacion.module.css";
import { ID_INICIO } from "./Encabezado";

/** Barra fija, siempre visible: la marca (vuelve al inicio) y el estado de los datos. */
export function BarraNavegacion({ estadoDatos }: { estadoDatos: EstadoDatos }) {
  return (
    <nav aria-label="Principal" className={styles.barra}>
      <div className={styles.contenedor}>
        <a href={`#${ID_INICIO}`} className={styles.marca}>
          ¿Quién <span className={styles.resaltado}>ganó</span>?
        </a>
        <span className={styles.estadoDatos}>
          <span aria-hidden="true" className={styles.punto} />
          <span>
            <span className={styles.prescindible}>Datos </span>ONPE · {estadoDatos.fecha}
            <span className={styles.prescindible}>, {estadoDatos.hora}</span> · {estadoDatos.version}
          </span>
        </span>
      </div>
    </nav>
  );
}
