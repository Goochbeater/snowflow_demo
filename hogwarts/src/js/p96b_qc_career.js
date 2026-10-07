/* ==== p96b_qc_career.js ==== */
/* QUIDDITCH CAREER — the save, the calendar, progression, the House Cup, the league and the World Cup, simulated; ported
   from Quidditch Skybound. A school year is a calendar of events (scenes, drills, matches); the professional years a
   thirteen-club round robin with a World Cup every four seasons. */
QC.look = (seed, body) => ({ v: 1 + (seed % 7), body });
const BROOMS = {
  star:       { name: 'Shooting Star',    spd: 0.93, hnd: 0.94, cost: 0,    desc: 'A school loaner. Slows down in a headwind and pulls to the left.' },
  clean7:     { name: 'Cleansweep Seven', spd: 0.97, hnd: 0.99, cost: 60,   desc: 'Dependable family broom. Smooth in the turns.' },
  comet260:   { name: 'Comet 260',        spd: 1.0,  hnd: 1.02, cost: 150,  desc: 'Light birch tail, quick off the mark.' },
  nimbus2000: { name: 'Nimbus 2000',      spd: 1.04, hnd: 1.05, cost: 340,  desc: 'Mahogany handle, a cut above anything at school.' },
  nimbus2001: { name: 'Nimbus 2001',      spd: 1.07, hnd: 1.07, cost: 720,  desc: 'Professional-grade speed with a hand-polished finish.' },
  firebolt:   { name: 'Firebolt',         spd: 1.12, hnd: 1.1,  cost: 1650, desc: 'Ash handle, diamond-hard polish, 0-150 mph in ten seconds.' },
};
const ATTRS = [['spd', 'Speed'], ['hnd', 'Handling'], ['sht', 'Shooting'], ['pas', 'Passing'], ['def', 'Defence'], ['sta', 'Stamina'], ['sek', 'Seeking']];
const ATTR_W = { chaser: { spd: 0.17, hnd: 0.15, sht: 0.22, pas: 0.18, def: 0.12, sta: 0.12, sek: 0.04 }, seeker: { spd: 0.22, hnd: 0.22, sht: 0.02, pas: 0.04, def: 0.05, sta: 0.15, sek: 0.3 } };
const TACTICS = {
  hawkshead: { name: 'Hawkshead Attacking Formation', desc: 'Chasers fly an arrowhead and push high. More shots, less cover.', push: 1, press: 0.4, pass: 0.5, shield: 0 },
  porskoff:  { name: 'Porskoff Ploy', desc: 'Draw the defence high, then drop the Quaffle to a Chaser below. Patient passing.', push: 0.4, press: 0.3, pass: 1, shield: 0 },
  parkin:    { name: "Parkin's Pincer", desc: 'Two Chasers squeeze the carrier. More steals, more fouls.', push: 0.5, press: 1, pass: 0.4, shield: 0 },
  shield:    { name: 'Seeker Shield', desc: 'Beaters escort your Seeker and hunt theirs. Built to win the Snitch.', push: 0.4, press: 0.4, pass: 0.5, shield: 1 },
};
const MONTHS = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
const PRON = {
  they: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', is: 'are', was: 'were', has: 'have', s: '' },
  he:   { they: 'he', them: 'him', their: 'his', theirs: 'his', is: 'is', was: 'was', has: 'has', s: 's' },
  she:  { they: 'she', them: 'her', their: 'her', theirs: 'hers', is: 'is', was: 'was', has: 'has', s: 's' },
};
const ROLES7 = [['chaser', 0], ['chaser', 1], ['chaser', 2], ['beater', 0], ['beater', 1], ['keeper', 0], ['seeker', 0]];
const roleKey = (r, s) => r + s;

