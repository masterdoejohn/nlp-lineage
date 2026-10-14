# Design system: How language models came to be

This file records the visual system of the redesign (version 4). PRODUCT.md, beside it, covers the readers, purpose and principles.

## Concept

The page is styled like a transit authority's print manual. It uses one strict grid and treats each research thread as a coloured line. Every chapter opens on a full-width field of its thread's colour. After the opener, a working diagram stays pinned beside the text, and scrolling through the text drives the diagram. Ink carries the words. Colour always identifies a thread and is never used as decoration.

The design draws on three references:
- Scrollytelling journalism: the pinned graphic changes with each step of text.
- Explorable explanations: the experiments sit inline, directly after the scene they extend.
- Technical print design, such as Vignelli's 1972 subway diagram, Swiss posters and engineering drawings: square corners, heavy condensed headings, flat fields of colour, and rules instead of shadows.

## Colour

All colours are tokens on `:root`. The dark values are defined twice: once under `prefers-color-scheme: dark` (guarded by `:root:not([data-theme="light"])`) and once under `:root[data-theme="dark"]`.

### Neutrals

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | #f8f9fb | #0f1216 | Page background and station fill |
| `--panel` | #edeff2 | #181c21 | Footer, answer boxes, empty cells |
| `--ink` | #15181f | #edeff1 | Text, rules, the main trunk line |
| `--ink-2` | #3b4047 | #c4c8cc | Secondary text |
| `--muted` | #595e66 | #9da2a8 | Captions and axis labels (at least 4.5:1 on paper) |
| `--rule` / `--rule-2` | #d1d4d9 / #b4b8bc | #32363c / #494d54 | Hairlines and dashed guides |
| `--focus` | #0173e6 | #7fb1f5 | Focus outline |

### The ten research lines

The ten line colours were validated together as a categorical set, in both themes, using the dataviz palette validator. The checks covered adjacent pairs under colour-vision deficiency, the normal-vision floor and the lightness band. Neighbouring rows of a map follow the order the colours were validated in: `lm, align, rep, eff, reason, open, multi, agent, soc, scale`.

| Line | Light | Dark | Text on the field (light / dark) |
|---|---|---|---|
| Language modelling (`lm`) | #0173e6 | #2f7fe3 | white / ink |
| Alignment (`align`) | #a3000e | #f45249 | white / ink |
| Representation and retrieval (`rep`) | #8347cf | #a167f1 | white / ink |
| Efficiency and infrastructure (`eff`) | #07a44c | #03a14a | ink / ink |
| Reasoning (`reason`) | #a82f74 | #d13d91 | white / white |
| Open weights (`open`) | #884d01 | #a25f12 | white / white |
| Multimodality (`multi`) | #0390a4 | #0b9db3 | ink / ink |
| Agents (`agent`) | #c56001 | #e06d00 | ink / ink |
| Products and governance (`soc`) | #444e91 | #7380c8 | white / ink |
| Scale and data (`scale`) | #c79101 | #bf8b00 | ink / ink |

Chapter 14 opens on `--c-ink-field`, which is ink in the light theme and paper-white in the dark theme, because all ten lines meet there.

Text on a colour field must be large text: at least 24px, or 18.66px if bold. The fields are chosen to meet the 3:1 large-text threshold. They do not reliably meet 4.5:1 for small text. For that reason, opener meta lines are 1.2rem bold, questions are at least 1.5rem, and the study card's close button is 1.2rem bold. Line colours are never used for small text on paper. Experiment numbers and route-index numbers are set in ink, with a coloured mark beside them.

## Type

| Role | Face | Setting |
|---|---|---|
| Display: page title, chapter titles, chapter numbers, section heads | Archivo (variable: width 62 to 125, weight 400 to 900) | Weight 850 to 900, width 62 to 78%, line height 0.8 to 1 |
| Text: everything else | Atkinson Hyperlegible | 400 and 700; body 1.125rem / 1.6 |
| Code and formula | System monospace | 0.88em |

The fallback stacks are "Arial Narrow", "Helvetica Neue", Arial for display, and "Helvetica Neue", Arial for text.

