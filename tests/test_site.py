"""Checks for the reference site (site/ -> build/). Build it first: npm run site:build
Usage: python tests/test_site.py [--webkit]      (screenshots of a few pages go to shots/site-*.png)

Part 1 reads every built page as HTML: page count, one h1, unique titles, indexing and the sitemap, internal links, the evidence
rules on milestone pages, and no em dashes. It also checks the site uses the tour's exact relationship wording.
Part 2 opens a few pages in Chromium at phone and desktop widths, in both themes: console errors, horizontal
overflow, text contrast (WCAG AA), and that the tour's chapter links land on a chapter.
"""
import sys, re, json, threading, functools, pathlib
from html.parser import HTMLParser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit
from harness import ROOT, SHOTS, page, route, OVERFLOW_JS, launch
sys.path.insert(0, str(ROOT))
from lineage_data import load_milestones, load_relationships, DATA
from playwright.sync_api import sync_playwright

BUILD = ROOT / 'build'
if not (BUILD / 'index.html').exists():
    raise SystemExit('build/ not found: run "npm run site:build" first')

results = []
def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail))

ms = {m['id']: m for m in load_milestones()}
rels = load_relationships()
threads = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((DATA / 'threads').glob('*.json'))]
gdir = DATA / 'glossary'
terms = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(gdir.glob('*.json'))] if gdir.is_dir() else []
WEAK = {'plausible-indirect', 'coincidence', 'retrospective'}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = 0; self.title = ''; self._t = False; self.links = []; self.meta = {}; self.lang = None
        self.rel_items = []; self._li = None; self.text = []; self.canonical = None

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == 'html': self.lang = a.get('lang')
        if tag == 'h1': self.h1 += 1
        if tag == 'title': self._t = True
        if tag == 'meta' and 'name' in a: self.meta[a['name']] = a.get('content', '')
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href')
        if tag == 'li' and 'data-dir' in a:
            self._li = {'dir': a['data-dir'], 'ev': a.get('data-ev'), 'cls': a.get('class') or '', 'text': ''}
            self.rel_items.append(self._li)

    def handle_endtag(self, tag):
        if tag == 'title': self._t = False
        if tag == 'li': self._li = None

    def handle_data(self, d):
        if self._t: self.title += d
        if self._li is not None: self._li['text'] += d
        self.text.append(d)


def parse(p):
    pp = Page(); pp.feed(p.read_text(encoding='utf-8')); return pp


# ---------------- part 1: the built HTML ----------------
pages = {p: parse(p) for p in sorted(BUILD.rglob('*.html')) if 'tour' not in p.relative_to(BUILD).parts}
rel = lambda p: '/' + p.relative_to(BUILD).as_posix()
want = len(ms) + len(threads) + len(terms) + 1 + 3 + 1 + 5  # home + milestones/threads/glossary indexes + 404 + timeline, search, levels, learn, about
ok('page count matches the data', len(pages) == want, f'{len(pages)} pages, expected {want}')
ok('every milestone has a page', all((BUILD / 'milestones' / i / 'index.html').exists() for i in ms))
ok('every thread has a page', all((BUILD / 'threads' / t['id'] / 'index.html').exists() for t in threads))
ok('the tour is at /tour/', (BUILD / 'tour' / 'index.html').exists())

