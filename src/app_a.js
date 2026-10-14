// ===================== DATA AND HELPERS =====================
const P = __PAYLOAD__;
const N = P.nodes, E = P.edges, S = P.story;
const by = Object.fromEntries(N.map(n => [n.id, n]));
// Line colours live in CSS tokens so both themes stay validated; the payload hex values are not used.
const LINE = Object.fromEntries(S.lines.map(([k, name]) => [k, {k, name, c: `var(--c-${k})`, on: `var(--on-${k})`}]));
// The order the categorical palette was validated in: neighbours in this order stay distinguishable.
const LORDER = ['lm', 'align', 'rep', 'eff', 'reason', 'open', 'multi', 'agent', 'soc', 'scale'].filter(k => LINE[k]);
const CH = S.chapters;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION = !reduce && !!(window.gsap && window.ScrollTrigger);
if (MOTION){ gsap.registerPlugin(ScrollTrigger); document.documentElement.classList.add('motion'); }
const svgNS = 'http://www.w3.org/2000/svg';
const el = (t, a = {}, p) => { const e = document.createElementNS(svgNS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const h = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function when(n){ const [y, m, d] = n.date.split('-'); if (n.dprec === 'year' || !m) return y; if (n.dprec === 'month' || !d) return `${MO[+m - 1]} ${y}`; return `${+d} ${MO[+m - 1]} ${y}`; }
const year = n => n.date.slice(0, 4);
const firstSentence = s => { const m = s.match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : s; };
const home = n => LINE[n.lines[0]];
const span = s => s.replace(' to ', '–');

// ---------- relationship semantics ----------
const GROUP_IN = {direct: 'Built directly on', influence: 'Influenced by', succession: 'Succeeded', parallel: 'Developed alongside'};
const GROUP_OUT = {direct: 'Built on directly by', influence: 'Influenced', succession: 'Replaced by', parallel: 'Developed alongside'};
function relGroup(rel){
  if (rel === 'directly built upon') return 'direct';
  if (rel === 'superseded') return 'succession';
  if (['complementary development', 'independently contributed', 'historically adjacent'].includes(rel)) return 'parallel';
  return 'influence';
}
const QUAL = {'plausible-indirect': 'indirect influence', 'coincidence': 'timing only, no documented link', 'retrospective': 'a later reading, not a stated link'};
const isWeak = ev => ev in QUAL;
const TRACE_VERB = {direct: 'built directly on this', influence: 'was influenced by this', succession: 'succeeded this', parallel: 'developed alongside this'};

// ---------- which line colours each chapter ----------
// Chapters 8 to 13 each follow one thread. Earlier chapters take the line most of their milestones sit on;
// chapter 7 is about products, and chapter 14 is where every line meets, so it opens on ink.
const CH_LINE = {1: 'lm', 2: 'rep', 3: 'lm', 4: 'lm', 5: 'scale', 6: 'align', 7: 'soc', 8: 'open', 9: 'eff', 10: 'rep', 11: 'multi', 12: 'reason', 13: 'agent', 14: null};
const chC = n => CH_LINE[n] ? LINE[CH_LINE[n]].c : 'var(--c-ink-field)';
const chOn = n => CH_LINE[n] ? LINE[CH_LINE[n]].on : 'var(--on-ink-field)';
const chLineName = n => CH_LINE[n] ? LINE[CH_LINE[n]].name : 'All ten threads';
const firstYear = (() => { const f = {}; [...N].sort((a, b) => a.ord - b.ord).forEach(n => n.lines.forEach(l => { if (!(l in f)) f[l] = n.date; })); return f; })();

// ---------- the route strip and the route index ----------
const barRoute = document.getElementById('bar-route'), routeIdx = document.getElementById('route');
CH.forEach(c => {
  const a = h('a'); a.href = '#ch-' + c.n; a.style.setProperty('--c', chC(c.n));
  a.setAttribute('aria-label', `Chapter ${c.n}: ${c.title}`); a.appendChild(h('i')); barRoute.appendChild(a);
  const li = h('li'); li.style.setProperty('--c', chC(c.n));
  li.innerHTML = `<a href="#ch-${c.n}" aria-label="Chapter ${c.n}: ${esc(c.title)}, ${esc(c.years)}"><span class="n"><i aria-hidden="true"></i>${c.n}</span><span class="t">${esc(c.title)}</span><span class="y">${esc(span(c.years))}</span></a>`;
  routeIdx.appendChild(li);
  if (c.n === 7) routeIdx.appendChild(h('li', 'ri-split', 'After stop 7 the route splits: each of the next six stops follows one thread from its start to the present.'));
});

// ---------- copy that sits around the scenes ----------
// One line per chapter for the reader to keep. Written from the chapter text.
const TAKE = {
  1: 'Counting gives zero probability to anything it has not seen. Learned word vectors let similar words share what the model knows.',
  2: 'Cheap training gave word meanings a geometry. Sequence-to-sequence made translation one learned step, but it forced the whole input through one vector.',
  3: 'Attention lets each word look at every other word. The Transformer kept only attention, so training became parallel and scale became affordable.',
  4: 'Pretraining learns language once, and tasks come later. GPT guesses the next word and looks only back. BERT fills in hidden words and looks both ways.',
  5: 'Loss falls predictably as models grow. For a fixed budget, grow the data with the model: about 20 tokens per parameter.',
  6: 'Alignment trains toward what people prefer. It steers and draws out what pretraining put there; it adds little knowledge.',
  7: 'ChatGPT added no new capability. Its breakthrough was a free interface that anyone could use.',
  8: 'Open-weight means you can download and run the model. It usually does not mean open training data or an unrestricted licence.',
  9: 'Memory is the limit. Fewer bits per weight, small adapters and a smaller cache are what moved models from datacentres to laptops.',
  10: 'Weights hold frozen knowledge. Retrieval brings current or private text into view when the model answers, so it can cite it.',
  11: 'Patches turn an image into tokens. A shared image-text space lets one model connect pictures with words.',
  12: 'Computation at answer time can substitute for size. Reinforcement learning can teach a model to use that computation well.',
  13: 'An agent is a loop: think, act, observe, repeat. Tools supply facts that memory alone cannot.',
  14: 'A 2026 frontier model combines every thread on this route. Access tiers and government rules are now part of the story too.'
};
// Video lessons, checked to exist before linking. They open on the publisher's site.
const WATCH = {
  3: [['3Blue1Brown: Attention in transformers, step-by-step', 'https://www.3blue1brown.com/lessons/attention', 'Deep Learning, chapter 6 (2024). A visual explanation of queries, keys and values. Opens on 3blue1brown.com.']],
  4: [['3Blue1Brown: Transformers, the tech behind LLMs', 'https://www.3blue1brown.com/lessons/gpt', 'Deep Learning, chapter 5. How a GPT turns text into a prediction of the next word. Opens on 3blue1brown.com.'],
      ['Andrej Karpathy: Let’s build GPT: from scratch, in code, spelled out', 'https://www.youtube.com/watch?v=kCc8FmEb1nY', 'A long coding lecture that builds a small GPT step by step. Opens on YouTube.']]
};
// Chapter 14: the frontier model as a stack of the route's threads, each with the milestones it came from.
const LAYERS = [
  ['Serving', 'eff', 9, 'Quantized weights, paged memory and faster decoding make it affordable to run.', ['gptq2022', 'awq2023', 'vllm2023', 'speculative_decoding2022']],
  ['Tools and actions', 'agent', 13, 'It calls functions, operates a computer and connects to tools through a shared protocol.', ['react2022', 'function_calling2023', 'mcp2024', 'claude_computer_use2024']],
  ['Reasoning training', 'reason', 12, 'Reinforcement learning teaches it to reason step by step before it answers.', ['cot2022', 'deepseekmath_grpo2024', 'o1_2024', 'deepseek_r1_2025']],
  ['Alignment', 'align', 6, 'Training on human preferences steers it toward helpful answers.', ['instructgpt2022', 'constitutional_ai2022', 'dpo2023']],
  ['Long context and retrieval', 'rep', 10, 'Position methods stretch how much it can read at once; retrieval brings in current text.', ['rope2021', 'position_interpolation2023', 'rag2020', 'gemini15_2024']],
  ['Senses', 'multi', 11, 'Images and audio enter as tokens in the same model.', ['vit2020', 'clip2021', 'gpt4o2024']],
  ['Pretraining', 'scale', 5, 'Next-token prediction on filtered web-scale data, sized with scaling laws.', ['scaling_laws2020', 'chinchilla2022', 'fineweb2024', 'llama3_2024']],
  ['Architecture', 'lm', 3, 'A Transformer, with fast exact attention and often mixture-of-experts layers.', ['transformer2017', 'flashattention2022', 'mixtral2023', 'deepseek_v2_2024']],
  ['Tokens', 'lm', 2, 'Text is split into subword pieces, so any word can be spelled.', ['sennrich_bpe2015', 'sentencepiece2018']]
].map(l => [l[0], l[1], l[2], l[3], l[4].filter(id => by[id])]);

function stationButton(id, cls){
  const n = by[id], b = h('button', cls || '');
  b.type = 'button';
  b.innerHTML = `<span class="yr">${year(n)}</span><span class="dots" aria-hidden="true">${n.lines.slice(0, 3).map(l => `<i style="--c:${LINE[l].c}"></i>`).join('')}</span><span><span class="nm">${esc(n.short)}</span><span class="ln">${esc(firstSentence(n.breakthrough))}</span></span>`;
  b.setAttribute('aria-label', `${n.short}, ${when(n)}. ${n.lines.map(l => LINE[l].name).join(', ')}. Open study card`);
  b.onclick = () => openCard(id, b);
  return b;
}

// ---------- chapters ----------
const story = document.getElementById('story');
const SCN = [];   // one record per scene, filled here and brought to life in the scene runtime
CH.forEach(c => {
  const sec = h('section', 'chapter');
  sec.id = 'ch-' + c.n; sec.dataset.n = c.n;
  sec.setAttribute('aria-labelledby', 'h-' + c.n);
  sec.style.setProperty('--c', chC(c.n)); sec.style.setProperty('--on', chOn(c.n));

  // opener: a field of the chapter's line colour
  const op = h('header', 'opener');
  op.innerHTML = `<div class="opener-in"><span class="op-num" aria-hidden="true">${c.n}</span><div class="op-text">
      <p class="op-meta">${esc(span(c.years))} · ${esc(chLineName(c.n))}</p>
      <h2 id="h-${c.n}"><span class="vh">Chapter ${c.n}: </span>${esc(c.title)}</h2>
      <p class="op-q">${esc(c.lede)}</p></div></div>`;
  if (c.n === 14){ const b = h('div', 'bands'); b.setAttribute('aria-hidden', 'true'); LORDER.forEach(l => b.appendChild(Object.assign(h('i'), {style: `background:${LINE[l].c}`}))); op.appendChild(b); }
  sec.appendChild(op);

  // scene: a diagram beside the steps of text that drive it
  const def = SCENES[c.n];
  const scene = h('div', 'scene');
  const fig = h('figure', 'scene-fig');
  const stage = h('div', 'stage');
  fig.appendChild(stage);
  if (def.note) fig.appendChild(h('figcaption', 'scene-note', `<span class="tag">${esc(def.note[0])}</span><span>${esc(def.note[1])}</span>`));
  const ol = h('ol', 'steps');
  def.steps.forEach((t, i) => { const li = h('li', 'step' + (i === 0 ? ' on' : ''));
    li.innerHTML = `<div><span class="sn">${i + 1} of ${def.steps.length}</span><p>${esc(t)}</p></div>`; ol.appendChild(li); });
  scene.append(fig, ol);
  sec.appendChild(scene);
  SCN.push({n: c.n, sec, stage, steps: [...ol.children], tl: null, sts: []});

  // after the scene: the milestones, the experiments, and what to keep
  const after = h('div', 'after');
  const keys = h('div', 'keys');
  c.keystones.forEach(id => {
    const n = by[id];
    const art = h('article', 'key');
    art.style.setProperty('--c', home(n).c);
    art.innerHTML = `<p class="key-date">${esc(when(n))}. ${esc(n.inst)}</p>
      <h3>${esc(n.short)}</h3><p class="full">${esc(n.title)}</p>
      <dl><div><dt>The problem</dt><dd>${esc(n.problem)}</dd></div><div><dt>The idea</dt><dd>${esc(n.breakthrough)}</dd></div><div><dt>Why it mattered</dt><dd>${esc(n.why)}</dd></div></dl>`;
    const b = h('button', 'btn-line', 'Open the study card'); b.type = 'button';
    b.setAttribute('aria-label', `Open the study card for ${n.short}`);
    b.onclick = () => openCard(id, b);
    art.appendChild(b); keys.appendChild(art);
  });
  after.appendChild(keys);

  if (c.n === 14){
    const lay = h('section', 'layers'); lay.setAttribute('aria-labelledby', 'layers-h');
    lay.innerHTML = '<h3 id="layers-h">Where each layer came from</h3><p class="layers-intro">The scene above stacks the threads into one system. Open a layer to see the milestones it rests on.</p>';
    LAYERS.forEach(([name, line, ch, d, ids], i) => {
      const item = h('div', 'layer'); item.style.setProperty('--c', LINE[line].c);
      const bid = `lay-b${i}`, pid = `lay-p${i}`;
      item.innerHTML = `<button type="button" class="layer-b" id="${bid}" aria-expanded="false" aria-controls="${pid}"><i aria-hidden="true"></i><span><span class="ln">${esc(name)}</span><span class="lm">${esc(LINE[line].name)}, chapter ${ch}</span></span></button>
        <div class="layer-p" id="${pid}" role="region" aria-labelledby="${bid}" hidden><p>${esc(d)}</p><div class="layer-ids"></div><a href="#ch-${ch}">Go to chapter ${ch}, ${esc(CH[ch - 1].title)}</a></div>`;
      const box = item.querySelector('.layer-ids');
      ids.forEach(id => { const b = h('button', '', `${esc(by[id].short)}, ${year(by[id])}`); b.type = 'button'; b.onclick = () => openCard(id, b); box.appendChild(b); });
      const tb = item.querySelector('.layer-b');
      tb.onclick = () => { const open = tb.getAttribute('aria-expanded') === 'true'; tb.setAttribute('aria-expanded', String(!open)); item.querySelector('.layer-p').hidden = open; };
      lay.appendChild(item);
    });
    after.appendChild(lay);
  }

  const slot = h('div', 'labs lab-slot'); slot.dataset.ch = c.n; after.appendChild(slot);

  if (TAKE[c.n]) after.appendChild(h('div', 'remember', `<span class="rk">Remember</span><p>${esc(TAKE[c.n])}</p>`));
  if (WATCH[c.n]) after.appendChild(h('div', 'watch', '<h4>Watch</h4><ul>' + WATCH[c.n].map(([t, u, d]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a><span>${esc(d)}</span></li>`).join('') + '</ul>'));
  const others = c.stations.filter(i => !c.keystones.includes(i));
  if (others.length){
    const box = h('div', 'also'); box.appendChild(h('h4', '', 'Also on this stretch'));
    const list = h('ol'); others.forEach(id => { const li = h('li'); li.appendChild(stationButton(id)); list.appendChild(li); });
    box.appendChild(list); after.appendChild(box);
  }
  const rest = c.all.filter(i => !c.stations.includes(i));
  if (rest.length){
    const d = h('details', 'more'); d.appendChild(h('summary', '', `${rest.length} more milestones in this chapter`));
    const ul = h('ul');
    rest.forEach(id => { const n = by[id]; const li = h('li'); const b = h('button'); b.type = 'button';
      b.innerHTML = `<span class="yr">${year(n)}</span><span>${esc(n.short)}</span>`; b.onclick = () => openCard(id, b); li.appendChild(b); ul.appendChild(li); });
    d.appendChild(ul); after.appendChild(d);
  }
  if (c.transition) after.appendChild(h('p', 'handoff', esc(c.transition)));
  sec.appendChild(after);
  story.appendChild(sec);
});
