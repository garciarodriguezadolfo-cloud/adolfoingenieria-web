# Integración del logotipo original

Se conservan ambos JPEG proporcionados, sin recomprimir ni redibujar:

- `assets/branding/original-symbol.jpg`: SHA-256 `92ac70a68941ecd7f4e88a8cf4327a13a03d21f440b3781b5dbbad2d4d31dcab`.
- `assets/branding/original-logo.jpg`: SHA-256 `805cef1937c20618fbaa009226708c6a2af5feefa5456bdcd3bc21422aade067`.

El pie muestra el segundo JPEG completo, incluido su fondo oscuro y todos sus textos. La cabecera conserva su fondo blanco y utiliza tres recortes rasterizados con transparencia: símbolo de la primera imagen e iniciales M/A del nombre de la segunda. No se ha generado un logotipo con IA, redibujado, vectorizado, recoloreado ni añadido ningún detalle geométrico o dorado.

`crop-coordinates.json` documenta las máscaras de recorte sobre las coordenadas originales. Se aplicó una máscara binaria a los contornos, conservando un margen exterior de un píxel (`MaxFilter(3)`). La extracción mantiene los valores RGB de los JPEG decodificados: se comprobó igualdad byte por byte entre cada PNG y la región de origen; únicamente cambia el canal alfa para ocultar el fondo exterior. Estas máscaras no son una vectorización del logotipo: los acabados y contornos visibles siguen siendo los píxeles originales.

Regiones finales (izquierda, arriba, derecha, abajo): símbolo `(152,76,1164,573)`, M `(202,357,368,442)`, A `(707,358,823,441)`. Tamaños PNG 1012×497, 166×85 y 116×83 respectivamente. Los detalles se escalan proporcionalmente por CSS. El pie utiliza el archivo original sin recortar. Revisar visualmente los bordes de las extracciones sobre blanco antes de aprobar.

Capturas reales de Chromium: `before-*` y `after-*`, cabecera y pie, a 320, 390, 768 y 1440 px. Se comprobaron los seis idiomas a estas anchuras. Las fuentes DM Sans y Manrope existentes se sirvieron mediante fixtures temporales para evitar depender de la red durante las pruebas, sin añadir fuentes ni dependencias al sitio.

Pruebas: `python3 tools/build_site.py`, `python3 tests/check_seo.py`, `npm test` (proveedores simulados, sin correos reales), `tests/branding-browser.cjs` y `tests/header-browser.cjs`. La primera prueba usa por defecto un servidor local en el puerto 8768 y guarda capturas en `/tmp/adolfo-logo-review`. `BRAND_BASELINE=1` captura el estado anterior en español; `BRAND_LANGS=es` limita la revisión final a español. El nombre completo permanece como nombre accesible de la identidad y todas las iniciales son decorativas dentro de esa identidad.

No se modifican contenidos fuera de cabecera/pie, enlaces, formularios, SEO, WhatsApp, configuración ni sitemap de 42 URL. El nuevo hash del CSS compartido actualiza su referencia de caché en las páginas, incluida la 404. Pendiente de aprobación visual del propietario; no fusionar ni publicar automáticamente.
