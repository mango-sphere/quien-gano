import { useId } from "react";

import styles from "./Encabezado.module.css";

type Props = {
  estadoDatos: string;
  consulta: string;
  onConsulta: (consulta: string) => void;
  etiquetaBuscador: string;
  ejemploBuscador: string;
};

export function Encabezado({ estadoDatos, consulta, onConsulta, etiquetaBuscador, ejemploBuscador }: Props) {
  const idBuscador = useId();

  return (
    <header className={styles.encabezado}>
      <div className={styles.contenedor}>
        <div className={styles.portada}>
          <span className={styles.estadoDatos}>{estadoDatos}</span>
          <h1 className={styles.titulo}>
            ¿Quién <span className={styles.resaltado}>ganó</span>?
          </h1>
        </div>

        <div className={styles.busqueda}>
          <p className={styles.bajada}>
            Elecciones Municipales 2026. Solo el ganador, o quiénes pasan a segunda vuelta. Busca tu región o
            elígela en la lista.
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
      </div>
    </header>
  );
}
