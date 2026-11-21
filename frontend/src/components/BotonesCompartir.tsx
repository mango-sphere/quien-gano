"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import styles from "./BotonesCompartir.module.css";

const MS_AVISO = 2500;

type Aviso = "" | "copiado" | "error";

/** El navegador no cambia de capacidades en vivo: no hay nada a qué suscribirse. */
const sinSuscripcion = () => () => {};

/**
 * Algunos navegadores dentro de apps (Facebook, Instagram) niegan `navigator.clipboard`; ahí todavía
 * funciona el método antiguo: seleccionar un campo oculto y copiar.
 */
function copiarConSeleccion(texto: string): boolean {
  const campo = document.createElement("textarea");
  campo.value = texto;
  campo.setAttribute("readonly", "");
  campo.style.position = "fixed";
  campo.style.opacity = "0";
  document.body.append(campo);
  campo.select();
  const copiado = document.execCommand("copy");
  campo.remove();
  return copiado;
}

/** Enlace de la página actual, sin `#` ni parámetros, para que la vista previa sea la de esta página. */
function enlaceActual(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

type Props = {
  /** El resultado en una línea; va junto al enlace. */
  texto: string;
};

/**
 * "Compartir" abre el menú del sistema (celular) o copia el enlace (computadora sin ese menú).
 * WhatsApp va aparte porque es por donde más se comparte, también desde la computadora.
 */
export function BotonesCompartir({ texto }: Props) {
  const menuNativo = useSyncExternalStore(
    sinSuscripcion,
    () => typeof navigator.share === "function",
    () => false,
  );
  const [aviso, setAviso] = useState<Aviso>("");
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function avisar(nuevo: Aviso) {
    setAviso(nuevo);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(""), MS_AVISO);
  }

  async function compartir() {
    const url = enlaceActual();
    if (menuNativo) {
      try {
        await navigator.share({ title: document.title, text: texto, url });
      } catch (error) {
        // Cerrar el menú sin elegir una app no es un error.
        if (!(error instanceof DOMException && error.name === "AbortError")) avisar("error");
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      avisar("copiado");
    } catch {
      avisar(copiarConSeleccion(url) ? "copiado" : "error");
    }
  }

  function compartirPorWhatsApp() {
    const mensaje = `${texto}\n${enlaceActual()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.botones}>
      <button type="button" onClick={compartir} className={styles.boton}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icono}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {menuNativo ? "Compartir" : "Copiar enlace"}
      </button>
      <button type="button" onClick={compartirPorWhatsApp} className={`${styles.boton} ${styles.whatsapp}`}>
        <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icono}>
          <path d="M13.6 2.3A7.9 7.9 0 0 0 8 0C3.6 0 .1 3.6.1 7.9c0 1.4.4 2.8 1.1 4L0 16l4.2-1.1c1.2.6 2.5 1 3.8 1 4.4 0 7.9-3.6 7.9-7.9 0-2.1-.8-4.1-2.3-5.6zM8 14.5c-1.2 0-2.4-.3-3.4-.9l-.2-.1-2.5.7.7-2.4-.2-.3a6.5 6.5 0 0 1-1-3.5C1.4 4.3 4.4 1.3 8 1.3c1.8 0 3.4.7 4.7 1.9a6.6 6.6 0 0 1 1.9 4.7c0 3.6-3 6.6-6.6 6.6zm3.6-4.9c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1l-.6.8c-.1.1-.2.1-.4 0-.2-.1-.8-.3-1.6-1-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4l.3-.4.2-.3v-.4l-.6-1.5c-.2-.4-.3-.3-.5-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 4 3.5.6.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.5-.2z" />
        </svg>
        WhatsApp
      </button>
      <p role="status" className={aviso ? styles.aviso : "visualmente-oculto"}>
        {aviso === "copiado" && "¡Enlace copiado!"}
        {aviso === "error" && "No se pudo compartir. Copia el enlace de la barra del navegador."}
      </p>
    </div>
  );
}
