"""Validate generated pages, internal targets and SEO without third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build_site import PATHS, BASE, LANGS, HTML_LANG, WHATSAPP, LANG_NAMES, FLAGS, LOCALES


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.data = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def handle_data(self, data):
        self.data.append(data)

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k,v in attrs.items())]


pages = {}
titles, descriptions = set(), set()
indexable = set()
for key, paths in PATHS.items():
    for lang, path in paths.items():
        file = ROOT / path.lstrip('/') / 'index.html'
        text = file.read_text()
        assert '@gmail.com' not in text.lower(), path
        page = Page(text)
        pages[path] = page
        url = BASE + path
        assert page.find('html') == [{'lang':HTML_LANG[lang]}], path
        assert [a['href'] for a in page.find('link',rel='canonical')] == [url], path
        alternates = page.find('link',rel='alternate')
        assert len(alternates) == len(LANGS)+1, path
        assert {a['hreflang']:a['href'] for a in alternates} == {
            **{HTML_LANG[l]:BASE+paths[l] for l in LANGS}, 'x-default':BASE+paths['es']}, path
        assert [a['content'] for a in page.find('meta',property='og:url')] == [url]
        assert len(page.find('h1')) == 1 and page.find('h2'), path
        title = text.split('<title>')[1].split('</title>')[0]
        description = page.find('meta',name='description')[0]['content']
        assert title not in titles and description, path
        titles.add(title)
        if key not in ('legal','privacy'):
            assert description not in descriptions, path
            descriptions.add(description)
            assert not page.find('meta',name='robots'), path
            indexable.add(url)
        else:
            assert 'noindex' in page.find('meta',name='robots')[0]['content']
        ids = [a['id'] for _,a in page.tags if 'id' in a]
        assert len(ids) == len(set(ids)), path
        selectors = page.find('a', **{'aria-current':'page'})
        assert len(selectors) == 1 and selectors[0]['href'] == path
        for target in LANGS:
            choices = page.find('a', href=paths[target], hreflang=HTML_LANG[target])
            assert len(choices) == 1 and choices[0]['aria-label'] == LANG_NAMES[target], (path, target)
            assert choices[0]['title'] == LANG_NAMES[target]
            flags = page.find('img', src=f'/assets/flags/{FLAGS[target]}.svg')
            assert len(flags) == 1 and flags[0]['alt'] == '' and flags[0]['aria-hidden'] == 'true'
            assert flags[0]['width'] == '24' and flags[0]['height'] == '16'
            assert ET.parse(ROOT / f'assets/flags/{FLAGS[target]}.svg').getroot().get('viewBox') == '0 0 24 16'
        whatsapp = page.find('a', **{'class':'whatsapp-float'})
        assert len(whatsapp) == 1
        from urllib.parse import parse_qs
        wa = urlsplit(whatsapp[0]['href'])
        assert wa.netloc == 'wa.me' and wa.path == '/34638651175'
        assert parse_qs(wa.query)['text'] == [WHATSAPP[lang][0]]
        assert whatsapp[0]['rel'] == 'noopener noreferrer'
        assert '+34 638 651 175' in whatsapp[0]['aria-label']
        schema = json.loads(text.split('<script type="application/ld+json">')[1].split('</script>')[0])
        graph = schema['@graph']
        assert graph[0]['@type'] == 'Person'
        assert graph[0]['name'] == 'Manuel Adolfo García Rodríguez'
        assert graph[0]['jobTitle']
        assert graph[1]['url'] == url and graph[1]['inLanguage'] == HTML_LANG[lang]
        assert graph[0]['telephone'] == '+34638651175'
        assert graph[0]['email'] == 'info@adolfoingenieria.es'
        assert not any(field in graph[0] for field in ('address','aggregateRating','priceRange'))
        if key not in ('home','contact','legal','privacy'):
            assert graph[2]['@type'] == 'Service'
            assert graph[2]['areaServed'] == (['España','Comunidad Valenciana','Alicante'] if key in ('expert','accidents') else ['Provincia de Alicante','Marina Baixa','Costa Blanca'])
        if key not in ('legal','privacy'):
            website = next(item for item in graph if item['@type'] == 'WebSite')
            assert website['url'] == BASE+PATHS['home'][lang]
            assert website['inLanguage'] == HTML_LANG[lang]
            assert graph[1]['isPartOf']['@id'] == website['@id']
            assert website['publisher']['@id'] == graph[0]['@id']
            assert len({item['@id'] for item in graph}) == len(graph)
            if key != 'home':
                crumb = next(item for item in graph if item['@type'] == 'BreadcrumbList')
                assert [i['position'] for i in crumb['itemListElement']] == [1,2]
                assert [i['item'] for i in crumb['itemListElement']] == [BASE+PATHS['home'][lang],url]
                assert graph[1]['breadcrumb']['@id'] == crumb['@id']
            if key not in ('home','contact'):
                assert graph[1]['mainEntity']['@id'] == graph[2]['@id']
            else:
                assert graph[1]['@type'] == ('ContactPage' if key == 'contact' else 'WebPage')
        assert len(page.find('meta',property='og:locale:alternate')) == 5
        if key == 'expert':
            assert page.find('section',id='preliminary-assessment')
        if key in ('home','contact'):

            assert page.find('a',href='tel:+34638651175')
            assert page.find('form',id='contact-form')
            assert page.find('form')[0]['action'] == '/api/contact'
            assert page.find('form')[0]['method'] == 'post'
            assert 'required' in page.find('input',name='email')[0]
            assert 'required' in page.find('input',name='privacy')[0]
            assert page.find('p',id='contact-notice')
            assert 'disabled' in page.find('button',type='submit')[0]
            emails = page.find('a',href='mailto:info@adolfoingenieria.es')
            assert len(emails) == 1, path
            assert [a['href'] for a in page.find('a') if a.get('href','').startswith('mailto:')] == ['mailto:info@adolfoingenieria.es'], path

for path,page in pages.items():
    for tag,attr in [('a','href'),('link','href'),('script','src'),('img','src')]:
        for a in page.find(tag):
            value = a.get(attr,'')
            if not value or value.startswith(('https:', 'mailto:', 'tel:')):
                continue
            parsed = urlsplit(value)
            assert value.startswith(('/', '#')), (path,value)
            target_path = unquote(parsed.path) or path
            file = ROOT / target_path.lstrip('/')
            if target_path.endswith('/'):
                file /= 'index.html'
            assert file.is_file(), (path,value)
            if parsed.fragment:
                assert any(attrs.get('id') == parsed.fragment for _,attrs in pages[target_path].tags), (path,value)

ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
root = ET.parse(ROOT/'sitemap.xml').getroot()
assert root.tag == ns+'urlset'
urls = [loc.text for loc in root.findall(ns+'url/'+ns+'loc')]
assert len(urls) == len(set(urls)) == 42 and set(urls) == indexable
for entry in root.findall(ns+'url'):
    location = entry.find(ns+'loc').text
    key = next(key for key,paths in PATHS.items() if location in {BASE+p for p in paths.values()})
    expected = {HTML_LANG[lang]:BASE+path for lang,path in PATHS[key].items()}
    expected['x-default'] = BASE+PATHS[key]['es']
    alternates = entry.findall('{http://www.w3.org/1999/xhtml}link')
    assert len(alternates) == 7
    assert all(item.get('rel') == 'alternate' for item in alternates)
    assert {item.get('hreflang'):item.get('href') for item in alternates} == expected
# Detect orphan indexable HTML outside the generator's route table as well.
actual_indexable = set()
for file in ROOT.rglob('*.html'):
    relative = file.relative_to(ROOT)
    if relative.parts[0] in ('site','node_modules','.git'):
        continue
    page = Page(file.read_text())
    if not any('noindex' in a.get('content','') for a in page.find('meta',name='robots')):
        actual_indexable.add(BASE+'/' + (str(relative.parent)+'/' if str(relative.parent) != '.' else ''))
assert actual_indexable == indexable, actual_indexable ^ indexable
assert (ROOT/'robots.txt').read_text().splitlines() == ['User-agent: *','Allow: /','Sitemap: '+BASE+'/sitemap.xml']
headers = (ROOT/'_headers').read_text()
assert '/sitemap.xml\n  Content-Type: application/xml; charset=utf-8' in headers
assert '/robots.txt\n  Content-Type: text/plain; charset=utf-8' in headers
assert 'noindex' in Page((ROOT/'404.html').read_text()).find('meta',name='robots')[0]['content']
print(f'OK: {len(pages)} pages, unique metadata, reciprocal languages, schema, internal links/anchors, 42 sitemap URLs, robots and headers.')

assert set(LOCALES['nl']) == set(LOCALES['de']) == set(LOCALES['no']) == set(LOCALES['ru'])
assert all(value.strip() for value in LOCALES['nl'].values())
print('OK: local SVG flags, native accessible language names, uniform dimensions and complete Dutch shared translation keys.')
