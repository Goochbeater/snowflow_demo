/* ==== p78_hl_world.js ==== */
/* HOGWARTS — what there is to do: things to use (E), students and staff about the castle, the duelling dummies, the
   poachers' camp and the troll in the forest, Field Guide pages to find, a ring course for the broom, and the thread
   of quests that leads a new student through all of it. */
HL.CASTLIST = ['ashwinder', 'poacher', 'darkmage', 'troll', 'prof_a', 'prof_b'];
HL.uses = []; HL.npcs = []; HL.SECRETS = []; HL.rings = [];
HL.interact = function (p, r, label, fn, o) { const u = Object.assign({ p: p.isVector3 ? p : V3(p[0], p[1], p[2]), r, label, fn, off: false }, o || {}); HL.uses.push(u); return u; };
HL.nearInteract = function () { const a = PLAYER.a; if (!a || PLAYER.state === 'fly' && !HL.Q.on) { /* still allow from the saddle */ } let best = null, bd = 1e9; for (const u of HL.uses) { if (u.off || (u.when && !u.when())) continue; const d = Math.hypot(u.p.x - a.x, u.p.y - a.y, u.p.z - a.z); if (d < u.r && d < bd) { bd = d; best = u; } } if (HL.Q.on) return null; return best; };
HL.useInteract = function () { const u = HL.nearInteract(); if (u) { PLAYER.a.play('interact', { fade: 0.1 }); u.fn(u); } };
/* a bystander: stands, talks, folds arms or sits; hidden beyond 80 m */
HL.npc = function (tpl, x, z, yaw, o) {
  o = o || {}; if (HL.occ && !o.sit && o.y !== undefined && o.y > HL.Y0 - 3 && o.y < HL.Y0 + 34 && HL.inFoot(x, z, 0) && z > -40) { const sp = HL.occ.spot(HL.kAt(o.y + 0.5), x, z, 0.4, 4); if (sp) { x = sp[0]; z = sp[1]; } }
  const y = o.y !== undefined ? o.y : HL.dropY(x, z, 40);
  const a = new Actor(CHAR.T[tpl], { x, y, z, yaw, hp: 100, team: 'npc', moves: o.sit ? MOV.seated : MOV.student, r: 0.3, h: 1.8 }); a.base = o.base || 'idle'; a.tplN = tpl; a.noTarget = true; a.label = o.name; a.farD = o.far || 48; if (o.y !== undefined && HL.inFoot && HL.inFoot(x, z, 0) && z > -45 && Math.abs(x) < 170) { a.dyMax = 8.5; if (!o.name || o.sit) a.farD = Math.min(a.farD, 30); a.root.traverse((q) => { if (q.isMesh) q.castShadow = false; }); /* indoors the sun hardly reaches them, and every shadow-caster is drawn twice */ }
  if (o.sit) { a.grounded = true; a.sitY = y; } /* someone seated is not pushed out of their own chair by its collider */ if (!o.sit) a.physics(0); else { a.x = x; a.z = z; a.y = y; a.syncRoot && a.syncRoot(); } a.animate(0.016 + RNG()); a.pose3D(0.016); a.npcT = RNG() * 3; HL.npcs.push(a);
  if (o.talk) { a.talkL = o.talk; a.nameL = o.name || ''; } /* (kept on the actor: the voices are made from these, tools/eleven.py) */
  if (o.talk) HL.interact([x, y + 1, z], 2.6, o.talk[0], () => { a.say = (a.say || 0); if (o.name) { (HL.save.met = HL.save.met || {})[o.name] = 1; HL.store(); } (HL.ui.say || HL.ui.toast)(o.name || '', o.talk[1 + (a.say++ % (o.talk.length - 1))], 5, a, o.talk.length > 2 ? 'E — GO ON' : ''); if (o.onTalk) o.onTalk(a); });
  return a;
};
HL.worldUpdate = function (dt) {
  const P = PLAYER.a, cam = R.camera.position;
  /* a budget for people: only the nearest are drawn at all, and the farther one is the less often it is posed (those sitting still, least of all) */
  if (!(MG.frame % 15) || !HL._nearN) { const arr = []; for (const a of HL.npcs) { const d = Math.hypot(a.x - cam.x, a.z - cam.z); if (d < a.farD && !a.sceneOut && Math.abs(a.y - cam.y) < (a.dyMax || 40)) { a._d = d; arr.push(a); } } arr.sort((p, q) => p._d - q._d); HL._nearN = new Set(arr.slice(0, HL.NPCMAX || 9)); }
  let ix = 0; for (const a of HL.npcs) { ix++; const d = Math.hypot(a.x - cam.x, a.z - cam.z), vis = HL._nearN.has(a) && d < a.farD + 3 && Math.abs(a.y - cam.y) < (a.dyMax || 40); if (vis !== !a.hiddenN) { a.hiddenN = !vis; a.root.visible = vis; if (a.inst.cloth) a.inst.cloth.setVisible(vis); a._fresh = 2; } if (!vis) continue;
    /* eyes and brows are two draw calls nobody can see across a room */ { const fine = d < 7; if (fine !== (a._fine !== false)) { a._fine = fine; if (!a._small) { a._small = []; a.root.traverse((q) => { if (q.isMesh && /^(eyes|brows)$/.test(q.name || '')) a._small.push(q); }); } for (const q of a._small) q.visible = fine; } }
    /* nobody is drawn with the camera inside them */ { const cut = Math.hypot(a.x - cam.x, a.z - cam.z) < 0.7 && cam.y > a.y - 0.3 && cam.y < a.y + 2.2; if (cut !== !!a._cut) { a._cut = cut; a.root.visible = !cut; if (a.inst.cloth) a.inst.cloth.setVisible(!cut); } }
    a.npcT += dt; const still = a.sitY !== undefined && !a.ghost, every = a._fresh ? 1 : still ? (d < 7 ? 3 : 10) : d < 11 ? 1 : d < 20 ? 2 : d < 32 ? 4 : 8; if (a._fresh) a._fresh--; if ((MG.frame + ix) % every) continue; const dd = dt * every;
    if (a.sitY !== undefined) { a.y = a.sitY; a.grounded = true; a.speed = 0; } else if (P && d < 6 && a.turn !== false) a.lookYaw = clamp(wrapA(Math.atan2(P.x - a.x, P.z - a.z) - a.yaw), -1, 1) * 0.8; else a.lookYaw = damp(a.lookYaw || 0, 0, 3, dd);
    a.animate(dd); a.pose3D(dd); }
  // Field Guide pages and flying rings
  if (P) { for (const s of HL.SECRETS) { if (s.got) continue; s.m.rotation.y += dt * 1.6; s.m.position.y = s.p.y + Math.sin(MG.t * 2 + s.p.x) * 0.15; if (Math.hypot(s.p.x - P.x, s.p.y - (P.y + 1), s.p.z - P.z) < 2.3) { s.got = true; s.m.visible = false; HL.save.found[s.id] = 1; HL.save.points = (HL.save.points || 0) + 5; HL.store();
        FX.spark(s.p, null, 30, 6, [2.5, 2.6, 4], 0.7); FX.flashLight(s.p, [0.6, 0.8, 1.4], 20, 14, 0.4); const n = HL.SECRETS.filter((q) => q.got).length; HL.ui.toast('FIELD GUIDE PAGE', s.name + ' · ' + n + ' of ' + HL.SECRETS.length + ' found', 4); } }
    /* the rings about the castle: fly through ANY of them, in any order — house points, a chime that climbs with each one you string together, sparks and a kick of speed. A ring you have taken comes back after a while. (They only ever answered to the one 'next' ring of a fixed course, so they seemed to do nothing.) */
    HL.ringGap = (HL.ringGap || 0) + dt;
    const PA = PLAYER.a, flying = PA && PLAYER.state === 'fly' && !(HL.Q && HL.Q.on);   /* (the course shows only to a flyer near it: from the ground and the title it read as stray UI circles) */
    for (const r of HL.rings) { r.m.rotation.z += dt * 0.6; if (!r.got) { const near = flying && Math.hypot(r.p.x - PA.x, r.p.z - PA.z) < 340; r.m.visible = near; if (!near) continue; } if (r.got) { r.t -= dt; if (r.t <= 0) { r.got = false; r.m.visible = true; } continue; } const k = 1.25 + 0.45 * Math.sin(MG.t * 5 + r.p.x); r.m.material.color.setRGB(2.4 * k, 1.8 * k, 0.6 * k);
      if (PLAYER.state === 'fly' && Math.hypot(r.p.x - P.x, r.p.y - (P.y + 0.8), r.p.z - P.z) < 5.6) { r.got = true; r.t = 40; r.m.visible = false; const first = !r.once; r.once = true; if (first) HL.ringN = Math.min(HL.rings.length, (HL.ringN || 0) + 1);
        HL.ringStreak = HL.ringGap < 14 ? (HL.ringStreak || 0) + 1 : 1; HL.ringGap = 0; const pts = first ? 5 : 2; HL.save.points = (HL.save.points || 0) + pts; HL.store();
        if (HL.AU && HL.AU.ring) { HL.AU.ring(HL.ringStreak, 0); HL.AU.play('collect', { vol: 0.5, vary: false, gap: 0.05, rate: 1 + Math.min(HL.ringStreak, 8) * 0.04 }); if (HL.ringStreak >= 3) HL.AU.play('goal', { vol: 0.45, vary: false, gap: 0.05 }); }
        FX.spark(r.p, null, 60, 12, [4, 3, 1], 1.0); FX.ring(r.p, [3.2, 2.4, 0.8], 9, 0.6); FX.flashLight(r.p, [1, 0.85, 0.5], 40, 26, 0.35); R.kick(0.35); HL.fly.boost = 1; HL.fly.speed += 8; HL.ui.pop('RING  ' + (first ? HL.ringN + ' / ' + HL.rings.length : '×' + HL.ringStreak) + '   +' + pts);
        if (first && HL.ringN >= HL.rings.length && !HL.ringsDone) { HL.ringsDone = true; HL.save.points = (HL.save.points || 0) + 30; HL.store(); if (HL.AU && HL.AU.ring) setTimeout(() => HL.AU.play('ring_done', { vol: 1, vary: false }), 350); HL.ui.toast('FLYING CLASS PASSED', 'Every ring flown: +30 house points. The pitch is yours.', 5); if (HL.quest) HL.quest.done('rings'); } } } }
  if (HL.quest) HL.quest.update(dt);
};
/* a Field Guide page: a leaf of parchment with a few lines of ink and a wax seal, turning in the air in a small gold light (it was a blank white card in a white glare) */
HL.pageTex = function () { if (HL._pageTex) return HL._pageTex; const c = document.createElement('canvas'); c.width = 96; c.height = 128; const q = c.getContext('2d'); q.fillStyle = '#ecdcae'; q.fillRect(0, 0, 96, 128); const gr = q.createRadialGradient(48, 64, 20, 48, 64, 84); gr.addColorStop(0, 'rgba(120,80,30,0)'); gr.addColorStop(1, 'rgba(110,70,24,0.5)'); q.fillStyle = gr; q.fillRect(0, 0, 96, 128);
  q.strokeStyle = 'rgba(60,36,14,0.85)'; q.lineWidth = 2; q.font = 'bold 26px Georgia'; q.fillStyle = 'rgba(96,30,18,0.9)'; q.fillText('F', 12, 34); for (let i = 0; i < 7; i++) { q.beginPath(); const y = 28 + i * 12, x0 = i < 2 ? 36 : 12; q.moveTo(x0, y); for (let x = x0; x < 84 - (i === 6 ? 30 : 0); x += 6) q.lineTo(x + 6, y + ((x * 7 + i * 13) % 5) - 2); q.stroke(); } q.fillStyle = '#8e1c1c'; q.beginPath(); q.arc(72, 110, 9, 0, 6.3); q.fill(); q.fillStyle = '#c23a2a'; q.beginPath(); q.arc(70, 108, 4, 0, 6.3); q.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (HL._pageTex = t); };
