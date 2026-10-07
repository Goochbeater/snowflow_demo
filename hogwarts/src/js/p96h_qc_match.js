/* ==== p96h_qc_match.js ==== */
/* QUIDDITCH CAREER — the bridge to the castle's game. A career fixture is played as the castle's own match (p76/p77c):
   your house — or club, or country — against theirs, your team-mates by name, your attributes and broom in the flying,
   the stadium dressed in the two sides' colours; when the whistle goes the result comes back to the career (rating,
   tables, papers, press). Drills (the first flying lesson, the trials, training) are the castle's lesson and short
   matches. Also: the shims the ported screens expect, the crests, and the career's door on the title screen. */
const Tex = { font: "'HLA', Georgia, serif", crestURL: new Proxy({}, { get: (o, k) => (typeof k === 'string' && /^\d+$/.test(k)) ? (o[k] || (o[k] = QC.crest(+k))) : undefined }) };
const QUI = { cur: null, hideAll() { HL.ui.screen(''); }, go(w) { if (w === 'menu') CareerUI.exit(); }, quit() { CareerUI.exit(); } };
const QHUD = { show() {}, ticker(t) { if (HL.ui.hint) { QC.hintOK = true; try { HL.ui.hint(t, 6); } finally { QC.hintOK = false; } } } };
/* in the career the castle's own errands keep their hints to themselves */
{ const h0 = HL.ui.hint; HL.ui.hint = function (html, dur) { if (QC.active && !QC.hintOK && !(HL.Q && (HL.Q.on || HL.Q.loading))) return; return h0.apply(this, arguments); }; }   // (a match's own hints pass)
/* …and the castle's story keeps quiet altogether: no Hogwarts letter, side quests or toasts of its own while the career
   is on (the match's own are let through) */
{ const mute = () => QC.active && !(HL.Q && (HL.Q.on || HL.Q.loading)), tq = HL.ui.toast, pp = HL.ui.pop;
  HL.ui.toast = function () { if (mute()) return; return tq.apply(this, arguments); };
  HL.ui.pop = function () { if (mute()) return; return pp.apply(this, arguments); };
  HL.START.push(function (L) { const U = L && L.updates; if (!U) return; for (let i = 0; i < U.length; i++) { const f = U[i]; if (f._qc || !/NEW SIDE QUEST|J\.letter\(\)/.test(String(f))) continue; U[i] = Object.assign(function (dt, t) { if (QC.active) { IN.take('journal'); return; } return f.call(this, dt, t); }, { _qc: 1 }); } }); }
