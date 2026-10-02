// ===================== FINISHERS: data-driven cinematic timelines =====================
const FIN_RATING = { STYLISH: 600, SPECTACULAR: 1000, LEGENDARY: 1600 };

const FH = {
  look(f, target, rate = 0, dt = 0) { _v1.subVectors(target, f.pos); f.lookDir(_v1, rate, dt); },
  hand(ctx) { ctx.p.hand(ctx.Q.pos); },
  keeper(ctx, t0, t1, t) {
    const K = ctx.K; if (!K) return;
    const u = easeInOut(seg(t, t0, t1));
    K.pos.lerpVectors(ctx.K0, ctx.outcome === 'goal' ? ctx.W : ctx.S, u);
    _v1.subVectors(ctx.Q.pos, K.pos); K.lookDir(_v1);
    K.roll = Math.sin(u * Math.PI * 0.5) * ctx.diveRoll; K.frame();
  },
  ball(ctx, t, t0, t1, C, pow = 1) {
    const Q = ctx.Q;
    if (t < t0) return;
    if (t <= t1) { const u = Math.pow(seg(t, t0, t1), pow); bezier(Q.pos, ctx.R, C, ctx.E, u); }
    else if (ctx.outcome === 'goal') { const k = t - t1; Q.pos.copy(ctx.E).addScaledVector(ctx.n, 16 * k - 5 * k * k).y -= 3 * k * k; }
  },
  release(ctx) { ctx.p.hand(ctx.R); ctx.Q.pos.copy(ctx.R); },
  fp() { Cam.mode = 'fp'; },
  script(pos, look, roll = 0) { Cam.mode = 'script'; Cam.sQuat = null; Cam.sPos.copy(pos); Cam.sLook.copy(look); Cam.sRoll = roll; },
};
const RM = () => (Settings.reduceMotion ? 0 : 1);

