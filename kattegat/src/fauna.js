// Livestock, dogs, cats, poultry, waterfowl and perched ravens. Static CC0 meshes are animated in the
// vertex shader (diagonal-gait legs, grazing/pecking heads, wagging tails); behaviour is a small state
// machine per animal (wander / graze / rest / follow / flee).
import * as THREE from 'three';
import animals from './assets/animals.json';
import { patch, U } from './materials.js';
import { hash2, RNG, lerp, clamp } from './util.js';
import { waveH } from './env.js';

// ------------------------------------------------------------------ geometry
function fromAsset(d) {
  const n = d.p.length / 3; const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), part = new Float32Array(n), piv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = d.p[i * 3] / 1000; pos[i * 3 + 1] = d.p[i * 3 + 1] / 1000; pos[i * 3 + 2] = d.p[i * 3 + 2] / 1000;
    const c = d.pal[d.c[i]]; col.set(c, i * 3); part[i] = d.t[i]; const pv = d.piv[d.t[i]] || [0, 0]; piv[i * 2] = pv[0]; piv[i * 2 + 1] = pv[1];
  }
  return mk(pos, col, part, piv);
}
function mk(pos, col, part, piv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aPart', new THREE.BufferAttribute(part, 1)); g.setAttribute('aPiv', new THREE.BufferAttribute(piv, 2));
  g.computeBoundingSphere(); return g;
}
// tiny procedural builder: tagged, flat-coloured primitives
class PB {
  constructor() { this.pos = []; this.col = []; this.part = []; this.piv = []; }
  tri(a, b, c, colr, tag, pv) { for (const p of [a, b, c]) { this.pos.push(...p); this.col.push(...colr); this.part.push(tag); this.piv.push(...pv); } }
  ell(cx, cy, cz, rx, ry, rz, colr, tag = 0, pv = [0, 0], seg = 8, rings = 5, rot = 0) {
    const P = []; for (let r = 0; r <= rings; r++) { const ph = Math.PI * r / rings; const row = []; for (let k = 0; k < seg; k++) { const th = k / seg * Math.PI * 2; let x = rx * Math.sin(ph) * Math.cos(th), y = ry * Math.cos(ph), z = rz * Math.sin(ph) * Math.sin(th); if (rot) { const y2 = y * Math.cos(rot) - z * Math.sin(rot), z2 = y * Math.sin(rot) + z * Math.cos(rot); y = y2; z = z2; } row.push([cx + x, cy + y, cz + z]); } P.push(row); }
    for (let r = 0; r < rings; r++) for (let k = 0; k < seg; k++) { const k2 = (k + 1) % seg; this.tri(P[r][k], P[r + 1][k], P[r + 1][k2], colr, tag, pv); this.tri(P[r][k], P[r + 1][k2], P[r][k2], colr, tag, pv); }
  }
  box(cx, cy, cz, sx, sy, sz, colr, tag = 0, pv = [0, 0]) {
    const v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => [cx + x * sx / 2, cy + y * sy / 2, cz + z * sz / 2]);
    for (const [a, b, c, d] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3]]) { this.tri(v[a], v[b], v[c], colr, tag, pv); this.tri(v[a], v[c], v[d], colr, tag, pv); }
  }
  cone(cx, cy, cz, r, h, colr, tag = 0, pv = [0, 0], tilt = 0) { const tip = [cx, cy + h * Math.cos(tilt), cz + h * Math.sin(tilt)]; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283, b = (k + 1) / 5 * 6.283; this.tri([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r], tip, [cx + Math.cos(b) * r, cy, cz + Math.sin(b) * r], colr, tag, pv); } }
  geo() { return mk(new Float32Array(this.pos), new Float32Array(this.col), new Float32Array(this.part), new Float32Array(this.piv)); }
}
const W = [1, 1, 1];
function catGeo() {
  const b = new PB(); const legTop = 0.13;
  b.ell(0, 0.17, -0.01, 0.068, 0.075, 0.16, W);
  b.ell(0, 0.26, 0.17, 0.062, 0.058, 0.06, W, 5, [0.21, 0.12]);
  b.cone(-0.035, 0.3, 0.17, 0.022, 0.05, W, 5, [0.21, 0.12]); b.cone(0.035, 0.3, 0.17, 0.022, 0.05, W, 5, [0.21, 0.12]);
  b.box(0, 0.245, 0.228, 0.022, 0.015, 0.012, [0.7, 0.45, 0.45], 5, [0.21, 0.12]);
  for (const sx of [-1, 1]) b.box(sx * 0.025, 0.272, 0.222, 0.016, 0.01, 0.008, [0.25, 0.4, 0.08], 5, [0.21, 0.12]);
  for (const [sx, sz, tag] of [[1, 1, 1], [-1, 1, 2], [1, -1, 3], [-1, -1, 4]]) b.box(sx * 0.038, legTop / 2, sz * 0.095, 0.026, legTop + 0.02, 0.026, W, tag, [legTop, sz * 0.095]);
  let p = [0, 0.19, -0.16]; for (let k = 0; k < 6; k++) { const t = (k + 1) / 6, q = [0, 0.19 + Math.sin(t * 1.6) * 0.17, -0.16 - Math.cos(t * 1.4) * 0.12 - t * 0.04]; b.box((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2, 0.022, Math.abs(q[1] - p[1]) + 0.02, Math.abs(q[2] - p[2]) + 0.02, W, 6, [0.19, -0.16]); p = q; }
  return b.geo();
}
function henGeo(goose) {
  const b = new PB(); const s = goose ? 1.6 : 1; const body = W;
  b.ell(0, 0.2 * s, 0, 0.09 * s, 0.085 * s, 0.13 * s, body, 0, [0, 0], 8, 5);
  b.cone(0, 0.2 * s, -0.1 * s, 0.06 * s, 0.13 * s, body, 0, [0, 0], -0.9);
  if (goose) { for (let k = 0; k < 4; k++) b.box(0, (0.27 + k * 0.05) * s, (0.1 + k * 0.012) * s, 0.04 * s, 0.06 * s, 0.04 * s, body, 5, [0.25 * s, 0.09 * s]); }
  const hy = goose ? 0.46 * s : 0.32, hz = goose ? 0.15 * s : 0.1;
  b.ell(0, hy, hz, 0.045 * (goose ? 1.1 : 1), 0.05, 0.05, body, 5, [0.24 * s, 0.07 * s]);
  b.cone(0, hy - 0.005, hz + 0.04, 0.016, 0.05, goose ? [0.9, 0.45, 0.08] : [0.85, 0.65, 0.15], 5, [0.24 * s, 0.07 * s], Math.PI / 2);
  if (!goose) { b.box(0, hy + 0.05, hz, 0.012, 0.04, 0.05, [0.75, 0.08, 0.05], 5, [0.24, 0.07]); b.box(0, hy - 0.05, hz + 0.03, 0.01, 0.03, 0.015, [0.75, 0.08, 0.05], 5, [0.24, 0.07]); }
  for (const [sx, tag] of [[1, 1], [-1, 2]]) b.box(sx * 0.03 * s, 0.06 * s, 0, 0.012, 0.13 * s, 0.012, goose ? [0.9, 0.45, 0.08] : [0.8, 0.6, 0.15], tag, [0.12 * s, 0]);
  return b.geo();
}
function duckGeo() { const b = new PB(); b.ell(0, 0.06, 0, 0.09, 0.07, 0.15, [0.45, 0.36, 0.26]); b.ell(0, 0.15, 0.11, 0.045, 0.045, 0.05, [0.1, 0.32, 0.12], 5, [0.1, 0.08]); b.cone(0, 0.145, 0.15, 0.015, 0.05, [0.85, 0.6, 0.1], 5, [0.1, 0.08], Math.PI / 2); b.cone(0, 0.08, -0.13, 0.05, 0.08, [0.3, 0.25, 0.2], 6, [0.08, -0.12], -1.2); return b.geo(); }
function ravenGeo() { const b = new PB(); const k = [0.04, 0.04, 0.05]; b.ell(0, 0.12, 0, 0.06, 0.07, 0.12, k, 0, [0, 0], 7, 4, 0.5); b.ell(0, 0.22, 0.09, 0.04, 0.04, 0.045, k, 5, [0.18, 0.06]); b.cone(0, 0.22, 0.12, 0.013, 0.06, [0.08, 0.08, 0.08], 5, [0.18, 0.06], Math.PI / 2); b.cone(0, 0.09, -0.1, 0.035, 0.13, k, 6, [0.09, -0.08], -1.9); for (const sx of [-1, 1]) b.box(sx * 0.02, 0.025, 0.01, 0.008, 0.06, 0.008, [0.05, 0.05, 0.05]); return b.geo(); }

// ------------------------------------------------------------------ material
const ANIM = /* glsl */`
  vec3 p = position;
  float tg = aPart;
  if (tg > 0.5 && tg < 4.5) {
    float off = (tg < 1.5 || tg > 3.5) ? 0.0 : 3.14159;
    float th = aAnim.y * 0.55 * sin(aAnim.x + off);
    vec2 r = vec2(p.y - aPiv.x, p.z - aPiv.y);
    p.y = aPiv.x + r.x * cos(th) - r.y * sin(th); p.z = aPiv.y + r.x * sin(th) + r.y * cos(th);
  } else if (tg > 4.5 && tg < 5.5) {
    float th = aAnim.z * 0.95 + aAnim.y * 0.05 * sin(aAnim.x * 2.0);
    vec2 r = vec2(p.y - aPiv.x, p.z - aPiv.y);
    p.y = aPiv.x + r.x * cos(th) - r.y * sin(th); p.z = aPiv.y + r.x * sin(th) + r.y * cos(th);
  } else if (tg > 5.5) {
    float th = aAnim.w * 0.55 * sin(uTime * 13.0 + aAnim.x);
    float dz = p.z - aPiv.y; float x0 = p.x; p.x = x0 * cos(th) + dz * sin(th); p.z = aPiv.y - x0 * sin(th) + dz * cos(th);
  }
  p.y += aAnim.y * 0.012 * abs(sin(aAnim.x));
  vec3 transformed = p;
`;
function faunaMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88 });
  patch(m, { flat: true });
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh) => {
    base(sh);
    sh.vertexShader = 'uniform float uTime; attribute float aPart; attribute vec2 aPiv; attribute vec4 aAnim; attribute vec3 aTint;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', ANIM)
      .replace('#include <color_vertex>', '#include <color_vertex>\n vColor.rgb *= aTint;');
  };
  m.customProgramCacheKey = () => 'fauna';
  return m;
}
function faunaDepth() {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (sh) => { sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime; attribute float aPart; attribute vec2 aPiv; attribute vec4 aAnim;\n' + sh.vertexShader.replace('#include <begin_vertex>', ANIM); };
  m.customProgramCacheKey = () => 'faunaDepth';
  return m;
}

// ------------------------------------------------------------------ the animals
const TINTS = {
  sheep: [[1, 1, 1], [0.95, 0.92, 0.85], [0.42, 0.36, 0.3], [0.85, 0.8, 0.72]],
  goat: [[1, 1, 1], [0.7, 0.65, 0.6], [1.4, 1.3, 1.2], [0.5, 0.45, 0.4]],
  pig: [[1, 1, 1], [0.9, 0.8, 0.7], [0.55, 0.45, 0.4]],
  horse: [[1, 1, 1], [1.6, 1.3, 1.0], [0.6, 0.6, 0.6], [2.6, 2.3, 1.9]],
  cow: [[1, 1, 1], [0.85, 0.7, 0.55], [0.75, 0.6, 0.45]],
  dog: [[0.7, 0.68, 0.66], [1, 1, 1], [0.45, 0.42, 0.4], [0.9, 0.75, 0.6], [0.3, 0.28, 0.27]],
  cat: [[0.85, 0.5, 0.22], [0.42, 0.4, 0.38], [0.08, 0.08, 0.08], [0.95, 0.92, 0.88], [0.6, 0.45, 0.3], [0.3, 0.27, 0.24]],
  hen: [[0.62, 0.38, 0.18], [0.92, 0.9, 0.85], [0.2, 0.18, 0.16], [0.75, 0.55, 0.3]],
  goose: [[0.95, 0.95, 0.93], [0.7, 0.68, 0.62]],
  duck: [[1, 1, 1]], raven: [[1, 1, 1]],
};
export class Fauna {
  constructor(scene, grid, S) {
    this.grid = grid; this.mat = faunaMaterial(); this.dmat = faunaDepth();
    this.geos = { sheep: fromAsset(animals.sheep), goat: fromAsset(animals.goat), pig: fromAsset(animals.pig), horse: fromAsset(animals.horse), cow: fromAsset(animals.cow), dog: fromAsset(animals.dog), cat: catGeo(), hen: henGeo(false), goose: henGeo(true), duck: duckGeo(), raven: ravenGeo() };
    this.list = []; this.meshes = {};
    this.scene = scene;
    this.rng = new RNG(S.seed + 404); this.S = S;
  }
  add(species, o) { const r = this.rng; const tints = TINTS[species]; this.list.push(Object.assign({ species, x: 0, z: 0, yaw: r.next() * 6.28, tx: 0, tz: 0, st: 'rest', timer: r.next() * 5, phase: r.next() * 6.28, amp: 0, graze: 0, wag: 0, spd: 0.5, tint: tints[Math.floor(r.next() * tints.length)], scale: 0.9 + r.next() * 0.2 }, o)); }
  setLayout(L, grid) {
    const r = this.rng;
    for (const p of L.pens) {
      const sp = { goat: 'goat', cow: 'cow' }[p.kind] || p.kind;
      const n = sp === 'sheep' ? 70 : p.n;
      for (let i = 0; i < n; i++) { const a = r.next() * 6.28, d = Math.sqrt(r.next()) * p.r * 0.85; this.add(sp, { x: p.x + Math.cos(a) * d, z: p.z + Math.sin(a) * d, hx: p.x, hz: p.z, hr: p.r * 0.85, spd: sp === 'horse' ? 1.1 : sp === 'pig' ? 0.6 : 0.5, kind: 'herd' }); }
    }
    // sheep loose on the hill pasture above the village
    for (let i = 0; i < 26; i++) { const x = -40 + r.range(-60, 60), z = 500 + r.range(-15, 25); this.add('sheep', { x, z, hx: x, hz: z, hr: 30, spd: 0.45, kind: 'herd' }); }
    const houses = L.B.filter((b) => b.kind === 'house');
    // cats keep to doorsteps and yards; hens and their cockerels scratch about the farmsteads
    for (let i = 0; i < 34; i++) { const b = houses[Math.floor(r.next() * houses.length)]; this.add('cat', { x: b.door[0] + r.range(-1, 1), z: b.door[1] + r.range(0, 1.5), hx: b.door[0], hz: b.door[1] + 1, hr: 7, spd: 0.6, kind: 'cat', scale: 0.85 + r.next() * 0.3, door: b.door }); }
    for (let i = 0; i < 16; i++) { const b = houses[(i * 7) % houses.length]; for (let k = 0; k < 6; k++) this.add('hen', { x: b.door[0] + r.range(-4, 4), z: b.door[1] + r.range(1, 6), hx: b.door[0], hz: b.door[1] + 3.5, hr: 6, spd: 0.4, kind: 'fowl', scale: 0.85 + r.next() * 0.3 }); }
    for (let i = 0; i < 14; i++) { const x = -112 + r.range(-8, 8), z = 140 + r.range(-25, 40); this.add('goose', { x, z, hx: -110, hz: 150, hr: 22, spd: 0.45, kind: 'fowl' }); }
    for (let i = 0; i < 26; i++) { const x = -150 + r.range(0, 340), z = 40 - r.range(0, 70); this.add('duck', { x, z, hx: x, hz: z, hr: 12, spd: 0.25, kind: 'water' }); }
    // ravens on the ridges of the hall and the richest houses, and on the god-poles
    const perches = [];
    for (const b of L.B) if ((b.kind === 'hall' || (b.kind === 'house' && b.rich)) && b.ridgeH) { const n = b.kind === 'hall' ? 5 : 1; for (let k = 0; k < n; k++) { const lx = (k / Math.max(1, n - 1) - 0.5) * b.len * 0.7; perches.push([b.x + Math.cos(b.rot) * lx, b.y + b.ridgeH + (b.kind === 'hall' ? 1.3 : 0.4), b.z - Math.sin(b.rot) * lx, b.rot + (k % 2) * Math.PI]); } }
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; const x = L.S.godswood[0] + Math.cos(a) * 9, z = L.S.godswood[1] + Math.sin(a) * 9; perches.push([x, grid.get(x, z) + 6.2, z, a]); }
    for (const p of perches.slice(0, 30)) this.add('raven', { x: p[0], z: p[2], y: p[1], yaw: p[3], kind: 'perch' });
    this.add('goat', { kind: 'sacrifice', scale: 1.05 });
    this.dogStart = this.list.length;
    const S = this.S; for (let i = 0; i < S.dogs.length; i++) this.add('dog', { kind: 'dog', di: i, scale: 0.95 + this.rng.next() * 0.35, tint: TINTS.dog[S.dogs[i].col % TINTS.dog.length] });
    // instanced meshes
    const counts = {}; for (const a of this.list) counts[a.species] = (counts[a.species] || 0) + 1;
    for (const sp in counts) {
      const g = this.geos[sp].clone(); const n = counts[sp];
      const an = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); an.setUsage(THREE.DynamicDrawUsage);
      const ti = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      g.setAttribute('aAnim', an); g.setAttribute('aTint', ti);
      const m = new THREE.InstancedMesh(g, this.mat, n); m.customDepthMaterial = this.dmat; m.castShadow = sp !== 'duck'; m.receiveShadow = false; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0;
      this.scene.add(m); this.meshes[sp] = { m, an, ti, n: 0 };
    }
  }
  setPens() {}
  update(S, alpha, t, P, grid, camera, dt = 1 / 60, sim) {
    if (!this.meshes.sheep) return;
    for (const k in this.meshes) this.meshes[k].n = 0;
    const r = this.rng, A = S.agents, hash = sim?.hash;
    const cx = camera.position.x, cz = camera.position.z;
    const dark = U.uDark.value;
    for (const a of this.list) {
      if (a.kind === 'sacrifice') { const g = S.goat; if (g.state !== 1 && g.state !== 2) continue; const mv = Math.hypot(g.x - a.x, g.z - a.z); if (mv > 0.005) a.yaw = Math.atan2(g.x - a.x, g.z - a.z); a.amp = clamp(mv / dt / 1.5, 0, 1); a.phase += dt * 9 * a.amp; a.x = g.x; a.z = g.z; a.graze = 0; }
      else if (a.kind === 'dog') {
        const d = S.dogs[a.di]; const x = lerp(d.px, d.x, alpha), z = lerp(d.pz, d.z, alpha);
        const mv = Math.hypot(x - a.x, z - a.z); const sp = dt > 0 ? mv / dt : 0;
        if (mv > 0.004) { const ty = Math.atan2(x - a.x, z - a.z); let dy = ty - a.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; a.yaw += dy * Math.min(1, dt * 8); }
        if (d.fight >= 0) a.yaw += dt * 6;
        a.amp = lerp(a.amp, clamp(sp / 2.5, 0, 1), Math.min(1, dt * 6)); a.phase += dt * (6 + sp * 3.2);
        a.x = x; a.z = z; a.wag = d.fight >= 0 ? 0.2 : 0.6 + 0.4 * Math.sin(t * 0.7 + a.di); a.graze = d.st === 2 && sp < 0.3 ? 0.6 : 0;
      } else if (a.kind === 'perch') { a.graze = Math.max(0, Math.sin(t * 0.9 + a.phase * 7)) ** 8 * 0.6; a.amp = 0; }
      else {
        a.timer -= dt;
        const far = (a.x - cx) ** 2 + (a.z - cz) ** 2 > 260 * 260;
        if (a.st === 'walk' || a.st === 'flee') {
          const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
          const sp = a.spd * (a.st === 'flee' ? 4 : 1) * a.scale;
          if (d < 0.15 || a.timer < -20) { a.st = 'rest'; a.timer = 3 + r.next() * (a.kind === 'cat' ? 30 : 10); }
          else { a.x += dx / d * sp * dt; a.z += dz / d * sp * dt; const ty = Math.atan2(dx, dz); let dy = ty - a.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; a.yaw += dy * Math.min(1, dt * 5); }
          a.amp = lerp(a.amp, a.st === 'flee' ? 1 : 0.65, dt * 5); a.phase += dt * sp * (a.kind === 'fowl' ? 22 : a.species === 'horse' ? 3.2 : 7) / Math.max(0.3, a.scale);
          a.graze = lerp(a.graze, 0, dt * 4);
        } else {
          a.amp = lerp(a.amp, 0, dt * 5);
          if (a.kind === 'fowl') a.graze = Math.max(0, Math.sin(t * 5 + a.phase * 9)) ** 3 * 1.0;
          else if (a.kind === 'cat') a.graze = 0;
          else if (a.kind === 'water') a.graze = Math.max(0, Math.sin(t * 0.6 + a.phase * 3)) ** 10 * 1.4;
          else a.graze = lerp(a.graze, Math.sin(t * 0.15 + a.phase) > -0.3 ? 1 : 0.1, dt * 1.5);
          if (a.timer <= 0) {
            a.st = 'walk'; a.timer = 25;
            const ang = r.next() * 6.283, rr = Math.sqrt(r.next()) * a.hr;
            a.tx = a.hx + Math.cos(ang) * rr; a.tz = a.hz + Math.sin(ang) * rr;
            if (a.kind === 'cat' && r.next() < 0.5 && a.door) { a.tx = a.door[0] + (r.next() - 0.5) * 1.2; a.tz = a.door[1] + 0.6; }
          }
        }
        // poultry and cats scatter from passing feet
        if (!far && hash && (a.kind === 'fowl' || a.kind === 'cat') && a.st !== 'flee') {
          const l = hash.get(((Math.floor(a.x / 8) + 1000) << 12) | (Math.floor(a.z / 8) + 1000));
          if (l) for (const id of l) { const p = A[id]; const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz); if (d < 1.9 && p.moving) { a.st = 'flee'; a.timer = 2; a.tx = a.x + dx / (d || 1) * 3.5; a.tz = a.z + dz / (d || 1) * 3.5; break; } }
        }
      }
      const M = this.meshes[a.species]; const i = M.n++;
      let y = a.y ?? grid.get(a.x, a.z);
      if (a.kind === 'water') { y = P.tide + waveH(a.x, a.z, t, P.sea, [1, 0.3]) - 0.02; a.x += Math.sin(t * 0.05 + a.phase) * dt * 0.15; a.yaw += dt * 0.05 * Math.sin(a.phase); }
      if (a.kind === 'cat' && a.st === 'rest' && dark > 0.7) a.graze = 0;
      const s = a.scale, c = Math.cos(a.yaw), sn = Math.sin(a.yaw), e = M.m.instanceMatrix.array, o = i * 16;
      const sy = a.kind === 'cat' && a.st === 'rest' && (a.phase * 10) % 3 < 1 ? 0.7 : 1; // some cats curl up
      e[o] = c * s; e[o + 1] = 0; e[o + 2] = -sn * s; e[o + 3] = 0; e[o + 4] = 0; e[o + 5] = s * sy; e[o + 6] = 0; e[o + 7] = 0; e[o + 8] = sn * s; e[o + 9] = 0; e[o + 10] = c * s; e[o + 11] = 0; e[o + 12] = a.x; e[o + 13] = y; e[o + 14] = a.z; e[o + 15] = 1;
      M.an.array[i * 4] = a.phase; M.an.array[i * 4 + 1] = a.amp; M.an.array[i * 4 + 2] = a.graze; M.an.array[i * 4 + 3] = a.wag;
      M.ti.array[i * 3] = a.tint[0]; M.ti.array[i * 3 + 1] = a.tint[1]; M.ti.array[i * 3 + 2] = a.tint[2];
    }
    for (const k in this.meshes) { const M = this.meshes[k]; M.m.count = M.n; M.m.instanceMatrix.needsUpdate = true; M.an.needsUpdate = true; M.ti.needsUpdate = true; }
  }
}
