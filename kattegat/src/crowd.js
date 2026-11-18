// Instanced crowd with near/far LOD, procedural poses per action, carried/placed items, livestock and dogs.
import * as THREE from 'three';
import { AN, CA } from './sim.js';
import { patch, U } from './materials.js';
import { Builder, M, col } from './builder.js';
import { hash2, RNG, lerp, clamp } from './util.js';

// geometry with a per-vertex mask: 0 tunic (aTunic), 1 skin (aSkin), 2 hair (aHair), 3 dark leather
function maskedGeo(parts) {
  const pos = [], nor = [], mask = [];
  for (const [g0, m, mk] of parts) {
    const g = g0.toNonIndexed(); g.applyMatrix4(m); g.computeVertexNormals();
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    for (let i = 0; i < g.attributes.position.count; i++) mask.push(mk);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aMask', new THREE.Float32BufferAttribute(mask, 1));
  return g;
}
const T = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(sx, sy, sz));

function bodyGeo(female) {
  const parts = [];
  parts.push([new THREE.CylinderGeometry(0.17, 0.23, 0.62, 7), T(0, 1.27, 0), 0]); // torso
  parts.push([new THREE.CylinderGeometry(0.24, female ? 0.38 : 0.3, female ? 0.98 : 0.36, 8), T(0, female ? 0.52 : 0.86, 0), 0]); // skirt / tunic hem
  parts.push([new THREE.CylinderGeometry(0.235, 0.235, 0.07, 8), T(0, 1.02, 0), 3]); // belt
  parts.push([new THREE.CylinderGeometry(0.06, 0.07, 0.1, 6), T(0, 1.61, 0), 1]); // neck
  parts.push([new THREE.IcosahedronGeometry(0.125, 1), T(0, 1.73, 0.01, 1, 1.12, 1), 1]); // head
  parts.push([new THREE.SphereGeometry(0.135, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), T(0, 1.75, -0.015), 2]); // hair cap
  if (female) parts.push([new THREE.CylinderGeometry(0.05, 0.03, 0.36, 5), T(0, 1.55, -0.12, 1, 1, 1, 0.25), 2]); // braid
  else parts.push([new THREE.ConeGeometry(0.09, 0.2, 6), T(0, 1.6, 0.09, 1, 1, 1, Math.PI + 0.25), 2]); // beard
  parts.push([new THREE.BoxGeometry(0.44, 0.12, 0.26), T(0, 1.52, 0), 0]); // shoulders
  return maskedGeo(parts);
}
function legGeo() { return maskedGeo([[new THREE.BoxGeometry(0.13, 0.7, 0.15), T(0, -0.35, 0), 0], [new THREE.BoxGeometry(0.14, 0.12, 0.26), T(0, -0.76, 0.05), 3]]); }
function armGeo() { return maskedGeo([[new THREE.BoxGeometry(0.1, 0.52, 0.11), T(0, -0.26, 0), 0], [new THREE.BoxGeometry(0.09, 0.12, 0.1), T(0, -0.58, 0), 1]]); }
function helmGeo() { return maskedGeo([[new THREE.ConeGeometry(0.15, 0.2, 8), T(0, 1.87, 0), 0], [new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8), T(0, 1.79, 0), 3], [new THREE.BoxGeometry(0.03, 0.12, 0.04), T(0, 1.72, 0.13), 0]]); }
function hoodGeo() { return maskedGeo([[new THREE.SphereGeometry(0.155, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), T(0, 1.74, -0.02, 1, 1.15, 1.05), 0], [new THREE.ConeGeometry(0.2, 0.25, 8), T(0, 1.55, -0.02), 0]]); }
function farGeo() { return maskedGeo([[new THREE.BoxGeometry(0.42, 0.95, 0.3), T(0, 1.1, 0), 0], [new THREE.BoxGeometry(0.3, 0.75, 0.24), T(0, 0.38, 0), 3], [new THREE.BoxGeometry(0.22, 0.24, 0.22), T(0, 1.72, 0), 1], [new THREE.BoxGeometry(0.24, 0.08, 0.24), T(0, 1.86, 0), 2]]); }

function crowdMaterial() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  patch(m, { snow: false });
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh) => {
    base(sh);
    sh.vertexShader = sh.vertexShader.replace('void main() {', `attribute float aMask; attribute vec3 aTunic; attribute vec3 aSkin; attribute vec3 aHair; varying vec3 vCC;\nvoid main() {\n vCC = aMask < 0.5 ? aTunic : aMask < 1.5 ? aSkin : aMask < 2.5 ? aHair : vec3(0.07, 0.05, 0.04);`);
    sh.fragmentShader = 'varying vec3 vCC;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vCC;');
  };
  m.customProgramCacheKey = () => 'crowd';
  return m;
}

const TUNIC = {
  thrall: [0x7a6e5c, 0x6a5e4c, 0x857a66, 0x5e574a], karl: [0x6b4a2e, 0x4d5a34, 0x3d4e66, 0x7a3a26, 0x5a4636, 0x8a6a3a], housecarl: [0x7c1e18, 0x23365e, 0x5a1414],
  jarl: [0x6a0f12], lady: [0x1f3a6a], wife: [0x2e4a6e, 0x6a2a2a, 0x4e6a3a, 0x8a6a2a, 0x5a3a5a, 0x7a5a3a], child: [0x8a7a5a, 0x6a5a3a, 0x5a6a4a, 0x7a4a3a],
  elder: [0x5a5048, 0x4a4038], seer: [0x1a1a24], skald: [0x4a2a5a], gothi: [0x6a1a12], lawspeaker: [0x2a2a3a], healer: [0x5a6a4a], shieldmaiden: [0x3a4a5a, 0x5a2a20],
};
const HAIR = [0xd8c08a, 0xb8945a, 0x8a5a2a, 0x5a3a1e, 0x2a1e14, 0xa04a1e, 0xc8a060];
const SKIN = [0xe0b394, 0xd8a888, 0xcf9c7c, 0xe8c0a0, 0xc89070];

