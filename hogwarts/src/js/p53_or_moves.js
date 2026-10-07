/* ==== p53_or_moves.js ==== */
/* OPUS RING — move sets. The Tarnished's longsword (light string, heavy, Ash of War, roll, backstep, flask), the
   soldiers' one-handed sword / spear / club sets (mocap strikes behind slowed, readable wind-ups) and the lords'
   delayed combos. Everything is registered before MOV.init / MOCAP.moveSpecs run and patched in after them. */
(function () {
  const M = MOV.maul, G = MOV.GUARD;
  // ---- the Tarnished
  M.storm = M.heavy; M.storm.ev = [[0.12, 0.66, 3, 12, 'whirl'], [0.72, 0.84, 3, 26, 'sweep']];              // Ash of War: Stormcaller
  M.heavy = { dur: 0.75, cancel: 0.6, ev: [[0.3, 0.52, 3, 34, 'slam']], move: [[0.15, 0], [0.45, 0.9]], keys: [G, K(0.3, [0.0, 1.6, 0.1], [0, 0.4, -0.9], { cr: 0.04, pi: -0.2 }), K(0.5, [0.0, 1.0, 0.56], [0, -0.6, 0.8], { pi: 0.5, cr: 0.26, st: 'lungeL' }), K(0.75, [0.03, 1.08, 0.33], [0.45, 0.78, -0.22], { pi: 0.06, cr: 0.09, st: 'guard' })] };
  M.dodge = { dur: 0.62, iframes: [0.02, 0.4], keys: [K(0, [-0.2, 0.9, 0.2], [0.6, 0.3, 0.6], { g: 'R', oR: 0, st: 'neutral', cr: 0.3, pi: 0.3, fl: [0.3, 0.9, 0.2] })] };
  M.backstep = { dur: 0.4, iframes: [0.02, 0.3], keys: [K(0, [0.03, 1.08, 0.33], [0.45, 0.78, -0.22], { g: 'both', st: 'guard', cr: 0.12, pi: 0.0, off: [0, 0, 0] }), K(0.12, [0.03, 1.1, 0.3], [0.5, 0.8, -0.1], { cr: 0.2, pi: -0.14, st: 'back', off: [0, 0.07, 0], liftL: 0.25, liftR: 0.2, air: 1 }),
    K(0.3, [0.03, 1.06, 0.32], [0.45, 0.78, -0.2], { cr: 0.24, pi: 0.12, off: [0, 0, 0], liftL: 0, liftR: 0, air: 0, st: 'guard' }), K(0.4, [0.03, 1.08, 0.33], [0.45, 0.78, -0.22], { cr: 0.09, pi: 0.06 })] };
  M.drink = { dur: 1.15, keys: [K(0, [-0.3, 0.92, 0.05], [0.1, -0.35, 0.92], { g: 'R', oR: 0, st: 'neutral', cr: 0.03, tw: 0, pi: 0, fl: [0.26, 1.0, 0.16], headPitch: 0 }), K(0.3, [-0.3, 0.92, 0.05], [0.1, -0.35, 0.92], { fl: [0.07, 1.6, 0.17], headPitch: -0.3, pi: -0.08 }),
    K(0.85, [-0.3, 0.92, 0.05], [0.1, -0.35, 0.92], { fl: [0.06, 1.62, 0.16], headPitch: -0.42, pi: -0.12 }), K(1.15, [-0.3, 0.94, 0.05], [0.1, -0.3, 0.94], { fl: [0.26, 1.0, 0.16], headPitch: 0, pi: 0 })] };
  M.idleCalm = { loop: true, keys: [K(0, [-0.31, 0.9, 0.04], [0.06, -0.42, 0.9], { g: 'R', oR: 0, st: 'neutral', tw: 0, headYaw: 0, cr: 0.03, pi: 0.02, fl: [0.28, 0.9, 0.02] }), K(2, [-0.31, 0.91, 0.04], [0.06, -0.42, 0.9], { cr: 0.035 })] };
  M.run = { loop: true, keys: [K(0, [-0.31, 0.96, -0.02], [0.1, -0.3, 0.95], { g: 'R', oR: 0, st: 'neutral', tw: 0.05, headYaw: 0, cr: 0.05, pi: 0.05, fl: [0.26, 0.98, 0.05] })] };
  M.rest = { loop: true, keys: [K(0, [-0.26, 0.5, 0.36], [0.2, 0.2, 0.95], { g: 'R', oR: 0, fL: [0.14, 0, 0.32], fR: [-0.13, 0, -0.3], toeR: 0.9, cr: 0.52, pi: 0.16, tw: 0, headPitch: 0.22, fl: [0.22, 0.72, 0.3], lean: 0 }), K(3, [-0.26, 0.51, 0.36], [0.2, 0.2, 0.95], { cr: 0.51 })] };
  // mounted: upright in the saddle, the sword low at his right, reins in the left hand
  M.ride = { loop: true, keys: [K(0, [-0.34, 0.86, 0.12], [0.12, -0.3, 0.94], { g: 'R', oR: 0, fl: [0.1, 0.98, 0.36], fL: [0.3, 0.3, 0.1], fR: [-0.3, 0.3, 0.1], liftL: 0, liftR: 0, toeL: 0.3, toeR: 0.3, cr: 0.42, pi: 0.12, tw: 0, air: 1, headPitch: -0.08, headYaw: 0 })] };
  M.rideSlash = { dur: 0.6, ev: [[0.16, 0.36, 3, 30, 'slash']], keys: [K(0, [-0.34, 0.86, 0.12], [0.12, -0.3, 0.94], { g: 'R', oR: 0, fl: [0.1, 0.98, 0.36], fL: [0.3, 0.3, 0.1], fR: [-0.3, 0.3, 0.1], cr: 0.42, pi: 0.12, air: 1 }),
    K(0.14, [-0.45, 1.5, -0.1], [-0.3, 0.7, -0.6], { tw: 0.5, pi: 0.0 }), K(0.3, [-0.5, 0.75, 0.5], [-0.2, -0.75, 0.6], { tw: -0.4, pi: 0.3 }), K(0.6, [-0.34, 0.86, 0.12], [0.12, -0.3, 0.94], { tw: 0, pi: 0.12 })] };
  // ---- soldiers: weapon in the right hand, the left free for a shield
  const I0 = [-0.27, 1.02, 0.22], IA = [0.16, 0.62, 0.77], IB = { g: 'R', oR: 0, st: 'guard', cr: 0.07, tw: -0.16, headYaw: 0.14, pi: 0.04, fl: [0.3, 1.05, 0.22] };
  const stub = (dur, x) => ({ dur, keys: [K(0, I0, IA, Object.assign({}, IB, x || {}))] });
  MOV.soldier = { moSet: 'soldier',
    idle: { loop: true, keys: [K(0, I0, IA, IB), K(1.5, [-0.27, 1.04, 0.22], IA, { cr: 0.085 })] },
    calm: { loop: true, keys: [K(0, [-0.3, 0.9, 0.04], [0.06, -0.42, 0.9], { g: 'R', oR: 0, st: 'neutral', tw: 0, headYaw: 0, cr: 0.03, pi: 0.02, fl: [0.28, 0.9, 0.02] })] },
    run: { loop: true, keys: [K(0, [-0.3, 1.0, 0.1], [0.12, 0.3, 0.95], { g: 'R', oR: 0, st: 'neutral', cr: 0.05, pi: 0.08, fl: [0.28, 1.0, 0.1] })] },
    windA: stub(0.6), strikeA: stub(0.85), windB: stub(0.5), strikeB: stub(0.76), windC: stub(0.55), strikeC: stub(0.78), windD: stub(0.85), strikeD: stub(0.95),
    block: { keys: [K(0, [-0.08, 1.32, 0.36], [0.9, 0.42, 0.1], { g: 'R', oR: 0, st: 'guard', cr: 0.12, tw: 0.1, fl: [0.2, 1.2, 0.4] })] },
    stun: MOV.trooper.stun, execd: MOV.trooper.execd, choke: MOV.trooper.choke,
    death: { dur: 1.9, keys: [K(0, I0, IA, IB), K(0.5, [-0.25, 0.7, 0.3], [0.8, 0.0, 0.5], { cr: 0.4, pi: 0.4 })] },
  };
  MOV.soldier.wind = MOV.soldier.windA; MOV.soldier.strike = MOV.soldier.strikeA;
  // ---- lords: extra strikes on top of the duellist set (guard / over / side / thrust / spin / leap)
  const J = MOV.jedi, js = (dur, o) => Object.assign({ dur, keys: [J2(0, JG.hq, JG.ha, { st: 'guard', cr: 0.1, tw: -0.25 })] }, o || {});
  Object.assign(J, { heavyA: js(1.5), heavyB: js(1.25), heavyC: js(1.4), spinD: js(1.72), delay: js(1.86), comboR: js(2.47), hurl: js(1.1), roar: js(2.3), breath: js(3.4),
    guard1: { loop: true, keys: [K(0, [-0.3, 1.02, 0.2], [0.2, 0.55, 0.8], { g: 'R', oR: 0.02, st: 'guard', cr: 0.1, tw: -0.2, headYaw: 0.15, pi: 0.05, fl: [0.3, 1.2, 0.3] }), K(1.4, [-0.3, 1.04, 0.2], [0.2, 0.57, 0.8], { cr: 0.085 })] },
    slamK: { dur: 1.7, ev: [[0.92, 1.1, 1, 30, 'jedi']], impact: 1.02, aoe: 3.4, move: [[0.8, 0], [1.02, 0.9]], keys: [J2(0, JG.hq, JG.ha, { st: 'guard', cr: 0.1, tw: -0.25 }), J2(0.3, [0.0, 1.5, 0.1], [0.1, 0.8, -0.5], { cr: 0.06, pi: -0.15, tw: 0 }), J2(0.8, [0.0, 1.78, -0.12], [0, 0.25, -0.97], { cr: 0.02, pi: -0.34, st: 'wide' }),
      J2(0.98, [0.0, 0.9, 0.62], [0, -0.62, 0.78], { pi: 0.6, cr: 0.34, st: 'lungeL' }), J2(1.3, [0.0, 0.9, 0.6], [0, -0.6, 0.8], { pi: 0.52, cr: 0.3 }), J2(1.7, JG.hq, JG.ha, { pi: 0.05, cr: 0.1, st: 'guard', tw: -0.25 })] },
    sweepK: { dur: 1.5, ev: [[0.72, 0.98, 1, 24, 'jedi']], move: [[0.6, 0], [0.9, 0.8]], keys: [J2(0, JG.hq, JG.ha, { st: 'guard', cr: 0.1, tw: -0.25 }), J2(0.6, [0.3, 1.1, -0.1], [0.9, 0.2, -0.5], { tw: 0.85, cr: 0.22, st: 'wide', pi: 0.1 }),
      J2(0.78, [0.0, 0.95, 0.55], [0.0, -0.1, 1], { tw: 0.0, cr: 0.3, pi: 0.3, st: 'lungeL' }), J2(0.95, [-0.3, 1.0, 0.25], [-0.95, 0.0, 0.2], { tw: -0.9, cr: 0.26 }), J2(1.5, JG.hq, JG.ha, { tw: -0.25, pi: 0.05, cr: 0.1, st: 'guard' })] },
    stomp: { dur: 1.5, impact: 0.86, aoe: 6.2, keys: [J2(0, JG.hq, JG.ha, { st: 'guard', cr: 0.1 }), J2(0.3, [0.0, 1.2, 0.2], [0.2, 0.9, -0.2], { cr: 0.34, pi: 0.25, st: 'wide' }), J2(0.6, [0.0, 1.75, 0.0], [0.0, 0.5, -0.86], { cr: 0.0, air: 1, liftL: 0.7, liftR: 0.7, off: [0, 0.55, 0], pi: -0.2 }),
      J2(0.84, [0.0, 0.9, 0.5], [0.0, -0.8, 0.6], { air: 0, liftL: 0, liftR: 0, off: [0, 0, 0], cr: 0.4, pi: 0.5, st: 'wide' }), J2(1.2, [0.0, 0.92, 0.5], [0.0, -0.78, 0.62], { cr: 0.36 }), J2(1.5, JG.hq, JG.ha, { cr: 0.1, pi: 0.05, st: 'guard' })] },
  });
  const i0 = MOV.init;
  MOV.init = function () {
    Object.assign(MOV.soldier, MOV.REACT, { hit: MOV.REACT.hitL, deathFall: MOV.DEATH_FALL });
    i0();
    for (const k in MOV.soldier) if (MOV.soldier[k] && MOV.soldier[k].keys) ANIM.compile(MOV.soldier[k], ANIM.basePose);
    MOV.shieldman = Object.assign({}, MOV.soldier, { moSet: 'shieldman' });
    MOV.sitter = { moSet: 'sitter', idle: MOV.soldier.calm, calm: MOV.soldier.calm, run: MOV.soldier.calm, hit: MOV.soldier.hit, death: MOV.soldier.death };
    MOV.stander = { moSet: 'stander', idle: MOV.soldier.calm, calm: MOV.soldier.calm, run: MOV.soldier.calm, hit: MOV.soldier.hit, death: MOV.soldier.death };
  };
  // ---- mocap
  Object.assign(MOCAP.SETS, { soldier: { base: { idle: 'Sword_Idle', run: 'Sword_Idle', calm: 'Idle_Loop' }, arms: true, stance: 0.62, upright: 0.45 }, shieldman: { base: { idle: 'Idle_Shield_Loop', run: 'Idle_Shield_Loop', calm: 'Idle_Loop' }, arms: true, stance: 0.8, upright: 0.3 },
    sitter: { base: { idle: 'Sitting_Idle_Loop', calm: 'Sitting_Idle_Loop', run: 'Sitting_Idle_Loop' }, arms: true }, stander: { base: { idle: 'Idle_Talking_Loop', calm: 'Idle_FoldArms_Loop', run: 'Idle_Loop' }, arms: true } });
  MOCAP.SETS.jedi.base.guard1 = 'Sword_Idle'; MOCAP.SETS.maul.base.rest = undefined;
  MOCAP.state = function (a) {
    const set = (a.moves && a.moves.moSet) || (a.moves === MOV.maul ? 'maul' : a.moves === MOV.jedi ? 'jedi' : a.moves === MOV.trooper ? 'trooper' : a.moves === MOV.melee ? 'melee' : a.moves === MOV.brawler ? 'brawler' : null);
    if (!set) return null;
    const Jn = a.T.J;
    return { set: MOCAP.SETS[set], f: new MoFrame(), fb: new MoFrame(), fa: new MoFrame(), ft: new MoFrame(), from: new MoFrame(), xf: 1, xfDur: 0.12, key: '', fullFrom: 0, full: 0, prevT: 0, on: false, W: 0, phase: 0, idleT: rnd(0, 3),
      hipYaw: 0, back: false, wT: 0, wLeg: 0, wAL: 0, wAR: 0, wFull: 0, twoHand: 0, oR: 0, hipH: Jn.pelvis[1], lastSpec: null, chest: new THREE.Vector3(...Jn.chest) };
  };
  const m0 = MOCAP.moveSpecs;
  MOCAP.moveSpecs = function () {
    m0();
    const seg = (c, t0, t1, d) => [c, t0, t1, d === undefined ? (t1 - t0) : d];
    const put = (set, name, seqs, x) => { const m = set && set[name]; if (!m) return; m.mo = Object.assign({ seq: seqs, mode: 'full' }, x && x.mo || {}); m.dur = seqs.reduce((s, q) => s + q[3], 0); m.fadeOut = 0.22; if (x) for (const k in x) if (k !== 'mo') m[k] = x[k]; };
    const SA = 'Sword_Attack', SH = 'Sword_Heavy_Combo', SR = 'Sword_Regular_Combo', SD = 'Sword_Dash';
    // the Tarnished
    const Mm = MOV.maul;
    put(Mm, 'heavy', [seg(SH, 0.0, 0.85, 0.74)], { ev: [[0.29, 0.52, 3, 36, 'slam']], cancel: 0.6, move: [[0.17, 0], [0.44, 0.9]] });
    put(Mm, 'dodge', [seg('Roll', 0.0, 0.92, 0.62)]);
    for (const k of ['drink', 'rest']) if (Mm[k]) Mm[k].moBase = false;
    // soldiers
    const S = MOV.soldier;
    put(S, 'windA', [seg(SA, 0, 0.27, 0.6)]); put(S, 'strikeA', [seg(SA, 0.27, 0.6, 0.3), seg(SA, 0.6, 1.4, 0.55)]);
    put(S, 'windB', [seg('Sword_Regular_A', 0, 0.15, 0.5)]); put(S, 'strikeB', [seg('Sword_Regular_A', 0.15, 0.43, 0.26), seg('Sword_Regular_A_Rec', 0, 0.9, 0.5)]);
    put(S, 'windC', [seg(SD, 0, 0.2, 0.55)]); put(S, 'strikeC', [seg(SD, 0.2, 0.5, 0.28), seg(SD, 0.5, 1.4, 0.5)]);
    put(S, 'windD', [seg(SH, 0, 0.33, 0.85)]); put(S, 'strikeD', [seg(SH, 0.33, 0.62, 0.3), seg(SH, 0.62, 0.88, 0.65)]);
    const body = (name, seqs, dur) => { const m = S[name]; if (!m) return; m.mo = { seq: seqs, mode: 'body' }; if (dur) m.dur = dur; };
    body('hitL', [seg('Hit_Head', 0, 0.43, 0.46)]); S.hitR = Object.assign({}, S.hitR); S.hitR.mo = { seq: [seg('Hit_Chest', 0, 0.33, 0.34), seg(null, 0, 0, 0.12)], mode: 'body', mirror: true };
    body('hitSpin', [seg('Hit_Head', 0, 0.43, 0.42)]); body('hitHeavy', [seg('Hit_Head', 0, 0.43, 0.45), seg('Hit_Chest', 0.1, 0.33, 0.4)]);
    S.knock = Object.assign({}, S.knock); S.knock.mo = { seq: [seg('Hit_Knockback', 0, 0.83, 0.7), seg(null, 0, 0, 0.35), seg('LayToIdle', 0, 1.53, 1.2)], mode: 'body' }; S.knock.dur = 2.25;
    S.death.mo = { seq: [seg('Death01', 0, 2.4, 1.9)], mode: 'body' };
    S.stun = Object.assign({}, S.stun); S.stun.mo = { seq: [seg('Idle_Shield_Break', 0.0, 1.07, 1.07)], mode: 'body' }; S.stun.moLoop = true;
    if (MOV.shieldman) for (const k of ['hitL', 'hitR', 'hitSpin', 'hitHeavy', 'knock', 'stun']) MOV.shieldman[k] = S[k];
    // lords
    const Jd = MOV.jedi;
    put(Jd, 'heavyA', [seg(SH, 0, 0.33, 0.8), seg(SH, 0.33, 0.62, 0.3), seg(SH, 0.62, 0.88, 0.4)], { ev: [[0.8, 1.1, 1, 26, 'jedi']], move: [[0.72, 0], [1.02, 1.2]] });
    put(Jd, 'heavyB', [seg(SH, 0.85, 0.95, 0.5), seg(SH, 0.95, 1.35, 0.4), seg(SH, 1.35, 1.6, 0.35)], { ev: [[0.5, 0.88, 1, 24, 'jedi']], move: [[0.42, 0], [0.8, 1.0]] });
    put(Jd, 'heavyC', [seg(SH, 1.5, 1.67, 0.7), seg(SH, 1.67, 1.95, 0.3), seg(SH, 1.95, 2.2, 0.4)], { ev: [[0.7, 0.98, 1, 28, 'jedi']], move: [[0.6, 0], [0.92, 1.1]] });
    put(Jd, 'spinD', [seg(SH, 2.15, 2.5, 0.9), seg(SH, 2.5, 2.7, 0.22), seg(SH, 2.7, 3.3, 0.6)], { ev: [[0.9, 1.14, 1, 32, 'jedi']], move: [[0.8, 0], [1.1, 1.4]] });
    put(Jd, 'delay', [seg(SA, 0, 0.27, 1.1), seg(SA, 0.27, 0.55, 0.26), seg(SA, 0.55, 1.2, 0.5)], { ev: [[1.1, 1.36, 1, 30, 'jedi']], move: [[1.02, 0], [1.3, 1.0]] });
    put(Jd, 'comboR', [seg(SR, 0, 0.17, 0.4), seg(SR, 0.17, 0.32, 0.15), seg(SR, 0.32, 0.63, 0.4), seg(SR, 0.63, 0.82, 0.18), seg(SR, 0.82, 1.43, 0.6), seg(SR, 1.43, 1.7, 0.24), seg(SR, 1.7, 2.3, 0.5)],
      { ev: [[0.4, 0.56, 1, 18, 'jedi'], [0.95, 1.14, 1, 18, 'jedi'], [1.73, 1.98, 1, 24, 'jedi']], move: [[0.3, 0], [0.55, 0.7], [0.9, 0.7], [1.12, 1.4], [1.7, 1.4], [1.95, 2.2]] });
    put(Jd, 'hurl', [seg('OverhandThrow', 0, 0.2, 0.45), seg('OverhandThrow', 0.2, 0.45, 0.25), seg('OverhandThrow', 0.45, 1.0, 0.4)], { release: 0.62 });
    put(Jd, 'roar', [seg('Spell_Simple_Enter', 0, 0.53, 0.6), seg('Spell_Simple_Idle_Loop', 0, 1.2, 1.2), seg('Spell_Simple_Exit', 0, 0.43, 0.5)]);
    put(Jd, 'breath', [seg('Spell_Simple_Enter', 0, 0.53, 0.7), seg('Spell_Simple_Idle_Loop', 0, 2.1, 2.2), seg('Spell_Simple_Exit', 0, 0.43, 0.5)], { fire: [0.7, 2.9] });
  };
})();
