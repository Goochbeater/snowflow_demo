/* ==== p28_menu.js ==== */
/* MENUS — title (live backdrop over Limgrave), controls, pause, the Site of Grace, the ending. Keyboard, mouse, pad. */
const MENU = { cur: null, sel: 0, items: [], titleT: 0 };
MENU.el = () => MG.$('menus');
MENU.close = function () { MENU.el().innerHTML = ''; MENU.cur = null; MG.onKey = null; };
MENU.bindList = function (root, onBack) {
  MENU.items = [...root.querySelectorAll('.mi:not(.dis)')]; MENU.sel = Math.min(MENU.sel, Math.max(0, MENU.items.length - 1));
  const hl = () => MENU.items.forEach((e, i) => e.classList.toggle('sel', i === MENU.sel)); hl();
  MENU.items.forEach((e, i) => { e.addEventListener('mouseenter', () => { MENU.sel = i; hl(); }); e.addEventListener('click', (ev) => { ev.stopPropagation(); MENU.activate(i); }); });
  MG.onKey = (code) => {
    if (!MENU.cur) return;
    if (code === 'ArrowDown' || code === 'KeyS') { MENU.sel = (MENU.sel + 1) % MENU.items.length; hl(); }
    else if (code === 'ArrowUp' || code === 'KeyW') { MENU.sel = (MENU.sel - 1 + MENU.items.length) % MENU.items.length; hl(); }
    else if (code === 'Enter' || code === 'Space' || code === 'NumpadEnter' || code === 'KeyF') MENU.activate(MENU.sel);
    else if (code === 'Escape' || code === 'Backspace') { if (onBack) onBack(); else if (MENU.cur === 'pause') MENU.resume(); }
  };
};
MENU.activate = function (i) { const e = MENU.items[i]; if (e && e._fn) e._fn(); };
MENU.mk = function (html, id, cls) { const d = document.createElement('div'); d.className = 'menu on ' + (cls || ''); d.id = id; d.innerHTML = html; MENU.el().innerHTML = ''; MENU.el().appendChild(d); return d; };
MENU.item = function (root, sel, fn) { const e = root.querySelector(sel); if (e) e._fn = fn; };
MENU.open = function (name, o) {
  o = o || {}; MENU.cur = name; MENU.sel = 0;
  if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { /* */ }
  if (name === 'title') {
    MG.state = 'title'; HUD.show(false);
    const cont = !!GAME.save.level;
    const d = MENU.mk(`<div class="logo"><h1>OPUS RING</h1><div class="blade"></div><h2>LIMGRAVE · STORMVEIL CASTLE</h2></div>
      <div class="mlist">${cont ? '<div class="mi" id="mCont">CONTINUE</div>' : ''}<div class="mi" id="mPlay">NEW GAME</div>
      <div class="mi" id="mDiff">DIFFICULTY · <span id="dv">${MG.difficulty.toUpperCase()}</span></div>
      <div class="mi" id="mCtl">CONTROLS</div></div>
      <div class="foot">A FAN HOMAGE · BUILT ENTIRELY BY AN AI · CLICK THE VIEW TO CAPTURE THE MOUSE</div>`, 'title');
    MENU.item(d, '#mCont', () => GAME.continue());
    MENU.item(d, '#mPlay', () => GAME.newGame());
    MENU.item(d, '#mDiff', () => { const Lq = ['easy', 'normal', 'hard']; MG.difficulty = Lq[(Lq.indexOf(MG.difficulty) + 1) % 3]; d.querySelector('#dv').textContent = MG.difficulty.toUpperCase(); });
    MENU.item(d, '#mCtl', () => MENU.open('controls', { back: 'title' }));
    MENU.bindList(d);
    return;
  }
  if (name === 'controls') {
    const K = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
    const d = MENU.mk(`<div class="hd">CONTROLS</div><div class="cols"><div>
      <div class="sect">MOVEMENT</div>${K('Move', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>')}${K('Camera', 'Mouse (click once to capture) · arrow keys')}${K('Roll / backstep', 'tap <kbd>SHIFT</kbd>')}${K('Sprint', 'hold <kbd>SHIFT</kbd>')}${K('Jump', '<kbd>SPACE</kbd>')}${K('Lock on', '<kbd>TAB</kbd> / middle mouse')}
      <div class="sect">COMBAT</div>${K('Light attack (chains)', '<kbd>LMB</kbd>')}${K('Heavy attack', '<kbd>RMB</kbd>')}${K('Jump attack', '<kbd>LMB</kbd> in the air')}${K('Guard · parry on impact', 'hold <kbd>Q</kbd>')}${K('Ash of War (the equipped skill)', '<kbd>E</kbd>')}${K('Cast spell · next spell', '<kbd>G</kbd> · <kbd>T</kbd>')}${K('Critical hit on a broken foe', '<kbd>LMB</kbd> / <kbd>F</kbd>')}
      </div><div>
      <div class="sect">THE JOURNEY</div>${K('Use quick item · next item', '<kbd>R</kbd> · <kbd>Z</kbd>')}${K('Equipment and inventory · map', '<kbd>I</kbd> · <kbd>M</kbd>')}${K('Interact · rest at grace · pick up', '<kbd>F</kbd>')}${K('Summon / dismiss Torrent', '<kbd>X</kbd>')}${K('Torrent: gallop · double jump', 'hold <kbd>SHIFT</kbd> · <kbd>SPACE</kbd> ×2')}${K('Pause', '<kbd>ESC</kbd>')}
      <div class="sect">GAMEPAD</div>${K('Attack · heavy', 'X · Y')}${K('Jump · roll / sprint', 'A · B')}${K('Guard · skill', 'LB · RB')}${K('Interact · flask', 'LT · RT')}${K('Lock · steed', 'R3 · L3')}
      <div class="sect">COUNSEL</div><div class="row"><span>Every swing, roll and guard spends stamina. Rolling passes through blows. Rest at grace to refill the flasks, level up and travel — and bring every foe back. Ashes of War, spells and talismans are found in chests, on the fallen, and at Kalé's fire.</span></div>
      </div></div><div class="back mi" id="mBack">‹ BACK</div>`, 'ctl', 'panel');
    const back = () => MENU.open(o.back || 'title', o);
    MENU.item(d, '#mBack', back); MENU.bindList(d, back); return;
  }
  if (name === 'pause') {
    MG.state = 'pause'; HUD.show(false);
    const d = MENU.mk(`<div class="hd">PAUSED</div><div class="mlist"><div class="mi" id="mRes">RESUME</div><div class="mi" id="mRetry">RETURN TO LAST GRACE</div><div class="mi" id="mCtl">CONTROLS</div><div class="mi" id="mQuit">QUIT TO TITLE</div></div>`, 'pause');
    MENU.item(d, '#mRes', () => MENU.resume()); MENU.item(d, '#mRetry', () => { MENU.resume(); GAME.retry(); }); MENU.item(d, '#mCtl', () => MENU.open('controls', { back: 'pause' })); MENU.item(d, '#mQuit', () => MENU.toTitle());
    MENU.bindList(d); return;
  }
  if (name === 'grace') {
    const s = GAME.save, cost = OR.levelCost(), can = (s.runes || 0) >= cost;
    const d = MENU.mk(`<div class="hd">${o.Gr.name}</div><div class="sub2">SITE OF GRACE</div><div class="mlist">
      <div class="mi ${can ? '' : 'dis'}" id="mVig">VIGOR<small>more life · ${cost} runes</small></div>
      <div class="mi ${can ? '' : 'dis'}" id="mEnd">ENDURANCE<small>more stamina · ${cost} runes</small></div>
      <div class="mi ${can ? '' : 'dis'}" id="mStr">STRENGTH<small>harder blows · ${cost} runes</small></div>
      <div class="mi" id="mLeave">LEAVE</div></div>
      <div class="stats">Level <b>${OR.level()}</b> · Runes <b>${s.runes || 0}</b><br>Vigor <b>${10 + (s.vig || 0)}</b> · Endurance <b>${10 + (s.end || 0)}</b> · Strength <b>${10 + (s.str || 0)}</b><br>Flasks of Crimson Tears <b>${s.flaskMax || 3}</b></div>`, 'grace');
    const up = (k) => () => { if ((s.runes || 0) < OR.levelCost()) return; s.runes -= OR.levelCost(); s[k] = (s[k] || 0) + 1; const a = PLAYER.a; a.hpMax = OR.hpMax(); a.hp = a.hpMax; PLAYER.stam = OR.stamMax(); GAME.store(); const keep = MENU.sel; MENU.open('grace', o); MENU.sel = keep; MENU.items.forEach((e, i) => e.classList.toggle('sel', i === Math.min(keep, MENU.items.length - 1))); };
    MENU.item(d, '#mVig', up('vig')); MENU.item(d, '#mEnd', up('end')); MENU.item(d, '#mStr', up('str')); MENU.item(d, '#mLeave', () => OR.leaveGrace());
    MENU.bindList(d, () => OR.leaveGrace()); if (!can) { MENU.sel = MENU.items.length - 1; MENU.items.forEach((e, i) => e.classList.toggle('sel', i === MENU.sel)); }
    return;
  }
  if (name === 'result') {
    const s = GAME.save, tm = s.t || 0, hh = Math.floor(tm / 3600), mm = Math.floor(tm / 60) % 60, ss = Math.floor(tm % 60);
    const K = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
    const d = MENU.mk(`<div class="hd">THE GRAFTED HAS FALLEN</div><div class="big">SHARDBEARER FELLED</div><div class="q">Beyond the castle, the lake country of Liurnia waits in the mist.</div>
      <div id="resStats">${K('Level', OR.level())}${K('Deaths', s.deaths || 0)}${K('Great enemies felled', Object.keys(s.felled || {}).length)}${K('Time', (hh ? hh + ':' : '') + String(mm).padStart(hh ? 2 : 1, '0') + ':' + String(ss).padStart(2, '0'))}${K('Difficulty', MG.difficulty.toUpperCase())}</div>
      <div class="mlist"><div class="mi" id="mBack">KEEP EXPLORING</div><div class="mi" id="mQuit">TITLE</div></div>`, 'result');
    MENU.item(d, '#mBack', () => MENU.resume()); MENU.item(d, '#mQuit', () => MENU.toTitle());
    MENU.bindList(d); return;
  }
};
MENU.resume = function () { MENU.close(); MG.state = 'play'; HUD.show(true); IN.buf = {}; OR.noPauseT = MG.rt + 0.35; };
MENU.toTitle = async function () { MENU.close(); MG.$('boot').style.display = 'flex'; MG.$('boot').style.opacity = 1; await MENU.titleScene(); MG.$('boot').style.opacity = 0; setTimeout(() => { MG.$('boot').style.display = 'none'; }, 1200); MENU.open('title'); };
/* title backdrop: the Tarnished on the cliff of the First Step, Limgrave below, the Erdtree over everything */
MENU.titleScene = async function () {
  MG.skipIntro = true; MG.titleMode = true;
  await LEVEL.load('limgrave', { progress: (p) => MG.loadUI(0.2 + p * 0.75, 'Raising Limgrave') });
  MG.skipIntro = false;
  const def = LEVEL.defs.limgrave, T = def.title, a = PLAYER.a;
  if (T) { a.x = T.at[0]; a.z = T.at[2]; a.y = WORLD.spawnY([T.at[0], null, T.at[2]]); a.yaw = T.at[3]; }
  MG.state = 'title'; HUD.show(false); HUD.hideHint(); HUD.el.sub.classList.remove('on');
  MENU.titleT = 0;
};
MENU.titleUpdate = function (dt) {
  MENU.titleT += dt; const t = MENU.titleT, a = PLAYER.a; if (!a) return;
  a.speed = 0; a.vx = a.vz = 0; a.setBase('idleCalm'); a.physics(dt); a.animate(dt); a.pose3D(dt);
  PLAYER.saber.update(dt, MG.t); PLAYER.saber.sampleTrails(MG.t, 0);
  LEVEL.update(dt);
  const T = LEVEL.cur.def.title, cam = R.camera;
  if (T && T.cam) { const c = T.cam(t, a); cam.position.copy(c.pos); cam.lookAt(c.look); if (cam.fov !== (c.fov || 42)) { cam.fov = c.fov || 42; cam.updateProjectionMatrix(); } }
};
