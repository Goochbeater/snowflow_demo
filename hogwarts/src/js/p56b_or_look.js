/* ==== p56b_or_look.js ==== */
/* OPUS RING — the look. Overcast gold: a painted cloud deck lit from the Erdtree's quarter, thick layered haze that
   swallows the distance (height-aware, glowing toward the tree), the Erdtree itself as a vast drawn filigree of light
   with shafts falling through the mist, and a muted olive grade. Everything here replaces the first-pass versions. */
WORLD.TREE = new THREE.Vector3(-0.2, 0.16, 0.96).normalize();
/* ---- fog for every built-in material: denser low down, thinner up high, gold toward the Erdtree */
(function () {
  if (MG.flags.nofogp) return;
  const C = THREE.ShaderChunk, T = WORLD.TREE, f = (v) => v.toFixed(4);
  C.fog_pars_vertex = '#ifdef USE_FOG\n\tvarying float vFogDepth;\n\tvarying vec3 vFogV;\n#endif';
  C.fog_vertex = '#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n\tvFogV = mvPosition.xyz;\n#endif';
  C.fog_pars_fragment = '#ifdef USE_FOG\n\tuniform vec3 fogColor;\n\tvarying float vFogDepth;\n\tvarying vec3 vFogV;\n\t#ifdef FOG_EXP2\n\t\tuniform float fogDensity;\n\t#else\n\t\tuniform float fogNear;\n\t\tuniform float fogFar;\n\t#endif\n#endif';
  C.fog_fragment = `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fDist = length( vFogV );
		vec3 fDirW = normalize( ( vec4( vFogV, 0.0 ) * viewMatrix ).xyz );
		float fH = cameraPosition.y + fDirW.y * fDist * 0.5;
		float fK = fogDensity * fDist * ( 0.55 + 0.75 * exp( - max( fH - 4.0, 0.0 ) * 0.022 ) );
		float fogFactor = 1.0 - exp( - fK * fK );
		float fGl = pow( max( dot( fDirW, vec3( ${f(T.x)}, ${f(T.y)}, ${f(T.z)} ) ), 0.0 ), 5.0 );
		vec3 fCol = fogColor + fGl * vec3( 0.5, 0.36, 0.1 ) + vec3( 0.03, 0.035, 0.045 ) * ( 1.0 - fGl );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, fCol, fogFactor );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
	#endif
#endif`;
})();
/* ------------------------------------------------------------------ sky */
WORLD.sky = function (L, o) {
  o = o || {};
  const E = WORLD.TREE.clone(), S = (o.sun || new THREE.Vector3(-0.05, 0.52, 0.85)).clone().normalize(), storm = o.storm || 0, night = o.night || 0;
  const fc = storm > 0.5 ? new THREE.Color(0.34, 0.36, 0.37) : new THREE.Color(0.30, 0.30, 0.265); fc.multiplyScalar(1 - night * 0.85);
  const U = { uT: { value: 0 }, uE: { value: E }, uStorm: { value: storm }, uFog: { value: fc } };
  const dome = SKY.dome(U, `uniform vec3 uE, uFog; uniform float uStorm;
    void main(){ vec3 d = normalize(vD); float el = d.y; float e = max(dot(d, uE), 0.0);
      float gl = pow(e, 5.0);
      // the horizon is exactly the fog (so land melts into sky); above it a pale break of sky, then the cloud deck
      vec3 hor = uFog + gl * vec3(0.5, 0.36, 0.1) + vec3(0.03, 0.035, 0.045) * (1.0 - gl);
      vec3 gap = mix(vec3(0.66, 0.64, 0.54), vec3(0.34, 0.37, 0.4), uStorm) + vec3(0.5, 0.33, 0.1) * pow(e, 3.0) * (1.0 - uStorm * 0.6);
      vec2 cp = d.xz / max(0.12, el + 0.2);
      vec2 wp = cp + vec2(fb(cp * 0.7 + 3.1), fb(cp * 0.7 + 9.7)) * 0.8 + vec2(uT * 0.004, uT * 0.0015);
      float c1 = fb(wp * 0.85), c2 = fb(wp * 2.3 + 5.0), c3 = fb(wp * 5.1 + 1.7);
      float dens = c1 * 0.62 + c2 * 0.28 + c3 * 0.1;
      float cov = mix(0.4, 0.26, uStorm);
      float cl = smoothstep(cov, cov + 0.14, dens);
      // heavy grey bellies where the cloud is thick; its thin edges take the light
      float thick = smoothstep(cov + 0.06, cov + 0.3, dens);
      vec3 lit = mix(vec3(0.5, 0.48, 0.41), vec3(0.5, 0.52, 0.54), uStorm) + vec3(0.6, 0.4, 0.1) * (pow(e, 2.0) * 0.7 + gl * 0.3) * (1.0 - uStorm * 0.55);
      vec3 belly = mix(vec3(0.185, 0.185, 0.175), vec3(0.17, 0.18, 0.2), uStorm) + vec3(0.3, 0.2, 0.05) * pow(e, 2.0) * (1.0 - uStorm * 0.5);
      vec3 cc = mix(lit, belly, thick);
      vec3 c = mix(gap, cc, cl);
      // shafts of gold falling from the crown of the tree
      vec3 rt = normalize(cross(uE, vec3(0.0, 1.0, 0.0))), up2 = cross(rt, uE);
      float ang = atan(dot(d, rt), dot(d, up2) + 0.35);
      vec2 rd = vec2(cos(ang), sin(ang)); float ray = fb(rd * 5.0 + 1.3) * 0.6 + fb(rd * 13.0 + 4.1) * 0.4;   // periodic in the angle: no seam where atan wraps
      ray = smoothstep(0.42, 0.78, ray) * pow(e, 4.0) * (1.0 - smoothstep(0.08, 0.42, el)) * (1.0 - uStorm * 0.5);
      c += vec3(1.0, 0.72, 0.26) * ray * 0.5;
      c *= mix(vec3(1.0), vec3(1.04, 0.86, 0.56), pow(e, 2.0) * (1.0 - uStorm * 0.7));
      c += vec3(0.42, 0.33, 0.14) * cl * (1.0 - thick) * (0.25 + 1.2 * pow(e, 2.0)) * (1.0 - uStorm * 0.6);   // thin edges of cloud catch the light
      c = mix(hor, c, smoothstep(0.0, 0.13, el));
      c = mix(c, uFog * 0.8, (1.0 - smoothstep(-0.25, 0.0, el)));
      gl_FragColor = vec4(c, 1.0); }`);
  LEVEL.add(dome); L.updates.push((dt, t) => { dome.position.copy(R.camera.position); U.uT.value = t; });
  const env = new THREE.Scene(); env.add(new THREE.Mesh(dome.geometry, dome.material));
  L.env = env; L.sunDir = S; L.treeDir = E;
  const k = 1 - storm * 0.5 - night * 0.9;
  // overcast: a soft warm key from the tree's quarter, a great deal of sky
  R.setSun(S.clone(), storm > 0.5 ? 0xe2dccc : 0xfff0dc, (o.sunI ? o.sunI * 0.5 : 1.15) * k, storm > 0.5 ? 0xb0b6c0 : 0xd2d3c6, storm > 0.5 ? 0x74726a : 0x8c8a72, (o.hemi ? o.hemi * 1.5 : 1.7) * (1 - night * 0.75));
  L.sunCol = R.sun.color.clone().multiplyScalar(R.sun.intensity / Math.PI);
  R.G.exposure = (o.exposure || 1.0) * 1.05; R.G.bloom = 0.2; R.G.bloomThr = 1.25; R.G.sat = 0.88; R.G.contrast = 1.03; R.G.lift = 0.0; R.G.vig = 0.42; R.G.ca = 0.06; R.G.haze = 0; R.G.grain = 0.012; R.G.ao = 0.75; R.G.aoR = 0.5;
  CM.fillU.value.setRGB(0.56, 0.54, 0.49).multiplyScalar((1 - night * 0.5) * (1 - storm * 0.45)); CM.rimU.value.setRGB(0.7, 0.56, 0.34).multiplyScalar(1 - storm * 0.4);
  R.G.rays = o.rays !== undefined ? o.rays : 0;   // (tried: the tree is too broad a light for shafts to read; left available per level) R.rayDir = E;
  R.setShadowBox(o.shadow || 44, 220); R.G.vol = o.vol !== undefined ? o.vol : 0; R.G.volDen = 0.004; R.G.volFall = 0.03; R.G.volH = o.volH || 0; R.G.volOut = 1.0; R.G.volG = 0.7; R.G.volMax = 120; R.G.volAmb.setRGB(0.004, 0.004, 0.003); R.G.volTint.setRGB(1.0, 0.86, 0.6);
  R.G.gShadow.setRGB(0.98, 1.0, 1.02); R.G.gHigh.setRGB(1.02, 1.0, 0.95);
  R.scene.fog = new THREE.FogExp2(fc, o.fog || 0.002);
  R.setLightCount(o.lights || 3); R.renderer.shadowMap.type = THREE.PCFShadowMap;
  return { dome, U };
};
/* ------------------------------------------------------------------ the Erdtree, drawn */
WORLD.erdTex = function () {
  if (WORLD._erd) return WORLD._erd;
  const N = 2048, c = document.createElement('canvas'); c.width = c.height = N; const X = c.getContext('2d');
  X.fillStyle = '#000'; X.fillRect(0, 0, N, N); X.globalCompositeOperation = 'lighter';
  const seed0 = 1954, reseed = () => mulberry(seed0);
  let RS = reseed(); const twigs = [];
  // one pass of the whole tree into context x at scale k (the same tree every pass: its own random stream).
  // A branch is a wandering stroke that tapers, then forks; boughs sweep outward and droop at their ends.
  const pass = (x, k, alpha, wk, col, minW) => {
    RS = reseed(); twigs.length = 0; x.strokeStyle = `rgba(${col},${alpha})`; x.lineCap = 'round'; x.lineJoin = 'round';
    const BX = N / 2 * k, TOP = N * 0.6 * k;
    const br = (px, py, a, len, w, d) => {
      const n = d > 5 ? 6 : 4; x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < n; s++) { a += (RS() - 0.5) * 0.22 + (d < 5 ? (Math.cos(a) > 0 ? -0.04 : 0.04) : 0); px += Math.cos(a) * len / n; py -= Math.sin(a) * len / n; x.lineTo(px, py); }
      x.lineWidth = Math.max(minW, w); x.stroke();
      if (d <= 0) { twigs.push([px / k, py / k]); return; }
      const kids = d > 6 ? 3 : (RS() < 0.35 ? 3 : 2), sp = d > 6 ? 0.46 : 0.6;
      for (let q = 0; q < kids; q++) br(px, py, a + (q - (kids - 1) / 2) * sp + (RS() - 0.5) * 0.3, len * (0.7 + RS() * 0.12), w * 0.6, d - 1);
    };
    const A = [0.2, 0.55, 0.9, 1.25, 1.57, 1.9, 2.25, 2.6, 2.94];
    for (let i = 0; i < A.length; i++) br(BX + (i - 4) * 15 * k, TOP + (24 + Math.abs(i - 4) * 9) * k, A[i] + (RS() - 0.5) * 0.1, N * k * (0.19 + 0.06 * Math.sin(A[i])), 34 * wk * k, 8);
  };
  // 1) the canopy's glow: the tree drawn small and thick, then stretched back up (a cheap, wide blur)
  for (const [sz, al, wk, col, mw] of [[128, 0.13, 3.0, '255,255,255', 1.6], [256, 0.11, 2.0, '255,255,255', 1.2], [512, 0.1, 1.4, '255,255,255', 0.9]]) {
    const s = document.createElement('canvas'); s.width = s.height = sz; const sx = s.getContext('2d'); sx.fillStyle = '#000'; sx.fillRect(0, 0, sz, sz); sx.globalCompositeOperation = 'lighter';
    pass(sx, sz / N, al, wk, col, mw); X.imageSmoothingEnabled = true; X.imageSmoothingQuality = 'high'; X.drawImage(s, 0, 0, N, N); }
  // 2) the trunk: a broad pale column, flaring into roots, brighter at its heart
  { const BX = N / 2, BY = N * 0.985, TOP = N * 0.6, x = X; const g = x.createLinearGradient(BX - 110, 0, BX + 110, 0); g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(0.2, 'rgba(255,255,255,0.5)'); g.addColorStop(0.5, 'rgba(255,255,255,0.92)'); g.addColorStop(0.8, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,190,90,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(BX - 150, BY); x.bezierCurveTo(BX - 80, BY - 120, BX - 62, BY - 300, BX - 56, TOP + 40); x.lineTo(BX - 84, TOP - 30); x.lineTo(BX + 84, TOP - 30); x.lineTo(BX + 56, TOP + 40); x.bezierCurveTo(BX + 62, BY - 300, BX + 80, BY - 120, BX + 150, BY); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 16; i++) { const u = (i + 0.5) / 16 - 0.5; x.lineWidth = 2 + (i % 3); x.beginPath(); x.moveTo(BX + u * 250, BY); x.bezierCurveTo(BX + u * 150, BY - 200, BX + u * 104, BY - 420, BX + u * 130 + Math.sin(i * 2.1) * 14, TOP - 20); x.stroke(); } }
  // 3) the filigree itself, crisp
  pass(X, 1, 0.42, 1.0, '255,255,255', 1.1);
  // 4) leaves of light at the twig ends (stamped from one small sprite)
  { const sp = document.createElement('canvas'); sp.width = sp.height = 32; const sx = sp.getContext('2d'), g = sx.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(0.5, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 32, 32);
    const r2 = mulberry(5); for (let i = 0; i < twigs.length; i++) { const r = 9 + r2() * 22; X.drawImage(sp, twigs[i][0] - r, twigs[i][1] - r, r * 2, r * 2); if (i % 3 === 0) { const q = 2 + r2() * 3; X.drawImage(sp, twigs[i][0] + (r2() - 0.5) * 30 - q, twigs[i][1] + (r2() - 0.5) * 30 - q, q * 2, q * 2); } } }
  // 5) a broad soft aura
  { const g = X.createRadialGradient(N / 2, N * 0.42, 60, N / 2, N * 0.42, N * 0.52); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(255,160,60,0)'); X.fillStyle = g; X.fillRect(0, 0, N, N); }
  // fade to nothing before the edge of the card
  { X.globalCompositeOperation = 'multiply'; const g = X.createRadialGradient(N / 2, N * 0.5, N * 0.3, N / 2, N * 0.5, N * 0.5); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); X.fillStyle = g; X.fillRect(0, 0, N, N);
    const g2 = X.createLinearGradient(0, N * 0.9, 0, N); g2.addColorStop(0, '#fff'); g2.addColorStop(1, '#666'); X.fillStyle = g2; X.fillRect(0, N * 0.9, N, N * 0.1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; WORLD._erd = t; return t;
};
WORLD.rayTex = function () {
  if (WORLD._ray) return WORLD._ray;
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), rs = mulberry(88);
  x.fillStyle = '#000'; x.fillRect(0, 0, N, N); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) { const a = HALF + (rs() - 0.5) * 2.3, w = 0.012 + rs() * 0.05, L = N * (0.7 + rs() * 0.5), ox = N / 2 + (rs() - 0.5) * 240, oy = N * 0.16;
    const g = x.createLinearGradient(ox, oy, ox + Math.cos(a) * L, oy + Math.sin(a) * L); const al = 0.05 + rs() * 0.13; g.addColorStop(0, `rgba(255,214,130,${al})`); g.addColorStop(0.5, `rgba(255,200,110,${al * 0.6})`); g.addColorStop(1, 'rgba(255,190,100,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a - w) * L, oy + Math.sin(a - w) * L); x.lineTo(ox + Math.cos(a + w) * L, oy + Math.sin(a + w) * L); x.closePath(); x.fill(); }
  { x.globalCompositeOperation = 'multiply'; const g = x.createRadialGradient(N / 2, N * 0.5, N * 0.16, N / 2, N * 0.5, N * 0.47); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, N, N); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; WORLD._ray = t; return t;
};
WORLD.erdtree = function (L, o) {
  if (MG.flags.noerd) return null;
  o = o || {}; const k = o.glow !== undefined ? o.glow * 9 : 1, H = o.h || 900, D = o.dist || 1180, F = 0.94;
  const grp = new THREE.Group();
  const mk = (tex, w, h, col, y, z, ord) => { const m = new THREE.MeshBasicMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false, color: col });
    const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.position.set(0, y, z); me.renderOrder = ord; me.frustumCulled = false; grp.add(me); return me; };
  const tree = mk(WORLD.erdTex(), H, H, new THREE.Color(1, 1, 1), H * 0.5 - H * 0.03, 0, -8);
  const TU = { map: { value: WORLD.erdTex() }, uK: { value: k } };
  tree.material = new THREE.ShaderMaterial({ uniforms: TU, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float uK; varying vec2 vUv;
      void main(){ float i = texture2D(map, vUv).g;   // (already linear: the sampler decodes sRGB)
        vec3 c = mix(vec3(1.0, 0.40, 0.05), vec3(1.0, 0.66, 0.16), smoothstep(0.02, 0.3, i)); c = mix(c, vec3(1.0, 0.86, 0.46), smoothstep(0.35, 0.95, i));
        gl_FragColor = vec4(c * (i * 1.25 + pow(i, 0.5) * 0.06) * uK, 1.0); }` });
  const rays = mk(WORLD.rayTex(), H * 1.5, H * 1.25, new THREE.Color(0.62, 0.42, 0.16).multiplyScalar(k * 0.8), H * 0.34, 4, -7);
  const dir = WORLD.TREE.clone(); dir.y = 0; dir.normalize();
  LEVEL.add(grp);
  L.updates.push((dt, t) => { const c = R.camera.position; grp.position.set(c.x * F + dir.x * D, (o.y !== undefined ? o.y : -40), c.z * F + dir.z * D); grp.rotation.y = Math.atan2(c.x - grp.position.x, c.z - grp.position.z);
    rays.material.opacity = 0.82 + 0.18 * Math.sin(t * 0.21); TU.uK.value = k * (0.97 + 0.03 * Math.sin(t * 0.6)); });
  return grp;
};
/* motes: fewer, finer */
WORLD.motes = function (L, o) {
  o = o || {}; const col = o.col || [1.6, 1.2, 0.45];
  L.updates.push((dt) => { if (RNG() > dt * (o.rate || 6)) return; const c = R.camera.position, a = RNG() * TAU, r = 4 + RNG() * 22;
    FX.puff(V3(c.x + Math.cos(a) * r, c.y + rnd(-1, 6), c.z + Math.sin(a) * r), 1, { add: true, size: 0.014, grow: 0.2, col, a: 0.5, life: 5, spread: 0.25, rise: -0.1, drag: 0.2, vel: V3(0.5, -0.1, 0.3) }); });
};

/* ------------------------------------------------------------------ grass: fine dense turf underfoot, a coarser field beyond it */
(function () {
  const g0 = WORLD.grass;
  WORLD.grass = function (L, G, o) {
    const low = MG.flags.q === 'low', C = { base: 0x565a36, tip: 0x5a6234, dry: 0x6c6a3e };
    g0(L, G, Object.assign({ count: low ? 6000 : 11000, size: 16, height: 0.36, w: [0.26, 0.0], flowers: 0, shadowed: true }, C, o || {}));
    return g0(L, G, Object.assign({ count: low ? 16000 : 40000, size: 84, height: 0.4, w: [0.5, 0.0075], inner: 6, segs: 1, flowers: 1500, seed: 'grassFar' }, C, o || {}));
  };
})();
