# Auditoría SEO y comprobación de Cloudflare Pages

Fecha: 11 de noviembre de 2026. Base: main, ee97883.

## Hallazgos y límites

- El repositorio es un sitio estático sin compilador, Functions, Worker, `_redirects`, `_headers` ni configuración de Pages versionada en la base revisada. `index.html`, `en/index.html`, `sitemap.xml`, `robots.txt`, CSS y JS están en la raíz. La configuración real del proyecto en Cloudflare no está accesible desde este entorno.
- El sitemap de la base es XML válido, contiene ambas URL HTTPS canónicas y robots permite el rastreo y lo anuncia. No se necesita cambiar las URL ni añadir fechas ficticias.
- Ambas páginas tienen idioma, título y descripción propios, canonical autorreferente y hreflang recíprocos es/en/x-default. La versión inglesa tenía og:url apuntando a español: corregido.
- El selector anterior traducía mediante JS sin navegar: dejaba canonical, hreflang y descripción de la URL original. Ahora son enlaces rastreables entre / y /en/, con el mismo identificador y estilo. Se conserva el contenido y CSS. También se elimina un cierre span sobrante en el H1 inglés.
- Sin un 404.html superior, Pages puede aplicar el fallback SPA y responder con index.html a recursos inexistentes. Esto es compatible con el síntoma histórico de XML convertido en portada, pero no prueba su causa. Se añade 404.html para que las rutas inexistentes fallen como 404; no se reescriben todas las rutas a la portada.
- `_headers` fija XML para el sitemap y texto para robots. Esto no crea archivos ausentes ni evita bloqueos de seguridad; debe publicarse junto a los archivos reales.
- Los GET a https://adolfoingenieria.es/sitemap.xml y https://adolfoingenieria.pages.dev/sitemap.xml fallaron en el túnel CONNECT del proxy del entorno: 403, server envoy, antes de contactar el sitio. No son respuestas HTTP del origen ni evidencia de Cloudflare. No se pudo comprobar remotamente estado, MIME, cuerpo, redirecciones ni encabezados de indexación de las páginas. No se afirma resuelto el 403 de Search Console.

## Revisar Pages antes de fusionar

1. En Workers & Pages → proyecto → Settings → Builds & deployments (los nombres pueden variar), comprobar repositorio `garciarodriguezadolfo-cloud/adolfoingenieria-web`, rama de producción `main`, raíz del proyecto en la raíz del repositorio, framework None, sin compilación y directorio de salida `.`. Si existe un proceso de compilación real, su salida debe incluir ambos HTML, assets, sitemap.xml, robots.txt, _headers y 404.html en los lugares equivalentes. No cambiar una configuración existente sin comprobar primero el artefacto.
2. En Deployments, comparar el SHA publicado con el de GitHub y los registros de despliegue. Confirmar que el dominio personalizado pertenece a este proyecto, no a otro despliegue o Worker. El dominio pages.dev por sí solo no acredita qué versión está publicada en el dominio personalizado.
3. Revisar Redirect Rules, Bulk Redirects, Page Rules, Workers Routes y Transform Rules del dominio. No debe haber una reescritura `/* → /index.html 200`, ni reglas que conviertan /sitemap.xml o /robots.txt en HTML, ni un X-Robots-Tag noindex en / o /en/. No se han podido inspeccionar estas reglas externas.
4. Pages normaliza habitualmente /index.html a / y /en/index.html a /en/. Comprobar también /en, HTTP y www: deben converger en HTTPS sin bucles y conservar la ruta. No añadir un salto al español para /en/.
5. Si pages.dev sirve copia indexable, configurar una redirección de host hacia el dominio canónico conservando path y query, con el mecanismo que admita ese host. No aplicar esa regla a las URL de preview de la PR si se necesitan para revisión. Verificar primero a qué proyecto pertenece ese host.

## Investigar el 403 en seguridad sin desactivar protecciones globales

