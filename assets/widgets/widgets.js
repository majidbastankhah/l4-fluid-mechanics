/* Interactive widgets for L4 Fluid Mechanics.
 * Usage in any page (notes or slides):
 *   <div class="widget" data-widget="nozzle"></div>
 *   <div class="widget" data-widget="vorticity" data-field="shear"></div>
 *   <script src="/assets/widgets/widgets.js"></script>   (path relative to the page)
 * Plain JavaScript, no libraries. Each widget builds its own controls.
 */
(function () {
  'use strict';

  // ---------- helpers ----------
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
  const COL = { ink: '#222', grid: '#a9a9b8', purple: '#68246D', red: '#c0392b', blue: '#2b6cb0', green: '#2f855a', orange: '#d97706' };

  // =====================================================================
  // 1) NOZZLE: local vs convective acceleration of a fluid element
  //    u(x,t) = V(t) (1 + 2x/L),  V(t) = V0 [1 + a sin(2 pi t / T)]
  // =====================================================================
  function nozzle(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'Following a fluid element through a nozzle'));
    const ctrl = el('div', { class: 'wctrl' });
    ctrl.innerHTML =
      '<label>V<sub>0</sub> (m/s) <input type="range" min="1" max="6" step="0.5" value="3" data-k="V0"><span data-o="V0">3</span></label>' +
      '<label>L (m) <input type="range" min="0.05" max="0.5" step="0.05" value="0.1" data-k="L"><span data-o="L">0.1</span></label>' +
      '<label><input type="checkbox" data-k="unsteady"> unsteady inflow (pulsing)</label>' +
      '<button class="wbtn" data-k="play">Pause</button><button class="wbtn" data-k="reset">Release new element</button>';
    root.appendChild(ctrl);
    const H = 300, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);

    const s = { V0: 3, L: 0.1, unsteady: false, playing: true, t: 0, xe: 0, a: 0.4 };
    const q = k => ctrl.querySelector('[data-k="' + k + '"]');
    ['V0', 'L'].forEach(k => q(k).addEventListener('input', e => {
      s[k] = parseFloat(e.target.value);
      ctrl.querySelector('[data-o="' + k + '"]').textContent = e.target.value;
    }));
    q('unsteady').addEventListener('change', e => { s.unsteady = e.target.checked; });
    q('play').addEventListener('click', e => { s.playing = !s.playing; e.target.textContent = s.playing ? 'Pause' : 'Play'; });
    q('reset').addEventListener('click', () => { s.xe = 0; trail.length = 0; });

    // geometry in pixels
    const x0p = 80, x1p = 540, yc = 130, h0 = 85;
    const toPx = xi => x0p + xi * (x1p - x0p); // xi = x/L in [0,1]
    const halfW = xi => h0 / (1 + 2 * xi);      // planar continuity: u * h = const

    // background tracer particles (positions in xi, eta in [-1,1])
    const tracers = [];
    for (let i = 0; i < 90; i++) tracers.push({ xi: Math.random() * 1.3 - 0.15, eta: Math.random() * 1.8 - 0.9 });
    const trail = [];

    const T = () => 2 * s.L / s.V0;                       // pulsing period (physical s)
    const Vt = t => s.V0 * (1 + (s.unsteady ? s.a * Math.sin(2 * Math.PI * t / T()) : 0));
    const dVdt = t => s.unsteady ? s.V0 * s.a * (2 * Math.PI / T()) * Math.cos(2 * Math.PI * t / T()) : 0;
    const u = (xi, t) => Vt(t) * (1 + 2 * xi);

    function step(dtReal) {
      if (s.playing) {
        // slow motion: one transit (~0.55 L/V0) takes ~4 s of screen time
        const slow = (0.55 * s.L / s.V0) / 4;
        const dt = dtReal * slow, n = 4, h = dt / n;
        for (let k = 0; k < n; k++) {
          // element (in physical x), RK2
          const x = s.xe * s.L;
          const k1 = u(x / s.L, s.t), k2 = u((x + 0.5 * h * k1) / s.L, s.t + 0.5 * h);
          s.xe = (x + h * k2) / s.L;
          for (const p of tracers) {
            p.xi += h * u(Math.max(p.xi, 0), s.t) / s.L;
            if (p.xi > 1.12) { p.xi = -0.15; p.eta = Math.random() * 1.8 - 0.9; }
          }
          s.t += h;
        }
        if (s.xe > 1.12) { s.xe = 0; trail.length = 0; }
        trail.push(s.xe);
        if (trail.length > 400) trail.shift();
      }
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      // walls
      ctx.lineWidth = 2.5; ctx.strokeStyle = COL.ink;
      for (const sg of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(20, yc + sg * h0); ctx.lineTo(x0p, yc + sg * h0);
        for (let i = 0; i <= 60; i++) { const xi = i / 60; ctx.lineTo(toPx(xi), yc + sg * halfW(xi)); }
        ctx.lineTo(toPx(1.15), yc + sg * halfW(1));
        ctx.stroke();
      }
      ctx.setLineDash([6, 5]); ctx.lineWidth = 1; ctx.strokeStyle = '#888';
      ctx.beginPath(); ctx.moveTo(toPx(0), yc - h0 - 8); ctx.lineTo(toPx(0), yc + h0 + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toPx(1), yc - halfW(1) - 8); ctx.lineTo(toPx(1), yc + halfW(1) + 8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#555'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('x = 0', toPx(0), yc + h0 + 24); ctx.fillText('x = L', toPx(1), yc + halfW(1) + 24);
      // tracers
      ctx.fillStyle = 'rgba(43,108,176,0.45)';
      for (const p of tracers) {
        const xi = p.xi, hw = xi < 0 ? h0 : (xi > 1 ? halfW(1) : halfW(xi));
        ctx.beginPath(); ctx.arc(xi < 0 ? x0p + xi * (x1p - x0p) : toPx(xi), yc + p.eta * hw, 2.2, 0, 7); ctx.fill();
      }
      // the highlighted element: length grows with u, height shrinks with channel (area conserved in 2D)
      const xi = s.xe, xiC = Math.min(xi, 1), ue = u(xiC, s.t);
      const len = 16 * (1 + 2 * xiC), hgt = 0.5 * halfW(xiC);
      const px = xi <= 1 ? toPx(xi) : toPx(1) + (xi - 1) * (x1p - x0p);
      ctx.fillStyle = 'rgba(192,57,43,0.85)'; ctx.fillRect(px - len / 2, yc - hgt / 2, len, hgt);
      // fixed probe (Eulerian observer) at x = 0.5 L
      const xp = 0.5, upr = u(xp, s.t);
      ctx.strokeStyle = COL.green; ctx.fillStyle = COL.green; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(toPx(xp), yc - halfW(xp) - 22, 6, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toPx(xp), yc - halfW(xp) - 16); ctx.lineTo(toPx(xp), yc - halfW(xp) + 2); ctx.stroke();
      ctx.font = '13px sans-serif'; ctx.fillText('fixed probe', toPx(xp), yc - halfW(xp) - 34);

      // acceleration bars at the element
      const local = dVdt(s.t) * (1 + 2 * xiC);
      const conv = ue * Vt(s.t) * 2 / s.L;
      const total = local + conv;
      const amax = 2 * (s.V0 * (1 + s.a)) ** 2 * 3 / s.L + 1e-9;
      const bx = 660, bw = 30, by = 270, bh = 200;
      const bars = [['local', local, COL.orange], ['convect.', conv, COL.blue], ['total', total, COL.red]];
      ctx.font = 'bold 12px sans-serif';
      ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx - 6, by - bh / 2); ctx.lineTo(bx + 3 * (bw + 10), by - bh / 2); ctx.stroke();
      bars.forEach((b, i) => {
        const hgtb = Math.max(-bh / 2, Math.min(bh / 2, (b[1] / amax) * bh * 0.95));
        ctx.fillStyle = b[2];
        ctx.fillRect(bx + i * (bw + 10), by - bh / 2 - Math.max(hgtb, 0), bw, Math.abs(hgtb));
        ctx.fillStyle = b[2]; ctx.textAlign = 'center';
        ctx.fillText(b[0], bx + i * (bw + 10) + bw / 2, 52);
      });
      ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.font = '13px sans-serif';
      ctx.fillText('acceleration of red element', bx + 1.5 * (bw + 10), 28);

      out.innerHTML =
        '<b style="color:' + COL.red + '">Red element</b> at x/L = ' + fmt(xiC, 2) +
        ': u = ' + fmt(ue, 2) + ' m/s; ' +
        '<span style="color:' + COL.orange + '">∂u/∂t = ' + fmt(local) + '</span> + ' +
        '<span style="color:' + COL.blue + '">u ∂u/∂x = ' + fmt(conv) + '</span> = ' +
        '<b>Du/Dt = ' + fmt(total) + ' m/s²</b><br>' +
        '<b style="color:' + COL.green + '">Fixed probe</b> at x/L = 0.5: u = ' + fmt(upr, 2) + ' m/s, ' +
        '∂u/∂t = ' + fmt(dVdt(s.t) * (1 + 2 * xp)) + ' m/s² ' +
        (s.unsteady ? '' : '<i>(steady flow: the probe never sees the velocity change, yet the element accelerates)</i>') +
        '<br><span style="opacity:.7;font-size:.85em">Animation in slow motion. u(x,t) = V(t)(1 + 2x/L).</span>';
    }
    animate(root, step);
  }

  // =====================================================================
  // 2) VORTICITY: does a fluid element rotate? (2D flow explorer)
  // =====================================================================
  const FIELDS = {
    uniform: { name: 'Uniform flow', f: (x, y) => [1, 0], w: () => 0, box: 2.2,
      note: 'Straight streamlines, no velocity gradients: the element simply translates.' },
    shear: { name: 'Simple shear (Couette) u = y', f: (x, y) => [y, 0], w: () => -1, box: 2.2,
      note: 'Streamlines are straight, yet ξ<sub>z</sub> = ∂v/∂x − ∂u/∂y = −1: the element <b>rotates</b> (clockwise) and deforms.' },
    solid: { name: 'Solid-body rotation', f: (x, y) => [-0.8 * y, 0.8 * x], w: () => 1.6, box: 2.2,
      note: 'The whole fluid turns like a rigid disc: ξ<sub>z</sub> = 2Ω everywhere, no deformation.' },
    vortex: { name: 'Free (irrotational) vortex u<sub>θ</sub> = Γ/2πr', f: (x, y) => { const r2 = Math.max(x * x + y * y, 0.05); return [-0.9 * y / r2, 0.9 * x / r2]; }, w: () => 0, box: 2.2,
      note: 'Streamlines are circles, but ξ = 0 (except at the centre): elements go round <b>without</b> turning. Curved paths ≠ rotation!' },
    stagnation: { name: 'Stagnation-point flow u = x, v = −y', f: (x, y) => [x, -y], w: () => 0, box: 2.2,
      note: 'Irrotational: the element is stretched and squashed (area conserved) but does not turn. This is Problem 1.5.' }
  };

  function vorticity(root) {
    const start = root.getAttribute('data-field') || 'shear';
    root.appendChild(el('div', { class: 'wtitle' }, 'Does the fluid element rotate? A vorticity explorer'));
    const ctrl = el('div', { class: 'wctrl' });
    let opts = '';
    for (const k in FIELDS) opts += '<option value="' + k + '"' + (k === start ? ' selected' : '') + '>' + FIELDS[k].name.replace(/<[^>]+>/g, '') + '</option>';
    ctrl.innerHTML = '<label>Flow: <select data-k="field">' + opts + '</select></label>' +
      '<label><input type="checkbox" data-k="cross" checked> show "vorticity meter" cross</label>' +
      '<button class="wbtn" data-k="play">Pause</button><button class="wbtn" data-k="reset">Restart</button>';
    root.appendChild(ctrl);
    const H = 400, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);

    const s = { field: start, playing: true, cross: true, els: [] };
    const q = k => ctrl.querySelector('[data-k="' + k + '"]');
    q('field').addEventListener('change', e => { s.field = e.target.value; reset(); });
    q('cross').addEventListener('change', e => { s.cross = e.target.checked; });
    q('play').addEventListener('click', e => { s.playing = !s.playing; e.target.textContent = s.playing ? 'Pause' : 'Play'; });
    q('reset').addEventListener('click', reset);

    // map: physical [-box*2, box*2] x [-box, box] -> canvas
    const sc = () => H / (2 * FIELDS[s.field].box);
    const X = x => W / 2 + x * sc(), Y = y => H / 2 - y * sc();
    const xmax = () => W / 2 / sc(), ymax = () => FIELDS[s.field].box;

    function seeds() {
      switch (s.field) {
        case 'uniform': case 'shear': return [[-3, 1.2], [-1, 0.4], [1, -0.6], [-2.5, -1.4], [2.2, 1.5]];
        case 'solid': return [[1.2, 0], [-0.6, 1.0], [-0.7, -1.1], [0, 0], [1.9, 0.9]];
        case 'vortex': return [[1.4, 0], [-0.8, 1.3], [-1.0, -1.2], [0.9, -1.5]];
        case 'stagnation': return [[0.25, 1.9], [-0.25, 1.9], [0.6, -1.9], [-0.9, -1.9]];
      }
    }
    function reset() {
      const a = 0.22;
      s.els = seeds().map(([cx, cy]) => ({
        home: [cx, cy], c: [cx, cy], th: 0, age: 0,
        pts: [[cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a]]
      }));
      s.els.forEach(e => { e.pts = refine(e.pts); });
    }
    function refine(sq) { // 10 points per side so the element outline can bend
      const p = [];
      for (let i = 0; i < 4; i++) {
        const A = sq[i], B = sq[(i + 1) % 4];
        for (let k = 0; k < 10; k++) p.push([A[0] + (B[0] - A[0]) * k / 10, A[1] + (B[1] - A[1]) * k / 10]);
      }
      return p;
    }
    function adv(p, h) {
      const f = FIELDS[s.field].f;
      const k1 = f(p[0], p[1]);
      const k2 = f(p[0] + 0.5 * h * k1[0], p[1] + 0.5 * h * k1[1]);
      const k3 = f(p[0] + 0.5 * h * k2[0], p[1] + 0.5 * h * k2[1]);
      const k4 = f(p[0] + h * k3[0], p[1] + h * k3[1]);
      return [p[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), p[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    }
    function step(dt) {
      if (s.playing) {
        const h = dt * 0.6, F = FIELDS[s.field];
        for (const e of s.els) {
          e.c = adv(e.c, h); e.pts = e.pts.map(p => adv(p, h));
          e.th += 0.5 * F.w(e.c[0], e.c[1]) * h; // fluid element spins at half the vorticity
          e.age += h;
          const out = Math.abs(e.c[0]) > xmax() + 0.5 || Math.abs(e.c[1]) > ymax() + 0.5;
          const tooOld = (s.field === 'stagnation' && e.age > 3.2) || (s.field === 'vortex' && e.age > 3);
          if (out || tooOld) {
            if (s.field === 'uniform' || s.field === 'shear') { // wrap around horizontally
              const L = 2 * xmax() + 1, sh = e.c[0] > 0 ? -L : L;
              e.c[0] += sh; e.pts.forEach(p => { p[0] += sh; });
            } else {
              const a = 0.22, [cx, cy] = e.home;
              Object.assign(e, { c: [cx, cy], th: 0, age: 0, pts: refine([[cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a]]) });
            }
          }
        }
      }
      draw();
    }
    function draw() {
      const F = FIELDS[s.field];
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      // velocity arrows on a grid
      ctx.strokeStyle = COL.grid; ctx.fillStyle = COL.grid; ctx.lineWidth = 1.2;
      const g = 0.5;
      for (let x = -Math.floor(xmax() / g) * g; x <= xmax(); x += g)
        for (let y = -Math.floor(ymax() / g) * g; y <= ymax() + 1e-9; y += g) {
          let [u, v] = F.f(x, y); const m = Math.hypot(u, v);
          if (m > 1.6) { u *= 1.6 / m; v *= 1.6 / m; }
          const L = 0.17 * sc();
          arrow(ctx, X(x) - u * L / 2, Y(y) + v * L / 2, X(x) + u * L / 2, Y(y) - v * L / 2, 5);
        }
      // elements
      for (const e of s.els) {
        ctx.beginPath();
        e.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
        ctx.closePath();
        ctx.fillStyle = 'rgba(104,36,109,0.18)'; ctx.fill();
        ctx.strokeStyle = COL.purple; ctx.lineWidth = 2; ctx.stroke();
        if (s.cross) {
          const r = 0.3 * sc(), cx = X(e.c[0]), cy = Y(e.c[1]);
          ctx.lineWidth = 2.5;
          for (let k = 0; k < 2; k++) {
            const a = e.th + k * Math.PI / 2;
            ctx.strokeStyle = k ? COL.ink : COL.red;
            ctx.beginPath(); ctx.moveTo(cx - r * Math.cos(a), cy + r * Math.sin(a)); ctx.lineTo(cx + r * Math.cos(a), cy - r * Math.sin(a)); ctx.stroke();
          }
          ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
        }
      }
      if (s.field === 'vortex' || s.field === 'solid') { ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(X(0), Y(0), 3, 0, 7); ctx.fill(); }
      const w = F.w(0, 0);
      out.innerHTML = '<b>ξ<sub>z</sub> = ' + fmt(w, 1) + '</b> → ' + (w === 0 ? '<b>irrotational</b>' : '<b>rotational</b>') + '. ' + F.note +
        '<br><span style="opacity:.7;font-size:.85em">Purple shape: a material fluid element (its boundary moves with the flow). Cross: turns at the local angular velocity ξ/2.</span>';
    }
    reset();
    animate(root, step);
  }

  function init() {
    document.querySelectorAll('.widget[data-widget]').forEach(root => {
      const k = root.getAttribute('data-widget');
      if (k !== 'nozzle' && k !== 'vorticity') return;
      if (root.dataset.ready) return;
      root.dataset.ready = '1';
      if (k === 'nozzle') nozzle(root);
      if (k === 'vorticity') vorticity(root);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
