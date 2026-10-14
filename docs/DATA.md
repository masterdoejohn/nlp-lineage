# The research data

The data is a set of milestones in the history of language models and the relationships between them. Every milestone and every relationship has a primary source. This file describes where the data lives, how to change it, and what the check script checks.

## Where the data lives

Each entry has its own file, so each change is small and easy to review.

| Path | What it holds |
|---|---|
| `data/milestones/<id>.json` | One milestone. The file name is the milestone's id, for example `gpt3_2020.json`. |
| `data/relationships.jsonl` | All relationships, one per line. The line order is kept, so add new relationships at the end. |
| `data/threads/NN-<id>.json` | One research thread. `NN` is its position in the list, for example `01-lm.json`. |
| `data/chapters/NN.json` | One chapter of the guided tour. `NN` is the chapter number. |
| `data/study.json` | Study notes for some milestones: what to understand and what to know first. |
| `data/phases.json` | The eight learning phases. |
| `data/trace.json` | The models offered in the lineage tracer. |
| `data/summaries/<id>.md` | A full summary of one milestone's paper, drafted from the paper itself. The file name is the milestone's id. The format is below. |
| `data/glossary/<id>.json` | One glossary term. The id is lower case words joined by hyphens, for example `self-attention`. The folder appears with the first term. |

`lineage_data.py` reads these files and rebuilds the payload that the guided tour uses. The reference site (`site/lib/data.ts`) reads the same files. Milestones are put in order by date, then by id. Nothing else is reordered. `build.py` calls it, so there is no payload file to edit by hand.

## Fields

### A milestone

| Field | Meaning |
|---|---|
| `id` | Lower case, with a four-digit year, for example `gpt3_2020`. It never changes once published. |
| `title`, `short` | The original title, and the short name used on the page. |
| `date`, `dprec` | The date, and its precision: `day` (2020-05-28), `month` (2020-05 or a full date) or `year` (2020). |
| `dtype`, `other` | What the date marks, for example "arXiv submission", and any other dates worth knowing. `other` can be empty. |
| `authors`, `inst` | Who made it, and where. |
| `type` | What kind of milestone it is, for example "model" or "research paper". |
| `src` | The primary source, as an https link. |
| `before`, `problem`, `breakthrough`, `why`, `next`, `inherits` | The narrative: the state before it, the problem, the idea, why it mattered, what came next, and what it inherited. |
| `claim` | Who stands behind the reported results: `vendor-reported`, `peer-reviewed`, `official`, `mixed` or `n-a`. |
| `level`, `tp` | The level: `turning-point`, `milestone` or `notable`. It is measured from the relationships, as described in [LEVELS.md](LEVELS.md). `tp` is `true` exactly when the level is `turning-point`. |
| `imp` | The kinds of impact. |
| `featured` | Either `true` or left out. It comes from the original research data. The page does not use it at present. |
| `lines`, `branches` | The research threads it belongs to (the first one is its home thread), and the topics within them. |
| `phase` | The learning phases it belongs to, from 1 to 8. It can be empty. |
| `ch`, `ord` | Its chapter, and its date as a count of days (Python's `date.toordinal()`; a month or year date counts from its first day). The page sorts by `ord`. |

### A relationship

| Field | Meaning |
|---|---|
| `f`, `t` | From and to: the ids of the earlier and the later milestone. |
| `rel` | What kind of relationship it is, for example "directly built upon" or "influenced". |
| `ev` | How strong the evidence is: `documented` and `strong` are firm; `plausible-indirect`, `coincidence` and `retrospective` are weak and are marked as weak on the page. |
| `note` | What was taken, in one short sentence. |
| `src` | The source that documents the relationship, as an https link. |
| `dateflip` | Present, and `true`, only when the "from" milestone is dated after the "to" milestone. This can happen when work circulated before its formal date. |

### A glossary term

| Field | Meaning |
|---|---|
| `id` | Lower case words joined by hyphens. It matches the file name and never changes once published. |
| `term` | The term as readers see it, for example "Self-attention". |
| `definition` | A plain definition, defining any other technical word it uses. |
| `introduced_by` | The id of the milestone that introduced the term. |
| `used_by` | The ids of milestones that use it. The introducing milestone is not repeated here. |

### A paper summary

A summary is a Markdown file with a short header and exactly eight sections.

The header lies between two lines of `---`. Each header line is `key: value`. Values are plain text, without quotes, and without a second `: `.

| Header field | Meaning |
|---|---|
| `milestone` | The milestone's id. It is the same as the file name. |
| `source` | An https link to the exact text that was read, for example a versioned arXiv link. |
| `source_note` | Optional. A note about the source, for example that it is an open copy and where the official version is. |
| `version` | Which version was read, for example "arXiv version 7 (May 2016)". |
| `read` | The date the source was read, as YYYY-MM-DD. |
| `reviewed_by` | The person who reviewed the summary. |

The page shows: "Drafted with Claude from the paper on (read); reviewed by (reviewed_by)."

The sections are these `##` headings, in this order:

1. **What it changed:** one sentence.
2. **The problem before it.**
3. **The idea:** the mechanism first, then the notation.
4. **What it showed:** it starts with `**Reported in the paper.**`, says whether the paper was peer reviewed or a preprint, and gives each number with what it measures.
5. **Limits, and what came later:** the authors' own limits first. Later work is named only where the relationships in the data document it.
6. **What to know first:** links to milestone and glossary pages.
7. **How to read it:** which sections to read first, and an estimated reading time, marked as an estimate.
8. **Links:** the paper, code if the paper names it, and video. Say so when there is none.

Rules:
- Write from the paper itself, never from memory.
- When the paper contradicts itself, report both numbers. Do not choose one.
- Follow the plain-language rules, with no em dashes.
- Internal links must point to a milestone, a glossary term, `/levels/` or `/tour/`. External links must be https.

## How to change the data

1. Edit or add the files. Keep the layout that `lineage_data.dumps_entry` writes: one field per line, and short lists on one line.
2. Run `python check_data.py`. Fix every problem it lists.
3. Run `python build.py`, then both test files.
4. Commit the data files and the rebuilt `dist/llm-lineage.html` together, in a pull request.

Do not change a fact without a primary source. Put the source in the milestone's `src`, or in the relationship's `src`.

## What `check_data.py` checks

It exits with an error and lists every problem it finds.

- **Files:** every file is valid JSON in the standard layout. No other files are in `data/`.
- **Milestones:**
  - Every required field is present.
  - The file name matches the id.
  - The date is a real date that fits its precision, and `ord` matches it.
  - The level follows the rule in [LEVELS.md](LEVELS.md), and `tp` matches it.
  - The source is an https link.
  - Every thread, topic, phase and chapter it names exists.
- **Relationships:**
  - Both milestones exist, and no relationship appears twice.
  - The evidence type and the kind of relationship come from the fixed lists.
  - There is a note and an https source.
  - `dateflip` is present exactly when the relationship points from a later milestone to an earlier one.
- **Paper summaries:** the header fields, the eight sections in order, the label at the start of "What it showed", working links, and no em dashes.
- **Glossary terms:** the fields are exactly the five above, the id matches the file name, and every milestone named exists.
- **Chapters, study notes, phases and tracer:** they name only milestones that exist. A chapter's `all` list holds exactly the milestones with that chapter number.
- **Writing rule:** there are no em dashes anywhere in the data.
- **Fixed lists:** the lists of types, claims, kinds of impact, date types, relationship kinds and evidence types are fixed. A new value is rejected until it is added to `check_data.py` on purpose, in the same pull request.

The script cannot check that a source supports a claim. That is a human review step, done on every pull request.
