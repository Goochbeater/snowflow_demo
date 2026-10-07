/* ==== p77d_hl_qtutor.js ==== */
/* HOGWARTS — Quidditch: the flying lesson, and the match's own pause menu.
   The lesson is a match with nobody in it but you, one team-mate, one rival to practise on and their Keeper. Nine
   short steps, each asking for one thing and waiting until you have done it: fly the rings, turn and boost, find
   and catch the Quaffle, shoot, pass and call, take the ball off a rival, roll out of a Bludger's way, beat the
   Keeper, and let fly a Roaring Shot. ENTER skips a step. */
(function () {
  const Q = HL.Q, C = HL.PITCH, U = HL.ui;
  const K = (s) => `<kbd>${s}</kbd>`, PRAISE = ['WELL FLOWN!', 'THAT’S IT!', 'GOT IT!', 'GOAL!', 'LOVELY HANDS!', 'STOLEN!', 'DODGED!', 'WHAT A SHOT!', 'ROARING!'];
  const ringGeo = new THREE.TorusGeometry(3.3, 0.17, 8, 44);
  const setRings = (T, list) => { for (const r of T.rings) R.scene.remove(r.m); T.rings = list.map(([dx, h, dz], i) => { const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, fog: false }); mat.color.setRGB(3.0, 2.1, 0.6); const m = new THREE.Mesh(ringGeo, mat), p = V3(C.x + dx, Q.Y0 + h, C.z + dz); m.position.copy(p); m.visible = i === 0; R.scene.add(m); return { m, p }; });
    const a = PLAYER.a; T.rings.forEach((r, i) => { const q = i ? T.rings[i - 1].p : V3(a.x, a.y, a.z); r.m.rotation.y = Math.atan2(r.p.x - q.x, r.p.z - q.z); }); };
  const give = (f) => { const B = Q.ball; Q.arena.thrown = null; Q.arena.prev = f; B.holder = f; B.shot = null; B.lastTeam = f.team; B.passTo = null; f.noCatch = 0; f.holdT = 0; B.v.set(0, 0, 0); };
  const mineAgain = (T, dt, why) => { const B = Q.ball, me = Q.me; if (B.holder === me) { T.lost = 0; return; } T.lost = (T.lost || 0) + dt; if (T.lost > (B.holder ? 1.2 : B.shot && B.shot.team === 0 ? 3.2 : 2.4) && me.stunT <= 0) { give(me); T.lost = 0; if (why) U.pop(why); } };
  const STEPS = [
    { n: 'TAKE OFF', say: () => `Hold ${K('W')} to fly. The broom goes where you look — steer with the <b>mouse</b>. Fly through the golden rings.`, also: `${K('S')} brakes · ${K('SPACE')} / ${K('C')} rise and sink — though with the view level the broom finds the right height itself`,
      enter: (T) => setRings(T, [[0, 9, 10], [-13, 12, 36], [11, 8, 60]]), done: (T) => !T.rings.length },
    { n: 'TURN AND BOOST', say: () => `The next ring is far behind you. Tap ${K('F')} to turn and face it — then hold ${K('SHIFT')} as you fly to <b>boost</b>.`, also: 'the gold bar under your speed is your boost: it drains, and refills when you let go',
      enter: (T) => { setRings(T, [[0, 11, -58]]); T.boosted = 0; }, done: (T) => !T.rings.length,
      tick: (T) => { if (!T.rings.length && T.boosted < 0.5 && !T.again) { T.again = 1; setRings(T, [[0, 11, 56]]); U.pop('NOW WITH SHIFT — BOOST!'); } } },
    { n: 'THE QUAFFLE', say: () => `That is the Quaffle. ${K('F')} always turns you to face the play. Fly at the ball — get close and it jumps to your hand.`, also: 'a marker is always on it; when it is out of sight an arrow at the edge of the screen points the way',
      enter: (T) => { const B = Q.ball; B.holder = null; B.shot = null; T.pin = V3(C.x - 9, Q.Y0 + 9, C.z - 6); B.p.copy(T.pin); T.quiet = false; }, done: () => Q.ball.holder === Q.me },
    { n: 'SHOOT', say: () => `Fly at the far hoops. Look at one — it lights up — and click ${K('LMB')}. <b>Hold</b> the button to wind up a harder, straighter shot.`, also: 'ten points a goal · the ring on the hoop says SHOOT when you are in range',
      enter: (T) => { give(Q.me); T.s0 = Q.score[0]; }, done: (T) => Q.score[0] > T.s0, tick: (T, dt) => mineAgain(T, dt, 'AGAIN — CLOSER IN') },
    { n: 'PASS', say: (T) => T.sub ? `Good. Now press ${K('E')} again to <b>call for it</b> — your Chaser throws it back.` : `Your Chaser is flying beside you. Press ${K('E')} to <b>pass</b>.`, also: 'passing keeps the ball away from a tackler — and builds House Spirit',
      enter: (T) => { give(Q.me); T.sub = 0; }, done: (T) => T.sub === 2,
      tick: (T, dt) => { const B = Q.ball; if (T.sub === 0 && B.holder === T.mate) { T.sub = 1; Q.tutSay(); } else if (T.sub === 1 && B.holder === Q.me) T.sub = 2; T.lost = B.holder ? 0 : (T.lost || 0) + dt; if (T.lost > 1.3) { give(B.passTo === T.mate ? T.mate : Q.me); T.lost = 0; } } },   // (a pass that drifts wide is not the lesson: it is handed on)
    { n: 'TAKE IT BACK', say: () => `A rival has the Quaffle. Close in and click ${K('LMB')}: you <b>lunge</b> at him and come away with the ball.`, also: 'a lunge reaches a long way — fire it when the marker says TACKLE',
      enter: (T) => { give(T.dummy); T.carry = true; const d = T.dummy.a; d.x = C.x + 16; d.y = Q.Y0 + 10; d.z = C.z; }, done: () => Q.ball.holder === Q.me, tick: (T, dt) => { const B = Q.ball; T.lost = B.holder ? 0 : (T.lost || 0) + dt; if (T.lost > 2.5) { give(T.dummy); T.lost = 0; } }, leave: (T) => { T.carry = false; } },
    { n: 'ROLL', say: () => `Bludgers hunt players. When the warning flashes, press ${K('R')} to <b>barrel-roll</b> clear.`, also: 'the same roll beats a rival’s tackle: roll when the red mark shows over him',
      enter: (T) => { T.d0 = Q.stats.dodges; T.bT = 0.6; }, done: (T) => Q.stats.dodges > T.d0,
      tick: (T, dt) => { const b = Q.bl[0]; if (!b.park) { if (b.hitT > 0 || b.tgt !== Q.me) { b.park = true; T.bT = 2.2; } return; } T.bT -= dt; if (T.bT <= 0 && Q.me.stunT <= 0) { const a = PLAYER.a, f = HL.fly.R ? HL.fly.R.fw : V3(0, 0, 1); b.park = false; b.slow = 0.62; b.dodged = false; b.hitT = 0; b.m.visible = true; b.p.set(a.x + f.x * 46, clamp(a.y + 7, Q.Y0 + 6, Q.Y0 + 40), a.z + f.z * 46); b.v.set(-f.x * 8, 0, -f.z * 8); b.tgt = Q.me; b.tT = 60; U.pop('BLUDGER INCOMING'); } },
      leave: () => { for (const b of Q.bl) b.park = true; } },
    { n: 'BEAT THE KEEPER', say: () => `Now there is a Keeper — and he can only cover one hoop. Aim at an <b>open</b> one, wind the shot right up, and score.`, also: 'a shot he cannot reach is a goal; a tap from close in gives him an easy save',
      enter: (T) => { T.kp.script = null; give(Q.me); T.s0 = Q.score[0]; }, done: (T) => Q.score[0] > T.s0, tick: (T, dt) => mineAgain(T, dt, 'TRY THE OTHER HOOP') },
    { n: 'HOUSE SPIRIT', say: () => `Passes, steals, dodges and goals fill the <b>House Spirit</b> bar. It is full now: your next shot is a <b>Roaring Shot</b> — no Keeper stops it, and it counts double. Let fly!`, also: '',
      enter: (T) => { Q.mom = 1; Q.power = true; give(Q.me); T.s0 = Q.score[0]; }, done: (T) => Q.score[0] > T.s0, tick: (T, dt) => { mineAgain(T, dt); if (Q.ball.holder === Q.me && !Q.power) { Q.mom = 1; Q.power = true; } } },
  ];
  Q.TUT = STEPS;
  Q.tutSay = function () { const T = Q.tut, S = STEPS[T.i]; T.el.classList.remove('ok'); T.el.innerHTML = `<div class="t">FLYING LESSON · ${T.i + 1} OF ${STEPS.length} · ${S.n}</div><div class="b">${S.say(T)}</div>${S.also ? `<div class="k">${S.also}</div>` : ''}<div class="s">${K('ENTER')} skip this step · ${K('ESC')} menu</div>`; };
  Q.tutGo = function (i) { const T = Q.tut; if (T.i >= 0 && STEPS[T.i].leave) STEPS[T.i].leave(T); if (i >= STEPS.length) return Q.tutFinish(); T.i = i; T.t = 0; T.wait = 0; T.lost = 0; T.again = 0; STEPS[i].enter(T); Q.tutSay(); };
  Q.tutBegin = function () {
    if (!document.getElementById('hlQtutCss')) { const st = document.createElement('style'); st.id = 'hlQtutCss'; st.textContent = `#hlQtut { position: absolute; left: 50%; top: 22px; transform: translateX(-50%); width: min(660px, 84vw); text-align: center; background: linear-gradient(rgba(10,9,14,0.78), rgba(10,9,14,0.62)); border: 1px solid rgba(217,184,106,0.55); padding: 12px 24px 10px; text-shadow: 0 1px 3px #000; transition: border-color 0.2s, box-shadow 0.2s; }
#hlQtut.ok { border-color: #9be28a; box-shadow: 0 0 22px rgba(120,220,110,0.35); } #hlQtut .t { font-family: 'HLA', serif; font-size: 12px; letter-spacing: 0.28em; color: var(--gold); } #hlQtut .b { font-size: 19px; line-height: 1.35; margin: 6px 0 4px; color: #f3ead6; } #hlQtut .b b { color: #ffe28a; }
#hlQtut .k { font-size: 13.5px; font-style: italic; color: #cfc6b0; } #hlQtut .s { font-size: 11px; letter-spacing: 0.08em; color: #9a927e; margin-top: 6px; } #hlQtut kbd { display: inline-block; min-width: 18px; padding: 1px 6px; margin: 0 2px; border: 1px solid rgba(217,184,106,0.7); border-radius: 3px; background: rgba(0,0,0,0.45); font-family: 'HLA', serif; font-size: 0.8em; font-style: normal; color: #ffe9b0; }`; document.head.appendChild(st); }
    const T = Q.tut = { i: -1, t: 0, rings: [], obj: null, quiet: true, wait: 0, boosted: 0, story: !Q.opt.arcade }; let el = document.getElementById('hlQtut'); if (!el) { el = document.createElement('div'); el.id = 'hlQtut'; (U.el.Hud || U.root).appendChild(el); } el.style.display = 'block'; T.el = el;
    // the cast: one team-mate, one rival to practise on, their Keeper
    const keep = []; for (const f of Q.flyers) { if (f.isPlayer) keep.push(f); else if (!T.mate && f.team === 0 && f.role === 'chaser') { T.mate = f; keep.push(f); } else if (!T.dummy && f.team === 1 && f.role === 'chaser') { T.dummy = f; keep.push(f); } else if (!T.kp && f.team === 1 && f.role === 'keeper') { T.kp = f; keep.push(f); } else { f.R.dispose(); f.a.dispose(); } }
    Q.flyers = keep; for (const b of Q.bl) b.park = true;
    Q.T = 1e9; Q.snT = 1e9; Q.phase = 'play'; CAM.cine = null; CAM.reset(0); U.el.Q.classList.remove('on'); U.toastT = 0.01;
    // he rides off your right shoulder, a little ahead; the rival circles the middle with the ball when it is his turn; the Keeper waits at the side
    T.mate.script = (f, dt) => { const a = PLAYER.a, yw = HL.fly.R ? HL.fly.R.yaw : 0; Q.steer(f, clamp(a.x - Math.cos(yw) * 9 + Math.sin(yw) * 8, C.x - 26, C.x + 26), clamp(a.y + 0.9, Q.Y0 + 5, Q.Y0 + 30), clamp(a.z + Math.sin(yw) * 9 + Math.cos(yw) * 8, C.z - 74, C.z + 74), 27, dt, 2.6); };
    T.dummy.script = (f, dt) => { if (T.carry) { const t = MG.t * 0.32; Q.steer(f, C.x + Math.sin(t) * 16, Q.Y0 + 10 + Math.sin(t * 1.7) * 1.5, C.z + Math.cos(t) * 22, 9, dt, 2); } else Q.steer(f, C.x + 22, Q.Y0 + 16, C.z - 50, 14, dt, 2); };
    T.kp.script = (f, dt) => { f.face = PI; Q.steer(f, C.x + 24, Q.Y0 + 12, C.z + Q.HZ - 6, 10, dt, 2); };
    T.noCatch = (f) => (f === T.kp && T.kp.script) || (f === T.dummy && !T.carry) || (f === T.mate && STEPS[T.i].n !== 'PASS');
    give(T.dummy); Q.tutGo(0);
  };
  Q.tutUpdate = function (dt) {
    const T = Q.tut; if (!T || T.fin) return; const B = Q.ball, a = PLAYER.a, S = STEPS[T.i]; T.t += dt; Q.rsT = 0; if (HL.fly.boosting) T.boosted += dt;
    if (T.rings.length) { const r = T.rings[0]; T.obj = r.p; r.m.rotation.z += dt * 0.7; r.m.scale.setScalar(1 + 0.05 * Math.sin(MG.rt * 5));
      if (Math.hypot(a.x - r.p.x, a.y + 0.9 - r.p.y, a.z - r.p.z) < 3.6) { R.scene.remove(r.m); T.rings.shift(); T.ringN = (T.ringN || 0) + 1; if (HL.AU && HL.AU.ring) HL.AU.ring(T.ringN, T.rings.length ? 0 : T.ringN); FX.ring(r.p, [3, 2.2, 0.7], 6, 0.5); FX.spark(r.p, null, 30, 8, [3, 2.4, 1], 0.6); R.kick(0.15); if (T.rings.length) { T.rings[0].m.visible = true; U.pop('THROUGH!'); } } } else T.obj = null;
    if (T.pin) { if (B.holder) T.pin = null; else { B.p.copy(T.pin); B.v.set(0, 0, 0); } }
    for (const f of Q.flyers) if (!f.isPlayer && T.noCatch(f)) f.noCatch = 0.4; Q.callCd = 0; if (T.mate) T.mate.holdT = 1;
    if (T.wait > 0) { T.wait -= dt; if (T.wait <= 0) Q.tutGo(T.i + 1); return; }
    if (S.tick) S.tick(T, dt);
    if (S.done(T)) { T.wait = 1.4; U.pop(PRAISE[T.i % PRAISE.length]); Q.excite = Math.max(Q.excite, 1.5); T.el.classList.add('ok'); }
    else if (IN.take('confirm')) T.wait = 0.01;
  };
  Q.tutFinish = function () { const T = Q.tut; T.fin = true; T.el.style.display = 'none'; try { localStorage.setItem('hl_qtut', '1'); } catch (e) { /* */ } Q.excite = 3; U.toast('LESSON COMPLETE', 'You can fly, pass, steal, dodge and score. The pitch is yours.', 4); Q.phase = 'over'; MG.after(2.8, () => { if (Q.on && Q.tut === T) Q.cleanup(); }, true); };
  Q.tutClear = function () { const T = Q.tut; if (!T) return; for (const r of T.rings) R.scene.remove(r.m); T.rings = []; if (T.el) T.el.style.display = 'none'; Q.tut = null; };
  Q.tutResults = function (story) {
    MG.state = 'house'; Q.pitchCam = true; U.show(false); if (document.exitPointerLock) document.exitPointerLock();
    const back = () => { Q.pitchCam = false; if (story) { U.screen(''); MG.state = 'play'; U.show(true); MG.onKey = null; } else Q.setup(false); };
    const el = U.screen(`<div class="hlPause"><h3>FLYING LESSON COMPLETE</h3><div class="hlKeys"><b>Fly · steer</b><span>${K('W')} · the mouse</span><b>Boost</b><span>hold ${K('SHIFT')}</span><b>Face the play</b><span>${K('F')}</span><b>Shoot</b><span>${K('LMB')} at the lit hoop · hold to wind up</span><b>Pass · call for it</b><span>${K('E')}</span><b>Lunge · steal</b><span>${K('LMB')} near the rival with the Quaffle</span><b>Roll</b><span>${K('R')} — beats tackles and Bludgers</span><b>House Spirit</b><span>full bar = a Roaring Shot, worth double</span><b>The Golden Snitch</b><span>loosed late on: every goal spurs your Seeker · a lunge knocks theirs off it</span></div>
      <div class="hlRow"><div class="hlBtn" data-a="m" style="min-width:240px">${story ? 'TO THE MATCH' : 'PLAY A MATCH'}</div><div class="hlBtn" data-a="r">FLY IT AGAIN</div>${story ? '<div class="hlBtn" data-a="b">BACK TO THE CASTLE</div>' : ''}</div></div>`);
    el.querySelectorAll('.hlBtn').forEach((b) => b.onclick = () => { const k = b.dataset.a; if (k === 'm') Q.setup(story); else if (k === 'r') Q.lesson(story); else back(); });
    MG.onKey = (c) => { if (c === 'Enter') Q.setup(story); };
  };
  /* leave a match that is still being played (the pause menu's RESTART and QUIT): tidy up, then go where asked */
  Q.quit = function (next) { if (!Q.on || Q.quitting) return; Q.quitting = true; Q.quitNext = next; MG.onKey = null; U.screen(''); MG.state = 'play'; Q.phase = 'over'; Q.cleanup(); };
  { const c0 = Q.cleanup; Q.cleanup = function () { if (!Q.on) return; if (Q.hud && Q.hud.cv) { Q.hud.cv.style.display = 'none'; Q.hud.vis = false; } setTimeout(() => U.root.classList.remove('qmatch'), 720); c0.call(Q); }; }
  /* the pause menu of a match: its own controls, RESTART and QUIT (the castle's menu led to the title with the match still running behind it) */
  { const p0 = U.pause; U.pause = function () {
      if (!Q.on) return p0.call(U); if (MG.state !== 'play' || Q.phase === 'over' || Q.quitting) return; MG.state = 'pause'; U.el.Toast.classList.remove('on'); U.toastT = 0; if (document.exitPointerLock) document.exitPointerLock(); const tut = !!Q.tut, story = !Q.opt.arcade;
      const S = U.screen(`<div class="hlPause"><h3>${tut ? 'FLYING LESSON' : 'QUIDDITCH'} · PAUSED</h3><div class="hlKeys"><b>Fly · steer</b><span>${K('W')} · look with the mouse (click to capture)</span><b>Boost · brake</b><span>hold ${K('SHIFT')} · ${K('S')}</span><b>Face the play</b><span>${K('F')} or ${K('TAB')}</span>
        <b>Shoot</b><span>${K('LMB')} at the lit hoop · hold to wind up</span><b>Pass · call for it</b><span>${K('E')} or ${K('RMB')}</span><b>Lunge · steal</b><span>${K('LMB')} near the rival with the Quaffle</span><b>Roll</b><span>${K('R')} — beats tackles and Bludgers</span><b>Rise · sink</b><span>${K('SPACE')} · ${K('C')} (the broom finds the height of the play itself)</span><b>House Spirit</b><span>passes, steals, dodges, goals — full bar = a Roaring Shot</span></div>
        <div class="hlBtn" data-a="r">RESUME</div><div class="hlBtn" data-a="a">${tut ? 'RESTART THE LESSON' : 'RESTART THE MATCH'}</div>${tut ? '' : '<div class="hlBtn" data-a="l">FLYING LESSON</div>'}<div class="hlBtn" data-a="q">${story ? 'LEAVE THE PITCH' : 'QUIT TO THE QUIDDITCH MENU'}</div></div>`);
      const resume = () => { U.screen(''); MG.state = 'play'; MG.onKey = null; IN.buf = {}; HL.noPauseT = MG.rt + 0.3; };
      S.querySelectorAll('.hlBtn').forEach((b) => b.onclick = () => { const k = b.dataset.a; if (k === 'r') resume(); else if (k === 'a') Q.quit(() => (tut ? Q.lesson(story) : Q.launch(story))); else if (k === 'l') Q.quit(() => Q.lesson(story)); else Q.quit(() => { Q.cup = null; if (story) { U.screen(''); MG.state = 'play'; U.show(true); } else Q.setup(false); }); });
      MG.onKey = (c) => { if (c === 'Escape' || c === 'KeyP' || c === 'Enter') resume(); }; }; }
})();
