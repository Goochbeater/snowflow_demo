// Instanced forests with near/far LOD, godswood ash trees with hanging offerings, boulders.
import * as THREE from 'three';
import { Builder, M, col } from './builder.js';
import { heightAt, villageMask, waterSDF } from './terrain.js';
import { RNG, polyDist } from './util.js';
import { stdMat } from './materials.js';

export class Forest {
  constructor(scene, L, grid, seed) {
    const rng = new RNG(seed * 3 + 1);
    const nearB = new Builder(), farB = new Builder(), birchB = new Builder();
    const c = (h, j = 0) => col(h, j, () => rng.next());
    nearB.add('cyl5', M(0, 1.2, 0, 0, 0, 0, 0.35, 2.4, 0.35), c(0x3a2a1c));
    for (let k = 0; k < 4; k++) nearB.add('cone', M(0, 2.2 + k * 1.9, 0, k * 0.7, 0, 0, 3.6 - k * 0.75, 3.4 - k * 0.3, 3.6 - k * 0.75), c(k % 2 ? 0x1c3220 : 0x203a24));
    farB.add('cone5', M(0, 4.5, 0, 0, 0, 0, 3.4, 9.0, 3.4), c(0x1e3522));
    birchB.add('cyl5', M(0, 2.5, 0, 0, 0, 0, 0.22, 5, 0.22), c(0xd8d4c8));
    for (let k = 0; k < 4; k++) birchB.add('sphere', M((k % 2 - 0.5) * 1.2, 5 + k * 0.7, (k > 1 ? 0.6 : -0.6), 0, 0, 0, 2.6, 2.2, 2.6), c(k % 2 ? 0x5a7a2e : 0x4e6e2a));
    const mat = stdMat({ snow: true }, { roughness: 0.95 });
    this.trees = [];
    const roads = L.roads;
    const tryTree = (x, z, inner) => {
      const h = inner ? grid.get(x, z) : heightAt(x, z);
      if (h < 2.5 || h > 300 + rng.next() * 120) return;
      const e = 4; const hx = (inner ? grid.get(x + e, z) : heightAt(x + e, z)) - h, hz = (inner ? grid.get(x, z + e) : heightAt(x, z + e)) - h;
      const slope = Math.hypot(hx, hz) / e; if (slope > 1.7 || (slope > 1.2 && rng.next() < 0.6)) return;
      const vm = villageMask(x, z);
      if (vm > 0.55) return;
      if (inner) {
        for (const r of roads) if (polyDist(x, z, r.pts) < r.w + 3) return;
        for (const b of L.B) if (Math.hypot(b.x - x, b.z - z) < b.len * 0.6 + 4) return;
        for (const f of L.fields) if (x > f.x0 - 4 && x < f.x1 + 4 && z > f.z0 - 4 && z < f.z1 + 4) return;
        for (const p of L.pens) if (Math.hypot(p.x - x, p.z - z) < p.r + 4) return;
        if (Math.hypot(x - L.S.godswood[0], z - L.S.godswood[1]) < 18) return;
      }
      const birch = vm > 0.2 && rng.next() < 0.45;
      this.trees.push({ x, y: h - 0.3, z, s: (birch ? 0.8 : 0.7) + rng.next() * 0.7, r: rng.next() * 6, birch });
    };
    for (let i = 0; i < 40000 && this.trees.length < 12000; i++) tryTree(rng.range(-800, 800), rng.range(-700, 900), true);
    const nInner = this.trees.length;
    for (let i = 0; i < 40000 && this.trees.length < nInner + 12000; i++) {
      const x = rng.range(-2400, 2400), z = rng.range(-4600, 1800);
      if (x > -800 && x < 800 && z > -700 && z < 900) continue;
      if (waterSDF(x, z) < 20) continue;
      tryTree(x, z, false);
    }
    const N = this.trees.length;
    this.near = new THREE.InstancedMesh(nearB.geometry(), mat, N); this.near.castShadow = true; this.near.receiveShadow = true;
    this.far = new THREE.InstancedMesh(farB.geometry(), mat, N); this.far.castShadow = false;
    this.birch = new THREE.InstancedMesh(birchB.geometry(), mat, N); this.birch.castShadow = true;
    for (const m of [this.near, this.far, this.birch]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
    // godswood: great ash trees with offerings hanging from the branches
    const gw = new Builder(); const S = L.S;
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * 6.283 + 0.3, r = 16 + (k % 3) * 5; const x = S.godswood[0] + Math.cos(a) * r, z = S.godswood[1] + Math.sin(a) * r; const y = grid.get(x, z);
      const H = 11 + rng.next() * 5;
      gw.add('cyl', M(x, y + H / 2, z, 0, 0, 0, 1.3, H, 1.3), c(0x4a3a2a, 0.1));
      for (let b = 0; b < 5; b++) { const ba = b * 1.3 + k; gw.pole([x, y + H * 0.55 + b * 0.8, z], [x + Math.cos(ba) * 6, y + H * 0.75 + b, z + Math.sin(ba) * 6], 0.25, c(0x4a3a2a)); }
      for (let b = 0; b < 7; b++) { const ba = b * 0.9 + k; gw.add('sphere', M(x + Math.cos(ba) * 5, y + H + (b % 3) * 1.4, z + Math.sin(ba) * 5, 0, 0, 0, 7, 5, 7), c(b % 2 ? 0x3a5a26 : 0x2e4e22, 0.1)); }
      // hanging offerings: hides, antlers, bones, cloth strips on cords
      for (let o = 0; o < 6; o++) {
        const ba = o * 1.05 + k; const ox = x + Math.cos(ba) * 4.5, oz = z + Math.sin(ba) * 4.5, oy = y + H * 0.68 + (o % 3);
        gw.pole([ox, oy + 1.2, oz], [ox, oy, oz], 0.015, c(0x8a7a5a));
        const kind = o % 3;
        if (kind === 0) gw.add('box', M(ox, oy - 0.6, oz, ba, 0, 0, 0.8, 1.1, 0.04), c(0x7c5d3e));
        else if (kind === 1) gw.add('cone5', M(ox, oy - 0.3, oz, ba, Math.PI, 0, 0.18, 0.6, 0.18), c(0xe1d8c1));
        else gw.add('box', M(ox, oy - 0.5, oz, ba, 0, 0, 0.15, 1.0, 0.02), c(0x8e2a1e));
      }
    }
    const gm = new THREE.Mesh(gw.geometry(), mat); gm.castShadow = true; gm.receiveShadow = true; scene.add(gm);
    // boulders and scree
    const rb = new Builder();
    for (let i = 0; i < 2400; i++) {
      const x = rng.range(-800, 800), z = rng.range(-700, 900); const h = grid.get(x, z);
      const dw = waterSDF(x, z); if (h < -1 || (villageMask(x, z) > 0.7 && dw > 10)) continue;
      const s = (dw < 6 ? 0.8 : 1.6) * (0.5 + rng.next() * 2.2);
      rb.add('rock', M(x, h + s * 0.15, z, rng.next() * 6, rng.next(), rng.next(), s * 1.3, s * 0.8, s), c(0x6e6c66, 0.18));
    }
    const rm = new THREE.Mesh(rb.geometry(), mat); rm.castShadow = true; rm.receiveShadow = true; scene.add(rm);
    this.frame = 0;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.e = new THREE.Euler();
  }
  update(camera, force) {
    if (!force && (this.frame++ % 20) !== 0) return;
    const cx = camera.position.x, cz = camera.position.z, cy = camera.position.y;
    const nearR2 = 240 * 240;
    let n = 0, f = 0, b = 0;
    const { m, q, v, s, e } = this;
    if (!this.mats) { this.mats = new Float32Array(this.trees.length * 16); this.trees.forEach((t, i) => { e.set(0, t.r, 0); q.setFromEuler(e); v.set(t.x, t.y, t.z); s.setScalar(t.s); m.compose(v, q, s); m.toArray(this.mats, i * 16); }); }
    const M = this.mats, NA = this.near.instanceMatrix.array, FA = this.far.instanceMatrix.array, BA = this.birch.instanceMatrix.array;
    for (let i = 0; i < this.trees.length; i++) {
      const t = this.trees[i];
      const src = M.subarray(i * 16, i * 16 + 16);
      if (t.birch) { BA.set(src, (b++) * 16); continue; }
      const d2 = (t.x - cx) ** 2 + (t.z - cz) ** 2 + (t.y - cy) ** 2 * 0.3;
      if (d2 < nearR2) NA.set(src, (n++) * 16); else FA.set(src, (f++) * 16);
    }
    this.near.count = n; this.far.count = f; this.birch.count = b;
    this.near.instanceMatrix.needsUpdate = this.far.instanceMatrix.needsUpdate = this.birch.instanceMatrix.needsUpdate = true;
  }
}
