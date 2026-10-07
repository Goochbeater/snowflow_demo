/* ==== p96i_qc_locker.js ==== */
/* QUIDDITCH CAREER — the locker room, at the castle's players' gate. Before a fixture you stand among your team-mates
   in their kit by the gate onto the pitch (walk with the stick, USE to talk): each talk moves their chemistry and may
   hand you a goal for the match (NBA 2K style); your captain or coach at the board takes the game plan; your broom,
   your own reflection in the brass of the gate. Walk out through the gate — or press TAKE THE PITCH — and the match
   begins. (Talk options, moods, goals and plans ported from Quidditch Skybound.) */
const PERSONALITY = ['steady', 'joker', 'fiery', 'quiet'];
const TALK_OPTS = [
  { k: 'enc', t: 'Encourage', tone: 'gr', like: { steady: 3, joker: 1, fiery: 1, quiet: 4 } },
  { k: 'joke', t: 'Crack a joke', tone: 'sh', like: { steady: 0, joker: 5, fiery: 1, quiet: -1 } },
  { k: 'chal', t: 'Challenge them', tone: 'fi', like: { steady: -1, joker: 0, fiery: 5, quiet: -2 } },
  { k: 'plan', t: 'Talk tactics', tone: 'tm', like: { steady: 4, joker: -1, fiery: 2, quiet: 2 } },
];
const Locker = {
  on: false, ev: null, cbPlay: null, cbSim: null, ui: null, panel: false, mates: [], uses: [], talked: {},
  init() {
    if (this.ui) return; const d = document.createElement('div'); d.id = 'locker';
    d.innerHTML = `<div class="lkTop"><div class="lkTitle" id="lkTitle"></div><div class="lkGoals" id="lkGoals"></div><div class="lkBtns"><button class="act" id="lkSim">SIM MATCH</button><button class="act go" id="lkPlay">TAKE THE PITCH</button></div></div>
      <div class="lkHint" id="lkHint"></div><div class="lkPanel" id="lkPanel"></div>`;
    document.body.appendChild(d); this.ui = d;
    d.querySelector('#lkPlay').addEventListener('click', () => this.play());
    d.querySelector('#lkSim').addEventListener('click', () => { this.exit(); this.cbSim && this.cbSim(); });
  },
  async enter(ev, onPlay, onSim) {
    this.init(); const S = Career.S, variant = S.phase === 'school' ? 'school' : S.phase === 'wc' ? 'nation' : 'pro';
    this.ev = ev; this.cbPlay = onPlay; this.cbSim = onSim; this.talked = {};
    const team = Career.myTeam(), key = QC.key(team), roster = (S.phase === 'school' ? Career.squad() : S.roster || []).slice(0, 6);
    const capt = S.phase === 'school' && S.capt && S.mates[S.capt] && !S.mates[S.capt].gone ? S.mates[S.capt] : null;
    this.coachName = S.phase === 'school' ? (S.captain ? `${Career.first()} (you're captain)` : capt ? capt.name : 'Madam Hooch') : S.phase === 'wc' ? 'The national coach' : 'Coach Brennan Hale';
    QC.inject([key]); HL.ui.fade(1);
    if (S.phase !== 'school' && ev && ev.opp != null) { const ok = QC.key(ev.opp), home = ev.home !== false; QC.dress(home ? key : ok, home ? ok : key); }   // the stands already fly the two sides' colours
    const tpls = roster.map((m) => HL.student(key, m.body === 'f', (m.look && m.look.v) || 1, true)), coachT = capt ? HL.student(key, capt.body === 'f', (capt.look && capt.look.v) || 1, true) : (S.phase === 'school' ? 'prof_b' : 'prof_a'), meT = HL.student(key, S.profile.body === 'f', (S.profile.look && S.profile.look.v) || 1, true);
    await CAST.need([...tpls, coachT, meT]);
    Scenes.leave(true); CareerUI.root.hidden = true; CareerUI.backdrop = null;
    const set = STAGES.locker(variant), F = set.F; this.set = set; const W = (p) => { const s0 = Scenes.F; Scenes.F = F; const v = Scenes.W(p, new THREE.Vector3()); Scenes.F = s0; return v; };
    const put = (tpl, at) => { const w = W(at), y = HL.gy(w.x, w.z) + 0.05, a = new Actor(CHAR.T[tpl], { x: w.x, y, z: w.z, yaw: F.yaw + at[3], hp: 100, team: 'npc', moves: MOV.wizard, r: 0.3, h: 1.8 }); a.noTarget = true; a.base = 'calm'; a.x = w.x; a.y = y; a.z = w.z; a.animate(0.016 + RNG()); a.pose3D(0.016); return a; };
    this.mates = []; this.uses = [];
    roster.forEach((m, i) => { const at = set.anchors['mate' + i]; if (!at) return; m.pers = m.pers || PERSONALITY[(m.name.length + i) % 4]; const a = put(tpls[i], at), mt = { m, a };
      this.mates.push(mt); this.uses.push(HL.interact(V3(a.x, a.y + 1, a.z), 2.4, `Talk · ${m.name.split(' ')[0]}`, () => this.talk(mt))); });
    const bd = set.anchors.board; this.coach = put(coachT, [bd[0] + 0.3, 0, bd[2] + 0.2, PI]); this.coach.base = 'talk';
    this.uses.push(HL.interact(V3(this.coach.x, this.coach.y + 1, this.coach.z), 2.4, 'The game plan', () => this.tactics()));
    { const w = W([-1.8, 0, 0.8]); this.uses.push(HL.interact(V3(w.x, HL.gy(w.x, w.z) + 1, w.z), 1.8, 'Your broom', () => this.brooms())); }
    { const w = W([1.8, 0, 0.8]); this.uses.push(HL.interact(V3(w.x, HL.gy(w.x, w.z) + 1, w.z), 1.8, 'Look yourself over', () => this.mirror())); }
    { const w = W(set.anchors.pitchMe); this.gate = w; this.uses.push(HL.interact(V3(w.x, HL.gy(w.x, w.z) + 1, w.z), 3.2, 'Take the pitch', () => this.play())); }
    // you, in kit, at your place in the huddle
    this._hero = CHAR.T.maul; CHAR.T.maul = CHAR.T[meT]; const me = W(set.anchors.lockMe); PLAYER.spawn(me.x, HL.gy(me.x, me.z) + 0.05, me.z, F.yaw + set.anchors.lockMe[3]); CAM.reset(F.yaw + set.anchors.lockMe[3]); CAM.pitch = -0.12; CAM.snap = true;
    this.on = true; this.ui.classList.add('on'); this.panel = false; MG.state = 'play'; HL.ui.show(true); document.body.classList.add('qclocker'); if (TOUCH.on) TOUCH.layout(); IN.buf = {};
    this.ui.querySelector('#lkTitle').innerHTML = `<b>${ev.label}</b><span>${teamName(team)} v ${teamName(ev.opp)}${ev.home === false ? ' (away)' : ''}</span>`;
    this.ui.querySelector('#lkHint').textContent = TOUCH.on ? 'Walk up to a team-mate and TALK appears under your thumb · TAKE THE PITCH when you are ready' : 'Walk up to a team-mate and press E to talk · walk out through the gate to start';
    this.closePanel(); this.renderGoals(); HL.ui.fade(0);
  },
  exit() {
    if (!this.on) return; this.on = false; this.ui.classList.remove('on'); this.closePanel(); document.body.classList.remove('qclocker'); if (TOUCH.on) TOUCH.layout();
    for (const mt of this.mates) mt.a.dispose(); if (this.coach) this.coach.dispose(); this.mates = []; this.coach = null;
    for (const u of this.uses) { const i = HL.uses.indexOf(u); if (i >= 0) HL.uses.splice(i, 1); } this.uses = [];
    if (this._hero) { CHAR.T.maul = this._hero; this._hero = null; }
  },
  renderGoals() {
    const S = Career.S, el = this.ui.querySelector('#lkGoals');
    el.innerHTML = S.goals.length ? S.goals.map(g => `<div class="lkGoal"><i>◆</i>${g.text}</div>`).join('') : `<div class="lkGoal dim">Talk to team-mates for match goals</div>`;
    el.innerHTML += `<div class="lkGoal tac"><i>${QC.svg('pencil')}</i>${TACTICS[S.tactic].name}</div>`;
  },
  update(dt) {
    if (!this.on) return; const P = PLAYER.a;
    for (const mt of this.mates) { const a = mt.a; if (P) { const d = Math.hypot(P.x - a.x, P.z - a.z); if (d < 3) { a.lookYaw = clamp(wrapA(Math.atan2(P.x - a.x, P.z - a.z) - a.yaw), -1, 1) * 0.8; if (a.base !== 'talk' && !this.talked[mt.m.id]) a.setBase('talk', 0.3); } else { a.lookYaw = damp(a.lookYaw || 0, 0, 3, dt); if (a.base === 'talk' && !this.panel) a.setBase('calm', 0.4); } } a.animate(dt); a.pose3D(dt); }
    if (this.coach) { this.coach.animate(dt); this.coach.pose3D(dt); }
    if (this.panel && MG.state === 'play') { PLAYER.a.vx = PLAYER.a.vz = 0; }
    // out through the gate
    if (P && this.gate && Math.hypot(P.x - this.gate.x, P.z - this.gate.z) < 1.2) this.play();
  },
  openPanel(html) { const p = this.ui.querySelector('#lkPanel'); p.innerHTML = html; p.classList.add('on'); this.panel = true; PLAYER.state = 'cine'; p.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.closePanel())); return p; },
  closePanel() { const p = this.ui && this.ui.querySelector('#lkPanel'); if (!p) return; p.classList.remove('on'); if (this.panel && PLAYER.state === 'cine') PLAYER.state = 'move'; this.panel = false; IN.buf = {}; },
  moodLine(m) {
    const c = m.chem, first = Career.first();
    if (m.grudge) return pick([`Saw what the Quill printed. "Passengers", was it?`, `Read Witch Weekly this morning. Interesting stuff, ${first}.`]);
    if (c > 75) return pick([`${first}! Feeling sharp today. Let's give them a show.`, `Same as last time? You and me down the left wing.`, `I've got your back out there. Always.`]);
    if (c > 50) return pick([`Big one today. You ready?`, `Their Keeper drifts left. Watch for it.`, `Stay close in the second half, yeah?`]);
    if (c > 30) return pick([`...Hey.`, `Just pass the Quaffle once in a while, alright?`, `We'll see how today goes.`]);
    return pick([`Don't talk to me right now.`, `You do your thing, I'll do mine.`]);
  },
  talk(mt) {
    const m = mt.m, done = this.talked[m.id];
    const role = m.role === 'chaser' ? 'Chaser' : m.role === 'beater' ? 'Beater' : m.role === 'keeper' ? 'Keeper' : 'Seeker';
    const p = this.openPanel(`<div class="lkCard"><div class="lkWho"><b>${m.name}</b><span>${role} · ${m.pers} · chemistry ${Math.round(m.chem)}</span><div class="bar"><i style="width:${m.chem}%"></i></div></div>
      <div class="lkLine">"${this.moodLine(m)}"</div>
      <div class="lkOpts">${done ? `<div class="lkDone">You've already talked.</div>` : TALK_OPTS.map(o => `<button class="lkOpt" data-k="${o.k}"><i class="tone ${o.tone}">${TONE_ICON[o.tone]}</i>${o.t}</button>`).join('')}</div>
      <div class="actions"><button class="act" data-close>BACK</button></div></div>`);
    if (mt.a) { mt.a.setBase('talk', 0.2); mt.a.yaw = Math.atan2(PLAYER.a.x - mt.a.x, PLAYER.a.z - mt.a.z); }
    p.querySelectorAll('.lkOpt').forEach(b => b.addEventListener('click', () => {
      const o = TALK_OPTS.find(x => x.k === b.dataset.k), d = (o.like[m.pers] || 0) + (Math.random() < 0.3 ? 1 : 0);
      m.chem = clamp(m.chem + d, 0, 100); if (d > 2) m.grudge = false;
      Career.S.persona[o.tone] = (Career.S.persona[o.tone] || 0) + 0.25;
      this.talked[m.id] = true;
      const reply = d >= 3 ? pick([`Ha! Exactly what I needed.`, `Right. Let's do this.`, `You always know what to say.`]) : d > 0 ? pick([`Yeah. Alright.`, `Fair enough.`]) : pick([`...Not now.`, `Was that supposed to help?`]);
      // a teammate goal, NBA 2K style
      const S = Career.S, kinds = m.role === 'chaser' ? ['feed', 'assist', 'score2'] : m.role === 'beater' ? ['clean', 'steal'] : m.role === 'seeker' ? ['score2', 'finisher'] : ['clean', 'feed'];
      let goal = null;
      if (S.goals.length < 3 && d >= 0 && Math.random() < 0.85) { const k = pick(kinds.filter(x => !(x === 'feed' || x === 'assist') || m.role === 'chaser') .concat(S.profile.pos === 'seeker' ? ['snitch'] : [])); goal = Goals.make(m, k); }
      p.querySelector('.lkLine').innerHTML = `"${reply}"${d ? ` <em class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${d} chemistry</em>` : ''}`;
      p.querySelector('.lkOpts').innerHTML = goal ? `<div class="lkGoalOffer"><b>${m.name.split(' ')[0]}:</b> "${{ feed: 'Get me the Quaffle. Three passes, minimum.', assist: 'Set me up for one today.', score2: 'I want to see two goals from you.', clean: 'Keep your head. No Bludgers to the face today.', steal: 'Win it back for us. Twice.', snitch: 'Just catch the Snitch. Simple.', finisher: 'Show off a bit. Land a finisher.' }[goal.kind]}"<span>${goal.text} · +${goal.xp} XP · +${goal.chem} chemistry</span></div><button class="lkOpt" id="lkAccept">ACCEPT GOAL</button><button class="lkOpt" data-close>NO THANKS</button>` : `<div class="lkDone">${m.name.split(' ')[0]} nods and goes back to lacing ${pick(['their', 'their'])} boots.</div>`;
      const acc = p.querySelector('#lkAccept'); if (acc) acc.addEventListener('click', () => { S.goals.push(goal); this.renderGoals(); this.closePanel(); Sound.play('ready', { vol: 0.5 }); });
      p.querySelectorAll('[data-close]').forEach(x => x.addEventListener('click', () => this.closePanel()));
      Career.save();
    }));
  },
  tactics() {
    const S = Career.S;
    const p = this.openPanel(`<div class="lkCard"><div class="lkWho"><b>${this.coachName}</b><span>Pick the game plan</span></div>
      <div class="lkTac">${Object.entries(TACTICS).map(([k, t]) => `<button class="lkOpt ${S.tactic === k ? 'on' : ''}" data-t="${k}"><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>
      <div class="actions"><button class="act" data-close>DONE</button></div></div>`);
    p.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { S.tactic = b.dataset.t; p.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); this.renderGoals(); Career.save(); Sound.play('ui'); }));
  },
  brooms() {
    const S = Career.S;
    const p = this.openPanel(`<div class="lkCard"><div class="lkWho"><b>Broom rack</b><span>${S.brooms.length} broom${S.brooms.length > 1 ? 's' : ''} owned</span></div>
      <div class="lkTac">${S.brooms.map(id => { const b = BROOMS[id]; return `<button class="lkOpt ${S.broom === id ? 'on' : ''}" data-b="${id}"><b>${b.name}</b><small>Speed ${Math.round(b.spd * 100)} · Handling ${Math.round(b.hnd * 100)} · ${b.desc}</small></button>`; }).join('')}</div>
      <div class="actions"><button class="act" data-close>DONE</button></div></div>`);
    p.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => { S.broom = b.dataset.b; p.querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', x === b)); Career.save(); Sound.play('ui'); }));
  },
  mirror() {
    const S = Career.S, o = Career.ovr();
    this.openPanel(`<div class="lkCard"><div class="lkWho"><b>${S.profile.name}</b><span>${S.profile.pos === 'seeker' ? 'Seeker' : 'Chaser'} · OVR ${o} · ${Career.persona().label}</span></div>
      <div class="lkStats">${ATTRS.map(([k, n]) => `<div><i>${n}</i><div class="bar"><i style="width:${S.attrs[k]}%"></i></div><b>${S.attrs[k]}</b></div>`).join('')}</div>
      <div class="actions"><button class="act" data-close>BACK</button></div></div>`);
  },
  /* out of the gate: the crowd's roar, the light of the pitch, the match */
  play() {
    if (!this.on) return; this.exit(); Sound.crowdRoar(); HL.ui.fade(1);
    setTimeout(() => { this.cbPlay && this.cbPlay(); }, 450);
  },
};
/* the huddle lives in the castle's play frame */
{ const u0 = HL.update; HL.update = function (rdt) { u0(rdt); if (Locker.on && MG.state === 'play') Locker.update(Math.min(rdt, 0.05)); }; if (MG.gameUpdate === u0) MG.gameUpdate = HL.update; }
/* in the huddle and the career's screens the castle's errands, points and purse step aside; on glass only the stick, USE and the menu are shown */
{ const st = document.createElement('style'); st.textContent = `body.qcareer #hlQuest, body.qcareer #hlPts, body.qcareer #hlGold, body.qcareer #hlPot, body.qcareer #hlWay { display: none !important; }
  body.qclocker #hlVit, body.qclocker #hlBar, body.qclocker #hlBarT { display: none !important; }
  body.qclocker #tc .tcB:not([data-id="use"]):not([data-id="pause"]) { display: none !important; }
  #locker .lkHint { pointer-events: none; } #locker .lkTop { pointer-events: none; } #locker .lkTop > * { pointer-events: auto; }
  @media (max-height: 620px) { #locker .lkTop { top: calc(6px + env(safe-area-inset-top)); left: 10px; right: 60px; } #locker .lkTitle b { font-size: 12px; } #locker .lkTitle span { font-size: 10.5px; } #locker .lkGoals { font-size: 11px; padding: 5px 9px; max-width: 220px; } #locker .act { padding: 7px 12px; font-size: 11px; } #locker .lkHint { bottom: calc(8px + env(safe-area-inset-bottom)); font-size: 11px; }
    #locker .lkPanel { top: calc(50% + 16px); max-height: calc(100% - 70px); width: min(620px, 74vw); } #locker .lkCard { padding: 10px 14px; } #locker .lkWho b { font-size: 15px; } #locker .lkWho span { margin-bottom: 2px; } #locker .lkLine { font-size: 14px; margin: 6px 0; }
    #locker .lkOpts { grid-template-columns: 1fr 1fr; } #locker .lkOpt { padding: 7px 10px; font-size: 13px; } #locker .lkGoalOffer, #locker .lkDone, #locker .lkOpts > .actions { grid-column: 1 / -1; } #locker .lkCard .actions { margin-top: 8px; } }
  #locker:has(.lkPanel.on) .lkHint { opacity: 0; }`;
  HL.START.push(() => document.head.appendChild(st)); }
