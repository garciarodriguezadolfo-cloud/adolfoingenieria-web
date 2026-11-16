"""French additions and preservation of the six existing locales against PR base."""
from pathlib import Path
import json,re,subprocess
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='93f65e0'
def old(file):return subprocess.check_output(['git','show',f'{BASE}:{file}'],cwd=ROOT)
def previous(file):return json.loads(old(file))
def current(file):return json.loads((ROOT/file).read_text())
old_languages=['es','en','de','no','ru','nl']
for file in ('site/locales/de.json','site/locales/no.json','site/locales/ru.json','site/locales/nl.json',*[f'site/templates/home-{l}.html' for l in old_languages],
 'site/config.json','site/schema-overrides.json','script.js','styles.css','typography.css','typography.js','robots.txt','_headers','_routes.json'):
    assert (ROOT/file).read_bytes()==old(file),file
for file in ('site/seo.json','site/article-locales.json','site/legal-locales.json'):
    data=current(file);assert 'fr' in data
    data.pop('fr');assert data==previous(file),file
services=current('site/services.json')
for data,prior in zip(services,previous('site/services.json')):
    assert 'fr' in data;data.pop('fr');assert data==prior
for data,prior in zip(current('site/articles.json'),previous('site/articles.json')):
    assert 'fr' in data['translations'];data['translations'].pop('fr');assert data==prior
# Generated existing HTML content and shared framing may only acquire FR links/SEO.
files=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT,text=True).splitlines()
for file in files:
    if not file.endswith('.html') or file.startswith('site/') or file=='404.html':continue
    prior=old(file).decode();new=(ROOT/file).read_text()
    for tag in ('main','footer'):
        extract=lambda s:re.search(rf'<{tag}\b.*?</{tag}>',s,re.S).group(0)
        assert extract(new)==extract(prior),(file,tag)
    new=re.sub(r'<link rel="alternate" hreflang="fr"[^>]*>\n','',new)
    new=new.replace('<meta property="og:locale:alternate" content="fr_FR">\n','')
    new=re.sub(r'<a\b[^>]* hreflang="fr"[^>]*>.*?</a>','',new,flags=re.S)
    css=lambda s:re.sub(r'(/language-selector\.css\?v=)[a-f0-9]+',r'\1HASH',s)
    assert css(new)==css(prior),file
before=old('functions/api/contact.js').decode()
after=(ROOT/'functions/api/contact.js').read_text()
assert after.replace("'nl','fr']","'nl']")==before,'Only the language allowlist may change'
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
locs=lambda r:{x.text for x in r.findall('s:url/s:loc',ns)}
a=locs(ET.fromstring(old('sitemap.xml')));b=locs(ET.parse(ROOT/'sitemap.xml').getroot())
assert a<=b and len(b-a)==9 and all('/fr/' in u for u in b-a)
assert len(b)==63
locale=current('site/locales/fr.json');assert set(locale)==set(current('site/locales/nl.json'))
assert locale['Mechanical Engineer | Technical Expert']=='Ingénieur mécanicien | Expert technique'
article=current('site/articles.json')[0]
assert article['translations']['fr']['references']==article['translations']['es']['references']
assert article['image']==previous('site/articles.json')[0]['image']
for s in current('site/services.json'):
    if s['key'] in ('energy','occupancy','opening'):
        assert 'Costa Blanca' in s['fr']['lead'] and 'Marina Baixa' in s['fr']['lead']
    else:assert 'Espagne' in s['fr']['lead'] and 'Communauté valencienne' in s['fr']['lead']
print('OK: six locales, all existing page contents, framing, assets/config preserved; only FR selector/SEO added, nine sitemap additions, seven-language form, source article image/references and scopes unchanged.')
