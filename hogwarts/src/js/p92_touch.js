/* ==== p92_touch.js ==== */
/* TOUCH — the whole game on a phone. A floating stick under the left thumb, the right half of the screen to look (and
   steer the broom), and a cluster of buttons under the right thumb that changes with what you are doing:
     on foot   CAST (hold to keep casting) · four spells and a swap to the other four · PROTEGO (hold) · ROLL · JUMP ·
               USE when something is near · ANCIENT MAGIC when the meter is full; push the stick all the way to run
     broom     the stick drives (forward), brakes (back) and turns; BOOST · UP · DOWN · ROLL; the broom key lands you
     Quidditch SHOOT / TACKLE (hold to wind a shot up) · PASS (or call for it) · BOOST · FACE THE PLAY · ROLL · UP · DOWN
   plus map, journal, pack, pause, broom, Revelio, Lumos and a Wiggenweld along the top right; SKIP during a cut-scene;
   a ✕ on every screen that only Esc used to close. Every button is a real key or mouse button underneath (the game
   reads IN, as it does a keyboard), so everything the game already does keeps working. The keys in the game's own
   hints are redrawn as the buttons that do the same thing. ?touch=1 forces it on a desktop, ?touch=0 off. */
const TOUCH = { on: false, mode: '', btn: {}, held: {}, stick: { id: null, ox: 0, oy: 0, x: 0, y: 0, full: 0 }, look: {}, set: 0, lastTouch: -1e9, u: 1, rep: {},
  cfg: { sens: 1, size: 1, haptic: true } };
try { Object.assign(TOUCH.cfg, JSON.parse(localStorage.getItem('hl_touch') || '{}')); } catch (e) { /* */ }
TOUCH.save = () => { try { localStorage.setItem('hl_touch', JSON.stringify(TOUCH.cfg)); } catch (e) { /* */ } };
TOUCH.want = function () { const f = MG.flags.touch; if (f !== undefined) return !!+f || f === true; return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0; };
TOUCH.recent = () => performance.now() - TOUCH.lastTouch < 900;
TOUCH.buzz = (ms) => { if (TOUCH.cfg.haptic && navigator.vibrate) try { navigator.vibrate(ms || 8); } catch (e) { /* */ } };

