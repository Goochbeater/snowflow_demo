// Fixed-timestep, seeded agent simulation of the evening the fleet comes home.
// All state lives in the plain object S so it can be snapshotted (structuredClone) for scrubbing.
import { RNG, hash2, clamp, lerp, smoothstep, makeName, SHIP_NAMES, RAID_TARGETS, resample } from './util.js';
import { fjordLine } from './terrain.js';

export const DT = 0.1;
export const ARC_END = 2200;
const K_FLEET = 1, K_FEAST = 2, K_BEACH = 4, K_PYRE = 8, K_THING = 16;
export const KBITS = { K_FLEET, K_FEAST, K_BEACH, K_PYRE, K_THING };
// animation codes
export const AN = { idle: 0, walk: 1, run: 2, hammer: 3, drink: 4, cheer: 5, wrestle: 6, sit: 7, lie: 8, kneel: 9, argue: 10, haul: 11, carry: 12, limp: 13, dance: 14, spar: 15, row: 16, slump: 17, music: 18, speak: 19, embrace: 20, weave: 21, stumble: 22, point: 23, mourn: 24 };
// carry codes
export const CA = { none: 0, log: 1, bucket: 2, fish: 3, chest: 4, sack: 5, cask: 6, cloth: 7, weapons: 8, plate: 9, body: 10, bench: 11, barrel: 12, cauldron: 13, table: 14, horn: 15, torch: 16, stick: 17, net: 18 };
const LOOT_KINDS = [
  ['chest', 'iron-bound chest of hacksilver', 60], ['sack', 'sack of coin and arm-rings', 45], ['cask', 'cask of Rhenish wine', 25],
  ['cloth', 'bolt of dyed Frankish wool', 18], ['weapons', 'bundle of Frankish swords', 55], ['plate', 'gilt church plate and a chalice', 70],
  ['sack', 'sack of salt and spices', 15], ['cloth', 'silk altar-cloth', 35], ['cask', 'barrel of honey', 12], ['weapons', 'mail byrnie and helms', 50],
];
const ROLE_LABEL = {
  jarl: 'Jarl', lady: "Jarl's wife", housecarl: 'Housecarl', karl: 'Freeholder', wife: 'Freewoman', child: 'Child', elder: 'Elder', thrall: 'Thrall',
  smith: 'Smith', shipwright: 'Shipwright', fisher: 'Fisherman', herder: 'Herder', brewer: 'Brewer', baker: 'Baker', weaver: 'Weaver', dyer: 'Dyer',
  netter: 'Net-mender', tanner: 'Tanner', healer: 'Healer', seer: 'Seer', skald: 'Skald', gothi: 'Gothi (priest)', lawspeaker: 'Law-speaker',
  watchman: 'Watchman', overseer: 'Overseer', lookout: 'Lookout boy', woodsman: 'Woodsman', shieldmaiden: 'Shieldmaiden',
};
export { ROLE_LABEL };
// role -> work definition: [siteA, siteB|null, anim, carry]
const WORK = {
  smith: ['forge', null, AN.hammer, 0], shipwright: ['scaffold', null, AN.hammer, 0], fisher: ['pierE', 'fishRacks', AN.carry, CA.fish],
  herder: ['pen', null, AN.idle, 0], brewer: ['brewery', 'waterDraw', AN.hammer, CA.bucket], baker: ['bakery', null, AN.hammer, 0],
  weaver: ['home', null, AN.weave, 0], dyer: ['dye', null, AN.hammer, 0], netter: ['netShore', null, AN.weave, CA.net], tanner: ['hides', null, AN.hammer, 0],
  healer: ['healer', null, AN.weave, 0], seer: ['seer', null, AN.speak, 0], skald: ['hall', null, AN.music, 0], gothi: ['godswood', null, AN.speak, 0],
  lawspeaker: ['thing', null, AN.speak, 0], watchman: ['palisade', null, AN.walk, 0], overseer: ['lootPile', null, AN.speak, 0],
  thrall: ['waterDraw', 'home', AN.carry, CA.bucket], woodsman: ['woodlot', 'shipyard', AN.carry, CA.log], housecarl: ['practice', null, AN.spar, 0],
  karl: ['woodlot', 'shipyard', AN.carry, CA.log], wife: ['home', null, AN.weave, 0], elder: ['home', null, AN.sit, 0], lookout: ['lookout', null, AN.point, 0],
  child: ['home', null, AN.spar, 0], jarl: ['hall', null, AN.speak, 0], lady: ['hall', null, AN.weave, 0], shieldmaiden: ['practice', null, AN.spar, 0],
};

