/* ==== p56f_or_grace.js ==== */
/* OPUS RING — Sites of Grace. A knot of gold light hanging knee-high: a white-hot seed, a soft halo, long thin wisps
   that wind up out of it and thin away, a pool of light on the ground, sparks — and, where it guides, a sheaf of gold
   threads arcing toward the way on. From far off it is a small gold star in the haze. */
WORLD.GRACE_GLSL = `
  float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gh(i), gh(i + vec2(1, 0)), f.x), mix(gh(i + vec2(0, 1)), gh(i + vec2(1, 1)), f.x), f.y); }
  float gf(vec2 p){ return gn(p) * 0.55 + gn(p * 2.1 + 3.7) * 0.3 + gn(p * 4.3 + 1.3) * 0.15; }`;
WORLD.graceMats = function () {
  if (WORLD._gm3) return WORLD._gm3;
  const U = { uT: { value: 0 } }, base = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false };
  const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  /* wisps: each strand is a ribbon whose spine is computed here (a slow widening helix that sways), turned to face the eye */
  const wisp = new THREE.ShaderMaterial(Object.assign({ uniforms: { uT: U.uT, uK: { value: 1 } },
    vertexShader: `attribute vec3 aS; uniform float uT; varying vec2 vQ; varying float vSeed;   // aS: u along, side, seed
      vec3 spine(float u, float sd, float t){ float r = mix(0.03, 0.34, pow(u, 0.75)) * (0.75 + 0.35 * sin(t * 0.6 + sd * 9.0)) * (0.6 + 0.8 * fract(sd * 3.7));
        float a = sd * 6.2832 + u * (3.4 + 2.2 * fract(sd * 5.3)) + t * (0.35 + 0.3 * fract(sd * 7.1)) + sin(u * 5.0 - t * 1.1 + sd * 4.0) * 0.45;
        float h = (1.25 + 1.0 * fract(sd * 2.9)) * u; return vec3(cos(a) * r, 0.5 + h + sin(u * 7.0 - t * 0.9 + sd) * 0.035, sin(a) * r); }
      void main(){ float u = aS.x, sd = aS.z, t = uT; vec3 c = spine(u, sd, t), c2 = spine(u + 0.02, sd, t);
        vec4 mv = modelViewMatrix * vec4(c, 1.0), mv2 = modelViewMatrix * vec4(c2, 1.0); vec2 tg = normalize(mv2.xy - mv.xy + vec2(1e-5, 0.0)); vec2 nr = vec2(-tg.y, tg.x);
        float w = (0.02 + 0.05 * pow(sin(u * 3.1416), 0.7)) * (0.7 + 0.6 * fract(sd * 11.3)); mv.xy += nr * aS.y * w; vQ = vec2(u, aS.y); vSeed = sd; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uT, uK; varying vec2 vQ; varying float vSeed;
      void main(){ float u = vQ.x, v = vQ.y; float prof = exp(-v * v * 5.0), core = exp(-v * v * 40.0); float fade = smoothstep(0.0, 0.06, u) * pow(1.0 - u, 1.5);
        float run = 0.5 + 0.5 * sin(u * 11.0 - uT * 2.6 + vSeed * 40.0), run2 = 0.6 + 0.4 * sin(u * 29.0 - uT * 4.3 + vSeed * 17.0);
        vec3 col = mix(vec3(1.0, 0.56, 0.13), vec3(1.0, 0.86, 0.5), core * (1.0 - u * 0.6)); gl_FragColor = vec4(col * (prof * 0.9 + core * 2.4) * fade * (0.4 + 0.6 * run) * run2 * uK, 1.0); }` }, base));
  /* the seed and its halo: a card that always faces the eye, never smaller than a few pixels however far off, pulled a little toward the eye so the ground does not cut it */
  const core = new THREE.ShaderMaterial(Object.assign({ uniforms: { uT: U.uT, uSeed: { value: 0 }, uK: { value: 1 } },
    vertexShader: `uniform float uT; varying vec2 vP; varying float vFar;
      void main(){ vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); float d = length(mv.xyz); float s = max(1.0, d * 0.045); vFar = smoothstep(18.0, 70.0, d);
        mv.xy += position.xy * 2.6 * s; vP = position.xy * 2.0; gl_Position = projectionMatrix * mv;
        vec4 nb = projectionMatrix * vec4(mv.xyz * (1.0 - min(1.5, d * 0.25) / max(d, 0.01)), 1.0); gl_Position.z = nb.z / nb.w * gl_Position.w; }   // same place on screen, depth of a point nearer the eye`,
    fragmentShader: `uniform float uT, uSeed, uK; varying vec2 vP; varying float vFar; ${WORLD.GRACE_GLSL}
      void main(){ float r = length(vP), a = atan(vP.y, vP.x); float pulse = 0.9 + 0.1 * sin(uT * 2.1 + uSeed);
        float seed = exp(-r * r * 620.0) * 7.0 + exp(-r * r * 110.0) * 1.6, halo = exp(-r * r * 14.0) * 0.6 + exp(-r * r * 3.4) * 0.22;
        float spk = pow(gf(vec2(a * 2.6 + uSeed, uT * 0.22)), 3.0) * exp(-r * r * 6.0) * 0.7 + pow(gf(vec2(a * 7.0 - uSeed, uT * 0.35 + 9.0)), 4.0) * exp(-r * r * 20.0) * 0.8;
        float flare = exp(-vP.x * vP.x * 900.0) * exp(-vP.y * vP.y * 7.0) * 0.3 + exp(-vP.y * vP.y * 1500.0) * exp(-vP.x * vP.x * 14.0) * 0.14;
        float k = seed + halo + (spk + flare) * (1.0 - vFar * 0.7); k *= 1.0 - smoothstep(0.82, 1.0, r);
        vec3 col = mix(vec3(1.0, 0.66, 0.22), vec3(1.0, 0.93, 0.7), clamp(seed * 0.4, 0.0, 1.0)); gl_FragColor = vec4(col * k * pulse * uK, 1.0); }` }, base));
  /* the pool on the ground: a soft disc, slow rays turning in it, a faint ring breathing outward */
  const pool = new THREE.ShaderMaterial(Object.assign({ uniforms: { uT: U.uT }, vertexShader: vs, fragmentShader: `uniform float uT; varying vec2 vUv; ${WORLD.GRACE_GLSL}
    void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0, a = atan(p.y, p.x); float disc = exp(-r * r * 3.0) * 0.55 + exp(-r * r * 26.0) * 0.8;
      float ray = pow(gf(vec2(a * 4.0 + uT * 0.05, uT * 0.12)), 2.0) * exp(-r * r * 2.4) * 0.4; float q = fract(uT * 0.16), ring = exp(-pow((r - q * 0.9) * 16.0, 2.0)) * (1.0 - q) * 0.22;
      gl_FragColor = vec4(vec3(1.0, 0.7, 0.26) * (disc + ray + ring) * (1.0 - smoothstep(0.8, 1.0, r)), 1.0); }` }, base));
  // the guidance: threads along a ribbon (u along the arc, v across it), light running out along them
  const guide = new THREE.ShaderMaterial(Object.assign({ uniforms: { uT: U.uT }, vertexShader: vs, fragmentShader: `uniform float uT; varying vec2 vUv; ${WORLD.GRACE_GLSL}
    void main(){ float u = vUv.x, v = vUv.y - 0.5; float fade = smoothstep(0.0, 0.05, u) * pow(1.0 - u, 1.25);
      float th = 0.0; for (int i = 0; i < 6; i++) { float fi = float(i); float c = (gn(vec2(u * 3.0 + fi * 7.3 - uT * 0.05, fi)) - 0.5) * 0.7 * (0.2 + u); float d = v - c; th += exp(-d * d * 3200.0) * (0.5 + 0.5 * sin(u * 26.0 - uT * 3.2 + fi * 2.0)); }
      float glow = exp(-v * v * 30.0) * 0.2 * (1.0 - u); gl_FragColor = vec4(vec3(1.0, 0.76, 0.3) * (th * 1.5 + glow) * fade, 1.0); }` }, base));
  WORLD._gm3 = { U, wisp, core, pool, guide }; return WORLD._gm3;
};
WORLD.graceWisps = function () {
  if (WORLD._gw) return WORLD._gw; const NS = 9, N = 34, P = [], S = [], I = [];
  for (let s = 0; s < NS; s++) { const sd = (s + 0.37) / NS, b = P.length / 3; for (let i = 0; i <= N; i++) { const u = i / N; for (const side of [-1, 1]) { P.push(0, 0.5 + u * 2, 0); S.push(u, side, sd); } if (i < N) { const a = b + i * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 3)); g.setIndex(I); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 2.2); WORLD._gw = g; return g;
};
WORLD.grace = function (L, cp, x, z, name, guide) {
  const y = WORLD.gy(x, z), grp = new THREE.Group(), GM = WORLD.graceMats();
  const wisps = new THREE.Mesh(WORLD.graceWisps(), GM.wisp); wisps.renderOrder = 6; grp.add(wisps);
  const cm = GM.core.clone(); cm.uniforms.uT = GM.U.uT; cm.uniforms.uSeed = { value: x * 0.37 + z * 0.11 }; cm.uniforms.uK = { value: 1 };
  const core = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cm); core.position.y = 0.52; core.renderOrder = 7; core.frustumCulled = false; grp.add(core);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), GM.pool); pool.rotation.x = -HALF; pool.position.y = 0.07; pool.renderOrder = 5; grp.add(pool);
  if (guide) { const d = V3(guide[0] - x, 0, guide[1] - z).normalize(), n = 30, len = 8.5, P = [], UV = [], I = [], side = V3(-d.z, 0, d.x);
    for (let i = 0; i <= n; i++) { const u = i / n, c = V3(d.x * u * len, 0.5 + Math.sin(u * PI * 0.8) * 1.7 + u * 0.7, d.z * u * len), w = 0.14 + u * 0.55;
      // the ribbon stands on edge (it is seen from the side as well as from behind)
      P.push(c.x, c.y - w, c.z, c.x, c.y + w, c.z); UV.push(u, 0, u, 1); if (i < n) { const a = i * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
    for (const k of [0, 1]) { const g = new THREE.BufferGeometry(), Q = P.slice(); if (k) for (let i = 0; i <= n; i++) { const u = i / n, w = 0.14 + u * 0.55; Q[i * 6] += side.x * w; Q[i * 6 + 2] += side.z * w; Q[i * 6 + 1] += w; Q[i * 6 + 3] -= side.x * w; Q[i * 6 + 5] -= side.z * w; Q[i * 6 + 4] -= w; }
      g.setAttribute('position', new THREE.Float32BufferAttribute(Q, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); const me = new THREE.Mesh(g, GM.guide); me.renderOrder = 6; me.frustumCulled = false; grp.add(me); } }
  grp.position.set(x, y, z); LEVEL.add(grp);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 0.8, z), col: new THREE.Color(1.0, 0.72, 0.3), i: 8, range: 12, prio: 2, on: true });
  const Gr = { cp, x, y, z, name, grp, found: !!(GAME.save.graces && GAME.save.graces[L.id + cp]), k: 1, flare: 0 };
  (L.graces = L.graces || []).push(Gr);
  if (!L._grUp2) { L._grUp2 = true; L.updates.push((dt, t) => { GM.U.uT.value = t; }); }
  L.updates.push((dt, t) => { const c = R.camera.position, d = Math.hypot(c.x - x, c.z - z); wisps.visible = d < 90; pool.visible = d < 120;
    Gr.flare = Math.max(0, Gr.flare - dt * 0.7); cm.uniforms.uK.value = 1 + Gr.flare * 2.5;
    Lt.i = (8 + 0.9 * Math.sin(t * 2.1 + x) + Gr.flare * 14) * (L.lightK || 1);
    if (d < 60) { if (RNG() < dt * 5) { const a = RNG() * TAU, r = 0.05 + RNG() * 0.45; FX.puff(V3(x + Math.cos(a) * r, y + 0.3 + RNG() * 0.5, z + Math.sin(a) * r), 1, { add: true, size: 0.014, grow: 0.12, col: [2.4, 1.6, 0.5], a: 0.95, life: 3.4, spread: 0.06, rise: 0.42, drag: 0.3 }); }
      if (RNG() < dt * 0.8) FX.puff(V3(x, y + 0.5, z), 1, { add: true, size: 0.022, grow: 0.1, col: [2.6, 2.0, 0.9], a: 1, life: 1.6, spread: 0.9, rise: 0.9, drag: 1.2 }); } });
  WORLD.interact(L, V3(x, y + 0.9, z), 2.6, () => IN.keyLabel('grip') + (Gr.found ? ' REST AT THE SITE OF GRACE' : ' TOUCH GRACE'), () => OR.rest(Gr));
  return Gr;
};
