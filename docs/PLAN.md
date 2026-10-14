# Plan: NLP Lineage

This plan was agreed on 14 October 2026. It turns the single-page history "How language models came to be" (version 4) into a public reference website.

## What it is

- **NLP Lineage** is a free, public reference website about how natural language processing led to modern language models.
- It covers the events that caused dramatic changes, the papers behind them, and what to learn first.
- Anyone can use it. There are no accounts. It works on phones, tablets and desktops. It is in English only.
- The current scroll-driven page stays inside the site as the guided tour, at `/tour`.

## Content

- **Scope:** NLP milestones that led to modern language models.
  - Early NLP history is added after launch.
  - The first additions are earlier works that current milestones documentably built on.
- **Page types:**
  - One page per milestone.
  - One page per research thread (10 threads).
  - One page per glossary term: about 50 to 80 at launch. A term is added when a page needs it.
  - A learning path page: 8 phases, and each phase lists the milestones to understand, the terms to know first, and the study notes.
  - The guided tour.
  - There are no separate paper pages and no people pages.
- **Levels:** each milestone has one of three levels: turning point (about 15 to 25), milestone, or notable.
  - The criteria are written down and based on documented links in the data.
  - Claude proposes the levels and the maintainer approves them.
- **Paper summaries** have eight sections:
  1. One sentence: what it changed.
  2. The problem before it.
  3. The idea: the mechanism first, then the notation.
  4. What it showed: every number labelled, and the type of claim stated.
  5. Its limits, and what later work fixed.
  6. What to know first, with links to glossary and milestone pages.
  7. How to read it: which sections first, and about how long it takes.
  8. Links to the paper, code and video.
- **How summaries are made:**
  - Each summary is drafted from the actual paper, never from memory.
  - Each one says: "Drafted with Claude from the paper on (date); reviewed by Zeeshan Arif."
  - At launch, turning points have full summaries. The other milestones show their current narrative, marked "full summary in progress".
- **Sources behind a paywall:** link the official version. Add an open copy only when the authors or the publisher provide one legally.

## Rules (unchanged from version 4)

- **Plain language:** follow ASD-STE100 principles. Short sentences, one idea per sentence, and technical terms defined at first use. Never claim that the prose complies with the standard.
- **No em dashes.**
- **Honest evidence:**
  - Never draw a relationship the sources do not support.
  - Keep weak links (indirect, timing only, later interpretation) visibly marked.
  - Label every number with the kind of number it is.
  - Use primary sources only.
  - Never claim that something was verified unless it was checked.
- **Accessibility:** WCAG 2.2 AA.
- **Look:** avoid the generic "AI website" look, dashboards, and course-platform badges.
- **Changes:** ask before any destructive or hard-to-reverse action.

## Look and features

- **Look:** the version 4 technical-print style covers the whole site.
  - Reference pages are calm and static.
  - Scroll-driven motion stays in the tour.
- **At launch:**
  - Search.
  - Filters by thread, type, year and evidence strength.
  - A timeline.
  - "Before and after" on every milestone page.
  - Glossary links.
  - A "Report a problem" link on every page, which opens a pre-filled GitHub issue.
- **After launch:** comparing two milestones, reading lists, and an installable app (PWA) that works offline.

## Technology and publishing

- **Site:** Astro, with Pagefind for search.
- **Hosting:** Vercel, at a free `nlp-lineage.vercel.app` address. A domain can be bought later.
- **Data:** one file per milestone, glossary term and thread, plus a script that checks the evidence rules.
  - The data files are JSON: one field per line, with short lists on one line. `docs/DATA.md` describes them. This was decided in phase 2.
  - Prose that is longer than a field, such as the paper summaries, goes in Markdown files.
  - The tour's `payload.json` is generated from these files and is never edited by hand.
- **Repository:** one public repository, `masterdoejohn/nlp-lineage`, which holds the data, the site and the tour.
- **Licence:** the content is CC BY 4.0, credited to Zeeshan Arif.
- **Visitor statistics:** a cookieless counter or none, so the site needs no cookie banner.
- **The old version:** the version 4 page on claude.ai is frozen as a private snapshot.

## How the work is done

- Every change comes as a pull request with automatic checks: the build, the evidence-rule checks and the tests.
- Nothing goes live until the maintainer merges it.
- There is no deadline. The next phase starts only after the last one is merged.

## Phases

1. **Restore point:** a git repository, a first commit of version 4 as it is, and the public GitHub repository.
2. **Data split:** one file per entry and the check script.
   - Proof: the tour, built from the new files, is byte-for-byte identical to version 4.
3. **Site skeleton:**
   - Milestone, thread and glossary pages in the version 4 style.
   - The tour at `/tour`.
   - An unlisted Vercel deployment.
4. **Lookup:** search, filters, the timeline, "before and after", and glossary links.
5. **Content:** the levels for approval, turning-point summaries, and the first glossary terms.
6. **Remaining pages:** the learning path page, "report a problem" links, and the licence and about page.
7. **Launch:** check in Safari and on a real phone, then make the site public.
8. **After launch:** the remaining summaries, early NLP history, and the installable app.
