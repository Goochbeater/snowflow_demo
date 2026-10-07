/* ==== p54_or_foes.js ==== */
/* OPUS RING — the denizens of Limgrave and Stormveil. Foe: an Enemy that idles until it notices you, fights with
   telegraphed mocap strikes, has poise, keeps to its post (leash) and drops runes. Lord: a great enemy — no guard to
   break, only poise; long delayed combos, leaps, shockwaves, thrown light and fire. */
Object.assign(ENEMY.TYPES, {
  noble: { tpl: 'noble', hp: 34, brain: 'melee', moves: 'soldier', weapon: 'staff', staffKind: 'torch', dmg: 9, speed: 2.5, name: 'Wandering Noble', atk: 'AB', runes: 42, sight: 11, reach: 1.9, cd: [1.6, 3.0] },
  soldier: { tpl: 'soldier', hp: 68, brain: 'melee', moves: 'shieldman', weapon: 'staff', staffKind: 'sword', sh: 'heater', dmg: 15, speed: 3.3, name: 'Godrick Soldier', atk: 'ABC', runes: 96, blocks: 0.3, reach: 2.2 },
  footman: { tpl: 'footman', hp: 60, brain: 'melee', moves: 'soldier', weapon: 'staff', staffKind: 'spear', dmg: 16, speed: 3.2, name: 'Godrick Footman', atk: 'CCB', runes: 90, reach: 2.9 },
  archer: { tpl: 'footman', hp: 46, brain: 'gunner', moves: 'trooper', weapon: 'crossbow', dmg: 13, burst: 1, acc: 0.035, range: [9, 20], speed: 2.6, name: 'Godrick Crossbowman', runes: 84, col: [0.4, 0.3, 0.2], arrow: true, sight: 24 },
  knight: { tpl: 'knight', scale: 1.1, hp: 210, brain: 'melee', moves: 'soldier', weapon: 'staff', staffKind: 'greatsword', dmg: 27, speed: 3.0, name: 'Godrick Knight', atk: 'ABD', runes: 420, poise: 46, reach: 2.9, r: 0.38, h: 2.0, elite: true, cd: [0.9, 1.9], combo: 0.4 },
  exile: { tpl: 'exile', hp: 84, brain: 'melee', moves: 'soldier', weapon: 'staff', staffKind: 'halberd', dmg: 18, speed: 3.4, name: 'Exile Soldier', atk: 'ACD', runes: 160, reach: 3.0, poise: 12 },
  exileSword: { tpl: 'exile', hp: 78, brain: 'melee', moves: 'shieldman', weapon: 'staff', staffKind: 'sword', sh: 'round', dmg: 17, speed: 3.6, name: 'Exile Soldier', atk: 'ABC', runes: 150, blocks: 0.35, reach: 2.2 },
  exileBow: { tpl: 'exile', hp: 60, brain: 'gunner', moves: 'trooper', weapon: 'crossbow', dmg: 15, burst: 1, acc: 0.03, range: [10, 22], speed: 2.6, name: 'Exile Crossbowman', runes: 140, col: [0.4, 0.3, 0.2], arrow: true, sight: 26 },
  banished: { tpl: 'banished', scale: 1.14, hp: 290, brain: 'melee', moves: 'soldier', weapon: 'staff', staffKind: 'greatsword', dmg: 31, speed: 3.2, name: 'Banished Knight', atk: 'ABCD', runes: 940, poise: 64, reach: 3.0, r: 0.4, h: 2.05, elite: true, cd: [0.7, 1.6], combo: 0.55 },
  troll: { tpl: 'troll', scale: 2.6, hp: 460, brain: 'melee', moves: 'soldier', weapon: 'staff', staffKind: 'club', dmg: 34, speed: 4.2, name: 'Troll', atk: 'AD', runes: 1100, poise: 150, reach: 5.6, r: 1.0, h: 4.6, elite: true, cd: [1.4, 2.6], quake: 4.2, sight: 26 },
});
class Foe extends Enemy {
  constructor(type, o) {
    super(type, o);
    const D = this.D, k = D.scale || 1;
    if (k !== 1) { this.inst.root.scale.setScalar(k); this.inst.scale = k; }
    this.inst.symProp = false; this.home = [this.x, this.z]; this.homeYaw = this.yaw;
    this.poise = D.poise || 0; this.noExec = true; this.runes = D.runes || 0; this.reach = D.reach || 2.2; this.step = 0.45 * Math.max(1, k * 0.8);
    this.edgeGuard = true; this.isFoe = true;
    if (D.sh) { const s = WPN.shield(D.sh, D.tpl === 'exile' ? 0x3a2a20 : 0x7a1a14, D.tpl === 'exile' ? 0x6a6a64 : 0xc9a24a); this.inst.bones[7].add(s); WPN.strap(s); this.shieldMesh = s; }
    if (!this.alerted && this.moves.calm) this.base = 'calm';
    this.physics(0); this.animate(0.016); this.pose3D(0.016);
  }
  think(dt) {
    const P = this.P, D = this.D;
    if (this.passive || !P || !P.alive) { this.vx *= 0.8; this.vz *= 0.8; this.setBase(this.moves.calm ? 'calm' : 'idle'); return; }
    const d = this.dist(P), hd = Math.hypot(this.x - this.home[0], this.z - this.home[1]);
    if (!this.alerted) {
      if (this.patrol) { const tp = this.patrol[this.pi || 0]; this.steer(tp[0], tp[1], 1.25, dt); if (Math.hypot(tp[0] - this.x, tp[1] - this.z) < 0.6) this.pi = ((this.pi || 0) + 1) % this.patrol.length; if (this.speed > 0.2) this.yaw = dampA(this.yaw, Math.atan2(this.vx, this.vz), 4, dt); }
      else if (hd > 1.5) { this.steer(this.home[0], this.home[1], D.speed * 0.8, dt); this.yaw = dampA(this.yaw, Math.atan2(this.vx, this.vz), 5, dt); this.hp = Math.min(this.hpMax, this.hp + dt * this.hpMax * 0.2); }
      else { this.vx *= 0.8; this.vz *= 0.8; this.yaw = dampA(this.yaw, this.homeYaw, 2, dt); }
      this.setBase(this.speed > 0.4 ? 'run' : (this.moves.calm ? 'calm' : 'idle'));
      const s = D.sight || 15, front = Math.abs(wrapA(this.angTo(P) - this.yaw)) < 1.5;
      if ((d < s && front && this.seesPlayer(s)) || d < 4.2 || (d < s * 0.6 && P.speed > 5.5)) this.alert();
      return;
    }
    if (hd > (D.leash || 46) || d > 52) { this.alerted = false; COMBAT.freeToken('melee', this); COMBAT.freeToken('shoot', this); this.aimT = undefined; if (this.gun) this.gun.userData.glow.material.opacity = 0; return; }
    this.graceT -= dt;
    if (this.brain === 'gunner') { this.thinkGunner(dt, d); if (this.gun) this.gun.userData.glow.visible = false; }
    else this.thinkMelee(dt, d);
  }
  alert() { const was = this.alerted; super.alert(); if (!was && this.base === 'calm') this.setBase('idle'); }
  thinkMelee(dt, d) {
    const P = this.P, D = this.D, sc = D.scale || 1, a = this.act || '';
    const striking = a.startsWith('strike'), winding = a.startsWith('wind');
    this.yaw = dampA(this.yaw, this.angTo(P), striking ? 1.2 : winding ? 5 : 7, dt);
    if (winding || striking) { this.vx *= 0.82; this.vz *= 0.82; if (striking) this.strikeCheck(); return; }
    const has = COMBAT.tokens.melee.has(this), want = has ? this.reach * 0.72 : this.reach + 1.5;
    this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = -this.strafe; this.strafeT = rnd(1.2, 2.6); }
    const ax = (P.x - this.x) / (d || 1), az = (P.z - this.z) / (d || 1);
    let fx = 0, fz = 0; if (d > want + 0.3) { fx += ax; fz += az; } else if (d < want - 0.5) { fx -= ax * 0.6; fz -= az * 0.6; }
    if (!has) { fx += -az * this.strafe * 0.6; fz += ax * this.strafe * 0.6; }
    const L = Math.hypot(fx, fz), spd = L > 0.01 ? (d > this.reach + 3 ? D.speed * 1.25 : D.speed) : 0;
    this.vx = damp(this.vx, L ? fx / L * spd : 0, 6, dt); this.vz = damp(this.vz, L ? fz / L * spd : 0, 6, dt);
    this.setBase(this.speed > 1.2 ? 'run' : 'idle');
    this.atkCd = (this.atkCd === undefined ? rnd(0.4, 1.2) : this.atkCd) - dt;
    if (d < this.reach + 0.3 && this.graceT <= 0 && this.atkCd <= 0 && COMBAT.wantToken('melee', this, MG.difficulty === 'hard' ? 3 : 2)) this.beginAttack();
  }
  beginAttack(chain) { const L = this.D.atk || 'A'; this.atk = L[Math.floor(RNG() * L.length) % L.length]; this.play('wind' + this.atk, { fade: chain ? 0.14 : 0.1, speed: chain ? 1.35 : 1 }); this.telegraph = 0.55; this.didHit = false; }
  strikeCheck() {
    const P = this.P; if (!P || this.didHit) return;
    const W = Foe.WIN[this.atk] || Foe.WIN.A, t = this.actT;
    if (this.atk === 'C' && t < 0.2) this.moveH(Math.sin(this.yaw) * 5.5 * MG.dt, Math.cos(this.yaw) * 5.5 * MG.dt);   // the thrust lunges
    if (this.D.quake && this.atk === 'D' && t > 0.24 && !this.quaked) { this.quaked = true; const f = this.forward(V3()), p = V3(this.x + f.x * this.reach * 0.7, this.y + 0.05, this.z + f.z * this.reach * 0.7); LORD.shock(this, p, this.D.quake, this.D.dmg * 0.8); }
    if (t < W[0] || t > W[1]) return;
    const d = this.dist(P), ang = Math.abs(wrapA(this.angTo(P) - this.yaw));
    if (d < this.reach + 0.25 && ang < (this.atk === 'C' ? 0.55 : 1.0) && Math.abs(P.y - this.y) < 1.4 * (this.D.scale || 1)) {
      this.didHit = true; COMBAT.damage(P, this.D.dmg * W[2], { src: this, kind: 'melee', heavy: this.atk === 'D', knock: this.atk === 'D' && (this.D.scale || 1) > 1.5, dir: V3(P.x - this.x, 0, P.z - this.z).normalize() });
    }
  }
  actEnd(n) {
    if (n && n.startsWith('wind')) { this.play('strike' + this.atk, { fade: 0.02 }); this.quaked = false; return; }
    if (n && n.startsWith('strike')) {
      if (this.D.combo && RNG() < this.D.combo && this.P && this.P.alive && this.dist(this.P) < this.reach + 1.2 && !this.chained) { this.chained = true; this.beginAttack(true); return; }
      this.chained = false; COMBAT.freeToken('melee', this); const c = this.D.cd || [1.2, 2.4]; this.atkCd = rnd(c[0], c[1]);
    }
    if (this.state === 'stagger' || this.state === 'knock') this.setState('engage');
  }
  fireAt(P) {
    if (!this.D.arrow) return super.fireAt(P);
    const mz = this.gun.userData.muzzle.getWorldPosition(new THREE.Vector3()), tgt = P.chest(new THREE.Vector3());
    tgt.x += P.vx * 0.25; tgt.z += P.vz * 0.25;
    const sp = this.D.acc || 0.04, dir = tgt.sub(mz).normalize(); dir.x += rnd(-sp, sp); dir.y += rnd(-sp, sp) * 0.5 + 0.012; dir.z += rnd(-sp, sp); dir.normalize();
    COMBAT.fire(mz, dir, { shooter: this, team: 'foe', dmg: this.D.dmg, speed: 34, col: this.D.col, arrow: true });
  }
  tryBlock(atk, dmg, kind, p) {
    if (!this.alive || this.stunned || this.state === 'knock' || !this.D.blocks || !this.alerted) return false;
    if (this.act && (this.act.startsWith('strike') || this.act.startsWith('wind'))) return false;
    if (Math.abs(wrapA(this.angTo(atk) - this.yaw)) > 1.2) return false;
    const heavy = kind === 'slam' || kind === 'sweep' || kind === 'whirl' || kind === 'thrust' || kind === 'plunge';
    if (heavy || RNG() > this.D.blocks) return false;
    this.play('block', { fade: 0.03 }); this.setState('stagger'); FX.spark(p, V3(0, 1, 0), 10, 4, [3, 2.6, 1.8]); return true;
  }
  onDamage(amt, info) { this.lastAmt = amt; if (this.poise > 0 || this.D.poise) this.poise -= amt * (info.heavy ? 1.8 : 1); this.poiseT = 4; return amt; }
  onHit(info) {
    if (this.D.poise && this.poise > 0 && !info.knock) { this.alert(); this.flinch(info.dir, 0.9); return; }   // armoured: shrugs it off until its poise breaks
    if (this.D.poise) { this.poise = this.D.poise; info.knock = false; info.force = 0; if ((this.D.scale || 1) > 1.5) { this.alert(); COMBAT.freeToken('melee', this); this.stop(); this.stunned = true; this.play('stun', { fade: 0.08 }); this.setState('stun'); return; } }
    this.chained = false;
    super.onHit(info);
  }
  update(dt) { if (this.poiseT > 0) { this.poiseT -= dt; if (this.poiseT <= 0 && this.D.poise) this.poise = this.D.poise; } super.update(dt); }
}
Foe.WIN = { A: [0.05, 0.3, 1], B: [0.02, 0.24, 0.85], C: [0.02, 0.26, 1.05], D: [0.05, 0.3, 1.5] };

