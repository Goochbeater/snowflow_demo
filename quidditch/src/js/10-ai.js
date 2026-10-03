// ===================== AI =====================
const AI = {
  steer(f, target, dt, boostDist = 34) {
    _v1.subVectors(target, f.pos);
    const dist = _v1.length();
    // separation
    for (const o of Game.flyers) {
      if (o === f || o.scripted) continue;
      _v2.subVectors(f.pos, o.pos); const d = _v2.length();
      if (d < 4.5 && d > 0.01) _v1.addScaledVector(_v2, (4.5 - d) / d * 2.2);
    }
    // stand avoidance: steer inward if heading out near the ring
    const q = World.bandQuery(f.pos.x + f.vel.x * 0.8, f.pos.z + f.vel.z * 0.8, AI._q || (AI._q = {}));
    if (q.o > -9) { _v1.x -= q.nx * 30; _v1.z -= q.nz * 30; }
    const [ty, tp] = yawPitchFromDir(_v1);
    const dy = wrapAngle(ty - f.yaw), dp = tp - f.pitch;
    f.input.x = clamp(-dy * 2.6, -1, 1);
    f.input.y = clamp(dp * 2.8, -1, 1);
    f.input.boost = dist > boostDist && Math.abs(dy) < 0.6 && f.boost > 0.25;
    f.input.brake = Math.abs(dy) > 1.6 && dist < 25;
    return dist;
  },
  clampTarget(t, side = 1) {
    const rho = (t.x / 80) ** 2 + (t.z / 40) ** 2;
    if (rho > 1) { const k = 1 / Math.sqrt(rho); t.x *= k; t.z *= k; }
    t.y = clamp(t.y, 3, CONFIG.pitch.ceiling - 6);
    return t;
  },
  update(dt) {
    for (const f of Game.flyers) {
      if (f.isPlayer || f.scripted) continue;
      f.ai.t += dt; f.ai.cool -= dt;
      if (f.role === 'keeper') { this.keeper(f, dt); continue; }
      if (f.ai.t > 0.1) {
        f.ai.t = 0;
        if (f.role === 'chaser') this.chaser(f);
        else if (f.role === 'beater') this.beater(f);
        else if (f.role === 'seeker') this.seeker(f);
      }
      if (f.role === 'beater' && f.ai.swing > 0) this.swing(f, dt);
      for (const b of Game.bludgers) {
        if (b.state !== 'struck' || b.target !== f || b.dodgeRolled) continue;
        if (b.pos.distanceTo(f.pos) < 9) { b.dodgeRolled = true; if (Math.random() < 0.3 + Game.diff.aim * 0.25) f.startDodge(Math.random() < 0.5 ? 'left' : 'right'); }
      }
      if (f.role === 'seeker') this.seekerCatch(f, dt);
      const bd = f.role === 'seeker' && Game.snitch.active ? 8 : 34;
      const Q = Game.quaffle, receiving = Q.state === 'flying' && Q.passTarget === f;
      f.speedMul = receiving ? 0.5 : 1;
      this.steer(f, f.ai.target, dt, bd);
      if (receiving) f.input.boost = false;
      if (f.role === 'chaser' && f.ai.tackle) this.tryTackle(f);
    }
  },
  mates(f) { return Game.teams[f.side].filter(o => o !== f && o.role === 'chaser'); },
  // career game plan for the player's side (Hawkshead / Porskoff / Parkin's Pincer / Seeker Shield)
  tac(f) { const t = f.side === 0 && Game.opts && Game.opts.tactic && TACTICS[Game.opts.tactic]; return t || null; },
  opps(f) { return Game.teams[1 - f.side]; },
  pickHoop(side, f) {
    const sx = Game.attackSign(side), keeper = Game.keeper(1 - side);
    let best = null, bs = -1e9;
    for (const h of World.hoops) {
      if (h.side !== sx) continue;
      const kd = keeper ? keeper.pos.distanceTo(h.pos) : 10;
      const s = kd * 0.45 - Math.abs(h.pos.z - f.pos.z) * 0.2 + rnd(0, 5);
      if (s > bs) { bs = s; best = h; }
    }
    return best;
  },
  openMate(f) {
    const sx = Game.attackSign(f.side);
    let best = null, bs = -1e9;
    for (const m of Game.teams[f.side]) {
      if (m === f || m.role !== 'chaser' || m.stun > 0 || m.scripted) continue;
      const d = m.pos.distanceTo(f.pos); if (d < 7 || d > 45) continue;
      let crowd = 99; for (const o of this.opps(f)) crowd = Math.min(crowd, o.pos.distanceTo(m.pos));
      if (crowd < 5) continue;
      let s = (m.pos.x - f.pos.x) * sx * 0.6 + crowd * 0.4 - d * 0.1;
      if (m.isPlayer) s += 6 + (Input.callT > Game.rtime - 1.5 ? 20 : 0);
      if (s > bs) { bs = s; best = m; }
    }
    return best;
  },
  chaser(f) {
    const Q = Game.quaffle, sx = Game.attackSign(f.side), D = Game.diff, T = f.ai.target;
    f.ai.tackle = false; f.ai.call = 0;
    const R = Game.restart;
    if (R && !f.hasBall) {
      if (R.side === f.side) T.set(R.keeper.pos.x + sx * (26 + f.slot * 11), 13 + f.slot * 2, (f.slot - 1) * 15);
      else T.set(-sx * (8 + f.slot * 6), 14, (f.slot - 1) * 14);
      this.clampTarget(T); return;
    }
    if (f.hasBall) {
      const hoop = f.ai.hoop && Math.random() > 0.08 ? f.ai.hoop : (f.ai.hoop = this.pickHoop(f.side, f));
      const dist = f.pos.distanceTo(hoop.pos);
      let threat = 99; for (const o of this.opps(f)) { if (o.role === 'seeker') continue; _v2.subVectors(o.pos, f.pos); if (_v2.dot(f.fwd) > 0) threat = Math.min(threat, _v2.length()); }
      if (f.ai.cool <= 0 && (threat < 8 || (Game.player && Game.player.side === f.side && Math.random() < 0.08))) {
        const m = this.openMate(f);
        if (m && (threat < 8 || m.isPlayer)) { Game.pass(f, m); f.ai.cool = 1.2; return; }
      }
      const tc = this.tac(f);
      if (f.ai.cool <= 0 && Math.random() < 0.03 * (tc ? 0.6 + tc.pass * 1.2 : 1)) {
        const m = this.openMate(f);
        if (m && (m.pos.x - f.pos.x) * sx > -3) { Game.pass(f, m); f.ai.cool = 1.2; return; }
      }
      _v2.subVectors(hoop.pos, f.pos).normalize();
      if (dist < 29 && f.ai.cool <= 0 && _v2.dot(f.fwd) > 0.74) { Game.aiShoot(f, hoop); f.ai.cool = 1.5; f.ai.hoop = null; return; }
      const weave = Math.sin(Game.time * 0.9 + f.id) * 8;
      T.set(hoop.pos.x - sx * 20, hoop.pos.y + Math.sin(Game.time * 0.7 + f.id) * 3, hoop.pos.z + weave);
    } else if (Q.holder && Q.holder.side === f.side) {
      const c = Q.holder, mates = Game.teams[f.side].filter(o => o.role === 'chaser' && o !== c);
      const k = mates.indexOf(f), lat = (k === 0 ? -1 : 1) * 11;
      const tc = this.tac(f), push = tc ? tc.push : 0.5;
      T.set(c.pos.x + sx * (4 + push * 7), c.pos.y + (k ? 2 : -1.5) - (tc && tc.pass > 0.8 && k ? 5 : 0), c.pos.z + lat);
      let crowd = 99; for (const o of this.opps(f)) crowd = Math.min(crowd, o.pos.distanceTo(f.pos));
      f.ai.call = crowd > 6 && c.isPlayer ? 1 : 0;
    } else if (!Q.holder) {
      if (Q.passTarget === f) { T.copy(Q.pos).addScaledVector(Q.vel, 0.25); }
      else {
        const mine = Game.teams[f.side].filter(o => o.role === 'chaser' && !o.isPlayer).sort((a, b) => a.pos.distanceToSquared(Q.pos) - b.pos.distanceToSquared(Q.pos));
        if (mine.indexOf(f) < 2) T.copy(Q.pos).addScaledVector(Q.vel, 0.35);
        else T.set(lerp(Q.pos.x, -sx * 60, 0.45), 14, Q.pos.z * 0.5);
      }
    } else {
      const c = Q.holder, mine = Game.teams[f.side].filter(o => o.role === 'chaser' && !o.isPlayer).sort((a, b) => a.pos.distanceToSquared(c.pos) - b.pos.distanceToSquared(c.pos));
      if (mine.indexOf(f) === 0) { T.copy(c.pos).addScaledVector(c.vel, 0.35); f.ai.tackle = true; }
      else {
        const opp = Game.teams[c.side].filter(o => o.role === 'chaser' && o !== c)[mine.indexOf(f) - 1] || c;
        T.copy(opp.pos).lerp(_v2.set(-sx * 66, 14, 0), 0.3);
      }
    }
    this.clampTarget(T);
  },
  tryTackle(f) {
    const c = Game.quaffle.holder; if (!c || c.side === f.side || f.ai.cool > 0) return;
    if (Game.restart && Game.restart.keeper === c) return;
    const tc = this.tac(f), press = tc ? tc.press : 0.4;
    if (f.pos.distanceTo(c.pos) > 3.0 + press * 1.0) return;
    f.ai.cool = 1.4;
    if (c.invuln > 0) { if (c.isPlayer) Game.styleEvent('SLIPPED THE TACKLE', 0.12, 120); return; }
    const p = Game.diff.steal * (c.isPlayer ? 0.8 : 0.55) * (f.side === 0 ? 0.8 + press * 0.5 : 1);
    if (Math.random() < p) Game.steal(f, c);
  },
  beater(f) {
    const D = Game.diff, b = Game.bludgers[f.slot % 2], T = f.ai.target;
    if (f.ai.swing > 0) return;
    const d = f.pos.distanceTo(b.pos);
    if (d < 5 && b.state === 'roam' && f.ai.cool <= 0) {
      const tgt = this.beaterTarget(f);
      if (tgt) { f.ai.swing = 0.38; f.ai.swingTarget = tgt; if (tgt.isPlayer) { Game.warnSwing(f); } if (Render.camera.position.distanceTo(f.pos) < 40) Sound.play('swing', { vol: 0.5 }); return; }
    }
    T.copy(b.pos).addScaledVector(b.vel, 0.4);
    const side = Game.attackSign(f.side);
    T.x -= side * 3;
    this.clampTarget(T);
  },
  beaterTarget(f) {
    const Q = Game.quaffle, opps = this.opps(f).filter(o => o.role !== 'keeper' && o.stun <= 0 && !o.scripted);
    const p = Game.player;
    const ok = o => !(o.isPlayer && Game.time - o.lastHit < CONFIG.bludger.playerGap);
    const tc = this.tac(f);
    if (tc && tc.shield && Game.snitch.active) { const s = opps.find(o => o.role === 'seeker'); if (s && ok(s) && s.pos.distanceTo(f.pos) < 70) return s; }
    if (Q.holder && Q.holder.side !== f.side && ok(Q.holder) && Q.holder.pos.distanceTo(f.pos) < 55) return Q.holder;
    const own = -Game.attackSign(f.side) * 70;
    let best = null, bs = 1e9;
    for (const o of opps) { if (!ok(o) || o.role === 'seeker' && !Game.snitch.active) continue; const s = Math.abs(o.pos.x - own) + o.pos.distanceTo(f.pos) * 0.5 - (o.isPlayer ? 12 : 0); if (s < bs) { bs = s; best = o; } }
    if (best && best.pos.distanceTo(f.pos) > 60) return null;
    return best;
  },
  swing(f, dt) {
    f.ai.swing -= dt;
    if (f.ai.swing > 0) return;
    const b = Game.bludgers[f.slot % 2], tgt = f.ai.swingTarget; f.ai.swingTarget = null; f.swungT = Game.time;
    f.ai.cool = Game.diff.beaterCd + rnd(0, 2);
    if (!tgt || b.pos.distanceTo(f.pos) > 6.5 || b.state !== 'roam') return;
    const t = tgt.pos.distanceTo(b.pos) / CONFIG.bludger.struck;
    _v1.copy(tgt.pos).addScaledVector(tgt.vel, t * Game.diff.aim).sub(b.pos).normalize();
    b.strike(_v1, f.side, tgt);
    if (Render.camera.position.distanceTo(b.pos) < 60) Sound.play('crack', { vol: clamp(1.4 - Render.camera.position.distanceTo(b.pos) / 50, 0.2, 1) });
  },
  keeper(f, dt) {
    const Q = Game.quaffle, D = Game.diff, sx = -Game.attackSign(f.side), hx = sx * CONFIG.pitch.hoopX;
    const T = f.ai.target;
    if (f.hasBall) {
      f.ai.hold = (f.ai.hold || 0) + dt;
      T.set(hx - sx * 4, 14, 0);
      if (Game.restart && Game.restart.keeper === f) f.ai.hold = 0;
      if (f.ai.hold > 1.3) { const m = Game.teams[f.side].filter(o => o.role === 'chaser' && o.stun <= 0).sort((a, b) => a.pos.distanceToSquared(f.pos) - b.pos.distanceToSquared(f.pos))[0]; if (m) Game.pass(f, m); f.ai.hold = 0; }
    } else {
      f.ai.hold = 0;
      T.set(hx - sx * 3.2, 14, 0);
      const flying = Q.state === 'flying' && Q.vel.x * sx > 0 && Math.abs(Q.pos.x - hx) < 60;
      const carrier = Q.holder && Q.holder.side !== f.side && Math.abs(Q.holder.pos.x - hx) < 55;
      if (flying) {
        const kx = hx - sx * 3.2, tt = (kx - Q.pos.x) / (Q.vel.x || 1e-3);
        if (tt > 0 && tt < 3) T.set(kx, Q.pos.y + Q.vel.y * tt - 0.5 * CONFIG.ball.g * tt * tt, Q.pos.z + Q.vel.z * tt);
      } else if (carrier) {
        const c = Q.holder; let best = null, bd = 1e9;
        for (const h of World.hoops) { if (h.side !== sx) continue; _v2.subVectors(h.pos, c.pos).normalize(); const a = 1 - _v2.dot(c.fwd); if (a < bd) { bd = a; best = h; } }
        if (best) T.set(hx - sx * 3.2, lerp(14, best.pos.y, 0.5), best.pos.z * 0.45 + c.pos.z * 0.06);
      } else if (!Q.holder && Math.abs(Q.pos.x - hx) < 18 && Q.pos.distanceTo(f.pos) < 14) {
        T.copy(Q.pos);
      }
      T.y = clamp(T.y, 8, 20); T.z = clamp(T.z, -11, 11);
    }
    // reaction-lagged kinematic hover
    f.ai.smooth = f.ai.smooth || T.clone();
    const shotIn = Q.state === 'flying' && Q.vel.x * sx > 0 && Q.thrower && Q.thrower.side !== f.side;
    f.ai.smooth.lerp(T, 1 - Math.exp(-dt / Math.max(D.react, 0.05) * (shotIn ? 2.6 : 1.6)));
    _v1.subVectors(f.ai.smooth, f.pos);
    const d = _v1.length(), step = D.keeperSpeed * (shotIn ? 1.9 : 1) * dt;
    const prev = _v3.copy(f.pos);
    if (d > step) _v1.multiplyScalar(step / d);
    f.pos.add(_v1);
    f.vel.subVectors(f.pos, prev).divideScalar(Math.max(dt, 1e-4));
    if (f.hasBall) _v2.set(-sx, 0, 0); else _v2.subVectors(Q.pos, f.pos);
    f.lookDir(_v2, 6, dt);
    f.roll = damp(f.roll, clamp(-f.vel.z * sx * 0.12, -0.9, 0.9), 6, dt);
    f.extraRoll = 0; f.frame();
  },
  seeker(f) {
    const S = Game.snitch, T = f.ai.target;
    if (!S.active) { const t = Game.time * 0.22 + f.side * Math.PI; T.set(Math.cos(t) * 62, 46 + Math.sin(t * 1.3) * 6, Math.sin(t) * 30); }
    else { T.copy(S.pos).addScaledVector(S.vel, 0.35); }
  },
  seekerCatch(f, dt) {
    const S = Game.snitch; if (!S.active || Game.state !== 'play') return;
    if (f.pos.distanceTo(S.pos) < 1.6) {
      const rate = Game.overtime ? 1.6 : Game.diff.seekerCatch;
      if (Math.random() < rate * dt) Game.catchSnitch(f);
    }
  },
};
