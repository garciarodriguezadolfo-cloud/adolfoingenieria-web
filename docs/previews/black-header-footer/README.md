# Cabecera y pie negros: revisión visual

Comparativas reales de Chromium a 320, 390, 768 y 1440 px. `before-*` corresponde a main 9fa79da; `after-*` a esta propuesta. Se revisaron además las seis versiones lingüísticas a las cuatro anchuras. Las mismas fuentes actuales DM Sans y Manrope se sirvieron como fixtures temporales durante las capturas, sin añadir dependencias a la web.

## Logotipo original

El único original completo disponible es `assets/branding/original-logo.jpg`, de **1280 × 765 px**. El archivo separado del símbolo no contiene el nombre y no sirve para sustituir los caracteres. Se usa exclusivamente el JPEG completo, sin generar letras, vectorizar, recolorear ni reorganizar la composición. El PNG tiene el mismo lienzo y los mismos valores RGB; únicamente cambia la máscara alfa de fondo.

La máscara anterior de la A de Adolfo ocultaba 38 de los 3142 píxeles metálicos con intensidad máxima de canal ≥100 en su región (x700–830, y350–447). La nueva máscara conserva los 3142 y todos los píxeles dorados de esa región. Se recuperan los bordes directamente del original con separación de primer plano y fondo y un margen limitado alrededor de los píxeles originales; no se pinta un contorno nuevo. El procedimiento reproducible está en `tools/prepare_header_logo.py` y la regresión en `tests/check_logo_asset.py`.

La imagen se presenta con transparencia en cabecera y pie sobre el mismo negro `#000`. Su perímetro es transparente; no se utiliza el JPEG opaco como caja de fondo. La cabecera tiene un máximo de 480 px y el pie 260 px, siempre reducidos proporcionalmente por debajo del tamaño natural; no se amplía el original. Revisar visualmente el borde de la A y el detalle dorado antes de aprobar. No se promete una calidad superior a la información del JPEG.

## Distribución y accesibilidad

Logo de cabecera centrado en el ancho de la ventana (tolerancia de prueba <1 px), banderas arriba a la derecha de 18 × 12 px, códigos blancos y foco visible. Menú blanco con línea separadora blanca y navegación nativa. Logo del pie reducido respecto a 340 px, a la izquierda; información, copyright y enlaces a la derecha, con salto debajo en móvil. Textos originales conservados en blanco/gris claro.

## Validación

- Seis idiomas × 320/390/768/1440: negro uniforme, centrado, proporciones, ausencia de recortes/desbordamientos, sin ampliar el original.
- `tests/branding-browser.cjs`, `tests/header-browser.cjs` y `tests/flags-browser.cjs`: navegación, teclado, foco y selector con/sin JavaScript.
- `python3 tests/check_logo_asset.py`: lienzo/RGB intactos, perímetro transparente y conservación del plateado/dorado de la A.
- `python3 tools/build_site.py`, `python3 tests/check_seo.py`, `npm test`, `git diff --check`.
- Comparación contra main: contenido fuera de cabecera/pie, destinos de enlaces, canonical, hreflang y sitemap de 42 URL idénticos. Pruebas del formulario simuladas; no se enviaron correos reales.

Las pruebas visuales aceptan `TEST_BASE_URL`; esta revisión usó un servidor local en el puerto 8770. Sin cambios de DNS, secretos, configuración ni despliegue manual. Pendiente de aprobación visual del propietario; no fusionar ni publicar automáticamente.
