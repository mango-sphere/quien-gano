import { BuscadorLugares } from "./BuscadorLugares";
import styles from "./Encabezado.module.css";
import { IlustracionPeru } from "./IlustracionPeru";

export const ID_INICIO = "inicio";
export const ID_RESULTADOS = "resultados";

export function Encabezado() {
  return (
    <section id={ID_INICIO} aria-labelledby="titulo-portada" className={styles.portada}>
      <IlustracionPeru className={styles.ilustracion} />
      <div className={styles.contenido}>
        <span className={styles.antetitulo}>Elecciones Municipales 2026</span>
        <h1 id="titulo-portada" className={styles.titulo}>
          ¿Quién <span className={styles.resaltado}>ganó</span>?
        </h1>
        <p className={styles.bajada}>
          Solo el ganador, o quiénes pasan a segunda vuelta, en tu región, provincia y distrito.
        </p>
        <BuscadorLugares variante="portada" />
        <a href={`#${ID_RESULTADOS}`} className={styles.verResultados}>
          Ver resultados <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
