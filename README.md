# Manuel Adolfo García Rodríguez | Ingeniero Mecánico

Sitio estático bilingüe de adolfoingenieria.es. Conserva la identidad visual original (paleta, tipografías, ilustración técnica y diseño adaptable) y añade páginas de servicio.

## Publicación

Los HTML generados y los recursos están versionados y listos para servir desde la raíz del repositorio. No requiere Node, Python ni compilación en Cloudflare Pages. Esta ampliación no cambia la configuración de Pages, `_headers`, las reglas de seguridad ni `robots.txt`.

## Edición

- Correo de contacto confirmado: `site/config.json`.
- Contenido de los cinco servicios en ambos idiomas: `site/services.json`.
- Bloques originales de inicio: `site/templates/home-es.html` y `home-en.html`.
- Plantilla compartida, contacto, borradores legales, rutas y metadatos de inicio: `tools/build_site.py`.
- Apariencia y comportamiento: `styles.css` y `script.js`.
- Regenerar después de editar fuentes: `python3 tools/build_site.py`. Los HTML resultantes y `sitemap.xml` deben incluirse en el mismo commit. No editar únicamente los HTML generados.

## Comprobaciones

```sh
python3 tools/build_site.py
python3 tests/check_seo.py
node --check script.js
git diff --check
python3 -m http.server 8765 --bind 127.0.0.1
```

En otra terminal, con Playwright disponible y Chromium instalado:

```sh
node tests/browser.cjs
```

Se puede cambiar el servidor mediante `TEST_BASE_URL` y el ejecutable mediante `CHROMIUM_PATH`. Las pruebas de navegador recorren todas las páginas a 1440, 390 y 320 píxeles, comprueban los pares de idioma con y sin JavaScript, el canonical y que el borrador no envía ni almacena datos. Capturas en `/tmp/adolfo-preview/`.

## Pendientes del titular

Consultar `docs/service-expansion.md`. El correo confirmado es garciarodriguezadolfo@gmail.com. El formulario prepara un borrador local y permite copiarlo o abrirlo en la aplicación de correo del usuario; la web no realiza el envío. Los textos legales son borradores identificados y noindex, fuera del sitemap. No se han inventado teléfono, dirección, NIF, precios, horarios, reseñas ni acreditaciones.
