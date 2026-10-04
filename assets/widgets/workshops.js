/* Workshop pages: page tools + interactive widget(s).
 * Usage (at the end of a workshop page):
 *   <script src="../assets/widgets/workshops.js"></script>
 *
 * 1) Page tools (run on every page that loads this file)
 *    - <details class="answer"> blocks: "Show step" toggles placed after each prompt.
 *    - [answer]{.gap} spans: inline gaps of the handout. They are shown as a highlighted
 *      "?" chip; clicking the chip reveals (or hides again) the answer.
 *    - <button class="reveal-all">: opens / closes every step and gap on the page.
 *    The few CSS rules these need are injected below (they can be moved to assets/site.css).
 *
 * 2) Widget  <div class="widget" data-widget="couette-poiseuille"></div>
 *    Plane Couette + Poiseuille flow between plates at y = -h (fixed) and y = +h (moving with U):
 *      u(y) = U/2 (1 + y/h)  -  (dp/dx) h^2/(2 mu) (1 - y^2/h^2)          (Workshop 1)
 *    Plain JavaScript, no libraries; same conventions as widgets.js.
 */
(function () {
  'use strict';

  // =====================================================================
  // PAGE TOOLS
  // =====================================================================
  const CSS = [
    '.ws-tools{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;margin:.3rem 0 1.2rem;font-size:.92rem}',
    '.ws-tools .reveal-all{border:1px solid rgba(104,36,109,.55);background:transparent;color:inherit;border-radius:6px;padding:.15rem .75rem;font-weight:600}',
    '.ws-tools .reveal-all.on{background:var(--bs-primary);border-color:var(--bs-primary);color:#fff}',
    'details.answer{margin:.5rem 0 1.1rem;border-left:3px solid #2b6cb0;border-radius:0 6px 6px 0;padding:.15rem .9rem}',
    'details.answer>summary{cursor:pointer;font-weight:600;color:#2b6cb0}',
    'details.answer[open]{background:rgba(43,108,176,.06);padding-bottom:.5rem}',
    'details.answer[open]>summary{margin-bottom:.4rem}',
    '.quarto-dark details.answer>summary{color:#8fbcef}',
    '.quarto-dark details.answer[open]{background:rgba(143,188,239,.07)}',
    '.gap{white-space:normal}',
    '.gap .gap-q{display:inline-block;min-width:2.6em;border:0;border-bottom:2px solid #2b6cb0;background:rgba(43,108,176,.13);color:#2b6cb0;font-weight:700;border-radius:3px;padding:0 .35em;margin:0 .1em;line-height:1.35;cursor:pointer;font-size:.9em}',
    '.gap.ready .gap-a{display:none}',
    '.gap.ready.shown .gap-a{display:inline;color:#1f5596;border-bottom:1px dotted #2b6cb0;cursor:pointer}',
    '.gap.shown .gap-q{display:none}',
    '.quarto-dark .gap .gap-q{color:#8fbcef;border-color:#8fbcef;background:rgba(143,188,239,.15)}',
    '.quarto-dark .gap.ready.shown .gap-a{color:#a9cdf3;border-color:#8fbcef}',
    '.ws-part{border-top:2px solid rgba(104,36,109,.35);margin-top:2.2rem;padding-top:.4rem}',
    /* keep long equations and tables inside the column on narrow screens (scroll instead of overflow) */
    'main mjx-container[display="true"]{overflow-x:auto;overflow-y:hidden;max-width:100%;min-width:0 !important;padding-bottom:2px}',
    'main table{display:block;max-width:100%;overflow-x:auto}'
  ].join('\n');

  function pageTools() {
    if (document.getElementById('ws-tools-css')) return;
    const st = document.createElement('style');
    st.id = 'ws-tools-css'; st.textContent = CSS;
    document.head.appendChild(st);

    // inline gaps
    document.querySelectorAll('span.gap').forEach(g => {
      if (g.classList.contains('ready')) return;
      const a = document.createElement('span'); a.className = 'gap-a';
      while (g.firstChild) a.appendChild(g.firstChild);
      const q = document.createElement('button');
      q.type = 'button'; q.className = 'gap-q'; q.textContent = '?';
      q.title = 'Show / hide the answer'; q.setAttribute('aria-expanded', 'false');
      q.addEventListener('click', () => setGap(g, !g.classList.contains('shown')));
      a.title = 'Click to hide the answer again';
      a.addEventListener('click', () => setGap(g, false));
      g.appendChild(q); g.appendChild(a); g.classList.add('ready');
    });

    // reveal-all buttons
    const btns = Array.from(document.querySelectorAll('button.reveal-all'));
    btns.forEach(b => b.addEventListener('click', () => {
      const open = !b.classList.contains('on');
      document.querySelectorAll('details.answer').forEach(d => { d.open = open; });
      document.querySelectorAll('span.gap.ready').forEach(g => setGap(g, open));
      btns.forEach(x => {
        x.classList.toggle('on', open);
        x.textContent = open ? 'Hide all answers' : 'Reveal all answers';
      });
    }));
  }
  function setGap(g, show) {
    g.classList.toggle('shown', show);
    const q = g.querySelector('.gap-q');
    if (q) q.setAttribute('aria-expanded', show ? 'true' : 'false');
  }

  // =====================================================================
  // WIDGET helpers (same pattern as widgets.js)
  // =====================================================================
  const W = 800;
  function makeCanvas(parent, h) {
    const c = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = h * dpr;
    c.style.aspectRatio = W + ' / ' + h;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    parent.appendChild(c);
    return ctx;
  }
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  // number formatting with a sensible number of significant figures
  function fmt(x, sig) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 1e-3 || a >= 1e5) return x.toExponential((sig || 3) - 1).replace('e', '×10^').replace(/\^\+?(-?\d+)/, '<sup>$1</sup>');
    return parseFloat(x.toPrecision(sig || 3)).toString();
  }
  function arrow(ctx, x0, y0, x1, y1, head) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (L < 0.5) return;
    const ux = dx / L, uy = dy / L, h = Math.min(head || 6, L * 0.5);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - h * ux + 0.5 * h * uy, y1 - h * uy - 0.5 * h * ux);
    ctx.lineTo(x1 - h * ux - 0.5 * h * uy, y1 - h * uy + 0.5 * h * ux);
    ctx.closePath(); ctx.fill();
  }
  function niceMax(v) { // round up to 1, 2, 2.5, 5 x 10^n
    if (!(v > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  const COL = { ink: '#222', grid: '#c9c9d4', purple: '#68246D', red: '#c0392b', blue: '#2b6cb0', green: '#2f855a', orange: '#d97706' };

  // =====================================================================
  // COUETTE + POISEUILLE (plates at y = -h fixed, y = +h moving with U)
  //   u(y)      = U/2 (1 + y/h) + (G/(2 mu)) (y^2 - h^2),   G = dp/dx
  //   tau_xy(y) = mu du/dy = mu U/(2h) + G y
  //   Q (per unit width) = U h - 2 G h^3/(3 mu)
  //   reversed flow next to the fixed wall (U > 0) when  G > mu U/(2 h^2)   (P < -1,
  //   with P = -(2h)^2 G/(2 mu U) the usual pressure-gradient parameter based on the gap 2h)
  // =====================================================================
  function cpModel(U, G, h, mu) {
    const uC = y => 0.5 * U * (1 + y / h);
    const uP = y => G / (2 * mu) * (y * y - h * h);
    const u = y => uC(y) + uP(y);
    const tau = y => mu * U / (2 * h) + G * y;
    const Q = U * h - 2 * G * h * h * h / (3 * mu);
    // extremum of u (du/dy = 0) at y* = -mu U/(2 h G), if inside the gap
    let ys = null;
    if (G !== 0) { const y0 = -mu * U / (2 * h * G); if (y0 > -h && y0 < h) ys = y0; }
    let umin = Math.min(u(-h), u(h)), umax = Math.max(u(-h), u(h));
    if (ys !== null) { umin = Math.min(umin, u(ys)); umax = Math.max(umax, u(ys)); }
    return { uC, uP, u, tau, Q, ys, umin, umax, uavg: Q / (2 * h) };
  }

  function couettePoiseuille(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'Couette + Poiseuille flow: superposition of a moving wall and a pressure gradient'));
    const ctrl = el('div', { class: 'wctrl' });
    ctrl.innerHTML =
      '<label>U (m/s) <input type="range" min="-1" max="1" step="0.05" value="0.5" data-k="U"><span data-o="U"></span></label>' +
      '<label>dp/dx (Pa/m) <input type="range" min="-5000" max="5000" step="100" value="-2000" data-k="G"><span data-o="G"></span></label>' +
      '<label>h (mm) <input type="range" min="1" max="10" step="0.5" value="5" data-k="h"><span data-o="h"></span></label>' +
      '<label>μ (Pa s) <input type="range" min="-3" max="0" step="0.05" value="-1" data-k="lmu"><span data-o="lmu"></span></label>' +
      '<label><input type="checkbox" data-k="parts" checked> show the two parts</label>' +
      '<span>Presets: <button class="wbtn" data-p="couette">Couette</button> <button class="wbtn" data-p="poiseuille">Poiseuille</button> <button class="wbtn" data-p="reverse">reversed flow</button></span>';
    root.appendChild(ctrl);
    const H = 380, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);

    const s = { U: 0.5, G: -2000, h: 5, lmu: -1, parts: true };
    const q = k => ctrl.querySelector('[data-k="' + k + '"]');
    const mu = () => Math.pow(10, s.lmu);
    function syncLabels() {
      ctrl.querySelector('[data-o="U"]').textContent = s.U.toFixed(2);
      ctrl.querySelector('[data-o="G"]').textContent = s.G.toFixed(0);
      ctrl.querySelector('[data-o="h"]').textContent = s.h.toFixed(1);
      ctrl.querySelector('[data-o="lmu"]').textContent = fmt(mu(), 2);
    }
    ['U', 'G', 'h', 'lmu'].forEach(k => q(k).addEventListener('input', e => { s[k] = parseFloat(e.target.value); syncLabels(); draw(); }));
    q('parts').addEventListener('change', e => { s.parts = e.target.checked; draw(); });
    const presets = {
      couette: { U: 0.5, G: 0, h: 5, lmu: -1 },
      poiseuille: { U: 0, G: -2000, h: 5, lmu: -1 },
      reverse: { U: 0.5, G: 2500, h: 5, lmu: -1 }
    };
    ctrl.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      Object.assign(s, presets[b.dataset.p]);
      ['U', 'G', 'h', 'lmu'].forEach(k => { q(k).value = s[k]; });
      syncLabels(); draw();
    }));

    // layout (internal pixels)
    const yTop = 45, yBot = 320;                 // plate positions on canvas
    const L = { x0: 40, x1: 520 };               // velocity panel
    const R = { x0: 585, x1: 780 };              // shear-stress panel

    function draw() {
      const h = s.h * 1e-3, m = cpModel(s.U, s.G, h, mu());
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const Y = y => yBot - (y + h) / (2 * h) * (yBot - yTop);   // physical y -> canvas

      // ---- velocity scale ----
      let lo = Math.min(0, m.umin), hi = Math.max(0, m.umax);
      if (s.parts) {
        lo = Math.min(lo, m.uC(-h), m.uC(h), m.uP(0)); hi = Math.max(hi, m.uC(-h), m.uC(h), m.uP(0));
      }
      const span = niceMax(Math.max(hi - lo, 1e-9) * 1.08);
      // place u = 0 so that the whole data range [lo, hi] is centred in the panel
      const avail = L.x1 - L.x0 - 60, scale = avail / span;    // px per (m/s)
      const zx = L.x0 + 30 + 0.5 * (avail - (hi - lo) * scale) - lo * scale;
      const X = u => zx + u * scale;

      // plates
      ctx.lineWidth = 3; ctx.strokeStyle = COL.ink;
      ctx.beginPath(); ctx.moveTo(L.x0, yTop); ctx.lineTo(L.x1, yTop); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L.x0, yBot); ctx.lineTo(L.x1, yBot); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = '#777';
      for (let x = L.x0; x < L.x1; x += 12) { // hatching on the fixed bottom wall
        ctx.beginPath(); ctx.moveTo(x, yBot + 12); ctx.lineTo(x + 12, yBot); ctx.stroke();
      }
      ctx.fillStyle = '#444'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('y = +h  (' + (Math.abs(s.U) > 1e-9 ? 'moving' : 'fixed') + ' wall)', L.x0, yTop - 10);
      ctx.textAlign = 'right'; ctx.fillText('y = −h  (fixed wall)', L.x1 - 4, yBot - 8); ctx.textAlign = 'left';
      // moving-wall arrow
      if (Math.abs(s.U) > 1e-9) {
        ctx.strokeStyle = COL.purple; ctx.fillStyle = COL.purple; ctx.lineWidth = 3;
        const ax = L.x0 + 230, len = 60 * Math.sign(s.U);
        arrow(ctx, ax, yTop - 14, ax + len, yTop - 14, 10);
        ctx.font = 'bold 15px sans-serif'; ctx.fillText('U', ax + len + (s.U > 0 ? 6 : -18), yTop - 9);
      }
      // centreline and u = 0 axis
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L.x0, Y(0)); ctx.lineTo(L.x1, Y(0)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(zx, yTop); ctx.lineTo(zx, yBot); ctx.stroke();
      // u-axis ticks
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      const tick = span / 4;
      for (let k = -8; k <= 8; k++) {
        const uu = k * tick, px = X(uu);
        if (px < L.x0 - 1 || px > L.x1 + 1) continue;
        ctx.strokeStyle = '#bbb'; ctx.beginPath(); ctx.moveTo(px, yBot); ctx.lineTo(px, yBot + 5); ctx.stroke();
        ctx.fillText(fmt(uu, 3).replace(/<[^>]+>/g, ''), px, yBot + 32);
      }
      ctx.fillText('u (m/s)', (L.x0 + L.x1) / 2, H - 6);

      // reversed-flow shading
      const n = 120;
      ctx.fillStyle = 'rgba(192,57,43,0.10)';
      for (let i = 0; i < n; i++) {
        const ya = -h + 2 * h * i / n, yb = -h + 2 * h * (i + 1) / n;
        if (m.u(0.5 * (ya + yb)) < 0) ctx.fillRect(L.x0, Y(yb), L.x1 - L.x0, Y(ya) - Y(yb));
      }
      // component profiles
      if (s.parts) {
        ctx.lineWidth = 2; ctx.setLineDash([7, 5]); ctx.strokeStyle = COL.green;
        ctx.beginPath(); ctx.moveTo(X(m.uC(-h)), Y(-h)); ctx.lineTo(X(m.uC(h)), Y(h)); ctx.stroke();
        ctx.setLineDash([2, 4]); ctx.strokeStyle = COL.orange;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) { const y = -h + 2 * h * i / n; i ? ctx.lineTo(X(m.uP(y)), Y(y)) : ctx.moveTo(X(m.uP(y)), Y(y)); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      // velocity arrows + total profile
      ctx.strokeStyle = COL.blue; ctx.fillStyle = COL.blue; ctx.lineWidth = 1.5;
      for (let i = 1; i < 12; i++) { const y = -h + 2 * h * i / 12; arrow(ctx, zx, Y(y), X(m.u(y)), Y(y), 7); }
      ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const y = -h + 2 * h * i / n; i ? ctx.lineTo(X(m.u(y)), Y(y)) : ctx.moveTo(X(m.u(y)), Y(y)); }
      ctx.stroke();
      // max-velocity marker
      if (m.ys !== null) {
        ctx.fillStyle = COL.red; ctx.beginPath(); ctx.arc(X(m.u(m.ys)), Y(m.ys), 4.5, 0, 7); ctx.fill();
      }
      // legend
      ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
      const lg = [[COL.blue, [], 'total u(y)']];
      if (s.parts) lg.push([COL.green, [7, 5], 'Couette part'], [COL.orange, [2, 4], 'Poiseuille part']);
      ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fillRect(L.x1 - 148, yTop + 6, 146, 18 * lg.length + 8);
      lg.forEach((it, i) => {
        const lx = L.x1 - 140, ly = yTop + 18 + 18 * i;
        ctx.strokeStyle = it[0]; ctx.lineWidth = 2.5; ctx.setLineDash(it[1]);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 26, ly); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#333'; ctx.fillText(it[2], lx + 32, ly + 4);
      });

      // ---- shear-stress panel ----
      const tb = m.tau(-h), tt = m.tau(h);
      const tmax = niceMax(Math.max(Math.abs(tb), Math.abs(tt), 1e-9) * 1.05);
      const tz = (R.x0 + R.x1) / 2, ts = (R.x1 - R.x0) / 2 / tmax;
      const T = t => tz + t * ts;
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(R.x0, yTop); ctx.lineTo(R.x1, yTop); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R.x0, yBot); ctx.lineTo(R.x1, yBot); ctx.stroke();
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(tz, yTop); ctx.lineTo(tz, yBot); ctx.stroke();
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R.x0, Y(0)); ctx.lineTo(R.x1, Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = COL.purple; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(T(tb), Y(-h)); ctx.lineTo(T(tt), Y(h)); ctx.stroke();
      ctx.fillStyle = COL.purple;
      [[-h, tb], [h, tt]].forEach(([y, t]) => { ctx.beginPath(); ctx.arc(T(t), Y(y), 4, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      [-tmax, 0, tmax].forEach(t => ctx.fillText(fmt(t, 2).replace(/<[^>]+>/g, ''), T(t), yBot + 32));
      ctx.fillText('τxy = μ du/dy (Pa)', tz, H - 6);
      ctx.font = 'bold 13px sans-serif'; ctx.fillText('shear stress', tz, yTop - 12);

      // ---- readout ----
      const Pp = Math.abs(s.U) > 1e-12 ? -(4 * h * h) * s.G / (2 * mu() * s.U) : NaN;
      const Gcrit = mu() * s.U / (2 * h * h);
      let rev;
      if (s.U > 0) {
        rev = (s.G > Gcrit ? '<b style="color:' + COL.red + '">Reversed flow</b> next to the fixed wall (shaded): ' : 'No reversed flow: ') +
          'it appears when dp/dx &gt; μU/(2h²) = ' + fmt(Gcrit, 3) + ' Pa/m, i.e. when the pressure-gradient parameter ' +
          'P = −(2h)²(dp/dx)/(2μU) is below −1 (here P = ' + fmt(Pp, 3) + ').';
      } else {
        rev = 'u changes sign in the gap: <b>' + (m.umin < -1e-12 && m.umax > 1e-12 ? 'yes' : 'no') + '</b>.' +
          (s.U === 0 ? ' (U = 0: pure Poiseuille flow, symmetric about the centreline.)' : '');
      }
      const Re = 1000 * Math.abs(m.uavg) * 2 * h / mu();
      const reTxt = 'Reynolds number Re = ρ|u<sub>ave</sub>|(2h)/μ ≈ ' + fmt(Re, 2) + ' for a liquid with ρ = 1000 kg/m³' +
        (Re > 2000 ? ' — <b style="color:' + COL.red + '">too high: the real flow would probably be turbulent</b>, the laminar solution is only observed at modest Re (of order 10³ or less).' : ' (laminar flow is plausible).');
      out.innerHTML =
        (m.ys !== null
          ? 'Velocity extremum (du/dy = 0, red dot) at y = ' + fmt(m.ys * 1e3, 3) + ' mm: u = ' + fmt(m.u(m.ys), 3) + ' m/s. '
          : 'No velocity extremum inside the gap (|u| is largest at a wall). ') +
        'Flow rate per unit width Q = Uh − 2h³(dp/dx)/(3μ) = <b>' + fmt(m.Q, 3) + ' m²/s</b>, mean velocity u<sub>ave</sub> = Q/(2h) = ' + fmt(m.uavg, 3) + ' m/s.<br>' +
        'Wall shear stress τ<sub>xy</sub> = μ du/dy: at the fixed wall (y = −h) <b>' + fmt(tb, 3) + ' Pa</b>, ' +
        'at the moving wall (y = +h) <b>' + fmt(tt, 3) + ' Pa</b>.<br>' + rev + '<br>' + reTxt +
        '<br><span style="opacity:.7;font-size:.85em">Steady, laminar, unidirectional flow between plates at y = ±h (gap 2h); ' +
        'u(y) = (U/2)(1 + y/h) − (dp/dx)(h²/2μ)(1 − y²/h²). Because the reduced momentum equation is linear, the two parts simply add.</span>';
    }
    syncLabels();
    draw();
  }

  function init() {
    pageTools();
    document.querySelectorAll('.widget[data-widget]').forEach(root => {
      if (root.dataset.ready) return;
      const k = root.getAttribute('data-widget');
      if (k === 'couette-poiseuille') { root.dataset.ready = '1'; couettePoiseuille(root); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
