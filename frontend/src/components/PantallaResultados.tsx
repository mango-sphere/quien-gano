"use client";

import { useState } from "react";

import { normalizar, pluralizar } from "@/lib/texto";
import type { Fila, RegionMapa, Vista } from "@/lib/vista";

import { BoletaResultado } from "./BoletaResultado";
import { FiltroEstado, SelectorOrden, type Filtro, type Orden } from "./Controles";
import { Encabezado } from "./Encabezado";
import { MigasDePan } from "./MigasDePan";
import styles from "./PantallaResultados.module.css";
import { RankingPartidos } from "./RankingPartidos";

type Props = {
  vista: Vista;
  regionesMapa: RegionMapa[];
  estadoDatos: string;
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

export function PantallaResultados({ vista, regionesMapa, estadoDatos }: Props) {
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
      <Encabezado
        estadoDatos={estadoDatos}
        consulta={consulta}
        onConsulta={setConsulta}
        etiquetaBuscador={`Busca tu ${unidad.singular}`}
        ejemploBuscador={filas[0] ? `Ej. ${filas[0].lugar}` : ""}
        regiones={regionesMapa}
        regionSeleccionada={vista.regionSeleccionada}
      />

      <main className={styles.principal}>
        <div className={styles.ubicacion}>
          <MigasDePan migas={vista.migas} />
          <h2 className={styles.titulo}>{vista.titulo}</h2>
        </div>

        {vista.destacada && <BoletaResultado {...vista.destacada} variante="destacada" />}

        <RankingPartidos filas={filas} ambito={vista.ambito} unidad={unidad}>
          {vista.conFiltro && <FiltroEstado valor={filtro} onCambiar={setFiltro} conteos={conteos} />}
        </RankingPartidos>

        <div className={styles.cabeceraLista}>
          <h3 className={styles.tituloLista}>
            {vista.tituloLista}{" "}
            <span className={styles.cantidad}>· {pluralizar(visibles.length, unidad.singular, unidad.plural)}</span>
          </h3>
          <SelectorOrden valor={orden} onCambiar={setOrden} />
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
