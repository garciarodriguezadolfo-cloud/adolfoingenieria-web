# Alineación y colegiación: ajustes mínimos

Comparativas reales de Chromium antes (main 612e770) y después, a 320, 390, 768 y 1440 px. Se probaron las seis versiones lingüísticas en las cuatro anchuras con las fuentes actuales DM Sans y Manrope mediante fixtures temporales, sin añadir dependencias al sitio.

## Cambios

- Cabecera: solo la imagen se desplaza 4 px a la izquierda en pantallas de hasta 640 px. Su tamaño, altura, proporciones y archivo permanecen intactos; menú y banderas conservan exactamente su geometría anterior. En 768 y 1440 px no se desplaza la cabecera.
- Pie: el logotipo conserva sus dimensiones y se centra sobre el ancho disponible. Se compensa el margen transparente asimétrico del original mediante una traslación del 1,640625 % de su anchura (aproximadamente 4,27 px a su tamaño de 260 px). El dibujo visible, cuyo centro en el original está en x661 sobre un lienzo de 1280 px, queda centrado sin editar ni recortar el archivo.
- Textos inferiores a 10 px frente a los 11 px anteriores, alineados a la izquierda con la sangría exterior existente del pie. La línea profesional se coloca primero, seguida de copyright y enlaces legales, conforme a la indicación de conservarlos debajo.
- Español: «Ingeniero Mecánico | Colegiado n.º 4.702 COITIA», exactamente en una sola línea. Las otras versiones conservan la traducción de la profesión y añaden la denominación equivalente de colegiación. «4.702 COITIA» permanece junto en todas ellas. No se altera el contenido del copyright ni de los enlaces legales.

## Validación

- `tests/registration-layout-browser.cjs`: 6 idiomas × 4 anchuras. Comparación antes/después de altura de cabecera, menú, selector, posición vertical del logo y dimensiones de ambos logotipos; todas intactas. Comprueba centrado óptico del pie, sangría de textos, tamaño de letra, línea profesional sin saltos y ausencia de desbordamiento.
- `tests/branding-browser.cjs` y `tests/header-browser.cjs`: regresión de navegación, teclado y presentación.
- `python3 tests/check_seo.py`, `python3 tests/check_logo_asset.py`, `npm test` y `git diff --check`. Formulario probado con proveedores simulados; ningún correo real enviado.
- Comparación contra main: HTML de cabecera intacto; todos los contenidos fuera del pie, archivos de imágenes/logotipos, destinos de enlaces, canonical, hreflang y sitemap de 42 URL idénticos. Solo se actualiza la referencia de caché del CSS.

El servidor local usado fue `http://127.0.0.1:8771` mediante `TEST_BASE_URL`. El test de registro guarda capturas en `/tmp/adolfo-registration-review`. Para comparar medidas, `REGISTRATION_BASELINE=1` obtiene la referencia anterior en `/tmp/adolfo-registration-before.json`; si ese archivo no existe, las demás comprobaciones siguen disponibles.

Sin cambios de colores, fondos, imágenes, tamaños de logotipos, menú, selector, formularios, WhatsApp ni configuración. Pendiente de aprobación visual; no fusionar ni publicar automáticamente.
