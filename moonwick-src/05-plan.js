// ===== 05-plan: MOONWICK — the village under the Gloaming Spire =====
AF.PLAN = (() => {
  const P = {};
  P.name = 'Moonwick';
  P.SEA_Y = -0.25;
  P.spawn = { x: -148.5, y: 4.2, z: 67.5, yaw: -1.75 };
  P.SQUARE = [0, 10]; P.CRAG = [0, -100]; P.CRAG_Y = 16; P.RIDGE = [165, -30]; P.RIDGE_Y = 30; P.WOOD = [-150, 55, 75]; P.GLADE = [-150, 62];
  P.LAKE = [48, 94, 30, 23];
  P.RIVER = [[46, -118], [50, -84], [58, -46], [64, -10], [66, 10], [61, 40], [52, 64], [48, 92], [42, 124], [36, 165], [30, 225], [26, 300]];
  // road nodes: name -> [x, z, y]
  P.N = {
    sq: [0, 10, 1], n1: [0, -20, 1], n2: [0, -40, 1], gate: [0, -54, 1.5], c1: [26, -68, 6], c2: [-22, -80, 11.5], c3: [-13, -93, 15.5], top: [0, -90, 16],
    e1: [22, 10, 1], e2: [44, 10, 1], br0: [56, 10, 1.25], br1: [76, 10, 1.25], e3: [90, 6, 1.5], m1: [108, -2, 4], r1: [126, -20, 10], r2: [134, -52, 17], r3: [146, -72, 23], r4: [157, -48, 28], rtop: [163, -30, 30],
    w1: [-22, 10, 1], w2: [-46, 10, 1], w3: [-70, 14, 1.5], farm: [-84, 30, 2], w4: [-104, 30, 2], w5: [-126, 46, 2.5], glade: [-146, 60, 3],
    s1: [0, 30, 1], s2: [0, 48, 1], s3: [6, 62, 1], jetty: [22, 78, 0.75], chap: [-8, 48, 1], grave: [-22, 62, 1.25],
    fh: [-84, 22, 2], pond2: [70, 70, 1], e2s: [44, 30, 1], stones: [-60, -60, 4], n1w: [-20, -34, 1.5],
  };
  P.E = [
    ['sq', 'n1', 2.2, 'cob'], ['n1', 'n2', 2, 'cob'], ['n2', 'gate', 1.8, 'path'], ['gate', 'c1', 1.8, 'path'], ['c1', 'c2', 1.8, 'path'], ['c2', 'c3', 1.8, 'path'], ['c3', 'top', 1.8, 'flag'],
    ['sq', 'e1', 2.2, 'cob'], ['e1', 'e2', 2, 'cob'], ['e2', 'br0', 1.8, 'path'], ['br0', 'br1', 1.8, 'bridge'], ['br1', 'e3', 1.8, 'path'], ['e3', 'm1', 1.6, 'path'], ['m1', 'r1', 1.5, 'path'], ['r1', 'r2', 1.5, 'path'], ['r2', 'r3', 1.5, 'path'], ['r3', 'r4', 1.5, 'path'], ['r4', 'rtop', 1.5, 'path'],
    ['sq', 'w1', 2.2, 'cob'], ['w1', 'w2', 2, 'cob'], ['w2', 'w3', 1.8, 'path'], ['w3', 'farm', 1.6, 'path'], ['farm', 'w4', 1.5, 'path'], ['w4', 'w5', 1.4, 'path'], ['w5', 'glade', 1.2, 'path'], ['w3', 'fh', 1.4, 'path'],
    ['sq', 's1', 2.2, 'cob'], ['s1', 's2', 2, 'cob'], ['s2', 's3', 1.6, 'path'], ['s3', 'jetty', 1.5, 'path'], ['s2', 'chap', 1.5, 'path'], ['chap', 'grave', 1.3, 'path'],
    ['e2', 'e2s', 1.4, 'path'], ['e2s', 'jetty', 1.3, 'path'], ['br1', 'pond2', 1.3, 'path'], ['n1', 'n1w', 1.3, 'path'], ['n1w', 'stones', 1.2, 'path'],
  ];
  P.FLATS = [[-96, 12, -70, 34, 2], [-106, 34, -62, 76, 2], [100, -24, 124, -4, 5], [-160, 50, -138, 72, 3], [-70, -70, -50, -50, 4]];   // x0,z0,x1,z1,y
  P.FIELDS = [[-104, 44, -84, 74], [-80, 44, -64, 74]];
  P.views = [
    { name: 'Moonwick', pos: [70, 46, 110], target: [0, 12, -30] },
    { name: 'The square', pos: [16, 9, 34], target: [0, 4, 5] },
    { name: 'The Spire', pos: [40, 30, -30], target: [0, 40, -100] },
    { name: 'The ridge', pos: [120, 40, 10], target: [165, 30, -30] },
    { name: 'The wood', pos: [-120, 14, 90], target: [-150, 4, 60] },
  ];
  // secret places in the forest ring: [x, z, clearing radius]
  P.SITES = { thorn: [-150, -140, 19], dell: [136, 150, 19], moonwell: [-202, 22, 8], glass: [-96, -152, 8], emberpool: [58, -192, 8], dream: [192, 78, 8], green: [-72, 172, 8], echo: [12, 202, 8], wishtree: [-186, 122, 11], giant: [-196, -66, 10], archN: [98, -150, 7], archS: [-124, 150, 7], grotto: [0, -146, 7], stones: [-60, -60, 10], glade: [-150, 62, 9], meadow: [106, 34, 19], mill: [112, -12, 13], grove: [-176, 38, 17], ridge: [165, -32, 24] };
  Object.assign(P.N, { t_moon: [-200, 26, null], t_wish: [-183, 116, null], t_glass: [-94, -147, null], t_green: [-72, 166, null], t_dream: [187, 78, null], t_echo: [12, 196, null], t_s4: [2, 120, null], t_e: [128, 70, null], t_grot: [0, -139, null], t_n: [-34, -112, null], t_arN: [96, -144, null], t_ne: [60, -120, null], t_arS: [-122, 144, null], t_sw: [-60, 110, null] });
  P.E.push(['glade', 't_moon', 0.8, 'trail'], ['glade', 't_wish', 0.8, 'trail'], ['stones', 't_glass', 0.8, 'trail'], ['s3', 't_s4', 0.9, 'trail'], ['t_s4', 't_echo', 0.8, 'trail'], ['t_s4', 't_sw', 0.8, 'trail'], ['t_sw', 't_green', 0.8, 'trail'], ['t_sw', 't_arS', 0.7, 'trail'], ['pond2', 't_e', 0.9, 'trail'], ['t_e', 't_dream', 0.8, 'trail'], ['n1w', 't_n', 0.8, 'trail'], ['t_n', 't_grot', 0.7, 'trail'], ['e3', 't_ne', 0.8, 'trail'], ['t_ne', 't_arN', 0.7, 'trail']);
  P.forest = (x, z) => { const dq = Math.hypot(x - P.SQUARE[0], z - P.SQUARE[1]); let f = AF.smooth(84, 106, dq + (AF.noise2(x / 38 + 3, z / 38 - 7) - 0.5) * 44); if (f <= 0) return 0;
    for (const k in P.SITES) { const s = P.SITES[k], d = Math.hypot(x - s[0], z - s[1]); if (d < s[2] + 5) f *= AF.smooth(s[2] - 1, s[2] + 5, d); }
    { const d = Math.max(-112 - x, x + 56, 6 - z, z - 82); if (d < 6) f *= AF.smooth(0, 6, d); }
    { const d = Math.hypot(x - P.CRAG[0], z - P.CRAG[1]); if (d < 30) f *= AF.smooth(20, 30, d); } { const d = Math.hypot(x - 165, z + 32); if (d < 16) f *= AF.smooth(9, 16, d); }
    const w = P.waterD(x, z); if (w < 7) f *= AF.smooth(1.5, 7, w); return f; };
  P.segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = ax + dx * t - px, qz = az + dz * t - pz; P._t = t; return Math.sqrt(qx * qx + qz * qz); };
  P.riverD = (x, z) => { let d = 1e9; const R = P.RIVER; for (let i = 0; i < R.length - 1; i++) { const q = P.segD(x, z, R[i][0], R[i][1], R[i + 1][0], R[i + 1][1]); if (q < d) d = q; } return d; };
  P.waterD = (x, z) => { const L = P.LAKE, e = Math.hypot((x - L[0]) / L[2], (z - L[1]) / L[3]); return Math.min(P.riverD(x, z) - 3.2, (e - 1) * L[3]); };
  return P;
})();
