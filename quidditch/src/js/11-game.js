// ===================== CAMERA DIRECTOR =====================
const Cam = {
  mode: 'orbit', shake: 0, lookBack: 0, kick: 0, fovMul: 1, roll: 0,
  sPos: new THREE.Vector3(), sLook: new THREE.Vector3(), sRoll: 0, sFov: 1, sQuat: null,
  orbitT: 0, shotT: 0, shot: 0, oPos: new THREE.Vector3(0, 40, 120), oLook: new THREE.Vector3(),
  addShake(a) { this.shake = Math.min(1.6, this.shake + a * (Settings.reduceMotion ? 0.45 : 1)); },
  update(rdt) {
    const cam = Render.camera, p = Game.player;
    this.shake = Math.max(0, this.shake - rdt * 2.2);
    let fov = 1;
    if (this.mode === 'fp' && p) {
      cam.position.copy(p.pos).addScaledVector(p.up, 0.72).addScaledVector(p.fwd, -0.05);
      if (Settings.horizonLock) { _e1.set(p.pitch + p.extraPitch, p.yaw, p.extraRoll * (Settings.reduceMotion ? 0 : 1), 'YXZ'); cam.quaternion.setFromEuler(_e1); }
      else cam.quaternion.copy(p.quat);
      this.lookBack = damp(this.lookBack, Input.look ? 1 : 0, 9, rdt);
      if (this.lookBack > 0.001) { _q1.setFromAxisAngle(UP, this.lookBack * Math.PI * 0.92); cam.quaternion.multiply(_q1); }
      const k = clamp((p.speed - CONFIG.flight.cruise) / (CONFIG.flight.boost - CONFIG.flight.cruise), 0, 1.3);
      this.kick = damp(this.kick, Settings.reduceMotion ? 0 : k, 4, rdt);
      fov = (1 + this.kick * 0.17) * (Game.state === 'finisher' ? this.sFov : 1);
    } else if (this.mode === 'script') {
      cam.position.copy(this.sPos);
      if (this.sQuat) cam.quaternion.copy(this.sQuat); else cam.lookAt(this.sLook);
      if (this.sRoll) cam.rotateZ(Settings.reduceMotion ? 0 : this.sRoll);
      fov = this.sFov;
    } else {
      this.director(rdt);
      cam.position.copy(this.oPos); cam.lookAt(this.oLook);
    }
    if (this.shake > 0.001) {
      const t = Game.rtime * 31, s = this.shake * this.shake * 0.018;
      cam.rotateX((vnoise2(t, 1.3) - 0.5) * s); cam.rotateY((vnoise2(t, 7.9) - 0.5) * s); cam.rotateZ((vnoise2(t, 4.1) - 0.5) * s * 0.6);
    }
    this.fovMul = fov;
    Render.setFov(fov);
  },
  director(rdt) {
    this.orbitT += rdt; this.shotT -= rdt;
    const Q = Game.quaffle;
    if (this.shotT <= 0) { this.shot = (this.shot + 1) % 3; this.shotT = this.shot === 0 ? 9 : 6; this.snap = true; }
    const tgtPos = _v4, tgtLook = _v5;
    if (this.shot === 0 || !Q) {
      const a = this.orbitT * 0.06;
      tgtPos.set(Math.cos(a) * 118, 30 + Math.sin(a * 0.7) * 8, Math.sin(a) * 78); tgtLook.set(0, 12, 0);
    } else if (this.shot === 1) {
      const c = Q.holder || Game.flyers[0];
      if (Q.holder) { tgtPos.copy(c.pos).addScaledVector(c.fwd, -7).addScaledVector(c.up, 2.2).addScaledVector(c.right, 1.5); tgtLook.copy(c.pos).addScaledVector(c.fwd, 12); }
      else { tgtPos.copy(Q.pos).add(_v6.set(-10, 4, 8)); tgtLook.copy(Q.pos); }
    } else {
      tgtPos.set(Q.pos.x > 0 ? 58 : -58, 6, 24); tgtLook.copy(Q.pos);
    }
    if (this.snap) { this.oPos.copy(tgtPos); this.oLook.copy(tgtLook); this.snap = false; }
    this.oPos.lerp(tgtPos, 1 - Math.exp(-2.2 * rdt)); this.oLook.lerp(tgtLook, 1 - Math.exp(-4 * rdt));
  },
};

