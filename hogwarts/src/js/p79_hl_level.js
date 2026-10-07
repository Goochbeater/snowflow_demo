/* ==== p79_hl_level.js ==== */
/* HOGWARTS — the level: the land is raised, turfed and wooded, the loch is filled, then every HL.BUILD step runs. */
HL.PATHS = [   // [x, z] polylines worn into the turf
  [[0, 92], [2, 130], [-20, 170], [-70, 215], [-118, 240]],
  [[2, 130], [60, 190], [150, 250], [215, 290]],
  [[-118, 240], [-170, 320], [-235, 410]],
  [[0, -292], [-6, -312], [-30, -335], [-90, -380], [-190, -428], [-262, -450], [-410, -450]],
  [[-335, -450], [-335, -474]],
  [[-329.5, -470], [-327.3, -479], [-327.2, -491], [-321.5, -497]],   // round the side of Honeydukes to the station steps
];
HL.pathD = function (x, z) { let best = 1e9; for (const P of HL.PATHS) for (let i = 0; i + 1 < P.length; i++) { const ax = P[i][0], az = P[i][1], bx = P[i + 1][0], bz = P[i + 1][1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < best) best = d; } return best; };
HL.inFoot = HL.inFoot || ((x, z, pad) => HL.FOOT.some((r) => x > r[0] - pad && x < r[2] + pad && z > r[1] - pad && z < r[3] + pad));
/* the lots outside the castle where no turf grows: the village street and square, the floor of the pub, yards (HL.foot). HL.inFoot became the castle's own footprint when the castle was drawn from its plan, and these were forgotten: meadow grass grew through the village. */
HL.inLot = (x, z, pad) => HL.FOOT.some((r) => x > r[0] - pad && x < r[2] + pad && z > r[1] - pad && z < r[3] + pad);
HL.forest = (x, z) => smooth(250, 300, z + (fbm2(x * 0.01, z * 0.01, 2) - 0.5) * 80) * (1 - smooth(60, 130, x)) + (1 - smooth(-330, -250, x)) * smooth(-150, -60, z);
LEVEL.def('hogwarts', {
  get photo() { return AST.BASE_SETS.concat(['cobble2', 'rocktile', 'plaster', 'mossywall', 'leather', 'hessian']); },
  models: ['cliffA', 'cliffB', 'cliffC', 'cliffD', 'cliffE', 'bld1', 'bld2', 'bld3', 'bld4', 'bld5', 'ms1a', 'ms2a', 'barrel1', 'barrel2', 'crate', 'chest', 'statueGothic', 'fern_a', 'fern_b', 'shrub_a', 'shrub_b', 'tuft_a', 'tuft_b', 'cel_a', 'cel_b', 'stump', 'deadTrunk', 'doorL', 'doorR', 'doorFrame', 'firepit'],
  chapter: 'THE HIGHLANDS', name: 'HOGWARTS', region: 'HOGWARTS', world: 'hogwarts', mount: false, get cast() { return HL.CASTLIST; },
  tex: ['grass', 'dirt', 'cliff', 'ashlar', 'flag', 'planks', 'bark', 'steel', 'gold'],
  start: [0, HL.Y0, -168, 0], checkpoints: [[0, HL.Y0, -168, 0], [0, HL.Y0, -30, 0], [-79, HL.Y0, 60, PI], [HL.PITCH.x, HL.PITCH.y, HL.PITCH.z - 60, 0], [-120, 34, 236, 0]], killY: -60,
  async build(L) {
    KIT.cellSize = 170; HL.sky(L); HL.L = L;
    const mat = TERRAIN.limMat('hog', { dirt: 'trail', scanTintA: 0xb8d090, scanTintB: 0xd8d8a0, scanRock: 0x8a8c90, rockSc: 7.0, rockBig: 31.0, scanDirt: 0xcfc4ae, grassSc: 2.3 });
    const G = await TERRAIN.grid(HL.h, -600, -560, 600, 700, 3, mat, { chunk: 48, cast: true, progress: (p) => MG.loadUI(0.5 + p * 0.2, 'Raising the castle crag'),
      paint: (x, z, h) => { const pd = HL.pathD(x, z); const road = Math.max(1 - smooth(1.6, 4.2, pd + (fbm2(x * 0.3, z * 0.3, 2) - 0.5) * 2), (HL.inFoot(x, z, 1.5) || HL.inLot(x, z, 1.0)) ? 1 : 0, h < 1.2 ? 1 : 0); return [road, h < -0.5 ? 0.6 : 0, HL.forest(x, z) * 0.35]; } });
    L.G = G; WORLD.CLOUD[1] = 0.55;
    for (const b of HL.BUILD) { await b(L, G); await MG.loadUI(0.72 + 0.2 * HL.BUILD.indexOf(b) / HL.BUILD.length, 'Laying stone on stone'); } HL.GK.flush();
    // ---- turf, water, woods
    WORLD.grass(L, G, { base: 0x466028, tip: 0x6c8a34, dry: 0x80803c, mask: (x, z, h) => (h < 1.0 ? 0 : 1) * ((HL.inFoot(x, z, 0.5) || HL.inLot(x, z, 0.4)) ? 0 : 1) * (1 - HL.forest(x, z) * 0.75) });
    { const w = WORLD.water(L, -260, -700, 760, 320, 0, { color: 0x0e2228, opacity: 0.94 }); w.material.roughness = 0.1; w.material.metalness = 0.35; w.material.normalScale.set(0.3, 0.3); w.material.envMapIntensity = 2.0; }
    { const rs = MG.rs('hogwoods'), list = [], bush = [], tints = [0x55782c, 0x4a6e2a, 0x668a30, 0x3e6226, 0x7a8a2e, 0x9a7a28, 0xa85a20];
      const ok = (x, z) => { const h = G.hf(x, z); if (h === null || h < 2.5) return false; if (HL.sdRR(x - 8, z - 14, 150, 140, 46) < 0) return false; if (HL.sdRR(x - HL.PITCH.x, z - HL.PITCH.z, 104, 152, 60) < 0) return false; if (HL.pathD(x, z) < 5) return false; if (Math.hypot(x - HL.HUT.x, z - HL.HUT.z) < 20 || Math.hypot(x - HL.CAMP.x, z - HL.CAMP.z) < 15 || HL.inFoot(x, z, 5) || HL.inLot(x, z, 4) || HL.sdRR(x + 335, z + 450, 80, 20, 10) < 0) return false;
        const e = 3, sl = Math.hypot(G.hf(x + e, z) - G.hf(x - e, z), G.hf(x, z + e) - G.hf(x, z - e)) / (2 * e); return sl < 0.55; };
      for (let i = 0; i < 5200 && list.length < 1500; i++) { const x = -590 + rs() * 1180, z = -550 + rs() * 1240, f = HL.forest(x, z); if (rs() > f * 0.95 + 0.035) continue; if (!ok(x, z)) continue; list.push([x, z, 0.8 + rs() * 0.9 + f * 0.5, rs() * TAU, tints[(rs() * (f > 0.5 ? 4 : tints.length)) | 0], f]); }
      for (let i = 0; i < 900; i++) { const x = -590 + rs() * 1180, z = -550 + rs() * 1240; if (!ok(x, z)) continue; bush.push([x, z, 0.8 + rs() * 0.8, rs() * TAU, tints[(rs() * tints.length) | 0]]); }
      const firs = [], broad = []; for (const t of list) { if (t[5] > 0.45) firs.push([t[0], t[1], 15 + t[2] * 9, t[3]]); else broad.push(t); }
      for (let i = 0; i < 9000 && firs.length < 4200; i++) { const x = -590 + rs() * 1180, z = -550 + rs() * 1240, f = HL.forest(x, z), far = smooth(300, 560, Math.hypot(x - 20, z - 90)); if (rs() > Math.max(f, far * 0.5)) continue; if (!ok(x, z)) continue; firs.push([x, z, 13 + rs() * 14 + f * 6, rs() * TAU]); }
      HL.TREES = list; HL.conifers(L, firs); WORLD.trees(L, broad, { kinds: 4, h: 12 }); WORLD.trees(L, bush, { kinds: 2, bush: true, h: 2.8, seed: 900 }); }
    WORLD.rocksBegin(); if (WORLD._rocks) { WORLD.cliffs(L, G, { seed: 'crag', minH: 14, step: 6, pack: 0.34, slope: 0.6, ok: (x, z) => !HL.inFoot(x, z, 4) && HL.sdRR(x - 8, z - 14, 190, 180, 60) < 0 && !(z > 110 && Math.abs(x) < 110) }); WORLD.cliffs(L, G, { minH: 9, step: 7, ok: (x, z) => !HL.inFoot(x, z, 30) && HL.pathD(x, z) > 27 /* (a crag is up to fifty metres long: eight metres' clearance let one lie across the Hogsmeade road) */ && !HL.inLot(x, z, 18) && Math.hypot(x - HL.HUT.x, z - HL.HUT.z) > 40 && Math.hypot(x - HL.PITCH.x, z - HL.PITCH.z) > 190 }); WORLD.rocksEnd(L, { far: 900 }); }
    { const cs0 = KIT.cellSize; KIT.cellSize = 1e5; const me = WORLD.outer(L, G, HL.h, { res: 26, range: 2300, land: (x, z) => (HL.lake(x, z) > 0.5 ? 0.15 : 1.5), extra: (x, z, h) => h + smooth(900, 2200, Math.hypot(x, z)) * (140 + 260 * fbm2(x * 0.0011 + 5, z * 0.0011, 3)) });
      // the far hills in heather, bracken and grey rock (no snow), darker with distance so they stand as silhouettes in the haze
      { const g = me.geometry, p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), sl = 1 - n.getY(i), f = fbm2(x * 0.006, z * 0.006, 3), rock = smooth(0.12, 0.4, sl) * 0.8 + smooth(260, 420, y) * 0.5;
          let r = lerp(0.105, 0.16, f), gg = lerp(0.15, 0.13, f), b = lerp(0.07, 0.11, f); r = lerp(r, 0.17, rock); gg = lerp(gg, 0.17, rock); b = lerp(b, 0.175, rock); if (y < -14) { r = 0.07; gg = 0.09; b = 0.09; } c.setXYZ(i, r * 3.2, gg * 3.2, b * 3.2); } c.needsUpdate = true; const uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 140 + p.getY(i) / 400; uv[i * 2 + 1] = p.getZ(i) / 140; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); const rk = TEX.sets.rockface || TEX.sets.mossrock; if (rk) { me.material.map = rk.map; me.material.needsUpdate = true; } } KIT.cellSize = cs0; }
    if (LIFE.birds) LIFE.birds(L, { n: 40 });
    for (const s of HL.START) s(L, G);
  },
  onStart(L) { if (HL.onStart) HL.onStart(L); },
});