bad_lang = [rel(p) for p, x in pages.items() if x.lang != 'en']
ok('every page declares lang="en"', not bad_lang, bad_lang[:5])
bad_h1 = [(rel(p), x.h1) for p, x in pages.items() if x.h1 != 1]
ok('every page has exactly one h1', not bad_h1, bad_h1[:5])
titles = [x.title for x in pages.values()]
dup = [t for t in set(titles) if titles.count(t) > 1]
ok('page titles are unique', not dup, dup[:5])
# launched (docs/LAUNCH.md): no page asks search engines to stay away, every page names its own address, and the
# sitemap lists every page
SITE = 'https://nlp-lineage.vercel.app'
idx = [rel(p) for p, x in pages.items() if 'noindex' in x.meta.get('robots', '')]
ok('no page asks not to be indexed', not idx, idx[:5])
canon = {rel(p): x.canonical for p, x in pages.items() if rel(p).endswith('/index.html')}
bad_canon = [(k, v) for k, v in canon.items() if v != SITE + k.removesuffix('index.html')]
ok('every page has a canonical link to its own address', not bad_canon, bad_canon[:3])
robots = (BUILD / 'robots.txt').read_text(encoding='utf-8') if (BUILD / 'robots.txt').exists() else ''
ok('robots.txt allows everything and names the sitemap', 'Allow: /' in robots and 'Disallow' not in robots and f'Sitemap: {SITE}/sitemap.xml' in robots, robots)
smap = set(re.findall(r'<loc>([^<]+)</loc>', (BUILD / 'sitemap.xml').read_text(encoding='utf-8'))) if (BUILD / 'sitemap.xml').exists() else set()
want_map = {SITE + k.removesuffix('index.html') for k in canon} | {SITE + '/tour/'}
ok('the sitemap lists every page, and only those', smap == want_map, (sorted(smap - want_map)[:3], sorted(want_map - smap)[:3]))
vj = json.loads((ROOT / 'vercel.json').read_text(encoding='utf-8'))
ok('vercel.json sends no noindex header', 'noindex' not in json.dumps(vj), vj.get('headers'))
no_desc = [rel(p) for p, x in pages.items() if not x.meta.get('description', '').strip()]
ok('every page has a description', not no_desc, no_desc[:5])


def resolves(href):
    path = urlsplit(href).path
    if not path.startswith('/'):
        return True  # external or relative to nothing; external links are not fetched here
    t = BUILD / path.lstrip('/')
    return (t / 'index.html').exists() if path.endswith('/') else t.exists()
broken = sorted({(rel(p), h) for p, x in pages.items() for h in x.links if h.startswith('/') and not resolves(h)})
ok('every internal link resolves', not broken, broken[:8])
no_slash = sorted({h for x in pages.values() for h in x.links if h.startswith('/') and not urlsplit(h).path.endswith('/') and '.' not in urlsplit(h).path.rsplit('/', 1)[-1]})
ok('internal page links end with a slash', not no_slash, no_slash[:5])

# evidence rules on every milestone page
mismatch, unmarked, srcs = [], [], []
for i, m in ms.items():
    x = pages[BUILD / 'milestones' / i / 'index.html']
    n_in = sum(1 for r in rels if r['t'] == i); n_out = sum(1 for r in rels if r['f'] == i)
    got_in = sum(1 for r in x.rel_items if r['dir'] == 'in'); got_out = sum(1 for r in x.rel_items if r['dir'] == 'out')
    if (got_in, got_out) != (n_in, n_out):
        mismatch.append((i, (got_in, got_out), (n_in, n_out)))
    for r in x.rel_items:
        if r['ev'] in WEAK and ('weak' not in r['cls'] or '(' not in r['text']):
            unmarked.append((i, r['text'].strip()[:60]))
    if m['src'] not in x.links:
        srcs.append(i)
ok('milestone pages list every relationship in the data', not mismatch, mismatch[:5])
ok('every weak relationship carries its qualifier in words', not unmarked, unmarked[:5])
ok('every milestone page links its primary source', not srcs, srcs[:5])
weak_total = sum(1 for r in rels if r['ev'] in WEAK)
shown_weak = sum(1 for x in pages.values() for r in x.rel_items if r['ev'] in WEAK)
ok('each weak relationship appears on both of its milestone pages', shown_weak == 2 * weak_total, f'{shown_weak} shown, {2 * weak_total} expected')

# a word glued to a link or number, which happens when a line of a template ends in text and the next starts with a tag
glued = sorted({(rel(p), m.group(0)[-30:]) for p in pages for m in re.finditer(r'[A-Za-z0-9]<(?:a|span)(?=[\s>])[^>]*>(?=[A-Za-z0-9])', p.read_text(encoding='utf-8'))})
ok('no word is glued to the link or number after it', not glued, glued[:5])

