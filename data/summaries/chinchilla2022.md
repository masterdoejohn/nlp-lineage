---
milestone: chinchilla2022
source: https://arxiv.org/abs/2203.15556v1
version: arXiv version 1 (March 2022); the paper was later published at NeurIPS 2022
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that the large language models of 2021 were too big for the amount of data they were trained on. For the best result from a fixed compute budget, model size and training data should grow at the same rate. Chinchilla, a 70-billion-parameter model trained on 1.4 trillion tokens, beat models up to 7.5 times its size, and later models were trained on far more data.

## The problem before it

[Scaling laws](/milestones/scaling_laws2020/) had shown how loss falls as models grow. It advised spending most extra compute on a larger model and only a little on more data: for 10 times the compute, a model 5.5 times larger, trained on 1.8 times more tokens.

So the field built ever larger models, but kept the training data at about 300 billion tokens. [GPT-3](/milestones/gpt3_2020/) (175 billion parameters), Jurassic-1 (178 billion) and [Gopher](/milestones/gopher2021/) (280 billion) were all trained on about 300 billion tokens.

The authors find a flaw in the earlier study's method. It used the same training length and learning-rate schedule for every model, and read off losses partway through training. They argue this made training on less data look better than it is, and so favoured larger models.

## The idea

**The mechanism.** Ask: for a fixed amount of compute, how should it be split between model size and training data? To answer, the authors trained over 400 language models, from 70 million to over 16 billion parameters. They estimated the answer in three separate ways:

1. **Many training lengths.** Train each model size for 4 different lengths, with the learning-rate schedule matched to each length. For each amount of compute, find which run reached the lowest loss.
2. **Fixed-compute curves.** Fix 9 compute budgets. For each, train models of many sizes, with fewer tokens for larger models, and find the size with the lowest final loss.
3. **A fitted formula.** Fit one equation for the loss in terms of model size and data, and find its best point for each budget.

All three gave nearly the same answer: model size and training tokens should grow by the same factor. When the model doubles, the data should double too.

**The test.** For the compute that trained Gopher, the analysis predicted an ideal model of about 40 to 70 billion parameters. The authors trained Chinchilla at the top of that range: 70 billion parameters on 1.4 trillion tokens. It used the same compute and data source (MassiveText) as Gopher, with a few changes, such as the AdamW optimiser.

**The notation.** The fitted loss is `L(N, D) = E + A / N^α + B / D^β`. Here `N` is the number of parameters, `D` the number of training tokens, and `E` the loss of a perfect model of the text. The fit gave `E = 1.69`, `A = 406.4`, `B = 410.7`, `α = 0.34` and `β = 0.28`. The best model size grows as `C^a` and the best data as `C^b`, where `C` is the compute. The three methods gave `a` from 0.46 to 0.50 and `b` from 0.50 to 0.54. The earlier scaling laws gave 0.73 and 0.27.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv paper.

- **Chinchilla beat larger models.** With the same compute as Gopher (280 billion parameters), it did better on almost every test. The abstract says it also beat GPT-3, Jurassic-1 and Megatron-Turing NLG (530 billion) on a large range of tasks.
- **MMLU** (exam questions in 57 subjects). 67.6% accuracy, against 60.0% for Gopher and 43.9% for GPT-3. The abstract gives 67.5%. It was better than Gopher on 51 of the 57 subjects, and worse on 4.
- **BIG-bench.** An average of 65.1%, against 54.4% for Gopher. It was worse than Gopher on only 4 of 62 tasks.
- **Reading and questions.** It beat Gopher on LAMBADA (77.4% against 74.5%), and by more than 10 points on two reading tests (RACE). It set a new best for closed-book answering on Natural Questions: 31.5% with 5 examples and 35.5% with 64.
- **Smaller is cheaper to use.** Being 4 times smaller than Gopher, it costs less to fine-tune and to run.
- **Current models are oversized.** By the paper's estimate, a 175-billion-parameter model would need about 3.7 trillion tokens to be compute-optimal (Table 3). The text gives over 4.2 trillion. A 1-trillion-parameter model is unlikely to be the best choice below about 10^26 operations, over 250 times Gopher's compute.
- **Data becomes the limit.** The amount of high-quality data needed is far beyond what was used then.

## Limits, and what came later

The limits come from the paper:

- **Only two large-scale tests.** Chinchilla and Gopher are the only comparable runs at large scale. There are none in between.
- **Power-law assumption.** The authors see some curvature at high compute, which suggests the best models may be even smaller than predicted.
- **Less than one pass over the data.** The runs used for the analysis all saw less than one pass over their data. Training for several passes is left for future work. (Chinchilla itself repeated some smaller parts of its data, such as Wikipedia.)
- **Test data in training.** With 4 times more training data than Gopher, some test text may have leaked into training, so the authors put less weight on the language-modelling scores.
- **Bias and toxicity remain.** It still shows gender bias on Winogender. Its toxicity was about the same as Gopher's in their tests (mean score 0.087 against 0.081), though the conclusion describes it as "less affected".
- **Data quality.** Larger datasets bring more toxic text, bias and private information, and need more care.

The result changed how models were trained. [LLaMA](/milestones/llama2023/) cites Chinchilla's scaling laws for its training. [DeepSeek LLM](/milestones/deepseek_llm2024/) re-derived the scaling coefficients for its own data. [Llama 3](/milestones/llama3_2024/) deliberately trained far past the compute-optimal amount, because a smaller model trained longer is cheaper to run.

## What to know first

- [Scaling laws](/milestones/scaling_laws2020/), the earlier study this paper revises.
- What training compute is, and that it grows with both model size and the number of training tokens (roughly `6 × N × D` operations).
- [GPT-3](/milestones/gpt3_2020/) and [Gopher](/milestones/gopher2021/), the models it compares against.

## How to read it

The paper is 36 pages, with 16 pages of main text.

1. Read section 1 with Figure 1 and Table 1. They show the problem in one picture.
2. Read section 3, the three methods, with Figures 2 to 4 and Table 2.
3. Read Table 3, which lists the compute and data needed for each model size.
4. Read section 4.2 for Chinchilla's results, mainly Table 6 (MMLU).
5. Read section 5 for the authors' limits.

Appendix D.2 explains the fitted formula. Expect about 2 hours for the steps above (an estimate).

## Links

- The paper: [arXiv 2203.15556](https://arxiv.org/abs/2203.15556)
- Code: the paper does not link code. Its appendix includes a model card for Chinchilla.
- Video: none is linked here yet.
