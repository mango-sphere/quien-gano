import { useId } from "react";

import styles from "./Controles.module.css";

export type Filtro = "todas" | "ganador" | "vuelta";
export type Orden = "az" | "mayor" | "menor";

type Opcion<T> = { valor: T; nombre: string };

const ORDENES: Opcion<Orden>[] = [
  { valor: "az", nombre: "A–Z" },
  { valor: "mayor", nombre: "Mayor %" },
  { valor: "menor", nombre: "Menor %" },
];

type PropsFiltro = {
  valor: Filtro;
  onCambiar: (filtro: Filtro) => void;
  conteos: Record<Filtro, number>;
};

export function FiltroEstado({ valor, onCambiar, conteos }: PropsFiltro) {
  const opciones: Opcion<Filtro>[] = [
    { valor: "todas", nombre: "Todas" },
    { valor: "ganador", nombre: "Con ganador" },
    { valor: "vuelta", nombre: "Segunda vuelta" },
  ];
  return (
    <div role="group" aria-label="Mostrar" className={styles.filtro}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => onCambiar(o.valor)}
          className={styles.opcion}
        >
          {o.nombre}
          <span className={styles.conteo}>{conteos[o.valor]}</span>
        </button>
      ))}
    </div>
  );
}

type PropsOrden = {
  valor: Orden;
  onCambiar: (orden: Orden) => void;
};

export function SelectorOrden({ valor, onCambiar }: PropsOrden) {
  const idEtiqueta = useId();
  return (
    <div role="group" aria-labelledby={idEtiqueta} className={styles.orden}>
      <span id={idEtiqueta} className={styles.etiquetaOrden}>
        Ordenar
      </span>
      {ORDENES.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => onCambiar(o.valor)}
          className={styles.opcion}
        >
          {o.nombre}
        </button>
      ))}
    </div>
  );
}

type PropsBusqueda = {
  valor: string;
  onCambiar: (consulta: string) => void;
  /** "Busca tu región" / "Busca tu provincia" / "Busca tu distrito". */
  etiqueta: string;
};

export function CampoBusqueda({ valor, onCambiar, etiqueta }: PropsBusqueda) {
  const idCampo = useId();
  return (
    <div className={styles.busqueda}>
      <label htmlFor={idCampo} className="visualmente-oculto">
        {etiqueta}
      </label>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" className={styles.lupa}>
        <circle cx="11" cy="11" r="7" fill="none" stroke="var(--texto-3)" strokeWidth="2" />
        <path d="M16.5 16.5 L21 21" stroke="var(--texto-3)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id={idCampo}
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={etiqueta}
        autoComplete="off"
        className={styles.campo}
      />
    </div>
  );
}
