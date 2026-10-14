// Put the guided tour at /tour/ on the reference site.
// The tour (dist/llm-lineage.html) is a claude.ai artifact page, so it has no document tags of its own. It is wrapped
// in src/host_skeleton.html, the same skeleton the artifact host adds and the tests use (tests/harness.py).
// Build the tour first with `python build.py`; the committed dist/llm-lineage.html is always current (CI checks it).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const skeleton = readFileSync(new URL('src/host_skeleton.html', root), 'utf8');
const page = readFileSync(new URL('dist/llm-lineage.html', root), 'utf8');
mkdirSync(new URL('public/tour/', root), { recursive: true });
writeFileSync(new URL('public/tour/index.html', root), skeleton + page + '\n</body></html>');
console.log('prepare-tour: wrote public/tour/index.html');
