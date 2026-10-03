// ===================== PRESS: reporters, questions, Quick-Quotes Quill, newspapers, moving photographs =====================
const REPORTERS = [
  { id: 'plume', name: 'Penny Plume', outlet: 'Wizarding Wireless Network', diff: 'easy', mult: 0.7, look: { body: 'f', skin: 1, hair: 1, hairCol: '#d6b16e' }, c1: '#2a3a5a', blurb: 'Friendly. Easy questions, small swings.' },
  { id: 'marsh', name: 'Gideon Marsh', outlet: 'The Daily Prophet', diff: 'mid', mult: 1, look: { body: 'm', skin: 2, hair: 0, hairCol: '#3a2416', beard: true }, c1: '#3a3226', blurb: 'Quidditch correspondent. Asks about the game.' },
  { id: 'fang', name: 'Cressida Fang', outlet: 'Witch Weekly', diff: 'hard', mult: 1.6, look: { body: 'f', skin: 0, hair: 2, hairCol: '#8a2d12' }, c1: '#3a1a40', blurb: 'Gossip column. Big swings, and her Quick-Quotes Quill writes what it likes.', quill: true },
];
const SCHOOL_REPORTERS = [
  { id: 'jory', name: 'Jory Bagshot', outlet: 'Hogwarts match commentary', diff: 'easy', mult: 0.6, look: { body: 'm', skin: 3, hair: 3, hairCol: '#15100c' }, c1: '#1a1a20', blurb: 'The student commentator. Excitable.' },
  { id: 'marsh', name: 'Gideon Marsh', outlet: 'Daily Prophet youth desk', diff: 'mid', mult: 0.9, look: REPORTERS[1].look, c1: '#3a3226', blurb: 'Writes up school Quidditch for the Prophet.' },
  { id: 'fang', name: 'Cressida Fang', outlet: 'Witch Weekly', diff: 'hard', mult: 1.3, look: REPORTERS[2].look, c1: '#3a1a40', blurb: 'Sniffing for a scandal, even at school.', quill: true },
];
const TONE_LABEL = { gr: 'GRACIOUS', tm: 'TEAM-FIRST', sh: 'SHOWBOAT', fi: 'FIERY', de: 'DEFLECT' };
const TONE_ICON = { gr: '✦', tm: '⛨', sh: '★', fi: '🔥', de: '…' };

