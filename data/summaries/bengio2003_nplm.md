---
milestone: bengio2003_nplm
source: https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf
version: Journal of Machine Learning Research 3 (2003), pages 1137 to 1155
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that a neural network can learn a vector for each word together with the probability of the next word, and that this beats the best counting models on real text.

## The problem before it

A language model gives the probability of the next word from the words before it. In 2003 the best models were n-grams: tables that count how often each short run of words appears in the training text. They usually looked at only the last 2 words.

The authors name two weak points of n-grams. First, they ignore context more than 1 or 2 words back. Second, they do not know that words can be similar. Seeing "The cat is walking in the bedroom" does not help an n-gram with "A dog was running in a room", because the words are different.

The authors call the root cause the curse of dimensionality. With a vocabulary of 100,000 words, there are about 10^50 possible runs of 10 words, so almost every sentence in new text is one the model has never seen.

## The idea

**The mechanism.** Give each word in the vocabulary a learned vector of real numbers, a "feature vector" with 30 to 100 values. To predict the next word, look up the vectors of the previous words, join them, and pass them through a small neural network. The network gives a probability for every word in the vocabulary.

The word vectors and the network are trained together, by the same goal: give high probability to the real next word. Words that play similar roles end up with similar vectors. Because the network is a smooth function of the vectors, one training sentence then raises the probability of many similar sentences that were never seen.

The authors also show how to train such a model on large data, which was a real problem at the time. Almost all the work (about 99.7% in one of their models) is in the output layer, which scores every word in the vocabulary. So they split the output words across many processors, each scoring its own block of words.

**The notation.** A matrix `C` holds one row per word: `C(i)` is the vector of word `i`. The input is `x = (C(w_(t-1)), ..., C(w_(t-n+1)))`, the vectors of the previous `n-1` words. The network computes scores `y = b + Wx + U tanh(d + Hx)`, and a softmax turns them into probabilities: `P(w_t = i | context) = e^(y_i) / Σ_j e^(y_j)`. `W` holds optional direct links from the word vectors to the output, and can be zero.

## What it showed

**Reported in the paper.** It was published in a peer-reviewed journal. The measure is perplexity on held-out test text, roughly how many words the model is choosing between at each step. Lower is better.

- **Brown corpus** (about 1.2 million words, 16,383-word vocabulary). The best neural model, chosen on the validation set, reached a test perplexity of 252. The best n-gram, a class-based model with 500 word classes, reached 312. The paper reports this as a difference of about 24%. A standard smoothed trigram reached 336, which the paper reports as 33% above the neural model.
- **AP News** (about 14 million training words, 17,964-word vocabulary). The neural model reached 109. The best n-gram, a Kneser-Ney model with 5 words of context, reached 117. The paper reports this as about 8%.
- **The paper gives two summaries of these gains.** The abstract and the results section say about 24% on Brown and about 8% on AP News. The conclusion says "differences between 10 and 20% in perplexity". Both are quoted here.
- **Longer context.** On Brown, going from 2 to 4 words of context helped the neural model but did not help the n-grams.
- **Mixing helps.** Averaging the neural model's probabilities with those of a trigram always lowered perplexity. The authors read this as a sign that the two kinds of model make errors in different places.
- **Cost.** The AP News model ran for only 5 passes over the data, which took about 3 weeks on 40 processors. On a cluster of 64 processors, communication took only 1/15 of the total time.

## Limits, and what came later

The limits come from the paper:

- The model is much slower than an n-gram, mainly because it must score every word in the vocabulary for each prediction. The authors call faster training an important priority.
- It looks at a fixed window of a few words. The authors suggest recurrent networks to use longer context.
- Each word has a single vector, so words with several meanings are probably not served well.
- The paper measures only perplexity. The authors say that tests in real applications, such as speech recognition, would also be useful.

Later work built on it directly. The [RNN language model](/milestones/mikolov2010_rnnlm/) cites it as a precursor and replaces the fixed window with a recurrent network. [NLP from scratch](/milestones/collobert2011/) extended learned word representations to many NLP tasks. [word2vec](/milestones/word2vec2013/) builds on its idea of learned word vectors and makes them much cheaper to train.

## What to know first

- What a [language model](/glossary/language-model/) does, and what perplexity measures.
- How n-gram models count runs of words, and why they need smoothing for unseen runs. [Class-based n-grams](/milestones/brown1992_class/) are the closest earlier idea: they group similar words into classes.
- A simple neural network with one hidden layer, a softmax output, and training by gradient descent.
- The idea of a [word embedding](/glossary/word-embedding/), which this paper introduced as a learned "feature vector".

## How to read it

The paper is 19 pages, including 3 pages of references.

1. Read section 1 and section 1.1. The "cat" and "dog" example is the core idea.
2. Read section 2 with Figure 1, the model.
3. Read section 4.2 and Table 1 for the main results.
4. Read section 5.2 and section 6 for the authors' own limits and plans.

Skim section 3 (parallel training) unless the engineering interests you. Expect about 1 to 1.5 hours for the parts above (an estimate).

## Links

- The paper: [jmlr.org](https://www.jmlr.org/papers/v3/bengio03a.html), free to read.
- Code: the paper does not link code.
- Video: none is linked here yet.