const Platform = { requestWake() {} };
const Input = { reset() { IN.buf = {}; } };
/* a team's crest: its shield in its colours, its emblem on it */
QC.crest = function (i) {
  const T = CONFIG.teams[i] || CONFIG.teams[0], c = document.createElement('canvas'); c.width = 92; c.height = 112; const g = c.getContext('2d');
  g.beginPath(); g.moveTo(6, 6); g.lineTo(86, 6); g.lineTo(86, 58); g.quadraticCurveTo(86, 92, 46, 108); g.quadraticCurveTo(6, 92, 6, 58); g.closePath();
  const gr = g.createLinearGradient(0, 0, 92, 112); gr.addColorStop(0, T.c1); gr.addColorStop(1, '#' + new THREE.Color(T.c1).multiplyScalar(0.6).getHexString()); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = T.c2; g.stroke();
  g.save(); g.clip(); if (T.pattern === 1) { g.fillStyle = T.c2; g.globalAlpha = 0.35; for (let x = 14; x < 92; x += 22) g.fillRect(x, 0, 9, 112); } else if (T.pattern === 2) { g.fillStyle = T.c2; g.globalAlpha = 0.35; for (let y = 14; y < 112; y += 22) g.fillRect(0, y, 92, 9); } else if (T.pattern === 3) { g.fillStyle = T.c2; g.globalAlpha = 0.3; g.fillRect(46, 0, 46, 112); } g.restore();
  drawEmblem(g, T.emblem, 46, 52, 64, T.c2, T.c1); return c.toDataURL();
};
/* ------------------------------------------------------------------ in and out of the career */
QC.enter = function () { QC.active = true; MG.onKey = null; document.body.classList.add('qcareer'); HL.ui.show(false); if (HL.Q) HL.Q.pitchCam = false; };
QC.leave = function () { QC.active = false; QC.match = null; document.body.classList.remove('qcareer'); QC.eject(); QC.undress(); MG.state = 'title'; HL.ui.title(); };
/* the title: the career's own door, beside the castle's and the Quidditch match's */
{ const t0 = HL.ui.title; HL.ui.title = function () { t0.apply(this, arguments); const S = HL.ui.el.Screen, box = S.querySelector('.hlTitle'); if (!box || box.querySelector('[data-qc]')) return; const b = document.createElement('div'); b.className = 'hlBtn'; b.dataset.qc = '1'; b.textContent = 'QUIDDITCH CAREER'; b.onclick = () => CareerUI.open(); const cr = S.querySelector('.cr'); box.insertBefore(b, cr); }; }
/* ------------------------------------------------------------------ a fixture, played */
QC.DIFF = { rookie: 0, pro: 1, legend: 2 };
QC.kickoff = async function (ev) {
  const S = Career.S, o = Career.matchOpts(ev), mine = Career.myTeam(), opp = ev.opp, home = ev.home !== false, mk = QC.key(mine), ok = QC.key(opp);
  if (window.Locker && Locker.on) Locker.exit(); Scenes.leave(true); CareerUI.root.hidden = true;
  QC.inject([mk, ok]); if (S.phase === 'school') QC.undress(); else QC.dress(home ? mk : ok, home ? ok : mk);
  S.seasonStart = S.seasonStart || Object.assign({}, S.tot);
  QC.match = { ev, o, mine, opp, mk, ok, passTo: {}, assistTo: {}, last: null, assists: 0, pm: Career.playerMods() };
  QC.gearOn(QC.match.pm);
  MG.state = 'play'; HL.ui.show(true); IN.buf = {}; MG.onKey = null;
  await HL.Q.start({ house: mk, rival: ok, diff: QC.DIFF[o.diff] !== undefined ? QC.DIFF[o.diff] : 1, len: [180, 300, 480][S.rules.length] || 300, role: S.profile.pos === 'seeker' ? 'seeker' : 'chaser', arcade: true, sn: S.rules.snitch === 'classic' ? 150 : 30, career: true });
  QC.nameFlyers();
  { const nm = (i) => { const n = teamName(i); return (n.length > 12 ? n.split(' ').pop() : n).toUpperCase(); }, E = HL.ui.el; if (E.Qa) { E.Qa.textContent = nm(mine); E.Qb.textContent = nm(opp); } }   // (the board fits WANDERERS, not WIGTOWN WANDERERS)
};
QC.drill = async function (d) {
  const S = Career.S, mine = S.profile.house, mk = QC.key(mine), ok = QC.key((mine + 1) % 4);
  Scenes.leave(true); CareerUI.root.hidden = true; QC.inject([mk, ok]); QC.undress();
  QC.match = { drill: d, mine, opp: (mine + 1) % 4, mk, ok, passTo: {}, assistTo: {}, last: null, assists: 0, pm: Career.playerMods() }; QC.gearOn(QC.match.pm);
  MG.state = 'play'; HL.ui.show(true); IN.buf = {}; MG.onKey = null;
  await HL.Q.start(d.lesson ? { house: mk, rival: ok, diff: 0, len: 300, role: 'chaser', arcade: true, tut: true, career: true } : { house: mk, rival: ok, diff: 1, len: d.time || 90, role: d.seeker ? 'seeker' : 'chaser', arcade: true, sn: 30, career: true });
  QC.nameFlyers();
};
/* your look on the pitch (the match dresses its hero as student 0 of the side; in the career that is you) */
{ const s0 = HL.student; HL.student = function (house, witch, v, quid) {
  const M = QC.match; if (M && quid && v === 0 && house === M.mk && Career.S) { const P = Career.S.profile; return s0.call(this, house, P.body === 'f', (P.look && P.look.v) || 1, true); }
  return s0.apply(this, arguments); }; }
