---
title: "L4 Fluid Mechanics — conversion and correction report"
subtitle: "Changes made when converting the 2025/26 LaTeX materials to the course website"
date: "October 2026"
---

# How to read this report

- **Reflection items** are the changes you asked for in `reflection_last_year.txt`.
- **Errors fixed** lists every correction to the substance of your materials: what it said before, and what it says now. Items marked **(please check)** were ambiguous; we chose the most likely intended version.
- Pure spelling and grammar fixes are only counted, not listed.
- **New content** lists what was added that was not in the original material: learning outcomes, self-checks, "In practice" boxes, quick-question slides, hints and final answers, and interactive figures.
- Numbering refers to the **new** website numbering (e.g. §4.3, Problem 4.7). The original sheet and question numbers are given in brackets and are also recorded in a hidden `origin` comment in each problem's source.

# 1. Reflection items from last year

| Reflection | Where | What was done |
|:--|:--|:--|
| Workshops 1 & 2: unidirectional **or** fully developed, not both | Workshops 1, 2 | Only one assumption is listed in Step 1 (W1: "2D, unidirectional"; W2A: unidirectional; W2B: circular symmetry). The link between the two appears only where it arises naturally, in Step 3A (continuity gives ∂u/∂x = 0, i.e. fully developed; in W2B continuity gives u_r = 0). No design-discussion remarks are shown to students. |
| Ch3: energy cascade and −5/3 law | Notes §3.4 (new section); Ch3 Part 1 slides (3 new slides); revision deck | Richardson cascade (with verse), production ≈ dissipation, ε ~ u_l³/l, Kolmogorov's three hypotheses, the three spectral ranges, full dimensional derivation of E(κ) = C_K ε^{2/3} κ^{−5/3} (C_K ≈ 1.5), link to η and l/η ~ Re^{3/4}. New spectrum figure (Pope's model spectrum) and an interactive spectrum widget. §3.5 (length scales) re-worded so the two sections do not repeat each other. |
| Ch4: streamline the scaling analysis | Notes §4.1/§4.3; Ch4 Part 1 slides | The early "inertia ~ diffusion ⇒ δ small" estimate is removed from §4.1 (a short bridging paragraph points ahead). The order-of-magnitude analysis is done once, completely, in §4.3; δ/L ~ Re_L^{−1/2}, τ_w, drag and C_D scaling follow from it. |
| Ch4: one separation section, at the end | Notes §4.11; Ch4 Part 2 slides | Cylinder regimes, von Kármán street, adverse pressure gradient, separation criterion and point of inflection, aerofoils, plus Falkner–Skan profiles and the drag crisis, in one section at the end. Prandtl's equations (§4.3) now lead straight into Blasius (§4.4). Five separation slides moved from Part 1 to the end of Part 2. |
| Ch4: Blasius numerical table | Notes §4.4 (collapsible table + interactive plot); Ch4 Part 1 slides (table slide + widget slide) | Table recomputed to high precision (see errors below). |
| Ch4: remove Thwaites' method | Notes (old §4.11 incl. flat-plate demonstration); Ch4 Part 2 slides (4 slides); Workshop 4 Problem F; Sheet 3 Q13, Q14, Q15; Revision Q2 | All removed. Sheet 3 Q16 Part 2 and Q19(c) were checked: they use only the momentum integral equation, so they were kept. |

# 2. Errors fixed — Chapter 1

**Notes**

- §1.2: "Similarly for u and w" → "Similarly for v and w".
- §1.2: "Summing equations …" → "Combining … as the three components of a vector".
- §1.1 Reynolds-number box: "Re ≪ small / Re ≫ large" → "Re small (Re ≪ 1) / Re large (Re ≫ 1)".
- §1.3 and appendix: hard-coded equation numbers "(1.6)" and "(1J)" removed (numbering is automatic).
- §1.2.1 footnote: "streamlines and hence streamtubes cannot be defined in the case of unsteady flow" → in unsteady flow streamlines exist at each instant but change with time and no longer coincide with the paths of fluid elements, so the streamtube argument is for steady flow.
- Appendix, curvilinear coordinates: spherical polars were listed as (x1, x2, x3) = (r, φ, θ) with h3 = r sin θ, which is inconsistent. Now (r, θ, φ) with θ the polar angle and h = (1, r, r sin θ). **(please check your convention)**
- Figure 1.1 label "direction of Flow" → "direction of flow".
- The vorticity example (ξ = (3y − x²)k̂) and the shear-stress example (τ = 9 Pa) were only in the slides; they are now also in the notes.

