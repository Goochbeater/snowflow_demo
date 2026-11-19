// Longships: clinker-built procedural hulls, dragon prows, striped torn sails, instanced oars & shields.
import * as THREE from 'three';
import { Builder, M, col } from './builder.js';
import { stdMat, U, GLSL_NOISE } from './materials.js';
import { surfaceMaterial } from './terrainmat.js';
import { LID } from './texgen.js';
import { WU, waveH } from './env.js';
import { RNG, clamp, lerp } from './util.js';

export const HULL = { L: 24, B: 2.65 };
const halfBeam = (u) => HULL.B * Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.55);
const sheerY = (u) => 1.05 + 2.4 * Math.pow(Math.abs(2 * u - 1), 3);
export function hullPoint(u, v) {
  const z = (u - 0.5) * HULL.L;
  const hb = halfBeam(u);
  const x = hb * Math.pow(Math.sin(v * Math.PI / 2), 0.75);
  const keel = -0.75 + Math.pow(Math.abs(2 * u - 1), 4) * 1.6;
  const y = keel + (sheerY(u) - keel) * Math.pow(v, 1.15);
  return [x, y, z];
}

function buildHullGeom(scale = 1, small = false) {
  const B = new Builder(); const rnd = new RNG(7); const c = (h, j = 0.06) => [...col(h, j, () => rnd.next()), LID.plank];
  const K = small ? 4 : 8, NU = small ? 14 : 28;
  for (const s of [-1, 1]) {
    for (let k = 0; k < K; k++) {
      const v0 = k / K, v1 = (k + 1) / K;
      const colr = c(k === K - 1 ? 0x3a2a1c : k % 2 ? 0x4a3524 : 0x3e2c1e, 0.08);
      for (let i = 0; i < NU; i++) {
        const u0 = i / NU, u1 = (i + 1) / NU;
        const P = (u, v, out) => { const p = hullPoint(u, v); return [s * (p[0] + out) * scale, p[1] * scale, p[2] * scale]; };
        const lap = 0.055;
        B.quad(P(u0, v0, lap), P(u1, v0, lap), P(u1, v1, 0), P(u0, v1, 0), colr, s < 0);
        // inside skin (lighter, tarred less)
        B.quad(P(u0, v0, -0.04), P(u0, v1, -0.06), P(u1, v1, -0.06), P(u1, v0, -0.04), c(0x6a4b30, 0.08), s < 0);
      }
    }
    // gunwale rail
    for (let i = 0; i < NU; i++) { const a = hullPoint(i / NU, 1), b = hullPoint((i + 1) / NU, 1); B.pole([s * a[0] * scale, (a[1] + 0.06) * scale, a[2] * scale], [s * b[0] * scale, (b[1] + 0.06) * scale, b[2] * scale], 0.07 * scale, c(0x2a1e14), 'box'); }
  }
  // keel
  B.box(0, -0.78 * scale, 0, 0.22 * scale, 0.2 * scale, HULL.L * 0.86 * scale, 0, c(0x2a1e14));
  // stem & stern posts rising into the dragon head and the coiled tail
  for (const e of [1, -1]) {
    const pts = [];
    const p0 = hullPoint(e > 0 ? 1 : 0, 1);
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([0, (p0[1] + t * (small ? 0.6 : 2.3) - (e < 0 ? Math.max(0, t - 0.7) * 1.5 : 0)) * scale, (p0[2] + e * Math.sin(t * 1.4) * (small ? 0.5 : 1.5)) * scale]); }
    for (let i = 0; i < pts.length - 1; i++) B.pole(pts[i], pts[i + 1], (0.17 - i * 0.008) * scale, c(i % 3 === 0 ? 0x8e2a1e : 0x2a1e14), 'box');
    if (!small) {
      const h = pts[pts.length - 1];
      if (e > 0) { // dragon head
        B.add('box', M(h[0], h[1] + 0.1, h[2] + 0.35, 0, -0.35, 0, 0.42, 0.45, 0.95), c(0x2a1e14));
        B.add('box', M(h[0], h[1] - 0.16, h[2] + 0.55, 0, 0.3, 0, 0.32, 0.14, 0.75), c(0x8e2a1e));
        B.add('cone5', M(h[0], h[1] + 0.5, h[2] + 0.0, 0, -0.9, 0, 0.16, 0.7, 0.16), c(0xb58a36));
        for (const s of [-1, 1]) B.add('sphere', M(h[0] + s * 0.2, h[1] + 0.22, h[2] + 0.55, 0, 0, 0, 0.1, 0.1, 0.1), c(0xd8c040));
      } else { // coiled tail
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 1.6; B.add('box', M(0, h[1] - 0.4 + Math.cos(a) * 0.45, h[2] - 0.4 + Math.sin(a) * 0.45, 0, a, 0, 0.18, 0.2, 0.3), c(0x2a1e14)); }
      }
    }
  }
  // floor, thwarts, mast step, steering oar
  B.box(0, -0.3 * scale, 0, 2.4 * scale, 0.08 * scale, HULL.L * 0.7 * scale, 0, c(0x5c4128, 0.05));
  if (!small) {
    for (let k = 0; k < 15; k++) { const z = -7.6 + k * 1.08; const u = z / HULL.L + 0.5; const hb = halfBeam(u) * 0.9; B.box(0, 0.25, z, hb * 2, 0.08, 0.32, 0, c(0x6a4b30, 0.08)); }
    B.box(0, 0.05, 0.4, 0.6, 0.5, 2.4, 0, c(0x2a1e14));
    B.pole([0, -0.2, 0.4], [0, 11.5, 0.4], 0.17, c(0x5a3e24));
    B.pole([1.9, 1.8, -9.7], [2.3, -1.0, -10.6], 0.08, c(0x3a2a1c)); B.box(2.32, -0.8, -10.6, 0.1, 1.1, 0.5, 0, c(0x3a2a1c));
    // rope coils, sea chests, water cask
    for (let k = 0; k < 4; k++) B.add('torus', M((k % 2 ? 1 : -1) * 0.9, -0.15, -9 + k * 0.6, 0, Math.PI / 2, 0, 0.9, 0.9, 0.6), c(0xa58b5c));
    B.add('barrel', M(0.9, 0.2, 9.6, 0, 0, 0, 0.6, 0.8, 0.6), c(0x7d5a3a));
    // rigging stays
    B.pole([0, 11.3, 0.4], [0, 3.5, 11.6], 0.025, c(0x8a7454)); B.pole([0, 11.3, 0.4], [0, 2.8, -10.8], 0.025, c(0x8a7454));
    for (const s of [-1, 1]) B.pole([0, 10.8, 0.4], [s * 2.5, 1.2, -1.2], 0.02, c(0x8a7454));
  } else {
    for (let k = 0; k < 3; k++) B.box(0, 0.05 * scale, (-2 + k * 2) * scale, 1.6 * scale, 0.06, 0.25, 0, c(0x6a4b30));
  }
  return B.geometry();
}

