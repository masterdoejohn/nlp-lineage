// ===================== RUNTIME =====================
const labTotal = document.querySelectorAll('.lab:not(.lab-check)').length;
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
document.getElementById('lab-count').textContent = NUMW[labTotal] || String(labTotal);
if (MOTION) ScrollTrigger.config({ignoreMobileResize: true});
const barH = () => document.querySelector('.topbar').offsetHeight;
const isPhone = () => innerWidth < 960;

// ---------- the opening diagram: every thread from its first year to 2026 ----------
const heroFig = document.getElementById('hero-map');
function drawHero(animate){
  const old = heroFig.querySelector('svg'); if (old) old.remove();
  const W = Math.max(280, Math.round(heroFig.clientWidth || 640));
  const narrow = W < 520, fs = narrow ? 12 : 12.5, cwid = fs * .54;
  const rows = LORDER.slice().sort((a, b) => firstYear[a].localeCompare(firstYear[b]) || LORDER.indexOf(a) - LORDER.indexOf(b));
  const rh = narrow ? 26 : 32, top = 18, base = top + rows.length * rh + 6, H = base + 30;
  const x0 = 6, xC = W - (narrow ? 58 : 70), BRK = 2012, share = narrow ? .24 : .3;
  const X = t => t <= BRK ? x0 + (t - 1948) / (BRK - 1948) * (xC - x0) * share : x0 + (xC - x0) * share + (t - BRK) / (2026 - BRK) * (xC - x0) * (1 - share);
  const midY = top + rows.length * rh / 2, gapE = 6.5, xb = X(2023.6);
  const svg = el('svg', {viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
    'aria-label': 'Ten research threads and the year each first appears in this history: ' + rows.map(l => `${LINE[l].name}, ${year({date: firstYear[l]})}`).join('; ') + '. All ten meet in the frontier models of 2026.'});
  heroFig.insertBefore(svg, heroFig.firstChild);
  // time axis, compressed before 2012
  const ax = el('g', {}, svg);
  el('line', {x1: x0, x2: xC, y1: base, y2: base, stroke: 'var(--rule-2)', 'stroke-width': 1}, ax);
  (narrow ? [1948, 2012, 2017, 2022] : [1948, 1970, 1990, 2012, 2016, 2020, 2024]).forEach(t => {
    el('line', {x1: X(t), x2: X(t), y1: base, y2: base + 5, stroke: 'var(--rule-2)'}, ax);
    const tx = el('text', {x: X(t), y: base + 19, class: 'hm-year', 'text-anchor': t === 1948 ? 'start' : 'middle'}, ax); tx.textContent = t;
  });
  const bx = X(BRK);
  el('path', {d: `M${bx - 5},${base + 4} l4,-8 M${bx},${base + 4} l4,-8`, stroke: 'var(--muted)', 'stroke-width': 1.3, fill: 'none'}, ax);
  // the threads
  const paths = [], marks = [];
  rows.forEach((l, i) => {
    const y = top + i * rh + rh / 2, xs = X(+firstYear[l].slice(0, 4) + (+firstYear[l].slice(5, 7) || 6) / 12), ye = midY + (i - (rows.length - 1) / 2) * gapE;
    const d = `M${xs},${y} L${xb},${y} C${xb + (xC - xb) * .6},${y} ${xC - (xC - xb) * .5},${ye} ${xC},${ye}`;
    paths.push(el('path', {d, stroke: LINE[l].c, 'stroke-width': narrow ? 4.5 : 5.5, fill: 'none', 'stroke-linecap': 'butt'}, svg));
    const g = el('g', {}, svg);
    el('circle', {cx: xs, cy: y, r: narrow ? 4.5 : 5.5, fill: 'var(--paper)', stroke: LINE[l].c, 'stroke-width': 3}, g);
    // the label sits left of the thread's first station when it fits there, otherwise above the thread,
    // clear of the bend where the threads converge
    const t = el('text', {x: 0, y: 0, class: 'hm-label'}, g);
    t.textContent = `${LINE[l].name}, ${firstYear[l].slice(0, 4)}`;
    const tw = t.getComputedTextLength() || t.textContent.length * cwid;
    if (xs - x0 >= tw + 14){ t.setAttribute('x', xs - 11); t.setAttribute('y', y + fs * .36); t.setAttribute('text-anchor', 'end'); }
    else { t.setAttribute('x', Math.max(x0, Math.min(xs, xb - tw - 6))); t.setAttribute('y', y - 9); }
    marks.push(g);
  });
  // where they meet
  const ph = rows.length * gapE + 10;
  const pill = el('g', {}, svg);
  el('rect', {x: xC - 7, y: midY - ph / 2, width: 14, height: ph, rx: 7, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 3}, pill);
  const e1 = el('text', {x: xC + 14, y: midY - 2, class: 'hm-end'}, pill); e1.textContent = '2026';
  const e2 = el('text', {x: xC + 14, y: midY + 15, class: 'hm-label'}, pill); e2.textContent = 'frontier';
  const e3 = el('text', {x: xC + 14, y: midY + 30, class: 'hm-label'}, pill); e3.textContent = 'models';
  if (animate && MOTION){
    paths.forEach(p => p.setAttribute('pathLength', '1'));
    const tl = gsap.timeline({defaults: {ease: 'power2.inOut'}});
    tl.from(ax, {opacity: 0, duration: .5, ease: 'none'}, 0);
    rows.forEach((l, i) => {
      const at = .15 + (+firstYear[l].slice(0, 4) >= BRK ? .45 : 0) + i * .07;
      tl.from(marks[i], {opacity: 0, duration: .35, ease: 'none'}, at);
      tl.fromTo(paths[i], {strokeDasharray: '1 1', strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 1.1}, at);
    });
    tl.from(pill, {opacity: 0, scale: .5, svgOrigin: `${xC} ${midY}`, duration: .6, ease: 'expo.out'}, '-=.35');
  }
}

