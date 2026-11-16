"""Validated, plain-text editorial content. No CMS or runtime dependencies."""
from datetime import date
from html import escape
import json
import re
from urllib.parse import urlsplit

SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')


def required_text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{field}: expected non-empty text')


def iso_date(value, field):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        raise ValueError(f'{field}: use YYYY-MM-DD')
    return date.fromisoformat(value)


def validate_articles(records, languages, service_keys, today=None):
    today = today or date.today()
    if not isinstance(records, list):
        raise ValueError('articles: expected a list')
    ids, slugs = set(), {lang: set() for lang in languages}
    allowed = {'id', 'status', 'date_published', 'date_modified', 'related_services', 'translations'}
    for record in records:
        if not isinstance(record, dict) or set(record) - allowed:
            raise ValueError('article: unknown fields or invalid record')
        identifier = record.get('id', '')
        if not isinstance(identifier, str) or not SLUG.fullmatch(identifier) or identifier in ids:
            raise ValueError('article: id must be a unique lowercase slug')
        ids.add(identifier)
        if record.get('status') not in ('draft', 'published'):
            raise ValueError(f'{identifier}: status must be draft or published')
        if record['status'] == 'draft':
            continue  # Drafts never create pages, schema, index cards or sitemap entries.
        published = iso_date(record.get('date_published'), f'{identifier}.date_published')
        if published > today:
            raise ValueError(f'{identifier}: a published article cannot be future-dated')
        if 'date_modified' in record:
            modified = iso_date(record['date_modified'], f'{identifier}.date_modified')
            if modified < published or modified > today:
                raise ValueError(f'{identifier}: invalid modification date')
        related = record.get('related_services', [])
        if not isinstance(related, list) or any(not isinstance(k, str) or k not in service_keys for k in related) or len(related) != len(set(related)):
            raise ValueError(f'{identifier}: invalid related service keys')
        translations = record.get('translations')
        if not isinstance(translations, dict) or set(translations) != set(languages):
            raise ValueError(f'{identifier}: publication requires all six translations')
        for lang, content in translations.items():
            if not isinstance(content, dict) or set(content) - {'slug','title','description','category','sections','references'}:
                raise ValueError(f'{identifier}.{lang}: unknown or invalid content fields')
            for field in ('slug','title','description','category'):
                required_text(content.get(field), f'{identifier}.{lang}.{field}')
            slug = content['slug']
            if not SLUG.fullmatch(slug) or slug in slugs[lang]:
                raise ValueError(f'{identifier}.{lang}: invalid or duplicate slug')
            slugs[lang].add(slug)
            sections = content.get('sections')
            if not isinstance(sections, list) or not sections:
                raise ValueError(f'{identifier}.{lang}: empty article content')
            has_h2 = False
            for section in sections:
                if not isinstance(section, dict) or set(section) - {'heading','level','paragraphs','items'}:
                    raise ValueError(f'{identifier}.{lang}: invalid section')
                required_text(section.get('heading'), 'section.heading')
                level = section.get('level', 2)
                if type(level) is not int or level not in (2, 3) or (level == 3 and not has_h2):
                    raise ValueError('section.level: H2 first, then H2 or H3')
                has_h2 = has_h2 or level == 2
                for field in ('paragraphs','items'):
                    values = section.get(field, [])
                    if not isinstance(values, list):
                        raise ValueError(f'section.{field}: expected a list')
                    for value in values:
                        required_text(value, f'section.{field}')
                if not section.get('paragraphs') and not section.get('items'):
                    raise ValueError('section: provide actual paragraphs or list items')
            references = content.get('references', [])
            if not isinstance(references, list):
                raise ValueError('references: expected a list')
            for ref in references:
                if not isinstance(ref, dict) or set(ref) != {'title','url'}:
                    raise ValueError('reference: expected title and url')
                required_text(ref['title'], 'reference.title')
                required_text(ref['url'], 'reference.url')
                target = urlsplit(ref['url'])
                if target.scheme != 'https' or not target.hostname or target.username or target.password or any(c.isspace() for c in ref['url']):
                    raise ValueError('reference.url: use a public HTTPS reference without credentials')
    return records


def load_articles(path, languages, service_keys):
    return validate_articles(json.loads(path.read_text()), languages, service_keys)


def article_date(value, lang, ui):
    day = iso_date(value, 'date')
    month = ui['months'][day.month - 1]
    if lang == 'es':
        return f'{day.day} de {month} de {day.year}'
    if lang in ('de', 'no'):
        return f'{day.day}. {month} {day.year}'
    if lang == 'ru':
        return f'{day.day} {month} {day.year} г.'
    return f'{day.day} {month} {day.year}'


def sections_html(sections):
    result = []
    for section in sections:
        level = section.get('level', 2)
        result.append(f'<h{level}>{escape(section["heading"])}</h{level}>')
        result.extend(f'<p>{escape(p)}</p>' for p in section.get('paragraphs', []))
        if section.get('items'):
            result.append('<ul>' + ''.join(f'<li>{escape(p)}</li>' for p in section['items']) + '</ul>')
    return ''.join(result)
