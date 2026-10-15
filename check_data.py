"""Check the research data in data/ against the project's rules. Usage: python check_data.py

Exits with code 1 and lists every problem it finds. It checks what a script can check:
  - every file is valid JSON in the canonical layout (lineage_data.dumps_entry), so diffs stay small
  - every milestone has the required fields, a valid date for its precision and an https primary source
  - every milestone's level matches the rule in lineage_data.py (docs/LEVELS.md), and tp matches the level
  - every relationship joins two known milestones, has an evidence type, a note and an https source,
    and carries "dateflip": true exactly when it points from a later milestone to an earlier one
  - chapters, threads, study notes, phases, the tracer and glossary terms only name things that exist
  - no em dash appears anywhere (en dashes are for number ranges only)
It cannot check that a source supports a claim. That stays a human review step.

A new value for a controlled vocabulary (type, claim, imp, dtype, rel, ev) is rejected until it is added
below on purpose, in the same pull request.
"""
import json, re, sys, datetime
from lineage_data import (DATA, milestone_files, thread_files, chapter_files, dumps_entry, dumps_relationship,
                          influence, expected_level, TP_DIRECT, TP_THREADS, RECENT_FROM)

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

TYPES = {'architectural idea', 'benchmark', 'dataset', 'infrastructure', 'model', 'policy event', 'product',
         'research paper', 'technical report', 'technique', 'training method'}
CLAIMS = {'mixed', 'n-a', 'official', 'peer-reviewed', 'vendor-reported'}
IMPS = {'ALIGNMENT', 'ECOSYSTEM', 'ENABLING', 'FOUNDATIONAL', 'GOVERNANCE', 'PRODUCTIZATION', 'SCALING', 'TRANSFORMATIVE'}
DTYPES = {'announcement', 'arXiv submission', 'conference', 'dataset', 'infrastructure', 'journal', 'model release',
          'product release', 'regulation', 'technical report'}
RELS = {'accelerated', 'complementary development', 'demonstrated feasibility', 'directly built upon', 'enabled',
        'historically adjacent', 'independently contributed', 'influenced', 'popularized', 'provided a foundation for',
        'superseded'}
EVIDENCE = {'documented', 'strong', 'plausible-indirect', 'coincidence', 'retrospective'}

ID_RX = re.compile(r'^[a-z][a-z0-9_]*\d{4}[a-z0-9_]*$')  # build.py finds ids in the scripts with this shape
DATE_RX = {'day': re.compile(r'^\d{4}-\d{2}-\d{2}$'), 'month': re.compile(r'^\d{4}-\d{2}(-\d{2})?$'), 'year': re.compile(r'^\d{4}$')}
TEXT = ['id', 'title', 'short', 'date', 'dprec', 'dtype', 'authors', 'inst', 'type', 'lic', 'src',
        'before', 'problem', 'breakthrough', 'why', 'next', 'inherits', 'claim']  # must be non-empty
FIELDS = set(TEXT) | {'other', 'branches', 'imp', 'tp', 'level', 'phase', 'ord', 'ch', 'lines'}
LEVELS = {'turning-point', 'milestone', 'notable'}  # 'featured' is optional

problems = []
def bad(where, msg):
    problems.append(f'{where}: {msg}')


def load(p, canonical=True):
    try:
        text = p.read_text(encoding='utf-8')
        obj = json.loads(text)
    except Exception as e:
        bad(p.relative_to(DATA.parent).as_posix(), f'not valid JSON ({e})')
        return None
    if canonical and text != dumps_entry(obj):
        bad(p.relative_to(DATA.parent).as_posix(), 'not in the canonical layout; rewrite it with lineage_data.dumps_entry')
    return obj


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield k
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


# ---- threads
threads = []
for p in thread_files():
    t = load(p)
    if t is None:
        continue
    w = f'threads/{p.name}'
    if set(t) != {'id', 'name', 'hex', 'branches'}:
        bad(w, f'fields must be id, name, hex, branches (found {sorted(t)})')
        continue
    if not re.fullmatch(r'\d{2}-' + re.escape(t['id']) + r'\.json', p.name):
        bad(w, f'file name must be NN-{t["id"]}.json')
    if not re.fullmatch(r'#[0-9A-Fa-f]{6}', t['hex']):
        bad(w, f'hex is not a colour: {t["hex"]}')
    threads.append(t)
thread_ids = [t['id'] for t in threads]
if len(set(thread_ids)) != len(thread_ids):
    bad('threads', 'two threads share an id')
branches = {b for t in threads for b in t['branches']}

