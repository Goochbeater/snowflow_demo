/* ==== p60_lvl_limgrave.js ==== */
/* LIMGRAVE — the first land. From the Stranded Graveyard door on its cliff: the First Step, the road north past the
   Tree Sentinel and the Church of Elleh, Gatefront Ruins, Agheel Lake, Groveside Cave, the Stormgate and Stormhill,
   to the tunnel under Stormveil Castle. */
const LIM = {};
LIM.ROAD = [[0, -304, 27], [2, -272, 26.4], [24, -240, 15], [13, -204, 8.5], [18, -150, 6.5], [14, -100, 5.5], [30, -40, 5], [22, 30, 5.5], [20, 64, 6], [8, 112, 8], [0, 150, 11], [0, 198, 23], [-6, 250, 30], [-30, 300, 31.5], [-12, 360, 33], [0, 420, 36], [0, 452, 39], [0, 486, 41]];
/* distance to the road polyline + the road's own height there */
LIM.road = function (x, z, out) {
  const P = LIM.ROAD; let bd = 1e9, by = 0;
  for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < bd) { bd = d; by = a[2] + (b[2] - a[2]) * (t * t * (3 - 2 * t)); } }
  out.d = bd; out.y = by; return out;
};
LIM._r = { d: 0, y: 0 };
LIM.WATER = -1.3;
LIM.BLUFF = [-142, -198];
LIM.FJORD = [[-170, -380], [-118, -322], [-96, -272], [-76, -232], [-64, -200]];
LIM.seg = function (x, z, P) { let bd = 1e9; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); bd = Math.min(bd, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return bd; };
/* rocky knolls in the open fields (kept off the road and every built place) */
LIM.knoll = function (x, z, rd) {
  let k = smooth(0.6, 0.72, fbm2(x * 0.019 + 31, z * 0.019 + 4, 3)) * smooth(11, 30, rd); if (k <= 0) return 0;
  for (const c of LIM.CLEAR) k *= smooth(c[2], c[2] + 16, Math.hypot(x - c[0], z - c[1]));
  return k;
};
LIM.wob = (a, b) => clamp((fbm2(a, b, 2) - 0.5) * 3.4, -1, 1);   // (fbm sits in a narrow band round 0.5: stretch it to ±1)
LIM.wC = (x) => LIM.wob(x * 0.012 + 9, 4.4) * 30 * smooth(30, 110, Math.abs(x));
LIM.h = function (x, z) {
  const n1 = fbm2(x * 0.0062 + 11, z * 0.0062 + 5, 4) - 0.5, n2 = fbm2(x * 0.028 + 7, z * 0.028, 3) - 0.5, n3 = fbm2(x * 0.11, z * 0.11 + 3, 2) - 0.5;
  let h = 5.5 + n1 * 19 + n2 * 4.6 + n3 * 0.7;
  const jag = (fbm2(x * 0.05 + 3, z * 0.05, 3) - 0.5) * 22 + (fbm2(x * 0.19, z * 0.19 + 9, 2) - 0.5) * 5;
  // the southern height where the graveyard door opens
  { const d = Math.hypot(x * 0.82, z + 310), k = 1 - smooth(38, 60, d + jag * 0.5); h = lerp(h, 27 + n3 * 0.6, k); }
  // Agheel Lake
  { const d = Math.hypot(x - 190, (z + 70) * 1.15); h -= 11 * (1 - smooth(34, 100, d + jag * 0.4)); const dr = Math.hypot(x - 176, z + 112); h = Math.max(h, lerp(h, -0.55 + n3 * 0.5 + n2 * 0.3, 1 - smooth(21, 36, dr + jag * 0.2))); }   // (the burnt ruins stand on a shoal at the lake's edge)
  // Stormhill: the land north of the gate stands a cliff higher
  // (the scarps, the coast and the crag wander: each line is pushed about by a slow noise that dies away near the road and the built places)
  const ax = Math.abs(x), wN = LIM.wob(x * 0.011 + 7, 3.3) * 44 * smooth(26, 110, ax), wC = LIM.wC(x);
  const north = smooth(152, 186, z + jag * 0.55 - ax * 0.03 + wN);
  h += north * 25;
  // the western scarp (Groveside Cave is cut into it)
  const wW = LIM.wob(z * 0.011 + 3, 9.1) * 40 * smooth(-150, -90, z) * smooth(36, 110, Math.abs(z + 40));
  const west = smooth(-168, -196, x + jag * 0.5 + wW); h += west * 30;
  // the sea: Limgrave ends in cliffs to the south and east
  const wS = (LIM.wob(x * 0.013 + 2, 6.6) * 0.5 + 0.5) * 70 * smooth(84, 160, ax) * (1 - smooth(-200, -110, x) * (1 - smooth(-110, -60, x))), wE = LIM.wob(z * 0.012 + 5, 1.7) * 28;
  const sea = Math.max(smooth(-338, -356, z + jag * 0.35 - wS), smooth(306, 330, x + jag * 0.4 + wE) * (1 - smooth(120, 200, z)));
  h -= sea * 70;
  // mountains east of Stormhill, the wall of the world to the west
  h += smooth(250, 340, x + jag * 0.5 + wE) * smooth(120, 210, z) * 46 + smooth(-268, -340, x + wW * 0.6) * 26;
  // the crag Stormveil stands on
  const crag = smooth(458, 484, z + jag * 0.45 + wC); h += crag * (56 + n2 * 10);
  // the fjord: an arm of the sea under the First Step, and the castle crag standing out of it on two rock terraces
  { const dF = LIM.seg(x, z, LIM.FJORD) + n3 * 3 + n2 * 5; h = Math.min(h, lerp(h, -14 + smooth(0, 20, dF) * 3, 1 - smooth(24, 36, dF))); }
  { const B = LIM.BLUFF, bx = (x - B[0]) / 52, bz = (z - B[1]) / 46, rr = Math.hypot(bx, bz) + (fbm2(x * 0.045 + 13, z * 0.045 + 2, 3) - 0.5) * 0.34 + (fbm2(x * 0.16, z * 0.16 + 5, 2) - 0.5) * 0.08;
    if (rr < 1.2) { const k1 = 1 - smooth(0.9, 1.0, rr), k2 = 1 - smooth(0.54, 0.61, rr); h = Math.max(h, lerp(h, 32 + n3 * 1.2, k1)); h = Math.max(h, lerp(h, 58 + n3 * 0.6, k2)); } }
  // the road: flattened to its own grade; a cutting where it climbs the Stormgate and at the tunnel mouth
  const R0 = LIM.road(x, z, LIM._r), gate = smooth(140, 162, z) * (1 - smooth(236, 262, z)), tun = smooth(440, 462, z);
  const w0 = lerp(lerp(3.2, 6.5, gate), 4.6, tun), w1 = lerp(lerp(17, 12.5, gate), 9.5, tun);
  { const kn = LIM.knoll(x, z, R0.d) * (1 - north) * (1 - sea); h += kn * (6 + n2 * 9) + smooth(0.5, 1, kn) * 3.5; }   // crags breaking through the turf
  h = lerp(h, R0.y + n3 * 0.25, 1 - smooth(w0, w1, R0.d + (gate + tun > 0.1 ? jag * 0.12 : 0)));
  if (x > -200 && x < 130 && z > -130 && z < -30) { const zr = -78 + 13 * Math.sin(x * 0.021 + 0.4), d = Math.abs(z - zr) + n3 * 2.5, ends = smooth(-200, -168, x); h = Math.min(h, lerp(h, -2.15 + smooth(0, 9, d) * 0.75, (1 - smooth(10, 16, d)) * ends)); }
  return h;
};
LIM.paint = function (x, z, h, ny) {
  const R0 = LIM.road(x, z, LIM._r), n = fbm2(x * 0.3, z * 0.3, 2) - 0.5;
  const road = 1 - smooth(1.5, 3.3, R0.d + n * 1.6);
  const shore = 1 - smooth(LIM.WATER + 0.1, LIM.WATER + 1.2, h + n * 0.5);
  const crag = Math.max(smooth(470, 492, z + LIM.wC(x)) * 0.75, z < 150 ? LIM.knoll(x, z, R0.d) * 0.15 : 0);
  return [Math.max(road, shore), crag, 0];
};
LIM.ok = (G, x, z, o) => { o = o || {}; const h = G.hf(x, z); if (h === null) return false; const R0 = LIM.road(x, z, LIM._r); if (R0.d < (o.road || 6)) return false; if (h < LIM.WATER + 0.5) return false;
  const e = 1.5, sl = Math.hypot(G.hf(x + e, z) - G.hf(x - e, z), G.hf(x, z + e) - G.hf(x, z - e)) / (2 * e); return sl < (o.slope || 0.42); };
