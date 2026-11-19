// Instanced grass tufts and crop stalks, scattered deterministically in a window that follows the camera focus.
import * as THREE from 'three';
import { hash2, smoothstep } from './util.js';
import { villageMask, forestDensity } from './terrain.js';
import { INNER } from './env.js';
import { U } from './materials.js';

function tuftGeo(blades, h0, h1, spread, w) {
  const pos = [], tip = [];
  let s = 3;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < blades; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * spread, h = h0 + r() * (h1 - h0);
    const x = Math.cos(a) * d, z = Math.sin(a) * d, ba = r() * 3.14;
    const bx = Math.cos(ba) * w, bz = Math.sin(ba) * w, lean = (r() - 0.5) * 0.25;
    pos.push(x - bx, 0, z - bz, x + bx, 0, z + bz, x + lean, h, z + lean * 0.5);
    tip.push(0, 0, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
  g.computeVertexNormals();
  // grass normals point up so blades shade like the ground beneath
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}
function grassMat(base, tipCol) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uWind = U.uWind; sh.uniforms.uSnow = U.uSnow;
    sh.vertexShader = 'attribute float aTip; uniform float uTime; uniform vec2 uWind; uniform float uSnow; varying float vTip;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vTip = aTip;
      vec4 wp = instanceMatrix * vec4(0., 0., 0., 1.);
      float sway = sin(uTime * 1.7 + wp.x * 0.15 + wp.z * 0.11) * 0.5 + sin(uTime * 3.1 + wp.x * 0.4) * 0.2;
      transformed.xz += (uWind * 0.12 + uWind * sway * 0.1) * aTip * aTip;
      transformed.y *= 1.0 - uSnow * 0.85;`);
    sh.fragmentShader = `varying float vTip;\n` + sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);').replace('#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= mix(vec3(${base.join(',')}), vec3(${tipCol.join(',')}), vTip);`);
  };
  m.customProgramCacheKey = () => 'grass' + base.join(',');
  return m;
}

