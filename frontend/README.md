# Quién ganó — frontend

Resultados de las Elecciones Regionales y Municipales 2026 por región, provincia y distrito.
Implementa el diseño de `../quien-gano-handoff/` (opción C, "boleta") con Next.js.

## Datos

La página se genera a partir de lo que descarga el scraper (`../scraper`), convertido al
contrato de datos del handoff (`REG|Región`, `Región|Provincia`, `Región|Provincia|Distrito`):

```bash
npm run sincronizar-datos
```

Escribe `src/data/resultados.json`, `src/data/meta.json` y copia los logos usados a `public/logos/`.
Hay que volver a correrlo cada vez que se actualiza el scraper.

## Desarrollo

```bash
npm install
npm run sincronizar-datos
npm run dev
```

`npm run build` genera estáticamente las 222 páginas (nacional, regiones y provincias).

## Estructura

- `src/app/` — rutas: `/`, `/[region]`, `/[region]/[provincia]`.
- `src/lib/reglas.ts` — regla de segunda vuelta (30 % y 5 puntos, solo gobierno regional).
- `src/lib/resultados.ts` — acceso a los datos y árbol región → provincia → distrito.
- `src/lib/vista.ts` — qué muestra cada nivel.
- `src/components/` — Encabezado, MapaPeru, MigasDePan, BoletaResultado, RankingPartidos, Controles.
