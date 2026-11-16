# Incorporar artículos reales

La sección tiene seis índices: `/articulos/`, `/en/articles/`, `/de/fachartikel/`, `/no/artikler/`, `/ru/stati/` y `/nl/artikelen/`. El catálogo incluye ahora la primera publicación real en seis idiomas; con un catálogo vacío se muestra el aviso de próximas publicaciones. No se crean páginas individuales ni datos `Article` sin publicaciones reales.

## Fuentes y plantillas

- `site/article-locales.json`: navegación, introducción, aviso, metadatos SEO y etiquetas editoriales en los seis idiomas.
- `site/articles.json`: catálogo editorial. Solo los registros con `status: "published"` producen páginas, tarjetas y entradas de sitemap.
- `tools/article_content.py`: validación de contenido, fechas, rutas, servicios y referencias; texto escapado, sin HTML arbitrario.
- `tools/build_site.py`: plantilla común para índice y artículo, enlaces equivalentes, canonical, hreflang, breadcrumb y datos estructurados.
- `articles.css`: presentación editorial, cargada solo en índices y artículos. No modifica los estilos de los contenidos anteriores.
- `site/article-generated-paths.json`: manifiesto de salidas individuales generado automáticamente; no editar manualmente.

## Preparar un borrador

Puede añadirse un registro mínimo, que no se publicará:

```json
{"id": "identificador-estable", "status": "draft"}
```

Completar el registro con contenido real y revisión técnica/editorial antes de cambiarlo a `published`. No usar marcadores, ejemplos ficticios ni fechas futuras como publicaciones.

| Campo | Contenido |
| --- | --- |
| `id` | Identificador único estable, minúsculas ASCII, números y guiones. |
| `status` | `draft` o `published`. Los borradores no aparecen en la web ni en el sitemap. |
| `date_published` | Fecha real `YYYY-MM-DD`, obligatoria al publicar y no futura. |
| `date_modified` | Opcional; fecha de una revisión real, no anterior a la publicación ni futura. |
| `related_services` | Lista de claves de servicios: `expert`, `accidents`, `energy`, `occupancy`, `opening`. Se generan enlaces al servicio traducido correspondiente. |
| `translations` | Objeto con las seis claves `es`, `en`, `de`, `no`, `ru`, `nl`, completas al publicar. |

Cada traducción contiene:

| Campo | Contenido |
| --- | --- |
| `slug` | Ruta final estable en minúsculas ASCII y guiones, dentro del índice del idioma. No cambiar una URL ya publicada sin estudiar sus enlaces. |
| `title` | Título real del artículo, usado en H1 y Schema.org. |
| `seo_title` | Opcional: título SEO independiente del H1; si falta se utiliza el título y el nombre profesional. |
| `professional_title` | Opcional: denominación profesional verificada, localizada, visible y en los metadatos de autor. |
| `image_alt`, `image_caption` | Obligatorios cuando existe imagen: alternativa descriptiva y pie localizado fiel a la fuente. |
| `references_heading`, `related_intro` | Opcionales: encabezado bibliográfico y contexto del enlace al servicio. |
| `description` | Resumen real; se usa en la tarjeta, introducción y metadescripción. |
| `category` | Categoría editorial traducida, sin crear páginas de categoría vacías. |
| `sections` | Lista de secciones con `heading`, `level` (2 o 3), `paragraphs` (lista de párrafos) y opcionalmente `items` (lista). Debe empezar por H2; solo se permiten H2/H3 y contenido no vacío. |
| `references` | Opcional: lista de objetos con `title` y, solo si está verificada, `url` HTTPS opcional. Usar fuentes técnicas/normativas reales y revisar su vigencia y aplicación al caso. |

El registro puede incluir `image` con `src` bajo `/assets/articles/`, `width` y `height` reales. La plantilla muestra el archivo completo sin recortarlo y genera los metadatos de imagen.

El autor se incorpora automáticamente como **Manuel Adolfo García Rodríguez**; no se admiten autores, experiencia, acreditaciones o resultados inventados. Se preserva la terminología de los procedimientos españoles al traducir. Las referencias pueden localizarse por idioma. El contenido se introduce como texto, sin etiquetas HTML.

## Publicación y retirada

1. Preparar las seis traducciones, fechas, categorías, contenido y referencias reales.
2. Revisar que el encargo editorial esté aprobado y marcar `status: "published"` en una rama de revisión.
3. Ejecutar `python3 tools/build_site.py`, `python3 tests/check_seo.py` y `python3 tests/test_articles.py`.
4. Revisar móvil/escritorio y los enlaces de la página real antes de fusionar o desplegar por el procedimiento habitual del propietario.

Cada artículo publicado genera seis URL bajo los índices, con fecha localizada, categoría, autor, H2/H3, referencias y servicios relacionados, además de `Article`, `datePublished`, `inLanguage`, breadcrumb y `dateModified` solo cuando se proporciona. El índice ordena por fecha descendente y muestra título, fecha, categoría y descripción. Las relaciones hreflang y canonical se generan automáticamente para las seis traducciones.

Si se retira una publicación, el generador elimina solo las salidas que consten en su manifiesto y tengan la marca de propiedad `generated:technical-article`. No borra archivos manuales ni otros recursos; rechaza rutas fuera de los índices. No genera páginas vacías que aparenten seguir publicadas ni crea redirecciones. Evaluar el tratamiento SEO de una retirada real antes de desplegarla.

## Conservación de la web existente

`site/schema-overrides.json` incorpora los datos profesionales que ya estaban presentes en el HTML de la portada española de main y que el generador anterior no recogía. Esto evita perderlos al recompilar; no añade afirmaciones nuevas ni cambia el SEO existente.

Con el catálogo vacío hay 60 páginas lingüísticas y 48 URL indexables: se mantienen las 42 anteriores y se añaden únicamente seis índices. Los borradores legales siguen fuera del sitemap. Cada artículo real publicado añadirá seis URL. Sin publicaciones no se emite ningún `Article`.

## Pruebas

`tests/test_articles.py` comprueba validación, plantilla y Schema.org, escape de texto/JSON, borradores, referencias, fechas y limpieza segura. Un caso de integración publica y retira una **fixture solo en una copia temporal**, ejecutando la compilación y la comprobación SEO en ambos estados. Esa fixture no se escribe en las rutas de este repositorio, no se incorpora al catálogo y no se publica.

`tests/articles-browser.cjs` comprueba los seis índices a 320/390/768/1440, el orden de los seis enlaces, teclado, idiomas equivalentes con y sin JavaScript, estados vacíos y ausencia de desbordamiento. Las fuentes actuales pueden servirse como fixtures temporales con `HEADER_FONT_DIR`, sin dependencias nuevas en la web.
