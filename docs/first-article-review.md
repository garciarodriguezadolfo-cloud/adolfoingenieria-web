# Revisión: primer artículo técnico en seis idiomas

Rama: `feat/primer-articulo-informe-preliminar`. Base revisada: `526acae` (main). Esta entrega es una propuesta para revisión; no se ha fusionado ni desplegado en producción.

## Contenido y alcance

El texto español se ha contrastado con el PDF entregado: título, los cuatro párrafos, pie de imagen y las dos referencias coinciden tras normalizar los saltos de línea. Se añade el H2 «Introducción» solicitado. El nombre se mantiene exactamente como **Manuel Adolfo García Rodríguez** en todos los idiomas. La denominación profesional se traduce, sin añadir credenciales.

Las cinco traducciones conservan las cuatro ideas del original: hipótesis de causa aún por comprobar; documentación antes de reparar/desmontar; distinguir daño causante de daño ocurrido durante el accidente; y valorar un peritaje completo si la incertidumbre afecta a la reclamación. No presentan indicios como causas probadas ni garantizan responsabilidades o indemnizaciones. Los títulos bibliográficos permanecen en su idioma original, como en el PDF; se muestran sin enlaces para no introducir destinos externos no verificados.

## URL nuevas

| Idioma HTML/hreflang | Ruta |
| --- | --- |
| es | `/articulos/cuando-encargar-informe-tecnico-preliminar/` |
| en | `/en/articles/when-to-commission-preliminary-technical-report/` |
| de | `/de/fachartikel/wann-vorlaeufigen-technischen-bericht-beauftragen/` |
| nb | `/no/artikler/naar-boer-man-bestille-foreloepig-teknisk-rapport/` |
| ru | `/ru/stati/kogda-zakazat-predvaritelnyi-tekhnicheskii-otchet/` |
| nl | `/nl/artikelen/wanneer-voorlopig-technisch-rapport-laten-opstellen/` |

Cada índice incluye la ficha con título, fecha, categoría, resumen y enlace. Cada artículo tiene un H1, apartados H2, firma visible, referencias, enlace contextual al servicio en su idioma y regreso al índice. Canonical, siete alternates (seis idiomas + x-default español), Open Graph, imagen y Article/Person/ImageObject son coherentes. El sitemap pasa de 48 a 54 URL; las 48 entradas anteriores se mantienen, sin cambiar sus alternates.

## Fecha y aprobación

La fecha editorial preparada en esta PR es **16 de noviembre de 2026**, fecha de esta intervención, compartida por las seis versiones. No se afirma que el artículo ya esté publicado. Si la publicación aprobada se realiza otro día, antes de incorporarlo a producción se debe ajustar `date_published` en `site/articles.json` a la fecha efectiva y regenerar las páginas con `python3 tools/build_site.py`. No se genera `dateModified` ni se atribuye una revisión o una fecha anterior ficticia.

## Imagen original y trazabilidad

Se extrae la única imagen incrustada con `pdfimages -j` y se optimiza con WebP (Pillow, quality 92, method 6), manteniendo los **1600 × 679 píxeles**, contenido y encuadre completos. JPEG extraído: 221.031 bytes; WebP: 174.174 bytes. No se usa IA, imagen de archivo ni reconstrucción nueva. Los seis pies identifican expresamente una recreación y los alt son descriptivos.

SHA-256 del PDF adjunto: `379dead6556ff7d904be91b941e235a94279c2b5bcb2abc3344c5749733d6487`.

SHA-256 del JPEG extraído: `9cab89796aaa13e0c9cbc54a289f8b99f02a5b0476ba93acd30257d743d3e0a8`.

SHA-256 del WebP: `0340cf9a30da4bb5c1f5fd30d00a70cc15a0c8dbef43a2a1ba0c022c411e30c8`.

## Archivos

- `site/articles.json`: artículo y seis traducciones revisadas por correspondencia con el original.
- `assets/articles/informe-tecnico-preliminar/`: imagen optimizada del PDF.
- Seis HTML individuales, seis listados, sitemap y manifiesto de páginas editoriales.
- `tools/article_content.py` y `tools/build_site.py`: soporte reutilizable de imagen, alt/pie, firma profesional, SEO title específico y citas sin URL; categoría en la ficha y metadatos de imagen/autor.
- `articles.css`: estilos exclusivos del contenido editorial, fondo claro y lectura responsive. Se mantiene el CSS global sin cambios.
- Pruebas y capturas de revisión. No se modifican servicios, otras imágenes/iconos, formulario, correo, WhatsApp, navegación ni configuración de Cloudflare.

## Validación

- `python3 tools/build_site.py`: 66 páginas generadas; 54 URL indexables.
- `python3 tests/check_seo.py`: metadatos, canonical, hreflang, seis idiomas, esquema, enlaces/anclas, sitemap, robots y recursos válidos.
- `python3 tests/test_articles.py`: 10 pruebas, incluida compilación/publicación/retirada de una fixture solo en copia temporal, imágenes y citas sin enlaces.
- `python3 tests/check_first_article.py --pdf <PDF adjunto>`: correspondencia española con el PDF, nombre/firma/metadatos, referencias, conservación de cabecera/pie/WhatsApp, HTML anteriores y adiciones exactas del sitemap.
- `npm test`: siete grupos del servidor de contacto superados con fixtures, sin tocar su código ni realizar envíos.
- `HEADER_FONT_DIR=/tmp/adolfo-article-fonts node tests/first-article-browser.cjs`: seis artículos y seis listados a 320/390/768/1440 px, imagen cargada sin recorte, texto y esquema, navegación de ida/vuelta entre las seis versiones, retorno al listado, ausencia de 404/errores JS/desbordamientos y lectura/navegación sin JavaScript.
- `git diff --check`: sin errores. Se comprueba generación determinista.

Las fuentes corporativas se sirven como fixtures locales de Fontsource (Manrope/DM Sans) exclusivamente durante las capturas: no se añaden archivos de fuentes ni se cambia la carga de tipografía de la web. La revisión técnica de traducciones no equivale a una traducción jurada ni introduce alegaciones sobre sucesos reales. No se realizan pruebas de envío de correo ni se modifican servicios externos.

## Capturas completas para aprobación visual

| Vista | Español | Inglés |
| --- | --- | --- |
| Artículo, escritorio 1440 px | [Captura](previews/informe-tecnico-preliminar/es-articulo-1440.jpg) | [Captura](previews/informe-tecnico-preliminar/en-article-1440.jpg) |
| Artículo, móvil 390 px | [Captura](previews/informe-tecnico-preliminar/es-articulo-390.jpg) | [Captura](previews/informe-tecnico-preliminar/en-article-390.jpg) |
| Listado, escritorio 1440 px | [Captura](previews/informe-tecnico-preliminar/es-listado-1440.jpg) | — |
| Listado, móvil 390 px | [Captura](previews/informe-tecnico-preliminar/es-listado-390.jpg) | — |

Las capturas adicionales de los seis idiomas y cuatro anchos se generan en `/tmp/adolfo-first-article-review/`. Esperar la aprobación visual del titular antes de fusionar o publicar.
