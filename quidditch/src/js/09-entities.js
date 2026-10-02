// ===================== ENTITIES: flyers & balls =====================
let FLYER_ID = 0;
class Flyer {
  constructor(side, house, role, slot) {
    this.id = FLYER_ID++; this.side = side; this.house = house; this.role = role; this.slot = slot;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.prev = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0; this.roll = 0; this.extraRoll = 0; this.extraPitch = 0;
    this.speed = CONFIG.flight.cruise;
    this.quat = new THREE.Quaternion(); this.fwd = new THREE.Vector3(0, 0, -1); this.right = new THREE.Vector3(1, 0, 0); this.up = new THREE.Vector3(0, 1, 0);
    this.input = { x: 0, y: 0, boost: false, brake: false };
    this.boost = 1; this.boosting = false; this.stun = 0; this.invuln = 0; this.dodge = null; this.lastHit = -99;
    this.turnMul = 1; this.speedMul = 1; this.lastBoostT = -9; this.hasBall = false; this.isPlayer = false; this.scripted = false; this.grab = 0;
    this.ai = { state: 'idle', t: Math.random(), target: new THREE.Vector3(), cool: 0, call: 0, swing: 0, swingTarget: null, bludger: null };
    this.mesh = Models.flyer(house, role, this.id * 7 + slot);
    Render.scene.add(this.mesh);
    this.home = new THREE.Vector3();
  }
  setPose(pos, yaw, pitch = 0) { this.pos.copy(pos); this.prev.copy(pos); this.yaw = yaw; this.pitch = pitch; this.roll = 0; this.extraRoll = 0; this.extraPitch = 0; this.frame(); this.vel.copy(this.fwd).multiplyScalar(this.speed); }
  frame() {
    _e1.set(this.pitch + this.extraPitch, this.yaw, this.roll + this.extraRoll, 'YXZ');
    this.quat.setFromEuler(_e1);
    this.fwd.set(0, 0, -1).applyQuaternion(this.quat);
    this.right.set(1, 0, 0).applyQuaternion(this.quat);
    this.up.set(0, 1, 0).applyQuaternion(this.quat);
  }
  lookDir(d, rate = 0, dt = 0) {
    const [y, p] = yawPitchFromDir(d);
    if (!rate) { this.yaw = y; this.pitch = p; }
    else { this.yaw += wrapAngle(y - this.yaw) * (1 - Math.exp(-rate * dt)); this.pitch = damp(this.pitch, p, rate, dt); }
  }
  hand(out) { return out.copy(this.pos).addScaledVector(this.right, 0.36).addScaledVector(this.up, 0.42).addScaledVector(this.fwd, 0.35); }
  startDodge(dir) {
    if (this.dodge || this.stun > 0) return false;
    this.dodge = { t: 0, dur: dir === 'up' || dir === 'down' ? 0.55 : 0.46, dir };
    this.invuln = Math.max(this.invuln, 0.5);
    return true;
  }
  flight(dt) {
    const F = CONFIG.flight;
    this.prev.copy(this.pos);
    let ix = this.input.x, iy = this.input.y;
    if (this.stun > 0) { this.stun -= dt; const t = Game.time; ix = Math.sin(t * 13 + this.id) * 0.7; iy = Math.cos(t * 9 + this.id) * 0.35; }
    this.invuln = Math.max(0, this.invuln - dt);
    const tm = (this.input.brake ? F.brakeTurn : 1) * this.turnMul;
    const yawRate = -ix * F.yawRate * tm;
    this.yaw = wrapAngle(this.yaw + yawRate * dt);
    this.pitch = clamp(this.pitch + iy * F.pitchRate * tm * dt, -F.maxPitch, F.maxPitch);
    let target = this.input.brake ? F.brake : F.cruise;
    if (this.input.boost && this.boost > 0.02 && this.stun <= 0) {
      target = F.boost; this.boost = Math.max(0, this.boost - F.boostDrain * dt); this.lastBoostT = Game.time;
      if (!this.boosting && this.isPlayer) Sound.play('boost', { vol: 0.7 });
      this.boosting = true;
    } else { this.boosting = false; this.boost = Math.min(1, this.boost + F.boostRegen * dt); }
    target = target * this.speedMul - Math.sin(this.pitch) * F.dive;
    this.speed = damp(this.speed, target, target > this.speed ? F.accel : F.decel, dt);
    this.roll = damp(this.roll, clamp(yawRate * F.bank, -F.maxBank, F.maxBank), 5, dt);
    let lat = 0, vert = 0;
    if (this.dodge) {
      const d = this.dodge; d.t += dt; const u = clamp(d.t / d.dur, 0, 1), s = Math.sin(Math.PI * u);
      if (d.dir === 'left' || d.dir === 'right') { const sg = d.dir === 'left' ? 1 : -1; this.extraRoll = sg * TAU * easeInOut(u); lat = -sg * 15 * s; }
      else if (d.dir === 'up') { vert = 13 * s; this.extraPitch = 0.55 * s; }
      else { vert = -11 * s; this.extraPitch = -0.5 * s; }
      if (u >= 1) { this.dodge = null; this.extraRoll = 0; this.extraPitch = 0; }
    }
    this.frame();
    _v1.copy(this.fwd).multiplyScalar(this.speed);
    this.vel.lerp(_v1, 1 - Math.exp(-F.grip * dt));
    this.pos.addScaledVector(this.vel, dt);
    if (lat) { _v2.set(this.right.x, 0, this.right.z).normalize(); this.pos.addScaledVector(_v2, lat * dt); }
    if (vert) this.pos.y += vert * dt;
    this.constrain(dt);
  }
  constrain(dt) {
    const P = CONFIG.pitch;
    if (this.pos.y < P.floor) { this.pos.y = P.floor; if (this.vel.y < 0) this.vel.y *= -0.2; if (this.pitch < 0) this.pitch = damp(this.pitch, 0.05, 8, dt); }
    if (this.pos.y > P.ceiling) { this.pos.y = damp(this.pos.y, P.ceiling, 3, dt); if (this.pitch > 0) this.pitch = damp(this.pitch, -0.1, 3, dt); }
    const rho = (this.pos.x / P.boundA) ** 2 + (this.pos.z / P.boundB) ** 2;
    if (rho > 1) {
      const k = 1 / Math.sqrt(rho); this.pos.x = lerp(this.pos.x, this.pos.x * k, 0.2); this.pos.z = lerp(this.pos.z, this.pos.z * k, 0.2);
      const cy = Math.atan2(this.pos.x, this.pos.z);
      this.yaw += wrapAngle(cy - this.yaw) * (1 - Math.exp(-2.2 * dt));
      this.outOfBounds = true;
    } else this.outOfBounds = false;
    const n = World.collide(this.pos, 0.55, _v3);
    if (n) {
      const d = this.vel.dot(n);
      if (d < 0) { this.vel.addScaledVector(n, -1.7 * d); this.speed *= 0.62; }
      const [y] = yawPitchFromDir(this.vel); if (n.y < 0.5) this.yaw += wrapAngle(y - this.yaw) * 0.5;
      if (this.isPlayer && d < -4) Game.onBump(-d);
    }
  }
  sync() {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.copy(this.quat);
  }
}

