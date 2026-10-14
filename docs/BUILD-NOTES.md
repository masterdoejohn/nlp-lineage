# How language models came to be: redesign (version 4)

These notes cover the redesign made with the impeccable skill. The page was rebuilt as a scroll-driven explainer in a technical print style. The research content is unchanged, and the study notes, tracer and 14 experiments keep their behaviour. DESIGN.md records the visual system and PRODUCT.md records the brief.

## 1. What changed from version 3

- **Look:** a new identity based on a transit print manual.
  - White paper and black type.
  - Ten validated, flat line colours.
  - Square corners and no shadows.
  - Archivo (heavy, condensed) for display and Atkinson Hyperlegible for text. The Newsreader serif is gone.
- **Opening:** a thread diagram drawn from the data. Each line starts in the year of its first milestone and meets the others at a 2026 interchange.
- **Navigation:** a sticky route strip with 14 stops, which fills as you scroll and names the current stop.
- **Chapters:** each chapter has the same structure.
  1. A full-width opener in its thread's colour.
  2. A pinned scene: a diagram scrubbed by 3 or 4 steps of text.
  3. The keystone milestones, the experiments, "Remember", video links, the other stations, and the hand-off to the next chapter.
- **Scenes:** 14 new diagrams. Their numbers come from the data or from exact arithmetic, or are labelled "Illustrative values". The step text was written from the chapter text and replaces the old body paragraphs.
- **Two experiments folded into scenes:**
  - "Why did removing recurrence matter?" is now steps 3 and 4 of the chapter 3 scene: 16 sequential steps against 1 parallel step over 256 pairs.
  - "What is inside a 2026 frontier model?" is now the chapter 14 scene plus a "Where each layer came from" accordion, which keeps its 32 milestone links.
  - The other 14 experiments and 3 checks are unchanged, apart from plate numbers (for example 3.1) and restyling.
- **Whole map:** on desktop it pins and travels sideways as you scroll down; on phones it is vertical.
- **Lineage tracer:** the line draws downward and the rows enter in sequence.
- **Study card:** now a spec sheet, with a heading in the line colour and a 2×3 grid of facts.

## 2. Responsive behaviour

- **Desktop (960px and wider):**
  - The steps take 5/12 of the width and the pinned figure 7/12.
  - Each step is 72svh tall, and the active step is at full strength while the others fade to 38%.
- **Below 960px:**
  - The figure pins at the top of the screen at 52svh.
  - Step cards scroll up from the bottom and pass under the figure, so they never cover the diagram.
- **Scene layout:** scenes stack their parts vertically unless the stage is wider than 1.6 times its height. Every scene is measured before it is shown, centred vertically and checked for overflow.
- **Reduced motion, or no GSAP:** nothing pins. Static figures are 7/8 aspect on desktop and min(118vw, 600px) tall on phones.

## 3. Testing report (what was actually run)

All tests ran in Playwright with headless Chromium. The page was wrapped in the same skeleton the artifact host adds. Google Fonts were blocked, so every render used the fallback fonts. GSAP 3.12.5 and ScrollTrigger were served from a local copy of the same version, because the sandbox cannot reach cdnjs.

| Check | Result |
|---|---|
| `test_interact.py`: every experiment's controls, scripted assertions at 390px with reduced motion and at 1440px with motion | 144/144 pass |
| `test_redesign.py`: structure, scrubbing, pinning, route strip, contrast, map ride, keyboard focus on the map, tracer, study card, resize, reduced motion, no GSAP, theme toggle, skip link | 102/102 pass |
| Scene overflow probe at 390, 820 and 1440px | No scene draws outside its stage |
| Scene contact sheets at every step (`scene_shots.py`), phone, tablet and desktop | Reviewed by eye; label collisions fixed |
| Page screenshots at 12 points (`page_shots.py`), desktop light and dark, phone light, phone with reduced motion | Reviewed by eye |
| Keyboard walk (`kb_walk.py`) | Skip link, then the route strip and route index in order, all with visible outlines |
| Horizontal overflow at 390, 820 and 1440px | None |
| Console errors | None, apart from the blocked font requests |

## 4. Known limitations

- **Fonts not seen:** Archivo and Atkinson Hyperlegible were never rendered here, so every screenshot used fallback fonts. Archivo's condensed widths will make headings narrower than in the screenshots. Scenes measure the text that actually renders and redraw when the fonts arrive.
- **Browsers:** only Chromium was tested. Safari's handling of `svh`, sticky positioning inside grid, and SVG `paint-order` was not tested.
- **Animation library:** the live page loads GSAP from cdnjs. If it fails to load, the page falls back to still scenes; that fallback was tested.
- **Scene numbers:** scenes simplify on purpose. For example, the scene 10 U-curve shows the reported shape, not measured values. Each scene's note says which kind of numbers it uses.
- **Phone screens:** scene text bottoms out at 12.5px (some labels in scene 8 go down to about 10px). This is legible, but small.

## 5. Source files

The files were reorganised into `src/`, `data/`, `tests/` and `dist/` for the handoff to Claude Code. `CLAUDE.md` at the project root lists every file, the build and test commands, and the rules the code follows.
