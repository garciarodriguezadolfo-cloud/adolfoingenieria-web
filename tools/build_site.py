"""Generate deployable static HTML with Python only; no build needed on Pages."""
from pathlib import Path
from html import escape as esc, unescape
import json
import re
from urllib.parse import quote
from hashlib import sha256
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://adolfoingenieria.es'
TYPOGRAPHY_SCRIPT = '/typography.js?v=' + sha256((ROOT / 'typography.js').read_bytes()).hexdigest()[:12]
TYPOGRAPHY_CSS = '/typography.css?v=' + sha256((ROOT / 'typography.css').read_bytes()).hexdigest()[:12]
SELECTOR_CSS = '/language-selector.css?v=' + sha256((ROOT / 'language-selector.css').read_bytes()).hexdigest()[:12]
NAME = 'Manuel Adolfo García Rodríguez'
CONFIG = json.loads((ROOT / 'site/config.json').read_text())
CONTACT_EMAIL = CONFIG['contact_email']
CONTACT_PHONE = CONFIG['contact_phone']
CONTACT_PHONE_DISPLAY = CONFIG['contact_phone_display']
SERVICES = json.loads((ROOT / 'site/services.json').read_text())
SEO = json.loads((ROOT / 'site/seo.json').read_text())
LANGS = ('es', 'en', 'de', 'no', 'ru', 'nl')
HTML_LANG = {lang: ('nb' if lang == 'no' else lang) for lang in LANGS}
LOCALES = {lang: json.loads((ROOT / f'site/locales/{lang}.json').read_text()) for lang in ('de', 'no', 'ru', 'nl')}
LANG_NAMES = {'es':'Español', 'en':'English', 'de':'Deutsch', 'no':'Norsk bokmål', 'ru':'Русский', 'nl':'Nederlands'}
FLAGS = {'es':'es', 'en':'gb', 'de':'de', 'no':'no', 'ru':'ru', 'nl':'nl'}
LANGUAGE_LABELS = {'es':'Idiomas','en':'Languages','de':'Sprachen','no':'Språk','ru':'Языки','nl':'Talen'}
WHATSAPP = {
'nl': ('Goedendag, ik wil graag informatie over uw ingenieursdiensten.', 'Contact via WhatsApp'),
'es': ('Hola, me gustaría consultar sobre sus servicios de ingeniería.', 'Consultar por WhatsApp'),
'en': ('Hello, I would like to enquire about your engineering services.', 'Contact via WhatsApp'),
'de': ('Guten Tag, ich möchte mich über Ihre Ingenieurleistungen informieren.', 'Kontakt über WhatsApp'),
'no': ('Hei, jeg ønsker informasjon om ingeniørtjenestene dine.', 'Ta kontakt på WhatsApp'),
'ru': ('Здравствуйте! Хочу узнать подробнее о ваших инженерных услугах.', 'Связаться через WhatsApp'),
}
PATHS = {'home': {'es': '/', 'en': '/en/'}, 'contact': {'es': '/contacto/', 'en': '/en/contact/'},
         'legal': {'es': '/aviso-legal/', 'en': '/en/legal-notice/'},
         'privacy': {'es': '/politica-privacidad/', 'en': '/en/privacy-policy/'}}
for lang, contact, legal, privacy in (
    ('de', 'kontakt', 'impressum', 'datenschutz'),
    ('no', 'kontakt', 'juridisk-informasjon', 'personvern'),
    ('ru', 'kontakty', 'pravovaya-informatsiya', 'konfidentsialnost'),
    ('nl', 'contact', 'juridische-informatie', 'privacybeleid')):
    for key, slug in [('home',''), ('contact',contact), ('legal',legal), ('privacy',privacy)]:
        PATHS[key][lang] = f'/{lang}/' + (slug+'/' if slug else '')
for s in SERVICES:
    PATHS[s['key']] = {lang: ('/' if lang == 'es' else f'/{lang}/') + s[lang]['slug'] + '/' for lang in LANGS}


def tr(lang, es, en):
    return es if lang == 'es' else en if lang == 'en' else LOCALES[lang][en]


