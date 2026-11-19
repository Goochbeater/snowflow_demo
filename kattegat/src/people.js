// Villagers: modular rigged characters (CC0 source packs) dressed as Norse folk, animated on the GPU.
// - every clip (source + procedurally authored ones) is baked into one half-float bone-matrix texture
// - each outfit variant is one merged, skinned geometry drawn with InstancedMesh at three LODs
// - per-instance palette (skin, hair, tunic, trousers, cloak, leather, trim) and per-instance animation frame
import * as THREE from 'three';
import { inflateSync } from 'three/examples/jsm/libs/fflate.module.js';
import peopleBin from './assets/people.bin';
import { patch } from './materials.js';

const FPS = 30;
export const SL = { skin: 0, hair: 1, eye: 2, cloth1: 3, cloth2: 4, cloth3: 5, leather: 6, linen: 7, metal: 8, gold: 9, accent: 10 };

// ------------------------------------------------------------------ decode
function decode() {
  const raw = inflateSync(peopleBin);
  const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const jl = dv.getUint32(4, true);
  const meta = JSON.parse(new TextDecoder().decode(raw.subarray(8, 8 + jl)));
  const base = 8 + jl + ((4 - (jl % 4)) % 4);
  const get = (b) => { const C = { Int16Array, Int8Array, Uint8Array, Uint16Array, Uint32Array, Float32Array }[b.t]; return new C(raw.buffer.slice(raw.byteOffset + base + b.o, raw.byteOffset + base + b.o + b.n * C.BYTES_PER_ELEMENT)); };
  const packs = {};
  for (const pn of ['men', 'women']) {
    const p = meta.packs[pn];
    const pack = { name: pn, bones: p.bones, parents: p.parents, A: new THREE.Matrix4().fromArray(p.A), boneInv: [], clips: {}, parts: {} };
    const bi = get(p.boneInv); for (let i = 0; i < p.bones.length; i++) pack.boneInv.push(new THREE.Matrix4().fromArray(bi, i * 16));
    pack.bindWorld = pack.boneInv.map((m) => m.clone().invert());
    pack.idx = Object.fromEntries(p.bones.map((n, i) => [n, i]));
    for (const c of p.clips) {
      const q = get(c.quat); const qf = new Float32Array(q.length); for (let i = 0; i < q.length; i++) qf[i] = q[i] / 32767;
      pack.clips[c.name] = { frames: c.frames, quat: qf, posBones: c.posBones, pos: get(c.pos), restPos: get(c.restPos), restScale: get(c.restScale) };
    }
    for (const [name, d] of Object.entries(p.parts)) {
      const qp = get(d.pos); const pos = new Float32Array(qp.length); for (let i = 0; i < qp.length; i++) pos[i] = qp[i] / 10000;
      pack.parts[name] = { pos, si: get(d.si), sw: get(d.sw), slot: get(d.slot), idx: get(d.idx) };
    }
    // topological order (parents before children)
    const order = []; const seen = new Set();
    const visit = (i) => { if (seen.has(i)) return; const pa = pack.parents[i]; if (pa >= 0) visit(pa); seen.add(i); order.push(i); };
    for (let i = 0; i < p.bones.length; i++) visit(i);
    pack.order = order;
    // rest-pose bone positions in metres (character space)
    pack.rest = pack.bindWorld.map((m) => new THREE.Vector3().setFromMatrixPosition(m).multiplyScalar(0.01));
    packs[pn] = pack;
  }
  return packs;
}

// ------------------------------------------------------------------ pose authoring
// A pose sampler gives local TRS per bone; edits are applied in character space (metres, +Z forward, +X = character's left).
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
class Pose {
  constructor(pack) {
    this.pack = pack; const n = pack.bones.length;
    this.lq = new Float32Array(n * 4); this.lp = new Float32Array(n * 3); this.ls = new Float32Array(n * 3);
    this.rot = new Map(); this.off = new Map(); this.feet = null; this.headScale = 1; this.footRot = null;
    this.world = Array.from({ length: n }, () => new THREE.Matrix4());
  }
  base(clipName, time, loop = true) {
    const c = this.pack.clips[clipName]; const n = this.pack.bones.length;
    let f = time * FPS; f = loop ? ((f % c.frames) + c.frames) % c.frames : Math.min(c.frames - 1, Math.max(0, f));
    const f0 = Math.floor(f), f1 = loop ? (f0 + 1) % c.frames : Math.min(c.frames - 1, f0 + 1), a = f - f0;
    for (let b = 0; b < n; b++) {
      _q.fromArray(c.quat, (f0 * n + b) * 4); _q2.fromArray(c.quat, (f1 * n + b) * 4); _q.slerp(_q2, a);
      this.lq[b * 4] = _q.x; this.lq[b * 4 + 1] = _q.y; this.lq[b * 4 + 2] = _q.z; this.lq[b * 4 + 3] = _q.w;
    }
    this.lp.set(c.restPos); this.ls.set(c.restScale);
    c.posBones.forEach((b, k) => { for (let j = 0; j < 3; j++) this.lp[b * 3 + j] = c.pos[(f0 * c.posBones.length + k) * 3 + j] * (1 - a) + c.pos[(f1 * c.posBones.length + k) * 3 + j] * a; });
    this.rot.clear(); this.off.clear(); this.feet = null; this.footRot = null;
    return this;
  }
  blendFrom(other, w) { // lerp this pose toward another pose's locals
    const n = this.pack.bones.length;
    for (let b = 0; b < n; b++) { _q.fromArray(this.lq, b * 4); _q2.fromArray(other.lq, b * 4); _q.slerp(_q2, w); _q.toArray(this.lq, b * 4); }
    for (let i = 0; i < this.lp.length; i++) this.lp[i] += (other.lp[i] - this.lp[i]) * w;
    return this;
  }
  r(bone, ax, ay, az, angle) { // character-space delta rotation about an axis
    if (!angle) return this; const i = this.pack.idx[bone]; if (i === undefined) return this;
    _q.setFromAxisAngle(_v.set(ax, ay, az).normalize(), angle);
    const prev = this.rot.get(i); if (prev) _q.multiply(prev);
    this.rot.set(i, _q.clone()); return this;
  }
  o(bone, dx, dy, dz) { const i = this.pack.idx[bone]; const p = this.off.get(i) || [0, 0, 0]; this.off.set(i, [p[0] + dx, p[1] + dy, p[2] + dz]); return this; }
  plantFeet(rotX = 0) { this.feet = true; this.footRot = rotX; return this; }
  // forward kinematics -> skin matrices (metres)
  solve(outK, rowOffset) {
    const P = this.pack, n = P.bones.length, W = this.world;
    for (const i of P.order) {
      _q.fromArray(this.lq, i * 4); _v.fromArray(this.lp, i * 3); _s.fromArray(this.ls, i * 3);
      if (P.bones[i] === 'Head' && this.headScale !== 1) _s.multiplyScalar(this.headScale);
      _m.compose(_v, _q, _s);
      const pa = P.parents[i];
      W[i].multiplyMatrices(pa >= 0 ? W[pa] : P.A, _m);
      const off = this.off.get(i);
      if (off) { W[i].elements[12] += off[0] * 100; W[i].elements[13] += off[1] * 100; W[i].elements[14] += off[2] * 100; }
      const d = this.rot.get(i);
      if (d) { const e = W[i].elements; const px = e[12], py = e[13], pz = e[14]; _m2.makeRotationFromQuaternion(d); W[i].premultiply(_m2); e[12] = px; e[13] = py; e[14] = pz; }
    }
    if (this.feet) {
      // knees bent by hand: put each foot at the end of its shin, sole level
      for (const s of ['L', 'R']) {
        const li = P.idx['LowerLeg' + s], fi = P.idx['Foot' + s];
        const e = W[li].elements; const len = 51.1 * 0.01; // local units are metres, world is cm
        const end = new THREE.Vector3(0, len, 0).applyMatrix4(W[li]);
        const fw = W[fi]; const fp = new THREE.Vector3(), fq = new THREE.Quaternion(), fs = new THREE.Vector3(); fw.decompose(fp, fq, fs);
        if (this.footRot) fq.premultiply(_q.setFromAxisAngle(_v.set(1, 0, 0), this.footRot));
        fw.compose(end, fq, fs);
      }
    }
    for (let i = 0; i < n; i++) {
      _m.multiplyMatrices(W[i], P.boneInv[i]);
      const e = _m.elements, o = rowOffset + i * 12;
      outK[o] = e[0]; outK[o + 1] = e[4]; outK[o + 2] = e[8]; outK[o + 3] = e[12] * 0.01;
      outK[o + 4] = e[1]; outK[o + 5] = e[5]; outK[o + 6] = e[9]; outK[o + 7] = e[13] * 0.01;
      outK[o + 8] = e[2]; outK[o + 9] = e[6]; outK[o + 10] = e[10]; outK[o + 11] = e[14] * 0.01;
    }
  }
}

