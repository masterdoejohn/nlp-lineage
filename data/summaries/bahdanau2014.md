---
milestone: bahdanau2014
source: https://arxiv.org/abs/1409.0473v7
version: arXiv version 7 (May 2016), the ICLR 2015 conference paper
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It let a translation model look back at every word of the input while it writes each output word, instead of squeezing the whole sentence into one fixed vector. This mechanism is called attention.

## The problem before it

Neural machine translation was new in 2014. The usual design was an encoder-decoder. An encoder network reads the source sentence and turns it into one vector, a fixed-length list of numbers. A decoder network then writes the translation from that one vector.

The authors argued that this single vector is a bottleneck. A long sentence holds more information than a short one, but the vector has the same size. Earlier work by Cho and others had already measured the effect: translation quality fell quickly as sentences got longer.

## The idea

**The mechanism.** The encoder no longer makes one vector. It makes one vector for each source word, which the paper calls an annotation. Each annotation comes from a bidirectional recurrent network. This network reads the sentence forwards and backwards, so each annotation describes a word and the words around it.

When the decoder writes the next word, it:

1. Gives every source annotation a score. The score says how well that source position matches what the decoder needs now. A small neural network computes the score, from the decoder's current state and the annotation.
2. Turns the scores into weights that are positive and add up to 1. This uses the softmax function.
3. Takes the weighted average of the annotations. This average is the context vector for this output word.
4. Predicts the next word from its own state, the previous word and this context vector.

The decoder makes a new context vector for every output word. So the model "searches" the source sentence again at each step. All parts learn together from translation examples. No separate alignment step is needed.

The authors call the weights a soft alignment. "Soft" means that an output word can draw on several source words at once, in different amounts.

**The notation.** For output position `i` and source position `j`, the score is `e_ij = a(s_(i-1), h_j)`. Here `s_(i-1)` is the decoder state and `h_j` is the annotation. The weights are `α_ij = exp(e_ij) / Σ_k exp(e_ik)`, and the context vector is `c_i = Σ_j α_ij h_j`. In the paper, `a` is `v_a^T tanh(W_a s_(i-1) + U_a h_j)`.

## What it showed

**Reported in the paper.** It was published as a peer-reviewed conference paper at ICLR 2015. The task is English-to-French translation (WMT '14). BLEU is a standard score for translation; higher is better.

- **Against the plain encoder-decoder.** Trained on sentences of up to 50 words, the attention model (RNNsearch-50) scored 26.75 BLEU on the full test set. The same design without attention (RNNencdec-50) scored 17.82.
- **Long sentences.** Without attention, quality fell sharply as sentences got longer. The attention model trained on sentences of up to 50 words showed no fall, even for sentences of 50 words or more.
- **Against phrase-based translation.** On test sentences with no unknown words, a longer-trained attention model scored 36.15 BLEU. Moses, a conventional phrase-based system, scored 35.63. On the full test set, Moses was still better: 33.30 against 28.45.
- **What it looks at.** Plots of the weights show sensible alignments. For example, the model reorders "European Economic Area" into French word order.

## Limits, and what came later

The authors name these limits:

- The model must score every source word for every output word. This was acceptable for sentences of 15 to 40 words, but it may limit other tasks.
- Rare words were a problem. The model used only the 30,000 most frequent words in each language, and mapped every other word to one "unknown" token.
- The main comparison with phrase-based translation holds only for sentences without unknown words.

Later work built directly on this mechanism. [Luong attention](/milestones/luong2015/) proposed other ways to compute the scores. [GNMT](/milestones/gnmt2016/) used attention in a production translation system. The [Transformer](/milestones/transformer2017/) generalised attention and used it in place of recurrence.

## What to know first

- The encoder-decoder idea: see [Seq2seq](/milestones/seq2seq2014/).
- What a recurrent network and its hidden state are: see [Recurrent networks](/milestones/elman1990/).
- The softmax function, which turns any list of scores into weights that add up to 1.
- A weighted average.

## How to read it

The paper is 15 pages including the appendices, and the main text is clear.

1. Read section 1 for the problem.
2. Read section 3.1 with Figure 1 and equations 4 to 6. This is the core idea, and it is about one page.
3. Look at Figure 2 (quality against sentence length) and Table 1 (BLEU scores).
4. Look at Figure 3, the alignment plots.

Appendix A gives the exact architecture. Read it when you want to build the model. Expect about 1 hour for the steps above (an estimate).

## Links

- The paper: [arXiv 1409.0473](https://arxiv.org/abs/1409.0473)
- Code: [GroundHog](https://github.com/lisa-groundhog/GroundHog), the implementation the paper names. It is written for the Theano library.
- Video: none is linked here yet.
