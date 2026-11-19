// Inspection harness: lineups of every outfit and every animation clip (dist/people.html).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadPeople, OUTFITS, pk, boneMatrix, packLook } from './people.js';

document.getElementById('loading')?.remove();
const q = new URLSearchParams(location.search);
const mode = q.get('mode') || 'outfits', clipName = q.get('clip') || 'idle', u = parseFloat(q.get('u') || '0.3');
const kind = q.get('kind') || 'adult', lod = parseInt(q.get('lod') || '0', 10), view = q.get('view') || 'front';
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(innerWidth, innerHeight); r.toneMapping = THREE.ACESFilmicToneMapping; r.shadowMap.enabled = true;
document.body.style.margin = 0; document.body.appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8a96a2);
scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
const sun = new THREE.DirectionalLight(0xfff0dd, 2.4); sun.position.set(4, 8, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x5a5040 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const P = loadPeople(); console.error('speeds', P.baked.bakes.map((b) => b.pack.name + b.kind + ':' + ['walk', 'run', 'carry', 'limp'].map((k) => b.clips[k].speed?.toFixed(2)).join('/')).join(' '));
const PAL = { skin: [0xe0b394, 0xd8a888, 0xc89070, 0xe8c0a0], hair: [0xd8c08a, 0xb8945a, 0x8a5a2a, 0x5a3a1e, 0xa04a1e, 0x2a1e14], c1: [0x7c1e18, 0x2e4a6e, 0x4e6a3a, 0x8a6a2a, 0x6a2a2a, 0x7a7060], c2: [0x4a3e30, 0x5a4a3a, 0x3a3a40, 0x6a5a40], c3: [0x2c4a6e, 0x6a1a12, 0x3e5a32, 0x6a5440], lea: [0x4a3020, 0x5a3a22, 0x3a2618], acc: [0xb58a36, 0x8e2a1e, 0x2c6e6a, 0xd8d0bc] };
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const pick = (arr, i) => lin(arr[i % arr.length]);
function inst(outfitKey, entries) {
  const O = P.outfits[outfitKey]; const g = O.lods[lod].clone(); const n = entries.length;
  const A = (k) => new THREE.InstancedBufferAttribute(new Float32Array(n * k), k);
  const at = { aFrm: A(4), aFrm2: A(4), aPalA: A(4), aPalB: A(4) };
  for (const k in at) g.setAttribute(k, at[k]);
  const m = new THREE.InstancedMesh(g, P.mat, n); m.customDepthMaterial = P.dmat; m.castShadow = true; m.frustumCulled = false;
  const bake = P.baked.bakes.find((b) => b.pack.name === O.def.pack && b.kind === kind);
  entries.forEach((e, i) => {
    const c = bake.clips[e.clip]; const row = c.row0 + Math.min(c.frames - 1, Math.floor(e.u * c.frames));
    at.aFrm.setXYZW(i, row, row, 0, packLook(e.look || 0, e.pitch || 0, O.def.pack === 'women'));
    at.aPalA.setXYZW(i, pk(...pick(PAL.skin, i + e.k)), pk(...pick(PAL.hair, i * 3 + e.k)), pk(...pick(PAL.c1, i + e.k * 2)), pk(...pick(PAL.c2, i + e.k)));
    at.aPalB.setXYZW(i, pk(...pick(PAL.c3, i + e.k)), pk(...pick(PAL.lea, i)), pk(...pick(PAL.acc, i + e.k)), 0);
    const s = kind === 'child' ? 0.62 : 1;
    m.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(e.x, 0, e.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), e.yaw || 0), new THREE.Vector3(s, s, s)));
  });
  scene.add(m);
  if (q.get('axes')) entries.forEach((e, i) => {
    const c = bake.clips[e.clip]; const row = c.row0 + Math.min(c.frames - 1, Math.floor(e.u * c.frames));
    const H = P.hand[O.def.pack]; const K = boneMatrix(P.baked, row, H.R, new THREE.Matrix4());
    const bw = H.bindR.clone(); const p = new THREE.Vector3(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(); bw.decompose(p, qq, sc); p.multiplyScalar(0.01);
    const hand = new THREE.Matrix4().compose(p, qq, new THREE.Vector3(1, 1, 1)).premultiply(K);
    const inst = new THREE.Matrix4(); m.getMatrixAt(i, inst); hand.premultiply(inst);
    const ax = new THREE.AxesHelper(0.35); ax.matrixAutoUpdate = false; ax.matrix.copy(hand); ax.material.depthTest = false; ax.renderOrder = 9; scene.add(ax);
  });
}
const keys = Object.keys(OUTFITS);
if (mode === 'outfits') {
  const cols = parseInt(q.get('cols') || '10', 10); const only = q.get('only'); const ks = only ? only.split(',') : keys;
  ks.forEach((k, i) => inst(k, [{ x: (i % cols - cols / 2 + 0.5) * (only ? 0.55 : 1.05), z: -Math.floor(i / cols) * 1.6, clip: clipName, u, k: i }]));
} else {
  const outfit = q.get('outfit') || 'karl1'; const bake = P.baked.bakes.find((b) => b.pack.name === OUTFITS[outfit].pack && b.kind === kind);
  const clips = (q.get('clips') || Object.keys(bake.clips).join(',')).split(','); const cols = parseInt(q.get('cols') || '8', 10);
  inst(outfit, clips.map((c, i) => ({ x: (i % cols - cols / 2 + 0.5) * 1.5, z: -Math.floor(i / cols) * 2.6, clip: c, u, k: 1 })));
  clips.forEach((c, i) => { const d = document.createElement('div'); d.textContent = c; d.dataset.x = (i % cols - cols / 2 + 0.5) * 1.5; d.dataset.z = -Math.floor(i / cols) * 2.6; d.className = 'tag'; d.style.cssText = 'position:fixed;font:bold 13px sans-serif;color:#fff;text-shadow:0 0 3px #000'; document.body.appendChild(d); });
  const lbl = document.createElement('div'); lbl.style.cssText = 'position:fixed;left:8px;top:8px;font:12px monospace;color:#000'; lbl.textContent = clips.join(' | '); document.body.appendChild(lbl);
}
const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 200);
const views = { front: [0, 3.2, 11], side: [11, 2.4, -1.5], close: [0, 1.6, 3.2], back: [0, 3, -13] };
cam.position.set(...views[view]); const ctr = new OrbitControls(cam, r.domElement); ctr.target.set(0, view === 'close' ? 1.4 : 0.9, view === 'back' ? -2 : -1.5); ctr.update();
if (q.get('cx')) { cam.position.set(+q.get('cx'), +q.get('cy'), +q.get('cz')); ctr.target.set(+q.get('tx'), +q.get('ty'), +q.get('tz')); ctr.update(); }
const loop = () => { requestAnimationFrame(loop); r.render(scene, cam); for (const d of document.querySelectorAll('.tag')) { const v = new THREE.Vector3(+d.dataset.x, 2.05, +d.dataset.z).project(cam); d.style.left = ((v.x * 0.5 + 0.5) * innerWidth - 20) + 'px'; d.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px'; } }; loop();
window.done = true;
{

  const b = P.baked.bakes[0]; const row = b.clips.idle.row0; const m = new THREE.Matrix4();
  const out = [];
  for (const bi of [0, 1, 2, 7, 9]) { boneMatrix(P.baked, row, bi, m); out.push(bi + ':' + m.elements.map((v) => v.toFixed(2)).join(',')); }
  const g = P.outfits.karl1.lods[0]; const p = g.attributes.position; out.push('v0 ' + [p.getX(0), p.getY(0), p.getZ(0)].map((v) => v.toFixed(3)) + ' si ' + Array.from(g.attributes.aSI.array.slice(0, 4)) + ' sw ' + Array.from(g.attributes.aSW.array.slice(0, 4)).map((v) => v.toFixed(2)));
  const pk0 = P.packs.men; out.push('A ' + pk0.A.elements.map((v) => v.toFixed(2)).join(','));
  out.push('bindHips ' + pk0.bindWorld[2].elements.map((v) => v.toFixed(1)).join(','));
  console.error(out.join('\n'));
}
{
  const g = P.outfits.karl1.lods[0];
  
  const ins = scene.children.filter((o) => o.isInstancedMesh);
  console.error('instanced', ins.length, ins[0]?.count, JSON.stringify(Array.from(ins[0].geometry.attributes.aFrm.array.slice(0, 4))), JSON.stringify(Array.from(ins[0].instanceMatrix.array.slice(12, 15))), 'verts', g.attributes.position.count, 'idx', g.index.count, 'bs', JSON.stringify(g.boundingSphere));
}
if (q.get('dbg')) {
  const pack = P.packs[q.get('pack') || 'women']; const b = P.baked.bakes.find((x) => x.pack === pack && x.kind === 'adult');
  const c = b.clips[q.get('dbg')]; const m = new THREE.Matrix4(); const out = [];
  for (const bn of ['ShoulderR', 'UpperArmR', 'LowerArmR', 'WristR', 'UpperArmL', 'LowerArmL', 'WristL', 'Head']) { const i = pack.idx[bn]; boneMatrix(P.baked, c.row0, i, m); const v = pack.rest[i].clone().applyMatrix4(m); out.push(bn + ':' + v.toArray().map((x) => x.toFixed(2)).join(',') + ' lp' + Array.from(pack.clips.Idle.restPos.slice(i * 3, i * 3 + 3)).map((x) => x.toFixed(1)).join(',')); }
  console.error('DBG ' + out.join(' | '));
}
