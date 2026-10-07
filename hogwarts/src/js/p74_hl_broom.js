/* ==== p74_hl_broom.js ==== */
/* HOGWARTS — brooms. A Rider seats any actor on a broom (hands on the handle, robes streaming) and poses it at a
   heading / pitch / bank; HL.fly is the player's flight: the broom follows where you look, W drives, Shift boosts,
   S brakes to a hover, A/D slip sideways, Space/C rise and sink. It collides with the castle and skims the loch. */
class Rider {
  constructor(a, col) {
    this.a = a; this.yaw = a.yaw; this.pitch = 0; this.roll = 0; this.q = new THREE.Quaternion(); this.piv = new THREE.Vector3(); this.fw = new THREE.Vector3(0, 0, 1); this.speed = 0;
    this.broom = HL.broom(col); R.scene.add(this.broom); this.handle = new THREE.Object3D(); R.scene.add(this.handle);
    a.setProp(this.handle, false); a.stop(0.1); a.setBase('ride', 0.18); a.grounded = true; a.rider = this; a.inst.rider = this; this.lean = Rider.P.lean0; this.skirt(false);
    a.syncRoot = () => this.sync();
    if (a.wand) a.wand.visible = false;
  }
  sync() { const a = this.a, r = a.root, S = Rider.SEAT * (a.inst.scale || 1); _e1.set(-this.pitch, this.yaw, this.roll, 'YXZ'); this.q.setFromEuler(_e1); this.piv.set(a.x, a.y + S, a.z);
    r.quaternion.copy(this.q); r.position.copy(this.piv).addScaledVector(_v5.set(0, 1, 0).applyQuaternion(this.q), -S); a.inst.floorY = -1e9; this.fw.set(0, 0, 1).applyQuaternion(this.q); }
  update(dt) { const a = this.a; a.grounded = true; a.speed = 0; a.vx = a.vy = a.vz = 0; a.yaw = this.yaw; a.airT = 0;
    this.lean = damp(this.lean, Rider.P.lean0 + (Rider.P.lean1 - Rider.P.lean0) * sat(this.speed / 38), 3, dt);
    /* robes stream behind a rider even at the hover (hanging straight down from a seated body they made a black post under the broom) */
    const I = a.inst, dr = I.drape || (I.drape = { dir: new THREE.Vector3(), k: 0.2, amp: 0.07 }), th = clamp(1.02 + this.speed * 0.014, 1.02, 1.46); dr.k = 0.42; dr.amp = 0.05 + Math.min(0.08, this.speed * 0.0025);
    dr.dir.set(-this.fw.x * Math.sin(th), -Math.cos(th) - this.fw.y * 0.5, -this.fw.z * Math.sin(th)).normalize();
    a.animate(dt); a.pose3D(dt); this.broom.position.copy(this.piv).addScaledVector(_v5.set(0, 1, 0).applyQuaternion(this.q), -0.07); this.broom.quaternion.copy(this.q); }
  /* astride a broom the long skirt of the robe is gathered out of the way (hung from a seated body it made a black post under the broom): the cape streams, the legs show */
  skirt(on) { const cl = this.a.inst.cloth; if (cl && cl.panels) for (const P of cl.panels) if (P.pd && P.pd.bone === 0 && P.mesh) P.mesh.visible = on; }
  dispose() { const a = this.a; this.skirt(true); delete a.syncRoot; a.setProp(null); a.inst.drape = null; a.rider = null; a.inst.rider = null; if (this.broom.parent) this.broom.parent.remove(this.broom); if (this.handle.parent) this.handle.parent.remove(this.handle); if (a.wand) a.wand.visible = true; }
}
Rider.SEAT = 0.52;
/* The riding posture. The base clip is a person sitting on a chair, and that is what a rider looked like: bolt upright (leaning back a little), shins hanging.
   On a broom the body goes forward over the handle — more the faster it flies — the head stays up to look where it is going, and the feet are tucked back under the tail. */
