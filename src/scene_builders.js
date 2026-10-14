// ===================== SCENES =====================
// Each chapter has one scene: a diagram pinned beside 3-4 steps of text. Builders draw the FINAL state of
// the diagram; when motion is on they also add tweens to a scroll-scrubbed timeline in which step k occupies
// time [k, k+1). Step 0 is the resting picture, so a scene is never blank when it first appears.
// The words of each scene (label, note, steps) live in SCENE_COPY, above.

// ---------- drawing helpers ----------
function sG(p, a = {}){ return el('g', a, p); }
// Text: colour, size and weight go in the style attribute, because the scene classes set them in CSS and CSS
// beats SVG presentation attributes.
function sT(p, x, y, s, cls = 'sv', a = {}){
  const b = Object.assign({}, a), st = [];
  ['fill', 'font-size', 'font-weight'].forEach(k => { if (k in b){ st.push(`${k}:${b[k]}${k === 'font-size' && typeof b[k] === 'number' ? 'px' : ''}`); delete b[k]; } });
  const t = el('text', Object.assign({x, y, class: cls}, b), p);
  if (st.length) t.setAttribute('style', st.join(';'));
  t.textContent = s; return t;
}
function sR(p, x, y, w, hh, a = {}){ return el('rect', Object.assign({x, y, width: Math.max(0, w), height: Math.max(0, hh)}, a), p); }
function sC(p, cx, cy, r, a = {}){ return el('circle', Object.assign({cx, cy, r}, a), p); }
function sL(p, x1, y1, x2, y2, a = {}){ return el('line', Object.assign({x1, y1, x2, y2}, a), p); }
function sP(p, d, a = {}){ return el('path', Object.assign({d}, a), p); }
const INK = 'var(--ink)', INK2 = 'var(--ink-2)', MUTED = 'var(--muted)', RULE = 'var(--rule)', RULE2 = 'var(--rule-2)', PAPER = 'var(--paper)', PANEL = 'var(--panel)';
const LC = k => `var(--c-${k})`;
const textW = t => { try { return t.getComputedTextLength(); } catch (e){ return (t.textContent || '').length * 7; } };
const fontPx = t => parseFloat(getComputedStyle(t).fontSize) || 14;
// shrink a text until it fits a width
function fitW(t, maxW, min = 10){ const w0 = textW(t); if (w0 > maxW && w0 > 0) t.style.fontSize = Math.max(min, fontPx(t) * maxW / w0) + 'px'; return t; }
// measure a string without leaving it in the drawing
function measure(p, s, cls, a = {}){ const t = sT(p, 0, 0, s, cls, a), w0 = textW(t); t.remove(); return w0; }
// wrap a string into lines no wider than maxW; returns the text element with .lines and .lh set
function wrapT(p, x, y, s, maxW, cls = 'sv', a = {}, lh = 1.25){
  const t = sT(p, x, y, '', cls, a), size = fontPx(t);
  let n = 0, line = '', cur = null;
  const add = str => { const ts = el('tspan', {x, dy: n ? size * lh : 0}, t); ts.textContent = str; n++; return ts; };
  cur = add('');
  s.split(' ').forEach(wd => { const trial = line ? line + ' ' + wd : wd; cur.textContent = trial;
    if (textW(cur) > maxW && line){ cur.textContent = line; cur = add(wd); line = wd; } else line = trial; });
  t.lines = n; t.lh = size * lh; return t;
}
function arrowHead(svg, id){
  const defs = el('defs', {}, svg);
  [['i', INK], ['m', MUTED], ['r', 'var(--c-align)']].forEach(([k, c]) => {
    const m = el('marker', {id: `${id}-${k}`, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'}, defs);
    el('path', {d: 'M0,0 L10,5 L0,10 z', fill: c}, m);
  });
  return k => `url(#${id}-${k})`;
}
// motion helpers; every one is a no-op (or applies the final state) when there is no timeline
const has = t => !!t && (t.length === undefined || t.length > 0 || t instanceof Element);
function MX(tl){
  return {
    tl,
    in(t, at, v = {}){ if (tl && has(t)) tl.from(t, Object.assign({opacity: 0, duration: .45}, v), at); },
    rise(t, at, dy = 12, v = {}){ if (tl && has(t)) tl.from(t, Object.assign({opacity: 0, y: dy, duration: .55, ease: 'expo.out'}, v), at); },
    pop(t, at, v = {}){ if (tl && has(t)) tl.from(t, Object.assign({opacity: 0, scale: .4, transformOrigin: '50% 50%', duration: .5, ease: 'expo.out'}, v), at); },
    // draw a stroke along its length; dashed strokes fade in instead, and arrowheads wait for the stroke
    draw(t, at, dur = .7){
      if (!has(t) || !tl) return;
      const arr = [].concat(t), solid = arr.filter(p => !p.getAttribute('stroke-dasharray')), dashed = arr.filter(p => p.getAttribute('stroke-dasharray'));
      solid.forEach(p => p.setAttribute('pathLength', '1'));
      if (solid.length) tl.fromTo(solid, {strokeDasharray: '1 1', strokeDashoffset: 1}, {strokeDashoffset: 0, duration: dur, ease: 'none', stagger: solid.length > 1 ? Math.min(.08, .5 / solid.length) : 0}, at);
      if (dashed.length) tl.from(dashed, {opacity: 0, duration: dur * .6}, at);
      arr.forEach((p, i) => { const m = p.getAttribute('marker-end'); if (!m) return;
        tl.set(p, {attr: {'marker-end': 'none'}}, 0);
        tl.set(p, {attr: {'marker-end': m}}, at + dur * .92 + (solid.length > 1 ? i * Math.min(.08, .5 / solid.length) : 0)); });
    },
    out(t, at, to = 0, v = {}){ if (!has(t)) return; if (tl) tl.to(t, Object.assign({opacity: to, duration: .45}, v), at); else [].concat(t).forEach(e => e.style.opacity = to); },
    from(t, at, vars){ if (tl && has(t)) tl.from(t, Object.assign({duration: .6, ease: 'expo.out'}, vars), at); },
    tick(at, dur, fn){ if (tl){ const o = {p: 0}; fn(0); tl.to(o, {p: 1, duration: dur, ease: 'none', onUpdate: () => fn(o.p)}, at); } else fn(1); }
  };
}
// two regions, stacked when the stage is portrait, side by side when it is landscape
function regions(w, h, f = .5, gap = 18){
  const land = w > h * 1.6;
  return land
    ? [{x: 0, y: 0, w: w * f - gap / 2, h}, {x: w * f + gap / 2, y: 0, w: w * (1 - f) - gap / 2, h}, land]
    : [{x: 0, y: 0, w, h: h * f - gap / 2}, {x: 0, y: h * f + gap / 2, w, h: h * (1 - f) - gap / 2}, land];
}
function label(p, x, y, s, fs, extra = {}){ return sT(p, x, y, s, 'sv-s', Object.assign({'font-size': fs * .9}, extra)); }
function heading(p, x, y, s, fs, extra = {}){ return sT(p, x, y, s, 'sv sv-b', Object.assign({'font-size': fs}, extra)); }
// push labels apart vertically: items [{y}], keeps order, min gap
function declutter(items, gap, lo = -Infinity, hi = Infinity){
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
  const over = items.length ? items[items.length - 1].y - hi : 0;
  if (over > 0){ items.forEach(it => it.y -= over); for (let i = items.length - 2; i >= 0; i--) if (items[i + 1].y - items[i].y < gap) items[i].y = items[i + 1].y - gap; }
  items.forEach(it => { if (it.y < lo) it.y = lo; });
  return items;
}
const tok = (v, d = 1) => v >= 1e12 ? `${+(v / 1e12).toFixed(d)}T` : v >= 1e9 ? `${+(v / 1e9).toFixed(d)}B` : v >= 1e6 ? `${+(v / 1e6).toFixed(d)}M` : `${Math.round(v / 1e3)}K`;
const dateFrac = s => { const [y, m = 7, d = 15] = s.split('-').map(Number); return y + (m - 1) / 12 + (d - 1) / 365; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const BUILD = {
// ---------------------------------------------------------------- 1
1({svg, w, h, fs, mx}){
  const corpus = ['the cat sat on the mat', 'the dog sat on the rug', 'the cat ate the fish', 'the dog ate the bone', 'a cat saw the dog', 'the dog saw a cat', 'a bird sat on the roof', 'the cat sat on the rug'];
  const bi = {};
  corpus.forEach(s => { const w2 = s.split(' ').concat('(end)'); for (let i = 1; i < w2.length; i++){ (bi[w2[i - 1]] ||= {})[w2[i]] = (bi[w2[i - 1]][w2[i]] || 0) + 1; } });
  const land = w > h * 1.6;
  let A, T, Q;
  if (land){ const cw = w * .47, rx = cw + fs * 1.6, rw = w - rx; A = {x: 0, y: 0, w: cw, h}; T = {x: rx, y: 0, w: rw, h: h * .44}; Q = {x: rx, y: h * .44 + fs * .8, w: rw, h: h * .56 - fs * .8}; }
  else { A = {x: 0, y: 0, w, h: h * .33}; T = {x: 0, y: h * .33 + fs * .6, w, h: h * .27}; Q = {x: 0, y: h * .6 + fs * 1.2, w, h: h * .4 - fs * 1.2}; }
  // next-word bars after "the"
  const ga = sG(svg);
  heading(ga, A.x, A.y + fs, 'Next word after “the”', fs);
  label(ga, A.x, A.y + fs * 2.3, 'a counting model looks only at the last word', fs);
  const after = Object.entries(bi.the).sort((a, b) => b[1] - a[1]), tot = sum(after.map(x => x[1]));
  const rows = after.slice(0, 5), lab0 = fs * 3.2, top = A.y + fs * 3.2, rh = Math.min(fs * 2.4, (A.h - fs * 3.4) / rows.length), bw = A.w - lab0 - fs * 3.6;
  rows.forEach(([wd, c], i) => {
    const y = top + i * rh, bl = bw * c / rows[0][1];
    sT(ga, A.x + lab0 - 8, y + rh * .6, wd, 'sv', {'text-anchor': 'end'});
    sR(ga, A.x + lab0, y + rh * .16, bl, rh * .62, {fill: LC('lm')});
    sT(ga, A.x + lab0 + bl + 6, y + rh * .6, pc(c / tot), 'sv sv-n', {'font-size': fs * .9});
  });
  // count table
  const gb = sG(svg), cols = ['sat', 'ate', 'saw', '(end)'], rws = ['cat', 'dog', 'bird'];
  heading(gb, T.x, T.y + fs, 'Counts: previous word → next word', fs);
  const tw = Math.min(T.w, fs * 22), cx0 = T.x + fs * 3.2, cw = (tw - fs * 3.2) / cols.length, ty = T.y + fs * 3, ch = Math.min(fs * 2.4, (T.h - fs * 4.6) / 3);
  cols.forEach((c, j) => sT(gb, cx0 + cw * j + cw / 2, ty - 6, c, 'sv-s', {'text-anchor': 'middle'}));
  const cells = []; let zero = null;
  rws.forEach((r, i) => {
    sT(gb, cx0 - 8, ty + ch * i + ch * .62, r, 'sv sv-b', {'text-anchor': 'end'});
    cols.forEach((c, j) => {
      const v = (bi[r] || {})[c] || 0, x = cx0 + cw * j, y = ty + ch * i;
      sR(gb, x + 2, y + 2, cw - 4, ch - 4, {fill: v ? PANEL : 'none', stroke: RULE, 'stroke-width': 1});
      cells.push(sT(gb, x + cw / 2, y + ch * .64, String(v), 'sv sv-n nh', {'text-anchor': 'middle', 'font-weight': 700}));
      if (r === 'bird' && c === 'ate') zero = {x: x + cw / 2, y: y + ch / 2, r: Math.min(cw, ch) * .44};
    });
  });
  const ring = sC(gb, zero.x, zero.y, zero.r, {fill: 'none', stroke: LC('align'), 'stroke-width': 3});
  const zl = sT(gb, zero.x, ty + ch * 3 + fs * 1.3, 'never seen, so 0%', 'sv sv-b', {'text-anchor': 'middle', fill: LC('align'), 'font-size': fs * .9});
  // learned space
  const gs = sG(svg);
  heading(gs, Q.x, Q.y + fs, 'Learned space', fs);
  const box = sR(gs, Q.x, Q.y + fs * 1.6, Q.w, Q.h - fs * 1.6, {fill: 'none', stroke: RULE2, 'stroke-dasharray': '3 4'});
  const pts = {cat: [.26, .3], dog: [.42, .22], bird: [.32, .58], mat: [.7, .66], rug: [.82, .5], roof: [.64, .86]};
  const P2 = ([px, py]) => [Q.x + 14 + px * (Q.w - 60), Q.y + fs * 2.4 + py * (Q.h - fs * 3.6)];
  const cl = P2([.34, .38]);
  const halo = el('ellipse', {cx: cl[0], cy: cl[1], rx: (Q.w - 60) * .2 + fs * 1.6, ry: (Q.h - fs * 3.6) * .3 + fs, fill: 'none', stroke: LC('lm'), 'stroke-width': 2.5}, gs);
  const dots = Object.entries(pts).map(([wd, p]) => { const [x, y] = P2(p), g = sG(gs); sC(g, x, y, 5, {fill: ['cat', 'dog', 'bird'].includes(wd) ? LC('lm') : INK2}); sT(g, x + 9, y + 5, wd, 'sv'); return g; });
  const shares = sT(gs, Q.x + Q.w - 8, Q.y + Q.h - 10, 'bird borrows from cat and dog', 'sv-s', {'text-anchor': 'end', fill: LC('lm'), 'font-weight': 700});
  mx.rise(cells, 1, 6, {stagger: .03});
  mx.draw(ring, 2, .4); mx.in(zl, 2.1);
  mx.in([box, gs.querySelector('text')], 3);
  mx.pop(dots, 3.05, {stagger: .05}); mx.draw(halo, 3.3, .5); mx.in(shares, 3.5);
},
// ---------------------------------------------------------------- 2
2({svg, w, h, fs, mx, arrow}){
  const [A, B] = regions(w, h, .5);
  const ga = sG(svg);
  heading(ga, A.x, A.y + fs, 'Word vectors', fs);
  const V = {man: [1, 1], woman: [1.05, 3], boy: [.3, .6], girl: [.35, 2.65], king: [4, 1.2], queen: [4.15, 3.1]};
  const X = x => A.x + 18 + (x + .2) / 4.8 * (A.w - 76), Y = y => A.y + A.h - 14 - y / 3.6 * (A.h - fs * 3.2);
  sL(ga, A.x + 6, A.y + A.h - 4, A.x + A.w, A.y + A.h - 4, {stroke: RULE});
  sL(ga, A.x + 6, A.y + fs * 1.8, A.x + 6, A.y + A.h - 4, {stroke: RULE});
  const par = [sL(ga, X(1), Y(1), X(4), Y(1.2), {stroke: MUTED, 'stroke-dasharray': '4 5'}), sL(ga, X(1.05), Y(3), X(4.15), Y(3.1), {stroke: MUTED, 'stroke-dasharray': '4 5'})];
  const p1 = sL(ga, X(1), Y(1), X(1.05), Y(3) + 7, {stroke: LC('rep'), 'stroke-width': 3, 'marker-end': arrow('i')});
  const p2 = sL(ga, X(4), Y(1.2), X(4.15), Y(3.1) + 7, {stroke: LC('rep'), 'stroke-width': 3, 'marker-end': arrow('i')});
  const pts = Object.entries(V).map(([k, [x, y]]) => { const g = sG(ga); sC(g, X(x), Y(y), 5, {fill: INK}); sT(g, X(x) + 9, Y(y) + (y > 2 ? -8 : 17), k, 'sv sv-b'); return g; });
  const pl = sT(ga, (X(1) + X(4)) / 2 + 4, Y(2) + 5, 'same direction', 'sv sv-b', {'text-anchor': 'middle', fill: LC('rep'), 'font-size': fs * .9});
  mx.draw([p1, p2], 1, .6); mx.in(par, 1.3); mx.in(pl, 1.4);
  // sequence to sequence: token boxes sized to their words
  const gb = sG(svg);
  heading(gb, B.x, B.y + fs, 'Sequence to sequence', fs);
  const inW = ['I', 'am', 'a', 'student'], extra = ['who', 'reads', 'every', 'night'], outW = ['je', 'suis', 'étudiant'];
  const all = inW.concat(extra), gap = 4;
  let tf = fs * .92, pad = fs * .55;
  const widths0 = all.map(wd => measure(gb, wd, 'sv', {'font-size': tf}));
  const need = sum(widths0) + all.length * pad * 2 + gap * (all.length - 1), sc = Math.min(1, (B.w - 4) / need);
  tf = Math.max(10.5, tf * sc); pad *= sc;
  const widths = widths0.map(x => x * tf / (fs * .92));
  const by0 = B.y + fs * 2.9, bh = fs * 2, vx = B.x + B.w * .5, vy = B.y + B.h * .57;
  label(gb, B.x, by0 - 7, 'encoder reads', fs);
  const enc = [], encExtra = []; let x = B.x + Math.max(0, (B.w - (sum(widths) + all.length * pad * 2 + gap * (all.length - 1))) / 2);
  all.forEach((wd, i) => {
    const bw = widths[i] + pad * 2, g = sG(gb);
    sR(g, x, by0, bw, bh, {fill: PANEL, stroke: INK2});
    sT(g, x + bw / 2, by0 + bh * .66, wd, 'sv nh', {'text-anchor': 'middle', 'font-size': tf});
    sL(g, x + bw / 2, by0 + bh, vx, vy - 15, {stroke: RULE2, 'stroke-width': 1.2});
    (i < inW.length ? enc : encExtra).push(g); x += bw + gap;
  });
  const vec = sC(gb, vx, vy, 13, {fill: INK});
  const ring = sC(gb, vx, vy, 21, {fill: 'none', stroke: LC('align'), 'stroke-width': 3});
  const vl = sT(gb, vx + 30, vy + 5, 'one fixed-size vector', 'sv sv-b', {fill: LC('align'), 'font-size': fs * .9});
  fitW(vl, B.x + B.w - vx - 32);
  const oy = B.y + B.h - bh - 4, ow = Math.min(fs * 5.4, (B.w - fs * 7) / 3.2);
  const dec = outW.map((wd, i) => { const x0 = vx - (outW.length * (ow + 4)) / 2 + i * (ow + 4), g = sG(gb);
    sL(g, vx, vy + 15, x0 + ow / 2, oy, {stroke: RULE2, 'stroke-width': 1.2}); sR(g, x0, oy, ow, bh, {fill: PAPER, stroke: INK});
    fitW(sT(g, x0 + ow / 2, oy + bh * .66, wd, 'sv nh', {'text-anchor': 'middle'}), ow - 8); return g; });
  label(gb, B.x, oy - 7, 'decoder writes', fs);
  mx.rise(enc, 2, 8, {stagger: .06}); mx.pop(vec, 2.3); mx.rise(dec, 2.45, 8, {stagger: .06});
  mx.rise(encExtra, 3, 8, {stagger: .05}); mx.draw(ring, 3.3, .4); mx.in(vl, 3.35);
},
// ---------------------------------------------------------------- 3
3({svg, w, h, fs, mx, arrow}){
  const [A, B] = regions(w, h, .5);
  const ga = sG(svg);
  heading(ga, A.x, A.y + fs, 'Encoder states and the decoder', fs);
  const words = ['the', 'animal', 'did', 'not', 'cross', 'street'], wts = [.04, .58, .05, .06, .09, .18];
  const n = words.length, bw = Math.min(fs * 4.8, (A.w - (n - 1) * 8) / n), gap = (A.w - n * bw) / (n - 1), ey = A.y + fs * 2.3, bh = fs * 2.1;
  const ex = i => A.x + i * (bw + gap);
  const recs = [];
  words.forEach((wd, i) => {
    sR(ga, ex(i), ey, bw, bh, {fill: PANEL, stroke: INK2});
    fitW(sT(ga, ex(i) + bw / 2, ey + bh * .66, wd, 'sv nh', {'text-anchor': 'middle'}), bw - 6);
    if (i < n - 1 && gap > 10) recs.push(sL(ga, ex(i) + bw + 2, ey + bh / 2, ex(i + 1) - 3, ey + bh / 2, {stroke: INK, 'stroke-width': 2, 'marker-end': arrow('i')}));
  });
  const dy = A.y + A.h - bh - 2, dx = A.x + A.w / 2, ly = ey + bh + fs * 1.25, ay = ly + fs * .6;
  sR(ga, dx - fs * 4.2, dy, fs * 8.4, bh, {fill: PAPER, stroke: INK, 'stroke-width': 2});
  sT(ga, dx, dy + bh * .66, 'decoder: “it”', 'sv sv-b nh', {'text-anchor': 'middle'});
  const bott = sL(ga, ex(n - 1) + bw / 2, ey + bh + 2, dx + fs * 2.4, dy - 4, {stroke: INK, 'stroke-width': 2, 'marker-end': arrow('i')});
  const bl = sT(ga, (ex(n - 1) + bw / 2 + dx + fs * 2.4) / 2 - fs * .7, (ey + bh + dy) / 2 + fs * .3, 'only the last state', 'sv-s', {'text-anchor': 'end'});
  const att = words.map((wd, i) => sL(ga, dx, dy - 2, ex(i) + bw / 2, ay, {stroke: LC('lm'), 'stroke-width': 1 + wts[i] * 14, 'stroke-linecap': 'round'}));
  const attL = words.map((wd, i) => sT(ga, ex(i) + bw / 2, ly, pc(wts[i]), 'sv-s sv-n', {'text-anchor': 'middle', 'font-weight': 700, fill: LC('lm')}));
  mx.out([bott, bl], 1, 0); mx.draw(att, 1, .6); mx.in(attL, 1.4, {stagger: .03});
  mx.out(recs, 2, 0);
  // every pair at once, and sixteen steps against one
  const gb = sG(svg), m = 6, N = 16;
  heading(gb, B.x, B.y + fs, `Every word with every word: ${m} × ${m}`, fs);
  const cell = Math.min(fs * 1.9, (B.h - fs * 3.2) / m, B.w * .36 / m), gx = B.x, gy = B.y + fs * 2;
  const gridG = sG(gb);
  for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) sR(gridG, gx + c * cell, gy + r * cell, cell - 2, cell - 2, {fill: LC('lm'), opacity: r === c ? 1 : .5});
  mx.in(gb.querySelector('text'), 2); mx.from(gridG.querySelectorAll('rect'), 2, {opacity: 0, stagger: .008, duration: .3});
  const side = B.w - m * cell - fs * 1.6 >= fs * 11;
  const rx = side ? gx + m * cell + fs * 1.6 : B.x, rw = B.x + B.w - rx, cw = rw / N, bh2 = Math.min(fs * 1.8, cw * 1.6);
  const ry1 = side ? gy + fs * 1.4 : gy + m * cell + fs * 2.2, ry2 = ry1 + bh2 + fs * 2.6;
  const rowsG = sG(gb);
  const lab1 = heading(rowsG, rx, ry1 - fs * .5, `Recurrent: step ${N} of ${N}`, fs * .95);
  const rn = [], an = [];
  for (let i = 0; i < N; i++) rn.push(sR(rowsG, rx + i * cw, ry1, cw - 2, bh2, {fill: LC('soc')}));
  heading(rowsG, rx, ry2 - fs * .5, 'Attention: 1 step', fs * .95);
  for (let i = 0; i < N; i++) an.push(sR(rowsG, rx + i * cw, ry2, cw - 2, bh2, {fill: LC('lm')}));
  wrapT(rowsG, rx, ry2 + bh2 + fs * 1.3, `${N} words: ${N} steps one after another, or ${N * N} pairs scored at once`, rw, 'sv-s');
  mx.in(rowsG, 3, {duration: .2});
  mx.from(an, 3.02, {opacity: .15, duration: .15});
  if (mx.tl) rn.forEach((r, i) => mx.tl.from(r, {opacity: .15, duration: .02, ease: 'none'}, 3.1 + i * .05));
  mx.tick(3.1, .8, p => { lab1.textContent = `Recurrent: step ${Math.max(0, Math.min(N, Math.round(p * N)))} of ${N}`; });
},
// ---------------------------------------------------------------- 4
4({svg, w, h, fs, mx, arrow}){
  const [A, B] = regions(w, h, .44, 30);
  const ga = sG(svg);
  const tasks = ['Translation', 'Sentiment', 'Questions'];
  const tw = (A.w - 20) / 3, by0 = A.y + fs * 2.2, bh = fs * 3.8;
  heading(ga, A.x, A.y + fs, 'Before: one model per job', fs);
  const before = tasks.map((t, i) => { const g = sG(ga), x = A.x + i * (tw + 10);
    sR(g, x, by0, tw, bh, {fill: 'none', stroke: INK2, 'stroke-dasharray': '4 3'});
    fitW(sT(g, x + tw / 2, by0 + bh * .42, t, 'sv sv-b', {'text-anchor': 'middle'}), tw - 10);
    fitW(sT(g, x + tw / 2, by0 + bh * .78, 'own data, own model', 'sv-s', {'text-anchor': 'middle'}), tw - 10); return g; });
  const oy = A.y + A.h - fs * .4, ph = fs * 2.8, py = Math.max(by0 + bh + fs * 1.2, (by0 + bh + oy - fs * 2.6) / 2 - ph / 2);
  const pre = sG(ga);
  sR(pre, A.x, py, A.w, ph, {fill: INK});
  fitW(sT(pre, A.x + A.w / 2, py + ph * .62, 'One model pretrained on plain text', 'sv sv-b sv-on', {'text-anchor': 'middle'}), A.w - 16);
  const outs = tasks.map((t, i) => { const g = sG(ga), x = A.x + i * (tw + 10) + tw / 2;
    sL(g, x, py + ph, x, oy - fs * 1.4, {stroke: INK, 'stroke-width': 2, 'marker-end': arrow('i')}); sT(g, x, oy, t.toLowerCase(), 'sv', {'text-anchor': 'middle'}); return g; });
  mx.out(before, 1, .22); mx.rise(pre, 1.05); mx.rise(outs, 1.3, 8, {stagger: .08});
  // the fork: what each model may look at
  const gb = sG(svg);
  const T = ['The', 'cat', 'sat', 'on', 'the', 'mat', '.'];
  const n = T.length, half = (B.w - fs * 1.6) / 2, lw = fs * 2.4, cell = Math.min(fs * 2.3, (half - lw) / n, (B.h - fs * 8.6) / n);
  const grids = [['GPT: guess the next word', 'gpt', '→ GPT-2, GPT-3 and today’s chat models'], ['BERT: fill in the blank', 'bert', '→ search and embeddings']].map(([t, kind, fut], k) => {
    const g = sG(gb), x0 = B.x + k * (half + fs * 1.6), y0 = B.y + fs * 2.2;
    fitW(heading(g, x0, B.y + fs, t, fs), half);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){ const see = kind === 'bert' || c <= r;
      sR(g, x0 + lw + c * cell, y0 + r * cell, cell - 2, cell - 2, {fill: see ? LC('lm') : PANEL}); }
    T.forEach((t2, r) => sT(g, x0 + lw - 6, y0 + r * cell + cell * .66, t2, 'sv-s', {'text-anchor': 'end', 'font-size': Math.min(fs * .85, cell * .75)}));
    const cap = wrapT(g, x0 + lw, y0 + n * cell + fs * 1.1, kind === 'gpt' ? 'each word sees itself and the words before it' : 'each word sees every word', half - lw, 'sv-s', {'font-size': fs * .82}, 1.15);
    const f = wrapT(gb, x0, y0 + n * cell + fs * 1.1 + cap.lines * cap.lh + fs * .7, fut, half, 'sv sv-b', {fill: LC('lm'), 'font-size': fs * .9});
    return {g, f};
  });
  mx.rise(grids.map(x => x.g), 2, 10, {stagger: .15}); mx.in(grids.map(x => x.f), 3, {stagger: .15});
},
// ---------------------------------------------------------------- 5
5({svg, w, h, fs, mx}){
  const [A, B] = regions(w, h, .42);
  // the power law
  const ga = sG(svg);
  heading(ga, A.x, A.y + fs, 'Loss against parameters, log axes', fs);
  const ml = fs * 2.2, x0 = A.x + ml, x1 = A.x + A.w - fs * .8, y0 = A.y + fs * 2.4, y1 = A.y + A.h - fs * 1.7;
  const LX = n => x0 + (Math.log10(n) - 6) / 6 * (x1 - x0), LF = n => Math.pow(8.8e13 / n, .076), LY = l => y1 - (Math.log10(l) - Math.log10(1.3)) / (Math.log10(4.4) - Math.log10(1.3)) * (y1 - y0);
  sL(ga, x0, y1, x1, y1, {stroke: RULE2}); sL(ga, x0, y0, x0, y1, {stroke: RULE2});
  [1e6, 1e8, 1e10, 1e12].forEach((v, i, a) => sT(ga, LX(v), y1 + fs * 1.2, tok(v, 0), 'sv-s', {'text-anchor': i === 0 ? 'start' : i === a.length - 1 ? 'end' : 'middle'}));
  [2, 3, 4].forEach(v => sT(ga, x0 - 6, LY(v) + 4, String(v), 'sv-s', {'text-anchor': 'end'}));
  let d = ''; for (let i = 0; i <= 60; i++){ const n = Math.pow(10, 6 + i / 10); d += (i ? 'L' : 'M') + LX(n).toFixed(1) + ',' + LY(LF(n)).toFixed(1); }
  sP(ga, d, {fill: 'none', stroke: LC('scale'), 'stroke-width': 3.5});
  // L(N) = (N_c / N)^0.076, with a real subscript and superscript
  const f = sT(ga, x1, y0 + fs * .3, '', 'sv-m', {'text-anchor': 'end'}), fz = fontPx(f);
  [['L(N) = (N', 0, 1], ['c', fz * .3, .75], [' / N)', -fz * .3, 1], ['0.076', -fz * .4, .75]].forEach(([s, dy, k]) => { const ts = el('tspan', {dy}, f); ts.style.fontSize = (fz * k) + 'px'; ts.textContent = s; });
  // model sizes by date, log scale
  const gb = sG(svg);
  heading(gb, B.x, B.y + fs, 'Model size by release date', fs);
  const M = [['GPT-2', 'gpt2_2019', 1.5e9], ['GPT-3', 'gpt3_2020', 175e9], ['Gopher', 'gopher2021', 280e9], ['Chinchilla', 'chinchilla2022', 70e9], ['PaLM', 'palm2022', 540e9]];
  const bx0 = B.x + fs * 2.6, bx1 = B.x + B.w - fs * 1.2, by0 = B.y + fs * 2.4, by1 = B.y + B.h - fs * 1.8;
  const DX = t => bx0 + (t - 2018.8) / (2022.9 - 2018.8) * (bx1 - bx0), DY = v => by1 - (Math.log10(v) - 9) / 3 * (by1 - by0);
  [1e9, 1e10, 1e11, 1e12].forEach(v => { sL(gb, bx0, DY(v), bx1, DY(v), {stroke: RULE}); sT(gb, bx0 - 6, DY(v) + 4, tok(v, 0), 'sv-s', {'text-anchor': 'end'}); });
  [2019, 2020, 2021, 2022].forEach(y => sT(gb, DX(y), by1 + fs * 1.3, String(y), 'sv-s', {'text-anchor': 'middle'}));
  const dots = {};
  M.forEach(([name, id, v]) => {
    const t = dateFrac(by[id].date), g = sG(gb), left = name !== 'GPT-2';
    sC(g, DX(t), DY(v), 6.5, {fill: name === 'Chinchilla' ? LC('scale') : INK, stroke: PAPER, 'stroke-width': 2});
    sT(g, DX(t) + (left ? -11 : 11), DY(v) + 5, `${name} ${tok(v, v < 1e10 ? 1 : 0)}`, 'sv sv-b', {'font-size': fs * .9, 'text-anchor': left ? 'end' : 'start'});
    dots[name] = {g, x: DX(t), y: DY(v)};
  });
  const tk = wrapT(gb, dots.Chinchilla.x - 11, dots.Chinchilla.y + fs * 1.3, 'trained on 1.4T tokens, it beat Gopher, which saw 300B', Math.min(B.w * .6, fs * 13), 'sv-s', {'text-anchor': 'end', fill: 'var(--lab-c-ink)', 'font-weight': 700}, 1.2);
  const cmp = sP(gb, `M${dots.Chinchilla.x + 2},${dots.Chinchilla.y - 9} C${dots.Chinchilla.x + fs * 1.2},${(dots.Chinchilla.y + dots.Gopher.y) / 2} ${dots.Gopher.x + fs * 1.2},${(dots.Chinchilla.y + dots.Gopher.y) / 2} ${dots.Gopher.x + 4},${dots.Gopher.y + 9}`, {fill: 'none', stroke: 'var(--lab-c-ink)', 'stroke-width': 2, 'stroke-dasharray': '5 4'});
  mx.pop(['GPT-2', 'GPT-3', 'Gopher', 'PaLM'].map(k => dots[k].g), 1, {stagger: .12});
  mx.pop(dots.Chinchilla.g, 2); mx.in(tk, 2.2); mx.draw(cmp, 2.3, .4);
},
// ---------------------------------------------------------------- 6
6({svg, w, h, fs, mx, arrow}){
  const [A, B] = regions(w, h, .42, 28);
  const ga = sG(svg);
  const gap = fs, cw = (A.w - gap) / 2, cy = A.y + 2;
  const texts = ['Unplug it, wait 30 seconds, plug it back in.', 'Routers can be restarted in various ways.'];
  let ch = 0;
  const narrowCard = measure(ga, 'Answer A', 'sv sv-b', {'font-size': fs * .9}) + measure(ga, '✓ preferred', 'sv sv-b', {'font-size': fs * .85}) + 34 > cw;
  const cards = texts.map((t, i) => { const g = sG(ga), x = A.x + i * (cw + gap);
    const r = sR(g, x, cy, cw, 10, {fill: PAPER, stroke: i ? RULE2 : INK, 'stroke-width': i ? 1.5 : 2.5});
    sT(g, x + 10, cy + fs * 1.35, `Answer ${'AB'[i]}`, 'sv sv-b', {'font-size': fs * .9});
    const tt = wrapT(g, x + 10, cy + fs * (narrowCard ? 3.9 : 2.75), t, cw - 20, 'sv-s', {'font-size': fs * .85});
    ch = Math.max(ch, fs * (narrowCard ? 3.9 : 2.75) + (tt.lines - 1) * tt.lh + fs * .9); return {g, r}; });
  cards.forEach(c => c.r.setAttribute('height', ch));
  const tick = narrowCard ? sT(ga, A.x + 10, cy + fs * 2.55, '✓ preferred', 'sv sv-b', {'font-size': fs * .85, fill: 'var(--good)'})
    : sT(ga, A.x + cw - 10, cy + fs * 1.35, '✓ preferred', 'sv sv-b', {'text-anchor': 'end', 'font-size': fs * .85, fill: 'var(--good)'});
  const bw = cw, bh2 = fs * 2.6, ry = cy + ch + clamp((A.h - ch - bh2 - fs * 2) * .6, fs * 3, fs * 5);
  const rm = sG(ga); sR(rm, A.x, ry, bw, bh2, {fill: LC('align')});
  fitW(sT(rm, A.x + bw / 2, ry + bh2 * .63, 'reward model', 'sv sv-b nh', {'text-anchor': 'middle', fill: 'var(--on-align)'}), bw - 12);
  const a1 = sL(ga, A.x + cw / 2, cy + ch + 3, A.x + bw / 2, ry - 4, {stroke: INK, 'stroke-width': 2, 'marker-end': arrow('i')});
  const lmx = A.x + cw + gap;
  const lm = sG(ga); sR(lm, lmx, ry, bw, bh2, {fill: PAPER, stroke: INK, 'stroke-width': 2});
  fitW(sT(lm, lmx + bw / 2, ry + bh2 * .63, 'language model', 'sv sv-b nh', {'text-anchor': 'middle'}), bw - 12);
  const loop = sL(ga, A.x + bw + 2, ry + bh2 / 2, lmx - 4, ry + bh2 / 2, {stroke: INK, 'stroke-width': 2, 'marker-end': arrow('i')});
  const ll = sT(ga, A.x + bw + gap / 2, ry + bh2 + fs * 1.3, 'optimise against it, in a reinforcement-learning loop', 'sv-s', {'text-anchor': 'middle'});
  fitW(ll, A.w);
  // DPO: straight from the pair of answers to the model, no reward model
  const dpo = sG(ga), bx = lmx + bw / 2;
  sP(dpo, `M${A.x + cw * .5},${cy + ch + 8} L${A.x + cw * .5},${cy + ch + 14} L${lmx + cw * .5},${cy + ch + 14} L${lmx + cw * .5},${cy + ch + 8}`, {fill: 'none', stroke: LC('align'), 'stroke-width': 2});
  sL(dpo, bx, cy + ch + 14, bx, ry - 5, {stroke: LC('align'), 'stroke-width': 2.5, 'stroke-dasharray': '6 4', 'marker-end': arrow('r')});
  const dl = sT(dpo, A.x + A.w / 2, ry + bh2 + fs * 1.3, 'DPO: learn straight from the pairs', 'sv sv-b', {'text-anchor': 'middle', fill: LC('align'), 'font-size': fs * .95});
  mx.in(tick, .2); mx.draw(a1, .3, .3);
  mx.rise(lm, 1); mx.draw(loop, 1.1, .4); mx.in(ll, 1.2);
  mx.out([rm, loop, a1], 3, .18); mx.out(ll, 3, 0); mx.in(dpo, 3.1);
  // sizes to scale, by area
  const gb = sG(svg);
  heading(gb, B.x, B.y + fs, 'People preferred the smaller, aligned model', fs);
  const R = Math.max(fs * 2, Math.min(B.h - fs * 5, B.w * .5) / 2), r2 = Math.max(3, R * Math.sqrt(1.3 / 175));
  const cxB = B.x + R + 2, cyB = B.y + fs * 2.2 + R;
  const big = sG(gb); sC(big, cxB, cyB, R, {fill: PANEL, stroke: INK2});
  wrapT(big, cxB, cyB - fs * .2, 'GPT-3, 175B, not aligned', R * 1.5, 'sv nh', {'text-anchor': 'middle'}).setAttribute('text-anchor', 'middle');
  const sx = cxB + R + fs * 2.4;
  const small = sG(gb); sC(small, sx, cyB, r2, {fill: LC('align')});
  sT(small, sx + r2 + 9, cyB - fs * .35, 'InstructGPT, 1.3B', 'sv sv-b', {'font-size': fs * .95});
  sT(small, sx + r2 + 9, cyB + fs * 1, '✓ preferred', 'sv sv-b', {'font-size': fs * .9, fill: 'var(--good)'});
  label(gb, B.x, cyB + R + fs * 1.4, 'circle areas to scale: 175 billion against 1.3 billion parameters', fs, {'font-size': fs * .82});
  mx.pop(big, 2); mx.pop(small, 2.25);
},
// ---------------------------------------------------------------- 7
7({svg, w, h, fs, mx}){
  const g = sG(svg);
  const x = clamp(w * .38, fs * 8, w * .45), y0 = fs * .6, splitY = h * .6, y1 = h - fs * 3.8;
  const T = t => y0 + fs * 1.2 + (t - 2021.4) / (2023.35 - 2021.4) * (splitY - y0 - fs * 2.2);
  [2022, 2023].forEach(yr => { sL(g, 0, T(yr), w, T(yr), {stroke: RULE, 'stroke-dasharray': '2 5'}); sT(g, w, T(yr) - 6, String(yr), 'sv-s', {'font-weight': 700, 'text-anchor': 'end'}); });
  const main = sP(g, `M${x},${y0} L${x},${splitY}`, {stroke: INK, 'stroke-width': 6, fill: 'none'});
  const ig = by.instructgpt2022, cg = by.chatgpt2022;
  const ax = x - Math.min(w * .2, fs * 4.5);
  const side = sP(g, `M${ax},${T(dateFrac(ig.date))} L${ax},${T(dateFrac(cg.date)) - 20} L${x},${T(dateFrac(cg.date))}`, {stroke: LC('align'), 'stroke-width': 5, fill: 'none'});
  const st = (id, name, big) => { const n = by[id], yy = T(dateFrac(n.date)), sg = sG(g);
    sC(sg, x, yy, big ? 11 : 7.5, {fill: PAPER, stroke: INK, 'stroke-width': big ? 4 : 3});
    sT(sg, x + 18, yy + 5, name, big ? 'sv sv-b' : 'sv', {'font-size': big ? fs * 1.15 : fs});
    sT(sg, x + 18, yy + 5 + fs * 1.2, when(n), 'sv-s', {'font-size': fs * .82}); return sg; };
  const cop = st('github_copilot2021', 'GitHub Copilot', false);
  const ins = sG(g), iy = T(dateFrac(ig.date));
  sC(ins, ax, iy, 7.5, {fill: PAPER, stroke: INK, 'stroke-width': 3});
  const iw = Math.max(measure(ins, 'InstructGPT', 'sv'), measure(ins, when(ig), 'sv-s', {'font-size': fs * .82}));
  if (ax - 16 >= iw){ sT(ins, ax - 16, iy + 5, 'InstructGPT', 'sv', {'text-anchor': 'end'}); sT(ins, ax - 16, iy + 5 + fs * 1.2, when(ig), 'sv-s', {'text-anchor': 'end', 'font-size': fs * .82}); }
  else { sT(ins, 0, iy - fs * 2.1, 'InstructGPT', 'sv'); sT(ins, 0, iy - fs * .95, when(ig), 'sv-s', {'font-size': fs * .82}); }
  const chat = st('chatgpt2022', 'ChatGPT', true);
  const g4 = st('gpt4_2023', 'GPT-4 and Claude', false);
  const users = wrapT(g, x - 18, T(dateFrac(cg.date)) + fs * 1.6, 'an estimated 100 million users in about two months', Math.min(x - 22, fs * 12), 'sv-s', {'text-anchor': 'end', 'font-size': fs * .82, fill: LC('align'), 'font-weight': 700});
  const SPL = [[8, 'open', 'Open weights'], [9, 'eff', 'Efficiency'], [10, 'rep', 'Retrieval'], [11, 'multi', 'Senses'], [12, 'reason', 'Reasoning'], [13, 'agent', 'Agents']];
  const colW = w / SPL.length;
  const spl = SPL.map(([n, k, name], i) => {
    const tx = colW * (i + .5), sg = sG(g);
    sP(sg, `M${x},${splitY - 2} C${x},${splitY + (y1 - splitY) * .5} ${tx},${splitY + (y1 - splitY) * .4} ${tx},${y1}`, {stroke: LC(k), 'stroke-width': 5, fill: 'none'});
    sC(sg, tx, y1, 6.5, {fill: PAPER, stroke: LC(k), 'stroke-width': 3});
    sT(sg, tx, y1 + fs * 1.55, String(n), 'sv-d', {'text-anchor': 'middle', 'font-size': fs * 1.15});
    wrapT(sg, tx, y1 + fs * 2.7, name, colW - 4, 'sv-s', {'text-anchor': 'middle', 'font-size': fs * .8}, 1.1);
    return sg; });
  mx.draw(side, 1, .3); mx.pop(ins, 1); mx.pop(chat, 1.25); mx.in(users, 1.4);
  mx.pop(g4, 2);
  if (mx.tl) spl.forEach((sg, i) => { mx.draw(sg.querySelector('path'), 3 + i * .05, .5); mx.in([...sg.querySelectorAll('circle,text')], 3.3 + i * .05); });
},
// ---------------------------------------------------------------- 8
8({svg, w, h, fs, mx}){
  const g = sG(svg), narrow = w < 480;
  const top = fs * 3.2, bot = h - fs * .8, xa = w * (narrow ? .37 : .32), xb = w * (narrow ? .6 : .58);
  const Y = t => top + (t - 2020.2) / (2026.5 - 2020.2) * (bot - top);
  fitW(sT(g, xa, fs * 1.1, 'Behind an API', 'sv sv-b', {'text-anchor': 'end'}), xa - 4);
  fitW(sT(g, xb, fs * 1.1, narrow ? 'Downloadable' : 'Weights you can download', 'sv sv-b'), w - xb - 4);
  if (narrow) sT(g, xb, fs * 2.2, 'weights', 'sv sv-b');
  for (let yr = 2021; yr <= 2026; yr++){ sL(g, 0, Y(yr), w, Y(yr), {stroke: RULE, 'stroke-dasharray': '2 5'}); sT(g, (xa + xb) / 2, Y(yr) - 4, String(yr), 'sv-s', {'text-anchor': 'middle', 'font-size': fs * .8, 'font-weight': 700}); }
  sL(g, xa, top - 6, xa, bot, {stroke: LC('soc'), 'stroke-width': 4}); sL(g, xb, top - 6, xb, bot, {stroke: LC('open'), 'stroke-width': 4});
  const closed = [['gpt3_2020', 'GPT-3'], ['chatgpt2022', 'ChatGPT'], ['gpt4_2023', 'GPT-4'], ['gpt5_2025', 'GPT-5'], ['muse_spark2026', 'Muse Spark (Meta)']];
  const open = [['llama2023', 'LLaMA'], ['llama2_2023', 'Llama 2'], ['mistral7b2023', 'Mistral 7B'], ['mixtral2023', 'Mixtral 8x7B'], ['llama3_2024', 'Llama 3'], ['deepseek_v3_2024', 'DeepSeek-V3'], ['deepseek_r1_2025', 'DeepSeek-R1'], ['qwen3_2025', 'Qwen3'], ['llama4_2025', 'Llama 4'], ['kimi_k2_2025', 'Kimi K2'], ['gpt_oss_2025', 'gpt-oss']].filter(([id]) => by[id]);
  const lf = fs * (narrow ? .84 : .92);
  const place = (list, x, side) => {
    const items = list.map(([id, name]) => ({id, name, y0: Y(dateFrac(by[id].date)), y: Y(dateFrac(by[id].date))}));
    declutter(items, lf * 1.3, top, bot);
    return items.map(it => { const sg = sG(g);
      sC(sg, x, it.y0, 6, {fill: PAPER, stroke: INK, 'stroke-width': 2.5});
      if (Math.abs(it.y - it.y0) > 2) sL(sg, x + side * 8, it.y0, x + side * 16, it.y, {stroke: RULE2});
      const t = sT(sg, x + side * 18, it.y + 4.5, it.name, 'sv', {'font-size': lf, 'text-anchor': side < 0 ? 'end' : 'start', 'font-weight': it.id === 'llama2023' ? 700 : 400});
      fitW(t, side < 0 ? x - 20 : w - x - 20, 9.5);
      return Object.assign(it, {g: sg}); });
  };
  const C = place(closed, xa, -1), O = place(open, xb, 1);
  const ms = C.find(c => c.id === 'muse_spark2026');
  const late = C.filter(c => c.y0 > Y(2023.3) && c !== ms);
  const llama = O.find(o => o.id === 'llama2023'), restO = O.filter(o => o.id !== 'llama2023');
  const meta = ['llama2023', 'llama2_2023', 'llama3_2024', 'llama4_2025'].map(id => O.find(o => o.id === id)).filter(Boolean);
  const mx0 = xb - 13, last = meta[meta.length - 1];
  let d = `M${mx0},${meta[0].y0} L${mx0},${last.y0}`;
  if (ms) d += ` C${mx0},${(last.y0 + ms.y0) / 2} ${xa + 13},${(last.y0 + ms.y0) / 2} ${xa + 13},${ms.y0 - 4}`;
  const path = sP(g, d, {stroke: LC('open'), 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '7 5'});
  const ml = sT(g, mx0 - 6, meta.length > 2 ? meta[2].y0 + 4 : Y(2024.5), 'Meta', 'sv sv-b', {'text-anchor': 'end', fill: LC('open'), 'font-size': fs * .85});
  mx.pop(llama.g, 1); mx.from(llama.g.querySelector('circle'), 1.1, {attr: {r: 16}, duration: .5});
  mx.in(late.map(c => c.g), 2, {stagger: .05}); mx.rise(restO.map(o => o.g), 2, 6, {stagger: .05});
  mx.draw(path, 3, .7); mx.in(ml, 3.2); if (ms) mx.pop(ms.g, 3.4);
},
// ---------------------------------------------------------------- 9
9({svg, w, h, fs, mx}){
  const [A, B] = regions(w, h, .5);
  const ga = sG(svg);
  heading(ga, A.x, A.y + fs, 'Weights of a 65B model', fs);
  const l0 = A.x + fs * 3.9, x1 = A.x + A.w - fs * 4, X = gb => l0 + gb / 135 * (x1 - l0), top = A.y + fs * 4, rh = Math.min(fs * 4, (A.h - fs * 6.4) / 3);
  [24, 48, 80].forEach((gb2, i) => { sL(ga, X(gb2), top - fs * (i % 2 ? 1.5 : .4), X(gb2), top + rh * 3, {stroke: MUTED, 'stroke-dasharray': '4 4'}); sT(ga, X(gb2), top - fs * (i % 2 ? 1.8 : .7), `${gb2} GB`, 'sv-s', {'text-anchor': 'middle', 'font-size': fs * .8}); });
  const rows = [[16, 130], [8, 65], [4, 32.5]].map(([b, v], i) => { const g = sG(ga), y = top + i * rh;
    sT(g, l0 - 8, y + rh * .58, `${b}-bit`, 'sv sv-b', {'text-anchor': 'end'});
    sR(g, l0, y + rh * .14, X(v) - l0, rh * .64, {fill: b === 4 ? LC('eff') : b === 8 ? 'var(--rule-2)' : INK2});
    sT(g, X(v) + 6, y + rh * .58, `${v} GB`, 'sv sv-b sv-n'); return g; });
  const fits = sT(ga, l0, top + rh * 3 + fs * 1.4, '✓ 32.5 GB fits on one 48 GB GPU', 'sv sv-b', {fill: 'var(--good)'});
  mx.from(rows[1].querySelector('rect'), 1, {attr: {width: X(130) - l0}, duration: .5}); mx.in(rows[1], 1);
  mx.from(rows[2].querySelector('rect'), 1.3, {attr: {width: X(130) - l0}, duration: .5}); mx.in(rows[2], 1.3);
  mx.in(fits, 3);
  // LoRA
  const gb = sG(svg);
  fitW(heading(gb, B.x, B.y + fs, 'LoRA: train two thin matrices, freeze the big one', fs), B.w);
  const S0 = Math.min(B.h - fs * 5.2, (B.w - fs * 4.4) / 2.06), th = Math.max(6, S0 * .05), S = Math.min(S0, (B.w - fs * 4.2 - th) / 2), sy = B.y + fs * 2.2;
  const frozen = sG(gb); sR(frozen, B.x, sy, S, S, {fill: PANEL, stroke: INK2});
  sT(frozen, B.x + S / 2, sy + S / 2 - 2, 'frozen', 'sv-s nh', {'text-anchor': 'middle'}); sT(frozen, B.x + S / 2, sy + S / 2 + fs, 'weights', 'sv-s nh', {'text-anchor': 'middle'});
  const ad = sG(gb), ax = B.x + S + fs * 2.2, aw = Math.min(S, B.x + B.w - (ax + th + fs * 1.8));
  sT(ad, ax - fs * 1.1, sy + S / 2 + 6, '+', 'sv-d', {'text-anchor': 'middle', 'font-size': fs * 1.6});
  sR(ad, ax, sy, th, S, {fill: LC('eff')}); sT(ad, ax + th + fs * .9, sy + S / 2 + 6, '×', 'sv-d', {'text-anchor': 'middle', 'font-size': fs * 1.3});
  sR(ad, ax + th + fs * 1.8, sy + S / 2 - th / 2, aw, th, {fill: LC('eff')});
  wrapT(ad, ax, sy + S + fs * 1.3, 'trained: an adapter of two thin matrices, often under 1% of the parameters', B.x + B.w - ax, 'sv-s', {'font-size': fs * .85});
  mx.in(frozen, 2); mx.rise(ad, 2.2);
},
// ---------------------------------------------------------------- 10
10({svg, w, h, fs, mx, arrow}){
  const [A, B] = regions(w, h, .45);
  const ga = sG(svg);
  // the question goes into the model; the model alone has only what it learned
  const q = sG(ga), qt = sT(q, A.x + 10, A.y + fs * 1.55, 'What changed this year?', 'sv', {'font-size': fs * .95});
  const qw = Math.min(A.w, textW(qt) + 20);
  sR(q, A.x, A.y + fs * .1, qw, fs * 2.3, {fill: 'none', stroke: INK, 'stroke-width': 1.5}); q.appendChild(qt);
  const mw = Math.min(A.w * .36, fs * 8.5), mh = fs * 2.8, mxp = A.x + A.w - mw, my = A.y + A.h * .44;
  const qa = sP(ga, `M${A.x + qw + 4},${A.y + fs * 1.25} L${mxp + mw / 2},${A.y + fs * 1.25} L${mxp + mw / 2},${my - 6}`, {fill: 'none', stroke: INK, 'stroke-width': 2, 'marker-end': arrow('i')});
  const model = sG(ga); sR(model, mxp, my, mw, mh, {fill: INK}); sT(model, mxp + mw / 2, my + mh * .63, 'model', 'sv sv-b sv-on', {'text-anchor': 'middle'});
  const cut = wrapT(ga, A.x + A.w, my + mh + fs * 1.3, 'knowledge frozen at training', mw + fs * 3, 'sv-s', {'text-anchor': 'end', 'font-size': fs * .85});
  cut.querySelectorAll('tspan').forEach(t => t.setAttribute('x', A.x + A.w));
  // retrieval: the right passages are found and put in view
  const lib = sG(ga), cols = 4, rows = 3, gapD = 6, dw = Math.min(fs * 2.4, (mxp - A.x - fs * 4) / cols - gapD, ((A.h - fs * 5.6) / rows - gapD) / 1.25), dh = dw * 1.25, lx = A.x, ly = A.y + fs * 3.6;
  const hits = [1, 6, 10], docs = [];
  for (let i = 0; i < cols * rows; i++) docs.push(sR(lib, lx + (i % cols) * (dw + gapD), ly + Math.floor(i / cols) * (dh + gapD), dw, dh, {fill: hits.includes(i) ? LC('rep') : PANEL, stroke: INK2}));
  label(lib, lx, ly + rows * (dh + gapD) + fs * .9, 'documents', fs, {'font-size': fs * .85});
  const arr = hits.map(i => sL(ga, lx + (i % cols) * (dw + gapD) + dw + 2, ly + Math.floor(i / cols) * (dh + gapD) + dh / 2, mxp - 5, my + mh / 2, {stroke: LC('rep'), 'stroke-width': 2, 'marker-end': arrow('i')}));
  const ans = wrapT(ga, A.x + A.w, my + mh + fs * 1.3 + cut.lines * cut.lh + fs * .3, 'answers, citing [1] [2] [3]', mw + fs * 3, 'sv sv-b', {'text-anchor': 'end', fill: LC('rep'), 'font-size': fs * .88});
  mx.in(lib, 1); mx.from(hits.map(i => docs[i]), 1.2, {fill: 'var(--panel)', duration: .3}); mx.draw(arr, 1.3, .4); mx.in(ans, 1.6);
  // context windows, then where the answer sits
  const gb = sG(svg);
  const wins = [['about 2,000', 2e3, 'GPT-3 era'], ['100,000', 1e5, '2023'], ['1,000,000', 1e6, '2024']];
  fitW(heading(gb, B.x, B.y + fs, 'Context window, tokens (log scale)', fs), B.w);
  const l0 = B.x, x1 = B.x + B.w * .56, X = v => l0 + (Math.log10(v) - 3) / 3 * (x1 - l0), rh = Math.min(fs * 2, (B.h - fs * 7) / 4);
  const bars = wins.map(([t, v, yr], i) => { const g = sG(gb), y = B.y + fs * 1.8 + i * rh;
    sR(g, l0, y, Math.max(4, X(v) - l0), rh * .64, {fill: LC('eff')}); sT(g, Math.max(l0 + 4, X(v)) + 6, y + rh * .5, `${t} (${yr})`, 'sv sv-n', {'font-size': fs * .85}); return g; });
  if (mx.tl) bars.forEach((b, i) => mx.from(b.querySelector('rect'), 2 + i * .15, {attr: {width: 4}, duration: .5}));
  mx.in(bars, 2, {stagger: .15});
  const ux0 = B.x + fs * .4, ux1 = B.x + B.w - fs * .4, uy0 = B.y + fs * 2.2 + rh * 3 + fs * 1.4, uy1 = B.y + B.h - fs * 1.6;
  const ug = sG(gb);
  heading(ug, B.x, uy0, 'Accuracy by where the answer sits', fs * .92);
  sL(ug, ux0, uy1, ux1, uy1, {stroke: RULE2});
  let d = ''; for (let i = 0; i <= 40; i++){ const t = i / 40, a = .25 + .75 * Math.pow(2 * t - 1, 2); d += (i ? 'L' : 'M') + (ux0 + t * (ux1 - ux0)).toFixed(1) + ',' + (uy1 - fs * .4 - a * (uy1 - uy0 - fs * 2)).toFixed(1); }
  const u = sP(ug, d, {fill: 'none', stroke: LC('rep'), 'stroke-width': 3});
  [['start of the context', ux0, 'start'], ['middle', (ux0 + ux1) / 2, 'middle'], ['end', ux1, 'end']].forEach(([s, xx, an]) => sT(ug, xx, uy1 + fs * 1.2, s, 'sv-s', {'text-anchor': an, 'font-size': fs * .8}));
  mx.in(ug, 3); mx.draw(u, 3.05, .6);
  if (uy1 - uy0 < fs * 3) ug.style.display = 'none';
},
// ---------------------------------------------------------------- 11
11({svg, w, h, fs, mx, arrow}){
  const land = w > h * 1.6;
  const cH = fs * 8.4;
  const A = land ? {x: 0, y: 0, w: w * .5 - 9, h: h * .56} : {x: 0, y: 0, w, h: (h - cH) * .52};
  const B = land ? {x: 0, y: h * .56 + fs, w: w * .5 - 9, h: h * .44 - fs} : {x: 0, y: A.h + fs * .6, w, h: h - cH - A.h - fs * 1.4};
  const C = land ? {x: w * .5 + 9, y: 0, w: w * .5 - 9, h} : {x: 0, y: h - cH, w, h: cH};
  // patches become tokens
  const ga = sG(svg), n = 4;
  const tw = A.w / 16, side = Math.min(A.h - tw - fs * 3.2, A.w * .45), cell = side / n, ix = A.x, iy = A.y;
  const COLS = ['#8db8da', '#8db8da', '#9cc3e0', '#f2c14e', '#a9cde6', '#7a3b2a', '#7a3b2a', '#b7d6ea', '#6e9e5c', '#c75b39', '#c75b39', '#6e9e5c', '#4f7f45', '#3b2a20', '#4f7f45', '#4f7f45'];
  COLS.forEach((c, i) => sR(ga, ix + (i % n) * cell, iy + Math.floor(i / n) * cell, cell - 2, cell - 2, {fill: c}));
  sT(ga, ix + side + fs, iy + fs, 'an image, cut into', 'sv-s'); sT(ga, ix + side + fs, iy + fs * 2.1, '16 patches', 'sv-s');
  const ty = iy + side + fs * 2.4;
  const rowLbl = sT(ga, A.x, ty - fs * .6, '16 patches → 16 tokens, in a row like words', 'sv-s', {'font-weight': 700});
  fitW(rowLbl, A.w);
  const targets = COLS.map((c, i) => sR(ga, A.x + i * tw, ty, tw - 2, Math.min(tw, fs * 2), {fill: c, stroke: INK, 'stroke-width': 1}));
  if (mx.tl) targets.forEach((t, i) => mx.tl.from(t, {x: ix + (i % n) * cell - (A.x + i * tw), y: iy + Math.floor(i / n) * cell - ty, opacity: 0, duration: .5, ease: 'expo.out'}, 1 + i * .025));
  mx.in(rowLbl, 1.2);
  // CLIP: pictures and captions land together
  const gb = sG(svg);
  heading(gb, B.x, B.y + fs, 'One space for pictures and words', fs);
  const pairs = [['dog on grass', '#6e9e5c', .02, .2], ['red house', '#c75b39', .36, .62], ['sunny sky', '#f2c14e', .56, .16]];
  const items = pairs.map(([t, c, fx, fy], i) => { const g = sG(gb), sq = fs * 1.6;
    const cx = B.x + fx * B.w, cy = B.y + fs * 2 + fy * (B.h - fs * 4.6);
    const img = sR(g, cx, cy, sq, sq, {fill: c, stroke: INK});
    const cap = sT(g, cx + sq + fs * .5, cy + sq * .72, `“${t}”`, 'sv', {'font-size': fs * .9});
    const over = cx + sq + fs * .5 + textW(cap) - (B.x + B.w);
    if (over > 0){ img.setAttribute('x', cx - over); cap.setAttribute('x', cx + sq + fs * .5 - over); }
    return {g, img, cap, dx: (i - 1) * fs * 3, dy: (i % 2 ? -1 : 1) * fs * 1.4}; });
  const pairsL = sT(gb, B.x, B.y + B.h - fs * .2, 'CLIP trained on 400 million image and caption pairs', 'sv-s', {'font-size': fs * .85});
  fitW(pairsL, B.w);
  mx.in(gb.querySelector('text'), 2); mx.in(pairsL, 2.4);
  if (mx.tl) items.forEach((it, i) => { mx.tl.from(it.img, {x: -it.dx - fs * 2, y: it.dy, opacity: 0, duration: .6, ease: 'expo.out'}, 2 + i * .08); mx.tl.from(it.cap, {x: it.dx + fs * 3, y: -it.dy, opacity: 0, duration: .6, ease: 'expo.out'}, 2.1 + i * .08); });
  // voice: three models collapse into one
  const gc = sG(svg);
  heading(gc, C.x, C.y + fs, 'Voice: three models, then one', fs);
  const bw3 = (C.w - 36) / 3, py = C.y + fs * 2, ph = fs * 2.4;
  const three = ['speech to text', 'language model', 'text to speech'].map((t, i) => { const g = sG(gc), x = C.x + i * (bw3 + 18);
    sR(g, x, py, bw3, ph, {fill: 'none', stroke: INK2, 'stroke-dasharray': '4 3'});
    fitW(sT(g, x + bw3 / 2, py + ph * .64, t, 'sv-s', {'text-anchor': 'middle'}), bw3 - 8, 9);
    if (i < 2) sL(g, x + bw3 + 2, py + ph / 2, x + bw3 + 15, py + ph / 2, {stroke: MUTED, 'stroke-width': 1.5, 'marker-end': arrow('m')}); return g; });
  const one = sG(gc), oy = py + ph + fs * 1.1;
  sR(one, C.x, oy, C.w, ph, {fill: LC('multi')});
  fitW(sT(one, C.x + C.w / 2, oy + ph * .64, 'GPT-4o: audio in, audio out, about 320 ms', 'sv sv-b nh', {'text-anchor': 'middle', fill: 'var(--on-multi)'}), C.w - 12, 10);
  mx.in(three, 3); mx.out(three, 3.35, .3); mx.rise(one, 3.45);
},
// ---------------------------------------------------------------- 12
12({svg, w, h, fs, mx}){
  const [A, B] = regions(w, h, .5);
  const ga = sG(svg);
  const lbl1 = label(ga, A.x, A.y + fs, 'one chain of reasoning steps, then five sampled chains', fs, {'font-size': fs * .85});
  fitW(lbl1, A.w);
  const qw = fs * 5, ax = A.x + A.w - fs * 1.8, rTop = A.y + fs * 2.6, rBot = A.y + A.h - fs * 2.8, qy = (rTop + rBot) / 2;
  const q = sG(ga); sR(q, A.x, qy - fs * 1.2, qw, fs * 2.4, {fill: INK}); sT(q, A.x + qw / 2, qy + 5, 'question', 'sv sv-b sv-on', {'text-anchor': 'middle', 'font-size': fs * .9});
  const ans = [42, 42, 38, 42, 40], paths = [];
  ans.forEach((a, i) => {
    const yy = rTop + i * (rBot - rTop) / 4, g = sG(ga), x0 = A.x + qw, xe = ax - fs * .9;
    const p = sP(g, `M${x0},${qy} C${x0 + (xe - x0) * .35},${qy} ${x0 + (xe - x0) * .45},${yy} ${xe},${yy}`, {fill: 'none', stroke: i === 0 ? LC('reason') : RULE2, 'stroke-width': i === 0 ? 3 : 2});
    const L = p.getTotalLength();
    for (let k = 1; k <= 3; k++){ const pt = p.getPointAtLength(L * k / 4); sC(g, pt.x, pt.y, i === 0 ? 4 : 3, {fill: i === 0 ? LC('reason') : MUTED}); }
    sT(g, ax, yy + 5, String(a), 'sv sv-b sv-n', {'font-size': fs * 1.05, fill: a === 42 ? LC('reason') : INK2});
    paths.push(g);
  });
  const vote = sT(ga, A.x + A.w, A.y + A.h - fs * .4, 'majority answer: 42', 'sv sv-b', {'text-anchor': 'end', 'font-size': fs * .95, fill: LC('reason')});
  mx.in(paths.slice(1), 1, {stagger: .06}); mx.in(vote, 1.4);
  // o1: long hidden reasoning, then GRPO's group of eight
  const gb = sG(svg), hid = sG(gb);
  fitW(heading(hid, B.x, B.y + fs, 'Long hidden reasoning before the answer', fs * .95), B.w);
  const ansW = measure(hid, 'answer', 'sv sv-b', {'font-size': fs * .88}) + 10, dots = 28, dy0 = B.y + fs * 2.3, dw = (B.w - ansW - 12) / dots;
  sR(hid, B.x, dy0 - fs * .6, dots * dw + 6, fs * 1.2, {fill: PANEL});
  for (let i = 0; i < dots; i++) sC(hid, B.x + 6 + i * dw, dy0, 2.6, {fill: MUTED});
  sT(hid, B.x + B.w, dy0 + 5, 'answer', 'sv sv-b', {'text-anchor': 'end', 'font-size': fs * .88});
  mx.in(hid, 2); mx.from(hid.querySelectorAll('circle'), 2.05, {opacity: 0, stagger: .02, duration: .15});
  const gr = sG(gb), r = [1, 0, 0, 1, 0, 0, 0, 1], m = 3 / 8, sd = Math.sqrt(m * (1 - m)), A2 = r.map(x => (x - m) / sd);
  const gy0 = dy0 + fs * 2.6;
  heading(gr, B.x, gy0, 'GRPO: 8 attempts, 3 right, each pushed by how it compares', fs * .92);
  fitW(gr.querySelector('text'), B.w);
  const colW = B.w / 8, avail = B.y + B.h - gy0 - fs * 4.6, scale = avail / (1.29 + .77), mid = gy0 + fs * 1.8 + 1.29 * scale;
  sL(gr, B.x, mid, B.x + B.w, mid, {stroke: INK2});
  const barsG = r.map((x, i) => { const g = sG(gr), cx = B.x + i * colW + colW / 2, hh = Math.abs(A2[i]) * scale;
    sR(g, cx - colW * .26, A2[i] >= 0 ? mid - hh : mid, colW * .52, hh, {fill: x ? 'var(--good)' : 'var(--bad)'});
    sT(g, cx, mid + .77 * scale + fs * 2.4, x ? '✓' : '✗', 'sv sv-b', {'text-anchor': 'middle', fill: x ? 'var(--good)' : 'var(--bad)'});
    sT(g, cx, A2[i] >= 0 ? mid - hh - 5 : mid + hh + fs * .95, (A2[i] > 0 ? '+' : '−') + Math.abs(A2[i]).toFixed(2), 'sv-s sv-n', {'text-anchor': 'middle', 'font-size': Math.min(fs * .78, colW / 3.4)});
    return g; });
  mx.in(gr.querySelector('text'), 3); mx.in(gr.querySelector('line'), 3);
  if (mx.tl) barsG.forEach((g, i) => mx.from(g.querySelector('rect'), 3.1 + i * .04, {attr: {height: 0, y: mid}, duration: .4}));
  mx.in(barsG.map(g => [...g.querySelectorAll('text')]).flat(), 3.2);
},
// ---------------------------------------------------------------- 13
13({svg, w, h, fs, mx, arrow}){
  const land = w > h * 1.6;
  const A = land ? {x: 0, y: 0, w: w * .44, h: h * .62} : {x: 0, y: 0, w, h: h * .36};
  const B = land ? {x: w * .5, y: 0, w: w * .5, h: h * .62} : {x: 0, y: h * .36 + fs * .4, w, h: h * .38 - fs * .4};
  const C = land ? {x: 0, y: h * .62 + fs, w, h: h * .38 - fs} : {x: 0, y: h * .74 + fs * .6, w, h: h * .26 - fs * .6};
  // the loop
  const ga = sG(svg), nr = fs * 2.1;
  const R = Math.max(nr * 1.8, Math.min((A.h - nr * 2 - 8) / 1.5, A.w * .32)), cx = A.x + A.w / 2, cy = A.y + nr + 4 + R;
  const nodes = [['think', -90], ['act', 30], ['observe', 150]].map(([t, a]) => ({t, x: cx + R * Math.cos(a * Math.PI / 180), y: cy + R * Math.sin(a * Math.PI / 180)}));
  let loopD = '';
  nodes.forEach((nd, i) => { const nx = nodes[(i + 1) % 3]; const mxp = (nd.x + nx.x) / 2, myp = (nd.y + nx.y) / 2, k = 1.38;
    const c = [cx + (mxp - cx) * k, cy + (myp - cy) * k];
    sP(ga, `M${nd.x},${nd.y} Q${c[0]},${c[1]} ${nx.x},${nx.y}`, {fill: 'none', stroke: INK, 'stroke-width': 2});
    loopD += `${i ? '' : `M${nd.x},${nd.y} `}Q${c[0]},${c[1]} ${nx.x},${nx.y} `; });
  const track = sP(ga, loopD, {fill: 'none', stroke: 'none'});
  const runner = sC(ga, nodes[0].x, nodes[0].y, 6, {fill: LC('agent'), stroke: PAPER, 'stroke-width': 2});
  ga.querySelectorAll('path[stroke-width="2"]').forEach(p => { const L = p.getTotalLength(), a = p.getPointAtLength(L * .52), b = p.getPointAtLength(L * .52 + 1), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    sP(ga, 'M-6,-5 L5,0 L-6,5 z', {fill: INK, transform: `translate(${a.x},${a.y}) rotate(${ang})`}); });
  nodes.forEach(nd => { sC(ga, nd.x, nd.y, nr, {fill: PAPER, stroke: LC('agent'), 'stroke-width': 3.5}); fitW(sT(ga, nd.x, nd.y + 5, nd.t, 'sv sv-b nh', {'text-anchor': 'middle', 'font-size': fs * .88}), nr * 1.8, 9); });
  const TL = track.getTotalLength();
  mx.tick(0, 4, p => { const pt = track.getPointAtLength(((p * 3) % 1) * TL); runner.setAttribute('cx', pt.x); runner.setAttribute('cy', pt.y); });
  if (!mx.tl){ const pt = track.getPointAtLength(TL * .18); runner.setAttribute('cx', pt.x); runner.setAttribute('cy', pt.y); }
  // the protocol: 3 models x 4 tools
  const gb = sG(svg);
  const cnt = sT(gb, B.x + B.w, B.y + fs, '12 connections', 'sv sv-b sv-n', {'text-anchor': 'end', 'font-size': fs * .9});
  const hd = heading(gb, B.x, B.y + fs, 'One link per pair, or one each', fs);
  fitW(hd, B.w - textW(cnt) - fs);
  const mL = measure(gb, 'model 3', 'sv-s') + 14, tL = measure(gb, 'tool 4', 'sv-s') + 18;
  const models = 3, tools = 4, bx0 = B.x + mL, bx1 = B.x + B.w - tL, yy0 = B.y + fs * 2.4, yy1 = B.y + B.h - fs * .6;
  const yT = j => yy0 + j * (yy1 - yy0) / (tools - 1), mY = i => yy0 + (i + .5) * (yy1 - yy0) / models;
  const mesh = [], hub = [];
  for (let i = 0; i < models; i++) for (let j = 0; j < tools; j++) mesh.push(sL(gb, bx0, mY(i), bx1, yT(j), {stroke: RULE2, 'stroke-width': 1.5}));
  const hx = (bx0 + bx1) / 2, hy = (yy0 + yy1) / 2;
  for (let i = 0; i < models; i++) hub.push(sL(gb, bx0, mY(i), hx, hy, {stroke: LC('agent'), 'stroke-width': 2.5}));
  for (let j = 0; j < tools; j++) hub.push(sL(gb, hx, hy, bx1, yT(j), {stroke: LC('agent'), 'stroke-width': 2.5}));
  const hubN = sG(gb); sR(hubN, hx - fs * 2.2, hy - fs * .95, fs * 4.4, fs * 1.9, {fill: LC('agent')}); sT(hubN, hx, hy + 5, 'MCP', 'sv sv-b nh', {'text-anchor': 'middle', 'font-size': fs * .9, fill: 'var(--on-agent)'});
  for (let i = 0; i < models; i++){ sC(gb, bx0, mY(i), 7, {fill: INK}); sT(gb, bx0 - 12, mY(i) + 4, `model ${i + 1}`, 'sv-s', {'text-anchor': 'end'}); }
  for (let j = 0; j < tools; j++){ sR(gb, bx1 - 6, yT(j) - 6, 12, 12, {fill: INK2}); sT(gb, bx1 + 12, yT(j) + 4, `tool ${j + 1}`, 'sv-s'); }
  mx.out(mesh, 2.2, .12); mx.draw(hub, 2.3, .4); mx.pop(hubN, 2.5);
  mx.tick(2.2, .5, p => { cnt.textContent = p < .5 ? '12 connections' : '7 connections'; });
  // SWE-bench
  const gc = sG(svg);
  fitW(heading(gc, C.x, C.y + fs, 'Share of real GitHub issues solved', fs), C.w);
  const swe = by.swe_bench2023, op = by.claude_opus45_2025;
  const l0 = C.x, x1 = C.x + C.w - fs * 5, X = v => l0 + v / 100 * (x1 - l0), bh = Math.min(fs * 1.4, (C.h - fs * 4.6) / 2);
  const b1 = sG(gc), y1 = C.y + fs * 1.8;
  sR(b1, l0, y1, Math.max(3, X(1.96) - l0), bh, {fill: LC('agent')});
  sT(b1, X(1.96) + 8, y1 + bh * .75, `1.96% (SWE-bench, ${year(swe)})`, 'sv sv-n', {'font-size': fs * .85});
  const b2 = sG(gc), y2 = y1 + bh + fs * .7;
  sR(b2, l0, y2, X(80.9) - l0, bh, {fill: LC('agent')});
  sT(b2, X(80.9) + 8, y2 + bh * .75, `80.9%, ${year(op)}`, 'sv sv-b sv-n', {'font-size': fs * .85});
  sT(b2, l0, y2 + bh + fs * 1.1, 'reported by the vendor, on the human-checked Verified subset', 'sv-s', {'font-size': fs * .78});
  fitW(b2.lastChild, C.w, 9);
  mx.in(gc.querySelector('text'), 1); mx.in(b1, 1.05);
  mx.from(b2.querySelector('rect'), 3, {attr: {width: 3}, duration: .6}); mx.in(b2, 3);
},
// ---------------------------------------------------------------- 14
14({svg, w, h, fs, mx}){
  const g = sG(svg);
  const L = [['Serving', 'eff'], ['Tools and actions', 'agent'], ['Reasoning training', 'reason'], ['Alignment', 'align'], ['Long context and retrieval', 'rep'], ['Senses', 'multi'], ['Pretraining', 'scale'], ['Architecture', 'lm'], ['Tokens', 'lm']];
  const tlH = fs * 8.4, sy1 = h - tlH, stackW = Math.min(w * .82, fs * 22), sx = (w - stackW) / 2;
  const lh = Math.min(fs * 2.1, (sy1 - h * .3) / L.length), sy0 = sy1 - lh * L.length, ry = sy0 - fs * 2.6;
  const lines = LORDER.map((k, i) => { const tx = w * .04 + i * (w * .92) / (LORDER.length - 1), ex = sx + 14 + i * (stackW - 28) / (LORDER.length - 1);
    return sP(g, `M${tx},0 C${tx},${ry * .55} ${ex},${ry * .45} ${ex},${ry}`, {fill: 'none', stroke: LC(k), 'stroke-width': 4}); });
  const router = sG(g);
  sR(router, sx, ry, stackW, fs * 2, {fill: INK}); fitW(sT(router, w / 2, ry + fs * 1.35, 'router: how much to think', 'sv sv-b sv-on', {'text-anchor': 'middle', 'font-size': fs * .9}), stackW - 12);
  const rows = L.map(([name, k], i) => { const rg = sG(g), y = sy0 + i * lh;
    sR(rg, sx, y + 1.5, stackW, lh - 3, {fill: PANEL, stroke: RULE2});
    sC(rg, sx + 14, y + lh / 2, 5.5, {fill: LC(k)});
    fitW(sT(rg, sx + 28, y + lh * .64, name, 'sv nh', {'font-size': Math.min(fs * .9, lh * .6)}), stackW - 36); return rg; });
  // 2026: access and rules
  const tg = sG(g), t0 = fs * .4, t1 = w - fs * .4, ty = h - fs * 2.6;
  const fm = by.claude_fable_mythos_2026, eu = by.eu_ai_act_gpai_2026;
  const d0 = dateFrac('2026-05-25'), d1 = dateFrac('2026-08-12'), TX = d => t0 + (d - d0) / (d1 - d0) * (t1 - t0);
  sT(tg, t0, ty - fs * 3.5, 'Access and rules, 2026', 'sv sv-b', {'font-size': fs * .9});
  sL(tg, t0, ty, t1, ty, {stroke: LC('soc'), 'stroke-width': 4});
  const ev = [[fm.date, '9 Jun', 'Fable 5 released'], ['2026-06-12', '12 Jun', 'suspended'], ['2026-07-01', '1 Jul', 'restored'], [eu.date, '2 Aug', 'EU AI Act applies']];
  const placed = {up: [], dn: []};
  ev.forEach(([d, day, what], i) => {
    const x = TX(dateFrac(d)), side = i % 2 ? 'dn' : 'up';
    sC(tg, x, ty, 5.5, {fill: PAPER, stroke: INK, 'stroke-width': 2.5});
    const t = sT(tg, x, 0, `${day} ${what}`, 'sv-s', {'font-size': fs * .78, 'font-weight': 700});
    const tw2 = textW(t); let lx = Math.max(t0, Math.min(t1 - tw2, x - tw2 / 2));
    let lvl = 0; while (placed[side].some(p => p.lvl === lvl && lx < p.r + 8 && lx + tw2 > p.l - 8)) lvl++;
    placed[side].push({l: lx, r: lx + tw2, lvl});
    t.setAttribute('x', lx); t.setAttribute('y', side === 'up' ? ty - fs * (.8 + lvl * 1.15) : ty + fs * (1.5 + lvl * 1.15));
  });
  if (mx.tl) [...rows].reverse().forEach((r, i) => mx.tl.from(r, {opacity: 0, x: (i % 2 ? 1 : -1) * 24, duration: .45, ease: 'expo.out'}, 1 + i * .07));
  mx.rise(router, 2); mx.in(tg, 3); if (mx.tl) mx.tl.from(tg.querySelectorAll('circle'), {scale: 0, transformOrigin: '50% 50%', stagger: .08, duration: .3}, 3.1);
}
};
const SCENES = Object.fromEntries(Object.entries(SCENE_COPY).map(([k, v]) => [k, Object.assign({}, v, {build: BUILD[k]})]));