def link(key, lang, label, cls=''):
    return f'<a href="{PATHS[key][lang]}" class="{cls}">{esc(label)}</a>'


def language_switch(key, lang):
    links = ''.join(
        f'<a href="{PATHS[key][target]}" lang="{HTML_LANG[target]}" hreflang="{HTML_LANG[target]}" '
        f'aria-label="{LANG_NAMES[target]}" title="{LANG_NAMES[target]}"'
        + (' aria-current="page"' if target == lang else '')
        + f'><img src="/assets/flags/{FLAGS[target]}.svg" width="24" height="16" alt="" aria-hidden="true"><span class="language-code" aria-hidden="true">{target.upper()}</span></a>'
        for target in LANGS)
    return f'<div class="language-switch" role="group" aria-label="{LANGUAGE_LABELS[lang]}">{links}</div>'


def header(key, lang):
    nav = link('home', lang, tr(lang, 'Inicio', 'Home')) + link('expert', lang, tr(lang, 'Peritajes', 'Expert reports'))
    nav += f'<a href="{PATHS["home"][lang]}#servicios">{tr(lang, "Servicios", "Services")}</a>'
    nav += f'<a href="{PATHS["home"][lang]}#perfil">{tr(lang, "Sobre mí", "About")}</a>'
    nav += link('contact', lang, tr(lang, 'Contacto', 'Contact'))
    selector = language_switch(key, lang)
    return f'''<a class="skip-link" href="#contenido">{tr(lang, 'Saltar al contenido', 'Skip to content')}</a>
<header class="site-header"><a class="brand" href="{PATHS['home'][lang]}"><span class="brand-name">Manuel Adolfo<br>García Rodríguez</span><span class="brand-sub">{tr(lang, 'Ingeniero Mecánico | Perito Técnico', 'Mechanical Engineer | Technical Expert')}</span></a><nav aria-label="{tr(lang, 'Navegación principal', 'Main navigation')}">{nav}</nav>{selector}</header>'''


def footer(lang):
    return f'''<footer><span>© <span id="year"></span> {NAME}</span><span>{tr(lang, 'Ingeniero Mecánico', 'Mechanical Engineer')}</span><div class="footer-links">{link('legal',lang,tr(lang,'Aviso legal (borrador)','Legal notice (draft)'))}{link('privacy',lang,tr(lang,'Privacidad (borrador)','Privacy (draft)'))}</div></footer>'''


def whatsapp(lang):
    message, label = WHATSAPP[lang]
    return f'''<a class="whatsapp-float" href="https://wa.me/34638651175?text={quote(message, safe='')}" target="_blank" rel="noopener noreferrer" aria-label="{label}: +34 638 651 175"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M27 15.5A11.5 11.5 0 0 1 10 25.6L4 27l1.5-5.8A11.5 11.5 0 1 1 27 15.5Z" stroke="currentColor" stroke-width="2"/><path d="M11 9c-1 0-2 2-1 5 1 4 5 8 9 8 2 0 4-2 3-3l-3-2-2 2c-2-1-4-3-5-5l2-2-2-3h-1Z" fill="currentColor"/></svg><span>WhatsApp<span class="whatsapp-number">+34 638 651 175</span></span></a>'''


