---
milestone: instructgpt2022
source: https://arxiv.org/abs/2203.02155v1
version: arXiv version 1 (March 2022); the paper was later published at NeurIPS 2022
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It turned GPT-3 into a model that follows written instructions, by fine-tuning it on human demonstrations and then on human rankings of its outputs. People preferred the answers of a 1.3-billion-parameter InstructGPT model to those of the 175-billion-parameter GPT-3. This recipe, reinforcement learning from human feedback (RLHF) applied to general instructions, became the basis of ChatGPT and later assistants.

## The problem before it

A language model is trained to predict the next word of web text. The authors point out that this is not the same as "follow the user's instructions helpfully and safely". So [GPT-3](/milestones/gpt3_2020/) often did not do what the user asked. It could make up facts, produce toxic text, or continue a prompt instead of answering it. Making the model larger did not fix this.

Two lines of earlier work pointed the way:

- [RLHF for summarisation](/milestones/stiennon2020_summarize/) had trained a model on human comparisons for one task.
- [FLAN](/milestones/flan2021/) and [T0](/milestones/t0_2021/) had fine-tuned models on many public NLP datasets written as instructions.

## The idea

**The mechanism.** Start with GPT-3, and teach it to follow instructions in three steps. The prompts are mostly real requests that users sent to an early version of the model on OpenAI's website, plus prompts written by the labelers. About 40 hired contractors, chosen with a screening test, wrote and ranked the data.

1. **Supervised fine-tuning (SFT).** Labelers write good answers to about 13,000 prompts. GPT-3 is fine-tuned to produce these answers.
2. **A reward model.** For about 33,000 prompts, the model writes 4 to 9 answers, and a labeler ranks them from best to worst. A reward model (6 billion parameters) learns to give a higher score to the answers people ranked higher.
3. **Reinforcement learning.** The fine-tuned model is trained with PPO to get high scores from the reward model, on about 31,000 prompts. A penalty stops it moving too far from the step 1 model.

One change fixes a side effect. After step 3, the model got worse on some standard benchmarks, which the authors call an "alignment tax". So the final model, called PPO-ptx, also keeps training on some of GPT-3's original pretraining data during step 3.

The authors aim for a model that is **helpful, honest and harmless**. During training, labelers put helpfulness first. In the final tests, they put truthfulness and harmlessness first.

**The notation.** The reward model is trained with `loss = -E[log σ(r(x, y_w) - r(x, y_l))]`, where `y_w` is the answer people preferred and `y_l` the other one. Step 3 maximises `r(x, y) - β log(π_RL(y|x) / π_SFT(y|x))`, plus `γ` times the log-likelihood of pretraining data. `β` sets the drift penalty and `γ` the share of pretraining data.

## What it showed

**Reported in the paper.** We read version 1 of the arXiv paper. The main test is labelers' preferences on prompts from customers who were not in the training data.

- **Much better than GPT-3.** Labelers preferred the 175-billion-parameter InstructGPT to GPT-3 85% of the time, and to GPT-3 with a carefully chosen few-shot prompt 71% of the time.
- **Smaller but better.** Outputs from the 1.3-billion-parameter InstructGPT were preferred to those of the 175-billion-parameter GPT-3, a model over 100 times larger.
- **Fewer made-up facts.** On tasks where the answer should use only the given text, such as summaries, InstructGPT made up information 21% of the time, against 41% for GPT-3.
- **Truthfulness.** On the TruthfulQA test, the introduction says InstructGPT gave truthful and informative answers "about twice as often" as GPT-3. Section 4.2 describes the gains as "small but significant".
- **Toxicity, but not bias.** When asked to be respectful, InstructGPT produced about 25% fewer toxic outputs than GPT-3. Without that request, the gap disappeared. On two bias tests, it was not less biased.
- **Better than public instruction datasets.** GPT-3 fine-tuned on the FLAN or T0 datasets did worse than InstructGPT. Labelers preferred InstructGPT to them 78% (FLAN) and 79% (T0) of the time. The authors note that most real requests are open-ended writing and brainstorming, not the classification and question-answering tasks in public datasets.
- **It generalised.** Labelers who wrote no training data preferred InstructGPT about as often as the training labelers did. The model also followed some instructions about code and in other languages, which were rare in its training data.
- **Cheap compared with pretraining.** Training the 175-billion-parameter PPO-ptx model took about 60 petaflop/s-days, against 3,640 for GPT-3.

## Limits, and what came later

The limits come from the paper:

- **Aligned to whom?** The model learns the preferences of about 40 labelers, mostly English speakers in the United States or Southeast Asia, and of the researchers who wrote their instructions. The authors say this is not "human values" in general.
- **Still makes simple mistakes.** It can accept false premises in a question, hedge too much on simple questions, and fail on instructions with several constraints.
- **Follows harmful instructions.** It usually does what the user asks, even when that could cause harm. When asked to be biased, it produced more toxic text than GPT-3.
- **The alignment tax is not fully removed.** PPO-ptx still lagged GPT-3 on DROP, SQuAD v2 and translation.
- **Single labels.** Most comparisons were labelled by only one person, to save cost.
- **Easier to misuse.** A model that follows instructions better is also easier to use for misinformation or abuse.

The method spread quickly. [ChatGPT](/milestones/chatgpt2022/) was trained in the same way, and [GPT-3.5](/milestones/gpt35_2022/) continued the instruction-tuned line. [GPT-4](/milestones/gpt4_2023/) and [Llama 2-Chat](/milestones/llama2_2023/) used RLHF pipelines. [DPO](/milestones/dpo2023/) offered a way to train on the same kind of preference data without reinforcement learning.

## What to know first

- [GPT-3](/milestones/gpt3_2020/) and few-shot prompting.
- [RLHF for summarisation](/milestones/stiennon2020_summarize/), the method this paper applies to general instructions.
- Fine-tuning a pretrained model on examples.

## How to read it

The paper is 68 pages, with 20 pages of main text.

1. Read section 1 with Figures 1 and 2. The list of main findings is a good summary.
2. Read section 3, especially 3.1 (the three steps), 3.4 (the labelers) and 3.5 (the models).
3. Read section 4.1 for the main results, and Figures 8 and 9 for examples.
4. Read sections 5.2 and 5.3 on whose preferences the model learns, and on its limits.

Appendix B shows how labelers were chosen and instructed. Expect about 2.5 hours for the steps above (an estimate).

## Links

- The paper: [arXiv 2203.02155](https://arxiv.org/abs/2203.02155)
- Model samples: [openai/following-instructions-human-feedback](https://github.com/openai/following-instructions-human-feedback), named in the paper. It holds samples on public datasets, not the model. The repository is archived on GitHub.
- Video: none is linked here yet.
