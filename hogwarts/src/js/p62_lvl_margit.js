/* ==== p62_lvl_margit.js ==== */
/* THE CASTLEWARD BRIDGE — out of the tunnel and onto the long causeway before Stormveil's gate, where Margit waits. */
const MRG = {};
MRG.floor = (z) => 40 + clamp(z, -70, 170) * 0.035;
MRG.h = function (x, z) {
  const jag = (fbm2(x * 0.07 + 3, z * 0.07, 3) - 0.5) * 9 + (fbm2(x * 0.3, z * 0.3, 2) - 0.5) * 1.5, ax = Math.abs(x), fl = MRG.floor(z) + (fbm2(x * 0.2, z * 0.2, 2) - 0.5) * 0.25;
  let h = fl - smooth(12.4, 19, ax + jag * 0.5 * smooth(13, 16, ax)) * (95 + jag * 3);
  // the crag the tunnel comes out of, and the crag the castle stands on
  const south = smooth(-4, -16, z + jag * 0.4), north = smooth(150, 164, z + jag * 0.4);
  h = lerp(h, fl + 26 + jag * 1.4 + Math.min(40, ax * 0.5), south * smooth(4.6, 7.5, ax));
  h = lerp(h, fl + 20 + jag * 1.2 + Math.min(40, ax * 0.3), north * smooth(13, 17, ax + (z > 178 ? 99 : 0)));
  if (z > 178) h = fl + 20 + jag;
  if (z < -66) h = fl + 26 + jag;
  return h;
};
LEVEL.def('margit', {
  get photo() { return AST.BASE_SETS; },
  models: ['cliffA', 'cliffB', 'cliffC', 'cliffD', 'cliffE', 'bld1', 'bld2', 'bld3', 'bld4', 'bld5', 'ms1a', 'ms2a'],
  chapter: 'STORMHILL', name: 'CASTLEWARD TUNNEL', region: 'STORMHILL', world: 'stormveil', mount: false, cast: ['margit'],
  tex: ['grass', 'dirt', 'cliff', 'ashlar', 'flag', 'planks', 'bark', 'steel', 'gold'],
  start: [0, 38.1, -58, 0], checkpoints: [[0, 38.1, -58, 0], [-2.2, 39.2, -26, 0], [0, 44.7, 132, 0]], killY: 6,
  async build(L) {
    WORLD.sky(L, { storm: 0.82, sun: new THREE.Vector3(-0.4, 0.62, -0.45), sunI: 4.0, hemi: 1.0, fog: 0.0042, vol: 0, exposure: 1.1, lights: 5 });
    const mat = TERRAIN.limMat('mrg', { dirt: 'flag', tintA: 0x7c7c62, tintB: 0x8a8468, rockTint: 0xa8a49a });
    const G = await TERRAIN.grid(MRG.h, -110, -84, 110, 196, 2, mat, { paint: (x, z) => [Math.abs(x) < 12.6 && z > -70 && z < 172 ? 1 : 0, Math.abs(x) > 14 ? 1 : 0, 0], progress: (p) => MG.loadUI(0.56 + p * 0.3, 'Raising the bridge') });
    L.G = G; const M = WORLD.M(), gy = WORLD.gy, rs = MG.rs('margit');
    WORLD.erdtree(L, { glow: 0.05 });
    if (AST.sets.mountainside) {   // scanned rock on the crags the bridge runs between (the faces the eye meets: the castle's rock ahead, the tunnel's behind)
      const list = [], rq = MG.rs('mrgrock'), names = ['cliffE', 'cliffC', 'cliffD', 'cliffA'];
      for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const x = sd * (36 + k * 15 + rq() * 5), m = names[(k + (sd > 0 ? 1 : 0)) % 4], sz = AST.info(m).size, sy = (34 + rq() * 12) / sz[1], wmax = (Math.abs(x) - 25) * 2 / sz[0];
        list.push({ m, p: [x, 34 + rq() * 4, 150.5 + rq() * 3 + k * 0.8], s: [Math.min(7, wmax, sy * (0.9 + rq() * 0.4)), sy * 1.15, Math.min(5, sy * 0.7)], r: [0, PI + sd * (0.1 + rq() * 0.3), 0] });
        list.push({ m: names[(k + 1) % 4], p: [x + sd * 9, 58 + rq() * 6, 157 + rq() * 3], s: [Math.min(5.5, wmax), 30 / AST.info(names[(k + 1) % 4]).size[1], 4], r: [0, PI + sd * rq() * 0.4, 0] });
        list.push({ m: names[(k + 2) % 4], p: [x * 0.9 + sd * 4, 24 + rq() * 4, -8 - rq() * 5 - k], s: [5, (30 + rq() * 12) / AST.info(names[(k + 2) % 4]).size[1], 3.2], r: [0, sd * (0.1 + rq() * 0.3), 0] }); }
      for (const sd of [-1, 1]) for (let k = 0; k < 9; k++) { const z = 4 + k * 17 + rq() * 6, m = names[k % 4], sz = AST.info(m).size; list.push({ m, p: [sd * (15.5 + rq() * 1.5), 12 + rq() * 6, z], s: [4.2, 26 / sz[1], 2.2], r: [0, sd * HALF + (rq() - 0.5) * 0.3, 0] }); }
      AST.scatter(L, list, { mat: (n, li) => AST.material(n, li ? { grade: WORLD.ROCK_GRADE[n], moss: 0.5, env: 0.4, side: THREE.DoubleSide } : { grade: WORLD.ROCK_GRADE[n], moss: 0.5, env: 0.4, detail: 0.7, side: THREE.DoubleSide }), cell: 200, lodD: 60, lodK: 0.7 }); }
    // ---- the tunnel
    { const y = MRG.floor(-40);
      KIT.box(-6.2, y - 2, -66, -4.4, y + 7, -6, M.dark); KIT.box(4.4, y - 2, -66, 6.2, y + 7, -6, M.dark); KIT.box(-6.2, y + 5.2, -66, 6.2, y + 7.5, -6, M.dark); KIT.box(-6.2, y - 2, -68, 6.2, y + 8, -66, M.dark);
      for (let z = -60; z < -8; z += 9) { for (const s of [-1, 1]) KIT.box(s * 4.4 - 0.35, y - 1, z - 0.4, s * 4.4 + 0.35, y + 5.2, z + 0.4, M.wall, { col: false }); KIT.box(-4.4, y + 4.5, z - 0.4, 4.4, y + 5.3, z + 0.4, M.wall, { col: false }); }
      for (const [x, z] of [[-4.0, -58], [4.0, -47], [-4.0, -36], [4.0, -25], [-4.0, -14]]) WORLD.torch(L, x * 0.97, y + 2.5, z, 0, { range: 16, i: 9 });
      WORLD.arch(0, -6, 0, 6.4, 4.4, 2.2, { y: y - 0.5, top: 12, solidTop: true, mat: M.dark });
    }
    WORLD.grace(L, 1, 1.6, -27, 'CASTLEWARD TUNNEL', [0, 4]);
    // ---- the causeway: broken parapets, braziers, the dead
    for (const s of [-1, 1]) { let z = -2; while (z < 150) { const len = 6 + rs() * 16, gap = rs() < 0.34 ? 3 + rs() * 5 : 0; if (z + len > 150) break; const y = MRG.floor(z + len / 2);
        KIT.box(s * 12.6 - 0.5, y - 3, z, s * 12.6 + 0.5, y + 1.25, z + len, M.wall); for (let q = z + 1; q < z + len - 1; q += 3.2) KIT.box(s * 12.6 - 0.5, y + 1.25, q, s * 12.6 + 0.5, y + 2.0, q + 1.5, M.wall, { col: false });
        z += len + gap; } }
    for (let z = 14; z < 150; z += 34) for (const s of [-1, 1]) WORLD.brazier(L, s * 11.2, z, { y: MRG.floor(z) });
    for (let i = 0; i < 26; i++) { const x = rnd(-11, 11), z = 6 + rs() * 140; if (Math.abs(x) < 2.5) continue; const r = 0.25 + rs() * 0.7; TERRAIN.rock(x, z, r, r * 0.8, i * 13 + 3, TERRAIN.cliffMat(0x9a968c), { detail: 2, col: r > 0.6 }); }
    for (let i = 0; i < 9; i++) { const x = rnd(-10, 10), z = 12 + rs() * 126, y = MRG.floor(z); KIT.rbox(x, y + 0.9, z, 0.05, 1.0, 0.05, rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3), M.wood, 0.01); KIT.rbox(x, y + 1.35, z, 0.3, 0.04, 0.04, 0, rs() * PI, rnd(-0.2, 0.2), M.wood, 0.01); }   // grave markers / broken spears
    // ---- Stormveil's face: gate towers, the curtain, the keep rising behind
    { const y = MRG.floor(156) - 4, dk = M.dark;
      for (const s of [-1, 1]) { WORLD.tower(s * 16.5, 158, 8.5, 44, { y, mat: dk, windows: 4, lit: true, wa: s > 0 ? 3.4 : 2.9 }); WORLD.tower(s * 40, 172, 7, 52, { y: y + 8, mat: dk, roof: true, windows: 3, lit: true, wa: 3.1 }); WORLD.curtain(s * 24, 160, s * 40, 172, y, y + 38, 4, { mat: dk }); }
      KIT.box(-9, y + 15, 154, 9, y + 40, 162, dk); CAS.facade(-9, 154, 9, 154, y + 15, y + 40, { mat: dk, side: 1, rows: 1, arcH: 0, lit: 0.5 }); for (let x = -8; x < 8; x += 3.2) KIT.box(x, y + 40, 154, x + 1.6, y + 41.2, 162, dk, { col: false });
      WORLD.arch(0, 156, 0, 7.5, 7, 4, { y: y + 3.6, mat: dk });
      L.gate = LEVEL.door(-3.9, y + 4, 155.5, 3.9, y + 12.5, 156.5, M.iron);
      WORLD.tower(0, 205, 15, 78, { y: y + 14, mat: dk, roof: true, windows: 5, lit: true, wa: 2.4 }); WORLD.tower(-28, 198, 8, 60, { y: y + 14, mat: dk, roof: true, windows: 3, lit: true, wa: 2.9 }); WORLD.tower(30, 200, 8, 66, { y: y + 14, mat: dk, roof: true, windows: 3, lit: true, wa: 3.3 });
      for (const s of [-1, 1]) WORLD.banner(L, s * 6.2, y + 30, 153.4, PI, 2.6, 11);
    }
    WORLD.grass(L, G, { count: 26000, base: 0x4a4e2c, tip: 0x8a8a56, dry: 0xa89868, height: 0.3, mask: (x, z) => (Math.abs(x) < 12 ? 0.75 * smooth(0.45, 0.7, fbm2(x * 0.13, z * 0.13, 2)) : 0) });
    // wind and far lightning
    L.updates.push((dt, t) => { if (RNG() < dt * 16) { const c = R.camera.position, a = RNG() * TAU, r = 4 + RNG() * 26; FX.puff(V3(c.x + Math.cos(a) * r, c.y + rnd(-2, 5), c.z + Math.sin(a) * r), 1, { size: 0.5, grow: 2.5, col: [0.62, 0.64, 0.66], a: 0.09, life: 1.6, spread: 0.3, vel: V3(9, 0.3, -3), drag: 0.2, rise: 0 }); }
      L.flashT = (L.flashT || 4) - dt; if (L.flashT < 0) { L.flashT = 5 + RNG() * 11; L.flash = 1; } if (L.flash > 0) { L.flash = Math.max(0, L.flash - dt * 3.2); R.hemi.intensity = (1.0 + (L.flash > 0.55 || (L.flash > 0.2 && L.flash < 0.35) ? 2.2 : 0)) * Math.PI; } });
  },
  onStart(L, cp) {
    if (MG.titleMode) return;
    const s = GAME.save, gy = WORLD.gy; HUD.area(cp >= 2 ? 'STORMVEIL CASTLE' : 'CASTLEWARD TUNNEL'); HUD.obj(s.felled && s.felled.margit ? 'Enter Stormveil Castle' : 'Cross the bridge to the castle gate');
    const A = WORLD.arena(L, 'margit', 'margit', [0, 104, PI], [0, 7, 0, 25, 8], {
      onEnter: (b) => { HUD.sub('MARGIT', 'Foul Tarnished. Thy ambition ends upon this bridge — I, Margit the Fell, shall see to it.', 5.5); b.cd = 2.6; },
      onDefeat: () => { HUD.obj('Enter Stormveil Castle'); MG.after(5, () => { EQ.give('pouch', 1); }, true); MG.after(6, () => { L.gate.openIt(); const g = WORLD.grace(L, 2, 0, 136, 'MARGIT, THE FELL OMEN', [0, 156]); void g; }, true); },
    });
    if (A.B.dead) { L.gate.openIt(); WORLD.grace(L, 2, 0, 136, 'MARGIT, THE FELL OMEN', [0, 156]); }
    WORLD.message(L, -2, -8, 'Time for mist'); WORLD.message(L, 3, -14, 'Tough enemy ahead, therefore try rolling');
    LEVEL.trigger(-5, 157.5, 5, 164, () => GAME.travel('stormveil', 0));
    WORLD.interact(L, V3(0, gy(0, -62) + 1.2, -63), 3.2, IN.keyLabel('grip') + ' RETURN TO STORMHILL', () => GAME.travel('limgrave', 5));
  },
});
