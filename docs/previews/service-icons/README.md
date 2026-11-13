# Iconos personalizados de servicios

Comparativas reales de Chromium: `before-*` corresponde a main (0ae40c1) y `after-*` a esta rama. Se incluyen escritorio (1440 px) y móviles de 320 y 390 px. Las seis versiones lingüísticas se comprueban también a 768 px.

SVG dibujados expresamente para cada servicio, sin bibliotecas ni dependencias: hoja con gráfica azul; colisión con aspa roja; siete barras energéticas; vivienda con verificación verde; tienda con verificación verde. Fondo transparente, viewBox cuadrado y tamaño renderizado de 30 × 30 px. Los pequeños distintivos usan máscaras vectoriales para evitar que el contorno de la vivienda/tienda atraviese la marca de verificación sin añadir fondos opacos.

Las imágenes son decorativas (`alt=""`, contenedor `aria-hidden`): el título original del servicio conserva el nombre accesible del enlace y su único punto de tabulación. El enlace original se extiende sobre toda la fila mediante CSS, incluido el icono, sin introducir enlaces anidados ni manejadores JavaScript.

Validación realizada:

- Comparación antes/después de las cinco filas en seis idiomas × cuatro anchuras: altura, anchura, posición horizontal, título y destino idénticos.
- Cinco SVG cargados, 30 × 30 px y ausencia de desbordamiento horizontal en las 24 combinaciones.
- Cinco destinos por idioma y anchura: foco mediante teclado, activación con Enter y respuesta HTTP 200; área del icono alcanzable mediante el enlace.
- Comparación de las seis portadas generadas contra main: solo cambia el contenido de los cinco contenedores de flecha.
- `python3 tests/check_seo.py`: enlaces, metadatos, canonical, hreflang, datos estructurados, 54 páginas y sitemap de 42 URL.
- `npm test`: pruebas del formulario con proveedores simulados; ningún correo real enviado.

Para repetir las pruebas visuales: servir el repositorio en el puerto 8766 y ejecutar `node tests/service-icons-browser.cjs`. Las capturas se guardan en `/tmp/adolfo-service-icons`. Para medir una base antes de aplicar los cambios, ejecutar primero el mismo script con `ICONS_BASELINE=1` sobre main; la comparación de geometría se activa cuando existe ese `baseline.json`. En esta revisión se emplearon fixtures locales temporales de las fuentes actuales DM Sans y Manrope mediante `HEADER_FONT_DIR`; no se añaden al sitio.
