"""Editorial publication tests: fixtures render in memory, never into site routes."""
from datetime import date
import json
from pathlib import Path
import sys
import tempfile
import shutil
import subprocess
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import build_site as site
from article_content import validate_articles, article_date


def fixture():
    return {'id':'validation-fixture','status':'published','date_published':'2000-01-01',
            'related_services':['expert'], 'translations':{
                lang:{'slug':'validation-fixture','title':f'Validation fixture {lang}',
                      'description':f'Unit-test summary {lang}', 'category':f'Category {lang}',
                      'sections':[{'heading':'Heading','paragraphs':['Text for rendering validation.']},
                                  {'heading':'Subheading','level':3,'items':['A technical point.']}],
                      'references':[{'title':'Reference','url':'https://example.com/reference'}]}
                for lang in site.LANGS}}


class ArticleTests(unittest.TestCase):
    def validate(self, records):
        return validate_articles(records,site.LANGS,{s['key'] for s in site.SERVICES},today=date(2026,11,16))

    def render_fixture(self, record, lang='es'):
        key = 'article:' + record['id']
        routes = {l:site.PATHS['articles'][l]+record['translations'][l]['slug']+'/' for l in site.LANGS}
        with patch.dict(site.PATHS,{key:routes}):
            return site.render_article(record,lang), routes

    def schema(self, html):
        return json.loads(html.split('<script type="application/ld+json">')[1].split('</script>')[0])['@graph']

    def test_empty_catalog_does_not_invent_publications(self):
        with patch.object(site,'PUBLISHED_ARTICLES',[]):
            for lang in site.LANGS:
                html = site.render_articles(lang)
                self.assertIn(site.ARTICLE_UI[lang]['empty'],html)
                self.assertNotIn('<time ',html)
                self.assertNotIn('<article>',html)
                self.assertFalse(any(n['@type']=='Article' for n in self.schema(html)))
                self.assertEqual(next(n for n in self.schema(html) if n['@type']=='ItemList')['numberOfItems'],0)

    def test_publication_template_in_six_languages(self):
        record = fixture()
        self.validate([record])
        for lang in site.LANGS:
            html, routes = self.render_fixture(record,lang)
            graph = self.schema(html)
            article = next(n for n in graph if n['@type']=='Article')
            self.assertEqual(article['headline'],record['translations'][lang]['title'])
            self.assertEqual(article['datePublished'],'2000-01-01')
            self.assertEqual(article['inLanguage'],site.HTML_LANG[lang])
            self.assertEqual(article['author']['@id'],site.BASE+'/#professional')
            self.assertEqual(graph[0]['name'],site.NAME)
            self.assertIn('<h3>Subheading</h3>',html)
            self.assertIn('https://example.com/reference',html)
            self.assertIn('href="'+site.PATHS['expert'][lang]+'"',html)
            for target in site.LANGS:
                self.assertIn('hreflang="'+site.HTML_LANG[target]+'" href="'+site.BASE+routes[target]+'"',html)
            crumbs = next(n for n in graph if n['@type']=='BreadcrumbList')['itemListElement']
            self.assertEqual([c['position'] for c in crumbs],[1,2,3])
            self.assertEqual(crumbs[1]['item'],site.BASE+site.PATHS['articles'][lang])

    def test_published_listing_has_real_date_summary_and_link(self):
        record = fixture()
        key = 'article:'+record['id']
        routes={l:site.PATHS['articles'][l]+'validation-fixture/' for l in site.LANGS}
        with patch.object(site,'PUBLISHED_ARTICLES',[record]),patch.dict(site.PATHS,{key:routes}):
            html=site.render_articles('es')
            self.assertIn('datetime="2000-01-01"',html)
            self.assertIn('Unit-test summary es',html)
            self.assertIn('href="/articulos/validation-fixture/"',html)
            self.assertNotIn(site.ARTICLE_UI['es']['empty'],html)
            self.assertEqual(next(n for n in self.schema(html) if n['@type']=='ItemList')['numberOfItems'],1)

    def test_drafts_do_not_require_content_and_never_publish(self):
        self.validate([{'id':'draft-only','status':'draft'}])

    def test_invalid_publication_is_rejected(self):
        mutations=[lambda a:a['translations'].pop('ru'),
                   lambda a:a.update(date_published='2300-01-01'),
                   lambda a:a.update(date_modified='1999-01-01'),
                   lambda a:a.update(date_published='20000101'),
                   lambda a:a.update(related_services=['unknown']),
                   lambda a:a['translations']['es'].update(slug='../contacto'),
                   lambda a:a['translations']['es'].update(sections=[]),
                   lambda a:a['translations']['es']['sections'][0].update(level=3),
                   lambda a:a['translations']['es']['references'][0].update(url='javascript:alert(1)'),
                   lambda a:a['translations']['es']['references'][0].update(url='https://user:password@example.com/'),
                   lambda a:a.update(author='An unconfigured author')]
        for change in mutations:
            record=fixture();change(record)
            with self.subTest(change=change),self.assertRaises(ValueError):self.validate([record])
        duplicate=fixture();duplicate['id']='second-fixture'
        with self.assertRaises(ValueError):self.validate([fixture(),duplicate])
        with self.assertRaises(ValueError):self.validate([fixture(),fixture()])

    def test_plain_text_and_json_ld_cannot_close_script(self):
        record=fixture()
        dangerous='A </script><script>alert(1)</script>'
        record['translations']['es']['title']=dangerous
        record['translations']['es']['sections'][0]['paragraphs']=['<script>alert(1)</script>']
        self.validate([record])
        html,_=self.render_fixture(record)
        self.assertNotIn('<script>alert(1)</script>',html)
        self.assertIn('&lt;script&gt;alert(1)&lt;/script&gt;',html)
        self.assertEqual(next(n for n in self.schema(html) if n['@type']=='Article')['headline'],dangerous)

    def test_cleanup_only_owned_article_pages(self):
        with tempfile.TemporaryDirectory() as directory,patch.object(site,'ROOT',Path(directory)):
            owned=Path(directory)/'articulos/withdrawn/index.html'
            owned.parent.mkdir(parents=True);owned.write_text('<!-- generated:technical-article -->')
            other=owned.parent/'keep.txt';other.write_text('Keep this file')
            site.prune_article_pages(['/articulos/withdrawn/'],[])
            self.assertFalse(owned.exists());self.assertTrue(other.exists())
            owned.write_text('Manually maintained content')
            with self.assertRaises(ValueError):site.prune_article_pages(['/articulos/withdrawn/'],[])
            self.assertTrue(owned.exists())
            with self.assertRaises(ValueError):site.prune_article_pages(['/contacto/'],[])

    def test_full_build_publish_and_withdraw_in_temporary_workspace(self):
        source=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)
            for folder in ('tools','site','assets','tests'):
                shutil.copytree(source/folder,target/folder,ignore=shutil.ignore_patterns('__pycache__'))
            for file in [*source.glob('*.css'),*source.glob('*.js'),source/'robots.txt',source/'_headers']:
                shutil.copyfile(file,target/file.name)
            record=fixture()
            (target/'site/articles.json').write_text(json.dumps([record],ensure_ascii=False))
            def run(script):
                result=subprocess.run([sys.executable,script],cwd=target,text=True,capture_output=True)
                self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            run('tools/build_site.py')
            run('tests/check_seo.py')
            paths=json.loads((target/'site/article-generated-paths.json').read_text())
            self.assertEqual(len(paths),6)
            for path in paths:
                self.assertTrue((target/path.lstrip('/')/'index.html').is_file())
            record['status']='draft'
            (target/'site/articles.json').write_text(json.dumps([record],ensure_ascii=False))
            run('tools/build_site.py')
            run('tests/check_seo.py')
            self.assertEqual(json.loads((target/'site/article-generated-paths.json').read_text()),[])
            for path in paths:
                self.assertFalse((target/path.lstrip('/')/'index.html').exists())

    def test_localized_dates(self):
        self.assertEqual(article_date('2026-11-16','es',site.ARTICLE_UI['es']),'16 de noviembre de 2026')
        self.assertEqual(article_date('2026-11-16','no',site.ARTICLE_UI['no']),'16. november 2026')


if __name__=='__main__':
    unittest.main()