class Quaffle {
  constructor() {
    this.mesh = Models.quaffle(); Render.scene.add(this.mesh);
    this.pos = new THREE.Vector3(0, 12, 0); this.vel = new THREE.Vector3(); this.prev = new THREE.Vector3();
    this.holder = null; this.state = 'free'; this.thrower = null; this.throwT = -9; this.passTarget = null; this.lastSide = -1; this.lastPasser = null; this.lastPassT = -9;
    this.trail = FX.trail(0.28, new THREE.Color(1.6, 0.5, 0.3), 26);
    this.rot = new THREE.Vector3();
  }
  attach(f) {
    if (this.holder) this.holder.hasBall = false;
    this.holder = f; f.hasBall = true; this.state = 'held'; this.passTarget = null; this.lastSide = f.side; this.trail.active = false;
  }
  release(vel, target) {
    const f = this.holder; if (f) { f.hasBall = false; f.hand(this.pos); }
    this.thrower = f; this.holder = null; this.state = 'flying'; this.vel.copy(vel); this.throwT = Game.time; this.passTarget = target || null;
    this.trail.reset(); this.trail.active = true; this.trail.u.uColor.value.setRGB(1.4, 0.45, 0.25); this.trail.width = 0.28;
  }
  drop(vel) {
    const f = this.holder; if (f) { f.hasBall = false; f.hand(this.pos); }
    this.holder = null; this.thrower = f; this.state = 'free'; this.vel.copy(vel); this.throwT = Game.time; this.passTarget = null; this.trail.active = false;
  }
  update(dt) {
    this.prev.copy(this.pos);
    if (this.state === 'held' && this.holder) { this.holder.hand(this.pos); }
    else if (this.state === 'flying' || this.state === 'free') {
      const g = this.state === 'flying' ? CONFIG.ball.g : 3.2;
      this.vel.y -= g * dt;
      this.vel.multiplyScalar(Math.exp(-(this.state === 'flying' ? CONFIG.ball.drag : 0.7) * dt));
      this.pos.addScaledVector(this.vel, dt);
      if (this.pos.y < 0.35) { this.pos.y = 0.35; this.vel.y = Math.abs(this.vel.y) * 0.45 + 2.5; this.vel.x *= 0.8; this.vel.z *= 0.8; }
      if (this.state === 'free' && this.pos.y < 2.5) this.vel.y += 4 * dt;
      if (this.state === 'flying' && Game.time - this.throwT > 2.6) { this.state = 'free'; this.trail.active = false; }
      const P = CONFIG.pitch, rho = (this.pos.x / (P.standA - 4)) ** 2 + (this.pos.z / (P.standB - 4)) ** 2;
      if (rho > 1) { const k = 1 / Math.sqrt(rho); this.pos.x *= k; this.pos.z *= k; this.vel.x *= -0.4; this.vel.z *= -0.4; }
      if (this.pos.y > P.ceiling) { this.pos.y = P.ceiling; this.vel.y = -Math.abs(this.vel.y) * 0.5; }
      this.rot.x += this.vel.length() * dt * 0.9;
    }
    if (this.trail.active) this.trail.push(this.pos);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(this.rot.x, this.rot.y + Game.time * 0.4, 0);
    this.mesh.visible = !(Cam.mode === 'fp' && ((this.holder && this.holder.isPlayer) || (this.state === 'scripted' && Game.player && Game.player.hasBall)));
  }
}