# ---- milestones
ms = {}
for p in milestone_files():
    n = load(p)
    if n is None:
        continue
    w = f'milestones/{p.name}'
    missing, extra = FIELDS - set(n), set(n) - FIELDS - {'featured'}
    if missing or extra:
        bad(w, f'missing fields {sorted(missing)}' if missing else f'unknown fields {sorted(extra)}')
        continue
    if p.stem != n['id']:
        bad(w, f'file name must match the id "{n["id"]}"')
    if not ID_RX.match(n['id']):
        bad(w, 'id must be lower case with a 4-digit year in it, like gpt3_2020')
    for k in TEXT:
        if not isinstance(n[k], str) or not n[k].strip():
            bad(w, f'"{k}" must be non-empty text')
    if n['dprec'] not in DATE_RX:
        bad(w, f'dprec must be day, month or year (found {n["dprec"]})')
    elif not DATE_RX[n['dprec']].match(n['date']):
        bad(w, f'date "{n["date"]}" does not fit precision "{n["dprec"]}"')
    if not n['src'].startswith('https://'):
        bad(w, 'src must be an https link to the primary source')
    for k, vocab in (('type', TYPES), ('claim', CLAIMS), ('dtype', DTYPES)):
        if n[k] not in vocab:
            bad(w, f'{k} "{n[k]}" is not in the vocabulary (add it to check_data.py on purpose)')
    if not set(n['imp']) <= IMPS:
        bad(w, f'imp values not in the vocabulary: {sorted(set(n["imp"]) - IMPS)}')
    if not isinstance(n['tp'], bool):
        bad(w, 'tp must be true or false')
    if 'featured' in n and n['featured'] is not True:
        bad(w, 'featured is either true or left out')
    if not n['lines'] or len(set(n['lines'])) != len(n['lines']) or not set(n['lines']) <= set(thread_ids):
        bad(w, f'lines must be distinct known thread ids, home thread first (found {n["lines"]})')
    if not set(n['branches']) <= branches:
        bad(w, f'branches not listed by any thread: {sorted(set(n["branches"]) - branches)}')
    if not isinstance(n['phase'], list) or not all(isinstance(x, int) and 1 <= x <= 8 for x in n['phase']):
        bad(w, 'phase must list learning phases from 1 to 8 (an empty list is allowed)')
    if not isinstance(n['ch'], int) or not 1 <= n['ch'] <= 14:
        bad(w, 'ch must be a chapter number from 1 to 14')
    try:  # ord is the date as a day count; a month or year date counts from its first day
        parts = [int(x) for x in n['date'].split('-')] + [1, 1]
        want = datetime.date(*parts[:3]).toordinal()
        if n['ord'] != want:
            bad(w, f'ord must be {want}, the date {n["date"]} as a day count (date.toordinal)')
    except ValueError:
        bad(w, f'date "{n["date"]}" is not a real date')
    ms[n['id']] = n

# ---- relationships
rp = DATA / 'relationships.jsonl'
seen = set()
for i, line in enumerate(rp.read_text(encoding='utf-8').split('\n'), 1):
    if not line.strip():
        continue
    w = f'relationships.jsonl line {i}'
    try:
        r = json.loads(line)
    except Exception as e:
        bad(w, f'not valid JSON ({e})')
        continue
    if line + '\n' != dumps_relationship(r):
        bad(w, 'not in the canonical one-line layout (lineage_data.dumps_relationship)')
    need = {'f', 't', 'rel', 'ev', 'note', 'src'}
    if not need <= set(r) or set(r) - need - {'dateflip'}:
        bad(w, f'fields must be {sorted(need)} plus an optional dateflip (found {sorted(r)})')
        continue
    known_ends = r['f'] in ms and r['t'] in ms
    if not known_ends:
        bad(w, f'unknown milestone: {[x for x in (r["f"], r["t"]) if x not in ms]}')
    if r['f'] == r['t']:
        bad(w, 'a milestone cannot relate to itself')
    if (r['f'], r['t']) in seen:
        bad(w, f'duplicate relationship {r["f"]} -> {r["t"]}')
    seen.add((r['f'], r['t']))
    if r['rel'] not in RELS:
        bad(w, f'rel "{r["rel"]}" is not in the vocabulary')
    if r['ev'] not in EVIDENCE:
        bad(w, f'ev "{r["ev"]}" must be one of {sorted(EVIDENCE)}')
    if not r['note'].strip():
        bad(w, 'every relationship needs a note saying what was taken')
    if not r['src'].startswith('https://'):
        bad(w, 'src must be an https link to the source that documents the relationship')
    if not known_ends:
        continue
    flip = ms[r['f']]['date'] > ms[r['t']]['date']
    if flip and r.get('dateflip') is not True:
        bad(w, f'{r["f"]} is dated after {r["t"]}, so the relationship needs "dateflip": true')
    if not flip and 'dateflip' in r:
        bad(w, '"dateflip" is only for relationships that point from a later milestone to an earlier one')
if not rp.read_text(encoding='utf-8').endswith('\n'):
    bad('relationships.jsonl', 'the file must end with a newline')

