---
milestone: transformer2017
source: https://arxiv.org/abs/1706.03762v7
version: arXiv version 7 (August 2023) of the NIPS 2017 conference paper
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that a translation model can work with attention alone, with no recurrence and no convolution. This design, the Transformer, became the basis of almost every large language model that followed.

## The problem before it

The best translation models in 2017 were encoder-decoders built from recurrent networks, usually LSTMs, joined by attention. A recurrent network reads one position at a time. Each step must wait for the step before it. So the work inside one sentence cannot run in parallel, and training on long sequences is slow.

Convolutional models had removed this wait, but they had another cost. To connect two distant words, the signal must pass through many layers. The number of layers grows with the distance between the words, and distant relations are harder to learn.

## The idea

**The mechanism.** The Transformer keeps the encoder-decoder shape, but builds both parts from attention.

- **Self-attention.** Every position looks at every other position of the same sequence in one step. For each position, the model makes three vectors from its current representation: a query (what it is looking for), a key (what it offers) and a value (what it passes on). A position compares its query with every key. The scores become weights, and the position takes the weighted sum of the values. So any two words are connected in one step, whatever the distance.
- **Scaling.** The scores are divided by the square root of the key size. Without this, large scores push the softmax into a region where learning almost stops.
- **Multi-head attention.** The model runs 8 attention operations, called heads, side by side. Each head works on a smaller projection of the vectors, so it can attend to a different kind of relation. Their outputs are joined.
- **Position.** Attention has no sense of word order. So the model adds a positional encoding to each input: a fixed pattern of sine and cosine waves of different frequencies.
- **The block.** Each layer has an attention part and a small feed-forward network applied to each position. Each part has a residual connection (its input is added to its output) and layer normalisation. The encoder has 6 such layers, and the decoder has 6.
- **The decoder.** The decoder uses self-attention with a mask, so a position cannot see later positions. It also attends to the encoder's output, as in earlier [attention](/milestones/bahdanau2014/).

**The notation.** `Attention(Q, K, V) = softmax(Q K^T / √d_k) V`. Here `Q`, `K` and `V` are the matrices of queries, keys and values, and `d_k` is the key size. For multi-head attention, `head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V)`, and the heads are joined and multiplied by `W^O`. The base model uses `d_model = 512`, `h = 8` heads and `d_k = 64`.

## What it showed

**Reported in the paper.** It was published as a peer-reviewed conference paper at NIPS 2017. BLEU is a standard score for translation; higher is better.

- **English to German (WMT 2014).** The large model scored 28.4 BLEU. This was more than 2.0 BLEU above the best earlier results, including ensembles. Even the base model beat all earlier models and ensembles, at a fraction of their training cost.
- **English to French (WMT 2014).** The paper gives two numbers for the large model. Its abstract and Table 2 give 41.8 BLEU. Its results text (section 6.1) gives 41.0. Either way it was a new best single model.
- **Training time.** The base model trained in 12 hours on 8 GPUs. The large model trained in 3.5 days on 8 GPUs.
- **Design choices.** With one attention head, quality was 0.9 BLEU below the best setting, and too many heads also hurt. Learned position vectors in place of the sine and cosine pattern gave nearly the same results.
- **A different task.** On English constituency parsing (finding the grammatical structure of a sentence), a 4-layer Transformer scored 91.3 F1 when trained only on the small standard dataset, and 92.7 with extra data. The authors say this beat all earlier models except one, the Recurrent Neural Network Grammar, without task-specific tuning.

## Limits, and what came later

The limits come from the paper:

- Self-attention compares every position with every other one. Its cost per layer grows with the square of the sequence length. The authors name restricted, local attention for very long inputs, such as images, audio and video, as future work.
- Generation is still sequential: the decoder writes one token at a time. The authors name "less sequential" generation as a goal.
- The experiments are translation and parsing only.

The Transformer is the direct parent of a large family. [GPT-1](/milestones/gpt1_2018/) and [GPT-2](/milestones/gpt2_2019/) use its decoder. [BERT](/milestones/bert2018/) uses its encoder. [T5](/milestones/t5_2019/) keeps the full encoder-decoder. The [Sparse Transformer](/milestones/sparse_transformer2019/), [Longformer](/milestones/longformer2020/) and [FlashAttention](/milestones/flashattention2022/) reduce or speed up the cost of attention. [RoPE](/milestones/rope2021/) and [ALiBi](/milestones/alibi2021/) replace its positional encoding. The [Vision Transformer](/milestones/vit2020/) applies it to images.

## What to know first

- [Attention](/milestones/bahdanau2014/), the mechanism it builds on.
- The encoder-decoder idea from [Seq2seq](/milestones/seq2seq2014/).
- [Residual connections](/milestones/resnet2015/) and [layer normalisation](/milestones/layernorm2016/).
- Matrix multiplication and the softmax function.

## How to read it

The paper is 15 pages including the attention pictures at the end, and section 3 is dense.

1. Read sections 1 and 2 for the problem.
2. Read section 3 with Figures 1 and 2. This is the whole architecture. Read 3.2 (attention) twice.
3. Read section 4 with Table 1. It explains why self-attention connects distant words in one step.
4. Look at Tables 2 and 3 for the results and the design choices.
5. Look at the attention pictures in Figures 3 to 5.

Expect about 1.5 hours for the steps above (an estimate).

## Links

- The paper: [arXiv 1706.03762](https://arxiv.org/abs/1706.03762)
- Code: [tensor2tensor](https://github.com/tensorflow/tensor2tensor), the code the paper names. The repository is archived on GitHub.
- Video: none is linked here yet.
