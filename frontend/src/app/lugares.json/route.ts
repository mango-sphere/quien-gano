import { indiceLugares } from "@/lib/lugares";

/** Índice del buscador general como archivo estático: se descarga recién cuando alguien usa el buscador. */
export const dynamic = "force-static";

export function GET() {
  return Response.json(indiceLugares());
}