// question bank: when(c) decides if it fits; q(c) the question; a(c) answers by tone
const QUESTIONS = [
  { id: 'bigwin', d: ['easy', 'mid'], when: c => c.win && c.margin >= 60, q: c => `A ${c.score} demolition of ${c.opp}. Was it as easy as it looked?`, a: c => ({ gr: `${c.opp} made us earn every point. The scoreline flatters us.`, tm: `That's seven people flying for each other. I'm proud of all of them.`, sh: `Easier, honestly. I could have played with my eyes shut.`, fi: `We wanted to send a message. Message sent.` }) },
  { id: 'closewin', d: ['easy', 'mid', 'hard'], when: c => c.win && c.margin < 60, q: c => `That one went right down to the wire against ${c.opp}. How are your nerves?`, a: c => ({ gr: `Shredded, if I'm honest. Credit to ${c.opp}. That was a proper contest.`, tm: `${c.mateFirst} kept us in it when it got tight. That's a team win.`, sh: `Nerves? I live for moments like that.`, de: `We won. That's all that matters to me.` }) },
  { id: 'loss', d: ['easy', 'mid', 'hard'], when: c => c.lose, q: c => `${c.opp} beat you ${c.score}. What went wrong out there?`, a: c => ({ gr: `${c.opp} were better today. We'll study it and come back stronger.`, tm: `That's on all of us, not one person. We'll fix it together.`, sh: `I did my job. Some of us need to look in the mirror.`, fi: `The officiating was a joke and everybody saw it.` }) },
  { id: 'snitch', d: ['easy', 'mid'], when: c => c.mySnitch, q: c => `You caught the Snitch to finish it. Talk us through that moment.`, a: c => ({ gr: `I just tried to keep my eyes on it. The team gave me the space.`, tm: `The Beaters cleared the way. That catch belongs to all of us.`, sh: `Did you see that dive? Put it in the Prophet. Front page.`, de: `It was there, so I caught it.` }) },
  { id: 'finisher', d: ['easy', 'mid', 'hard'], when: c => c.finishers > 0, q: c => `That ${c.finisherName || 'finisher'}... people will be talking about it all week. Where did it come from?`, a: c => ({ gr: `Hours of practice. I'm glad it came off.`, tm: `${c.mateFirst} set it up perfectly. I just finished it.`, sh: `I've got plenty more where that came from.`, de: `Instinct. I don't plan these things.` }) },
  { id: 'hattrick', d: ['easy', 'mid'], when: c => c.goals >= 3, q: c => `${c.goals} goals today. Is that the best you've ever flown?`, a: c => ({ gr: `It felt good, but the result is what counts.`, tm: `Every one of those came from a pass. I just put them away.`, sh: `Best so far. Give it time.`, de: `I don't keep count.` }) },
  { id: 'quiet', d: ['mid', 'hard'], when: c => c.chaser && c.goals === 0 && !c.mySnitch, q: c => `No goals today. Some people are saying the pressure is getting to you.`, a: c => ({ gr: `Some days the Quaffle doesn't go in. I'll keep working.`, tm: `My job was to make space for the others, and I did that.`, sh: `Some people should come and try it themselves.`, fi: `Who's saying that? Tell them to say it to my face.` }) },
  { id: 'mate', d: ['mid', 'hard'], when: c => !!c.mateFirst, q: c => `${c.mateName} had a ${c.mateGood ? 'fine game' : 'difficult afternoon'}. Your thoughts?`, mate: true, a: c => c.mateGood ? ({ gr: `${c.mateFirst} was excellent. Deserves every bit of praise.`, tm: `${c.mateFirst} is the heartbeat of this team.`, sh: `${c.mateFirst} did alright. Mostly they passed to me.`, de: `Ask ${c.mateFirst}.` }) : ({ gr: `Everyone has off days. ${c.mateFirst} will bounce back.`, tm: `We win together and lose together. I've got ${c.mateFirst}'s back.`, sh: `I can't fly for two people.`, fi: `Some of us need to raise our level, and they know who they are.` }) },
  { id: 'rival', d: ['hard', 'mid'], when: c => c.rivalHere, q: c => `${c.rival} said before the match you were "overrated". Response?`, a: c => ({ gr: `${c.rival} is a fine flyer. I'll let my Quidditch answer.`, tm: `I don't care what one person thinks. I care what my team thinks.`, sh: `Overrated? Check the scoreboard.`, fi: `${c.rival} can say what ${c.rivalThey} likes. I'll see ${c.rivalThem} in the air.` }) },
  { id: 'table', d: ['mid'], when: c => c.pos > 0, q: c => `You're ${c.posStr} in the table. ${c.pos <= 2 ? 'Is the title yours to lose?' : 'Is the season slipping away?'}`, a: c => ({ gr: `There's a long way to go. Next match is all that matters.`, tm: `If we stay together, the table will look after itself.`, sh: c.pos <= 2 ? `Get the trophy engraved now.` : `With me in the side? We'll be fine.`, de: `I don't look at the table.` }) },
  { id: 'transfer', d: ['hard'], when: c => c.pro && c.fame >= 25, q: c => `There are rumours ${c.rumourClub} want you. Are you happy at ${c.club}?`, a: c => ({ gr: `I'm very happy here. My focus is on ${c.club}.`, tm: `This team is my family. I'm not going anywhere.`, sh: `Every club in the League wants me. Can you blame them?`, de: `No comment on rumours.` }) },
  { id: 'smile', d: ['hard'], when: c => c.fame >= 15, q: c => `Our readers want to know: who are you taking to the Witch Weekly gala?`, a: c => ({ gr: `That's private, I'm afraid. But thank your readers for asking.`, tm: `The whole team, if they'll let me.`, sh: `Whoever wins the raffle.`, de: `Next question.` }) },
  { id: 'school', d: ['easy', 'mid'], when: c => c.school, q: c => `How do you balance House Quidditch with your studies?`, a: c => ({ gr: `Carefully. ${c.head} keeps a close eye on me.`, tm: `The team helps each other revise. Honestly, they carry me.`, sh: `Studies? I'm going to be a professional.`, de: `Badly.` }) },
  { id: 'crowd', d: ['easy'], when: c => true, q: c => `The crowd were incredible today. A message for the supporters?`, a: c => ({ gr: `Thank you. Every single one of you.`, tm: `You're our eighth player. We fly for you.`, sh: `Keep singing my name. I like it.`, de: `Thanks for coming.` }) },
  { id: 'broom', d: ['easy', 'mid'], when: c => true, q: c => `You're flying a ${c.broom}. Is the broom making the difference?`, a: c => ({ gr: `It's a lovely broom, but the work is the difference.`, tm: `The broom doesn't matter. The team does.`, sh: `The broom is fine. I'm the difference.`, de: `It flies. That's all I need.` }) },
  { id: 'nextopp', d: ['mid', 'hard'], when: c => !!c.nextOpp, q: c => `Next up is ${c.nextOpp}. Worried?`, a: c => ({ gr: `We respect them. We'll be ready.`, tm: `If we fly like we did today, together, we'll be fine.`, sh: `Worried? They should be.`, fi: `Bring them on.` }) },
];
const PRE_QUESTIONS = [
  { id: 'pre_opp', d: ['easy', 'mid', 'hard'], q: c => `${c.opp} today. What's the plan?`, a: c => ({ gr: `Respect them, stick to our plan, and fly our game.`, tm: `The plan is the team. Seven people, one job.`, sh: `The plan is simple: give me the Quaffle.`, fi: `Hit them early and keep hitting them.` }) },
  { id: 'pre_rival', d: ['hard', 'mid'], when: c => c.rivalHere, q: c => `${c.rival} is flying for ${c.opp}. Is this personal?`, a: c => ({ gr: `It's a match like any other.`, tm: `It's about the team, not me.`, sh: `I'm going to embarrass ${c.rivalThem}.`, fi: `It's been personal for years.` }) },
  { id: 'pre_form', d: ['mid'], q: c => `${c.formStr} How are you feeling?`, a: c => ({ gr: `Good. Prepared. Calm.`, tm: `Confident in this group.`, sh: `Never better. Watch this.`, de: `Fine.` }) },
  { id: 'pre_fans', d: ['easy'], q: c => `Huge crowd building outside. Can you feel it?`, a: c => ({ gr: `It gives me goosebumps every time.`, tm: `We'll play for every one of them.`, sh: `They're here to see me, let's be honest.`, de: `I try to block it out.` }) },
];

