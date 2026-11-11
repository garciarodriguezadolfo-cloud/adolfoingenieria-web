"""Validate the static SEO contract; run with Python's standard library."""
from html.parser import HTMLParser
from pathlib import Path
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://adolfoingenieria.es'
ALTERNATES = {'es': BASE + '/', 'en': BASE + '/en/', 'x-default': BASE + '/'}


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


for lang, file, url, target in [
    ('es', 'index.html', BASE + '/', '/en/'),
    ('en', 'en/index.html', BASE + '/en/', '/'),
]:
    text = (ROOT / file).read_text()
    page = Page(text)
    assert page.find('html') == [{'lang': lang}]
    assert [a['href'] for a in page.find('link', rel='canonical')] == [url]
    alternates = page.find('link', rel='alternate')
    assert len(alternates) == 3
    assert {a['hreflang']: a['href'] for a in alternates} == ALTERNATES
    assert [a['content'] for a in page.find('meta', property='og:url')] == [url]
    assert len(page.find('h1')) == 1
    assert page.find('meta', name='description')[0]['content']
    assert [a['href'] for a in page.find('a', id='lang')] == [target]
    assert not page.find('meta', name='robots')
    for tag, attr in [('link', 'href'), ('script', 'src')]:
        for a in page.find(tag):
            asset = a.get(attr, '')
            if asset and not asset.startswith(('https:', '/')):
                assert (ROOT / file).parent.joinpath(asset).is_file(), asset
    ld = text.split('<script type="application/ld+json">')[1].split('</script>')[0]
    assert json.loads(ld)['@type'] == 'ProfessionalService'

ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
sitemap = ET.parse(ROOT / 'sitemap.xml').getroot()
assert sitemap.tag == ns + 'urlset'
assert [node.text for node in sitemap.findall(ns + 'url/' + ns + 'loc')] == [BASE + '/', BASE + '/en/']
assert (ROOT / 'robots.txt').read_text().splitlines() == [
    'User-agent: *', 'Allow: /', 'Sitemap: ' + BASE + '/sitemap.xml']
headers = (ROOT / '_headers').read_text()
assert '/sitemap.xml\n  Content-Type: application/xml; charset=utf-8' in headers
assert '/robots.txt\n  Content-Type: text/plain; charset=utf-8' in headers
assert (ROOT / '404.html').is_file(), 'Pages must not fall back to SPA routing'
assert 'noindex' in Page((ROOT / '404.html').read_text()).find('meta', name='robots')[0]['content']
print('OK: bilingual metadata, crawlable language links, assets, sitemap, robots and Pages files')
