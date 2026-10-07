/* ==== p60b_or_dress.js ==== */
/* LIMGRAVE, dressed — what makes it a place instead of a lawn: crags and boulders, the river and its bridge, a ruined
   aqueduct striding across the valley, broken towers and wall-ends on every rise, thickets, and Stormveil made vast. */
/* an angular boulder: a noisy lump cut by a few random planes (flat fracture faces), half sunk */
WORLD.boulderGeo = function (seed, r, o) {
  o = o || {}; const g = new THREE.IcosahedronGeometry(1, o.detail || 3), p = g.attributes.position, rs = mulberry(seed), off = [rs() * 40, rs() * 40, rs() * 40];
  const planes = []; for (let i = 0; i < (o.cuts || 7); i++) { const n = V3(rs() - 0.5, (rs() - 0.35) * 0.9, rs() - 0.5).normalize(); planes.push([n, 0.52 + rs() * 0.34]); }
  const sx = 0.8 + rs() * 0.7, sy = (o.flat || 0.55) + rs() * 0.5, sz = 0.8 + rs() * 0.7;
  for (let i = 0; i < p.count; i++) { let v = V3(p.getX(i), p.getY(i), p.getZ(i));
    v.multiplyScalar(1 + (fbm3(v.x * 1.1 + off[0], v.y * 1.1 + off[1], v.z * 1.1 + off[2], 3) - 0.5) * 0.5);
    for (const [n, d] of planes) { const q = v.dot(n); if (q > d) v.addScaledVector(n, d - q); }
    v.multiplyScalar(1 + (fbm3(v.x * 5 + off[1], v.y * 5, v.z * 5 + off[0], 2) - 0.5) * 0.07);
    p.setXYZ(i, v.x * r * sx, v.y * r * sy, v.z * r * sz); }
  g.computeVertexNormals(); return g;
};
WORLD.ROCKS = { small: ['ms2a', 'ms2c', 'ms2e'], mid: ['ms1a', 'ms1d', 'bld1', 'bld3'], big: ['bld2', 'bld4', 'bld5', 'ms1a'] };
WORLD.ROCK_GRADE = { bld2: [0.3, 0.84, 0.88, 0.9], bld3: [0.3, 0.8, 0.84, 0.86], bld4: [0.3, 0.86, 0.9, 0.92], bld5: [0.3, 0.84, 0.88, 0.9], bld1: [0.5, 0.95, 0.97, 0.96], cliffC: [0.2, 0.95, 0.98, 0.98], cliffD: [0.2, 0.92, 0.95, 0.96], cliffE: [0.3, 1.25, 1.3, 1.28], cliffA: [0.3, 1.0, 1.03, 1.02], cliffB: [0.3, 1.0, 1.03, 1.02] };
WORLD.rockMat = (name) => AST.material(name, { grade: WORLD.ROCK_GRADE[name] || [0.8, 0.95, 0.97, 0.95], moss: name.startsWith('cliff') ? 0.75 : 0.5, env: 0.4, side: THREE.DoubleSide });   // (the scanned rocks have no undersides: on a slope, or flown under, one-sided they were see-through)
WORLD.boulder = function (x, z, r, seed, mat, o) {
  o = o || {}; const y = o.y !== undefined ? o.y : WORLD.gy(x, z);
  if (WORLD._rocks) {   // the scanned boulders: queued, then batched once the level is built
    const P = WORLD.ROCKS[r < 0.62 ? 'small' : r < 1.7 ? 'mid' : 'big'], name = P[seed % P.length], sz = AST.info(name).size, s = 2 * r / Math.max(sz[0], sz[2]) * (o.flat ? 1.15 : 1);
    WORLD._rocks.push({ m: name, p: [x, y - sz[1] * s * (o.sink !== undefined ? o.sink + 0.1 : 0.16), z], s: [s, s * (0.85 + (seed % 5) * 0.07), s], r: [((seed % 7) - 3) * 0.045, (seed % 100) / 100 * TAU, ((seed % 5) - 2) * 0.05] });
    if (o.col !== false && r > 0.7) PHY.cyl(x, z, r * 0.7, y - 3, y + sz[1] * s * 0.62); return; }
  KIT.geo(WORLD.boulderGeo(seed, r, o), mat, new THREE.Matrix4().compose(V3(x, y + r * (o.sink !== undefined ? o.sink : 0.12), z), new THREE.Quaternion().setFromEuler(new THREE.Euler((seed % 7) * 0.08 - 0.25, (seed % 100) / 100 * TAU, (seed % 5) * 0.09 - 0.18)), V3(1, 1, 1)), { worldUV: true });
  if (o.col !== false && r > 0.7) PHY.cyl(x, z, r * 0.72, y - 3, y + r * 0.7);
};
WORLD.rocksBegin = () => { WORLD._rocks = AST.init() && AST.sets.rock_moss_set_01 ? [] : null; };
WORLD.rocksEnd = (L, o) => { if (WORLD._rocks && WORLD._rocks.length) AST.scatter(L, WORLD._rocks, Object.assign({ mat: WORLD.rockMat, cell: 340, lodD: 34, lodK: 0.8, far: 300 }, o || {})); WORLD._rocks = null; };
/* cliff pieces (scanned rock faces, scaled up) standing against every steep face of a terrain grid.
   o: { ok(x, z) -> bool, minH, step, seed } */