// procedural clips: [name, seconds, loop, fn(pose, t, u)] where u = t/seconds
const S = Math.sin, C = Math.cos, PI = Math.PI;
const armsCarry = (p, k = 1) => p.r('UpperArmL', 1, 0, 0, -0.45 * k).r('UpperArmR', 1, 0, 0, -0.45 * k).r('UpperArmL', 0, 0, 1, -0.12 * k).r('UpperArmR', 0, 0, 1, 0.12 * k).r('LowerArmL', 1, 0, 0, -1.15 * k).r('LowerArmR', 1, 0, 0, -1.15 * k).r('LowerArmL', 0, 1, 0, -0.35 * k).r('LowerArmR', 0, 1, 0, 0.35 * k);
const sitBase = (p, drop = 0.4) => p.o('Body', 0, -drop, -0.06).r('UpperLegL', 1, 0, 0, -1.45).r('UpperLegR', 1, 0, 0, -1.45).r('LowerLegL', 1, 0, 0, 1.45).r('LowerLegR', 1, 0, 0, 1.45).plantFeet();
export const PROC = [
  ['carry', 1.333, true, (p, t) => armsCarry(p.base('Walk', t)).r('Chest', 1, 0, 0, -0.08)],
  ['carryIdle', 1.667, true, (p, t) => armsCarry(p.base('Idle', t))],
  ['carryHigh', 1.333, true, (p, t) => p.base('Walk', t).r('UpperArmL', 1, 0, 0, -2.75).r('UpperArmR', 1, 0, 0, -2.75).r('UpperArmL', 0, 0, 1, 0.15).r('UpperArmR', 0, 0, 1, -0.15).r('LowerArmL', 1, 0, 0, -0.5).r('LowerArmR', 1, 0, 0, -0.5).r('Head', 1, 0, 0, 0.15)],
  ['carryShoulder', 1.333, true, (p, t) => p.base('Walk', t).r('UpperArmR', 1, 0, 0, -2.5).r('UpperArmR', 0, 0, 1, -0.35).r('LowerArmR', 1, 0, 0, -1.2).r('UpperArmL', 1, 0, 0, -0.3).r('Chest', 0, 0, 1, 0.08)],
  ['drink', 4, true, (p, t, u) => { const k = Math.max(0, S(u * 2 * PI)) ** 0.6; p.base('Idle', t).r('UpperArmR', 1, 0, 0, -0.35 - 0.85 * k).r('UpperArmR', 0, 0, 1, 0.35 * k).r('LowerArmR', 1, 0, 0, -0.9 - 0.55 * k).r('LowerArmR', 0, 1, 0, 0.5).r('Head', 1, 0, 0, -0.3 * k).r('Chest', 1, 0, 0, -0.06 * k); }],
  ['cheer', 1.2, true, (p, t, u) => { const k = S(u * 2 * PI); p.base('Idle', t).o('Body', 0, Math.max(0, k) * 0.05, 0).r('UpperArmL', 1, 0, 0, -2.6 - k * 0.25).r('UpperArmR', 1, 0, 0, -2.6 + k * 0.25).r('UpperArmL', 0, 0, 1, 0.45).r('UpperArmR', 0, 0, 1, -0.45).r('LowerArmL', 1, 0, 0, -0.35).r('LowerArmR', 1, 0, 0, -0.35).r('Head', 1, 0, 0, -0.2); }],
  ['sit', 4, true, (p, t, u) => sitBase(p.base('Idle', t)).r('UpperArmL', 1, 0, 0, -0.55).r('UpperArmR', 1, 0, 0, -0.55).r('LowerArmL', 1, 0, 0, -0.35).r('LowerArmR', 1, 0, 0, -0.35).r('Chest', 1, 0, 0, 0.05 + 0.02 * S(u * 2 * PI))],
  ['sitDrink', 4, true, (p, t, u) => { const k = Math.max(0, S(u * 2 * PI)) ** 0.6; sitBase(p.base('Idle', t)).r('UpperArmL', 1, 0, 0, -0.55).r('LowerArmL', 1, 0, 0, -0.4).r('UpperArmR', 1, 0, 0, -0.45 - 0.75 * k).r('UpperArmR', 0, 0, 1, 0.35 * k).r('LowerArmR', 1, 0, 0, -0.9 - 0.55 * k).r('LowerArmR', 0, 1, 0, 0.5).r('Head', 1, 0, 0, -0.3 * k); }],
  ['sitTalk', 3, true, (p, t, u) => sitBase(p.base('Idle', t)).r('UpperArmL', 1, 0, 0, -0.55).r('LowerArmL', 1, 0, 0, -0.4).r('UpperArmR', 1, 0, 0, -0.9 - 0.4 * S(u * 4 * PI)).r('UpperArmR', 0, 0, 1, -0.3).r('LowerArmR', 1, 0, 0, -0.8).r('Head', 0, 1, 0, 0.3 * S(u * 2 * PI))],
  ['lie', 1, true, (p, t) => p.base('Death', 99, false)],
  ['kneel', 3, true, (p, t, u) => p.base('Idle', t).o('Body', 0, -0.48, -0.12).r('UpperLegL', 1, 0, 0, -0.25).r('UpperLegR', 1, 0, 0, -0.25).r('LowerLegL', 1, 0, 0, 1.75).r('LowerLegR', 1, 0, 0, 1.75).plantFeet(1.4).r('Chest', 1, 0, 0, 0.32).r('Head', 1, 0, 0, 0.35).r('UpperArmL', 1, 0, 0, -0.5).r('UpperArmR', 1, 0, 0, -0.5).r('LowerArmL', 1, 0, 0, -0.7).r('LowerArmR', 1, 0, 0, -0.7)],
  ['mourn', 4, true, (p, t, u) => p.base('Idle', t).r('Chest', 1, 0, 0, 0.18).r('Neck', 1, 0, 0, 0.25).r('Head', 1, 0, 0, 0.3).r('UpperArmL', 1, 0, 0, -0.2).r('UpperArmR', 1, 0, 0, -0.2).r('UpperArmL', 0, 0, 1, -0.15).r('UpperArmR', 0, 0, 1, 0.15).r('LowerArmL', 1, 0, 0, -1.05).r('LowerArmR', 1, 0, 0, -1.05).r('LowerArmL', 0, 1, 0, -0.75).r('LowerArmR', 0, 1, 0, 0.75)],
  ['haul', 1.6, true, (p, t, u) => { const k = S(u * 2 * PI); p.base('Idle', t).o('Body', 0, -0.12, -0.12 - 0.05 * k).r('Hips', 1, 0, 0, -0.35).r('Chest', 1, 0, 0, -0.25 - 0.08 * k).r('UpperLegL', 1, 0, 0, -0.55).r('LowerLegL', 1, 0, 0, 0.5).r('UpperLegR', 1, 0, 0, 0.15).plantFeet().r('UpperArmL', 1, 0, 0, -1.2).r('UpperArmR', 1, 0, 0, -1.25).r('UpperArmL', 0, 0, 1, -0.3).r('UpperArmR', 0, 0, 1, 0.3).r('LowerArmL', 1, 0, 0, -0.15).r('LowerArmR', 1, 0, 0, -0.15); }],
  ['row', 2.2, true, (p, t, u) => { const k = C(u * 2 * PI); sitBase(p.base('Idle', 0), 0.38).r('Chest', 1, 0, 0, 0.35 * k).r('Abdomen', 1, 0, 0, 0.15 * k).r('UpperArmL', 1, 0, 0, -1.35 + 0.35 * k).r('UpperArmR', 1, 0, 0, -1.35 + 0.35 * k).r('UpperArmL', 0, 0, 1, -0.3).r('UpperArmR', 0, 0, 1, 0.3).r('LowerArmL', 1, 0, 0, -0.5 - 0.5 * Math.max(0, -k)).r('LowerArmR', 1, 0, 0, -0.5 - 0.5 * Math.max(0, -k)); }],
  ['slump', 4, true, (p, t, u) => sitBase(p.base('Idle', t), 0.45).r('Chest', 1, 0, 0, -0.35).r('Neck', 1, 0, 0, 0.4).r('Head', 0, 0, 1, 0.35).r('UpperArmL', 1, 0, 0, -0.15).r('UpperArmR', 1, 0, 0, -0.6).r('LowerArmR', 1, 0, 0, -1.0)],
  ['wrestle', 2.4, true, (p, t, u) => { const k = S(u * 2 * PI); p.base('Idle', t).o('Body', 0.04 * k, -0.18, 0).r('Hips', 1, 0, 0, 0.45).r('Chest', 1, 0, 0, 0.35).r('Chest', 0, 0, 1, 0.1 * k).r('UpperLegL', 1, 0, 0, -0.6).r('LowerLegL', 1, 0, 0, 0.7).r('UpperLegR', 1, 0, 0, -0.2).r('LowerLegR', 1, 0, 0, 0.5).plantFeet().r('UpperArmL', 1, 0, 0, -1.3).r('UpperArmR', 1, 0, 0, -1.3).r('UpperArmL', 0, 1, 0, -0.5).r('UpperArmR', 0, 1, 0, 0.5).r('LowerArmL', 0, 1, 0, -0.9).r('LowerArmR', 0, 1, 0, 0.9).r('Head', 1, 0, 0, -0.3); }],
  ['dance', 1.0, true, (p, t, u) => { const k = S(u * 2 * PI); p.base('Walk', t * 0.5).o('Body', 0, Math.abs(k) * 0.08, 0).r('Body', 0, 1, 0, 0.35 * k).r('UpperArmL', 1, 0, 0, -2.3 - 0.4 * k).r('UpperArmR', 1, 0, 0, -2.3 + 0.4 * k).r('UpperArmL', 0, 0, 1, 0.7).r('UpperArmR', 0, 0, 1, -0.7).r('LowerArmL', 1, 0, 0, -0.6).r('LowerArmR', 1, 0, 0, -0.6).r('Head', 0, 0, 1, 0.15 * k); }],
  ['argue', 2.0, true, (p, t, u) => { const a = S(u * 2 * PI), b = S(u * 4 * PI + 1); p.base('Idle', t).r('Chest', 1, 0, 0, 0.12 + 0.06 * b).r('UpperArmR', 1, 0, 0, -1.1 - 0.5 * a).r('UpperArmR', 0, 0, 1, -0.35).r('LowerArmR', 1, 0, 0, -0.9 + 0.5 * a).r('UpperArmL', 1, 0, 0, -0.7 + 0.4 * b).r('UpperArmL', 0, 0, 1, 0.5).r('LowerArmL', 1, 0, 0, -1.2).r('Head', 1, 0, 0, -0.1 + 0.08 * b); }],
  ['speak', 3.0, true, (p, t, u) => { const a = S(u * 2 * PI); p.base('Idle', t).r('UpperArmR', 1, 0, 0, -0.9 - 0.45 * Math.max(0, a)).r('UpperArmR', 0, 0, 1, -0.6).r('LowerArmR', 1, 0, 0, -0.7).r('UpperArmL', 1, 0, 0, -0.25).r('Head', 0, 1, 0, 0.25 * S(u * 2 * PI + 1)); }],
  ['lyre', 2.0, true, (p, t, u) => { const a = S(u * 6 * PI); p.base('Idle', t).r('UpperArmL', 1, 0, 0, -0.75).r('UpperArmL', 0, 1, 0, -0.5).r('LowerArmL', 1, 0, 0, -1.3).r('UpperArmR', 1, 0, 0, -0.6).r('UpperArmR', 0, 1, 0, 0.4).r('LowerArmR', 1, 0, 0, -1.0 - 0.12 * a).r('Head', 1, 0, 0, -0.15).r('Head', 0, 1, 0, 0.15 * S(u * 2 * PI)); }],
  ['embrace', 3.0, true, (p, t, u) => p.base('Idle', t).r('Chest', 1, 0, 0, 0.12).r('UpperArmL', 1, 0, 0, -1.25).r('UpperArmR', 1, 0, 0, -1.25).r('UpperArmL', 0, 1, 0, -0.6).r('UpperArmR', 0, 1, 0, 0.6).r('LowerArmL', 0, 1, 0, -1.2).r('LowerArmR', 0, 1, 0, 1.2).r('Head', 0, 0, 1, 0.25)],
  ['point', 2.0, true, (p, t, u) => p.base('Idle', t).r('UpperArmR', 1, 0, 0, -1.55).r('UpperArmR', 0, 1, 0, 0.15).r('Head', 1, 0, 0, -0.1).r('Chest', 0, 1, 0, -0.15)],
  ['weave', 2.4, true, (p, t, u) => { const a = S(u * 2 * PI); p.base('Idle', t).r('UpperArmL', 1, 0, 0, -0.9).r('UpperArmR', 1, 0, 0, -0.9).r('UpperArmL', 0, 1, 0, -0.35 + 0.2 * a).r('UpperArmR', 0, 1, 0, 0.35 + 0.2 * a).r('LowerArmL', 1, 0, 0, -0.9).r('LowerArmR', 1, 0, 0, -0.9).r('Head', 1, 0, 0, 0.25); }],
  ['stumble', 2.666, true, (p, t, u) => p.base('Walk', t * 0.5).r('Body', 0, 0, 1, 0.16 * S(u * 2 * PI)).r('Chest', 1, 0, 0, 0.12).r('Head', 0, 0, 1, -0.2 * S(u * 2 * PI)).r('UpperArmR', 1, 0, 0, -0.5).r('UpperArmR', 0, 0, 1, -0.4)],
  ['limp', 2.0, true, (p, t, u) => p.base('Walk', t * 0.66).r('Body', 0, 0, 1, 0.1 * S(u * 2 * PI)).r('Chest', 1, 0, 0, 0.22).r('UpperArmL', 1, 0, 0, -0.6).r('LowerArmL', 1, 0, 0, -1.1).r('UpperArmL', 0, 0, 1, -0.2)],
  ['fight', 1.66, true, (p, t, u) => (u < 0.5 ? p.base('Punch_Right', t) : p.base('Punch_Left', t - 0.83))],
  ['brace', 2.0, true, (p, t, u) => p.base('Idle_Sword', t).r('UpperArmL', 1, 0, 0, -1.2).r('UpperArmL', 0, 1, 0, -0.4).r('LowerArmL', 1, 0, 0, -0.6)],
  ['scythe', 2.2, true, (p, t, u) => { const a = S(u * 2 * PI); p.base('Idle', t).o('Body', 0, -0.06, 0).r('Chest', 0, 1, 0, 0.6 * a).r('Chest', 1, 0, 0, 0.25).r('UpperArmL', 1, 0, 0, -0.8).r('UpperArmR', 1, 0, 0, -0.9).r('LowerArmL', 1, 0, 0, -0.6).r('LowerArmR', 1, 0, 0, -0.4); }],
];
const BASE = [['idle', 'Idle'], ['idle2', 'Idle_Neutral'], ['walk', 'Walk'], ['run', 'Run'], ['work', 'Interact'], ['hammer', 'Sword_Slash'], ['swordIdle', 'Idle_Sword'], ['wave', 'Wave'], ['death', 'Death', false], ['punchL', 'Punch_Left'], ['punchR', 'Punch_Right'], ['hit', 'HitRecieve'], ['kick', 'Kick_Right']];