export class Crowd {
  constructor(scene, S, grid, sim) {
    this.scene = scene; this.grid = grid; this.sim = sim;
    const N = S.agents.length; this.N = N;
    const mat = crowdMaterial(); this.mat = mat;
    const mk = (geo, count, shadow = true) => { const m = new THREE.InstancedMesh(geo, mat, count); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = shadow; m.frustumCulled = false; scene.add(m); return m; };
    this.bodyM = mk(bodyGeo(false), N); this.bodyF = mk(bodyGeo(true), N);
    this.legs = mk(legGeo(), N * 2); this.arms = mk(armGeo(), N * 2);
    this.helm = mk(helmGeo(), N); this.hood = mk(hoodGeo(), N);
    this.far = mk(farGeo(), N, false);
    // per-agent colours
    const rnd = new RNG(S.seed + 5);
    const cc = new THREE.Color();
    const arr = (n) => new Float32Array(n * 3);
    const tun = arr(N), skin = arr(N), hair = arr(N), leg = arr(N * 2), arm = arr(N * 2), hat = arr(N), sk2 = arr(N * 2), hr2 = arr(N * 2);
    this.look = [];
    for (const a of S.agents) {
      const pal = TUNIC[a.role] || (a.female ? TUNIC.wife : TUNIC.karl);
      cc.set(pal[Math.floor(rnd.next() * pal.length)]); const k = 0.85 + rnd.next() * 0.3; const t = [cc.r * k, cc.g * k, cc.b * k];
      cc.set(SKIN[Math.floor(rnd.next() * SKIN.length)]); const s = [cc.r, cc.g, cc.b];
      cc.set(a.age > 58 ? 0xb0aaa0 : HAIR[Math.floor(rnd.next() * HAIR.length)]); const h = [cc.r, cc.g, cc.b];
      cc.set(a.female ? pal[0] : [0x4a3e30, 0x5a4a3a, 0x3a3a40, 0x6a5a40][Math.floor(rnd.next() * 4)]); const l = [cc.r * 0.8, cc.g * 0.8, cc.b * 0.8];
      const helmet = a.role === 'housecarl' || a.fate !== 'home' && !a.female;
      const hood = !helmet && (a.role === 'thrall' || a.female && rnd.next() < 0.6 || a.role === 'seer' || a.role === 'elder' && rnd.next() < 0.5);
      cc.set(helmet ? 0x6a6a6e : a.female ? [0xd8d0bc, 0x8a2a1e, 0x3a5a7a, 0xb59a5a][Math.floor(rnd.next() * 4)] : 0x6a5a48);
      const hc = [cc.r, cc.g, cc.b];
      const i = a.id;
      tun.set(t, i * 3); skin.set(s, i * 3); hair.set(h, i * 3); hat.set(hc, i * 3);
      for (const j of [0, 1]) { leg.set(l, (i * 2 + j) * 3); arm.set(t, (i * 2 + j) * 3); sk2.set(s, (i * 2 + j) * 3); hr2.set(h, (i * 2 + j) * 3); }
      const scale = a.age < 15 ? 0.52 + a.age * 0.03 : a.female ? 0.94 : 1.0 + (a.strength - 0.5) * 0.08;
      this.look.push({ scale, helmet, hood, shield: a.fate !== 'home' || a.role === 'housecarl', yaw: 0, phase: rnd.next() * 10, dist: 0 });
    }
    const set = (m, t, s, h) => { m.geometry.setAttribute('aTunic', new THREE.InstancedBufferAttribute(t, 3)); m.geometry.setAttribute('aSkin', new THREE.InstancedBufferAttribute(s, 3)); m.geometry.setAttribute('aHair', new THREE.InstancedBufferAttribute(h, 3)); };
    set(this.bodyM, tun, skin, hair); set(this.bodyF, tun, skin, hair); set(this.far, tun, skin, hair);
    set(this.legs, leg, sk2, hr2); set(this.arms, arm, sk2, hr2); set(this.helm, hat, skin, hat); set(this.hood, hat, skin, hat);
    // shields on backs
    const sg = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12); sg.rotateX(Math.PI / 2);
    this.backShield = new THREE.InstancedMesh(sg, patch(new THREE.MeshStandardMaterial({ roughness: 0.7 })), N); this.backShield.frustumCulled = false; this.backShield.castShadow = true;
    const pal = [0x8e2a1e, 0xd8d0bc, 0x2c4a6e, 0xb58a36, 0x3e5a32, 0x1c1a18];
    for (let i = 0; i < N; i++) { cc.set(pal[Math.floor(rnd.next() * pal.length)]); this.backShield.setColorAt(i, cc); }
    scene.add(this.backShield);
    this.items = new ItemRenderer(scene, S);
    this.animals = new Animals(scene, grid, S);
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.heldTorches = [];
    this.near = 150;
  }
  // fast compose: R = Ry(yaw) Rx(pitch) Rz(roll), uniform scale s
  static setM(arr, i, x, y, z, yaw, pitch, roll, s) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const o = i * 16;
    arr[o] = (cy * cr + sy * sp * sr) * s; arr[o + 1] = cp * sr * s; arr[o + 2] = (-sy * cr + cy * sp * sr) * s; arr[o + 3] = 0;
    arr[o + 4] = (-cy * sr + sy * sp * cr) * s; arr[o + 5] = cp * cr * s; arr[o + 6] = (sy * sr + cy * sp * cr) * s; arr[o + 7] = 0;
    arr[o + 8] = sy * cp * s; arr[o + 9] = -sp * s; arr[o + 10] = cy * cp * s; arr[o + 11] = 0;
    arr[o + 12] = x; arr[o + 13] = y; arr[o + 14] = z; arr[o + 15] = 1;
  }
  static zeroM(arr, i) { const o = i * 16; for (let k = 0; k < 16; k++) arr[o + k] = 0; }
  pose(a, L, t) {
    // returns pose parameters for an action/animation code
    const ph = L.phase, P = this._p || (this._p = {});
    P.lean = 0; P.roll = 0; P.dy = 0; P.lL = 0; P.lR = 0; P.aL = 0.05; P.aR = 0.05; P.rL = 0.08; P.rR = -0.08; P.spin = 0; P.hold = 0;
    const sw = Math.sin(ph);
    switch (a.anim) {
      case AN.walk: case AN.carry: case AN.stumble: case AN.limp:
        P.lL = sw * 0.55; P.lR = -sw * 0.55; P.aL = -sw * 0.45; P.aR = sw * 0.45; P.dy = Math.abs(Math.cos(ph)) * 0.04;
        if (a.anim === AN.carry) { P.aL = P.aR = -1.05; P.rL = 0.25; P.rR = -0.25; P.lean = -0.05; }
        if (a.anim === AN.stumble) { P.roll = Math.sin(ph * 0.5) * 0.18; P.lean = 0.1; P.aL = -0.6 + sw * 0.4; }
        if (a.anim === AN.limp) { P.lR *= 0.3; P.lean = 0.2; P.roll = Math.sin(ph) * 0.1; P.aL = -0.8; }
        break;
      case AN.run: P.lL = sw * 1.0; P.lR = -sw * 1.0; P.aL = -sw * 0.9; P.aR = sw * 0.9; P.lean = 0.22; P.dy = Math.abs(Math.cos(ph)) * 0.1; break;
      case AN.hammer: { const k = Math.max(0, Math.sin(t * 5 + L.phase0)); P.aR = -2.3 + k * 1.9; P.aL = -0.9; P.lean = 0.25; P.lL = 0.2; P.lR = -0.15; break; }
      case AN.drink: P.aR = -2.3; P.rR = -0.5; P.lean = -0.18; P.aL = -0.3; P.hold = 1; break;
      case AN.cheer: P.aL = -2.75 + Math.sin(t * 7 + L.phase0) * 0.2; P.aR = -2.75 + Math.cos(t * 7 + L.phase0) * 0.2; P.rL = 0.35; P.rR = -0.35; P.dy = Math.max(0, Math.sin(t * 7 + L.phase0)) * 0.08; break;
      case AN.wrestle: P.lean = 0.55 + Math.sin(t * 2 + L.phase0) * 0.12; P.aL = P.aR = -1.45; P.rL = -0.35; P.rR = 0.35; P.lL = 0.45; P.lR = -0.35; break;
      case AN.sit: P.dy = -0.43; P.lL = P.lR = -1.45; P.aL = P.aR = -0.5; break;
      case AN.lie: P.lean = -1.52; P.dy = 0.14; P.aL = -0.2; P.aR = 0.25; P.rL = 0.5; P.rR = -0.5; break;
      case AN.kneel: P.dy = -0.4; P.lL = -1.5; P.lR = -1.2; P.lean = 0.38; P.aL = P.aR = -0.4; break;
      case AN.argue: P.aR = -1.6 + Math.sin(t * 4 + L.phase0) * 0.7; P.aL = -0.9 + Math.cos(t * 3.3 + L.phase0) * 0.6; P.lean = 0.15 + Math.sin(t * 2) * 0.05; break;
      case AN.haul: P.lean = -0.42; P.aL = P.aR = -1.35; P.rL = 0.15; P.rR = -0.15; P.lL = 0.45; P.lR = -0.4; P.dy = -0.06; break;
      case AN.dance: P.dy = Math.abs(Math.sin(t * 5 + L.phase0)) * 0.18; P.aL = -2.1 + Math.sin(t * 5 + L.phase0) * 0.5; P.aR = -2.1 - Math.sin(t * 5 + L.phase0) * 0.5; P.rL = 0.6; P.rR = -0.6; P.lL = Math.sin(t * 5 + L.phase0) * 0.5; P.lR = -P.lL; break;
      case AN.spar: { const k = Math.sin(t * 6 + L.phase0); P.aR = -1.5 + k * 1.0; P.aL = -0.9; P.lean = 0.2; P.lL = 0.35; P.lR = -0.3; P.spin = Math.sin(t * 1.5 + L.phase0) * 0.3; break; }
      case AN.row: { const k = Math.sin(L.phase); P.dy = -0.43; P.lL = P.lR = -1.3; P.lean = k * 0.38; P.aL = P.aR = -1.35 + k * 0.35; break; }
      case AN.slump: P.dy = -0.5; P.lL = P.lR = -1.4; P.lean = -0.45; P.aL = 0.1; P.aR = -0.3; P.roll = 0.15; break;
      case AN.music: P.aL = -1.2; P.aR = -1.0 + Math.sin(t * 6) * 0.2; P.rR = -0.4; P.rL = 0.4; P.lean = -0.05; break;
      case AN.speak: P.aR = -1.3 + Math.sin(t * 2.4 + L.phase0) * 0.5; P.aL = -0.2; break;
      case AN.embrace: P.aL = P.aR = -1.35; P.rL = -0.55; P.rR = 0.55; P.lean = 0.2; break;
      case AN.weave: P.aL = P.aR = -1.15 + Math.sin(t * 3 + L.phase0) * 0.15; P.rL = 0.2 + Math.sin(t * 1.3) * 0.2; P.rR = -0.2; break;
      case AN.point: P.aR = -1.65; P.rR = -0.1; break;
      case AN.mourn: P.lean = 0.28; P.aL = -0.45; P.aR = -0.45; P.rL = -0.3; P.rR = 0.3; break;
      default: P.aL = 0.05 + Math.sin(t * 0.8 + L.phase0) * 0.03; P.aR = 0.05; break;
    }
    if (a.carry && a.anim !== AN.drink && a.anim !== AN.sit && a.anim !== AN.lie) {
      if (a.carry === CA.torch || a.carry === CA.horn && a.anim !== AN.cheer) { P.aR = -2.0; P.rR = -0.2; }
      else if (a.carry === CA.body) { P.aL = P.aR = -2.9; P.rL = 0.2; P.rR = -0.2; P.lean = 0.12; }
      else if (a.carry === CA.stick) { /* spar handles */ }
      else if (a.carry === CA.log || a.carry === CA.bench || a.carry === CA.table) { P.aL = P.aR = -2.7; P.rL = 0.2; P.rR = -0.2; }
      else if (a.anim === AN.walk || a.anim === AN.run || a.anim === AN.idle) { P.aL = P.aR = -1.05; P.rL = 0.3; P.rR = -0.3; }
    }
    return P;
  }
  update(S, alpha, t, dt, camera, P, fleet, overlayAgent) {
    const N = this.N, A = S.agents;
    const bM = this.bodyM.instanceMatrix.array, bF = this.bodyF.instanceMatrix.array, lg = this.legs.instanceMatrix.array, am = this.arms.instanceMatrix.array;
    const hm = this.helm.instanceMatrix.array, hd = this.hood.instanceMatrix.array, fr = this.far.instanceMatrix.array, bs = this.backShield.instanceMatrix.array;
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const setM = Crowd.setM, zeroM = Crowd.zeroM;
    const items = this.items; items.begin();
    this.heldTorches.length = 0;
    const near2 = this.near * this.near;
    const shipMat = new THREE.Matrix4(); const tmpV = new THREE.Vector3();
    this.rendered = 0;
    for (let i = 0; i < N; i++) {
      const a = A[i], L = this.look[i];
      let hidden = !a.alive || a.inside || a.dens > P.density;
      if (hidden) { zeroM(bM, i); zeroM(bF, i); zeroM(lg, i * 2); zeroM(lg, i * 2 + 1); zeroM(am, i * 2); zeroM(am, i * 2 + 1); zeroM(hm, i); zeroM(hd, i); zeroM(fr, i); zeroM(bs, i); L.vis = false; continue; }
      let x, y, z, yaw;
      if (a.aboard) {
        const sh = S.ships[a.ship], fs = fleet.ships[a.ship];
        const [lx, lz] = this.sim.seatOf(sh, a);
        tmpV.set(lx, a.anim === AN.row || a.anim === AN.slump ? 0.62 : 0.1, lz).applyMatrix4(fs.g.matrixWorld);
        x = tmpV.x; y = tmpV.y; z = tmpV.z; yaw = sh.yaw + (a.anim === AN.row ? Math.PI : 0);
        L.yaw = yaw;
      } else {
        x = lerp(a.px, a.x, alpha); z = lerp(a.pz, a.z, alpha);
        y = !isNaN(a.ey) ? a.ey : this.grid.get(x, z);
        const ty = Math.atan2(a.fx, a.fz);
        let d = ty - L.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        L.yaw += d * Math.min(1, dt * 8);
        yaw = L.yaw;
        const mv = Math.hypot(a.x - (L.lx ?? a.x), a.z - (L.lz ?? a.z)); L.lx = a.x; L.lz = a.z;
        // gait phase advances with distance moved
        L.dist += Math.hypot(x - (L.rx ?? x), z - (L.rz ?? z)); L.rx = x; L.rz = z;
      }
      L.phase0 = L.phase0 ?? hash2(i, 1) * 6.28;
      L.phase = a.anim === AN.row ? fleet.ships[a.ship].oarPhase : L.dist * (a.anim === AN.run ? 2.3 : 3.6) / L.scale;
      L.wx = x; L.wy = y; L.wz = z; L.vis = true;
      const d2 = (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2;
      const s = L.scale;
      this.rendered++;
      if (d2 > near2) {
        // far impostor
        zeroM(bM, i); zeroM(bF, i); zeroM(lg, i * 2); zeroM(lg, i * 2 + 1); zeroM(am, i * 2); zeroM(am, i * 2 + 1); zeroM(hm, i); zeroM(hd, i); zeroM(bs, i);
        const bob = a.moving ? Math.abs(Math.sin(L.phase)) * 0.06 : 0;
        const lie = a.anim === AN.lie ? -1.5 : 0, low = a.anim === AN.sit || a.anim === AN.row || a.anim === AN.kneel || a.anim === AN.slump ? -0.4 : 0;
        setM(fr, i, x, y + bob + low + (lie ? 0.15 : 0), z, yaw, lie, 0, s);
        if (a.carry || a.item >= 0) items.held(a, x, y + (1.05 + low) * s, z, yaw, s, 0);
        continue;
      }
      zeroM(fr, i);
      const p = this.pose(a, L, t);
      const by = y + p.dy * s;
      const yw = yaw + p.spin;
      const body = a.female ? bF : bM; zeroM(a.female ? bM : bF, i);
      setM(body, i, x, by, z, yw, p.lean, p.roll, s);
      // pivots in body frame: hips at 0.8, shoulders at 1.5
      const cyw = Math.cos(yw), syw = Math.sin(yw), cl = Math.cos(p.lean), sl = Math.sin(p.lean);
      const piv = (lx, ly, lz) => { const yy = ly * cl - lz * sl, zz = ly * sl + lz * cl; return [x + (cyw * lx + syw * zz) * s, by + yy * s, z + (-syw * lx + cyw * zz) * s]; };
      let q = piv(-0.1, 0.8, 0); setM(lg, i * 2, q[0], q[1], q[2], yw, p.lean + p.lL, p.roll, s);
      q = piv(0.1, 0.8, 0); setM(lg, i * 2 + 1, q[0], q[1], q[2], yw, p.lean + p.lR, p.roll, s);
      q = piv(-0.25, 1.5, 0); setM(am, i * 2, q[0], q[1], q[2], yw, p.lean + p.aL, p.roll + p.rL, s);
      const hand = piv(0.25, 1.5, 0); setM(am, i * 2 + 1, hand[0], hand[1], hand[2], yw, p.lean + p.aR, p.roll + p.rR, s);
      if (L.helmet) { setM(hm, i, x, by, z, yw, p.lean, p.roll, s); zeroM(hd, i); } else if (L.hood) { setM(hd, i, x, by, z, yw, p.lean, p.roll, s); zeroM(hm, i); } else { zeroM(hm, i); zeroM(hd, i); }
      if (L.shield && !a.aboard && !a.carry && a.anim !== AN.lie && a.anim !== AN.sit && a.anim !== AN.wrestle) { q = piv(0, 1.25, -0.24); setM(bs, i, q[0], q[1], q[2], yw, p.lean, p.roll, s); } else zeroM(bs, i);
      // hand position for held items: end of the right arm
      const aP = p.lean + p.aR;
      const hx = hand[0] + Math.sin(yw) * Math.sin(-aP) * 0.6 * s * 1, hy = hand[1] - Math.cos(aP) * 0.6 * s, hz = hand[2] + Math.cos(yw) * Math.sin(-aP) * 0.6 * s;
      if (a.carry || a.item >= 0) {
        const chest = piv(0, a.carry === CA.body || a.carry === CA.log || a.carry === CA.bench || a.carry === CA.table ? 1.95 : 1.15, 0.42);
        const kind = a.carry || (a.item >= 0 ? S.items[a.item].ck : 0);
        const hold = kind === CA.torch || kind === CA.horn || kind === CA.stick || kind === CA.bucket || kind === CA.fish;
        if (hold) items.held(a, hx, hy, hz, yw, s, 1, kind, aP);
        else items.held(a, chest[0], chest[1], chest[2], yw, s, 0, kind);
        if (kind === CA.torch) this.heldTorches.push([hx, hy + 0.55 * s, hz]);
      }
    }
    for (const m of [this.bodyM, this.bodyF, this.legs, this.arms, this.helm, this.hood, this.far, this.backShield]) m.instanceMatrix.needsUpdate = true;
    items.world(S, fleet, this.grid);
    items.end();
    this.animals.update(S, alpha, t, P, this.grid, camera);
  }
}

