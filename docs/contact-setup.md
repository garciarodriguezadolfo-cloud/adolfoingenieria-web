# Contacto directo: configuración y prueba real pendiente

## Qué está implementado

`functions/api/contact.js` recibe POST JSON en `/api/contact`, valida los cuatro campos y la lectura de privacidad, comprueba origen, tamaño máximo (16 KiB), honeypot y token Turnstile en servidor (hostname y action `contact`). Solo entonces solicita a Resend el envío, con destinatario fijo `garciarodriguezadolfo@gmail.com`, remitente verificado y Reply-To del visitante. El asunto se construye a partir de servicios permitidos y el contenido se envía como texto, sin interpretar HTML. No acepta destinatarios del navegador ni envía respuestas automáticas al visitante.

Las credenciales se usan exclusivamente en la función. El GET público devuelve solo la site key de Turnstile cuando la configuración está habilitada. `_routes.json` limita Functions a `/api/contact`; las páginas y recursos SEO siguen siendo estáticos. No se modifican WAF, reglas de bots ni otras reglas de seguridad de Cloudflare.

La interfaz española/inglesa bloquea envíos duplicados mientras espera, conserva los campos ante un error y confirma únicamente la aceptación por el proveedor cuando recibe un identificador real de Resend. Eso no acredita entrega en Gmail. Un fallo de red puede ocurrir después de la aceptación: se comunica que no se puede confirmar el envío. La clave de idempotencia estable por intento y contenido evita duplicar un reintento dentro de la ventana de idempotencia de Resend (24 horas); tras recargar la página o pasado ese plazo no se garantiza deduplicación.

Sin configuración o con un error al cargar la verificación, el botón permanece deshabilitado y se ofrece teléfono/correo como alternativa. No hay un modo de éxito ficticio en el código de producción.

## 1. Crear y verificar un remitente en Resend

1. Crear una cuenta en https://resend.com y abrir **Domains → Add domain**. Se recomienda un subdominio de envío separado, por ejemplo `correo.adolfoingenieria.es` (ejemplo de configuración, no dirección de contacto publicada).
2. Añadir en el proveedor DNS los registros que Resend genere para ese subdominio: copiar exactamente nombre, tipo y valor de DKIM/SPF y los registros de verificación/retorno que indique su panel. No sustituir ni duplicar el SPF del dominio principal. Para nombres DNS de correo, usar DNS only cuando corresponda, sin proxy HTTP. No cambiar reglas WAF ni la seguridad del sitio.
3. Esperar a que Resend marque el dominio como **Verified**. Elegir un remitente de ese dominio, por ejemplo `contacto@correo.adolfoingenieria.es`. No usar el Gmail del destinatario como remitente: no puede verificar `gmail.com` como dominio propio.
4. En **API Keys**, crear una clave con permiso de envío, restringida al dominio de envío cuando el panel lo permita. Guardarla solo como secreto en Pages. Revisar límites, costes y términos del plan; no se ha contratado ningún servicio desde este trabajo.

## 2. Crear Turnstile

1. En Cloudflare → **Turnstile → Add widget**, crear un widget **Managed**.
2. Autorizar `adolfoingenieria.es`. Añadir otros hosts reales solo si van a mostrar el formulario (por ejemplo el host específico de preview para probarlo). No hace falta desactivar la seguridad de la zona.
3. Copiar la **Site Key** pública y la **Secret Key** privada. No usar las claves de prueba de Turnstile en producción.
4. El frontend establece action `contact`; la función comprueba action y que el hostname del token coincida exactamente con el host que atendió el formulario.

## 3. Variables de Cloudflare Pages

En **Workers & Pages → proyecto → Settings → Variables and Secrets**, configurar para el entorno de despliegue correspondiente:

| Variable | Tipo | Valor |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Clave de envío obtenida en Resend |
| `TURNSTILE_SECRET_KEY` | Secret | Secret Key del widget |
| `TURNSTILE_SITE_KEY` | Variable pública | Site Key del mismo widget |
| `CONTACT_FROM` | Variable | Solo el email del remitente verificado, p. ej. `contacto@correo.adolfoingenieria.es` |
| `CONTACT_ENABLED` | Variable | `true` únicamente después de revisar privacidad y completar lo anterior; omitir o usar `false` para deshabilitar |

No introducir contraseñas de Gmail ni claves en Git, `site/config.json`, HTML o JavaScript público, ni compartir secretos en el chat. El destinatario está fijado en el servidor y no es una variable del visitante.

