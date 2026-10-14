"""Checks for the redesigned page: structure, scroll-driven scenes, fallbacks, navigation, contrast, overflow."""
import json
from playwright.sync_api import sync_playwright
from harness import wrap, page, OVERFLOW_JS
URL = wrap()
COPY = json.load(open('src/scene_copy.json', encoding='utf-8'))
results = []
def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail))

CONTRAST_JS = '''() => {
  const lum = c => { const m = c.match(/[\\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const out = [];
  document.querySelectorAll('.opener').forEach(op => {
    const bg = getComputedStyle(op).backgroundColor;
    ['.op-meta', 'h2', '.op-q', '.op-num'].forEach(sel => { const e = op.querySelector(sel); out.push({where: op.parentElement.id + ' ' + sel, ratio: cr(getComputedStyle(e).color, bg), size: parseFloat(getComputedStyle(e).fontSize), bold: +getComputedStyle(e).fontWeight >= 700}); });
  });
  const page = getComputedStyle(document.body).backgroundColor;
  [['.step p', 'step'], ['.key dd', 'key'], ['.scene-note span:last-child', 'note'], ['.also .ln', 'also'], ['.bar-where', 'where'], ['.hm-label', 'hero label'], ['.trace-list .via', 'trace via'], ['footer p', 'footer']].forEach(([sel, n]) => {
    const e = document.querySelector(sel); if (!e) return;
    let bg = page; let p = e; while (p && p !== document.body){ const b = getComputedStyle(p).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)'){ bg = b; break; } p = p.parentElement; }
    const col = getComputedStyle(e).color, fill = getComputedStyle(e).fill;
    out.push({where: n, ratio: cr(e instanceof SVGElement ? fill : col, bg), size: parseFloat(getComputedStyle(e).fontSize), bold: +getComputedStyle(e).fontWeight >= 700});
  });
  return out;
}'''

