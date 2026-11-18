/**
 * Convierte la salida del scraper (`data/2026-erm/resumen-1ra-vuelta.json`) al
 * contrato de datos del handoff y copia los logos que se usan a `public/logos/`.
 *
 * Uso: `npm run sincronizar-datos` (requiere haber corrido el scraper)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Candidato, Meta, Resultado, Resultados } from "../src/lib/tipos.ts";

type ParticipanteScraper = {
  codigo: string;
  organizacion: string;
  candidato: string | null;
  porcentaje_validos: number;
};
type RankingScraper = Record<string, ParticipanteScraper>;
type ReporteScraper = {
  proceso: string;
  fuente: string;
  generado_en: string;
  regiones: {
    nombre: string;
    gobernador: RankingScraper;
    provincias: {
      nombre: string;
      alcalde_provincial: RankingScraper;
      distritos: { nombre: string; alcalde_distrital: RankingScraper }[];
    }[];
  }[];
};

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEN = join(RAIZ, "..", "data", "2026-erm");
const HANDOFF_LOGOS = join(RAIZ, "..", "quien-gano-handoff", "assets", "logos");
const DESTINO_DATOS = join(RAIZ, "src", "data");
const DESTINO_LOGOS = join(RAIZ, "public", "logos");

/** Logos ya recortados y limpios del handoff, por código de organización ONPE. */
const LOGOS_LIMPIOS: Record<string, string> = {
  "95": "app.png",
  "123": "ahora-nacion.png",
  "137": "renovacion-popular.png",
};

const PARTICULAS = new Set(["a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "los", "para", "por", "y"]);

/** `"MADRE DE DIOS"` → `"Madre de Dios"`. */
function aTitulo(texto: string): string {
  return texto
    .toLocaleLowerCase("es")
    .split(" ")
    .map((palabra, i) =>
      i > 0 && PARTICULAS.has(palabra) ? palabra : palabra.charAt(0).toLocaleUpperCase("es") + palabra.slice(1),
    )
    .join(" ");
}

/** Como `aTitulo`, pero respeta siglas sueltas tras un guion: `"AHORA NACIÓN - AN"` → `"Ahora Nación - AN"`. */
function nombrePartido(organizacion: string): string {
  return organizacion
    .split(" - ")
    .map((tramo) => (/^\S{1,4}$/.test(tramo) ? tramo : aTitulo(tramo)))
    .join(" - ");
}

function candidato(p: ParticipanteScraper): Candidato {
  return {
    name: p.candidato ? aTitulo(p.candidato) : "Candidato no informado",
    party: nombrePartido(p.organizacion),
    pct: p.porcentaje_validos.toFixed(1),
    logo: `/logos/${p.codigo}.png`,
  };
}

function resultado(ranking: RankingScraper, ambito: string): Resultado | null {
  const [primero, segundo] = [ranking["1"], ranking["2"]];
  if (!primero) {
    console.warn(`Sin resultados para ${ambito}; se omite.`);
    return null;
  }
  return segundo ? { a: candidato(primero), b: candidato(segundo) } : { a: candidato(primero) };
}

function copiarLogo(codigo: string): void {
  const destino = join(DESTINO_LOGOS, `${codigo}.png`);
  const limpio = LOGOS_LIMPIOS[codigo];
  const origen = limpio
    ? join(HANDOFF_LOGOS, limpio)
    : join(ORIGEN, "logos", `${codigo.padStart(8, "0")}.png`);
  if (!existsSync(origen)) {
    throw new Error(`Falta el logo de la organización ${codigo}: ${origen}`);
  }
  copyFileSync(origen, destino);
}

function main(): void {
  const reporte: ReporteScraper = JSON.parse(readFileSync(join(ORIGEN, "resumen-1ra-vuelta.json"), "utf-8"));
  const resultados: Resultados = {};
  const codigos = new Set<string>();

  const agregar = (clave: string, ranking: RankingScraper) => {
    const r = resultado(ranking, clave);
    if (!r) return;
    resultados[clave] = r;
    Object.values(ranking).forEach((p) => codigos.add(p.codigo));
  };

  for (const region of reporte.regiones) {
    const nombreRegion = aTitulo(region.nombre);
    agregar(`REG|${nombreRegion}`, region.gobernador);
    for (const provincia of region.provincias) {
      const claveProvincia = `${nombreRegion}|${aTitulo(provincia.nombre)}`;
      agregar(claveProvincia, provincia.alcalde_provincial);
      for (const distrito of provincia.distritos) {
        agregar(`${claveProvincia}|${aTitulo(distrito.nombre)}`, distrito.alcalde_distrital);
      }
    }
  }

  const meta: Meta = { proceso: reporte.proceso, generadoEn: reporte.generado_en, fuente: reporte.fuente };

  mkdirSync(DESTINO_DATOS, { recursive: true });
  writeFileSync(join(DESTINO_DATOS, "resultados.json"), JSON.stringify(resultados));
  writeFileSync(join(DESTINO_DATOS, "meta.json"), JSON.stringify(meta, null, 2));

  rmSync(DESTINO_LOGOS, { recursive: true, force: true });
  mkdirSync(DESTINO_LOGOS, { recursive: true });
  codigos.forEach(copiarLogo);

  console.log(`${Object.keys(resultados).length} resultados y ${codigos.size} logos sincronizados.`);
}

main();
