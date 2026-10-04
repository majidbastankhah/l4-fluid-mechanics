/* Interactive widgets for L4 Fluid Mechanics, Chapter 3 (turbulence).
 * Usage in any page (notes or slides):
 *   <div class="widget" data-widget="reynolds-decomp"></div>
 *   <div class="widget" data-widget="spectrum"></div>
 *   <script src="../assets/widgets/ch3.js"></script>   (path relative to the page)
 * Plain JavaScript, no libraries. Same conventions as widgets.js.
 */
(function () {
  'use strict';

  // ---------- helpers (same as widgets.js) ----------
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
  function sci(x) { // 3.2 × 10^5 style
    if (!isFinite(x) || x <= 0) return '—';
    const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    if (e >= 2 && e <= 3) return String(Math.round(x));
    if (e >= -1 && e < 2) return x.toPrecision(3);
    return m.toFixed(1) + '×10<sup>' + e + '</sup>';
  }
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
  const COL = { ink: '#222', grid: '#d4d4dc', axis: '#555', purple: '#68246D', red: '#c0392b', blue: '#2b6cb0', green: '#2f855a', orange: '#d97706' };
  // simple seeded random numbers so a realisation can be reproduced
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // =====================================================================
  // 1) REYNOLDS-DECOMP: u(t) = U + u'(t), averaging and turbulence intensity
  //    Synthetic signal: sum of random-phase Fourier modes whose amplitudes
  //    follow the von Karman spectrum S(f) = 4 s^2 T_L / (1 + 70.8 (f T_L)^2)^(5/6)
  //    (integral time scale T_L, f^-5/3 at high frequency). Not a solution of the N-S equations.
  // =====================================================================
  function reynoldsDecomp(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'Reynolds decomposition of a velocity signal: u(t) = U + u′(t)'));
    const ctrl = el('div', { class: 'wctrl' });
    ctrl.innerHTML =
      '<label>U (m/s) <input type="range" min="2" max="15" step="0.5" value="8" data-k="U"><span data-o="U">8</span></label>' +
      '<label>T<sub>I</sub> (%) <input type="range" min="2" max="30" step="1" value="10" data-k="TI"><span data-o="TI">10</span></label>' +
      '<label>integral time scale T<sub>L</sub> (s) <input type="range" min="0.1" max="3" step="0.1" value="0.5" data-k="TL"><span data-o="TL">0.5</span></label>' +
      '<label>averaging window T (s) <input type="range" min="0.2" max="30" step="0.2" value="2" data-k="Tw"><span data-o="Tw">2</span></label>' +
      '<label>lower panel <select data-k="view"><option value="up">u′(t)</option><option value="up2">u′²(t)</option></select></label>' +
      '<label><input type="checkbox" data-k="mov" checked> running average over T</label>' +
      '<label><input type="checkbox" data-k="cum" checked> cumulative mean</label>' +
      '<button class="wbtn" data-k="play">Pause</button><button class="wbtn" data-k="new">New realisation</button>';
    root.appendChild(ctrl);
    const H = 440, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);

    // displayed record: 60 s at 50 samples/s. The modes are periodic over Tp = 4 x 60 s, so the
    // 60 s record is not itself periodic and its sample mean differs slightly from U (as in a real measurement).
    const Ttot = 60, N = 3000, dt = Ttot / N, NP = 4 * N, Tp = NP * dt, M = NP / 2 - 1;
    const s = { U: 8, TI: 10, TL: 0.5, Tw: 2, view: 'up', mov: true, cum: true, playing: true, tc: 0, seed: 7 };
    const q = k => ctrl.querySelector('[data-k="' + k + '"]');
    ['U', 'TI', 'TL', 'Tw'].forEach(k => q(k).addEventListener('input', e => {
      s[k] = parseFloat(e.target.value);
      ctrl.querySelector('[data-o="' + k + '"]').textContent = e.target.value;
      if (!s.playing) draw();
    }));
    q('TL').addEventListener('change', () => { synth(); if (!s.playing) draw(); }); // re-synthesise once the slider is released
    q('view').addEventListener('change', e => { s.view = e.target.value; if (!s.playing) draw(); });
    q('mov').addEventListener('change', e => { s.mov = e.target.checked; if (!s.playing) draw(); });
    q('cum').addEventListener('change', e => { s.cum = e.target.checked; if (!s.playing) draw(); });
    q('play').addEventListener('click', e => { s.playing = !s.playing; e.target.textContent = s.playing ? 'Pause' : 'Play'; if (!s.playing) draw(); });
    q('new').addEventListener('click', () => { s.seed = Math.floor(Math.random() * 1e9); synth(); s.tc = 0; if (!s.playing) draw(); });

    // cos/sin tables for the discrete Fourier synthesis (period = record length)
    const CT = new Float64Array(NP), ST = new Float64Array(NP);
    for (let j = 0; j < NP; j++) { CT[j] = Math.cos(2 * Math.PI * j / NP); ST[j] = Math.sin(2 * Math.PI * j / NP); }
    const g = new Float64Array(N); // unit-variance fluctuation (model variance = 1)
    function synth() {
      const r = rng(s.seed), a = new Float64Array(M + 1), ca = new Float64Array(M + 1), sa = new Float64Array(M + 1);
      let var_ = 0;
      for (let n = 1; n <= M; n++) {
        const f = n / Tp, Sf = 4 * s.TL / Math.pow(1 + 70.8 * (f * s.TL) * (f * s.TL), 5 / 6);
        a[n] = Math.sqrt(2 * Sf / Tp); var_ += 0.5 * a[n] * a[n];
        const ph = 2 * Math.PI * r(); ca[n] = Math.cos(ph); sa[n] = Math.sin(ph);
      }
      const nrm = 1 / Math.sqrt(var_);
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (let n = 1, m = 0; n <= M; n++) { m += j; if (m >= NP) m %= NP; sum += a[n] * (ca[n] * CT[m] - sa[n] * ST[m]); }
        g[j] = sum * nrm;
      }
    }
    synth();

    // layout
    const xL = 62, xR = W - 18, top1 = 30, bot1 = 255, top2 = 290, bot2 = 405;
    const X = t => xL + (xR - xL) * t / Ttot;

    function step(dtReal) {
      if (s.playing) { s.tc += dtReal * 3; if (s.tc > Ttot) s.tc = 0; } // 3 s of signal per second
      draw();
    }

    function draw() {
      const sig = s.TI / 100 * s.U;
      const u = j => s.U + sig * g[j];
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      // ---- top panel: u(t) ----
      const umin = s.U - 3.6 * sig, umax = s.U + 3.6 * sig;
      const Y1 = v => bot1 - (bot1 - top1) * (v - umin) / (umax - umin);
      axes(top1, bot1, umin, umax, Y1, 'u (m/s)', 2);
      const jc = Math.min(N - 1, Math.floor(s.tc / dt));
      // averaging window [tc - T, tc]
      const t0 = Math.max(0, s.tc - s.Tw);
      ctx.fillStyle = 'rgba(217,119,6,0.12)'; ctx.fillRect(X(t0), top1, X(s.tc) - X(t0), bot1 - top1);
      // signal
      ctx.strokeStyle = 'rgba(43,108,176,0.85)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j < N; j++) { const x = X(j * dt), y = Y1(u(j)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      // true mean
      ctx.setLineDash([7, 5]); ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(0), Y1(s.U)); ctx.lineTo(X(Ttot), Y1(s.U)); ctx.stroke(); ctx.setLineDash([]);
      // running (moving) average over the trailing window T
      const nw = Math.max(1, Math.round(s.Tw / dt));
      const cs = new Float64Array(N + 1);
      for (let j = 0; j < N; j++) cs[j + 1] = cs[j] + u(j);
      let mvSum = 0, mvSq = 0, mvN = 0;
      if (s.mov) { ctx.strokeStyle = COL.orange; ctx.lineWidth = 2.2; ctx.beginPath(); }
      for (let j = nw - 1; j < N; j++) {
        const m = (cs[j + 1] - cs[j + 1 - nw]) / nw;
        mvSum += m; mvSq += m * m; mvN++;
        if (s.mov) { const x = X(j * dt), y = Y1(m); j === nw - 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      }
      if (s.mov) ctx.stroke();
      const mvStd = mvN > 1 ? Math.sqrt(Math.max(0, mvSq / mvN - (mvSum / mvN) ** 2)) : NaN;
      // cumulative mean (1/t) * integral_0^t u dt up to the cursor
      if (s.cum) {
        ctx.strokeStyle = COL.purple; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let j = 0; j <= jc; j++) { const x = X(j * dt), y = Y1(cs[j + 1] / (j + 1)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
      // cursor
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(s.tc), top1); ctx.lineTo(X(s.tc), bot1); ctx.stroke();
      // window mean marker
      const jw0 = Math.floor(t0 / dt), wMean = (cs[jc + 1] - cs[jw0]) / Math.max(1, jc + 1 - jw0);
      ctx.strokeStyle = COL.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(X(t0), Y1(wMean)); ctx.lineTo(X(s.tc), Y1(wMean)); ctx.stroke();
      // legend
      ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
      const leg = [[COL.blue, 'u(t)'], [COL.ink, 'U (true mean)'], [COL.red, 'mean over window']];
      if (s.mov) leg.push([COL.orange, 'running average over T']);
      if (s.cum) leg.push([COL.purple, 'cumulative mean']);
      let lx = xL + 6;
      leg.forEach(([c, t]) => { ctx.fillStyle = c; ctx.fillRect(lx, 12, 16, 4); ctx.fillStyle = '#333'; ctx.fillText(t, lx + 20, 18); lx += 28 + ctx.measureText(t).width; });

      // ---- lower panel: u' or u'^2 ----
      let sumUp = 0, sumUp2 = 0;
      for (let j = 0; j < N; j++) { const up = sig * g[j]; sumUp += up; sumUp2 += up * up; }
      const meanUp = sumUp / N, rms = Math.sqrt(sumUp2 / N);
      if (s.view === 'up') {
        const lo = -3.6 * sig, hi = 3.6 * sig, Y2 = v => bot2 - (bot2 - top2) * (v - lo) / (hi - lo);
        axes(top2, bot2, lo, hi, Y2, 'u′ (m/s)', 2);
        ctx.strokeStyle = 'rgba(47,133,90,0.9)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let j = 0; j < N; j++) { const x = X(j * dt), y = Y2(sig * g[j]); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = COL.red; ctx.lineWidth = 1.3;
        [rms, -rms].forEach(v => { ctx.beginPath(); ctx.moveTo(X(0), Y2(v)); ctx.lineTo(X(Ttot), Y2(v)); ctx.stroke(); });
        ctx.setLineDash([]);
        ctx.fillStyle = COL.red; ctx.textAlign = 'right'; ctx.fillText('± u′rms', xR - 4, Y2(rms) - 4);
      } else {
        const hi = 9 * sig * sig, Y2 = v => bot2 - (bot2 - top2) * v / hi;
        axes(top2, bot2, 0, hi, Y2, 'u′² (m²/s²)', 2);
        ctx.fillStyle = 'rgba(47,133,90,0.35)'; ctx.strokeStyle = 'rgba(47,133,90,0.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(0), Y2(0));
        for (let j = 0; j < N; j++) ctx.lineTo(X(j * dt), Y2(Math.min(hi, (sig * g[j]) ** 2)));
        ctx.lineTo(X(Ttot), Y2(0)); ctx.closePath(); ctx.fill();
        ctx.setLineDash([6, 4]); ctx.strokeStyle = COL.red; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(X(0), Y2(rms * rms)); ctx.lineTo(X(Ttot), Y2(rms * rms)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COL.red; ctx.textAlign = 'right'; ctx.fillText('mean of u′² = (u′rms)²', xR - 4, Y2(rms * rms) - 5);
      }
      // time axis label
      ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.font = '13px sans-serif';
      for (let t = 0; t <= Ttot; t += 10) { ctx.fillText(t, X(t), bot2 + 16); }
      ctx.fillText('t (s)', (xL + xR) / 2, bot2 + 32);
      ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(X(s.tc), top2); ctx.lineTo(X(s.tc), bot2); ctx.stroke();

      // ---- readout ----
      const cum = cs[jc + 1] / (jc + 1), est = sig * Math.sqrt(2 * s.TL / s.Tw);
      out.innerHTML =
        '<b style="color:' + COL.purple + '">Cumulative mean</b> over 0–' + fmt(s.tc, 1) + ' s: ' + fmt(cum, 2) + ' m/s (true U = ' + fmt(s.U, 2) +
        ' m/s, error ' + fmt(100 * (cum - s.U) / s.U, 1) + ' %). ' +
        '<b style="color:' + COL.red + '">Mean over the last T = ' + fmt(s.Tw, 1) + ' s</b>: ' + fmt(wMean, 2) + ' m/s.<br>' +
        'Whole record: mean of u′ = ' + fmt(meanUp, 3) + ' m/s (→ 0 as the record gets longer), u′<sub>rms</sub> = √(mean of u′²) = ' + fmt(rms, 2) +
        ' m/s, measured T<sub>I</sub> = u′<sub>rms</sub>/U = ' + fmt(100 * rms / s.U, 1) + ' % (model value ' + s.TI + ' %).<br>' +
        '<b style="color:' + COL.orange + '">Averaging-window effect</b>: the running average over T scatters about U with standard deviation ' + fmt(mvStd, 2) +
        ' m/s; for T ≫ T<sub>L</sub> theory gives ≈ u′<sub>rms</sub>√(2T<sub>L</sub>/T) = ' + fmt(est, 2) + ' m/s' +
        (s.Tw < 5 * s.TL ? ' <i>(T is not ≫ T<sub>L</sub> here, so the estimate is rough)</i>' : '') +
        (s.Tw > 10 ? ' <i>(with T this long the 60 s record holds only a few independent windows, so the measured value is itself uncertain)</i>' : '') +
        '. Make T long compared with T<sub>L</sub> to obtain a reliable mean.' +
        '<br><span style="opacity:.7;font-size:.85em">Synthetic signal: random-phase Fourier modes with a von Kármán spectrum (integral time scale T<sub>L</sub>, f<sup>−5/3</sup> at high frequency); it has realistic statistics but is not a solution of the Navier–Stokes equations. 60 s record, 50 samples/s.</span>';
    }

    function axes(t, b, lo, hi, Yf, lab, nd) {
      ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.font = '12px sans-serif'; ctx.fillStyle = '#444'; ctx.textAlign = 'right';
      const span = hi - lo, stepv = niceStep(span / 5);
      for (let v = Math.ceil(lo / stepv) * stepv; v <= hi + 1e-9; v += stepv) {
        const y = Yf(v); ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke();
        ctx.fillText(fmt(v, stepv < 0.1 ? 2 : (stepv < 1 ? 1 : 0)), xL - 5, y + 4);
      }
      for (let tt = 0; tt <= Ttot; tt += 10) { ctx.beginPath(); ctx.moveTo(X(tt), t); ctx.lineTo(X(tt), b); ctx.stroke(); }
      ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.2; ctx.strokeRect(xL, t, xR - xL, b - t);
      ctx.save(); ctx.translate(16, (t + b) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.fillText(lab, 0, 0); ctx.restore();
    }
    function niceStep(x) { const e = Math.pow(10, Math.floor(Math.log10(x))), m = x / e; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * e; }

    animate(root, step);
  }

  // =====================================================================
  // 2) SPECTRUM: model energy spectrum (Pope 2000, Turbulent Flows, Ch. 6)
  //    E(k) = C eps^(2/3) k^(-5/3) fL(kL) feta(k eta)
  //    fL = (kL / sqrt((kL)^2 + cL))^(5/3 + p0),  feta = exp(-beta [((k eta)^4 + ceta^4)^(1/4) - ceta])
  //    C = 1.5, p0 = 2, beta = 5.2; cL, ceta from  int E dk = k  and  int 2 nu k^2 E dk = eps.
  //    L = k^(3/2)/eps, Re_L = k^(1/2) L / nu, so L/eta = Re_L^(3/4) exactly.
  // =====================================================================
  const CK = 1.5, P0 = 2, BETA = 5.2;
  function Ehat(x, LoEta, cL, ce) { // E / (u_eta^2 eta) as a function of x = kappa*eta
    const kL = x * LoEta;
    const fL = Math.pow(kL / Math.sqrt(kL * kL + cL), 5 / 3 + P0);
    const fe = Math.exp(-BETA * (Math.pow(x * x * x * x + ce * ce * ce * ce, 0.25) - ce));
    return CK * Math.pow(x, -5 / 3) * fL * fe;
  }
  function integrals(lRe, cL, ce) { // returns [int Ehat dx / Re^(1/2), 2 int x^2 Ehat dx]
    const Re = Math.pow(10, lRe), LoEta = Math.pow(Re, 0.75);
    const a = Math.log(1e-4 / LoEta), b = Math.log(30), n = 1600, h = (b - a) / n;
    let I1 = 0, I2 = 0;
    for (let i = 0; i <= n; i++) {
      const x = Math.exp(a + i * h), E = Ehat(x, LoEta, cL, ce), w = (i === 0 || i === n) ? 0.5 : 1;
      I1 += w * E * x; I2 += w * E * x * x * x;
    }
    return [I1 * h / Math.sqrt(Re), 2 * I2 * h];
  }
  // solve for (cL, ceta) by Newton iteration in log variables, with continuation from high Re
  let TABLE = null; // built on first use (only pages with a spectrum widget pay the cost)
  function buildTable() {
    const tab = []; let p = [Math.log(6.78), Math.log(0.40)];
    for (let lRe = 7.2; lRe >= 2.35; lRe -= 0.05) {
      for (let it = 0; it < 30; it++) {
        const r = res(p, lRe);
        if (Math.max(Math.abs(r[0]), Math.abs(r[1])) < 1e-9) break;
        const hh = 1e-5, J = [[0, 0], [0, 0]];
        for (let j = 0; j < 2; j++) { const dp = p.slice(); dp[j] += hh; const rj = res(dp, lRe); J[0][j] = (rj[0] - r[0]) / hh; J[1][j] = (rj[1] - r[1]) / hh; }
        const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
        let d0 = (-r[0] * J[1][1] + r[1] * J[0][1]) / det, d1 = (-J[0][0] * r[1] + J[1][0] * r[0]) / det;
        d0 = Math.max(-0.5, Math.min(0.5, d0)); d1 = Math.max(-0.5, Math.min(0.5, d1));
        p = [p[0] + d0, p[1] + d1];
      }
      tab.push([lRe, Math.exp(p[0]), Math.exp(p[1])]);
    }
    return tab.reverse();
    function res(pp, lRe) { const I = integrals(lRe, Math.exp(pp[0]), Math.exp(pp[1])); return [Math.log(I[0]), Math.log(I[1])]; }
  }
  function consts(lRe) {
    if (!TABLE) TABLE = buildTable();
    const t = TABLE; if (lRe <= t[0][0]) return [t[0][1], t[0][2]];
    for (let i = 1; i < t.length; i++) if (lRe <= t[i][0]) {
      const w = (lRe - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
      return [t[i - 1][1] + w * (t[i][1] - t[i - 1][1]), t[i - 1][2] + w * (t[i][2] - t[i - 1][2])];
    }
    const z = t[t.length - 1]; return [z[1], z[2]];
  }

  function spectrum(root) {
    root.appendChild(el('div', { class: 'wtitle' }, 'The turbulence energy spectrum and the −5/3 law'));
    const ctrl = el('div', { class: 'wctrl' });
    ctrl.innerHTML =
      '<label>log<sub>10</sub> Re<sub>L</sub> <input type="range" min="2.5" max="7" step="0.05" value="5" data-k="lRe"><span data-o="lRe">5.00</span></label>' +
      '<label>view <select data-k="view">' +
      '<option value="E">E(κ), log–log</option>' +
      '<option value="comp">compensated: E κ<sup>5/3</sup> ε<sup>−2/3</sup></option>' +
      '<option value="pre">premultiplied: κE/k and κD/ε</option></select></label>' +
      '<label><input type="checkbox" data-k="ranges" checked> show ranges</label>' +
      '<label><input type="checkbox" data-k="ref" checked> show −5/3 line</label>';
    root.appendChild(ctrl);
    const H = 430, ctx = makeCanvas(root, H);
    const out = el('div', { class: 'readout' });
    root.appendChild(out);
    const s = { lRe: 5, view: 'E', ranges: true, ref: true };
    const q = k => ctrl.querySelector('[data-k="' + k + '"]');
    q('lRe').addEventListener('input', e => { s.lRe = parseFloat(e.target.value); ctrl.querySelector('[data-o="lRe"]').textContent = s.lRe.toFixed(2); draw(); });
    q('view').addEventListener('change', e => { s.view = e.target.value; draw(); });
    q('ranges').addEventListener('change', e => { s.ranges = e.target.checked; draw(); });
    q('ref').addEventListener('change', e => { s.ref = e.target.checked; draw(); });

    const xL = 78, xR = W - 20, yT = 22, yB = H - 58;
    const lxmin = -1, lxmax = 6; // log10(kappa L)
    const X = lk => xL + (xR - xL) * (lk - lxmin) / (lxmax - lxmin);

    function draw() {
      const Re = Math.pow(10, s.lRe), LoEta = Math.pow(Re, 0.75), c = consts(s.lRe), cL = c[0], ce = c[1];
      // sample the spectrum: E/(kL) = Ehat / (Re^(1/2) L/eta), with x = kL / (L/eta)
      const n = 500, lk = [], EkL = [], comp = [], preE = [], preD = [];
      for (let i = 0; i <= n; i++) {
        const l = lxmin + (lxmax - lxmin) * i / n, kL = Math.pow(10, l), x = kL / LoEta;
        const Eh = Ehat(x, LoEta, cL, ce), e = Eh / (Math.sqrt(Re) * LoEta);
        lk.push(l); EkL.push(e);
        comp.push(e * Math.pow(kL, 5 / 3));          // E kappa^(5/3) eps^(-2/3) = (E/kL)(kL)^(5/3)
        preE.push(kL * e);                            // kappa E / k
        preD.push(kL * 2 * e * kL * kL / Re);         // kappa D / eps, D = 2 nu kappa^2 E
      }
      // fractions of k and eps in the energy-containing and dissipation ranges (trapezoid in ln kappa)
      const lEI = Math.log10(12 * Math.PI), lDI = Math.log10(2 * Math.PI / 60 * LoEta);
      let kt = 0, kEI = 0, et = 0, eDI = 0;
      for (let i = 1; i <= n; i++) {
        const dl = (lk[i] - lk[i - 1]) * Math.LN10, a = 0.5 * (preE[i] + preE[i - 1]) * dl, b = 0.5 * (preD[i] + preD[i - 1]) * dl;
        kt += a; et += b; if (lk[i] <= lEI) kEI += a; if (lk[i] >= lDI) eDI += b;
      }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      // ranges
      if (s.ranges) {
        const xa = X(Math.min(lEI, lxmax)), xb = X(Math.min(Math.max(lDI, lxmin), lxmax));
        ctx.fillStyle = 'rgba(217,119,6,0.10)'; ctx.fillRect(xL, yT, xa - xL, yB - yT);
        if (lDI > lEI) { ctx.fillStyle = 'rgba(47,133,90,0.10)'; ctx.fillRect(xa, yT, xb - xa, yB - yT); }
        ctx.fillStyle = 'rgba(43,108,176,0.08)'; ctx.fillRect(Math.max(xb, xa), yT, xR - Math.max(xb, xa), yB - yT);
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#7a4a00';
        ctx.fillText('energy-containing', (xL + xa) / 2, yT + 16);
        if (lDI > lEI + 0.25) { ctx.fillStyle = COL.green; ctx.fillText('inertial subrange', (xa + xb) / 2, yT + 16); }
        ctx.fillStyle = COL.blue; ctx.fillText('dissipation', (Math.max(xb, xa) + xR) / 2, yT + 16);
      }
      // axes and curves
      let Yf, ylab;
      if (s.view === 'E') {
        const lymin = -14, lymax = 0.5; Yf = v => yB - (yB - yT) * (Math.log10(Math.max(v, 1e-300)) - lymin) / (lymax - lymin);
        ylab = 'E(κ) / (k L)';
        logGridY(lymin, lymax, Yf);
        if (s.ref) { // C (kL)^(-5/3)
          ctx.setLineDash([6, 5]); ctx.strokeStyle = '#777'; ctx.lineWidth = 1.3; ctx.beginPath();
          for (let i = 0; i <= 60; i++) { const l = 0 + 6 * i / 60, y = Yf(CK * Math.pow(10, -5 / 3 * l)); i ? ctx.lineTo(X(l), y) : ctx.moveTo(X(l), y); }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#555'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText('slope −5/3:  C_K ε^(2/3) κ^(−5/3)', X(2.3) + 6, Yf(CK * Math.pow(10, -5 / 3 * 2.3)) - 8);
        }
        curve(lk, EkL, Yf, COL.purple, 3);
      } else if (s.view === 'comp') {
        Yf = v => yB - (yB - yT) * v / 2.2; ylab = 'E κ^(5/3) ε^(−2/3)';
        linGridY(0, 2.2, 0.5, Yf);
        if (s.ref) {
          ctx.setLineDash([6, 5]); ctx.strokeStyle = '#777'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(xL, Yf(CK)); ctx.lineTo(xR, Yf(CK)); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#555'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('C_K = 1.5 (plateau ⇔ −5/3 law)', xR - 6, Yf(CK) - 7);
        }
        curve(lk, comp, Yf, COL.purple, 3);
      } else {
        const ym = Math.max(Math.max.apply(null, preE), Math.max.apply(null, preD)) * 1.2;
        Yf = v => yB - (yB - yT) * v / ym; ylab = 'premultiplied spectra';
        linGridY(0, ym, ym > 0.5 ? 0.1 : 0.05, Yf);
        curve(lk, preE, Yf, COL.purple, 3); curve(lk, preD, Yf, COL.blue, 3);
        ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
        const iE = preE.indexOf(Math.max.apply(null, preE)), iD = preD.indexOf(Math.max.apply(null, preD));
        ctx.fillStyle = COL.purple; ctx.fillText('κE(κ)/k  (energy)', X(lk[iE]) + 8, Yf(preE[iE]) - 6);
        ctx.fillStyle = COL.blue; ctx.textAlign = 'right'; ctx.fillText('κD(κ)/ε  (dissipation)', X(lk[iD]) - 10, Yf(preD[iD]) + 4);
      }
      // x axis: decades of kappa L, plus marks at kappa ~ 1/L and kappa ~ 1/eta
      ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.fillStyle = '#444'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      for (let l = lxmin; l <= lxmax; l++) {
        ctx.beginPath(); ctx.moveTo(X(l), yT); ctx.lineTo(X(l), yB); ctx.stroke();
        ctx.fillText('10', X(l) - 4, yB + 16); ctx.font = '9px sans-serif'; ctx.fillText(String(l), X(l) + 8, yB + 9); ctx.font = '12px sans-serif';
      }
      ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.2; ctx.strokeRect(xL, yT, xR - xL, yB - yT);
      ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.fillText('κL', (xL + xR) / 2, yB + 34);
      const xeta = X(Math.log10(LoEta));
      ctx.strokeStyle = COL.red; ctx.lineWidth = 2;
      [[X(0), 'κ = 1/L'], [xeta, 'κ = 1/η']].forEach(([x, t]) => {
        if (x < xL || x > xR) return;
        ctx.beginPath(); ctx.moveTo(x, yB); ctx.lineTo(x, yB - 10); ctx.stroke();
        ctx.fillStyle = COL.red; ctx.fillText(t, x, yB + 48);
      });
      if (xeta <= xR) { // separation arrow
        ctx.strokeStyle = COL.red; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(0) + 30, yB + 44); ctx.lineTo(xeta - 30, yB + 44); ctx.stroke();
      }
      ctx.save(); ctx.translate(18, (yT + yB) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillStyle = '#333'; ctx.font = '13px sans-serif'; ctx.fillText(ylab, 0, 0); ctx.restore();

      const Rl = Math.sqrt(20 / 3 * Re);
      out.innerHTML =
        '<b>Re<sub>L</sub> = ' + sci(Re) + '</b> (R<sub>λ</sub> ≈ ' + fmt(Rl, 0) + '): ' +
        '<b style="color:' + COL.red + '">L/η = Re<sub>L</sub><sup>3/4</sup> = ' + sci(LoEta) + '</b>, τ<sub>L</sub>/τ<sub>η</sub> = Re<sub>L</sub><sup>1/2</sup> = ' + sci(Math.sqrt(Re)) +
        '; a DNS would need ≳ (L/η)<sup>3</sup> ≈ ' + sci(LoEta * LoEta * LoEta) + ' grid points.<br>' +
        'In this model ' + fmt(100 * kEI / kt, 0) + ' % of k lies in the energy-containing range (κ < κ<sub>EI</sub>) and ' +
        fmt(100 * eDI / et, 0) + ' % of ε is dissipated in the dissipation range (κ > κ<sub>DI</sub>). ' +
        (lDI > lEI ? 'The inertial subrange spans a factor ' + sci(Math.pow(10, lDI - lEI)) + ' in κ.' : '<i>At this Reynolds number there is no inertial subrange.</i>') +
        '<br><span style="opacity:.7;font-size:.85em">Model spectrum of Pope (2000, <i>Turbulent Flows</i>, Ch. 6): E = C<sub>K</sub>ε<sup>2/3</sup>κ<sup>−5/3</sup>f<sub>L</sub>(κL)f<sub>η</sub>(κη), C<sub>K</sub> = 1.5, with c<sub>L</sub> = ' + fmt(cL, 2) + ', c<sub>η</sub> = ' + fmt(ce, 3) +
        ' chosen so that ∫E dκ = k and ∫2νκ²E dκ = ε. L = k<sup>3/2</sup>/ε, Re<sub>L</sub> = k<sup>1/2</sup>L/ν. Range boundaries are indicative: ℓ<sub>EI</sub> ≈ L/6, ℓ<sub>DI</sub> ≈ 60η (κ = 2π/ℓ).</span>';
    }
    function curve(lk, v, Yf, col, lw) {
      ctx.save(); ctx.beginPath(); ctx.rect(xL, yT, xR - xL, yB - yT); ctx.clip();
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      let started = false;
      for (let i = 0; i < lk.length; i++) {
        const y = Yf(v[i]); if (!isFinite(y)) continue;
        started ? ctx.lineTo(X(lk[i]), y) : ctx.moveTo(X(lk[i]), y); started = true;
      }
      ctx.stroke(); ctx.restore();
    }
    function logGridY(lo, hi, Yf) {
      ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.fillStyle = '#444'; ctx.textAlign = 'right';
      for (let l = Math.ceil(lo); l <= hi; l += 2) {
        const y = Yf(Math.pow(10, l)); ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke();
        ctx.font = '12px sans-serif'; ctx.fillText('10', xL - 14, y + 5); ctx.font = '9px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(String(l), xL - 13, y - 1); ctx.textAlign = 'right';
      }
    }
    function linGridY(lo, hi, st, Yf) {
      ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.fillStyle = '#444'; ctx.textAlign = 'right'; ctx.font = '12px sans-serif';
      for (let v = lo; v <= hi + 1e-9; v += st) { const y = Yf(v); ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke(); ctx.fillText(fmt(v, st < 0.1 ? 2 : 1), xL - 6, y + 4); }
    }
    draw();
  }

  function init() {
    document.querySelectorAll('.widget[data-widget]').forEach(root => {
      if (root.dataset.ready) return;
      const k = root.getAttribute('data-widget');
      if (k !== 'reynolds-decomp' && k !== 'spectrum') return;
      root.dataset.ready = '1';
      if (k === 'reynolds-decomp') reynoldsDecomp(root);
      if (k === 'spectrum') spectrum(root);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