// ------------------------------------------------------------------ baking
function bakeAll(packs) {
  const nb = 62, W = nb * 3;
  const bakes = []; // {pack, kind, clips:{name:{row0, frames, dur, loop}}}
  const jobs = [];
  for (const pn of ['men', 'women']) for (const kind of ['adult', 'child', 'elder']) jobs.push([packs[pn], kind]);
  let rows = 0;
  const plan = jobs.map(([pack, kind]) => {
    const clips = {};
    for (const [nm, src, loop = true] of BASE) { const fr = pack.clips[src].frames; clips[nm] = { row0: rows, frames: fr, dur: fr / FPS, loop, src }; rows += fr; }
    for (const [nm, dur, loop] of PROC) { const fr = Math.round(dur * FPS); clips[nm] = { row0: rows, frames: fr, dur, loop, proc: true }; rows += fr; }
    return { pack, kind, clips };
  });
  // wrap rows into side-by-side blocks so the texture stays well under any GPU's size limit
  const BLK = 11, RPB = Math.ceil(rows / BLK), TW = BLK * W;
  const data = new Float32Array(rows * W * 4);
  const K = new Float32Array(nb * 12);
  for (const b of plan) {
    const pose = new Pose(b.pack);
    const fns = Object.fromEntries(PROC.map((x) => [x[0], x[3]]));
    for (const [nm, c] of Object.entries(b.clips)) {
      for (let f = 0; f < c.frames; f++) {
        const t = f / FPS;
        if (c.proc) fns[nm](pose, t, t / c.dur); else pose.base(c.src, t, c.loop);
        if (b.kind === 'child') pose.headScale = 1.28; else pose.headScale = 1;
        if (b.kind === 'elder') pose.r('Abdomen', 1, 0, 0, 0.12).r('Chest', 1, 0, 0, 0.16).r('Neck', 1, 0, 0, 0.12).r('Head', 1, 0, 0, -0.18);
        pose.solve(K, 0);
        const row = c.row0 + f;
        for (let i = 0; i < nb; i++) for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) data[(row * W + i * 3 + r) * 4 + k] = K[i * 12 + r * 4 + k];
      }
    }
    bakes.push(b);
  }
  const half = new Uint16Array(TW * RPB * 4);
  for (let row = 0; row < rows; row++) {
    const bl = Math.floor(row / RPB), y = row - bl * RPB;
    for (let x = 0; x < W * 4; x++) half[(y * TW + bl * W) * 4 + x] = THREE.DataUtils.toHalfFloat(data[row * W * 4 + x]);
  }
  const tex = new THREE.DataTexture(half, TW, RPB, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.needsUpdate = true;
  tex.userData = { RPB, W };
  return { bakes, tex, data, W, rows, RPB };
}

