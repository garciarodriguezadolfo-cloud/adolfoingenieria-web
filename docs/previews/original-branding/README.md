# PR #17: cabecera con el logotipo completo

La revisión sustituye la composición anterior por una única imagen en la cabecera: `assets/branding/complete-logo-transparent.png`. Se eliminan el símbolo independiente, las iniciales insertadas por separado y el subtítulo HTML. La imagen contiene el nombre y la denominación profesional originales; su texto alternativo mantiene el nombre completo y la descripción accesible del idioma correspondiente.

## Imagen original y transparencia

El original es `assets/branding/original-logo.jpg`, el mismo JPEG completo utilizado en el pie de página. SHA-256: `805cef1937c20618fbaa009226708c6a2af5feefa5456bdcd3bc21422aade067`.

La versión PNG conserva el lienzo de 1254 × 765, los márgenes, la composición y los valores RGB de **todos** los píxeles originales, comprobados byte por byte. Únicamente se añade un canal alfa para ocultar el fondo oscuro exterior y los espacios entre elementos. No se ha generado otro logotipo, vectorizado, recoloreado, recortado el lienzo ni recolocado letras o símbolos. El RGB de los reflejos plateados y dorados no cambia; su apariencia sobre blanco debe aprobarse visualmente.

`tools/prepare_header_logo.py` documenta la máscara utilizada: contornos de recorte para conservar las piezas oscuras originales, separación de texto/fondo por luminancia y un píxel de margen alrededor del primer plano. Es una herramienta opcional de preparación de recursos, no parte de la compilación ni una dependencia de la web. Los PNG ya preparados se sirven directamente. Revisar los bordes y la legibilidad del texto metálico sobre blanco antes de aprobar.

## Comparativas

`before-*` muestra la propuesta anterior de esta misma PR (commit 632f728). `after-*` muestra la nueva imagen completa. Cabecera y pie a 320, 390, 768 y 1440 px. El menú mantiene su alineación y posición relativa debajo de la identidad; el selector sigue arriba a la derecha. La altura de la cabecera se adapta a la proporción original del logotipo completo, sin comprimirlo.

El pie conserva exactamente su HTML, sus reglas CSS y su JPEG de la revisión anterior. Las pequeñas diferencias de rasterizado de sus capturas se deben al posicionamiento subpíxel al cambiar la altura anterior de la página; no se ha cambiado el pie.

## Validación

- Seis idiomas × cuatro anchuras: una imagen en cabecera, otra en pie, carga correcta, proporciones originales, nombre accesible y ausencia de desbordamiento.
- `tests/branding-browser.cjs` y `tests/header-browser.cjs`: navegación, teclado, menú y seis banderas en una fila.
- `python3 tools/build_site.py`, `python3 tests/check_seo.py`, `npm test` y `git diff --check`. Pruebas del formulario con proveedores simulados; sin correos reales.
- Comparación contra 632f728: solo cambia la cabecera y la referencia de caché del CSS; pie, contenidos restantes, enlaces, canonical, hreflang y sitemap intactos.

Capturas reales de Chromium con las mismas fuentes DM Sans y Manrope actuales mediante fixtures temporales, sin añadir dependencias al sitio. Pendiente de aprobación visual del propietario. No fusionar ni publicar automáticamente.
