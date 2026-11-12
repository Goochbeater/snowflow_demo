/* ==== p99b_touch_layout.js ==== */
/* TOUCH LAYOUT — the player's own layout, as action games on phones have it (PAUSE → LAYOUT): for each way of playing
   (on foot, on the broom, in a match) every button can be dragged where the thumb wants it and made bigger or smaller,
   and the whole layer can be made more or less see-through. What moves is stored as an offset from the button's own
   place in units of the layout's scale, so a layout made on one screen carries to another. The spells follow what they
   hang from: the four petals the SPELLS button, the fighting arc the CAST button. */
{ const C = TOUCH.cfg; C.pos = C.pos || {}; C.sz = C.sz || {}; if (C.alpha == null) C.alpha = 1;
  const MODES = [['foot', 'ON FOOT'], ['fly', 'BROOM'], ['match', 'MATCH']], FIXED = { skip: 1, close: 1 }, SPELLS = ['s0', 's1', 's2', 's3', 'swap', 'lumos'];
  const E = TOUCH.editor = { on: false, mode: 'foot', sel: null, drag: null };
  const css = document.createElement('style'); css.textContent = `
#tc { --ta: 1; } #tc > .tcB { opacity: var(--ta); } #tc > .tcB.dim { opacity: calc(var(--ta) * .4); } #tc > .tcB.dn { opacity: 1; } #tc #tcStick:not(.act) { opacity: calc(var(--ta) * .9); }
#tc.editing #tcZone { display: block !important; background: rgba(6,5,8,.42); pointer-events: none; }
#tc.editing > .tcB { outline: 1px dashed rgba(240,207,124,.55); outline-offset: 4px; cursor: grab; opacity: 1 !important; animation: none !important; }
#tc.editing > .tcB.esel { outline: 2px solid #f0cf7c; outline-offset: 5px; box-shadow: 0 0 18px rgba(240,207,124,.55); }
#tc.editing > .tcB b, #tc.editing > .tcB.sp b.sn { display: block !important; }
#tcEdit { position: absolute; left: 50%; top: max(10px, env(safe-area-inset-top)); transform: translateX(-50%); z-index: 45; pointer-events: auto; display: none; flex-direction: column; gap: 7px; align-items: center;
  max-width: min(94vw, 760px); padding: 8px 10px; border-radius: 14px; background: rgba(12,9,6,.92); border: 1px solid rgba(240,207,124,.4); box-shadow: 0 10px 30px rgba(0,0,0,.5); font: 400 12px 'HLA', Georgia, serif; letter-spacing: .12em; color: #f1e4c6; }
#tcEdit.on { display: flex; } #tcEdit .r1, #tcEdit .r2 { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: nowrap; } #tcEdit .lb { font-size: 10.5px; letter-spacing: .16em; color: #cbbf9f; } #tcEdit .sp2 { width: 1px; height: 24px; background: rgba(240,207,124,.25); margin: 0 4px; }
body.tcEditing #hlHud, body.tcEditing #hlToast { visibility: hidden !important; }
#tcEdit b { font-weight: 400; color: #f0cf7c; margin-right: 4px; white-space: nowrap; } #tcEdit .seg { display: flex; border: 1px solid rgba(240,207,124,.35); border-radius: 9px; overflow: hidden; }
#tcEdit button { font: inherit; letter-spacing: .1em; color: #f1e4c6; background: rgba(255,255,255,.04); border: 0; padding: 8px 11px; min-height: 36px; cursor: pointer; white-space: nowrap; }
#tcEdit .seg button + button { border-left: 1px solid rgba(240,207,124,.25); } #tcEdit .seg button.on { background: linear-gradient(#f3d488, #c9973f); color: #241505; }
#tcEdit .pill { border: 1px solid rgba(240,207,124,.35); border-radius: 9px; } #tcEdit .go { background: linear-gradient(#f6dc94, #c9973f); color: #241505; border-radius: 9px; }
#tcEdit output { min-width: 3.4em; text-align: center; font-size: 12px; color: #f0cf7c; } #tcEdit button:disabled { opacity: .35; cursor: default; } #tcEdit .tip { flex-basis: 100%; text-align: center; font: italic 12px 'HLB', Georgia, serif; letter-spacing: .02em; opacity: .8; }
@media (max-height: 380px) { #tcEdit { top: 6px; padding: 6px 8px; gap: 5px; } #tcEdit .r1, #tcEdit .r2 { gap: 6px; } #tcEdit button { padding: 6px 9px; min-height: 32px; } #tcEdit .tip { display: none; } }`;
  document.head.appendChild(css);
  /* the stored layout applied after every other placing of the buttons */
  const off = (mode, id) => (C.pos[mode] || {})[id], scl = (mode, id) => (C.sz[mode] || {})[id] || 1;
  const move = (b, dx, dy) => { const x = parseFloat(b.style.left) || 0, y = parseFloat(b.style.top) || 0, r = parseFloat(b.style.getPropertyValue('--r')) || 24;
    b.style.left = clamp(x + dx, r + 4, window.innerWidth - r - 4).toFixed(1) + 'px'; b.style.top = clamp(y + dy, r + 4, window.innerHeight - r - 4).toFixed(1) + 'px'; };
  TOUCH.baseFix = TOUCH.baseFix || [];   // (later modules that re-seat buttons do it here, before the player's offsets)
  const l0 = TOUCH.layout; TOUCH.layout = function () { const r = l0.apply(this, arguments); if (!TOUCH.root) return r; for (const f of TOUCH.baseFix) f(); const m = E.on ? E.mode : TOUCH.mode, u = TOUCH.u, P = C.pos[m] || {}, Z = C.sz[m] || {};
    TOUCH.root.style.setProperty('--ta', String(C.alpha));
    const W = TOUCH.wheel, calm = m === 'foot' && W && !W.fight;
    for (const id in TOUCH.btn) { if (FIXED[id]) continue; const b = TOUCH.btn[id]; let o = P[id];
      if (SPELLS.includes(id) && m === 'foot') o = calm ? P.wheel : P.cast;   // (the petals go with the wheel, the fighting arc with CAST)
      if (o) move(b, o[0] * u, o[1] * u);
      const z = SPELLS.includes(id) && m === 'foot' ? 1 : Z[id] || 1; if (z !== 1) { const rr = parseFloat(b.style.getPropertyValue('--r')) || 24; b.style.setProperty('--r', (rr * z).toFixed(1) + 'px'); } }
    return r; };
  /* while the editor is open the layer shows the chosen way of playing, every button of it, and nothing presses */
  const mn0 = TOUCH.modeNow; TOUCH.modeNow = function () { return E.on ? E.mode : mn0.apply(this, arguments); };
  const f0 = TOUCH.frame; TOUCH.frame = function () { const r = f0.apply(this, arguments); if (E.on && TOUCH.root) { for (const id in TOUCH.DEF) { TOUCH.btn[id].classList.toggle('on', !FIXED[id] && TOUCH.DEF[id][2].split(' ').includes(E.mode)); }
      if (E.mode === 'foot') { for (const id of SPELLS) TOUCH.btn[id].classList.remove('on'); if (TOUCH.btn.wheel) TOUCH.btn.wheel.classList.add('on'); } } return r; };
  const p0 = TOUCH.press; TOUCH.press = function () { if (E.on) return; return p0.apply(this, arguments); };
  const ui = document.createElement('div'); ui.id = 'tcEdit';
  const draw = () => { const s = E.sel, z = s ? scl(E.mode, s) : 1;
    ui.innerHTML = `<div class="r1"><b>CONTROLS</b><div class="seg">${MODES.map(([k, n]) => `<button data-m="${k}" class="${k === E.mode ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="r2"><span class="lb">SIZE</span><button class="pill" data-z="-" ${s ? '' : 'disabled'}>−</button><output>${s ? Math.round(z * 100) + '%' : '—'}</output><button class="pill" data-z="+" ${s ? '' : 'disabled'}>+</button><i class="sp2"></i>
      <span class="lb">OPACITY</span><button class="pill" data-a="-">−</button><output>${Math.round(C.alpha * 100)}%</output><button class="pill" data-a="+">+</button><i class="sp2"></i>
      <button class="pill" data-r="1">RESET</button><button class="go" data-d="1">DONE</button></div>
      <div class="tip">Drag a button to move it · tap one to size it</div>`;
    ui.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { E.mode = b.dataset.m; E.sel = null; mark(); TOUCH.frame(); TOUCH.layout(); draw(); });
    ui.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => { if (!E.sel) return; const Z = C.sz[E.mode] = C.sz[E.mode] || {}; Z[E.sel] = clamp(+((Z[E.sel] || 1) + (b.dataset.z === '+' ? 0.1 : -0.1)).toFixed(2), 0.7, 1.5); if (Z[E.sel] === 1) delete Z[E.sel]; TOUCH.save(); TOUCH.layout(); draw(); });
    ui.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { C.alpha = clamp(+(C.alpha + (b.dataset.a === '+' ? 0.1 : -0.1)).toFixed(1), 0.4, 1); TOUCH.save(); TOUCH.layout(); draw(); });
    ui.querySelector('[data-r]').onclick = () => { delete C.pos[E.mode]; delete C.sz[E.mode]; E.sel = null; mark(); TOUCH.save(); TOUCH.layout(); draw(); };
    ui.querySelector('[data-d]').onclick = () => E.close(); };
  const mark = () => { for (const id in TOUCH.btn) TOUCH.btn[id].classList.toggle('esel', id === E.sel); };
  E.open = function () { if (!TOUCH.root) return; if (!ui.isConnected) document.body.appendChild(ui); E.on = true; E.mode = TOUCH.mode && TOUCH.mode !== 'wait' && MODES.some(([k]) => k === TOUCH.mode) ? TOUCH.mode : HL.Q && HL.Q.on ? 'match' : PLAYER.state === 'fly' ? 'fly' : 'foot';
    E.prevMode = TOUCH.mode; TOUCH.mode = ''; HL.ui.screen(''); TOUCH.root.classList.add('editing'); document.body.classList.add('tcEditing'); ui.classList.add('on'); E.sel = null; draw(); TOUCH.frame(); TOUCH.layout(); mark(); };
  E.close = function () { E.on = false; E.drag = null; E.sel = null; mark(); TOUCH.root.classList.remove('editing'); document.body.classList.remove('tcEditing'); ui.classList.remove('on'); TOUCH.mode = ''; TOUCH.frame(); TOUCH.layout(); if (MG.state === 'pause') { MG.state = 'play'; HL.ui.pause(); } };
  /* dragging: the button follows the finger; its offset is stored when the finger lifts */
  const down = (e) => { if (!E.on) return; const b = e.target.closest && e.target.closest('#tc > .tcB'); if (!b) return; e.preventDefault(); e.stopPropagation(); const id = b.dataset.id; if (FIXED[id]) return;
    E.sel = SPELLS.includes(id) ? (TOUCH.wheel && !TOUCH.wheel.fight ? 'wheel' : 'cast') : id; mark(); draw();
    E.drag = { id: E.sel, pid: e.pointerId, x: e.clientX, y: e.clientY, x0: parseFloat(TOUCH.btn[E.sel].style.left) || 0, y0: parseFloat(TOUCH.btn[E.sel].style.top) || 0 }; };
  const moveE = (e) => { const D = E.drag; if (!E.on || !D || e.pointerId !== D.pid) return; e.preventDefault(); const b = TOUCH.btn[D.id], r = parseFloat(b.style.getPropertyValue('--r')) || 24;
    b.style.left = clamp(D.x0 + e.clientX - D.x, r + 4, innerWidth - r - 4) + 'px'; b.style.top = clamp(D.y0 + e.clientY - D.y, r + 4, innerHeight - r - 4) + 'px'; };
  const up = (e) => { const D = E.drag; if (!E.on || !D || e.pointerId !== D.pid) return; E.drag = null; const dx = (e.clientX - D.x) / TOUCH.u, dy = (e.clientY - D.y) / TOUCH.u; if (Math.hypot(dx, dy) < 2) return;
    const P = C.pos[E.mode] = C.pos[E.mode] || {}, o = P[D.id] || [0, 0]; P[D.id] = [+(o[0] + dx).toFixed(1), +(o[1] + dy).toFixed(1)]; TOUCH.save(); TOUCH.layout(); };
  window.addEventListener('pointerdown', down, true); window.addEventListener('pointermove', moveE, true); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
  /* the way in: LAYOUT beside the other touch settings in the pause menu */
  const pz0 = HL.ui.pause; HL.ui.pause = function () { const r = pz0.apply(this, arguments); if (!TOUCH.on || MG.state !== 'pause') return r; const row = HL.ui.el.Screen.querySelector('.tcSet');
    if (row && !row.querySelector('[data-t="lay"]')) { row.insertAdjacentHTML('beforeend', '<div class="hlBtn" data-t="lay">LAYOUT</div>'); row.querySelector('[data-t="lay"]').onclick = (e) => { e.stopPropagation(); E.open(); }; } return r; };
}