class Bludger {
  constructor(i) {
    this.i = i; this.mesh = Models.bludger(); Render.scene.add(this.mesh);
    this.pos = new THREE.Vector3(i ? 6 : -6, 10, 0); this.vel = new THREE.Vector3(); this.prev = new THREE.Vector3();
    this.state = 'roam'; this.timer = 0; this.byside = -1; this.target = null; this.smokeT = 0; this.claimed = null; this.contactCd = 0; this.dodgeRolled = false;
    this.trail = FX.trail(0.35, new THREE.Color(0.9, 0.18, 0.08), 22);
  }
  strike(dir, side, target) {
    this.state = 'struck'; this.vel.copy(dir).multiplyScalar(CONFIG.bludger.struck); this.byside = side; this.target = target; this.timer = 0; this.dodgeRolled = false;
    this.trail.reset(); this.trail.active = true;
  }
  update(dt) {
    this.prev.copy(this.pos); this.timer += dt; this.contactCd -= dt;
    const B = CONFIG.bludger;
    if (this.state === 'struck') {
      if (this.target && this.timer < 1.6) {
        _v1.subVectors(this.target.pos, this.pos).normalize().multiplyScalar(this.vel.length());
        this.vel.lerp(_v1, 1 - Math.exp(-0.4 * dt));
      }
      if (this.timer > 2.6) { this.state = 'roam'; this.target = null; this.trail.active = false; }
      if ((this.smokeT -= dt) < 0) { this.smokeT = 0.05; FX.smoke(this.pos, linCol(0.08, 0.07, 0.07), 0.5, 1, { a: 0.35, rise: 0.2, life: 0.6 }); }
    } else {
      let best = null, bd = 1e9;
      for (const f of Game.flyers) { if (f.scripted || f.role === 'keeper') continue; const d = f.pos.distanceToSquared(this.pos); if (d < bd) { bd = d; best = f; } }
      const t = Game.time * 0.6 + this.i * 3;
      _v1.set(Math.sin(t) * 30, 14 + Math.sin(t * 1.7) * 6, Math.cos(t * 0.8) * 18);
      if (best && bd < 40 * 40) _v1.lerp(best.pos, 0.3);
      _v2.subVectors(_v1, this.pos).normalize().multiplyScalar(B.roam);
      this.vel.lerp(_v2, 1 - Math.exp(-1.1 * dt));
    }
    this.pos.addScaledVector(this.vel, dt);
    if (this.pos.y < 1) { this.pos.y = 1; this.vel.y = Math.abs(this.vel.y) * 0.6; }
    if (this.pos.y > CONFIG.pitch.ceiling) { this.pos.y = CONFIG.pitch.ceiling; this.vel.y = -Math.abs(this.vel.y); }
    const P = CONFIG.pitch, rho = (this.pos.x / (P.standA - 6)) ** 2 + (this.pos.z / (P.standB - 6)) ** 2;
    if (rho > 1) { const k = 1 / Math.sqrt(rho); this.pos.x *= k; this.pos.z *= k; this.vel.x *= -0.6; this.vel.z *= -0.6; }
    if (this.trail.active) this.trail.push(this.pos);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.x += dt * 9; this.mesh.rotation.y += dt * 5;
  }
}

