
// ---------- Chapter 6: optimising toward a judge ----------
function labAlign(slot){
  const STY = [
    ['Clear steps', 'Unplug the router. Wait 30 seconds. Plug it back in and wait until the lights are steady.'],
    ['Vague', 'Routers can be restarted in different ways, depending on the model.'],
    ['Padded', 'Great question! Routers are important devices in the modern home, and there are many things to think about… in short, unplug it, wait, and plug it back in.'],
    ['Refuses', 'Sorry, I can’t help with that.'],
    ['Wrong', 'Hold the reset button for ten minutes while the router is switched off.']
  ];
  const REF = [.15, .30, .20, .10, .25];
  const RW = {sound: [2, .2, .9, -.6, -2], flawed: [2, .2, 2.6, -.6, -2]};
  const PAIRS = [[0, 2], [1, 4], [0, 1], [2, 3], [0, 4], [1, 2], [3, 4], [0, 3], [2, 4], [1, 3]];
  let beta = 1, mode = 'sound', never = false, mine = [0, 0, 0, 0, 0], pi = 0, made = 0;
  const L = lab(slot, {
    title: 'What happens when you optimise toward a judge?', kind: 'illus', side: true,
    intro: 'We cannot write down the rule for a good answer, but people can say which of two answers is better. RLHF trains a reward model on those choices, then pushes the language model toward answers the reward model scores highly, while a leash, β, keeps it close to the original model. The question here: “How do I restart my router?”',
    notice: 'A lower β loosens the leash, so the model moves further from the base model to chase the reward. With the flawed judge, chasing harder makes the answers worse: the reward is only a stand-in for what people want. Tick the last box: an answer style the base model never produces stays at 0% however you set the reward. Alignment reweights what pretraining already put there.',
    source: 'Christiano et al. (OpenAI and DeepMind, 2017) learned a reward model from human comparisons between pairs of behaviours, then optimised against it. InstructGPT (OpenAI, 2022) applied this to instruction following: a 1.3B aligned model was preferred to the 175B base model. DPO (Stanford, 2023) optimised the same objective directly on preference pairs, with no reward model and no reinforcement-learning loop.',
    tech: '<p>RLHF maximises the expected reward minus β times the KL divergence from the base model. KL divergence measures how far one probability distribution has moved from another. This objective has an exact solution: π*(y) ∝ πᵣₑƒ(y) · exp(r(y) ÷ β). The demo computes it directly over five answer styles. Real training reaches it only approximately, with PPO.</p><p>DPO rearranges the same formula so that the reward is written in terms of the policy itself, which removes the separate reward model. In “Learn from my choices”, the reward model uses the Bradley–Terry model, P(A is preferred to B) = σ(rₐ − r_b), with one gradient step per choice.</p>'
  });
  const bs = slider(L.controls, {label: 'Leash strength, β', min: .05, max: 5, log: true, value: beta, fmt: v => v.toFixed(2) + (v < .2 ? ' (loose)' : v > 2.5 ? ' (tight)' : ''), onInput: v => { beta = v; render(); }});
  const ms = seg(L.controls, {label: 'Reward model', options: [['sound', 'Sound'], ['flawed', 'Flawed: likes length'], ['mine', 'Learn from my choices']], value: mode, onChange: v => { mode = v; render(); }});
  const nv = toggle(L.controls, 'The base model never writes clear steps', never, v => { never = v; render(); });
  const pairBox = h('div', 'pair-box'); L.extra.appendChild(pairBox);
  function choose(win, lose){
    const p = 1 / (1 + Math.exp(-(mine[win] - mine[lose]))), g = .8 * (1 - p);
    mine[win] += g; mine[lose] -= g; made++; pi = (pi + 1) % PAIRS.length; render();
    const f = pairBox.querySelector('button'); if (f) f.focus();
  }
  function renderPair(){
    if (mode !== 'mine'){ pairBox.innerHTML = ''; pairBox.hidden = true; return; }
    pairBox.hidden = false;
    const [a, b] = PAIRS[pi];
    pairBox.innerHTML = `<h4>Which answer is better? <span class="muted">Choices made: ${made}</span></h4>`;
    const g = h('div', 'pair');
    [[a, b, 'A'], [b, a, 'B']].forEach(([w, l, k]) => {
      const bt = h('button', 'pair-opt', `<span class="pk">Answer ${k}, ${esc(STY[w][0].toLowerCase())}</span><span>${esc(STY[w][1])}</span>`); bt.type = 'button';
      bt.onclick = () => choose(w, l); g.appendChild(bt);
    });
    pairBox.appendChild(g);
  }
  function render(){
    let ref = REF.slice(); if (never){ ref[0] = 0; const s = sum(ref); ref = ref.map(x => x / s); }
    const r = mode === 'mine' ? mine : RW[mode];
    const un = ref.map((p, i) => p * Math.exp(r[i] / beta)), Z = sum(un), pol = un.map(x => x / Z);
    const kl = sum(pol.map((p, i) => p > 0 ? p * Math.log(p / ref[i]) : 0));
    const W = figW(L.fig, 560), lab0 = Math.min(104, W * .28), rowH = 52, H = 34 + STY.length * rowH;
    const bw = W - lab0 - 58;
    const svg = svgIn(L.fig, W, H, '');
    el('rect', {x: lab0, y: 6, width: 22, height: 12, fill: 'none', stroke: 'var(--ink)', 'stroke-dasharray': '3 2', 'stroke-width': 1.5}, svg);
    tx(svg, lab0 + 28, 17, 'base model', {'font-size': 13, fill: 'var(--ink-2)'});
    el('rect', {x: lab0 + 120, y: 6, width: 22, height: 12, fill: 'var(--lab-b)'}, svg);
    tx(svg, lab0 + 148, 17, 'after alignment', {'font-size': 13, fill: 'var(--ink-2)'});
    STY.forEach(([name], i) => {
      const y = 30 + i * rowH;
      tx(svg, lab0 - 8, y + 24, name, {'text-anchor': 'end', 'font-weight': 600});
      el('rect', {x: lab0, y: y + 6, width: Math.max(ref[i] > 0 ? 1 : 0, bw * ref[i]), height: 14, fill: 'none', stroke: 'var(--ink)', 'stroke-dasharray': '3 2', 'stroke-width': 1.5}, svg);
      tx(svg, lab0 + bw * ref[i] + 6, y + 18, pc(ref[i]), {'font-size': 12.5, fill: 'var(--ink-2)'});
      el('rect', {x: lab0, y: y + 24, width: pol[i] > 0 ? Math.max(1.5, bw * pol[i]) : 0, height: 16, fill: 'var(--lab-b)'}, svg);
      tx(svg, lab0 + bw * pol[i] + 6, y + 37, pc(pol[i]), {'font-size': 13, 'font-weight': 700});
    });
    svg.setAttribute('aria-label', 'How often each answer style appears. ' + STY.map(([n], i) => `${n}: base ${pc(ref[i])}, aligned ${pc(pol[i])}`).join('; ') + '.');
    const top = pol.indexOf(Math.max(...pol));
    let msg;
    if (mode === 'mine' && made === 0) msg = 'Make a few choices below. The reward model learns from each one, and the aligned model follows.';
    else if (never) msg = `The base model never writes clear steps, so the aligned model cannot either: 0%. The reward model would love that answer, but the training can only reweight answers the base model already gives. Its best option is now “${STY[top][0].toLowerCase()}” (${pc(pol[top])}).`;
    else if (mode === 'flawed' && top === 2) msg = `Reward hacking. This reward model likes long answers, so the aligned model pads: ${pc(pol[2])} of its answers are padded. It optimises the reward, not what people actually want.`;
    else if (beta > 2.5) msg = `The leash is tight, so the aligned model stays close to the base model (KL = ${kl.toFixed(2)}). The reward barely moves it.`;
    else msg = `The aligned model gives clear steps ${pc(pol[0])} of the time, up from ${pc(ref[0])} in the base model. Distance moved from the base model: KL = ${kl.toFixed(2)}.` + (mode === 'flawed' ? ' Loosen the leash and watch the padded answers grow.' : '');
    if (mode === 'mine' && made) msg += ` Learned rewards: ${STY.map(([n], i) => `${n.toLowerCase()} ${mine[i] >= 0 ? '+' : ''}${mine[i].toFixed(1)}`).join(', ')}.`;
    L.out.innerHTML = msg;
    renderPair();
  }
  L.reset = () => { beta = 1; mode = 'sound'; never = false; mine = [0, 0, 0, 0, 0]; pi = 0; made = 0; bs.set(1); ms.set('sound'); nv.checked = false; render(); };
  register(render);
}

