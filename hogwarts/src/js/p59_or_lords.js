/* ==== p59_or_lords.js ==== */
/* OPUS RING — the great enemies: the Beastman of Farum Azula, Margit the Fell Omen, Godrick the Grafted. */
LORD.DEFS.beastman = {
  tpl: 'beastman', scale: 1.28, hp: 520, poise: 70, name: 'Beastman of Farum Azula', weapon: 'cleaver', runes: 1000, speed: 3.1, range: 2.2, reach: 2.7, dmgK: 0.8, aoeDmg: 16, track: 4, cd: [0.9, 1.8], r: 0.5, h: 2.3,
  moves: [{ seq: ['over'], w: 2 }, { seq: ['side', 'side'], w: 2 }, { seq: ['comboR'], w: 3 }, { seq: ['thrust'], w: 2, max: 4.2 }, { seq: ['delay'], w: 1 }, { seq: ['leap'], min: 4, max: 10, w: 4 }],
};
LORD.DEFS.margit = {
  tpl: 'margit', scale: 1.55, hp: 1100, poise: 120, name: 'Margit, the Fell Omen', weapon: 'cane', runes: 12000, speed: 2.6, range: 2.3, reach: 3.0, dmgK: 0.95, aoeDmg: 24, track: 3.2, cd: [1.1, 2.1], r: 0.62, h: 2.85, phaseAt: 0.56,
  moves: [
    { seq: ['over'], w: 2 }, { seq: ['side', 'thrust'], w: 2 }, { seq: ['delay'], w: 3 }, { seq: ['comboR'], w: 2 }, { seq: ['heavyA', 'heavyB'], w: 2 }, { seq: ['sweepK'], w: 2, max: 3.6 },
    { seq: ['leap'], min: 4.5, max: 11, w: 3 }, { seq: ['daggers'], min: 5, max: 22, w: 3, sp: [4, 8] },
    { seq: ['slamK'], ph: 2, w: 3, max: 4 }, { seq: ['heavyA', 'heavyB', 'heavyC'], ph: 2, w: 3 }, { seq: ['leap', 'slamK'], ph: 2, min: 4, max: 12, w: 3 }, { seq: ['spinD', 'delay'], ph: 2, w: 2 },
  ],
  special: { daggers: { clip: 'hurl', tick(L, dt, c) { if (!L.spDone && L.actT >= c.release) { L.spDone = true; LORD.daggers(L, L.ph > 1 ? 3 : 1); } } } },
  shockCol: [2.4, 1.7, 0.5],
  phase2(L) {   // he calls a hammer of golden light into his hand
    L.play('roar', { fade: 0.2 }); HUD.sub('MARGIT', 'Well. Thou art of passing skill. Then I shall hold nothing back.', 4.5);
    MG.after(1.1, () => { if (!L.alive) return; L.swapWeapon('club', { glow: 'holy', len: 1.35 }); const p = L.chest(V3()); FX.ring(V3(L.x, L.y + 0.1, L.z), [2.4, 1.7, 0.5], 7, 0.7); FX.flashLight(p, [1, 0.8, 0.3], 14, 14, 0.6); FX.addShake(0.5); R.shock(p, 1.2);
      for (let i = 0; i < 30; i++) FX.puff(p.clone().add(V3(rnd(-1, 1), rnd(-1, 1.5), rnd(-1, 1))), 1, { add: true, size: 0.3, col: [2.4, 1.7, 0.5], a: 0.7, life: 1.1, spread: 2.5, rise: 1.5 }); L.D = Object.assign({}, L.D, { dmgK: 1.1, aoeDmg: 30 }); });
  },
};
/* Godrick's grafted dragon: a severed head on his left arm that breathes fire */
LORD.dragonHead = function () {
  const g = new THREE.Group(), sc = ARM.mat('horn'), bone = ARM.mat('bone');
  const M = (geo, mat, x, y, z, rx, ry, rz, s) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.rotation.set(rx || 0, ry || 0, rz || 0); if (s) me.scale.set(s[0], s[1], s[2]); me.castShadow = true; g.add(me); return me; };
  M(new THREE.SphereGeometry(0.17, 12, 10), sc, 0, 0, 0, 0, 0, 0, [1, 0.85, 1.25]);
  M(new THREE.ConeGeometry(0.14, 0.5, 8), sc, 0, 0.03, 0.34, HALF, 0, 0, [1, 1, 0.7]);                     // upper jaw
  M(new THREE.ConeGeometry(0.11, 0.42, 8), sc, 0, -0.1, 0.3, HALF + 0.35, 0, 0, [1, 1, 0.5]);             // lower jaw, agape
  for (const s of [1, -1]) { M(new THREE.ConeGeometry(0.04, 0.38, 6), bone, s * 0.1, 0.14, -0.16, -1.0, 0, s * 0.3); M(new THREE.ConeGeometry(0.03, 0.22, 6), bone, s * 0.15, 0.06, -0.12, -1.2, 0, s * 0.7);
    M(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.2, 0.4), toneMapped: false }), s * 0.085, 0.07, 0.16); }
  for (let i = 0; i < 7; i++) M(new THREE.ConeGeometry(0.014, 0.07, 4), bone, (i - 3) * 0.028, -0.03, 0.42 - Math.abs(i - 3) * 0.035, PI, 0, 0);
  M(new THREE.CylinderGeometry(0.11, 0.075, 0.5, 10), sc, 0, -0.02, -0.34, HALF, 0, 0);                        // the neck, sewn to his arm
  return g;
};
LORD.DEFS.godrick = {
  tpl: 'godrick', scale: 1.62, hp: 1500, poise: 150, name: 'Godrick the Grafted', weapon: 'gaxe', runes: 20000, speed: 2.5, range: 2.4, reach: 3.2, dmgK: 1.05, aoeDmg: 28, track: 3.0, cd: [1.0, 2.0], r: 0.68, h: 3.0, phaseAt: 0.55,
  moves: [
    { seq: ['over'], w: 2 }, { seq: ['side', 'side'], w: 2 }, { seq: ['heavyA', 'heavyB'], w: 3 }, { seq: ['comboR'], w: 2 }, { seq: ['sweepK'], w: 2, max: 3.8 }, { seq: ['slamK'], w: 2, max: 4 },
    { seq: ['whirl', 'whirl'], w: 2, max: 5, sp: [5, 9] }, { seq: ['stomp'], w: 2, max: 7, sp: [4, 8] }, { seq: ['leap'], min: 5, max: 12, w: 3 },
    { seq: ['breath'], ph: 2, min: 3, max: 14, w: 5, sp: [5, 9] }, { seq: ['heavyA', 'heavyB', 'heavyC', 'spinD'], ph: 2, w: 3 }, { seq: ['stomp', 'slamK'], ph: 2, w: 2, max: 7 },
  ],
  special: {
    whirl: { clip: 'spin', start(L) { const p = V3(L.x, L.y + 0.1, L.z); FX.ring(p, [0.8, 0.9, 1.3], 6, 0.6); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; FX.puff(V3(L.x + Math.cos(a) * 2, L.y + 0.6, L.z + Math.sin(a) * 2), 1, { size: 0.7, grow: 3, col: [0.6, 0.62, 0.66], a: 0.3, life: 0.8, spread: 0.4, vel: V3(-Math.sin(a) * 9, 1.5, Math.cos(a) * 9), drag: 2 }); } } },
    breath: { tick(L, dt, c) { if (L.actT >= c.fire[0] && L.actT <= c.fire[1]) { LORD.fire(L, dt, 8, 10.5, 34); L.yaw = dampA(L.yaw, L.angTo(L.P), 1.1, dt); } } },
  },
  tick(L, dt) { if (L.fireL) { L.fireT = (L.fireT || 0) - dt; if (L.fireT <= 0) L.fireL.i = Math.max(0, L.fireL.i - dt * 40); } },
  shockCol: [1.6, 1.3, 0.9],
  phase2(L) {   // he hacks off his own arm and takes the dragon's head in its place
    L.play('roar', { fade: 0.2 }); HUD.sub('GODRICK', 'Forefathers, one and all — bear witness!', 4.5);
    MG.after(1.2, () => { if (!L.alive) return; const h = LORD.dragonHead(); L.inst.bones[7].add(h); const b = L.T.def[7], d = V.sub(b.tail, b.head); h.position.set(d[0] * 1.15, d[1] * 1.15, d[2] * 1.15); h.quaternion.setFromUnitVectors(ANIM.Z, V3(d[0], d[1], d[2]).normalize()); h.scale.setScalar(1.15); L.dragon = h;
      L.guardBase = 'guard1'; const p = L.chest(V3()); FX.ring(V3(L.x, L.y + 0.1, L.z), [3, 1.2, 0.3], 9, 0.8); FX.flashLight(p, [1, 0.5, 0.15], 16, 16, 0.8); FX.addShake(0.7); R.shock(p, 1.4);
      for (let i = 0; i < 40; i++) FX.puff(p.clone().add(V3(rnd(-1.5, 1.5), rnd(-1, 2), rnd(-1.5, 1.5))), 1, { add: true, size: 0.4, col: [3.2, 1.2, 0.25], a: 0.8, life: 1.2, spread: 3, rise: 2 }); L.D = Object.assign({}, L.D, { dmgK: 1.15 }); });
  },
};
/* shared boss-room plumbing: a fog wall that seals behind the Tarnished, wakes the lord, and lifts when he falls */
WORLD.arena = function (L, id, key, at, fog, o) {
  o = o || {};
  const B = WORLD.boss(L, id, () => new Lord(key, { x: at[0], y: WORLD.spawnY([at[0], at[3] !== undefined ? at[3] : null, at[1]]), z: at[1], yaw: at[2] }), {
    name: LORD.DEFS[key].name, passive: true, major: o.major,
    onDefeat: (b, BB) => { F.set(false); F.I.off = true; if (o.onDefeat) o.onDefeat(b, BB); },
    onReset: () => { F.set(true); F.I.off = false; },
  });
  const F = WORLD.fogWall(L, fog[0], fog[1], fog[2], fog[3], fog[4] || 6, { y: fog[5], oneWay: fog[6], onEnter: () => { F.I.off = true; B.engage(); if (o.onEnter) o.onEnter(B.cur); } });
  if (B.dead) { F.set(false); F.I.off = true; }
  return { B, F };
};