// ---------- scenes ----------
function buildScene(r){
  r.sts.forEach(s => s.kill()); r.sts = [];
  if (r.tl){ r.tl.kill(); r.tl = null; }
  r.stage.innerHTML = '';
  const def = SCENES[r.n];
  const w = Math.max(240, Math.round(r.stage.clientWidth)), hh = Math.max(220, Math.round(r.stage.clientHeight));
  const fs = Math.max(12.5, Math.min(17, Math.min(w, hh) / 34));
  const mk = (cls) => el('svg', {viewBox: `0 0 ${w} ${hh}`, width: w, height: hh, style: `--fs:${fs}px`, class: cls || ''}, r.stage);
  // draw the finished picture once, unseen, to centre it in the stage and to catch anything drawn outside it
  const probe = mk('probe');
  let bb = null;
  try { def.build({svg: probe, w, h: hh, fs, mx: MX(null), arrow: arrowHead(probe, 'pr' + r.n)}); bb = probe.getBBox(); }
  catch (err){ console.error('scene ' + r.n, err); }
  probe.remove();
  const svg = mk(); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', def.label);
  r.over = bb ? {l: Math.round(-bb.x), r: Math.round(bb.x + bb.width - w), t: Math.round(-bb.y), b: Math.round(bb.y + bb.height - hh)} : null;
  if (bb && bb.height < hh - 8){ const oy = Math.round(bb.y + bb.height / 2 - hh / 2); svg.setAttribute('viewBox', `0 ${Math.max(bb.y + bb.height - hh + 2, Math.min(bb.y - 2, oy))} ${w} ${hh}`); }
  const tl = MOTION ? gsap.timeline({paused: true, defaults: {ease: 'power2.out', duration: .5}}) : null;
  try { def.build({svg, w, h: hh, fs, mx: MX(tl), arrow: arrowHead(svg, 'ah' + r.n)}); }
  catch (err){ console.error('scene ' + r.n, err); }
  if (!tl) return;
  tl.set({}, {}, def.steps.length);
  r.tl = tl;
  // step k's change plays as its text comes into view: from the bottom of the screen on phones (the text
  // passes under the pinned figure), from 70% down on wider screens
  const line = isPhone() ? '100%' : '70%', first = r.steps[0], last = r.steps[r.steps.length - 1];
  r.sts.push(ScrollTrigger.create({trigger: first, start: 'top ' + line, endTrigger: last, end: 'bottom ' + line, scrub: .6, animation: tl}));
  r.steps.forEach(li => r.sts.push(ScrollTrigger.create({trigger: li, start: 'top ' + line, end: 'bottom ' + line, toggleClass: {targets: li, className: 'on'}})));
}
function buildScenes(){ SCN.forEach(buildScene); }

