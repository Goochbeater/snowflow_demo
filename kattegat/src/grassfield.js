// GPU grass: two rings of world-anchored clumps that follow the camera. Every clump finds its own ground height
// (exactly on the terrain triangles), its density (from the material splat and the painted control map), and its
// colour (from the meadow texture beneath it), so the blades grow out of the ground they stand on.
import * as THREE from 'three';
import { U, patch } from './materials.js';
import { TU, MEADOW_GLSL } from './terrainmat.js';
import { GLSL_NOISE } from './materials.js';
import { LID } from './texgen.js';
import { INNER } from './env.js';

function clumpGeo(blades, seed) {
  const pos = [], bl = [], idx = []; let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const LV = [0, 0.3, 0.62, 1];
  for (let b = 0; b < blades; b++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.5, yaw = r() * 6.283, hf = 0.55 + r() * 0.6, bend = 0.15 + r() * 0.55, wf = 0.75 + r() * 0.5;
    const base = pos.length / 3;
    for (let l = 0; l < LV.length; l++) {
      const sides = l === LV.length - 1 ? [0] : [-1, 1];
      for (const sd of sides) { pos.push(sd, LV[l], b); bl.push(Math.cos(a) * d, Math.sin(a) * d, yaw, hf, bend, wf); }
    }
    // strip: (0,1) (2,3) (4,5) tip 6
    for (let l = 0; l < LV.length - 2; l++) { const o = base + l * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    const o = base + (LV.length - 2) * 2; idx.push(o, o + 1, o + 2);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const B = new Float32Array(bl), ib = new THREE.InterleavedBuffer(B, 6);
  g.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('aB2', new THREE.InterleavedBufferAttribute(ib, 2, 4));
  g.setIndex(idx);
  return g;
}

const VERT = /* glsl */`
precision highp sampler2DArray;
attribute vec4 aB; attribute vec2 aB2;
uniform highp sampler2D uHt; uniform sampler2D uSpl; uniform sampler2D uCtrl; uniform sampler2DArray tAlb; uniform vec3 uGT;
uniform vec4 uIn; uniform vec3 uCam; uniform vec2 uFwd; uniform vec4 uRing; uniform vec3 uPush; uniform float uTime; uniform vec2 uWind; uniform float uSnow; uniform float uTide;
varying float vT; varying vec3 vCol; varying vec3 vGW;
${GLSL_NOISE}
${MEADOW_GLSL}
vec4 gHash(vec2 p) { vec4 q = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); q += dot(q, q.wzxy + 33.33); return fract((q.xxyz + q.yzzw) * q.zywx); }
// terrain height exactly as the mesh triangulates it: quads (a,b,d) + (b,c,d)
float gH(vec2 p, out vec2 grad) {
  vec2 f = (p - uIn.xy) / 4.0; vec2 i = floor(f); vec2 u = f - i; ivec2 c = ivec2(i);
  float ha = texelFetch(uHt, c, 0).r, hd = texelFetch(uHt, c + ivec2(1, 0), 0).r, hb = texelFetch(uHt, c + ivec2(0, 1), 0).r, hc = texelFetch(uHt, c + ivec2(1, 1), 0).r;
  if (u.x + u.y <= 1.0) { grad = vec2(hd - ha, hb - ha) / 4.0; return ha + (hd - ha) * u.x + (hb - ha) * u.y; }
  grad = vec2(hc - hb, hc - hd) / 4.0; return hc + (hb - hc) * (1.0 - u.x) + (hd - hc) * (1.0 - u.y);
}
`;
const BEGIN = /* glsl */`
  float N = uRing.y; int iN = int(N);
  float ii = float(gl_InstanceID % iN), jj = float(gl_InstanceID / iN);
  vec2 cell = floor(uCam.xz / uRing.x) + vec2(ii, jj) - floor(N * 0.5);
  vec4 hs = gHash(cell);
  vec2 wp = (cell + 0.1 + hs.xy * 0.8) * uRing.x;
  float dist = length(wp - uCam.xz);
  vec2 su = (wp - uIn.xy) / uIn.zw;
  float dens = 0.0; vec2 grad = vec2(0.0); float gy = -1000.0;
  float fade = (1.0 - smoothstep(uRing.z * 0.72, uRing.z, dist)) * smoothstep(uRing.w, uRing.w + 5.0, dist);
  bool behind = dist > 3.0 && dot((wp - uCam.xz) / dist, uFwd) < -0.3;
  if (fade > 0.0 && !behind && su.x > 0.003 && su.y > 0.003 && su.x < 0.997 && su.y < 0.997) {
    gy = gH(wp, grad);
    vec4 spl = texture(uSpl, su * (400.0 / 401.0) + 0.5 / 401.0);
    vec4 ct = texture(uCtrl, su);
    dens = (1.0 - spl.x) * (1.0 - spl.y * 0.85) * (1.0 - spl.z) * (1.0 - ct.r) * (1.0 - ct.g) * (1.0 - ct.a) * (1.0 - smoothstep(0.1, 0.2, ct.b));
    dens *= 1.0 - smoothstep(0.55, 0.85, length(grad));
    dens *= smoothstep(uTide + 2.2, uTide + 3.4, gy);
    dens *= 1.0 - spl.w * 0.6;
  }
  float keep = step(hs.z, smoothstep(0.08, 0.6, dens)) * fade;
  vec3 transformed;
  vec3 objectNormal = vec3(0.0, 1.0, 0.0);
  vT = position.y; vCol = vec3(0.0); vGW = vec3(0.0);
  if (keep < 0.03) { transformed = vec3(wp.x, -2000.0, wp.y); }
  else {
    float t = position.y, sd = position.x;
    float H = (0.16 + 0.34 * hs.w) * aB.w * keep * mix(0.55, 1.0, dens) * (1.0 - uSnow * 0.85) * (uRing.w > 0.0 ? 1.25 : 1.0);
    float W = 0.011 * aB2.y * (uRing.w > 0.0 ? 2.6 : 1.0);
    float yaw = aB.z + hs.z * 6.283;
    vec2 side = vec2(cos(yaw), -sin(yaw)), fwd = vec2(sin(yaw), cos(yaw));
    vec2 root = wp + aB.xy * uRing.x * 0.9;
    // bend: own curl + wind + the visitor brushing through
    float gust = sin(uTime * 1.3 + root.x * 0.21 + root.y * 0.17) * 0.5 + sin(uTime * 2.7 + root.x * 0.7 - root.y * 0.4) * 0.25;
    vec2 lean = fwd * aB2.x + uWind * (0.35 + 0.3 * gust);
    vec2 pd = root - uPush.xz; float pl = length(pd); float pk = (1.0 - smoothstep(0.25, 0.9, pl)) * step(abs(uPush.y - gy), 2.5);
    lean += (pl > 1e-3 ? pd / pl : vec2(0.0)) * pk * 1.6;
    float ll = length(lean); if (ll > 1.4) lean *= 1.4 / ll;
    float t2 = t * t;
    vec2 off = lean * H * t2 * 0.75;
    float hgt = H * t * (1.0 - 0.32 * min(1.0, dot(lean, lean)) * t);
    float w = W * (1.0 - pow(t, 1.6)) * (1.0 + 0.4 * (1.0 - t));
    vec2 xz = root + side * sd * w + off;
    vec2 g2; float yb = gH(root, g2);
    transformed = vec3(xz.x, yb - 0.03 + hgt, xz.y);
    vec3 bn = normalize(vec3(fwd.x, 0.0, fwd.y) - vec3(lean.x, -0.6, lean.y) * t * 0.5);
    objectNormal = normalize(mix(bn, vec3(0.0, 1.0, 0.0), 0.55));
    // colour: the meadow texture beneath, deeper at the root, sunlit and drier toward the tip
    vec3 gc = kMeadow(root, textureLod(tAlb, vec3(root / 2.1, ${LID.grass}.0), 5.0).rgb * uGT) * mix(vec3(1.0), vec3(1.25, 1.02, 0.66), texture(uSpl, su * (400.0 / 401.0) + 0.5 / 401.0).w * 0.85);
    vec3 tipC = mix(gc * vec3(1.25, 1.35, 1.05), gc * vec3(1.9, 1.6, 0.8), smoothstep(0.6, 0.95, hs.y) * 0.8);
    vCol = mix(gc * 0.42, tipC, smoothstep(0.0, 0.9, t)) * (0.85 + 0.3 * hs.w);
    vGW = vec3(xz.x, transformed.y, xz.y);
  }
`;

export class GrassField {
  constructor(scene, terrainGeom, tex) {
    // ground height and splat weights straight from the inner terrain mesh (401 x 401 vertices, 4 m apart)
    const P = terrainGeom.attributes.position, S = terrainGeom.attributes.aSplat, n = 401;
    const ht = new Float32Array(n * n), sp = new Uint8Array(n * n * 4);
    for (let i = 0; i < n * n; i++) { ht[i] = P.getY(i); for (let k = 0; k < 4; k++) sp[i * 4 + k] = Math.round(S.array[i * 4 + k] * 255); }
    const tH = new THREE.DataTexture(ht, n, n, THREE.RedFormat, THREE.FloatType); tH.needsUpdate = true;
    const tS = new THREE.DataTexture(sp, n, n, THREE.RGBAFormat); tS.magFilter = tS.minFilter = THREE.LinearFilter; tS.needsUpdate = true;
    const calib = TU.uLT.value[LID.grass];
    this.uni = {
      uHt: { value: tH }, uSpl: { value: tS }, uCtrl: TU.uCtrl, tAlb: TU.tAlb, uGT: { value: calib },
      uIn: { value: new THREE.Vector4(INNER.x0, INNER.z0, INNER.x1 - INNER.x0, INNER.z1 - INNER.z0) },
      uCam: { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector2(0, 1) }, uPush: { value: new THREE.Vector3(0, -999, 0) },
    };
    this.rings = [
      { cell: 0.26, N: 176, R: 22, R0: 0, blades: 7 },
      { cell: 0.95, N: 150, R: 68, R0: 17, blades: 4 },
    ].map((r, k) => {
      const g = clumpGeo(r.blades, 11 + k); g.instanceCount = r.N * r.N;
      const ring = { value: new THREE.Vector4(r.cell, r.N, r.R, r.R0) };
      const m = this.material(ring, k);
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.castShadow = false;
      scene.add(mesh); return { mesh, ring, r };
    });
    this.lowQ = false;
  }
  material(ring, k) {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.78, side: THREE.DoubleSide, envMapIntensity: 0.6 });
    patch(m, {});
    const base = m.onBeforeCompile;
    m.onBeforeCompile = (sh) => {
      base(sh);
      Object.assign(sh.uniforms, this.uni, { uRing: ring, uTime: U.uTime, uWind: U.uWind, uSnow: U.uSnow, uTide: U.uTide, uSun: U.uSun, uSunCol: U.uSunCol });
      sh.vertexShader = VERT + sh.vertexShader
        .replace('#include <beginnormal_vertex>', BEGIN)
        .replace('#include <begin_vertex>', '');
      sh.fragmentShader = 'varying float vT; varying vec3 vCol; varying vec3 vGW; uniform vec3 uSun; uniform vec3 uSunCol;\n' + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vCol;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { vec3 vd = normalize(vGW - cameraPosition); float bk = pow(max(dot(vd, normalize(uSun)), 0.0), 3.0) * max(uSun.y + 0.05, 0.0);
            totalEmissiveRadiance += vCol * uSunCol * bk * vT * 0.9; }`);
    };
    m.customProgramCacheKey = () => 'grassfield' + k;
    return m;
  }
  update(eye, push, season, camH, camera) {
    this.uni.uCam.value.copy(eye);
    if (camera) { camera.getWorldDirection(this._d || (this._d = new THREE.Vector3())); const l = Math.hypot(this._d.x, this._d.z); if (l > 0.2) this.uni.uFwd.value.set(this._d.x / l, this._d.z / l); else this.uni.uFwd.value.set(0, 0); }
    if (push) this.uni.uPush.value.copy(push); else this.uni.uPush.value.set(0, -999, 0);
    const vis = season < 0.85 && !this.off;
    this.rings[0].mesh.visible = vis && camH < 14;
    this.rings[1].mesh.visible = vis && camH < 32;
    const lq = this.lowQ;
    this.rings[0].mesh.geometry.instanceCount = lq ? 120 * 120 : 176 * 176; this.rings[0].ring.value.y = lq ? 120 : 176;
  }
}