// --------------------------------------------------------------------- items
class ItemRenderer {
  constructor(scene, S) {
    const N = S.agents.length;
    const kinds = {};
    const B = (fn) => { const b = new Builder(); fn(b); return b.geometry(); };
    const c = (h) => col(h);
    kinds[CA.chest] = B((b) => { b.box(0, 0.25, 0, 0.9, 0.5, 0.55, 0, c(0x5a3a1e)); b.box(0, 0.25, 0, 0.94, 0.08, 0.58, 0, c(0x2a2a2a)); b.box(0, 0.53, 0, 0.92, 0.1, 0.57, 0, c(0x6a4a2a)); b.box(0, 0.4, 0.29, 0.12, 0.14, 0.04, 0, c(0xc8a040)); });
    kinds[CA.sack] = B((b) => { b.add('sphere', M(0, 0.3, 0, 0, 0, 0, 0.6, 0.7, 0.5), c(0xa08a62)); b.add('cone', M(0, 0.7, 0, 0, 0, 0, 0.18, 0.25, 0.18), c(0x8a7452)); });
    kinds[CA.cask] = B((b) => { b.add('barrel', M(0, 0.4, 0, 0, 0, Math.PI / 2, 0.6, 0.8, 0.6), c(0x7d5a3a)); });
    kinds[CA.cloth] = B((b) => { b.box(0, 0.12, 0, 1.2, 0.22, 0.4, 0, c(0x7a1e3a)); b.box(0.2, 0.25, 0, 1.0, 0.06, 0.38, 0, c(0xc8a040)); });
    kinds[CA.weapons] = B((b) => { for (let k = 0; k < 5; k++) b.box((k - 2) * 0.08, 0.06, 0, 0.06, 0.06, 1.3, 0, c(0x9a9ca0)); b.box(0, 0.1, 0.4, 0.5, 0.06, 0.08, 0, c(0x6a4a2a)); });
    kinds[CA.plate] = B((b) => { b.add('disc', M(0, 0.03, 0, 0, 0, 0, 0.7, 0.04, 0.7), c(0xd8b040)); b.add('cyl', M(0.15, 0.2, 0, 0, 0, 0, 0.18, 0.3, 0.18), c(0xe8c050)); b.add('cone', M(0.15, 0.08, 0, 0, 0, 0, 0.26, 0.12, 0.26), c(0xe8c050)); });
    kinds[CA.body] = B((b) => { b.box(0, 0.16, 0, 0.5, 0.3, 1.8, 0, c(0xcfc6b0)); b.box(0, 0.2, 0, 0.52, 0.12, 1.4, 0, c(0x3a3a4a)); b.add('disc', M(0, 0.35, 0.1, 0, Math.PI / 2, 0, 0.6, 0.05, 0.6), c(0x8e2a1e)); });
    kinds[CA.bench] = B((b) => { b.box(0, 0.45, 0, 2.6, 0.1, 0.38, 0, c(0x7d5a3a)); for (const s of [-1, 1]) b.box(s * 1.1, 0.22, 0, 0.1, 0.45, 0.34, 0, c(0x5a3e24)); });
    kinds[CA.table] = B((b) => { b.box(0, 0.78, 0, 2.8, 0.1, 0.9, 0, c(0x8a6a48)); for (const s of [-1, 1]) b.box(s * 1.1, 0.38, 0, 0.12, 0.76, 0.7, 0, c(0x5a3e24)); for (let k = 0; k < 5; k++) b.add('cyl', M(-1 + k * 0.5, 0.88, (k % 2) * 0.2 - 0.1, 0, 0, 0, 0.22, 0.1, 0.22), c(k % 2 ? 0x8a6a48 : 0xb0a080)); b.add('sphere', M(0.6, 0.92, 0, 0, 0, 0, 0.5, 0.25, 0.35), c(0x8a4a20)); });
    kinds[CA.barrel] = B((b) => { b.add('barrel', M(0, 0.5, 0, 0, 0, 0, 0.75, 1.0, 0.75), c(0x7d5a3a)); b.add('cyl', M(0, 0.15, 0, 0, 0, 0, 0.82, 0.06, 0.82), c(0x2a2a2a)); b.add('cyl', M(0, 0.85, 0, 0, 0, 0, 0.82, 0.06, 0.82), c(0x2a2a2a)); });
    kinds[CA.cauldron] = B((b) => { b.add('hemi', M(0, 0.7, 0, 0, Math.PI, 0, 1.3, 0.9, 1.3), c(0x1c1c1c)); b.add('disc', M(0, 0.68, 0, 0, 0, 0, 1.2, 0.02, 1.2), c(0x6a3a14)); for (let k = 0; k < 3; k++) { const a = k * 2.09; b.pole([Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1], [0, 2.2, 0], 0.04, c(0x3a2a1c)); } });
    kinds[CA.log] = B((b) => { for (let k = 0; k < 3; k++) b.add('cyl', M((k - 1) * 0.2, k === 1 ? 0.15 : 0, 0, 0, 0, Math.PI / 2, 0.2, 1.6, 0.2), c(0x6b4c30)); });
    kinds[CA.bucket] = B((b) => { b.add('cyl', M(0, -0.18, 0, 0, 0, 0, 0.3, 0.3, 0.3), c(0x7d5a3a)); b.add('disc', M(0, -0.04, 0, 0, 0, 0, 0.27, 0.01, 0.27), c(0x3a5a6a)); });
    kinds[CA.fish] = B((b) => { for (let k = 0; k < 4; k++) b.box((k - 1.5) * 0.08, -0.3, 0, 0.06, 0.45, 0.12, 0, c(0xb8b8a8)); });
    kinds[CA.horn] = B((b) => { b.add('cone', M(0, 0.05, 0.08, 0, -1.2, 0, 0.09, 0.32, 0.09), c(0xd8c8a0)); });
    kinds[CA.torch] = B((b) => { b.add('cyl', M(0, 0.15, 0, 0, 0, 0, 0.06, 0.8, 0.06), c(0x5a3e24)); b.add('cyl', M(0, 0.55, 0, 0, 0, 0, 0.12, 0.2, 0.12), c(0x1a1410)); });
    kinds[CA.stick] = B((b) => { b.add('box', M(0, -0.05, 0.3, 0, 1.2, 0, 0.05, 0.8, 0.05), c(0x8a6a48)); b.box(0, -0.05, 0.05, 0.2, 0.04, 0.04, 0, c(0x5a3e24)); });
    kinds[CA.net] = B((b) => { b.add('sphere', M(0, 0, 0, 0, 0, 0, 0.6, 0.35, 0.4), c(0x4a4436)); });
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05 }));
    this.meshes = {}; this.counts = {};
    for (const k in kinds) {
      const m = new THREE.InstancedMesh(kinds[k], mat, N + 60); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = true; m.count = 0;
      scene.add(m); this.meshes[k] = m;
    }
    this.pyreLogs = new THREE.InstancedMesh(kinds[CA.log], mat, 140); this.pyreLogs.castShadow = true; this.pyreLogs.frustumCulled = false; scene.add(this.pyreLogs);
    this.fireLogs = new THREE.InstancedMesh(kinds[CA.log], mat, 200); this.fireLogs.frustumCulled = false; scene.add(this.fireLogs);
  }
  begin() { for (const k in this.meshes) this.counts[k] = 0; }
  put(kind, x, y, z, yaw, s = 1, pitch = 0, roll = 0) {
    const m = this.meshes[kind]; if (!m) return;
    const i = this.counts[kind]++; if (i >= m.instanceMatrix.count) return;
    Crowd.setM(m.instanceMatrix.array, i, x, y, z, yaw, pitch, roll, s);
  }
  held(a, x, y, z, yaw, s, hand, kind = a.carry, aP = 0) {
    if (!kind) return;
    if (kind === CA.body || kind === CA.log || kind === CA.bench || kind === CA.table) this.put(kind, x, y - 0.05, z, yaw + Math.PI / 2, s, 0, 0);
    else if (hand) this.put(kind, x, y, z, yaw, s, aP + Math.PI, 0);
    else this.put(kind, x, y - 0.2 * s, z, yaw, s * 0.9);
  }
  world(S, fleet, grid) {
    for (const it of S.items) {
      if (it.carrier >= 0 && it.state === 'carried') continue;
      if (it.state === 'home') continue;
      if (it.state === 'ship') {
        const fs = fleet.ships[it.ship]; const v = new THREE.Vector3(((it.k % 3) - 1) * 0.65, -0.05 + Math.floor(it.k / 9) * 0.3, -5.5 + Math.floor((it.k % 9) / 3) * 1.4 + (it.kind === 'body' ? 3.5 : 0)).applyMatrix4(fs.g.matrixWorld);
        this.put(it.ck, v.x, v.y, v.z, S.ships[it.ship].yaw + (it.kind === 'body' ? 0 : it.k), 1, fs.g.rotation.x, fs.g.rotation.z);
      } else if (it.state === 'pyre') {
        const py = this._pyre; if (!py) continue;
        const ang = it.id * 2.4; this.put(it.ck, py[0] + Math.cos(ang) * 1.2, py[1] + Math.min(S.pyre.logs, S.pyre.target) / S.pyre.target * 2.2 + 0.35, py[2] + Math.sin(ang) * 0.8, ang * 0.2);
      } else if (it.state === 'placed') {
        this.put(it.ck, it.x, grid.get(it.x, it.z), it.z, it.ck === CA.barrel || it.ck === CA.cauldron ? it.id : 0);
      } else if (it.state === 'hall') {
        this.put(it.ck, it.x, grid.get(it.x, it.z), it.z, 0.3 * (it.id % 3));
      } else {
        this.put(it.ck, it.x, grid.get(it.x, it.z), it.z, it.id * 1.3);
      }
    }
  }
  end() { for (const k in this.meshes) { const m = this.meshes[k]; m.count = Math.min(this.counts[k], m.instanceMatrix.count); m.instanceMatrix.needsUpdate = true; } }
  pyreAndFires(S, L, grid) {
    // the pyre grows log by log; bonfires show their stacked logs
    const py = L.S.pyre; const y0 = grid.get(py[0], py[1]);
    this._pyre = [py[0], y0, py[1]];
    const n = Math.min(S.pyre.logs, 120); const arr = this.pyreLogs.instanceMatrix.array;
    const burnt = S.pyre.lit >= 0 ? clamp((S.t - S.pyre.lit - 200) / 300, 0, 1) : 0;
    for (let i = 0; i < n; i++) {
      const layer = Math.floor(i / 4), k = i % 4; const rot = layer % 2 ? Math.PI / 2 : 0;
      const w = 1.9 - layer * 0.04;
      const off = (k - 1.5) * 0.55 * w;
      const x = py[0] + (rot ? off : 0), z = py[1] + (rot ? 0 : off);
      Crowd.setM(arr, i, x, y0 + 0.15 + layer * 0.24 * (1 - burnt * 0.8), z, rot, 0, 0, 1.6 * (1 - burnt * 0.4));
    }
    this.pyreLogs.count = n; this.pyreLogs.instanceMatrix.needsUpdate = true;
    let j = 0; const fa = this.fireLogs.instanceMatrix.array;
    for (let i = 0; i < L.bonfires.length; i++) {
      const b = S.bonfires[i]; const lg = Math.min(9, b.lit > 0 ? 4 + Math.round(b.fuel * 5) : b.logs);
      const bx = L.bonfires[i].x, bz = L.bonfires[i].z, by = grid.get(bx, bz);
      for (let k = 0; k < lg; k++) { const a = k / lg * Math.PI * 2; Crowd.setM(fa, j++, bx + Math.cos(a) * 0.35, by + 0.45, bz + Math.sin(a) * 0.35, a, 0.9, 0, 0.9); }
    }
    this.fireLogs.count = j; this.fireLogs.instanceMatrix.needsUpdate = true;
  }
}

