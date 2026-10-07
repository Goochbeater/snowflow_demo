/* ==== p71_hl_cast.js ==== */
/* HOGWARTS — the cast. Students in grey jumpers and black robes lined and stoled in their house colours, professors,
   dark wizards in ash-grey travelling cloaks; wands; the wizard move set (mocap casts layered over locomotion). */
/* ------------------------------------------------------------------ cloth colours */
(function () {
  const C = { hlRobe: [0x24242c, 0x50505c, 0.86, 0.7, 0.5], hlAsh: [0x2c2a2a, 0x5a5450, 0.92, 0.5, 0.3], hlProf: [0x1c2a22, 0x44584a, 0.86, 0.6, 0.35], hlPlum: [0x2e1830, 0x5a3a5e, 0.86, 0.6, 0.35] };
  for (const k in HL.HOUSES) C['hl_' + k] = [HL.HOUSES[k].cloth[0], HL.HOUSES[k].cloth[1], 0.8, 0.9, 0.5];
  const m0 = CLOTH.mat;
  /* the school cape as it is seen from behind all day long: black wool with a weave and the fall of its folds, piped and hemmed in the house's colours, the house's shield worked on the back */
  HL.capeTex = function (house) { const H = HL.HOUSES[house], W = 256, Hh = 384, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d'), rs = mulberry(house.length * 131 + 7), c1 = '#' + new THREE.Color(H.col).getHexString(), c2 = '#' + new THREE.Color(H.col2).getHexString();
    x.fillStyle = '#2b2b33'; x.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 11; i++) { const fx = (i + 0.5) / 11 * W + (rs() - 0.5) * 8, g = x.createLinearGradient(fx - 13, 0, fx + 13, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.34)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(fx - 13, 30, 26, Hh); const g2 = x.createLinearGradient(fx + 5, 0, fx + 20, 0); g2.addColorStop(0, 'rgba(120,120,140,0)'); g2.addColorStop(0.5, 'rgba(120,120,140,0.16)'); g2.addColorStop(1, 'rgba(120,120,140,0)'); x.fillStyle = g2; x.fillRect(fx + 5, 30, 15, Hh); }
    for (let i = 0; i < 9000; i++) { x.fillStyle = rs() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(150,150,170,0.06)'; x.fillRect(rs() * W, rs() * Hh, 1, 2 + rs() * 3); }
    /* the hem: a broad band of the house colour between two narrow ones of its second */ x.fillStyle = c1; x.fillRect(0, Hh - 40, W, 26); x.fillStyle = c2; x.fillRect(0, Hh - 46, W, 5); x.fillRect(0, Hh - 13, W, 4); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 40; i++) x.fillRect(i * 6.5, Hh - 40, 2, 26);
    /* piping down both front edges, a yoke across the shoulders */ x.fillStyle = c1; x.fillRect(0, 0, 7, Hh); x.fillRect(W - 7, 0, 7, Hh); x.fillStyle = c2; x.fillRect(7, 0, 2, Hh); x.fillRect(W - 9, 0, 2, Hh); { const g = x.createLinearGradient(0, 0, 0, 44); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 44); }
    /* the shield between the shoulder blades */ { const cx = W / 2, cy = 112, sw = 30, sh = 38; x.save(); x.translate(cx, cy); x.beginPath(); x.moveTo(-sw, -sh); x.lineTo(sw, -sh); x.lineTo(sw, sh * 0.2); x.quadraticCurveTo(sw, sh * 0.8, 0, sh); x.quadraticCurveTo(-sw, sh * 0.8, -sw, sh * 0.2); x.closePath(); x.fillStyle = c1; x.fill(); x.lineWidth = 4; x.strokeStyle = c2; x.stroke(); x.clip(); x.fillStyle = c2; x.globalAlpha = 0.9; x.beginPath(); x.moveTo(-sw, -sh * 0.2); x.lineTo(sw, -sh * 0.75); x.lineTo(sw, -sh * 0.35); x.lineTo(-sw, sh * 0.2); x.closePath(); x.fill(); x.globalAlpha = 1; x.fillStyle = c2; x.font = 'bold 34px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillText(H.name[0], 1.5, 6.5); x.fillStyle = '#f2e6c8'; x.fillText(H.name[0], 0, 5); x.restore(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.flipY = false; /* (the panel's v runs from the shoulders down) */ return t; };
  CLOTH.mat = function (key) {
    if (/^hlCape_/.test(key) && !CLOTH.mats[key]) { const house = key.slice(7), b = m0('cape'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = () => 'clothpanelmap'; m.map = HL.capeTex(house); m.color.setRGB(0.8, 0.8, 0.8); m.sheenColor.set(0x50505c); m.roughness = 0.86; m.sheen = 0.6; m.envMapIntensity = 0.5; CLOTH.mats[key] = m; return m; }
    if (!C[key] || CLOTH.mats[key]) return m0(key);
    const b = m0('cape'), s = C[key], m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = b.customProgramCacheKey;
    m.color.set(s[0]); m.sheenColor.set(s[1]); m.roughness = s[2]; m.sheen = s[3]; m.envMapIntensity = s[4]; CLOTH.mats[key] = m; return m;
  };
})();
/* a robe: an open-fronted skirt of cloth from the waist to the ankle, a short cape from the shoulders; quidditch robes are shorter and fly */
HL.robe = function (o) {
  o = o || {};
  return (J) => { const y = J.pelvis[1] + 0.02, P = [], len = o.len || 0.8, mat = o.mat || 'hlRobe';
    const base = { y, rx: 0.172, rz: 0.142, len, rows: 9, flare: o.flare || 0.34, mat };
    P.push(CLOTH.arcPanel(Object.assign({}, base, { a0: 28, a1: 100, cols: 5, name: 'rL' })));
    P.push(CLOTH.arcPanel(Object.assign({}, base, { a0: 96, a1: 264, cols: 9, name: 'rB' })));
    P.push(CLOTH.arcPanel(Object.assign({}, base, { a0: 260, a1: 332, cols: 5, name: 'rR' })));
    if (o.lining) { P.push(CLOTH.arcPanel({ y: y - 0.0, rx: 0.16, rz: 0.13, a0: 30, a1: 62, len: len * 0.98, rows: 9, cols: 3, flare: base.flare, mat: o.lining, name: 'lnL' })); P.push(CLOTH.arcPanel({ y, rx: 0.16, rz: 0.13, a0: 298, a1: 330, len: len * 0.98, rows: 9, cols: 3, flare: base.flare, mat: o.lining, name: 'lnR' })); }
    if (o.cape !== false) P.push(ARM.cape(J, Object.assign({ mat, len: o.capeLen || 0.62, rx: 0.228, rz: 0.16, a0: 64, a1: 296, cols: 11, rows: 8, flare: 0.3 }, o.cape || {})));
    return { panels: P }; };
};
(function () {
  const R_ = (part, g, po) => ['ranger', part, g, po], P_ = (part, g, po) => ['peasant', part, g, po];
  const g = (rules, sat, val, tint) => ({ rules, sat, val, tint });
  const lea = (v, s, toH) => ({ h: 28, w: 45, s: s === undefined ? 1 : s, v, toH }), cream = (s, v, toH) => ({ h: 38, w: 30, s, v, toH, minS: 0.02 });
  const MATTE = { metal: 0.05, ns: 0.8, env: 0.35 };
  const S = (name, o) => { CAST.SPECS[name] = Object.assign({ name, height: 1, head: false, skin: { tone: 0xc09070 }, mats: () => [] }, o.spec || {}); CAST.QC[name] = Object.assign({ hair: [] }, o.qc || {}); CAST.QO[name] = o.qo; };
  // the school uniform: a grey jumper over a white shirt, charcoal trousers, black shoes
  const jumper = g([lea(0.5, 0.05)], 0.12, 0.23, 0xf0f0ff), sleeve = g([lea(0.5, 0.05)], 0.12, 0.3, 0xf0f0ff), trousers = g([lea(0.5, 0.08)], 0.2, 0.5), shoes = g([], 0.1, 0.3);
  const rsleeve = g([{ h: 115, w: 80, s: 0.08, v: 0.2, minS: 0.03 }, lea(0.22, 0.05)], 0.1, 0.32);
  const uniform = () => [P_('Body', jumper, MATTE), R_('Arms', rsleeve, MATTE), P_('Legs', trousers, MATTE), P_('Feet', shoes, MATTE)];
  HL.SKINS = [0xd8a888, 0xc89878, 0xe0b498, 0x9a6a4c, 0x6e4a34, 0xcfa07e];
  HL.HAIR = [0x2a1c12, 0x5a3a20, 0x8a5a2a, 0x141210, 0xa87838, 0x7a2e16, 0xc8b070];
  const HM = ['Hair_SimpleParted', 'Hair_Buzzed', 'Hair_SimpleParted'], HF = ['Hair_Long', 'Hair_Buns', 'Hair_Long'];
  /* define a student template name: wiz_<house>_<m|f>_<v>. v picks skin / hair. quid = Quidditch robes (short, house-coloured) */
  HL.student = function (house, witch, v, quid) {
    const name = 'wiz_' + house + (witch ? '_f' : '_m') + v + (quid ? 'q' : ''); if (CAST.SPECS[name]) return name;
    const H = HL.HOUSES[house], hair = [(witch ? HF : HM)[v % 3]], hc = HL.HAIR[(v * 3 + (witch ? 1 : 0)) % HL.HAIR.length], tone = HL.SKINS[v % HL.SKINS.length];
    const robe = quid ? HL.robe({ mat: 'hl_' + house, len: 0.5, flare: 0.5, cape: { len: 0.95, mat: 'hl_' + house, flare: 0.55 } }) : HL.robe({ mat: 'hlRobe', lining: 'hl_' + house, len: 0.8, cape: { len: 1.16, flare: 0.4, mat: 'hlCape_' + house } });
    S(name, { spec: { height: witch ? 0.95 : 1, skin: { tone, brow: hc }, cloth: robe }, qc: { female: witch, hair, hairCol: hc, browCol: hc },
      qo: { female: witch, hair, hairCol: hc, browCol: hc, glove: quid ? 0x3a2a1c : null, tabard: { col: H.col, x0: 0.028, x1: 0.075 },
        parts: quid ? [P_('Body', g([lea(0.6, 0.9, new THREE.Color(H.col).getHSL({}).h * 360), cream(0.6, 0.9)], 1, 1), MATTE), P_('Arms', g([cream(0.5, 1.0)], 0.6, 0.95), MATTE), P_('Legs', g([lea(1.5, 0.3)], 0.5, 1.1, 0xf0e8d8), MATTE), R_('Feet_Boots', g([], 0.5, 0.5), MATTE), R_('Arms_Bracer', g([], 0.7, 0.8), { metal: 0.2 })] : uniform() } });
    return name;
  };
  // professors and villains
  S('prof_a', { spec: { height: 1.04, skin: { tone: 0xc8a088, brow: 0x8a8478 }, cloth: HL.robe({ mat: 'hlProf', len: 0.84, cape: { len: 1.05, mat: 'hlProf' } }) }, qc: { hair: ['Hair_Long', 'Hair_Beard'], hairCol: 0xb8b4ac, browCol: 0x9a968c },
    qo: { hair: ['Hair_Long', 'Hair_Beard'], hairCol: 0xb8b4ac, browCol: 0x9a968c, parts: [P_('Body', g([lea(0.4, 0.4, 150), cream(0.5, 0.8)], 0.7, 0.85), MATTE), P_('Arms', g([cream(0.4, 0.6)], 0.5, 0.8), MATTE), P_('Legs', trousers, MATTE), P_('Feet', shoes, MATTE)] } });
  S('prof_b', { spec: { height: 0.97, skin: { tone: 0xd0a890, brow: 0x3a2a20 }, cloth: HL.robe({ mat: 'hlPlum', len: 0.84, cape: { len: 0.9, mat: 'hlPlum' } }) }, qc: { female: true, hair: ['Hair_Buns'], hairCol: 0x4a4444, browCol: 0x3a3030 },
    qo: { female: true, hair: ['Hair_Buns'], hairCol: 0x4a4444, browCol: 0x3a3030, parts: [P_('Body', g([lea(0.4, 0.5, 300), cream(0.4, 0.7, 300)], 0.7, 0.8), MATTE), P_('Arms', g([cream(0.4, 0.6, 300)], 0.6, 0.7), MATTE), P_('Legs', trousers, MATTE), P_('Feet', shoes, MATTE)] } });
  const ash = (name, o) => S(name, { spec: { height: o.h || 1.02, skin: { tone: o.tone || 0xb89078, brow: 0x2a2018 }, cloth: HL.robe({ mat: 'hlAsh', len: 0.7, flare: 0.42, cape: { len: 1.0, mat: 'hlAsh', flare: 0.5 } }) }, qc: { hair: o.hair, hairCol: o.hc, browCol: o.hc },
    qo: { hair: o.hair, hairCol: o.hc, browCol: o.hc, glove: 0x1c1816, parts: [R_('Body', g([{ h: 115, w: 80, toH: o.hue, s: 0.5, v: 0.4, minS: 0.03 }, lea(0.45, 0.6)], 0.8, 0.85), MATTE), R_('Arms', g([{ h: 115, w: 80, toH: o.hue, s: 0.5, v: 0.4, minS: 0.03 }, lea(0.45)], 0.8, 0.85), MATTE), R_('Legs', g([{ h: 115, w: 80, toH: 28, s: 0.2, v: 0.3 }], 0.5, 0.8), MATTE), R_('Feet_Boots', g([], 0.3, 0.4), MATTE), R_('Body_Belt_1', g([lea(0.5)], 0.7, 0.8), { metal: 0.5 })].concat(o.hood ? [R_('Head_Hood', g([{ h: 115, w: 80, toH: o.hue, s: 0.4, v: 0.3, minS: 0.03 }], 0.7, 0.8), MATTE)] : []) } });
  ash('ashwinder', { hue: 8, hair: ['Hair_Buzzed', 'Hair_Beard'], hc: 0x2a2018, hood: true });
  ash('poacher', { hue: 32, hair: ['Hair_SimpleParted'], hc: 0x4a3420, tone: 0xa87a5c });
  ash('darkmage', { hue: 280, hair: ['Hair_Long', 'Hair_Beard'], hc: 0x141214, hood: true, h: 1.08, tone: 0xb0a090 });
})();
/* the hero is a student of the chosen house (the engine calls the hero template CHAR.T.maul) */
CHAR.buildMaul = async function (progress) {
  HL.load(); if (MG.flags.house && HL.HOUSES[MG.flags.house]) HL.house = MG.flags.house; if (MG.flags.witch !== undefined) HL.witch = !!MG.flags.witch;
  await QB.load();
  progress && await progress(0.2, 'Fitting your robes');
  const n = HL.student(HL.house, HL.witch, 0);
  await CAST.need([n]);
  progress && await progress(0.9, 'Polishing your wand');
  CHAR.T.maul = CHAR.T[n]; CHAR.T.maul.stats = {}; HL.heroName = n;
  return CHAR.T.maul;
};
/* ------------------------------------------------------------------ wands and brooms */
HL.wand = function (wood, glowCol) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: wood || 0x3a2416, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.6 });
  const pts = [[0.0085, -0.07], [0.0105, -0.05], [0.0095, 0.0], [0.011, 0.03], [0.0085, 0.05], [0.0062, 0.14], [0.0042, 0.26], [0.0028, 0.3], [0.0001, 0.303]].map((p) => new THREE.Vector2(p[0], p[1]));
  const sh = new THREE.Mesh(new THREE.LatheGeometry(pts, 8), m); sh.castShadow = true; g.add(sh);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(glowCol || 0xffffff), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  tip.position.y = 0.305; g.add(tip); g.userData.tip = tip; const mz = new THREE.Object3D(); mz.position.y = 0.305; g.add(mz); g.userData.muzzle = mz;
  return g;
};
HL.broom = function (col) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.5, envMapIntensity: 0.6 }), twig = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }), metal = new THREE.MeshStandardMaterial({ color: 0xb89a50, metalness: 1, roughness: 0.35 });
  // the handle runs along +Z (forward), with a slight sweep; origin at the rider's seat
  const curve = new THREE.CatmullRomCurve3([V3(0, 0.02, -0.55), V3(0, 0, -0.1), V3(0, 0.015, 0.5), V3(0, 0.07, 1.05), V3(0, 0.1, 1.2)]);
  const h = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.021, 8), wood); h.castShadow = true; g.add(h);
  const tail = new THREE.Group(); tail.position.set(0, 0.02, -0.55); g.add(tail);
  const rs = mulberry(7); for (let i = 0; i < 46; i++) { const a = rs() * TAU, r = 0.02 + rs() * 0.075, L = 0.5 + rs() * 0.3, t = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.008, L, 4), twig); t.position.set(Math.cos(a) * r * 1.2, Math.sin(a) * r, -L / 2 - 0.02); t.rotation.set(HALF + Math.sin(a) * r * 1.6, 0, -Math.cos(a) * r * 1.6); tail.add(t); }
  for (const z of [-0.04, -0.2]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.058 + (z < -0.1 ? 0.03 : 0), 0.05 + (z < -0.1 ? 0.03 : 0), 0.035, 12), metal); b.rotation.x = HALF; b.position.z = z; tail.add(b); }
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.03), metal); f.position.set(s * 0.07, -0.02, -0.3); g.add(f); }
  g.userData.tail = tail; return g;
};
/* ------------------------------------------------------------------ moves */
(function () {
  const N0 = [-0.25, 0.95, 0.1], NA = [0, 0.3, 0.95], NB = { g: 'none', st: 'neutral', cr: 0.02, tw: 0, pi: 0, fl: [0.26, 0.95, 0.06], fr: [-0.26, 0.95, 0.06], headYaw: 0, headPitch: 0, liftL: 0, liftR: 0, air: 0 };
  const stub = (dur, x) => Object.assign({ dur, keys: [K(0, N0, NA, Object.assign({}, NB))] }, x || {});
  const loop = (x) => ({ loop: true, keys: [K(0, N0, NA, Object.assign({}, NB, x || {})), K(2, N0, NA, {})] });
  MOV.wizard = { moSet: 'wizard', idle: loop(), run: loop(), aim: loop(), calm: loop(), talk: loop(), fold: loop(), sit: loop(), guard: loop(),
    ride: { loop: true, keys: [K(0, [0, 0.62, 0.46], [0, 0.08, 1], { g: 'both', oL: 0.1, oR: -0.06, st: 'neutral', cr: 0.0, tw: 0, pi: -0.95, air: 1, headPitch: 0.5 }), K(2, [0, 0.8, 0.34], [0, 0.1, 1], {})] },
    cast1: stub(0.46, { cancel: 0.3, release: 0.13 }), cast2: stub(0.46, { cancel: 0.3, release: 0.13 }), cast3: stub(0.62, { cancel: 0.44, release: 0.24 }), castBig: stub(0.86, { cancel: 0.62, release: 0.3 }), castUp: stub(0.8, { cancel: 0.6, release: 0.3 }),
    protego: stub(0.5), protegoHold: stub(2.0), dodge: stub(0.62, { iframes: [0.02, 0.42] }), jumpUp: stub(0.4), air: stub(2.4), land: stub(0.3), interact: stub(1.2), cheer: stub(1.3),
    hit: stub(0.36), knock: stub(2.2), death: stub(1.9), lift: stub(3.0), frozen: stub(0.5), throwQ: stub(0.7, { release: 0.3 }), catchQ: stub(0.5),
  };
  const i0 = MOV.init;
  MOV.init = function () { i0(); for (const k in MOV.wizard) if (MOV.wizard[k] && MOV.wizard[k].keys) ANIM.compile(MOV.wizard[k], ANIM.basePose);
    MOV.student = Object.assign({}, MOV.wizard, { moSet: 'student' }); MOV.seated = Object.assign({}, MOV.wizard, { moSet: 'seated' }); MOV.rider = Object.assign({}, MOV.wizard, { moSet: 'rider' }); };
  Object.assign(MOCAP.SETS, {
    wizard: { base: { idle: 'Idle_Loop', run: 'Idle_Loop', aim: 'Idle_Loop', calm: 'Idle_Loop', guard: 'Idle_Loop', talk: 'Idle_Talking_Loop', fold: 'Idle_FoldArms_Loop', sit: 'Sitting_Idle_Loop', ride: 'Sitting_Idle_Loop' }, arms: true, upright: 0.2 },
    student: { base: { idle: 'Idle_Talking_Loop', run: 'Idle_Loop', calm: 'Idle_FoldArms_Loop', talk: 'Idle_Talking_Loop', fold: 'Idle_FoldArms_Loop', sit: 'Sitting_Idle_Loop' }, arms: true },
    seated: { base: { idle: 'Sitting_Idle_Loop', run: 'Sitting_Idle_Loop', calm: 'Sitting_Idle_Loop', sit: 'Sitting_Idle_Loop' }, arms: true },
    rider: { base: { idle: 'Sitting_Idle_Loop', run: 'Sitting_Idle_Loop', ride: 'Sitting_Idle_Loop' }, arms: true } });
  const m0 = MOCAP.moveSpecs;
  MOCAP.moveSpecs = function () {
    m0();
    const seg = (c, t0, t1, d) => [c, t0, t1, d === undefined ? (t1 - t0) : d], W = MOV.wizard;
    const put = (name, seqs, x) => { const m = W[name]; m.mo = Object.assign({ seq: seqs, mode: 'full' }, x || {}); m.dur = seqs.reduce((s, q) => s + q[3], 0); m.fadeOut = 0.2; };
    put('cast1', [seg('Punch_Cross', 0.02, 0.62, 0.46)], { upper: true }); put('cast2', [seg('Punch_Jab', 0.02, 0.6, 0.46)], { upper: true, mirror: true });
    put('cast3', [seg('Punch_Cross', 0.0, 0.17, 0.24), seg('Punch_Cross', 0.17, 0.8, 0.38)], { upper: true });
    put('castBig', [seg('OverhandThrow', 0.05, 0.42, 0.32), seg('OverhandThrow', 0.42, 1.2, 0.54)], { upper: true });
    put('castUp', [seg('Spell_Simple_Enter', 0, 0.53, 0.3), seg('Spell_Simple_Shoot', 0, 0.5, 0.5)], { upper: true });
    put('protego', [seg('Spell_Simple_Enter', 0, 0.53, 0.22), seg('Spell_Simple_Idle_Loop', 0, 0.28, 0.28)], { upper: true });
    put('protegoHold', [seg('Spell_Simple_Idle_Loop', 0, 2.0, 2.0)], { upper: true });
    put('dodge', [seg('Roll', 0.0, 0.92, 0.62)]); put('jumpUp', [seg('Jump_Start', 0.0, 0.5, 0.4)]); put('air', [seg('Jump_Loop', 0, 2.4, 2.4)]); put('land', [seg('Jump_Land', 0.0, 0.5, 0.3)]);
    put('interact', [seg('Interact', 0.1, 1.5, 1.2)], { upper: true }); put('cheer', [seg('Spell_Simple_Enter', 0, 0.53, 0.4), seg('Spell_Simple_Idle_Loop', 0, 0.5, 0.5), seg('Spell_Simple_Exit', 0, 0.43, 0.4)], { upper: true });
    put('hit', [seg('Hit_Chest', 0, 0.33, 0.36)]); put('knock', [seg('Hit_Knockback', 0, 0.83, 0.7), seg(null, 0, 0, 0.3), seg('LayToIdle', 0, 1.53, 1.2)]); put('death', [seg('Death01', 0, 2.4, 1.9)]);
    put('lift', [seg('Jump_Loop', 0, 2.5, 3.0)]); put('frozen', [seg('Hit_Head', 0.1, 0.12, 0.5)]);
    put('throwQ', [seg('OverhandThrow', 0.05, 0.42, 0.3), seg('OverhandThrow', 0.42, 1.2, 0.4)], { upper: true }); put('catchQ', [seg('Interact', 0.3, 0.9, 0.5)], { upper: true });
  };
  // 'upper' moves: the clip takes the trunk and arms; pelvis and legs stay with the locomotion blend (cast on the move)
  const a0 = MOCAP.sampleSeq;
  MOCAP.sampleSeq = function (spec, t, out) { a0(spec, t, out); if (spec.upper && MOCAP._fbNow) { const fb = MOCAP._fbNow; for (const i of [0, 13, 14, 15, 16, 17, 18]) out.q[i].copy(fb.q[i]); out.p.copy(fb.p); } return out; };
  const ac0 = MOCAP.actor;
  MOCAP.actor = function (a, dt) { const mo = a.inst.mo; MOCAP._fbNow = mo ? mo.fb : null; const r = ac0(a, dt); MOCAP._fbNow = null; return r; };
})();
