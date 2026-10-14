---
milestone: dai_le2015
source: https://arxiv.org/abs/1511.01432v1
version: arXiv version 1 (November 2015)
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that you can first train a recurrent network on unlabelled text, and then fine-tune the same network on a small labelled task, and get better results. This two-step recipe, pretraining and then fine-tuning, later became the standard way to build language models.

## The problem before it

LSTM networks read word order, so they should be good at classifying documents. In practice they were hard to train on long documents. Small changes to the settings made training break down. So for document classification, people mostly used simpler methods, such as bag-of-words models that ignore word order.

Labelled data is expensive. Unlabelled text is cheap and plentiful. There was no simple, reliable way to use the unlabelled text to help an LSTM learn a labelled task.

## The idea

**The mechanism.** Train the network twice:

1. **Pretraining, without labels.** Train an LSTM on plain text. The paper tests two objectives:
   - A **recurrent language model** predicts the next word from the words before it.
   - A **sequence autoencoder** reads a whole document into one vector, and then must write the same document again from that vector. The reading part and the writing part share their weights.
2. **Fine-tuning, with labels.** Copy the pretrained weights, including the word vectors, into a new LSTM. Then train it on the labelled task, such as "positive or negative review". All the weights keep changing during this step.

The paper calls the results LM-LSTM (pretrained as a language model) and SA-LSTM (pretrained as a sequence autoencoder). The authors suggest why it helps: the pretrained network can already hold a whole sequence in memory, so the supervised training starts from a good place.

**The notation.** There are no new equations. The language model maximises the probability of each next word. The autoencoder maximises the probability of the input sequence written again from its own encoding, as in [Seq2seq](/milestones/seq2seq2014/) with the input as the target.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv preprint. The numbers below are test error rates; lower is better.

- **Stability.** Without pretraining, training on the IMDB movie reviews often broke down when the network or the training window got larger. With sequence-autoencoder pretraining, these changes "hardly" affected training.
- **IMDB sentiment.** The tuned LSTM without pretraining had 13.50% error. SA-LSTM had 7.24%. The previous best result in the paper's table was 7.42%. For LM-LSTM, the paper gives two different numbers: 7.64% in its table and 8.98% in its text.
- **More unlabelled data.** On the Rotten Tomatoes reviews, SA-LSTM had 20.3% error. Pretraining on 7.9 million unlabelled Amazon movie reviews lowered it to 16.7%. Methods that used extra labelled data scored between 14.6% and 20.6% in the paper's comparison.
- **Other tasks.** SA-LSTM matched or beat the previous best results on 20 Newsgroups (15.6% against 17.1%) and DBpedia (1.19% against 1.74%). These comparisons are from the paper's summary table. Its detailed DBpedia table lists the best earlier result as 1.73%.

## Limits, and what came later

The limits come from the paper's results:

- The gains depend on the task. On Rotten Tomatoes without extra data, the language-model version was worse than no pretraining (21.7% against 20.3%).
- The authors suggest a reason the language model helped less on IMDB: predicting the next word is a short-range goal, so the hidden state may only learn about the next few words.
- Every experiment uses classification. Generating text with the pretrained network is not tested.

Later work took the recipe further. [ULMFiT](/milestones/ulmfit2018/) extended language-model pretraining and fine-tuning. [ELMo](/milestones/elmo2018/), [GPT-1](/milestones/gpt1_2018/) and [BERT](/milestones/bert2018/) all cite it as a precedent for pretraining.

## What to know first

- [LSTM](/milestones/lstm1997/), the network being pretrained.
- What a language model does: predict the next word. See [RNN LM](/milestones/mikolov2010_rnnlm/).
- The encoder-decoder idea from [Seq2seq](/milestones/seq2seq2014/), which the sequence autoencoder reuses.
- The difference between labelled and unlabelled data.

## How to read it

The paper is 10 pages and mostly results tables.

1. Read the abstract and section 1.
2. Read section 2 with Figure 1, the sequence autoencoder.
3. Read section 4.1 on IMDB. It explains the stability problem best.
4. Read section 4.2 on Rotten Tomatoes. It shows the value of more unlabelled data.

Expect about 40 minutes (an estimate).

## Links

- The paper: [arXiv 1511.01432](https://arxiv.org/abs/1511.01432)
- Code: the paper does not link code.
- Video: none is linked here yet.
