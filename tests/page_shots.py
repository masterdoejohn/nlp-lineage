"""Viewport screenshots at key points of the page. Usage: python3 page_shots.py phone|tablet|desktop [light|dark] [reduce]"""
import sys
from playwright.sync_api import sync_playwright
from harness import wrap, page, OVERFLOW_JS
VP = {'phone': (390, 844), 'tablet': (820, 1180), 'desktop': (1440, 900)}
name = sys.argv[1]; scheme = sys.argv[2] if len(sys.argv) > 2 else 'light'; red = len(sys.argv) > 3 and sys.argv[3] == 'reduce'
w, hgt = VP[name]; URL = wrap(); tag = f'{name}-{scheme}{"-rm" if red else ""}'
POS = [('hero', 'window.scrollTo(0,0)'),
       ('route', 'document.getElementById("route").scrollIntoView({block:"start"})'),
       ('ch1-open', 'window.scrollTo(0, document.getElementById("ch-1").getBoundingClientRect().top + scrollY - 40)'),
       ('ch3-step2', 'document.querySelectorAll("#ch-3 .step")[1].scrollIntoView({block:"center"})'),
       ('ch3-after', 'document.querySelector("#ch-3 .after").scrollIntoView({block:"start"})'),
       ('ch3-lab', 'document.querySelector("#ch-3 .lab").scrollIntoView({block:"start"})'),
       ('ch3-tail', 'document.querySelector("#ch-3 .remember").scrollIntoView({block:"center"})'),
       ('ch14-open', 'window.scrollTo(0, document.getElementById("ch-14").getBoundingClientRect().top + scrollY - 40)'),
       ('ch14-layers', 'document.querySelector(".layers").scrollIntoView({block:"start"})'),
       ('network', 'document.getElementById("netmap").scrollIntoView({block:"center"})'),
       ('trace', 'document.getElementById("trace").scrollIntoView({block:"start"})'),
       ('footer', 'document.querySelector("footer").scrollIntoView({block:"start"})')]
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx, pg = page(b, w, hgt, scheme=scheme, motion='reduce' if red else 'no-preference', errs=errs)
    pg.goto(URL); pg.wait_for_timeout(2600)
    pg.screenshot(path=f'shots/pg-{tag}-00hero-anim.png')
    for i, (k, js) in enumerate(POS):
        pg.evaluate(js); pg.wait_for_timeout(900)
        pg.screenshot(path=f'shots/pg-{tag}-{i+1:02d}{k}.png')
    pg.evaluate('document.querySelector("#ch-5 .key .btn-line").click()'); pg.wait_for_timeout(700)
    pg.screenshot(path=f'shots/pg-{tag}-20sheet.png')
    print(pg.evaluate(OVERFLOW_JS))
    print('errors:', [e for e in errs if 'ERR_FAILED' not in e])
    ctx.close(); b.close()
