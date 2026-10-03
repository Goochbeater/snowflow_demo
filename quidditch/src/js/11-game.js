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
    for (const f of this.flyers) { Render.scene.remove(f.mesh); const r = f.mesh.userData.rider; if (r.geometry) r.geometry.dispose(); }
    Robes.clear();
    this.flyers = []; this.teams = [[], []]; this.player = null; this.lock = null; this.lunge = null; this.focus = 0;
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
      if (mode === 'slab' && role !== 'seeker') continue;
      const f = new Flyer(side, this.houses[side], role, slot);
      this.flyers.push(f); this.teams[side].push(f);
    }
    if (mode !== 'demo') { this.player = this.teams[0][0]; this.player.isPlayer = true; }
    if (this.vm) Render.camera.remove(this.vm.group);
    this.vm = mode === 'demo' ? null : Models.viewmodel(this.houses[0]);
    if (this.vm) Render.camera.add(this.vm.group);
    const Q = this.quaffle; Q.holder = null; Q.state = 'free'; Q.trail.reset(); Q.trail.active = false;
    for (const b of this.bludgers) { b.mesh.visible = mode !== 'lab' && mode !== 'slab'; b.state = 'roam'; b.trail.reset(); b.trail.active = false; b.vel.set(0, 0, 0); }
    Q.mesh.visible = mode !== 'slab'; Q.hidden = mode === 'slab'; Q.retTo = null;
    this.restart = null;
    this.focusOn = Settings.ballFocus !== 'off';
    Cam.showVM = false; Cam.vmOverride = null;
    this.bludgers[0].pos.set(-4, 10, 6); this.bludgers[1].pos.set(4, 10, -6);
    this.snitch.hide();
    this.kickoff();
    Cam.mode = mode === 'demo' ? 'orbit' : 'fp'; Cam.shotT = 0;
    if (mode === 'match') { this.state = 'countdown'; this.countT = 3.2; this.countShown = 4; }
    else { this.state = 'play'; if (mode === 'lab') this.labReset(); if (mode === 'slab') this.slabReset(); }
    World.excite.fill(0);
    this.vmLinit = false;
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

  slabReset() {
    const p = this.player, S = this.snitch;
    this.quaffle.state = 'scripted'; this.quaffle.pos.set(0, -50, 0);
    S.release(); S.pos.copy(p.pos).addScaledVector(p.fwd, 24).add(_v1.set(0, 2, 0));
    this.focus = 1; HUD.setShootLabel('GRAB');
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
      RiderAnim.frame++; for (const f of this.flyers) RiderAnim.update(f, rdt);
      this.quaffle.update(0);
      this.updateViewmodel(rdt);
      return;
    }
    if (this.state === 'finisher') Finishers.update(rdt);
    if (this.state === 'play') { this.updateClock(dt); this.updateRestart(dt); }
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
    RiderAnim.frame++; for (const f of this.flyers) RiderAnim.update(f, dt);
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
    if (Settings.ballFocus === 'always') this.focusOn = true; else if (Settings.ballFocus === 'off') this.focusOn = false;
    this.updateLock();
    if (!this.focusSteer(p)) this.steerAssist(p);
    this.updateLunge(rdt * this.curTs);
  },

  // ---------- interactions ----------
  interactions(dt) {
    const Q = this.quaffle;
    if (Q.state === 'flying' || Q.state === 'free') { this.checkGoal(); if (!Q.holder && (Q.state === 'flying' || Q.state === 'free')) this.checkCatch(); }
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
      if (f.role === 'keeper') reach = hostileShot ? this.diff.keeperReach * (Q.perfect ? 0.55 : 1) + (Q.thrower && !Q.thrower.isPlayer ? 0.6 : 0) : 2.2;
      if (f.isPlayer) reach = 2.9;
      _v1.copy(f.pos).addScaledVector(f.up, 0.35);
      if (_v1.distanceTo(Q.pos) > reach) continue;
      if (f.isPlayer) { _v2.subVectors(Q.pos, f.pos); if (_v2.dot(f.fwd) < -1.0) continue; this.catchBy(f); return; }
      if (Q.passTarget === f || Q.state === 'free') { this.catchBy(f); return; }
      if (!Q.rolled) Q.rolled = new Set();
      if (Q.rolled.has(f.id)) continue;
      Q.rolled.add(f.id);
      let p = f.role === 'keeper' ? 0.9 : hostileShot ? 0.32 * this.diff.aim : 0.85;
      if (f.role === 'keeper' && hostileShot) {
        const range = Q.thrower ? Q.thrower.pos.distanceTo(f.pos) : 30;
        p = Math.min(0.85, this.diff.keeperSave * (Q.perfect ? 0.45 : 1) * (range < 16 ? 0.75 : 1) * (Q.thrower && Q.thrower.isPlayer ? 1 : 1.6));
      }
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
    if (this.mode === 'lab') this.after(1.2, () => { if (this.mode === 'lab' && this.state === 'play') this.labReset(); });
    else this.restartHold(k, 1.4);
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
    if (this.restart && from === this.restart.keeper) this.restart = null;
    from.hand(_v1);
    const dist = _v1.distanceTo(to.pos), sp = clamp(dist * 0.85, CONFIG.ball.pass, 46);
    const t = clamp(dist / sp, 0.1, 2);
    _v2.copy(to.pos).addScaledVector(to.vel, t * (to.isPlayer ? 0.9 : 0.6)).addScaledVector(UP, 0.3);
    this.ballistic(_v1, _v2, sp, _v3);
    Q.release(_v3, to); Q.rolled = null;
    if (from.isPlayer) { Sound.play('throw'); this.throwAnim = 0.3; this.lastPlayerPassT = this.time; Platform.vibrate(12); }
    else if (Render.camera.position.distanceTo(from.pos) < 30) Sound.play('throw', { vol: 0.4 });
  },
  aiShoot(f, hoop) {
    const err = (1 - this.diff.aim) * 5.2;
    _v4.copy(hoop.pos).add(_v5.set(0, rnd(-err, err), rnd(-err, err)));
    f.hand(_v1); this.ballistic(_v1, _v4, 38, _v3);
    this.quaffle.release(_v3, null); this.quaffle.rolled = null;
    if (Render.camera.position.distanceTo(f.pos) < 40) Sound.play('throw', { vol: 0.6 });
  },
  targetHoop(p = this.player) {
    if (!p) return null;
    const sx = this.attackSign(p.side), k = this.keeper(1 - p.side), cone = Math.cos(this.assistCone()); let best = null, bs = -1e9, cur = -1e9;
    for (const h of World.hoops) {
      if (h.side !== sx) continue;
      const tv = this._tv || (this._tv = new THREE.Vector3());
      tv.subVectors(h.pos, p.pos).normalize();
      const kd = k ? Math.min(k.pos.distanceTo(h.pos), 8) : 6, dot = tv.dot(p.fwd);
      const sc = dot * 4 + (dot > cone ? 3 + kd * 0.35 : 0);
      if (h === this.tgtHoop) cur = sc;
      if (sc > bs) { bs = sc; best = h; }
    }
    if (this.tgtHoop && this.tgtHoop.side === sx && bs - cur < 0.35) return this.tgtHoop; // sticky target, no flicker
    this.tgtHoop = best; return best;
  },
  assistCone() { const l = Settings.aimAssist; return (l === 'off' ? 0 : l === 'low' ? 14 : l === 'high' ? 36 : lerp(22, 36, this.diff.assist)) * DEG; },
  shotLinedUp() {
    const p = this.player, h = this.targetHoop(p); if (!h || !p.hasBall) return false;
    _v1.subVectors(h.pos, p.pos); const d = _v1.length();
    return d < 62 && Math.acos(clamp(_v1.divideScalar(d).dot(p.fwd), -1, 1)) < this.assistCone();
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
    if (!p || !p.hasBall || this.flair < CONFIG.finisherCost - 1e-4 || this.state !== 'play' || p.role !== 'chaser') return false;
    const h = this.targetHoop(); if (!h) return false;
    const d = h.pos.distanceTo(p.pos); if (d > 85) return false;
    _v1.subVectors(h.pos, p.pos).normalize(); return _v1.dot(p.fwd) > 0.3;
  },
  seekerFinisherReady() {
    const p = this.player, S = this.snitch;
    if (!p || p.role !== 'seeker' || !S.active || this.focus < CONFIG.finisherCost - 1e-4 || this.state !== 'play') return false;
    _v1.subVectors(S.pos, p.pos); const d = _v1.length();
    return d < 30 && _v1.divideScalar(d).dot(p.fwd) > 0.3;
  },
  onShootDown() { if (this.player && this.player.role === 'seeker') this.grabbing = true; },
  onShootUp(charge, gesture) {
    const p = this.player; if (!p || this.state !== 'play') return;
    const allow = Settings.finisherLen !== 'off';
    if (p.role === 'seeker') {
      this.grabbing = false;
      if (allow && this.seekerFinisherReady() && (gesture || charge > CONFIG.ball.charge * 1.25)) { Finishers.trigger(gesture, true); return; }
      this.tryGrab(); return;
    }
    if (!p.hasBall) { this.tryPlayerSteal(); return; }
    if (allow && this.finisherReady() && (gesture || charge > CONFIG.ball.charge * 1.25)) { Finishers.trigger(gesture); return; }
    this.playerShoot(charge);
  },
  playerShoot(charge) {
    const p = this.player, Q = this.quaffle;
    const frac = clamp(charge / CONFIG.ball.charge, 0, 1);
    const perfect = frac >= 0.68 && frac <= 0.94;
    const speed = lerp(CONFIG.ball.shotMin, CONFIG.ball.shotMax, frac) * (perfect ? 1.08 : 1);
    const h = this.targetHoop();
    p.hand(_v1);
    const T = 0.7;
    _v3.copy(p.fwd).multiplyScalar(speed); _v3.y += 0.5 * CONFIG.ball.g * T;
    if (h) {
      _v2.subVectors(h.pos, _v1); const dist = _v2.length(); _v2.divideScalar(dist);
      const ang = Math.acos(clamp(_v2.dot(p.fwd), -1, 1)), cone = this.assistCone();
      if (ang < cone && dist < 62) {
        // aim at the part of the ring the Keeper is furthest from
        const aim = _v5.copy(h.pos), k = this.keeper(1 - p.side);
        if (k) { _v6.subVectors(h.pos, k.pos); _v6.x = 0; const l = _v6.length(); if (l > 0.05 && l < 6) aim.addScaledVector(_v6.divideScalar(l), 0.85); }
        this.ballistic(_v1, aim, speed, _v4);
        _v3.copy(_v4);
      }
    }
    Q.release(_v3, null); Q.rolled = null; Q.perfect = perfect;
    this.stats.shots++; this.throwAnim = 0.3;
    Sound.play('throw'); Platform.vibrate(15); Cam.addShake(0.12);
    if (perfect) { this.styleEvent('PERFECT RELEASE', 0.08, 120); Sound.play('perfect', { vol: 0.5 }); }
  },
  onPassTap() {
    const p = this.player; if (!p || this.state !== 'play') return;
    Input.tapT = this.rtime;
    if (p.role !== 'chaser') return;
    if (!p.hasBall) {
      const c = this.quaffle.holder;
      if (c && c.side === p.side && c !== p) this.callForPass(c); else Input.callT = this.rtime;
      return;
    }
    if (this.finisherReady() && Settings.finisherLen !== 'off') {
      this.passTaps = (this.passTaps || []).filter(t => this.rtime - t < 0.6); this.passTaps.push(this.rtime);
      if (this.passTaps.length >= 3 && Finishers.hawksheadOK()) { this.passTaps = []; clearTimeout(this.passTimer); Finishers.trigger('hawkshead'); return; }
      clearTimeout(this.passTimer);
      this.passTimer = setTimeout(() => { if (this.player && this.player.hasBall && this.state === 'play') { this.passTaps = []; const m = this.passTarget(); if (m) this.pass(this.player, m); } }, 280);
      return;
    }
    const m = this.passTarget(); if (m) this.pass(p, m);
  },
  // NBA 2K-style call for the ball: the teammate in possession passes to you after a beat
  callForPass(c) {
    this.calls = (this.calls || []).filter(t => this.rtime - t < 4); this.calls.push(this.rtime);
    if (this.calls.length > 3) { if (this.rtime - (this.ignoreMsgT || -9) > 2.5) { HUD.popup('CALL IGNORED', true); this.ignoreMsgT = this.rtime; } return; }
    if (this.callPending) return;
    this.callPending = true; Input.callT = this.rtime; c.ai.passingT = this.rtime;
    HUD.popup('CALLING FOR IT'); Sound.play('ui');
    const R = this.restart, kd = R && R.keeper === c ? Math.max(0.35, R.t - 1.4) : 0;
    this.after(kd + (c.role === 'keeper' ? 0.3 : 0.16) + Math.random() * 0.14, () => {
      this.callPending = false;
      const p = this.player;
      if (this.state === 'play' && p && this.quaffle.holder === c && c.stun <= 0 && !c.scripted) { this.pass(c, p); c.ai.cool = 1.5; this.calls = []; }
    });
  },
  onSwipe(dir) {
    const p = this.player; if (!p || this.state !== 'play') return;
    if (p.startDodge(dir)) { Sound.play('dodge'); Platform.vibrate(10); }
  },
  // lock-on: carrier when defending, the loose Quaffle, or the Snitch when you're the Seeker
  updateLock() {
    const p = this.player;
    if (!p || p.scripted || this.state !== 'play') { this.lock = null; return; }
    const Q = this.quaffle;
    let cand = null;
    if (p.role === 'seeker') cand = this.snitch.active ? this.snitch : null;
    else if (!p.hasBall) cand = Q.holder ? (Q.holder.side !== p.side && !(this.restart && this.restart.keeper === Q.holder) ? Q.holder : null) : (Q.state === 'flying' || Q.state === 'free' ? Q : null);
    if (!cand) { this.lock = null; return; }
    _v1.subVectors(cand.pos, p.pos); const d = _v1.length(), dot = _v1.divideScalar(Math.max(d, 1e-3)).dot(p.fwd);
    if (this.lock === cand) { if (d > 115 || dot < 0.05) this.lock = null; }
    else if (d < 85 && dot > 0.55) { this.lock = cand; this.lockT = this.rtime; }
    else if (this.lock && this.lock !== cand) this.lock = null;
  },
  steerAssist(p) {
    const t = this.lock, lvl = Settings.trackAssist;
    if (!t || lvl === 'off' || p.dodge || this.lunge) return;
    const str = lvl === 'low' ? 0.4 : 0.78;
    const d = t.pos.distanceTo(p.pos);
    _v2.copy(t.pos).addScaledVector(t.vel, clamp(d / 45, 0, 0.7)).sub(p.pos);
    const [ty, tp] = yawPitchFromDir(_v2);
    const dy = wrapAngle(ty - p.yaw), dp = tp - p.pitch;
    const k = str * (1 - Math.min(1, Math.hypot(Input.steer.x, Input.steer.y)) * 0.55);
    p.input.x = clamp(p.input.x + clamp(-dy * 2.4, -1, 1) * k, -1, 1);
    p.input.y = clamp(p.input.y + clamp(dp * 2.6, -1, 1) * k, -1, 1);
    if (t !== this.quaffle && d < 32) p.speedMul = 1.07;
  },
  // ---------- restarts: Keeper throw-in after goals and saves ----------
  beginRestart(k, delay = 1.0) {
    const Q = this.quaffle; if (!k) return;
    const id = this.restartId = (this.restartId || 0) + 1;
    this.restart = { keeper: k, side: k.side, phase: 'return', t: 99, id };
    this.after(delay, () => {
      const R = this.restart; if (!R || R.id !== id || this.state === 'end') return;
      if (Q.holder === k) { this.onReturned(k); return; }
      if (!Q.holder) { Q.state = 'returning'; Q.retTo = k; Q.trail.active = false; }
      else this.restart = null;
    });
  },
  restartHold(k, t) {
    this.restart = { keeper: k, side: k.side, phase: 'hold', t };
  },
  onReturned(k) {
    this.restartHold(k, 2.2);
    const own = this.player && this.player.side === k.side && this.player.role === 'chaser';
    HUD.ticker(own ? 'Keeper has it. Fly upfield and CALL for the throw-in.' : `${CONFIG.teams[this.houses[k.side]].name} Keeper restarts play.`);
    Sound.play('whistle', { dur: 0.22, vol: 0.5 });
  },
  updateRestart(dt) {
    const R = this.restart; if (!R || R.phase !== 'hold') return;
    if (this.quaffle.holder !== R.keeper) { this.restart = null; return; }
    if ((R.t -= dt) <= 0) this.throwIn(R.keeper);
  },
  throwIn(k) {
    const sx = this.attackSign(k.side), p = this.player;
    let tgt = null;
    if (p && p.side === k.side && p.role === 'chaser' && p.stun <= 0 && p.pos.distanceTo(k.pos) < 80) tgt = p;
    if (!tgt) {
      let bs = -1e9;
      for (const m of this.teams[k.side]) {
        if (m.role !== 'chaser' || m.stun > 0 || m.scripted) continue;
        let crowd = 99; for (const o of this.teams[1 - k.side]) crowd = Math.min(crowd, o.pos.distanceTo(m.pos));
        const s = (m.pos.x - k.pos.x) * sx * 0.3 + Math.min(crowd, 15) - Math.max(0, m.pos.distanceTo(k.pos) - 55);
        if (s > bs) { bs = s; tgt = m; }
      }
    }
    this.restart = null;
    if (tgt) { this.pass(k, tgt); if (tgt.isPlayer) HUD.popup('THROW-IN'); }
  },
  // ---------- ball focus: keeps your broom pointed at the play ----------
  toggleFocus() {
    this.focusOn = !this.focusOn; Sound.play('ui');
    HUD.popup(this.focusOn ? 'BALL FOCUS ON' : 'BALL FOCUS OFF'); Platform.vibrate(10);
  },
  focusTarget(p) {
    const Q = this.quaffle, out = this.focusPt || (this.focusPt = new THREE.Vector3()), R = this.restart;
    let kind = null;
    if (p.role === 'seeker') { if (this.snitch.active) { out.copy(this.snitch.pos).addScaledVector(this.snitch.vel, 0.25); kind = 'SNITCH'; } }
    else if (p.hasBall) { const h = this.targetHoop(p); if (h) { out.copy(h.pos); kind = 'HOOP'; } }
    else if (R && R.side === p.side) {
      // our Keeper is restarting: get into space upfield to receive the throw-in
      const sx = this.attackSign(p.side); out.set(R.keeper.pos.x + sx * 38, 14, clamp(p.pos.z, -18, 18)); kind = 'GET OPEN';
    } else if (R) { out.set(0, 14, clamp(p.pos.z, -20, 20)); kind = 'REGROUP'; }
    else if (!Q.holder) { if (Q.state === 'flying' || Q.state === 'free') { out.copy(Q.pos).addScaledVector(Q.vel, 0.3); kind = 'QUAFFLE'; } }
    else if (Q.holder.side !== p.side) { out.copy(Q.holder.pos).addScaledVector(Q.holder.vel, 0.3); kind = 'CARRIER'; }
    else {
      const c = Q.holder, sx = this.attackSign(p.side);
      out.set(c.pos.x + sx * 16, c.pos.y + 1, c.pos.z + (p.pos.z > c.pos.z ? 9 : -9)); kind = 'SUPPORT';
    }
    this.focusKind = kind;
    return kind ? out : null;
  },
  focusSteer(p) {
    this.focusKind = null;
    if (!this.focusOn || Settings.ballFocus === 'off' || p.dodge || this.lunge) return false;
    const T = this.focusTarget(p); if (!T) return false;
    _v2.subVectors(T, p.pos); const d = _v2.length();
    if (d < 2.5) return true;
    const [ty, tp] = yawPitchFromDir(_v2);
    const dy = wrapAngle(ty - p.yaw), dp = clamp(tp, -0.9, 0.9) - p.pitch;
    const stick = Math.min(1, Math.hypot(Input.steer.x, Input.steer.y));
    const k = stick > 0.35 ? 0.35 : 0.95;
    p.input.x = clamp(p.input.x * (1 - k * 0.6) + clamp(-dy * 3, -1, 1) * k, -1, 1);
    p.input.y = clamp(p.input.y * (1 - k * 0.6) + clamp(dp * 3, -1, 1) * k, -1, 1);
    if (Math.abs(dy) > 1.2 && d > 10) p.turnMul = 1.75; // swing round quickly instead of circling
    return true;
  },
  tryPlayerSteal() {
    const p = this.player, Q = this.quaffle;
    if (this.stealCd > 0 || this.lunge) return;
    const c = Q.holder;
    if (this.restart && (c === this.restart.keeper || !c)) { if (this.rtime - (this.stealMsgT || -9) > 2.5) { HUD.popup("KEEPER'S RESTART", true); this.stealMsgT = this.rtime; } return; }
    this.stealCd = 0.9; this.throwAnim = 0.25;
    if (c && c.side !== p.side) {
      _v1.subVectors(c.pos, p.pos); const d = _v1.length();
      if (d < 13 && _v1.divideScalar(d).dot(p.fwd) > 0.3) {
        this.lunge = { c, t: 0 }; Sound.play('boost', { vol: 0.6 }); Platform.vibrate(15); Cam.addShake(0.25);
        if (!c.isPlayer && d < 7 && Math.random() < this.diff.aim * 0.15) c.startDodge(Math.random() < 0.5 ? 'left' : 'right');
        return;
      }
    }
    p.speed += 5; Sound.play('whoosh', { vol: 0.4 });
    if (c && c.side !== p.side && this.rtime - (this.stealMsgT || -9) > 3) { HUD.popup('GET CLOSER', true); this.stealMsgT = this.rtime; }
  },
  updateLunge(dt) {
    const L = this.lunge, p = this.player; if (!L) { if (p) p.lungeV = null; return; }
    const c = L.c, Q = this.quaffle;
    L.t += dt;
    if (Q.holder !== c || L.t > 0.75 || this.state !== 'play') { this.lunge = null; p.lungeV = null; if (Q.holder === c && this.state === 'play') HUD.popup('MISSED', true); return; }
    _v1.subVectors(c.pos, p.pos).addScaledVector(c.vel, 0.1); const d = _v1.length();
    p.input.x = 0; p.input.y = 0; p.lookDir(_v1, 18, dt);
    p.lungeV = (p.lungeV || new THREE.Vector3()).copy(_v1).divideScalar(Math.max(d, 1e-3)).multiplyScalar(Math.max(48, c.vel.length() + 20));
    p.speed = 46;
    if (d < 3.2) {
      this.lunge = null; p.lungeV = null; p.speed = 30;
      const dodged = c.dodge && c.dodge.t > 0.05;
      const ok = !dodged && Math.random() < clamp(0.86 + (p.boosting ? 0.08 : 0) - (c.role === 'keeper' ? 0.2 : 0), 0.1, 0.97);
      if (ok) this.steal(p, c); else { HUD.popup(dodged ? 'DODGED' : 'SHRUGGED OFF', true); Sound.play('thud'); Cam.addShake(0.4); p.speed = 18; }
    }
  },
  tryGrab() {
    const p = this.player, S = this.snitch;
    if (!S.active) return;
    _v1.subVectors(S.pos, p.pos); const d = _v1.length();
    if (d < 3.0 && _v1.divideScalar(d).dot(p.fwd) > 0.5) { this.catchSnitch(p); return; }
    Sound.play('whoosh', { vol: 0.4 });
    if (this.rtime - (this.grabMsgT || -9) > 4) { this.grabMsgT = this.rtime; HUD.popup(d < 8 ? 'ALMOST · FLY THROUGH ITS RINGS' : 'CLOSE IN FIRST', true); }
  },
  // golden rings trail the Snitch (Quidditch Champions style): each one fills focus and boost
  updateSnitchRings(rdt) {
    const p = this.player, S = this.snitch;
    this.focus = Math.max(0, (this.focus || 0) - rdt * 0.012);
    if (!p || p.role !== 'seeker' || !S.active) return;
    if (p.pos.distanceTo(S.pos) < 12) this.focus = Math.min(1, this.focus + rdt * 0.04);
    for (const r of S.rings) {
      if (!r.visible || r.userData.passed) continue;
      const n = _v1.set(0, 0, 1).applyQuaternion(r.quaternion);
      const a = _v2.subVectors(p.prev, r.position).dot(n), b = _v3.subVectors(p.pos, r.position).dot(n);
      if (a * b > 0) continue;
      _v4.subVectors(p.pos, r.position).addScaledVector(n, -b);
      if (_v4.length() > 2.3 * r.scale.x) continue;
      r.userData.passed = true;
      const was = this.focus;
      this.focus = Math.min(1, this.focus + 0.15); p.boost = Math.min(1, p.boost + 0.3); p.speed += 7;
      this.ringCombo = this.rtime - (this.ringT || -9) < 3 ? (this.ringCombo || 0) + 1 : 1; this.ringT = this.rtime;
      FX.ring(r.position, linCol(3, 2.2, 0.8), 6, 0.45); Sound.play('ring', { vol: 0.8 }); Platform.vibrate(12);
      HUD.popup('RING ×' + this.ringCombo);
      if (was < CONFIG.finisherCost && this.focus >= CONFIG.finisherCost) { Sound.play('ready'); HUD.hint('CATCH READY · HOLD GRAB + SWIPE', 3); Platform.vibrate([20, 40, 20]); }
    }
  },

  // ---------- events ----------
  goal(side, hoop, info) {
    this.score[side] += 10;
    const Q = this.quaffle, scorer = info.scorer || Q.thrower;
    if (!info.finisher) { Q.state = 'dead'; Q.vel.multiplyScalar(0.3); Q.trail.active = false; Q.holder = null; Q.passTarget = null; }
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
    else if (k) this.beginRestart(k, 1.0);
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
    s.isPlayer = true; s.mesh.visible = false; s.boost = 1; this.player = s; this.swapT = 0; this.focus = 0.15; HUD.swap(false);
    HUD.ticker('You are the Seeker. Fly through the golden rings to build focus.'); HUD.setShootLabel('GRAB');
    Sound.play('rise', { vol: 0.6 }); Platform.vibrate(20);
  },
  catchSnitch(f, info = {}) {
    if (this.state !== 'play' && this.state !== 'finisher') return;
    const val = Settings.snitch === 'classic' ? 150 : 30;
    this.snitch.hide();
    const T = CONFIG.teams[this.houses[f.side]];
    if (this.mode === 'slab') {
      if (!info.finisher) { HUD.banner('SNITCH CAUGHT', 'AGAIN?'); Sound.play('snitch'); this.styleEvent(null, 0, 600); }
      this.after(1.6, () => { if (this.mode === 'slab' && this.state === 'play') this.slabReset(); });
      return;
    }
    this.score[f.side] += val;
    if (f.isPlayer) { this.stats.snitch = true; if (!info.finisher) { this.styleEvent('SNITCH CAUGHT', 0, 1500); Platform.vibrate([60, 40, 60, 40, 160]); this.hitStop = 0.12; FX.star(f.pos, linCol(4, 3, 1), 3, 0.8); } }
    if (!info.finisher) HUD.banner('SNITCH CAUGHT', `${T.name.toUpperCase()} +${val}`);
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
    const wasReady = this.flair >= CONFIG.finisherCost;
    this.flair = Math.min(1, this.flair + flair);
    this.style.val = Math.min(6.2, this.style.val + points / 170);
    this.style.lastT = this.rtime;
    this.style.score += Math.round(points * (1 + Math.floor(this.style.val) * 0.25));
    if (label) HUD.popup(label);
    if (!wasReady && this.flair >= CONFIG.finisherCost && this.mode === 'match') { Sound.play('ready'); Platform.vibrate([20, 40, 20]); HUD.hint('FINISHER READY · HOLD SHOOT + SWIPE', 3); }
  },
  styleUpdate(rdt) {
    if (this.rtime - this.style.lastT > 3) this.style.val = Math.max(0, this.style.val - rdt * 0.14);
    const r = Math.min(5, Math.floor(this.style.val));
    if (r !== this.style.rank) { if (r > this.style.rank) { Sound.play('rank', { vol: 0.7 }); } this.style.rank = r; HUD.rank(r); }
    if (this.stats) this.stats.bestRank = Math.max(this.stats.bestRank, r);
    if (this.mode === 'lab') this.flair = 1;
    if (this.mode === 'slab') this.focus = 1;
  },

  // ---------- feel ----------
  updatePlayerFeel(rdt, dt) {
    const p = this.player, fx = Render.post.fx;
    if (this.stats) this.stats.topSpeed = Math.max(this.stats.topSpeed, p.vel.length());
    if (this.state === 'play') this.updateSnitchRings(rdt);
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
    vm.group.visible = (Cam.mode === 'fp' || Cam.showVM) && !!p;
    if (!vm.group.visible) return;
    const ov = Cam.vmOverride;
    this.vmSway.x = damp(this.vmSway.x, -p.input.x * 0.035, 6, rdt);
    this.vmSway.y = damp(this.vmSway.y, -p.input.y * 0.03 + (p.stun > 0 ? Math.sin(this.rtime * 20) * 0.02 : 0), 6, rdt);
    const bob = Math.sin(this.rtime * 7.3) * 0.006 * (p.speed / 22);
    const drop = clamp(-(Math.tan(Render.camera.fov * DEG / 2) - 0.5) * 0.62, -0.26, 0.06);
    vm.group.position.set(this.vmSway.x, this.vmSway.y + bob + drop, p.boosting ? 0.06 : 0);
    const onBroom = !(ov && ov.offBroom);
    vm.shaft.visible = onBroom;
    vm.gripL = vm.gripL || vm.shaftAt(-0.8); vm.gripR = vm.gripR || vm.shaftAt(-0.57);
    let st = 'grip';
    const tgt = _v1.copy(vm.gripR);
    if (p.hasBall) { st = 'hold'; tgt.set(0.33, -0.2, -0.7); }
    if (Input.shootHeld && p.hasBall) tgt.lerp(_v2.set(0.34, -0.1, -0.52), easeOut(clamp((this.rtime - Input.shootT) / CONFIG.ball.charge, 0, 1)));
    if (Input.shootHeld && p.role === 'seeker') { st = 'open'; tgt.set(0.1, -0.1, -1.0); }
    if (this.throwAnim > 0) { this.throwAnim -= rdt; st = 'open'; tgt.set(0.06, -0.13, -0.95); }
    if (this.catchAnim > 0) { this.catchAnim -= rdt; st = 'open'; tgt.set(0.24, -0.13, -0.8); }
    if (ov && ov.right) { st = ov.right.state; tgt.copy(ov.right.pos); }
    this.vmHand.lerp(tgt, 1 - Math.exp(-(this.throwAnim > 0 ? 30 : 14) * rdt));
    const K = _v5, N = _v6;
    if (st === 'grip') { K.copy(vm.S); N.set(0.55, 0.83, 0); }
    else if (st === 'hold') { K.set(-1, 0, 0.2); N.set(0.1, -0.95, 0.3); }
    else { K.set(1, 0, 0.1); N.set(0, 0.35, 1); }
    this.vmL = this.vmL || new THREE.Vector3(); this.vmWR = this.vmWR || new THREE.Vector3(); this.vmWL = this.vmWL || new THREE.Vector3();
    const lst = onBroom ? 'grip' : ov.left ? ov.left.state : 'open';
    this.vmL.lerp(onBroom ? vm.gripL : ov.left ? ov.left.pos : _v2.set(-0.32, -0.16, -0.75), 1 - Math.exp(-14 * rdt));
    if (!this.vmLinit) { this.vmLinit = true; this.vmL.copy(vm.gripL); this.vmHand.copy(vm.gripR); }
    const kr = 1 - Math.exp(-18 * rdt);
    if (vm.hr) {
      Hands.pose(vm.hr, st, 1 - Math.exp(-16 * rdt));
      Hands.place(vm.hr, this.vmHand, K, N, kr);
      Hands.pose(vm.hl, lst, 1 - Math.exp(-16 * rdt));
      if (lst === 'grip') { K.copy(vm.S); N.set(-0.55, 0.83, 0); } else { K.set(-1, 0, 0.1); N.set(0, 0.35, 1); }
      Hands.place(vm.hl, this.vmL, K, N, kr);
      this.vmWR.copy(vm.hr.wrist).applyQuaternion(vm.hr.root.quaternion).add(vm.hr.root.position);
      this.vmWL.copy(vm.hl.wrist).applyQuaternion(vm.hl.root.quaternion).add(vm.hl.root.position);
    } else {
      vm.rGlove.position.copy(this.vmHand); vm.lGlove.position.copy(this.vmL);
      this.vmWR.copy(this.vmHand); this.vmWL.copy(this.vmL);
    }
    for (const [arm, sh, w] of [[vm.rArm, vm.shoulder, this.vmWR], [vm.lArm, vm.lShoulder, this.vmWL]]) {
      _v2.subVectors(w, sh); const len = _v2.length();
      arm.position.copy(sh); arm.quaternion.setFromUnitVectors(_v3.set(0, 0, 1), _v2.divideScalar(len)); arm.scale.set(1, 1, len / 0.9);
    }
    vm.ball.visible = p.hasBall;
    if (p.hasBall) { vm.ball.position.copy(this.vmHand).add(_v2.set(0.0, 0.085, -0.02)); vm.ball.rotation.y += rdt * 0.5; }
    vm.snitch.visible = !!(ov && ov.snitchInHand);
    if (vm.snitch.visible) { vm.snitch.position.copy(this.vmHand).add(_v2.set(0.0, 0.055, -0.02)); const f = Math.sin(this.rtime * 50) * 0.8; vm.snitch.userData.wl.rotation.z = f; vm.snitch.userData.wr.rotation.z = -f; }
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