**Slides:** "Coette flow" → "Couette flow".

**Problems (Sheet 1 questions used in Chapter 1)**

- Problem 1.2(d) (S1 Q2): the typed solution integrated the first profile u = V0(1 + 2x/L), giving t = (L/2V0) ln 3, but part (d) refers to the second profile u = V0(1 + x/L). Corrected to t = (L/V0) ln 2; the original result is kept as a comparison.
- Problem 1.3 (S1 Q3): the solution wrote p = 3x² − 4y² (question and working use 3x³). Corrected; answer 78 unchanged.
- Problem 1.4(a) (S1 Q8): derivative labels in the ξθ term corrected to ∂u_r/∂z and ∂u_z/∂r. Answer unchanged.
- Problem 1.4(c) (S1 Q8): u_θ = e^(−iθ) (complex) taken as a typo for e^(−θ); answer now ξz = 2e^(−θ)/r. **(please check)**
- Problem 1.5 (S1 Q16): edge positions recomputed (3.30, 4.95, 1.21, 1.82; original 3.29, 4.93); area shown to be exactly 1.
- S1 Q7 moved to Chapter 2 (its stress part needs the Chapter 2 constitutive relations).

# 3. Errors fixed — Chapter 2

**Notes**

1. Worked example 2.1: ∂/∂x(ax² − by²) → ∂/∂x[a(x² − y²)].
2. Shear stresses deform the element "in a plane normal to their line of action" → "in the plane containing their line of action and the normal to the face"; "considering the x-direction only" removed (the figure also shows τ_yx).
3. "Constant viscosity (if the shear stress is … proportional to shear rate)" and "Newtonian (μ = constant)" → "Newtonian fluid whose viscosity does not vary through the flow" / "Newtonian with constant μ" (Newtonian does not imply constant μ).
4. Energy-element figure: uE → uρE; y/z-face labels uτ_yx, uτ_zx → uτ_xy, uτ_xz (subscript convention of the notes); left-face uτ_xx arrow now points in −x; right-face arrow corrected; caption rewritten.
5. **Dissipation function (main fix):** the nine ∂(uτ…)/∂x terms in the total-energy equation were called "the viscous dissipation function Φ", and the same Φ was then used for a different term in the internal-energy equation. They are now W_τ (rate of work done by viscous stresses) in the total-energy equation, conservative form and summary, with a note explaining why W_τ is not Φ; Φ is used for dissipation only.
6. "is written in ." → "written in non-conservative form"; "ρ Du/dt" → "ρ Du/Dt"; non-conservative reference now also points to the continuity form.
7. Kinetic-energy equations: stress indices transposed relative to the stress convention (τ_yx ∂u/∂y etc.) → made consistent (same result, by symmetry).
8. Redundant sentence about the kinetic-energy and body-force terms dropping out removed.
9. Stress symmetry: angular "velocity" would become infinite → angular "acceleration".
10. Couette-with-heat-transfer example: ρ∂e/∂t + (q·∇)e → ρ[∂e/∂t + (q·∇)e]; "∂ρ/∂t = 0" → "∂e/∂t = 0"; final check −μ(U/h)²; "C_v constant" added to assumptions.
11. Closing the system: "5 equations in 5 unknowns" → with e(T) and p(ρ,T), 7 equations for 7 unknowns; for incompressible flow continuity + momentum alone give q and p.
12. "e = C_vT or C_pT" → e = C_vT (h = C_pT for an ideal gas; C_v ≈ C_p for a liquid).
13. Summary: wrong cross-reference for the general conservative y/z components corrected.
14. Appendix-style gradient wording ("maximum rate of change in the maximal direction") clarified; footnote "div A = 0 for incompressible flow" → holds for the velocity q only.
15. Outlet boundary condition: "q, p, T zero gradient" → ∂q/∂x = ∂T/∂x = 0 with p specified (p cannot have zero gradient in a pressure-driven channel). **(please check)**
16. Interface conditions: velocity continuity stated properly (normal part = kinematic condition, tangential part = no slip); μ dq/dy → μ du/dy; "(flat interface, no surface tension)" added before p₁ = p₂; thermal condition now T₁ = T₂ and k₁∂T₁/∂y = k₂∂T₂/∂y.
17. Free surface: "q_gas ≈ 0 ⇒ τ_gas ≈ 0" → μ_gas ≪ μ_liquid so the liquid-side shear stress ≈ 0; "k_interface ≪ 1" → k_gas ≪ k_liquid.
18. "derived later in this chapter" → "given below".
19. About 15 spelling/grammar fixes.

