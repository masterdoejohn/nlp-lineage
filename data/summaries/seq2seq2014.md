---
milestone: seq2seq2014
source: https://arxiv.org/abs/1409.3215v3
version: arXiv version 3 (December 2014), the NIPS 2014 conference paper
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that one general neural network can turn a whole input sequence into a whole output sequence, such as a sentence into its translation, and beat a phrase-based translation system on a large task.

## The problem before it

Deep neural networks worked very well when inputs and outputs had a fixed size, for example an image and its label. But many tasks map a sequence to a sequence of a different length. Translation is one example. Speech recognition and question answering are others.

Neural networks were already used in translation, but mostly as a part of a conventional system. For example, they gave scores to candidate translations that the conventional system produced.

## The idea

**The mechanism.** The model uses two LSTM networks. An LSTM is a recurrent network with a protected memory, so it can connect words that are far apart.

1. The encoder LSTM reads the source sentence one word at a time. Its final hidden state is one vector that stands for the whole sentence. In the paper this vector has 8,000 numbers.
2. The decoder LSTM starts from that vector. It writes the translation one word at a time. Each step predicts the next word from the vector and the words written so far.
3. The decoder stops when it writes a special end-of-sentence symbol. This lets the output have any length.

Three choices made it work:

- **Separate LSTMs** for the input and the output.
- **Deep LSTMs** with 4 layers. Each extra layer reduced perplexity by nearly 10%, as reported in the paper.
- **Reversed input.** The words of each source sentence are fed in reverse order. The target sentence is not reversed. This puts the first source words close to the first target words, so the training signal has a short path at the start. The authors found this trick gave a large improvement, and they do not fully explain why.

To find a good translation, a beam search keeps the few most likely partial translations at each step and extends them.

**The notation.** The model estimates `p(y_1, ..., y_T' | x_1, ..., x_T) = Π_t p(y_t | v, y_1, ..., y_(t-1))`. Here `v` is the encoder's final state, and each factor is a softmax over the vocabulary.

## What it showed

**Reported in the paper.** It was published as a peer-reviewed conference paper at NIPS 2014. The task is English-to-French translation (WMT '14). BLEU is a standard score for translation; higher is better.

- **Direct translation.** An ensemble of 5 reversed LSTMs with beam size 12 scored 34.81 BLEU. The phrase-based baseline system scored 33.30. The authors say this was the first time a purely neural system beat a phrase-based baseline on a large translation task by a clear margin. The LSTM did this with a fixed vocabulary of 80,000 output words, and it was penalised whenever a reference word was outside that vocabulary.
- **Reversing the input.** A single LSTM scored 26.17 BLEU without reversal and 30.59 with it (beam size 12).
- **Rescoring.** Used to rescore the baseline's 1,000 best candidates, the LSTM ensemble reached 36.5 BLEU. The best WMT '14 result was 37.0.
- **Long sentences.** Quality did not fall for sentences under 35 words, and fell only a little for the longest ones.
- **Sentence vectors.** Plots of the encoder's vectors group sentences by meaning. They are sensitive to word order, and change little between active and passive voice.

## Limits, and what came later

The limits come from the design and from the paper's own results:

- The whole sentence must pass through one fixed-size vector.
- The vocabulary is fixed. Every other word becomes an "unknown" token, and these tokens cost BLEU points.
- Training took about 10 days on a machine with 8 GPUs, as reported in the paper.

[Attention](/milestones/bahdanau2014/) removed the single-vector bottleneck: the decoder can look back at every source word. [GNMT](/milestones/gnmt2016/) used a deep sequence-to-sequence model with attention in production. [CoVe](/milestones/cove2017/) reused such a translation encoder to represent words. The [Transformer](/milestones/transformer2017/) kept the encoder-decoder shape but replaced the LSTMs.

## What to know first

- [LSTM](/milestones/lstm1997/), the recurrent unit both halves are made of.
- What a language model does: predict the next word from the words before it. See [RNN LM](/milestones/mikolov2010_rnnlm/).
- The softmax function, which turns scores into probabilities.

## How to read it

The paper is 9 pages and easy to follow.

1. Read section 1, the introduction. It states the whole result.
2. Read section 2 for the model and the three choices that made it work.
3. Read section 3.3, on reversing the source sentences.
4. Look at Tables 1 and 2 and Figure 3 for the results.

Expect about 45 minutes (an estimate).

## Links

- The paper: [arXiv 1409.3215](https://arxiv.org/abs/1409.3215)
- Code: the paper does not link code.
- Video: none is linked here yet.
