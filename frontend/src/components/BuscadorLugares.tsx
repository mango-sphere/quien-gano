"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type KeyboardEvent } from "react";

import { buscarLugares, type Lugar } from "@/lib/busqueda";
import { pluralizar, rutaPublica } from "@/lib/texto";

import styles from "./BuscadorLugares.module.css";

const MAXIMO_SUGERENCIAS = 8;

type Estado = "sin-cargar" | "cargando" | "listo" | "error";

type Props = {
  /** "portada": grande, sobre el landing. "lista": en la fila de la lista de resultados. */
  variante: "portada" | "lista";
};

/** Buscador general: cualquier región, provincia o distrito, y lleva directo a sus resultados. */
export function BuscadorLugares({ variante }: Props) {
  const router = useRouter();
  const id = useId();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [estado, setEstado] = useState<Estado>("sin-cargar");
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  const sugerencias = buscarLugares(lugares, consulta, MAXIMO_SUGERENCIAS);
  const mostrarLista = abierto && consulta.trim().length >= 2 && estado !== "sin-cargar";

  async function cargarIndice() {
    if (estado !== "sin-cargar") return;
    setEstado("cargando");
    try {
      const respuesta = await fetch(rutaPublica("/lugares.json"));
      if (!respuesta.ok) throw new Error(`${respuesta.status}`);
      setLugares(await respuesta.json());
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }

  function ir(lugar: Lugar) {
    setAbierto(false);
    setConsulta("");
    // Los distritos llevan a una tarjeta dentro de la página de su provincia: con una navegación
    // normal el navegador baja hasta el ancla y la marca con :target para resaltarla.
    if (lugar.tipo === "distrito") window.location.assign(rutaPublica(lugar.href));
    else router.push(lugar.href);
  }

  function alPresionarTecla(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAbierto(false);
      return;
    }
    if (!sugerencias.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAbierto(true);
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActivo((a) => (a + paso + sugerencias.length) % sugerencias.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      ir(sugerencias[Math.min(activo, sugerencias.length - 1)]);
    }
  }

  const idLista = `${id}-lista`;
  const idOpcion = (i: number) => `${id}-opcion-${i}`;

  return (
    <div className={`${styles.buscador} ${styles[variante]}`}>
      <label htmlFor={id} className="visualmente-oculto">
        Busca tu región, provincia o distrito
      </label>
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.lupa}>
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 16.5 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrarLista}
        aria-controls={idLista}
        aria-activedescendant={mostrarLista && sugerencias.length ? idOpcion(activo) : undefined}
        value={consulta}
        onFocus={cargarIndice}
        onChange={(e) => {
          setConsulta(e.target.value);
          setActivo(0);
          setAbierto(true);
        }}
        onKeyDown={alPresionarTecla}
        onBlur={() => setAbierto(false)}
        placeholder="Busca tu región, provincia o distrito"
        autoComplete="off"
        className={styles.campo}
      />

      <ul id={idLista} role="listbox" hidden={!mostrarLista} className={styles.sugerencias}>
        {sugerencias.map((lugar, i) => (
          <li
            key={lugar.href}
            id={idOpcion(i)}
            role="option"
            aria-selected={i === activo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => ir(lugar)}
            onMouseEnter={() => setActivo(i)}
            className={styles.sugerencia}
          >
            <span className={styles.nombre}>{lugar.nombre}</span>
            <span className={styles.detalle}>
              {lugar.tipo}
              {lugar.ubicacion && ` · ${lugar.ubicacion}`}
            </span>
          </li>
        ))}
        {estado === "listo" && sugerencias.length === 0 && (
          <li className={styles.aviso}>No encontramos «{consulta.trim()}».</li>
        )}
        {estado === "cargando" && <li className={styles.aviso}>Cargando lugares…</li>}
        {estado === "error" && <li className={styles.aviso}>No se pudo cargar el buscador. Intenta de nuevo.</li>}
      </ul>

      <p role="status" className="visualmente-oculto">
        {mostrarLista && estado === "listo" ? pluralizar(sugerencias.length, "lugar encontrado", "lugares encontrados") : ""}
      </p>
    </div>
  );
}