const Press = {
  reporters() { return Career.S.phase === 'school' ? SCHOOL_REPORTERS : REPORTERS; },
  // context for templates
  ctx(kind, ev) {
    const S = Career.S, L = S.last || {}, c = Story.ctx();
    const mates = Career.squad().filter(m => !m.gone);
    const mt = mates.length ? mates[Math.floor(Math.random() * mates.length)] : null;
    const tab = S.phase === 'pro' && S.league ? Career.sorted(S.league.t) : S.phase === 'school' && S.cup ? Career.sorted(S.cup.t) : [];
    const pos = tab.findIndex(t => t.id === Career.myTeam()) + 1;
    const opp = kind === 'pre' ? ev.opp : L.opp;
    const rivalHere = S.phase === 'school' && S.rival && opp === S.rival.house;
    const next = S.cal.slice(S.ev + 1).find(e => e.t === 'match');
    const rp = PRON[S.rival && S.rival.body === 'f' ? 'she' : 'he'];
    const form = (S.hist.length || S.tot.apps) ? (S.last && S.last.win === 0 ? `You won last time out.` : S.last ? `You lost last time out.` : ``) : `Your first match.`;
    return Object.assign(c, {
      win: L.win === 0, lose: L.win === 1, score: L.score ? `${L.score[0]}-${L.score[1]}` : '', margin: L.score ? Math.abs(L.score[0] - L.score[1]) : 0,
      opp: opp != null ? teamName(opp) : '', goals: L.goals || 0, mySnitch: !!L.snitch, finishers: L.finishers || 0, finisherName: L.finisherName,
      chaser: S.profile.pos !== 'seeker', mateName: mt ? mt.name : '', mateFirst: mt ? mt.name.split(' ')[0] : '', mateId: mt ? mt.id : null, mateGood: mt ? (L.mates && L.mates[mt.id]) || Math.random() < 0.5 : false,
      rivalHere, rivalThey: rp.they, rivalThem: rp.them, pos, posStr: ordinal(pos), pro: S.phase !== 'school', fame: S.fame,
      rumourClub: teamName(pick(CLUB_IDS.filter(t => t !== S.club))), broom: BROOMS[S.broom].name, nextOpp: next ? teamName(next.opp) : '', school: S.phase === 'school', formStr: form,
    });
  },
  pickQuestions(kind, rep, c) {
    const bank = kind === 'pre' ? PRE_QUESTIONS : QUESTIONS;
    const ok = bank.filter(q => q.d.includes(rep.diff) && (!q.when || q.when(c)));
    const fallback = bank.filter(q => !q.when || q.when(c));
    const pool = (ok.length >= 2 ? ok : fallback).slice().sort(() => Math.random() - 0.5);
    return pool.slice(0, kind === 'pre' ? 1 : 2);
  },
  // the Quill: twist a quote into a headline
  twist(tone, c, text) {
    const n = `${c.first.toUpperCase()} ${c.last.toUpperCase()}`;
    const T = {
      gr: [`IS ${n} TOO GOOD TO BE TRUE?`, `"I'd be nothing without them," weeps ${c.first}. Sources say ${c.mateFirst || 'a teammate'} is "privately furious".`],
      tm: [`${n}: "I CARRY THIS TEAM ON MY BACK"`, `Behind the "team-first" smile, ${c.first} told this reporter ${c.they} "can't keep covering for" ${c.mateFirst || 'the others'}.`],
      sh: [`${n} ROW: "THE REST OF THEM ARE PASSENGERS"`, `In an explosive interview, ${c.first} appeared to suggest ${c.their} teammates are "along for the ride".`],
      fi: [`${n} DECLARES WAR`, `${c.first}, eyes blazing, vowed revenge on ${c.opp || 'the League'} in remarks this reporter can only describe as "chilling".`],
      de: [`${n}'S ICY SILENCE SPARKS RIFT RUMOURS`, `What is ${c.first} hiding? A curt "no comment" has the whole changing room whispering.`],
    }[tone];
    return { headline: T[0], body: T[1] };
  },
  // apply the effects of one answer; returns a record for the newspaper
  answer(rep, q, tone, c) {
    const d = Career.applyTone(tone, rep.mult, q.mate ? c.mateId : null);
    const text = q.a(c)[tone];
    const p = rep.quill ? { sh: 0.5, fi: 0.45, gr: 0.18, tm: 0.25, de: 0.1 }[tone] : rep.diff === 'mid' ? 0.05 : 0;
    let tw = null;
    if (Math.random() < p) {
      tw = this.twist(tone, c, text);
      const S = Career.S; S.fame = clamp(S.fame + 2, 0, 100); S.trust = clamp(S.trust - 2, 0, 100);
      const m = c.mateId && Career.mate(c.mateId); if (m) { m.chem = clamp(m.chem - 5, 0, 100); m.grudge = true; }
    }
    return { rep: rep.id, outlet: rep.outlet, by: rep.name, q: q.q(c), text, tone, d, twist: tw };
  },
};

