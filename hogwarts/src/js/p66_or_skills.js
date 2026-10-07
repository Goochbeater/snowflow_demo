/* ==== p66_or_skills.js ==== */
/* OPUS RING — skills. Seven Ashes of War, five spells, and the tools on the belt (flasks, throwing daggers, fire pots,
   grease, runes). Each is a mocap-backed move plus its effect; the Ash on the weapon and the memorised spell are chosen
   in the equipment menu. */
Object.assign(IN.ACT, { spell: { k: ['KeyG'], p: 13 }, nextItem: { k: ['KeyZ'], p: 14 }, nextSpell: { k: ['KeyT'], p: 15 }, menu: { k: ['KeyI'], p: 8 }, map: { k: ['KeyM'] } });
(function () {
  const M = MOV.maul, G = MOV.GUARD, stub = (dur) => ({ dur, keys: [G] });
  for (const [k, d] of [['lion', 1.16], ['frost', 1.04], ['sacred', 1.01], ['flame', 1.08], ['resolve', 1.0], ['cast', 0.94], ['toss', 0.76], ['pray', 1.55], ['reject', 1.0]]) M[k] = stub(d);
  const m0 = MOCAP.moveSpecs;
  MOCAP.moveSpecs = function () {
    m0();
    const seg = (c, t0, t1, d) => [c, t0, t1, d === undefined ? (t1 - t0) : d];
    const put = (name, seqs, x) => { const m = M[name]; if (!m) return; m.mo = { seq: seqs, mode: 'full' }; m.dur = seqs.reduce((s, q) => s + q[3], 0); m.fadeOut = 0.22; if (x) for (const k in x) m[k] = x[k]; };
    const SA = 'Sword_Attack', SH = 'Sword_Heavy_Combo', SD = 'Sword_Dash', E = 'Spell_Simple_Enter', X = 'Spell_Simple_Exit';
    put('lion', [seg('NinjaJump_Start', 0.1, 0.62, 0.4), seg(SH, 0.33, 0.62, 0.26), seg(SH, 0.62, 0.88, 0.5)], { ev: [[0.42, 0.7, 3, 62, 'slam']], cancel: 1.0, move: [[0.04, 0], [0.6, 3.6]] });
    put('frost', [seg(SH, 0.08, 0.33, 0.3), seg(SH, 0.33, 0.62, 0.24), seg(SH, 0.62, 0.88, 0.5)], { ev: [[0.34, 0.56, 3, 20, 'slam']], cancel: 0.9 });
    put('sacred', [seg(SA, 0, 0.27, 0.28), seg(SA, 0.27, 0.6, 0.28), seg(SA, 0.6, 1.4, 0.45)], { ev: [[0.3, 0.56, 3, 30, 'slash']], cancel: 0.85 });
    put('flame', [seg(SD, 0, 0.2, 0.3), seg(SD, 0.2, 0.5, 0.28), seg(SD, 0.5, 1.4, 0.5)], { ev: [[0.3, 0.58, 3, 24, 'sweep']], cancel: 0.9, move: [[0.24, 0], [0.5, 1.5]] });
    put('resolve', [seg(E, 0, 0.53, 0.4), seg('Spell_Simple_Idle_Loop', 0, 0.3, 0.3), seg(X, 0, 0.43, 0.3)]);
    put('cast', [seg(E, 0, 0.53, 0.28), seg('Spell_Simple_Shoot', 0, 0.5, 0.36), seg(X, 0, 0.43, 0.3)]);
    put('toss', [seg('OverhandThrow', 0, 0.3, 0.22), seg('OverhandThrow', 0.3, 0.6, 0.2), seg('OverhandThrow', 0.6, 1.2, 0.34)]);
    put('pray', [seg(E, 0, 0.53, 0.4), seg('Spell_Simple_Idle_Loop', 0, 0.8, 0.8), seg(X, 0, 0.43, 0.35)]);
    put('reject', [seg(E, 0, 0.53, 0.34), seg('Spell_Simple_Shoot', 0, 0.5, 0.36), seg(X, 0, 0.43, 0.3)]);
  };
  /* a projectile tells its owner where it ended */
  const d0 = Bolt.prototype.dispose; Bolt.prototype.dispose = function () { const was = this.dead; d0.call(this); if (!was && this.onEnd) this.onEnd(this.p.clone()); };
})();
/* a non-attacking action: play the move, fire `fn` at time t, walk away after */
PLAYER.act2 = function (move, t, fn, o) { const a = PLAYER.a; o = o || {}; a.play(move, { fade: 0.1, speed: o.speed || 1 }); PLAYER.state = 'use'; PLAYER._use = { t, fn, done: false }; OR.sprint = false; };
PLAYER.states.use = function (dt) {
  const a = PLAYER.a, U = PLAYER._use; a.vx *= 0.82; a.vz *= 0.82;
  if (!a.act) { PLAYER.state = 'move'; return; }
  if (U && !U.done && a.actT >= U.t) { U.done = true; U.fn(); }
  if (U && U.done && a.actT > U.t + 0.2 && IN.peek('dodge') && PLAYER.stam > 0) { IN.take('dodge'); a.stop(0.08); PLAYER.state = 'move'; const d = PLAYER.inputDir(PLAYER._d); PLAYER.dodge(d, Math.min(1, d.length())); }
};
/* where a thrown or cast thing goes: at the locked or nearest foe ahead, else where the camera looks */
PLAYER.aimShot = function (from, range) {
  const a = PLAYER.a, f = V3(Math.sin(CAM.yaw), 0, Math.cos(CAM.yaw));
  const t = (PLAYER.lock && PLAYER.lock.alive ? PLAYER.lock : null) || PLAYER.pickTarget(f, range || 30, 0.45) || PLAYER.pickTarget(a.forward(V3()), range || 30, 0.7);
  if (t) { a.yaw = a.angTo(t); return { dir: t.chest(V3()).sub(from).normalize(), t }; }
  a.yaw = CAM.yaw; return { dir: V3(f.x, Math.sin(clamp(CAM.pitch, -0.3, 0.4)) * 0.7 + 0.02, f.z).normalize(), t: null };
};
PLAYER.handPos = (i) => PLAYER.a.inst.bones[i === undefined ? 8 : i].getWorldPosition(V3());
OR.blast = function (p, radius, dmg, o) {
  o = o || {}; const a = PLAYER.a; FX.ring(p, o.col || [3, 1.2, 0.3], radius * 1.2, 0.45); FX.flashLight(p, o.light || [1, 0.5, 0.15], 12, radius * 3, 0.35); FX.addShake(o.shake || 0.3);
  for (let i = 0; i < (o.n || 22); i++) FX.puff(p.clone().add(V3(rnd(-0.4, 0.4), rnd(0, 0.5), rnd(-0.4, 0.4))), 1, { add: true, size: 0.45, grow: 4, col: [(o.col || [3, 1.2, 0.3])[0], (o.col || [3, 1.2, 0.3])[1] * (0.6 + RNG() * 0.6), (o.col || [3, 1.2, 0.3])[2]], a: 0.85, life: 0.6, spread: radius * 1.6, rise: 1.6, drag: 2 });
  for (const e of COMBAT.foes()) { const d = Math.hypot(e.x - p.x, e.z - p.z); if (d < radius + (e.r || 0) && Math.abs(e.y - p.y) < 3) { const hp0 = e.hp; COMBAT.damage(e, dmg, { src: a, kind: o.kind || 'fire', dir: V3(e.x - p.x, 0, e.z - p.z).normalize(), p: e.chest(V3()), heavy: !!o.heavy, knock: !!o.knock && !e.isLord, force: 6 }); if (e.isBoss && HUD.bossHit) HUD.bossHit(hp0 - e.hp); } }
};
/* ------------------------------------------------------------------ Ashes of War */
OR.ASH = {
  ash_storm(a) {
    PLAYER.attack('storm'); if (a.act !== 'storm') return false;
    FX.ring(V3(a.x, a.y + 0.1, a.z), [0.7, 0.9, 1.4], 4.2, 0.6);
    MG.after(0.62, () => { if (!a.alive || a.act !== 'storm') return; const q = V3(a.x, a.y + 0.1, a.z); FX.ring(q, [0.8, 1.0, 1.6], 6.5, 0.5); R.shock(a.chest(V3()), 0.9); FX.addShake(0.3);
      for (let i = 0; i < 14; i++) { const an = i / 14 * TAU; FX.puff(V3(a.x + Math.cos(an) * 1.2, a.y + 0.5, a.z + Math.sin(an) * 1.2), 1, { size: 0.5, grow: 3, col: [0.7, 0.75, 0.8], a: 0.3, life: 0.7, spread: 0.3, vel: V3(Math.cos(an) * 8, 1, Math.sin(an) * 8), drag: 3 }); }
      for (const e of COMBAT.foes()) { const d = e.dist(a); if (d < 5.2 && Math.abs(e.y - a.y) < 2.5) COMBAT.damage(e, 20 * OR.dmgMul(), { src: a, kind: 'sweep', heavy: true, knock: !e.isLord, force: 7, dir: V3(e.x - a.x, 0, e.z - a.z).normalize(), p: e.chest(V3()) }); } });
  },
  ash_lion(a) {
    PLAYER.attack('lion'); if (a.act !== 'lion') return false; a.iframe = Math.max(a.iframe, 0.3); R.kick(0.4);
    MG.after(0.6 / a.actSpeed, () => { if (!a.alive || a.act !== 'lion') return; PLAYER.slamImpact(1.7); FX.ring(V3(a.x, a.y + 0.1, a.z), [1.6, 0.9, 0.4], 5, 0.4); R.shock(a.chest(V3()), 0.8); });
  },
  ash_frost(a) {
    PLAYER.attack('frost'); if (a.act !== 'frost') return false;
    MG.after(0.5 / a.actSpeed, () => { if (!a.alive || a.act !== 'frost') return; const f = a.forward(V3()), o = V3(a.x, a.y + 0.1, a.z), hit = new Set(); FX.addShake(0.3);
      for (let i = 1; i <= 8; i++) MG.after(i * 0.05, () => { const p = o.clone().addScaledVector(f, i * 1.25); const g = PHY.ground(p.x, p.z, 0.3, p.y + 2, p.y - 3); if (g !== null) p.y = g + 0.1;
        for (let k = 0; k < 7; k++) FX.puff(p.clone().add(V3(rnd(-0.7, 0.7), 0.1, rnd(-0.7, 0.7))), 1, { add: true, size: 0.5, grow: 2.4, col: [0.6, 1.2, 1.8], a: 0.6, life: 1.1, spread: 0.6, rise: 1.4, drag: 1.5 });
        FX.ring(p, [0.5, 1.0, 1.6], 1.6, 0.4);
        for (const e of COMBAT.foes()) { if (hit.has(e)) continue; if (Math.hypot(e.x - p.x, e.z - p.z) < 1.7 + (e.r || 0) && Math.abs(e.y - p.y) < 2.5) { hit.add(e); const hp0 = e.hp; let d = 26 * OR.dmgMul();
          if (!e._frostT || MG.t > e._frostT) { e._frostT = MG.t + 12; d += Math.min(e.hpMax * 0.1, 70); HUD.pop('FROSTBITE'); }
          COMBAT.damage(e, d, { src: a, kind: 'frost', dir: f.clone(), p: e.chest(V3()), heavy: true }); if (e.isBoss && HUD.bossHit) HUD.bossHit(hp0 - e.hp); } } }); });
  },
  ash_hound(a) {
    const dir = PLAYER.inputDir(PLAYER._d), mag = Math.min(1, dir.length()); PLAYER.dodgeDir = PLAYER.dodgeDir || new THREE.Vector3();
    if (mag < 0.1) a.forward(PLAYER.dodgeDir).negate(); else { PLAYER.dodgeDir.copy(dir).normalize(); if (!PLAYER.lock) a.yaw = Math.atan2(dir.x, dir.z); }
    a.play(mag < 0.1 ? 'backstep' : 'dodge', { fade: 0.04, speed: 1.35 }); a.iframe = 0.52; PLAYER.dodgeK = 2.1; PLAYER.state = 'dodge'; OR.stamT = 0.5;
    const smoke = () => { for (let i = 0; i < 10; i++) FX.puff(V3(a.x + rnd(-0.3, 0.3), a.y + 0.3 + RNG() * 1.3, a.z + rnd(-0.3, 0.3)), 1, { size: 0.5, grow: 2, col: [0.05, 0.05, 0.07], a: 0.75, life: 0.6, spread: 0.5, rise: 0.4, drag: 2 }); };
    smoke(); a.inst.setVisible(false); PLAYER.saber.setVisible(false); if (a.shieldMesh) a.shieldMesh.visible = false;
    MG.after(0.26, () => { a.inst.setVisible(true); PLAYER.saber.setVisible(true); if (a.shieldMesh) a.shieldMesh.visible = true; smoke(); });
  },
  ash_sacred(a) {
    PLAYER.attack('sacred'); if (a.act !== 'sacred') return false;
    MG.after(0.4 / a.actSpeed, () => { if (!a.alive || a.act !== 'sacred') return; const o = a.chest(V3()).add(a.forward(V3()).multiplyScalar(0.8)), A = PLAYER.aimShot(o, 26);
      for (const s of [-0.09, 0, 0.09]) COMBAT.fire(o, A.dir.clone().applyAxisAngle(YUP, s), { shooter: a, team: 'hero', dmg: 22 * OR.dmgMul(), speed: 30, col: [1.0, 0.78, 0.26], holy: true });
      FX.flashLight(o, [1, 0.8, 0.3], 9, 9, 0.25); EQ.buffs.holy = MG.t + 35; EQ.buffs.fire = 0; });
  },
  ash_flame(a) {
    PLAYER.attack('flame'); if (a.act !== 'flame') return false;
    for (let i = 0; i < 7; i++) MG.after((0.3 + i * 0.05) / a.actSpeed, () => { if (!a.alive) return; const f = a.forward(V3()), o = a.chest(V3());
      for (let k = 0; k < 5; k++) { const d = f.clone().applyAxisAngle(YUP, rnd(-0.6, 0.6)); FX.puff(o.clone().addScaledVector(d, 0.6), 1, { add: true, size: 0.45, grow: 5, col: [3.2, 1.0 + RNG() * 0.8, 0.25], a: 0.9, life: 0.5, spread: 0.6, vel: d.multiplyScalar(11), drag: 2.4, rise: 0.8 }); }
      if (i === 2) { FX.flashLight(o.clone().addScaledVector(f, 2), [1, 0.5, 0.15], 12, 12, 0.5);
        for (const e of COMBAT.foes()) { const dx = e.x - a.x, dz = e.z - a.z, d = Math.hypot(dx, dz); if (d < 5.4 + (e.r || 0) && Math.abs(wrapA(Math.atan2(dx, dz) - a.yaw)) < 0.75 && Math.abs(e.y - a.y) < 2.5) { const hp0 = e.hp; COMBAT.damage(e, 34 * OR.dmgMul(), { src: a, kind: 'fire', dir: V3(dx, 0, dz).normalize(), p: e.chest(V3()), heavy: true }); if (e.isBoss && HUD.bossHit) HUD.bossHit(hp0 - e.hp); } } } });
    EQ.buffs.fire = MG.t + 30; EQ.buffs.holy = 0;
  },
  ash_resolve(a) {
    PLAYER.act2('resolve', 0.45, () => { EQ.buffs.resolve = 1; const p = a.chest(V3()); FX.ring(V3(a.x, a.y + 0.1, a.z), [3, 0.5, 0.4], 2.4, 0.5); FX.flashLight(p, [1, 0.3, 0.2], 8, 7, 0.4);
      for (let i = 0; i < 16; i++) FX.puff(p.clone().add(V3(rnd(-0.4, 0.4), rnd(-0.6, 0.4), rnd(-0.4, 0.4))), 1, { add: true, size: 0.14, grow: 1, col: [3, 0.5, 0.35], a: 0.9, life: 0.9, spread: 0.6, rise: 1.6 }); });
  },
};
PLAYER.skill = function () {
  const a = PLAYER.a, ash = EQ.Ash(); if (!ash) { HUD.pop('NO ASH OF WAR'); return; }
  if (PLAYER.fp < ash.fp) { HUD.pop('NOT ENOUGH FP'); return; } if (PLAYER.stam <= 0) return;
  const r = OR.ASH[ash.id](a); if (r === false) return; PLAYER.fp -= ash.fp;
};
/* ------------------------------------------------------------------ spells */
OR.SPELL = {
  sp_pebble(a) { PLAYER.act2('cast', 0.34, () => { const o = PLAYER.handPos(8), A = PLAYER.aimShot(o, 32); COMBAT.fire(o, A.dir, { shooter: a, team: 'hero', dmg: 26 * OR.spellMul('int'), speed: 32, col: [0.3, 0.6, 1.5], holy: true }); FX.flashLight(o, [0.4, 0.7, 1], 7, 7, 0.2); FX.spark(o, A.dir, 10, 4, [1.2, 2.4, 4]); }); },
  sp_lightning(a) { PLAYER.act2('toss', 0.34, () => { const o = PLAYER.handPos(12).add(V3(0, 0.2, 0)), A = PLAYER.aimShot(o, 34);
    const b = COMBAT.fire(o, A.dir, { shooter: a, team: 'hero', dmg: 42 * OR.spellMul('fai'), speed: 38, col: [1.0, 0.82, 0.25], holy: true }); b.core.scale.set(1.6, 1.6, 2.6); b.glow.scale.set(5, 5, 2.8);
    b.onEnd = (p) => { FX.ring(p, [3, 2.4, 0.8], 2.6, 0.3); FX.flashLight(p, [1, 0.85, 0.4], 16, 14, 0.25); FX.spark(p, V3(0, 1, 0), 26, 8, [4, 3.4, 1.4]); FX.addShake(0.25); }; FX.flashLight(o, [1, 0.85, 0.4], 12, 10, 0.2); }); },
  sp_flame(a) { PLAYER.act2('toss', 0.34, () => { const o = PLAYER.handPos(12).add(V3(0, 0.2, 0)), A = PLAYER.aimShot(o, 26);
    const b = COMBAT.fire(o, A.dir, { shooter: a, team: 'hero', dmg: 14 * OR.spellMul('fai'), speed: 22, col: [1.0, 0.36, 0.08] }); b.core.scale.set(4, 4, 0.5); b.glow.scale.set(9, 9, 0.9);
    b.onEnd = (p) => OR.blast(p, 2.8, 26 * OR.spellMul('fai'), { heavy: true }); }); },
  sp_heal(a) { PLAYER.act2('pray', 0.95, () => { const h = a.hpMax * 0.4 + 40 * OR.spellMul('fai'); a.hp = Math.min(a.hpMax, a.hp + h); const p = V3(a.x, a.y + 0.1, a.z); FX.ring(p, [3, 2.4, 0.9], 4.5, 0.8); FX.flashLight(a.chest(V3()), [1, 0.85, 0.4], 12, 10, 0.6);
    for (let i = 0; i < 26; i++) { const an = RNG() * TAU, r = RNG() * 2.4; FX.puff(V3(a.x + Math.cos(an) * r, a.y + 0.1, a.z + Math.sin(an) * r), 1, { add: true, size: 0.07, grow: 0.5, col: [2.6, 2.0, 0.7], a: 0.9, life: 1.6, spread: 0.1, rise: 1.5, drag: 0.4 }); } }); },
  sp_reject(a) { PLAYER.act2('reject', 0.36, () => { const p = a.chest(V3()); R.shock(p, 1.2); OR.blast(V3(a.x, a.y + 0.2, a.z), 4.6, 16 * OR.spellMul('fai'), { col: [3, 2.3, 0.8], light: [1, 0.85, 0.4], kind: 'sweep', heavy: true, knock: true, n: 14 }); }); },
};
PLAYER.castSpell = function () {
  const s = EQ.S(), id = s.eq.spell[s.eq.si] || s.eq.spell.find((x) => x), d = ITEM.DB[id]; if (!d) { HUD.pop('NO SPELL MEMORISED'); return; }
  if (PLAYER.fp < d.fp) { HUD.pop('NOT ENOUGH FP'); return; }
  PLAYER.fp -= d.fp; OR.SPELL[id](PLAYER.a);
};
/* ------------------------------------------------------------------ the belt */
OR.USE = {
  flask_crimson(a) { if (OR.flasks <= 0) { HUD.pop('THE FLASK IS EMPTY'); return; } if (a.hp >= a.hpMax) { HUD.pop('ALREADY HALE'); return; } OR.flasks--; OR.drank = false; OR.drinkKind = 'hp'; PLAYER.state = 'drink'; a.play('drink', { fade: 0.14 }); OR.sprint = false; },
  flask_cerulean(a) { if (OR.flasksC <= 0) { HUD.pop('THE FLASK IS EMPTY'); return; } if (PLAYER.fp >= PLAYER.fpMax) { HUD.pop('FP IS FULL'); return; } OR.flasksC--; OR.drank = false; OR.drinkKind = 'fp'; PLAYER.state = 'drink'; a.play('drink', { fade: 0.14 }); OR.sprint = false; },
  dagger_throw(a) { EQ.take('dagger_throw'); PLAYER.act2('toss', 0.34, () => { const o = PLAYER.handPos(12).add(V3(0, 0.15, 0)), A = PLAYER.aimShot(o, 26); COMBAT.fire(o, A.dir, { shooter: a, team: 'hero', dmg: 18 + 8 * EQ.atk(ITEM.DB.longsword), speed: 30, arrow: true, col: [0.7, 0.7, 0.75] }); }, { speed: 1.15 }); },
  fire_pot(a) { EQ.take('fire_pot'); PLAYER.act2('toss', 0.34, () => { const o = PLAYER.handPos(12).add(V3(0, 0.2, 0)), A = PLAYER.aimShot(o, 18); A.dir.y += 0.08; const b = COMBAT.fire(o, A.dir.normalize(), { shooter: a, team: 'hero', dmg: 8, speed: 17, col: [1.0, 0.4, 0.1] }); b.core.scale.set(5, 5, 0.4); b.glow.scale.set(8, 8, 0.6); b.life = 1.0; b.onEnd = (p) => OR.blast(p, 3.0, 48, { heavy: true }); }); },
  fire_grease(a) { EQ.take('fire_grease'); PLAYER.act2('resolve', 0.4, () => { EQ.buffs.fire = MG.t + 60; EQ.buffs.holy = 0; FX.flashLight(a.chest(V3()), [1, 0.5, 0.15], 9, 7, 0.4); HUD.pop('ARMAMENT SET ALIGHT'); }, { speed: 1.3 }); },
  crab(a) { EQ.take('crab'); OR.drank = true; PLAYER.state = 'drink'; a.play('drink', { fade: 0.14, speed: 1.2 }); EQ.buffs.crab = MG.t + 60; HUD.pop('BODY HARDENED'); },
  rune(a, d) { EQ.take(d.id); OR.addRunes(d.runes); FX.flashLight(a.chest(V3()), [1, 0.85, 0.4], 7, 6, 0.4); for (let i = 0; i < 14; i++) FX.puff(a.chest(V3()).add(V3(rnd(-0.3, 0.3), rnd(-0.4, 0.4), rnd(-0.3, 0.3))), 1, { add: true, size: 0.06, grow: 0.4, col: [2.6, 2.0, 0.7], a: 0.9, life: 1.2, spread: 0.3, rise: 1.2 }); },
};
PLAYER.drink = function () {
  const a = PLAYER.a, s = EQ.S(), id = s.eq.quick[s.eq.qi] || s.eq.quick.find((x) => x), d = ITEM.DB[id]; if (!d) { HUD.pop('NOTHING IN HAND'); return; }
  if (!d.flask && !EQ.count(id)) { HUD.pop('NONE LEFT'); return; }
  if (d.runes) OR.USE.rune(a, d); else if (OR.USE[id]) OR.USE[id](a);
};
OR.useItem = function (id) { const d = ITEM.DB[id], a = PLAYER.a; if (!d || !a) return; if (d.runes) OR.USE.rune(a, d); };
(function () {
  const dr0 = PLAYER.states.drink;
  PLAYER.states.drink = function (dt) { const a = PLAYER.a;
    if (!OR.drank && a.act && a.actT > 0.55 && OR.drinkKind === 'fp') { OR.drank = true; PLAYER.fp = Math.min(PLAYER.fpMax, PLAYER.fp + PLAYER.fpMax * 0.6 + 20); FX.puff(a.chest(V3()), 12, { add: true, size: 0.3, col: [0.4, 0.8, 2.4], a: 0.6, spread: 1.2, life: 0.9, rise: 1.2 }); FX.flashLight(a.chest(V3()), [0.3, 0.5, 1], 5, 5, 0.4); }
    dr0(dt); };
  const mv1 = PLAYER.states.move;
  PLAYER.states.move = function (dt, dir, mag) { const a = PLAYER.a, s = EQ.S();
    if (IN.take('nextItem')) { const q = s.eq.quick; for (let i = 1; i <= q.length; i++) { const j = (s.eq.qi + i) % q.length; if (q[j]) { s.eq.qi = j; break; } } HUD._q = null; }
    if (IN.take('nextSpell')) { const q = s.eq.spell; for (let i = 1; i <= q.length; i++) { const j = (s.eq.si + i) % q.length; if (q[j]) { s.eq.si = j; break; } } HUD._q = null; }
    if (a.grounded && IN.take('spell')) { PLAYER.castSpell(); return; }
    mv1(dt, dir, mag); };
  // buffs show on the blade
  const up0 = PLAYER.update;
  PLAYER.update = function (dt) { up0(dt); const a = PLAYER.a, S = PLAYER.saber; if (!a || !S || !a.alive) return; const f = EQ.buff('fire'), h = EQ.buff('holy');
    const key = f ? 1 : h ? 2 : EQ.buffs.resolve ? 3 : 0; if (EQ._tk !== key) { EQ._tk = key; for (const t of S.trails) t.mat.uniforms.uCol.value.setRGB(...(key === 1 ? [2.4, 0.8, 0.2] : key === 2 ? [2.0, 1.5, 0.5] : key === 3 ? [2.4, 0.3, 0.3] : [0.5, 0.55, 0.66])); }
    if (key && RNG() < dt * 26) { const b = V3(), t = V3(); S.bladeSeg(0, b, t); FX.puff(b.lerp(t, RNG()), 1, { add: true, size: key === 3 ? 0.05 : 0.09, grow: 0.9, col: key === 1 ? [3, 1.0 + RNG(), 0.25] : key === 2 ? [2.6, 2.0, 0.7] : [3, 0.4, 0.3], a: 0.85, life: 0.35, spread: 0.15, rise: 1.1 }); } };
  const rest0 = OR.rest; OR.rest = function (Gr) { OR.flasksC = EQ.S().ceruMax || 1; rest0(Gr); };
  const rs0 = OR.respawn; OR.respawn = function (died) { EQ.buffs = {}; rs0(died); OR.flasksC = EQ.S().ceruMax || 1; };
})();