# levels: the site's thresholds are the data rule's, every page states its stored level, the levels page lists the turning points
import lineage_data
lab = (ROOT / 'site' / 'lib' / 'labels.ts').read_text(encoding='utf-8')
m_th = re.search(r"TP_DIRECT = (\d+), TP_THREADS = (\d+), RECENT_FROM = '(\d+)'", lab)
ok('site level thresholds match lineage_data.py', m_th and (int(m_th[1]), int(m_th[2]), m_th[3]) == (lineage_data.TP_DIRECT, lineage_data.TP_THREADS, lineage_data.RECENT_FROM), m_th and m_th.groups())
wrong_level = [i for i, m in ms.items() if f'data-level="{m["level"]}"' not in (BUILD / 'milestones' / i / 'index.html').read_text(encoding='utf-8')]
ok('every milestone page states its level from the data', not wrong_level, wrong_level[:5])
lv = (BUILD / 'levels' / 'index.html').read_text(encoding='utf-8')
listed = re.findall(r'class="name" href="/milestones/([a-z0-9_]+)/"', lv)
ok('the levels page lists exactly the turning points', sorted(listed) == sorted(i for i, m in ms.items() if m['level'] == 'turning-point'), len(listed))

# paper summaries: each one is on its milestone's page with its provenance line; every other page says it is in progress
sdir = DATA / 'summaries'
summarised = {q.stem: q.read_text(encoding='utf-8') for q in sorted(sdir.glob('*.md'))} if sdir.is_dir() else {}
missing_sum, wrong_status = [], []
for i in ms:
    html = (BUILD / 'milestones' / i / 'index.html').read_text(encoding='utf-8')
    if i in summarised:
        src = re.search(r'(?m)^source: (.+)$', summarised[i])[1].strip()
        from_pages = re.search(r'(?m)^source_kind: pages$', summarised[i])
        drafted = 'Drafted with Claude from official web pages (there is no paper) on' if from_pages else 'Drafted with Claude from the paper on'
        if 'data-summary' not in html or drafted not in html or f'href="{src}"' not in html:
            missing_sum.append(i)
        if 'Full summary in progress' in html:
            wrong_status.append(i)
    elif 'Full summary in progress' not in html:
        wrong_status.append(i)
ok('every summary is on its milestone page, with its provenance line and source', not missing_sum, missing_sum)
ok('"Full summary in progress" shows exactly where there is no summary', not wrong_status, wrong_status[:5])

# the learning path: every phase, each with all its milestones, and every study note of a milestone in a phase
import html as htmllib
from urllib.parse import parse_qs
phase_names = json.loads((DATA / 'phases.json').read_text(encoding='utf-8'))
study = json.loads((DATA / 'study.json').read_text(encoding='utf-8'))
lp = (BUILD / 'learn' / 'index.html').read_text(encoding='utf-8')
sections = {s.split('"', 1)[0]: s for s in lp.split('id="phase-')[1:]}
ok('the learning path has a section for every phase, in order', list(sections) == list(phase_names), list(sections))
not_listed = [(n, i) for i, m in ms.items() for n in map(str, m['phase']) if f'href="/milestones/{i}/"' not in sections.get(n, '')]
ok('every milestone is listed in each of its phases', not not_listed, not_listed[:5])
no_notes = [i for i, n in study.items() if ms[i]['phase'] and not all(htmllib.escape(u, quote=False) in lp for u in n['understand'])]
ok('every study note of a milestone in a phase is on the learning path', not no_notes, no_notes[:5])

