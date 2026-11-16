// ===== 70-player: the fairy — flight, camera, borrowing a villager, the spellbook =====
{
  const G = AF.G, P = AF.PLAN, W = AF.W, V3 = THREE.Vector3, I = AF.input, cam = AF.camera;
  const pl = G.player = { pos: new V3(P.spawn.x, P.spawn.y + 1, P.spawn.z), vel: new V3(), yaw: P.spawn.yaw, pitch: -0.1, host: null, mana: 30, maxMana: 30, spell: 0, dist: 2.8, lock: null, target: null, bob: 0, fwd: new V3(), aim: null, face: 0, landed: false, sens: 1, invY: false, hold: null };
  const inp = G.inp = { mx: 0, mz: 0, up: 0, lx: 0, ly: 0, cast: false, act: false, possess: false, dash: false, jump: false, zoom: 0, t: { mx: 0, mz: 0, up: 0, dash: false } };
  // ---------------------------------------------------------------- sparkles (one pooled Points cloud for all magic)
  const NS = 1100, sp = { p: new Float32Array(NS * 3), v: new Float32Array(NS * 3), c: new Float32Array(NS * 3), m: new Float32Array(NS * 2), life: new Float32Array(NS), max: new Float32Array(NS), grav: new Float32Array(NS), i: 0 };
  let spPts = null; const colT = new THREE.Color();
  G.spark = (x, y, z, o = {}) => { const n = o.n ?? 6, s = o.speed ?? 1.2, life = o.life ?? 0.9; colT.set(o.color ?? 0xffe9a0); for (let k = 0; k < n; k++) { const i = sp.i = (sp.i + 1) % NS; const a = Math.random() * 6.283, u = Math.random() * 2 - 1, q = Math.sqrt(1 - u * u), r = o.spread ?? 0.08; sp.p[i * 3] = x + (Math.random() - 0.5) * r * 2; sp.p[i * 3 + 1] = y + (Math.random() - 0.5) * r * 2; sp.p[i * 3 + 2] = z + (Math.random() - 0.5) * r * 2; const sv = s * (0.4 + Math.random() * 0.6);
      sp.v[i * 3] = Math.cos(a) * q * sv + (o.vx || 0); sp.v[i * 3 + 1] = u * sv + (o.vy || 0); sp.v[i * 3 + 2] = Math.sin(a) * q * sv + (o.vz || 0); const j = o.rainbow ? colT.setHSL(Math.random(), 0.9, 0.65) : colT; sp.c[i * 3] = j.r; sp.c[i * 3 + 1] = j.g; sp.c[i * 3 + 2] = j.b; sp.life[i] = sp.max[i] = life * (0.6 + Math.random() * 0.6); sp.m[i * 2] = (o.size ?? 1) * (0.6 + Math.random() * 0.8); sp.grav[i] = o.grav ?? -0.6; } };
  // ---------------------------------------------------------------- the fairy herself
  let fairy = null, wings = [], glow = null, light = null, ring = null;
  const clouds = [];
  AF.onBuild('fairy', 800, () => {
    const S = AF.scene;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp.p, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aC', new THREE.BufferAttribute(sp.c, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aM', new THREE.BufferAttribute(sp.m, 2).setUsage(THREE.DynamicDrawUsage));
    spPts = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uPx: { value: 1 }, uTex: { value: G.glowTex } },
      vertexShader: 'attribute vec3 aC; attribute vec2 aM; uniform float uPx; varying vec4 vC; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vC = vec4(aC, aM.y); gl_PointSize = clamp(aM.x * aM.y * uPx * 46.0 / max(0.3, -mv.z), 0.0, 60.0 * uPx); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D uTex; varying vec4 vC; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vC.rgb * a * (0.6 + vC.a) , 1.0); }' }));
    spPts.frustumCulled = false; spPts.renderOrder = 6; S.add(spPts);
    fairy = new THREE.Group();
    const body = G.boxMesh((b) => { b(0.1, 0.1, 0.1, 0, 0.27, 0, 0xfbe2c8); b(0.12, 0.05, 0.12, 0, 0.33, -0.005, 0xf8d060); b(0.05, 0.05, 0.05, 0, 0.375, -0.02, 0xf8d060); b(0.02, 0.025, 0.01, -0.025, 0.275, 0.051, 0x30241c); b(0.02, 0.025, 0.01, 0.025, 0.275, 0.051, 0x30241c);
      b(0.08, 0.1, 0.06, 0, 0.17, 0, 0x7ad8b0); b(0.12, 0.05, 0.1, 0, 0.11, 0, 0x5ac8a0); b(0.15, 0.04, 0.13, 0, 0.075, 0, 0x8ae8c0); b(0.03, 0.08, 0.03, -0.025, 0.02, 0, 0xfbe2c8); b(0.03, 0.08, 0.03, 0.025, 0.02, 0, 0xfbe2c8); b(0.025, 0.09, 0.025, -0.06, 0.17, 0, 0xfbe2c8); b(0.025, 0.09, 0.025, 0.06, 0.17, 0, 0xfbe2c8); }, new THREE.MeshBasicMaterial({ vertexColors: true }));
    body.castShadow = false; fairy.add(body);
    const wm = new THREE.MeshBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 4; i++) { const up = i < 2, sx = i % 2 ? 1 : -1; const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(sx * 0.16, up ? 0.22 : -0.02, sx * 0.24, up ? 0.2 : -0.14); sh.quadraticCurveTo(sx * 0.12, up ? 0.02 : -0.18, 0, 0); const w = new THREE.Mesh(new THREE.ShapeGeometry(sh, 6), wm); const piv = new THREE.Group(); piv.position.set(0, 0.19, -0.035); piv.add(w); fairy.add(piv); wings.push({ piv, sx, up }); }
    glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.glowTex, color: 0xfff0b0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); glow.scale.set(1.1, 1.1, 1); glow.position.y = 0.2; fairy.add(glow);
    fairy.traverse((o) => { o.userData.noCull = true; }); S.add(fairy); G.fairy = fairy;
    light = new THREE.PointLight(0xffe2a0, 0, 11, 1.6); S.add(light); G.fairyLight = light;
    // target ring
    ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false })); ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.userData.noCull = true; S.add(ring);
    // rain clouds (pooled)
    for (let i = 0; i < 3; i++) { const m = G.boxMesh((b) => { b(2.6, 0.7, 1.8, 0, 0, 0, 0x8a94a8); b(1.6, 0.6, 1.4, -0.9, 0.45, 0.1, 0x9aa4b8); b(1.5, 0.7, 1.3, 0.8, 0.4, -0.1, 0xa4aec0); b(1.2, 0.5, 1.0, 0.1, 0.8, 0, 0xb4bed0); }, new THREE.MeshLambertMaterial({ vertexColors: true })); m.visible = false; m.castShadow = false; m.userData.noCull = true; S.add(m); clouds.push({ m, t: 0, x: 0, y: 0, z: 0 }); }
    G.rainClouds = clouds;
    AF.dragon.alive = true;
  });
  // ---------------------------------------------------------------- spells
  const SP = G.SPELLS = [
    { id: 'glimmer', name: 'Glimmer', icon: '✨', cost: 2, desc: 'A burst of fairy-light. Wakes sleepers, lights lamps, and points the way to anything star-touched.', have: true },
    { id: 'bloom', name: 'Bloom', icon: '🌸', cost: 4, desc: 'Flowers spring up where you point. Crops fatten. Sheep... change.', have: true },
    { id: 'zephyr', name: 'Zephyr', icon: '🍃', cost: 4, desc: 'A cheeky gust. Hats beware. Sails and washing love it.', have: true },
    { id: 'tickle', name: 'Tickle', icon: '🪶', cost: 3, desc: 'An invisible feather. Nobody can stay grumpy.', have: true },
    { id: 'sleep', name: 'Sleepdust', icon: '💤', cost: 5, desc: 'A pinch of dream. Forty winks, wherever they stand.' },
    { id: 'lev', name: 'Featherfall', icon: '🎈', cost: 6, desc: 'Up they go! Floats a villager or a beast for a little while.' },
    { id: 'size', name: 'Muchness', icon: '🍄', cost: 6, desc: 'Makes someone teeny — or, cast again, tremendous.' },
    { id: 'poly', name: 'Hopscotch', icon: '🐸', cost: 10, desc: 'Turns a villager into a frog, a hen or a piglet. Briefly. Probably.' },
    { id: 'rain', name: 'Pocket Raincloud', icon: '🌧️', cost: 8, desc: 'A small, sulky cloud. Waters crops, douses fires, ruins hairdos.' },
    { id: 'ember', name: 'Emberspark', icon: '🔥', cost: 8, desc: 'A spark of real fire. Thatch and hay burn. Be careful — or don\'t.' },
    { id: 'mend', name: 'Mend', icon: '🪄', cost: 10, desc: 'What was broken or burnt knits itself whole again.' },
    { id: 'firework', name: 'Starburst', icon: '🎆', cost: 5, desc: 'A rocket of coloured stars. Best after dark.' },
    { id: 'moon', name: 'Moonturn', icon: '🌙', cost: 14, desc: 'Spin the sky on to the next dusk or dawn.' },
    { id: 'starfall', name: 'Starfall', icon: '🌠', cost: 20, desc: 'The wizard\'s gift: call down a shower of friendly stars.' },
  ];
  G.spellById = (id) => SP.find((s) => s.id === id);
  G.learn = (id, quiet) => { const s = G.spellById(id); if (!s || s.have) return false; s.have = true; if (!quiet) { AF.emit('learn', s); G.spark(pl.pos.x, pl.pos.y, pl.pos.z, { n: 60, speed: 3, life: 1.6, rainbow: true, size: 1.6 }); } return true; };
  const rockets = [], mends = []; let sizeFlip = false, moonTo = null;
  const tv = new V3(), tv2 = new V3();
  const findTarget = (maxD = 16, cone = 0.36) => { let best = null, bs = 1e9; const f = pl.fwd, ox = pl.pos.x, oy = pl.pos.y, oz = pl.pos.z;
    const test = (x, y, z, obj, kind) => { tv.set(x - ox, y - oy, z - oz); const d = tv.length(); if (d > maxD || d < 0.01) return; const a = Math.acos(AF.clamp(tv.dot(f) / d, -1, 1)); if (a > cone + 0.6 / d) return; const s = d * (1 + a * 4); if (s < bs) { bs = s; best = { obj, kind, x, y, z, d }; } };
    for (const n of G.npcs) if (n !== pl.host && n.g.visible) test(n.body.x, n.body.y + n.lev + 0.9 * n.scaleNow, n.body.z, n, 'npc');
    if (G.critters) for (const c of G.critters) if (c.alive !== false) test(c.x, c.y + 0.25, c.z, c, 'critter');
    if (G.bossTargets) for (const b of G.bossTargets()) test(b.x, b.y, b.z, b.obj, b.kind);
    return best; };
  const aimPoint = (maxD = 24) => { const o = cam.position, f = pl.fwd; const h = AF.rayVox(o.x, o.y, o.z, f.x, f.y, f.z, maxD + pl.dist, true); if (h && Math.hypot(h.x - pl.pos.x, h.y - pl.pos.y, h.z - pl.pos.z) <= maxD + 1) return h; return null; };
  G.findTarget = findTarget; G.aimPoint = aimPoint;
  const say = (t) => AF.emit('toast', t);
  const CAST = {
    glimmer(t, pt) { const x = t ? t.x : pt ? pt.x : pl.pos.x + pl.fwd.x * 3, y = t ? t.y : pt ? pt.y + 0.5 : pl.pos.y + pl.fwd.y * 3, z = t ? t.z : pt ? pt.z : pl.pos.z + pl.fwd.z * 3; G.spark(x, y, z, { n: 46, speed: 2.6, life: 1.3, size: 1.5 }); if (AF.fx) AF.fx.flash && AF.fx.flash(x, y, z, { size: 2 });
      if (t && t.kind === 'npc') { const n = t.obj; if (n.fx.sleep) n.fx.sleep.t = 0; else if (n.poseNow === 'sleep' && !n.def.wizard) { n.think = 0; G.ui.bubble(n, 'Mmf? Wha— who\'s there?', 3); } else G.react(n, 'kind', '♥'); }
      AF.emit('glimmer', { x, y, z, t }); return true; },
    bloom(t, pt) { if (t && t.kind === 'critter') { AF.emit('bloom-critter', t.obj); G.spark(t.x, t.y, t.z, { n: 30, rainbow: true, speed: 1.8 }); return true; } if (t && t.kind === 'npc') { G.react(t.obj, 'kind', '♥'); G.spark(t.x, t.y + 0.7, t.z, { n: 30, color: 0xff9ac8, speed: 1.4 }); AF.emit('bloom-npc', t.obj); return true; }
      if (!pt) { say('Point at the ground to make it bloom.'); return false; } const FL = [AF.K.flowerR, AF.K.flowerY, AF.K.flowerB, AF.K.flowerW, AF.K.flowerP]; let n = 0;
      const big = G.bloomBig; for (let i = 0; i < (big ? 60 : 26) && n < (big ? 30 : 13); i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (big ? 4.4 : 2.4), x = pt.x + Math.cos(a) * r, z = pt.z + Math.sin(a) * r, y = AF.surfaceBelow(x, z, pt.y + 1.5, 4); if (y < P.SEA_Y || W.getM(x, y + 0.05, z) || W.getM(x, y + 0.3, z)) continue; W.setM(x, y + 0.02, z, AF.K.stem); W.setM(x, y + 0.27, z, FL[(Math.random() * 5) | 0]); G.spark(x, y + 0.4, z, { n: 3, color: 0xa8ffb0, speed: 0.8 }); n++; }
      AF.emit('bloom', { x: pt.x, y: pt.y, z: pt.z, n }); return true; },
    zephyr(t, pt) { const f = pl.fwd; for (let i = 0; i < 26; i++) { const d = 1 + Math.random() * 9; G.spark(pl.pos.x + f.x * d, pl.pos.y + f.y * d, pl.pos.z + f.z * d, { n: 1, color: 0xd8f4ff, vx: f.x * 9, vy: f.y * 9 + 0.5, vz: f.z * 9, speed: 0.6, life: 0.7, spread: 0.9, grav: 0 }); }
      let hit = 0; for (const n of G.npcs) { if (n === pl.host) continue; tv.set(n.body.x - pl.pos.x, n.body.y + 1 - pl.pos.y, n.body.z - pl.pos.z); const d = tv.length(); if (d < 12 && tv.dot(f) / d > 0.72) { if (G.hatOff(n, f.x * 5 + (Math.random() - 0.5) * 2, f.z * 5 + (Math.random() - 0.5) * 2)) hit++; else if (!n.possessed && n.poseNow !== 'sleep') { n.emote = '!'; n.emoteT = 1.5; } AF.emit('gust-npc', n); } }
      if (G.mill && Math.hypot(G.mill.x - pl.pos.x, G.mill.z - pl.pos.z) < 40) { G.windBoost = 1.6; AF.emit('gust-mill'); }
      AF.emit('gust', { x: pl.pos.x, y: pl.pos.y, z: pl.pos.z, f, hats: hit }); if (AF.fire && AF.fire.wind) { AF.fire.wind.x = f.x * 3; AF.fire.wind.z = f.z * 3; } return true; },
    tickle(t) { if (!t || t.kind !== 'npc') { say('Tickle whom? Point at somebody.'); return false; } if (t.obj.poseNow === 'sleep') { say('They only giggle in their sleep.'); } G.npcFx(t.obj, 'laugh', 5); t.obj.emote = '♪'; t.obj.emoteT = 5; G.spark(t.x, t.y, t.z, { n: 20, color: 0xfff0a0 }); AF.emit('tickle', t.obj); return true; },
    sleep(t) { if (!t || t.kind !== 'npc') { say('Sleepdust needs somebody to land on.'); return false; } G.npcFx(t.obj, 'sleep', 11); t.obj.emote = 'Z'; t.obj.emoteT = 11; G.spark(t.x, t.y + 0.6, t.z, { n: 30, color: 0xb0b8ff, speed: 0.8, life: 2, grav: -0.2 }); AF.emit('sleepdust', t.obj); return true; },
    lev(t) { if (!t) { say('Featherfall wants a villager or a beast.'); return false; } if (t.kind === 'npc') { if (t.obj.def.wizard && !G.wizardAwake) { say('He floats an inch, snores, and settles again.'); return true; } G.npcFx(t.obj, 'lev', 6.5); G.react(t.obj, 'lev', '!'); } else t.obj.lev = 6; G.spark(t.x, t.y, t.z, { n: 30, color: 0xb8e8ff, vy: 2 }); AF.emit('lev', t.obj, t.kind); return true; },
    size(t) { if (!t || t.kind !== 'npc') { say('Muchness needs a villager.'); return false; } sizeFlip = !sizeFlip; G.npcFx(t.obj, 'size', 16, sizeFlip ? 0.42 : 1.75); G.spark(t.x, t.y, t.z, { n: 36, color: sizeFlip ? 0xff9ad0 : 0xa0ffb0, speed: 2 }); AF.emit('size', t.obj, sizeFlip); return true; },
    poly(t) { if (!t || t.kind !== 'npc') { say('Hopscotch needs a villager.'); return false; } if (t.obj.def.wizard && !G.wizardAwake) { say('The spell slides off his beard.'); return true; } G.npcFx(t.obj, 'poly', 13); if (AF.fx) AF.fx.smoke(t.x, t.y, t.z, { n: 8, size: 1.2, dark: 0.08, rise: 1, life: 1, a: 0.6 }); G.spark(t.x, t.y, t.z, { n: 40, color: 0x9aff8a, speed: 2.4 }); AF.emit('poly', t.obj); return true; },
    rain(t, pt) { const x = t ? t.x : pt ? pt.x : pl.pos.x + pl.fwd.x * 4, z = t ? t.z : pt ? pt.z : pl.pos.z + pl.fwd.z * 4, gy = AF.surfaceBelow(x, z, (t ? t.y : pt ? pt.y : pl.pos.y) + 2, 30); const c = clouds.sort((a, b) => a.t - b.t)[0]; c.t = 13; c.x = x; c.z = z; c.y = gy + 5.5; c.follow = t && t.kind === 'npc' ? t.obj : null; c.m.visible = true; AF.emit('rain', c); return true; },
    ember(t, pt) { const p = t || pt; if (!p) { say('Point at something to set alight.'); return false; } const n = AF.ignite(p.x, p.y + 0.1, p.z, 1.1, 2); G.spark(p.x, p.y, p.z, { n: 24, color: 0xff8a3a, speed: 2, vy: 1.5 }); if (AF.fx) AF.fx.fire(p.x, p.y + 0.2, p.z, { n: 6, size: 0.9, life: 0.6 }); if (t && t.kind === 'npc') { G.react(t.obj, 'lev', '!'); } AF.emit('ember', { x: p.x, y: p.y, z: p.z, lit: n }); if (!n) say('It smoulders and goes out. (Thatch, hay, cloth and timber burn.)'); return true; },
    mend(t, pt) { const x = pt ? pt.x : pl.pos.x, z = pt ? pt.z : pl.pos.z; let job = null; try { if (AF.fire) AF.fire.douse(x, pt ? pt.y : pl.pos.y, z, 14, 80); job = AF.mend.begin(x - 14, z - 14, x + 14, z + 14); } catch (e) { console.warn(e); } if (job) mends.push({ job, x, y: pt ? pt.y : pl.pos.y, z, t: 0 }); G.spark(x, (pt ? pt.y : pl.pos.y) + 1, z, { n: 60, color: 0xa0ffe0, speed: 5, life: 1.4 }); AF.emit('mend', { x, z }); return true; },
    firework() { if (rockets.length > 5) return false; rockets.push({ p: pl.pos.clone(), v: pl.fwd.clone().multiplyScalar(9).add(tv.set(0, 15, 0)), t: 0.9 + Math.random() * 0.3, hue: Math.random() }); return true; },
    moon() { const h = AF.time.hours; moonTo = h >= 5.9 && h < 19.6 ? 20.6 : 6.6; AF.emit('moonturn', moonTo); return true; },
    starfall() { G.starfallT = 9; AF.emit('starfall'); return true; },
  };
  G.cast = (id) => { const s = id ? G.spellById(id) : SP.filter((q) => q.have)[pl.spell]; if (!s || pl.host || pl.lock) return false; if (pl.castCd > AF.clock.t) return false; if (pl.mana < s.cost) { say('Not enough fairy dust yet — it gathers again in a moment.'); AF.emit('sfx', 'nope'); return false; }
    const t = findTarget(), pt = aimPoint(); let ok = false; try { ok = t && (t.kind === 'boss' || t.kind === 'lamp') ? G.bossCast(s, t, pt) : CAST[s.id](t, pt); } catch (e) { console.error(e); } if (ok) { pl.mana -= s.cost; pl.castT = 0.35; pl.castCd = AF.clock.t + 0.3; AF.emit('cast', s, t, pt); AF.emit('sfx', 'cast'); } return ok; };
  // ---------------------------------------------------------------- possession
  G.possess = (n) => { if (pl.host || !n || pl.lock) return false; if (n.def.wizard && !G.wizardAwake) { say('His dreams are far too deep to borrow.'); return false; } if (n.fx.poly || n.fx.lev) { say('Not while they\'re... like that.'); return false; }
    if (n.poseNow === 'sleep') { say('You slip into ' + n.name.split(' ')[0] + '\'s dream — and sleepwalk them out of bed.'); n.body.y = AF.surfaceBelow(n.body.x, n.body.z, n.body.y + 0.5, 3); }
    for (const k in n.fx) n.fx[k].t = 0; n.possessed = true; n.talkT = 0; if (n.spot && n.spot.user === n) n.spot.user = null; n.spot = null; n.state = 'idle'; n.pose = 'stand'; n.head.visible = false; pl.host = n; pl.yaw = n.yaw + Math.PI; pl.pitch = 0; fairy.visible = false; G.spark(n.body.x, n.body.y + 1.2, n.body.z, { n: 50, speed: 2.5, life: 1.2, color: 0xc8a0ff }); AF.emit('possess', n); AF.emit('sfx', 'possess'); return true; };
  G.release = () => { const n = pl.host; if (!n) return; if (pl.lock) G.unlock(); n.possessed = false; n.head.visible = true; n.pose = 'stand'; n.state = 'idle'; n.think = 3.5; n.yaw = pl.yaw + Math.PI; pl.host = null; fairy.visible = true; pl.pos.set(n.body.x, n.body.y + 2.0 * n.sc, n.body.z); pl.vel.set(0, 1.5, 0);
    const b = AF.buildingAt(n.body.x, n.body.y + 0.5, n.body.z); n.inPlace = b && G.places[b.id] ? b.id : (Math.hypot(n.body.x - P.CRAG[0], n.body.z - P.CRAG[1]) < 5.8 && n.body.y > P.CRAG_Y - 0.5 ? 'spire' : null); n.upper = !!n.inPlace && n.body.y > G.places[n.inPlace].y + 1.5;
    G.spark(pl.pos.x, pl.pos.y, pl.pos.z, { n: 40, speed: 2.2, color: 0xc8a0ff }); setTimeout(() => { if (!n.possessed) G.react(n, 'dazed', '?'); }, 700); AF.emit('release', n); AF.emit('sfx', 'release'); };
  G.lockPlayer = (lock) => { pl.lock = lock; AF.emit('lock', lock); }; G.unlock = () => { const l = pl.lock; pl.lock = null; if (l && l.exit) l.exit(); AF.emit('lock', null); };
  // ---------------------------------------------------------------- interactions
  G.acts = [];   // {x,y,z,r,label,who:'fairy'|'human'|'any',can?,act}
  G.addAct = (a) => { G.acts.push(Object.assign({ r: 2.2, who: 'any' }, a)); return a; };
  const scan = () => { const me = pl.host ? tv.set(pl.host.body.x, pl.host.body.y + 1, pl.host.body.z) : pl.pos, who = pl.host ? 'human' : 'fairy'; let best = null, bd = 1e9;
    for (const a of G.acts) { if (a.who !== 'any' && a.who !== who) continue; const d = Math.hypot(a.x - me.x, a.y - me.y, a.z - me.z); if (d < a.r && d < bd && (!a.can || a.can())) { bd = d; best = a; } }
    let bn = null, nd = pl.host ? 2.6 : 3.2; for (const n of G.npcs) { if (n === pl.host || !n.g.visible) continue; const d = Math.hypot(n.body.x - me.x, n.body.y + n.lev + 0.9 - me.y, n.body.z - me.z); if (d < nd) { nd = d; bn = n; } }
    let bc = null, cd = 1.8; if (G.critters) for (const c of G.critters) { if (!c.pet) continue; const d = Math.hypot(c.x - me.x, c.y + 0.2 - me.y, c.z - me.z); if (d < cd) { cd = d; bc = c; } }
    pl.near = bn; pl.nearCrit = bc; pl.target = best && (!bn || bd < nd + 0.4) ? best : null; };
  // ---------------------------------------------------------------- keyboard + mouse
  const cv = document.getElementById('cv');
  cv.addEventListener('mousedown', (e) => { if (AF.mode === 'play' && !G.touch && !document.pointerLockElement && cv.requestPointerLock && !AF.SHOT) { try { const p = cv.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (err) {} G._lockClick = true; } });
  const readKeys = () => {
    if (inp.block) { inp.mx = inp.mz = inp.up = 0; inp.lx = inp.ly = 0; inp.cast = inp.act = inp.possess = inp.jump = inp.jumpT = false; inp.dash = false; return; }
    const k = I.key, t = inp.t; inp.mx = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0) + t.mx; inp.mz = (k('KeyW') || k('ArrowUp') ? 1 : 0) - (k('KeyS') || k('ArrowDown') ? 1 : 0) + t.mz;
    inp.up = (k('Space') ? 1 : 0) - (k('KeyC') || k('ControlLeft') ? 1 : 0) + t.up; inp.dash = k('ShiftLeft') || k('ShiftRight') || t.dash; inp.jump = I.hit('Space') || inp.jumpT; inp.jumpT = false;
    const m = I.mouse; if (!G.touch && (document.pointerLockElement || (m.buttons & 1))) { inp.lx += m.dx; inp.ly += m.dy; }
    if (I.hit('KeyE')) inp.act = true; if (I.hit('KeyF')) inp.possess = true; if (I.hit('KeyQ') || (m.clicked && m.clickButton === 0 && !G.touch && !G._lockClick && document.pointerLockElement)) inp.cast = true; if (m.clicked) G._lockClick = false;
    const have = SP.filter((s) => s.have).length; for (let i = 0; i < 10; i++) if (I.hit('Digit' + ((i + 1) % 10))) { if (i < have) { pl.spell = i; AF.emit('spellsel'); } }
    if (m.wheel && !pl.lock) { if (k('AltLeft')) pl.dist = AF.clamp(pl.dist * Math.exp(m.wheel * 0.001), 1.2, 9); else { pl.spell = ((pl.spell + (m.wheel > 0 ? 1 : -1)) % have + have) % have; AF.emit('spellsel'); } }
    if (I.hit('BracketRight')) { pl.spell = (pl.spell + 1) % have; AF.emit('spellsel'); } if (I.hit('BracketLeft')) { pl.spell = (pl.spell + have - 1) % have; AF.emit('spellsel'); }
    if (inp.zoom) { pl.dist = AF.clamp(pl.dist * Math.exp(inp.zoom), 1.2, 9); inp.zoom = 0; }
  };
  const moveAxis = (p, dx, dy, dz) => { const r = 0.14, h = 0.3; if (dx && !AF.boxBlocked(p.x + dx, p.y - 0.05, p.z, r, h)) p.x += dx; else if (dx) pl.vel.x = 0; if (dz && !AF.boxBlocked(p.x, p.y - 0.05, p.z + dz, r, h)) p.z += dz; else if (dz) pl.vel.z = 0; if (dy && !AF.boxBlocked(p.x, p.y - 0.05 + dy, p.z, r, h)) p.y += dy; else if (dy) pl.vel.y = 0; };
  let scanT = 0, camY = 0;
  const wish = new V3(), rgt = new V3(), eye = new V3(), cpos = new V3();
  AF.modes.play = {
    enter() { AF.playing = true; }, exit() { AF.playing = false; },
    update(dt) {
      readKeys();
      const sens = 0.0026 * pl.sens; if (!(pl.lock && pl.lock.noLook)) { pl.yaw -= inp.lx * sens; pl.pitch = AF.clamp(pl.pitch - inp.ly * sens * (pl.invY ? -1 : 1), -1.45, 1.45); } inp.lx = inp.ly = 0;
      const cp = Math.cos(pl.pitch); pl.fwd.set(-Math.sin(pl.yaw) * cp, Math.sin(pl.pitch), -Math.cos(pl.yaw) * cp); rgt.set(Math.cos(pl.yaw), 0, -Math.sin(pl.yaw));
      pl.mana = Math.min(pl.maxMana, pl.mana + dt * 1.7); if (pl.castT > 0) pl.castT -= dt;
      let ml = Math.hypot(inp.mx, inp.mz); const mx = ml > 1 ? inp.mx / ml : inp.mx, mz = ml > 1 ? inp.mz / ml : inp.mz; ml = Math.min(1, ml);
      if (pl.lock) { if (pl.lock.update) pl.lock.update(dt); if (inp.possess || inp.act && pl.lock.actExit) { /* handled by ui buttons too */ } }
      else if (pl.host) {
        const n = pl.host, b = n.body, sp = (inp.dash ? 5.6 : 3.1) * (b.y < P.SEA_Y - 0.4 ? 0.5 : 1) * n.scaleNow / n.sc * (n.def.kid ? 0.9 : 1);
        const fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw), dx = (fx * mz + rgt.x * mx) * sp * dt, dz = (fz * mz + rgt.z * mx) * sp * dt;
        if ((inp.jump || inp.up > 0.5) && b.onGround) { b.vy = 6.6; b.onGround = false; AF.emit('sfx', 'hop'); }
        AF.moveBody(b, dx, dz, dt, { step: 0.55 });
        if (b.y < P.SEA_Y - 1.05 && W.groundY(b.x, b.z) < P.SEA_Y - 1.05) { b.y = P.SEA_Y - 1.05; b.vy = 0; b.onGround = true; if (Math.random() < dt * 6 && ml > 0.1) AF.fx.splash && AF.fx.splash(b.x, b.z, { size: 0.3 }); }
        const r = Math.hypot(b.x, b.z); if (r > 228) { b.x *= 228 / r; b.z *= 228 / r; }
        n.yaw = pl.yaw + Math.PI; n.pose = ml > 0.1 ? 'walk' : (n.holdPose || 'stand'); n.speed = sp / 1.0 * 0.5 + 0.7; pl.pos.set(b.x, b.y + 1.0, b.z);
      } else {
        const sp = inp.dash ? (pl.dashSp || 15) : 7.5; wish.copy(pl.fwd).multiplyScalar(mz).addScaledVector(rgt, mx); wish.y += inp.up * 0.9; if (wish.lengthSq() > 1) wish.normalize(); wish.multiplyScalar(sp);
        pl.vel.lerp(wish, 1 - Math.exp(-dt * (wish.lengthSq() > 0.01 ? 5 : 3.2)));
        const p = pl.pos, st = Math.ceil(pl.vel.length() * dt / 0.12) || 1; for (let i = 0; i < st; i++) moveAxis(p, pl.vel.x * dt / st, pl.vel.y * dt / st, pl.vel.z * dt / st);
        const gy = Math.max(W.groundY(p.x, p.z), P.SEA_Y) + 0.12; if (p.y < gy) { p.y = gy; if (pl.vel.y < 0) pl.vel.y = 0; if (W.groundY(p.x, p.z) < P.SEA_Y && pl.vel.length() > 3 && Math.random() < dt * 14) AF.fx.splash && AF.fx.splash(p.x, p.z, { size: 0.18 }); }
        if (p.y > 108) p.y = 108; const r = Math.hypot(p.x, p.z); if (r > 236) { p.x *= 236 / r; p.z *= 236 / r; if (!pl.edgeT || AF.clock.t - pl.edgeT > 8) { pl.edgeT = AF.clock.t; say('The far mountains are too cold for fairy wings.'); } }
        const v = pl.vel.length(); if (v > 1 || mz || mx) { const want = Math.atan2(pl.vel.x, pl.vel.z); if (v > 0.6) pl.face += AF.angDiff(pl.face, want) * Math.min(1, dt * 8); } else pl.face += AF.angDiff(pl.face, pl.yaw + Math.PI) * Math.min(1, dt * 2);
        if (Math.random() < dt * (6 + v * 5)) G.spark(p.x, p.y + 0.12, p.z, { n: 1, speed: 0.3, life: 0.9 + v * 0.05, size: 0.8, vy: -0.2 });
      }
      // casting / interacting
      scanT -= dt; if (scanT <= 0) { scanT = 0.12; scan(); }
      if (inp.cast) { if (pl.lock && pl.lock.onCast) pl.lock.onCast(); else if (!pl.host) G.cast(); }
      if (inp.act) G.doAct && G.doAct(); if (inp.possess) { if (pl.lock) G.unlock(); else if (pl.host) G.release(); else if (pl.near) G.possess(pl.near); else say('Fly close to a villager to borrow them.'); }
      inp.cast = inp.act = inp.possess = false;
      // camera
      if (pl.lock && pl.lock.cam) pl.lock.cam(cam, dt);
      else if (pl.host) { const b = pl.host.body, eh = 1.52 * pl.host.scaleNow; camY += ((b.y + eh) - camY) * Math.min(1, dt * 14); if (Math.abs(camY - (b.y + eh)) > 1.5) camY = b.y + eh; cam.position.set(b.x + pl.fwd.x * 0.1, camY + Math.sin(pl.host.phase) * (pl.host.pose === 'walk' ? 0.025 : 0), b.z + pl.fwd.z * 0.1); tv.copy(cam.position).add(pl.fwd); cam.lookAt(tv); AF.shadowFocus.set(b.x, b.y, b.z); }
      else { const p = pl.pos; eye.set(p.x, p.y + 0.22, p.z); let d = pl.dist; const h = AF.rayVox(eye.x, eye.y, eye.z, -pl.fwd.x, -pl.fwd.y + 0.12, -pl.fwd.z, d + 0.3, true); if (h) d = Math.max(0.35, h.d - 0.3);
        pl.camD = pl.camD == null ? d : (d < pl.camD ? d : pl.camD + (d - pl.camD) * Math.min(1, dt * 4)); cpos.set(eye.x - pl.fwd.x * pl.camD, eye.y + (-pl.fwd.y + 0.12) * pl.camD, eye.z - pl.fwd.z * pl.camD); const gy = Math.max(W.groundY(cpos.x, cpos.z), P.SEA_Y) + 0.15; if (cpos.y < gy) cpos.y = gy;
        cam.position.copy(cpos); tv.copy(eye).addScaledVector(pl.fwd, 6); cam.lookAt(tv); AF.shadowFocus.set(p.x, p.y, p.z); }
      AF.shadowRadius = G.quality ? G.quality.shadowR : 80; AF.camTarget.copy(pl.pos);
      AF.dragon.pos.copy(pl.pos); AF.dragon.alive = !pl.host && !pl.lock;
      // the fairy's body
      if (fairy.visible) { const t = AF.clock.t; pl.bob = Math.sin(t * 3.1) * 0.035; fairy.position.set(pl.pos.x, pl.pos.y - 0.08 + pl.bob, pl.pos.z); fairy.rotation.y = pl.face; const tilt = AF.clamp(pl.vel.length() / 15, 0, 1); fairy.rotation.x = tilt * 0.7; const fl = Math.sin(t * 46) * 0.75; for (const w of wings) { w.piv.rotation.y = w.sx * (0.5 + fl * (w.up ? 1 : 0.8)); } const nearK = AF.clamp(((pl.camD ?? 2) - 0.35) / 1.1, 0.12, 1); wings[0].piv.children[0].material.opacity = 0.55 * nearK; glow.material.opacity = (0.5 + 0.3 * Math.sin(t * 5) + (pl.castT > 0 ? 0.5 : 0)) * nearK; glow.scale.setScalar(1.0 + (pl.castT > 0 ? 0.8 : 0) + AF.time.night * 0.5); }
      light.position.set(pl.pos.x, pl.pos.y + 0.3, pl.pos.z); light.intensity = pl.host ? 0 : (2 + AF.time.night * 16) * (1 + (pl.castT > 0 ? 1 : 0));
      // target ring
      const tg = !pl.host && !pl.lock ? findTarget() : null; if (tg) { ring.visible = true; ring.position.set(tg.x, AF.surfaceBelow(tg.x, tg.z, tg.y + 0.5, 12) + 0.06, tg.z); ring.scale.setScalar(1 + Math.sin(AF.clock.t * 6) * 0.08); pl.aimT = tg; } else { ring.visible = false; pl.aimT = null; }
    },
  };
  // always-on magic upkeep
  AF.onTick('magic', 160, (dt) => {
    if (!AF.ready) return; const t = AF.clock.t;
    // sparkles
    if (spPts) { for (let i = 0; i < NS; i++) { if (sp.life[i] <= 0) { if (sp.m[i * 2 + 1] !== 0) sp.m[i * 2 + 1] = 0; continue; } sp.life[i] -= dt; sp.v[i * 3 + 1] += sp.grav[i] * dt; sp.p[i * 3] += sp.v[i * 3] * dt; sp.p[i * 3 + 1] += sp.v[i * 3 + 1] * dt; sp.p[i * 3 + 2] += sp.v[i * 3 + 2] * dt; sp.m[i * 2 + 1] = Math.max(0, sp.life[i] / sp.max[i]); }
      const a = spPts.geometry.attributes; a.position.needsUpdate = a.aC.needsUpdate = a.aM.needsUpdate = true; spPts.material.uniforms.uPx.value = AF.renderer.getPixelRatio() * (AF.renderer.domElement.height / AF.renderer.getPixelRatio()) / 720; }
    // rain clouds
    for (const c of clouds) { if (c.t <= 0) continue; c.t -= dt; if (c.follow) { c.x += (c.follow.body.x - c.x) * Math.min(1, dt * 2); c.z += (c.follow.body.z - c.z) * Math.min(1, dt * 2); c.y = c.follow.body.y + c.follow.lev + 4.2; }
      c.m.position.set(c.x, c.y + Math.sin(t * 1.3) * 0.15, c.z); c.m.scale.setScalar(Math.min(1, c.t, (13 - c.t) * 2)); for (let i = 0; i < 3; i++) G.spark(c.x + (Math.random() - 0.5) * 2.4, c.y - 0.4, c.z + (Math.random() - 0.5) * 1.6, { n: 1, color: 0x8ac8ff, speed: 0.1, vy: -7, life: 0.75, size: 0.7, grav: -6 });
      c.acc = (c.acc || 0) + dt; if (c.acc > 0.4) { c.acc = 0; const gy = AF.surfaceBelow(c.x, c.z, c.y, 30); if (AF.fire) { const q = AF.fire.douse(c.x, gy + 1, c.z, 4.5, 30); if (q > 0) AF.emit('doused', q); } AF.emit('rain-tick', c, gy); for (const n of G.npcs) if (!n.possessed && Math.hypot(n.body.x - c.x, n.body.z - c.z) < 1.8 && n.body.y < c.y && !n.fx.wet && n.poseNow !== 'sleep') { n.fx.wet = { t: 8 }; G.react(n, 'wet', '!'); AF.emit('soaked', n); } }
      if (c.t <= 0) c.m.visible = false; }
    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i]; r.t -= dt; r.v.y -= 5 * dt; r.p.addScaledVector(r.v, dt); G.spark(r.p.x, r.p.y, r.p.z, { n: 2, color: 0xffd080, speed: 0.4, life: 0.5 }); if (r.t <= 0) { const c = new THREE.Color().setHSL(r.hue, 0.95, 0.62); G.spark(r.p.x, r.p.y, r.p.z, { n: 90, color: c.getHex(), speed: 7, life: 1.9, size: 1.6, grav: -2.2 }); G.spark(r.p.x, r.p.y, r.p.z, { n: 40, color: 0xffffff, speed: 3.5, life: 1.2, size: 1.1, grav: -2 }); AF.emit('firework', r.p); AF.emit('sfx', 'pop'); rockets.splice(i, 1); } }
    // mending
    for (let i = mends.length - 1; i >= 0; i--) { const m = mends[i]; m.t += dt; try { m.job.step(6); } catch (e) { mends.splice(i, 1); continue; } if (Math.random() < dt * 20) G.spark(m.x + (Math.random() - 0.5) * 16, m.y + Math.random() * 6, m.z + (Math.random() - 0.5) * 16, { n: 2, color: 0xa0ffe0, speed: 0.6, vy: 1 }); if (m.job.done || m.job.blocked || m.t > 25) { mends.splice(i, 1); AF.emit('mended', m); } }
    // moonturn
    if (moonTo != null) { const T = AF.time; T.hours += dt * 3.2; if (T.hours >= 24) { T.hours -= 24; T.day++; AF.emit('newday', T.day); } const d = ((moonTo - T.hours) + 24) % 24; if (d < 0.2 || d > 23) { moonTo = null; AF.emit('moonturn-done'); for (const n of G.npcs) n.think = Math.random(); } }
    if (G.starfallT > 0) { G.starfallT -= dt; const p = G.player.pos; for (let i = 0; i < 2; i++) { const x = p.x + (Math.random() - 0.5) * 60, z = p.z + (Math.random() - 0.5) * 60; G.spark(x, p.y + 26 + Math.random() * 10, z, { n: 1, color: 0xfff4c0, speed: 0.2, vx: 3, vy: -16, life: 2.2, size: 2.2, grav: -3 }); } if (G.shoot) G.shoot.next = Math.min(G.shoot.next, 0.4); }
  });
  G.start = (o = {}) => { AF.setMode('play'); if (o.x != null) pl.pos.set(o.x, o.y, o.z); };
}
