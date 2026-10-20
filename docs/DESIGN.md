# Design system: NLP Lineage

This file records the visual system, version 5. It covers the reference site and the guided tour at /tour/. PRODUCT.md, beside it, covers the readers, purpose and principles. Version 4, the earlier "transit print manual" look, is in the git history: commit 19f2bdf is the last one in which the tour uses it.

# Shared system

## Concept

The site reads like an editorial print magazine. It has a white canvas, near-black ink, generous whitespace and calm heroes. Emphasis comes from type size and from colour-block surfaces, never from bold display type, gradients or shadows. Long pages alternate between white bands and signature cards, so that no two neighbouring bands have the same surface.

The system is modelled on the public marketing design of Airtable. It adapts that language for a reading-heavy reference site and uses none of Airtable's names, logos or licensed fonts.

## Decisions that differ from the model

| Model | This site | Why |
|---|---|---|
| Haas Grotesk / Haas Groot Disp | Playfair Display for headings, Lato for text | Open fonts, chosen for this project |
| Body text 14px | 17px (nav, captions and meta stay 14px) | Long summaries need a comfortable size |
| Weight 500 for buttons and labels | Lato 700 | Lato has no 500 weight |
| No added accent colours | The ten thread colours stay, for data only | They identify research threads in marks, map lines and the tracer |
| Links never underlined | Links in running text are underlined | Link blue on body text is about 2:1, below the 3:1 needed to tell links apart by colour alone |
| Hairline input borders | Inputs use `--input-line` (#7c818a) | Form controls need a 3:1 boundary |
| Pricing sub-system | Not used | The site has no pricing page |
| Light theme only | Light theme only | The token file has no dark values; the site also sets `data-theme="light"` on `<html>` |

## Colour

All tokens are on `:root` in `src/tokens.css`, one file shared by the reference site and the tour. It also maps the older names the tour's scripts use (`--paper`, `--panel`, `--ink-2`, `--rule`) onto these values.

| Token | Value | Role |
|---|---|---|
| `--canvas` | #ffffff | Page surface |
| `--surface-soft` | #f8fafc | Fact cards, study cards, tiles, filters |
| `--surface-strong` | #e0e2e6 | The light grey call-to-action band |
| `--surface-dark` | #181d26 | The dark call-to-action card |
| `--hairline` | #dddddd | Dividers, secondary button outline |
| `--ink` | #181d26 | Headings, primary button, strongest text |
| `--ink-active` | #0d1218 | Primary button when pressed |
| `--body` | #333840 | Running text |
| `--muted` | #41454d | Kickers, captions, meta |
| `--link` / `--link-active` | #1b61c9 / #1a3866 | Links; also the focus ring |

**Signature surfaces** are whole cards or bands, never small accents:
- Coral #aa2d00 and forest #0a2e0e carry white text. Forest is used for some of the tour's chapter openers.
- Cream #f5e9d4 holds callouts (a milestone's level, the home page search).
- Peach #fcab79, mint #a8d8c4, yellow #f4d35e and mustard #d9a441 are tile surfaces. Text on them is ink only: muted grey and link blue fall below 4.5:1 on some of them.

**Thread colours** mark data: the square beside a thread's name, the line above a thread page's title, the timeline's column heads, the tracer's dots, the tour's route stops, map lines and stations, and the fills inside its diagrams. They are never page surfaces, and small text is never set in them.

The ten thread colours were validated together as a categorical set, using the dataviz palette validator. The checks covered adjacent pairs under colour-vision deficiency, the normal-vision floor and the lightness band. Neighbouring rows of a map follow the order the colours were validated in: `lm, align, rep, eff, reason, open, multi, agent, soc, scale`.

| Thread | Colour | Text on a filled shape in a diagram |
|---|---|---|
| Language modelling (`lm`) | #0173e6 | white |
| Alignment (`align`) | #a3000e | white |
| Representation and retrieval (`rep`) | #8347cf | white |
| Efficiency and infrastructure (`eff`) | #07a44c | ink |
| Reasoning (`reason`) | #a82f74 | white |
| Open weights (`open`) | #884d01 | white |
| Multimodality (`multi`) | #0390a4 | ink |
| Agents (`agent`) | #c56001 | ink |
| Products and governance (`soc`) | #444e91 | white |
| Scale and data (`scale`) | #c79101 | ink |

## Type

| Role | Face | Setting |
|---|---|---|
| Page title (h1) | Playfair Display 400 | clamp(2.5rem to 3.5rem), line height 1.1 |
| Section heading (h2) | Playfair Display 400 | clamp(1.75rem to 2.25rem), line height 1.2 |
| Sub-heading, card title | Playfair Display 500 | 1.25rem |
| Running text | Lato 400 | 17px, line height 1.6 |
| Lead | Lato 400 | 1.25rem |
| Buttons, labels | Lato 700 | 16px (14px in the top bar) |
| Nav, captions, meta | Lato 400 or 700 | 14px |

Display type is never bolder than 500. Fonts load from Google Fonts, with Georgia and the system sans-serif stack as fallbacks.

## Space, corners and depth

- **Sheet:** 1280px wide, with a gutter of clamp(16px, 4vw, 48px).
- **Spacing:** a 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96). Bands are `--section` apart: 96px on wide screens, at least 56px on phones.
- **Corners:** 12px for buttons, signature cards and soft cards; 10px for tiles, callouts and study cards; 6px for inputs and chips; 2px for thread squares; full round for the tracer dots and the thread line.
- **Depth:** colour blocks, not shadows. The only shadow is a faint blue-tinted drop under the primary button.