/* ------------------------------------------------------------------ great enemies */
const LORD = { DEFS: {} };
/* a shockwave across the ground: ring + dust; hurts the player inside the radius unless airborne or rolling */
LORD.shock = function (src, p, radius, dmg, col) {
  FX.ring(p, col || [1.6, 1.2, 0.7], radius, 0.5); FX.puff(p, 12, { size: 0.6, grow: 3, col: [0.42, 0.38, 0.32], a: 0.45, spread: radius * 0.7, life: 1.5 }); FX.addShake(0.55); R.shock(p, 1.1);
  const P = PLAYER.a; if (!P || !P.alive) return;
  if (Math.hypot(P.x - p.x, P.z - p.z) < radius && P.grounded && Math.abs(P.y - p.y) < 2) COMBAT.damage(P, dmg, { src, kind: 'quake', knock: true, dir: V3(P.x - p.x, 0, P.z - p.z).normalize() });
};
class Lord extends Actor {
  constructor(key, o) {
    const D = LORD.DEFS[key], T = CHAR.T[D.tpl], k = D.scale || 1;
    const hp = D.hp * (MG.difficulty === 'easy' ? 0.7 : MG.difficulty === 'hard' ? 1.3 : 1);
    super(T, Object.assign({ hp, team: 'foe', moves: MOV.jedi, r: D.r || 0.4 * k, h: D.h || 1.85 * k }, o));
    if (k !== 1) { this.inst.root.scale.setScalar(k); this.inst.scale = k; }
    this.D = D; this.key = key; this.sc = k; this.isBoss = D.boss !== false; this.isLord = true; this.noExec = true; this.edgeGuard = true; this.name = D.name; this.runes = D.runes || 0; this.step = 0.5 * k;
    this.saber = new Weapon(D.weapon, D.wopt); this.saber.addTo(R.scene); this.setProp(this.saber, false);
    this.state = 'duel'; this.stT = 0; this.cd = rnd(1.0, 1.8); this.combo = []; this.poise = D.poise; this.poiseT = 0; this.ph = 1; this.prevSegs = []; this.hitW = new Set(); this.strafe = 1; this.strafeT = 2; this.aggr = 1; this.spT = rnd(4, 7);
    this.onActEnd = (n) => this.actEnd(n); this.react = (i) => this.onHit(i); this.die = (i) => this.onDie(i); this.onDamage = (amt, info) => this.onDmg(amt, info);
    this.base = 'guard'; this.home = [this.x, this.z];
    BOSS.list.push(this); COMBAT.actors.push(this);
    this.physics(0); this.animate(0.016); this.pose3D(0.016); this.saber.update(0, 0);
    if (D.init) D.init(this);
  }
  get P() { return PLAYER.a; }
  update(dt) {
    this.stT += dt; this.flash = Math.max(0, this.flash - dt); this.iframe = Math.max(0, this.iframe - dt);
    if (this.hidden) return;
    if (this.poiseT > 0) { this.poiseT -= dt; if (this.poiseT <= 0) this.poise = this.D.poise; }
    if (!this.alive) { this.vx *= 0.9; this.vz *= 0.9; this.physics(dt); this.animate(dt); this.pose3D(dt); this.saber.update(dt, MG.t); this.saber.sampleTrails(MG.t, 0); return; }
    if (this.passive) { this.vx *= 0.8; this.vz *= 0.8; }
    else if (this.state === 'duel') this.think(dt);
    else if (this.state === 'stun') { this.vx = this.vz = 0; if (this.stT > 3.4) { this.stunned = false; this.stop(); this.state = 'duel'; this.cd = 0.5; this.poise = this.D.poise; } }
    else if (this.state === 'busy') { this.vx *= 0.85; this.vz *= 0.85; if (!this.act) { this.state = 'duel'; this.cd = Math.min(this.cd, 0.7); } }
    this.speed = Math.hypot(this.vx, this.vz);
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    if (this.speed > 0.1) { this.mvx = (this.vx * cy - this.vz * sy) / this.speed; this.mvz = (this.vx * sy + this.vz * cy) / this.speed; }
    if (this.act && this.actClip && this.actClip.move) { const m = PLAYER.rootMove(this.actClip, this.actT) * (this.moveK || 0); const dm = m - (this.movePrev || 0); this.movePrev = m; if (dm > 0) this.moveH(Math.sin(this.yaw) * dm, Math.cos(this.yaw) * dm); }
    for (const o of COMBAT.actors) { if (o === this || !o.alive || o.hidden) continue; const dx = this.x - o.x, dz = this.z - o.z, d = Math.hypot(dx, dz), m = this.r + o.r + (o.isPlayer ? 0.35 : 0.2);
      if (d < m && d > 1e-4) { const q = (m - d) / d; if (o.isPlayer) { this.moveH(dx * q * 0.25, dz * q * 0.25); if (PLAYER.state !== 'exec' && PLAYER.state !== 'ride') o.moveH(-dx * q * 0.75, -dz * q * 0.75); } else this.moveH(dx * q * 0.5, dz * q * 0.5); } }
    this.physics(dt);
    if (LEVEL.cur && this.y < LEVEL.cur.killY) { this.x = this.home[0]; this.z = this.home[1]; this.y = (PHY.ground(this.x, this.z, 0.3, 300, -300) || 0) + 0.1; this.vy = 0; }
    this.animate(dt); this.pose3D(dt);
    this.saber.update(dt, MG.t);
    this.saber.sampleTrails(MG.t, this.act && this.actClip && this.actClip.ev ? 1 : 0);
    this.strikeCheck(dt);
    if (this.D.tick) this.D.tick(this, dt);
  }
  think(dt) {
    const P = this.P, D = this.D, k = this.sc; if (!P || !P.alive) { this.vx *= 0.9; this.vz *= 0.9; this.setBase(this.guardBase || 'guard'); return; }
    const d = this.dist(P);
    this.yaw = dampA(this.yaw, this.angTo(P), this.act ? (this.actT < (this.trackT || 0.5) ? (D.track || 3.4) : 0.6) : 8, dt);
    if (this.act) { this.vx *= 0.85; this.vz *= 0.85; return; }
    const want = (D.range || 2.2) * k;
    this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = -this.strafe; this.strafeT = rnd(1.4, 3); }
    const ax = (P.x - this.x) / (d || 1), az = (P.z - this.z) / (d || 1);
    let fx = 0, fz = 0; if (d > want + 0.4) { fx += ax; fz += az; } else if (d < want - 0.8) { fx -= ax * 0.6; fz -= az * 0.6; }
    if (d < want + 3) { fx += -az * this.strafe * 0.4; fz += ax * this.strafe * 0.4; }
    const spd = (d > want + 5 ? D.speed * 1.5 : D.speed), L = Math.hypot(fx, fz) || 1;
    this.vx = damp(this.vx, fx / L * spd, 5, dt); this.vz = damp(this.vz, fz / L * spd, 5, dt);
    this.setBase(this.guardBase || 'guard');
    this.cd -= dt * this.aggr * (MG.difficulty === 'hard' ? 1.25 : MG.difficulty === 'easy' ? 0.75 : 1); this.spT -= dt;
    if (this.combo.length) { this.strike(this.combo.shift()); return; }
    if (this.cd > 0) return;
    // pick by range band and phase
    const pool = D.moves.filter((m) => d >= (m.min || 0) * k && d <= (m.max === undefined ? 3.2 : m.max) * k + 0.6 && (!m.ph || m.ph <= this.ph) && (!m.sp || this.spT <= 0));
    if (!pool.length) { if (d > want + 6) this.cd = 0.4; return; }
    let tw = 0; for (const m of pool) tw += m.w || 1; let r = RNG() * tw, pk = pool[0]; for (const m of pool) { r -= m.w || 1; if (r <= 0) { pk = m; break; } }
    if (pk.sp) this.spT = rnd(pk.sp[0], pk.sp[1]);
    const seq = pk.seq.slice(); this.combo = seq.slice(1); this.strike(seq[0]);
    const c = D.cd || [1.3, 2.4]; this.cd = rnd(c[0], c[1]) * (this.ph > 1 ? 0.8 : 1);
  }
  strike(name) {
    const P = this.P, sp = this.D.special && this.D.special[name]; this.yaw = dampA(this.yaw, this.angTo(P), 60, 0.016);
    if (sp && sp.start) { if (sp.start(this) === false) return; }
    const c = this.play(sp && sp.clip ? sp.clip : name, { fade: 0.14 }); if (!c) return;
    this.cur = name; this.hitW = new Set(); this.movePrev = 0; this.impactDone = false; this.spDone = false;
    const mv = c.move ? c.move[c.move.length - 1][1] : 0; this.moveK = mv ? clamp(this.dist(P) - 1.3 * this.sc, 0, mv * 2.0 * this.sc) / mv : 0;
    this.trackT = c.ev && c.ev.length ? Math.max(0.2, c.ev[0][0] - 0.12) : 0.5;
    if (name === 'leap') { this.vy = 7.2; this.grounded = false; const d = Math.max(0, this.dist(P) - 1.6 * this.sc); this.vx = Math.sin(this.yaw) * d / 0.78; this.vz = Math.cos(this.yaw) * d / 0.78; this.leapFx = false; }
    COMBAT.snapBlades(this.saber, this.prevSegs);
  }
  strikeCheck(dt) {
    const c = this.actClip, P = this.P; if (!c || !P || !this.alive) { COMBAT.snapBlades(this.saber, this.prevSegs); return; }
    const sp = this.D.special && this.D.special[this.cur], k = this.sc, dm = (this.D.dmgK || 1) * (MG.difficulty === 'easy' ? 0.75 : MG.difficulty === 'hard' ? 1.25 : 1);
    if (c.ev) for (let i = 0; i < c.ev.length; i++) {
      const e = c.ev[i]; if (this.hitW.has(i) || this.actT < e[0] || this.actT > e[1] + dt) continue;
      let hit = false, hp = null;
      COMBAT.sweep(this, this.saber, 1, this.prevSegs, (t, p) => { if (t === P) { hit = true; hp = p; } }, 3.6 * k + 1.5);
      if (!hit) { const d = this.dist(P), ang = Math.abs(wrapA(this.angTo(P) - this.yaw)); if (d < (this.D.reach || 2.6) * k && ang < 0.55 && this.actT > (e[0] + e[1]) * 0.5 && Math.abs(P.y - this.y) < 1.6 * k) { hit = true; hp = P.chest(V3()); } }
      if (hit) { this.hitW.add(i); COMBAT.damage(P, e[3] * dm, { src: this, kind: 'jedi', heavy: e[3] >= 26, knock: e[3] >= 30, dir: V3(P.x - this.x, 0, P.z - this.z).normalize(), p: hp }); FX.spark(hp, V3(0, 1, 0), 12, 5, [3, 2.4, 1.6]); }
    }
    if (c.impact !== undefined && !this.impactDone && this.actT >= c.impact && this.act !== 'leap') { this.impactDone = true; const f = this.forward(V3()), fo = c.aoe > 5 ? 0 : 1.5 * k; LORD.shock(this, V3(this.x + f.x * fo, this.y + 0.05, this.z + f.z * fo), (c.aoe || 3) * (k > 1.3 ? 1.15 : 1), (this.D.aoeDmg || 22) * dm, this.D.shockCol); }
    if (this.act === 'leap' && this.grounded && this.actT > 0.7 && !this.leapFx) { this.leapFx = true; LORD.shock(this, V3(this.x, this.y + 0.05, this.z), 3.6 * (k > 1.3 ? 1.2 : 1), (this.D.aoeDmg || 22) * dm, this.D.shockCol); }
    if (sp && sp.tick) sp.tick(this, dt, c);
    COMBAT.snapBlades(this.saber, this.prevSegs);
  }
  onDmg(amt, info) { this.poise -= amt * (info.heavy ? 1.7 : 1) * (info.kind === 'plunge' ? 1.5 : 1); this.poiseT = 5; return amt; }
  onHit(info) {
    if (this.state === 'stun') return;
    const D = this.D;
    if (this.ph === 1 && D.phase2 && this.hp < this.hpMax * (D.phaseAt || 0.55)) { this.ph = 2; this.combo = []; this.stop(0.1); this.state = 'busy'; this.iframe = 1.2; D.phase2(this); return; }
    if (this.poise <= 0) { this.stunned = true; this.combo = []; this.stop(); this.play('stun', { fade: 0.06 }); this.state = 'stun'; this.stT = 0; this.poise = D.poise; FX.spark(this.chest(V3()), V3(0, 1, 0), 34, 6, [4, 3.2, 1.6]); MG.hitStop = 0.14; FX.addShake(0.35); if (typeof HUD.banner === 'function') HUD.pop('STANCE BROKEN'); return; }
    this.flinch(info.dir, 0.55);
  }
  onExec() { this.stop(); this.play('stun'); this.state = 'stun'; this.stT = 1.6; }
  onParried() { this.poise -= this.D.poise * 0.5; this.combo = []; if (this.poise <= 0) this.onHit({}); }
  resistPush() { return true; } resistGrip() { return true; }
  onDie(info) { this.combo = []; this.play('death', { fade: 0.12 }); this.vx = this.vz = 0; if (this.D.onDeath) this.D.onDeath(this); if (this.onDefeat) this.onDefeat(info); }
  actEnd(n) { if (this.state === 'duel' && !this.combo.length) this.cd = Math.max(this.cd, rnd(0.5, 1.1)); }
  swapWeapon(kind, opt) { const old = this.saber; old.remove(); this.saber = new Weapon(kind, opt); this.saber.addTo(R.scene); this.setProp(this.saber, false); this.prevSegs = []; this.saber.update(0, 0); }
}
/* thrown light: 1–3 holy daggers in a fan */
LORD.daggers = function (L, n, col) {
  const P = L.P, o = L.inst.bones[12].getWorldPosition(V3()), tgt = P.chest(V3()); tgt.x += P.vx * 0.3; tgt.z += P.vz * 0.3;
  const base = tgt.sub(o).normalize();
  for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.16, d = base.clone().applyAxisAngle(YUP, a); COMBAT.fire(o, d, { shooter: L, team: 'foe', dmg: 13 * (L.D.dmgK || 1), speed: 21, col: col || [1.0, 0.72, 0.2], holy: true }); }
  FX.flashLight(o, [1, 0.8, 0.3], 8, 7, 0.15); FX.spark(o, base, 14, 5, [4, 3, 1.2]);
};
/* a cone of dragon fire from a bone */
LORD.fire = function (L, dt, bone, range, dps) {
  const o = L.inst.bones[bone].getWorldPosition(V3()), f = L.forward(V3()); f.y = -0.12; f.normalize(); const P = L.P;
  for (let i = 0; i < 3; i++) FX.puff(o.clone().addScaledVector(f, 0.4), 1, { add: true, size: 0.5, grow: 5, col: [3.2, 1.1 + RNG() * 0.8, 0.25], a: 0.9, life: 0.55, spread: 1.4, vel: f.clone().multiplyScalar(range * 2.2), drag: 1.2, rise: 0.6 });
  if (RNG() < dt * 14) FX.puff(o.clone().addScaledVector(f, range * 0.7), 1, { size: 1.0, grow: 3, col: [0.12, 0.1, 0.1], a: 0.4, life: 1.2, spread: 1.5, rise: 1.5 });
  if (!L.fireL) L.fireL = R.addLight({ pos: new THREE.Vector3(), col: new THREE.Color(1, 0.45, 0.12), i: 0, range: 14, prio: 4, on: true });
  L.fireL.pos.copy(o).addScaledVector(f, range * 0.4); L.fireL.i = 9; L.fireT = 0.15;
  if (P && P.alive) { const dx = P.x - L.x, dz = P.z - L.z, d = Math.hypot(dx, dz), ang = Math.abs(wrapA(Math.atan2(dx, dz) - L.yaw)); if (d < range && ang < 0.42 && Math.abs(P.y - L.y) < 2.5) COMBAT.damage(P, dps * dt, { src: L, kind: 'fire', unblockable: false }); }
};
/* far foes sleep: unseen and unposed until the Tarnished comes within sight of them. In the middle distance they are
   posed at half rate, cast no shadow and wear no cloth (a camp of fifteen is otherwise ~1000 draw calls and 7 ms). */
