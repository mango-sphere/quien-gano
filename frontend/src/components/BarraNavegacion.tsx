import Link from "next/link";

import type { EstadoDatos } from "@/lib/vista";

import styles from "./BarraNavegacion.module.css";
import { ID_INICIO } from "./Encabezado";

type Props = {
  estadoDatos: EstadoDatos;
  /** En la página de inicio la marca sube al landing; en las demás, lleva a la página de inicio. */
  enInicio: boolean;
};

/** Barra fija, siempre visible, con la marca. */
export function BarraNavegacion({ enInicio }: Props) {
  const marca = (
    <>
      ¿Quién <span className={styles.resaltado}>ganó</span>?
    </>
  );

  return (
    <nav aria-label="Principal" className={styles.barra}>
      <div className={styles.contenedor}>
        {enInicio ? (
          <a href={`#${ID_INICIO}`} className={styles.marca}>
            {marca}
          </a>
        ) : (
          <Link href="/" className={styles.marca}>
            {marca}
          </Link>
        )}
        {/* Fecha de los datos de la ONPE: oculta mientras no haya actualizaciones seguidas. Para mostrarla,
            quita el comentario y vuelve a recibir `estadoDatos` en las props.
        <span className={styles.estadoDatos}>
          <span aria-hidden="true" className={styles.punto} />
          <span>
            <span className={styles.prescindible}>Datos </span>ONPE · {estadoDatos.fecha}
            <span className={styles.prescindible}>, {estadoDatos.hora}</span>
          </span>
        </span>
        */}
      </div>
    </nav>
  );
}
