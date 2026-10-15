---
milestone: llama2023
source: https://arxiv.org/abs/2302.13971v1
version: arXiv version 1 (February 2023)
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that models trained only on public data, and trained on far more tokens than usual, can match much larger closed models. Meta released the LLaMA models to researchers, and the 13-billion-parameter model, which beat GPT-3 on most tests, could run on a single GPU. Much of the open-model work of 2023 was built on them.

## The problem before it

The best large language models of 2022, such as [GPT-3](/milestones/gpt3_2020/), [Chinchilla](/milestones/chinchilla2022/) and [PaLM](/milestones/palm2022/), were not available to researchers. Most were trained on data that was not public or not documented, such as "Books – 2TB" or "Social media conversations". The open models that existed, such as [OPT](/milestones/opt2022/) and BLOOM, were not as good.

There was also a question of cost. [Chinchilla](/milestones/chinchilla2022/) had shown how to get the best model for a fixed training budget. The authors point out that this ignores the cost of running the model. For a model that many people will use, a smaller model trained for longer can be the better choice: it costs more to train but less to run. For example, Chinchilla's analysis suggests training a 10-billion-parameter model on 200 billion tokens, but the authors found that a 7-billion-parameter model kept improving after 1 trillion tokens.

## The idea

**The mechanism.** Train four models, of 7, 13, 33 and 65 billion parameters, on far more data than usual: 1 trillion tokens for the two smaller models and 1.4 trillion for the two larger ones.

- **Only public data.** About 1.4 trillion tokens from 7 sources: web pages from CommonCrawl (67%), the C4 dataset (15%), GitHub code (4.5%), Wikipedia in 20 languages (4.5%), books (4.5%), arXiv papers (2.5%) and Stack Exchange (2%). Most tokens are seen once; Wikipedia and the books are seen about twice.
- **A standard Transformer, with improvements from earlier models:**
  - **Pre-normalisation** (from GPT-3): normalise the input of each sub-layer, not the output, using RMSNorm. This makes training more stable.
  - **SwiGLU activation** (from PaLM) in place of ReLU in the feed-forward layers.
  - **Rotary position embeddings** ([RoPE](/milestones/rope2021/)) in place of absolute position embeddings.
- **Faster training.** An efficient attention implementation that does not store the attention weights, and careful saving of intermediate results. The 65-billion-parameter model processed about 380 tokens per second per GPU on 2,048 GPUs, so 1.4 trillion tokens took about 21 days.
- **The tokenizer** splits all numbers into single digits and falls back to bytes for unknown characters.

**The notation.** There are no new equations. Table 2 of the paper lists the sizes: for example, the 65-billion-parameter model has 80 layers, 64 attention heads and a hidden size of 8,192.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv paper. It is a preprint. Most results are zero-shot or few-shot, with no fine-tuning.

- **Small beats large.** LLaMA-13B beat GPT-3 (175 billion parameters, over 10 times larger) on most benchmarks.
- **Matching the best.** LLaMA-65B was competitive with Chinchilla-70B and PaLM-540B. On common-sense reasoning, it beat Chinchilla on every benchmark except BoolQ, and PaLM-540B on all except BoolQ and WinoGrande.
- **Closed-book questions.** On Natural Questions and TriviaQA, LLaMA-65B set new best results in the zero-shot and few-shot settings. On TriviaQA, it scored 68.2% with no examples, against 55.4% for Chinchilla.
- **Maths.** On GSM8K, the authors say LLaMA-65B beat Minerva-62B, a model fine-tuned on maths data. Their table shows this only with majority voting over many samples: 69.7% against 68.5%. With one answer per problem, LLaMA-65B scored 50.9% and Minerva-62B 52.4%.
- **Weaker on MMLU.** LLaMA-65B scored 63.4%, a few points behind Chinchilla (67.5%) and PaLM-540B (69.3%). The authors suggest this is because it saw only 177 GB of books and papers, against up to 2 TB for those models.
- **A little instruction tuning helps.** A short fine-tuning on instructions, giving LLaMA-I, raised the MMLU score to 68.9%.
- **Cost.** Developing the models used about 2,048 GPUs for about 5 months. The authors estimate about 2,638 MWh of energy and 1,015 tonnes of CO2-equivalent.

## Limits, and what came later

The limits come from the paper:

- **Bias.** On CrowS-Pairs, it was slightly less biased than GPT-3 and OPT on average, but especially biased on religion, followed by age and gender. On WinoGender, it made more errors when a pronoun did not match the usual gender of an occupation.
- **Toxicity grew with size.** On RealToxicityPrompts, the largest model produced the most toxic text, especially when asked to be respectful.
- **Truthfulness is still low.** It beat GPT-3 on TruthfulQA, but most answers were still not truthful, so it is likely to make up incorrect answers.
- **Less knowledge from books.** The smaller amount of book and academic text may explain the weaker MMLU score.
- **Unexplained benchmarks.** Results on SIQA varied a lot during training, which may mean the benchmark is not reliable.
- **Carbon.** Training used a large amount of energy.

LLaMA became the base for many later models. [Alpaca](/milestones/alpaca2023/) fine-tuned LLaMA-7B on instructions. [QLoRA](/milestones/qlora2023/) demonstrated cheap fine-tuning on LLaMA models. [llama.cpp](/milestones/llamacpp2023/) ported LLaMA to run on ordinary computers. [LLaVA](/milestones/llava2023/) used a LLaMA-family model to read images. [Position interpolation](/milestones/position_interpolation2023/) extended its context to 32,000 tokens. [Llama 2](/milestones/llama2_2023/) continued the series.

## What to know first

- The [Transformer](/milestones/transformer2017/) decoder and [GPT-3](/milestones/gpt3_2020/).
- [Chinchilla](/milestones/chinchilla2022/) and the balance between model size and training data.
- [RoPE](/milestones/rope2021/), the position method it uses.

## How to read it

The paper is 27 pages, with 11 pages of main text. It is short and easy to read.

1. Read section 1 for the argument about the cost of running a model.
2. Read section 2: the data (Table 1), the architecture changes and the training.
3. Look at Tables 3, 4 and 9 for the main comparisons.
4. Read section 5 on bias, toxicity and truthfulness.

Expect about 1 hour for the steps above (an estimate).

## Links

- The paper: [arXiv 2302.13971](https://arxiv.org/abs/2302.13971)
- Code: [facebookresearch/llama](https://github.com/facebookresearch/llama), named in the paper. GitHub now describes it as "Inference code for Llama models".
- Video: none is linked here yet.