/* ------------------------------------------------------------------ input: real keys / buttons, without the DOM round trip */
TOUCH.key = function (code, down) {
  if (down) { if (IN.keys[code]) return; IN.keys[code] = true; IN.pressed[code] = true; IN.lastDevice = 'touch'; for (const a in IN.ACT) if (IN.ACT[a].k.includes(code)) IN.buf[a] = MG.rt; if (MG.onKey) MG.onKey(code); }
  else { if (!IN.keys[code]) return; IN.keys[code] = false; IN.released[code] = true; }
};
TOUCH.mouse = function (b, down) {
  if (down) { IN.mb[b] = true; IN.mbP[b] = true; IN.lastDevice = 'touch'; for (const a in IN.ACT) if (IN.ACT[a].m === b) IN.buf[a] = MG.rt; if (MG.onMouse) MG.onMouse(b); }
  else { if (!IN.mb[b]) return; IN.mb[b] = false; IN.mbR[b] = true; }
};
/* the engine's own handlers, with the mouse events a phone makes up after every tap left out (each was a cast) */
IN.init = function () {
  const cv = MG.$('cv');
  const kd = (e) => {
    if (e.repeat) { if (e.code === 'Tab' || e.code === 'Space') e.preventDefault(); return; }
    IN.keys[e.code] = true; IN.pressed[e.code] = true; IN.lastDevice = 'kb';
    for (const a in IN.ACT) if (IN.ACT[a].k.includes(e.code)) IN.buf[a] = MG.rt;
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (MG.onKey) MG.onKey(e.code);
  };
  const ku = (e) => { IN.keys[e.code] = false; IN.released[e.code] = true; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  window.addEventListener('blur', () => { IN.keys = {}; IN.mb = [false, false, false]; TOUCH.releaseAll && TOUCH.releaseAll(); });
  const fake = (e) => TOUCH.recent() || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents);
  const md = (e) => {
    if (fake(e)) return; const b = e.button; if (b > 2) return;
    IN.mb[b] = true; IN.mbP[b] = true; IN.lastDevice = 'kb';
    for (const a in IN.ACT) if (IN.ACT[a].m === b) IN.buf[a] = MG.rt;
    if (MG.state === 'play' && !IN.locked && !MG.headless && cv.requestPointerLock && e.target === cv) { try { const p = cv.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (err) { /* optional */ } }
    if (MG.onMouse) MG.onMouse(b);
  };
  const mu = (e) => { if (fake(e)) return; const b = e.button; if (b > 2) return; IN.mb[b] = false; IN.mbR[b] = true; };
  window.addEventListener('mousedown', md); window.addEventListener('mouseup', mu);
  window.addEventListener('contextmenu', (e) => { if (!e.target.closest || !e.target.closest('.hlSlot,.slot,.cell')) e.preventDefault(); });
  window.addEventListener('mousemove', (e) => {
    if (fake(e)) return; const dx = e.movementX || 0, dy = e.movementY || 0;
    if (IN.locked) { IN.mdx += dx; IN.mdy += dy; } else if (MG.state === 'play' && (IN.mb[1] || e.altKey)) { IN.mdx += dx; IN.mdy += dy; }
    IN.mouseX = e.clientX; IN.mouseY = e.clientY;
  });
  window.addEventListener('wheel', (e) => { IN.wheel += Math.sign(e.deltaY); }, { passive: true });
  document.addEventListener('pointerlockchange', () => { IN.locked = document.pointerLockElement === cv; });
  window.addEventListener('gamepadconnected', () => { IN.lastDevice = 'pad'; });
  window.addEventListener('touchstart', () => { TOUCH.lastTouch = performance.now(); if (!TOUCH.on && MG.flags.touch === undefined) TOUCH.enable(); }, { capture: true, passive: true });
  window.addEventListener('touchend', () => { TOUCH.lastTouch = performance.now(); }, { capture: true, passive: true });
  if (TOUCH.want()) TOUCH.enable();
};

/* ------------------------------------------------------------------ the buttons */
TOUCH.ICON = {
  cast: 'M4 20 L14.5 9.5 M14.5 9.5 l2 -2 M18 2.5 v4 M16 4.5 h4 M20.5 9 l1 1 M12 3.5 l-.8 -.8',
  protego: 'M12 3 l8 3 v6 c0 5 -3.6 8 -8 9 c-4.4 -1 -8 -4 -8 -9 v-6 z M12 7 v10',
  dodge: 'M4.5 13 a7.5 7.5 0 0 1 13 -6 M17.5 2.8 v4.4 h-4.4 M19.5 11 a7.5 7.5 0 0 1 -13 6 M6.5 21.2 v-4.4 h4.4',
  jump: 'M6 13 l6 -6 l6 6 M6 19 l6 -6 l6 6',
  use: 'M12 2.5 l9.5 9.5 l-9.5 9.5 l-9.5 -9.5 z M12 7.5 v5.5 M12 16 v.6',
  broom: 'M20.5 3.5 L10 14 M10 14 l-3.2 -1 l-4 4.2 l1.3 2.2 l2.2 1.3 l4.2 -4 z M5 17.5 l1.5 1.5',
  boost: 'M4 6 l6 6 l-6 6 M11 6 l6 6 l-6 6 M18 6 v12',
  up: 'M12 20 V5 M6 11 l6 -6 l6 6',
  down: 'M12 4 v15 M6 13 l6 6 l6 -6',
  shoot: 'M9.5 12 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0 M1.5 8.5 h6 M1 12 h7 M2 15.5 h5.5',
  tackle: 'M3 12 h9 M9 7 l5 5 l-5 5 M17.5 6.5 a2 2 0 1 0 .01 0 M15 21 v-6.5 a2.5 2.5 0 0 1 5 0 v6.5',
  pass: 'M3 15 c4 -8 10 -9 15 -6 M14.5 5.5 l3.5 3.5 l-4.2 1.6 M19 18 a2 2 0 1 0 .01 0',
  face: 'M12 2.5 v4 M12 17.5 v4 M2.5 12 h4 M17.5 12 h4 M7 12 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
  roll: 'M20 12 a8 8 0 1 1 -2.4 -5.7 M20.5 3 v5 h-5',
  map: 'M3 6.5 l6 -2.5 l6 2.5 l6 -2.5 v13.5 l-6 2.5 l-6 -2.5 l-6 2.5 z M9 4 v13.5 M15 6.5 v13.5',
  journal: 'M5 4 h11 a3 3 0 0 1 3 3 v13 h-11 a3 3 0 0 1 -3 -3 z M5 17 a3 3 0 0 1 3 -3 h11 M9 8 h6',
  bag: 'M4.5 8.5 h15 l-1.2 12 h-12.6 z M9 8.5 v-2 a3 3 0 0 1 6 0 v2',
  pause: 'M5 6.5 h14 M5 12 h14 M5 17.5 h14',
  revelio: 'M2 12 c3 -5 7 -7 10 -7 s7 2 10 7 c-3 5 -7 7 -10 7 s-7 -2 -10 -7 z M9 12 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
  lumos: 'M12 2 v4 M12 18 v4 M2 12 h4 M18 12 h4 M5 5 l2.8 2.8 M16.2 16.2 l2.8 2.8 M19 5 l-2.8 2.8 M7.8 16.2 l-2.8 2.8 M9.5 12 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0',
  potion: 'M9.5 2.5 h5 M10.5 2.5 v5.5 l-5 8.5 a2.6 2.6 0 0 0 2.2 3.9 h8.6 a2.6 2.6 0 0 0 2.2 -3.9 l-5 -8.5 v-5.5 M7.6 14.5 h8.8',
  ancient: 'M12 2.5 l9.5 17 h-19 z M12 9 v5 M12 16.5 v.6 M8 13 l-2 4 M16 13 l2 4',
  swap: 'M4 8.5 h14 l-3.5 -3.5 M20 15.5 h-14 l3.5 3.5',
  skip: 'M4 5 l8 7 l-8 7 z M13 5 l8 7 l-8 7 z',
  close: 'M6 6 l12 12 M18 6 l-12 12',
};
/* id: [icon, label, modes, kind, input] — kind 'tap' presses and lets go at once, 'hold' follows the finger, 'rep' re-presses while held */
TOUCH.DEF = {
  cast: ['cast', 'CAST', 'foot', 'rep', ['m', 0]], protego: ['protego', 'PROTEGO', 'foot', 'hold', ['k', 'KeyQ']], dodge: ['dodge', 'ROLL', 'foot', 'tap', ['dodge']], jump: ['jump', 'JUMP', 'foot', 'tap', ['k', 'Space']],
  use: ['use', 'USE', 'foot fly', 'tap', ['k', 'KeyE']], ancient: ['ancient', 'ANCIENT', 'foot', 'tap', ['k', 'KeyX']], swap: ['swap', '', 'foot', 'tap', ['swap']],
  s0: [null, '', 'foot', 'tap', ['spell', 0]], s1: [null, '', 'foot', 'tap', ['spell', 1]], s2: [null, '', 'foot', 'tap', ['spell', 2]], s3: [null, '', 'foot', 'tap', ['spell', 3]],
  boost: ['boost', 'BOOST', 'fly match', 'hold', ['k', 'ShiftLeft']], up: ['up', 'UP', 'fly match', 'hold', ['k', 'Space']], down: ['down', 'DOWN', 'fly match', 'hold', ['k', 'KeyC']], roll: ['roll', 'ROLL', 'fly match', 'tap', ['k', 'KeyR']],
  shoot: ['shoot', 'SHOOT', 'match', 'hold', ['m', 0]], pass: ['pass', 'PASS', 'match', 'tap', ['k', 'KeyE']], face: ['face', 'FACE', 'match', 'hold', ['k', 'KeyF']],
  pause: ['pause', '', 'foot fly match', 'tap', ['k', 'Escape']], map: ['map', '', 'foot fly', 'tap', ['k', 'KeyM']], journal: ['journal', '', 'foot fly', 'tap', ['k', 'KeyJ']], bag: ['bag', '', 'foot fly', 'tap', ['k', 'KeyI']],
  broom: ['broom', '', 'foot fly', 'tap', ['k', 'KeyB']], revelio: ['revelio', '', 'foot', 'tap', ['k', 'KeyR']], lumos: ['lumos', '', 'foot', 'tap', ['k', 'KeyL']], potion: ['potion', '', 'foot', 'tap', ['k', 'KeyG']],
  skip: ['skip', 'SKIP', 'cine', 'tap', ['skip']], close: ['close', '', 'menu', 'tap', ['k', 'Escape']],
};
TOUCH.svg = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra || ''}><path d="${d}"/></svg>`;
TOUCH.css = `
#tc { position: absolute; inset: 0; z-index: 30; pointer-events: none; display: none; font-family: 'HLA', 'Trajan Pro', Georgia, serif; -webkit-tap-highlight-color: transparent; }
#tc.on { display: block; }
#tcZone { position: absolute; inset: 0; pointer-events: auto; touch-action: none; }
#tc[data-mode="menu"] #tcZone, #tc[data-mode="cine"] #tcZone, #tc[data-mode=""] #tcZone { display: none; }
.tcB { position: absolute; width: calc(var(--r) * 2); height: calc(var(--r) * 2); margin: calc(var(--r) * -1) 0 0 calc(var(--r) * -1); border-radius: 50%; pointer-events: auto; touch-action: none; display: none;
  background: radial-gradient(circle at 50% 38%, rgba(46,38,24,0.62), rgba(8,7,10,0.66) 70%); border: 1.5px solid rgba(217,184,106,0.55); box-shadow: 0 2px 10px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.5);
  color: #f1e3bd; align-items: center; justify-content: center; flex-direction: column; transition: transform 0.08s, background 0.12s, opacity 0.2s; user-select: none; -webkit-user-select: none; }