# ---- levels: measured from the firm relationships, never set by hand (docs/LEVELS.md)
rels_ok = [json.loads(l) for l in rp.read_text(encoding='utf-8').splitlines() if l.strip()]
rels_ok = [r for r in rels_ok if isinstance(r, dict) and r.get('f') in ms and r.get('t') in ms and 'ev' in r and 'rel' in r]
inf = influence(list(ms.values()), rels_ok)
for i, n in ms.items():
    w = f'milestones/{i}.json'
    if n['level'] not in LEVELS:
        bad(w, f'level must be one of {sorted(LEVELS)}')
        continue
    direct, reach = inf[i]
    want = expected_level(n, direct, reach)
    if n['level'] != want:
        bad(w, f'level is "{n["level"]}" but the relationships make it "{want}" ({direct} direct successors, '
               f'descendants on {reach} threads; turning point needs {TP_DIRECT} and {TP_THREADS}, notable means none '
               f'and dated before {RECENT_FROM}). Update the level, or the relationships if they are wrong.')
    if n['tp'] != (n['level'] == 'turning-point'):
        bad(w, 'tp must be true exactly when level is "turning-point"')

# ---- chapters
cf = chapter_files()
if [p.name for p in cf] != [f'{i:02d}.json' for i in range(1, len(cf) + 1)]:
    bad('chapters', 'files must be numbered 01.json, 02.json, ... with no gaps')
for p in cf:
    c = load(p)
    if c is None:
        continue
    w = f'chapters/{p.name}'
    if c.get('n') != int(p.stem):
        bad(w, f'n must be {int(p.stem)}')
    for k in ('keystones', 'extra', 'stations', 'all'):
        unknown = [x for x in c.get(k, []) if x not in ms]
        if unknown:
            bad(w, f'{k} names unknown milestones: {unknown}')
    for k in ('keystones', 'extra', 'stations'):
        if not set(c.get(k, [])) <= set(c.get('all', [])):
            bad(w, f'every id in {k} must also be in all')
    members = {i for i, n in ms.items() if n['ch'] == c.get('n')}
    if set(c.get('all', [])) != members:
        bad(w, f'"all" must list exactly the milestones whose ch is {c.get("n")}: differs by {sorted(set(c.get("all", [])) ^ members)}')

# ---- glossary terms (data/glossary/<id>.json; the folder is optional until the first term)
TERM_RX = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')
gp = DATA / 'glossary'
term_files = sorted(gp.glob('*.json')) if gp.is_dir() else []
for p in term_files:
    t = load(p)
    if t is None:
        continue
    w = f'glossary/{p.name}'
    need = {'id', 'term', 'definition', 'introduced_by', 'used_by'}
    if set(t) != need:
        bad(w, f'fields must be exactly {sorted(need)} (found {sorted(t)})')
        continue
    if p.stem != t['id'] or not TERM_RX.match(t['id']):
        bad(w, 'the id must be lower case words joined by hyphens, and match the file name')
    for k in ('term', 'definition'):
        if not isinstance(t[k], str) or not t[k].strip():
            bad(w, f'"{k}" must be non-empty text')
    if t['introduced_by'] not in ms:
        bad(w, f'introduced_by names an unknown milestone: {t["introduced_by"]}')
    if not isinstance(t['used_by'], list) or len(set(t['used_by'])) != len(t['used_by']):
        bad(w, 'used_by must be a list of distinct milestone ids')
    else:
        unknown = [x for x in t['used_by'] if x not in ms]
        if unknown:
            bad(w, f'used_by names unknown milestones: {unknown}')
        if t['introduced_by'] in t['used_by']:
            bad(w, 'the introducing milestone goes in introduced_by only, not in used_by')

# ---- paper summaries (data/summaries/<milestone id>.md; format in docs/DATA.md)
SUMMARY_HEADINGS = ['What it changed', 'The problem before it', 'The idea', 'What it showed',
                    'Limits, and what came later', 'What to know first', 'How to read it', 'Links']
