/* ==== p73_hl_player.js ==== */
/* HOGWARTS — the witch or wizard you play: camera-relative movement, sprint, roll, jump; an over-the-shoulder camera
   with a reticle; the wand in the right hand; basic cast, eight spells on cooldowns, Protego with a perfect-parry
   Stupefy, Lumos, Revelio and Ancient Magic. The game's own frame loop lives here too. */
Object.assign(IN.ACT, { attack: { k: [], m: 0, p: 7 }, heavy: { k: [], p: 99 }, block: { k: ['KeyQ'], m: 2, p: 6 }, push: { k: ['KeyE'], p: 2 }, grip: { k: [], p: 98 }, throw: { k: [], p: 97 }, rage: { k: [], p: 96 }, lock: { k: [], p: 95 },
  broom: { k: ['KeyB', 'KeyF'], p: 3 }, lumos: { k: ['KeyL'], p: 13 }, revelio: { k: ['KeyR'], p: 12 }, ancient: { k: ['KeyX'], p: 10 }, down: { k: ['KeyC', 'ControlLeft'], p: 11 }, map: { k: ['KeyM'], p: 8 },
  s1: { k: ['Digit1'], p: 90 }, s2: { k: ['Digit2'], p: 91 }, s3: { k: ['Digit3'], p: 92 }, s4: { k: ['Digit4'], p: 93 }, s5: { k: ['Digit5'], p: 94 }, s6: { k: ['Digit6'], p: 89 }, s7: { k: ['Digit7'], p: 88 }, s8: { k: ['Digit8'], p: 87 } });