**Slides (Chapter 2)**

- Interface thermal condition k₁∂T/∂y = k₂∂T/∂y → T₁ = T₂ and k₁∂T₁/∂y = k₂∂T₂/∂y; dynamic condition written out; flat interface/no surface tension noted.
- Free surface: μ_L(∂u/∂y)_L ≈ 0 × (∂u/∂y)_G → μ_L(∂u/∂y)_L = μ_G(∂u/∂y)_G ⇒ (∂u/∂y)_L ≈ 0.
- Outlet: ∂φ/∂x = 0 applies to u, v, w (often T) but not p.
- "Stoke's relations / Stokes' Hypothesis" → "Stokes' relations (with Stokes' hypothesis λ = −2μ/3)".
- Speaker note: the 2/3 term "usually" vanishes for incompressible flow → always vanishes (∇·q = 0).
- "Φ always positive" → "never negative (Φ ≥ 0)".
- "Forces on the element" frame appeared twice → first shows body force and pressure, second the viscous stresses. Energy-term boxes now revealed in order I–IV (were I, III, II, IV).

**Problems (Sheet 1, now Problems 2.1–2.14, 2.16–2.19)**

- 2.2 (S1 Q5): stagnation points "(0,0) and (−1,0)" → only (−1,0) (velocity is infinite at the origin).
- 2.10 (S1 Q14): shear-stress line u_max(1−r²)/R² → u_max(1−r²/R²); answer added for "why does density not appear?"; "steady (fully developed)" separated into two ideas.
- 2.18 (S1 Q15): "by definition Dρ/Dt = 0" → derivation starts from the full energy equation keeping −p∇·q, which cancels, so the result also holds for compressible flow.
- 2.16 (S1 Q17): velocities add "because the convective terms are zero" → the centripetal term u_θ²/r is not zero; velocities superpose because the θ-equation is linear, but pressures do not.
- 2.17 (S1 Q18): "steady (i.e. fully developed)" corrected; zero pressure gradient justified from the free surface.
- 2.19 (S1 Q19): ∂²T/∂θ² = 0 "since 2D problem" → because the problem is axisymmetric.
- 2.14 (S1 Q23): sign error in the final u_a: "1 − (ρ_b/ρ_a)(h_b/h_a − 1)" → "1 + …" (verified with sympy).
- 2.12 (S1 Q20): original "solution not repeated here" → short full solution written.
- Supervised problem class, week II (now merged into 2.15; only its part (v) is kept): +∂p/∂x → −∂p/∂x in the momentum equation; circular continuity argument fixed; equation references and "db/dx" typo fixed; missing factor in the combined profile u_i/h → (u_i/h)(H + h + αy); power law written as K|du/dy|^{n−1} du/dy with K for the core fluid **(please check)**; interface velocity u_i = Gh(2H + h)/(2μ) found via shear-stress continuity (new part v) **(please check)**; problem statement reconstructed from the solution **(please check)**.
- Clarifications: 2.6/2.8 (S1 Q7, Q10) τ_xx values are viscous normal stresses (total = −p + τ); 2.9 (S1 Q13) why Bernoulli holds for this viscous flow; 2.11 (S1 Q21) pressure drop given per metre (808 Pa/m).

