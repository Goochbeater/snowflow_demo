/* ==== p57_or_player.js ==== */
/* OPUS RING — the rules of the Lands Between laid over the engine's player: stamina, Flasks of Crimson Tears, runes
   and levels, roll / backstep / sprint, guard and guard-break, an Ash of War, fall damage, death and lost runes,
   resting at Sites of Grace. */
const OR = { stamT: 0, flasks: 3, shiftT: 0, sprint: false };
OR.S = () => GAME.save;
OR.hpMax = () => 100 + (OR.S().vig || 0) * 14;
OR.stamMax = () => 100 + (OR.S().end || 0) * 9;
OR.dmgMul = () => 1 + (OR.S().str || 0) * 0.07;
OR.levelCost = () => 280 + ((OR.S().vig || 0) + (OR.S().end || 0) + (OR.S().str || 0)) * 150;
OR.level = () => 1 + (OR.S().vig || 0) + (OR.S().end || 0) + (OR.S().str || 0);
OR.addRunes = function (n) { const s = OR.S(); s.runes = (s.runes || 0) + Math.round(n); HUD.runeGain = (HUD.runeGain || 0) + Math.round(n); HUD.runeT = 2.2; };
OR.COST = { a1: 13, a2: 13, a3: 14, a4: 15, a5: 20, heavy: 26, storm: 18, lunge: 18, plunge: 14, dodge: 16, backstep: 9 };
PLAYER.skills = { push: false, grip: false, throw: false, rage: false, heavy: true };
PLAYER.stam = 100; PLAYER.fpMax = 60;
PLAYER.spawn = function (x, y, z, yaw) {
  if (PLAYER.a) PLAYER.a.dispose();
  if (STEED.on) { STEED.on = false; if (STEED.Q) STEED.Q.g.visible = false; }
  if (y === null || y === undefined) y = WORLD.spawnY([x, null, z]);
  const a = new Actor(CHAR.T.maul, { x, y, z, yaw, hp: OR.hpMax(), team: 'hero', moves: MOV.maul, r: 0.33, h: 1.8 });
  a.isPlayer = true; PLAYER.a = a;
  const S = new Weapon('longsword', { prio: 5 }); S.addTo(R.scene); a.saber = S; PLAYER.saber = S; a.setProp(S, false);
  { const sh = WPN.shield('round', 0x4a3a2a, 0x8a7a5a); a.inst.bones[7].add(sh); WPN.strapSide(sh); a.shieldMesh = sh; }   // a battered round shield on the left arm
  a.onLand = (airT) => PLAYER.onLand(airT); a.react = (info) => PLAYER.react(info); a.die = (info) => PLAYER.die(info); a.onDamage = (amt, info) => PLAYER.onDamage(amt, info); a.onActEnd = (n) => PLAYER.onActEnd(n);
  PLAYER.state = 'move'; PLAYER.fp = PLAYER.fpMax; PLAYER.stam = OR.stamMax(); PLAYER.lock = null; PLAYER.throwS = null; PLAYER.gripT = null; PLAYER.execT = null; PLAYER.rageOn = false; PLAYER.rage = 0; PLAYER.focus = null;
  PLAYER.lastSafe.set(x, y, z); COMBAT.actors.push(a); a.base = 'idleCalm';
  a.physics(0); a.animate(0.016); a.pose3D(0.016);
  return a;
};
PLAYER.update = function (dt) {
  const a = PLAYER.a; if (!a) return;
  const st = PLAYER.state;
  a.iframe = Math.max(0, a.iframe - dt); a.flash = Math.max(0, a.flash - dt);
  // resources: stamina comes back after a beat; focus trickles
  OR.stamT -= dt; const SM = OR.stamMax();
  if (OR.stamT <= 0 && !OR.sprint) PLAYER.stam = Math.min(SM, PLAYER.stam + dt * (st === 'block' ? 14 : 42));
  PLAYER.fp = Math.min(PLAYER.fpMax, PLAYER.fp + dt * 1.2); PLAYER.rage = sat(PLAYER.stam / SM) * 99.9;
  if (!a.alive) { a.speed = damp(a.speed, 0, 8, dt); a.vx = 0; a.vz = 0; if (st !== 'ride') a.physics(dt); a.animate(dt); a.pose3D(dt); PLAYER.saber.update(dt, MG.t); PLAYER.saber.sampleTrails(MG.t, 0); return; }
  if (IN.hit('lock') && st !== 'ride') PLAYER.toggleLock();
  if (PLAYER.lock && (!PLAYER.lock.alive || PLAYER.lock.hidden || a.dist(PLAYER.lock) > 26)) PLAYER.lock = null;
  // intent
  const dir = PLAYER.inputDir(PLAYER._d); const mag = Math.min(1, dir.length()); if (mag > 0.01) dir.normalize();
  const want = st === 'move' || st === 'block' || st === 'air' || st === 'drink';
  const locked = PLAYER.lock && PLAYER.lock.alive && a.dist(PLAYER.lock) < 20;
  // sprint: hold the dodge key while moving
  if (st === 'move' && IN.down('dodge') && mag > 0.3) { OR.shiftT += dt; OR.sprint = OR.shiftT > 0.22 && PLAYER.stam > 0; } else if (st !== 'move' || !IN.down('dodge')) OR.sprint = false;
  if (OR.sprint) { PLAYER.stam -= dt * 9; OR.stamT = 0.5; if (PLAYER.stam <= 0) OR.sprint = false; }
  let spd = 0;
  if (want) spd = mag * (st === 'block' ? 2.1 : st === 'drink' ? 1.7 : OR.sprint ? 7.1 : locked ? 3.8 : 4.9);
  const accel = a.grounded ? 30 : 9, tvx = dir.x * spd, tvz = dir.z * spd;
  if (want) { a.vx = damp(a.vx, tvx, accel * 0.35, dt); a.vz = damp(a.vz, tvz, accel * 0.35, dt); }
  a.speed = Math.hypot(a.vx, a.vz);
  if (st === 'move' || st === 'air' || st === 'drink') {
    if (locked && !OR.sprint) a.yaw = dampA(a.yaw, a.angTo(PLAYER.lock), 12, dt);
    else if (mag > 0.1) a.yaw = dampA(a.yaw, Math.atan2(dir.x, dir.z), 12, dt);
  } else if (st === 'block') { const t = locked ? PLAYER.lock : PLAYER.pickTarget(a.forward(_v3), 9, 1.2); if (t) a.yaw = dampA(a.yaw, a.angTo(t), 10, dt); else if (mag > 0.1) a.yaw = dampA(a.yaw, Math.atan2(dir.x, dir.z), 6, dt); }
  const cy = Math.cos(a.yaw), sy = Math.sin(a.yaw);
  if (a.speed > 0.1) { a.mvx = (a.vx * cy - a.vz * sy) / a.speed; a.mvz = (a.vx * sy + a.vz * cy) / a.speed; }
  const S = PLAYER.states[st]; if (S) S(dt, dir, mag);
  if (PLAYER.state === 'attack' || PLAYER.state === 'exec') {
    const c = a.actClip;
    if (c) { const m = PLAYER.rootMove(c, a.actT) * (c.move ? PLAYER.moveBudget / Math.max(0.01, c.move[c.move.length - 1][1]) : 0); const dm = m - PLAYER.movePrev; PLAYER.movePrev = m; a.vx = 0; a.vz = 0; if (dm > 0) a.moveH(Math.sin(a.yaw) * dm, Math.cos(a.yaw) * dm); }
  }
  if (PLAYER.state !== 'ride') a.physics(dt);
  if (a.grounded && a.floorC && !a.floorC.hazard && PLAYER.state !== 'ride') { PLAYER.safeT = (PLAYER.safeT || 0) + dt; if (PLAYER.safeT > 0.25) PLAYER.lastSafe.set(a.x, a.y, a.z); } else PLAYER.safeT = 0;
  if (LEVEL.cur && a.y < LEVEL.cur.killY) PLAYER.fell();
  if (PLAYER.state === 'move') {
    const calm = !locked && !COMBAT.foes().some((e) => e.alerted !== false && e.dist(a) < 14) && !BOSS.list.some((b) => b.alive && !b.hidden && !b.passive && b.dist(a) < 22);
    a.setBase(a.speed > 2.6 && !locked ? 'run' : calm ? 'idleCalm' : 'guard', 0.24);
  } else if (PLAYER.state === 'block') a.setBase('guard');
  if (PLAYER.state !== 'ride' && MG.zoomOut) MG.zoomOut = damp(MG.zoomOut, 0, 3, dt);
  a.animate(dt);
  PLAYER.hitWindows(dt);
  a.pose3D(dt);
  PLAYER.saber.update(dt, MG.t);
  PLAYER.saber.sampleTrails(MG.t, (PLAYER.state === 'attack' || PLAYER.state === 'exec' || a.act === 'plunge' || a.act === 'rideSlash') ? 1 : 0);
};
(function () {
  const mv0 = PLAYER.states.move;
  PLAYER.states.move = function (dt, dir, mag) {
    const a = PLAYER.a;
    if (!IN.down('dodge')) { const t = OR.shiftT; OR.shiftT = 0; if (IN.buf.dodge !== undefined) { delete IN.buf.dodge; if (t <= 0.22 && a.grounded) { PLAYER.dodge(dir, mag); return; } } }
    else if (IN.buf.dodge !== undefined && MG.rt - IN.buf.dodge > 0.5) delete IN.buf.dodge;
    const held = IN.buf.dodge; if (held !== undefined) delete IN.buf.dodge;       // the engine rolls on press; here a roll is a tap released
    PLAYER.jumps = 2;                                                              // one jump: no Force flip
    if (a.grounded) {
      if (IN.take('throw')) { PLAYER.drink(); if (held !== undefined) IN.buf.dodge = held; return; }
      if (IN.take('push')) { PLAYER.skill(); if (held !== undefined) IN.buf.dodge = held; return; }
      if (IN.take('rage')) { STEED.whistle(); if (held !== undefined) IN.buf.dodge = held; return; }
      if (IN.peek('jump') && PLAYER.stam <= 0) delete IN.buf.jump;
    }
    PLAYER.idleT = -99;
    mv0(dt, dir, mag);
    if (PLAYER.state === 'air' && a.vy > 5) { PLAYER.stam -= 8; OR.stamT = 0.6; PLAYER.jumps = 2; }
    if (held !== undefined && PLAYER.state === 'move') IN.buf.dodge = held;
  };
  const at0 = PLAYER.attack;
  PLAYER.attack = function (name) {
    if (PLAYER.stam <= 0) { PLAYER.state = PLAYER.a.grounded ? 'move' : 'air'; PLAYER.comboQ = null; return; }
    at0(name);
    const n = PLAYER.a.act; PLAYER.stam -= OR.COST[n] || 12; OR.stamT = 0.75; OR.sprint = false;
  };
  const air0 = PLAYER.states.air;
  PLAYER.states.air = function (dt) { const a = PLAYER.a; PLAYER.jumps = 2; if (PLAYER.stam <= 0) { delete IN.buf.attack; delete IN.buf.heavy; } const was = PLAYER.plunging; air0(dt); if (!was && a.act === 'plunge' && PLAYER.plunging) { PLAYER.stam -= OR.COST.plunge; OR.stamT = 0.8; } };
  const blk0 = PLAYER.states.block;
  PLAYER.states.block = function (dt) { if (IN.buf.dodge !== undefined && PLAYER.stam <= 0) delete IN.buf.dodge; blk0(dt); };
  const atk0 = PLAYER.states.attack;
  PLAYER.states.attack = function (dt) { if (PLAYER.stam <= 0) { delete IN.buf.dodge; } atk0(dt); };
})();
PLAYER.states.drink = function (dt) {
  const a = PLAYER.a;
  if (!a.act) { PLAYER.state = 'move'; return; }
  if (!OR.drank && a.actT > 0.55) { OR.drank = true; const h = OR.hpMax() * 0.48 + 12; a.hp = Math.min(a.hpMax, a.hp + h); FX.puff(a.chest(V3()), 12, { add: true, size: 0.3, col: [2.2, 0.5, 0.3], a: 0.6, spread: 1.2, life: 0.9, rise: 1.2 }); FX.flashLight(a.chest(V3()), [1, 0.4, 0.25], 5, 5, 0.4); }
  if (a.actT > 0.9 && IN.take('dodge')) { a.stop(0.08); PLAYER.state = 'move'; PLAYER.dodge(PLAYER.inputDir(PLAYER._d), 1); }
};
PLAYER.drink = function () {
  const a = PLAYER.a; if (OR.flasks <= 0) { HUD.pop('THE FLASK IS EMPTY'); return; }
  if (a.hp >= a.hpMax) { HUD.pop('ALREADY HALE'); return; }
  OR.flasks--; OR.drank = false; PLAYER.state = 'drink'; a.play('drink', { fade: 0.14 }); OR.sprint = false;
};
/* Ash of War — Stormcaller: the blade whirled overhead, a ring of wind that throws back everything near */
PLAYER.skill = function () {
  const a = PLAYER.a; if (PLAYER.fp < 14) { HUD.pop('NOT ENOUGH FP'); return; } if (PLAYER.stam <= 0) return;
  PLAYER.fp -= 14; PLAYER.attack('storm');
  if (a.act !== 'storm') return;
  const p = V3(a.x, a.y + 0.1, a.z); FX.ring(p, [0.7, 0.9, 1.4], 4.2, 0.6);
  MG.after(0.62, () => { if (!a.alive || a.act !== 'storm') return; const q = V3(a.x, a.y + 0.1, a.z); FX.ring(q, [0.8, 1.0, 1.6], 6.5, 0.5); R.shock(a.chest(V3()), 0.9); FX.addShake(0.3);
    for (let i = 0; i < 14; i++) { const an = i / 14 * TAU; FX.puff(V3(a.x + Math.cos(an) * 1.2, a.y + 0.5, a.z + Math.sin(an) * 1.2), 1, { size: 0.5, grow: 3, col: [0.7, 0.75, 0.8], a: 0.3, life: 0.7, spread: 0.3, vel: V3(Math.cos(an) * 8, 1, Math.sin(an) * 8), drag: 3 }); }
    for (const e of COMBAT.foes()) { const d = e.dist(a); if (d < 5.2 && Math.abs(e.y - a.y) < 2.5) COMBAT.damage(e, 20 * OR.dmgMul(), { src: a, kind: 'sweep', heavy: true, knock: !e.isLord, force: 7, dir: V3(e.x - a.x, 0, e.z - a.z).normalize(), p: e.chest(V3()) }); } });
};
PLAYER.dodge = function (dir, mag) {
  const a = PLAYER.a; if (PLAYER.stam <= 0) return;
  PLAYER.dodgeDir = PLAYER.dodgeDir || new THREE.Vector3();
  if (mag < 0.1) { a.forward(PLAYER.dodgeDir).negate(); a.play('backstep', { fade: 0.05 }); a.iframe = 0.26; PLAYER.stam -= OR.COST.backstep; PLAYER.dodgeK = 0.62; }
  else { PLAYER.dodgeDir.copy(dir).normalize(); a.yaw = Math.atan2(dir.x, dir.z); a.play('dodge', { fade: 0.06 }); a.iframe = 0.42; PLAYER.stam -= OR.COST.dodge; PLAYER.dodgeK = 1; }
  OR.stamT = 0.7; PLAYER.state = 'dodge'; OR.sprint = false;
};
PLAYER.states.dodge = function (dt) {
  const a = PLAYER.a;
  if (!a.act) { PLAYER.state = a.grounded ? 'move' : 'air'; return; }
  const u = a.actU(), sp = u < 0.72 ? 9.6 * (1 - u * 0.9) * (PLAYER.dodgeK || 1) : 0;
  a.vx = PLAYER.dodgeDir.x * sp; a.vz = PLAYER.dodgeDir.z * sp;
  if (u > 0.6 && IN.take('attack') && PLAYER.stam > 0) PLAYER.attack('a1');
  else if (u > 0.74 && IN.peek('dodge') && PLAYER.stam > 0) { IN.take('dodge'); const d = PLAYER.inputDir(PLAYER._d); PLAYER.dodge(d, Math.min(1, d.length())); }
};
PLAYER.jump = function () { const a = PLAYER.a; a.vy = 7.4; a.grounded = false; PLAYER.jumps = 2; PLAYER.state = 'air'; a.play('jump', { fade: 0.08 }); };
PLAYER.onLand = function (airT) {
  const a = PLAYER.a;
  const fall = PLAYER.fallV !== undefined ? PLAYER.fallV : 0;
  if (PLAYER.plunging) { PLAYER.plunging = false; a.play('land', { fade: 0.02 }); PLAYER.state = 'attack'; PLAYER.slamImpact(1.1); return; }
  if (airT > 1.02 && PLAYER.state !== 'ride') { const d = (airT - 1.02) * 150; if (airT > 1.75) COMBAT.damage(a, 9999, { kind: 'fall', unblockable: true }); else COMBAT.damage(a, d, { kind: 'fall', unblockable: true }); FX.addShake(0.4); }
  if (PLAYER.state === 'air') { PLAYER.state = 'move'; if (airT > 0.5) { a.play('land', { fade: 0.05, speed: 1.6 }); PLAYER.state = 'attack'; FX.puff(V3(a.x, a.y + 0.05, a.z), 6, { size: 0.35, col: [0.45, 0.42, 0.36], a: 0.25, spread: 1.6 }); } else a.stop(0.1); }
  void fall;
};
PLAYER.slamImpact = function (mul) {
  const a = PLAYER.a, f = a.forward(_v3), p = V3(a.x + f.x * 1.0, a.y + 0.05, a.z + f.z * 1.0);
  FX.ring(p, [1.0, 0.9, 0.7], 2.6 * (mul || 1), 0.35); FX.puff(p, 8, { size: 0.4, col: [0.42, 0.38, 0.32], a: 0.4, spread: 2.2, life: 1.2 }); FX.addShake(0.4);
  for (const e of COMBAT.foes()) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < 2.3 * (mul || 1) + (e.r || 0) && Math.abs(e.y - a.y) < 2) COMBAT.damage(e, 14 * OR.dmgMul(), { src: a, kind: 'slam', dir: V3(e.x - p.x, 0, e.z - p.z).normalize(), heavy: true, p: e.chest(V3()) }); }
};
PLAYER.landHit = function (t, p, dmg, kind) {
  const a = PLAYER.a, dir = _v3.set(t.x - a.x, 0, t.z - a.z).normalize();
  dmg *= OR.dmgMul();
  if (t.tryBlock && t.tryBlock(a, dmg, kind, p)) { PLAYER.clash(t, p); return; }
  const heavy = kind === 'slam' || kind === 'sweep' || kind === 'thrust' || kind === 'plunge';
  const hp0 = t.hp; COMBAT.damage(t, dmg, { src: a, kind, dir: dir.clone(), p: p.clone(), heavy });
  if (t.isBoss && HUD.bossHit) HUD.bossHit(hp0 - t.hp);
  const plate = t.D && (t.D.poise || t.D.elite) || t.isBeast === undefined && t.isLord && t.key === 'none';
  if (plate) FX.spark(p, dir.clone().negate().add(V3(0, 0.6, 0)), 16, 6.5, [3.4, 2.8, 1.8]);
  FX.puff(p, 5, { size: 0.09, grow: 3, col: [0.32, 0.015, 0.015], a: 0.85, life: 0.45, spread: 2.2, rise: -6, drag: 2.5, vel: V3(-dir.z * rnd(-2, 2), 1.5, dir.x * rnd(-2, 2)) });
  FX.impact(p, [2.2, 1.9, 1.6], heavy ? 1.15 : 0.7);
  if (heavy || !t.alive) FX.flashActor(t, 0.045);
  FX.addShake(heavy ? 0.4 : 0.18); MG.hitStop = Math.max(MG.hitStop, heavy ? 0.1 : 0.055);
  PLAYER.fp = Math.min(PLAYER.fpMax, PLAYER.fp + 0.6);
};
PLAYER.clash = function (t, p) { FX.impact(p, [2.6, 2.4, 2.0], 1.2); FX.spark(p, V3(0, 1, 0), 22, 7, [4, 3.2, 2]); FX.addShake(0.22); MG.hitStop = Math.max(MG.hitStop, 0.07); PLAYER.stam -= 6; };
PLAYER.canDeflect = function (b) {
  const a = PLAYER.a; if (!a.alive || PLAYER.state !== 'block') return false;
  const toBolt = _v3.set(b.p.x - a.x, 0, b.p.z - a.z).normalize(), f = _v4.set(Math.sin(a.yaw), 0, Math.cos(a.yaw));
  return toBolt.dot(f) > -0.1;
};
PLAYER.deflect = function (b) {   // a guarded arrow just clatters off the blade
  const a = PLAYER.a; FX.spark(b.p, b.v.clone().normalize().negate(), 12, 5, [3.4, 2.8, 1.8]); FX.impact(b.p, [2.4, 2.2, 1.8], 0.7); FX.addShake(0.12);
  PLAYER.stam -= b.dmg * 0.9; OR.stamT = 0.7; if (PLAYER.stam <= 0) OR.guardBreak(); a.flinch(V3(a.x - b.p.x, 0, a.z - b.p.z).normalize(), 0.4); b.dispose();
};
OR.guardBreak = function () { const a = PLAYER.a; PLAYER.stam = 0; OR.stamT = 1.4; a.play('hit', { fade: 0.04, speed: 0.55 }); PLAYER.state = 'hit'; HUD.pop('GUARD BROKEN'); FX.addShake(0.35); };
PLAYER.onDamage = function (amt, info) {
  const a = PLAYER.a;
  if (PLAYER.state === 'exec' || PLAYER.state === 'cine' || MG.god) return false;
  const diff = MG.difficulty === 'easy' ? 0.6 : MG.difficulty === 'hard' ? 1.3 : 1.0;
  if (PLAYER.state === 'block' && info.src && info.kind !== 'fire' && info.kind !== 'quake' && info.kind !== 'fall') {
    const d = _v3.set(info.src.x - a.x, 0, info.src.z - a.z).normalize();
    if (d.dot(a.forward(_v4)) > -0.1) {
      const cp = a.chest(_v5).addScaledVector(d, 0.5).clone();
      if (MG.t - PLAYER.blockPress < 0.24 && info.src.onParried && info.kind !== 'bolt') { info.src.onParried(a); FX.spark(cp, d, 30, 7, [4, 3.4, 2]); FX.impact(cp, [3, 2.8, 2.2], 1.5); HUD.pop('PARRY'); MG.hitStop = 0.13; return false; }
      PLAYER._blockedT = MG.t; FX.spark(cp, d, 16, 5, [3.6, 3, 2]); FX.impact(cp, [2.6, 2.3, 1.9], 1.1); FX.addShake(0.16); MG.hitStop = Math.max(MG.hitStop, 0.05);
      PLAYER.stam -= amt * (OR.guardStam ? OR.guardStam() : 1.15); OR.stamT = 0.9; a.flinch(d.clone().negate(), 0.5);
      if (PLAYER.stam <= 0) { OR.guardBreak(); return amt * diff * 0.6; }
      return amt * diff * (OR.guardLeak ? OR.guardLeak() : 0.22);
    }
  }
  return amt * diff * (OR.defMul ? OR.defMul(info) : 1);
};
PLAYER.react = function (info) {
  const a = PLAYER.a;
  if (PLAYER._blockedT === MG.t) return;
  HUD.hurt(); a.flash = 0.15;
  if (info.kind === 'fire') { if (!a.flinchT) a.flinch(info.dir, 0.4); return; }
  FX.addShake(0.3);
  if (PLAYER.state === 'ride') { if (info.knock || a.hp < a.hpMax * 0.25 || info.heavy) STEED.dismount(true); return; }
  if (PLAYER.state === 'exec') return;
  if (info.knock) { a.play('knock', { fade: 0.05 }); PLAYER.state = 'knock'; const d = info.dir || _v3.set(0, 0, -1); a.vx = d.x * 7; a.vz = d.z * 7; a.vy = 4; a.iframe = 1.1; return; }
  if (info.kind === 'bolt' || info.kind === 'fall') { a.flinch(info.dir, 0.8); return; }
  a.play('hit', { fade: 0.04 }); PLAYER.state = 'hit'; PLAYER.comboQ = null;
};
PLAYER.die = function () {
  const a = PLAYER.a; if (STEED.on) STEED.dismount(false);
  PLAYER.state = 'dead'; a.play('death', { fade: 0.1 }); PLAYER.lock = null;
  MG.after(0.9, () => GAME.onPlayerDeath(), true);
};
PLAYER.fell = function () { const a = PLAYER.a; if (!a.alive) return; a.hp = 0; a.alive = false; COMBAT.kill(a, { kind: 'fall' }); };
PLAYER.onKill = function (t) {
  if (PLAYER.lock === t) PLAYER.lock = null;
  if (t.runes && !t.isBoss) OR.addRunes(t.runes);
};
PLAYER.toggleLock = function () {
  if (PLAYER.lock) { PLAYER.lock = null; return; }
  const f = _v3.set(Math.sin(CAM.yaw), 0, Math.cos(CAM.yaw));
  PLAYER.lock = PLAYER.pickTarget(f, 24, 0.9) || PLAYER.pickTarget(f, 14, PI);
  if (!PLAYER.lock) { CAM.yawT = PLAYER.a.yaw; }
};
/* executions become critical hits on a stance-broken foe: one deep thrust */
(function () { const ex0 = PLAYER.execUpdate; PLAYER.execUpdate = function (dt) { const E = PLAYER.execT; if (E && E.time + dt > 0.92 && !E.kill) { const t = E.t; E.kill = true; t.stunned = false; const d = t.isBoss ? Math.min(t.hpMax * 0.13, 150) : 110; COMBAT.damage(t, d * OR.dmgMul(), { src: PLAYER.a, kind: 'exec', dir: PLAYER.a.forward(V3()), unblockable: true, knock: !t.isLord }); if (t.isBoss && HUD.bossHit) HUD.bossHit(d); MG.slowmo = 0.5; FX.addShake(0.4); } ex0(dt); }; })();
/* ------------------------------------------------------------------ camera: no auto-swing; a longer, centred view */
CAM.update = function (dt) {
  const cam = R.camera, P = PLAYER.a;
  if (CAM.cine) { CAM.cineUpdate(dt); return; }
  if (!P) return;
  const lx = IN.A.lx, ly = IN.A.ly;
  if (Math.abs(lx) + Math.abs(ly) > 0.0025) CAM.idleT = 0; else CAM.idleT += dt;
  CAM.yaw -= lx; CAM.pitch = clamp(CAM.pitch - ly, -1.05, 0.7);
  const tgt = PLAYER.lock && PLAYER.lock.alive ? PLAYER.lock : null;
  CAM.lockBlend = damp(CAM.lockBlend, tgt ? 1 : 0, 6, dt);
  if (tgt) { CAM.yaw = dampA(CAM.yaw, Math.atan2(tgt.x - P.x, tgt.z - P.z), 6, dt); const big = (tgt.h || 1.8) > 2.4; CAM.pitch = damp(CAM.pitch, big ? -0.08 : -0.2, 2, dt); }
  const riding = PLAYER.state === 'ride';
  const piv = _v1.set(P.x, P.y + (riding ? 1.5 : 1.52) - (P.pose && !riding ? P.pose.crouch * 0.4 : 0), P.z);
  if (!CAM.pivot) CAM.pivot = piv.clone();
  const k = CAM.snap || riding ? 1 : 1 - Math.exp(-16 * dt);
  CAM.pivot.lerp(piv, k);
  if (Math.abs(CAM.pivot.y - piv.y) > 0.6) CAM.pivot.y = lerp(CAM.pivot.y, piv.y, 0.3);
  const bigT = tgt && (tgt.h || 1.8) > 2.4 ? 1.6 : 0;
  CAM.distT = lerp(4.0, 4.3 + bigT, CAM.lockBlend) + (MG.zoomOut || 0);
  CAM.dist = damp(CAM.dist, CAM.distT, 4, dt);
  const cp = Math.cos(CAM.pitch), fwd = _v2.set(Math.sin(CAM.yaw) * cp, Math.sin(CAM.pitch), Math.cos(CAM.yaw) * cp);
  const look = _v4.copy(CAM.pivot);
  if (tgt) { const mid = _v5.set(tgt.x, tgt.y + Math.min(2.6, (tgt.h || 1.8) * 0.6), tgt.z); look.lerp(mid, 0.26 * CAM.lockBlend); }
  const back = _v5.copy(fwd).negate();
  let d = CAM.dist; const hit = PHY.ray(look.x, look.y, look.z, back.x, back.y, back.z, d + 0.3, 'los');
  if (hit) d = Math.max(0.7, Math.min(d, hit.t - 0.3));
  CAM.curD = CAM.curD === undefined || CAM.snap ? d : (d < CAM.curD ? d : damp(CAM.curD, d, 3, dt));
  const pos = CAM.pos.copy(look).addScaledVector(back, CAM.curD);
  if (PHY.hf) { const g = PHY.hf(pos.x, pos.z); if (g !== null && pos.y < g + 0.35) pos.y = g + 0.35; }
  const s = FX.shake * FX.shake * 0.1, t = MG.rt * 31;
  pos.x += (vnoise2(t, 1.3) - 0.5) * s; pos.y += (vnoise2(t, 7.1) - 0.5) * s; pos.z += (vnoise2(t, 3.7) - 0.5) * s;
  cam.position.copy(pos); cam.lookAt(look);
  CAM.fovT = 55 + (OR.sprint ? 3 : 0) + (riding ? Math.min(9, STEED.spd * 0.5) : 0);
  CAM.fov = damp(CAM.fov, CAM.fovT, 3, dt);
  if (Math.abs(cam.fov - CAM.fov) > 0.01) { cam.fov = CAM.fov; cam.updateProjectionMatrix(); }
  CAM.snap = false;
};
R.dynOn = false; R.kick = function (z) { R.G.zoom = Math.max(R.G.zoom, z * 0.2); };
/* ------------------------------------------------------------------ grace, death, loot, victory */
OR.rest = function (Gr) {
  const L = LEVEL.cur, a = PLAYER.a;
  if (COMBAT.foes().some((e) => e.alerted && e.dist(a) < 26) || BOSS.list.some((b) => b.alive && !b.hidden && !b.passive && b.dist(a) < 40 && b.state !== 'patrol')) { HUD.pop('CANNOT REST WITH FOES NEAR'); return; }
  const s = OR.S(); s.graces = s.graces || {};
  if (!Gr.found) { Gr.found = true; s.graces[L.id + Gr.cp] = 1; HUD.banner('LOST GRACE DISCOVERED', 'gold'); }
  L.cp = Gr.cp; s.level = L.id; s.cp = Gr.cp; OR.curGrace = Gr;
  a.hp = a.hpMax = OR.hpMax(); OR.flasks = s.flaskMax || 3; PLAYER.fp = PLAYER.fpMax; PLAYER.stam = OR.stamMax(); GAME.store();
  WORLD.respawnFoes();
  PLAYER.state = 'cine'; a.vx = a.vz = 0; a.stop(0.2); a.setBase('rest', 0.5); a.yaw = Math.atan2(Gr.x - a.x, Gr.z - a.z); HUD.show(false);
  MENU.open('grace', { Gr });
};
OR.leaveGrace = function () { const a = PLAYER.a; MENU.close(); if (a) { a.setBase('idleCalm', 0.4); PLAYER.state = 'move'; } HUD.show(true); MG.state = 'play'; IN.buf = {}; OR.noPauseT = MG.rt + 0.35; const g = OR.curGrace; OR.curGrace = null; if (g && g.onLeave) g.onLeave(g); };
OR.died = function () {
  if (OR.dying) return; OR.dying = true; HUD.banner('YOU DIED', 'red', 4.2); HUD.setBoss(null);
  MG.after(3.4, () => { R.G.fade = 0; OR.fadeT = 0; OR.fading = 1; }, true);
  MG.after(4.4, () => OR.respawn(true), true);
};
OR.respawn = function (died) {
  const L = LEVEL.cur, s = OR.S(), a0 = PLAYER.a, def = L.def, sp = (def.checkpoints && def.checkpoints[L.cp]) || def.start;
  if (died && a0) { const ls = PLAYER.lastSafe; if ((s.runes || 0) > 0) s.stain = { level: L.id, x: ls.x, y: ls.y, z: ls.z, runes: s.runes }; s.runes = 0; }
  for (const b of COMBAT.bolts) b.dispose(); COMBAT.bolts.length = 0; COMBAT.actors.length = 0; MG.timers = MG.timers.filter((t) => t.real); CAM.cine = null; MG.slowmo = 0; MG.hitStop = 0;
  for (const e of ENEMY.list) { e.dispose(); if (e.gun && e.gun.parent) e.gun.parent.remove(e.gun); } ENEMY.list.length = 0;
  PLAYER.spawn(sp[0], WORLD.spawnY(sp), sp[2], sp[3] || 0); CAM.reset(sp[3] || 0);
  OR.flasks = s.flaskMax || 3;
  for (const sp2 of (L.spawns || [])) WORLD.make(sp2.type, sp2.x, sp2.z, sp2.o);
  for (const fn of (L.onRespawn || [])) fn();
  for (const B of (L.bosses || [])) { if (!B.dead) B.reset(); else if (B.cur && !COMBAT.actors.includes(B.cur)) { /* felled: stays gone */ } }
  OR.placeStain(); GAME.store();
  OR.dying = false; OR.fading = -1; MG.state = 'play'; HUD.show(true); PLAYER.state = 'move';
};
WORLD.spawnY = function (sp) { const hint = sp[1], free = hint === null || hint === undefined; const g = free ? PHY.ground(sp[0], sp[2], 0.3, 600, -600) : PHY.ground(sp[0], sp[2], 0.3, hint + 1.5, hint - 40); return g !== null ? g : (hint || 0); };
OR.placeStain = function () {
  const L = LEVEL.cur, s = OR.S(); if (OR.stainObj) { if (OR.stainObj.me.parent) OR.stainObj.me.parent.remove(OR.stainObj.me); OR.stainObj.I.off = true; OR.stainObj = null; }
  if (!s.stain || s.stain.level !== L.id) return;
  const st = s.stain, me = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 3.0, 1.0), toneMapped: false, fog: false, transparent: true, opacity: 0.85 })); me.position.set(st.x, st.y + 0.5, st.z); LEVEL.add(me);
  const I = WORLD.interact(L, V3(st.x, st.y + 0.9, st.z), 2.2, IN.keyLabel('grip') + ' RETRIEVE LOST RUNES', () => { I.off = true; if (me.parent) me.parent.remove(me); OR.addRunes(st.runes); s.stain = null; HUD.banner('RUNES RETRIEVED', 'gold', 2.2); GAME.store(); OR.stainObj = null; });
  OR.stainObj = { me, I };
  L.updates.push((dt, t) => { if (me.parent) { me.position.y = st.y + 0.5 + Math.sin(t * 2) * 0.06; if (RNG() < dt * 8) FX.puff(me.position, 1, { add: true, size: 0.05, grow: 0.4, col: [0.7, 2.2, 0.7], a: 0.9, life: 1.4, spread: 0.25, rise: 0.8 }); } });
};
OR.loot = function (o) {
  const s = OR.S();
  if (o.runes) OR.addRunes(o.runes);
  if (o.flask) { s.flaskMax = (s.flaskMax || 3) + 1; OR.flasks = Math.min(s.flaskMax, OR.flasks + 1); }
  if (o.fn) o.fn();
  HUD.item(o.name || 'Golden Rune', o.desc || (o.runes ? '+' + o.runes + ' runes' : ''));
};
OR.felled = function (b, o) {
  MG.slowmo = 0.3; MG.slowmoT = 0; MG.slowmoDur = 1.6; FX.addShake(0.5);
  const p = b.chest(V3()); FX.flashLight(p, [1, 0.8, 0.4], 14, 16, 1.2); R.shock(p, 1.4);
  MG.after(1.6, () => { HUD.banner(o.major === false ? 'ENEMY FELLED' : 'GREAT ENEMY FELLED', 'gold', 4.5); OR.addRunes(b.runes || 0); HUD.setBoss(null); GAME.store(); }, true);
};
OR.update = function (rdt) {
  if (OR.fading) { OR.fadeT = (OR.fadeT || 0) + rdt; if (OR.fading > 0) R.G.fade = sat(OR.fadeT / 0.9); else { R.G.fade = Math.max(0, R.G.fade - rdt * 1.2); if (R.G.fade <= 0) OR.fading = 0; } }
};
(function () { const hw0 = PLAYER.hitWindows; PLAYER.hitWindows = function (dt) { if (PLAYER.state === 'ride' && PLAYER.a.act === 'rideSlash') { PLAYER.state = 'attack'; hw0(dt); PLAYER.state = 'ride'; } else hw0(dt); }; })();