// ---------- Chapter 8: mixture of experts ----------
function labMoE(slot){
  const TOK = 'Open weights let anyone run and study the model .'.split(' ');
  const NE = 8;
  const score = (t, e) => { let x = 2166136261; for (const ch of t.toLowerCase() + '|' + e){ x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return ((x >>> 0) % 1000) / 1000 * 4 - 2; };
  let k = 2, idx = 0, usage = Array(NE).fill(0), done = new Set(), timer = null;
  function route(i){
    const s = Array.from({length: NE}, (_, e) => score(TOK[i], e));
    const chosen = s.map((v, e) => e).sort((a, b) => s[b] - s[a]).slice(0, k);
    const g = softmax(chosen.map(e => s[e]));
    return {chosen, gate: Object.fromEntries(chosen.map((e, j) => [e, g[j]]))};
  }
  function visit(i){ if (done.has(i)) return; done.add(i); route(i).chosen.forEach(e => usage[e]++); }
  const L = lab(slot, {
    title: 'How can a model be huge but cheap per word?', kind: 'illus',
    intro: 'A mixture-of-experts layer holds several separate blocks of parameters, called experts. For each word, a small router picks a few experts and skips the rest. Step through the sentence and change how many experts each word may use.',
    notice: 'Total parameters decide how much the model can store. Active parameters decide how much work each word costs. Mixture-of-experts grows the first without growing the second. Why is Mixtral about 28% active and not exactly 2 of 8? Attention and embedding layers are shared by every word, so they always do work.',
    source: 'Mixtral 8x7B (Mistral AI, December 2023) is an open sparse mixture-of-experts model: 47B total parameters with about 13B active per token, about 28%. Its paper describes routing each token to 2 of 8 experts. DeepSeek-V3 (December 2024) has 671B parameters with 37B active, about 5.5%.',
    tech: '<p>The router multiplies the word’s vector by a learned matrix to get one score per expert, keeps the top k scores, and turns those into weights with a softmax. The layer’s output is the weighted sum of the chosen experts’ outputs.</p><p>In this demo the scores come from a fixed hash of each word, so they are stable but carry no meaning. A trained router learns its scores. Real models also add a balancing term during training so that no expert is overloaded.</p>'
  });
  const ks = slider(L.controls, {label: 'Experts per word, k', min: 1, max: 8, value: k, fmt: v => `${v} of 8`, onInput: v => { k = v; usage.fill(0); const keep = [...done]; done.clear(); keep.forEach(visit); render(); }});
  const row = btnRow(L.controls);
  btn(row, 'Next word', () => { stop(); idx = (idx + 1) % TOK.length; visit(idx); render(); }, 'primary');
  const playB = btn(row, 'Play the sentence', () => { if (timer){ stop(); return; } play(); });
  function stop(){ clearInterval(timer); timer = null; playB.textContent = 'Play the sentence'; }
  function play(){
    if (reduce){ TOK.forEach((t, i) => visit(i)); idx = TOK.length - 1; render(); return; }
    playB.textContent = 'Pause'; idx = -1;
    timer = setInterval(() => { idx++; if (idx >= TOK.length){ idx = TOK.length - 1; stop(); return; } visit(idx); render(); }, 750);
  }
  function render(){
    const {chosen, gate} = route(idx);
    L.fig.innerHTML = '';
    const tr = h('div', 'moe-toks'); tr.setAttribute('role', 'group'); tr.setAttribute('aria-label', 'Words. Select one to route it.');
    TOK.forEach((t, i) => { const b = h('button', 'moe-tok' + (i === idx ? ' on' : ''), esc(t)); b.type = 'button'; b.setAttribute('aria-pressed', String(i === idx)); b.onclick = () => { stop(); idx = i; visit(i); render(); L.fig.querySelectorAll('.moe-tok')[i].focus(); }; tr.appendChild(b); });
    L.fig.appendChild(tr);
    const W = figW(L.fig, 620), rowH = 38, H = NE * rowH + 4, rw = Math.min(124, W * .3), ex = rw + Math.max(44, W * .14), ew = W - ex;
    const svgWrap = h('div'); L.fig.appendChild(svgWrap);
    const svg = svgIn(svgWrap, W, H, '');
    const ry = H / 2;
    chosen.forEach(e => el('path', {d: `M${rw},${ry} C${rw + (ex - rw) * .6},${ry} ${ex - (ex - rw) * .6},${e * rowH + rowH / 2} ${ex},${e * rowH + rowH / 2}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5 + 7 * gate[e]}, svg));
    el('rect', {x: 0, y: ry - 30, width: rw, height: 60, fill: 'var(--station)', stroke: 'var(--ink)', 'stroke-width': 2}, svg);
    tx(svg, rw / 2, ry - 6, 'router', {'text-anchor': 'middle', fill: 'var(--muted)', 'font-size': 13});
    tx(svg, rw / 2, ry + 15, `“${TOK[idx]}”`, {'text-anchor': 'middle', 'font-weight': 700, 'font-size': 15});
    for (let e = 0; e < NE; e++){
      const y = e * rowH + 3, on = e in gate;
      el('rect', {x: ex, y, width: ew, height: rowH - 6, fill: on ? 'var(--ink)' : 'var(--station)', stroke: 'var(--ink)', 'stroke-width': on ? 0 : 1.2, 'stroke-dasharray': on ? '' : '4 3'}, svg);
      tx(svg, ex + 10, y + 21, `Expert ${e + 1}`, {fill: on ? 'var(--paper)' : 'var(--ink-2)', 'font-weight': 650});
      tx(svg, ex + ew - 8, y + 21, (on ? `${pc(gate[e])}, ` : 'idle, ') + `used ${usage[e]}×`, {fill: on ? 'var(--paper)' : 'var(--muted)', 'font-size': 13, 'text-anchor': 'end', 'font-weight': on ? 700 : 400});
    }
    svg.setAttribute('aria-label', `Router sends ${TOK[idx]} to ${chosen.map(e => `expert ${e + 1} (${pc(gate[e])})`).join(', ')}. The other ${NE - k} experts are idle.`);
    L.out.innerHTML = `“${esc(TOK[idx])}” goes to ${k} of 8 experts: ${chosen.map(e => `expert ${e + 1} with weight ${pc(gate[e])}`).join(', ')}. ` +
      (k < NE ? `The other ${NE - k} do no work for this word, so about ${pc(k / NE)} of the expert parameters are active.` : 'With all 8 active, this is an ordinary dense layer: every parameter works on every word.') +
      (done.size === TOK.length ? ` Across the whole sentence, the busiest expert handled ${Math.max(...usage)} words.` : '');
  }
  L.reset = () => { stop(); k = 2; idx = 0; usage.fill(0); done.clear(); visit(0); ks.set(2); render(); };
  visit(0);
  register(render);
}

// ---------- Chapter 9: memory arithmetic ----------
function labFit(slot){
  const GPUS = [24, 48, 80];
  const st = {tab: 'w', N: 70e9, bits: 16, d: 4096, r: 8, ctx: 8192, kvh: 32};
  const L = lab(slot, {
    title: 'Will it fit on one GPU?', kind: 'math',
    intro: 'Most of the work in this chapter is about memory. A model has to hold its weights, any parameters you train, and a working cache that grows with the length of the text. Each tab is one of those three costs.',
    notice: 'Most efficiency tricks store fewer numbers or fewer bits. 4-bit weights take a quarter of the memory of 16-bit. LoRA trains a sliver of the parameters. Sharing key-value heads shrinks the cache. QLoRA combined the first two, which is why a 65B model could be fine-tuned on one 48 GB GPU.',
    source: 'QLoRA (University of Washington, 2023) quantized the frozen base model to 4-bit and trained adapters through it: 65B on one 48 GB GPU. LoRA (Microsoft, 2021) trains a small low-rank update, often under 1% of parameters. LLM.int8() (2022) ran models in 8-bit with no measured degradation, and GPTQ (2022) held accuracy at 3 to 4 bits. Multi-query attention (2019) and grouped-query attention (2023) share keys and values across heads to shrink the cache. vLLM (2023) manages that cache in pages, for two to four times the throughput.',
    tech: '<p>Weight memory = parameters × bits ÷ 8 bytes. A runtime needs extra room for activations and the cache, so this demo counts a model as fitting when its weights use at most 90% of the GPU’s memory. That margin is an assumption. 24, 48 and 80 GB are common GPU memory sizes.</p><p>LoRA replaces a full update ΔW of size d × d with the product B · A, where B is d × r and A is r × d. That is 2dr trained numbers instead of d².</p><p>The cache holds a key and a value for every layer, key-value head and token: 2 × layers × KV heads × head size × tokens × 2 bytes at 16-bit. The cache tab uses an illustrative 7B-class shape: 32 layers and heads of size 128.</p>'
  });
  const tabs = seg(L.controls, {label: 'Show', options: [['w', 'Weights'], ['lora', 'Fine-tuning with LoRA'], ['kv', 'Context cache']], value: st.tab, onChange: v => { st.tab = v; show(); }});
  const P = {w: h('div', 'lab-controls'), lora: h('div', 'lab-controls'), kv: h('div', 'lab-controls')};
  Object.values(P).forEach(p => L.controls.appendChild(p));
  const ns = slider(P.w, {label: 'Parameters', min: 1e9, max: 7e11, log: true, value: st.N, fmt: v => big(v), onInput: v => { st.N = v; pre.set(null); render(); }});
  const PRE = [7e9, 13e9, 65e9, 70e9, 405e9, 671e9];
  const pre = seg(P.w, {label: 'Model sizes', options: PRE.map(v => [v, big(v)]), value: st.N, onChange: v => { st.N = v; ns.set(v); render(); }});
  const bitsS = seg(P.w, {label: 'Precision', options: [[16, '16-bit'], [8, '8-bit'], [4, '4-bit']], value: st.bits, onChange: v => { st.bits = v; render(); }});
  const dS = seg(P.lora, {label: 'Matrix size, d', options: [[1024, '1024'], [4096, '4096'], [8192, '8192']], value: st.d, onChange: v => { st.d = v; render(); }});
  const rS = seg(P.lora, {label: 'LoRA rank, r', options: [1, 4, 8, 16, 64, 256].map(v => [v, String(v)]), value: st.r, onChange: v => { st.r = v; render(); }});
  const cS = slider(P.kv, {label: 'Context length', min: 10, max: 17, value: 13, fmt: v => (2 ** v).toLocaleString('en-GB') + ' tokens', onInput: v => { st.ctx = 2 ** v; render(); }});
  const hS = seg(P.kv, {label: 'Key-value heads', options: [[32, '32, standard'], [8, '8, grouped-query'], [1, '1, multi-query']], value: st.kvh, onChange: v => { st.kvh = v; render(); }});
  function show(){ Object.entries(P).forEach(([k, p]) => p.hidden = k !== st.tab); render(); }
  function bars(svg, W, items, sel, label){
    // items: [[name, bytes]]; draws bars against GPU lines
    const lab0 = 92, top = 64, rowH = 44, mx = Math.max(100e9, ...items.map(i => i[1])) * 1.06, bw = W - lab0 - 10, X = b => lab0 + b / mx * bw;
    let lastX = -1e9, rowUp = false;
    GPUS.forEach(g => { const x = X(g * 1e9); rowUp = x - lastX < 46 ? !rowUp : false; lastX = x;
      el('line', {x1: x, x2: x, y1: top - (rowUp ? 24 : 8), y2: top + items.length * rowH, stroke: 'var(--muted)', 'stroke-dasharray': '4 4'}, svg);
      tx(svg, x, top - (rowUp ? 28 : 12), `${g} GB`, {'text-anchor': 'middle', fill: 'var(--muted)', 'font-size': 12.5}); });
    items.forEach(([name, b], i) => {
      const y = top + i * rowH, on = i === sel;
      tx(svg, lab0 - 8, y + 24, name, {'text-anchor': 'end', 'font-weight': on ? 750 : 500});
      el('rect', {x: lab0, y: y + 8, width: Math.max(2, X(b) - lab0), height: 24, fill: on ? 'var(--lab-d)' : 'var(--paper-2)', stroke: on ? 'none' : 'var(--rule)'}, svg);
      const t = GB(b), tw = t.length * 7.6 + 8, inside = X(b) - lab0 > tw + 10 && X(b) > W - 80;
      tx(svg, inside ? X(b) - 6 : X(b) + 6, y + 25, t, {'text-anchor': inside ? 'end' : 'start', 'font-weight': 650, fill: inside && on ? 'var(--paper)' : 'var(--ink)', 'font-size': 13});
    });
    tx(svg, 0, 14, label, {'font-weight': 650});
    return top + items.length * rowH + 6;
  }
  function fitText(b){ const g = GPUS.find(x => b <= x * 1e9 * .9); return g ? `This fits on one ${g} GB GPU, with about ${GB(g * 1e9 - b)} left for the working memory.` : `This does not fit on one 80 GB GPU. You need at least ${Math.ceil(b / (80e9 * .9))} of them, or fewer bits.`; }
  function render(){
    const W = figW(L.fig, 600);
    if (st.tab === 'w'){
      const items = [16, 8, 4].map(b => [`${b}-bit`, st.N * b / 8]);
      const svg = svgIn(L.fig, W, 64 + 3 * 44 + 10, '');
      const H = bars(svg, W, items, [16, 8, 4].indexOf(st.bits), `Weights of a ${big(st.N)} model`);
      svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const b = st.N * st.bits / 8;
      svg.setAttribute('aria-label', `Weight memory for ${big(st.N)} parameters: ${items.map(i => `${i[0]} ${GB(i[1])}`).join(', ')}.`);
      L.out.innerHTML = `${big(st.N)} parameters at ${st.bits}-bit need <b>${GB(b)}</b> for the weights alone. ${fitText(b)}`;
    } else if (st.tab === 'lora'){
      const {d, r} = st, full = d * d, lo = 2 * d * r, S = Math.min(200, W * .42), th = Math.max(2, S * r / d);
      const H = S + 56, svg = svgIn(L.fig, W, H, '');
      tx(svg, 0, 14, 'Trained numbers for one weight matrix', {'font-weight': 650});
      const y0 = 30;
      el('rect', {x: 0, y: y0, width: S, height: S, fill: 'var(--lab-a)', opacity: .85}, svg);
      tx(svg, S / 2, y0 + S + 18, `full update, ${d}×${d}`, {'text-anchor': 'middle', 'font-size': 13});
      const x1 = S + 34;
      tx(svg, S + 17, y0 + S / 2 + 6, '≈', {'text-anchor': 'middle', 'font-size': 22});
      el('rect', {x: x1, y: y0, width: th, height: S, fill: 'var(--lab-d)'}, svg);
      tx(svg, x1 + th / 2, y0 + S + 18, `B, ${d}×${r}`, {'text-anchor': 'start', 'font-size': 13});
      const x2 = x1 + th + 34;
      tx(svg, x1 + th + 17, y0 + S / 2 + 6, '×', {'text-anchor': 'middle', 'font-size': 20});
      if (x2 + S <= W){ el('rect', {x: x2, y: y0, width: S, height: th, fill: 'var(--lab-d)'}, svg); tx(svg, x2, y0 + th + 18, `A, ${r}×${d}`, {'font-size': 13}); }
      else { el('rect', {x: x2, y: y0, width: W - x2, height: th, fill: 'var(--lab-d)'}, svg); tx(svg, x2, y0 + th + 18, `A, ${r}×${d} (cut off)`, {'font-size': 13}); }
      svg.setAttribute('aria-label', `A full ${d} by ${d} update has ${full.toLocaleString('en-GB')} numbers. LoRA with rank ${r} trains two thin matrices with ${lo.toLocaleString('en-GB')} numbers.`);
      L.out.innerHTML = `A full update to one ${d}×${d} matrix trains ${full.toLocaleString('en-GB')} numbers. LoRA with rank ${r} trains ${lo.toLocaleString('en-GB')}: <b>${pc(lo / full)}</b>. The original matrix stays frozen.` + (lo / full > .1 ? ' At this rank LoRA saves little.' : '');
    } else {
      const kv = hh => 2 * 32 * hh * 128 * st.ctx * 2;
      const items = [32, 8, 1].map(hh => [`${hh} head${hh > 1 ? 's' : ''}`, kv(hh)]);
      const svg = svgIn(L.fig, W, 64 + 3 * 44 + 10, '');
      const H = bars(svg, W, items, [32, 8, 1].indexOf(st.kvh), `Cache for ${Math.round(st.ctx).toLocaleString('en-GB')} tokens`);
      svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('aria-label', `Cache memory at ${Math.round(st.ctx)} tokens: ${items.map(i => `${i[0]} ${GB(i[1])}`).join(', ')}.`);
      L.out.innerHTML = `At ${Math.round(st.ctx).toLocaleString('en-GB')} tokens the cache needs <b>${GB(kv(st.kvh))}</b> with ${st.kvh} key-value head${st.kvh > 1 ? 's' : ''}, ${st.kvh === 32 ? `against ${GB(kv(8))} with 8 (grouped-query) and ${GB(kv(1))} with 1 (multi-query)` : `against ${GB(kv(32))} with the standard 32`}. That is for one conversation; a server holding many needs it for each one.`;
    }
  }
  L.reset = () => { Object.assign(st, {tab: 'w', N: 70e9, bits: 16, d: 4096, r: 8, ctx: 8192, kvh: 32}); tabs.set('w'); ns.set(st.N); pre.set(st.N); bitsS.set(16); dS.set(4096); rS.set(8); cS.set(13); hS.set(32); show(); };
  Object.entries(P).forEach(([k, p]) => p.hidden = k !== st.tab);
  RENDERERS.push(render); render();
}

// ---------- shared: a keyword index over the milestones ----------
const STOP = new Set('a about after all also an and any are as at be been before but by can could did do does each for from get got had has have how i if in into is it its just made make may me more most much my no not of on one only or our out over paper so some such than that the their them then there these they thing this those to too up use used uses using very was way we were what when where which while who why will with would you your'.split(' '));
const IDX = (() => {
  // a light suffix stripper, so that "tune" and "tuning", or "image" and "images", match
  const stem = w => { if (w.length <= 3) return w; for (const x of ['ings', 'ing', 'ies', 'ed', 'es', 's', 'e']) if (w.endsWith(x) && w.length - x.length >= 3) return w.slice(0, -x.length); return w; };
  const words = s => (s.toLowerCase().match(/[a-z0-9]+/g) || []);
  const toks = s => words(s).filter(w => !STOP.has(w) && w.length > 1).map(stem);
  const docs = N.map(n => { const tf = {}; toks([n.short, n.short, n.title, n.title, n.problem, n.breakthrough, n.why].join(' ')).forEach(w => tf[w] = (tf[w] || 0) + 1); return {id: n.id, tf}; });
  const df = {}; docs.forEach(d => Object.keys(d.tf).forEach(w => df[w] = (df[w] || 0) + 1));
  const idf = w => Math.log((N.length + 1) / ((df[w] || 0) + 1)) + 1;
  docs.forEach(d => { d.v = {}; let s = 0; for (const w in d.tf){ const x = (1 + Math.log(d.tf[w])) * idf(w); d.v[w] = x; s += x * x; } d.norm = Math.sqrt(s) || 1; });
  function search(q, k = 5){
    const qt = toks(q); if (!qt.length) return null;
    const qv = {}; qt.forEach(w => qv[w] = (qv[w] || 0) + 1);
    let qs = 0; for (const w in qv){ qv[w] = (1 + Math.log(qv[w])) * idf(w); qs += qv[w] * qv[w]; } qs = Math.sqrt(qs);
    return docs.map(d => { let dt = 0; const hits = []; for (const w in qv) if (d.v[w]){ dt += qv[w] * d.v[w]; hits.push(w); } return {id: d.id, score: dt / (qs * d.norm), hits}; })
      .filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  }
  return {search, words, terms: q => [...new Set(toks(q))]};
})();

// ---------- Chapter 10: retrieval ----------
function labRag(slot){
  const SUG = ['Which paper removed recurrence and used only attention?', 'How can I fine-tune a large model on one GPU?', 'Alignment without a reward model or reinforcement learning', 'How did AI learn to see pictures?'];
  const L = lab(slot, {
    title: 'Can the model look it up?', kind: 'real',
    intro: 'Retrieval-augmented generation answers in two steps. First a retriever finds the passages most related to the question. Then a generator writes the answer with those passages in view. Here the library is the 200 milestones on this page. Ask a question, or try a suggestion.',
    notice: 'The generator can only use what the retriever finds. If retrieval misses, the answer misses too. Try the last two suggestions. Keyword search ignores the word “without”, so it ranks the paper that introduced reward models above DPO, the paper you want. The question about pictures uses none of the words in the vision milestones, so the matches are weak. RAG’s dense retriever compares meaning instead of exact words, which copes better with questions like these.',
    source: 'RAG (Facebook AI, UCL and NYU, 2020) retrieved passages with a dense retriever and conditioned a BART generator on them, training both together. It named and popularised the pattern that most production LLM systems now use.',
    tech: '<p>This demo scores each milestone with TF-IDF and cosine similarity. Words that are rare across the 200 milestones count more than common ones. Very common words, such as “the” and “how”, are ignored, and word endings are trimmed so that “image” and “images” match.</p><p>A dense retriever maps the question and every passage to vectors that capture meaning, then finds the nearest passages. The generator step does not run here, because this page contains no language model. The box shows the exact prompt that a generator would receive.</p>'
  });
  const form = h('form', 'rag-form'); form.setAttribute('role', 'search');
  const qid = L.id + '-q';
  form.innerHTML = `<label class="ctl-name" for="${qid}">Ask a question about this history</label><div class="rag-row"><input id="${qid}" type="search" autocomplete="off" maxlength="200"><button class="lab-btn primary" type="submit">Search</button></div>`;
  L.controls.appendChild(form);
  const input = form.querySelector('input');
  const sug = h('div', 'ctl'); sug.appendChild(h('span', 'ctl-name', 'Suggestions'));
  const sr = h('div', 'sug-row'); sug.appendChild(sr); L.controls.appendChild(sug);
  SUG.forEach(s => { const b = h('button', 'sug', esc(s)); b.type = 'button'; b.onclick = () => { input.value = s; run(); }; sr.appendChild(b); });
  form.onsubmit = e => { e.preventDefault(); run(); };
  function run(){
    const q = input.value.trim();
    L.fig.innerHTML = ''; L.extra.innerHTML = '';
    if (!q){ L.out.textContent = 'Type a question first.'; return; }
    const res = IDX.search(q, 5);
    if (res === null){ L.out.textContent = 'Your question has only very common words, such as “the” or “how”. Add a specific word, such as a method or a model name.'; return; }
    if (!res.length){ L.out.textContent = 'No milestone shares a word with your question. Keyword search matches words, not meaning. Try other words for the same idea.'; return; }
    const mx = res[0].score;
    const ol = h('ol', 'rag-res');
    res.forEach(r => {
      const n = by[r.id], li = h('li');
      li.innerHTML = `<div class="rr-top"><span class="rr-score"><span class="rr-bar" aria-hidden="true"><i style="width:${Math.round(r.score / Math.max(mx, .5) * 100)}%"></i></span>match ${r.score.toFixed(2)}</span><button class="rr-name" type="button">${esc(n.short)}, ${year(n)}</button></div><p>${esc(firstSentence(n.breakthrough))}</p><p class="rr-hits">Shared word stems: ${r.hits.map(esc).join(', ')}</p>`;
      li.querySelector('button').onclick = ev => openCard(n.id, ev.currentTarget);
      ol.appendChild(li);
    });
    L.fig.appendChild(ol);
    const passages = res.slice(0, 3).map((r, i) => { const n = by[r.id]; return `[${i + 1}] ${n.short} (${year(n)}): ${n.breakthrough}`; }).join('\n');
    L.extra.innerHTML = `<h4>The prompt a generator would receive</h4><pre class="rag-prompt" tabindex="0">Answer the question using only the passages below. Cite them by number.\n\n${esc(passages)}\n\nQuestion: ${esc(q)}</pre>`;
    const terms = IDX.terms(q), cover = res[0].hits.length / terms.length;
    L.out.innerHTML = mx < .15 || cover < .5
      ? `The best match is weak: it shares only ${res[0].hits.map(w => `“${esc(w)}”`).join(' and ')} with your question (match ${mx.toFixed(2)}). The words overlap a little, but the meaning does not. A generator given these passages would have little to work with.`
      : `The retriever found ${res.length} related milestones. The best one shares ${res[0].hits.length} of your ${terms.length} key words. The top three go into the prompt below, so the answer can cite them. Select a result to open its study card.`;
  }
  L.reset = () => { input.value = SUG[0]; run(); };
  input.value = SUG[0]; run();
}

// ---------- Chapter 11: images as patches ----------
function labPatches(slot){
  const off = document.createElement('canvas'); off.width = off.height = 224;
  (function scene(c){
    const g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, '#8DB8DA'); g.addColorStop(1, '#DCEBF3');
    c.fillStyle = g; c.fillRect(0, 0, 224, 224);
    c.fillStyle = '#F2C14E'; c.beginPath(); c.arc(176, 46, 22, 0, 7); c.fill();
    c.fillStyle = '#6E9E5C'; c.beginPath(); c.moveTo(0, 150); c.quadraticCurveTo(70, 98, 140, 140); c.quadraticCurveTo(190, 120, 224, 132); c.lineTo(224, 224); c.lineTo(0, 224); c.fill();
    c.fillStyle = '#4F7F45'; c.beginPath(); c.moveTo(0, 182); c.quadraticCurveTo(110, 150, 224, 176); c.lineTo(224, 224); c.lineTo(0, 224); c.fill();
    c.fillStyle = '#C75B39'; c.fillRect(58, 118, 70, 58);
    c.fillStyle = '#7A3B2A'; c.beginPath(); c.moveTo(50, 120); c.lineTo(93, 84); c.lineTo(136, 120); c.fill();
    c.fillStyle = '#3B2A20'; c.fillRect(84, 146, 18, 30);
    c.fillStyle = '#F5E6A8'; c.fillRect(66, 130, 14, 12); c.fillRect(108, 130, 14, 12);
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(52, 40, 22, 9, 0, 0, 7); c.ellipse(70, 34, 16, 9, 0, 0, 7); c.fill();
  })(off.getContext('2d'));
  let p = 16, sr = 6, sc = 4;
  const L = lab(slot, {
    title: 'How does a picture become tokens?', kind: 'math',
    intro: 'A Transformer works on a sequence of tokens. The Vision Transformer turns an image into one by cutting it into square patches, like tiles. Each patch becomes one token. Choose a patch size, then select a patch to see what one token contains.',
    notice: 'Halving the patch size gives four times the tokens and sixteen times the attention pairs. Small patches keep detail but cost much more. Large patches are cheap but blur a lot into each token. Text models face the same trade-off with long context.',
    source: 'The Vision Transformer (Google Research, 2020), in a paper titled “An Image is Worth 16x16 Words”, cut an image into patches, treated each as a token and fed them to a plain Transformer encoder. CLIP (OpenAI, 2021) trained image and text encoders on 400 million web image-caption pairs so that matching pairs land together in one shared space.',
    tech: '<p>Each patch is flattened into a list of numbers: p × p pixels × 3 colours. A learned matrix turns that list into one token vector, and a position embedding records where the patch came from. After that, the Transformer treats the patches like words. With 16 × 16 patches, a 224 × 224 image gives 14 × 14 = 196 tokens.</p><p>The picture in this demo is drawn by the page. It is 224 × 224 pixels, a common input size for these models.</p>'
  });
  const ps = seg(L.controls, {label: 'Patch size in pixels', options: [8, 14, 16, 28, 32, 56].map(v => [v, String(v)]), value: p, onChange: v => { const cy = (sr + .5) * p, cx = (sc + .5) * p; p = v; const g = 224 / p; sr = Math.min(g - 1, Math.floor(cy / p)); sc = Math.min(g - 1, Math.floor(cx / p)); render(); }});
  L.controls.appendChild(h('p', 'ctl-hint', 'Select a patch in the picture, or focus the picture and use the arrow keys.'));
  const wrap = h('div', 'patch-wrap'); L.fig.appendChild(wrap);
  const cv = document.createElement('canvas'); cv.width = cv.height = 448; cv.className = 'patch-cv'; cv.tabIndex = 0; cv.setAttribute('role', 'img');
  const side = h('div', 'patch-side');
  const pv = document.createElement('canvas'); pv.width = pv.height = 112; pv.className = 'patch-pv'; pv.setAttribute('aria-hidden', 'true');
  const info = h('p', 'patch-info');
  side.append(h('span', 'ctl-name', 'One token'), pv, info);
  wrap.append(cv, side);
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), g = 224 / p; sc = Math.min(g - 1, Math.floor((e.clientX - r.left) / r.width * g)); sr = Math.min(g - 1, Math.floor((e.clientY - r.top) / r.height * g)); render(); });
  cv.addEventListener('keydown', e => { const g = 224 / p, mv = {ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0]}[e.key]; if (!mv) return; e.preventDefault(); sr = Math.max(0, Math.min(g - 1, sr + mv[0])); sc = Math.max(0, Math.min(g - 1, sc + mv[1])); render(); });
  function render(){
    const g = 224 / p, c = cv.getContext('2d');
    c.imageSmoothingEnabled = false; c.clearRect(0, 0, 448, 448); c.drawImage(off, 0, 0, 448, 448);
    c.strokeStyle = 'rgba(20,26,28,.55)'; c.lineWidth = p <= 8 ? 1 : 1.5;
    for (let i = 1; i < g; i++){ const v = i * p * 2; c.beginPath(); c.moveTo(v, 0); c.lineTo(v, 448); c.moveTo(0, v); c.lineTo(448, v); c.stroke(); }
    c.lineWidth = 6; c.strokeStyle = '#FFFFFF'; c.strokeRect(sc * p * 2, sr * p * 2, p * 2, p * 2);
    c.lineWidth = 3; c.strokeStyle = '#1E282C'; c.strokeRect(sc * p * 2, sr * p * 2, p * 2, p * 2);
    const q = pv.getContext('2d'); q.imageSmoothingEnabled = false; q.clearRect(0, 0, 112, 112); q.drawImage(off, sc * p, sr * p, p, p, 0, 0, 112, 112);
    const t = g * g;
    cv.setAttribute('aria-label', `A drawn landscape with a house, cut into ${g} by ${g} patches. Selected patch: row ${sr + 1}, column ${sc + 1}. Use the arrow keys to move.`);
    info.innerHTML = `Row ${sr + 1}, column ${sc + 1}. This patch is ${p}×${p} pixels × 3 colours = <b>${(3 * p * p).toLocaleString('en-GB')} numbers</b>, turned into one token vector.`;
    L.out.innerHTML = `With ${p}-pixel patches the image becomes ${g}×${g} = <b>${t.toLocaleString('en-GB')} tokens</b>. Attention compares every pair: ${(t * t).toLocaleString('en-GB')} pairs.` + (p <= 8 ? ' Small patches keep detail but make many tokens.' : p >= 56 ? ' Large patches make few tokens, but each one blurs a lot of detail.' : '');
  }
  L.reset = () => { p = 16; sr = 6; sc = 4; ps.set(16); render(); };
  render();
}

// ---------- Chapter 12: voting over samples ----------
function labVote(slot){
  const cache = {};
  function curve(p, w){
    const key = p.toFixed(2) + '|' + w; if (cache[key]) return cache[key];
    const rnd = mulberry32(1234 + Math.round(p * 100) * 7 + w), out = {};
    for (let n = 1; n <= 41; n += 2){
      let ok = 0;
      for (let t = 0; t < 3000; t++){
        const c = new Array(w + 1).fill(0);
        for (let i = 0; i < n; i++){ if (rnd() < p) c[0]++; else c[1 + Math.floor(rnd() * w)]++; }
        const m = Math.max(...c); if (c[0] === m) ok += 1 / c.filter(x => x === m).length;
      }
      out[n] = ok / 3000;
    }
    return cache[key] = out;
  }
  let p = .4, w = 3, n = 9, tally = null;
  const L = lab(slot, {
    title: 'Does thinking more times help?', kind: 'illus', side: true,
    intro: 'Self-consistency asks the same question several times, lets the model reason each time, and keeps the most common final answer. Here each attempt is right with a chance you choose. Wrong attempts scatter over a few wrong answers. Change the settings and watch the accuracy of the vote.',
    notice: 'More computation at answer time buys accuracy without changing the model, but only when the right answer is more likely than any single wrong answer. Set one wrong answer and a chance below 50%: more votes make things worse. Extra thinking cannot fix a model that is consistently wrong.',
    source: 'Chain-of-thought prompting (Google Research, January 2022) put worked examples with the reasoning steps in the prompt, and the model reasoned step by step too. Self-consistency (Google Research, March 2022) sampled many reasoning paths and took the most common final answer: a clear demonstration that extra inference compute converts into accuracy.',
    tech: '<p>Each point on the curve is estimated from 3,000 simulated votes. A tie counts as a fraction of a win. The demo assumes the attempts are independent. Real samples from one model are correlated, so real gains are smaller than these.</p><p>With one wrong answer, this is the Condorcet jury theorem: if each vote is right with a probability above one half, a majority is right more often as votes are added.</p>'
  });
  const pS = slider(L.controls, {label: 'Chance one attempt is right', min: .1, max: .9, step: .05, value: p, fmt: v => pc(v), onInput: v => { p = v; tally = null; render(); }});
  const wS = seg(L.controls, {label: 'Number of different wrong answers', options: [1, 2, 3, 5].map(v => [v, String(v)]), value: w, onChange: v => { w = v; tally = null; render(); }});
  const nS = slider(L.controls, {label: 'Attempts per question', min: 1, max: 41, step: 2, value: n, fmt: v => String(v), onInput: v => { n = v; tally = null; render(); }});
  const row = btnRow(L.controls);
  btn(row, 'Run one question', () => {
    const c = new Array(w + 1).fill(0); for (let i = 0; i < n; i++){ if (Math.random() < p) c[0]++; else c[1 + Math.floor(Math.random() * w)]++; }
    tally = c; render();
  });
  function render(){
    const cv = curve(p, w), acc = cv[n];
    const W = figW(L.fig, 560), H = Math.min(340, Math.max(250, Math.round(W * .6)));
    const ml = 44, mr = 12, mt = 12, mb = 42, pw = W - ml - mr, ph = H - mt - mb;
    const X = k => ml + (k - 1) / 40 * pw, Y = v => mt + ph - v * ph;
    const svg = svgIn(L.fig, W, H, '');
    [0, .25, .5, .75, 1].forEach(v => { el('line', {x1: ml, x2: ml + pw, y1: Y(v), y2: Y(v), stroke: 'var(--rule)'}, svg); tx(svg, ml - 6, Y(v) + 4, pc(v), {'text-anchor': 'end', fill: 'var(--muted)', 'font-size': 12.5}); });
    [1, 11, 21, 31, 41].forEach(k => tx(svg, X(k), H - 24, String(k), {'text-anchor': 'middle', fill: 'var(--muted)', 'font-size': 12.5}));
    tx(svg, ml + pw, H - 6, 'attempts per question', {'text-anchor': 'end', fill: 'var(--muted)', 'font-size': 13});
    el('line', {x1: ml, x2: ml + pw, y1: Y(p), y2: Y(p), stroke: 'var(--ink-2)', 'stroke-dasharray': '6 5', 'stroke-width': 1.5}, svg);
    tx(svg, ml + pw - 4, Y(p) + (p > .85 ? 16 : -6), 'one attempt', {'text-anchor': 'end', fill: 'var(--ink-2)', 'font-size': 13});
    let d = ''; for (let k = 1; k <= 41; k += 2) d += (k === 1 ? 'M' : 'L') + X(k).toFixed(1) + ',' + Y(cv[k]).toFixed(1);
    el('path', {d, fill: 'none', stroke: 'var(--lab-a)', 'stroke-width': 3}, svg);
    el('circle', {cx: X(n), cy: Y(acc), r: 7, fill: 'var(--lab-b)', stroke: 'var(--station)', 'stroke-width': 2}, svg);
    const rising = (cv[Math.min(41, n + 2)] || acc) >= (cv[Math.max(1, n - 2)] || acc);
    tx(svg, Math.min(X(n) + 10, W - 130), Y(acc) + (rising ? (acc < .12 ? -12 : 22) : (acc > .88 ? 22 : -12)), `vote right ${pc(acc)}`, {'font-weight': 700, stroke: 'var(--card)', 'stroke-width': 4, 'paint-order': 'stroke'});
    svg.setAttribute('aria-label', `Accuracy of the majority vote against number of attempts. With ${n} attempts the vote is right ${pc(acc)} of the time, against ${pc(p)} for one attempt.`);
    const each = (1 - p) / w, helps = p > each + 1e-9, equal = Math.abs(p - each) < 1e-9;
    let msg = `One attempt is right ${pc(p)} of the time. A vote over ${n} attempt${n > 1 ? 's' : ''} is right <b>${pc(acc)}</b> of the time. `;
    msg += equal ? 'The right answer is exactly as likely as each wrong one, so voting cannot pick it out.' : helps ? `Voting helps, because the right answer (${pc(p)}) is more likely than any single wrong answer (${pc(each)} each).` : `Voting hurts: each wrong answer (${pc(each)}) is more likely than the right one (${pc(p)}), so more votes lock in a wrong answer.`;
    if (tally){ const m = Math.max(...tally), win = tally[0] === m && tally.filter(x => x === m).length === 1; msg += `<br><b>One question:</b> right answer ${tally[0]} vote${tally[0] === 1 ? '' : 's'}; ` + tally.slice(1).map((c, i) => `wrong answer ${String.fromCharCode(65 + i)} ${c}`).join(', ') + `. ${win ? 'The vote is right.' : tally[0] === m ? 'A tie, so the vote is a coin toss.' : 'The vote is wrong.'}`; }
    L.out.innerHTML = msg;
  }
  L.reset = () => { p = .4; w = 3; n = 9; tally = null; pS.set(p); wS.set(w); nS.set(n); render(); };
  register(render);
}

// ---------- Chapter 12: group-relative advantages ----------
function labGrpo(slot){
  const DEF = [1, 0, 0, 1, 0, 0, 0, 1];
  let r = DEF.slice();
  const L = lab(slot, {
    title: 'How does a model learn from its own attempts?', kind: 'math',
    intro: 'In GRPO, the model answers the same question several times. A checker marks each answer right or wrong. Each answer is then compared with the group: better than average gets a push up, worse than average gets a push down. Select an answer to mark it right or wrong.',
    notice: 'The group is its own yardstick, so no separate critic network is needed to judge each answer. A rare right answer earns a big push. Make only one answer right, then seven: the single success gets far more credit. When every answer gets the same mark, there is nothing to compare, and the question teaches nothing.',
    source: 'GRPO (DeepSeek, February 2024) samples a group of answers and uses their relative scores as the baseline, dropping the critic entirely. It made large-scale reinforcement learning for reasoning affordable. DeepSeek-R1 (January 2025) used GRPO and showed that reasoning can emerge from reinforcement learning alone.',
    tech: '<p>For a group of G answers with rewards r₁ … r_G, GRPO gives every token of answer i the advantage Aᵢ = (rᵢ − mean(r)) ÷ std(r). The advantage then weights the update inside a PPO-style clipped objective, with a KL penalty that keeps the model near a reference model. Here std is the standard deviation, a measure of spread. If it is 0, this demo sets every advantage to 0.</p><p>o1’s training method was not published. DeepSeek-R1 published this one.</p>'
  });
  const row = btnRow(L.controls);
  btn(row, 'Make all right', () => { r = r.map(() => 1); render(); });
  btn(row, 'Make all wrong', () => { r = r.map(() => 0); render(); });
  btn(row, 'Make one right', () => { r = r.map((_, i) => i === 3 ? 1 : 0); render(); });
  function render(){
    const m = sum(r) / r.length, sd = Math.sqrt(sum(r.map(x => (x - m) ** 2)) / r.length), A = r.map(x => sd > 0 ? (x - m) / sd : 0);
    const mx = Math.sqrt(7); // the largest possible push in a group of 8
    L.fig.innerHTML = '';
    const g = h('div', 'grpo'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Eight answers. Select one to mark it right or wrong.');
    r.forEach((x, i) => {
      const b = h('button', 'grpo-col' + (x ? ' ok' : '')); b.type = 'button';
      b.setAttribute('aria-pressed', String(!!x));
      b.setAttribute('aria-label', `Answer ${i + 1}: ${x ? 'right' : 'wrong'}, push ${A[i] >= 0 ? 'up' : 'down'} ${Math.abs(A[i]).toFixed(2)}. Select to change.`);
      const hgt = Math.abs(A[i]) / mx * 70;
      b.innerHTML = `<span class="gv" aria-hidden="true">${A[i] > 0 ? '+' : ''}${A[i].toFixed(2)}</span><span class="gbar" aria-hidden="true"><i style="height:${hgt}px;${A[i] >= 0 ? 'bottom:50%' : 'top:50%'}" class="${A[i] >= 0 ? 'up' : 'dn'}"></i></span><span class="gm" aria-hidden="true">${x ? '✓ right' : '✗ wrong'}</span><span class="gn" aria-hidden="true">#${i + 1}</span>`;
      b.onclick = () => { r[i] = 1 - r[i]; render(); L.fig.querySelectorAll('.grpo-col')[i].focus(); };
      g.appendChild(b);
    });
    L.fig.appendChild(g);
    L.fig.appendChild(h('p', 'mg-cap', 'Bars above the middle line push an answer up. Bars below push it down.'));
    const k = sum(r);
    L.out.innerHTML = sd === 0
      ? `All 8 answers got the same mark, so the spread is 0. Every answer gets 0: there is nothing to learn from this question. GRPO needs a mix of right and wrong answers in the group.`
      : `${k} of 8 right. Average mark ${m.toFixed(2)}, spread ${sd.toFixed(2)}. Each right answer gets <b>+${A[r.indexOf(1)].toFixed(2)}</b> and each wrong answer gets <b>${A[r.indexOf(0)].toFixed(2)}</b>.` + (k === 1 ? ' A rare success gets a large push.' : k === 7 ? ' Success is common here, so each right answer gets only a small push, and the one failure is pushed down hard.' : '');
  }
  L.reset = () => { r = DEF.slice(); render(); };
  render();
}

// ---------- Chapter 13: the agent loop ----------
function labReact(slot){
  const months = (a, b) => { const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number); let m = (y2 - y1) * 12 + (m2 - m1); if ((d2 || 1) < (d1 || 1)) m--; return m; };
  const find = q => N.find(n => n.short.toLowerCase() === q.toLowerCase()) || (((IDX.search(q, 1) || [])[0] || {}).id && by[IDX.search(q, 1)[0].id]);
  const obs = n => ({text: `${n.short}: ${when(n)}. ${n.inst}. “${firstSentence(n.breakthrough)}”`, id: n.id});
  const TASKS = {
    t1: {q: 'How many months passed between the Transformer paper and BERT, and who published them?', a: 'Transformer', b: 'BERT',
      mem: 'The Transformer came out in 2017, and BERT followed perhaps a year or two later. I think both were from Google.',
      ans: (x, y, m) => `About ${m} months. The Transformer (${when(x)}) came from ${x.inst}. BERT (${when(y)}) came from ${y.inst}.`},
    t2: {q: 'How long after LoRA did QLoRA appear, and what did QLoRA add?', a: 'LoRA', b: 'QLoRA',
      mem: 'QLoRA came out a year or so after LoRA and made fine-tuning cheaper in some way.',
      ans: (x, y, m) => `QLoRA appeared ${m} months after LoRA. What it added: ${y.breakthrough}`}
  };
  let task = 't1', mode = 'tools', shown = 0, timer = null;
  function steps(){
    const T = TASKS[task];
    if (mode === 'mem') return [{k: 'Answer', t: T.mem, note: 'Written for this demo to show a typical answer from memory. It is not output from a real model.'}];
    const x = find(T.a), y = find(T.b), m = months(x.date, y.date);
    return [
      {k: 'Thought', t: `I need the date of each one. I will look them up instead of guessing.`},
      {k: 'Action', t: `search("${T.a}")`, tool: true},
      {k: 'Observation', ...obs(x)},
      {k: 'Action', t: `search("${T.b}")`, tool: true},
      {k: 'Observation', ...obs(y)},
      {k: 'Thought', t: 'I have both dates. I will compute the gap with a tool, not in my head.'},
      {k: 'Action', t: `months_between("${x.date}", "${y.date}")`, tool: true},
      {k: 'Observation', t: String(m)},
      {k: 'Answer', t: T.ans(x, y, m)}
    ];
  }
  const L = lab(slot, {
    title: 'What does an agent actually do?', kind: 'react',
    intro: 'An agent works in a loop. It writes a thought, takes an action with a tool, reads what comes back, and repeats until it can answer. Step through the loop, then compare it with an answer from memory.',
    notice: 'Each observation changes what the agent does next. The agent does not need to remember the dates. It needs to know which tool to call and when to stop. Every fact in the final answer comes from an observation, so each one can be checked.',
    source: 'ReAct (Princeton and Google, 2022) interleaved reasoning and acting in one loop: a thought, an action, an observation, repeat. This loop is the skeleton of almost every agent framework that followed. The Model Context Protocol (Anthropic, 2024) is an open protocol for exposing tools, data and prompts to any model, so each side implements it once.',
    tech: '<p>In a real agent, a language model writes each Thought and Action as text. A program reads the Action, runs the tool, and adds the result to the text as an Observation. The loop repeats until the model writes an Answer.</p><p>Here the Thoughts are scripted. The two tools are real: search finds a milestone on this page (by exact name first, then by the keyword index from chapter 10), and months_between does the date arithmetic. Function calling and MCP standardise how the Action and the result are passed between the model and the tool.</p>'
  });
  const ts = seg(L.controls, {label: 'Question', options: [['t1', 'Transformer and BERT'], ['t2', 'LoRA and QLoRA']], value: task, onChange: v => { stop(); task = v; shown = 0; render(); }});
  const msS = seg(L.controls, {label: 'Method', options: [['tools', 'Think and use tools'], ['mem', 'Answer from memory']], value: mode, onChange: v => { stop(); mode = v; shown = 0; render(); }});
  const row = btnRow(L.controls);
  const nextB = btn(row, 'Next step', () => { stop(); if (shown < steps().length){ shown++; render(); } }, 'primary');
  const allB = btn(row, 'Run all', () => { if (timer){ stop(); return; } runAll(); });
  function stop(){ clearInterval(timer); timer = null; allB.textContent = 'Run all'; }
  function runAll(){ const S = steps(); if (shown >= S.length) shown = 0; if (reduce){ shown = S.length; render(); return; } allB.textContent = 'Pause'; timer = setInterval(() => { shown++; render(); if (shown >= S.length) stop(); }, 650); }
  function render(){
    const S = steps(), T = TASKS[task];
    L.fig.innerHTML = `<p class="react-q"><b>Question:</b> ${esc(T.q)}</p>`;
    const ol = h('ol', 'react');
    S.slice(0, shown).forEach(s => {
      const li = h('li', 'rs rs-' + s.k.toLowerCase());
      li.innerHTML = `<span class="rk">${s.k}</span><span class="rt">${s.tool ? `<code>${esc(s.t)}</code>` : esc(s.t)}${s.note ? `<em class="rnote">${esc(s.note)}</em>` : ''}</span>`;
      if (s.id){ const b = h('button', 'rr-name', 'Open the card'); b.type = 'button'; b.onclick = ev => openCard(s.id, ev.currentTarget); li.querySelector('.rt').appendChild(b); }
      ol.appendChild(li);
    });
    if (!shown) ol.appendChild(h('li', 'rs rs-empty', '<span class="rt">Press “Next step” to start the loop.</span>'));
    L.fig.appendChild(ol);
    nextB.disabled = shown >= S.length;
    if (mode === 'mem') L.out.textContent = shown ? 'No tools were used. The answer is vague, and nothing in it can be checked.' : 'Press “Next step” to see an answer from memory.';
    else L.out.textContent = shown >= S.length ? 'Done. Three tool calls, and every fact in the answer came from an observation.' : !shown ? `This loop has ${S.length} steps.` : `Step ${shown} of ${S.length}.` + (shown && S[shown - 1].k === 'Observation' ? ' The tool result is now in view, and the next step can use it.' : '');
  }
  L.reset = () => { stop(); task = 't1'; mode = 'tools'; shown = 0; ts.set(task); msS.set(mode); render(); };
  render();
}

// ---------- mount ----------
const LABS = {
  1: [labNgram], 2: [labVectors],
  3: [labAttention, s => quiz(s, {title: 'Where did attention start?', q: 'When did attention first appear in a language model?', options: [
    ['In 2017, in the Transformer paper', false, 'The Transformer kept only attention and removed recurrence. It did not invent attention.'],
    ['In 2014, in a translation model by Bahdanau, Cho and Bengio', true, 'Their decoder looked back over every input word and weighted each by relevance, three years before the Transformer.'],
    ['In 2003, in Bengio’s neural language model', false, 'That model learned a vector for every word. It had no attention.']]})],
  4: [labMask], 5: [labPower, labBudget],
  6: [labAlign, s => quiz(s, {title: 'What does alignment add?', q: 'A 1.3-billion-parameter InstructGPT model was preferred to the 175-billion-parameter base model. What does this suggest?', options: [
    ['Alignment adds a lot of new knowledge to a model', false, 'The chapter says the opposite: alignment does not add much knowledge.'],
    ['Alignment steers and draws out what pretraining already put there', true, 'That is the chapter’s conclusion. The small model already knew enough; alignment made it follow instructions.'],
    ['Smaller models are always better than bigger ones', false, 'The comparison was between an aligned model and a model that was not aligned, not a rule about size.']]})],
  7: [s => quiz(s, {title: 'What was new about ChatGPT?', q: 'What did ChatGPT add in November 2022?', options: [
    ['A new training method', false, 'OpenAI described ChatGPT as a sibling of InstructGPT. The method already existed.'],
    ['A much more capable model', false, 'The capability jump came four months later, with GPT-4.'],
    ['A free chat interface that anyone could use', true, 'It was a breakthrough in interface and distribution, and it reached an estimated hundred million users within about two months.']]})],
  8: [labMoE], 9: [labFit], 10: [labRag], 11: [labPatches], 12: [labVote, labGrpo], 13: [labReact]
};
document.querySelectorAll('.lab-slot').forEach(s => { (LABS[s.dataset.ch] || []).forEach(f => f(s)); if (!s.children.length) s.remove(); });
