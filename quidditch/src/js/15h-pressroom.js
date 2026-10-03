// ===================== PRESS ROOM: pre-match scrum and post-match press conference =====================
const PressRoom = {
  ui: null, recs: [], done: null, timerT: 0, timerOn: false, cur: null,
  init() {
    const d = document.createElement('div'); d.id = 'press';
    d.innerHTML = `<div class="prTop"><b id="prTitle">PRESS CONFERENCE</b><span id="prSub"></span></div>
      <div class="prReps" id="prReps"></div>
      <div class="prQ" id="prQ"><div class="prBy" id="prBy"></div><div class="prText" id="prText"></div><div class="prTimer"><i id="prTimer"></i></div></div>
      <div class="prAns" id="prAns"></div><div class="prToast" id="prToast"></div><button class="act prSkip" id="prSkip">SKIP PRESS</button>`;
    document.body.appendChild(d); this.ui = d;
    d.querySelector('#prSkip').addEventListener('click', () => this.finish(true));
  },
  run(kind, ev, done) {
    const S = Career.S;
    this.kind = kind; this.ev = ev; this.done = done; this.recs = []; this.asked = 0; this.total = kind === 'pre' ? 1 : 2;
    const set = Scenes.enter('press', S.phase === 'school' ? 'school' : '');
    this.set = set;
    Scenes.spawn('me', { at: set.anchors.seat, anim: 'sitTalk', o: { outfit: S.phase === 'school' ? 'kit' : 'track' } });
    this.reps = Press.reporters();
    this.reps.forEach((r, i) => { const a = set.anchors['rep' + i]; Scenes.spawn('rep_' + r.id, { at: a, anim: 'sit', look: r.look, o: { outfit: r.diff === 'hard' ? 'formal' : r.diff === 'mid' ? 'coat' : 'casual', c1: r.c1 } }); });
    // a few more journalists to fill the rows
    for (let k = 0; k < 5; k++) { const x = -3.5 + [0, 2, 3, 5, 1][k] * 1.4, z = 1.4 + [1, 1, 2, 0, 2][k] * 1.5; Scenes.spawn('extra' + k, { at: seatAt(x, z, Math.PI, 0.26), anim: k % 2 ? 'sitTalk' : 'sit', o: { outfit: k % 2 ? 'coat' : 'casual' } }); }
    const qa = set.anchors.quill, rep2 = set.anchors.rep2; set.quill.position.set(qa[0], qa[1], qa[2]); set.quill.visible = false;
    Scenes.shot(set.cams.reporters, true);
    this.ui.classList.add('on');
    this.ui.querySelector('#prTitle').textContent = kind === 'pre' ? 'PRE-MATCH PRESS' : 'POST-MATCH PRESS CONFERENCE';
    this.ui.querySelector('#prSub').textContent = kind === 'pre' ? `${ev.label} · ${teamName(Career.myTeam())} v ${teamName(ev.opp)}` : `${S.last ? teamName(Career.myTeam()) + ' ' + S.last.score[0] + '-' + S.last.score[1] + ' ' + teamName(S.last.opp) : ''}`;
    this.pickReporter();
  },
  pickReporter() {
    const S = Career.S, root = this.ui.querySelector('#prReps');
    this.ui.querySelector('#prQ').classList.remove('on'); this.ui.querySelector('#prAns').innerHTML = '';
    Scenes.shot(this.set.cams.reporters);
    root.innerHTML = `<div class="prHint">${this.asked ? 'Another question. Who do you take?' : 'Hands go up. Who do you take?'}</div>` + this.reps.map((r, i) => `<button class="prRep ${r.diff}" data-i="${i}"><b>${r.name}</b><span>${r.outlet}</span><em>${r.diff === 'easy' ? 'SOFTBALL' : r.diff === 'mid' ? 'FAIR' : 'NEEDLER'} · ×${r.mult}</em><small>${r.blurb}</small></button>`).join('');
    root.classList.add('on');
    root.querySelectorAll('.prRep').forEach(b => b.addEventListener('click', () => { Sound.play('ui'); root.classList.remove('on'); this.ask(this.reps[+b.dataset.i], +b.dataset.i); }));
  },
  ask(rep, i) {
    const c = Press.ctx(this.kind, this.ev), qs = Press.pickQuestions(this.kind, rep, c), q = qs[0];
    if (!q) { this.finish(); return; }
    this.cur = { rep, q, c };
    const rc = Scenes.cast['rep_' + rep.id]; if (rc) rc.h.play('sitTalk');
    Scenes.shot(this.set.cams.rep(i));
    this.set.flash();
    const Qel = this.ui.querySelector('#prQ'); Qel.classList.add('on');
    this.ui.querySelector('#prBy').innerHTML = `<b>${rep.name}</b> · ${rep.outlet}`;
    const text = q.q(c), t = this.ui.querySelector('#prText'); t.textContent = '';
    let k = 0; clearInterval(this.typ); this.typ = setInterval(() => { k += 2; t.textContent = text.slice(0, k); if (k >= text.length) { clearInterval(this.typ); this.showAnswers(); } }, 20);

  },
  showAnswers() {
    const { rep, q, c } = this.cur, A = q.a(c), root = this.ui.querySelector('#prAns');
    const me = Scenes.cast.me; if (me) me.h.play('sitTalk');
    Scenes.shot(this.set.cams.player);
    const fxStr = tone => { const f = TONE_FX[tone], m = rep.mult, arrow = v => v > 0.4 ? '▲' : v < -0.4 ? '▼' : '·'; return `<span class="fx"><i class="${f.fame > 0 ? 'up' : f.fame < 0 ? 'dn' : ''}">FAME ${arrow(f.fame * m)}</i><i class="${f.fans > 0 ? 'up' : f.fans < 0 ? 'dn' : ''}">FANS ${arrow(f.fans * m)}</i><i class="${f.chem > 0 ? 'up' : f.chem < 0 ? 'dn' : ''}">TEAM ${arrow(f.chem * m)}</i><i class="${f.trust > 0 ? 'up' : f.trust < 0 ? 'dn' : ''}">COACH ${arrow(f.trust * m)}</i></span>`; };
    root.innerHTML = Object.keys(A).map(tone => `<button class="prA" data-t="${tone}"><i class="tone ${tone}">${TONE_ICON[tone]}</i><div><b>${TONE_LABEL[tone]}</b><span>"${A[tone]}"</span>${fxStr(tone)}</div></button>`).join('');
    root.querySelectorAll('.prA').forEach(b => b.addEventListener('click', () => this.answer(b.dataset.t)));
    this.timerT = 12; this.timerOn = true;
  },
  answer(tone) {
    if (!this.cur) return;
    this.timerOn = false;
    const { rep, q, c } = this.cur; this.cur = null;
    const rec = tone === 'timeout' ? Press.answer(rep, Object.assign({}, q, { a: () => ({ de: 'No comment.' }) }), 'de', c) : Press.answer(rep, q, tone, c);
    this.recs.push(rec); this.asked++;
    this.ui.querySelector('#prAns').innerHTML = '';
    Sound.play('ui'); this.set.flash(); this.set.flash();
    const d = rec.d, fmt = (n, k) => Math.abs(n) < 0.05 ? '' : `<i class="${n > 0 ? 'up' : 'dn'}">${k} ${n > 0 ? '+' : ''}${n.toFixed(1)}</i>`;
    const toast = this.ui.querySelector('#prToast');
    toast.innerHTML = `${fmt(d.fame || 0, 'FAME')}${fmt(d.fans || 0, 'FANS')}${fmt(d.chem || 0, 'TEAM')}${fmt(d.trust || 0, 'COACH')}${rep.quill ? `<i class="quill">THE QUICK-QUOTES QUILL SCRIBBLES FURIOUSLY…</i>` : ''}`;
    toast.classList.remove('on'); void toast.offsetWidth; toast.classList.add('on');
    if (rep.quill) { this.set.quill.visible = true; Scenes.shot(this.set.cams.quill); }
    setTimeout(() => { this.set.quill.visible = false; if (this.asked < this.total) this.pickReporter(); else this.finish(); }, rep.quill ? 2600 : 1600);
  },
  update(rdt) {
    if (!this.timerOn) return;
    this.timerT -= rdt;
    this.ui.querySelector('#prTimer').style.width = clamp(this.timerT / 12, 0, 1) * 100 + '%';
    if (this.timerT <= 0) this.answer('timeout');
  },
  finish(skipped) {
    clearInterval(this.typ); this.timerOn = false; this.cur = null;
    this.ui.classList.remove('on');
    if (this.kind === 'post') News.addQuotes(this.recs);
    if (skipped && this.kind === 'post') { Career.S.fame = clamp(Career.S.fame - 1, 0, 100); News.pending = null; }
    Career.save();
    const d = this.done; this.done = null; if (d) d(this.recs);
  },
};