.tcB svg { width: 52%; height: 52%; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8)); pointer-events: none; }
.tcB b { position: absolute; bottom: calc(var(--r) * -0.62); left: 50%; transform: translateX(-50%); font-weight: 400; font-size: calc(9px * var(--u)); letter-spacing: 0.16em; color: rgba(241,227,189,0.82); text-shadow: 0 1px 3px #000; white-space: nowrap; pointer-events: none; }
.tcB.big b { bottom: calc(var(--r) * -0.42); }
.tcB.on { display: flex; }
.tcB.dn { transform: scale(0.9); background: radial-gradient(circle at 50% 38%, rgba(140,112,52,0.75), rgba(40,30,12,0.75) 70%); border-color: #fff1c4; }
.tcB.dim { opacity: 0.38; }
.tcB.big { border-width: 2px; background: radial-gradient(circle at 50% 36%, rgba(80,62,30,0.7), rgba(10,8,12,0.72) 72%); }
.tcB.big svg { width: 46%; height: 46%; }
.tcB.sm { background: rgba(8,7,10,0.5); border-color: rgba(217,184,106,0.38); }
.tcB.sm svg { width: 58%; height: 58%; }
.tcB.sp { border-color: var(--c); }
.tcB.sp i { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(rgba(0,0,0,0.74) calc(var(--cd) * 1turn), rgba(0,0,0,0) 0); pointer-events: none; }
.tcB.sp em { position: absolute; font-style: normal; font-size: calc(15px * var(--u)); color: #fff; text-shadow: 0 1px 3px #000; pointer-events: none; }
.tcB.sp.ready { box-shadow: 0 0 10px var(--c), inset 0 0 0 1px rgba(0,0,0,0.5); }
.tcB.glow { animation: tcGlow 0.9s infinite alternate; border-color: #bfe6ff; color: #dff2ff; }
@keyframes tcGlow { from { box-shadow: 0 0 6px #58aaff; } to { box-shadow: 0 0 22px #58aaff, 0 0 4px #fff; } }
.tcB.use { border-color: #ffe08a; color: #fff3c4; animation: tcUse 1.2s infinite alternate; }
@keyframes tcUse { from { box-shadow: 0 0 4px rgba(255,214,110,0.4); } to { box-shadow: 0 0 16px rgba(255,214,110,0.8); } }
.tcB .chg { position: absolute; inset: -5px; border-radius: 50%; background: conic-gradient(#ffe08a calc(var(--k, 0) * 1turn), rgba(0,0,0,0) 0); -webkit-mask: radial-gradient(circle, transparent calc(var(--r) - 1px), #000 var(--r)); mask: radial-gradient(circle, transparent calc(var(--r) - 1px), #000 var(--r)); pointer-events: none; }
#tcStick, #tcKnob { position: absolute; border-radius: 50%; pointer-events: none; }
#tcStick { width: calc(var(--sr) * 2); height: calc(var(--sr) * 2); margin: calc(var(--sr) * -1) 0 0 calc(var(--sr) * -1); border: 1.5px solid rgba(239,230,210,0.35); background: radial-gradient(circle, rgba(0,0,0,0.12), rgba(0,0,0,0.32)); opacity: 0.45; transition: opacity 0.2s; }
#tcStick.act { opacity: 1; } #tcStick.full { border-color: rgba(255,224,138,0.8); box-shadow: 0 0 14px rgba(255,214,110,0.45); }
#tcKnob { width: calc(var(--sr) * 0.9); height: calc(var(--sr) * 0.9); margin: calc(var(--sr) * -0.45) 0 0 calc(var(--sr) * -0.45); background: radial-gradient(circle at 45% 40%, rgba(255,246,220,0.7), rgba(200,170,110,0.45)); border: 1px solid rgba(255,255,255,0.55); box-shadow: 0 2px 8px rgba(0,0,0,0.5); opacity: 0.55; }
#tcStick.act + #tcKnob { opacity: 0.95; }
#tc:not([data-mode="foot"]):not([data-mode="fly"]):not([data-mode="match"]) #tcStick, #tc:not([data-mode="foot"]):not([data-mode="fly"]):not([data-mode="match"]) #tcKnob { display: none; }
#tcRot { position: fixed; inset: 0; z-index: 99; background: #050407; color: #e9dcb4; display: none; align-items: center; justify-content: center; flex-direction: column; font-family: 'HLA', Georgia, serif; letter-spacing: 0.2em; text-align: center; font-size: 15px; }
#tcRot svg { width: 64px; height: 64px; margin-bottom: 18px; color: #d9b86a; animation: tcRot 2.2s infinite ease-in-out; }
@keyframes tcRot { 0%, 30% { transform: rotate(0); } 60%, 100% { transform: rotate(-90deg); } }
@media (orientation: portrait) and (max-width: 640px) { body.touch #tcRot { display: flex; } }
#hl kbd.tk { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px 1px 3px; border-radius: 12px; border-color: rgba(217,184,106,0.7); background: rgba(40,30,12,0.55); vertical-align: -0.15em; line-height: 1.3; }
#hl kbd.tk svg { width: 1.15em; height: 1.15em; }
#hl kbd.tk.nolbl { padding-right: 3px; }
body.touch #hlBar, body.touch #hlBarT { display: none !important; }
body.touch #hlPrompt { pointer-events: none; }
`;
TOUCH.build = function () {
  if (TOUCH.root) return;
  const st = document.createElement('style'); st.textContent = TOUCH.css; document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'tc'; root.dataset.mode = '';
  root.innerHTML = '<div id="tcZone"></div><div id="tcStick"></div><div id="tcKnob"></div>';
  for (const id in TOUCH.DEF) { const D = TOUCH.DEF[id], b = document.createElement('div'); b.className = 'tcB'; b.dataset.id = id;
    if (D[0]) b.innerHTML = TOUCH.svg(TOUCH.ICON[D[0]]) + (D[1] ? `<b>${D[1]}</b>` : '');
    if (id === 'cast' || id === 'shoot') { b.classList.add('big'); b.insertAdjacentHTML('beforeend', '<div class="chg"></div>'); }
    if (/^s\d$/.test(id)) { b.classList.add('sp'); b.innerHTML = '<svg viewBox="0 0 24 24"></svg><i></i><em></em>'; }
    if (['pause', 'map', 'journal', 'bag', 'broom', 'revelio', 'lumos', 'potion', 'swap', 'close', 'skip'].includes(id)) b.classList.add('sm');
    root.appendChild(b); TOUCH.btn[id] = b;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); TOUCH.lastTouch = performance.now(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* */ } TOUCH.press(id, e.pointerId); });
    const up = (e) => { e.preventDefault(); TOUCH.lastTouch = performance.now(); TOUCH.release(id, e.pointerId); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault()); }
  const rot = document.createElement('div'); rot.id = 'tcRot'; rot.innerHTML = TOUCH.svg('M7 2.5 h10 a1.5 1.5 0 0 1 1.5 1.5 v16 a1.5 1.5 0 0 1 -1.5 1.5 h-10 a1.5 1.5 0 0 1 -1.5 -1.5 v-16 a1.5 1.5 0 0 1 1.5 -1.5 z M10.5 18.5 h3') + '<div>TURN YOUR PHONE SIDEWAYS</div>';
  document.body.appendChild(root); document.body.appendChild(rot); TOUCH.root = root; TOUCH.zone = root.querySelector('#tcZone'); TOUCH.stickEl = root.querySelector('#tcStick'); TOUCH.knobEl = root.querySelector('#tcKnob');
  const Z = TOUCH.zone;
  Z.addEventListener('pointerdown', (e) => { e.preventDefault(); TOUCH.lastTouch = performance.now(); try { Z.setPointerCapture(e.pointerId); } catch (er) { /* */ } TOUCH.zoneDown(e); });
  Z.addEventListener('pointermove', (e) => { e.preventDefault(); TOUCH.zoneMove(e); });
  const zu = (e) => { TOUCH.lastTouch = performance.now(); TOUCH.zoneUp(e); }; Z.addEventListener('pointerup', zu); Z.addEventListener('pointercancel', zu);
  window.addEventListener('resize', () => TOUCH.layout()); if (window.visualViewport) visualViewport.addEventListener('resize', () => TOUCH.layout());
  document.addEventListener('visibilitychange', () => { if (document.hidden) TOUCH.releaseAll(); });
  TOUCH.layout(); TOUCH.spellIcons();
};
TOUCH.enable = function () {
  if (TOUCH.on) return; TOUCH.on = true; document.body.classList.add('touch'); TOUCH.build(); TOUCH.root.classList.add('on'); TOUCH.observe();
  if (MG.$('skip')) MG.$('skip').innerHTML = 'TAP <b style="font-weight:400">SKIP</b>';
};
/* ------------------------------------------------------------------ layout: everything from the screen's corners, scaled to it */
TOUCH.layout = function () {
  if (!TOUCH.root) return; const W = window.innerWidth, H = window.innerHeight, u = TOUCH.u = clamp(Math.min(W, H) / 412, 0.82, 1.4) * TOUCH.cfg.size;
  TOUCH.root.style.setProperty('--u', u.toFixed(3)); document.body.style.setProperty('--tu', u.toFixed(3)); TOUCH.root.style.setProperty('--sr', (58 * u).toFixed(1) + 'px');
  const cx = W - 74 * u, cy = H - 74 * u, at = (deg, r) => [cx + Math.cos(deg * D2R) * r, cy - Math.sin(deg * D2R) * r];
  const P = {
    cast: [cx, cy, 41], shoot: [cx, cy, 41],
    protego: [cx - 102 * u, cy + 10 * u, 30], pass: [cx - 102 * u, cy + 10 * u, 31], down: [cx - 102 * u, cy + 10 * u, 28],
    dodge: [cx + 4 * u, cy - 100 * u, 30], boost: [cx + 4 * u, cy - 100 * u, 31],
    jump: [cx - 80 * u, cy - 80 * u, 26], face: [cx - 80 * u, cy - 80 * u, 27],
    s0: [...at(95, 176 * u), 25], s1: [...at(119, 176 * u), 25], s2: [...at(143, 176 * u), 25], s3: [...at(167, 176 * u), 25], swap: [...at(131, 236 * u), 17],
    up: [...at(131, 166 * u), 24], roll: [...at(163, 170 * u), 25],
    use: [cx - 246 * u, cy - 136 * u, 31], ancient: [cx - 214 * u, cy + 14 * u, 27],
    pause: [W - 24 * u, 24 * u, 18], map: [W - 66 * u, 24 * u, 18], journal: [W - 108 * u, 24 * u, 18], bag: [W - 150 * u, 24 * u, 18],
    broom: [W - 24 * u, 74 * u, 19], revelio: [W - 24 * u, 120 * u, 19], lumos: [W - 24 * u, 166 * u, 19], potion: [W - 24 * u, 212 * u, 19],
    skip: [W - 44 * u, 34 * u, 22], close: [W - 30 * u, 30 * u, 20],
  };
  // in flight UP sits where the spells were, DOWN where Protego was; in a match the roll joins the arc
  if (TOUCH.mode === 'match') { P.up = [...at(103, 178 * u), 24]; P.down = [...at(147, 178 * u), 24]; P.roll = [...at(176, 178 * u), 25]; }
  for (const id in P) { const b = TOUCH.btn[id]; if (!b) continue; const [x, y, r] = P[id]; b.style.left = x.toFixed(1) + 'px'; b.style.top = y.toFixed(1) + 'px'; b.style.setProperty('--r', (r * u).toFixed(1) + 'px'); }
  TOUCH.home = [Math.max(96 * u, W * 0.11), H - 100 * u];
  if (TOUCH.stick.id === null) TOUCH.placeStick(TOUCH.home[0], TOUCH.home[1], 0, 0);
};
TOUCH.placeStick = function (ox, oy, x, y) { const s = TOUCH.stickEl.style, k = TOUCH.knobEl.style; s.left = ox + 'px'; s.top = oy + 'px'; k.left = (ox + x) + 'px'; k.top = (oy + y) + 'px'; };
/* the four spells on show (one set of two): their glyphs, colours and keys */
TOUCH.spellIcons = function () {
  for (let i = 0; i < 4; i++) { const id = HL.BAR[TOUCH.set * 4 + i], S = HL.SPELLS[id], b = TOUCH.btn['s' + i]; if (!b || !S) continue; const c = `rgb(${S.col.map((v) => Math.round(Math.min(1, v * 0.7 + 0.3) * 255)).join(',')})`;
    b.style.setProperty('--c', c); b.querySelector('svg').outerHTML = TOUCH.svg((HL.ui.GLYPH || {})[id] || '', ` style="color:${c}"`); b.dataset.spell = id; b.dataset.n = TOUCH.set * 4 + i + 1; }
};
/* ------------------------------------------------------------------ pressing */
TOUCH.press = function (id, pid) {
  const D = TOUCH.DEF[id], inp = D[4], b = TOUCH.btn[id]; TOUCH.held[id] = pid; b.classList.add('dn');
  /* (the audio wakes on the window's own pointerdown listener, which sees this press first) */
  switch (inp[0]) {
    case 'k': TOUCH.key(inp[1], true); if (D[3] === 'tap') setTimeout(() => TOUCH.key(inp[1], false), 70); break;
    case 'm': TOUCH.mouse(inp[1], true); TOUCH.rep[id] = MG.rt; break;
    case 'dodge': TOUCH.key('ShiftLeft', true); setTimeout(() => { TOUCH.key('ShiftLeft', false); }, 60); TOUCH.buzz(6); break;
    case 'spell': { const n = TOUCH.set * 4 + inp[1] + 1, code = 'Digit' + n; TOUCH.key(code, true); setTimeout(() => TOUCH.key(code, false), 70); TOUCH.buzz(7); break; }
    case 'swap': TOUCH.set = 1 - TOUCH.set; TOUCH.spellIcons(); TOUCH.buzz(5); break;
    case 'skip': TOUCH.skip(); break;
  }
};
TOUCH.release = function (id, pid) {
  if (TOUCH.held[id] === undefined || (pid !== undefined && TOUCH.held[id] !== pid)) return; delete TOUCH.held[id];
  const D = TOUCH.DEF[id], inp = D[4], b = TOUCH.btn[id]; b.classList.remove('dn');
  if (inp[0] === 'k' && D[3] !== 'tap') TOUCH.key(inp[1], false);
  else if (inp[0] === 'm') { TOUCH.mouse(inp[1], false); delete TOUCH.rep[id]; if (id === 'shoot') TOUCH.buzz(10); }
};
TOUCH.releaseAll = function () { for (const id in Object.assign({}, TOUCH.held)) TOUCH.release(id); TOUCH.stickUp(); for (const k in TOUCH.look) delete TOUCH.look[k]; };
TOUCH.skip = function () {
  if (CAM.cine) { TOUCH.key('Enter', true); setTimeout(() => TOUCH.key('Enter', false), 60); if (CAM.cine && CAM.cine.skip !== false && MG.state !== 'title') { /* a scene that listens for no key is skipped all the same */ CAM.cine.t = Math.max(CAM.cine.t, CAM.cine.dur || 0); } }
  else { TOUCH.key('Enter', true); setTimeout(() => TOUCH.key('Enter', false), 60); }
};
/* ------------------------------------------------------------------ the stick (left) and the look (everywhere else) */
TOUCH.zoneDown = function (e) {
  const W = window.innerWidth, x = e.clientX, y = e.clientY;
  // a tap on the dialogue box or the use prompt reads as the use key
  TOUCH.look[e.pointerId] = { x, y, x0: x, y0: y, t0: performance.now(), moved: 0 };
  if (TOUCH.stick.id === null && x < W * 0.46) { const S = TOUCH.stick, sr = 58 * TOUCH.u; S.id = e.pointerId; S.ox = clamp(x, sr + 6, W * 0.46); S.oy = clamp(y, sr + 6, window.innerHeight - sr - 6); S.x = x - S.ox; S.y = y - S.oy; S.t0 = performance.now(); delete TOUCH.look[e.pointerId]; TOUCH.stickEl.classList.add('act'); TOUCH.stickMove(x, y); }
};
TOUCH.stickMove = function (x, y) {
  const S = TOUCH.stick, sr = 58 * TOUCH.u; let dx = x - S.ox, dy = y - S.oy; const L = Math.hypot(dx, dy);
  if (L > sr * 1.35) { const k = (L - sr * 1.35) / L; S.ox += dx * k; S.oy += dy * k; dx = x - S.ox; dy = y - S.oy; }   // the base follows a thumb that runs off it
  const m = Math.min(1, Math.hypot(dx, dy) / sr); const a = Math.atan2(dy, dx); S.x = Math.cos(a) * m; S.y = Math.sin(a) * m;
  const kx = Math.cos(a) * Math.min(Math.hypot(dx, dy), sr), ky = Math.sin(a) * Math.min(Math.hypot(dx, dy), sr); TOUCH.placeStick(S.ox, S.oy, kx, ky);
};
TOUCH.stickUp = function () { const S = TOUCH.stick; S.id = null; S.x = S.y = 0; S.full = 0; if (TOUCH.stickEl) { TOUCH.stickEl.classList.remove('act', 'full'); TOUCH.placeStick(TOUCH.home[0], TOUCH.home[1], 0, 0); } };
TOUCH.zoneMove = function (e) {
  if (e.pointerId === TOUCH.stick.id) { TOUCH.stickMove(e.clientX, e.clientY); return; }
  const L = TOUCH.look[e.pointerId]; if (!L) return; const dx = e.clientX - L.x, dy = e.clientY - L.y; L.x = e.clientX; L.y = e.clientY; L.moved += Math.abs(dx) + Math.abs(dy);
  const k = (4.4 / Math.max(window.innerWidth, 600)) / 0.0024 * TOUCH.cfg.sens * (PLAYER.state === 'fly' ? 0.9 : 1);   // a full screen-width drag turns the view ~250°
  IN.mdx += dx * k; IN.mdy += dy * k * 0.82;
};
TOUCH.zoneUp = function (e) {
  if (e.pointerId === TOUCH.stick.id) { TOUCH.stickUp(); return; }
  const L = TOUCH.look[e.pointerId]; delete TOUCH.look[e.pointerId]; if (!L) return;
  if (L.moved < 12 && performance.now() - L.t0 < 350) TOUCH.tap(e.clientX, e.clientY);
};
TOUCH.tap = function (x, y) {   // taps on things the game draws under the controls
  const hit = (el) => { if (!el || !el.offsetParent && el.id !== 'hlPrompt') return false; const r = el.getBoundingClientRect(); return r.width > 0 && x >= r.left - 14 && x <= r.right + 14 && y >= r.top - 14 && y <= r.bottom + 14; };
  const say = MG.$('hlSay'), pr = MG.$('hlPrompt');
  if ((say && say.classList.contains('on') && hit(say)) || (pr && pr.classList.contains('on') && hit(pr))) { TOUCH.key('KeyE', true); setTimeout(() => TOUCH.key('KeyE', false), 60); }
};
/* ------------------------------------------------------------------ every frame: the stick into IN, the buttons that follow the play */
{ const poll0 = IN.poll; IN.poll = function () {
  poll0();
  if (!TOUCH.on) return;
  const S = TOUCH.stick, st = PLAYER.state, fly = st === 'fly', Q = HL.Q && HL.Q.on;
  if (S.id !== null) {
    let mx = S.x, my = S.y; const m = Math.hypot(mx, my);
    if (m < 0.12) { mx = my = 0; } else { const k = (m - 0.12) / 0.88 / m; mx *= k; my *= k; }
    if (fly) {   // on the broom: forward drives, back brakes, sideways turns (and slips a little)
      IN.A.lx += mx * (Q ? 2.3 : 1.9) * MG.rdt * Math.min(1, Math.abs(mx) * 1.6); IN.A.mx = clamp(IN.A.mx + mx * 0.35, -1, 1); IN.A.my = clamp(IN.A.my + my, -1, 1);
    } else { IN.A.mx = clamp(IN.A.mx + mx, -1, 1); IN.A.my = clamp(IN.A.my + my, -1, 1); }
    const L = Math.hypot(IN.A.mx, IN.A.my); if (L > 1) { IN.A.mx /= L; IN.A.my /= L; }
    S.full = !fly && m > 0.93 ? S.full + MG.rdt : 0;
  } else S.full = 0;
  // run: the stick pushed all the way (held as Shift, never long enough short to read as a roll)
  const run = S.full > 0.18 && (st === 'move' || st === 'air');
  if (run && !TOUCH.running) { TOUCH.running = true; IN.keys.ShiftLeft = true; HL.P.shiftT = Math.max(HL.P.shiftT, 0.3); TOUCH.stickEl.classList.add('full'); }
  else if (!run && TOUCH.running) { TOUCH.running = false; if (!TOUCH.held.boost) IN.keys.ShiftLeft = false; HL.P.shiftT = 0; TOUCH.stickEl.classList.remove('full'); }
  if (TOUCH.running) HL.P.shiftT = Math.max(HL.P.shiftT, 0.3);
  // hold CAST and it keeps casting (as fast as the casts allow)
  if (TOUCH.held.cast !== undefined && TOUCH.mode === 'foot' && MG.rt - (TOUCH.rep.cast || 0) > 0.2) { TOUCH.rep.cast = MG.rt; IN.buf.attack = MG.rt; }
  // a soft hand on the aim: while you fight and are not looking about yourself, the view leans toward the foe the reticle chose
  const T = HL.P.target; if (T && !fly && HL.P.aimT > 0 && !Object.keys(TOUCH.look).length && T.alive) { const a = PLAYER.a, ty = Math.atan2(T.x - a.x, T.z - a.z), d = wrapA(ty - CAM.yaw); if (Math.abs(d) < 0.6) IN.A.lx -= d * (1 - Math.exp(-3.2 * MG.rdt)); }
  TOUCH.frame();
}; }
TOUCH.modeNow = function () {
  if (!TOUCH.on || MG.state === 'scene') return '';
  if (CAM.cine && (MG.state === 'play' || PLAYER.state === 'cine')) return 'cine';
  if (MG.state === 'play') { if (PLAYER.state === 'cine' || PLAYER.state === 'dead') return 'wait'; return HL.Q && HL.Q.on ? 'match' : PLAYER.state === 'fly' ? 'fly' : 'foot'; }
  if (MG.state === 'journal' || MG.state === 'inv' || MG.state === 'map' || (MG.state === 'house' && HL._floo)) return 'menu';
  return '';
};
TOUCH.frame = function () {
  const m = TOUCH.modeNow();
  if (m !== TOUCH.mode) { const was = TOUCH.mode; TOUCH.mode = m; TOUCH.root.dataset.mode = m; document.body.dataset.tm = m; TOUCH.releaseAll(); if (was === 'match' || m === 'match') TOUCH.layout();
    for (const id in TOUCH.DEF) TOUCH.btn[id].classList.toggle('on', TOUCH.DEF[id][2].split(' ').includes(m)); }
  if (m === 'foot') {
    const P = HL.P; for (let i = 0; i < 4; i++) { const b = TOUCH.btn['s' + i], id = b.dataset.spell, S = HL.SPELLS[id]; if (!S) continue; const cd = P.cd[id] || 0, f = S.cd ? cd / S.cd : 0, q = Math.ceil(cd);
      if (b._q !== q) { b._q = q; b.querySelector('em').textContent = q > 0 ? q : ''; b.classList.toggle('ready', q === 0); } const fs = f.toFixed(2); if (b._f !== fs) { b._f = fs; b.style.setProperty('--cd', fs); } }
    const full = P.ancient >= 100; TOUCH.btn.ancient.classList.toggle('on', full); TOUCH.btn.ancient.classList.toggle('glow', full);
    const near = HL.nearInteract ? HL.nearInteract() : null; TOUCH.btn.use.classList.toggle('on', !!near); TOUCH.btn.use.classList.toggle('use', !!near);
    if (near) { const lb = TOUCH.btn.use.querySelector('b'); const t = String(near.label || 'USE').toUpperCase().replace(/<[^>]+>/g, ''); if (lb.textContent !== t) lb.textContent = t.length > 18 ? t.slice(0, 17) + '…' : t; }
    const pots = window.LOOTH && LOOTH.pots ? LOOTH.pots.wiggen || 0 : 0; TOUCH.btn.potion.classList.toggle('dim', pots <= 0);
    TOUCH.btn.lumos.classList.toggle('dn', !!(PLAYER.a && PLAYER.a.lumos) && TOUCH.held.lumos === undefined);
  } else if (m === 'fly') {
    const near = HL.nearInteract ? HL.nearInteract() : null; TOUCH.btn.use.classList.toggle('on', !!near);
  } else if (m === 'match') {
    const Q = HL.Q, me = Q.me, B = Q.ball, b = TOUCH.btn.shoot; let lbl = 'TACKLE', ic = 'tackle';
    if (me && me.role === 'seeker') { lbl = 'BURST'; ic = 'boost'; } else if (B && B.holder === me) { lbl = 'SHOOT'; ic = 'shoot'; } else if (B && !B.holder) { lbl = 'CATCH'; ic = 'shoot'; }
    if (b._l !== lbl) { b._l = lbl; b.querySelector('svg').outerHTML = TOUCH.svg(TOUCH.ICON[ic]); b.querySelector('b').textContent = lbl; }
    b.style.setProperty('--k', (Q.chg || 0).toFixed(2));
    const pb = TOUCH.btn.pass, pl = B && B.holder === me ? 'PASS' : 'CALL'; if (pb._l !== pl) { pb._l = pl; pb.querySelector('b').textContent = pl; }
  }
};
/* ------------------------------------------------------------------ the game's key hints, drawn as the buttons */
TOUCH.CHIP = { foot: { E: 'use', LMB: 'cast', RMB: 'protego', Q: 'protego', SHIFT: 'dodge', SPACE: 'jump', C: 'down', B: 'broom', R: 'revelio', L: 'lumos', X: 'ancient', M: 'map', J: 'journal', I: 'bag', G: 'potion', ESC: 'pause', P: 'pause', F: 'face', TAB: 'face', V: 'face', ENTER: 'skip' },
  fly: { E: 'use', SHIFT: 'boost', SPACE: 'up', C: 'down', R: 'roll', B: 'broom', LMB: 'boost', S: 'down' }, match: { E: 'pass', Q: 'pass', RMB: 'pass', LMB: 'shoot', SHIFT: 'boost', SPACE: 'up', C: 'down', R: 'roll', F: 'face', TAB: 'face', V: 'face', ENTER: 'skip', ESC: 'pause', P: 'pause' } };
TOUCH.chip = function (key) {
  const K = String(key).trim().toUpperCase(), Q = HL.Q && (HL.Q.on || HL.Q.loading || MG.state === 'house' && HL.Q.pitchCam), fly = PLAYER.state === 'fly';
  if (/^[1-8]$/.test(K)) { const id = HL.BAR[+K - 1], S = HL.SPELLS[id]; if (!S) return null; const c = `rgb(${S.col.map((v) => Math.round(Math.min(1, v * 0.7 + 0.3) * 255)).join(',')})`; return { svg: TOUCH.svg((HL.ui.GLYPH || {})[id] || '', ` style="color:${c}"`), t: S.name.toUpperCase() }; }
  if (K === 'W') return { svg: TOUCH.svg('M12 3 a9 9 0 1 0 .01 0 M12 8 v8 M8.5 11.5 l3.5 -3.5 l3.5 3.5'), t: Q || fly ? 'STICK FORWARD' : 'STICK' };
  if (K === 'S') return { svg: TOUCH.svg(Q || fly ? 'M12 3 a9 9 0 1 0 .01 0 M12 8 v8 M8.5 12.5 l3.5 3.5 l3.5 -3.5' : 'M12 3 a9 9 0 1 0 .01 0'), t: Q || fly ? 'STICK BACK' : 'STICK' };
  if (K === 'A' || K === 'D') return { svg: '', t: '' };
  const map = Q ? TOUCH.CHIP.match : fly ? Object.assign({}, TOUCH.CHIP.foot, TOUCH.CHIP.fly) : TOUCH.CHIP.foot, id = map[K]; if (!id) return null;
  const D = TOUCH.DEF[id]; let t = D[1] || { pause: 'MENU', map: 'MAP', journal: 'JOURNAL', bag: 'PACK', broom: 'BROOM', revelio: 'REVELIO', lumos: 'LUMOS', potion: 'WIGGENWELD', skip: 'SKIP', face: 'FACE' }[id] || id.toUpperCase();
  if (id === 'shoot') t = 'SHOOT'; return { svg: TOUCH.svg(TOUCH.ICON[D[0]] || ''), t };
};
TOUCH.PHRASES = [
  [/Click the view to look around with the mouse/g, 'Drag the right side of the screen to look around'], [/look with the mouse \(click to capture\)/g, 'drag the right side of the screen to look'],
  [/steer with the (<b>)?mouse(<\/b>)?/g, 'steer by dragging the right side of the screen'], [/(<b>)?mouse(<\/b>)? steer/g, 'drag to steer'], [/the mouse/g, 'a drag of the right side'],
  [/hold (<kbd>SHIFT<\/kbd>) to run/g, 'push the stick all the way to run'], [/wheel to look closer, drag to move/g, 'pinch to look closer, drag to move'], [/double-click/gi, 'double-tap'],
  [/wheel to look closer, drag to move[\s\S]*?fold it away/g, 'pinch to look closer, drag to move · tap a storey · ✕ folds it away'],
  [/(?:,? ?on )?<kbd>1<\/kbd>\s*(?:–|-|&ndash;)\s*<kbd>8<\/kbd>( spells)?/g, (m, sp) => sp ? ' the spell buttons' : ' with the spell buttons'], [/PRESS ANY KEY/g, 'TAP TO CONTINUE'], [/\b(J|M|I) OR ESC TO CLOSE/g, 'TAP ✕ TO CLOSE'], [/\bESC TO CLOSE/g, 'TAP ✕ TO CLOSE'], [/HOLD <kbd>ENTER<\/kbd> TO SKIP/g, 'TAP SKIP'], [/Right-tap/g, 'Long-press'], [/Right-click/g, 'Long-press'],
  [/\bclick(s|ed|ing)?\b/g, 'tap$1'], [/\bClick(s|ed|ing)?\b/g, 'Tap$1'], [/<b>(LMB|RMB)<\/b>/g, '<kbd>$1</kbd>'], [/\b(LMB|RMB)\b(?![^<]*<\/kbd>)/g, '<kbd>$1</kbd>'],
];
TOUCH.fixText = function (html) { let s = html; for (const [re, to] of TOUCH.PHRASES) s = s.split(/(<[^>]+>)/).length > 1 && /\bclick|\bClick/.test(re.source) ? s.split(/(<[^>]+>)/).map((p) => p.startsWith('<') ? p : p.replace(re, to)).join('') : s.replace(re, to); return s; };
TOUCH.fixEl = function (el) {
  if (!TOUCH.on || !el || el.nodeType !== 1 || el.closest('#tc')) return;
  const RX = /mouse|[Cc]lick|LMB|RMB|wheel to|hold <kbd>SHIFT|PRESS ANY KEY|ESC TO CLOSE|TO SKIP|<kbd>1<\/kbd>\s*(?:–|-|&ndash;)/;
  if (el.querySelector && (el.innerHTML.indexOf('<kbd') >= 0 || RX.test(el.innerHTML)) && !el.closest('[data-tf]')) {
    const fix = (e) => { const h = TOUCH.fixText(e.innerHTML); if (h !== e.innerHTML) e.innerHTML = h; }, live = 'input,canvas,.view';
    if (RX.test(el.innerHTML)) { if (el.children.length < 60 && !el.querySelector(live)) fix(el);
      /* a screen with a live canvas in it (the pack's figure) is left whole; its plain lines of text are rewritten one by one */
      else for (const d of el.querySelectorAll('div,p,li')) if (RX.test(d.innerHTML) && [...d.querySelectorAll('*')].every((x) => /^(B|I|EM|KBD|SPAN|BR|SMALL|STRONG)$/.test(x.tagName) || (!x.textContent.trim() && !x.matches(live + ',button')))) fix(d); }
    for (const k of el.querySelectorAll('kbd:not(.tk)')) { if (k.closest('.hlMap')) continue; const c = TOUCH.chip(k.textContent); if (!c) continue; if (!c.svg && !c.t) { k.style.display = 'none'; k.classList.add('tk'); continue; } k.classList.add('tk'); if (!c.t) k.classList.add('nolbl'); k.innerHTML = c.svg + (c.t ? '<span>' + c.t + '</span>' : '');
      /* "PASS pass": the chip already says it */ const n = k.nextSibling, m = c.t && n && n.nodeType === 3 && /^[\s\u00a0]*([A-Za-z]+)/.exec(n.textContent); if (m && m[1].toLowerCase() === c.t.split(' ').pop().toLowerCase()) n.textContent = ' ' + n.textContent.slice(m[0].length).replace(/^[\s\u00a0]+/, ''); }
  }
};
TOUCH.observe = function () {
  if (TOUCH.mo) return; let pend = new Set(), raf = 0;
  const run = () => { raf = 0; const s = pend; pend = new Set(); for (const el of s) if (el.isConnected) TOUCH.fixEl(el); };
  TOUCH.mo = new MutationObserver((list) => { for (const m of list) { const t = m.target.nodeType === 1 ? m.target : m.target.parentElement; if (t && !t.closest('#tc')) pend.add(t); } if (!raf) raf = requestAnimationFrame(run); });
  TOUCH.mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  TOUCH.fixEl(document.body);
};
/* ------------------------------------------------------------------ the aim: on glass the reticle is harder to hold, so it reaches a little further */
{ const au0 = HL.aimUpdate; HL.aimUpdate = function () {
  if (!TOUCH.on) return au0();
  const a = PLAYER.a, cam = R.camera, P = HL.P, o = cam.getWorldPosition(_v1), d = cam.getWorldDirection(_v2);
  let best = null, bs = 0.4;
  for (const e of COMBAT.actors) { if (!e.alive || e.team === 'hero' || e.hidden || e.noTarget) continue; const c = e.chest(_v3), to = _v4.copy(c).sub(o), dist = to.length(); if (dist > 60 || dist < 0.5) continue; to.multiplyScalar(1 / dist);
    const ang = Math.acos(clamp(to.dot(d), -1, 1)), sc = ang + dist * 0.0012; if (ang < 0.38 + 1.6 / dist && sc < bs + 1.6 / dist && PHY.los(o.x, o.y, o.z, c.x, c.y, c.z)) { if (!best || sc < bs) { bs = sc; best = e; } } }
  P.target = best;
  if (best) best.chest(P.aim); else { const start = 2.5, hit = PHY.ray(o.x + d.x * start, o.y + d.y * start, o.z + d.z * start, d.x, d.y, d.z, 90, 'shot'); P.aim.copy(o).addScaledVector(d, hit ? hit.t + start : 90); }
  P.aimDir.copy(d); void a;
}; }
/* ------------------------------------------------------------------ screens: a ✕ where only Esc closed them; the pack: tap to look, tap again to use */
{ const sc0 = HL.ui.screen; HL.ui.screen = function (html) { const S = sc0.call(this, html); if (TOUCH.on && html) requestAnimationFrame(() => TOUCH.screenFix(S)); return S; }; }
TOUCH.screenFix = function (S) {
  if (!S || !S.firstElementChild) return; TOUCH.fixEl(S);
  // the map: drag to move, pinch to look closer (handed to the map as the mouse and wheel it listens for)
  const view = S.querySelector('.hlMap .view'); if (view && !view._tc) { view._tc = true; const pts = new Map(); let pinch = null;
    view.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; pts.set(e.pointerId, [e.clientX, e.clientY]); try { view.setPointerCapture(e.pointerId); } catch (er) { /* */ }
      if (pts.size === 1) e.target.dispatchEvent(new MouseEvent('mousedown', { clientX: e.clientX, clientY: e.clientY, bubbles: true }));
      else if (pts.size === 2) { window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); const [p, q] = [...pts.values()]; pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]) }; } });
    view.addEventListener('pointermove', (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) window.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, bubbles: true }));
      else if (pinch) { const [p, q] = [...pts.values()], d = Math.hypot(p[0] - q[0], p[1] - q[1]), cx = (p[0] + q[0]) / 2, cy = (p[1] + q[1]) / 2;
        while (d > pinch.d * 1.18) { view.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, clientX: cx, clientY: cy, bubbles: true, cancelable: true })); pinch.d *= 1.18; }
        while (d < pinch.d / 1.18) { view.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, clientX: cx, clientY: cy, bubbles: true, cancelable: true })); pinch.d /= 1.18; } } });
    const end = (e) => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size === 0) { window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); pinch = null; } else if (pts.size === 1) { pinch = null; const [p] = [...pts.values()]; view.dispatchEvent(new MouseEvent('mousedown', { clientX: p[0], clientY: p[1], bubbles: true })); } };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end); }
  // the pack: the first tap on a thing shows what it is, the second uses it
  if (!S._tcTap) { S._tcTap = true; S.addEventListener('click', (e) => { if (!TOUCH.on || !TOUCH.recent()) return; const el = e.target.closest && e.target.closest('.hlSlot'); if (!el) return;
    if (TOUCH.sel !== el) { e.stopPropagation(); e.preventDefault(); if (TOUCH.sel) TOUCH.sel.classList.remove('tcSel'); TOUCH.sel = el; el.classList.add('tcSel'); if (el.onmouseenter) el.onmouseenter(); } else { TOUCH.sel = null; } }, true); }
};
/* ------------------------------------------------------------------ pause: the touch settings join the menu */
{ const p0 = HL.ui.pause; HL.ui.pause = function () {
  p0.apply(this, arguments); if (!TOUCH.on || MG.state !== 'pause') return; const S = HL.ui.el.Screen, keys = S.querySelector('.hlKeys'); if (!keys) return;
  keys.outerHTML = `<div class="hlKeys tcKeys" data-tf="1"><b>Move · look</b><span>the stick on the left · drag the right side</span><b>Run</b><span>push the stick all the way</span><b>Cast</b><span>tap or hold CAST · the four spells around it · ⇄ swaps to the other four</span><b>Protego</b><span>hold it as a curse comes · late is perfect</span><b>Broom</b><span>the broom at the top right · stick forward to fly, sideways to turn</span><b>Quidditch</b><span>hold SHOOT to wind a shot up · PASS · FACE turns you to the play</span></div>
    <div class="hlRow tcSet"><div class="hlBtn" data-t="s-">LOOK −</div><div class="hlBtn sel" style="min-width:110px">${TOUCH.cfg.sens.toFixed(1)}×</div><div class="hlBtn" data-t="s+">LOOK +</div><div class="hlBtn" data-t="z">BUTTONS · ${TOUCH.cfg.size < 0.95 ? 'SMALL' : TOUCH.cfg.size > 1.05 ? 'LARGE' : 'MEDIUM'}</div><div class="hlBtn" data-t="h">BUZZ · ${TOUCH.cfg.haptic ? 'ON' : 'OFF'}</div></div>`;
  S.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { const t = b.dataset.t, C = TOUCH.cfg;
    if (t === 's-') C.sens = Math.max(0.4, +(C.sens - 0.1).toFixed(1)); else if (t === 's+') C.sens = Math.min(2.5, +(C.sens + 0.1).toFixed(1)); else if (t === 'z') C.size = C.size < 0.95 ? 1 : C.size > 1.05 ? 0.88 : 1.14; else if (t === 'h') C.haptic = !C.haptic;
    TOUCH.save(); TOUCH.layout(); MG.state = 'play'; HL.ui.pause(); });
}; }
/* ------------------------------------------------------------------ the match HUD (drawn on a canvas): its key words as the buttons, its radar out of the thumb's way */
{ const Q = HL.Q, H = Q.hud;
  const SAY = [[/^LMB · hold to wind up$/, 'hold SHOOT to wind up'], [/^E {1,2}pass$/, 'PASS'], [/^R {1,2}to roll$/, 'tap ROLL'], [/^F {1,2}— face the play$/, 'FACE — turn to the play'], [/^LMB$/, 'TACKLE'], [/^E$/, 'CALL']];
  const sub = (s) => { if (!TOUCH.on || typeof s !== 'string') return s; for (const [re, to] of SAY) if (re.test(s)) return to; return s; };
  const e0 = H.ensure; H.ensure = function () { const had = !!H.cv; e0.call(H); if (!had && H.x) { const x = H.x, f0 = x.fillText.bind(x), s0 = x.strokeText.bind(x); x.fillText = (s, a, b, m) => m === undefined ? f0(sub(s), a, b) : f0(sub(s), a, b, m); x.strokeText = (s, a, b, m) => m === undefined ? s0(sub(s), a, b) : s0(sub(s), a, b, m); } };
  const r0 = H.radar; H.radar = function (hc, rc) {
    if (!TOUCH.on) return r0.call(H, hc, rc);
    const x = H.x, sc = clamp(H.h / 900, 0.8, 1.25), rw = 92 * sc, rh = rw * (Q.AZ + 6) / (Q.AX + 6) * 0.86, k = Math.min(1, (H.h * 0.42) / rh), x0 = H.w - rw - 34, y0 = H.h - rh - 40;
    x.save(); x.translate(12, 46); x.scale(k, k); x.translate(-x0, -y0); r0.call(H, hc, rc); x.restore(); };
}