// ------------------------------------------------------------------ geometry assembly
class GeoBuilder {
  constructor() { this.pos = []; this.si = []; this.sw = []; this.slot = []; this.idx = []; }
  get n() { return this.pos.length / 3; }
  addPart(p) {
    const base = this.n;
    for (let i = 0; i < p.pos.length; i++) this.pos.push(p.pos[i]);
    for (let i = 0; i < p.si.length; i++) { this.si.push(p.si[i]); this.sw.push(p.sw[i] / 255); }
    for (let i = 0; i < p.slot.length; i++) this.slot.push(p.slot[i] === 255 ? 0 : p.slot[i]);
    for (let i = 0; i < p.idx.length; i += 3) { // faces tagged 255 in the asset build are dropped
      if (p.slot[p.idx[i]] === 255 || p.slot[p.idx[i + 1]] === 255 || p.slot[p.idx[i + 2]] === 255) continue;
      this.idx.push(p.idx[i] + base, p.idx[i + 1] + base, p.idx[i + 2] + base);
    }
  }
  v(x, y, z, slot, w) { // w: [[bone, weight], ...]
    this.pos.push(x, y, z); const ws = w.slice(0, 4); while (ws.length < 4) ws.push([0, 0]);
    const tot = ws.reduce((s, q) => s + q[1], 0) || 1;
    for (const [b, q] of ws) { this.si.push(b); this.sw.push(q / tot); }
    this.slot.push(slot); return this.n - 1;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aSI', new THREE.Float32BufferAttribute(this.si, 4));
    g.setAttribute('aSW', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setAttribute('aSlot', new THREE.Float32BufferAttribute(this.slot, 1));
    g.setIndex(this.idx); g.computeBoundingSphere();
    return g;
  }
}
// surface probes on the assembled rest-pose mesh
function bandExtent(pos, y0, y1, cx, cz, maxX = 0.32) {
  let rx = 0, rzF = 0, rzB = 0;
  for (let i = 0; i < pos.length; i += 3) { const y = pos[i + 1]; if (y < y0 || y > y1 || Math.abs(pos[i] - cx) > maxX) continue; rx = Math.max(rx, Math.abs(pos[i] - cx)); const dz = pos[i + 2] - cz; if (dz > 0) rzF = Math.max(rzF, dz); else rzB = Math.max(rzB, -dz); }
  return { rx, rzF, rzB };
}
function slotBox(pos, slot, s, y0, y1) {
  const b = { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9, minZ: 1e9, maxZ: -1e9 };
  for (let i = 0; i < slot.length; i++) { if (slot[i] !== s) continue; const y = pos[i * 3 + 1]; if (y < y0 || y > y1) continue; b.minX = Math.min(b.minX, pos[i * 3]); b.maxX = Math.max(b.maxX, pos[i * 3]); b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y); b.minZ = Math.min(b.minZ, pos[i * 3 + 2]); b.maxZ = Math.max(b.maxZ, pos[i * 3 + 2]); }
  return b;
}
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// skirt / tunic hem: a flared tube around the hips that follows the thighs
function addSkirt(G, pack, yTop, yBot, flare, opts) {
  const I = pack.idx, hips = pack.rest[I.Hips];
  const ext = bandExtent(G.pos, yTop - 0.06, yTop + 0.02, hips.x, hips.z);
  const rx = Math.max(0.13, ext.rx) + 0.012, rzF = Math.max(0.1, ext.rzF) + 0.015, rzB = Math.max(0.1, ext.rzB) + 0.015;
  const SEG = 18, RINGS = opts.rings || 5; const ring = [];
  const TRIM = opts.trim ? 0.07 : 0;
  const at = (t, k, out, slot) => { // vertex on the skirt surface at height-fraction t, segment k
    const a = (k / SEG) * PI * 2; const sx = S(a), cz = C(a);
    const y = yTop + (yBot - yTop) * t, fl = (1 + flare * t ** 1.3) * (1 + out);
    const x = hips.x + sx * rx * fl, z = hips.z + (cz > 0 ? rzF : rzB) * cz * fl;
    const side = sm(0.15, 0.85, Math.abs(sx)) * t * (opts.legFollow ?? 0.85);
    const leg = sx > 0 ? 'L' : 'R';
    const w = [[I.Hips, 1 - side]];
    if (side > 0) { const low = sm(0.55, 1.0, t) * (opts.shin ? 0.5 : 0); w.push([I['UpperLeg' + leg], side * (1 - low)]); if (low > 0) w.push([I['LowerLeg' + leg], side * low]); }
    return G.v(x, y, z, slot, w);
  };
  for (let r = 0; r <= RINGS; r++) { const t = (r / RINGS) * (1 - TRIM); const row = []; for (let k = 0; k < SEG; k++) row.push(at(t, k, 0, opts.slot ?? SL.cloth1)); ring.push(row); }
  for (let r = 0; r < RINGS; r++) for (let k = 0; k < SEG; k++) { const k2 = (k + 1) % SEG; G.quad(ring[r][k], ring[r + 1][k], ring[r + 1][k2], ring[r][k2]); }
  if (TRIM) { // woven tablet band at the hem
    const a0 = [], a1 = [];
    for (let k = 0; k < SEG; k++) { a0.push(at(1 - TRIM, k, 0.004, SL.accent)); a1.push(at(1, k, 0.004, SL.accent)); }
    for (let k = 0; k < SEG; k++) { const k2 = (k + 1) % SEG; G.quad(a0[k], a1[k], a1[k2], a0[k2]); }
  }
  if (opts.apron) { // the overdress: a front panel hanging from the bodice straps
    const K0 = SEG - 3, K1 = SEG + 3, rows = 5, pan = [];
    for (let r = 0; r <= rows; r++) { const t = (r / rows) * opts.apron; const row = []; for (let k = K0; k <= K1; k++) row.push(at(t, ((k % SEG) + SEG) % SEG, 0.03 + 0.01 * t, SL.cloth3)); pan.push(row); }
    for (let r = 0; r < rows; r++) for (let k = 0; k < K1 - K0; k++) G.quad(pan[r][k], pan[r + 1][k], pan[r + 1][k + 1], pan[r][k + 1]);
    const back = [];
    for (let r = 0; r <= rows; r++) { const t = (r / rows) * opts.apron * 0.95; const row = []; for (let k = K0 + SEG / 2; k <= K1 + SEG / 2; k++) row.push(at(t, ((k % SEG) + SEG) % SEG, 0.03 + 0.01 * t, SL.cloth3)); back.push(row); }
    for (let r = 0; r < rows; r++) for (let k = 0; k < K1 - K0; k++) G.quad(back[r][k], back[r + 1][k], back[r + 1][k + 1], back[r][k + 1]);
  }
  // belt
  const by = yTop + 0.005, bh = 0.045; const top = [], bot = [];
  for (let k = 0; k < SEG; k++) { const a = (k / SEG) * PI * 2, sx = S(a), cz = C(a); const x = hips.x + sx * rx * 1.035, z = hips.z + (cz > 0 ? rzF : rzB) * cz * 1.035; top.push(G.v(x, by + bh / 2, z, SL.leather, [[I.Hips, 1]])); bot.push(G.v(x, by - bh / 2, z, SL.leather, [[I.Hips, 1]])); }
  for (let k = 0; k < SEG; k++) { const k2 = (k + 1) % SEG; G.quad(top[k], bot[k], bot[k2], top[k2]); }
  addBox(G, hips.x, by, hips.z + rzF * 1.05, 0.05, 0.05, 0.012, SL.gold, [[I.Hips, 1]]);
  return { rx, rzF, rzB };
}
function addBox(G, cx, cy, cz, sx, sy, sz, slot, w, rotY = 0) {
  const c = C(rotY), s = S(rotY); const v = [];
  for (const [x, y, z] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) { const lx = x * sx / 2, lz = z * sz / 2; v.push(G.v(cx + lx * c + lz * s, cy + y * sy / 2, cz - lx * s + lz * c, slot, w)); }
  const f = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3]];
  for (const q of f) G.quad(v[q[0]], v[q[1]], v[q[2]], v[q[3]]);
}
function addEllipsoid(G, cx, cy, cz, rx, ry, rz, slot, w, seg = 8, rings = 5, half = false) {
  const vs = [];
  for (let r = 0; r <= rings; r++) { const ph = (half ? 0.5 : 1) * PI * r / rings; const row = []; for (let k = 0; k < seg; k++) { const th = (k / seg) * PI * 2; row.push(G.v(cx + rx * S(ph) * C(th), cy + ry * C(ph), cz + rz * S(ph) * S(th), slot, w)); } vs.push(row); }
  for (let r = 0; r < rings; r++) for (let k = 0; k < seg; k++) { const k2 = (k + 1) % seg; G.quad(vs[r][k], vs[r][k2], vs[r + 1][k2], vs[r + 1][k]); }
  return vs;
}
function headFrame(G, pack) {
  const I = pack.idx, h = pack.rest[I.Head];
  const eye = slotBox(G.pos, G.slot, SL.eye, h.y - 0.1, h.y + 0.4);
  const ey = eye.maxY > -1e8 ? (eye.minY + eye.maxY) / 2 : h.y + 0.12;
  const skin = slotBox(G.pos, G.slot, SL.skin, ey - 0.16, ey + 0.12);
  const jaw = slotBox(G.pos, G.slot, SL.skin, ey - 0.12, ey - 0.03);
  const chin = slotBox(G.pos, G.slot, SL.skin, ey - 0.13, ey - 0.06);
  const hair = slotBox(G.pos, G.slot, SL.hair, h.y - 0.05, h.y + 0.4);
  // facial reference points measured on each head
  return { h, eyeY: ey, chinZ: chin.maxZ, front: Math.max(skin.maxZ, eye.maxZ), w: (jaw.maxX - jaw.minX) / 2, cx: (skin.maxX + skin.minX) / 2, top: Math.max(skin.maxY, hair.maxY), cz: (skin.maxZ + skin.minZ) / 2 - 0.01 };
}
function addBeard(G, pack, style) {
  const I = pack.idx; const F = headFrame(G, pack); const W = [[I.Head, 1]];
  const mouthY = F.eyeY - 0.072, chinY = F.eyeY - 0.115;
  const len = style === 'long' ? 0.12 : style === 'braid' ? 0.15 : style === 'fork' ? 0.1 : 0.035;
  const SEG = 12, ROWS = 5; const rows = [];
  for (let r = 0; r <= ROWS; r++) {
    const t = r / ROWS; const row = [];
    for (let k = 0; k <= SEG; k++) {
      const u = k / SEG, a = -PI * 0.5 + u * PI; const side = Math.abs(S(a));
      // top edge hugs the jaw: up the cheeks to the ears, under the lip at the front
      const yTop = mouthY - 0.012 + side * 0.075;
      const yBot = chinY - len * (1 - side * 0.85) - 0.01;
      let y = yTop + (yBot - yTop) * t;
      const taper = style === 'braid' ? 1 - 0.75 * t ** 1.4 : style === 'short' ? 1 - 0.2 * t : 1 - 0.45 * t ** 1.2;
      const wx = (F.w + 0.008) * taper;
      const x = F.cx + S(a) * wx;
      const z = F.cz + (F.chinZ - F.cz + 0.01 + 0.014 * t) * C(a) ** 0.8 * (1 - 0.1 * t);
      if (style === 'fork' && t > 0.65) y += Math.abs(S(a * 2)) * 0.035 * (t - 0.65) * 3;
      row.push(G.v(x, y, z, SL.hair, W));
    }
    rows.push(row);
  }
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < SEG; k++) G.quad(rows[r][k], rows[r + 1][k], rows[r + 1][k + 1], rows[r][k + 1]);
  // under side closes the volume back toward the throat
  const back = rows.map((row) => row.map((i) => G.v(F.cx + (G.pos[i * 3] - F.cx) * 0.8, G.pos[i * 3 + 1], F.cz + (G.pos[i * 3 + 2] - F.cz) * 0.25 - 0.02, SL.hair, W)));
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < SEG; k++) G.quad(back[r][k + 1], back[r + 1][k + 1], back[r + 1][k], back[r][k]);
  for (let k = 0; k < SEG; k++) G.quad(rows[ROWS][k], back[ROWS][k], back[ROWS][k + 1], rows[ROWS][k + 1]);
  // moustache: two drooping wings above the lip
  for (const sx of [-1, 1]) {
    const mz = F.chinZ + 0.012; const a = G.v(F.cx, mouthY + 0.018, mz, SL.hair, W), b = G.v(F.cx + sx * 0.045, mouthY + 0.004, mz - 0.016, SL.hair, W), c = G.v(F.cx + sx * 0.05, mouthY - 0.02, mz - 0.022, SL.hair, W), d = G.v(F.cx, mouthY + 0.004, mz + 0.004, SL.hair, W);
    if (sx > 0) G.quad(a, d, c, b); else G.quad(a, b, c, d);
  }
  if (style === 'braid') addBox(G, F.cx, chinY - len + 0.005, F.front - 0.02, 0.022, 0.035, 0.022, SL.gold, W);
}
function addHelmet(G, pack, style) {
  const I = pack.idx; const F = headFrame(G, pack); const W = [[I.Head, 1]];
  const cy = F.eyeY + 0.035, r = Math.max(0.118, (F.top - F.eyeY) * 0.95);
  // spangenhelm: a slightly pointed dome in four plates
  const SEG = 12, R = 5; const rows = [];
  for (let k = 0; k <= R; k++) { const ph = (PI / 2) * (k / R); const row = []; for (let s = 0; s < SEG; s++) { const th = (s / SEG) * PI * 2; const rr = r * C(ph); row.push(G.v(F.cx + rr * S(th), cy + r * 1.12 * S(ph) ** 0.9, F.cz - 0.005 + rr * 1.06 * C(th), SL.metal, W)); } rows.push(row); }
  for (let k = 0; k < R; k++) for (let s = 0; s < SEG; s++) { const s2 = (s + 1) % SEG; G.quad(rows[k][s], rows[k + 1][s], rows[k + 1][s2], rows[k][s2]); }
  const tip = G.v(F.cx, cy + r * 1.22, F.cz - 0.005, SL.metal, W); for (let s = 0; s < SEG; s++) G.tri(rows[R][s], tip, rows[R][(s + 1) % SEG]);
  // brow band, crossing bands and nasal
  const band = []; for (let s = 0; s < SEG; s++) { const th = (s / SEG) * PI * 2; band.push([G.v(F.cx + r * 1.03 * S(th), cy + 0.022, F.cz - 0.005 + r * 1.09 * C(th), SL.gold, W), G.v(F.cx + r * 1.03 * S(th), cy - 0.012, F.cz - 0.005 + r * 1.09 * C(th), SL.gold, W)]); }
  for (let s = 0; s < SEG; s++) { const s2 = (s + 1) % SEG; G.quad(band[s][0], band[s][1], band[s2][1], band[s2][0]); }
  addBox(G, F.cx, cy + r * 0.62, F.cz - 0.005, 0.022, r * 1.1, r * 2.18, SL.gold, W);
  addBox(G, F.cx, cy - 0.05, F.front + 0.018, 0.022, 0.085, 0.012, SL.metal, W);
  if (style === 'guard') for (const sx of [-1, 1]) addBox(G, F.cx + sx * r * 0.98, cy - 0.06, F.cz + 0.01, 0.012, 0.08, 0.07, SL.metal, W);
}
function addCloak(G, pack, len) {
  const I = pack.idx, ch = pack.rest[I.Chest], hips = pack.rest[I.Hips];
  const ext = bandExtent(G.pos, ch.y - 0.16, ch.y - 0.04, ch.x, ch.z, 0.26);
  const top = ch.y + 0.1, bot = Math.max(0.12, top - len); const ROWS = 6, COLS = 10; const rows = [];
  for (let r = 0; r <= ROWS; r++) {
    const t = r / ROWS, y = top + (bot - top) * t;
    const row = [];
    for (let c = 0; c <= COLS; c++) {
      const u = c / COLS, a = (u - 0.5) * PI * (0.95 + 0.25 * t);
      const rr = (ext.rx + 0.05) * (1 + 0.32 * t);
      const x = ch.x + S(a) * rr, z = ch.z - (ext.rzB + 0.03 + 0.05 * t) * C(a) - 0.02;
      const wT = 1 - sm(0.0, 0.45, t), wH = sm(0.3, 0.9, t);
      const w = [[I.Chest, wT], [I.Torso, Math.max(0.0001, 1 - wT - wH)], [I.Hips, wH]];
      row.push(G.v(x, y, z, SL.cloth3, w));
    }
    rows.push(row);
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) G.quad(rows[r][c], rows[r][c + 1], rows[r + 1][c + 1], rows[r + 1][c]);
  // shoulder fold and ring-headed pin
  addBox(G, ch.x + ext.rx * 0.55, top + 0.01, ch.z + 0.03, 0.05, 0.05, 0.02, SL.gold, [[I.Chest, 1]]);
}
function addBackShield(G, pack) {
  const I = pack.idx, ch = pack.rest[I.Chest];
  const ext = bandExtent(G.pos, ch.y - 0.15, ch.y + 0.05, ch.x, ch.z);
  const cz = ch.z - ext.rzB - 0.07, cy = ch.y - 0.1, R = 0.38; const W = [[I.Chest, 1]];
  const SEG = 16; const ctr = G.v(ch.x, cy, cz - 0.01, SL.metal, W); const ring = [], ring2 = [];
  for (let k = 0; k < SEG; k++) { const a = (k / SEG) * PI * 2; const quad = Math.floor(((a + PI / 4) % (PI * 2)) / (PI / 2)) % 2; ring.push(G.v(ch.x + S(a) * R, cy + C(a) * R, cz, quad ? SL.accent : SL.linen, W)); ring2.push(G.v(ch.x + S(a) * R * 1.02, cy + C(a) * R * 1.02, cz + 0.03, SL.leather, W)); }
  // painted face (radial quarters), rim and boss
  for (let k = 0; k < SEG; k++) { const k2 = (k + 1) % SEG; G.tri(ctr, ring[k2], ring[k]); G.quad(ring[k], ring[k2], ring2[k2], ring2[k]); }
  addEllipsoid(G, ch.x, cy, cz - 0.01, 0.07, 0.07, 0.05, SL.metal, W, 8, 3, true).forEach(() => {});
}
function addBrooches(G, pack) {
  const I = pack.idx, ch = pack.rest[I.Chest]; const W = [[I.Chest, 1]];
  const ext = bandExtent(G.pos, ch.y + 0.0, ch.y + 0.06, ch.x, ch.z);
  for (const sx of [-1, 1]) { addEllipsoid(G, ch.x + sx * 0.075, ch.y + 0.03, ch.z + ext.rzF + 0.008, 0.032, 0.042, 0.016, SL.gold, W, 8, 3); }
  // bead string between them
  for (let k = 0; k < 7; k++) { const u = (k / 6) * 2 - 1; addBox(G, ch.x + u * 0.07, ch.y - 0.015 - (1 - u * u) * 0.04, ch.z + ext.rzF + 0.012, 0.014, 0.014, 0.014, k % 2 ? SL.accent : SL.gold, W); }
}