function cropGeo(stalks) {
  const pos = [], tip = []; let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < stalks; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.55, h = 0.75 + r() * 0.35, ya = r() * 6.283, lean = 0.08 + r() * 0.12;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, ux = Math.cos(ya), uz = Math.sin(ya), w = 0.008;
    const lx = Math.sin(ya) * lean, lz = Math.cos(ya) * lean;
    // stalk: two tapered segments
    const P = (t) => [x + lx * t * t, h * t, z + lz * t * t];
    const p0 = P(0), p1 = P(0.55), p2 = P(0.86);
    const q = (A, B, wa, wb, ta, tb) => { pos.push(A[0] - ux * wa, A[1], A[2] - uz * wa, A[0] + ux * wa, A[1], A[2] + uz * wa, B[0] + ux * wb, B[1], B[2] + uz * wb, A[0] - ux * wa, A[1], A[2] - uz * wa, B[0] + ux * wb, B[1], B[2] + uz * wb, B[0] - ux * wb, B[1], B[2] - uz * wb); tip.push(ta, ta, tb, ta, tb, tb); };
    q(p0, p1, w, w * 0.8, 0, 0.55); q(p1, p2, w * 0.8, w * 0.6, 0.55, 0.86);
    // ear: a plump spindle drooping with the lean, plus a leaf
    const e0 = p2, e1 = [x + lx * 1.9, h * 1.04, z + lz * 1.9], em = [(e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2, (e0[2] + e1[2]) / 2], ew = 0.022;
    for (const sg of [-1, 1]) { pos.push(e0[0], e0[1], e0[2], em[0] + ux * ew * sg, em[1], em[2] + uz * ew * sg, e1[0], e1[1], e1[2]); tip.push(1, 1, 1); }
    pos.push(e0[0], e0[1], e0[2], em[0] + lz * ew * 3, em[1] + ew, em[2] - lx * ew * 3, e1[0], e1[1], e1[2]); tip.push(1, 1, 1);
    const lf = P(0.3), la = r() * 6.283; pos.push(lf[0] - ux * 0.01, lf[1], lf[2] - uz * 0.01, lf[0] + ux * 0.01, lf[1], lf[2] + uz * 0.01, lf[0] + Math.cos(la) * 0.22, lf[1] + 0.12, lf[2] + Math.sin(la) * 0.22); tip.push(0.4, 0.4, 0.5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 1));
  g.computeVertexNormals();
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

export class Grass {
  constructor(scene, L, grid) {
    this.L = L; this.grid = grid;
    this.grass = new THREE.InstancedMesh(tuftGeo(9, 0.25, 0.6, 0.45, 0.035), grassMat([0.03, 0.06, 0.015], [0.16, 0.22, 0.06]), 9000);
    this.crop = new THREE.InstancedMesh(cropGeo(16), grassMat([0.07, 0.07, 0.025], [0.42, 0.3, 0.09]), 6000);
    for (const m of [this.grass, this.crop]) { m.receiveShadow = true; m.frustumCulled = false; m.count = 0; scene.add(m); }
    this.key = '';
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
  }
  ctrl(x, z, ch) {
    const L = this.L; if (!L.ctrlData) return 0;
    const N = L.ctrlN; const u = Math.floor((x - INNER.x0) / (INNER.x1 - INNER.x0) * N), v = Math.floor((z - INNER.z0) / (INNER.z1 - INNER.z0) * N);
    if (u < 0 || v < 0 || u >= N || v >= N) return 0;
    return L.ctrlData[(v * N + u) * 4 + ch] / 255;
  }
  ovA(x, z) {
    const L = this.L; if (!L.ctrlData) return 0;
    const N = L.ctrlN; const u = Math.floor((x - INNER.x0) / (INNER.x1 - INNER.x0) * N), v = Math.floor((z - INNER.z0) / (INNER.z1 - INNER.z0) * N);
    if (u < 0 || v < 0 || u >= N || v >= N) return 1;
    const d = L.ctrlData, i = (v * N + u) * 4; return Math.max(d[i], d[i + 1], d[i + 3]) / 255;
  }
  update(target, season) {
    const step = 30; const kx = Math.round(target.x / step), kz = Math.round(target.z / step);
    const key = kx + ',' + kz;
    this.grass.visible = this.crop.visible = season < 0.85;
    if (key === this.key) return; this.key = key;
    const cx = kx * step, cz = kz * step, R = 95, cell = 2.1;
    const { _m: m, _q: q, _v: v, _s: s, _c: c } = this; const G = this.grid, L = this.L;
    let ng = 0, nc = 0;
    for (let x = cx - R; x < cx + R; x += cell) for (let z = cz - R; z < cz + R; z += cell) {
      const ix = Math.round(x / cell), iz = Math.round(z / cell);
      const jx = x + (hash2(ix, iz) - 0.5) * cell, jz = z + (hash2(iz, ix + 7) - 0.5) * cell;
      if ((jx - cx) ** 2 + (jz - cz) ** 2 > R * R) continue;
      const h = G.get(jx, jz); if (h < 3.2) continue;
      if (jz < 116 - Math.abs(jx) * 0.05 && Math.abs(jx) < 330 && h < 9) continue;
      const sl = Math.abs(G.get(jx + 1.5, jz) - h) + Math.abs(G.get(jx, jz + 1.5) - h); if (sl > 1.1) continue;
      const cv = this.ctrl(jx, jz, 2);
      const r = hash2(ix * 3 + 1, iz * 5 + 2);
      if (cv > 0.15) {
        // barley strips ripen gold, oat strips stay green; ploughed strips stay bare
        if (cv > 0.5) {
          const near = (jx - target.x) ** 2 + (jz - target.z) ** 2 < 38 * 38, sub = near ? [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]] : [[0, 0]];
          for (const [ox, oz] of sub) {
            if (nc >= 6000) break;
            const px = jx + ox * cell, pz = jz + oz * cell, cv2 = this.ctrl(px, pz, 2); if (cv2 < 0.5) continue;
            const rr = hash2(px * 3.1, pz * 1.7); q.setFromAxisAngle(v.set(0, 1, 0), rr * 40); v.set(px, G.get(px, pz) - 0.05, pz);
            const sc = (near ? 0.85 : 1.6) + rr * 0.3; s.set(sc, (0.85 + rr * 0.3) * (cv2 > 0.8 ? 1 : 0.85), sc); m.compose(v, q, s); this.crop.setMatrixAt(nc, m);
            if (cv2 > 0.8) c.setRGB(0.95 + rr * 0.2, 0.9 + rr * 0.15, 0.8); else c.setRGB(0.55, 0.85 + rr * 0.15, 0.42); this.crop.setColorAt(nc++, c);
          }
        }
        continue;
      }
      const a = this.ovA(jx, jz); if (a > 0.35 && r > 0.15) continue;
      if (forestDensity(jx, jz, h, sl * 0.3) > 0.5 && r > 0.3) continue;
      if (villageMask(jx, jz) < 0.2 && r > 0.5) continue;
      if (!this.noTufts && ng < 9000 && r < 0.92) { q.setFromAxisAngle(v.set(0, 1, 0), r * 50); v.set(jx, h - 0.05, jz); const sc = 0.7 + hash2(iz, ix) * 0.9; s.set(sc, sc * (0.8 + r * 0.5), sc); m.compose(v, q, s); this.grass.setMatrixAt(ng, m); const d = hash2(ix + 9, iz); c.setRGB(0.8 + d * 0.5, 0.85 + d * 0.3, 0.7 + d * 0.3); this.grass.setColorAt(ng++, c); }
    }
    this.grass.count = ng; this.crop.count = nc;
    for (const mm of [this.grass, this.crop]) { mm.instanceMatrix.needsUpdate = true; if (mm.instanceColor) mm.instanceColor.needsUpdate = true; }
  }
}
