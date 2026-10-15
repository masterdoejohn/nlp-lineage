---
milestone: claude_fable_mythos_2026
source: https://www.anthropic.com/news/fable-mythos-access
source_kind: pages
version: Anthropic statement of 12 June 2026, read from the live page; the earliest Web Archive copy (13 June 2026) is dated 11 June and words one sentence differently
source_note: Also read are Anthropic's launch post Claude Fable 5 and Claude Mythos 5 (9 June 2026), its post Redeploying Fable 5 (30 June 2026, updated 1 July), and its Fable model page, which announces Fable 5.1 (1 September 2026). All are Anthropic's own pages. The US government's directive itself was not read, and its reasons are known here only as Anthropic reports them.
read: 2026-10-15
reviewed_by: Zeeshan Arif
---
## What it changed

Three days after Anthropic released its most capable models to the public, a US export-control directive forced it to switch them off for all users, which is the first case recorded here of a government taking a deployed frontier model offline. Access returned on 1 July 2026, after the controls were lifted.

## The problem before it

In April 2026, Anthropic began [Project Glasswing](/milestones/glasswing2026/), giving its first "Mythos-class" model, Claude Mythos Preview, only to a small group of cyber defenders and providers of critical software. Anthropic describes Mythos-class models as a tier above its Opus models. It says they are very good at finding and exploiting software vulnerabilities, and could provide "uplift" to attackers: help they could not get elsewhere.

Anthropic said it hoped to release Mythos-level abilities to everyone once its safeguards were strong enough. No process existed for how a government should judge, or act on, a reported way around a deployed model's safeguards (a "jailbreak"). Export controls had applied to chips, not to models that were already deployed.

## The idea

**The mechanism.** On 9 June 2026, Anthropic released one underlying model under two names, which differ only in their safeguards:

- **Claude Fable 5**, for general use. Classifiers, which are separate AI systems, watch for requests about cybersecurity, biology and chemistry, and attempts to copy the model's abilities ("distillation"). When one fires, the answer comes from Anthropic's next model, Claude Opus 4.8, instead, and the user is told. Anthropic says it tuned these classifiers cautiously, with a large "safety margin" that also blocks some harmless requests.
- **Claude Mythos 5**, with the cyber safeguards lifted, only for Glasswing partners, "in collaboration with the US government". A planned programme for biology researchers would lift the biology and chemistry safeguards instead.

Anthropic also began requiring 30-day retention of all traffic on Mythos-class models, to find new jailbreaks. It says it does not use this data to train models.

**The events**, as Anthropic reports them:

1. **12 June.** A US government directive, citing national security authorities, applied export controls that barred all foreign nationals, inside or outside the United States, from using Fable 5 and Mythos 5. Anthropic says it had no reliable way to check nationality in real time, so it suspended both models for all users. Its statement that day called the directive a misunderstanding and said a narrow jailbreak should not be a reason to recall a commercial model.
2. **Cause.** Anthropic's later post says the directive followed a report in which Amazon researchers had prompted Fable 5 to identify several software vulnerabilities, and in one case to produce code showing how one could be exploited.
3. **Fix.** Working with the government, Anthropic trained a new classifier to block that behaviour.
4. **26 to 30 June.** The government approved Mythos 5 access for a set of US organisations on 26 June. On 30 June, the export controls were lifted.
5. **1 July.** Fable 5 returned for users worldwide.
6. **1 September.** Anthropic released Claude Fable 5.1.

**The notation.** None. The sources give no size, architecture or training details.

## What it showed

**Reported by the sources.** All of these are Anthropic's statements. The government's own account is not among the sources read.

- **Capability.** Anthropic says Fable 5 was state-of-the-art on nearly all the benchmarks it tested. Its examples include a codebase-wide migration in a 50-million-line codebase done in a day, and finishing the game Pokémon FireRed using only screenshots. In blinded comparisons, Anthropic's scientists preferred Mythos 5's molecular biology hypotheses to those of Opus-class models about 80% of the time. Internal protein designers said it sped up parts of drug design about 10 times.
- **Safeguards at launch.** The classifiers fell back to Opus 4.8 in under 5% of sessions. A bug bounty found no universal jailbreak (one that removes the safeguards broadly) in over 1,000 hours. The UK AI Security Institute made some progress towards one in a brief test.
- **The reported jailbreak.** Anthropic says many less capable models, including Claude Opus 4.8, GPT-5.5 and Kimi K2.7, found the same vulnerabilities, and every model it tested could produce the same exploit demonstration. In its view, the technique exposed no capability unique to Mythos-class models.
- **The fix.** The new classifier blocks the reported technique in over 99% of cases, but also flags harmless coding and debugging requests more often. Anthropic says researchers at the US Center for AI Standards and Innovation (CAISI) tested the old and new safeguards and found them "extraordinarily strong".
- **Price.** $10 per million input tokens and $50 per million output tokens, less than half the price of Mythos Preview.

## Limits, and what came later

The limits come from Anthropic's sources, and from what the sources leave out:

- Anthropic says perfect resistance to jailbreaks is probably impossible for any model provider, and that universal jailbreaks will likely be found in future.
- The safeguards were tuned to block many harmless requests, and the post-June classifier blocks more.
- The government's own reasoning was not published in the sources read. Anthropic's 12 June statement said the directive's letter "did not provide specific details" of the concern.
- Anthropic edited the 12 June statement after publishing it. The earliest archived copy of the 12 June statement says Anthropic had reviewed "the report"; the current page says "a report that we believe is the basis of the government's directive".
- There was no shared industry standard for judging how severe a jailbreak is. After the events, Anthropic proposed one with Amazon, Microsoft, Google and other Glasswing partners, scoring a jailbreak on capability gain, breadth, ease of turning it into an attack, and how easy it is to find. It also committed to giving government evaluators early access to future frontier models and their safeguards.
- Anthropic wrote that government involvement in releases needs "a durable, transparent process", which did not exist at the time.

The data does not yet record later milestones that build directly on these events.

## What to know first

- What a jailbreak is, and how safety classifiers try to block harmful requests.
- What export controls are: government rules that restrict who may receive certain goods or technology.
- [Project Glasswing](/milestones/glasswing2026/), which first released a Mythos-class model.
- [Claude Opus 4.8](/milestones/claude_opus48_2026/), the model that answers when Fable 5's safeguards fire.

## How to read it

There is no paper to read. Instead:

1. Read the launch post's opening and its section "Claude Fable 5's new safeguards".
2. Read the 12 June statement in full. It is short.
3. Read the 30 June post, especially "Timeline and safeguard updates" and "A consensus industry framework for jailbreaks".

Expect about 45 minutes for the steps above (an estimate). Keep in mind that all three are Anthropic's own account.

## Links

- The statement of 12 June 2026: [anthropic.com/news/fable-mythos-access](https://www.anthropic.com/news/fable-mythos-access), and the [earliest Web Archive copy](https://web.archive.org/web/20260613005302/https://www.anthropic.com/news/fable-mythos-access).
- The launch post: [anthropic.com/news/claude-fable-5-mythos-5](https://www.anthropic.com/news/claude-fable-5-mythos-5)
- The redeployment post: [anthropic.com/news/redeploying-fable-5](https://www.anthropic.com/news/redeploying-fable-5)
- The executive order Anthropic cites: [Promoting Advanced Artificial Intelligence Innovation and Security (2 June 2026)](https://www.whitehouse.gov/presidential-actions/2026/06/promoting-advanced-artificial-intelligence-innovation-and-security/)
- Code and video: none are published.