// mid/far LOD by vertex clustering (kept per slot so colours never bleed)
function decimate(g, cell) {
  const P = g.attributes.position.array, SI = g.attributes.aSI.array, SW = g.attributes.aSW.array, SLT = g.attributes.aSlot.array, ID = g.index.array;
  const map = new Map(), remap = new Int32Array(P.length / 3); const np = [], nsi = [], nsw = [], nsl = [];
  for (let i = 0; i < P.length / 3; i++) {
    const k = `${SLT[i]}|${Math.round(P[i * 3] / cell)}|${Math.round(P[i * 3 + 1] / cell)}|${Math.round(P[i * 3 + 2] / cell)}`;
    let j = map.get(k);
    if (j === undefined) { j = np.length / 3; map.set(k, j); np.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); for (let q = 0; q < 4; q++) { nsi.push(SI[i * 4 + q]); nsw.push(SW[i * 4 + q]); } nsl.push(SLT[i]); }
    remap[i] = j;
  }
  const ni = [];
  for (let t = 0; t < ID.length; t += 3) { const a = remap[ID[t]], b = remap[ID[t + 1]], c = remap[ID[t + 2]]; if (a !== b && b !== c && a !== c) ni.push(a, b, c); }
  const o = new THREE.BufferGeometry();
  o.setAttribute('position', new THREE.Float32BufferAttribute(np, 3)); o.setAttribute('aSI', new THREE.Float32BufferAttribute(nsi, 4)); o.setAttribute('aSW', new THREE.Float32BufferAttribute(nsw, 4)); o.setAttribute('aSlot', new THREE.Float32BufferAttribute(nsl, 1));
  o.setIndex(ni); o.computeBoundingSphere(); return o;
}