def form(lang):
    return f'''<p class="contact-notice" id="contact-notice">{tr(lang,'Envíe su consulta directamente desde la web. Los campos son obligatorios. No incluya datos sensibles ni documentación de terceros.','Send your enquiry directly from this website. All fields are required. Do not include sensitive data or third-party documents.')}</p>
<p class="contact-email">{tr(lang,"Correo profesional","Professional email")}: <a href="mailto:{esc(CONTACT_EMAIL, quote=True)}">{esc(CONTACT_EMAIL)}</a></p>
<p class="contact-phone">{tr(lang,"Teléfono","Phone")}: <a href="tel:{esc(CONTACT_PHONE, quote=True)}">{esc(CONTACT_PHONE_DISPLAY)}</a></p>
<form id="contact-form" aria-describedby="contact-notice contact-privacy" method="post" action="/api/contact">
<label>{tr(lang,'Nombre','Name')}<input name="nombre" autocomplete="name" minlength="2" maxlength="150" required></label>
<label>{tr(lang,'Correo electrónico','Email')}<input type="email" name="email" autocomplete="email" maxlength="250" required></label>
<label class="wide">{tr(lang,'Servicio','Service')}<select name="servicio" required><option value="">{tr(lang,'Seleccione un servicio','Choose a service')}</option>{''.join('<option value="'+s['key']+'">'+esc(s[lang]['name'])+'</option>' for s in SERVICES)}<option value="other">{tr(lang,'Otra consulta técnica','Other technical enquiry')}</option></select></label>
<label class="wide">{tr(lang,'Consulta: municipio, alcance y plazo previsto','Enquiry: location, scope and expected deadline')}<textarea name="mensaje" rows="4" minlength="10" maxlength="5000" required></textarea></label>
<div class="form-trap" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
<p class="wide form-note" id="contact-privacy">{tr(lang,'Responsable: Manuel Adolfo García Rodríguez. Finalidad: gestionar y responder su consulta, sin publicidad. Se utiliza Cloudflare para procesar y proteger el formulario y Resend para remitir el correo.','Controller: Manuel Adolfo García Rodríguez. Purpose: to handle and reply to your enquiry, without marketing. Cloudflare processes and protects the form; Resend sends the email.')} {link('privacy',lang,tr(lang,'Información sobre privacidad y derechos','Privacy and rights information'))}</p>
<label class="wide privacy-check"><input type="checkbox" name="privacy" required><span>{tr(lang,'He leído la información de privacidad.','I have read the privacy information.')}</span></label>
<div class="wide" id="contact-captcha"></div>
<button type="submit" disabled>{tr(lang,'Enviar consulta ↗','Send enquiry ↗')}</button>
<p class="wide form-note" id="contact-status" role="status" aria-live="polite">{tr(lang,'Comprobando la disponibilidad del formulario…','Checking form availability…')}</p></form>
<noscript><p>{tr(lang,'Active JavaScript para enviar el formulario y completar la verificación antispam. También puede contactar por teléfono o correo.','Enable JavaScript to submit the form and complete the spam check. You can also contact us by phone or email.')}</p></noscript>'''


def contact_block(lang):
    return f'''<section class="contact" id="contacto"><p class="eyebrow">{tr(lang,'CONTACTO','CONTACT')}</p><h2>{tr(lang,'¿Necesita un informe<br>o asesoramiento técnico?','Need an expert report<br>or technical advice?')}</h2><p>{tr(lang,'Prepare los datos de su encargo para solicitar una valoración de alcance y presupuesto.', 'Prepare the details of your assignment for a scope review and quotation.')}</p>{form(lang)}</section>'''


def service_icon(key):
    return f'<img class="service-icon" src="/assets/icons/services/{key}.svg" width="30" height="30" alt="" decoding="async">'


def service_list(lang, exclude=None, custom_icons=False):
    return '<div class="service-list">' + ''.join(f'''<article><span>{i:02d}</span><div><h3>{link(s['key'],lang,s[lang]['name'])}</h3><p>{esc(s[lang]['coverage']) if 'coverage' in s[lang] and (custom_icons or exclude in ('expert','occupancy','opening')) else (tr(lang,'Toda España · Comunidad Valenciana','Spain · Valencian Community') if s['key'] in ('expert','accidents') else tr(lang,'Provincia de Alicante','Alicante province'))}</p></div><span class="arrow" aria-hidden="true">{service_icon(s["key"]) if custom_icons else "↗"}</span></article>''' for i,s in enumerate(SERVICES,1) if s['key'] != exclude) + '</div>'


def mark_reading_prose(match):
    # Do not justify short text or alter any of the translated copy.
    if len(unescape(match[1])) < 280:
        return match[0]
    return '<p class="reading-prose">' + match[1] + '</p>'