# 4. Errors fixed — Chapter 3

**Notes**

- Kolmogorov example: η = 0.01 × (10⁵)^{−3/4} = 1.8 × 10⁻⁶ m ≈ 2 µm (was 3.2 × 10⁻⁷ m).
- Time-averaged continuity: "\overline{∇·q} = ∇·(Q + q′)" → instantaneous ∇·q = ∇·(Q + q′) = 0.
- Averaged pressure term: stray ρ in front of ∂\overline{p′}/∂x removed.
- Exact k-equation, term ④ (pressure diffusion): [−u′∂\overline{p′}/∂x …] → −\overline{u′∂p′/∂x} − \overline{v′∂p′/∂y} (the mean of p′ is zero). Same fix in Sheet 2 Q6 and Ch3 Part 2 slides.
- ε-equation: "D_k is the modelled dissipation of ε given by −ρε" → D_k = +ρε (dissipation term of the k-equation; the sign was wrong).
- Appendix: k = ½(u′² + v′²) → includes \overline{w′²} (needed for the Boussinesq trace check); footnote explains the 2D simplification. **(please check)**
- Backward-facing step: "close to separation ∂U/∂y is very small" → "close to reattachment".
- Turbulence intensity "divided by their mean" (fluctuations have zero mean) → "divided by a reference mean velocity".
- Wind-tunnel turbulence intensity "around 1%" → "well below 1% (below 0.1% in low-turbulence tunnels)". **(please check)**
- DNS cost: "10¹⁸ operations at 46.6 Tflop/s → 24 days" is inconsistent (≈ 6 hours) → 10¹⁸ grid-point updates × ≈ 100 flop ≈ 10²⁰ flop ≈ 25 days. Same fix in the slides. **(please check)**
- LES based on "temporal and spatial filtering" → spatial filtering. **(please check)**
- "An unsteady flow will normally have a high Re" → spontaneous (not imposed) unsteadiness is associated with high Re. **(please check)**
- Sum of x-direction stresses printed as one expression → three components.
- ε = ν × "fluctuating vorticity" → ν × mean-square fluctuating vorticity.
- ε = k^{3/2}/l_s: note that the constant is absorbed into l_s.
- "self-sustaining regular fluctuations" → "irregular".
- Velocity-profile figure: turbulent peak 1.6 (laminar 2.0) did not give equal flow rates as stated → 1.14. Same fix in the slides.
- Clarifications: laminar sublayer = viscous sublayer; time-varying mean (ensemble average); term ⑤ = μ∇²k − ρε; LES filter properties; RNG; RSM overcomes "many" (not all) drawbacks; why u′v′ ≠ 0.
- Hard-coded equation numbers removed; ~15 spelling/grammar fixes.

**Slides (Ch3 Parts 1 and 2)**

- Convective term "u ∂u/∂x = ∂(u²)/∂x" → full conservative form with all three products, averaged, using mean continuity.
- RANS: mean-flow material derivative defined explicitly; decomposition includes w = W + w′; averaging interval t₀ to t₀ + T.
- Dissipation formula used instantaneous gradients and diagonal terms only → averaged fluctuating gradients including shear terms.
- Kolmogorov scales: intermediate results η, u_η, τ_η added; Re specified as Re_l.
- Car example "billions of cells" → ≈ 10^{13.5} cells (what Re^{9/4} gives).
- Reynolds stresses larger than viscous stresses "except very close to a wall"; fluctuations "≲ 10% (more in jets and wakes)".
- Exact k-equation pressure term fixed (as in the notes); term labels corrected.
- "We close it at the second-order level" → distinction between eddy-viscosity models and Reynolds-stress models. **(please check)**
- Mixing-length table: wake and jet widths → "half-width". **(please check)**
- v_t → v_s (k–ω slide); f_v → f_{v1}; "Boeing 1990s" → "early 1990s"; RSM label "Exact stresses" → "Modelled stress transport"; TikZ hierarchy figure fixed (did not compile).
- ~15 spelling fixes.

