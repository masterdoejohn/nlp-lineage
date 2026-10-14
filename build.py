"""Assemble the single-file page.

src/shell.html + src/style.css + the data files (via lineage_data.py) + src/scene_copy.json + the scripts in src/
-> one HTML file. Run check_data.py first to check the data against the evidence rules.
Usage: python build.py [output_path]      (default: dist/llm-lineage.html)
Needs Python 3.9+ and Node (for a syntax check of the inlined script).
"""
import json, re, subprocess, sys, pathlib
from lineage_data import load_payload

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'llm-lineage.html'
read = lambda p: p.read_text(encoding='utf-8')

P = load_payload()
shell = read(SRC / 'shell.html')
css = read(SRC / 'style.css')
# order matters: scene_builders defines SCENES, which app_a uses to build the chapters; the labs mount into
# slots app_a creates; app_b runs last and brings everything to life
parts = ['scene_builders.js', 'app_a.js', 'labs_a.js', 'labs_b.js', 'app_b.js']
copy = json.loads(read(SRC / 'scene_copy.json'))
js = 'const SCENE_COPY = ' + json.dumps(copy, ensure_ascii=False) + ';\n' + '\n'.join(read(SRC / p) for p in parts)
assert shell.count('/*__CSS__*/') == 1 and shell.count('/*__JS__*/') == 1 and js.count('__PAYLOAD__') == 1

# every milestone id quoted in the scripts must exist in the data
ids = {n['id'] for n in P['nodes']}
quoted = set(re.findall(r"'([a-z][a-z0-9_]*\d{4}[a-z0-9_]*)'", js))
missing = sorted(q for q in quoted if q not in ids)
if missing:
    print('WARNING: ids referenced in scripts but absent from data:', missing)

payload = json.dumps(P, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
js = js.replace('__PAYLOAD__', payload)
assert '</script' not in js.replace('<\\/', '')

chk = ROOT / '_check.js'
chk.write_text(js, encoding='utf-8')
try:
    r = subprocess.run(['node', '--check', str(chk)], capture_output=True, text=True, encoding='utf-8')
except FileNotFoundError:
    r = None
    print('WARNING: node not found, so the script was not syntax-checked')
finally:
    chk.unlink(missing_ok=True)
if r is not None and r.returncode:
    print(r.stderr); sys.exit(1)

html = shell.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
if '—' in html:
    print('WARNING: an em dash found its way into the page')
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding='utf-8', newline='\n')
print(f'wrote {OUT} ({len(html.encode("utf-8")):,} bytes)')
