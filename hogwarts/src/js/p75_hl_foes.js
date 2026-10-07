/* ==== p75_hl_foes.js ==== */
/* HOGWARTS — things to duel: dark wizards who circle, telegraph and curse (some behind wards that only one family of
   spell breaks), a forest troll, and the practice dummies. Statuses from the player's spells are played out here. */
HL.foes = []; HL.FOE = {
  ashwinder: { tpl: 'ashwinder', name: 'Ashwinder Scout', hp: 62, cd: [3.0, 4.6], spell: 'foe', pts: 10 },
  poacher: { tpl: 'poacher', name: 'Poacher', hp: 46, cd: [2.8, 4.2], spell: 'foe', pts: 8 },
  pyro: { tpl: 'ashwinder', name: 'Ashwinder Duellist', hp: 80, cd: [3.4, 4.8], spell: 'foeFire', ward: 'control', pts: 15 },
  darkmage: { tpl: 'darkmage', name: 'Dark Wizard', hp: 190, cd: [3.0, 4.0], spell: 'foeHeavy', ward: 'force', heavy: true, pts: 40, scale: 1.06 },
  troll: { tpl: 'troll', name: 'Forest Troll', hp: 480, big: true, melee: true, pts: 60, scale: 2.2, r: 0.95, h: 1.8 },
};
class HLFoe extends Actor {
  constructor(type, x, z, o) {
    o = o || {}; const D = HL.FOE[type], T = CHAR.T[D.tpl], y = o.y !== undefined ? o.y : HL.gy(x, z);
    super(T, { x, y, z, yaw: o.yaw || 0, hp: D.hp, team: 'foe', moves: MOV.wizard, r: D.r || 0.34, h: D.h || 1.8 });
    this.D = D; this.type = type; this.label = D.name; this.home = [x, z]; this.ai = 'idle'; this.cdT = rnd(1, 2.5); this.strafe = RNG() < 0.5 ? 1 : -1; this.strafeT = rnd(1, 3); this.big = !!D.big; this.base = o.base || 'fold';
    if (D.scale) { this.inst.root.scale.setScalar(D.scale); this.inst.scale = D.scale; this.r = (D.r || 0.34); this.h = (D.h || 1.8) * D.scale; }
    if (!D.melee) { this.wand = HL.wand(0x1a1412); R.scene.add(this.wand); }
    if (D.ward) this.setWard(D.ward);
    this.react = (info) => this.onHit(info); this.die = (info) => this.onDie(info);
    COMBAT.actors.push(this); HL.foes.push(this); this.edgeGuard = true;
    this.physics(0); this.animate(0.016); this.pose3D(0.016); if (this.wand) HL.placeWand(this, 0.016);
  }
  setWard(kind) { this.ward = kind; const col = kind === 'fire' ? [1.6, 0.5, 0.15] : kind === 'force' ? [0.9, 0.5, 1.6] : [1.6, 1.3, 0.3];
    const m = HL.shield().material.clone(); m.uniforms = { uT: { value: 0 }, uK: { value: 0.8 }, uHit: { value: 0 }, uCol: { value: new THREE.Color(col[0], col[1], col[2]) } };
    this.wardMesh = new THREE.Mesh(HL.shield().geometry, m); this.wardMesh.renderOrder = 8; R.scene.add(this.wardMesh); this.wardFlash = () => { m.uniforms.uHit.value = 1; }; }
  onHit(info) { const st = HL.st(this); if (this.ai === 'idle') this.ai = 'fight'; this.alertT = 0; if (st.freeze > 0 || st.lift > 0) return; if (this.big) { this.flinch(info.dir, 0.6); return; }
    if (info.heavy) { this.play('knock', { fade: 0.08 }); this.busyT = 2.1; this.telT = 0; } else if (this.D.poise) { /* a trained duellist finishes the spell they have begun, and is not kept from the next by being peppered */ if (!(this.telT > 0) && !(this.fireT > 0) && this.act !== 'knock') this.play('hit', { fade: 0.06 }); }
    else if (!this.act || this.act !== 'knock') { this.play('hit', { fade: 0.06 }); this.telT = 0; this.cdT = Math.max(this.cdT, 0.7); } }
  onDie(info) { COMBAT.freeToken('shoot', this); if (this.wardMesh) this.wardMesh.visible = false; if (this.ice) this.ice.visible = false; HL.save.points = (HL.save.points || 0) + this.D.pts; HL.ui && HL.ui.pop('+' + this.D.pts + ' HOUSE POINTS');
    const d = info.dir || V3(0, 0, 1); this.stop(0.01); if (!MG.flags.norag && !this.big) RAG.start(this, d, info.heavy ? 6.5 : 3.6, info.p); else this.play('death', { fade: 0.1 });
    if (this.wand && !this.wandOut) HL.dropWand(this, d); this.deadT = 0; if (HL.onFoeDown) HL.onFoeDown(this); MG.slowmo = 0.4; MG.slowmoT = 0; MG.slowmoDur = 0.25; }
  remove() { this.gone = true; this.dispose(); if (this.wand && this.wand.parent) this.wand.parent.remove(this.wand); if (this.wardMesh && this.wardMesh.parent) this.wardMesh.parent.remove(this.wardMesh); if (this.ice && this.ice.parent) this.ice.parent.remove(this.ice);
    const i = COMBAT.actors.indexOf(this); if (i >= 0) COMBAT.actors.splice(i, 1); const j = HL.foes.indexOf(this); if (j >= 0) HL.foes.splice(j, 1); }
  setHidden(h) { if (this.hidden === h) return; this.hidden = h; this.root.visible = !h; if (this.inst.cloth) this.inst.cloth.setVisible(!h); if (this.wand) this.wand.visible = !h && !this.wandGone; if (this.wardMesh) this.wardMesh.visible = !h && !!this.ward; }
  update(dt) {
    const P = PLAYER.a, st = HL.st(this), dP = P ? Math.hypot(P.x - this.x, P.z - this.z) : 1e9;
    if (!this.alive) { this.deadT += dt; if (this.rag) { RAG.update(this, dt); } else { this.vx = this.vz = 0; this.speed = 0; this.physics(dt); this.animate(dt); this.pose3D(dt); } this.wandFall(dt); if (this.deadT > 9) this.remove(); return; }
    this.setHidden(dP > 130); if (this.hidden) return;
    this.iframe = Math.max(0, this.iframe - dt); this.flash = Math.max(0, this.flash - dt);
    // ---- statuses
    for (const k of ['freeze', 'burn', 'disarm', 'stun', 'pull']) if (st[k] > 0) st[k] = Math.max(0, st[k] - dt);
    if (st.burn > 0) { this.burnT = (this.burnT || 0) + dt; if (this.burnT > 0.5) { this.burnT = 0; COMBAT.damage(this, 3, { src: P, kind: 'burn' }); if (!this.alive) return; } if (RNG() < dt * 26) FX.puff(V3(this.x + rnd(-0.25, 0.25), this.y + rnd(0.3, 1.5) * (this.inst.scale || 1), this.z + rnd(-0.25, 0.25)), 1, { add: true, size: 0.2, grow: 2, col: [2.6, 1.0, 0.2], a: 0.8, life: 0.5, spread: 0.3, rise: 2.2 }); }
    if (st.disarm <= 0 && this.wandOut && this.wandGone) { this.wandOut = false; this.wandGone = false; if (this.wand) this.wand.visible = true; }
    this.wandFall(dt);
    const frozen = st.freeze > 0;
    if (frozen !== !!this.wasFrozen) { this.wasFrozen = frozen; if (frozen) { if (!this.ice) { this.ice = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.08, metalness: 0, transmission: 0, transparent: true, opacity: 0.5, envMapIntensity: 2.2, emissive: 0x2a6a9a, emissiveIntensity: 0.6 })); R.scene.add(this.ice); }
        this.ice.visible = true; FX.spark(this.chest(new THREE.Vector3()), null, 16, 4, [2, 3.4, 5], 0.4); } else if (this.ice) { this.ice.visible = false; FX.spark(this.chest(new THREE.Vector3()), null, 20, 6, [2, 3.4, 5], 0.5); } }
    if (frozen) { const s = this.inst.scale || 1; this.ice.position.set(this.x, this.y + 0.95 * s, this.z); this.ice.scale.set(0.62 * s, 1.08 * s, 0.62 * s); this.vx = this.vz = 0; this.speed = 0; this.physics(dt); this.syncRoot(); this.tickWard(dt); return; }
    if (st.lift > 0) { st.lift -= dt; const ty = st.liftY + 1.7 + Math.sin(MG.t * 2.2) * 0.12; this.y = damp(this.y, ty, 5, dt); this.vy = 0; this.vx = this.vz = 0; this.speed = 0; this.grounded = false; this.airT = 0; if (this.act !== 'lift' || this.actT > 2.6) this.play('lift', { fade: 0.15 });
      if (RNG() < dt * 30) FX.puff(V3(this.x + rnd(-0.4, 0.4), this.y + rnd(-0.2, 0.6), this.z + rnd(-0.4, 0.4)), 1, { add: true, size: 0.06, grow: 0.3, col: [3, 2.4, 0.5], a: 0.9, life: 0.6, spread: 0.2, rise: 1.2 });
      this.yaw += dt * 0.8; this.telT = 0; if (st.lift <= 0) { this.stop(0.2); this.grounded = false; } this.animate(dt); this.pose3D(dt); this.post(dt); return; }
    if (st.pull > 0 && this.pullTo) { const s = this.pullTo, dx = s.x - this.x, dz = s.z - this.z, d = Math.hypot(dx, dz); if (d > 2.4) { const k = Math.min(d - 2.2, 26 * dt); this.moveH(dx / d * k, dz / d * k); this.y = Math.max(this.y, HL.gy(this.x, this.z) + 0.5 * Math.sin(st.pull / 0.55 * PI)); this.vy = 0; } }
    if (this.kbT > 0) { this.kbT -= dt; this.moveH(this.kb.x * dt, this.kb.z * dt); if (this.hitWall && this.kb.length() > 6 && !this.kbHit) { this.kbHit = true; COMBAT.damage(this, 14, { src: P, kind: 'slam' }); FX.addShake(0.2); FX.puff(this.chest(new THREE.Vector3()), 6, { size: 0.4, col: [0.5, 0.48, 0.44], a: 0.4, spread: 1.5 }); if (!this.alive) return; }
      if (this.kb.y > 0) { this.vy = this.kb.y; this.grounded = false; this.y += 0.03; this.kb.y = 0; } this.kb.multiplyScalar(Math.exp(-2.2 * dt)); if (this.kbT <= 0) this.kbHit = false; }
    this.busyT = Math.max(0, (this.busyT || 0) - dt);
    const busy = this.busyT > 0 || st.stun > 0 || this.kbT > 0 || (this.act === 'knock');
    // ---- mind
    let tvx = 0, tvz = 0;
    if (this.ai === 'idle') { if (P && P.alive && dP < (this.D.melee ? 26 : 30) && Math.abs(P.y - this.y) < 14 && PHY.los(this.x, this.y + 1.5, this.z, P.x, P.y + 1.3, P.z)) { this.alertT = (this.alertT || 0) + dt; if (this.alertT > 0.5) { this.ai = 'fight'; this.cdT = rnd(1.6, 3.0); this.setBase('idle', 0.2); } } else this.alertT = 0; }
    else if (P && !busy) {
      const dx = P.x - this.x, dz = P.z - this.z, d = dP || 1, ang = Math.atan2(dx, dz); this.yaw = dampA(this.yaw, ang, 7, dt);
      if (dP > 75 || !P.alive) { this.ai = 'idle'; this.telT = 0; COMBAT.freeToken('shoot', this); this.setBase(this.base, 0.3); }
      else if (this.D.melee) {   // the troll: lumber in, a wound-up overhand smash
        if (this.swing) { this.swingT += dt; if (this.swingT > 0.62 && !this.swingHit) { this.swingHit = true; const fx = this.x + Math.sin(this.yaw) * 2.8, fz = this.z + Math.cos(this.yaw) * 2.8, p = V3(fx, this.y + 0.2, fz); FX.ring(p, [1.2, 0.9, 0.5], 5, 0.5); FX.puff(p, 12, { size: 0.6, col: [0.45, 0.42, 0.36], a: 0.5, spread: 3.2, life: 1.2 }); FX.addShake(0.5); R.shock(p, 0.6);
              if (P.alive && Math.hypot(P.x - fx, P.z - fz) < 3.4 && Math.abs(P.y - this.y) < 2.5 && PLAYER.state !== 'fly') COMBAT.damage(P, 30, { src: this, kind: 'blast', dir: V3(dx / d, 0, dz / d), heavy: true, unblockable: true, p: P.chest(new THREE.Vector3()) }); }
          if (this.swingT > 1.5) { this.swing = false; this.cdT = rnd(1.2, 2.2); } }
        else if (dP < 4.6) { this.cdT -= dt; if (this.cdT <= 0) { this.swing = true; this.swingT = 0; this.swingHit = false; this.play('castBig', { fade: 0.15, speed: 0.55 }); } }
        else { tvx = dx / d * 3.1; tvz = dz / d * 3.1; }
      } else {
        // hold a duelling distance, circle, and curse on a telegraph
        this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = -this.strafe; this.strafeT = rnd(1.5, 3.5); }
        const want = this.D.want || 12, rad = d < want - 3 ? -1 : d > want + (this.D.want ? 2.5 : 5) ? 1 : 0, sp = 2.6; tvx = (dx / d * rad + dz / d * this.strafe * 0.8) * sp; tvz = (dz / d * rad - dx / d * this.strafe * 0.8) * sp;
        const can = st.disarm <= 0 && !this.wandOut;
        if (this.telT > 0) { this.telT -= dt; tvx *= 0.2; tvz *= 0.2; this.wandGlow = 1.4; if (this.telT <= 0) { COMBAT.freeToken('shoot', this); if (can && PHY.los(this.x, this.y + 1.5, this.z, P.x, P.y + 1.2, P.z)) { this.play(this.D.heavy ? 'castBig' : 'cast1', { fade: 0.06 }); this.fireT = this.D.heavy ? 0.3 : 0.13; } this.cdT = rnd(this.D.cd[0], this.D.cd[1]); } }
        else if (can) { this.cdT -= dt; if (this.cdT <= 0 && dP < 34 && MG.t - (HL.foeGapT || -9) > (this.D.gap || 2.1) && COMBAT.wantToken('shoot', this, 2)) { HL.foeGapT = MG.t; this.telT = this.D.heavy ? 1.15 : 0.7; this.wandCol = HL.SPELLS[this.D.spell].col; } }
        if (this.fireT > 0) { this.fireT -= dt; if (this.fireT <= 0) { const tip = HL.wandTip(this, new THREE.Vector3()), aim = P.chest(new THREE.Vector3()); if (PLAYER.state === 'fly') aim.addScaledVector(HL.fly.vel, 0.3); HL.shoot(this, tip, aim.sub(tip).normalize(), this.D.spell, { target: P }); FX.flashLight(tip, HL.SPELLS[this.D.spell].col, 5, 6, 0.12); } }
      }
      if (Math.hypot(this.x - this.home[0], this.z - this.home[1]) > 46) { const hx = this.home[0] - this.x, hz = this.home[1] - this.z, hd = Math.hypot(hx, hz); tvx = hx / hd * 3; tvz = hz / hd * 3; }
    }
    if (busy || this.ai === 'idle') { tvx = 0; tvz = 0; }
    if (this.kbT > 0) { this.vx = 0; this.vz = 0; } else { this.vx = damp(this.vx, tvx, 6, dt); this.vz = damp(this.vz, tvz, 6, dt); }
    this.speed = Math.hypot(this.vx, this.vz); const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw); if (this.speed > 0.1) { this.mvx = (this.vx * cy - this.vz * sy) / this.speed; this.mvz = (this.vx * sy + this.vz * cy) / this.speed; }
    this.physics(dt); if (this.y < -1 && HL.lake(this.x, this.z) > 0.5) { COMBAT.damage(this, 999, { src: P, kind: 'fall' }); return; }
    this.animate(dt); this.pose3D(dt); this.post(dt);
  }
  tickWard(dt) { if (this.wardMesh) { const U = this.wardMesh.material.uniforms; U.uT.value = MG.t; U.uHit.value = Math.max(0, U.uHit.value - dt * 3); this.wardMesh.visible = !!this.ward && !this.hidden; const s = this.inst.scale || 1; this.wardMesh.position.set(this.x, this.y + 1.0 * s, this.z); this.wardMesh.scale.setScalar(s); } }
  post(dt) { if (this.wand && !this.wandOut) HL.placeWand(this, dt); this.tickWard(dt); }
  wandFall(dt) { if (!this.wandOut || this.wandGone || !this.wand) return; const w = this.wand, v = this.wandV; v.y -= 18 * dt; w.position.addScaledVector(v, dt); w.rotation.x += this.wandSpin * dt; const g = HL.gy(w.position.x, w.position.z); if (w.position.y < g + 0.03) { w.position.y = g + 0.03; this.wandGone = true; w.visible = this.alive ? false : true; w.rotation.set(HALF, 0, rnd(0, 3)); } }
}
/* a practice dummy: takes any spell, shudders, mends itself */
HL.dummy = function (L, x, z, yaw) {
  const M = HL.M(), y = HL.dropY(x, z, 30), g = new THREE.Group(), wood = M.wood, straw = new THREE.MeshStandardMaterial({ color: 0xb89a58, roughness: 1 }), cloth = new THREE.MeshStandardMaterial({ color: HL.H().col, roughness: 0.9 });
  const add = (geo, m, px, py, pz, rz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); if (rz) me.rotation.z = rz; me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(0.07, 0.09, 1.9, 8), wood, 0, 0.95, 0); add(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), wood, 0, 1.42, 0, HALF);
  add(new THREE.CylinderGeometry(0.26, 0.2, 0.72, 12), straw, 0, 1.2, 0); add(new THREE.SphereGeometry(0.2, 12, 10), straw, 0, 1.82, 0); add(new THREE.CylinderGeometry(0.27, 0.27, 0.16, 12), cloth, 0, 1.36, 0); add(new THREE.ConeGeometry(0.2, 0.42, 10), cloth, 0, 2.14, 0);
  add(new THREE.CylinderGeometry(0.34, 0.4, 0.12, 12), wood, 0, 0.06, 0);
  g.position.set(x, y, z); g.rotation.y = yaw || 0; LEVEL.add(g); PHY.cyl(x, z, 0.3, y, y + 2);
  const d = { x, y, z, r: 0.36, h: 2.1, hp: 100, hpMax: 100, alive: true, team: 'foe', label: 'Practice Dummy', isDummy: true, iframe: 0, wob: 0, hits: 0, g,
    chest: (o) => (o || new THREE.Vector3()).set(x, y + 1.25, z), dist: (o) => Math.hypot(o.x - x, o.z - z), react: (info) => { d.wob = 1; d.dir = info.dir ? info.dir.clone() : V3(0, 0, 1); d.hits++; if (HL.onDummyHit) HL.onDummyHit(d, info); },
    die: () => { d.alive = true; d.hp = d.hpMax; d.wob = 1.6; d.hits++; FX.puff(V3(x, y + 1.3, z), 14, { size: 0.3, col: [0.75, 0.65, 0.4], a: 0.5, spread: 2.5, life: 1 }); if (HL.onDummyHit) HL.onDummyHit(d, { broke: true }); } };
  COMBAT.actors.push(d); L.updates.push((dt) => { if (d.hp < d.hpMax) d.hp = Math.min(d.hpMax, d.hp + dt * 6); const st = d.st; if (st) { for (const k in st) if (typeof st[k] === 'number' && st[k] > 0 && k !== 'liftY') st[k] = Math.max(0, st[k] - dt); g.position.y = damp(g.position.y, y + (st.lift > 0 ? 1.4 : 0), 5, dt); }
    d.wob = Math.max(0, d.wob - dt * 1.6); const w = Math.sin(MG.t * 22) * d.wob * 0.22; g.rotation.x = w * (d.dir ? d.dir.z : 1); g.rotation.z = -w * (d.dir ? d.dir.x : 0); });
  return d;
};
HL.spawnFoes = function (list) { const out = []; for (const s of list) out.push(new HLFoe(s[0], s[1], s[2], s[3])); return out; };
HL.foesUpdate = function (dt) { for (let i = HL.foes.length - 1; i >= 0; i--) HL.foes[i].update(dt); };
