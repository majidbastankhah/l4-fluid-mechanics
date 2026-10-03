# L4 Fluid Mechanics — course website

Source for the course website of ENGI44710 / ENGI47215 Fluid Mechanics (Durham University), built with [Quarto](https://quarto.org).
Every push to `main` re-builds the site and publishes it to GitHub Pages automatically (see `.github/workflows/publish.yml`).

## Layout

| Path | What it is |
|:--|:--|
| `index.qmd` | Home page and course roadmap |
| `notes/ch1.qmd` … | One page per chapter (HTML + downloadable PDF) |
| `slides/ch1-lecture1.qmd` … | One reveal.js deck per lecture (`slides/_metadata.yml` holds shared settings) |
| `slides.qmd` | List of slide decks |
| `problems/index.qmd` | The single problem bank, ordered by notes section |
| `workshops/index.qmd` | Workshop handouts |
| `resources/key-equations.qmd` | Growing equation sheet |
| `figures/src/*.tex` | TikZ source for every figure (one `tikzpicture` per file) |
| `figures/build/` | Generated `.svg` (web) and `.pdf` (PDF notes) — commit these |
| `assets/widgets/widgets.js` | Interactive figures (nozzle, vorticity explorer) |
| `_macros.qmd`, `assets/macros.tex` | Shared LaTeX macros (`\vect`, `\uvec`, `\del`) for web and PDF |

## Everyday editing

```bash
quarto preview            # live preview in your browser while you edit
quarto render             # full build into _site/
bash figures/build.sh     # rebuild all TikZ figures (or: bash figures/build.sh ch1-couette)
```

Writing conventions used in the notes:

- Definitions / key results: `::: {.callout-tip icon=false}` with a `## Definition: …` title (green box).
- Worked examples: `::: {.callout-note icon=false}` with the solution inside a `<details class="solution">` toggle.
- Self-checks: `::: {.callout-caution collapse="true" icon=false}` titled *Check your understanding*.
- End of each section: `::: {.try-problems}` linking to the problem bank (`../problems/index.qmd#p1-1`).
- Section / equation / figure labels: `{#sec-…}`, `{#eq-…}`, `{#fig-…}`; refer with `@eq-…`, `@fig-…`.
- New chapter: copy the front matter of `notes/ch1.qmd` and change `number-offset` and the `1.` in the PDF header lines to the chapter number.

## Problem bank conventions

Each problem is a `::: {.problem #pC-N data-ch="C" data-d="D"}` block (C = chapter, D = difficulty 1–3) containing the statement and three toggles: `details.hint`, `details.answer`, `details.full`. Numeric answers can be made self-checking with
`<span class="checker" data-answer="180" data-tol="0.01">… <input> <span class="fb"></span></span>`.