Rider.P = { s: 1, lean0: 0.42, lean1: 0.86, neck: 0.62, fx: 0.21, fy: -0.5, fz: -0.16, px: 0.4, py: -0.1, pz: 1, toe: 0.55, ts: 1 };
{ const X = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), pole = new THREE.Vector3();
  const t0 = MOCAP.trunk; MOCAP.trunk = function (inst, mo) { t0(inst, mo); const Rd = inst.rider; if (!Rd) return; const B = inst.bones, P = Rider.P, a = P.s * Rd.lean;
    q.setFromAxisAngle(X, a * 0.5); B[1].quaternion.multiply(q); B[2].quaternion.multiply(q); q.setFromAxisAngle(X, -a * P.neck); B[3].quaternion.multiply(q); B[4].quaternion.multiply(q); };
  const l0 = MOCAP.legs; MOCAP.legs = function (inst, mo, opt, Pz, LD) { l0(inst, mo, opt, Pz, LD); const Rd = inst.rider; if (!Rd) return; const B = inst.bones, P = Rider.P, root = inst.root, S = Rider.SEAT * (inst.scale || 1), k = (inst.scale || 1);
    root.updateWorldMatrix(true, false); B[0].updateWorldMatrix(true, true);
    for (const [ia, ib, f, rd, sx] of [[13, 14, 15, LD.legL, 1], [16, 17, 18, LD.legR, -1]]) { const hip = B[ia].getWorldPosition(v1), tgt = v2.set(sx * P.fx * k, S + P.fy * k, P.fz * k); root.localToWorld(tgt); pole.set(sx * P.px, P.py, P.pz).applyQuaternion(Rd.q);
      IK.twoBone(B[ia], B[ib], hip, tgt, pole, rd, MOCAP._ik); B[f].updateWorldMatrix(true, false); q2.copy(Rd.q).multiply(q.setFromAxisAngle(X, P.ts * P.toe)); IK.setWorldQ(B[f], q2); } }; }
