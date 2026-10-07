/* ==== p70b_hl_kit2.js ==== */
/* HOGWARTS — the second mason's kit (replaces the first pass): weathered stone (damp dark footings, moss, rain streaks,
   broad tonal drift), leaded glass, traceried gothic windows, witch-hat roofs with a flared eave, corbelled tower crowns,
   buttressed wings with dormers — and the light: a low sun, shadows over the whole castle, deep haze in the valleys. */
HL.SUN.set(HL.SUNV[0], HL.SUNV[1], HL.SUNV[2]).normalize();
HL.GLSL_N = `float hH(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
  float hN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hH(i), hH(i + vec2(1.0, 0.0)), f.x), mix(hH(i + vec2(0.0, 1.0)), hH(i + vec2(1.0, 1.0)), f.x), f.y); }
  float hF(vec2 p){ return hN(p) * 0.6 + hN(p * 2.3 + 5.1) * 0.3 + hN(p * 5.1 + 1.7) * 0.1; }`;
HL.stoneMat = function (set, o) {
  o = o || {}; const s = TEX.sets[set], m = new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, roughnessMap: s.roughnessMap, aoMap: s.aoMap || null, aoMapIntensity: 0.7, color: o.color !== undefined ? o.color : 0xffffff, roughness: 1, envMapIntensity: o.env !== undefined ? o.env : 0.45 });
  m.normalScale.set(o.ns || 0.7, o.ns || 0.7); m.userData.tscale = o.scale || s.scale;
  const U = { uHB: { value: new THREE.Vector4(o.base !== undefined ? o.base : HL.Y0, o.vary !== undefined ? o.vary : 1, o.moss !== undefined ? o.moss : 1, o.streak !== undefined ? o.streak : 1) } };
  m.onBeforeCompile = (sh) => { sh.uniforms.uHB = U.uHB;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHW; uniform vec4 uHB;\n' + HL.GLSL_N).replace('#include <map_fragment>', `#include <map_fragment>
      { float along = vHW.x + vHW.z; float n1 = hF(vec2(along * 0.045, vHW.y * 0.06) + 3.0), n2 = hF(vec2(along * 0.16 + 9.0, vHW.y * 0.2));
        diffuseColor.rgb *= mix(1.0, mix(0.66, 1.16, n1), uHB.y); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.06, 0.99, 0.9), n2 * 0.5 * uHB.y);
        float st = hN(vec2(along * 1.1, vHW.y * 0.045)) * hN(vec2(along * 0.3 + 4.0, vHW.y * 0.02 + 2.0)); diffuseColor.rgb *= 1.0 - 0.5 * smoothstep(0.34, 0.7, st) * uHB.w;
        float hb = clamp((vHW.y - uHB.x) / 16.0, 0.0, 1.0), damp0 = (1.0 - hb) * (1.0 - hb); diffuseColor.rgb *= mix(1.0, 0.76, damp0 * uHB.z);
        float lum = dot(diffuseColor.rgb, vec3(0.3, 0.6, 0.1)); float mo = smoothstep(0.42, 0.7, hF(vec2(along * 0.13, vHW.y * 0.1) + 6.0) + damp0 * 0.35) * (0.25 + 0.75 * (1.0 - hb)) * uHB.z;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.15, 0.17, 0.1) * (0.5 + 2.0 * lum), mo * 0.4); }`); };
  m.customProgramCacheKey = () => 'hlstone'; return m;
};
HL.glassTex = function (lit) { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  if (lit) { g.addColorStop(0, '#ffcf70'); g.addColorStop(0.5, '#ffb648'); g.addColorStop(1, '#e88a28'); } else { g.addColorStop(0, '#2c3a50'); g.addColorStop(1, '#141c28'); } x.fillStyle = g; x.fillRect(0, 0, 128, 256);
  const rs = mulberry(lit ? 5 : 9); for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(${lit ? '255,240,200' : '120,150,190'},${rs() * (lit ? 0.3 : 0.14)})`; x.fillRect(i * 16, j * 16, 16, 16); }
  x.strokeStyle = lit ? 'rgba(60,30,8,0.9)' : 'rgba(6,8,12,0.95)'; x.lineWidth = 1.6; for (let i = -16; i < 24; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + 256, 256); x.stroke(); x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 - 256, 256); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