def shell(key, lang, title, description, body, service=None, draft=False):
    url = BASE + PATHS[key][lang]
    og_locale = {'es':'es_ES','en':'en_GB','de':'de_DE','no':'nb_NO','ru':'ru_RU','nl':'nl_NL'}[lang]
    body = body.replace('↗', '<svg class="icon-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.8"/></svg>')
    body = re.sub(r'<p>([^<]+)</p>', mark_reading_prose, body)
    provider = {'@type':'Person', '@id':BASE+'/#professional', 'name':NAME, 'jobTitle':tr(lang,'Ingeniero Mecánico','Mechanical Engineer'), 'url':BASE+'/', 'email':CONTACT_EMAIL, 'telephone':CONTACT_PHONE}
    graph = [provider, {'@type':'WebPage','@id':url+'#page','url':url,'name':title,'description':description,'inLanguage':HTML_LANG[lang],'about':{'@id':BASE+'/#professional'}}]
    if service:
        graph.append({'@type':'Service','@id':url+'#service','name':service[lang]['h1'],'serviceType':service[lang]['name'],'description':description,'url':url,'provider':{'@id':BASE+'/#professional'},'areaServed': service.get('area_served', ['España','Comunidad Valenciana','Alicante'] if service['key'] in ('expert','accidents') else ['Provincia de Alicante','Marina Baixa','Costa Blanca'])})
    if not draft:
        website_id = BASE + PATHS['home'][lang] + '#website'
        graph[1]['isPartOf'] = {'@id':website_id}
        if key == 'contact':
            graph[1]['@type'] = 'ContactPage'
        if service:
            graph[1]['mainEntity'] = {'@id':url+'#service'}
        graph.append({'@type':'WebSite','@id':website_id,'url':BASE+PATHS['home'][lang],
                      'name':NAME,'inLanguage':HTML_LANG[lang], 'publisher':{'@id':BASE+'/#professional'}})
        if key != 'home':
            graph[1]['breadcrumb'] = {'@id':url+'#breadcrumb'}
            graph.append({'@type':'BreadcrumbList','@id':url+'#breadcrumb','itemListElement':[
                {'@type':'ListItem','position':1,'name':tr(lang,'Inicio','Home'),'item':BASE+PATHS['home'][lang]},
                {'@type':'ListItem','position':2,'name':service[lang]['h1'] if service else tr(lang,'Contacto','Contact'),'item':url}]})
    alternates = ''.join(f'<link rel="alternate" hreflang="{HTML_LANG[l]}" href="{BASE+PATHS[key][l]}">\n' for l in LANGS)
    alternates += f'<link rel="alternate" hreflang="x-default" href="{BASE+PATHS[key]["es"]}">'
    og_alternates = ''.join(f'<meta property="og:locale:alternate" content="{locale}">\n' for code,locale in {'es':'es_ES','en':'en_GB','de':'de_DE','no':'nb_NO','ru':'ru_RU','nl':'nl_NL'}.items() if code != lang)
    return f'''<!doctype html>
<html lang="{HTML_LANG[lang]}">
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
<meta property="og:locale" content="{og_locale}">
{og_alternates}
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="{SELECTOR_CSS}">
<link rel="stylesheet" href="{TYPOGRAPHY_CSS}">
<script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script>
<script id="contact-translations" type="application/json">{json.dumps(LOCALES.get(lang, {}), ensure_ascii=False)}</script>
<script src="/script.js" defer></script>
<script src="{TYPOGRAPHY_SCRIPT}" defer></script>
</head>
<body>{header(key,lang)}<main id="contenido">{body}</main>{footer(lang)}{whatsapp(lang)}</body>
</html>
'''