// ===================== NEWS: the Prophet, the Quibbler, Witch Weekly =====================
const News = {
  matchReport(L, res) {
    const S = Career.S, c = Story.ctx(), me = Career.myTeam(), opp = teamName(L.opp), my = teamName(me);
    const sc = `${L.score[0]}-${L.score[1]}`;
    let head;
    if (L.snitch && L.win === 0) head = pick([`${c.last.toUpperCase()} SNATCHES IT!`, `GOLDEN HANDS: ${c.last.toUpperCase()} CATCHES SNITCH`, `${c.first.toUpperCase()} SEIZES THE SNITCH AS ${my.toUpperCase()} WIN`]);
    else if (L.win === 0 && L.goals >= 3) head = pick([`${c.last.toUpperCase()} HAT-TRICK SINKS ${opp.toUpperCase()}`, `${L.goals} FOR ${c.first.toUpperCase()} IN ${sc} ROUT`]);
    else if (L.win === 0) head = pick([`${my.toUpperCase()} SEE OFF ${opp.toUpperCase()}`, `${sc}: ${my.toUpperCase()} TAKE THE SPOILS`, `VICTORY FOR ${my.toUpperCase()}`]);
    else if (L.win === 1) head = pick([`${opp.toUpperCase()} STUN ${my.toUpperCase()}`, `MISERY FOR ${my.toUpperCase()} IN ${sc} DEFEAT`, `${opp.toUpperCase()} TOO STRONG`]);
    else head = `HONOURS EVEN AT ${sc}`;
    const lines = [];
    lines.push(`${my} ${L.win === 0 ? 'beat' : L.win === 1 ? 'lost to' : 'drew with'} ${opp} ${sc}${L.comp === 'house' ? ' in the House Cup' : L.comp === 'wc' ? ' at the Quidditch World Cup' : ''}.`);
    if (L.goals) lines.push(`${c.me} scored ${L.goals === 1 ? 'once' : L.goals + ' times'}${L.assists ? ` and set up ${L.assists} more` : ''}.`);
    if (L.finishers) lines.push(`The highlight was ${c.first}'s ${L.finisherName || 'spectacular finish'}, which brought the crowd to its feet.`);
    if (L.snitch) lines.push(`${c.first} caught the Golden Snitch to end the match.`);
    else if (res.snitchSide === 1) lines.push(`${opp}'s Seeker caught the Snitch.`);
    lines.push(`Match rating: ${L.rating.toFixed(1)}${L.potm ? ' (Player of the Match)' : ''}.`);
    const art = { paper: S.phase === 'school' ? 'school' : 'prophet', kind: 'match', headline: head, sub: `${L.label || ''}`, body: lines.join(' '), photo: Photo.still(), crest: me, quotes: [] };
    Career.post(art);
    this.pending = art;
    // occasional Quibbler nonsense
    if (Math.random() < 0.28) this.quibbler();
  },
  // quotes from the press conference are added to the match report
  addQuotes(records) {
    const a = this.pending; if (!a) return;
    for (const r of records) {
      if (r.twist) Career.post({ paper: r.outlet === 'Witch Weekly' ? 'witch' : 'prophet', kind: 'twist', headline: r.twist.headline, sub: `By ${r.by} · ${r.outlet}`, body: r.twist.body + ` Our reporter's Quick-Quotes Quill captured every word.`, crest: Career.myTeam(), twisted: true });
      else a.quotes.push({ by: r.by, text: r.text });
    }
    this.pending = null;
    Career.save();
  },
  roundup(r) {
    const S = Career.S, L = S.league; if (!L) return;
    const res = L.rounds[r].filter(f => f.done && f.h !== S.club && f.a !== S.club).map(f => `${teamName(f.h)} ${f.sh}-${f.sa} ${teamName(f.a)}`);
    const tab = Career.sorted(L.t), top = tab[0];
    Career.post({ paper: 'prophet', kind: 'roundup', headline: `AROUND THE LEAGUE: MATCHDAY ${r + 1}`, sub: `${teamName(top.id)} top the table on ${top.pts} points`, body: res.join(' · '), crest: top.id });
  },
  seasonEnd(aw) {
    const S = Career.S;
    Career.post({ paper: 'prophet', kind: 'season', headline: `${teamName(aw.champ).toUpperCase()} ARE CHAMPIONS`, sub: `Season ${S.season} · League Cup`, body: `${teamName(aw.champ)} lift the League Cup. ${teamName(S.club)} finished ${ordinal(aw.pos)}. The Golden Quaffle for top scorer goes to ${aw.golden}.${aw.mine.length ? ' ' + Story.ctx().me + ' collected: ' + aw.mine.join(', ') + '.' : ''}`, crest: aw.champ });
    this.witchPoll();
  },
  transfer(from, to) {
    const c = Story.ctx();
    Career.post({ paper: 'prophet', kind: 'transfer', headline: from == null ? `${c.last.toUpperCase()} SIGNS FOR ${teamName(to).toUpperCase()}` : `${c.last.toUpperCase()} COMPLETES ${teamName(to).toUpperCase()} MOVE`, sub: 'Transfer news', body: from == null ? `The Hogwarts graduate has signed professional terms with ${teamName(to)}.` : `${c.me} leaves ${teamName(from)} for ${teamName(to)} in a deal the Prophet understands to be worth a small fortune in Galleons.`, crest: to });
  },
  wcSnub() { const c = Story.ctx(); Career.post({ paper: 'prophet', kind: 'wc', headline: `NO WORLD CUP PLACE FOR ${c.last.toUpperCase()}`, sub: `${c.nation} squad announced`, body: `${c.me} misses out on the ${c.nation} squad for the Quidditch World Cup.`, crest: Career.S.nation }); },
  wcOut() { const c = Story.ctx(); Career.post({ paper: 'prophet', kind: 'wc', headline: `${c.nation.toUpperCase()} CRASH OUT`, sub: 'Quidditch World Cup', body: `Heartbreak in the group stage.`, crest: Career.S.nation }); },
  quibbler() {
    const c = Story.ctx();
    const R = [`NARGLES FOUND IN ${pick(CLUB_IDS.map(teamName)).toUpperCase()} BROOM SHED`, `IS THE GOLDEN SNITCH SECRETLY SENTIENT? AN INVESTIGATION`, `${c.last.toUpperCase()} SEEN TALKING TO A CRUMPLE-HORNED SNORKACK`, `MINISTRY HIDING TRUTH ABOUT "INVISIBLE" FIFTH QUAFFLE`, `BLIBBERING HUMDINGERS BLAMED FOR ${pick(CLUB_IDS.map(teamName)).toUpperCase()} LOSING RUN`];
    Career.post({ paper: 'quibbler', kind: 'quibbler', headline: pick(R), sub: 'The Quibbler · Exclusive', body: 'Our correspondent spent three nights in a hedge to bring you this story. The truth is out there, and it is wearing radish earrings.', crest: null });
  },
  witchPoll() {
    const S = Career.S, rank = Math.max(1, 21 - Math.round(S.fame / 5)), c = Story.ctx();
    Career.post({ paper: 'witch', kind: 'poll', headline: `MOST CHARMING SMILE: ${c.first.toUpperCase()} AT NUMBER ${rank}`, sub: 'Witch Weekly reader poll', body: `${c.me} ${rank <= 3 ? 'storms into the top three' : rank <= 10 ? 'makes the top ten' : 'sneaks onto the list'} in this year's poll. "We adore ${c.them}," writes one reader from Ottery St Catchpole.`, crest: null });
  },
};

