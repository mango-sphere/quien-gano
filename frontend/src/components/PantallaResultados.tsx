"use client";

import { useState } from "react";

import { normalizar, pluralizar } from "@/lib/texto";
import type { EstadoDatos, Fila, Vista } from "@/lib/vista";

import { BarraNavegacion } from "./BarraNavegacion";
import { BoletaResultado } from "./BoletaResultado";
import { CampoBusqueda, FiltroEstado, SelectorOrden, type Filtro, type Orden } from "./Controles";
import { Encabezado, ID_RESULTADOS } from "./Encabezado";
import { MigasDePan } from "./MigasDePan";
import styles from "./PantallaResultados.module.css";
import { RankingPartidos } from "./RankingPartidos";

type Props = {
  vista: Vista;
  estadoDatos: EstadoDatos;
};

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

export function PantallaResultados({ vista, estadoDatos }: Props) {
  const [consulta, setConsulta] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [orden, setOrden] = useState<Orden>("az");

  const { filas, unidad } = vista;
  const texto = normalizar(consulta);
  const visibles = filas
    .filter((f) => normalizar(f.lugar).includes(texto) && CUMPLE_FILTRO[filtro](f))
    .sort(COMPARADORES[orden]);

  const conteos: Record<Filtro, number> = {
    todas: filas.length,
    ganador: filas.filter(CUMPLE_FILTRO.ganador).length,
    vuelta: filas.filter(CUMPLE_FILTRO.vuelta).length,
  };

  return (
    <>
      <BarraNavegacion estadoDatos={estadoDatos} />
      <Encabezado />

      <main id={ID_RESULTADOS} className={styles.principal}>
        <div className={styles.ubicacion}>
          <MigasDePan migas={vista.migas} />
          <h2 className={styles.titulo}>{vista.titulo}</h2>
        </div>

        {vista.destacada && <BoletaResultado {...vista.destacada} variante="destacada" />}

        <RankingPartidos filas={filas} ambito={vista.ambito} unidad={unidad} />

        <div className={styles.cabeceraLista}>
          <h3 className={styles.tituloLista}>
            {vista.tituloLista}{" "}
            <span className={styles.cantidad}>· {pluralizar(visibles.length, unidad.singular, unidad.plural)}</span>
          </h3>
          <div className={styles.controles}>
            <CampoBusqueda
              valor={consulta}
              onCambiar={setConsulta}
              etiqueta={`Busca tu ${unidad.singular}`}
            />
            {vista.conFiltro && <FiltroEstado valor={filtro} onCambiar={setFiltro} conteos={conteos} />}
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
            {filas.length > 0 ? "Ningún resultado con ese nombre o filtro." : "Sin datos para este lugar todavía."}
          </p>
        )}
      </main>
    </>
  );
}
