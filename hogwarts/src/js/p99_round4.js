/* ==== p99_round4.js ==== */
/* ROUND 4 — the spell wheel (round 3, #10: "about 40 % of a 412-px frame is chrome… Genshin keeps 7–8 targets"). Away from a
   fight the four spells, the set swap and Protego fold into one SPELLS button: press it and the four spells fan out round
   it; slide onto one and let go to cast it, or let go on the button and tap a spell in the next three seconds. With a foe
   within 28 m (or a practice dummy within 14), or in a duel, the spells stand in their arc as before, one tap each. */
{ TOUCH.ICON.wheel = 'M12 2.8 l2.3 6.9 l6.9 2.3 l-6.9 2.3 l-2.3 6.9 l-2.3 -6.9 l-6.9 -2.3 l6.9 -2.3 z';
  TOUCH.DEF.wheel = ['wheel', 'SPELLS', 'foot', 'tap', ['wheel']];
  const W = TOUCH.wheel = { open: false, pid: null, hot: -1, fight: false, calmT: 0, stick: 0, moved: false, c: [0, 0], k: '' };
  const DIRS = [30, 85, 140, 195], SWAP = 250, PET = ['s0', 's1', 's2', 's3', 'swap'];
  const mark = (h) => { if (h === W.hot) return; W.hot = h; PET.forEach((id, i) => TOUCH.btn[id] && TOUCH.btn[id].classList.toggle('hot', i === h)); if (h >= 0) TOUCH.buzz(4); };
  const close = () => { if (!W.open) return; W.open = false; W.pid = null; W.stick = 0; mark(-1); };
  const css = document.createElement('style'); css.textContent = `
#tc .tcB[data-id="wheel"] { border: 2px solid transparent; background: radial-gradient(circle at 50% 38%, rgba(54,44,26,.7), rgba(8,7,10,.74) 70%) padding-box, conic-gradient(from -45deg, var(--w, #d9b86a, #d9b86a)) border-box; }
#tc .tcB[data-id="wheel"] svg { width: 46%; height: 46%; color: #f6e7bf; }
#tc .tcB[data-id="wheel"].open { transform: scale(.88); }
#tc .tcB[data-id="wheel"].open::before { content: ''; position: absolute; left: 50%; top: 50%; width: calc(236px * var(--u)); height: calc(236px * var(--u)); transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none; z-index: -1;
  background: radial-gradient(circle, rgba(8,6,10,.52) 24%, rgba(8,6,10,.34) 56%, rgba(8,6,10,0) 71%); }
#tc .tcB[data-id="wheel"].glow { animation: tcGlow .9s infinite alternate; }
#tc .tcB.petal.on { animation: tcPetal .17s cubic-bezier(.2,.9,.3,1.25); }
@keyframes tcPetal { from { opacity: 0; transform: scale(.35); } }
#tc .tcB.petal.hot { transform: scale(1.16); border-color: #fff1c4; box-shadow: 0 0 16px var(--c, #e8c56e), inset 0 0 0 1px rgba(0,0,0,.5); }
#tc.wheelOn .tcB.sp b.sn { display: block !important; }`;
  document.head.appendChild(css);
  /* the button's rim carries the four spells' colours, so the set on it shows before it opens */
  const si0 = TOUCH.spellIcons; TOUCH.spellIcons = function () { const r = si0.apply(this, arguments); const B = TOUCH.btn.wheel; if (B) { const c = []; for (let i = 0; i < 4; i++) { const S = HL.SPELLS[HL.BAR[TOUCH.set * 4 + i]]; c.push(S ? `rgb(${S.col.map((v) => Math.round(Math.min(1, v * 0.7 + 0.3) * 255)).join(',')})` : '#d9b86a'); }
    B.style.setProperty('--w', c.map((x, i) => `${x} ${i * 25}% ${i * 25 + 25}%`).join(', ')); } return r; };
  /* where things stand: the button in the middle of the old arc, the spells round it while the wheel is the way to cast */
  const l0 = TOUCH.layout; TOUCH.layout = function () { const r = l0.apply(this, arguments); if (!TOUCH.root || !TOUCH.btn.wheel) return r;
    const u = TOUCH.u, cx = window.innerWidth - 74 * u, cy = window.innerHeight - 74 * u, a = 131 * D2R, wx = cx + Math.cos(a) * 176 * u, wy = cy - Math.sin(a) * 176 * u;
    const put = (id, x, y, rr) => { const b = TOUCH.btn[id]; b.style.left = x.toFixed(1) + 'px'; b.style.top = y.toFixed(1) + 'px'; b.style.setProperty('--r', Math.max(rr * u, 19).toFixed(1) + 'px'); };
    put('wheel', wx, wy, 28);
    if (!W.fight) { DIRS.forEach((d, i) => put('s' + i, wx + Math.cos(d * D2R) * 78 * u, wy - Math.sin(d * D2R) * 78 * u, 25)); put('swap', wx + Math.cos(SWAP * D2R) * 68 * u, wy - Math.sin(SWAP * D2R) * 68 * u, 17); }
    return r; };
  const show = () => { const foot = TOUCH.mode === 'foot', calm = foot && !W.fight, k = TOUCH.mode + (W.fight ? 'F' : 'C') + (W.open ? 'O' : ''); if (k === W.k) return; W.k = k;
    const B = TOUCH.btn.wheel; B.classList.toggle('on', calm); B.classList.toggle('open', calm && W.open); B.classList.toggle('glow', calm && !TOUCH.cfg.wheel);
    for (const id of PET) { TOUCH.btn[id].classList.toggle('on', foot && (!calm || W.open)); TOUCH.btn[id].classList.toggle('petal', calm); }
    if (calm && TOUCH.held.protego !== undefined) TOUCH.release('protego'); TOUCH.btn.protego.classList.toggle('on', foot && !calm); TOUCH.root.classList.toggle('wheelOn', calm && W.open); };
  /* a fight is near: a foe within 28 m, a dummy within 14, a duel; and it is over three seconds after the last of them */
  const f0 = TOUCH.frame; TOUCH.frame = function () { const r = f0.apply(this, arguments); if (!TOUCH.btn.wheel) return r;
    const a = PLAYER.a, D = HL.duel; let near = !!(D && D.on);
    if (!near && a) for (const f of HL.foes || []) if (f.alive && Math.hypot(f.x - a.x, f.z - a.z) < 28) { near = true; break; }
    if (!near && a) for (const f of HL.dummies || []) if (Math.hypot(f.x - a.x, f.z - a.z) < 14) { near = true; break; }
    if (near) { W.calmT = 0; if (!W.fight) { W.fight = true; close(); TOUCH.layout(); } } else if (W.fight && (W.calmT += MG.rdt) > 3) { W.fight = false; TOUCH.layout(); }
    if (TOUCH.mode !== 'foot') close(); else if (W.open && W.pid === null && (W.stick -= MG.rdt) <= 0) close();
    show(); return r; };
  const p0 = TOUCH.press, r0 = TOUCH.release;
  TOUCH.press = function (id, pid) {
    if (id === 'wheel') { TOUCH.held.wheel = pid; TOUCH.btn.wheel.classList.add('dn'); if (W.open && W.pid === null) { W.closing = true; return; }
      W.open = true; W.pid = pid; W.moved = false; mark(-1); TOUCH.buzz(5); if (!TOUCH.cfg.wheel) { TOUCH.cfg.wheel = 1; TOUCH.save(); } show(); return; }
    const r = p0.apply(this, arguments);
    if (!W.fight && W.open) { if (/^s\d$/.test(id)) setTimeout(close, 150); else if (id === 'swap') W.stick = 3; }
    return r; };
  TOUCH.release = function (id, pid) {
    if (id !== 'wheel') return r0.apply(this, arguments);
    if (TOUCH.held.wheel === undefined || (pid !== undefined && TOUCH.held.wheel !== pid)) return; delete TOUCH.held.wheel; TOUCH.btn.wheel.classList.remove('dn'); W.pid = null;
    if (W.closing) { W.closing = false; close(); return; }
    const h = W.hot; mark(-1);
    if (h >= 0 && h < 4) { p0('s' + h, -7); r0('s' + h, -7); setTimeout(close, 150); }
    else if (h === 4) { p0('swap', -7); r0('swap', -7); W.stick = 3; }
    else if (W.moved) close(); else W.stick = 3; };
  /* sliding off the button picks the spell in that direction (more than 34 px out, within 40° of it) */
  const b0 = TOUCH.build; TOUCH.build = function () { const had = !!TOUCH.root, r = b0.apply(this, arguments); const B = TOUCH.btn.wheel; if (had || !B) return r;
    B.addEventListener('pointerdown', (e) => { const q = B.getBoundingClientRect(); W.c = [q.left + q.width / 2, q.top + q.height / 2]; W.x0 = e.clientX; W.y0 = e.clientY; });
    B.addEventListener('pointermove', (e) => { if (!W.open || W.pid !== e.pointerId) return; const dx = e.clientX - W.c[0], dy = e.clientY - W.c[1], u = TOUCH.u;
      if (Math.hypot(e.clientX - W.x0, e.clientY - W.y0) > 10) W.moved = true;
      let h = -1; if (Math.hypot(dx, dy) > 34 * u) { const ang = Math.atan2(-dy, dx) / D2R; let best = 40; DIRS.concat([SWAP]).forEach((g, i) => { const df = Math.abs(((ang - g + 540) % 360) - 180); if (df < best) { best = df; h = i; } }); }
      mark(h); });
    TOUCH.spellIcons(); return r; };
}
