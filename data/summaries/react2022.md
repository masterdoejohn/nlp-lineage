---
milestone: react2022
source: https://arxiv.org/abs/2210.03629v3
version: arXiv version 3 (March 2023) of the ICLR 2023 conference paper
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It prompted a language model to alternate between writing its reasoning and taking actions, such as searching Wikipedia, so that each thought guides the next action and each result feeds the next thought.

## The problem before it

Two lines of work were separate. [Chain-of-thought](/milestones/cot2022/) prompting showed that a model reasons better when it writes out its steps. But the authors call it "a static black box": the model reasons only from what it already knows, so it can invent facts, and one wrong step spreads to the answer.

Other work used language models to choose actions in an environment, such as a web browser in [WebGPT](/milestones/webgpt2021/) or a robot's next step. These systems mostly mapped what they saw directly to an action. They did not reason in language about goals, keep track of progress, or adjust a plan when something went wrong.

## The idea

**The mechanism.** Let the model's possible outputs include free-text "thoughts" as well as actions. A thought changes nothing in the environment and gets no response. It only adds to the context, to help the next step. A ReAct run is a chain of steps:

- **Thought:** for example, "I need to search Apple Remote, and find the program it was originally designed to interact with."
- **Action:** for example, `search[Apple Remote]`.
- **Observation:** the result that comes back, for example the first sentences of the Wikipedia page.

The model then writes the next thought, using what it just observed. Thoughts can split a goal into parts, pull out key facts, apply common sense, notice a failed search and try another, or decide that the answer is found.

The model is not trained for this. It is a frozen PaLM with 540 billion parameters, given a few worked examples in its prompt ([few-shot prompting](/glossary/few-shot-prompting/)). People wrote these examples by typing their own thoughts next to the actions they took. For question answering, the model gets a deliberately simple Wikipedia tool with three actions: `search`, `lookup` (find the next sentence containing a word on the current page) and `finish`.

For reasoning tasks, thoughts and actions alternate. For long tasks in an environment, thoughts appear only where they are useful, and the model decides where.

The authors also combine ReAct with [self-consistency](/glossary/self-consistency/) (CoT-SC: sample many chains of thought and take the majority answer). Either ReAct runs first and falls back to CoT-SC if it finds no answer, or CoT-SC runs first and falls back to ReAct if the samples do not agree.

**The notation.** At step `t`, an agent sees an observation `o_t` and chooses an action `a_t` from a set `A`, based on the context `c_t = (o_1, a_1, ..., o_(t-1), a_(t-1), o_t)`. ReAct enlarges the set of actions to `Â = A ∪ L`, where `L` is the space of language. An action from `L` is a thought: it adds to the context, `c_(t+1) = (c_t, â_t)`, but the environment does not respond.

## What it showed

**Reported in the paper.** It was published at ICLR 2023, a peer-reviewed conference. Most results use PaLM-540B with only a few examples in the prompt.

- **Multi-step questions (HotpotQA, exact match).** ReAct scored 27.4, slightly below chain-of-thought at 29.4, and above acting without thoughts at 25.7. The best result was ReAct falling back to CoT-SC, at 35.1.
- **Fact checking (FEVER, accuracy).** ReAct scored 60.9, against 56.3 for chain-of-thought. The best was CoT-SC falling back to ReAct, at 64.6.
- **Still far from trained systems.** The best supervised systems scored 67.5 on HotpotQA and 89.5 on FEVER.
- **Why the methods fail differently.** In 200 hand-checked HotpotQA cases, invented facts caused 56% of chain-of-thought's failures and none of ReAct's. ReAct's main failures were reasoning errors, often repeating the same thoughts and actions in a loop (47%), and searches that returned nothing useful (23%).
- **Fine-tuning.** Smaller PaLM models were fine-tuned on 3,000 correct ReAct runs. Then ReAct became the best of the four methods, and the fine-tuned 8 billion-parameter model beat every prompting method on the 62 billion-parameter model.
- **Household tasks in a text game (ALFWorld).** The best ReAct prompt succeeded in 71% of 134 unseen tasks, against 45% for acting without thoughts, and 37% for BUTLER, a system trained by imitation on 100,000 expert examples per task type. Even the worst ReAct prompt (48%) beat both.
- **Online shopping (WebShop).** ReAct succeeded in 40.0% of cases, about 10 points above systems trained by imitation and reinforcement learning (29.1% and 28.7%). Expert humans succeeded in 59.6%.
- **Thoughts beat simple feedback.** On ALFWorld, ReAct's own thoughts (71%) beat thoughts that only restate what the environment reports (53%), an approach like the earlier Inner Monologue.
- **Other models.** With GPT-3 (text-davinci-002) instead of PaLM, ReAct scored higher on both a 500-question HotpotQA sample and ALFWorld.

## Limits, and what came later

The limits come from the paper:

- Complex tasks with many possible actions need more examples, and these can go beyond the model's input length.
- The fixed pattern of thought, action and observation makes reasoning less flexible than free chain-of-thought, which is why ReAct had more reasoning errors.
- A search that returns nothing useful can derail the whole run.
- The model sometimes repeats earlier thoughts and actions in a loop. The authors suspect greedy decoding.
- The main model, PaLM, was not openly available. The prompts are in the appendix, and GPT-3 code is on the project page.
- Connecting a model to real environments has risks, such as finding private information or taking harmful actions. The experiments only used Wikipedia and a simulated shop, where nothing could really be bought or edited.

Later work built on it. [Reflexion](/milestones/reflexion2023/) added verbal self-reflection to ReAct agents. [SWE-agent](/milestones/swe_agent2024/) built on the reason-and-act pattern for software engineering tasks.

## What to know first

- [Chain-of-thought](/glossary/chain-of-thought/) prompting and [self-consistency](/glossary/self-consistency/).
- [Few-shot prompting](/glossary/few-shot-prompting/) and [in-context learning](/glossary/in-context-learning/).
- The idea of an agent: a loop that observes, chooses an action, and observes the result.
- [WebGPT](/milestones/webgpt2021/), an earlier model that used a browser.

## How to read it

The main text is 10 pages. The appendix holds the full prompts and many example runs.

1. Read section 1 with Figure 1. The figure compares the four prompting styles on one question, which is the clearest way into the idea.
2. Read section 2 for the method.
3. Read section 3.3 with Tables 1 and 2.
4. Read section 4 for the household and shopping tasks, with Tables 3 and 4.
5. Look at one full prompt in Appendix C.1, to see what the model is actually given.

Expect about 1.5 hours for the parts above (an estimate).

## Links

- The paper: [arXiv 2210.03629](https://arxiv.org/abs/2210.03629)
- Code and project page: [react-lm.github.io](https://react-lm.github.io/), named in the paper.
- Video: none is linked here yet.
