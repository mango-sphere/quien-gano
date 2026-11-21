import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

import { sigla } from "@/lib/texto";
import type { Candidato } from "@/lib/tipos";
import type { Fila } from "@/lib/vista";

import { cargarFuentes, imagenPublica } from "./recursos";

export const TAMANO_IMAGEN = { width: 1200, height: 630 };

const COLOR = {
  marino: "#00386b",
  amarillo: "#ffc83d",
  celeste: "#e3edf8",
  bordeSuave: "#d6e2f0",
  texto3: "#4a5b70",
  ganadorFondo: "#bff0d0",
  ganadorTexto: "#0d5b2c",
  vueltaFondo: "#ffd966",
  vueltaTexto: "#6b4500",
};

const DOMINIO = "quiengano.mangosphere.tech";

/** Marco común: marca y elección arriba, dominio y fuentes abajo. La portada ya lleva la marca en grande. */
async function dibujar(contenido: ReactNode, conMarca = true): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "48px 64px",
          background: COLOR.marino,
          color: "#fff",
          fontFamily: "Poppins",
        }}
      >
        <div style={{ display: "flex", justifyContent: conMarca ? "space-between" : "flex-end", alignItems: "center" }}>
          {conMarca && <Marca tamano={34} />}
          <span style={{ color: COLOR.amarillo, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            ELECCIONES REGIONALES Y MUNICIPALES 2026
          </span>
        </div>
        {contenido}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20 }}>
          <span style={{ fontWeight: 700 }}>{DOMINIO}</span>
          <span style={{ color: COLOR.celeste, fontWeight: 500 }}>Datos de la ONPE y el JNE · Sitio no oficial</span>
        </div>
      </div>
    ),
    { ...TAMANO_IMAGEN, fonts: await cargarFuentes() },
  );
}

function Marca({ tamano }: { tamano: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tamano * 0.25, fontSize: tamano, fontWeight: 800 }}>
      <span>¿Quién</span>
      <span
        style={{
          padding: `0 ${tamano * 0.3}px`,
          borderRadius: tamano * 0.25,
          background: COLOR.amarillo,
          color: COLOR.marino,
        }}
      >
        ganó
      </span>
      <span>?</span>
    </div>
  );
}

/** Imagen general del sitio (página de inicio). */
export async function imagenPortada(regionesConGanador: number, regionesEnSegundaVuelta: number) {
  return dibujar(
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Marca tamano={120} />
      <span style={{ maxWidth: 900, color: COLOR.celeste, fontSize: 34, fontWeight: 500, lineHeight: 1.35 }}>
        Solo el ganador, o quiénes pasan a segunda vuelta, en tu región, provincia y distrito.
      </span>
      <div style={{ display: "flex", gap: 16 }}>
        <Etiqueta fondo={COLOR.ganadorFondo} color={COLOR.ganadorTexto}>
          {`${regionesConGanador} regiones con ganador`}
        </Etiqueta>
        <Etiqueta fondo={COLOR.vueltaFondo} color={COLOR.vueltaTexto}>
          {`${regionesEnSegundaVuelta} a segunda vuelta`}
        </Etiqueta>
      </div>
    </div>,
    false,
  );
}

type Lugar = {
  /** "Cusco", "Caylloma"… */
  titulo: string;
  /** "Gobierno regional", "Alcaldía provincial · Arequipa"… */
  cargo: string;
  fila: Fila | undefined;
};

/** Imagen de una región o provincia: su ganador, o los dos que van a segunda vuelta. */
export async function imagenLugar({ titulo, cargo, fila }: Lugar) {
  const candidatos = fila ? (fila.segundaVuelta && fila.resultado.b ? [fila.resultado.a, fila.resultado.b] : [fila.resultado.a]) : [];
  const tarjetas = await Promise.all(candidatos.map(async (c) => ({ c, foto: await imagenPublica(c.photo), logo: await imagenPublica(c.logo) })));
  const compacta = tarjetas.length > 1;

  return dibujar(
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: COLOR.celeste, fontSize: 24, fontWeight: 500 }}>{cargo}</span>
          <span style={{ fontSize: titulo.length > 22 ? 52 : 68, fontWeight: 800, lineHeight: 1.1 }}>{titulo}</span>
        </div>
        {fila &&
          (fila.segundaVuelta ? (
            <Etiqueta fondo={COLOR.vueltaFondo} color={COLOR.vueltaTexto}>
              SEGUNDA VUELTA
            </Etiqueta>
          ) : (
            <Etiqueta fondo={COLOR.ganadorFondo} color={COLOR.ganadorTexto}>
              GANADOR
            </Etiqueta>
          ))}
      </div>
      {tarjetas.length > 0 ? (
        <div style={{ display: "flex", gap: 24 }}>
          {tarjetas.map(({ c, foto, logo }) => (
            <TarjetaCandidato key={c.name + c.party} candidato={c} foto={foto} logo={logo} compacta={compacta} />
          ))}
        </div>
      ) : (
        <span style={{ color: COLOR.celeste, fontSize: 30 }}>Todavía no hay datos.</span>
      )}
    </div>,
  );
}

function Etiqueta({ fondo, color, children }: { fondo: string; color: string; children: ReactNode }) {
  return (
    <span
      style={{
        padding: "8px 20px",
        borderRadius: 99,
        background: fondo,
        color,
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 1,
      }}
    >
      {children}
    </span>
  );
}

type PropsTarjeta = { candidato: Candidato; foto?: string; logo?: string; compacta: boolean };

function TarjetaCandidato({ candidato, foto, logo, compacta }: PropsTarjeta) {
  const anchoFoto = compacta ? 110 : 130;
  const altoFoto = anchoFoto * 1.25;
  const ladoLogo = compacta ? 50 : 58;

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        gap: 28,
        padding: "22px 28px",
        borderRadius: 22,
        background: "#fff",
        color: COLOR.marino,
      }}
    >
      <div style={{ display: "flex", position: "relative", width: anchoFoto + ladoLogo * 0.4, height: altoFoto + ladoLogo * 0.35 }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/og solo entiende <img>.
          <img
            src={foto}
            alt=""
            width={anchoFoto}
            height={altoFoto}
            style={{ objectFit: "cover", borderRadius: 12, border: `3px solid ${COLOR.marino}` }}
          />
        ) : (
          <div style={{ width: anchoFoto, height: altoFoto, borderRadius: 12, background: COLOR.celeste }} />
        )}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            width: ladoLogo,
            height: ladoLogo,
            borderRadius: 10,
            background: "#fff",
            border: `2px solid ${COLOR.bordeSuave}`,
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- next/og solo entiende <img>.
            <img src={logo} alt="" width={ladoLogo * 0.82} height={ladoLogo * 0.82} style={{ objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: ladoLogo / 3, fontWeight: 800 }}>{candidato.sym ?? sigla(candidato.party)}</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
        <span style={{ fontFamily: "Space Mono", fontSize: compacta ? 48 : 64, fontWeight: 700, lineHeight: 1 }}>
          {`${candidato.pct}%`}
        </span>
        <span style={{ fontSize: compacta ? 24 : 32, fontWeight: 700, lineHeight: 1.2 }}>{candidato.name}</span>
        <span style={{ color: COLOR.texto3, fontSize: compacta ? 18 : 22, fontWeight: 500 }}>{candidato.party}</span>
        {candidato.reason && (
          <span style={{ color: COLOR.texto3, fontSize: compacta ? 16 : 19, fontWeight: 500 }}>
            {`Según el JNE: ${candidato.reason.toLowerCase()}.`}
          </span>
        )}
      </div>
    </div>
  );
}
