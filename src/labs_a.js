// ===================== EXPERIMENTS =====================
// Each experiment follows the same reading order: a question (the title), the simplest
// explanation (intro), a picture, controls, a live explanation, what to notice, what the
// sources say, and the exact technical detail. Every experiment states what kind of
// numbers it uses, so illustrative values are never mistaken for research results.
const KIND = {
  illus: ['Illustrative values', 'The numbers are invented to show how the idea works. They are not results from the papers.'],
  mixed: ['Formula from the paper', 'The formula and its constants come from the paper. The picture around them is simplified.'],
  math: ['Exact arithmetic', 'The calculation is exact. You choose the inputs.'],
  real: ['Real computation', 'This runs a real search over the 200 milestones on this page.'],
  react: ['Scripted, with real lookups', 'The reasoning steps are written in advance. The tool calls are real lookups in this page’s data.'],
  summary: ['Summary', 'A summary of the route, built from the milestones in the chapters above.'],
  check: ['Check yourself', 'One question on this chapter’s main claim. The answer is in the text above.']
};
const RENDERERS = [];
let labN = 0;
function lab(slot, cfg){
  const id = 'lab-' + (++labN);
  const box = h('section', 'lab' + (cfg.kind === 'check' ? ' lab-check' : ''));
  box.id = id; box.setAttribute('aria-labelledby', id + '-h');
  const [tag, kindText] = KIND[cfg.kind];
  const L = {box, id, reset: null};
  const head = h('div', 'lab-head');
  // plate number: chapter.position, as in a technical manual; scene notes refer to experiments this way
  const plate = `${slot.dataset.ch}.${slot.querySelectorAll('.lab').length + 1}`;
  box.dataset.plate = plate;
  head.appendChild(h('div', 'lab-titles', `<span class="plate" aria-hidden="true">${plate}</span><h3 id="${id}-h"><span class="vh">${cfg.kind === 'check' ? 'Check' : 'Experiment'} ${plate}: </span>${esc(cfg.title)}</h3>`));
  if (!cfg.noReset){
    const rb = h('button', 'lab-reset', 'Reset'); rb.type = 'button';
    rb.setAttribute('aria-label', 'Reset this experiment: ' + cfg.title);
    rb.onclick = () => { if (L.reset) L.reset(); };
    head.appendChild(rb);
  }
  box.appendChild(head);
  box.appendChild(h('p', 'lab-kind', `<span class="tag">${tag}</span> <span>${kindText}</span>`));
  if (cfg.intro) box.appendChild(h('p', 'lab-intro', cfg.intro));
  const body = h('div', 'lab-body' + (cfg.side ? ' side' : ''));
  L.controls = h('div', 'lab-controls'); L.fig = h('div', 'lab-fig'); L.out = h('p', 'lab-out');
  L.out.setAttribute('aria-live', 'polite');
  body.append(L.controls, L.fig, L.out); box.appendChild(body);
  L.extra = h('div', 'lab-extra'); box.appendChild(L.extra);
  const notes = h('div', 'lab-notes');
  if (cfg.notice) notes.appendChild(h('div', 'lab-notice', `<h4>What to notice</h4><p>${cfg.notice}</p>`));
  if (cfg.source) notes.appendChild(h('div', 'lab-source', `<h4><span class="tag">Source</span> What the sources say</h4><p>${cfg.source}</p>`));
  if (notes.children.length) box.appendChild(notes);
  if (cfg.tech){ const d = h('details', 'lab-tech'); d.innerHTML = `<summary>The technical detail</summary><div>${cfg.tech}</div>`; box.appendChild(d); }
  slot.appendChild(box);
  return L;
}
function slider(parent, {label, min, max, step = 1, value, fmt = v => v, log = false, onInput}){
  const wrap = h('label', 'ctl');
  const top = h('span', 'ctl-top'); const name = h('span', 'ctl-name', esc(label)); const val = h('span', 'ctl-val');
  top.append(name, val); wrap.appendChild(top);
  const inp = document.createElement('input'); inp.type = 'range';
  if (log){ inp.min = 0; inp.max = 240; inp.step = 1; } else { inp.min = min; inp.max = max; inp.step = step; }
  const toPos = v => log ? Math.round(240 * Math.log(v / min) / Math.log(max / min)) : v;
  const fromPos = p => log ? min * Math.pow(max / min, p / 240) : +p;
  wrap.appendChild(inp); parent.appendChild(wrap);
  let exact = null;
  const api = {get: () => exact != null ? exact : fromPos(+inp.value), set: v => { exact = v; inp.value = toPos(v); show(); }, el: inp};
  function show(){ const t = fmt(api.get()); val.textContent = t; inp.setAttribute('aria-valuetext', t); }
  inp.addEventListener('input', () => { exact = null; show(); onInput && onInput(api.get()); });
  api.set(value);
  return api;
}
function seg(parent, {label, options, value, onChange}){
  const wrap = h('div', 'ctl'); wrap.appendChild(h('span', 'ctl-name', esc(label)));
  const g = h('div', 'seg'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
  let cur = value; const btns = [];
  const api = {get: () => cur, set: v => { cur = v; btns.forEach(([bv, b]) => b.setAttribute('aria-pressed', String(bv === v))); }, wrap};
  options.forEach(([v, t]) => { const b = h('button', '', esc(t)); b.type = 'button'; b.onclick = () => { api.set(v); onChange && onChange(v); }; btns.push([v, b]); g.appendChild(b); });
  wrap.appendChild(g); parent.appendChild(wrap);
  api.set(value); return api;
}
function btn(parent, text, onClick, cls = ''){ const b = h('button', 'lab-btn' + (cls ? ' ' + cls : ''), esc(text)); b.type = 'button'; b.onclick = onClick; parent.appendChild(b); return b; }
function btnRow(parent){ const r = h('div', 'btn-row'); parent.appendChild(r); return r; }
function toggle(parent, label, value, onChange){
  const l = h('label', 'ctl ctl-check'); const i = document.createElement('input'); i.type = 'checkbox'; i.checked = value;
  l.append(i, h('span', '', esc(label))); i.onchange = () => onChange(i.checked); parent.appendChild(l); return i;
}
function svgIn(fig, w, ht, label){ fig.innerHTML = ''; const s = el('svg', {width: w, height: ht, viewBox: `0 0 ${w} ${ht}`, role: 'img', 'aria-label': label}); fig.appendChild(s); return s; }
function tx(svg, x, y, s, a = {}){ const t = el('text', Object.assign({x, y, 'font-family': 'Archivo,Arial,sans-serif', 'font-size': 13.5, fill: 'var(--ink)'}, a), svg); t.textContent = s; return t; }
const figW = (fig, max = 680) => Math.max(260, Math.min(fig.clientWidth || 600, max));
const big = v => { for (const [d, s] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (v >= d){ const x = v / d; return (x < 10 ? x.toFixed(1) : Math.round(x)).toString().replace(/\.0$/, '') + s; } return String(Math.round(v)); };
const pc = v => { const x = v * 100; if (x > 0 && x < 0.1) return '<0.1%'; return (x > 0 && x < 1 ? x.toFixed(2) : x < 10 ? x.toFixed(1) : Math.round(x)).toString().replace(/\.0+$/, '') + '%'; };
const GB = b => { const g = b / 1e9; return (g < 100 ? g.toFixed(1).replace(/\.0$/, '') : Math.round(g).toLocaleString('en-GB')) + ' GB'; };
const SUP = {'-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
const sci = v => { const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); return `${m.toFixed(1)}×10${String(e).split('').map(c => SUP[c]).join('')}`; };
const sum = a => a.reduce((x, y) => x + y, 0);
const softmax = a => { const m = Math.max(...a), e = a.map(x => Math.exp(x - m)), s = sum(e); return e.map(x => x / s); };
function register(fn){ RENDERERS.push(fn); fn(); }
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function arrowDefs(svg, id){
  const defs = el('defs', {}, svg);
  [['a', 'var(--ink)'], ['b', 'var(--lab-b)'], ['m', 'var(--muted)']].forEach(([k, c]) => {
    const m = el('marker', {id: `${id}-${k}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'}, defs);
    el('path', {d: 'M0,0 L10,5 L0,10 z', fill: c}, m);
  });
}
// A one-question check. Options: [text, isRight, explanation].
function quiz(slot, {title, q, options}){
  const L = lab(slot, {title, kind: 'check', noReset: true});
  L.fig.remove();
  L.controls.appendChild(h('p', 'quiz-q', esc(q)));
  const list = h('div', 'quiz-opts'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', q);
  options.forEach(([t, right, why]) => {
    const b = h('button', 'quiz-opt', `<span class="mark" aria-hidden="true"></span><span>${esc(t)}</span>`); b.type = 'button';
    b.onclick = () => {
      list.querySelectorAll('button').forEach(x => { x.classList.remove('picked', 'right', 'wrong'); x.querySelector('.mark').textContent = ''; x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('picked', right ? 'right' : 'wrong'); b.setAttribute('aria-pressed', 'true');
      b.querySelector('.mark').textContent = right ? '✓' : '✗';
      L.out.innerHTML = `<b>${right ? 'Correct.' : 'Not quite.'}</b> ${why}${right ? '' : ' Try another answer.'}`;
    };
    b.setAttribute('aria-pressed', 'false');
    list.appendChild(b);
  });
  L.controls.appendChild(list);
}

// ---------- Chapter 1: counting versus sharing ----------
function labNgram(slot){
  const CORPUS = ['the cat sat on the mat', 'the dog sat on the rug', 'the cat ate the fish', 'the dog ate the bone', 'a cat saw the dog', 'the dog saw a cat', 'a bird sat on the roof', 'the cat sat on the rug'];
  const END = '(end)';
  const CLASS = {cat: 'animal', dog: 'animal', bird: 'animal', mat: 'place', rug: 'place', roof: 'place', fish: 'food', bone: 'food', the: 'article', a: 'article'};
  const CNAME = {animal: 'animals (cat, dog, bird)', place: 'places (mat, rug, roof)', food: 'food (fish, bone)', article: 'articles (the, a)'};
  const bi = {}, starts = {}, seenPair = new Set();
  CORPUS.forEach(s => { const w = s.split(' ').concat(END); starts[w[0]] = (starts[w[0]] || 0) + 1;
    for (let i = 1; i < w.length; i++){ const p = w[i - 1], x = w[i]; (bi[p] ||= {})[x] = (bi[p][x] || 0) + 1; seenPair.add(p + ' ' + x); } });
  const members = c => Object.keys(CLASS).filter(w => CLASS[w] === c);
  function dist(prev, share){
    const pool = share && CLASS[prev] ? members(CLASS[prev]) : [prev];
    const cnt = {}; pool.forEach(p => Object.entries(bi[p] || {}).forEach(([x, k]) => cnt[x] = (cnt[x] || 0) + k));
    return {cnt, tot: sum(Object.values(cnt)), pool};
  }
  function draw(obj){ const e = Object.entries(obj), t = sum(e.map(x => x[1])); let r = Math.random() * t; for (const [k, v] of e){ r -= v; if (r < 0) return k; } return e[e.length - 1][0]; }
  let prev = 'bird', share = false, gen = '';
  const L = lab(slot, {
    title: 'Can counting predict something it has never seen?', kind: 'illus', side: true,
    intro: 'An early language model is a table of counts. To guess the next word, it looks up how often each word followed the previous one in its training text. Pick a previous word and see the guesses. Then let similar words share their counts.',
    notice: 'Choose “bird” and turn sharing on. “bird ate” moves from 0% to 20%. The training text never shows a bird eating. The model borrows that from cats and dogs, because the three words are in one class. Bengio’s 2003 model did the same thing with learned word vectors instead of hand-made classes.',
    source: 'IBM’s class-based n-gram models (Brown et al., 1992) clustered words into classes automatically, so statistics are shared between similar words. Bengio’s neural language model (2003) learned a continuous vector for every word, so that unseen sequences inherit probability from similar ones.',
    tech: '<p>A bigram model estimates P(next | previous) = count(previous, next) ÷ count(previous). Any pair that never appears gets probability 0.</p><p>Brown et al. factor the estimate through word classes: P(wᵢ | wᵢ₋₁) ≈ P(wᵢ | cᵢ) · P(cᵢ | cᵢ₋₁), where c is a word’s class. This demo uses a simpler version: it pools the counts of every word in the previous word’s class. The classes here are written by hand. Brown et al. found theirs automatically from data.</p>'
  });
  const pick = seg(L.controls, {label: 'Previous word', options: ['the', 'cat', 'dog', 'bird', 'sat', 'on'].map(w => [w, w]), value: prev, onChange: v => { prev = v; render(); }});
  const tg = toggle(L.controls, 'Share counts between similar words', share, v => { share = v; render(); });
  const row = btnRow(L.controls);
  btn(row, 'Write a sentence', () => {
    let w = draw(starts); const out = [w];
    while (out.length < 12){ const nx = draw(dist(w, share).cnt); if (nx === END) break; out.push(nx); w = nx; }
    const pairs = out.slice(1).map((x, i) => out[i] + ' ' + x).filter(p => !seenPair.has(p));
    gen = `<b>Generated:</b> “${esc(out.join(' '))}”. ` + (pairs.length
      ? `New word pair${pairs.length > 1 ? 's' : ''}: ${pairs.map(p => `“${esc(p)}”`).join(', ')}. The training text never contains ${pairs.length > 1 ? 'these' : 'this'}. Sharing made ${pairs.length > 1 ? 'them' : 'it'} possible.`
      : 'Every word pair in this sentence appears in the training text.' + (share ? ' Try again: with sharing on, new pairs can appear.' : ' Without sharing, the model can only join pairs it has seen.'));
    render();
  });
  L.extra.appendChild(h('div', 'corpus', `<h4>The training text, 8 sentences</h4><p>${CORPUS.map(s => esc(s)).join(' · ')}</p>`));
  function render(){
    const on = dist(prev, share), all = dist(prev, true);
    const cands = Object.keys(all.cnt).sort((a, b) => all.cnt[b] - all.cnt[a] || a.localeCompare(b));
    const W = figW(L.fig, 560), rowH = 34, lab0 = 74, top = 26, H = top + cands.length * rowH + 8;
    const svg = svgIn(L.fig, W, H, '');
    tx(svg, 0, 16, `Next word after “${prev}”`, {'font-weight': 650});
    const bw = W - lab0 - 130;
    const desc = [];
    cands.forEach((w, i) => {
      const p = on.tot ? (on.cnt[w] || 0) / on.tot : 0, y = top + i * rowH;
      tx(svg, lab0 - 8, y + 21, w, {'text-anchor': 'end', 'font-weight': 600});
      el('rect', {x: lab0, y: y + 7, width: bw, height: 20, fill: 'var(--paper-2)'}, svg);
      if (p > 0) el('rect', {x: lab0, y: y + 7, width: Math.max(2, bw * p), height: 20, fill: 'var(--lab-a)'}, svg);
      tx(svg, lab0 + bw + 8, y + 21, p > 0 ? pc(p) : '0%, never seen', {fill: p > 0 ? 'var(--ink)' : 'var(--lab-b)', 'font-weight': p > 0 ? 500 : 650});
      desc.push(`${w} ${pc(p)}`);
    });
    svg.setAttribute('aria-label', `Bar chart of next-word probabilities after ${prev}: ${desc.join(', ')}.`);
    const zeros = cands.filter(w => !on.cnt[w]).length;
    const zerosNo = cands.filter(w => !dist(prev, false).cnt[w]).length;
    let msg;
    if (!share) msg = `The model saw “${prev}” ${bi[prev] ? sum(Object.values(bi[prev])) : 0} time${sum(Object.values(bi[prev] || {})) === 1 ? '' : 's'}. ` + (zeros ? `${zeros} of these words get 0%, because they never followed “${prev}” in the training text.` : 'Every word shown here followed it at least once.');
    else if (!CLASS[prev]) msg = `“${prev}” has no class in this demo, so sharing changes nothing. Try “bird”.`;
    else msg = `“${prev}” is in the class ${CNAME[CLASS[prev]]}. The model pools the counts of the whole class. ` + (zerosNo ? `${zerosNo} word${zerosNo > 1 ? 's' : ''} that had 0% now get a share.` : 'The proportions change, but no word was at 0% before.');
    if (prev === 'bird') msg += share ? ' “bird ate” now gets ' + pc((on.cnt.ate || 0) / on.tot) + '.' : ' So “bird ate” gets 0%, even though birds eat.';
    L.out.innerHTML = msg + (gen ? '<br>' + gen : '');
  }
  L.reset = () => { prev = 'bird'; share = false; gen = ''; pick.set(prev); tg.checked = false; render(); };
  register(render);
}

// ---------- Chapter 2: arithmetic on word vectors ----------
function labVectors(slot){
  const V = {man: [1, 1], woman: [1.05, 3], boy: [.3, .6], girl: [.35, 2.65], king: [4, 1.2], queen: [4.15, 3.1], prince: [3.2, .8], princess: [3.1, 2.9]};
  const WORDS = Object.keys(V);
  const PRE = [['king', 'man', 'woman'], ['prince', 'boy', 'girl'], ['queen', 'woman', 'man'], ['boy', 'man', 'woman']];
  let A = 'king', B = 'man', C = 'woman', step = 1;
  const L = lab(slot, {
    title: 'Can you do arithmetic with meanings?', kind: 'illus',
    intro: 'word2vec gives every word a position, so that words used in similar ways sit close together. Then a difference between two words becomes a direction you can move along. Step through the famous example, then build your own.',
    notice: 'The arrow from “man” to “woman” and the arrow from “king” to “queen” point the same way. Nobody wrote that rule. It comes from how the words are used in billions of sentences. The match is close, not exact: the result lands near “queen”, and the search picks the nearest word.',
    source: 'word2vec (Mikolov et al., Google, 2013) stripped the model to a shallow objective and trained quality vectors from 1.6 billion words in under a day. The direction from man to woman was roughly the direction from king to queen.',
    tech: '<p>Real word2vec vectors have hundreds of dimensions. This demo uses two hand-placed dimensions so that you can see them. The two axes are labelled for readability; real dimensions have no names.</p><p>The answer to “A − B + C” is the word whose vector is closest to the result. The original evaluation measured closeness with cosine similarity and left out the three input words; this demo uses straight-line distance and also leaves out the input words.</p>'
  });
  const pre = seg(L.controls, {label: 'Examples', options: PRE.map((p, i) => [i, `${p[0]} − ${p[1]} + ${p[2]}`]), value: 0, onChange: i => { [A, B, C] = PRE[i]; step = 1; syncSel(); build(); }});
  const own = h('div', 'ctl'); own.appendChild(h('span', 'ctl-name', 'Or build your own'));
  const selRow = h('div', 'sel-row'); own.appendChild(selRow); L.controls.appendChild(own);
  const sels = [['Start with', () => A, v => A = v], ['subtract', () => B, v => B = v], ['add', () => C, v => C = v]].map(([lbl, get, setv], i) => {
    const l = h('label', 'sel'); l.appendChild(h('span', '', (i ? (i === 1 ? '− ' : '+ ') : '') + lbl));
    const s = document.createElement('select'); WORDS.forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; s.appendChild(o); });
    s.onchange = () => { setv(s.value); pre.set(PRE.findIndex(p => p[0] === A && p[1] === B && p[2] === C)); step = 1; build(); };
    l.appendChild(s); selRow.appendChild(l); return [s, get];
  });
  function syncSel(){ sels.forEach(([s, get]) => s.value = get()); }
  const row = btnRow(L.controls);
  const prevB = btn(row, 'Previous step', () => { if (step > 1){ step--; setStep(); } });
  const nextB = btn(row, 'Next step', () => { if (step < 3){ step++; setStep(); } }, 'primary');
  const stepLbl = h('span', 'step-lbl'); row.appendChild(stepLbl);
  let parts = null;
  const R = () => [V[A][0] - V[B][0] + V[C][0], V[A][1] - V[B][1] + V[C][1]];
  function nearest(){ const r = R(); let best = null, bd = Infinity; WORDS.forEach(w => { if ([A, B, C].includes(w)) return; const d = Math.hypot(V[w][0] - r[0], V[w][1] - r[1]); if (d < bd){ bd = d; best = w; } }); return [best, bd]; }
  function build(){
    const W = figW(L.fig, 600), H = Math.max(300, Math.round(W * .66));
    const ml = 34, mb = 40, mt = 14, mr = 16;
    const X = x => ml + (x + .3) / 5.1 * (W - ml - mr), Y = y => H - mb - y / 3.8 * (H - mb - mt);
    const svg = svgIn(L.fig, W, H, '');
    arrowDefs(svg, L.id);
    el('line', {x1: ml, y1: H - mb, x2: W - mr, y2: H - mb, stroke: 'var(--rule)', 'stroke-width': 1.5}, svg);
    el('line', {x1: ml, y1: H - mb, x2: ml, y2: mt, stroke: 'var(--rule)', 'stroke-width': 1.5}, svg);
    tx(svg, W - mr, H - 12, 'used more like a royal title →', {'text-anchor': 'end', fill: 'var(--muted)'});
    tx(svg, 14, (H - mb) / 2 + 40, 'used more like “she” →', {fill: 'var(--muted)', transform: `rotate(-90 14 ${(H - mb) / 2 + 40})`});
    const [bx, by_] = V[B], [ax, ay] = V[A], [cx, cy] = V[C], [rx, ry] = R();
    const g1 = el('g', {}, svg), g2 = el('g', {class: 'vec-move'}, svg), g3 = el('g', {}, svg);
    el('line', {x1: X(bx), y1: Y(by_), x2: X(ax), y2: Y(ay), stroke: 'var(--lab-b)', 'stroke-width': 3, 'stroke-dasharray': '7 5', 'marker-end': `url(#${L.id}-b)`}, g1);
    el('line', {x1: X(bx), y1: Y(by_), x2: X(ax), y2: Y(ay), stroke: 'var(--lab-b)', 'stroke-width': 3.5, 'marker-end': `url(#${L.id}-b)`}, g2);
    const dx = X(cx) - X(bx), dy = Y(cy) - Y(by_);
    g2.dataset.dx = dx; g2.dataset.dy = dy;
    const [nw] = nearest();
    el('circle', {cx: X(rx), cy: Y(ry), r: 7, fill: 'none', stroke: 'var(--lab-b)', 'stroke-width': 2.5}, g3);
    const ring = el('circle', {cx: X(V[nw][0]), cy: Y(V[nw][1]), r: 14, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '3 3'}, g3);
    const pts = el('g', {}, svg);
    WORDS.forEach(w => {
      const role = w === A ? 'A' : w === B ? 'B' : w === C ? 'C' : '';
      const [x, y] = V[w];
      el('circle', {cx: X(x), cy: Y(y), r: role ? 6.5 : 5, fill: role ? 'var(--ink)' : 'var(--station)', stroke: 'var(--ink)', 'stroke-width': 2}, pts);
      const up = ['woman', 'queen', 'man', 'king'].includes(w);
      tx(pts, X(x), Y(y) + (up ? -12 : 24), w, {'text-anchor': 'middle', 'font-weight': role ? 700 : 500, 'font-size': 14.5});
    });
    parts = {g1, g2, g3, ring, svg};
    L.fig.appendChild(h('p', 'mg-cap', 'Filled dots: the three words in the sum. Dashed red arrow: the difference. Red ring: where the moved arrow ends. Dotted ring: the nearest other word.'));
    setStep();
  }
  function setStep(){
    if (!parts) return;
    const {g1, g2, g3, svg} = parts;
    g1.style.opacity = 1;
    g2.style.transition = reduce ? 'none' : 'transform .8s cubic-bezier(.3,.7,.2,1)';
    g2.style.opacity = step >= 2 ? 1 : 0;
    g2.style.transform = step >= 2 ? `translate(${g2.dataset.dx}px, ${g2.dataset.dy}px)` : 'translate(0px, 0px)';
    g3.style.opacity = step >= 3 ? 1 : 0;
    prevB.disabled = step === 1; nextB.disabled = step === 3;
    stepLbl.textContent = `Step ${step} of 3`;
    const [dxv, dyv] = [V[A][0] - V[B][0], V[A][1] - V[B][1]];
    const dir = Math.abs(dxv) > Math.abs(dyv) ? (dxv > 0 ? 'mostly right, toward “royal title”' : 'mostly left, away from “royal title”') : (dyv > 0 ? 'mostly up, toward “she”' : 'mostly down, away from “she”');
    const [nw, nd] = nearest(), r = R();
    let msg;
    if (A === B) msg = `“${A}” minus itself is an arrow of zero length, so the result is just “${C}”. Choose two different words.`;
    else if (step === 1) msg = `<b>Step 1.</b> The dashed arrow goes from “${B}” to “${A}”. It is ${A} − ${B}, and it points ${dir}.`;
    else if (step === 2) msg = `<b>Step 2.</b> Move the same arrow so that it starts at “${C}”. Its length and direction do not change.`;
    else msg = `<b>Step 3.</b> The arrow ends at (${r[0].toFixed(2)}, ${r[1].toFixed(2)}). The nearest other word is “${nw}”, ${nd.toFixed(2)} away. So ${A} − ${B} + ${C} ≈ ${nw}.` + (nd > .8 ? ' That is not close: this analogy does not hold in this plane.' : '');
    L.out.innerHTML = msg;
    svg.setAttribute('aria-label', `Word positions on two axes. ${A} minus ${B} plus ${C} lands nearest to ${nw}. Showing step ${step} of 3.`);
  }
  L.reset = () => { [A, B, C] = PRE[0]; step = 1; pre.set(0); syncSel(); build(); };
  syncSel();
  register(build);
}

// ---------- Chapter 3: scaled dot-product attention ----------
function labAttention(slot){
  const K = {The: [0, 0, 1], animal: [1, 0, .1], did: [0, 0, .7], not: [0, 0, .7], cross: [.2, .3, .2], the: [0, 0, 1], street: [0, 1, .1], because: [0, 0, .8], it: [.3, .3, .2], was: [0, 0, .9], tired: [.5, 0, .1], wide: [0, .5, .1]};
  let last = 'tired', dk = 64, divide = true, qi = 8;
  const toks = () => ['The', 'animal', 'did', 'not', 'cross', 'the', 'street', 'because', 'it', 'was', last];
  const qv = i => { const w = toks()[i]; if (w === 'it') return last === 'tired' ? [5, .5, -1] : [.5, 5, -1]; return K[w].map(x => x * 2.4); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const L = lab(slot, {
    title: 'Where does a word look?', kind: 'illus',
    intro: 'Attention lets each word gather information from the other words. Each word asks a question (its query). Every word offers a label (its key). A good match gets a large share of attention. Change the last word and watch where “it” looks.',
    notice: 'One change at the end of the sentence moves the attention of “it” from “animal” to “street”. Attention is computed fresh for each sentence, so the same word can link to different words. Next, set dₖ to 256 and turn the division off. Almost all the weight collapses onto one word. Dividing by √dₖ keeps the scores in a range where the weights can still spread.',
    source: 'Bahdanau, Cho and Bengio (2014) let the decoder look back over all encoder states and weight them by relevance at each output step. The Transformer paper (2017) divides the scores by √dₖ. Its reason: for large dₖ the dot products grow large and push the softmax into regions with extremely small gradients.',
    tech: '<p>Attention(Q, K, V) = softmax(QKᵀ ÷ √dₖ) · V. Every word has a query q, a key k and a value v. All three are learned. The softmax turns scores into weights that add up to 100%.</p><p>In this demo the keys and queries are hand-made vectors of 3 numbers, chosen to show the idea. A real model learns them and uses 64 or more numbers per head. The effect of a larger dₖ is simulated: the scores are multiplied by √(dₖ ÷ 3), because the dot product of random vectors grows with their length. These are not weights from a trained model.</p>'
  });
  const lw = seg(L.controls, {label: 'Last word of the sentence', options: [['tired', 'tired'], ['wide', 'wide']], value: last, onChange: v => { last = v; render(); }});
  const dks = seg(L.controls, {label: 'Simulated key size, dₖ', options: [[3, '3'], [16, '16'], [64, '64'], [256, '256']], value: dk, onChange: v => { dk = v; render(); }});
  const dv = toggle(L.controls, 'Divide the scores by √dₖ', divide, v => { divide = v; render(); });
  L.controls.appendChild(h('p', 'ctl-hint', 'Select any word below to make it the query.'));
  function render(){
    const T = toks(), q = qv(qi);
    const s = T.map(w => dot(q, K[w])), raw = s.map(x => x * Math.sqrt(dk / 3)), lg = divide ? raw.map(x => x / Math.sqrt(dk)) : raw, w = softmax(lg);
    L.fig.innerHTML = '';
    const row = h('div', 'attn-row'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Words in the sentence. Select one to make it the query.');
    T.forEach((t, i) => {
      const b = h('button', 'attn-tok' + (i === qi ? ' q' : ''));
      b.type = 'button'; b.setAttribute('aria-pressed', String(i === qi));
      b.setAttribute('aria-label', `${t}: ${pc(w[i])} of the attention${i === qi ? ', current query' : ''}`);
      b.innerHTML = `<span class="bar-box" aria-hidden="true"><span class="bar" style="height:${Math.max(2, w[i] * 64)}px"></span></span><span class="pct" aria-hidden="true">${pc(w[i])}</span><span class="w">${esc(t)}</span>${i === qi ? '<span class="qlbl" aria-hidden="true">query</span>' : ''}`;
      b.onclick = () => { qi = i; render(); L.fig.querySelectorAll('.attn-tok')[i].focus(); };
      row.appendChild(b);
    });
    L.fig.appendChild(row);
    const order = T.map((t, i) => i).sort((a, b) => w[b] - w[a]).slice(0, 4);
    L.extra.innerHTML = `<table class="lab-table"><caption>The four largest weights for “${esc(T[qi])}”</caption><thead><tr><th scope="col">Word</th><th scope="col">Score q·k</th><th scope="col">${divide ? 'After ÷ √dₖ' : 'Not divided'}</th><th scope="col">Weight</th></tr></thead><tbody>` +
      order.map(i => `<tr><th scope="row">${esc(T[i])}</th><td>${raw[i].toFixed(2)}</td><td>${lg[i].toFixed(2)}</td><td>${pc(w[i])}</td></tr>`).join('') + '</tbody></table>';
    const top = order[0];
    let msg = `“${T[qi]}” gives the most attention to “${T[top]}” (${pc(w[top])}).`;
    if (T[qi] === 'it') msg += last === 'tired' ? ' With “tired”, “it” links to the animal. Change the last word to “wide”.' : ' With “wide”, “it” links to the street, because streets are wide, not animals.';
    if (!divide && dk >= 64) msg += ` Without the division the top word takes ${pc(w[top])}, and the others get almost nothing. In training, almost no learning signal would reach them.`;
    else if (divide) msg += ' The division keeps the weights the same at every dₖ.';
    L.out.innerHTML = msg;
  }
  L.reset = () => { last = 'tired'; dk = 64; divide = true; qi = 8; lw.set(last); dks.set(dk); dv.checked = true; render(); };
  render();
}

// ---------- Chapter 4: what each model can see ----------
function labMask(slot){
  const T = ['The', 'cat', 'sat', 'on', 'the', 'mat', '.'];
  let mode = 'gpt', row = 2, masked = 2;
  const L = lab(slot, {
    title: 'Which words can the model see?', kind: 'math',
    intro: 'GPT and BERT both pretrain a Transformer on plain text, but they play different guessing games. GPT guesses the next word, so it may only look back. BERT hides a word and guesses it from both sides. The grid shows which words each word is allowed to see.',
    notice: 'GPT’s grid is a triangle. Every position is trained to guess what comes next, which is exactly how you write text one word at a time. BERT’s grid is full. Each word sees its whole context, which made BERT strong for understanding text, such as search, but it cannot write text left to right.',
    source: 'GPT-1 (OpenAI, June 2018) pretrained a Transformer decoder on plain text with next-token prediction. BERT (Google, October 2018) masked random tokens and predicted them from both directions, so every layer sees full context. The BERT paper masks 15% of the input tokens.',
    tech: '<p>In code, GPT’s triangle is a causal mask. Scores for later positions are set to −∞ before the softmax, so they get a weight of zero. One pass over a sentence trains every position at once, each on its own next word.</p><p>BERT uses no causal mask. It replaces 15% of the input tokens (most with a [MASK] token) and trains the model to recover them. Only the masked positions produce a training signal.</p>'
  });
  const md = seg(L.controls, {label: 'Model', options: [['gpt', 'GPT: guess the next word'], ['bert', 'BERT: fill in the blank']], value: mode, onChange: v => { mode = v; render(); }});
  const hint = h('p', 'ctl-hint'); L.controls.appendChild(hint);
  function render(){
    hint.textContent = mode === 'gpt' ? 'Select a word to see what GPT knows at that point.' : 'Select a word to hide it.';
    L.fig.innerHTML = '';
    const sent = h('div', 'mask-sent'); sent.setAttribute('role', 'group'); sent.setAttribute('aria-label', mode === 'gpt' ? 'Choose how far GPT has read' : 'Choose the word to hide');
    T.forEach((t, i) => {
      const b = h('button', 'mask-tok'); b.type = 'button';
      const sel = mode === 'gpt' ? i === row : i === masked;
      b.setAttribute('aria-pressed', String(sel));
      const hidden = mode === 'gpt' ? i > row : i === masked;
      b.classList.toggle('hid', hidden);
      b.textContent = mode === 'bert' && i === masked ? '[MASK]' : t;
      b.setAttribute('aria-label', mode === 'gpt' ? `${t}: read up to here` : `${t}: hide this word`);
      b.onclick = () => { if (mode === 'gpt') row = i; else masked = i; render(); L.fig.querySelectorAll('.mask-tok')[i].focus(); };
      sent.appendChild(b);
    });
    L.fig.appendChild(sent);
    const grid = h('div', 'mask-grid'); grid.setAttribute('aria-hidden', 'true');
    grid.style.gridTemplateColumns = `auto repeat(${T.length}, minmax(0, 1fr))`;
    grid.appendChild(h('span', 'mg-corner', 'sees →'));
    T.forEach((t, j) => grid.appendChild(h('span', 'mg-col', esc(mode === 'bert' && j === masked ? '[M]' : t))));
    T.forEach((t, i) => {
      const active = mode === 'gpt' && i === row;
      grid.appendChild(h('span', 'mg-row' + (active ? ' on' : ''), esc(mode === 'bert' && i === masked ? '[M]' : t)));
      T.forEach((u, j) => { const see = mode === 'gpt' ? j <= i : true; grid.appendChild(h('span', 'mg-cell' + (see ? ' see' : '') + (active ? ' on' : ''), see ? '' : '·')); });
    });
    L.fig.appendChild(grid);
    L.fig.appendChild(h('p', 'mg-cap', 'Each row is one word. A filled square means that word may use the word in that column.'));
    if (mode === 'gpt'){
      const nxt = T[row + 1] || '(end of text)';
      L.out.innerHTML = `GPT has read “${esc(T.slice(0, row + 1).join(' '))}”. It must guess the next word, “${esc(nxt)}”. It cannot see the ${T.length - row - 1} word${T.length - row - 1 === 1 ? '' : 's'} after this point. Row ${row + 1} of the grid sees words 1 to ${row + 1}.`;
    } else {
      L.out.innerHTML = `BERT sees “${esc(T.map((t, i) => i === masked ? '[MASK]' : t).join(' '))}”. It must recover “${esc(T[masked])}” from the words on both sides. Every word can see every other word, so the grid is full.`;
    }
  }
  L.reset = () => { mode = 'gpt'; row = 2; masked = 2; md.set(mode); render(); };
  render();
}

// ---------- Chapter 5: the scaling law ----------
function labPower(slot){
  const A = 0.076, NC = 8.8e13, LF = n => Math.pow(NC / n, A);
  let N = 1e8, logAx = true;
  const L = lab(slot, {
    title: 'How much does ten times bigger buy?', kind: 'mixed', side: true,
    intro: 'The 2020 scaling-laws paper found that a model’s test loss falls along a smooth curve as it grows. Loss measures how surprised the model is by the next word, so lower is better. Move the slider and compare the two ways of drawing the same law.',
    notice: 'The loss never drops suddenly. Every ten-times increase in parameters lowers it by the same fraction, about 16%. On logarithmic axes that is a straight line, so you can extend the line and predict a bigger model’s loss before you train it. That is how scale became a budget.',
    source: 'Kaplan et al. (OpenAI, 2020) fit L(N) = (N<sub>c</sub> ÷ N)<sup>α</sup> with α ≈ 0.076 and N<sub>c</sub> ≈ 8.8 × 10<sup>13</sup> parameters. The paper reports smooth power laws in parameters, data and compute across seven orders of magnitude.',
    tech: '<p>This curve is the fit for parameters alone. It assumes the model has enough data and is trained until it stops improving. N counts parameters excluding the embedding layer.</p><p>The loss is cross-entropy in nats per token on the paper’s own test data, so the values cannot be compared with other papers. Similar laws hold for dataset size and for compute, each with its own exponent.</p>'
  });
  const ns = slider(L.controls, {label: 'Parameters', min: 1e6, max: 1e12, log: true, value: N, fmt: v => big(v), onInput: v => { N = v; render(); }});
  const ax = seg(L.controls, {label: 'Axes', options: [[true, 'Logarithmic'], [false, 'Ordinary']], value: logAx, onChange: v => { logAx = v; render(); }});
  function render(){
    const W = figW(L.fig, 560), H = Math.min(380, Math.max(260, Math.round(W * .66)));
    const ml = 46, mr = 14, mt = 14, mb = 44, pw = W - ml - mr, ph = H - mt - mb;
    const svg = svgIn(L.fig, W, H, '');
    const xs = logAx ? (n => ml + (Math.log10(n) - 6) / 6 * pw) : (n => ml + n / 1e12 * pw);
    const ylo = logAx ? Math.log10(1.3) : 0, yhi = logAx ? Math.log10(4.4) : 4.5;
    const ys = l => mt + ph - ((logAx ? Math.log10(l) : l) - ylo) / (yhi - ylo) * ph;
    (logAx ? [1e6, 1e8, 1e10, 1e12] : [0, 2.5e11, 5e11, 7.5e11, 1e12]).forEach(v => { const x = xs(Math.max(v, logAx ? v : 0)); el('line', {x1: x, x2: x, y1: mt, y2: mt + ph, stroke: 'var(--rule)'}, svg); tx(svg, x, H - 24, v === 0 ? '0' : big(v), {'text-anchor': 'middle', fill: 'var(--muted)', 'font-size': 13}); });
    (logAx ? [1.5, 2, 3, 4] : [0, 1, 2, 3, 4]).forEach(v => { const y = ys(v); el('line', {x1: ml, x2: ml + pw, y1: y, y2: y, stroke: 'var(--rule)'}, svg); tx(svg, ml - 6, y + 4, String(v), {'text-anchor': 'end', fill: 'var(--muted)', 'font-size': 13}); });
    tx(svg, ml + pw, H - 6, logAx ? 'parameters (each step is ×100)' : 'parameters', {'text-anchor': 'end', fill: 'var(--muted)', 'font-size': 13});
    tx(svg, ml, mt + 2, 'loss', {fill: 'var(--muted)', 'font-size': 13, dy: 10, dx: 6});
    let d = '';
    for (let i = 0; i <= 240; i++){ const n = Math.pow(10, 6 + 6 * i / 240); d += (i ? 'L' : 'M') + xs(n).toFixed(1) + ',' + ys(LF(n)).toFixed(1); }
    el('path', {d, fill: 'none', stroke: 'var(--lab-a)', 'stroke-width': 3}, svg);
    const px = xs(N), py = ys(LF(N));
    el('line', {x1: px, x2: px, y1: py, y2: mt + ph, stroke: 'var(--ink)', 'stroke-dasharray': '4 4'}, svg);
    el('line', {x1: ml, x2: px, y1: py, y2: py, stroke: 'var(--ink)', 'stroke-dasharray': '4 4'}, svg);
    el('circle', {cx: px, cy: py, r: 7, fill: 'var(--lab-b)', stroke: 'var(--station)', 'stroke-width': 2}, svg);
    tx(svg, Math.min(px + 10, W - 70), py - 10, `loss ${LF(N).toFixed(2)}`, {'font-weight': 700});
    const l1 = LF(N), l2 = LF(N * 10);
    svg.setAttribute('aria-label', `Loss against parameters on ${logAx ? 'logarithmic' : 'ordinary'} axes. At ${big(N)} parameters the fitted loss is ${l1.toFixed(2)}.`);
    L.out.innerHTML = `At ${big(N)} parameters the fitted loss is ${l1.toFixed(2)}. Ten times more, ${big(N * 10)}, gives ${l2.toFixed(2)}: ${pc(1 - l2 / l1)} lower. ` +
      (logAx ? 'On logarithmic axes the law is a straight line.' : 'On ordinary axes the same law is a curve that flattens, and most of it is squeezed against the left edge.');
  }
  L.reset = () => { N = 1e8; logAx = true; ns.set(N); ax.set(true); render(); };
  register(render);
}

// ---------- Chapter 5: the compute budget ----------
function labBudget(slot){
  const PRE = [['chin', 'Chinchilla', 70e9, 1.4e12], ['gopher', 'Gopher', 280e9, 300e9], ['llama', 'Llama 3 8B', 8e9, 15e12]];
  let C = 6 * 70e9 * 1.4e12, r = 20;
  const L = lab(slot, {
    title: 'Bigger model, or more data?', kind: 'mixed', side: true,
    intro: 'Training cost depends on two things: the number of parameters and the number of training tokens. For a fixed budget you can have a big model with little data or a small model with lots of data. Choose a budget, then choose how to split it.',
    notice: 'Every point on the yellow line costs the same. Gopher sits far to the right: a big model for its data. Chinchilla spent about the same compute on a quarter of the parameters and almost five times the data, and it won. Llama 3 8B goes far the other way on purpose: a small model trained on far more data is cheaper to run afterwards.',
    source: 'Chinchilla (DeepMind, 2022) used over 400 training runs to show that parameters and data should scale together, roughly 20 tokens per parameter. Its 70B model, trained on 1.4 trillion tokens, beat the 280B Gopher, which was trained on 300 billion tokens. Llama 3 trained its 8B and 70B models on fifteen trillion tokens, far past the compute-optimal point.',
    tech: '<p>Training compute is about C ≈ 6ND floating-point operations, where N is parameters and D is tokens: roughly 2 operations per parameter per token for the forward pass and 4 for the backward pass.</p><p>Given C and a ratio r = D ÷ N, the split is N = √(C ÷ 6r) and D = rN. The 20-to-1 ratio is a rule of thumb from the Chinchilla fits. The exact optimum depends on the data and the architecture.</p>'
  });
  const pre = seg(L.controls, {label: 'Real models', options: PRE.map(p => [p[0], p[1]]), value: 'chin', onChange: k => { const p = PRE.find(x => x[0] === k); C = 6 * p[2] * p[3]; r = p[3] / p[2]; cs.set(C); rs.set(r); render(); }});
  const cs = slider(L.controls, {label: 'Compute budget', min: 1e21, max: 1e26, log: true, value: C, fmt: v => sci(v) + ' FLOPs', onInput: v => { C = v; pre.set(null); render(); }});
  const rs = slider(L.controls, {label: 'Tokens per parameter', min: .5, max: 2500, log: true, value: r, fmt: v => v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-GB'), onInput: v => { r = v; pre.set(null); render(); }});
  function render(){
    const N = Math.sqrt(C / (6 * r)), D = r * N;
    const W = figW(L.fig, 560), H = Math.min(400, Math.max(280, Math.round(W * .72)));
    const ml = 52, mr = 12, mt = 30, mb = 46, pw = W - ml - mr, ph = H - mt - mb;
    const X = n => ml + (Math.log10(n) - 8) / 5 * pw, Y = d => mt + ph - (Math.log10(d) - 9) / 5 * ph;
    const svg = svgIn(L.fig, W, H, '');
    const cp = el('clipPath', {id: L.id + '-clip'}, el('defs', {}, svg)); el('rect', {x: ml, y: mt, width: pw, height: ph}, cp);
    [1e8, 1e9, 1e10, 1e11, 1e12, 1e13].forEach(v => { el('line', {x1: X(v), x2: X(v), y1: mt, y2: mt + ph, stroke: 'var(--rule)'}, svg); tx(svg, X(v), H - 26, big(v), {'text-anchor': 'middle', fill: 'var(--muted)', 'font-size': 13}); });
    [1e9, 1e10, 1e11, 1e12, 1e13, 1e14].forEach(v => { el('line', {x1: ml, x2: ml + pw, y1: Y(v), y2: Y(v), stroke: 'var(--rule)'}, svg); tx(svg, ml - 6, Y(v) + 4, big(v), {'text-anchor': 'end', fill: 'var(--muted)', 'font-size': 13}); });
    tx(svg, ml + pw, H - 6, 'parameters, N', {'text-anchor': 'end', fill: 'var(--muted)', 'font-size': 13});
    tx(svg, 0, 14, 'training tokens, D', {fill: 'var(--muted)', 'font-size': 13});
    const g = el('g', {'clip-path': `url(#${L.id}-clip)`}, svg);
    el('line', {x1: X(1e8), y1: Y(20e8), x2: X(1e13), y2: Y(20e13), stroke: 'var(--lab-a)', 'stroke-width': 2.5, 'stroke-dasharray': '8 6'}, g);
    el('line', {x1: X(1e8), y1: Y(C / 6e8), x2: X(1e13), y2: Y(C / 6e13), stroke: 'var(--lab-c)', 'stroke-width': 4}, g);
    PRE.forEach(([k, name, n, d]) => { el('circle', {cx: X(n), cy: Y(d), r: 5, fill: 'var(--station)', stroke: 'var(--ink)', 'stroke-width': 2}, g); tx(g, X(n) + 8, Y(d) - 9, name, {'font-size': 13, 'font-weight': 650, stroke: 'var(--card)', 'stroke-width': 4, 'paint-order': 'stroke'}); });
    el('circle', {cx: X(N), cy: Y(D), r: 8, fill: 'var(--lab-b)', stroke: 'var(--station)', 'stroke-width': 2}, g);
    L.fig.appendChild(h('div', 'chart-key', '<span><i class="k-solid"></i>Same compute: every point on this line costs your budget</span><span><i class="k-dash"></i>20 tokens per parameter</span><span><i class="k-dot"></i>Your choice</span>'));
    svg.setAttribute('aria-label', `Log-log plot of parameters against training tokens. Your choice: ${big(N)} parameters and ${big(D)} tokens. Reference points: Chinchilla 70B and 1.4T, Gopher 280B and 300B, Llama 3 8B and 15T.`);
    let regime;
    if (r < 8) regime = 'That is far fewer tokens than about 20 per parameter. The model is large for its data, like Gopher. Chinchilla showed a smaller model trained on more data does better for the same compute.';
    else if (r <= 50) regime = 'That is close to the rule of about 20 tokens per parameter, so this split is roughly compute-optimal.';
    else regime = 'That is far past the compute-optimal ratio, like Llama 3 8B. You get a smaller model that is cheaper to run, at some cost in loss against the compute-optimal size.';
    L.out.innerHTML = `${sci(C)} FLOPs at ${r < 10 ? r.toFixed(1) : Math.round(r).toLocaleString('en-GB')} tokens per parameter gives a model of <b>${big(N)} parameters</b> trained on <b>${big(D)} tokens</b>. ${regime}`;
  }
  L.reset = () => { C = 6 * 70e9 * 1.4e12; r = 20; pre.set('chin'); cs.set(C); rs.set(r); render(); };
  register(render);
}
