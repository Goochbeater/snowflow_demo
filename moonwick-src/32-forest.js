// ===== 32-forest: the deep forest ring — thousands of trees, undergrowth, fairy lights, pools of magic, hidden places =====
{
  const G = AF.G, K = AF.K, W = AF.W, P = AF.PLAN, S = P.SITES;
  const c = (hex, mat, o = {}) => AF.col(hex, Object.assign({ mat }, o));
  Object.assign(K, {
    fern: c(0x4a9a4a, 'leaf', { jitter: 0.7, edge: 0.1, solid: false }), fern2: c(0x3a8050, 'leaf', { jitter: 0.7, edge: 0.1, solid: false }), bluebell: c(0x6a7af0, 'leaf', { jitter: 0.3, edge: 0.1, solid: false, emit: 0x4a5af0, emitK: 0.6, mode: 'night' }),
    lfDeep: c(0x2c5a3a, 'leaf', { jitter: 0.9, edge: 0.3 }), lfDeep2: c(0x356a40, 'leaf', { jitter: 0.9, edge: 0.3 }), lfFir: c(0x244c40, 'leaf', { jitter: 0.8, edge: 0.3 }), lfTeal: c(0x3a7a78, 'leaf', { jitter: 0.8, edge: 0.3 }), lfLime: c(0x8ab848, 'leaf', { jitter: 0.9, edge: 0.3 }),
    lfGlow: c(0x5ac8b8, 'leaf', { jitter: 0.6, edge: 0.3, emit: 0x3affd8, emitK: 0.9, mode: 'night' }), lfGlowP: c(0xb88ae8, 'leaf', { jitter: 0.6, edge: 0.3, emit: 0xb060ff, emitK: 0.9, mode: 'night' }),
    thorn: c(0x2a3a2a, 'leaf', { jitter: 0.8, edge: 0.5 }), thornW: c(0x3a2a22, 'wood', { jitter: 0.7 }), ash: c(0x4a4658, 'earth', { jitter: 0.6, edge: 0.3 }), ash2: c(0x3a3648, 'earth', { jitter: 0.6, edge: 0.3 }), deadBark: c(0x5a5560, 'wood', { jitter: 0.6 }),
    poolMoon: c(0xc8e0ff, 'earth', { emit: 0xa8c8ff, emitK: 0.55, mode: 'always', jitter: 0.25, edge: 0 }), poolGlass: c(0x7af0f0, 'earth', { emit: 0x3ae8f0, emitK: 0.55, mode: 'always', jitter: 0.25, edge: 0 }), poolEmber: c(0xffc070, 'earth', { emit: 0xff9a3a, emitK: 0.6, mode: 'always', jitter: 0.25, edge: 0 }),
    poolDream: c(0xc09aff, 'earth', { emit: 0x9a5aff, emitK: 0.55, mode: 'always', jitter: 0.25, edge: 0 }), poolGreen: c(0x9af0a0, 'earth', { emit: 0x4aff7a, emitK: 0.55, mode: 'always', jitter: 0.25, edge: 0 }), poolEcho: c(0xffa8d0, 'earth', { emit: 0xff6ab0, emitK: 0.55, mode: 'always', jitter: 0.25, edge: 0 }),
    ribbon: c(0xf06a8a, 'cloth', { jitter: 0.3 }), gnome: c(0xd03a3a, 'cloth', { jitter: 0.2 }),
  });
  const R = AF.rng(777);
  // ---- light, blocky forest trees with a coarse far version
  const mk = (vs, fn, farFn) => { const m = new AF.Model(16, 30, 16); const th = fn(m); const g = AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] }); g.userData.trunkH = th * vs; const f = new AF.Model(8, 15, 8); farFn(f); g.userData.lod = AF.meshModel(f, { vs: vs * 2, anchor: [0.5, 0, 0.5], flat: true }); return g; };
  const sl = (m, y, r, h, col, cx = 8) => m.box(cx - r, y, cx - r, cx + r, y + h, cx + r, col);
  const broad = (l1, l2, bark, h, vs = 0.5) => mk(vs, (m) => { m.box(7, 0, 7, 9, h + 2, 9, bark); sl(m, h, 3, 1, l2); sl(m, h + 1, 5, 2, l1); sl(m, h + 3, 4, 2, l2); sl(m, h + 5, 3, 1, l1); m.box(4, h + 2, 2, 7, h + 4, 5, l2); m.box(10, h + 1, 10, 13, h + 3, 14, l1); return h; }, (m) => { m.box(3.5, 0, 3.5, 4.5, h / 2 + 1, 4.5, bark); m.box(1.5, h / 2, 1.5, 6.5, h / 2 + 3, 6.5, l1); });
  const fir = (l1, l2, h, vs = 0.5) => mk(vs, (m) => { m.box(7.5, 0, 7.5, 8.5, h + 12, 8.5, K.barkD); let y = h; for (const [r, hh, col] of [[5, 1, l1], [4, 1, l2], [4, 1, l1], [3, 2, l2], [3, 1, l1], [2, 2, l2], [1, 3, l1]]) { sl(m, y, r, hh, col); y += hh + (r > 2 ? 1 : 0); } return h; }, (m) => { m.box(3.5, 0, 3.5, 4.5, h / 2, 4.5, K.barkD); m.box(1.5, h / 2, 1.5, 6.5, h / 2 + 2, 6.5, l1); m.box(2.5, h / 2 + 2, 2.5, 5.5, h / 2 + 5, 5.5, l2); m.box(3.5, h / 2 + 5, 3.5, 4.5, h / 2 + 7, 4.5, l1); });
  const lanky = (l1, bark, h) => mk(0.5, (m) => { m.box(7.5, 0, 7.5, 8.5, h, 8.5, bark); sl(m, h, 3, 2, l1); sl(m, h + 2, 2, 1, l1); m.box(8.5, h * 0.6, 7.5, 11, h * 0.6 + 1, 8.5, bark); m.box(10, h * 0.6 + 1, 6.5, 13, h * 0.6 + 3, 9.5, l1); return h; }, (m) => { m.box(3.5, 0, 3.5, 4.5, h / 2, 4.5, bark); m.box(2.5, h / 2, 2.5, 5.5, h / 2 + 2, 5.5, l1); });
  const dead = () => mk(0.5, (m) => { m.box(7.5, 0, 7.5, 8.5, 12, 8.5, K.deadBark); m.box(8.5, 7, 7.5, 12, 8, 8.5, K.deadBark); m.box(11, 8, 7.5, 12, 11, 8.5, K.deadBark); m.box(4, 9, 7.5, 7.5, 10, 8.5, K.deadBark); m.box(4, 10, 7.5, 5, 13, 8.5, K.deadBark); return 12; }, (m) => { m.box(3.5, 0, 3.5, 4.5, 6, 4.5, K.deadBark); });
  const FT = {
    deep: [broad(K.lfDeep, K.lfDeep2, K.barkD, 9, 0.75), broad(K.lfDeep2, K.lf3, K.barkD, 11, 0.75), broad(K.lfDeep, K.lfTeal, K.barkR, 8, 0.5), fir(K.lfFir, K.lfDeep, 4, 0.75), lanky(K.lfDeep2, K.barkD, 16)],
    north: [fir(K.lfFir, K.lfPine, 3), fir(K.lfPine, K.lfPine2, 4), fir(K.lfFir, K.lfTeal, 3, 0.75), broad(K.lfDeep, K.lfPine2, K.barkD, 8), lanky(K.lfPine, K.barkD, 14)],
    east: [broad(K.lf1, K.lf2, K.bark, 7), broad(K.lfGold, K.lfRed, K.barkR, 7), broad(K.lf2, K.lfLime, K.birch, 9), lanky(K.lfGold, K.birch, 13), fir(K.lfPine, K.lfPine2, 3)],
    south: [broad(K.lf2, K.lfLime, K.barkR, 7), broad(K.lf1, K.lfDeep2, K.bark, 8), broad(K.lfPink, K.lfPink2, K.barkR, 6), lanky(K.lfLime, K.birch, 12), broad(K.lfTeal, K.lf3, K.barkD, 9, 0.75)],
    magic: [broad(K.lfGlow, K.lfTeal, K.barkD, 9), broad(K.lfGlowP, K.lfDeep, K.barkD, 10), lanky(K.lfGlow, K.birch, 14)],
    dead: [dead()],
  };
  const lightCols = [0xffd27a, 0xff8ab0, 0x7ae0ff, 0xb48aff, 0x9affa0, 0xffb060];
  const fairyLight = (x, y, z, i) => AF.addLight({ x, y, z, kind: 'fairy', color: lightCols[((i | 0) % 6 + 6) % 6] });
  G.fairyLight = fairyLight;
  AF.onBuild('forest', 405, () => {
    const gy = (x, z) => W.groundY(x, z);
    // ---- arenas + pools: shape the ground first
    { const s = S.thorn, y = Math.round(gy(s[0], s[1]) * 2) / 2; W.eachCol(s[0] - 24, s[1] - 24, s[0] + 24, s[1] + 24, (bx, bz, i, x, z) => { const d = Math.hypot(x - s[0], z - s[1]); if (d < 21) { const k = AF.smooth(17, 21, d); W.H[i] = Math.round(AF.lerp(y, W.H[i] * 0.25, k) * 2) * 2; if (d < 17.5) W.C[i] = AF.noise2(x / 3, z / 3) > 0.55 ? K.soil2 : K.gMoss; } }); s.y = y; }
    { const s = S.dell, y = Math.round(gy(s[0], s[1]) * 2) / 2; W.eachCol(s[0] - 26, s[1] - 26, s[0] + 26, s[1] + 26, (bx, bz, i, x, z) => { const d = Math.hypot(x - s[0], z - s[1]); if (d < 23) { const k = AF.smooth(6, 22, d); W.H[i] = Math.round(AF.lerp(y - 3.5, W.H[i] * 0.25, k * k) * 2) * 2; if (d < 20) W.C[i] = AF.noise2(x / 4, z / 4) > 0.5 ? K.ash : K.ash2; if (d < 20) W.S[i] = K.ash2; } }); s.y = y - 3.5; }
    const POOLS = G.pools = [['moonwell', 'The Moonwell', K.poolMoon, 0xa8c8ff], ['glass', 'Glasswater', K.poolGlass, 0x3ae8f0], ['emberpool', 'The Emberpool', K.poolEmber, 0xff9a3a], ['dream', 'The Dreaming Pool', K.poolDream, 0x9a5aff], ['green', 'Greenspring', K.poolGreen, 0x4aff7a], ['echo', 'The Echo Pool', K.poolEcho, 0xff6ab0]].map(([id, name, col, hex], pi) => {
      const s = S[id], y = Math.round(gy(s[0], s[1]) * 4) / 4; W.eachCol(s[0] - 9, s[1] - 9, s[0] + 9, s[1] + 9, (bx, bz, i, x, z) => { const d = Math.hypot(x - s[0], z - s[1]) + (AF.noise2(x / 2 + pi * 9, z / 2) - 0.5) * 1.2; if (d < 8) W.H[i] = Math.round(y * 4); if (d < 3.4) { W.H[i] = Math.round(y * 4) - 2; W.C[i] = col; W.S[i] = K.granite; } else if (d < 4.4) { W.C[i] = K.granite; } else if (d < 8) W.C[i] = K.gMoss; });
      for (let j = 0; j < 9; j++) { const a = j / 9 * 6.283 + pi, r = 4.3, x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r, hh = 0.5 + (j % 3) * 0.5; W.fill(x - 0.375, y, z - 0.375, x + 0.375, y + hh, z + 0.375, j % 2 ? K.granite : K.wallMoss); if (j % 3 === 0) W.fill(x - 0.125, y + hh, z - 0.125, x + 0.125, y + hh + 0.5, z + 0.125, pi % 2 ? K.crystalP : K.crystal); fairyLight(x, y + hh + 1.4 + (j % 2) * 0.5, z, j + pi); }
      AF.addLight({ x: s[0], y: y + 0.4, z: s[1], kind: 'pool', color: hex }); AF.addLabel(name, s[0], s[1], 'place'); return { id, name, x: s[0], y: y - 0.5, z: s[1], hex, col }; });
    // ---- the forest itself
    let n = 0; G.forestCount = 0;
    for (let gx = -232; gx < 232; gx += 5.4) for (let gz = -232; gz < 232; gz += 5.4) {
      const x = gx + (R() - 0.5) * 4.2, z = gz + (R() - 0.5) * 4.2, r = Math.hypot(x, z); if (r > 233) continue;
      const f = P.forest(x, z); if (f < 0.35 + R() * 0.3) continue; if (G.roadD(x, z) < 1.9) continue; const y = gy(x, z); if (y < 0.4) continue;
      let near = false; for (let i = G.treeList.length - 1; i >= 0 && i > G.treeList.length - 60; i--) { const t = G.treeList[i]; if (Math.abs(t.x - x) < 2.6 && Math.abs(t.z - z) < 2.6) { near = true; break; } } if (near) continue;
      const dDell = Math.hypot(x - S.dell[0], z - S.dell[1]);
      const zone = dDell < 34 ? 'dead' : R() < 0.035 ? 'magic' : x < -95 && Math.abs(z - 40) < 140 ? 'deep' : z < -95 ? 'north' : x > 60 ? 'east' : z > 95 ? 'south' : x < 0 ? 'deep' : 'east';
      if (zone === 'dead' && R() < 0.45) continue;
      const L = FT[zone], g = L[(R() * L.length) | 0]; AF.placeStatic(g, x, y, z, (R() * 4) | 0, { collide: false }); AF.addCollider(x - 0.45, y, z - 0.45, x + 0.45, y + g.userData.trunkH, z + 0.45, 'tree'); G.treeList.push({ x, y, z, kind: zone === 'north' ? 'pine' : 'wood', h: g.userData.trunkH, forest: 1 }); n++;
      if (zone === 'deep' && R() < 0.06) { /* a giant mushroom beside it */ }
    }
    G.forestCount = n;
    // ---- a grove of giant toadstools in the deep west
    { const cap = (m, y, r, col, dots) => { for (let yy = 0; yy < 3; yy++) { const rr = r - yy * 1.4; for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) if (Math.hypot(x, z) <= rr) m.set(8 + x, y + yy, 8 + z, dots && AF.hash3(x, yy, z) < 0.13 ? K.capDot : col); } };
      const mkS = (h, r, col, dots, vs) => { const m = new AF.Model(17, 22, 17); m.box(7, 0, 7, 10, h, 10, K.stemW); cap(m, h, r, col, dots); const g = AF.meshModel(m, { vs, anchor: [0.5, 0, 0.5] }); g.userData.trunkH = h * vs; return g; };
      const SH = [mkS(8, 7, K.capRed, true, 0.5), mkS(12, 8, K.capRed, true, 0.75), mkS(6, 5.5, K.glowCap, false, 0.5), mkS(9, 6, K.glowCapP, false, 0.5), mkS(5, 4.5, K.capTan, false, 0.5)];
      const cx = -176, cz = 38; let big = null; for (let j = 0; j < 22; j++) { const a = j * 2.4, r = 3 + Math.sqrt(j) * 4.4, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, y = gy(x, z); if (y < 0.4 || G.roadD(x, z) < 1.5) continue; const g = SH[j === 0 ? 1 : (j % 4) + (j % 4 >= 1 ? 1 : 0)] || SH[0]; AF.placeStatic(g, x, y, z, j % 4, { collide: false }); AF.addCollider(x - 0.6, y, z - 0.6, x + 0.6, y + g.userData.trunkH, z + 0.6, 'tree'); G.treeList.push({ x, y, z, kind: 'shroom', h: g.userData.trunkH }); if (j === 0) big = { x, y, z, h: g.userData.trunkH }; if (j % 2) AF.addLight({ x, y: y + g.userData.trunkH + 0.5, z, kind: 'shroom', color: j % 4 === 1 ? 0x3ae0ff : 0xb05aff }); }
      G.bigShroom = big; AF.addLabel('The Toadstool Grove', cx, cz, 'place'); }
    // ---- undergrowth
    for (let i = 0; i < 5200; i++) { const a = R() * 6.283, r = 88 + Math.sqrt(R()) * 144, x = Math.cos(a) * r, z = P.SQUARE[1] + Math.sin(a) * r; if (Math.hypot(x, z) > 231 || P.forest(x, z) < 0.3 || G.roadD(x, z) < 0.3) continue; const y = gy(x, z); if (W.getM(x, y + 0.1, z)) continue; const k = AF.noise2(x / 11, z / 11);
      if (k > 0.66) { W.setM(x, y, z, K.stem); W.setM(x, y + 0.25, z, K.bluebell); } else if (k < 0.3) { W.fill(x, y, z, x + 0.5, y + 0.25, z + 0.25, K.fern); W.setM(x + 0.25, y + 0.25, z, K.fern2); } else { W.setM(x, y, z, K.fern2); W.setM(x, y + 0.25, z, K.fern); } }
    // ---- the Wishing Tree
    { const s = S.wishtree, y = gy(s[0], s[1]); s.y = y; for (let yy = 0; yy < 80; yy++) { const rr = 2.3 - yy * 0.016 + (yy < 8 ? (8 - yy) * 0.12 : 0); for (let i = -14; i < 14; i++) for (let k = -14; k < 14; k++) { const d = Math.hypot(i + 0.5, k + 0.5) * 0.25; if (d < rr && d > rr - 0.75 && !(yy < 9 && k > 5 && Math.abs(i + 0.5) < 2.5)) W.setM(s[0] + i * 0.25 + 0.01, y + yy * 0.25, s[1] + k * 0.25 + 0.01, AF.hash3(i >> 1, yy >> 2, k >> 1) < 0.25 ? K.barkR : K.barkD); } }
      W.fill(s[0] - 1.5, y, s[1] - 1.5, s[0] + 1.5, y + 0.25, s[1] + 1.5, K.gMoss); W.fill(s[0] - 0.25, y + 0.25, s[1] - 0.25, s[0] + 0.25, y + 0.75, s[1] + 0.25, K.fairyLamp); AF.addLight({ x: s[0], y: y + 0.9, z: s[1], kind: 'magic', color: 0xffe07a });
      const cm = new AF.Model(30, 22, 30); for (const [bx, by, bz, br, col] of [[15, 9, 15, 9, K.lf1], [8, 8, 12, 6.5, K.lfDeep2], [22, 9, 18, 7, K.lf2], [14, 14, 14, 6.5, K.lfPink], [18, 7, 8, 6, K.lfGlow], [10, 10, 21, 6, K.lfPink2]]) cm.sphere(bx, by, bz, br, col);
      const cg = AF.meshModel(cm, { vs: 0.75, anchor: [0.5, 0, 0.5] }); AF.placeStatic(cg, s[0], y + 15, s[1], 0, { collide: false });
      for (let j = 0; j < 46; j++) { const a = j * 2.4, r = 3 + (j % 7) * 1.3, hh = 9 + (j % 5) * 1.6 + Math.sin(j) * 1.5; fairyLight(s[0] + Math.cos(a) * r, y + hh, s[1] + Math.sin(a) * r, j); }
      for (let j = 0; j < 10; j++) { const a = j / 10 * 6.283; AF.kit.flag(s[0] + Math.cos(a) * 2.5, y + 4.2 + (j % 3) * 0.6, s[1] + Math.sin(a) * 2.5, { kind: 'banner', w: 0.3, h: 1.2 + (j % 3) * 0.4, c1: lightCols[j % 6], yaw: a }); }
      AF.addCollider(s[0] - 1.6, y, s[1] - 1.6, s[0] + 1.6, y + 14, s[1] - 1.2); AF.addLabel('The Wishing Tree', s[0], s[1], 'place'); }
    // ---- the Sleeping Giant: a mossy stone face in the earth
    { const s = S.giant, y = gy(s[0], s[1]); s.y = y; const m = new AF.Model(28, 14, 34); m.sphere(14, 2, 17, 12.5, K.granite, (x, yy, z) => (yy < 0 ? 0 : AF.hash3(x >> 1, yy >> 1, z >> 1) < 0.2 ? K.wallMoss : K.granite));
      m.box(12, 11, 14, 16, 14, 22, K.granite); m.box(11, 10, 20, 17, 12, 23, K.rock); m.box(5, 10, 14, 10, 11, 16, K.rockDark); m.box(18, 10, 14, 23, 11, 16, K.rockDark); m.box(9, 9, 25, 19, 10, 26, K.rockDark); for (let i = 0; i < 28; i++) for (let k = 0; k < 9; k++) if (AF.hash2(i, k) < 0.6) m.set(i, 12 + (AF.hash2(k, i) * 2 | 0), k + 2, K.lfDeep2);
      W.stamp(m, s[0] - 3.5, y - 0.25, s[1] - 4.25); for (let f = 0; f < 4; f++) W.fill(s[0] + 5 + f * 1.1, y, s[1] - 2, s[0] + 5.8 + f * 1.1, y + 0.75 + (f % 2) * 0.25, s[1] + 1.5 + (f === 1 || f === 2 ? 0.75 : 0), K.granite);
      AF.addLabel('The Sleeping Giant', s[0], s[1], 'place'); }
    // ---- twin rune arches
    for (const id of ['archN', 'archS']) { const s = S[id], y = gy(s[0], s[1]); s.y = y; W.fill(s[0] - 2, y, s[1] - 0.5, s[0] - 1, y + 4.5, s[1] + 0.5, K.granite); W.fill(s[0] + 1, y, s[1] - 0.5, s[0] + 2, y + 4.5, s[1] + 0.5, K.granite); W.fill(s[0] - 2.25, y + 4.5, s[1] - 0.5, s[0] + 2.25, y + 5.5, s[1] + 0.5, K.wallMoss); for (let j = 0; j < 4; j++) { W.fill(s[0] - 1.75, y + 0.75 + j, s[1] - 0.55, s[0] - 1.25, y + 1.25 + j, s[1] + 0.55, K.rune); W.fill(s[0] + 1.25, y + 0.75 + j, s[1] - 0.55, s[0] + 1.75, y + 1.25 + j, s[1] + 0.55, K.rune); } W.fill(s[0] - 0.5, y + 4.75, s[1] - 0.55, s[0] + 0.5, y + 5.25, s[1] + 0.55, K.rune);
      W.eachCol(s[0] - 3, s[1] - 3, s[0] + 3, s[1] + 3, (bx, bz, i, x, z) => { if (Math.hypot(x - s[0], z - s[1]) < 3) W.C[i] = K.flagT; }); AF.addLight({ x: s[0], y: y + 2.5, z: s[1], kind: 'magic', color: 0x5ad0ff }); }
    AF.addLabel('The North Arch', S.archN[0], S.archN[1], 'place'); AF.addLabel('The South Arch', S.archS[0], S.archS[1], 'place');
    // ---- crystal grotto
    { const s = S.grotto, y = gy(s[0], s[1]); s.y = y; for (let j = 0; j < 16; j++) { const a = j * 1.3, r = 1.5 + (j % 5) * 1.1, x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r, yy = gy(x, z), hh = 1 + (j % 4) * 1.1, col = j % 3 ? K.crystal : K.crystalP; W.fill(x - 0.375, yy, z - 0.375, x + 0.375, yy + hh, z + 0.375, col); W.fill(x - 0.125, yy + hh, z - 0.125, x + 0.125, yy + hh + 0.5, z + 0.125, col); if (j % 2) W.fill(x + 0.375, yy, z - 0.25, x + 0.75, yy + hh * 0.5, z + 0.25, col); if (j % 4 === 0) AF.addLight({ x, y: yy + hh + 0.5, z, kind: 'magic', color: j % 3 ? 0x5ad8ff : 0xb05aff }); } AF.addLabel('The Crystal Grotto', s[0], s[1], 'place'); }
    // ---- Thornhollow: a wall of briars round a clearing, littered with stolen things
    { const s = S.thorn, y = s.y; for (let a = 0; a < 6.283; a += 0.011) { const rr = 17.6 + Math.sin(a * 9) * 0.5; for (let t = 0; t < 5; t++) { const r = rr + t * 0.3 - 0.6, x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r, g0 = gy(x, z), hh = 2.6 + AF.noise2(a * 8, t) * 2.2; for (let yy = 0; yy < hh; yy += 0.25) if (AF.hash3((a * 300) | 0, (yy * 4) | 0, t) < 0.72) W.setM(x, g0 + yy, z, AF.hash3((a * 500) | 0, (yy * 4) | 0, t + 9) < 0.16 ? K.thornW : K.thorn); } }
      const loot = [K.pumpkin, K.crimson, K.royalBlue, K.pillow, K.gold, K.gnome, K.pie, K.quilt2]; for (let j = 0; j < 26; j++) { const a = j * 0.9, r = 6 + (j % 5) * 2, x = s[0] + Math.cos(a) * r, z = s[1] + Math.sin(a) * r; W.fill(x, y, z, x + 0.5, y + 0.25 + (j % 3) * 0.25, z + 0.5, loot[j % loot.length]); }
      AF.addLabel('Thornhollow', s[0], s[1], 'place'); AF.labels[AF.labels.length - 1].hidden = true; }
    // ---- the Sunless Dell: lantern-flower stalks round a grey hollow
    { const s = S.dell; s.lamps = []; for (let j = 0; j < 6; j++) { const a = j / 6 * 6.283 + 0.4, x = s[0] + Math.cos(a) * 11.5, z = s[1] + Math.sin(a) * 11.5, y = gy(x, z); W.fill(x - 0.125, y, z - 0.125, x + 0.125, y + 3.5, z + 0.125, K.deadBark); W.fill(x - 0.375, y + 3.5, z - 0.375, x + 0.375, y + 3.75, z + 0.375, K.deadBark); s.lamps.push({ x, y: y + 4.2, z }); }
      AF.addLabel('The Sunless Dell', s[0], s[1], 'place'); AF.labels[AF.labels.length - 1].hidden = true; }
    // ---- fairy lights: along every forest trail and lane, round the square, up the Spire
    { let li = 0; for (const e of P.E) { const a = P.N[e[0]], b = P.N[e[1]], L = Math.hypot(a[0] - b[0], a[1] - b[1]), nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, trail = e[3] === 'trail', step = trail ? 2.6 : 3.4; if (e[3] === 'bridge') continue;
        for (let d = 1; d < L; d += step) { const t = d / L, sd = (li & 1 ? 1 : -1) * (e[2] + 1.3), x = a[0] + (b[0] - a[0]) * t + nx * sd, z = a[1] + (b[1] - a[1]) * t + nz * sd; if (!trail && P.forest(x, z) < 0.3 && Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]) > 60) { li++; continue; } fairyLight(x, gy(x, z) + (trail ? 1.9 : 3.3) + Math.sin(d * 0.9) * 0.4, z, li++); } }
      const poles = [[-13, -1], [13, -1], [14, 21], [-13, 21]]; for (let p = 0; p < 4; p++) { const a = poles[p], b = poles[(p + 1) % 4]; for (let i = 0; i < 16; i++) { const t = (i + 0.5) / 16; fairyLight(a[0] + (b[0] - a[0]) * t, 5.55 - Math.sin(t * Math.PI) * 0.9, a[1] + (b[1] - a[1]) * t, i + p); } }
      for (let i = 0; i < 70; i++) { const a = i * 0.42, yy = P.CRAG_Y + 2 + i * 0.78; fairyLight(P.CRAG[0] + Math.cos(a) * 7.1, yy, P.CRAG[1] + Math.sin(a) * 7.1, i); }
      for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; fairyLight(P.GLADE[0] + Math.cos(a) * 7.5, gy(P.GLADE[0] + Math.cos(a) * 7.5, P.GLADE[1] + Math.sin(a) * 7.5) + 2.2 + (i % 2) * 0.6, P.GLADE[1] + Math.sin(a) * 7.5, i); }
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; fairyLight(165 + Math.cos(a) * 7.4, P.RIDGE_Y + 1.6 + (i % 2) * 0.5, -32 + Math.sin(a) * 7.4, i); }
      for (let i = 0; i < 10; i++) fairyLight(56 + i * 2.2, 3 + Math.sin(i / 9 * Math.PI) * 0.9, i % 2 ? 8.1 : 11.9, i);
      for (let i = 0; i < 9; i++) fairyLight(23 + i * 1.4, 1.9, 78.4 + i * 0.82, i); G.fairyLights = li; }
  });
}
