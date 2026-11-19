import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.pagina}>
      <h1 className={styles.titulo}>No encontramos ese lugar</h1>
      <p>Puede que el nombre esté mal escrito o que todavía no tengamos sus resultados.</p>
      <Link href="/" className={styles.volver}>
        Ver todo el Perú
      </Link>
    </main>
  );
}