WORLD.cliffs = function (L, G, o) {
  o = o || {}; const rs = MG.rs(o.seed || 'cliffs'), e = 3, cand = [], H = (x, z) => { const h = G.hf(x, z); return h === null ? -999 : h; };
  for (let z = G.z0 + 8; z < G.z1 - 8; z += (o.step || 5)) for (let x = G.x0 + 8; x < G.x1 - 8; x += (o.step || 5)) {
    const gx = (H(x + e, z) - H(x - e, z)) / (2 * e), gz = (H(x, z + e) - H(x, z - e)) / (2 * e), sl = Math.hypot(gx, gz); if (sl < (o.slope || 0.72) || sl > 40) continue;
    if (o.ok && !o.ok(x, z)) continue;
    const dx = -gx / sl, dz = -gz / sl; let fx = x, fz = z, tx = x, tz = z;
    for (let k = 0; k < 14; k++) { const nx = fx + dx * 3, nz = fz + dz * 3; if (H(nx, nz) < -900 || H(fx, fz) - H(nx, nz) < 1.0) break; fx = nx; fz = nz; }
    for (let k = 0; k < 14; k++) { const nx = tx - dx * 3, nz = tz - dz * 3; if (H(nx, nz) < -900 || H(nx, nz) - H(tx, tz) < 1.0) break; tx = nx; tz = nz; }
    const fh = H(tx, tz) - H(fx, fz); if (fh < (o.minH || 7)) continue;
    cand.push({ x, z, dx, dz, fh, fy: H(fx, fz), fx, fz, tx, tz, k: rs() }); }
  cand.sort((a, b) => b.fh * (0.7 + 0.6 * b.k) - a.fh * (0.7 + 0.6 * a.k));
  // each piece is stretched to its face: as tall as the drop, as deep as the run from foot to brow, toe at the foot
  const placed = [], list = [];
  for (const c of cand) {
    let name; const q = rs();
    if (c.fh > 30) name = q < 0.5 ? 'cliffE' : q < 0.8 ? 'cliffC' : 'cliffD';
    else if (c.fh > 14) name = q < 0.35 ? 'cliffC' : q < 0.6 ? 'cliffE' : q < 0.8 ? 'cliffA' : 'cliffD';
    else name = q < 0.35 ? 'cliffA' : q < 0.6 ? 'cliffC' : q < 0.8 ? 'cliffB' : 'cliffD';
    if (o.kind) name = o.kind(c, name) || name;
    const E = AST.info(name), sz = E.size, F = E.face || [0, 1, sz[2] / 2, -sz[2] / 2];
    const sy = clamp(c.fh * (0.8 + rs() * 0.1) / sz[1], 1.2, 9), sx = clamp(sy * (0.8 + rs() * 0.5), 1.2, name === 'cliffD' ? 2.6 : 6), run = Math.hypot(c.tx - c.fx, c.tz - c.fz) + 2;
    const szz = clamp(run / (F[2] - F[3]), sy * 0.3, sy * 1.1), half = sz[0] * sx * 0.5;
    if (placed.some((p) => Math.abs(p[3] - c.fy) < 9 && Math.hypot(p[0] - c.x, p[1] - c.z) < (p[2] + half) * (o.pack || 0.5))) continue;
    placed.push([c.x, c.z, half, c.fy]);
    const yaw = Math.atan2(c.dx, c.dz) + (rs() - 0.5) * 0.3, back = F[2] * szz * 0.9 - 1.0, px = c.fx - c.dx * back, pz = c.fz - c.dz * back, py = c.fy - sz[1] * sy * 0.05 - 0.5;
    list.push({ m: name, p: [px, py, pz], s: [sx, sy, szz], r: [0, yaw, 0] });
    if (o.col !== false) PHY.obox(lerp(c.fx, c.tx, 0.5), lerp(c.fz, c.tz, 0.5), half * 0.8, run * 0.5, c.fy - 2, c.fy + c.fh * 0.9, yaw);
  }
  WORLD._cliffDbg = { cand: cand.length, placed: list.length, list };
  if (list.length) AST.scatter(L, list, { mat: (n, li) => AST.material(n, li ? { grade: WORLD.ROCK_GRADE[n], moss: 0.8, env: 0.4, side: THREE.DoubleSide } : { grade: WORLD.ROCK_GRADE[n], moss: 0.8, env: 0.4, detail: 0.7, side: THREE.DoubleSide }), cell: 340, lodD: o.lodD || 55, lodK: 0.7, shadow: o.shadow });
  return list;
};
/* a broken round tower: a drum, then a ragged crown of partial courses */
WORLD.brokenTower = function (x, z, r, h, seed, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.wall, y = (o.y !== undefined ? o.y : WORLD.gy(x, z)) - 1.5, rs = mulberry(seed);
  KIT.cyl(x, y, z, r, h, mat, { seg: 18, uvs: Math.round(TAU * r / 3.2) });
  let a0 = rs() * TAU, span = TAU * 0.8, yy = y + h;
  for (let i = 0; i < 5 && span > 0.5; i++) { const dh = 1.2 + rs() * 2.2; KIT.ring(x, z, r - 0.9, r, yy, yy + dh, mat, { a0, a1: a0 + span, sides: 18, col: false }); yy += dh; a0 += rs() * 0.6; span *= 0.55 + rs() * 0.25; }
  if (o.window !== false) for (let k = 0; k < 2; k++) { const a = rs() * TAU, wy = y + h * (0.4 + 0.3 * k); KIT.obox(x + Math.sin(a) * r * 0.99, wy, z + Math.cos(a) * r * 0.99, 0.3, wy + 1.7, 0.1, a, M.iron, { col: false }); }
  for (let i = 0; i < 5; i++) { const a = rs() * TAU, d = r + 0.8 + rs() * 2.5; WORLD.boulder(x + Math.cos(a) * d, z + Math.sin(a) * d, 0.5 + rs() * 0.8, seed * 7 + i, TERRAIN.cliffMat(0xb0aa9c), { detail: 2, cuts: 9 }); }
};
/* a run of aqueduct: tall piers, round arches, a channel on top; `broken` spans are left as stumps */
WORLD.aqueduct = function (ax, az, bx, bz, top, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.wall, L = Math.hypot(bx - ax, bz - az), n = Math.round(L / (o.span || 13)), yaw = Math.atan2(bx - ax, bz - az), c = Math.cos(yaw), s = Math.sin(yaw), w = o.w || 3.2, sp = L / n, R0 = (sp - 3) / 2;
  for (let i = 0; i <= n; i++) { const f = i / n, px = lerp(ax, bx, f), pz = lerp(az, bz, f), gy = WORLD.gy(px, pz) - 2;
    const dead = o.broken && o.broken.includes(i), hgt = dead ? Math.max(4, (top - gy) * (0.35 + 0.3 * hash2(i, 7))) : top - gy - 0.4;
    KIT.obox(px, gy, pz, w / 2, gy + hgt, 1.5, yaw, mat, { col: o.col !== false });
    if (i < n && !dead && !(o.broken && o.broken.includes(i + 1))) {
      const mx = lerp(ax, bx, (i + 0.5) / n), mz = lerp(az, bz, (i + 0.5) / n), ya = top - 2.2 - R0;
      for (let k = 0; k < 9; k++) { const a = (k + 0.5) / 9 * PI, l = -Math.cos(a) * (R0 + 0.35), up = Math.sin(a) * (R0 + 0.35); KIT.rbox(mx + l * s, ya + up, mz + l * c, (PI * (R0 + 0.35) / 9) / 2 + 0.04, 0.38, w / 2, 0, yaw - HALF, HALF - a, mat, 0.05); }
      KIT.obox(mx, top - 1.9, mz, w / 2, top, sp / 2 + 0.2, yaw, mat, { col: false });
      for (const sd of [-1, 1]) KIT.obox(mx + c * sd * (w / 2 - 0.2), top, mz - s * sd * (w / 2 - 0.2), 0.2, top + 0.7, sp / 2 + 0.2, yaw, mat, { col: false });
    }
  }
};
(function () {
  const def = LEVEL.defs.limgrave, build0 = def.build;
  def.build = async function (L) {
    WORLD.rocksBegin();
    await build0(L);
    const G = L.G, M = WORLD.M(), gy = WORLD.gy, rs = MG.rs('dress'), rock = TERRAIN.cliffMat(0xb0aa9c), dark = TERRAIN.cliffMat(0x8e887c);
    const clear = (x, z, m) => LIM.CLEAR.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] * (m || 1));
    const roadD = (x, z) => LIM.road(x, z, LIM._r).d;
    // ---- boulders: clusters on the slopes and the open fields (the big ones gather where the ground is steep)
    let nb = 0;
    for (let i = 0; i < 3000 && nb < 420; i++) { const x = -330 + rs() * 660, z = -345 + rs() * 880; if (roadD(x, z) < 4.5 || clear(x, z, 0.8)) continue; const h = G.hf(x, z); if (h === null || h < LIM.WATER + 0.2) continue;
      const e = 2, sl = Math.hypot(G.hf(x + e, z) - G.hf(x - e, z), G.hf(x, z + e) - G.hf(x, z - e)) / (2 * e); if (rs() > 0.16 + sl * 1.6) continue;
      const big = sl > 0.3 && rs() < 0.5, r = big ? 1.6 + rs() * 2.8 : 0.35 + rs() * rs() * 1.5; WORLD.boulder(x, z, r, i * 37 + 11, rs() < 0.5 ? rock : dark, { detail: r > 1.4 ? 3 : 2 }); nb++;
      if (big) for (let k = 0; k < 3; k++) { const a = rs() * TAU, d = r * (0.9 + rs() * 0.9); WORLD.boulder(x + Math.cos(a) * d, z + Math.sin(a) * d, 0.4 + rs() * 0.9, i * 91 + k, rock, { detail: 2 }); nb++; } }
    // the cliff under the First Step and the scarp edges: slabs of rock breaking out of the turf
    for (let i = 0; i < 46; i++) { const a = -0.3 + i / 46 * (PI + 0.6), d = 44 + rs() * 12, x = Math.cos(a) * d * 1.2, z = -310 + Math.sin(a) * d; if (roadD(x, z) < 7) continue; WORLD.boulder(x, z, 2 + rs() * 3.4, i * 53 + 5, i % 2 ? rock : dark, { detail: 3, flat: 0.8, col: false }); }
    // the crag under Stormveil and the Stormhill scarp: great broken slabs standing out of the face
    for (let i = 0; i < 150; i++) { const x = -320 + rs() * 640, z = (i % 3 ? 458 + rs() * 44 : 150 + rs() * 40); if (Math.abs(x) < 16 && z > 440) continue; if (roadD(x, z) < 9) continue; const h = G.hf(x, z); if (h === null) continue;
      const e = 2, sl = Math.hypot(G.hf(x + e, z) - G.hf(x - e, z), G.hf(x, z + e) - G.hf(x, z - e)) / (2 * e); if (sl < 0.5) continue;
      WORLD.boulder(x, z, 3 + rs() * 5.5, i * 71 + 9, i % 2 ? rock : dark, { detail: 3, flat: 0.9, cuts: 9, col: false, sink: 0.0 }); }
    // ---- thickets
    const bush = []; for (let i = 0; i < 5000 && bush.length < 520; i++) { const x = -320 + rs() * 640, z = -340 + rs() * 860; if (roadD(x, z) < 4 || clear(x, z, 0.7) || !LIM.ok(G, x, z, { road: 4, slope: 0.6 })) continue; if (fbm2(x * 0.03 + 8, z * 0.03, 2) < 0.48) continue; bush.push([x, z, 0.7 + rs() * 0.9, rs() * TAU, [0x4a5428, 0x56602e, 0x3f4a24, 0x6a6a32][rs() * 4 | 0]]); }
    WORLD.trees(L, bush, { kinds: 2, bush: true, h: 2.6, seed: 900 });
    // ---- the river's bridge (the road crosses the water at z ≈ -78)
    { const a = [17.2, -87.5], b = [27.6, -48.9], yaw = Math.atan2(b[0] - a[0], b[1] - a[1]), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, Lb = Math.hypot(b[0] - a[0], b[1] - a[1]), yd = 5.3, c = Math.cos(yaw), s = Math.sin(yaw), R0 = 3.9;
      KIT.obox(cx, yd - 0.9, cz, 3.3, yd, Lb / 2 + 2, yaw, M.flag || M.wall, { bottom: true });
      for (const sd of [-1, 1]) { KIT.obox(cx + c * sd * 3.2, yd - 1.5, cz - s * sd * 3.2, 0.32, yd + 0.95, Lb / 2 + 2, yaw, M.wall, { bottom: true });
        for (let k = 0; k < 5; k++) { const l = (k - 2) * 10.8 * 0.5 * 2 - 5.4 * 0; KIT.obox(cx + c * sd * 3.2 + s * (l + 5.4 * (k % 2 ? 0 : 0)), yd + 0.95, cz - s * sd * 3.2 + c * l, 0.4, yd + 1.5, 0.55, yaw, M.wall, { col: false }); } }
      for (const l of [-16.2, -5.4, 5.4, 16.2]) { const px = cx + s * l, pz = cz + c * l; KIT.obox(px, -5, pz, 3.5, yd - 0.9, 1.5, yaw, M.wall); KIT.obox(px, -5, pz, 4.1, 0.1, 2.0, yaw, M.dark, { col: false }); }
      for (const l of [-10.8, 0, 10.8]) { const mx = cx + s * l, mz = cz + c * l; for (let k = 0; k < 9; k++) { const an = (k + 0.5) / 9 * PI, d = -Math.cos(an) * (R0 + 0.3), up = Math.sin(an) * (R0 + 0.3); KIT.rbox(mx + d * s, yd - 1.2 - R0 + up, mz + d * c, (PI * (R0 + 0.3) / 9) / 2 + 0.05, 0.34, 3.4, 0, yaw - HALF, HALF - an, M.dark, 0.05); } }
    }
    WORLD.water(L, -200, -130, 100, -30, LIM.WATER);
    // ---- the aqueduct: out of the western scarp, across the valley and over the road
    WORLD.aqueduct(-150, -8, 150, 14, 27, { broken: [7, 8, 14, 15, 20] });
    LIM.cragCastle(L, G);
    // the old bridge across the head of the fjord: tall piers out of the water, its middle spans fallen
    { const A0 = [-27, -211], B0 = [-100, -228], n = 7, yd = 10.5, yaw = Math.atan2(B0[0] - A0[0], B0[1] - A0[1]), Lb = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]), c = Math.cos(yaw), s2 = Math.sin(yaw), sp = Lb / n, R0 = (sp - 3.2) / 2;
      for (let i = 0; i <= n; i++) { const f = i / n, px = lerp(A0[0], B0[0], f), pz = lerp(A0[1], B0[1], f), gyy = Math.min(G.hf(px, pz), -8) - 3, gone = i === 3 || i === 4; KIT.obox(px, gyy, pz, 3.3, gone ? yd - 9 - (i % 2) * 6 : yd - 1, 1.6, yaw, M.dark, { col: false }); KIT.obox(px, gyy, pz, 3.9, -5, 2.2, yaw, M.dark, { col: false });
        if (i < n && !(i >= 2 && i <= 4)) { const mx = lerp(A0[0], B0[0], (i + 0.5) / n), mz = lerp(A0[1], B0[1], (i + 0.5) / n); KIT.obox(mx, yd - 1.2, mz, 3.1, yd, sp / 2 + 0.3, yaw, M.dark, { bottom: true });
          for (const sd of [-1, 1]) KIT.obox(mx + c * sd * 2.9, yd, mz - s2 * sd * 2.9, 0.3, yd + 1.0, sp / 2 + 0.3, yaw, M.dark);
          for (let k = 0; k < 9; k++) { const an = (k + 0.5) / 9 * PI, d = -Math.cos(an) * (R0 + 0.3), up = Math.sin(an) * (R0 + 0.3); KIT.rbox(mx + d * s2, yd - 1.5 - R0 + up, mz + d * c, (PI * (R0 + 0.3) / 9) / 2 + 0.05, 0.36, 3.1, 0, yaw - HALF, HALF - an, M.dark, 0.05); } } } }
    // ---- broken towers and wall-ends on the rises
    const T = [[-70, -236, 4.2, 15], [78, -214, 3.6, 11], [-112, -92, 4.6, 19], [96, -150, 3.4, 9], [-76, 26, 4, 14], [118, 62, 4.4, 17], [-128, 96, 3.6, 12], [70, 132, 3.6, 10], [-90, 306, 4.4, 16], [84, 352, 4, 13], [-44, 420, 3.6, 12], [150, -40, 3.4, 12], [-150, -196, 4, 13], [46, -292, 3.2, 8], [232, 20, 4.4, 18], [-230, 60, 4, 15], [190, 250, 4, 14], [-180, 380, 4.4, 17]];
    T.forEach(([x, z, r, h], i) => { if (roadD(x, z) > 6 && !clear(x, z, 1) && G.hf(x, z) > 0) WORLD.brokenTower(x, z, r, h, i * 17 + 3, { mat: i % 3 === 0 ? M.dark : M.wall }); });
    const W = [[-58, -220, 0.4], [60, -250, 2.0], [-96, -60, 1.2], [52, -124, 0.2], [-60, 60, 2.6], [96, 20, 0.9], [-30, 118, 1.7], [64, 196, 0.3], [-64, 250, 2.2], [44, 300, 1.1], [130, -200, 2.4], [-140, -150, 0.7], [-20, -30, 1.4], [100, 300, 0.5], [-100, 420, 2.0]];
    W.forEach(([x, z, a], i) => { if (roadD(x, z) < 6 || clear(x, z, 1) || G.hf(x, z) < 0 || G.hf(x + Math.sin(a) * 12, z + Math.cos(a) * 12) < 0) return; const len = 8 + (i % 4) * 4, dx = Math.sin(a), dz = Math.cos(a);
      WORLD.wall(x, z, x + dx * len, z + dz * len, { h: 4 + (i % 3) * 1.6, ragged: 0.7, t: 1.0 }); if (i % 2 === 0) WORLD.wall(x, z, x + dz * len * 0.6, z - dx * len * 0.6, { h: 3.5, ragged: 0.8, t: 1.0 });
      if (i % 3 === 0) WORLD.arch(x + dx * (len + 3.6), z + dz * (len + 3.6), a + HALF, 4, 3.6, 1.1, {});
      for (let k = 0; k < 4; k++) WORLD.column(x - dz * (3 + k * 3.2) + dx * 2, z + dx * (3 + k * 3.2) + dz * 2, 1.2 + ((i + k) % 4) * 1.4, 0.42, { broken: (i + k) % 3 !== 0 }); });
    // ---- undergrowth: scanned ferns and shrubs gathered round rocks, ruins and the feet of trees; big slabs by the First Step
    if (WORLD._rocks) {
      const plants = [], pm = (n) => (typeof REALM !== 'undefined' ? REALM.plantMat(n, n.startsWith('shrub') ? 0xc8c8a4 : 0xd0d4a8) : AST.material(n, { color: n.startsWith('shrub') ? 0x8c8e6a : 0x9a9c7a, env: 0.2, alphaTest: 0.45 }));
      for (let i = 0; i < 9000 && plants.length < 900; i++) { const x = -330 + rs() * 660, z = -345 + rs() * 880; if (roadD(x, z) < 3.5 || clear(x, z, 1.05) || !LIM.ok(G, x, z, { road: 3.5, slope: 0.4 })) continue; const den = fbm2(x * 0.045 + 3, z * 0.045 + 8, 2); if (den < 0.52) continue;
        const k = rs(); if (k < 0.2) plants.push({ m: ['shrub_b', 'shrub_d', 'shrub_a'][i % 3], p: [x, G.hf(x, z) - 0.05, z], s: 0.8 + rs() * 0.7, r: [0, rs() * TAU, 0] });
        else plants.push({ m: ['fern_a', 'fern_d', 'fern_b', 'fern_c'][i % 4], p: [x, G.hf(x, z) - 0.02, z], s: 0.9 + rs() * 0.8, r: [0, rs() * TAU, 0] }); }
      AST.scatter(L, plants, { mat: pm, cell: 80, far: 80, shadow: false });
      for (const [x, z, r, sd] of [[-9, -262, 2.6, 3], [14, -256, 1.8, 8], [-16, -276, 1.5, 12], [-36, -276, 2.6, 5], [-4, -250, 1.1, 21], [9, -246, 1.4, 30], [3, -238, 0.8, 9], [-12, -244, 0.7, 6], [-30, -282, 0.9, 2], [-14, -268, 0.5, 13]]) WORLD.boulder(x, z, r, sd, rock, { flat: 1 });
    }
    // ---- lone towers on the far heights, half lost in the haze
    for (const [x, z, hw, h, o] of [[236, 330, 5, 74, { turret: true }], [-262, 250, 4.5, 60, {}], [296, 120, 4, 52, { roof: 'spire' }], [-292, 420, 5, 66, { turret: true }], [200, 470, 4.5, 58, {}], [-210, 130, 4, 44, {}], [280, 250, 3.6, 40, {}]]) { const y = G.hf(clamp(x, -335, 335), z) || 30; CAS.tower(x, z, hw, hw, y - 6, h, Object.assign({ mat: M.dark, win: 4 }, o)); }
    // ---- the scanned rock: every steep face gets cliff pieces, the queued boulders are batched
    if (WORLD._rocks) { const CL = LIM.CLEAR.slice(0, -1); WORLD.cliffs(L, G, { minH: 6, kind: (c, n) => (c.fy > 24 && Math.hypot(c.x - LIM.BLUFF[0], c.z - LIM.BLUFF[1]) < 60 ? (n === 'cliffE' || n === 'cliffD' ? 'cliffC' : n) : n), ok: (x, z) => roadD(x, z) > 13 && !CL.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] * 0.9) && !(Math.abs(x) < 20 && z > 436) });
      WORLD.rocksEnd(L); }
  };
})();
/* the castle on the crag over the inlet: what the First Step looks at */
LIM.cragCastle = function (L, G) {
  const M = WORLD.M(), B = LIM.BLUFF, yaw = -1.0, P = CAS.rot(B[0], B[1], yaw), Y = 57.5, Y1 = 31.5, mat = M.dark;
  const T = (lx, lz, hw, h, o) => { const p = P(lx, lz); return CAS.tower(p[0], p[1], hw, (o && o.hd) || hw, (o && o.y) || Y - 3, h + 3, Object.assign({ yaw }, o)); };
  const Rd = (lx, lz, r, h, o) => { const p = P(lx, lz); return CAS.round(p[0], p[1], r, (o && o.y) || Y - 3, h + 3, o); };
  const Wl = (a, b, top, o) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); CAS.wall(p[0], p[1], q[0], q[1], (o && o.y0) || Y - 4, top, Object.assign({ side: -1 }, o)); };
  // the keep and its two great towers
  { const p = P(2, 7); CAS.keep(p[0], p[1], 11.5, 7.5, Y - 3, 27, { yaw, gable: 0.7, rows: 2 }); }
  { const p = P(13, 14); CAS.keep(p[0], p[1], 6, 5, Y - 3, 34, { yaw, rows: 3 }); }
  T(-9, 11, 4.8, 50, { turret: true, win: 5 }); T(9, 3, 3.6, 39, { turret: true, win: 4 }); T(-2, 15, 3.0, 33, { win: 3 });
  // the wall towers of the upper ward
  T(-19, -7, 3.6, 22, { win: 2 }); Rd(17, -9, 4.2, 25, {}); T(22, 7, 3.2, 19, { win: 2 }); T(-21, 9, 3.0, 26, { win: 3, turret: true }); Rd(-7, 21, 3.4, 22, {}); T(10, 22, 3.0, 20, {});
  const ring = [[-19, -7], [-7, -16], [9, -16], [17, -9], [22, 7], [10, 22], [-7, 21], [-21, 9], [-19, -7]];
  for (let i = 0; i + 1 < ring.length; i++) if (i !== 1) Wl(ring[i], ring[i + 1], Y + 9, { t: 2.6, slits: true });
  // the great gate in the face of the upper ward, its two flanking towers
  { const p = P(1, -16); CAS.gate(p[0], p[1], yaw, Y - 3, 7.5, 15, Y + 19, { span: 16, t: 4.5 }); }
  T(-7.6, -16.5, 2.6, 23, { win: 2 }); T(9.6, -16.5, 2.6, 23, { win: 2 });
  // the lower ward on the first terrace: a ring of wall and towers along its lip
  const low = [[-41, 4], [-37, -16], [-24, -31], [-4, -38], [18, -35], [35, -22], [43, -2]];
  low.forEach(([lx, lz], i) => { if (i % 2) Rd(lx, lz, 3.4, 15 + (i % 3) * 3, { y: Y1 - 4 }); else T(lx, lz, 2.9, 14 + (i % 3) * 4, { y: Y1 - 4, win: 1 }); });
  for (let i = 0; i + 1 < low.length; i++) Wl(low[i], low[i + 1], Y1 + 7.5, { y0: Y1 - 5, t: 2.4, slits: true, bstep: 7 });
  // a hall and a chapel tower on the lower ward, a stair wall climbing between the wards
  { const p = P(22, -24); CAS.keep(p[0], p[1], 6.5, 4, Y1 - 3, 13, { yaw: yaw + 0.5, gable: 0.9, rows: 1 }); }
  T(-27, -14, 2.4, 21, { y: Y1 - 3, win: 2, roof: 'pyr' });
  Wl([-16, -26], [-12, -17], Y1 + 16, { y0: Y1 - 3, t: 2.2, buttress: 0 });
  // the aqueduct leaving the upper ward for the eastern hills
  { const a = P(-10, 26); WORLD.aqueduct(a[0], a[1], -262, -70, Y + 7, { col: false, mat, span: 15, w: 3.8, broken: [5] }); }
  for (const [lx, lz] of [[-12, -20], [14, -20], [-22, 2], [20, 14]]) { const p = P(lx, lz); WORLD.banner(L, p[0], Y + 12, p[1], yaw + PI, 2.2, 8); }
};
/* Stormveil, vast on its crag: keeps stacked on keeps, a crowd of battlemented towers of every height, a buttressed
   curtain, lesser towers falling away down both shoulders of the rock */
