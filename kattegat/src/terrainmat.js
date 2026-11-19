// Terrain material: per-pixel blend of the procedural material library with height-aware transitions,
// tri-planar granite on cliffs, two-scale anti-tiling, normal mapping, wet shore, textured snow, and a painted
// control map for roads, yards, pens and field strips.
import * as THREE from 'three';
import { stdMat } from './materials.js';
import { LID, LAYERS } from './texgen.js';

export const TU = { tAlb: { value: null }, tNor: { value: null }, uCtrl: { value: null }, uLT: { value: [] } };
// target mean reflectance (linear) per layer; textures are rescaled to these so every material sits right under the same light
export const TARGET = {
  grass: [0.07, 0.1, 0.032], dirt: [0.1, 0.07, 0.04], mud: [0.042, 0.028, 0.016], sand: [0.3, 0.225, 0.125], rock: [0.08, 0.078, 0.076],
  forest: [0.034, 0.032, 0.018], snow: [0.78, 0.82, 0.88], gravel: [0.085, 0.08, 0.07], plank: [0.16, 0.11, 0.065], wattle: [0.24, 0.19, 0.13],
  turf: [0.055, 0.075, 0.028], shingle: [0.1, 0.08, 0.06], stone: [0.12, 0.115, 0.105], tar: [0.03, 0.022, 0.016], crop: [0.34, 0.24, 0.07], thatch: [0.28, 0.2, 0.09],
};
export function calibrate(tex) {
  return LAYERS.map((n, i) => { const m = tex.means[i], t = TARGET[n]; return new THREE.Vector3(t[0] / Math.max(1e-4, m[0]), t[1] / Math.max(1e-4, m[1]), t[2] / Math.max(1e-4, m[2])); });
}

const HEAD = /* glsl */`
precision highp sampler2DArray; uniform sampler2DArray tAlb; uniform sampler2DArray tNor; uniform sampler2D uCtrl; uniform vec3 uLT[16]; varying vec4 vSplat;
vec4 kA; vec4 kNn; vec3 kRockP = vec3(0.0); float kRockT = 0.0; vec2 kGX; vec2 kGY;
// explicit gradients everywhere: the blend skips layers per pixel, so implicit derivatives would be undefined
// height blend: the taller material of the pair wins inside the transition band
float kHB(float h0, float h1, float m) {
  float a0 = h0 + (1.0 - m), a1 = h1 + m, mx = max(a0, a1) - 0.2;
  float b0 = max(a0 - mx, 0.0), b1 = max(a1 - mx, 0.0);
  return mix(b1 / (b0 + b1 + 1e-5), 1.0, smoothstep(0.88, 1.0, m)) * smoothstep(0.0, 0.06, m);
}
float kLay(float L, vec2 P, vec2 s, float m) {
  if (m < 0.004) return 0.0;
  vec2 uv = P / s, gx = kGX / s, gy = kGY / s;
  vec4 a = textureGrad(tAlb, vec3(uv, L), gx, gy), n = textureGrad(tNor, vec3(uv, L), gx, gy); a.rgb *= uLT[int(L + 0.5)];
  float t = kHB(kNn.a, n.a, m); kA = mix(kA, a, t); kNn = mix(kNn, n, t); return t;
}
float kRag(float m, float b) { return clamp(m + b * 0.55 * m * (1.0 - m) * 4.0, 0.0, 1.0); }
// rotated second sample to break up tiling; normals rotated back into world xz
void kLay2(float L, vec2 P, float s1, float s2, float m, float mixv) {
  if (m < 0.004) return;
  const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
  vec2 u1 = P / s1, u2 = R * P / s2 + 0.37, g1x = kGX / s1, g1y = kGY / s1, g2x = R * kGX / s2, g2y = R * kGY / s2;
  vec4 a1 = textureGrad(tAlb, vec3(u1, L), g1x, g1y), a2 = textureGrad(tAlb, vec3(u2, L), g2x, g2y);
  vec4 n1 = textureGrad(tNor, vec3(u1, L), g1x, g1y), n2 = textureGrad(tNor, vec3(u2, L), g2x, g2y);
  n2.xy = ((n2.xy * 2.0 - 1.0) * R) * 0.5 + 0.5;
  vec4 a = mix(a1, a2, mixv), n = mix(n1, n2, mixv); a.rgb *= uLT[int(L + 0.5)];
  float t = kHB(kNn.a, n.a, m); kA = mix(kA, a, t); kNn = mix(kNn, n, t);
}
`;

