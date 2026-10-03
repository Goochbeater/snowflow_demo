// ===================== LOCKER ROOM: first-person walkable pre-game hub =====================
// Left half: move. Right half: look. Walk up to a teammate, the tactics board, the broom rack or the tunnel door.
const PERSONALITY = ['steady', 'joker', 'fiery', 'quiet'];
const TALK_OPTS = [
  { k: 'enc', t: 'Encourage', tone: 'gr', like: { steady: 3, joker: 1, fiery: 1, quiet: 4 } },
  { k: 'joke', t: 'Crack a joke', tone: 'sh', like: { steady: 0, joker: 5, fiery: 1, quiet: -1 } },
  { k: 'chal', t: 'Challenge them', tone: 'fi', like: { steady: -1, joker: 0, fiery: 5, quiet: -2 } },
  { k: 'plan', t: 'Talk tactics', tone: 'tm', like: { steady: 4, joker: -1, fiery: 2, quiet: 2 } },
];
const Locker = {
  on: false, yaw: 0, pitch: 0, pos: new THREE.Vector3(), stick: { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look: { id: null, x: 0, y: 0 },
  near: null, talked: {}, ev: null, cbPlay: null, cbSim: null, ui: null, panel: false,
  init() {
    const d = document.createElement('div'); d.id = 'locker';
    d.innerHTML = `<div class="lkTop"><div class="lkTitle" id="lkTitle"></div><div class="lkGoals" id="lkGoals"></div><div class="lkBtns"><button class="act" id="lkSim">SIM MATCH</button><button class="act go" id="lkPlay">TAKE THE PITCH</button></div></div>
      <div class="lkStick" id="lkStick"><i></i></div><div class="lkHint" id="lkHint">Drag left to walk · drag right to look</div>
      <button class="lkAct" id="lkAct"></button><div class="lkCross"></div><div class="lkPanel" id="lkPanel"></div>`;
    document.body.appendChild(d); this.ui = d;
    const zone = e => (e.clientX < innerWidth * 0.45 ? 'move' : 'look');
    d.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || e.target.closest('.lkPanel')) return;
      if (zone(e) === 'move' && this.stick.id === null) { this.stick.id = e.pointerId; this.stick.ox = e.clientX; this.stick.oy = e.clientY; const s = d.querySelector('#lkStick'); s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.classList.add('on'); }
      else if (this.look.id === null) { this.look.id = e.pointerId; this.look.x = e.clientX; this.look.y = e.clientY; }
      d.setPointerCapture && d.setPointerCapture(e.pointerId);
    });
    d.addEventListener('pointermove', e => {
      if (e.pointerId === this.stick.id) { const dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy, l = Math.hypot(dx, dy), m = Math.min(l, 50) / Math.max(l, 1e-3); this.stick.x = dx * m / 50; this.stick.y = dy * m / 50; d.querySelector('#lkStick i').style.transform = `translate(${dx * m}px,${dy * m}px)`; }
      else if (e.pointerId === this.look.id) { this.yaw -= (e.clientX - this.look.x) * 0.006 * Settings.sens; this.pitch = clamp(this.pitch - (e.clientY - this.look.y) * 0.005 * Settings.sens, -0.9, 0.7); this.look.x = e.clientX; this.look.y = e.clientY; d.querySelector('#lkHint').style.opacity = 0; }
    });
    const up = e => { if (e.pointerId === this.stick.id) { this.stick.id = null; this.stick.x = this.stick.y = 0; d.querySelector('#lkStick').classList.remove('on'); d.querySelector('#lkStick i').style.transform = ''; } if (e.pointerId === this.look.id) this.look.id = null; };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
    d.querySelector('#lkAct').addEventListener('click', () => this.interact());
    d.querySelector('#lkPlay').addEventListener('click', () => this.play());
    d.querySelector('#lkSim').addEventListener('click', () => { this.exit(); this.cbSim && this.cbSim(); });
  },
  enter(ev, onPlay, onSim) {
    const S = Career.S, variant = S.phase === 'school' ? 'school' : S.phase === 'wc' ? 'nation' : 'pro';
    this.ev = ev; this.cbPlay = onPlay; this.cbSim = onSim; this.talked = {};
    const set = Scenes.enter('locker', variant, { mode: 'free' });
    this.set = set;
    // nameplates: the player's locker
    const pl = set.nameplates[2]; if (pl) pl.plate.material = new THREE.MeshBasicMaterial({ map: Props.sign(Career.surname().toUpperCase(), 0.9, 0.18, '#d8b060', '#1a1008').material.map });
    // teammates in kit around the room
    const team = Career.myTeam(), roster = (S.phase === 'school' ? Career.squad() : S.roster || []).slice(0, 6);
    this.mates = [];
    roster.forEach((m, i) => {
      const a = set.anchors['mate' + i]; if (!a) return;
      m.pers = m.pers || PERSONALITY[(m.name.length + i) % 4];
      const h = Scenes.spawn('mate_' + m.id, { at: a, anim: a[4] || 'idle', look: Object.assign({}, m.look, { body: m.body }), o: { outfit: 'kit', team } });
      this.mates.push({ m, h, pos: new THREE.Vector3(a[0], 0, a[2]) });
    });
    // coach / captain at the board
    const cb = set.anchors.board;
    const capt = S.phase === 'school' && S.capt && S.mates[S.capt] && !S.mates[S.capt].gone ? S.mates[S.capt] : null;
    this.coach = Scenes.spawn('coach', { at: [cb[0] + 0.3, 0, cb[2] + 1.0, -2.0], anim: 'talk', look: capt ? Object.assign({}, capt.look, { body: capt.body }) : { body: 'm', skin: 2, hair: 3, hairCol: '#b9b2a8', beard: true }, o: { outfit: S.phase === 'school' ? 'kit' : 'track', team } });
    this.coachName = S.phase === 'school' ? (S.captain ? `${Career.first()} (you're captain)` : capt ? capt.name : 'Madam Elsworth') : 'Coach Brennan Hale';
    this.pos.set(-3.4, 0, set.anchors.lockMe[2] - 0.6); this.yaw = Math.PI * 0.62; this.pitch = -0.05;
    this.on = true; this.ui.classList.add('on'); this.panel = false;
    this.ui.querySelector('#lkTitle').innerHTML = `<b>${ev.label}</b><span>${teamName(team)} v ${teamName(ev.opp)}${ev.home === false ? ' (away)' : ''}</span>`;
    this.ui.querySelector('#lkHint').style.opacity = 1;
    this.closePanel(); this.renderGoals();
    HUD.show(false);
  },
  exit() { this.on = false; this.ui.classList.remove('on'); this.closePanel(); },
  renderGoals() {
    const S = Career.S, el = this.ui.querySelector('#lkGoals');
    el.innerHTML = S.goals.length ? S.goals.map(g => `<div class="lkGoal"><i>◆</i>${g.text}</div>`).join('') : `<div class="lkGoal dim">Talk to team-mates for match goals</div>`;
    el.innerHTML += `<div class="lkGoal tac"><i>✎</i>${TACTICS[S.tactic].name}</div>`;
  },
  update(rdt) {
    if (!this.on) return;
    const set = this.set, B = set.bounds;
    const sp = 2.2, f = _v1.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), r = _v2.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    if (!this.panel) {
      this.pos.addScaledVector(f, -this.stick.y * sp * rdt).addScaledVector(r, this.stick.x * sp * rdt);
      this.pos.x = clamp(this.pos.x, B.x0, B.x1 + (Math.abs(this.pos.z) < 1 ? 14 : 0)); this.pos.z = clamp(this.pos.z, B.z0, B.z1);
      for (const mt of this.mates) { const d = _v3.subVectors(this.pos, mt.pos); d.y = 0; const l = d.length(); if (l < 0.55 && l > 1e-3) this.pos.addScaledVector(d, (0.55 - l) / l); }
      // benches block the middle
      for (const bz of [-1.9, 1.9]) if (Math.abs(this.pos.z - bz) < 0.4 && this.pos.x > -5.6 && this.pos.x < 4.4) this.pos.z = bz + Math.sign(this.pos.z - bz || 1) * 0.4;
    }
    const cam = Render.camera, bob = Math.hypot(this.stick.x, this.stick.y) * Math.sin(performance.now() / 160) * 0.025;
    cam.position.set(this.pos.x, 1.66 + bob, this.pos.z);
    _e1.set(this.pitch, this.yaw, 0, 'YXZ'); cam.quaternion.setFromEuler(_e1);
    if (cam.fov !== 62) { cam.fov = 62; cam.updateProjectionMatrix(); }
    // nearest interactable in front of us
    const fwd = _v4.set(0, 0, -1).applyQuaternion(cam.quaternion);
    let best = null, bs = 2.4;
    const consider = (p, kind, data, label) => { const d = _v5.subVectors(p, this.pos); d.y = 0; const l = d.length(); if (l > 2.4) return; const dot = d.normalize().dot(_v6.set(fwd.x, 0, fwd.z).normalize()); if (dot < 0.55) return; const s = l - dot; if (s < bs) { bs = s; best = { kind, data, label }; } };
    for (const mt of this.mates) consider(mt.pos, 'mate', mt, `TALK · ${mt.m.name.split(' ')[0].toUpperCase()}`);
    consider(this.coach.root.position, 'board', null, 'GAME PLAN');
    consider(_v3.set(set.lockers[4].x, 0, -3.6), 'rack', null, 'BROOM RACK');
    consider(_v3.set(-6.6, 0, -3.2), 'mirror', null, 'MIRROR');
    consider(_v3.set(7.4, 0, 0), 'door', null, 'TAKE THE PITCH');
    this.near = best;
    const a = this.ui.querySelector('#lkAct');
    if (best && !this.panel) { a.textContent = best.label; a.classList.add('on'); } else a.classList.remove('on');
    // team-mates glance at you when close
    for (const mt of this.mates) { const d = this.pos.distanceTo(mt.pos); if (d < 2.6 && mt.h.cur !== 'talk' && !/sit/.test(mt.h.cur)) mt.h.play('talk'); }
    if (this.pos.x > 9.5) this.play();
  },
  interact() {
    const n = this.near; if (!n) return;
    Sound.play('ui');
    if (n.kind === 'mate') this.talk(n.data);
    else if (n.kind === 'board') this.tactics();
    else if (n.kind === 'rack') this.brooms();
    else if (n.kind === 'mirror') this.mirror();
    else if (n.kind === 'door') this.play();
  },
  openPanel(html) { const p = this.ui.querySelector('#lkPanel'); p.innerHTML = html; p.classList.add('on'); this.panel = true; p.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.closePanel())); return p; },
  closePanel() { const p = this.ui.querySelector('#lkPanel'); p.classList.remove('on'); this.panel = false; },
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
    mt.h.play('talk');
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
    p.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { S.tactic = b.dataset.t; this.set.board.tactic = S.tactic; p.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); this.renderGoals(); Career.save(); Sound.play('ui'); }));
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
  // tunnel walk-out: down the corridor toward the light, then the match
  play() {
    if (!this.on) return;
    this.exit();
    Scenes.mode = 'view';
    const cam = Render.camera;
    Scenes.cp.copy(cam.position); Scenes.cl.copy(cam.position).add(_v1.set(0, 0, -1).applyQuaternion(cam.quaternion));
    Scenes.shot({ p: [7.2, 1.65, 0.1], l: [30, 1.7, 0], p2: [27, 1.75, 0], l2: [40, 1.8, 0], fov: 60, dur: 3.2, blend: 0.8 });
    Sound.crowdRoar(0.8, 3.5);
    const fx = Render.post.fx; let t = 0;
    const tick = () => { t += 1 / 60; fx.exposure = 1.15 + easeIn(t / 3) * 4; if (t < 3.1 && Scenes.active) requestAnimationFrame(tick); else { fx.flash = 1; fx.flashColor.setRGB(1, 0.98, 0.92); this.cbPlay && this.cbPlay(); setTimeout(() => { fx.flash = 0; }, 140); } };
    requestAnimationFrame(tick);
  },
};
