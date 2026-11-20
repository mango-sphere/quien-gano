import Link from "next/link";
import { Fragment } from "react";

import type { Miga } from "@/lib/vista";

import styles from "./MigasDePan.module.css";

export function MigasDePan({ migas }: { migas: Miga[] }) {
  return (
    <nav aria-label="Ubicación" className={styles.migas}>
      {migas.map((miga, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span aria-hidden="true" className={styles.separador}>
              /
            </span>
          )}
          {miga.href ? (
            <Link href={miga.href} className={styles.enlace}>
              {miga.nombre}
            </Link>
          ) : (
            <span aria-current="page" className={styles.actual}>
              {miga.nombre}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
