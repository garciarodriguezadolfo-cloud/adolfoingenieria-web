# Neerlandés y selector de banderas

## Implementación

Rama basada en `main` con la ampliación anterior ya integrada. Se añade neerlandés bajo `/nl/`: inicio, los cinco servicios, contacto y ambos avisos legales (nueve páginas). Traducciones compartidas y mensajes en `site/locales/nl.json`, servicios en `site/services.json`, avisos en `site/legal-locales.json` e inicio en `site/templates/home-nl.html`.

Se mantienen servicios, zonas de atención y municipios. Los nombres de trámites españoles se explican en neerlandés sin equipararlos a procedimientos neerlandeses o belgas. Se conserva el nombre profesional completo.

Las 54 páginas localizadas tienen canonical propio y siete alternates: seis idiomas más x-default español. Neerlandés usa `lang="nl"`, hreflang `nl`, Open Graph `nl_NL` y datos WebPage/Service correspondientes. Sitemap con las 42 páginas indexables; se mantiene fuera a los 12 borradores legales y al 404.

Las seis banderas SVG están en `assets/flags/`: España, Reino Unido, Alemania, Noruega, Rusia y Países Bajos. Se muestran a 24 × 16 px, sin dependencias nuevas ni solicitudes externas. Cada enlace conserva nombre accesible nativo, atributo de idioma, título y destino de la página equivalente. El idioma activo se indica con aria-current y un subrayado discreto. El selector cabe en una fila a 320 px; los enlaces disponen de espacio adicional para interacción táctil y foco visible por teclado. El 404 compartido también permite acceder a los seis inicios.

Se añade WhatsApp en neerlandés: «Goedendag, ik wil graag informatie over uw ingenieursdiensten.» No cambia el número ni los mensajes de los otros cinco idiomas. La única modificación de la Pages Function es aceptar `nl` en su validación de idioma. Se conservan las integraciones, el destinatario de correo, configuración y secretos. Sin cambios de Cloudflare, DNS, Resend, Turnstile ni dependencias del proyecto.

## Comprobaciones

- Generación determinista: `python3 tools/build_site.py`.
- `python3 tests/check_seo.py`: 54 páginas, canonical y metadatos, alternates recíprocos, schema, enlaces y anclas, SVG locales con dimensiones uniformes, nombres accesibles y claves de traducción completas. Cobertura exacta de las 42 URLs indexables, incluida detección de páginas omitidas del sitemap.
- `npm test`: validación de los seis idiomas, destinatario fijo, captcha, errores e idempotencia, mediante proveedores simulados.
- `node --check script.js` y `git diff --check`.
- `node tests/browser.cjs`: 54 páginas a 1440/390/320 px, navegación entre las seis versiones equivalentes con y sin JavaScript, canonical, enlaces de WhatsApp, ausencia de desbordamiento horizontal y errores JS.
- `TEST_BASE_URL=http://127.0.0.1:8765 node tests/contact-browser.cjs`: doce páginas con formulario, aceptación simulada, errores, indisponibilidad, fallos de red, validación, caducidad y código de idioma de Turnstile.
- `node tests/whatsapp-browser.cjs`: clic y apertura del enlace exacto en pestaña con destino interceptado, seis idiomas y tres anchuras, número conservado y pie accesible.
- `node tests/flags-browser.cjs`: seis imágenes SVG cargadas, tamaño 24 × 16, fila compacta, nombres accesibles, indicador activo, secuencia Tab, foco visible y activación con Enter, a 1440/390/320 px.
- Compilación local de Pages Function con Wrangler 4.46.0, sin despliegue.
- Comparación contra `main`: contenido principal y enlaces WhatsApp idénticos en las 45 páginas anteriores.
- Capturas en `/tmp/adolfo-preview/`; inspección visual de la página inicial neerlandesa a 1440 y 320 px y del servicio de energía en móvil. Se ajustan los títulos para evitar cortes poco naturales de palabras largas.

## Alcance de las pruebas

Las pruebas de navegador bloquean Google Fonts y usan fuentes locales alternativas. Los correos, Turnstile y destinos WhatsApp se simulan: no se acredita un envío real, recepción en Gmail ni prueba con la aplicación de WhatsApp en un teléfono físico. Las traducciones están implementadas; no se atribuye una revisión externa por un traductor profesional. Los avisos legales mantienen su estado previo de borrador/noindex.

La entrega es una Pull Request hacia main, sin fusión ni despliegue de producción.
