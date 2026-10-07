/* ==== p56e_or_castle.js ==== */
/* OPUS RING — castle architecture: square and round towers with corbelled, crenellated crowns, string courses and slit
   windows; buttressed curtain walls; keeps ribbed with pilasters and lancets; a great pointed gate. All of it goes
   into the KIT buckets (scanned ashlar), so a whole castle is a handful of draw calls. */
const CAS = {};
CAS.rot = (x, z, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
CAS.lit = () => KIT.emis(0xffb060, 1.5);
/* crenellations around a rectangle (hw x hd at height y), merlons on the outer edge */
CAS.merlons = function (x, z, hw, hd, y, yaw, mat, o) {
  o = o || {}; const P = CAS.rot(x, z, yaw), mh = o.mh || 1.5, mt = o.mt || 0.55, pitch = o.pitch || 2.1, sides = o.sides || 'xXzZ';
  const run = (len, f) => { const n = Math.max(2, Math.round(len * 2 / pitch)); for (let i = 0; i < n; i++) { const l = -len + (i + 0.5) * (len * 2 / n); f(l, len * 2 / n * 0.56 / 2); } };
  if (sides.includes('Z')) run(hw, (l, hl) => { const p = P(l, hd - mt / 2); KIT.obox(p[0], y, p[1], hl, y + mh, mt / 2, yaw, mat, { col: false }); });
  if (sides.includes('z')) run(hw, (l, hl) => { const p = P(l, -hd + mt / 2); KIT.obox(p[0], y, p[1], hl, y + mh, mt / 2, yaw, mat, { col: false }); });
  if (sides.includes('X')) run(hd, (l, hl) => { const p = P(hw - mt / 2, l); KIT.obox(p[0], y, p[1], mt / 2, y + mh, hl, yaw, mat, { col: false }); });
  if (sides.includes('x')) run(hd, (l, hl) => { const p = P(-hw + mt / 2, l); KIT.obox(p[0], y, p[1], mt / 2, y + mh, hl, yaw, mat, { col: false }); });
};
/* a square tower. o: { yaw, mat, roof: 0 | 'pyr' | 'spire', win: rows of slits, lit: fraction lit, turret, plinth, col } */
CAS.tower = function (x, z, hw, hd, y, h, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, yaw = o.yaw || 0, P = CAS.rot(x, z, yaw), rs = mulberry((x * 13 + z * 7 + h * 3) | 0), col = !!o.col;
  const ph = o.plinth !== undefined ? o.plinth : Math.min(5, h * 0.14);
  if (ph > 0) { KIT.obox(x, y, z, hw + 0.6, y + ph, hd + 0.6, yaw, mat, { col: false }); KIT.obox(x, y + ph, z, hw + 0.3, y + ph + 0.5, hd + 0.3, yaw, mat, { col: false }); }
  KIT.obox(x, y, z, hw, y + h, hd, yaw, mat, { col });
  for (const f of (h > 24 ? [0.36, 0.66] : [0.55])) KIT.obox(x, y + h * f, z, hw + 0.16, y + h * f + 0.45, hd + 0.16, yaw, mat, { col: false });
  // clasping buttresses at the corners, stopping below the crown
  if (hw > 2.6 && o.buttress !== false) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = P(sx * hw, sz * hd); KIT.obox(p[0], y, p[1], 0.62, y + h * 0.78, 0.62, yaw, mat, { col: false }); KIT.obox(p[0], y + h * 0.78, p[1], 0.42, y + h * 0.86, 0.42, yaw, mat, { col: false }); }
  // corbel table and the crown
  const ch = y + h, ov = Math.min(0.7, hw * 0.16);
  for (const [len, side] of [[hw, 1], [hw, -1]]) { const n = Math.max(3, Math.round(len * 2 / 1.1)); for (let i = 0; i < n; i++) { const l = -len + (i + 0.5) * (len * 2 / n); let p = P(l, side * (hd + ov * 0.45)); KIT.obox(p[0], ch - 0.75, p[1], 0.2, ch, ov * 0.5, yaw, mat, { col: false }); } }
  for (const [len, side] of [[hd, 1], [hd, -1]]) { const n = Math.max(3, Math.round(len * 2 / 1.1)); for (let i = 0; i < n; i++) { const l = -len + (i + 0.5) * (len * 2 / n); let p = P(side * (hw + ov * 0.45), l); KIT.obox(p[0], ch - 0.75, p[1], ov * 0.5, ch, 0.2, yaw, mat, { col: false }); } }
  KIT.obox(x, ch, z, hw + ov, ch + 0.9, hd + ov, yaw, mat, { col: false });
  CAS.merlons(x, z, hw + ov, hd + ov, ch + 0.9, yaw, mat, { pitch: hw > 3 ? 2.3 : 1.7, mh: hw > 3 ? 1.6 : 1.2 });
  // slit windows, a few of them lit
  const rows = o.win !== undefined ? o.win : Math.max(1, Math.floor(h / 9)), lit = CAS.lit(), litK = o.lit !== undefined ? o.lit : 0.3;
  for (let r = 0; r < rows; r++) { const wy = y + ph + (h - ph) * ((r + 0.6) / (rows + 0.4)) - 1; for (const [nx, nz, half] of [[0, 1, hw], [0, -1, hw], [1, 0, hd], [-1, 0, hd]]) { const k = half > 4 ? 2 : 1;
      for (let i = 0; i < k; i++) { if (rs() < 0.25) continue; const l = k === 1 ? 0 : (i - 0.5) * half * 0.9, p = nz ? P(l, nz * (hd + 0.02)) : P(nx * (hw + 0.02), l); KIT.obox(p[0], wy, p[1], nz ? 0.24 : 0.06, wy + 2.1, nz ? 0.06 : 0.24, yaw, rs() < litK ? lit : M.iron, { col: false }); } } }
  // roof or a stair turret
  if (o.roof === 'pyr' || o.roof === 'spire') { const rh = (o.roof === 'spire' ? 2.6 : 1.1) * Math.max(hw, hd), g = new THREE.ConeGeometry(1, rh, 4, 1); g.rotateY(PI / 4); g.scale((hw + ov * 0.3) * 1.414, 1, (hd + ov * 0.3) * 1.414); g.rotateY(yaw);
    KIT.geo(g, M.roof, new THREE.Matrix4().makeTranslation(x, ch + 0.9 + rh / 2, z), { uvs: 4, uvs2: 2 }); }
  if (o.turret) { const p = P(hw * 0.52, hd * 0.52), tw = Math.max(1.3, hw * 0.34), th = Math.max(5, h * 0.2); KIT.obox(p[0], ch + 0.9, p[1], tw, ch + 0.9 + th, tw, yaw, mat, { col: false }); KIT.obox(p[0], ch + 0.9 + th, p[1], tw + 0.3, ch + 1.5 + th, tw + 0.3, yaw, mat, { col: false }); CAS.merlons(p[0], p[1], tw + 0.3, tw + 0.3, ch + 1.5 + th, yaw, mat, { pitch: 1.4, mh: 1.0, mt: 0.4 }); }
  return ch + 0.9;
};
/* a round tower with a corbelled, crenellated crown. o: { mat, roof (cone), win, lit, col } */
CAS.round = function (x, z, r, y, h, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, rs = mulberry((x * 11 + z * 5 + h) | 0), uvs = Math.max(2, Math.round(TAU * r / 2.6));
  /* o.hollow (an inner radius): the drum is a tube — its courses are rings, nothing crosses the inside (a stair climbs it) */
  const cyl = (yy, rr, hh, oo) => o.hollow ? KIT.ringCyl(x, yy, z, rr, hh, mat, Object.assign({ rin: o.hollow }, oo)) : KIT.cyl(x, yy, z, rr, hh, mat, oo);
  cyl(y, r * 1.14, Math.min(6, h * 0.16), { seg: 20, col: false, r1: r, uvs });
  cyl(y, r, h, { seg: 20, uvs, col: !!o.col });
  for (const f of (h > 24 ? [0.4, 0.7] : [0.6])) cyl(y + h * f, r * 1.03, 0.45, { seg: 20, col: false, uvs });
  const n = Math.max(8, Math.round(TAU * r / 1.2)); for (let i = 0; i < n; i++) { const a = i / n * TAU; KIT.obox(x + Math.sin(a) * r * 1.05, y + h - 0.8, z + Math.cos(a) * r * 1.05, 0.2, y + h, r * 0.09, a, mat, { col: false }); }
  KIT.cyl(x, y + h, z, r * 1.13, 0.9, mat, { seg: 20, col: false, uvs });
  if (o.roof) { const rh = r * (o.roof === true ? 1.5 : o.roof), g = new THREE.ConeGeometry(r * 1.2, rh, 20); KIT.geo(g, M.roof, new THREE.Matrix4().makeTranslation(x, y + h + 0.9 + rh / 2, z), { uvs: 6, uvs2: 2 }); }
  else { const m = Math.max(6, Math.round(TAU * r * 1.13 / 2.1)); for (let i = 0; i < m; i++) { const a = i / m * TAU; KIT.obox(x + Math.sin(a) * r * 1.08, y + h + 0.9, z + Math.cos(a) * r * 1.08, TAU * r / m * 0.29, y + h + 2.4, 0.28, a, mat, { col: false }); } }
  const rows = o.win !== undefined ? o.win : Math.max(1, Math.floor(h / 9)), lit = CAS.lit(), litK = o.lit !== undefined ? o.lit : 0.3;
  for (let k = 0; k < rows; k++) { const wy = y + h * ((k + 0.7) / (rows + 0.6)); for (let i = 0; i < 4; i++) { if (rs() < 0.3) continue; const a = (o.wa || 0.4) + i * HALF + k * 0.5; KIT.obox(x + Math.sin(a) * r * 1.0, wy, z + Math.cos(a) * r * 1.0, 0.22, wy + 1.9, 0.08, a, rs() < litK ? lit : M.iron, { col: false }); } }
  return y + h + 0.9;
};
/* a curtain wall from a to b with battlements, a walkway overhang and stepped buttresses on the outer face (side = ±1) */
CAS.wall = function (ax, az, bx, bz, y0, top, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, t = o.t || 3, L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, P = CAS.rot(cx, cz, yaw), side = o.side || 1;
  KIT.obox(cx, y0, cz, t / 2, top, L / 2, yaw, mat, { col: !!o.col });
  KIT.obox(cx, top - 0.7, cz, t / 2 + 0.35, top, L / 2, yaw, mat, { col: false });
  const n = Math.max(2, Math.round(L / 2.2)); for (let i = 0; i < n; i++) { const l = -L / 2 + (i + 0.5) * L / n; for (const sd of (o.both ? [1, -1] : [side])) { const p = P(sd * (t / 2 + 0.1), l); KIT.obox(p[0], top, p[1], 0.27, top + 1.5, L / n * 0.28, yaw, mat, { col: false }); } }
  const nb = o.buttress === 0 ? 0 : Math.max(0, Math.round(L / (o.bstep || 9)) - 1), hh = top - y0;
  for (let i = 0; i < nb; i++) { const l = -L / 2 + (i + 1) * L / (nb + 1); let p = P(side * (t / 2 + 0.9), l); KIT.obox(p[0], y0, p[1], 0.9, y0 + hh * 0.72, 0.8, yaw, mat, { col: false }); p = P(side * (t / 2 + 2.2), l); KIT.obox(p[0], y0, p[1], 0.7, y0 + hh * 0.42, 0.8, yaw, mat, { col: false }); }
  if (o.slits) { const ns = Math.round(L / 6); for (let i = 0; i < ns; i++) { const l = -L / 2 + (i + 0.5) * L / ns, p = P(side * (t / 2 + 0.02), l); KIT.obox(p[0], top - 4.2, p[1], 0.06, top - 2.4, 0.2, yaw, M.iron, { col: false }); } }
};
/* a keep: a tall block ribbed with pilasters between lancet windows, a crenellated top, an upper tier */
CAS.keep = function (x, z, hw, hd, y, h, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, yaw = o.yaw || 0, P = CAS.rot(x, z, yaw), rs = mulberry((x * 3 + z * 17) | 0), lit = CAS.lit(), litK = o.lit !== undefined ? o.lit : 0.35;
  KIT.obox(x, y, z, hw + 0.8, y + Math.min(6, h * 0.15), hd + 0.8, yaw, mat, { col: false });
  KIT.obox(x, y, z, hw, y + h, hd, yaw, mat, { col: !!o.col });
  const ribs = (len, f) => { const n = Math.max(2, Math.round(len * 2 / 4.6)); for (let i = 0; i <= n; i++) f(-len + i * (len * 2 / n), i, n); };
  for (const sd of [1, -1]) {
    ribs(hw, (l, i, n) => { let p = P(l, sd * (hd + 0.35)); KIT.obox(p[0], y, p[1], 0.5, y + h * 0.9, 0.35, yaw, mat, { col: false });
      if (i < n) { const lm = l + hw / n; for (let r = 0; r < (o.rows || 2); r++) { const wy = y + h * (0.3 + 0.3 * r); p = P(lm, sd * (hd + 0.03)); KIT.obox(p[0], wy, p[1], 0.42, wy + h * 0.17, 0.06, yaw, rs() < litK ? lit : M.iron, { col: false }); } } });
    ribs(hd, (l, i, n) => { let p = P(sd * (hw + 0.35), l); KIT.obox(p[0], y, p[1], 0.35, y + h * 0.9, 0.5, yaw, mat, { col: false });
      if (i < n) { const lm = l + hd / n; for (let r = 0; r < (o.rows || 2); r++) { const wy = y + h * (0.3 + 0.3 * r); p = P(sd * (hw + 0.03), lm); KIT.obox(p[0], wy, p[1], 0.06, wy + h * 0.17, 0.42, yaw, rs() < litK ? lit : M.iron, { col: false }); } } });
  }
  KIT.obox(x, y + h, z, hw + 0.6, y + h + 1.0, hd + 0.6, yaw, mat, { col: false }); CAS.merlons(x, z, hw + 0.6, hd + 0.6, y + h + 1.0, yaw, mat, { pitch: 2.4, mh: 1.7 });
  if (o.gable) { const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1); g.rotateZ(HALF); g.rotateX(-HALF); g.scale(hw * 2 - 1, hd * (o.gable === true ? 0.8 : o.gable), hd * 1.75 - 1.5); g.rotateY(yaw); KIT.geo(g, M.roof, new THREE.Matrix4().makeTranslation(x, y + h + 1 + hd * (o.gable === true ? 0.8 : o.gable) * 0.25, z), { uvs: 5, uvs2: 2 }); }
  return y + h + 1.0;
};
/* a wall holding a great pointed arch (the castle's face). w = opening width, ah = height of the arch's point */
CAS.gate = function (x, z, yaw, y, w, ah, top, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, t = o.t || 5, P = CAS.rot(x, z, yaw), hw = (o.span || w * 2.2) / 2;
  for (const sd of [-1, 1]) { const p = P(sd * (w / 2 + (hw - w / 2) / 2), 0); KIT.obox(p[0], y, p[1], (hw - w / 2) / 2, top, t / 2, yaw, mat, { col: false }); }
  // the pointed head: stepped courses closing over the opening, then solid wall above
  const sh = ah * 0.56, n = 9; for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n, y0 = y + sh + (ah - sh) * f0, y1 = y + sh + (ah - sh) * f1, k = Math.sqrt(1 - f0 * f0 * 0.98), ow = w / 2 * k;
    for (const sd of [-1, 1]) { const p = P(sd * (ow + (w / 2 - ow) / 2 + 0.01), 0); if (w / 2 - ow > 0.02) KIT.obox(p[0], y0, p[1], (w / 2 - ow) / 2, y1, t / 2, yaw, mat, { col: false }); } }
  KIT.obox(x, y + ah, z, w / 2 + 0.02, top, t / 2, yaw, mat, { col: false });
  // moulded surround, the dark of the passage, battlements
  for (const sd of [-1, 1]) { const p = P(sd * (w / 2 + 0.5), t / 2 + 0.3); KIT.obox(p[0], y, p[1], 0.5, y + sh, 0.3, yaw, mat, { col: false }); }
  if (!o.open) { const p = P(0, -t / 2 + 0.4); KIT.obox(p[0], y, p[1], w / 2, y + ah, 0.2, yaw, new THREE.MeshBasicMaterial({ color: 0x0b0c0d }), { col: false }); }
  KIT.obox(x, top - 0.8, z, hw + 0.3, top, t / 2 + 0.4, yaw, mat, { col: false }); CAS.merlons(x, z, hw + 0.3, t / 2 + 0.4, top, yaw, mat, { pitch: 2.3, sides: 'zZ' });
};