# "Report a problem": every page links to a new GitHub issue that names that page and nothing else
ISSUE = 'https://github.com/masterdoejohn/nlp-lineage/issues/new?'
bad_report = []
for p_, x in pages.items():
    links = [l for l in x.links if l.startswith(ISSUE)]
    if len(links) != 1:
        bad_report.append((rel(p_), 'links', len(links))); continue
    q = parse_qs(urlsplit(links[0]).query)
    want_path = rel(p_).removesuffix('index.html')
    body = q.get('body', [''])[0]
    if set(q) != {'title', 'body'} or not body.startswith('Page: https://nlp-lineage.vercel.app/') or (want_path.endswith('/') and f'Page: https://nlp-lineage.vercel.app{want_path}\n' not in body):
        bad_report.append((rel(p_), q))
ok('every page has one "Report a problem" link, pre-filled with that page only', not bad_report, bad_report[:3])

# the licences: the files, the footer credit and the about page
lic, lic_c = (ROOT / 'LICENSE').read_text(encoding='utf-8'), (ROOT / 'LICENSE-CONTENT.md').read_text(encoding='utf-8')
ok('the code licence is MIT', lic.startswith('MIT License') and 'Copyright (c) 2026 Zeeshan Arif' in lic)
ok('the content licence is CC BY 4.0', 'creativecommons.org/licenses/by/4.0/' in lic_c and 'data/' in lic_c)
no_credit = [rel(p_) for p_, x in pages.items() if 'https://creativecommons.org/licenses/by/4.0/' not in x.links or '/about/' not in x.links]
ok('every page links to the content licence and the about page', not no_credit, no_credit[:5])
ab = (BUILD / 'about' / 'index.html').read_text(encoding='utf-8')
ok('the about page states both licences and how to report a problem', all(k in ab for k in ('CC BY 4.0', 'MIT licence', 'Report a problem', 'no cookies')))
ok('the about page gives the number of summaries', f'<p>{len(summarised)} milestones have full summaries' in ab, len(summarised))

tl = (BUILD / 'timeline' / 'index.html').read_text(encoding='utf-8')
wide, narrow = tl.split('class="tt-narrow', 1)
for label, part in (('table', wide), ('list', narrow)):
    found = re.findall(r'href="/milestones/([a-z0-9_]+)/"', part)
    ok(f'the timeline {label} lists every milestone exactly once', sorted(found) == sorted(ms), (len(found), len(set(found))))
tp_marked = len(re.findall(r'class="tp"', wide))
ok('the timeline marks every turning point', tp_marked == sum(1 for m in ms.values() if m['tp']), tp_marked)
ok('the search index was built', (BUILD / 'pagefind' / 'pagefind.js').exists())

dashes = [rel(p) for p, x in pages.items() if '\u2014' in ''.join(x.text)]
dashes += ['/tour/'] if '\u2014' in (BUILD / 'tour' / 'index.html').read_text(encoding='utf-8') else []
ok('no em dashes on any page', not dashes, dashes[:5])


# the site uses the tour's exact wording for relationships and weak evidence
def pairs(text, name):
    m = re.search(r'const ' + name + r'(?:\s*:\s*[^=]+)?\s*=\s*\{(.*?)\};', text, re.S)
    return dict(re.findall(r"'?([\w-]+)'?\s*:\s*'([^']*)'", m.group(1))) if m else None
tour_js = (ROOT / 'src' / 'app_a.js').read_text(encoding='utf-8')
site_ts = (ROOT / 'site' / 'lib' / 'labels.ts').read_text(encoding='utf-8')
for name in ('GROUP_IN', 'GROUP_OUT', 'QUAL', 'TRACE_VERB'):
    a, b = pairs(tour_js, name), pairs(site_ts, name)
    ok(f'site wording matches the tour: {name}', a and a == b, (a, b))