const sailMat = (stripe, tear) => new THREE.ShaderMaterial({
  uniforms: Object.assign({}, U, WU, { uStripe: { value: stripe }, uTear: { value: tear }, uFurl: { value: 0 }, uFill: { value: 1 } }),
  side: THREE.DoubleSide,
  vertexShader: `uniform float uTime; uniform vec2 uWind; uniform float uFurl; uniform float uFill; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
    void main(){ vUv = uv; vec3 p = position;
      float bil = sin(uv.x * 3.14159) * sin((1.0 - uv.y) * 3.14159 * 0.85 + 0.2) * (1.4 + 0.7*length(uWind)) * uFill;
      bil += sin(uTime * 2.3 + uv.x * 7.0 + uv.y * 5.0) * 0.08 * uFill;
      p.z += bil; p.y = mix(p.y, p.y * 0.08 + 0.3, uFurl);
      vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * vec3(0., 0., 1.));
      gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uStripe; uniform float uTear; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uDark; uniform vec3 uFogCol; uniform float uFogD; uniform float uFurl; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
    ${GLSL_NOISE}
    void main(){
      // torn: ragged holes and a frayed lower edge
      float n = kFbm(vUv * vec2(7.0, 5.0) + uStripe * 3.1);
      if (n > 1.0 - uTear * 0.32 && vUv.y > 0.12) discard;
      if (vUv.y < 0.08 + 0.18 * uTear * kNoise(vec2(vUv.x * 30.0, uStripe))) discard;
      float st = step(0.5, fract(vUv.x * (uStripe < 1.5 ? 3.0 : 4.0)));
      vec3 a = uStripe < 0.5 ? vec3(0.55, 0.08, 0.05) : uStripe < 1.5 ? vec3(0.62, 0.12, 0.06) : uStripe < 2.5 ? vec3(0.08, 0.18, 0.38) : vec3(0.58, 0.42, 0.12);
      vec3 b = vec3(0.86, 0.8, 0.66);
      vec3 c = mix(a, b, st) * (0.85 + 0.3 * kNoise(vUv * 40.0));
      c *= 1.0 - 0.35 * smoothstep(0.6, 1.0, n);
      float l = abs(dot(normalize(vN), uSun));
      vec3 lit = c * (0.25 + 0.75 * l * uSunCol) + c * 0.35 * uSunCol * (1.0 - uDark);
      lit *= 1.0 - uDark * 0.75;
      float fd = length(cameraPosition - vW); lit = mix(lit, uFogCol, clamp(1.0 - exp(-uFogD*uFogD*fd*fd), 0., 1.));
      gl_FragColor = vec4(lit, 1.0);
      #include <colorspace_fragment>
    }`,
});