Para la PR #3, configurar **Preview** si se desea comprobar el envío antes de fusionar, autorizando su host en Turnstile y verificando la política de acceso al preview. No copiar automáticamente todas las credenciales a previews de ramas no confiables. Para el sitio final, repetir las variables en **Production** antes del despliegue aprobado. Las variables nuevas requieren un nuevo despliegue para aplicarse.

Pages debe compilar las Functions desde `functions/` en la raíz del proyecto y servir los archivos estáticos versionados desde la raíz. No se necesita un framework ni backend adicional. La publicación mediante la integración GitHub admite Functions; una subida manual que solo copie assets no basta. Esta rama no modifica `main` ni configura servicios externos por su cuenta.

## 4. Privacidad antes de activar

El formulario informa del responsable, finalidad, proveedores, ausencia de marketing y enlaza la información ampliada; exige correo de respuesta y lectura de la información. No se solicitan documentos, datos sensibles ni una suscripción publicitaria. El código no registra el contenido, ni lo persiste en una base de datos o almacenamiento del navegador. Los proveedores y Gmail sí procesan los datos para entregar y conservar el correo; Turnstile procesa datos de interacción/conexión.

El titular debe revisar y completar identificación fiscal y textos legales, base jurídica según el tipo de consulta, plazos de conservación en el buzón y en proveedores, acuerdos de tratamiento con Cloudflare/Resend/proveedor de correo, subencargados y garantías de transferencias internacionales. La casilla es una confirmación de lectura, no sustituye esas obligaciones. Se mantiene la instrucción de no publicar dirección ni precios; el borrador legal no se presenta como un dictamen de cumplimiento. Mantener `CONTACT_ENABLED=false` hasta completar esta revisión.

## 5. Prueba real de extremo a extremo

1. Desplegar la rama en preview con sus variables reales y host permitido en Turnstile. Abrir las páginas española e inglesa. GET `/api/contact` debe devolver 200 y únicamente la site key; sin variables debe devolver 503.
2. Completar nombre, un correo propio de respuesta, servicio y consulta de prueba sin datos sensibles; leer privacidad, marcar la casilla y completar Turnstile. Pulsar **Enviar consulta**.
3. Confirmar el estado visible de aceptación, POST `/api/contact` con 200 y `{accepted:true}`, evento correspondiente en Resend y recepción en `garciarodriguezadolfo@gmail.com` (revisar spam). Comprobar que responder al mensaje usa el correo introducido por el visitante. Repetir en inglés.
4. Si Resend acepta pero Gmail no recibe, revisar el evento de entrega/rebote de Resend y DNS/autenticación del remitente; no declarar resuelta la entrega solo por el 200 del formulario.
5. Probar un fallo de configuración en un preview aislado: deshabilitar `CONTACT_ENABLED` y redesplegar debe mostrar indisponibilidad sin éxito ni pérdida de campos. No provocar fallos deliberados en producción.

## Pruebas ejecutables

```sh
npm test
python3 tests/check_seo.py
node --check script.js
node --check functions/api/contact.js
python3 -m http.server 8877 --bind 127.0.0.1
```

En otra terminal, con Playwright/Chromium disponibles:

```sh
TEST_BASE_URL=http://127.0.0.1:8877 node tests/browser.cjs
TEST_BASE_URL=http://127.0.0.1:8877 node tests/contact-browser.cjs
```

Las pruebas unitarias y de interfaz usan fixtures aislados para respuestas de proveedores; no realizan envíos ni prueban entrega real. Verifican rechazo de entradas, origen, antispam, configuración ausente, destinatario fijo, idempotencia, errores y estados bilingües. El servidor estático por sí solo no ejecuta Functions. Para desarrollo integrado se puede usar `npx wrangler pages dev .` con variables locales en `.dev.vars` (ignorado por Git), manteniendo el envío deshabilitado salvo prueba real deliberada.

La prueba real queda pendiente de que el titular cree los servicios y configure los secretos. No se ha enviado ningún correo ni se ha afirmado entrega real desde este entorno.

## Resultado de esta implementación

Superados: seis grupos de pruebas unitarias del servidor; pruebas estáticas SEO de 18 páginas; recorrido de navegación/idiomas a 1440, 390 y 320 píxeles; estados de interfaz bilingüe con fixtures (incluido que renovar el captcha no borra la confirmación o el error); sintaxis y diff. Wrangler 4.160.1 compila la función. En su runtime local, `/api/contact` devuelve 503 sin activación y `/sitemap.xml` conserva 200 y `application/xml`. El runtime local usó un objeto `Request.cf` de sustitución por falta de acceso a su endpoint de metadatos; no se ha usado esa prueba para acreditar la verificación de bots reales. No hay credenciales configuradas ni correos reales enviados.