HL.fly = { on: false, speed: 0, roll: 0, boost: 1, boosting: false, vel: new THREE.Vector3(), R: null, lowT: 0, t: 0, bumpT: 0 };
HL.fly.mount = function () {
  const a = PLAYER.a, F = HL.fly; if (F.on || !a.alive) return; if (HL.noFly && HL.noFly()) return;
  F.on = true; PLAYER.state = 'fly'; F.R = new Rider(a); F.R.yaw = CAM.yaw; a.yaw = CAM.yaw; F.R.pitch = 0.2; F.speed = Math.max(5, a.speed); F.vel.set(0, 0, 0); F.lowT = -0.8; F.t = 0; a.y += 0.5;
  HL.P.blocking = false; HL.P.pending = null; HL.P.sprint = false; a.lumos = false;
  FX.puff(V3(a.x, a.y, a.z), 8, { size: 0.35, col: [0.6, 0.58, 0.5], a: 0.3, spread: 1.6, life: 0.8 }); R.kick(0.15);
  R.setShadowBox(HL.shadowFly || 130, 1300); if (HL.ui) HL.ui.onMount(true);
};
HL.fly.dismount = function (land) {
  const a = PLAYER.a, F = HL.fly; if (!F.on) return; F.on = false; F.R.dispose(); F.R = null; PLAYER.state = 'air'; a.grounded = false; a.vx = F.vel.x * 0.4; a.vz = F.vel.z * 0.4; a.vy = land ? 0 : Math.min(3, F.vel.y * 0.4); a.stop(0.15); a.play('air', { fade: 0.2 }); F.speed = 0; F.boosting = false;
  if (a.inst.cloth && a.inst.cloth.reset) a.inst.cloth.reset();
  R.setShadowBox(HL.shadowFoot || 46, 1300); if (HL.ui) HL.ui.onMount(false);
};
HL.fly.bump = function (info) { const F = HL.fly; F.speed *= 0.45; F.bumpT = 0.6; FX.addShake(0.4); };
HL.fly.floor = function (x, y, z) { let g = PHY.hf ? PHY.hf(x, z) : null; if (g === null) g = -1e9; const f = PHY.ground(x, z, 0.3, y + 0.6, y - 3); if (f !== null && f > g) g = f; if (HL.lake(x, z) > 0.5 && g < 0.35) g = 0.35; return g; };
HL.fly.update = function (dt) {
  const a = PLAYER.a, F = HL.fly, Rd = F.R; F.t += dt;
  const M = HL.Q && HL.Q.on && HL.Q.arena && HL.Q.phase !== 'over' ? HL.Q.arena : null, car = M && HL.Q.ball && HL.Q.ball.holder === HL.Q.me;   // in a match the stadium's rules of flight apply (p77c)
  if (!M && IN.take('broom') && F.t > 0.4) { F.dismount(false); return; }
  const thrust = IN.A.my < -0.3, brake = IN.A.my > 0.3, mx = IN.A.mx, up = IN.down('jump') ? 1 : 0, dn = IN.down('down') ? 1 : 0;
  F.spinT = Math.max(0, (F.spinT || 0) - dt); F.spinCd = Math.max(0, (F.spinCd || 0) - dt);
  if (IN.take('revelio') && F.spinCd <= 0) { F.spinT = 0.55; F.spinCd = 1.3; F.spinDir = mx !== 0 ? Math.sign(mx) : (RNG() < 0.5 ? 1 : -1); F.vel.addScaledVector(_v2.set(-Math.cos(Rd.yaw), 0, Math.sin(Rd.yaw)), F.spinDir * 15); R.kick(0.2); }
  const wasB = F.boosting; F.boosting = IN.down('dodge') && thrust && F.boost > 0.04 && (wasB || F.boost > 0.2);
  if (F.boosting) { F.boost = Math.max(0, F.boost - dt * 0.22 / (1 + (HL.G ? HL.G.boost : 0))); if (!wasB) { R.kick(0.5); FX.addShake(0.2); } } else F.boost = Math.min(1, F.boost + dt * 0.16);
  const dy = wrapA(CAM.yaw - Rd.yaw);
  Rd.yaw += dy * (1 - Math.exp(-(M ? 5.4 : 4.2 - Math.min(2, F.speed * 0.04)) * dt));
  const pT = clamp(CAM.pitch + 0.1, -1.15, 1.1) * (thrust ? 1 : 0.5);
  Rd.pitch = damp(Rd.pitch, pT, 4.5, dt);
  F.bumpT = Math.max(0, F.bumpT - dt);
  F.roll = damp(F.roll, clamp(-dy * 1.5 + mx * 0.4, -0.95, 0.95) + Math.sin(F.t * 30) * F.bumpT * 0.5, 6, dt); Rd.roll = F.roll + (F.spinT > 0 ? F.spinDir * (1 - F.spinT / 0.55) * TAU : 0);
  const sT = M ? (thrust ? (F.boosting ? (car ? 32 : 38) : (car ? 21.5 : 25)) : brake ? 0 : 4) : (thrust ? (F.boosting ? 50 : 25) : brake ? 0 : 6) * (1 + (HL.G ? HL.G.speed : 0));
  F.speed = damp(F.speed, sT, sT > F.speed ? (F.boosting ? 1.5 : 1.1) : (brake ? 2.6 : 0.8), dt); Rd.speed = F.speed;
  const cp = Math.cos(Rd.pitch), fw = _v1.set(Math.sin(Rd.yaw) * cp, Math.sin(Rd.pitch), Math.cos(Rd.yaw) * cp), right = _v2.set(-Math.cos(Rd.yaw), 0, Math.sin(Rd.yaw));
  const want = _v3.copy(fw).multiplyScalar(F.speed).addScaledVector(right, mx * (M ? 11 : 7.5)); want.y += (up - dn) * (M ? 11 : 8); if (M) M.steer(want, F, Rd, dt, thrust, up - dn);
  F.vel.lerp(want, 1 - Math.exp(-7 * dt));
  // the castle is solid: slide along whatever the broom would strike
  let vx = F.vel.x * dt, vy = F.vel.y * dt, vz = F.vel.z * dt;
  for (let it = 0; it < 2; it++) { const L = Math.hypot(vx, vy, vz); if (L < 1e-5) break; const hit = PHY.ray(a.x, a.y + 0.8, a.z, vx / L, vy / L, vz / L, L + 0.75, 'shot');
    if (!hit || hit.c === PHY.HFC) break; const pen = L + 0.75 - hit.t, dn2 = (vx * hit.nx + vy * hit.ny + vz * hit.nz) / L;
    if (dn2 < 0) { const imp = -dn2 * F.vel.length(); vx += hit.nx * pen * 1.02; vy += hit.ny * pen * 1.02; vz += hit.nz * pen * 1.02; const vd = F.vel.x * hit.nx + F.vel.y * hit.ny + F.vel.z * hit.nz; F.vel.x -= hit.nx * vd; F.vel.y -= hit.ny * vd; F.vel.z -= hit.nz * vd;
      if (imp > 12 && F.bumpT <= 0) { F.speed *= 0.5; F.bumpT = 0.5; FX.addShake(0.35); FX.spark(V3(a.x + vx, a.y + 0.8, a.z + vz), V3(hit.nx, hit.ny, hit.nz), 14, 5, [3, 2.4, 1.6], 0.4); } } else break; }
  a.x += vx; a.y += vy; a.z += vz; if (M) M.bound(a, F);
  const fl = F.floor(a.x, a.y, a.z), low = a.y < fl + 0.5;
  if (low) { a.y = fl + 0.5; if (F.vel.y < 0) F.vel.y = 0; if (Rd.pitch < 0) Rd.pitch = damp(Rd.pitch, 0, 10, dt); }
  if (a.y > 520) a.y = 520; a.x = clamp(a.x, -1700, 1700); a.z = clamp(a.z, -1700, 1700);
  // set down: slow and low over ground you can stand on
  const water = HL.lake(a.x, a.z) > 0.5 && fl < 0.5;
  F.lowT = low && !water && F.speed < 7 && !thrust ? F.lowT + dt : Math.min(F.lowT, 0);
  if (!M && (F.lowT > 0.35 || (low && dn && !water && F.speed < 12))) { a.y = fl; F.dismount(true); return; }
  // spray off the loch, sparks off the tail under boost, wind past the eye
  if (water && a.y < 2.6 && F.speed > 9 && RNG() < dt * 40) FX.puff(V3(a.x - fw.x * 0.8 + rnd(-0.5, 0.5), 0.15, a.z - fw.z * 0.8 + rnd(-0.5, 0.5)), 1, { size: 0.35, grow: 3, col: [0.85, 0.9, 0.95], a: 0.4, life: 0.9, spread: 0.6, rise: 1.6, vel: V3(-fw.x * 2, 1.2, -fw.z * 2) });
  if (F.boosting && RNG() < dt * 70) FX.puff(V3(a.x - fw.x * 1.1, a.y + 0.5 - fw.y * 1.1, a.z - fw.z * 1.1), 1, { add: true, size: 0.09, grow: 0.3, col: [3.0, 2.0, 0.7], a: 0.9, life: 0.5, spread: 0.5, drag: 2 });
  if (F.speed > 26 && RNG() < dt * 26) { const c = R.camera.position, d = R.camera.getWorldDirection(_v4), s = _v5.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).cross(d).normalize().multiplyScalar(rnd(2, 5)); FX.puff(V3(c.x + d.x * 16 + s.x, c.y + d.y * 16 + s.y, c.z + d.z * 16 + s.z), 1, { add: true, size: 0.04, grow: 0.2, col: [1.2, 1.3, 1.5], a: 0.35, life: 0.4, spread: 0.02, drag: 0.1, rise: 0.01, vel: V3(-d.x * 12, -d.y * 12, -d.z * 12) }); }
  if (F.boosting) R.G.zoom = Math.max(R.G.zoom, 0.1);
  Rd.update(dt);
  PLAYER.lastFly = MG.t;
};