HL.page = function (id, x, y, z, name) { const g = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), new THREE.MeshBasicMaterial({ map: HL.pageTex(), color: new THREE.Color(1.25, 1.2, 1.05), side: THREE.DoubleSide, toneMapped: false })); g.add(m); g.add(HL.sprite([1.0, 0.7, 0.28], 1.3, 1.5)); g.position.set(x, y, z); LEVEL.add(g);
  const s = { id, p: V3(x, y, z), m: g, name, got: !!HL.save.found[id] }; if (s.got) g.visible = false; HL.SECRETS.push(s); return s; };
HL.BUILD.push(async function content(L, G) {
  const Y = HL.Y0, M = HL.M(), C = HL.PITCH;
  HL.uses.length = 0; HL.npcs.length = 0; HL.SECRETS.length = 0; HL.rings.length = 0; HL.ringN = 0; HL.ringsDone = false; HL.ringStreak = 0; HL.foes.length = 0;
  // ---- the duelling corner of the quad
  HL.dummies = [[-62, 146, -HALF], [-62, 152, -HALF], [-62, 158, -HALF], [-97, 168, HALF]].map((d) => HL.dummy(L, d[0], d[1], d[2]));
  // ---- staff and students
  const st = (h, w, v) => { const n = HL.student(h, w, v); return n; }, hs = Object.keys(HL.HOUSES), names = [];
  /* four of every house: two witches, two wizards */
  for (let i = 0; i < 16; i++) names.push(st(hs[i % 4], ((i >> 2) + i) % 2 === 0, 1 + (((i >> 2) + (i % 4)) % 3))); HL.STUDENTS = names;
  await CAST.need(names);
  const S = (i, x, z, yaw, o) => HL.npc(names[i % names.length], x, z, yaw, o);
  S(0, 2, -30, -2.2, { base: 'talk' }); S(1, 0.6, -31.4, 0.9, { base: 'idle' }); S(2, -8, -12, 1.2, { base: 'calm' }); S(3, -9.4, -10.8, -1.6, { base: 'talk' }); S(4, -14, -34, 2.6, { base: 'calm' });
  S(5, -3, -56, 0.2, { base: 'idle' }); S(6, 3.4, -120, 2.9, { base: 'calm' }); S(7, 2.6, -121.2, 0.3, { base: 'talk' }); S(8, -80, 140, 1.9, { base: 'idle' }); S(9, -84, 172, 0.4, { base: 'talk' }); S(10, -85.5, 173, -2.4, { base: 'calm' });
  /* every place at table and desk is a record; its living character is only built when you come near (HL.seatWake) — until then the crowd's still figure sits there. One of each kind is built now, to be baked. */
  HL.SEATREC = []; HL.seatWake = (r) => { if (!r.a) { r.a = HL.npc(r.tpl, r.x, r.z, r.yaw, { sit: true, y: r.y, far: 10.5 }); r.a.seatRec = r; } return r.a; };
  if (HL.SEATS) { const seen = {}; HL.SEATS.forEach((q, i) => { const hi = q[3] % 4, nm = names[hi + 4 * ((i * 7 + 3) % 4)]; if (!CHAR.T[nm]) return; /* q is the seat: its centre, its height, and how far forward of the centre the sitter's root goes (the hips sit a third of a metre behind the root) */ const top = q[6] || 0.47, fwd = q[7] === undefined ? 0.33 : q[7]; const r = { tpl: nm, x: q[0] + Math.sin(q[2]) * fwd, z: q[1] + Math.cos(q[2]) * fwd, yaw: q[2], y: (q[5] || HL.Y0) + top - 0.47, sit: true, a: null, sx: q[0], sz: q[1], top: (q[5] || HL.Y0) + top }; HL.SEATREC.push(r); if (!seen[nm]) { seen[nm] = 1; HL.seatWake(r); } }); }
  if (HL.HEADSEAT) HL.npc('prof_a', HL.HEADSEAT[0], HL.HEADSEAT[2], HL.HEADSEAT[3], { sit: true, y: HL.HEADSEAT[1], far: 70, name: 'The Headmaster' });
  HL.npc('prof_b', -72, 166, HALF, { base: 'calm', name: 'Professor Hecat', talk: ['Talk to the Duelling Mistress', 'Wand up. Basic cast builds your Ancient Magic; the numbered spells do the real work.', 'A coloured ward only breaks to its own family: yellow to control, purple to force, red to fire.', 'Hold Protego a heartbeat before a curse lands and you will answer with a Stupefy.'] });
  HL.REFEREE = HL.npc('prof_a', HL.Q.REF[0], HL.Q.REF[2], HALF, { y: HL.Q.Y0, base: 'calm', name: 'Madam Kogawa', far: 120 });
  HL.interact([HL.Q.REF[0], HL.Q.Y0 + 1, HL.Q.REF[2]], 4.5, 'Play a Quidditch match', () => HL.Q.setup(true), { when: () => !HL.Q.on });
  // ---- the poachers' camp in the forest, the dark wizard's ring, the troll's hollow
  const cp = HL.CAMP, gy = (x, z) => HL.h(x, z);
  WORLD.campfire(L, cp.x, cp.z); for (const [dx, dz, k] of [[5, 3, 'crate'], [6.2, 2.2, 'barrel1'], [-5, 4, 'barrel2'], [-6, -3, 'crate'], [3, -6, 'chest']]) { const me = AST.mesh(k); me.position.set(cp.x + dx, gy(cp.x + dx, cp.z + dz), cp.z + dz); me.rotation.y = dx; LEVEL.add(me); PHY.cyl(cp.x + dx, cp.z + dz, 0.5, me.position.y, me.position.y + 1); }
  HL.CAMPFOES = [['poacher', cp.x + 3, cp.z + 2, { yaw: 2 }], ['ashwinder', cp.x - 3, cp.z + 3, { yaw: -2 }], ['poacher', cp.x - 2, cp.z - 4, { yaw: 0.5 }], ['pyro', cp.x + 6, cp.z - 5, { yaw: -1 }]];
  HL.MAGE = [cp.x + 70, cp.z + 90]; HL.MAGEFOES = [['darkmage', HL.MAGE[0], HL.MAGE[1], {}], ['ashwinder', HL.MAGE[0] + 6, HL.MAGE[1] - 3, {}], ['pyro', HL.MAGE[0] - 6, HL.MAGE[1] - 2, {}]];
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; WORLD.column(HL.MAGE[0] + Math.cos(a) * 11, HL.MAGE[1] + Math.sin(a) * 11, 4 + (i % 3), 0.55, { broken: i % 2 === 0 }); }
  HL.TROLL = [-70, 480]; HL.TROLLFOES = [['troll', HL.TROLL[0], HL.TROLL[1], {}]];
  // ---- Field Guide pages
  const topY = (x, z) => { const f = PHY.floorBelow(x, z, Y + 160); return (f ? f.y : Y + 60) + 2.5; };
  HL.page('astro', 95, topY(95, 68), 68, 'The Astronomy Tower'); HL.page('viaduct', 0, Y - 20, -150, 'Under the viaduct'); HL.page('hallroof', -79, topY(-79, 46), 46, 'The Great Hall roof'); HL.page('fountain', -79, Y + 5.6, 155.5, 'The fountain');
  HL.page('lake', 250, 3, -180, 'The Black Lake'); HL.page('pitch', C.x, C.y + 46, C.z, 'High over the pitch'); HL.page('hut', HL.HUT.x + 4, gy(HL.HUT.x, HL.HUT.z) + 5.5, HL.HUT.z, 'The gamekeeper’s hut'); HL.page('clock', -9, topY(-9, 10), 10, 'The clock tower');
  HL.page('stair', -33, topY(-33, 98) + 6, 98, 'Above the Headmaster\u2019s tower'); HL.page('ghend', -79, Y + 12, 18, 'The Great Hall window'); HL.page('camp', cp.x, gy(cp.x, cp.z) + 9, cp.z + 14, 'The poachers’ camp'); HL.page('headland', -30, Y + 3, -340, 'The headland');
  // ---- flying class: a course of rings from the north lawn round the castle to the pitch
  const ring = (x, y, z, yaw) => { const m = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.3, 12, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.8, 0.6), toneMapped: false })); { const halo = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.85, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.36, 0.1), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.add(halo); }   /* (a ring with a glow round it, not a thin line)  */ m.position.set(x, y, z); m.rotation.y = yaw; LEVEL.add(m); HL.rings.push({ m, p: V3(x, y, z), got: false }); };
  { const cx0 = -1.5, cz0 = 96, N = 10; for (let q = 0; q < N; q++) { const ang = -Math.PI / 2 + 0.36 + q * Math.PI * 2 / N, x = cx0 + Math.cos(ang) * 228, z = cz0 + Math.sin(ang) * 228; ring(x, Math.max(HL.h(x, z) + 16, 80 + 13 * Math.sin(q * 1.7)), z, Math.atan2(-Math.sin(ang), Math.cos(ang))); } ring(C.x, C.y + 24, C.z - 70, 0); }
});
/* a ring must hang in open air: nothing within nine metres of its centre in any direction, the ground well below it. One that is not is moved outward from the castle (and up) until it is. */
HL.ringFix = function () { const cx0 = -1.5, cz0 = 96; let moved = 0; const clear = (p) => { if (HL.h(p.x, p.z) > p.y - 9) return false; if (PHY.solidAt && PHY.solidAt(p.x, p.y, p.z)) return false; for (let q = 0; q < 10; q++) { const a = q * Math.PI / 4, dy = q === 8 ? 1 : q === 9 ? -1 : 0, dx = dy ? 0 : Math.cos(a), dz = dy ? 0 : Math.sin(a), h = PHY.ray(p.x, p.y, p.z, dx, dy, dz, 9.5, 'shot'); if (h) return false; } return true; };
  for (const r of HL.rings) { let n = 0; while (!clear(r.p) && n < 16) { const dx = r.p.x - cx0, dz = r.p.z - cz0, L2 = Math.hypot(dx, dz) || 1; r.p.x += dx / L2 * 10; r.p.z += dz / L2 * 10; r.p.y = Math.max(r.p.y, HL.h(r.p.x, r.p.z) + 14) + (n % 3 === 2 ? 5 : 0); n++; } if (n) { moved++; r.m.position.copy(r.p); } } HL.ringsMoved = moved; return moved; };