HL.M = function () {
  if (HL._M) return HL._M; const S = HL.stoneMat, P = (n, o) => TEX.mat(n, Object.assign({ macro: 0.2, streak: 0.1 }, o));
  const M = HL._M = { stone: S('ashlar', { color: new THREE.Color(1.02, 0.96, 0.86), scale: 2.3, moss: 0.6, streak: 0.6 }), stoneD: S('ashlar', { color: new THREE.Color(1.04, 0.97, 0.86), scale: 2.3, moss: 0.6 }), trim: S('sandstone', { color: 0xdcdcd8, scale: 3.4, moss: 0.3, streak: 0.5, ns: 0.5 }), pale: S('sandstone', { color: 0xd4d2cc, scale: 4.2, moss: 0.4 }),
    rough: S('rubble', { color: 0xc8c0b2, scale: 3, base: -900, moss: 0.5 }), village: S('rubble', { color: 0xd6ccb8, scale: 2.6, base: -900, moss: 0.6 }),
    floor: P('tiles', { color: 0xc8c0b4, scale: 3.2 }), pave: P('tiles', { color: 0xf0ece4, scale: 2.2, macro: 0.1 }), flag: P('slate', { color: 0xb8b4ac, scale: 2.4 }), cobble: P('cobble', { color: 0xc2bcb0, scale: 2.4 }),
    wood: P('planks', { color: 0xc8a888, scale: 2.0 }), woodD: P('planks', { color: 0x5e4634, scale: 1.6 }), plaster: new THREE.MeshStandardMaterial({ color: 0xb4a688, roughness: 0.95, normalMap: TEX.sets.plaster ? TEX.sets.plaster.normalMap : null, envMapIntensity: 0.3 }),
    roof: S('roofslate', { color: 0x76869a, scale: 2.6, base: -900, moss: 0.5, streak: 0.7, vary: 1.3, env: 0.7 }), roofV: S('roofslate', { color: 0x8a7a6e, scale: 2.4, base: -900, moss: 0.8, streak: 0.8, vary: 1.4 }), thatch: P('hessian', { color: 0xa89868, scale: 1.4 }),
    lead: new THREE.MeshStandardMaterial({ color: 0x3e4248, metalness: 0.2, roughness: 0.62, envMapIntensity: 0.34 }), iron: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.5 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd0a444, metalness: 1, roughness: 0.32 }), dark: new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 1, envMapIntensity: 0.1 }),
    glass: new THREE.MeshBasicMaterial({ map: HL.glassTex(true), color: new THREE.Color(2.3, 1.75, 1.05), toneMapped: false }), glassDim: new THREE.MeshBasicMaterial({ map: HL.glassTex(true), color: new THREE.Color(0.75, 0.5, 0.26), toneMapped: false }),
    glassD: new THREE.MeshStandardMaterial({ map: HL.glassTex(false), color: 0xc8d4e8, metalness: 0.7, roughness: 0.16, envMapIntensity: 1.7 }), glassC: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.62, 0.8), toneMapped: false }),
    green: new THREE.MeshPhysicalMaterial({ color: 0x9ac4b0, metalness: 0.1, roughness: 0.12, transparent: true, opacity: 0.34, envMapIntensity: 1.6, side: THREE.DoubleSide }) };
  for (const k of ['lead', 'iron', 'gold', 'dark', 'glassC', 'green']) M[k].userData.tscale = 1; M.plaster.userData.tscale = 2.5; for (const k of ['glass', 'glassDim', 'glassD']) M[k].userData.tscale = 1.1; M.glass.userData.noShadow = true; M.glassDim.userData.noShadow = true; M.green.userData.noShadow = true;
  return M;
};
(function () { const m0 = HL.M; HL.M = function () { const M = m0(); if (!M._ns) { M._ns = 1; for (const k of ['glass', 'glassDim', 'glassD', 'glassC']) if (M[k]) M[k].userData.noShadow = true; } return M; }; })();
/* toward evening the castle is lit from within: more of its windows burn */
HL.pickGlass = function (rs, lit) { const M = HL.M(), q = rs(); return q < lit * 1.05 ? M.glass : q < lit * 1.55 ? M.glassDim : M.glassD; };
/* ------------------------------------------------------------------ gothic windows: a moulded pointed frame, lancets, a foiled eye */
HL._wg = {};
HL.archPath = function (P, hw, sh, ah, x0) { x0 = x0 || 0; P.moveTo(x0 - hw, 0); P.lineTo(x0 - hw, sh); P.quadraticCurveTo(x0 - hw, sh + (ah - sh) * 0.74, x0, ah); P.quadraticCurveTo(x0 + hw, sh + (ah - sh) * 0.74, x0 + hw, sh); P.lineTo(x0 + hw, 0); P.lineTo(x0 - hw, 0); return P; };
HL.winGeo = function (w, h) {
  const key = w.toFixed(1) + '|' + h.toFixed(1); if (HL._wg[key]) return HL._wg[key];
  const f = Math.min(0.34, 0.16 + w * 0.06), hw = w / 2, sh = h * 0.6, S = HL.archPath(new THREE.Shape(), hw + f, sh, h + f * 1.4), n = Math.max(1, Math.min(5, Math.round(w / 0.95))), mul = Math.min(0.18, w * 0.07), lw = (w - mul * (n - 1)) / n;
  const top = n > 1 ? sh - lw * 0.1 : h; for (let i = 0; i < n; i++) { const cx = -hw + lw / 2 + i * (lw + mul); S.holes.push(HL.archPath(new THREE.Path(), lw / 2, n > 1 ? top - lw * 0.7 : sh, top, cx)); }
  if (n > 1) { const r = Math.min(hw * 0.42, (h - sh) * 0.42); const c = new THREE.Path(); c.absarc(0, sh + (h - sh) * 0.42, r, 0, TAU, false); S.holes.push(c); if (n >= 3) for (const sx of [-1, 1]) { const c2 = new THREE.Path(); c2.absarc(sx * hw * 0.52, sh + (h - sh) * 0.1, r * 0.5, 0, TAU, false); S.holes.push(c2); } }
  const frame = new THREE.ExtrudeGeometry(S, { depth: 0.26, bevelEnabled: false, curveSegments: 3 }), glass = new THREE.ShapeGeometry(HL.archPath(new THREE.Shape(), hw + f * 0.5, sh, h + f * 0.7), 4); glass.translate(0, 0, 0.05);
  { const uv = glass.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 2.4); }
  // a sill and a hood mould
  const sill = new THREE.BoxGeometry(w + f * 2 + 0.3, 0.22, 0.42); sill.translate(0, -0.11, 0.2);
  return (HL._wg[key] = { frame, glass, sill });
};
/* a window on a wall face: (px,py,pz) = centre of the sill on the face, th = the face's outward heading */
HL.win = function (px, py, pz, th, w, h, glass, o) {
  o = o || {}; const M = HL.M(), G = HL.winGeo(w, h), m4 = new THREE.Matrix4().makeRotationY(th); m4.setPosition(px, py, pz);
  KIT.geo(G.frame, o.mat || M.trim, m4, { worldUV: true }); KIT.geo(G.glass, glass || M.glassD, m4, { uvs: 1 }); if (o.sill !== false) KIT.geo(G.sill, o.mat || M.trim, m4, { worldUV: true });
};
/* ------------------------------------------------------------------ roofs */
HL.cone = function (x, z, r, y, h, o) {
  o = o || {}; const M = HL.M(), seg = o.seg || 24, pr = [[r * 1.1, -0.35], [r * 1.0, 0.0], [r * 0.86, h * 0.1], [r * 0.6, h * 0.36], [r * 0.34, h * 0.64], [r * 0.14, h * 0.86], [0.03, h]];
  KIT.lathe(pr, x, y, z, o.mat || M.roof, { seg, uvs: Math.max(3, Math.round(r * 2.2)), uvs2: Math.max(2, h / 2.6) });
  KIT.cyl(x, y - 0.5, z, r * 1.1, 0.3, M.lead, { seg, col: false });
  KIT.cyl(x, y + h - 0.5, z, 0.14, 2.8, M.lead, { seg: 6, col: false, r1: 0.03 }); KIT.geo(new THREE.SphereGeometry(Math.min(0.34, 0.12 + r * 0.04), 8, 6), M.gold, new THREE.Matrix4().makeTranslation(x, y + h + 0.5, z));
  for (let k = 0; k < 4; k++) PHY.cyl(x, z, r * (1 - (k + 0.5) / 4), y + h * k / 4, y + h * (k + 1) / 4, { noFloor: true });
};
/* a flared pyramid (square towers) */
HL.pyr = function (x, z, hw, hd, y, h, yaw, o) {
  o = o || {}; const M = HL.M(), g = new THREE.LatheGeometry([[1.1, -0.3], [1, 0], [0.84, h * 0.1], [0.56, h * 0.38], [0.3, h * 0.66], [0.12, h * 0.87], [0.02, h]].map((p) => new THREE.Vector2(p[0], p[1])), 4); g.rotateY(PI / 4); g.scale(hw * 1.414, 1, hd * 1.414); g.rotateY(yaw || 0);
  KIT.geo(g, o.mat || M.roof, new THREE.Matrix4().makeTranslation(x, y, z), { uvs: 6, uvs2: Math.max(2, h / 2.6) }); KIT.cyl(x, y + h - 0.4, z, 0.14, 3, M.lead, { seg: 6, col: false, r1: 0.03 }); KIT.geo(new THREE.SphereGeometry(0.3, 8, 6), M.gold, new THREE.Matrix4().makeTranslation(x, y + h + 2.7, z));
  for (let k = 0; k < 4; k++) PHY.box(x - hw * (1 - (k + 0.5) / 4), y + h * k / 4, z - hd * (1 - (k + 0.5) / 4), x + hw * (1 - (k + 0.5) / 4), y + h * (k + 1) / 4, z + hd * (1 - (k + 0.5) / 4), { noFloor: true });
};
HL.pin = function (x, y, z, r, h) { const M = HL.M(); KIT.box(x - r, y - 0.2, z - r, x + r, y + h * 0.35, z + r, M.trim, { col: false }); const g = new THREE.ConeGeometry(r * 1.5, h * 0.75, 4, 1); g.rotateY(PI / 4); KIT.geo(g, M.trim, new THREE.Matrix4().makeTranslation(x, y + h * 0.35 + h * 0.375, z), { worldUV: true }); };
/* a dormer on a roof slope: its little gabled front faces `th` */
HL.dormer = function (x, y, z, th, w) { const M = HL.M(), c = Math.cos(th), s = Math.sin(th), w2 = w / 2, d = 1.6; KIT.obox(x - s * d * 0.5, y, z - c * d * 0.5, w2, y + w * 1.05, d, th, M.stone, { col: false });
  const g = new THREE.CylinderGeometry(1, 1, 1, 3, 1); g.rotateZ(HALF); g.rotateX(-HALF); g.rotateY(HALF); g.scale(w * 1.24, w * 0.9, d * 2.3); g.rotateY(th); KIT.geo(g, M.roof, new THREE.Matrix4().makeTranslation(x - s * d * 0.45, y + w * 1.05 + w * 0.22, z - c * d * 0.45), { uvs: 2 });
  HL.win(x + s * 0.03, y + 0.25, z + c * 0.03, th, w * 0.5, w * 0.82, HL.pickGlass(mulberry((x * 13 + z * 7) | 0), 0.6), { sill: false }); };
