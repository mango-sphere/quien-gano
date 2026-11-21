import type { EstadoDatos, Vista } from "@/lib/vista";

import { BarraNavegacion } from "./BarraNavegacion";
import { BoletaResultado } from "./BoletaResultado";
import { BotonesCompartir } from "./BotonesCompartir";
import { BuscadorLugares } from "./BuscadorLugares";
import { Encabezado } from "./Encabezado";
import { ListaResultados } from "./ListaResultados";
import { MigasDePan } from "./MigasDePan";
import styles from "./PantallaResultados.module.css";

type Props = {
  vista: Vista;
  estadoDatos: EstadoDatos;
  /** El landing solo va en la página de inicio. */
  conPortada?: boolean;
};

export function PantallaResultados({ vista, estadoDatos, conPortada = false }: Props) {
  // Con landing, el <h1> es "¿Quién ganó?"; sin él, el nombre del lugar es el título de la página.
  const TituloLugar = conPortada ? "h2" : "h1";

  return (
    <>
      <BarraNavegacion estadoDatos={estadoDatos} enInicio={conPortada} />
      {conPortada && <Encabezado />}

      <main className={styles.principal}>
        <div className={styles.ubicacion}>
          <MigasDePan migas={vista.migas} />
          <div className={styles.filaTitulo}>
            <TituloLugar className={styles.titulo}>{vista.titulo}</TituloLugar>
            <BotonesCompartir texto={vista.resumen} />
          </div>
        </div>

        {vista.destacada && <BoletaResultado {...vista.destacada} variante="destacada" />}

        {vista.lista ? (
          <ListaResultados lista={vista.lista} />
        ) : (
          <>
            {!vista.destacada && (
              <p role="status" className={styles.vacio}>
                Sin datos para este lugar todavía.
              </p>
            )}
            <BuscadorLugares variante="lista" />
          </>
        )}
      </main>
    </>
  );
}
