/* ==== p78f_hl_dungeon.js ==== */
/* HOGWARTS — the dungeons: a stair goes down from the Reception Hall to an undercroft beneath it; a passage runs south
   under the Great Hall to the kitchens, with the Slytherin and Hufflepuff common rooms, the potions dungeon and the
   cells opening off it. The crag is hollowed under these rooms (HL.h in the castle part) and the ground floor above
   is its own slab, so this is a real storey below, reached on foot. */
HL.DUN = { d: 7, hole: [-94, 83, -82, 86], holes: [[-94, 83, -82, 86], [-8, 101, -5, 113]], rooms: [] };
HL.BUILD.push(async function dungeon(L) {
  const G = HL.GK.M(), GK = HL.GK, I = HL.IM(), M = HL.M(), F = HL.F, Y = HL.Y0, yd = Y - HL.DUN.d, yc = Y - 1.4, T = 0.6, flag = I.flagD || I.flag, books = [], rs = mulberry(4141);
  const hm = (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, envMapIntensity: 0.3 }); m.userData.tscale = 1; return m; }, green = hm(0x1f5a3a), yellow = hm(0xb08a1c), black = hm(0x18181a), copper = new THREE.MeshStandardMaterial({ color: 0xb86a3a, metalness: 0.9, roughness: 0.35 }); copper.userData.tscale = 1;
  KIT.tag = 'in';
  /* a room: floor, four walls with doorways ([side, centre, width]; e = low x, w = high x, s = low z, n = high z), a rib vault, a zone */
  const room = (name, x0, x1, z0, z1, doors, o) => { o = o || {}; HL.DUN.rooms.push({ name, x0, x1, z0, z1 });
    KIT.box(x0 - T, yd - 0.5, z0 - T, x1 + T, yd, z1 + T, G.dark, { mats: { Y: o.floor || flag } });
    for (const s of 'nsew') { const hz = s === 'n' || s === 's', a = hz ? x0 : z0, b = hz ? x1 : z1, c = s === 'n' ? z1 : s === 's' ? z0 - T : s === 'w' ? x1 : x0 - T; let u = a - T;
      const seg = (u0, u1, y0, y1) => { if (u1 - u0 < 0.05) return; if (hz) KIT.box(u0, y0, c, u1, y1, c + T, G.dark, {}); else KIT.box(c, y0, u0, c + T, y1, u1, G.dark, {}); };
      for (const d of doors.filter((q) => q[0] === s).sort((p, q) => p[1] - q[1])) { seg(u, d[1] - d[2] / 2, yd, yc); seg(d[1] - d[2] / 2, d[1] + d[2] / 2, yd + 3.2, yc); u = d[1] + d[2] / 2;
        const dx = hz ? d[1] : c + T / 2, dz = hz ? c + T / 2 : d[1]; for (const sd of [-1, 1]) KIT.box(hz ? dx + sd * d[2] / 2 - 0.12 : dx - 0.42, yd, hz ? dz - 0.42 : dz + sd * d[2] / 2 - 0.12, hz ? dx + sd * d[2] / 2 + 0.12 : dx + 0.42, yd + 3.2, hz ? dz + 0.42 : dz + sd * d[2] / 2 + 0.12, G.dress, { col: false }); }
      seg(u, b + T, yd, yc); }
    const nx = Math.max(1, Math.round((x1 - x0) / 5.5)), nz = Math.max(1, Math.round((z1 - z0) / 5.5)); GK.vaults(x0, z0, x1, z1, yd + 2.9, 2.6, nx, nz, {});
    if (o.piers) for (let i = 1; i < nx; i++) for (let j = 1; j < nz; j++) { const px = x0 + i * (x1 - x0) / nx, pz = z0 + j * (z1 - z0) / nz; GK.pier(px, pz, yd, 2.9, 0.42); PHY.cyl(px, pz, 0.5, yd, yd + 3); }
    HL.zone(name, x0 - 0.3, z0 - 0.3, x1 + 0.3, z1 + 0.3, yd - 0.6, yc + 0.1, { hemi: 0.028 }); return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 }; };
  const torch = (x, z, nx, nz, c) => HL.sconce(L, x + nx * 0.08, yd + 2.5, z + nz * 0.08, nx, nz, { i: 7, range: 10 });
  const barrel = (x, z, r, h) => { KIT.cyl(x, yd, z, r, h, I.oakD, { seg: 10 }); for (const f of [0.18, 0.82]) KIT.cyl(x, yd + h * f, z, r + 0.02, 0.06, M.iron, { seg: 10, col: false }); };
  const table = (xa, za, xb, zb, h) => { KIT.bbox(xa, yd + (h || 0.76), za, xb, yd + (h || 0.76) + 0.1, zb, I.oak, { c: 0.03, col: false }); PHY.box(xa, yd, za, xb, yd + (h || 0.76) + 0.08, zb); for (const [lx, lz] of [[xa + 0.2, za + 0.2], [xb - 0.2, za + 0.2], [xa + 0.2, zb - 0.2], [xb - 0.2, zb - 0.2]]) KIT.box(lx - 0.08, yd, lz - 0.08, lx + 0.08, yd + (h || 0.76), lz + 0.08, I.oakD, { col: false }); };
  const cauldron = (x, y, z, r, glow) => { const g = new THREE.SphereGeometry(r, 12, 8, 0, TAU, HALF * 0.55, PI); KIT.geo(g, M.iron, new THREE.Matrix4().makeTranslation(x, y + r * 0.85, z)); KIT.cyl(x, y + r * 1.25, z, r * 0.86, 0.03, KIT.emis(glow || 0x58e08a, 1.6), { seg: 12, col: false }); };

  // ---- the stair down from the Reception Hall, and the undercroft it lands in
  { const h = HL.DUN.hole; KIT.stairs(h[0], h[1], h[2], h[3], yd, Y, 'x', G.dress, 35); PHY.ramp && 0;
    KIT.tag = 'in0'; KIT.box(h[0], Y, h[3], h[2], Y + 1.05, h[3] + 0.25, G.dress, {}); KIT.box(h[0] - 0.25, Y, h[1] - 0.25, h[0], Y + 1.05, h[3] + 0.25, G.dress, {}); KIT.box(h[0], Y, h[1] - 0.25, h[2], Y + 1.05, h[1], G.dress, {});
    for (const z of [h[1] - 0.12, h[3] + 0.12]) { KIT.cyl(h[2] + 0.2, Y, z, 0.22, 1.5, G.dress, { seg: 8 }); KIT.geo(new THREE.SphereGeometry(0.2, 10, 8), KIT.emis(0x66e0a0, 3), new THREE.Matrix4().makeTranslation(h[2] + 0.2, Y + 1.72, z)); } HL.sl(h[2] + 0.2, Y + 2, (h[1] + h[3]) / 2, 0x66e0a0, 6, 9); KIT.tag = 'in'; }
  const U = room('THE DUNGEON UNDERCROFT', -98, -64, 82.6, 91, [['s', -79.5, 2.8]], { piers: false });
  for (let x = U.x0 + 3; x < U.x1 - 1; x += 7) { torch(x, U.z1, 0, -1); } torch(U.x1, U.cz, -1, 0); torch(U.x0, U.cz + 2, 1, 0);
  for (const [x, z, r, hh] of [[-66, 89.6, 0.55, 1.2], [-67.3, 89.9, 0.5, 1.1], [-66.2, 88.2, 0.45, 1.0], [-65.6, 84, 0.55, 1.2]]) barrel(x, z, r, hh);
  HL.banner(-72, yd + 4.6, U.z1 - 0.1, PI, 1.5, 3.2, 'slytherin'); HL.banner(-86, yd + 4.6, U.z1 - 0.1, PI, 1.5, 3.2, 'hufflepuff');
  // ---- the passage south under the Great Hall
  const C = room('THE DUNGEON PASSAGE', -81.2, -77.8, 40, 81.4, [['n', -79.5, 2.8], ['s', -79.5, 2.8], ['e', 70, 2.4], ['e', 50, 2.4], ['w', 64, 2.4], ['w', 43.4, 2.2]], {});
  for (let z = 44; z < 80; z += 6) { torch((z / 6 | 0) % 2 ? C.x0 : C.x1, z + ((z / 6 | 0) % 2 ? 2.2 : -1.2), (z / 6 | 0) % 2 ? 1 : -1, 0); } KIT.box(C.cx - 0.7, yd + 0.004, C.z0 + 0.5, C.cx + 0.7, yd + 0.014, C.z1 - 0.5, green, { col: false });
  for (const z of [47, 57, 67, 76]) HL.portrait(z % 2 ? C.x0 + 0.06 : C.x1 - 0.06, yd + 2.2, z, z % 2 ? HALF : -HALF, 1.0, z);
  // ---- the kitchens: four long tables under the four above, two great hearths, coppers, barrels
  { const K = room('THE KITCHENS', -90, -69, 22, 38.8, [['n', -79.5, 2.8]], { piers: true });
    for (const z of [25.5, 29.3, 33.1]) { table(K.x0 + 2.5, z - 0.65, K.x1 - 2.5, z + 0.65); for (let x = K.x0 + 4, q = 0; x < K.x1 - 3; x += 2.1, q++) { if (Math.abs(x - K.cx) < 1) continue; if (q % 3 === 0) HL.candlestick(x, yd + 0.86, z, 3); else if (q % 3 === 1) { KIT.cyl(x, yd + 0.86, z, 0.26, 0.04, M.gold, { seg: 10, col: false }); KIT.geo(new THREE.SphereGeometry(0.2, 8, 6, 0, TAU, 0, HALF), I.food[q % 5], new THREE.Matrix4().makeTranslation(x, yd + 0.9, z)); } else { KIT.cyl(x, yd + 0.86, z, 0.2, 0.22, copper, { seg: 10, col: false }); } } }
    for (const x of [K.cx - 6, K.cx + 6]) { GK.hearth(L, x, yd, K.z0, 0, 1, 3.6, 4.6); cauldron(x, yd + 0.5, K.z0 + 1.6, 0.5, 0xffb050); }
    for (let i = 0; i < 6; i++) { barrel(K.x0 + 0.8, K.z0 + 2 + i * 1.5, 0.5, 1.15); if (i % 2) barrel(K.x1 - 0.8, K.z0 + 2 + i * 1.5, 0.5, 1.15); }
    for (let x = K.x0 + 3; x < K.x1 - 2; x += 3) for (const z of [27.4, 31.2]) { KIT.cyl(x, yd + 4.2, z, 0.012, yc - yd - 4.2, M.iron, { seg: 4, col: false }); KIT.geo(new THREE.SphereGeometry(0.24, 10, 6, 0, TAU, HALF, HALF), copper, new THREE.Matrix4().makeTranslation(x, yd + 4.2, z)); }
    torch(K.x0, K.cz, 1, 0); torch(K.x1, K.cz, -1, 0); HL.sl(K.cx, yd + 4, K.cz, 0xffa858, 16, 16, { flicker: 0.2 }); HL.DUN.kitchen = K; }
  // ---- the cellars, east of the passage: tuns and barrels down both walls, a tasting table
  { const Ce2 = room('THE CELLARS', -76.6, -69, 48, 80.2, [['e', 64, 2.4]], {});
    for (let z = Ce2.z0 + 1.6; z < Ce2.z1 - 1.2; z += 1.5) { barrel(Ce2.x1 - 0.8, z, 0.58, 1.25); if (Math.abs(z - 64) > 3.2) barrel(Ce2.x0 + 0.75, z, 0.5, 1.1); if (((z * 2) | 0) % 3 === 0) barrel(Ce2.x1 - 2.05, z + 0.5, 0.42, 0.9); }
    for (const z of [Ce2.z0 + 9, Ce2.z1 - 9]) { table(Ce2.cx - 1.0, z - 0.6, Ce2.cx + 0.4, z + 0.6); HL.candlestick(Ce2.cx - 0.3, yd + 0.86, z, 3); KIT.cyl(Ce2.cx - 0.3, yd + 0.86, z + 0.35, 0.16, 0.26, I.oakD, { seg: 8, col: false }); }
    for (let z = Ce2.z0 + 5; z < Ce2.z1 - 3; z += 9) torch(Ce2.x0, z, 1, 0); HL.sl(Ce2.cx, yd + 3.4, Ce2.cz, 0xffa858, 8, 16, { flicker: 0.3 }); }
  // ---- the Slytherin common room, where the game's map has it: under the hall north of the Grand Staircase. A stair goes down
  //      along its east side; the room is long and low, green lamps, the lake beyond the windows
  { const h = HL.DUN.holes[1]; KIT.tag = 'in';
    KIT.box(-8.6, yd - 0.5, 98.4, -4.4, yd, 114.1, G.dark, { mats: { Y: flag } }); KIT.box(-8.6, yd, 98.4, -8, yc, 114.1, G.dark, {}); KIT.box(-8.6, yd, 98.4, -4.4, yc, 99, G.dark, {});
    KIT.stairs(h[0], h[1], h[2], h[3], yd, Y, 'z', G.dress, 35); for (const z of [103.5, 109]) { KIT.geo(new THREE.SphereGeometry(0.16, 8, 6), KIT.emis(0x58e0a0, 2.6), new THREE.Matrix4().makeTranslation(-7.8, yd + 4.6 + (z - 101) * 0.58, z)); HL.sl(-7.2, yd + 4.4 + (z - 101) * 0.58, z, 0x58e0a0, 5, 9); }
    KIT.tag = 'in0'; KIT.box(h[2], Y, h[1] - 0.25, h[2] + 0.25, Y + 1.05, h[3], G.dress, {}); KIT.box(h[0], Y, h[1] - 0.25, h[2] + 0.25, Y + 1.05, h[1], G.dress, {});
    for (const x of [h[0] + 0.2, h[2] + 0.12]) { KIT.cyl(x, Y, h[3] + 0.3, 0.22, 1.5, G.dress, { seg: 8 }); KIT.geo(new THREE.SphereGeometry(0.2, 10, 8), KIT.emis(0x66e0a0, 3), new THREE.Matrix4().makeTranslation(x, Y + 1.72, h[3] + 0.3)); } HL.sl((h[0] + h[2]) / 2, Y + 2, h[3] + 0.3, 0x66e0a0, 6, 9); KIT.tag = 'in';
    const S = room('THE SLYTHERIN COMMON ROOM', -4.4, 6, 99, 117, [['e', 100.3, 2.2]], {}), lake = KIT.emis(0x2f9a80, 1.5);
    for (let z = S.z0 + 3.4; z < S.z1 - 2; z += 4.4) { KIT.box(S.x1 - 0.05, yd + 1.3, z - 1.1, S.x1, yd + 4.0, z + 1.1, lake, { col: false }); for (const dz of [-1.2, 0, 1.2]) KIT.box(S.x1 - 0.12, yd + 1.2, z + dz - 0.07, S.x1, yd + 4.1, z + dz + 0.07, M.iron, { col: false }); KIT.box(S.x1 - 0.12, yd + 2.6, z - 1.2, S.x1, yd + 2.72, z + 1.2, M.iron, { col: false }); HL.sl(S.x1 - 1.4, yd + 2.8, z, 0x40e0a8, 7, 10); }
    GK.hearth(L, S.cx, yd, S.z1, 0, -1, 3.2, 4.4); KIT.box(S.cx - 2.6, yd + 0.004, S.z0 + 3.5, S.cx + 2.6, yd + 0.016, S.z1 - 2.6, green, { col: false });
    for (const z of [S.z0 + 6.2, S.z0 + 11.6]) { for (const [dx, yw, m] of [[-1.6, HALF, black], [1.6, -HALF, green]]) HL.armchair(S.cx + dx, yd, z, yw, m); KIT.cyl(S.cx, yd, z, 0.5, 0.5, I.oakD, { seg: 10 }); HL.candlestick(S.cx, yd + 0.5, z, 3); }
    for (const dx of [-1.9, 0, 1.9]) HL.armchair(S.cx + dx, yd, S.z1 - 3.4, PI + dx * 0.25, dx ? green : black);
    for (const z of [S.z0 + 6, S.z0 + 12.6]) HL.banner(S.x0 + 0.1, yd + 4.9, z, HALF, 1.6, 3.4, 'slytherin'); HL.bookcase(S.x0 + 0.3, yd, S.z0 + 9.3, HALF, 3.2, 3, books); HL.bookcase(S.cx + 1.2, yd, S.z0 + 0.3, 0, 4, 3, books);
    for (let q = 0; q < 2; q++) { KIT.cyl(S.cx, yd + 4.0, S.z0 + 5 + q * 7.5, 0.3, 0.5, KIT.emis(0x58e0a0, 2.2), { seg: 8, col: false, r1: 0.18 }); KIT.cyl(S.cx, yd + 4.5, S.z0 + 5 + q * 7.5, 0.015, yc - yd - 4.5, M.iron, { seg: 4, col: false }); } HL.DUN.sly = S; }
  // ---- the Hufflepuff common room: round-topped barrels at the door, warm lamps, plants, deep chairs
  { const Hh = room('THE HUFFLEPUFF COMMON ROOM', -90, -82.4, 60, 80.2, [['w', 70, 2.4]], { floor: I.oak });
    GK.hearth(L, Hh.x0, yd, Hh.cz, 1, 0, 3.2, 4.4); KIT.cyl(Hh.cx, yd + 0.004, Hh.cz, 3.0, 0.014, yellow, { seg: 24, col: false });
    for (let a = 0; a < 5; a++) { const an = a / 5 * TAU + 0.5, x = Hh.cx - 0.6 + Math.cos(an) * 2.2, z = Hh.cz + Math.sin(an) * 2.6; HL.armchair(x, yd, z, -an + HALF, a % 2 ? yellow : black); }
    KIT.cyl(Hh.cx - 0.6, yd, Hh.cz, 0.7, 0.55, I.oak, { seg: 12 }); HL.candlestick(Hh.cx - 0.6, yd + 0.55, Hh.cz, 5);
    for (const z of [Hh.z0 + 3, Hh.z1 - 3]) { HL.banner(Hh.cx, yd + 4.9, z < Hh.cz ? Hh.z0 + 0.1 : Hh.z1 - 0.1, z < Hh.cz ? 0 : PI, 1.6, 3.4, 'hufflepuff'); for (const x of [Hh.x0 + 1, Hh.x1 - 1]) { KIT.cyl(x, yd, z, 0.36, 0.6, copper, { seg: 10, r1: 0.42 }); for (let q = 0; q < 4; q++) KIT.geo(new THREE.SphereGeometry(0.34 + rs() * 0.2, 7, 5), green, new THREE.Matrix4().makeTranslation(x + (rs() - 0.5) * 0.4, yd + 0.9 + q * 0.3, z + (rs() - 0.5) * 0.4)); } }
    barrel(Hh.x1 - 0.8, 68, 0.6, 1.3); barrel(Hh.x1 - 0.8, 72, 0.6, 1.3); table(Hh.x0 + 1, Hh.z1 - 5.4, Hh.x0 + 2.4, Hh.z1 - 2); HL.bookcase(Hh.cx, yd, Hh.z1 - 0.3, PI, 3.6, 3, books);
    HL.sl(Hh.cx, yd + 4, Hh.cz, 0xffc070, 14, 13, { flicker: 0.15 }); for (const z of [Hh.z0 + 5, Hh.z1 - 5]) { KIT.geo(new THREE.SphereGeometry(0.26, 10, 8), KIT.emis(0xffc060, 2.4), new THREE.Matrix4().makeTranslation(Hh.cx, yd + 4.2, z)); KIT.cyl(Hh.cx, yd + 4.4, z, 0.015, yc - yd - 4.4, M.iron, { seg: 4, col: false }); } HL.DUN.huf = Hh; }
  // ---- the potions dungeon: benches with simmering cauldrons, the master's desk, ingredient shelves
  { const Pd = room('THE POTIONS DUNGEON', -90, -82.4, 40, 58.8, [['w', 50, 2.4]], {});
    for (let z = Pd.z0 + 3.5; z < Pd.z1 - 4; z += 3.6) for (const x of [Pd.x0 + 2.2, Pd.x1 - 2.4]) { table(x - 1.1, z - 0.5, x + 1.1, z + 0.5, 0.8); cauldron(x - 0.4, yd + 0.9, z, 0.3, [0x58e08a, 0xa070ff, 0xffa040, 0x50c0ff][((z + x) | 0) & 3]); KIT.cyl(x + 0.6, yd + 0.9, z + 0.1, 0.06, 0.22, F.glass || copper, { seg: 6, col: false }); }
    F.master && F.master(Pd.cx, yd, Pd.z1 - 2.2, PI); F.board && F.board(Pd.cx, yd + 1.2, Pd.z1 - 0.1, PI, 3.4, ['DRAUGHT OF PEACE']);
    for (const z of [Pd.z0 + 4, Pd.z0 + 10]) HL.bookcase(Pd.x0 + 0.3, yd, z, HALF, 3.2, 3, books); HL.sl(Pd.cx, yd + 3.4, Pd.cz, 0x70e8a0, 9, 13); torch(Pd.x0, Pd.z1 - 4, 1, 0); torch(Pd.cx, Pd.z0, 0, 1); }
  // ---- the cells
  { const Ce = room('THE DUNGEON CELLS', -76.6, -69, 40, 46.8, [['e', 43.4, 2.2]], {});
    for (let z = Ce.z0 + 0.3; z < Ce.z1; z += 0.32) KIT.cyl(Ce.cx + 0.8, yd, z, 0.035, 3.6, M.iron, { seg: 5, col: false }); PHY.box(Ce.cx + 0.7, yd, Ce.z0, Ce.cx + 0.9, yd + 3.6, Ce.z1); KIT.box(Ce.cx + 0.74, yd + 3.6, Ce.z0, Ce.cx + 0.86, yd + 3.72, Ce.z1, M.iron, { col: false });
    KIT.box(Ce.x1 - 2.2, yd, Ce.z0 + 0.4, Ce.x1 - 0.3, yd + 0.4, Ce.z0 + 1.3, I.oakD, {}); for (const z of [Ce.z0 + 1, Ce.z1 - 1]) { KIT.cyl(Ce.x1 - 0.1, yd + 2.2, z, 0.05, 0.05, M.iron, { seg: 6, col: false }); KIT.cyl(Ce.x1 - 0.14, yd + 1.3, z, 0.012, 0.9, M.iron, { seg: 4, col: false }); } torch(Ce.x0, Ce.z0 + 1.2, 1, 0); }
  HL.booksBuild && HL.booksBuild(L, books);
  KIT.tag = 'in'; HL.floo(L, 'The Dungeons', -66.5, 86.5, -HALF, yd); HL.floo(L, 'The Slytherin Common Room', 4.6, 100.6, -2.4, yd); KIT.tag = '';
});
HL.START.push(function (L) { const N = HL.STUDENTS || [], D = HL.DUN, yd = HL.Y0 - D.d; if (!N.length || !D.sly) return;
  [[D.sly.cx + 3.4, D.sly.z0 + 8.4, 2.2, 'talk'], [D.sly.cx + 2.4, D.sly.z0 + 9.4, -1, 'idle'], [D.sly.cx - 3, D.sly.z1 - 5, 0.6, 'calm'], [D.huf.cx + 1.6, D.huf.cz + 3.4, 2.6, 'talk'], [D.huf.cx + 2.4, D.huf.cz + 2.2, -0.6, 'idle'], [D.kitchen.cx + 3, D.kitchen.cz + 6.4, 3, 'idle'], [-79.5, 87.5, 1.2, 'calm']].forEach((s, i) => { const t = N[(i * 3 + 1) % N.length]; if (CHAR.T[t]) HL.npc(t, s[0], s[1], s[2], { base: s[3], y: yd, far: 40 }); }); });
