---
milestone: qlora2023
source: https://arxiv.org/abs/2305.14314v1
version: arXiv version 1 (May 2023), a preprint under review; the paper was later published at NeurIPS 2023
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It made it possible to fine-tune a 65 billion-parameter model on a single 48 GB GPU, by storing the frozen model in 4 bits and training only small adapters, with no loss against normal 16-bit fine-tuning in the authors' tests.

## The problem before it

Fine-tuning improves a language model and can add or remove behaviours. But regular 16-bit fine-tuning of [LLaMA](/milestones/llama2023/) 65B needs more than 780 GB of GPU memory, which means many expensive GPUs.

Two partial fixes existed. [LoRA](/milestones/lora2021/) trains only small added matrices and keeps the original weights frozen, but the frozen weights still fill memory in 16 bits. Quantisation stores weights in fewer bits, as in [LLM.int8()](/milestones/llm_int8_2022/), but the authors note that such methods worked for running a model, not for training it, and broke down during training.

## The idea

**The mechanism.** QLoRA combines the two. It stores the frozen model in 4 bits and trains [low-rank adapters](/glossary/low-rank-adaptation/) on top in 16 bits. Each time a weight is used, it is turned back into a 16-bit number for the calculation. Gradients pass through the frozen 4-bit model into the adapters, and only the adapters change.

Three new parts save memory without losing quality:

- **[4-bit NormalFloat](/glossary/normalfloat/) (NF4).** A 4-bit number has only 16 possible values. The weights of a trained network roughly follow a bell-shaped (normal) distribution. NF4 places its 16 values so that each one covers an equal share of that distribution, with an exact zero. The authors call it information-theoretically optimal for normally distributed weights.
- **Double quantisation.** Weights are quantised in blocks of 64, and each block needs a 32-bit scale number. That adds 0.5 bits per weight. QLoRA quantises these scale numbers too, to 8 bits, which cuts the extra cost to about 0.127 bits per weight. For a 65B model, that saves about 3 GB.
- **Paged optimisers.** Rare long inputs can cause sudden memory peaks. The optimiser's state is put in memory that the GPU can move to ordinary computer memory when it runs short, and move back when needed.

The authors also found that LoRA's usual setting, with adapters only on the attention layers, does not match full fine-tuning on large models. Adapters must go on every linear layer of each Transformer block.

**The notation.** For one layer, QLoRA computes `Y = X · doubleDequant(c1, c2, W_NF4) + X · L1 · L2`. `W_NF4` is the frozen 4-bit weight matrix, `c2` are its 8-bit scale numbers and `c1` the 32-bit scales of those. `L1` and `L2` are the small trainable adapter matrices, kept in 16-bit BrainFloat. Only `L1` and `L2` get weight gradients.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv paper, a preprint under review. The paper was later published at NeurIPS 2023. The authors trained more than 1,000 models.

- **Memory.** Fine-tuning a 65B model fell from more than 780 GB to less than 48 GB.
- **No loss against 16 bits.** On GLUE with RoBERTa-large and on Super-NaturalInstructions with T5 models of up to 3 billion parameters, 4-bit QLoRA matched both full 16-bit fine-tuning and 16-bit LoRA. On LLaMA 7B to 65B, the mean 5-shot MMLU score was 53.1 for NF4 with double quantisation, against 53.0 for 16-bit LoRA.
- **NF4 beats other 4-bit formats.** Mean perplexity across many models was 27.41 for NF4 with double quantisation, against 31.07 for a standard 4-bit float and 34.34 for 4-bit integers. A 4-bit float was about 1 point behind on MMLU.
- **A strong chatbot from a small dataset.** Guanaco, LLaMA fine-tuned with QLoRA on OASST1 (9,000 examples), scored 99.3% of ChatGPT's score on the Vicuna benchmark, as judged by GPT-4, at 65B. It took 24 hours on one professional GPU. The 33B model scored 97.8% in less than 12 hours on one consumer GPU.
- **Head-to-head ratings.** In Elo ratings from GPT-4's judgements, Guanaco 65B (1022) and 33B (992) were above ChatGPT (966) and below GPT-4 (1348).
- **Quality over quantity.** The 9,000-example OASST1 dataset gave a better chatbot than a 450,000-example sample of FLAN v2. But FLAN v2 gave the best MMLU scores. A good score on one benchmark did not predict a good score on the other.
- **The paper gives two comparisons for the smallest Guanaco.** The introduction says Guanaco 7B, at 5 GB, beats a 26 GB Alpaca model by more than 20 points. Section 5.3 says it scores nearly 20 points higher than Alpaca 13B. In Table 6, Guanaco 7B scores 87.0% and Alpaca 13B 69.4%, a gap of 17.6 points. All are given here.
- **GPT-4 as a judge.** GPT-4 and human raters largely agreed on the ranking of systems, but agreed less on single answers. GPT-4 favoured whichever answer came first in its prompt, and rated its own answers higher than people did (Elo 1348 against 1176).

## Limits, and what came later

The limits come from the paper:

- The authors did not show that QLoRA matches full 16-bit fine-tuning at 33B and 65B. That was too costly to test, so at that scale they compare only with 16-bit LoRA.
- Evaluation covers MMLU, the Vicuna benchmark and their OA benchmark, but not others such as BigBench or HELM. The Vicuna benchmark has wide confidence intervals.
- Human raters agreed only moderately with each other, and the authors themselves often disagreed on which answers were better.
- Bias was tested only on one dataset (CrowS). Guanaco scored lower there than the LLaMA base model, but other kinds of bias were not checked.
- Other bit widths, such as 3 bits, and adapter methods other than LoRA were not tested.
- Guanaco was trained only with supervised fine-tuning, not RLHF. Comparing the two is left open.
- Fine-tuning is dual-use: wider access also makes misuse easier.

The data does not yet record later milestones that build directly on QLoRA.

## What to know first

- [LoRA](/milestones/lora2021/) and [low-rank adaptation](/glossary/low-rank-adaptation/).
- What quantisation is: storing numbers with fewer bits, using a scale factor, and the problem of outlier values. [LLM.int8()](/milestones/llm_int8_2022/) is the authors' earlier 8-bit work.
- How fine-tuning uses memory: weights, gradients, optimiser state and activations.
- [Instruction tuning](/glossary/instruction-tuning/), and the [LLaMA](/milestones/llama2023/) models used here.

## How to read it

The main text is 16 pages.

1. Read section 1 with Figure 1, which compares the memory needs of full fine-tuning, LoRA and QLoRA.
2. Read section 2 for block-wise quantisation and LoRA, then section 3 for NF4, double quantisation and paged optimisers.
3. Read section 4 with Tables 3 and 4, the evidence that 4 bits lose nothing.
4. Read section 5.3 with Table 6, then section 8 for the authors' own limits.

The NF4 formula in section 3 can be skimmed. Expect about 1.5 hours for the parts above (an estimate).

## Links

- The paper: [arXiv 2305.14314](https://arxiv.org/abs/2305.14314)
- Code: [artidoro/qlora](https://github.com/artidoro/qlora) and [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes), both named in the paper. The bitsandbytes address in the paper, under TimDettmers, now leads to this one.
- Video: none is linked here yet.
