/* ==== p63_lvl_stormveil.js ==== */
/* STORMVEIL CASTLE — three baileys climbing the crag: the gate ward, the rampart court (a banished knight, a chained
   troll), the secluded court; and beyond the last mist, the yard of graves where Godrick the Grafted holds court. */
const STV = { W: 36 };
STV.floor = function (x, z) {
  let y = 0;
  if (z > 84) y = 9; else if (z > 64 && Math.abs(x) <= 8.5) y = (z - 64) / 20 * 9;
  if (z > 174) y = 19; else if (z > 152 && x >= 11.5 && x <= 28.5) y = 9 + (z - 152) / 22 * 10;
  return y;
};
STV.h = function (x, z) {
  const jag = (fbm2(x * 0.06 + 3, z * 0.06, 3) - 0.5) * 12 + (fbm2(x * 0.25, z * 0.25, 2) - 0.5) * 2, ax = Math.abs(x);
  const inside = ax < STV.W + 1.5 && z > -3 && z < 268;
  if (inside) return STV.floor(x, z);
  const base = STV.floor(clamp(x, -STV.W, STV.W), clamp(z, 0, 266)), out = Math.max(ax - STV.W - 1.5, -3 - z, z - 268, 0);
  if (z < -3 && ax < 9) return 0 - smooth(40, 70, -z) * 30;                      // the gate road falling away south
  if (z > 268) return base + 6 + jag * 0.6 + Math.min(30, out * 0.8);              // the crag goes on rising behind the keep
  return base - 4 - smooth(2, 14, out + jag * 0.3) * (70 + jag * 2);
};
LEVEL.def('stormveil', {
  get photo() { return AST.BASE_SETS; },
  models: ['cliffA', 'cliffB', 'cliffC', 'cliffD', 'cliffE', 'bld1', 'bld2', 'bld3', 'bld4', 'bld5', 'ms1a', 'ms2a', 'barrel1', 'barrel2', 'crate', 'statueGothic'],
  chapter: 'STORMVEIL', name: 'STORMVEIL CASTLE', region: 'STORMHILL', world: 'stormveil', mount: false,
  cast: ['exile', 'banished', 'knight', 'troll', 'godrick'],
  tex: ['grass', 'dirt', 'cliff', 'ashlar', 'flag', 'planks', 'bark', 'steel', 'gold'],
  start: [0, 0, 6, 0], checkpoints: [[0, 0, 7, 0], [-25, 9, 99, 1.2], [20, 19, 187, -1.6], [0, 19, 232, 0]], killY: -30,
  async build(L) {
    WORLD.sky(L, { storm: 0.6, sun: new THREE.Vector3(-0.5, 0.6, -0.5), sunI: 4.6, hemi: 0.78, fog: 0.0036, vol: 0, exposure: 1.12, lights: 5 });
    const mat = TERRAIN.limMat('stv', { dirt: TEX.sets.cobble ? 'cobble' : 'flag', dirtSc: 2.6, scanDirt: 0xc8c4b8, tintA: 0x7c7c62, tintB: 0x8a8468, rockTint: 0xa8a49a, dirtTint: 0xc9c2b4 });
    const W = STV.W;
    const G = await TERRAIN.grid(STV.h, -120, -80, 120, 330, 2, mat, { paint: (x, z) => [Math.abs(x) < W + 2 && z > -70 && z < 270 ? 1 : 0, Math.abs(x) > W + 3 || z > 270 ? 1 : 0, 0], progress: (p) => MG.loadUI(0.56 + p * 0.3, 'Raising Stormveil') });
    L.G = G; const M = WORLD.M(), dk = M.dark, rs = MG.rs('stormveil'), F = STV.floor;
    WORLD.erdtree(L, { glow: 0.055 }); WORLD.motes(L, { rate: 5 });
    // ---- the outer curtain, stepping up with the baileys; drum towers at every turn
    const seg = [[-3, 84, 0, 14], [84, 174, 9, 23], [174, 268, 19, 34]];
    for (const [z0, z1, fl, top] of seg) for (const s of [-1, 1]) WORLD.curtain(s * (W + 1), z0, s * (W + 1), z1, fl - 30, top + 5, 3.2, { mat: dk, floor: () => fl });
    for (const [z, h] of [[-3, 24], [84, 34], [174, 44], [268, 56]]) for (const s of [-1, 1]) WORLD.tower(s * (W + 1), z, 6.5, h + 30, { y: F(0, Math.max(0, z - 1)) - 30, mat: dk, roof: z > 100, windows: 3, lit: true, wa: s > 0 ? 4.2 : 2.1 });
    // south gatehouse (the way in, shut behind you)
    WORLD.curtain(-W, -3, -5, -3, -30, 14, 3.2, { mat: dk, floor: () => 0 }); WORLD.curtain(5, -3, W, -3, -30, 14, 3.2, { mat: dk, floor: () => 0 }); KIT.box(-5, 8, -4.6, 5, 16, -1.4, dk); WORLD.arch(0, -3, 0, 7, 6, 3.2, { y: -0.5, mat: dk }); KIT.box(-3.6, 0, -3.4, 3.6, 7.6, -2.6, M.iron);
    for (const s of [-1, 1]) WORLD.banner(L, s * 6.6, 13, -1.2, 0, 2.2, 8);
    // retaining walls between the baileys (a parapet along each upper edge) and the two stairs
    const ret = (ax, bx, z, lo, hi) => { KIT.box(ax, lo - 3, z - 1.4, bx, hi + 0.02, z + 1.8, M.wall, { mats: { Y: M.floor } }); KIT.box(ax, hi, z - 1.4, bx, hi + 1.1, z - 0.8, M.wall); };
    ret(-W, -8, 84.6, 0, 9); ret(8, W, 84.6, 0, 9); ret(-W, 12, 174.6, 9, 19); ret(28, W, 174.6, 9, 19);
    const steps = (x0, x1, z0, z1, y0, y1) => { const n = Math.round((y1 - y0) / 0.25); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; KIT.box(x0, y0 + (y1 - y0) * t0 - 0.6, lerp(z0, z1, t0), x1, y0 + (y1 - y0) * t1 + 0.02, lerp(z0, z1, t1) + 0.02, M.floor, { col: false }); }
      for (const xx of [x0 - 0.9, x1]) KIT.box(xx, y0 - 2, z0, xx + 0.9, y1 + 1.2, z1, M.wall); };
    steps(-8, 8, 64, 84, 0, 9); steps(12, 28, 152, 174, 9, 19);
    // ---- the gate ward: barricades, stakes, a guard platform each side
    for (const s of [-1, 1]) { KIT.box(s * 30 - 5, 0, 30, s * 30 + 5, 3.6, 44, M.wall); KIT.box(s * 30 - 5 - s * 0, 3.6, 30, s * 30 + 5, 4.5, 30.5, M.wall, { col: false }); const sx = s * 24.4; for (let i = 0; i < 12; i++) KIT.box(sx - 0.6, 0, 31 + i * 1.0, sx + 0.6, 0.3 * (i + 1), 32 + i * 1.0, M.floor); }
    for (const [x, z, a] of [[-12, 22, 0.2], [10, 28, -0.3], [-4, 46, 0.1], [16, 52, 0.5]]) STV.barricade(x, z, a);
    for (const [x, z] of [[-18, 12], [18, 12], [-10, 58], [10, 58]]) WORLD.brazier(L, x, z, { y: 0 });
    KIT.box(-34, 0, 4, -24, 7, 18, M.wall); KIT.rbox(-29, 8.2, 11, 5.6, 0.2, 7.6, 0, 0, 0.0, M.roof, 0.05); KIT.box(24, 0, 50, 34, 6, 62, M.wall);
    // ---- the rampart court: a ruined chapel, the tower of the second grace, the troll's stake
    { const cx = 6, cz = 118, o = { h: 8, ragged: 0.5, t: 1.1, y: 9, mat: M.wall };
      WORLD.wall(cx - 9, cz - 11, cx - 9, cz + 11, o); WORLD.wall(cx + 9, cz - 11, cx + 9, cz + 11, Object.assign({}, o, { gap: [[0.4, 0.62]] })); WORLD.wall(cx - 9, cz + 11, cx + 9, cz + 11, Object.assign({}, o, { h: 10 })); WORLD.arch(cx, cz - 11, 0, 4.4, 4, 1.1, { y: 8.6 }); WORLD.wall(cx - 9, cz - 11, cx - 3.4, cz - 11, o); WORLD.wall(cx + 3.4, cz - 11, cx + 9, cz - 11, o);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) WORLD.column(cx + s * 5, cz - 6 + k * 6, 5.5, 0.5, { y: 9, broken: k === 2 && s < 0 }); }
    WORLD.tower(-27, 96, 6.5, 26, { y: 3, mat: dk, roof: true, windows: 2, lit: true, wa: 1.2 });
    KIT.cyl(-12, 9, 140, 0.35, 3.2, M.wood, { seg: 8 }); for (const [x, z] of [[-30, 150], [30, 100], [-30, 120], [0, 96]]) WORLD.brazier(L, x, z, { y: 9 });
    for (const [x, z, a] of [[-18, 104, 0.3], [20, 134, -0.4], [-6, 150, 0], [26, 144, 0.9]]) STV.barricade(x, z, a, 9);
    KIT.box(22, 9, 88, 34, 16, 100, M.wall); KIT.box(22, 16, 99.4, 34, 17, 100, M.wall, { col: false }); KIT.box(22, 16, 88, 22.6, 17, 100, M.wall, { col: false });
    // ---- the secluded court and the last gate
    WORLD.tower(27, 190, 6, 22, { y: 13, mat: dk, roof: true, windows: 2, lit: true, wa: 4.4 });
    WORLD.curtain(-W, 204, -4.2, 204, 12, 31, 2.6, { mat: dk, floor: () => 19 }); WORLD.curtain(4.2, 204, W, 204, 12, 31, 2.6, { mat: dk, floor: () => 19 }); KIT.box(-4.2, 26, 202.7, 4.2, 31, 205.3, dk); WORLD.arch(0, 204, 0, 6.4, 5.4, 2.6, { y: 18.5, mat: dk });
    for (const s of [-1, 1]) { WORLD.brazier(L, s * 6, 199, { y: 19 }); WORLD.banner(L, s * 7.6, 30, 202.4, PI, 2.4, 8); }
    for (const [x, z, a] of [[-16, 186, 0.2], [8, 192, -0.2]]) STV.barricade(x, z, a, 19);
    // ---- Godrick's yard: graves, dead trees of grafted limbs, and the keep over all
    for (let i = 0; i < 34; i++) { const x = rnd(-24, 24), z = 210 + rs() * 50; if (Math.hypot(x, z - 236) < 9) continue; KIT.rbox(x, 19.5, z, 0.34, 0.75, 0.1, (rs() - 0.5) * 0.4, rs() * PI, (rs() - 0.5) * 0.4, dk, 0.04); }
    KIT.box(-W, 12, 266, W, 46, 270, dk); WORLD.arch(0, 266, 0, 6, 8, 4, { y: 18.6, mat: dk });
    CAS.facade(-W, 266, W, 266, 19, 46, { mat: dk, side: 1, rows: 2, lit: 0.45, arcH: 11, skip: (i, n) => i === (n >> 1) || i === ((n - 1) >> 1) }); KIT.box(-3.2, 19, 266.5, 3.2, 28.5, 267.3, M.iron, { col: false });
    for (let x = -34; x < 34; x += 4.4) KIT.box(x, 46, 266, x + 2.2, 47.6, 270, dk, { col: false });
    WORLD.tower(0, 292, 17, 84, { y: 14, mat: dk, roof: true, windows: 6, lit: true, wa: 2.6 }); WORLD.tower(-30, 286, 9, 62, { y: 14, mat: dk, roof: true, windows: 3, lit: true, wa: 2.9 }); WORLD.tower(30, 288, 9, 68, { y: 14, mat: dk, roof: true, windows: 3, lit: true, wa: 3.3 }); WORLD.tower(-58, 300, 7, 50, { y: 10, mat: dk, roof: true }); WORLD.tower(60, 304, 7, 54, { y: 10, mat: dk, roof: true });
    for (const s of [-1, 1]) { WORLD.banner(L, s * 9, 44, 265.2, PI, 3, 14); WORLD.brazier(L, s * 22, 214, { y: 19 }); WORLD.brazier(L, s * 22, 258, { y: 19 }); }
    if (AST.sets.wooden_crate_01) WORLD.dressing(L, [[-33, 22, 'stores'], [33, 14, 'stores'], [-34, 56, 'stores'], [20, 70, 'stores'], [34, 76, 'stores'], [-34, 104, 'stores'], [33, 130, 'stores'], [-20, 168, 'stores'], [-32, 196, 'stores'], [30, 180, 'stores'],
      [-14, 62, 'statue', 0], [14, 62, 'statue', 0], [-12, 200, 'statue', PI], [12, 200, 'statue', PI], [-18, 262, 'statue', PI], [18, 262, 'statue', PI],
      [-30, 80, 'rubble'], [30, 36, 'rubble'], [-6, 108, 'rubble'], [18, 112, 'rubble'], [-28, 140, 'rubble'], [24, 166, 'rubble'], [-20, 220, 'rubble'], [22, 244, 'rubble']], { y: (x, z) => STV.floor(x, z), seed: 'stv' });
    WORLD.grass(L, G, { count: 22000, base: 0x4a4e2c, tip: 0x84865a, dry: 0xa89868, height: 0.26, mask: (x, z) => (Math.abs(x) < W && z > 0 && z < 264 ? smooth(0.5, 0.72, fbm2(x * 0.09 + 5, z * 0.09, 2)) : 0) });
    WORLD.grace(L, 0, 0, 9, 'STORMVEIL MAIN GATE', [0, 64]); WORLD.grace(L, 1, -22, 101, 'RAMPART TOWER', [20, 152]); WORLD.grace(L, 2, 17, 186, 'SECLUDED CELL', [0, 204]);
    L.updates.push((dt) => { if (RNG() < dt * 12) { const c = R.camera.position, a = RNG() * TAU, r = 4 + RNG() * 26; FX.puff(V3(c.x + Math.cos(a) * r, c.y + rnd(-2, 5), c.z + Math.sin(a) * r), 1, { size: 0.5, grow: 2.5, col: [0.6, 0.6, 0.6], a: 0.08, life: 1.6, spread: 0.3, vel: V3(7, 0.3, -3), drag: 0.2, rise: 0 }); } });
  },
  onStart(L, cp) {
    if (MG.titleMode) return;
    const s = GAME.save, sp = WORLD.spawn;
    HUD.area('STORMVEIL CASTLE'); HUD.obj(s.felled && s.felled.godrick ? 'The Grafted has fallen' : 'Climb the castle to the lord’s yard');
    // the gate ward
    sp('exile', -8, 30, { yaw: PI }); sp('exileSword', 7, 34, { yaw: PI }); sp('exile', -2, 52, { yaw: PI, patrol: [[-2, 52], [-16, 40], [14, 44]] }); sp('exileSword', 12, 20, { yaw: -2.4 });
    sp('exileBow', -30, 37, { yaw: 2.2, y: 3.6 }); sp('exileBow', 30, 37, { yaw: -2.2, y: 3.6 }); sp('exile', 0, 70, { yaw: PI, y: 2.6 });
    // the rampart court
    sp('banished', 0, 100, { yaw: PI, y: 9, patrol: [[0, 100], [-16, 112], [18, 104]] }); sp('exile', -20, 126, { yaw: PI, y: 9 }); sp('exileSword', 22, 122, { yaw: PI, y: 9 }); sp('exile', 6, 118, { yaw: PI, y: 9 }); sp('exileSword', 4, 124, { yaw: PI, y: 9 });
    sp('exileBow', 28, 95, { yaw: 2.6, y: 16 }); sp('troll', -12, 144, { yaw: PI, y: 9 }); sp('exile', 20, 150, { yaw: PI, y: 9 });
    // the secluded court
    sp('knight', -5, 196, { yaw: PI, y: 19 }); sp('knight', 5, 196, { yaw: PI, y: 19 }); sp('exileSword', -18, 184, { yaw: 2, y: 19 }); sp('exile', 10, 180, { yaw: -2, y: 19 }); sp('banished', -24, 196, { yaw: 2.4, y: 19 });
    WORLD.item(L, -29, 12, { name: 'Golden Rune [4]', runes: 800, y: 0 }); WORLD.item(L, 6, 126, { give: [['seed', 1]], y: 9 }); WORLD.item(L, -30, 190, { name: 'Golden Rune [5]', runes: 1200, y: 19 }); WORLD.item(L, 30, 140, { name: 'Golden Rune [3]', runes: 600, y: 9 });
    WORLD.message(L, 1, 60, 'Be wary of up'); WORLD.message(L, -2, 200, 'Tough enemy ahead'); WORLD.message(L, 3, 196, 'Praise the grafted? No.');
    const fin = () => { const g = WORLD.grace(L, 3, 0, 236, 'GODRICK THE GRAFTED', null); void g; HUD.obj('The Grafted has fallen'); };
    const A = WORLD.arena(L, 'godrick', 'godrick', [0, 250, PI, 19], [0, 205.4, 0, 7, 6.4, 19], {
      onEnter: (b) => { HUD.sub('GODRICK', 'Kneel, lowly Tarnished! Thou standest before the lord of all that is golden!', 5.5); b.cd = 2.8; },
      onDefeat: () => { MG.after(7, () => { fin(); EQ.give('rune_godrick', 1, true); EQ.give('godrick_axe', 1, true); HUD.item('Godrick’s Great Rune', 'A shard of the Elden Ring', 'rune_godrick'); }, true); MG.after(12.5, () => GAME.result(true), true); },
    });
    if (A.B.dead) fin();
  },
});
/* a spiked barricade: crossed stakes on a log */
STV.barricade = function (x, z, yaw, y) {
  const M = WORLD.M(); y = y || 0; const c = Math.cos(yaw), s = Math.sin(yaw), P = (l, h, d) => [x + l * c + (d || 0) * s, y + h, z - l * s + (d || 0) * c];
  KIT.beam(P(-2.2, 0.55), P(2.2, 0.55), 0.2, M.wood);
  for (let i = -3; i <= 3; i++) { KIT.beam(P(i * 0.62, 0.0, -0.7), P(i * 0.62, 1.25, 0.75), 0.1, M.wood); KIT.beam(P(i * 0.62 + 0.3, 0.0, 0.7), P(i * 0.62 + 0.3, 1.1, -0.6), 0.1, M.wood); }
  PHY.obox(x, z, 2.3, 0.6, y, y + 1.2, yaw);
};