/* a pointed arch standing on a wall face: a moulded surround (extruded) and the opening behind it (a flat panel).
   w = clear width, sh = springing height, ah = apex height (all from the sill at y = 0) */
CAS.archShape = function (w, sh, ah, grow) { const g = grow || 0, S = new THREE.Shape(), hw = w / 2 + g; S.moveTo(-hw, -g * 0); S.lineTo(-hw, sh); S.quadraticCurveTo(-hw, sh + (ah + g - sh) * 0.72, 0, ah + g); S.quadraticCurveTo(hw, sh + (ah + g - sh) * 0.72, hw, sh); S.lineTo(hw, 0); S.lineTo(-hw, 0); return S; };
CAS.arch = function (px, y, pz, th, w, sh, ah, mat, fill, o) {
  o = o || {}; const fr = o.frame || 0.32, dp = o.depth || 0.3, outer = CAS.archShape(w, sh, ah, fr), hole = new THREE.Path(); { const hw = w / 2; hole.moveTo(-hw, 0); hole.lineTo(hw, 0); hole.lineTo(hw, sh); hole.quadraticCurveTo(hw, sh + (ah - sh) * 0.72, 0, ah); hole.quadraticCurveTo(-hw, sh + (ah - sh) * 0.72, -hw, sh); hole.lineTo(-hw, 0); }
  outer.holes.push(hole);
  const m4 = new THREE.Matrix4().makeRotationY(th); m4.setPosition(px, y, pz);
  KIT.geo(new THREE.ExtrudeGeometry(outer, { depth: dp, bevelEnabled: false, curveSegments: 7 }), mat, m4, { worldUV: true });
  const pg = new THREE.ShapeGeometry(CAS.archShape(w, sh, ah, 0), 7); pg.translate(0, 0, 0.04); KIT.geo(pg, fill, m4, { worldUV: true });
};
/* dress one face of a wall from a to b (the face on side = ±1): plinth, buttress piers carrying a blind arcade of
   pointed arches, a string course, lancet windows above (some lit), a corbel table under the parapet */
