# PR #19: distribución final del pie

Referencia: versión aprobada de PR #18, commit 612e770. La aclaración final resuelve el criterio de escritorio: el logo permanece a la izquierda y la información a su derecha; no se centra el logo respecto a toda la pantalla cuando comparte fila con los textos.

## Resultado

- Móvil (320 y 390 px): logo centrado horizontalmente en su fila original; debajo, copyright, profesión/colegiación y enlaces legales alineados a la izquierda, con la sangría de #18.
- Escritorio/tableta (768 y 1440 px): distribución de #18, con logo a la izquierda y textos a la derecha, separados por los 40 px originales y sin superposición.
- Los márgenes automáticos del logo se aplican exclusivamente en la franja móvil en que ya ocupa una fila propia. No se introduce grid ni se reorganizan los bloques.
- Tamaño de logos, posiciones verticales, fuente de 11 px, separaciones, colores y fondos originales conservados.
- La segunda línea española permanece exactamente «Ingeniero Mecánico | Colegiado n.º 4.702 COITIA», entera en una línea, con traducciones equivalentes en los otros cinco idiomas.
- Se conserva sin cambios el ajuste horizontal de cabecera ya realizado. En esta revisión no se toca la cabecera, el menú ni las banderas.

La compensación horizontal del margen transparente del archivo conserva los píxeles originales. La imagen, sus proporciones y su tamaño no se modifican. El logotipo móvil tiene el centro visible en el centro de la pantalla; el de escritorio conserva la posición izquierda aprobada.

## Validación

`tests/registration-layout-browser.cjs` compara las medidas con una copia servida de la PR #18, en seis idiomas × 320/390/768/1440 px. Verifica:

- Mismas coordenadas y dimensiones de cabecera, menú y selector.
- Tamaños y posiciones verticales de ambos logos sin cambios.
- Copyright y enlaces legales con iguales textos, coordenadas y dimensiones, fuente de 11 px, interlineado y separaciones originales.
- Logo centrado y textos debajo en móvil, con las tres líneas alineadas a la izquierda.
- Logo a la izquierda y textos a la derecha en escritorio, con separación de 40 px y sin superposición.
- Línea completa de colegiación y ausencia de desbordamiento en los 24 casos.

`python3 tools/build_site.py`, `python3 tests/check_seo.py` y `git diff --check` completados. Comparación de esta revisión contra la versión anterior de #19: todo el HTML de cabecera/pie y contenido de páginas es idéntico salvo la referencia de caché del CSS; imágenes y sitemap también idénticos byte por byte. No se han modificado textos, enlaces, SEO ni funcionalidades.

Las capturas `before-*` corresponden a #18 y `after-*` al resultado final, a las cuatro anchuras. Chromium real, con las fuentes actuales DM Sans y Manrope servidas como fixtures temporales, sin nuevas dependencias de la web. El servidor final usado fue el puerto 8774; las capturas están en `/tmp/adolfo-pr19-correction`. `CORRECTION_BASELINE=1` obtiene las medidas de referencia para la comparación opcional en `/tmp/adolfo-pr18-layout.json`.

Misma PR #19. Pendiente de revisión visual; no fusionar ni publicar automáticamente.
