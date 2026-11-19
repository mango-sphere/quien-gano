import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sitio 100 % estático (GitHub Pages): `next build` deja todo en `out/`.
  output: "export",
  // Cada página como carpeta con index.html (`/cusco/`), que GitHub Pages sirve sin configuración.
  trailingSlash: true,
  // Vacío con dominio propio; "/quien-gano" si se publica en <usuario>.github.io/quien-gano.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  images: { unoptimized: true },
};

export default nextConfig;
