/* ==== p99f_career.js ==== */
/* CAREER, BETWEEN THE EVENTS — sound that follows the screen you are on, and time of your own between one event and the
   next. */

/* ---- the sound of the career's screens. The stage's update (p96e) takes over the whole frame while a scene or a career
   screen is up and never called the sound's frame, so whatever was playing as you left the pitch went on at full level
   through the results, the press and the hub — the crowd and the match theme under everything, for good — and the
   career's own choice of music and room tone (p97) never ran. It runs now, and the choices are the screen's: */
{ const u0 = HL.update; HL.update = function (rdt) { const r = u0.apply(this, arguments); if (MG.state === 'scene' && HL.AU && HL.AU.frame) { try { HL.AU.frame(Math.min(rdt, 0.1)); } catch (e) { if (!HL.AU.err) HL.AU.err = String(e.stack || e); } } return r; };
  if (MG.gameUpdate === u0) MG.gameUpdate = HL.update; }
{ let lastB = null, resT = 0;
  const live = () => typeof Script !== 'undefined' && !!Script.beats;
  HL.musicHook = function (st, m) {
    if (typeof QC === 'undefined' || !QC.active || (HL.Q && HL.Q.on)) return undefined;
    if (typeof FreeTime !== 'undefined' && FreeTime.on) return undefined;   // (free time is the castle's: its own score)
    if (typeof Locker !== 'undefined' && Locker.on) return 'mus_match';
    if (st !== 'scene') return undefined;
    const S = typeof Scenes !== 'undefined' && Scenes.set, B = typeof CareerUI !== 'undefined' ? CareerUI.backdrop : null, v = S && S.variant || '';
    let n;
    if (!S) n = 'mus_title';
    else if (B === 'creator') n = 'mus_title';
    else if (B === 'result') n = 'mus_castle2';
    else if (B === 'pro') n = 'mus_castle2';
    else if (B === 'school') n = 'mus_hall';
    else if (S.tables) n = /yule|gala|christmas|feast|halloween|sorting/.test(v) ? 'mus_feast' : 'mus_hall';
    else if (S.boat) n = 'mus_title';
    else if (S.quill) n = 'mus_castle2';
    else if (S.anchors && S.anchors.streetMe) n = 'mus_village';
    else if (S.anchors && S.anchors.pitchMe) n = v === 'graduation' ? 'mus_title' : 'mus_castle2';
    else n = live() ? 'mus_hall' : 'mus_castle';
    return HL.AU && HL.AU.has(n) ? n : 'mus_castle'; };
  /* the crowd is heard where there is one: in the stands before a match (muffled, from the gate) and for a few seconds
     after the whistle, dying away; never under the hub, the papers or the press */
  HL.bedHook = function (st) {
    const A = HL.AU; if (!A || typeof QC === 'undefined' || !QC.active || (HL.Q && HL.Q.on)) return false;
    if (typeof FreeTime !== 'undefined' && FreeTime.on) return false;
    if (typeof Locker !== 'undefined' && Locker.on) { A.bed('crowd_loop', 0.2); A.bed('amb_out', 0.35); return false; }
    if (st !== 'scene') { lastB = null; return false; }
    const S = typeof Scenes !== 'undefined' && Scenes.set, B = CareerUI.backdrop; if (B !== lastB) { if (B === 'result') resT = 0; lastB = B; } if (B === 'result') resT += Math.min(MG.rdt || 0.016, 0.1);
    if (!S) return true;
    if (B === 'result') { A.bed('crowd_loop', 0.3 * Math.max(0, 1 - resT / 8)); A.bed('amb_out', 0.4); }
    else if (B === 'pro' || B === 'creator') A.bed('amb_out', 0.35);
    else if (S.tables) A.bed('amb_hall', 0.6);
    else if (S.boat) A.bed('amb_lake', 0.7);
    else if (S.quill) A.bed('amb_out', 0.3);
    else if (S.anchors && S.anchors.streetMe) { A.bed('amb_village', 0.55); A.bed('amb_out', 0.3); }
    else if (S.anchors && (S.anchors.pitchMe || S.anchors.lockMe)) { A.bed('amb_out', 0.4); if (S.variant === 'graduation') A.bed('crowd_loop', 0.18); }
    else if (S.anchors && S.anchors.chairL) A.bed('amb_fire', 0.65);
    else A.bed('amb_hall', 0.35);
    return true; };
}

/* ---- FREE TIME. Between one event and the next the career was a menu over a picture: nothing to do but press CONTINUE.
   Now FREE TIME (on the event card) puts you on your own feet in the world as your player — at school in your house's
   common room, as a professional at the stadium's players' gate — until you choose to go on:
   - your team-mates are about: walk up to one and talk (chemistry, once each between events), as in the huddle;
   - the pitch is there to practise on (the week's training session, if it is not used);
   - what you find is yours: galleons from the castle's chests go to your career purse, a Field Guide page is XP;
   - the next event is on the tracker at the top left: tap it (or press H, or the ⌂ button) to go back to the career. */