LIM.farCastle = function (L, G) {
  const M = WORLD.M(), mat = M.dark, top = (x, z) => (G.hf(clamp(x, -330, 330), Math.min(z, 556)) || 90);
  const T = (x, z, hw, h, o) => CAS.tower(x, z, hw, (o && o.hd) || hw, top(x, z) - 8, h + 8, Object.assign({ mat }, o));
  const Rd = (x, z, r, h, o) => CAS.round(x, z, r, top(x, z) - 8, h + 8, Object.assign({ mat }, o));
  CAS.keep(0, 550, 22, 8, top(0, 550) - 8, 66, { mat, rows: 3, gable: 0.6 }); CAS.keep(0, 552, 13, 6.5, top(0, 552) + 56, 34, { mat, rows: 2 });
  CAS.keep(-36, 547, 12, 7, top(-36, 547) - 8, 56, { mat, rows: 3 }); CAS.keep(38, 549, 13, 7, top(38, 549) - 8, 62, { mat, rows: 3, gable: 0.6 }); CAS.keep(-72, 541, 10, 6, top(-72, 541) - 8, 42, { mat }); CAS.keep(76, 545, 10, 6, top(76, 545) - 8, 46, { mat });
  for (const [x, z, hw, h, o] of [[0, 553, 6.5, 122, { turret: true, win: 6 }], [-18, 546, 4.4, 100, { roof: 'spire', win: 5 }], [19, 548, 4.6, 108, { turret: true, win: 5 }], [-36, 540, 5, 80, { turret: true }], [40, 542, 5, 88, { roof: 'spire' }],
    [-54, 532, 5.4, 62, {}], [58, 534, 5.6, 70, { turret: true }], [-88, 532, 5.6, 50, {}], [94, 536, 5.6, 56, {}], [-152, 542, 5, 36, { roof: 'pyr' }], [200, 550, 5, 34, {}], [-238, 552, 4.6, 26, {}],
    [-8, 522, 4.4, 44, {}], [15, 524, 4.4, 48, {}], [-27, 528, 3, 60, { roof: 'spire' }], [66, 526, 3, 56, { roof: 'spire' }]]) T(x, z, hw, h, o);
  for (const [x, z, r, h, o] of [[-120, 536, 6, 44, {}], [126, 540, 6.5, 50, {}], [160, 546, 6, 40, {}], [-192, 546, 5.5, 32, {}], [246, 554, 5.5, 30, {}]]) Rd(x, z, r, h, o);
  const y0 = Math.min(top(-54, 532), top(58, 534)) - 12;
  const run = [[-238, 552], [-192, 546], [-152, 542], [-120, 536], [-88, 532], [-54, 532], [-8, 522], [15, 524], [58, 534], [94, 536], [126, 540], [160, 546], [200, 550], [246, 554]];
  for (let i = 0; i + 1 < run.length; i++) { const a = run[i], b = run[i + 1], hh = 15 + 9 * Math.abs(Math.sin(i * 1.3)) + (Math.abs(i - 6) < 3 ? 12 : 0), tp = Math.min(top(a[0], a[1]), top(b[0], b[1])) + hh; CAS.wall(a[0], a[1], b[0], b[1], y0, tp, { mat, t: 4, side: -1, bstep: 11, slits: true }); }
  Rd(-292, 548, 6.5, 40, {}); WORLD.aqueduct(-286, 548, -240, 552, top(-236, 552) + 16, { col: false, mat, span: 11 });
};