ENEMY.update = function (dt) {
  const P = PLAYER.a, c = R.camera.position; ENEMY._f = (ENEMY._f || 0) + 1;
  for (let i = 0; i < ENEMY.list.length; i++) {
    const e = ENEMY.list[i];
    const d = P ? Math.min(Math.hypot(e.x - P.x, e.z - P.z), Math.hypot(e.x - c.x, e.z - c.z)) : 0;
    const far = e.alive && !e.alerted && d > 76;
    if (far) { if (!e.asleep) { e.asleep = true; ENEMY.vis(e, false); } continue; }
    if (e.asleep) { e.asleep = false; ENEMY.vis(e, true); e.tier = undefined; }
    const tier = d > 40 ? 1 : 0;
    if (tier !== e.tier) { e.tier = tier; ENEMY.lod(e, tier); }
    if (tier === 1 && !e.alerted && e.alive) { if ((ENEMY._f + i) % 2) continue; e.update(dt * 2); } else e.update(dt);
  }
};
ENEMY.vis = function (e, v) { if (e.Q) { e.Q.g.visible = v; return; } if (e.root) e.root.visible = v; if (e.inst && e.inst.cloth) e.inst.cloth.setVisible(v && !e.inst.cloth.frozen); if (e.gun) e.gun.visible = v; };
ENEMY.lod = function (e, tier) {
  const sh = tier === 0, set = (o) => { if (o && o.traverse) o.traverse((m) => { if (m.isMesh && m.userData.cs === undefined) m.userData.cs = m.castShadow; if (m.isMesh) m.castShadow = sh && m.userData.cs; }); };
  set(e.root); set(e.gun); if (e.Q) set(e.Q.g);
  if (e.inst && e.inst.cloth) { e.inst.cloth.frozen = !sh; e.inst.cloth.setVisible(sh && !e.hidden); if (sh) e.inst.cloth.reset(); }
};
(function () { const st = ClothSet.prototype.step; ClothSet.prototype.step = function (dt) { if (this.frozen) return; return st.call(this, dt); }; })();
