// ===== 52-quirks: everybody in Moonwick has a secret — sweethearts, sneaks, sleepwalkers and small crimes =====
{
  const G = AF.G, P = AF.PLAN, W = AF.W;
  const Q = G.quirks = { matched: false, poem: false, caught: false, pieDay: -1, pilferDay: -1, tobT: 12, t: 0 };
  const sp = (name) => (G.spots[name] || [])[0]; G.talkHooks = G.talkHooks || [];
  AF.onBuild('quirk-spots', 432, () => {
    const add = (name, x, z, o = {}) => G.addSpot(name, x, W.groundY(x, z), z, Object.assign({ kind: 'stand', out: 1 }, o));
    add('piespot', G.pie.x + 0.2, G.pie.z + 1.3, { yaw: Math.PI }); add('innwindow', -17, 7.2, { yaw: Math.PI }); add('scarespot', G.scarecrow.x + 1.6, G.scarecrow.z + 0.4, { yaw: -Math.PI / 2 }); add('millunch', G.mill.x + 2.4, G.mill.z + 6.2, { yaw: -0.4 }); add('millunch', G.mill.x + 3.6, G.mill.z + 6.0, { yaw: 0.9 });
    add('sleepsq', -2.5, 12.5, { yaw: 0.8 }); add('stroll', 26, 72.5, { yaw: 1.2 }); add('stroll', 27.3, 71.6, { yaw: 1.2 }); add('doorstep', G.places.cotD.door[0] + 0.6, G.places.cotD.door[1], { yaw: 0 });
    // couples share a bed: a second pillow beside the first
    for (const pid of ['cotB', 'tailor']) { const L = G.spots['bed:' + pid]; if (L && L[0]) { const b = L[0], ox = Math.cos(b.yaw) * 0.42, oz = -Math.sin(b.yaw) * 0.42; G.addSpot('bed:' + pid, b.x + ox, b.y, b.z + oz, Object.assign({}, b, { x: b.x + ox, z: b.z + oz, user: null })); b.x -= ox * 0.4; b.z -= oz * 0.4; } }
    G.DEFS.find((d) => d.id === 'ivy').home = 'tailor';
    G.DEEDS.push({ id: 'match', kind: 'kind', name: 'Matchmaker', hint: 'A certain blacksmith writes poems he never sends…', done: false }, { id: 'caught', kind: 'mischief', name: 'Caught Red-Handed', hint: 'Somebody creeps about the market stalls at night. Shine a light on them.', done: false }, { id: 'chase', kind: 'mischief', name: 'Catch Me If You Can', hint: 'Get the children — or the Captain — to chase you.', done: false }, { id: 'sleepsq', kind: 'kind', name: 'Rude Awakening', hint: 'Somebody wanders the square in his nightshirt around two in the morning. Wake him gently.', done: false });
  });
  // schedule overrides
  G.quirkPlan = (n, h) => { const id = n.id, day = AF.time.day;
    if (id === 'gus' && h > 14.9 && h < 15.7 && Q.pieDay !== day) return { spot: sp('piespot'), pose: 'sneak', tag: 'pie' };
    if (id === 'percival' && (h > 22.3 || h < 0.2) && Q.pilferDay !== day) return { spot: G.spots['work:stall1'][0], pose: 'sneak', tag: 'pilfer' };
    if (id === 'hollis' && h > 20.3 && h < 21.3 && !Q.matched) return { spot: sp('innwindow'), pose: 'sigh', tag: 'sigh' };
    if (id === 'hollis' && Q.matched && h > 18 && h < 21.4) return { spot: G.spots.bar[1], tag: 'beau' };
    if (id === 'barnaby' && h > 1.6 && h < 3.1) return { spot: sp('sleepsq'), pose: 'stand', tag: 'sleepwalk' };
    if (id === 'moss' && h > 13.9 && h < 15) return { spot: G.spots.bench[0], pose: 'sleep', tag: 'nap' };
    if (id === 'granny' && (h > 23.4 || h < 0.7)) return { spot: sp('cauldron'), pose: 'work', tag: 'brew' };
    if (id === 'mabel' && h > 18.4 && h < 19.1) return { spot: sp('scarespot'), tag: 'gerald' };
    if ((id === 'elsbeth' || id === 'corwin') && h > 12.1 && h < 13.1) return { spot: G.spots.millunch[id === 'corwin' ? 0 : 1], tag: 'lunch' };
    if ((id === 'tansy' || id === 'ivy') && h > 18.2 && h < 19.6) return { spot: G.spots.stroll[id === 'tansy' ? 0 : 1], tag: 'stroll' };
    if (id === 'jory' && h > 7.4 && h < 8.1) return { spot: sp('doorstep'), tag: 'posy' };
    return null; };
  const at = (n, name) => n.state === 'idle' && n.spot && n.spot.name === name && !n.possessed && n.poseNow !== 'sleep';
  const bub = (n, t, s = 4) => G.ui && G.ui.bubble(n, t, s);
  const near = (n, r = 40) => Math.hypot(n.body.x - AF.camera.position.x, n.body.z - AF.camera.position.z) < r;
  AF.onTick('quirks', 305, (dt, t) => {
    if (!AF.ready || AF.mode !== 'play') return; Q.t -= dt; const N = G.npc, pl = G.player, day = AF.time.day, h = AF.time.hours;
    N.barnaby.sleepwalk = h > 1.6 && h < 3.2 && !N.barnaby.possessed && !Q.wokeDay;
    // kids chase the fairy
    for (const id of ['gus', 'wren', 'pippa']) { const n = N[id]; if (pl.host || n.possessed || n.follow > 0 || n.inPlace || n.poseNow === 'sleep' || Object.keys(n.fx).length) continue; n.chaseCd = (n.chaseCd || 0) - dt; if (n.chaseCd > 0) continue; const d = Math.hypot(pl.pos.x - n.body.x, pl.pos.z - n.body.z); if (d < 8 && pl.pos.y - n.body.y < 5) { n.follow = 11; n.followSp = 1.5; n.chaseCd = 40; bub(n, ['A FAIRY! Get it! GENTLY!', 'Wait! Come back! I only want to ask you nine things!', 'I saw it first! I saw it first!'][n.idx % 3], 3); n.emote = '!'; n.emoteT = 2; G.deed('chase'); } }
    if (Q.t > 0) return; Q.t = 0.5;
    // Gus and the pie
    if (at(N.gus, 'piespot') && Q.pieDay !== day) { Q.pieDay = day; if (G.pieCtl && G.pieCtl.has()) { G.pieCtl.take(); bub(N.gus, 'Shh. You saw NOTHING.', 4); N.gus.emote = '♪'; N.gus.emoteT = 4; const b = N.bram; if (near(N.gus)) AF.emit('sfx', 'pet'); if (!b.possessed && b.poseNow !== 'sleep') setTimeout(() => bub(b, 'GUS TUMBLE! That is the third pie this week!', 4), 1800); } else bub(N.gus, 'Aw. Somebody beat me to it.', 3); N.gus.think = 4; }
    // Percival, after hours
    if (at(N.percival, 'work:stall1') && Q.pilferDay !== day && (h > 22.3 || h < 0.3)) { if (!Q.pilT) { Q.pilT = t; bub(N.percival, 'Just… taking stock. Of someone else\'s stock.', 4); } if (t - Q.pilT > 14) { Q.pilferDay = day; Q.pilT = 0; N.percival.think = 0; } }
    // Hollis, sighing at a window
    if (at(N.hollis, 'innwindow') && Math.random() < 0.12) { bub(N.hollis, ['O hammer-heart, be still…', '"A nail holds fast what words cannot…" no. No.', '*sigh* She laughed at the bard\'s joke. I have no jokes.', 'Roses are red, iron is grey…'][(Math.random() * 4) | 0], 4); N.hollis.emote = '♥'; N.hollis.emoteT = 3; }
    if (Q.matched && at(N.hollis, 'bar') && Math.random() < 0.05) { N.hollis.emote = '♥'; N.hollis.emoteT = 3; N.odette.emote = '♥'; N.odette.emoteT = 3; }
    // couples
    for (const [a, b, name, la, lb] of [['corwin', 'elsbeth', 'millunch', 'Cheese and pickle. You remembered.', 'Thirty years, you old flour-sack. I always remember.'], ['tansy', 'ivy', 'stroll', 'The pond looks like spilled sky tonight.', 'You say that every evening. Say it again.']]) if (at(N[a], name) && at(N[b], name) && Math.random() < 0.07) { bub(N[a], la, 4); setTimeout(() => bub(N[b], lb, 4), 2600); N[a].emote = N[b].emote = '♥'; N[a].emoteT = N[b].emoteT = 5; }
    if (at(N.mabel, 'scarespot') && Math.random() < 0.1) bub(N.mabel, ['Evening, Gerald. Any crows?', 'Don\'t look at me like that, Gerald.', 'You\'re the only one who listens, Gerald.'][(Math.random() * 3) | 0], 4);
    if (at(N.jory, 'doorstep') && Q.posyDay !== day) { Q.posyDay = day; bub(N.jory, '(He leaves a posy on the bard\'s doorstep, knocks, and runs.)', 4); N.jory.emote = '♥'; N.jory.emoteT = 3; N.jory.think = 3; }
    if (at(N.granny, 'cauldron') && (h > 23.4 || h < 0.7) && near(N.granny, 60)) { const s = N.granny.spot; G.spark(s.x + 0.9, s.y + 1.2, s.z, { n: 5, rainbow: true, speed: 1.2, vy: 2, life: 1.4 }); if (Math.random() < 0.06) bub(N.granny, ['Eye of newt. Well. Eye of potato.', 'Nobody\'s business what I brew at midnight.', 'A drop of moonwell, a pinch of spite…'][(Math.random() * 3) | 0], 4); }
    // Tobias practising, badly
    Q.tobT -= 0.5; if (Q.tobT <= 0 && at(N.tobias, 'gatewatch') && near(N.tobias, 45)) { Q.tobT = 22 + Math.random() * 20; const n = N.tobias, r = Math.random(); G.spark(n.body.x, n.body.y + 1.5, n.body.z, { n: 30, rainbow: true, speed: 2.5 }); AF.emit('sfx', 'pop'); if (AF.fx) AF.fx.smoke(n.body.x, n.body.y + 1.4, n.body.z, { n: 4, size: 1, dark: 0.5, rise: 1.4, life: 1.6, a: 0.5 });
      if (r < 0.34) { G.npcFx(n, 'poly', 5, 'chicken'); } else if (r < 0.6) { G.npcFx(n, 'lev', 2.5); } else bub(n, ['Fiddlesticks.', 'That was meant to be soup.', 'Lumos! …Lumos? Oh, bother.'][(Math.random() * 3) | 0], 3); }
    else if (Q.tobT <= 0) Q.tobT = 8;
    if (N.barnaby.sleepwalk && near(N.barnaby, 30) && Math.random() < 0.06) bub(N.barnaby, ['…second class, tuppence… zzz…', '…return to sender… zzz…', '…mind the gap… zzz…'][(Math.random() * 3) | 0], 3);
  });
  AF.on('newday', () => { Q.wokeDay = false; });
  // shining a light on things
  AF.on('glimmer', (e) => { const N = G.npc, h = AF.time.hours; if (!e.t || e.t.kind !== 'npc') return; const n = e.t.obj;
    if (n.id === 'percival' && Q.pilT && !Q.caught) { Q.caught = true; Q.pilferDay = AF.time.day; Q.pilT = 0; G.deed('caught'); G.ui.dialog({ name: 'Percival Crumb', sub: 'caught in a sudden light', lines: ['AH! I — it\'s not — I was ALPHABETISING the turnips!', '…Fine. Fine! I\'ll put it all back. Don\'t tell the Captain. Here — for your silence. Three coins. Genuine. Probably.'], after: () => { G.bag.coin += 3; AF.emit('bag'); N.percival.think = 0; if (!N.moss.possessed) N.moss.friend = Math.min(5, N.moss.friend + 1); } }); }
    if (n.id === 'barnaby' && n.sleepwalk) { Q.wokeDay = true; n.sleepwalk = false; G.deed('sleepsq'); n.friend = Math.min(5, n.friend + 1); G.ui.dialog({ name: 'Barnaby Quill', sub: 'in his nightshirt', lines: ['Hm? Wha— oh. Oh dear. The square again. In my nightshirt again.', 'Thank you, little light. Last time I woke up in the duck pond. If anyone asks, I was delivering a very urgent letter. To myself.'], after: () => { n.think = 0; } }); } });
  // the poem
  G.talkHooks.push((n) => { if (Q.matched) return n.id === 'hollis' ? 'She read it twice. TWICE. I\'m making her a set of hinges shaped like hearts.' : n.id === 'odette' ? 'A poem about a nail. It was dreadful. I\'ve had it framed.' : null;
    if (n.id === 'hollis' && !Q.poem && (n.friend >= 1 || G.story.stage >= 3)) { setTimeout(() => G.ui.dialog({ name: 'Hollis Thorn', lines: ['…You won\'t tell? I wrote her a poem. Odette. It\'s about a nail. It\'s meant to be about more than a nail.', 'I can\'t give it her. My hands shake. They never shake. I\'ve held a red-hot horseshoe steadier.'], choices: [{ t: '💌 Carry the poem to Odette', fn: () => { Q.poem = true; AF.emit('toast', 'A folded poem, slightly sooty. Take it to Odette at the Drowsy Dragon.'); G.save(); } }] }), 400); return null; }
    if (n.id === 'odette' && Q.poem && !Q.matched) { setTimeout(() => G.ui.dialog({ name: 'Odette Finch', lines: ['What\'s this? A note? From— oh.', '"A nail holds fast what words cannot, / and so I hammer, and say naught…"', 'That great soft-hearted anvil. Three years he\'s been buying cider he doesn\'t drink. Tell him — no. I\'ll tell him myself. Tonight. He can have the good chair.'], after: () => { Q.matched = true; G.deed('match'); G.DEFS.find((d) => d.id === 'hollis').home = 'inn'; n.friend = Math.min(5, n.friend + 2); G.npc.hollis.friend = Math.min(5, G.npc.hollis.friend + 2); n.emote = '♥'; n.emoteT = 5; G.save(); } }), 400); return null; }
    return null; });
  // the Captain gives chase
  const alarm = (x, z) => { const m = G.npc.moss; if (!m || m.possessed || m.poseNow === 'sleep' || m.inPlace || m.follow > 0 || Object.keys(m.fx).length || G.player.host) return; if (Math.hypot(m.body.x - x, m.body.z - z) > 34) return; m.follow = 8; m.followSp = 2.1; G.ui.bubble(m, ['HALT! In the name of the — where\'d it go?', 'Mischief! I KNEW I smelled mischief!', 'You there! The glowing one! Stand still and be arrested!'][(Math.random() * 3) | 0], 4); m.emote = '!'; m.emoteT = 3; G.deed('chase'); };
  for (const ev of ['poly', 'sleepdust', 'soaked', 'tickle']) AF.on(ev, (n) => { if (n && n.body && n.id !== 'moss') alarm(n.body.x, n.body.z); });
  AF.on('lev', (o, k) => { if (k === 'npc' && o.id !== 'moss') alarm(o.body.x, o.body.z); }); AF.on('ember', (e) => alarm(e.x, e.z)); AF.on('gust', (e) => { if (e.hats) alarm(e.x, e.z); });
  AF.on('ready', () => G.savers.push({ key: 'quirk', get: () => ({ m: Q.matched, p: Q.poem, c: Q.caught }), set: (d) => { Q.matched = !!d.m; Q.poem = !!d.p; Q.caught = !!d.c; if (Q.matched) G.DEFS.find((q) => q.id === 'hollis').home = 'inn'; } }));
}