# ---------------- part 2: in the browser ----------------
CONTRAST_JS = '''() => {
  const lum = c => { const m = c.match(/[\\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const bgOf = e => { for (let p = e; p; p = p.parentElement){ const b = getComputedStyle(p).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; } return 'rgb(255, 255, 255)'; };
  const bad = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walk.nextNode(); n; n = walk.nextNode()){
    const e = n.parentElement; if (!n.textContent.trim() || seen.has(e)) continue; seen.add(e);
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (e.closest('.skip') && e.closest('.skip') !== document.activeElement) continue;  // off-screen until focused
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = size >= 24 || (bold && size >= 18.66);
    const ratio = cr(cs.color, bgOf(e)), need = large ? 3 : 4.5;
    if (ratio < need) bad.push({text: n.textContent.trim().slice(0, 40), ratio: Math.round(ratio * 100) / 100, size, need});
  }
  return bad;
}'''

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass
srv = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(BUILD)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}'
first_tp = next(i for i, m in ms.items() if m['tp'])
PAGES = ['/', '/milestones/', '/milestones/?thread=lm&level=turning-point', '/levels/', f'/milestones/{first_tp}/', '/milestones/transformer2017/', '/timeline/', '/search/?q=attention', '/threads/', f'/threads/{threads[0]["id"]}/', '/glossary/', '/learn/', '/about/', '/404.html']

