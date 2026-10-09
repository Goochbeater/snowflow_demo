/* ==== p56_or_world.js ==== */
/* OPUS RING — the Lands Between. Sky and the Erdtree, wind-blown grass, golden trees, ruin and castle masonry,
   Sites of Grace, fog walls, items, messages, water — and the bookkeeping that lets a rest at grace put every foe back. */
const WORLD = { T: 0 };
/* ------------------------------------------------------------------ sky */
WORLD.sky = function (L, o) {
  o = o || {};
  const S = (o.sun || new THREE.Vector3(0.74, 0.34, 0.58)).clone().normalize(), E = (o.tree || new THREE.Vector3(0.62, 0.16, 0.77)).clone().normalize(), storm = o.storm || 0, night = o.night || 0;
  const U = { uT: { value: 0 }, uS: { value: S }, uE: { value: E }, uStorm: { value: storm }, uNight: { value: night } };
  const dome = SKY.dome(U, `uniform vec3 uS, uE; uniform float uStorm, uNight;
    void main(){ vec3 d = normalize(vD); float el = d.y;
      vec3 zen = mix(vec3(0.075, 0.18, 0.44), vec3(0.13, 0.155, 0.2), uStorm), hor = mix(vec3(0.46, 0.5, 0.52), vec3(0.42, 0.43, 0.42), uStorm), low = mix(vec3(0.48, 0.46, 0.4), vec3(0.3, 0.31, 0.32), uStorm);
      vec3 c = mix(hor, zen, pow(smoothstep(-0.02, 0.55, el), 0.6)); c = mix(low, c, smoothstep(-0.12, 0.03, el));
      float a = max(dot(d, uS), 0.0), e = max(dot(d, uE), 0.0);
      c += vec3(1.0, 0.66, 0.3) * pow(a, 5.0) * 0.3 * (1.0 - uStorm * 0.7);
      c += vec3(1.0, 0.55, 0.14) * (pow(e, 5.0) * 0.26 + pow(e, 40.0) * 0.2) * smoothstep(-0.1, 0.1, el);               // the Erdtree lights its quarter of the sky
      // clouds: two drifting layers, lit gold on the Erdtree side, grey-blue bellies
      vec2 cp = d.xz / max(0.1, el + 0.16);
      float c1 = fb(cp * 1.1 + vec2(uT * 0.006, 0.0)), c2 = fb(cp * 2.6 + vec2(-uT * 0.01, 3.1));
      float cov = mix(0.5, 0.26, uStorm);
      float cl = smoothstep(cov, cov + 0.3, c1 * 0.7 + c2 * 0.35) * smoothstep(-0.02, 0.1, el);
      vec3 lit = mix(vec3(0.95, 0.88, 0.76), vec3(0.52, 0.54, 0.58), uStorm) + vec3(0.9, 0.5, 0.14) * pow(e, 3.0) + vec3(0.7, 0.45, 0.2) * pow(a, 4.0) * (1.0 - uStorm);
      vec3 shade = mix(vec3(0.33, 0.38, 0.5), vec3(0.14, 0.16, 0.19), uStorm);
      vec3 cc = mix(lit, shade, smoothstep(0.3, 0.9, c2 + c1 * 0.4));
      c = mix(c, cc, cl * mix(0.82, 0.96, uStorm));
      c *= 1.0 - uNight * 0.86;
      gl_FragColor = vec4(c, 1.0); }`);
  LEVEL.add(dome); L.updates.push((dt, t) => { dome.position.copy(R.camera.position); U.uT.value = t; });
  const env = new THREE.Scene(); env.add(new THREE.Mesh(dome.geometry, dome.material));
  const g = new THREE.Mesh(new THREE.CircleGeometry(300, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.22, 0.26, 0.12).multiplyScalar(1 - night * 0.8) })); g.rotation.x = -HALF; g.position.y = -3; env.add(g);
  L.env = env; L.sunDir = S; L.treeDir = E;
  const k = 1 - storm * 0.62 - night * 0.9;
  R.setSun(S.clone(), storm > 0.5 ? 0xe6dcc8 : 0xffd29a, (o.sunI || 3.3) * k, storm > 0.5 ? 0x9aa4b6 : 0xa6bade, storm > 0.5 ? 0x66645c : 0x8a8258, (o.hemi || 0.95) * (1 - night * 0.75));
  L.sunCol = R.sun.color.clone().multiplyScalar(R.sun.intensity / Math.PI);
  R.G.exposure = o.exposure || 1.0; R.G.bloom = 0.24; R.G.bloomThr = 1.0; R.G.sat = 1.06; R.G.contrast = 1.08; R.G.vig = 0.4; R.G.ca = 0.12; R.G.haze = 0;
  CM.fillU.value.setRGB(0.5, 0.47, 0.42).multiplyScalar(1 - night * 0.5); CM.rimU.value.setRGB(0.95, 0.72, 0.4).multiplyScalar(1 - storm * 0.4);
  R.setShadowBox(o.shadow || 46, 220); R.G.vol = o.vol !== undefined ? o.vol : 0.5; R.G.volDen = 0.0034; R.G.volFall = 0.035; R.G.volH = o.volH || 0; R.G.volOut = 1.0; R.G.volG = 0.72; R.G.volMax = 110; R.G.volAmb.setRGB(0.003, 0.003, 0.0025); R.G.volTint.setRGB(1.0, 0.9, 0.68);
  R.G.gShadow.setRGB(0.92, 0.98, 1.1); R.G.gHigh.setRGB(1.07, 1.0, 0.88);
  const fc = storm > 0.5 ? new THREE.Color(0.36, 0.38, 0.4) : new THREE.Color(0.5, 0.47, 0.4); fc.multiplyScalar(1 - night * 0.85);
  R.scene.fog = new THREE.FogExp2(fc, o.fog || 0.0011);
  return { dome, U };
};
/* ------------------------------------------------------------------ the Erdtree: a mountain of golden light on the horizon */
WORLD.erdtree = function (L, o) {
  o = o || {}; const rs = MG.rs('erdtree'), P = [], C = [], tips = [], H = o.h || 640;
  const col = new THREE.Color(), lit = V3(-0.4, 0.5, -0.6).normalize();
  const tube = (a, b, r0, r1, seg) => { seg = seg || 7; const d = b.clone().sub(a), Lh = d.length(); d.normalize(); const q = new THREE.Quaternion().setFromUnitVectors(YUP, d);
    for (let i = 0; i < seg; i++) { const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
      const p = (ang, top) => V3(Math.cos(ang) * (top ? r1 : r0), top ? Lh : 0, Math.sin(ang) * (top ? r1 : r0)).applyQuaternion(q).add(a);
      const n = V3(Math.cos((a0 + a1) / 2), 0.1, Math.sin((a0 + a1) / 2)).applyQuaternion(q), sh = 0.5 + 0.5 * Math.max(0, n.dot(lit));
      for (const v of [p(a0, 0), p(a1, 1), p(a1, 0), p(a0, 0), p(a0, 1), p(a1, 1)]) { P.push(v.x, v.y, v.z); const hz = smooth(0, H * 0.34, v.y); col.setRGB(lerp(0.5, 1.3, hz) * sh, lerp(0.44, 0.72, hz) * sh, lerp(0.3, 0.12, hz) * sh); C.push(col.r, col.g, col.b); } } };
  const branch = (p, dir, len, r, depth) => {
    let q = p.clone(), d = dir.clone(); const n = depth === 0 ? 5 : 3;
    for (let i = 0; i < n; i++) { const nd = d.clone().add(V3(rs() - 0.5, (rs() - 0.5) * 0.4 + (depth > 2 ? -0.06 : 0.06), rs() - 0.5).multiplyScalar(depth === 0 ? 0.1 : 0.34)).normalize(); const e = q.clone().addScaledVector(nd, len / n);
      tube(q, e, r * (1 - i / n * 0.36), r * (1 - (i + 1) / n * 0.36), depth < 2 ? 9 : 5); q = e; d = nd; }
    if (depth >= 5) { tips.push(q); return; }
    const kids = depth === 0 ? 7 : depth < 4 ? 3 : 2;
    for (let k = 0; k < kids; k++) { const az = (k + rs() * 0.7) / kids * TAU, sp = depth === 0 ? 0.72 + rs() * 0.36 : 0.45 + rs() * 0.4;
      const side = V3(Math.cos(az), 0, Math.sin(az)), nd = d.clone().multiplyScalar(Math.cos(sp)).addScaledVector(side, Math.sin(sp)).normalize(); if (depth < 2) nd.y = Math.max(nd.y, 0.32);
      branch(q, nd.normalize(), len * (depth === 0 ? 0.74 : 0.72), r * (depth === 0 ? 0.4 : 0.62), depth + 1); }
    if (depth > 1 && depth < 4) tips.push(q);
  };
  branch(V3(0, 0, 0), V3(0.03, 1, 0.02).normalize(), H * 0.34, H * 0.066, 0);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rs(), r = H * (0.1 + rs() * 0.08); tube(V3(Math.cos(a) * r, -H * 0.05, Math.sin(a) * r), V3(Math.cos(a) * H * 0.02, H * (0.1 + rs() * 0.08), Math.sin(a) * H * 0.02), H * 0.03, H * 0.04, 6); }   // root flares
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeBoundingSphere();
  const grp = new THREE.Group(), me = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false })); me.frustumCulled = false; grp.add(me);
  // the crown: thousands of soft golden lights
  const PT = 16, N = tips.length * PT, pp = new Float32Array(N * 3), ps = new Float32Array(N), pc = new Float32Array(N * 3); let n = 0;
  for (const t of tips) for (let k = 0; k < PT; k++) { const r = H * 0.085 * Math.pow(rs(), 0.6), a = rs() * TAU, e = (rs() - 0.5) * PI; pp[n * 3] = t.x + Math.cos(a) * Math.cos(e) * r; pp[n * 3 + 1] = t.y + Math.sin(e) * r * 0.7; pp[n * 3 + 2] = t.z + Math.sin(a) * Math.cos(e) * r;
    ps[n] = H * (0.045 + rs() * 0.07); const w = 0.6 + rs() * 0.6; pc[n * 3] = 1.0 * w; pc[n * 3 + 1] = 0.52 * w; pc[n * 3 + 2] = 0.09 * w; n++; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aSize', new THREE.BufferAttribute(ps, 1)); pg.setAttribute('aCol', new THREE.BufferAttribute(pc, 3));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, uniforms: { uScale: { value: 600 }, uT: { value: 0 }, uI: { value: o.glow || 0.1 } },
    vertexShader: 'attribute float aSize; attribute vec3 aCol; uniform float uScale, uT; varying vec3 vC; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float tw = 0.8 + 0.2 * sin(uT * 0.7 + position.x * 0.05 + position.y * 0.07); vC = aCol * tw; gl_PointSize = min(240.0, aSize * uScale / max(1.0, -mv.z)); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uI; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float a = pow(max(0.0, 1.0 - r), 1.6); gl_FragColor = vec4(vC * a * uI, 1.0); }' });
  const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; pts.renderOrder = 2; grp.add(pts);
  // a wide halo behind it
  const hc = document.createElement('canvas'); hc.width = hc.height = 128; const hx = hc.getContext('2d'), hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64); hg.addColorStop(0, 'rgba(255,220,140,0.9)'); hg.addColorStop(0.3, 'rgba(255,190,90,0.35)'); hg.addColorStop(1, 'rgba(255,170,60,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false, color: new THREE.Color(0.62, 0.4, 0.12) }));
  halo.scale.set(H * 2.9, H * 2.2, 1); halo.position.set(0, H * 0.74, 0); halo.renderOrder = 1; grp.add(halo);
  const dir = (o.dir || L.treeDir || V3(0.62, 0, 0.77)).clone(); dir.y = 0; dir.normalize(); const D = o.dist || 1040, F = 0.93;
  LEVEL.add(grp);
  L.updates.push((dt, t) => { const c = R.camera.position; grp.position.set(c.x * F + dir.x * D, (o.y || -70), c.z * F + dir.z * D); pm.uniforms.uT.value = t; pm.uniforms.uScale.value = R.h / (2 * Math.tan(R.camera.fov * D2R / 2)); });
  return grp;
};
/* golden motes adrift on the wind (Erdtree leaves) */
WORLD.motes = function (L, o) {
  o = o || {}; const col = o.col || [2.2, 1.6, 0.5];
  L.updates.push((dt) => { if (RNG() > dt * (o.rate || 10)) return; const c = R.camera.position, a = RNG() * TAU, r = 3 + RNG() * 22;
    FX.puff(V3(c.x + Math.cos(a) * r, c.y + rnd(-1, 6), c.z + Math.sin(a) * r), 1, { add: true, size: 0.022, grow: 0.2, col, a: 0.7, life: 5, spread: 0.25, rise: -0.12, drag: 0.2, vel: V3(0.5, -0.12, 0.3) }); });
};
/* ------------------------------------------------------------------ grass */
/* painted blades for the grass cards: two variants side by side, pale so the shader can tint them */
WORLD.bladeTex = function () {
  if (WORLD._blade) return WORLD._blade;
  const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), rs = mulberry(4242);
  for (let v = 0; v < 2; v++) { const x0 = v * 256;
    x.save(); x.beginPath(); x.rect(x0 + 2, 0, 252, H); x.clip();
    for (let i = 0; i < 64; i++) { const bx = x0 + 22 + rs() * 212, h = H * (0.42 + rs() * 0.56) * (i < 40 ? 1 : 0.6), lean = (rs() - 0.5) * 70, w = 3.2 + rs() * 3.4, sh = 150 + rs() * 105 | 0;
      const g = x.createLinearGradient(0, H, 0, H - h); g.addColorStop(0, `rgb(${sh * 0.62 | 0},${sh * 0.62 | 0},${sh * 0.62 | 0})`); g.addColorStop(1, `rgb(${sh},${sh},${sh})`); x.fillStyle = g;
      x.beginPath(); x.moveTo(bx - w, H); x.quadraticCurveTo(bx - w * 0.6 + lean * 0.25, H - h * 0.55, bx + lean, H - h); x.quadraticCurveTo(bx + w * 0.6 + lean * 0.3, H - h * 0.5, bx + w, H); x.closePath(); x.fill(); }
    x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; WORLD._blade = t; return t;
};
WORLD.grass = function (L, G, o) {
  o = o || {}; const N = o.count || (MG.flags.q === 'low' ? 24000 : 50000), S = o.size || 46;
  // height + density map from the terrain grid: r = height, g = density (0 on roads, rock, steep ground, under water)
  const W = G.W, Hn = G.Hn, data = new Float32Array(W * Hn * 4);
  for (let j = 0; j < Hn; j++) for (let i = 0; i < W; i++) { const k = j * W + i, x = G.x0 + i * G.res, z = G.z0 + j * G.res, h = G.H[k];
    let den = (1 - sat(G.BL[k * 3] * 2.2)) * (1 - sat(G.BL[k * 3 + 1] * 3)) * smooth(0.8, 0.9, G.NY[k]); if (o.mask) den *= o.mask(x, z, h);
    { const i0 = Math.max(0, i - 1), i1 = Math.min(W - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(Hn - 1, j + 1); let dh = 0; for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) dh = Math.max(dh, Math.abs(G.H[jj * W + ii] - h)); if (dh > 1.6) den = 0; }   // no turf on the lip of a drop (the height map is interpolated across it)
    data[k * 4] = h; data[k * 4 + 1] = den; data[k * 4 + 2] = 0.5 + 0.5 * fbm2(x * 0.021 + 3, z * 0.021, 3); data[k * 4 + 3] = 1; }
  const tex = new THREE.DataTexture(data, W, Hn, THREE.RGBAFormat, THREE.FloatType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  // a tuft: two crossed cards of painted blades, each bending in two segments
  const P = [], I = [], UV = [];
  for (let b = 0; b < 2; b++) { const base = P.length / 3, SG = o.segs || 2;
    for (let s = 0; s <= SG; s++) for (const sd of [-1, 1]) { P.push(sd, s / SG, b); UV.push(sd * 0.5 + 0.5, s / SG); }
    for (let s = 0; s < SG; s++) { const q = base + s * 2; I.push(q, q + 1, q + 3, q, q + 3, q + 2); } }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  const off = new Float32Array(N * 4), rs = MG.rs(o.seed || 'grass'); for (let i = 0; i < N; i++) { off[i * 4] = rs() * S; off[i * 4 + 1] = rs() * S; off[i * 4 + 2] = rs(); off[i * 4 + 3] = rs(); }
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); g.instanceCount = N; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const U = { tH: { value: tex }, uExt: { value: new THREE.Vector4(G.x0, G.z0, 1 / (G.x1 - G.x0), 1 / (G.z1 - G.z0)) }, uCam: { value: new THREE.Vector3() }, uS: { value: S }, uT: { value: 0 }, uPl: { value: new THREE.Vector3() },
    uBase: { value: new THREE.Color(o.base || 0x4c5a22) }, uTip: { value: new THREE.Color(o.tip || 0x9aa64c) }, uDry: { value: new THREE.Color(o.dry || 0xc2ae62) }, uHt: { value: o.height || 0.36 }, uW: { value: new THREE.Vector3((o.w || [0.014, 0.0011])[0], (o.w || [0.014, 0.0011])[1], o.inner || 0) } };
  const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: WORLD.bladeTex(), alphaTest: 0.3 }); m.alphaToCoverage = true;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U); sh.uniforms.uSunD = { value: L.sunDir || new THREE.Vector3(0, 1, 0) }; sh.uniforms.uSunC = { value: L.sunCol || new THREE.Color(1, 1, 1) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      attribute vec4 aOff; uniform sampler2D tH; uniform vec4 uExt; uniform vec3 uCam, uPl; uniform float uS, uT, uHt; uniform vec3 uW; varying float vG; varying float vDry; varying float vFar;`)
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);')
      .replace('#include <begin_vertex>', `
        vec2 wp = aOff.xy + floor((uCam.xz - aOff.xy) / uS + 0.5) * uS;
        vec4 hm = texture2D(tH, (wp - uExt.xy) * uExt.zw);
        float dC = length(wp - uCam.xz);
        float fade = (1.0 - smoothstep(uS * 0.3, uS * 0.48, dC)) * smoothstep(0.25, 0.6, hm.g + (aOff.z - 0.5) * 0.3) * (uW.z > 0.0 ? smoothstep(uW.z * 0.6, uW.z, dC + (aOff.w - 0.5) * 2.0) : 1.0);
        float hh = uHt * (0.45 + 0.9 * aOff.z * aOff.z) * fade * (0.7 + 0.6 * hm.b) * (1.0 - 0.35 * smoothstep(uS * 0.2, uS * 0.45, dC));
        hh *= smoothstep(0.7, 1.9, length(vec3(wp.x, hm.r, wp.y) - uCam));   // never a blade across the lens
        float ang = aOff.w * 6.2832 + position.z * 1.5708; vec2 dir = vec2(cos(ang), sin(ang));
        float yy = position.y, bend = yy * yy;
        vec2 wind = vec2(sin(uT * 1.5 + wp.x * 0.23 + wp.y * 0.11), cos(uT * 1.2 + wp.y * 0.19 - wp.x * 0.07)) * 0.16 + vec2(0.3, 0.14) * (0.5 + 0.5 * sin(uT * 0.45 + wp.x * 0.035 + wp.y * 0.02));
        vec2 pl = wp - uPl.xz; float pd = length(pl); vec2 push = pd > 0.001 ? pl / pd * (1.0 - smoothstep(0.2, 1.3, pd)) * 0.7 : vec2(0.0);
        vec3 transformed = vec3(wp.x, hm.r, wp.y);
        transformed.xz += dir * position.x * (uW.x + dC * uW.y) + (wind * 0.5 + vec2(-dir.y, dir.x) * (aOff.z - 0.5) * 0.7 + push) * bend * hh;
        transformed.y += yy * hh * (1.0 - 0.3 * length(push));
        if (fade < 0.03) transformed.y -= 4000.0;   // no turf here: throw the tuft away rather than leave a degenerate sliver (they rasterised as white-hot specks)
        vG = yy; vDry = hm.b * 0.8 + aOff.w * 0.3; vFar = smoothstep(uS * 0.14, uS * 0.42, dC);
        { float fl = step(0.66, hm.b + (aOff.w - 0.5) * 0.2) * step(fract(aOff.z * 13.0), 0.16); float cx = step(0.5, fract(aOff.z * 7.0)), cy = step(0.34, fract(aOff.z * 3.0)); if (cx > 0.5 && cy < 0.5) cy = 1.0; if (fl > 0.5) { cx = 1.0; cy = 0.0; }
          vMapUv = vec2((uv.x + cx) * 0.5, (uv.y * 0.98 + 0.01 + cy) * 0.5); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBase, uTip, uDry; varying float vG; varying float vDry; varying float vFar;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 tx = diffuseColor.rgb; float tl = dot(tx, vec3(0.3, 0.6, 0.1)); vec3 tc = mix(uTip, uDry, smoothstep(0.55, 0.95, vDry)); vec3 gc = mix(tc * (tl / 0.11), tx * (dot(tc, vec3(0.3, 0.6, 0.1)) / 0.11), 0.3); diffuseColor.rgb = mix(gc, tx, smoothstep(0.45, 0.75, min(tx.r, min(tx.g, tx.b)))); }')
      .replace('#include <normal_fragment_maps>', 'normal = normalize(vNormal);')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ vec3 sv = normalize((viewMatrix * vec4(uSunD, 0.0)).xyz); float tr = pow(max(dot(-normalize(vViewPosition), sv), 0.0), 2.0); reflectedLight.directDiffuse += diffuseColor.rgb * uSunC * tr * 0.16 * vG; reflectedLight.directDiffuse = clamp(reflectedLight.directDiffuse, vec3(0.0), vec3(0.9)); reflectedLight.indirectDiffuse = clamp(reflectedLight.indirectDiffuse, vec3(0.0), vec3(0.9)); }');
    sh.fragmentShader = sh.fragmentShader.replace('uniform vec3 uBase, uTip, uDry;', 'uniform vec3 uBase, uTip, uDry, uSunD, uSunC;');
  };
  m.customProgramCacheKey = () => 'orgrass';
  const me = new THREE.Mesh(g, m); me.frustumCulled = false; me.receiveShadow = !!o.shadowed; me.castShadow = false; LEVEL.add(me);
  L.updates.push((dt, t) => { U.uCam.value.copy(R.camera.position); U.uT.value = t; if (PLAYER.a) U.uPl.value.set(PLAYER.a.x, PLAYER.a.y, PLAYER.a.z); });
  L.grassTex = tex; (L.grassTexs = L.grassTexs || []).push(tex);
  if (o.flowers !== 0) {   // small pale flowers in drifts: soft round points riding the same wrap-around field
    const NF = o.flowers || 2400, fp = new Float32Array(NF * 3), fo = new Float32Array(NF * 4); for (let i = 0; i < NF; i++) { fo[i * 4] = rs() * S; fo[i * 4 + 1] = rs() * S; fo[i * 4 + 2] = rs(); fo[i * 4 + 3] = rs(); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fg.setAttribute('aOff', new THREE.BufferAttribute(fo, 4)); fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const FU = { tH: U.tH, uExt: U.uExt, uCam: U.uCam, uS: U.uS, uT: U.uT, uHt: U.uHt, uPx: { value: 600 }, uLit: { value: new THREE.Color(0.8, 0.78, 0.66) }, uFogC: { value: new THREE.Color() }, uFogD: { value: 0.002 } };
    const fm = new THREE.ShaderMaterial({ uniforms: FU, transparent: false, fog: false, toneMapped: false,
      vertexShader: `attribute vec4 aOff; uniform sampler2D tH; uniform vec4 uExt; uniform vec3 uCam; uniform float uS, uT, uHt, uPx; varying float vK; varying float vD;
        void main(){ vec2 wp = aOff.xy + floor((uCam.xz - aOff.xy) / uS + 0.5) * uS; vec4 hm = texture2D(tH, (wp - uExt.xy) * uExt.zw); float dC = length(wp - uCam.xz);
          float keep = (1.0 - smoothstep(uS * 0.34, uS * 0.48, dC)) * smoothstep(0.3, 0.6, hm.g) * smoothstep(0.56, 0.64, hm.b + (aOff.w - 0.5) * 0.1);
          vec3 p = vec3(wp.x + sin(uT * 1.4 + wp.y) * 0.02, hm.r + uHt * (0.7 + 0.5 * aOff.z), wp.y); if (keep < 0.5) p.y -= 4000.0;
          vec4 mv = viewMatrix * vec4(p, 1.0); vK = aOff.z; vD = length(mv.xyz); gl_PointSize = clamp((0.016 + 0.016 * aOff.w) * uPx / max(0.5, -mv.z), 1.0, 6.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uLit, uFogC; uniform float uFogD; varying float vK; varying float vD;
        void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; vec3 c = mix(vec3(0.86, 0.84, 0.74), vec3(0.8, 0.68, 0.3), step(0.72, vK)) * uLit * (1.0 - 0.25 * smoothstep(0.1, 0.5, r));
          float f = 1.0 - exp(-uFogD * uFogD * vD * vD); gl_FragColor = vec4(mix(c, uFogC, f), 1.0); }` });
    const pts = new THREE.Points(fg, fm); pts.frustumCulled = false; LEVEL.add(pts);
    L.updates.push(() => { FU.uPx.value = R.h / (2 * Math.tan(R.camera.fov * D2R / 2)); if (R.scene.fog) { FU.uFogC.value.copy(R.scene.fog.color); FU.uFogD.value = R.scene.fog.density; } });
  }
  return me;
};
/* ------------------------------------------------------------------ trees (instanced: one trunk + one canopy draw per kind) */
WORLD.leafTex = function () {
  if (WORLD._leaf) return WORLD._leaf;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), rs = mulberry(41);
  for (let i = 0; i < 760; i++) { const a = rs() * TAU, r = Math.pow(rs(), 0.62) * 122 * (0.7 + 0.3 * Math.sin(a * 5 + 1) * Math.sin(a * 3)), px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r * 0.94, s = 2.2 + rs() * 3.6, l = 120 + rs() * 135 | 0;
    x.save(); x.translate(px, py); x.rotate(rs() * TAU); x.fillStyle = `rgb(${l},${l},${l})`; x.beginPath(); x.ellipse(0, 0, s, s * 0.45, 0, 0, TAU); x.fill(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; WORLD._leaf = t; return t;
};
WORLD.treeGeo = function (seed, o) {
  o = o || {}; const rs = mulberry(seed), TP = [], LP = [], LN = [], LU = [], FP = [], FN = [], FU = [];
  const tube = (a, b, r0, r1, sides) => { const len = a.distanceTo(b), ov = r0 * 0.5, g = new THREE.CylinderGeometry(r1, r0, len + ov * 2, r0 > 0.5 ? 10 : (sides || 6), 1, true); g.translate(0, len / 2, 0);
    { const uv = g.attributes.uv, ku = Math.max(1, Math.round(TAU * r0 / 1.4)), kv = Math.max(1, len / 1.4); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * ku, uv.getY(i) * kv); } g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YUP, b.clone().sub(a).normalize())); g.translate(a.x, a.y, a.z); TP.push(g); };
  const tips = [], H = o.h || 9;
  // a slender, slightly crooked trunk; boughs that lift and spread; twigs out to the leaf sprays
  const grow = (p, d, len, r, depth) => { const mid = p.clone().addScaledVector(d, len * 0.5).add(V3(rs() - 0.5, 0, rs() - 0.5).multiplyScalar(len * 0.12)), e = p.clone().addScaledVector(d, len).add(V3(rs() - 0.5, 0, rs() - 0.5).multiplyScalar(len * 0.1));
    if (depth >= 3) tube(p, e, r, r * 0.66, 3); else { tube(p, mid, r, r * 0.84, depth === 2 ? 4 : 6); tube(mid, e, r * 0.84, r * 0.66, depth === 2 ? 4 : 6); } if (depth >= 4) { tips.push([e, 1]); return; }
    const n = depth === 0 ? 3 + (rs() * 2 | 0) : 2 + (rs() < 0.45 ? 1 : 0); for (let k = 0; k < n; k++) { const az = (k + rs()) / n * TAU, sp = (depth === 0 ? 0.36 : 0.5) + rs() * 0.5; const nd = d.clone().multiplyScalar(Math.cos(sp)).addScaledVector(V3(Math.cos(az), 0.5, Math.sin(az)), Math.sin(sp)).normalize(); grow(e, nd, len * (0.62 + rs() * 0.2), r * 0.58, depth + 1); }
    if (depth > 0) tips.push([e, 0.85]); if (depth > 1) tips.push([mid, 0.7]); };
  grow(V3(0, -0.4, 0), V3((rs() - 0.5) * 0.25, 1, (rs() - 0.5) * 0.25).normalize(), H * (o.bush ? 0.1 : 0.36), H * (o.bush ? 0.02 : 0.03), o.bush ? 1 : 0);
  let cy = 0; for (const t of tips) cy += t[0].y; const cen = V3(0, cy / Math.max(1, tips.length) - H * 0.1, 0);
  if (!o.bare) for (const [t, k0] of tips) for (let k = 0; k < 2; k++) { const c = t.clone().add(V3(rs() - 0.5, rs() - 0.4, rs() - 0.5).multiplyScalar(H * 0.11)), s = H * (0.09 + rs() * 0.07) * k0;
    const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(rs() * PI, rs() * PI, rs() * PI)), n = c.clone().sub(cen).normalize().lerp(V3(0, 1, 0), 0.45).normalize(), sh = 0.55 + 0.45 * sat((c.y - cen.y) / (H * 0.3) * 0.5 + 0.5);
    if (k === 0 && k0 === 1) { const s2 = s * 2.1, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rs() * PI, 0));   // the far tree: one broad upright card per spray
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { const p = V3(u * s2, v * s2 * 0.8, 0).applyQuaternion(q).add(c); FP.push(p.x, p.y, p.z); FN.push(n.x * sh, n.y * sh, n.z * sh); FU.push((u * 0.5 + 0.5) * 0.5 + (k0 > 0.9 ? 0.5 : 0), (v * 0.5 + 0.5) * 0.5 + 0.5); } }
    const cu = rs() < 0.5 ? 0 : 0.5, cv = rs() < 0.5 ? 0 : 0.5;
    for (const ax of [[0, 0, 0], [HALF, 0, 0], [0, HALF, 0]]) { const q = q0.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(ax[0], ax[1], ax[2]))), fl = rs() < 0.5 ? 1 : -1;   // three crossed cards: a spray with volume from every side
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { const p = V3(u * s, v * s, 0).applyQuaternion(q).add(c); LP.push(p.x, p.y, p.z); LN.push(n.x * sh, n.y * sh, n.z * sh); LU.push((fl * u * 0.5 + 0.5) * 0.5 + cu, (v * 0.5 + 0.5) * 0.5 + cv); } } }
  const trunk = ARM.merge(TP); const leaves = new THREE.BufferGeometry();
  leaves.setAttribute('position', new THREE.Float32BufferAttribute(LP, 3)); leaves.setAttribute('normal', new THREE.Float32BufferAttribute(LN, 3)); leaves.setAttribute('uv', new THREE.Float32BufferAttribute(LU, 2));
  const far = new THREE.BufferGeometry(); far.setAttribute('position', new THREE.Float32BufferAttribute(FP, 3)); far.setAttribute('normal', new THREE.Float32BufferAttribute(FN, 3)); far.setAttribute('uv', new THREE.Float32BufferAttribute(FU, 2));
  return { trunk, leaves, far };
};
/* list: [x, z, scale, yaw, tint(hex)] */
WORLD.trees = function (L, list, o) {
  o = o || {}; if (!list.length) return;
  const bark = WORLD._bark || (WORLD._bark = new THREE.MeshStandardMaterial({ map: TEX.sets.bark.map, normalMap: TEX.sets.bark.normalMap, roughness: 0.95, color: 0xd8d0c0, envMapIntensity: 0.4 }));
  const lt = WORLD.leafTex(), U = { uT: { value: 0 } };
  const lm = new THREE.MeshLambertMaterial({ map: lt, alphaTest: 0.42, side: THREE.DoubleSide });
  lm.alphaToCoverage = true; lm.alphaTest = 0.34;
  lm.onBeforeCompile = (sh) => { if (typeof HL !== 'undefined' && HL.NEARFADE) sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', HL.NEARFADE); sh.uniforms.uT = U.uT; sh.uniforms.uSunD = { value: L.sunDir || new THREE.Vector3(0, 1, 0) }; sh.uniforms.uSunC = { value: L.sunCol || new THREE.Color(1, 1, 1) };
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSunD, uSunC;').replace('#include <color_fragment>', '{ float tl = dot(diffuseColor.rgb, vec3(0.3, 0.6, 0.1)) / 0.12; diffuseColor.rgb = mix(vColor * tl, diffuseColor.rgb * (dot(vColor, vec3(0.3, 0.6, 0.1)) / 0.12), 0.45) * 0.62; }').replace('#include <normal_fragment_maps>', 'float lOcc = clamp(length(vNormal), 0.0, 1.0); normal = normalize(vNormal);').replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ vec3 sv = normalize((viewMatrix * vec4(uSunD, 0.0)).xyz); float tr = pow(max(dot(-normalize(vViewPosition), sv), 0.0), 2.0); reflectedLight.directDiffuse += diffuseColor.rgb * uSunC * (0.12 + 0.26 * tr); reflectedLight.directDiffuse *= mix(0.5, 1.0, lOcc); reflectedLight.indirectDiffuse *= mix(0.6, 1.25, lOcc); }'); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec4 ip = instanceMatrix * vec4(position, 1.0); transformed += vec3(sin(uT * 1.3 + ip.x * 0.4 + ip.y * 0.6), cos(uT * 1.7 + ip.z * 0.5) * 0.5, cos(uT * 1.1 + ip.x * 0.3)) * 0.07; }'); };
  lm.customProgramCacheKey = () => 'orleaf';
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: lt, alphaTest: 0.34 });
  const kinds = o.kinds || 3, cell = {}, by = [], geos = [];   // one instanced batch per kind per 130 m cell, so camera and shadow frusta cull them
  list.forEach((t, i) => { const k = i % kinds, key = k + '|' + Math.floor(t[0] / 170) + '|' + Math.floor(t[1] / 170); if (!cell[key]) { cell[key] = []; cell[key].k = k; by.push(cell[key]); } cell[key].push(t); });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), lods = [];
  by.forEach((arr) => {
    const k = arr.k; if (!arr.length) return; const G = geos[k] || (geos[k] = WORLD.treeGeo(101 + k * 37 + (o.seed || 0), { h: (o.h || 10) + k * 1.5, bare: o.bare, bush: o.bush }));
    const tm = new THREE.InstancedMesh(G.trunk, bark, arr.length); tm.castShadow = true; tm.receiveShadow = true;
    const lmesh = o.bare ? null : new THREE.InstancedMesh(G.leaves, lm, arr.length); if (lmesh) { lmesh.castShadow = true; lmesh.receiveShadow = false; lmesh.customDepthMaterial = dm; }
    const fmesh = lmesh && !o.bush ? new THREE.InstancedMesh(G.far, lm, arr.length) : null; if (fmesh) { fmesh.castShadow = false; fmesh.receiveShadow = false; fmesh.visible = false; }
    arr.forEach((t, i) => { const y = (PHY.hf ? PHY.hf(t[0], t[1]) : 0) || 0, s = t[2] || 1; q.setFromAxisAngle(YUP, t[3] || 0); m4.compose(V3(t[0], y, t[1]), q, V3(s, s, s)); tm.setMatrixAt(i, m4); if (lmesh) { lmesh.setMatrixAt(i, m4); lmesh.setColorAt(i, col.set(t[4] || 0x6a8a34)); if (fmesh) { fmesh.setMatrixAt(i, m4); fmesh.setColorAt(i, col); } }
      if (!o.bush) PHY.cyl(t[0], t[1], 0.3 * s, y - 2, y + 5 * s); });
    tm.instanceMatrix.needsUpdate = true; tm.computeBoundingSphere(); LEVEL.add(tm); lods.push([tm, lmesh, tm.boundingSphere, fmesh]); if (fmesh) { fmesh.instanceMatrix.needsUpdate = true; fmesh.instanceColor.needsUpdate = true; fmesh.computeBoundingSphere(); LEVEL.add(fmesh); }
    if (lmesh) { lmesh.instanceMatrix.needsUpdate = true; lmesh.instanceColor.needsUpdate = true; lmesh.computeBoundingSphere(); LEVEL.add(lmesh); }
  });
  // far batches drop their trunks (hair-thin at that range) and far thickets go altogether
  L.updates.push((dt, t) => { U.uT.value = t; const c = R.camera.position; for (const [tm, lm2, bs, fm] of lods) { const d = Math.hypot(c.x - bs.center.x, c.z - bs.center.z) - bs.radius; tm.visible = d < (o.bush ? 90 : 300); if (lm2 && o.bush) lm2.visible = d < 240; if (fm) { const far = d > 70; fm.visible = far; lm2.visible = !far; } } });
};
/* ------------------------------------------------------------------ masonry */
WORLD.M = function () {
  if (WORLD._M) return WORLD._M;
  WORLD._M = { wall: TEX.mat('ashlar', { color: 0xc9c2b2, streak: 0.3, macro: 0.8 }), dark: TEX.mat('ashlar', { color: 0x9a958a, streak: 0.3, macro: 0.8 }), floor: TEX.mat('flag', { color: 0xb8b2a4 }), wood: TEX.mat('planks', { color: 0xa89880 }), roof: TEX.mat('flag', { color: 0x5a5c62, scale: 1.6 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2c2c30, metalness: 0.9, roughness: 0.5 }), gold: new THREE.MeshStandardMaterial({ color: 0xc9a04a, metalness: 1, roughness: 0.35 }) };
  WORLD._M.iron.userData.tscale = 1; WORLD._M.gold.userData.tscale = 1;
  return WORLD._M;
};
WORLD.gy = (x, z) => (PHY.hf ? PHY.hf(x, z) : 0) || 0;
/* a wall along a line. o: { h, t, y (base, default: lowest ground under it - 1), ragged (0..1 broken top), crenel, mat, gap: [[f0,f1],...] } */
WORLD.wall = function (ax, az, bx, bz, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || (o.ragged && M.ruin ? M.ruin : M.wall), L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), t = o.t || 0.9, h = o.h || 4;
  const n = Math.max(1, Math.round(L / (o.seg || (o.ragged ? 0.8 : 2.6)))), sd0 = (ax * 13 + az * 7 + bx * 3 + bz) * 0.37, rs = MG.rs('w' + (ax * 13 + az * 7 + bx * 3 + bz | 0));
  // a ruined wall's top follows a broken line: long slopes, a breach or two, courses stepping in thirds of a block
  const prof = (f) => clamp((fbm2(f * L * 0.11 + sd0, sd0 * 0.3, 2) - 0.3) * 2.1, 0, 1);
  let colA = null;
  for (let i = 0; i < n; i++) {
    const f0 = i / n, f1 = (i + 1) / n, fm = (f0 + f1) / 2; if (o.gap && o.gap.some((g) => fm > g[0] && fm < g[1])) continue;
    const cx = lerp(ax, bx, fm), cz = lerp(az, bz, fm), gy = o.y !== undefined ? o.y : Math.min(WORLD.gy(lerp(ax, bx, f0), lerp(az, bz, f0)), WORLD.gy(lerp(ax, bx, f1), lerp(az, bz, f1)), WORLD.gy(cx, cz)) - 0.8;
    let top = (o.top !== undefined ? o.top : gy + 0.8 + h); if (o.ragged) { const k = 1 - prof(fm); top -= Math.round(h * o.ragged * k * 1.25 / 0.6) * 0.6; if (top < gy + 1.1) { if (rs() < 0.5) continue; top = gy + 0.9 + rs() * 0.5; } }
    if (o.ragged) {   // slices of one wall share a continuous texture (u runs along the whole wall), so the stone courses line up
      const c = Math.cos(yaw), s = Math.sin(yaw), hl = L / n / 2 + 0.01, u0 = f0 * L, P = (lx, y, lz) => [cx + lx * c + lz * s, y, cz - lx * s + lz * c], uv = (side) => (p) => [u0 + ((p[0] - (cx - s * hl)) * s + (p[2] - (cz - c * hl)) * c) * 1 + side * 0.37, p[1]];
      KIT.quad(mat, P(t / 2, gy, hl), P(t / 2, gy, -hl), P(t / 2, top, -hl), P(t / 2, top, hl), [c, 0, -s], uv(0)); KIT.quad(mat, P(-t / 2, gy, -hl), P(-t / 2, gy, hl), P(-t / 2, top, hl), P(-t / 2, top, -hl), [-c, 0, s], uv(1));
      KIT.quad(mat, P(-t / 2, top, hl), P(t / 2, top, hl), P(t / 2, top, -hl), P(-t / 2, top, -hl), [0, 1, 0], (p) => [p[0], p[2]]);
      KIT.quad(mat, P(-t / 2, gy, hl), P(t / 2, gy, hl), P(t / 2, top, hl), P(-t / 2, top, hl), [s, 0, c], (p) => [p[0] + p[2], p[1]]); KIT.quad(mat, P(t / 2, gy, -hl), P(-t / 2, gy, -hl), P(-t / 2, top, -hl), P(t / 2, top, -hl), [-s, 0, -c], (p) => [p[0] + p[2], p[1]]);
    } else KIT.obox(cx, gy, cz, t / 2, top, L / n / 2 + 0.01, yaw, mat, { col: false });
    if (o.crenel && i % 2 === 0) KIT.obox(cx, top, cz, t / 2, top + 0.9, L / n / 2 * 0.62, yaw, mat, { col: false });
  }
  if (o.phy !== false) { const cx = (ax + bx) / 2, cz = (az + bz) / 2, gy = o.y !== undefined ? o.y : Math.min(WORLD.gy(ax, az), WORLD.gy(bx, bz), WORLD.gy(cx, cz)) - 0.8;
    if (o.gap) { let f = 0; for (const g of o.gap.concat([[1, 1]])) { if (g[0] > f + 0.02) { const m0 = (f + g[0]) / 2; PHY.obox(lerp(ax, bx, m0), lerp(az, bz, m0), t / 2, L * (g[0] - f) / 2, gy, gy + h * (o.ragged ? 0.6 : 1) + 0.8, yaw); } f = g[1]; } }
    else PHY.obox(cx, cz, t / 2, L / 2, gy, gy + h * (o.ragged ? 0.6 : 1) + 0.8, yaw); }
  // fallen stone at the foot of a ruin
  if (o.ragged && WORLD._rocks) for (let i = 0; i < Math.round(L / 3); i++) { const f = rs(), sd = rs() < 0.5 ? -1 : 1, d = t / 2 + 0.3 + rs() * 1.4, x = lerp(ax, bx, f) + Math.cos(yaw) * sd * d, z = lerp(az, bz, f) - Math.sin(yaw) * sd * d; WORLD.boulder(x, z, 0.25 + rs() * 0.4, (rs() * 1000) | 0, null, { col: false }); }
};
WORLD.column = function (x, z, h, r, o) {
  o = o || {}; const M = WORLD.M(), y = o.y !== undefined ? o.y : WORLD.gy(x, z) - 0.3, mat = o.mat || M.wall;
  KIT.box(x - r * 1.5, y, z - r * 1.5, x + r * 1.5, y + 0.5, z + r * 1.5, mat, { col: false });
  KIT.cyl(x, y + 0.5, z, r, h, mat, { seg: 14, r1: r * 0.9 });
  if (!o.broken) KIT.box(x - r * 1.45, y + 0.5 + h, z - r * 1.45, x + r * 1.45, y + 0.5 + h + 0.4, z + r * 1.45, mat, { col: false });
};
/* a round-headed arch across a wall line: piers + voussoirs (+ masonry above up to `top`) */
WORLD.arch = function (cx, cz, yaw, w, h, t, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.wall, y = o.y !== undefined ? o.y : WORLD.gy(cx, cz) - 0.5, c = Math.cos(yaw), s = Math.sin(yaw), pw = o.pier || 1.0;
  const P = (l) => [cx + l * c, cz - l * s];
  for (const sd of [-1, 1]) { const p = P(sd * (w / 2 + pw / 2)); KIT.obox(p[0], y, p[1], pw / 2, y + h + 0.5, t / 2, yaw, mat); }
  const n = 9, r = w / 2;
  for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * PI, lx = -Math.cos(a) * (r + 0.3), ly = Math.sin(a) * (r + 0.3); const p = P(lx);
    KIT.rbox(p[0], y + h + 0.5 + ly, p[1], (PI * (r + 0.3) / n) / 2 + 0.03, 0.34, t / 2 + 0.03, 0, yaw, HALF - a, mat, 0.05); }   // voussoirs lie along the curve
  if (o.top) { const p0 = P(0); KIT.obox(p0[0], y + h + 0.5 + r + 0.5, p0[1], w / 2 + pw, y + o.top, t / 2, yaw, mat, { col: !!o.solidTop }); }
};
/* round tower: drum + corbel ring + crenels (+ cone roof). */
WORLD.tower = function (x, z, r, h, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.wall, y = o.y !== undefined ? o.y : WORLD.gy(x, z) - 1.5;
  KIT.cyl(x, y, z, r, h, mat, { seg: 22, uvs: Math.round(TAU * r / 3.2) });
  KIT.cyl(x, y + h, z, r * 1.1, 0.8, mat, { seg: 22, col: false, r1: r * 1.12 });
  if (h > 14) { KIT.cyl(x, y, z, r * 1.16, Math.min(9, h * 0.2), mat, { seg: 22, col: false, r1: r * 1.0 });   // battered foot, string courses, a corbel table under the parapet
    for (let yy = y + h * 0.34; yy < y + h - 4; yy += Math.max(8, h * 0.22)) KIT.cyl(x, yy, z, r * 1.035, 0.55, mat, { seg: 22, col: false });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; KIT.obox(x + Math.sin(a) * r * 1.03, y + h - 1.3, z + Math.cos(a) * r * 1.03, 0.28, y + h, 0.3, a, mat, { col: false }); } }
  if (o.roof) { const rh = r * (o.roofH || 2.5), g = new THREE.ConeGeometry(r * 1.2, rh, 22); KIT.geo(g, M.roof, new THREE.Matrix4().makeTranslation(x, y + h + 0.8 + rh / 2, z), { uvs: 6, uvs2: 2 }); }
  else for (let i = 0; i < 12; i += 1) { if (i % 2) continue; const a = i / 12 * TAU; KIT.obox(x + Math.sin(a) * r * 1.04, y + h + 0.8, z + Math.cos(a) * r * 1.04, 0.7, y + h + 1.9, 0.3, a, mat, { col: false }); }
  if (o.windows) for (let k = 0; k < o.windows; k++) { const a = (o.wa || 0) + k * 1.3, yy = y + h * (0.35 + 0.22 * (k % 3)); KIT.obox(x + Math.sin(a) * r * 0.995, yy, z + Math.cos(a) * r * 0.995, 0.22, yy + 1.5, 0.08, a, o.lit ? KIT.emis(0xffb060, 1.6) : M.iron, { col: false }); }
};
/* a battlemented curtain wall with a walkway: full collider, merlons outside */
WORLD.curtain = function (ax, az, bx, bz, y0, top, t, o) {
  o = o || {}; const M = WORLD.M(), mat = o.mat || M.wall, L = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), cx = (ax + bx) / 2, cz = (az + bz) / 2;
  KIT.obox(cx, y0, cz, t / 2, top, L / 2, yaw, mat);
  const n = Math.round(L / 2.2), c = Math.cos(yaw), s = Math.sin(yaw);
  for (const sd of (o.sides || [1, -1])) for (let i = 0; i < n; i++) { if (i % 2) continue; const f = (i + 0.5) / n, px = lerp(ax, bx, f) + c * sd * (t / 2 - 0.3), pz = lerp(az, bz, f) - s * sd * (t / 2 - 0.3); KIT.obox(px, top, pz, 0.3, top + 1.0, L / n / 2, yaw, mat, { col: false }); }
  for (const sd of (o.sides || [1, -1])) PHY.obox(cx + c * sd * (t / 2 - 0.3), cz - s * sd * (t / 2 - 0.3), 0.3, L / 2, top, top + 1.0, yaw);
};
/* torch / brazier: a flickering flame and a warm light */
WORLD.flames = [];
WORLD.flameMat = function () {
  if (WORLD._fm) return WORLD._fm;
  WORLD._fm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'uniform float uT; varying vec2 vUv; varying float vS; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); vS = w.x * 3.1 + w.z * 1.7; vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); float sx = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2])), sy = length(vec3(modelMatrix[1][0], modelMatrix[1][1], modelMatrix[1][2])); float sway = sin(uT * 9.0 + vS) * 0.08 * uv.y; vec3 p = w.xyz + r * (position.x + sway) * sx + vec3(0.0, 1.0, 0.0) * position.y * sy; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv; varying float vS;
      float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 u = vUv; float t = uT * 2.4 + vS; float nz = n(vec2(u.x * 4.0, u.y * 3.0 - t * 1.6)) * 0.6 + n(vec2(u.x * 9.0 + 3.0, u.y * 7.0 - t * 2.6)) * 0.4;
        float w = (1.0 - u.y) * 0.5; float sh = 1.0 - smoothstep(w * 0.2, w, abs(u.x - 0.5) + (nz - 0.5) * 0.22 * u.y); sh *= smoothstep(0.0, 0.12, u.y) * (1.0 - smoothstep(0.45, 1.0, u.y + (nz - 0.5) * 0.5));
        vec3 c = mix(vec3(4.5, 1.2, 0.15), vec3(6.0, 4.2, 1.6), sh * (1.0 - u.y)); gl_FragColor = vec4(c * sh, 1.0); }` });
  return WORLD._fm;
};
WORLD.fire = function (L, x, y, z, size, o) {
  o = o || {}; const me = new THREE.Mesh(WORLD._fg || (WORLD._fg = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)), WORLD.flameMat()); me.position.set(x, y, z); me.scale.set(size * 0.9, size * 1.7, 1); me.renderOrder = 6; LEVEL.add(me);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + size * 0.6, z), col: new THREE.Color(o.col || 0xff8a3a), i: (o.i || 3.2) * 3.2, range: (o.range || 9) * 1.3, prio: o.prio || 1, on: true });
  const i0 = Lt.i, ph = x * 3.3 + z;
  if (!L._fireUp) { L._fireUp = true; L.updates.push((dt, t) => { WORLD.flameMat().uniforms.uT.value = t; }); }
  L.updates.push((dt, t) => { Lt.i = i0 * (L.lightK || 1) * (0.82 + 0.12 * Math.sin(t * 11 + ph) + 0.08 * Math.sin(t * 23.7 + ph * 2)); });
  return me;
};
WORLD.torch = function (L, x, y, z, yaw, o) { o = o || {}; const M = WORLD.M(); KIT.rbox(x, y - 0.25, z, 0.03, 0.3, 0.03, 0, yaw || 0, 0.0, M.iron, 0.01); KIT.cyl(x, y + 0.02, z, 0.09, 0.12, M.iron, { seg: 8, col: false, r1: 0.13 }); return WORLD.fire(L, x, y + 0.1, z, 0.42, { range: o.range || 8, i: o.i || 2.8 }); };
WORLD.brazier = function (L, x, z, o) { o = o || {}; const M = WORLD.M(), y = o.y !== undefined ? o.y : WORLD.gy(x, z); KIT.cyl(x, y, z, 0.07, 1.1, M.iron, { seg: 8 }); KIT.cyl(x, y + 1.1, z, 0.22, 0.26, M.iron, { seg: 10, col: false, r1: 0.42 }); return WORLD.fire(L, x, y + 1.3, z, 0.8, { range: 12, i: 4 }); };
WORLD.campfire = function (L, x, z) { const y = WORLD.gy(x, z), M = WORLD.M(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; KIT.rbox(x + Math.cos(a) * 0.22, y + 0.1, z + Math.sin(a) * 0.22, 0.06, 0.3, 0.06, 0.9 * Math.sin(a), 0, -0.9 * Math.cos(a), M.wood, 0.02); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; TERRAIN.rock(x + Math.cos(a) * 0.62, z + Math.sin(a) * 0.62, 0.17, 0.2, i * 7 + 3, TERRAIN.cliffMat(0x8a8478), { col: false, y: y + 0.03, detail: 1 }); }
  return WORLD.fire(L, x, y + 0.1, z, 0.9, { range: 12, i: 4.2 }); };
/* a heraldic banner swaying on a pole or wall */
WORLD.banner = function (L, x, y, z, yaw, w, h, col, col2) {
  const g = new THREE.PlaneGeometry(w, h, 6, 10); g.translate(0, -h / 2, 0);
  const m = new THREE.MeshStandardMaterial({ color: col || 0x7a1410, roughness: 0.85, side: THREE.DoubleSide, envMapIntensity: 0.3 }); const U = L._banU || (L._banU = { uT: { value: 0 } });
  m.onBeforeCompile = (sh) => { sh.uniforms.uT = U.uT; sh.uniforms.uC2 = { value: new THREE.Color(col2 || 0xc9a04a) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT; varying vec2 vBu;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBu = uv; { float k = (1.0 - uv.y); vec4 wp0 = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); transformed.z += sin(uT * 2.2 + uv.y * 5.0 + wp0.x) * 0.16 * k + sin(uT * 3.4 + uv.x * 4.0 + wp0.z) * 0.05 * k; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uC2; varying vec2 vBu;').replace('#include <color_fragment>', '#include <color_fragment>\n{ float b = step(abs(vBu.x - 0.5), 0.07) + step(0.44, abs(vBu.x - 0.5)) + step(length((vBu - vec2(0.5, 0.62)) * vec2(1.0, 1.6)), 0.16) - step(length((vBu - vec2(0.5, 0.62)) * vec2(1.0, 1.6)), 0.11); float tat = step(0.1, vBu.y + sin(vBu.x * 31.0) * 0.05); if (tat < 0.5) discard; diffuseColor.rgb = mix(diffuseColor.rgb, uC2, clamp(b, 0.0, 1.0)); }'); };
  m.customProgramCacheKey = () => 'orbanner';
  const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.rotation.y = yaw; me.castShadow = true; LEVEL.add(me);
  if (!L._banUp) { L._banUp = true; L.updates.push((dt, t) => { U.uT.value = t; }); }
  return me;
};
/* still water with sky reflections */
WORLD.water = function (L, x0, z0, x1, z1, y, o) {
  o = o || {}; const nm = TEX.sets.grass.normalMap.clone(); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set((x1 - x0) / 9, (z1 - z0) / 9); nm.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ color: o.color || 0x1c3a40, metalness: 0.2, roughness: 0.07, transparent: true, opacity: o.opacity || 0.84, normalMap: nm, envMapIntensity: 1.6 }); m.normalScale.set(0.12, 0.12);
  const me = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m); me.rotation.x = -HALF; me.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); me.receiveShadow = true; LEVEL.add(me);
  L.updates.push((dt, t) => { nm.offset.set(t * 0.006, t * 0.004); });
  return me;
};
/* ------------------------------------------------------------------ Sites of Grace */
WORLD.graceMat = function () {
  if (WORLD._gm) return WORLD._gm;
  WORLD._gm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false, uniforms: { uT: { value: 0 } },
    vertexShader: 'uniform float uT; varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; float k = uv.y; p.x += sin(uT * 1.1 + k * 5.0 + position.z * 9.0) * 0.1 * k; p.z += cos(uT * 0.9 + k * 4.0) * 0.1 * k; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform float uT; varying vec2 vUv; void main(){ float e = pow(sin(vUv.x * 3.14159), 2.5); float l = smoothstep(0.0, 0.08, vUv.y) * pow(1.0 - vUv.y, 1.5); float fl = 0.75 + 0.25 * sin(uT * 3.0 + vUv.y * 20.0); gl_FragColor = vec4(vec3(2.4, 1.7, 0.55) * e * l * fl, 1.0); }' });
  return WORLD._gm;
};
/* a grace at (x,z): cp = checkpoint index, name shown on discovery, guide = [x,z] the light points toward */
WORLD.grace = function (L, cp, x, z, name, guide) {
  const y = WORLD.gy(x, z), grp = new THREE.Group(), m = WORLD.graceMat();
  for (let i = 0; i < 5; i++) { const g = new THREE.PlaneGeometry(0.22 + i * 0.05, 1.1 + (i % 3) * 0.35, 1, 10); g.translate(0, 0.55 + (i % 3) * 0.17, 0); const me = new THREE.Mesh(g, m); me.rotation.y = i * 1.26; me.position.set(Math.sin(i * 2.4) * 0.08, 0.2, Math.cos(i * 2.4) * 0.08); me.renderOrder = 6; grp.add(me); }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.6, 1.3), toneMapped: false, fog: false })); core.position.y = 0.42; grp.add(core);
  if (guide) { const d = V3(guide[0] - x, 0, guide[1] - z).normalize(), pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(V3(d.x * u * 3.2, 0.5 + Math.sin(u * PI) * 1.2 + u * 0.4, d.z * u * 3.2)); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 5, false); const tm = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.9, 0.7), toneMapped: false, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); grp.add(tm); }
  grp.position.set(x, y, z); LEVEL.add(grp);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 0.9, z), col: new THREE.Color(1.0, 0.76, 0.34), i: 9, range: 12, prio: 2, on: true });
  const Gr = { cp, x, y, z, name, grp, found: !!(GAME.save.graces && GAME.save.graces[L.id + cp]) };
  (L.graces = L.graces || []).push(Gr);
  if (!L._grUp) { L._grUp = true; L.updates.push((dt, t) => { m.uniforms.uT.value = t; }); }
  L.updates.push((dt, t) => { Lt.i = (9 + 1.2 * Math.sin(t * 2.1 + x)) * (L.lightK || 1); if (RNG() < dt * 5) FX.puff(V3(x + rnd(-0.3, 0.3), y + 0.3, z + rnd(-0.3, 0.3)), 1, { add: true, size: 0.035, grow: 0.3, col: [2.6, 1.9, 0.6], a: 1, life: 2.2, spread: 0.12, rise: 0.5, drag: 0.4 }); });
  WORLD.interact(L, V3(x, y + 0.9, z), 2.6, () => IN.keyLabel('grip') + (Gr.found ? ' REST AT THE SITE OF GRACE' : ' TOUCH GRACE'), () => OR.rest(Gr));
  return Gr;
};
/* generic interaction point: shows a prompt within r; F runs fn. label may be a function. Returns a handle with .off */
WORLD.interact = function (L, p, r, label, fn, o) {
  const I = Object.assign({ p, r, label, fn, off: false }, o || {});
  if (!L.inter) { L.inter = []; L.updates.push(() => { const a = PLAYER.a; if (!a || !a.alive || PLAYER.state === 'cine') { if (L.prompt && L.prompt._or) L.prompt = null; return; }
    let best = null, bd = 1e9; for (const q of L.inter) { if (q.off) continue; const d = Math.hypot(q.p.x - a.x, q.p.z - a.z); if (d < q.r && Math.abs(q.p.y - a.y - 0.9) < 3 && d < bd && (PLAYER.state === 'move' || q.riding && PLAYER.state === 'ride')) { bd = d; best = q; } }
    if (best) L.prompt = { p: best.p, text: typeof best.label === 'function' ? best.label() : best.label, fn: () => best.fn(best), _or: true }; else if (L.prompt && L.prompt._or) L.prompt = null; }); }
  L.inter.push(I); return I;
};
/* fog wall across a doorway: blocks until traversed (F), then seals behind you while the boss lives */
WORLD.fogWall = function (L, cx, cz, yaw, w, h, o) {
  o = o || {}; const y = o.y !== undefined ? o.y : WORLD.gy(cx, cz);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false, uniforms: { uT: { value: 0 }, uA: { value: 1 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT, uA; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = vec2(vUv.x * 3.0, vW.y * 0.5); vec2 q = p + vec2(n(p * 1.1 + uT * 0.07), n(p * 1.3 - uT * 0.05)) * 0.9;   // the mist folds on itself
        float f = n(q * 1.4 + vec2(uT * 0.12, -uT * 0.3)) * 0.5 + n(q * 3.1 + vec2(-uT * 0.18, -uT * 0.5)) * 0.3 + n(q * 7.0 + vec2(0.0, -uT * 0.8)) * 0.2;
        float veil = pow(n(vec2(vUv.x * 16.0 + n(p * 2.0) * 2.4, vW.y * 0.3 - uT * 0.22)), 3.0);   // hanging threads of brighter mist
        float edge = smoothstep(0.0, 0.14, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x)) * (1.0 - smoothstep(0.7, 1.0, vUv.y)), foot = 1.0 + 0.5 * (1.0 - smoothstep(0.0, 0.25, vUv.y));
        vec3 c = mix(vec3(0.34, 0.33, 0.29), vec3(0.95, 0.86, 0.6), smoothstep(0.3, 0.85, f)) + vec3(1.0, 0.8, 0.42) * veil * 0.6;
        float glow = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0) * 0.14; gl_FragColor = vec4(c * foot + vec3(1.0, 0.82, 0.5) * glow, clamp((0.42 + 0.5 * f + veil * 0.3) * edge * uA, 0.0, 0.96)); }` });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.position.set(cx, y + h / 2, cz); me.rotation.y = yaw; me.renderOrder = 5; LEVEL.add(me);
  const col = PHY.obox(cx, cz, w / 2, 0.35, y - 2, y + h + 4, yaw, { see: true });
  const F = { me, col, m, open: false, cx, cz, yaw, y };
  F.set = (solid) => { col.off = !solid; me.visible = solid; };
  L.updates.push((dt, t) => { m.uniforms.uT.value = t; });
  const nx = Math.sin(yaw), nz = Math.cos(yaw);
  F.I = WORLD.interact(L, V3(cx, y + 1.2, cz), 2.6, IN.keyLabel('grip') + ' TRAVERSE THE MIST', () => {
    const a = PLAYER.a, side = Math.sign((a.x - cx) * nx + (a.z - cz) * nz) || 1; if (o.oneWay && side !== o.oneWay) return;
    a.x = cx - nx * side * 1.5; a.z = cz - nz * side * 1.5; a.vx = a.vz = 0; a.yaw = Math.atan2(-nx * side, -nz * side); CAM.yaw = a.yaw; CAM.snap = true; if (a.inst.cloth) a.inst.cloth.reset();
    FX.puff(V3(cx, y + 1, cz), 10, { add: true, size: 0.5, col: [1.2, 0.95, 0.5], a: 0.4, spread: 1.6, life: 0.9 }); if (o.onEnter) o.onEnter(F, side);
  });
  return F;
};
/* a glowing pickup. o: { name, runes, flask, heal, key, fn } */
WORLD.item = function (L, x, z, o) {
  o = o || {}; const id = L.id + ':' + (o.id || (x | 0) + '_' + (z | 0)); if (GAME.save.items && GAME.save.items[id] && !o.respawn) return null;
  const y = o.y !== undefined ? o.y : WORLD.gy(x, z), col = o.col || [1.6, 1.7, 2.2];
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(col[0] * 2.5, col[1] * 2.5, col[2] * 2.5), toneMapped: false, fog: false })); core.position.set(x, y + 0.35, z); LEVEL.add(core);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 0.5, z), col: new THREE.Color(col[0] * 0.5, col[1] * 0.5, col[2] * 0.5), i: 1.2, range: 4, prio: 1, on: true });
  let I = null; const up = (dt, t) => { if (!core.visible) return; core.position.y = y + 0.35 + Math.sin(t * 2 + x) * 0.05; if (RNG() < dt * 6) FX.puff(V3(x, y + 0.35, z), 1, { add: true, size: 0.05, grow: 0.5, col, a: 0.9, life: 1.2, spread: 0.2, rise: 0.7, drag: 0.5 }); };
  L.updates.push(up);
  I = WORLD.interact(L, V3(x, y + 0.6, z), 2.0, IN.keyLabel('grip') + ' PICK UP', () => { I.off = true; core.visible = false; Lt.on = false; Lt.i = 0; GAME.save.items = GAME.save.items || {}; if (!o.respawn) GAME.save.items[id] = 1; OR.loot(o); GAME.store(); });
  return I;
};
/* a message scrawled on the ground */
WORLD.message = function (L, x, z, text) {
  const y = WORLD.gy(x, z) + 0.04; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.strokeStyle = 'rgba(255,170,70,0.95)'; g.lineWidth = 5; g.lineCap = 'round';
  const rs = mulberry((x * 31 + z * 17) | 0); for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(24 + rs() * 80, 24 + rs() * 80); g.quadraticCurveTo(24 + rs() * 80, 24 + rs() * 80, 24 + rs() * 80, 24 + rs() * 80); g.stroke(); }
  const me = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.75, 0.38, 0.12), toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 })); me.rotation.x = -HALF; me.position.set(x, y, z); LEVEL.add(me);
  WORLD.interact(L, V3(x, y + 0.9, z), 1.6, IN.keyLabel('grip') + ' READ MESSAGE', () => HUD.sub('', '“' + text + '”', 4));
};
/* ------------------------------------------------------------------ foes that come back when you rest */
WORLD.spawn = function (type, x, z, o) {
  const L = LEVEL.cur; (L.spawns = L.spawns || []).push({ type, x, z, o: o || {} });
  return WORLD.make(type, x, z, o || {});
};
WORLD.make = function (type, x, z, o) {
  if (type === 'wolf') return new Beast(x, z, o);
  return ENEMY.spawn(type, x, z, Object.assign({ cls: Foe, grace: 0.6 }, o));
};
WORLD.respawnFoes = function () {
  const L = LEVEL.cur; if (!L) return;
  for (const e of ENEMY.list) { const i = COMBAT.actors.indexOf(e); if (i >= 0) COMBAT.actors.splice(i, 1); e.dispose(); if (e.gun && e.gun.parent) e.gun.parent.remove(e.gun); }
  ENEMY.list.length = 0; COMBAT.tokens.melee.clear(); COMBAT.tokens.shoot.clear(); for (const b of COMBAT.bolts) b.dispose(); COMBAT.bolts.length = 0;
  for (const s of (L.spawns || [])) WORLD.make(s.type, s.x, s.z, s.o);
  for (const fn of (L.onRespawn || [])) fn();
};
/* a great enemy with an arena: make() builds it (returns the boss object); reset when the player dies */
WORLD.boss = function (L, id, make, o) {
  o = o || {}; const B = { id, make, o, cur: null, dead: !!(GAME.save.felled && GAME.save.felled[id]), engaged: false };
  (L.bosses = L.bosses || []).push(B);
  B.spawn = () => { if (B.dead) return null; const b = make(); B.cur = b; B.engaged = false; b.passive = !!o.passive;
    b.onDefeat = () => { B.dead = true; GAME.save.felled = GAME.save.felled || {}; GAME.save.felled[id] = 1; OR.felled(b, o); if (o.onDefeat) o.onDefeat(b, B); }; return b; };
  B.engage = () => { if (B.dead || B.engaged || !B.cur) return; B.engaged = true; B.cur.passive = false; HUD.setBoss(B.cur, o.name || B.cur.name, '', 'foe'); if (o.onEngage) o.onEngage(B.cur, B); };
  B.reset = () => { if (B.dead) return; if (B.cur) { const i = BOSS.list.indexOf(B.cur); if (i >= 0) BOSS.list.splice(i, 1); const k = COMBAT.actors.indexOf(B.cur); if (k >= 0) COMBAT.actors.splice(k, 1); B.cur.dispose(); if (B.cur.fireL) R.removeLight(B.cur.fireL); } HUD.setBoss(null); B.spawn(); if (o.onReset) o.onReset(B); };
  B.spawn();
  return B;
};