export class Fleet {
  constructor(scene, S, grid) {
    this.scene = scene; this.grid = grid;
    this.hullGeo = buildHullGeom();
    this.hullMat = surfaceMaterial({ snow: false }, { side: THREE.DoubleSide, roughness: 0.8 });
    this.smallGeo = buildHullGeom(0.3, true);
    this.ships = [];
    const nMax = S.ships.length + 10;
    // shields & oars instanced across every ship
    const shG = new THREE.CylinderGeometry(0.45, 0.45, 0.06, 12); shG.rotateX(Math.PI / 2);
    const boss = new THREE.SphereGeometry(0.12, 6, 4); boss.translate(0, 0, 0.05);
    const merged = mergeTwo(shG, boss);
    this.shields = new THREE.InstancedMesh(merged, stdMat({}, { vertexColors: false, roughness: 0.7 }), nMax * 32);
    this.shields.castShadow = true;
    const oarG = new THREE.CylinderGeometry(0.045, 0.045, 5.6, 5); oarG.translate(0, -2.8, 0);
    const blade = new THREE.BoxGeometry(0.2, 1.0, 0.05); blade.translate(0, -5.3, 0);
    this.oars = new THREE.InstancedMesh(mergeTwo(oarG, blade), stdMat({}, { vertexColors: false, color: 0x8a6a48 }), nMax * 30);
    this.oars.castShadow = true;
    const pal = [0x8e2a1e, 0xd8d0bc, 0x2c4a6e, 0xb58a36, 0x3e5a32, 0x1c1a18, 0x6e2a4a];
    const rnd = new RNG(31);
    const cc = new THREE.Color();
    for (let i = 0; i < nMax * 32; i++) { cc.set(pal[Math.floor(rnd.next() * pal.length)]); this.shields.setColorAt(i, cc); }
    scene.add(this.shields, this.oars);
    for (const sh of S.ships) this.addShip(sh.stripe, sh.tear, false);
    // fleet at anchor (era 3)
    this.anchor = [];
    const anchorPos = [[-150, -60, 0.4], [-120, -110, 0.6], [-60, -150, 0.2], [20, -170, -0.1], [100, -150, -0.3], [160, -100, -0.6], [-200, -20, 0.8], [190, -40, -0.9]];
    for (const [x, z, yaw] of anchorPos) { const s = this.addShip(Math.floor(rnd.next() * 4), 0.0, true); s.ax = x; s.az = z; s.ayaw = yaw; this.anchor.push(s); }
    // small boats (traffic)
    this.boats = [];
    const bm = new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 0.85 });
    for (let i = 0; i < 22; i++) {
      const g = new THREE.Group();
      const hull = new THREE.Mesh(this.smallGeo, this.hullMat); hull.castShadow = true; g.add(hull);
      for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.32), new THREE.MeshStandardMaterial({ color: [0x6a5a40, 0x4a4a52, 0x7a3a2a][k] })); f.position.set(0, 0.45, -1.8 + k * 1.8); g.add(f); }
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4), bm); mast.position.set(0, 2, 0.3); g.add(mast);
      g.userData = { seed: rnd.next() * 1000, kind: i % 3 };
      scene.add(g); this.boats.push(g);
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1);
  }
  addShip(stripe, tear, anchored) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(this.hullGeo, this.hullMat); hull.castShadow = true; hull.receiveShadow = true; g.add(hull);
    const yard = new THREE.Group(); yard.position.set(0, 10.6, 0.6);
    const ym = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 11.5, 6), new THREE.MeshStandardMaterial({ color: 0x5a3e24 })); ym.rotation.z = Math.PI / 2; yard.add(ym);
    const sg = new THREE.PlaneGeometry(10.6, 8.6, 16, 12); sg.translate(0, -4.3, 0.15);
    const sm = sailMat(stripe, tear); const sail = new THREE.Mesh(sg, sm); sail.castShadow = true; yard.add(sail);
    g.add(yard);
    this.scene.add(g);
    const s = { g, yard, sail, sm, anchored, oarPhase: Math.random() * 6 };
    this.ships.push(s);
    return s;
  }
  update(S, alpha, t, P, era, dt) {
    const sea = P.sea, wind = [Math.cos(P.windDir) * (0.4 + P.wind), Math.sin(P.windDir) * (0.4 + P.wind)];
    let si = 0, oi = 0;
    const m = this._m, q = this._q, e = this._e, v = this._v, sc = this._s;
    const wakes = WU.uWake.value; let nw = 0;
    const place = (s, x, z, yaw, beached, beachY) => {
      let y, pitch = 0, roll = 0;
      if (beached) { y = beachY; pitch = -0.06; roll = 0.04; }
      else {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const hb = waveH(x + sy * 9, z + cy * 9, t, sea, wind), hs = waveH(x - sy * 9, z - cy * 9, t, sea, wind);
        const hl = waveH(x - cy * 2.5, z + sy * 2.5, t, sea, wind), hr = waveH(x + cy * 2.5, z - sy * 2.5, t, sea, wind);
        y = (hb + hs + hl + hr) / 4 + P.tide - 0.15; pitch = Math.atan2(hs - hb, 18); roll = Math.atan2(hr - hl, 5);
      }
      s.g.position.set(x, y, z); s.g.rotation.set(0, 0, 0); s.g.rotation.order = 'YXZ'; s.g.rotation.set(pitch, yaw, roll);
      s.g.updateMatrixWorld(true);
      return s.g.matrixWorld;
    };
    const writeRig = (s, mw, oarsOut, sailUp, rowing) => {
      // shields along both rails
      for (let side = -1; side <= 1; side += 2) for (let k = 0; k < 16; k++) {
        const u = 0.2 + k / 15 * 0.6; const p = hullPoint(u, 1);
        v.set(side * (p[0] + 0.05), p[1] - 0.25, p[2]);
        e.set(0, side * Math.PI / 2, 0); q.setFromEuler(e); sc.set(1, 1, 1);
        m.compose(v, q, sc).premultiply(mw); this.shields.setMatrixAt(si++, m);
      }
      // oars biting, or stacked inboard
      for (let side = -1; side <= 1; side += 2) for (let k = 0; k < 14; k++) {
        const z = -7.2 + k * 1.08; const u = z / HULL.L + 0.5; const p = hullPoint(u, 1);
        if (oarsOut > 0.5) {
          const ph = s.oarPhase + k * 0.03;
          const sweep = Math.sin(ph) * 0.45 * (rowing ? 1 : 0.2), dip = Math.cos(ph) * 0.12;
          v.set(side * (p[0] - 0.1), p[1] - 0.4, z);
          e.set(-(0.35 + dip) * 1, sweep * side, side * (1.2 + dip), 'YXZ'); q.setFromEuler(e);
          sc.set(1, 1, 1);
        } else {
          v.set(side * (0.45 + (k % 3) * 0.12), 0.45 + Math.floor(k / 5) * 0.1, -2 + (k % 5) * 0.05);
          e.set(Math.PI / 2, 0, 0, 'YXZ'); q.setFromEuler(e); sc.set(1, 1, 1);
          v.z += 2.8;
        }
        m.compose(v, q, sc).premultiply(mw); this.oars.setMatrixAt(oi++, m);
      }
      // sail and yard
      s.sm.uniforms.uFurl.value = 1 - sailUp;
      s.yard.position.y = lerp(4.2, 10.6, sailUp);
      s.yard.rotation.y = lerp(0, 0.25 * Math.sin(P.windDir), sailUp);
      s.sm.uniforms.uFill.value = 0.35 + P.wind * 0.8;
    };
    for (let i = 0; i < S.ships.length; i++) {
      const sh = S.ships[i], s = this.ships[i];
      s.oarPhase += dt * (sh.oars > 0.5 && sh.state === 0 ? 2.2 : 0);
      let beachY = 0;
      if (sh.state >= 1) { beachY = Math.max(this.grid.get(sh.x, sh.z) + 0.85, P.tide - 0.1) - (sh.state === 1 ? 0.2 : 0); }
      const mw = place(s, sh.x, sh.z, sh.yaw, sh.state >= 1, beachY);
      sh.ry = s.g.position.y; sh.rpitch = s.g.rotation.x; sh.rroll = s.g.rotation.z;
      writeRig(s, mw, sh.oars, sh.sail, sh.state === 0);
      if (sh.state === 0 && nw < 16) wakes[nw++].set(sh.x, sh.z, sh.yaw, clamp(sh.v / 7, 0.3, 1));
    }
    for (const s of this.anchor) {
      const vis = era >= 3; s.g.visible = vis; if (!vis) continue;
      const mw = place(s, s.ax, s.az, s.ayaw + Math.sin(t * 0.05 + s.ax) * 0.08, false, 0);
      writeRig(s, mw, 0, 0, false);
    }
    // traffic: fishing boats and traders crossing the bay and fjord
    const nb = Math.round(P.traffic * this.boats.length);
    for (let i = 0; i < this.boats.length; i++) {
      const b = this.boats[i]; b.visible = i < nb; if (!b.visible) continue;
      const u = b.userData; const T = t * 0.012 + u.seed;
      let x, z, yaw;
      if (u.kind === 0) { const a = T * 0.9 + i; x = Math.sin(a) * 160 + Math.sin(a * 2.1) * 40; z = -180 + Math.cos(a) * 120; yaw = Math.atan2(Math.cos(a) * 160 + Math.cos(a * 2.1) * 84, -Math.sin(a) * 120); }
      else { const f = ((T * 0.15 + i * 0.13) % 1); const dir = u.kind === 1 ? 1 : -1; const zz = -2400 * (dir > 0 ? 1 - f : f) - 100; x = Math.sin(zz * 0.0014) * 120 + (i % 4 - 1.5) * 30; z = zz; yaw = dir > 0 ? 0 : Math.PI; yaw += Math.cos(zz * 0.0014) * 0.15; }
      const y = waveH(x, z, t, sea, wind) + P.tide - 0.1;
      b.position.set(x, y, z); b.rotation.set(Math.sin(t * 1.3 + i) * 0.05 * (0.3 + sea), yaw, Math.sin(t * 1.1 + i * 2) * 0.08 * (0.3 + sea), 'YXZ');
      if (nw < 16 && i % 3 === 0) wakes[nw++].set(x, z, yaw, 0.35);
    }
    WU.uNW.value = nw;
    this.shields.count = si; this.oars.count = oi;
    this.shields.instanceMatrix.needsUpdate = true; this.oars.instanceMatrix.needsUpdate = true;
  }
}
function mergeTwo(a, b) {
  const g = new THREE.BufferGeometry();
  const A = a.toNonIndexed(), Bg = b.toNonIndexed();
  const pa = A.attributes.position.array, pb = Bg.attributes.position.array, na = A.attributes.normal.array, nb = Bg.attributes.normal.array;
  const p = new Float32Array(pa.length + pb.length); p.set(pa); p.set(pb, pa.length);
  const n = new Float32Array(na.length + nb.length); n.set(na); n.set(nb, na.length);
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}
