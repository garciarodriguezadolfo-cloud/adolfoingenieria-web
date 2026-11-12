# Imágenes originales: revisión visual

Capturas reales de Chromium de las dos secciones modificadas, en español, a 1440 px (escritorio) y 390 px (móvil). Se revisaron además las seis portadas a 320, 390, 768 y 1440 px; las capturas completas de las 24 combinaciones se generan mediante `tests/images-browser.cjs`.

Los JPEG proporcionados se incorporan sin recomprimir, retocar ni recortar:

- `assets/images/informe-pericial.jpg`: 1280 × 853, 136084 bytes; SHA-256 `e2e9d4e8a27ef04a13258aaf312c49a6937d41ddf6b4215e41b6b4a2b4f9db8a`.
- `assets/images/manuel-adolfo-garcia-rodriguez.jpg`: 1254 × 1254, 179701 bytes; SHA-256 `ca3c53a50b5e9f230969f3030177aa9627f017c7a323c209907dc78045733d26`.

Se preservan las proporciones, incluido el círculo original de la fotografía. La foto usa carga diferida y ambas imágenes declaran dimensiones intrínsecas para reservar espacio. La ilustración principal tiene prioridad de carga alta. No se añaden dependencias.

Validación: `python3 tests/check_seo.py`, `npm test` y `node tests/images-browser.cjs` con servidor local en el puerto 8765. Para las capturas de esta revisión se utilizaron copias locales temporales de las mismas fuentes DM Sans y Manrope existentes mediante `HEADER_FONT_DIR`; no se incorporan al sitio. Las pruebas del formulario usan proveedores simulados y no envían correos reales.