class Snitch {
  constructor() {
    this.group = Models.snitch(); this.group.visible = false; Render.scene.add(this.group);
    this.pos = new THREE.Vector3(0, 30, 0); this.vel = new THREE.Vector3(); this.goal = new THREE.Vector3();
    this.active = false; this.t = 0; this.jink = 0; this.retarget = 0;
    this.trail = FX.trail(0.18, new THREE.Color(3, 2.2, 0.8), 30);
  }
  release() { this.active = true; this.pos.set(rnd(-20, 20), 30, rnd(-10, 10)); this.group.visible = true; this.trail.reset(); this.trail.active = true; this.retarget = 0; }
  hide() { this.active = false; this.group.visible = false; this.trail.active = false; this.trail.reset(); }
  update(dt) {
    if (!this.active) return;
    this.t += dt; this.retarget -= dt;
    const S = CONFIG.snitch;
    if (this.retarget < 0) { this.retarget = rnd(0.6, 1.6); this.goal.set(rnd(-95, 95), rnd(6, 55), rnd(-55, 55)); const r = (this.goal.x / 100) ** 2 + (this.goal.z / 60) ** 2; if (r > 1) this.goal.multiplyScalar(0.8); }
    let threat = null, td = 1e9;
    for (const f of Game.flyers) { if (f.role !== 'seeker') continue; const d = f.pos.distanceTo(this.pos); if (d < td) { td = d; threat = f; } }
    let spd = S.speed + Math.sin(this.t * 3.1) * 4;
    if (threat && td < 7 && this.jink <= 0) {
      this.jink = 0.45;
      _v1.subVectors(this.pos, threat.pos).normalize(); _v2.randomDirection().multiplyScalar(0.8); _v1.add(_v2).normalize();
      this.goal.copy(this.pos).addScaledVector(_v1, 30); this.retarget = 0.6; Sound.play('flutter', { vol: 0.4 });
    }
    if (this.jink > 0) { this.jink -= dt; spd = S.jink; }
    _v1.subVectors(this.goal, this.pos);
    _v1.x += Math.sin(this.t * 7.3) * 6; _v1.y += Math.sin(this.t * 9.1) * 4; _v1.z += Math.cos(this.t * 6.7) * 6;
    _v1.normalize().multiplyScalar(spd);
    this.vel.lerp(_v1, 1 - Math.exp(-(this.jink > 0 ? 9 : 3) * dt));
    this.pos.addScaledVector(this.vel, dt);
    this.pos.y = clamp(this.pos.y, 2, CONFIG.pitch.ceiling - 4);
    this.group.position.copy(this.pos);
    this.group.lookAt(_v2.copy(this.pos).add(this.vel));
    const fl = Math.sin(this.t * 60) * 0.9;
    this.group.userData.wl.rotation.z = fl; this.group.userData.wr.rotation.z = -fl;
    const dist = this.pos.distanceTo(Render.camera.position);
    const s = clamp(dist * 0.035, 0.8, 4); this.group.userData.glow.scale.set(s, s, 1);
    this.trail.push(this.pos);
  }
}