**Scale:**
- caption 0.8125rem
- small 0.9375rem
- body 1.125rem
- lead 1.375rem
- h3 clamp to 1.75rem
- h2 clamp to 4.25rem
- h1 clamp to 5.75rem
- chapter number clamp to 6rem

Letter spacing never goes below −0.015em. Headings use `text-wrap: balance`.

## Space and grid

- **Sheet width:** 1280px, with a gutter of clamp(16px, 4vw, 48px).
- **Spacing steps:** 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128px.
- **Scenes:** 5/12 for the steps and 7/12 for the figure on desktop. Below 960px the scene is one column, with the figure first.
- **Corners and depth:** every corner is square, and nothing has a shadow. Separation comes from 1.5px ink rules and hairlines. The only rounded shapes are station dots and the interchange pill in the opening diagram.

## Components

- **Route strip (sticky top bar):**
  - Fourteen stop dots in their chapters' colours on a grey track.
  - An ink fill follows the scroll between stops.
  - Passed stops are filled; the current stop is enlarged and ringed.
  - It also shows "N of 14" and the chapter title.
- **Opening diagram:**
  - Each thread starts at its first year in the data and runs to a 2026 interchange.
  - The time axis is compressed before 2012, and the break is marked on the axis and stated in the caption.
- **Route index:** a two-column list of the chapters, with a full-width note at the split after stop 7.
- **Chapter opener:** a colour field with the chapter number, a meta line (years and thread), the title and the question. Chapter 14 adds a band of all ten line colours along its bottom edge.
- **Scene:**
  - A stage (SVG), with a provenance note below it carrying a tag such as "From the data" or "Illustrative values".
  - A numbered list of steps.
- **Keystone:** a 6px top rule in the milestone's line colour, then the date, title, original title, problem, idea and why it mattered, and an "Open the study card" link button.
- **Experiment plate:**
  - A square panel with a 1.5px ink border.
  - The plate number (chapter.position) is underlined in the chapter colour.
  - Checks use the panel colour and a lighter border.
- **Remember:** one sentence between two ink rules.
- **Also on this stretch:** station rows that show the year, line dots, name and one line of explanation.
- **Study card (dialog):**
  - It is a spec sheet: a heading in a colour field, the original title and the authors, then a 2×3 grid (date, kind, organisation, access, chapter, threads).
  - The sections below are: why it matters, what to learn, where it came from, and what it led to.
- **Whole map:** a horizontal strip of every station on desktop and a vertical strip on phones.
- **Lineage tracer:** a vertical ink line with station dots, drawn downward when you choose a model.

## Motion

GSAP 3.12.5 and ScrollTrigger load from cdnjs. Motion turns on only when both libraries are present and the reader has not asked for reduced motion. In that case the script adds `html.motion`.

- **Scenes:**
  - Each builder draws the finished picture first, then adds `.from()` tweens to a paused timeline. In that timeline, step k occupies time [k, k+1), and step 0 is the resting picture.
  - A ScrollTrigger scrubs the timeline (scrub 0.6) from the first step to the last.
  - On wider screens a step's change plays while its text rises from 70% of the viewport. On phones the change plays as the step card enters from the bottom; the card then slides under the pinned figure, so the diagram is never covered.
- **Figure pinning:** `position: sticky` (no pin spacers) keeps the figure fixed below the route strip: full height on desktop, and 52svh at the top of the screen below 960px.
- **Openers:** a scrubbed clip-path opens the colour field from a 3 to 7% inset to full bleed. The chapter number rises by 30% of its height.
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
- Scene text has a 3px halo in the paper colour (`paint-order: stroke`). Text on filled shapes carries the class `nh`, which removes the halo.

## States

| State | What the reader sees |
|---|---|
| First load | The opening diagram waits up to 450ms for the web fonts, then draws itself |
| Fonts fail | Fallback stacks; scenes measure the text that actually renders |
| No JavaScript | Hero, footer and a `noscript` line explaining that the chapters need JavaScript |
| No GSAP | Every scene still and finished, everything else working |
| Reduced motion | The same as no GSAP |
| Light and dark | Token sets; an explicit `data-theme` wins in both directions |
| Widths | 390px phone, 820px tablet and 1440px desktop checked; scenes rebuild when the width changes by more than 24px |
