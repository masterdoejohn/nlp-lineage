"""Shared test harness.

Wraps the built page in the same skeleton the claude.ai artifact host adds (doctype, charset, viewport, small reset)
and opens it in Playwright's Chromium.

GSAP: served from a local copy when one is found (node_modules/gsap/dist after `npm install`, or the folder named
in the GSAP_DIR environment variable); otherwise the page loads it from cdnjs as it does when published.
Fonts: loaded from Google Fonts unless BLOCK_FONTS=1, which reproduces the original test conditions
(the first test runs could not reach Google Fonts, so every baseline screenshot used fallback fonts).
"""
import os, sys, pathlib

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SHOTS = ROOT / 'shots'
SHOTS.mkdir(exist_ok=True)
os.chdir(ROOT)  # scripts write screenshots to shots/ and read src/ relative to the project root

def _gsap_dir():
    for d in [os.environ.get('GSAP_DIR'), ROOT / 'node_modules' / 'gsap' / 'dist']:
        if d and (pathlib.Path(d) / 'gsap.min.js').exists():
            return pathlib.Path(d)
    return None
VENDOR = _gsap_dir()
BLOCK_FONTS = os.environ.get('BLOCK_FONTS') == '1'

SKELETON = '''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
'''

def wrap(src=ROOT / 'dist' / 'llm-lineage.html', dst=HERE / 'test.html'):
    """Write the page inside the artifact skeleton and return its file URL. Build first: python build.py"""
    src = pathlib.Path(src)
    if not src.exists():
        raise SystemExit(f'{src} not found: run "python build.py" first')
    dst.write_text(SKELETON + src.read_text(encoding='utf-8') + '\n</body></html>', encoding='utf-8')
    return dst.resolve().as_uri()

def route(pg, gsap=True):
    if BLOCK_FONTS:
        pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    def cdn(r):
        if not gsap:
            return r.abort()  # simulates the animation library failing to load
        name = r.request.url.rsplit('/', 1)[-1]
        if VENDOR and (VENDOR / name).exists():
            return r.fulfill(path=str(VENDOR / name), content_type='application/javascript')
        return r.continue_()
    pg.route('**/cdnjs.cloudflare.com/**', cdn)

def page(b, w, hgt, scheme='light', motion='no-preference', gsap=True, errs=None):
    ctx = b.new_context(viewport={'width': w, 'height': hgt}, device_scale_factor=1, has_touch=(w < 900), color_scheme=scheme, reduced_motion=motion)
    pg = ctx.new_page()
    if errs is not None:
        pg.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    route(pg, gsap)
    return ctx, pg

OVERFLOW_JS = '''() => {
  const vw = document.documentElement.clientWidth; const wide = [];
  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > vw + 1 || r.left < -1)) {
    let p = e.parentElement, inScroll = false; while (p){ const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) { inScroll = true; break; } p = p.parentElement; }
    if (!inScroll) wide.push(e.tagName + '.' + (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) + ' r=' + Math.round(r.right)); } });
  return {vw, sw: document.documentElement.scrollWidth, wide: wide.slice(0, 12)};
}'''
