/* ==== p72_hl_castle.js ==== */
/* HOGWARTS — the castle on its crag: the quad and its wings, the Entrance Hall, the Great Hall, the Grand Staircase
   tower, the house tower, the Astronomy and clock towers, the gatehouse and the long viaduct over the loch. */
HL.FOOT = [];                         // rectangles where no turf grows: [x0, z0, x1, z1]
HL.foot = (x0, z0, x1, z1) => HL.FOOT.push([x0, z0, x1, z1]);
HL.GH = { x0: 16, z0: 24, x1: 96, z1: 48, h: 22 }; HL.EH = { x0: -16, z0: 20, x1: 16, z1: 52, h: 18 }; HL.ST = { x0: -14, z0: 52, x1: 14, z1: 80, floors: 6, fh: 12 }; HL.HT = { x: -38, z: 66, r: 12 };
HL.foot(-31, -47, 31, 21); HL.foot(-17, 19, 17, 53); HL.foot(15, 23, 97, 49); HL.foot(-15, 51, 15, 81); HL.foot(26, -45, 61, 21); HL.foot(-61, -45, -26, 21); HL.foot(-6, -244, 6, -44); HL.foot(-52, 52, -24, 80); HL.foot(38, 69, 94, 96);
HL.viaduct = function (L, x, z0, z1, y, w) {
  const M = HL.M(), n = Math.round((z1 - z0) / 25), sp = (z1 - z0) / n, hw = w / 2, pz = 2.4, H = 15;
  KIT.box(x - hw, y - 1.8, z0, x + hw, y, z1, M.stone, { mats: { Y: M.pave } });
  for (const s of [-1, 1]) { KIT.box(x + s * hw - 0.45, y, z0, x + s * hw + 0.45, y + 1.2, z1, M.stone); KIT.box(x + s * hw - 0.6, y - 2.3, z0, x + s * hw + 0.6, y - 1.7, z1, M.stone, { col: false }); }
  for (let i = 0; i <= n; i++) { const zc = z0 + i * sp, base = Math.min(HL.h(x, zc), HL.h(x - hw, zc), HL.h(x + hw, zc)) - 3;
    KIT.box(x - hw + 0.3, base, zc - pz, x + hw - 0.3, y - 1.8, zc + pz, M.stoneD, { col: base < y - 6 });
    KIT.box(x - hw - 0.5, base, zc - pz - 0.7, x + hw + 0.5, base + (y - base) * 0.3, zc + pz + 0.7, M.stoneD, { col: false });
    for (const s of [-1, 1]) { KIT.box(x + s * hw - 0.8, y - H - 9, zc - 1.2, x + s * hw + 0.8, y + 1.2, zc + 1.2, M.stone, { col: false }); KIT.box(x + s * hw - 0.9, y + 1.2, zc - 1.3, x + s * hw + 0.9, y + 1.6, zc + 1.3, M.stone, { col: false });
      if (i % 2 === 0 && i > 0 && i < n) { KIT.cyl(x + s * hw, y + 1.6, zc, 0.09, 2.6, M.iron, { seg: 6, col: false }); HL.lantern(L, x + s * hw, y + 4.3, zc); } }
    if (i < n) { const hg = sp / 2 - pz, zm = zc + sp / 2, ns = 9;   // a pointed arch under each span
      for (let k = 0; k < ns; k++) { const f0 = k / ns, ow = hg * Math.sqrt(Math.max(0, 1 - f0 * f0 * 0.97)), y0 = y - 1.8 - H + H * f0, y1 = y - 1.8 - H + H * (k + 1) / ns; if (hg - ow < 0.05) continue;
        KIT.box(x - hw + 0.3, y0, zm - hg, x + hw - 0.3, y1, zm - ow, M.stoneD, { col: false }); KIT.box(x - hw + 0.3, y0, zm + ow, x + hw - 0.3, y1, zm + hg, M.stoneD, { col: false }); } }
  }
};
/* a hanging lantern: a small iron cage with a warm heart, and a light for the pool */
HL.lantern = function (L, x, y, z, o) {
  o = o || {}; const M = HL.M();
  KIT.box(x - 0.16, y - 0.24, z - 0.16, x + 0.16, y + 0.24, z + 0.16, KIT.emis(o.col || 0xffb060, o.glow || 4), { col: false });
  KIT.box(x - 0.2, y + 0.24, z - 0.2, x + 0.2, y + 0.3, z + 0.2, M.iron, { col: false }); KIT.box(x - 0.2, y - 0.3, z - 0.2, x + 0.2, y - 0.24, z + 0.2, M.iron, { col: false });
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) KIT.box(x + a * 0.18 - 0.02, y - 0.26, z + b * 0.18 - 0.02, x + a * 0.18 + 0.02, y + 0.26, z + b * 0.18 + 0.02, M.iron, { col: false });
  return R.addLight({ pos: new THREE.Vector3(x, y, z), col: new THREE.Color(o.col || 0xffa858), i: o.i || 16, range: o.range || 13, prio: o.prio || 1, on: true });
};
HL.foot(38, 69, 94, 96); HL.foot(60, -48, 104, -6); HL.foot(-112, 30, -72, 96); HL.foot(8, 92, 34, 118);
HL.BUILD.push(async function castle(L) {
  const M = HL.M(), Y = HL.Y0, GH = HL.GH, EH = HL.EH, ST = HL.ST;
  // ---- the quad: flagstones, a fountain
  KIT.box(-30, Y - 1, -46, 30, Y + 0.05, 20, M.stone, { mats: { Y: M.pave } });
  { const fx = 0, fz = -14; KIT.cyl(fx, Y, fz, 4.2, 0.9, M.trim, { seg: 16 }); { const wm = new THREE.MeshStandardMaterial({ color: 0x3a6474, roughness: 0.08, metalness: 0.2, envMapIntensity: 1.6 }); wm.userData.tscale = 1; KIT.cyl(fx, Y + 0.6, fz, 3.7, 0.34, wm, { seg: 16, col: false }); } KIT.cyl(fx, Y, fz, 0.7, 2.6, M.trim, { seg: 10 }); KIT.cyl(fx, Y + 2.6, fz, 1.7, 0.3, M.trim, { seg: 12, col: false, r1: 2.0 }); KIT.cyl(fx, Y + 2.9, fz, 0.35, 1.5, M.trim, { seg: 8, col: false }); HL.FOUNTAIN = [fx, Y, fz]; }
  // ---- the two wings of the quad, a cloister walk along each
  for (const s of [-1, 1]) { const xa = s > 0 ? 30 : -60, xb = s > 0 ? 60 : -30;
    { const w = (p) => ({ p, w: 2.6, s: 2.4, top: 8.4, win: 1 }), dr = [{ p: 5.5, w: 3, sh: 3.4, top: 5.2 }], ow = [w(-7.33), w(3), w(13.33)], nw = [w(s * 36), w(s * 45), w(s * 54)];
      HL.wing(xa, -14, xb, 20, Y, 27, { storeys: 3, roof: 'z', dorm: 8, skip: 'z', hall: { h: 10, floor: s > 0 ? HL.IM().marble : HL.IM().oak, ops: s > 0 ? { x: dr, X: ow, Z: nw } : { X: dr, x: ow, Z: nw } } }); }
    { const w = (p) => ({ p, w: 2.6, s: 3.2, top: 15.5, win: 1 }), door = [{ p: -29.5, w: 3.6, sh: 4, top: 6.6 }], outer = [w(-39.5), w(-32.8), w(-26.2), w(-19.5)], south = [w((xa + xb) / 2 - 8), w((xa + xb) / 2), w((xa + xb) / 2 + 8)];
      for (const z of [-39.5, -34.5, -24.5, -19.5]) for (const yy of [8, 17]) HL.win(s * 29.98, Y + yy, z, s > 0 ? -HALF : HALF, 1.7, 5.4, HL.pickGlass(mulberry((z * 7 + yy) | 0), 0.6));
      HL.shell(xa, -44, xb, -14, Y, 27, { gk: 1, t: 1.5, roof: 'z', rise: 18.6, butt: 7.5, buttZ: false, floor: s > 0 ? HL.IM().oak : HL.IM().flagD, inside: HL.IM().oakL, ops: s > 0 ? { x: door, X: outer, z: south } : { X: door, x: outer, z: south } }); }
    const cx = s * 27.2; for (let z = -42; z <= 18; z += 5) { KIT.box(cx - 0.35, Y, z - 0.35, cx + 0.35, Y + 4.4, z + 0.35, M.trim, { col: true }); if (z < 18) { HL.GK.arch(cx, Y, z + 2.5, HALF, 4.3, 2.5, 4.25, { mat: M.trim, d: 0.6, f: 0.28 }); if (((z + 42) / 5) % 3 === 1) HL.sl(s * 28.6, Y + 3.2, z + 2.5, 0xffa858, 7, 9, { flicker: 0.4 }); } }
    KIT.box(Math.min(cx, s * 30), Y + 4.4, -44, Math.max(cx, s * 30), Y + 5, 20, M.stone, { col: false, mats: { Y: M.roof } }); }
  // ---- the gatehouse and the viaduct
  CAS.gate(0, -48, 0, Y, 8, 10.5, Y + 30, { span: 60, t: 5, open: true, mat: M.stone }); for (const sx of [-1, 1]) for (const xx of [20, 27]) { HL.win(sx * xx, Y + 17, -50.52, PI, 1.5, 4.4, M.glassD); }
  PHY.box(-30, Y - 3, -50.5, -4, Y + 31, -45.5); PHY.box(4, Y - 3, -50.5, 30, Y + 31, -45.5);
  for (const s of [-1, 1]) { HL.round(s * 13, -52, 6, Y, 52, { wa: 0.2, pots: 2 }); HL.round(s * 62, -60, 7.5, Y, 58, { pots: 3 }); HL.win(s * 20, Y + 9, -50.52, PI, 1.6, 4.6, M.glassD); HL.win(s * 20, Y + 9, -45.48, 0, 1.6, 4.6, M.glass); }
  HL.viaduct(L, 0, -246, -50, Y, 11);
  // ---- the Entrance Hall, bell towers at its shoulders
  { const w = (p) => ({ p, w: 3, s: 4, top: 13.5, win: 1 }); HL.shell(EH.x0, EH.z0, EH.x1, EH.z1, Y, EH.h, { gk: 1, t: 1.6, roof: 'z', rise: 13, floor: HL.IM().marble, inside: HL.IM().oakL, ops: {
    z: [w(-10), { p: 0, w: 5.6, sh: 5, top: 8.2 }, w(10)], X: [{ p: 36, w: 5, sh: 5, top: 7.8 }], Z: [{ p: 0, w: 4.6, sh: 4.6, top: 7.2 }], x: [w(30), w(42)] } }); }
  for (const s of [-1, 1]) HL.round(s * 16.5, 20, 3.2, Y, 34, { steep: 3 }); HL.win(0, Y + 19, 19.98, PI, 4.2, 6.5, M.glass);
  // ---- the Great Hall: tall traceried lights between flying buttresses, a fleche on the ridge
  { const wins = []; for (let i = 0; i < 8; i++) wins.push({ p: GH.x0 + 5 + i * 10, w: 4.2, s: 6, top: 19.5, win: 1 });
    HL.shell(GH.x0, GH.z0, GH.x1, GH.z1, Y, GH.h, { gk: 1, t: 1.8, roof: 'x', rise: 15, butt: 10, floor: HL.IM().flag, inside: HL.ceilMat ? HL.ceilMat() : null, ops: { z: wins, Z: wins, x: [{ p: 36, w: 5, sh: 5, top: 7.8 }], X: [{ p: 36, w: 10, s: 5.5, top: 21, win: 1 }] } });
    for (const z of [GH.z0, GH.z1]) HL.round(GH.x1 + 0.5, z, 3.4, Y, GH.h + 16, { steep: 3 });
    for (let x = GH.x0 + 10; x < GH.x1 - 4; x += 10) for (const s of [-1, 1]) { const zw = s > 0 ? GH.z1 : GH.z0, zo = zw + s * 6.5; if (s < 0 && x < 62) continue; KIT.box(x - 0.7, Y - 4, zo - 0.9, x + 0.7, Y + 15, zo + 0.9, M.stone, { col: true }); HL.pin(x, Y + 15, zo, 0.6, 4.4); KIT.beam([x, Y + 14, zo], [x, Y + 20.5, zw + s * 0.6], 0.6, M.trim); }
    { const fx = (GH.x0 + GH.x1) / 2, fy = Y + GH.h + 15; KIT.cyl(fx, fy - 1.5, 36, 1.5, 6, M.lead, { seg: 8, col: false }); HL.cone(fx, 36, 2.0, fy + 4.5, 15, { seg: 8 }); } }
  // ---- the Grand Staircase tower
  { const fh = ST.fh;
    for (let k = 0; k < ST.floors; k++) { const y = Y + k * fh, w2 = (p) => ({ p, w: 2.6, s: 3.2, top: 10, win: 1, shaft: k % 2 === 1 });
      HL.shell(ST.x0, ST.z0, ST.x1, ST.z1, y, fh, { gk: 1, t: 2, floor: k === 0 ? HL.IM().flag : false, plinth: k === 0, flat: false, ops: {
        z: k === 0 ? [{ p: 0, w: 4.6, sh: 4.6, top: 7.2 }] : (k * fh > EH.h + 14 ? [w2(-6), w2(6)] : []), Z: k === 0 ? [{ p: 0, w: 4.2, sh: 4, top: 6.4 }] : [w2(-6), w2(6)], X: k * fh > 30 ? [w2(60), w2(72)] : [w2(72)],
        x: k === 5 ? [{ p: 66, w: 3.2, sh: 3.6, top: 5.2 }] : [w2(60), w2(72)] } }); }
    const top = Y + ST.floors * fh; KIT.box(ST.x0 - 0.6, top, ST.z0 - 0.6, ST.x1 + 0.6, top + 0.9, ST.z1 + 0.6, M.trim, { mats: { y: M.wood } }); KIT.box(ST.x0 - 0.5, top + 0.9, ST.z0 - 0.5, ST.x1 + 0.5, top + 2.2, ST.z1 + 0.5, M.stone, { col: false });
    HL.pyr(0, 66, 13.4, 13.4, top + 2.2, 40, 0); for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) HL.round(sx * 14, 66 + sz * 14, 3, top - 22, 34, { base: top - 22, steep: 3.2, col: false });
    for (const [dx, dz, th] of [[0, -8, PI], [0, 8, 0], [8, 0, HALF], [-8, 0, -HALF]]) HL.dormer(dx * 1.2, top + 9, 66 + dz * 1.2, th, 2.6); }
  // ---- the house tower (its common room is furnished by the interiors part)
  { const HT = HL.HT; HL.round(HT.x, HT.z, HT.r, Y, 56.6, { col: false, roof: false, wa: 2.2 }); PHY.cyl(HT.x, HT.z, HT.r, Y - 12, Y + 59.3);
    { const g = new THREE.CylinderGeometry(HT.r, HT.r, 12.6, 40, 1, true, HALF + 0.16, TAU - 0.32); KIT.geo(g, M.stone, new THREE.Matrix4().makeTranslation(HT.x, Y + 59.3 + 6.3, HT.z), { uvs: 30, uvs2: 5.4 }); }
    HL.round(HT.x, HT.z, HT.r, Y + 71.9, 22, { base: Y + 71.9, col: false, steep: 2.4, pots: 4 }); PHY.cyl(HT.x, HT.z, HT.r, Y + 70.2, Y + 96);
    HL.round(HT.x - 11, HT.z + 10, 3.6, Y, 112, { steep: 3 }); }
  // ---- the Astronomy Tower, the clock tower
  HL.round(92, -34, 10, Y, 118, { steep: 2.0, open: true, pots: 4 }); HL.round(103, -30, 3.6, Y, 136, { steep: 3.2 }); HL.round(84, -44, 3, Y + 60, 62, { base: Y + 60, steep: 3.2, col: false });
  { const top = HL.square(74, 4, 7.5, 7.5, Y, 64, { steep: 3 }); for (const [dx, dz, ry] of [[0, -7.62, PI], [7.62, 0, HALF], [-7.62, 0, -HALF], [0, 7.62, 0]]) { const m4 = new THREE.Matrix4().makeRotationY(ry); m4.setPosition(74 + dx, top - 9, 4 + dz);
      KIT.geo(new THREE.CircleGeometry(3.8, 28), M.glass, m4, { uvs: 0.3 }); const m5 = m4.clone(); m5.setPosition(74 + dx * 1.004, top - 9, 4 + dz * 1.004); KIT.geo(new THREE.RingGeometry(3.7, 4.3, 28), M.trim, m5, { worldUV: true }); KIT.geo(new THREE.PlaneGeometry(0.3, 3.2).translate(0, 1.4, 0.03).rotateZ(-0.6), M.iron, m5); KIT.geo(new THREE.PlaneGeometry(0.36, 2.2).translate(0, 0.95, 0.03).rotateZ(1.9), M.iron, m5); } }
  // ---- the library range by the clock tower, the north range and its keep, the Headmaster's tower
  HL.wing(62, -46, 102, -8, Y, 30, { storeys: 3, roof: 'x', dorm: 8, skip: '' }); HL.square(82, -27, 8, 8, Y, 58, { steep: 2.8 });
  { const w = (p) => ({ p, w: 2.6, s: 2.2, top: 8.8, win: 1 }), c = (i) => 41.5 + 49 / 6 * (i + 0.5);
    HL.wing(40, 71, 92, 93, Y, 34, { storeys: 3, roof: 'x', dorm: 8, hall: { h: 11, ops: { z: [w(c(0)), { p: c(1), w: 3.2, sh: 3.4, top: 5.4 }, w(c(2)), w(c(3)), w(c(4)), w(c(5))], Z: [0, 1, 2, 3, 4, 5].map((i) => w(c(i))), X: [{ p: 82, w: 4, s: 2.2, top: 9, win: 1 }] } } }); } HL.square(66, 84, 9.5, 9.5, Y + 33, 51, { steep: 3, base: Y + 33 }); HL.round(98, 94, 6, Y, 70, { steep: 2.8, pots: 3 }); HL.round(36, 94, 4.4, Y, 58, { steep: 3 });
  HL.round(21, 105, 11, Y + 12, 120, { base: Y + 12, steep: 2.3, pots: 5, wa: 0.3, col: false }); PHY.cyl(21, 105, 11, Y + 12, Y + 133); HL.round(33, 114, 4, Y, 150, { steep: 3.4 }); HL.round(9.5, 112, 3.2, Y + 70, 60, { base: Y + 70, steep: 3.4, col: false });
  // ---- the east range: classrooms, the Defence tower, glasshouses on the lawn beyond
  { const w = (p) => ({ p, w: 2.5, s: 2.2, top: 8.2, win: 1 }), d = (p) => ({ p, w: 3, sh: 3.4, top: 5.2 }), zs = [68.33, 78, 87.67];
    HL.wing(-112, 62, -72, 94, Y, 24, { storeys: 2, roof: 'x', dorm: 8, hall: { h: 10, floor: HL.IM().oak, ops: { z: [d(-97.2), d(-86.8), w(-106), w(-78)], Z: [w(-106), w(-97.2), w(-86.8), w(-78)], x: zs.map(w), X: zs.map(w) } } }); } HL.round(-92, 103, 8, Y, 72, { pots: 4 }); HL.square(-45, 34, 9, 9, Y, 56, { steep: 2.8 }); HL.round(-45, -12, 8, Y + 26, 48, { base: Y + 26, steep: 2.4, pots: 4, col: false });
  for (let i = 0; i < 3; i++) { const gx0 = -108, gz0 = 32 + i * 9.4, gx1 = -76, gz1 = gz0 + 7; KIT.box(gx0, Y - 0.6, gz0, gx1, Y + 0.7, gz1, M.stone, { col: true }); for (let x = gx0; x <= gx1 + 0.01; x += 4) { KIT.box(x - 0.08, Y + 0.7, gz0, x + 0.08, Y + 3.4, gz0 + 0.16, M.lead, { col: false }); KIT.box(x - 0.08, Y + 0.7, gz1 - 0.16, x + 0.08, Y + 3.4, gz1, M.lead, { col: false }); KIT.beam([x, Y + 3.4, gz0 + 0.08], [x, Y + 5.6, (gz0 + gz1) / 2], 0.12, M.lead); KIT.beam([x, Y + 3.4, gz1 - 0.08], [x, Y + 5.6, (gz0 + gz1) / 2], 0.12, M.lead); }
    KIT.box(gx0, Y + 0.7, gz0 + 0.04, gx1, Y + 3.4, gz0 + 0.1, M.green, { col: false }); KIT.box(gx0, Y + 0.7, gz1 - 0.1, gx1, Y + 3.4, gz1 - 0.04, M.green, { col: false });
    for (const s of [-1, 1]) HL.quad(M.green, [gx0, Y + 3.4, s < 0 ? gz0 : gz1], [gx1, Y + 3.4, s < 0 ? gz0 : gz1], [gx1, Y + 5.6, (gz0 + gz1) / 2], [gx0, Y + 5.6, (gz0 + gz1) / 2], [0, 1, s]);
    KIT.box(gx0 + 1, Y + 0.7, gz0 + 1.2, gx1 - 1, Y + 1.2, gz1 - 1.2, new THREE.MeshStandardMaterial({ color: 0x3a6a2c, roughness: 1 }), { col: false }); }
  // ---- lesser towers on the rim and the curtain that ties them, rising out of the rock
  for (const [x, z, r, h, o] of [[112, 62, 7.5, 76, { pots: 3 }], [112, 12, 6.5, 54, {}], [-66, 30, 5, 36, {}], [60, 62, 4.6, 62, { steep: 3 }], [128, -18, 7, 40, {}], [126, 104, 7, 44, { pots: 3 }], [64, 124, 6, 36, {}], [-30, 122, 6.5, 40, {}], [-112, 110, 7, 46, { pots: 3 }], [-116, 20, 6, 34, {}], [-112, -50, 7, 40, { pots: 3 }], [-66, -62, 6, 34, {}]]) HL.round(x, z, r, Y, h, o);
  HL.square(45, -52, 6, 6, Y, 34, {}); HL.square(-45, -52, 6, 6, Y, 34, {});
  const W = (a, b, c, d, o) => CAS.wall(a, b, c, d, Y - 26, Y + 9, Object.assign({ mat: M.stoneD, t: 3.4, col: true, side: 1, bstep: 11 }, o || {}));
  W(18, -52, 56, -60, { side: -1 }); W(-56, -60, -18, -52, { side: -1 }); W(68, -62, 124, -24, { side: -1 }); W(128, -10, 114, 8, { side: -1 }); W(114, 18, 114, 55, { side: -1 }); W(116, 68, 126, 98, { side: -1 }); W(120, 108, 70, 124, { side: -1 }); W(58, 124, -24, 122, { side: -1 }); W(-36, 122, -106, 112, { side: -1 }); W(-114, 104, -116, 26, { side: -1 }); W(-116, 14, -112, -44, { side: -1 }); W(-106, -54, -72, -62, { side: -1 });
  // a postern in the north curtain, a terrace and steps to the grounds
  KIT.box(-8, Y - 6, 80, 8, Y + 0.04, 92, M.stone, { mats: { Y: M.pave } });
});