const SPLAT = /* glsl */`
  {
  vec3 Ng = normalize(kWN);
  vec2 P = kWP.xz; kGX = dFdx(P); kGY = dFdy(P); vec3 kWX = dFdx(kWP), kWY = dFdy(kWP);
  float mac = kFbm(P * 0.018), mac2 = smoothstep(0.3, 0.7, kFbm(P * 0.06 + 7.0)), brk = kNoise(P * 0.9) - 0.5;
  vec2 cuv = (P - uOvBounds.xy) / uOvBounds.zw;
  vec4 ctrl = texture2D(uCtrl, clamp(cuv, 0.0, 1.0)) * step(0.0, cuv.x) * step(0.0, cuv.y) * step(cuv.x, 1.0) * step(cuv.y, 1.0);
  // ragged edges on every painted mask
  float wSand = kRag(vSplat.x, brk), wForest = kRag(vSplat.y, brk), wGravel = kRag(max(vSplat.z, ctrl.a), brk), wHeath = vSplat.w;
  float wDirt = kRag(ctrl.r, brk), wMud = kRag(ctrl.g, brk), crop = ctrl.b;
  // base: meadow, two scales cross-faded by low-frequency noise
  kA = vec4(0.0); kNn = vec4(0.5, 0.5, 1.0, 0.0);
  kLay2(${LID.grass}.0, P, 2.1, 5.3, 1.0, mac2);
  kA.rgb *= mix(vec3(1.0), vec3(1.25, 1.02, 0.66), wHeath * 0.85) * (0.8 + 0.4 * mac);
  kA.rgb *= mix(vec3(1.0), vec3(1.06, 1.0, 0.82), smoothstep(0.55, 0.8, kFbm(P * 0.11 + 3.0)) * 0.7); // drier patches
  kLay2(${LID.forest}.0, P, 2.6, 6.1, wForest, 1.0 - mac2);
  kLay(${LID.sand}.0, P, vec2(3.4), wSand);
  if (crop > 0.02) { // field strips: gold barley (~0.92), green oats (~0.68), ploughed tilth (~0.32)
    float isCrop = smoothstep(0.47, 0.53, crop);
    kLay(${LID.crop}.0, P, vec2(1.9), isCrop);
    kA.rgb = mix(kA.rgb, kA.rgb * vec3(0.55, 0.9, 0.42), isCrop * (1.0 - smoothstep(0.76, 0.84, crop)));
    float till = smoothstep(0.18, 0.3, crop) * (1.0 - isCrop);
    vec4 kAt = kA; kLay(${LID.dirt}.0, P, vec2(2.4, 1.2), till); kA.rgb = mix(kAt.rgb, kA.rgb * vec3(0.66, 0.58, 0.52), till);
  }
  kLay(${LID.dirt}.0, P, vec2(2.8), wDirt);
  kLay(${LID.mud}.0, P, vec2(3.0), wMud);
  kLay(${LID.gravel}.0, P, vec2(1.8), wGravel);
  // cliffs: tri-planar granite with strata and lichen
  float wRock = smoothstep(0.3, 0.44, (1.0 - Ng.y) + (mac - 0.5) * 0.18 + brk * 0.05);
  if (wRock > 0.004) {
    vec3 bw = pow(abs(Ng), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
    float sc = 1.0 / 6.5;
    #define TG(S, SW) textureGrad(S, vec3(kWP.SW * sc, ${LID.rock}.0), kWX.SW * sc, kWY.SW * sc)
    vec4 aX = TG(tAlb, zy), aY = TG(tAlb, xz), aZ = TG(tAlb, xy);
    vec4 nX = TG(tNor, zy), nY = TG(tNor, xz), nZ = TG(tNor, xy);
    vec4 aR = aX * bw.x + aY * bw.y + aZ * bw.z; aR.rgb *= uLT[${LID.rock}];
    float strata = kNoise(vec2(kWP.y * 0.11 + kNoise(P * 0.03) * 5.0, (kWP.x + kWP.z) * 0.015));
    aR.rgb *= (0.82 + 0.3 * strata) * mix(vec3(1.0), vec3(1.08, 1.02, 0.9), kNoise(P * 0.04));
    aR.rgb = mix(aR.rgb, aR.rgb * vec3(0.8, 1.05, 0.7), smoothstep(0.55, 0.85, Ng.y) * 0.5); // lichen on ledges
    vec3 pX = vec3(0.0, nX.y * 2.0 - 1.0, nX.x * 2.0 - 1.0), pY = vec3(nY.x * 2.0 - 1.0, 0.0, nY.y * 2.0 - 1.0), pZ = vec3(nZ.x * 2.0 - 1.0, nZ.y * 2.0 - 1.0, 0.0);
    vec3 pR = pX * bw.x + pY * bw.y + pZ * bw.z; float hR = nX.a * bw.x + nY.a * bw.y + nZ.a * bw.z;
    float t = kHB(kNn.a, hR, wRock);
    kA = mix(kA, aR, t); kRockP = pR; kRockT = t; kNn.a = mix(kNn.a, hR, t);
  }
  // snow: settles on flats first, drifts in hollows, always on the high peaks
  float kSn = uSnow * smoothstep(0.35, 0.8, Ng.y + (kNoise(P * 0.25) - 0.5) * 0.5) * smoothstep(uTide + 1.5, uTide + 5.0, kWP.y);
  kSn = clamp(kSn * (1.0 + smoothstep(120.0, 500.0, kWP.y)), 0.0, 1.0);
  float kPk = smoothstep(380.0, 620.0, kWP.y + kNoise(P * 0.02) * 80.0) * smoothstep(0.4, 0.75, Ng.y);
  float wSnow = max(kSn, kPk);
  if (wSnow > 0.004) {
    kRockT *= 1.0 - kLay(${LID.snow}.0, P, vec2(3.0), wSnow);
  }
  // wet shore: darker, glossier
  float wetB = smoothstep(uTide + 2.0, uTide + 0.15, kWP.y) * smoothstep(uTide - 3.0, uTide - 0.2, kWP.y);
  kA.rgb *= 1.0 - 0.45 * wetB; kA.a = mix(kA.a, 0.22, wetB * 0.85);
  diffuseColor.rgb *= kA.rgb;
  }
`;