def render_home(lang):
    body = (ROOT / f'site/templates/home-{lang}.html').read_text()
    # Keep the original hero, technical illustration, sections, spacing and profile.
    body = body.replace('href="#contacto"', f'href="{PATHS["contact"][lang]}"')
    start = body.index('<div class="service-list">')
    end = body.index('</section>', start)
    body = body[:start] + service_list(lang, custom_icons=True) + body[end:]
    body = body.replace(tr(lang,'Otros servicios','Other services'),tr(lang,'Servicios de ingeniería','Engineering services'))
    body = body.replace(tr(lang,'SERVICIOS COMPLEMENTARIOS','ADDITIONAL SERVICES'),tr(lang,'SERVICIOS','SERVICES'))
    body = body.replace(tr(lang,'Peritajes en toda España','Expert assessments throughout Spain'),tr(lang,'Peritajes en toda España · Especial atención a la Comunidad Valenciana','Expert assessments throughout Spain · Particular focus on the Valencian Community'))
    body += f'''<section class="section expertise"><div><p class="eyebrow dark">{tr(lang,'ÁMBITO DE TRABAJO','SERVICE AREA')}</p><h2>{tr(lang,'Peritajes en España.<br>Certificaciones en Alicante.','Expert reports across Spain.<br>Certificates in Alicante.')}</h2></div><div><p>{esc(SEO[lang]["home"]["scope"])}</p><p>{tr(lang,'Atención en Benidorm, Altea, Villajoyosa, Calpe, Dénia, Benissa, Polop, La Nucía, Callosa d’en Sarrià y l’Alfàs del Pi. Las visitas y el alcance se acuerdan según cada encargo.','Assignments in Benidorm, Altea, Villajoyosa, Calpe, Dénia, Benissa, Polop, La Nucía, Callosa d’en Sarrià and l’Alfàs del Pi. Visits and scope are agreed for each assignment.')}</p></div></section>'''
    body += contact_block(lang)
    title = SEO[lang]['home']['title']
    description = SEO[lang]['home']['description']
    return shell('home',lang,title,description,body)


def content_paragraphs(text, css_class=None):
    attribute = f' class="{css_class}"' if css_class else ''
    return ''.join(f'<p{attribute}>{esc(part)}</p>' for part in text.split('\n\n'))


def render_service(s, lang):
    data = s[lang]
    body = f'''<section class="service-hero"><p class="eyebrow">{tr(lang,'INGENIERÍA · ANÁLISIS TÉCNICO','ENGINEERING · TECHNICAL ANALYSIS')}</p><h1>{esc(data['h1'])}<span class="dot">.</span></h1>{content_paragraphs(data['lead'], "lead")}{link('contact',lang,tr(lang,'Solicitar presupuesto ↗','Request a quotation ↗'),'primary')}</section>'''
    contextual_links = {'expert':(3,'accidents'), 'accidents':(2,'expert'), 'energy':(3,'occupancy'), 'occupancy':(3,'energy')}
    for i,(heading,text) in enumerate(data['sections']):
        anchor = ' id="preliminary-assessment"' if s['key'] == 'expert' and i == 0 else ''
        related = ''
        if s['key'] in contextual_links and contextual_links[s['key']][0] == i:
            target = contextual_links[s['key']][1]
            target_service = next(item for item in SERVICES if item['key'] == target)
            related = link(target, lang, target_service[lang]['name'], 'text-link')
        body += f'<section{anchor} class="section expertise{" services" if i%2 else ""}"><div><p class="eyebrow dark">{i+1:02d}</p><h2>{esc(heading)}</h2></div><div>{content_paragraphs(text)}{related}</div></section>'
    body += f'<section class="section services"><h2>{tr(lang,"Servicios relacionados","Related services")}</h2>{service_list(lang,s["key"])}</section>'
    body += f'<section class="contact"><h2>{tr(lang,"Definamos el alcance de su encargo.","Let’s define the scope of your assignment.")}</h2><p>{tr(lang,"Indique el lugar, los hechos o el inmueble y los plazos que necesita valorar. El presupuesto se concreta tras revisar la información.","Describe the location, events or property and the deadlines to be assessed. A quotation is defined after reviewing the information.")}</p>{link("contact",lang,tr(lang,"Preparar consulta ↗","Prepare an enquiry ↗"),"primary")}</section>'
    return shell(s['key'],lang,data['title'],data['description'],body,s)