with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- motion on, three widths, both themes ----------
    for w, hgt, scheme in [(390, 844, 'light'), (820, 1180, 'dark'), (1440, 900, 'light'), (1440, 900, 'dark')]:
        T = f'[{w} {scheme}] '
        errs = []
        ctx, pg = page(b, w, hgt, scheme=scheme, errs=errs)
        pg.goto(URL); pg.wait_for_timeout(1500)
        st = pg.evaluate('''() => ({motion: document.documentElement.classList.contains('motion'),
          chapters: document.querySelectorAll('.chapter').length, openers: document.querySelectorAll('.opener').length,
          svgs: [...document.querySelectorAll('.stage')].map(s => s.querySelectorAll('svg:not(.probe)').length),
          steps: [...document.querySelectorAll('.chapter')].map(c => c.querySelectorAll('.step').length),
          bar: document.querySelectorAll('#bar-route a').length, route: document.querySelectorAll('#route li:not(.ri-split)').length,
          labels: [...document.querySelectorAll('#bar-route a')].every(a => /^Chapter \\d+: /.test(a.getAttribute('aria-label'))),
          heroPaths: document.querySelectorAll('#hero-map svg path').length,
          over: __scenes.SCN.filter(r => r.over && (r.over.l > 2 || r.over.r > 2 || r.over.t > 2 || r.over.b > 6)).map(r => r.n + ':' + JSON.stringify(r.over))})''')
        ok(T + 'motion mode on', st['motion'])
        ok(T + '14 chapters and openers', st['chapters'] == 14 and st['openers'] == 14)
        ok(T + 'every scene drawn once', st['svgs'] == [1] * 14, st['svgs'])
        ok(T + 'steps match the scene copy', st['steps'] == [len(COPY[str(n)]['steps']) for n in range(1, 15)], st['steps'])
        ok(T + 'route strip and index have 14 stops', st['bar'] == 14 and st['route'] == 14)
        ok(T + 'route strip links are labelled', st['labels'])
        ok(T + 'opening diagram drew 10 threads', st['heroPaths'] >= 11, st['heroPaths'])
        ok(T + 'no scene draws outside its stage', not st['over'], st['over'])
        # scrubbing: the chapter 3 timeline follows the scroll
        prog = []
        for k in range(4):
            pg.evaluate(f'document.querySelectorAll("#ch-3 .step")[{k}].scrollIntoView({{block: "center"}})'); pg.wait_for_timeout(900)
            prog.append(pg.evaluate('__scenes.SCN[2].tl.time()'))
        ok(T + 'scene 3 timeline advances with scroll', all(prog[i] < prog[i + 1] for i in range(3)) and prog[-1] > 3, [round(x, 2) for x in prog])
        if w >= 960:
            on = pg.evaluate('[...document.querySelectorAll("#ch-3 .step")].map(li => li.classList.contains("on"))')
            ok(T + 'active step is highlighted', on.count(True) == 1, on)
            pinned = pg.evaluate('(() => { const f = document.querySelector("#ch-3 .scene-fig").getBoundingClientRect(); return Math.round(f.top); })()')
            ok(T + 'figure is pinned below the route strip', 50 <= pinned <= 90, pinned)
        else:
            cov = pg.evaluate('''(() => { const f = document.querySelector("#ch-3 .scene-fig"); const r = f.getBoundingClientRect();
              const x = r.left + r.width / 2, y = r.top + r.height * .6; const e = document.elementFromPoint(x, y); return !!e.closest('.scene-fig'); })()''')
            ok(T + 'step cards pass under the pinned figure', cov)
        # route strip progress
        pg.evaluate('document.querySelectorAll("#ch-5 .step")[1].scrollIntoView({block: "center"})'); pg.wait_for_timeout(500)
        bar = pg.evaluate('''() => ({where: document.getElementById('where').textContent, now: [...document.querySelectorAll('#bar-route a')].findIndex(a => a.classList.contains('now')),
          done: document.querySelectorAll('#bar-route a.done').length, fill: getComputedStyle(document.getElementById('bar-fill')).transform})''')
        ok(T + 'route strip shows stop 5', bar['where'].startswith('5 of 14') and bar['now'] == 4 and bar['done'] == 4, bar)
        try: fx = float(bar['fill'].split('(')[1].split(',')[0])
        except Exception: fx = -1
        ok(T + 'route strip fill sits between stops 5 and 6', 4 / 13 - .01 <= fx <= 5 / 13 + .01, fx)
        # contrast
        cs = pg.evaluate(CONTRAST_JS)
        bad = [c for c in cs if c['ratio'] < (3 if (c['size'] >= 24 or (c['bold'] and c['size'] >= 18.6)) else 4.5)]
        ok(T + 'text contrast meets AA', not bad, [(c['where'], round(c['ratio'], 2), c['size']) for c in bad])
        # network map
        if w >= 960:
            pg.evaluate('document.getElementById("netmap").scrollIntoView({block: "center"})'); pg.wait_for_timeout(600)
            m = pg.evaluate('''() => ({pinned: document.querySelector('.netwrap').classList.contains('motion-map'), spacer: !!document.querySelector('.pin-spacer .netwrap')})''')
            ok(T + 'whole map pins and rides sideways', m['pinned'] and m['spacer'], m)
            st0 = pg.evaluate('document.querySelector("#netmap .map-scroll").scrollLeft')
            pg.mouse.wheel(0, 1500); pg.wait_for_timeout(800)
            st1 = pg.evaluate('document.querySelector("#netmap .map-scroll").scrollLeft')
            ok(T + 'scrolling down moves along the map', st1 > st0 + 300, (st0, st1))
            last = pg.locator('#netmap .st').last; last.focus(); pg.wait_for_timeout(700)
            vis = pg.evaluate('''() => { const g = document.querySelectorAll('#netmap .st'); const r = g[g.length - 1].getBoundingClientRect(); const s = document.querySelector('#netmap .map-scroll').getBoundingClientRect(); return r.left >= s.left - 2 && r.right <= s.right + 2 && r.top >= 0 && r.bottom <= innerHeight; }''')
            ok(T + 'keyboard focus brings a station into view', vis)
            pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
            ok(T + 'Enter on a station opens its card', pg.locator('#sheet').evaluate('d => d.open'))
            pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        # tracer animation
        pg.locator('#picker button').nth(1).click(); pg.wait_for_timeout(100)
        tr = pg.evaluate('''() => ({enter: document.querySelectorAll('#trace-list li.enter').length, items: document.querySelectorAll('#trace-list li').length, sum: document.getElementById('trace-sum').textContent})''')
        ok(T + 'tracer redraws with an entrance', tr['enter'] == tr['items'] and tr['items'] > 3 and 'DeepSeek-R1' in tr['sum'], tr)
        # study card from a keystone
        pg.locator('#ch-6 .key .btn-line').first.click(); pg.wait_for_timeout(250)
        card = pg.evaluate('''() => ({open: document.getElementById('sheet').open, title: document.getElementById('sheet-title').textContent, cells: document.querySelectorAll('.sh-grid > div').length, focus: document.activeElement.id})''')
        ok(T + 'study card opens as a spec sheet', card['open'] and card['cells'] == 6 and card['focus'] == 'close', card)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        ok(T + 'focus returns to the keystone button', pg.evaluate("document.activeElement.classList.contains('btn-line')"))
        # resize rebuilds scenes without errors
        pg.set_viewport_size({'width': 700 if w > 700 else 1100, 'height': hgt}); pg.wait_for_timeout(900)
        ok(T + 'resize redraws every scene', pg.evaluate('[...document.querySelectorAll(".stage")].every(s => s.querySelectorAll("svg:not(.probe)").length === 1)'))
        o = pg.evaluate(OVERFLOW_JS)
        ok(T + 'no horizontal overflow after resize', o['sw'] <= o['vw'] and not o['wide'], o)
        ok(T + 'no console errors', not [e for e in errs if 'ERR_FAILED' not in e], errs)
        ctx.close()

    # ---------- reduced motion: finished pictures, nothing pinned ----------
    for w, hgt in [(390, 844), (1440, 900)]:
        T = f'[{w} reduced] '; errs = []
        ctx, pg = page(b, w, hgt, motion='reduce', errs=errs)
        pg.goto(URL); pg.wait_for_timeout(1200)
        r = pg.evaluate('''() => ({motion: document.documentElement.classList.contains('motion'), spacers: document.querySelectorAll('.pin-spacer').length,
          tl: __scenes.SCN.filter(s => s.tl).length, sticky: getComputedStyle(document.querySelector('.scene-fig')).position,
          hidden: [...document.querySelectorAll('.stage svg *')].filter(e => e.style && e.style.opacity === '0').length,
          dash: [...document.querySelectorAll('.stage svg *')].filter(e => e.style && e.style.strokeDashoffset).length,
          heroInline: [...document.querySelectorAll('#hero-map svg *')].filter(e => e.style && (e.style.opacity || e.style.strokeDashoffset)).length})''')
        ok(T + 'no motion class, no pins, no timelines', not r['motion'] and r['spacers'] == 0 and r['tl'] == 0 and r['sticky'] == 'static', r)
        ok(T + 'scenes show their finished state', r['dash'] == 0 and r['hidden'] <= 8, r)
        ok(T + 'opening diagram is drawn, not animated', r['heroInline'] == 0, r)
        o = pg.evaluate(OVERFLOW_JS); ok(T + 'no horizontal overflow', o['sw'] <= o['vw'] and not o['wide'], o)
        ok(T + 'no console errors', not [e for e in errs if 'ERR_FAILED' not in e], errs)
        ctx.close()

    # ---------- the animation library fails to load ----------
    errs = []
    ctx, pg = page(b, 1440, 900, gsap=False, errs=errs)
    pg.goto(URL); pg.wait_for_timeout(1000)
    r = pg.evaluate('''() => ({motion: document.documentElement.classList.contains('motion'), svgs: document.querySelectorAll('.stage svg').length, labs: document.querySelectorAll('.lab').length, hero: document.querySelectorAll('#hero-map svg path').length})''')
    ok('[no GSAP] page falls back to still scenes', not r['motion'] and r['svgs'] == 14 and r['labs'] == 17 and r['hero'] > 10, r)
    ok('[no GSAP] no script errors', not [e for e in errs if 'ERR_FAILED' not in e and 'Failed to load resource' not in e], errs)
    ctx.close()

    # ---------- explicit theme toggle overrides the system ----------
    ctx, pg = page(b, 1440, 900, scheme='dark')
    pg.goto(URL); pg.wait_for_timeout(600)
    d = pg.evaluate('getComputedStyle(document.body).backgroundColor')
    pg.evaluate('document.documentElement.setAttribute("data-theme", "light")'); pg.wait_for_timeout(100)
    l = pg.evaluate('getComputedStyle(document.body).backgroundColor')
    ok('[theme] data-theme=light beats a dark system', d != l and l == 'rgb(248, 249, 251)', (d, l))
    ctx.close()
    ctx, pg = page(b, 1440, 900, scheme='light')
    pg.goto(URL); pg.wait_for_timeout(600)
    pg.evaluate('document.documentElement.setAttribute("data-theme", "dark")'); pg.wait_for_timeout(100)
    ok('[theme] data-theme=dark beats a light system', pg.evaluate('getComputedStyle(document.body).backgroundColor') == 'rgb(15, 18, 22)')
    # keyboard: skip link first, and it lands on chapter 1
    pg.keyboard.press('Tab')
    ok('[keys] first Tab reaches the skip link', pg.evaluate('document.activeElement.className') == 'skip')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    ok('[keys] skip link goes to chapter 1', pg.evaluate('location.hash') == '#ch-1')
    ctx.close()
    b.close()

fails = [r for r in results if not r[1]]
for r in results: print(('PASS ' if r[1] else 'FAIL ') + r[0] + ('' if r[1] else '  -> ' + str(r[2])[:400]))
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
