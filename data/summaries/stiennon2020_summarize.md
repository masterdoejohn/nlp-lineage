---
milestone: stiennon2020_summarize
source: https://arxiv.org/abs/2009.01325v3
version: arXiv version 3 (February 2022) of the NeurIPS 2020 conference paper
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It showed that a language model trained on people's choices between two outputs writes better summaries than a model trained only to copy human-written examples. Its three steps, collecting comparisons, training a reward model and optimising against that model with reinforcement learning, became the standard recipe for reinforcement learning from human feedback (RLHF).

## The problem before it

A pretrained language model is usually fine-tuned on a task by learning to reproduce human-written examples. For summaries, the score used was often ROUGE, which counts the words a summary shares with a reference summary.

The authors say both are only rough stand-ins for what people want: a good summary.

- **Copying examples treats all errors the same.** A made-up fact costs as much as a different choice of synonym.
- **The model learns from poor examples too,** because it must give some probability to every example in the data.
- **ROUGE often disagrees with human judgments** of quality.

[Earlier work](/milestones/ziegler2019_rlhf_lm/) had fine-tuned language models from human preferences, including for summaries. But its models mostly copied sentences from the text, and its labelers often disagreed with the researchers about what a good summary is.

## The idea

**The mechanism.** Start from a pretrained GPT-3-style model, with 1.3 billion or 6.7 billion parameters, fine-tuned to write summaries of Reddit posts. Then repeat three steps:

1. **Collect comparisons.** Show a person a Reddit post and two summaries from different models. The person picks the better one.
2. **Train a reward model.** A copy of the language model with a new output layer learns to give a score to a post and its summary. It is trained so that the summary people chose gets the higher score.
3. **Optimise the summary model against the reward model** with reinforcement learning, using the PPO algorithm. The reward is the reward model's score for the whole summary.

Two details matter:

- **A penalty for drifting.** The reward subtracts a term that grows as the new model moves away from the original fine-tuned model. This keeps the model writing summaries like the ones the reward model was trained on, and keeps its outputs varied.
- **Careful labelers.** The researchers trained the labelers, answered their questions in a shared chat room, and checked their agreement with the researchers' own judgments throughout. On a subset of comparisons, labelers agreed with the researchers 77% of the time, and researchers agreed with each other 73% of the time.

The data is a filtered set of 123,169 Reddit posts from the TL;DR dataset, with summaries 24 to 48 tokens long.

**The notation.** The reward model `r_θ` is trained with the loss `-log σ(r_θ(x, y_i) - r_θ(x, y_(1-i)))`, where `x` is the post, `y_i` the summary people chose and `y_(1-i)` the other one. The reward for reinforcement learning is `R(x, y) = r_θ(x, y) - β log[π_RL(y|x) / π_SFT(y|x)]`. The second term is the drift penalty: `π_RL` is the new model, `π_SFT` the original fine-tuned model, and `β` sets the strength of the penalty.

## What it showed

**Reported in the paper.** We read version 3 of the arXiv paper. Quality was judged by human labelers.

- **Better than much larger models.** People preferred the 1.3-billion-parameter model trained with feedback over the human reference summaries 61% of the time. A supervised model 10 times larger reached only 43%. The 6.7-billion-parameter feedback model was better again.
- **Better than the human references.** Both feedback models were preferred to the reference summaries written by the posts' authors. The feedback models write longer summaries, so the authors corrected for length: the 6.7-billion-parameter model was still preferred about 65% of the time.
- **Better on every measure.** Rated on a 7-point scale, the feedback models scored higher on coverage, accuracy, coherence and overall quality. The largest gain was in coverage. The 6.7-billion-parameter model got a perfect overall score 45% of the time, against 20% for the supervised model and 23% for the reference summaries.
- **Transfer to news.** With no training on news, the feedback models summarised CNN/Daily Mail articles almost as well as a model of the same size fine-tuned on that news data.
- **Too much optimisation backfires.** With a weak drift penalty, the summary model learned to exploit the reward model. Its scores from the reward model kept rising, but people liked its summaries less and less.
- **The reward model beats ROUGE.** On summaries from the feedback model, ROUGE agreed with people only about 50% of the time, the level of guessing. The reward model agreed 62% of the time. Optimising for ROUGE gave worse summaries than optimising for the reward model.
- **Scale helps the reward model.** Doubling the comparison data raised its accuracy by about 1.1 percentage points, and doubling its size by about 1.8.

## Limits, and what came later

The limits come from the paper:

- **Cost.** The reinforcement-learning step for the 6.7-billion-parameter model took about 320 GPU-days. The comparison data took thousands of labeler hours.
- **No equal-effort baseline.** The authors could not afford to collect the same amount of high-quality human-written summaries, so they could not compare the two methods at equal labelling cost.
- **The reward model is imperfect.** It prefers longer summaries: it chose shorter improved versions less often than people did. It can be exploited if optimised too hard.
- **A narrow domain.** About two thirds of the posts are about relationships. The posts are lightly moderated, so the models can produce biased or offensive summaries.
- **Who sets "good" behaviour.** For tasks where people disagree, the authors say the groups affected by a model should help define good behaviour.
- **Misuse.** The same method could train a model to persuade or manipulate.

The recipe spread quickly. [WebGPT](/milestones/webgpt2021/) used it for long answers to questions. [InstructGPT](/milestones/instructgpt2022/) applied it to following instructions in general. [Anthropic's helpful and harmless assistant](/milestones/hh_rlhf2022/) trained preference reward models in the same way. [DPO](/milestones/dpo2023/) later reworked the objective so that no separate reward model is needed.

## What to know first

- [Learning from human preferences](/milestones/christiano2017_rlhf/): learning a reward model from people's comparisons between pairs of behaviours. This paper applies that method to language.
- [GPT-3](/milestones/gpt3_2020/)-style language models, and fine-tuning on examples.
- Reinforcement learning in outline: a model takes actions, gets a reward and changes to get more reward.
- What a summary metric like ROUGE measures: word overlap with a reference summary.

## How to read it

The paper is 10 pages of main text, with 35 pages of appendices and samples.

1. Read section 1 with Figure 1 for the main result.
2. Read section 3 with Figure 2. It explains the three steps and the data.
3. Read section 4.1 for the main results, and 4.3 with Figure 5 for over-optimisation.
4. Read section 5 for the authors' limits and the wider effects.
5. Look at appendix C.5 to see the instructions given to labelers.

Expect about 1.5 hours for the steps above (an estimate).

## Links

- The paper: [arXiv 2009.01325](https://arxiv.org/abs/2009.01325)
- Code and data: [openai/summarize-from-feedback](https://github.com/openai/summarize-from-feedback), named in the paper. It holds inference code for the 1.3-billion-parameter models and the 64,832 human comparisons. The repository is archived on GitHub.
- Video: none is linked here yet.
