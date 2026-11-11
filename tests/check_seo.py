"""Validate generated pages, internal targets and SEO without third-party packages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build_site import PATHS, BASE


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
        page = Page(text)
        pages[path] = page
        url = BASE + path
        assert page.find('html') == [{'lang':lang}], path
        assert [a['href'] for a in page.find('link',rel='canonical')] == [url], path
        alternates = page.find('link',rel='alternate')
        assert len(alternates) == 3, path
        assert {a['hreflang']:a['href'] for a in alternates} == {
            'es':BASE+paths['es'], 'en':BASE+paths['en'], 'x-default':BASE+paths['es']}, path
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
        other = 'en' if lang == 'es' else 'es'
        assert [a['href'] for a in page.find('a',id='lang')] == [paths[other]]
        schema = json.loads(text.split('<script type="application/ld+json">')[1].split('</script>')[0])
        graph = schema['@graph']
        assert graph[0]['name'] == 'Manuel Adolfo García Rodríguez | Ingeniero Mecánico'
        assert graph[1]['url'] == url and graph[1]['inLanguage'] == lang
        assert graph[0]['telephone'] == '+34638651175'
        assert not any(field in graph[0] for field in ('address','aggregateRating','priceRange'))
        if key not in ('home','contact','legal','privacy'):
            assert graph[2]['@type'] == 'Service'
            assert graph[2]['areaServed'] == (['España','Comunidad Valenciana'] if key in ('expert','accidents') else ['Provincia de Alicante'])
        if key in ('home','contact'):
            assert page.find('a',href='tel:+34638651175')
            assert page.find('form',id='contact-form')
            assert page.find('form')[0]['action'] == '/api/contact'
            assert page.find('form')[0]['method'] == 'post'
            assert 'required' in page.find('input',name='email')[0]
            assert 'required' in page.find('input',name='privacy')[0]
            assert page.find('p',id='contact-notice')
            assert 'disabled' in page.find('button',type='submit')[0]
            assert page.find('a',href='mailto:garciarodriguezadolfo@gmail.com')

for path,page in pages.items():
    for tag,attr in [('a','href'),('link','href'),('script','src')]:
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
assert len(urls) == len(set(urls)) == 14 and set(urls) == indexable
assert (ROOT/'robots.txt').read_text().splitlines() == ['User-agent: *','Allow: /','Sitemap: '+BASE+'/sitemap.xml']
headers = (ROOT/'_headers').read_text()
assert '/sitemap.xml\n  Content-Type: application/xml; charset=utf-8' in headers
assert '/robots.txt\n  Content-Type: text/plain; charset=utf-8' in headers
assert 'noindex' in Page((ROOT/'404.html').read_text()).find('meta',name='robots')[0]['content']
print(f'OK: {len(pages)} pages, unique metadata, reciprocal languages, schema, internal links/anchors, 14 sitemap URLs, robots and headers.')
