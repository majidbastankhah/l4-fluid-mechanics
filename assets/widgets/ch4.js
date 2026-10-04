/* Chapter 4 (Boundary Layers) interactive widgets for L4 Fluid Mechanics.
 * Usage (notes or slides):
 *   <div class="widget" data-widget="blasius"></div>
 *   <div class="widget" data-widget="bl-growth"></div>
 *   <div class="widget" data-widget="falkner-skan"></div>
 *   <script src="../assets/widgets/ch4.js"></script>
 * Plain JavaScript, no libraries. The similarity ODEs are solved in the browser
 * (4th-order Runge-Kutta + shooting on f''(0) by bisection).
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
  function sci(x, d) { // 3.2×10⁵ style
    if (!isFinite(x) || x === 0) return fmt(x, d);
    const e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e);
    return m.toFixed(d === undefined ? 2 : d) + '×10<sup>' + e + '</sup>';
  }
  const COL = { ink: '#222', grid: '#d6d6e0', axis: '#555', purple: '#68246D', red: '#c0392b', blue: '#2b6cb0', green: '#2f855a', orange: '#d97706', grey: '#888' };

  // draw axes in a box {x0,y0,x1,y1} (pixels) for data ranges xr=[a,b], yr=[a,b]
  function frame(ctx, b, xr, yr, xt, yt, xlab, ylab) {
    const X = v => b.x0 + (v - xr[0]) / (xr[1] - xr[0]) * (b.x1 - b.x0);
    const Y = v => b.y1 - (v - yr[0]) / (yr[1] - yr[0]) * (b.y1 - b.y0);
    ctx.lineWidth = 1; ctx.strokeStyle = COL.grid;
    ctx.font = '12px sans-serif'; ctx.fillStyle = COL.axis;
    xt.forEach(v => {
      ctx.beginPath(); ctx.moveTo(X(v), b.y0); ctx.lineTo(X(v), b.y1); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillText(typeof v === 'number' ? +v.toFixed(3) : v, X(v), b.y1 + 15);
    });
    yt.forEach(v => {
      ctx.beginPath(); ctx.moveTo(b.x0, Y(v)); ctx.lineTo(b.x1, Y(v)); ctx.stroke();
      ctx.textAlign = 'right'; ctx.fillText(+v.toFixed(3), b.x0 - 5, Y(v) + 4);
    });
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.3;
    ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    ctx.fillStyle = COL.ink; ctx.font = '13px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(xlab, (b.x0 + b.x1) / 2, b.y1 + 32);
    ctx.save(); ctx.translate(b.x0 - 38, (b.y0 + b.y1) / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText(ylab, 0, 0); ctx.restore();
    return { X, Y };
  }
  function curve(ctx, pts, X, Y, color, width, dash, clip) {
    ctx.save();
    if (clip) { ctx.beginPath(); ctx.rect(clip.x0, clip.y0, clip.x1 - clip.x0, clip.y1 - clip.y0); ctx.clip(); }
    ctx.strokeStyle = color; ctx.lineWidth = width || 2; ctx.setLineDash(dash || []);
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
    ctx.stroke(); ctx.restore();
  }
  function onScreen(root, cb) { // draw once the widget is first visible (cheap pages)
    if (!('IntersectionObserver' in window)) { cb(); return; }
    let done = false;
    new IntersectionObserver((es, o) => { if (!done && es[0].isIntersecting) { done = true; o.disconnect(); cb(); } }, { threshold: 0.01 }).observe(root);
  }

  // =====================================================================
  // ODE solver for the similarity equations
  //   f''' + a f f'' + beta (1 - f'^2) = 0,  f(0) = f'(0) = 0,  f'(inf) = 1
  //   Blasius (notes' scaling eta = y sqrt(U/(nu x))):  a = 1/2, beta = 0
  //   Falkner-Skan (eta = y sqrt((m+1)U/(2 nu x))):      a = 1,   beta = 2m/(m+1)
  // =====================================================================
  function integrate(a, beta, s, etaMax, h, keep) {
    let f = 0, g = 0, q = s; // f, f', f''
    const F = (f, g, q) => [g, q, -a * f * q - beta * (1 - g * g)];
    const n = Math.round(etaMax / h);
    const out = keep ? [[0, f, g, q, F(f, g, q)[2]]] : null;
    for (let i = 0; i < n; i++) {
      const k1 = F(f, g, q);
      const k2 = F(f + 0.5 * h * k1[0], g + 0.5 * h * k1[1], q + 0.5 * h * k1[2]);
      const k3 = F(f + 0.5 * h * k2[0], g + 0.5 * h * k2[1], q + 0.5 * h * k2[2]);
      const k4 = F(f + h * k3[0], g + h * k3[1], q + h * k3[2]);
      f += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      g += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      q += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
      if (g > 1.6 || g < -0.6) return { sign: g > 1 ? 1 : -1, out };
      if (keep) out.push([(i + 1) * h, f, g, q, F(f, g, q)[2]]);
    }
    return { sign: g > 1 ? 1 : -1, out };
  }
  // bisection on s = f''(0) in [0, 2]; returns the attached-flow branch (s >= 0)
  function shoot(a, beta, etaMax, h) {
    let lo = 0, hi = 2;
    for (let it = 0; it < 56; it++) {
      const m = 0.5 * (lo + hi);
      if (integrate(a, beta, m, etaMax, h, false).sign > 0) hi = m; else lo = m;
    }
    return 0.5 * (lo + hi);
  }
  // solve and return arrays + integral thicknesses (in eta units)
  function similarity(a, beta, etaMax, h) {
    const s = shoot(a, beta, etaMax, h);
    let out = integrate(a, beta, s, etaMax, h, true).out;
    // keep the converged part only (drop any tail where round-off makes f' wander)
    let cut = out.length;
    for (let i = 1; i < out.length; i++) if (Math.abs(out[i][2] - 1) < 2e-6 && out[i][0] > 3) { cut = i + 1; break; }
    out = out.slice(0, cut);
    const last = out[out.length - 1];
    for (let e = last[0] + h; e <= etaMax + 1e-9; e += h) out.push([e, last[1] + (e - last[0]), 1, 0, 0]); // f' = 1 beyond
    // integrals by the trapezium rule on a fine grid
    let ds = 0, th = 0;
    for (let i = 1; i < out.length; i++) {
      const g0 = out[i - 1][2], g1 = out[i][2];
      ds += 0.5 * h * ((1 - g0) + (1 - g1));
      th += 0.5 * h * (g0 * (1 - g0) + g1 * (1 - g1));
    }
    let e99 = NaN;
    for (let i = 1; i < out.length; i++) if (out[i][2] >= 0.99) { const p = out[i - 1], c = out[i]; e99 = p[0] + (0.99 - p[2]) / (c[2] - p[2]) * (c[0] - p[0]); break; }
    return { s, out, ds, th, H: ds / th, e99 };
  }
  function interp(out, eta, k) { // linear interpolation of column k at eta
    if (eta <= 0) return out[0][k];
    for (let i = 1; i < out.length; i++) if (out[i][0] >= eta) { const p = out[i - 1], c = out[i]; return p[k] + (eta - p[0]) / (c[0] - p[0]) * (c[k] - p[k]); }
    return out[out.length - 1][k];
  }

  // approximate (momentum-integral) profiles u/U = F(Y), Y = y/delta in [0,1]; F'(0) needed for tau_w
  const APPROX = {
    parabolic: { name: 'parabolic  2Y − Y²', F: Y => 2 * Y - Y * Y, d0: 2, color: COL.blue, dash: [7, 4] },
    cubic: { name: 'cubic  ³⁄₂Y − ½Y³', F: Y => 1.5 * Y - 0.5 * Y * Y * Y, d0: 1.5, color: COL.green, dash: [2, 3] },
    sine: { name: 'sine  sin(πY/2)', F: Y => Math.sin(Math.PI * Y / 2), d0: Math.PI / 2, color: COL.orange, dash: [10, 3, 2, 3] },
    linear: { name: 'linear  Y', F: Y => Y, d0: 1, color: COL.grey, dash: [4, 4] }
  };
  // MIE with dp/dx = 0: (theta/delta) d(delta)/dx = nu F'(0)/(U delta)  =>  delta/x = sqrt(2 F'(0) / (theta/delta)) Re_x^(-1/2)
  function mieConstants(p) {
    const n = 2000; let t = 0, d = 0; // Simpson
    for (let i = 0; i <= n; i++) {
      const Y = i / n, u = p.F(Y), w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      t += w * u * (1 - u); d += w * (1 - u);
    }
    t /= 3 * n; d /= 3 * n;
    const k = Math.sqrt(2 * p.d0 / t);
    return { delta: k, dstar: d * k, theta: t * k, cfbar: 2 * t * k, H: d / t };
  }

  // =====================================================================
  // 1) BLASIUS: numerical solution + comparison with approximate profiles
  // =====================================================================
  function blasius(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'The Blasius profile, solved live, and the approximate momentum-integral profiles'));
    const ctrl = el('div', { class: 'wctrl' });
    // data-approx="none" or e.g. "parabolic,sine" chooses which approximate profiles start ticked
    const pick = (root.getAttribute('data-approx') || 'parabolic,cubic,sine').split(',').map(t => t.trim());
    const st = { shear: true, eta: 2 };
    for (const k in APPROX) st[k] = pick.indexOf(k) >= 0;
    let boxes = '';
    for (const k in APPROX) boxes += '<label><input type="checkbox" data-k="' + k + '"' + (st[k] ? ' checked' : '') + '> ' + k + '</label>';
    ctrl.innerHTML = boxes +
      '<label><input type="checkbox" data-k="shear" checked> show f″ (shear)</label>' +
      '<label>probe η <input type="range" min="0" max="8" step="0.1" value="2" data-k="eta"><span data-o="eta">2.0</span></label>';
    root.appendChild(ctrl);
    const H = 430, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);

    ctrl.querySelectorAll('input[type=checkbox]').forEach(c => c.addEventListener('change', e => { st[e.target.dataset.k] = e.target.checked; draw(); }));
    ctrl.querySelector('[data-k="eta"]').addEventListener('input', e => {
      st.eta = parseFloat(e.target.value); ctrl.querySelector('[data-o="eta"]').textContent = st.eta.toFixed(1); draw();
    });

    let B = null; const MC = {};
    for (const k in APPROX) MC[k] = mieConstants(APPROX[k]);

    function draw() {
      if (!B) B = similarity(0.5, 0, 10, 0.005);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const box = { x0: 70, y0: 18, x1: 450, y1: 380 };
      const { X, Y } = frame(ctx, box, [0, 1.05], [0, 8], [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 1, 2, 3, 4, 5, 6, 7, 8],
        'u/U∞ = f′(η)', 'η = y (U∞/νx)^½');
      // delta_99 line
      ctx.setLineDash([3, 3]); ctx.strokeStyle = COL.purple; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(box.x0, Y(B.e99)); ctx.lineTo(box.x1, Y(B.e99)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.purple; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('u = 0.99U∞ at η = ' + B.e99.toFixed(2), box.x0 + 6, Y(B.e99) - 5);
      // approximations: eta = Y * k where k = delta sqrt(Re_x)/x
      for (const k in APPROX) {
        if (!st[k]) continue;
        const p = APPROX[k], kk = MC[k].delta, pts = [];
        for (let i = 0; i <= 200; i++) { const Yv = i / 200; pts.push([p.F(Yv), Yv * kk]); }
        pts.push([1, 8]);
        curve(ctx, pts, X, Y, p.color, 2.2, p.dash, box);
      }
      // Blasius
      curve(ctx, B.out.filter((r, i) => i % 4 === 0).map(r => [r[2], r[0]]), X, Y, COL.red, 3, null, box);
      if (st.shear) curve(ctx, B.out.filter((r, i) => i % 4 === 0).map(r => [r[3], r[0]]), X, Y, COL.purple, 2, [6, 3], box);
      // probe
      const fe = interp(B.out, st.eta, 1), fpe = interp(B.out, st.eta, 2), fppe = interp(B.out, st.eta, 3);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(box.x0, Y(st.eta)); ctx.lineTo(box.x1, Y(st.eta)); ctx.stroke();
      ctx.fillStyle = COL.red; ctx.beginPath(); ctx.arc(X(fpe), Y(st.eta), 5, 0, 7); ctx.fill();
      // legend
      let ly = 40; const lx = 480;
      ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
      const leg = (c, w, d, t) => {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.setLineDash(d || []);
        ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 36, ly - 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COL.ink; ctx.fillText(t, lx + 44, ly); ly += 24;
      };
      leg(COL.red, 3, null, 'Blasius (numerical, this page)');
      if (st.shear) leg(COL.purple, 2, [6, 3], 'Blasius f″(η)  (∝ shear stress)');
      for (const k in APPROX) if (st[k]) leg(APPROX[k].color, 2.2, APPROX[k].dash, APPROX[k].name + ',  Y = y/δ');
      ctx.fillStyle = '#555'; ctx.font = '12px sans-serif';
      ly += 6;
      const anyApprox = Object.keys(APPROX).some(k => st[k]);
      (anyApprox ? ['Approximate profiles are drawn with their own', 'momentum-integral δ(x), i.e. η = (y/δ)·(δ/x)Re_x^½.', 'The probe line reads the numerical solution.']
        : ['Tick a profile above to compare it with Blasius.', 'The probe line reads the numerical solution.']).forEach(t => { ctx.fillText(t, lx, ly); ly += 17; });

      // readout table
      const row = (name, c, col) => '<tr><td style="color:' + col + '"><b>' + name + '</b></td><td>' + c.delta.toFixed(2) + '</td><td>' + c.dstar.toFixed(3) + '</td><td>' + c.theta.toFixed(3) + '</td><td>' + c.cfbar.toFixed(3) + '</td><td>' + c.H.toFixed(2) + '</td></tr>';
      let rows = row('Blasius', { delta: B.e99, dstar: B.ds, theta: B.th, cfbar: 4 * B.s, H: B.H }, COL.red);
      for (const k in APPROX) if (st[k]) rows += row(k, MC[k], APPROX[k].color);
      out.innerHTML =
        '<b>Probe</b> η = ' + st.eta.toFixed(1) + ': f = ' + fe.toFixed(5) + ', f′ = u/U∞ = ' + fpe.toFixed(5) + ', f″ = ' + fppe.toFixed(5) +
        ' &nbsp;|&nbsp; computed f″(0) = <b>' + B.s.toFixed(5) + '</b>' +
        '<table style="margin-top:.4em;border-collapse:collapse;font-size:.92em" cellpadding="3"><tr><th></th><th>δ Re<sub>x</sub><sup>½</sup>/x</th><th>δ* Re<sub>x</sub><sup>½</sup>/x</th><th>θ Re<sub>x</sub><sup>½</sup>/x</th><th>C̄<sub>f</sub> Re<sub>L</sub><sup>½</sup></th><th>H</th></tr>' + rows + '</table>' +
        '<span style="opacity:.7;font-size:.85em">Blasius: f‴ + ½ f f″ = 0 solved by RK4 + shooting on f″(0); δ is the 99% thickness (customarily rounded to 5.0). For the Blasius row C̄<sub>f</sub>Re<sub>L</sub><sup>½</sup> = 4f″(0).</span>';
    }
    onScreen(root, draw);
  }

  // =====================================================================
  // 2) BL-GROWTH: laminar -> turbulent BL on a flat plate with a virtual origin
  // =====================================================================
  function blGrowth(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'Boundary-layer growth on a flat plate: laminar, transition and the virtual origin'));
    const ctrl = el('div', { class: 'wctrl' });
    ctrl.innerHTML =
      '<label>Fluid <select data-k="fluid"><option value="air" selected>air (ν = 1.5×10⁻⁵ m²/s)</option><option value="water">water (ν = 1.0×10⁻⁶ m²/s)</option></select></label>' +
      '<label>U∞ (m/s) <input type="range" min="1" max="40" step="0.5" value="20" data-k="U"><span data-o="U">20</span></label>' +
      '<label>L (m) <input type="range" min="0.5" max="5" step="0.1" value="3" data-k="L"><span data-o="L">3</span></label>' +
      '<label>Re<sub>cr</sub> <input type="range" min="4.7" max="6.5" step="0.01" value="5.699" data-k="lr"><span data-o="lr">5.0×10⁵</span></label>' +
      '<label>Plot <select data-k="q"><option value="d" selected>δ</option><option value="t">θ</option></select></label>' +
      '<label><input type="checkbox" data-k="refs" checked> all-laminar / all-turbulent references</label>';
    root.appendChild(ctrl);
    const H = 372, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);
    const st = { fluid: 'air', U: 20, L: 3, lr: 5.699, q: 'd', refs: true };
    const sup = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)]).join('');
    const reTxt = lr => { const R = Math.pow(10, lr), e = Math.floor(lr); return (R / Math.pow(10, e)).toFixed(1) + '×10' + sup(e); };
    ctrl.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', e => {
      const k = e.target.dataset.k; st[k] = parseFloat(e.target.value);
      ctrl.querySelector('[data-o="' + k + '"]').textContent = k === 'lr' ? reTxt(st.lr) : e.target.value; draw();
    }));
    ctrl.querySelectorAll('select').forEach(s => s.addEventListener('change', e => { st[e.target.dataset.k] = e.target.value; draw(); }));
    ctrl.querySelector('[data-k="refs"]').addEventListener('change', e => { st.refs = e.target.checked; draw(); });

    function draw() {
      const nu = st.fluid === 'air' ? 1.5e-5 : 1.0e-6, rho = st.fluid === 'air' ? 1.2 : 1000;
      const U = st.U, L = st.L, Recr = Math.pow(10, st.lr), ReL = U * L / nu;
      const xcr = Recr * nu / U, trans = xcr < L;
      // laminar (Blasius) and turbulent (empirical 1/7-law) relations
      const lamD = x => x > 0 ? 5.0 * x / Math.sqrt(U * x / nu) : 0, lamT = x => x > 0 ? 0.664 * x / Math.sqrt(U * x / nu) : 0;
      const turD = X => X > 0 ? 0.37 * X * Math.pow(U * X / nu, -0.2) : 0, turT = X => X > 0 ? 0.037 * X * Math.pow(U * X / nu, -0.2) : 0;
      // virtual origin from continuity of theta at x_cr:  Re_(xcr-x0) = (Re_theta,cr / 0.037)^(5/4)
      const thcr = lamT(xcr), ReD = Math.pow(thcr * U / nu / 0.037, 1.25), Dx = ReD * nu / U, x0 = xcr - Dx;
      const q = st.q === 'd' ? [lamD, turD] : [lamT, turT];
      const val = x => (!trans || x <= xcr) ? q[0](x) : q[1](x - x0);
      let ymax = 0; const N = 400, pts = [], pl = [], pt = [];
      for (let i = 0; i <= N; i++) {
        const x = L * i / N; pts.push([x, val(x) * 1000]); pl.push([x, q[0](x) * 1000]); pt.push([x, q[1](x) * 1000]);
        ymax = Math.max(ymax, val(x) * 1000, st.refs ? Math.max(q[0](x), q[1](x)) * 1000 : 0);
      }
      // nice axis
      const step = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200].find(s => ymax / s <= 6) || 500;
      const ytop = Math.ceil(ymax / step) * step, yt = []; for (let v = 0; v <= ytop + 1e-9; v += step) yt.push(v);
      const xs = [0.1, 0.2, 0.5, 1].find(s => L / s <= 10), xt = []; for (let v = 0; v <= L + 1e-9; v += xs) xt.push(+v.toFixed(2));
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const box = { x0: 75, y0: 15, x1: 780, y1: 300 };
      const { X, Y } = frame(ctx, box, [0, L], [0, ytop], xt, yt, 'x (m) from the leading edge', (st.q === 'd' ? 'δ' : 'θ') + ' (mm)');
      if (trans) { ctx.fillStyle = 'rgba(217,119,6,0.08)'; ctx.fillRect(X(xcr), box.y0, box.x1 - X(xcr), box.y1 - box.y0); }
      if (st.refs) {
        curve(ctx, pl, X, Y, COL.blue, 1.5, [5, 4], box);
        curve(ctx, pt, X, Y, COL.green, 1.5, [5, 4], box);
      }
      if (trans) { // turbulent curve continued back to its virtual origin
        const pv = []; for (let i = 0; i <= 60; i++) { const x = x0 + (xcr - x0) * i / 60; pv.push([x, q[1](x - x0) * 1000]); }
        curve(ctx, pv, X, Y, COL.orange, 1.5, [2, 3], box);
      }
      curve(ctx, pts, X, Y, COL.red, 3, null, box);
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      if (trans) {
        ctx.strokeStyle = COL.orange; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(xcr), box.y0); ctx.lineTo(X(xcr), box.y1); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COL.orange; ctx.fillText('x_cr', X(xcr), box.y0 + 14);
        if (x0 >= 0) { ctx.beginPath(); ctx.arc(X(x0), Y(0), 4, 0, 7); ctx.fill(); ctx.textAlign = 'right'; ctx.fillText('x₀', X(x0) - 6, box.y1 - 6); ctx.textAlign = 'center'; }
      }
      // legend
      ctx.textAlign = 'left'; let lx = 90, ly = 362;
      const leg = (c, w, d, t) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.setLineDash(d || []); ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx + 30, ly - 4); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = COL.ink; ctx.fillText(t, lx + 36, ly); lx += ctx.measureText(t).width + 66; };
      ctx.font = '12px sans-serif';
      leg(COL.red, 3, null, 'combined BL');
      if (st.refs) { leg(COL.blue, 1.5, [5, 4], 'laminar from LE'); leg(COL.green, 1.5, [5, 4], 'turbulent from LE'); }
      if (trans) leg(COL.orange, 1.5, [2, 3], 'turbulent law from virtual origin x₀');

      // drag (one side, per unit width) from the momentum thickness at the trailing edge
      const thL = trans ? turT(L - x0) : lamT(L), Cf = 2 * thL / L;
      const CfLam = 1.328 / Math.sqrt(ReL), CfTur = 0.074 * Math.pow(ReL, -0.2), q2 = 0.5 * rho * U * U * L;
      out.innerHTML =
        'Re<sub>L</sub> = ' + sci(ReL) + ', x<sub>cr</sub> = ' + fmt(xcr, 3) + ' m ' +
        (trans ? '→ transition on the plate; θ<sub>cr</sub> = ' + fmt(thcr * 1000, 3) + ' mm, x<sub>cr</sub> − x<sub>0</sub> = ' + fmt(Dx, 3) + ' m, <b>x<sub>0</sub> = ' + fmt(x0, 3) + ' m</b>'
          : '→ <b>laminar over the whole plate</b>') + '<br>' +
        'At x = L: δ = ' + fmt((trans ? turD(L - x0) : lamD(L)) * 1000, 2) + ' mm, θ = ' + fmt(thL * 1000, 3) + ' mm. ' +
        '<b>C̄<sub>f</sub> = 2θ(L)/L = ' + fmt(Cf * 1000, 3) + '×10⁻³</b> (drag ' + fmt(Cf * q2, 3) + ' N per m width, one side); ' +
        'all-laminar ' + fmt(CfLam * 1000, 3) + '×10⁻³, all-turbulent ' + fmt(CfTur * 1000, 3) + '×10⁻³.' +
        '<br><span style="opacity:.7;font-size:.85em">Laminar: Blasius δ = 5.0x Re<sub>x</sub><sup>−½</sup>, θ = 0.664x Re<sub>x</sub><sup>−½</sup>. Turbulent: δ = 0.37(x−x<sub>0</sub>)Re<sup>−1/5</sup>, θ = 0.037(x−x<sub>0</sub>)Re<sup>−1/5</sup> (empirical 1/7-power law, smooth plate, zero pressure gradient). ' +
        'Transition is idealised as sudden; θ is continuous at x<sub>cr</sub>, so δ jumps because the profile shape (H) changes.</span>';
    }
    onScreen(root, draw);
  }

  // =====================================================================
  // 3) FALKNER-SKAN: similarity profiles with a pressure gradient
  // =====================================================================
  const BETA_SEP = -0.19884;
  function falknerSkan(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'Laminar profiles with a pressure gradient (Falkner–Skan): inflection and separation'));
    const ctrl = el('div', { class: 'wctrl' });
    ctrl.innerHTML =
      '<label>β <input type="range" min="' + BETA_SEP + '" max="1" step="0.00001" value="-0.1" data-k="beta"><span data-o="beta">−0.100</span></label>' +
      '<button class="wbtn" data-b="1">stagnation β = 1</button><button class="wbtn" data-b="0">flat plate β = 0</button>' +
      '<button class="wbtn" data-b="-0.15">β = −0.15</button><button class="wbtn" data-b="' + BETA_SEP + '">separation β = −0.1988</button>';
    root.appendChild(ctrl);
    const H = 400, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);
    const st = { beta: -0.1 };
    const slider = ctrl.querySelector('[data-k="beta"]');
    const set = b => { st.beta = Math.max(BETA_SEP, Math.min(1, b)); slider.value = st.beta; ctrl.querySelector('[data-o="beta"]').textContent = st.beta.toFixed(st.beta === BETA_SEP ? 4 : 3).replace('-', '−'); draw(); };
    slider.addEventListener('input', e => set(parseFloat(e.target.value)));
    ctrl.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => set(parseFloat(b.dataset.b))));
    let ref = null; const cache = {};

    function draw() {
      if (!ref) ref = similarity(1, 0, 12, 0.005);
      const key = st.beta.toFixed(5);
      const S = cache[key] || (cache[key] = similarity(1, st.beta, 14, 0.005));
      const sep = st.beta <= BETA_SEP + 1e-6;
      if (sep) S.s = 0; // at separation the wall shear is zero (bisection converges to ~1e-4)
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const em = 6, yt = [0, 1, 2, 3, 4, 5, 6];
      const panels = [
        { k: 2, xr: [0, 1.05], xt: [0, 0.5, 1], lab: 'u/U_e = f′' },
        { k: 3, xr: [-0.1, 1.3], xt: [0, 0.5, 1], lab: 'f″  (∝ ∂u/∂y)' },
        { k: 4, xr: [-1.0, 0.25], xt: [-1, -0.5, 0], lab: 'f‴  (∝ ∂²u/∂y²)' }
      ];
      // inflection point: f''' changes sign (beta < 0 only: positive at the wall)
      let etaI = NaN;
      if (st.beta < 0) for (let i = 1; i < S.out.length; i++) if (S.out[i - 1][4] > 0 && S.out[i][4] <= 0) { etaI = S.out[i][0]; break; }
      panels.forEach((p, j) => {
        const box = { x0: 70 + j * 250, y0: 15, x1: 270 + j * 250, y1: 340 };
        const { X, Y } = frame(ctx, box, p.xr, [0, em], p.xt, yt, p.lab, j === 0 ? 'η = y ((m+1)U_e / 2νx)^½' : '');
        // zero line
        if (p.xr[0] < 0) { ctx.strokeStyle = COL.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0), box.y0); ctx.lineTo(X(0), box.y1); ctx.stroke(); }
        curve(ctx, ref.out.filter((r, i) => i % 4 === 0 && r[0] <= em).map(r => [r[p.k], r[0]]), X, Y, COL.grey, 1.5, [5, 4], box);
        curve(ctx, S.out.filter((r, i) => i % 4 === 0 && r[0] <= em).map(r => [r[p.k], r[0]]), X, Y, sep ? COL.red : COL.purple, 2.8, null, box);
        if (isFinite(etaI)) {
          ctx.strokeStyle = COL.orange; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(box.x0, Y(etaI)); ctx.lineTo(box.x1, Y(etaI)); ctx.stroke(); ctx.setLineDash([]);
          if (j === 0) { ctx.fillStyle = COL.orange; ctx.beginPath(); ctx.arc(X(interp(S.out, etaI, 2)), Y(etaI), 4.5, 0, 7); ctx.fill(); ctx.font = '12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('I', X(interp(S.out, etaI, 2)) + 7, Y(etaI) - 4); }
        }
      });
      ctx.font = '12px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = COL.grey;
      ctx.fillText('- - - flat plate (β = 0) for reference', 72, 392);
      ctx.fillStyle = COL.orange; if (isFinite(etaI)) ctx.fillText('- - - point of inflection I', 330, 392);

      const m = st.beta / (2 - st.beta);
      const regime = sep ? '<b style="color:' + COL.red + '">separation: ∂u/∂y|<sub>wall</sub> = 0 (τ<sub>w</sub> = 0)</b>'
        : st.beta > 1e-9 ? '<b>favourable</b> pressure gradient (dp/dx &lt; 0): curvature negative everywhere, no inflection'
          : Math.abs(st.beta) <= 1e-9 ? '<b>zero</b> pressure gradient (Blasius): f‴(0) = 0, no inflection'
            : '<b>adverse</b> pressure gradient (dp/dx &gt; 0): curvature positive at the wall, inflection at η ≈ ' + fmt(etaI, 2);
      out.innerHTML =
        'β = ' + st.beta.toFixed(4) + ' &nbsp;(m = β/(2−β) = ' + m.toFixed(4) + ', U<sub>e</sub> ∝ x<sup>m</sup>) &nbsp;|&nbsp; ' + regime + '<br>' +
        'wall shear f″(0) = <b>' + S.s.toFixed(4) + '</b> (flat plate 0.4696), wall curvature f‴(0) = −β = ' + (-st.beta).toFixed(4) +
        '; δ* = ' + S.ds.toFixed(3) + ', θ = ' + S.th.toFixed(3) + ' (in η units), <b>H = ' + S.H.toFixed(2) + '</b>' +
        '<br><span style="opacity:.7;font-size:.85em">f‴ + f f″ + β(1 − f′²) = 0 solved by RK4 + shooting (attached branch). In this scaling the flat plate (β = 0) has f″(0) = 0.4696 = √2 × 0.33206. ' +
        'No attached similarity solution exists for β &lt; −0.1988. The curvature panel is the analogue of the sketches in the notes: μ ∂²u/∂y²|<sub>wall</sub> = dp/dx.</span>';
    }
    onScreen(root, draw);
  }

  function init() {
    document.querySelectorAll('.widget[data-widget]').forEach(root => {
      const k = root.getAttribute('data-widget');
      if (k !== 'blasius' && k !== 'bl-growth' && k !== 'falkner-skan') return;
      if (root.dataset.ready) return;
      root.dataset.ready = '1';
      if (k === 'blasius') blasius(root);
      if (k === 'bl-growth') blGrowth(root);
      if (k === 'falkner-skan') falknerSkan(root);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
