import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";
import { PantallaResultados } from "@/components/PantallaResultados";
import { regionPorSlug, regiones } from "@/lib/resultados";
import { aSlug } from "@/lib/texto";
import { regionesMapa, textoEstadoDatos, vistaRegion } from "@/lib/vista";

export function generateStaticParams() {
  return regiones().map((region) => ({ region: aSlug(region) }));
}

export async function generateMetadata({ params }: PageProps<"/[region]">): Promise<Metadata> {
  const region = regionPorSlug((await params).region);
  return { title: region ?? "Región no encontrada" };
}

export default function Page({ params }: PageProps<"/[region]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Region params={params} />
    </Suspense>
  );
}

async function Region({ params }: Pick<PageProps<"/[region]">, "params">) {
  const region = regionPorSlug((await params).region);
  if (!region) notFound();

  return (
    <PantallaResultados vista={vistaRegion(region)} regionesMapa={regionesMapa()} estadoDatos={textoEstadoDatos()} />
  );
}