// ===================== MOVING PHOTOGRAPHS: frames grabbed from the live canvas =====================
const Photo = {
  frames: [], rec: 0, at: 0, w: 320, h: 180, interval: 1 / 12, acc: 0, lastStill: null,
  trigger(delay = 0, kind = 'goal') { if (!Game.career) return; this.rec = 1.4; this.at = delay; this.frames = []; this.kind = kind; },
  // called right after each render so the WebGL drawing buffer is still valid
  tick(rdt) {
    if (this.rec <= 0) return;
    if (this.at > 0) { this.at -= rdt; return; }
    this.acc += rdt; if (this.acc < this.interval) return; this.acc = 0;
    this.rec -= this.interval;
    try {
      const src = Render.renderer.domElement, c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
      const g = c.getContext('2d'), sa = src.width / src.height, da = this.w / this.h;
      let sw = src.width, sh = src.height, sx = 0, sy = 0; if (sa > da) { sw = sh * da; sx = (src.width - sw) / 2; } else { sh = sw / da; sy = (src.height - sh) / 2; }
      g.drawImage(src, sx, sy, sw, sh, 0, 0, this.w, this.h);
      this.frames.push(c);
      if (this.frames.length === 6) this.lastStill = c.toDataURL('image/jpeg', 0.72);
    } catch (e) { this.rec = 0; }
  },
  still() { const s = this.lastStill; this.lastStill = null; return s; },
};
