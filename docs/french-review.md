# Incorporación de francés — revisión visual

Base: `93f65e0` (main). Rama independiente: `feat/french-language`. No fusionar ni publicar en producción sin aprobación visual.

## Alcance y rutas

Se añade `fr` como séptimo idioma, con bandera SVG local, abreviatura FR y nombre accesible Français. Las siete banderas mantienen los 18 × 12 px y enlaces de 28 × 40 px, en una fila arriba a la derecha. No se cambia el logotipo, su geometría, la posición de la identidad ni los seis enlaces del menú. El único ajuste de presentación se limita al tamaño compacto del menú francés en móvil, igual que el mecanismo existente para los otros idiomas; sus valores no cambian. En la página 404 compartida se permite reducir solo el ancho de las cajas de enlace para que entren siete; sus banderas mantienen sus dimensiones originales de 24 × 16 px.

| Página | Ruta francesa |
| --- | --- |
| Inicio y Sobre mí | `/fr/` y `/fr/#perfil` |
| Peritajes | `/fr/expertises-techniques/` |
| Accidentes | `/fr/investigation-reconstitution-accidents/` |
| Certificados energéticos | `/fr/certificats-energetiques-costa-blanca/` |
| Segunda ocupación | `/fr/certificats-seconde-occupation-costa-blanca/` |
| Aperturas | `/fr/ouvertures-changements-titulaire-costa-blanca/` |
| Contacto | `/fr/contact/` |
| Artículos | `/fr/articles/` |
| Artículo completo | `/fr/articles/quand-demander-rapport-technique-preliminaire/` |
| Aviso legal provisional | `/fr/mentions-legales/` |
| Privacidad provisional | `/fr/confidentialite/` |

Los textos incluyen navegación, llamadas a la acción, formularios, avisos de éxito/error, WhatsApp, perfil, servicios y borradores legales. Se mantiene exactamente Manuel Adolfo García Rodríguez, con la denominación **Ingénieur mécanicien | Expert technique** y 4.702 COITIA. La terminología se refiere a procedimientos españoles: no se atribuye inscripción en listas judiciales francesas ni una nueva acreditación. Los peritajes cubren España, especialmente Comunidad Valenciana; certificaciones y aperturas cubren Costa Blanca, especialmente Marina Baixa.

La traducción francesa del artículo conserva sus cuatro apartados y el carácter hipotético de las causas, la misma imagen y fecha editorial existente y las dos referencias bibliográficas originales. El pie identifica una reconstitution, no evidencia material de un caso concreto.

## Conservación

`tests/check_french.py` compara con la base de la PR y acredita:

- Los seis diccionarios/textos anteriores, servicios y traducciones del artículo conservan su contenido.
- El contenido principal y el pie de todos los HTML anteriores son idénticos. Al retirar de la comparación los enlaces FR/alternates añadidos y el hash de caché del CSS de selector, los HTML anteriores coinciden íntegramente.
- No cambian script.js, estilos generales, tipografía, configuración del contacto, recursos existentes, robots, encabezados ni reglas de enrutamiento. La imagen original del artículo y sus referencias se mantienen.
- En el servidor de contacto, el único cambio es añadir `fr` a los códigos admitidos. El destinatario actual `info@adolfoingenieria.es`, Resend, Turnstile, validaciones, protección antispam y secretos no cambian.

No se modifica DNS, Cloudflare Security, credenciales, variables de entorno, proveedor de correo ni configuración de producción. No se publican dirección ni tarifas.

## SEO

Once páginas francesas nuevas: nueve indexables y dos borradores legales noindex. El total es de 77 páginas y 63 URL indexables. Se conservan todas las URL anteriores y se añaden nueve entradas francesas al sitemap; cada grupo tiene siete hreflang recíprocos más x-default español, canonical propio, lang fr y Open Graph fr_FR. Los datos Person/WebPage/Service/Article se localizan sin inventar datos. Bokmål sigue usando nb.

## Pruebas realizadas

- `python3 tools/build_site.py`: generación de las 77 páginas; comprobación de salida determinista.
- `python3 tests/check_seo.py`: metadatos únicos, enlaces/anclas, recursos, canonical/hreflang, esquema, 63 URL del sitemap y robots.
- `python3 tests/test_articles.py`: 10 pruebas editoriales, incluida generación y retirada segura en una copia temporal.
- `python3 tests/check_first_article.py`: firma, contenido estructurado, citas, imagen, metadatos y marco actual de las siete versiones del artículo.
- `python3 tests/check_french.py`: conservación de contenido y configuración; alcance territorial, bandera/idioma, fuente del artículo y adiciones del sitemap.
- `npm test`: siete grupos de pruebas del servidor, incluido fr con destinatario fijo y validaciones existentes.
- `HEADER_FONT_DIR=/tmp/adolfo-article-fonts TEST_BASE_URL=http://127.0.0.1:8778 node tests/french-browser.cjs`: las 77 páginas a 320, 390, 768 y 1440 px; 308 visitas de revisión; siete banderas con tamaño original y sin saltos de fila, menú en una línea, logotipo separado de las banderas, ausencia de desbordamientos/404/errores JS, metadatos y enlaces legales/WhatsApp. Comprueba navegación nativa de ida y vuelta entre los siete idiomas desde las 11 rutas francesas, sin JavaScript.
- `TEST_BASE_URL=http://127.0.0.1:8778 node tests/contact-browser.cjs`: inicio y contacto de los siete idiomas, cinco escenarios por página: aceptación del proveedor, error de entrega, error de verificación, servicio deshabilitado y fallo de red. Valida idioma fr de Turnstile/payload, privacidad, campos obligatorios, preservación de resultados, expiración y ausencia de almacenamiento persistente.
- `TEST_BASE_URL=http://127.0.0.1:8778 node tests/flags-browser.cjs`: siete banderas, códigos y separación exacta, teclado, estilos en caché/conflictos, navegación sin JavaScript y selector de la página 404.
- Compilación de Functions superada con Wrangler 4.162.0 y comprobaciones de sintaxis/diff.

Las pruebas de correo usan fixtures aislados; no se ha enviado correo real ni se acredita entrega a un buzón. Las capturas locales muestran indisponibilidad cuando no hay servicios reales configurados en el servidor de prueba: no es una comprobación del formulario de producción. Las fuentes corporativas se sirven desde fixtures de Fontsource solo en las pruebas; no se añaden dependencias ni fuentes a la web.

## Capturas para aprobación

- [Inicio móvil 320 px](previews/french/fr-accueil-320.jpg)
- [Inicio móvil 390 px](previews/french/fr-accueil-390.jpg)
- [Inicio escritorio 1440 px](previews/french/fr-accueil-1440.jpg)
- [Contacto móvil](previews/french/fr-contact-390.jpg)
- [Artículo móvil](previews/french/fr-article-390.jpg)
- [Artículo escritorio](previews/french/fr-article-1440.jpg)
- [Listado de artículos escritorio](previews/french/fr-articles-1440.jpg)

Las capturas adicionales de los cuatro anchos están en `/tmp/adolfo-french-review/`. Los textos legales franceses mantienen su carácter provisional y sus datos pendientes de revisión. La revisión visual y la publicación quedan a cargo del titular; no se ha fusionado ni desplegado esta rama.
