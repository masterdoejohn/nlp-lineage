---
milestone: scaling_laws2020
source: https://arxiv.org/abs/2001.08361v1
version: arXiv version 1 (January 2020)
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It measured how a language model's loss falls as the model, the data and the compute grow, and found smooth power laws that hold over many orders of magnitude. With these laws, the result of a large training run could be estimated before the run, and a fixed compute budget could be split between model size and data on purpose.

## The problem before it

By 2019, larger language models were known to be better ([GPT-2](/milestones/gpt2_2019/)). But nobody could say how much better a model 10 times larger would be, or whether the extra compute should go to a larger model, more data or longer training.

Earlier studies had found power laws for model size and data size. They did not agree on how fast the data must grow with the model: one earlier study found that it must grow faster than the model.

## The idea

**The mechanism.** Train many decoder-only [Transformer](/milestones/transformer2017/) language models of different sizes and shapes on the same data, and record the test loss. Then fit simple equations to the results. The authors varied:

- Model size, from 768 to 1.5 billion parameters (not counting the embeddings).
- Dataset size, from 22 million to 23 billion tokens.
- Model shape: depth, width, number of attention heads and feed-forward size.
- Context length, batch size and training time.

All models were trained on WebText2, an extended version of the GPT-2 dataset: 96 GB of text, about 23 billion tokens.

Two choices made the trends clean:

- **Count parameters without the embeddings.** With the embedding parameters included, models of different depths fall on different curves. Without them, they fall on one curve.
- **Correct for batch size.** The authors used an earlier result on the "critical batch size" to estimate the compute and the number of steps each run would need at the best batch size.

**The notation.** `L` is the test loss (cross-entropy, in nats per token). `N` is the number of non-embedding parameters, `D` the dataset size in tokens, and `C ≈ 6NBS` the training compute, where `B` is the batch size and `S` the number of steps. When only one factor limits the model:

- `L(N) = (N_c / N)^0.076`
- `L(D) = (D_c / D)^0.095`
- `L(C_min) = (C_c / C_min)^0.050`

The constants `N_c`, `D_c` and `C_c` depend on the tokenizer, so the authors say they have no deeper meaning. A combined equation, `L(N, D) = [(N_c / N)^(α_N / α_D) + D_c / D]^α_D`, predicts how much a model overfits when the data is limited.

## What it showed

**Reported in the paper.** It is an arXiv preprint from OpenAI and Johns Hopkins University. All results are on the loss of models trained on WebText2.

- **Scale matters, shape barely does.** At a fixed number of parameters, the loss changed by only a few percent over a wide range of shapes. A model with 6 layers came within 3% of the loss of a 48-layer model of the same size.
- **Smooth power laws.** The loss followed a power law in model size, data and compute, with no sign of bending at the largest sizes tested. The paper gives the range in three ways: "more than seven orders of magnitude" (abstract), "more than six orders of magnitude" (summary), and eight for compute, six for model size and more than two for data (section 1.2).
- **Overfitting is predictable.** It depends on the ratio of `N^0.74` to `D`. Each time the model grows 8 times, the data must grow about 5 times to avoid a penalty.
- **Larger models learn faster.** They reach the same loss with fewer steps and fewer tokens.
- **Spend extra compute mainly on model size.** For the best result at a fixed budget, model size should grow about as `C^0.73`. For each 10 times more compute, the model should be about 5 times larger and the data only about 2 times larger.
- **Stop before convergence.** The best use of compute trains a very large model and stops early. The authors estimate that this needs about 65% less compute than training a smaller model nearly to convergence, for the same loss.
- **Transfer follows.** The loss on other text, such as books and Wikipedia, improved in step with the loss on WebText2, with a roughly constant gap.
- **Transformers beat LSTMs** of the same size, mainly on tokens late in the context.

## Limits, and what came later

The limits come from the paper:

- There is no theory behind the laws. The authors call the scaling with model size and compute "especially mysterious".
- The measured trends cannot hold forever. The authors show that, far beyond the tested sizes, the compute law and the data law contradict each other. They place this point at about a trillion parameters and a trillion tokens, but say the estimate is uncertain by a factor of 10 in either direction.
- The paper measures loss only. Whether lower loss gives better results on real tasks is left open.
- The small-data range was not studied closely, and regularisation such as dropout was not tuned as the sizes changed.
- The compute estimate leaves out the cost of attention over the context, so it can be wrong for very long contexts.

[GPT-3](/milestones/gpt3_2020/) cited these laws to motivate a 175-billion-parameter model. [Chinchilla](/milestones/chinchilla2022/) revisited the compute-optimal split between model size and data. [Emergent abilities](/milestones/emergent_abilities2022/) contrasted the smooth loss curves with abilities that seem to appear suddenly. [GPT-4](/milestones/gpt4_2023/) predicted parts of its performance from smaller runs in this way.

## What to know first

- The [Transformer](/milestones/transformer2017/) decoder and [GPT-2](/milestones/gpt2_2019/).
- What the test loss of a language model measures: how well it predicts the next token. Lower is better.
- What a power law is: `y = a × x^k`. On a plot with logarithmic axes, it is a straight line.

## How to read it

The paper is 30 pages, with 19 pages of main text.

1. Read section 1.1, the one-page summary of the findings.
2. Look at Figures 1 to 3. They show the three main trends and how to split extra compute.
3. Read section 1.2 for the equations, then section 2 for the notation and the data.
4. Read section 3.1 with Figure 5 on model shape, and section 6 on how to split a compute budget.
5. Read section 6.3 and appendix C for the authors' own limits.

Expect about 2 hours for the steps above (an estimate). The appendix derivations are optional.

## Links

- The paper: [arXiv 2001.08361](https://arxiv.org/abs/2001.08361)
- Code: the paper does not link code.
- Video: none is linked here yet.
