// ===== 30-nature: trees, mushrooms, flowers, rocks, the fairy glade, far mountains =====
{
  const G = AF.G, K = AF.K, W = AF.W, P = AF.PLAN;
  const c = (hex, mat, o = {}) => AF.col(hex, Object.assign({ mat }, o));
  Object.assign(K, {
    lf1: c(0x4f8f3a, 'leaf', { jitter: 0.9, edge: 0.3 }), lf2: c(0x6aa544, 'leaf', { jitter: 0.9, edge: 0.3 }), lf3: c(0x3a7436, 'leaf', { jitter: 0.9, edge: 0.3 }), lfPine: c(0x2f6048, 'leaf', { jitter: 0.8, edge: 0.3 }), lfPine2: c(0x3a7252, 'leaf', { jitter: 0.8, edge: 0.3 }),
    lfPink: c(0xf2a8c4, 'leaf', { jitter: 0.7, edge: 0.25 }), lfPink2: c(0xe888b0, 'leaf', { jitter: 0.7, edge: 0.25 }), lfGold: c(0xe8b040, 'leaf', { jitter: 0.8, edge: 0.3 }), lfRed: c(0xd0603a, 'leaf', { jitter: 0.8, edge: 0.3 }), lfWillow: c(0x8ab85a, 'leaf', { jitter: 0.8, edge: 0.25 }),
    lfBlue: c(0x4a8a9a, 'leaf', { jitter: 0.8, edge: 0.3, emit: 0x2a9ab0, emitK: 0.5, mode: 'night' }),
    birch: c(0xe6e2d6, 'wood', { jitter: 0.5 }), barkD: c(0x3d2f24, 'wood', { jitter: 0.7 }), barkR: c(0x6a4630, 'wood', { jitter: 0.7 }),
    capRed: c(0xd8423a, 'leaf', { jitter: 0.3, edge: 0.3 }), capDot: c(0xf8f2e6, 'leaf', { jitter: 0.1, edge: 0.2 }), stemW: c(0xeee4cc, 'leaf', { jitter: 0.3 }), capTan: c(0xc89a5a, 'leaf', { jitter: 0.4 }),
    glowCap: c(0x5ad8e8, 'leaf', { emit: 0x3ae0ff, emitK: 2.4, mode: 'night', jitter: 0.2, edge: 0.3 }), glowCapP: c(0xc07af0, 'leaf', { emit: 0xb05aff, emitK: 2.4, mode: 'night', jitter: 0.2, edge: 0.3 }), glowStem: c(0xd8f0f0, 'leaf', { emit: 0x8af0ff, emitK: 0.8, mode: 'night', jitter: 0.2 }),
    lily: c(0x5aa85a, 'leaf', { jitter: 0.4, edge: 0.2, solid: false }), reed: c(0x8a9a4a, 'leaf', { jitter: 0.6, edge: 0.1, solid: false }), tuft: c(0x5fa23e, 'leaf', { jitter: 0.6, edge: 0.05, solid: false }),
    fairyLamp: c(0xfff0b0, 'glass', { emit: 0xffe07a, emitK: 3, mode: 'always', jitter: 0, edge: 0 }),
  });
  const R = AF.rng(2024);
  // ---- tree models (0.5 m voxels: chunky storybook trees)
  const mk = (fn) => { const m = new AF.Model(16, 26, 16); const th = fn(m); const g = AF.meshModel(m, { vs: 0.5, anchor: [0.5, 0, 0.5] }); g.userData.trunkH = th * 0.5; return g; };
  const blob = (m, x, y, z, r, col) => m.sphere(x, y, z, r, col);
  const oak = (l1, l2, bark, hgt, wide) => mk((m) => { m.box(7, 0, 7, 9, hgt, 9, bark); m.box(6, 0, 7, 10, 1, 9, bark); m.box(7, 0, 6, 9, 1, 10, bark); blob(m, 8, hgt + 2, 8, wide, l1); blob(m, 5.5, hgt + 1, 7, wide - 1.3, l2); blob(m, 10.5, hgt + 1.5, 9.5, wide - 1.2, l1); blob(m, 8, hgt + 4.2, 8.5, wide - 1.5, l2); return hgt; });
  const pine = (l1, l2, hgt) => mk((m) => { m.box(7.5, 0, 7.5, 8.5, hgt + 8, 8.5, K.barkD); for (let i = 0; i < 5; i++) { const r = 4.6 - i * 0.9, y = hgt + i * 2.4; for (let j = 0; j < 3; j++) { const rr = r - j * 0.8; if (rr > 0.3) m.box(Math.round(8 - rr), y + j, Math.round(8 - rr), Math.round(8 + rr), y + j + 1, Math.round(8 + rr), i & 1 ? l2 : l1); } } return hgt; });
  const birch = (l1, l2) => mk((m) => { m.box(7.5, 0, 7.5, 8.5, 13, 8.5, K.birch); for (const y of [2, 5, 9]) m.set(7, y, 8, K.barkD); blob(m, 8, 13, 8, 3.2, l1); blob(m, 8, 16, 8, 2.4, l2); blob(m, 6.5, 11.5, 9, 2, l2); return 9; });
  const willow = () => mk((m) => { m.box(7, 0, 7, 9, 8, 9, K.barkR); blob(m, 8, 10, 8, 5, K.lfWillow); for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 4.6, x = Math.round(8 + Math.cos(a) * r), z = Math.round(8 + Math.sin(a) * r), l = 3 + (i % 4); for (let y = 0; y < l; y++) m.set(x, 9 - y, z, K.lfWillow); } return 7; });
  const shroom = (cap, dots, hgt, r) => mk((m) => { m.box(7, 0, 7, 9, hgt, 9, K.stemW); for (let y = 0; y < 3; y++) { const rr = r - y * 1.3; for (let x = -6; x <= 6; x++) for (let z = -6; z <= 6; z++) if (Math.hypot(x, z) <= rr) m.set(8 + x, hgt + y, 8 + z, dots && AF.hash3(x, y, z) < 0.13 ? K.capDot : cap); } return hgt; });
  const T = {
    oak: [oak(K.lf1, K.lf2, K.bark, 7, 4.8), oak(K.lf2, K.lf1, K.barkR, 9, 5.4), oak(K.lf3, K.lf1, K.barkD, 6, 4.4)],
    wood: [oak(K.lf3, K.lf1, K.barkD, 11, 5.6), oak(K.lf3, K.lfPine2, K.barkD, 9, 5), oak(K.lf1, K.lf3, K.barkR, 12, 5.8), oak(K.lfBlue, K.lf3, K.barkD, 10, 5)],
    pine: [pine(K.lfPine, K.lfPine2, 3), pine(K.lfPine2, K.lfPine, 4)], birch: [birch(K.lf2, K.lfGold), birch(K.lfGold, K.lf2)],
    blossom: [oak(K.lfPink, K.lfPink2, K.barkR, 5, 4.2), oak(K.lfPink2, K.lfPink, K.barkD, 6, 4.6)], autumn: [oak(K.lfGold, K.lfRed, K.barkR, 7, 4.6), oak(K.lfRed, K.lfGold, K.barkD, 8, 5)],
    willow: [willow()], shroom: [shroom(K.capRed, true, 6, 5.5), shroom(K.capRed, true, 9, 6.5), shroom(K.capTan, false, 5, 4.5), shroom(K.glowCap, false, 7, 5), shroom(K.glowCapP, false, 4, 4)],
  };
  G.treeList = [];
  const roadD = (x, z) => { let d = 1e9; for (const e of P.E) { const a = P.N[e[0]], b = P.N[e[1]]; const q = P.segD(x, z, a[0], a[1], b[0], b[1]) - e[2]; if (q < d) d = q; } return d; };
  G.roadD = roadD;
  const free = (x, z, m = 2.5) => { if (roadD(x, z) < m) return false; if (P.waterD(x, z) < 1.2) return false; if (Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]) < 15) return false; for (const b of AF.buildings) { const B = b.box; if (x > B[0] - m && x < B[3] + m && z > B[2] - m && z < B[5] + m) return false; } for (const f of P.FIELDS) if (x > f[0] - 2 && x < f[2] + 2 && z > f[1] - 2 && z < f[3] + 2) return false; if (Math.hypot(x - P.CRAG[0], z - P.CRAG[1]) < 19) return false; if (Math.hypot(x - 165, z + 32) < 9) return false; if (Math.hypot(x - P.GLADE[0], z - P.GLADE[1]) < 9) return false; if (Math.hypot(x + 60, z + 60) < 8.5) return false; for (const k in P.SITES) { const q = P.SITES[k]; if (k !== 'meadow' && Math.hypot(x - q[0], z - q[1]) < q[2] + 2) return false; } return true; };
  G.freeSpot = free;
  const tree = (kind, x, z, force) => { if (!force && !free(x, z)) return false; for (const t of G.treeList) if (Math.abs(t.x - x) < 3.2 && Math.abs(t.z - z) < 3.2) return false; const L = T[kind], g = L[(R() * L.length) | 0], y = W.groundY(x, z); if (y < 0.3) return false; AF.placeStatic(g, x, y, z, (R() * 4) | 0, { collide: false }); AF.addCollider(x - 0.45, y, z - 0.45, x + 0.45, y + g.userData.trunkH, z + 0.45, 'tree'); G.treeList.push({ x, y, z, kind, h: g.userData.trunkH }); return true; };
  AF.onBuild('nature', 400, () => {
    // village + meadow trees
    tree('oak', -6.5, 17, true); tree('blossom', 9, -1.5, true); tree('blossom', -14, 24, true); tree('willow', 40, 72, true); tree('willow', 62, 112, true); tree('willow', 74, 84, true); tree('blossom', 20, 40, true); tree('autumn', -42, 30, true); tree('oak', 38, -12, true); tree('birch', -30, -26, true);
    for (let i = 0; i < 700; i++) { const x = (R() - 0.5) * 300, z = (R() - 0.5) * 300, r = Math.hypot(x, z); if (r > 226) continue; const dq = Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]), n = AF.noise2(x / 45 + 9, z / 45 + 2); const y = W.groundY(x, z);
      if (dq < 62 && R() < 0.82) continue; if (n < 0.42 && R() < 0.85) continue; if (P.forest(x, z) > 0.2) continue;
      const dr = Math.hypot((x - P.RIDGE[0]) / 52, (z - P.RIDGE[1]) / 105);
      const kind = y > 12 || dr < 1 ? (R() < 0.75 ? 'pine' : 'birch') : n > 0.7 ? (R() < 0.5 ? 'autumn' : 'birch') : R() < 0.12 ? 'blossom' : R() < 0.3 ? 'birch' : 'oak'; tree(kind, x, z); }
    // rocks
    for (let i = 0; i < 150; i++) { const x = (R() - 0.5) * 430, z = (R() - 0.5) * 430; if (!free(x, z, 1.5) || Math.hypot(x, z) > 228) continue; const y = W.groundY(x, z), s = 0.5 + ((R() * 4) | 0) * 0.25, col = R() < 0.3 ? K.wallMoss : K.rock; W.fill(x, y, z, x + s * 1.5, y + s, z + s, col); W.fill(x + 0.25, y + s, z + 0.25, x + s, y + s + 0.25, z + s - 0.25, col); }
    // flowers + tufts (walk-through voxels)
    const FL = [K.flowerR, K.flowerY, K.flowerB, K.flowerW, K.flowerP];
    for (let i = 0; i < 2600; i++) { let x, z; if (i < 1500) { const a = R() * 6.283, r = 14 + Math.sqrt(R()) * 120; x = P.SQUARE[0] + Math.cos(a) * r; z = P.SQUARE[1] + Math.sin(a) * r; } else { x = (R() - 0.5) * 420; z = (R() - 0.5) * 420; }
      if (Math.hypot(x, z) > 225 || roadD(x, z) < 0.4 || P.waterD(x, z) < 0.8) continue; const y = W.groundY(x, z); if (W.getM(x, y + 0.1, z) || W.getM(x, y + 0.6, z)) continue; let inF = false; for (const f of P.FIELDS) if (x > f[0] - 1 && x < f[2] + 1 && z > f[1] - 1 && z < f[3] + 1) inF = true; if (inF) continue;
      const n = AF.noise2(x / 14, z / 14); if (n > 0.52) { W.setM(x, y, z, K.stem); W.setM(x, y + 0.25, z, FL[((AF.noise2(x / 30 + 5, z / 30) * 9) | 0) % 5]); } else if (R() < 0.6) { W.setM(x, y, z, K.tuft); if (R() < 0.4) W.setM(x + 0.25, y, z, K.tuft); } }
    // reeds + lilies
    for (let i = 0; i < 260; i++) { const a = R() * 6.283, x = P.LAKE[0] + Math.cos(a) * (P.LAKE[2] - 1 - R() * 5), z = P.LAKE[1] + Math.sin(a) * (P.LAKE[3] - 1 - R() * 5), y = W.groundY(x, z); if (y < P.SEA_Y && y > -1.4 && R() < 0.6) W.fill(x, y, z, x + 0.25, P.SEA_Y + 0.75 + R() * 0.5, z + 0.25, K.reed); else if (y < -1) { W.fill(x, P.SEA_Y - 0.25, z, x + 0.75, P.SEA_Y, z + 0.75, K.lily); if (R() < 0.3) W.setM(x + 0.25, P.SEA_Y, z + 0.25, R() < 0.5 ? K.flowerW : K.flowerP); } }
    // glow-mushroom clusters in the wood
    G.glowShrooms = [];
    for (let i = 0; i < 420; i++) { const a = R() * 6.283, r = 95 + Math.sqrt(R()) * 135, x = Math.cos(a) * r, z = Math.sin(a) * r; if (P.forest(x, z) < 0.4) continue; if (roadD(x, z) < 0.6 || P.waterD(x, z) < 1) continue; const y = W.groundY(x, z), cap = R() < 0.5 ? K.glowCap : K.glowCapP; for (let j = 0; j < 3; j++) { const ox = x + j * 0.5 - (j & 1) * 0.25, oz = z + (j & 1) * 0.5, hh = 0.25 + ((R() * 3) | 0) * 0.25; W.fill(ox, y, oz, ox + 0.25, y + hh, oz + 0.25, K.glowStem); W.fill(ox - 0.25, y + hh, oz - 0.25, ox + 0.5, y + hh + 0.25, oz + 0.5, cap); } if (i % 2 === 0) AF.addLight({ x, y: y + 0.9, z, kind: 'shroom', color: cap === K.glowCap ? 0x3ae0ff : 0xb05aff }); G.glowShrooms.push({ x, y, z }); }
    // ---- the fairy glade: a hollow stump home ringed by mushrooms
    { const gx = P.GLADE[0], gz = P.GLADE[1], y = 3;
      for (let yy = 0; yy < 14; yy++) for (let i = -8; i < 8; i++) for (let k = -8; k < 8; k++) { const d = Math.hypot(i + 0.5, k + 0.5) * 0.25, r = 1.6 - yy * 0.02 + (AF.hash2(i >> 1, k >> 1) - 0.5) * 0.3; if (d < r && d > r - 0.5 && !(k > 3 && Math.abs(i + 0.5) < 2 && yy < 5) && !(yy > 9 && AF.hash2(i, k) < 0.4)) W.setM(gx + i * 0.25 + 0.01, y + yy * 0.25, gz + k * 0.25 + 0.01, yy % 5 === 4 ? K.barkR : K.barkD); }
      W.fill(gx - 1, y, gz - 1, gx + 1, y + 0.25, gz + 1, K.gMoss); W.fill(gx - 0.5, y + 0.25, gz - 0.75, gx + 0.25, y + 0.5, gz - 0.25, K.lfPink); W.fill(gx - 0.5, y + 0.5, gz - 0.75, gx - 0.25, y + 0.75, gz - 0.25, K.pillow);
      W.fill(gx + 0.5, y + 0.25, gz - 0.5, gx + 0.75, y + 0.5, gz - 0.25, K.fairyLamp); AF.addLight({ x: gx + 0.6, y: y + 0.6, z: gz - 0.4, kind: 'magic', color: 0xffe07a });
      W.fill(gx - 0.25, y + 3.5, gz + 1.5, gx + 0.25, y + 3.75, gz + 2.25, K.barkR); W.fill(gx - 0.125, y + 3, gz + 2, gx + 0.125, y + 3.5, gz + 2.25, K.fairyLamp); AF.addLight({ x: gx, y: y + 3.2, z: gz + 2.1, kind: 'magic', color: 0xffe07a });
      for (let j = 0; j < 14; j++) { const a = j / 14 * 6.283, x = gx + Math.cos(a) * 6, z = gz + Math.sin(a) * 6, yy = W.groundY(x, z), hh = 0.5 + (j % 3) * 0.25, cap = j % 2 ? K.capRed : K.glowCap; W.fill(x, yy, z, x + 0.25, yy + hh, z + 0.25, K.stemW); W.fill(x - 0.25, yy + hh, z - 0.25, x + 0.5, yy + hh + 0.25, z + 0.5, cap); if (j % 2 === 0) AF.addLight({ x: x + 0.1, y: yy + hh + 0.4, z: z + 0.1, kind: 'shroom', color: 0x3ae0ff }); }
      G.home = { x: gx, y: y + 0.6, z: gz }; AF.addLabel('The Fairy Glade', gx, gz, 'place'); }
    AF.addLabel('Whispering Wood', P.WOOD[0] + 20, P.WOOD[1] - 30, 'place'); AF.addLabel('Stargazer\'s Ridge', 165, -32, 'place'); AF.addLabel('Mirror Pond', P.LAKE[0], P.LAKE[1], 'place'); AF.addLabel('The Humming Stones', -60, -60, 'place'); AF.addLabel('Rook Farm', -86, 40, 'place'); AF.addLabel('Market Square', 0, 10, 'place');
  });
  // ---- the far mountains: a three.js ring of big stepped blocks (not voxel-engine geometry)
  AF.onBuild('mountains', 420, () => {
    const geos = [], col = new THREE.Color(), rr = AF.rng(77);
    const box = (x, y, z, w, h, d, hex) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y + h / 2, z); col.set(hex); const n = g.attributes.position.count, ca = new Float32Array(n * 3); for (let i = 0; i < n; i++) { ca[i * 3] = col.r; ca[i * 3 + 1] = col.g; ca[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); geos.push(g); };
    for (let ring = 0; ring < 3; ring++) { const n = 30 + ring * 6; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ring * 0.37, r = 300 + ring * 70 + rr() * 30, x = Math.cos(a) * r, z = Math.sin(a) * r; const hgt = (30 + ring * 42) * (0.45 + AF.fbm2(Math.cos(a) * 2.2 + ring * 7, Math.sin(a) * 2.2, 3) * 1.25), w = 110 + ring * 30 + rr() * 50; let y = -8; const steps = 5 + ring * 2; for (let k = 0; k < steps; k++) { const hh = hgt / steps, ww = w * Math.pow(1 - k / steps, 0.85) + 6; const top = y + hh; box(x + (rr() - 0.5) * 8, y, z + (rr() - 0.5) * 8, ww, hh, ww * (0.8 + rr() * 0.4), top > 78 ? 0xe8eef4 : top > 40 ? [0x7f7a90, 0x8a849a][k & 1] : ring === 0 ? [0x5f9a50, 0x6fa24e][k & 1] : [0x6f8f6a, 0x7a8f80][k & 1]); y = top; } } }
    const g = AF.addons.BGU.mergeGeometries(geos), m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.name = 'land-horizon'; m.frustumCulled = false; m.matrixAutoUpdate = false; AF.scene.add(m); G.mountains = m;
  });
}