const FIN_DEFS = {
  comet: {
    name: 'Comet Spike', gesture: '↓', desc: 'Climb, invert at the apex, hammer the Quaffle straight down.', dur: 2.7, rel: 1.0, imp: 1.45, trail: [3.2, 1.3, 0.35], width: 0.7,
    tracks: {
      ts: [[0, 1], [0.3, 0.25], [1.0, 0.2], [1.4, 0.5], [1.45, 0.05], [1.75, 0.3], [2.7, 1]],
      fov: [[0, 0], [0.9, 0.12], [1.1, -0.05], [1.45, 0.18], [1.8, 0], [2.7, 0]],
      blur: [[0, 0], [0.95, 0], [1.05, 0.05], [1.45, 0.08], [1.6, 0], [2.7, 0]],
      ca: [[0, 0], [1.4, 0.004], [1.47, 0.016], [2.0, 0.002], [2.7, 0]],
      flash: [[0, 0], [1.44, 0], [1.46, 0.55], [1.75, 0]],
      letterbox: [[0, 0], [0.25, 0.085], [2.3, 0.085], [2.7, 0]],
      sat: [[0, 1], [0.3, 0.75], [1.44, 0.75], [1.5, 1.35], [2.7, 1]],
    },
    setup(c) { c.A = c.H.clone().addScaledVector(c.n, -7).add(_v1.set(0, 12, 0)); c.C1 = c.P0.clone().addScaledVector(c.F0, 10).add(_v1.set(0, 9, 0)); },
    update(c, t) {
      const p = c.p;
      bezier(p.pos, c.P0, c.C1, c.A, easeInOut(seg(t, 0, 0.95)));
      _v2.copy(c.P0).addScaledVector(c.F0, 30).lerp(c.H, smoothstep(0.25, 0.9, t));
      FH.look(p, _v2);
      p.extraRoll = (Math.PI * easeInOut(seg(t, 0.45, 0.85)) - Math.PI * easeInOut(seg(t, 0.95, 1.2))) * RM();
      p.frame(); FH.fp();
      if (t < this.rel) FH.hand(c); else FH.ball(c, t, this.rel, this.imp, c.C, 1.6);
      if (t >= this.rel && t < this.imp + 0.1) { FX.sparks(c.Q.pos, linCol(3, 1.2, 0.3), 3, 5, { grav: 0, life: 0.5, size: 1.4 }); FX.glow(c.Q.pos, linCol(1.6, 0.7, 0.2), 1.1, 0.12); }
      FH.keeper(c, 0.6, this.imp - 0.04, t);
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5).addScaledVector(c.n, 1.2); },
    onImpact(c) { FX.ring(_v1.set(c.H.x, 0.4, c.H.z), linCol(2.4, 1.8, 0.9), 40, 1.1); World.excite.fill(1); },
  },
  corkscrew: {
    name: 'Corkscrew Lance', gesture: '◯', desc: 'A 720° barrel roll, released on the exit in a twin-helix ribbon.', dur: 2.35, rel: 0.85, imp: 1.38, trail: [2.4, 1.4, 0.5], width: 0.3,
    tracks: {
      ts: [[0, 0.35], [0.85, 0.3], [1.3, 0.4], [1.38, 0.05], [1.6, 0.35], [2.35, 1]],
      blur: [[0, 0], [0.1, 0.12], [0.75, 0.12], [0.9, 0]],
      fov: [[0, 0], [0.4, 0.1], [0.85, 0], [1.38, 0.15], [2.35, 0]],
      flash: [[1.37, 0], [1.39, 0.7], [1.65, 0]],
      ca: [[0, 0], [0.2, 0.004], [0.8, 0.004], [1.0, 0], [1.38, 0.01], [1.9, 0]],
      letterbox: [[0, 0], [0.2, 0.08], [2.0, 0.08], [2.35, 0]],
      sat: [[0, 1], [1.38, 1], [1.45, 1.3], [2.35, 1]],
    },
    setup(c) { c.d0 = c.P0.distanceTo(c.H); c.h1 = FX.trail(0.35, new THREE.Color(c.col1).multiplyScalar(3), 34); c.h2 = FX.trail(0.35, new THREE.Color(c.col2).multiplyScalar(3), 34); c.h1.active = c.h2.active = true; c.tmp = [c.h1, c.h2]; },
    update(c, t) {
      const p = c.p;
      _v2.subVectors(c.H, c.P0).normalize();
      p.pos.copy(c.P0).addScaledVector(_v2, c.d0 * 0.32 * easeOut(seg(t, 0, 0.85)) + Math.max(0, t - 0.85) * 4);
      FH.look(p, c.H);
      p.extraRoll = -2 * TAU * easeInOut(seg(t, 0, 0.85)) * RM(); p.frame(); FH.fp();
      if (t < this.rel) FH.hand(c);
      else {
        FH.ball(c, t, this.rel, this.imp, c.C, 1);
        if (t < this.imp + 0.3) {
          _v3.subVectors(c.E, c.R).normalize(); _v4.crossVectors(_v3, UP).normalize(); _v5.crossVectors(_v4, _v3);
          const a = t * 26, r = 0.55 * (1 - seg(t, this.imp, this.imp + 0.3));
          c.h1.push(_v6.copy(c.Q.pos).addScaledVector(_v4, Math.cos(a) * r).addScaledVector(_v5, Math.sin(a) * r));
          c.h2.push(_v6.copy(c.Q.pos).addScaledVector(_v4, Math.cos(a + Math.PI) * r).addScaledVector(_v5, Math.sin(a + Math.PI) * r));
        }
      }
      FH.keeper(c, 0.5, this.imp - 0.04, t);
      if (c.K && t > this.imp && c.outcome === 'goal') { c.K.extraRoll = 2 * TAU * easeOut(seg(t, this.imp, this.imp + 0.9)); c.K.frame(); }
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5); },
  },
  feint: {
    name: 'Phantom Feint', gesture: '← →', desc: 'Sell one hoop, freeze time, and fire at the other while your ghost holds the fake.', dur: 2.8, rel: 1.1, imp: 1.6, trail: [1.2, 2.0, 3.0], width: 0.4,
    tracks: {
      ts: [[0, 0.5], [0.44, 0.4], [0.46, 0], [1.05, 0], [1.1, 0.08], [1.6, 0.08], [1.65, 0.4], [2.8, 1]],
      keepHue: [[0, 0], [0.45, 0], [0.47, 1], [1.55, 1], [1.62, 0]],
      sat: [[0, 1], [1.6, 1], [1.65, 1.35], [2.8, 1]],
      flash: [[0.44, 0], [0.46, 0.35], [0.6, 0], [1.59, 0], [1.61, 0.6], [1.9, 0]],
      letterbox: [[0, 0], [0.45, 0.1], [2.0, 0.1], [2.3, 0]],
      fov: [[0, 0], [0.4, 0.08], [0.46, 0], [1.6, 0.1], [2.8, 0]],
      ca: [[0, 0], [0.46, 0.008], [1.6, 0.008], [1.7, 0]],
    },
    pickHoops(c, gesture) {
      const p = c.p, sx = Game.attackSign(p.side);
      const ends = World.hoops.filter(h => h.side === sx).sort((a, b) => _v1.subVectors(a.pos, p.pos).dot(p.right) - _v2.subVectors(b.pos, p.pos).dot(p.right));
      const left = ends[0], right = ends[2];
      const fakeLeft = gesture === 'left' || (gesture !== 'right' && Math.random() < 0.5);
      c.fake = fakeLeft ? left : right; return fakeLeft ? right : left;
    },
    setup(c) {
      c.ghost = new THREE.Mesh(c.p.mesh.geometry, Models.ghostMat); c.ghost.visible = false; Render.scene.add(c.ghost);
      c.Kfake = c.fake.pos.clone().addScaledVector(c.n, -3.2);
      c.camSide = c.p.right.clone();
    },
    update(c, t) {
      const p = c.p;
      p.pos.copy(c.P0).addScaledVector(c.F0, Math.min(t, 0.46) * 6);
      if (t < 0.46) { FH.look(p, _v2.copy(c.fake.pos)); p.frame(); FH.fp(); FH.hand(c); }
      else {
        if (!c.Pf) { c.Pf = p.pos.clone(); c.ghost.position.copy(p.pos); c.ghost.quaternion.copy(p.quat); c.ghost.visible = true; p.mesh.visible = true; }
        _v2.copy(c.fake.pos).lerp(c.H, easeInOut(seg(t, 0.5, 1.0))); FH.look(p, _v2); p.frame();
        c.ghost.visible = t < 1.4; Models.ghostMat.opacity = 0.35 * (1 - seg(t, 1.0, 1.4));
        if (t < this.rel) FH.hand(c); else FH.ball(c, t, this.rel, this.imp, c.C, 1);
        _v3.copy(c.Pf).addScaledVector(c.F0, -3.2).addScaledVector(c.camSide, -4.8).add(_v4.set(0, 1.5, 0));
        _v5.copy(c.Pf).addScaledVector(c.F0, 7).lerp(c.Q.pos, seg(t, 1.1, 1.5) * 0.7);
        if (t < 2.0) FH.script(_v3, _v5, 0); else { p.mesh.visible = false; FH.fp(); }
      }
      // keeper bites on the fake, frozen mid-dive
      if (c.K) {
        const u = easeOut(seg(t, 0.05, 0.6));
        c.K.pos.lerpVectors(c.K0, c.outcome === 'goal' ? c.Kfake : c.S, c.outcome === 'goal' ? u : easeInOut(seg(t, 0.05, this.imp - 0.05)));
        _v1.subVectors(c.outcome === 'goal' ? c.fake.pos : c.Q.pos, c.K.pos); c.K.lookDir(_v1); c.K.roll = u * (c.fake.pos.z > 0 ? -1 : 1) * 0.9; c.K.frame();
      }
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5); },
    cleanup(c) { Render.scene.remove(c.ghost); Models.ghostMat.opacity = 0.35; c.p.mesh.visible = false; },
  },
  sloth: {
    name: 'Sloth Grip Strike', gesture: '↑', desc: 'Swing under your broom as the threat passes overhead, then fire upside-down.', dur: 2.3, rel: 1.0, imp: 1.5, trail: [2.2, 2.2, 2.6], width: 0.35,
    tracks: {
      ts: [[0, 0.5], [0.25, 0.2], [0.95, 0.2], [1.0, 0.4], [1.5, 0.4], [1.52, 0.05], [1.8, 0.4], [2.3, 1]],
      blur: [[0, 0], [0.05, 0.08], [0.3, 0], [1.1, 0], [1.15, 0.08], [1.4, 0]],
      fov: [[0, 0], [0.3, 0.1], [0.9, 0.1], [1.5, 0.16], [2.3, 0]],
      flash: [[1.49, 0], [1.51, 0.7], [1.8, 0]],
      letterbox: [[0, 0], [0.2, 0.08], [1.9, 0.08], [2.3, 0]],
      ca: [[0, 0], [0.3, 0.006], [0.9, 0.006], [1.0, 0], [1.5, 0.012], [1.9, 0]],
    },
    setup(c) {
      let best = null, bd = 1e9;
      for (const f of Game.teams[1 - c.p.side]) { if (f.role === 'keeper' || f.scripted) continue; const d = f.pos.distanceTo(c.p.pos); if (d < bd) { bd = d; best = f; } }
      c.threat = best; if (best) { best.scripted = true; c.scriptedExtra.push(best); }
    },
    update(c, t) {
      const p = c.p;
      p.pos.copy(c.P0).addScaledVector(c.F0, 8 * t).addScaledVector(UP, -0.9 * easeInOut(seg(t, 0, 0.3)) + 0.9 * easeInOut(seg(t, 1.1, 1.4)));
      _v2.copy(c.P0).addScaledVector(c.F0, 30).lerp(c.H, smoothstep(0.5, 1.0, t)); FH.look(p, _v2);
      p.extraRoll = (Math.PI * easeInOut(seg(t, 0, 0.3)) - Math.PI * easeInOut(seg(t, 1.1, 1.4))) * RM(); p.frame(); FH.fp();
      if (c.threat) {
        const u = seg(t, 0.15, 0.95);
        c.threat.pos.copy(p.pos).addScaledVector(c.F0, lerp(18, -10, u)).addScaledVector(UP, 1.6);
        _v1.copy(c.F0).negate(); c.threat.lookDir(_v1); c.threat.frame();
      }
      if (t < this.rel) FH.hand(c); else FH.ball(c, t, this.rel, this.imp, c.C, 1);
      FH.keeper(c, 0.8, this.imp - 0.04, t);
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5).add(_v1.set(0, 1.5, 0)); },
  },
  hawkshead: {
    name: 'Hawkshead Overload', gesture: 'PASS ×3', desc: 'One-touch passing in slow motion through both teammates’ eyes, then the volley.', dur: 2.6, rel: 0.0, imp: 2.05, trail: [2.6, 2.0, 0.8], width: 0.3,
    tracks: {
      ts: [[0, 0.35], [2.0, 0.35], [2.05, 0.05], [2.3, 0.4], [2.6, 1]],
      flash: [[0.44, 0], [0.46, 0.4], [0.55, 0], [0.89, 0], [0.91, 0.4], [1.0, 0], [1.34, 0], [1.36, 0.4], [1.45, 0], [2.04, 0], [2.06, 0.75], [2.35, 0]],
      letterbox: [[0, 0], [0.2, 0.08], [2.3, 0.08], [2.6, 0]],
      fov: [[0, 0], [1.35, 0.05], [2.05, 0.16], [2.6, 0]],
      sat: [[0, 0.9], [2.05, 0.9], [2.1, 1.3], [2.6, 1]],
    },
    setup(c) {
      const mates = Game.teams[c.p.side].filter(f => f.role === 'chaser' && f !== c.p).sort((a, b) => _v1.subVectors(a.pos, c.p.pos).dot(c.p.right) - _v2.subVectors(b.pos, c.p.pos).dot(c.p.right));
      c.T1 = mates[0]; c.T2 = mates[1]; for (const m of mates) { m.scripted = true; c.scriptedExtra.push(m); }
      c.dir = _v1.subVectors(c.H, c.P0).setY(0).normalize().clone(); c.side = new THREE.Vector3().crossVectors(c.dir, UP).normalize();
      c.a = new THREE.Vector3(); c.b = new THREE.Vector3(); c.cpt = new THREE.Vector3();
    },
    update(c, t) {
      const p = c.p;
      p.pos.copy(c.P0).addScaledVector(c.dir, 9 * t);
      const t1p = _v3.copy(p.pos).addScaledVector(c.side, -7).addScaledVector(c.dir, 3).add(_v4.set(0, 1, 0));
      const t2p = _v5.copy(p.pos).addScaledVector(c.side, 7).addScaledVector(c.dir, 3).add(_v4.set(0, -0.5, 0));
      if (c.T1) { c.T1.pos.copy(t1p); FH.look(c.T1, c.H); c.T1.frame(); }
      if (c.T2) { c.T2.pos.copy(t2p); FH.look(c.T2, c.H); c.T2.frame(); }
      FH.look(p, c.H); p.frame();
      const leg = (a, b, t0, t1) => { const u = seg(t, t0, t1); c.cpt.copy(a).lerp(b, 0.5).y += 1.2; bezier(c.Q.pos, a, c.cpt, b, u); };
      p.hand(c.a);
      if (t < 0.45) leg(c.a, t1p, 0, 0.45);
      else if (t < 0.9) leg(t1p, t2p, 0.45, 0.9);
      else if (t < 1.35) leg(t2p, c.a, 0.9, 1.35);
      else if (t < 1.45) c.Q.pos.copy(c.a);
      else { if (!c.vol) { c.vol = true; c.R.copy(c.a); c.C = c.R.clone().lerp(c.E, 0.5); Sound.play('throw'); Game.throwAnim = 0.3; } FH.ball(c, t, 1.45, this.imp, c.C, 1); }
      if (t >= 0.45 && t < 0.9 && c.T1) FH.script(_v6.copy(t1p).add(_v4.set(0, 0.7, 0)), t2p);
      else if (t >= 0.9 && t < 1.35 && c.T2) FH.script(_v6.copy(t2p).add(_v4.set(0, 0.7, 0)), p.pos);
      else FH.fp();
      for (const k of [0.44, 0.89, 1.34]) if (t > k && !c['cut' + k]) { c['cut' + k] = true; Sound.play('catch', { vol: 0.8 }); Sound.play('throw', { vol: 0.6 }); }
      FH.keeper(c, 1.4, this.imp - 0.04, t);
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5); },
  },
  longbomb: {
    name: 'Long Bomb', gesture: 'AUTO 40m+', desc: 'From long range the camera rides the Quaffle all the way to the hoop.', dur: 3.0, rel: 0.25, imp: 2.3, trail: [2.4, 1.6, 0.7], width: 0.45,
    tracks: {
      ts: [[0, 0.6], [0.3, 0.3], [2.2, 0.3], [2.3, 0.05], [2.55, 0.3], [3.0, 1]],
      blur: [[0, 0], [0.3, 0.04], [2.25, 0.04], [2.3, 0]],
      fov: [[0, 0], [0.3, 0.25], [2.25, 0.2], [2.3, 0.1], [3.0, 0]],
      flash: [[2.29, 0], [2.31, 0.8], [2.6, 0]],
      letterbox: [[0, 0], [0.3, 0.1], [2.7, 0.1], [3.0, 0]],
      ca: [[0, 0], [0.3, 0.006], [2.3, 0.01], [2.8, 0]],
      sat: [[0, 1], [0.3, 0.85], [2.3, 0.85], [2.35, 1.3], [3.0, 1]],
    },
    update(c, t) {
      const p = c.p;
      p.pos.copy(c.P0).addScaledVector(c.F0, 10 * t); FH.look(p, c.H); p.frame();
      if (t < this.rel) { FH.hand(c); FH.fp(); }
      else {
        FH.ball(c, t, this.rel, this.imp, c.C, 1);
        if (t < this.imp + 0.25) {
          const u = seg(t, this.rel, this.imp);
          bezier(_v2, c.R, c.C, c.E, Math.min(1, u + 0.02)); bezier(_v3, c.R, c.C, c.E, Math.max(0, u - 0.02));
          _v4.subVectors(_v2, _v3).normalize();
          if (t > this.imp) _v4.copy(c.n);
          if (!c.camP) c.camP = new THREE.Vector3().copy(c.Q.pos);
          if (t <= this.imp) c.camP.copy(c.Q.pos).addScaledVector(_v4, -2.4).add(_v5.set(0, 0.45, 0)).addScaledVector(_v6.crossVectors(_v4, UP).normalize(), Math.sin(t * 3) * 0.3);
          FH.script(c.camP, _v2.copy(c.Q.pos).addScaledVector(_v4, 4));
        } else FH.fp();
      }
      FH.keeper(c, 0.9, this.imp - 0.02, t);
      if (t > 0.3 && !c.air) { c.air = true; Sound.play('rise', { vol: 0.8 }); }
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5).add(_v1.set(0, c.R.distanceTo(c.E) * 0.12, 0)); },
  },
  thunder: {
    name: 'Thunderclap', gesture: 'AUTO BOOST', unlock: 'thunder', desc: 'Full boost, point blank. A sonic ring, a white flash, a spinning hoop.', dur: 1.9, rel: 0.36, imp: 0.62, trail: [4, 4, 4], width: 0.6,
    tracks: {
      ts: [[0, 1], [0.28, 0.1], [0.36, 0.05], [0.4, 0.3], [0.62, 0.3], [0.64, 0.03], [0.9, 0.3], [1.9, 1]],
      flash: [[0.29, 0], [0.31, 0.9], [0.5, 0], [0.61, 0], [0.63, 0.6], [0.85, 0]],
      fov: [[0, 0], [0.3, 0.3], [0.62, 0.1], [1.9, 0]],
      ca: [[0, 0], [0.3, 0.02], [0.7, 0.005], [1.2, 0]],
      blur: [[0, 0], [0.3, 0.15], [0.6, 0.05], [0.8, 0]],
      letterbox: [[0, 0], [0.2, 0.07], [1.6, 0.07], [1.9, 0]],
    },
    update(c, t) {
      const p = c.p;
      p.pos.copy(c.P0).addScaledVector(c.F0, 8 * t); FH.look(p, c.H); p.frame(); FH.fp();
      if (t > 0.28 && !c.boom) {
        c.boom = true; Sound.play('boom'); Cam.addShake(1.4); Platform.vibrate([60, 20, 90]);
        for (let i = 0; i < 4; i++) FX.ring(_v2.copy(p.pos).addScaledVector(c.F0, 1 + i * 1.2), linCol(2.5, 2.6, 3), 6 + i * 3, 0.5 + i * 0.1, 0.9);
        FX.smoke(_v2.copy(p.pos).addScaledVector(c.F0, 2), linCol(0.9, 0.92, 0.95), 2.5, 10, { a: 0.35, speed: 4 });
      }
      if (t < this.rel) FH.hand(c); else FH.ball(c, t, this.rel, this.imp, c.C, 1);
      FH.keeper(c, 0.2, this.imp - 0.02, t);
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5); },
    onImpact(c) { c.hoop.spin = 24; FX.sparks(c.H, linCol(4, 4, 4), 50, 18); },
  },
  starfall: {
    name: 'Starfall', gesture: 'AUTO SS RANK', unlock: 'starfall', desc: 'Rocket into a night sky and bring the Quaffle down like a meteor.', dur: 3.4, rel: 1.3, imp: 2.35, trail: [3, 2.4, 1.2], width: 0.9,
    tracks: {
      ts: [[0, 0.5], [1.0, 0.2], [2.3, 0.2], [2.35, 0.04], [2.7, 0.3], [3.4, 1]],
      fov: [[0, 0], [0.5, 0.15], [1.1, 0.05], [2.35, 0.2], [3.4, 0]],
      flash: [[2.34, 0], [2.36, 0.9], [2.8, 0]],
      letterbox: [[0, 0], [0.3, 0.1], [3.0, 0.1], [3.4, 0]],
      sat: [[0, 1], [0.9, 1.15], [2.35, 1.15], [2.4, 1.4], [3.4, 1]],
      bloom: [[0, 0], [2.35, 0], [2.4, 0.8], [3.2, 0]],
      night: [[0, 0], [0.3, 0], [0.9, 1], [2.6, 1], [3.3, 0]],
    },
    setup(c) { c.Z = c.H.clone().addScaledVector(c.n, -12).add(_v1.set(0, 46, 0)); c.C1 = c.P0.clone().add(_v1.set(0, 30, 0)); },
    update(c, t) {
      const p = c.p;
      bezier(p.pos, c.P0, c.C1, c.Z, easeInOut(seg(t, 0, 1.05)));
      _v2.copy(c.P0).addScaledVector(c.F0, 20).add(_v3.set(0, 100, 0)).lerp(c.H, smoothstep(0.55, 1.1, t)); FH.look(p, _v2); p.frame(); FH.fp();
      if (t < this.rel) FH.hand(c);
      else {
        FH.ball(c, t, this.rel, this.imp, c.C, 1.4);
        if (t < this.imp) { FX.sparks(c.Q.pos, linCol(3, 2.2, 1), 4, 6, { grav: 2, life: 0.8 }); FX.glow(c.Q.pos, linCol(1.6, 1.3, 0.7), 1.6, 0.12); if (Math.random() < 0.3) FX.star(_v3.copy(c.Q.pos).add(_v4.randomDirection().multiplyScalar(2)), linCol(3, 3, 3), 0.8, 0.4); }
      }
      FH.keeper(c, 1.4, this.imp - 0.04, t);
    },
    onRelease(c) { c.C = c.R.clone().lerp(c.E, 0.5).addScaledVector(c.n, 3); },
    onImpact(c) {
      const T = CONFIG.teams[Game.houses[c.p.side]];
      for (let i = 0; i < 6; i++) Game.after(0.1 + i * 0.22, () => FX.firework(_v1.set(rnd(-90, 90), rnd(40, 65), rnd(-50, 50)), new THREE.Color(i % 2 ? T.c1 : T.c2).multiplyScalar(1.6)));
      FX.ring(_v1.set(c.H.x, 0.4, c.H.z), linCol(2.4, 2, 1.2), 50, 1.3);
    },
  },
};

