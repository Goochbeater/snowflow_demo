// ===== 25-tower: the Gloaming Spire — a wizard's tower on its crag =====
{
  const G = AF.G, K = AF.K, W = AF.W, P = AF.PLAN;
  const c = (hex, mat, o = {}) => AF.col(hex, Object.assign({ mat }, o));
  Object.assign(K, {
    sp1: c(0x7c7694, 'stone', { jitter: 0.85, edge: 0.7 }), sp2: c(0x6a6486, 'stone', { jitter: 0.85, edge: 0.7 }), sp3: c(0x9a94b0, 'stone', { jitter: 0.6, edge: 0.65 }), spDark: c(0x4c4868, 'stone', { jitter: 0.8, edge: 0.7 }),
    spWin: c(0x3a2f58, 'glass', { emit: 0xb48aff, emitK: 2.0, mode: 'night', jitter: 0.1, edge: 0.2 }), spWinG: c(0x4a3f38, 'glass', { emit: 0xffc86a, emitK: 2.0, mode: 'night', jitter: 0.1, edge: 0.2 }),
    crystal: c(0x9ae8ff, 'glass', { emit: 0x5ad8ff, emitK: 1.6, mode: 'always', jitter: 0.2, edge: 0.4 }), crystalP: c(0xd09aff, 'glass', { emit: 0xb05aff, emitK: 1.5, mode: 'always', jitter: 0.2, edge: 0.4 }),
    starLantern: c(0x8a8aa0, 'glass', { emit: 0xfff2b0, emitK: 0.02, mode: 'always', jitter: 0.1, edge: 0.5 }),
    velvet: c(0x4a2f7a, 'cloth', { jitter: 0.3 }), starCloth: c(0x2a2a5e, 'cloth', { jitter: 0.3 }),
  });
  AF.onBuild('spire', 310, () => {
    const cx = P.CRAG[0], cz = P.CRAG[1], Y = P.CRAG_Y, FH = 7, NF = 8, TOP = Y + FH * NF;
    const ring = (y0, y1, rOut, rIn, col) => { const n = Math.ceil(rOut * 4) + 1; for (let y = y0; y < y1 - 1e-6; y += 0.25) { const ro = typeof rOut === 'function' ? rOut(y) : rOut, ri = typeof rIn === 'function' ? rIn(y) : rIn; const m = Math.ceil(ro * 4) + 1; for (let i = -m; i < m; i++) for (let k = -m; k < m; k++) { const d = Math.hypot(i + 0.5, k + 0.5) * 0.25; if (d < ro && d >= ri) { const cc = typeof col === 'function' ? col(i, y, k, d) : col; if (cc !== -1) W.setM(cx + i * 0.25 + 0.01, y + 0.01, cz + k * 0.25 + 0.01, cc); } } } };
    const at = (a, r) => [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
    const stone = (i, y, k) => { const band = Math.abs(((y - Y) % FH) - 0.1) < 0.3; if (band) return K.sp3; const h = AF.hash3(i >> 1, (y * 2) | 0, k >> 1); return h < 0.18 ? K.sp2 : h > 0.93 ? K.spDark : K.sp1; };
    const RO = (y) => 6.5 + Math.max(0, (Y + 4 - y) * 0.3) + (y > TOP - 4 ? (y - (TOP - 4)) * 0.6 : 0);
    ring(Y, TOP, RO, 5.75, stone);
    // floors with a stair opening; flight k climbs from floor k to floor k+1
    const SPAN = 2.8, A0 = Math.PI / 2 + 0.55;
    const inSector = (a, a0, a1) => { let d = ((a - a0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); return d < a1 - a0; };
    for (let f = 0; f <= NF; f++) {
      const fy = Y + f * FH, a1 = A0 + (f - 1) * SPAN;
      ring(fy, fy + 0.25, f === NF ? 9 : 5.75, 0, (i, y, k, d) => { if (f > 0 && d > 4.0 && inSector(Math.atan2(k + 0.5, i + 0.5), a1 + SPAN * 0.56, a1 + SPAN + 0.02)) return 0; return f === NF ? K.sp3 : f === 0 ? (((i >> 2) + (k >> 2)) & 1 ? K.sp3 : K.spDark) : K.plank; });
    }
    for (let f = 0; f < NF; f++) { const fy = Y + f * FH, a0 = A0 + f * SPAN; for (let s = 0; s <= 560; s++) { const t = s / 560, a = a0 + t * SPAN, y = fy + 0.25 + Math.floor(t * 27.999) * 0.25; for (let r = 4.3; r < 5.8; r += 0.12) { const p = at(a, r); W.setM(p[0], y, p[1], s % 20 < 2 ? K.oak : K.plankLight); } } }
    // door (south) + windows
    W.fill(cx - 0.75, Y + 0.25, cz + 5.25, cx + 0.75, Y + 2.75, cz + 8.5, 0); W.fill(cx - 1.25, Y, cz + 6.5, cx - 0.75, Y + 3.25, cz + 7.75, K.sp3); W.fill(cx + 0.75, Y, cz + 6.5, cx + 1.25, Y + 3.25, cz + 7.75, K.sp3); W.fill(cx - 1.25, Y + 2.75, cz + 6.5, cx + 1.25, Y + 3.5, cz + 7.75, K.sp3); W.fill(cx - 0.25, Y + 3.5, cz + 7.25, cx + 0.25, Y + 4, cz + 7.75, K.crystal);
    W.fill(cx - 0.75, Y + 0.25, cz + 6, cx + 0.75, Y + 2.75, cz + 7, 0);
    for (let f = 0; f < NF; f++) for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + 0.35 + f * 0.9; if (f === 0 && Math.abs(AF.angDiff(a, Math.PI / 2)) < 0.6) continue; const wy = Y + f * FH + 2.5; for (let r = 5.6; r < 6.9; r += 0.12) for (let s = -1; s <= 1; s++) { const p = at(a + s * 0.045, r); for (let y = wy; y < wy + 2 - (s ? 0.25 : 0); y += 0.25) if (W.getM(p[0], y, p[1])) W.setM(p[0], y, p[1], r > 6.2 ? ((f + j) % 3 ? K.spWin : K.spWinG) : 0); } const lp = at(a, 6.0); AF.addLight({ x: lp[0], y: wy + 1, z: lp[1], kind: 'window', color: (f + j) % 3 ? 0xb48aff : 0xffc86a, far: true }); }
    // parapet + deck
    ring(TOP + 0.25, TOP + 1, 9, 8.5, K.sp1); ring(TOP + 1, TOP + 1.75, 9, 8.5, (i, y, k) => (((Math.atan2(k, i) / Math.PI * 14 + 28) | 0) & 1 ? K.sp3 : -1));
    // lantern turret + cone roof
    const ty = TOP + 0.25; ring(ty, ty + 8, 2.9, 2.3, (i, y, k) => { const a = Math.atan2(k + 0.5, i + 0.5), q = Math.abs(((a / (Math.PI / 2) % 1) + 1) % 1 - 0.5); return (y > ty + 1 && y < ty + 6.25 - q * 3 && q > 0.14) ? -1 : (y < ty + 1 ? K.sp3 : K.sp1); });
    ring(ty + 8, ty + 8.5, 3.9, 0, K.spDark); for (let k = 0; k < 40; k++) { const r = 3.9 - k * 0.0975; ring(ty + 8.5 + k * 0.25, ty + 8.75 + k * 0.25, r, Math.max(0, r - 0.6), (i, y, kk) => AF.hash3(i, y * 4, kk) < 0.06 ? K.goldMetal : K.rStar); }
    W.fill(cx - 0.125, ty + 18.5, cz - 0.125, cx + 0.125, ty + 21, cz + 0.125, K.goldMetal); W.fill(cx - 0.625, ty + 20, cz - 0.125, cx + 0.625, ty + 20.25, cz + 0.125, K.goldMetal); W.fill(cx - 0.125, ty + 20, cz - 0.625, cx + 0.125, ty + 20.25, cz + 0.625, K.goldMetal);
    // the star-lantern (dark until the story is done)
    W.fill(cx - 0.5, ty, cz - 0.5, cx + 0.5, ty + 1.5, cz + 0.5, K.brass); for (let j = 0; j < 9; j++) { const r = 0.25 + (4 - Math.abs(j - 4)) * 0.25; W.fill(cx - r, ty + 1.75 + j * 0.25, cz - r, cx + r, ty + 2 + j * 0.25, cz + r, K.starLantern); }
    G.lantern = { x: cx, y: ty + 3, z: cz, pal: K.starLantern };
    // deck: telescope + railing lamps
    { const p = at(2.4, 6); W.fill(p[0] - 0.25, ty, p[1] - 0.25, p[0] + 0.25, ty + 1.25, p[1] + 0.25, K.oak); W.fill(p[0] - 1, ty + 1.25, p[1] - 0.25, p[0] + 1, ty + 1.75, p[1] + 0.25, K.brass); G.scope2 = { x: p[0], y: ty + 1.5, z: p[1] }; }
    for (let j = 0; j < 6; j++) { const p = at(j * Math.PI / 3 + 0.3, 8.2); G.lamp(p[0], ty + 1, p[1], { kind: 'magic', color: 0xb48aff }); }
    // side turret (north-east) on a corbel + west balcony
    { const tc = at(-0.75, 7.6), y0 = Y + 26; const ocx = tc[0], ocz = tc[1];
      for (let y = y0 - 5; y < y0 + 14; y += 0.25) { const r = y < y0 ? 0.4 + (y - (y0 - 5)) * 0.44 : 2.6; const m = 12; for (let i = -m; i < m; i++) for (let k = -m; k < m; k++) { const d = Math.hypot(i + 0.5, k + 0.5) * 0.25; if (d < r && (y < y0 + 0.25 || d > r - 0.5 || y > y0 + 13.5)) { const x = ocx + i * 0.25, z = ocz + k * 0.25; if (Math.hypot(x - cx, z - cz) > 5.75) W.setM(x, y, z, (y > y0 + 6 && y < y0 + 8.5 && ((Math.atan2(k, i) * 2.5 + 20) | 0) % 3 === 0 && d > r - 0.3) ? K.spWinG : stone(i, y, k)); } } }
      for (let k = 0; k < 26; k++) { const r = 3.2 - k * 0.123; const m = 14; for (let i = -m; i < m; i++) for (let kk = -m; kk < m; kk++) { const d = Math.hypot(i + 0.5, kk + 0.5) * 0.25; if (d < r && d > r - 0.6) W.setM(ocx + i * 0.25, y0 + 14 + k * 0.25, ocz + kk * 0.25, K.rPlum); } }
      AF.addLight({ x: ocx + 1.6, y: y0 + 7, z: ocz - 1.8, kind: 'window', color: 0xffc86a, far: true });
      const by = Y + 5 * FH; W.fill(cx - 9, by, cz - 1.5, cx - 6, by + 0.25, cz + 1.5, K.plank); W.fill(cx - 9, by + 0.25, cz - 1.5, cx - 8.75, by + 1.25, cz + 1.5, K.oak); W.fill(cx - 9, by + 0.25, cz - 1.5, cx - 6.25, by + 1.25, cz - 1.25, K.oak); W.fill(cx - 9, by + 0.25, cz + 1.25, cx - 6.25, by + 1.25, cz + 1.5, K.oak); W.fill(cx - 7, by + 0.25, cz - 0.5, cx - 5.5, by + 2.25, cz + 0.5, 0);
    }
    // banners + pennant
    for (let j = 0; j < 4; j++) { const p = at(j * Math.PI / 2 + Math.PI / 4, 9.05); AF.kit.flag(p[0], TOP - 0.5, p[1], { kind: 'banner', w: 1.6, h: 7, c1: 0x4a2f7a, c2: 0xe0b03a, yaw: Math.atan2(p[0] - cx, p[1] - cz) }); }
    AF.kit.flag(cx, ty + 21, cz, { kind: 'pennant', w: 3.2, h: 1.1, c1: 0x4a2f7a, c2: 0xe0b03a });
    // ---- rooms
    const fy = (f) => Y + f * FH + 0.25, B = (x0, y0, z0, x1, y1, z1, col) => W.fill(cx + x0, y0, cz + z0, cx + x1, y1, cz + z1, col);
    const rug = (f, r, col, col2) => ring(fy(f) - 0.25, fy(f), r, 0, (i, y, k, d) => (d > r - 0.5 ? col2 : col));
    const sp = (name, f, x, z, o) => G.addSpot(name, cx + x, fy(f), cz + z, Object.assign({ place: 'spire', floor: f }, o));
    // 0 hall
    rug(0, 3, K.velvet, K.gold); B(-3.5, fy(0), -3, -2.75, fy(0) + 0.75, -2.25, K.pine); B(-2.5, fy(0), -3.5, -1.75, fy(0) + 0.75, -2.75, K.pine); B(3, fy(0), -2.5, 3.25, fy(0) + 2, -2.25, K.oak); B(2.75, fy(0) + 1.5, -2.75, 3.5, fy(0) + 2, -2, K.starCloth);
    G.lamp(cx, fy(0) + 5.5, cz, { kind: 'magic', color: 0xb48aff }); sp('hall', 0, 0, 2.5, {});
    // 1 kitchen
    B(-1, fy(1), -1, 1, fy(1) + 0.75, 1, K.plank); B(-1, fy(1) + 0.75, -1, 1, fy(1) + 1, 1, K.plankLight); B(-0.25, fy(1) + 1, -0.25, 0.25, fy(1) + 1.25, 0.25, K.pie); B(0.5, fy(1) + 1, 0.25, 0.75, fy(1) + 1.25, 0.75, K.bread);
    B(-3.5, fy(1), -3.5, -2, fy(1) + 1.75, -2.5, K.brick); B(-3.25, fy(1) + 0.25, -2.75, -2.25, fy(1) + 1, -2.5, 0); B(-3.25, fy(1) + 0.25, -3.25, -2.25, fy(1) + 0.5, -2.75, K.ember); B(2.5, fy(1), -3, 3.25, fy(1) + 1, -2.25, K.plank); B(2.5, fy(1), 2, 3.25, fy(1) + 1, 2.75, K.plank);
    AF.addLight({ x: cx - 2.7, y: fy(1) + 1, z: cz - 2.4, kind: 'hearth', color: 0xff8a3a }); sp('kitchen', 1, 0, 1.8, {});
    // 2 library
    for (const [x0, z0, x1, z1, ax] of [[-3.5, -0.5, -1, 0, 1], [1, -0.5, 3.5, 0, 1], [-0.25, -3.75, 0.25, -1.25, 0], [-0.25, 1.25, 0.25, 3]]) { const cs = [K.book1, K.book2, K.book3, K.book4, K.book5]; for (let s = 0; s < 8; s++) { const y = fy(2) + s * 0.5; B(x0, y, z0, x1, y + 0.25, z1, K.oakDark); const n = Math.round(Math.max(x1 - x0, z1 - z0) * 4); for (let i = 0; i < n; i++) if (AF.hash3(i, s, x0 * 9 + z0) > 0.12) { const col = cs[(AF.hash3(i, s, 77) * 5) | 0]; if (x1 - x0 > z1 - z0) B(x0 + i * 0.25, y + 0.25, z0, x0 + i * 0.25 + 0.25, y + 0.5, z1, col); else B(x0, y + 0.25, z0 + i * 0.25, x1, y + 0.5, z0 + i * 0.25 + 0.25, col); } } }
    B(2, fy(2), 2, 3.25, fy(2) + 0.75, 2.75, K.plank); B(2.25, fy(2) + 0.75, 2.25, 2.75, fy(2) + 1, 2.5, K.lime); G.lamp(cx + 3, fy(2) + 0.75, cz + 2.4, { kind: 'interior' }); G.library = { x: cx + 1.9, y: fy(2), z: cz + 1.2 }; sp('library', 2, 2, 1.2, {});
    // 3 alchemy lab
    ring(fy(3), fy(3) + 1, 1.25, 0, K.iron); ring(fy(3) + 0.5, fy(3) + 1, 1, 0, K.potion1); AF.addLight({ x: cx, y: fy(3) + 1.6, z: cz, kind: 'magic', color: 0x4affc0 }); G.cauldron = { x: cx, y: fy(3) + 1, z: cz };
    for (const [x, z] of [[-3.5, -2], [2.5, -3], [2.75, 2]]) { B(x, fy(3), z, x + 1.25, fy(3) + 1, z + 0.75, K.plank); for (let i = 0; i < 3; i++) B(x + 0.1 + i * 0.4, fy(3) + 1, z + 0.25, x + 0.35 + i * 0.4, fy(3) + 1.25 + (i & 1) * 0.25, z + 0.5, [K.potion1, K.potion2, K.potion3][(i + (x > 0 ? 1 : 0)) % 3]); } sp('lab', 3, 0, 2.2, {});
    // 4 conservatory
    ring(fy(4) - 0.25, fy(4), 4, 0, (i, y, k, d) => (d < 1.5 ? K.waterV : K.gMoss)); ring(fy(4), fy(4) + 0.25, 1.75, 1.5, K.sp3);
    for (let j = 0; j < 9; j++) { const a = j * 0.7 + 0.2, r = 2.6 + (j % 2) * 0.8, x = Math.cos(a) * r, z = Math.sin(a) * r, hh = 0.75 + (j % 3) * 0.5; B(x, fy(4), z, x + 0.25, fy(4) + hh, z + 0.25, K.stem); B(x - 0.25, fy(4) + hh, z - 0.25, x + 0.5, fy(4) + hh + 0.5, z + 0.5, [K.leafLight, K.flowerP, K.leaf, K.crystalP, K.flowerB][j % 5]); } AF.addLight({ x: cx, y: fy(4) + 2, z: cz, kind: 'magic', color: 0x9affc0 });
    // 5 the wizard's bedroom
    rug(5, 3.25, K.starCloth, K.gold); B(-1.25, fy(5), -3.75, 1.25, fy(5) + 0.5, -0.75, K.oakDark); B(-1.25, fy(5) + 0.5, -3.75, 1.25, fy(5) + 0.75, -0.75, K.velvet); B(-1, fy(5) + 0.75, -3.6, 1, fy(5) + 1, -3, K.pillow); B(-1.5, fy(5), -4, 1.5, fy(5) + 2.25, -3.75, K.oakDark);
    for (const sx of [-1.5, 1.25]) B(sx, fy(5), -1, sx + 0.25, fy(5) + 2.75, -0.75, K.oakDark); B(-1.5, fy(5) + 2.75, -4, 1.5, fy(5) + 3, -0.75, K.starCloth); B(2.5, fy(5), 1.5, 3.25, fy(5) + 0.75, 2.25, K.plank); B(2.75, fy(5) + 0.75, 1.75, 3, fy(5) + 1, 2, K.candle); AF.addLight({ x: cx + 2.9, y: fy(5) + 1.3, z: cz + 1.9, kind: 'interior' });
    G.wizBed = { x: cx, y: fy(5) + 0.75, z: cz - 2.2 }; sp('wizbed', 5, 0, -2.2, { kind: 'bed', y: fy(5) + 0.75 }); sp('bedside', 5, 1.9, -1.6, { yaw: -Math.PI / 2 });
    // 6 study
    B(-1.5, fy(6), 0.5, 1.5, fy(6) + 0.75, 1.75, K.oakDark); B(-1.5, fy(6) + 0.75, 0.5, 1.5, fy(6) + 1, 1.75, K.plank); B(-1, fy(6) + 1, 0.75, -0.25, fy(6) + 1.25, 1.25, K.lime); B(0.75, fy(6) + 1, 1, 1, fy(6) + 1.5, 1.25, K.crystalP);
    { const m = new AF.Model(8, 10, 8); m.box(3, 0, 3, 5, 3, 5, K.oak); m.sphere(4, 6.5, 4, 3.4, K.royalBlue, (x, y, z) => (AF.hash3(x >> 1, y >> 1, z >> 1) < 0.4 ? K.leaf : K.royalBlue)); W.stamp(m, cx - 3.5, fy(6), cz - 3); } sp('study', 6, 0, -0.5, { yaw: 0 }); G.lamp(cx - 1.2, fy(6) + 1, cz + 1.5, { kind: 'interior' });
    // 7 orrery chamber
    ring(fy(7), fy(7) + 0.5, 2, 0, K.sp3); ring(fy(7) + 0.5, fy(7) + 1, 1, 0, K.brass); G.orrery = { x: cx, y: fy(7) + 3.2, z: cz }; sp('orrery', 7, 0, 3, { yaw: Math.PI }); G.lamp(cx + 3.5, fy(7) + 0.1, cz - 2, { kind: 'magic', color: 0xb48aff });
    // crystals round the base + waterfall on the east face
    for (let j = 0; j < 11; j++) { const a = j * 0.57 + 2.3, p = at(a, 9 + (j % 3) * 2.2), y = W.groundY(p[0], p[1]), hh = 0.75 + (j % 4) * 0.5, col = j % 2 ? K.crystal : K.crystalP; W.fill(p[0], y, p[1], p[0] + 0.5, y + hh, p[1] + 0.5, col); W.fill(p[0] + 0.5, y, p[1] + 0.25, p[0] + 0.75, y + hh * 0.5, p[1] + 0.5, col); if (j % 3 === 0) AF.addLight({ x: p[0] + 0.25, y: y + hh + 0.3, z: p[1] + 0.25, kind: 'magic', color: j % 2 ? 0x5ad8ff : 0xb05aff }); }
    { G.fall = []; for (let s = 0; s < 150; s++) { const x = cx + 13 + s * 0.25, z = cz - 6 - s * 0.055; for (let w = -3; w <= 3; w++) { const zz = z + w * 0.25, y = W.groundY(x, zz); if (y > P.SEA_Y) { W.setM(x, y, zz, K.waterV); if (s % 6 === 0 && w === 0) G.fall.push({ x, y, z: zz }); } } } G.fallTop = { x: cx + 13, y: Y, z: cz - 6 }; }
    AF.addStructure({ id: 'spire-base', name: 'the Gloaming Spire', kind: 'tower', box: [cx - 8, Y, cz - 8, cx + 8, Y + 21, cz + 8] });
    AF.addStructure({ id: 'spire', name: 'the Gloaming Spire', kind: 'tower', box: [cx - 8, Y + 21, cz - 8, cx + 10, Y + 49, cz + 8] });
    AF.addStructure({ id: 'spire-crown', name: 'the Gloaming Spire', kind: 'tower', box: [cx - 9.5, Y + 49, cz - 9.5, cx + 9.5, TOP + 22, cz + 9.5] });
    G.spire = { x: cx, z: cz, y: Y, top: TOP, fy, FH, NF, door: [cx, cz + 9.5] };
    G.places.spire = { id: 'spire', name: 'the Gloaming Spire', door: [cx, cz + 9.5], inside: [cx, cz + 3], y: Y + 0.25 };
    AF.addLabel('The Gloaming Spire', cx, cz, 'place');
  });
}
