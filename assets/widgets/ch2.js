/* Interactive widgets for L4 Fluid Mechanics, Chapter 2.
 * Usage (notes or slides):
 *   <div class="widget" data-widget="couette-heat"></div>
 *   <script src="../assets/widgets/ch2.js"></script>   (path relative to the page)
 * Plain JavaScript, no libraries. Only initialises the widget names listed in init().
 */
(function () {
  'use strict';

  // ---------- helpers (same pattern as widgets.js) ----------
  const W = 800; // internal drawing width (CSS scales it to fit)
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
  function fmt(x, d) {
    if (!isFinite(x)) return '—';
    const a = Math.abs(x);
    if (a !== 0 && (a < 0.01 || a >= 1e4)) return x.toExponential(2);
    return x.toFixed(d === undefined ? 1 : d);
  }
  function fmtSI(x, unit) { // e.g. 12300 W/m² -> 12.3 kW/m²
    const a = Math.abs(x);
    if (a >= 1e6) return fmt(x / 1e6, 2) + ' M' + unit;
    if (a >= 1e3) return fmt(x / 1e3, 2) + ' k' + unit;
    return fmt(x, a < 10 ? 2 : 1) + ' ' + unit;
  }
  function arrow(ctx, x0, y0, x1, y1, head) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (L < 0.5) return;
    const ux = dx / L, uy = dy / L, h = Math.min(head || 6, L * 0.5);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - h * ux + 0.5 * h * uy, y1 - h * uy - 0.5 * h * ux);
    ctx.lineTo(x1 - h * ux - 0.5 * h * uy, y1 - h * uy + 0.5 * h * ux);
    ctx.closePath(); ctx.fill();
  }
  // run an animation only while the widget is on screen
  function animate(root, step) {
    let visible = true, last = null;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(root);
    }
    function frame(t) {
      if (last === null) last = t;
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      if (visible) step(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function niceMax(v) { // smallest "nice" number >= v
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v * 0.999) return m * p;
    return 10 * p;
  }
  // temperature colour map (cool blue -> pale -> orange -> deep red), s in [0,1]
  const CMAP = [[43, 108, 176], [148, 190, 220], [250, 240, 205], [245, 160, 70], [192, 57, 43], [120, 20, 30]];
  function tcol(s) {
    s = Math.max(0, Math.min(1, s)) * (CMAP.length - 1);
    const i = Math.min(Math.floor(s), CMAP.length - 2), f = s - i, a = CMAP[i], b = CMAP[i + 1];
    return 'rgb(' + Math.round(a[0] + f * (b[0] - a[0])) + ',' + Math.round(a[1] + f * (b[1] - a[1])) + ',' + Math.round(a[2] + f * (b[2] - a[2])) + ')';
  }
  // draw text with simple subscripts: segments like 'T' and '_w' (underscore = subscript)
  function stext(ctx, str, x, y, align, size) {
    size = size || 13;
    const parts = str.split(/(_[^ )\/]+)/).filter(t => t.length);
    const font = ctx.font, fam = font.replace(/^.*?\d+px\s*/, '') || 'sans-serif';
    const pre = font.match(/^(.*?)\d+px/); const style = pre ? pre[1] : '';
    let w = 0;
    const segs = parts.map(t => {
      const sub = t[0] === '_', txt = sub ? t.slice(1) : t;
      ctx.font = style + (sub ? Math.round(size * 0.72) : size) + 'px ' + fam;
      const sw = ctx.measureText(txt).width; w += sw;
      return { sub, txt, sw };
    });
    let x0 = align === 'center' ? x - w / 2 : (align === 'right' ? x - w : x);
    const ta = ctx.textAlign; ctx.textAlign = 'left';
    for (const g of segs) {
      ctx.font = style + (g.sub ? Math.round(size * 0.72) : size) + 'px ' + fam;
      ctx.fillText(g.txt, x0, g.sub ? y + size * 0.3 : y); x0 += g.sw;
    }
    ctx.font = font; ctx.textAlign = ta;
  }
  const COL = { ink: '#222', grid: '#a9a9b8', purple: '#68246D', red: '#c0392b', blue: '#2b6cb0', green: '#2f855a', orange: '#d97706' };

  // Typical property values (order-of-magnitude, for illustration).
  const FLUIDS = {
    oil: { name: 'Engine oil (≈ 40 °C)', mu: 0.10, k: 0.145, rho: 870 },
    glycerol: { name: 'Glycerol (20 °C)', mu: 1.41, k: 0.285, rho: 1260 },
    water: { name: 'Water (20 °C)', mu: 1.0e-3, k: 0.60, rho: 998 },
    air: { name: 'Air (20 °C, 1 atm)', mu: 1.8e-5, k: 0.026, rho: 1.2 }
  };

  // =====================================================================
  // COUETTE-HEAT: plane Couette flow with viscous dissipation
  //   lower plate y = 0: stationary, T = T_w;  upper plate y = h: speed U, T = T_inf
  //   u = U y/h,  k T'' = -mu (U/h)^2
  //   T - T_w = (T_inf - T_w) eta + (mu U^2 / 2k) eta (1 - eta),  eta = y/h
  //   (G = mu U^2 / [k (T_inf - T_w)] is used internally only; it is not shown to students)
  // =====================================================================
  function couetteHeat(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'Couette flow with viscous heating'));
    const ctrl = el('div', { class: 'wctrl' });
    let fopts = '';
    for (const key in FLUIDS) fopts += '<option value="' + key + '"' + (key === 'oil' ? ' selected' : '') + '>' + FLUIDS[key].name + '</option>';
    ctrl.innerHTML =
      '<label>Fluid <select data-k="fluid">' + fopts + '</select></label>' +
      '<label>Plate speed U (m/s) <input type="range" min="0" max="10" step="0.1" value="3" data-k="U"><span data-o="U">3.0</span></label>' +
      '<label>T<sub>∞</sub> − T<sub>w</sub> (K) <input type="range" min="1" max="20" step="0.5" value="5" data-k="dT"><span data-o="dT">5.0</span></label>';
    root.appendChild(ctrl);
    const H = 400, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);

    const s = { fluid: 'oil', U: 3, dT: 5 };
    const q = k => ctrl.querySelector('[data-k="' + k + '"]');
    const o = k => ctrl.querySelector('[data-o="' + k + '"]');
    q('fluid').addEventListener('change', e => { s.fluid = e.target.value; draw(); });
    [['U', 1], ['dT', 1]].forEach(([k, d]) => q(k).addEventListener('input', e => {
      s[k] = parseFloat(e.target.value); o(k).textContent = s[k].toFixed(d); draw();
    }));

    // --- physics ---
    function state() {
      const F = FLUIDS[s.fluid], Br = F.mu * s.U * s.U / (F.k * s.dT);   // internal only
      const theta = eta => eta + 0.5 * Br * eta * (1 - eta);
      const etaMax = Br > 2 ? 0.5 + 1 / Br : 1;                 // location of maximum T
      const thMax = Br > 2 ? (Br + 2) * (Br + 2) / (8 * Br) : 1;  // = theta(etaMax)
      const qLow = 1 + Br / 2;   // heat flux from fluid into lower plate, in units k(T_inf - T_w)/h
      const qUp = Br / 2 - 1;    // heat flux from fluid into upper plate (negative: plate heats fluid)
      return { Br, F, theta, etaMax, thMax, qLow, qUp };
    }

    // --- geometry (pixels) ---
    const yTop = 80, yBot = 318, gap = yBot - yTop;
    const cx0 = 30, cx1 = 340;             // channel schematic
    const px0 = 440, px1 = 770;            // temperature plot
    const Y = eta => yBot - eta * gap;
    const tracers = [];
    for (let i = 0; i < 70; i++) tracers.push({ x: cx0 + Math.random() * (cx1 - cx0), eta: 0.03 + 0.94 * Math.random() });
    let hatch = 0;

    function step(dt) {
      const vmax = 110; // px/s at the moving plate (schematic, not to scale)
      for (const p of tracers) { p.x += vmax * p.eta * dt; if (p.x > cx1) p.x -= (cx1 - cx0); }
      hatch = (hatch + vmax * dt) % 12;
      draw();
    }

    function draw() {
      const st = state();
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const thTop = Math.max(1, st.thMax);
      // ---------- channel schematic, coloured by temperature ----------
      const grad = ctx.createLinearGradient(0, yBot, 0, yTop);
      for (let i = 0; i <= 24; i++) { const e = i / 24; grad.addColorStop(e, tcol(st.theta(e) / thTop)); }
      ctx.fillStyle = grad; ctx.fillRect(cx0, yTop, cx1 - cx0, gap);
      // plates
      ctx.fillStyle = '#555'; ctx.fillRect(cx0 - 5, yBot, cx1 - cx0 + 10, 9); ctx.fillRect(cx0 - 5, yTop - 9, cx1 - cx0 + 10, 9);
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5;   // moving hatch marks on the upper plate
      for (let x = cx0 - 5 + hatch; x < cx1 + 5; x += 12) { ctx.beginPath(); ctx.moveTo(x, yTop - 1); ctx.lineTo(x + 5, yTop - 8); ctx.stroke(); }
      ctx.strokeStyle = '#999';
      for (let x = cx0 - 2; x < cx1 + 5; x += 12) { ctx.beginPath(); ctx.moveTo(x, yBot + 8); ctx.lineTo(x + 5, yBot + 1); ctx.stroke(); }
      ctx.fillStyle = COL.ink; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5;
      arrow(ctx, cx0 + 175, yTop - 20, cx0 + 235, yTop - 20, 9);
      ctx.font = 'italic 15px serif'; ctx.textAlign = 'left';
      ctx.fillText('U', cx0 + 160, yTop - 15);
      ctx.font = '13px sans-serif';
      ctx.fillText('moving plate, T = T∞', cx0, yTop - 16);
      stext(ctx, 'stationary plate, T = T_w', cx0, yBot + 26, 'left', 13);
      // tracers (move with u(y))
      ctx.fillStyle = 'rgba(30,30,30,0.35)';
      for (const p of tracers) { ctx.beginPath(); ctx.arc(p.x, Y(p.eta), 1.8, 0, 7); ctx.fill(); }
      // velocity profile u = U y/h
      const ux0 = cx0 + 40, uLen = 170;
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(ux0, yBot); ctx.lineTo(ux0, yTop); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ux0, yBot); ctx.lineTo(ux0 + uLen, yTop); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.fillStyle = COL.ink;
      for (let i = 1; i <= 7; i++) { const e = i / 8; arrow(ctx, ux0, Y(e), ux0 + uLen * e, Y(e), 7); }
      ctx.font = 'italic 14px serif'; ctx.fillText('u(y) = Uy/h', ux0 + 95, Y(0.42));
      // wall heat-flux arrows (length ~ |q|), drawn at the right end of the channel
      const qs = Math.max(st.qLow, Math.abs(st.qUp), 1), Lq = v => 8 + 34 * Math.abs(v) / qs;
      const xa = cx1 - 25;
      ctx.strokeStyle = COL.orange; ctx.fillStyle = COL.orange; ctx.lineWidth = 4;
      arrow(ctx, xa, yBot - 6, xa, yBot - 6 + Lq(st.qLow) + 12, 11);   // fluid -> lower plate (down)
      if (Math.abs(st.qUp) > 1e-3) {
        if (st.qUp > 0) arrow(ctx, xa, yTop + 6, xa, yTop + 6 - Lq(st.qUp) - 12, 11);   // fluid -> upper plate (up)
        else arrow(ctx, xa, yTop - 18 - Lq(st.qUp), xa, yTop + 22, 11);              // upper plate -> fluid (down)
      }
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('heat flux', xa - 10, yBot + 42);
      if (Math.abs(st.qUp) > 1e-3) ctx.fillText('heat flux', xa - 10, yTop - 34);

      // ---------- temperature profile plot ----------
      const scaleT = s.dT;                // convert theta -> plotted variable
      const tAxis = niceMax(thTop * scaleT);
      const X = v => px0 + (px1 - px0) * v / tAxis; // v in plotted units
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const v = tAxis * i / 5, x = X(v);
        ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yBot); ctx.stroke();
        ctx.fillText(+v.toPrecision(3), x, yBot + 17);
      }
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const e = i / 4;
        ctx.beginPath(); ctx.moveTo(px0, Y(e)); ctx.lineTo(px1, Y(e)); ctx.stroke();
        ctx.fillText(e.toFixed(2), px0 - 6, Y(e) + 4);
      }
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.2; ctx.strokeRect(px0, yTop, px1 - px0, gap);
      ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.font = '13px sans-serif';
      stext(ctx, 'T − T_w  (K)', (px0 + px1) / 2, yBot + 36, 'center', 13);
      ctx.save(); ctx.translate(px0 - 40, (yTop + yBot) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('y/h', 0, 0); ctx.restore();
      // conduction only (no viscous heating)
      ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(scaleT), Y(1)); ctx.stroke(); ctx.setLineDash([]);
      // current profile
      ctx.strokeStyle = COL.red; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const e = i / 100, x = X(st.theta(e) * scaleT); i ? ctx.lineTo(x, Y(e)) : ctx.moveTo(x, Y(e)); }
      ctx.stroke();
      // max-temperature line, continued across the channel
      if (st.Br > 2) {
        ctx.strokeStyle = COL.red; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(cx0, Y(st.etaMax)); ctx.lineTo(X(st.thMax * scaleT), Y(st.etaMax)); ctx.stroke();
        ctx.setLineDash([]);
      }
      // maximum marker
      ctx.fillStyle = COL.red; ctx.beginPath(); ctx.arc(X(st.thMax * scaleT), Y(st.etaMax), 5.5, 0, 7); ctx.fill();
      ctx.font = 'bold 12px sans-serif';
      const lx = X(st.thMax * scaleT), ly = Y(st.etaMax);
      if (st.etaMax > 0.93) stext(ctx, 'T_max', lx - 12, ly + 5, 'right', 13);
      else stext(ctx, 'T_max', lx + (lx > px1 - 120 ? -9 : 9), ly - 8, lx > px1 - 120 ? 'right' : 'left', 13);
      // legend
      ctx.textAlign = 'left'; ctx.font = '12px sans-serif';
      ctx.strokeStyle = COL.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px0 + 10, yTop - 30); ctx.lineTo(px0 + 34, yTop - 30); ctx.stroke();
      ctx.fillStyle = COL.ink; ctx.fillText('with viscous heating', px0 + 40, yTop - 26);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(px0 + 170, yTop - 30); ctx.lineTo(px0 + 194, yTop - 30); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillText('conduction only', px0 + 200, yTop - 26);

      // ---------- readout ----------
      const html = st.Br > 2
        ? '<span style="color:' + COL.red + '"><b>Maximum temperature inside the fluid</b></span> (y/h = ' + fmt(st.etaMax, 2) + '): ' +
          'T<sub>max</sub> − T<sub>w</sub> = <b>' + fmt(st.thMax * s.dT, 2) + ' K</b>. Heat flows out through <b>both</b> plates.'
        : '<b>Maximum temperature at the moving plate</b>: viscous heating is too weak to make the fluid hotter than the upper plate.' +
          (st.Br < 0.05 ? ' The profile is almost the straight conduction line.' : '');
      out.innerHTML = html + '<br><span style="opacity:.7;font-size:.85em">Steady laminar flow, constant μ and k; typical property values. Tracer dots move with u(y), not to scale.</span>';
    }
    draw();
    animate(root, step);
  }

  function init() {
    document.querySelectorAll('.widget[data-widget="couette-heat"]').forEach(root => {
      if (root.dataset.ready) return;
      root.dataset.ready = '1';
      couetteHeat(root);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
