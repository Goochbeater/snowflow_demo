// Offline asset build: extracts villagers (modular CC0 characters), their rig and animation clips
// from the source FBX packs into one compact binary, src/assets/people.bin.
//   node tools/build-people.mjs <men.fbx> <women.fbx>
import fs from 'fs';
globalThis.self = globalThis; globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ style: {} }), createElement: () => ({ style: {} }) };
const THREE = await import('../node_modules/three/build/three.module.js');
const { mergeVertices } = await import('../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js');
const { FBXLoader, getTree, getConn } = await import('./FBXLoaderX.js');
const fflate = await import('../node_modules/three/examples/jsm/libs/fflate.module.js');

const [menPath, womenPath] = process.argv.slice(2);
const SLOTS = { skin: 0, hair: 1, eye: 2, cloth1: 3, cloth2: 4, cloth3: 5, leather: 6, linen: 7, metal: 8, gold: 9, accent: 10 };
const CLIPS = ['Idle', 'Idle_Neutral', 'Walk', 'Run', 'Interact', 'Sword_Slash', 'Idle_Sword', 'Wave', 'Death', 'Punch_Left', 'Punch_Right', 'HitRecieve', 'Kick_Right', 'Roll'];
const FPS = 30;
const PACKS = {
  men: { path: menPath, parts: ['King_Head', 'Adventurer_Head', 'Casual_Head', 'Casual2_Head', 'Suit_Head', 'Beach_Head', 'Farmer_Head',
    'King_Body', 'Farmer_Body', 'Adventurer_Body', 'Worker_Body', 'Casual2_Body', 'Casual_Body', 'Beach_Body',
    'King_Legs', 'Farmer_Pants', 'Worker_Legs', 'Adventurer_Legs', 'Suit_Legs',
    'King_Feet', 'Farmer_Feet', 'Worker_Feet', 'Adventurer_Feet'] },
  women: { path: womenPath, parts: ['Soldier_Head', 'Formad_Head', 'Suit_Head', 'Casual_Head', 'Adventurer_Head', 'Medieval_Head', 'Witch_Head',
    'Medieval_Body', 'Adventurer_Body', 'Witch_Body', 'Casual_Body', 'Worker_Body',
    'Medieval_Legs', 'Witch_Legs', 'Worker_Legs',
    'Medieval_Feet', 'Witch_Feet', 'Adventurer_Feet', 'Worker_Feet'] },
};
// material -> palette slot, with per-part-kind defaults
function slotFor(mat, partName) {
  const kind = partName.split('_').pop().replace('Pants', 'Legs');
  const m = mat.replace(/[^A-Za-z]/g, '');
  if (/^Skin/.test(m)) return SLOTS.skin;
  if (/^Hair|Eyebrows|Moustache/.test(m)) return SLOTS.hair;
  if (m === 'Eye') return SLOTS.eye;
  if (/^Gold|Earrings/.test(m)) return SLOTS.gold;
  if (/^Metal/.test(m)) return partName === 'Medieval_Body' ? 255 : SLOTS.metal;
  if (partName === 'Medieval_Head' && m === 'White') return SLOTS.hair;
  if (partName === 'Medieval_Head' && m === 'Black') return SLOTS.cloth3;
  if (partName === 'King_Body' && m === 'Blue') return SLOTS.cloth1;
  if (partName === 'Farmer_Head') return m === 'Red' ? SLOTS.accent : SLOTS.cloth3;
  if (partName === 'Witch_Legs' && m === 'Gold') return SLOTS.accent;
  if (kind === 'Feet') return SLOTS.leather;
  if (/^(White|Beige)$/.test(m)) return partName === 'Casual_Body' ? SLOTS.cloth1 : SLOTS.linen;
  if (/Brown/.test(m) || m === 'WorkerVest') return kind === 'Legs' && /^Brown(02)?$/.test(m) ? SLOTS.cloth2 : SLOTS.leather;
  if (kind === 'Head') return SLOTS.cloth3;
  if (kind === 'Legs') return SLOTS.cloth2;
  if (/LightGreen/.test(m)) return SLOTS.accent;
  return SLOTS.cloth1;
}

