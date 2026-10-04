(function () {
  // ---- filters ----
  const state = { ch: 'all', d: 'all' };
  const probs = Array.from(document.querySelectorAll('.problem'));
  function apply() {
    probs.forEach(p => {
      const ok = (state.ch === 'all' || p.dataset.ch === state.ch) && (state.d === 'all' || p.dataset.d === state.d);
      p.style.display = ok ? '' : 'none';
    });
    // hide chapter / topic headings that no longer contain a visible problem
    document.querySelectorAll('section.level2, section.level3').forEach(sec => {
      const ps = Array.from(sec.querySelectorAll('.problem'));
      if (!ps.length) return;
      sec.style.display = ps.some(p => p.style.display !== 'none') ? '' : 'none';
    });
  }
  document.querySelectorAll('#filters button').forEach(b => b.addEventListener('click', () => {
    state[b.dataset.f] = b.dataset.v;
    document.querySelectorAll('#filters button[data-f="' + b.dataset.f + '"]').forEach(x => x.classList.toggle('on', x === b));
    apply();
  }));
  // ---- answer checkers ----
  document.querySelectorAll('.checker').forEach(c => {
    const inp = c.querySelector('input'), fb = c.querySelector('.fb');
    const ans = parseFloat(c.dataset.answer), tol = parseFloat(c.dataset.tol || '0.01');
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value.replace(',', '.'));
      if (inp.value.trim() === '' || isNaN(v)) { fb.textContent = ''; return; }
      const ok = Math.abs(v - ans) <= tol * Math.max(Math.abs(ans), 1e-12);
      fb.textContent = ok ? '✓' : '✗'; fb.style.color = ok ? '#2f855a' : '#c0392b';
    });
  });
  // ---- "done" ticks, saved per browser ----
  const KEY = 'l4fm-problems-done';
  let done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }
  function progress() {
    const n = probs.filter(p => done[p.id]).length;
    const el = document.getElementById('progress');
    if (el) el.textContent = n + ' / ' + probs.length + ' done';
  }
  probs.forEach(p => {
    const cb = p.querySelector('label.done input');
    if (!cb) return;
    cb.checked = !!done[p.id];
    cb.addEventListener('change', () => {
      done[p.id] = cb.checked;
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
      progress();
    });
  });
  progress();
})();
