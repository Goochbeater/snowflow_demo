/* ==== p69_or_realm.js ==== */
/* OPUS RING — the realm built out. Limgrave gets its undergrowth (ferns, flowers, tall grass, stones on the verges),
   water that shallows to a shore, colossal fragments of an older age standing out of the fields, soldiers' camps with
   smoke you can see across the valley, herds and birds, a troll-drawn caravan on the road — and the country beyond
   the edge of the map: highlands, the sea, a far peninsula with its castle, the Divine Tower behind Stormveil. */
const REALM = {};
/* ------------------------------------------------------------------ plants that move in the wind */
REALM.plantMat = function (name, col) {
  const m = AST.material(name, { color: col, env: 0.2, alphaTest: 0.45, key: 'sway' });
  if (!m._sway) { m._sway = true; const ob = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => { if (ob) ob(sh, r); sh.uniforms.uSwT = WORLD.TIME;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSwT;').replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      { vec3 ip = instanceMatrix[3].xyz; float k = min(max(position.y, 0.0), 0.45); transformed.x += (sin(uSwT * 1.6 + ip.x * 0.31 + ip.z * 0.17) * 0.16 + sin(uSwT * 3.3 + ip.z * 1.3) * 0.04) * k; transformed.z += cos(uSwT * 1.3 + ip.z * 0.23 + ip.x * 0.11) * 0.12 * k; }
      #endif`);
      // lit like the turf they stand in: leaves take the sky's light whichever way they face
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz, 0.82));').replace('#include <aomap_fragment>', ''); };
    m.customProgramCacheKey = () => 'realmplant2'; }
  return m;
};
/* undergrowth for an open country. roadPts: the road polyline; ok(x, z, roadClear) -> may a plant stand here */
REALM.flora = function (L, G, o) {
  const rs = MG.rs('flora'), list = [], ok = o.ok, B = o.bounds;
  const put = (m, x, z, s, c) => { const h = G.hf(x, z); if (h === null) return; list.push({ m, p: [x, h - 0.03, z], s, r: [(rs() - 0.5) * 0.2, rs() * TAU, (rs() - 0.5) * 0.2], c }); };
  const TINT = [0xffffff, 0xe6e6c8, 0xd2d6b0, 0xf2eccc];
  // drifts of yellow flowers in the open meadow
  for (let i = 0; i < (o.drifts !== undefined ? o.drifts : 420); i++) { const cx = B[0] + rs() * (B[2] - B[0]), cz = B[1] + rs() * (B[3] - B[1]); if (!ok(cx, cz, 5)) continue; if (fbm2(cx * 0.018 + 5, cz * 0.018 + 1, 2) < 0.47) continue;
    const n = 5 + (rs() * 9 | 0), Rr = 2 + rs() * 5; for (let k = 0; k < n; k++) { const a = rs() * TAU, d = Rr * Math.sqrt(rs()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (!ok(x, z, 2.4)) continue; put('cel_a', x, z, 3.0 + rs() * 1.6, TINT[k & 3]); } }
  // tall grass and fern, thick where the noise says the ground is rank
  for (let i = 0; i < (o.tufts || 5200); i++) { const x = B[0] + rs() * (B[2] - B[0]), z = B[1] + rs() * (B[3] - B[1]); const den = fbm2(x * 0.035 + 13, z * 0.035 + 2, 3); if (den < 0.5 || rs() > (den - 0.44) * 5) continue; if (!ok(x, z, 2.6)) continue;
    const k = rs(); if (k < 0.45) put('tuft_c', x, z, (k < 0.22 ? 3.6 : 5.0) + rs() * 2.2, TINT[i & 3]); else if (k < 0.92) put('fern_a', x, z, 2.4 + rs() * 1.8, TINT[i & 3]); else put('shrub_d', x, z, 0.7 + rs() * 0.6, 0xc8c8a4); }
  // the verges of the road: tufts, a fern, a stone
  const P = o.road || []; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(l / 1.5), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
    for (let k = 0; k < n; k++) for (const sd of [-1, 1]) { if (rs() < 0.42) continue; const f = (k + rs()) / n, d = 2.3 + rs() * rs() * 3.4, x = a[0] + ux * l * f + uz * sd * d, z = a[1] + uz * l * f - ux * sd * d; if (!ok(x, z, 2.2)) continue;
      const q = rs(); if (q < 0.55) put('tuft_c', x, z, 3.0 + rs() * 2.4, TINT[k & 3]); else if (q < 0.8) put('fern_a', x, z, 2.2 + rs() * 1.4, TINT[k & 3]); else if (q < 0.9) put('cel_a', x, z, 3.0 + rs(), 0xffffff); else list.push({ m: 'ms2a', p: [x, G.hf(x, z) - 0.12, z], s: 0.22 + rs() * 0.3, r: [0, rs() * TAU, 0] }); } }
  L.floraN = list.length;
  const rock = (n) => AST.material(n, { grade: [0.7, 0.9, 0.92, 0.92] });
  return AST.scatter(L, list, { mat: (n) => (n.startsWith('ms') ? rock(n) : REALM.plantMat(n, n.startsWith('tuft') ? 0xd8d4a0 : n.startsWith('cel') ? 0xe8e6c4 : 0xd0d4a8)), cell: o.cell || 84, far: o.far || 60, shadow: false });
};
/* ------------------------------------------------------------------ meadow flowers: drifts of yellow and white (and a little violet) riding the same wrap-around field as the turf */
REALM.flowers = function (L, G, o) {
  o = o || {}; const tex = L.grassTex; if (!tex) return; const N = o.n || 22000, S = o.size || 70, rs = MG.rs('meadow'), pos = new Float32Array(N * 3), off = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { off[i * 4] = rs() * S; off[i * 4 + 1] = rs() * S; off[i * 4 + 2] = rs(); off[i * 4 + 3] = rs(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aOff', new THREE.BufferAttribute(off, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const U = { tH: { value: tex }, uExt: { value: new THREE.Vector4(G.x0, G.z0, 1 / (G.x1 - G.x0), 1 / (G.z1 - G.z0)) }, uCam: { value: new THREE.Vector3() }, uS: { value: S }, uT: WORLD.TIME, uHt: { value: o.height || 0.4 }, uPx: { value: 600 }, uFogC: { value: new THREE.Color() }, uFogD: { value: 0.002 }, uCl: { value: WORLD.CLOUD } };
  const m = new THREE.ShaderMaterial({ uniforms: U, fog: false, toneMapped: false,
    vertexShader: `attribute vec4 aOff; uniform sampler2D tH; uniform vec4 uExt; uniform vec3 uCam; uniform float uS, uT, uHt, uPx; uniform vec2 uCl; varying float vK; varying float vD; varying float vSh; varying float vR;
      ` + WORLD.CLOUD_GLSL + `
      void main(){ vec2 wp = aOff.xy + floor((uCam.xz - aOff.xy) / uS + 0.5) * uS; vec4 hm = texture2D(tH, (wp - uExt.xy) * uExt.zw); float dC = length(wp - uCam.xz);
        float kind = aOff.z < 0.56 ? 0.0 : aOff.z < 0.93 ? 1.0 : 2.0;
        float mask = kind < 0.5 ? smoothstep(0.44, 0.62, cNs(wp * 0.043 + 3.7) * 0.7 + cNs(wp * 0.21) * 0.3) : kind < 1.5 ? smoothstep(0.46, 0.64, cNs(wp * 0.057 + 19.2) * 0.7 + cNs(wp * 0.26 + 5.0) * 0.3) : smoothstep(0.56, 0.7, cNs(wp * 0.07 + 41.0));
        float keep = (1.0 - smoothstep(uS * 0.36, uS * 0.49, dC)) * smoothstep(0.35, 0.6, hm.g) * step(aOff.w, mask);
        vec3 p = vec3(wp.x + sin(uT * 1.5 + wp.y * 0.6) * 0.03, hm.r + uHt * (0.62 + 0.5 * fract(aOff.w * 7.0)) * (kind > 1.5 ? 1.25 : 1.0), wp.y + cos(uT * 1.2 + wp.x * 0.5) * 0.02); if (keep < 0.5) p.y -= 4000.0;
        vec4 mv = viewMatrix * vec4(p, 1.0); vK = kind; vD = length(mv.xyz); vR = aOff.w; vSh = mix(1.0, cloudShade(wp, uCl.x), uCl.y);
        gl_PointSize = clamp((kind < 0.5 ? 0.072 : kind < 1.5 ? 0.076 : 0.06) * (0.7 + 0.6 * fract(aOff.w * 13.0)) * uPx / max(0.5, -mv.z), 1.2, 16.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uFogC; uniform float uFogD; varying float vK; varying float vD; varying float vSh; varying float vR;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0, a = atan(d.y, d.x) + vR * 6.0; float n = vK < 0.5 ? 5.0 : vK < 1.5 ? 9.0 : 6.0, pet = 0.62 + 0.38 * abs(cos(a * n * 0.5)); if (r > pet) discard;
        vec3 c = vK < 0.5 ? mix(vec3(0.95, 0.66, 0.05), vec3(1.0, 0.8, 0.14), vR) : vK < 1.5 ? vec3(0.8, 0.79, 0.72) : vec3(0.42, 0.34, 0.62);
        if (vK > 0.5 && vK < 1.5) c = mix(vec3(0.72, 0.55, 0.1), c, smoothstep(0.2, 0.32, r)); else c *= 1.0 - 0.3 * smoothstep(0.0, 0.3, 0.3 - r);
        c *= vSh * (0.8 + 0.2 * (1.0 - r)); float f = 1.0 - exp(-uFogD * uFogD * vD * vD); gl_FragColor = vec4(mix(c, uFogC, f), 1.0); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; LEVEL.add(pts);
  L.updates.push(() => { U.uCam.value.copy(R.camera.position); U.uPx.value = R.h / (2 * Math.tan(R.camera.fov * D2R / 2)); if (R.scene.fog) { U.uFogC.value.copy(R.scene.fog.color); U.uFogD.value = R.scene.fog.density; } });
};
/* ------------------------------------------------------------------ water that knows its bed: clear in the shallows, dark in the deep, a pale line where it meets the shore */
(function () {
  const w0 = WORLD.water;
  WORLD.water = function (L, x0, z0, x1, z1, y, o) {
    const me = w0(L, x0, z0, x1, z1, y, o); const G = L.G, tex = L.grassTex; if (!G || !tex) return me;
    const m = me.material, U = { tWH: { value: tex }, uWE: { value: new THREE.Vector4(G.x0, G.z0, 1 / (G.x1 - G.x0), 1 / (G.z1 - G.z0)) }, uWY: { value: y }, uWT: WORLD.TIME };
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWw;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWw = (modelMatrix * vec4(position, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tWH; uniform vec4 uWE; uniform float uWY, uWT; varying vec2 vWw;')
        .replace('#include <color_fragment>', `#include <color_fragment>
        { vec2 hu = clamp((vWw - uWE.xy) * uWE.zw, 0.002, 0.998); float bed = texture2D(tWH, hu).r; float dp = uWY - bed;
          float rip = sin(vWw.x * 1.7 + uWT * 1.3) * sin(vWw.y * 1.3 - uWT * 1.1);
          float sh0 = smoothstep(0.0, 0.45, dp + rip * 0.04), deep = smoothstep(0.1, 1.8, dp);
          diffuseColor.rgb = mix(diffuseColor.rgb * 1.2 + vec3(0.02, 0.03, 0.02), diffuseColor.rgb * 0.8, deep);
          float foam = (1.0 - smoothstep(0.03, 0.22, dp + rip * 0.05)) * sh0 * (0.6 + 0.4 * sin(vWw.x * 5.0 + vWw.y * 3.7 + uWT * 2.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.64, 0.6), foam * 0.55);
          diffuseColor.a *= sh0 * mix(0.5, 1.0, deep) + foam * 0.3; }`); };
    m.customProgramCacheKey = () => 'orwater2';
    return me;
  };
})();
/* ------------------------------------------------------------------ colossal fragments: arcades of an older, greater age, fallen out of the sky and half sunk in the turf
   o: { yaw, tilt (roll in its own plane), pitch (lean), n bays, span, h, t, sink, broken: [pier indices], mat, seed } */
REALM.colossus = function (x, z, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.dark, n = o.n || 3, sp = o.span || 11, H = o.h || 20, T = o.t || 5, rs = mulberry(o.seed || 7), y = WORLD.gy(x, z) - (o.sink !== undefined ? o.sink : 4), Lt = n * sp, R0 = (sp - 3.0) / 2;
  const base = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.pitch || 0, o.yaw || 0, o.tilt || 0, 'YXZ')), V3(1, 1, 1));
  const put = (hx, hy, hz, lx, ly, lz, rz, mt) => { const m4 = base.clone().multiply(new THREE.Matrix4().compose(V3(lx, ly, lz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz || 0)), V3(1, 1, 1))); KIT.geo(KIT.chamferGeo(hx, hy, hz, 0.14), mt || mat, m4, { worldUV: true }); };
  const dead = (i) => !!(o.broken && o.broken.includes(i)), wp = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { const lx = -Lt / 2 + i * sp, ph = dead(i) ? H * (0.25 + 0.35 * rs()) : H - R0 - 1.2;
    put(1.5, ph / 2 + 3, T / 2, lx, ph / 2 - 3, 0); put(1.9, 0.6, T / 2 + 0.4, lx, 0.6, 0); if (!dead(i)) { put(1.75, 0.4, T / 2 + 0.25, lx, ph, 0); for (const sd of [-1, 1]) put(0.5, ph * 0.42, 0.5, lx, ph * 0.42, sd * (T / 2 + 0.3)); }
    else for (let k = 0; k < 3; k++) put(0.7 + rs() * 0.8, 0.5 + rs() * 0.5, 0.7 + rs(), lx + (rs() - 0.5) * 7, 0.3 + rs() * 0.6, (rs() - 0.5) * 9, rs() * 2);   // fallen blocks
    wp.set(lx, 2, 0).applyMatrix4(base); PHY.cyl(wp.x, wp.z, 2.1, y - 2, wp.y + Math.min(ph, 9)); }
  for (let i = 0; i < n; i++) { if (dead(i) || dead(i + 1)) continue; const mx = -Lt / 2 + (i + 0.5) * sp, ya = H - R0 - 1.0, nv = 11;
    for (let k = 0; k < nv; k++) { const a = (k + 0.5) / nv * PI; put((PI * (R0 + 0.45) / nv) / 2 + 0.06, 0.5, T / 2 + 0.02, mx - Math.cos(a) * (R0 + 0.45), ya + Math.sin(a) * (R0 + 0.45), 0, HALF - a); }
    put(sp / 2 + 0.02, 1.6, T / 2 - 0.1, mx, H + 1.5, 0); put(sp / 2 + 0.02, 0.35, T / 2 + 0.3, mx, H + 3.4, 0);                 // the wall over the crown, a cornice
    for (const sd of [-1, 1]) put(1.2, (R0 + 1.4) / 2, T / 2 - 0.15, mx + sd * (sp / 2 - 1.5 - 1.2 + 0.2), H - (R0 + 1.4) / 2, 0); // haunches
    if (o.upper && rs() < 0.75) { const uh = 5 + rs() * 4; put(1.1, uh / 2, T / 2 - 0.5, mx - sp / 2, H + 3.7 + uh / 2, 0); if (rs() < 0.6) put(sp / 2, 0.5, T / 2 - 0.5, mx, H + 3.7 + uh, 0); } }
};
/* a great fallen drum of a column, or a block the size of a house */
REALM.block = function (x, z, hx, hy, hz, rx, ry, rz, sink, mat) { const y = WORLD.gy(x, z); KIT.rbox(x, y + hy * 0.4 - (sink || 0), z, hx, hy, hz, rx, ry, rz, mat || WORLD.M().dark, 0.16); PHY.cyl(x, z, Math.min(hx, hz) * 0.9, y - 2, y + hy); };
/* ------------------------------------------------------------------ smoke: thin columns standing over every fire, seen from across the valley */
REALM.smoke = function (L, x, y, z, o) { (L._smoke = L._smoke || []).push([x, y, z, (o && o.k) || 1]); };
REALM.smokeBuild = function (L) {
  const S = L._smoke; if (!S || !S.length) return; const PUFF = 9, N = S.length * PUFF, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const B = new Float32Array(N * 4), Q = new Float32Array(N * 2); S.forEach((s, i) => { for (let k = 0; k < PUFF; k++) { const j = i * PUFF + k; B[j * 4] = s[0]; B[j * 4 + 1] = s[1]; B[j * 4 + 2] = s[2]; B[j * 4 + 3] = s[3]; Q[j * 2] = (k + RNG() * 0.6) / PUFF; Q[j * 2 + 1] = RNG(); } });
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(Q, 2)); g.instanceCount = N;
  const U = { uT: WORLD.TIME, uFog: { value: new THREE.Color(0.3, 0.3, 0.27) }, uFogD: { value: 0.002 } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute vec4 aB; attribute vec2 aQ; uniform float uT; varying vec2 vP; varying float vL; varying float vD; varying float vS;
      void main(){ float life = fract(uT * 0.042 + aQ.x); float Hh = 30.0 * aB.w; vec3 c = aB.xyz + vec3(life * life * Hh * 0.55 + sin(life * 7.0 + aQ.y * 40.0) * 0.5 * life, life * Hh, life * life * Hh * 0.2 + cos(life * 6.0 + aQ.y * 31.0) * 0.5 * life);
        float sz = mix(0.45, 4.6, pow(life, 0.8)) * aB.w; vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * sz; vP = position.xy; vL = life; vS = aQ.y; vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uFog; uniform float uFogD; varying vec2 vP; varying float vL; varying float vD; varying float vS;
      void main(){ float r = length(vP + 0.18 * vec2(sin(vP.y * 5.0 + vS * 30.0), cos(vP.x * 4.0 + vS * 17.0))); float a = (1.0 - smoothstep(0.35, 1.0, r)) * smoothstep(0.0, 0.07, vL) * pow(1.0 - vL, 1.4) * 0.5;
        if (a < 0.004) discard; vec3 col = mix(vec3(0.085, 0.08, 0.075), vec3(0.3, 0.29, 0.27), vL); float f = 1.0 - exp(-uFogD * uFogD * vD * vD * 0.7); gl_FragColor = vec4(mix(col, uFog, f), a * (1.0 - f * 0.75)); }` });
  const me = new THREE.Mesh(g, m); me.frustumCulled = false; me.renderOrder = 4; LEVEL.add(me);
  L.updates.push(() => { if (R.scene.fog) { U.uFog.value.copy(R.scene.fog.color); U.uFogD.value = R.scene.fog.density; } });
};
/* ------------------------------------------------------------------ a soldiers' camp: tents round a fire, stores, a banner — and its smoke */
REALM.camp = function (L, x, z, yaw, o) {
  o = o || {}; const gy = WORLD.gy, M = WORLD.M(), c = Math.cos(yaw), s = Math.sin(yaw), P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const T = o.tents || [[-4.6, -2.4, 0.5], [4.4, -3.0, -0.6], [0.4, 5.4, 1.6]]; for (const [lx, lz, a] of T) { const p = P(lx, lz); LIM.tent(L, p[0], p[1], yaw + a); }
  WORLD.campfire(L, x, z); REALM.smoke(L, x, gy(x, z) + 0.8, z, { k: 1 });
  const b = P(-1.6, -5.2), by = gy(b[0], b[1]); KIT.cyl(b[0], by, b[1], 0.06, 6.2, M.wood, { seg: 6 }); WORLD.banner(L, b[0] + 0.45, by + 6.0, b[1], yaw, 0.9, 2.6);
  for (const [lx, lz] of [[2.4, 1.6], [-2.6, 1.2]]) { const p = P(lx, lz), py = gy(p[0], p[1]); KIT.rbox(p[0], py + 0.2, p[1], 0.9, 0.17, 0.2, 0, yaw + lx, 0, M.wood, 0.05); }   // logs to sit on
  (L._stores = L._stores || []).push([P(5.6, 2.4)[0], P(5.6, 2.4)[1], 'stores'], [P(-6.2, 3.4)[0], P(-6.2, 3.4)[1], 'stores']);
  if (WORLD.clearGrass) { WORLD.clearGrass(L, x, z, 3.2); }
  return { P, yaw };
};
REALM.CAMPS = {};
/* a watch-post: a timber platform on four legs with a ladder and a brazier */
REALM.watch = function (L, x, z, yaw) {
  const y = WORLD.gy(x, z), M = WORLD.M(), c = Math.cos(yaw), s = Math.sin(yaw), P = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
  for (const [lx, lz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) KIT.beam(P(lx * 1.25, -0.5, lz * 1.25), P(lx, 5.2, lz), 0.2, M.wood);
  KIT.obox(x, y + 5.2, z, 1.9, y + 5.4, 1.9, yaw, M.wood, { col: false }); for (const [lx, lz, hx, hz] of [[0, -1.8, 1.9, 0.07], [0, 1.8, 1.9, 0.07], [-1.8, 0, 0.07, 1.9], [1.8, 0, 0.07, 1.9]]) { const p = P(lx, 0, lz); KIT.obox(p[0], y + 5.4, p[2], hx, y + 6.3, hz, yaw, M.wood, { col: false }); }
  KIT.beam(P(-1.5, 2.2, -1.5), P(1.5, 3.6, -1.5), 0.12, M.wood); KIT.beam(P(1.5, 2.2, 1.5), P(-1.5, 3.6, 1.5), 0.12, M.wood);
  for (const sd of [-0.3, 0.3]) KIT.beam(P(sd, -0.2, 2.6), P(sd, 5.4, 1.9), 0.08, M.wood); for (let k = 0; k < 9; k++) KIT.beam(P(-0.3, 0.4 + k * 0.56, 2.55 - k * 0.07), P(0.3, 0.4 + k * 0.56, 2.55 - k * 0.07), 0.06, M.wood);
  { const g = new THREE.ConeGeometry(3.1, 1.7, 4, 1); g.rotateY(PI / 4 + yaw); KIT.geo(g, M.wood, new THREE.Matrix4().makeTranslation(x, y + 8.6, z), { uvs: 4, uvs2: 2 }); for (const [lx, lz] of [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]]) KIT.beam(P(lx, 5.4, lz), P(lx, 7.8, lz), 0.12, M.wood); }
  PHY.cyl(x, z, 2.2, y - 1, y + 5);
};
/* ------------------------------------------------------------------ the far country round Limgrave */
REALM.far = function (L, G) {
  const M = WORLD.M(), cs0 = KIT.cellSize; KIT.cellSize = 1e5;   // everything out there in a handful of batches
  // highlands west and north-east, the sea south and east; across the water a peninsula
  const pen = (x, z) => { const u = (x - 90) / 640, v = (z + 1010) / 300, r = Math.hypot(u, v) + (fbm2(x * 0.004 + 3, z * 0.004, 3) - 0.5) * 0.5; return 1 - smooth(0.62, 1.0, r); };
  const outer = WORLD.outer(L, G, LIM.h, { res: 26, range: 1560,
    land: (x, z) => 1 - (1 - smooth(260, 640, Math.abs(x + (z - 560) * 0.21))) * smooth(430, 560, z),
    extra: (x, z, h) => { if (z < -640) { const k = pen(x, z); if (k > 0) h = Math.max(h, -34 + k * (70 + fbm2(x * 0.006, z * 0.006 + 7, 3) * 70)); } return h; } });
  const H = outer.userData.H;
  // the Divine Tower of Limgrave, east of the castle, and the high bridge that reaches it
  { const x = 286, z = 742, y = H(x, z) - 14; CAS.tower(x, z, 23, 23, y, 250, { mat: M.dark, win: 0 }); const t2 = y + 250; CAS.tower(x, z, 17, 17, t2, 70, { mat: M.dark, win: 0, plinth: 0 }); CAS.tower(x, z, 10, 10, t2 + 70, 36, { mat: M.dark, win: 0, roof: 'spire', plinth: 0 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) CAS.tower(x + sx * 23, z + sz * 23, 5, 5, y, 276, { mat: M.dark, win: 0, roof: 'spire', buttress: false });
    WORLD.aqueduct(138, 566, x - 18, z - 26, y + 96, { w: 9, span: 30, col: false, mat: M.dark, broken: [3] }); }
  // far towers on the western and northern heights
  for (const [x, z, hw, h, o] of [[-520, -40, 8, 96, { turret: true }], [-470, 420, 7, 80, { roof: 'spire' }], [520, 420, 8, 110, { turret: true }], [-640, 760, 9, 120, { roof: 'spire' }], [640, 900, 9, 130, {}]]) CAS.tower(x, z, hw, hw, H(x, z) - 8, h, Object.assign({ mat: M.dark, win: 0 }, o));
  // the castle at the end of the peninsula
  { const cx = 150, cz = -1010, y = H(cx, cz) - 6; CAS.tower(cx, cz, 16, 13, y, 62, { mat: M.dark, win: 0, turret: true }); CAS.tower(cx - 34, cz + 8, 8, 8, y - 6, 44, { mat: M.dark, win: 0, roof: 'spire' }); CAS.tower(cx + 38, cz - 4, 9, 9, y - 6, 50, { mat: M.dark, win: 0 }); CAS.tower(cx + 8, cz + 34, 7, 7, y - 8, 36, { mat: M.dark, win: 0, roof: 'pyr' });
    CAS.wall(cx - 34, cz + 8, cx + 8, cz + 34, y - 8, y + 20, { mat: M.dark, t: 5 }); CAS.wall(cx + 8, cz + 34, cx + 38, cz - 4, y - 8, y + 20, { mat: M.dark, t: 5 }); }
  // lesser Erdtrees: one in the eastern woods, one on the peninsula
  WORLD.minorErdtree(L, 560, H(560, 300) - 6, 300, 250); WORLD.minorErdtree(L, -170, H(-170, -960) - 6, -960, 210);
  // sea stacks off the cliffs: leaning, broken-topped needles of rock in clusters
  { const rs = MG.rs('stacks'), mat = TERRAIN.cliffMat(0x9a958a);
    for (const [x, z, r, h] of [[-250, -470, 16, 60], [-120, -520, 11, 44], [60, -480, 14, 52], [230, -450, 18, 66], [420, -300, 15, 58], [470, -80, 12, 46], [440, 90, 17, 64]]) for (let q = 0; q < 3; q++) {
      const k = q === 0 ? 1 : 0.35 + rs() * 0.3, rr = r * k, hh = (h + 30) * (q === 0 ? 1 : 0.4 + rs() * 0.3), ox = q ? (rs() - 0.5) * r * 3.2 : 0, oz = q ? (rs() - 0.5) * r * 3.2 : 0, lean = (rs() - 0.5) * 0.3, sd = rs() * 50;
      const g = new THREE.CylinderGeometry(rr * 0.3, rr, hh, 11, 7), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / hh + 0.5, a = Math.atan2(p.getZ(i), p.getX(i)), n = 0.62 + 1.1 * fbm2(Math.cos(a) * 1.4 + sd, Math.sin(a) * 1.4 + y * 2.6 + sd, 3) + (hash2(Math.round(y * 7), q + sd | 0) - 0.5) * 0.3; p.setX(i, p.getX(i) * n + y * hh * lean); p.setZ(i, p.getZ(i) * n); if (y > 0.99) p.setY(i, p.getY(i) + (fbm2(p.getX(i) * 0.3 + sd, p.getZ(i) * 0.3, 2) - 0.5) * hh * 0.3); }
      g.computeVertexNormals(); KIT.geo(g, mat, new THREE.Matrix4().makeTranslation(x + ox, -30 + hh / 2, z + oz), { worldUV: true }); } }
  if (KIT.flush) KIT.flush(); KIT.cellSize = cs0;
};
/* ------------------------------------------------------------------ LIMGRAVE */
LEVEL.defs.limgrave.models.push('tuft_c', 'cel_a');
Object.defineProperty(LEVEL.defs.limgrave, 'photo', { get: () => AST.BASE_SETS.concat(['hessian']) });
(function () {
  const def = LEVEL.defs.limgrave, b0 = def.build, s0 = def.onStart;
  def.build = async function (L) {
    await b0(L);
    const G = L.G, M = WORLD.M(), gy = WORLD.gy, rs = MG.rs('realm');
    const roadD = (x, z) => LIM.road(x, z, LIM._r).d, clear = (x, z, m) => LIM.CLEAR.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] * (m || 1));
    WORLD.CLOUD[1] = 1;
    WORLD.rocksBegin();
    // ---- colossal fragments
    REALM.colossus(-84, -26, { yaw: 0.5, tilt: -0.2, pitch: 0.16, n: 4, span: 12, h: 23, t: 5.5, sink: 5, broken: [4], upper: true, seed: 3 });
    REALM.colossus(112, -176, { yaw: -0.9, tilt: 0.3, pitch: -0.22, n: 3, span: 11, h: 20, t: 5, sink: 6, broken: [0], seed: 9 });
    REALM.colossus(-112, 232, { yaw: 2.2, tilt: 0.16, pitch: 0.3, n: 3, span: 13, h: 25, t: 6, sink: 6, upper: true, seed: 14 });
    REALM.colossus(116, 300, { yaw: 0.2, tilt: -0.32, pitch: -0.1, n: 5, span: 11, h: 21, t: 5, sink: 7, broken: [2, 5], upper: true, seed: 21 });
    REALM.colossus(216, 96, { yaw: 1.3, tilt: 0.22, pitch: 0.2, n: 3, span: 12, h: 22, t: 5.5, sink: 5, broken: [3], seed: 33 });
    REALM.colossus(-232, -150, { yaw: 2.7, tilt: -0.14, pitch: 0.1, n: 4, span: 12, h: 24, t: 5.5, sink: 4, upper: true, broken: [0], seed: 41 });
    for (const [x, z, a, b, c, ry] of [[-60, -44, 3.4, 2.2, 2.6, 0.4], [96, -196, 2.8, 2.0, 2.4, 1.3], [-96, 252, 3.6, 2.4, 3.0, 2.0], [140, 286, 3.0, 2.0, 2.6, 0.2], [198, 112, 2.6, 1.9, 2.2, 2.6], [-212, -136, 3.2, 2.1, 2.5, 0.9]]) if (roadD(x, z) > 7 && G.hf(x, z) > 0) REALM.block(x, z, a, b, c, 0.3 + rs() * 0.3, ry, 0.25 - rs() * 0.5, 0.6);
    // ---- camps
    L.camps = { w: REALM.camp(L, -96, 44, 0.6), e: REALM.camp(L, 112, -34, -1.0), n: REALM.camp(L, 62, 384, 2.4), s: REALM.camp(L, -30, -214, 2.0, { tents: [[-4.2, -2.0, 0.4], [3.6, 3.6, 1.9]] }) };
    REALM.watch(L, -106, 56, 0.6); REALM.watch(L, 74, 392, 2.4); REALM.watch(L, 34, 134, 0.2);
    WORLD.dressing(L, (L._stores || []).concat(L.gateStores || []), { seed: 'realmStores' });
    for (const g of [[-49, -149], [20, 64]]) REALM.smoke(L, g[0], gy(g[0], g[1]) + 0.8, g[1], { k: 1.1 });
    REALM.smoke(L, -142, 92, -198, { k: 1.6 }); REALM.smoke(L, 0, gy(0, 470) + 20, 500, { k: 1.4 });
    REALM.smokeBuild(L);
    // ---- undergrowth
    REALM.flora(L, G, { bounds: [-330, -345, 330, 540], road: LIM.ROAD, ok: (x, z, rd) => roadD(x, z) > rd && !clear(x, z, 0.5) && LIM.ok(G, x, z, { road: rd, slope: 0.5 }) && z + LIM.wC(x) < 468 });
    REALM.flowers(L, G, {});
    // ---- great trees: a few old giants standing over the fields
    { const big = [], GREEN = [0x4a5628, 0x56622e, 0x424e26], GOLD = [0xa08636, 0xb09440];
      for (let i = 0; i < 900 && big.length < 26; i++) { const x = -310 + rs() * 620, z = -330 + rs() * 760; if (clear(x, z, 1.25) || !LIM.ok(G, x, z, { road: 11, slope: 0.3 }) || big.some((b) => Math.hypot(b[0] - x, b[1] - z) < 60)) continue; big.push([x, z, 1.0 + rs() * 0.35, rs() * TAU, rs() < 0.3 ? GOLD[rs() * 2 | 0] : GREEN[rs() * 3 | 0]]); }
      WORLD.trees(L, big, { kinds: 2, h: 27, seed: 400 }); L.bigTrees = big; }
    WORLD.rocksEnd(L);
    // ---- the living things that need no fight
    LIFE.birds(L, { n: 84, flocks: [[-142, 104, -198, 62], [10, 74, -150, 90], [150, 58, -60, 110], [0, 150, 506, 120], [40, 78, 130, 80], [-80, 60, 40, 70]], ground: [[12, -252], [-28, -128], [26, -6], [4, 138], [132, -56], [-22, 334], [-70, -30], [92, 60]] });
    LIFE.leaves(L, { n: 260 });
    LIFE.dragon(L, {});
    REALM.far(L, G);
  };
  def.onStart = function (L, cp) {
    s0(L, cp);
    LIFE.herds(L, [['sheep', -34, -258, 6], ['sheep', -70, -112, 7], ['sheep', 74, -8, 6], ['sheep', -96, 150, 7], ['deer', 150, 84, 5], ['deer', 226, 170, 4], ['deer', -126, 330, 5], ['sheep', 70, 250, 6], ['deer', -214, -96, 4], ['sheep', 132, -146, 5]]);
    if (MG.titleMode) return;
    const sp = WORLD.spawn;
    // the camps
    // (camp folk stand round their fire, in the camp's own frame: clear of the tents)
    const at = (c, lx, lz) => c.P(lx, lz), cs = (type, c, lx, lz, o) => { const p = at(c, lx, lz); return sp(type, p[0], p[1], Object.assign({ yaw: Math.atan2(c.P(0, 0)[0] - p[0], c.P(0, 0)[1] - p[1]) }, o || {})); }, C = L.camps;
    cs('soldier', C.w, 1.9, -1.3); cs('footman', C.w, -1.7, 1.9); { const p = at(C.w, 3.0, 2.8); sp('soldier', p[0], p[1], { yaw: -2, patrol: [[p[0], p[1]], [-76, 66], [-104, 70], [-112, 46]] }); } sp('archer', -106, 56, { yaw: 0.6 });
    cs('soldier', C.e, 1.9, -1.3); cs('footman', C.e, -1.7, 1.9); { const p = at(C.e, 3.0, 2.8); sp('knight', p[0], p[1], { yaw: 2, patrol: [[p[0], p[1]], [132, -22], [104, -18]] }); }
    cs('soldier', C.n, 1.9, -1.3); cs('soldier', C.n, -1.7, 1.9); cs('footman', C.n, 3.0, 2.8); sp('archer', 74, 392, { yaw: 2.4 });
    cs('noble', C.s, 1.8, -1.0); cs('noble', C.s, -1.6, 1.6);
    // the road watch
    sp('soldier', 6, 100, { yaw: 0, patrol: [[6, 100], [1, 142], [9, 118]] }); sp('archer', 34, 134, { yaw: PI });
    { const ch = (c, give, id) => { const p = c.P(-0.6, -3.6); WORLD.chest(L, p[0], p[1], c.yaw + PI, give, { id }); }; ch(C.w, [['short_spear', 1], ['rune1', 2]], 'cmpW'); ch(C.e, [['shield_kite', 1], ['fire_pot', 2]], 'cmpE'); ch(C.n, [['set_soldier', 1], ['stone1', 2]], 'cmpN'); }
    // the caravan: two trolls in harness on the road below Gatefront
    LIFE.caravan(L, (lane) => REALM.track([30.2, -33], [25.2, 20], 2.4 + lane), { give: [['lordsworn_gs', 1], ['rune3', 2]] });
    const area = (x0, z0, x1, z1, name) => LEVEL.trigger(x0, z0, x1, z1, () => HUD.area(name));
    area(-116, 26, -78, 66, 'FORLORN CAMP'); area(96, -52, 130, -16, 'LAKESIDE CAMP'); area(44, 366, 82, 402, 'STORMHILL CAMP'); area(-110, -50, -58, -4, 'THE FALLEN ARCADE');
  };
})();
/* a racetrack round a stretch of road: up one side, round the head, back down the other */
REALM.track = function (A, B, off) {
  const dx = B[0] - A[0], dz = B[1] - A[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, nx = uz, nz = -ux, n = Math.ceil(l / 7), P = [];
  for (let i = 0; i <= n; i++) P.push([A[0] + ux * l * i / n + nx * off, A[1] + uz * l * i / n + nz * off]);
  for (let k = 1; k < 6; k++) { const a = k / 6 * PI; P.push([B[0] + nx * off * Math.cos(a) + ux * Math.abs(off) * Math.sin(a), B[1] + nz * off * Math.cos(a) + uz * Math.abs(off) * Math.sin(a)]); }
  for (let i = 0; i <= n; i++) P.push([B[0] - ux * l * i / n - nx * off, B[1] - uz * l * i / n - nz * off]);
  for (let k = 1; k < 6; k++) { const a = k / 6 * PI; P.push([A[0] - nx * off * Math.cos(a) - ux * Math.abs(off) * Math.sin(a), A[1] - nz * off * Math.cos(a) - uz * Math.abs(off) * Math.sin(a)]); }
  return P;
};
/* cloud shadows: full over the open country, lighter under the storm, none underground */
(function () { for (const [id, k] of [['cave', 0], ['margit', 0.7], ['stormveil', 0.55]]) { const def = LEVEL.defs[id]; if (!def) continue; const b0 = def.build; def.build = async function (L) { WORLD.CLOUD[1] = k; const r = await b0(L); if (id === 'cave') R.G.rays = 0; return r; }; } })();

/* ------------------------------------------------------------------ STORMVEIL: a garrisoned castle, not an empty yard */
/* timber scaffolding against a wall: posts, ledgers, plank decks */
REALM.scaffold = function (x, z, yaw, len, levels, y) {
  const M = WORLD.M(), c = Math.cos(yaw), s = Math.sin(yaw), P = (l, h, d) => [x + l * c + d * s, y + h, z - l * s + d * c], n = Math.max(2, Math.round(len / 2.6));
  for (let i = 0; i <= n; i++) { const l = -len / 2 + i * len / n; for (const d of [0, 1.5]) KIT.beam(P(l, -0.2, d), P(l, levels * 2.5 + 0.9, d), 0.14, M.wood); if (i < n && i % 2 === 0) KIT.beam(P(l, 0.2, 1.5), P(l + len / n, 2.5, 1.5), 0.08, M.wood); }
  for (let k = 1; k <= levels; k++) { const h = k * 2.5; KIT.beam(P(-len / 2, h, 0), P(len / 2, h, 0), 0.1, M.wood); KIT.beam(P(-len / 2, h, 1.5), P(len / 2, h, 1.5), 0.1, M.wood); KIT.beam(P(-len / 2, h + 1.0, 1.5), P(len / 2, h + 1.0, 1.5), 0.07, M.wood);
    for (let q = 0; q < 3; q++) { const d = 0.28 + q * 0.47, a = P(-len / 2 + (q === 1 && k === levels ? 1.4 : 0), h + 0.09, d), b = P(len / 2 - (q === 2 ? 0.8 : 0), h + 0.09, d); KIT.beam(a, b, 0.07, M.wood); } }
  PHY.obox(x + 0.75 * s, z + 0.75 * c, len / 2, 0.9, y, y + 2.2, yaw);
};
/* a weapon rack: spears leaning in a frame */
REALM.rack = function (x, z, yaw, y) {
  const M = WORLD.M(), c = Math.cos(yaw), s = Math.sin(yaw), P = (l, h, d) => [x + l * c + d * s, y + h, z - l * s + d * c];
  for (const l of [-1.1, 1.1]) { KIT.beam(P(l, 0, -0.35), P(l, 1.5, 0), 0.08, M.wood); KIT.beam(P(l, 0, 0.35), P(l, 1.5, 0), 0.08, M.wood); } KIT.beam(P(-1.2, 1.45, 0), P(1.2, 1.45, 0), 0.07, M.wood); KIT.beam(P(-1.2, 0.5, -0.22), P(1.2, 0.5, -0.22), 0.06, M.wood);
  for (let i = 0; i < 5; i++) { const l = -0.8 + i * 0.4; KIT.beam(P(l, 0.02, -0.5), P(l, 2.5, 0.06), 0.035, M.wood); KIT.beam(P(l, 2.5, 0.06), P(l, 2.9, 0.14), 0.045, M.iron); }
  PHY.obox(x, z, 1.2, 0.4, y, y + 1.4, yaw);
};
(function () {
  const def = LEVEL.defs.stormveil, b0 = def.build; def.models.push('tuft_c', 'fern_a', 'shrub_d');
  Object.defineProperty(def, 'photo', { get: () => AST.BASE_SETS.concat(['hessian']) });
  def.build = async function (L) {
    await b0(L);
    const G = L.G, M = WORLD.M(), W = STV.W, F = STV.floor;
    // the far crag and the land below the walls
    { const cs0 = KIT.cellSize; KIT.cellSize = 1e5; WORLD.outer(L, G, STV.h, { res: 22, range: 1100, land: (x, z) => (z > 200 ? 1 : 0.25) }); KIT.cellSize = cs0; }
    // the gate ward: a garrison's camp under the south wall, wagons, racks, scaffolds on the curtain
    for (const [x, z, a] of [[-25, 75, 0.1], [-17, 77, -0.2], [23, 76, 0.2], [29, 68, 1.4], [-28, 26, 1.7]]) LIM.tent(L, x, z, a);
    for (const [x, z, a, y] of [[-21, 38, 0.7, 0], [-17, 122, 0.3, 9], [-24, 158, 1.9, 9]]) { const c = LIFE.carriage(); c.position.set(x, y - 0.03, z); c.rotation.y = a; LEVEL.add(c); PHY.obox(x, z, 1.7, 2.9, y, y + 2.6, a); }
    REALM.scaffold(-W + 1.3, 50, -HALF, 14, 3, 0); REALM.scaffold(W - 1.3, 22, HALF, 12, 2, 0); REALM.scaffold(-W + 1.3, 128, -HALF, 16, 3, 9); REALM.scaffold(W - 1.3, 150, HALF, 12, 3, 9); REALM.scaffold(-20, 205.6 - 3.2, PI, 12, 2, 19);
    for (const [x, z, a, y] of [[-8, 14, 0.3, 0], [22, 46, 1.8, 0], [-30, 46, 1.5, 0], [-32, 92, 0.2, 9], [31, 110, 1.6, 9], [33, 140, 1.6, 9], [-10, 180, 0.4, 19], [26, 200, 0.1, 19]]) REALM.rack(x, z, a, y);
    // banners down the inner faces of the curtain, torches between them
    for (const [z0, z1, fl] of [[10, 78, 0], [92, 168, 9], [180, 198, 19]]) { let k = 0; for (let z = z0; z <= z1; z += 17) { for (const sd of [-1, 1]) { const x = sd * (W - 0.72); if (k % 2 === (sd > 0 ? 0 : 1)) WORLD.banner(L, x, fl + 11, z, sd * HALF, 1.9, 6.5); else WORLD.torch(L, sd * (W - 0.9), fl + 3.2, z, 0, { range: 11, i: 4 }); } k++; } }
    // fires and their smoke
    for (const [x, z, y] of [[-21, 70, 0], [26, 72, 0], [-18, 100, 9], [22, 140, 9]]) { WORLD.fire(L, x, y + 0.1, z, 0.8, { range: 11, i: 4 }); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; KIT.rbox(x + Math.cos(a) * 0.55, y + 0.1, z + Math.sin(a) * 0.55, 0.14, 0.12, 0.12, 0, a, 0, M.dark, 0.03); } REALM.smoke(L, x, y + 0.8, z, { k: 0.9 }); }
    REALM.smoke(L, 0, 100, 292, { k: 2.2 }); REALM.smoke(L, -30, 80, 286, { k: 1.4 });
    REALM.smokeBuild(L);
    // weeds through the cobbles, thick along the walls
    REALM.flora(L, G, { bounds: [-W + 1, 3, W - 1, 262], drifts: 0, tufts: 3200, road: [], cell: 70, far: 56,
      ok: (x, z) => { const ax = Math.abs(x); if (ax < 9.5 && z > 58 && z < 88) return false; if (x > 10 && x < 30 && z > 148 && z < 178) return false; if (Math.abs(z - 84.6) < 3 || Math.abs(z - 174.6) < 3 || Math.abs(z - 204) < 3) return false; if (z > 208 && Math.hypot(x, z - 236) < 24) return false; return ax > 12 + 14 * fbm2(x * 0.11 + 4, z * 0.07, 2); } });
    LIFE.birds(L, { n: 56, flocks: [[0, 118, 292, 34], [0, 66, 120, 46], [-30, 86, 286, 20], [20, 52, 40, 40]], ground: [[-10, 30], [12, 44], [2, 104], [-20, 132], [8, 190], [24, 60]] });
    LIFE.leaves(L, { n: 220 });
  };
  const m = LEVEL.defs.margit, mb = m.build;
  m.build = async function (L) { await mb(L); LIFE.birds(L, { n: 40, flocks: [[0, 92, 170, 40], [0, 70, 40, 60], [-40, 60, 100, 30]], ground: [[-3, 20], [4, 64], [-2, 104]] }); LIFE.leaves(L, { n: 240 }); };
})();

