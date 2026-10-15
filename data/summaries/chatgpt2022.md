---
milestone: chatgpt2022
source: https://openai.com/index/chatgpt/
source_kind: pages
version: OpenAI blog post of 30 November 2022, read from the Web Archive copy of that day
source_note: Also read is OpenAI's ChatGPT Plus announcement of 1 February 2023 (Web Archive copy). OpenAI published no paper about ChatGPT.
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

It put a model trained with human feedback into a free chat window that anyone could use, so the public could hold a conversation with a language model, ask follow-up questions and have it correct course.

## The problem before it

[InstructGPT](/milestones/instructgpt2022/) had shown that fine-tuning with [human feedback](/glossary/reinforcement-learning-from-human-feedback/) made a model follow a single instruction far better. But using such models still meant the API or a test page, with one prompt and one answer at a time.

A conversation needs more. The model must keep track of what was said before, answer follow-up questions, notice a false assumption in a question, admit a mistake, and refuse harmful requests. OpenAI's announcement names exactly these goals.

## The idea

**The mechanism.** OpenAI describes ChatGPT as a "sibling model to InstructGPT", trained with the same method but with differences in how the data was collected:

1. **Supervised fine-tuning on conversations.** Human AI trainers wrote conversations in which they played both sides, the user and the AI assistant. They could see model-written suggestions to help them write the assistant's replies.
2. **A [reward model](/glossary/reward-model/) from rankings.** Trainers took their own conversations with the chatbot, picked a model-written message, and ranked several alternative replies by quality.
3. **Reinforcement learning.** The model was fine-tuned against the reward model with the PPO algorithm. OpenAI repeated the process several times.

The starting model was "a model in the [GPT-3.5](/milestones/gpt35_2022/) series, which finished training in early 2022". OpenAI says it was trained on an Azure AI supercomputing infrastructure.

ChatGPT was released as a free "research preview", with a Moderation API to warn about or block some unsafe content. OpenAI asked users to report problem outputs through the interface, and ran a feedback contest with prizes of up to $500 in API credits.

**The notation.** None. The sources give no model size, architecture or training data.

## What it showed

**Reported by the sources.** These are OpenAI's own statements and examples, not peer-reviewed results. The announcement gives no benchmark scores.

- **Conversation.** The examples show ChatGPT asking a clarifying question about broken code, understanding "it" as the theorem named earlier in the chat, and rewriting a note to be more formal when asked.
- **False premises.** Asked about "when Christopher Columbus came to the US in 2015", ChatGPT noted that Columbus died in 1506, then imagined the visit. InstructGPT (text-davinci-002) described the visit as if it had happened.
- **Refusals.** Asked how to bully a named person, ChatGPT refused. InstructGPT gave suggestions. Asked how to break into a house, ChatGPT first refused, then answered when the user explained they wanted to protect their own home.
- **Limits of its abilities.** Asked to send a letter, it said it could not, because it is a text-based assistant.
- **Use.** Two months later, OpenAI said "millions of people" had given feedback, and that people used ChatGPT for drafting and editing, brainstorming, programming help and learning. It launched ChatGPT Plus, a $20 a month subscription in the United States, and kept free access.

## Limits, and what came later

The limits come from OpenAI's announcement:

- It sometimes writes answers that sound plausible but are wrong or nonsensical. OpenAI gives three reasons this is hard to fix: reinforcement learning has no source of truth; making the model more cautious makes it refuse questions it could answer; and supervised examples mislead it, because the ideal answer depends on what the model knows, not what the human trainer knows.
- It is sensitive to wording. A slight rephrase, or simply asking again, can change whether it answers.
- It is often too long and overuses some phrases, such as saying it is a language model trained by OpenAI. OpenAI blames trainers' preference for longer answers and over-optimisation.
- It usually guesses what an unclear question means instead of asking.
- It sometimes follows harmful instructions or shows bias, and the content filter makes some mistakes in both directions.
- OpenAI published no paper, model size or training data for it.

Later work depended on it. [Chatbot Arena](/milestones/chatbot_arena2024/) compares chat models by public head-to-head votes, which needed a market of public chat assistants.

## What to know first

- [InstructGPT](/milestones/instructgpt2022/), the training method, and [GPT-3.5](/milestones/gpt35_2022/), the starting model.
- [Reinforcement learning from human feedback](/glossary/reinforcement-learning-from-human-feedback/) and [reward models](/glossary/reward-model/).
- [Instruction tuning](/glossary/instruction-tuning/).

## How to read it

There is no paper to read. Instead:

1. Read the opening, then the "Methods" and "Limitations" sections of the announcement.
2. Look at the samples, and the side-by-side comparison with InstructGPT under "Iterative deployment".
3. Read the short ChatGPT Plus announcement.
4. For the method in depth, read the [InstructGPT](/milestones/instructgpt2022/) summary.

Expect about 30 minutes for the steps above (an estimate).

## Links

- The announcement: [openai.com/index/chatgpt](https://openai.com/index/chatgpt/), and the [Web Archive copy of 30 November 2022](https://web.archive.org/web/20221130211011/https://openai.com/blog/chatgpt/) that was read.
- ChatGPT Plus announcement: [Web Archive copy of 1 February 2023](https://web.archive.org/web/20230201235213/https://openai.com/blog/chatgpt-plus/).
- Code and video: none are published.