HL.START.push(function (L) { HL.ringFix();
  HL.spawnFoes(HL.CAMPFOES); HL.spawnFoes(HL.MAGEFOES); HL.spawnFoes(HL.TROLLFOES);
});
HL.onFoeDown = function (f) { HL.store(); if (HL.quest) HL.quest.foeDown(f); };
HL.onDummyHit = function (d, info) { if (HL.quest) HL.quest.dummy(d, info); };
/* ------------------------------------------------------------------ quests */
HL.quest = { i: 0, n: 0, flags: {} };
HL.QUESTS = [
  { id: 'arrive', t: 'WELCOME TO HOGWARTS', n: 'Cross the viaduct', o: 'Walk to the castle quad  (<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, hold <kbd>SHIFT</kbd> to run)', way: () => [0, HL.Y0 + 1.5, -30], done: (a) => a.z > -40 && Math.abs(a.x) < 30, pts: 5 },
  { id: 'duel', t: 'DEFENCE AGAINST THE DARK ARTS', n: 'Wand practice', o: () => `Strike the practice dummies  (<kbd>LMB</kbd> basic cast, <kbd>1</kbd>–<kbd>8</kbd> spells)  ${Math.min(8, HL.quest.n)} / 8`, way: () => [21, HL.Y0 + 2, -28], done: () => HL.quest.n >= 8, pts: 10 },
  { id: 'hall', t: 'THE SORTING FEAST', n: 'Visit the Great Hall', o: 'Go through the Entrance Hall and into the Great Hall', way: () => [46, HL.Y0 + 2, 36], done: (a) => a.x > 22 && a.x < 94 && a.z > 26 && a.z < 46 && a.y < HL.Y0 + 20 && a.y > HL.Y0 - 1, pts: 10 },
  { id: 'rings', t: 'FLYING CLASS', n: 'Take to the air', o: () => `Mount your broom (<kbd>B</kbd>) and fly the ring course  ${HL.ringN || 0} / ${HL.rings.length}`, way: () => { const a = PLAYER.a; let b = null, bd = 1e9; for (const r of HL.rings) { if (r.once) continue; const d = a ? Math.hypot(r.p.x - a.x, r.p.z - a.z) : 0; if (d < bd) { bd = d; b = r; } } return b ? [b.p.x, b.p.y, b.p.z] : null; }, done: () => (HL.ringN || 0) >= HL.rings.length, pts: 0 },
  { id: 'match', t: 'THE HOUSE CUP', n: 'Play Quidditch', o: 'Speak to Madam Kogawa at the pitch gate and win a match for your house', way: () => [HL.Q.REF[0], HL.Q.Y0 + 2, HL.Q.REF[2]], done: () => HL.quest.flags.played, pts: 20 },
  { id: 'camp', t: 'TROUBLE IN THE FOREST', n: 'The poachers’ camp', o: () => `Drive the poachers out of the Forbidden Forest  ${HL.quest.flags.camp || 0} / 4`, way: () => [HL.CAMP.x, HL.h(HL.CAMP.x, HL.CAMP.z) + 2, HL.CAMP.z], done: () => (HL.quest.flags.camp || 0) >= 4, pts: 30 },
  { id: 'mage', t: 'TROUBLE IN THE FOREST', n: 'The standing stones', o: 'Defeat the Dark Wizard — break his ward with a force spell (<kbd>2</kbd> Accio or <kbd>3</kbd> Depulso)', way: () => [HL.MAGE[0], HL.h(HL.MAGE[0], HL.MAGE[1]) + 2, HL.MAGE[1]], done: () => HL.quest.flags.mage, pts: 50 },
  { id: 'troll', t: 'TROUBLE IN THE FOREST', n: 'The troll’s hollow', o: 'Bring down the forest troll — keep moving, and use everything', way: () => [HL.TROLL[0], HL.h(HL.TROLL[0], HL.TROLL[1]) + 3, HL.TROLL[1]], done: () => HL.quest.flags.troll, pts: 80 },
  { id: 'free', t: 'HOGWARTS IS YOURS', n: 'Free roam', o: () => `Field Guide pages  ${HL.SECRETS.filter((s) => s.got).length} / ${HL.SECRETS.length} · play Quidditch again any time`, way: () => null, done: () => false, pts: 0 },
];
HL.quest.cur = () => HL.QUESTS[Math.min(HL.quest.i, HL.QUESTS.length - 1)];
HL.quest.show = function () { const q = HL.quest.cur(), o = typeof q.o === 'function' ? q.o() : q.o; if (HL.quest._o !== o + q.id) { HL.quest._o = o + q.id; HL.ui.setQuest(q.t, q.n, o); } };
HL.quest.start = function (cont) { const Q = HL.quest; Q.i = cont ? (HL.save.quest || 0) : 0; Q.n = 0; Q.flags = {}; if (Q.i > 5) Q.flags.camp = 4; if (Q.i > 6) Q.flags.mage = 1; if (Q.i > 7) Q.flags.troll = 1; Q._o = null; Q.show(); if (Q.i === 0 && (cont || MG.test || !(HL.STN && HL.STN.plat))) { /* (a new game says this itself, over the castle, once the station shot has cut to it) */ HL.ui.toast('HOGWARTS', 'A new term. The castle, the grounds and the sky above them are yours to roam.', 6); HL.ui.hint('Click the view to look around with the mouse · <kbd>ESC</kbd> for the controls', 8); } };
HL.quest.way = function () { if (HL.Q.on) return HL.Q.way(); const q = HL.quest.cur(); return q.way ? q.way() : null; };
HL.quest.done = function () { /* event hook: completion is polled in update */ };
HL.quest.update = function (dt) { const Q = HL.quest, a = PLAYER.a; if (!a || HL.Q.on) return; const q = Q.cur(); Q.show();
  if (q.done(a)) { if (q.pts) { HL.save.points = (HL.save.points || 0) + q.pts; } Q.i++; Q.n = 0; HL.save.quest = Q.i; HL.store(); const nx = Q.cur(); HL.ui.toast(q.n.toUpperCase() + ' — COMPLETE', (q.pts ? '+' + q.pts + ' house points · ' : '') + 'Next: ' + nx.n, 5); Q._o = null;
    if (nx.id === 'rings') HL.ui.hint('<kbd>B</kbd> mounts your broom anywhere outdoors — and indoors, if no professor is looking', 8); if (nx.id === 'hall') HL.ui.hint('The great doors stand open: straight across the quad, then left inside the Entrance Hall', 8); } };
HL.quest.dummy = function () { if (HL.quest.cur().id === 'duel') HL.quest.n++; };
HL.quest.foeDown = function (f) { const F = HL.quest.flags; if (HL.CAMPFOES.some((s) => Math.hypot(s[1] - f.home[0], s[2] - f.home[1]) < 1)) F.camp = (F.camp || 0) + 1; if (f.type === 'darkmage') F.mage = 1; if (f.type === 'troll') F.troll = 1; };
HL.onMatchEnd = function () { HL.quest.flags.played = true; };
HL.spawnPoint = function (cont) { return cont && HL.save.quest > 0 ? [0, HL.Y0, -30, 0] : LEVEL.cur.def.start; };
