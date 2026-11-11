"""Generate deployable static HTML with Python only; no build needed on Pages."""
from pathlib import Path
from html import escape as esc
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://adolfoingenieria.es'
NAME = 'Manuel Adolfo García Rodríguez'
CONFIG = json.loads((ROOT / 'site/config.json').read_text())
CONTACT_EMAIL = CONFIG['contact_email']
CONTACT_PHONE = CONFIG['contact_phone']
CONTACT_PHONE_DISPLAY = CONFIG['contact_phone_display']
SERVICES = json.loads((ROOT / 'site/services.json').read_text())
LANGS = ('es', 'en')
PATHS = {'home': {'es': '/', 'en': '/en/'}, 'contact': {'es': '/contacto/', 'en': '/en/contact/'},
         'legal': {'es': '/aviso-legal/', 'en': '/en/legal-notice/'},
         'privacy': {'es': '/politica-privacidad/', 'en': '/en/privacy-policy/'}}
for s in SERVICES:
    PATHS[s['key']] = {lang: ('/' if lang == 'es' else '/en/') + s[lang]['slug'] + '/' for lang in LANGS}


def tr(lang, es, en):
    return es if lang == 'es' else en


def link(key, lang, label, cls=''):
    return f'<a href="{PATHS[key][lang]}" class="{cls}">{esc(label)}</a>'


def header(key, lang):
    other = 'en' if lang == 'es' else 'es'
    nav = link('home', lang, tr(lang, 'Inicio', 'Home')) + link('expert', lang, tr(lang, 'Peritajes', 'Expert reports'))
    nav += f'<a href="{PATHS["home"][lang]}#servicios">{tr(lang, "Servicios", "Services")}</a>'
    nav += f'<a href="{PATHS["home"][lang]}#perfil">{tr(lang, "Sobre mí", "About")}</a>'
    nav += link('contact', lang, tr(lang, 'Contacto', 'Contact'))
    nav += f'<a id="lang" href="{PATHS[key][other]}" lang="{other}" hreflang="{other}" aria-label="{tr(lang, "Read this page in English", "Leer esta página en español")}">{other.upper()}</a>'
    return f'''<a class="skip-link" href="#contenido">{tr(lang, 'Saltar al contenido', 'Skip to content')}</a>
<header class="site-header"><a class="brand" href="{PATHS['home'][lang]}"><span class="brand-name">Manuel Adolfo<br>García Rodríguez</span><span class="brand-sub">{tr(lang, 'Ingeniero Mecánico | Perito Técnico', 'Mechanical Engineer | Technical Expert')}</span></a><nav aria-label="{tr(lang, 'Navegación principal', 'Main navigation')}">{nav}</nav></header>'''


def footer(lang):
    return f'''<footer><span>© <span id="year"></span> {NAME}</span><span>{tr(lang, 'Ingeniero Mecánico', 'Mechanical Engineer')}</span><div class="footer-links">{link('legal',lang,tr(lang,'Aviso legal (borrador)','Legal notice (draft)'))}{link('privacy',lang,tr(lang,'Privacidad (borrador)','Privacy (draft)'))}</div></footer>'''


