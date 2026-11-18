"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, type MouseEvent } from "react";

import type { Candidato } from "@/lib/tipos";
import type { Fila } from "@/lib/vista";

import styles from "./BoletaResultado.module.css";
import { Casilla } from "./Casilla";

type Props = Fila &
  (
    | { variante: "fila"; numero: number }
    | { variante: "destacada"; etiqueta: string }
  );

const TAMANOS = {
  fila: { casilla: 84, nombre: styles.nombreFila, pct: styles.pctFila },
  destacada: { casilla: 120, nombre: styles.nombreDestacada, pct: styles.pctDestacada },
};

export function BoletaResultado(props: Props) {
  const { lugar, resultado, segundaVuelta, enlace, variante } = props;
  const router = useRouter();
  const idTitulo = useId();

  const abrir = (e: MouseEvent<HTMLElement>) => {
    if (!enlace || (e.target as HTMLElement).closest("a")) return;
    router.push(enlace.href);
  };

  const Titulo = variante === "destacada" ? "h3" : "h4";

  return (
    <article
      aria-labelledby={idTitulo}
      onClick={enlace ? abrir : undefined}
      className={[
        styles.boleta,
        variante === "destacada" ? styles.destacada : styles.fila,
        enlace && styles.abrible,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {variante === "fila" && (
        <div aria-hidden="true" className={styles.numero}>
          {String(props.numero).padStart(2, "0")}
        </div>
      )}
      <div className={styles.contenido}>
        <header className={`${styles.cabecera} ${segundaVuelta ? styles.cabeceraVuelta : styles.cabeceraGanador}`}>
          <div className={styles.lugar}>
            {variante === "destacada" && <span className={styles.etiquetaCargo}>{props.etiqueta}</span>}
            <Titulo id={idTitulo} className={variante === "destacada" ? styles.lugarDestacado : styles.lugarFila}>
              {lugar}
            </Titulo>
          </div>
          <EtiquetaEstado segundaVuelta={segundaVuelta} />
        </header>

        {segundaVuelta && resultado.b ? (
          <SegundaVuelta a={resultado.a} b={resultado.b} />
        ) : (
          <Ganador candidato={resultado.a} {...TAMANOS[variante]} />
        )}

        {enlace && (
          <Link href={enlace.href} className={styles.abrir}>
            {enlace.texto}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

function EtiquetaEstado({ segundaVuelta }: { segundaVuelta: boolean }) {
  return (
    <span className={`${styles.estado} ${segundaVuelta ? styles.estadoVuelta : styles.estadoGanador}`}>
      {segundaVuelta ? "Segunda vuelta" : "Ganador"}
    </span>
  );
}

function Ganador({ candidato, casilla, nombre, pct }: { candidato: Candidato } & (typeof TAMANOS)["fila"]) {
  return (
    <div className={styles.ganador}>
      <Casilla candidato={candidato} marcada tamano={casilla} />
      <div className={styles.persona}>
        <span className={nombre}>{candidato.name}</span>
        <span className={styles.partido}>{candidato.party}</span>
      </div>
      <span className={`${styles.pct} ${pct}`}>
        {candidato.pct}
        <span className={styles.signoPct}>%</span>
      </span>
    </div>
  );
}

function SegundaVuelta({ a, b }: { a: Candidato; b: Candidato }) {
  return (
    <>
      <div className={styles.dosColumnas}>
        <Finalista candidato={a} lado="izquierda" />
        <Finalista candidato={b} lado="derecha" />
      </div>
      <p className={styles.nota}>Nadie llegó al 30 % con 5 puntos de ventaja: se vuelve a votar.</p>
    </>
  );
}

function Finalista({ candidato, lado }: { candidato: Candidato; lado: "izquierda" | "derecha" }) {
  return (
    <div className={`${styles.finalista} ${styles[lado]}`}>
      <Casilla candidato={candidato} marcada={false} tamano={62} />
      <span className={styles.pctFinalista}>{candidato.pct}%</span>
      <span className={styles.nombreFinalista}>{candidato.name}</span>
      <span className={styles.partidoFinalista}>{candidato.party}</span>
    </div>
  );
}