**Problems (Sheet 2, now Problems 3.1–3.7)**

- 3.3 (S2 Q2): r-momentum viscous term +u_r/r² → −u_r/r²; θ-momentum pressure term −∂p/∂θ → −(1/r)∂p/∂θ; averaged θ and z equations added; body-force terms dropped (question says none).
- 3.6 (S2 Q6): pressure-diffusion term corrected (as in the notes).
- 3.1 (S2 Q7): "U_A = 150 m/s" → u_l.
- Old references to PDF equation numbers ("Eq. 3.30") replaced by the equation or a link.

# 5. Errors fixed — Chapter 4

**Notes**

| Location | Original | Now |
|:--|:--|:--|
| §4.3 | "dimensional derivatives … do not exceed unity" | dimensionless |
| §4.3 C_D estimate | numerator A in A/(ρU²A)·√(…) | B√(ρμU³L)/(ρU²BL) |
| §4.3 | drag "equal to" B·L·τ | "of order" |
| §4.4 drag integral | s along the free stream with dx = cos φ ds | x along the surface, ds = cos φ dx **(please check)** |
| §4.4 Blasius table | Howarth's values | 56 last-digit corrections (≤ 2×10⁻⁵) to match a high-precision solution (f″(0) = 0.3320573) |
| §4.4 δ99 | f′ = 0.99 "at η ≈ 5.0", "exact thickness" | η ≈ 4.91, customarily rounded to 5.0 |
| §4.5 | "n the exact Blasius" | "In" |
| §4.5 linear profile | θ/x·Re^{1/2} = 0.578 | 0.577 (= 1/√3) |
| §4.6 | "the last term" | "the last two terms" |
| §4.7 | "do not confuse u_τ with μ_τ" | μ_t |
| §4.7 mixing-length step | (1/u_τ)∂U/∂y = √(ρ/τ)/(κy) | (1/u_τ)√(τ/ρ)/(κy) |
| §4.7 | "definition u_τ = τ" | u_τ = √(τ/ρ) |
| §4.7 defect law | constant C (clashes with log-law C) | B |
| §4.8 | H = 9/7 written as 1.28 and 1.29 | 1.29 throughout |
| §4.8 empirical H | 1.25 (empirical θ mixed with theoretical δ*) | ≈ 1.3–1.4 (measured) **(please check)** |
| §4.8 power-law analysis | missing equation τ = (0.079/2)ρ(0.8U∞)²(…)^{−1/4} | restored |

Also: cylinder regime (b) "non-symmetric" → separated at the rear with a steady recirculating vortex pair; regime (c) "fully turbulent wake at Re ≈ 10⁶" → BL laminar up to Re ≈ 2×10⁵, turbulent by 10⁶; log-law range "roughly" 30 < y⁺ < 500; ~10 spelling/grammar fixes.

**Slides (Ch4 Parts 1, 2 and revision)**

- Shape factor "turbulent H ≈ 1.4 (fuller and thus a higher momentum loss θ)" → "H ≈ 1.3–1.4 (fuller, so δ* and θ are closer together)".
- C_D = D/(ρU²A) → D/(½ρU²BL); "as Re → ∞, δ → 0" → δ/L → 0; D = B·L·τ → D ~ B·L·τ; dp̃/dỹ ≈ 0 → ∂p/∂y ≈ 0.
- Blasius δ: f′ = 0.99 at η ≈ 4.91 (rounded to 5.0); table values aligned with the corrected notes table.
- Defect-law constant C → B; H = 9/7 → 1.29; experimental H 1.25 → ≈ 1.3–1.4 **(please check)**; "Re ≈ 3–5×10⁵" → Re_x; drag method 2 "per unit width" added; cylinder (c) wording.
- Revision deck: turbulent BL equation u∂U/∂x + v∂U/∂y → U, V; "LHS = mass × acceleration" → acceleration (per unit mass); "Φ always positive" → Φ ≥ 0; μ_t = C_μ ρ l_s v_s → C ρ l_s v_s (C_μ is the k–ε constant) **(please check)**; "stream-wise normal stresses are ignored" → their gradients are neglected; "Stokes' Hypothesis" → "Stokes' relations".