def render_contact(lang):
    body = f'''<section class="service-hero"><p class="eyebrow">{tr(lang,'CONTACTO PROFESIONAL','PROFESSIONAL ENQUIRIES')}</p><h1>{tr(lang,'Solicitar presupuesto','Request a quotation')}<span class="dot">.</span></h1><p class="lead">{NAME} | {tr(lang,'Ingeniero Mecánico. Peritajes en toda España; certificaciones y aperturas en la provincia de Alicante.','Mechanical Engineer. Expert reports throughout Spain; certificates and business opening support in Alicante province.')}</p></section><section class="section expertise"><div><h2>{tr(lang,'Qué información preparar','Information to prepare')}</h2></div><div><p>{tr(lang,'Indique el servicio, municipio, una descripción del caso o inmueble y los plazos relevantes. Para peritajes, añada una cronología y qué cuestiones necesita resolver; para certificaciones o aperturas, describa el uso y la documentación disponible. No adjunte documentación sensible en esta fase.','Include the service, municipality, a description of the case or property and relevant deadlines. For expert reports, outline the chronology and the questions to resolve; for certificates or opening procedures, describe the use and available documents. Do not include sensitive documents at this stage.')}</p></div></section>'''
    body += contact_block(lang)
    return shell('contact',lang,SEO[lang]['contact']['title'],SEO[lang]['contact']['description'],body)


LEGAL = {
'es': {
'legal': [('Titular del sitio','Manuel Adolfo García Rodríguez | Ingeniero Mecánico. Correo: info@adolfoingenieria.es. Pendiente de completar y verificar: NIF y demás información legal aplicable.'),('Información profesional','Pendiente de confirmar: datos de colegiación que proceda publicar, titulación oficial y referencias a las normas profesionales aplicables. No se publican acreditaciones adicionales sin verificación.'),('Objeto y condiciones de uso','Este sitio describe servicios de ingeniería y permite enviar consultas. La información general no sustituye el estudio de un caso ni constituye un presupuesto o una aceptación del encargo. Pendiente de revisión: condiciones de contratación, responsabilidades y normativa aplicable.'),('Propiedad intelectual y enlaces','Pendiente de verificar la titularidad y licencias de los contenidos, recursos y marcas, y de completar las condiciones de uso y referencias a terceros.')],
'privacy': [('Responsable y finalidad','Manuel Adolfo García Rodríguez. Contacto: info@adolfoingenieria.es. Los datos de nombre, correo, servicio y consulta se utilizan exclusivamente para gestionar y responder su solicitud. No se destinan a publicidad. No incluya información sensible o datos de terceros.'),('Base jurídica y conservación','Las consultas para contratar un servicio se atienden como medidas precontractuales solicitadas por el interesado; otras solicitudes se valoran conforme al interés legítimo en atender comunicaciones dirigidas al profesional. La casilla acredita la lectura de esta información, no una suscripción comercial. Antes de activar el formulario, el titular debe concretar y revisar los plazos de conservación de consultas, correos y registros, y las obligaciones de conservación aplicables.'),('Procesamiento y proveedores','El formulario transmite los datos por HTTPS a una función de Cloudflare Pages y, mediante Resend, al correo info@adolfoingenieria.es. Resend recibe el contenido y el correo de respuesta; el proveedor de la cuenta destinataria también procesa el mensaje. Cloudflare Turnstile comprueba la interacción para prevenir spam y puede procesar datos del dispositivo y de conexión. El código no almacena consultas en una base de datos, no registra su contenido y no usa almacenamiento local del navegador. Los proveedores pueden mantener registros propios; deben revisarse sus contratos y condiciones de privacidad.'),('Derechos y transferencias','Puede dirigirse a info@adolfoingenieria.es para ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad cuando procedan, y reclamar ante la AEPD. Pendiente de revisión por el titular: identificación fiscal, procedimiento de derechos, encargados y subencargados, garantías para posibles transferencias internacionales y conservación. El envío debe activarse solo tras revisar estas condiciones.'),('Recursos externos','El sitio carga tipografías de Google Fonts, que pueden recibir datos de conexión. La configuración real de cookies y registros de Cloudflare y del resto de proveedores debe revisarse antes de activar el servicio. El enlace de WhatsApp abre un servicio externo de WhatsApp/Meta sujeto a sus condiciones de privacidad al acceder. La web no carga widgets de WhatsApp ni envía mensajes automáticamente.')]

},
'en': {
'legal': [('Website owner','Manuel Adolfo García Rodríguez | Mechanical Engineer. To be completed and verified: tax identification and other applicable legal information. Contact email: info@adolfoingenieria.es.'),('Professional information','To be confirmed: any professional registration details to publish, official qualification and references to applicable professional rules. Additional credentials are not published without verification.'),('Purpose and terms of use','This website describes engineering services and enables enquiries to be submitted. General information does not replace a case assessment or constitute a quotation or acceptance of an assignment. Contract terms, responsibilities and applicable law require review.'),('Intellectual property and links','Ownership and licences for content, resources and marks must be verified, and terms of use and third-party references completed.')],
'privacy': [('Controller and purpose','Manuel Adolfo García Rodríguez. Contact: info@adolfoingenieria.es. Your name, email, service and enquiry are used solely to handle and reply to your request, not for marketing. Do not include sensitive or third-party data.'),('Legal basis and retention','Requests to engage a service are handled as pre-contractual steps requested by the individual; other enquiries are assessed under the legitimate interest in responding to communications addressed to the professional. The checkbox acknowledges this notice, not a marketing subscription. Before enabling submissions, the owner must define and review retention periods for enquiries, emails and logs and any applicable legal retention duties.'),('Processing and providers','The form sends data over HTTPS to a Cloudflare Pages Function and through Resend to info@adolfoingenieria.es. Resend receives the enquiry and reply email; the receiving mailbox provider also processes the message. Cloudflare Turnstile checks interactions to prevent spam and may process device and connection data. This code does not store enquiries in a database, log their content or use browser local storage. Providers may keep their own logs; their contracts and privacy terms must be reviewed.'),('Rights and transfers','Contact info@adolfoingenieria.es to exercise rights of access, rectification, erasure, objection, restriction and portability where applicable, or complain to the Spanish authority AEPD. The owner must review tax identification, rights procedures, processors and subprocessors, safeguards for possible international transfers and retention. Enable submissions only after reviewing these conditions.'),('External resources','The site loads Google Fonts, which may receive connection data. Actual cookies and logs used by Cloudflare and other providers must be reviewed before enabling the service. The WhatsApp link opens an external WhatsApp/Meta service subject to its privacy terms when accessed. This website loads no WhatsApp widgets and sends no messages automatically.')]

}}