def form(lang):
    return f'''<p class="contact-notice" id="contact-notice">{tr(lang, 'Este formulario prepara un borrador local: no envía ni guarda datos en la web. Puede copiarlo o abrirlo en su aplicación de correo para revisarlo y enviarlo. No introduzca información sensible.', 'This form prepares a local draft: it does not send or save data on the website. You can copy it or open it in your email app to review and send. Do not enter sensitive information.')}</p>
<p class="contact-email">{tr(lang, "Correo profesional", "Professional email")}: <a href="mailto:{esc(CONTACT_EMAIL, quote=True)}">{esc(CONTACT_EMAIL)}</a></p>
<p class="contact-phone">{tr(lang,"Teléfono","Phone")}: <a href="tel:{esc(CONTACT_PHONE, quote=True)}">{esc(CONTACT_PHONE_DISPLAY)}</a></p>
<form id="contact-form" data-recipient="{esc(CONTACT_EMAIL, quote=True)}" aria-describedby="contact-notice">
<label>{tr(lang,'Nombre','Name')}<input name="nombre" autocomplete="name" maxlength="150" required></label>
<label>{tr(lang,'Correo de respuesta (opcional)','Reply email (optional)')}<input type="email" name="email" autocomplete="email" maxlength="250"></label>
<label class="wide">{tr(lang,'Servicio','Service')}<select name="servicio">{''.join('<option>'+esc(s[lang]['name'])+'</option>' for s in SERVICES)}<option>{tr(lang,'Otra consulta técnica','Other technical enquiry')}</option></select></label>
<label class="wide">{tr(lang,'Consulta: municipio, alcance y plazo previsto','Enquiry: location, scope and expected deadline')}<textarea name="mensaje" rows="4" maxlength="5000" required></textarea></label>
<button type="submit">{tr(lang,'Preparar borrador de consulta ↗','Prepare enquiry draft ↗')}</button><p class="form-note">{tr(lang,'No se enviará ningún mensaje. Puede revisar la estructura de privacidad antes de escribir.', 'No message will be sent. You can review the privacy draft before typing.')} {link('privacy',lang,tr(lang,'Ver privacidad','Read privacy draft'))}</p>
<div class="wide draft-output" id="draft-output" hidden><label>{tr(lang,'Borrador local (no enviado)','Local draft (not sent)')}<textarea id="enquiry-draft" rows="8" readonly></textarea></label><button type="button" id="copy-draft">{tr(lang,'Copiar borrador','Copy draft')}</button> <a class="primary" id="open-email" href="mailto:{esc(CONTACT_EMAIL, quote=True)}">{tr(lang,"Abrir en mi aplicación de correo ↗","Open in my email app ↗")}</a></div>
<p class="wide form-note" id="contact-status" role="status" aria-live="polite"></p></form>
<noscript><p>{tr(lang,'Para generar el borrador necesita JavaScript. También puede escribir directamente al correo profesional indicado.', 'JavaScript is needed to generate a draft. You can also write directly to the professional email above.')}</p></noscript>'''


def contact_block(lang):
    return f'''<section class="contact" id="contacto"><p class="eyebrow">{tr(lang,'CONTACTO','CONTACT')}</p><h2>{tr(lang,'¿Necesita un informe<br>o asesoramiento técnico?','Need an expert report<br>or technical advice?')}</h2><p>{tr(lang,'Prepare los datos de su encargo para solicitar una valoración de alcance y presupuesto.', 'Prepare the details of your assignment for a scope review and quotation.')}</p>{form(lang)}</section>'''


def service_list(lang, exclude=None):
    return '<div class="service-list">' + ''.join(f'''<article><span>{i:02d}</span><div><h3>{link(s['key'],lang,s[lang]['name'])}</h3><p>{tr(lang,'Toda España · Comunidad Valenciana','Spain · Valencian Community') if s['key'] in ('expert','accidents') else tr(lang,'Provincia de Alicante','Alicante province')}</p></div><span class="arrow" aria-hidden="true">↗</span></article>''' for i,s in enumerate(SERVICES,1) if s['key'] != exclude) + '</div>'


