# Separación del menú y línea inferior

Comparación con `main` (`cd741d1`). Capturas reales de Chromium a escala 2×, con DM Sans y Manrope originales. En cada imagen: antes y después.

Solo cambia el menú: +1 px entre enlaces hasta 640 px y +4 px en escritorio. Se conserva el tamaño de letra; el ruso compensa mínimamente el interletraje (−0,09 px) para mantener la fila completa. La línea blanca mide el 94 % del menú, está centrada y queda a 12 px de los enlaces. Su espacio original de layout se conserva para no cambiar la altura de la cabecera.

## Cabecera completa

- [320 px](es-header-320.png)
- [390 px](es-header-390.png)
- [768 px](es-header-768.png)
- [1440 px](es-header-1440.png)

## Comparativas de los seis idiomas

| Idioma | 320 px | 390 px | 768 px | 1440 px |
|---|---|---|---|---|
| ES | [320](es-menu-320.png) | [390](es-menu-390.png) | [768](es-menu-768.png) | [1440](es-menu-1440.png) |
| EN | [320](en-menu-320.png) | [390](en-menu-390.png) | [768](en-menu-768.png) | [1440](en-menu-1440.png) |
| DE | [320](de-menu-320.png) | [390](de-menu-390.png) | [768](de-menu-768.png) | [1440](de-menu-1440.png) |
| NO | [320](no-menu-320.png) | [390](no-menu-390.png) | [768](no-menu-768.png) | [1440](no-menu-1440.png) |
| RU | [320](ru-menu-320.png) | [390](ru-menu-390.png) | [768](ru-menu-768.png) | [1440](ru-menu-1440.png) |
| NL | [320](nl-menu-320.png) | [390](nl-menu-390.png) | [768](nl-menu-768.png) | [1440](nl-menu-1440.png) |

## Validación

- Las 24 combinaciones de idioma/anchura mantienen seis enlaces en una sola fila, centrados y sin desbordamiento.
- Comparación automática con main: mismas dimensiones y posición del logotipo, banderas y cabecera; misma tipografía y posición vertical de los enlaces.
- Línea de 1 px blanca, centrada al 94 % del menú y separación uniforme de 12 px.
- Enlaces HTTP 200 y foco por teclado en los seis apartados.
- `python3 tools/build_site.py`, `python3 tests/check_seo.py`, `npm test` y `tests/final-header-footer-browser.cjs`: correctos. No se enviaron correos reales.
- Los 61 HTML generados solo cambian la clave de caché del CSS. Sitemap, metadatos y contenidos intactos.

`tests/navigation-spacing-browser.cjs` captura y compara geometría y pantallas. Primero ejecutar en main con `SPACING_BASELINE=1`; después en esta rama sin esa variable, conservando el mismo `SPACING_OUT` y las mismas fuentes. `TEST_BASE_URL` indica el servidor local y `HEADER_FONT_DIR` las fuentes originales para pruebas sin acceso a Google Fonts.
