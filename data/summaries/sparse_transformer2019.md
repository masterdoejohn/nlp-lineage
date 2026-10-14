---
milestone: sparse_transformer2019
source: https://arxiv.org/abs/1904.10509v1
version: arXiv version 1 (April 2019)
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It cut the cost of Transformer attention on long sequences, from growing with the square of the length to growing with the length times its square root, by letting each position attend to a fixed, sparse set of others. This let one design model text, images and audio over tens of thousands of steps.

## The problem before it

In a [Transformer](/milestones/transformer2017/), every position attends to every other position. For a sequence of `n` tokens, that is about `n × n` comparisons in every layer, and the memory to store them. Doubling the length makes attention four times as costly. So Transformers were limited to short sequences: a few hundred or a few thousand tokens.

Many kinds of data are much longer. An image of 64 by 64 pixels with 3 colour values each is 12,288 values in a row. Five seconds of audio at 12 kHz is 60,000 samples.

## The idea

**The mechanism.** The authors first looked at what a full-attention network had learned on images. Most layers attended to only a few positions, in regular patterns. So they replaced full attention with a few cheaper attention steps, chosen so that every position can still reach every earlier position within two steps.

They test two patterns, each split between two attention heads. Here `l` is a stride close to the square root of `n`:

- **Strided pattern.** One head attends to the previous `l` positions. The other attends to every `l`-th position before it. This fits data with a regular structure, like image rows and columns.
- **Fixed pattern.** The sequence is cut into blocks of length `l`. One head attends within its block. The other attends to a few chosen summary positions at the end of each earlier block, which pass information forward. This works better for text, which has no regular period.

Each position now looks at about `√n` others instead of `n`, so the total cost is about `n√n`.

Other changes make very deep and long models practical:

- A different arrangement of the residual blocks and their starting weights, so networks with hundreds of layers train well.
- **Recomputation.** The attention weights are not stored during the forward pass. They are computed again when the gradients need them, which saves a lot of memory.
- **Custom GPU code** that computes only the needed blocks of the attention matrix.
- Mixed precision: most computation uses 16-bit numbers.

**The notation.** Attention for position `i` over its allowed set `S_i` is `softmax((W_q x_i) K_(S_i)^T / √d) V_(S_i)`. Full attention for generation uses `S_i = {j : j ≤ i}`. Factorised attention gives each head `m` a smaller set `A_i^(m)` of size about `√n`.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv preprint. Results are in bits per byte (or bits per dimension for images): the average number of bits needed to encode each value. Lower is better.

- **Text (Enwik8,** the first 100 million bytes of Wikipedia). With a context of 12,288 bytes, the model reached 0.99, against 1.03 for a Transformer-XL of similar size. It matched a Transformer-XL with more than twice as many parameters.
- **Images.** On CIFAR-10, 2.80 against an earlier best of 2.85. On ImageNet at 64 by 64 pixels, 3.44 against an earlier best of 3.52.
- **Faster and no worse.** On Enwik8, full attention scored 1.00 and took 1.31 seconds per training step. The fixed pattern scored 0.99 and took 0.55 seconds. The strided pattern did poorly on text: 1.13.
- **Very long sequences.** On raw classical music, a 152-million-parameter model modelled 65,536 samples at a time (about 5 seconds at 12 kHz). A model with only 3 million parameters fit sequences of more than 1 million samples, but its quality was much lower.
- **Depth.** The CIFAR-10 model used 128 layers, trained with the changes above.

## Limits, and what came later

The limits come from the paper:

- The patterns are fixed in advance. Some layers of a full-attention network learn patterns that depend on the data, and a fixed pattern cannot copy those.
- The right pattern depends on the data. The strided pattern failed on text.
- At extreme lengths, memory forces the model to be very small, and sample quality falls quickly.
- Training was costly: the ImageNet model took 7 days on 64 GPUs.

Later work built on sparse attention. [GPT-3](/milestones/gpt3_2020/) alternates full attention with locally banded sparse attention, as in this paper. [BigBird](/milestones/bigbird2020/) continues the sparse-attention line. [Mistral 7B](/milestones/mistral7b2023/) cites it in the line of sliding-window attention.

## What to know first

- Self-attention in the [Transformer](/milestones/transformer2017/), and why its cost grows with the square of the length.
- Autoregressive models: predicting each value from the values before it.
- What "bits per byte" measures (see above).

## How to read it

The paper is 10 pages and well organised.

1. Read sections 1 and 3 for the problem.
2. Look at Figure 2, the patterns a full-attention network learns on images. It motivates the whole idea.
3. Read section 4 with Figure 3. This is the core: the two sparse patterns.
4. Skim section 5 for the engineering changes.
5. Look at Tables 1 and 2 for the results.

Expect about 1 hour for the steps above (an estimate).

## Links

- The paper: [arXiv 1904.10509](https://arxiv.org/abs/1904.10509)
- Code: the paper does not link code.
- Video: none is linked here yet.