// ===================== GAME / RULES =====================
const Game = {
  time: 0, rtime: 0, mode: 'demo', state: 'idle', flyers: [], teams: [[], []], player: null, houses: [0, 1],
  score: [0, 0], clock: 360, length: 360, overtime: false, otT: 0, snitchReleased: false, swapT: 0, diff: CONFIG.difficulty.pro,
  ts: 1, curTs: 1, hitStop: 0, slowT: 0, slowTs: 1, timers: [],
  flair: 0, style: { val: 0, score: 0, lastT: -9, rank: 0 }, stats: null,
  throwAnim: 0, catchAnim: 0, stealCd: 0, nearCd: 0, skimT: 0, slipT: 0, lastPlayerPassT: -9, readyNotified: false,
  vmHand: new THREE.Vector3(0.05, -0.255, -0.45), vmSway: new THREE.Vector2(), hitFx: 0, warnT: 0, warnDir: 0,

  init() {
    this.quaffle = new Quaffle(); this.bludgers = [new Bludger(0), new Bludger(1)]; this.snitch = new Snitch();
  },
  attackSign(side) { return side === 0 ? 1 : -1; },
  keeper(side) { return this.teams[side].find(f => f.role === 'keeper'); },
  after(t, fn) { this.timers.push({ at: this.rtime + t, fn }); },
  clearFlyers() {
    for (const f of this.flyers) { Render.scene.remove(f.mesh); f.mesh.geometry.dispose(); }
    this.flyers = []; this.teams = [[], []]; this.player = null;
  },
  setup(mode) {
    this.clearFlyers(); FX.clear(); this.timers = [];
    this.mode = mode;
    this.houses = mode === 'demo' ? [Math.floor(Math.random() * 4), 0] : [Settings.team, Settings.opp];
    if (this.houses[1] === this.houses[0]) this.houses[1] = (this.houses[0] + 1 + Math.floor(Math.random() * 3)) % 4;
    this.diff = CONFIG.difficulty[Settings.difficulty] || CONFIG.difficulty.pro;
    this.length = [180, 360, 600][Settings.length] || 360;
    this.clock = this.length; this.overtime = false; this.otT = 0; this.snitchReleased = false; this.swapT = 0; this.score = [0, 0];
    this.flair = mode === 'lab' ? 1 : 0; this.style = { val: 0, score: 0, lastT: -9, rank: 0 }; this.readyNotified = false;
    this.stats = { goals: 0, assists: 0, passes: 0, steals: 0, shots: 0, dodges: 0, finishers: 0, best: null, topSpeed: 0, bestRank: 0, hits: 0 };
    this.ts = 1; this.slowT = 0; this.hitStop = 0; this.time = 0;
    { const fx = Render.post.fx; fx.blur = 0; fx.ca = 0; fx.flash = 0; fx.letterbox = 0; fx.keepHue = 0; fx.hit = 0; this.hitFx = 0; }
    const roles = [['chaser', 0], ['chaser', 1], ['chaser', 2], ['beater', 0], ['beater', 1], ['keeper', 0], ['seeker', 0]];
    for (const side of [0, 1]) for (const [role, slot] of roles) {
      if (mode === 'lab' && (side === 1 ? role !== 'keeper' : role !== 'chaser')) continue;
      const f = new Flyer(side, this.houses[side], role, slot);
      this.flyers.push(f); this.teams[side].push(f);
    }
    if (mode !== 'demo') { this.player = this.teams[0][0]; this.player.isPlayer = true; }
    if (this.vm) Render.camera.remove(this.vm.group);
    this.vm = mode === 'demo' ? null : Models.viewmodel(this.houses[0]);
    if (this.vm) Render.camera.add(this.vm.group);
    const Q = this.quaffle; Q.holder = null; Q.state = 'free'; Q.trail.reset(); Q.trail.active = false;
    for (const b of this.bludgers) { b.mesh.visible = mode !== 'lab'; b.state = 'roam'; b.trail.reset(); b.trail.active = false; b.vel.set(0, 0, 0); }
    this.bludgers[0].pos.set(-4, 10, 6); this.bludgers[1].pos.set(4, 10, -6);
    this.snitch.hide();
    this.kickoff();
    Cam.mode = mode === 'demo' ? 'orbit' : 'fp'; Cam.shotT = 0;
    if (mode === 'match') { this.state = 'countdown'; this.countT = 3.2; this.countShown = 4; }
    else { this.state = 'play'; if (mode === 'lab') this.labReset(); }
    World.excite.fill(0);
    this.vmHand.set(0.05, -0.255, -0.45);
    this.updateViewmodel(1);
    HUD.matchStart && HUD.matchStart();
  },
  kickoff() {
    for (const f of this.flyers) {
      const sx = this.attackSign(f.side), yaw = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      const p = _v1;
      if (f.role === 'chaser') p.set(-sx * 26, 14 + f.slot, (f.slot - 1) * 10);
      else if (f.role === 'beater') p.set(-sx * 36, 18, f.slot ? 16 : -16);
      else if (f.role === 'keeper') p.set(-sx * (CONFIG.pitch.hoopX - 3.2), 14, 0);
      else p.set(-sx * 44, 40, f.side ? 20 : -20);
      f.speed = CONFIG.flight.cruise; f.setPose(p, yaw); f.boost = 1; f.stun = 0; f.dodge = null; f.hasBall = false; f.scripted = false;
      f.ai.target.copy(p); f.ai.smooth = null; f.mesh.visible = !f.isPlayer; f.sync();
    }
    const Q = this.quaffle; Q.pos.set(0, 10, 0); Q.vel.set(0, 7, 0); Q.state = 'free'; Q.holder = null; Q.thrower = null; Q.rolled = null;
  },
  labReset() {
    const p = this.player, Q = this.quaffle;
    p.setPose(_v1.set(rnd(5, 25), rnd(12, 18), rnd(-12, 12)), -Math.PI / 2 + rnd(-0.2, 0.2));
    p.speed = CONFIG.flight.cruise; Q.attach(p); this.flair = 1;
    const k = this.keeper(1); if (k) { k.pos.set(CONFIG.pitch.hoopX - 3.2, 14, 0); k.ai.smooth = null; k.hasBall = false; }
    for (const f of this.teams[0]) if (!f.isPlayer) f.setPose(_v1.set(p.pos.x - 6, p.pos.y, p.pos.z + (f.slot === 1 ? -10 : 10)), p.yaw);
  },

  update(rdt) {
    this.rtime += rdt;
    for (let i = this.timers.length - 1; i >= 0; i--) if (this.rtime >= this.timers[i].at) { const t = this.timers[i]; this.timers.splice(i, 1); t.fn(); }
    if (this.state === 'idle' || this.state === 'paused') return;
    let ts = this.ts;
    if (this.slowT > 0) { this.slowT -= rdt; ts = Math.min(ts, this.slowTs); }
    if (this.hitStop > 0) { this.hitStop -= rdt; ts = Math.min(ts, 0.05); }
    this.curTs = ts;
    const dt = rdt * ts;
    this.time += dt;
    if (this.state === 'countdown') {
      this.countT -= rdt;
      const n = Math.ceil(this.countT);
      if (n !== this.countShown && n >= 1 && n <= 3) { this.countShown = n; HUD.bigCount(String(n)); Sound.play('ui'); }
      if (this.countT <= 0) { this.state = 'play'; HUD.bigCount('GO', 0.6); Sound.play('whistle', { dur: 0.5 }); Sound.crowdRoar(0.6, 2); }
      for (const f of this.flyers) f.sync();
      this.quaffle.update(0);
      this.updateViewmodel(rdt);
      return;
    }
    if (this.state === 'finisher') Finishers.update(rdt);
    if (this.state === 'play') this.updateClock(dt);
    this.updatePlayerInput(rdt);
    AI.update(dt);
    const steps = dt > 1 / 50 ? 2 : 1, sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (const f of this.flyers) if (!f.scripted && f.role !== 'keeper') f.flight(sdt);
      this.quaffle.update(sdt);
      for (const b of this.bludgers) if (b.mesh.visible) b.update(sdt);
      this.snitch.update(sdt);
      if (this.state === 'play') this.interactions(sdt);
    }
    for (const f of this.flyers) f.sync();
    if (this.player) this.updatePlayerFeel(rdt, dt);
    this.updateViewmodel(rdt);
    this.styleUpdate(rdt);
    this.audioUpdate(rdt);
  },
  updateClock(dt) {
    if (this.swapT > 0) { this.swapT -= dt; if (this.swapT <= 0) HUD.swap(false); }
    if (this.mode !== 'match') return;
    if (!this.overtime) {
      this.clock -= dt;
      if (!this.snitchReleased && this.clock <= this.length / 2) { this.snitchReleased = true; this.releaseSnitch(); }
      if (this.clock <= 0) { this.clock = 0; this.overtime = true; this.otT = 0; HUD.ticker('Full time. Only the Snitch can end it now.'); Sound.play('whistle', { dur: 0.7 }); }
    } else {
      this.otT += dt;
      if (this.otT > 60 && this.snitch.active) {
        const s = this.flyers.filter(f => f.role === 'seeker').sort((a, b) => a.pos.distanceTo(this.snitch.pos) - b.pos.distanceTo(this.snitch.pos))[0];
        if (s) this.catchSnitch(s);
      }
    }
  },
  updatePlayerInput(rdt) {
    const p = this.player; if (!p || p.scripted) return;
    const s = Settings.sens;
    p.input.x = clamp(Input.steer.x * s, -1, 1);
    p.input.y = clamp(Input.steer.y * s * (Settings.invert ? -1 : 1), -1, 1);
    p.input.boost = Input.boost; p.input.brake = Input.brake;
    if (Input.gyroYaw || Input.gyroPitch) {
      p.yaw += Input.gyroYaw; p.pitch = clamp(p.pitch + Input.gyroPitch, -CONFIG.flight.maxPitch, CONFIG.flight.maxPitch);
      Input.gyroYaw = 0; Input.gyroPitch = 0;
    }
    p.turnMul = 1.05; p.speedMul = 1;
    this.stealCd -= rdt;
  },

  // ---------- interactions ----------
  interactions(dt) {
    const Q = this.quaffle;
    if (Q.state === 'flying' || Q.state === 'free') { this.checkGoal(); if (!Q.holder && Q.state !== 'scripted') this.checkCatch(); }
    for (const b of this.bludgers) if (b.mesh.visible) this.checkBludger(b);
  },
  checkGoal() {
    const Q = this.quaffle, R = CONFIG.pitch.hoopR - 0.12;
    for (const h of World.hoops) {
      const x0 = Q.prev.x - h.pos.x, x1 = Q.pos.x - h.pos.x;
      if (x0 * x1 > 0 || x0 === x1) continue;
      const t = x0 / (x0 - x1), y = lerp(Q.prev.y, Q.pos.y, t) - h.pos.y, z = lerp(Q.prev.z, Q.pos.z, t) - h.pos.z;
      if (y * y + z * z < R * R && Math.sign(Q.vel.x) === h.side) { this.goal(h.side > 0 ? 0 : 1, h, {}); return; }
    }
  },
  checkCatch() {
    const Q = this.quaffle;
    for (const f of this.flyers) {
      if (f.stun > 0 || f.scripted || f.role === 'beater' || f.role === 'seeker') continue;
      if (f === Q.thrower && this.time - Q.throwT < 0.45) continue;
      let reach = CONFIG.ball.catchR;
      const hostileShot = Q.thrower && Q.thrower.side !== f.side && Q.state === 'flying';
      if (f.role === 'keeper') reach = hostileShot ? this.diff.keeperReach : 2.2;
      if (f.isPlayer) reach = 2.9;
      _v1.copy(f.pos).addScaledVector(f.up, 0.35);
      if (_v1.distanceTo(Q.pos) > reach) continue;
      if (f.isPlayer) { _v2.subVectors(Q.pos, f.pos); if (_v2.dot(f.fwd) < -1.0) continue; this.catchBy(f); return; }
      if (Q.passTarget === f || Q.state === 'free') { this.catchBy(f); return; }
      if (!Q.rolled) Q.rolled = new Set();
      if (Q.rolled.has(f.id)) continue;
      Q.rolled.add(f.id);
      const p = f.role === 'keeper' ? 0.9 : hostileShot ? 0.32 * this.diff.aim : 0.85;
      if (Math.random() < p) { this.catchBy(f); return; }
    }
  },
  catchBy(f) {
    const Q = this.quaffle, thrower = Q.thrower, wasFlying = Q.state === 'flying';
    Q.attach(f); Q.rolled = null;
    const near = Render.camera.position.distanceTo(f.pos) < 35;
    if (f.isPlayer) {
      const perfect = this.rtime - Input.tapT < 0.35 && wasFlying;
      this.catchAnim = 0.25; Sound.play('catch'); Platform.vibrate(18);
      if (perfect) { this.styleEvent('PERFECT CATCH', 0.15, 160); FX.star(Q.pos, linCol(3, 2.6, 1.4), 1.2, 0.4); Sound.play('perfect', { vol: 0.7 }); }
      if (thrower && thrower.side === f.side && this.time - this.lastPlayerPassT < 4) this.styleEvent('ONE-TWO', 0.1, 140);
      else if (thrower && thrower.side !== f.side && wasFlying) { this.styleEvent('INTERCEPTION', 0.18, 200); this.stats.steals++; }
    } else if (near) Sound.play('catch', { vol: 0.5 });
    if (thrower && thrower.side === f.side && thrower !== f) {
      Q.lastPasser = thrower; Q.lastPassT = this.time;
      if (thrower.isPlayer) { this.stats.passes++; this.styleEvent(null, 0.06, 60); }
    }
    if (f.role === 'keeper' && thrower && thrower.side !== f.side && wasFlying) this.onSave(f, thrower);
  },
  onSave(k, shooter) {
    FX.sparks(k.pos, linCol(2, 1.6, 1), 14, 6);
    if (shooter.isPlayer) { HUD.banner('SAVED', 'THE KEEPER READ IT'); Sound.crowdGroan(); }
    else if (this.player && k.side === this.player.side) { HUD.ticker(`Huge save by the ${CONFIG.teams[this.houses[k.side]].name} Keeper!`); Sound.crowdRoar(0.5, 2); World.excite[this.houses[k.side]] = 0.7; }
  },
  checkBludger(b) {
    for (const f of this.flyers) {
      if (f.scripted) continue;
      if (b.state === 'struck' && f.side === b.byside) continue;
      if (b.state !== 'struck' && f.role === 'keeper') continue;
      const d = f.pos.distanceTo(b.pos);
      if (f.isPlayer && b.state === 'struck') {
        if (d < 5.5) b.nearP = true;
        else if (b.nearP && d > 6) { b.nearP = false; if (f.dodge || f.invuln > 0.02) this.perfectDodge(b); }
      }
      if (d < CONFIG.bludger.hitR && f.invuln <= 0 && f.stun <= 0) {
        if (b.state !== 'struck') {
          if (b.contactCd > 0) continue;
          b.contactCd = 2.5;
          if (Math.random() > 0.22 || (f.isPlayer && this.time - f.lastHit < CONFIG.bludger.playerGap)) continue;
        }
        this.hitFlyer(f, b);
        _v1.subVectors(b.pos, f.pos).normalize(); b.vel.reflect(_v1).multiplyScalar(0.5); b.pos.addScaledVector(_v1, 1);
        b.state = 'roam'; b.trail.active = false; b.nearP = false;
        return;
      }
    }
  },
  perfectDodge(b) {
    this.stats.dodges++;
    this.slowT = 0.35; this.slowTs = 0.25;
    this.styleEvent('PERFECT DODGE', 0.25, 260);
    Sound.play('perfect'); Sound.play('whoosh', { vol: 0.8 }); Platform.vibrate(25);
    FX.ring(b.pos, linCol(1.5, 1.8, 2.4), 3, 0.5);
  },
  hitFlyer(f, b) {
    const hard = b.state === 'struck';
    f.stun = hard ? 1.0 : 0.55; f.lastHit = this.time; f.speed *= 0.6;
    FX.sparks(f.pos, linCol(2.4, 1.2, 0.5), 22, 9); FX.smoke(f.pos, linCol(0.1, 0.09, 0.09), 1, 4, { a: 0.5 });
    if (f.hasBall) { _v2.randomDirection().multiplyScalar(6).addScaledVector(f.vel, 0.4); _v2.y = Math.abs(_v2.y) + 2; this.quaffle.drop(_v2); }
    const cd = Render.camera.position.distanceTo(f.pos);
    if (f.isPlayer) {
      this.stats.hits++; Cam.addShake(1.25); this.hitFx = 1; this.hitStop = 0.06;
      Sound.play('hit'); Platform.vibrate([90, 40, 140]); HUD.popup('BLUDGERED!', true);
      this.style.val = Math.max(0, this.style.val - 1.2);
    } else if (cd < 60) { Sound.play('hit', { vol: clamp(1 - cd / 60, 0.1, 0.6) }); if (this.player && f.side !== this.player.side) Sound.crowdRoar(0.35, 1.5); }
  },
  steal(thief, victim) {
    const Q = this.quaffle; Q.attach(thief); victim.stun = 0.45; victim.speed *= 0.7;
    const cd = Render.camera.position.distanceTo(thief.pos);
    if (cd < 50) Sound.play('steal', { vol: clamp(1.2 - cd / 50, 0.2, 1) });
    FX.sparks(Q.pos, linCol(2, 2, 2), 10, 5, { grav: 0 });
    if (victim.isPlayer) { HUD.popup('STOLEN!', true); Cam.addShake(0.6); Platform.vibrate([40, 30, 60]); }
    if (thief.isPlayer) { this.stats.steals++; this.styleEvent('STEAL', 0.2, 220); this.hitStop = 0.05; Cam.addShake(0.35); Platform.vibrate(30); }
  },

  // ---------- passing & shooting ----------
  ballistic(from, to, speed, out) {
    const d = from.distanceTo(to), t = clamp(d / speed, 0.05, 3);
    out.subVectors(to, from).divideScalar(t); out.y += 0.5 * CONFIG.ball.g * t; out.multiplyScalar(1 + CONFIG.ball.drag * t * 0.5);
    return out;
  },
  pass(from, to) {
    const Q = this.quaffle; if (Q.holder !== from) return;
    from.hand(_v1);
    const t = clamp(_v1.distanceTo(to.pos) / CONFIG.ball.pass, 0.1, 2);
    _v2.copy(to.pos).addScaledVector(to.vel, t * 0.9).addScaledVector(UP, 0.3);
    this.ballistic(_v1, _v2, CONFIG.ball.pass, _v3);
    Q.release(_v3, to); Q.rolled = null;
    if (from.isPlayer) { Sound.play('throw'); this.throwAnim = 0.3; this.lastPlayerPassT = this.time; Platform.vibrate(12); }
    else if (Render.camera.position.distanceTo(from.pos) < 30) Sound.play('throw', { vol: 0.4 });
  },
  aiShoot(f, hoop) {
    const err = (1 - this.diff.aim) * 3.4;
    _v4.copy(hoop.pos).add(_v5.set(0, rnd(-err, err), rnd(-err, err)));
    f.hand(_v1); this.ballistic(_v1, _v4, 38, _v3);
    this.quaffle.release(_v3, null); this.quaffle.rolled = null;
    if (Render.camera.position.distanceTo(f.pos) < 40) Sound.play('throw', { vol: 0.6 });
  },
  targetHoop(p = this.player) {
    if (!p) return null;
    const sx = this.attackSign(p.side); let best = null, ba = -2;
    for (const h of World.hoops) { if (h.side !== sx) continue; _v1.subVectors(h.pos, p.pos).normalize(); const a = _v1.dot(p.fwd); if (a > ba) { ba = a; best = h; } }
    return best;
  },
  passTarget() {
    const p = this.player; if (!p) return null;
    let best = null, bs = -1e9;
    for (const m of this.teams[p.side]) {
      if (m === p || m.role !== 'chaser' || m.scripted) continue;
      _v1.subVectors(m.pos, p.pos); const d = _v1.length(); if (d > 70) continue;
      const s = _v1.normalize().dot(p.fwd) * 2 - d / 70;
      if (s > bs) { bs = s; best = m; }
    }
    return best;
  },
  finisherReady() {
    const p = this.player;
    if (!p || !p.hasBall || this.flair < 1 || this.state !== 'play' || p.role !== 'chaser') return false;
    const h = this.targetHoop(); if (!h) return false;
    const d = h.pos.distanceTo(p.pos); if (d > 85) return false;
    _v1.subVectors(h.pos, p.pos).normalize(); return _v1.dot(p.fwd) > 0.3;
  },
  onShootDown() { if (this.player && this.player.role === 'seeker') this.grabbing = true; },
  onShootUp(charge, gesture) {
    const p = this.player; if (!p || this.state !== 'play') return;
    if (p.role === 'seeker') { this.grabbing = false; this.tryGrab(); return; }
    if (!p.hasBall) { this.tryPlayerSteal(); return; }
    if (this.finisherReady() && Settings.finisherLen !== 'off') { Finishers.trigger(gesture); return; }
    this.playerShoot(charge, this.finisherReady());
  },
  playerShoot(charge, guaranteed = false) {
    const p = this.player, Q = this.quaffle;
    const speed = lerp(CONFIG.ball.shotMin, CONFIG.ball.shotMax, clamp(charge / CONFIG.ball.charge, 0, 1));
    p.hand(_v1);
    const T = 0.7;
    _v3.copy(p.fwd).multiplyScalar(speed); _v3.y += 0.5 * CONFIG.ball.g * T;
    const h = this.targetHoop();
    if (h) {
      _v2.subVectors(h.pos, _v1).normalize();
      const ang = Math.acos(clamp(_v2.dot(p.fwd), -1, 1));
      const lvl = Settings.aimAssist;
      const cone = (lvl === 'off' ? 0 : lvl === 'low' ? 9 : lvl === 'high' ? 20 : lerp(9, 22, this.diff.assist)) * DEG;
      if (guaranteed || ang < cone) {
        this.ballistic(_v1, h.pos, speed, _v4);
        const k = guaranteed ? 1 : smooth01(1 - ang / cone) * 0.94;
        _v3.lerp(_v4, k);
      }
    }
    if (guaranteed && h) { this.flair = 0; this.styleEvent('STRAIGHT SHOT', 0, 120); }
    Q.release(_v3, null); Q.rolled = null;
    this.stats.shots++; this.throwAnim = 0.3;
    Sound.play('throw'); Platform.vibrate(15); Cam.addShake(0.12);
  },
  onPassTap() {
    const p = this.player; if (!p || this.state !== 'play') return;
    Input.tapT = this.rtime;
    if (!p.hasBall) { Input.callT = this.rtime; return; }
    if (this.finisherReady() && Settings.finisherLen !== 'off') {
      this.passTaps = (this.passTaps || []).filter(t => this.rtime - t < 0.6); this.passTaps.push(this.rtime);
      if (this.passTaps.length >= 3 && Finishers.hawksheadOK()) { this.passTaps = []; clearTimeout(this.passTimer); Finishers.trigger('hawkshead'); return; }
      clearTimeout(this.passTimer);
      this.passTimer = setTimeout(() => { if (this.player && this.player.hasBall && this.state === 'play') { this.passTaps = []; const m = this.passTarget(); if (m) this.pass(this.player, m); } }, 280);
      return;
    }
    const m = this.passTarget(); if (m) this.pass(p, m);
  },
  onSwipe(dir) {
    const p = this.player; if (!p || this.state !== 'play') return;
    if (p.startDodge(dir)) { Sound.play('dodge'); Platform.vibrate(10); }
  },
  tryPlayerSteal() {
    const p = this.player, Q = this.quaffle;
    if (this.stealCd > 0) return;
    this.stealCd = 0.8; this.throwAnim = 0.25;
    const c = Q.holder;
    p.speed += 6;
    if (c && c.side !== p.side) {
      _v1.subVectors(c.pos, p.pos); const d = _v1.length();
      if (d < 5.5 && _v1.normalize().dot(p.fwd) > 0.45) {
        const chanceP = clamp(0.62 + (p.boosting ? 0.15 : 0) - (c.role === 'keeper' ? 0.25 : 0) - (c.invuln > 0 ? 0.5 : 0), 0.05, 0.95);
        if (Math.random() < chanceP) { this.steal(p, c); return; }
        HUD.popup('MISSED', true); Sound.play('whoosh', { vol: 0.5 }); return;
      }
    }
    Sound.play('whoosh', { vol: 0.4 });
  },
  tryGrab() {
    const p = this.player, S = this.snitch;
    if (!S.active) return;
    _v1.subVectors(S.pos, p.pos); const d = _v1.length();
    if (d < 2.6 && _v1.normalize().dot(p.fwd) > 0.55) { this.catchSnitch(p); return; }
    HUD.popup(d < 6 ? 'SO CLOSE' : 'TOO FAR', true); Sound.play('whoosh', { vol: 0.4 });
  },

  // ---------- events ----------
  goal(side, hoop, info) {
    this.score[side] += 10;
    const Q = this.quaffle, scorer = info.scorer || Q.thrower;
    if (!info.finisher) { Q.state = 'free'; Q.vel.multiplyScalar(0.25); Q.trail.active = false; Q.holder = null; }
    hoop.glow = 1.3; FX.shockwave(hoop.pos, linCol(2.6, 1.9, 0.8), 12); FX.sparks(hoop.pos, linCol(3, 2.2, 0.9), 50, 13);
    const pSide = this.player ? this.player.side : 0, house = this.houses[side];
    World.excite[house] = 1;
    const T = CONFIG.teams[house];
    FX.confetti(_v1.copy(hoop.pos).add(_v2.set(-hoop.side * 6, 4, 0)), [new THREE.Color(T.c1), new THREE.Color(T.c2), linCol(1, 1, 1)], 70, 8);
    if (side === pSide) { Sound.play('bell'); Sound.play('stinger'); Sound.crowdRoar(1, 3.5); }
    else { Sound.play('bell', { vol: 0.5 }); if (this.player) Sound.crowdGroan(); else Sound.crowdRoar(0.8, 3); }
    if (scorer && scorer.isPlayer) {
      this.stats.goals++;
      this.styleEvent(null, info.finisher ? 0 : 0.12, info.finisher ? 0 : 320);
      if (!info.finisher) HUD.banner('GOAL!', '+10');
      for (let i = 0; i < 2; i++) this.after(0.2 + i * 0.35, () => FX.firework(_v1.set(hoop.side * 92, rnd(30, 45), rnd(-30, 30)), new THREE.Color(T.c2).multiplyScalar(1.4)));
      Platform.vibrate([30, 30, 70]);
      HUD.ticker(pick(['What a strike!', 'Right through the hoop!', 'The crowd is on its feet!', 'Ten points, beautifully taken!']));
    } else if (this.player && side === pSide) {
      HUD.banner('GOAL!', T.name.toUpperCase());
      if (Q.lastPasser && Q.lastPasser.isPlayer && this.time - Q.lastPassT < 6) { this.stats.assists++; this.styleEvent('ASSIST', 0.1, 160); }
    } else if (this.player) HUD.banner(`${T.short} SCORE`, '');
    const k = this.keeper(1 - side);
    if (info.finisher) { /* restart handled when the cinematic ends */ }
    else if (this.mode === 'lab') this.after(1.4, () => { if (this.mode === 'lab' && this.state === 'play') this.labReset(); });
    else if (k) this.after(1.1, () => { if (!Q.holder && (this.state === 'play' || this.state === 'finisher')) { Q.attach(k); } });
  },
  releaseSnitch() {
    this.snitch.release(); Sound.play('snitch');
    HUD.banner('SNITCH SPOTTED', this.player && this.player.role === 'chaser' ? 'TAP SEEKER SWAP TO CHASE IT' : '');
    if (this.player && this.player.role === 'chaser' && this.mode === 'match') { this.swapT = 10; HUD.swap(true); }
    World.excite.fill(0.6); Sound.crowdRoar(0.7, 2.5);
  },
  seekerSwap() {
    if (this.swapT <= 0 || !this.player) return;
    const s = this.teams[this.player.side].find(f => f.role === 'seeker'); if (!s) return;
    const old = this.player; old.isPlayer = false; old.mesh.visible = true;
    s.isPlayer = true; s.mesh.visible = false; s.boost = 1; this.player = s; this.swapT = 0; HUD.swap(false);
    HUD.ticker('You are the Seeker now. Hold GRAB as you close in.'); HUD.setShootLabel('GRAB');
    Sound.play('rise', { vol: 0.6 }); Platform.vibrate(20);
  },
  catchSnitch(f) {
    if (this.state !== 'play' && this.state !== 'finisher') return;
    const val = Settings.snitch === 'classic' ? 150 : 30;
    this.score[f.side] += val; this.snitch.hide();
    const T = CONFIG.teams[this.houses[f.side]];
    if (f.isPlayer) { this.styleEvent('SNITCH CAUGHT', 0, 1500); this.stats.snitch = true; Platform.vibrate([60, 40, 60, 40, 160]); this.hitStop = 0.12; FX.star(f.pos, linCol(4, 3, 1), 3, 0.8); }
    HUD.banner('SNITCH CAUGHT', `${T.name.toUpperCase()} +${val}`);
    Sound.play('end'); Sound.crowdRoar(1, 5); World.excite[this.houses[f.side]] = 1;
    this.endMatch();
  },
  endMatch() {
    this.state = 'end'; HUD.swap(false);
    const win = this.score[0] === this.score[1] ? -1 : this.score[0] > this.score[1] ? 0 : 1;
    if (win >= 0) {
      const T = CONFIG.teams[this.houses[win]];
      for (let i = 0; i < 7; i++) this.after(0.4 + i * 0.45, () => FX.firework(_v1.set(rnd(-90, 90), rnd(35, 60), rnd(-50, 50)), new THREE.Color(i % 2 ? T.c1 : T.c2).multiplyScalar(1.5)));
      if (this.player && win === this.player.side) { Sound.chant(true); World.wave.amt = 1; }
    }
    if (this.mode === 'match') {
      SaveData.matches++; if (win === 0) SaveData.wins++;
      SaveData.best = Math.max(SaveData.best, this.style.score); SaveData.bestRank = Math.max(SaveData.bestRank, this.stats.bestRank);
      if (win === 0 && !SaveData.unlocked.thunder) { SaveData.unlocked.thunder = true; this.newUnlock = 'Thunderclap'; }
      if ((this.stats.bestRank >= 5 || (win === 0 && Settings.difficulty === 'legend')) && !SaveData.unlocked.starfall) { SaveData.unlocked.starfall = true; this.newUnlock = 'Starfall'; }
      persist();
    }
    this.after(3.6, () => { Sound.chant(false); World.wave.amt = 0; UI.results(win); });
  },
  onBump(impact) {
    if (impact > 6) { Cam.addShake(Math.min(1, impact / 18)); Sound.play('thud', { vol: clamp(impact / 20, 0.3, 1) }); Platform.vibrate(30); }
    if (impact > 14) { this.player.stun = 0.35; }
  },
  warnSwing(beater) { this.warnT = 0.5; this.warnFrom = beater; },

  // ---------- style ----------
  styleEvent(label, flair, points) {
    if (this.mode === 'demo') return;
    const wasReady = this.flair >= 1;
    this.flair = Math.min(1, this.flair + flair);
    this.style.val = Math.min(6.2, this.style.val + points / 170);
    this.style.lastT = this.rtime;
    this.style.score += Math.round(points * (1 + Math.floor(this.style.val) * 0.25));
    if (label) HUD.popup(label);
    if (!wasReady && this.flair >= 1 && this.mode === 'match') { Sound.play('ready'); Platform.vibrate([20, 40, 20]); HUD.hint('FINISHER READY · HOLD SHOOT + SWIPE', 3); }
  },
  styleUpdate(rdt) {
    if (this.rtime - this.style.lastT > 3) this.style.val = Math.max(0, this.style.val - rdt * 0.14);
    const r = Math.min(5, Math.floor(this.style.val));
    if (r !== this.style.rank) { if (r > this.style.rank) { Sound.play('rank', { vol: 0.7 }); } this.style.rank = r; HUD.rank(r); }
    if (this.stats) this.stats.bestRank = Math.max(this.stats.bestRank, r);
    if (this.mode === 'lab') this.flair = 1;
  },

  // ---------- feel ----------
  updatePlayerFeel(rdt, dt) {
    const p = this.player, fx = Render.post.fx;
    if (this.stats) this.stats.topSpeed = Math.max(this.stats.topSpeed, p.vel.length());
    this.hitFx = Math.max(0, this.hitFx - rdt * 1.8); fx.hit = this.hitFx;
    if (this.state !== 'play') return;
    const spd = p.vel.length();
    // near misses
    this.nearCd -= rdt;
    if (this.nearCd <= 0 && spd > 24) {
      const d = World.nearSolid(p.pos);
      let close = d > 0 && d < 2.6;
      let label = 'CLOSE CALL';
      if (!close) for (const o of this.flyers) { if (o === p || o.scripted) continue; const dd = o.pos.distanceTo(p.pos); if (dd < 2.6 && dd > 1.0) { close = true; label = 'THREADED'; break; } }
      if (close) { this.nearCd = 1.3; this.styleEvent(label, 0.07, 90); Sound.play('whoosh', { vol: 0.6 }); Platform.vibrate(8); }
    }
    // ground skim
    if (p.pos.y < 2.6 && spd > 24) {
      this.skimT += rdt; this.flair = Math.min(1, this.flair + rdt * 0.05); this.style.lastT = this.rtime;
      if (Math.random() < rdt * 40) this.FXgrass(p);
      if (this.skimT > 0.6 && !this.skimShown) { this.skimShown = true; this.styleEvent('LOW RIDER', 0.05, 110); }
    } else { this.skimT = 0; this.skimShown = false; }
    // slipstream
    let slip = false;
    for (const o of this.flyers) {
      if (o === p || o.scripted) continue;
      _v1.subVectors(p.pos, o.pos); const behind = -_v1.dot(o.fwd);
      if (behind > 2 && behind < 15) { _v2.copy(_v1).addScaledVector(o.fwd, behind); if (_v2.length() < 2.6) { slip = true; break; } }
    }
    if (slip) {
      p.boost = Math.min(1, p.boost + CONFIG.flight.slipRegen * rdt); this.flair = Math.min(1, this.flair + rdt * 0.04); this.slipT += rdt; this.style.lastT = this.rtime;
      if (this.slipT > 0.5 && !this.slipShown) { this.slipShown = true; this.styleEvent('SLIPSTREAM', 0.04, 80); }
      FX.speedLines(Render.camera.position, p.vel, spd, rdt, 1.4);
    } else { this.slipT = 0; this.slipShown = false; }
    if (spd > 27) FX.speedLines(Render.camera.position, p.vel, spd, rdt, clamp((spd - 27) / 12, 0, 1));
    fx.blur = damp(fx.blur, Settings.reduceMotion ? 0 : clamp((spd - 31) / 8, 0, 1) * 0.028, 5, rdt); fx.blurCenter.set(0.5, 0.5);
    // comfort vignette
    HUD.comfort(Settings.comfort ? clamp(Math.abs(p.input.x) * 0.9 + Math.abs(p.input.y) * 0.5, 0, 1) : 0);
    this.warnT -= rdt;
  },
  FXgrass(p) {
    _v1.copy(p.pos).addScaledVector(p.fwd, 3); _v1.y = 0.2;
    FX.alpha.spawn({ x: _v1.x + rnd(-1, 1), y: 0.25, z: _v1.z + rnd(-1, 1), vx: rnd(-2, 2) + p.vel.x * 0.2, vy: rnd(2, 5), vz: rnd(-2, 2) + p.vel.z * 0.2, life: rnd(0.4, 0.8), s0: 0.12, s1: 0.06, r: 0.08, g: 0.16, b: 0.04, a0: 0.9, a1: 0, grav: 9, type: 3, vrot: rnd(-10, 10) });
  },
  updateViewmodel(rdt) {
    const vm = this.vm; if (!vm) return;
    const p = this.player;
    vm.group.visible = Cam.mode === 'fp' && !!p;
    if (!vm.group.visible) return;
    this.vmSway.x = damp(this.vmSway.x, -p.input.x * 0.035, 6, rdt);
    this.vmSway.y = damp(this.vmSway.y, -p.input.y * 0.03 + (p.stun > 0 ? Math.sin(this.rtime * 20) * 0.02 : 0), 6, rdt);
    const bob = Math.sin(this.rtime * 7.3) * 0.006 * (p.speed / 22);
    const drop = clamp(-(Math.tan(Render.camera.fov * DEG / 2) - 0.5) * 0.62, -0.26, 0.06);
    vm.group.position.set(this.vmSway.x, this.vmSway.y + bob + drop, p.boosting ? 0.06 : 0);
    const tgt = _v1.set(0.05, -0.255, -0.45);
    if (p.hasBall) tgt.set(0.37, -0.23, -0.72);
    if (p.role === 'seeker') tgt.set(0.05, -0.255, -0.45);
    if (Input.shootHeld && p.hasBall) tgt.lerp(_v2.set(0.44, -0.08, -0.26), easeOut(clamp((this.rtime - Input.shootT) / CONFIG.ball.charge, 0, 1)));
    if (Input.shootHeld && p.role === 'seeker') tgt.set(0.1, -0.1, -1.0);
    if (this.throwAnim > 0) { this.throwAnim -= rdt; tgt.set(0.06, -0.14, -0.95); }
    if (this.catchAnim > 0) { this.catchAnim -= rdt; tgt.set(0.24, -0.14, -0.8); }
    this.vmHand.lerp(tgt, 1 - Math.exp(-(this.throwAnim > 0 ? 30 : 14) * rdt));
    vm.rGlove.position.copy(this.vmHand);
    _v2.subVectors(this.vmHand, vm.shoulder); const len = _v2.length();
    vm.rArm.position.copy(vm.shoulder); vm.rArm.quaternion.setFromUnitVectors(_v3.set(0, 0, 1), _v2.normalize()); vm.rArm.scale.set(1, 1, len / 0.78);
    vm.ball.visible = p.hasBall;
    if (p.hasBall) { vm.ball.position.copy(this.vmHand).add(_v2.set(0.01, 0.085, -0.06)); vm.ball.rotation.y += rdt * 0.5; }
  },
  audioUpdate(rdt) {
    if (!Sound.ready) return;
    const p = this.player;
    if (p && Cam.mode === 'fp') Sound.setWind(p.vel.length(), p.roll + p.extraRoll * 0.2, Render.post.fx.cloudFog);
    else Sound.setWind(this.state === 'finisher' ? 30 : 10, 0);
    let hum = 0, pitch = 1;
    if (p) for (const b of this.bludgers) {
      if (b.state !== 'struck' || b.byside === p.side) continue;
      const d = b.pos.distanceTo(p.pos); const closing = -_v1.subVectors(b.pos, p.pos).normalize().dot(_v2.subVectors(b.vel, p.vel)) / 40;
      const l = clamp(1 - d / 45, 0, 1); if (l > hum) { hum = l; pitch = 1 + clamp(closing, -0.5, 0.8) * 0.4; }
    }
    Sound.setHum(hum, pitch);
    if (Sound.music) {
      let lvl = 0.3;
      if (p && p.hasBall) { lvl = 0.5; const h = this.targetHoop(); if (h && h.pos.distanceTo(p.pos) < 40) lvl = 0.8; }
      if (this.snitchReleased && p && p.role === 'seeker') lvl = 0.85;
      if (Math.abs(lvl - (this.musicLvl || 0)) > 0.05) { this.musicLvl = lvl; Sound.music.setLevel(lvl); }
    }
  },
};
