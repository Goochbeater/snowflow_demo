// Renders every simulated villager as a dressed, rigged, GPU-animated character.
// Outfits are chosen from role/sex/age/fate; clips are chosen from what the agent is actually doing.
import * as THREE from 'three';
import { AN, CA } from './sim.js';
import { loadPeople, boneMatrix, pk } from './people.js';
import { ItemRenderer } from './crowd.js';
import { Fauna } from './fauna.js';
import { hash2, RNG, lerp, clamp } from './util.js';

const LOD_D = [42, 190];
// natural-dye palette (sRGB hex) — madder, woad, weld, walnut, undyed wool
const PAL = {
  skin: [0xe9c2a4, 0xe0b394, 0xd8a888, 0xf0cdb2, 0xcf9c7c, 0xe6b89a, 0xc89070, 0xb88060],
  hair: [0xe0c890, 0xd8b878, 0xc0a060, 0xa87a40, 0x8a5a2a, 0x6a4020, 0x4a2c18, 0x2a1c12, 0xa84a1e, 0xc0602a, 0x8a3a18],
  grey: [0xb8b4ac, 0xd8d4cc, 0x9a948a],
  rich: [0x8a1e18, 0x6a1612, 0x24406e, 0x1c2e56, 0x2e5a3a, 0x6a2a5a, 0x9a6a1e],
  dyed: [0x8a3a26, 0x7a2e22, 0x3e5a7a, 0x4a6a8a, 0x5e6e3a, 0x7a7040, 0xa08a4a, 0x6a4a30, 0x8a6a3a, 0x5a6e5a, 0x9a5a3a],
  undyed: [0x8a8070, 0x7a7262, 0x9a9282, 0x6e665a, 0xa8a090, 0x5e584e],
  trous: [0x4a3e30, 0x5a4a3a, 0x3a3a40, 0x6a5a40, 0x55504a, 0x46423a, 0x5a5240],
  leather: [0x4a3020, 0x5a3a22, 0x3a2618, 0x6a4a2a, 0x2e2018],
  trim: [0xc8a040, 0xa82a1e, 0x2a5a8a, 0x3e7a3a, 0xd8d0bc, 0xb8602a, 0x6a2a6a],
};
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
function chooseOutfit(a, r) {
  const f = a.female, role = a.role;
  if (role === 'jarl') return 'jarl';
  if (role === 'lady') return 'lady';
  if (role === 'seer') return 'seer';
  if (a.age < 15) return f ? (r < 0.55 ? 'girl' : 'girl2') : (r < 0.5 ? 'boy' : 'boy2');
  if (role === 'shieldmaiden') return r < 0.5 ? 'shield1' : 'shield2';
  if (role === 'housecarl') return ['carl1', 'carl2', 'carl3'][Math.floor(r * 3)];
  if (role === 'thrall') return f ? 'thrallF' : (r < 0.5 ? 'thrallM' : 'thrallM2');
  if (role === 'elder') return f ? 'wife5' : 'elderM';
  if (f) return ['wife1', 'wife2', 'wife3', 'wife4', 'wife1', 'wife2', 'wife5'][Math.floor(r * 7)];
  if (a.fate !== 'home') return ['raider1', 'raider2', 'carl3', 'karl4', 'karl5', 'raider1', 'karl2'][Math.floor(r * 7)];
  if (role === 'smith') return 'karl4';
  if (role === 'gothi' || role === 'lawspeaker' || role === 'skald') return r < 0.5 ? 'karl3' : 'elderM';
  return ['karl1', 'karl2', 'karl3', 'karl4', 'karl5', 'karl6'][Math.floor(r * 6)];
}
function paletteFor(a, rng, outfit) {
  const P = (arr) => lin(arr[Math.floor(rng.next() * arr.length)]);
  const rich = ['jarl', 'lady', 'carl1', 'carl2', 'carl3'].includes(outfit) || a.role === 'skald';
  const thrall = a.role === 'thrall';
  const skin = P(PAL.skin);
  const hair = a.age > 58 ? P(PAL.grey) : P(PAL.hair);
  const c1 = thrall ? P(PAL.undyed) : rich ? P(PAL.rich) : rng.next() < 0.75 ? P(PAL.dyed) : P(PAL.undyed);
  const c2 = thrall ? P(PAL.undyed) : P(PAL.trous);
  const c3 = thrall ? P(PAL.undyed) : rich ? P(PAL.rich) : rng.next() < 0.6 ? P(PAL.dyed) : P(PAL.undyed);
  const lea = P(PAL.leather), acc = thrall ? P(PAL.undyed) : P(PAL.trim);
  if (outfit === 'jarl') { c1[0] = 0.32; c1[1] = 0.02; c1[2] = 0.02; c3[0] = 0.05; c3[1] = 0.07; c3[2] = 0.2; }
  if (outfit === 'seer') { c1[0] = 0.04; c1[1] = 0.04; c1[2] = 0.06; c3[0] = 0.02; c3[1] = 0.025; c3[2] = 0.04; }
  return [pk(...skin), pk(...hair), pk(...c1), pk(...c2), pk(...c3), pk(...lea), pk(...acc), 0];
}
const TWO_HAND = new Set([CA.chest, CA.sack, CA.cask, CA.cloth, CA.weapons, CA.plate, CA.barrel, CA.cauldron, CA.net]);
const HIGH = new Set([CA.bench, CA.table]);
const SHOULDER = new Set([CA.log, CA.body]);
const ONE_HAND = new Set([CA.horn, CA.torch, CA.stick, CA.bucket, CA.fish, 19, 20, 21]);

