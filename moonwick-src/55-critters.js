// ===== 55-critters: hens, cats, sheep, frogs, ducks, birds that scatter, fireflies and butterflies =====
{
  const G = AF.G, P = AF.PLAN, W = AF.W;
  const C = G.critters = [];
  const MODEL = {
    chicken: (b) => { b(0.3, 0.28, 0.42, 0, 0.3, 0, 0xf4efe4); b(0.2, 0.22, 0.2, 0, 0.52, 0.17, 0xf4efe4); b(0.08, 0.07, 0.1, 0, 0.5, 0.31, 0xe8a030); b(0.06, 0.09, 0.14, 0, 0.66, 0.17, 0xd03a3a); b(0.24, 0.22, 0.12, 0, 0.42, -0.24, 0xe0d8c8); b(0.05, 0.17, 0.05, -0.07, 0.08, 0, 0xe8a030); b(0.05, 0.17, 0.05, 0.07, 0.08, 0, 0xe8a030); },
    cat: (b, c = 0xe89a4a) => { b(0.24, 0.24, 0.56, 0, 0.3, 0, c); b(0.26, 0.24, 0.24, 0, 0.44, 0.34, c); b(0.08, 0.1, 0.06, -0.09, 0.6, 0.36, c); b(0.08, 0.1, 0.06, 0.09, 0.6, 0.36, c); b(0.05, 0.06, 0.02, -0.07, 0.47, 0.465, 0x2a5a2a); b(0.05, 0.06, 0.02, 0.07, 0.47, 0.465, 0x2a5a2a); b(0.07, 0.07, 0.4, 0, 0.44, -0.44, c); for (const [x, z] of [[-0.08, 0.2], [0.08, 0.2], [-0.08, -0.2], [0.08, -0.2]]) b(0.08, 0.2, 0.08, x, 0.1, z, 0xf4f0e8); },
    sheep: (b) => { b(0.62, 0.52, 0.86, 0, 0.56, 0, 0xffffff); b(0.3, 0.3, 0.3, 0, 0.66, 0.54, 0x3a3238); b(0.06, 0.06, 0.02, -0.08, 0.7, 0.695, 0xffffff); b(0.06, 0.06, 0.02, 0.08, 0.7, 0.695, 0xffffff); for (const [x, z] of [[-0.2, 0.28], [0.2, 0.28], [-0.2, -0.28], [0.2, -0.28]]) b(0.12, 0.32, 0.12, x, 0.16, z, 0x3a3238); },
    frog: (b) => { b(0.22, 0.14, 0.24, 0, 0.09, 0, 0x5ab04a); b(0.18, 0.1, 0.14, 0, 0.18, 0.08, 0x6ac05a); b(0.06, 0.06, 0.06, -0.07, 0.25, 0.1, 0xf0f0d0); b(0.06, 0.06, 0.06, 0.07, 0.25, 0.1, 0xf0f0d0); },
    duck: (b) => { b(0.26, 0.2, 0.4, 0, 0.12, 0, 0xf8f8f0); b(0.16, 0.2, 0.16, 0, 0.32, 0.16, 0x3a8a5a); b(0.1, 0.05, 0.12, 0, 0.3, 0.29, 0xf0b030); b(0.2, 0.12, 0.12, 0, 0.2, -0.22, 0xe8e8e0); },
    bird: (b, c = 0x5a7ac0) => { b(0.12, 0.12, 0.2, 0, 0.1, 0, c); b(0.1, 0.1, 0.1, 0, 0.18, 0.1, c); b(0.04, 0.04, 0.06, 0, 0.17, 0.18, 0xf0b030); b(0.3, 0.03, 0.12, 0, 0.14, -0.02, 0x3a4a80); },
  };
  const add = (kind, x, z, o = {}) => { const m = G.boxMesh((b) => MODEL[kind](b, o.col), kind === 'sheep' ? new THREE.MeshLambertMaterial({ vertexColors: true }) : null); m.userData.noCull = false; AF.scene.add(m); const c = Object.assign({ kind, x, y: 0, z, hx: x, hz: z, r: 5, yaw: Math.random() * 6, tx: x, tz: z, wait: Math.random() * 4, sp: 0.8, m, lev: 0, levY: 0, pet: kind !== 'bird' && kind !== 'duck', hop: 0, flee: 0 }, o); c.y = Math.max(W.groundY(x, z), o.water ? P.SEA_Y - 0.06 : -9); C.push(c); return c; };
  AF.onBuild('critters', 655, () => {
    const R = AF.rng(41);
    for (let i = 0; i < 8; i++) add('chicken', -71 + R() * 4, 31 + R() * 4, { hx: -71, hz: 32, r: 3.4, sp: 1.1, name: 'hen' });
    add('cat', -4, 16, { r: 7, col: 0xe89a4a, name: 'Marmalade', hx: -2, hz: 12 }); add('cat', 28, 80, { r: 5, col: 0x4a4a52, name: 'Soot' }); add('cat', -20, 4, { r: 5, col: 0xf0ece4, name: 'Dumpling' }); add('cat', 3, -87, { r: 4, col: 0x6a4a8a, name: 'Hex, the wizard\'s cat', hx: 2, hz: -86 });
    for (let i = 0; i < 7; i++) add('sheep', 96 + R() * 22, 24 + R() * 22, { hx: 106, hz: 34, r: 15, sp: 0.6, name: 'sheep' });
    for (let i = 0; i < 6; i++) { const a = R() * 6.283; add('frog', P.LAKE[0] + Math.cos(a) * (P.LAKE[2] + 1.5), P.LAKE[1] + Math.sin(a) * (P.LAKE[3] + 1.5), { r: 3, sp: 1.6, name: 'frog' }); }
    for (let i = 0; i < 5; i++) add('duck', P.LAKE[0] - 10 + R() * 20, P.LAKE[1] - 8 + R() * 16, { r: 13, hx: P.LAKE[0], hz: P.LAKE[1], sp: 0.7, water: 1, name: 'duck' });
    // birds perch on chimneys, the well, fences; they scatter when you come close
    const perches = AF.chimneys.map((c) => [c.x, c.y + 0.02, c.z]).concat([[5, 4.8, 4], [-6, 2.75, 3.6], [-82, 5.6, 60.1], [66, 3, 8.1], [34.6, 1.3, 84.4], [165, P.RIDGE_Y + 2, -38.2], [-13, 5.5, -1], [14, 5.5, 21]]);
    G.perches = perches; for (let i = 0; i < 20; i++) { const p = perches[(R() * perches.length) | 0]; const c = add('bird', p[0], p[2], { col: [0x5a7ac0, 0xc05a4a, 0xe0c040, 0x4a4a4a][i % 4], name: 'bird' }); c.x = p[0] + (R() - 0.5) * 0.5; c.y = p[1]; c.z = p[2] + (R() - 0.5) * 0.5; c.perch = true; c.pet = false; }
    // fireflies + butterflies: GPU points
    const cloud = (n, night, cols, spots) => { const p = new Float32Array(n * 3), a = new Float32Array(n * 4); for (let i = 0; i < n; i++) { const s = spots[(R() * spots.length) | 0], an = R() * 6.283, r = Math.sqrt(R()) * s[2], x = s[0] + Math.cos(an) * r, z = s[1] + Math.sin(an) * r; p[i * 3] = x; p[i * 3 + 1] = Math.max(W.groundY(x, z), P.SEA_Y) + 0.5 + R() * (night ? 2.6 : 1.3); p[i * 3 + 2] = z; a[i * 4] = R() * 6.283; a[i * 4 + 1] = 0.5 + R(); a[i * 4 + 2] = cols[(R() * cols.length) | 0]; a[i * 4 + 3] = R(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aA', new THREE.BufferAttribute(a, 4));
      const u = { uT: { value: 0 }, uK: { value: 0 }, uPx: { value: 1 }, uTex: { value: G.glowTex }, uNight: { value: night ? 1 : 0 } };
      const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: night ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: u, fog: false,
        vertexShader: 'attribute vec4 aA; uniform float uT, uPx, uNight; varying vec3 vC; varying float vA; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 0.667, 0.333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); } void main(){ vec3 p = position; float t = uT * aA.y; p.x += sin(t * 0.7 + aA.x) * 1.6 + sin(t * 1.9 + aA.x * 3.0) * 0.4; p.z += cos(t * 0.6 + aA.x * 1.7) * 1.6; p.y += sin(t * 1.3 + aA.x * 2.0) * 0.5; vec4 mv = modelViewMatrix * vec4(p, 1.0); float bl = mix(0.75 + 0.25 * abs(sin(t * 9.0 + aA.x)), smoothstep(0.2, 0.9, sin(t * 1.7 + aA.x * 5.0) * 0.5 + 0.5), uNight); vC = mix(mix(vec3(1.0), hue(aA.z), 0.75), mix(vec3(0.75, 1.0, 0.35), vec3(0.5, 0.9, 1.0), step(0.8, aA.w)), uNight); vA = bl * (1.0 - smoothstep(60.0, 120.0, -mv.z)); gl_PointSize = clamp(mix(2.0, 5.5, uNight) * uPx / max(0.5, -mv.z), 0.0, mix(0.5, 0.9, uNight) * uPx); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D uTex; uniform float uK, uNight; varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float a = mix(step(abs(q.x) * (0.6 + abs(q.y) * 3.0), 0.2) * step(abs(q.y), 0.42), texture2D(uTex, gl_PointCoord).a, uNight); if (a * uK < 0.02) discard; gl_FragColor = vec4(vC * mix(1.0, 1.6, uNight), a * vA * uK); }' }));
      m.frustumCulled = false; m.renderOrder = 4; AF.scene.add(m); return { m, u }; };
    G.fireflies = cloud(260, true, [0], [[P.WOOD[0], P.WOOD[1], 70], [P.LAKE[0], P.LAKE[1], 34], [0, 10, 40], [-60, -60, 14], [P.GLADE[0], P.GLADE[1], 12], [165, -32, 16], [-86, 50, 22]]);
    G.butterflies = cloud(110, false, [0.0, 0.08, 0.14, 0.55, 0.8, 0.92], [[0, 10, 60], [-86, 50, 24], [P.LAKE[0], P.LAKE[1], 36], [100, 30, 30], [P.GLADE[0], P.GLADE[1], 16], [12, -36, 10]]);
  });
  G.scare = (x, z, r, strong) => { let n = 0; for (const c of C) { if (c.kind === 'bird') continue; const d = Math.hypot(c.x - x, c.z - z); if (d < r && (c.kind === 'chicken' || c.kind === 'frog' || c.kind === 'duck' || strong)) { c.flee = 2.5; const a = Math.atan2(c.x - x, c.z - z) + (Math.random() - 0.5); c.tx = c.x + Math.sin(a) * 5; c.tz = c.z + Math.cos(a) * 5; c.wait = 0; n++; } } return n; };
  AF.onTick('critters', 320, (dt, t) => {
    if (!AF.ready) return; const cam = AF.camera.position, pl = G.player, pp = pl.host ? pl.host.body : pl.pos, pv = pl.vel.length();
    for (const c of C) {
      const dc = Math.hypot(c.x - cam.x, c.z - cam.z); const vis = dc < 130; if (c.m.visible !== vis) c.m.visible = vis; if (!vis && !c.fly) continue;
      const dp = Math.hypot(c.x - pp.x, c.z - pp.z, c.y - pp.y);
      if (c.lev > 0) { c.lev -= dt; c.levY = Math.min(2.6, c.levY + dt * 2); } else if (c.levY > 0) c.levY = Math.max(0, c.levY - dt * 3);
      if (c.kind === 'bird') {
        if (c.perch) { if (dp < (pl.host ? 3.2 : 5.5) && (pv > 2 || pl.host)) { c.perch = false; c.fly = 0; const p = G.perches[(Math.random() * G.perches.length) | 0]; c.from = [c.x, c.y, c.z]; c.to = [p[0] + (Math.random() - 0.5) * 0.5, p[1], p[2] + (Math.random() - 0.5) * 0.5]; c.dur = 2.5 + Math.hypot(p[0] - c.x, p[2] - c.z) / 9; AF.emit('birds'); } else if (Math.random() < dt * 0.3) c.yaw += (Math.random() - 0.5) * 2; c.m.scale.set(1, 1, 1); }
        else { c.fly += dt / c.dur; const k = Math.min(1, c.fly), e = k * k * (3 - 2 * k), ar = Math.sin(k * Math.PI) * (6 + c.dur * 2.4), sw = Math.sin(k * Math.PI) * Math.sin(k * 9 + c.hx) * 4; const nx = c.from[0] + (c.to[0] - c.from[0]) * e + sw, nz = c.from[2] + (c.to[2] - c.from[2]) * e + Math.cos(k * 7) * Math.sin(k * Math.PI) * 4; c.yaw = Math.atan2(nx - c.x, nz - c.z); c.x = nx; c.z = nz; c.y = c.from[1] + (c.to[1] - c.from[1]) * e + ar; c.m.scale.set(1 + Math.sin(t * 30 + c.hx) * 0.5, 1, 1); if (k >= 1) { c.perch = true; c.fly = 0; } }
        c.m.position.set(c.x, c.y + c.levY, c.z); c.m.rotation.y = c.yaw; continue; }
      // ground folk
      if (c.kind === 'chicken' && dp < 2.2 && (pv > 6 || (pl.host && dp < 1.4)) && c.flee <= 0) { G.scare(pp.x, pp.z, 4); AF.emit('chickens'); }
      if (c.flee > 0) c.flee -= dt;
      c.wait -= dt; const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz), sp = c.sp * (c.flee > 0 ? 3.4 : 1);
      if (c.kind === 'cat' && !pl.host && dp < 6 && c.flee <= 0 && c.levY <= 0) { c.yaw += AF.angDiff(c.yaw, Math.atan2(pp.x - c.x, pp.z - c.z)) * Math.min(1, dt * 5); c.hop = dp < 1.6 && pp.y - c.y < 1.4 ? Math.abs(Math.sin(t * 7)) * 0.25 : 0; }
      else if (d > 0.25 && c.wait <= 0 && c.levY <= 0) { c.yaw += AF.angDiff(c.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 7); const nx = c.x + Math.sin(c.yaw) * sp * dt, nz = c.z + Math.cos(c.yaw) * sp * dt, gy = W.groundY(nx, nz);
        const ok = c.water ? gy < P.SEA_Y - 0.3 : (gy > P.SEA_Y && Math.abs(gy - c.y) < 0.8 && !W.getM(nx, gy + 0.3, nz) && !AF.buildingAt(nx, gy + 0.5, nz));
        if (ok) { c.x = nx; c.z = nz; c.y = c.water ? P.SEA_Y - 0.06 : gy; } else c.wait = 0.01, c.tx = c.x, c.tz = c.z;
        c.hop = c.kind === 'frog' ? Math.abs(Math.sin(t * 6 + c.hx)) * 0.3 : c.kind === 'chicken' ? Math.abs(Math.sin(t * 14 + c.hx)) * 0.05 : c.water ? Math.sin(t * 2 + c.hx) * 0.02 : Math.abs(Math.sin(t * 8 + c.hx)) * 0.03; }
      else { if (c.wait <= 0 && c.flee <= 0) { c.wait = 1.5 + Math.random() * 5; const a = Math.random() * 6.283, r = Math.random() * c.r; c.tx = c.hx + Math.cos(a) * r; c.tz = c.hz + Math.sin(a) * r; } else if (d <= 0.25 && c.wait <= 0) c.wait = 0.5; c.hop = c.water ? Math.sin(t * 2 + c.hx) * 0.02 : 0; }
      c.m.position.set(c.x, c.y + c.hop + c.levY + (c.levY > 0 ? Math.sin(t * 3 + c.hx) * 0.1 : 0), c.z); c.m.rotation.y = c.yaw; c.m.rotation.z = c.levY > 0 ? Math.sin(t * 4 + c.hx) * 0.4 : 0;
    }
    const px = AF.renderer.domElement.height / 720 * 100;
    if (G.fireflies) { G.fireflies.u.uT.value = t; G.fireflies.u.uK.value = AF.smooth(0.45, 0.9, AF.time.night); G.fireflies.u.uPx.value = px; G.fireflies.m.visible = AF.time.night > 0.4; }
    if (G.butterflies) { G.butterflies.u.uT.value = t; G.butterflies.u.uK.value = 1 - AF.smooth(0.1, 0.5, AF.time.night); G.butterflies.u.uPx.value = px; G.butterflies.m.visible = AF.time.night < 0.5; }
  });
}
