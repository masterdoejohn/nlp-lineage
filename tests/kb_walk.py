from playwright.sync_api import sync_playwright
from harness import wrap, page
URL = wrap()
with sync_playwright() as p:
    b = p.chromium.launch(); ctx, pg = page(b, 1440, 900)
    pg.goto(URL); pg.wait_for_timeout(1200)
    seq = []
    for i in range(40):
        pg.keyboard.press('Tab'); pg.wait_for_timeout(30)
        seq.append(pg.evaluate('''() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
          return e.tagName + ' ' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 38) + ' | ' + cs.outlineStyle + ' ' + cs.outlineWidth + ' | y=' + Math.round(r.top) + ' visible=' + (r.bottom > 0 && r.top < innerHeight); }'''))
    for s in seq: print(s)
    ctx.close(); b.close()