CAS.facade = function (ax, az, bx, bz, y0, top, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, P = CAS.rot(cx, cz, yaw), sd = o.side || 1, t2 = (o.t || 0) / 2, H = top - y0;
  const bay = o.bay || 6.4, n = Math.max(1, Math.round(L / bay)), bw = L / n, ah = o.arcH !== undefined ? o.arcH : Math.min(H * 0.5, 9), rs = mulberry((ax * 7 + az * 13 + bx) | 0), lit = CAS.lit(), dark = CAS.shade();
  const c = Math.cos(yaw), s = Math.sin(yaw), th = Math.atan2(sd * c, -sd * s);
  const put = (l, d, hx, yA, yB, hz, m) => { const p = P(sd * (t2 + d), l); KIT.obox(p[0], yA, p[1], hx, yB, hz, yaw, m || mat, { col: false }); };
  put(0, 0.22, 0.22, y0, y0 + 1.1, L / 2, mat);                                              // plinth
  for (let i = 0; i <= n; i++) { const l = -L / 2 + i * bw; put(l, 0.5, 0.5, y0, y0 + ah + 1.2, 0.62); put(l, 0.3, 0.3, y0 + ah + 1.2, top - 1.6, 0.42); put(l, 0.75, 0.25, y0, y0 + ah * 0.45, 0.62); }   // piers, stepped
  if (ah > 3) for (let i = 0; i < n; i++) { if (o.skip && o.skip(i, n)) continue; const l = -L / 2 + (i + 0.5) * bw, w = bw - 2.3, p = P(sd * (t2 + 0.02), l); CAS.arch(p[0], y0 + 1.1, p[1], th, w, (ah - 1.1) * 0.58, ah - 1.1, mat, dark, { frame: 0.36, depth: 0.34 }); }
  put(0, 0.2, 0.2, y0 + ah + 1.2, y0 + ah + 1.75, L / 2);                                      // string course
  const rows = o.rows !== undefined ? o.rows : Math.max(0, Math.floor((H - ah - 6) / 8)), rh = (H - ah - 5) / Math.max(1, rows);
  for (let r = 0; r < rows; r++) { const wy = y0 + ah + 2.9 + r * rh, wh = Math.min(6.5, rh * 0.74);
    for (let i = 0; i < n; i++) { if (rs() < 0.15) continue; const l = -L / 2 + (i + 0.5) * bw, m = rs() < (o.lit !== undefined ? o.lit : 0.3) ? lit : dark, p = P(sd * (t2 + 0.02), l); CAS.arch(p[0], wy, p[1], th, Math.min(1.5, bw * 0.26), wh * 0.66, wh, mat, m, { frame: 0.22, depth: 0.2 }); put(l, 0.16, 0.16, wy - 0.35, wy, 1.1); } }
  const nc = Math.round(L / 1.2); for (let i = 0; i < nc; i++) put(-L / 2 + (i + 0.5) * L / nc, 0.3, 0.3, top - 1.5, top - 0.7, 0.2);   // corbels
  put(0, 0.36, 0.36, top - 0.7, top, L / 2);
};
CAS.shade = () => (CAS._sh || (CAS._sh = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 1, metalness: 0, envMapIntensity: 0.1 })));
/* every tower and curtain in the game takes the castle kit's detail */
(function () {
  WORLD.tower = function (x, z, r, h, o) { o = o || {}; const y = o.y !== undefined ? o.y : WORLD.gy(x, z) - 1.5; PHY.cyl(x, z, r, y, y + h);
    return CAS.round(x, z, r, y, h, { mat: o.mat, roof: o.roof ? 1.25 : 0, win: o.windows ? Math.max(1, Math.floor(h / 10)) : 0, lit: o.lit ? 0.35 : 0, wa: o.wa, col: false }); };
  WORLD.curtain = function (ax, az, bx, bz, y0, top, t, o) { o = o || {}; const L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2, c = Math.cos(yaw), s = Math.sin(yaw);
    CAS.wall(ax, az, bx, bz, y0, top, { mat: o.mat, t, col: true, both: true, buttress: 0 });
    for (const sd of (o.sides || [1, -1])) PHY.obox(cx + c * sd * (t / 2 - 0.3), cz - s * sd * (t / 2 - 0.3), 0.3, L / 2, top, top + 1.0, yaw);
    // both faces are dressed from the floor the wall actually stands on (o.floor(x, z)), or from mid-height on tall retaining walls
    for (const sd of [1, -1]) { const fl = o.floor ? o.floor(cx + c * sd * (t / 2 + 1), cz - s * sd * (t / 2 + 1)) : y0, base = Math.max(y0, fl); if (top - base > 5 && L > 5) CAS.facade(ax, az, bx, bz, base, top, { mat: o.mat, side: sd, t, rows: 0, arcH: Math.min((top - base) * 0.62, 8) }); } };
})();
