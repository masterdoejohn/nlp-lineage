---
milestone: shazeer2017_moe
source: https://arxiv.org/abs/1701.06538v1
version: arXiv version 1 (January 2017), marked as under review for ICLR 2017
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It made a network more than 1,000 times bigger without making each prediction cost much more, by sending each input to only a few of many small sub-networks, called experts. This idea, conditional computation, is how many large language models are built today.

## The problem before it

Bigger networks learn more from big datasets. But in a normal network, every weight is used for every input. So the cost of training grows with the size of the model and with the amount of data, roughly with the product of the two.

Conditional computation was an old idea: use only part of the network for each input. In theory it adds capacity without adding cost. In practice no one had made it work well. The authors list the reasons:

- GPUs are fast at arithmetic and slow at branching.
- Each part of the network sees only a small batch of inputs, which wastes the hardware.
- Moving data between machines can cost more than the computation.
- Experiments had used small datasets, too small to need very big models.

## The idea

**The mechanism.** The paper adds a new layer, the sparsely gated mixture-of-experts layer (MoE layer). It has two parts:

- **Many experts.** Each expert is a small feed-forward network with its own weights. The paper uses up to 131,072 of them.
- **A gating network.** For each input, it gives every expert a score. It keeps only the top `k` scores, for example 4, and sets all the others to zero. It turns the kept scores into weights that add up to 1.

The layer's output is the weighted sum of the outputs of the chosen experts. The other experts do no work for this input. That is where the saving comes from.

Two more parts make it train well:

- **Noise.** The gate adds a learned amount of random noise to the scores before it picks the top `k`.
- **Balancing losses.** Without help, the gate keeps choosing the same few experts, and they get better and are chosen even more. Two extra loss terms push the experts to be used equally. One evens out the total gate weight per expert. The other evens out the number of inputs per expert.

The engineering is half of the paper. Each expert is kept once and shared by all the data-parallel copies of the model, so each expert gets a large combined batch. The MoE layer is applied at every position in the text in one big batch.

**The notation.** The output is `y = Σ_i G(x)_i E_i(x)`, where `E_i` is expert `i`. The gate is `G(x) = Softmax(KeepTopK(H(x), k))`. The noisy score is `H(x)_i = (x · W_g)_i + StandardNormal() · Softplus((x · W_noise)_i)`. Where `G(x)_i` is zero, expert `i` is not computed.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv preprint, which was under review for ICLR 2017 at that time. Perplexity measures how well a language model predicts text; lower is better. BLEU is a standard score for translation; higher is better.

- **Language modelling (1 billion words).** With about the same computation per word, the model with 4,096 experts had 24% lower test perplexity than the computation-matched models. A MoE model with about 4.4 billion parameters, not counting the embedding and softmax layers, reached 28.0 test perplexity after 10 epochs. The best published model at that time reached 34.7 after 10 epochs and 30.6 after 100 epochs.
- **Language modelling (100 billion words).** On a Google News corpus, perplexity improved up to 65,536 experts (68 billion parameters). It was 39% lower than the computation-matched baseline. With 131,072 experts (137 billion parameters) it got worse, possibly because the layer was too sparse.
- **Translation.** On WMT '14, the MoE models reached 40.56 BLEU for English to French and 26.03 for English to German. GNMT, the strong baseline, scored 39.22 and 24.91.
- **Many languages in one model.** One MoE model trained on 12 language pairs beat a single multilingual GNMT model on 11 of the 12 pairs.
- **Specialised experts.** Experts became specialised. For example, one expert in the translation model was used for phrases like "plays a critical" and "play a leading".

## Limits, and what came later

The limits come from the paper's results:

- The gains depend on a very large dataset. On 1 billion words, adding experts beyond about 1 billion parameters gave smaller gains.
- Very sparse layers can hurt quality: the largest model got worse.
- Hardware efficiency can drop. On the 100-billion-word corpus, the largest model ran at only 0.30 TFLOPS per GPU, against 1.23 for the computation-matched baseline. The authors say this is likely because they did not raise the batch size with the number of GPUs.
- It needs extra parts to train well: the noise, the balancing losses, and a large distributed setup.
- In this paper the experts sit between LSTM layers, not in a Transformer.

Later work built directly on it. [GShard](/milestones/gshard2020/) scaled this kind of conditional computation further. The [Switch Transformer](/milestones/switch2021/) built on the sparsely gated layer. [Mixtral 8x7B](/milestones/mixtral2023/) cites the layer, and [DeepSeekMoE](/milestones/deepseekmoe2024/) continues the same line of work.

## What to know first

- A feed-forward layer and a softmax.
- [LSTM](/milestones/lstm1997/), the layers the experts sit between.
- The original [mixture of experts](/milestones/jacobs1991_moe/) idea from 1991, where the whole model is one mixture.
- The difference between data parallelism (copies of the model on different data) and model parallelism (parts of the model on different devices).

## How to read it

The paper is 19 pages including appendices.

1. Read section 1.1 for the problem and the list of practical challenges.
2. Read section 2 with Figure 1, and section 2.1 on the noisy top-k gate. This is the core idea.
3. Read section 4 on balancing the experts.
4. Look at Table 1 and Figure 2 (language modelling) and Table 2 (translation).
5. Read section 3 when you want the engineering details.

Expect about 1.5 hours for the steps above (an estimate).

## Links

- The paper: [arXiv 1701.06538](https://arxiv.org/abs/1701.06538)
- Code: the paper does not link code.
- Video: none is linked here yet.
