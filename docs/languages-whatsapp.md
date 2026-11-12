# Ampliación de idiomas y WhatsApp

## Cambios

- Español e inglés conservados; alemán `/de/`, noruego bokmål `/no/` y ruso `/ru/` incorporados a inicio, contacto, cinco servicios y ambos avisos legales.
- 45 páginas localizadas más un 404 compartido con acceso a los cinco idiomas.
- Selector de enlaces nativos a la página equivalente, con idioma actual indicado. Funciona sin JavaScript.
- Bokmål usa el código lingüístico `nb` en HTML, hreflang, datos estructurados, Turnstile y solicitudes de contacto; la ruta solicitada sigue siendo `/no/`.
- Títulos y descripciones propios, canonical autorreferente, seis alternates (cinco idiomas y x-default español), Open Graph y datos WebPage/Service. Los peritajes incluyen España, Comunidad Valenciana y Alicante; certificados y aperturas conservan su ámbito provincial.
- Los municipios solicitados se describen en las páginas de servicio, sin crear páginas locales duplicadas.
- Sitemap con las 35 páginas indexables. Los 10 avisos legales conservan el estado anterior de borrador/noindex; el 404 también sigue noindex.
- WhatsApp mediante enlace `https://wa.me/34638651175?text=…`, mensaje inicial en el idioma de la página y número visible `+34 638 651 175`. No carga widgets, usa APIs ni envía mensajes automáticamente. Incluye espacio inferior y consideración de áreas seguras móviles.
- Pages Function: únicamente se amplía la validación del idioma. Se mantienen destinatario Gmail, remitente configurable, secretos, verificación Turnstile en servidor, integración Resend, idempotencia y tratamiento de errores. No se cambia la activación existente.
- Sin modificaciones de DNS, seguridad, `_headers`, `_routes.json`, `robots.txt` ni variables de Cloudflare. Sin dirección profesional física ni tarifas publicadas. Nombre profesional conservado: Manuel Adolfo García Rodríguez.

## Validación ejecutada

- `python3 tools/build_site.py`: 45 páginas localizadas y sitemap regenerados.
- `python3 tests/check_seo.py`: canonical, metadatos únicos, seis alternates recíprocos, códigos de idioma, schema, número, enlaces y anclas internas, formularios y cobertura exacta del sitemap. También busca HTML indexable fuera de la tabla de rutas para detectar páginas omitidas.
- `npm test`: pruebas de backend con proveedores simulados; incluye aceptación de `es/en/de/nb/ru`, destinatario fijo, validación, captcha, errores y reintentos.
- `node --check script.js` y `git diff --check`: correctos.
- `node tests/browser.cjs`: las 45 rutas a 1440, 390 y 320 px, cambio a cada idioma equivalente, también sin JavaScript; enlaces de WhatsApp, canonical, ausencia de desbordamiento horizontal y errores de JavaScript.
- `TEST_BASE_URL=http://127.0.0.1:8765 node tests/contact-browser.cjs`: las diez páginas con formulario; aceptación simulada, errores de entrega/verificación, indisponibilidad, fallo de red, preservación de consulta, validación obligatoria y caducidad del captcha. Sin almacenamiento persistente.
- `node tests/whatsapp-browser.cjs`: clic real en el enlace con destino interceptado localmente, cinco idiomas a 1440/390/320 px, URL y mensaje conservados al abrir pestaña, controles del formulario utilizables, pie libre y 404 compartido.
- `npx --yes wrangler@4.46.0 pages functions build functions --outdir /tmp/adolfo-functions-build --build-output-directory .`: Worker compilado correctamente, sin despliegue.
- Capturas de escritorio y móvil en `/tmp/adolfo-preview/`; inspección visual de contacto alemán en escritorio y ruso a 320 px. Las pruebas bloquean Google Fonts y usan fuentes alternativas locales; no verifican la descarga externa de tipografías.

## Límites y revisión

Las pruebas de correo y Turnstile usan fixtures: no acreditan un nuevo envío real ni recepción en Gmail. Los enlaces de WhatsApp se verifican con destinos interceptados; no se ha enviado un mensaje ni probado una aplicación instalada en un teléfono físico. No se accede a secretos de producción ni se modifica la configuración del formulario ya operativo.

Los textos legales ya eran borradores antes de esta ampliación: se traduce ese estado sin convertirlos en textos definitivos ni bloquear el funcionamiento actual. La revisión legal pendiente preexistente queda indicada. Las traducciones técnicas están implementadas; no se atribuye una revisión externa a un traductor jurado o especialista humano.

La entrega se realiza mediante rama y Pull Request hacia main. No fusionar ni desplegar producción en esta tarea.
