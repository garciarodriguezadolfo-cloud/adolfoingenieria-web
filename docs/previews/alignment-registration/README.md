# PR #19 corregida: referencia obligatoria PR #18

Se eliminan la redistribución y la reducción de letra de la primera propuesta de #19. La referencia es main 612e770, fusión de la PR #18. Las capturas `before-*` se han vuelto a obtener directamente de ese commit; `after-*` muestra la corrección actual, en 320, 390, 768 y 1440 px.

## Cambios compatibles con las restricciones

- Cabecera: centrado del dibujo visible con una traslación horizontal del 1,640625 %, compensando los márgenes transparentes asimétricos del archivo. No cambian tamaño, proporciones, altura ni posición vertical. Menú y banderas tienen exactamente las coordenadas y dimensiones de #18.
- Pie: se restaura el `flex-wrap` de #18. Sin grid, sin redistribuir ni cambiar el orden de los textos. Cuando el logo ya ocupa su propia fila en móvil, se centra mediante márgenes horizontales automáticos y compensación del margen transparente. No cambia su posición vertical ni su tamaño.
- Orden de información de #18: copyright, profesión/colegiación y enlaces legales. La segunda línea es exactamente «Ingeniero Mecánico | Colegiado n.º 4.702 COITIA» en español, con traducciones equivalentes en los otros cinco idiomas. Permanece entera en una línea en los 24 casos.
- Se conservan los 11 px originales, la fuente, el interlineado, las separaciones y las coordenadas del copyright y los enlaces legales. No se añaden separadores ni se cambian los destinos de los enlaces.

## Conflicto pendiente: centrado del pie en escritorio

No es posible centrar el logotipo del pie respecto a toda la pantalla a 768 px y simultáneamente conservar su posición vertical y las posiciones originales de los textos. La distribución aprobada tiene el logo y la información en la misma fila. Al desplazar solo el logo hasta el centro de la pantalla, el logo se superpone a los textos.

Se ha medido a 768 px: el bloque de textos empieza en x346,078; la segunda línea ocupa 244,125 px. El logo mide 260 × 155,391 px. La captura `rejected-overlap-768.png` muestra una prueba real de la traslación aislada al centro, descartada por superposición. Esa traslación **no** se incorpora al sitio.

Para respetar la restricción absoluta de no reorganizar ni desplazar verticalmente, en 768 y 1440 px se conserva la posición original del logo del pie. No se presenta este punto como completado: el centrado de escritorio queda pendiente de resolver la incompatibilidad entre los requisitos. No se modifica la distribución unilateralmente.

## Validación

- `tests/registration-layout-browser.cjs`: comparación contra una copia servida del commit 612e770, en seis idiomas × cuatro anchuras. Coinciden exactamente altura de cabecera, menú, banderas, posición vertical y dimensiones de los logos, distribución del pie, copyright y enlaces legales, fuente de 11 px y separaciones. Colegiación completa sin saltos ni desbordamientos.
- `tests/branding-browser.cjs`, `tests/header-browser.cjs`: regresión de navegación, teclado y presentación.
- `python3 tests/check_seo.py`, `npm test`, `git diff --check`. Pruebas del formulario simuladas; no se han enviado correos reales.
- Todos los archivos de imágenes y logos son idénticos byte por byte a #18. HTML de cabecera y contenido fuera del pie, enlaces, canonical, hreflang y sitemap de 42 URL intactos; solo cambia también la referencia de caché del CSS.

Capturas reales de Chromium con las fuentes actuales mediante fixtures temporales. El servidor de referencia usó el puerto 8773; la propuesta, 8772. `CORRECTION_BASELINE=1` obtiene las medidas de la referencia en `/tmp/adolfo-pr18-layout.json`; las capturas están en `/tmp/adolfo-pr19-correction`. La comparación geométrica se activa si existe ese archivo.

Sin cambios de imágenes, fondos, colores, tamaños de logos, otros textos, funcionalidades ni configuración. Misma PR #19, sin fusionar ni publicar automáticamente.
