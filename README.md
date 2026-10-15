# NLP Lineage

A public reference on how natural language processing led to modern language models. It covers the milestones, the papers behind them, and what to learn first. Every milestone and every relationship between milestones has a primary source.

The site is a preview and is not yet public. [docs/PLAN.md](docs/PLAN.md) describes the plan and its phases.

## What is in this repository

| Path | What it is |
|---|---|
| `data/` | The research data: one file per milestone, thread, chapter and glossary term. [docs/DATA.md](docs/DATA.md) describes it. |
| `site/` | The reference site (Astro): milestone, thread and glossary pages, a timeline, filters, a learning path, an about page, and "before and after" for every milestone. It builds to `build/`, and Pagefind then adds a search index. |
| `src/`, `build.py` | The guided tour, "How language models came to be": one HTML page with scroll-driven diagrams. It builds to `dist/llm-lineage.html`. |
| `src/tokens.css` | The design tokens (colours, type, spacing), shared by the site and the tour. [docs/DESIGN.md](docs/DESIGN.md) describes the design. |
| `check_data.py` | Checks the data against the rules a script can check. |
| `tests/` | Browser checks for the tour and the site (Playwright). |

## Commands

You need Python 3.9 or later, Node 22.12 or later, and Playwright's Chromium.

```
pip install -r requirements.txt
python -m playwright install chromium
npm ci

python check_data.py          # check the data
python build.py               # build the guided tour -> dist/llm-lineage.html
npm run site:build            # build the reference site -> build/
npm run site:dev              # work on the site with live reload

python tests/test_interact.py # the tour's experiments
python tests/test_redesign.py # the tour's structure, motion, contrast and fallbacks
python tests/test_site.py     # the site's pages, links, evidence rules, contrast and layout
```

Add `--webkit` to any of the three test commands to run it in WebKit, the engine behind Safari (install it once with `python -m playwright install webkit`). CI runs both engines. [docs/LAUNCH.md](docs/LAUNCH.md) lists what still needs a check by hand on a real phone.

Every pull request runs all of these (see `.github/workflows/checks.yml`), and `main` accepts a merge only when they pass.

## Rules the content follows

- **Plain language:** the writing follows ASD-STE100 principles: short sentences, one idea per sentence, and technical terms defined at first use. It does not claim to comply with the standard.
- **No em dashes.**
- **Honest evidence:** no relationship without a source. Weak links (indirect, timing only, later interpretation) are always marked as weak. Every number says what kind of number it is.

## Licences

- **Text and data** (everything in `data/`, and the site and tour text that comes from it): [CC BY 4.0](LICENSE-CONTENT.md). Credit: "NLP Lineage, by Zeeshan Arif, CC BY 4.0".
- **Code** (the site, the tour, the scripts and the tests): [MIT](LICENSE).
