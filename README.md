# Manuel Adolfo García Rodríguez | Ingeniero Mecánico

Sitio estático en español, inglés, alemán, noruego bokmål, ruso y neerlandés de adolfoingenieria.es. Conserva la identidad visual original (paleta, tipografías, ilustración técnica y diseño adaptable) y añade páginas de servicio.

## Publicación

Los HTML generados y los recursos están versionados y listos para servir desde la raíz del repositorio. Los HTML no requieren compilación; Pages compila automáticamente la función del servidor al desplegar desde GitHub. El contacto directo usa una Pages Function en `/api/contact`; consulte `docs/contact-setup.md` para configurar Resend y Turnstile. `_routes.json` conserva el servicio estático para el resto de rutas. No cambia `_headers`, las reglas de seguridad ni `robots.txt`.

## Edición

- Datos de contacto confirmados: `site/config.json`.
- Contenido de los cinco servicios en los seis idiomas: `site/services.json`.
- Bloques originales de inicio: `site/templates/home-{es,en,de,no,ru,nl}.html`.
- Plantilla compartida, contacto, borradores legales, rutas y metadatos de inicio: `tools/build_site.py`.
- Traducciones compartidas y mensajes del formulario: `site/locales/{de,no,ru,nl}.json`; borradores legales traducidos: `site/legal-locales.json`.
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

Se puede cambiar el servidor mediante `TEST_BASE_URL` y el ejecutable mediante `CHROMIUM_PATH`. Las pruebas de navegador recorren las páginas a 1440, 390 y 320 píxeles y las seis versiones equivalentes con y sin JavaScript. Capturas en `/tmp/adolfo-preview/`.

El backend se verifica con `npm test`; la interfaz de envío con `TEST_BASE_URL=http://127.0.0.1:8765 node tests/contact-browser.cjs` (requiere el servidor anterior o `TEST_BASE_URL`). Las pruebas usan fixtures aislados y no acreditan envío real. Los enlaces de WhatsApp se prueban sin conexiones externas con `node tests/whatsapp-browser.cjs`. La compilación de Functions se puede comprobar con `npx wrangler pages functions build functions --outdir /tmp/adolfo-functions-build --build-output-directory .`.

## Pendientes del titular

Consultar `docs/service-expansion.md` y `docs/contact-setup.md`. El correo confirmado es garciarodriguezadolfo@gmail.com y el teléfono +34 638 651 175. El formulario envía mediante Resend y Turnstile cuando se configuran los servicios y `CONTACT_ENABLED=true`; sin configuración muestra indisponibilidad. No solicita claves al visitante ni usa su aplicación de correo para el envío directo. No se publica dirección ni precios. Los textos legales siguen identificados como borradores pendientes de revisión; se conserva su estado previo sin modificar la activación existente.

## Idiomas y WhatsApp

Las rutas son `/`, `/en/`, `/de/`, `/no/`, `/ru/` y `/nl/`. Bokmål utiliza `nb` en HTML, hreflang, Turnstile y el formulario, conservando `/no/` como URL. El selector enlaza las seis páginas equivalentes sin JavaScript. El sitemap incluye 42 URLs indexables; los 12 borradores legales y el 404 permanecen fuera. WhatsApp utiliza únicamente `wa.me` con mensaje inicial traducido y el número internacional visible. Consulte `docs/dutch-flags.md` para la ampliación a seis idiomas y `docs/languages-whatsapp.md` para la ampliación anterior.

El selector usa seis banderas SVG locales en `assets/flags/`, con nombres accesibles nativos, enlaces de teclado y marcador del idioma actual. Se comprueba con `node tests/flags-browser.cjs`. Los SVG son dibujos vectoriales minimalistas creados para este repositorio, sin dependencias externas.
