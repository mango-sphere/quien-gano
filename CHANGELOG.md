# Cambios

Los cambios importantes de cada versión de la página. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones siguen
[versionado semántico](https://semver.org/lang/es/). La versión está en `frontend/package.json`.

## 1.0.0 - 2026-11-21

Primera versión estable: resultados de gobiernos regionales, alcaldías provinciales y distritales,
buscador, páginas por lugar para compartir y conteo de visitas.

### Agregado

- Conteo de visitas con Cloudflare Web Analytics, sin cookies ni seguimiento entre sitios. Solo se
  carga en el sitio publicado, y el pie de página lo avisa.

## 0.3.0 - 2026-11-21

### Agregado

- Página propia para cada uno de los 1696 distritos (`/cusco/cusco/san-sebastian/`), con su
  resultado y un enlace a los demás distritos de la provincia. El buscador lleva a ella.
- Vista previa al compartir (Open Graph): cada página tiene título, descripción e imagen propios,
  con el ganador o los dos que van a segunda vuelta, su foto y el logo del partido.
- Botones para compartir junto al título: «Compartir» (menú del celular o copiar el enlace en la
  computadora) y WhatsApp, con el mensaje «Mira quién ganó en <lugar>».

### Cambiado

- En la lista de distritos de una provincia, cada tarjeta lleva a la página del distrito.
- El pie de página queda abajo también en las páginas cortas.

## 0.2.0 - 2026-11-20

### Agregado

- Autoría en el pie de página, con enlaces a LinkedIn y GitHub.

### Cambiado

- La portada dice el nombre completo de la elección: «Elecciones Regionales y Municipales 2026».
- La barra superior solo muestra la marca: se quitaron la versión y la fecha de los datos.

### Corregido

- La barra superior queda en una línea en pantallas de 360 y 375 px.

## 0.1.0 - 2026-11-19

Primera versión publicada en [quiengano.mangosphere.tech](https://quiengano.mangosphere.tech).

### Agregado

- Scraper de los resultados de la ONPE (gobierno regional, alcaldías provinciales y distritales),
  con fotos y motivos de las candidaturas del JNE.
- Página estática con los resultados de las 25 regiones y 196 provincias.
- Portada «¿Quién ganó?», sección «Quién lidera» y buscador de regiones, provincias y distritos.
- Pie de página con las fuentes (ONPE y JNE) y el aviso de sitio no oficial.

