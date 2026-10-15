---
milestone: word2vec2013
source: https://arxiv.org/abs/1301.3781v3
version: arXiv version 3 (September 2013)
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that two very simple models, with no hidden layer, learn word vectors as good as or better than those of full neural language models, at a small part of the cost, so good vectors could be trained on billions of words.

## The problem before it

[Word embeddings](/glossary/word-embedding/) were already known to help. The [neural language model](/milestones/bengio2003_nplm/) learned them, and [NLP from scratch](/milestones/collobert2011/) used them for many tasks. But the vectors were learned inside a full neural language model, which is slow to train.

The authors write that, as far as they know, no earlier architecture had been trained on more than a few hundred million words, and the vectors had only 50 to 100 values. In a feedforward neural language model, most of the work is in the hidden layer, which is dense and large.

## The idea

**The mechanism.** Remove the hidden layer. Keep only the word vectors and a simple classifier on top of them. The model can represent less than a full neural network, but it is so cheap that it can learn from much more text. The paper proposes two such models:

- **Continuous bag of words (CBOW)** predicts a word from the words around it. It averages the vectors of 4 words before and 4 words after, so their order does not count.
- **[Skip-gram](/glossary/skip-gram/)** does the reverse: from one word, it predicts the words around it, up to 10 words away in the experiments. Words further away are used less often in training, because they are usually less related.

To avoid scoring every word in the vocabulary, both models use a hierarchical softmax: the vocabulary is a binary tree, so each prediction needs only about log2(V) small decisions. The tree is a Huffman tree, which gives frequent words short paths.

The paper also introduces a test set for word vectors. Each question uses word arithmetic. For "What word is to *small* as *biggest* is to *big*?", compute `vector("biggest") - vector("big") + vector("small")` and find the closest word vector. The answer counts as right only if that word is exactly *smallest*.

**The notation.** Training cost is `O = E × T × Q`: the number of passes over the data, times the number of training words, times the cost per word. For CBOW, `Q = N × D + D × log2(V)`. For skip-gram, `Q = C × (D + D × log2(V))`. Here `N` is the number of context words, `D` the vector size, `V` the vocabulary size and `C` the maximum distance of the predicted words. For comparison, the feedforward neural language model has `Q = N × D + N × D × H + H × V`, where `H` is the size of the hidden layer.

## What it showed

**Reported in the paper.** We read version 3 of the arXiv paper. It does not say whether it was peer reviewed. The test set has 8,869 semantic questions (for example, capital cities and currencies) and 10,675 syntactic questions (for example, plurals and past tenses). Accuracy means the share of questions answered with exactly the right word.

- **Same data, same vector size** (320 million words, 640 values per vector). Semantic accuracy was 9% for the recurrent language model, 23% for the feedforward language model, 24% for CBOW and 55% for skip-gram. Syntactic accuracy was 36%, 53%, 64% and 59%.
- **Against published word vectors.** Skip-gram with 300 values, trained on 783 million words, scored 53.3% in total. The best earlier published vectors in the table scored 24.6%.
- **Large scale** (Google News, about 6 billion words, 1 million-word vocabulary). With 1,000 values, skip-gram scored 65.6% in total and CBOW 63.7%. A feedforward language model with 100 values scored 50.8%, after 14 days on about 180 CPU cores. CBOW took 2 days on about 140 cores. The paper notes that these core counts are estimates, because the machines were shared.
- **Speed on one machine.** CBOW trained on a subset of Google News in about a day, and skip-gram in about 3 days. The abstract says high-quality vectors take less than a day to learn from a 1.6 billion-word data set.
- **More data and bigger vectors together.** Adding only data, or only vector size, soon gives smaller gains. Both must grow together.
- **Sentence completion** (Microsoft Sentence Completion Challenge). Skip-gram alone scored 48.0%, below some earlier methods. Combined with recurrent language models, it scored 58.9%, a new best result. The earlier best was 55.4%.

## Limits, and what came later

The limits come from the paper:

- The models ignore the inner structure of words, so the authors say that 100% accuracy on their test is likely impossible.
- Synonyms count as mistakes in the test, and the test has single words only, so names such as "New York" are left out.
- The authors estimate that the example relationships in their Table 8 would score only about 60% by their exact-match rule.
- CBOW does not use word order at all.

The next steps built on it. [GloVe](/milestones/glove2014/) compared itself with skip-gram and criticised it. [ELMo](/milestones/elmo2018/) contrasted these static vectors, where each word has one vector, with contextual ones, where a word's vector depends on its sentence. Section 7 names the group's follow-up paper for NIPS 2013, "Distributed Representations of Words and Phrases and their Compositionality".

## What to know first

- [Word embeddings](/glossary/word-embedding/), and the [neural language model](/milestones/bengio2003_nplm/) that learns them.
- What a softmax does, and why scoring a large vocabulary is slow.
- Cosine similarity, which measures how close two vectors are.
- That a vector difference, such as "king" minus "man", can stand for a relationship.

## How to read it

The paper is 12 pages, and short.

1. Read section 1 for the goals.
2. Read section 2.1 on the cost of the feedforward language model, then section 3 with Figure 1. This is the idea.
3. Read section 4.1 for the test set, then Tables 3, 4 and 6.
4. Look at Table 8 for examples of word arithmetic.

Expect about 45 minutes for the parts above (an estimate).

## Links

- The paper: [arXiv 1301.3781](https://arxiv.org/abs/1301.3781)
- Code: [code.google.com/archive/p/word2vec](https://code.google.com/archive/p/word2vec/), the original C++ release named in section 7. The address in the paper now leads to this archive page.
- Video: none is linked here yet.