// chapter openers: the card opens out as it arrives
function openers(){
  if (!MOTION) return;
  document.querySelectorAll('.opener').forEach(op => {
    gsap.fromTo(op, {clipPath: 'inset(7% 3% 7% 3% round 12px)'}, {clipPath: 'inset(0% 0% 0% 0% round 12px)', ease: 'none', scrollTrigger: {trigger: op, start: 'top bottom', end: 'top 35%', scrub: .4}});
    gsap.fromTo(op.querySelector('.op-num'), {yPercent: 30}, {yPercent: 0, ease: 'none', scrollTrigger: {trigger: op, start: 'top bottom', end: 'top 25%', scrub: .4}});
  });
}

// ---------- where am I: the route strip ----------
const barFill = document.getElementById('bar-fill'), where = document.getElementById('where');
const barLinks = [...barRoute.querySelectorAll('a')], secs = SCN.map(r => r.sec);
let curStop = -1, rafOn = false;
function barUpdate(){
  rafOn = false;
  const mid = innerHeight * .5;
  let i = -1, f = 0;
  for (let k = 0; k < secs.length; k++){ if (secs[k].getBoundingClientRect().top <= mid) i = k; else break; }
  if (i >= 0) f = i < secs.length - 1 ? (i + (mid - secs[i].getBoundingClientRect().top) / (secs[i + 1].getBoundingClientRect().top - secs[i].getBoundingClientRect().top)) / (secs.length - 1) : 1;
  barFill.style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`;
  const tail = document.getElementById('network').getBoundingClientRect().top <= mid ? (document.getElementById('trace').getBoundingClientRect().top <= mid ? 16 : 15) : 0;
  const stop = tail || i + 1;
  if (stop === curStop) return;
  curStop = stop;
  where.innerHTML = stop === 0 ? 'The route' : stop <= 14 ? `<b>${stop} of 14</b>${esc(CH[stop - 1].title)}` : `<b>After the route</b>${stop === 16 ? 'Trace a lineage' : 'The whole system'}`;
  barLinks.forEach((a, k) => { a.classList.toggle('done', k < stop - 1); a.classList.toggle('now', k === stop - 1); if (k === stop - 1) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
}
addEventListener('scroll', () => { if (!rafOn){ rafOn = true; requestAnimationFrame(barUpdate); } }, {passive: true});

// ---------- the whole system: one map of every station ----------
function wrapLabel(s, max){
  const words = s.replace(/([-\/])(?=\S)/g, '$1 ').split(' '), out = []; let cur = '';
  words.forEach(w => { const glue = /[-\/]$/.test(cur) ? '' : ' '; if ((cur + glue + w).trim().length > max && cur){ out.push(cur); cur = w; } else cur = (cur + glue + w).trim(); });
  if (cur) out.push(cur);
  return out.slice(0, 3);
}
// A line earns a track only if at least two stations sit on it, so one-off memberships do not add a whole track.
function planLines(stations){
  const count = {}; stations.forEach(s => s.lines.forEach(l => count[l] = (count[l] || 0) + 1));
  const used = new Set(LORDER.filter(l => count[l] >= 2));
  const member = new Map();
  stations.forEach(s => { let m = s.lines.filter(l => used.has(l)); if (!m.length){ m = [s.lines[0]]; used.add(s.lines[0]); } member.set(s.id, m); });
  return {used: LORDER.filter(l => used.has(l)), member};
}
function bindStation(g, s){
  g.addEventListener('click', () => openCard(s.id, g));
  g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); openCard(s.id, g); } });
}
function stationMarks(g, pts, key, s, colour){
  const r = key ? 8.5 : (s.tp ? 7 : 6), sw = key ? 3.5 : 3;
  if (pts.length > 1){
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    el('line', {x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys), stroke: 'var(--ink)', 'stroke-width': 2.5}, g);
  }
  pts.forEach(([x, y]) => el('circle', {cx: x, cy: y, r, fill: 'var(--station)', stroke: pts.length > 1 || key ? 'var(--ink)' : colour, 'stroke-width': sw}, g));
  if (key) pts.forEach(([x, y]) => el('circle', {cx: x, cy: y, r: 2.8, fill: 'var(--ink)'}, g));
}
function strip(fig, ids, opt = {}){
  const stations = ids.map(i => by[i]).sort((a, b) => a.ord - b.ord);
  const {used, member} = planLines(stations);
  const avail = fig.clientWidth || 700, vertical = avail < 600, keys = opt.keys || [];
  fig.innerHTML = '';
  const sc = h('div', 'map-scroll'); fig.appendChild(sc);
  let svg, W, H;
  if (!vertical){
    const pad = 26, cw = opt.cw || 84;
    W = Math.round(pad * 2 + cw * stations.length);
    const yb = 24, LH = yb + 64, RH = 22, top = LH + 16;
    H = top + (used.length - 1) * RH + 26;
    const rowY = l => top + used.indexOf(l) * RH, colX = i => pad + cw * i + cw / 2;
    svg = el('svg', {width: W, height: H, viewBox: `0 0 ${W} ${H}`}); sc.appendChild(svg);
    let last = ''; stations.forEach((s, i) => { const y = year(s); if (y !== last){ last = y; const x = colX(i) - cw / 2;
      el('line', {x1: x, x2: x, y1: 2, y2: H - 6, stroke: 'var(--rule)', 'stroke-width': 1}, svg);
      const t = el('text', {x: x + 5, y: 16, class: 'hm-year', style: 'fill:var(--ink)'}, svg); t.textContent = y; } });
    used.forEach(l => {
      const cols = stations.map((s, i) => member.get(s.id).includes(l) ? i : -1).filter(i => i >= 0);
      let x1 = colX(cols[0]), x2 = colX(cols[cols.length - 1]); if (x1 === x2){ x1 -= 12; x2 += 12; }
      el('path', {class: 'trk', d: `M${x1},${rowY(l)} L${x2},${rowY(l)}`, stroke: LINE[l].c, 'stroke-width': 6}, svg);
    });
    stations.forEach((s, i) => {
      const m = member.get(s.id), x = colX(i), key = keys.includes(s.id), y1 = Math.min(...m.map(rowY));
      const g = el('g', {class: 'st' + (key ? ' key' : ''), tabindex: 0, role: 'button', 'aria-label': `${s.short}, ${when(s)}. Open study card`, 'data-x': x - cw / 2}, svg);
      el('rect', {class: 'hit', x: x - cw / 2 + 2, y: yb + 2, width: cw - 4, height: H - yb - 6}, g);
      const lines = wrapLabel(s.short, 11), ly = yb + 36 - (lines.length - 1) * 14;
      lines.forEach((t, k) => { el('text', {class: 'lbl', x, y: ly + k * 14, 'text-anchor': 'middle'}, g).textContent = t; });
      el('text', {class: 'yr', x, y: yb + 50, 'text-anchor': 'middle'}, g).textContent = year(s);
      el('line', {class: 'lead', x1: x, x2: x, y1: yb + 56, y2: y1 - 11}, g);
      stationMarks(g, m.map(l => [x, rowY(l)]), key, s, LINE[m[0]].c);
      bindStation(g, s);
    });
  } else {
    // phones: time runs downward, threads run as vertical tracks, names sit to the right
    const pad = 10, TW = 18, RH = 40, top = 16, labelX = pad + used.length * TW + 14;
    W = avail; H = top + stations.length * RH + 8;
    const colX = l => pad + used.indexOf(l) * TW + 8, rowY = i => top + i * RH + 12;
    svg = el('svg', {width: W, height: H, viewBox: `0 0 ${W} ${H}`}); sc.appendChild(svg);
    used.forEach(l => {
      const rows = stations.map((s, i) => member.get(s.id).includes(l) ? i : -1).filter(i => i >= 0);
      let y1 = rowY(rows[0]), y2 = rowY(rows[rows.length - 1]); if (y1 === y2){ y1 -= 10; y2 += 10; }
      el('path', {class: 'trk', d: `M${colX(l)},${y1} L${colX(l)},${y2}`, stroke: LINE[l].c, 'stroke-width': 5}, svg);
    });
    let lastY = '';
    stations.forEach((s, i) => {
      const m = member.get(s.id), y = rowY(i), key = keys.includes(s.id);
      const g = el('g', {class: 'st' + (key ? ' key' : ''), tabindex: 0, role: 'button', 'aria-label': `${s.short}, ${when(s)}. Open study card`}, svg);
      el('rect', {class: 'hit', x: 0, y: y - RH / 2 + 2, width: W, height: RH - 4}, g);
      const xr = Math.max(...m.map(colX));
      el('line', {class: 'lead', x1: xr + 9, x2: labelX - 6, y1: y, y2: y}, g);
      stationMarks(g, m.map(l => [colX(l), y]), key, s, LINE[m[0]].c);
      const name = el('text', {class: 'lbl', x: labelX, y: y + 4.5, 'font-size': key ? 15.5 : 14.5}, g); name.textContent = s.short;
      const yt = el('text', {class: 'yr', x: W - 4, y: y + 4.5, 'text-anchor': 'end'}, g); yt.textContent = year(s) === lastY ? '' : year(s); lastY = year(s);
      bindStation(g, s);
    });
  }
  const lg = h('div', 'map-legend');
  used.forEach(l => lg.appendChild(h('span', '', `<i style="background:${LINE[l].c}"></i>${esc(LINE[l].name)}`)));
  fig.appendChild(lg);
  sc.setAttribute('role', 'region'); sc.setAttribute('aria-label', opt.label || 'Map of stations');
  if (W > avail + 4){ sc.setAttribute('tabindex', '0'); fig.appendChild(h('p', 'map-hint', opt.hint || 'Scroll the map sideways to see every station.')); }
  return sc;
}
const ALL = [...new Set(CH.flatMap(c => c.stations))];
let mapTween = null;
function drawMap(){
  if (mapTween){ mapTween.scrollTrigger.kill(true); mapTween.kill(); mapTween = null; }
  const fig = document.getElementById('netmap'), wrap = fig.parentElement;
  wrap.classList.remove('motion-map');
  const pinnable = MOTION && !isPhone();
  const sc = strip(fig, ALL, {keys: CH.flatMap(c => c.keystones), label: 'Every station on the route, in date order', hint: pinnable ? 'Keep scrolling down to travel along the map. Each column is one station.' : ''});
  const dist = sc.scrollWidth - sc.clientWidth;
  if (!pinnable || dist < 40 || wrap.offsetHeight > innerHeight - barH() - 48) return;
  wrap.classList.add('motion-map');
  sc.scrollLeft = 0;
  mapTween = gsap.to(sc, {scrollLeft: dist, ease: 'none', scrollTrigger: {trigger: wrap, start: 'center 55%', end: '+=' + dist, pin: true, scrub: .3, invalidateOnRefresh: true}});
  // keyboard: moving focus along the map scrolls the page to the matching point of the ride
  sc.addEventListener('focusin', ev => {
    const g = ev.target.closest && ev.target.closest('.st'); if (!g || !mapTween) return;
    const st = mapTween.scrollTrigger, x = +g.dataset.x + 42;
    const p = Math.max(0, Math.min(1, (x - sc.clientWidth / 2) / dist));
    window.scrollTo(0, st.start + p * (st.end - st.start));
  });
}

// ---------- study card: a spec sheet ----------
const sheet = document.getElementById('sheet'), sheetIn = document.getElementById('sheet-in');
let opener = null;
function relList(id, dir){
  const es = E.filter(e => dir === 'in' ? e.t === id : e.f === id);
  if (!es.length) return '<p class="muted">None recorded in the sources used.</p>';
  const groups = {};
  es.forEach(e => (groups[relGroup(e.rel)] ||= []).push(e));
  return ['direct', 'influence', 'succession', 'parallel'].filter(g => groups[g]).map(g => {
    const names = dir === 'in' ? GROUP_IN : GROUP_OUT;
    return `<div class="rel-group"><h5>${names[g]}</h5>` + groups[g].sort((a, b) => by[a.f].ord - by[b.f].ord).map(e => {
      const o = by[dir === 'in' ? e.f : e.t];
      return `<button type="button" data-go="${o.id}" class="${isWeak(e.ev) ? 'weak' : ''}"><b>${esc(o.short)}</b>, ${year(o)}${isWeak(e.ev) ? ` <span class="q">(${QUAL[e.ev]})</span>` : ''}</button>`;
    }).join('') + '</div>';
  }).join('');
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function openCard(id, from){
  const n = by[id], st = S.study[id], hl = home(n), chap = CH[n.ch - 1];
  opener = from || opener;
  const flags = [];
  if (n.tp) flags.push('A turning point in this history.');
  if (n.claim === 'vendor-reported') flags.push('Figures quoted here are reported by the organisation that built it, not independently verified.');
  if (n.claim === 'peer-reviewed') flags.push('The key result has been peer reviewed.');
  const phase = (n.phase || []).map(p => `Phase ${p}, ${S.phases[p]}`).join('; ');
  const cells = [['Date', when(n)], ['Kind', cap(n.type)], ['Organisation', n.inst], ['Access', n.lic && n.lic !== 'n/a' ? n.lic : 'Not applicable'],
    ['Chapter', `${chap.n}. ${chap.title}`], ['Threads', n.lines.map(l => LINE[l].name).join(', ')]];
  sheetIn.innerHTML = `
    <div class="sh-head" style="--c:${hl.c};--on:${hl.on}"><h3 id="sheet-title">${esc(n.short)}</h3><button type="button" class="sh-close" id="close">Close</button></div>
    <div class="sh-body sh-first"><p class="sh-full">${esc(n.title)}</p><p class="sh-by">${esc(n.authors)}</p></div>
    <dl class="sh-grid">${cells.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <div class="sh-body">
    ${flags.map(f => `<p class="flag">${esc(f)}</p>`).join('')}
    <h4>Why it matters</h4><p>${esc(n.why)}</p>
    ${st ? `<h4>To understand it, learn</h4><ul>${st.understand.map(u => `<li>${esc(u)}</li>`).join('')}</ul><h4>Helpful first</h4><p>${esc(st.prereq)}</p>` : ''}
    <h4>What it introduced</h4><p>${esc(n.breakthrough)}</p>
    <h4>What modern models inherit</h4><p>${esc(n.inherits)}</p>
    <h4>Where it came from</h4>${relList(id, 'in')}
    <h4>What it led to</h4>${relList(id, 'out')}
    ${phase ? `<h4>On the study roadmap</h4><p>${esc(phase)}</p>` : ''}
    </div>
    <div class="sh-actions"><a href="/milestones/${esc(n.id)}/">Open the full page</a><a href="${esc(n.src)}" target="_blank" rel="noopener">Read the source</a><button type="button" id="trace-this">Trace its lineage</button><a href="#ch-${chap.n}" id="goto-ch">Go to chapter ${chap.n}</a></div>`;
  sheetIn.querySelector('#close').onclick = () => sheet.close();
  sheetIn.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { openCard(b.dataset.go); sheetIn.scrollTop = 0; });
  sheetIn.querySelector('#trace-this').onclick = () => { sheet.close(); setTrace(id, true); document.getElementById('trace').scrollIntoView(); };
  sheetIn.querySelector('#goto-ch').onclick = () => sheet.close();
  if (!sheet.open) sheet.showModal();
  sheetIn.scrollTop = 0;
  sheetIn.querySelector('#close').focus();
}
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
sheet.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus({preventScroll: true}); });

// ---------- lineage tracer ----------
const picker = document.getElementById('picker'), weakBox = document.getElementById('weak'), traceList = document.getElementById('trace-list');
let traceRoot = S.trace[0], showAll = false;
function renderPicker(){
  picker.innerHTML = '';
  const ids = S.trace.includes(traceRoot) ? S.trace : [...S.trace, traceRoot];
  ids.forEach(id => { const b = h('button', '', esc(by[id].short)); b.type = 'button'; b.setAttribute('aria-pressed', id === traceRoot); b.onclick = () => setTrace(id, true); picker.appendChild(b); });
}
function setTrace(id, anim){ traceRoot = id; showAll = false; renderPicker(); renderTrace(anim); }
function renderTrace(anim){
  const allowWeak = weakBox.checked;
  // ancestry follows descent only: building on, influence and succession. Parallel work is not an ancestor.
  const ok = e => relGroup(e.rel) !== 'parallel' && (allowWeak || !isWeak(e.ev));
  const depth = {[traceRoot]: 0}, q = [traceRoot];
  while (q.length){ const c = q.shift();
    E.filter(e => e.t === c && ok(e)).forEach(e => { if (!(e.f in depth)){ depth[e.f] = depth[c] + 1; q.push(e.f); } }); }
  const all = Object.keys(depth).filter(i => i !== traceRoot).sort((a, b) => by[b].ord - by[a].ord);
  const brief = all.filter(i => by[i].tp || depth[i] === 1);
  const ids = showAll ? all : brief;
  const root = by[traceRoot];
  const oldest = all.length ? by[all[all.length - 1]] : null;
  const chs = new Set(all.map(i => by[i].ch));
  document.getElementById('trace-sum').textContent = all.length
    ? `${root.short} has ${all.length} ${allowWeak ? 'recorded ancestors, including indirect ones,' : 'documented ancestors'} across ${chs.size} chapters, reaching back to ${oldest.short} in ${year(oldest)}. ${showAll ? 'Showing all of them.' : `Showing its direct parents and the ${brief.filter(i => by[i].tp).length} turning points among them.`}`
    : `No documented ancestors are recorded for ${root.short}.`;
  traceList.innerHTML = '';
  const row = (n, isRoot, i) => {
    const li = h('li', (isRoot ? 'root' : '') + (anim && MOTION ? ' enter' : ''));
    li.style.setProperty('--c', home(n).c); li.style.setProperty('--i', i);
    let via;
    if (isRoot) via = 'The model you are tracing.';
    else {
      const shown = new Set([traceRoot, ...ids]);
      const outs = E.filter(e => e.f === n.id && (e.t in depth) && ok(e) && depth[e.t] < depth[n.id])
        .sort((a, b) => shown.has(b.t) - shown.has(a.t)).slice(0, 3);
      via = outs.map(e => `${esc(by[e.t].short)} ${TRACE_VERB[relGroup(e.rel)]}${isWeak(e.ev) ? ` <em>(${QUAL[e.ev]})</em>` : ''}`).join('<br>');
    }
    li.innerHTML = `<span class="yr">${year(n)}</span><span class="sw" aria-hidden="true"></span><span><button type="button" class="nm">${esc(n.short)}</button><span class="via">${via}</span></span>`;
    li.querySelector('button').onclick = ev => openCard(n.id, ev.currentTarget);
    traceList.appendChild(li);
  };
  row(root, true, 0);
  ids.forEach((id, k) => row(by[id], false, Math.min(k + 1, 24)));
  const more = document.getElementById('trace-more');
  more.hidden = all.length === brief.length;
  more.textContent = showAll ? 'Show the short version' : `Show all ${all.length} ancestors`;
  if (anim && MOTION) gsap.fromTo(traceList, {'--draw': 0}, {'--draw': 1, duration: Math.min(1.4, .4 + ids.length * .04), ease: 'power2.out'});
  if (MOTION) ScrollTrigger.refresh();
}
document.getElementById('trace-more').onclick = () => { showAll = !showAll; renderTrace(true); };
weakBox.onchange = () => renderTrace(true);

// ---------- start, and keep the layout right ----------
// the opening diagram measures its labels, so it waits briefly for the web fonts before it draws itself
let heroDrawn = false;
const heroGo = () => { if (heroDrawn) return; heroDrawn = true; drawHero(true); };
if (document.fonts && document.fonts.ready) document.fonts.ready.then(heroGo);
setTimeout(heroGo, 450);
buildScenes();
openers();
drawMap();
setTrace(traceRoot, false);
barUpdate();
let lastW = innerWidth, lastH = innerHeight, rT = null;
function relayout(){
  if (heroDrawn) drawHero(false); buildScenes(); drawMap(); RENDERERS.forEach(f => f());
  if (MOTION) ScrollTrigger.refresh();
  curStop = -1; barUpdate();
}
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => {
  const dw = Math.abs(innerWidth - lastW), dh = Math.abs(innerHeight - lastH);
  if (dw < 24 && !(dh > 80 && !isPhone())) return;
  lastW = innerWidth; lastH = innerHeight; relayout();
}, 180); });
// text widths change when the web fonts arrive, so the scenes are drawn again then
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildScenes(); if (MOTION) ScrollTrigger.refresh(); barUpdate(); });
window.__scenes = {SCN, buildScene, relayout, seek(n, t){ const r = SCN[n - 1]; if (!r.tl) return false; r.sts[0].disable(false); r.tl.time(t); return true; }};
