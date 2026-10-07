/* ==== p55b_or_quad2.js ==== */
/* OPUS RING — the horses and wolves, resculpted: a deep narrow neck and a long head instead of a column and a ball,
   muscle over shoulder and haunch, a coat with short-hair grain and dark points, and a cloth caparison that hangs. */
(function () {
  const sc0 = QUAD.sculpt;
  Object.assign(QUAD.SPEC.horse, { res: 0.025,
    upF: [[0.11, 0.0], [0.125, -0.07], [0.105, -0.22], [0.074, -0.42], [0.06, -0.54], [0.07, -0.585], [0.064, -0.6]], upH: [[0.14, 0.0], [0.16, -0.08], [0.135, -0.24], [0.092, -0.44], [0.066, -0.55], [0.074, -0.59], [0.066, -0.6]],
    lo_: [[0.066, 0.0], [0.05, -0.06], [0.04, -0.2], [0.039, -0.4], [0.054, -0.455], [0.058, -0.475], [0.044, -0.5], [0.048, -0.53], [0.066, -0.585], [0.07, -0.6], [0.0, -0.6]] });
  QUAD.SPEC.wolf.res = 0.016;
  QUAD.sculpt = function (kind, o) {
    const key = 'quad7_' + kind + (o.horns ? 'h' : '') + (o.saddle ? 's' : '') + (o.gold ? 'g' : ''), S = QUAD.SPEC[kind];
    return PROPS.sdfMesh(key, (grp) => {
      const C = grp(0, 0.1), H = grp(1, 0.03), X = grp(2, 0.01), L = grp(3, 0.02), A = grp(4, 0.015), NK = SDF.rot(-46, 0, 0);
      if (kind === 'horse') {
        const N1 = SDF.rot(-38, 0, 0), N2 = SDF.rot(-52, 0, 0), HD = SDF.rot(52, 0, 0);
        // trunk: deep chest, barrel, a high round croup; shoulder, breast and haunch muscle
        C.add(SDF.ell([0, 1.3, -0.1], [0.3, 0.33, 0.62])); C.add(SDF.ell([0, 1.26, 0.42], [0.275, 0.42, 0.36]), 'su', 0.14); C.add(SDF.ell([0, 1.36, -0.64], [0.295, 0.38, 0.42]), 'su', 0.12);
        C.add(SDF.ell([0, 1.5, -0.6], [0.24, 0.2, 0.36]), 'su', 0.1); C.add(SDF.ell([0, 1.6, 0.3], [0.11, 0.14, 0.3]), 'su', 0.12);
        C.both(SDF.ell([0.19, 1.28, 0.52], [0.13, 0.32, 0.22], SDF.rot(-18, 0, 0)), 'su', 0.07); C.add(SDF.ell([0, 1.18, 0.72], [0.2, 0.2, 0.13]), 'su', 0.1);
        C.both(SDF.ell([0.19, 1.3, -0.68], [0.165, 0.36, 0.3]), 'su', 0.08); C.both(SDF.ell([0.2, 1.06, -0.62], [0.095, 0.2, 0.16], SDF.rot(14, 0, 0)), 'su', 0.07);
        // neck: deep and narrow where it leaves the shoulder, lighter at the throat
        C.add(SDF.ell([0, 1.5, 0.62], [0.155, 0.29, 0.4], N1), 'su', 0.12); C.add(SDF.ell([0, 1.86, 0.9], [0.088, 0.165, 0.34], N2), 'su', 0.08);
        // head hung from the poll: broad cheek, long face, square muzzle
        C.add(SDF.ell([0, 2.0, 1.14], [0.092, 0.15, 0.18], HD), 'su', 0.05); C.add(SDF.ell([0, 1.8, 1.38], [0.062, 0.085, 0.27], HD), 'su', 0.04); C.add(SDF.ell([0, 1.62, 1.56], [0.064, 0.066, 0.075]), 'su', 0.03); C.add(SDF.ell([0, 1.9, 1.19], [0.07, 0.1, 0.1]), 'su', 0.04);
        C.both(SDF.ell([0.06, 2.01, 1.2], [0.04, 0.035, 0.05]), 'su', 0.03); C.both(SDF.sph([0.04, 1.62, 1.63], 0.017), 'ss', 0.012);
        C.both(SDF.rcone([0.065, 2.16, 1.02], [0.09, 2.33, 0.99], 0.038, 0.011), 'su', 0.02);
        // mane: a ridge on the crest and a fall of hair down the near side; forelock; a long tail
        H.add(SDF.ell([0.03, 1.74, 0.5], [0.05, 0.11, 0.36], N1)); H.add(SDF.ell([0.03, 2.03, 0.82], [0.045, 0.1, 0.3], N2), 'su', 0.03); H.add(SDF.ell([0.115, 1.7, 0.66], [0.028, 0.22, 0.36], N1), 'su', 0.03); H.add(SDF.ell([0.085, 1.92, 0.9], [0.026, 0.16, 0.26], N2), 'su', 0.03);
        H.add(SDF.rcone([0, 2.2, 1.0], [0, 2.02, 1.22], 0.05, 0.02), 'su', 0.03);
        H.add(SDF.rcone([0, 1.52, -1.0], [0, 1.26, -1.2], 0.07, 0.1), 'su', 0.03); H.add(SDF.rcone([0, 1.26, -1.2], [0, 0.72, -1.26], 0.1, 0.085), 'su', 0.05); H.add(SDF.rcone([0, 0.72, -1.26], [0, 0.44, -1.2], 0.085, 0.02), 'su', 0.04);
        X.both(SDF.sph([0.092, 2.0, 1.21], 0.023));
        if (o.horns) { X.both(SDF.rcone([0.065, 2.16, 1.06], [0.15, 2.34, 0.94], 0.034, 0.022)); X.both(SDF.rcone([0.15, 2.34, 0.94], [0.2, 2.42, 0.72], 0.022, 0.006), 'su', 0.02); }
        if (o.saddle) { L.add(SDF.box([0, 1.5, -0.08], [0.325, 0.17, 0.34], 0.07)); L.add(SDF.ell([0, 1.69, -0.08], [0.19, 0.055, 0.29]), 'su', 0.04); L.add(SDF.ell([0, 1.77, -0.38], [0.16, 0.09, 0.055]), 'su', 0.03); L.add(SDF.ell([0, 1.77, 0.2], [0.1, 0.09, 0.05]), 'su', 0.03);
          L.add(SDF.box([0, 1.16, 0.26], [0.31, 0.32, 0.03], 0.01), 'su', 0.01); }
      } else {
        // wolf: deep chest, tucked waist, heavy ruff, a broad skull and a wedge of a muzzle
        C.add(SDF.ell([0, 0.66, -0.02], [0.135, 0.15, 0.42])); C.add(SDF.ell([0, 0.64, 0.26], [0.16, 0.23, 0.24]), 'su', 0.08); C.add(SDF.ell([0, 0.67, -0.32], [0.14, 0.18, 0.2]), 'su', 0.07);
        C.both(SDF.ell([0.105, 0.6, 0.3], [0.07, 0.17, 0.1]), 'su', 0.05); C.both(SDF.ell([0.105, 0.6, -0.34], [0.08, 0.19, 0.14]), 'su', 0.05);
        C.add(SDF.ell([0, 0.76, 0.46], [0.165, 0.19, 0.2]), 'su', 0.08); C.add(SDF.rcone([0, 0.78, 0.5], [0, 0.86, 0.68], 0.13, 0.105), 'su', 0.07);
        C.add(SDF.ell([0, 0.88, 0.74], [0.1, 0.092, 0.12]), 'su', 0.05); C.add(SDF.rcone([0, 0.86, 0.82], [0, 0.82, 1.0], 0.058, 0.038), 'su', 0.035); C.both(SDF.ell([0.05, 0.9, 0.8], [0.03, 0.022, 0.04]), 'su', 0.02);
        C.both(SDF.rcone([0.062, 0.96, 0.7], [0.085, 1.1, 0.67], 0.045, 0.012), 'su', 0.02);
        H.add(SDF.rcone([0, 0.72, -0.46], [0, 0.5, -0.86], 0.08, 0.06)); H.add(SDF.ell([0, 0.47, -0.9], [0.05, 0.05, 0.1]), 'su', 0.04);
        X.add(SDF.sph([0, 0.825, 1.02], 0.026)); X.both(SDF.sph([0.056, 0.905, 0.83], 0.015));
      }
    }, S.box, S.res);
  };
  /* coat: short-hair grain and darker points, in object space (the sculpt has no UVs) */
  QUAD.furHook = function (m, pts) {
    const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vOP; float qh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float qn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(qh(i), qh(i + vec3(1,0,0)), f.x), mix(qh(i + vec3(0,1,0)), qh(i + vec3(1,1,0)), f.x), f.y), mix(mix(qh(i + vec3(0,0,1)), qh(i + vec3(1,0,1)), f.x), mix(qh(i + vec3(0,1,1)), qh(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        { float hair = qn(vOP * vec3(60.0, 14.0, 22.0)) * 0.6 + qn(vOP * vec3(160.0, 40.0, 60.0)) * 0.4; float qPat = qn(vOP * 3.2);
          diffuseColor.rgb *= (0.74 + 0.4 * hair) * (0.86 + 0.28 * qPat) * mix(${pts.toFixed(2)}, 1.0, smoothstep(${(pts < 1 ? 0.55 : -9).toFixed(2)}, ${(pts < 1 ? 1.25 : -8).toFixed(2)}, vOP.y)); }`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor - 0.25 * (qn(vOP * vec3(60.0, 14.0, 22.0)) - 0.5), 0.3, 1.0);'); };
    const k0 = m.customProgramCacheKey ? m.customProgramCacheKey() : ''; m.customProgramCacheKey = () => k0 + 'fur' + pts; return m; };
  const mat0 = QUAD.mat;
  QUAD.mat = function (key, o) { const had = QUAD._m && QUAD._m[key], m = mat0(key, o); if (!had && (key.startsWith('coat') || key.startsWith('leg') || key.startsWith('mane'))) { QUAD.furHook(m, key.startsWith('coat') ? 0.5 : 1); m.roughness = key.startsWith('mane') ? 0.9 : 0.72; } return m; };
  /* a caparison that hangs: over the back and down both flanks in pleats, to a ragged hem */
  QUAD.drape = function (z0, z1, o) {
    o = o || {}; const N = 26, M = 22, P = [], U = [], I = [], cy = o.cy || 1.42, r = o.r || 0.365, drop = o.drop || 0.8;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= M; i++) { const f = j / N, z = lerp(z0, z1, f), u = i / M * 2 - 1, au = Math.abs(u), sg = u < 0 ? -1 : 1, swell = 1 + 0.06 * Math.sin(f * PI); let x, y;
      if (au <= 0.42) { const a = au / 0.42 * 1.4; x = sg * Math.sin(a) * r * swell; y = cy + Math.cos(a) * r; }
      else { const t = (au - 0.42) / 0.58, a = 1.4; x = sg * (Math.sin(a) * r * swell + t * 0.1 + Math.sin(z * 21 + sg * 1.3) * 0.028 * t); y = cy + Math.cos(a) * r - t * (drop + 0.05 * Math.sin(z * 8 + sg)); }
      P.push(x, y, z); U.push(f, au); }
    for (let j = 0; j < N; j++) for (let i = 0; i < M; i++) { const a = j * (M + 1) + i, b = a + 1, c = a + M + 1, d = c + 1; I.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
  };
  const b0 = QUAD.build;
  QUAD.build = function (kind, o) {
    o = Object.assign({}, o || {}); if (kind === 'horse') o.leg = new THREE.Color(o.coat || 0x8c7c68).multiplyScalar(0.8).getHex();
    const Q = b0(kind, o);
    if (kind === 'horse') { for (const l of Q.legs) { l.up.scale.x = 0.84; } }
    if (o.gold) {   // barding in plate: chanfron, five crinet lames, a peytral
      const gm = ARM.mat('kgold'), add = (g) => { const me = new THREE.Mesh(g, gm); me.castShadow = true; Q.inner.add(me); };
      const na = V.norm([0, 0.68, 0.5]); for (let i = 0; i < 5; i++) { const t = 0.02 + i * 0.165, r = lerp(0.215, 0.135, i / 4); add(ARM.band([0, 1.44 + na[1] * t, 0.5 + na[2] * t], na, [0, 1, -0.7], [[0, r * 1.06], [0.06, r], [0.17, r * 0.93], [0.185, r * 0.99]], 3.9, { ku: 1.45, ks: 0.82, seg: 14 })); }
      const ha = V.norm([0, -0.46, 0.51]); add(ARM.band([0, 2.07, 1.07], ha, [0, 0.74, 0.67], [[0, 0.1], [0.1, 0.112], [0.3, 0.094], [0.5, 0.076], [0.6, 0.074], [0.62, 0.08]], 2.9, { ku: 1.25, ks: 0.98, seg: 12 }));
      for (const sd of [1, -1]) { const e = new THREE.SphereGeometry(0.03, 8, 6); e.scale(0.5, 1, 1); e.translate(sd * 0.1, 2.0, 1.23); add(e); }
      add(ARM.band([0, 0.98, 0.42], [0, 1, 0], [0, 0, 1], [[0, 0.33], [0.04, 0.345], [0.3, 0.35], [0.36, 0.33], [0.38, 0.345]], 3.5, { ku: 1.22, ks: 0.94, seg: 18 }));
    }
    if (o.gold) { const old = Q.inner.children.filter((c) => c.isMesh && c.material === QUAD._m.caparison); for (const c of old) Q.inner.remove(c);
      const cm = CLOTH.mat('kcapeRed'); for (const [z0, z1, dr] of [[-1.04, 0.72, 0.84]]) { const me = new THREE.Mesh(QUAD.drape(z0, z1, { drop: dr, cy: 1.34 }), cm); me.castShadow = true; Q.inner.add(me); } }
    return Q;
  };
})();
