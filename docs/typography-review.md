# Tipografía y alineación en seis idiomas

La revisión se limita a la presentación. Se conservan familias tipográficas, tamaños de títulos y cuerpo, colores, ilustraciones, contenido, traducciones y estructura de las secciones.

## Criterios

- Párrafos de lectura: anchura máxima de 60ch, interlineado 1.8 y márgenes de párrafo uniformes. El contenido legal utiliza una columna de lectura centrada más contenida.
- Títulos a la izquierda, distribución equilibrada de líneas y separación de palabras según el idioma declarado en HTML cuando el navegador dispone del diccionario correspondiente. No se introducen guiones ni cambios en los textos originales.
- La clase `reading-prose` identifica párrafos de al menos 280 caracteres. Solo se considera la justificación dentro de explicaciones de servicios, perfil y contenido legal; no se aplica a destacados, navegación, listas ni formularios.
- Por debajo de 768px, o en columnas menores de 30rem, se conserva la alineación izquierda. La última línea siempre queda a la izquierda.
- `typography.js` es una mejora opcional de presentación. Prueba la distribución en el navegador y mantiene la justificación solo en párrafos de al menos tres líneas cuyos espacios no superen 2.5 veces el espacio natural de la fuente ni 0.8em. Si no cumple, vuelve a la izquierda. Se recalcula al cambiar la anchura o terminar de cargar las fuentes.
- Sin JavaScript, Canvas o consultas de contenedor, los párrafos permanecen a la izquierda. La hifenación nativa se usa cuando está disponible, con límites para evitar fragmentos demasiado cortos; no se incorpora ningún diccionario ni dependencia.
- Los recursos de tipografía son locales al sitio y llevan hash de contenido en su URL. El JavaScript existente, selector, WhatsApp y formulario no se modifican.

## Validación realizada

- `python3 tools/build_site.py`: generación determinista.
- `python3 tests/check_seo.py`: 54 páginas, canonical, hreflang, datos estructurados, enlaces y las mismas 42 URLs indexables en el sitemap.
- `node --check typography.js`, `node --check tests/typography-browser.cjs` y `git diff --check`.
- `TYPOGRAPHY_FONT_DIR=/tmp/adolfo-typography-fonts node tests/typography-browser.cjs`: las 54 páginas a 1440/1024/768/390/320px, sin desbordamiento ni errores JS. Exclusión de textos breves y UI, alineación izquierda en móvil y sin JavaScript, y adaptación al redimensionar la misma página.
- Comparación de estilos con la hoja tipográfica activada y desactivada: formulario, controles, notas del formulario, navegación, selector de idiomas y WhatsApp conservan sus propiedades de tipografía, colores, alineación, bordes y relleno.
- Comparación íntegra de los HTML con main: al retirar las clases de presentación y los enlaces a los dos recursos nuevos, los 54 archivos son idénticos. Textos, traducciones, SEO, sitemap, backend, scripts existentes y configuración permanecen intactos.

La primera propuesta de justificación por anchura produjo huecos de hasta 30.75px en la prueba de alemán. Se descartó ese comportamiento y se añadió la comprobación de distribución. La validación final registró 75 casos de justificación aceptada, con un espacio máximo de 10.22px entre palabras. Estos datos describen los tamaños y fuentes probados; el control vuelve a medir la distribución real en cada navegador.

Se capturaron y revisaron páginas de inicio, servicios y contenido legal de los seis idiomas en escritorio, tableta y móvil. Se prestó especial atención al alemán, ruso y neerlandés. Capturas antes/después y mediciones en `/tmp/adolfo-typography/`.

## Fuentes para reproducir la prueba

Google Fonts devolvió HTTP 403 en el entorno. Se utilizaron copias locales de DM Sans y Manrope, las familias actuales, exclusivamente como fixtures de pruebas. No se añadieron paquetes ni fuentes a la aplicación. El ruso mantiene la sustitución tipográfica del cuerpo cuando DM Sans no contiene el carácter, igual que en la configuración existente.

Para reproducir las capturas con las mismas familias, descargar `@fontsource/dm-sans@5.2.8` y `@fontsource/manrope@5.2.8` mediante `npm pack --pack-destination /tmp/adolfo-typography-fonts ...` y extraer cada paquete en los subdirectorios `dm-sans` y `manrope` con `tar --strip-components=1`. El test intercepta las peticiones de fuentes solo dentro de Chromium. Sin `TYPOGRAPHY_FONT_DIR`, utiliza las fuentes de sustitución del sistema.

No se desplegó producción ni se realizaron envíos reales de correo. Esta revisión visual corresponde al código de la rama servido localmente.
