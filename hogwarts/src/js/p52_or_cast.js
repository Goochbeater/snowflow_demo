/* ==== p52_or_cast.js ==== */
/* OPUS RING — the cast. Modelled bodies and outfits (Quaternius, regraded) under forged plate: helms, cuirasses,
   pauldrons, vambraces, greaves are rigid pieces riding the bones; capes and surcoats are verlet cloth. Giants are the
   same templates on a scaled instance (Actor option `scale`). */
const ARM = {};
ARM.mat = function (kind) {
  ARM._m = ARM._m || {}; if (ARM._m[kind]) return ARM._m[kind];
  const st = TEX.sets.steel, D = { steel: [0x9aa1ab, 0.44, 1.1], worn: [0x7d8086, 0.5, 0.95], aged: [0x7a7872, 0.56, 0.85], dark: [0x3c3e44, 0.5, 0.9], black: [0x24262b, 0.46, 0.85], gold: [0xc8983a, 0.36, 1.25], brass: [0x9a7a3a, 0.45, 1.0], mail: [0x54565c, 0.62, 0.7], bone: [0xcfc6ae, 0.7, 0.3], horn: [0x4a3e34, 0.6, 0.4], fur: [0x4a4038, 1.0, 0.1], white: [0xe4e0d6, 0.55, 0.4], flesh: [0x857466, 0.7, 0.25] }[kind] || [0x888888, 0.5, 1];
  const metal = !['bone', 'horn', 'fur', 'white', 'flesh'].includes(kind);
  const m = new THREE.MeshStandardMaterial({ color: D[0], metalness: metal ? 1 : 0, roughness: metal ? Math.min(1, D[1] * 2.2) : D[1], roughnessMap: metal && st ? st.roughnessMap : null, normalMap: kind === 'fur' && st ? st.normalMap : null, envMapIntensity: D[2] * (metal ? 0.9 : 1) });
  if (st && kind === 'fur') m.normalScale.set(2.5, 2.5);
  m.onBeforeCompile = (sh) => { sh.uniforms.uFill = CM.fillU; CM.rimHook(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFill;').replace('#include <aomap_fragment>', '#include <aomap_fragment>\n' + CM.FILL); };
  m.customProgramCacheKey = () => 'orarm';
  ARM._m[kind] = m; return m;
};
ARM.merge = function (list) {   // geometries -> one non-indexed geometry (position, normal, uv)
  const P = [], N = [], U = [];
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0; if (!g.attributes.normal) g.computeVertexNormals(); const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv ? g.attributes.uv.array : null;
    for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); } for (let i = 0; i < p.length / 3; i++) { U.push(u ? u[i * 2] : 0, u ? u[i * 2 + 1] : 0); } }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); out.computeBoundingSphere(); return out;
};
/* collects pieces per (bone, material) in rest space, then merges them into one attachment each */
ARM.begin = function (T) {
  const B = new Map(), def = T.def;
  const add = (bone, mat, geo, pos, rot, scl) => {
    if (scl) geo.scale(scl[0], scl[1], scl[2]);
    if (rot) geo.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])));
    const h = def[bone].head; geo.translate(pos[0] - h[0], pos[1] - h[1], pos[2] - h[2]);
    const k = bone + '|' + mat; if (!B.has(k)) B.set(k, { bone, mat, list: [] }); B.get(k).list.push(geo);
  };
  const end = (name) => { for (const b of B.values()) T.attach.push({ bone: b.bone, geo: ARM.merge(b.list), mat: ARM.mat(b.mat), pos: [0, 0, 0], name: name || 'armor', shadow: true }); };
  return { add, end };
};
ARM.limb = function (def, bi, r0, r1, f0, f1, seg) {   // tapered tube along part of a bone (rest space, absolute)
  const b = def[bi], a = V.lerp(b.head, b.tail, f0 || 0), c = V.lerp(b.head, b.tail, f1 === undefined ? 1 : f1), L = V.len(V.sub(c, a));
  const g = new THREE.CylinderGeometry(r1, r0, L, seg || 12, 1, true); g.translate(0, L / 2, 0);
  const d = V.norm(V.sub(c, a)); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YUP, V3(d[0], d[1], d[2]))); g.translate(a[0], a[1], a[2]); return g;
};
ARM.kit = function (T, o) {
  const J = T.J, def = T.def, s = (T.qb && T.qb.s) || 1, A = ARM.begin(T), mx = V.mx, M = o.mat || 'steel', TR = o.trim || M;
  const HO = [0, J.head[1] + 0.091 * s, J.head[2] + 0.022 * s];
  const lathe = (prof, seg, ps, pl, zs) => { if (prof[0][1] > prof[prof.length - 1][1]) prof = prof.slice().reverse(); const g = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(Math.max(1e-4, p[0] * s), p[1] * s)), seg || 20, ps || 0, pl === undefined ? TAU : pl); if (zs) g.scale(1, 1, zs); g.computeVertexNormals(); return g; };
  // ---------------- helms
  if (o.helm === 'great' || o.helm === 'sallet') {
    const pt = o.helm === 'sallet';
    A.add(4, M, lathe(pt ? [[0.0, 0.178], [0.04, 0.17], [0.085, 0.14], [0.112, 0.095], [0.121, 0.04], [0.123, -0.03], [0.128, -0.085], [0.15, -0.115], [0.118, -0.1]]
      : [[0.0, 0.165], [0.05, 0.158], [0.09, 0.136], [0.113, 0.095], [0.121, 0.04], [0.121, -0.06], [0.127, -0.125], [0.142, -0.165], [0.11, -0.16]], 22), HO);
    const slit = new THREE.TorusGeometry(0.1215 * s, 0.0065 * s, 4, 14, 2.0); slit.rotateX(HALF); slit.rotateY(1.0 - HALF);
    A.add(4, 'black', slit, [HO[0], HO[1] + 0.018 * s, HO[2]]);
    if (!pt) { const br = new THREE.TorusGeometry(0.122 * s, 0.006 * s, 4, 22); br.rotateX(HALF); A.add(4, TR, br, [HO[0], HO[1] + 0.05 * s, HO[2]]);
      A.add(4, TR, new THREE.BoxGeometry(0.012 * s, 0.2 * s, 0.01 * s), [0, HO[1] - 0.045 * s, HO[2] + 0.121 * s]); }
    else { A.add(4, M, new THREE.ConeGeometry(0.06 * s, 0.14 * s, 4), [0, HO[1] - 0.06 * s, HO[2] + 0.115 * s], [1.2, PI / 4, 0], [1, 1, 0.6]); }   // beaked bevor
    if (o.plume) { const pl = new THREE.CapsuleGeometry(0.03 * s, 0.26 * s, 4, 8); A.add(4, o.plume, pl, [0, HO[1] + 0.15 * s, HO[2] - 0.13 * s], [1.05, 0, 0], [0.7, 1, 1.5]); A.add(4, TR, new THREE.CylinderGeometry(0.015 * s, 0.022 * s, 0.07 * s, 8), [0, HO[1] + 0.185 * s, HO[2] - 0.02 * s]); }
    if (o.crest) { const cr = new THREE.TorusGeometry(0.118 * s, 0.007 * s, 4, 14, PI * 0.72); cr.rotateY(HALF); A.add(4, TR, cr, [0, HO[1] + 0.045 * s, HO[2] - 0.004 * s], [-0.5, 0, 0]); }
    if (o.wings) for (const sd of [1, -1]) { const w = new THREE.ConeGeometry(0.03 * s, 0.24 * s, 4); A.add(4, TR, w, [sd * 0.135 * s, HO[1] + 0.12 * s, HO[2] - 0.04 * s], [-0.5, 0, -sd * 0.45], [1, 1, 0.3]); }
  } else if (o.helm === 'kettle') {
    const dome = new THREE.SphereGeometry(0.114 * s, 18, 8, 0, TAU, 0, HALF); A.add(4, M, dome, [HO[0], HO[1] + 0.075 * s, HO[2] - 0.012 * s], [-0.1, 0, 0], [1, 0.92, 1.08]);
    A.add(4, M, lathe([[0.108, 0.045], [0.172, 0.012], [0.178, 0.004]], 22), [HO[0], HO[1] + 0.035 * s, HO[2] - 0.012 * s], [-0.1, 0, 0]);
    A.add(4, M, lathe([[0.178, 0.004], [0.112, 0.03]], 22), [HO[0], HO[1] + 0.035 * s, HO[2] - 0.012 * s], [-0.1, 0, 0]);
    A.add(4, 'mail', lathe([[0.098, 0.1], [0.11, 0.02], [0.107, -0.09], [0.125, -0.16], [0.17, -0.215]], 18, 0.62, TAU - 1.24), [HO[0], HO[1], HO[2] - 0.012 * s]);
  } else if (o.helm === 'crown') {
    const band = new THREE.CylinderGeometry(0.1 * s, 0.096 * s, 0.035 * s, 18, 1, true); A.add(4, 'gold', band, [HO[0], HO[1] + 0.085 * s, HO[2] - 0.01 * s], [-0.12, 0, 0]);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, big = i % 3 === 0; A.add(4, 'gold', new THREE.ConeGeometry(0.014 * s, (big ? 0.085 : 0.05) * s, 4), [Math.sin(a) * 0.098 * s, HO[1] + (big ? 0.14 : 0.12) * s + Math.cos(a) * 0.012 * s, HO[2] - 0.01 * s + Math.cos(a) * 0.098 * s]); }
  }
  if (o.horns) {   // Omen horns: a ragged crown of curved, broken growths
    const rs = mulberry(o.horns);
    for (let i = 0; i < 11; i++) { const a = (rs() - 0.5) * 4.4, el = 0.2 + rs() * 0.9, L = (0.1 + rs() * 0.24) * s, r = (0.016 + rs() * 0.02) * s;
      const dir = [Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el) * 0.9 - 0.15];
      const g = new THREE.ConeGeometry(r, L, 6, 3), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k) / L + 0.5; p.setX(k, p.getX(k) + yy * yy * L * 0.35); } g.computeVertexNormals();
      g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YUP, V3(dir[0], dir[1], dir[2]).normalize()));
      A.add(4, 'horn', g, [HO[0] + dir[0] * 0.085 * s, HO[1] + 0.02 * s + dir[1] * 0.1 * s, HO[2] - 0.01 * s + dir[2] * 0.09 * s]); }
  }
  if (o.mask) { const g = new THREE.SphereGeometry(0.1 * s, 16, 12, 0, TAU, 0, PI); A.add(4, 'white', g, [0, HO[1] - 0.005 * s, HO[2]], null, [0.88, 1.16, 1.0]);
    for (const sd of [1, -1]) A.add(4, 'black', new THREE.SphereGeometry(0.013 * s, 8, 6), [sd * 0.033 * s, HO[1] + 0.02 * s, HO[2] + 0.096 * s], null, [1.5, 0.6, 0.5]); }
  if (o.beast) {   // beastman head: long muzzle, ears, mane
    A.add(4, 'fur', new THREE.SphereGeometry(0.118 * s, 14, 10), HO, null, [1, 1.05, 1.1]);
    A.add(4, 'fur', new THREE.ConeGeometry(0.075 * s, 0.22 * s, 8), [0, HO[1] - 0.03 * s, HO[2] + 0.17 * s], [HALF + 0.15, 0, 0], [1, 1, 0.8]);
    A.add(4, 'black', new THREE.SphereGeometry(0.022 * s, 8, 6), [0, HO[1] - 0.055 * s, HO[2] + 0.275 * s]);
    for (const sd of [1, -1]) { A.add(4, 'fur', new THREE.ConeGeometry(0.035 * s, 0.13 * s, 5), [sd * 0.085 * s, HO[1] + 0.13 * s, HO[2] - 0.03 * s], [-0.3, 0, -sd * 0.4]); A.add(4, 'gold', new THREE.SphereGeometry(0.012 * s, 6, 5), [sd * 0.045 * s, HO[1] + 0.03 * s, HO[2] + 0.1 * s]); }
    for (let i = 0; i < 7; i++) A.add(3, 'fur', new THREE.ConeGeometry(0.05 * s, 0.2 * s, 5), [(i - 3) * 0.035 * s, HO[1] - 0.05 * s - Math.abs(i - 3) * 0.02 * s, HO[2] - 0.12 * s], [-2.3, 0, (i - 3) * 0.15]);
  }
  // ---------------- body plate
  const full = o.plate === 'full', half = o.plate === 'half' || full;
  if (half) {
    const wy = J.spine[1] + 0.035 * s;
    // cuirass: a waisted breast-and-back plate lathed about the spine, oval in section
    A.add(2, M, lathe([[0.152, 0.0], [0.158, 0.05], [0.178, 0.13], [0.192, 0.21], [0.186, 0.275], [0.15, 0.33], [0.1, 0.365], [0.082, 0.372]], 22, 0, TAU, 0.74), [0, wy, J.chest[2] + 0.022 * s]);
    A.add(2, TR, new THREE.TorusGeometry(0.153 * s, 0.009 * s, 5, 22).rotateX(HALF).scale(1, 1, 0.74), [0, wy + 0.004 * s, J.chest[2] + 0.022 * s]);
    A.add(3, M, lathe([[0.125, 0.0], [0.092, 0.05], [0.082, 0.085]], 16), [0, J.neck[1] - 0.03 * s, J.neck[2] + 0.012 * s]);   // gorget
    for (const sd of [1, -1]) { const sh = sd > 0 ? J.shoulder : mx(J.shoulder), b = sd > 0 ? 6 : 10, fa = sd > 0 ? 7 : 11, hd = sd > 0 ? 8 : 12;
      const cap = new THREE.SphereGeometry(0.09 * s, 14, 8, 0, TAU, 0, HALF * 1.05); A.add(b, M, cap, [sh[0] + sd * 0.014 * s, sh[1] + 0.004 * s, sh[2]], [0, 0, -sd * 0.6], [1.05, 0.66, 1.12]);
      const lame = new THREE.SphereGeometry(0.084 * s, 12, 5, 0, TAU, HALF * 0.6, HALF * 0.62); A.add(b, M, lame, [sh[0] + sd * 0.04 * s, sh[1] - 0.03 * s, sh[2]], [0, 0, -sd * 0.8], [1.0, 0.8, 1.08]);
      if (o.trim) { const rim = new THREE.TorusGeometry(0.088 * s, 0.006 * s, 4, 16); rim.rotateX(HALF); A.add(b, TR, rim, [sh[0] + sd * 0.02 * s, sh[1] - 0.004 * s, sh[2]], [0, 0, -sd * 0.6], [1.05, 1, 1.12]); }
      A.add(fa, M, ARM.limb(def, fa, 0.054 * s, 0.044 * s, 0.1, 0.94), [0, 0, 0]);
      const el = sd > 0 ? J.elbow : mx(J.elbow); A.add(fa, M, new THREE.SphereGeometry(0.05 * s, 10, 8), el, null, [1, 1, 1.1]);
      const wr = sd > 0 ? J.wrist : mx(J.wrist), fi = sd > 0 ? J.fist : mx(J.fist);
      A.add(fa, M, ARM.limb(def, fa, 0.046 * s, 0.056 * s, 0.86, 1.02), [0, 0, 0]);                                   // gauntlet cuff
      A.add(hd, M, new THREE.SphereGeometry(0.046 * s, 10, 8), [(wr[0] + fi[0] * 2) / 3, (wr[1] + fi[1] * 2) / 3, (wr[2] + fi[2] * 2) / 3 + 0.004 * s], null, [0.86, 1.05, 1.0]);   // gauntlet over the fist
    }
  }
  if (full) {
    A.add(0, M, lathe([[0.158, 0.075], [0.172, 0.0], [0.196, -0.085]], 20, 0, TAU, 0.8), [0, J.pelvis[1] + 0.02 * s, J.pelvis[2] + 0.008 * s]);   // fauld
    for (const sd of [1, -1]) { const th = sd > 0 ? 13 : 16, shn = sd > 0 ? 14 : 17, ft = sd > 0 ? 15 : 18, kn = sd > 0 ? J.knee : mx(J.knee), hp = sd > 0 ? J.hip : mx(J.hip), up = sd > 0 ? 6 : 10;
      A.add(up, M, ARM.limb(def, up, 0.066 * s, 0.056 * s, 0.3, 0.92), [0, 0, 0]);
      A.add(th, M, ARM.limb(def, th, 0.099 * s, 0.077 * s, 0.32, 0.97), [0, 0, 0]);
      A.add(shn, M, new THREE.SphereGeometry(0.066 * s, 10, 8), [kn[0], kn[1], kn[2] + 0.02 * s], null, [1, 1.1, 1.05]);
      A.add(shn, M, ARM.limb(def, shn, 0.07 * s, 0.052 * s, 0.1, 0.97), [0, 0, 0]);
      const an = sd > 0 ? J.ankle : mx(J.ankle), toe = sd > 0 ? J.toe : mx(J.toe);
      A.add(ft, M, KIT.chamferGeo(0.05 * s, 0.036 * s, 0.125 * s, 0.014 * s), [(an[0] + toe[0]) / 2, 0.04 * s, (an[2] + toe[2]) / 2 + 0.005 * s]);
    }
  }
  if (o.fur) {   // a pelt across the shoulders
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 3.6, r = 0.2 * s; A.add(2, 'fur', new THREE.SphereGeometry(0.09 * s, 8, 6), [Math.sin(a) * r, J.shoulder[1] + 0.03 * s - Math.abs(Math.sin(a * 0.5)) * 0.03 * s, J.chest[2] - Math.cos(a) * r * 0.75 - 0.02 * s], [0, a, 0], [1.1, 0.75, 1]); }
  }
  if (o.grafted) {   // Godrick: grafted arms raised from his back and shoulders like a ragged crown, hands spread
    const rs = mulberry(77), skin = 'flesh';
    const seg = (b, p, d, L, r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, L, 9); g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YUP, d)); A.add(b, skin, g, p); return [p[0] + d.x * L, p[1] + d.y * L, p[2] + d.z * L]; };
    const arm = (b, base, d1, bend, k) => { const L1 = 0.31 * s * k, L2 = 0.28 * s * k; A.add(b, skin, new THREE.SphereGeometry(0.062 * s * k, 9, 7), base);
      const e = seg(b, base, d1, L1, 0.058 * s * k, 0.046 * s * k); A.add(b, skin, new THREE.SphereGeometry(0.048 * s * k, 8, 6), e);
      const d2 = d1.clone().add(bend).normalize(), h = seg(b, e, d2, L2, 0.044 * s * k, 0.032 * s * k);
      A.add(b, skin, new THREE.SphereGeometry(0.04 * s * k, 8, 6), h, null, [0.8, 1.2, 1.0]);
      for (let f = 0; f < 4; f++) { const fd = d2.clone().add(V3((f - 1.5) * 0.28, 0.1, (rs() - 0.5) * 0.3)).normalize(); seg(b, h, fd, 0.085 * s * k, 0.012 * s * k, 0.008 * s * k); }
      if (rs() < 0.6) { const t = new THREE.TorusGeometry(0.052 * s * k, 0.011 * s, 5, 10); t.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), d1)); A.add(b, 'gold', t, [base[0] + d1.x * L1 * 0.5, base[1] + d1.y * L1 * 0.5, base[2] + d1.z * L1 * 0.5]); } };
    for (const sd of [1, -1]) {
      for (let i = 0; i < 4; i++) { const up = 0.35 + i * 0.3, out = 0.95 - i * 0.2;
        arm(2, [sd * (0.07 + i * 0.03) * s, J.chest[1] + (0.06 + i * 0.06) * s, J.chest[2] - 0.13 * s], V3(sd * out, up + 0.25, -0.5 + i * 0.08).normalize(), V3(sd * 0.25, 0.75, 0.45), 1.05 - i * 0.07); }
      arm(1, [sd * 0.13 * s, J.spine[1] + 0.1 * s, J.spine[2] - 0.1 * s], V3(sd * 0.9, -0.25, -0.45).normalize(), V3(0, -0.8, 0.5), 0.95);
    }
  }
  A.end();
};
/* worn cloth: a coarse weave, water stains, mud toward the hem, and a hem torn into rags (alpha) */
ARM.tatter = function () {
  if (ARM._tat) return ARM._tat;
  const W = 256, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H), d = im.data, rs = mulberry(77);
  const tears = []; for (let i = 0; i < 9; i++) tears.push([rs(), 0.1 + rs() * 0.26, 0.02 + rs() * 0.05]);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const u = i / W, v = j / H, k = (j * W + i) * 4;
    const weave = 0.93 + 0.07 * Math.sin(i * 2.1) * Math.sin(j * 2.1), fold = 0.9 + 0.1 * fbm2(u * 5 + 2, v * 1.2, 2), stain = 1 - 0.3 * smooth(0.5, 0.8, fbm2(u * 4, v * 6 + 9, 3)), mud = lerp(1, 0.55, smooth(0.6, 1, v + (fbm2(u * 9, 3, 2) - 0.5) * 0.2));
    const b = 255 * weave * fold * stain * mud; d[k] = b; d[k + 1] = b * 0.97; d[k + 2] = b * 0.92;
    let hem = 0.93 - 0.05 * fbm2(u * 22, 1, 2); for (const t of tears) hem = Math.min(hem, 1 - t[1] * Math.max(0, 1 - Math.abs(u - t[0]) / t[2]));
    const hole = fbm2(u * 13 + 4, v * 9, 3) > 0.74 && v > 0.45;
    d[k + 3] = (v > hem || hole) ? 0 : 255; }
  x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ARM._tat = t; return t;
};
/* ------------------------------------------------------------------ cloth colours */
(function () {
  const C = { tarnCape: [0x94805e, 0x8a7a5c, 0.95, 0.35, 0.3, 1], redCape: [0x4a0c0a, 0x6a2620, 0.9, 0.6, 0.4], goldCape: [0x8a6a1e, 0xd8b04a, 0.8], surRed: [0x4a0e0b, 0x6a2a24, 0.9, 0.6, 0.4], surGreen: [0x2f4a22, 0x6a8a4a, 0.88], exile: [0x3a1a14, 0x6a3a30, 0.9],
    margit: [0x5a5046, 0x6a6052, 0.95, 0.6, 0.3, 1], godrick: [0x47100d, 0x7a4026, 0.88, 0.7, 0.4], rags: [0x7a6e5c, 0x8a7e6c, 0.95, 1, 0.8, 1], noble: [0x4a2a20, 0x8a6048, 0.9], white: [0xb8b0a0, 0xe8e0d0, 0.9], blackCape: [0x131316, 0x2e2c32, 0.84, 0.55, 0.3] };
  const m0 = CLOTH.mat;
  CLOTH.mat = function (key) {
    if (!C[key] || CLOTH.mats[key]) return m0(key);
    const b = m0('cape'), s = C[key], m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = b.customProgramCacheKey;
    m.color.set(s[0]); m.sheenColor.set(s[1]); m.roughness = s[2]; m.sheen = s[3] !== undefined ? s[3] : 1; m.envMapIntensity = s[4] !== undefined ? s[4] : 0.8; if (s[5]) { m.map = ARM.tatter(); m.alphaTest = 0.5; } CLOTH.mats[key] = m; return m;
  };
})();
ARM.cape = (J, o) => CLOTH.arcPanel(Object.assign({ y: J.shoulder[1] - 0.015, rx: 0.235, rz: 0.165, cz: -0.02, a0: 68, a1: 292, len: 1.12, rows: 11, cols: 13, flare: 0.45, name: 'cape', mat: 'tarnCape', bone: 2, stiff: 0.8, carry: 0.85, damp: 0.9, grav: 1.8 }, o || {}));
ARM.cloth = (skirt, cape) => (J) => { const P = skirt ? CAST.skirt(J, skirt).panels : []; if (cape) P.push(ARM.cape(J, cape)); return { panels: P }; };
/* ------------------------------------------------------------------ the roster */
(function () {
  const R_ = (part, g, po) => ['ranger', part, g, po], P_ = (part, g, po) => ['peasant', part, g, po];
  const g = (rules, sat, val, tint) => ({ rules, sat, val, tint });
  const hue = (h, s, v) => ({ h: 115, w: 80, toH: h, s, v, minS: 0.03 }), lea = (v, s) => ({ h: 28, w: 45, s: s === undefined ? 1 : s, v }), cream = (s, v, toH) => ({ h: 38, w: 30, s, v, toH, minS: 0.02 });
  const MATTE = { metal: 0.15, ns: 0.8, env: 0.4 };
  const ranger = (cloth, leather, legs, boots, x) => [R_('Body', cloth, MATTE), R_('Arms', cloth, MATTE), R_('Legs', legs, MATTE), R_('Feet_Boots', boots, MATTE), R_('Body_Belt_1', leather, { metal: 0.5, env: 0.5 })].concat(x || []);
  const peasant = (body, legs, boots) => [P_('Body', body), P_('Arms', body), P_('Legs', legs), P_('Feet', boots || legs)];
  const S = (name, o) => { CAST.SPECS[name] = Object.assign({ name, height: 1, head: false, skin: { tone: 0xc09070 }, mats: () => [] }, o.spec || {}); CAST.QC[name] = Object.assign({ hair: [] }, o.qc || {}); CAST.QO[name] = o.qo; if (o.kit) ARM.KITS[name] = o.kit; };
  ARM.KITS = {};
  const gambeson = g([hue(28, 0.25, 0.42), lea(0.5, 0.6)], 0.7, 0.9), darkLea = g([lea(0.45, 0.6)], 0.7, 0.8), darkLeg = g([hue(28, 0.2, 0.32)], 0.5, 0.8), boot = g([], 0.4, 0.4);
  // the Tarnished: a wandering knight in worn plate, a tattered cloak at his back
  S('tarnished', { spec: { cloth: ARM.cloth({ len: 0.43, mat: 'kskirt', flare: 0.4 }, { len: 1.13, mat: 'kcape', rx: 0.25, rz: 0.19, a0: 58, a1: 302, cols: 17, rows: 13, flare: 0.5 }) }, qc: { cullHead: true }, qo: { cullHead: true, glove: 0x3a3c40, parts: ranger(gambeson, darkLea, darkLeg, boot) },
    kit: { suit: true, helm: 'armet', mantle: true, scabbard: true } });
  // Godrick's levy: kettle helm and mail coif, a red and gold surcoat
  const sold = (name, sur) => S(name, { spec: { skin: { tone: 0xb88a6a }, cloth: ARM.cloth({ len: 0.44, mat: sur, tabard: 0.5, tabMat: sur, flare: 0.3 }) }, qc: { hair: [], browCol: 0x2a1c12 }, qo: { glove: 0x2a2018, hair: [], browCol: 0x2a1c12,
      parts: ranger(g([hue(sur === 'surRed' ? 3 : 95, 0.8, 0.55), lea(0.6)], 1, 1), g([lea(0.6)], 0.9, 0.85), g([hue(30, 0.3, 0.4)], 0.6, 0.85), boot, [R_('Arms_Bracer', g([lea(0.6)], 0.8, 0.9), { metal: 0.7 })]) },
    kit: { suit: true, helm: 'kettle', light: true, mat: 'kplate' } });
  sold('soldier', 'surRed'); sold('footman', 'surGreen');
  // a knight of the Grafted: gilt-trimmed plate, red plume and cape
  S('knight', { spec: { cloth: ARM.cloth({ len: 0.46, mat: 'surRed', tabard: 0.56, tabMat: 'surRed' }, { mat: 'kcapeRed', len: 1.08, rx: 0.25, rz: 0.19, a0: 58, a1: 302, cols: 15, rows: 12, flare: 0.5 }) }, qc: { cullHead: true }, qo: { cullHead: true, glove: 0x4a4c50, parts: ranger(g([hue(3, 0.7, 0.4), lea(0.5)], 0.9, 0.9), darkLea, darkLeg, boot) },
    kit: { suit: true, helm: 'armet', plume: 'redPlume', mantle: 'kmantleRed', scabbard: true } });
  // exiles of Stormveil: hooded, weather-beaten
  S('exile', { spec: { skin: { tone: 0xa87a5e }, cloth: ARM.cloth({ len: 0.5, mat: 'exile', flare: 0.4 }) }, qc: { hair: ['Hair_Beard'], hairCol: 0x4a4038, browCol: 0x3a3028 }, qo: { glove: 0x241a14, hair: ['Hair_Beard'], hairCol: 0x4a4038,
      parts: ranger(g([hue(8, 0.5, 0.36), lea(0.5)], 0.8, 0.9), darkLea, darkLeg, boot, [R_('Head_Hood', g([hue(8, 0.5, 0.4)], 0.8, 0.9), MATTE), R_('Acc_Pauldron', g([lea(0.5)], 0.6, 0.7), { metal: 0.8 })]) },
    kit: { suit: true, helm: 'none', light: true, mat: 'kdark' } });
  // banished knight: blackened plate under a wolf pelt, a winged helm
  S('banished', { spec: { cloth: ARM.cloth({ len: 0.5, mat: 'blackCape', flare: 0.4 }, { mat: 'blackCape', len: 1.15 }) }, qc: { cullHead: true }, qo: { cullHead: true, glove: 0x1c1e22, parts: ranger(g([], 0.1, 0.3), g([], 0.1, 0.3), g([], 0.1, 0.28), g([], 0.1, 0.25)) },
    kit: { suit: true, helm: 'sallet', mat: 'kdark', fur: true } });
  // the Tree Sentinel: gold from crest to spur
  S('sentinel', { spec: { cloth: ARM.cloth({ len: 0.5, mat: 'goldCape', tabard: 0.6, tabMat: 'goldCape' }, { mat: 'redCape', len: 1.2 }) }, qc: { cullHead: true }, qo: { cullHead: true, glove: 0x9a7a30, parts: ranger(g([hue(42, 0.7, 0.6), lea(0.7)], 0.9, 0.9), darkLea, g([hue(42, 0.5, 0.45)], 0.7, 0.9), boot) },
    kit: { suit: true, helm: 'armet', mat: 'kgold', edge: 'kbrass', plume: 'gold' } });
  // wandering nobles: faded finery, hollow eyes
  S('noble', { spec: { skin: { tone: 0xa89a8a }, cloth: ARM.cloth({ len: 0.62, mat: 'noble', flare: 0.4 }) }, qc: { hair: ['Hair_Long'], hairCol: 0x8a8478, browCol: 0x6a6458 }, qo: { hair: ['Hair_Long'], hairCol: 0x8a8478,
      parts: peasant(g([cream(0.5, 0.7), lea(0.7, 0.8), { h: 30, w: 40, toH: 8, s: 0.9, v: 0.7, minS: 0.25 }], 0.8, 0.9), g([lea(0.6, 0.5)], 0.6, 0.8)) }, kit: null });
  // the white-faced stranger at the First Step
  S('varre', { spec: { cloth: ARM.cloth({ len: 0.7, mat: 'white', flare: 0.35 }) }, qc: { cullHead: true }, qo: { cullHead: true, glove: 0xd8d0c0, parts: peasant(g([], 0.05, 1.5, 0xfff8ee), g([], 0.05, 1.3, 0xf4ecdc)) }, kit: { mask: true , rags: 'kmantleWhite', cowl: true } });
  // Kalé, the merchant by the fire
  S('kale', { spec: { skin: { tone: 0xb08462 }, cloth: ARM.cloth({ len: 0.5, mat: 'surRed', flare: 0.4 }) }, qc: { hair: ['Hair_Beard'], hairCol: 0x2a2018 }, qo: { hair: ['Hair_Beard'], hairCol: 0x2a2018, parts: peasant(g([cream(1.2, 0.6, 12), lea(0.7)], 1, 0.95), g([lea(0.6)], 0.8, 0.8)).concat([R_('Head_Hood', g([hue(5, 0.9, 0.6)], 1, 1), MATTE)]) }, kit: null });
  // trolls: grey giants in rags (drawn at 2.6×)
  CAST.SPECS.troll = { name: 'troll', height: 1, head: false, skin: { tone: 0x625c54, brow: 0x3c3934 }, mats: () => [], cloth: ARM.cloth({ len: 0.46, mat: 'rags', flare: 0.5, rx: 0.19, rz: 0.15 }) };
  ARM.KITS.troll = { rags: 'kmantleRags', wraps: true };
  CAST.QC.troll = { outfit: 'uniform', top: 0x3a3632, low: 0x2c2824, belt: 0x1c140e, boots: 0x34302c, bootY: 0.2, hair: [], browCol: 0x55524c, bulk: 1.5 };
  // the Beastman of Farum Azula
  S('beastman', { spec: { skin: { tone: 0x5a5048 }, cloth: ARM.cloth({ len: 0.5, mat: 'rags', flare: 0.5 }) }, qc: { cullHead: true }, qo: { cullHead: true, glove: 0x3a342e, parts: peasant(g([], 0.25, 0.5, 0xd8d0c4), g([], 0.2, 0.42)) }, kit: { beast: true, fur: true, rags: 'kmantleRags', wraps: true } });
  // Margit, the Fell Omen: a stooped giant in tatters, a crown of horns
  S('margit', { spec: { skin: { tone: 0x75695c }, cloth: ARM.cloth({ len: 0.72, mat: 'margit', flare: 0.5 }, { mat: 'margit', len: 1.25, rx: 0.26, flare: 0.6 }) }, qc: { hair: ['Hair_Long', 'Hair_Beard'], hairCol: 0x9a9488, browCol: 0x6a655c }, qo: { glove: null, hair: ['Hair_Long', 'Hair_Beard'], hairCol: 0x9a9488, browCol: 0x6a655c,
      parts: peasant(g([], 0.2, 0.5, 0xc8c0b0), g([], 0.15, 0.42, 0xc8c0b0)) }, kit: { horns: 31, fur: true, rags: 'kmantleGrey', wraps: true } });
  // Godrick the Grafted: crowned, robed in threadbare red and gold, a harvest of arms upon his back
  S('godrick', { spec: { skin: { tone: 0xb8a48e }, cloth: ARM.cloth({ len: 0.66, mat: 'godrick', tabard: 0.75, tabMat: 'goldCape', flare: 0.5 }, { mat: 'godrick', len: 1.2, rx: 0.27, flare: 0.6 }) }, qc: { hair: ['Hair_Long', 'Hair_Beard'], hairCol: 0xb8b0a0, browCol: 0x8a8478 }, qo: { glove: null, hair: ['Hair_Long', 'Hair_Beard'], hairCol: 0xb8b0a0, browCol: 0x8a8478,
      parts: peasant(g([cream(1.3, 0.62, 44), lea(0.75, 1.1), { h: 30, w: 40, toH: 4, s: 1.1, v: 0.75, minS: 0.25 }], 1, 0.95), g([lea(0.6)], 0.7, 0.8)).concat([R_('Body_Belt_1', g([hue(42, 1, 1), lea(1.2, 1.2)], 1, 1), { metal: 0.9 })]) },
    kit: { helm: 'crown', grafted: true, fur: true, rags: 'kmantleRed' } });
  ARM._m = ARM._m || {};
  const n0 = CAST.need;
  CAST.need = async function (names, progress) {
    if (!TEX.sets.steel) await TEX.init(['steel', 'gold']);
    if (!ARM._m.redPlume) { ARM.mat('steel'); ARM._m.redPlume = new THREE.MeshStandardMaterial({ color: 0x8a120e, roughness: 0.9 }); }
    const fresh = names.filter((n) => !CHAR.T[n]);
    await n0(names, progress);
    for (const n of fresh) if (ARM.KITS[n] && CHAR.T[n]) ARM.kit(CHAR.T[n], ARM.KITS[n]);
  };
})();
/* the hero template is the Tarnished (the engine calls it CHAR.T.maul) */
CHAR.buildMaul = async function (progress) {
  await QB.load();
  progress && await progress(0.2, 'Forging the Tarnished');
  await CAST.need(['tarnished']);
  progress && await progress(0.9, 'Kindling grace');
  CHAR.T.maul = CHAR.T.tarnished; CHAR.T.maul.stats = {};
  return CHAR.T.maul;
};
