/* ==== p52b_or_knight.js ==== */
/* OPUS RING — forged harness. Plate is built as overlapping lames: each piece is a shell swept round an axis (ARM.band)
   with a rolled edge, so pauldrons, couters, poleyns, sabatons and the visored helm read as articulated armour and not
   as smooth tubes. Surfaces take the scanned rust / leather / hessian sets. */
ARM.SETS = ['rust', 'leather', 'hessian', 'planks'];
/* a shell swept about an axis. c: start point on the axis; ax: axis; up: the direction the arc is centred on.
   prof: [[t along axis, radius], ...]. o: { seg, ku, ks (radius scale toward up / to the side), mod(ang, f) -> radius factor, a0 (arc centre offset), uv } */
ARM.band = function (c, ax, up, prof, arc, o) {
  o = o || {}; const A = V3(ax[0], ax[1], ax[2]).normalize(), U = V3(up[0], up[1], up[2]); U.addScaledVector(A, -U.dot(A)).normalize(); const S = new THREE.Vector3().crossVectors(A, U);
  const full = arc >= TAU - 1e-3, seg = o.seg || Math.max(6, Math.round(arc / TAU * 22)), n = prof.length, ku = o.ku || 1, ks = o.ks || 1, a0 = o.a0 || 0, P = [], UV = [], I = [], uvk = o.uv || 1;
  for (let j = 0; j < n; j++) for (let i = 0; i <= seg; i++) { const ang = a0 - arc / 2 + arc * i / seg, f = j / (n - 1), r = prof[j][1] * (o.mod ? o.mod(ang - a0, f) : 1), cu = Math.cos(ang) * r * ku, cs = Math.sin(ang) * r * ks, t = prof[j][0];
    P.push(c[0] + A.x * t + U.x * cu + S.x * cs, c[1] + A.y * t + U.y * cu + S.y * cs, c[2] + A.z * t + U.z * cu + S.z * cs); UV.push(i / seg * (arc / TAU) * 2 * uvk + (c[0] + c[1]) * 3.1, f); }
  for (let j = 0; j + 1 < n; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + 1, d = a + seg + 1, e = d + 1; I.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
  if (full) { const nn = g.attributes.normal; for (let j = 0; j < n; j++) { const a = j * (seg + 1), b = a + seg; const x = nn.getX(a) + nn.getX(b), y = nn.getY(a) + nn.getY(b), z = nn.getZ(a) + nn.getZ(b), l = Math.hypot(x, y, z) || 1; nn.setXYZ(a, x / l, y / l, z / l); nn.setXYZ(b, x / l, y / l, z / l); } }
  return g;
};
/* a tube along a polyline (trim, straps, a helm's comb) */
ARM.tube = function (pts, r, o) {
  o = o || {}; const cv = new THREE.CatmullRomCurve3(pts.map((p) => V3(p[0], p[1], p[2])), false, 'centripetal'); const g = new THREE.TubeGeometry(cv, o.seg || pts.length * 4, r, o.rs || 6, false); if (o.flat) { /* squash across `flat` axis */ } return g;
};
ARM.perp = (ax, hint) => { const a = V3(ax[0], ax[1], ax[2]).normalize(), h = V3(hint[0], hint[1], hint[2]); h.addScaledVector(a, -h.dot(a)).normalize(); return [h.x, h.y, h.z]; };
/* ring mail as a tiling map */
ARM.mailTex = function () {
  if (ARM._mail) return ARM._mail; const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#17181a'; x.fillRect(0, 0, N, N);
  for (let j = -1; j < 9; j++) for (let i = -1; i < 9; i++) { const cx = i * 16 + (j % 2 ? 8 : 0), cy = j * 16; x.strokeStyle = '#8c8e92'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 7.5, 0, TAU); x.stroke(); x.strokeStyle = '#3a3c40'; x.lineWidth = 1.2; x.beginPath(); x.arc(cx, cy + 1.5, 7.5, 0.3, PI - 0.3); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; ARM._mail = t; return t;
};
/* worn plate as a map over each lame (u round the piece, v from its top edge to its lower rim): hammer marks, scratches,
   grime gathered under the plate above, a bright worn rim, specks of rust */
ARM.steelTex = function () {
  if (ARM._steel) return ARM._steel; const N = 512, mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; }, cA = mk(), cR = mk(), xa = cA.getContext('2d'), xr = cR.getContext('2d'), ia = xa.createImageData(N, N), ir = xr.createImageData(N, N), rs = mulberry(4401);
  const scr = new Float32Array(N * N); for (let k = 0; k < 260; k++) { let x = rs() * N, y = rs() * N; const a = rs() * TAU, L = 8 + rs() * rs() * 110, w = 0.25 + rs() * 0.6; for (let i = 0; i < L; i++) { const xi = ((x | 0) % N + N) % N, yi = (y | 0); if (yi >= 0 && yi < N) scr[yi * N + xi] = Math.max(scr[yi * N + xi], w); x += Math.cos(a); y += Math.sin(a) * 0.6; } }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const u = i / N, v = j / N, k = (j * N + i) * 4, n1 = TEX.tn(u * 6, v * 6, 6, 4), n2 = TEX.tn(u * 24 + 3, v * 24, 24, 3), ham = TEX.tn(u * 48, v * 48 + 7, 48, 2);
    const top = 1 - smooth(0.0, 0.16, v), rim = smooth(0.86, 0.97, v), grime = smooth(0.52, 0.8, n1) * 0.5 + top * 0.6, rust = smooth(0.7, 0.86, n2 * 0.6 + n1 * 0.5) * (0.4 + 0.6 * top), sc = scr[j * N + i];
    let b = 0.56 + (ham - 0.5) * 0.14 + (n2 - 0.5) * 0.1; b *= 1 - grime * 0.55; b += rim * 0.3 + sc * 0.12;
    const r = b * lerp(1, 1.25, rust), g = b * lerp(1, 0.86, rust), bl = b * lerp(1.02, 0.6, rust);
    ia.data[k] = clamp(r * 255, 0, 255); ia.data[k + 1] = clamp(g * 255, 0, 255); ia.data[k + 2] = clamp(bl * 255, 0, 255); ia.data[k + 3] = 255;
    const ro = clamp(0.62 + grime * 0.3 + rust * 0.3 - rim * 0.3 - sc * 0.25 + (ham - 0.5) * 0.2, 0.2, 1) * 255; ir.data[k] = ir.data[k + 1] = ir.data[k + 2] = ro; ir.data[k + 3] = 255; }
  xa.putImageData(ia, 0, 0); xr.putImageData(ir, 0, 0);
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
  ARM._steel = { map: T(cA, true), rough: T(cR, false) }; return ARM._steel;
};
ARM.plateMat = function (col, env) { const st = ARM.steelTex(), s = TEX.sets.rust || {}; const m = new THREE.MeshStandardMaterial({ color: col, map: st.map, metalness: 1, roughness: 1, roughnessMap: st.rough, normalMap: s.normalMap || null, envMapIntensity: env, side: THREE.DoubleSide }); m.normalScale.set(0.5, 0.5); return m; };
ARM.KM = {
  kplate: () => ARM.plateMat(0xb4b0a8, 0.75),
  kedge: () => { const s = TEX.sets.rust || {}; return new THREE.MeshStandardMaterial({ color: 0x8c877d, metalness: 1, roughness: 0.66, roughnessMap: s.roughnessMap || null, envMapIntensity: 0.8, side: THREE.DoubleSide }); },
  kdark: () => ARM.plateMat(0x6a6864, 0.6),
  kbrass: () => new THREE.MeshStandardMaterial({ color: 0x8a6c3a, metalness: 1, roughness: 0.55, envMapIntensity: 0.8, side: THREE.DoubleSide }),
  kleather: () => { const s = TEX.sets.leather || {}; const m = new THREE.MeshStandardMaterial({ color: 0x8e8478, metalness: 0, roughness: 0.8, map: s.map || null, normalMap: s.normalMap || null, envMapIntensity: 0.3, side: THREE.DoubleSide }); return m; },
  kmail: () => new THREE.MeshStandardMaterial({ color: 0x9a9a9c, metalness: 0.85, roughness: 0.6, map: ARM.mailTex(), envMapIntensity: 0.6, side: THREE.DoubleSide }),
  kblack: () => new THREE.MeshStandardMaterial({ color: 0x08080a, metalness: 0, roughness: 1, envMapIntensity: 0, side: THREE.DoubleSide }),
  kwood: () => { const s = TEX.sets.planks || {}; return new THREE.MeshStandardMaterial({ color: 0x8a7a66, metalness: 0, roughness: 0.9, map: s.map || null, normalMap: s.normalMap || null, envMapIntensity: 0.25, side: THREE.DoubleSide }); },
  kgold: () => ARM.plateMat(0xdcb060, 1.0),
  kmantleRed: () => { const b = CLOTH.mat('kcapeRed'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = () => 'clothpanel'; m.map = ARM.capeTex().solid; m.alphaTest = 0; return m; },
  kmantleWhite: () => { const b = CLOTH.mat('white'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = () => 'clothpanel'; m.map = ARM.capeTex().solid; m.alphaTest = 0; return m; },
  kmantleRags: () => { const b = CLOTH.mat('rags'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = () => 'clothpanel'; m.map = ARM.capeTex().solid; m.alphaTest = 0; return m; },
  kmantleGrey: () => { const b = CLOTH.mat('margit'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = () => 'clothpanel'; m.map = ARM.capeTex().solid; m.alphaTest = 0; return m; },
  kmantle: () => { const m = CLOTH.mat('kcape').clone(); m.onBeforeCompile = CLOTH.mat('kcape').onBeforeCompile; m.customProgramCacheKey = () => 'clothpanel'; m.map = ARM.capeTex().solid; m.alphaTest = 0; return m; },
};
(function () { const m0 = ARM.mat; ARM.mat = function (kind) {
  ARM._m = ARM._m || {}; if (ARM._m[kind]) return ARM._m[kind]; const K = ARM.KM[kind]; if (!K) return m0(kind);
  const m = K(); if (!kind.startsWith('kmantle')) { m.onBeforeCompile = (sh) => { sh.uniforms.uFill = CM.fillU; CM.rimHook(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFill;').replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + CM.FILL); }; m.customProgramCacheKey = () => 'orarm'; }
  ARM._m[kind] = m; return m; }; })();
/* worn cloth for capes: a coarse weave gone dark with travel — pleats, water stains, mud toward a hem torn to rags.
   Returns { map (with alpha), solid (no alpha), normal (pleats) } */
ARM.capeTex = function () {
  if (ARM._cape) return ARM._cape;
  const W = 512, H = 1024, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }, cA = mk(), cS = mk(), cN = mk(), rs = mulberry(1977);
  const xa = cA.getContext('2d'), xs = cS.getContext('2d'), xn = cN.getContext('2d'), ia = xa.createImageData(W, H), is = xs.createImageData(W, H), inn = xn.createImageData(W, H), d = ia.data, ds = is.data, dn = inn.data;
  const tears = []; for (let i = 0; i < 16; i++) tears.push([rs(), 0.05 + rs() * rs() * 0.34, 0.012 + rs() * 0.045]);
  const fold = (u, v) => Math.sin(u * 38 + Math.sin(v * 3.1) * 1.6 + fbm2(u * 3, v * 2, 2) * 5) * 0.6 + Math.sin(u * 91 + v * 5) * 0.4;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = i / W, v = j / H, k = (j * W + i) * 4;
    const weave = 0.86 + 0.14 * Math.sin(i * 1.57) * Math.sin(j * 1.57) + (hash2(i, j) - 0.5) * 0.14, f = fold(u, v), fl = 0.8 + 0.2 * f * smooth(0.02, 0.3, v) - 0.08 * smooth(0.5, 0.9, fbm2(u * 40, v * 1.5, 2));
    const stain = 1 - 0.45 * smooth(0.44, 0.8, fbm2(u * 5, v * 7 + 9, 3)), worn = 1 + 0.3 * smooth(0.62, 0.9, fbm2(u * 9 + 4, v * 14, 3)), mud = lerp(1, 0.45, smooth(0.55, 1, v + (fbm2(u * 9, 3, 2) - 0.5) * 0.25));
    const b = 255 * clamp(0.78 * weave * fl * stain * worn * mud, 0, 1); d[k] = ds[k] = b; d[k + 1] = ds[k + 1] = b * 0.95; d[k + 2] = ds[k + 2] = b * 0.88; ds[k + 3] = 255;
    let hem = 0.95 - 0.06 * fbm2(u * 26, 1, 2); for (const t of tears) hem = Math.min(hem, 1 - t[1] * Math.max(0, 1 - Math.abs(u - t[0]) / t[2]));
    const hole = v > 0.5 && fbm2(u * 15 + 4, v * 11, 3) > 0.77 - v * 0.05, edge = (u < 0.015 + 0.02 * fbm2(v * 30, 2, 2) * v || u > 0.985 - 0.02 * fbm2(v * 30, 7, 2) * v);
    d[k + 3] = (v > hem || hole || edge) ? 0 : 255;
    const e = 1 / W, nx = (fold(u + e, v) - fold(u - e, v)) * 0.12 * smooth(0.02, 0.3, v); dn[k] = clamp(128 - nx * 127 * 4, 0, 255); dn[k + 1] = 128; dn[k + 2] = 255; dn[k + 3] = 255; }
  xa.putImageData(ia, 0, 0); xs.putImageData(is, 0, 0); xn.putImageData(inn, 0, 0);
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };   // row 0 of the canvas is the shoulder edge of the cloth
  ARM._cape = { map: T(cA, true), solid: T(cS, true), normal: T(cN, false) }; return ARM._cape;
};
(function () {
  const C = { kcape: [0xa48660, 0x5a4636, 0.96, 0.3, 0.25, 1], kcapeRed: [0xa83a2e, 0x5a2a22, 0.95, 0.3, 0.25, 1], kcapeGrey: [0x8c8a80, 0x4a4844, 0.96, 0.3, 0.25, 1], kcapeGreen: [0x76825a, 0x40462e, 0.96, 0.3, 0.25, 1], kskirt: [0x6a7078, 0x4a4e58, 0.95, 0.4, 0.25, 0], kskirtRed: [0x8e342c, 0x5a2a22, 0.95, 0.4, 0.25, 0] ,
    margit: [0x8c7e6e, 0x4a443c, 0.97, 0.3, 0.25, 1], rags: [0xa4947e, 0x5a5248, 0.97, 0.3, 0.25, 1], godrick: [0x8a2a20, 0x5a2a22, 0.95, 0.3, 0.25, 1], exile: [0x74463a, 0x4a3028, 0.96, 0.3, 0.25, 1], noble: [0x8a5a44, 0x5a4034, 0.96, 0.3, 0.25, 1],
    white: [0xf0e8d8, 0x8a8478, 0.96, 0.3, 0.25, 1], surRed: [0x9a2a22, 0x5a2a22, 0.95, 0.3, 0.25, 0], surGreen: [0x5a7a48, 0x40462e, 0.95, 0.3, 0.25, 0], redCape: [0x8e2820, 0x5a2a22, 0.95, 0.3, 0.25, 1], blackCape: [0x3a3a40, 0x2e2c32, 0.95, 0.3, 0.25, 1], goldCape: [0xc49a3c, 0x8a7436, 0.9, 0.4, 0.3, 0] };
  const m0 = CLOTH.mat;
  CLOTH.mat = function (key) {
    if (!C[key] || CLOTH.mats[key]) return m0(key);
    const b = m0('cape'), s = C[key], m = b.clone(), Tx = ARM.capeTex(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = b.customProgramCacheKey;
    m.color.set(s[0]); m.sheenColor.set(s[1]); m.roughness = s[2]; m.sheen = s[3]; m.envMapIntensity = s[4]; m.normalMap = Tx.normal; m.normalScale.set(1.2, 1.2);
    if (s[5]) { m.map = Tx.map; m.alphaTest = 0.5; } else m.map = Tx.solid;
    CLOTH.mats[key] = m; return m;
  };
})();
/* the harness. o: { helm: 'armet' | 'sallet' | 'kettle' | 'barbute' | 'none', mat, edge, tassets, mantle, scabbard, plume, light (half harness) } */
ARM.suit = function (T, o) {
  const J = T.J, def = T.def, s = (T.qb && T.qb.s) || 1, A = ARM.begin(T), M = o.mat || 'kplate', E = o.edge || 'kedge', L = 'kleather';
  const add = (bone, mat, g) => A.add(bone, mat, g, [0, 0, 0]), band = (bone, mat, c, ax, up, prof, arc, oo) => add(bone, mat, ARM.band(c, ax, up, prof.map((p) => [p[0] * s, p[1] * s]), arc, oo));
  const sph = (bone, mat, p, r, sc) => { const g = new THREE.SphereGeometry(r * s, 8, 6); if (sc) g.scale(sc[0], sc[1], sc[2]); g.translate(p[0], p[1], p[2]); add(bone, mat, g); };
  const rim = (prof, k) => { const a = prof[prof.length - 1]; return prof.concat([[a[0] + 0.004, a[1] + (k || 0.007)], [a[0] + 0.009, a[1] + (k || 0.007) * 0.5]]); };   // a rolled edge at the open end
  const UP = [0, 1, 0], FW = [0, 0, 1];
  // ---------------------------------------------------------------- helm
  const HO = [0, J.head[1] + 0.091 * s, J.head[2] + 0.02 * s], hk = { ku: 1.1, ks: 0.92 };
  if (o.helm !== 'none') {
    const helm = o.helm || 'armet';
    if (helm === 'kettle') {
      band(4, M, [0, HO[1] + 0.035 * s, HO[2]], UP, FW, [[0, 0.112], [0.035, 0.108], [0.07, 0.09], [0.092, 0.058], [0.102, 0.0]], TAU, hk);
      band(4, M, [0, HO[1] + 0.04 * s, HO[2]], [0, -1, 0], FW, rim([[0, 0.108], [0.012, 0.135], [0.03, 0.172]]), TAU, hk);
      band(4, 'kmail', [0, HO[1] + 0.03 * s, HO[2] - 0.004 * s], [0, -1, 0], FW, [[0, 0.104], [0.08, 0.108], [0.16, 0.112], [0.21, 0.15], [0.25, 0.2]], TAU, Object.assign({ mod: (a) => (Math.abs(a) < 0.62 ? 0.0 : 1) }, hk));
    } else {
      // skull
      band(4, M, [0, HO[1] - 0.1 * s, HO[2]], UP, FW, [[0, 0.096], [0.03, 0.105], [0.075, 0.114], [0.12, 0.115], [0.16, 0.106], [0.195, 0.086], [0.22, 0.056], [0.233, 0.024], [0.237, 0.0]], TAU, Object.assign({ seg: 24 }, hk));
      // the comb along the crown
      { const pts = []; for (let i = 0; i <= 10; i++) { const a = -0.5 + i / 10 * (PI + 0.75); pts.push([0, HO[1] + (0.022 + Math.sin(a) * 0.118) * s, HO[2] + Math.cos(a) * 0.129 * s]); } const g = ARM.tube(pts, 0.0065 * s, { rs: 5 }); add(4, E, g); }
      if (helm === 'armet') {
        // pointed visor, its sights and breaths; bevor under it
        const snout = (a, f) => 1 + 0.2 * Math.pow(Math.max(0, Math.cos(a)), 5) * Math.sin(Math.min(1, f * 1.15) * PI);
        band(4, M, [0, HO[1] - 0.07 * s, HO[2]], UP, FW, [[0, 0.104], [0.03, 0.112], [0.062, 0.119], [0.092, 0.114], [0.118, 0.105], [0.126, 0.11]], 3.3, Object.assign({ mod: snout, seg: 20 }, hk));
        band(4, 'kblack', [0, HO[1] - 0.07 * s, HO[2]], UP, FW, [[0.088, 0.1175], [0.099, 0.1145]], 2.2, Object.assign({ mod: (a) => 1 + 0.2 * Math.pow(Math.max(0, Math.cos(a)), 5) * 0.72, seg: 16 }, hk));
        for (const sd of [1, -1]) for (let i = 0; i < 4; i++) band(4, 'kblack', [0, HO[1] - 0.07 * s, HO[2]], UP, FW, [[0.03, 0.1165], [0.062, 0.1215]], 0.045, Object.assign({ a0: sd * (0.42 + i * 0.13), seg: 1, mod: (a, f) => 1 + 0.2 * Math.pow(Math.max(0, Math.cos(sd * (0.42 + i * 0.13))), 5) * Math.sin((0.25 + f * 0.25) * 1.15 * PI) }, hk));
        band(4, M, [0, HO[1] - 0.135 * s, HO[2]], UP, FW, rim([[0.07, 0.108], [0.04, 0.106], [0.012, 0.096], [0, 0.088]].reverse().map((p) => [p[0], p[1]])), 3.6, Object.assign({ seg: 18 }, hk));
        for (const sd of [1, -1]) sph(4, 'kbrass', [sd * 0.107 * s, HO[1] - 0.012 * s, HO[2] + 0.012 * s], 0.014, [0.5, 1, 1]);
      } else if (helm === 'sallet') {
        // open-faced with a long tail and a fixed brow
        band(4, M, [0, HO[1] - 0.1 * s, HO[2]], [0, -1, 0], [0, 0, -1], rim([[0, 0.097], [0.03, 0.105], [0.06, 0.125]]), 3.4, Object.assign({ seg: 16 }, hk));
        band(4, M, [0, HO[1] - 0.02 * s, HO[2]], UP, FW, [[0, 0.117], [0.03, 0.12], [0.036, 0.126]], 2.6, Object.assign({ seg: 14 }, hk));
        band(4, 'kblack', [0, HO[1] - 0.04 * s, HO[2]], UP, FW, [[0, 0.1185], [0.016, 0.1185]], 1.7, Object.assign({ seg: 10 }, hk));
        band(4, M, [0, HO[1] - 0.14 * s, HO[2] + 0.01 * s], UP, FW, rim([[0, 0.092], [0.035, 0.104], [0.09, 0.11]]), 3.0, Object.assign({ seg: 14 }, hk));
      } else if (helm === 'barbute') {
        band(4, M, [0, HO[1] - 0.1 * s, HO[2]], [0, -1, 0], FW, rim([[0, 0.097], [0.035, 0.102], [0.07, 0.1]]), TAU, Object.assign({ seg: 24, mod: (a) => (Math.abs(a) < 0.42 ? 0 : 1) }, hk));
        add(4, E, ARM.tube([[0, HO[1] + 0.03 * s, HO[2] + 0.128 * s], [0, HO[1] - 0.05 * s, HO[2] + 0.135 * s], [0, HO[1] - 0.1 * s, HO[2] + 0.125 * s]], 0.008 * s, { rs: 4 }));
      }
      // neck lames
      band(4, M, [0, HO[1] - 0.105 * s, HO[2] - 0.006 * s], [0, -1, 0], FW, rim([[0, 0.098], [0.03, 0.1], [0.05, 0.11]]), TAU, Object.assign({ seg: 20 }, hk));
    }
    if (o.plume) { const pts = []; for (let i = 0; i <= 6; i++) { const f = i / 6; pts.push([0, HO[1] + (0.14 + 0.1 * Math.sin(f * 2.2)) * s, HO[2] - (0.03 + f * 0.26) * s]); } const g = ARM.tube(pts, 0.03 * s, { rs: 6 }); add(4, o.plume, g); }
  }
  // ---------------------------------------------------------------- gorget, cuirass, plackart, fauld
  band(3, M, [0, J.neck[1] - 0.012 * s, J.neck[2] + 0.014 * s], UP, FW, rim([[0, 0.097], [0.035, 0.086], [0.055, 0.082]]), TAU, { ku: 0.95, seg: 18 });
  band(2, M, [0, J.neck[1] - 0.075 * s, J.neck[2] + 0.02 * s], UP, FW, [[0, 0.165], [0.025, 0.135], [0.055, 0.108], [0.07, 0.1]], TAU, { ku: 0.82, seg: 20 });
  const keel = (a, f) => 1 + 0.085 * Math.pow(Math.max(0, Math.cos(a)), 9) * Math.sin(Math.min(1, f * 1.3) * PI * 0.8);
  band(2, M, [0, J.spine[1] + 0.07 * s, J.chest[2] + 0.004 * s], UP, FW, [[-0.012, 0.171], [0, 0.163], [0.05, 0.176], [0.12, 0.19], [0.19, 0.188], [0.245, 0.168], [0.29, 0.132], [0.325, 0.1]], TAU, { ku: 0.8, seg: 24, mod: keel, uv: 2 });
  band(1, M, [0, J.spine[1] - 0.045 * s, J.spine[2] + 0.004 * s], UP, FW, rim([[0, 0.172], [0.03, 0.163], [0.1, 0.166], [0.14, 0.176]], 0.006), TAU, { ku: 0.8, seg: 22, mod: (a, f) => 1 + 0.05 * Math.pow(Math.max(0, Math.cos(a)), 9) });
  band(1, L, [0, J.spine[1] - 0.03 * s, J.spine[2] + 0.004 * s], UP, FW, [[0, 0.178], [0.034, 0.178]], TAU, { ku: 0.8, seg: 22 });
  { const g = KIT.chamferGeo(0.026 * s, 0.022 * s, 0.006 * s, 0.003 * s); g.translate(0.01 * s, J.spine[1] - 0.013 * s, J.spine[2] + 0.004 * s + 0.146 * s); add(1, 'kbrass', g); }
  band(0, 'kmail', [0, J.spine[1] - 0.05 * s, J.pelvis[2] + 0.02 * s], [0, -1, 0], FW, [[0, 0.168], [0.1, 0.2], [0.2, 0.214], [0.27, 0.218]], TAU, { ku: 0.8, seg: 22 });
  for (let i = 0; i < 3; i++) band(0, M, [0, J.spine[1] - (0.048 + i * 0.043) * s, J.pelvis[2] + 0.02 * s], [0, -1, 0], FW, rim([[0, 0.168 + i * 0.012], [0.045, 0.181 + i * 0.012]], 0.006), TAU, { ku: 0.8, seg: 22 });
  // ---------------------------------------------------------------- arms
  for (const sd of [1, -1]) {
    const mx = (v) => [v[0] * sd, v[1], v[2]], S = mx(J.shoulder), El = mx(J.elbow), Wr = mx(J.wrist), Fi = mx(J.fist), ax = [sd, 0, 0], cl = sd > 0 ? 5 : 9, ua = sd > 0 ? 6 : 10, fa = sd > 0 ? 7 : 11, hd = sd > 0 ? 8 : 12;
    const at = (p, t, dy, dz) => [p[0] + sd * t * s, p[1] + (dy || 0) * s, p[2] + (dz || 0) * s];
    // pauldron: the cop rides the collar bone, three lames ride the arm
    band(cl, M, at(S, -0.075, 0.012), ax, UP, rim([[0, 0.05], [0.02, 0.084], [0.06, 0.102], [0.11, 0.108], [0.146, 0.104]]), 3.9, { ku: 0.86, ks: 1.16, seg: 16 });
    add(cl, E, ARM.tube([at(S, -0.05, 0.085, -0.02), at(S, -0.06, 0.12, 0.0), at(S, -0.045, 0.092, 0.04)].map((p) => p), 0.006 * s, { rs: 4 }));
    for (let i = 0; i < 3; i++) band(ua, M, at(S, 0.066 + i * 0.04, -0.002), ax, UP, rim([[0, 0.086 - i * 0.007], [0.046, 0.08 - i * 0.007]]), 4.0 - i * 0.2, { ku: 0.94, ks: 1.1, seg: 14 });
    band(ua, M, at(S, 0.125), ax, UP, rim([[0, 0.061], [0.05, 0.058], [0.1, 0.056]], 0.005), TAU, { seg: 14 });
    band(ua, 'kmail', at(S, 0.02), ax, UP, [[0, 0.064], [0.2, 0.055], [0.25, 0.055]], TAU, { seg: 12 });
    // couter with its wing, vambrace, gauntlet
    band(fa, M, at(El, -0.05), ax, UP, [[0, 0.057], [0.02, 0.066], [0.05, 0.073], [0.08, 0.066], [0.1, 0.056]], TAU, { seg: 14, mod: (a) => 1 + 0.16 * Math.pow(Math.max(0, Math.cos(a)), 3) });
    { const g = new THREE.SphereGeometry(0.048 * s, 10, 6, 0, TAU, 0, HALF); g.scale(1, 0.32, 1.2); g.rotateX(sd * -HALF); g.translate(El[0], El[1] - 0.012 * s, El[2] + sd * 0.0 + 0.058 * s); add(fa, M, g); }
    band(fa, M, at(El, 0.055), ax, UP, [[0, 0.058], [0.035, 0.055], [0.13, 0.047], [0.165, 0.045]], TAU, { seg: 14, ks: 0.94, mod: (a) => 1 + 0.05 * Math.pow(Math.max(0, Math.cos(a)), 8) });
    for (const t of [0.085, 0.15]) band(fa, L, at(El, t), ax, UP, [[0, 0.058 - t * 0.07], [0.016, 0.0575 - t * 0.07]], TAU, { seg: 12, ks: 0.94 });
    band(fa, M, at(Wr, -0.085), ax, UP, [[0.0, 0.066], [0.004, 0.061], [0.03, 0.056], [0.085, 0.047]], TAU, { seg: 14 });
    band(hd, M, at(Wr, -0.004), ax, UP, [[0, 0.047], [0.03, 0.051], [0.062, 0.049], [0.088, 0.042]], 3.7, { seg: 12, ks: 1.05 });
    sph(hd, M, [(Wr[0] + Fi[0] * 2) / 3, (Wr[1] + Fi[1] * 2) / 3, (Wr[2] + Fi[2] * 2) / 3 + 0.004 * s], 0.045, [0.9, 1.0, 1.02]);
    for (let i = 0; i < 3; i++) band(hd, E, at(Wr, 0.05 + i * 0.016), ax, UP, [[0, 0.0505 - i * 0.003], [0.004, 0.052 - i * 0.003]], 3.2, { seg: 8, ks: 1.05 });
  }
  // ---------------------------------------------------------------- legs
  if (!o.light) for (const sd of [1, -1]) {
    const mx = (v) => [v[0] * sd, v[1], v[2]], Hp = mx(J.hip), Kn = mx(J.knee), An = mx(J.ankle), To = mx(J.toe), th = sd > 0 ? 13 : 16, sn = sd > 0 ? 14 : 17, ft = sd > 0 ? 15 : 18, DN = [0, -1, 0];
    // tassets hanging from the fauld, cuisses, poleyns with a fan plate
    if (o.tassets !== false) { const up = [sd * 0.5, 0, 1]; band(th, M, [Hp[0] + sd * 0.012 * s, Hp[1] - 0.045 * s, Hp[2] + 0.012 * s], DN, up, [[0, 0.122], [0.075, 0.126], [0.08, 0.134]], 2.1, { seg: 10 }); band(th, M, [Hp[0] + sd * 0.012 * s, Hp[1] - 0.115 * s, Hp[2] + 0.012 * s], DN, up, rim([[0, 0.127], [0.1, 0.122], [0.13, 0.108]], 0.006), 1.95, { seg: 10 }); }
    band(th, M, [Hp[0], Hp[1] - 0.16 * s, Hp[2]], DN, FW, rim([[0, 0.104], [0.1, 0.097], [0.2, 0.086]], 0.005), 4.6, { seg: 16, mod: (a) => 1 + 0.05 * Math.pow(Math.max(0, Math.cos(a)), 8) });
    band(th, 'kmail', [Hp[0], Hp[1] - 0.02 * s, Hp[2]], DN, FW, [[0, 0.104], [0.3, 0.078], [0.4, 0.07]], TAU, { seg: 12 });
    band(sn, M, [Kn[0], Kn[1] + 0.065 * s, Kn[2] + 0.004 * s], DN, FW, [[0, 0.078], [0.03, 0.088], [0.062, 0.096], [0.094, 0.088], [0.125, 0.076]], 4.4, { seg: 14, mod: (a) => 1 + 0.13 * Math.pow(Math.max(0, Math.cos(a)), 4) });
    { const g = new THREE.SphereGeometry(0.047 * s, 10, 6, 0, TAU, 0, HALF); g.scale(1.25, 0.3, 1); g.rotateZ(sd * -HALF); g.translate(Kn[0] + sd * 0.082 * s, Kn[1], Kn[2] + 0.004 * s); add(sn, M, g); }
    for (let i = 0; i < 2; i++) band(sn, E, [Kn[0], Kn[1] - (0.066 + i * 0.022) * s, Kn[2] + 0.004 * s], DN, FW, [[0, 0.08 - i * 0.004], [0.02, 0.078 - i * 0.004]], 4.2, { seg: 12 });
    // greave (shin ridge, calf swell), sabaton of four lames and a toe cap
    const d = V.norm(V.sub(An, Kn)), gu = ARM.perp(d, FW);
    band(sn, M, [Kn[0] + d[0] * 0.1 * s, Kn[1] + d[1] * 0.1 * s, Kn[2] + d[2] * 0.1 * s], d, gu, rim([[0, 0.078], [0.06, 0.08], [0.16, 0.073], [0.27, 0.061], [0.315, 0.059]], 0.006), TAU, { seg: 16, mod: (a, f) => 1 + 0.06 * Math.pow(Math.max(0, Math.cos(a)), 10) + 0.1 * Math.pow(Math.max(0, -Math.cos(a)), 2) * Math.sin(Math.min(1, f * 1.6) * PI) });
    const fd = V.norm(V.sub(To, An)), fu = ARM.perp(fd, UP), F0 = [An[0], An[1] - 0.012 * s, An[2] + 0.01 * s];
    for (let i = 0; i < 4; i++) band(ft, M, [F0[0] + fd[0] * (0.012 + i * 0.03) * s, F0[1] + fd[1] * (0.012 + i * 0.03) * s, F0[2] + fd[2] * (0.012 + i * 0.03) * s], fd, fu, rim([[0, 0.066 - i * 0.004], [0.034, 0.062 - i * 0.004]], 0.004), 4.2, { seg: 10, ks: 0.95 });
    band(ft, M, [F0[0] + fd[0] * 0.13 * s, F0[1] + fd[1] * 0.13 * s, F0[2] + fd[2] * 0.13 * s], fd, fu, [[0, 0.054], [0.025, 0.05], [0.05, 0.034], [0.064, 0.0]], 4.2, { seg: 10, ks: 0.95 });
    band(ft, M, [An[0], 0.012 * s, An[2] - 0.004 * s], UP, [0, 0, -1], rim([[0, 0.06], [0.07, 0.058], [0.1, 0.062]], 0.004), 3.8, { seg: 10 });
    { const g = KIT.chamferGeo(0.056 * s, 0.012 * s, 0.135 * s, 0.006 * s); g.translate((An[0] + To[0]) / 2, 0.012 * s, (An[2] + To[2]) / 2 + 0.008 * s); add(ft, 'kblack', g); }
  }
  // ---------------------------------------------------------------- mantle, scabbard, pouch
  if (o.mantle) { const mm = o.mantle === true ? 'kmantle' : o.mantle, fold = (k) => (a, f) => 1 + (0.07 * Math.sin(a * 11 + k) + 0.05 * Math.sin(a * 23 + k * 2)) * (0.3 + f);
    band(2, mm, [0, J.neck[1] + 0.035 * s, J.neck[2] - 0.004 * s], [0, -1, 0], [0, 0, -1], [[0, 0.094], [0.02, 0.125], [0.05, 0.172], [0.09, 0.212], [0.13, 0.236], [0.165, 0.228], [0.18, 0.2]], 5.3, { ku: 0.78, seg: 34, mod: fold(0), uv: 1 });
    band(2, mm, [0, J.neck[1] + 0.075 * s, J.neck[2] - 0.006 * s], [0, -1, 0], [0, 0, -1], [[0, 0.092], [0.015, 0.122], [0.04, 0.135], [0.07, 0.124], [0.085, 0.1]], TAU, { ku: 0.9, seg: 34, mod: fold(2) }); }
  if (o.scabbard) { const p0 = [0.165 * s, J.pelvis[1] + 0.07 * s, J.pelvis[2] + 0.0], dir = V.norm([0.1, -0.93, -0.34]), up = ARM.perp(dir, [1, 0, 0]);
    band(0, L, p0, dir, up, [[0, 0.024], [0.3, 0.022], [0.6, 0.015], [0.66, 0.0]], TAU, { seg: 8, ks: 0.5 }); band(0, 'kbrass', p0, dir, up, [[0, 0.026], [0.05, 0.0255]], TAU, { seg: 8, ks: 0.52 }); band(0, 'kbrass', [p0[0] + dir[0] * 0.59 * s, p0[1] + dir[1] * 0.59 * s, p0[2] + dir[2] * 0.59 * s], dir, up, [[0, 0.0165], [0.05, 0.012], [0.075, 0.0]], TAU, { seg: 8, ks: 0.52 });
    { const g = KIT.chamferGeo(0.05 * s, 0.045 * s, 0.03 * s, 0.01 * s); g.translate(-0.13 * s, J.pelvis[1] + 0.06 * s, J.pelvis[2] - 0.115 * s); add(0, L, g); } }
  A.end('harness');
};
/* cloth over unarmoured folk: a mantle on the shoulders, a hood, bindings on forearm and shin */
ARM.rags = function (T, o) {
  const J = T.J, s = (T.qb && T.qb.s) || 1, A = ARM.begin(T), mm = o.rags, add = (bone, g) => A.add(bone, mm, g, [0, 0, 0]), band = (bone, c, ax, up, prof, arc, oo) => add(bone, ARM.band(c, ax, up, prof.map((p) => [p[0] * s, p[1] * s]), arc, oo));
  const HO = [0, J.head[1] + 0.091 * s, J.head[2] + 0.02 * s];
  if (o.mantle !== false) { band(2, [0, J.neck[1] + 0.03 * s, J.neck[2] - 0.002 * s], [0, -1, 0], [0, 0, -1], [[0, 0.092], [0.02, 0.118], [0.05, 0.175], [0.085, 0.235], [0.12, 0.262], [0.19, 0.275]], o.cowl ? TAU : 4.9, { ku: 0.74, seg: 22, mod: (a, f) => 1 + 0.05 * Math.sin(a * 9) * f });
    band(2, [0, J.neck[1] + 0.065 * s, J.neck[2] - 0.004 * s], [0, -1, 0], [0, 0, -1], [[0, 0.1], [0.02, 0.118], [0.045, 0.118], [0.06, 0.1]], TAU, { ku: 0.86, seg: 20, mod: (a) => 1 + 0.06 * Math.sin(a * 5 + 1) }); }
  if (o.cowl) band(4, [0, HO[1] - 0.15 * s, HO[2] - 0.012 * s], [0, 1, 0], [0, 0, -1], [[0, 0.15], [0.08, 0.142], [0.17, 0.138], [0.25, 0.122], [0.3, 0.088], [0.325, 0.03], [0.33, 0.0]], 4.75, { ku: 1.12, seg: 20, mod: (a, f) => 1 + 0.03 * Math.sin(a * 7 + f * 5) });
  if (o.wraps) for (const sd of [1, -1]) { const mx = (v) => [v[0] * sd, v[1], v[2]], El = mx(J.elbow), Kn = mx(J.knee), An = mx(J.ankle), fa = sd > 0 ? 7 : 11, sn = sd > 0 ? 14 : 17, d = V.norm(V.sub(An, Kn));
    for (let i = 0; i < 4; i++) band(fa, [El[0] + sd * (0.07 + i * 0.045) * s, El[1], El[2]], [sd, 0, 0], [0, 1, 0], [[0, 0.056 - i * 0.003], [0.04, 0.053 - i * 0.003]], TAU, { seg: 10, mod: (a) => 1 + 0.04 * Math.sin(a * 3 + i) });
    for (let i = 0; i < 4; i++) band(sn, [Kn[0] + d[0] * (0.2 + i * 0.05) * s, Kn[1] + d[1] * (0.2 + i * 0.05) * s, Kn[2] + d[2] * (0.2 + i * 0.05) * s], d, ARM.perp(d, [0, 0, 1]), [[0, 0.07 - i * 0.004], [0.045, 0.066 - i * 0.004]], TAU, { seg: 10, mod: (a) => 1 + 0.04 * Math.sin(a * 3 + i * 2) }); }
  A.end('rags');
};
(function () { const k0 = ARM.kit; ARM.kit = function (T, o) { if (o && o.rags) ARM.rags(T, o); if (!(o && o.suit)) return k0(T, o); ARM.suit(T, o); if (o.fur || o.horns || o.wings) k0(T, { fur: o.fur, horns: o.horns }); };
  const n0 = CAST.need; CAST.need = async function (names, progress) { if (typeof AST !== 'undefined') await AST.need(ARM.SETS, ['estoc', 'mace', 'hammer']); return n0(names, progress); }; })();

/* a round shield of dark planks bound in iron: rim, boss, four straps and their rivets. Face toward +Z. */
WPN.roundShield = function (R0) {
  R0 = R0 || 0.31; const g = new THREE.Group(), add = (geo, kind) => { const me = new THREE.Mesh(geo, ARM.mat(kind)); me.castShadow = true; g.add(me); return me; };
  const dome = (r) => 0.05 * (1 - (r / R0) * (r / R0));
  const disc = (z0, flip) => { const P = [], U = [], I = [], NR = 6, NS = 28; for (let j = 0; j <= NR; j++) for (let i = 0; i <= NS; i++) { const r = R0 * j / NR, a = i / NS * TAU; P.push(Math.cos(a) * r, Math.sin(a) * r, dome(r) + z0); U.push(Math.cos(a) * r / 0.5 + 0.5, Math.sin(a) * r / 0.5 + 0.5); }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + 1, c = a + NS + 1, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); }
    const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); q.setIndex(I); q.computeVertexNormals(); return q; };
  add(disc(0, false), 'kwood'); add(disc(-0.012, true), 'kleather');
  add(new THREE.TorusGeometry(R0, 0.013, 6, 32), 'kdark');
  { const b = new THREE.SphereGeometry(0.078, 16, 8, 0, TAU, 0, HALF * 0.95); b.rotateX(HALF); b.translate(0, 0, 0.036); add(b, 'kplate'); add(new THREE.TorusGeometry(0.086, 0.009, 5, 20).translate(0, 0, 0.046), 'kdark'); }
  const bars = [], riv = [];
  for (let k = 0; k < 4; k++) { const a = k * HALF + 0.4; for (let i = 0; i < 5; i++) { const r0 = 0.09 + i * (R0 - 0.1) / 5, r1 = 0.09 + (i + 1) * (R0 - 0.1) / 5, rm = (r0 + r1) / 2, q = new THREE.BoxGeometry(r1 - r0 + 0.004, 0.03, 0.006); q.rotateY(Math.atan2(dome(r1) - dome(r0), r1 - r0) * -1); q.translate(rm, 0, dome(rm) + 0.004); q.rotateZ(a); bars.push(q); }
    for (const r of [0.14, 0.22, R0 - 0.03]) { const q = new THREE.SphereGeometry(0.009, 6, 4); q.translate(Math.cos(a) * r, Math.sin(a) * r, dome(r) + 0.01); riv.push(q); } }
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, q = new THREE.SphereGeometry(0.007, 5, 4); q.translate(Math.cos(a) * (R0 - 0.022), Math.sin(a) * (R0 - 0.022), dome(R0 - 0.022) + 0.006); riv.push(q); }
  add(ARM.merge(bars), 'kdark'); add(ARM.merge(riv), 'kedge');
  return g;
};
(function () { const s0 = WPN.shield; WPN.shield = function (kind, col, col2) { return kind === 'round' ? WPN.roundShield(0.28) : s0(kind, col, col2); }; })();
/* the hero's shield hangs on the outside of the left forearm */
WPN.strapSide = function (s) { s.position.set(0.11, 0.072, 0.0); s.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(0, 0, -1), V3(-1, 0, 0), V3(0, 1, 0))); return s; };
/* the hero's longsword: the scanned estoc (Poly Haven CC0), set on the same grip frame as the forged ones */
(function () { const k0 = WPN.KINDS.longsword; WPN.KINDS.longsword = function () {
  if (!(typeof AST !== 'undefined' && AST.sets.antique_estoc)) return k0();
  const g = new THREE.Group(), me = new THREE.Mesh(AST.geometry('estoc'), AST.material('estoc', { metal: 1, env: 0.9, rough: 0.9 })); me.scale.set(1.25, 0.93, 1.25); me.position.y = 0.025; me.castShadow = true; g.add(me);
  g.userData = { ends: [0.17], grips: [-0.03, 0.05], len: 0.24, blade: 0.98, steel: true }; return g; }; })();