// ------------------------------------------------------------------ outfits
// Each outfit = parts + procedural garments. Agents pick outfits by role, sex and wealth.
export const OUTFITS = {
  // men
  jarl: { pack: 'men', head: 'King_Head', body: 'King_Body', legs: 'King_Legs', feet: 'King_Feet', hem: 0.62, cloak: 1.05, rich: 1 },
  carl1: { pack: 'men', head: 'Adventurer_Head', body: 'Adventurer_Body', legs: 'Adventurer_Legs', feet: 'Adventurer_Feet', hem: 0.6, helmet: 'guard', shield: 1, cloak: 0.85 },
  carl2: { pack: 'men', head: 'Casual_Head', body: 'King_Body', legs: 'Worker_Legs', feet: 'Adventurer_Feet', hem: 0.58, helmet: 'plain', beard: 'long', shield: 1 },
  carl3: { pack: 'men', head: 'Suit_Head', body: 'Adventurer_Body', legs: 'Adventurer_Legs', feet: 'Worker_Feet', hem: 0.6, helmet: 'plain', beard: 'fork', shield: 1 },
  karl1: { pack: 'men', head: 'Adventurer_Head', body: 'Farmer_Body', legs: 'Farmer_Pants', feet: 'Farmer_Feet', hem: 0.58 },
  karl2: { pack: 'men', head: 'Casual_Head', body: 'Casual2_Body', legs: 'Worker_Legs', feet: 'Worker_Feet', hem: 0.6, beard: 'long' },
  karl3: { pack: 'men', head: 'Suit_Head', body: 'Farmer_Body', legs: 'Suit_Legs', feet: 'Farmer_Feet', hem: 0.62, beard: 'short', cloak: 0.8 },
  karl4: { pack: 'men', head: 'Casual2_Head', body: 'Worker_Body', legs: 'Adventurer_Legs', feet: 'Adventurer_Feet', hem: 0.56, beard: 'braid' },
  karl5: { pack: 'men', head: 'Beach_Head', body: 'Farmer_Body', legs: 'Farmer_Pants', feet: 'Worker_Feet', hem: 0.6, beard: 'fork' },
  karl6: { pack: 'men', head: 'Adventurer_Head', body: 'Casual2_Body', legs: 'Suit_Legs', feet: 'Farmer_Feet', hem: 0.6, beard: 'long' },
  raider1: { pack: 'men', head: 'Casual2_Head', body: 'Adventurer_Body', legs: 'Worker_Legs', feet: 'Adventurer_Feet', hem: 0.58, beard: 'braid', helmet: 'plain', shield: 1 },
  raider2: { pack: 'men', head: 'Beach_Head', body: 'Worker_Body', legs: 'Adventurer_Legs', feet: 'Worker_Feet', hem: 0.6, beard: 'long', shield: 1 },
  thrallM: { pack: 'men', head: 'Beach_Head', body: 'Beach_Body', legs: 'Farmer_Pants', feet: 'Farmer_Feet', hem: 0.55 },
  thrallM2: { pack: 'men', head: 'Casual_Head', body: 'Casual2_Body', legs: 'Suit_Legs', feet: 'Worker_Feet', hem: 0.55, beard: 'short' },
  elderM: { pack: 'men', head: 'King_Head', body: 'Farmer_Body', legs: 'Farmer_Pants', feet: 'Farmer_Feet', hem: 0.68, cloak: 0.9, noCrown: 1 },
  boy: { pack: 'men', head: 'Casual_Head', body: 'Casual2_Body', legs: 'Suit_Legs', feet: 'Farmer_Feet', hem: 0.5 },
  boy2: { pack: 'men', head: 'Beach_Head', body: 'Farmer_Body', legs: 'Farmer_Pants', feet: 'Worker_Feet', hem: 0.5 },
  // women
  lady: { pack: 'women', head: 'Suit_Head', body: 'Medieval_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', dress: 1, apron: 1, brooch: 1, cloak: 1.1 },
  wife1: { pack: 'women', head: 'Soldier_Head', body: 'Medieval_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', dress: 1, apron: 1, brooch: 1 },
  wife2: { pack: 'women', head: 'Formad_Head', body: 'Medieval_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', dress: 1, apron: 1, brooch: 1 },
  wife3: { pack: 'women', head: 'Casual_Head', body: 'Casual_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', dress: 1, apron: 1, brooch: 1 },
  wife4: { pack: 'women', head: 'Suit_Head', body: 'Adventurer_Body', legs: 'Worker_Legs', feet: 'Adventurer_Feet', dress: 1, apron: 1, brooch: 1 },
  wife5: { pack: 'women', head: 'Medieval_Head', body: 'Medieval_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', dress: 1, apron: 1 },
  thrallF: { pack: 'women', head: 'Medieval_Head', body: 'Casual_Body', legs: 'Worker_Legs', feet: 'Worker_Feet', dress: 1 },
  shield1: { pack: 'women', head: 'Soldier_Head', body: 'Adventurer_Body', legs: 'Worker_Legs', feet: 'Adventurer_Feet', hem: 0.58, shield: 1, helmet: 'plain' },
  shield2: { pack: 'women', head: 'Adventurer_Head', body: 'Medieval_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', hem: 0.6, shield: 1 },
  seer: { pack: 'women', head: 'Witch_Head', body: 'Witch_Body', legs: 'Witch_Legs', feet: 'Witch_Feet', cloak: 1.25 },
  girl: { pack: 'women', head: 'Casual_Head', body: 'Medieval_Body', legs: 'Medieval_Legs', feet: 'Medieval_Feet', dress: 1 },
  girl2: { pack: 'women', head: 'Formad_Head', body: 'Casual_Body', legs: 'Worker_Legs', feet: 'Worker_Feet', dress: 1, apron: 1 },
};