(function () {   // gables grow dormers along their slopes when asked
  const g0 = HL.gable;
  HL.gable = function (x0, z0, x1, z1, y, rise, axis, o) { g0(x0, z0, x1, z1, y, rise, axis, o); o = o || {}; if (!o.dorm) return;
    if (axis === 'x') { const hw = (z1 - z0) / 2, n = Math.max(1, Math.round((x1 - x0) / o.dorm)); for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; for (const s of [-1, 1]) HL.dormer(x, y + rise * 0.22, (z0 + z1) / 2 + s * hw * 0.8, s > 0 ? 0 : PI, 1.9); } }
    else { const hw = (x1 - x0) / 2, n = Math.max(1, Math.round((z1 - z0) / o.dorm)); for (let i = 0; i < n; i++) { const z = z0 + (i + 0.5) * (z1 - z0) / n; for (const s of [-1, 1]) HL.dormer((x0 + x1) / 2 + s * hw * 0.8, y + rise * 0.22, z, s > 0 ? HALF : -HALF, 1.9); } } };
})();
/* ------------------------------------------------------------------ towers */
HL.round = function (x, z, r, y, h, o) {
  o = o || {}; const M = HL.M(), mat = o.mat || M.stone, yb = o.base !== undefined ? o.base : Math.min(y, HL.h(x, z) - 5), H = y + h - yb, seg = r > 5 ? 28 : r > 2.5 ? 18 : 12, ts = mat.userData.tscale || 2.3, uvs = Math.max(2, Math.round(TAU * r / ts)), rs = mulberry((x * 7 + z * 3 + h) | 0);
  if (o.base === undefined) KIT.cyl(x, yb, z, r * 1.12, Math.min(9, H * 0.14), mat, { seg, col: false, r1: r, uvs });
  /* o.hollow (an inner radius): the drum is a tube and its string courses are rings — nothing crosses the inside, where a stair climbs */
  const cyl = (yy, rr, hh, m2) => o.hollow ? KIT.ringCyl(x, yy, z, rr, hh, m2, { seg, uvs, rin: o.hollow }) : KIT.cyl(x, yy, z, rr, hh, m2, { seg, uvs, col: false });
  cyl(yb, r, H, mat); if (o.col !== false) PHY.cyl(x, z, r, yb, y + h + 1);
  for (let yy = y + 9; yy < y + h - 7; yy += 11) cyl(yy, r * 1.03, 0.36, M.trim);
  if (r >= 2.4 && o.arches !== false) { const nw = clamp(Math.round(r * 0.8), 3, 9), lit = o.lit !== undefined ? o.lit : 0.42, ww = clamp(r * 0.2, 0.7, 1.5);
    for (let k = 0, wy = y + h - 7.5; wy > y + 2.5; wy -= (r > 6 ? 8.5 : 7), k++) for (let i = 0; i < nw; i++) { const a = (i + (k % 2) * 0.5) / nw * TAU + (o.wa || 0); if (rs() < 0.22) continue; HL.win(x + Math.sin(a) * (r + 0.02), wy, z + Math.cos(a) * (r + 0.02), a, ww, ww * 2.7, HL.pickGlass(rs, lit)); } }
  // crown: a corbelled flare, a gallery band, a cornice
  const ct = y + h, fl = Math.max(0.5, r * 0.13); KIT.cyl(x, ct - 1.6, z, r, 1.6, M.trim, { seg, col: false, r1: r + fl, uvs }); KIT.cyl(x, ct, z, r + fl, o.open ? 1.3 : 2.4, mat, { seg, col: false, uvs });
  if (!o.open && r > 2) { const ng = Math.max(6, Math.round(r * 2.4)); for (let i = 0; i < ng; i++) { const a = (i + 0.5) / ng * TAU; KIT.obox(x + Math.sin(a) * (r + fl + 0.02), ct + 0.5, z + Math.cos(a) * (r + fl + 0.02), Math.min(0.42, r * 0.09), ct + 1.9, 0.05, a, rs() < 0.5 ? M.glassDim : M.dark, { col: false }); } }
  KIT.cyl(x, ct + (o.open ? 1.3 : 2.4), z, r + fl + 0.25, 0.35, M.trim, { seg, col: false, uvs });
  const top = ct + (o.open ? 1.3 : 2.4) + 0.35;
  if (o.open) { const m = Math.max(8, Math.round(TAU * r / 1.8)); for (let i = 0; i < m; i++) { const a = i / m * TAU; KIT.obox(x + Math.sin(a) * (r + fl), top, z + Math.cos(a) * (r + fl), TAU * r / m * 0.3, top + 1.3, 0.3, a, mat, { col: false }); } }
  if (o.pots) for (let i = 0; i < o.pots; i++) { const a = (i + 0.5) / o.pots * TAU + (o.wa || 0), pr = Math.max(1.2, r * 0.24), px = x + Math.sin(a) * (r + pr * 0.3), pz = z + Math.cos(a) * (r + pr * 0.3), py = y + h - pr * 4;
    KIT.cyl(px, py - pr * 2, pz, pr, pr * 2, mat, { seg: 12, col: false, r1: pr * 0.2 }); KIT.cyl(px, py, pz, pr, pr * 6.4, mat, { seg: 12, col: false }); KIT.cyl(px, py + pr * 6.4, pz, pr * 1.12, 0.3, M.trim, { seg: 12, col: false }); HL.cone(px, pz, pr * 1.3, py + pr * 6.7, pr * 3.8, { seg: 12 });
    HL.win(px + Math.sin(a) * (pr + 0.02), py + pr * 3.6, pz + Math.cos(a) * (pr + 0.02), a, pr * 0.5, pr * 1.5, HL.pickGlass(rs, 0.6), { sill: false }); }
  if (o.roof !== false) HL.cone(x, z, (r + fl) * 1.16, top + (o.open ? 1.3 : 0), r * (o.steep || 2.5) + 2);
  return top;
};
HL.square = function (x, z, hw, hd, y, h, o) {
  o = o || {}; const M = HL.M(), mat = o.mat || M.stone, yaw = o.yaw || 0, yb = o.base !== undefined ? o.base : Math.min(y, HL.h(x, z) - 5), P = CAS.rot(x, z, yaw), rs = mulberry((x * 13 + z * 5 + h) | 0), lit = o.lit !== undefined ? o.lit : 0.42;
  KIT.obox(x, yb, z, hw, y + h, hd, yaw, mat, { col: o.col !== false }); if (o.base === undefined) KIT.obox(x, yb, z, hw + 0.5, y + 1.6, hd + 0.5, yaw, mat, { col: false });
  for (let yy = y + 10; yy < y + h - 5; yy += 11) KIT.obox(x, yy, z, hw + 0.14, yy + 0.38, hd + 0.14, yaw, M.trim, { col: false });
  // clasping buttresses that rise into corner turrets
  const tr = Math.max(1.0, Math.min(hw, hd) * 0.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = P(sx * hw, sz * hd); KIT.obox(p[0], yb, p[1], tr * 0.75, y + h * 0.7, tr * 0.75, yaw, mat, { col: false }); if (o.turrets !== false) { KIT.cyl(p[0], y + h * 0.7, p[1], tr, h * 0.3 + 5, mat, { seg: 10, col: false }); KIT.cyl(p[0], y + h + 5, p[1], tr * 1.14, 0.3, M.trim, { seg: 10, col: false }); HL.cone(p[0], p[1], tr * 1.3, y + h + 5.3, tr * 4, { seg: 10 }); } }
  for (const [nx, nz, half, th0] of [[0, 1, hw, 0], [0, -1, hw, PI], [1, 0, hd, HALF], [-1, 0, hd, -HALF]]) { const n = half > 6 ? 3 : half > 3.4 ? 2 : 1, ww = clamp(half * 0.26, 0.8, 1.5);
    for (let wy = y + h - 8; wy > y + 3; wy -= 8) for (let i = 0; i < n; i++) { if (rs() < 0.15) continue; const l = (i - (n - 1) / 2) * half * 1.5 / n, p = nz ? P(l, nz * (hd + 0.02)) : P(nx * (hw + 0.02), l); HL.win(p[0], wy, p[1], th0 + yaw, ww, ww * 2.8, HL.pickGlass(rs, lit)); } }
  const ct = y + h; KIT.obox(x, ct - 1.0, z, hw + 0.45, ct, hd + 0.45, yaw, M.trim, { col: false }); KIT.obox(x, ct, z, hw + 0.45, ct + 1.5, hd + 0.45, yaw, mat, { col: false });
  if (o.roof !== false) HL.pyr(x, z, hw + 0.2, hd + 0.2, ct + 1.5, Math.max(hw, hd) * (o.steep || 2.6), yaw);
  return ct + 1.5;
};
/* ------------------------------------------------------------------ a wing: a solid range of buildings dressed bay by bay */
HL.wing = function (x0, z0, x1, z1, y, h, o) {
  o = o || {}; const M = HL.M(), mat = o.mat || M.stone, rs = mulberry((x0 * 3 + z0 * 17) | 0), yb = Math.min(y, HL.h((x0 + x1) / 2, (z0 + z1) / 2) - 4) - (o.deep || 0), lit = o.lit !== undefined ? o.lit : 0.45, st = o.storeys || Math.max(1, Math.round(h / 9)), sh = (h - 2) / st, skip = o.skip || '';
  const hall = o.hall, hops = hall ? (hall.ops || {}) : {};
  if (hall) { const t = hall.t || 1.5, hh = hall.h, W = (ax, c, a, b, op, side) => HL.GK.wall(ax, c, a, b, y, hh, t, op, { out: mat, in: hall.lining || HL.GK.M().wall, side });
    KIT.box(x0, yb, z0, x1, y, z1, mat, { col: true, mats: { Y: hall.floor || HL.IM().flag } }); KIT.box(x0, y + hh, z0, x1, y + h, z1, mat, { col: true });
    W('x', z0 + t / 2, x0, x1, hops.z, 1); W('x', z1 - t / 2, x0, x1, hops.Z, -1); W('z', x0 + t / 2, z0 + t, z1 - t, hops.x, 1); W('z', x1 - t / 2, z0 + t, z1 - t, hops.X, -1); }
  else KIT.box(x0, yb, z0, x1, y + h, z1, mat, { col: o.col !== false });
  KIT.box(x0 - 0.35, yb, z0 - 0.35, x1 + 0.35, y + (hall ? -0.06 : 1.3), z1 + 0.35, mat, { col: false });
  const face = (ax, c, a, b, th, key) => { if (skip.includes(key)) return; const L = b - a, n = Math.max(1, Math.round(L / (o.bay || 5.4))), bw = L / n, out = (key === 'z' || key === 'x') ? -1 : 1;
    const at = (u, d) => (ax === 'x' ? [u, c + out * d] : [c + out * d, u]);
    for (let i = 0; i <= n; i++) { const u = a + i * bw, p = at(u, 0.45), q = at(u, 0.9); if ((hops[key] || []).some((op) => Math.abs(op.p - u) < op.w / 2 + 0.7)) continue; KIT.box(p[0] - 0.45, yb, p[1] - 0.45, p[0] + 0.45, y + h - 1.2, p[1] + 0.45, mat, { col: false }); KIT.box(q[0] - 0.4, yb, q[1] - 0.4, q[0] + 0.4, y + h * 0.5, q[1] + 0.4, mat, { col: false }); HL.pin(p[0], y + h + 1.2, p[1], 0.36, 2.6); }
    for (let k = 0; k < st; k++) { const wy = y + 2.2 + k * sh, wh = Math.min(sh - 2.4, 6.2); for (let i = 0; i < n; i++) { if (rs() < 0.08 || (hall && wy < y + hall.h + 0.5)) continue; const p = at(a + (i + 0.5) * bw, 0.02); HL.win(p[0], wy, p[1], th, Math.min(1.9, bw * 0.36), wh, HL.pickGlass(rs, lit)); }
      if (k > 0) { const p0 = at(a, 0.0), p1 = at(b, 0.2); KIT.box(Math.min(p0[0], p1[0]), y + 1 + k * sh, Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), y + 1.36 + k * sh, Math.max(p0[1], p1[1]), M.trim, { col: false }); } } };
  face('x', z0, x0, x1, PI, 'z'); face('x', z1, x0, x1, 0, 'Z'); face('z', x0, z0, z1, -HALF, 'x'); face('z', x1, z0, z1, HALF, 'X');
  KIT.box(x0 - 0.4, y + h - 0.8, z0 - 0.4, x1 + 0.4, y + h, z1 + 0.4, M.trim, { col: false }); KIT.box(x0 - 0.3, y + h, z0 - 0.3, x1 + 0.3, y + h + 1.1, z1 + 0.3, mat, { col: false });
  const axis = o.roof || ((x1 - x0) > (z1 - z0) ? 'x' : 'z'), span = axis === 'x' ? (z1 - z0) : (x1 - x0);
  if (o.roof !== null) HL.gable(x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, y + h + 0.6, span * (o.pitch || 0.62), axis, { ceil: false, dorm: o.dorm === undefined ? 7 : o.dorm, ov: 0.2, gable: mat });
  return y + h;
};
/* ------------------------------------------------------------------ light, shadow and air */
(function () {
  const s0 = HL.sky;
  HL.sky = function (L) {
    const r = s0(L); HL.LOOK = { sunI: 3.5, hemiI: 2.95, exposure: 1.0 };
    R.setSun(HL.SUN.clone(), 0xffb676, HL.LOOK.sunI, 0x9fb4e0, 0x9a8062, HL.LOOK.hemiI); L.sunCol = R.sun.color.clone().multiplyScalar(R.sun.intensity / Math.PI);
    R.sun.shadow.mapSize.set(MG.flags.q === 'low' ? 2048 : 4096, MG.flags.q === 'low' ? 2048 : 4096); R.shEvery = 3; if (R.sun.shadow.map) { R.sun.shadow.map.dispose(); R.sun.shadow.map = null; } R.sun.shadow.bias = -0.0005; R.sun.shadow.normalBias = 0.16; R.shD = 520;
    HL.shadowFoot = 170; HL.shadowFly = 330; R.setShadowBox(HL.shadowFoot, 1300);
    const G = R.G; G.exposure = 1.0; G.bloom = 0.42; G.bloomThr = 1.22; G.sat = 1.05; G.contrast = 1.06; G.vig = 0.42; G.ao = 0.9; G.aoR = 0.7; G.vol = 0.8; G.volDen = 0.006; G.volMax = 260; G.volH = HL.Y0 - 40; G.volFall = 0.013; G.volTint.setRGB(1.0, 0.66, 0.36);
    G.gShadow.setRGB(0.90, 0.96, 1.10); G.gHigh.setRGB(1.09, 1.0, 0.87); CM.rimU.value.setRGB(0.8, 0.5, 0.28); CM.fillU.value.setRGB(0.46, 0.46, 0.5);
    R.scene.fog.color.setRGB(0.40, 0.41, 0.52); R.scene.fog.density = 0.00102; r.U.uFog.value.copy(R.scene.fog.color);
    return r;
  };
  // the light's camera stands far enough back that a whole castle can cast into the box
  R.updateShadow = function (focus) {
    R.shadowFocus.copy(focus); const cam = R.sun.shadow.camera, span = cam.right - cam.left, tex = span / R.sun.shadow.mapSize.x, up = YUP;
    const zx = R.sunDir.clone().negate(), xx = new THREE.Vector3().crossVectors(up, zx).normalize(), yx = new THREE.Vector3().crossVectors(zx, xx);
    const fx = Math.round(focus.dot(xx) / tex) * tex, fy = Math.round(focus.dot(yx) / tex) * tex, fz = focus.dot(zx), f = xx.multiplyScalar(fx).add(yx.multiplyScalar(fy)).add(zx.multiplyScalar(fz));
    R.sun.target.position.copy(f); R.sun.position.copy(f).addScaledVector(R.sunDir, R.shD || 60); R.sun.target.updateMatrixWorld(); R.sun.updateMatrixWorld();
  };
})();
