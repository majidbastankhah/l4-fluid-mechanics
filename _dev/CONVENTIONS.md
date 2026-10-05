# Conversion conventions (for everyone converting course material)

The site is a Quarto website in `/home/claude/site`. Chapter 1 is finished and is the **reference implementation**.
Read these first and copy their patterns exactly:

- Notes: `notes/ch1.qmd`
- Slides: `slides/ch1-lecture1.qmd`, `slides/ch1-lecture2.qmd`, `slides/_metadata.yml`
- Problems: `problems/_ch1.qmd` (included by `problems/index.qmd`; JS in `assets/problems.js`)
- Widgets: `assets/widgets/widgets.js` (pattern for interactive figures), CSS in `assets/site.css` and `assets/slides.scss`
- Figures: `figures/src/*.tex` (one `tikzpicture` each) + `bash figures/build.sh <name>` → `figures/build/<name>.svg/.pdf`

Original LaTeX sources (read-only): `/home/claude/src/`
- notes: `L4_Fluid_Mechanics___Course_Notes/Detailed_Notes/Ch{2,3,4}.tex` (+ `Figures/`)
- slides & workshops: `L4___Fluid_Mechanics___Lecture_Slides/`
- problems: `L4_Fluid_Mechanics___Problem_sheets/`

## The lecturer's reflections from last year (must be applied)

