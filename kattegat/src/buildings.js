// Static settlement construction, era by era, into merged meshes.
import * as THREE from 'three';
import { Builder, M, col } from './builder.js';
import { RNG, catmull, resample, fbm, lerp } from './util.js';
import { stdMat } from './materials.js';

const C = {
  wattle: 0xa68e6a, daub: 0xc4ae88, tar: 0x2e241c, timber: 0x765639, plank: 0x8a6745, oldwood: 0x8a7458, turf: 0x5a6e32, turfDry: 0x7a7642,
  shingle: 0x6a5c4e, shingle2: 0x80705f, stone: 0x7b7a74, stoneD: 0x5a5953, hide: 0xa7865f, hideD: 0x7c5d3e, clay: 0x8f6a4a, straw: 0xc8ad62,
  iron: 0x3c3b3a, rust: 0x6e4630, red: 0x8e2a1e, blue: 0x2c4a6e, ochre: 0xb58a36, white: 0xd8d0bc, green: 0x3e5a32, black: 0x1c1a18, rope: 0xa58b5c, fish: 0xc9c2a8, bone: 0xe1d8c1,
};

export function buildSettlement(L, grid, seed) {
  const rnd = new RNG(seed * 13 + 5);
  const R = () => rnd.next();
  const H = (x, z) => grid.get(x, z);
  const buckets = new Map();
  const bk = (min, max = 4) => { const k = min + '_' + max; if (!buckets.has(k)) buckets.set(k, { min, max, b: new Builder() }); return buckets.get(k).b; };
  const c = (h, j = 0.08) => col(h, j, R);

  // local frame helper for a building
  const frame = (b) => {
    const cr = Math.cos(b.rot), sr = Math.sin(b.rot);
    return (lx, ly, lz) => [b.x + lx * cr + lz * sr, b.y + ly, b.z - lx * sr + lz * cr];
  };

  // ------------------------------------------------------------ longhouse
  function longhouse(Bd, b, o = {}) {
    const F = frame(b);
    const len = b.len, wid = b.wid, hw = o.wallH ?? 2.1, overhang = 0.75;
    const rich = b.rich || o.hall;
    const seg = Math.max(6, Math.round(len / 2.2));
    const half = (t) => (wid / 2) * (0.84 + 0.16 * Math.sin(Math.PI * t));
    const ridgeH = hw + wid * (o.hall ? 0.6 : 0.58);
    const turf = b.roof === 'turf';
    // foundation footing
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, lx = (t - 0.5) * len;
      for (const s of [-1, 1]) {
        const p = F(lx, -0.3, s * (half(t) + 0.15));
        Bd.add('rock', M(p[0], p[1], p[2], R() * 6, 0, 0, 0.9, 0.5, 0.7), c(C.stone, 0.15));
      }
    }
    // walls (two skins: wattle panel + daub)
    for (let i = 0; i < seg; i++) {
      const t0 = i / seg, t1 = (i + 1) / seg, x0 = (t0 - 0.5) * len, x1 = (t1 - 0.5) * len;
      for (const s of [-1, 1]) {
        const z0 = s * half(t0), z1 = s * half(t1);
        const colr = i % 3 === 0 ? c(C.daub, 0.1) : c(C.wattle, 0.12);
        Bd.quad(F(x0, -1.5, z0), F(x1, -1.5, z1), F(x1, hw, z1), F(x0, hw, z0), colr, s > 0);
        // wattle weave stripes
        for (let k = 0; k < 3; k++) { const y = 0.4 + k * 0.6; Bd.quad(F(x0, y, z0 * 1.004), F(x1, y, z1 * 1.004), F(x1, y + 0.08, z1 * 1.004), F(x0, y + 0.08, z0 * 1.004), c(C.hideD, 0.1), s > 0); }
        // tarred post
        const pp = F(x0, hw / 2 - 0.5, z0 * 1.02);
        Bd.box(pp[0], pp[1], pp[2], 0.28, hw + 1.1, 0.28, b.rot, c(C.tar, 0.1));
        // raking outer post
        if (i % 2 === 0 && i > 0) Bd.pole(F(x0, -0.2, s * (half(t0) + 1.1)), F(x0, hw - 0.1, s * (half(t0) + 0.1)), 0.13, c(C.tar, 0.1));
      }
    }
    // end walls: vertical planks
    for (const e of [-1, 1]) {
      const lx = e * len / 2, hz = half(e < 0 ? 0 : 1);
      const n = Math.ceil(hz * 2 / 0.32);
      for (let k = 0; k < n; k++) {
        const z = -hz + (k + 0.5) * (hz * 2 / n);
        const top = turf ? hw + 0.3 : hw + (ridgeH - hw) * (1 - Math.abs(z) / (hz + overhang));
        const p = F(lx, (top - 1.5) / 2, z);
        Bd.box(p[0], p[1], p[2], 0.12, top + 1.5, 0.3, b.rot, c(k % 2 ? C.plank : C.timber, 0.1));
      }
    }
    // roof
    const eaveY = hw - 0.25;
    const rows = turf ? 6 : 9;
    const cols = Math.max(8, Math.round(len / (turf ? 1.6 : 0.55)));
    const hip = turf ? wid * 0.42 : 0; // turf roofs are hipped
    const roofPt = (u, v, s) => { // u along length 0..1, v 0 eave -> 1 ridge
      const lx = (u - 0.5) * (len + overhang * 2);
      const tt = Math.min(1, Math.max(0, u));
      const hz = half(tt) + overhang;
      let y = eaveY + (ridgeH - eaveY) * v, z = s * hz * (1 - v);
      // bow the ridge for big halls
      if (o.hall) y += Math.sin(Math.PI * u) * 0.9 * v;
      return [lx, y, z];
    };
    for (const s of [-1, 1]) {
      const grid2 = [];
      for (let r = 0; r <= rows; r++) {
        const row = [];
        for (let k = 0; k <= cols; k++) {
          const u = k / cols, v = r / rows;
          let [lx, y, z] = roofPt(u, v, s);
          // hipped: pull ends in toward the middle as v rises
          if (hip) { const ends = Math.min(u, 1 - u) * (len + overhang * 2); const lim = hip * v; if (ends < lim) { lx = Math.sign(u - 0.5) * ((len + overhang * 2) / 2 - lim); } }
          if (turf) { y += (R() - 0.3) * 0.18 * (r > 0 && r < rows ? 1 : 0); z *= 1 + (R() - 0.5) * 0.02; }
          row.push([lx, y + (turf ? 0.25 : 0), z]);
        }
        grid2.push(row);
      }
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const a = grid2[r][k], bb = grid2[r][k + 1], cc = grid2[r + 1][k + 1], d = grid2[r + 1][k];
        let colr;
        if (turf) { const q = F(...a); const tn = fbm(q[0] * 0.18, q[2] * 0.18, 2) * 0.5 + 0.5; const c1 = col(C.turf), c2 = col(C.turfDry); const jj = 0.94 + R() * 0.08; colr = [lerp(c1[0], c2[0], tn) * jj, lerp(c1[1], c2[1], tn) * jj, lerp(c1[2], c2[2], tn) * jj]; }
        else colr = c((r + k) % 5 === 0 ? C.shingle2 : C.shingle, 0.16);
        if (!turf) { // stepped shingle course
          const st = 0.09;
          const off = (p, f) => [p[0], p[1] - st * f, p[2] * (1 + 0.02 * f)];
          Bd.quad(F(...off(a, 1)), F(...off(bb, 1)), F(...cc), F(...d), colr, s < 0);
          Bd.quad(F(...off(a, 1)), F(...a), F(...bb), F(...off(bb, 1)), c(C.black, 0.05), s < 0);
        } else Bd.quad(F(...a), F(...bb), F(...cc), F(...d), colr, s < 0);
      }
      // turf edge / eave board
      const e0 = grid2[0][0], e1 = grid2[0][cols];
      const mid = F((e0[0] + e1[0]) / 2, e0[1] - 0.15, e0[2]);
      Bd.box(mid[0], mid[1], mid[2], len + overhang * 2, 0.35, 0.3, b.rot, c(turf ? C.hideD : C.tar, 0.1));
    }
    if (hip) { // hip end triangles
      for (const e of [-1, 1]) {
        const a = roofPt(e < 0 ? 0 : 1, 0, -1), bb = roofPt(e < 0 ? 0 : 1, 0, 1);
        const top = [e * ((len + overhang * 2) / 2 - hip), ridgeH + 0.25, 0];
        a[1] += 0.25; bb[1] += 0.25;
        Bd.tri(F(...a), F(...bb), F(...top), c(C.turf, 0.12), e < 0);
      }
    } else {
      // gable barge boards crossing above the ridge, carved heads on rich houses
      for (const e of [-1, 1]) {
        const lx = e * (len / 2 + overhang * 0.9);
        for (const s of [-1, 1]) {
          const lo = [lx, eaveY - 0.1, s * (half(e < 0 ? 0 : 1) + overhang)];
          const hi = [lx, ridgeH + 1.1, -s * 0.7];
          Bd.pole(F(...lo), F(...hi), 0.12, c(C.tar, 0.05), 'box');
          if (rich) dragonHead(Bd, F, hi, s, e, o.hall ? 1.6 : 0.7);
        }
      }
    }
    // ridge cap and smoke hole
    { const p = F(0, ridgeH + (turf ? 0.3 : 0.05) + (o.hall ? 0.9 : 0), 0); Bd.box(p[0], p[1], p[2], len - hip * 2 + 0.5, 0.25, 0.45, b.rot, c(turf ? C.turfDry : C.tar, 0.1)); }
    const sh = F(len * 0.12, ridgeH + 0.45 + (o.hall ? 0.9 : 0), 0); Bd.box(sh[0], sh[1], sh[2], 1.0, 0.5, 0.9, b.rot, c(C.black, 0.05));
    b.smoke = [sh[0], sh[1] + 0.4, sh[2]];
    b.ridgeH = ridgeH;
    // door with carved frame
    const dz = half(0.5) + 0.05, dw = o.hall ? 2.6 : 1.3, dh = o.hall ? 3.0 : 1.85;
    { const p = F(0, dh / 2 - 0.05, dz + 0.02); Bd.box(p[0], p[1], p[2], dw, dh, 0.15, b.rot, c(0x1a1410, 0.05)); }
    for (const s of [-1, 1]) { const p = F(s * (dw / 2 + 0.15), dh / 2, dz + 0.12); Bd.box(p[0], p[1], p[2], 0.3, dh + 0.3, 0.3, b.rot, c(rich ? C.red : C.tar, 0.08)); }
    { const p = F(0, dh + 0.15, dz + 0.12); Bd.box(p[0], p[1], p[2], dw + 0.7, 0.3, 0.32, b.rot, c(rich ? C.ochre : C.tar, 0.08)); }
    // porch roof for big houses
    if (len > 22 || o.hall) {
      const pw = o.hall ? 8 : 3.4, pd = o.hall ? 4 : 2.2;
      for (const s of [-1, 1]) Bd.pole(F(s * pw / 2, -0.5, dz + pd), F(s * pw / 2, hw + 0.2, dz + pd), 0.15, c(C.tar));
      Bd.quad(F(-pw / 2 - 0.3, hw + 0.25, dz + pd + 0.4), F(pw / 2 + 0.3, hw + 0.25, dz + pd + 0.4), F(pw / 2 + 0.3, hw + 1.0, dz - 0.2), F(-pw / 2 - 0.3, hw + 1.0, dz - 0.2), c(turf ? C.turf : C.shingle, 0.1));
    }
    b.doorGlow = F(0, dh * 0.5, dz + 0.2);
  }
  function dragonHead(Bd, F, base, s, e, k) {
    // a curling neck and a snarling head carved from the barge board end
    const pts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([base[0] + e * (0.2 + t * 0.9) * k, base[1] + Math.sin(t * 2.2) * 0.9 * k, base[2] + s * -t * 0.25 * k]); }
    for (let i = 0; i < pts.length - 1; i++) Bd.pole(F(...pts[i]), F(...pts[i + 1]), (0.16 - i * 0.012) * k, c(i % 2 ? C.red : C.tar, 0.05), 'box');
    const h = pts[pts.length - 1];
    const hp = F(h[0] + e * 0.25 * k, h[1] + 0.05 * k, h[2]);
    const rot = Math.atan2(F(e, 0, 0)[0] - F(0, 0, 0)[0], F(e, 0, 0)[2] - F(0, 0, 0)[2]);
    Bd.add('box', M(hp[0], hp[1], hp[2], rot, -0.25, 0, 0.32 * k, 0.34 * k, 0.75 * k), c(C.tar, 0.05));
    Bd.add('box', M(hp[0], hp[1] - 0.18 * k, hp[2], rot, 0.25, 0, 0.26 * k, 0.12 * k, 0.6 * k), c(C.red, 0.05)); // jaw
    Bd.add('cone5', M(hp[0], hp[1] + 0.3 * k, hp[2], rot, -0.7, 0, 0.12 * k, 0.5 * k, 0.12 * k), c(C.ochre, 0.05)); // crest
  }
  // ------------------------------------------------------------ small things
  const barrel = (Bd, x, z, s = 1, y = H(x, z)) => { Bd.add('barrel', M(x, y + 0.45 * s, z, R() * 3, 0, 0, 0.62 * s, 0.9 * s, 0.62 * s), c(C.plank, 0.15)); Bd.add('cyl', M(x, y + 0.2 * s, z, 0, 0, 0, 0.72 * s, 0.06, 0.72 * s), c(C.iron)); Bd.add('cyl', M(x, y + 0.72 * s, z, 0, 0, 0, 0.72 * s, 0.06, 0.72 * s), c(C.iron)); };
  const crate = (Bd, x, z, s = 1, y = H(x, z)) => { const r = R() * 3; Bd.add('box', M(x, y + 0.35 * s, z, r, 0, 0, 0.8 * s, 0.7 * s, 0.7 * s), c(C.oldwood, 0.15)); Bd.add('box', M(x, y + 0.35 * s, z, r, 0, 0, 0.84 * s, 0.1 * s, 0.74 * s), c(C.tar)); };
  const logs = (Bd, x, z, n = 6, rot = R() * 3, L2 = 2.2) => { const y = H(x, z); let k = 0; for (let row = 0; k < n; row++) for (let i = 0; i < 4 - row && k < n; i++, k++) { const off = (i - (3 - row) / 2) * 0.38; Bd.add('cyl', M(x + Math.sin(rot) * off, y + 0.2 + row * 0.33, z + Math.cos(rot) * off, rot, 0, Math.PI / 2, 0.36, L2, 0.36), c(C.timber, 0.2)); } };
  const rope = (Bd, x, z, y = H(x, z)) => { for (let i = 0; i < 3; i++) Bd.add('torus', M(x, y + 0.06 + i * 0.07, z, 0, Math.PI / 2, 0, 1 - i * 0.12, 1 - i * 0.12, 0.7), c(C.rope, 0.1)); };
  const fence = (Bd, cx, cz, r, n = 28, gap = 0) => { for (let i = 0; i < n; i++) { if (i < gap) continue; const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; const p0 = [cx + Math.cos(a0) * r, 0, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, 0, cz + Math.sin(a1) * r]; p0[1] = H(p0[0], p0[2]); p1[1] = H(p1[0], p1[2]); Bd.pole([p0[0], p0[1] - 0.2, p0[2]], [p0[0], p0[1] + 1.3, p0[2]], 0.09, c(C.oldwood, 0.15)); for (const hy of [0.55, 1.05]) Bd.pole([p0[0], p0[1] + hy, p0[2]], [p1[0], p1[1] + hy, p1[2]], 0.05, c(C.oldwood, 0.15)); } };
  const rack = (Bd, x, z, rot, len, kind) => { // drying rack: A-frames with poles and hanging stuff
    const y = H(x, z); const cr = Math.cos(rot), sr = Math.sin(rot);
    const P = (lx, ly, lz) => [x + lx * cr + lz * sr, y + ly, z - lx * sr + lz * cr];
    for (let k = 0; k <= len; k += 3) { Bd.pole(P(k - len / 2, 0, -0.9), P(k - len / 2, 2.4, 0), 0.06, c(C.oldwood)); Bd.pole(P(k - len / 2, 0, 0.9), P(k - len / 2, 2.4, 0), 0.06, c(C.oldwood)); }
    Bd.pole(P(-len / 2, 2.35, 0), P(len / 2, 2.35, 0), 0.05, c(C.oldwood));
    if (kind === 'fish') for (let k = 0; k < len * 3; k++) { const p = P(-len / 2 + (k + 0.5) / 3, 1.85 + R() * 0.15, (R() - 0.5) * 0.2); Bd.add('box', M(p[0], p[1], p[2], rot + R() * 0.4, 0, 0, 0.12, 0.8, 0.05), c(C.fish, 0.15)); }
    if (kind === 'hide') for (let k = 0; k < len / 1.6; k++) { const p = P(-len / 2 + 0.8 + k * 1.6, 1.4, 0.05); Bd.add('box', M(p[0], p[1], p[2], rot, 0, (R() - 0.5) * 0.2, 1.3, 1.6, 0.04), c(R() < 0.5 ? C.hide : C.hideD, 0.12)); }
    if (kind === 'net') for (let k = 0; k < len / 2; k++) { const p = P(-len / 2 + 1 + k * 2, 1.4, 0.0); Bd.add('box', M(p[0], p[1], p[2], rot, 0, 0, 1.9, 1.8, 0.02), c(0x4a4436, 0.1)); for (let f = 0; f < 4; f++) { const q = P(-len / 2 + 0.3 + k * 2 + f * 0.45, 0.55, 0.0); Bd.add('sphere', M(q[0], q[1], q[2], 0, 0, 0, 0.12, 0.12, 0.12), c(C.stone)); } }
  };
  const loom = (Bd, x, z, rot) => { // warp-weighted loom leaning on the wall
    const y = H(x, z); const cr = Math.cos(rot), sr = Math.sin(rot); const P = (lx, ly, lz) => [x + lx * cr + lz * sr, y + ly, z - lx * sr + lz * cr];
    Bd.pole(P(-0.9, 0, 0.5), P(-0.9, 2.1, 0), 0.06, c(C.timber)); Bd.pole(P(0.9, 0, 0.5), P(0.9, 2.1, 0), 0.06, c(C.timber));
    Bd.pole(P(-1, 2.0, 0.02), P(1, 2.0, 0.02), 0.06, c(C.timber));
    const cl = R() < 0.4 ? C.red : R() < 0.5 ? C.blue : C.ochre;
    const p = P(0, 1.55, 0.12); Bd.add('box', M(p[0], p[1], p[2], rot, -0.24, 0, 1.6, 0.9, 0.03), c(cl, 0.1));
    for (let k = 0; k < 9; k++) { const q = P(-0.8 + k * 0.2, 0.55, 0.36); Bd.add('sphere', M(q[0], q[1], q[2], 0, 0, 0, 0.13, 0.13, 0.13), c(C.clay, 0.15)); Bd.pole(q, P(-0.8 + k * 0.2, 1.1, 0.25), 0.008, c(C.white)); }
  };
  const runestone = (Bd, x, z, rot) => {
    const y = H(x, z);
    Bd.add('box', M(x, y + 1.1, z, rot, 0, (R() - 0.5) * 0.08, 1.0, 2.6, 0.32), c(0x8d8a80, 0.08));
    // painted serpent band
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI; const lx = Math.cos(a) * 0.38, ly = 1.1 + Math.sin(a) * 1.05; Bd.add('box', M(x + lx * cr + 0.17 * sr, y + ly, z - lx * sr + 0.17 * cr, rot, 0, a, 0.08, 0.32, 0.02), c(C.red, 0.05)); }
  };
  const godpole = (Bd, x, z, h = 4.5) => {
    const y = H(x, z);
    Bd.add('cyl', M(x, y + h / 2, z, 0, 0, 0, 0.5, h, 0.5), c(C.timber, 0.1));
    for (let k = 0; k < 4; k++) Bd.add('cyl', M(x, y + 1 + k * 0.9, z, 0, 0, 0, 0.6, 0.12, 0.6), c(k % 2 ? C.red : C.ochre));
    Bd.add('box', M(x, y + h + 0.35, z, R() * 6, 0, 0, 0.55, 0.75, 0.5), c(C.tar)); // the god's face
    Bd.add('box', M(x, y + h + 0.45, z, R() * 6, 0, 0, 0.6, 0.12, 0.55), c(C.red));
    Bd.add('cone5', M(x - 0.3, y + h + 0.9, z, 0, 0, 0.4, 0.15, 0.5, 0.15), c(C.bone)); Bd.add('cone5', M(x + 0.3, y + h + 0.9, z, 0, 0, -0.4, 0.15, 0.5, 0.15), c(C.bone));
  };
  const cookfire = (Bd, x, z) => { const y = H(x, z); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; Bd.add('rock', M(x + Math.cos(a) * 0.9, y + 0.1, z + Math.sin(a) * 0.9, R() * 6, 0, 0, 0.45, 0.32, 0.4), c(C.stoneD, 0.2)); } Bd.add('cyl', M(x, y + 0.03, z, 0, 0, 0, 1.4, 0.06, 1.4), c(0x221a14)); };
  const cart = (Bd, x, z, rot) => { const y = H(x, z); const cr = Math.cos(rot), sr = Math.sin(rot); const P = (lx, ly, lz) => [x + lx * cr + lz * sr, y + ly, z - lx * sr + lz * cr]; const p = P(0, 0.85, 0); Bd.add('box', M(p[0], p[1], p[2], rot, 0, 0, 2.2, 0.12, 1.2), c(C.plank)); for (const s of [-1, 1]) { const q = P(0, 0.5, s * 0.7); Bd.add('cyl12', M(q[0], q[1], q[2], rot, Math.PI / 2, 0, 1.0, 0.12, 1.0), c(C.timber)); const sd = P(0, 1.05, s * 0.6); Bd.add('box', M(sd[0], sd[1], sd[2], rot, 0, 0, 2.2, 0.35, 0.06), c(C.oldwood)); } Bd.pole(P(1.1, 0.85, 0.3), P(2.8, 0.3, 0.3), 0.05, c(C.timber)); Bd.pole(P(1.1, 0.85, -0.3), P(2.8, 0.3, -0.3), 0.05, c(C.timber)); if (R() < 0.6) { const q = P(-0.3, 1.25, 0); Bd.add('sphere', M(q[0], q[1], q[2], 0, 0, 0, 1.6, 0.6, 1.0), c(C.straw, 0.1)); } };
  const sledge = (Bd, x, z, rot) => { const y = H(x, z); const cr = Math.cos(rot), sr = Math.sin(rot); const P = (lx, ly, lz) => [x + lx * cr + lz * sr, y + ly, z - lx * sr + lz * cr]; for (const s of [-1, 1]) { const a = P(-1.2, 0.1, s * 0.5), b2 = P(1.4, 0.35, s * 0.5); Bd.pole(a, b2, 0.06, c(C.timber)); } const p = P(0, 0.4, 0); Bd.add('box', M(p[0], p[1], p[2], rot, 0, 0, 2.2, 0.08, 1.1), c(C.plank)); const q = P(0, 0.75, 0); for (let k = 0; k < 3; k++) Bd.add('cyl', M(q[0], q[1] + k * 0.0, q[2] + (k - 1) * 0.3, rot, 0, Math.PI / 2, 0.3, 2.0, 0.3), c(C.timber, 0.15)); };
  const haystack = (Bd, x, z, s = 1) => { const y = H(x, z); Bd.add('hemi', M(x, y - 0.2, z, R() * 3, 0, 0, 3.2 * s, 3.6 * s, 3.2 * s), c(C.straw, 0.1)); Bd.pole([x, y, z], [x, y + 2.6 * s, z], 0.06, c(C.timber)); };
  const stook = (Bd, x, z) => { const y = H(x, z); Bd.add('cone5', M(x, y + 0.6, z, R() * 3, 0, 0, 0.7, 1.3, 0.7), c(C.straw, 0.12)); };
  const bench = (Bd, x, z, rot, y = H(x, z)) => { const cr = Math.cos(rot), sr = Math.sin(rot); Bd.add('box', M(x, y + 0.45, z, rot, 0, 0, 2.4, 0.1, 0.38), c(C.plank, 0.1)); for (const s of [-1, 1]) Bd.add('box', M(x + s * 1.0 * cr, y + 0.22, z - s * 1.0 * sr, rot, 0, 0, 0.1, 0.45, 0.35), c(C.timber)); };
  const shieldDisc = (Bd, p, rot, r = 0.45) => { const pal = [C.red, C.white, C.blue, C.ochre, C.green, C.black]; const a = pal[Math.floor(R() * pal.length)], b2 = pal[Math.floor(R() * pal.length)]; Bd.add('disc', M(p[0], p[1], p[2], rot, Math.PI / 2, 0, r * 2, 0.06, r * 2), c(a, 0.05)); Bd.add('box', M(p[0] + Math.sin(rot) * 0.035, p[1], p[2] + Math.cos(rot) * 0.035, rot, 0, R() * 3, r * 1.9, r * 0.35, 0.02), c(b2, 0.05)); Bd.add('hemi', M(p[0] + Math.sin(rot) * 0.04, p[1], p[2] + Math.cos(rot) * 0.04, rot, Math.PI / 2, 0, 0.22, 0.14, 0.22), c(C.iron)); };
  const weaponRack = (Bd, x, z, rot) => { const y = H(x, z); const cr = Math.cos(rot), sr = Math.sin(rot); const P = (lx, ly, lz) => [x + lx * cr + lz * sr, y + ly, z - lx * sr + lz * cr]; Bd.pole(P(-1, 0, 0), P(-1, 1.6, 0), 0.06, c(C.timber)); Bd.pole(P(1, 0, 0), P(1, 1.6, 0), 0.06, c(C.timber)); Bd.pole(P(-1.1, 1.4, 0), P(1.1, 1.4, 0), 0.05, c(C.timber)); for (let k = 0; k < 7; k++) { const a = P(-0.9 + k * 0.3, 0, 0.25), b2 = P(-0.9 + k * 0.3, 2.6, -0.1); Bd.pole(a, b2, 0.025, c(C.timber)); Bd.add('cone5', M(b2[0], b2[1] + 0.15, b2[2], 0, 0, 0, 0.07, 0.35, 0.03), c(0x8a8c90)); } };
  const target = (Bd, x, z, rot) => { const y = H(x, z); Bd.add('disc', M(x, y + 1.3, z, rot, Math.PI / 2 - 0.15, 0, 1.4, 0.35, 1.4), c(C.straw, 0.08)); Bd.add('disc', M(x + Math.sin(rot) * 0.18, y + 1.32, z + Math.cos(rot) * 0.18, rot, Math.PI / 2 - 0.15, 0, 0.5, 0.05, 0.5), c(C.red)); for (let k = 0; k < 6; k++) { const ox = (R() - 0.5) * 0.9, oy = (R() - 0.5) * 0.9; const p = [x + Math.cos(rot) * ox, y + 1.3 + oy, z - Math.sin(rot) * ox]; Bd.pole(p, [p[0] + Math.sin(rot) * 0.6, p[1] + 0.05, p[2] + Math.cos(rot) * 0.6], 0.012, c(C.timber)); } Bd.pole([x, y, z - 0.3], [x, y + 1.0, z], 0.06, c(C.timber)); };
  const anvil = (Bd, x, z, y = H(x, z)) => { Bd.add('cyl', M(x, y + 0.35, z, 0, 0, 0, 0.7, 0.7, 0.7), c(C.timber)); Bd.add('box', M(x, y + 0.82, z, 0.3, 0, 0, 0.55, 0.25, 0.3), c(C.iron)); Bd.add('cone', M(x + 0.35, y + 0.86, z + 0.1, 0.3, 0, Math.PI / 2, 0.18, 0.3, 0.18), c(C.iron)); };
  const vat = (Bd, x, z, s = 1, liquid = 0x4a2e12) => { const y = H(x, z); Bd.add('cyl12', M(x, y + 0.5 * s, z, 0, 0, 0, 1.6 * s, 1.0 * s, 1.6 * s), c(C.plank, 0.1)); Bd.add('disc', M(x, y + 0.97 * s, z, 0, 0, 0, 1.45 * s, 0.02, 1.45 * s), c(liquid)); for (const h of [0.2, 0.8]) Bd.add('cyl12', M(x, y + h * s, z, 0, 0, 0, 1.66 * s, 0.07, 1.66 * s), c(C.iron)); };
  const oven = (Bd, x, z) => { const y = H(x, z); Bd.add('hemi', M(x, y - 0.1, z, 0, 0, 0, 2.2, 1.8, 2.2), c(C.clay, 0.12)); Bd.add('box', M(x, y + 0.35, z + 1.0, 0, 0, 0, 0.6, 0.55, 0.3), c(0x1a120c)); };
  const chips = (Bd, x, z, n, r) => { for (let k = 0; k < n; k++) { const a = R() * 6.283, d = Math.sqrt(R()) * r; const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; Bd.add('box', M(px, H(px, pz) + 0.03, pz, R() * 6, 0, 0, 0.18, 0.03, 0.08), c(0xc3a273, 0.2)); } };
  const rocks = (Bd, x, z, n, r, s = 1, colr = C.stone) => { for (let k = 0; k < n; k++) { const a = R() * 6.283, d = Math.sqrt(R()) * r; const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; const sc = s * (0.4 + R()); Bd.add('rock', M(px, H(px, pz) + sc * 0.15, pz, R() * 6, R(), R(), sc, sc * 0.7, sc), c(colr, 0.2)); } };

  // ------------------------------------------------------------ the houses
  const hall = L.B[0];
  for (const b of L.B) {
    if (b.kind === 'hall') continue;
    if (b.kind === 'house') {
      longhouse(bk(1), b);
      // era 0: hide tents and cookfires at the same household site
      const T = bk(0, 1);
      const F = frame(b);
      for (let k = 0; k < (b.len > 20 ? 3 : 2); k++) {
        const lx = (k - 0.5) * 5, p = F(lx, 0, 0), rot = b.rot + (R() - 0.5) * 0.5, w = 2.2 + R(), d = 3 + R(), h = 2.3;
        const cr = Math.cos(rot), sr = Math.sin(rot), y = H(p[0], p[2]);
        const P = (a, yy, z2) => [p[0] + a * cr + z2 * sr, y + yy, p[2] - a * sr + z2 * cr];
        T.quad(P(-d / 2, 0, -w), P(d / 2, 0, -w), P(d / 2, h, 0), P(-d / 2, h, 0), c(C.hide, 0.12));
        T.quad(P(-d / 2, 0, w), P(-d / 2, h, 0), P(d / 2, h, 0), P(d / 2, 0, w), c(C.hideD, 0.12));
        T.tri(P(-d / 2, 0, -w), P(-d / 2, h, 0), P(-d / 2, 0, w), c(C.hide, 0.1));
        T.pole(P(-d / 2 - 0.3, h + 0.4, 0), P(d / 2 + 0.3, h + 0.4, 0), 0.05, c(C.timber));
      }
      cookfire(T, b.door[0], b.door[1] + 1);
      b.tentSmoke = [b.door[0], H(b.door[0], b.door[1] + 1) + 0.6, b.door[1] + 1];
      // yard clutter
      const Y = bk(1);
      const sideP = (s, f = 1.8) => F(s * (b.len / 2 - 2), 0, (b.wid / 2 + f));
      const p1 = F(-b.len / 2 - 1.8, 0, 0); logs(Y, p1[0], p1[2], 6 + Math.floor(R() * 4), b.rot + Math.PI / 2);
      const p2 = sideP(1); if (R() < 0.7) barrel(Y, p2[0], p2[2]); if (R() < 0.5) crate(Y, p2[0] + 0.9, p2[2] + 0.3);
      const p3 = sideP(-1, 1.2); if (R() < 0.55) loom(Y, p3[0], p3[2], b.rot); else bench(Y, p3[0], p3[2], b.rot);
      if (R() < 0.35) { const q = F(b.len / 2 + 3, 0, 2); rack(Y, q[0], q[2], b.rot + 1.4, 4, R() < 0.5 ? 'fish' : 'hide'); }
      if (R() < 0.3) { const q = F(0, 0, -b.wid / 2 - 4); haystack(Y, q[0], q[2], 0.6); }
      if (R() < 0.3) { const q = F(b.len / 2 + 2, 0, b.wid / 2 + 3); cart(Y, q[0], q[2], b.rot + R()); }
      if (R() < 0.25) { const q = F(-b.len / 2 + 1, 0, b.wid / 2 + 3.5); sledge(Y, q[0], q[2], b.rot + R()); }
      if (R() < 0.4) { const q = F(b.len / 2 - 1, 0, b.wid / 2 + 2.2); rope(Y, q[0], q[2]); }
      { const q = F(-b.len / 2 + 2.5, 0, b.wid / 2 + 2.5); Y.add('cyl', M(q[0], H(q[0], q[2]) + 0.3, q[2], 0, 0, 0, 0.7, 0.6, 0.7), c(C.timber)); chips(Y, q[0], q[2], 30, 1.6); Y.pole([q[0], H(q[0], q[2]) + 0.6, q[2]], [q[0] + 0.4, H(q[0], q[2]) + 1.1, q[2] + 0.2], 0.03, c(C.timber)); }
    } else if (b.kind === 'pit') {
      const Bd = bk(0); const F = frame(b);
      Bd.add('box', M(b.x, b.y + 0.3, b.z, b.rot, 0, 0, b.len, 1.2, b.wid), c(C.plank, 0.1));
      const rp = (lx, ly, lz) => F(lx, ly, lz);
      Bd.quad(rp(-b.len / 2 - 0.3, 0.1, -b.wid / 2 - 0.5), rp(b.len / 2 + 0.3, 0.1, -b.wid / 2 - 0.5), rp(b.len / 2 + 0.3, 2.3, 0), rp(-b.len / 2 - 0.3, 2.3, 0), c(C.turf, 0.12));
      Bd.quad(rp(-b.len / 2 - 0.3, 0.1, b.wid / 2 + 0.5), rp(-b.len / 2 - 0.3, 2.3, 0), rp(b.len / 2 + 0.3, 2.3, 0), rp(b.len / 2 + 0.3, 0.1, b.wid / 2 + 0.5), c(C.turfDry, 0.12));
      for (const e of [-1, 1]) Bd.tri(rp(e * (b.len / 2 + 0.3), 0.1, -b.wid / 2 - 0.5), rp(e * (b.len / 2 + 0.3), 2.3, 0), rp(e * (b.len / 2 + 0.3), 0.1, b.wid / 2 + 0.5), c(C.plank, 0.1), e > 0);
      b.smoke = F(0, 2.4, 0);
    } else if (b.kind === 'stilt') {
      const Bd = bk(1); const F = frame(b);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = F(sx * b.len * 0.4, 0, sz * b.wid * 0.4); Bd.pole([p[0], p[1] - 0.5, p[2]], [p[0], p[1] + 1.3, p[2]], 0.14, c(C.tar)); Bd.add('cyl', M(p[0], p[1] + 1.35, p[2], 0, 0, 0, 0.6, 0.15, 0.6), c(C.stone)); }
      const cb = { ...b, y: b.y + 1.4, len: b.len, wid: b.wid, roof: 'shingle', rich: false };
      const p = F(0, 2.4, 0); Bd.add('box', M(p[0], p[1], p[2], b.rot, 0, 0, b.len, 2, b.wid), c(C.plank, 0.12));
      const Fc = frame(cb);
      Bd.quad(Fc(-b.len / 2 - 0.4, 2, -b.wid / 2 - 0.4), Fc(b.len / 2 + 0.4, 2, -b.wid / 2 - 0.4), Fc(b.len / 2 + 0.4, 3.4, 0), Fc(-b.len / 2 - 0.4, 3.4, 0), c(C.shingle, 0.1));
      Bd.quad(Fc(-b.len / 2 - 0.4, 2, b.wid / 2 + 0.4), Fc(-b.len / 2 - 0.4, 3.4, 0), Fc(b.len / 2 + 0.4, 3.4, 0), Fc(b.len / 2 + 0.4, 2, b.wid / 2 + 0.4), c(C.shingle, 0.1));
    } else if (b.kind === 'byre') {
      longhouse(bk(1), b, { wallH: 1.7 });
    } else if (['forge', 'healer', 'brewery', 'bakery', 'seer', 'store', 'boatshed'].includes(b.kind)) {
      if (b.kind === 'forge') {
        // open-sided smithy: shingle roof on tarred posts
        const Bd = bk(1); const F = frame(b);
        for (const sx of [-1, -0.33, 0.33, 1]) for (const sz of [-1, 1]) Bd.pole(F(sx * b.len / 2, -0.5, sz * b.wid / 2), F(sx * b.len / 2, 3.2, sz * b.wid / 2), 0.16, c(C.tar));
        // stepped shingle courses, sooty near the smoke vent
        for (const sd of [-1, 1]) for (let k = 0; k < 7; k++) {
          const v0 = k / 7, v1 = (k + 1) / 7, L2 = b.len / 2 + 0.6, W2 = b.wid / 2 + 0.8;
          const cols2 = 10;
          for (let j = 0; j < cols2; j++) {
            const x0 = -L2 + (j / cols2) * 2 * L2, x1 = -L2 + ((j + 1) / cols2) * 2 * L2;
            const P0 = (x, v, d) => F(x, 3.0 + v * 1.8 - d, sd * W2 * (1 - v) * (1 + d * 0.15));
            const soot = Math.abs((x0 + x1) / 2 + 3) < 2.5 ? 0.55 : 1;
            const cc = c(j % 3 ? C.shingle : C.shingle2, 0.15).map((q) => q * soot);
            Bd.quad(P0(x0, v0, 0.1), P0(x1, v0, 0.1), P0(x1, v1, 0), P0(x0, v1, 0), cc, sd > 0);
          }
        }
        { const r0 = F(0, 4.85, 0); Bd.box(r0[0], r0[1], r0[2], b.len + 1.4, 0.25, 0.5, b.rot, c(C.tar)); }
        // glowing coal beds (emissive look comes from the flame billboards and fire light)
        { const hc = F(1.5, 0, -1.5); Bd.add('box', M(hc[0], H(hc[0], hc[2]) + 0.92, hc[2], b.rot, 0, 0, 1.6, 0.06, 1.0), [1.6, 0.45, 0.08]); }
        { const fc = F(-3, 0, 0); Bd.add('cyl', M(fc[0], H(fc[0], fc[2]) + 0.5, fc[2] + 0.0, b.rot, 0, 0, 0.6, 0.6, 0.6), [1.8, 0.5, 0.1]); }
        const fx = F(-3, 0, 0); // bloomery furnace & hearth
        Bd.add('cone', M(fx[0], H(fx[0], fx[2]) + 1.1, fx[2], 0, 0, 0, 1.8, 2.4, 1.8), c(C.clay, 0.1));
        Bd.add('cyl', M(fx[0], H(fx[0], fx[2]) + 2.6, fx[2], 0, 0, 0, 0.5, 1.2, 0.5), c(C.clay, 0.1));
        b.forgeFire = [fx[0], H(fx[0], fx[2]) + 1.0, fx[2]];
        const hz = F(1.5, 0, -1.5); Bd.add('box', M(hz[0], H(hz[0], hz[2]) + 0.45, hz[2], b.rot, 0, 0, 2.0, 0.9, 1.4), c(C.stoneD, 0.1));
        b.hearth = [hz[0], H(hz[0], hz[2]) + 1.0, hz[2]];
        const an = F(1.5, 0, 0.6); anvil(Bd, an[0], an[2]); b.anvil = [an[0], H(an[0], an[2]) + 0.9, an[2]];
        const an2 = F(4, 0, 0.4); anvil(Bd, an2[0], an2[2]);
        const qt = F(4, 0, -2.2); Bd.add('box', M(qt[0], H(qt[0], qt[2]) + 0.35, qt[2], b.rot, 0, 0, 1.8, 0.7, 0.7), c(C.plank)); Bd.add('box', M(qt[0], H(qt[0], qt[2]) + 0.66, qt[2], b.rot, 0, 0, 1.6, 0.03, 0.5), c(0x2a3a44));
        const bl = F(2.9, 0, -1.6); Bd.add('box', M(bl[0], H(bl[0], bl[2]) + 0.7, bl[2], b.rot, 0.3, 0, 0.9, 0.35, 1.1), c(C.hideD));
        const sl = F(-6, 0, 3.5); rocks(Bd, sl[0], sl[2], 26, 1.6, 0.5, 0x2a2622); // slag heap
        const ch = F(-6.5, 0, -3); Bd.add('hemi', M(ch[0], H(ch[0], ch[2]) - 0.1, ch[2], 0, 0, 0, 2.6, 1.3, 2.6), c(0x1e1c1a)); // charcoal
        const ib = F(-1.5, 0, 2.6); rocks(Bd, ib[0], ib[2], 6, 0.5, 0.35, C.rust); // iron blooms
        const wr = F(6.5, 0, 2.8); weaponRack(Bd, wr[0], wr[2], b.rot);
        const gs = F(6.5, 0, -2); Bd.add('cyl12', M(gs[0], H(gs[0], gs[2]) + 0.8, gs[2], b.rot, 0, Math.PI / 2, 1.0, 0.18, 1.0), c(0x9a948a)); Bd.box(gs[0], H(gs[0], gs[2]) + 0.35, gs[2], 0.6, 0.7, 0.2, b.rot, c(C.timber));
        logs(Bd, F(-7, 0, 0)[0], F(-7, 0, 0)[2], 8, b.rot);
      } else {
        longhouse(bk(1), b, { wallH: b.kind === 'boatshed' ? 2.6 : 1.9 });
        const F = frame(b), Bd = bk(1);
        if (b.kind === 'healer') { for (let k = 0; k < 8; k++) { const p = F(-2 + k * 0.6, 1.7, b.wid / 2 + 0.6); Bd.add('cone5', M(p[0], p[1], p[2], 0, Math.PI, 0, 0.25, 0.5, 0.25), c(k % 2 ? 0x6a7a3a : 0x8a7a4a)); } const q = F(3, 0, b.wid / 2 + 2); bench(Bd, q[0], q[2], b.rot); }
        if (b.kind === 'brewery') { for (let k = 0; k < 3; k++) { const q = F(-3 + k * 3, 0, b.wid / 2 + 2.5); vat(Bd, q[0], q[2], 1, 0x5a3a14); } for (let k = 0; k < 5; k++) { const q = F(b.len / 2 + 1.5, 0, -2 + k); barrel(Bd, q[0], q[2]); } }
        if (b.kind === 'bakery') { for (let k = 0; k < 3; k++) { const q = F(-3 + k * 3.2, 0, b.wid / 2 + 3.2); oven(Bd, q[0], q[2]); } logs(Bd, F(b.len / 2 + 2, 0, 0)[0], F(b.len / 2 + 2, 0, 0)[2], 7, b.rot); }
        if (b.kind === 'seer') { for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; const q = [b.x + Math.cos(a) * 5, 0, b.z + Math.sin(a) * 5]; Bd.pole([q[0], H(q[0], q[2]), q[2]], [q[0], H(q[0], q[2]) + 1.6, q[2]], 0.05, c(C.timber)); Bd.add('box', M(q[0], H(q[0], q[2]) + 1.75, q[2], a, 0, 0, 0.35, 0.3, 0.3), c(C.bone)); } }
        if (b.kind === 'boatshed') { const q = F(0, 0.6, 0); Bd.add('box', M(q[0], H(q[0], q[2]) + 0.6, q[2], b.rot, 0, 0, 3, 0.4, 0.5), c(C.timber)); }
      }
    }
  }
  // ------------------------------------------------------------ the hall
  {
    const big = { ...hall }, small = { ...hall, len: 34, wid: 10, rich: false, roof: 'turf' };
    longhouse(bk(1, 2), small, { wallH: 2.6 });
    longhouse(bk(2), big, { hall: true, wallH: 3.4 });
    Object.assign(hall, { smoke: big.smoke, doorGlow: big.doorGlow, ridgeH: big.ridgeH });
    const Bd = bk(2); const F = frame(big);
    // shields along both long walls
    const half = (t) => (big.wid / 2) * (0.84 + 0.16 * Math.sin(Math.PI * t));
    for (let k = 0; k < 34; k++) {
      const t = 0.06 + (k % 17) / 17 * 0.88; const s = k < 17 ? 1 : -1;
      const lx = (t - 0.5) * big.len; if (Math.abs(lx) < 3) continue;
      const p = F(lx, 2.0, s * (half(t) + 0.12)); shieldDisc(Bd, p, big.rot + (s > 0 ? 0 : Math.PI), 0.5);
    }
    // steps and platform
    for (let k = 0; k < 5; k++) { const p = F(0, -0.4 - k * 0.32, big.wid / 2 + 1.3 + k * 0.75); Bd.add('box', M(p[0], p[1], p[2], big.rot, 0, 0, 9 - k * 0.4, 0.4, 0.8), c(C.stone, 0.1)); }
    // carved high posts and god-poles flanking the doors
    for (const s of [-1, 1]) { const p = F(s * 6.5, 0, big.wid / 2 + 4.6); godpole(Bd, p[0], p[2], 5.5); }
    for (const s of [-1, 1]) { const p = F(s * 9.5, 0, big.wid / 2 + 2.5); weaponRack(Bd, p[0], p[2], big.rot); }
    const E3 = bk(3);
    for (let k = -2; k <= 2; k++) { const p = F(k * 10, 0, big.wid / 2 + 6.5); if (k) { E3.pole([p[0], H(p[0], p[2]), p[2]], [p[0], H(p[0], p[2]) + 7, p[2]], 0.08, c(C.timber)); E3.add('box', M(p[0] + 0.6, H(p[0], p[2]) + 6.0, p[2], big.rot, 0, 0, 1.1, 1.8, 0.03), c(k % 2 ? C.red : C.blue)); } }
  }
  // ------------------------------------------------------------ palisade (era 2) and fort (era 3)
  {
    const P2 = bk(2), P3 = bk(3);
    const pts = resample(L.pal, 0.52);
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      if (L.gates.some((g) => Math.hypot(g[0] - x, g[1] - z) < 3.2)) continue;
      const y = H(x, z), h = 4.6 + R() * 0.7;
      P2.add('cyl5', M(x, y + h / 2 - 0.8, z, R() * 3, 0, 0, 0.5, h, 0.5), c(R() < 0.15 ? C.oldwood : C.timber, 0.15));
      P2.add('cone5', M(x, y + h - 0.6, z, R() * 3, 0, 0, 0.5, 0.75, 0.5), c(C.oldwood, 0.15));
    }
    // inner walkway
    const wp = L.pal.map(([x, z]) => [L.PC[0] + (x - L.PC[0]) * 0.97, L.PC[1] + (z - L.PC[1]) * 0.97]);
    for (let i = 0; i < wp.length - 1; i++) {
      const [ax, az] = wp[i], [bx, bz] = wp[i + 1];
      if (L.gates.some((g) => Math.hypot(g[0] - ax, g[1] - az) < 4)) continue;
      const ya = H(ax, az) + 2.45, yb = H(bx, bz) + 2.45;
      const rot = Math.atan2(bx - ax, bz - az);
      P2.add('box', M((ax + bx) / 2, (ya + yb) / 2, (az + bz) / 2, rot, Math.atan2(ya - yb, Math.hypot(bx - ax, bz - az)), 0, 1.6, 0.14, Math.hypot(bx - ax, bz - az) + 0.1), c(C.plank, 0.12));
      P2.pole([ax, H(ax, az) - 0.3, az], [ax, ya, az], 0.1, c(C.tar));
    }
    // gates
    for (const g of L.gates) {
      const y = H(g[0], g[1]);
      const ang = Math.atan2(g[0] - L.PC[0], g[1] - L.PC[1]);
      const tx = Math.cos(ang), tz = -Math.sin(ang);
      for (const s of [-1, 1]) {
        const px = g[0] + tx * s * 2.6, pz = g[1] + tz * s * 2.6;
        P2.pole([px, y - 0.5, pz], [px, y + 6.2, pz], 0.3, c(C.tar));
        // era 3 gate towers
        P3.add('box', M(px + tx * s * 1.4, y + 4.5, pz + tz * s * 1.4, ang, 0, 0, 3.2, 0.25, 3.2), c(C.plank));
        for (const ox of [-1.4, 1.4]) for (const oz of [-1.4, 1.4]) P3.pole([px + tx * s * 1.4 + ox, y - 0.5, pz + tz * s * 1.4 + oz], [px + tx * s * 1.4 + ox, y + 7.5, pz + tz * s * 1.4 + oz], 0.16, c(C.tar));
        P3.add('cone', M(px + tx * s * 1.4, y + 8.6, pz + tz * s * 1.4, ang + 0.4, 0, 0, 4.6, 2.4, 4.6), c(C.shingle));
      }
      P2.pole([g[0] - tx * 3, y + 5.6, g[1] - tz * 3], [g[0] + tx * 3, y + 5.6, g[1] + tz * 3], 0.25, c(C.tar));
    }
    // stone footing ring (era 3)
    for (let i = 0; i < pts.length; i += 2) { const [x, z] = pts[i]; if (L.gates.some((g) => Math.hypot(g[0] - x, g[1] - z) < 3.2)) continue; P3.add('rock', M(x * 1.003, H(x, z) + 0.1, z * 1.001, R() * 6, 0, 0, 1.3, 0.8, 1.1), c(C.stone, 0.15)); }
    // watchtowers on the shore (era 3)
    for (const [x, z] of [[-210, 118], [262, 124], [-150, 112]]) {
      const y = H(x, z);
      for (const ox of [-1.5, 1.5]) for (const oz of [-1.5, 1.5]) P3.pole([x + ox * 1.2, y - 0.5, z + oz * 1.2], [x + ox * 0.85, y + 9, z + oz * 0.85], 0.3, c(C.tar));
      for (const hh of [3, 6]) P3.add('box', M(x, y + hh, z, 0.3, 0, 0, 3.4, 0.2, 3.4), c(C.timber));
      for (let k = 0; k < 4; k++) P3.add('box', M(x + Math.cos(0.3 + k * 1.57) * 1.75, y + 9.5, z - Math.sin(0.3 + k * 1.57) * 1.75, 0.3 + k * 1.57, 0, 0, 3.6, 1.0, 0.15), c(C.plank));
      P3.add('box', M(x, y + 8.8, z, 0.3, 0, 0, 3.6, 0.3, 3.6), c(C.plank));
      P3.add('cone', M(x, y + 10.4, z, 0.7, 0, 0, 4.8, 2.6, 4.8), c(C.shingle));
    }
  }
  // ------------------------------------------------------------ docks & piers
  {
    const D2 = bk(2), D3 = bk(3);
    const pier = (Bd, pts, w = 3.2) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const rot = Math.atan2(bx - ax, bz - az); const len = Math.hypot(bx - ax, bz - az);
        const n = Math.ceil(len / 0.45);
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; const x = ax + (bx - ax) * t, z = az + (bz - az) * t; Bd.add('box', M(x, 1.45, z, rot, 0, 0, w, 0.12, 0.42), c(C.plank, 0.15)); }
        for (let k = 0; k <= len; k += 3) { const t = k / len; const x = ax + (bx - ax) * t, z = az + (bz - az) * t; for (const s of [-1, 1]) { const px = x + Math.cos(rot) * s * w / 2, pz = z - Math.sin(rot) * s * w / 2; const gy = Math.min(0, H(px, pz)); Bd.pole([px, gy - 2, pz], [px, 2.1, pz], 0.16, c(C.tar)); } }
      }
      const e = pts[pts.length - 1]; rope(Bd, e[0] + 1, e[1] + 1, 1.55); barrel(Bd, e[0] - 0.8, e[1] + 2.2, 1, 1.5); crate(Bd, pts[1][0] + 0.8, pts[1][1], 1, 1.5);
    };
    pier(D2, [[-182, 100], [-182, 70], [-182, 30], [-182, 6]]);
    pier(D2, [[222, 104], [222, 70], [226, 30], [230, 0]]);
    pier(D3, [[60, 66], [62, 20], [64, -40]], 4);
    pier(D3, [[-40, 66], [-42, 10], [-44, -50]], 4);
    // ship sheds (era 3)
    for (const x of [-300, -320]) { const b = { x, z: 128, y: H(x, 128), rot: Math.PI / 2 - 0.15, len: 28, wid: 8, roof: 'turf' }; longhouse(D3, b, { wallH: 2.6 }); }
  }
  // ------------------------------------------------------------ shipyard (era 1+)
  {
    const Y = bk(1);
    const sx = L.S.shipyard[0], sz = L.S.shipyard[1] - 8, sy = H(sx, sz);
    // slipway logs down into the water
    for (let k = 0; k < 14; k++) { const z = sz + 8 - k * 3.2; Y.add('cyl', M(sx, Math.max(H(sx, z), -0.4) + 0.15, z, Math.PI / 2, 0, Math.PI / 2, 0.35, 7, 0.35), c(C.tar, 0.1)); }
    // hull on stocks: keel, ribs, first strakes
    const hz0 = sz - 4, hl = 22;
    Y.add('box', M(sx, sy + 0.9, hz0, 0, 0, 0, 0.3, 0.4, hl), c(C.timber));
    for (const e of [-1, 1]) { for (let k = 0; k < 8; k++) { const t = k / 7; Y.pole([sx, sy + 0.9 + t * 3.6, hz0 + e * (hl / 2 + t * 1.6)], [sx, sy + 0.9 + (k + 1) / 7 * 3.6, hz0 + e * (hl / 2 + (k + 1) / 7 * 1.6)], 0.16, c(C.timber), 'box'); } }
    for (let k = 1; k < 13; k++) {
      const z = hz0 - hl / 2 + k * (hl / 13); const tt = Math.sin(Math.PI * k / 13); const bw = 2.6 * Math.pow(tt, 0.6);
      for (const s of [-1, 1]) { let px = sx, py = sy + 0.9; for (let j = 1; j <= 5; j++) { const a = j / 5; const nx = sx + s * bw * Math.sin(a * 1.4), ny = sy + 0.9 + 2.1 * a * a + 0.3 * a; Y.pole([px, py, z], [nx, ny, z], 0.09, c(C.oldwood), 'box'); px = nx; py = ny; } }
      for (let j = 0; j < 3; j++) Y.box(sx, sy + 1.0 + j * 0.25, z, 0.1, 0.1, 0.1, 0, c(C.timber));
    }
    for (let st = 1; st <= 3; st++) for (const s of [-1, 1]) {
      const a = st / 5;
      const pts = []; for (let k = 0; k <= 12; k++) { const z = hz0 - hl / 2 + k * (hl / 12); const tt = Math.sin(Math.PI * k / 12); pts.push([sx + s * 2.6 * Math.pow(tt, 0.6) * Math.sin(a * 1.4) * 1.02, sy + 0.9 + 2.1 * a * a + 0.3 * a + (1 - tt) * 0.6 * a, z]); }
      for (let k = 0; k < pts.length - 1; k++) Y.pole(pts[k], pts[k + 1], 0.12, c(st % 2 ? C.plank : C.timber), 'box');
    }
    // stocks, scaffold, planks, tar pot, chips, wedges
    for (let k = 0; k < 6; k++) Y.box(sx, sy + 0.4, hz0 - hl / 2 + 2 + k * 3.6, 3.2, 0.8, 0.5, 0, c(C.oldwood));
    for (const s of [-1, 1]) {
      for (let k = 0; k < 5; k++) { const z = hz0 - 8 + k * 4; Y.pole([sx + s * 4.6, sy - 0.3, z], [sx + s * 4.6, sy + 4.2, z], 0.08, c(C.oldwood)); }
      Y.box(sx + s * 4.2, sy + 2.2, hz0, 1.2, 0.1, 17, 0, c(C.plank));
    }
    for (let k = 0; k < 8; k++) Y.box(sx + 9, sy + 0.12 + k * 0.13, sz + 4, 0.5, 0.12, 9, 0.05 * k, c(C.plank, 0.1));
    for (let k = 0; k < 4; k++) Y.pole([sx - 8 + k * 0.6, sy, sz + 9], [sx - 8.3 + k * 0.6, sy + 5.5, sz + 7.4], 0.12, c(C.plank), 'box');
    logs(Y, sx + 12, sz - 6, 10, 0, 6); logs(Y, sx - 11, sz - 2, 9, 0.2, 7);
    Y.add('cyl12', M(sx + 6, sy + 0.45, sz + 10, 0, 0, 0, 1.0, 0.9, 1.0), c(C.iron)); Y.add('disc', M(sx + 6, sy + 0.91, sz + 10, 0, 0, 0, 0.9, 0.02, 0.9), c(0x0c0a08));
    L.S.tarPot = [sx + 6, sy + 1.0, sz + 10];
    chips(Y, sx, hz0, 260, 9);
    crate(Y, sx + 7, sz + 7); crate(Y, sx + 7.8, sz + 7.6);
    for (let k = 0; k < 18; k++) Y.add('box', M(sx + 7 + R() * 1.4, sy + 0.75 + R() * 0.1, sz + 7.2 + R() * 1.1, R() * 6, 0, 0.6, 0.06, 0.04, 0.22), c(C.oldwood)); // caulking wedges
    rope(Y, sx - 5, sz + 10); rope(Y, sx - 6.2, sz + 11);
    // sawhorses
    for (let k = 0; k < 2; k++) { const x = sx + 10, z = sz + 12 + k * 3; Y.box(x, sy + 0.9, z, 2, 0.15, 0.2, 0.3, c(C.timber)); Y.pole([x - 0.8, sy, z - 0.4], [x - 0.8, sy + 0.9, z], 0.05, c(C.timber)); Y.pole([x + 0.8, sy, z + 0.4], [x + 0.8, sy + 0.9, z], 0.05, c(C.timber)); }
  }
  // ------------------------------------------------------------ site furniture
  {
    const A1 = bk(1), A0 = bk(0);
    const S = L.S;
    // drying racks and work places
    for (let k = 0; k < 5; k++) rack(A1, S.fishRacks[0] - 14 + k * 8, S.fishRacks[1] + (k % 2) * 3, 0.1, 6, 'fish');
    for (let k = 0; k < 3; k++) rack(A1, S.hides[0] - 6 + k * 6, S.hides[1] + k * 2, 0.5, 4, 'hide');
    for (let k = 0; k < 3; k++) rack(A1, S.netShore[0] - 10 + k * 9, S.netShore[1] + 4, 0, 6, 'net');
    for (let k = 0; k < 4; k++) vat(A1, S.dye[0] + (k - 1.5) * 2.6, S.dye[1] + 2, 0.6, [C.red, C.blue, C.ochre, 0x2e4a2a][k]);
    cookfire(A1, S.dye[0], S.dye[1] - 1);
    // practice field
    for (let k = 0; k < 4; k++) target(A1, S.practice[0] + 18, S.practice[1] - 12 + k * 7, -Math.PI / 2);
    weaponRack(A1, S.practice[0] - 6, S.practice[1] + 8, 0.2); weaponRack(A1, S.practice[0] - 6, S.practice[1] - 8, -0.2);
    for (let k = 0; k < 3; k++) { const x = S.practice[0] + 4 + k * 3, z = S.practice[1] + 10; A1.pole([x, H(x, z), z], [x, H(x, z) + 1.8, z], 0.15, c(C.oldwood)); }
    for (let k = 0; k < 6; k++) { const x = S.practice[0] - 8 + k * 0.5, z = S.practice[1]; A1.pole([x, H(x, z), z], [x - 0.3, H(x, z) + 2.4, z - 0.2], 0.03, c(C.timber)); } // spear stand
    // thing-stead: stone circle and the law rock
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; const x = S.thing[0] + Math.cos(a) * 14, z = S.thing[1] + Math.sin(a) * 14; A0.add('box', M(x, H(x, z) + 0.7, z, a, 0, (R() - 0.5) * 0.1, 0.8, 1.6 + R(), 0.5), c(C.stone, 0.12)); }
    A0.add('rock', M(S.thing[0], H(S.thing[0], S.thing[1]) + 0.6, S.thing[1] - 12, 0, 0, 0, 3.4, 2.2, 2.6), c(C.stoneD));
    // godswood: god-poles, altar heap, runestones, offerings on poles
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; godpole(A0, S.godswood[0] + Math.cos(a) * 9, S.godswood[1] + Math.sin(a) * 9, 4 + R() * 2); }
    rocks(A0, S.altar[0], S.altar[1] + 4, 30, 1.8, 0.8);
    L.S.altarTop = [S.altar[0], H(S.altar[0], S.altar[1] + 4) + 1.0, S.altar[1] + 4];
    for (const [x, z, r] of [[-60, 140, 0.4], [40, 230, -0.2], [-20, 300, 0.1], [150, 210, 0.6], [-150, 260, -0.4], [140, 425, 0.2], [200, 330, 0.3]]) runestone(A1, x, z, r);
    // the wrestling ring
    for (let k = 0; k < 22; k++) { const a = k / 22 * 6.283; const x = S.ring[0] + Math.cos(a) * 6.2, z = S.ring[1] + Math.sin(a) * 6.2; A0.add('rock', M(x, H(x, z) + 0.1, z, R() * 6, 0, 0, 0.5, 0.35, 0.45), c(C.stone, 0.2)); }
    // pyre base
    for (let k = 0; k < 26; k++) { const a = k / 26 * 6.283; const x = S.pyre[0] + Math.cos(a) * 4.2, z = S.pyre[1] + Math.sin(a) * 4.2; A0.add('rock', M(x, H(x, z) + 0.15, z, R() * 6, 0, 0, 0.8, 0.5, 0.7), c(C.stoneD, 0.2)); }
    // bonfire pits
    for (const b of L.bonfires) cookfire(A0, b.x, b.z);
    // feast fire-spits & woodpile
    logs(A0, S.woodpile[0], S.woodpile[1], 10, 0.3, 3); logs(A0, S.woodpile[0] + 3, S.woodpile[1] + 1.5, 10, 0.1, 3); logs(A0, S.woodpile[0] - 2.5, S.woodpile[1] + 3, 9, 1.2, 3);
    for (let k = 0; k < 6; k++) logs(A1, S.woodlot[0] + (k % 3) * 6, S.woodlot[1] + Math.floor(k / 3) * 6, 10, R() * 3, 6);
    chips(A1, S.woodlot[0] + 6, S.woodlot[1] + 3, 200, 10);
    // stream bridge
    A1.box(-104, H(-104, 104) + 0.6, 104, 7, 0.3, 4, 0.15, c(C.plank)); A1.box(-120, H(-120, 172) + 0.6, 172, 6, 0.3, 3.5, 0.2, c(C.plank));
    // lookout cairn
    rocks(A0, S.lookout[0], S.lookout[1], 14, 1.6, 0.9);
    // pens: fences, sheds, wallows
    for (const p of L.pens) {
      fence(A1, p.x, p.z, p.r, Math.max(16, Math.round(p.r * 2.2)), 1);
      if (p.kind === 'goat' || p.kind === 'pig') { const b = { x: p.x + p.r * 0.5, z: p.z - p.r * 0.5, y: H(p.x + p.r * 0.5, p.z - p.r * 0.5), rot: 0.4, len: 6, wid: 4, roof: 'turf' }; longhouse(A1, b, { wallH: 1.3 }); }
      if (p.kind === 'sheep') { for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283; rocks(A0, p.x + Math.cos(a) * (p.r + 1.5), p.z + Math.sin(a) * (p.r + 1.5), 2, 0.6, 0.6); } }
      if (p.kind === 'horse') { const q = [p.x - 4, p.z + 4]; A1.box(q[0], H(q[0], q[1]) + 0.35, q[1], 3, 0.6, 0.8, 0.2, c(C.plank)); }
    }
    // fields: stooks and haystacks
    for (const f of L.fields) {
      for (let k = 0; k < 40; k++) stook(A1, f.x0 + 4 + R() * (f.x1 - f.x0 - 8), f.z0 + 4 + R() * (f.z1 - f.z0 - 8));
      for (let k = 0; k < 3; k++) haystack(A1, f.x0 + R() * (f.x1 - f.x0), f.z1 + 4, 0.9);
    }
    // beacons: log pyramids on iron-bound posts
    L.beacons.forEach((b, i) => {
      const Bd = b.village || b.lookout ? bk(2) : bk(3);
      const y = b.lookout || b.village ? H(b.x, b.z) : b.y;
      for (let k = 0; k < 4; k++) Bd.pole([b.x + Math.cos(k * 1.57) * 1.6, y - 0.5, b.z + Math.sin(k * 1.57) * 1.6], [b.x, y + 4.2, b.z], 0.14, c(C.tar));
      for (let k = 0; k < 10; k++) Bd.add('cyl', M(b.x, y + 0.6 + k * 0.22, b.z, k * 0.7, 0, Math.PI / 2, 0.3, 2.6 - k * 0.2, 0.3), c(C.timber, 0.2));
      b.fireY = y + 2.4;
    });
  }
  // ------------------------------------------------------------ meshes
  const mat = stdMat({ snow: true }, { side: THREE.DoubleSide });
  const meshes = [];
  for (const { min, max, b } of buckets.values()) {
    if (!b.count) continue;
    const m = new THREE.Mesh(b.geometry(), mat);
    m.castShadow = true; m.receiveShadow = true; m.userData = { min, max };
    meshes.push(m);
  }
  return { meshes, mat };
}
