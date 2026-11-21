"use client";

import { useState } from "react";

import { pluralizar } from "@/lib/texto";
import type { Fila, Lista } from "@/lib/vista";

import { BoletaResultado } from "./BoletaResultado";
import { BuscadorLugares } from "./BuscadorLugares";
import { FiltroEstado, SelectorOrden, type Filtro, type Orden } from "./Controles";
import { ID_RESULTADOS } from "./Encabezado";
import styles from "./PantallaResultados.module.css";
import { RankingPartidos } from "./RankingPartidos";

const pct = (f: Fila) => parseFloat(f.resultado.a.pct);

const COMPARADORES: Record<Orden, (x: Fila, y: Fila) => number> = {
  az: (x, y) => x.lugar.localeCompare(y.lugar, "es"),
  mayor: (x, y) => pct(y) - pct(x),
  menor: (x, y) => pct(x) - pct(y),
};

const CUMPLE_FILTRO: Record<Filtro, (f: Fila) => boolean> = {
  todas: () => true,
  ganador: (f) => !f.segundaVuelta,
  vuelta: (f) => f.segundaVuelta,
};

/** Quién lidera y la lista de lugares del nivel de abajo, con filtro y orden. */
export function ListaResultados({ lista }: { lista: Lista }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [orden, setOrden] = useState<Orden>("az");

  const { filas, unidad } = lista;
  const visibles = filas.filter(CUMPLE_FILTRO[filtro]).sort(COMPARADORES[orden]);

  const conteos: Record<Filtro, number> = {
    todas: filas.length,
    ganador: filas.filter(CUMPLE_FILTRO.ganador).length,
    vuelta: filas.filter(CUMPLE_FILTRO.vuelta).length,
  };

  return (
    <>
      <RankingPartidos filas={filas} ambito={lista.ambito} unidad={unidad} />

      <div id={ID_RESULTADOS} className={styles.cabeceraLista}>
        <BuscadorLugares variante="lista" />
        <h3 className={styles.tituloLista}>
          {lista.titulo}{" "}
          <span className={styles.cantidad}>· {pluralizar(visibles.length, unidad.singular, unidad.plural)}</span>
        </h3>
        <div className={styles.controles}>
          {lista.conFiltro && <FiltroEstado valor={filtro} onCambiar={setFiltro} conteos={conteos} />}
          <SelectorOrden valor={orden} onCambiar={setOrden} />
        </div>
      </div>

      {visibles.length > 0 ? (
        <ol className={styles.lista}>
          {visibles.map((f, i) => (
            <li key={f.lugar} className={styles.elemento}>
              <BoletaResultado {...f} variante="fila" numero={i + 1} />
            </li>
          ))}
        </ol>
      ) : (
        <p role="status" className={styles.vacio}>
          {filas.length > 0 ? "Ningún resultado con ese filtro." : "Sin datos para este lugar todavía."}
        </p>
      )}
    </>
  );
}