export class Villagers {
  constructor(scene, S, grid, sim) {
    this.scene = scene; this.grid = grid; this.sim = sim;
    const PP = loadPeople(); this.PP = PP;
    this.N = S.agents.length;
    // appearance
    this.look = [];
    const counts = {};
    for (const a of S.agents) {
      const rng = new RNG(S.seed * 7919 + a.id * 131);
      const outfit = chooseOutfit(a, rng.next());
      const kind = a.age < 15 ? 'child' : a.age > 58 ? 'elder' : 'adult';
      const pack = PP.outfits[outfit].def.pack;
      const bake = PP.baked.bakes.find((b) => b.pack.name === pack && b.kind === kind);
      const scale = (a.age < 15 ? 0.5 + a.age * 0.03 : 1) * (a.female ? 0.97 : 1.0) * (0.96 + rng.next() * 0.08);
      const pal = paletteFor(a, rng, outfit);
      counts[outfit] = (counts[outfit] || 0) + 1;
      this.look.push({ outfit, kind, pack, bake, scale, pal, yaw: 0, clip: 'idle', t: rng.next() * 3, prev: null, prevT: 0, fade: 0, alt: rng.next() < 0.5, dist: 0, vis: false, wx: 0, wy: 0, wz: 0, phase0: rng.next() * 6.28 });
    }
    // instanced meshes per outfit per LOD
    this.buckets = {};
    for (const [key, O] of Object.entries(PP.outfits)) {
      const cap = counts[key] || 0; if (!cap) continue;
      this.buckets[key] = O.lods.map((g0, lod) => {
        const g = g0.clone();
        const fr = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); fr.setUsage(THREE.DynamicDrawUsage);
        const pa = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); pa.setUsage(THREE.DynamicDrawUsage);
        const pb = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); pb.setUsage(THREE.DynamicDrawUsage);
        g.setAttribute('aFrm', fr); g.setAttribute('aPalA', pa); g.setAttribute('aPalB', pb);
        const m = new THREE.InstancedMesh(g, PP.mat, cap); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        m.customDepthMaterial = PP.dmat; m.castShadow = lod < 2; m.receiveShadow = lod === 0; m.frustumCulled = false; m.count = 0;
        scene.add(m);
        return { m, fr, pa, pb, n: 0 };
      });
    }
    // hand frames (metres)
    this.hands = {};
    for (const pn of ['men', 'women']) {
      const H = PP.hand[pn]; const out = {};
      for (const s of ['R', 'L']) { const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); H['bind' + s].decompose(p, q, sc); out[s] = new THREE.Matrix4().compose(p.multiplyScalar(0.01), q, new THREE.Vector3(1, 1, 1)); out['b' + s] = H[s]; }
      this.hands[pn] = out;
    }
    this.align = new THREE.Matrix4().makeRotationZ(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(0, 0.09, -0.02));
    this.items = new ItemRenderer(scene, S);
    this.animals = new Fauna(scene, grid, S);
    this.heldTorches = [];
    this._m = new THREE.Matrix4(); this._k = new THREE.Matrix4(); this._h = new THREE.Matrix4(); this._i = new THREE.Matrix4(); this._v = new THREE.Vector3(); this._v2 = new THREE.Vector3();
  }
  clipFor(a, L) {
    const carry = a.carry || (a.item >= 0 ? a.itemCk : 0);
    const moving = a.anim === AN.walk || a.anim === AN.run || a.anim === AN.carry || a.anim === AN.stumble || a.anim === AN.limp;
    if (carry && !ONE_HAND.has(carry) && (moving || a.anim === AN.idle)) {
      if (HIGH.has(carry)) return 'carryHigh';
      if (SHOULDER.has(carry)) return 'carryShoulder';
      return moving ? 'carry' : 'carryIdle';
    }
    const feast = a.act === 'feast' || a.act === 'jarlSeat';
    switch (a.anim) {
      case AN.walk: case AN.carry: return 'walk';
      case AN.run: return 'run';
      case AN.stumble: return 'stumble';
      case AN.limp: return 'limp';
      case AN.hammer: return ['baker', 'brewer', 'dyer', 'tanner', 'fisher', 'thrall', 'wife', 'weaver', 'netter', 'woodsman', 'karl'].includes(a.role) ? 'work' : 'hammer';
      case AN.drink: return feast ? 'sitDrink' : 'drink';
      case AN.cheer: return feast ? 'sitTalk' : L.alt ? 'cheer' : 'wave';
      case AN.wrestle: return a.act === 'argue' ? 'fight' : 'wrestle';
      case AN.sit: return 'sit';
      case AN.lie: return 'lie';
      case AN.kneel: return 'kneel';
      case AN.argue: return 'argue';
      case AN.haul: return 'haul';
      case AN.dance: return 'dance';
      case AN.spar: return a.age < 15 ? 'hammer' : L.alt ? 'hammer' : 'fight';
      case AN.row: return 'row';
      case AN.slump: return 'slump';
      case AN.music: return 'lyre';
      case AN.speak: return 'speak';
      case AN.embrace: return 'embrace';
      case AN.weave: return 'weave';
      case AN.point: return 'point';
      case AN.mourn: return 'mourn';
      default: return L.alt ? 'idle2' : 'idle';
    }
  }
  heldKind(a, clip) {
    if (a.carry) return a.carry;
    if (a.item >= 0) return a.itemCk;
    if (a.anim === AN.spar) return a.age < 15 ? CA.stick : 19;
    if (clip === 'hammer' && (a.role === 'smith' || a.role === 'shipwright')) return 20;
    if (a.act === 'perform') return 0;
    return 0;
  }
  update(S, alpha, t, dt, camera, P, fleet) {
    const A = S.agents, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    for (const k in this.buckets) for (const b of this.buckets[k]) b.n = 0;
    const items = this.items; items.begin();
    this.heldTorches.length = 0; this.rendered = 0;
    const tmpV = this._v;
    for (let i = 0; i < this.N; i++) {
      const a = A[i], L = this.look[i];
      a.itemCk = a.item >= 0 && S.items[a.item] ? S.items[a.item].ck : 0;
      if (!a.alive || a.inside || a.dens > P.density) { L.vis = false; continue; }
      // position & heading
      let x, y, z, yaw;
      if (a.aboard) {
        const sh = S.ships[a.ship], fs = fleet.ships[a.ship];
        const [lx, lz] = this.sim.seatOf(sh, a);
        tmpV.set(lx, a.anim === AN.row || a.anim === AN.slump ? -0.3 : -0.25, lz).applyMatrix4(fs.g.matrixWorld);
        x = tmpV.x; y = tmpV.y; z = tmpV.z; yaw = sh.yaw + (a.anim === AN.row ? Math.PI : 0); L.yaw = yaw;
      } else {
        x = lerp(a.px, a.x, alpha); z = lerp(a.pz, a.z, alpha);
        if (a.act === 'embrace' && A[a.p]) { const b = A[a.p]; const dx = x - b.x, dz = z - b.z, d = Math.hypot(dx, dz) || 1; if (d > 0.55) { const m = (d - 0.55) / 2; x -= (dx / d) * m; z -= (dz / d) * m; } }
        y = !isNaN(a.ey) ? a.ey : this.grid.get(x, z);
        const ty = Math.atan2(a.fx, a.fz);
        let d = ty - L.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        L.yaw += d * Math.min(1, dt * 7); yaw = L.yaw;
      }
      const moved = Math.hypot(x - (L.rx ?? x), z - (L.rz ?? z)); L.rx = x; L.rz = z;
      L.wx = x; L.wy = y; L.wz = z; L.vis = true; this.rendered++;
      const d2 = (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2;
      if (d2 > 900 * 900) continue;
      const lod = d2 < LOD_D[0] ** 2 ? 0 : d2 < LOD_D[1] ** 2 ? 1 : 2;
      // animation state
      const clip = a.aboard && a.anim === AN.idle ? 'sit' : this.clipFor(a, L);
      if (clip !== L.clip) { L.prev = L.clip; L.prevT = L.t; L.fade = 1; L.clip = clip; L.t = 0; }
      const C = L.bake.clips[clip];
      let rate = 1;
      if (clip === 'walk' || clip === 'carry' || clip === 'stumble' || clip === 'limp' || clip === 'carryHigh' || clip === 'carryShoulder') rate = dt > 0 ? clamp(moved / dt / (1.3 * L.scale), 0.3, 2.2) : 1;
      else if (clip === 'run') rate = dt > 0 ? clamp(moved / dt / (3.4 * L.scale), 0.4, 1.8) : 1;
      if (clip === 'row' && a.aboard) { L.t = (fleet.ships[a.ship].oarPhase / (Math.PI * 2)) * C.dur; } else L.t += dt * rate * (P.speed === 0 ? 0 : 1);
      if (L.fade > 0) { L.fade = Math.max(0, L.fade - dt * 4.5); L.prevT += dt; }
      const fA = C.row0 + (C.loop ? Math.floor((((L.t / C.dur) % 1) + 1) % 1 * C.frames) : Math.min(C.frames - 1, Math.floor(L.t / C.dur * C.frames)));
      let fB = fA, wB = 0;
      if (L.fade > 0 && L.prev) { const Cp = L.bake.clips[L.prev]; fB = Cp.row0 + (Cp.loop ? Math.floor((((L.prevT / Cp.dur) % 1) + 1) % 1 * Cp.frames) : Cp.frames - 1); wB = L.fade * L.fade * (3 - 2 * L.fade); }
      // write instance
      const B = this.buckets[L.outfit][lod]; const j = B.n++;
      const s = L.scale, c = Math.cos(yaw), sn = Math.sin(yaw), e = B.m.instanceMatrix.array, o = j * 16;
      e[o] = c * s; e[o + 1] = 0; e[o + 2] = -sn * s; e[o + 3] = 0; e[o + 4] = 0; e[o + 5] = s; e[o + 6] = 0; e[o + 7] = 0;
      e[o + 8] = sn * s; e[o + 9] = 0; e[o + 10] = c * s; e[o + 11] = 0; e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1;
      B.fr.array[j * 4] = fA; B.fr.array[j * 4 + 1] = fB; B.fr.array[j * 4 + 2] = wB;
      B.pa.array.set(L.pal.slice(0, 4), j * 4); B.pb.array.set(L.pal.slice(4, 8), j * 4);
      // held items, attached to the hands of the posed skeleton
      const hk = this.heldKind(a, clip);
      if (hk) {
        const inst = this._i.fromArray(e, o);
        const Hs = this.hands[L.pack];
        const handW = (side) => this._h.multiplyMatrices(boneMatrix(this.PP.baked, fA, Hs['b' + side], this._k), Hs[side]).premultiply(inst);
        if (ONE_HAND.has(hk)) {
          const hw = handW('R');
          if (hk === CA.torch || hk === CA.bucket || hk === CA.fish) {
            const p = this._v2.setFromMatrixPosition(hw);
            const m = this._m.makeRotationY(yaw); m.scale(this._v.set(s, s, s)); m.setPosition(p.x, p.y - (hk === CA.torch ? 0.15 * s : 0), p.z);
            items.putM(hk, m.elements);
            if (hk === CA.torch) this.heldTorches.push([p.x, p.y + 0.48 * s, p.z]);
          } else items.putM(hk, this._m.multiplyMatrices(hw, this.align).elements);
        } else {
          const r = this._v.setFromMatrixPosition(handW('R')); const rx = r.x, ry = r.y, rz = r.z;
          const l = this._v.setFromMatrixPosition(handW('L'));
          const mx = (rx + l.x) / 2, my = (ry + l.y) / 2, mz = (rz + l.z) / 2;
          const m = this._m.makeRotationY(yaw + (HIGH.has(hk) || hk === CA.body ? Math.PI / 2 : 0));
          if (SHOULDER.has(hk)) { m.makeRotationY(yaw + (hk === CA.body ? Math.PI / 2 : 0)); m.setPosition(rx, ry - 0.12 * s, rz); }
          else m.setPosition(mx, my - (HIGH.has(hk) ? 0.55 : 0.28) * s, mz);
          items.putM(hk, m.elements);
        }
      }
    }
    for (const k in this.buckets) for (const B of this.buckets[k]) {
      B.m.count = B.n; B.m.instanceMatrix.needsUpdate = true; B.fr.needsUpdate = true; B.pa.needsUpdate = true; B.pb.needsUpdate = true;
    }
    items.world(S, fleet, this.grid);
    items.end();
    this.animals.update(S, alpha, t, P, this.grid, camera, dt, this.sim);
  }
}