1. Abrir Security → Events (o Analytics → Events) en la zona adolfoingenieria.es. Ejecutar una nueva prueba real en Search Console y filtrar por host, ruta exacta /sitemap.xml, acción Block/Challenge y hora de esa prueba. Anotar Ray ID, regla/ID, producto que actuó, IP y clasificación de bot. Un evento anterior no confirma el estado actual.
2. Si coincide `Block AI training crawlers`, abrir la regla o ajuste desde ese evento (Security → Bots / AI Crawl Control, según interfaz y plan). Comprobar su expresión, alcance, orden y si la excepción ya creada se evalúa antes y cubre ese mismo producto. Una acción Skip de reglas personalizadas no necesariamente omite AI Crawl Control u otros productos; confirmar las opciones reales y los eventos posteriores.
3. Mantener el bloqueo de crawlers de entrenamiento. Si es una regla personalizada editable, excluir únicamente el Googlebot verificado: comprobar `cf.client.bot` y, cuando esté disponible, la identidad verificada de Googlebot; limitar la excepción al host y al alcance necesario. Para probar el sitemap, limitar a `/sitemap.xml`, con GET/HEAD. No usar solo User-Agent ni permitir cualquier bot verificado de cualquier proveedor. Si el producto dispone de controles por crawler, permitir Googlebot/Search y mantener bloqueados los crawlers de entrenamiento. Si no admite una excepción específica, escalar el Ray ID y el ID de regla a Cloudflare en vez de crear un bypass global.
4. Googlebot de búsqueda y Google-Extended tienen funciones distintas. No confundir una restricción de uso para entrenamiento con denegar el rastreo de Google Search. Verificar la IP con DNS inverso y directo o con rangos publicados por Google si la clasificación genera dudas.
5. Si el evento identifica otro producto (WAF, rate limiting, Bot Fight Mode, Access), corregir solo la regla que realmente bloqueó. Verificar que Access no exige login para recursos SEO públicos. No se ha modificado ninguna regla de seguridad desde esta rama.

## Pruebas y criterio de cierre

Validación local superada: `python3 tests/check_seo.py`, `node --check script.js` y `git diff --check`. Chromium/Playwright confirmó navegación ES → EN → ES, canonical inglés después de navegar, contenido inglés sin JavaScript y ausencia de errores JS. El servidor local no reproduce el motor de enrutamiento ni la seguridad de Cloudflare.

Desde una red con acceso al dominio ejecutar GET (no solo HEAD):

```sh
curl -sS -L --max-redirs 5 -D /tmp/sitemap.headers https://adolfoingenieria.es/sitemap.xml -o /tmp/sitemap.xml
python3 -c 'import xml.etree.ElementTree as E; print(E.parse("/tmp/sitemap.xml").getroot().tag)'
curl -sS -L -D /tmp/pages.headers https://adolfoingenieria.pages.dev/sitemap.xml -o /tmp/pages-sitemap.xml
curl -sS -L -D /tmp/robots.headers https://adolfoingenieria.es/robots.txt
curl -sS -L -D /tmp/es.headers https://adolfoingenieria.es/
curl -sS -L -D /tmp/en.headers https://adolfoingenieria.es/en/
curl -sS -D /tmp/missing.headers https://adolfoingenieria.es/seo-missing-file.xml
```

Exigir 200 final y XML real (raíz urlset, namespace sitemaps.org) para sitemap, MIME application/xml, ambas URL canónicas; robots con 200 y texto, sin HTML. Pages puede devolver XML o redirigir al mismo XML canónico; no debe devolver la portada. La ruta inexistente debe devolver 404. Inspeccionar la cadena completa de redirecciones y que las páginas no tengan noindex ni X-Robots-Tag restrictivo. Comprobar canonical/hreflang tanto en HTML inicial como tras renderizar y navegar con el selector.

Un curl con User-Agent de Googlebot solo prueba ese encabezado: no es una solicitud de Googlebot verificado. Para cerrar el incidente: nueva prueba en Search Console, reenvío del sitemap, estado de lectura correcto y registro de acceso real de Google sin bloqueo a /sitemap.xml. Correlacionar la hora de último acceso: un error histórico puede persistir hasta el siguiente intento. Mantener pendiente esta confirmación tras la publicación aprobada.

## Revisión y publicación

Esta rama no debe fusionarse ni publicarse en producción sin revisión. Un push puede generar una preview automática según la configuración existente de Pages. La creación de PR y las pruebas de preview no corrigen por sí solas el bloqueo de producción.