def shell(key, lang, title, description, body, service=None, draft=False):
    url = BASE + PATHS[key][lang]
    body = body.replace('↗', '<svg class="icon-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.8"/></svg>')
    provider = {'@type':'Organization', '@id':BASE+'/#professional', 'name':NAME+' | Ingeniero Mecánico', 'url':BASE+'/', 'email':CONTACT_EMAIL, 'telephone':CONTACT_PHONE}
    graph = [provider, {'@type':'WebPage','@id':url+'#page','url':url,'name':title,'description':description,'inLanguage':lang,'about':{'@id':BASE+'/#professional'}}]
    if service:
        graph.append({'@type':'Service','@id':url+'#service','name':service[lang]['name'],'description':description,'url':url,'provider':{'@id':BASE+'/#professional'},'areaServed': ['España','Comunidad Valenciana'] if service['key'] in ('expert','accidents') else ['Provincia de Alicante']})
    alternates = ''.join(f'<link rel="alternate" hreflang="{l}" href="{BASE+PATHS[key][l]}">\n' for l in LANGS)
    alternates += f'<link rel="alternate" hreflang="x-default" href="{BASE+PATHS[key]["es"]}">'
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#11243a">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description, quote=True)}">
{'<meta name="robots" content="noindex, follow">' if draft else ''}
<link rel="canonical" href="{url}">
{alternates}
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(title, quote=True)}">
<meta property="og:description" content="{esc(description, quote=True)}">
<meta property="og:locale" content="{tr(lang,'es_ES','en_GB')}">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script>
<script src="/script.js" defer></script>
</head>
<body>{header(key,lang)}<main id="contenido">{body}</main>{footer(lang)}</body>
</html>
'''


def render_home(lang):
    body = (ROOT / f'site/templates/home-{lang}.html').read_text()
    # Keep the original hero, technical illustration, sections, spacing and profile.
    body = body.replace('href="#contacto"', f'href="{PATHS["contact"][lang]}"')
    start = body.index('<div class="service-list">')
    end = body.index('</section>', start)
    body = body[:start] + service_list(lang) + body[end:]
    body = body.replace(tr(lang,'Otros servicios','Other services'),tr(lang,'Servicios de ingeniería','Engineering services'))
    body = body.replace(tr(lang,'SERVICIOS COMPLEMENTARIOS','ADDITIONAL SERVICES'),tr(lang,'SERVICIOS','SERVICES'))
    body = body.replace(tr(lang,'Peritajes en toda España','Expert assessments throughout Spain'),tr(lang,'Peritajes en toda España · Especial atención a la Comunidad Valenciana','Expert assessments throughout Spain · Particular focus on the Valencian Community'))
    body += f'''<section class="section expertise"><div><p class="eyebrow dark">{tr(lang,'ÁMBITO DE TRABAJO','SERVICE AREA')}</p><h2>{tr(lang,'Peritajes en España.<br>Certificaciones en Alicante.','Expert reports across Spain.<br>Certificates in Alicante.')}</h2></div><div><p>{tr(lang,'Perito ingeniero mecánico para informes y dictámenes periciales en toda España, con especial atención a la Comunidad Valenciana. Certificados energéticos, segunda ocupación y asistencia para aperturas en la provincia de Alicante.','Mechanical engineering expert for technical reports and opinions throughout Spain, with particular attention to the Valencian Community. Energy and second occupancy certificates and business opening support in Alicante province.')}</p><p>{tr(lang,'Atención en Benidorm, Altea, Villajoyosa, Calpe, Dénia, Benissa, Polop, La Nucía, Callosa d’en Sarrià y l’Alfàs del Pi. Las visitas y el alcance se acuerdan según cada encargo.','Assignments in Benidorm, Altea, Villajoyosa, Calpe, Dénia, Benissa, Polop, La Nucía, Callosa d’en Sarrià and l’Alfàs del Pi. Visits and scope are agreed for each assignment.')}</p></div></section>'''
    body += contact_block(lang)
    title = tr(lang,'Perito ingeniero mecánico | Manuel Adolfo García Rodríguez','Mechanical engineer & technical expert | Manuel Adolfo García Rodríguez')
    description = tr(lang,'Manuel Adolfo García Rodríguez: peritajes en España y Comunidad Valenciana. Certificados energéticos, segunda ocupación y aperturas en Alicante.','Manuel Adolfo García Rodríguez: expert reports in Spain and the Valencian Community. Energy and occupancy certificates and opening support in Alicante.')
    return shell('home',lang,title,description,body)


def render_service(s, lang):
    data = s[lang]
    body = f'''<section class="service-hero"><p class="eyebrow">{tr(lang,'INGENIERÍA · ANÁLISIS TÉCNICO','ENGINEERING · TECHNICAL ANALYSIS')}</p><h1>{esc(data['name'])}<span class="dot">.</span></h1><p class="lead">{esc(data['lead'])}</p>{link('contact',lang,tr(lang,'Solicitar presupuesto ↗','Request a quotation ↗'),'primary')}</section>'''
    for i,(heading,text) in enumerate(data['sections']):
        body += f'<section class="section expertise{" services" if i%2 else ""}"><div><p class="eyebrow dark">{i+1:02d}</p><h2>{esc(heading)}</h2></div><div><p>{esc(text)}</p></div></section>'
    body += f'<section class="section services"><h2>{tr(lang,"Servicios relacionados","Related services")}</h2>{service_list(lang,s["key"])}</section>'
    body += f'<section class="contact"><h2>{tr(lang,"Definamos el alcance de su encargo.","Let’s define the scope of your assignment.")}</h2><p>{tr(lang,"Indique el lugar, los hechos o el inmueble y los plazos que necesita valorar. El presupuesto se concreta tras revisar la información.","Describe the location, events or property and the deadlines to be assessed. A quotation is defined after reviewing the information.")}</p>{link("contact",lang,tr(lang,"Preparar consulta ↗","Prepare an enquiry ↗"),"primary")}</section>'
    return shell(s['key'],lang,data['title'],data['description'],body,s)


def render_contact(lang):
    body = f'''<section class="service-hero"><p class="eyebrow">{tr(lang,'CONTACTO PROFESIONAL','PROFESSIONAL ENQUIRIES')}</p><h1>{tr(lang,'Solicitar presupuesto','Request a quotation')}<span class="dot">.</span></h1><p class="lead">{NAME} | {tr(lang,'Ingeniero Mecánico. Peritajes en toda España; certificaciones y aperturas en la provincia de Alicante.','Mechanical Engineer. Expert reports throughout Spain; certificates and business opening support in Alicante province.')}</p></section><section class="section expertise"><div><h2>{tr(lang,'Qué información preparar','Information to prepare')}</h2></div><div><p>{tr(lang,'Indique el servicio, municipio, una descripción del caso o inmueble y los plazos relevantes. Para peritajes, añada una cronología y qué cuestiones necesita resolver; para certificaciones o aperturas, describa el uso y la documentación disponible. No adjunte documentación sensible en esta fase.','Include the service, municipality, a description of the case or property and relevant deadlines. For expert reports, outline the chronology and the questions to resolve; for certificates or opening procedures, describe the use and available documents. Do not include sensitive documents at this stage.')}</p></div></section>'''
    body += contact_block(lang)
    return shell('contact',lang,tr(lang,'Contacto y presupuestos | Manuel Adolfo García Rodríguez','Contact and quotations | Manuel Adolfo García Rodríguez'),tr(lang,'Prepare su consulta sobre peritajes, certificados o aperturas. Alcance y presupuesto según el encargo. Contacto por correo profesional y borrador local.','Prepare an enquiry about expert reports, certificates or business opening. Scope and quotations depend on the assignment. Professional email contact and local enquiry draft.'),body)


LEGAL = {
'es': {
'legal': [('Titular del sitio','Manuel Adolfo García Rodríguez | Ingeniero Mecánico. Correo: garciarodriguezadolfo@gmail.com. Pendiente de completar y verificar: NIF y demás información legal aplicable.'),('Información profesional','Pendiente de confirmar: datos de colegiación que proceda publicar, titulación oficial y referencias a las normas profesionales aplicables. No se publican acreditaciones adicionales sin verificación.'),('Objeto y condiciones de uso','Este sitio describe servicios de ingeniería y permite preparar consultas locales. La información general no sustituye el estudio de un caso ni constituye un presupuesto o una aceptación del encargo. Pendiente de revisión: condiciones de contratación, responsabilidades y normativa aplicable.'),('Propiedad intelectual y enlaces','Pendiente de verificar la titularidad y licencias de los contenidos, recursos y marcas, y de completar las condiciones de uso y referencias a terceros.')],
'privacy': [('Responsable y contacto','Manuel Adolfo García Rodríguez. Contacto: garciarodriguezadolfo@gmail.com. Pendiente de completar: identificación fiscal y procedimiento para el ejercicio de derechos.'),('Formulario y finalidad','El formulario actual genera un borrador en el navegador; no envía datos a un servidor de formularios. Puede abrir el borrador en su aplicación de correo con el destinatario profesional confirmado; solo se envía si usted lo envía desde esa aplicación, cuyo proveedor tratará el mensaje conforme a sus condiciones. El texto no se guarda en almacenamiento persistente por este código. Al copiarlo, pasa al portapapeles del dispositivo. No incluya datos sensibles ni de terceros.'),('Tratamientos pendientes de definir','Para el tratamiento de consultas recibidas por correo deben confirmarse la finalidad del tratamiento de consultas, base jurídica, plazos de conservación, destinatarios, encargados y posibles transferencias internacionales. La web no incorpora un envío mediante servidor de formularios.'),('Derechos y reclamaciones','La versión definitiva debe explicar cómo ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad cuando procedan, y cómo presentar una reclamación ante la AEPD. Correo de contacto: garciarodriguezadolfo@gmail.com; el procedimiento debe completarse.'),('Infraestructura y recursos externos','El sitio se aloja en Cloudflare Pages y carga tipografías de Google Fonts. Estos servicios pueden recibir datos de conexión, como la dirección IP. Pendiente de documentar sus roles, conservación y transferencias, y de revisar el uso real de cookies y registros en producción. El código del formulario no incorpora analítica, cookies ni almacenamiento local.')]
},
'en': {
'legal': [('Website owner','Manuel Adolfo García Rodríguez | Mechanical Engineer. To be completed and verified: tax identification and other applicable legal information. Contact email: garciarodriguezadolfo@gmail.com.'),('Professional information','To be confirmed: any professional registration details to publish, official qualification and references to applicable professional rules. Additional credentials are not published without verification.'),('Purpose and terms of use','This website describes engineering services and enables local enquiry drafts. General information does not replace a case assessment or constitute a quotation or acceptance of an assignment. Contract terms, responsibilities and applicable law require review.'),('Intellectual property and links','Ownership and licences for content, resources and marks must be verified, and terms of use and third-party references completed.')],
'privacy': [('Controller and contact','Manuel Adolfo García Rodríguez. Contact: garciarodriguezadolfo@gmail.com. To be completed: tax identification and the procedure for exercising data protection rights.'),('Form and purpose','The current form generates a draft in the browser; it sends no data to a form server. You can open the draft in your email app addressed to the confirmed professional email; it is only sent if you send it from that app, whose provider will process it under its own terms. This code does not save the text in persistent storage. Copying places it on your device clipboard. Do not include sensitive or third-party data.'),('Processing still to be defined','For enquiries received by email, the purposes of enquiry processing, legal basis, retention periods, recipients, processors and any international transfers must be confirmed. The website does not send enquiries through a form server.'),('Rights and complaints','The final policy must explain how to exercise rights of access, rectification, erasure, objection, restriction and portability where applicable, and how to complain to the Spanish data protection authority (AEPD). Contact email: garciarodriguezadolfo@gmail.com; the procedure must be completed.'),('Infrastructure and external resources','This website is hosted on Cloudflare Pages and loads Google Fonts. These services may receive connection data such as IP addresses. Their roles, retention and transfers must be documented, and actual cookies and logs reviewed in production. The form code adds no analytics, cookies or local storage.')]
}}


def render_legal(key, lang):
    name = tr(lang,'Aviso legal','Legal notice') if key == 'legal' else tr(lang,'Política de privacidad','Privacy policy')
    body = f'<section class="service-hero"><p class="eyebrow">{tr(lang,"BORRADOR · PENDIENTE DE COMPLETAR","DRAFT · TO BE COMPLETED")}</p><h1>{name}</h1><p class="lead">{tr(lang,"Estructura provisional para revisión del titular. No constituye un texto legal definitivo.","Provisional structure for the owner’s review. This is not a final legal document.")}</p></section>'
    body += '<div class="legal-content">' + ''.join(f'<section><h2>{esc(h)}</h2><p>{esc(p)}</p></section>' for h,p in LEGAL[lang][key]) + '</div>'
    return shell(key,lang,name+' | '+NAME,tr(lang,'Borrador pendiente de completar y revisar por el titular del sitio.','Draft awaiting completion and review by the website owner.'),body,draft=True)


def build():
    for lang in LANGS:
        pages = {'home':render_home(lang),'contact':render_contact(lang), 'legal':render_legal('legal',lang),'privacy':render_legal('privacy',lang)}
        pages.update({s['key']:render_service(s,lang) for s in SERVICES})
        for key, html in pages.items():
            file = ROOT / PATHS[key][lang].lstrip('/') / 'index.html'
            file.parent.mkdir(parents=True,exist_ok=True)
            file.write_text(html)
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    root = ET.Element(ns+'urlset')
    for key, paths in PATHS.items():
        if key in ('legal','privacy'):
            continue  # Legal drafts remain noindex and outside the sitemap.
        for path in paths.values():
            ET.SubElement(ET.SubElement(root,ns+'url'),ns+'loc').text = BASE + path
    ET.indent(root)
    ET.ElementTree(root).write(ROOT / 'sitemap.xml', encoding='UTF-8', xml_declaration=True)
    print('Generated 18 static pages and sitemap (14 indexable URLs).')


if __name__ == '__main__':
    build()
