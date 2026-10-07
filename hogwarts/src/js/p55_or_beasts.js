/* ==== p55_or_beasts.js ==== */
/* OPUS RING — four-legged things. QUAD: sculpted quadrupeds (horse, wolf) with a procedural gait. STEED: Torrent, the
   spectral steed (summon anywhere outdoors, double jump, strike from the saddle). Beast: Limgrave's wolves.
   Sentinel: the Tree Sentinel — a gilded knight on a gilded charger, patrolling the road below the First Step. */
const QUAD = {};
QUAD.SPEC = {
  horse: { box: [-0.66, 0.5, -1.62, 0.66, 2.7, 1.9], res: 0.032, hips: [[0.2, 1.22, 0.5], [-0.2, 1.22, 0.5], [0.21, 1.26, -0.66], [-0.21, 1.26, -0.66]], up: 0.6, lo: 0.6, seat: [0, 1.76, -0.08], len: 2.4,
    upF: [[0.1, 0.0], [0.115, -0.06], [0.1, -0.2], [0.072, -0.42], [0.058, -0.56], [0.066, -0.6]], upH: [[0.13, 0.0], [0.15, -0.08], [0.125, -0.24], [0.085, -0.44], [0.06, -0.56], [0.068, -0.6]],
    lo_: [[0.064, 0.0], [0.046, -0.08], [0.038, -0.3], [0.04, -0.44], [0.055, -0.49], [0.046, -0.52], [0.062, -0.585], [0.066, -0.6], [0.0, -0.6]], hoofY: -0.52 },
  wolf: { box: [-0.34, 0.2, -1.1, 0.34, 1.2, 1.16], res: 0.02, hips: [[0.12, 0.6, 0.3], [-0.12, 0.6, 0.3], [0.12, 0.6, -0.34], [-0.12, 0.6, -0.34]], up: 0.31, lo: 0.29, seat: [0, 0.8, 0], len: 1.3,
    upF: [[0.06, 0.0], [0.068, -0.05], [0.05, -0.2], [0.04, -0.31]], upH: [[0.075, 0.0], [0.085, -0.06], [0.055, -0.2], [0.04, -0.31]],
    lo_: [[0.04, 0.0], [0.03, -0.1], [0.028, -0.22], [0.045, -0.265], [0.05, -0.285], [0.0, -0.29]], hoofY: -0.24 },
};
QUAD.sculpt = function (kind, o) {
  const key = 'quad2_' + kind + (o.horns ? 'h' : '') + (o.saddle ? 's' : '') + (o.gold ? 'g' : '');
  const S = QUAD.SPEC[kind];
  return PROPS.sdfMesh(key, (grp) => {
    const C = grp(0, 0.1), H = grp(1, 0.03), X = grp(2, 0.01), L = grp(3, 0.02), A = grp(4, 0.015);
    if (kind === 'horse') {
      // barrel, deep chest, croup, the shoulder and haunch muscles the legs hang from
      C.add(SDF.ell([0, 1.42, -0.08], [0.31, 0.34, 0.72])); C.add(SDF.ell([0, 1.4, 0.46], [0.3, 0.42, 0.36]), 'su', 0.12); C.add(SDF.ell([0, 1.5, -0.66], [0.31, 0.36, 0.4]), 'su', 0.12);
      C.both(SDF.ell([0.2, 1.28, 0.5], [0.14, 0.3, 0.2]), 'su', 0.08); C.both(SDF.ell([0.2, 1.36, -0.66], [0.17, 0.34, 0.27]), 'su', 0.08);
      C.add(SDF.ell([0, 1.72, 0.3], [0.16, 0.14, 0.3]), 'su', 0.12);                                                    // withers
      // an arched neck, a long head with a broad jaw and a tapering muzzle
      C.add(SDF.rcone([0, 1.56, 0.56], [0, 1.92, 0.9], 0.27, 0.19), 'su', 0.14); C.add(SDF.rcone([0, 1.92, 0.9], [0, 2.14, 1.1], 0.19, 0.14), 'su', 0.1);
      C.add(SDF.ell([0, 2.1, 1.16], [0.125, 0.17, 0.2], SDF.rot(32, 0, 0)), 'su', 0.06); C.add(SDF.rcone([0, 2.06, 1.24], [0, 1.82, 1.58], 0.115, 0.07), 'su', 0.06); C.add(SDF.ell([0, 1.8, 1.6], [0.07, 0.06, 0.07]), 'su', 0.03);
      C.both(SDF.rcone([0.08, 2.24, 1.06], [0.105, 2.39, 1.0], 0.036, 0.012), 'su', 0.02);
      // mane, forelock, a full tail
      H.add(SDF.rcone([0, 1.82, 0.44], [0, 2.04, 0.78], 0.085, 0.075)); H.add(SDF.rcone([0, 2.04, 0.78], [0, 2.26, 1.02], 0.075, 0.06), 'su', 0.03); H.add(SDF.rcone([0, 2.27, 1.06], [0, 2.14, 1.26], 0.055, 0.03), 'su', 0.03);
      H.add(SDF.rcone([0, 1.66, -1.02], [0, 1.2, -1.22], 0.1, 0.11), 'su', 0.03); H.add(SDF.rcone([0, 1.2, -1.22], [0, 0.66, -1.24], 0.11, 0.04), 'su', 0.04);
      X.both(SDF.sph([0.105, 2.12, 1.26], 0.026));
      if (o.horns) { X.both(SDF.rcone([0.08, 2.24, 1.14], [0.16, 2.42, 1.0], 0.036, 0.022)); X.both(SDF.rcone([0.16, 2.42, 1.0], [0.21, 2.5, 0.78], 0.022, 0.006), 'su', 0.02); }
      if (o.saddle) { L.add(SDF.box([0, 1.6, -0.1], [0.335, 0.2, 0.36], 0.07)); L.add(SDF.ell([0, 1.78, -0.1], [0.2, 0.06, 0.3]), 'su', 0.04); L.add(SDF.ell([0, 1.86, -0.4], [0.17, 0.09, 0.06]), 'su', 0.03); L.add(SDF.ell([0, 1.86, 0.2], [0.11, 0.09, 0.05]), 'su', 0.03); }
      if (o.gold) {   // barding: chanfron, crinet, peytral, crupper
        A.add(SDF.ell([0, 2.08, 1.27], [0.12, 0.2, 0.26], SDF.rot(40, 0, 0))); A.add(SDF.ell([0, 2.1, 1.18], [0.09, 0.14, 0.2], SDF.rot(40, 0, 0)), 'ss', 0.02);
        A.add(SDF.rcone([0, 1.64, 0.6], [0, 2.1, 1.02], 0.3, 0.19), 'su', 0.02); A.add(SDF.box([0, 1.5, 0.95], [0.5, 0.42, 0.26], 0.0, SDF.rot(-38, 0, 0)), 'ss', 0.02);
        A.add(SDF.ell([0, 1.38, 0.52], [0.36, 0.4, 0.34]), 'su', 0.02); A.add(SDF.ell([0, 1.52, -0.7], [0.37, 0.36, 0.42]), 'su', 0.02);
        A.add(SDF.box([0, 0.86, 0], [0.6, 0.3, 1.6], 0.0), 'ss', 0.03);
      }
    } else {
      C.add(SDF.ell([0, 0.66, 0.0], [0.15, 0.17, 0.42])); C.add(SDF.ell([0, 0.68, 0.28], [0.175, 0.24, 0.24]), 'su', 0.08); C.add(SDF.ell([0, 0.66, -0.3], [0.15, 0.19, 0.2]), 'su', 0.07);
      C.both(SDF.ell([0.11, 0.62, 0.3], [0.07, 0.16, 0.1]), 'su', 0.05); C.both(SDF.ell([0.11, 0.62, -0.34], [0.08, 0.18, 0.13]), 'su', 0.05);
      C.add(SDF.rcone([0, 0.78, 0.42], [0, 0.92, 0.66], 0.15, 0.115), 'su', 0.08);
      C.add(SDF.ell([0, 0.95, 0.74], [0.12, 0.11, 0.14]), 'su', 0.05); C.add(SDF.rcone([0, 0.92, 0.82], [0, 0.87, 1.06], 0.07, 0.04), 'su', 0.04);
      C.both(SDF.rcone([0.075, 1.02, 0.7], [0.1, 1.15, 0.66], 0.04, 0.01), 'su', 0.02);
      H.add(SDF.rcone([0, 0.72, -0.46], [0, 0.6, -0.92], 0.09, 0.045)); H.add(SDF.rcone([0, 0.9, -0.2], [0, 1.02, 0.56], 0.09, 0.115), 'su', 0.05); H.add(SDF.ell([0, 0.86, 0.5], [0.19, 0.17, 0.14]), 'su', 0.05);
      X.add(SDF.sph([0, 0.88, 1.08], 0.028)); X.both(SDF.sph([0.062, 0.985, 0.84], 0.016));
    }
  }, S.box, S.res);
};
QUAD.mat = function (key, o) { QUAD._m = QUAD._m || {}; if (QUAD._m[key]) return QUAD._m[key]; const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.82, metalness: 0, envMapIntensity: 0.4 }, o));
  m.onBeforeCompile = (sh) => { sh.uniforms.uFill = CM.fillU; CM.rimHook(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFill;').replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + CM.FILL); }; m.customProgramCacheKey = () => 'orquad';
  QUAD._m[key] = m; return m; };
QUAD.build = function (kind, o) {
  o = o || {}; const S = QUAD.SPEC[kind], g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const coat = QUAD.mat('coat' + (o.coat || 0x8c7c68), { color: o.coat || 0x8c7c68 });
  const mane = QUAD.mat('mane' + (o.mane || 0x3a332b), { color: o.mane || 0x3a332b, roughness: 1 }), hornM = QUAD.mat('qhorn', { color: 0xd8ccb0, roughness: 0.5 }), tack = QUAD.mat('tack' + (o.tack || 0x4a2418), { color: o.tack || 0x4a2418, roughness: 0.7 });
  const dark = QUAD.mat('qdark', { color: 0x0c0a0a, roughness: 0.35 });
  const body = new THREE.Mesh(QUAD.sculpt(kind, o), [coat, mane, kind === 'wolf' ? dark : (o.horns ? hornM : dark), tack, ARM.mat('gold')]); body.castShadow = true; body.receiveShadow = true; inner.add(body);
  const hoof = QUAD.mat('hoof', { color: 0x1c1814, roughness: 0.6 }), legM = QUAD.mat('leg' + (o.leg || o.coat || 0x8c7c68), { color: o.leg || o.coat || 0x8c7c68 });
  const lathe = (prof) => { const pts = prof.slice().reverse().map((p) => new THREE.Vector2(Math.max(1e-4, p[0]), p[1])); const lg = new THREE.LatheGeometry(pts, 10); lg.computeVertexNormals(); return lg; };
  const legs = [];
  S.hips.forEach((h, i) => {
    const front = i < 2, up = new THREE.Group(); up.position.set(h[0], h[1], h[2]); inner.add(up);
    const um = new THREE.Mesh(lathe(front ? S.upF : S.upH), legM); um.castShadow = true; up.add(um);
    if (o.gold) { const pl = new THREE.Mesh(lathe((front ? S.upF : S.upH).slice(0, 4).map((p) => [p[0] * 1.16, p[1]])), ARM.mat('gold')); pl.castShadow = true; up.add(pl); }
    const lo = new THREE.Group(); lo.position.y = -S.up; up.add(lo);
    const lm = new THREE.Mesh(lathe(S.lo_), legM); lm.castShadow = true; lo.add(lm);
    if (kind === 'horse') { const hm = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.07, 0.085, 10), hoof); hm.position.set(0, -0.558, 0.012); lo.add(hm); }
    legs.push({ up, lo, front });
  });
  if (o.gold) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.5, 0.62, 16, 1, true), QUAD.mat('caparison', { color: 0x5a0e0b, roughness: 0.92, side: THREE.DoubleSide })); sk.position.set(0, 1.1, -0.62); sk.scale.z = 1.25; sk.castShadow = true; inner.add(sk);
    const sk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.46, 0.5, 16, 1, true), QUAD._m.caparison); sk2.position.set(0, 1.08, 0.46); sk2.scale.z = 1.1; sk2.castShadow = true; inner.add(sk2); }
  const Q = { g, inner, legs, S, kind, phase: RNG(), amp: 0, rear: 0, scale: o.scale || 1 };
  g.scale.setScalar(Q.scale);
  Q.update = function (dt, speed, x) {
    x = x || {}; const sp = Math.abs(speed) / Q.scale, gal = smooth(4.5, 8, sp);
    Q.amp = damp(Q.amp, clamp(sp / (kind === 'wolf' ? 5 : 7), 0, 1), 6, dt);
    Q.phase = (Q.phase + dt * (sp < 0.1 ? 0.12 : lerp(1.1, 2.3, clamp(sp / 12, 0, 1)) * (kind === 'wolf' ? 1.35 : 1))) % 1;
    const OFF = [0, lerp(0.5, 0.12, gal), lerp(0.5, 0.52, gal), lerp(0, 0.64, gal)], A = Q.amp * 0.66, still = sp < 0.1 ? 0 : 1;
    Q.legs.forEach((l, i) => { const ph = (Q.phase + OFF[i]) * TAU, s = Math.sin(ph), c = Math.cos(ph);
      l.up.rotation.x = -s * A * still + (l.front ? -1 : 0.6) * Q.rear * 0.9 + (l.front ? 0.04 : -0.16);
      l.lo.rotation.x = Math.max(0, c) * (A * 1.5) * still + (l.front ? Q.rear * 1.6 : 0) + (l.front ? 0.0 : 0.3); });
    Q.inner.position.y = Math.abs(Math.sin(Q.phase * TAU)) * 0.07 * Q.amp + Math.sin(MG.t * 1.6 + Q.S.len) * 0.006;
    Q.inner.rotation.x = Math.sin(Q.phase * TAU * 2 + 0.8) * 0.045 * Q.amp * gal - Q.rear * 0.62 + (x.pitch || 0);
    Q.inner.rotation.z = x.bank || 0;
  };
  return Q;
};
/* keep a four-legged body on the ground: e = {x,y,z,vy,r,h,step}; returns grounded */
QUAD.fall = function (e, dt) {
  e.vy = Math.max(-30, (e.vy || 0) - 22 * dt); const ny = e.y + e.vy * dt, g = PHY.ground(e.x, e.z, e.r * 0.6, e.y + e.step + 0.3, ny - 0.1);
  if (g !== null && e.vy <= 0 && ny <= g + 0.03) { e.y = g; e.vy = 0; return true; }
  e.y = ny; return false;
};
/* ------------------------------------------------------------------ Torrent */
const STEED = { on: false, Q: null, x: 0, y: 0, z: 0, yaw: 0, spd: 0, vy: 0, r: 0.55, h: 2.2, step: 0.75, air: false, jumps: 0, hp: 1 };
STEED.SEAT = 0.935 - 0.42;
STEED.whistle = function () {
  const L = LEVEL.cur, a = PLAYER.a; if (!L || !a || !a.alive) return;
  if (STEED.on) { STEED.dismount(); return; }
  if (!GAME.save.torrent) { HUD.pop('YOU HAVE NO STEED YET'); return; }
  if (!L.def.mount) { HUD.pop('TORRENT CANNOT BE SUMMONED HERE'); return; }
  if (BOSS.list.some((b) => b.alive && !b.hidden && !b.passive && b.noMount && b.dist(a) < 60)) { HUD.pop('TORRENT WILL NOT COME'); return; }
  if (!STEED.Q) { STEED.Q = QUAD.build('horse', { horns: true, saddle: true, coat: 0x756a5c, mane: 0x24201c, tack: 0x4a2a1c }); }
  if (!STEED.Q.g.parent) LEVEL.add(STEED.Q.g);
  STEED.x = a.x; STEED.y = a.y; STEED.z = a.z; STEED.yaw = a.yaw; STEED.spd = a.speed; STEED.vy = 0; STEED.on = true; STEED.jumps = 0; STEED.Q.g.visible = true;
  PLAYER.state = 'ride'; a.play('ride', { fade: 0.18 }); a.actSpeed = 0; PLAYER.lock = null;
  FX.puff(V3(a.x, a.y + 1, a.z), 14, { add: true, size: 0.5, col: [0.5, 0.75, 1.3], a: 0.55, spread: 2, life: 0.8, rise: 1.2 }); FX.ring(V3(a.x, a.y + 0.05, a.z), [0.4, 0.7, 1.4], 2.4, 0.45);
};
STEED.dismount = function (thrown) {
  const a = PLAYER.a; if (!STEED.on) return; STEED.on = false;
  if (STEED.Q) { STEED.Q.g.visible = false; FX.puff(V3(STEED.x, STEED.y + 1.2, STEED.z), 16, { add: true, size: 0.55, col: [0.5, 0.75, 1.3], a: 0.55, spread: 2.2, life: 0.9, rise: 1.4 }); }
  if (!a) return; a.poseLean = 0; a.stop(0.15);
  a.x = STEED.x; a.z = STEED.z; a.y = STEED.y + 0.9; a.vx = Math.sin(STEED.yaw) * STEED.spd * 0.5; a.vz = Math.cos(STEED.yaw) * STEED.spd * 0.5; a.vy = thrown ? 4 : 2.5; a.grounded = false;
  if (a.alive) { PLAYER.state = 'air'; if (thrown) { a.play('knock', { fade: 0.05 }); PLAYER.state = 'knock'; a.iframe = 1.2; } }
  RIDE.spd = 0; if (a.inst.cloth) a.inst.cloth.reset();
};
PLAYER.states.ride = function (dt) {
  const a = PLAYER.a, S = STEED, Q = S.Q;
  if (IN.take('grip') || IN.take('rage')) { S.dismount(); return; }
  const dir = PLAYER.inputDir(PLAYER._d), mag = Math.min(1, dir.length()), sprint = IN.down('dodge') && PLAYER.stam > 1;
  const top = sprint ? 17 : 11.5;
  if (mag > 0.1) { dir.normalize(); const want = Math.atan2(dir.x, dir.z), dy = wrapA(want - S.yaw); S.yaw += clamp(dy, -1, 1) * Math.min(1, dt * (S.spd < 4 ? 6 : 3.4)); S.turn = clamp(dy, -1, 1); S.spd = damp(S.spd, top * mag * (1 - Math.min(0.6, Math.abs(dy) * 0.4)), 1.9, dt); }
  else { S.spd = damp(S.spd, 0, 3.2, dt); S.turn = 0; }
  if (sprint && mag > 0.1) PLAYER.stam = Math.max(0, PLAYER.stam - dt * 6);
  const e = S; e.hitWall = null; const blocked = PHY.move(e, Math.sin(S.yaw) * S.spd * dt, Math.cos(S.yaw) * S.spd * dt);
  if (blocked && e.hitWall) S.spd *= 0.9;
  const wasAir = S.air; const g = QUAD.fall(S, dt); S.air = !g;
  if (g) { if (wasAir && S.landV < -9) { FX.puff(V3(S.x, S.y + 0.1, S.z), 8, { size: 0.5, col: [0.5, 0.46, 0.38], a: 0.35, spread: 2, life: 1 }); FX.addShake(0.15); } S.jumps = 0; }
  S.landV = S.vy;
  if (IN.take('jump') && S.jumps < 2) { S.jumps++; S.vy = S.jumps === 1 ? 9.2 : 8.4; S.air = true; if (S.jumps === 2) { FX.ring(V3(S.x, S.y, S.z), [0.4, 0.7, 1.4], 2.2, 0.35); FX.puff(V3(S.x, S.y, S.z), 6, { add: true, size: 0.4, col: [0.5, 0.75, 1.3], a: 0.5, spread: 1.5, life: 0.5 }); } }
  if (LEVEL.cur && S.y < LEVEL.cur.killY) { S.dismount(); PLAYER.fell(); return; }
  // slope pitch
  const f = V3(Math.sin(S.yaw), 0, Math.cos(S.yaw)), gh = (x, z) => { const q = PHY.ground(x, z, 0.2, S.y + 2, S.y - 3); return q === null ? S.y : q; };
  const pT = S.air ? clamp(-S.vy * 0.03, -0.3, 0.3) : clamp(Math.atan2(gh(S.x + f.x * 1.1, S.z + f.z * 1.1) - gh(S.x - f.x * 1.1, S.z - f.z * 1.1), 2.2), -0.45, 0.45);
  S.pitch = damp(S.pitch || 0, S.air ? pT : -pT, 8, dt); S.bank = damp(S.bank || 0, -(S.turn || 0) * Math.min(1, S.spd / 12) * 0.22, 5, dt);
  Q.g.position.set(S.x, S.y, S.z); Q.g.rotation.set(0, S.yaw, 0); Q.update(dt, S.air ? 9 : S.spd, { pitch: S.pitch, bank: S.bank });
  Q.inner.updateMatrixWorld(true);
  const sw = _v4.set(Q.S.seat[0], Q.S.seat[1] + Q.inner.position.y, Q.S.seat[2]).applyMatrix4(Q.inner.matrixWorld);
  a.x = sw.x; a.z = sw.z; a.y = sw.y - S.SEAT; a.yaw = S.yaw; a.vx = a.vz = a.vy = 0; a.grounded = true; a.speed = 0; a.floorY = S.y; a.poseLean = (S.bank || 0) * 1.2;
  RIDE.spd = S.spd; RIDE.on = false;
  if (S.spd > 6 && !S.air && RNG() < dt * S.spd) FX.puff(V3(S.x - f.x * 0.8, S.y + 0.05, S.z - f.z * 0.8), 1, { size: 0.35, grow: 3, col: [0.5, 0.47, 0.38], a: 0.3, spread: 0.8, life: 1.1 });
  // strike from the saddle
  if (a.act === 'ride' && IN.take('attack') && PLAYER.stam > 4) { PLAYER.stam -= 12; a.play('rideSlash', { fade: 0.08 }); COMBAT.snapBlades(PLAYER.saber, PLAYER.prevSegs); }
  if (!a.act) { a.play('ride', { fade: 0.15 }); a.actSpeed = 0; }
  CAM.yaw = CAM.idleT > 1.0 && S.spd > 5 ? dampA(CAM.yaw, S.yaw, 1.3, dt) : CAM.yaw;
  MG.zoomOut = damp(MG.zoomOut || 0, 1.4 + S.spd * 0.05, 3, dt);
};
/* ------------------------------------------------------------------ wolves */
class Beast {
  constructor(x, z, o) {
    o = o || {}; const k = o.scale || 1.08;
    this.Q = QUAD.build('wolf', { coat: o.coat || 0x6a645c, leg: 0x57514a, mane: 0x35312c, scale: k }); R.scene.add(this.Q.g);
    const sp = ENEMY.findSpot(x, z, o.y);
    this.x = sp[0]; this.y = sp[1]; this.z = sp[2]; this.yaw = o.yaw || 0; this.vx = 0; this.vz = 0; this.vy = 0; this.r = 0.5; this.h = 1.15; this.step = 0.5; this.speed = 0;
    this.hp = this.hpMax = o.hp || 40; this.alive = true; this.team = 'foe'; this.hidden = false; this.iframe = 0; this.flash = 0; this.noExec = true; this.isBeast = true; this.runes = o.runes || 64; this.name = 'Wolf';
    this.state = 'idle'; this.stT = 0; this.alerted = !!o.alert; this.cd = rnd(0.5, 1.5); this.strafe = RNG() < 0.5 ? 1 : -1; this.home = [this.x, this.z]; this.dmg = o.dmg || 12; this.deadT = 0; this.roll = 0; this.type = 'wolf';
    this.react = (i) => this.onHit(i); this.die = (i) => this.onDie(i);
    ENEMY.list.push(this); COMBAT.actors.push(this); this.sync(0);
  }
  dist(o) { return Math.hypot(o.x - this.x, o.z - this.z); } angTo(o) { return Math.atan2(o.x - this.x, o.z - this.z); }
  chest(out) { return (out || new THREE.Vector3()).set(this.x, this.y + 0.8, this.z); } head(out) { return (out || new THREE.Vector3()).set(this.x + Math.sin(this.yaw) * 0.8, this.y + 1.1, this.z + Math.cos(this.yaw) * 0.8); }
  forward(out) { return (out || new THREE.Vector3()).set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  moveH(dx, dz) { return PHY.move(this, dx, dz); }
  sync(dt) { const g = this.Q.g; g.position.set(this.x, this.y, this.z); g.rotation.set(0, this.yaw, this.roll); this.Q.update(dt, this.speed, { pitch: this.crouch ? 0.16 : 0 }); }
  alert() { if (this.alerted) return; this.alerted = true; for (const e of ENEMY.list) if (e !== this && e.alive && !e.alerted && e.dist && e.dist(this) < 16 && e.alert) e.alert(); }
  update(dt) {
    this.stT += dt; this.iframe = Math.max(0, this.iframe - dt); this.flash = Math.max(0, this.flash - dt);
    if (!this.alive) { this.deadT += dt; this.roll = damp(this.roll, HALF * (this.rollS || 1), 7, dt); this.vx *= 0.9; this.vz *= 0.9; PHY.move(this, this.vx * dt, this.vz * dt); QUAD.fall(this, dt); this.speed = 0; this.sync(dt);
      if (this.deadT > 6 && !this.gone) { this.gone = true; this.hidden = true; this.Q.g.visible = false; } return; }
    const P = PLAYER.a, d = P ? this.dist(P) : 99; let tvx = 0, tvz = 0; this.crouch = false;
    if (!P || !P.alive || this.passive) { /* idle */ }
    else if (!this.alerted) { if (d < 17 || (d < 26 && P.speed > 5)) this.alert(); }
    else if (this.state === 'idle' || this.state === 'chase') {
      this.state = 'chase'; const ax = (P.x - this.x) / (d || 1), az = (P.z - this.z) / (d || 1);
      this.cd -= dt;
      if (d > 4.6) { tvx = ax * 7.2; tvz = az * 7.2; }
      else { tvx = -az * this.strafe * 3.4 + (d < 3 ? -ax * 2.5 : 0); tvz = ax * this.strafe * 3.4 + (d < 3 ? -az * 2.5 : 0); if (this.stT > 2.2) { this.strafe = -this.strafe; this.stT = 0; }
        if (this.cd <= 0 && COMBAT.wantToken('melee', this, 3)) { this.state = 'wind'; this.stT = 0; } }
      this.yaw = dampA(this.yaw, d > 4.6 || this.state === 'wind' ? Math.atan2(ax, az) : Math.atan2(tvx + ax * 2, tvz + az * 2), 7, dt);
      if (Math.hypot(this.x - this.home[0], this.z - this.home[1]) > 70) { this.alerted = false; this.state = 'idle'; }
    } else if (this.state === 'wind') { this.crouch = true; this.yaw = dampA(this.yaw, this.angTo(P), 9, dt); if (this.stT > 0.42) { this.state = 'lunge'; this.stT = 0; this.vy = 4.2; this.lv = [Math.sin(this.yaw) * 10.5, Math.cos(this.yaw) * 10.5]; this.bit = false; } }
    else if (this.state === 'lunge') { tvx = this.lv[0]; tvz = this.lv[1]; this.vx = tvx; this.vz = tvz;
      if (!this.bit && d < 1.5 && Math.abs(P.y - this.y) < 1.4) { this.bit = true; COMBAT.damage(P, this.dmg, { src: this, kind: 'melee', dir: V3(P.x - this.x, 0, P.z - this.z).normalize() }); }
      if (this.stT > 0.42) { this.state = 'recover'; this.stT = 0; COMBAT.freeToken('melee', this); this.cd = rnd(1.2, 2.6); } }
    else if (this.state === 'recover') { if (this.stT > 0.55) { this.state = 'chase'; this.stT = 0; } }
    else if (this.state === 'stagger') { if (this.stT > 0.5) { this.state = 'chase'; this.stT = 0; } }
    if (this.state !== 'lunge') { this.vx = damp(this.vx, tvx, this.state === 'stagger' ? 3 : 7, dt); this.vz = damp(this.vz, tvz, this.state === 'stagger' ? 3 : 7, dt); }
    for (const o of COMBAT.actors) { if (o === this || !o.alive || o.hidden) continue; const dx = this.x - o.x, dz = this.z - o.z, dd = Math.hypot(dx, dz), m = this.r + o.r + 0.1; if (dd < m && dd > 1e-4) { const q = (m - dd) / dd * 0.5; PHY.move(this, dx * q, dz * q); } }
    PHY.move(this, this.vx * dt, this.vz * dt); QUAD.fall(this, dt);
    this.speed = Math.hypot(this.vx, this.vz);
    if (LEVEL.cur && this.y < LEVEL.cur.killY) { COMBAT.damage(this, 9999, { kind: 'fall', unblockable: true }); return; }
    this.sync(dt);
  }
  onHit(info) { this.alert(); COMBAT.freeToken('melee', this); this.state = 'stagger'; this.stT = 0; const d = info.dir || V3(0, 0, 1), f = info.heavy || info.knock ? 8 : 4.5; this.vx = d.x * f; this.vz = d.z * f; if (info.heavy) this.vy = 3; }
  onDie(info) { COMBAT.freeToken('melee', this); const d = info.dir || V3(0, 0, 1); this.vx = d.x * 5; this.vz = d.z * 5; this.vy = 3; this.rollS = RNG() < 0.5 ? 1 : -1; }
  dispose() { if (this.Q.g.parent) this.Q.g.parent.remove(this.Q.g); }
}
/* ------------------------------------------------------------------ the Tree Sentinel */
MOV.rider = (function () {
  const B = { g: 'R', oR: 0, fl: [0.12, 1.0, 0.36], fL: [0.3, 0.3, 0.1], fR: [-0.3, 0.3, 0.1], liftL: 0, liftR: 0, toeL: 0.3, toeR: 0.3, cr: 0.42, pi: 0.06, tw: 0, air: 1, headPitch: -0.05, headYaw: 0 };
  const G0 = [-0.4, 1.08, 0.12], GA = [0.22, 0.95, 0.2];
  return {
    guard: { loop: true, keys: [K(0, G0, GA, B), K(1.6, [-0.4, 1.1, 0.12], [0.2, 0.96, 0.2], {})] },
    swingR: { dur: 1.35, ev: [[0.62, 0.9, 1, 34, 'jedi']], keys: [K(0, G0, GA, B), K(0.55, [-0.55, 1.6, -0.25], [-0.45, 0.55, -0.7], { tw: 0.7, pi: -0.1 }), K(0.72, [-0.62, 1.0, 0.45], [-0.5, -0.35, 0.8], { tw: 0.1, pi: 0.3 }), K(0.88, [-0.3, 0.8, 0.7], [0.75, -0.5, 0.45], { tw: -0.55, pi: 0.36 }), K(1.35, G0, GA, { tw: 0, pi: 0.06 })] },
    swingL: { dur: 1.35, ev: [[0.62, 0.9, 1, 34, 'jedi']], keys: [K(0, G0, GA, B), K(0.55, [0.1, 1.62, -0.15], [0.7, 0.55, -0.45], { tw: -0.6, pi: -0.1 }), K(0.72, [0.3, 1.0, 0.5], [0.8, -0.3, 0.5], { tw: 0.0, pi: 0.3 }), K(0.88, [0.2, 0.8, 0.6], [-0.6, -0.6, 0.5], { tw: 0.6, pi: 0.36 }), K(1.35, G0, GA, { tw: 0, pi: 0.06 })] },
    slam: { dur: 1.6, ev: [[0.8, 1.0, 1, 40, 'jedi']], keys: [K(0, G0, GA, B), K(0.7, [-0.32, 1.95, -0.2], [0.0, 0.5, -0.86], { pi: -0.2 }), K(0.92, [-0.2, 0.75, 0.8], [0.0, -0.62, 0.78], { pi: 0.45 }), K(1.2, [-0.2, 0.75, 0.8], [0.0, -0.6, 0.8], {}), K(1.6, G0, GA, { pi: 0.06 })] },
    death: { dur: 1.6, keys: [K(0, G0, GA, B), K(1.6, [-0.4, 0.7, 0.4], [0.9, -0.2, 0.3], { pi: 0.6, headPitch: 0.5 })] },
  };
})();
(function () { const i0 = MOV.init; MOV.init = function () { i0(); for (const k in MOV.rider) ANIM.compile(MOV.rider[k], ANIM.basePose); }; })();
class Sentinel {
  constructor(x, z, o) {
    o = o || {};
    this.Q = QUAD.build('horse', { gold: true, coat: 0x3a2c22, leg: 0x2c221c, mane: 0x5a0e0b, tack: 0x5a0e0b, saddle: true, scale: 1.34 }); R.scene.add(this.Q.g);
    const sp = ENEMY.findSpot(x, z);
    this.x = sp[0]; this.y = sp[1]; this.z = sp[2]; this.yaw = o.yaw || 0; this.vy = 0; this.r = 1.15; this.h = 3.5; this.step = 0.9; this.spd = 0; this.speed = 0;
    this.hp = this.hpMax = 780 * (MG.difficulty === 'easy' ? 0.7 : MG.difficulty === 'hard' ? 1.3 : 1); this.alive = true; this.team = 'foe'; this.hidden = false; this.iframe = 0; this.flash = 0; this.noExec = true; this.isBoss = true; this.noMount = false; this.name = 'TREE SENTINEL'; this.runes = 3200; this.isLord = true;
    this.rider = new Actor(CHAR.T.sentinel, { x: this.x, y: this.y, z: this.z, yaw: this.yaw, moves: MOV.rider, team: 'foe' }); this.rider.inst.root.scale.setScalar(1.24); this.rider.inst.scale = 1.24; this.rider.base = 'guard';
    this.saber = new Weapon('ghalberd'); this.saber.addTo(R.scene); this.rider.setProp(this.saber, false); this.rider.saber = this.saber; this.prevSegs = [];
    this.state = 'patrol'; this.stT = 0; this.cd = 1.5; this.patrol = o.patrol || null; this.pi = 0; this.home = [this.x, this.z]; this.hitDone = false; this.turnS = 1;
    this.react = (i) => this.onHit(i); this.die = (i) => this.onDie(i);
    BOSS.list.push(this); COMBAT.actors.push(this); this.sync(0);
  }
  get P() { return PLAYER.a; }
  dist(o) { return Math.hypot(o.x - this.x, o.z - this.z); } angTo(o) { return Math.atan2(o.x - this.x, o.z - this.z); }
  chest(out) { return (out || new THREE.Vector3()).set(this.x, this.y + 2.3, this.z); } head(out) { return this.chest(out); } forward(out) { return (out || new THREE.Vector3()).set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  moveH(dx, dz) { return PHY.move(this, dx, dz); }
  sync(dt) {
    const Q = this.Q, a = this.rider; Q.g.position.set(this.x, this.y, this.z); Q.g.rotation.set(0, this.yaw, 0); Q.update(dt, this.spd, { bank: this.bank || 0 }); Q.inner.updateMatrixWorld(true);
    const sw = _v4.set(Q.S.seat[0], Q.S.seat[1] + 0.02, Q.S.seat[2]).applyMatrix4(Q.inner.matrixWorld);
    a.x = sw.x; a.z = sw.z; a.y = sw.y - STEED.SEAT * 1.24; a.yaw = this.yaw; a.grounded = true; a.speed = 0; a.floorY = this.y;
    a.animate(dt); a.pose3D(dt); this.saber.update(dt, MG.t); this.saber.sampleTrails(MG.t, a.act && a.actClip && a.actClip.ev ? 1 : 0);
  }
  drive(dt, tx, tz, top, turn) {   // steer like a horse: a limited turn rate, speed bleeds off in hard turns
    const want = Math.atan2(tx - this.x, tz - this.z), dy = wrapA(want - this.yaw); this.yaw += clamp(dy, -1, 1) * Math.min(1, dt * (turn || 1.6)); this.bank = damp(this.bank || 0, -clamp(dy, -1, 1) * 0.16 * Math.min(1, this.spd / 8), 4, dt);
    this.spd = damp(this.spd, top * (1 - Math.min(0.55, Math.abs(dy) * 0.5)), 1.6, dt);
  }
  update(dt) {
    this.stT += dt; this.iframe = Math.max(0, this.iframe - dt); this.flash = Math.max(0, this.flash - dt);
    if (this.hidden) return;
    const P = this.P, a = this.rider, d = P ? this.dist(P) : 999;
    if (!this.alive) { this.deadT = (this.deadT || 0) + dt; this.spd = damp(this.spd, 0, 3, dt); this.Q.rear = damp(this.Q.rear, 0, 4, dt);
      if (RNG() < dt * 40) FX.puff(V3(this.x + rnd(-1, 1), this.y + rnd(0.3, 3), this.z + rnd(-1, 1)), 1, { add: true, size: 0.4, col: [2.2, 1.6, 0.5], a: 0.7, life: 1.2, rise: 1.6, spread: 0.6 });
      if (this.deadT > 2.4) { this.hidden = true; this.Q.g.visible = false; a.inst.setVisible(false); this.saber.setVisible(false); FX.ring(V3(this.x, this.y + 0.1, this.z), [2, 1.5, 0.5], 6, 0.8); } else this.sync(dt); return; }
    if (this.state === 'patrol') {
      if (this.patrol) { const tp = this.patrol[this.pi]; this.drive(dt, tp[0], tp[1], 2.4, 1.2); if (Math.hypot(tp[0] - this.x, tp[1] - this.z) < 3) this.pi = (this.pi + 1) % this.patrol.length; } else this.spd = damp(this.spd, 0, 2, dt);
      if (this.hp < this.hpMax) this.hp = Math.min(this.hpMax, this.hp + dt * 60);
      if (P && P.alive && (d < 21 || this.hurt)) { this.state = 'fight'; this.stT = 0; this.hurt = false; if (this.onEngage) this.onEngage(this); }
    } else if (!P || !P.alive) { this.spd = damp(this.spd, 0, 2, dt); }
    else if (this.state === 'fight') {
      if (Math.hypot(this.x - this.home[0], this.z - this.home[1]) > 130 || d > 85) { this.state = 'patrol'; if (this.onLeash) this.onLeash(this); }
      this.cd -= dt;
      // keep the lance arm toward the player: ride past at a couple of metres, wheel round, come again
      const side = this.turnS, px = P.x - Math.cos(this.yaw) * side * 2.2, pz = P.z + Math.sin(this.yaw) * side * 2.2;
      if (d > 7) this.drive(dt, px, pz, d > 24 ? 13 : 9.5, 1.9); else this.drive(dt, px, pz, 5.5, 2.3);
      const ang = wrapA(this.angTo(P) - this.yaw);
      if (!a.act && this.cd <= 0) {
        if (d < 4.6 && Math.abs(ang) < 2.0) { const m = RNG() < 0.25 ? 'slam' : ang > 0 ? 'swingL' : 'swingR'; a.play(m, { fade: 0.12 }); this.hitDone = false; this.cd = rnd(1.6, 2.6); COMBAT.snapBlades(this.saber, this.prevSegs); }
        else if (d < 7.5 && Math.abs(ang) < 0.5 && RNG() < dt * 1.2) { this.state = 'rear'; this.stT = 0; this.cd = 2.4; }
      }
      if (d < 3 && this.stT > 3) { this.turnS = -this.turnS; this.stT = 0; }
      // trample
      if (this.spd > 6 && d < 2.3 && Math.abs(ang) < 0.7 && P.iframe <= 0 && MG.t - (this.trT || -9) > 1.5) { this.trT = MG.t; COMBAT.damage(P, 20, { src: this, kind: 'trample', knock: true, dir: V3(P.x - this.x, 0, P.z - this.z).normalize() }); }
    } else if (this.state === 'rear') {   // the charger rears and comes down: a shockwave
      this.spd = damp(this.spd, 0, 5, dt); this.Q.rear = this.stT < 0.75 ? damp(this.Q.rear, 1, 6, dt) : damp(this.Q.rear, 0, 14, dt);
      if (this.stT > 0.9 && !this.stomped) { this.stomped = true; const f = this.forward(V3()); LORD.shock(this, V3(this.x + f.x * 2.2, this.y + 0.05, this.z + f.z * 2.2), 5.6, 30, [2.2, 1.6, 0.6]); }
      if (this.stT > 1.5) { this.state = 'fight'; this.stT = 0; this.stomped = false; }
    }
    PHY.move(this, Math.sin(this.yaw) * this.spd * dt, Math.cos(this.yaw) * this.spd * dt); QUAD.fall(this, dt); this.speed = this.spd;
    if (P && P.alive && d < this.r + P.r + 0.2 && d > 1e-3 && PLAYER.state !== 'ride') { const q = (this.r + P.r + 0.2 - d) / d; P.moveH((P.x - this.x) * q, (P.z - this.z) * q); }
    this.sync(dt);
    // the halberd
    const c = a.actClip;
    if (c && c.ev && P && P.alive && !this.hitDone) { const e = c.ev[0]; if (a.actT >= e[0] && a.actT <= e[1] + dt) {
      let hit = false, hp = null; COMBAT.sweep(this, this.saber, 1, this.prevSegs, (t, p) => { if (t === P) { hit = true; hp = p; } }, 8);
      if (!hit && a.act === 'slam' && a.actT > 0.9) { hit = d < 4.2 && Math.abs(wrapA(this.angTo(P) - this.yaw)) < 0.6; hp = P.chest(V3()); }
      if (hit) { this.hitDone = true; COMBAT.damage(P, e[3], { src: this, kind: 'jedi', heavy: true, knock: true, dir: V3(P.x - this.x, 0, P.z - this.z).normalize(), p: hp }); } } }
    COMBAT.snapBlades(this.saber, this.prevSegs);
  }
  onHit(info) { this.hurt = true; }
  onDie(info) { this.rider.play('death', { fade: 0.2 }); if (this.onDefeat) this.onDefeat(info); }
  dispose() { if (this.Q.g.parent) this.Q.g.parent.remove(this.Q.g); this.rider.dispose(); }
}