const Career = {
  S: null, KEY: 'hl_qcareer', busy: false,
  has() { const s = lsGet(this.KEY, null); return !!(s && s.v); },
  load() { const s = lsGet(this.KEY, null); if (s && s.v === 1) { this.S = s; return true; } return false; },
  save() {
    if (!this.S) return;
    const S = this.S;
    if (S.news.length > 40) S.news.length = 40;
    if (S.inbox.length > 30) S.inbox.length = 30;
    let photos = 0; for (const a of S.news) if (a.photo) { if (++photos > 8) a.photo = null; }
    try { localStorage.setItem(this.KEY, JSON.stringify(S)); }
    catch (e) { for (const a of S.news) a.photo = null; lsSet(this.KEY, S); }
  },
  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) { /* storage unavailable */ } this.S = null; },
  rng() { const S = this.S; S.seed = (S.seed * 1103515245 + 12345) >>> 0; return S.seed / 4294967296; },
  pr(k) { return PRON[this.S.profile.pron || 'they'][k]; },
  first() { return this.S.profile.name.split(' ')[0]; },
  surname() { const n = this.S.profile.name.split(' '); return n[n.length - 1]; },

  // ---------- creation ----------
  create(p, rules) {
    const chaser = p.pos !== 'seeker';
    const base = chaser ? { spd: 48, hnd: 47, sht: 52, pas: 50, def: 44, sta: 48, sek: 30 } : { spd: 51, hnd: 52, sht: 30, pas: 36, def: 37, sta: 48, sek: 56 };
    const seed = (Date.now() & 0xffffff) ^ 0x5bd1e995;
    this.S = {
      v: 1, seed, created: Date.now(), profile: p, rules: Object.assign({ snitch: 'arcade', length: 1, diff: 'normal' }, rules),
      attrs: base, pot: 74, xp: 0, lvl: 1, sp: 2, gal: 25, brooms: ['star'], broom: 'star',
      fame: 3, fans: 20, trust: 45, persona: { gr: 0, tm: 0, sh: 0, fi: 0, de: 0 },
      mates: {}, phase: 'school', year: 1, season: 0, ev: 0, cal: [], trainedAt: -1,
      cup: null, league: null, club: null, contract: null, nation: p.nation, wc: null,
      news: [], inbox: [], flags: {}, hist: [], tot: { apps: 0, goals: 0, assists: 0, steals: 0, finishers: 0, snitch: 0, wins: 0, potm: 0, cups: 0, leagues: 0, wcs: 0 },
      goals: [], tactic: 'hawkshead', last: null, captain: false, rival: null, friend: null, partner: null,
    };
    this.castSchool();
    this.S.cal = Story.year(1);
    this.mail({ from: 'Hogwarts School of Witchcraft and Wizardry', subj: 'Your letter', body: `Dear ${p.name},\n\nWe are pleased to inform you that you have a place at Hogwarts School of Witchcraft and Wizardry. Term begins on 1 September. First-years may not bring their own broomsticks, but flying lessons begin in the first week.\n\nYours sincerely,\nMinerva Ashgrove, Deputy Headmistress`, tag: 'school' });
    this.save();
  },
  // classmates and house team-mates, stable through the school years
  castSchool() {
    const S = this.S, h = S.profile.house, r = mulberry32(S.seed);
    const mk = (role, slot, ahead, body) => { const id = 'm' + Object.keys(S.mates).length; const b = body || (r() < 0.5 ? 'm' : 'f'); const look = QC.look(Math.floor(r() * 1e6), b); S.mates[id] = { id, name: makeName(Math.floor(r() * 1e9), b), body: b, look, role, slot, ahead, chem: 45 + Math.floor(r() * 15), team: h }; return id; };
    // best friend in your year (a Chaser), a captain three years ahead, and the rest of the squad
    S.friend = mk('chaser', 1, 0);
    S.capt = mk('keeper', 0, 3);
    mk('chaser', 2, 1); mk('beater', 0, 2); mk('beater', 1, 0); mk(S.profile.pos === 'seeker' ? 'chaser' : 'seeker', 0, 1);
    S.mates[S.friend].chem = 62;
    // the rival is in another house, in your year
    const rh = h === 1 ? 0 : 1, rb = r() < 0.5 ? 'm' : 'f';
    S.rival = { name: makeName(Math.floor(r() * 1e9), rb), body: rb, look: QC.look(Math.floor(r() * 1e6), rb), house: rh, heat: 20 };
  },
  mate(id) { return this.S.mates[id]; },
  squad() { return Object.values(this.S.mates).filter(m => !m.gone); },
  chemAvg() { const s = this.squad(); return s.length ? s.reduce((a, m) => a + m.chem, 0) / s.length : 50; },

  // ---------- ratings ----------
  ovr(a = this.S.attrs, pos = this.S.profile.pos) {
    const w = ATTR_W[pos === 'seeker' ? 'seeker' : 'chaser']; let v = 0; for (const k in w) v += a[k] * w[k]; return Math.round(v);
  },
  xpNeed(l = this.S.lvl) { return Math.round(95 * Math.pow(l, 1.15)); },
  addXP(n) {
    const S = this.S; S.xp += Math.round(n); let ups = 0;
    while (S.xp >= this.xpNeed()) { S.xp -= this.xpNeed(); S.lvl++; S.sp += 5; ups++; }
    return ups;
  },
  attrCap() { const S = this.S; return Math.min(99, S.pot + (S.phase === 'school' ? -14 + S.year * 2 : 0)); },
  spend(k) {
    const S = this.S; if (S.sp <= 0) return false;
    const cap = this.attrCap(); if (S.attrs[k] >= cap) return false;
    const cost = S.attrs[k] >= 85 ? 3 : S.attrs[k] >= 70 ? 2 : 1;
    if (S.sp < cost) return false;
    S.sp -= cost; S.attrs[k]++; this.save(); return true;
  },
  // attribute + broom -> in-match multipliers (see Game.pm)
  playerMods() {
    const a = this.S.attrs, b = BROOMS[this.S.broom] || BROOMS.star, n = v => (v - 50) / 50;
    const chem = this.chemAvg(), pers = this.persona();
    return {
      speed: b.spd * (1 + n(a.spd) * 0.08), turn: b.hnd * (1 + n(a.hnd) * 0.1),
      drain: 1 - n(a.sta) * 0.2, regen: 1 + n(a.sta) * 0.25,
      perfect: 1 + n(a.sht) * 0.5, save: 1 - n(a.sht) * 0.3, homing: 1 + n(a.pas) * 0.4,
      steal: 1 + n(a.def) * 0.2, stealOk: n(a.def) * 0.06,
      flair: (1 + n(a.sta) * 0.1) * (pers.key === 'sh' ? 1.15 : 1), focus: 1 + n(a.sek) * 0.35,
      callOk: clamp(0.5 + chem / 100 * 0.5 + (pers.key === 'tm' ? 0.08 : 0), 0.45, 1), callDelay: lerp(1.5, 0.75, chem / 100) * (pers.key === 'tm' ? 0.85 : 1),
    };
  },
  persona() {
    const p = this.S.persona, L = { gr: 'The Golden Star', tm: 'The Captain', sh: 'The Showman', fi: 'The Firebrand', de: 'The Enigma' };
    let key = null, best = 2; for (const k in p) if (p[k] > best) { best = p[k]; key = k; }
    return { key, label: key ? L[key] : 'Unknown Quantity' };
  },
  // ---------- calendar ----------
  cur() { return this.S.cal[this.S.ev] || null; },
  when(ev = this.cur()) {
    const S = this.S; if (!ev) return '';
    if (S.phase === 'school') return `Year ${S.year} · ${ev.month || ''}`;
    if (S.phase === 'wc') return `World Cup · ${ev.month || 'Summer'}`;
    return `Season ${S.season} · ${ev.month || ''}`;
  },
  advance() {
    const S = this.S; S.ev++;
    if (S.ev >= S.cal.length) this.nextChapter();
    this.save();
  },
  nextChapter() {
    const S = this.S; S.ev = 0;
    if (S.phase === 'school') {
      if (S.year < 7) { S.year++; this.schoolAge(); S.cal = Story.year(S.year); }
      else { S.phase = 'grad'; S.cal = [{ t: 'offers', label: 'Professional trials', month: 'July' }]; }
    } else if (S.phase === 'grad') this.startSeason();
    else if (S.phase === 'pro') {
      if (S.wcPending) { S.wcPending = false; this.startWorldCup(); }
      else if (S.season >= 12 || S.retire) { S.phase = 'retired'; S.cal = [{ t: 'legacy', label: 'Legacy', month: 'Summer' }]; }
      else this.startSeason();
    } else if (S.phase === 'wc') { S.phase = 'pro'; if (S.season >= 12 || S.retire) { S.phase = 'retired'; S.cal = [{ t: 'legacy', label: 'Legacy', month: 'Summer' }]; } else this.startSeason(); }
  },
  // squad turnover each September: seventh-years leave, a new face arrives
  schoolAge() {
    const S = this.S, r = mulberry32(S.seed + S.year);
    for (const m of this.squad()) {
      const yr = S.year + (m.ahead || 0); // their school year this September
      if (yr > 7) { m.gone = true; if (m.id === S.capt) S.capt = null; }
    }
    const missing = ROLES7.filter(([role, slot]) => !(role === (S.profile.pos === 'seeker' ? 'seeker' : 'chaser') && slot === 0) && !this.squad().some(m => m.role === role && m.slot === slot));
    for (const [role, slot] of missing) {
      const b = r() < 0.5 ? 'm' : 'f', id = 'm' + Object.keys(S.mates).length;
      S.mates[id] = { id, name: makeName(Math.floor(r() * 1e9), b), body: b, look: QC.look(Math.floor(r() * 1e6), b), role, slot, ahead: 2 + Math.floor(r() * 2) - S.year, chem: 42 + Math.floor(r() * 12), team: S.profile.house, fresh: true };
    }
    if (!S.capt || !S.mates[S.capt] || S.mates[S.capt].gone) {
      const eldest = this.squad().sort((a, b) => (b.ahead || 0) - (a.ahead || 0))[0];
      S.capt = S.captain ? null : eldest ? eldest.id : null;
    }
  },
  // ---------- house cup ----------
  ensureCup() {
    const S = this.S; if (S.cup && S.cup.year === S.year) return S.cup;
    S.cup = { year: S.year, t: {}, results: [] };
    for (const h of HOUSE_IDS) S.cup.t[h] = { p: 0, w: 0, l: 0, pf: 0, pa: 0, pts: 0 };
    return S.cup;
  },
  record(table, a, b, sa, sb) {
    const A = table[a], B = table[b]; if (!A || !B) return;
    A.p++; B.p++; A.pf += sa; A.pa += sb; B.pf += sb; B.pa += sa;
    if (sa > sb) { A.w++; B.l++; A.pts += 3; } else if (sb > sa) { B.w++; A.l++; B.pts += 3; } else { A.pts++; B.pts++; }
  },
  sorted(table) { return Object.entries(table).map(([k, v]) => Object.assign({ id: +k }, v)).sort((x, y) => y.pts - x.pts || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf); },
  // ---------- simulation ----------
  str(team) {
    const S = this.S, T = CONFIG.teams[team];
    let s = T.str || 70;
    if (T.kind === 'house') s = 62 + S.year * 1.5 + ((team * 7 + S.year * 3) % 5);
    return s;
  },
  simMatch(a, b, o = {}) {
    const r = o.rng || Math.random, sa0 = o.sa || this.str(a), sb0 = o.sb || this.str(b);
    const ea = Math.exp((sa0 - sb0) / 18), share = ea / (1 + ea);
    const goals = 9 + Math.floor(r() * 7);
    let ga = 0, gb = 0; for (let i = 0; i < goals; i++) if (r() < share) ga++; else gb++;
    const snitchSide = r() < lerp(0.5, share, 0.8) ? 0 : 1, val = (o.snitch || this.S.rules.snitch) === 'classic' ? 150 : 30;
    return { sa: ga * 10 + (snitchSide === 0 ? val : 0), sb: gb * 10 + (snitchSide === 1 ? val : 0), ga, gb, snitchSide, mins: 4 + Math.floor(r() * 9) };
  },
  // your own match, simulated: your attributes tilt it
  simMine(ev) {
    const S = this.S, mine = this.myTeam(), opp = ev.opp, o = this.ovr();
    const res = this.simMatch(ev.home !== false ? mine : opp, ev.home !== false ? opp : mine, { sa: ev.home !== false ? this.str(mine) + (o - 60) * 0.4 : undefined, sb: ev.home === false ? this.str(mine) + (o - 60) * 0.4 : undefined });
    const flip = ev.home === false;
    const myG = flip ? res.gb : res.ga, theirG = flip ? res.ga : res.gb, mySnitch = (flip ? 1 : 0) === res.snitchSide;
    const chaser = S.profile.pos !== 'seeker', r = Math.random;
    const goals = chaser ? Math.min(myG, Math.round(myG * clamp(0.25 + (o - 50) / 160, 0.15, 0.6) + r() * 1.2)) : 0;
    const val = S.rules.snitch === 'classic' ? 150 : 30;
    const stats = { goals, assists: chaser ? Math.round(r() * 2.2) : 0, passes: chaser ? 4 + Math.round(r() * 8) : 1, steals: Math.round(r() * (S.attrs.def / 30)), shots: goals + Math.round(r() * 3), dodges: Math.round(r() * 3), finishers: goals ? Math.round(r() * Math.min(goals, 1.4)) : 0, best: null, topSpeed: 36, bestRank: 2 + Math.round(r() * 2), hits: Math.round(r() * 2), saves: 0, passTo: {}, assistTo: {}, goalsBy: {}, finisherNames: [], snitch: !chaser && mySnitch };
    const score = [myG * 10 + (mySnitch ? val : 0), theirG * 10 + (!mySnitch ? val : 0)];
    return { win: score[0] === score[1] ? -1 : score[0] > score[1] ? 0 : 1, score, houses: [mine, opp], stats, style: 0, snitchSide: mySnitch ? 0 : 1, snitchMine: stats.snitch, snitchT: res.mins * 60, role: S.profile.pos, sim: true };
  },
  myTeam() { const S = this.S; return S.phase === 'school' ? S.profile.house : S.phase === 'wc' ? S.nation : S.club; },
  // ---------- match setup for a calendar fixture ----------
  matchOpts(ev) {
    const S = this.S, mine = this.myTeam(), opp = ev.opp;
    const gap = this.str(opp) - 70 + (S.phase === 'school' ? -4 : 3) + { easy: -12, normal: 0, hard: 10 }[S.rules.diff || 'normal'];
    const diff = gap < -6 ? 'rookie' : gap > 9 ? 'legend' : 'pro';
    const mates = {}, opps = {};
    const roster = S.phase === 'school' ? this.squad() : S.roster || [];
    for (const m of roster) mates[roleKey(m.role, m.slot)] = { name: m.name, id: m.id };
    const r = mulberry32(opp * 977 + S.year * 31 + S.season * 7);
    for (const [role, slot] of ROLES7) { const b = CONFIG.teams[opp].body || (r() < 0.5 ? 'm' : 'f'); opps[roleKey(role, slot)] = { name: makeName(Math.floor(r() * 1e9), b), id: null }; }
    const weather = ev.weather || (S.phase === 'school' ? pick(['golden', 'golden', 'overcast', 'golden']) : pick(['golden', 'overcast', 'night', 'night']));
    return { houses: [mine, opp], diff, length: [180, 360, 600][S.rules.length] || 360, snitch: S.rules.snitch, role: S.profile.pos, pm: this.playerMods(), mates, opps, tactic: S.tactic, playerName: S.profile.name, weather, career: true, venue: S.phase === 'school' ? 'hogwarts' : ev.home !== false ? mine : opp, home: ev.home !== false, comp: ev.comp, label: ev.label };
  },
  // ---------- match results ----------
  rate(res) {
    const st = res.stats, chaser = res.role !== 'seeker';
    let r = 5.6 + (res.win === 0 ? 0.8 : res.win === 1 ? -0.6 : 0);
    r += st.goals * 0.55 + st.assists * 0.35 + st.steals * 0.3 + st.finishers * 0.4 + (st.snitch ? 2.2 : 0) + Math.min(st.dodges, 4) * 0.1 - st.hits * 0.15;
    if (chaser && st.goals === 0 && st.assists === 0) r -= 0.8;
    if (!chaser && !st.snitch) r -= 0.6;
    return clamp(Math.round(r * 10) / 10, 3, 10);
  },
  onMatchEnd(res) {
    const S = this.S, ev = this.cur(); if (!ev) return;
    const st = res.stats, rating = this.rate(res), mine = res.houses[0], opp = res.houses[1];
    const out = { res, rating, ev: Object.assign({}, ev), xp: 0, gal: 0, fame: 0, fans: 0, goalsDone: [], levels: 0, chem: {} };
    // tables
    if (ev.comp === 'house') { const cup = this.ensureCup(); this.record(cup.t, mine, opp, res.score[0], res.score[1]); cup.results.push({ a: mine, b: opp, sa: res.score[0], sb: res.score[1] }); }
    if (ev.comp === 'league') { const L = S.league; this.record(L.t, mine, opp, res.score[0], res.score[1]); const fx = L.rounds[ev.round].find(f => (f.h === mine || f.a === mine)); if (fx) { fx.done = true; fx.sh = fx.h === mine ? res.score[0] : res.score[1]; fx.sa = fx.h === mine ? res.score[1] : res.score[0]; } }
    if (ev.comp === 'wc') {
      this.wcRecord(ev, res);
      if (ev.ko) {
        const won = res.score[0] > res.score[1] || (res.score[0] === res.score[1] && res.snitchSide === 0);
        if (!won) { S.cal = S.cal.filter((e, i) => i <= S.ev || !(e.comp === 'wc' && e.ko)); S.cal.splice(S.ev + 1, 0, { t: 'scene', id: 'wcOut', label: 'Out of the World Cup', month: 'July' }); News.wcOut(ev.stage); }
        else if (ev.stage === 'Final') { S.tot.wcs++; S.fame = clamp(S.fame + 15, 0, 100); S.gal += 800; News.wcWin(); S.cal.splice(S.ev + 1, 0, { t: 'scene', id: 'wcWin', label: 'World champions', month: 'July' }); }
      }
    }
    // career totals
    const T = S.tot; T.apps++; T.goals += st.goals; T.assists += st.assists; T.steals += st.steals; T.finishers += st.finishers; if (st.snitch) T.snitch++; if (res.win === 0) T.wins++;
    const potm = rating >= 8.2; if (potm) T.potm++;
    // xp & money & reputation
    out.xp = 60 + rating * 18 + st.goals * 12 + st.assists * 8 + st.steals * 6 + st.finishers * 15 + (st.snitch ? 60 : 0) + (res.win === 0 ? 40 : 0);
    if (res.sim) out.xp *= 0.6;
    out.gal = S.phase === 'school' ? (res.win === 0 ? 5 : 2) : Math.round((S.contract ? S.contract.bonus : 20) * (res.win === 0 ? 1 : 0.4) + (potm ? 25 : 0));
    const big = S.phase !== 'school' ? 1.4 : 1;
    out.fame = Math.round(((res.win === 0 ? 1.2 : -0.4) + (rating - 6) * 0.9 + (st.finishers ? 1 : 0) + (st.snitch ? 1.5 : 0)) * big * 10) / 10;
    out.fans = Math.round(((res.win === 0 ? 2 : -1.5) + (rating - 6.5) * 1.2) * 10) / 10;
    S.fame = clamp(S.fame + out.fame, 0, 100); S.fans = clamp(S.fans + out.fans, 0, 100);
    S.trust = clamp(S.trust + (rating - 6.2) * 1.5 + (res.win === 0 ? 1 : 0), 0, 100);
    S.gal += out.gal;
    // teammate goals from the locker room
    for (const g of S.goals) {
      const done = Goals.check(g, res);
      const m = this.mate(g.mate);
      if (done) { out.goalsDone.push(g); out.xp += g.xp; if (m) { m.chem = clamp(m.chem + g.chem, 0, 100); out.chem[m.id] = (out.chem[m.id] || 0) + g.chem; } }
      else if (m) { m.chem = clamp(m.chem - 2, 0, 100); out.chem[m.id] = (out.chem[m.id] || 0) - 2; }
    }
    S.goals = [];
    // chemistry drifts with results; passes build it
    for (const m of this.squad()) {
      let d = res.win === 0 ? 1 : -0.5; d += Math.min(3, (st.passTo[m.id] || 0) * 0.5) + (st.assistTo[m.id] || 0);
      m.chem = clamp(m.chem + d, 0, 100); out.chem[m.id] = (out.chem[m.id] || 0) + d;
    }
    if (S.rival && ev.opp === S.rival.house) S.rival.heat = clamp(S.rival.heat + (res.win === 0 ? 8 : 3), 0, 100);
    out.levels = this.addXP(out.xp);
    // natural development from what you actually did on the pitch
    const grow = S.grow || (S.grow = {}), cap = this.attrCap(), add = (k, v) => { grow[k] = (grow[k] || 0) + v; while (grow[k] >= 1) { grow[k] -= 1; if (S.attrs[k] < cap) { S.attrs[k]++; (out.grew || (out.grew = [])).push(k); } } };
    add('sht', st.goals * 0.12 + st.shots * 0.03); add('pas', st.passes * 0.02 + st.assists * 0.1); add('def', st.steals * 0.12); add('sta', 0.12); add('spd', 0.08); add('hnd', st.dodges * 0.04 + 0.05); add('sek', st.snitch ? 0.5 : res.role === 'seeker' ? 0.15 : 0);
    // the rest of the round
    if (ev.comp === 'house') this.simHouseRound(ev);
    if (ev.comp === 'league') this.simLeagueRound(ev.round);
    if (ev.comp === 'wc') this.simWCRound(ev);
    S.last = { opp, score: res.score, rating, win: res.win, goals: st.goals, snitch: st.snitch, finishers: st.finishers, comp: ev.comp, label: ev.label, home: ev.home !== false, potm, finisherName: st.best ? st.best.name : null, steals: st.steals, assists: st.assists, mates: st.goalsBy };
    News.matchReport(S.last, res);
    this.afterMatchMail(out);
    this.lastOut = out;
    this.save();
    CareerUI.results(out);
  },
  afterMatchMail(out) {
    const S = this.S;
    if (S.phase === 'school' && S.year >= 6 && S.fame >= 18 && !S.flags.scout1) { S.flags.scout1 = true; Story.scoutLetter(); }
    if (S.fame >= 30 && !S.flags.spons1 && S.phase !== 'school') { S.flags.spons1 = true; Story.sponsorLetter('comet260'); }
    if (S.fame >= 55 && !S.flags.spons2) { S.flags.spons2 = true; Story.sponsorLetter('nimbus2001'); }
    if (S.fame >= 78 && !S.flags.spons3) { S.flags.spons3 = true; Story.sponsorLetter('firebolt'); }
    if (out.rating >= 8.5 && Math.random() < 0.5) Story.fanLetter();
  },
  simHouseRound(ev) {
    const S = this.S, cup = this.ensureCup(), mine = S.profile.house;
    const others = HOUSE_IDS.filter(h => h !== mine && h !== ev.opp);
    if (others.length === 2) {
      const [a, b] = others, r = this.simMatch(a, b);
      this.record(cup.t, a, b, r.sa, r.sb); cup.results.push({ a, b, sa: r.sa, sb: r.sb });
    }
  },
  // ---------- professional seasons ----------
  startSeason() {
    const S = this.S; S.phase = 'pro'; S.season++; S.ev = 0;
    const teams = CLUB_IDS.slice();
    // single round robin (circle method) over 13 clubs + a bye
    const list = [...teams, -1], n = list.length, rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const rd = [];
      for (let i = 0; i < n / 2; i++) { const a = list[i], b = list[n - 1 - i]; if (a >= 0 && b >= 0) rd.push(r % 2 ? { h: b, a } : { h: a, a: b }); }
      rounds.push(rd); list.splice(1, 0, list.pop());
    }
    S.league = { season: S.season, t: {}, rounds, leaders: {} };
    for (const t of teams) S.league.t[t] = { p: 0, w: 0, l: 0, pf: 0, pa: 0, pts: 0 };
    // player stat leaders: seeded with each club's stars
    this.seedLeaders();
    // calendar
    const cal = [];
    cal.push(S.season === 1 ? { t: 'scene', id: 'signing', label: 'Signing day', month: 'August' } : { t: 'scene', id: 'preseason', label: 'Pre-season', month: 'August' });
    rounds.forEach((rd, r) => {
      const month = MONTHS[Math.min(9, Math.floor(r * 10 / 13))];
      const fx = rd.find(f => f.h === S.club || f.a === S.club);
      if (fx) cal.push({ t: 'match', comp: 'league', round: r, opp: fx.h === S.club ? fx.a : fx.h, home: fx.h === S.club, label: `League · Matchday ${r + 1}`, month });
      else cal.push({ t: 'bye', round: r, label: `Matchday ${r + 1} · Bye week`, month });
      if (r === 5) cal.push({ t: 'scene', id: 'gala', label: 'Witch Weekly Gala', month: 'December' });
    });
    cal.push({ t: 'awards', label: 'Season awards', month: 'June' });
    S.cal = cal;
    if (S.season === 2 || (S.season > 2 && (S.season - 2) % 4 === 0)) S.wcPending = true;
    this.buildRoster();
  },
  buildRoster() {
    const S = this.S, r = mulberry32(S.club * 131 + S.season * 17 + S.seed % 1000);
    const keep = (S.roster || []).filter(m => m.team === S.club && r() < 0.8);
    const roster = [];
    for (const [role, slot] of ROLES7) {
      if (role === (S.profile.pos === 'seeker' ? 'seeker' : 'chaser') && slot === 0) continue;
      let m = keep.find(k => k.role === role && k.slot === slot);
      if (!m) { const b = CONFIG.teams[S.club].body || (r() < 0.5 ? 'm' : 'f'); m = { id: 'p' + S.season + role + slot, name: makeName(Math.floor(r() * 1e9), b), body: b, look: QC.look(Math.floor(r() * 1e6), b), role, slot, chem: 40 + Math.floor(r() * 15), team: S.club }; }
      roster.push(m); S.mates[m.id] = m;
    }
    for (const id in S.mates) if (!roster.includes(S.mates[id])) S.mates[id].gone = true;
    S.roster = roster;
  },
  seedLeaders() {
    const S = this.S, L = S.league.leaders = { goals: {}, catches: {} };
    for (const t of CLUB_IDS) { const r = mulberry32(t * 53 + S.season); L.goals[makeName(Math.floor(r() * 1e9), CONFIG.teams[t].body || (r() < 0.5 ? 'm' : 'f')) + '|' + t] = 0; }
  },
  simLeagueRound(r) {
    const S = this.S, L = S.league;
    for (const f of L.rounds[r]) {
      if (f.done) continue;
      const m = this.simMatch(f.h, f.a); f.done = true; f.sh = m.sa; f.sa = m.sb;
      this.record(L.t, f.h, f.a, m.sa, m.sb);
      // spread goals across the leaderboard
      for (const k in L.leaders.goals) { const t = +k.split('|')[1]; if (t === f.h) L.leaders.goals[k] += Math.round(m.ga * 0.4); if (t === f.a) L.leaders.goals[k] += Math.round(m.gb * 0.4); }
    }
    const me = S.profile.name + '|' + S.club; L.leaders.goals[me] = S.tot.goals - (S.seasonStart ? S.seasonStart.goals : 0);
    News.roundup(r);
  },
  onBye(ev) { this.simLeagueRound(ev.round); },
  // end-of-season awards, contracts, transfers
  seasonAwards() {
    const S = this.S, tab = this.sorted(S.league.t), champ = tab[0].id, pos = tab.findIndex(x => x.id === S.club) + 1;
    const goals = Object.entries(S.league.leaders.goals).sort((a, b) => b[1] - a[1]);
    const golden = goals[0] ? goals[0][0].split('|')[0] : '';
    const aw = { champ, pos, golden, mine: [] };
    if (champ === S.club) { S.tot.leagues++; aw.mine.push('League Cup winner'); S.fame = clamp(S.fame + 8, 0, 100); S.gal += 400; }
    if (golden === S.profile.name) { aw.mine.push('Golden Quaffle'); S.fame = clamp(S.fame + 5, 0, 100); }
    if (S.fans >= 70) aw.mine.push('Witch Weekly Fan Favourite');
    S.hist.push({ season: S.season, club: S.club, pos, lvl: S.lvl, goals: goals.find(g => g[0].startsWith(S.profile.name + '|'))?.[1] || 0, ovr: this.ovr() });
    if (S.contract) { S.contract.years--; if (S.contract.years <= 0) S.flags.offers = true; }
    S.pot = Math.min(97, S.pot + (S.season < 6 ? 2 : S.season > 9 ? -2 : 0));
    News.seasonEnd(aw);
    return aw;
  },
  offers() {
    const S = this.S, o = this.ovr(), f = S.fame, r = mulberry32(S.seed + S.season * 9 + 3);
    const pool = CLUB_IDS.filter(t => t !== S.club).sort(() => r() - 0.5);
    const n = 2 + (f > 40 ? 1 : 0) + (o > 72 ? 1 : 0);
    const list = [];
    for (const t of pool) {
      if (list.length >= n) break;
      const need = CONFIG.teams[t].str - 20 - f * 0.25;
      if (o + r() * 10 < need) continue;
      list.push({ club: t, years: 2 + Math.floor(r() * 3), wage: Math.round((40 + o * 2 + f * 3) * (CONFIG.teams[t].str / 75)), bonus: Math.round(10 + o * 0.6 + f * 0.4), pitch: Story.pitchLine(t) });
    }
    if (!list.length) list.push({ club: CLUB_IDS[3], years: 2, wage: 60, bonus: 12, pitch: Story.pitchLine(CLUB_IDS[3]) });
    if (S.club && S.contract) list.unshift({ club: S.club, years: 3, wage: Math.round(S.contract.wage * 1.15 + o), bonus: S.contract.bonus + 4, pitch: 'Stay. We are building this around you.', renew: true });
    return list;
  },
  sign(o) {
    const S = this.S, prev = S.club; S.club = o.club; S.contract = { years: o.years, wage: o.wage, bonus: o.bonus, since: S.season + 1 }; S.flags.offers = false;
    S.seasonStart = Object.assign({}, S.tot);
    if (prev !== o.club) News.transfer(prev, o.club);
    S.roster = null;
    this.save();
  },
  // ---------- Quidditch World Cup ----------
  startWorldCup() {
    const S = this.S;
    const called = this.ovr() >= 66 || S.fame >= 45;
    S.phase = 'wc'; S.ev = 0;
    if (!called) { S.cal = [{ t: 'scene', id: 'wcWatch', label: 'Quidditch World Cup', month: 'July' }]; News.wcSnub(); return; }
    const r = mulberry32(S.seed + S.season * 41);
    const field = NATION_IDS.filter(n => n !== S.nation).sort(() => r() - 0.5).slice(0, 3);
    S.wc = { group: [S.nation, ...field], t: {}, stage: 'group', ko: [] };
    for (const t of S.wc.group) S.wc.t[t] = { p: 0, w: 0, l: 0, pf: 0, pa: 0, pts: 0 };
    S.cal = [{ t: 'scene', id: 'wcCall', label: 'National call-up', month: 'June' }];
    field.forEach((opp, i) => S.cal.push({ t: 'match', comp: 'wc', stage: 'group', g: i, opp, home: true, label: `World Cup · Group match ${i + 1}`, month: 'July', weather: i === 2 ? 'night' : 'golden' }));
    S.cal.push({ t: 'wcKO', label: 'World Cup knockouts', month: 'July' });
    this.buildNationRoster();
  },
  buildNationRoster() {
    const S = this.S, r = mulberry32(S.nation * 71 + S.season);
    const roster = [];
    for (const [role, slot] of ROLES7) {
      if (role === (S.profile.pos === 'seeker' ? 'seeker' : 'chaser') && slot === 0) continue;
      const b = r() < 0.5 ? 'm' : 'f';
      const m = { id: 'n' + S.season + role + slot, name: makeName(Math.floor(r() * 1e9), b), body: b, look: QC.look(Math.floor(r() * 1e6), b), role, slot, chem: 45, team: S.nation };
      roster.push(m); S.mates[m.id] = m;
    }
    S.clubRoster = S.roster; S.roster = roster;
  },
  wcRecord(ev, res) {
    const S = this.S, W = S.wc; if (!W) return;
    if (ev.stage === 'group') this.record(W.t, S.nation, ev.opp, res.score[0], res.score[1]);
    else W.ko.push({ stage: ev.stage, opp: ev.opp, sa: res.score[0], sb: res.score[1], win: res.score[0] > res.score[1] });
  },
  simWCRound(ev) {
    const S = this.S, W = S.wc; if (!W || ev.stage !== 'group') return;
    const others = W.group.filter(t => t !== S.nation && t !== ev.opp);
    if (others.length === 2) { const [a, b] = others, m = this.simMatch(a, b); this.record(W.t, a, b, m.sa, m.sb); }
  },
  // after the group: top two go through to a quarter-final, semi and final
  wcKnockouts() {
    const S = this.S, W = S.wc, tab = this.sorted(W.t), place = tab.findIndex(x => x.id === S.nation);
    const cal = [];
    if (place > 1) { cal.push({ t: 'scene', id: 'wcOut', label: 'Out of the World Cup', month: 'July' }); News.wcOut(); }
    else {
      const pool = NATION_IDS.filter(n => !W.group.includes(n)).sort(() => Math.random() - 0.5);
      ['Quarter-final', 'Semi-final', 'Final'].forEach((st, i) => cal.push({ t: 'match', comp: 'wc', stage: st, opp: pool[i], home: true, label: `World Cup · ${st}`, month: 'July', weather: i === 2 ? 'night' : pick(['golden', 'night']), ko: true }));
    }
    S.cal.splice(S.ev + 1, 0, ...cal);
  },
  // ---------- training ----------
  canTrain() { return this.S.trainedAt !== this.S.ev + this.S.year * 100 + this.S.season * 1000; },
  train(attr, amount) {
    const S = this.S; S.trainedAt = S.ev + S.year * 100 + S.season * 1000;
    const xp = 40 + amount * 30;
    const ups = this.addXP(xp);
    let gain = 0; if (S.attrs[attr] < this.attrCap()) { gain = amount >= 3 ? 2 : 1; S.attrs[attr] = Math.min(this.attrCap(), S.attrs[attr] + gain); }
    this.save(); return { xp, ups, gain };
  },
  buyBroom(id) {
    const S = this.S, b = BROOMS[id]; if (!b || S.brooms.includes(id) || S.gal < b.cost) return false;
    S.gal -= b.cost; S.brooms.push(id); S.broom = id; this.save(); return true;
  },
  // ---------- press consequences ----------
  applyTone(tone, mult = 1, mateId) {
    const S = this.S, fx = TONE_FX[tone]; if (!fx) return {};
    const d = {};
    for (const k of ['fame', 'fans', 'trust']) { d[k] = fx[k] * mult; S[k] = clamp(S[k] + d[k], 0, 100); }
    d.chem = fx.chem * mult;
    for (const m of this.squad()) m.chem = clamp(m.chem + d.chem * (m.id === mateId ? 2.5 : 1), 0, 100);
    S.persona[fx.p] = (S.persona[fx.p] || 0) + 1;
    return d;
  },
  // ---------- inbox & news ----------
  mail(m) { const S = this.S; m.id = 'l' + Date.now() + Math.floor(Math.random() * 1000); m.read = false; m.when = this.when() || 'Summer'; S.inbox.unshift(m); },
  unread() { return this.S.inbox.filter(m => !m.read).length; },
  post(a) { const S = this.S; a.id = 'a' + Date.now() + Math.floor(Math.random() * 1000); a.when = this.when(); a.fresh = true; S.news.unshift(a); },
};
const TONE_FX = {
  gr: { fame: 1, fans: 1, trust: 2.5, chem: 0.5, p: 'gr' },
  tm: { fame: 0, fans: -0.8, trust: 1, chem: 2.5, p: 'tm' },
  sh: { fame: 2.8, fans: 2, trust: -1.5, chem: -1.8, p: 'sh' },
  fi: { fame: 2, fans: 2.8, trust: -2.5, chem: -0.8, p: 'fi' },
  de: { fame: -0.8, fans: -0.5, trust: 0, chem: 0, p: 'de' },
};