export function terrainMaterial(tex) {
  TU.tAlb.value = tex.albedo; TU.tNor.value = tex.normal; TU.uLT.value = calibrate(tex); TU.means = tex.means;
  const m = stdMat({ wet: true }, { roughness: 0.9, envMapIntensity: 0.55 });
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh) => {
    base(sh);
    Object.assign(sh.uniforms, TU);
    sh.vertexShader = 'attribute vec4 aSplat; varying vec4 vSplat;\n' + sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n vSplat = aSplat;');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', HEAD + '\nvoid main() {')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + SPLAT)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = kA.a;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 tn = kNn.xyz * 2.0 - 1.0;
          vec3 pert = mix(vec3(tn.x, 0.0, tn.y), kRockP, kRockT);
          vec3 nW = normalize(normalize(kWN) + pert * 1.1);
          normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
        }`);
  };
  m.customProgramCacheKey = () => 'terrainSplat';
  return m;
}

// Built surfaces: the vertex colour stays the art-directed mean; the material texture adds grain, relief and gloss.
// Mapping is planar in each face's own object-space frame (U along the face's horizontal, V up its slope), so boards
// run along walls, thatch courses follow the eaves, and textures stay glued to moving hulls.
const SCALE = { plank: 1.8, wattle: 1.6, turf: 2.2, shingle: 1.6, stone: 2.0, tar: 1.8, thatch: 1.7 };
export function surfaceMaterial(opts, params) {
  const m = stdMat(opts, params);
  const base = m.onBeforeCompile;
  const inv = LAYERS.map((n, i) => { const mm = TU.means ? TU.means[i] : [1, 1, 1]; return new THREE.Vector3(1 / Math.max(1e-4, mm[0]), 1 / Math.max(1e-4, mm[1]), 1 / Math.max(1e-4, mm[2])); });
  const sc = LAYERS.map((n) => 1 / (SCALE[n] || 2));
  m.onBeforeCompile = (sh) => {
    base(sh);
    Object.assign(sh.uniforms, { tAlb: TU.tAlb, tNor: TU.tNor, uLM: { value: inv }, uLS: { value: sc } });
    sh.vertexShader = 'attribute float aMat; flat varying float vMat; varying vec3 vLP; varying vec3 vLU; varying vec3 vLV; varying vec3 vWU; varying vec3 vWV;\n' + sh.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
      vMat = aMat; vLP = position;
      { vec3 ln = normalize(normal); vLU = abs(ln.y) > 0.93 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), ln)); vLV = cross(ln, vLU);
        mat3 mm = mat3(modelMatrix);
        #ifdef USE_INSTANCING
          mm = mm * mat3(instanceMatrix);
        #endif
        vWU = normalize(mm * vLU); vWV = normalize(mm * vLV); }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', `precision highp sampler2DArray; uniform sampler2DArray tAlb; uniform sampler2DArray tNor; uniform vec3 uLM[16]; uniform float uLS[16];
        flat varying float vMat; varying vec3 vLP; varying vec3 vLU; varying vec3 vLV; varying vec3 vWU; varying vec3 vWV;
        vec4 kSN = vec4(0.5, 0.5, 1.0, 0.5); float kSR = -1.0;
        void main() {`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 kDX = dFdx(vLP), kDY = dFdy(vLP);
        if (vMat > -0.5) {
          int li = int(vMat + 0.5); vec3 U = normalize(vLU), V = normalize(vLV); float k = uLS[li];
          vec2 uv = vec2(dot(vLP, U), dot(vLP, V)) * k, gx = vec2(dot(kDX, U), dot(kDX, V)) * k, gy = vec2(dot(kDY, U), dot(kDY, V)) * k;
          vec4 a = textureGrad(tAlb, vec3(uv, vMat), gx, gy); kSN = textureGrad(tNor, vec3(uv, vMat), gx, gy);
          vec3 det = a.rgb * uLM[li];
          diffuseColor.rgb *= mix(vec3(1.0), det, 0.92) * (0.9 + 0.2 * kNoise(vLP.xz * 0.35 + vLP.y * 0.2));
          kSR = a.a;
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n if (kSR >= 0.0) roughnessFactor = kSR;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (vMat > -0.5) {
          vec3 tn = kSN.xyz * 2.0 - 1.0; vec3 Nf = normalize(kWN);
          vec3 nW = normalize(Nf + (tn.x * normalize(vWU) + tn.y * normalize(vWV)) * 1.0);
          vec3 nv = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
          normal = gl_FrontFacing ? nv : -nv;
        }`);
  };
  m.customProgramCacheKey = () => 'surface' + JSON.stringify(opts);
  return m;
}
