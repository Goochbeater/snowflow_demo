/* ==== p30_game.js ==== */
/* GAME — flow (title → the Lands Between), saving, travel between regions, the per-frame play update. */
const GAME = {
  seq: ['limgrave', 'cave', 'margit', 'stormveil'],
  save: null,
  LINES: {
    limgrave: 'The Erdtree burns gold over a broken land, and grace still points the way.',
    cave: 'The wolves of Limgrave do not den alone.',
    margit: 'On the bridge to Stormveil, something old and horned is waiting.',
    stormveil: 'A castle of storms — and on its throne, a lord stitched together from the fallen.',
  },
};
GAME.fresh = () => ({ v: 1, runes: 0, vig: 0, end: 0, str: 0, flaskMax: 3, torrent: false, level: null, cp: 0, graces: {}, items: {}, felled: {}, stain: null, deaths: 0, t: 0 });
GAME.save = GAME.fresh();
GAME.KEY = 'opus_ring_v1';
GAME.load = function () { if (MG.test) return; try { const s = JSON.parse(localStorage.getItem(GAME.KEY) || 'null'); if (s && s.v === 1) GAME.save = Object.assign(GAME.fresh(), s); } catch (e) { /* storage unavailable */ } };
GAME.store = function () { if (MG.test) return; try { localStorage.setItem(GAME.KEY, JSON.stringify(GAME.save)); } catch (e) { /* ignore */ } };
GAME.saveCP = function () { GAME.store(); };
GAME.newGame = function () { GAME.save = GAME.fresh(); OR.flasks = 3; GAME.store(); return GAME.start('limgrave', 0); };
GAME.continue = function () { const s = GAME.save; OR.flasks = s.flaskMax || 3; return GAME.start(s.level || 'limgrave', s.cp || 0); };
GAME.travel = function (lvl, cp) { const s = GAME.save; s.level = lvl; s.cp = cp || 0; GAME.store(); return GAME.start(lvl, cp || 0); };
GAME.start = async function (lvl, cp) {
  MENU.close(); cp = cp || 0;
  const def = LEVEL.defs[lvl];
  // the title screen already stands in Limgrave: step straight into it
  if (LEVEL.cur && LEVEL.cur.id === lvl && MG.titleMode) {
    MG.titleMode = false; const L = LEVEL.cur, sp = (def.checkpoints && def.checkpoints[cp]) || def.start; L.cp = cp;
    PLAYER.spawn(sp[0], sp[1], sp[2], sp[3] || 0); CAM.reset(sp[3] || 0); OR.placeStain();
    MG.state = 'play'; HUD.show(true); GAME.levelStart = { t: MG.rt, kills: COMBAT.kills };
    if (def.onStart) def.onStart(L, cp);
    return;
  }
  MG.titleMode = false;
  { const b = MG.$('boot'); if (def && b) { b.querySelector('h1').textContent = def.name; b.querySelector('h2').textContent = def.region || 'THE LANDS BETWEEN'; MG.$('ldQuote').textContent = GAME.LINES[lvl] || ''; }
    b.style.display = 'flex'; b.style.opacity = 1; }
  await MG.loadUI(0.05, 'Travelling');
  try { await LEVEL.load(lvl, { cp, progress: (p) => MG.loadUI(0.1 + p * 0.85, 'Raising ' + def.name.toLowerCase()) }); await MG.loadUI(1, 'Ready'); } catch (e) { MG.fail(e); return; }
  GAME.levelStart = { t: MG.rt, kills: COMBAT.kills }; OR.placeStain();
  const b = MG.$('boot'); b.style.opacity = 0; setTimeout(() => { b.style.display = 'none'; }, 1200);
  if (PLAYER.state !== 'cine') HUD.show(true); MG.state = 'play';
};
GAME.next = function () { const i = GAME.seq.indexOf(LEVEL.cur.id), n = GAME.seq[i + 1]; if (!n) { GAME.result(true); return; } GAME.travel(n, 0); };
GAME.onPlayerDeath = function () { GAME.save.deaths = (GAME.save.deaths || 0) + 1; OR.died(); };
GAME.retry = function () { OR.respawn(false); };
GAME.result = function (final) { MG.state = 'result'; HUD.show(false); MENU.open('result', { final }); };
/* ------------------------------------------------------------------ per-frame play */
GAME.update = function (rdt) {
  let k = 1;
  if (MG.hitStop > 0) { MG.hitStop -= rdt; k = 0.06; }
  if (MG.slowmo) { MG.slowmoT = (MG.slowmoT || 0) + rdt; k *= MG.slowmo; if (MG.slowmoT > (MG.slowmoDur || 0.6)) { MG.slowmo = 0; MG.slowmoT = 0; MG.slowmoDur = 0; } }
  const cineNow = MG.state === 'play' && PLAYER.state === 'cine' && !!CAM.cine;
  document.body.classList.toggle('cine', cineNow);
  const skip = cineNow && (IN.down('confirm') || IN.down('pause'));
  if (skip) k *= 6;
  const dt = Math.min(rdt, 0.05) * k;
  MG.dt = dt; MG.t += dt;
  if (MG.state === 'play' || MG.state === 'cine') {
    if (IN.hit('pause') && !CAM.cine && PLAYER.state !== 'cine' && PLAYER.a && PLAYER.a.alive && !MENU.cur && MG.rt > (OR.noPauseT || 0)) { MENU.open('pause'); return; }
    GAME.save.t = (GAME.save.t || 0) + rdt;
    PLAYER.update(dt);
    ENEMY.update(dt);
    COMBAT.update(dt);
    LEVEL.update(dt);
    if (BOSS && BOSS.update) BOSS.update(dt);
  } else if (MG.state === 'title') {
    MENU.titleUpdate(rdt);
  } else if (MG.state === 'pause' || MG.state === 'result') {
    if (PLAYER.a) { PLAYER.a.animate(dt * 0.3); PLAYER.a.pose3D(dt * 0.3); }
  }
  FX.update(dt);
  if (MG.state !== 'title') CAM.update(rdt * (skip ? 6 : 1));
  if (PLAYER.a) R.updateShadow(V3(PLAYER.a.x, PLAYER.a.y, PLAYER.a.z));
  HUD.update(rdt);
};
MG.gameUpdate = GAME.update;
MG.difficulty = 'normal';
