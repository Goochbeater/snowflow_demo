/* ==== p56c_or_erdtree.js ==== */
/* OPUS RING — the Erdtree, painted: a pale-gold trunk and boughs under a broad crown of thousands of small leaves of
   light, drawn once into a canvas and stood far beyond the land. Behind it a soft additive glow; below it, shafts. */
WORLD.erdPaint = function () {
  if (WORLD._erdP) return WORLD._erdP;
  const N = 2048, c = document.createElement('canvas'); c.width = c.height = N; const X = c.getContext('2d'), rs = mulberry(1954);
  const BX = N / 2, BY = N * 0.995, FY = N * 0.69;
  X.lineCap = 'round'; X.lineJoin = 'round';
  // the crown: boughs fork ten times down to hair-fine twigs; every stroke is pale gold, so density itself makes the glow
  const tips = [];
  const br = (px, py, a, len, w, d) => {
    const n = d > 5 ? 6 : 4; X.beginPath(); X.moveTo(px, py);
    for (let s = 0; s < n; s++) { a += (rs() - 0.5) * 0.24 + (d < 6 ? (Math.cos(a) > 0 ? -0.045 : 0.045) : 0); px += Math.cos(a) * len / n; py -= Math.sin(a) * len / n; X.lineTo(px, py); }
    X.strokeStyle = d > 5 ? 'rgba(255,240,184,1)' : d > 2 ? 'rgba(255,232,164,0.9)' : 'rgba(255,226,152,0.5)'; X.lineWidth = Math.max(d > 2 ? 2.2 : 1.2, w * (d > 5 ? 1.25 : 1)); X.stroke();
    if (d <= 0) { tips.push([px, py]); return; }
    const kids = d > 6 ? 3 : (rs() < 0.22 ? 3 : 2), sp = d > 6 ? 0.42 : 0.56;
    for (let q = 0; q < kids; q++) br(px, py, a + (q - (kids - 1) / 2) * sp + (rs() - 0.5) * 0.34, len * (0.69 + rs() * 0.12), w * 0.62, d - 1);
  };
  const A = [0.2, 0.52, 0.86, 1.2, 1.57, 1.94, 2.28, 2.62, 2.94];
  for (let i = 0; i < A.length; i++) br(BX + (i - 4) * 12, FY + (16 + Math.abs(i - 4) * 9), A[i] + (rs() - 0.5) * 0.1, N * (0.118 + 0.04 * Math.abs(Math.cos(A[i]))), 30, 9);
  // a little light at every twig end
  { const sp = document.createElement('canvas'); sp.width = sp.height = 16; const x = sp.getContext('2d'), g = x.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,236,160,0.42)'); g.addColorStop(1, 'rgba(255,220,130,0)'); x.fillStyle = g; x.fillRect(0, 0, 16, 16);
    const r2 = mulberry(5); for (let i = 0; i < tips.length; i++) { const r = 4 + r2() * 7; X.drawImage(sp, tips[i][0] - r, tips[i][1] - r, r * 2, r * 2); } }
  // the trunk: a broad pale column flaring into roots, fluted
  { const g = X.createLinearGradient(BX - 100, 0, BX + 100, 0); g.addColorStop(0, 'rgba(240,206,130,0.0)'); g.addColorStop(0.14, 'rgba(246,214,140,0.95)'); g.addColorStop(0.5, 'rgba(255,244,196,1)'); g.addColorStop(0.86, 'rgba(246,214,140,0.95)'); g.addColorStop(1, 'rgba(240,206,130,0.0)');
    X.fillStyle = g; X.beginPath(); X.moveTo(BX - 190, BY); X.bezierCurveTo(BX - 92, BY - 90, BX - 70, BY - 260, BX - 62, FY + 60); X.lineTo(BX - 80, FY - 10); X.lineTo(BX + 80, FY - 10); X.lineTo(BX + 62, FY + 60); X.bezierCurveTo(BX + 70, BY - 260, BX + 92, BY - 90, BX + 190, BY); X.closePath(); X.fill();
    for (let i = 0; i < 18; i++) { const u = (i + 0.5) / 18 - 0.5; X.strokeStyle = i % 2 ? 'rgba(255,250,220,0.4)' : 'rgba(214,170,96,0.3)'; X.lineWidth = 2 + (i % 3); X.beginPath(); X.moveTo(BX + u * 300, BY); X.bezierCurveTo(BX + u * 170, BY - 150, BX + u * 118, BY - 300, BX + u * 136 + Math.sin(i * 2.1) * 12, FY); X.stroke(); } }
  // bloom: the whole tree again, small and stretched back, twice (a wide soft halo of its own shape)
  for (const [sz, al] of [[64, 0.5], [180, 0.34], [520, 0.3]]) { const sm = document.createElement('canvas'); sm.width = sm.height = sz; const sx = sm.getContext('2d'); sx.drawImage(c, 0, 0, sz, sz); X.imageSmoothingEnabled = true; X.imageSmoothingQuality = 'high'; X.globalCompositeOperation = 'destination-over'; X.globalAlpha = al; X.drawImage(sm, 0, 0, N, N); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; }
  // nothing may reach the edge of the card; the foot sinks into the haze
  { X.globalCompositeOperation = 'destination-in'; const g = X.createRadialGradient(BX, N * 0.5, N * 0.2, BX, N * 0.5, N * 0.5); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.3, 'rgba(0,0,0,0.8)'); g.addColorStop(0.55, 'rgba(0,0,0,0.42)'); g.addColorStop(0.78, 'rgba(0,0,0,0.13)'); g.addColorStop(0.92, 'rgba(0,0,0,0.03)'); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.fillRect(0, 0, N, N);
    X.globalCompositeOperation = 'destination-out'; const g2 = X.createLinearGradient(0, N * 0.86, 0, N); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.7)'); X.fillStyle = g2; X.fillRect(0, N * 0.86, N, N * 0.14); X.globalCompositeOperation = 'source-over'; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.premultiplyAlpha = false; WORLD._erdP = t; return t;
};
WORLD.erdGlow = function () {
  if (WORLD._erdG) return WORLD._erdG; const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, N, N); x.globalCompositeOperation = 'lighter';
  const blob = (cx, cy, rx, ry, a) => { x.save(); x.translate(cx, cy); x.scale(rx, ry); const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(-1, -1, 2, 2); x.restore(); };
  blob(N / 2, N * 0.47, N * 0.5, N * 0.36, 0.5); blob(N / 2, N * 0.52, N * 0.3, N * 0.22, 0.45); blob(N / 2, N * 0.8, N * 0.12, N * 0.3, 0.5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; WORLD._erdG = t; return t;
};
WORLD.erdtree = function (L, o) {
  if (MG.flags.noerd) return null;
  o = o || {}; const k = o.glow !== undefined ? clamp(o.glow * 9, 0.2, 1) : 1, H = o.h || 1500, D = o.dist || 1180, F = 0.94, grp = new THREE.Group();
  const U = { map: { value: WORLD.erdPaint() }, uK: { value: 1.15 * k }, uFog: { value: new THREE.Color(0.3, 0.3, 0.26) }, uHaze: { value: o.haze !== undefined ? o.haze : (o.glow !== undefined ? 0.62 : 0.16) } };
  const tree = new THREE.Mesh(new THREE.PlaneGeometry(H, H), new THREE.ShaderMaterial({ uniforms: U, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.9996; }',
    fragmentShader: `uniform sampler2D map; uniform float uK, uHaze; uniform vec3 uFog; varying vec2 vUv;
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.004) discard; vec3 c = t.rgb * vec3(1.0, 0.86, 0.56) * uK; float fade = 1.0 - (uHaze + 0.6 * (1.0 - smoothstep(0.02, 0.22, vUv.y))); gl_FragColor = vec4(c * t.a * fade, 1.0); }` }));
  tree.position.set(0, H * 0.5 - H * 0.02, 0); tree.renderOrder = -7; tree.frustumCulled = false; grp.add(tree);
  const mk = (tex, w, h, col, y, z, ord) => { const m = new THREE.MeshBasicMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false, color: col }); m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\ngl_Position.z = gl_Position.w * 0.9996;'); }; const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.position.set(0, y, z); me.renderOrder = ord; me.frustumCulled = false; grp.add(me); return me; };
  const glow = mk(WORLD.erdGlow(), H * 1.6, H * 1.6, new THREE.Color(0.2, 0.13, 0.04).multiplyScalar(k), H * 0.52, -6, -9);
  const rays = mk(WORLD.rayTex(), H * 1.5, H * 1.25, new THREE.Color(0.5, 0.36, 0.14).multiplyScalar(k * 0.8), H * 0.36, 4, -6);
  const dir = WORLD.TREE.clone(); dir.y = 0; dir.normalize();
  LEVEL.add(grp);
  L.updates.push((dt, t) => { const c = R.camera.position; grp.position.set(c.x * F + dir.x * D, (o.y !== undefined ? o.y : -30), c.z * F + dir.z * D); grp.rotation.y = Math.atan2(c.x - grp.position.x, c.z - grp.position.z);
    rays.material.opacity = 0.82 + 0.18 * Math.sin(t * 0.21); U.uK.value = 1.15 * k * (0.97 + 0.03 * Math.sin(t * 0.6)); if (R.scene.fog) U.uFog.value.copy(R.scene.fog.color); });
  return grp;
};
