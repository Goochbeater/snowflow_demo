/* ==== p73b_hl_spells.js ==== */
/* HOGWARTS — spellwork: bolts of light that home on what the reticle chose, their impacts, and what each spell does to
   the thing it hits (lift, pull, hurl, burn, disarm, freeze, blast); Incendio's cone; Ancient Magic; Revelio. */
Object.assign(HL.SPELLS, { foe: { name: 'curse', col: [1.0, 0.16, 0.1], dmg: 5, speed: 22, size: 0.2 }, foeHeavy: { name: 'dark curse', col: [0.25, 1.0, 0.3], dmg: 20, speed: 18, size: 0.34, unblockable: true }, foeFire: { name: 'fire', col: [1.0, 0.4, 0.06], dmg: 9, speed: 22, size: 0.3, kind: 'fire' } });
HL.bolts = [];
HL.glowTex = function () { if (HL._glow) return HL._glow; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.12, 'rgba(255,255,255,0.85)'); g.addColorStop(0.35, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); HL._glow = t; return t; };
HL.sprite = function (col, k, size) { const m = new THREE.SpriteMaterial({ map: HL.glowTex(), color: new THREE.Color(col[0] * k, col[1] * k, col[2] * k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, fog: false }); const s = new THREE.Sprite(m); s.scale.setScalar(size); s.renderOrder = 7; return s; };
HL.shoot = function (src, from, dir, id, o) {
  o = o || {}; const S = HL.SPELLS[id], g = new THREE.Group();
  g.add(HL.sprite([S.col[0] * 0.5 + 0.5, S.col[1] * 0.5 + 0.5, S.col[2] * 0.5 + 0.5], 7, S.size * 1.5)); g.add(HL.sprite(S.col, 2.2, S.size * 6)); g.position.copy(from); R.scene.add(g);
  const b = { p: from.clone(), v: dir.clone().normalize().multiplyScalar(S.speed), id, S, src, team: src.team, target: o.target || null, t: 0, life: o.life || 2.4, mul: o.dmgMul || 1, g, ph: Math.random() * TAU,
    L: R.addLight({ pos: g.position, col: new THREE.Color(S.col[0], S.col[1], S.col[2]), i: 5 + S.size * 14, range: 7, prio: 3, on: true }) };
  HL.bolts.push(b); return b;
};
HL.boltEnd = function (b) { b.dead = true; if (b.g.parent) b.g.parent.remove(b.g); b.g.children.forEach((s) => s.material.dispose()); R.removeLight(b.L); };
HL.impact = function (p, n, S, big) {
  const c4 = [S.col[0] * 4, S.col[1] * 4, S.col[2] * 4];
  FX.spark(p, n, big ? 26 : 12, big ? 9 : 5, c4, big ? 0.6 : 0.32); FX.flashLight(p, S.col, big ? 22 : 9, big ? 14 : 7, big ? 0.3 : 0.14);
  FX.puff(p, big ? 10 : 3, { add: true, size: big ? 0.6 : 0.22, grow: 2.5, col: [S.col[0] * 1.6, S.col[1] * 1.6, S.col[2] * 1.6], a: 0.7, life: big ? 0.5 : 0.28, spread: big ? 3 : 1.2 });
  if (n && n.y !== undefined && Math.abs(n.y) + Math.abs(n.x) + Math.abs(n.z) > 0.5) FX.scorch(p, n, big ? 1.4 : 0.3);
};
HL.spellsUpdate = function (dt) {
  for (let i = HL.bolts.length - 1; i >= 0; i--) {
    const b = HL.bolts[i]; if (b.dead) { HL.bolts.splice(i, 1); continue; }
    b.t += dt; const sp = b.v.length();
    if (b.target && b.target.alive && !b.target.hidden) { const want = b.target.chest(_v1).sub(b.p).normalize(), cur = _v2.copy(b.v).multiplyScalar(1 / sp), k = Math.min(1, dt * (b.team === 'hero' ? 9 : 1.1)); cur.lerp(want, k).normalize(); b.v.copy(cur).multiplyScalar(sp); }
    const dir = _v2.copy(b.v).multiplyScalar(1 / sp), step = sp * dt, np = _v3.copy(b.p).addScaledVector(b.v, dt);
    let done = false;
    for (const a of COMBAT.actors) { if (!a.alive || a.team === b.team || a.hidden || a === b.src) continue;
      const c0 = COMBAT._c0.set(a.x, a.y + 0.2, a.z), c1 = COMBAT._c1.set(a.x, a.y + a.h * 0.95, a.z); const d = COMBAT.segSeg(b.p, np, c0, c1);
      const rr = a.r + 0.12 + (a.isPlayer && HL.P.blocking ? 0.8 : 0) + (a.big ? 0.4 : 0);
      if (d < rr) { HL.hitActor(b, a, COMBAT._hp.clone(), dir.clone()); done = true; break; } }
    if (done) { HL.boltEnd(b); continue; }
    const hit = PHY.ray(b.p.x, b.p.y, b.p.z, dir.x, dir.y, dir.z, step, 'shot');
    if (hit && hit.t <= step) { const hp = b.p.clone().addScaledVector(dir, hit.t), n = V3(hit.nx, hit.ny, hit.nz); const big = b.id === 'bombarda' || b.id === 'confringo';
      HL.impact(hp, n, b.S, big); if (big) HL.blast(hp.addScaledVector(n, 0.3), b.id === 'bombarda' ? 5.5 : 2.6, b.S.dmg * (b.id === 'bombarda' ? 1 : 0.6), b.src, { fire: true });
      if (HL.onBoltWorld) HL.onBoltWorld(b, hp, hit); HL.boltEnd(b); continue; }
    if (np.y < 0.02 && HL.lake(np.x, np.z) > 0.5) { FX.puff(V3(np.x, 0.1, np.z), 8, { size: 0.4, col: [0.8, 0.86, 0.92], a: 0.5, spread: 2.2, life: 0.8, rise: 1.5 }); HL.boltEnd(b); continue; }
    b.p.copy(np); b.g.position.copy(np);
    const fl = 0.85 + 0.3 * Math.sin(MG.t * 60 + b.ph); b.g.children[0].scale.setScalar(b.S.size * 1.5 * fl);
    // a spiralling trail of sparks
    { const a = MG.t * 26 + b.ph, r = b.S.size * 0.35, side = _v4.crossVectors(dir, YUP).normalize(), up = _v5.crossVectors(side, dir);
      FX.puff(_v1.copy(b.p).addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r), 1, { add: true, size: b.S.size * 0.5, grow: 0.25, col: [b.S.col[0] * 2.4, b.S.col[1] * 2.4, b.S.col[2] * 2.4], a: 0.9, life: 0.3, spread: 0.12, jit: 0.02, rise: 0.01, drag: 4 }); }
    if (b.t > b.life) HL.boltEnd(b);
  }
  if (HL.fxUpdate) HL.fxUpdate(dt);
};
/* ------------------------------------------------------------------ statuses live on the actor: e.st = { lift, freeze, burn, disarm, stun } (seconds left) */
HL.st = (e) => e.st || (e.st = { lift: 0, freeze: 0, burn: 0, disarm: 0, stun: 0, pull: 0 });
HL.hitActor = function (b, t, p, dir) {
  const S = b.S, id = b.id, st = HL.st(t), hero = b.team === 'hero';
  // a warded foe shrugs off everything but the spell family that breaks its ward
  if (t.ward && hero) { if (S.kind === t.ward) { t.ward = null; if (t.onWardBreak) t.onWardBreak(); HL.ui && HL.ui.pop('WARD BROKEN'); HL.impact(p, dir.clone().negate(), S, true); st.stun = Math.max(st.stun, 1.6); if (t.wardMesh) t.wardMesh.visible = false; MG.hitStop = 0.06; }
    else { FX.spark(p, dir.clone().negate(), 10, 4, [3, 3, 4], 0.25); if (t.wardFlash) t.wardFlash(); HL.ui && HL.ui.wardHint(t); return; } }
  let dmg = S.dmg * b.mul;
  if (st.freeze > 0 && hero) { dmg *= 2.2; st.freeze = 0; HL.ui && HL.ui.pop('SHATTERED'); FX.spark(p, null, 30, 7, [2, 3.4, 5], 0.6); }
  if (st.lift > 0) dmg *= 1.4;
  HL.impact(p, dir.clone().negate(), S, id === 'bombarda' || id === 'confringo');
  const info = { src: b.src, kind: 'spell', spell: id, dir, p, heavy: id === 'depulso' || id === 'bombarda', unblockable: !!S.unblockable };
  const landed = COMBAT.damage(t, dmg, info);
  if (hero) { HL.P.combatT = 7; if (landed) { HL.P.ancient = Math.min(100, HL.P.ancient + (id === 'basic' ? 3 : 7)); HL.ui && HL.ui.dmg(p, dmg, S.col); if (id !== 'basic') { MG.hitStop = Math.max(MG.hitStop, 0.035); } } }
  if (!landed || !t.alive) { if (id === 'bombarda' || id === 'confringo') HL.blast(p, id === 'bombarda' ? 5.5 : 2.6, S.dmg * 0.6, b.src, { fire: true, skip: t }); return; }
  if (t.isPlayer) { if (S.kind === 'fire') st.burn = 2.5; return; }
  const big = t.big;
  if (id === 'levioso') { if (!big) { st.lift = 3.6; st.liftY = t.y; } else st.stun = 1.5; }
  else if (id === 'accio') { if (!big) { st.pull = 0.55; t.pullTo = b.src; } st.stun = Math.max(st.stun, 1.3); }
  else if (id === 'depulso') { HL.fling(t, dir, big ? 4 : 15, big ? 0 : 5.5); for (const o of COMBAT.actors) if (o !== t && o.alive && o.team === t.team && o.dist(t) < 3.2) { HL.fling(o, dir, 9, 4); COMBAT.damage(o, dmg * 0.5, info); } R.shock(p, 0.7); }
  else if (id === 'expelliarmus') { st.disarm = 6; if (t.wand) HL.dropWand(t, dir); st.stun = Math.max(st.stun, 0.8); }
  else if (id === 'glacius') { st.freeze = big ? 2 : 4.5; }
  else if (id === 'confringo') { st.burn = 4; HL.blast(p, 2.6, S.dmg * 0.5, b.src, { fire: true, skip: t }); }
  else if (id === 'bombarda') { HL.blast(p, 5.5, S.dmg * 0.6, b.src, { fire: true, skip: t }); HL.fling(t, dir, big ? 3 : 9, big ? 0 : 5); }
  else if (id === 'stupefy') { st.stun = Math.max(st.stun, 2.6); }
};
HL.fling = function (t, dir, sp, up) { t.kb = t.kb || new THREE.Vector3(); t.kb.set(dir.x * sp, up, dir.z * sp); t.kbT = 0.9; if (t.onFling) t.onFling(); };
HL.dropWand = function (t, dir) { const w = t.wand; if (!w || t.wandOut) return; t.wandOut = true; t.wandV = new THREE.Vector3(dir.x * 3 + rnd(-2, 2), 6, dir.z * 3 + rnd(-2, 2)); t.wandSpin = rnd(8, 16); };
HL.blast = function (p, r, dmg, src, o) {
  o = o || {}; const col = o.col || [1.0, 0.5, 0.12];
  FX.flashLight(p, col, 40, r * 4, 0.35); FX.spark(p, null, 40, 11, [col[0] * 5, col[1] * 5, col[2] * 5], 0.7); FX.ring(V3(p.x, p.y - 0.2, p.z), [col[0] * 2, col[1] * 2, col[2] * 2], r * 1.3, 0.45);
  FX.puff(p, 14, { add: true, size: r * 0.28, grow: 3, col: [col[0] * 2, col[1] * 1.6, col[2] * 1.2], a: 0.8, life: 0.45, spread: r * 1.1 }); FX.puff(p, 10, { size: r * 0.3, grow: 3, col: [0.16, 0.15, 0.14], a: 0.5, life: 1.6, spread: r * 0.7, rise: 1.2 });
  FX.addShake(0.3); R.shock(p, 0.8); R.kick(0.2);
  for (const t of COMBAT.actors) { if (!t.alive || t.team === src.team || t === o.skip || t.hidden) continue; const d = Math.hypot(t.x - p.x, t.y + 0.9 - p.y, t.z - p.z); if (d > r + t.r) continue;
    const dir = V3(t.x - p.x, 0, t.z - p.z).normalize(), k = 1 - 0.5 * d / r; if (COMBAT.damage(t, dmg * k, { src, kind: 'blast', dir, heavy: true, p: t.chest(new THREE.Vector3()) }) && t.alive && !t.isPlayer) { if (o.fire) HL.st(t).burn = 3; HL.fling(t, dir, t.big ? 2 : 8 * k, t.big ? 0 : 4.5); } }
};
HL.incendio = function (a, tip, dir) {
  const S = HL.SPELLS.incendio, fw = V3(dir.x, 0, dir.z).normalize();
  for (let i = 0; i < 46; i++) { const d = dir.clone().add(V3(rnd(-0.34, 0.34), rnd(-0.14, 0.26), rnd(-0.34, 0.34))).normalize(), sp = rnd(7, 15); FX.puff(tip, 1, { add: true, size: rnd(0.25, 0.5), grow: 3.2, col: [2.8, rnd(0.8, 1.5), 0.2], a: 0.85, life: rnd(0.35, 0.6), spread: 0.1, vel: d.multiplyScalar(sp), drag: 2.2, rise: 1.4 }); }
  FX.flashLight(tip.clone().addScaledVector(dir, 2), S.col, 30, 14, 0.4); FX.addShake(0.2); R.kick(0.18);
  for (const t of COMBAT.actors) { if (!t.alive || t.team === a.team || t.hidden) continue; const to = V3(t.x - a.x, 0, t.z - a.z), d = to.length(); if (d > 8.5) continue; to.normalize(); if (to.dot(fw) < 0.72 && d > 1.5) continue;
    const p = t.chest(new THREE.Vector3()); if (t.ward && t.ward !== 'fire') { HL.ui && HL.ui.wardHint(t); continue; } if (t.ward) { t.ward = null; if (t.wardMesh) t.wardMesh.visible = false; HL.ui && HL.ui.pop('WARD BROKEN'); }
    if (COMBAT.damage(t, S.dmg * (HL.st(t).freeze > 0 ? 2.2 : 1), { src: a, kind: 'spell', spell: 'incendio', dir: to, p, heavy: false })) { HL.st(t).freeze = 0; HL.st(t).burn = 4.5; HL.ui && HL.ui.dmg(p, S.dmg, S.col); HL.P.ancient = Math.min(100, HL.P.ancient + 7); } }
  if (HL.onIncendio) HL.onIncendio(tip, fw);
};
/* Ancient Magic: when the meter is full, a bolt out of the sky onto whatever the reticle holds */
HL.ancient = function () {
  const P = HL.P, a = PLAYER.a, t = P.target; if (P.ancient < 100) { HL.ui && HL.ui.deny('ancient'); return; } if (!t) { HL.ui && HL.ui.toast('', 'Ancient Magic needs a target in your sights'); return; }
  P.ancient = 0; a.play('castUp', { fade: 0.08 }); P.aimT = 3; a.wandCol = [0.5, 0.9, 1.6]; a.wandGlow = 2; MG.slowmo = 0.35; MG.slowmoT = 0; MG.slowmoDur = 0.5; HL.ui && HL.ui.spellName('Ancient Magic');
  MG.after(0.28, () => { if (!t.alive) return; const p = V3(t.x, t.y, t.z); HL.lightning(V3(p.x + rnd(-6, 6), p.y + 70, p.z + rnd(-6, 6)), p, [0.55, 0.9, 1.7]);
    HL.blast(p.clone().add(V3(0, 0.8, 0)), 6, 60, a, { col: [0.5, 0.85, 1.6] }); COMBAT.damage(t, t.big ? 140 : 220, { src: a, kind: 'blast', dir: V3(0, 0, 1), heavy: true, p, unblockable: true }); if (t.ward) { t.ward = null; if (t.wardMesh) t.wardMesh.visible = false; } }, false);
};
HL.zaps = [];
HL.lightning = function (a, b, col) {
  const pts = [], n = 18; for (let i = 0; i <= n; i++) { const f = i / n, p = a.clone().lerp(b, f); if (i > 0 && i < n) p.add(V3(rnd(-1, 1), rnd(-0.5, 0.5), rnd(-1, 1)).multiplyScalar(2.6 * Math.sin(f * PI) + 0.4)); pts.push(p); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.16, 5), m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col[0] * 6, col[1] * 6, col[2] * 6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  const me = new THREE.Mesh(g, m); R.scene.add(me); HL.zaps.push({ me, t: 0, life: 0.45 }); FX.flashLight(b.clone().add(V3(0, 2, 0)), col, 80, 40, 0.45);
};
HL.revelio = function () {
  const P = HL.P, a = PLAYER.a; if ((P.cd.revelio || 0) > 0) return; P.cd.revelio = 3; P.revT = 8; a.play('castUp', { fade: 0.08 }); a.wandCol = [0.4, 0.7, 1.6]; a.wandGlow = 1.6; HL.ui && HL.ui.spellName('Revelio');
  const p = V3(a.x, a.y + 0.3, a.z); FX.ring(p, [0.5, 1.0, 2.4], 46, 1.5); FX.ring(p, [0.4, 0.8, 2.0], 22, 1.0); FX.flashLight(p.clone().add(V3(0, 1.5, 0)), [0.4, 0.7, 1.4], 14, 20, 0.5);
};
HL.fxUpdate = function (dt) {
  for (let i = HL.zaps.length - 1; i >= 0; i--) { const z = HL.zaps[i]; z.t += dt; z.me.material.opacity = Math.max(0, 1 - z.t / z.life) * (0.6 + 0.4 * Math.sin(z.t * 90)); if (z.t > z.life) { R.scene.remove(z.me); z.me.geometry.dispose(); HL.zaps.splice(i, 1); } }
  if (HL.P.revT > 0) HL.P.revT -= dt;
};