1. Workshops 1 and 2: say the flow is EITHER unidirectional OR fully developed — not both; one follows from the other (continuity). Explain that in one sentence the first time.
2. Chapter 3: add the energy cascade and the −5/3 law in the inertial subrange to the notes (and slides).
3. Chapter 4:
   - Streamline the scaling analysis: do NOT first argue "inertia ~ diffusion ⇒ δ small" and then later redo it fully. Do the order-of-magnitude analysis once, completely, in the BL-equations section (δ/L ~ Re_L^{-1/2} and the drag/C_f ~ Re^{-1/2} scaling come out of it).
   - Boundary-layer separation is currently split in two places (cylinder/von Kármán early on; pressure-gradient separation between Prandtl's equations and Blasius). Merge into ONE complete separation section placed at the END of the chapter. Prandtl BL equations → Blasius must follow each other directly.
   - Include the numerical Blasius table (η, f, f', f'') so students can see the solution (in notes: interactive plot + collapsible table; in slides: plot and/or table excerpt).
   - Remove Thwaites' method (old §4.11 "Laminar BL with a pressure gradient") from notes, slides, workshops AND problems.

## File ownership (only write the files you own)

| Owner | Files |
|:--|:--|
| notes-ch2 | `notes/ch2.qmd`, `figures/src/ch2-*.tex` (+build), `assets/widgets/ch2.js`, `resources/_keyeq-ch2.qmd` |
| notes-ch3 | `notes/ch3.qmd`, `figures/src/ch3-*.tex`, `assets/widgets/ch3.js`, `resources/_keyeq-ch3.qmd` |
| notes-ch4 | `notes/ch4.qmd`, `figures/src/ch4-*.tex`, `assets/widgets/ch4.js`, `resources/_keyeq-ch4.qmd` |
| slides-ch2 | `slides/ch2.qmd`, `figures/src/s2-*.tex` |
| slides-ch3 | `slides/ch3-part1.qmd`, `slides/ch3-part2.qmd`, `figures/src/s3-*.tex` |
| slides-ch4 | `slides/ch4-part1.qmd`, `slides/ch4-part2.qmd`, `slides/revision.qmd`, `figures/src/s4-*.tex`, `figures/src/srev-*.tex` |
| problems-ch2 | `problems/_ch2.qmd`, `figures/src/p2-*.tex` |
| problems-ch34 | `problems/_ch3.qmd`, `problems/_ch4.qmd`, `problems/_revision.qmd`, `figures/src/p3-*.tex`, `p4-*.tex`, `prev-*.tex` |
| workshops | `workshops/workshop1.qmd` … `workshop4.qmd`, `resources/solving-strategy.qmd`, `figures/src/ws*-*.tex`, `assets/widgets/workshops.js` |

Raster images (png/jpg): copy into `figures/img/` with a lowercase-hyphenated name; if a file with that name already exists, reuse it (someone else copied it). PDF "images" (e.g. `lampipe.pdf`) → convert with `pdftoppm -png -r 110 -singlefile` into `figures/img/`.
Do NOT edit `_quarto.yml`, `index.qmd`, `problems/index.qmd`, `assets/*.css/.scss`, `widgets.js`, or other people's files. If you need a change there, say so in your final report.

## Section anchors (fixed — everyone links to these)

Chapter 2 `notes/ch2.qmd` (front matter `number-offset: 2`, PDF header uses `2.`):
`sec-continuity`, `sec-continuity-special`, `sec-continuity-nonconservative`, `sec-momentum`, `sec-stresses` (stress components / Newtonian constitutive relations), `sec-ns-special` (N–S, Euler, incompressible N–S), `sec-momentum-conservative`, `sec-energy`, `sec-energy-internal` (energy eq. in terms of e, incl. the Couette-with-heat-transfer example), `sec-summary`, `sec-bcs`

Chapter 3 `notes/ch3.qmd` (`number-offset: 3`):
`sec-history`, `sec-what-is-turbulence`, `sec-characteristics`, `sec-energy-cascade` (NEW: Richardson cascade, Kolmogorov hypotheses, −5/3 law), `sec-length-scales` (Kolmogorov scales), `sec-reynolds-averaging`, `sec-averaging-rules`, `sec-turbulent-stresses`, `sec-rans` (time-averaged continuity & N–S, BCs), `sec-modelling` (DNS/LES/classical), `sec-rans-models` (desirable attributes), `sec-boussinesq`, `sec-mixing-length`, `sec-one-equation`, `sec-k-epsilon`, `sec-rsm`, `sec-other-models`, `sec-appendix`

Chapter 4 `notes/ch4.qmd` (`number-offset: 4`) — new order:
`sec-bl-physical`, `sec-bl-thickness` (δ, δ*, θ, H), `sec-bl-equations` (Prandtl equations + the single complete scaling analysis), `sec-blasius`, `sec-mie` (momentum integral eq. + implications + approximate profiles), `sec-turbulent-bl`, `sec-log-law` (wall units, viscous sublayer, log law, defect law), `sec-turbulent-flat-plate` (power-law analysis), `sec-transition`, `sec-combined-bl` (virtual origin), `sec-separation` (cylinder regimes, von Kármán street, pressure-gradient effect, separation criterion, aerofoils)

Chapter 1 anchors already exist: `sec-intro`, `sec-material-derivative`, `sec-convective-meaning`, `sec-vorticity`, `sec-shear-stress`, `sec-summary`, `sec-recipe`, `sec-appendix`, `sec-curvilinear`, `sec-div-curl`.

Workshops: `workshops/workshop1.qmd` … `workshop4.qmd` (page-level links are enough).
Problem bank chapter anchors: `problems/index.qmd#ch2`, `#ch3`, `#ch4`.

## Notes conventions (see notes/ch1.qmd)

- Front matter: copy Ch1's, change title/subtitle, `number-offset`, `output-file`, and the `\renewcommand{\the...}{N.\arabic...}` lines.
- `{{< include /_macros.qmd >}}` right after front matter. Macros available: `\vect{}`, `\uvec{}`, `\del`. If you need another macro, define it locally inside the same hidden-div pattern AND tell me (so I add it to `assets/macros.tex` for PDF). Prefer plain LaTeX instead.
- Start with an `::: {.outcomes}` block (learning outcomes, 3–5 bullets).
- Headings `##` = sections (auto-numbered N.1, N.2…), `###` = subsections. Use the fixed anchors above. Unnumbered appendix subsections: `{.unnumbered}`.
- Definitions / key results → `::: {.callout-tip icon=false}` + `## Definition: …` / `## Key result: …`.
- Worked examples → `::: {.callout-note icon=false}` + `## Worked example N.k: …`; solution wrapped in
  ```` ```{=html}\n<details class="solution"><summary>Show solution</summary>\n``` ```` … ```` ```{=html}\n</details>\n``` ```` (exactly as Ch1).
- 1–3 `::: {.callout-caution collapse="true" icon=false}` "Check your understanding" boxes per chapter section where helpful (short, with answers).
- Optional short `::: {.callout-note appearance="simple" icon=false}` "In practice" boxes linking to engineering / wind-energy context (accurate, modest claims, max ~3 per chapter).
- At the end of every `##` section put an EMPTY placeholder that I will fill automatically:
  ```
  ::: {.try-problems data-sec="sec-xxx"}
  :::
  ```
- Equations: `$$ … $$ {#eq-name}` for labelled ones, refer with `@eq-name`; use `aligned` (not `align`) inside `$$`. Figures `![Caption](../figures/build/chN-name.svg){#fig-name width=80%}`; tables with `{#tbl-name}`. Keep long equations from overflowing (split lines).
- Interactive widgets: wrap in `::: {.content-visible when-format="html"}` and add a PDF-only line "*An interactive version of this figure is available in the online notes.*" (see Ch1). Put `<script src="../assets/widgets/chN.js"></script>` inside a final html-only block.
- Keep the lecturer's prose. The lecturer has asked us to FIX typos and errors we find (not just flag them). Fix every typo/technical error you are confident about; where the intended version is ambiguous, pick the most likely intended one, fix it, and mark it as 'please check'. LIST EVERY non-trivial fix in your report with location, original wording and new wording (pure spelling/grammar fixes can be summarised in one line, e.g. '12 spelling fixes').

## Slides conventions (see slides/ch1-lecture*.qmd)

- Shared settings come from `slides/_metadata.yml`; per deck add in front matter
  `format: { revealjs: { footer: "L4 Fluid Mechanics · Chapter N" } }`.
- Put `{{< include /_macros.qmd >}}` INSIDE the first slide (right after its `##` heading), never before it (it would create a blank slide).
- Beamer `\note{}` → `::: {.notes}` (keep the lecturer's text). Title-slide notes → prefix "OPENING:" in the first slide's notes.
- `\pause`/`\only`/`\onslide` → `::: {.fragment}` / `.incremental`. Worked examples: steps as fragments, final result in `::: {.fragment .answer-box}`.
- Notes links: `[[📖 Notes §N.k](../notes/chN.qmd#sec-xxx)]{.notes-link}` near the top of the relevant slide.
- Add 1–2 "Quick question" peer-instruction slides per deck (`## Quick question {.poll}`, A–D list, answer in a fragment, notes say how to run it).
- Embed the chapter's interactive widget(s) where useful: `<div class="widget" data-widget="NAME"></div>` and at the end of the deck `<script src="../assets/widgets/chN.js"></script>` (widget names are listed below).
- Two-column layouts: `:::: {.columns}` / `::: {.column width="50%"}`. Images: give explicit `height="…px"` (auto-stretch is off) so nothing overflows a 1200×750 slide.
- Last slide: summary + "Before next lecture" pointing to `../problems/index.qmd#chN`.

## Problem-bank conventions (see problems/_ch1.qmd)

- File starts with `## Chapter N · Title {#chN}`; group problems under `### Topic {#topic-xxx .unnumbered}` headings in the order the topics appear in the notes.
- Each problem:
  ```
  ::: {.problem #pN-k data-sec="chN:sec-xxx" data-ch="N" data-d="1|2|3"}
  ### Problem N.k · Short descriptive title {.unnumbered}

  [[Difficulty: ★]{.tag .diff} Study first: [§N.x Title](../notes/chN.qmd#sec-xxx)]{.meta}
  statement…
  <details class="hint"><summary>Hint</summary> … </details>
  <details class="answer"><summary>Final answer</summary> … </details>
  <details class="full"><summary>Full solution</summary> … </details>
  <label class="done"><input type="checkbox"> done</label>
  :::
  ```
  (blank lines inside each `<details>` so the markdown/math renders). Difficulty tags: `Difficulty: ★`, `Difficulty: ★★`, `Difficulty: ★★★` (no words such as "warm-up"; they can discourage students). `data-sec` = the ONE main notes section (format `chN:sec-xxx`); you may link more sections in the meta line.
- Hints and final answers are NEW content you write: short, accurate, no full working in hints.
- Numerical final answers: write the values as text in the Final answer toggle (no self-check input boxes — they looked like missing answers).
- Keep the original solution content; verify the maths (recompute numbers with python). FIX every error you find (the lecturer asked for this) and LIST each one (location, original vs corrected). If the intended version is ambiguous, choose the most likely one, fix it, add an HTML comment `<!-- REVIEW (MB): … -->`, and mark it 'please check' in your list.
- In an HTML comment right under the heading record the origin, e.g. `<!-- origin: Sheet 3 Q7 -->`.

## Widgets

Write plain JS following `assets/widgets/widgets.js` (IIFE, `makeCanvas`, fixed internal width 800, `animate()` with IntersectionObserver, CSS classes `.widget`, `.wtitle`, `.wctrl` (NOT `.controls` — clashes with reveal.js), `.readout`, `.wbtn`). Each file self-initialises `div.widget[data-widget="…"]` for ITS names only, guarded with `dataset.ready`. Accurate physics only (state any modelling simplification in the readout). Planned names:
- ch2.js: `couette-heat` (Couette flow with viscous heating: temperature profile vs Brinkman number / parameters of the notes example)
- ch3.js: `reynolds-decomp` (synthetic turbulent signal u(t)=U+u'; show mean, fluctuation, running average, u'² / turbulence intensity, averaging-window effect) and `spectrum` (model energy spectrum E(k) on log–log axes with energy-containing range, inertial subrange −5/3 and dissipation range; slider for Re showing L/η ~ Re^{3/4})
- ch4.js: `blasius` (solve Blasius f'''+½ff''=0 numerically in JS, plot u/U vs η, compare with approximate profiles: parabolic, cubic, sine; show δ*, θ, H for each), `bl-growth` (δ(x) for laminar 5x/√Re_x and turbulent 0.37x/Re_x^{1/5}, transition Re slider, virtual-origin combined BL), `falkner-skan` (similarity profiles vs pressure-gradient parameter β, showing inflection and separation at β ≈ −0.1988)
- workshops.js: `couette-poiseuille` (u(y) for plane Couette+Poiseuille superposition: sliders U, dp/dx, h, μ; show profile, wall shear stresses, flow rate, reversed-flow condition) — replaces the old Colab link.

## Testing your work (do NOT render inside /home/claude/site — several people work in parallel)

```
mkdir -p /tmp/$ME && rsync -a --delete --exclude _site --exclude .quarto --exclude .git /home/claude/site/ /tmp/$ME/site/
cd /tmp/$ME/site && quarto render <your .qmd files>          # e.g. quarto render notes/ch2.qmd
python3 /home/claude/site/_dev/screenshot.py /tmp/$ME/site/_site /tmp/$ME/shots notes/ch2.html slides/ch2.html#3
```
(`$ME` = your owner name, e.g. notes-ch2.) Check: no render errors, no LaTeX errors in the PDF (notes), equations render, figures visible and not overflowing, slides fit 1200×750, widgets draw and do not throw (`PAGE ERRORS: []`). Look at the screenshots with the Read tool (crop large ones with PIL first). Rendering a notes page also builds its PDF (pdflatex/xelatex is installed).

## Final report (your last message)

1. Files created.  2. Figures/images added.  3. Content changes vs the original (reflection items applied; anything removed/reordered).  4. Suspected errors in the original + what you did.  5. New content added (outcomes, self-checks, In-practice boxes, quick questions, hints…).  6. For problem owners: a table `problem id | origin | data-sec | difficulty`.  7. Anything you need me to change in shared files.  Keep it compact.
