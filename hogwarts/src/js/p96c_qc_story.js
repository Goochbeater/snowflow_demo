/* ==== p96c_qc_story.js ==== */
/* QUIDDITCH CAREER — the story (ported from Quidditch Skybound): the school-year calendars, the scenes of each year as
   data the in-castle director stages (p96e), the letters. */
// Scene scripts are data: { set, variant, cast, beats }. Beats run in order:
//   { title, sub }                     chapter card
//   { cam: { p, l, p2, l2, fov, dur } } camera move (runs while the next lines play)
//   { say: [who, text] }               subtitle line (tap to continue)
//   { anim: { who: clip } }            change clips
//   { walk: { who: [x, z], dur } }     walk to a spot
//   { choice: [{ t, tone, fx, reply }] } dialogue choice
//   { wait: s }, { fx: name }
const HOUSE_COMMON = ['Gryffindor Tower', 'the Slytherin dungeons', 'Ravenclaw Tower', 'the Hufflepuff cellars'];
const QC_HEADS = ['Professor Aldous Crane', 'Professor Cordelia Vane-Hart', 'Professor Ilsa Moorcroft', 'Professor Bertram Pike'];

const Story = {
  ctx() {
    const S = Career.S, P = S.profile, F = S.mates[S.friend] || { name: 'Rowan Pike' }, C = (S.capt && S.mates[S.capt]) || { name: 'Imogen Thorne' };
    const R = S.rival || { name: 'Cassius Vane', house: 1 };
    return {
      me: P.name, first: P.name.split(' ')[0], last: Career.surname(), house: teamName(P.house), houseShort: CONFIG.teams[P.house].short,
      friend: F.name, f1: F.name.split(' ')[0], capt: C.name, c1: C.name.split(' ')[0], rival: R.name, r1: R.name.split(' ')[0], rhouse: teamName(R.house),
      head: QC_HEADS[P.house], common: HOUSE_COMMON[P.house], they: Career.pr('they'), them: Career.pr('them'), their: Career.pr('their'),
      pos: P.pos === 'seeker' ? 'Seeker' : 'Chaser', club: S.club != null ? teamName(S.club) : '', nation: S.nation != null ? teamName(S.nation) : '',
    };
  },
  // ---------- calendars ----------
  year(n) {
    const S = Career.S, h = S.profile.house, opp = HOUSE_IDS.filter(x => x !== h);
    const order = [opp[(n) % 3], opp[(n + 1) % 3], opp[(n + 2) % 3]];
    const M = (i, month) => ({ t: 'match', comp: 'house', opp: order[i], home: true, label: `House Cup · Match ${i + 1} v ${teamName(order[i])}`, month });
    if (n === 1) return [
      { t: 'scene', id: 'arrival', label: 'The boats across the Black Lake', month: 'September' },
      { t: 'scene', id: 'sorting', label: 'The Sorting', month: 'September' },
      { t: 'drill', id: 'lesson', label: 'First flying lesson', month: 'September' },
      { t: 'scene', id: 'spotted', label: 'The captain is watching', month: 'September' },
      { t: 'scene', id: 'halloween', label: 'Halloween Feast', month: 'October' },
      { t: 'scene', id: 'christmas', label: 'Christmas at Hogwarts', month: 'December' },
      { t: 'scene', id: 'firstMatch', label: 'Watching from the stands', month: 'February' },
      { t: 'cup', label: 'Leaving Feast', month: 'June' },
    ];
    const Y = {
      2: [{ t: 'scene', id: 'feast', label: 'Start-of-term feast', month: 'September' }, { t: 'drill', id: 'trials', label: 'House Quidditch trials', month: 'September' }, { t: 'scene', id: 'halloween', label: 'Halloween Feast', month: 'October' }, M(0, 'November'), { t: 'scene', id: 'potions', label: 'Potions', month: 'December' }, { t: 'scene', id: 'christmas', label: 'Christmas at Hogwarts', month: 'December' }, M(1, 'February'), { t: 'scene', id: 'library', label: 'Revision in the library', month: 'April' }, M(2, 'May'), { t: 'cup', label: 'Leaving Feast · House Cup', month: 'June' }],
      3: [{ t: 'scene', id: 'feast', label: 'Start-of-term feast', month: 'September' }, M(0, 'October'), { t: 'scene', id: 'hogsmeade', label: 'First Hogsmeade weekend', month: 'November' }, { t: 'scene', id: 'charms', label: 'Charms', month: 'January' }, M(1, 'February'), M(2, 'April'), { t: 'cup', label: 'Leaving Feast · House Cup', month: 'June' }],
      4: [{ t: 'scene', id: 'feast', label: 'Start-of-term feast', month: 'September' }, M(0, 'November'), { t: 'scene', id: 'yuleAsk', label: 'Asking someone to the Ball', month: 'December' }, { t: 'scene', id: 'yule', label: 'The Yule Ball', month: 'December' }, M(1, 'February'), M(2, 'May'), { t: 'cup', label: 'Leaving Feast · House Cup', month: 'June' }],
      5: [{ t: 'scene', id: 'feast', label: 'Start-of-term feast', month: 'September' }, { t: 'scene', id: 'captaincy', label: 'The captain\'s armband', month: 'September' }, M(0, 'November'), { t: 'scene', id: 'owls', label: 'O.W.L. revision', month: 'January' }, M(1, 'February'), { t: 'scene', id: 'exams', label: 'O.W.L. exams', month: 'May' }, M(2, 'May'), { t: 'cup', label: 'Leaving Feast · House Cup', month: 'June' }],
      6: [{ t: 'scene', id: 'feast', label: 'Start-of-term feast', month: 'September' }, M(0, 'November'), { t: 'scene', id: 'slug', label: 'The Slug Club Christmas party', month: 'December' }, M(1, 'February'), { t: 'scene', id: 'hogsmeade2', label: 'Hogsmeade in the snow', month: 'February' }, M(2, 'April'), { t: 'cup', label: 'Leaving Feast · House Cup', month: 'June' }],
      7: [{ t: 'scene', id: 'feast', label: 'Final start-of-term feast', month: 'September' }, M(0, 'October'), { t: 'scene', id: 'newts', label: 'N.E.W.T. pressure', month: 'January' }, M(1, 'February'), { t: 'scene', id: 'scouts', label: 'Scouts in the stands', month: 'March' }, M(2, 'May'), { t: 'cup', label: 'Leaving Feast · House Cup', month: 'June' }, { t: 'scene', id: 'graduation', label: 'Graduation', month: 'June' }],
    };
    return Y[n];
  },
  // ---------- scene scripts ----------
  scene(id) {
    const c = this.ctx(), S = Career.S, F = 'friend', ME = 'me';
    const school = { outfit: 'school' }, coat = { outfit: 'coat' };
    const sc = {
      arrival: () => ({ set: 'lake', cast: [{ id: ME, at: 'boatMe', anim: 'sit', o: coat }, { id: F, at: 'boatF', anim: 'sitTalk', o: coat }], beats: [
        { title: 'Year One', sub: 'The first of September' },
        { cam: 'lakeWide' }, { wait: 2.5 },
        { cam: 'boats' },
        { say: [F, `First time on the lake? Me too. They say the giant squid only eats Slytherins.`] },
        { choice: [{ t: `"I'm ${c.first}. Hope it's not hungry tonight."`, fx: { chem: 3 }, tone: 'gr' }, { t: `"Squid or not, I'm here for the Quidditch."`, fx: { chem: 2, fame: 0 }, tone: 'sh', reply: [F, `Ha! First-years can't even bring a broom. But I like you already.`] }] },
        { say: [F, `${c.friend}. Everyone calls me ${c.f1}. Look, there it is...`] },
        { cam: 'castle' }, { wait: 3.5 },
      ] }),
      // (you go up in a first-year's plain black, the others still to be sorted watching beside the stool; your friend was sorted before you and is at the table)
      sorting: () => ({ set: 'hall', variant: 'sorting', cast: [{ id: ME, at: 'stool', anim: 'sit', o: { outfit: 'first' } }, { id: 'head', at: 'high', anim: 'idle', o: { outfit: 'staff' } }, { id: F, at: 'seatF', anim: 'sitTalk', o: school }].concat([1, 2, 3, 4, 5, 6].map((i) => ({ id: 'fy' + i, at: 'fy' + i, anim: 'idle', o: { outfit: 'first' } }))), beats: [
        { cam: 'hallDoor' }, { wait: 2.5 },
        { cam: 'stool' },
        { say: ['hat', `Hmm. Difficult. Very difficult. Plenty of nerve, a good mind, a little hunger to prove yourself...`] },
        { say: ['hat', `And a broom-shaped hole in your heart, I see. Well then, better be... ${c.house.toUpperCase()}!`] },
        { fx: 'cheer' }, { wait: 1.6 }, { swap: { [ME]: { at: 'seatMe', anim: 'sitTalk', o: school } } }, { cam: 'houseTable', snap: true },
        { say: [F, `${c.house}! Same as me! Budge up, everyone, we've got a flyer.`] },
        { say: ['head', `Welcome to ${c.house}. I am your Head of House. Your common room is in ${c.common}; your prefects will show you the way.`] },
      ] }),
      spotted: () => ({ set: 'world', weather: 'golden', cast: [{ id: ME, at: 'pitchMe', anim: 'idle', o: school }, { id: 'capt', at: 'pitchCapt', anim: 'talk', o: { outfit: 'kit' } }, { id: F, at: 'pitchF', anim: 'idle', o: school }], beats: [
        { cam: 'pitchLow' },
        { say: ['capt', `You. The one who flew rings round Madam Elsworth's class. Who taught you to turn like that?`] },
        { choice: [{ t: '"Nobody. It just felt right."', tone: 'de', fx: { trust: 2 } }, { t: '"Practice. Every summer, every day."', tone: 'gr', fx: { trust: 3 } }, { t: '"Put me on the team and I\'ll show you."', tone: 'sh', fx: { trust: -1, fame: 1 }, reply: ['capt', `First-years don't play. But next September? Trials. Don't be late.`] }] },
        { say: ['capt', `${c.capt}. ${c.house} captain. Next year we need a ${c.pos}. Come to trials and prove it.`] },
        { say: [F, `Did the captain just... talk to you? You're going to be unbearable.`] },
      ] }),
      feast: () => ({ set: 'hall', variant: 'feast', cast: [{ id: ME, at: 'seatMe', anim: 'sitTalk', o: school }, { id: F, at: 'seatF', anim: 'sitTalk', o: school }, { id: 'head', at: 'high', anim: 'idle', o: { outfit: 'staff' } }], beats: [
        { title: `Year ${S.year === 7 ? 'Seven' : ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][S.year]}`, sub: 'Start-of-term feast' },
        { cam: 'hallWide' }, { wait: 2.2 }, { cam: 'tableClose' }, { wait: 1.8 },
        { say: [F, S.year === 2 ? `Trials are on Saturday. ${c.c1} says there's one ${c.pos} spot. One.` : S.year === 7 ? `Last year. Last feast. Do you think they'll miss us?` : `Another year. ${c.r1} has been bragging about ${CONFIG.teams[S.rival ? S.rival.house : 1].name}'s new brooms all summer.`] },
        { choice: S.year === 7 ? [{ t: '"They\'ll have to. We\'re winning the Cup on the way out."', tone: 'sh', fx: { chem: 2 } }, { t: '"I\'ll miss this. All of it."', tone: 'gr', fx: { chem: 3 } }] : [{ t: '"Brooms don\'t catch the Snitch. Flyers do."', tone: 'fi', fx: { chem: 2 } }, { t: '"Good for them. We\'ll talk on the pitch."', tone: 'gr', fx: { chem: 2, trust: 1 } }, { t: '"Pass the treacle tart and stop worrying."', tone: 'de', fx: { chem: 1 } }] },
        { say: ['head', `Welcome, welcome! A reminder that the Forbidden Forest is forbidden. Quidditch trials will be held on the second weekend. Tuck in!`] },
      ] }),
      halloween: () => ({ set: 'hall', variant: 'halloween', cast: [{ id: ME, at: 'seatMe', anim: 'sitTalk', o: school }, { id: F, at: 'seatF', anim: 'sitTalk', o: school }], beats: [
        { cam: 'hallWide' }, { wait: 2 }, { cam: 'pumpkins' },
        { say: [F, `Live bats, again. One of them nicked my pumpkin pasty.`] },
        { say: [F, S.year < 2 ? `Next year, you'll be out there in November with the whole school watching. Ready?` : `November's match is three weeks away. ${c.c1} wants extra training in the rain. In the RAIN.`] },
        { choice: [{ t: '"Rain\'s good. The other lot will hate it more."', tone: 'tm', fx: { chem: 3 } }, { t: '"I could fly this one with my eyes shut."', tone: 'sh', fx: { chem: -1, fame: 1 } }] },
      ] }),
      christmas: () => ({ set: 'hall', variant: 'christmas', cast: [{ id: ME, at: 'seatMe', anim: 'sitTalk', o: school }, { id: F, at: 'seatF', anim: 'sitTalk', o: school }], beats: [
        { cam: 'hallWide' }, { wait: 2.5 }, { cam: 'trees' }, { wait: 1.5 }, { cam: 'tableClose' }, { wait: 1.6 },
        { say: [F, `You're staying for Christmas too? Brilliant. The castle's half empty. We can practise on the frozen pitch.`] },
        { say: [F, `Also, someone left a package with your name on it. It looks... broom-shaped?`] },
        { choice: [{ t: 'Open it now.', tone: 'gr', fx: { gal: 10 }, reply: [F, `New broom-servicing kit AND a tin of Fizzing Whizzbees. Somebody loves you.`] }, { t: 'Save it for Christmas morning.', tone: 'de', fx: { trust: 1 } }] },
      ] }),
      firstMatch: () => ({ set: 'world', weather: 'overcast', cast: [{ id: ME, at: 'standsMe', anim: 'idle', o: coat }, { id: F, at: 'standsF', anim: 'talk', o: coat }], beats: [
        { cam: 'standsView' },
        { say: [F, `Look at ${c.c1} go! That was a Porskoff Ploy. Textbook.`] },
        { say: [F, `Next year that's us out there. You on a broom, me feeding you the Quaffle.`] },
        { choice: [{ t: '"Deal. You pass, I score."', tone: 'tm', fx: { chem: 4 } }, { t: '"I\'ll take the Snitch, if it\'s all the same."', tone: 'sh', fx: { chem: 1 } }] },
      ] }),
      potions: () => ({ set: 'potions', cast: [{ id: ME, at: 'deskMe', anim: 'spell', o: school }, { id: F, at: 'deskF', anim: 'spell', o: school }, { id: 'prof', at: 'prof', anim: 'talk', o: { outfit: 'staff' } }, { id: 'rival', at: 'deskR', anim: 'spell', o: school }], beats: [
        { cam: 'potionsWide' }, { wait: 1.8 }, { cam: 'cauldron' },
        { say: ['prof', `A Swelling Solution should be the colour of a ripe plum. Some of yours look like week-old porridge.`] },
        { say: ['rival', `Shame they don't give House points for flying, ${c.last}. You'd need them.`] },
        { choice: [{ t: 'Ignore it. Stir clockwise, three times.', tone: 'gr', fx: { trust: 3 }, reply: ['prof', `Perfect colour. Five points to ${c.house}.`] }, { t: `"See you on the pitch, ${c.r1}."`, tone: 'fi', fx: { fame: 1, rivalry: 8 }, reply: ['rival', `Looking forward to it.`] }, { t: 'Flick a beetle eye into their cauldron.', tone: 'sh', fx: { trust: -4, fame: 2, rivalry: 12 }, reply: ['prof', `${c.last}! Detention. And five points from ${c.house}.`] }] },
      ] }),
      library: () => ({ set: 'common', variant: 'study', cast: [{ id: ME, at: 'chairL', anim: 'sitTalk', o: school }, { id: F, at: 'chairR', anim: 'sit', o: school }], beats: [
        { cam: 'fire' },
        { say: [F, `I can't do it. Twelve uses of dragon's blood. I can name four, and one of them is "Quidditch drink".`] },
        { choice: [{ t: 'Help them revise all evening.', tone: 'tm', fx: { chem: 6, trust: 1 } }, { t: 'Sneak out for a night flight instead.', tone: 'sh', fx: { attr: ['hnd', 1], trust: -2 } }, { t: 'Go to bed early before the match.', tone: 'gr', fx: { attr: ['sta', 1] } }] },
      ] }),
      hogsmeade: () => ({ set: 'hogsmeade', cast: [{ id: ME, at: 'streetMe', anim: 'idle', o: coat }, { id: F, at: 'streetF', anim: 'talk', o: coat }], beats: [
        { title: 'Hogsmeade', sub: 'The only all-wizarding village in Britain' },
        { cam: 'streetWide' }, { wait: 2.8 }, { cam: 'streetClose' },
        { say: [F, `Three Broomsticks or Honeydukes? Choose wisely. This decision will define our friendship.`] },
        { choice: [{ t: 'Three Broomsticks. Butterbeer for two.', tone: 'tm', fx: { chem: 4, gal: -2 } }, { t: 'Honeydukes. Chocolate Frogs, obviously.', tone: 'gr', fx: { chem: 3, gal: -2 }, reply: [F, `If you get a famous Quidditch card, we're trading.`] }, { t: 'Quality Quidditch Supplies.', tone: 'sh', fx: { chem: 1, attr: ['sht', 1] }, reply: [F, `Of course you did.`] }] },
        { say: [F, `Hey, isn't that a ${CONFIG.teams[CLUB_IDS[8]].name} poster? One day that's going to be you on the wall.`] },
      ] }),
      hogsmeade2: () => ({ set: 'hogsmeade', variant: 'snow', cast: [{ id: ME, at: 'streetMe', anim: 'idle', o: coat }, { id: F, at: 'streetF', anim: 'talk', o: coat }, { id: 'rival', at: 'streetR', anim: 'idle', o: coat }], beats: [
        { cam: 'streetWide' }, { wait: 2.2 }, { cam: 'streetClose' },
        { say: ['rival', `Well, well. I hear the scouts are only coming to watch ${c.rhouse}.`] },
        { choice: [{ t: '"Then they\'ll get to watch me beat you."', tone: 'fi', fx: { fame: 2, rivalry: 10 } }, { t: '"Good luck. Genuinely."', tone: 'gr', fx: { trust: 2 }, reply: ['rival', `...You're a strange one, ${c.last}.`] }, { t: 'Throw a snowball.', tone: 'sh', fx: { chem: 3, rivalry: 6 }, reply: [F, `DIRECT HIT! Run!`] }] },
      ] }),
      charms: () => ({ set: 'potions', variant: 'charms', cast: [{ id: ME, at: 'deskMe', anim: 'spell', o: school }, { id: F, at: 'deskF', anim: 'spell', o: school }, { id: 'prof', at: 'prof', anim: 'cast', o: { outfit: 'staff' } }], beats: [
        { cam: 'potionsWide' },
        { say: ['prof', `Swish and flick. The Summoning Charm rewards focus. Think of it like a Seeker's eye.`] },
        { choice: [{ t: 'Accio Quaffle!', tone: 'sh', fx: { attr: ['pas', 1] }, reply: [F, `That's NOT the Quaffle, that's Professor Moorcroft's teapot!`] }, { t: 'Concentrate. Perfectly.', tone: 'gr', fx: { attr: ['sek', 1], trust: 2 } }] },
      ] }),
      yuleAsk: () => ({ set: 'common', cast: [{ id: ME, at: 'chairL', anim: 'sitTalk', o: school }, { id: F, at: 'chairR', anim: 'sitTalk', o: school }], beats: [
        { cam: 'fire' },
        { say: [F, `The Yule Ball's on Christmas night. Have you asked anyone yet? Everyone's asking everyone.`] },
        { choice: [{ t: `Ask ${c.f1} to go as friends.`, tone: 'tm', fx: { chem: 8, partner: 'friend' }, reply: [F, `Really? Yes! I mean, obviously yes. Dress robes, ${c.first}. Proper ones.`] }, { t: `Ask ${c.c1}, the captain.`, tone: 'sh', fx: { trust: 4, partner: 'capt' }, reply: [F, `Bold. Very bold. Good luck.`] }, { t: 'Go on your own.', tone: 'de', fx: { partner: 'none' } }] },
      ] }),
      yule: () => ({ set: 'hall', variant: 'yule', cast: [{ id: ME, at: 'danceMe', anim: 'dance', o: { outfit: 'formal' } }, { id: S.flags.partner === 'capt' ? 'capt' : F, at: 'danceP', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd1', at: 'dance1', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd2', at: 'dance2', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd3', at: 'dance3', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd4', at: 'dance4', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd5', at: 'dance5', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd6', at: 'dance6', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd7', at: 'dance7', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd8', at: 'dance8', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd9', at: 'dance9', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd10', at: 'dance10', anim: 'dance', o: { outfit: 'formal' } }], beats: [
        { title: 'The Yule Ball', sub: 'Christmas night' },
        { cam: 'yuleWide' }, { wait: 3 }, { cam: 'danceOrbit' },
        { say: [S.flags.partner === 'capt' ? 'capt' : F, `Okay. You can actually dance. Why didn't you tell anyone?`] },
        { choice: [{ t: '"Footwork. Same as flying."', tone: 'gr', fx: { chem: 3 } }, { t: '"Watch this spin."', tone: 'sh', fx: { fame: 2 } }] },
        { cam: 'yuleWide' }, { wait: 2 },
      ] }),
      captaincy: () => ({ set: 'common', cast: [{ id: ME, at: 'chairL', anim: 'sitTalk', o: school }, { id: 'head', at: 'standF', anim: 'talk', o: { outfit: 'staff' } }], beats: [
        { cam: 'fire' },
        { say: ['head', S.trust >= 55 ? `${c.last}. The team needs a captain, and the team has told me it wants you. The armband is yours, if you'll take it.` : `${c.last}. I've chosen a new captain this year. Not you, I'm afraid. Show me more steadiness and we'll talk again.`] },
        ...(S.trust >= 55 ? [{ choice: [{ t: 'Accept. "I won\'t let them down."', tone: 'tm', fx: { captain: true, chem: 4 } }, { t: 'Accept. "We\'re winning the Cup."', tone: 'sh', fx: { captain: true, fame: 3 } }] }] : [{ choice: [{ t: '"Understood. I\'ll earn it."', tone: 'gr', fx: { trust: 5 } }, { t: '"Your mistake, Professor."', tone: 'fi', fx: { trust: -5, fame: 1 } }] }]),
      ] }),
      owls: () => ({ set: 'common', variant: 'study', cast: [{ id: ME, at: 'chairL', anim: 'sit', o: school }, { id: F, at: 'chairR', anim: 'sitTalk', o: school }], beats: [
        { cam: 'fire' },
        { say: [F, `If I fail Astronomy my mum's going to send a Howler. A Howler, ${c.first}. In the Great Hall.`] },
        { choice: [{ t: 'Study together until midnight.', tone: 'tm', fx: { chem: 5, trust: 2 } }, { t: 'Train before dawn instead.', tone: 'sh', fx: { attr: ['spd', 1], trust: -1 } }] },
      ] }),
      exams: () => ({ set: 'hall', variant: 'exams', cast: [{ id: ME, at: 'examMe', anim: 'sit', o: school }, { id: F, at: 'examF', anim: 'sit', o: school }], beats: [
        { title: 'O.W.L.s', sub: 'Ordinary Wizarding Levels' },
        { cam: 'examWide' }, { wait: 3 },
        { say: ['examiner', `Quills down. Your examinations are over.`] },
        { say: [F, `I think I wrote "Quaffle" in my Charms essay. Twice.`] },
      ] }),
      slug: () => ({ set: 'hall', variant: 'gala', cast: [{ id: ME, at: 'danceMe', anim: 'talk', o: { outfit: 'formal' } }, { id: 'prof', at: 'danceP', anim: 'talk', o: { outfit: 'staff' } }, { id: 'd1', at: 'dance1', anim: 'talk', o: { outfit: 'formal' } }, { id: 'd2', at: 'dance2', anim: 'idle', o: { outfit: 'formal' } }], beats: [
        { cam: 'yuleWide' }, { wait: 2 }, { cam: 'danceOrbit' },
        { say: ['prof', `Ah, our young flyer! I knew Gwenog Jones when she was your age, you know. A word in the right ear can do wonders...`] },
        { choice: [{ t: '"I\'d love an introduction."', tone: 'gr', fx: { fame: 3, trust: 1 } }, { t: '"I\'d rather they saw me fly."', tone: 'fi', fx: { fame: 1 } }] },
      ] }),
      newts: () => ({ set: 'common', variant: 'study', cast: [{ id: ME, at: 'chairL', anim: 'sitTalk', o: school }, { id: F, at: 'chairR', anim: 'sitTalk', o: school }], beats: [
        { cam: 'fire' },
        { say: [F, `So. After school. Have you thought about it? Really thought?`] },
        { choice: [{ t: '"Professional Quidditch. Nothing else."', tone: 'sh', fx: { fame: 1 } }, { t: '"Wherever we end up, we stay friends."', tone: 'tm', fx: { chem: 6 } }] },
      ] }),
      scouts: () => ({ set: 'world', weather: 'golden', cast: [{ id: ME, at: 'pitchMe', anim: 'idle', o: { outfit: 'kit' } }, { id: 'scout', at: 'pitchCapt', anim: 'talk', o: { outfit: 'coat' } }], beats: [
        { cam: 'pitchLow' },
        { say: ['scout', `Name's Halloran. I scout for the League. I've watched three of your matches now.`] },
        { say: ['scout', `Keep this up and there'll be trial letters in June. More than one, if you're lucky.`] },
        { choice: [{ t: '"I\'ll make sure of it."', tone: 'gr', fx: { fame: 3 } }, { t: '"Tell your club to get in line."', tone: 'sh', fx: { fame: 4, trust: -2 } }] },
      ] }),
      graduation: () => ({ set: 'world', weather: 'golden', cast: [{ id: ME, at: 'pitchMe', anim: 'idle', o: school }, { id: F, at: 'pitchF', anim: 'talk', o: school }], beats: [
        { title: 'Graduation', sub: 'Seven years, done' },
        { cam: 'pitchLow' },
        { say: [F, `Seven years. I can't believe we have to give the brooms back.`] },
        { say: [F, `Whatever team you sign for, I'm buying a scarf. Front row. Loudest one there.`] },
        { choice: [{ t: 'Hug them.', tone: 'tm', fx: { chem: 5 } }, { t: '"Bring a big scarf."', tone: 'gr', fx: { chem: 4 } }] },
      ] }),
      signing: () => ({ set: 'common', variant: 'office', cast: [{ id: ME, at: 'chairL', anim: 'sitTalk', o: { outfit: 'track' } }, { id: 'coach', at: 'standF', anim: 'talk', o: { outfit: 'track' } }], beats: [
        { title: c.club, sub: 'Signing day' },
        { cam: 'fire' },
        { say: ['coach', `Welcome to ${c.club}. You'll start on the bench, but if you train like you played at school, you won't stay there long.`] },
        { say: ['coach', `The press will want you. The fans already do. Be careful what you give either of them.`] },
        { choice: [{ t: '"I\'m here to win, Coach."', tone: 'gr', fx: { trust: 4 } }, { t: '"Point me at the pitch."', tone: 'sh', fx: { fame: 2 } }] },
      ] }),
      preseason: () => ({ set: 'locker', variant: 'pro', cast: [{ id: ME, at: 'lockMe', anim: 'idle', o: { outfit: 'track' } }, { id: 'coach', at: 'board', anim: 'talk', o: { outfit: 'track' } }], beats: [
        { title: `Season ${S.season}`, sub: c.club },
        { cam: 'lockerWide' },
        { say: ['coach', S.season > 1 ? `New season. Last year we finished ${ordinal(S.hist.length ? S.hist[S.hist.length - 1].pos : 7)}. That's not good enough.` : `First pre-season. Let's see what you've got.`] },
        { choice: [{ t: '"Top of the table. Nothing less."', tone: 'sh', fx: { fame: 1 } }, { t: '"One match at a time."', tone: 'gr', fx: { trust: 3 } }] },
      ] }),
      gala: () => ({ set: 'hall', variant: 'gala', cast: [{ id: ME, at: 'danceMe', anim: 'talk', o: { outfit: 'formal' } }, { id: 'rep', at: 'danceP', anim: 'talk', o: { outfit: 'formal' } }, { id: 'd1', at: 'dance1', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd2', at: 'dance2', anim: 'dance', o: { outfit: 'formal' } }, { id: 'd3', at: 'dance3', anim: 'idle', o: { outfit: 'formal' } }], beats: [
        { title: 'The Witch Weekly Gala', sub: 'Ministry of Magic ballroom' },
        { cam: 'yuleWide' }, { wait: 2.2 }, { cam: 'danceOrbit' },
        { say: ['rep', `${c.first} ${c.last}! Cressida Fang, Witch Weekly. Our readers voted you number ${Math.max(1, 20 - Math.round(S.fame / 5))} in the Most Charming Smile poll. Any comment?`] },
        { choice: [{ t: '"I\'m flattered. Thank the readers."', tone: 'gr', fx: { fame: 2, fans: 2 } }, { t: '"Only number ' + Math.max(1, 20 - Math.round(S.fame / 5)) + '? Recount."', tone: 'sh', fx: { fame: 4, trust: -1 } }, { t: '"No comment."', tone: 'de', fx: {} }] },
      ] }),
      wcCall: () => ({ set: 'locker', variant: 'nation', cast: [{ id: ME, at: 'lockMe', anim: 'idle', o: { outfit: 'kit', team: S.nation } }, { id: 'coach', at: 'board', anim: 'talk', o: { outfit: 'track', team: S.nation } }], beats: [
        { title: 'Quidditch World Cup', sub: c.nation },
        { cam: 'lockerWide' },
        { say: ['coach', `The whole country is watching. Seven of you, one Snitch, and the Cup. Let's go.`] },
      ] }),
      wcWin: () => ({ set: 'locker', variant: 'nation', cast: [{ id: ME, at: 'lockMe', anim: 'dance', o: { outfit: 'kit', team: S.nation } }, { id: 'coach', at: 'board', anim: 'dance', o: { outfit: 'track', team: S.nation } }], beats: [
        { title: 'World Champions', sub: c.nation },
        { cam: 'lockerWide' },
        { say: ['coach', `Champions of the world! Every one of you. Every single one!`] },
        { choice: [{ t: '"For everyone back home."', tone: 'gr', fx: { fans: 5 } }, { t: '"Told you we would."', tone: 'sh', fx: { fame: 3 } }] },
      ] }),
      wcWatch: () => ({ set: 'common', variant: 'office', cast: [{ id: ME, at: 'chairL', anim: 'sit', o: { outfit: 'casual' } }], beats: [
        { cam: 'fire' },
        { say: ['narr', `The World Cup call-up never came. You watch the final on the wireless, and you promise yourself: next time.`] },
      ] }),
      wcOut: () => ({ set: 'locker', variant: 'nation', cast: [{ id: ME, at: 'lockMe', anim: 'sit', o: { outfit: 'kit', team: S.nation } }], beats: [
        { cam: 'lockerWide' },
        { say: ['narr', `Out in the group stage. The dressing room is silent. Four years until the next one.`] },
      ] }),
    };
    return sc[id] ? sc[id]() : null;
  },
  names(who) {
    const S = Career.S, c = this.ctx();
    return { me: c.me, friend: c.friend, capt: c.capt, rival: c.rival, head: c.head, prof: 'Professor Ilsa Moorcroft', hat: 'The Sorting Hat', coach: 'Coach Brennan Hale', scout: 'Declan Halloran', rep: 'Cressida Fang', examiner: 'The Examiner', narr: '' }[who] || who;
  },
  // ---------- letters ----------
  scoutLetter() {
    const club = pick(CLUB_IDS);
    Career.mail({ from: `${teamName(club)} scouting department`, subj: 'We have been watching', body: `Dear ${Career.S.profile.name},\n\nOur scouts have followed your progress at Hogwarts with great interest. Should you continue in this form, ${teamName(club)} would be delighted to offer you a professional trial after your N.E.W.T.s.\n\nWith best wishes,\nDeclan Halloran, Chief Scout`, tag: 'scout' });
  },
  sponsorLetter(broom) {
    const b = BROOMS[broom];
    Career.mail({ from: `${b.name.split(' ')[0]} Broom Company`, subj: `Endorsement offer: ${b.name}`, body: `Dear ${Career.S.profile.name},\n\nYour flying has caught our eye. We would like you to ride the ${b.name}. One will be delivered to your locker, free of charge, in exchange for your continued excellence (and the occasional photograph).`, tag: 'sponsor', broom });
  },
  fanLetter() {
    const lines = ['I made a banner with your name on it. My owl ate half of it.', 'My little brother does your finisher in the garden on his toy broom. He crashed into the hedge again.', 'Please sign the enclosed Chocolate Frog card. It is a blank card, but one day it won\'t be.', 'You are the reason I tried out for my house team.'];
    Career.mail({ from: makeName(Math.floor(Math.random() * 1e9), Math.random() < 0.5 ? 'm' : 'f'), subj: 'A fan writes', body: `Dear ${Career.first()},\n\n${pick(lines)}\n\nYour biggest fan`, tag: 'fan' });
  },
  pitchLine(t) {
    const T = CONFIG.teams[t];
    return pick([`${T.name} need a ${Career.S.profile.pos === 'seeker' ? 'Seeker' : 'Chaser'} with nerve.`, `Join a club with history: ${T.city || T.home}.`, `First-team football... er, Quidditch. From day one.`, `Our fans travel. Our flyers win.`]);
  },
};
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
