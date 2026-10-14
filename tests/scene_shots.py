"""Contact sheets of every scene at chosen timeline times, per viewport. Usage: python3 scene_shots.py phone|desktop|tablet [light|dark] [static]"""
import sys, io
from PIL import Image
from playwright.sync_api import sync_playwright
from harness import wrap, page
VP = {'phone': (390, 844), 'tablet': (820, 1180), 'desktop': (1440, 900)}
name = sys.argv[1]; scheme = sys.argv[2] if len(sys.argv) > 2 else 'light'; static = len(sys.argv) > 3 and sys.argv[3] == 'static'
only = [int(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else list(range(1, 15))
w, hgt = VP[name]
URL = wrap()
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    ctx, pg = page(b, w, hgt, scheme=scheme, motion='reduce' if static else 'no-preference', errs=errs)
    pg.goto(URL); pg.wait_for_timeout(1200)
    pg.add_style_tag(content='.steps{visibility:hidden}')
    for n in only:
        steps = pg.evaluate(f'document.querySelectorAll("#ch-{n} .step").length')
        times = [None] if static else [0.5] + [k + 0.98 for k in range(1, steps)]
        shots = []
        for t in times:
            pg.evaluate(f'document.querySelector("#ch-{n} .step").scrollIntoView({{block: "center"}})'); pg.wait_for_timeout(150)
            if t is not None:
                pg.evaluate(f'__scenes.seek({n}, {t})'); pg.wait_for_timeout(120)
            img = pg.locator(f'#ch-{n} .scene-fig').screenshot()
            shots.append(Image.open(io.BytesIO(img)).convert('RGB'))
        W = sum(s.width for s in shots) + 12 * (len(shots) - 1); H = max(s.height for s in shots)
        sheet = Image.new('RGB', (W, H), (255, 0, 255)); x = 0
        for s in shots: sheet.paste(s, (x, 0)); x += s.width + 12
        tag = f'{name}-{scheme}{"-static" if static else ""}'
        sheet.save(f'shots/scene{n:02d}-{tag}.png')
    print("over:", pg.evaluate("__scenes.SCN.map(r => r.n + \":\" + JSON.stringify(r.over)).join(\" \")"))
    print("errors:", [e for e in errs if "ERR_FAILED" not in e])
    ctx.close(); b.close()