export function createWorld(seed, L, GR, grid, params) {
  const rng = new RNG(seed);
  const G = GR.G;
  const S = {
    seed, t: 0, tick: 0, agents: [], ships: [], items: [], log: [],
    raidTarget: rng.pick(RAID_TARGETS),
    bonfires: L.bonfires.map(() => ({ logs: 0, fuel: 0, lit: 0, claim: -1 })),
    torches: L.torches.map(() => ({ lit: -1 })),
    beacons: L.beacons.map(() => ({ lit: -1 })),
    pyre: { logs: 0, target: 30, bodies: 0, bodiesTotal: 0, lit: -1, ready: false },
    ring: { a: -1, b: -1, t: 0, dur: 0, ang: 0, bouts: 0 },
    flags: { horn: -1, feastOrdered: -1, feastActive: -1, firstBeach: -1, lastBeach: -1, skald: -1, thing: -1, sacrifice: -1, goatAt: -1 },
    quiet: 0, heat: 0, offerings: 0, forgeHeat: 0, hearth: L.B.map(() => 0),
    goat: { x: L.S.goats[0], z: L.S.goats[1], state: 0 },
    dogs: [], stats: {},
  };
  // ---- households & people -------------------------------------------------
  const A = S.agents;
  const mk = (o) => {
    const a = Object.assign({
      id: A.length, name: '', female: false, age: 30, role: 'karl', home: 0, hh: 0, kin: [], spouse: -1, rival: -1, friends: [],
      ship: -1, aboard: false, fate: 'home', alive: true, wounded: false, seat: 0,
      x: 0, z: 0, px: 0, pz: 0, ey: NaN, cur: 0, path: null, pi: 0, tx: 0, tz: 0, moving: false, spd: 1.35, run: false,
      hunger: rng.range(0.2, 0.45), warmth: rng.range(0.6, 0.9), fatigue: rng.range(0.1, 0.3), drunk: 0, mood: rng.range(0.45, 0.65), grief: 0,
      courage: rng.next(), strength: rng.next(), curiosity: rng.next(),
      know: 0, excited: 0, act: 'work', stage: 0, actT: 0, p: -1, carry: 0, item: -1, anim: 0, fx: 0, fz: -1, inside: false,
      mem: [], met: [], next: 0, goalTxt: '', destTxt: '', dens: rng.next(), lean: 0,
    }, o);
    A.push(a); return a;
  };
  const houses = L.B.filter((b) => b.kind === 'house');
  const hall = L.B[0];
  let hhId = 0;
  // the jarl's household lives in the hall
  const jarl = mk({ name: makeName(rng, false), role: 'jarl', age: 44, home: 0, hh: hhId, courage: 0.9, strength: 0.75, curiosity: 0.9 });
  const lady = mk({ name: makeName(rng, true), female: true, role: 'lady', age: 38, home: 0, hh: hhId, spouse: jarl.id });
  jarl.spouse = lady.id;
  const jfather = jarl.name.split(' ')[0];
  for (let i = 0; i < 3; i++) { const f = rng.chance(0.5); const c = mk({ name: makeName(rng, f, jfather), female: f, role: 'child', age: rng.int(6, 14), home: 0, hh: hhId }); jarl.kin.push(c.id); lady.kin.push(c.id); c.kin.push(jarl.id, lady.id); }
  jarl.kin.push(lady.id); lady.kin.push(jarl.id);
  for (let i = 0; i < 30; i++) mk({ name: makeName(rng, false), role: 'housecarl', age: rng.int(20, 40), home: 0, hh: hhId, courage: rng.range(0.6, 1), strength: rng.range(0.6, 1) });
  for (let i = 0; i < 24; i++) { const f = rng.chance(0.5); mk({ name: makeName(rng, f), female: f, role: 'thrall', age: rng.int(16, 50), home: 0, hh: hhId }); }
  mk({ name: makeName(rng, false), role: 'skald', age: 52, home: 0, hh: hhId });
  mk({ name: makeName(rng, false), role: 'overseer', age: 46, home: 0, hh: hhId });
  mk({ name: makeName(rng, true), female: true, role: 'overseer', age: 40, home: 0, hh: hhId });
  for (let i = 0; i < 6; i++) mk({ name: makeName(rng, false), role: 'watchman', age: rng.int(22, 50), home: 0, hh: hhId });
  // special huts
  const hut = (k) => L.B.find((b) => b.kind === k).id;
  mk({ name: makeName(rng, true), female: true, role: 'seer', age: 70, home: hut('seer'), hh: ++hhId });
  for (let i = 0; i < 2; i++) mk({ name: makeName(rng, true), female: true, role: 'healer', age: rng.int(30, 60), home: hut('healer'), hh: ++hhId });
  // ordinary households
  const specialty = ['smith', 'smith', 'smith', 'shipwright', 'shipwright', 'shipwright', 'shipwright', 'shipwright', 'shipwright', 'shipwright', 'shipwright',
    'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'fisher', 'herder', 'herder', 'herder', 'herder', 'herder', 'herder',
    'tanner', 'tanner', 'woodsman', 'woodsman', 'woodsman', 'woodsman', 'woodsman', 'woodsman', 'gothi', 'lawspeaker'];
  const fSpecialty = ['brewer', 'brewer', 'brewer', 'brewer', 'baker', 'baker', 'baker', 'baker', 'dyer', 'dyer', 'dyer', 'netter', 'netter', 'netter', 'netter', 'netter', 'netter'];
  let si = 0, fi = 0;
  for (const b of houses) {
    hhId++;
    const fam = rng.pick(['Bjorn', 'Ulf', 'Ragnar', 'Sigurd', 'Halfdan', 'Ketil', 'Orm', 'Grim', 'Thorkel', 'Eirik', 'Asbjorn', 'Gunnar']);
    const husband = mk({ name: makeName(rng, false), role: 'karl', age: rng.int(22, 50), home: b.id, hh: hhId });
    const wife = mk({ name: makeName(rng, true), female: true, role: 'wife', age: husband.age - rng.int(0, 6), home: b.id, hh: hhId, spouse: husband.id });
    husband.spouse = wife.id;
    const fam1 = [husband, wife];
    const hn = husband.name.split(' ')[0];
    const nk = rng.int(1, 4);
    for (let i = 0; i < nk; i++) {
      const f = rng.chance(0.5); const age = rng.int(3, 19);
      const c = mk({ name: makeName(rng, f, hn), female: f, role: age >= 16 ? (f ? 'wife' : 'karl') : 'child', age, home: b.id, hh: hhId });
      fam1.push(c);
    }
    if (rng.chance(0.6)) { const f = rng.chance(0.6); fam1.push(mk({ name: makeName(rng, f), female: f, role: 'elder', age: rng.int(58, 78), home: b.id, hh: hhId })); }
    const extra = b.len > 20 ? rng.int(2, 4) : rng.int(1, 2);
    for (let i = 0; i < extra; i++) fam1.push(mk({ name: makeName(rng, false, hn), role: 'karl', age: rng.int(17, 34), home: b.id, hh: hhId }));
    if (b.len > 20) {
      // a brother's family shares the big house
      const br = mk({ name: makeName(rng, false), role: 'karl', age: rng.int(22, 44), home: b.id, hh: hhId });
      const bw = mk({ name: makeName(rng, true), female: true, role: 'weaver', age: br.age - rng.int(0, 5), home: b.id, hh: hhId, spouse: br.id }); br.spouse = bw.id;
      fam1.push(br, bw);
      for (let i = 0; i < rng.int(1, 3); i++) { const f = rng.chance(0.5); fam1.push(mk({ name: makeName(rng, f, br.name.split(' ')[0]), female: f, role: 'child', age: rng.int(3, 14), home: b.id, hh: hhId })); }
    }
    for (const p of fam1) { p.female = p.female || false; if (p.role === 'elder') p.female = rng.chance(0.55); for (const q of fam1) if (q !== p) p.kin.push(q.id); }
    const nt = b.len > 22 ? rng.int(2, 4) : rng.int(0, 2);
    for (let i = 0; i < nt; i++) { const f = rng.chance(0.4); mk({ name: makeName(rng, f), female: f, role: 'thrall', age: rng.int(15, 45), home: b.id, hh: hhId }); }
    // specialties
    if (si < specialty.length && rng.chance(0.85)) husband.role = specialty[si++];
    if (fi < fSpecialty.length && rng.chance(0.4)) wife.role = fSpecialty[fi++];
    else if (rng.chance(0.7)) wife.role = 'weaver';
  }
  // the lookout boy
  const boy = A.find((a) => a.role === 'child' && !a.female && a.age >= 10 && a.home !== 0);
  if (boy) boy.role = 'lookout';
  // friends & rivals
  const adults = A.filter((a) => a.age >= 16);
  for (const a of adults) {
    for (let i = 0; i < 2; i++) { const f = rng.pick(adults); if (f !== a && !a.friends.includes(f.id)) { a.friends.push(f.id); f.friends.push(a.id); } }
    if (!a.female && rng.chance(0.35)) { const r = rng.pick(adults); if (r !== a && r.hh !== a.hh) { a.rival = r.id; if (r.rival < 0) r.rival = a.id; } }
  }
  // ---- the raid --------------------------------------------------------------
  const candidates = A.filter((a) => a.age >= 17 && a.age <= 48 && ((!a.female && ['karl', 'housecarl', 'fisher', 'woodsman', 'shipwright', 'herder', 'tanner'].includes(a.role)) || (a.female && a.role === 'wife' && rng.chance(0.12))));
  const raiders = [];
  for (const a of candidates) {
    const p = a.role === 'housecarl' ? 0.7 : a.role === 'shipwright' ? 0.25 : a.female ? 1 : 0.8;
    if (rng.chance(p)) raiders.push(a);
  }
  // keep some home crafts running
  const nShips = clamp(Math.round(raiders.length / 22), 6, 12);
  const line = fjordLine();
  const slotsOrder = [5, 6, 4, 7, 3, 8, 2, 9, 1, 10, 0, 11];
  for (let i = 0; i < nShips; i++) {
    const slot = L.slots[slotsOrder[i]];
    const pts = line.slice();
    pts.push([slot.x * 0.6, -330], [slot.x, slot.z - 140], [slot.x, slot.z - 40], [slot.x, slot.z + 9]);
    const rs = resample(pts, 10);
    let len = 0; const cum = [0];
    for (let k = 1; k < rs.length; k++) { len += Math.hypot(rs[k][0] - rs[k - 1][0], rs[k][1] - rs[k - 1][1]); cum.push(len); }
    const startRemain = 1180 + i * rng.range(210, 300) + (i > 0 ? rng.range(-60, 60) : 0);
    S.ships.push({
      id: i, name: SHIP_NAMES[(i + (seed % 7)) % SHIP_NAMES.length], slot: slotsOrder[i], pts: rs, cum, len,
      s: Math.max(0, len - startRemain), v: rng.range(6.6, 7.6), state: 0, tState: 0, haul: 0, haulers: 0,
      crew: [], dead: [], woundedL: [], loot: [], captain: -1, tear: rng.range(0.25, 0.85), stripe: rng.int(0, 3), sail: 1, oars: 0, x: 0, z: 0, yaw: 0, beachT: -1, unloadI: 0,
    });
  }
  raiders.forEach((a, k) => {
    const sh = S.ships[k % nShips];
    a.ship = sh.id; a.aboard = true; a.fate = 'raider'; sh.crew.push(a.id);
    if (a.female) a.role = 'shieldmaiden';
  });
  // fates (seeded)
  for (const sh of S.ships) {
    sh.captain = sh.crew.reduce((best, id) => (A[id].role === 'housecarl' || A[id].age > A[best].age ? id : best), sh.crew[0]);
    for (const id of sh.crew) {
      const a = A[id];
      if (id === sh.captain) continue;
      const r = rng.next();
      if (r < 0.11) { a.alive = false; a.fate = 'dead'; sh.dead.push(id); }
      else if (r < 0.29) { a.wounded = true; a.fate = 'wounded'; sh.woundedL.push(id); }
    }
    sh.crew.forEach((id, k) => { A[id].seat = k; });
  }
  // memories of the raid
  const places = ['at the river mouth', 'in the shield-wall before the minster', 'on the burning quay', 'in the ambush at the ford', 'when the Saxon horsemen came', 'on the beach at dawn'];
  const deeds = ['took a Frankish sword from a dead man', 'carried the silver out of the church', 'held the line with the jarl\'s men', 'rowed three days through the storm', 'pulled a friend from the water', 'burned the reeve\'s hall'];
  for (const sh of S.ships) for (const id of sh.crew) {
    const a = A[id];
    a.mem.push(`Sailed on ${sh.name} against ${S.raidTarget}.`);
    if (a.alive) a.mem.push(`${cap(rng.pick(deeds))}.`);
    const fallen = sh.dead.filter((d) => d !== id);
    if (fallen.length && a.alive) a.mem.push(`Saw ${A[rng.pick(fallen)].name} fall ${rng.pick(places)}.`);
    if (a.wounded) a.mem.push(`Took a wound ${rng.pick(places)}.`);
    if (!a.alive) a.mem.push(`Fell ${rng.pick(places)}. Did not come home.`);
  }
  // plunder
  for (const sh of S.ships) {
    const n = rng.int(4, 8);
    for (let i = 0; i < n; i++) {
      const [kind, name, val] = rng.pick(LOOT_KINDS);
      const it = { id: S.items.length, kind, ck: CA[kind], name, value: Math.round(val * rng.range(0.6, 1.6)), state: 'ship', ship: sh.id, x: 0, z: 0, y: NaN, carrier: -1, owner: -1, dest: -1, k: i, claim: -1 };
      S.items.push(it); sh.loot.push(it.id);
    }
    for (const d of sh.dead) {
      const it = { id: S.items.length, kind: 'body', ck: CA.body, name: 'the body of ' + A[d].name, value: 0, state: 'ship', ship: sh.id, x: 0, z: 0, y: NaN, carrier: -1, owner: d, dest: -1, k: sh.loot.length, claim: -1 };
      S.items.push(it); sh.loot.push(it.id);
    }
    S.pyre.bodiesTotal += sh.dead.length;
  }
  // feast props stacked by the hall
  const propKinds = [];
  for (let i = 0; i < L.feastSpots.length; i++) propKinds.push(i % 3 === 1 ? 'table' : 'bench');
  for (let i = 0; i < 10; i++) propKinds.push('barrel');
  for (let i = 0; i < 3; i++) propKinds.push('cauldron');
  propKinds.forEach((kind, i) => {
    const hx = -14 + (i % 10) * 3.2, hz = 336 - Math.floor(i / 10) * 2.6;
    let dx, dz;
    if (i < L.feastSpots.length) { dx = L.feastSpots[i].x; dz = L.feastSpots[i].z; }
    else if (kind === 'barrel') { const k = i - L.feastSpots.length; dx = -60 + k * 13; dz = 104; }
    else { const k = i - L.feastSpots.length - 10; dx = -30 + k * 40; dz = 80; }
    S.items.push({ id: S.items.length, kind, ck: CA[kind], name: kind, value: 0, state: 'hall', ship: -1, x: hx, z: hz, y: NaN, carrier: -1, owner: -1, dest: -1, dx, dz, k: i, claim: -1, prop: true });
  });
  // dogs
  for (let i = 0; i < 34; i++) {
    const owner = A[rng.int(0, A.length - 1)];
    S.dogs.push({ owner: owner.id, x: 0, z: 0, px: 0, pz: 0, tx: 0, tz: 0, st: 0, t: rng.next() * 10, fight: -1, col: rng.int(0, 3) });
  }
  // ---- initial placement -------------------------------------------------------
  for (const a of A) {
    a.lane = (hash2(a.id, 77) - 0.5) * 2;
    a.spd = a.age < 13 ? 1.55 : a.age > 60 ? 0.95 : 1.32 + (a.strength - 0.5) * 0.2;
    if (a.aboard) { a.fatigue = rng.range(0.45, 0.65); a.hunger = rng.range(0.5, 0.8); continue; }
    const w = workSite(S, L, GR, a);
    const n = w;
    const jx = (hash2(a.id, 3) - 0.5) * 10, jz = (hash2(a.id, 4) - 0.5) * 10;
    a.x = G.x[n] + jx; a.z = G.z[n] + jz; a.px = a.x; a.pz = a.z; a.cur = n; a.dest = n;
    a.next = (a.id % 10);
  }
  for (const d of S.dogs) { const o = A[d.owner]; d.x = d.px = (o.aboard ? L.S.feast[0] : o.x) + 2; d.z = d.pz = (o.aboard ? L.S.feast[1] : o.z) + 2; }
  if (boy) { boy.know = K_FLEET; boy.excited = 40; boy.act = 'none'; boy.mem.push('Saw the sails in the narrows first of anyone.'); }
  S.params = params;
  S.L = null; // layout is static, held outside
  logE(S, 'Sails in the narrows — the fleet is coming home from ' + S.raidTarget + '.', L.S.lookout[0], L.S.lookout[1], 'news');
  return S;
}
function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function logE(S, msg, x, z, kind = 'ev') { S.log.push({ t: S.t, msg, x, z, kind }); if (S.log.length > 80) S.log.shift(); }

function workSite(S, L, GR, a) {
  const w = WORK[a.role] || WORK.karl;
  return siteNode(S, L, GR, a, w[0]);
}
function siteNode(S, L, GR, a, key) {
  if (key === 'home') return GR.doorNodes[a.home].door;
  if (key === 'hall') return GR.doorNodes[0].door;
  if (key === 'scaffold') return GR.scaff[a.id % GR.scaff.length];
  if (key === 'palisade') return GR.walk[(a.id * 7) % GR.walk.length];
  if (key === 'pen') return GR.site[['sheep', 'goats', 'pigs', 'horses', 'byre'][a.id % 5]];
  return GR.site[key] ?? GR.site.feast;
}

