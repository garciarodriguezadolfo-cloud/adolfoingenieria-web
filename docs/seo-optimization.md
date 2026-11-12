# Optimización SEO integral en seis idiomas

## Alcance editorial

Se mantienen las mismas 42 páginas indexables: inicio, contacto y cinco servicios en español, inglés, alemán, noruego bokmål, ruso y neerlandés. No se crean páginas por municipio ni una URL adicional para informes preliminares: esa fase se desarrolla en la página de peritajes existente, con un ancla enlazada desde inicio.

| Página de servicio | Intención principal | Ámbito |
| --- | --- | --- |
| Peritajes técnicos | Informe técnico preliminar, viabilidad técnica, dictamen e informe pericial para juicio | España; especial atención a Comunidad Valenciana y Alicante |
| Investigación y reconstrucción de accidentes | Causas, fallos mecánicos/técnicos, evidencias y posible informe pericial | España; Comunidad Valenciana y Alicante |
| Certificados energéticos | CEE de vivienda y otros inmuebles, visita, documentación y alcance de registro | Provincia de Alicante, Marina Baixa y Costa Blanca |
| Segunda ocupación | Documentación técnica, habitabilidad y procedimiento municipal aplicable | Provincia de Alicante, Marina Baixa y Costa Blanca |
| Aperturas y cambios de titularidad | Apertura de local, declaración responsable, proyecto y cambio de operador | Provincia de Alicante, Marina Baixa y Costa Blanca |

Las páginas locales incorporan los municipios prioritarios sin generar contenido duplicado por localidad. Las páginas periciales se orientan a abogados, despachos, empresas y particulares. Explican que el informe preliminar puede preceder a una pericial completa, pero la continuación exige una nueva valoración y acuerdo de alcance. Solo se aceptan encargos abordables con competencia técnica y medios suficientes; no se afirma especialización universal ni se implica designación judicial.

Las versiones extranjeras adaptan la terminología y conservan las referencias españolas CEE, segunda ocupación y declaración responsable cuando ayudan a identificar el procedimiento. No se equiparan automáticamente a trámites británicos, alemanes, noruegos, rusos, neerlandeses o belgas. No se añaden experiencia, acreditaciones, casos, reseñas, resultados, tarifas ni dirección física.

## Implementación técnica

- Nuevos títulos, metadescripciones, H1 y secciones útiles para cada intención de búsqueda. Los H1 de servicio se separan de los nombres del menú/formulario, que se conservan.
- Metadatos de inicio/contacto en `site/seo.json`; servicios en `site/services.json`; introducciones de inicio en las seis plantillas existentes.
- Enlace de inicio a la evaluación preliminar y enlaces contextuales entre peritajes/accidentes y energía/segunda ocupación, además de la navegación existente.
- Canonical autorreferente y siete hreflang por página (seis idiomas más x-default español). Bokmål conserva `/no/` y el código de idioma `nb`.
- Alternativas Open Graph para los otros cinco idiomas.
- Schema.org: Person con nombre completo y profesión proporcionada, WebPage/ContactPage, Service, WebSite localizado y BreadcrumbList coherente con la navegación. Sin LocalBusiness, dirección, precios, valoraciones o credenciales inventadas.
- Sitemap XML con las mismas 42 URLs y siete equivalencias xhtml por entrada. Se omiten fechas lastmod no verificadas. Los 12 avisos legales y el 404 mantienen su exclusión.

## Elementos preservados

No se modifican CSS, tipografía, ilustraciones, selector ni sus SVG, scripts existentes, lógica del formulario, Pages Functions, Resend, Turnstile, destinatario de correo, variables, secretos, rutas de Functions, robots, DNS o seguridad.

Se comparó el HTML exacto de formularios, selector y WhatsApp contra main en todas las páginas correspondientes. También se comparó íntegramente el cuerpo de las doce páginas legales: sus textos y enlaces visibles son idénticos. Su cambio de metadatos técnicos compartidos no altera el contenido provisional ni su estado noindex.

## Validación ejecutada

- Generación determinista y `python3 tests/check_seo.py`: 54 páginas, metadatos únicos, H1, canonical, hreflang recíprocos, schema, enlaces y anclas internas, recursos, noindex y cobertura exacta del sitemap, incluidas sus equivalencias xhtml.
- Comparación de rutas y sitemap con main: las mismas 42 URLs indexables y los mismos slugs en todos los idiomas.
- `npm test`: backend con proveedores simulados y validación de los seis idiomas.
- `TEST_BASE_URL=http://127.0.0.1:8879 node tests/browser.cjs`: navegación de 54 rutas a 1440/390/320px y cambio a cada idioma equivalente con y sin JavaScript; sin errores JS ni desbordamiento.
- `TEST_BASE_URL=http://127.0.0.1:8879 node tests/contact-browser.cjs`: doce páginas con formulario; aceptación simulada, errores, indisponibilidad, fallo de red, validación, captcha y persistencia de la consulta.
- `TEST_BASE_URL=http://127.0.0.1:8879 node tests/flags-browser.cjs`: selector, centrado de siglas, proporciones, accesibilidad, teclado y enlaces equivalentes, incluida simulación de CSS antiguo.
- `TEST_BASE_URL=http://127.0.0.1:8879 node tests/whatsapp-browser.cjs`: clic y apertura de URL exacta con destinos interceptados, seis idiomas y tres tamaños; controles y pie accesibles.
- `TEST_BASE_URL=http://127.0.0.1:8879 TYPOGRAPHY_FONT_DIR=/tmp/adolfo-typography-fonts TYPOGRAPHY_SCREENSHOTS=/tmp/adolfo-seo-visual node tests/typography-browser.cjs`: las 54 páginas a 1440/1024/768/390/320px; fuentes y tipografía actuales, exclusión de elementos UI de la justificación y adaptación móvil sin desbordamiento. Estilos del formulario, navegación, selector y WhatsApp iguales con la hoja tipográfica activada/desactivada.
- Capturas específicas de encabezados, informes preliminares y terminología de ocupación en los seis idiomas. Inspección visual real de escritorio y móvil; se revisaron también los H1 a 320px para evitar cortes artificiales de palabras largas sin cambiar estilos.
- `git diff --check` y compilación sintáctica del generador.

Las capturas se guardan en `/tmp/adolfo-seo-visual/` y `/tmp/adolfo-preview/`. La revisión visual corresponde a la rama servida localmente. Las pruebas usan copias temporales de DM Sans/Manrope para representar las familias existentes; no se incorporan fuentes ni dependencias a la aplicación. Otras pruebas de navegación bloquean Google Fonts y comprueban las fuentes de sustitución.

## Revisión humana y seguimiento

El titular puede revisar la formulación del alcance profesional y los términos técnicos/jurídicos en los seis idiomas antes de fusionar. Los requisitos de cada encargo deben confirmarse con la administración competente. No se atribuye revisión externa a un traductor ni se presentan procedimientos concretos como idénticos entre municipios.

Tras una publicación autorizada, corresponde comprobar en Google Search Console la lectura del sitemap, indexación, consultas y conversiones, y contrastar las palabras clave con datos reales de búsqueda. No se han consultado métricas privadas ni medido mejoras de posiciones o captación. No se envió un correo real ni un mensaje de WhatsApp: los tests usan fixtures. No se fusiona ni despliega producción en esta tarea.