HL.SPELLS = {
  basic: { name: 'Basic Cast', col: [1.0, 0.36, 0.22], cd: 0, dmg: 9, speed: 52, size: 0.16, move: null },
  levioso: { name: 'Levioso', key: 1, col: [1.0, 0.82, 0.18], cd: 8, dmg: 4, speed: 44, size: 0.24, move: 'castUp', kind: 'control', desc: 'Lifts a foe helpless into the air' },
  accio: { name: 'Accio', key: 2, col: [0.72, 0.36, 1.0], cd: 7, dmg: 4, speed: 60, size: 0.22, move: 'cast3', kind: 'force', desc: 'Hauls a foe to your feet' },
  depulso: { name: 'Depulso', key: 3, col: [0.66, 0.5, 1.0], cd: 8, dmg: 22, speed: 60, size: 0.3, move: 'cast3', kind: 'force', desc: 'Hurls foes away' },
  incendio: { name: 'Incendio', key: 4, col: [1.0, 0.42, 0.08], cd: 9, dmg: 34, speed: 0, size: 0.3, move: 'castBig', kind: 'fire', desc: 'A burst of flame at close range' },
  confringo: { name: 'Confringo', key: 5, col: [1.0, 0.3, 0.05], cd: 7, dmg: 42, speed: 48, size: 0.34, move: 'castBig', kind: 'fire', desc: 'A long-range bolt of fire' },
  expelliarmus: { name: 'Expelliarmus', key: 6, col: [1.0, 0.12, 0.1], cd: 9, dmg: 36, speed: 56, size: 0.26, move: 'cast3', kind: 'damage', desc: 'Disarms and wounds' },
  glacius: { name: 'Glacius', key: 7, col: [0.45, 0.82, 1.0], cd: 12, dmg: 14, speed: 46, size: 0.28, move: 'castUp', kind: 'control', desc: 'Freezes a foe solid' },
  bombarda: { name: 'Bombarda', key: 8, col: [1.0, 0.55, 0.12], cd: 15, dmg: 60, speed: 40, size: 0.4, move: 'castBig', kind: 'fire', desc: 'A heavy explosion' },
  stupefy: { name: 'Stupefy', col: [1.0, 0.2, 0.16], cd: 0, dmg: 14, speed: 70, size: 0.24 },
};
HL.BAR = ['levioso', 'accio', 'depulso', 'incendio', 'confringo', 'expelliarmus', 'glacius', 'bombarda'];
HL.P = { cd: {}, aimT: 0, ancient: 0, shiftT: 0, sprint: false, blocking: false, blockT: 0, lumos: false, castN: 0, pending: null, boost: 1, revT: 0, combatT: 0, target: null, aim: new THREE.Vector3(), aimDir: new THREE.Vector3(0, 0, 1) };
PLAYER.spawn = function (x, y, z, yaw) {
  if (PLAYER.a) { if (PLAYER.a.wand && PLAYER.a.wand.parent) PLAYER.a.wand.parent.remove(PLAYER.a.wand); PLAYER.a.dispose(); }
  if (y === null || y === undefined) y = (PHY.floorBelow(x, z, 400) || { y: HL.gy(x, z) }).y;
  const a = new Actor(CHAR.T.maul, { x, y, z, yaw, hp: 100, team: 'hero', moves: MOV.wizard, r: 0.32, h: 1.78 });
  a.isPlayer = true; PLAYER.a = a; a.base = 'idle';
  a.wand = HL.wand(0x2e1c12); R.scene.add(a.wand);
  a.onLand = (airT) => { if (airT > 0.35 && PLAYER.state !== 'fly') { a.play('land', { fade: 0.08 }); FX.puff(V3(a.x, a.y + 0.05, a.z), 4, { size: 0.25, col: [0.5, 0.48, 0.42], a: 0.25, spread: 1.2, life: 0.7 }); } };
  a.react = (info) => PLAYER.react(info); a.die = (info) => PLAYER.die(info); a.onDamage = (amt, info) => PLAYER.onDamage(amt, info); a.onActEnd = () => {};
  PLAYER.state = 'move'; PLAYER.lock = null; PLAYER.focus = null; PLAYER.fp = PLAYER.fpMax = 100; PLAYER.stam = 100; PLAYER.rage = 0; PLAYER.saber = null;
  PLAYER.lastSafe.set(x, y, z); COMBAT.actors.push(a);
  Object.assign(HL.P, { aimT: 0, blocking: false, pending: null, sprint: false, lumos: false }); if (HL.fly) HL.fly.on = false;
  a.physics(0); a.animate(0.016); a.pose3D(0.016); HL.placeWand(a, 0.016);
  return a;
};
/* the wand rides the right fist; while a cast is released it snaps onto the line to the target */
HL._wq = new THREE.Quaternion(); HL._wOff = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.0, 0, 0.12));
HL.placeWand = function (a, dt, aimDir, aimK) {
  const w = a.wand; if (!w) return; const I = a.inst, hb = I.bones[12], LD = I.LD; if (!LD) return;
  hb.updateWorldMatrix(true, false); const hq = hb.getWorldQuaternion(HL._wq), sc = I.scale || 1;
  w.position.copy(hb.getWorldPosition(_v1)).add(_v2.copy(LD.gripOffR).applyQuaternion(hq).multiplyScalar(sc));
  w.quaternion.copy(hq).multiply(HL._wOff);
  if (aimDir && aimK > 0) { _q1.setFromUnitVectors(YUP, aimDir); w.quaternion.slerp(_q1, aimK); }
  w.scale.setScalar(sc); w.updateMatrixWorld(true);
  const tip = w.userData.tip, k = a.wandGlow || 0; tip.material.opacity = Math.min(1, k); tip.scale.setScalar(0.6 + k * 1.2); if (a.wandCol) tip.material.color.setRGB(a.wandCol[0] * 3, a.wandCol[1] * 3, a.wandCol[2] * 3);
  a.wandGlow = Math.max(a.lumos ? 0.8 : 0, k - dt * 3);
};
HL.wandTip = (a, out) => a.wand.userData.muzzle.getWorldPosition(out || new THREE.Vector3());
/* ------------------------------------------------------------------ aiming: the reticle is the camera's centre ray */
HL.aimUpdate = function () {
  const a = PLAYER.a, cam = R.camera, P = HL.P, o = cam.getWorldPosition(_v1), d = cam.getWorldDirection(_v2);
  let best = null, bs = 0.18;                                 // the foe nearest the reticle (within ~10°), in range and in sight
  for (const e of COMBAT.actors) { if (!e.alive || e.team === 'hero' || e.hidden || e.noTarget) continue; const c = e.chest(_v3), to = _v4.copy(c).sub(o), dist = to.length(); if (dist > 60 || dist < 0.5) continue; to.multiplyScalar(1 / dist);
    const ang = Math.acos(clamp(to.dot(d), -1, 1)), sc = ang + dist * 0.0012; if (ang < 0.2 + 1.2 / dist && sc < bs + 1.2 / dist && PHY.los(o.x, o.y, o.z, c.x, c.y, c.z)) { if (!best || sc < bs) { bs = sc; best = e; } } }
  P.target = best;
  if (best) best.chest(P.aim); else { const start = 2.5, hit = PHY.ray(o.x + d.x * start, o.y + d.y * start, o.z + d.z * start, d.x, d.y, d.z, 90, 'shot'); P.aim.copy(o).addScaledVector(d, hit ? hit.t + start : 90); }
  P.aimDir.copy(d);
};
/* ------------------------------------------------------------------ casting */
PLAYER.canCast = function () { const a = PLAYER.a, st = PLAYER.state; if (!(st === 'move' || st === 'air')) return false; if (!a.act) return true; const c = a.actClip; return /^cast|^protego|^land|^interact/.test(a.act) ? a.actT >= (c.cancel !== undefined ? c.cancel : c.dur * 0.7) || /^protego|^land/.test(a.act) : false; };
PLAYER.cast = function (id, force) {
  const a = PLAYER.a, P = HL.P, S = HL.SPELLS[id]; if (!S || (!force && !PLAYER.canCast())) return false;
  if (S.cd && (P.cd[id] || 0) > 0) { HL.ui && HL.ui.deny(id); return false; }
  let mv = S.move; if (!mv) { P.castN = (P.castN + 1) % 4; mv = P.castN === 3 ? 'cast3' : P.castN % 2 ? 'cast2' : 'cast1'; }
  const c = a.play(mv, { fade: a.act ? 0.06 : 0.09, speed: S.move ? 1 : 1.12 });
  P.pending = { id, t: c.release !== undefined ? c.release : 0.15 }; P.aimT = 3.2; P.combatT = 6; if (S.cd) P.cd[id] = S.cd; a.wandCol = S.col;
  return true;
};
PLAYER.release = function (id) {
  const a = PLAYER.a, P = HL.P, S = HL.SPELLS[id], tip = HL.wandTip(a, new THREE.Vector3());
  HL.aimUpdate(); const dir = P.aim.clone().sub(tip).normalize(); if (dir.dot(P.aimDir) < 0.3) dir.copy(P.aimDir);
  a.wandGlow = 1.6; FX.flashLight(tip, S.col, id === 'basic' ? 9 : 5, 6, id === 'basic' ? 0.09 : 0.12); FX.spark(tip, dir, id === 'basic' ? 10 : 12, 5, [S.col[0] * 4, S.col[1] * 4, S.col[2] * 4], 0.25);
  if (id !== 'basic') { R.kick(0.12); FX.addShake(0.08); HL.ui && HL.ui.spellName(S.name); } else { R.kick(0.05); FX.ring && FX.ring(tip, [S.col[0] * 3, S.col[1] * 3, S.col[2] * 3], 0.9, 0.16); }   /* (the basic cast had a faint spark and nothing else: now a flare at the tip, a ring and a small kick) */
  if (id === 'incendio') return HL.incendio(a, tip, dir);
  HL.shoot(a, tip, dir, id, { target: P.target, dmgMul: 1 });
};
/* ------------------------------------------------------------------ Protego */
HL.shield = function () {
  if (HL._shield) return HL._shield;
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, uniforms: { uT: { value: 0 }, uK: { value: 0 }, uHit: { value: 0 }, uCol: { value: new THREE.Color(0.5, 0.75, 1.6) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uT, uK, uHit; uniform vec3 uCol; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 2.2); float hx = abs(sin(vP.y * 9.0 + uT * 3.0) * sin(atan(vP.z, vP.x) * 6.0 + uT * 1.3));
        float a = (f * 0.5 + 0.015 + smoothstep(0.94, 1.0, hx) * 0.08) * uK + uHit * (0.25 + f * 0.8); gl_FragColor = vec4(uCol * a, 1.0); }` });
  const me = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 20), m); me.renderOrder = 8; me.visible = false; R.scene.add(me); HL._shield = me; return me;
};
PLAYER.onDamage = function (amt, info) {
  const a = PLAYER.a, P = HL.P; if (MG.god) return false;
  if (P.blocking && !info.unblockable) {
    const sh = HL.shield(); sh.material.uniforms.uHit.value = 1; FX.addShake(0.12); a.wandGlow = 1.2;
    const perfect = MG.t - P.blockT < 0.42;
    if (info.p) FX.spark(info.p, null, 14, 5, [1.5, 2.5, 5], 0.3);
    if (perfect && info.src && info.src.alive) { HL.ui && HL.ui.pop('PERFECT PROTEGO'); MG.hitStop = 0.07; P.ancient = Math.min(100, P.ancient + 8); const tip = a.chest(new THREE.Vector3()); HL.shoot(a, tip, info.src.chest(new THREE.Vector3()).sub(tip).normalize(), 'stupefy', { target: info.src }); }
    return false;
  }
  HL.ui && HL.ui.hurt(amt); FX.addShake(0.25); return amt;
};
PLAYER.react = function (info) {
  const a = PLAYER.a; PLAYER.regenT = 0;
  if (PLAYER.state === 'fly') { if (HL.fly) HL.fly.bump(info); return; }
  if (info.heavy || info.kind === 'blast') { a.play('knock', { fade: 0.08 }); PLAYER.state = 'knock'; a.iframe = 1.6; const d = info.dir || V3(0, 0, 1); a.vx = d.x * 7; a.vz = d.z * 7; a.vy = 4; HL.P.pending = null; }
  else { a.flinch(info.dir, 1); a.iframe = 0.35; }
};
PLAYER.die = function () { PLAYER.state = 'dead'; const a = PLAYER.a; a.play('death', { fade: 0.1 }); HL.P.pending = null; HL.P.blocking = false; if (HL.shield()) HL.shield().visible = false; MG.after(2.4, () => HL.revive(), true); };
PLAYER.onKill = function () { HL.P.ancient = Math.min(100, HL.P.ancient + 12); };
PLAYER.fell = function () { HL.rescue(); };
HL.revive = function () { const a = PLAYER.a; if (!a) return; HL.ui && HL.ui.fade(1); MG.after(0.7, () => { const s = HL.lastCP || LEVEL.cur.def.start; a.alive = true; a.hp = a.hpMax; a.x = s[0]; a.y = s[1]; a.z = s[2]; a.vx = a.vy = a.vz = 0; a.stop(0.01); PLAYER.state = 'move'; if (a.inst.cloth) a.inst.cloth.reset && a.inst.cloth.reset(); CAM.snap = true; HL.ui && HL.ui.fade(0); HL.ui && HL.ui.toast('You came round on the grass', 'A prefect mutters something about the hospital wing.'); }, true); };
HL.rescue = function () { const a = PLAYER.a, s = PLAYER.lastSafe; FX.puff(V3(a.x, 0.2, a.z), 14, { size: 0.5, col: [0.8, 0.86, 0.9], a: 0.5, spread: 3, life: 1.1 }); a.x = s.x; a.y = s.y + 0.2; a.z = s.z; a.vx = a.vy = a.vz = 0; CAM.snap = true; a.hp = Math.max(10, a.hp - 10); HL.ui && HL.ui.toast('Fished out of the loch', 'The giant squid sets you gently back on the shore.'); };
/* ------------------------------------------------------------------ the frame */
PLAYER.update = function (dt) {
  const a = PLAYER.a; if (!a) return; const P = HL.P, st = PLAYER.state;
  a.iframe = Math.max(0, a.iframe - dt); a.flash = Math.max(0, a.flash - dt);
  for (const k in P.cd) if (P.cd[k] > 0) P.cd[k] = Math.max(0, P.cd[k] - dt);
  P.aimT = Math.max(0, P.aimT - dt); P.combatT = Math.max(0, P.combatT - dt);
  PLAYER.regenT = (PLAYER.regenT || 0) + dt; if (PLAYER.regenT > 5 && a.alive && a.hp < a.hpMax) a.hp = Math.min(a.hpMax, a.hp + dt * 6);
  if (st === 'fly') { HL.fly.update(dt); return; }
  if (!a.alive || st === 'dead') { a.vx = damp(a.vx, 0, 6, dt); a.vz = damp(a.vz, 0, 6, dt); a.speed = 0; a.physics(dt); a.animate(dt); a.pose3D(dt); HL.placeWand(a, dt); return; }
  if (st === 'cine' || st === 'seat') { a.speed = 0; a.vx = a.vz = 0; if (st === 'cine') a.physics(dt); a.animate(dt); a.pose3D(dt); HL.placeWand(a, dt); return; }
  HL.aimUpdate();
  const dir = PLAYER.inputDir(PLAYER._d), mag = Math.min(1, dir.length()); if (mag > 0.01) dir.normalize();
  const free = st === 'move' || st === 'air';
  // sprint on a held Shift, a roll on a tap
  if (IN.down('dodge')) { P.shiftT += dt; P.sprint = st === 'move' && P.shiftT > 0.2 && mag > 0.3; }
  else { if (P.shiftT > 0 && P.shiftT <= 0.2 && st === 'move' && a.grounded) PLAYER.roll(dir, mag); P.shiftT = 0; P.sprint = false; }
  delete IN.buf.dodge;
  const casting = a.act && /^cast|^protego/.test(a.act);
  const fighting = P.aimT > 0 || P.blocking;
  let spd = 0; if (free) spd = mag * (P.blocking ? 2.2 : casting ? 3.4 : P.sprint ? 7.4 : fighting ? 4.2 : 4.9);
  if (free) { const k = a.grounded ? 10 : 3; a.vx = damp(a.vx, dir.x * spd, k, dt); a.vz = damp(a.vz, dir.z * spd, k, dt); }
  a.speed = Math.hypot(a.vx, a.vz);
  if (free) { if (fighting && !P.sprint) a.yaw = dampA(a.yaw, CAM.yaw, 14, dt); else if (mag > 0.1) a.yaw = dampA(a.yaw, Math.atan2(dir.x, dir.z), 11, dt); }
  const cy = Math.cos(a.yaw), sy = Math.sin(a.yaw); if (a.speed > 0.1) { a.mvx = (a.vx * cy - a.vz * sy) / a.speed; a.mvz = (a.vx * sy + a.vz * cy) / a.speed; }
  // ---- states
  const st1 = PLAYER.state;
  if (st1 === 'move') {
    if (!a.grounded && a.airT > 0.12) { PLAYER.state = 'air'; if (!a.act || !/^cast/.test(a.act)) a.play('air', { fade: 0.18 }); }
    else if (IN.take('jump') && a.grounded) { a.vy = 7.6; a.grounded = false; a.y += 0.02; PLAYER.state = 'air'; a.play('jumpUp', { fade: 0.06 }); P.blocking = false; }
  } else if (st1 === 'air') {
    if (a.grounded) { PLAYER.state = 'move'; if (a.act === 'air' || a.act === 'jumpUp') a.stop(0.14); }
    else { if (!a.act) a.play('air', { fade: 0.2 }); else if (a.act === 'air' && a.actT > 2.2) a.actT = 0.3; }
  } else if (st1 === 'dodge') {
    const u = a.actU(); const sp = u < 0.7 ? 9.5 * (1 - u * 0.75) : 2; a.vx = PLAYER.rollDir.x * sp; a.vz = PLAYER.rollDir.z * sp; a.speed = 0;
    if (!a.act) PLAYER.state = a.grounded ? 'move' : 'air';
  } else if (st1 === 'knock') { a.vx = damp(a.vx, 0, 3, dt); a.vz = damp(a.vz, 0, 3, dt); a.speed = 0; if (!a.act) PLAYER.state = 'move'; }
  if (PLAYER.state === 'move' || PLAYER.state === 'air') {
    // Protego: hold
    const wantBlock = IN.down('block') && PLAYER.state === 'move';
    if (wantBlock && !P.blocking && (!a.act || PLAYER.canCast())) { P.blocking = true; P.blockT = MG.t; a.play('protego', { fade: 0.07 }); P.pending = null; P.aimT = 2; a.wandCol = [0.5, 0.8, 1.6]; a.wandGlow = 1; }
    else if (P.blocking && !wantBlock) { P.blocking = false; if (a.act && /^protego/.test(a.act)) a.stop(0.16); }
    if (P.blocking && (!a.act || (a.act === 'protegoHold' && a.actT > 1.7))) a.play('protegoHold', { fade: 0.1 });
    if (!P.blocking) {
      if (IN.peek('attack', 0.3) && PLAYER.canCast()) { IN.take('attack', 0.3); PLAYER.cast('basic'); }
      for (let i = 0; i < 8; i++) if (IN.peek('s' + (i + 1), 0.45) && (PLAYER.canCast() || (a.act && /^cast[123]$/.test(a.act) && !P.pending))) { IN.take('s' + (i + 1), 0.45); PLAYER.cast(HL.BAR[i], true); }
      if (IN.take('ancient')) HL.ancient();
      if (IN.take('revelio')) HL.revelio();
      if (IN.take('lumos')) { a.lumos = !a.lumos; HL.ui && HL.ui.spellName(a.lumos ? 'Lumos' : 'Nox'); }
      if (IN.take('broom') && HL.fly) { HL.fly.mount(); return; }
      if (IN.take('push')) HL.useInteract && HL.useInteract();
    }
  }
  if (P.pending && a.act && /^cast/.test(a.act)) { if (a.actT >= P.pending.t) { const id = P.pending.id; P.pending = null; PLAYER.release(id); } } else if (P.pending && !a.act) P.pending = null;
  a.physics(dt);
  if (a.grounded && PLAYER.state === 'move') { PLAYER.safeT = (PLAYER.safeT || 0) + dt; if (PLAYER.safeT > 0.4 && a.y > 0.6) PLAYER.lastSafe.set(a.x, a.y, a.z); } else PLAYER.safeT = 0;
  if (a.y < -1.0 || (LEVEL.cur && a.y < LEVEL.cur.killY)) HL.rescue();
  a.setBase('idle');
  a.lookYaw = fighting ? 0 : clamp(wrapA(CAM.yaw - a.yaw), -0.9, 0.9) * 0.5;
  a.animate(dt); a.pose3D(dt);
  const rel = a.act && /^cast/.test(a.act) ? sat(1 - Math.abs(a.actT - (a.actClip.release || 0.15)) / 0.14) : 0;
  HL.placeWand(a, dt, rel > 0 ? _v5.copy(P.aim).sub(a.wand.position).normalize() : null, rel * 0.85);
  // Protego bubble, Lumos
  const sh = HL.shield(), U = sh.material.uniforms; U.uT.value = MG.t; U.uK.value = damp(U.uK.value, P.blocking ? 1 : 0, 14, dt); U.uHit.value = Math.max(0, U.uHit.value - dt * 4); sh.visible = U.uK.value > 0.02 || U.uHit.value > 0.02; if (sh.visible) sh.position.set(a.x, a.y + 1.0, a.z);
  if (!HL._lumos) HL._lumos = R.addLight({ pos: new THREE.Vector3(), col: new THREE.Color(0.8, 0.9, 1.0), i: 0, range: 16, prio: 6, on: true, persist: true });
  HL._lumos.i = damp(HL._lumos.i, a.lumos ? 26 : 0, 8, dt); HL.wandTip(a, HL._lumos.pos); if (a.lumos) { a.wandCol = [0.9, 0.95, 1.0]; }
};
PLAYER.roll = function (dir, mag) { const a = PLAYER.a; const d = mag > 0.2 ? dir.clone() : a.forward(new THREE.Vector3()); PLAYER.rollDir = d; a.yaw = Math.atan2(d.x, d.z); a.play('dodge', { fade: 0.06 }); a.iframe = 0.42; PLAYER.state = 'dodge'; HL.P.blocking = false; HL.P.pending = null; HL.P.sprint = false; HL.P.shiftT = 0; };
/* ------------------------------------------------------------------ camera: over the right shoulder on foot */
CAM.reset = function (yaw) { CAM.yaw = yaw || 0; CAM.pitch = -0.08; CAM.snap = true; CAM.cine = null; };
CAM.update = function (dt) {
  const cam = R.camera, P = PLAYER.a;
  if (CAM.cine) { CAM.cineUpdate(dt); return; }
  if (!P) return;
  const fly = PLAYER.state === 'fly', F = HL.fly;
  CAM.yaw -= IN.A.lx; CAM.pitch = clamp(CAM.pitch - IN.A.ly, fly ? -1.25 : -1.1, fly ? 1.2 : 0.9);
  const piv = _v1.set(P.x, P.y + (fly ? 1.15 : 1.5), P.z);
  if (!CAM.pivot) CAM.pivot = piv.clone();
  CAM.pivot.lerp(piv, CAM.snap ? 1 : 1 - Math.exp(-(fly ? 22 : 16) * dt));
  if (Math.abs(CAM.pivot.y - piv.y) > 1.2) CAM.pivot.y = lerp(CAM.pivot.y, piv.y, 0.4);
  const spd = fly ? F.speed : 0, qm = fly && HL.Q && HL.Q.on;   // (in a match the eye sits a little further back and higher: you see the play over your own head)
  CAM.distT = fly ? (qm ? 5.7 + Math.min(2.3, spd * 0.06) : 4.6 + Math.min(3.2, spd * 0.07)) : HL.P.aimT > 0 ? 2.9 : HL.camNear ? HL.camNear : 3.5;   // (HL.camNear: a closer eye where the place is close — the huddle)
  CAM.dist = damp(CAM.dist, CAM.distT, 4, dt);
  const cp = Math.cos(CAM.pitch), fwd = _v2.set(Math.sin(CAM.yaw) * cp, Math.sin(CAM.pitch), Math.cos(CAM.yaw) * cp);
  CAM.shoulder = damp(CAM.shoulder, fly ? 0 : 0.62, 4, dt);
  const right = _v3.set(-Math.cos(CAM.yaw), 0, Math.sin(CAM.yaw));
  const look = _v4.copy(CAM.pivot).addScaledVector(right, CAM.shoulder); if (fly) look.y += qm ? (innerHeight < 380 ? 0.7 : 1.0) : (innerHeight < 380 ? 0.15 : 0.5);   // (on the Fold's cover screen the rider sat at the bottom edge, behind the gauge)
  const back = _v5.copy(fwd).negate();
  let d = CAM.dist; const hit = PHY.ray(look.x, look.y, look.z, back.x, back.y, back.z, d + 0.3, 'los'); if (hit) d = Math.max(0.5, Math.min(d, hit.t - 0.25));
  CAM.curD = CAM.curD === undefined || CAM.snap ? d : (d < CAM.curD ? d : damp(CAM.curD, d, 3, dt));
  const pos = CAM.pos.copy(look).addScaledVector(back, CAM.curD);
  { const g = PHY.hf ? PHY.hf(pos.x, pos.z) : null; if (g !== null && pos.y < g + 0.3) pos.y = g + 0.3; }
  const s = FX.shake * FX.shake * 0.1, t = MG.rt * 31; pos.x += (vnoise2(t, 1.3) - 0.5) * s; pos.y += (vnoise2(t, 7.1) - 0.5) * s; pos.z += (vnoise2(t, 3.7) - 0.5) * s;
  cam.position.copy(pos); cam.lookAt(_v1.copy(pos).add(fwd));
  if (fly) cam.rotateZ(-F.roll * 0.35);
  CAM.fovT = fly ? (qm ? 64 + Math.min(14, spd * 0.42) + (F.boosting ? 5 : 0) : 62 + Math.min(26, spd * 0.6) + (F.boosting ? 6 : 0)) : HL.P.sprint ? 64 : 58;
  CAM.fov = damp(CAM.fov, CAM.fovT, 4, dt); if (Math.abs(cam.fov - CAM.fov) > 0.01) { cam.fov = CAM.fov; cam.updateProjectionMatrix(); }
  CAM.snap = false;
};
/* ------------------------------------------------------------------ the game's frame (replaces the engine's) */
HL.update = function (rdt) {
  let k = 1; if (MG.hitStop > 0) { MG.hitStop -= rdt; k = 0.08; }
  if (MG.slowmo) { MG.slowmoT = (MG.slowmoT || 0) + rdt; k *= MG.slowmo; if (MG.slowmoT > (MG.slowmoDur || 0.6)) { MG.slowmo = 0; MG.slowmoT = 0; MG.slowmoDur = 0; } }
  const dt = Math.min(rdt, 0.05) * k; MG.dt = dt; MG.t += dt; HL.t += dt;
  if (MG.state === 'play') {
    if (IN.hit('pause') && HL.ui && !CAM.cine && MG.rt > (HL.noPauseT || 0)) { HL.ui.pause(); return; }
    PLAYER.update(dt);
    if (HL.foesUpdate) HL.foesUpdate(dt);
    HL.spellsUpdate(dt);
    LEVEL.update(dt);
    if (HL.Q && HL.Q.update) HL.Q.update(dt);
    if (HL.worldUpdate) HL.worldUpdate(dt);
  } else if (MG.state === 'title' || MG.state === 'house') { if (HL.titleUpdate) HL.titleUpdate(rdt); if (LEVEL.cur) LEVEL.update(dt); }
  else if (MG.state === 'pause') { /* frozen */ }
  FX.update(dt);
  if (MG.state === 'play' || CAM.cine) CAM.update(rdt);
  const P = PLAYER.a; if (P && MG.state === 'play' && !(CAM.cine && HL._cineStn)) R.updateShadow(_v1.set(P.x, P.y, P.z)); else R.updateShadow(_v1.copy(R.camera.position).addScaledVector(R.camera.getWorldDirection(_v2), 40));
  if (HL.ui) HL.ui.update(rdt);
};
MG.gameUpdate = HL.update;