FORBIDDEN_START = chr(39) + chr(34) + '[{#&*!|>%@`'  # characters that change a YAML value's meaning
SUMMARY_KEYS, SUMMARY_OPTIONAL = {'milestone', 'source', 'version', 'read', 'reviewed_by'}, {'source_note', 'source_kind'}
REPORTED = {'paper': '**Reported in the paper.**', 'pages': '**Reported by the sources.**'}  # first words of "What it showed"
LINK_RX = re.compile(r'\]\((/[^)]*)\)')
term_ids = {p.stem for p in term_files}
sp = DATA / 'summaries'
summary_files = sorted(sp.glob('*.md')) if sp.is_dir() else []
for p in summary_files:
    w = f'summaries/{p.name}'
    text = p.read_text(encoding='utf-8')
    if p.stem not in ms:
        bad(w, 'the file name must be the id of a milestone')
    parts = text.split('---' + chr(10), 2)
    if len(parts) != 3 or parts[0] != '':
        bad(w, 'must start with a header between two lines of ---')
        continue
    head, body = parts[1], parts[2]
    meta = {}
    for line in head.splitlines():
        k, sep, v = line.partition(': ')
        if not sep or not v.strip() or ': ' in v or v.strip()[0] in FORBIDDEN_START:
            bad(w, f'header line must be "key: plain value" without quotes or a second ": " ({line})')
            continue
        meta[k] = v.strip()
    if set(meta) - SUMMARY_KEYS - SUMMARY_OPTIONAL or SUMMARY_KEYS - set(meta):
        bad(w, f'header fields must be {sorted(SUMMARY_KEYS)}, plus optional source_note and source_kind (found {sorted(meta)})')
    kind = meta.get('source_kind', 'paper')
    if kind not in REPORTED:
        bad(w, f'source_kind must be one of {sorted(REPORTED)} (found {kind})')
        kind = 'paper'
    if meta.get('milestone', p.stem) != p.stem:
        bad(w, 'milestone in the header must match the file name')
    if 'source' in meta and not meta['source'].startswith('https://'):
        bad(w, 'source must be an https link to the text that was read')
    try:
        if 'read' in meta:
            datetime.date.fromisoformat(meta['read'])
    except ValueError:
        bad(w, 'read must be the date the source was read, as YYYY-MM-DD')
    heads = re.findall(r'(?m)^## (.+)$', body)
    if heads != SUMMARY_HEADINGS:
        bad(w, f'sections must be exactly, in order: {SUMMARY_HEADINGS} (found {heads})')
    else:
        sections = re.split(r'(?m)^## .+$', body)[1:]
        for h, sec in zip(SUMMARY_HEADINGS, sections):
            if not sec.strip():
                bad(w, f'section "{h}" is empty')
        if not sections[3].strip().startswith(REPORTED[kind]):
            bad(w, f'"What it showed" must start with {REPORTED[kind]} so every number there is labelled')
    if re.search(r'(?m)^#(?!# )', body) or re.search(r'(?m)^### ', body):
        bad(w, 'use only the eight ## headings')
    for link in LINK_RX.findall(body):
        m1 = re.fullmatch(r'/milestones/([a-z0-9_]+)/', link)
        m2 = re.fullmatch(r'/glossary/([a-z0-9-]+)/', link)
        if not ((m1 and m1[1] in ms) or (m2 and m2[1] in term_ids) or link in ('/levels/', '/tour/')):
            bad(w, f'link to {link} does not point to a milestone, glossary term or page that exists')
    for url in re.findall(r'\]\((http[^)]*)\)', body):
        if not url.startswith('https://'):
            bad(w, f'external links must be https ({url})')
    if chr(0x2014) in text:
        bad(w, 'contains an em dash; rewrite the sentence (en dashes only for number ranges)')

# ---- study notes, phases, tracer
study = load(DATA / 'study.json') or {}
for k, v in study.items():
    if k not in ms:
        bad('study.json', f'notes for unknown milestone {k}')
    elif not isinstance(v, dict) or set(v) != {'understand', 'prereq'}:
        bad('study.json', f'{k} must have exactly "understand" and "prereq"')
phases = load(DATA / 'phases.json') or {}
if list(phases) != [str(i) for i in range(1, 9)]:
    bad('phases.json', 'phases must be "1" to "8" in order')
trace = load(DATA / 'trace.json') or []
for t in trace:
    if t not in ms:
        bad('trace.json', f'unknown milestone {t}')

# ---- writing rule: no em dashes anywhere in the data
for p in sorted(DATA.rglob('*.json*')):
    if '\u2014' in p.read_text(encoding='utf-8'):
        bad(p.relative_to(DATA.parent).as_posix(), 'contains an em dash; rewrite the sentence (en dashes only for number ranges)')

# ---- stray files
known = {DATA / 'relationships.jsonl', DATA / 'study.json', DATA / 'phases.json', DATA / 'trace.json'}
for p in sorted(DATA.rglob('*')):
    if p.is_file() and p not in known and p.parent.name not in ('milestones', 'threads', 'chapters', 'glossary', 'summaries'):
        bad(p.relative_to(DATA.parent).as_posix(), 'unexpected file in data/')

counts = f'{len(ms)} milestones, {len(seen)} relationships, {len(threads)} threads, {len(cf)} chapters, {len(study)} study notes, {len(term_files)} glossary terms, {len(summary_files)} summaries'
if problems:
    print(f'{len(problems)} problem(s) in the data ({counts}):')
    for x in problems:
        print('  - ' + x)
    sys.exit(1)
print(f'data OK: {counts}')