// teammate goals handed out in the locker room
const Goals = {
  make(m, kind) {
    const first = m.name.split(' ')[0];
    const G = {
      feed: { text: `Pass to ${first} three times`, n: 3, xp: 60, chem: 6 },
      assist: { text: `Set up a goal for ${first}`, n: 1, xp: 80, chem: 8 },
      score2: { text: 'Score two goals', n: 2, xp: 70, chem: 5 },
      clean: { text: 'Get through without a Bludger hit', n: 0, xp: 60, chem: 5 },
      steal: { text: 'Win the Quaffle back twice', n: 2, xp: 60, chem: 5 },
      snitch: { text: 'Catch the Snitch', n: 1, xp: 90, chem: 7 },
      finisher: { text: 'Land a finisher', n: 1, xp: 70, chem: 5 },
    }[kind];
    return Object.assign({ kind, mate: m.id }, G);
  },
  check(g, res) {
    const st = res.stats;
    switch (g.kind) {
      case 'feed': return (st.passTo[g.mate] || 0) >= g.n;
      case 'assist': return (st.assistTo[g.mate] || 0) >= g.n;
      case 'score2': return st.goals >= g.n;
      case 'clean': return st.hits === 0;
      case 'steal': return st.steals >= g.n;
      case 'snitch': return !!st.snitch;
      case 'finisher': return st.finishers >= 1;
    }
    return false;
  },
  progress(g, st) {
    switch (g.kind) {
      case 'feed': return `${Math.min(g.n, st.passTo[g.mate] || 0)}/${g.n}`;
      case 'assist': return `${Math.min(g.n, st.assistTo[g.mate] || 0)}/${g.n}`;
      case 'score2': return `${Math.min(g.n, st.goals)}/${g.n}`;
      case 'clean': return st.hits ? 'FAILED' : 'ON TRACK';
      case 'steal': return `${Math.min(g.n, st.steals)}/${g.n}`;
      case 'snitch': return st.snitch ? 'DONE' : '0/1';
      case 'finisher': return `${Math.min(1, st.finishers)}/1`;
    }
    return '';
  },
};
