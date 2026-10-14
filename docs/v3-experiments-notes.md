# How language models came to be: interactive edition

Build notes for the published page (artifact version 3, 9 October 2026).

## 1. What changed

The route-map page keeps everything it had: 14 chapters, metro maps, study cards, the whole-network map and the lineage tracer, over the same 200 milestones and 414 relationships. Nothing in the data changed.

Added to the page:

- 16 experiments and 3 one-question checks, placed after each chapter's key milestones.
- A "Remember" line closing each chapter.
- Links to 3 video lessons (chapters 3 and 4).
- A key to the experiment labels in the footer.

Every experiment follows the same reading order:

1. The question (its title).
2. The plain-language idea (intro).
3. A picture.
4. Controls.
5. A live explanation that updates as you change the controls.
6. "What to notice", which explains why the result happens.
7. "What the sources say", with facts from the research only.
8. "The technical detail", collapsed, with the exact formula and what the demo simplifies.

Every experiment also carries a label that says what kind of numbers it uses:

- **Illustrative values**: invented numbers that show how an idea works.
- **Formula from the paper**: the formula and constants come from the research.
- **Exact arithmetic**: a real calculation on inputs you choose.
- **Real computation**: a real search over this page's own data.
- **Scripted, with real lookups**: reasoning steps written in advance; the tool calls really run.

## 2. Content-to-interaction map