**Problems (Sheet 3, now Problems 4.1–4.18; revision-class question, now Problem 2.15)**

- 4.2 (S3 Q1): "v ∝ ν" but the solution used v = ν (dimensionally inconsistent) → v = cν, with c = 1 m⁻¹ in (d) **(please check)**; missing + f(y) after integration added.
- 4.4 (S3 Q4): Re_L ≈ 1, outside boundary-layer theory → caveat that the answer is order-of-magnitude only **(please check whether 0.05 cm/s is the intended speed)**.
- 4.5 (S3 Q8): water θ 0.48 → 0.47 mm.
- 4.11 (S3 Q18): assumption labelled "small transverse gradients" was really slow axial development → relabelled; ∂P/∂r ≈ 0, U_r ≪ U_z and neglected axial stresses added.
- 4.13 (S3 Q6): condition n < 1 added (needed for θ(0) = 0).
- 4.14 (S3 Q19): solution mixed θ = 0.036xRe^{−1/5} with H = 1.25 → H = 9/7 throughout: δ* 2.446 → 2.52 mm; θ₃ 0.524 → 0.516 mm; δ*₃ 0.656 → 0.664 mm **(please check)**.
- 4.16 (S3 Q17): 36.6 → 36.8 N; C̄f 0.0028 → 0.00277 and 248 → 245 N; 264 → 265 N.
- 4.17 (S3 Q21): intermediate (x_cr − x₀)^{4/5} ≈ 0.0232 → 0.0895 (final x₀ = 0.1011 m was correct).
- 2.15 (Revision Q1): gravity "in the z-direction" → −y (hydrostatic only); carrier-layer viscosity μ → μ_c **(please check)**; sign convention for (du/dy)ⁿ noted.

# 6. Errors fixed — Workshops

- W1: "the LHS of your x-equation depends only on y" → the viscous term μ d²u/dy² depends only on y; ζ_z → ξ_z (Ch1 notation); "maximum at the walls" → "maximum (in magnitude)".
- W2B: "since the cylinders are long and the outer cylinder is stationary, there is angular symmetry" → "long and concentric, and the wall velocities do not vary with θ".
- W3 1C: "perfectly out of phase (π/2)" → "in quadrature (π/2)"; the π case added (correlation −2.25 m²/s²).
- W3 2A: Re_D = 6.4 × 10⁵ added (only Re_l was computed). W3 2B: "hydraulically rough" softened (ε⁺ ≈ 5, borderline smooth/transitional) and "this proves DNS is impossible" → "not a practical option" **(please check)**.
- W3B: "DNS … computationally impossible" → "prohibitively expensive"; "k–ω unstable in the freestream" → "sensitive to the freestream value of ω".
- W4A: V₀ ≤ 0 → V₀ < 0 (V₀ = 0 fails the far-field condition); ∂²u/∂x² removed from the "boundary-layer equations" (profile is an exact N–S solution); δ = 4.605ν/|V₀| added.
- W4B: C̄_f = 1.153 → 1.155 Re_L^{−1/2} (= √12/3).
- W4C: U_exit 2.175 → 2.174 m/s; Δp −0.4383 → −0.435 Pa; mean dp/dx −0.146 → −0.145 Pa/m; p_inlet ≈ 10⁵ Pa → 101 325 Pa.
- W4D: drag values re-rounded (181, 256, 69.6, 80.0 N).
- Problem-solving strategy page: "ν ≠ 0 = constant" → "ν ≠ 0, constant".
- ~10 spelling fixes.

