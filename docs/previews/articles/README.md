# Artículos: capturas y validación

Capturas reales de Chromium en las seis versiones, a las cuatro anchuras, con las fuentes actuales DM Sans y Manrope. Son imágenes a DPR 2: 320 px de viewport produce un PNG de 640 px, para revisar el texto sin miniaturas. Las capturas completas se toman al final del scroll para que el botón fijo de WhatsApp aparezca al final de la página, sin ocultar el aviso de publicaciones; no se modifica ni oculta el botón.

| Idioma | 320 px | 390 px | 768 px | 1440 px |
| --- | --- | --- | --- | --- |
| Español | [Página completa](es-index-320.png) · [Menú](es-header-320.png) | [Página completa](es-index-390.png) · [Menú](es-header-390.png) | [Página completa](es-index-768.png) | [Página completa](es-index-1440.png) |
| Inglés | [Página completa](en-index-320.png) · [Menú](en-header-320.png) | [Página completa](en-index-390.png) · [Menú](en-header-390.png) | [Página completa](en-index-768.png) | [Página completa](en-index-1440.png) |
| Alemán | [Página completa](de-index-320.png) · [Menú](de-header-320.png) | [Página completa](de-index-390.png) · [Menú](de-header-390.png) | [Página completa](de-index-768.png) | [Página completa](de-index-1440.png) |
| Noruego bokmål | [Página completa](no-index-320.png) · [Menú](no-header-320.png) | [Página completa](no-index-390.png) · [Menú](no-header-390.png) | [Página completa](no-index-768.png) | [Página completa](no-index-1440.png) |
| Ruso | [Página completa](ru-index-320.png) · [Menú](ru-header-320.png) | [Página completa](ru-index-390.png) · [Menú](ru-header-390.png) | [Página completa](ru-index-768.png) | [Página completa](ru-index-1440.png) |
| Neerlandés | [Página completa](nl-index-320.png) · [Menú](nl-header-320.png) | [Página completa](nl-index-390.png) · [Menú](nl-header-390.png) | [Página completa](nl-index-768.png) | [Página completa](nl-index-1440.png) |

## Índices nuevos

- `/articulos/`
- `/en/articles/`
- `/de/fachartikel/`
- `/no/artikler/` (HTML/hreflang `nb`, como el resto de la web)
- `/ru/stati/`
- `/nl/artikelen/`

Se incluyen exclusivamente seis índices, con el título, introducción y aviso traducidos. El catálogo `site/articles.json` está vacío. No se publican tarjetas, fechas ficticias ni páginas individuales vacías; el esquema actual es CollectionPage/ItemList con cero publicaciones, no Article.

## Menú de seis enlaces

Orden español: Inicio, Peritajes, Servicios, Sobre mí, Artículos, Contacto. Se conserva una fila con etiquetas completas, enlaces nativos, colores y efectos existentes. Solo se adaptan tamaño de letra e interletraje/espacios horizontales del menú. No se modifican logos, banderas ni pie.

| Idioma | Fuente a 320 px | Fuente a 390 px |
| --- | ---: | ---: |
| Español | 12,4 px | 14 px |
| Inglés | 12,25 px | 14 px |
| Alemán | 10,3 px | 12 px |
| Noruego bokmål | 10,4 px | 12,3 px |
| Ruso | 9,5 px | 10,6 px |
| Neerlandés | 9,8 px | 11,7 px |

A 768 y 1440 px se conservan 15 px. El caso ruso a 320 es el más ajustado y usa interletraje compacto; revisar expresamente su captura. También se probaron los dos anchos móviles con Arial de respaldo, sin desbordamientos.

## Comprobaciones

- `python3 tools/build_site.py`: 60 páginas, 48 URL indexables.
- `python3 tests/check_seo.py`: títulos/metadescripciones, canonical, hreflang recíprocos, datos estructurados, navegación interna y sitemap.
- `python3 tests/test_articles.py`: 9 pruebas de estructura editorial, seguridad de texto/JSON, borradores, fechas, referencias, enlaces relacionados, publicación y retirada en copia temporal.
- `tests/articles-browser.cjs`: 6 idiomas × 320/390/768/1440, estado vacío, orden/enlace del menú, fila única, idiomas equivalentes con/sin JavaScript, teclado y ausencia de desbordamiento.
- `tests/final-header-footer-browser.cjs`: menú ampliado en las portadas a 320/390 con fuentes actuales y de respaldo; pie y logos conservados.
- `npm test`: formulario con proveedores simulados, sin envío real de correo.
- Comparación con main c28c525: las 54 páginas anteriores conservan exactamente su contenido y SEO fuera del nuevo enlace de cabecera y de la referencia de caché del CSS; las 42 URL anteriores siguen en el sitemap.

La guía de incorporación de artículos reales está en [docs/articles.md](../../articles.md). Sin nuevas dependencias de la web, despliegues, cambios de DNS ni configuración. Pendiente de revisión visual del propietario; no fusionar ni publicar automáticamente.