const FreeTime = { on: false, mates: [], uses: [], talked: {}, panel: false };
{ const F = FreeTime;
  const css = document.createElement('style'); css.textContent = `
body.qcFree #hlQuest, body.qcFree #hlPts, body.qcFree #hlGold { display: none !important; } body.qcFree #tc .tcB[data-id="bag"] { display: none !important; }
#qcFT { position: absolute; left: 0; top: 0; z-index: 12; display: none; padding: calc(10px + env(safe-area-inset-top)) 22px 16px calc(14px + env(safe-area-inset-left)); max-width: min(46vw, 420px); cursor: pointer;
  background: radial-gradient(ellipse at 0% 0%, rgba(8,6,10,.86), rgba(8,6,10,.55) 52%, rgba(8,6,10,0) 80%); font-family: 'HLB', Georgia, serif; color: #efe4c8; text-shadow: 0 1px 3px #000, 0 0 8px rgba(0,0,0,.8); }
body.qcFree.qcTalk #hlPrompt { display: none !important; }
body.qcFree #qcFT { display: block; }
#qcFT .w { font: 400 10.5px 'HLA', Georgia, serif; letter-spacing: .2em; color: #c9b27a; } #qcFT b { display: block; font: 400 16px 'HLA', Georgia, serif; letter-spacing: .08em; color: #f6e2a8; margin: 2px 0 4px; }
#qcFT .go { display: inline-flex; align-items: center; gap: 6px; font: 400 11px 'HLA', Georgia, serif; letter-spacing: .16em; color: #241505; background: linear-gradient(#f3d488, #c9973f); padding: 4px 10px; border-radius: 6px; margin-bottom: 6px; }
#qcFT .td { font-size: 12.5px; line-height: 1.35; opacity: .9; } #qcFT .td i { font-style: normal; color: #e8c56e; margin-right: 5px; } #qcFT .td s { text-decoration: none; opacity: .5; }
#qcFTban { position: absolute; left: 50%; top: 18%; transform: translate(-50%, -6px); z-index: 13; pointer-events: none; opacity: 0; transition: opacity .35s, transform .35s; text-align: center; padding: 8px 28px 10px;
  background: radial-gradient(ellipse at center, rgba(8,6,10,.78), rgba(8,6,10,0) 72%); font-family: 'HLA', Georgia, serif; text-shadow: 0 1px 4px #000; }
#qcFTban.on { opacity: 1; transform: translate(-50%, 0); } #qcFTban b { display: block; font-weight: 400; font-size: 17px; letter-spacing: .16em; color: #f3d488; } #qcFTban span { display: block; font: italic 13px 'HLB', Georgia, serif; color: #e9dcb8; margin-top: 2px; }
#qcFTpanel { position: absolute; right: max(14px, env(safe-area-inset-right)); top: 50%; transform: translateY(-50%); z-index: 14; width: min(360px, 42vw); display: none; padding: 16px 18px; border-radius: 14px;
  background: linear-gradient(170deg, rgba(30,22,12,.95), rgba(10,8,6,.95)); border: 1px solid rgba(232,197,110,.45); box-shadow: 0 14px 40px rgba(0,0,0,.55); color: #efe4c8; font-family: 'HLB', Georgia, serif; }
#qcFTpanel.on { display: block; } #qcFTpanel h4 { margin: 0; font: 400 16px 'HLA', Georgia, serif; letter-spacing: .1em; color: #f6e2a8; } #qcFTpanel .r { font: 400 10.5px 'HLA', Georgia, serif; letter-spacing: .14em; color: #c9b27a; margin: 2px 0 6px; }
#qcFTpanel .bar { height: 4px; background: rgba(255,255,255,.12); border-radius: 2px; overflow: hidden; } #qcFTpanel .bar i { display: block; height: 100%; background: linear-gradient(90deg, #5ab0ff, #9fd2ff); }
#qcFTpanel .ln { font-size: 15px; line-height: 1.4; margin: 12px 0; } #qcFTpanel .ln em { font-style: normal; font: 400 11px 'HLA', Georgia, serif; letter-spacing: .1em; margin-left: 6px; } #qcFTpanel .ln em.up { color: #8fe08f; } #qcFTpanel .ln em.dn { color: #ff8a7a; }
#qcFTpanel .ops { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; } #qcFTpanel button { font: 400 12px 'HLA', Georgia, serif; letter-spacing: .1em; color: #f1e4c6; background: rgba(255,255,255,.05); border: 1px solid rgba(232,197,110,.35); border-radius: 9px; padding: 10px 8px; cursor: pointer; }
#qcFTpanel button:hover { border-color: #f0cf7c; } #qcFTpanel .x { display: block; width: 100%; margin-top: 10px; } #qcFTpanel .done { grid-column: 1 / -1; opacity: .7; font-style: italic; }
@media (max-height: 420px) { #qcFT { max-width: 42vw; padding-top: calc(6px + env(safe-area-inset-top)); } #qcFT b { font-size: 14.5px; } #qcFT .td { font-size: 11.5px; } #qcFTpanel { width: min(320px, 44vw); padding: 12px 14px; } #qcFTpanel .ln { font-size: 13.5px; margin: 8px 0; } #qcFTpanel button { padding: 8px 6px; } }`;
  document.head.appendChild(css);
  const el = (id, cls) => { let e = document.getElementById(id); if (!e) { e = document.createElement('div'); e.id = id; if (cls) e.className = cls; (HL.ui.root || document.body).appendChild(e); } return e; };
  const ban = (a, b) => { const e = el('qcFTban'); e.innerHTML = `<b>${a}</b>${b ? `<span>${b}</span>` : ''}`; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2800); };
  const evKey = () => { const S = Career.S; return S.ev + ':' + S.year + ':' + S.season; };
  F.available = () => { const S = Career.S; return !!S && /^(school|pro|wc)$/.test(S.phase) && !!Career.cur() && !(typeof Locker !== 'undefined' && Locker.on); };
  /* lines for a quiet moment (the huddle's are match-day lines) */
  const line = (m) => { const c = m.chem, me = Career.first(), school = Career.S.phase === 'school';
    if (m.grudge) return pick([`Read the papers. Lovely things you said.`, `I'm not in the mood, ${me}.`]);
    if (c > 70) return pick(school ? [`${me}! Save me a seat at dinner.`, `Fancy a fly after lessons? I'll race you round the towers.`, `Saw your dive at practice. You have to show me that.`] : [`Good session yesterday. You looked sharp.`, `A few of us are getting food after training. Coming?`, `Same again on Saturday, yeah? You and me.`]);
    if (c > 45) return pick(school ? [`Busy week. Ready for the next one?`, `Did you finish the Potions essay? Asking for a friend.`, `Madam Hooch says we look sharper this year.`] : [`Coach wants us in early tomorrow.`, `Long season. Pace yourself.`, `Their Chasers are quick. We'll need you on it.`]);
    if (c > 25) return pick([`...Oh. Hi.`, `Can it wait? I'm in the middle of something.`, `Mm. Hello.`]);
    return pick([`Not now.`, `You do your thing, I'll do mine.`]); };
  const rep = (d) => d >= 3 ? pick([`Ha! Exactly what I needed.`, `You always know what to say.`, `Right — see you out there.`]) : d > 0 ? pick([`Yeah. Alright.`, `Fair enough.`, `Thanks, I suppose.`]) : pick([`...Not now.`, `Was that supposed to help?`]);
  F.closePanel = function () { const p = el('qcFTpanel'); p.classList.remove('on'); document.body.classList.remove('qcTalk'); if (F.panel) { if (CAM.cine && CAM.cine.hold) CAM.cine = null; if (PLAYER.state === 'cine') PLAYER.state = 'move'; } F.panel = false; IN.buf = {}; };
  F.talk = function (mt) { const m = mt.m, k = evKey() + ':' + m.id, done = F.talked[k], p = el('qcFTpanel'), role = { chaser: 'Chaser', beater: 'Beater', keeper: 'Keeper', seeker: 'Seeker' }[m.role] || 'Classmate';
    m.pers = m.pers || PERSONALITY[m.name.length % 4];
    p.innerHTML = `<h4>${m.name}</h4><div class="r">${role.toUpperCase()} · ${m.pers.toUpperCase()} · CHEMISTRY ${Math.round(m.chem)}</div><div class="bar"><i style="width:${clamp(m.chem, 0, 100)}%"></i></div>
      <div class="ln">"${done ? pick([`Talk later, yeah?`, `See you at the next one.`]) : line(m)}"</div><div class="ops">${done ? `<div class="done">You've caught up with ${m.name.split(' ')[0]} this week.</div>` : TALK_OPTS.map((o) => `<button data-k="${o.k}">${o.t}</button>`).join('')}</div><button class="x">BACK</button>`;
    p.classList.add('on'); F.panel = true; PLAYER.state = 'cine'; document.body.classList.add('qcTalk'); mt.a.setBase('talk', 0.2); if (typeof Locker !== 'undefined') Locker.ots(mt.a);
    p.querySelector('.x').onclick = () => F.closePanel();
    p.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { const o = TALK_OPTS.find((x) => x.k === b.dataset.k), d = (o.like[m.pers] || 0) + (Math.random() < 0.3 ? 1 : 0);
      m.chem = clamp(m.chem + d, 0, 100); if (d > 2) m.grudge = false; Career.S.persona[o.tone] = (Career.S.persona[o.tone] || 0) + 0.25; F.talked[k] = true; Career.save();
      p.querySelector('.ln').innerHTML = `"${rep(d)}"${d ? `<em class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${d} CHEMISTRY</em>` : ''}`; p.querySelector('.ops').innerHTML = ''; Sound.play('ui'); F.track(); }); };
  /* the tracker: the next event, and what there is to do before it */
  F.track = function () { const S = Career.S, ev = Career.cur(), t = el('qcFT'); if (!ev) return; const n = F.mates.length, k = evKey(), talked = F.mates.filter((mt) => F.talked[k + ':' + mt.m.id]).length, tr = Career.canTrain();
    t.innerHTML = `<div class="w">${Career.when(ev).toUpperCase()}</div><b>${ev.label}</b><div class="go">${TOUCH.on ? 'TAP TO GO ON' : 'CLICK OR PRESS H TO GO ON'} ›</div>
      <div class="td">${n ? `<div>${talked >= n ? '<s>' : ''}<i>◆</i>Catch up with your team-mates ${talked}/${n}${talked >= n ? '</s>' : ''}</div>` : ''}<div>${tr ? '' : '<s>'}<i>◆</i>${tr ? 'Practise at the pitch' : 'Practised this week'}${tr ? '' : '</s>'}</div>${HL.rings && HL.rings.length && !HL.ringsDone ? `<div><i>◆</i>Fly the ring course · XP for every ring</div>` : ''}<div><i>◆</i>Galleons you find go to your purse</div></div>`; };
  /* the marker leads to the next thing to do: the nearest team-mate not yet talked to, then the pitch */
  const way = () => { const P = PLAYER.a; if (!P) return null; const k = evKey(); let best = null, bd = 1e9;
    for (const mt of F.mates) { if (F.talked[k + ':' + mt.m.id]) continue; const d = Math.hypot(mt.a.x - P.x, mt.a.z - P.z); if (d < bd) { bd = d; best = [mt.a.x, mt.a.y + 2.3, mt.a.z]; } }
    if (best) return bd > 3 ? best : null; return Career.canTrain() && F.spot && Math.hypot(F.spot.x - P.x, F.spot.z - P.z) > 4 ? [F.spot.x, F.spot.y + 2, F.spot.z] : null; };
  F.start = async function () {
    const S = Career.S; if (F.on || !F.available()) return; const school = S.phase === 'school', U = HL.ui;
    const meT = Scenes.tpl('me', { o: { outfit: school ? 'school' : 'track' } }), key = QC.key(Career.myTeam()), kit = !school;
    const pool = school ? [S.friend && S.mates[S.friend]].concat(Career.squad()).filter((m, i, a) => m && !m.gone && a.indexOf(m) === i).slice(0, 3) : (S.roster || []).slice(0, 3);
    const tpls = pool.map((m) => HL.student(school ? QC.key(m.team != null && m.team < 4 ? m.team : S.profile.house) : key, m.body === 'f', (m.look && m.look.v) || 1, kit));
    U.fade(1); await CAST.need([meT].concat(tpls)); await new Promise((r) => setTimeout(r, 350));
    Scenes.leave(true); CareerUI.root.hidden = true; CareerUI.backdrop = null; if (typeof Dialogue !== 'undefined') Dialogue.hide();
    /* where: at school your common room (on the floor where its cameras stand, facing the fire); a professional at the gate */
    let set = school ? STAGES.common('') : null, W, at, face, spots;
    if (set) { const Fr = set.F; W = (p) => { const s0 = Scenes.F; Scenes.F = Fr; const v = Scenes.W(p, new THREE.Vector3()); Scenes.F = s0; v.y = Fr.y + 0.05; return v; };
      const fp = set.cams.fire.p, dp = set.cams.default.p; at = W([fp[0], 0, fp[2]]); face = W(set.anchors.fire); spots = [set.anchors.standF, [dp[0], 0, dp[2]], [(dp[0] + fp[0]) / 2 + 1.1, 0, (dp[2] + fp[2]) / 2]]; }
    else { set = STAGES.locker(school ? 'school' : S.phase === 'wc' ? 'nation' : 'pro');   /* (and at school if the house has no common room to stand in) */ const Fr = set.F; W = (p) => { const s0 = Scenes.F; Scenes.F = Fr; const v = Scenes.W(p, new THREE.Vector3()); Scenes.F = s0; v.y = HL.gy(v.x, v.z) + 0.05; return v; };
      at = W(set.anchors.lockMe); face = W([0, 0, 2.6]); spots = [set.anchors.mate1, set.anchors.mate3, set.anchors.mate5]; }
    F.set = set;
    /* the pitch to practise on: at school the grass by the players' gate, as a professional the same */
    { const C0 = HL.PITCH, Q = HL.Q, Fp = Scenes.frame(C0.x - Q.AX + 4, Q.Y0, C0.z - 20, -HALF), s0 = Scenes.F; Scenes.F = Fp; const v = Scenes.W([0, 0, -7], new THREE.Vector3()); Scenes.F = s0; v.y = HL.gy(v.x, v.z); F.spot = v;
      F.uses.push(HL.interact(V3(v.x, v.y + 1, v.z), 3.2, 'Practise · the week\'s training', () => { if (!Career.canTrain()) { ban('PRACTISED THIS WEEK', 'One session between fixtures — rest, and go again next week.'); return; } F.end(false, () => { CareerUI.hubScene(); CareerUI.training(); }); })); }
    /* you, as yourself */
    F._hero = CHAR.T.maul; CHAR.T.maul = CHAR.T[meT]; F._house = HL.house; const hk = QC.key(S.profile.house); if (HL.HOUSES[hk]) { HL.house = hk; U.theme(); }
    const yaw = Math.atan2(face.x - at.x, face.z - at.z); PLAYER.spawn(at.x, at.y, at.z, yaw); CAM.reset(yaw); CAM.snap = true; HL.camNear = 0;
    /* your team-mates */
    F.mates = []; pool.forEach((m, i) => { const sp = spots[i]; if (!sp) return; const w = W(sp), a = new Actor(CHAR.T[tpls[i]], { x: w.x, y: w.y, z: w.z, yaw: Math.atan2(at.x - w.x, at.z - w.z) + (i - 1) * 0.5, hp: 100, team: 'npc', moves: MOV.wizard, r: 0.3, h: 1.8 });
      a.noTarget = true; a.x = w.x; a.y = w.y; a.z = w.z; const base = ['talk', 'fold', 'calm'][i % 3]; a.base = base; a.animate(0.016 + RNG()); a.pose3D(0.016); const mt = { m, a, base };
      F.mates.push(mt); F.uses.push(HL.interact(V3(a.x, a.y + 1, a.z), 2.4, `Talk · ${m.name.split(' ')[0]}`, () => F.talk(mt))); });
    if (HL.quest) { F._way = HL.quest.way; HL.quest.way = way; }
    F.gold0 = typeof LOOTH !== 'undefined' ? LOOTH.gold : 0; F.found0 = Object.keys(HL.save.found || {}).length; F.ring0 = HL.ringN || 0;
    F.on = true; document.body.classList.add('qcFree'); MG.state = 'play'; PLAYER.state = 'move'; U.show(true); IN.buf = {}; if (TOUCH.on) { TOUCH.layout(); TOUCH.frame(); } F.track();
    U.fade(0); setTimeout(() => ban('FREE TIME', school ? 'Your common room. Wander, talk, fly — the career waits until you go on.' : 'The players\' gate. Train, talk, fly — the season waits until you go on.'), 500);
  };
  F.end = function (go, then) {
    if (!F.on) return; F.closePanel(); F.on = false; document.body.classList.remove('qcFree'); el('qcFTban').classList.remove('on');
    if (HL.fly && HL.fly.on) HL.fly.dismount(true); CAM.cine = null;
    for (const mt of F.mates) mt.a.dispose(); F.mates = []; for (const u of F.uses) { const i = HL.uses.indexOf(u); if (i >= 0) HL.uses.splice(i, 1); } F.uses = [];
    if (F.set && F.set.onLeave) { const l = F.set.onLeave; F.set.onLeave = null; l(); } F.set = null;
    if (HL.quest && F._way) { HL.quest.way = F._way; F._way = null; }
    if (F._hero) { CHAR.T.maul = F._hero; F._hero = null; } if (F._house) { HL.house = F._house; HL.ui.theme(); F._house = null; }
    { const Q = HL.Q; PLAYER.spawn(Q.REF[0] + 3, Q.Y0, Q.REF[2], HALF); }   // (out of the way of the hub's picture)
    HL.ui.show(false); CareerUI.backdrop = null; Career.save();
    if (then) then(); else { CareerUI.hub(); if (go) setTimeout(() => CareerUI.next(), 60); }
    if (TOUCH.on) { TOUCH.layout(); TOUCH.frame(); } };
  /* while it lasts: your team-mates look up as you come near; what you find goes to your career; the way back */
  { const u0 = HL.update; HL.update = function (rdt) { u0(rdt); if (!F.on) return; const dt = Math.min(rdt, 0.05), P = PLAYER.a, S = Career.S;
      for (const mt of F.mates) { const a = mt.a; if (P) { const d = Math.hypot(P.x - a.x, P.z - a.z); if (d < 3.2) a.lookYaw = clamp(wrapA(Math.atan2(P.x - a.x, P.z - a.z) - a.yaw), -1, 1) * 0.8; else a.lookYaw = damp(a.lookYaw || 0, 0, 3, dt); } a.animate(dt); a.pose3D(dt); }
      if (F.panel && P) { P.vx = P.vz = 0; }
      if (typeof LOOTH !== 'undefined' && S && LOOTH.gold > F.gold0) { const g = LOOTH.gold - F.gold0; S.gal += g; F.gold0 = LOOTH.gold; Career.save(); ban('+' + g + ' GALLEONS', 'to your career purse · ' + S.gal + ' in all'); }
      if (S && (HL.ringN || 0) > F.ring0) { const k = (HL.ringN || 0) - F.ring0, ups = Career.addXP(6 * k); F.ring0 = HL.ringN || 0; Career.save(); ban('+' + 6 * k + ' XP', (HL.ringsDone ? 'the ring course, flown' : 'a ring of the course') + (ups ? ' · LEVEL UP' : '')); }
      if (S) { const n = Object.keys(HL.save.found || {}).length; if (n > F.found0) { const ups = Career.addXP(15 * (n - F.found0)); F.found0 = n; Career.save(); ban('+' + 15 + ' XP', 'a Field Guide page' + (ups ? ' · LEVEL UP' : '')); } } };
    if (MG.gameUpdate === u0) MG.gameUpdate = HL.update; }
  /* the way back: the tracker (a tap: it lies under the stick's half of the screen), H, the ⌂ button, the pause */
  window.addEventListener('keydown', (e) => { if (F.on && e.code === 'KeyH' && MG.state === 'play' && !F.panel && PLAYER.state !== 'cine') F.end(true); }, true);
  document.addEventListener('click', (e) => { if (F.on && e.target.closest && e.target.closest('#qcFT') && MG.state === 'play') F.end(true); }, true);
  { const hit = (x, y) => { if (!F.on || MG.state !== 'play') return false; const t = document.getElementById('qcFT'); if (!t) return false; const r = t.getBoundingClientRect(); return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
    const zd0 = TOUCH.zoneDown; TOUCH.zoneDown = function (e) { if (hit(e.clientX, e.clientY)) { TOUCH.look[e.pointerId] = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0 }; return; } return zd0.apply(this, arguments); };
    const tp0 = TOUCH.tap; TOUCH.tap = function (x, y) { if (hit(x, y)) { F.end(true); return; } return tp0.apply(this, arguments); }; }
  { const mn = TOUCH.modeNow; TOUCH.modeNow = function () { if (F.on && F.panel) return ''; return mn.apply(this, arguments); }; }
  TOUCH.ICON.career = 'M3.5 11.5 L12 4 L20.5 11.5 M6 9.5 V20 H10 V14.5 H14 V20 H18 V9.5';
  TOUCH.DEF.career = ['career', '', 'foot fly', 'tap', ['career']];
  (TOUCH.baseFix = TOUCH.baseFix || []).push(() => { const B = TOUCH.btn; if (!B.career || !B.bag) return; B.career.style.left = B.bag.style.left; B.career.style.top = B.bag.style.top; B.career.style.setProperty('--r', B.bag.style.getPropertyValue('--r') || '20px'); B.career.classList.add('sm'); });
  { const p0 = TOUCH.press; TOUCH.press = function (id) { if (id === 'career') { if (F.on && !F.panel) F.end(false); return; } return p0.apply(this, arguments); };
    const f0 = TOUCH.frame; TOUCH.frame = function () { const r = f0.apply(this, arguments); const b = TOUCH.btn.career; if (b) { const want = F.on && (TOUCH.mode === 'foot' || TOUCH.mode === 'fly'); if (b.classList.contains('on') !== want) b.classList.toggle('on', want); } return r; }; }
  /* the pause in free time: QUIT TO TITLE is the way back to the career, and the castle's CHANGE HOUSE goes */
  { const pz = HL.ui.pause; HL.ui.pause = function () { const r = pz.apply(this, arguments); if (!F.on || MG.state !== 'pause') return r; const S = HL.ui.el.Screen, q = S.querySelector('.hlBtn[data-a="t"]'), h = S.querySelector('.hlBtn[data-a="h"]');
      if (h) h.remove(); if (q) { q.textContent = 'BACK TO THE CAREER'; q.onclick = (e) => { e.stopPropagation(); HL.ui.screen(''); MG.state = 'play'; F.end(false); }; } return r; }; }
  /* the castle's journal is not the career's */
  window.addEventListener('keydown', (e) => { if (F.on && e.code === 'KeyJ') { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  /* the door, on the event card */
  if (typeof CareerUI !== 'undefined') {
    const ec = CareerUI.eventCard; CareerUI.eventCard = function (ev) { let h = ec.apply(this, arguments);
      /* what follows, in one line under the card: the arc of the term is visible from the hub */
      { const S = Career.S, up = (S.cal || []).slice(S.ev + 1, S.ev + 3); if (up.length) h = h.replace(/(<div class="actions">)/, `<div class="evThen"><span>THEN</span>${up.map((e) => `<em>${e.month ? e.month + ' · ' : ''}${e.label}</em>`).join('<i>›</i>')}</div>$1`); }
      h = h.replace('>TO THE LOCKER ROOM<', '><span class="evTo">TO THE </span>LOCKER ROOM<');   /* (beside FREE TIME, or on a short screen, "LOCKER ROOM": the three buttons keep one row) */
      if (!F.available()) return h; return h.replace(/(<div class="actions">)([\s\S]*?)(<\/div><\/div>)/, (m0, a, b, c) => a + b + '<button class="act" data-cgo="free">FREE TIME</button>' + c); };
    const c2 = document.createElement('style'); c2.textContent = `#scrCareer .evThen { margin: 6px 0 2px; font: italic 12px 'HLB', Georgia, serif; color: #d9cba8; opacity: .85; line-height: 1.35; } #scrCareer .evThen span { font: 400 10px 'HLA', Georgia, serif; font-style: normal; letter-spacing: .18em; color: #c9b27a; margin-right: 6px; } #scrCareer .evThen em { font-style: italic; } #scrCareer .evThen i { font-style: normal; margin: 0 6px; color: #c9b27a; }
#scrCareer .evCard .actions:has([data-cgo="free"]) { flex-wrap: wrap; } #scrCareer .evCard .act[data-cgo="free"] { border-color: rgba(232,197,110,.55); }
@media (max-height: 420px) { #scrCareer .evThen { font-size: 11px; margin: 3px 0 0; } }
#scrCareer .evCard .actions:has([data-cgo="free"]) .evTo { display: none; } #scrCareer .evCard .actions:has([data-cgo="free"]) .act { padding-left: 12px; padding-right: 12px; letter-spacing: .08em; }
@media (max-height: 420px), (max-width: 980px) { #scrCareer .evCard .evTo { display: none; } #scrCareer .evCard .actions .act, #scrCareer .evCard .actions:has([data-cgo="free"]) .act { padding: 9px 11px; letter-spacing: .07em; } }`; document.head.appendChild(c2);
    const go0 = CareerUI.go; CareerUI.go = function (where) { if (where === 'free') { clearInterval(this.photoT); F.start(); return; } return go0.apply(this, arguments); };
  }
}

/* ---- the hub, polished. At school the picture was the backs of two armchairs and a figure cut by the menu. The shot is
   now solved for the screen it is on: it looks for a place in front of you (and your friend, if the two of you fit) with a
   clear view past the walls, the furniture and the rest of the room, then aims so that you sit in the open part of the
   screen between the hub's panels — on the Pixel, both Fold screens and a desktop alike — and pushes in slowly. It is
   worked out again when the screen changes (the Fold opened or closed). */
if (typeof CareerUI !== 'undefined') {
  const HF = { set: null, pv: -1, rt: 0 }, cam0 = new THREE.PerspectiveCamera(40, 2, 0.05, 100), _a = new THREE.Vector3(), _d = new THREE.Vector3(), _s = new THREE.Vector3();
  /* the open part of the screen, in NDC: from the right of the left column to the left of the menu */
  const gap = () => { const root = CareerUI.root, W = innerWidth; let l = 0, r = W;
    if (root && !root.hidden) { for (const q of ['.hubTop', '.hubMeters', '.hubMain']) { const e = root.querySelector(q); if (e && e.offsetParent) l = Math.max(l, e.getBoundingClientRect().right); }
      const t = root.querySelector('.hubTabs'); if (t && t.offsetParent) r = Math.min(r, t.getBoundingClientRect().left); }
    if (r - l < W * 0.18) { l = W * 0.42; r = W * 0.96; }   // (no gap to speak of: the right of the screen)
    return { l: l / W * 2 - 1, r: r / W * 2 - 1, c: (l + r) / W - 1 }; };
  /* the room's triangles near you, once per hub (the furniture is merged into the castle's meshes; the physics knows only
     the walls, and a three.js raycast through those big meshes took longer than the whole search may) */
  const soup = (C, rad, y0, y1) => { const T = [], skip = new Set(Object.values(Scenes.cast).map((c) => c.a.root)), v = new THREE.Vector3(), m4 = new THREE.Matrix4(), mi = new THREE.Matrix4();
    const tris = (geo, mw) => { const pos = geo.attributes.position; if (!pos) return; const idx = geo.index, n = idx ? idx.count : pos.count, id = mw.equals(mi), q = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i + 2 < n; i += 3) { let x0 = 1e9, x1 = -1e9, ya = 1e9, yb = -1e9, z0 = 1e9, z1 = -1e9;
        for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, idx ? idx.getX(i + k) : i + k); if (!id) v.applyMatrix4(mw); q[k * 3] = v.x; q[k * 3 + 1] = v.y; q[k * 3 + 2] = v.z;
          if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x; if (v.y < ya) ya = v.y; if (v.y > yb) yb = v.y; if (v.z < z0) z0 = v.z; if (v.z > z1) z1 = v.z; }
        if (yb < y0 || ya > y1 || x1 < C.x - rad || x0 > C.x + rad || z1 < C.z - rad || z0 > C.z + rad) continue; for (let k = 0; k < 9; k++) T.push(q[k]); } };
    const walk = (o) => { if (!o.visible || skip.has(o)) return;
      const mt = o.material && (Array.isArray(o.material) ? o.material[0] : o.material), see = mt && (mt.depthWrite === false || mt.blending === THREE.AdditiveBlending || (mt.transparent && mt.opacity < 0.6));   /* (light shafts, flames, glows: seen through) */
      if (o.isMesh && !o.isSkinnedMesh && o.geometry && !see) { const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
        if (o.isInstancedMesh) { const r0 = g.boundingSphere ? g.boundingSphere.radius : 1; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.premultiply(o.matrixWorld); v.setFromMatrixPosition(m4); if (Math.abs(v.x - C.x) < rad + r0 && Math.abs(v.z - C.z) < rad + r0 && v.y < y1 + r0 && v.y > y0 - r0) tris(g, m4); } }
        else if (g.boundingSphere) { v.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld); if (v.distanceTo(C) < g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() + rad * 1.5) tris(g, o.matrixWorld); } }
      for (const ch of o.children) walk(ch); };
    walk(R.scene); return new Float32Array(T); };
  /* does the segment P→Q cross any of them (Möller–Trumbore, both faces: a lens inside a pillar sees out through its back faces) */
  const hits = (T, P, Q) => { const dx = Q.x - P.x, dy = Q.y - P.y, dz = Q.z - P.z;
    for (let i = 0; i < T.length; i += 9) { const ax = T[i], ay = T[i + 1], az = T[i + 2], e1x = T[i + 3] - ax, e1y = T[i + 4] - ay, e1z = T[i + 5] - az, e2x = T[i + 6] - ax, e2y = T[i + 7] - ay, e2z = T[i + 8] - az;
      const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (det > -1e-9 && det < 1e-9) continue; const inv = 1 / det;
      const tx = P.x - ax, ty = P.y - ay, tz = P.z - az, u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
      const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, w = (dx * qx + dy * qy + dz * qz) * inv; if (w < 0 || u + w > 1) continue;
      const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t > 0.01 && t < 1) return true; }
    return false; };
  /* a clear line from the lens to a point: no wall or furniture (the triangles: the physics' boxes are walking blockers,
     and a low table's stood a metre high across every line to a chest), none of the cast; it stops 0.3 m short, at the body */
  const sees = (P, Q, T, who) => { _d.copy(Q).sub(P); const L = _d.length(); if (L < 0.8) return false; const E = _s.copy(P).addScaledVector(_d, (L - 0.3) / L);
    if (hits(T, P, E)) return false; return !who || Scenes.clearTo(P, Q, who); };
  /* the lens is in the open: no wall within 0.45 m around it */
  const roomy = (P) => { for (let i = 0; i < 6; i++) { const an = i / 6 * TAU, x = P.x + Math.sin(an) * 0.45, z = P.z + Math.cos(an) * 0.45; if (PHY.los && !PHY.los(P.x, P.y, P.z, x, P.y, z)) return false; } return !(PHY.solidAt && PHY.solidAt(P.x, P.y, P.z)); };
  /* aim from P so that the point C sits at (tx, ty) on this screen */
  const aim = (P, C, tx, ty, fov) => { cam0.fov = fov; cam0.aspect = innerWidth / Math.max(1, innerHeight); cam0.updateProjectionMatrix(); cam0.position.copy(P);
    const L = C.clone(), dist = P.distanceTo(C), tv = Math.tan(fov * D2R / 2), th = tv * cam0.aspect, rv = new THREE.Vector3(), uv = new THREE.Vector3();
    for (let i = 0; i < 5; i++) { cam0.lookAt(L); cam0.updateMatrixWorld(true); _a.copy(C).project(cam0); const ex = _a.x - tx, ey = _a.y - ty; if (Math.abs(ex) < 0.003 && Math.abs(ey) < 0.003) break;
      rv.setFromMatrixColumn(cam0.matrixWorld, 0); uv.setFromMatrixColumn(cam0.matrixWorld, 1); L.addScaledVector(rv, ex * dist * th).addScaledVector(uv, ey * dist * tv); }
    cam0.lookAt(L); cam0.updateMatrixWorld(true); return L; };
  const ndc = (Q) => _a.copy(Q).project(cam0);
  const frame = () => { const set = HF.set; if (CareerUI._pv !== HF.pv || Scenes.set !== set || !Scenes.active) return true;
    const c1 = Scenes.cast.me, c2 = Scenes.cast.friend; if (!c1) return false; const t0 = performance.now(), me = c1.a, H1 = Scenes.head(c1), G = gap(), asp = innerWidth / Math.max(1, innerHeight), fov = asp < 1.6 ? 36 : 40, ms = soup(c2 ? Scenes.head(c1).add(Scenes.head(c2)).multiplyScalar(0.5) : H1, 5.5, me.y + 0.32, H1.y + 0.9);
    const fwd = (a) => new THREE.Vector3(Math.sin(a.yaw), 0, Math.cos(a.yaw)), knee = (c) => new THREE.Vector3(c.a.x, c.a.y + 0.5, c.a.z).addScaledVector(fwd(c.a), 0.3), chest = (c) => Scenes.head(c).add(new THREE.Vector3(0, -0.4, 0));
    const subj = [];
    if (c2) { const H2 = Scenes.head(c2), f = fwd(me).add(fwd(c2.a)); if (f.length() < 0.6) { f.set(-(H2.z - H1.z), 0, H2.x - H1.x); if (f.dot(fwd(me)) < 0) f.negate(); } f.normalize();
      subj.push({ two: true, C: H1.clone().add(H2).multiplyScalar(0.5).add(new THREE.Vector3(0, -0.25, 0)), f, y: Math.max(H1.y, H2.y) + 0.14, ty: 0.06, Ds: [3.0, 3.5, 4.0, 2.6] }); }
    subj.push({ two: false, C: chest(c1).add(new THREE.Vector3(0, 0.08, 0)), f: fwd(me), y: H1.y + 0.12, ty: 0.02, Ds: [2.6, 3.0, 2.2, 3.5] });
    const cands = [];
    for (const S of subj) for (const D of S.Ds) for (const da of [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2]) { const c = Math.cos(da), sn = Math.sin(da), dx = S.f.x * c - S.f.z * sn, dz = S.f.x * sn + S.f.z * c;
      cands.push({ S, D, da, P: new THREE.Vector3(S.C.x + dx * D, S.y, S.C.z + dz * D), sc: Math.abs(da) * 1.2 + Math.abs(D - S.Ds[0]) * 0.5 + (S.two ? 0 : 1.1) }); }
    cands.sort((a, b) => a.sc - b.sc);
    const inGap = (v, m) => v.z < 1 && v.x > G.l + m && v.x < G.r - m && v.y > -0.92 && v.y < 0.9;
    let best = null; const why = {}; const hf0 = PHY.hf; PHY.hf = null;   /* (the sight lines see walls only: the hillside's heightfield lies over the cellars, and every line under it read as blocked) */
    try { for (const strict of [true, false]) { for (const k of cands) { if (performance.now() - t0 > 400) break; const S = k.S, P = k.P;
        const no = (w) => { why[w] = (why[w] || 0) + 1; };
        if (Object.values(Scenes.cast).some((c) => { const kn = knee(c); return Math.hypot(c.a.x - P.x, c.a.z - P.z) < 1.25 || Math.hypot(kn.x - P.x, kn.z - P.z) < 1.1; })) { no('near'); continue; }   /* (a seated body reaches forward: a lens a metre from a face sat in its hands) */
        const L = aim(P, S.C, G.c, S.ty, fov);
        if (!inGap(ndc(H1), 0.03)) { no('gap'); continue; } if (S.two && !inGap(ndc(Scenes.head(c2)), 0.03)) { no('gap2'); continue; }
        if (!roomy(P)) { no('roomy'); continue; } if (!sees(P, H1, ms, c1)) { no('head'); continue; } if (!sees(P, chest(c1), ms, c1)) { no('chest'); continue; }
        if (S.two && (!sees(P, Scenes.head(c2), ms, c2) || !sees(P, chest(c2), ms, c2))) { no('fr'); continue; }
        if (strict && (!sees(P, knee(c1), ms, c1) || (S.two && !sees(P, knee(c2), ms, c2)))) { no('knee'); continue; }   // (the first pass wants the knees too: no chair back across the lower frame)
        best = { P, L, C: S.C, two: S.two, strict, sc: k.sc, D: k.D, da: k.da }; break; }
      if (best) break; } } finally { PHY.hf = hf0; }
    HF.dbg = { ms: Math.round(performance.now() - t0), tris: ms.length / 9, why, best: best && { two: best.two, strict: best.strict, sc: +best.sc.toFixed(2), D: best.D, da: best.da, P: best.P.toArray().map((v) => +v.toFixed(2)), me: [me.x, me.z, me.yaw].map((v) => +v.toFixed(2)) } };
    if (!best) return true;   // (keep the room's own shot)
    /* a slow push in, 0.3 m over the shot */
    const p2 = best.P.clone().addScaledVector(_d.copy(best.C).sub(best.P).normalize(), 0.3), l2 = best.L.clone().addScaledVector(_d, 0.3);
    Scenes.shot({ world: true, p: best.P.toArray(), l: best.L.toArray(), p2: p2.toArray(), l2: l2.toArray(), fov, dur: 45, blend: 0 }, true); if (Scenes.cam) Scenes.cam.free = true; HF.done = true; return true; };
  /* a professional's hub: the players' gate keeps its lens and its slow drift, aimed so that you stand in the gap too */
  const framePro = () => { if (CareerUI._pv !== HF.pv || Scenes.set !== HF.set || !Scenes.active) return true; const c1 = Scenes.cast.me; if (!c1) return false;
    const G = gap(), fov = innerWidth / Math.max(1, innerHeight) < 1.6 ? 38 : 34, C = Scenes.head(c1).add(new THREE.Vector3(0, -0.45, 0)), P = Scenes.W([-1.1, 1.3, -2.29], new THREE.Vector3()), P2 = Scenes.W([-0.98, 1.3, -2.07], new THREE.Vector3());
    const L = aim(P, C, G.c, -0.02, fov), L2 = aim(P2, C, G.c, -0.02, fov);   /* (knees up, the head clear of the top: at 30° the hair met the frame) */
    Scenes.shot({ world: true, p: P.toArray(), l: L.toArray(), p2: P2.toArray(), l2: L2.toArray(), fov, dur: 40, blend: 0 }, true); if (Scenes.cam) Scenes.cam.free = true; HF.done = true; return true; };
  const hb0 = CareerUI.hubBackdrop; CareerUI.hubBackdrop = function (kind) { const was = this.backdrop === kind && Scenes.active, r = hb0.apply(this, arguments); if (was || (kind !== 'school' && kind !== 'pro') || !Career.S) return r;
    HF.set = Scenes.set; HF.pv = this._pv; HF.kind = kind; HF.done = false; let tries = 0; const fn = kind === 'pro' ? framePro : frame;
    /* once you are in place (and the friend in the other chair: the template can come a moment later) */
    const go = () => { if (this._pv !== HF.pv) return; const wait = !Scenes.cast.me || (kind === 'school' && Career.S.friend && !Scenes.cast.friend && tries < 40); if (wait) { if (tries++ < 70) setTimeout(go, 60); return; } fn(); };
    setTimeout(go, 60); return r; };
  addEventListener('resize', () => { clearTimeout(HF.rt); HF.rt = setTimeout(() => { const root = CareerUI.root; if (HF.done && CareerUI.backdrop === HF.kind && Scenes.set === HF.set && root && !root.hidden && root.querySelector('.hub')) (HF.kind === 'pro' ? framePro : frame)(); }, 300); });
  /* a shot already checked against the room keeps its lens: the scene camera's own guard pulled it toward what it looks at
     whenever a physics box lay between, and those boxes stand a metre high round every table — the lens landed in a lap */
  { const cn0 = Scenes.camNow; Scenes.camNow = function () { if (this.cam && this.cam.free && !this.noLos) { this.noLos = true; try { return cn0.apply(this, arguments); } finally { this.noLos = false; } } return cn0.apply(this, arguments); }; }
  CareerUI.hubFrame = frame; CareerUI.hubFramePro = framePro; CareerUI.hubFrameInfo = HF; HF.fn = { soup, hits, sees, roomy, aim };
  /* a long name fits the card: the name steps down in size until it does (it ran into the OVR column) */
  const h0 = CareerUI.hub; CareerUI.hub = function () { const r = h0.apply(this, arguments); const b = this.root && this.root.querySelector('.hubWho b'); if (b) { let fs = parseFloat(getComputedStyle(b).fontSize) || 18; b.style.whiteSpace = 'nowrap'; for (let i = 0; i < 10 && b.scrollWidth > b.clientWidth + 1 && fs > 12; i++) { fs -= 1; b.style.fontSize = fs + 'px'; } } return r; };
}