LIM.CLEAR = [[0, -300, 30], [-46, -150, 22], [26, 66, 34], [0, 180, 30], [-36, 304, 12], [176, -112, 26], [-170, -40, 14], [0, 470, 20], [22, -68, 24], [-142, -198, 72]];
LEVEL.def('limgrave', {
  get photo() { return AST.BASE_SETS; },
  models: ['cliffA', 'cliffB', 'cliffC', 'cliffD', 'cliffE', 'bld1', 'bld2', 'bld3', 'bld4', 'bld5', 'ms1a', 'ms2a', 'fern_a', 'shrub_a', 'statueGothic', 'barrel1', 'barrel2', 'crate', 'chest', 'firepit', 'stump', 'deadTrunk', 'doorFrame', 'gateR'],
  chapter: 'LIMGRAVE', name: 'LIMGRAVE', region: 'THE LANDS BETWEEN', world: 'limgrave', mount: true,
  cast: ['soldier', 'footman', 'knight', 'noble', 'troll', 'sentinel', 'varre', 'kale'],
  tex: ['grass', 'dirt', 'cliff', 'ashlar', 'flag', 'planks', 'bark', 'steel', 'gold'],
  start: [0, null, -300, -0.3], checkpoints: [[1, null, -289, -0.3], [-36, null, -142, 2.2], [42, null, 82, -2.4], [-36, null, 309, 2.6], [-160, null, -40, 1.6], [0, null, 458, PI]], killY: -18,
  title: { at: [-13, null, -281, -0.75], cam: (t, a) => { const u = Math.sin(t * 0.07) * 0.5, fx = Math.sin(-0.68), fz = Math.cos(-0.68), rx = -fz, rz = fx, px = a.x - fx * 4.3 + rx * (1.1 + u * 0.4), pz = a.z - fz * 4.3 + rz * (1.1 + u * 0.4); return { pos: V3(px, a.y + 1.75 + Math.sin(t * 0.11) * 0.08, pz), look: V3(a.x + fx * 30 + rx * 5.5, a.y + 5.2, a.z + fz * 30 + rz * 5.5), fov: 56 }; } },
  async build(L) {
    KIT.cellSize = 150;   // an open country seen whole from its heights: big batches, few draw calls
    WORLD.sky(L, {});
    const G = await TERRAIN.grid(LIM.h, -340, -360, 340, 560, 2, TERRAIN.limMat('lim', { rockTint: 0xa39c90 }), { paint: LIM.paint, chunk: 64, progress: (p) => MG.loadUI(0.56 + p * 0.3, 'Raising Limgrave') });
    L.G = G; const M = WORLD.M(), gy = WORLD.gy, rs = MG.rs('limgrave');
    WORLD.erdtree(L, {}); WORLD.motes(L, { rate: 9 });
    WORLD.grass(L, G, { mask: (x, z, h) => (h < LIM.WATER + 0.6 ? 0 : 1) * (z + LIM.wC(x) > 470 ? 0 : 1) });
    WORLD.water(L, 100, -130, 330, 60, LIM.WATER); WORLD.water(L, -290, -350, 0, -150, -7, { color: 0x3a5660, opacity: 0.9 }); WORLD.water(L, -1700, -1700, 1700, -330, -24, { color: 0x1c3444, opacity: 0.96 }); WORLD.water(L, 300, -330, 1700, 204, -24, { color: 0x1c3444, opacity: 0.96 });
    // ---- trees: green oaks and the gold-leafed trees of Limgrave; thicker in the Mistwood to the east
    const trees = [], GREEN = [0x4f5c2c, 0x5c6832, 0x47542a, 0x66703a], GOLD = [0x9c8236, 0xa88c3a, 0x8a7230, 0xb09a48], clear = (x, z) => LIM.CLEAR.some((c) => Math.hypot(x - c[0], z - c[1]) < c[2]);
    for (let i = 0; i < 6000 && trees.length < 620; i++) {
      const x = -320 + rs() * 640, z = -340 + rs() * 780, dens = 0.3 + 0.6 * smooth(80, 200, x) * smooth(-10, 60, z) * (1 - smooth(150, 190, z)) + 0.3 * smooth(0.52, 0.7, fbm2(x * 0.012, z * 0.012 + 4, 2));
      if (rs() > dens || clear(x, z) || !LIM.ok(G, x, z, { road: 7.5 })) continue;
      const hill = z > 190; trees.push([x, z, (hill ? 0.9 : 1.1) + rs() * rs() * 1.1, rs() * TAU, rs() < (hill ? 0.12 : 0.24) ? GOLD[rs() * 4 | 0] : GREEN[rs() * 4 | 0]]);
    }
    WORLD.trees(L, trees, { kinds: 3 });
    const dead = []; for (let i = 0; i < 400 && dead.length < 26; i++) { const x = -200 + rs() * 400, z = 200 + rs() * 250; if (!clear(x, z) && LIM.ok(G, x, z, { road: 6 })) dead.push([x, z, 0.6 + rs() * 0.5, rs() * TAU]); }
    WORLD.trees(L, dead, { kinds: 2, bare: true, seed: 50 });
    // ---- limestone: boulders in the fields, outcrops under the cliffs
    const rock = TERRAIN.cliffMat(0xd6d0c2);
    for (let i = 0; i < 150; i++) { const x = -320 + rs() * 640, z = -340 + rs() * 880; if (clear(x, z) || G.hf(x, z) < LIM.WATER || LIM.road(x, z, LIM._r).d < 5) continue; const r = 0.6 + rs() * rs() * 3.4; TERRAIN.rock(x, z, r, r * (0.7 + rs() * 1.3), i * 53 + 11, rock, { stretch: 1 + rs() * 0.5, detail: r > 2 ? 4 : 3 }); }
    // ================= the Stranded Graveyard door + the First Step
    { const y = gy(0, -316);
      KIT.box(-7, y - 3, -332, 7, y + 8.5, -318, M.wall); KIT.box(-8, y + 8.5, -333, 8, y + 9.6, -317, M.wall, { col: false });
      WORLD.arch(0, -317.5, 0, 3.2, 3.4, 1.6, { y: y - 0.3, top: 9 }); KIT.box(-1.6, y, -318.6, 1.6, y + 5.4, -318.2, M.iron, { col: false });
      for (const s of [-1, 1]) { WORLD.column(s * 4.6, -315.5, 6.2, 0.5); WORLD.column(s * 4.6, -310, 4 + s, 0.5, { broken: s < 0 }); }
      KIT.box(-3.2, y - 0.6, -317, 3.2, y + 0.12, -306, M.floor);
      for (let i = 0; i < 7; i++) { const x = (i - 3) * 5.5 + (rs() - 0.5) * 3, z = -300 + (rs() - 0.5) * 16; if (Math.abs(x) < 3.5) continue; KIT.rbox(x, gy(x, z) + 0.5, z, 0.32, 0.7, 0.1, (rs() - 0.5) * 0.3, rs() * PI, (rs() - 0.5) * 0.4, M.dark, 0.04); }   // leaning gravestones
      WORLD.wall(-22, -296, -22, -324, { h: 2.2, ragged: 0.7, t: 0.8 }); WORLD.wall(22, -292, 22, -324, { h: 2.6, ragged: 0.8, t: 0.8 });
    }
    WORLD.grace(L, 0, 1.5, -286.5, 'THE FIRST STEP', [24, -240]);
    WORLD.message(L, 9, -271, 'Seek grace'); WORLD.message(L, -7, -276, 'Be wary of horse'); WORLD.message(L, 26.5, -236, 'Try jumping');
    // ================= the Church of Elleh
    { const cx = -46, cz = -152, y = gy(cx, cz) - 0.4, o = { h: 7, ragged: 0.55, t: 1.0, y };
      KIT.box(cx - 8, y - 2, cz - 12, cx + 8, y + 0.12, cz + 12, M.floor);
      WORLD.wall(cx - 8, cz - 12, cx - 8, cz + 12, o); WORLD.wall(cx + 8, cz - 12, cx + 8, cz + 12, Object.assign({}, o, { gap: [[0.56, 0.74]] })); WORLD.wall(cx - 8, cz - 12, cx + 8, cz - 12, Object.assign({}, o, { h: 9, ragged: 0.4 })); WORLD.wall(cx - 8, cz + 12, cx + 8, cz + 12, Object.assign({}, o, { gap: [[0.36, 0.64]] }));
      WORLD.arch(cx, cz + 12, HALF, 4.2, 3.6, 1.0, { y });
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) WORLD.column(cx + s * 4.6, cz - 7 + k * 6.5, k === 1 && s > 0 ? 2.4 : 5.2, 0.45, { y, broken: k === 1 && s > 0 });
      KIT.box(cx - 2.2, y, cz - 10.6, cx + 2.2, y + 1.1, cz - 9.2, M.wall); KIT.box(cx - 0.6, y + 1.1, cz - 10.2, cx + 0.6, y + 3.6, cz - 9.6, M.dark, { col: false });   // altar + broken statue
      KIT.box(cx + 4.4, y, cz + 2, cx + 6.2, y + 0.95, cz + 3.2, M.wood); KIT.box(cx + 5.0, y + 0.95, cz + 2.3, cx + 5.7, y + 1.25, cz + 2.9, M.iron, { col: false });       // the smithing table and anvil
      L.fireElleh = WORLD.campfire(L, cx - 3, cz + 3);
      L.kalePos = [cx - 4.4, cz + 4.2, 2.3];
    }
    WORLD.grace(L, 1, -37.5, -140.5, 'CHURCH OF ELLEH', [14, -100]);
    // ================= Gatefront Ruins: Godrick's soldiers camp among the broken walls
    { const cx = 22, cz = 62;
      WORLD.wall(cx - 26, cz - 14, cx - 8, cz - 20, { h: 5, ragged: 0.7 }); WORLD.wall(cx + 8, cz - 22, cx + 24, cz - 14, { h: 6, ragged: 0.6 }); WORLD.wall(cx + 26, cz - 10, cx + 28, cz + 12, { h: 4.5, ragged: 0.8 });
      WORLD.wall(cx - 28, cz - 6, cx - 27, cz + 16, { h: 5.5, ragged: 0.6 }); WORLD.wall(-8, 84, 10.4, 86.4, { h: 4, ragged: 0.8 }); WORLD.wall(19.6, 86.2, 40, 81, { h: 5, ragged: 0.7 });
      WORLD.arch(cx - 1, cz - 22, 0.2, 5, 4.2, 1.2, { top: 7.5, solidTop: true }); WORLD.arch(15, 86.6, -0.12, 5.2, 4.2, 1.2, {});
      for (const [x, z] of [[cx - 16, cz - 2], [cx + 14, cz + 4], [cx - 10, cz + 12], [cx + 15, cz - 8]]) LIM.tent(L, x, z, rs() * TAU);
      L.fireGate = WORLD.campfire(L, cx - 2, cz + 2);
      L.gateStores = [[cx - 8, cz - 12, 'stores'], [cx + 9, cz + 14, 'stores'], [cx - 18, cz + 10, 'stores']];   // (dressed with scanned barrels and crates in p69)
      for (const [x, z, a] of [[cx - 6, cz - 21, 0.2], [cx + 5, cz - 21.6, 0.2], [cx - 13, cz + 24.2, 3.0]]) { const y = gy(x, z); KIT.cyl(x, y, z, 0.06, 6.4, M.wood, { seg: 6 }); WORLD.banner(L, x + 0.45 * Math.cos(a), y + 6.2, z - 0.45 * Math.sin(a), a, 0.9, 2.6); }
    }
    WORLD.grace(L, 2, 44.5, 84.5, 'GATEFRONT', [8, 112]);
    // ================= the Stormgate
    { for (const s of [-1, 1]) { const x = s * 14, z = 174; WORLD.tower(x, z, 5.2, 21 - s * 4, { y: gy(x, z) - 4, windows: 3, wa: s > 0 ? 3.6 : 2.6 }); WORLD.wall(x + s * 5, z, x + s * 24, z + 5, { h: 9, ragged: 0.6, t: 1.6 }); }
      WORLD.wall(-9.5, 174, -5.5, 174, { h: 13, t: 2, ragged: 0.3 }); WORLD.wall(5.5, 174, 9.5, 174, { h: 12, t: 2, ragged: 0.4 });
      for (const [x, z, a] of [[-8, 168, 0], [8, 168, 0]]) { const y = gy(x, z); KIT.cyl(x, y, z, 0.07, 7.5, M.wood, { seg: 6 }); WORLD.banner(L, x + 0.5, y + 7.3, z, a, 1.0, 3.2); }
      WORLD.brazier(L, -5.2, 166); WORLD.brazier(L, 5.4, 166.5);
    }
    // ================= Stormhill Shack
    { const cx = -38, cz = 300, y = gy(cx, cz) - 0.2;
      KIT.box(cx - 3.5, y - 1.5, cz - 4, cx + 3.5, y + 0.14, cz + 4, M.wood);
      for (const [x, z] of [[-3.3, -3.8], [3.3, -3.8], [-3.3, 3.8], [3.3, 3.8]]) KIT.box(cx + x - 0.14, y, cz + z - 0.14, cx + x + 0.14, y + 3, cz + z + 0.14, M.wood);
      KIT.box(cx - 3.5, y, cz - 4, cx + 3.5, y + 2.6, cz - 3.8, M.wood); KIT.box(cx - 3.5, y, cz - 4, cx - 3.3, y + 2.6, cz + 4, M.wood); KIT.box(cx + 3.3, y, cz - 4, cx + 3.5, y + 1.3, cz + 0.5, M.wood);
      KIT.rbox(cx - 1.8, y + 3.5, cz, 2.3, 0.07, 4.5, 0, 0, 0.5, M.wood, 0.02); KIT.rbox(cx + 1.8, y + 3.5, cz, 2.3, 0.07, 4.5, 0, 0, -0.5, M.wood, 0.02);
      WORLD.torch(L, cx + 3.3, y + 2.2, cz + 3.9, 0);
    }
    WORLD.grace(L, 3, -33, 306, 'STORMHILL SHACK', [-12, 360]);
    // ================= Dragon-Burnt Ruins by the lake
    { const cx = 176, cz = -112;
      WORLD.wall(cx - 18, cz - 10, cx - 4, cz - 14, { h: 4.5, ragged: 0.8 }); WORLD.wall(cx + 2, cz - 12, cx + 18, cz - 6, { h: 5.5, ragged: 0.7 }); WORLD.wall(cx - 16, cz + 8, cx - 2, cz + 12, { h: 3.5, ragged: 0.9 }); WORLD.wall(cx + 6, cz + 10, cx + 20, cz + 6, { h: 5, ragged: 0.7 });
      WORLD.arch(cx, cz + 11, 0.1, 4, 3.6, 1.1, {}); for (let i = 0; i < 6; i++) WORLD.column(cx - 12 + i * 5 + rs() * 2, cz - 2 + (i % 2) * 5, 1.5 + rs() * 4, 0.42, { broken: rs() < 0.6 });
    }
    // ================= Groveside Cave mouth, in the western scarp
    { const x = -176, z = -40, y = gy(-168, z);
      for (const [dz, r, hh] of [[-5.5, 3.6, 8], [5.5, 3.8, 9], [0, 4.4, 4]]) TERRAIN.rock(x - 1, z + dz, r, hh, 400 + (dz | 0), rock, { y: dz === 0 ? y + 5.2 : y - 1, col: dz !== 0, stretch: 1.3 });
      const hole = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), new THREE.MeshBasicMaterial({ color: 0x020202, fog: false })); hole.position.set(x + 2.4, y + 1.6, z); hole.rotation.y = HALF; hole.scale.y = 1.25; LEVEL.add(hole);
      WORLD.torch(L, x + 4.4, y + 2.4, z - 3.4, HALF);
      WORLD.interact(L, V3(x + 5.5, y + 1.2, z), 4.2, IN.keyLabel('grip') + ' ENTER GROVESIDE CAVE', () => GAME.travel('cave', 0));
    }
    // ================= the Castleward Tunnel, under the crag
    { const z = 478, y = gy(0, 470);
      WORLD.arch(0, z, 0, 6.5, 5.5, 3, { y: y - 0.5, top: 16, solidTop: true }); for (const s of [-1, 1]) WORLD.tower(s * 9.5, z + 1, 4, 22, { y: y - 3, windows: 2, wa: 2.9 });
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 9), new THREE.MeshBasicMaterial({ color: 0x030303, fog: false })); hole.position.set(0, y + 4.2, z + 1.2); hole.rotation.y = PI; LEVEL.add(hole);
      PHY.box(-4, y - 2, z + 1, 4, y + 12, z + 3);
      WORLD.brazier(L, -4.6, z - 3); WORLD.brazier(L, 4.6, z - 3);
      WORLD.interact(L, V3(0, y + 1.2, z - 2.5), 4.5, IN.keyLabel('grip') + ' ENTER THE CASTLEWARD TUNNEL', () => GAME.travel('margit', 0), { riding: true });
    }
    LIM.farCastle(L, G);
  },
  onStart(L, cp) {
    if (MG.titleMode) return;
    const s = GAME.save, gy = WORLD.gy;
    L.dispose = () => { for (const n of (L.npcs || [])) n.dispose(); };
    HUD.obj(s.torrent ? 'North, through the Stormgate, to the castle on the crag' : 'Follow the guidance of grace north');
    // ---- people
    WORLD.npc(L, 'varre', -5.5, -281, 2.4, 'WHITE-FACED VARRÉ', ['Ah… a Tarnished. Come for the Ring, like all the rest of them?', 'A pity. No maiden walks beside you — and without one, what can grace do for you?', 'Still. Follow its light north. It leads to Stormveil Castle… and to Godrick the Grafted.']);
    WORLD.npc(L, 'kale', L.kalePos[0], L.kalePos[1], L.kalePos[2], 'MERCHANT KALÉ', ['Kalé is the name. I am a purveyor of fine goods. Rest by the fire, friend.', 'A gilded knight rides the road below the graveyard. Many who came through that door met him first, and last.', 'North lies the Stormgate. Godrick’s men hold it — and they keep a troll.'], { sit: true });
    // ---- foes
    const sp = WORLD.spawn;
    // wandering nobles on the road and at the lake ruins
    for (const [x, z] of [[20, -176], [24, -172], [10, -118], [170, -108], [178, -116], [184, -106], [166, -120], [150, -96]]) sp('noble', x, z, { yaw: rnd(0, TAU) });
    // Gatefront: the camp
    sp('soldier', 16, 54, { yaw: 2.8 }); sp('soldier', 26, 60, { yaw: -1.5, patrol: [[26, 60], [8, 52], [10, 76], [30, 74]] }); sp('footman', 12, 70, { yaw: 1 }); sp('footman', 34, 52, { yaw: -2 });
    sp('soldier', 22, 42, { yaw: PI, patrol: [[22, 42], [24, 20], [20, 42]] }); sp('archer', 40, 64, { yaw: -HALF }); sp('archer', 2, 80, { yaw: 2.2 }); sp('knight', 24, 78, { yaw: PI, patrol: [[24, 78], [14, 82], [30, 84]] });
    // the road to the gate
    sp('footman', 8, 124, { yaw: PI }); sp('soldier', 3, 128, { yaw: PI });
    // the Stormgate: the garrison, crossbows on the banks, and the troll they keep
    sp('soldier', -3, 164, { yaw: PI }); sp('soldier', 4, 166, { yaw: PI }); sp('footman', 0, 184, { yaw: PI }); sp('archer', -20, 180, { yaw: 2.6 }); sp('archer', 21, 182, { yaw: -2.6 }); sp('troll', -2, 214, { yaw: PI });
    sp('soldier', -4, 240, { yaw: PI }); sp('knight', 2, 246, { yaw: PI });
    // Stormhill: wolves on the wind, patrols on the castle road
    for (const [x, z] of [[24, 322], [30, 328], [20, 334], [34, 318], [-60, 384], [-54, 392], [-66, 378]]) sp('wolf', x, z, { yaw: rnd(0, TAU) });
    sp('soldier', -14, 356, { yaw: PI, patrol: [[-14, 356], [-2, 400], [-20, 372]] }); sp('footman', -10, 362, { yaw: PI }); sp('archer', 14, 412, { yaw: PI });
    sp('knight', -3, 446, { yaw: PI }); sp('footman', 4, 442, { yaw: PI }); sp('soldier', -6, 440, { yaw: PI });
    sp('wolf', -150, -52, {}); sp('wolf', -146, -30, {});
    // ---- the Tree Sentinel on the road below the First Step
    const TS = WORLD.boss(L, 'sentinel', () => { const b = new Sentinel(13, -198, { yaw: 0.2, patrol: [[18, -150], [14, -110], [18, -150], [13, -204]] }); b.onEngage = () => TS.engage(); b.onLeash = () => { TS.engaged = false; HUD.setBoss(null); }; return b; },
      { name: 'Tree Sentinel', onDefeat: () => { HUD.obj('The road north is open'); WORLD.item(L, 14, -160, { id: 'tsHalberd', give: [['golden_halberd', 1], ['set_sentinel', 1], ['seed', 1]], respawn: false }); } });
    // ---- things to find
    WORLD.item(L, -44, -160, { name: 'Golden Rune [1]', runes: 200 }); WORLD.item(L, 178, -110, { name: 'Golden Rune [2]', runes: 400 }); WORLD.item(L, 26, 70, { name: 'Golden Rune [1]', runes: 200 });
    WORLD.item(L, -40, 298, { give: [['seed', 1]] }); WORLD.item(L, 0, 228, { name: 'Golden Rune [3]', runes: 600 }); WORLD.item(L, 190, -142, { name: 'Golden Rune [2]', runes: 400, y: gy(190, -142) });
    WORLD.message(L, 18, 28, 'Ambush ahead, therefore try stealth'); WORLD.message(L, -3, 150, 'Giant ahead'); WORLD.message(L, 2, 432, 'Praise the Erdtree!');
    // ---- grace at Gatefront: Melina and the steed
    const gf = L.graces.find((g) => g.cp === 2);
    gf.onLeave = () => { if (s.torrent) return; s.torrent = true; GAME.store(); HUD.sub('MELINA', 'Traveller from beyond the fog — take this ring. Whistle, and the spectral steed Torrent will carry you.', 6);
      MG.after(1.2, () => HUD.item('Spectral Steed Whistle', 'Press X to summon Torrent')); HUD.obj('North, through the Stormgate, to the castle on the crag'); };
    // ---- the names of places
    const area = (x0, z0, x1, z1, name) => LEVEL.trigger(x0, z0, x1, z1, () => HUD.area(name));
    area(-70, -176, -24, -126, 'CHURCH OF ELLEH'); area(-10, 30, 56, 96, 'GATEFRONT RUINS'); area(-30, 150, 30, 200, 'STORMGATE'); area(-80, 262, 60, 290, 'STORMHILL'); area(140, -150, 230, -60, 'AGHEEL LAKE');
    if (cp === 0 && !MG.test) {
      HUD.area('LIMGRAVE');
      LEVEL.establish(L, cp, { dur: 7, fov: 40, p0: V3(-5, gy(0, -300) + 2.2, -310), p1: V3(-2.6, gy(0, -300) + 2.6, -304.5), l0: V3(4, gy(0, -300) + 3, -260), l1: V3(22, gy(0, -300) + 10, -250) });
      MG.after(7.4, () => HUD.hint('<kbd>W A S D</kbd> move · <kbd>LMB</kbd> attack · tap <kbd>SHIFT</kbd> roll · <kbd>F</kbd> touch grace', 9));
    } else if (!MG.test && cp !== 4) HUD.area('LIMGRAVE');
  },
});
/* a soldier's tent: ridge pole and two sloped canvas sides */
LIM.tent = function (L, x, z, yaw) {
  const y = WORLD.gy(x, z), M = WORLD.M(), cloth = LIM._tm || (LIM._tm = new THREE.MeshStandardMaterial({ color: 0x8a7a5e, roughness: 0.95, side: THREE.DoubleSide })); cloth.userData.tscale = 2; if (TEX.sets.hessian && !cloth.map) { cloth.map = TEX.sets.hessian.map; cloth.normalMap = TEX.sets.hessian.normalMap; cloth.color.set(0xd8ccb0); cloth.userData.tscale = 0.6; }
  const c = Math.cos(yaw), s = Math.sin(yaw), P = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
  for (const sd of [-1, 1]) { KIT.quad(cloth, P(sd * 1.7, 0, -1.8), P(sd * 1.7, 0, 1.8), P(0, 2.0, 1.8), P(0, 2.0, -1.8), [sd * 0.76 * c, 0.65, -sd * 0.76 * s], (p) => [p[0], p[1]]); }
  KIT.quad(cloth, P(-1.7, 0, -1.8), P(0, 2.0, -1.8), P(1.7, 0, -1.8), P(0, 0, -1.8), [-s, 0, -c], (p) => [p[0], p[1]]);
  KIT.beam(P(0, 2.02, -2.0), P(0, 2.02, 2.0), 0.08, M.wood); KIT.beam(P(0, 0, 1.8), P(0, 2.02, 1.8), 0.08, M.wood);
  PHY.obox(x, z, 1.5, 1.7, y, y + 1.6, yaw);
};
/* Stormveil on its crag: the silhouette every road in Limgrave points at */
LIM.farCastle = function (L, G) {
  const M = WORLD.M(), mat = M.dark, top = (x, z) => (G.hf(x, Math.min(z, 558)) || 90);
  const T = (x, z, r, h, roof) => WORLD.tower(x, z, r, h, { y: top(x, z) - 6, mat, roof, windows: 3, lit: true, wa: 2.6 });
  for (const [x, z, r, h, roof] of [[-46, 520, 7, 34, 1], [44, 524, 7.5, 40, 1], [-90, 532, 6, 26, 0], [92, 536, 6.5, 30, 0], [0, 548, 11, 62, 1], [-22, 540, 6, 44, 1], [26, 544, 6, 50, 1], [-130, 540, 5.5, 22, 1], [132, 546, 5.5, 24, 0]]) T(x, z, r, h, roof);
  const y0 = Math.min(top(-46, 520), top(44, 524)) - 6;
  for (const [ax, az, bx, bz, h] of [[-46, 520, 44, 524, 20], [-90, 532, -46, 520, 16], [44, 524, 92, 536, 18], [-130, 540, -90, 532, 14], [92, 536, 132, 546, 14]]) WORLD.curtain(ax, az, bx, bz, y0, Math.min(top(ax, az), top(bx, bz)) + h, 3.4, { mat });
  KIT.box(-16, y0, 536, 16, top(0, 548) + 38, 556, mat, { col: false }); KIT.box(-9, top(0, 548) + 38, 538, 9, top(0, 548) + 50, 554, mat, { col: false });
};
/* a talking NPC: stands (or sits) where placed; F cycles through its lines */
WORLD.npc = function (L, tpl, x, z, yaw, name, lines, o) {
  o = o || {}; const y = WORLD.gy(x, z);
  const a = new Actor(CHAR.T[tpl], { x, y, z, yaw, moves: o.sit ? MOV.sitter : MOV.stander, team: 'npc' }); a.base = 'idle'; a.npc = true;
  if (o.sit) a.y = y - 0.42;
  (L.npcs = L.npcs || []).push(a); let i = 0;
  L.updates.push((dt) => { const P = PLAYER.a; if (P && Math.hypot(P.x - a.x, P.z - a.z) > 70) return; if (!o.sit && P) { const d = wrapA(a.angTo(P) - a.yaw); a.lookYaw = clamp(d, -0.7, 0.7) * (Math.abs(d) < 1.6 ? 1 : 0); } a.animate(dt); a.pose3D(dt); });
  WORLD.interact(L, V3(x, y + 1.1, z), 2.8, IN.keyLabel('grip') + ' TALK', () => { HUD.sub(name, lines[i % lines.length], Math.max(4, lines[i % lines.length].length * 0.07)); i++; });
  PHY.cyl(x, z, 0.4, y - 1, y + 1.8);
  return a;
};
