> Actualización: el contacto directo sustituye el borrador local descrito en esta auditoría de la ampliación inicial. Consulte `contact-setup.md` para el estado actual, la configuración obligatoria, privacidad y pruebas pendientes de envío real.

# Ampliación comercial bilingüe

## Alcance

Rama independiente de main. Siete páginas comerciales por idioma: inicio, peritajes técnicos, investigación y reconstrucción de accidentes, certificados energéticos, segunda ocupación, aperturas y cambios de titularidad, contacto. Cuatro páginas legales adicionales (dos por idioma) identificadas como borradores, con noindex y excluidas del sitemap.

Se conserva la ilustración, la paleta, las tipografías y los bloques visuales de inicio. Las páginas nuevas usan las clases y escala visual originales. Se mantienen el selector rastreable de idioma, el año dinámico y el formulario, que ahora prepara un borrador útil y copiable en lugar de una alerta. El titular confirmó info@adolfoingenieria.es durante la implementación: se publica como enlace mailto y se ofrece abrir el borrador en la aplicación de correo para su revisión y envío manual. No hay backend de envío ni se presenta el borrador como mensaje enviado.

Las páginas contienen metadatos únicos, H1 único, H2 ordenados, canonical propio, hreflang recíproco de la página equivalente y x-default español. JSON-LD usa Organization para identificar al profesional, WebPage para cada URL y Service con la cobertura correspondiente. No incluye datos de LocalBusiness que exigirían una dirección verificada, valoraciones, precios ni acreditaciones. La cobertura local se expresa en páginas de servicio, no mediante páginas repetidas por municipio.

El generador Python es una herramienta de mantenimiento; Pages sigue sirviendo archivos estáticos ya versionados. No se han cambiado las reglas o configuración de Cloudflare. Se mantienen robots, encabezados y 404 de la corrección anterior.

Teléfono confirmado: 638 651 175, con enlace de llamada `tel:+34638651175` en inicio y contacto de ambos idiomas y en los datos estructurados. Por indicación del titular, no se publica dirección ni precios. Los borradores legales permanecen pendientes de revisión.

## Pendiente de confirmar

- Confirmar si se desea en el futuro un backend de formularios: actualmente se usa el correo confirmado mediante la aplicación del visitante. Sin JavaScript se mantiene el enlace directo al correo. Generar el borrador no transmite datos a un endpoint ni los persiste; abrirlo y enviarlo usa la aplicación de correo del visitante.
- NIF, procedimiento de derechos y detalles legales/profesionales necesarios. El correo confirmado figura como contacto, pero faltan las condiciones de tratamiento de consultas recibidas. Los datos de colegiación COITIA 4.702 aparecían en la web anterior, pero no están verificados en este encargo; se omiten del contenido público generado hasta confirmación. Se mantienen las especialidades y experiencia indicadas por el titular en la petición.
- Revisión final de aviso legal y privacidad: base jurídica, conservación, encargados, transferencias, contratación y recursos externos (Cloudflare y Google Fonts). No se atribuyen garantías jurídicas al borrador.
- Condiciones concretas de cada encargo: disponibilidad, desplazamientos, honorarios, trámites incluidos, tasas y alcance profesional aplicable. No se prometen resultados administrativos ni judiciales.
- Tras aprobar y publicar: verificar HTTP/MIME y redirecciones reales, reenviar el sitemap de 14 URL a Search Console y confirmar lectura por Google. La ampliación no acredita resuelto el 403 anterior; consultar `docs/seo-audit.md` para su investigación.

## Validación

Resultados: prueba estática, sintaxis JavaScript y diff sin errores; recorrido Chromium/Playwright superado a 1440, 390 y 320 píxeles, con y sin JavaScript. Capturas revisadas para inicio de escritorio y servicio energético en móvil. Los HTML, CSS y JavaScript suman aproximadamente 160 KB sin comprimir (sin contar fuentes externas); no se añaden dependencias de ejecución ni imágenes pesadas. No se atribuyen puntuaciones Lighthouse ni Core Web Vitals sin medición en producción.

La prueba estática recorre 18 páginas y valida metadatos, esquema, idioma, enlaces y anclas, assets, sitemap, robots y encabezados. La prueba Chromium/Playwright recorre los pares lingüísticos con y sin JavaScript y tres tamaños, detecta desbordamiento horizontal y errores JS y verifica que preparar/copiar la consulta no realiza envíos ni usa localStorage/sessionStorage. La prueba local no emula el enrutamiento ni la seguridad de Cloudflare.
