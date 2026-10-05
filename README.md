# L4 Fluid Mechanics — course website

Source for the course website of ENGI44710 / ENGI47215 Fluid Mechanics (Durham University), built with [Quarto](https://quarto.org).
Every push to `main` re-builds the site and publishes it to GitHub Pages automatically (see `.github/workflows/publish.yml`).

## Layout

| Path | What it is |
|:--|:--|
| `index.qmd` | Home page (with the "What's new" box) |
| `_whats-new.md`, `whats-new.qmd` | Change log for students: edit `_whats-new.md` only |
| `notes/ch1.qmd` … | One page per chapter (HTML + downloadable PDF) |
| `slides/ch1-lecture1.qmd` … | One reveal.js deck per lecture (`slides/_metadata.yml` holds shared settings) |
| `slides.qmd` | List of slide decks |
| `problems/index.qmd` | The single problem bank; includes `problems/_ch1.qmd` … `_ch4.qmd` |
| `workshops/workshop1.qmd` … | Workshop pages: blanks `[answer]{.gap}` and `<details class="answer">` solution boxes. `assets/workshop.lua` turns them into "try first, then Show solution" pages and builds a printable handout PDF without solutions (`workshops/_metadata.yml`) |
| `resources/formula-sheet.qmd` | The exam formula sheet (General Formula Listing), copied verbatim; also built as a PDF |
| `resources/solving-strategy.qmd` | Problem-solving strategy for flow problems |
| `assets/widgets/ch2.js`, `ch3.js`, `ch4.js`, `workshops.js` | Chapter-specific interactive figures |
| `assets/report.html` | "⚑ Report a mistake" button: highlight text on any page → pre-filled Microsoft Form (form link and question ids at the top of the file); email fallback |
| `_dev/` | Not published: conventions (`CONVENTIONS.md`), change report, helper scripts |
| `figures/src/*.tex` | TikZ source for every figure (one `tikzpicture` per file) |
| `figures/build/` | Generated `.svg` (web) and `.pdf` (PDF notes) — commit these |
| `assets/widgets/widgets.js` | Interactive figures (nozzle, vorticity explorer) |
| `_macros.qmd`, `assets/macros.tex` | Shared LaTeX macros (`\vect`, `\uvec`, `\del`) for web and PDF |

## Telling students what changed

Add one line at the **top** of `_whats-new.md` whenever you change something students should know about (corrections, new material, renumbering; not typo fixes):

```
- **6 Oct 2026** · Chapter 2 notes: corrected the sign in [eq. (2.14)](notes/ch2.qmd#eq-xxx).
```

Write links relative to the site root (`notes/ch2.qmd`, `problems/index.qmd#p2-15`). The home page shows the 5 newest entries in its "What's new" box; `whats-new.qmd` (Resources → What's new) shows the full list. For important changes, also post an announcement on Blackboard Ultra.

## Everyday editing

```bash
quarto preview            # live preview in your browser while you edit
quarto render             # full build into _site/
bash figures/build.sh     # rebuild all TikZ figures (or: bash figures/build.sh ch1-couette)
python3 _dev/crosslink.py # after adding/moving problems: refresh the "Try these problems" strips in the notes
                          # and the §-numbers in "Study first" links (run after a render, then render again)
```

Writing conventions used in the notes:

- Definitions / key results: `::: {.callout-tip icon=false}` with a `## Definition: …` title (green box).
- Worked examples: `::: {.callout-note icon=false}` with the solution inside a `<details class="solution">` toggle.
- Self-checks: `::: {.callout-caution collapse="true" icon=false}` titled *Check your understanding*.
- End of each `##` section: an empty `::: {.try-problems data-sec="sec-…"}` placeholder; `_dev/crosslink.py` fills it from the problems' `data-sec` attributes.
- Section / equation / figure labels: `{#sec-…}`, `{#eq-…}`, `{#fig-…}`; refer with `@eq-…`, `@fig-…`.
- New chapter: copy the front matter of `notes/ch1.qmd` and change `number-offset` and the `1.` in the PDF header lines to the chapter number.

## Problem bank conventions

Each problem is a `::: {.problem #pC-N data-sec="chC:sec-…" data-ch="C" data-d="D"}` block (C = chapter, D = difficulty 1–3) containing the statement and three toggles: `details.hint`, `details.answer`, `details.full`. Write the final numbers in the answer toggle as text (no input boxes).