/* the names on the map */
LEVEL.defs.limgrave.mapMarks = [[0, -306, 'The First Step', 'place'], [-46, -152, 'Church of Elleh', 'ruin'], [22, 62, 'Gatefront Ruins', 'ruin'], [0, 174, 'Stormgate', 'castle'], [-38, 300, 'Stormhill Shack', 'place'], [176, -112, 'Dragon-Burnt Ruins', 'ruin'], [-176, -40, 'Groveside Cave', 'cave'], [0, 500, 'Stormveil Castle', 'castle'], [-142, -198, 'The Crag Keep', 'castle'],
  [-96, 44, 'Forlorn Camp', 'camp'], [112, -34, 'Lakeside Camp', 'camp'], [62, 384, 'Stormhill Camp', 'camp'], [-84, -26, 'The Fallen Arcade', 'ruin'], [210, -56, 'Agheel Lake', 'place'],
  [210, 30, 'MISTWOOD', 'region'], [-160, 110, 'LIMGRAVE', 'region'], [150, 430, 'STORMHILL', 'region']];
LEVEL.defs.stormveil.mapMarks = [[0, 40, 'Gate Ward', 'place'], [0, 128, 'Rampart Court', 'place'], [0, 190, 'Secluded Court', 'place'], [0, 236, 'The Yard of Graves', 'place'], [0, 292, 'The Keep', 'castle']];
