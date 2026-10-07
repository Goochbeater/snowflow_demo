/* ==== p77c_hl_qarcade.js ==== */
/* HOGWARTS — Quidditch, the arcade layer. What turns the match into a game you can pick up in a minute:
   · the arena: you cannot fly out of the stadium or lose the play in the sky; with the camera near level the broom
     finds the height of the play for you, and the last few yards to a ball or a rival are flown for you
   · F (or TAB) turns you to face the play; a marker (or an arrow at the edge of the screen) is always on the
     Quaffle, the hoop you are aiming at, the Bludger with your name on it and the Snitch; a radar shows the pitch
   · LMB without the Quaffle is a lunge that carries you into the rival who has it and comes away with the ball;
     LMB with it is a shot — hold to wind it up — at the hoop you are looking at
   · HOUSE SPIRIT builds with passes, steals, dodges and goals; full, the next shot is a Roaring Shot no Keeper stops
   · a rival's tackle on you is announced (a red mark, half a second) and a roll (R) inside it makes him miss */
(function () {
  const Q = HL.Q, C = HL.PITCH, U = HL.ui;
  const T1 = new THREE.Vector3(), T2 = new THREE.Vector3(), T3 = new THREE.Vector3(), T4 = new THREE.Vector3(), PV = new THREE.Vector3();
  IN.ACT.qfocus = { k: ['Tab', 'KeyF', 'KeyV'], p: 14 };
  const A = Q.arena = { BX: Q.AX + 4.5, BZ: Q.AZ + 4.5, TOP: 46, help: 0, focT: 0, offT: 0 };   // (inside the front rail of the stands: out among the towers the eye ended up behind canvas)
  Q.way = () => null;   // (the markers below replace the single quest diamond during a match)

  /* what the play is, for you, right now */
  Q.objective = function (face) {
    const B = Q.ball, me = Q.me; if (!Q.on || !B || !me) return null;
    if (me.role === 'seeker') return Q.snitch ? { p: Q.snitch.p, kind: 'snitch' } : null;
    if (Q.tut && Q.tut.obj) return { p: Q.tut.obj, kind: 'ring' };
    if (Q.snitch && B.holder !== me && !face) { /* (F still means the Quaffle) with the Snitch out, their Seeker is fair game: look his way and he is the play (the broom finds his height, F faces him, a lunge reaches him) */ const rs = Q.flyers.find((f) => f.team === 1 && f.role === 'seeker'); if (rs && rs.stunT <= 0) { const p = Q.pos(rs, T4), c = R.camera, to = T2.copy(p).sub(c.position), d = to.length(); if (d < 75 && to.normalize().dot(c.getWorldDirection(T1)) > 0.9) return { p, kind: 'rival', f: rs, seeker: true }; } }
    if (B.holder === me) { const h = Q.aimHoop || Q.hoops[1][1]; return { p: T4.set(h.x, h.y, h.z), kind: 'hoop', h }; }
    if (!B.holder) return { p: B.p, kind: 'ball' };
    return { p: Q.pos(B.holder, T4), kind: B.holder.team === 1 ? 'rival' : 'mate', f: B.holder };
  };
  Q.passMate = function () {
    const me = Q.me, cd = R.camera.getWorldDirection(T1); let best = null, bs = -1e9;
    for (const f of Q.flyers) { if (f.team !== 0 || f.role !== 'chaser' || f.isPlayer || f.stunT > 0) continue; const to = Q.pos(f, T2).sub(Q.pos(me, T3)), d = to.length(), sc = to.normalize().dot(cd) * 20 - d * 0.2 + (f.a.z - me.a.z) * 0.1; if (sc > bs) { bs = sc; best = f; } }
    return best;
  };

  /* ------------------------------------------------------------ the arena (hooks called from HL.fly.update) */
  A.steer = function (want, F, Rd, dt, thrust, ud) {
    const a = PLAYER.a; A.help = 0; if (Q.phase !== 'play') return;
    if (Q.lunge && Q.lunge.t > 0 && Q.lunge.f) {   // a lunge carries you at the one you went for
      const p = Q.pos(Q.lunge.f, T1), d = T2.set(p.x - a.x, p.y - a.y - 0.9, p.z - a.z), L = d.length();
      if (L < 14 && L > 0.01) { want.lerp(d.multiplyScalar(Math.max(want.length(), 35) / L), 0.8); return; } }
    const o = Q.objective(); if (!o || o.kind === 'mate') return;
    const dx = o.p.x - a.x, dy = o.p.y - (a.y + 0.9), dz = o.p.z - a.z, dh = Math.hypot(dx, dz), L = Math.hypot(dh, dy) || 1;
    // height: with the camera near level and no hand on SPACE / C, the broom finds the height of the play
    const w = ud ? 0 : 1 - sat((Math.abs(CAM.pitch + 0.08) - 0.16) / 0.26);
    if (w > 0 && (thrust || dh < 22)) { const near = sat((o.kind === 'hoop' ? 1.3 : 1.25) - dh / 65); want.y = lerp(want.y, clamp(dy * 2.4, -12, 12), w * near * 0.9); A.help = w * near; }
    // the last yards: flying roughly at it is enough
    if (o.kind !== 'hoop' && thrust && L < 15) { const sp = want.length(); if (sp > 1) { const dot = (want.x * dx + want.y * dy + want.z * dz) / (sp * L); if (dot > 0.5) want.lerp(T1.set(dx, dy, dz).multiplyScalar(sp / L), (0.25 + 0.55 * (1 - L / 15)) * sat((dot - 0.5) / 0.25)); } }
  };
  A.bound = function (a, F) {
    const dx = (a.x - C.x) / A.BX, dz = (a.z - C.z) / A.BZ, e = dx * dx + dz * dz;
    if (e > 1) { const k = 1 / Math.sqrt(e), nx = dx / A.BX, nz = dz / A.BZ, nl = Math.hypot(nx, nz) || 1; a.x = C.x + (a.x - C.x) * k; a.z = C.z + (a.z - C.z) * k; const vn = (F.vel.x * nx + F.vel.z * nz) / nl; if (vn > 0) { F.vel.x -= nx / nl * vn; F.vel.z -= nz / nl * vn; } }
    const top = Q.Y0 + A.TOP, bot = Q.Y0 + 1.7; if (a.y > top) { a.y = top; if (F.vel.y > 0) F.vel.y = 0; } if (a.y < bot) { a.y = bot; if (F.vel.y < 0) F.vel.y = 0; }
  };
  /* F / TAB: turn to face the play (tap), or keep facing it (hold) */
  A.cam = function (dt) {
    CAM.pitch = clamp(CAM.pitch, -0.95, 0.8); delete IN.buf.broom;
    // the rail turns you: flying out at the edge of the pitch, the view (and the broom with it) is brought round along the stands instead of grinding against them
    { const a = PLAYER.a, ex = (a.x - C.x) / A.BX, ez = (a.z - C.z) / A.BZ, e = Math.hypot(ex, ez); if (e > 0.8 && HL.fly.speed > 6) { let nx = ex / A.BX, nz = ez / A.BZ; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; const hx = Math.sin(CAM.yaw), hz = Math.cos(CAM.yaw), out = hx * nx + hz * nz;
        if (out > 0.05) { let tx = hx - nx * out * 1.25, tz = hz - nz * out * 1.25; if (Math.hypot(tx, tz) < 0.2) { tx = -nz; tz = nx; } CAM.yaw += wrapA(Math.atan2(tx, tz) - CAM.yaw) * (1 - Math.exp(-4.5 * sat((e - 0.8) / 0.17) * sat(out * 2.5) * dt)); } } }
    if (IN.take('qfocus')) A.focT = 0.42; if (IN.down('qfocus')) A.focT = Math.max(A.focT, 0.1);
    if (A.focT > 0) { A.focT -= dt; const o = Q.objective(true), a = PLAYER.a; if (o) { const dx = o.p.x - a.x, dy = o.p.y - (a.y + 1.2), dz = o.p.z - a.z, dh = Math.hypot(dx, dz);
        if (dh > 1.5) { const k = 1 - Math.exp(-13 * dt); CAM.yaw += wrapA(Math.atan2(dx, dz) - CAM.yaw) * k; CAM.pitch += (clamp(Math.atan2(dy, dh) * 0.85 - 0.06, -0.6, 0.6) - CAM.pitch) * k; } } }
  };

  /* ------------------------------------------------------------ House Spirit */
  Q.addMom = function (v) { if (Q.power || !Q.on) return; Q.mom = Math.min(1, (Q.mom || 0) + v); Q.momF = 1; if (Q.mom >= 1) { Q.power = true; U.pop('HOUSE SPIRIT — ROARING SHOT READY'); Q.excite = Math.max(Q.excite, 1.6); Q.say('The whole stand is on its feet!'); } };

  /* ------------------------------------------------------------ the Chaser's hands */
  Q.shoot = function (pw) {
    const B = Q.ball, me = Q.me, F = HL.fly, h = Q.aimHoop, power = !!Q.power; if (B.holder !== me) return;
    const p = power ? 1 : Math.max(0.3, pw), spread = power ? 0 : (1 - p) * 0.75, cd = R.camera.getWorldDirection(T1);
    const far = h && !power ? Math.max(0, Q.aimD - 22) * 0.07 : 0, sd = spread + far;   // (from range the hoop is a smaller thing to hit)
    const tgt = h ? V3(h.x + rnd(-sd, sd), h.y + rnd(-sd, sd) * 0.8, h.z) : Q.pos(me).addScaledVector(cd, 34), sp = (power ? 58 : 30 + 17 * p) + F.speed * 0.2;
    Q.throwBall(me, tgt, sp, true); const L = tgt.distanceTo(B.p); B.v.y += 3.5 * L / sp - L * 0.045;   // (lobbed to arrive at the hoop, not under it)
    B.shot.pw = p; B.shot.power = power; R.kick(0.2 + p * 0.25); Q.stats.shots++;
    if (power) { Q.power = false; Q.mom = 0; U.pop('ROARING SHOT!'); MG.slowmo = 0.45; MG.slowmoT = 0; MG.slowmoDur = 0.4; FX.addShake(0.3); Q.stats.power = (Q.stats.power || 0) + 1; Q.say('A Roaring Shot — nobody is stopping that!'); }
  };
  Q.doLunge = function () {
    const B = Q.ball, me = Q.me, F = HL.fly; if (Q.rsT > 0 && Q.rsTeam === 0 && !Q.snitch) { U.pop('FALL BACK — THEY RESTART'); Q.lgCd = 0.4; return; } Q.lgCd = 1.9;
    // whoever you could mean: the rival with the Quaffle, or their Seeker once the Snitch is out
    let f = null, bd = 12.5; for (const o of Q.flyers) { if (o.team !== 1 || o.stunT > 0 || o.role === 'keeper') continue; if (!(B.holder === o || (o.role === 'seeker' && Q.snitch))) continue; const d = Q.pos(o, T2).distanceTo(Q.pos(me, T3)); if (d < bd) { bd = d; f = o; } }
    Q.lunge = { t: 0.6, f }; F.speed = Math.min(46, F.speed + 12); R.kick(0.25);
  };
  Q.hands = function (dt) {
    const B = Q.ball, me = Q.me, a = PLAYER.a, cd = R.camera.getWorldDirection(T1).clone(); Q.lgCd = Math.max(0, (Q.lgCd || 0) - dt);
    if (B.holder === me) {
      // the hoop you are looking at (within reason) is the one the shot goes for
      let best = null, bs = 0.62; for (const h of Q.hoops[1]) { const to = T2.set(h.x - a.x, h.y - a.y - 0.9, h.z - a.z), dist = to.length(); if (dist > 72 || to.z < 2) continue; const ang = Math.acos(clamp(to.normalize().dot(cd), -1, 1)); if (ang < bs) { bs = ang; best = h; } }
      Q.aimHoop = best; Q.aimD = best ? Math.hypot(best.x - a.x, best.y - a.y - 0.9, best.z - a.z) : 1e9;
      if (IN.take('attack')) Q.chg = 0.001;
      if (Q.chg > 0) { if (IN.down('attack')) Q.chg = Math.min(1, Q.chg + dt / 0.7); else { Q.shoot(Q.chg); Q.chg = 0; } }
      if (IN.take('push') || IN.take('block')) { const m = Q.passMate(); if (m) { B.passTo = m; Q.throwBall(me, Q.pos(m).addScaledVector(m.vel, 0.4), 31, false); Q.stats.passes++; Q.chg = 0; } }
    } else { Q.chg = 0; Q.aimHoop = null;
      if (IN.take('attack') && Q.lgCd <= 0) Q.doLunge();
      Q.callCd = Math.max(0, (Q.callCd || 0) - dt); if (IN.take('push') || IN.take('block')) { const f = B.holder; if (f && f.team === 0 && !f.isPlayer && f.role === 'chaser' && f.stunT <= 0 && (f.holdT || 0) > 0.45 && Q.callCd <= 0) { Q.callCd = 2.2; B.passTo = me; Q.throwBall(f, Q.pos(me).addScaledVector(HL.fly.vel, 0.45), 31, false); U.pop('PASS!'); } } }
  };
  /* a rival's tackle on you that met a roll */
  Q.dodgedTk = function (f) { Q.stats.dodges++; U.pop('DODGED!'); MG.slowmo = 0.35; MG.slowmoT = 0; MG.slowmoDur = 0.3; f.stunT = 0.5; f.vel.multiplyScalar(0.4); Q.say('He rolls out of the tackle!'); };

  /* ------------------------------------------------------------ every frame of play (called from Q.update) */
  Q.arcade = function (dt) {
    const B = Q.ball, me = Q.me, a = PLAYER.a; if (!B) return; const S = A.st || (A.st = { goals: 0, dodges: 0, saves: 0 });
    // a roll begun with a Bludger bearing down on you is a dodge (it used to count only if the ball passed within three metres during the half-second of the spin — and the roll itself carries you further off than that)
    { const spin = HL.fly.spinT > 0; if (spin && !A.spin) { Q.rollAt = Q.t; for (const b of Q.bl) { if (b.park || b.tgt !== me || b.hitT > 0 || b.p.distanceTo(Q.pos(me, T2)) > 19) continue; Q.stats.dodges++; U.pop('DODGED!'); MG.slowmo = 0.35; MG.slowmoT = 0; MG.slowmoDur = 0.3; b.dodged = true; b.hitT = 1.6; b.tT = rnd(5, 8); const pool = Q.flyers.filter((f) => !f.isPlayer && f.role !== 'keeper'); b.tgt = pool.length ? pool[(RNG() * pool.length) | 0] : null; Q.say('Rolled clean out of its way!'); } } A.spin = spin; }
    // the lunge lands
    if (Q.lunge && Q.lunge.t > 0) { Q.lunge.t -= dt; const f = Q.lunge.f;
      if (f && f.stunT <= 0 && me.stunT <= 0 && Q.pos(f, T2).distanceTo(Q.pos(me, T3)) < 3.1) { const had = B.holder === f; Q.lunge.t = 0;
        if (had && !Q.tut && RNG() > Q.D.st) { /* he rides it */ U.pop('SHRUGGED OFF!'); HL.fly.speed *= 0.6; f.vel.multiplyScalar(1.15); FX.spark(Q.pos(f, T2), null, 8, 4, [2.4, 2.2, 2], 0.3); FX.addShake(0.2); Q.say('He rides the tackle and keeps going.'); return Q.arcade2(dt); }
        Q.knock(f, V3(f.a.x - a.x, 0.3, f.a.z - a.z).normalize()); MG.hitStop = 0.07; FX.addShake(0.35); Q.excite = Math.max(Q.excite, 1.1); Q.stats.tackles++;
        if (had) { B.holder = me; B.shot = null; B.lastTeam = 0; B.passTo = null; me.noCatch = 0; A.prev = me; a.play('catchQ', { fade: 0.06 }); U.pop('STOLEN!'); Q.say('Stripped clean — what a tackle!'); Q.addMom(0.1); Q.stats.steals = (Q.stats.steals || 0) + 1; }
        else if (f.role === 'seeker') { Q.race[1] = Math.max(0, Q.race[1] - 0.3); U.pop('SEEKER KNOCKED OFF!'); Q.say('Their Seeker is sent spinning — the Snitch is away again!'); Q.addMom(0.1); } } }
    Q.arcade2(dt);
  };
  Q.arcade2 = function (dt) {
    const B = Q.ball, me = Q.me, S = A.st;
    if (Q.rsT > 1.2 && Q.rsTeam === 0) me.noCatch = Math.max(me.noCatch, 0.15);   // (their restart is theirs)
    // a loose Quaffle near your hand comes to it (and a pass meant for you from further off)
    if (!B.holder && B.passTo && !B.passTo.isPlayer && !B.shot && B.passTo.stunT <= 0) { const to = Q.pos(B.passTo, T2).sub(B.p), d = to.length(); if (d < 6 && d > 0.01) B.v.addScaledVector(to, 22 * dt / d); }   // (a pass finds the hands it was thrown to)
    if (!B.holder && me.role !== 'seeker' && me.noCatch <= 0 && me.stunT <= 0 && !(B.shot && B.shot.team === 0) && !(B.passTo && B.passTo.team === 1)) { const to = Q.pos(me, T2).sub(B.p), d = to.length(), R0 = B.passTo === me ? 11 : 4.8;   /* (a rival's pass has to be cut out with the broom, not drawn in from seven metres) */ if (d < R0 && d > 0.01) B.v.addScaledVector(to, (B.passTo === me ? 40 : 28) * (1 - d / R0 * 0.5) * dt / d); }
    // who has it now, and how it got there
    if (B.holder !== A.prev) { const f = B.holder, th = A.thrown;
      if (f && th && !th.shot && th.by !== f) { if (f.team === th.team) { if (f.team === 0 && (f.isPlayer || th.by.isPlayer)) Q.addMom(0.06); } else if (f.isPlayer) { U.pop('INTERCEPTED!'); Q.addMom(0.08); Q.say('Picked out of the air!'); } }
      if (f) A.thrown = null; A.prev = f; }
    if (Q.stats.goals > S.goals) { Q.addMom(0.09 * (Q.stats.goals - S.goals)); S.goals = Q.stats.goals; }
    if (Q.stats.dodges > S.dodges) { Q.addMom(0.03 * (Q.stats.dodges - S.dodges)); S.dodges = Q.stats.dodges; }
    if (Q.stats.saves > S.saves) { Q.addMom(0.02); S.saves = Q.stats.saves; }
    Q.momF = Math.max(0, (Q.momF || 0) - dt * 1.6); Q.sayT = Math.max(0, (Q.sayT || 0) - dt);
    // a Roaring Shot burns through the air
    if (B.shot && B.shot.power && !B.holder && RNG() < dt * 90) FX.puff(B.p, 1, { add: true, size: 0.22, grow: 0.5, col: [3.4, 1.8, 0.5], a: 0.9, life: 0.45, spread: 0.12 });
    if (Q.tut && Q.tutUpdate) Q.tutUpdate(dt);
  };
  { const t0 = Q.throwBall; Q.throwBall = function (f, target, speed, shot) { const had = Q.ball && Q.ball.holder === f; t0.call(Q, f, target, speed, shot); if (had) A.thrown = { team: f.team, by: f, shot: !!shot }; }; }
  { const s0 = Q.start; Q.start = async function (opt) { const r = await s0.call(Q, opt); if (Q.on) { Q.mom = 0; Q.momF = 0; Q.power = false; Q.chg = 0; Q.lunge = null; Q.lgCd = 0; Q.race = [0, 0]; Q.aimHoop = null; A.prev = null; A.thrown = null; A.st = null; A.focT = 0; A.offT = 0; A.spin = false; Q.rollAt = -9; Q.callCd = 0; CAM.pitch = -0.08; Q.gb = null;
      /* a match is its own game on screen: the castle's vitals, potions and purse step aside, and the two sides are named in colours you can read */
      if (!document.getElementById('hlQmCss')) { const st = document.createElement('style'); st.id = 'hlQmCss'; st.textContent = '#hl.qmatch #hlVit, #hl.qmatch #hlGold, #hl.qmatch #hlPot, #hl.qmatch #hlPts, #hl.qmatch #hlWay { display: none !important; } #hl.qmatch #hlToast { top: 23%; }'; document.head.appendChild(st); }
      U.root.classList.add('qmatch'); U.el.Qa.style.color = lite(HL.HOUSES[Q.teams[0]].css, 0.42); U.el.Qb.style.color = lite(HL.HOUSES[Q.teams[1]].css, 0.42); if (Q.opt.tut && Q.tutBegin) Q.tutBegin(); } return r; }; }

  /* ------------------------------------------------------------ the match HUD: one canvas over the picture */
  const H = Q.hud = { cv: null, x: null, w: 0, h: 0, dpr: 1, vis: false, n: 0 };
  const lite = (css, k) => { const c = new THREE.Color(css), m = k === undefined ? 0.5 : k; return `rgb(${Math.round((c.r + (1 - c.r) * m) * 255)},${Math.round((c.g + (1 - c.g) * m) * 255)},${Math.round((c.b + (1 - c.b) * m) * 255)})`; };
  H.ensure = function () { if (H.cv) return; const cv = document.createElement('canvas'); cv.id = 'hlQhud'; cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;display:none'; (U.el.Hud || U.root).appendChild(cv); H.cv = cv; H.x = cv.getContext('2d'); };
  H.size = function () { const dpr = Math.min(1.5, window.devicePixelRatio || 1), w = U.root.clientWidth || window.innerWidth, h = U.root.clientHeight || window.innerHeight; if (H.w !== w || H.h !== h || H.dpr !== dpr) { H.w = w; H.h = h; H.dpr = dpr; H.cv.width = Math.round(w * dpr); H.cv.height = Math.round(h * dpr); } H.x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  H.proj = function (p) { const cam = R.camera; PV.copy(p).applyMatrix4(cam.matrixWorldInverse); const z = -PV.z, zz = Math.max(0.05, Math.abs(z)), t = Math.tan(cam.fov * Math.PI / 360), ax = PV.x / zz / (t * cam.aspect), ay = PV.y / zz / t;
    return { on: z > 0.3 && Math.abs(ax) < 0.93 && Math.abs(ay) < 0.86, x: (ax * 0.5 + 0.5) * H.w, y: (-ay * 0.5 + 0.5) * H.h, dx: PV.x, dy: PV.y, z, k: H.h / 2 / (t * zz) }; };
  const txt = (s, x0, y0, size, col, al, font) => { const x = H.x; x.font = (font || '600 ') + size + 'px HLA, Georgia, serif'; x.textAlign = al || 'center'; x.textBaseline = 'middle'; x.lineWidth = 3.5; x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,0.72)'; x.strokeText(s, x0, y0); x.fillStyle = col; x.fillText(s, x0, y0); };
  const ring = (x0, y0, r, col, lw) => { const x = H.x; x.beginPath(); x.arc(x0, y0, r, 0, TAU); x.lineWidth = (lw || 2) + 2.5; x.strokeStyle = 'rgba(0,0,0,0.42)'; x.stroke(); x.lineWidth = lw || 2; x.strokeStyle = col; x.stroke(); };
  const tri = (x0, y0, ang, s, col) => { const x = H.x; x.save(); x.translate(x0, y0); x.rotate(ang); x.beginPath(); x.moveTo(s, 0); x.lineTo(-s * 0.7, s * 0.72); x.lineTo(-s * 0.7, -s * 0.72); x.closePath(); x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.stroke(); x.fillStyle = col; x.fill(); x.restore(); };
  const bar = (x0, y0, w, h, v, col, back) => { const x = H.x; x.fillStyle = back || 'rgba(6,6,10,0.62)'; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); x.fillStyle = col; x.fillRect(x0, y0, w * sat(v), h); x.strokeStyle = 'rgba(217,184,106,0.5)'; x.lineWidth = 1; x.strokeRect(x0 - 1.5, y0 - 1.5, w + 3, h + 3); };
  /* a marker on a thing in the world: a ring and a word on it when it is in view, an arrow at the edge of the screen when it is not */
  const mark = (p, o) => { const q = H.proj(p); H.n++;
    if (q.on) { const r = o.r * (o.pulse ? 1 + 0.13 * Math.sin(MG.rt * 9) : 1); if (r > 0) ring(q.x, q.y, r, o.col, o.lw); if (o.label) txt(o.label, q.x, q.y - o.r - 13, o.size || 13, o.col); if (o.sub) txt(o.sub, q.x, q.y + o.r + 12, 11, 'rgba(240,232,214,0.92)'); return q; }
    if (o.edge === false) return q;
    let ux = q.dx, uy = q.dy; if (Math.hypot(ux, uy) < 0.001) { ux = 0; uy = -1; } const L = Math.hypot(ux, uy); ux /= L; uy /= L;
    const mx = H.w / 2 - 76, my = H.h / 2 - 104, k = 1 / Math.max(Math.abs(ux) / mx, Math.abs(uy) / my), ex = H.w / 2 + ux * k, ey = H.h / 2 - uy * k;
    ring(ex, ey, 13, o.col, 2.2); tri(ex + ux * 23, ey - uy * 23, Math.atan2(-uy, ux), 9, o.col); const lb = o.edgeLabel || o.label; if (lb) txt(lb, clamp(ex, 70, H.w - 70), ey + (ey > H.h - 150 ? -28 : 28), 11, o.col); q.off = true; return q; };
  H.radar = function (hc, rc) {
    const x = H.x, B = Q.ball, sc = clamp(H.h / 900, 0.8, 1.25), rw = 92 * sc, rh = rw * (Q.AZ + 6) / (Q.AX + 6) * 0.86, x0 = H.w - rw - 34, y0 = H.h - rh - 40, cx = x0 + rw / 2, cy = y0 + rh / 2, kx = rw / 2 / (Q.AX + 8), kz = rh / 2 / (Q.AZ + 8);
    const px = (wx) => cx - (wx - C.x) * kx, pz = (wz) => cy - (wz - C.z) * kz;
    x.beginPath(); x.ellipse(cx, cy, rw / 2, rh / 2, 0, 0, TAU); x.fillStyle = 'rgba(10,22,10,0.58)'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = 'rgba(217,184,106,0.6)'; x.stroke();
    x.beginPath(); x.moveTo(x0 + 4, cy); x.lineTo(x0 + rw - 4, cy); x.strokeStyle = 'rgba(240,240,225,0.25)'; x.lineWidth = 1; x.stroke();
    for (let s = 0; s < 2; s++) for (const h of Q.hoops[s]) { x.beginPath(); x.arc(px(h.x), pz(h.z), 3, 0, TAU); x.strokeStyle = s === 1 ? '#ffe28a' : 'rgba(255,240,200,0.5)'; x.lineWidth = 1.5; x.stroke(); }
    for (const f of Q.flyers) { if (f.isPlayer) continue; const fx = px(f.a.x), fz = pz(f.a.z); x.fillStyle = f.team === 0 ? hc : rc; x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = 1; x.beginPath(); if (f.role === 'keeper') x.rect(fx - 3, fz - 3, 6, 6); else x.arc(fx, fz, f.role === 'seeker' ? 2.2 : 3.2, 0, TAU); x.fill(); x.stroke(); }
    for (const b of Q.bl) { x.fillStyle = b.tgt === Q.me ? '#ff4a3a' : 'rgba(30,30,34,0.95)'; x.beginPath(); x.arc(px(b.p.x), pz(b.p.z), 2.4, 0, TAU); x.fill(); }
    if (Q.snitch) { x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(px(Q.snitch.p.x), pz(Q.snitch.p.z), 2.6 + Math.sin(MG.rt * 12) * 0.8, 0, TAU); x.fill(); }
    if (B) { const bx = px(B.p.x), bz = pz(B.p.z); x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, bz, 2.6, 0, TAU); x.fill(); x.strokeStyle = B.holder ? (B.holder.team === 0 ? hc : rc) : '#ffe9a8'; x.lineWidth = 1.6; x.beginPath(); x.arc(bx, bz, 5.5, 0, TAU); x.stroke(); }
    { const a = PLAYER.a, yw = HL.fly.R ? HL.fly.R.yaw : a.yaw, fx = -Math.sin(yw), fz = -Math.cos(yw), mx2 = px(a.x), mz2 = pz(a.z); x.fillStyle = '#fff'; x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(mx2 + fx * 7, mz2 + fz * 7); x.lineTo(mx2 - fx * 4 - fz * 4.5, mz2 - fz * 4 + fx * 4.5); x.lineTo(mx2 - fx * 4 + fz * 4.5, mz2 - fz * 4 - fx * 4.5); x.closePath(); x.fill(); x.stroke(); }
    txt('▲ ATTACK', cx, y0 - 10, 9.5, 'rgba(255,226,138,0.9)');
  };
  H.draw = function () {
    if (!Q.on || !Q.me || Q.phase === 'intro' || Q.phase === 'off' || MG.state !== 'play' || CAM.cine) { if (H.vis) { H.cv.style.display = 'none'; H.vis = false; } return; }
    H.ensure(); if (!H.vis) { H.cv.style.display = 'block'; H.vis = true; } H.size(); const x = H.x; x.clearRect(0, 0, H.w, H.h); H.n = 0;
    const B = Q.ball, me = Q.me, a = PLAYER.a, W = H.w, Hh = H.h, cx = W / 2, cy = Hh / 2, hc = lite(HL.HOUSES[Q.teams[0]].css, 0.45), rc = lite(HL.HOUSES[Q.teams[1]].css, 0.45), play = Q.phase === 'play', mp = Q.pos(me, T3).clone(), dt = MG.rdt || 0.016;
    let prompt = null, objOff = false;
    if (play && B) {
      // friend and foe at a glance
      for (const f of Q.flyers) { if (f.isPlayer) continue; const q = H.proj(T1.set(f.a.x, f.a.y + 2.25, f.a.z)); if (!q.on || q.z > 85) continue; x.globalAlpha = sat(1.15 - q.z / 85) * 0.85; tri(q.x, q.y, HALF, 5.5, f.team === 0 ? hc : rc); x.globalAlpha = 1;
        if (f.wind > 0) { ring(q.x, q.y + 4, 15 + 10 * f.wind, '#ff4a3a', 3); txt('!', q.x, q.y + 4, 22, '#ff4a3a'); prompt = ['DODGE!', 'R  to roll']; } }
      if (Q.tut && Q.tut.obj) { const q = mark(Q.tut.obj, { col: '#ffd24a', r: 17, label: 'RING', sub: Math.round(Q.tut.obj.distanceTo(mp)) + ' m', pulse: true, lw: 2.5 }); objOff = !!q.off; }
      if (me.role !== 'seeker' && !(Q.tut && Q.tut.quiet)) {
        if (B.holder === me) {
          for (const h of Q.hoops[1]) { const q = H.proj(T1.set(h.x, h.y, h.z)); if (!q.on) continue; const rr = clamp(1.72 * q.k, 5, 150), sel = h === Q.aimHoop; ring(q.x, q.y, rr, sel ? '#ffe28a' : 'rgba(255,240,200,0.32)', sel ? 3 : 1.4); H.n++;
            if (sel) { const inR = Q.aimD < 32; txt(inR ? (Q.power ? 'ROARING SHOT' : 'SHOOT') : Math.round(Q.aimD) + ' m', q.x, q.y - rr - 15, 14, inR ? '#ffe28a' : '#efe6d2'); if (inR && !Q.chg) txt('LMB · hold to wind up', q.x, q.y + rr + 13, 11, 'rgba(240,232,214,0.9)'); } }
          if (!Q.aimHoop) { const h = Q.hoops[1][1], q = mark(T1.set(h.x, h.y, h.z), { col: '#ffe28a', r: 0, edgeLabel: 'THE HOOPS' }); objOff = !!q.off; }
          const m = Q.passMate(); if (m) { const q = H.proj(Q.pos(m, T1)); if (q.on) { ring(q.x, q.y, 16, hc, 1.6); txt('E  pass', q.x, q.y + 28, 11, hc); } }
        } else if (!B.holder) { const d = B.p.distanceTo(mp), q = mark(B.p, { col: '#ffe9a8', r: 15, label: B.passTo === me ? 'YOURS!' : 'QUAFFLE', sub: Math.round(d) + ' m', pulse: true, lw: 2.5 }); objOff = !!q.off; }
        else if (B.holder.team === 1) { const p = Q.pos(B.holder, T1), d = p.distanceTo(mp), q = mark(p, { col: '#ff6a5a', r: 21, label: d < 17 ? 'TACKLE' : 'RIVAL HAS IT', sub: d < 17 ? 'LMB' : Math.round(d) + ' m', lw: 2.5, edgeLabel: 'QUAFFLE' }); objOff = !!q.off; }
        else { const q = mark(Q.pos(B.holder, T1), { col: hc, r: 19, label: 'CALL FOR IT', sub: 'E', lw: 2.2, edgeLabel: 'YOUR CHASER' }); objOff = !!q.off; }
        if (Q.snitch) { const rs = Q.flyers.find((f) => f.team === 1 && f.role === 'seeker'); if (rs && rs.stunT <= 0 && B.holder !== me) { const p = Q.pos(rs, T1).clone(), d = p.distanceTo(mp); mark(p, { col: '#ff9a5a', r: 17, label: d < 17 ? 'KNOCK HIM OFF IT' : 'THEIR SEEKER', sub: d < 17 ? 'LMB' : Math.round(d) + ' m', edgeLabel: 'THEIR SEEKER' }); } }
      }
      for (const b of Q.bl) { if (b.tgt !== me || b.hitT > 0) continue; const d = b.p.distanceTo(mp); if (d > 46) continue; mark(b.p, { col: '#ff4a3a', r: 12, label: 'BLUDGER', pulse: true, lw: 2.5 }); if (d < 17 && !(HL.fly.spinT > 0)) prompt = ['BLUDGER!', 'R  to roll']; }
      if (Q.snitch) { const d = Q.snitch.p.distanceTo(mp), q = mark(Q.snitch.p, { col: '#ffd24a', r: 10, label: 'SNITCH', sub: Math.round(d) + ' m', pulse: true, lw: 2.5 }); if (me.role === 'seeker') objOff = !!q.off; }
      // out of sight for a moment: say how to find it
      A.offT = objOff ? A.offT + dt : 0; if (A.offT > 0.9 && !prompt) txt('F  — face the play', cx, Hh - 208, 14, 'rgba(255,226,138,' + (0.6 + 0.4 * Math.sin(MG.rt * 6)).toFixed(2) + ')');
      if (prompt) { const k = 1 + 0.08 * Math.sin(MG.rt * 18); txt(prompt[0], cx, cy + 118, 30 * k, '#ff5a48'); txt(prompt[1], cx, cy + 148, 15, '#ffe6dc'); }
      // the wind-up of a shot, round the crosshair
      if (Q.chg > 0) { x.beginPath(); x.arc(cx, cy, 24, -HALF, -HALF + TAU * Q.chg); x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,0.5)'; x.stroke(); x.lineWidth = 3; x.strokeStyle = Q.chg >= 1 ? '#fff3c4' : '#ffd24a'; x.stroke(); }
      // the Seekers' race for the Snitch
      if (Q.snitch && me.role !== 'seeker') { const y0 = 118, w = 150; txt('YOUR SEEKER', cx - 14, y0, 10.5, hc, 'right'); bar(cx - 14 - w, y0 + 9, w, 6, Q.race[0], hc); txt('THEIR SEEKER', cx + 14, y0, 10.5, rc, 'left'); bar(cx + 14, y0 + 9, w, 6, Q.race[1], rc); txt('❂', cx, y0 + 8, 15, '#ffd24a'); }
    }
    // a goal, in letters you cannot miss
    if (Q.gb && Q.gb.t > 0) { const g = Q.gb, age = 2.3 - g.t, k = 1 + 0.6 * Math.exp(-9 * age), al = sat(g.t / 0.45), mine = g.team === 0, col = mine ? '#ffe28a' : rc; g.t -= dt; x.globalAlpha = al;
      txt(mine ? (g.val > 10 ? 'ROARING GOAL!' : 'GOAL!') : HL.HOUSES[Q.teams[1]].name.toUpperCase() + ' SCORE', cx, Hh * 0.385, (mine ? 66 : 40) * k * clamp(W / 1600, 0.7, 1.2), col); txt((mine ? '+' + g.val + '   ·   ' : '') + Q.score[0] + '  –  ' + Q.score[1], cx, Hh * 0.385 + (mine ? 54 : 40) * clamp(W / 1600, 0.7, 1.2), 20, '#efe6d2'); x.globalAlpha = 1; }
    // the commentary (never under a toast: the final whistle used to print its headline twice)
    if (Q.sayT > 0 && Q.sayS && !Q.tut && Q.phase !== 'over' && !HL.ui.el.Toast.classList.contains('on')) { x.globalAlpha = sat(Q.sayT / 0.5); txt('“' + Q.sayS + '”', cx, Q.snitch && me.role !== 'seeker' ? 158 : 122, 15, '#efe6d2', 'center', 'italic 500 '); x.globalAlpha = 1; }
    // House Spirit
    if (me.role !== 'seeker') { const w = 240, x0 = cx - w / 2, y0 = Hh - 52, m = Q.power ? 1 : (Q.mom || 0), fl = Q.momF || 0; bar(x0, y0, w, 7, m, Q.power ? `rgb(255,${200 + Math.round(40 * Math.sin(MG.rt * 10))},90)` : fl > 0 ? '#fff3c4' : '#d9a441');
      txt(Q.power ? 'ROARING SHOT READY' : 'HOUSE SPIRIT', cx, y0 + 20, 10.5, Q.power ? '#ffe28a' : 'rgba(217,184,106,0.95)'); }
    H.radar(hc, rc);
  };
  { const c0 = CAM.update; CAM.update = function (dt) { c0.call(CAM, dt); if (Q.on || H.vis) { const cam = R.camera; cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert(); try { H.draw(); } catch (e) { if (!H.err) { H.err = 1; MG.errors.push('qhud: ' + (e.stack || e)); } } } }; }
})();