/* attributes and broom → the flying: stamina eases the boost's drain, defence the steals, shooting the aim (speed and handling are the broom's) */
QC.gearOn = function (pm) { QC._g = Object.assign({}, HL.G); HL.G.boost = (HL.G.boost || 0) + Math.max(0, (pm.regen - 1)) * 0.8 + Math.max(0, 1 - pm.drain) * 0.8; };
QC.gearOff = function () { if (QC._g) { Object.assign(HL.G, QC._g); QC._g = null; } };
{ const Q = HL.Q;
  const st0 = Q.start; Q.start = async function (opt) { const r = await st0.call(Q, opt); if (Q.on && Q.opt && Q.opt.career && QC.match) { const pm = QC.match.pm; Q.D = Object.assign({}, Q.D, { st: clamp(Q.D.st - pm.stealOk * 2.2, 0.15, 0.95), mt: Q.D.mt * (2 - Math.min(1.4, pm.steal)) }); } return r; };
  const sh0 = Q.shoot; Q.shoot = function (pw) { if (Q.opt && Q.opt.career && QC.match) pw = clamp(pw * QC.match.pm.perfect, 0.3, 1); return sh0.call(Q, pw); };
  // who passed to whom (for the team-mates' goals and chemistry), and assists
  const tb0 = Q.throwBall; Q.throwBall = function (f, target, speed, shot) { const M = QC.match, B = Q.ball, had = B && B.holder === f; tb0.call(Q, f, target, speed, shot);
    if (M && had && f.isPlayer && !shot && B.passTo) { const id = B.passTo.mateId; if (id) M.passTo[id] = (M.passTo[id] || 0) + 1; M.last = { to: B.passTo, t: Q.t }; } };
  const g0 = Q.goal; Q.goal = function (team, hoop) { const M = QC.match, by = Q.ball && Q.ball.shot && Q.ball.shot.by;
    if (M && team === 0 && by && !by.isPlayer && M.last && M.last.to === by && Q.t - M.last.t < 9) { M.assists++; if (by.mateId) M.assistTo[by.mateId] = (M.assistTo[by.mateId] || 0) + 1; }
    if (M && team === 0 && by && by.isPlayer) Photo.trigger(0.25, 'goal');
    return g0.call(Q, team, hoop); };
  // the whistle: the result goes to the career, not to the castle's results card
  const res0 = Q.results; Q.results = function () { if (Q.opt && Q.opt.career && QC.match) return QC.finish(); return res0.apply(this, arguments); };
  const tr0 = Q.tutResults; Q.tutResults = function (story) { if (Q.opt && Q.opt.career && QC.match) return QC.finish(true); return tr0.apply(this, arguments); };
}
/* the side's flyers carry your team-mates' names (and theirs the rivals' squad) */
QC.nameFlyers = function () {
  const Q = HL.Q, M = QC.match; if (!Q.on || !M) return; const o = M.o || {}, mates = o.mates || {}, opps = o.opps || {}, n = [{}, {}];
  if (!M.o) { for (const m of Career.squad()) mates[roleKey(m.role, m.slot)] = { name: m.name, id: m.id }; }
  for (const f of Q.flyers) { if (f.isPlayer) continue; const k = f.role, i = n[f.team][k] || 0; n[f.team][k] = i + 1; const who = (f.team === 0 ? mates : opps)[roleKey(k, i)]; if (who) { f.name = who.name; f.mateId = who.id || null; } }
};
QC.finish = function (tut) {
  const Q = HL.Q, M = QC.match, S = Career.S; QC.gearOff(); if (!M) return; QC.match = null; MG.state = 'play';
  if (M.drill) { const r = Q.result, st = (r && r.stats) || {}, score = tut ? 1 : M.drill.seeker ? (st.snitch ? 1 : 0) : (st.goals || 0); M.drill.onEnd(score); return; }
  const r = Q.result, st = r.stats, mineSn = !!st.snitch, res = {
    win: r.a === r.b ? -1 : r.a > r.b ? 0 : 1, score: [r.a, r.b], houses: [M.mine, M.opp], role: S.profile.pos,
    stats: { goals: st.goals || 0, assists: M.assists, passes: st.passes || 0, steals: st.steals || 0, shots: st.shots || 0, finishers: st.power || 0, snitch: mineSn ? 1 : 0, dodges: st.dodges || 0, hits: st.hits || 0, passTo: M.passTo, assistTo: M.assistTo, best: st.power ? { name: 'Roaring Shot' } : null },
    snitchSide: mineSn ? 0 : /Seeker caught/.test(r.reason || '') && r.reason.indexOf(teamName(M.opp)) >= 0 ? 1 : 0, style: 0, sim: false,
  };
  Career.onMatchEnd(res);
};
