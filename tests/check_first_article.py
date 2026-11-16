"""Real publication/source integrity checks. Optional --pdf verifies the supplied PDF."""
from pathlib import Path
from html.parser import HTMLParser
import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE_REV='526acae'
record=json.loads((ROOT/'site/articles.json').read_text())[0]
ui=json.loads((ROOT/'site/article-locales.json').read_text())
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.tags=[];self.feed(text)
    def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
    def find(self,t,**kw):return [a for tag,a in self.tags if tag==t and all(a.get(k)==v for k,v in kw.items())]

def old(file):return subprocess.check_output(['git','show',f'{BASE_REV}:{file}'],cwd=ROOT)
def normalized(text):return re.sub(r'\s+',' ',text).strip()
def block(text,tag):return re.search(rf'<{tag}\b.*?</{tag}>',text,re.S).group(0)
indexes=[];urls=[]
for lang,c in record['translations'].items():
    index=('/' if lang=='es' else f'/{lang}/')+ui[lang]['slug']+'/'
    path=index+c['slug']+'/'
    indexes.append(index.lstrip('/')+'index.html');urls.append('https://adolfoingenieria.es'+path)
    text=(ROOT/path.lstrip('/')/'index.html').read_text();page=Page(text)
    assert len(page.find('h1'))==1
    assert page.find('meta',name='author')[0]['content']=='Manuel Adolfo García Rodríguez'
    assert page.find('meta',name='description')[0]['content']==c['description']
    assert page.find('meta',property='og:image')[0]['content']=='https://adolfoingenieria.es'+record['image']['src']
    assert page.find('link',rel='canonical')[0]['href']==urls[-1]
    graph=json.loads(text.split('<script type="application/ld+json">')[1].split('</script>')[0])['@graph']
    a=next(n for n in graph if n['@type']=='Article')
    assert a['headline']==c['title'] and a['author']['name']=='Manuel Adolfo García Rodríguez'
    assert a['author']['jobTitle']==c['professional_title']
    assert a['datePublished']==record['date_published'] and 'dateModified' not in a
    assert [r['name'] for r in a['citation']]==[r['title'] for r in record['translations']['es']['references']]
    assert all('url' not in r for r in a['citation'])
    for h in ('header','footer'):
        actual=block(text,h)
        if h=='header':
            for code,translation in record['translations'].items():
                prefix=('/' if code=='es' else f'/{code}/')+ui[code]['slug']+'/'
                actual=actual.replace('href="'+prefix+translation['slug']+'/"','href="'+prefix+'"')
        assert actual==block(old(index.lstrip('/')+'index.html').decode(),h), (lang,h)
    prior=old(index.lstrip('/')+'index.html').decode()
    for h in ('header','footer'):
        assert block((ROOT/index.lstrip('/')/'index.html').read_text(),h)==block(prior,h)
    old_wa=re.search(r'<a class="whatsapp-float".*?</a>',prior,re.S).group(0)
    assert old_wa in text

# Every pre-existing HTML outside the six listing pages must be byte-identical.
files=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE_REV],cwd=ROOT,text=True).splitlines()
for file in files:
    if file.endswith('.html') and file not in indexes:
        assert (ROOT/file).read_bytes()==old(file),file
for file in ('styles.css','language-selector.css','typography.css','typography.js','script.js','functions/api/contact.js','site/config.json','robots.txt','_headers','_routes.json'):
    assert (ROOT/file).read_bytes()==old(file),file
ns={'sm':'http://www.sitemaps.org/schemas/sitemap/0.9'}
prior=ET.fromstring(old('sitemap.xml'));current=ET.parse(ROOT/'sitemap.xml').getroot()
def by_loc(root):
    result={}
    for e in root.findall('sm:url',ns):
        e.tail=None
        result[e.find('sm:loc',ns).text]=ET.tostring(e)
    return result
before,after=by_loc(prior),by_loc(current)
assert set(after)-set(before)==set(urls) and set(before)<=set(after)
assert all(after[k]==v for k,v in before.items()),'Existing sitemap entries changed'
parser=argparse.ArgumentParser();parser.add_argument('--pdf');args=parser.parse_args()
if args.pdf:
    pdf=normalized(subprocess.check_output(['pdftotext','-layout',args.pdf,'-'],text=True))
    es=record['translations']['es']
    for section in es['sections']:
        for paragraph in section['paragraphs']:assert normalized(paragraph) in pdf,section['heading']
    for ref in es['references']:assert normalized(ref['title']) in pdf
    assert normalized(es['title']) in pdf
    assert normalized(es['image_caption']) in pdf
    print('OK: Spanish title, four paragraphs, image caption and references match PDF text.')
print('OK: six real articles, author, metadata, references, header/footer/WhatsApp, unchanged existing pages and exactly six sitemap additions.')