// --------------------------------------------------------------------- animals
class Animals {
  constructor(scene, grid, S) {
    const B = (fn) => { const b = new Builder(); fn(b); return b.geometry(); };
    const c = (h) => col(h);
    const quad = (b, bw, bh, bl, legH, cBody, cHead, headF = 0.55, extra) => {
      b.add('sphere', M(0, legH + bh / 2, 0, 0, 0, 0, bw, bh, bl), c(cBody));
      b.add('box', M(0, legH + bh * 0.75, bl * headF, 0, 0.3, 0, bw * 0.45, bh * 0.5, bl * 0.35), c(cHead));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(sx * bw * 0.28, legH / 2, sz * bl * 0.32, bw * 0.12, legH, bw * 0.12, 0, c(cHead));
      if (extra) extra(b);
    };
    const geos = {
      sheep: B((b) => quad(b, 0.6, 0.55, 0.95, 0.35, 0xd8d0c0, 0x2a2622)),
      goat: B((b) => quad(b, 0.42, 0.45, 0.8, 0.45, 0x8a7a68, 0x6a5a48, 0.6, (bb) => { bb.add('cone5', M(-0.08, 1.05, 0.5, 0, -0.6, 0, 0.05, 0.3, 0.05), c(0x3a3028)); bb.add('cone5', M(0.08, 1.05, 0.5, 0, -0.6, 0, 0.05, 0.3, 0.05), c(0x3a3028)); })),
      pig: B((b) => quad(b, 0.6, 0.5, 1.1, 0.25, 0xa06a5a, 0x8a5a4a, 0.55)),
      horse: B((b) => { quad(b, 0.7, 0.8, 1.9, 1.0, 0x6a4a2e, 0x5a3a22, 0.75); b.add('box', M(0, 2.0, 1.15, 0, -0.7, 0, 0.3, 0.9, 0.35), c(0x5a3a22)); b.add('box', M(0, 2.2, 1.5, 0, 0.3, 0, 0.28, 0.3, 0.6), c(0x5a3a22)); b.add('box', M(0, 1.75, -1.0, 0, 0.5, 0, 0.12, 0.8, 0.12), c(0x2a1a10)); }),
      cow: B((b) => quad(b, 0.9, 0.85, 1.7, 0.7, 0x7a5a3a, 0x5a3a2a, 0.62)),
      dog: B((b) => { quad(b, 0.3, 0.32, 0.75, 0.32, 0x6a5a48, 0x4a3a2a, 0.6); b.add('box', M(0, 0.62, -0.42, 0, -0.8, 0, 0.06, 0.3, 0.06), c(0x4a3a2a)); }),
    };
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), { snow: false });
    this.list = []; this.meshes = {};
    const L = S;
    for (const k in geos) { const n = 140; const m = new THREE.InstancedMesh(geos[k], mat, n); m.castShadow = true; m.frustumCulled = false; m.count = 0; scene.add(m); this.meshes[k] = m; }
    this.pens = null;
  }
  setPens(pens) {
    this.pens = pens; this.herd = [];
    let id = 0;
    for (const p of pens) for (let i = 0; i < p.n; i++) this.herd.push({ kind: p.kind, pen: p, seed: hash2(id++, 77) * 1000 });
  }
  update(S, alpha, t, P, grid, camera) {
    const cnt = { sheep: 0, goat: 0, pig: 0, horse: 0, cow: 0, dog: 0 };
    const put = (kind, x, z, yaw, bob = 0, pitch = 0) => { const m = this.meshes[kind]; const i = cnt[kind]++; if (i >= 140) return; Crowd.setM(m.instanceMatrix.array, i, x, grid.get(x, z) + bob, z, yaw, pitch, 0, 1); };
    if (this.herd) for (const h of this.herd) {
      const p = h.pen, sd = h.seed; const sp = h.kind === 'horse' ? 0.02 : 0.008;
      const a = sd + t * sp + Math.sin(t * 0.03 + sd) * 1.5;
      const r = p.r * (0.25 + 0.65 * ((sd * 7.3) % 1)) * (0.85 + 0.15 * Math.sin(t * 0.02 + sd));
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const yaw = Math.atan2(-Math.sin(a), Math.cos(a)) + (Math.sin(t * 0.1 + sd) > 0 ? 0 : Math.PI);
      const graze = Math.sin(t * 0.7 + sd) > 0.3 ? 0.18 : 0;
      put(h.kind, x, z, yaw, 0, graze);
    }
    // the goat for the godswood
    const g = S.goat; if (g.state === 1 || g.state === 2) put('goat', g.x, g.z, Math.sin(t) * 0.2 + 0.5, Math.abs(Math.sin(t * 6)) * 0.05);
    for (let i = 0; i < S.dogs.length; i++) {
      const d = S.dogs[i]; const x = lerp(d.px, d.x, alpha), z = lerp(d.pz, d.z, alpha);
      const yaw = d.fight >= 0 ? t * 3 + i : Math.atan2(d.tx - d.x, d.tz - d.z);
      const mv = Math.hypot(d.x - d.px, d.z - d.pz) > 0.01;
      put('dog', x, z, yaw, mv ? Math.abs(Math.sin(t * 14 + i)) * 0.08 : 0, d.fight >= 0 ? 0.25 * Math.sin(t * 9) : 0);
    }
    for (const k in this.meshes) { this.meshes[k].count = Math.min(140, cnt[k]); this.meshes[k].instanceMatrix.needsUpdate = true; }
  }
}