const out = { packs: {}, slots: SLOTS, fps: FPS };
const blobs = []; let blobLen = 0;
const addBlob = (typed) => { const pad = (4 - (blobLen % 4)) % 4; if (pad) { blobs.push(new Uint8Array(pad)); blobLen += pad; } const off = blobLen; const u8 = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength); blobs.push(u8.slice()); blobLen += u8.byteLength; return { o: off, n: typed.length, t: typed.constructor.name }; };

for (const [packName, cfg] of Object.entries(PACKS)) {
  const buf = fs.readFileSync(cfg.path);
  const root = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  root.updateMatrixWorld(true);
  // true hierarchy from the FBX connection table
  const tree = getTree(), conns = getConn(), models = tree.Objects.Model;
  const parentOf = {};
  for (const id in models) {
    const m = models[id]; const c = conns.get(parseInt(id));
    const p = (c?.parents || []).map((q) => models[q.ID]).find(Boolean);
    parentOf[m.attrName.replace(/\./g, '')] = p ? p.attrName.replace(/\./g, '') : null;
  }
  const meshes = {}; root.traverse((o) => { if (o.isMesh) meshes[o.name] = o; });
  const ref = Object.values(meshes).find((o) => o.isSkinnedMesh && /Body/.test(o.name));
  const boneNames = ref.skeleton.bones.map((b) => b.name);
  const parents = boneNames.map((n) => boneNames.indexOf(parentOf[n]));
  const arm = root.getObjectByName('CharacterArmature');
  const A = arm.matrixWorld.clone();
  const boneInv = new Float32Array(boneNames.length * 16);
  ref.skeleton.boneInverses.forEach((m, i) => boneInv.set(m.elements, i * 16));
  // clips: per frame local TRS
  const clips = [];
  for (const cn of CLIPS) {
    const clip = root.animations.find((a) => a.name.split('|')[1] === cn);
    if (!clip) { console.warn('missing clip', cn); continue; }
    const frames = Math.max(2, Math.round(clip.duration * FPS));
    const nb = boneNames.length;
    const quat = new Int16Array(frames * nb * 4);
    const posBones = [];
    const tr = {};
    for (const t of clip.tracks) { const [bn, prop] = t.name.split('.'); (tr[bn] = tr[bn] || {})[prop] = t; }
    for (let b = 0; b < nb; b++) { const p = tr[boneNames[b]]?.position; if (p && p.times.length > 2) posBones.push(b); }
    const pos = new Float32Array(frames * posBones.length * 3);
    const restPos = new Float32Array(nb * 3), restScale = new Float32Array(nb * 3);
    const q = new Float32Array(4), v = new Float32Array(3);
    for (let b = 0; b < nb; b++) {
      const t = tr[boneNames[b]];
      if (t?.position) { t.position.createInterpolant(v).evaluate(0); restPos.set(v, b * 3); }
      if (t?.scale) { t.scale.createInterpolant(v).evaluate(0); restScale.set(v, b * 3); } else restScale.set([1, 1, 1], b * 3);
    }
    for (let f = 0; f < frames; f++) {
      const time = Math.min(clip.duration, f / FPS);
      for (let b = 0; b < nb; b++) {
        const t = tr[boneNames[b]];
        if (t?.quaternion) t.quaternion.createInterpolant(q).evaluate(time); else q.set([0, 0, 0, 1]);
        const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
        for (let k = 0; k < 4; k++) quat[(f * nb + b) * 4 + k] = Math.round((q[k] / l) * 32767);
      }
      posBones.forEach((b, k) => { tr[boneNames[b]].position.createInterpolant(v).evaluate(time); pos.set(v, (f * posBones.length + k) * 3); });
    }
    clips.push({ name: cn, frames, posBones, quat: addBlob(quat), pos: addBlob(pos), restPos: addBlob(restPos), restScale: addBlob(restScale) });
  }
  // parts: rest-pose geometry in metres, Y up, skinned to the canonical bone order
  const parts = {};
  for (const pn of cfg.parts) {
    const mesh = meshes[pn]; if (!mesh) { console.warn('missing part', pn); continue; }
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    const n = g.attributes.position.count;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const slot = new Uint8Array(n);
    if (g.groups.length) for (const gr of g.groups) { const s = slotFor(mats[gr.materialIndex].name, pn); for (let i = gr.start; i < gr.start + gr.count && i < n; i++) slot[i] = s; }
    else slot.fill(slotFor(mats[0].name, pn));
    const M = mesh.bindMatrix; const S = 0.01;
    const P = g.attributes.position, N = g.attributes.normal;
    const nm = new THREE.Matrix3().getNormalMatrix(M);
    const p3 = new THREE.Vector3(), n3 = new THREE.Vector3();
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p3.fromBufferAttribute(P, i).applyMatrix4(M).multiplyScalar(S); pos.set([p3.x, p3.y, p3.z], i * 3);
      n3.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([n3.x, n3.y, n3.z], i * 3);
    }
    // canonical bone indices
    const map = mesh.skeleton.bones.map((b) => boneNames.indexOf(b.name));
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const sIdx = new Float32Array(n * 4), sW = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) { sIdx[i] = map[si.array[i]]; sW[i] = sw.array[i]; }
    const ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    ng.setAttribute('skinIndex', new THREE.BufferAttribute(sIdx, 4));
    ng.setAttribute('skinWeight', new THREE.BufferAttribute(sW, 4));
    ng.setAttribute('slot', new THREE.BufferAttribute(new Float32Array(slot), 1));
    const mg = mergeVertices(ng, 1e-5);
    const vc = mg.attributes.position.count;
    // quantise
    const qp = new Int16Array(vc * 3), qi = new Uint8Array(vc * 4), qw = new Uint8Array(vc * 4), qs = new Uint8Array(vc);
    for (let i = 0; i < vc; i++) {
      for (let k = 0; k < 3; k++) { qp[i * 3 + k] = Math.round(mg.attributes.position.array[i * 3 + k] * 10000); }
      let ws = 0; for (let k = 0; k < 4; k++) ws += mg.attributes.skinWeight.array[i * 4 + k];
      for (let k = 0; k < 4; k++) { qi[i * 4 + k] = mg.attributes.skinIndex.array[i * 4 + k]; qw[i * 4 + k] = Math.round((mg.attributes.skinWeight.array[i * 4 + k] / (ws || 1)) * 255); }
      qs[i] = mg.attributes.slot.array[i];
    }
    const idx = mg.index.array; const qidx = vc < 65536 ? new Uint16Array(idx) : new Uint32Array(idx);
    parts[pn] = { v: vc, t: idx.length / 3, pos: addBlob(qp), si: addBlob(qi), sw: addBlob(qw), slot: addBlob(qs), idx: addBlob(qidx) };
  }
  // the pack sword, rebound to the right hand
  const sw = meshes.Sword;
  if (sw) {
    const g = sw.geometry.index ? sw.geometry.toNonIndexed() : sw.geometry.clone();
    const n = g.attributes.position.count; const p3 = new THREE.Vector3(), out3 = new Float32Array(n * 3);
    const M = sw.isSkinnedMesh ? sw.bindMatrix : sw.matrixWorld;
    for (let i = 0; i < n; i++) { p3.fromBufferAttribute(g.attributes.position, i).applyMatrix4(M).multiplyScalar(0.01); out3.set([p3.x, p3.y, p3.z], i * 3); }
    out.packs[packName + '_sword_note'] = sw.isSkinnedMesh ? 'skinned' : 'child-of-hand';
  }
  out.packs[packName] = { bones: boneNames, parents, A: Array.from(A.elements), boneInv: addBlob(boneInv), clips, parts };
  console.log(packName, 'bones', boneNames.length, 'clips', clips.length, 'parts', Object.keys(parts).length, 'tris', Object.values(parts).reduce((s, p) => s + p.t, 0));
}
const json = new TextEncoder().encode(JSON.stringify(out));
const head = new Uint32Array([0x4c50504b, json.length]);
const pad = (4 - (json.length % 4)) % 4;
const total = new Uint8Array(8 + json.length + pad + blobLen);
total.set(new Uint8Array(head.buffer), 0); total.set(json, 8);
let off = 8 + json.length + pad; for (const b of blobs) { total.set(b, off); off += b.byteLength; }
const z = fflate.deflateSync(total, { level: 9 });
fs.writeFileSync(new URL('../src/assets/people.bin', import.meta.url), z);
console.log('wrote people.bin', (total.length / 1024).toFixed(0), 'KB raw,', (z.length / 1024).toFixed(0), 'KB deflated');
