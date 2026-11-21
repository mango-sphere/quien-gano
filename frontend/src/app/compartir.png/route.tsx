import { imagenPortada } from "@/og/ImagenCompartir";
import { vistaNacional } from "@/lib/vista";

export const dynamic = "force-static";

/** Imagen para compartir la página de inicio (Open Graph). */
export function GET() {
  const filas = vistaNacional().lista?.filas ?? [];
  const enSegundaVuelta = filas.filter((f) => f.segundaVuelta).length;
  return imagenPortada(filas.length - enSegundaVuelta, enSegundaVuelta);
}
