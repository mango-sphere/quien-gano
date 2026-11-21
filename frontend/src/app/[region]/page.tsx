import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PantallaResultados } from "@/components/PantallaResultados";
import { metadatosPagina } from "@/lib/compartir";
import { regionPorSlug, regiones, rutas } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { estadoDatos, vistaRegion } from "@/lib/vista";

export function generateStaticParams() {
  return regiones().map((region) => ({ region: aSlug(region) }));
}

export async function generateMetadata({ params }: PageProps<"/[region]">): Promise<Metadata> {
  const region = regionPorSlug((await params).region);
  if (!region) return { title: "Región no encontrada" };
  return metadatosPagina(region, vistaRegion(region).resumen, rutas.region(region));
}

export default async function Page({ params }: PageProps<"/[region]">) {
  const region = regionPorSlug((await params).region);
  if (!region) notFound();

  return (
    <PantallaResultados
      key={region}
      vista={vistaRegion(region)}
      estadoDatos={estadoDatos()}
    />
  );
}