## Components of the reference site

- **Top bar:** 64px, white, pinned, with a hairline below. Name on the left, five section links, then Search (secondary) and Guided tour (primary). Below 900px the links fold behind a Menu button and open as a full-screen sheet. Without JavaScript, the links wrap under the name.
- **Hero:** white, with a kicker, the h1, a lead and at most one primary button. A milestone's hero also shows its thread mark and date, the original title, the authors and the button pair.
- **Buttons:** primary is near-black with white text; secondary is white with a hairline. On coral, forest and dark cards the secondary button stays white.
- **Signature cards:** coral (the home page's turning points, with four figures), dark (the learning path) and light grey (reporting a problem). Padding is 48px, or 24 to 32px on phones.
- **Tiles:** pastel on the home page's "Where to start" (heights differ on purpose), soft grey elsewhere.
- **Fact card:** a soft card holding the milestone's spec sheet.
- **Callouts:** cream cards for a milestone's level and other notes.
- **Lists:** year blocks and rows divided by hairlines; the year is set in Playfair Display.
- **Footer:** white, the name and a sentence on sources, three link columns, and a legal row with the licences.

## States

In both parts of the site, components define a default state and a pressed (`:active`) state. There is no hover styling. Keyboard focus always shows a 2px ring in link blue, or white on dark and coral cards. Both parts render in the light theme even when the reader's system prefers dark.

# The guided tour

The tour uses the same tokens, type and states as the reference site. A working diagram stays pinned beside the text, and scrolling through the text drives the diagram. The design draws on scrollytelling journalism (the pinned graphic changes with each step of text) and on explorable explanations (the experiments sit inline, directly after the scene they extend).

## Components

- **Route strip (the top bar):**
  - 64px, white and pinned, with a hairline below.
  - Fourteen stop dots in their chapters' thread colours on a grey track. An ink fill follows the scroll between stops.
  - Passed stops are filled; the current stop is enlarged and ringed.
  - It also shows "N of 14" and the chapter title.
- **Hero:** white, with the title, a lead and the opening diagram.
- **Opening diagram:**
  - Each thread starts at its first year in the data and runs to a 2026 interchange.
  - The time axis is compressed before 2012, and the break is marked on the axis and stated in the caption.
- **Route index:** a soft card with a two-column list of the chapters, and a full-width note at the split after stop 7.
- **Chapter opener:** a signature card with 12px corners. It holds the chapter number, a meta line (a thread mark, the years and the thread), the title and the question.
  - The surface rotates through coral, dark, forest and cream, so that no two neighbouring openers match. The surface paces the page and does not encode anything; the thread mark names the chapter's thread.
  - Chapter 14, where all ten threads meet, is dark and has a band of the ten thread colours along its foot.
- **Scene:**
  - A stage (SVG), with a provenance note below it carrying a tag such as "From the data" or "Illustrative values".
  - A numbered list of steps. On phones each step is a white card with a hairline and 10px corners.
- **Keystone:** a soft card with a short line in the milestone's thread colour, then the date, title, original title, problem, idea and why it mattered, and an "Open the study card" button.
- **Experiment plate:**
  - A white card with a hairline and 12px corners.
  - The plate number (chapter.position) is underlined in the chapter's thread colour.
  - The answer box is a soft panel; checks use the soft surface.
- **Remember:** one sentence in Playfair Display on a cream callout.
- **Also on this stretch:** station rows that show the year, thread dots, name and one line of explanation.
- **Study card (dialog):**
  - A side sheet with rounded inner corners (a bottom sheet on phones).
  - A white header with a short line in the milestone's thread colour, the name and a Close button.
  - The original title and the authors, then a soft 2×3 grid (date, kind, organisation, access, chapter, threads).
  - The sections below are: why it matters, what to learn, where it came from, and what it led to.
- **Whole map:** a horizontal strip of every station on desktop and a vertical strip on phones.
- **Lineage tracer:** a 2px ink line with station dots, drawn downward when you choose a model.
- **Footer:** light, with two columns on reading the evidence and reading the scenes.

## Motion

GSAP 3.12.5 and ScrollTrigger load from cdnjs. Motion turns on only when both libraries are present and the reader has not asked for reduced motion. In that case the script adds `html.motion`.

- **Scenes:**
  - Each builder draws the finished picture first, then adds `.from()` tweens to a paused timeline. In that timeline, step k occupies time [k, k+1), and step 0 is the resting picture.
  - A ScrollTrigger scrubs the timeline (scrub 0.6) from the first step to the last.
  - On wider screens a step's change plays while its text rises from 70% of the viewport. On phones the change plays as the step card enters from the bottom; the card then slides under the pinned figure, so the diagram is never covered.
- **Figure pinning:** `position: sticky` (no pin spacers) keeps the figure fixed below the route strip: full height on desktop, and 52svh at the top of the screen below 960px.
- **Openers:** a scrubbed clip-path opens the card from a 3 to 7% inset to its full size, keeping its 12px corners. The chapter number rises by 30% of its height.
- **Opening diagram:** on load, the threads draw from their start years and the interchange appears last (about 2.3 seconds).
- **Whole map:** on desktop it is pinned and scrolled sideways by vertical scrolling. Moving keyboard focus to a station scrolls the page to the matching point.
- **Tracer:** the line draws downward (`--draw`) and the rows enter with a 35ms stagger.
- **Easing:** expo-out for entrances, none for scrubbed draws. Nothing bounces.
- **Reduced motion, or no GSAP:** no class is added and nothing is pinned. Scenes are built once in their finished state, the opening diagram is drawn without animation, and the tracer appears at once.

## Scene builder contract

`BUILD[n]({svg, w, h, fs, mx, arrow})` draws into an SVG whose viewBox is `w × h`.
- `fs` is clamp(12.5, min(w, h)/34, 17).
- The builder must be deterministic, because it runs twice. The first run builds an unseen probe, which measures the finished picture so it can be centred vertically and checked for overflow. The second run is the real build.
- Text goes through `sT`, which puts colour, size and weight in the style attribute; CSS classes would otherwise win over SVG presentation attributes.
- `wrapT` and `fitW` measure the real rendered text.
- Scene text has a 3px halo in the canvas colour (`paint-order: stroke`). Text on filled shapes carries the class `nh`, which removes the halo.

## States

| State | What the reader sees |
|---|---|
| First load | The opening diagram waits up to 450ms for the web fonts, then draws itself |
| Fonts fail | Fallback stacks; scenes measure the text that actually renders |
| No JavaScript | Hero, footer and a `noscript` line explaining that the chapters need JavaScript |
| No GSAP | Every scene still and finished, everything else working |
| Reduced motion | The same as no GSAP |
| Dark system setting | The page stays light |
| Widths | 390px phone, 820px tablet and 1440px desktop checked; scenes rebuild when the width changes by more than 24px |
