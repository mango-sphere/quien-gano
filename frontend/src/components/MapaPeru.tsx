"use client";

import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useState } from "react";

import mapa from "@/data/peru-regiones.json";
import type { RegionMapa } from "@/lib/vista";

import { LogoPartido } from "./LogoPartido";
import styles from "./MapaPeru.module.css";

type Geometria = { d: string; centroide: number[] };

const [, , ANCHO, ALTO] = mapa.viewBox;
const GEOMETRIAS: Record<string, Geometria> = mapa.regiones;
/** Se superpone con Lima: no lleva logo encima. */
const SIN_LOGO = new Set(["Callao"]);

type Props = {
  regiones: RegionMapa[];
  seleccionada?: string;
};

function posicion([x, y]: number[]) {
  return { left: `${(x / ANCHO) * 100}%`, top: `${(y / ALTO) * 100}%` };
}

function descripcion({ nombre, lider, segundaVuelta }: RegionMapa): string {
  return segundaVuelta
    ? `${nombre}: va a segunda vuelta, lidera ${lider.party} con ${lider.pct}%`
    : `${nombre}: ganó ${lider.party} con ${lider.pct}%`;
}

export function MapaPeru({ regiones, seleccionada }: Props) {
  const router = useRouter();
  const idRayado = useId();
  const [enfocada, setEnfocada] = useState<string | null>(null);

  // La página se oculta (no se desmonta) al navegar: sin esto, el globo quedaría abierto al volver.
  useLayoutEffect(() => () => setEnfocada(null), []);

  const atenuada = (nombre: string) => Boolean(seleccionada) && nombre !== seleccionada && nombre !== enfocada;
  const conGlobo = regiones.find((r) => r.nombre === (enfocada ?? seleccionada));
  // El borde amarillo va en una capa aparte, encima de todo: reordenar los botones para
  // dibujarlo arriba movería el foco y rompería el orden de tabulación.
  const realzadas: { nombre: string; clase: string }[] = [];
  if (enfocada && enfocada !== seleccionada) realzadas.push({ nombre: enfocada, clase: styles.trazoEnfocado });
  if (seleccionada && GEOMETRIAS[seleccionada]) realzadas.push({ nombre: seleccionada, clase: styles.trazoElegido });

  return (
    <div className={styles.mapa}>
      <svg width="0" height="0" aria-hidden="true" className={styles.definiciones}>
        <defs>
          <pattern id={idRayado} patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
            <rect width="9" height="9" fill="#ffffff" />
            <rect width="3.5" height="9" fill="var(--mapa-rayado)" />
          </pattern>
        </defs>
      </svg>

      {regiones.map((region) => {
        const geometria = GEOMETRIAS[region.nombre];
        if (!geometria) return null;
        return (
          <button
            key={region.nombre}
            type="button"
            aria-label={descripcion(region)}
            aria-pressed={region.nombre === seleccionada}
            onClick={() => router.push(region.href)}
            onMouseEnter={() => setEnfocada(region.nombre)}
            onMouseLeave={() => setEnfocada(null)}
            onFocus={() => setEnfocada(region.nombre)}
            onBlur={() => setEnfocada(null)}
            className={styles.region}
          >
            <svg viewBox={mapa.viewBox.join(" ")} aria-hidden="true" className={styles.lienzo}>
              <path
                d={geometria.d}
                fill={region.segundaVuelta ? `url(#${idRayado})` : "#ffffff"}
                fillOpacity={atenuada(region.nombre) ? 0.45 : 1}
                className={styles.trazo}
              />
            </svg>
          </button>
        );
      })}

      <svg viewBox={mapa.viewBox.join(" ")} aria-hidden="true" className={`${styles.lienzo} ${styles.capaRealce}`}>
        {realzadas.map(({ nombre, clase }) => (
          <path key={nombre} d={GEOMETRIAS[nombre].d} className={`${styles.realce} ${clase}`} />
        ))}
      </svg>

      {regiones
        .filter((r) => !SIN_LOGO.has(r.nombre) && GEOMETRIAS[r.nombre])
        .map((region) => (
          <span
            key={region.nombre}
            aria-hidden="true"
            className={styles.marca}
            style={{ ...posicion(GEOMETRIAS[region.nombre].centroide), opacity: atenuada(region.nombre) ? 0.45 : 1 }}
          >
            <LogoPartido candidato={region.lider} tamano={32} />
          </span>
        ))}

      {conGlobo && GEOMETRIAS[conGlobo.nombre] && (
        <div aria-hidden="true" className={styles.globo} style={posicion(GEOMETRIAS[conGlobo.nombre].centroide)}>
          <div className={styles.globoCaja}>
            <span className={styles.globoLogo}>
              <LogoPartido candidato={conGlobo.lider} tamano={40} />
            </span>
            <span className={styles.globoTextos}>
              <span className={styles.globoNombre}>{conGlobo.nombre}</span>
              <span className={styles.globoDetalle}>
                {conGlobo.lider.pct}% · {conGlobo.segundaVuelta ? "va a 2ª vuelta" : "ganó"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
