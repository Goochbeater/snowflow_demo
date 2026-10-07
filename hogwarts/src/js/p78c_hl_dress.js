/* ==== p78c_hl_dress.js ==== */
/* HOGWARTS — dressing and life: trees in stone planters, benches, lamp standards and statues about the quad and the
   lawns; a stone circle on the north lawn; villagers in Hogsmeade's street; owls wheeling round the Owlery. */
HL.bench = function (x, z, yaw, y) { const I = HL.IM(), M = HL.M(); y = y !== undefined ? y : HL.gy(x, z); KIT.obox(x, y + 0.42, z, 0.9, y + 0.5, 0.24, yaw, I.oak, { col: false }); const c = Math.cos(yaw), s = Math.sin(yaw); for (const u of [-0.75, 0.75]) KIT.obox(x + c * u, y, z - s * u, 0.07, y + 0.42, 0.22, yaw, M.trim, { col: false }); KIT.obox(x - s * 0.26, y + 0.5, z - c * 0.26, 0.9, y + 0.95, 0.04, yaw, I.oak, { col: false }); PHY.obox(x, z, 0.9, 0.26, y, y + 0.5, yaw); };
HL.lamp = function (L, x, z, y) { const M = HL.M(); y = y !== undefined ? y : HL.gy(x, z); KIT.cyl(x, y, z, 0.16, 0.5, M.iron, { seg: 8 }); KIT.cyl(x, y + 0.5, z, 0.06, 3.0, M.iron, { seg: 6, col: false }); KIT.box(x - 0.4, y + 3.3, z - 0.03, x + 0.03, y + 3.38, z + 0.03, M.iron, { col: false }); HL.lantern(L, x - 0.36, y + 3.0, z, { i: 13, range: 12 }); };
HL.statue = function (x, z, yaw, h, y) { const M = HL.M(); y = y !== undefined ? y : HL.gy(x, z); KIT.box(x - 0.7, y - 0.3, z - 0.7, x + 0.7, y + 1.1, z + 0.7, M.trim); KIT.box(x - 0.8, y + 1.1, z - 0.8, x + 0.8, y + 1.25, z + 0.8, M.trim, { col: false }); const me = AST.mesh('statueGothic'), s = (h || 2.6) / AST.info('statueGothic').size[1]; me.scale.setScalar(s); me.position.set(x, y + 1.25, z); me.rotation.y = yaw; LEVEL.add(me); };
HL.BUILD.push(async function dressing(L) {
  const M = HL.M(), Y = HL.Y0, trees = [], rs = MG.rs('dress');
  // ---- the quad: four planters with trees round the fountain, benches, lamps, founders' statues before the cloisters
  const _l = HL.lamp, _s = HL.statue, _b = HL.bench, ok = (x, z) => !HL.inFoot(x, z, 3); HL.lamp = (L2, x, z, y) => ok(x, z) && _l(L2, x, z, y); HL.statue = (x, z, a2, b2, c2) => ok(x, z) && _s(x, z, a2, b2, c2); HL.bench = (x, z, yw) => ok(x, z) && _b(x, z, yw);
  for (const [x, z] of [[-8, -40], [8, -40], [-8, 14], [8, 14], [-20, -14], [20, -14]]) HL.lamp(L, x, z, Y + 0.05);
  for (const [x, z, yw] of [[-23.5, -36, HALF], [-23.5, 8, HALF], [23.5, -36, -HALF], [23.5, 8, -HALF]]) HL.statue(x, z, yw, 2.8, Y + 0.05);
  // ---- the approach: lamps and a pair of winged boars on the gate piers, trees along the south lawn
  for (const s of [-1, 1]) { HL.statue(s * 7.5, -58, s > 0 ? -2.4 : 2.4, 2.4, Y); for (let i = 0; i < 5; i++) trees.push([s * (22 + i * 9 + rs() * 3), -66 - rs() * 10, 0.7 + rs() * 0.3, rs() * 6, [0x55782c, 0x7a8a2e, 0xa85a20][(rs() * 3) | 0]]); }
  // ---- the north lawn: an avenue down to the grounds, benches, a ring of standing stones with a sundial
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const x = s * 9 + (i > 3 ? -i * 2 : 0), z = 100 + i * 9; trees.push([x, z, 0.75 + rs() * 0.25, rs() * 6, [0x6a8a30, 0x9a7a28, 0xa85a20, 0x4a6e2a][(rs() * 4) | 0]]); if (i % 2 === 0) HL.lamp(L, x * 0.55, z + 4); }
  /* (the old stone ring stood on the north lawn of the first castle; the Hogwarts Legacy plan builds over that spot, so it now stands out on the open lawn north of the Bell Tower Courtyard) */
  { let cx = 60, cz = 150; if (HL.inFoot(cx, cz, 16)) { cx = 150; cz = 300; } const y = HL.h(cx, cz); if (!HL.inFoot(cx, cz, 12)) for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 9, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, gy = HL.h(x, z), h = 2.6 + (i % 3) * 0.9; KIT.rbox(x, gy + h / 2 - 0.3, z, 0.55, h / 2 + 0.3, 0.32, (rs() - 0.5) * 0.12, -a, (rs() - 0.5) * 0.14, M.rough, 0.12); PHY.cyl(x, z, 0.6, gy - 1, gy + h); if (i % 3 === 0) { const b = (i + 1) / 9 * TAU, x2 = cx + Math.cos(b) * r, z2 = cz + Math.sin(b) * r; KIT.rbox((x + x2) / 2, gy + 3.6, (z + z2) / 2, 3.3, 0.3, 0.4, 0, -(a + b) / 2 + HALF, 0, M.rough, 0.1); } }
    KIT.cyl(cx, y - 0.3, cz, 1.1, 1.2, M.trim, { seg: 12 }); KIT.cyl(cx, y + 0.9, cz, 1.3, 0.12, M.trim, { seg: 16, col: false }); KIT.rbox(cx, y + 1.25, cz, 0.03, 0.34, 0.5, 0.6, 0.4, 0, M.gold, 0.01); HL.foot(cx - 3, cz - 3, cx + 3, cz + 3); HL.STONES = [cx, y, cz]; }
  for (const [x, z, yw] of [[-14, 108, 0.4], [16, 118, -0.5], [-6, 136, 0.2], [70, 160, 2.2]]) HL.bench(x, z, yw);
  for (const [x, z] of [[-86, 28], [-98, 28], [-74, 100], [100, 30], [96, -62], [-90, -58], [116, 86]]) trees.push([x, z, 0.8 + rs() * 0.3, rs() * 6, [0x55782c, 0x6a8a30, 0x9a7a28][(rs() * 3) | 0]]);
  WORLD.trees(L, trees.filter((t) => ok(t[0], t[1])), { kinds: 3, h: 9, seed: 310 }); HL.lamp = _l; HL.statue = _s; HL.bench = _b;
  // ---- Hogsmeade: lamps exist; add benches, a notice pillar, a great tree on the square
  { const V = HL.VIL; for (const [dx, dz, yw] of [[-22, 5.2, PI], [18, 5.2, PI], [-40, -5.2, 0], [46, -5.2, 0], [-4, -12, 0]]) HL.bench(V.x + dx, V.z + dz, yw); WORLD.trees(L, [[V.x - 13, V.z - 16, 1.2, 1, 0x7a8a2e], [V.x + 15, V.z - 24, 1.0, 2, 0xa85a20]], { kinds: 2, h: 9, seed: 500 });
    KIT.cyl(V.x + 9, HL.h(V.x + 9, V.z - 10) - 0.3, V.z - 10, 0.5, 2.9, M.village, { seg: 10 }); HL.cone(V.x + 9, V.z - 10, 0.8, HL.h(V.x + 9, V.z - 10) + 2.6, 0.9, { seg: 10, mat: M.roofV }); }
});
HL.START.push(function (L) {
  // villagers and visiting students (built from templates that already exist by now)
  const V = HL.VIL, N = HL.STUDENTS || [], st = (i) => N[i % N.length], gy = (x, z) => HL.h(x, z);
  const spots = [[-30, 2.6, 2.0, 'talk'], [-28.6, 3.4, -1.2, 'idle'], [10, -3, 0.4, 'calm'], [26, 2.4, 2.8, 'idle'], [27.6, 3.0, -0.6, 'talk'], [-52, -2.6, 0.9, 'calm'], [48, -2.8, -2.2, 'idle'], [2, -13, 2.4, 'talk'], [3.4, -14.2, -0.4, 'idle'], [-8, -16, 1.6, 'calm']];
  spots.forEach((s, i) => { if (CHAR.T[st(i)]) HL.npc(i % 4 === 3 && CHAR.T.prof_b ? (i % 8 === 3 ? 'prof_a' : 'prof_b') : st(i), V.x + s[0], V.z + s[1], s[2], { base: s[3], y: gy(V.x + s[0], V.z + s[1]), far: 80 }); });
  if (CHAR.T.prof_a) HL.npc('prof_a', HL.HUT.x + 3.2, HL.HUT.z - 7.2, 2.6, { base: 'calm', y: gy(HL.HUT.x + 3.2, HL.HUT.z - 7.2), name: 'The Gamekeeper', far: 90 });
  // owls about the Owlery: small dark birds on slow circles
  if (HL.OWLERY) { const O = HL.OWLERY, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, 0.9, 0.08, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0, 0, -0.2, -0.9, 0.08, -0.1], 3)); g.computeVertexNormals(); const im = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: 0x8a7a66, side: THREE.DoubleSide }), 14), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); im.frustumCulled = false; LEVEL.add(im);
    L.updates.push((dt, t) => { for (let i = 0; i < 14; i++) { const a = t * (0.25 + (i % 4) * 0.05) * (i % 2 ? 1 : -1) + i * 2.1, r = 12 + (i % 5) * 5, fl = Math.sin(t * 7 + i) * 0.5; e.set(0, -a + (i % 2 ? 0 : PI), fl * 0.2); q.setFromEuler(e); m4.compose(V3(O[0] + Math.cos(a) * r, O[1] + 34 + (i % 6) * 4 + Math.sin(t * 0.6 + i) * 2, O[2] + Math.sin(a) * r), q, V3(1, 1 + fl, 1)); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; }); }
});
