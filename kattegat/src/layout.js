// Procedural settlement plan: roads, sites, longhouses, pens, fields, palisade, beacons.
import { RNG, polyDist, catmull, clamp, smoothstep } from './util.js';
import { heightAt, waterSDF, villageMask, STREAM, FJORD } from './terrain.js';

export function makeLayout(seed, grid) {
  const rng = new RNG(seed * 31 + 7);
  const H = (x, z) => grid.get(x, z);
  const roads = [];
  const road = (kind, w, pts, smooth = true) => { const p = smooth ? catmull(pts, 5) : pts; roads.push({ kind, w, pts: p }); return p; };

  const S = {}; // named sites
  S.hallDoor = [0, 342];
  S.hall = [0, 354];
  S.feast = [10, 84];
  S.ring = [128, 86];
  S.pyre = [-128, 80];
  S.skald = [-18, 88];
  S.highSeat = [10, 100];
  S.lootPile = [-60, 104];
  S.forge = [132, 152];
  S.healer = [62, 200];
  S.brewery = [-52, 178];
  S.bakery = [42, 150];
  S.lookout = [-262, -48];
  S.villageBeacon = [-70, 478];
  S.thing = [205, 342];
  S.godswood = [150, 455];
  S.altar = [150, 463];
  S.seer = [100, 496];
  S.woodlot = [-212, 382];
  S.shipyard = [-262, 88];
  S.slipTop = [-250, 108];
  S.waterDraw = [-108, 128];
  S.practice = [232, 214];
  S.fishRacks = [262, 100];
  S.netShore = [190, 84];
  S.pierW = [-182, 70];
  S.pierE = [222, 70];
  S.woodpile = [-160, 120];
  S.hides = [300, 140];
  S.dye = [-92, 236];
  S.sheep = [262, 392];
  S.goats = [-250, 262];
  S.pigs = [160, 268];
  S.horses = [292, 300];
  S.byre = [-70, 432];
  S.fieldE = [-157, 425];
  S.fieldW = [-273, 207];
  S.shoreWatch = [20, 70];

  const shore = road('shore', 5, [[-345, 118], [-260, 112], [-200, 106], [-100, 102], [0, 100], [100, 102], [200, 108], [290, 112], [340, 122]]);
  const main = road('main', 5, [[0, 100], [12, 160], [-8, 220], [6, 282], [0, 326], [0, 340]]);
  const east = road('lane', 3.5, [[100, 102], [128, 150], [160, 230], [198, 300], [205, 342], [235, 430], [262, 470]]);
  const west = road('lane', 3.5, [[-100, 102], [-118, 170], [-160, 270], [-212, 370]]);
  const godsL = road('path', 2.5, [[140, 336], [148, 400], [150, 440], [122, 476], [100, 494]]);
  const upper = road('lane', 3, [[-212, 370], [-130, 344], [-60, 330], [0, 326], [70, 330], [140, 336], [205, 342]]);
  const yard = road('lane', 3.5, [[-200, 106], [-232, 98], [-258, 92]]);
  const fish = road('lane', 3, [[200, 108], [240, 100], [290, 98]]);
  const look = road('path', 2, [[-345, 118], [-320, 60], [-292, 10], [-262, -48]]);
  const byreL = road('path', 2.5, [[-60, 330], [-66, 400], [-70, 432], [-70, 478]]);
  const pensL = road('path', 2.5, [[160, 230], [160, 268], [225, 300], [292, 300], [262, 392], [235, 430]]);
  const goatL = road('path', 2.5, [[-160, 270], [-250, 262]]);
  const beachL = road('beach', 4, [[-150, 82], [-60, 80], [40, 78], [150, 82], [210, 82]]);
  const pyreL = road('path', 3, [[-100, 102], [-128, 80]]);
  const practiceL = road('path', 2.5, [[160, 230], [232, 214]]);
  const hidesL = road('path', 2, [[290, 112], [300, 140]]);
  const healerL = road('path', 2.5, [[12, 160], [62, 200]]);

  // palisade ellipse around the hall knoll
  const pal = [];
  const PC = [0, 352], PRX = 112, PRZ = 82;
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pal.push([PC[0] + Math.cos(a) * PRX * (1 + 0.05 * Math.sin(a * 3)), PC[1] + Math.sin(a) * PRZ]);
  }
  const gates = [[0, 270], [PC[0] + PRX, PC[1]], [PC[0] - PRX, PC[1]]];

  // --- buildings ------------------------------------------------------
  const B = [];
  const circlesOf = (b) => {
    const out = []; const n = Math.max(2, Math.ceil(b.len / b.wid));
    for (let i = 0; i < n; i++) {
      const lx = (i / (n - 1) - 0.5) * (b.len - b.wid);
      out.push([b.x + Math.cos(b.rot) * lx, b.z - Math.sin(b.rot) * lx, b.wid * 0.62]);
    }
    return out;
  };
  const reserved = [];
  for (const k of ['feast', 'ring', 'pyre', 'lootPile', 'thing', 'godswood', 'woodlot', 'shipyard', 'practice', 'fishRacks', 'lookout', 'villageBeacon', 'sheep', 'goats', 'pigs', 'horses', 'byre', 'waterDraw', 'woodpile', 'hides', 'netShore', 'shoreWatch'])
    reserved.push([S[k][0], S[k][1], k === 'sheep' || k === 'godswood' ? 34 : k === 'feast' ? 60 : k === 'shipyard' ? 40 : 18]);
  const fieldsRect = [
    { x0: -315, x1: -232, z0: 168, z1: 246, rot: 0.05 },
    { x0: -192, x1: -122, z0: 398, z1: 452, rot: -0.08 },
  ];
  const fits = (b, gap = 3) => {
    const cs = circlesOf(b);
    for (const [cx, cz, r] of cs) {
      for (const R of roads) if (polyDist(cx, cz, R.pts) < r + R.w * 0.5 + gap) return false;
      for (const o of B) for (const [ox, oz, orr] of circlesOf(o)) if (Math.hypot(cx - ox, cz - oz) < r + orr + gap) return false;
      for (const [rx, rz, rr] of reserved) if (Math.hypot(cx - rx, cz - rz) < r + rr) return false;
      if (polyDist(cx, cz, STREAM) < r + 6) return false;
      if (polyDist(cx, cz, pal) < r + 6) return false;
      for (const f of fieldsRect) if (cx > f.x0 - r && cx < f.x1 + r && cz > f.z0 - r && cz < f.z1 + r) return false;
      if (H(cx, cz) < 1.8) return false;
    }
    // slope check
    let lo = 1e9, hi = -1e9;
    for (const [cx, cz, r] of cs) for (const [ox, oz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const h = H(cx + ox, cz + oz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    if (hi - lo > 5.5) return false;
    b.y = lo;
    return true;
  };
  const orient = (x, z) => { const e = 3; const gx = H(x + e, z) - H(x - e, z), gz = H(x, z + e) - H(x, z - e); return Math.atan2(-gx, -gz); };
  const addB = (b) => {
    b.id = B.length;
    const dd = b.wid / 2 + 1.2;
    b.door = [b.x + Math.sin(b.rot) * dd, b.z + Math.cos(b.rot) * dd];
    B.push(b); return b;
  };

  // Great hall (fixed)
  const hall = { kind: 'hall', x: S.hall[0], z: S.hall[1], rot: 0, len: 52, wid: 13, roof: 'shingle', rich: true };
  hall.y = Math.min(H(-26, 354), H(26, 354), H(0, 347), H(0, 361)) ;
  addB(hall); hall.door = [0, 345.5];
  // special huts
  const special = [
    ['forge', S.forge, 14, 8], ['healer', S.healer, 10, 6], ['brewery', S.brewery, 12, 7], ['bakery', S.bakery, 10, 6],
    ['seer', S.seer, 6, 5], ['boatshed', [-292, 112], 30, 9], ['store', [-60, 125], 12, 6], ['store', [70, 300], 10, 6],
  ];
  for (const [kind, p, len, wid] of special) {
    const b = { kind, x: p[0] + (kind === 'forge' ? 10 : 6), z: p[1] + (kind === 'forge' ? 6 : 8), len, wid, roof: kind === 'seer' ? 'turf' : rng.chance(0.5) ? 'turf' : 'shingle', rich: false };
    b.rot = orient(b.x, b.z);
    if (kind === 'boatshed') b.rot = 0.1;
    b.y = Math.min(H(b.x - len / 2, b.z), H(b.x + len / 2, b.z), H(b.x, b.z - wid / 2), H(b.x, b.z + wid / 2));
    addB(b);
  }

  // Longhouses
  let tries = 0, houses = 0;
  while (houses < 58 && tries < 12000) {
    tries++;
    const x = rng.range(-340, 340), z = rng.range(118, 560);
    if (villageMask(x, z) < 0.55) continue;
    const insidePal = ((x - PC[0]) / PRX) ** 2 + ((z - PC[1]) / PRZ) ** 2 < 1;
    const big = rng.chance(0.3);
    const b = { kind: 'house', x, z, len: big ? rng.range(24, 32) : rng.range(14, 22), wid: big ? rng.range(7, 8.5) : rng.range(5.5, 7), roof: rng.chance(0.55) ? 'turf' : 'shingle', rich: big || insidePal };
    b.rot = orient(x, z) + rng.range(-0.25, 0.25);
    if (!fits(b, insidePal ? 4 : 3)) continue;
    b.inPal = insidePal;
    addB(b); houses++;
  }
  // outbuildings: pit houses, raised stores, byres
  tries = 0; let outs = 0;
  while (outs < 34 && tries < 6000) {
    tries++;
    const x = rng.range(-340, 340), z = rng.range(112, 560);
    if (villageMask(x, z) < 0.5) continue;
    const kind = rng.pick(['pit', 'pit', 'stilt', 'byre']);
    const b = { kind, x, z, len: kind === 'byre' ? rng.range(10, 14) : rng.range(4, 6), wid: kind === 'byre' ? 5 : rng.range(3.4, 4.2), roof: kind === 'stilt' ? 'shingle' : 'turf' };
    b.rot = orient(x, z) + rng.range(-0.6, 0.6);
    if (!fits(b, 2)) continue;
    addB(b); outs++;
  }
  // tents era replaces houses: a tent cluster per house
  // beach slots for ships
  const slots = [];
  for (let i = 0; i < 12; i++) {
    const x = -96 + i * 23 + (i > 5 ? 8 : 0);
    let z = 40;
    while (H(x, z) < -0.2 && z < 90) z += 0.5;
    slots.push({ x, z });
  }
  // beacon chain along the fjord rims (from the sea inward)
  const beacons = [];
  const segs = [[FJORD[6], -1], [FJORD[5], 1], [FJORD[4], -1], [FJORD[3], 1], [FJORD[2], -1], [FJORD[1], 1]];
  for (const [f, side] of segs) {
    const [fx, fz, r] = f;
    let best = null;
    for (let d = r + 120; d < r + 420; d += 20) {
      const x = fx + side * d, z = fz + (rng.next() - 0.5) * 60;
      const h = heightAt(x, z);
      if (!best || h > best.h) best = { x, z, h };
    }
    beacons.push({ x: best.x, z: best.z, y: best.h });
  }
  beacons.push({ x: S.lookout[0], z: S.lookout[1], y: H(S.lookout[0], S.lookout[1]), lookout: true });
  beacons.push({ x: S.villageBeacon[0], z: S.villageBeacon[1], y: H(S.villageBeacon[0], S.villageBeacon[1]), village: true });

  // pens (polygons as centre+radius)
  const pens = [
    { kind: 'sheep', x: S.sheep[0], z: S.sheep[1], r: 30, n: 110 },
    { kind: 'goat', x: S.goats[0], z: S.goats[1], r: 14, n: 34 },
    { kind: 'pig', x: S.pigs[0], z: S.pigs[1], r: 10, n: 22 },
    { kind: 'horse', x: S.horses[0], z: S.horses[1], r: 20, n: 16 },
    { kind: 'cow', x: S.byre[0] + 18, z: S.byre[1] + 6, r: 16, n: 18 },
  ];
  // bonfire sites on the beach
  const bonfires = [];
  for (let i = 0; i < 11; i++) {
    const x = -112 + i * 25 + rng.range(-4, 4), z = 86 + rng.range(-5, 7);
    bonfires.push({ x, z });
  }
  // feast bench/table positions
  const feastSpots = [];
  for (let i = 0; i < 18; i++) {
    const row = i % 3, col = Math.floor(i / 3);
    feastSpots.push({ x: -52 + col * 19 + row * 3, z: 92 + row * 6.5, rot: 0 });
  }
  // torches along the palisade walk
  const torches = [];
  for (let i = 0; i < pal.length - 1; i += 2) torches.push({ x: pal[i][0] * 0.985 + PC[0] * 0.015, z: pal[i][1] * 0.985 + PC[1] * 0.015 });
  const nPalTorches = torches.length;
  // road torches up the main road
  for (let i = 4; i < main.length - 2; i += 3) torches.push({ x: main[i][0] + 3.5, z: main[i][1] });

  return { nPalTorches, roads, S, B, slots, beacons, pens, fields: fieldsRect, pal, PC, PRX, PRZ, gates, bonfires, feastSpots, torches,
    lines: { shore, main, east, west, upper, yard, fish, look, byreL, pensL, goatL, beachL, pyreL, practiceL, hidesL, healerL } };
}
