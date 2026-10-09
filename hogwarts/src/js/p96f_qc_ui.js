/* ==== p96f_qc_ui.js ==== */
/* QUIDDITCH CAREER — the screens (ported from Quidditch Skybound): the creator, the hub (meters, the next event, the
   tabs), the flow through the calendar, results, training, profile, team, the papers, the owl post, the broom shop,
   the cup, offers, awards and the legacy card. Over the live castle; the matches are the castle's own (p96h). */
const CareerUI = {
  root: null, tab: 'hub', preview: null, photoT: null,
  init() {
    if (this.root) return;
    const st = document.createElement('style'); st.textContent = QC.CSS; document.head.appendChild(st);
    const d = document.createElement('section'); d.className = 'screen career'; d.id = 'scrCareer'; d.hidden = true;
    document.body.appendChild(d); this.root = d;
  },
  show(html) { QUI.hideAll(); this.root.innerHTML = html; this.root.hidden = false; QUI.cur = 'scrCareer'; QHUD.show(false); this.wire(); return this.root; },
  wire() { this.root.querySelectorAll('[data-cgo]').forEach(b => b.addEventListener('click', () => { Sound.play('ui'); this.go(b.dataset.cgo); })); },
  go(where) {
    clearInterval(this.photoT);
    if (where === 'hub') this.hub(); else if (where === 'profile') this.profile(); else if (where === 'team') this.team(); else if (where === 'press') this.press(); else if (where === 'owl') this.owl(); else if (where === 'train') this.training(); else if (where === 'shop') this.shop(); else if (where === 'quit') { Career.save(); Scenes.leave(); QUI.quit(); } else if (where === 'next') this.next(); else if (where === 'sim') this.next(true);
  },
  // ---------- entry ----------
  open() {
    this.init(); QC.enter();
    if (Career.has()) {
      const s = lsGet(Career.KEY, null);
      this.hubBackdrop(s && s.phase !== 'school' ? 'pro' : 'school');
      this.show(`<div class="panel" style="width:min(520px,100%)"><h2>Quidditch Career</h2>
        <div class="menuGrid" style="grid-template-columns:1fr"><button class="mbtn primary" id="cCont"><b>CONTINUE</b><small>${s.profile.name} · ${s.phase === 'school' ? 'Hogwarts, Year ' + s.year : s.phase === 'retired' ? 'Retired' : 'Season ' + s.season + ' · ' + teamName(s.club)}</small></button>
        <button class="mbtn" id="cNew"><b>NEW CAREER</b><small>Overwrites your current career save.</small></button></div>
        <div class="actions"><button class="act" id="cBack">BACK</button></div></div>`);
      this.root.querySelector('#cCont').addEventListener('click', () => { Career.load(); this.hub(); });
      this.root.querySelector('#cNew').addEventListener('click', (e) => { const b = e.currentTarget; if (!b.dataset.sure) { b.dataset.sure = 1; b.querySelector('small').textContent = 'Tap again to start over — your current career will be lost.'; b.classList.add('primary'); return; } this.creator(); });
      this.root.querySelector('#cBack').addEventListener('click', () => this.exit());
    } else this.creator();
  },
  // ---------- character creator (live 3D preview in the studio) ----------
  creator() {
    const P = this.cp = this.cp || { name: '', pron: 'they', body: 'f', v: 1, house: -1, pos: 'chaser', nation: NATION_IDS[0], diff: 'normal', snitch: 'arcade', length: 1 };
    this.hubBackdrop('creator');
    const seg = (key, opts) => `<div class="seg" data-k="${key}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" class="${String(P[key]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    /* three short pages (who you are · where you play · how it plays), each whole on a phone; the looks as faces */
    const looks = [1, 2, 3, 4, 5, 6].map((v) => [v, QC.face(v, P.body === 'f')]), tab = this.crTab = this.crTab || 'you';
    this.show(`<div class="creator"><div class="crPanel"><h2>A Quidditch Career</h2>
      <div class="crTabs" role="tablist">${[['you', 'You'], ['play', 'Your game'], ['rules', 'Rules']].map(([k, t]) => `<button type="button" role="tab" data-ct="${k}" class="${k === tab ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div class="crPage" data-cp="you" ${tab === 'you' ? '' : 'hidden'}>
      <div class="row"><label for="crName">Name</label><input id="crName" maxlength="24" placeholder="First Last" value="${P.name}" autocomplete="off"></div>
      <div class="row"><label>Pronouns</label>${seg('pron', [['she', 'she/her'], ['he', 'he/him'], ['they', 'they/them']])}</div>
      <div class="row"><label>You are</label>${seg('body', [['f', 'A witch'], ['m', 'A wizard']])}</div>
      <div class="row"><label>Look</label><div class="seg looks" data-k="v">${looks.map(([v, svg]) => `<button type="button" data-v="${v}" aria-label="Look ${v}" class="${String(P.v) === String(v) ? 'on' : ''}">${svg}</button>`).join('')}</div></div></div>
      <div class="crPage" data-cp="play" ${tab === 'play' ? '' : 'hidden'}>
      <div class="row"><label>Position</label>${seg('pos', [['chaser', 'Chaser'], ['seeker', 'Seeker']])}</div>
      <div class="row"><label>House</label>${seg('house', [[-1, 'Sorting Hat'], [0, 'Gryffindor'], [1, 'Slytherin'], [2, 'Ravenclaw'], [3, 'Hufflepuff']])}</div>
      <div class="row"><label for="crNation">Nation</label><select id="crNation">${NATION_IDS.map(n => `<option value="${n}" ${P.nation === n ? 'selected' : ''}>${teamName(n)}</option>`).join('')}</select></div>
      <p class="note crWhy">${P.pos === 'seeker' ? 'Seekers hunt the Golden Snitch: catching it ends the match.' : 'Chasers carry the Quaffle and score through the hoops, ten points a goal.'}</p></div>
      <div class="crPage" data-cp="rules" ${tab === 'rules' ? '' : 'hidden'}>
      <div class="row"><label>Difficulty</label>${seg('diff', [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']])}</div>
      <div class="row"><label>Snitch</label>${seg('snitch', [['arcade', 'Arcade · 30'], ['classic', 'Classic · 150']])}</div>
      <div class="row"><label>Match length</label>${seg('length', [[0, '3 min'], [1, '5 min'], [2, '8 min']])}</div></div>
      <div class="actions"><button class="act" id="crBack">BACK</button>${tab === 'rules' ? '' : '<button class="act" id="crNext">NEXT</button>'}<button class="act go" id="crGo">BEGIN AT HOGWARTS</button></div></div></div>`);
    const R = this.root;
    const goTab = (k) => { this.crTab = k; R.querySelectorAll('.crTabs button').forEach((b) => b.classList.toggle('on', b.dataset.ct === k)); R.querySelectorAll('.crPage').forEach((pg) => { pg.hidden = pg.dataset.cp !== k; }); const nx = R.querySelector('#crNext'); if (nx) nx.hidden = k === 'rules'; Sound.play('ui'); };
    R.querySelectorAll('.crTabs button').forEach((b) => b.addEventListener('click', () => goTab(b.dataset.ct)));
    { const nx = R.querySelector('#crNext'); if (nx) nx.addEventListener('click', () => goTab(this.crTab === 'you' ? 'play' : 'rules')); }
    /* turn yourself round: drag anywhere off the panel */
    { let dx0 = null; const spin = R.querySelector('.creator'); spin.addEventListener('pointerdown', (e) => { if (e.target.closest('.crPanel')) return; dx0 = e.clientX; });
      spin.addEventListener('pointermove', (e) => { if (dx0 === null) return; const c = Scenes.cast.me; if (c) c.a.yaw += (e.clientX - dx0) * 0.012; dx0 = e.clientX; });
      const end = () => { dx0 = null; }; spin.addEventListener('pointerup', end); spin.addEventListener('pointercancel', end); }
    R.querySelectorAll('.seg[data-k]').forEach(sg => sg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const k = sg.dataset.k, raw = b.dataset.v; P[k] = raw === 'true' ? true : raw === 'false' ? false : /^-?\d+$/.test(raw) ? +raw : raw;
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); Sound.play('ui');
      if (['body', 'v', 'house', 'pos'].includes(k)) this.respawnPreview();
      if (k === 'body') R.querySelectorAll('.looks button').forEach((lb) => { lb.innerHTML = QC.face(+lb.dataset.v, P.body === 'f'); });
      if (k === 'pos') { const w = R.querySelector('.crWhy'); if (w) w.textContent = P.pos === 'seeker' ? 'Seekers hunt the Golden Snitch: catching it ends the match.' : 'Chasers carry the Quaffle and score through the hoops, ten points a goal.'; }
    })));
    R.querySelector('#crName').addEventListener('input', e => { P.name = e.target.value; });
    R.querySelector('#crNation').addEventListener('change', e => { P.nation = +e.target.value; });
    R.querySelector('#crBack').addEventListener('click', () => { if (Career.has()) this.open(); else this.exit(); });
    R.querySelector('#crGo').addEventListener('click', () => {
      const name = (P.name || '').trim().replace(/\s+/g, ' ');
      if (name.length < 2) { goTab('you'); R.querySelector('#crName').focus(); R.querySelector('#crName').classList.add('err'); return; }
      const full = name.includes(' ') ? name : name + ' ' + pick(NAME_L);
      const house = P.house >= 0 ? P.house : this.sortingHat();
      Career.create({ name: full.replace(/\b\w/g, c => c.toUpperCase()), pron: P.pron, body: P.body, look: { v: P.v }, house, pos: P.pos, nation: P.nation }, { diff: P.diff, snitch: P.snitch, length: P.length });
      this.next();
    });
    this.respawnPreview();
  },
  sortingHat() { const P = this.cp; return P.pos === 'seeker' ? pick([0, 2, 0, 3, 1]) : pick([0, 1, 2, 3]); },
  async respawnPreview() {
    const P = this.cp; if (!Scenes.active || !Scenes.set || this.backdrop !== 'creator') return;
    const tpl = HL.student(QC.key(P.house >= 0 ? P.house : 0), P.body === 'f', P.v, true), n = ++this._pv;
    await CAST.need([tpl]); if (n !== this._pv || this.backdrop !== 'creator') return;
    if (Scenes.cast.me) { Scenes.cast.me.a.dispose(); delete Scenes.cast.me; }
    const a = Scenes.actor(tpl, Scenes.set.anchors.me || [0, 0, 0, PI + 0.35]); a.base = 'fold'; Scenes.cast.me = { a, spec: { anim: 'idle' }, sit: false };
  },
  /* the live picture behind the screens: a slow turn through the common room at school, the players' gate as a professional, the gate in close-up behind the creator */
  hubBackdrop(kind) {
    if (this.backdrop === kind && Scenes.active) return; this.backdrop = kind; this._pv = (this._pv || 0) + 1;
    if (kind === 'creator') { Scenes.enter('locker', 'school', { mode: 'view' }); Scenes.shot({ p: [-0.2, 1.46, -2.3], l: [0.72, 1.2, 0], fov: 30, dur: 999 }, true); return; }   // (waist up: the face reads)
    const set = kind === 'school' ? Scenes.enter('common', '', { mode: 'view' }) : Scenes.enter('locker', 'pro', { mode: 'view' });
    if (kind !== 'school' || !Career.S) {
      if (!Career.S) { Scenes.shot(set.cams.hub || { orbit: { c: [0, 1.4, -1], r: 7, h: 1.6, a0: 0.3, w: 0.035 }, p: [0, 2, 6], l: [0, 1.2, 0], fov: 48, dur: 999 }, true); return; }
      /* a professional's hub: you in your club's kit at the players' gate, the stands rising behind (right of the screen; the panels have the left) */
      Scenes.shot({ p: [-1.7, 1.35, -3.9], l: [0.9, 2.1, 2.2], p2: [-1.45, 1.4, -3.5], fov: 46, dur: 40 }, true);
      const pv = this._pv, cast = [{ id: 'me', at: [0.15, 0, 0, PI + 0.5], anim: 'idle', o: { outfit: 'kit' } }];
      Scenes.need(cast).then(() => { if (this._pv !== pv || Scenes.set !== set) return; const a = Scenes.spawn('me', cast[0]); if (a) a.base = 'fold'; }).catch(() => {});
      if (Career.S.phase !== 'school') { const T = Career.myTeam(), k = QC.key(T); QC.inject([k]); QC.dress(k, QC.key(T === CLUB_IDS[0] ? CLUB_IDS[1] : CLUB_IDS[0])); }
      return; }
    /* at school the hub is you and your friend by your own common-room fire, framed in the right of the screen (the panels have the left) */
    const L = set.anchors.chairL, Rr = set.anchors.chairR, mx = (L[0] + Rr[0]) / 2, mz = (L[2] + Rr[2]) / 2;
    Scenes.shot({ p: [mx + 2.2, 1.55, mz + 3.6], l: [mx - 1.4, 1.1, mz + 0.2], p2: [mx + 1.7, 1.48, mz + 3.1], fov: 44, dur: 40 }, true);
    const pv = this._pv, S = Career.S, cast = [{ id: 'me', at: 'chairL', anim: 'sit', o: {} }].concat(S.friend && S.mates[S.friend] ? [{ id: 'friend', at: 'chairR', anim: 'sit', o: {} }] : []);
    Scenes.need(cast).then(() => { if (this._pv !== pv || !Scenes.active || Scenes.set !== set) return; for (const c of cast) Scenes.spawn(c.id, c); }).catch(() => {});
  },
  exit() { Career.save(); this.backdrop = null; Scenes.leave(); this.root.hidden = true; QC.leave(); },
  // ---------- hub ----------
  hubScene() { const S = Career.S; this.hubBackdrop(S && S.phase !== 'school' ? 'pro' : 'school'); },
  hub() {
    const S = Career.S; if (!S) return this.open();
    this.hubScene();
    const ev = Career.cur(), team = Career.myTeam(), T = CONFIG.teams[team] || CONFIG.teams[0];
    const meter = (k, v, c) => `<div class="meter"><span>${k}</span><div class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${c}"></i></div><b>${Math.round(v)}</b></div>`;
    const evCard = ev ? this.eventCard(ev) : '';
    const unread = Career.unread(), fresh = S.news.filter(a => a.fresh).length;
    this.show(`<div class="hub">
      <div class="hubTop"><img src="${Tex.crestURL[team]}" alt=""><div class="hubWho"><b>${S.profile.name}</b><span>${S.phase === 'school' ? `${T.name} · Year ${S.year}` : S.phase === 'retired' ? 'Retired' : `${T.name} · ${S.profile.pos === 'seeker' ? 'Seeker' : 'Chaser'}`}${S.captain && S.phase === 'school' ? ' · Captain' : ''}</span></div>
        <div class="hubOvr"><b>${Career.ovr()}</b><span>OVR</span></div><div class="hubGal"><b>${S.gal}</b><span>GALLEONS</span></div></div>
      <div class="hubMeters">${meter('FAME', S.fame, '#e8b84a')}${meter('FANS', S.fans, '#e0533a')}${meter('TEAM', Career.chemAvg(), '#5ab0ff')}${meter('COACH', S.trust, '#7ad87a')}</div>
      <div class="hubMain">${evCard}</div>
      <div class="hubTabs">
        <button class="htab" data-cgo="profile"><i>${QC.svg('profile')}</i>PROFILE${S.sp ? `<em>${S.sp}</em>` : ''}</button>
        <button class="htab" data-cgo="team"><i>${QC.svg('team')}</i>TEAM</button>
        <button class="htab" data-cgo="press"><i>${QC.svg('prophet')}</i>PROPHET${fresh ? `<em>${fresh}</em>` : ''}</button>
        <button class="htab" data-cgo="owl"><i>${QC.svg('owl')}</i>OWL POST${unread ? `<em>${unread}</em>` : ''}</button>
        <button class="htab" data-cgo="train" ${Career.canTrain() ? '' : 'disabled'}><i>${QC.svg('train')}</i>TRAIN</button>
        <button class="htab" data-cgo="shop"><i>${QC.svg('brooms')}</i>BROOMS</button>
        <button class="htab" data-cgo="quit"><i>${QC.svg('quit')}</i>SAVE & QUIT</button>
      </div></div>`);
  },
  eventCard(ev) {
    const S = Career.S, my = Career.myTeam();
    const icon = QC.svg({ scene: 'scene', match: 'match', drill: 'drill', cup: 'cup', offers: 'quill', awards: 'cup', bye: 'tea', wcKO: 'globe', legacy: 'star' }[ev.t] || 'next');
    let detail = '';
    if (ev.t === 'match') { const st = Career.str(ev.opp); detail = `<div class="vs"><img src="${Tex.crestURL[my]}"><b>v</b><img src="${Tex.crestURL[ev.opp]}"></div><div class="evSub">${teamName(my)} v ${teamName(ev.opp)}${ev.home === false ? ' · away' : ''} · rating ${Math.round(st)}</div>`; }
    const tab = S.phase === 'school' && S.cup ? Career.sorted(S.cup.t) : S.phase === 'pro' && S.league ? Career.sorted(S.league.t) : null;
    const mini = tab ? `<div class="miniTable">${tab.slice(0, S.phase === 'school' ? 4 : 5).map((r, i) => `<div class="${r.id === my ? 'me' : ''}"><i>${i + 1}</i><span>${CONFIG.teams[r.id].short}</span><b>${r.pts}</b></div>`).join('')}</div>` : '';
    return `<div class="evCard"><div class="evWhen">${Career.when(ev)}</div><div class="evLabel"><i>${icon}</i>${ev.label}</div>${detail}
      <div class="actions"><button class="act go" data-cgo="next">${ev.t === 'match' ? 'TO THE LOCKER ROOM' : 'CONTINUE'}</button>${ev.t === 'match' ? '<button class="act" data-cgo="sim">SIM MATCH</button>' : ''}</div></div>${mini}`;
  },
  // ---------- the flow: run the current calendar event ----------
  next(sim) {
    const S = Career.S, ev = Career.cur(); if (!ev) { Career.advance(); return this.hub(); }
    const done = () => { Career.advance(); this.hub(); };
    switch (ev.t) {
      case 'scene': { const sc = Story.scene(ev.id); if (!sc) return done(); QUI.hideAll(); this.root.hidden = true; Script.play(sc, () => { Career.save(); done(); }); break; }
      case 'drill': return this.drill(ev, done);
      case 'match': return sim ? this.simMatch(ev) : this.matchFlow(ev);
      case 'bye': Career.onBye(ev); return this.notice('Bye week', 'No fixture this week. The rest of the League plays on. Use the time to train.', done);
      case 'cup': return this.cupCeremony(ev, done);
      case 'offers': return this.offers(done);
      case 'awards': { const aw = Career.seasonAwards(); return this.awards(aw, () => { if (Career.S.flags.offers) this.offers(done); else done(); }); }
      case 'wcKO': Career.wcKnockouts(); return done();
      case 'legacy': return this.legacy();
      default: return done();
    }
  },
  notice(title, text, cb) {
    this.show(`<div class="panel" style="width:min(520px,100%)"><h2>${title}</h2><p class="note">${text}</p><div class="actions"><button class="act go" id="nOk">CONTINUE</button></div></div>`);
    this.root.querySelector('#nOk').addEventListener('click', () => { Sound.play('ui'); cb(); });
  },
  // ---------- matches ----------
  matchFlow(ev) {
    const S = Career.S;
    const pre = S.phase !== 'school' ? Math.random() < 0.55 : ev.comp === 'house' && S.year >= 5 && Math.random() < 0.4;
    const toLocker = () => { this.root.hidden = true; Locker.enter(ev, () => this.kickoff(ev), () => this.simMatch(ev)); };
    this.root.hidden = true;
    if (pre) PressRoom.run('pre', ev, toLocker); else toLocker();
  },
  kickoff(ev) { this.backdrop = null; QC.kickoff(ev); },
  simMatch(ev) {
    if (typeof Locker !== 'undefined' && Locker.on) Locker.exit(); this.backdrop = null; Scenes.leave(true);
    const res = Career.simMine(ev);
    Career.onMatchEnd(res);
  },
  results(out) {
    Scenes.leave(true);
    const S = Career.S, r = out.res, my = r.houses[0], op = r.houses[1], st = r.stats;
    const verdict = r.win === 0 ? 'Victory' : r.win === 1 ? 'Defeat' : 'Draw';
    const goals = S.goals;
    const chemLines = Object.entries(out.chem).filter(([, v]) => Math.abs(v) >= 1).slice(0, 4).map(([id, v]) => { const m = Career.mate(id); return m ? `<div><span>${m.name.split(' ')[0]}</span><b class="${v > 0 ? 'up' : 'dn'}">${v > 0 ? '+' : ''}${Math.round(v)}</b></div>` : ''; }).join('');
    if (r.sim) this.hubScene(); else this.resultScene(r.win === 0);
    this.show(`<div class="panel resPanel"><div class="verdict">${verdict}</div>
      <div class="results"><div><img src="${Tex.crestURL[my]}"><div class="big">${r.score[0]}</div><div class="nm">${CONFIG.teams[my].short}</div></div><div style="opacity:.6;font-family:var(--f-head)">VS</div><div><img src="${Tex.crestURL[op]}"><div class="big">${r.score[1]}</div><div class="nm">${CONFIG.teams[op].short}</div></div></div>
      ${S.last.potm ? `<div class="potm">${QC.svg('star')}<span>PLAYER OF THE MATCH</span></div>` : ''}
      <div class="keyRow"><div class="key"><b data-count="${st.goals}">0</b><i>GOALS</i></div><div class="key rate"><b data-count="${out.rating.toFixed(1)}" data-dec="1">0.0</b><i>MATCH RATING</i><u style="--r:${clamp(out.rating / 10, 0, 1).toFixed(3)}"></u></div><div class="key"><b data-count="${st.role === 'seeker' || S.profile.pos === 'seeker' ? (st.snitch ? 1 : 0) : st.assists}">0</b><i>${S.profile.pos === 'seeker' ? 'SNITCH' : 'ASSISTS'}</i></div></div>
      <p class="resLine">${[st.steals ? `${st.steals} steal${st.steals > 1 ? 's' : ''}` : '', st.finishers ? `${st.finishers} Roaring Shot${st.finishers > 1 ? 's' : ''}` : '', S.profile.pos !== 'seeker' && st.snitch ? 'caught the Snitch' : ''].filter(Boolean).join(' · ') || 'A quiet match for you.'}</p>
      <div class="gains"><span>+${Math.round(out.xp)} XP</span><span>+${out.gal} galleons</span><span class="${out.fame < 0 ? 'dn' : 'up'}">${out.fame >= 0 ? '+' : ''}${out.fame} fame</span></div>
      ${out.goalsDone.length || chemLines ? `<div class="resGoals">${out.goalsDone.map(g => `<div class="ok">✔ ${g.text}</div>`).join('')}${chemLines ? `<div class="chem">${chemLines}</div>` : ''}</div>` : ''}
      ${out.levels ? `<div class="lvlUp">LEVEL UP · ${S.lvl} · +${out.levels * 5} skill points</div>` : ''}${out.grew ? `<div class="note" style="text-align:center;margin-top:6px">Development: ${out.grew.map(k => ATTRS.find(a => a[0] === k)[1] + ' +1').join(' · ')}</div>` : ''}
      <div class="actions sticky"><button class="act" id="rSkip">SKIP PRESS</button><button class="act go" id="rPress">PRESS CONFERENCE</button></div></div>`);
    /* the numbers count up, the rating's ring fills */
    { const t0 = performance.now(), els = [...this.root.querySelectorAll('[data-count]')], ring = this.root.querySelector('.key.rate u'); if (ring) ring.style.setProperty('--k', 0);
      const tick = (now) => { const u = Math.min(1, (now - t0 - 250) / 900), e = u <= 0 ? 0 : 1 - Math.pow(1 - u, 3); for (const el of els) { const v = +el.dataset.count; el.textContent = el.dataset.dec ? (v * e).toFixed(1) : String(Math.round(v * e)); } if (ring) ring.style.setProperty('--k', e.toFixed(3)); if (u < 1 && els[0] && els[0].isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); }
    const after = () => this.press(true);
    this.root.querySelector('#rPress').addEventListener('click', () => { Sound.play('ui'); this.root.hidden = true; PressRoom.run('post', null, () => { Career.advance(); after(); }); });
    this.root.querySelector('#rSkip').addEventListener('click', () => { Sound.play('ui'); News.pending = null; Career.advance(); after(); });
  },
  /* the result is read on the pitch: you and two team-mates on the grass, cheering or not, framed in the left of the screen beside the card */
  resultScene(won) {
    this.backdrop = 'result'; this._pv = (this._pv || 0) + 1; const pv = this._pv, set = Scenes.enter('world', '', { mode: 'view' }), S = Career.S, kit = { outfit: 'kit' };
    Scenes.shot({ p: [3.2, 1.45, -8.2], l: [2.0, 1.3, -14], p2: [2.7, 1.5, -8.9], fov: 42, dur: 40 }, true);
    const cast = [{ id: 'me', at: 'pitchMe', anim: won ? 'cheer' : 'idle', o: kit }];
    if (S.phase === 'school') Career.squad().slice(0, 2).forEach((m, k) => cast.push({ id: 'mate_' + m.id, at: k ? 'pitchCapt' : 'pitchF', anim: won ? 'cheer' : 'idle', o: kit }));
    Scenes.need(cast).then(() => { if (this._pv !== pv || Scenes.set !== set) return; for (const c of cast) Scenes.spawn(c.id, c); }).catch(() => {});
  },
  // ---------- drills (flying lesson, trials, training) ----------
  drill(ev, done) {
    const S = Career.S, seeker = S.profile.pos === 'seeker', isTrial = ev.id === 'trials', lesson = ev.id === 'lesson';
    const need = seeker ? 1 : isTrial ? 3 : 2, time = isTrial ? 120 : 90;
    const intro = lesson ? `Madam Hooch blows her whistle. "Mount up, kick off hard, lean into the turns. Fly the rings, then show me you can put the Quaffle through a hoop."` : isTrial ? `${Story.ctx().c1} folds their arms. "${seeker ? 'Catch the Snitch before the whistle' : `Score ${need} in two minutes against the reserves`} and you're on the team."` : `Practice.`;
    this.notice(ev.label, intro, () => {
      this.root.hidden = true; this.backdrop = null; Scenes.leave(true);
      QC.drill({ lesson, time, seeker, need, onEnd: (score) => {
        const pass = lesson ? true : score >= need, xp = 40 + score * 25;
        Career.addXP(xp); if (isTrial) { S.trust = clamp(S.trust + (pass ? 8 : 2), 0, 100); S.fame = clamp(S.fame + (pass ? 2 : 0), 0, 100); }
        Career.save(); this.hubScene();
        this.notice(pass ? 'Made it!' : 'Not quite', lesson ? `"A natural," Madam Hooch says, and writes your name in her little notebook. +${xp} XP` : isTrial ? (pass ? `You're on the team. ${Story.ctx().c1} claps you on the shoulder: "Welcome to the ${teamName(S.profile.house)} side." +${xp} XP` : `"Not this time — but we're short a reserve. Train hard." +${xp} XP`) : `+${xp} XP`, done);
      } });
    });
  },
  training() {
    const S = Career.S;
    if (!Career.canTrain()) return this.hub();
    this.show(`<div class="panel" style="width:min(640px,100%)"><h2>Training</h2><p class="note">One session between fixtures. A practice match gives more XP; a quick session raises one attribute directly.</p>
      <div class="menuGrid">
        <button class="mbtn primary" data-tr="hoops"><b>HOOP PRACTICE</b><small>90 seconds of scrimmage. +XP for every goal.</small></button>
        <button class="mbtn" data-tr="snitch"><b>SNITCH DRILL</b><small>Find and catch the Snitch before the whistle.</small></button>
        ${ATTRS.map(([k, n]) => `<button class="mbtn" data-q="${k}"><b>QUICK: ${n.toUpperCase()}</b><small>${S.attrs[k]} / ${Career.attrCap()}</small></button>`).join('')}
      </div><div class="actions"><button class="act" data-cgo="hub">BACK</button></div></div>`);
    this.root.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { const r = Career.train(b.dataset.q, 1); Sound.play('ui'); this.notice('Session complete', `${ATTRS.find(a => a[0] === b.dataset.q)[1]} ${r.gain ? '+' + r.gain : '(at cap)'} · +${r.xp} XP${r.ups ? ' · LEVEL UP' : ''}`, () => this.hub()); }));
    this.root.querySelectorAll('[data-tr]').forEach(b => b.addEventListener('click', () => {
      const snitch = b.dataset.tr === 'snitch';
      S.trainedAt = S.ev + S.year * 100 + S.season * 1000;
      this.root.hidden = true; this.backdrop = null; Scenes.leave(true);
      QC.drill({ time: 90, seeker: snitch, need: snitch ? 1 : 3, onEnd: (score) => { const xp = 30 + score * 22; const ups = Career.addXP(xp); const k = snitch ? 'sek' : 'sht'; if (score >= (snitch ? 1 : 3) && S.attrs[k] < Career.attrCap()) S.attrs[k]++; Career.save(); this.hubScene(); this.notice('Session complete', `${score} ${snitch ? 'caught' : 'goals'} · +${xp} XP${ups ? ' · LEVEL UP' : ''}`, () => this.hub()); } });
    }));
  },
  // ---------- profile ----------
  profile() {
    const S = Career.S, cap = Career.attrCap(), pers = Career.persona(), P = S.persona, tot = Object.values(P).reduce((a, b) => a + b, 0) || 1;
    this.show(`<div class="panel wide"><h2>${S.profile.name}</h2>
      <div class="twocol"><div>
        <div class="lvl"><b>LEVEL ${S.lvl}</b><div class="bar"><i style="width:${S.xp / Career.xpNeed() * 100}%"></i></div><span>${S.xp} / ${Career.xpNeed()} XP · ${S.sp} skill points · cap ${cap}</span></div>
        <div class="attrs">${ATTRS.map(([k, n]) => `<div class="attr"><span>${n}</span><div class="bar"><i style="width:${S.attrs[k]}%"></i><u style="left:${cap}%"></u></div><b>${S.attrs[k]}</b><button data-sp="${k}" ${S.sp && S.attrs[k] < cap ? '' : 'disabled'}>+</button></div>`).join('')}</div>
      </div><div>
        <div class="persona"><b>${pers.label}</b><span>Press persona</span>
          ${Object.entries(TONE_LABEL).map(([k, n]) => `<div class="pbar"><i class="tone ${k}">${TONE_ICON[k]}</i><span>${n}</span><div class="bar"><i style="width:${(P[k] || 0) / tot * 100}%"></i></div></div>`).join('')}</div>
        <div class="stats">${[['APPS', S.tot.apps], ['GOALS', S.tot.goals], ['ASSISTS', S.tot.assists], ['SNITCHES', S.tot.snitch], ['FINISHERS', S.tot.finishers], ['P.O.T.M.', S.tot.potm], ['WINS', S.tot.wins], ['BROOM', BROOMS[S.broom].name]].map(([k, v]) => `<div class="stat"><i>${k}</i><b>${v}</b></div>`).join('')}</div>
      </div></div><div class="actions"><button class="act go" data-cgo="hub">DONE</button></div></div>`);
    this.root.querySelectorAll('[data-sp]').forEach(b => b.addEventListener('click', () => { if (Career.spend(b.dataset.sp)) { Sound.play('ui'); this.profile(); } }));
  },
  team() {
    const S = Career.S, roster = S.phase === 'school' ? Career.squad() : (S.roster || []);
    const roleN = r => ({ chaser: 'Chaser', beater: 'Beater', keeper: 'Keeper', seeker: 'Seeker' })[r];
    this.show(`<div class="panel wide"><h2>${teamName(Career.myTeam())}</h2>
      <div class="roster">${roster.map(m => `<div class="mate"><b>${m.name}${m.id === S.capt ? ' · C' : ''}</b><span>${roleN(m.role)}${m.pers ? ' · ' + m.pers : ''}${m.grudge ? ' · upset' : ''}</span><div class="bar"><i style="width:${m.chem}%;background:${m.chem > 60 ? '#5ab0ff' : m.chem > 35 ? '#e8b84a' : '#e0533a'}"></i></div></div>`).join('')}</div>
      ${S.rival && S.phase === 'school' ? `<div class="rival"><b>Rival: ${S.rival.name}</b><span>${teamName(S.rival.house)} · heat ${Math.round(S.rival.heat)}</span></div>` : ''}
      <div class="actions"><button class="act go" data-cgo="hub">DONE</button></div></div>`);
  },
  // ---------- the newspapers ----------
  press(fromMatch) {
    const S = Career.S;
    this.hubScene();
    const tabs = [['prophet', 'The Daily Prophet'], ['quibbler', 'The Quibbler'], ['witch', 'Witch Weekly'], ['table', 'Table'], ['fixtures', 'Fixtures'], ['leaders', 'Leaders']];
    const cur = this.paperTab = this.paperTab || 'prophet';
    this.show(`<div class="paperWrap"><div class="paperTabs">${tabs.map(([k, n]) => `<button class="${k === cur ? 'on' : ''}" data-pt="${k}">${n}</button>`).join('')}<button class="close" data-cgo="hub">✕</button></div><div class="paperBody" id="paperBody"></div></div>`);
    this.root.querySelectorAll('[data-pt]').forEach(b => b.addEventListener('click', () => { this.paperTab = b.dataset.pt; this.press(); }));
    const body = this.root.querySelector('#paperBody');
    if (cur === 'table') return this.tableView(body);
    if (cur === 'fixtures') return this.fixturesView(body);
    if (cur === 'leaders') return this.leadersView(body);
    const papers = cur === 'prophet' ? ['prophet', 'school'] : [cur];
    const list = S.news.filter(a => papers.includes(a.paper));
    if (!list.length) { body.innerHTML = `<div class="paperEmpty">No stories yet.</div>`; return; }
    const sel = this.selArticle && list.find(a => a.id === this.selArticle) || list[0];
    const mast = { prophet: 'The Daily Prophet', school: 'The Daily Prophet', quibbler: 'The Quibbler', witch: 'Witch Weekly' }[sel.paper];
    body.innerHTML = `<div class="paperList">${list.slice(0, 20).map(a => `<button class="${a === sel ? 'on' : ''} ${a.fresh ? 'fresh' : ''}" data-a="${a.id}"><b>${a.headline}</b><span>${a.when || ''}</span></button>`).join('')}</div>
      <article class="paper ${sel.paper}"><header><div class="mast">${mast}</div><div class="dateline">${sel.when || ''} · ${sel.paper === 'quibbler' ? 'Free with every pair of Spectrespecs' : 'Seven Knuts'}</div></header>
        <h1>${sel.headline}</h1>${sel.sub ? `<h3>${sel.sub}</h3>` : ''}
        <figure class="photo"><canvas id="paperPhoto" width="320" height="180"></canvas><figcaption>${sel.photo || (Photo.frames.length && sel === S.news[0]) ? (sel.kind === 'match' ? `${S.profile.name} in action against ${S.last ? teamName(S.last.opp) : 'the opposition'}` : 'Moving photograph') : ''}</figcaption></figure>
        <p>${sel.body}</p>${(sel.quotes || []).map(q => `<blockquote>"${q.text}"<cite>${Career.S.profile.name}, speaking to ${q.by}</cite></blockquote>`).join('')}
        ${sel.twisted ? `<div class="quillNote">✒ Quotes recorded by Quick-Quotes Quill</div>` : ''}</article>`;
    body.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { this.selArticle = b.dataset.a; this.press(); }));
    sel.fresh = false; Career.save();
    this.paintPhoto(this.root.querySelector('#paperPhoto'), sel);
  },
  // wizarding photographs move: loop the frames captured during the match, sepia-toned
  paintPhoto(cv, a) {
    const g = cv.getContext('2d'); clearInterval(this.photoT);
    const frames = a === Career.S.news[0] && Photo.frames.length ? Photo.frames : null;
    const sepia = () => { const id = g.getImageData(0, 0, cv.width, cv.height), d = id.data; for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], b = d[i + 2]; d[i] = Math.min(255, r * 0.39 + gg * 0.77 + b * 0.19); d[i + 1] = Math.min(255, r * 0.35 + gg * 0.69 + b * 0.17); d[i + 2] = Math.min(255, r * 0.27 + gg * 0.53 + b * 0.13); } g.putImageData(id, 0, 0); const v = g.createRadialGradient(160, 90, 60, 160, 90, 190); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,24,8,.55)'); g.fillStyle = v; g.fillRect(0, 0, 320, 180); };
    if (frames) { let k = 0, dir = 1; this.photoT = setInterval(() => { g.drawImage(frames[k], 0, 0); sepia(); k += dir; if (k >= frames.length - 1 || k <= 0) dir = -dir; }, 85); return; }
    if (a.photo) { const im = new Image(); im.onload = () => { g.drawImage(im, 0, 0, 320, 180); sepia(); }; im.src = a.photo; return; }
    // no photo: the club crest on newsprint
    g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, 320, 180);
    if (a.crest != null) { const im = new Image(); im.onload = () => { g.drawImage(im, 160 - 46, 90 - 56); sepia(); }; im.src = Tex.crestURL[a.crest]; }
    else { g.fillStyle = '#5a4a30'; g.font = `700 22px ${Tex.font}`; g.textAlign = 'center'; g.fillText(a.paper === 'quibbler' ? '✦ THE TRUTH IS OUT THERE ✦' : '✦', 160, 96); }
  },
  tableView(body) {
    const S = Career.S, my = Career.myTeam();
    const T = S.phase === 'school' ? (S.cup ? S.cup.t : null) : S.phase === 'wc' && S.wc ? S.wc.t : S.league ? S.league.t : null;
    if (!T) { body.innerHTML = `<div class="paperEmpty">No table yet.</div>`; return; }
    const rows = Career.sorted(T);
    body.innerHTML = `<table class="ltable"><thead><tr><th>#</th><th></th><th class="l">${S.phase === 'school' ? 'House Cup' : S.phase === 'wc' ? 'World Cup group' : 'British & Irish League'}</th><th>P</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>PTS</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.id === my ? 'me' : ''}"><td>${i + 1}</td><td><img src="${Tex.crestURL[r.id]}"></td><td class="l">${teamName(r.id)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.l}</td><td>${r.pf}</td><td>${r.pa}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table>`;
  },
  fixturesView(body) {
    const S = Career.S;
    if (S.phase === 'school') { const c = S.cup; body.innerHTML = c && c.results.length ? `<div class="fix">${c.results.map(r => `<div><span>${teamName(r.a)}</span><b>${r.sa} - ${r.sb}</b><span>${teamName(r.b)}</span></div>`).join('')}</div>` : `<div class="paperEmpty">No results yet.</div>`; return; }
    if (!S.league) { body.innerHTML = `<div class="paperEmpty">No fixtures.</div>`; return; }
    body.innerHTML = `<div class="fix">${S.league.rounds.map((rd, i) => `<h4>Matchday ${i + 1}</h4>` + rd.map(f => `<div class="${f.h === S.club || f.a === S.club ? 'me' : ''}"><span>${teamName(f.h)}</span><b>${f.done ? `${f.sh} - ${f.sa}` : 'v'}</b><span>${teamName(f.a)}</span></div>`).join('')).join('')}</div>`;
  },
  leadersView(body) {
    const S = Career.S;
    if (!S.league) { body.innerHTML = `<div class="paperEmpty">League statistics start in your first professional season.</div>`; return; }
    const g = Object.entries(S.league.leaders.goals).sort((a, b) => b[1] - a[1]).slice(0, 12);
    body.innerHTML = `<table class="ltable"><thead><tr><th>#</th><th class="l">Golden Quaffle race</th><th class="l">Club</th><th>Goals</th></tr></thead><tbody>${g.map(([k, v], i) => { const [n, t] = k.split('|'); return `<tr class="${n === S.profile.name ? 'me' : ''}"><td>${i + 1}</td><td class="l">${n}</td><td class="l">${CONFIG.teams[+t].short}</td><td><b>${v}</b></td></tr>`; }).join('')}</tbody></table>`;
  },
  // ---------- owl post ----------
  owl() {
    const S = Career.S;
    const sel = this.selMail && S.inbox.find(m => m.id === this.selMail) || S.inbox[0];
    this.show(`<div class="paperWrap"><div class="paperTabs"><button class="on">Owl Post</button><button class="close" data-cgo="hub">✕</button></div><div class="paperBody">
      <div class="paperList">${S.inbox.map(m => `<button class="${m === sel ? 'on' : ''} ${m.read ? '' : 'fresh'}" data-m="${m.id}"><b>${m.subj}</b><span>${m.from}</span></button>`).join('') || '<div class="paperEmpty">No owls.</div>'}</div>
      ${sel ? `<article class="letter"><div class="seal"></div><h3>${sel.subj}</h3><div class="from">From: ${sel.from} · ${sel.when || ''}</div><p>${sel.body.replace(/\n/g, '<br>')}</p>${sel.broom && !sel.claimed ? `<button class="act go" id="mClaim">ACCEPT THE ${BROOMS[sel.broom].name.toUpperCase()}</button>` : ''}${sel.claimed ? '<div class="note">Accepted.</div>' : ''}</article>` : ''}</div></div>`);
    this.root.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { this.selMail = b.dataset.m; this.owl(); }));
    if (sel) { sel.read = true; Career.save(); }
    const c = this.root.querySelector('#mClaim'); if (c) c.addEventListener('click', () => { if (!S.brooms.includes(sel.broom)) S.brooms.push(sel.broom); S.broom = sel.broom; sel.claimed = true; S.fame = clamp(S.fame + 2, 0, 100); Career.save(); Sound.play('ready'); this.owl(); });
  },
  // ---------- broomstick emporium ----------
  shop() {
    const S = Career.S;
    this.show(`<div class="panel wide"><h2>Broomstick Emporium</h2><p class="note">${S.gal} Galleons</p>
      <div class="brooms">${Object.entries(BROOMS).map(([id, b]) => { const own = S.brooms.includes(id); return `<div class="broomCard ${S.broom === id ? 'on' : ''}"><b>${b.name}</b><div class="bstat"><span>SPEED</span><div class="bar"><i style="width:${(b.spd - 0.85) / 0.3 * 100}%"></i></div></div><div class="bstat"><span>HANDLING</span><div class="bar"><i style="width:${(b.hnd - 0.85) / 0.3 * 100}%"></i></div></div><small>${b.desc}</small>${own ? `<button class="act ${S.broom === id ? '' : 'go'}" data-eq="${id}">${S.broom === id ? 'RIDING' : 'RIDE'}</button>` : `<button class="act go" data-buy="${id}" ${S.gal >= b.cost ? '' : 'disabled'}>${b.cost} G</button>`}</div>`; }).join('')}</div>
      <div class="actions"><button class="act" data-cgo="hub">BACK</button></div></div>`);
    this.root.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => { if (Career.buyBroom(b.dataset.buy)) { Sound.play('ready'); this.shop(); } }));
    this.root.querySelectorAll('[data-eq]').forEach(b => b.addEventListener('click', () => { S.broom = b.dataset.eq; Career.save(); this.shop(); }));
  },
  // ---------- school ceremonies, offers, awards, legacy ----------
  cupCeremony(ev, done) {
    const S = Career.S, cup = Career.ensureCup(), tab = Career.sorted(cup.t), win = tab[0].id;
    S.cupWinner = win;
    const mine = win === S.profile.house;
    if (mine) { S.tot.cups++; S.fame = clamp(S.fame + 4, 0, 100); S.gal += 30; }
    const sc = { set: 'hall', variant: 'leaving', cast: [{ id: 'me', at: 'seatMe', anim: 'sit', o: { outfit: 'school' } }, { id: 'friend', at: 'seatF', anim: 'sitTalk', o: { outfit: 'school' } }, { id: 'head', at: 'high', anim: 'talk', o: { outfit: 'staff' } }], beats: [
      { title: 'The Leaving Feast', sub: `Year ${S.year}` }, { cam: 'hallWide' }, { wait: 2 },
      { say: ['head', `The Quidditch Cup this year goes to... ${teamName(win).toUpperCase()}!`] },
      { cam: 'tableClose' },
      { say: ['friend', mine ? `WE DID IT! ${Career.first().toUpperCase()}, WE ACTUALLY DID IT!` : `Next year. Next year it's ours. I can feel it.`] },
    ] };
    QUI.hideAll(); this.root.hidden = true;
    Script.play(sc, () => {
      this.notice(mine ? 'House Cup winners' : 'Year complete', `${teamName(win)} win the Quidditch Cup.${mine ? ' +30 Galleons, +4 fame.' : ''} ${S.year < 7 ? 'The summer passes. See you in September.' : ''}`, done);
    });
  },
  offers(done) {
    const S = Career.S, list = Career.offers();
    this.hubScene();
    this.show(`<div class="panel wide"><h2>${S.club == null ? 'Trial offers' : 'Contract offers'}</h2><p class="note">${S.club == null ? 'Scouts have seen enough. Choose your first professional club.' : 'Your contract is up. Stay, or move on?'}</p>
      <div class="offers">${list.map((o, i) => `<button class="offer" data-o="${i}"><img src="${Tex.crestURL[o.club]}"><b>${teamName(o.club)}</b><span>${o.renew ? 'Renewal' : (CONFIG.teams[o.club].city || '')}</span><div class="ostat"><i>${o.years} yrs</i><i>${o.wage} G/wk</i><i>rating ${CONFIG.teams[o.club].str}</i></div><small>"${o.pitch}"</small></button>`).join('')}</div></div>`);
    this.root.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { Sound.play('ready'); Career.sign(list[+b.dataset.o]); done(); }));
  },
  awards(aw, cb) {
    const S = Career.S;
    this.show(`<div class="panel" style="width:min(560px,100%)"><h2>Season ${S.season} awards</h2>
      <div class="awards"><div><img src="${Tex.crestURL[aw.champ]}"><b>${teamName(aw.champ)}</b><span>League champions</span></div><div><b>${ordinal(aw.pos)}</b><span>${teamName(S.club)} finish</span></div><div><b>${aw.golden}</b><span>Golden Quaffle</span></div></div>
      ${aw.mine.length ? `<div class="lvlUp">${aw.mine.join(' · ')}</div>` : ''}
      <div class="actions"><button class="act go" id="aOk">CONTINUE</button></div></div>`);
    this.root.querySelector('#aOk').addEventListener('click', () => { Sound.play('ui'); cb(); });
  },
  legacy() {
    const S = Career.S, T = S.tot;
    this.show(`<div class="panel" style="width:min(600px,100%)"><h2>A Life in Quidditch</h2>
      <div class="frogCard"><div class="fcTop">FAMOUS WITCHES AND WIZARDS</div><canvas id="frogPortrait" width="200" height="240"></canvas><b>${S.profile.name}</b><p>${S.profile.pos === 'seeker' ? 'Seeker' : 'Chaser'} for ${[...new Set(S.hist.map(h => teamName(h.club)))].join(', ') || teamName(S.club)}. ${T.leagues} League title${T.leagues === 1 ? '' : 's'}, ${T.cups} House Cup${T.cups === 1 ? '' : 's'}, ${T.goals} goals and ${T.snitch} Snitches. Remembered as ${Career.persona().label}.</p></div>
      <div class="actions"><button class="act" data-cgo="quit">MAIN MENU</button></div></div>`);
    const cv = this.root.querySelector('#frogPortrait'), g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 240); gr.addColorStop(0, '#3a2a5a'); gr.addColorStop(1, '#1a1020'); g.fillStyle = gr; g.fillRect(0, 0, 200, 240); g.drawImage(R.renderer.domElement, R.renderer.domElement.width * 0.35, 0, R.renderer.domElement.width * 0.3, R.renderer.domElement.height, 0, 0, 200, 240);
  },
};