with sync_playwright() as p:
    b = launch(p)
    for w, hgt, scheme in [(390, 844, 'light'), (390, 844, 'dark'), (1440, 900, 'light'), (1440, 900, 'dark')]:
        T = f'[{w} {scheme}] '
        errs = []
        ctx, pg = page(b, w, hgt, scheme=scheme, errs=errs)
        for path in PAGES:
            pg.goto(BASE + path); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(300 if 'search' in path else 0)
            o = pg.evaluate(OVERFLOW_JS)
            ok(T + f'{path} has no horizontal overflow', o['sw'] <= o['vw'] and not o['wide'], o)
            bad = pg.evaluate(CONTRAST_JS)
            ok(T + f'{path} text contrast meets AA', not bad, bad[:4])
            if path in ('/', f'/milestones/{first_tp}/') and w == 1440:
                pg.screenshot(path=str(SHOTS / f'site-{scheme}-{path.strip("/").replace("/", "-") or "home"}.png'), full_page=True)
            elif path == f'/milestones/{first_tp}/':
                pg.screenshot(path=str(SHOTS / f'site-phone-{scheme}-milestone.png'), full_page=True)
        ok(T + 'no console errors', not [e for e in errs if 'ERR_FAILED' not in e], errs[:4])
        ctx.close()
    # filters on the milestones list, and the address keeping them
    ctx, pg = page(b, 1440, 900)
    pg.goto(BASE + '/milestones/'); pg.wait_for_load_state('networkidle')
    vis = lambda: pg.evaluate('document.querySelectorAll("#list li[data-kind]:not([hidden])").length')
    ok('[filters] the form appears and shows all milestones', pg.is_visible('#filters') and pg.evaluate('document.getElementById("filters-d").open') and vis() == len(ms), vis())
    pg.select_option('select[name=thread]', 'lm')
    want_lm = sum(1 for m in ms.values() if 'lm' in m['lines'])
    ok('[filters] thread filter matches the data', vis() == want_lm, (vis(), want_lm))
    pg.select_option('select[name=kind]', 'model'); pg.select_option('select[name=from]', '2020')
    want_k = sum(1 for m in ms.values() if 'lm' in m['lines'] and m['type'] == 'model' and m['date'][:4] >= '2020')
    ok('[filters] thread, kind and year combine', vis() == want_k, (vis(), want_k))
    ok('[filters] the address keeps the filters', 'thread=lm' in pg.url and 'kind=model' in pg.url and 'from=2020' in pg.url, pg.url)
    pg.click('button[type=reset]'); pg.wait_for_timeout(100)
    ok('[filters] clearing shows every milestone again', vis() == len(ms), vis())
    pg.goto(BASE + '/milestones/?level=turning-point'); pg.wait_for_load_state('networkidle')
    want_c = sum(1 for m in ms.values() if m['level'] == 'turning-point')
    ok('[filters] filters load from the address', vis() == want_c, (vis(), want_c))
    empty_years = pg.evaluate('[...document.querySelectorAll("#list .year-block")].filter(b => !b.hidden && !b.querySelector("li:not([hidden])")).length')
    ok('[filters] years with no matches are hidden', empty_years == 0, empty_years)
    ctx.close()

    # search
    ctx, pg = page(b, 1440, 900)
    pg.goto(BASE + '/search/?q=transformer'); pg.wait_for_selector('#results li', timeout=8000)
    urls = pg.eval_on_selector_all('#results .r-title', 'els => els.map(e => e.getAttribute("href"))')
    ok('[search] finds the Transformer milestone', '/milestones/transformer2017/' in urls, urls[:5])
    n_hits = int(pg.inner_text('#s-status').split()[0])
    ok('[search] reports how many results it found', 'results for "transformer"' in pg.inner_text('#s-status') and pg.locator('#results li').count() == min(n_hits, 20), pg.inner_text('#s-status'))
    ctx.close()

    # before and after: the same lineage as the tour's tracer, for every model the tracer offers
    tctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    sctx = b.new_context(viewport={'width': 1440, 'height': 900})
    tp_, sp_ = tctx.new_page(), sctx.new_page()
    route(tp_)
    tp_.goto(BASE + '/tour/'); tp_.wait_for_timeout(1200)
    trace_ids = json.loads((DATA / 'trace.json').read_text(encoding='utf-8'))
    tour_names = lambda: tp_.eval_on_selector_all('#trace-list .nm', 'els => els.map(e => e.textContent.trim())')
    site_names = lambda: sp_.evaluate("""[...document.querySelectorAll('.lin[data-dir=before] .lin-list li')]
        .filter(li => li.checkVisibility()).map(li => li.querySelector('.nm').textContent.trim())""")
    B4 = '.lin[data-dir=before] '
    for tid in trace_ids:
        short = ms[tid]['short']
        sp_.goto(BASE + f'/milestones/{tid}/'); sp_.wait_for_load_state('networkidle')
        for weak in (False, True):
            if tp_.is_checked('#weak') != weak: tp_.click('#weak')
            tp_.click(f'#picker button:text-is("{short}")'); tp_.wait_for_timeout(150)
            if sp_.locator(B4 + '.lin-weak').count() and sp_.is_checked(B4 + '.lin-weak') != weak: sp_.click(B4 + '.lin-weak')
            if sp_.locator(B4 + '.lin-all').count() and sp_.is_checked(B4 + '.lin-all'): sp_.click(B4 + '.lin-all')
            a, s_ = tour_names(), site_names()
            mode = 'with' if weak else 'without'
            ok(f'[lineage] {short}, {mode} weak links, short list matches the tour', a == s_, (a[:6], s_[:6], len(a), len(s_)))
            if tp_.is_visible('#trace-more'):
                tp_.click('#trace-more'); tp_.wait_for_timeout(150)
                if sp_.locator(B4 + '.lin-all').count(): sp_.click(B4 + '.lin-all')
                a, s_ = tour_names(), site_names()
                ok(f'[lineage] {short}, {mode} weak links, full list matches the tour', a == s_, (len(a), len(s_), [x for x in a if x not in s_][:3], [x for x in s_ if x not in a][:3]))
    tctx.close(); sctx.close()

    # the tour's chapters are built by script, so check the chapter links land on a chapter
    errs = []
    ctx, pg = page(b, 1440, 900, errs=errs)
    pg.goto(BASE + '/tour/#ch-3'); pg.wait_for_timeout(1500)
    ok('[tour] /tour/#ch-3 lands on chapter 3', pg.evaluate('!!document.getElementById("ch-3")'))
    ok('[tour] the tour runs without errors', not [e for e in errs if 'ERR_FAILED' not in e], errs[:4])
    ctx.close()
    b.close()
srv.shutdown()

fails = [r for r in results if not r[1]]
for r in results: print(('PASS ' if r[1] else 'FAIL ') + r[0] + ('' if r[1] else '  -> ' + str(r[2])[:400]))
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)  # a failed check must fail the run, so the automatic checks on a pull request see it