/* scanned props set down in clusters: [[x, z, kind]] with kind 'stores' (barrels + crates), 'statue', 'rubble' */
WORLD.dressing = function (L, spots, o) {
  o = o || {}; const list = [], rs = MG.rs(o.seed || 'dressing'), gy = (x, z) => (o.y ? o.y(x, z) : WORLD.gy(x, z));
  for (const [x, z, kind, yaw] of spots) {
    if (kind === 'stores') { const n = 3 + (rs() * 3 | 0); for (let i = 0; i < n; i++) { const a = rs() * TAU, d = 0.3 + rs() * 1.5, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, m = ['barrel1', 'barrel2', 'crate', 'barrel1'][i % 4], s = 1.1 + rs() * 0.25;
        list.push({ m, p: [px, gy(px, pz), pz], s, r: [0, rs() * TAU, 0] }); PHY.cyl(px, pz, 0.42, gy(px, pz), gy(px, pz) + 1.0); if (m === 'crate' && rs() < 0.5) list.push({ m: 'crate', p: [px, gy(px, pz) + 0.36 * s, pz], s, r: [0, rs() * TAU, 0] }); } }
    else if (kind === 'statue') { const y = gy(x, z); KIT.box(x - 1.5, y, z - 1.5, x + 1.5, y + 0.5, z + 1.5, WORLD.M().dark); KIT.box(x - 1.15, y + 0.5, z - 1.15, x + 1.15, y + 2.4, z + 1.15, WORLD.M().dark); KIT.box(x - 1.4, y + 2.4, z - 1.4, x + 1.4, y + 2.75, z + 1.4, WORLD.M().dark, { col: false }); list.push({ m: 'statueGothic', p: [x, y + 2.75, z], s: 2.6, r: [0, yaw || 0, 0] }); }
    else if (kind === 'rubble') { for (let i = 0; i < 6; i++) { const a = rs() * TAU, d = rs() * 2.2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, m = ['ms2a', 'ms2b', 'ms2c', 'ms2e', 'ms2g'][i % 5]; list.push({ m, p: [px, gy(px, pz) - 0.1, pz], s: 0.6 + rs() * 0.7, r: [0, rs() * TAU, 0] }); } }
  }
  return AST.scatter(L, list, { mat: (n) => AST.material(n, n.startsWith('ms') ? { grade: [0.7, 0.9, 0.92, 0.92] } : n === 'statueGothic' ? { grade: [0.3, 0.8, 0.82, 0.8], env: 0.3 } : { env: 0.3 }), cell: 90, far: 140 });
};
