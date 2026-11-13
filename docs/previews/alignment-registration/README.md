# PR #19: corrección definitiva del menú

El menú conserva los cinco textos y enlaces nativos, en una sola fila también a 320 y 390 px, en los seis idiomas. Solo se adapta su tamaño de letra, los espacios horizontales y la anchura horizontal disponible. El conjunto se centra, mantiene el color blanco y la línea separadora. No se usan abreviaturas, desplazamiento horizontal ni ocultación de elementos.

## Capturas grandes

Capturas reales de Chromium a densidad 2× (DPR 2): el viewport de 320 px produce un archivo de 640 px para facilitar la revisión. No se cambia el tamaño CSS ni el archivo de los logos. La imagen original no se amplía por encima de su resolución; todos los recursos originales se conservan. Abrir los enlaces para consultar cada archivo completo, sin miniaturas.

Los archivos `before-*` corresponden a la revisión anterior de esta misma PR, 7927bbe, que aún permitía dos filas. `after-*` muestra la corrección final española. Las otras versiones están en `languages/`.

| Idioma | 320 px | 390 px | 768 px | 1440 px |
| --- | --- | --- | --- | --- |
| Español | [Cabecera](after-header-320.png) · [Pie](after-footer-320.png) | [Cabecera](after-header-390.png) · [Pie](after-footer-390.png) | [Cabecera](after-header-768.png) · [Pie](after-footer-768.png) | [Cabecera](after-header-1440.png) · [Pie](after-footer-1440.png) |
| Inglés | [Cabecera](languages/en-header-320.png) · [Pie](languages/en-footer-320.png) | [Cabecera](languages/en-header-390.png) · [Pie](languages/en-footer-390.png) | [Cabecera](languages/en-header-768.png) · [Pie](languages/en-footer-768.png) | [Cabecera](languages/en-header-1440.png) · [Pie](languages/en-footer-1440.png) |
| Alemán | [Cabecera](languages/de-header-320.png) · [Pie](languages/de-footer-320.png) | [Cabecera](languages/de-header-390.png) · [Pie](languages/de-footer-390.png) | [Cabecera](languages/de-header-768.png) · [Pie](languages/de-footer-768.png) | [Cabecera](languages/de-header-1440.png) · [Pie](languages/de-footer-1440.png) |
| Noruego bokmål | [Cabecera](languages/no-header-320.png) · [Pie](languages/no-footer-320.png) | [Cabecera](languages/no-header-390.png) · [Pie](languages/no-footer-390.png) | [Cabecera](languages/no-header-768.png) · [Pie](languages/no-footer-768.png) | [Cabecera](languages/no-header-1440.png) · [Pie](languages/no-footer-1440.png) |
| Ruso | [Cabecera](languages/ru-header-320.png) · [Pie](languages/ru-footer-320.png) | [Cabecera](languages/ru-header-390.png) · [Pie](languages/ru-footer-390.png) | [Cabecera](languages/ru-header-768.png) · [Pie](languages/ru-footer-768.png) | [Cabecera](languages/ru-header-1440.png) · [Pie](languages/ru-footer-1440.png) |
| Neerlandés | [Cabecera](languages/nl-header-320.png) · [Pie](languages/nl-footer-320.png) | [Cabecera](languages/nl-header-390.png) · [Pie](languages/nl-footer-390.png) | [Cabecera](languages/nl-header-768.png) · [Pie](languages/nl-footer-768.png) | [Cabecera](languages/nl-header-1440.png) · [Pie](languages/nl-footer-1440.png) |

## Tipografía del menú, en píxeles CSS

| Idioma | 320 | 390 | 768 | 1440 |
| --- | ---: | ---: | ---: | ---: |
| Español | 14 | 14 | 15 | 15 |
| Inglés | 13 | 14 | 15 | 15 |
| Alemán | 12 | 14 | 15 | 15 |
| Noruego bokmål | 11,25 | 13,5 | 15 | 15 |
| Ruso | 9,5 | 11,25 | 15 | 15 |
| Neerlandés | 11 | 13 | 15 | 15 |

El caso más ajustado es ruso a 320 px; requiere 9,5 px y espacios compactos para conservar todas las traducciones completas en una fila. La captura rusa se incluye a tamaño grande para su revisión visual. Los tamaños crecen fluidamente con la pantalla; no se cambian familias ni pesos de letra. Datos medidos en `menu-measurements.json`.

## Pie y cabecera conservados

- Seis banderas pequeñas arriba a la derecha, en una fila, con códigos blancos debajo y funcionamiento nativo.
- Logotipo original de cabecera centrado, con idénticos tamaño, proporciones, colores y posición vertical.
- Pie móvil: logo centrado y tres bloques debajo, alineados a la izquierda con su sangría original.
- Pie de escritorio: logo a la izquierda y textos a la derecha, con la separación de 40 px de #18 y sin superposición.
- Fuente original del pie de 11 px, orden y separaciones conservados. «Ingeniero Mecánico | Colegiado n.º 4.702 COITIA» completo en una línea, con traducciones correspondientes.
- Separador «·» decorativo entre los enlaces legales, colocado en el hueco original sin desplazar enlaces ni cambiar su contenido o destino.

## Ocho comprobaciones de aceptación

`tests/final-header-footer-browser.cjs` verifica en seis idiomas × cuatro anchuras: banderas en fila; logo de cabecera centrado; cinco enlaces del menú en una sola fila y centrados; logo del pie centrado en móvil; información debajo y a la izquierda; colegiación completa; logo/textos separados en escritorio; y ausencia de desbordamientos. Comprueba además colores, tamaños originales de los logos, foco de teclado y respuesta HTTP 200 de los cinco enlaces de navegación. No se cambia la posición vertical del logo de cabecera.

Las 24 combinaciones pasan con DM Sans y Manrope actuales (fixtures temporales, sin dependencias nuevas de la web). Las 12 combinaciones móviles pasan también con Arial de respaldo si la fuente externa no está disponible. Parámetros opcionales del test: `TEST_BASE_URL`, `HEADER_FONT_DIR`, `FINAL_WIDTHS` y `FINAL_OUT`.

`python3 tools/build_site.py`, `python3 tests/check_seo.py`, `python3 tests/check_logo_asset.py` y `git diff --check` completados. Contra 7927bbe: HTML y contenidos idénticos salvo la referencia de caché del CSS, imágenes/logos y sitemap idénticos byte por byte. No se modifican servicios, iconos, URL, SEO, formularios ni WhatsApp. No se han enviado correos reales.

Misma PR #19. Pendiente de aprobación visual. No fusionar ni publicar.
