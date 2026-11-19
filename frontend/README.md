# Frontend

Página web de **Quién ganó en tu distrito**: muestra quién ganó, o quiénes van a segunda vuelta, en
cada región, provincia y distrito del Perú en las ERM 2026. Hecha con Next.js (App Router) y
pensada para leerse rápido, también por adultos mayores.

## Requisitos

- Node.js **22.18 o superior** (el script de datos usa TypeScript sin compilar).

## Ejecutar

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Los datos ya vienen en el repo, así que no hace falta correr el scraper
para ver la página.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Genera las 222 páginas estáticas (nacional, 25 regiones y 196 provincias). |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npm run sincronizar-datos` | Actualiza los datos a partir de la salida del scraper (ver abajo). |

Para verlo desde el celular en la misma red Wi-Fi: `npm run build && npm run start -- -H 0.0.0.0`
y abre `http://<IP de tu PC>:3000`.

## De dónde salen los datos

La página no consulta ninguna API: todo se resuelve al construirla, a partir de archivos del repo.

```
../data/2026-erm/  (salida del scraper, fuera de git)
        │
        │  npm run sincronizar-datos
        ▼
src/data/resultados.json   resultados por lugar
src/data/meta.json         proceso, fecha de descarga y fuente
public/logos/{codigo}.png  logos de los partidos que aparecen
public/fotos/{hash}.jpg    fotos de los candidatos que aparecen
```

`src/data/peru-regiones.json` es el mapa (un path SVG y un centroide por región) y no lo genera el
script.

### Actualizar los datos

1. Corre el scraper (ver `../scraper/README.md`).
2. Desde `frontend/`:

   ```bash
   npm run sincronizar-datos
   ```

3. Revisa la página y haz commit de los cambios en `src/data/`, `public/logos/` y `public/fotos/`.

El script lee `../data/2026-erm/resumen-1ra-vuelta.json`, que trae los 2 primeros de gobernador y
el 1º de cada alcaldía, que es justo lo que muestra la página.

- **Nombres:** pasa los nombres a formato título (`"MADRE DE DIOS"` → `"Madre de Dios"`).
- **Motivo sin candidato:** traduce el estado del JNE de las listas sin candidato a un texto ("Renunció a la candidatura"…).
- **Fotos:** las copia con un **hash del DNI** como nombre, para no publicar el DNI en la URL.
- **Logos:** los de `scripts/logos-limpios/` (recortados a mano) tienen prioridad sobre los de la ONPE.

### Contrato de datos

`resultados.json` es un objeto indexado por clave:

| Clave | Resultado |
|---|---|
| `REG\|<Región>` | Gobierno regional |
| `<Región>\|<Provincia>` | Alcaldía provincial |
| `<Región>\|<Provincia>\|<Distrito>` | Alcaldía distrital |

Cada resultado es `{ a, b? }` (primero y segundo), y cada candidato:

```ts
{
  name: string;     // "Sin candidato a alcalde" si la lista no tenía candidato
  party: string;
  pct: string;      // votos válidos con 1 decimal, "34.2"
  logo?: string;
  photo?: string;   // sin foto se muestra el marcador "FOTO"
  reason?: string;  // por qué no hay candidato, según el JNE
}
```

Los tipos están en `src/lib/tipos.ts`.

## Reglas que aplica la página

- **Gobierno regional:** gana quien obtiene **30 % o más de los votos válidos**; si nadie llega,
  los dos primeros van a segunda vuelta (`src/lib/reglas.ts`).
- **Alcaldías provinciales y distritales:** siempre hay ganador (mayoría simple).
- Los distritos capitales no aparecen en la lista de distritos: no eligen alcalde distrital, los
  gobierna el alcalde provincial.

## Estructura

| Ruta | Qué es |
|---|---|
| `src/app/` | Rutas: `/`, `/[region]` y `/[region]/[provincia]`, generadas en el build. |
| `src/lib/resultados.ts` | Acceso a los datos y árbol región → provincia → distrito. |
| `src/lib/vista.ts` | Qué muestra cada nivel (título, migas, tarjeta destacada, lista). |
| `src/lib/reglas.ts` | Regla de segunda vuelta. |
| `src/components/` | `Encabezado`, `MapaPeru`, `MigasDePan`, `BoletaResultado`, `Retrato`, `RankingPartidos`, `Controles`… |
| `scripts/sincronizar-datos.mts` | Conversión de la salida del scraper al contrato de datos. |
