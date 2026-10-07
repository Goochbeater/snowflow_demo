/* ==== p78e_hl_courts.js ==== */
/* HOGWARTS — the courtyards of the plan: lawns in stone kerbs between crossing paths, a centrepiece, trees, benches,
   lamps and statues, so that no court is a bare square of paving. */
HL.BUILD.push(async function courts(L) {
  const b0 = HL.bench, l0 = HL.lamp, s0 = HL.statue, f0 = HL.fountain, inC = (x, z) => HL.inFoot(x, z, 0) && z > -62; HL.bench = (x, z, yaw, y) => { if (inC(x, z)) HL.occ.mark(0, x, z, 1.0, 0.45, yaw, 3); return b0(x, z, yaw, y); }; HL.lamp = (L2, x, z, y) => { if (inC(x, z)) HL.occ.mark(0, x, z, 0.3, 0.3, 0, 3); return l0(L2, x, z, y); }; HL.statue = (x, z, yaw, h, y) => { if (inC(x, z)) HL.occ.mark(0, x, z, 0.95, 0.95, 0, 3); return s0(x, z, yaw, h, y); }; HL.fountain = (x, y, z, r) => { HL.occ.mark(0, x, z, r + 1.0, r + 1.0, 0, 3); return f0(x, y, z, r); };
  const M = HL.M(), G = HL.GK.M(), I = HL.IM(), Y = HL.Y0, trees = [], rs = mulberry(771);
  const lawn = TEX.sets.grass ? TEX.mat('grass', { color: new THREE.Color(0.5, 0.6, 0.36), scale: 3, rough: 1 }) : new THREE.MeshStandardMaterial({ color: 0x51702c, roughness: 1 }); lawn.userData.tscale = lawn.userData.tscale || 1; /* a mown lawn, not a hedge: under a low sun the photo's relief made every court a field of dark blotches */ if (lawn.normalScale) lawn.normalScale.set(0.22, 0.22); lawn.color.setRGB(0.5, 0.62, 0.34);
  const water = new THREE.MeshStandardMaterial({ color: 0x3a6474, roughness: 0.08, metalness: 0.2, envMapIntensity: 1.6 }); water.userData.tscale = 1;
  const court = (x0, x1, z0, z1, kind) => { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, m = 4.2, pw = 2.4, y = Y + 0.02; KIT.tag = '';
    // four lawns in kerbs
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const ax = sx < 0 ? x0 + m : cx + pw, bx = sx < 0 ? cx - pw : x1 - m, az = sz < 0 ? z0 + m : cz + pw, bz = sz < 0 ? cz - pw : z1 - m; if (bx - ax < 3 || bz - az < 3) continue;
      KIT.box(ax, y, az, bx, y + 0.22, bz, G.dress, { col: false }); KIT.box(ax + 0.3, y + 0.22, az + 0.3, bx - 0.3, y + 0.26, bz - 0.3, lawn, { col: false, faces: 'Y' }); PHY.box(ax, Y - 0.5, az, bx, y + 0.24, bz);
      HL.occ.mark(0, (ax + bx) / 2, (az + bz) / 2, (bx - ax) / 2, (bz - az) / 2, 0, 3); const tx = (ax + bx) / 2, tz = (az + bz) / 2; trees.push([tx + (rs() - 0.5) * 2, tz + (rs() - 0.5) * 2, 0.75 + rs() * 0.35, rs() * 6, [0x55782c, 0x7a8a2e, 0xa85a20, 0x9a7a28][(rs() * 4) | 0]]);
      HL.bench(sx < 0 ? bx + 0.5 : ax - 0.5, tz, sx < 0 ? -HALF : HALF, y); HL.bench(tx, sz < 0 ? bz + 0.5 : az - 0.5, sz < 0 ? 0 : PI, y);
      HL.lamp(L, sx < 0 ? bx + 0.45 : ax - 0.45, sz < 0 ? bz + 0.45 : az - 0.45, y);
      for (let q = 0; q < 5; q++) { const fx = lerp(ax + 1, bx - 1, rs()), fz = lerp(az + 1, bz - 1, rs()); KIT.geo(new THREE.SphereGeometry(0.5 + rs() * 0.5, 7, 5), lawn, new THREE.Matrix4().makeScale(1, 0.7, 1).setPosition(fx, y + 0.4, fz)); } }
    // the centrepiece
    if (kind === 'tree') { HL.occ.mark(0, cx, cz, 3.5, 3.5, 0, 3); KIT.cyl(cx, y, cz, 3.4, 0.7, G.dress, { seg: 16 }); KIT.cyl(cx, y + 0.7, cz, 3.0, 0.08, lawn, { seg: 16, col: false }); trees.push([cx, cz, 1.9, 1.3, 0xb8742a]); for (let a = 0; a < 4; a++) HL.bench(cx + Math.cos(a * HALF + 0.78) * 4.6, cz + Math.sin(a * HALF + 0.78) * 4.6, -(a * HALF + 0.78) + HALF, y); }
    else if (kind === 'fountain') HL.fountain(cx, y, cz, 3.2);
    else { HL.occ.mark(0, cx, cz, 1.6, 1.6, 0, 3); KIT.box(cx - 1.5, y, cz - 1.5, cx + 1.5, y + 0.5, cz + 1.5, G.dress); HL.statue(cx, cz, 0, 3.6, y + 0.5); }
    // founders along the walls, facing in
    { const P0 = HL.plan(0), wAt = (x, z) => P0.isW(Math.floor(HL.PL.X0 - x), Math.floor(HL.PL.Z0 - z)); for (const [sx2, sz2, yw, ox, oz] of [[x0 + 1.6, cz, HALF, -2.3, 0], [x1 - 1.6, cz, -HALF, 2.3, 0], [cx, z0 + 1.6, 0, 0, -2.3], [cx, z1 - 1.6, PI, 0, 2.3]]) { let ok = true; for (const t of [-2, -1, 0, 1, 2]) if (!wAt(sx2 + ox + (oz ? t : 0), sz2 + oz + (ox ? t : 0))) ok = false; if (ok) HL.statue(sx2, sz2, yw, 2.4, y); } } };
  court(65, 112, 106, 151, 'tree');      // the great court of the north-west ranges
  court(-2, 24, 58, 87, 'statue');       // the court between the Grand Staircase and Gryffindor Tower
  court(-19, 18, -40, 3, 'fountain');
  court(84, 140, 194, 215, 'tree');       // the Bell Tower Courtyard
  court(30, 82, 194, 215, 'statue');     // the court of the greenhouses
  // ---- the suspension bridge from the Defence classroom to the South Wing: timber pylons, a pair of sagging cables, hangers
  { KIT.tag = ''; const xa = 33, xb = 42, za = 81, zb = 84, yt = Y + 5.2; for (const x of [xa + 0.4, xb - 0.4]) { for (const z of [za - 0.1, zb + 0.1]) KIT.beam([x, Y - 0.4, z], [x, yt, z], 0.3, I.oakD); KIT.beam([x, yt - 0.3, za - 0.1], [x, yt - 0.3, zb + 0.1], 0.22, I.oakD); KIT.beam([x, Y + 3.2, za - 0.1], [x, yt - 0.3, (za + zb) / 2], 0.14, I.oakD); KIT.beam([x, Y + 3.2, zb + 0.1], [x, yt - 0.3, (za + zb) / 2], 0.14, I.oakD); }
    for (const z of [za - 0.1, zb + 0.1]) { let px = xa + 0.4, py = yt - 0.3; for (let t = 1; t <= 10; t++) { const f = t / 10, x = lerp(xa + 0.4, xb - 0.4, f), yy = yt - 0.3 - Math.sin(f * PI) * 3.0; KIT.beam([px, py, z], [x, yy, z], 0.07, M.iron); if (t < 10) KIT.beam([x, yy, z], [x, Y + 1.0, z], 0.035, M.iron); px = x; py = yy; } KIT.beam([xa, Y + 1.0, z], [xb, Y + 1.0, z], 0.1, I.oakD); PHY.box(xa, Y, Math.min(z, z + (z < (za + zb) / 2 ? -0.2 : 0.2)), xb, Y + 1.1, Math.max(z, z + (z < (za + zb) / 2 ? -0.2 : 0.2))); }
    for (let x = xa + 0.3; x < xb; x += 0.5) KIT.box(x, Y + 0.01, za, x + 0.42, Y + 0.07, zb, I.oak, { col: false }); }    // the Clock Tower Courtyard
  // ---- the Viaduct Courtyard: trees in round stone planters at the corners, benches between them
  if (HL.COURT) { const C = HL.COURT, y = Y + 0.02; KIT.tag = ''; for (const [fx, fz] of [[0.16, 0.2], [0.16, 0.86], [0.86, 0.2], [0.86, 0.86]]) { const x = lerp(C.x0, C.x1, fx), z = lerp(C.z0, C.z1, fz); HL.occ.mark(0, x, z, 1.8, 1.8, 0, 3); KIT.cyl(x, y, z, 1.7, 0.62, G.dress, { seg: 14 }); KIT.cyl(x, y + 0.62, z, 1.45, 0.05, lawn, { seg: 14, col: false }); trees.push([x, z, 1.0 + rs() * 0.3, rs() * 6, [0x7a8a2e, 0xa85a20, 0x9a7a28][(rs() * 3) | 0]]); }
    for (const [fx, fz, yw] of [[0.06, 0.4, HALF], [0.06, 0.6, HALF], [0.3, 0.93, PI], [0.7, 0.93, PI]]) HL.bench(lerp(C.x0, C.x1, fx), lerp(C.z0, C.z1, fz), yw, y); }
  // ---- the covered bridge: the last span before the Clock Tower Courtyard goes under a timber roof on posts, open at the sides
  { KIT.tag = ''; const xa = -6.5, xb = 5.5, xm = (xa + xb) / 2, z0 = -59.5, z1 = -41.5, ye = Y + 5.0, yr = Y + 8.2, hw = (xb - xa) / 2 + 0.7, sl = Math.hypot(hw, yr - ye), an = Math.atan2(yr - ye, hw);
    for (let z = z0; z <= z1 + 0.01; z += 3) { for (const x of [xa, xb]) { KIT.beam([x, Y + 1.2, z], [x, ye, z], 0.26, I.oakD); KIT.beam([x, ye - 1.3, z], [x + (x < xm ? 1.3 : -1.3), ye, z], 0.16, I.oakD); } KIT.beam([xa - 0.4, ye, z], [xb + 0.4, ye, z], 0.26, I.oakD); KIT.beam([xa - 0.4, ye, z], [xm, yr, z], 0.2, I.oakD); KIT.beam([xb + 0.4, ye, z], [xm, yr, z], 0.2, I.oakD); KIT.beam([xm, ye, z], [xm, yr, z], 0.16, I.oakD); }
    for (const x of [xa, xb]) { KIT.beam([x, ye, z0], [x, ye, z1], 0.24, I.oakD); KIT.beam([x, Y + 2.3, z0], [x, Y + 2.3, z1], 0.14, I.oakD); for (let z = z0 + 1.5; z < z1; z += 3) { KIT.beam([x, Y + 1.2, z - 1.5], [x, Y + 2.3, z], 0.1, I.oakD); KIT.beam([x, Y + 1.2, z + 1.5], [x, Y + 2.3, z], 0.1, I.oakD); } } KIT.beam([xm, yr, z0 - 0.5], [xm, yr, z1 + 0.5], 0.24, I.oakD);
    for (const sd of [-1, 1]) KIT.rbox(xm + sd * hw / 2, (ye + yr) / 2 + 0.16, (z0 + z1) / 2, sl / 2 + 0.15, 0.09, (z1 - z0) / 2 + 0.7, 0, 0, -sd * an, M.roof, 0);
    for (let z = z0 + 3; z < z1; z += 6) HL.lantern(L, xm, ye - 0.5, z, { i: 10, range: 10 }); }
  // ---- lamp standards down the south bridge, and banners on its gate
  KIT.tag = ''; for (let z = -226; z < -70; z += 23) for (const sx of [-4.4, 4.4]) { if (Math.abs(z + 157) < 6 && sx > 0) continue; HL.lamp(L, sx, z, Y + 0.02); }
  HL.bench = b0; HL.lamp = l0; HL.statue = s0; HL.fountain = f0;
  WORLD.trees(L, trees, { kinds: 3, h: 8, seed: 911 });
  // ---- the observation deck round the head of the Astronomy Tower: telescopes, an armillary, lamps, a Floo flame
  if (HL.DECK) { const [x, yD, z, r, R2] = HL.DECK, brass = I.brass || M.gold, rm = (r + R2) / 2;
    for (const an of [0.4, 2.2, 3.9, 5.4]) { const tx = x + Math.sin(an) * (rm + 0.5), tz = z + Math.cos(an) * (rm + 0.5); for (let q = 0; q < 3; q++) KIT.beam([tx, yD + 1.3, tz], [tx + Math.sin(an + q * 2.1) * 0.5, yD, tz + Math.cos(an + q * 2.1) * 0.5], 0.05, M.iron); KIT.beam([tx - Math.sin(an) * 0.7, yD + 1.15, tz - Math.cos(an) * 0.7], [tx + Math.sin(an) * 1.1, yD + 2.0, tz + Math.cos(an) * 1.1], 0.16, brass); KIT.beam([tx + Math.sin(an) * 1.1, yD + 2.0, tz + Math.cos(an) * 1.1], [tx + Math.sin(an) * 1.3, yD + 2.09, tz + Math.cos(an) * 1.3], 0.22, brass); PHY.cyl(tx, tz, 0.4, yD, yD + 1.6); }
    { const an = 1.3, ax = x + Math.sin(an) * rm, az = z + Math.cos(an) * rm; KIT.cyl(ax, yD, az, 0.4, 0.9, G.dress, { seg: 10 }); for (const [rx, rz] of [[0, 0], [HALF, 0], [0.7, 0.6]]) KIT.geo(new THREE.TorusGeometry(0.6, 0.03, 6, 28), brass, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, 0, rz)).setPosition(ax, yD + 1.6, az)); KIT.geo(new THREE.SphereGeometry(0.14, 10, 8), M.gold, new THREE.Matrix4().makeTranslation(ax, yD + 1.6, az)); }
    for (const an of [0, 1.57, 3.14, 4.71]) { const lx = x + Math.sin(an) * (r + 0.3), lz = z + Math.cos(an) * (r + 0.3); KIT.geo(new THREE.SphereGeometry(0.2, 10, 8), KIT.emis(0xffc070, 3), new THREE.Matrix4().makeTranslation(lx, yD + 2.6, lz)); HL.sl(lx, yD + 2.6, lz, 0xffb060, 8, 10); }
    HL.floo(L, 'The Astronomy Deck', x + Math.sin(3.0) * rm, z + Math.cos(3.0) * rm, 0, yD); }
});
