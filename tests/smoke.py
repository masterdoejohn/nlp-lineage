import sys, json
from playwright.sync_api import sync_playwright
from harness import wrap, page, OVERFLOW_JS
URL = wrap()
VPS = [(390, 844, 'phone'), (820, 1180, 'tablet'), (1440, 900, 'desktop')]
res = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, hgt, name in VPS:
        errs = []
        ctx, pg = page(b, w, hgt, errs=errs)
        pg.goto(URL); pg.wait_for_timeout(1500)
        info = pg.evaluate(OVERFLOW_JS)
        info.update(pg.evaluate('''() => ({motion: document.documentElement.classList.contains('motion'),
          scenes: document.querySelectorAll('.stage svg').length, stage: [...document.querySelectorAll('.stage')].slice(0,2).map(s => s.clientWidth + 'x' + s.clientHeight),
          labs: document.querySelectorAll('.lab').length, exps: document.querySelectorAll('.lab:not(.lab-check)').length, count: document.getElementById('lab-count').textContent,
          plates: [...document.querySelectorAll('.plate')].map(p => p.textContent).join(' '), H: document.documentElement.scrollHeight})'''))
        info['errors'] = errs
        res[name] = info
        pg.screenshot(path=f'shots/{name}-top.png')
        ctx.close()
    b.close()
print(json.dumps(res, indent=1))
