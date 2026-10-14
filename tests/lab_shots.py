import sys, io
from PIL import Image
from playwright.sync_api import sync_playwright
from harness import wrap, page
name, w, hgt, scheme = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
URL = wrap()
with sync_playwright() as p:
    b = p.chromium.launch(); ctx, pg = page(b, w, hgt, scheme=scheme, motion='reduce')
    pg.goto(URL); pg.wait_for_timeout(1000)
    n = pg.locator('.lab').count(); ims = []
    for i in range(n):
        el = pg.locator('.lab').nth(i); el.scroll_into_view_if_needed(); pg.wait_for_timeout(80)
        ims.append(Image.open(io.BytesIO(el.screenshot())).convert('RGB'))
    ctx.close(); b.close()
sc = .5 if w > 900 else .6
ims = [i.resize((int(i.width * sc), int(i.height * sc))) for i in ims]
cols = 3 if w > 900 else 5
for part in range(0, len(ims), cols * 2):
    chunk = ims[part:part + cols * 2]
    rows = [chunk[r * cols:(r + 1) * cols] for r in range((len(chunk) + cols - 1) // cols)]
    W = max(sum(i.width for i in r) + 8 * (len(r) - 1) for r in rows); H = sum(max(i.height for i in r) for r in rows) + 8 * (len(rows) - 1)
    o = Image.new('RGB', (W, H), (255, 0, 255)); y = 0
    for r in rows:
        x = 0
        for i in r: o.paste(i, (x, y)); x += i.width + 8
        y += max(i.height for i in r) + 8
    o.save(f'shots/labs-{name}-{scheme}-{part // (cols * 2)}.png')
print(len(ims))