function buildOutfit(packs, def) {
  const pack = packs[def.pack]; const G = new GeoBuilder();
  for (const k of ['head', 'body', 'legs', 'feet']) { if (k === 'legs' && def.dress) continue; G.addPart(pack.parts[def[k]]); }
  if (def.noCrown) for (let i = 0; i < G.slot.length; i++) if (G.slot[i] === SL.gold && G.pos[i * 3 + 1] > pack.rest[pack.idx.Head].y + 0.18) G.pos[i * 3 + 1] -= 1000; // crown removed (collapsed out of sight)
  const hips = pack.rest[pack.idx.Hips];
  if (def.hem) addSkirt(G, pack, hips.y + 0.07, def.hem - 0.02 * (def.pack === 'women' ? 1 : 0), 0.32, { trim: true, legFollow: 0.75 });
  if (def.dress) addSkirt(G, pack, hips.y + 0.1, 0.1, 0.62, { rings: 7, trim: true, apron: def.apron ? 0.82 : 0, legFollow: 0.9, shin: true });
  if (def.beard) addBeard(G, pack, def.beard);
  if (def.helmet) addHelmet(G, pack, def.helmet);
  if (def.cloak) addCloak(G, pack, def.cloak);
  if (def.shield) addBackShield(G, pack);
  if (def.brooch) addBrooches(G, pack);
  const g0 = G.geometry();
  return [g0, decimate(g0, 0.03), decimate(g0, 0.075)];
}

