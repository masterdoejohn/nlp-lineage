---
milestone: gshard2020
source: https://arxiv.org/abs/2006.16668v1
version: arXiv version 1 (June 2020), a preprint under review; the paper was later published at ICLR 2021
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It made giant mixture-of-experts models practical to train. A programmer adds a few notes to the model code to say how each large array should be split, and a compiler spreads the work over thousands of chips. With it, the authors trained a 600-billion-parameter translation model in 4 days.

## The problem before it

Larger models were better, but training them was hard in practice. The authors list four problems:

- **Little support for splitting a model.** Common frameworks could not split one model over many devices efficiently. Users had to rewrite their models for special tools.
- **Cost grows faster than the model.** Making a normal model deeper or wider makes every training step slower. Splitting it over more devices adds communication and leaves devices idle.
- **Programs too large to compile.** If the compiler makes a separate program for each device, the program grows with the number of devices, and compiling for thousands of devices takes too long.
- **Hand-written splitting is hard work.** Each change to the model needs new code for the communication between devices.

[Sparsely gated mixture-of-experts](/milestones/shazeer2017_moe/) layers had already shown how to add parameters without adding much computation per token. But they had been used with recurrent networks, and splitting them over many devices was still hard.

## The idea

**The mechanism.** The paper has two parts: a model design and a system to train it.

**The model: a Transformer with mixture-of-experts layers.** Start from a [Transformer](/milestones/transformer2017/) encoder-decoder and replace every second feed-forward layer with a mixture-of-experts layer. An expert is a small feed-forward network. A gating network picks at most 2 experts for each token, so each token uses only a small part of the model. The gate has four rules to keep the work balanced:

- **Expert capacity.** Each expert takes at most a fixed number of tokens per batch. If both chosen experts are full, the token skips the layer through its residual connection.
- **Local groups.** Tokens are split into groups that are routed in parallel, each with its share of every expert's capacity.
- **An extra loss term** that pushes the gate to spread tokens over all experts.
- **Random second choice.** A token is sent to its second expert with a probability that grows with that expert's weight, which saves capacity.

**The system: GShard.** GShard is a small set of annotation functions and an extension to the XLA compiler.

- The programmer writes the model as if it runs on one very large device. Then they mark a few key arrays with `replicate` (copy to every device), `split` (cut along one dimension) or `shard` (a more general split).
- The compiler works out how to split the other arrays and adds the communication between devices.
- The compiler makes one program that runs on every device. This kind of program is called SPMD (single program, multiple data). Its compile time stays nearly the same, whatever the number of devices.

In the translation model, attention layers are copied to every device, and the experts are split across devices, one expert per device in each mixture-of-experts layer.

**The notation.** For a token `x_s`, the layer's output is `y_s = Σ_e G_(s,e) · FFN_e(x_s)`. Here `FFN_e` is expert `e`, and `G_(s,e)` is its gate weight, which is zero for all but at most 2 experts.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv preprint. The task is translation from 100 languages into English, trained on about 13 billion example pairs mined from the web. BLEU is a standard translation score; higher is better. The paper reports the average gain over separate models trained for each language pair.

- **Bigger was better, and cost grew slowly.** Going from 37.5 billion to 600 billion parameters (16 times larger) raised the training cost only from about 6 to 22 TPU core-years (3.6 times).
- **The 600-billion-parameter model** (36 layers, 2,048 experts per layer) trained in 4 days on 2,048 TPU v3 cores. It had the best average BLEU: 44.3, against 30.8 for the separate bilingual models.
- **Against a dense model.** The best dense Transformer, with 96 layers and 2.3 billion parameters, scored 36.9. It took about 6 weeks on the same 2,048 cores, more than 10 times the cost.
- **Against separate models.** Training all 100 bilingual baseline models would have cost about 29 TPU core-years, more than the 22 for the single 600-billion-parameter model.
- **Depth and experts both helped.** Tripling the depth from 12 to 36 layers added about 2 to 3 BLEU. Going from 128 to 512 experts per layer added 3.3 BLEU, but from 512 to 2,048 only 1.3 more.
- **The system scaled.** When the model grew 16 times, from 128 to 2,048 devices, the time per step grew only 1.7 times. The memory used on each device stayed about the same.

## Limits, and what came later

The limits come from the paper:

- **A 1-trillion-parameter model was unstable.** The authors trained a 60-layer model with 1 trillion parameters, but it had numerical problems, so they left out its results.
- **Diminishing returns.** Each step up in the number of experts gave a smaller gain.
- **Low-resource languages.** For languages with little data, the 96-layer dense model did better than a 12-layer mixture-of-experts model with a similar average score. The authors suggest that depth and shared parameters help knowledge transfer between languages.
- **Communication grows.** The cost of sending tokens to experts on other devices grows with the square root of the number of devices. At 2,048 experts, it took 36% of the layer time.
- **The tests are on Google's TPUs** and on one in-house translation dataset.
- **Parameters are not capacity.** The authors warn that counting parameters does not always measure what a model can do.

[Switch Transformer](/milestones/switch2021/) simplified the routing to one expert per token. [Mixtral](/milestones/mixtral2023/) and [DeepSeekMoE](/milestones/deepseekmoe2024/) built on this kind of conditional computation. Google's later large models, such as [PaLM](/milestones/palm2022/) and [Gemini](/milestones/gemini1_2023/), were built on Google's sharding infrastructure.

## What to know first

- The [Transformer](/milestones/transformer2017/) encoder-decoder.
- [Sparsely gated mixture-of-experts](/milestones/shazeer2017_moe/), which this paper scales up.
- The two basic ways to use many chips: data parallelism (each chip has a copy of the model and its own data) and model parallelism (each chip holds part of the model).

## How to read it

The paper is 35 pages, with 25 pages of main text. It is half model and half systems.

1. Read section 1 with Figure 1 for the problem and the main result.
2. Read section 2, the mixture-of-experts Transformer and its gating rules.
3. Read section 3.2 for the annotation functions. Section 3.3 is compiler detail and is optional.
4. Read section 4 with Figure 6 and Tables 1 to 3 for the translation results.
5. Skim section 5 for memory and speed.

Expect about 2 hours for the steps above (an estimate).

## Links

- The paper: [arXiv 2006.16668](https://arxiv.org/abs/2006.16668)
- Code: the paper does not link code. It names the XLA compiler and the Lingvo framework as the base of its work.
- Video: none is linked here yet.