# 7. Structural changes and removals

- **Problem sheets → one problem bank**, ordered by notes section; each problem links to the section to study first, and each notes section links to its problems. Numbering: Chapter 1 1.1–1.5; Chapter 2 2.1–2.19 (2.15 is the revision-class practice question, merged with the week II supervised-class problem); Chapter 3 3.1–3.7; Chapter 4 4.1–4.18.
- **Dropped problems (Thwaites):** Sheet 3 Q13, Q14, Q15; Revision Q2 (parts ii, iv–vi use Thwaites and iii depends on ii).
- **Supervised problem class (week II)** problem (same flow as the revision-class question) merged into Problem 2.15; it contributed part (v), the interface velocity from shear-stress continuity.
- **Ch3 Part 1 slides:** the colleague's alternative deck (`Ch3_part1_GrantIngram.tex`) was not converted as a deck; its useful content frames were borrowed (L2 lab pipe photos, flash vs long exposure; STS-135 length-scale slide; Reynolds 1883 apparatus image; Hinze attribution). Personal/administrative frames skipped.
- **Ch4 notes order:** 4.1 physical characteristics → 4.2 thicknesses → 4.3 BL equations (single scaling analysis) → 4.4 Blasius → 4.5 MIE → 4.6 turbulent BL → 4.7 law of the wall (split out) → 4.8 turbulent flat plate → 4.9 transition → 4.10 combined BL → 4.11 separation.
- **Ch2 notes:** cylindrical incompressible N–S equations restored from commented-out source.
- **Workshops:** each step shows the prompt with empty blanks, a "Your attempt" writing pad for a stylus or mouse (pen, eraser, undo, "+ More space", optional typing; sized to the length of the step and kept in the student's own browser) and a **Show solution** box; the first time a solution is opened students are asked "Have you written your own attempt?". There is no "reveal all" button. Each workshop also has a **printable handout (PDF)** generated from the same page, with the solutions removed and an empty box to write in under each step. The Colab link in Workshop 1 is replaced by an interactive Couette–Poiseuille widget (Colab kept as an optional extra).

# 8. New content (summary)

- **Every chapter:** learning outcomes; "Check your understanding" boxes; worked examples with "show solution" toggles; links between notes, slides, problems and workshops; PDF download of the notes.
- **Interactive figures (11):** Ch1 nozzle, vorticity explorer; Ch2 Couette flow with viscous heating; Ch3 Reynolds decomposition, energy spectrum; Ch4 Blasius vs approximate profiles, BL growth (laminar/turbulent/virtual origin), Falkner–Skan profiles; Workshop 1 Couette–Poiseuille.
- **"In practice" boxes** (wind-energy and engineering context): Ch1 hill speed-up, tip vortices; Ch2 conservative form in CFD, viscous heating in lubricating films; Ch3 −5/3 law in sonic-anemometer data and IEC turbulence models, turbulence intensity and turbine classes; Ch4 log law in the atmosphere, leading-edge erosion, stall and vortex generators.
- **New worked examples:** Ch3 (5: cascade in the atmospheric BL, Kolmogorov scales, T_I and k from probe data, MLM eddy viscosity, k–ε production vs dissipation); Ch4 (5: laminar plate, cubic profile, wall units, turbulent plate, combined plate); new Ch4 subsections on Falkner–Skan and the drag crisis.
- **Slides:** 2 peer-instruction "quick question" slides per deck; worked examples revealed step by step; speaker notes kept (revision deck: notes written new).
- **Problems:** hints and final answers for every problem (new), difficulty ratings (★, ★★, ★★★).
- **Image credits:** the sources of `Turbulence-motion.jpg`, `Strat_Turb.jpeg` and the energy-cascade images are unknown; captions are generic. Please add credits.

# 9. Exam formula sheet

The "Key equations" page was replaced by the exam formula sheet (General Formula Listing), reproduced verbatim (all 26 equation blocks checked against the LaTeX source by script) and also available as a PDF. Agreed corrections for 2026/27:

- Thwaites' theory section removed (no longer in the course).
- Law of the wall: von Kármán constant K → κ (as in the notes).
- Cartesian stresses: τ_yz = … = τ_yx → τ_zy.
- Coordinate brackets: vorticity components ζ = (ζ_x, ζ_y, ζ_z) and (ζ_r, ζ_θ, ζ_z) → ξ, consistent with the vorticity equations on the sheet and the notes.
- Power-law table: θ/x Re^{1/5} = 0.037 kept (consistent with C̄f = 0.074, the experimentally calibrated drag law); H = 1.25 → 1.29 (= 9/7 from the 1/7 profile; 1.25 came from dividing the theoretical δ* by the experimental θ).

Consequent changes so the course matches the sheet:

- Notes §4.8 key-result box now lists the formula-sheet values: δ/x = 0.3707, δ*/x = 0.0463, θ/x = 0.037, C_f = 0.0592, C̄f = 0.074 (all × Re^{−1/5}), H = 1.29. The power-law derivation itself still shows that the uncalibrated analysis gives 0.0360 and 0.0721, with a note explaining the difference.
- Worked example 4.4 recomputed with 0.037 and 0.074: θ = 5.31 mm (was 5.17), D = 2.55 N/m (was 2.48); Re_L^{−1/5} = 0.0478 (was 0.0479).
- Problem 4.14 (Sheet 3 Q19) now uses the formula-sheet values: (b) θ = 2.01 mm, δ* = 2.52 mm; (c) θ₃ = 0.531 mm, δ*₃ = 0.682 mm.

# 10. Reporting mistakes

The GitHub "Report an issue" links (which need a GitHub account) are replaced by a **⚑ Report a mistake** button on every page except the slides. A student highlights the text, clicks the button, and a Microsoft Form opens with *Where* (page, section or problem, and a link that jumps to the spot) and *Selected text* (formulas as LaTeX) already filled in; they only type what is wrong. An "or email" link sends the same report by email instead.

# 11. Problem bank and slide navigation (October 2026)

- **Final answers:** the self-check input boxes inside the "Final answer" toggles were removed (they looked like missing answers); every final answer now shows its values as text. Problem 1.2(b) now states a_x = 180 m s⁻² (entrance) and 540 m s⁻² (exit).
- **Difficulty labels:** "★ warm-up", "★★ core", "★★★ challenge" → "Difficulty: ★", "Difficulty: ★★", "Difficulty: ★★★" (no words that could discourage students).
- **Revision-class question:** no longer a separate "Exam-style practice" section. It covered the same flow as the week II supervised-class problem (then Problem 2.15), so the two were merged into one Problem 2.15 (Difficulty ★★★): the revision-class wording and parts (i)–(iv), plus part (v) from the supervised-class problem (interface velocity from continuity of shear stress, and why the carrier layer increases the flow rate). The paragraph about it being "much more complicated than the exam" and the "Exam practice" filter were removed. Problem numbers 2.16–2.19 are unchanged. The revision slides link to the problem bank by chapter (Ch. 1–4) instead of to the "exam-style practice problem".
- **Slides:** the ☰ menu in every deck has **Home** and **All slides** buttons.
- **Speaker view:** the "S: speaker view" line was removed from the Slides page and "Speaker View" from the ☰ menu's Tools panel (the S key still works for the lecturer). Speaker notes that read as internal remarks ("NEW slide", "the original slide said…", "new compared with last year's deck", "this replaces the old…") were reworded or removed; the teaching content of the notes is unchanged.
- **Speaker view layout:** the speaker view (S) shows only the current slide (left, larger) and the notes with the timer (right); the "upcoming slide" panel and the layout selector were removed.
- **What's new:** a "What's new" box at the top of the home page shows the 5 newest changes; the full list is under Resources → What's new. Both come from one file, `_whats-new.md` (add one line at the top per change; see README).
