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

/* the four houses' arms drawn as heraldry (round 3, #19: "the lion reads as a ghost, the badger as a blob"): a lion
   rampant, a serpent erect, an eagle displayed, a badger statant with its striped face. Each charge is a list of layers
   [path, colour (1 the field, 2 the charge), stroke width (0 = filled), opacity] in the shield's 100 x 116 box, drawn
   both into the SVG crests (menus, HUD, Sorting) and onto the canvas crests (clubs, the career's cards). */
HL.CHARGE = {"gryffindor":{"t":[22.0,21.0,0.92],"L":[["M10 12 C11 9 13 7 15 6 L18 3 L20 0 L22 4 C24 2 28 3 30 5 C32 3 35 5 35 8 C38 8 39 11 37 14 C40 15 41 18 38 20 C40 22 40 25 39 27 C42 30 45 36 47 42 C49 46 52 49 52 54 C53 58 52 62 49 66 C48 69 50 72 53 75 L44 76 C42 73 42 69 43 66 C41 62 38 59 36 58 C33 61 29 65 25 69 C23 71 21 72 18 72 C18 69 21 66 24 63 C26 59 27 55 28 51 C26 48 25 44 24 41 C20 43 15 46 10 48 C8 49 6 48 6 46 C8 44 12 42 17 39 C19 37 20 35 20 34 C16 33 11 31 7 28 C5 27 4 25 4 23 C7 23 11 25 16 27 C17 26 17 25 18 24 C16 23 14 21 12 20 C11 19 10 18 9 17 C11 16 11 16 9 15 C9 14 9 13 10 12 Z",2],["M52 52 C58 50 60 44 58 38 C56 32 58 27 62 26",2,2.6],["M62 26 C60 22 63 19 66 21 C64 23 66 26 63 28 Z",2],["M15.5 10.5 m-1.3 0 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0",1]]},"slytherin":{"t":[0,0,1],"L":[["M45.7 35.2 L46.8 34.8 L47.7 34.5 L48.6 34.3 L49.5 34.2 L50.3 34.1 L51.1 34.2 L51.9 34.3 L52.6 34.4 L53.3 34.6 L54.0 34.9 L54.5 35.2 L55.1 35.5 L55.6 35.9 L56.0 36.4 L56.4 36.9 L56.8 37.4 L57.0 38.0 L57.3 38.6 L57.5 39.2 L57.6 39.9 L57.6 40.7 L57.6 41.5 L57.5 42.4 L57.4 43.2 L57.2 43.9 L56.9 44.4 L56.5 44.9 L56.1 45.3 L55.6 45.8 L54.9 46.2 L54.1 46.7 L53.1 47.1 L52.1 47.5 L51.0 48.0 L49.8 48.4 L48.6 48.8 L47.3 49.3 L46.0 49.8 L44.6 50.4 L43.3 51.0 L41.9 51.8 L40.6 52.6 L39.3 53.6 L38.1 54.8 L37.1 56.1 L36.1 57.7 L35.4 59.4 L35.0 61.3 L34.8 63.3 L34.9 65.2 L35.5 67.1 L36.4 68.7 L37.5 70.1 L38.8 71.3 L40.2 72.2 L41.5 73.0 L43.0 73.7 L44.3 74.5 L45.8 74.9 L47.3 75.3 L48.8 75.7 L50.2 76.0 L51.6 76.4 L52.9 76.7 L54.1 77.1 L55.2 77.6 L56.2 78.0 L57.1 78.5 L57.8 79.0 L58.4 79.5 L58.9 80.1 L59.3 81.0 L59.7 81.8 L60.0 82.5 L60.2 83.3 L60.4 84.1 L60.4 84.8 L60.5 85.6 L60.4 86.3 L60.3 87.0 L60.2 87.7 L60.0 88.4 L59.7 89.1 L59.3 89.7 L58.9 90.4 L58.4 91.0 L57.8 91.5 L57.2 92.1 L56.5 92.6 L55.7 93.0 L54.8 93.4 L53.8 93.8 L52.7 94.1 L51.6 94.3 L50.4 94.5 L49.0 94.7 L49.0 95.3 L50.3 95.6 L51.7 95.8 L52.9 95.8 L54.2 95.8 L55.4 95.6 L56.5 95.4 L57.6 95.0 L58.7 94.6 L59.6 94.1 L60.6 93.5 L61.4 92.8 L62.2 92.0 L62.9 91.2 L63.5 90.3 L64.0 89.3 L64.5 88.3 L64.8 87.2 L65.1 86.1 L65.3 85.0 L65.3 83.8 L65.3 82.6 L65.2 81.4 L65.0 80.2 L64.7 79.0 L64.2 77.5 L63.3 76.0 L62.3 74.6 L61.1 73.4 L59.8 72.4 L58.5 71.5 L57.1 70.7 L55.6 69.9 L54.2 69.2 L52.7 68.6 L51.3 68.0 L49.9 67.5 L48.6 66.9 L47.4 66.4 L46.2 66.1 L45.3 65.7 L44.5 65.2 L43.9 64.8 L43.4 64.5 L43.2 64.2 L43.1 63.9 L43.0 63.7 L43.0 63.3 L43.0 62.7 L43.2 62.0 L43.5 61.4 L43.8 60.8 L44.2 60.3 L44.7 59.8 L45.4 59.3 L46.1 58.8 L47.0 58.3 L48.0 57.8 L49.1 57.4 L50.2 56.9 L51.4 56.4 L52.7 55.9 L54.0 55.4 L55.3 54.8 L56.6 54.2 L57.8 53.5 L59.1 52.7 L60.4 51.8 L61.5 50.7 L62.6 49.5 L63.5 48.1 L64.2 46.5 L64.6 44.8 L64.8 43.2 L64.9 41.7 L64.9 40.2 L64.7 38.8 L64.4 37.4 L63.9 36.1 L63.4 34.9 L62.7 33.7 L61.9 32.6 L61.0 31.6 L60.1 30.8 L59.0 30.0 L57.9 29.3 L56.8 28.7 L55.5 28.2 L54.3 27.8 L53.0 27.5 L51.6 27.4 L50.2 27.3 L48.8 27.4 L47.4 27.6 L46.0 27.9 L44.6 28.3 L43.3 28.8 Z M30 31 C31 27 36 25 41 26 C45 27 47.5 29 47 32 C46 35 41 36.5 36 36 C33 35.5 30 34 30 31 Z",2],["M47.9 31.2 l0.01 0 M50.5 30.7 l0.01 0 M53.1 30.9 l0.01 0 M55.5 31.9 l0.01 0 M57.6 33.5 l0.01 0 M59.2 35.6 l0.01 0 M60.3 38.4 l0.01 0 M60.7 41.6 l0.01 0 M60.2 45.1 l0.01 0 M58.4 47.9 l0.01 0 M55.7 50.0 l0.01 0 M52.4 51.6 l0.01 0 M48.8 53.1 l0.01 0 M45.4 54.8 l0.01 0 M42.4 56.8 l0.01 0 M40.3 59.6 l0.01 0 M39.4 63.2 l0.01 0 M40.3 66.1 l0.01 0 M42.6 68.2 l0.01 0 M45.9 69.8 l0.01 0 M49.8 71.3 l0.01 0 M53.8 72.9 l0.01 0 M57.3 74.9 l0.01 0 M60.1 77.6 l0.01 0",1,1.5,0.55],["M39.5 29.5 m-1.4 0 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0",1],["M30.5 31.6 L24.5 31.2 L21 28.6 M24.5 31.2 L21.2 34",2,1.2]]},"ravenclaw":{"t":[0,0,1],"L":[["M46 48 C40 40 30 31 19 25 L22 32 L16.5 34 L23.5 40 L18 44 L26.5 48 L22 54 L31 55.5 L29 62 L41 60 Z M54 48 C60 40 70 31 81 25 L78 32 L83.5 34 L76.5 40 L82 44 L73.5 48 L78 54 L69 55.5 L71 62 L59 60 Z M43.5 46 C44 41 47 39.5 50 39.5 C53 39.5 56 41 56.5 46 L58.5 60 C58.5 67 55 71 50 73.5 C45 71 41.5 67 41.5 60 Z M45.5 41 C44.5 36.5 47 32.5 51.5 32.5 C55.5 32.5 58 36 56.5 40.5 C54 42 48 42.5 45.5 41 Z M47.5 34.5 C44 34 41 35.5 40 38.5 C42.5 37.8 45 38.2 47 39.5 Z M44 72 L38 90 L44.5 86.5 L47 93.5 L50 87.5 L53 93.5 L55.5 86.5 L62 90 L56 72 Z",2],["M51 36.5 m-1.3 0 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0",1],["M43 69 L37.5 76.5 M37.5 76.5 L33 76 M37.5 76.5 L35.5 80.5 M37.5 76.5 L40 80.5 M57 69 L62.5 76.5 M62.5 76.5 L67 76 M62.5 76.5 L64.5 80.5 M62.5 76.5 L60 80.5",2,2.2],["M50 47 L50 66 M46 52 L50 56 L54 52 M46.5 59 L50 62.5 L53.5 59",1,1.1,0.5]]},"hufflepuff":{"t":[-2.0,-4.0,1.0],"L":[["M19 63 C22 61 27 57.5 33 55.5 C37 54 41 52.5 44 52 L45 49 C46.5 47.8 48.5 48.3 49 50 C55 48 63 47.5 70 49.5 C75 51 79 54 80.5 58 L84 59.5 L82 62.5 L80.5 62 C80.5 65 79.5 68 77.5 70 L78.5 77 L80.5 79.5 L75.5 79.5 L73.5 75 L72 72.5 L69 74 L66 72.5 L63 74.5 L60 72.8 L57 74.6 L54 72.8 L51 74.4 L48.5 72.6 L47.5 77 L49.5 79.5 L44 79.5 L42.5 75 L41 70.5 C37 69 33 67.5 29 66 C25 64.8 21.5 64.5 19 63 Z",2],["M21 61.6 C26 58.2 33 56 40 54.6 C44 53.8 48 53.6 52 54 L51.6 56.2 C47 56 43.5 56.3 40 57 C33.5 58.4 27 60.6 22.5 63 Z M23 64.3 C28 63.6 34 64.3 39.5 66.6 L38.6 68.3 C33.5 66.6 28.5 66 24 65.8 Z",1],["M33.2 60.6 m-1.25 0 a1.25 1.25 0 1 0 2.5 0 a1.25 1.25 0 1 0 -2.5 0",1],["M54 52.6 C60 51.4 67 51.6 73 54",1,0.9,0.4]]}};
{ const lay = (k, c1, c2) => { const C = HL.CHARGE[k]; if (!C) return ''; return `<g transform="translate(${C.t[0]} ${C.t[1]}) scale(${C.t[2]})">` + C.L.map(([d, ci, w, o]) => { const col = ci === 2 ? c2 : c1, op = o ? ` opacity="${o}"` : '';
    return w ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op}/>` : `<path d="${d}" fill="${col}"${op}/>`; }).join('') + '</g>'; };
  HL.ui.crest = function (house) { const H = HL.HOUSES[house]; if (!H) return '';
    return `<svg viewBox="0 0 100 116"><defs><linearGradient id="cg${house}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${H.css}"/><stop offset="1" stop-color="${H.css}" stop-opacity="0.72"/></linearGradient></defs>
    <path d="M6 6 h88 v54 c0 26 -20 42 -44 52 c-24 -10 -44 -26 -44 -52 z" fill="url(#cg${house})" stroke="${H.css2}" stroke-width="4"/><path d="M14 14 h72 v46 c0 20 -16 34 -36 43 c-20 -9 -36 -23 -36 -43 z" fill="none" stroke="${H.css2}" stroke-width="1.2" opacity="0.6"/>
    ${lay(house, H.css, H.css2)}</svg>`; };
  /* the canvas crests: the same layers, centred on the emblem's origin (the field colour is the emblem's second colour) */
  const KIND = { lion: 'gryffindor', serpent: 'slytherin', eagle: 'ravenclaw', badger: 'hufflepuff' }, P2 = {};
  if (typeof drawEmblem === 'function') { const dE0 = drawEmblem; drawEmblem = function (g, kind, cx, cy, s, col, col2) { const k = KIND[kind], C = k && HL.CHARGE[k]; if (!C || typeof Path2D === 'undefined') return dE0.apply(this, arguments);
    g.save(); g.translate(cx, cy); g.scale(s / 76, s / 76); g.translate(-51, -58); g.translate(C.t[0], C.t[1]); g.scale(C.t[2], C.t[2]); g.lineCap = 'round'; g.lineJoin = 'round';
    C.L.forEach(([d, ci, w, o], i) => { const p = P2[k + i] || (P2[k + i] = new Path2D(d)), c = ci === 2 ? col : (col2 || '#000'); g.globalAlpha = o || 1; if (w) { g.strokeStyle = c; g.lineWidth = w; g.stroke(p); } else { g.fillStyle = c; g.fill(p); } });
    g.restore(); }; } }
/* the result is your moment (round 3, #11: "FC and 2K make the result a payoff… a celebrating player"): you knees-up in
   the open left of the screen at FOV 30, cheering or standing with your arms folded, two team-mates celebrating or not
   a few metres behind you; the card keeps the right */
if (typeof STAGES !== 'undefined' && typeof CareerUI !== 'undefined') {
  const w0 = STAGES.world; STAGES.world = function (variant) { const S = w0.apply(this, arguments);
    if (S && !variant) { Object.assign(S.anchors, { resA: [1.45, 0, -16.48, -0.12], resB: [-0.21, 0, -17.85, -0.36] }); S.cams.resHero = { p: [-0.59, 1.25, -11.26], l: [0.98, 1.15, -13.79], p2: [-0.5, 1.29, -11.5], fov: 30, dur: 40 }; }
    return S; };
  CareerUI.resultScene = function (won) {
    this.backdrop = 'result'; this._pv = (this._pv || 0) + 1; const pv = this._pv, set = Scenes.enter('world', '', { mode: 'view' }), S = Career.S, kit = { outfit: 'kit' };
    Scenes.shot(set && set.cams.resHero, true);
    const cast = [{ id: 'me', at: 'pitchMe', anim: won ? 'cheer' : 'fold', o: kit }];
    Career.squad().slice(0, 2).forEach((m, k) => cast.push({ id: 'mate_' + m.id, at: k ? 'resB' : 'resA', anim: won ? 'cheer' : k ? 'fold' : 'idle', o: kit }));
    Scenes.need(cast).then(() => { if (this._pv !== pv || Scenes.set !== set) return; for (const c of cast) Scenes.spawn(c.id, c); }).catch(() => {}); };
}
/* the World Cup looks like itself (round 3, #12: "indistinguishable from its first league fixture"): its hub card in
   gold beside the group of four, and its matches open on a crane that comes down from forty metres over the stands */
{ const css = document.createElement('style'); css.textContent = `
#scrCareer .evCard.wc { border-color: rgba(240,207,124,.75) !important; background: linear-gradient(160deg, rgba(58,42,14,.9), rgba(14,11,6,.92) 62%) !important; box-shadow: 0 0 0 1px rgba(240,207,124,.22), 0 8px 30px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,240,200,.16); }
#scrCareer .evCard.wc .evWhen { color: #f0cf7c; letter-spacing: .2em; } #scrCareer .evCard.wc .evLabel { color: #fff3d0; }`;
  document.head.appendChild(css);
  const Q = HL.Q, i0 = Q.intro; Q.intro = function () { const r = i0.apply(this, arguments), M = typeof QC !== 'undefined' && QC.match, ev = M && M.ev;
    if (ev && ev.comp === 'wc' && CAM.cine) { const C = HL.PITCH, Y0 = Q.Y0;
      CAM.play({ dur: 6.4, fov: 50, hold: false, fn: (t) => { const u = clamp(t / 6.4, 0, 1), e = u * u * (3 - 2 * u), a = PI * 0.82 + e * 0.5, rr = 96 - e * 46; return { pos: _v1.set(C.x + Math.sin(a) * rr * 0.8, Y0 + 46 - e * 32, C.z + Math.cos(a) * rr), look: _v2.set(C.x, Y0 + 14 - e * 5, C.z) }; }, onEnd: () => { CAM.reset(0); } }); }
    return r; }; }