// ------------------------------------------------------------------ material
const SKIN_GLSL = /* glsl */`
attribute vec4 aSI; attribute vec4 aSW; attribute float aSlot;
attribute vec4 aFrm;
uniform highp sampler2D uBones;
uniform float uRPB;
mat4 kB(float row, float b) { float bl = floor((row + 0.5) / uRPB); int x = int(bl) * 186 + int(b + 0.5) * 3; int y = int(row + 0.5 - bl * uRPB);
  vec4 r0 = texelFetch(uBones, ivec2(x, y), 0), r1 = texelFetch(uBones, ivec2(x + 1, y), 0), r2 = texelFetch(uBones, ivec2(x + 2, y), 0);
  return mat4(r0.x, r1.x, r2.x, 0.0, r0.y, r1.y, r2.y, 0.0, r0.z, r1.z, r2.z, 0.0, r0.w, r1.w, r2.w, 1.0); }
vec3 kSkin(float row, vec3 p) { vec4 q = vec4(p, 1.0);
  return (kB(row, aSI.x) * q).xyz * aSW.x + (kB(row, aSI.y) * q).xyz * aSW.y + (kB(row, aSI.z) * q).xyz * aSW.z + (kB(row, aSI.w) * q).xyz * aSW.w; }
`;
const SKIN_BEGIN = /* glsl */`
  vec3 transformed = kSkin(aFrm.x, position);
  if (aFrm.z > 0.002) transformed = mix(transformed, kSkin(aFrm.y, position), aFrm.z);
`;
function peopleMaterial(boneTex) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.0, flatShading: true, side: THREE.DoubleSide });
  patch(m, { flat: true });
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh) => {
    base(sh);
    sh.uniforms.uBones = { value: boneTex }; sh.uniforms.uRPB = { value: boneTex.userData.RPB };
    sh.vertexShader = SKIN_GLSL + `attribute vec4 aPalA; attribute vec4 aPalB; flat varying vec3 vCC; flat varying float vMet;
vec3 unpk(float v) { float r = floor(v / 65536.0), g = floor(mod(v, 65536.0) / 256.0), b = mod(v, 256.0); vec3 c = vec3(r, g, b) / 255.0; return c * c; }\n` +
      sh.vertexShader.replace('#include <begin_vertex>', SKIN_BEGIN).replace('void main() {', `void main() {
        int s = int(aSlot + 0.5); vMet = 0.0;
        if (s == 0) vCC = unpk(aPalA.x); else if (s == 1) vCC = unpk(aPalA.y); else if (s == 2) vCC = vec3(0.02, 0.015, 0.012);
        else if (s == 3) vCC = unpk(aPalA.z); else if (s == 4) vCC = unpk(aPalA.w); else if (s == 5) vCC = unpk(aPalB.x); else if (s == 6) vCC = unpk(aPalB.y);
        else if (s == 7) vCC = vec3(0.62, 0.57, 0.46); else if (s == 8) { vCC = vec3(0.42, 0.43, 0.45); vMet = 1.0; } else if (s == 9) { vCC = vec3(0.75, 0.52, 0.2); vMet = 0.8; } else vCC = unpk(aPalB.z);`);
    sh.fragmentShader = 'flat varying vec3 vCC; flat varying float vMet;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= vCC;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.38, vMet);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor = mix(metalnessFactor, 0.85, vMet);');
  };
  m.customProgramCacheKey = () => 'people';
  return m;
}
function depthMaterial(boneTex) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (sh) => { sh.uniforms.uBones = { value: boneTex }; sh.uniforms.uRPB = { value: boneTex.userData.RPB }; sh.vertexShader = SKIN_GLSL + sh.vertexShader.replace('#include <begin_vertex>', SKIN_BEGIN); };
  m.customProgramCacheKey = () => 'peopleDepth';
  return m;
}

// ------------------------------------------------------------------ public
export function loadPeople() {
  const packs = decode();
  const baked = bakeAll(packs);
  const mat = peopleMaterial(baked.tex), dmat = depthMaterial(baked.tex);
  const outfits = {};
  for (const [k, d] of Object.entries(OUTFITS)) outfits[k] = { def: d, lods: buildOutfit(packs, d) };
  // hand frames for held items: bind-pose world of the right/left palm, metres
  const hand = {};
  for (const pn of ['men', 'women']) { const P = packs[pn]; hand[pn] = { R: P.idx.Middle1R, L: P.idx.Middle1L, bindR: P.bindWorld[P.idx.Middle1R], bindL: P.bindWorld[P.idx.Middle1L], head: P.idx.Head }; }
  return { packs, baked, mat, dmat, outfits, hand };
}
// pack a linear rgb colour into one float (sqrt-encoded 8 bits per channel)
export function pk(r, g, b) { const q = (v) => Math.round(Math.sqrt(Math.min(1, Math.max(0, v))) * 255); return q(r) * 65536 + q(g) * 256 + q(b); }
// sample a baked skin matrix row for one bone into a Matrix4 (metres)
export function boneMatrix(baked, row, bone, out) {
  const d = baked.data, o = (row * baked.W + bone * 3) * 4; const e = out.elements;
  e[0] = d[o]; e[4] = d[o + 1]; e[8] = d[o + 2]; e[12] = d[o + 3];
  e[1] = d[o + 4]; e[5] = d[o + 5]; e[9] = d[o + 6]; e[13] = d[o + 7];
  e[2] = d[o + 8]; e[6] = d[o + 9]; e[10] = d[o + 10]; e[14] = d[o + 11];
  e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1; return out;
}