// ===================================================================================
export class Sim {
  constructor(L, GR, grid) { this.L = L; this.GR = GR; this.G = GR.G; this.grid = grid; this.hash = new Map(); }
  setState(S) { this.S = S; const sm = S.agents.find((a) => a.role === 'smith' && a.fate === 'home'); this.masterSmith = sm ? sm.id : -1; }
  nodeY(n) { return this.G.y[n]; }
  remember(a, txt) { if (a.mem.length > 10) a.mem.splice(2, 1); a.mem.push(`[${clock(this.S.t)}] ${txt}`); }
  // ---------------------------------------------------------------- movement
  goTo(a, node, tx, tz, run = false) {
    const G = this.G;
    if (Math.hypot(G.x[a.cur] - a.x, G.z[a.cur] - a.z) > 14 || a.inside) a.cur = G.nearest(a.x, a.z, 200, (k) => G.tag[k] !== 2 || k === a.cur);
    a.path = G.path(a.cur, node);
    a.pi = a.path.length > 1 && Math.hypot(G.x[a.path[0]] - a.x, G.z[a.path[0]] - a.z) < 8 ? 1 : 0;
    a.tx = tx === undefined ? G.x[node] : tx; a.tz = tz === undefined ? G.z[node] : tz;
    a.moving = true; a.run = run; a.dest = node; a.inside = false;
  }
  goPoint(a, x, z, run = false, filter = null) {
    const G = this.G;
    const n = G.nearest(x, z, 200, filter || ((k) => G.tag[k] !== 2 && isNaN(G.y[k])));
    this.goTo(a, n, x, z, run);
  }
  move(a, dt) {
    if (!a.moving) return true;
    const G = this.G;
    let sp = a.spd * (a.run ? 2.4 : 1);
    if (a.wounded) sp = 0.8;
    if (a.drunk > 0.5) sp *= 0.75;
    if (a.carry && a.carry !== CA.torch && a.carry !== CA.horn && a.carry !== CA.stick) sp *= a.run ? 0.6 : 0.85;
    let budget = sp * dt;
    while (budget > 0) {
      let tx, tz, ty = NaN, fromY = NaN;
      if (a.pi < a.path.length) {
        const n = a.path[a.pi];
        const j = isNaN(G.y[n]) ? 1.3 : 0.25;
        tx = G.x[n] + (hash2(a.id, n) - 0.5) * 2 * j; tz = G.z[n] + (hash2(n, a.id) - 0.5) * 2 * j;
        ty = G.y[n];
        if (a.pi > 0) fromY = G.y[a.path[a.pi - 1]];
      } else { tx = a.tx; tz = a.tz; }
      const dx = tx - a.x, dz = tz - a.z; const d = Math.hypot(dx, dz);
      if (d > 0.05) { a.fx = dx / d; a.fz = dz / d; }
      if (!isNaN(ty) && !isNaN(fromY)) { a.ey = ty; } else if (!isNaN(ty) || !isNaN(fromY)) a.ey = isNaN(ty) ? NaN : ty; else a.ey = NaN;
      if (d <= budget) {
        a.x = tx; a.z = tz; budget -= d;
        if (a.pi < a.path.length) { a.cur = a.path[a.pi]; a.pi++; }
        else { a.moving = false; if (!isNaN(G.y[a.cur]) && Math.hypot(G.x[a.cur] - a.x, G.z[a.cur] - a.z) < 1.5) a.ey = G.y[a.cur]; else a.ey = NaN; return true; }
      } else { a.x += (dx / d) * budget; a.z += (dz / d) * budget; budget = 0; }
    }
    return false;
  }
  face(a, x, z) { const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz); if (d > 0.01) { a.fx = dx / d; a.fz = dz / d; } }
  // ---------------------------------------------------------------- ships
  shipPose(sh) {
    const s = clamp(sh.s, 0, sh.len);
    let i = 1; while (i < sh.cum.length - 1 && sh.cum[i] < s) i++;
    const t = (s - sh.cum[i - 1]) / Math.max(1e-6, sh.cum[i] - sh.cum[i - 1]);
    const a = sh.pts[i - 1], b = sh.pts[i];
    sh.x = lerp(a[0], b[0], t); sh.z = lerp(a[1], b[1], t);
    // smoothed heading
    const j = Math.min(sh.pts.length - 1, i + 2), k = Math.max(0, i - 2);
    const yaw = Math.atan2(sh.pts[j][0] - sh.pts[k][0], sh.pts[j][1] - sh.pts[k][1]);
    sh.yaw = yaw;
    const extra = sh.state >= 1 ? sh.haul * 7 : 0;
    sh.x += Math.sin(yaw) * extra; sh.z += Math.cos(yaw) * extra;
  }
  shipLocal(sh, lx, lz) { const c = Math.cos(sh.yaw), s = Math.sin(sh.yaw); return [sh.x + lx * c + lz * s, sh.z - lx * s + lz * c]; }
  seatOf(sh, a) {
    const k = sh.crew.indexOf(a.id);
    if (a.id === sh.captain) return [0, -9.6, AN.idle];
    if (a.wounded) return [(k % 2 ? 0.7 : -0.7), 0.6 + (k % 3) * 0.6, AN.slump];
    const row = Math.floor(k / 2) % 14, side = k % 2 ? 1 : -1;
    if (k >= 28) return [side * 0.5, -6 + (k - 28) * 0.8, AN.idle];
    return [side * 1.35, -7.2 + row * 1.08, sh.oars > 0.5 ? AN.row : AN.idle];
  }
  tickShips(dt) {
    const S = this.S;
    for (const sh of S.ships) {
      const remain = sh.len - sh.s;
      if (sh.state === 0) {
        let v = sh.v;
        if (remain < 260) v = lerp(2.4, sh.v, smoothstep(30, 260, remain));
        sh.s += v * dt;
        const z = sh.z;
        sh.oars = z > -1450 ? 1 : 0;
        sh.sail = z > -330 ? Math.max(0, sh.sail - dt * 0.12) : 1;
        if (sh.len - sh.s < 16) { sh.state = 1; sh.tState = S.t; logE(S, `${sh.name}'s keel grinds up onto the sand.`, sh.x, sh.z, 'ship'); if (S.flags.firstBeach < 0) S.flags.firstBeach = S.t; }
      } else if (sh.state === 1) {
        sh.s = Math.min(sh.len, sh.s + dt * lerp(3, 0.4, (S.t - sh.tState) / 5));
        sh.oars = Math.max(0, sh.oars - dt * 0.3);
        if (S.t - sh.tState > 5) { sh.state = 2; sh.beachT = S.t; }
      } else {
        sh.oars = 0;
        if (sh.haul < 1) sh.haul = Math.min(1, sh.haul + dt * sh.haulers * 0.0016);
        // disembark crew one by one
        if (sh.unloadI < sh.crew.length && S.t - sh.beachT > 2) {
          if ((S.tick % 4) === 0) {
            let a = this.S.agents[sh.crew[sh.unloadI]];
            while (a && (!a.alive) && sh.unloadI < sh.crew.length - 1) { sh.unloadI++; a = this.S.agents[sh.crew[sh.unloadI]]; }
            if (a && a.alive && a.aboard) this.disembark(sh, a);
            sh.unloadI++;
          }
        }
        if (sh.unloadI >= sh.crew.length && sh.allOff !== true) { sh.allOff = true; if (S.ships.every((q) => q.allOff)) { S.flags.lastBeach = S.t; logE(S, 'The last crew is ashore.', sh.x, sh.z, 'ship'); } }
      }
      this.shipPose(sh);
    }
  }
  disembark(sh, a) {
    const side = a.seat % 2 ? 1 : -1;
    const [x, z] = this.shipLocal(sh, side * 3.4, 4 + (a.seat % 5));
    a.aboard = false; a.x = a.px = x; a.z = a.pz = z; a.ey = NaN;
    a.cur = this.G.nearest(x, z, 60, (k) => isNaN(this.G.y[k]) && this.G.tag[k] !== 2);
    a.know |= K_FLEET | K_BEACH; a.next = this.S.tick + 2; a.act = 'none'; a.excited = 20;
    this.remember(a, a.wounded ? 'Was helped down from the ship, bleeding.' : `Jumped down onto the sand from ${sh.name}.`);
  }
  // ---------------------------------------------------------------- knowledge
  learn(a, bit, from, how) {
    if (a.know & bit) return false;
    a.know |= bit; a.excited = 12 + a.curiosity * 10; a.next = Math.min(a.next, this.S.tick + 1);
    const S = this.S;
    if (bit === K_FLEET) this.remember(a, from ? `Heard from ${from.name} that the sails are in the narrows.` : how);
    else if (bit === K_FEAST) this.remember(a, from ? `Heard from ${from.name} that the jarl has called a feast.` : how);
    else if (bit === K_PYRE) this.remember(a, 'Saw the pyre take fire for the men who did not come back.');
    else if (bit === K_THING) this.remember(a, from ? `${from.name} said the law-speaker is calling the Thing.` : how);
    else if (bit === K_BEACH && how) this.remember(a, how);
    if (bit === K_FLEET) { S.stats.knowFleet = (S.stats.knowFleet || 0) + 1; }
    return true;
  }
  spread() {
    const S = this.S, A = S.agents, H = this.hash; H.clear();
    for (const a of A) {
      if (!a.alive || a.aboard || a.inside) continue;
      const k = ((Math.floor(a.x / 8) + 1000) << 12) | (Math.floor(a.z / 8) + 1000);
      let l = H.get(k); if (!l) { l = []; H.set(k, l); } l.push(a.id);
    }
    this.hashReady = true;
    const tk = S.tick;
    for (const a of A) {
      if (!a.alive || a.aboard || a.inside || !a.know) continue;
      const shouting = a.excited > 0 || a.act === 'runNews';
      if (!shouting && (tk + a.id) % 5 !== 0) continue;
      const R = shouting ? 11 : 3.5, R2 = R * R, p = shouting ? 0.3 : 0.12;
      const cx = Math.floor(a.x / 8), cz = Math.floor(a.z / 8), cr = shouting ? 2 : 1;
      for (let i = cx - cr; i <= cx + cr; i++) for (let j = cz - cr; j <= cz + cr; j++) {
        const l = H.get(((i + 1000) << 12) | (j + 1000)); if (!l) continue;
        for (const id of l) {
          if (id === a.id) continue; const b = A[id];
          const miss = a.know & ~b.know; if (!miss) continue;
          if ((b.x - a.x) ** 2 + (b.z - a.z) ** 2 > R2) continue;
          if (hash2(tk * 13 + a.id, id) > p) continue;
          for (const bit of [K_FLEET, K_FEAST, K_BEACH, K_THING]) if (miss & bit) this.learn(b, bit, a);
        }
      }
    }
    // horn and beacons broadcast
    if (S.flags.horn >= 0 && S.t - S.flags.horn < 30) {
      const hx = this.L.S.hallDoor[0], hz = this.L.S.hallDoor[1];
      for (const a of A) if (a.alive && !a.aboard && !(a.know & K_FLEET)) {
        const d = Math.hypot(a.x - hx, a.z - hz);
        if (hash2(tk, a.id * 3) < 0.04 * (1 - d / 700)) this.learn(a, K_FLEET, null, "Heard the jarl's horn blowing from the hall.");
      }
    }
    // people on the shore simply see the ships in the bay
    if ((tk % 5) === 0) {
      let near = false; for (const sh of S.ships) if (sh.state === 0 && sh.len - sh.s < 650) near = true;
      if (near) for (const a of A) if (a.alive && !a.aboard && !a.inside && !(a.know & K_FLEET) && a.z < 170 && hash2(tk, a.id) < 0.05) this.learn(a, K_FLEET, null, 'Looked up and saw the dragon-prows coming round into the bay.');
      const lb = S.beacons[S.beacons.length - 2];
      if (lb.lit >= 0) for (const a of A) if (a.alive && !a.inside && !(a.know & K_FLEET) && (!isNaN(a.ey) || a.role === 'watchman' || a.role === 'jarl') && hash2(tk + 3, a.id) < 0.03) this.learn(a, K_FLEET, null, 'Saw the lookout beacon burning on the point.');
      const vb = S.beacons[S.beacons.length - 1];
      if (vb.lit >= 0) for (const a of A) if (a.alive && !a.aboard && !a.inside && !(a.know & K_FLEET) && hash2(tk + 7, a.id) < 0.02) this.learn(a, K_FLEET, null, 'Saw the beacon burning above the hall.');
    }
    // the death news spreads near the crews and the bodies
    if ((tk % 5) === 2) {
      for (const sh of S.ships) {
        if (sh.state < 2) continue;
        for (const d of sh.dead) {
          const dead = A[d];
          for (const kid of dead.kin) {
            const k = A[kid]; if (!k.alive || k.aboard || k.grief > 0) continue;
            // close to any landed crewmate, or the ship itself
            let close = Math.hypot(k.x - sh.x, k.z - sh.z) < 16;
            if (!close) for (const cid of sh.crew) { const c = A[cid]; if (c.alive && !c.aboard && (c.x - k.x) ** 2 + (c.z - k.z) ** 2 < 25) { close = true; break; } }
            if (close) {
              k.grief = 1; k.mood = Math.max(0.05, k.mood - 0.5); k.next = tk + 1;
              const rel = dead.spouse === k.id ? (dead.female ? 'wife' : 'husband') : k.age < dead.age - 14 ? (dead.female ? 'mother' : 'father') : k.age > dead.age + 14 ? (dead.female ? 'daughter' : 'son') : (dead.female ? 'sister' : 'brother');
              this.remember(k, `Learned from the crew of ${sh.name} that ${k.female ? 'her' : 'his'} ${rel} ${dead.name} did not come back.`);
              logE(S, `${k.name} learns that ${dead.name} did not come home.`, k.x, k.z, 'grief');
            }
          }
        }
      }
    }
  }
  // ---------------------------------------------------------------- the main step
  step() {
    const S = this.S, P = S.params, A = S.agents, dt = DT, L = this.L;
    S.t += dt; S.tick++;
    this.tickShips(dt);
    // beacon chain: watchers down the fjord light theirs one after another
    const nb = S.beacons.length;
    for (let i = 0; i < nb - 2; i++) if (S.beacons[i].lit < 0 && S.t > 3 + i * 7) { S.beacons[i].lit = S.t; if (i === 0) logE(S, 'The outer beacon catches on the fjord rim.', L.beacons[i].x, L.beacons[i].z, 'fire'); }
    if (S.beacons[nb - 2].lit < 0 && S.t > 50) { S.beacons[nb - 2].lit = S.t; }
    this.spread();
    // world bookkeeping
    const placed = S.items.filter((it) => it.prop && it.state === 'placed').length;
    const litFires = S.bonfires.filter((b) => b.lit > 0).length;
    if (S.flags.feastActive < 0 && S.flags.feastOrdered >= 0 && placed >= 4 && litFires >= 2) { S.flags.feastActive = S.t; logE(S, 'The benches are out and the fires are lit: the feast begins.', L.S.feast[0], L.S.feast[1], 'feast'); }
    // fires burn
    for (let i = 0; i < S.bonfires.length; i++) {
      const b = S.bonfires[i];
      if (b.lit > 0) { b.fuel -= dt / 260; if (b.fuel <= 0) { b.fuel = 0; b.lit = 0; b.logs = 0; } }
    }
    for (const t of S.torches) if (t.lit >= 0 && S.t - t.lit > 1250 + (t.lit % 400)) t.lit = -2;
    // pyre
    const py = S.pyre;
    py.ready = py.logs >= py.target && py.bodies >= py.bodiesTotal && S.flags.lastBeach >= 0;
    if (py.lit >= 0) {
      const age = S.t - py.lit;
      S.quiet = age < 260 ? Math.min(1, S.quiet + dt / 15) : Math.max(0, S.quiet - dt / 220);
    }
    // goat
    // forge heat follows smiths at work
    let smiths = 0, hammer = 0;
    // celebration statistics
    let feasting = 0, drinking = 0, sleeping = 0, mourning = 0, ringWatch = 0, total = 0, home = 0, dancing = 0;
    for (const a of A) {
      if (!a.alive) continue;
      total++;
      if (a.aboard) { const sh = S.ships[a.ship]; const [lx, lz, an] = this.seatOf(sh, a); [a.x, a.z] = this.shipLocal(sh, lx, lz); a.anim = an; a.fx = Math.sin(sh.yaw); a.fz = Math.cos(sh.yaw); if (an === AN.row) { a.fx = -a.fx; a.fz = -a.fz; } continue; }
      a.px = a.x; a.pz = a.z;
      if (a.excited > 0) a.excited -= dt;
      this.needs(a, dt);
      if (S.tick >= a.next) { this.think(a); a.next = S.tick + 11 + ((a.id * 7) % 6); }
      this.tickAct(a, dt);
      if (a.act === 'feast') { feasting++; if (a.anim === AN.drink) drinking++; }
      if (a.act === 'sleep' && a.stage >= 1) sleeping++;
      if (a.act === 'mourn' || a.act === 'keen') mourning++;
      if (a.act === 'ringWatch' || a.act === 'wrestle') ringWatch++;
      if (a.act === 'dance') dancing++;
      if (a.role === 'smith' && a.act === 'work' && !a.moving) { smiths++; if (a.anim === AN.hammer) hammer++; }
    }
    S.forgeHeat = lerp(S.forgeHeat, smiths ? 1 : 0.15, 0.02);
    S.forgeHammer = hammer;
    S.stats = Object.assign(S.stats, { feasting, drinking, sleeping, mourning, ringWatch, total, dancing });
    const raw = (feasting + dancing * 1.5 + ringWatch * 1.3) / Math.max(1, total) * 2.2 * (1 - 0.8 * S.quiet);
    S.heat = lerp(S.heat, clamp(raw, 0, 1), 0.01);
    this.tickRing(dt);
    this.tickDogs(dt);
    this.tickGoat(dt);
    // hearths: glow while someone is home
    if ((S.tick % 10) === 0) {
      const h = S.hearth; for (let i = 0; i < h.length; i++) h[i] = Math.max(0.25, h[i] * 0.9);
      for (const a of A) if (a.inside && a.alive) h[a.home] = Math.min(1, h[a.home] + 0.15);
    }
  }
  needs(a, dt) {
    const S = this.S, P = S.params;
    const season = P.season;
    a.hunger = clamp(a.hunger + dt / 1500, 0, 1);
    a.fatigue = clamp(a.fatigue + dt * (1 / 2900 + a.drunk / 2400 + (a.wounded ? 1 / 2000 : 0)), 0, 1);
    a.drunk = clamp(a.drunk - dt / 2600, 0, 1);
    a.warmth = clamp(a.warmth - dt * (a.inside ? -1 / 120 : (0.2 + season * 0.8) / 900), 0, 1);
    a.mood = clamp(lerp(a.mood, 0.55 - a.grief * 0.35, dt / 300), 0, 1);
    if (a.grief > 0) a.grief = Math.max(0.15, a.grief - dt / 5000);
    if (a.act === 'sleep' && a.stage >= 1) { a.fatigue = Math.max(0, a.fatigue - dt / 900); }
  }
  // ---------------------------------------------------------------- utility selection
  think(a) {
    const S = this.S, P = S.params, A = S.agents, L = this.L;
    const C = [];
    const add = (u, act, p = -1) => C.push([u, act, p]);
    const f = S.flags, heat = P.heat, quiet = S.quiet;
    const kF = a.know & K_FLEET, kFe = (a.know & K_FEAST) || f.feastActive >= 0;
    const role = a.role, adult = a.age >= 15, child = a.age < 15;
    const shipsAtSea = S.ships.filter((s) => s.state === 0).length;
    const pyreBurning = S.pyre.lit >= 0 && S.t - S.pyre.lit < 330;
    const feastOn = f.feastActive >= 0;
    const lateNight = S.t > 1500;
    // commitment
    const keep = a.carry ? 0.7 : 0.12;
    // --- work
    let duty = { smith: 0.62, shipwright: 0.6, herder: 0.6, fisher: 0.5, thrall: 0.55, woodsman: 0.55, healer: 0.7, watchman: 0.5, brewer: 0.58, baker: 0.58, seer: 0.6 }[role] ?? 0.4;
    if (kF) duty *= 0.55 + 0.4 * (1 - a.curiosity);
    if (feastOn) duty *= 0.35;
    if (lateNight) duty *= 0.3;
    // the master smith will not leave his fire while there is iron in it
    if (role === 'smith' && a.id === this.masterSmith && S.t < 1300) duty = 1.25;
    if (!a.wounded && a.fate !== 'raider') add(duty, 'work');
    // --- the fleet
    const kinAtSea = a.kin.some((k) => A[k].aboard && A[k].alive);
    if (kF && shipsAtSea > 0 && !a.wounded && a.fate !== 'raider') add(0.45 + a.curiosity * 0.4 + (kinAtSea ? 0.4 : 0) + (child ? 0.3 : 0), 'watch');
    if (role === 'lookout' && kF && S.t < 160) add(2, 'runNews');
    // reunion
    if (a.alive && !a.wounded) {
      for (const k of a.kin) {
        const b = A[k];
        if (b.alive && !b.aboard && b.fate !== 'home' && !a.met.includes(k) && (b.know & K_BEACH)) { add(1.25 + (a.spouse === k ? 0.2 : 0), 'greet', k); break; }
        if (a.fate !== 'home' && b.alive && !b.aboard && !a.met.includes(k) && b.fate === 'home' && S.t - S.ships[a.ship].beachT > 40) { add(0.95 + (a.spouse === k ? 0.25 : 0), 'greet', k); break; }
      }
    }
    // --- raiders unload & carry the dead
    if (a.fate === 'raider' && !a.aboard) {
      const sh = S.ships[a.ship];
      const items = sh.loot.filter((id) => (S.items[id].state === 'ship' || S.items[id].state === 'dropped') && S.items[id].carrier < 0);
      if (items.length) {
        const body = items.find((id) => S.items[id].kind === 'body');
        add(body !== undefined ? 1.3 : 1.0, body !== undefined ? 'corpse' : 'unload', body !== undefined ? body : items[0]);
      }
      if (sh.haul < 1 && sh.haulers < 10) add(0.9, 'haul', sh.id);
      // claim loot assigned to me
      const mine = S.items.find((it) => it.owner === a.id && it.state === 'pile' && it.carrier < 0 && it.kind !== 'body');
      if (mine) add(0.85, 'claim', mine.id);
    }
    if (adult && !a.wounded && a.fate === 'home' && ['karl', 'thrall', 'fisher', 'woodsman', 'housecarl'].includes(role)) {
      const sh = S.ships.find((s) => s.state === 2 && s.haul < 1 && s.haulers < 8 && Math.hypot(s.x - a.x, s.z - a.z) < 120);
      if (sh) add(0.88, 'haul', sh.id);
    }
    // anyone strong enough helps bring the dead up to the pyre
    if (adult && !a.wounded && a.age < 60 && a.act !== 'corpse' && (S.tick + a.id) % 3 === 0) {
      const body = S.items.find((it) => it.kind === 'body' && it.carrier < 0 && (it.state === 'dropped' || (it.state === 'ship' && S.ships[it.ship].state === 2 && S.t - S.ships[it.ship].beachT > 30)));
      if (body) add(a.kin.includes(body.owner) ? 1.35 : ['housecarl', 'karl', 'thrall'].includes(role) || a.fate !== 'home' ? 1.05 : 0, 'corpse', body.id);
    }
    if (a.wounded) add(a.act === 'healed' ? 1.4 : 1.6, a.act === 'healed' ? 'healed' : 'toHealer');
    // --- chores for thralls and servants
    if ((role === 'thrall' || role === 'overseer') && kFe) {
      const prop = S.items.find((it) => it.prop && it.state === 'hall' && it.carrier < 0);
      if (prop && role === 'thrall') add(1.02, 'prop', prop.id);
      const bf = S.bonfires.findIndex((b) => b.lit <= 0 && (b.claim < 0) && b.logs < 3);
      const feed = S.bonfires.findIndex((b) => b.lit > 0 && b.fuel < 0.45 && b.claim < 0);
      if (role === 'thrall' && !lateNight) {
        if (bf >= 0) add(1.0 + (a.id % 3) * 0.02, 'fireLog', bf);
        if (feed >= 0) add(0.86, 'fireLog', feed);
        if (S.pyre.logs < S.pyre.target && S.flags.firstBeach >= 0) add(0.96 + (a.id % 5) * 0.02, 'pyreLog');
        const hs = S.items.find((it) => it.state === 'pile' && it.owner === -2 && it.carrier < 0);
        if (hs) add(0.83, 'hallShare', hs.id);
        if (feastOn && !pyreBurning) add(0.6, 'serve');
      }
      if (role === 'overseer') add(0.9, 'steward');
    }
    // --- the dead
    if (a.grief > 0.3) {
      const body = S.items.find((it) => it.kind === 'body' && a.kin.includes(it.owner) && it.state !== 'ship');
      if (body && S.pyre.lit < 0) add(hash2(a.id, 99) < 0.45 || body.owner === a.spouse ? 1.1 : 0.3, 'keen', body.id);
    }
    if (pyreBurning || (S.pyre.ready && (role === 'seer' || role === 'jarl' || role === 'gothi' || role === 'skald'))) {
      add((a.grief > 0 || (S.pyre.ready && ['seer', 'gothi', 'skald'].includes(role)) ? 1.5 : 0.95 + quiet * 0.4) * (S.t - S.pyre.lit < 300 || S.pyre.lit < 0 ? 1 : 0.4), 'mourn');
    }
    // --- the feast and everything that follows
    if (feastOn && !a.wounded) {
      const q = 1 - quiet * 0.92;
      const hungerU = a.hunger * 0.7, social = 0.3 + (1 - a.grief) * 0.2;
      const bored = a.act === 'feast' ? smoothstep(60, 240, a.actT) * 0.45 : 0;
      add((hungerU + social + (a.fate === 'raider' ? 0.15 : 0) - bored) * heat * q * (1 - a.grief * 0.6) * (child ? 0.6 : 1), 'feast');
      if (f.skald >= 0 && quiet < 0.3) add((0.35 + a.mood * 0.4) * heat * q, 'listen');
      if (adult && a.age < 40 && (!a.female || a.role === 'shieldmaiden') && a.courage > 0.45 && !a.wounded && quiet < 0.3)
        add((0.4 + a.courage * 0.6 + a.drunk * 0.8) * heat * q * (a.fate === 'raider' ? 1.25 : 1), 'wrestle');
      if (S.ring.a >= 0 && quiet < 0.3) add((0.3 + a.curiosity * 0.35 + a.drunk * 0.3) * heat * q, 'ringWatch');
      if (a.mood > 0.5 && a.drunk > 0.15 && quiet < 0.3 && litCount(S) > 0) add((0.3 + a.drunk * 0.6) * heat * q, 'dance');
    }
    if (child && !a.wounded) add(0.5 + (kF ? 0.1 : 0) - (lateNight ? 0.3 : 0), 'play');
    if (a.warmth < 0.3 && litCount(S) > 0) add(0.7 + (0.3 - a.warmth) * 2, 'warm');
    // sleep: the decay of the evening
    const sleepU = smoothstep(0.5, 1.0, a.fatigue) * 1.6 + (child ? smoothstep(900, 1500, S.t) * 0.7 : 0) + smoothstep(1700, 2100, S.t) * 0.8 - (a.excited > 0 ? 0.4 : 0);
    add(sleepU, 'sleep');
    // --- special people
    if (role === 'jarl') this.jarlOptions(a, add);
    if (role === 'housecarl' && kF && a.fate === 'home') { const j = A[0]; if (j.act !== 'work' && j.act !== 'sleep') add(0.92, 'follow', 0); }
    if (role === 'lady' && kF) { add(0.9, 'follow', 0); }
    if (role === 'watchman' && kF) {
      const vb = S.beacons.length - 1;
      if (S.beacons[vb].lit < 0 && a.id % 6 === A.find((b) => b.role === 'watchman').id % 6) add(1.4, 'lightBeacon');
      else if (S.torches.some((t) => t.lit === -1)) add(1.0, 'torches');
    }
    if (role === 'skald' && feastOn && quiet < 0.25 && !lateNight) add(1.2, 'perform');
    if (role === 'gothi' && feastOn && S.flags.sacrifice < 0 && S.t - f.feastActive > 40) add(1.3, 'sacrifice');
    if (role === 'lawspeaker' && S.flags.thing < 0 && S.items.filter((it) => it.state === 'pile').length >= 6) add(1.3, 'callThing');
    if ((a.know & K_THING) && S.flags.thing >= 0 && S.t - S.flags.thing < 240 && adult && (a.fate !== 'home' || role === 'karl') && quiet < 0.5) add(0.75 + a.curiosity * 0.3, 'thing');
    // fights over loot are pushed onto agents by the steward (act 'argue')
    if (a.act === 'argue' || a.act === 'embrace' || a.act === 'thrown') return;
    if (a.act === 'wrestle' && (S.ring.a === a.id || S.ring.b === a.id)) return;
    // ongoing reserved tasks stay candidates until they finish
    if (TASKS.has(a.act) && !(a.act === 'pyreLog' && a.stage === 0 && S.pyre.logs >= S.pyre.target * 1.3)) add(a.act === 'greet' ? 1.2 : 0.95, a.act, a.p);
    // choose
    let best = null;
    const inTask = TASKS.has(a.act);
    for (const c of C) {
      if (inTask && c[1] === a.act && c[2] !== a.p) continue;
      let u = c[0]; if (c[1] === a.act && c[2] === a.p) u += keep;
      u += (hash2(a.id, S.tick) - 0.5) * 0.04;
      if (!best || u > best[0]) best = [u, c[1], c[2]];
    }
    if (!best) return;
    if (best[1] !== a.act || best[2] !== a.p) this.start(a, best[1], best[2]);
  }
  jarlOptions(a, add) {
    const S = this.S;
    if (!(a.know & K_FLEET)) return;
    if (S.flags.horn < 0) { add(3, 'horn'); return; }
    const py = S.pyre;
    if (py.ready && S.flags.feastActive >= 0 && S.t - S.flags.feastActive > 380 && (py.lit < 0 || S.t - py.lit < 200)) { add(2.5, 'mourn'); return; }
    const beached = S.ships.filter((s) => s.state === 2);
    if (!beached.length) add(2, 'jarlShore');
    else if (!a.met.includes(-1)) add(2.1, 'jarlGreet', beached[0].id);
    else add(1.6, 'jarlSeat');
  }
  start(a, act, p) {
    const S = this.S, L = this.L, GR = this.GR, G = this.G;
    // drop carried props cleanly
    if (a.item >= 0) {
      const it = S.items[a.item];
      if (it && it.carrier === a.id) { it.carrier = -1; if (it.state === 'carried') { it.x = a.x; it.z = a.z; it.state = it.prop ? 'hall' : it.kind === 'body' ? 'dropped' : 'pile'; } }
      a.item = -1;
    }
    if (a.act === 'haul' && a.p >= 0) S.ships[a.p].haulers = Math.max(0, S.ships[a.p].haulers - 1);
    if (a.act === 'fireLog' && a.p >= 0 && S.bonfires[a.p].claim === a.id) S.bonfires[a.p].claim = -1;
    if (a.act === 'wrestle') this.leaveRing(a);
    a.act = act; a.p = p; a.stage = 0; a.actT = 0; a.carry = 0; a.run = false; a.inside = false;
    const st = (key) => GR.site[key];
    const spot = (node, r) => { const ang = hash2(a.id, node) * 6.283, rr = r * Math.sqrt(hash2(node, a.id + 9)); return [G.x[node] + Math.cos(ang) * rr, G.z[node] + Math.sin(ang) * rr]; };
    switch (act) {
      case 'work': {
        const n = workSite(S, L, GR, a); const r = (WORK[a.role] || WORK.karl)[0] === 'pen' ? 14 : 4;
        const [x, z] = spot(n, r); this.goTo(a, n, x, z); a.goalTxt = 'Working: ' + workLabel(a); break;
      }
      case 'watch': {
        const cands = GR.beach; const n = cands[Math.floor(hash2(a.id, 5) * cands.length)];
        const [x, z] = spot(n, 4); this.goTo(a, n, x, z - 6, a.age < 15 || a.curiosity > 0.7); a.goalTxt = 'Watching the ships come in'; break;
      }
      case 'runNews': this.goTo(a, st('shoreWatch'), undefined, undefined, true); a.goalTxt = 'Running to tell the village: sails!'; break;
      case 'greet': { const b = S.agents[p]; this.goPoint(a, b.x, b.z, true); a.goalTxt = `Looking for ${b.name}`; break; }
      case 'haul': { const sh = S.ships[p]; sh.haulers++; const side = a.id % 2 ? 1 : -1; const [x, z] = this.shipLocal(sh, side * (1.2 + (a.id % 4) * 0.9), 15 + (a.id % 6) * 1.5); this.goPoint(a, x, z, true); a.goalTxt = `Hauling ${sh.name} up the sand`; break; }
      case 'unload': case 'corpse': {
        const it = S.items[p]; it.carrier = a.id; a.item = p; const sh = S.ships[it.ship];
        const [x, z] = it.state === 'dropped' ? [it.x, it.z] : this.shipLocal(sh, (a.id % 2 ? 1 : -1) * 3, 2); this.goPoint(a, x, z); a.goalTxt = act === 'corpse' ? `Carrying ${it.name} to the pyre` : `Unloading ${it.name}`; break;
      }
      case 'claim': { const it = S.items[p]; it.carrier = a.id; a.item = p; this.goTo(a, st('lootPile'), it.x, it.z); a.goalTxt = `Claiming his share: ${it.name}`; break; }
      case 'toHealer': this.goTo(a, st('healer')); a.goalTxt = 'Limping to the healer'; break;
      case 'healed': { const [x, z] = spot(st('healer'), 6); this.goTo(a, st('healer'), x, z); a.goalTxt = 'Resting at the healer\'s hut'; break; }
      case 'prop': { const it = S.items[p]; it.carrier = a.id; a.item = p; this.goTo(a, GR.doorNodes[0].door, it.x, it.z, true); a.goalTxt = `Dragging a ${it.kind} out of the hall`; break; }
      case 'fireLog': { S.bonfires[p].claim = a.id; this.goTo(a, st('woodpile'), undefined, undefined, true); a.goalTxt = 'Fetching wood for a bonfire'; break; }
      case 'pyreLog': this.goTo(a, st('woodpile')); a.goalTxt = 'Stacking the pyre for the dead'; break;
      case 'hallShare': { const it = S.items[p]; it.carrier = a.id; a.item = p; this.goTo(a, st('lootPile'), it.x, it.z); a.goalTxt = `Carrying the jarl's share: ${it.name}`; break; }
      case 'serve': this.goTo(a, st('lootPile')); a.goalTxt = 'Serving mead'; break;
      case 'steward': { const [x, z] = spot(st('lootPile'), 3); this.goTo(a, st('lootPile'), x, z); a.goalTxt = 'Sorting the plunder'; break; }
      case 'keen': { const it = S.items[p]; this.goPoint(a, it.x, it.z); a.goalTxt = `Walking beside ${it.name}`; break; }
      case 'mourn': {
        const py = L.S.pyre; const ang = hash2(a.id, 11) * 6.283; const r = (a.grief > 0 || ['jarl', 'seer', 'gothi', 'skald'].includes(a.role)) ? 7 + hash2(a.id, 12) * 4 : 12 + hash2(a.id, 12) * 22;
        const x = py[0] + Math.cos(ang) * r, z = py[1] + Math.abs(Math.sin(ang)) * r * 0.9 + 2;
        this.goPoint(a, x, z); a.goalTxt = S.pyre.lit >= 0 ? 'Standing silent at the pyre' : 'Going to the pyre'; break;
      }
      case 'feast': { const k = Math.floor(hash2(a.id, 21) * L.feastSpots.length); const fs = L.feastSpots[k]; this.goTo(a, GR.feastNodes[k], fs.x + (hash2(a.id, 22) - 0.5) * 7, fs.z + (a.id % 2 ? 1.2 : -1.2)); a.goalTxt = 'Feasting on the beach'; break; }
      case 'listen': { const [x, z] = spot(st('skald'), 9); this.goTo(a, st('skald'), x, z); a.goalTxt = 'Listening to the skald'; break; }
      case 'perform': this.goTo(a, st('skald')); a.goalTxt = 'Singing the deeds of the raid'; break;
      case 'wrestle': { const c = L.S.ring; const ang = hash2(a.id, S.tick) * 6.283; this.goPoint(a, c[0] + Math.cos(ang) * 6.5, c[1] + Math.sin(ang) * 6.5); a.goalTxt = 'Waiting to wrestle'; break; }
      case 'ringWatch': { const c = L.S.ring; const ang = hash2(a.id, 31) * 6.283, r = 7.5 + hash2(a.id, 32) * 4; this.goPoint(a, c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r); a.goalTxt = 'Shouting at the wrestling ring'; break; }
      case 'dance': { const i = nearestLit(S, L, a.x, a.z); a.p = i; const b = L.bonfires[i]; this.goPoint(a, b.x + 5, b.z); a.goalTxt = 'Dancing round the fire'; break; }
      case 'warm': { const i = nearestLit(S, L, a.x, a.z); const b = L.bonfires[i]; const ang = hash2(a.id, 41) * 6.283; this.goPoint(a, b.x + Math.cos(ang) * 3.5, b.z + Math.sin(ang) * 3.5); a.goalTxt = 'Warming at a fire'; break; }
      case 'play': { const n = a.know & K_FLEET ? GR.beach[Math.floor(hash2(a.id >> 1, 51) * GR.beach.length)] : GR.doorNodes[a.home].door; const [x, z] = spot(n, 5); this.goTo(a, n, x + (a.id % 2) * 1.4, z, true); a.goalTxt = 'Playing at swords with a stick'; break; }
      case 'sleep': {
        if (a.drunk > 0.55 && hash2(a.id, 61) < 0.3 && litCount(S) > 0) { const i = nearestLit(S, L, a.x, a.z); const b = L.bonfires[i]; const ang = hash2(a.id, 62) * 6.283; this.goPoint(a, b.x + Math.cos(ang) * 4.5, b.z + Math.sin(ang) * 4.5); a.p = -7; a.goalTxt = 'Passing out by the fire'; }
        else { this.goTo(a, GR.doorNodes[a.home].door); a.goalTxt = a.drunk > 0.4 ? 'Stumbling home to bed' : 'Going home to sleep'; }
        break;
      }
      case 'follow': a.goalTxt = p === 0 ? `Following ${S.agents[0].name}` : 'Following'; this.followTick(a, true); break;
      case 'horn': this.goTo(a, GR.doorNodes[0].door); a.goalTxt = 'Blowing the horn from the hall steps'; break;
      case 'jarlShore': this.goTo(a, st('shoreWatch')); a.goalTxt = 'Walking down to the shore to meet the fleet'; break;
      case 'jarlGreet': { const sh = S.ships[p]; const [x, z] = this.shipLocal(sh, 0, 14); this.goPoint(a, x, z); a.goalTxt = `Greeting the crew of ${sh.name}`; break; }
      case 'jarlSeat': this.goTo(a, st('highSeat')); a.goalTxt = 'Holding the high seat at the feast'; break;
      case 'lightBeacon': this.goTo(a, GR.beaconNodes[GR.beaconNodes.length - 1], undefined, undefined, true); a.carry = CA.torch; a.goalTxt = 'Running to light the village beacon'; break;
      case 'torches': { const i = S.torches.findIndex((t) => t.lit === -1); a.p = i; const n = GR.torchNodes[i]; this.goTo(a, n); a.carry = CA.torch; a.goalTxt = 'Lighting torches along the palisade'; break; }
      case 'sacrifice': this.goTo(a, st('goats')); a.goalTxt = 'Fetching the goat for the godswood'; break;
      case 'callThing': this.goTo(a, st('lootPile')); a.goalTxt = 'Calling the Thing to judge the plunder'; break;
      case 'thing': { const [x, z] = spot(st('thing'), 10); this.goTo(a, st('thing'), x, z); a.goalTxt = 'Attending the Thing'; break; }
      default: a.goalTxt = act;
    }
    a.destTxt = destName(L, G, a.dest);
  }
  dropToWorld(it, a) { it.y = NaN; }
  followTick(a, force) {
    const S = this.S, j = S.agents[a.p];
    if (!j) return;
    const k = a.id % 9, row = Math.floor(k / 3) + 1, col = (k % 3) - 1;
    const bx = j.fx, bz = j.fz;
    const x = j.x - bx * row * 1.8 + -bz * col * 1.6, z = j.z - bz * row * 1.8 + bx * col * 1.6;
    if (force || (Math.hypot(a.tx - x, a.tz - z) > 3 && (this.S.tick + a.id) % 12 === 0)) { this.goPoint(a, x, z, Math.hypot(a.x - x, a.z - z) > 12); a.destTxt = 'beside ' + j.name; }
  }
  tickAct(a, dt) {
    const S = this.S, L = this.L, GR = this.GR, G = this.G, A = S.agents;
    a.actT += dt;
    const arrived = this.move(a, dt);
    const walkAnim = a.moving ? (a.wounded ? AN.limp : a.run ? AN.run : a.drunk > 0.5 ? AN.stumble : a.item >= 0 || (a.carry && a.carry !== CA.torch) ? AN.carry : AN.walk) : AN.idle;
    a.anim = walkAnim;
    const sitePos = (k) => L.S[k];
    const ph = (S.t + a.id * 0.37) % 10;
    switch (a.act) {
      case 'none': break;
      case 'work': {
        const w = WORK[a.role] || WORK.karl;
        if (w[1]) {
          if (w[3]) a.carry = a.stage === 1 ? w[3] : 0;
          if (arrived) {
            a.anim = a.role === 'fisher' && a.stage === 0 ? AN.haul : AN.hammer;
            if (a.actT > 6 + hash2(a.id, a.stage) * 5) {
              a.stage = 1 - a.stage; a.actT = 0;
              const n = siteNode(S, L, GR, a, w[a.stage]);
              const jx = (hash2(a.id, 8) - 0.5) * 6, jz = (hash2(a.id, 9) - 0.5) * 6;
              this.goTo(a, n, G.x[n] + jx, G.z[n] + jz);
              a.destTxt = destName(L, G, n);
            }
          }
        } else if (arrived) {
          a.anim = w[2];
          if (a.role === 'watchman' || a.role === 'herder') { if (a.actT > 8) { a.actT = 0; const n = a.role === 'watchman' ? GR.walk[Math.floor(hash2(a.id, S.tick) * GR.walk.length)] : a.dest; const r = a.role === 'herder' ? 12 : 0; this.goTo(a, n, G.x[n] + (hash2(a.id, S.tick + 1) - 0.5) * r, G.z[n] + (hash2(a.id, S.tick + 2) - 0.5) * r); } }
          if (a.role === 'smith' || a.role === 'shipwright') { a.anim = ph < 6 ? AN.hammer : AN.idle; if (a.role === 'smith') this.face(a, L.S.forge[0] + 8, L.S.forge[1] + 6); }
          if (a.role === 'elder' || a.role === 'netter') a.anim = a.role === 'netter' ? AN.weave : AN.sit;
          if (a.role === 'child') a.anim = AN.spar;
          if (a.role === 'lookout') this.face(a, 0, -900);
        }
        break;
      }
      case 'watch': {
        if (!a.moving) {
          // face the nearest incoming ship and cheer when it is close
          let bd = 1e9, bs = null; for (const sh of S.ships) { const d = Math.hypot(sh.x - a.x, sh.z - a.z); if (sh.state < 2 && d < bd) { bd = d; bs = sh; } }
          if (bs) this.face(a, bs.x, bs.z); else this.face(a, a.x, a.z - 10);
          a.anim = bd < 260 ? (ph < 3 ? AN.cheer : ph < 5 ? AN.point : AN.idle) : ph < 1.5 ? AN.point : AN.idle;
        }
        break;
      }
      case 'runNews': if (arrived) { a.excited = 30; a.act = 'watch'; this.start(a, 'watch'); } else a.excited = 10; break;
      case 'greet': {
        const b = A[a.p];
        if (!b.alive || b.aboard) break;
        const d = Math.hypot(b.x - a.x, b.z - a.z);
        if (d < 2.2) {
          a.met.push(b.id); b.met.push(a.id);
          a.mood = Math.min(1, a.mood + 0.35); b.mood = Math.min(1, b.mood + 0.3);
          this.remember(a, `Found ${b.name} on the beach and held on tight.`); this.remember(b, `${a.name} found me on the beach.`);
          for (const x of [a, b]) { x.act = 'embrace'; x.actT = 0; x.moving = false; x.p = x === a ? b.id : a.id; x.goalTxt = 'Embracing ' + (x === a ? b.name : a.name); }
          if (a.spouse === b.id || hash2(a.id, b.id) < 0.15) logE(S, `${a.name} and ${b.name} find each other at the waterline.`, a.x, a.z, 'reunion');
        } else if (a.actT > 2.5 && Math.hypot(a.tx - b.x, a.tz - b.z) > 3) { a.actT = 0; this.goPoint(a, b.x, b.z, d > 8); }
        else if (!a.moving && a.actT > 14) a.next = S.tick;
        a.stage += dt; if (a.stage > 90) { a.met.push(b.id); a.act = 'none'; a.next = S.tick; }
        break;
      }
      case 'embrace': { const b = A[a.p]; if (b) this.face(a, b.x, b.z); a.anim = AN.embrace; if (a.actT > 6) { a.act = 'none'; a.next = S.tick; } break; }
      case 'haul': {
        const sh = S.ships[a.p];
        if (sh.haul >= 1) { a.act = 'none'; a.next = S.tick; break; }
        if (!a.moving) { a.anim = AN.haul; const [x, z] = this.shipLocal(sh, 0, 0); this.face(a, x, z); a.x += Math.sin(sh.yaw) * 0.0112 * sh.haulers * dt * 6; a.z += Math.cos(sh.yaw) * 0.0112 * sh.haulers * dt * 6; }
        break;
      }
      case 'unload': case 'corpse': {
        const it = S.items[a.p];
        if (a.stage === 0 && arrived) {
          a.stage = 1; it.state = 'carried'; a.carry = it.ck;
          if (a.act === 'corpse') { this.goTo(a, GR.site.pyre, L.S.pyre[0] + (hash2(it.id, 1) - 0.5) * 3, L.S.pyre[1] + 1.5); }
          else this.goTo(a, GR.site.lootPile, L.S.lootPile[0] + (hash2(it.id, 1) - 0.5) * 9, L.S.lootPile[1] + (hash2(it.id, 2) - 0.5) * 6);
        } else if (a.stage === 1) {
          a.carry = it.ck; it.x = a.x; it.z = a.z;
          if (arrived) {
            a.carry = 0; it.carrier = -1; a.item = -1;
            if (a.act === 'corpse') { it.state = 'pyre'; S.pyre.bodies++; this.remember(a, `Laid ${it.name} on the pyre.`); logE(S, `${it.name.replace('the body', 'The body')} is laid on the pyre.`, it.x, it.z, 'grief'); }
            else { it.state = 'pile'; it.x = a.x; it.z = a.z; }
            a.act = 'none'; a.next = S.tick;
          }
        }
        if (a.stage === 0 && (it.state === 'ship' || it.state === 'dropped')) { it.carrier = a.id; }
        break;
      }
      case 'claim': case 'hallShare': {
        const it = S.items[a.p];
        if (a.stage === 0 && arrived) {
          a.stage = 1; it.state = 'carried';
          if (a.act === 'claim') { this.goTo(a, GR.doorNodes[a.home].door); this.remember(a, `Carried home ${it.name}.`); }
          else this.goTo(a, GR.doorNodes[0].door);
        } else if (a.stage === 1) {
          a.carry = it.ck; it.x = a.x; it.z = a.z;
          if (arrived) { a.carry = 0; it.carrier = -1; a.item = -1; it.state = 'home'; it.x = a.x; it.z = a.z; a.act = 'none'; a.next = S.tick; if (a.act === 'claim') a.mood = Math.min(1, a.mood + 0.15); }
        }
        break;
      }
      case 'argue': {
        const b = A[a.p]; if (b) this.face(a, b.x, b.z);
        a.anim = (a.drunk > 0.45 && b && b.drunk > 0.45) ? AN.wrestle : AN.argue;
        if (a.actT > a.stage) { a.act = 'none'; a.next = S.tick; }
        break;
      }
      case 'toHealer': if (arrived) { this.start(a, 'healed'); } break;
      case 'healed': if (!a.moving) { a.anim = a.actT < 300 ? AN.lie : AN.sit; this.face(a, L.S.healer[0], L.S.healer[1]); a.goalTxt = a.actT < 300 ? 'Having the wound cleaned and bound' : 'Resting, bandaged'; } if (a.actT > 420) { a.wounded = false; a.act = 'none'; a.next = S.tick; this.remember(a, 'The healer stitched the wound. It will hold.'); } break;
      case 'prop': {
        const it = S.items[a.p];
        if (a.stage === 0 && arrived) { a.stage = 1; it.state = 'carried'; const k = it.k; const n = k < GR.feastNodes.length ? GR.feastNodes[k] : GR.site.lootPile; this.goTo(a, n, it.dx, it.dz, true); }
        else if (a.stage === 1) {
          a.carry = it.ck; it.x = a.x; it.z = a.z;
          if (arrived) { it.state = 'placed'; it.x = it.dx; it.z = it.dz; it.carrier = -1; a.item = -1; a.carry = 0; a.act = 'none'; a.next = S.tick; }
        }
        break;
      }
      case 'fireLog': case 'pyreLog': {
        if (a.stage === 0 && arrived) {
          a.stage = 1; a.carry = CA.log;
          if (a.act === 'fireLog') { const b = L.bonfires[a.p]; this.goTo(a, GR.bonfireNodes[a.p], b.x, b.z - 2); }
          else { const ang = hash2(a.id, S.tick) * 6.283; this.goPoint(a, L.S.pyre[0] + Math.cos(ang) * 3.5, L.S.pyre[1] + Math.sin(ang) * 3.5); }
        } else if (a.stage === 1) {
          a.carry = CA.log;
          if (arrived) {
            a.carry = 0;
            if (a.act === 'fireLog') {
              const b = S.bonfires[a.p];
              b.logs += 3; if (b.lit > 0) b.fuel = Math.min(1, b.fuel + 0.5);
              if (b.lit <= 0 && b.logs >= 3) { b.lit = S.t; b.fuel = 1; if (S.bonfires.filter((q) => q.lit > 0).length === 1) logE(S, 'The first bonfire catches on the beach.', L.bonfires[a.p].x, L.bonfires[a.p].z, 'fire'); }
              b.claim = -1;
            } else { S.pyre.logs++; }
            a.act = 'none'; a.next = S.tick;
          }
        }
        break;
      }
      case 'serve': {
        if (arrived) {
          a.stage = 1 - a.stage; a.carry = a.stage ? CA.horn : 0;
          const fs = L.feastSpots[Math.floor(hash2(a.id, S.tick) * L.feastSpots.length)];
          if (a.stage) this.goPoint(a, fs.x + (hash2(a.id, 2) - 0.5) * 6, fs.z - 2); else this.goTo(a, GR.site.lootPile, L.S.lootPile[0] + 5, L.S.lootPile[1] - 2);
        }
        break;
      }
      case 'steward': {
        if (!a.moving) {
          a.anim = ph < 4 ? AN.speak : AN.idle; this.face(a, L.S.lootPile[0], L.S.lootPile[1]);
          if (a.actT > 5) {
            a.actT = 0;
            const it = S.items.find((q) => q.state === 'pile' && q.owner === -1 && q.kind !== 'body');
            if (it) this.assignLoot(it, a);
          }
        }
        break;
      }
      case 'keen': {
        const it = S.items[a.p];
        if (it.state === 'pyre' || it.state === 'ship') { if (!a.moving) { a.anim = AN.kneel; this.face(a, it.x, it.z); } if (it.state === 'pyre' && arrived && a.actT > 30) { a.next = S.tick; } }
        else if (a.actT > 2) { a.actT = 0; this.goPoint(a, it.x + 1.5, it.z + 1.5); }
        a.goalTxt = it.state === 'pyre' ? `Kneeling by ${it.name} on the pyre` : `Walking beside ${it.name}`;
        break;
      }
      case 'mourn': {
        if (!a.moving) {
          this.face(a, L.S.pyre[0], L.S.pyre[1]);
          a.anim = a.grief > 0.5 ? AN.kneel : AN.mourn;
          if (a.role === 'skald' && S.pyre.lit >= 0) a.anim = AN.music;
          if (a.role === 'seer' || a.role === 'gothi') a.anim = AN.speak;
          if (a.role === 'jarl' && S.pyre.lit < 0) a.anim = AN.speak;
          // the seer and the jarl light the pyre together once both are there
          if (S.pyre.lit < 0 && S.pyre.ready && (a.role === 'seer' || a.role === 'jarl')) {
            const j = A.find((q) => q.role === 'jarl'), s = A.find((q) => q.role === 'seer');
            const near = (q) => Math.hypot(q.x - L.S.pyre[0], q.z - L.S.pyre[1]) < 16 && !q.moving;
            if (near(j) && near(s) && a.actT > 20) {
              S.pyre.lit = S.t; logE(S, 'The pyre is lit. The beach goes quiet.', L.S.pyre[0], L.S.pyre[1], 'grief');
              for (const q of A) if (q.alive && !q.aboard && Math.hypot(q.x - L.S.pyre[0], q.z - L.S.pyre[1]) < 400) { this.learn(q, K_PYRE, null); q.next = Math.min(q.next, S.tick + 2 + (q.id % 30)); }
            }
          }
        }
        break;
      }
      case 'feast': {
        if (!a.moving) {
          this.face(a, a.x, a.z + (a.id % 2 ? -1 : 1));
          const c = (S.t * 0.25 + hash2(a.id, 1) * 10) % 10;
          a.anim = c < 4 ? AN.sit : c < 6.2 ? AN.drink : c < 7 ? AN.cheer : AN.sit;
          if (a.anim === AN.drink) { a.drunk = Math.min(1, a.drunk + dt * 0.004 * S.params.heat); a.hunger = Math.max(0, a.hunger - dt * 0.004); a.mood = Math.min(1, a.mood + dt * 0.002); }
          a.warmth = Math.min(1, a.warmth + dt * 0.002);
          a.carry = a.anim === AN.drink ? CA.horn : 0;
        }
        break;
      }
      case 'listen': if (!a.moving) { this.face(a, L.S.skald[0], L.S.skald[1]); a.anim = ph < 1 ? AN.cheer : ph < 1.7 ? AN.drink : AN.idle; a.mood = Math.min(1, a.mood + dt * 0.001); } break;
      case 'perform': if (arrived || !a.moving) { a.anim = AN.music; this.face(a, L.S.skald[0], L.S.skald[1] + 10); if (S.flags.skald < 0) { S.flags.skald = S.t; logE(S, 'The skald strikes up the saga of the raid.', a.x, a.z, 'feast'); } a.goalTxt = 'Singing of ' + S.raidTarget; } break;
      case 'wrestle': if (!a.moving) { this.joinRing(a); if (S.ring.a !== a.id && S.ring.b !== a.id) { this.face(a, L.S.ring[0], L.S.ring[1]); a.anim = ph < 2 ? AN.cheer : AN.idle; } } break;
      case 'thrown': a.anim = AN.lie; if (a.actT > 3.5) { a.act = 'none'; a.next = S.tick; } break;
      case 'ringWatch': if (!a.moving) { this.face(a, L.S.ring[0], L.S.ring[1]); a.anim = S.ring.a >= 0 ? (ph < 4 ? AN.cheer : AN.point) : AN.idle; } break;
      case 'dance': {
        if (!a.moving) {
          const b = L.bonfires[a.p] || L.bonfires[0];
          const ang = S.t * 0.35 + hash2(a.id, 3) * 6.283, r = 4.6 + (a.id % 3) * 0.9;
          const nx = b.x + Math.cos(ang) * r, nz = b.z + Math.sin(ang) * r;
          a.fx = -Math.sin(ang); a.fz = Math.cos(ang);
          a.x = nx; a.z = nz; a.anim = AN.dance; a.mood = Math.min(1, a.mood + dt * 0.002);
          if (S.bonfires[a.p] && S.bonfires[a.p].lit <= 0) a.next = S.tick;
        }
        break;
      }
      case 'warm': if (!a.moving) { a.warmth = Math.min(1, a.warmth + dt * 0.02); a.anim = AN.idle; const i = nearestLit(S, L, a.x, a.z); this.face(a, L.bonfires[i].x, L.bonfires[i].z); } break;
      case 'play': {
        if (!a.moving) {
          a.anim = AN.spar; a.carry = CA.stick;
          const ang = S.t * 1.3 + a.id; a.x += Math.cos(ang) * dt * 0.8; a.z += Math.sin(ang) * dt * 0.8;
          this.face(a, a.x + Math.cos(S.t * 0.9 + (a.id % 2) * 3.14), a.z + Math.sin(S.t * 0.9 + (a.id % 2) * 3.14));
          if (a.actT > 25) { a.actT = 0; this.start(a, 'play'); }
        }
        break;
      }
      case 'sleep': {
        if (a.p === -7) { if (!a.moving) { a.anim = AN.lie; a.stage = 1; } break; }
        if (a.stage === 0 && arrived) { a.stage = 1; a.inside = true; a.x = G.x[GR.doorNodes[a.home].inside]; a.z = G.z[GR.doorNodes[a.home].inside]; }
        if (a.stage === 1) { a.inside = true; a.anim = AN.lie; }
        break;
      }
      case 'follow': { this.followTick(a, false); if (!a.moving) { const j = A[a.p]; a.fx = j.fx; a.fz = j.fz; a.anim = j.anim === AN.speak ? AN.idle : j.moving ? AN.walk : AN.idle; } break; }
      case 'horn': if (arrived) { a.anim = AN.cheer; a.carry = CA.horn; this.face(a, 0, 0); if (S.flags.horn < 0) { S.flags.horn = S.t; S.flags.feastOrdered = S.t; logE(S, `${a.name} blows the horn from the hall steps and calls for a feast.`, a.x, a.z, 'news'); for (const q of A) if (q.alive && (q.role === 'thrall' || q.role === 'overseer') && q.home === 0) this.learn(q, K_FEAST, null, 'The jarl ordered the feast dragged out to the beach.'); a.know |= K_FEAST; a.excited = 40; } if (a.actT > 6) { a.act = 'none'; a.next = S.tick; } } break;
      case 'jarlShore': if (!a.moving) { a.anim = ph < 3 ? AN.speak : AN.idle; let s = S.ships.find((q) => q.state < 2); if (s) this.face(a, s.x, s.z); } break;
      case 'jarlGreet': if (!a.moving) { const sh = S.ships[a.p]; this.face(a, sh.x, sh.z); a.anim = AN.embrace; if (a.actT > 14 && !a.met.includes(-1)) { a.met.push(-1); const c = A[sh.captain]; this.remember(a, `Clasped arms with ${c.name}, captain of ${sh.name}.`); this.remember(c, `${a.name} came down to the water and clasped my arm.`); logE(S, `The jarl clasps arms with ${c.name} of ${sh.name}.`, a.x, a.z, 'reunion'); a.next = S.tick; } } break;
      case 'jarlSeat': if (!a.moving) { a.anim = ph < 2 ? AN.drink : ph < 3 ? AN.speak : AN.sit; a.carry = a.anim === AN.drink ? CA.horn : 0; this.face(a, L.S.feast[0], L.S.feast[1] - 20); a.drunk = Math.min(0.7, a.drunk + dt * 0.002); } break;
      case 'lightBeacon': a.carry = CA.torch; if (arrived) { const vb = S.beacons.length - 1; if (S.beacons[vb].lit < 0) { S.beacons[vb].lit = S.t; logE(S, 'The village beacon roars up above the hall.', a.x, a.z, 'fire'); this.remember(a, 'Lit the village beacon.'); } a.act = 'none'; a.next = S.tick; } break;
      case 'torches': {
        a.carry = CA.torch;
        if (arrived) {
          const T = L.torches;
          if (a.p >= 0 && S.torches[a.p].lit === -1) S.torches[a.p].lit = S.t;
          for (let i = 0; i < T.length; i++) if (S.torches[i].lit === -1 && Math.hypot(T[i].x - a.x, T[i].z - a.z) < 9) S.torches[i].lit = S.t;
          const i = S.torches.findIndex((t, k) => t.lit === -1 && (k % 3) === (a.id % 3)) ;
          const j = i >= 0 ? i : S.torches.findIndex((t) => t.lit === -1);
          if (j >= 0) { a.p = j; this.goTo(a, GR.torchNodes[j]); } else { a.act = 'none'; a.next = S.tick; }
        }
        break;
      }
      case 'sacrifice': {
        const g = S.goat;
        if (a.stage === 0 && arrived) { a.stage = 1; g.state = 1; this.goTo(a, GR.site.altar); a.goalTxt = 'Leading the goat to the godswood'; logE(S, `${a.name} leads a goat up to the godswood.`, a.x, a.z, 'rite'); }
        else if (a.stage === 1 && arrived) { a.stage = 2; a.actT = 0; g.state = 2; a.goalTxt = 'Offering the goat to the gods'; }
        else if (a.stage === 2) { a.anim = AN.speak; this.face(a, L.S.altar[0], L.S.altar[1] + 6); if (a.actT > 40) { g.state = 3; S.flags.sacrifice = S.t; S.offerings++; logE(S, 'The goat is given to the gods; its hide hangs in the ash tree.', a.x, a.z, 'rite'); this.remember(a, 'Gave the goat to the gods for the fallen.'); a.act = 'none'; a.next = S.tick; } }
        break;
      }
      case 'callThing':
        if (a.stage === 0 && arrived) { a.stage = 1; a.actT = 0; if (S.flags.thing < 0) { S.flags.thing = S.t; a.know |= K_THING; a.excited = 45; logE(S, `${a.name} calls the Thing to judge the plunder.`, a.x, a.z, 'law'); } }
        else if (a.stage === 1) { a.anim = AN.speak; a.excited = 5; if (a.actT > 14) { a.stage = 2; this.goTo(a, GR.site.thing); a.destTxt = 'the Thing-stead'; } }
        else if (a.stage === 2 && arrived) { a.anim = ph < 6 ? AN.speak : AN.argue; this.face(a, L.S.thing[0], L.S.thing[1] - 12); a.goalTxt = 'Speaking the law at the Thing'; if (a.actT > 260) { a.act = 'none'; a.next = S.tick; } }
        break;
      case 'thing': if (!a.moving) { this.face(a, L.S.thing[0], L.S.thing[1]); a.anim = ph < 1 ? AN.cheer : ph < 2 ? AN.argue : AN.idle; } break;
    }
  }
  assignLoot(it, steward) {
    const S = this.S, A = S.agents, rng = (k) => hash2(it.id * 31 + k, S.tick);
    if (rng(1) < 0.3) { it.owner = -2; logE(S, `The steward sets aside ${it.name} for the jarl.`, it.x, it.z, 'loot'); return; }
    const crew = S.ships[it.ship].crew.filter((id) => A[id].alive && !A[id].aboard);
    if (!crew.length) return;
    const o = A[crew[Math.floor(rng(2) * crew.length)]];
    it.owner = o.id; o.next = S.tick + 1;
    this.learn(o, K_BEACH, null);
    this.remember(o, `The steward gave me ${it.name} as my share.`);
    // a rival from the same raid disputes the share
    const r = o.rival >= 0 ? A[o.rival] : null;
    if (r && r.alive && !r.aboard && it.value > 30 && Math.hypot(r.x - o.x, r.z - o.z) < 200 && rng(3) < 0.75) {
      for (const [x, y] of [[o, r], [r, o]]) { if (x.act === 'sleep' && x.stage) continue; this.start(x, 'none'); x.act = 'argue'; x.p = y.id; x.stage = 18 + rng(4) * 14; x.actT = 0; x.goalTxt = `Arguing with ${y.name} over ${it.name}`; this.goPoint(x, it.x + (x === o ? 1.2 : -1.2), it.z, true); x.next = S.tick + 250; }
      const win = (o.courage + o.strength + rng(5)) > (r.courage + r.strength + rng(6)) ? o : r;
      it.owner = win.id;
      const lose = win === o ? r : o; lose.mood = Math.max(0, lose.mood - 0.3);
      this.remember(win, `Won ${it.name} from ${lose.name} at the loot pile.`); this.remember(lose, `Lost ${it.name} to ${win.name}. This is not finished.`);
      logE(S, `${o.name} and ${r.name} come to blows over ${it.name}.`, it.x, it.z, 'fight');
    } else logE(S, `${it.name[0].toUpperCase() + it.name.slice(1)} goes to ${o.name}.`, it.x, it.z, 'loot');
  }
  joinRing(a) {
    const R = this.S.ring, S = this.S, L = this.L;
    if (R.a < 0 || R.b < 0) {
      if (R.a < 0) { R.a = a.id; R.t = 0; return; }
      if (R.a !== a.id && R.b < 0) { R.b = a.id; R.t = 0; R.dur = 14 + hash2(R.a, a.id) * 20; R.ang = 0; R.bouts++; if (R.bouts === 1) logE(S, 'A wrestling ring forms on the beach.', L.S.ring[0], L.S.ring[1], 'feast'); }
    }
  }
  leaveRing(a) { const R = this.S.ring; if (R.a === a.id) { R.a = R.b; R.b = -1; } else if (R.b === a.id) R.b = -1; }
  tickRing(dt) {
    const S = this.S, R = S.ring, L = this.L, A = S.agents;
    if (R.a >= 0 && (A[R.a].act !== 'wrestle')) { R.a = R.b; R.b = -1; }
    if (R.b >= 0 && (A[R.b].act !== 'wrestle')) R.b = -1;
    if (R.a < 0 || R.b < 0) return;
    const a = A[R.a], b = A[R.b];
    if (a.moving || b.moving) return;
    R.t += dt; R.ang += dt * 0.6;
    const c = L.S.ring;
    const ca = Math.cos(R.ang), sa = Math.sin(R.ang);
    a.x = c[0] + ca * 0.45; a.z = c[1] + sa * 0.45; b.x = c[0] - ca * 0.45; b.z = c[1] - sa * 0.45;
    this.face(a, b.x, b.z); this.face(b, a.x, a.z); a.anim = b.anim = AN.wrestle;
    a.goalTxt = `Wrestling ${b.name}`; b.goalTxt = `Wrestling ${a.name}`;
    if (R.t > R.dur) {
      const sa_ = a.strength + a.courage * 0.5 - a.drunk * 0.4 + hash2(a.id, S.tick) * 0.6;
      const sb_ = b.strength + b.courage * 0.5 - b.drunk * 0.4 + hash2(b.id, S.tick) * 0.6;
      const [w, l] = sa_ > sb_ ? [a, b] : [b, a];
      w.mood = Math.min(1, w.mood + 0.2); l.mood = Math.max(0, l.mood - 0.1); l.fatigue += 0.05;
      this.remember(w, `Threw ${l.name} in the ring.`); this.remember(l, `Was thrown by ${w.name} in the ring.`);
      logE(S, `${w.name} throws ${l.name} into the sand.`, c[0], c[1], 'feast');
      R.a = -1; R.b = -1;
      l.act = 'thrown'; l.actT = 0; l.next = S.tick + 40;
      w.act = 'none'; w.next = S.tick + 1; w.anim = AN.cheer;
    }
  }
  tickDogs(dt) {
    const S = this.S, A = S.agents, L = this.L;
    const feastOn = S.flags.feastActive >= 0;
    for (let i = 0; i < S.dogs.length; i++) {
      const d = S.dogs[i]; d.px = d.x; d.pz = d.z; d.t -= dt;
      const o = A[d.owner];
      if (d.t <= 0) {
        d.t = 3 + hash2(i, S.tick) * 4;
        if (feastOn && (i % 3) === 0 && S.quiet < 0.5) { const fs = L.feastSpots[(i * 5) % L.feastSpots.length]; d.tx = fs.x + (hash2(i, 2) - 0.5) * 4; d.tz = fs.z - 3; d.st = 2; }
        else if (o.alive && !o.aboard && !o.inside) { d.tx = o.x + (hash2(i, S.tick) - 0.5) * 6; d.tz = o.z + (hash2(S.tick, i) - 0.5) * 6; d.st = 1; }
        else { const b = L.B[o.home]; d.tx = b.door[0] + (hash2(i, 5) - 0.5) * 4; d.tz = b.door[1] + 1; d.st = 0; }
      }
      // two dogs at the same scraps fight
      if (d.st === 2 && (i % 6) === 0) { const e = S.dogs[i + 3]; if (e && e.st === 2) { const ang = S.t * 3 + i; d.tx = e.x + Math.cos(ang) * 1.1; d.tz = e.z + Math.sin(ang) * 1.1; d.fight = i + 3; } }
      else d.fight = -1;
      const dx = d.tx - d.x, dz = d.tz - d.z, dd = Math.hypot(dx, dz);
      const sp = dd > 8 ? 5 : 2.2;
      if (dd > 0.4) { d.x += (dx / dd) * Math.min(dd, sp * dt); d.z += (dz / dd) * Math.min(dd, sp * dt); }
    }
  }
  tickGoat(dt) {
    const S = this.S, g = S.goat, L = this.L;
    if (g.state === 1 || g.state === 2) {
      const gothi = S.agents.find((a) => a.role === 'gothi');
      if (gothi) { const dx = gothi.x - g.x, dz = gothi.z - g.z, d = Math.hypot(dx, dz); if (d > 1.6) { g.x += (dx / d) * Math.min(d - 1.6, 2.5 * dt); g.z += (dz / d) * Math.min(d - 1.6, 2.5 * dt); } }
    }
  }
}
const TASKS = new Set(['fireLog', 'pyreLog', 'prop', 'unload', 'corpse', 'claim', 'hallShare', 'haul', 'greet', 'keen', 'sacrifice', 'callThing', 'lightBeacon', 'torches', 'toHealer', 'healed', 'horn', 'jarlGreet']);
function litCount(S) { let n = 0; for (const b of S.bonfires) if (b.lit > 0) n++; return n; }
function nearestLit(S, L, x, z) { let bi = 0, bd = 1e9; for (let i = 0; i < L.bonfires.length; i++) { if (S.bonfires[i].lit <= 0) continue; const d = Math.hypot(L.bonfires[i].x - x, L.bonfires[i].z - z); if (d < bd) { bd = d; bi = i; } } return bi; }
function workLabel(a) {
  return { smith: 'hammering at the forge', shipwright: 'trimming strakes on the new hull', fisher: 'landing fish and hanging it to dry', herder: 'minding the animals', brewer: 'brewing ale', baker: 'baking flatbread', weaver: 'at the loom', dyer: 'at the dye pots', netter: 'mending nets', tanner: 'scraping hides', healer: 'grinding herbs', seer: 'reading the bones', skald: 'composing', gothi: 'tending the godswood', lawspeaker: 'reciting the law', watchman: 'walking the palisade', overseer: 'directing the thralls', thrall: 'carrying water', woodsman: 'hauling timber to the shipyard', karl: 'hauling timber to the shipyard', housecarl: 'drilling with sword and shield', wife: 'at the loom', elder: 'sitting by the door', lookout: 'watching the narrows', child: 'playing', jarl: 'holding court', lady: 'keeping the hall', shieldmaiden: 'drilling' }[a.role] || 'working';
}
const SITE_NAMES = { hallDoor: 'the great hall', feast: 'the feast on the beach', ring: 'the wrestling ring', pyre: 'the pyre', skald: "the skald's fire", highSeat: 'the high seat', lootPile: 'the loot pile', forge: 'the forge', healer: "the healer's hut", brewery: 'the brewhouse', bakery: 'the bread ovens', lookout: 'the lookout rock', villageBeacon: 'the village beacon', thing: 'the Thing-stead', godswood: 'the godswood', altar: 'the altar stone', seer: "the seer's hut", woodlot: 'the woodlot', shipyard: 'the shipyard', slipTop: 'the slipway', waterDraw: 'the stream', practice: 'the practice field', fishRacks: 'the drying racks', netShore: 'the net shore', pierW: 'the west pier', pierE: 'the east pier', woodpile: 'the woodpile', hides: 'the hide frames', dye: 'the dye pots', sheep: 'the sheep fold', goats: 'the goat shed', pigs: 'the pig wallow', horses: 'the horse paddock', byre: 'the byre', fieldE: 'the east fields', fieldW: 'the west fields', shoreWatch: 'the waterline' };
let _siteIdx = null;
function destName(L, G, n) {
  if (n === undefined || n < 0) return '';
  let best = 'the shore road', bd = 30;
  for (const k in L.S) { const d = Math.hypot(L.S[k][0] - G.x[n], L.S[k][1] - G.z[n]); if (d < bd) { bd = d; best = SITE_NAMES[k] || k; } }
  if (G.tag[n] === 4) best = 'the palisade walk';
  if (G.tag[n] === 3) best = 'the pier';
  if (G.tag[n] === 1 && bd >= 30) best = 'the beach';
  for (const b of L.B) if (Math.hypot(b.door[0] - G.x[n], b.door[1] - G.z[n]) < 3) return b.kind === 'hall' ? 'the great hall' : b.kind === 'house' ? 'a longhouse door' : 'the ' + b.kind;
  return best;
}
export function clock(t) {
  const m = 19 * 60 + 40 + Math.floor(t / 60 * 3.4);
  const h = Math.floor(m / 60) % 24, mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