const Finishers = {
  active: null, t: 0, ctx: null, speed: 1, order: ['comet', 'corkscrew', 'feint', 'sloth', 'hawkshead', 'longbomb', 'thunder', 'starfall'],
  unlocked(id) { const d = FIN_DEFS[id]; return !d.unlock || SaveData.unlocked[d.unlock] || Game.mode === 'lab'; },
  hawksheadOK() {
    const p = Game.player; if (!p) return false;
    const m = Game.teams[p.side].filter(f => f.role === 'chaser' && f !== p && !f.scripted && f.stun <= 0);
    return m.length >= 2 && m.every(f => f.pos.distanceTo(p.pos) < 45);
  },
  pick(gesture) {
    const p = Game.player, h = Game.targetHoop(), d = h.pos.distanceTo(p.pos);
    const map = { down: 'comet', circle: 'corkscrew', left: 'feint', right: 'feint', up: 'sloth', hawkshead: 'hawkshead' };
    if (map[gesture]) return map[gesture];
    if (this.unlocked('starfall') && Game.style.rank >= 5) return 'starfall';
    if (this.unlocked('thunder') && Game.time - p.lastBoostT < 1.5 && d < 32) return 'thunder';
    if (d > 40) return 'longbomb';
    if (p.pos.y > h.pos.y + 5) return 'comet';
    return pick(['corkscrew', 'feint', 'comet', 'sloth']);
  },
  trigger(gesture) {
    const p = Game.player, Q = Game.quaffle;
    const id = this.pick(gesture), def = FIN_DEFS[id];
    const c = this.ctx = { id, def, p, Q, scriptedExtra: [], tmp: [], R: new THREE.Vector3(), E: new THREE.Vector3() };
    const T = CONFIG.teams[Game.houses[p.side]]; c.col1 = T.c1; c.col2 = T.c2;
    c.hoop = id === 'feint' ? FIN_DEFS.feint.pickHoops(c, gesture) : Game.targetHoop();
    c.H = c.hoop.pos.clone(); c.n = c.hoop.normal.clone();
    c.P0 = p.pos.clone(); c.F0 = p.fwd.clone(); c.R0 = p.right.clone();
    c.K = Game.keeper(1 - p.side); c.K0 = c.K ? c.K.pos.clone() : null;
    c.outcome = Math.random() < Game.diff.finisherSave && Game.mode !== 'lab' ? 'save' : 'goal';
    const speedF = clamp(p.vel.length() / 38, 0, 1), rankF = Game.style.val / 6, recent = Game.rtime - Game.style.lastT < 2.5 ? 0.18 : 0;
    const score = speedF * 0.35 + rankF * 0.5 + recent + (id === 'starfall' ? 0.3 : 0);
    c.rating = score > 0.72 ? 'LEGENDARY' : score > 0.42 ? 'SPECTACULAR' : 'STYLISH';
    c.S = c.H.clone().addScaledVector(c.n, -1.3).add(_v1.set(0, 0.2, 0));
    const off = Math.random() < 0.5 ? -1 : 1;
    c.W = c.H.clone().addScaledVector(c.n, -1.7).add(_v1.set(0, 1.5 * off, 1.3 * -off));
    c.diveRoll = (c.W.z - c.H.z) > 0 ? -1.1 : 1.1;
    c.E.copy(c.outcome === 'goal' ? c.H : c.S);
    if (c.K) { c.K.scripted = true; c.K.hasBall = false; }
    p.scripted = true; p.dodge = null; p.extraPitch = 0;
    Q.state = 'scripted'; Q.trail.reset(); Q.trail.active = false;
    Game.state = 'finisher'; Game.flair = 0; Game.stats.finishers++;
    this.active = def; this.t = 0; this.speed = Settings.finisherLen === 'short' ? 1.6 : 1;
    this.baseSat = Render.post.fx.sat; this.baseBloom = Render.post.fx.bloom;
    Render.post.fx.keepColor.set(T.c1).lerp(new THREE.Color(T.c2), 0.15);
    if (def.setup) def.setup(c);
    HUD.cinematic(true);
    Sound.play('rise', { vol: 0.7 }); Platform.vibrate(20);
    if (Sound.music) Game.after(Math.max(0, (def.imp - 0.3) / this.speed), () => Sound.music && Sound.music.duck(1.4));
    if (def.rel <= 0) this.doRelease();
  },
  doRelease() {
    const c = this.ctx, def = c.def;
    c.released = true; c.p.hasBall = false;
    if (def.rel > 0) FH.release(c); else c.p.hand(c.R);
    if (def.onRelease) def.onRelease(c);
    if (!c.C) c.C = c.R.clone().lerp(c.E, 0.5);
    const Q = c.Q; Q.trail.reset(); Q.trail.active = true; Q.trail.width = def.width; Q.trail.u.uColor.value.setRGB(...def.trail);
    if (def.rel > 0) { Sound.play('throw'); Game.throwAnim = 0.3; Platform.vibrate(15); }
  },
  update(rdt) {
    const def = this.active, c = this.ctx; if (!def) return;
    this.t += rdt * this.speed; const t = this.t, tr = def.tracks, fx = Render.post.fx;
    Game.ts = tr.ts ? sampleTrack(tr.ts, t) : 1;
    const rm = RM();
    if (tr.night) World.applySky(sampleTrack(tr.night, t));
    fx.blur = sampleTrack(tr.blur, t) * rm; fx.ca = sampleTrack(tr.ca, t) * rm; fx.flash = sampleTrack(tr.flash, t);
    fx.letterbox = sampleTrack(tr.letterbox, t); fx.keepHue = sampleTrack(tr.keepHue, t);
    fx.sat = this.baseSat * (tr.sat ? sampleTrack(tr.sat, t) : 1); fx.bloom = this.baseBloom + sampleTrack(tr.bloom, t);
    Cam.sFov = 1 + sampleTrack(tr.fov, t) * (rm ? 1 : 0.3);
    if (!c.released && t >= def.rel) this.doRelease();
    def.update(c, t);
    if (!c.impacted && t >= def.imp) this.impact();
    if (t >= def.dur) this.end();
  },
  impact() {
    const c = this.ctx, def = c.def; c.impacted = true;
    const Tm = CONFIG.teams[Game.houses[c.p.side]];
    if (c.outcome === 'goal') {
      c.hoop.glow = 1.6;
      FX.shockwave(c.H, linCol(2.8, 2.1, 0.9), 14); FX.sparks(c.H, linCol(3, 2.1, 0.9), 60, 16);
      FX.confetti(_v1.copy(c.H).addScaledVector(c.n, -6).add(_v2.set(0, 3, 0)), [new THREE.Color(Tm.c1), new THREE.Color(Tm.c2), linCol(1, 1, 1)], 100, 9);
      Sound.play('impact'); Cam.addShake(1.0); Platform.vibrate([40, 30, 120]);
      if (def.onImpact) def.onImpact(c);
      const pts = FIN_RATING[c.rating];
      Game.goal(c.p.side, c.hoop, { finisher: def, scorer: c.p });
      Game.styleEvent(null, 0, pts);
      HUD.banner(def.name.toUpperCase(), '+10 · ' + pts + ' STYLE');
      HUD.stamp(c.rating, c.rating === 'LEGENDARY' ? 'legend' : c.rating === 'SPECTACULAR' ? 'spect' : '');
      const rk = ['STYLISH', 'SPECTACULAR', 'LEGENDARY'];
      if (!Game.stats.best || rk.indexOf(c.rating) >= rk.indexOf(Game.stats.best.rating)) Game.stats.best = { name: def.name, rating: c.rating };
      SaveData.finishers++; persist();
      if (c.rating === 'LEGENDARY') World.wave.amt = 1, Game.after(4, () => { World.wave.amt = 0; });
    } else {
      c.Q.attach(c.K); c.Q.trail.active = false;
      FX.sparks(c.S, linCol(2, 1.6, 1), 18, 6);
      Sound.play('denied'); Sound.crowdGroan(); Cam.addShake(0.4);
      HUD.stamp('DENIED', 'denied'); Game.onSave(c.K, c.p);
    }
  },
  skip() { if (!this.active || this.t < 0.5) return; if (!this.ctx.released) this.doRelease(); if (!this.ctx.impacted) this.impact(); this.end(); },
  end() {
    const c = this.ctx, def = this.active, p = c.p, fx = Render.post.fx;
    if (def.cleanup) def.cleanup(c);
    for (const tr of c.tmp) { tr.active = false; tr.reset(); }
    for (const f of c.scriptedExtra) { f.scripted = false; f.speed = CONFIG.flight.cruise; f.extraRoll = 0; f.frame(); f.vel.copy(f.fwd).multiplyScalar(f.speed); }
    if (c.K) { c.K.scripted = false; c.K.extraRoll = 0; c.K.roll = 0; c.K.ai.smooth = null; c.K.frame(); }
    p.scripted = false; p.extraRoll = 0; p.extraPitch = 0; p.pitch = clamp(p.pitch, -0.6, 0.6); p.speed = CONFIG.flight.cruise; p.frame(); p.vel.copy(p.fwd).multiplyScalar(p.speed); p.invuln = 1.0;
    p.mesh.visible = false;
    fx.blur = 0; fx.ca = 0; fx.flash = 0; fx.letterbox = 0; fx.keepHue = 0; fx.sat = this.baseSat; fx.bloom = this.baseBloom;
    if (def.tracks.night) World.applySky(0);
    Game.ts = 1; Cam.mode = 'fp'; Cam.sFov = 1;
    HUD.cinematic(false);
    const Q = c.Q;
    if (c.outcome === 'goal') {
      Q.state = 'free'; Q.vel.copy(c.n).multiplyScalar(5); Q.trail.active = false;
      if (Game.mode === 'lab') Game.after(0.6, () => { if (Game.mode === 'lab' && Game.state === 'play') Game.labReset(); });
      else { const k = c.K; Game.after(0.8, () => { if (k && !Q.holder && Game.state === 'play') Q.attach(k); }); }
    } else if (Game.mode === 'lab') Game.after(1.0, () => { if (Game.mode === 'lab' && Game.state === 'play') Game.labReset(); });
    this.active = null; this.ctx = null;
    if (Game.state === 'finisher') Game.state = 'play';
  },
};