| Ch | Source concept (from the page) | Experiment | Learner changes | What updates | What it teaches |
|---|---|---|---|---|---|
| 1 | Counting has a ceiling; Bengio's shared word vectors | Can counting predict something it has never seen? (illustrative) | Previous word; "share counts" toggle; generate a sentence | Next-word bar chart; zero bars marked "never seen"; new word pairs flagged | Unseen pairs get 0% from counting; sharing between similar words fixes it ("bird ate" 0% → 20%) |
| 2 | word2vec: meaning has geometry (king − man + woman) | Can you do arithmetic with meanings? (illustrative, 2-D) | 4 presets, or your own A − B + C; 3-step walkthrough | Arrow drawn, moved (animated), nearest word ringed | A difference between words is a direction you can reuse |
| 3 | The Transformer's advantage is parallelism | Why did removing recurrence matter? (exact arithmetic) | Sentence length; run/pause | n sequential steps against 1 parallel step; n×n pair grid | Parallel work suits GPUs; the cost is n² pairs |
| 3 | Bahdanau attention; scaled dot-product attention | Where does a word look? (illustrative) | Last word (tired/wide); simulated dₖ; divide-by-√dₖ toggle; any word as the query | Attention bars per word; table of scores, scaled scores and weights | Context changes the links; √dₖ stops the softmax from collapsing |
| 3 | Attention starts in 2014, not 2017 | Check: Where did attention start? | Choose an answer | Feedback with the reason | Keeps the chapter's key qualification |
| 4 | GPT (next word) against BERT (masked, both directions) | Which words can the model see? (exact) | Model; position read so far or word to hide | Triangle against full visibility grid; the target word | Why GPT writes and BERT understands |
| 5 | Scaling laws: smooth power law | How much does ten times bigger buy? (formula from paper) | Parameters; log or ordinary axes | Curve, point, loss value | About 16% lower loss per 10×; straight on log axes, so it is predictable |
| 5 | Chinchilla: scale data with parameters (~20 tokens/param) | Bigger model, or more data? (formula from paper) | Real-model presets; compute budget; tokens per parameter | Log–log plot with the same-compute line; model size and tokens | The same budget can buy a big model or more data; Gopher, Chinchilla and Llama 3 8B compared |
| 6 | RLHF; alignment steers and does not add knowledge; DPO | What happens when you optimise toward a judge? (illustrative) | β (leash); sound, flawed, or your own reward model (pairwise choices); "base never writes clear steps" | Base against aligned bars; KL; learned rewards | The leash trade-off; reward hacking; a behaviour the base model never produces stays at 0% |
| 6 | 1.3B aligned preferred to 175B base | Check: What does alignment add? | Choose an answer | Feedback | Alignment draws out what pretraining put there |
| 7 | ChatGPT: interface and distribution, not capability | Check: What was new about ChatGPT? | Choose an answer | Feedback | Keeps the chapter's precise claim |
| 8 | Mixtral, DeepSeek-V3: total against active parameters | How can a model be huge but cheap per word? (illustrative router) | Experts per word k; step or play through the sentence | Router lines and weights; expert usage counts | Total parameters set storage; active parameters set the work per word |
| 9 | Quantization, LoRA, QLoRA, MQA/GQA, vLLM | Will it fit on one GPU? (exact arithmetic) | Tabs: weights (size, precision), LoRA (d, rank), cache (context, KV heads) | Memory bars against 24/48/80 GB; matrix against thin strips | Memory is the limit; QLoRA's 65B on one 48 GB GPU checks out |
| 10 | RAG: retrieve, then generate | Can the model look it up? (real search over the page's 200 milestones) | Free-text question; 4 suggestions | Ranked results with match scores and shared words; the prompt a generator would receive | Retrieval sets what the answer can say; keyword search misses negation and paraphrase |
| 11 | ViT patches; CLIP shared space | How does a picture become tokens? (exact) | Patch size; select a patch by click or arrow keys | Grid overlay; magnified token; token and pair counts | Smaller patches mean more detail at a fast-growing cost |
| 12 | Chain of thought and self-consistency | Does thinking more times help? (illustrative simulation) | Chance one attempt is right; number of wrong answers; attempts; run one question | Vote-accuracy curve; one sampled tally | Answer-time compute helps only when the right answer beats each wrong one |
| 12 | GRPO, DeepSeek-R1 | How does a model learn from its own attempts? (exact) | Mark each of 8 answers right or wrong; presets | Push up or down per answer; mean and spread | Group-relative credit; rare success gets a big push; no spread means no signal |
| 13 | ReAct loop; tools; MCP | What does an agent actually do? (scripted, real lookups) | Question; tools or memory; next step or run all | Thought, Action, Observation, Answer trace; real dates and real month arithmetic | Each observation drives the next step; every fact in the answer can be checked |
| 14 | A frontier model is the sum of the route | What is inside a 2026 frontier model? (summary) | Expand any of 9 layers | Explanation, milestone buttons that open study cards, chapter link | How the threads combine |

Chapter 7 has a check rather than an experiment, because its point is about distribution, not mechanism.

## 3. Responsive design summary

**Desktop (900px and wider).** Experiments with several controls use two columns: controls and the live explanation on the left (270px), the picture on the right. "What to notice" and "What the sources say" sit side by side. Reading text stays at about 64 characters per line. The lab cards are up to 940px wide, wider than the 700px text column, to give diagrams room.

**Tablet (600 to 899px).** Every experiment stacks in this order: controls, picture, explanation. The notes stay in two columns from 760px.

**Phone (under 600px).** One column with tighter card padding.

- Every chart is redrawn at the real width of the card, so text inside diagrams stays at 12.5px or larger instead of shrinking.
- The mixture-of-experts diagram puts the router on the left and stacks the experts on the right, so that no line crosses a box.
- The GRPO columns switch to ✓ and ✗ marks.
- The ReAct step labels move above their text.
- The footer key wraps.

**Everywhere.**

- No horizontal page scroll; this was tested at 390, 820 and 1440px.
- Charts redraw on resize, with a 150ms debounce.
- Controls are at least 32px tall, and most are 40 to 44px.

## 4. Testing report (what was actually run)

All tests used headless Chromium (Playwright) on the built file, with the Google Fonts requests blocked.

| Check | How | Result |
|---|---|---|
| Script syntax | `node --check` on the inline script at every build | Pass |
| Console and page errors | Load at 390×844, 820×1180 and 1440×900 | No script errors. The only console error was the blocked font request. |
| Horizontal overflow | `scrollWidth` against viewport, and every element's right edge, at all 3 sizes and again after all interactions | None |
| Every experiment's controls | 73 scripted assertions per viewport, run at 390px with reduced motion and 1440px without, for 146 in total. Each assertion operated a control and checked the resulting explanation text or state, for example "bird ate" reaching 20%, king − man + woman ≈ queen, the 32k cache at 17.2 GB with 32 heads, ReAct computing 15 and 23 months from the data, resets restoring defaults, and RAG's empty, stopword-only and no-match messages | 146/146 pass |
| Study card from experiments | Opened from RAG and anatomy; closed with Escape; focus returns to the opener | Pass |
| Keyboard | Tab order through experiment 1 (reset, buttons, checkbox, button, details), all with a visible 2px outline. Enter and Space operate buttons and checkboxes. Arrow keys move sliders and the patch selection | Pass |
| Accessible names | Every visible lab button, input, select, canvas and summary has a name; every slider has `aria-valuetext` | Pass |
| Touch targets | Visible lab controls at least 32px tall | Pass |
| Reduced motion | "Run" and "Play" jump straight to the end state at 390px with reduced motion; the vector arrow transition is off | Pass |
| Dark mode | Screenshots at desktop and phone | Readable. Colour tokens switch. |
| Contrast | Computed for colour tokens on card and paper backgrounds | Text tokens are 4.5:1 or better in both themes, after darkening the light-theme green |
| Existing features | Station click → study card → "Trace its lineage" → tracer picker → weak-links toggle | Pass at 390 and 1440px |
| Visual review | Screenshots of all 19 lab cards at phone and desktop, plus samples at tablet and in dark mode | Overlaps found and fixed: vector labels, budget chart labels, MoE boxes, GPU-size labels, tab panels showing at once, the vote label |
| Video links | The 3Blue1Brown attention lesson was confirmed by web search today. The 3Blue1Brown GPT lesson and the Karpathy video were verified earlier in this project and not re-fetched | Partly re-checked |

## 5. Known limitations

- **Fonts.** Archivo and Newsreader could not load in the test sandbox, so every screenshot used fallback fonts. Spacing with the real fonts was not checked by eye.
- **Testing scope.** No tests on real phones or tablets, no screen-reader test, and no browsers other than Chromium.
- **Experiments are teaching models, not reproductions.** Attention weights, word vectors, router scores, reward values and the alignment answer styles are invented and labelled. The scaling-law constants (α ≈ 0.076, N꜀ ≈ 8.8 × 10¹³) and the model figures (Chinchilla, Gopher, Llama 3, Mixtral, DeepSeek-V3, QLoRA) come from the sources.
- **Facts from the papers, not the page's data.** A few figures in "What the sources say" come from the original papers and do not appear in the page's milestone data:
  - Gopher's 300B training tokens.
  - BERT's 15% masking rate.
  - Mixtral's routing to 2 of 8 experts.
  - The Transformer paper's √dₖ rationale and its comparison table.
- **RAG demo.** It uses keyword search (TF-IDF), not a dense retriever, and no generator runs. The page contains no language model, so it shows the prompt a generator would receive.
- **ReAct demo.** The reasoning text is scripted. The memory answer is written for the demo and is labelled as such.
- **Self-consistency demo.** It assumes independent attempts. Real samples are correlated, so real gains are smaller; the demo says so.
- **Cache tab.** It uses an illustrative 7B-class shape (32 layers, head size 128). The 90% "fits" margin is an assumption, and the demo says so.
- **Plain-language prose.** The prose follows ASD-STE100 principles (short sentences, one idea each, terms defined at first use). It has not been checked against the standard, so it is not claimed to comply.
- **Videos.** They are linked, not embedded, so they open on the publisher's site.
- **Single file.** The page is one self-contained HTML file, as the artifact format requires. The source is split into a template, two experiment scripts, a data file and a build script.

## 6. Source files

| File | Purpose |
|---|---|
| `template.html` | Page structure, all CSS, map, study card, tracer, chapter takeaways and video links. It has two placeholders: `__PAYLOAD__` and `/*__LABS__*/` |
| `labs_a.js` | Shared experiment helpers and the experiments for chapters 1 to 5 |
| `labs_b.js` | Chapters 6 to 14, the keyword index, the checks and the mount table |
| `payload.json` | The research data: 200 nodes, 414 edges and the story |
| `build.py` | Combines the parts, checks that referenced milestone ids exist, syntax-checks the script and writes the page |
| `test_smoke.py`, `test_interact.py`, `test_a11y.py` | The Playwright checks listed above |

Build with `python3 build.py out.html`.
