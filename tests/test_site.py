"""Checks for the reference site (site/ -> build/). Build it first: npm run site:build
Usage: python tests/test_site.py      (screenshots of a few pages go to shots/site-*.png)

Part 1 reads every built page as HTML: page count, one h1, unique titles, noindex, internal links, the evidence
rules on milestone pages, and no em dashes. It also checks the site uses the tour's exact relationship wording.
Part 2 opens a few pages in Chromium at phone and desktop widths, in both themes: console errors, horizontal
overflow, text contrast (WCAG AA), and that the tour's chapter links land on a chapter.
"""
import sys, re, json, threading, functools, pathlib
from html.parser import HTMLParser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit
from harness import ROOT, SHOTS, page, OVERFLOW_JS
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
        self.rel_items = []; self._li = None; self.text = []

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == 'html': self.lang = a.get('lang')
        if tag == 'h1': self.h1 += 1
        if tag == 'title': self._t = True
        if tag == 'meta' and 'name' in a: self.meta[a['name']] = a.get('content', '')
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
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
want = len(ms) + len(threads) + len(terms) + 1 + 3 + 1  # home + milestones/threads/glossary indexes + 404
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
no_idx = [rel(p) for p, x in pages.items() if 'noindex' not in x.meta.get('robots', '')]
ok('every page asks not to be indexed (unlisted until launch)', not no_idx, no_idx[:5])
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

dashes = [rel(p) for p, x in pages.items() if '\u2014' in ''.join(x.text)]
dashes += ['/tour/'] if '\u2014' in (BUILD / 'tour' / 'index.html').read_text(encoding='utf-8') else []
ok('no em dashes on any page', not dashes, dashes[:5])


# the site uses the tour's exact wording for relationships and weak evidence
def pairs(text, name):
    m = re.search(r'const ' + name + r'(?:\s*:\s*[^=]+)?\s*=\s*\{(.*?)\};', text, re.S)
    return dict(re.findall(r"'?([\w-]+)'?\s*:\s*'([^']*)'", m.group(1))) if m else None
tour_js = (ROOT / 'src' / 'app_a.js').read_text(encoding='utf-8')
site_ts = (ROOT / 'site' / 'lib' / 'labels.ts').read_text(encoding='utf-8')
for name in ('GROUP_IN', 'GROUP_OUT', 'QUAL'):
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
PAGES = ['/', '/milestones/', f'/milestones/{first_tp}/', '/milestones/transformer2017/', '/threads/', f'/threads/{threads[0]["id"]}/', '/glossary/', '/404.html']

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, hgt, scheme in [(390, 844, 'light'), (390, 844, 'dark'), (1440, 900, 'light'), (1440, 900, 'dark')]:
        T = f'[{w} {scheme}] '
        errs = []
        ctx, pg = page(b, w, hgt, scheme=scheme, errs=errs)
        for path in PAGES:
            pg.goto(BASE + path); pg.wait_for_load_state('networkidle')
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
