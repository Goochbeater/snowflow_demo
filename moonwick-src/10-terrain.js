// ===== 10-terrain: palette, heightmap, river + lake, roads =====
{
  const c = (hex, mat, o = {}) => AF.col(hex, Object.assign({ mat }, o));
  const K = AF.K;
  Object.assign(K, {
    g1: c(0x6fa544, 'earth', { jitter: 0.55, edge: 0.25 }), g2: c(0x7fb24a, 'earth', { jitter: 0.55, edge: 0.25 }), g3: c(0x5f9a48, 'earth', { jitter: 0.55, edge: 0.25 }),
    gLeafy: c(0x5a7a3a, 'earth', { jitter: 0.7, edge: 0.3 }), trail: c(0x8a7450, 'earth', { jitter: 0.6, edge: 0.3 }), gWood: c(0x3f7a44, 'earth', { jitter: 0.6, edge: 0.25 }), gMoss: c(0x4f8f5a, 'earth', { jitter: 0.6, edge: 0.25 }), gHigh: c(0x8aa85a, 'earth', { jitter: 0.5, edge: 0.25 }),
    path: c(0xc9a878, 'earth', { jitter: 0.5, edge: 0.3 }), soil: c(0x6b4a30, 'earth', { jitter: 0.6, edge: 0.4 }), soil2: c(0x5a3d28, 'earth', { jitter: 0.6, edge: 0.4 }),
    cragRock: c(0x6d6878, 'stone', { jitter: 0.8, edge: 0.55 }), cragDark: c(0x56526a, 'stone', { jitter: 0.8, edge: 0.55 }), ridgeRock: c(0x8a8478, 'stone', { jitter: 0.8, edge: 0.5 }),
    snow: c(0xeef2f6, 'earth', { jitter: 0.2, edge: 0.15 }), bed: c(0x8fa79a, 'earth', { jitter: 0.5, edge: 0.2 }), sandW: c(0xdccb98, 'earth', { jitter: 0.5, edge: 0.2 }),
    sqCob: c(0x9a94a0, 'stone', { jitter: 0.9, edge: 0.75 }), sqCob2: c(0xb3a79a, 'stone', { jitter: 0.9, edge: 0.75 }), flagT: c(0x8d87a0, 'stone', { jitter: 0.6, edge: 0.7 }),
  });
  AF.onBuild('terrain', 100, () => {
    const W = AF.W, P = AF.PLAN, NX = W.NX, NZ = W.NZ, sm = AF.smooth, lerp = AF.lerp;
    const GN = 601, hg = new Float32Array(GN * GN), wg = new Float32Array(GN * GN);
    const base = (x, z) => {
      const dq = Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]);
      let h = 1 + (AF.fbm2(x / 110 + 7.3, z / 110 - 3.1, 2) - 0.42) * 4.2 * sm(55, 150, dq);
      { const dx = x - P.CRAG[0], dz = z - P.CRAG[1], a = Math.atan2(dz, dx), d = Math.hypot(dx, dz) + (AF.fbm2(a * 2.2 + 5, 1.7, 2) - 0.5) * 9 * sm(14, 26, Math.hypot(dx, dz));
        h += P.CRAG_Y * Math.pow(1 - sm(17.5, 36, d), 1.1); if (d < 17.5) h = P.CRAG_Y; }
      { const e = Math.hypot((x - P.RIDGE[0]) / 52, (z - P.RIDGE[1]) / 105) + (AF.fbm2(x / 30, z / 30, 2) - 0.5) * 0.25; h += (P.RIDGE_Y - 1) * (1 - sm(0.2, 1, e)); }
      { const r = Math.hypot(x, z); h = lerp(h, 3, sm(215, 250, r)); }
      for (const k in P.SITES) { const q = P.SITES[k], d = Math.hypot(x - q[0], z - q[1]); const mh = k === 'dell' ? 6 : 1.5; if (d < q[2] + 12 && h < mh) h = lerp(mh, h, sm(q[2], q[2] + 12, d)); }
      for (const f of P.FLATS) { const d = Math.max(f[0] - x, x - f[2], f[1] - z, z - f[3]); if (d < 6) h = lerp(f[4], h, sm(0, 6, d)); }
      return h;
    };
    for (let i = 0; i < GN; i++) for (let k = 0; k < GN; k++) {
      const x = -300 + i, z = -300 + k; let h = base(x, z);
      const wd = P.waterD(x, z); wg[i * GN + k] = wd;
      if (wd < 9) { const lake = (Math.hypot((x - P.LAKE[0]) / P.LAKE[2], (z - P.LAKE[1]) / P.LAKE[3]) - 1) * P.LAKE[3]; const bed = lake < 0 ? Math.max(-4, -1.4 + lake * 0.35) : -1.6; h = Math.min(h, lerp(bed, Math.min(h, 1.2 + wd * 0.6), sm(-1, 7, wd))); }
      hg[i * GN + k] = h;
    }
    const samp = (g, x, z) => { let fx = x + 300, fz = z + 300; fx = fx < 0 ? 0 : fx > 599.99 ? 599.99 : fx; fz = fz < 0 ? 0 : fz > 599.99 ? 599.99 : fz; const i = fx | 0, k = fz | 0, u = fx - i, v = fz - k, o = i * GN + k; return (g[o] * (1 - u) + g[o + GN] * u) * (1 - v) + (g[o + 1] * (1 - u) + g[o + GN + 1] * u) * v; };
    P.heightAt = (x, z) => samp(hg, x, z);
    const H = W.H, C = W.C, S = W.S; const fg = new Float32Array(600 * 600); for (let i = 0; i < 600; i++) for (let k = 0; k < 600; k++) fg[i * 600 + k] = P.forest(-299.5 + i, -299.5 + k); P.forestGrid = fg;
    for (let bx = 0; bx < NX; bx++) {
      const x = -300 + (bx + 0.5) * 0.25;
      for (let bz = 0; bz < NZ; bz++) {
        const z = -300 + (bz + 0.5) * 0.25, i = bx * NZ + bz;
        const h = samp(hg, x, z), r2 = x * x + z * z;
        const dq2 = (x - P.SQUARE[0]) * (x - P.SQUARE[0]) + (z - P.SQUARE[1]) * (z - P.SQUARE[1]), q = dq2 < 100 * 100 || (x < -60 && x > -200 && z > 0 && z < 110) ? 2 : 4;   // 0.5 m steps in the village and the wood, 1 m beyond
        let hb = Math.round(h * 4 / q) * q; if (h < 0.2 && h > -0.6) hb = Math.round(h * 4);
        const sl = Math.abs(samp(hg, x + 1, z) - samp(hg, x - 1, z)) + Math.abs(samp(hg, x, z + 1) - samp(hg, x, z - 1));
        const wd = samp(wg, x, z);
        let col, side = 0;
        const n = AF.noise2(x / 19 + 40, z / 19 + 11);
        const dC = Math.hypot(x - P.CRAG[0], z - P.CRAG[1]), fo = (bx & 3) || (bz & 3) ? fg[(bx >> 2) * 600 + (bz >> 2)] : fg[(bx >> 2) * 600 + (bz >> 2)];
        if (h < P.SEA_Y) col = h < -1.2 ? K.bed : K.sandW;
        else if (wd < 1.6 && h < 1.2) col = K.sandW;
        else if (h > 44 + n * 8) col = K.snow;
        else if (sl > 1.7 || (dC < 44 && sl > 1.1)) { col = dC < 50 ? (n > 0.5 ? K.cragRock : K.cragDark) : K.ridgeRock; side = col; }
        else if (dC < 17.5) col = K.flagT;
        else if (fo > 0.45) col = n > 0.62 ? K.gMoss : (AF.noise2(x / 9 + 80, z / 9) > 0.7 ? K.gLeafy : K.gWood);
        else if (h > 22) col = K.gHigh;
        else col = n < 0.36 ? K.g1 : n < 0.66 ? K.g2 : K.g3;
        if (dC < 50 && !side && sl > 0.5) side = K.cragRock; if (!side) side = col;
        H[i] = hb; C[i] = col; S[i] = side;
      }
    }
    // square cobbles
    W.eachCol(-16, -6, 16, 26, (bx, bz, i, x, z) => { const d = Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]); if (d < 13.5) { W.H[i] = 4; W.C[i] = (d > 12.5 || (d > 6 && d < 6.6)) ? K.sqCob2 : K.sqCob; } });
    // fields: tilled rows
    for (const f of P.FIELDS) W.eachCol(f[0], f[1], f[2], f[3], (bx, bz, i) => { W.H[i] = 8 + ((bx >> 2) & 1); W.C[i] = (bx >> 2) & 1 ? K.soil : K.soil2; });
    // roads: flatten to the node heights, paint, blend shoulders
    for (const e of P.E) {
      const a = P.N[e[0]], b = P.N[e[1]], hw = e[2], kind = e[3]; if (kind === 'bridge') continue;
      if (kind === 'trail') { for (const q of [a, b]) if (q[2] == null) q[2] = W.groundY(q[0], q[1]); W.eachCol(Math.min(a[0], b[0]) - 2, Math.min(a[1], b[1]) - 2, Math.max(a[0], b[0]) + 2, Math.max(a[1], b[1]) + 2, (bx, bz, i, x, z) => { const d = P.segD(x, z, a[0], a[1], b[0], b[1]); if (d < hw + (AF.noise2(x / 2.5, z / 2.5) - 0.5) * 0.9 && W.H[i] * 0.25 > P.SEA_Y && W.C[i] !== K.path && W.C[i] !== K.sqCob) W.C[i] = K.trail; }); continue; }
      const m = hw + 3.5;
      W.eachCol(Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m, Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m, (bx, bz, i, x, z) => {
        const d = P.segD(x, z, a[0], a[1], b[0], b[1]), t = P._t; if (d > m) return;
        const y = lerp(a[2], b[2], t), wob = (AF.noise2(x / 3, z / 3) - 0.5) * 0.7;
        if (W.H[i] * 0.25 < P.SEA_Y && kind !== 'cob') return;
        if (d < hw + wob) { W.H[i] = Math.round(y * 4); if (!(Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]) < 13.5)) W.C[i] = kind === 'cob' ? (AF.hash2(bx >> 1, bz >> 1) < 0.5 ? K.sqCob : K.cobble) : kind === 'flag' ? K.flagT : K.path; }
        else { const k = sm(hw, m, d), cur = W.H[i] * 0.25; const nh = lerp(y, cur, k * k); W.H[i] = Math.round(nh * 2) * 2; }
      });
    }
    P.groundY = (x, z) => W.groundY(x, z);
    // water
    const g = new THREE.PlaneGeometry(600, 600); g.rotateX(-Math.PI / 2); g.translate(0, P.SEA_Y, 0);
    AF.mat.water = new THREE.MeshLambertMaterial({ color: 0x4fa3c4, transparent: true, opacity: 0.72 });
    AF.addWater(g, AF.mat.water);
  });
}