LEGAL.update(json.loads((ROOT / 'site/legal-locales.json').read_text()))


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
    # Cloudflare serves one shared 404 document; offer every language without indexing it.
    not_found = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>404 | '+NAME+'</title><link rel="stylesheet" href="/styles.css"></head><body><main class="legal-content"><h1>404</h1><p>Página no encontrada · Page not found · Seite nicht gefunden · Siden finnes ikke · Страница не найдена · Pagina niet gevonden</p>'
    not_found = not_found.replace('</head>', f'<link rel="stylesheet" href="{SELECTOR_CSS}"></head>')
    not_found += language_switch('home', 'es')
    not_found += '</main>'+whatsapp('es')+'</body></html>'
    (ROOT / '404.html').write_text(not_found)
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    ET.register_namespace('xhtml', 'http://www.w3.org/1999/xhtml')
    ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    root = ET.Element(ns+'urlset')
    for key, paths in PATHS.items():
        if key in ('legal','privacy'):
            continue  # Legal drafts remain noindex and outside the sitemap.
        for path in paths.values():
            entry = ET.SubElement(root,ns+'url')
            ET.SubElement(entry,ns+'loc').text = BASE + path
            for lang in LANGS:
                ET.SubElement(entry,'{http://www.w3.org/1999/xhtml}link',rel='alternate',hreflang=HTML_LANG[lang],href=BASE+paths[lang])
            ET.SubElement(entry,'{http://www.w3.org/1999/xhtml}link',rel='alternate',hreflang='x-default',href=BASE+paths['es'])
    ET.indent(root)
    ET.ElementTree(root).write(ROOT / 'sitemap.xml', encoding='UTF-8', xml_declaration=True)
    print(f'Generated {len(PATHS)*len(LANGS)} static pages and sitemap ({(len(PATHS)-2)*len(LANGS)} indexable URLs).')


if __name__ == '__main__':
    build()
