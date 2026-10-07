/* ==== p72a_hl_gothic.js ==== */
/* HOGWARTS — the gothic kit. Warm sandstone, walls cut with true pointed openings, traceried lights that pour day
   into the room, rib vaults on clustered piers, blind arcades, string courses, hammer-beam roofs. Every room of the
   castle is built from these (see the blueprint in p72d). */
HL.GK = {};
(function () {
  const GK = HL.GK;
  GK.M = function () {
    if (GK._M) return GK._M; const S = (c, sc, o) => HL.stoneMat('sandstone', Object.assign({ color: c, scale: sc, ns: 0.5, base: -900, vary: 0.22, moss: 0, streak: 0.1, env: 0.3 }, o || {}));
    const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#f4f8ff'); g.addColorStop(0.6, '#e2ecfa'); g.addColorStop(1, '#c4d2e8'); x.fillStyle = g; x.fillRect(0, 0, 256, 512);
    const rs = mulberry(11), tint = ['#ffe9a8', '#bcd8ff', '#ffd0b8', '#d2f0c8', '#f0d4ff'];
    for (let j = -1; j < 17; j++) for (let i = -1; i < 9; i++) { const cx = i * 32 + (j % 2 ? 16 : 0), cy = j * 32; if (rs() < 0.2) { x.fillStyle = tint[(rs() * 5) | 0]; x.globalAlpha = 0.5; x.beginPath(); x.moveTo(cx, cy - 32); x.lineTo(cx + 16, cy); x.lineTo(cx, cy + 32); x.lineTo(cx - 16, cy); x.fill(); x.globalAlpha = 1; } }
    x.strokeStyle = 'rgba(40,44,60,0.85)'; x.lineWidth = 2.2; for (let k = -18; k < 18; k++) { x.beginPath(); x.moveTo(k * 32, 0); x.lineTo(k * 32 + 256, 512); x.stroke(); x.beginPath(); x.moveTo(k * 32 + 256, 0); x.lineTo(k * 32, 512); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    /* the light in the windows, seen from inside, is the evening's: a pale gold (it was a cool noon blue while the sky outside had turned) */ const day = new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.98, 0.78, 0.56), toneMapped: false }); day.userData.tscale = 1;
    const sc = document.createElement('canvas'); sc.width = 64; sc.height = 256; const sx = sc.getContext('2d'), id = sx.createImageData(64, 256); for (let j = 0; j < 256; j++) for (let i = 0; i < 64; i++) { const u = i / 63, v = j / 255, e = Math.sin(u * PI), a = e * e * Math.pow(1 - v, 1.5) * (0.75 + 0.25 * Math.sin(u * 40)); const k = (j * 64 + i) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255 * a; id.data[k + 3] = 255; } sx.putImageData(id, 0, 0);
    const st = new THREE.CanvasTexture(sc); const shaft = new THREE.MeshBasicMaterial({ map: st, color: new THREE.Color(0.1, 0.085, 0.06), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
    /* a shaft is three sheets of light; looked ALONG (toward its window) a ray runs through every sheet of every window in the row and they pile up into a white card. A sheet seen edge-on fades out, as does one the camera is standing in. */
    shaft.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vFace;').replace('#include <project_vertex>', '#include <project_vertex>\nvFace = abs(dot(normalize(normalMatrix * normal), normalize(mvPosition.xyz))) * smoothstep(0.6, 2.6, -mvPosition.z);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFace;').replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= smoothstep(0.22, 0.8, vFace);'); }; shaft.customProgramCacheKey = () => 'hlshaft';
    /* dressed stone drawn fresh: coursed blocks with fine joints, or plain cut stone; a normal map from the same heights */
    const stone = (joints, tile, col, rough) => { const N = 1024, cv = document.createElement('canvas'), hv = document.createElement('canvas'); cv.width = cv.height = hv.width = hv.height = N; const a = cv.getContext('2d'), hh = hv.getContext('2d'), r2 = mulberry(joints ? 5 : 9);
      a.fillStyle = '#c9bca4'; a.fillRect(0, 0, N, N); hh.fillStyle = '#808080'; hh.fillRect(0, 0, N, N);
      if (joints) { const rows = 5, rh = N / rows; for (let j = 0; j < rows; j++) { let u = -r2() * 200; while (u < N) { const w = 190 + r2() * 190, v = 0.93 + r2() * 0.12, t2 = r2(); a.fillStyle = `rgb(${200 * v + t2 * 8 | 0},${187 * v | 0},${162 * v - t2 * 8 | 0})`; a.fillRect(u, j * rh, w, rh); hh.fillStyle = `rgb(${120 + r2() * 20 | 0},0,0)`; hh.fillRect(u, j * rh, w, rh);
            for (const [c2, lw, al] of [['#3a3228', 5, 0.55], ['#fff6e0', 2, 0.18]]) { a.strokeStyle = c2; a.globalAlpha = al; a.lineWidth = lw; a.strokeRect(u + (lw < 3 ? 4 : 0), j * rh + (lw < 3 ? 4 : 0), w - (lw < 3 ? 8 : 0), rh - (lw < 3 ? 8 : 0)); } a.globalAlpha = 1; hh.strokeStyle = '#000'; hh.lineWidth = 7; hh.strokeRect(u, j * rh, w, rh); u += w; } } }
      for (let i = 0; i < 26000; i++) { const g2 = r2(); a.fillStyle = g2 < 0.5 ? `rgba(60,50,40,${r2() * 0.07})` : `rgba(255,248,230,${r2() * 0.07})`; a.fillRect(r2() * N, r2() * N, 1 + r2() * 3, 1 + r2() * 2); }
      for (let i = 0; i < 40; i++) { const x2 = r2() * N, y2 = r2() * N, rr = 60 + r2() * 160, gg = a.createRadialGradient(x2, y2, 0, x2, y2, rr); gg.addColorStop(0, `rgba(${r2() < 0.5 ? '90,78,60' : '255,244,220'},0.07)`); gg.addColorStop(1, 'rgba(0,0,0,0)'); a.fillStyle = gg; a.fillRect(x2 - rr, y2 - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 5000; i++) { hh.fillStyle = `rgba(${r2() * 255 | 0},0,0,0.05)`; hh.fillRect(r2() * N, r2() * N, 2 + r2() * 5, 2 + r2() * 4); }
      const hd = hh.getImageData(0, 0, N, N).data, nc = document.createElement('canvas'); nc.width = nc.height = N; const nx = nc.getContext('2d'), nd = nx.createImageData(N, N), Hh = (x2, y2) => hd[(((y2 + N) % N) * N + ((x2 + N) % N)) * 4];
      for (let y2 = 0; y2 < N; y2++) for (let x2 = 0; x2 < N; x2++) { const dx = (Hh(x2 + 1, y2) - Hh(x2 - 1, y2)) / 255 * 2.2, dy = (Hh(x2, y2 + 1) - Hh(x2, y2 - 1)) / 255 * 2.2, l = Math.hypot(dx, dy, 1), k = (y2 * N + x2) * 4; nd.data[k] = (-dx / l * 0.5 + 0.5) * 255; nd.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; nd.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; nd.data[k + 3] = 255; } nx.putImageData(nd, 0, 0);
      const mp = new THREE.CanvasTexture(cv), nm = new THREE.CanvasTexture(nc); mp.colorSpace = THREE.SRGBColorSpace; for (const q of [mp, nm]) { q.wrapS = q.wrapT = THREE.RepeatWrapping; q.anisotropy = 8; }
      const m = new THREE.MeshStandardMaterial({ map: mp, normalMap: nm, color: col, roughness: rough, envMapIntensity: 0.25 }); m.userData.tscale = tile;
      // storey shading: masonry darkens toward the floor and under the vault, as if light pooled in the middle of every wall
      m.onBeforeCompile = (sh) => { sh.uniforms.uGY = { value: HL.Y0 }; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vGY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGY = (modelMatrix * vec4(transformed, 1.0)).y;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGY; uniform float uGY;').replace('#include <map_fragment>', '#include <map_fragment>\n{ float fy = mod(vGY - uGY + 0.05, 6.4); diffuseColor.rgb *= mix(0.55, 1.0, smoothstep(0.0, 1.3, fy)) * mix(0.66, 1.0, smoothstep(0.0, 2.0, 6.4 - fy)); }'); };
      m.customProgramCacheKey = () => 'gkstone'; return m; };
    /* the walls indoors are the same photographed ashlar as the castle outside (real stone: chisel marks, chipped arrises, uneven joints), kept clean and warm, with the storey shading of the drawn stone */
    const photo = (col, sc, set) => { const m = HL.stoneMat(set || 'ashlar', { color: col, scale: sc, moss: 0, streak: set ? 0.06 : 0.12, vary: set ? 0.3 : 0.45, env: 0.25, ns: set ? 0.6 : 0.9 }), ob = m.onBeforeCompile; m.onBeforeCompile = (sh) => { ob(sh); sh.uniforms.uGY = { value: HL.Y0 }; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGY;').replace('#include <map_fragment>', '#include <map_fragment>\n{ float fy = mod(vHW.y - uGY + 0.05, 6.4); diffuseColor.rgb *= mix(0.6, 1.0, smoothstep(0.0, 1.3, fy)) * mix(0.7, 1.0, smoothstep(0.0, 2.0, 6.4 - fy)); }'); }; m.customProgramCacheKey = () => 'hlstonein'; return m; };
    const old = MG.flags.oldwall || !TEX.sets || !TEX.sets.ashlar;
    const sand = !old && TEX.sets.sandstone;
    GK._M = { wall: old ? stone(1, 2.4, 0x8c8172, 0.92) : photo(new THREE.Color(0.90, 0.81, 0.67), 2.3), dress: sand ? photo(new THREE.Color(0.98, 0.90, 0.76), 3.2, 'sandstone') : stone(0, 2.6, 0xa39681, 0.82), dark: old ? stone(1, 2.4, 0x7c7162, 0.95) : photo(new THREE.Color(0.72, 0.65, 0.54), 2.3), web: sand ? photo(new THREE.Color(0.80, 0.73, 0.62), 4, 'sandstone') : stone(0, 4, 0x82776a, 0.95), day, shaft };
    return GK._M;
  };
  const head = (axis, sgn) => axis === 'x' ? (sgn > 0 ? 0 : PI) : (sgn > 0 ? HALF : -HALF);
  const opPath = (P, op, start) => { const hw = op.w / 2, s = op.s || 0; if (start) P.moveTo(op.p - hw, s); else P.lineTo(op.p - hw, s); P.lineTo(op.p - hw, op.sh); P.quadraticCurveTo(op.p - hw, op.sh + (op.top - op.sh) * 0.74, op.p, op.top); P.quadraticCurveTo(op.p + hw, op.sh + (op.top - op.sh) * 0.74, op.p + hw, op.sh); P.lineTo(op.p + hw, s); if (start) P.lineTo(op.p - hw, s); };
  /* a wall with pointed openings cut clean through it. ops: { p, w, s (sill), sh (springing), top, win (glazed), door (moulded), plain }
     o: { out, in (face materials), side (+1: the room lies on the + side of the wall) } */
  GK.wall = function (axis, c, a, b, y, h, t, ops, o) {
    o = o || {}; const G = GK.M(), out = o.out || G.wall, inn = o.in || G.wall, side = o.side || 1;
    ops = (ops || []).map((p) => { p = Object.assign({}, p); p.s = p.s || 0; if (p.sh === undefined) p.sh = p.s + (p.top - p.s) * 0.6; return p; }).sort((p, q) => p.p - q.p);
    const S = new THREE.Shape(); S.moveTo(a, 0); for (const op of ops) if (!(op.s > 0)) opPath(S, op, false); S.lineTo(b, 0); S.lineTo(b, h); S.lineTo(a, h); S.lineTo(a, 0);
    for (const op of ops) if (op.s > 0) { const H = new THREE.Path(); opPath(H, op, true); S.holes.push(H); }
    const mk = (w0, w1, mat) => { const g = new THREE.ExtrudeGeometry(S, { depth: w1 - w0, bevelEnabled: false, curveSegments: 7 }), m4 = new THREE.Matrix4(); if (axis === 'x') m4.makeTranslation(0, y, c + w0); else { m4.makeRotationY(-HALF); m4.setPosition(c + w1, y, 0); } KIT.geo(g, mat, m4, { worldUV: true }); };
    if (out === inn) mk(-t / 2, t / 2, out); else { mk(-t / 2, 0, side > 0 ? out : inn); mk(0, t / 2, side > 0 ? inn : out); }
    if (o.col !== false) { const pb = (u0, u1, y0, y1) => { if (u1 - u0 < 0.05 || y1 - y0 < 0.05) return; if (axis === 'x') PHY.box(u0, y + y0, c - t / 2, u1, y + y1, c + t / 2); else PHY.box(c - t / 2, y + y0, u0, c + t / 2, y + y1, u1); };
      let u = a; for (const op of ops) { const u0 = op.p - op.w / 2, u1 = op.p + op.w / 2; pb(u, u0, 0, h); if (op.win) pb(u0, u1, 0, h); else { pb(u0, u1, 0, op.s); pb(u0, u1, (op.sh + op.top) / 2, h); } u = u1; } pb(u, b, 0, h); }
    for (const op of ops) { const at = (sgn, off) => axis === 'x' ? [op.p, c + sgn * (t / 2 + off)] : [c + sgn * (t / 2 + off), op.p];
      if (op.win) { const W = HL.winGeo(op.w, op.top - op.s), pi = at(side, -0.12), po = at(-side, 0.0), mi = new THREE.Matrix4().makeRotationY(head(axis, side)); mi.setPosition(pi[0], y + op.s, pi[1]);
        KIT.geo(W.frame, G.dress, mi, { worldUV: true }); KIT.geo(W.glass, G.day, mi, { uvs: 1 }); KIT.geo(W.sill, G.dress, mi, { worldUV: true });
        HL.win(po[0], y + op.s, po[1], head(axis, -side), op.w, op.top - op.s, op.glass || HL.M().glassD);
        if (op.shaft !== false) GK.shaft(pi[0], y + op.s, pi[1], axis === 'x' ? 0 : side, axis === 'x' ? side : 0, op.w, op.top - op.s); }
      else if (!op.plain) { const f = op.f || 0.34, R = new THREE.Shape(); HL.archPath(R, op.w / 2 + f, op.sh - op.s, op.top - op.s + f * 1.3); R.holes.push(HL.archPath(new THREE.Path(), op.w / 2, op.sh - op.s, op.top - op.s));
        const g = new THREE.ExtrudeGeometry(R, { depth: t + 0.3, bevelEnabled: false, curveSegments: 7 }), p = at(-1, 0.15), m4 = new THREE.Matrix4(); if (axis === 'x') m4.makeTranslation(op.p, y + op.s, p[1]); else { m4.makeRotationY(HALF); m4.setPosition(p[0], y + op.s, op.p); } KIT.geo(g, G.dress, m4, { worldUV: true }); } }
  };
  /* sunlight through a window: three soft planes falling into the room along the sun */
  GK._sh = [];
  GK.shaft = function (x, y, z, nx, nz, w, h) { const d = HL.SUN.clone().multiplyScalar(-1); let k = d.x * nx + d.z * nz; const dir = new THREE.Vector3(); /* only a window the sun is actually on throws a shaft (the others used to be given a made-up one: twenty sheets of light deep in some halls, and the frame rate with them) */ if (k > 0.12) dir.copy(d); else return;
    const Lm = Math.min(26, (h * 0.6 + 6) / Math.max(0.3, -dir.y)), tx = -nz, tz = nx, q = (a, b) => { const e = [a[0] + dir.x * Lm, a[1] + dir.y * Lm, a[2] + dir.z * Lm], f = [b[0] + dir.x * Lm, b[1] + dir.y * Lm, b[2] + dir.z * Lm]; GK._sh.push([a, b, f, e]); };
    const hw = w / 2 * 0.9, P = (u, v) => [x + tx * u + nx * 0.2, y + v, z + tz * u + nz * 0.2]; q(P(-hw, h * 0.5), P(hw, h * 0.5)); q(P(0, h * 0.12), P(0, h * 0.92)); };
  /* the sun on the floor under a window: a warm lattice-shadowed patch where the light through it lands, and its bounce */
  GK._pt = [];
  /* the sun through a window, painted on the floor. ok(x, z) says whether a point is still inside the room: the patch is cut short at the first wall it would cross, and left out if even its near edge is beyond one */
  GK.patch = function (x, y0, z, nx, nz, w, h, yf, ok) { const t = HL.SUN.clone().multiplyScalar(-1), k = t.x * nx + t.z * nz; if (k < 0.18 || HL.SUN.y < 0.2) return false; const tx = -nz, tz = nx, hw = w / 2 * 0.92, P = (u, yy) => { const s2 = (yy - yf) / HL.SUN.y; return [x + tx * u + t.x * s2, yf + 0.035, z + tz * u + t.z * s2]; }; let top = Math.min(y0 + h * 0.95, yf + 7.5);
    if (ok) { const inR = (yy) => { for (const u of [-hw, 0, hw]) { const q = P(u, yy); if (!ok(q[0], q[2])) return false; } return true; }; if (!inR(y0)) return true; let good = y0; for (let yy = y0 + 0.4; yy <= top + 1e-6; yy += 0.4) { if (!inR(yy)) break; good = yy; } top = Math.min(top, good); if (top - y0 < 0.6) return true; }
    GK._pt.push([P(-hw, y0), P(hw, y0), P(hw, top), P(-hw, top)]); const c = P(0, (y0 + top) / 2); HL.sl(c[0], yf + 1.4, c[2], 0xffd49a, 5 + w * 1.4, 6 + w); return true; };
  GK.flush = function () { if (GK._pt.length) { const P = [], U = []; for (const [a, b, c, d] of GK._pt) { P.push(...a, ...b, ...c, ...a, ...c, ...d); U.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1); }
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const q = cv.getContext('2d'), id = q.createImageData(64, 128); for (let j = 0; j < 128; j++) for (let i = 0; i < 64; i++) { const u = i / 63, v = j / 127, e = Math.min(1, Math.min(u, 1 - u) * 9) * Math.min(1, Math.min(v, 1 - v) * 12), mul = Math.abs(u - 0.5) < 0.035 ? 0.25 : 1, lat = (Math.abs(((u * 6 + v * 12) % 1) - 0.5) < 0.06 || Math.abs(((u * 6 - v * 12 + 12) % 1) - 0.5) < 0.06) ? 0.72 : 1, a = e * mul * lat * (0.75 + 0.25 * v), o = (j * 64 + i) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = 255 * a; id.data[o + 3] = 255; } q.putImageData(id, 0, 0);
      const tx2 = new THREE.CanvasTexture(cv), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tx2, color: new THREE.Color(0.95, 0.72, 0.42), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.renderOrder = 4; m.frustumCulled = false; m.castShadow = false; m.userData.tag = 'in'; LEVEL.add(m); GK._pt = []; }
    GK.flushShafts(); };
  GK.flushShafts = function () { if (!GK._sh.length) return; const P = [], U = []; for (const [a, b, c, d] of GK._sh) { P.push(...a, ...b, ...c, ...a, ...c, ...d); U.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.computeVertexNormals(); const m = new THREE.Mesh(g, GK.M().shaft); m.renderOrder = 5; m.frustumCulled = false; m.castShadow = false; LEVEL.add(m); GK._sh = []; };
  /* a clustered pier: moulded base, a core with four attached shafts, a bell capital */
  GK.pier = function (x, z, y, h, r, o) { o = o || {}; const G = GK.M(), m = o.mat || G.dress, n = o.shafts === undefined ? 4 : o.shafts;
    KIT.cyl(x, y, z, r * 1.75, 0.42, m, { seg: 8, col: false }); KIT.cyl(x, y + 0.42, z, r * 1.5, 0.26, m, { seg: 12, col: false, r1: r * 1.12 }); KIT.cyl(x, y + 0.68, z, r, h - 1.6, m, { seg: 14, col: false, uvs: 3 });
    for (let i = 0; i < n; i++) { const a = i / n * TAU + (o.rot || 0), sx = x + Math.cos(a) * r * 0.98, sz = z + Math.sin(a) * r * 0.98; KIT.cyl(sx, y + 0.5, sz, r * 0.36, h - 1.3, m, { seg: 8, col: false, uvs: 3 }); KIT.cyl(sx, y + h * 0.5, sz, r * 0.46, 0.14, m, { seg: 8, col: false }); }
    KIT.cyl(x, y + h - 0.92, z, r * 1.1, 0.16, m, { seg: 12, col: false }); KIT.cyl(x, y + h - 0.76, z, r * 1.06, 0.5, m, { seg: 12, col: false, r1: r * 1.6 }); KIT.cyl(x, y + h - 0.26, z, r * 1.78, 0.26, m, { seg: 8, col: false });
    if (o.col !== false) PHY.cyl(x, z, r * 1.3, y, y + h); };
  /* a wall shaft (a respond): a slim engaged column that carries a rib or a truss */
  GK.respond = function (x, z, y, h, r, o) { const G = GK.M(), m = (o && o.mat) || G.dress; if (o && o.full) { KIT.cyl(x, y, z, r * 1.7, 0.4, m, { seg: 8, col: false }); KIT.cyl(x, y + h * 0.45, z, r * 1.25, 0.12, m, { seg: 8, col: false }); KIT.cyl(x, y + h - 0.15, z, r * 1.9, 0.15, m, { seg: 8, col: false }); }
    KIT.geo(new THREE.CylinderGeometry(r, r, h - 0.5, 6, 1, true), m, new THREE.Matrix4().makeTranslation(x, y + (h - 0.5) / 2, z), { uvs: 2 }); KIT.geo(new THREE.CylinderGeometry(r * 1.8, r, 0.5, 6, 1, true), m, new THREE.Matrix4().makeTranslation(x, y + h - 0.25, z), { uvs: 1 }); KIT.geo(new THREE.CylinderGeometry(r, r * 1.6, 0.36, 6, 1, true), m, new THREE.Matrix4().makeTranslation(x, y + 0.18, z), { uvs: 1 }); };
  /* a string of beam segments along a curve f(k) → [x, y, z] */
  GK.curve = function (f, n, w, mat) { let a = f(0); for (let i = 1; i <= n; i++) { const b = f(i / n); KIT.beam(a, b, w, mat); a = b; } };
  GK.prof = (t) => Math.sqrt(Math.max(0, 4 - (Math.abs(t) + 1) * (Math.abs(t) + 1))) / 1.7320508;
  /* one bay of quadripartite rib vault over a rectangle. ys = springing, rise = crown height above it.
     o: { ribs: 'xXzZ' (edge ribs to draw), rib (thickness), web, mat, boss } */
  /* a rib as a square-section strip along f(k): appended to a position list (8 triangles a segment) */
  GK.ribTo = function (P, f, n, w) { const h = w / 2; let a = f(0); for (let i = 1; i <= n; i++) { const b = f(i / n), dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, sx = -dz / l * h, sz = dx / l * h;
      const A = [[a[0] - sx, a[1] - h, a[2] - sz], [a[0] + sx, a[1] - h, a[2] + sz], [a[0] + sx, a[1] + h, a[2] + sz], [a[0] - sx, a[1] + h, a[2] - sz]], B = [[b[0] - sx, b[1] - h, b[2] - sz], [b[0] + sx, b[1] - h, b[2] + sz], [b[0] + sx, b[1] + h, b[2] + sz], [b[0] - sx, b[1] + h, b[2] - sz]];
      for (let q = 0; q < 3; q++) { const r = (q + 1) % 4; P.push(...A[q], ...B[q], ...B[r], ...A[q], ...B[r], ...A[r]); } { P.push(...A[3], ...B[3], ...B[0], ...A[3], ...B[0], ...A[0]); } a = b; } };
  GK.vault = function (x0, z0, x1, z1, ys, rise, o) { o = o || {}; const G = GK.M(), N = o.n || 6, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2, H = (u, v) => ys + rise * Math.max(GK.prof(u), GK.prof(v));
    const P = [], pt = (i, j) => { const u = i / N * 2 - 1, v = j / N * 2 - 1; return [cx + u * hx, H(u, v), cz + v * hz]; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1), um = (i + 0.5) / N * 2 - 1, vm = (j + 0.5) / N * 2 - 1; if (um * vm > 0) P.push(...a, ...b, ...c, ...a, ...c, ...d); else P.push(...a, ...b, ...d, ...b, ...c, ...d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.computeVertexNormals(); KIT.geo(g, o.web || G.web, null, { worldUV: true });
    const rw = o.rib || 0.24, K = o.k || 6, e = o.ribs === undefined ? 'xXzZ' : o.ribs, off = rw * 0.3, Rb = [];
    for (const s of [-1, 1]) GK.ribTo(Rb, (k) => { const u = k * 2 - 1; return [cx + u * hx, H(u, u * s) - off, cz + u * s * hz]; }, K, rw);
    if (e.includes('z')) GK.ribTo(Rb, (k) => { const u = k * 2 - 1; return [cx + u * hx, H(u, 1) - off, z0]; }, K, rw * 1.3); if (e.includes('Z')) GK.ribTo(Rb, (k) => { const u = k * 2 - 1; return [cx + u * hx, H(u, 1) - off, z1]; }, K, rw * 1.3);
    if (e.includes('x')) GK.ribTo(Rb, (k) => { const u = k * 2 - 1; return [x0, H(1, u) - off, cz + u * hz]; }, K, rw * 1.3); if (e.includes('X')) GK.ribTo(Rb, (k) => { const u = k * 2 - 1; return [x1, H(1, u) - off, cz + u * hz]; }, K, rw * 1.3);
    { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(Rb, 3)); g2.computeVertexNormals(); KIT.geo(g2, o.mat || G.dress, null, { worldUV: true }); }
    if (o.boss !== false) KIT.geo(new THREE.SphereGeometry(rw * 1.5, 6, 4).scale(1, 0.6, 1), o.bossMat || HL.M().gold, new THREE.Matrix4().makeTranslation(cx, ys + rise - rw * 0.9, cz)); };
  /* a field of vault bays over a room, springing from the walls (and from piers the caller sets) */
  GK.vaults = function (x0, z0, x1, z1, ys, rise, nx, nz, o) { const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) GK.vault(x0 + i * dx, z0 + j * dz, x0 + (i + 1) * dx, z0 + (j + 1) * dz, ys, rise, Object.assign({ ribs: 'xz' + (i === nx - 1 ? 'X' : '') + (j === nz - 1 ? 'Z' : '') }, o || {})); };
  /* an open pointed arch (a moulded ring) standing across an opening: th = heading of its face */
  GK.arch = function (x, y, z, th, w, sh, top, o) { o = o || {}; const f = o.f || 0.3, R = new THREE.Shape(); HL.archPath(R, w / 2 + f, sh, top + f * 1.3); R.holes.push(HL.archPath(new THREE.Path(), w / 2, sh, top)); const d = o.d || 0.5, g = new THREE.ExtrudeGeometry(R, { depth: d, bevelEnabled: false, curveSegments: 7 }); g.translate(0, 0, -d / 2); const m4 = new THREE.Matrix4().makeRotationY(th); m4.setPosition(x, y, z); KIT.geo(g, o.mat || GK.M().dress, m4, { worldUV: true }); };
  /* a moulded string course on a wall face. side = the way the room lies */
  GK.string = function (axis, c, a, b, y, side, d, hh, mat) { d = d || 0.14; hh = hh || 0.22; const m = mat || GK.M().dress, lo = Math.min(c, c + side * d), hi = Math.max(c, c + side * d); for (const [k, yy, e] of [[1, y, hh * 0.6], [0.55, y - hh * 0.4, hh * 0.4]]) { const l2 = side > 0 ? lo : hi - d * k, h2 = side > 0 ? lo + d * k : hi; if (axis === 'x') KIT.box(a, yy, l2, b, yy + e, h2, m, { col: false }); else KIT.box(l2, yy, a, h2, yy + e, b, m, { col: false }); } };
  /* a blind arcade against a wall face: n pointed panels on slim shafts */
  GK.blind = function (axis, c, a, b, y, h, side, n, o) { o = o || {}; const G = GK.M(), m = o.mat || G.dress, bw = (b - a) / n, f = o.f || 0.13, R = new THREE.Shape(); HL.archPath(R, bw / 2, h * 0.62, h); R.holes.push(HL.archPath(new THREE.Path(), bw / 2 - f, h * 0.62 - f * 0.4, h - f * 1.7));
    const g = new THREE.ExtrudeGeometry(R, { depth: o.d || 0.16, bevelEnabled: false, curveSegments: 5 }); for (let i = 0; i < n; i++) { const u = a + (i + 0.5) * bw, m4 = new THREE.Matrix4().makeRotationY(head(axis, side)); if (axis === 'x') m4.setPosition(u, y, c); else m4.setPosition(c, y, u); KIT.geo(g, m, m4, { worldUV: true }); } };
  /* a carved stone hearth with a pointed fire arch and a tall hood, burning */
  GK.hearth = function (L, x, y, z, nx, nz, w, hh) { const G = GK.M(), tx = -nz, tz = nx, B = (u0, v0, d0, u1, v1, d1, m, col) => { const xa = x + tx * u0 + nx * d0, xb = x + tx * u1 + nx * d1, za = z + tz * u0 + nz * d0, zb = z + tz * u1 + nz * d1; KIT.box(Math.min(xa, xb), y + v0, Math.min(za, zb), Math.max(xa, xb), y + v1, Math.max(za, zb), m, { col: !!col }); };
    const hw = w / 2, fh = hh * 0.42; B(-hw - 0.7, 0, 0, -hw, fh + 0.5, 1.2, G.dress, 1); B(hw, 0, 0, hw + 0.7, fh + 0.5, 1.2, G.dress, 1); B(-hw - 0.9, fh + 0.5, 0, hw + 0.9, fh + 1.0, 1.45, G.dress); B(-hw - 0.7, fh + 1.0, 0, hw + 0.7, fh + 1.35, 1.25, G.dress);
    for (let k = 0; k < 6; k++) { const f = k / 6; B(-hw - 0.5 + f * hw * 0.7, fh + 1.35 + (hh - fh - 1.35) * f, 0, hw + 0.5 - f * hw * 0.7, fh + 1.35 + (hh - fh - 1.35) * (k + 1) / 6, 1.05 - f * 0.6, G.wall); }
    B(-hw, 0, -0.1, hw, fh + 0.5, 0.12, HL.M().dark); B(-hw - 0.9, 0, 1.2, hw + 0.9, 0.14, 2.1, G.dress);
    { const R = new THREE.Shape(); R.moveTo(-hw, 0); R.lineTo(-hw, fh + 0.5); R.lineTo(hw, fh + 0.5); R.lineTo(hw, 0); R.lineTo(-hw, 0); R.holes.push(HL.archPath(new THREE.Path(), hw - 0.3, fh * 0.55, fh + 0.2)); const g = new THREE.ExtrudeGeometry(R, { depth: 0.3, bevelEnabled: false, curveSegments: 6 }), m4 = new THREE.Matrix4().makeRotationY(Math.atan2(nx, nz)); m4.setPosition(x + nx * 0.9, y, z + nz * 0.9); KIT.geo(g, G.dress, m4, { worldUV: true }); }
    for (let k = 0; k < 5; k++) KIT.rbox(x + nx * 0.55 + tx * (-0.6 + k * 0.3), y + 0.22, z + nz * 0.55 + tz * (-0.6 + k * 0.3), 0.1, 0.1, 0.55, 0.3 * k, 0.5 + k, 0, HL.IM().oakD, 0.02);
    WORLD.fire(L, x + nx * 0.6, y + 0.25, z + nz * 0.6, Math.min(2.2, w * 0.42), { range: 20, i: 9 }); };
  /* one hammer-beam truss across a hall whose inner faces are at z = za and zb; the roof springs at yw (outer wall line t beyond) with pitch k */
  GK.hammer = function (x, za, zb, yc, yw, k, t, mat) { const zc = (za + zb) / 2, hw = (zb - za) / 2, roof = (d) => yw + k * (t + d) - 0.35, gold = HL.M().gold;
    for (const s of [-1, 1]) { const zw = s > 0 ? zb : za, Z = (d) => zw - s * d;
      KIT.beam([x, yc, Z(0.28)], [x, yw + 0.3, Z(0.28)], 0.44, mat); KIT.beam([x, yw - 0.5, Z(0)], [x, yw - 0.5, Z(3.5)], 0.5, mat);
      GK.curve((q) => { const a = q * HALF; return [x, yc + 0.4 + (yw - 1.0 - yc) * Math.sin(a), Z(0.35 + 3.0 * (1 - Math.cos(a)))]; }, 6, 0.3, mat);
      KIT.beam([x, yw - 0.5, Z(3.3)], [x, roof(3.3), Z(3.3)], 0.4, mat); KIT.geo(new THREE.SphereGeometry(0.3, 8, 6).scale(1, 1.4, 1), gold, new THREE.Matrix4().makeTranslation(x, yw - 1.0, Z(3.5)));
      const ya = yw - 0.2, yt = yw + k * (t + hw) * 0.66; GK.curve((q) => { const a = q * 1.42; return [x, ya + (yt - ya) * Math.sin(a) / Math.sin(1.42), Z(3.5 + (hw - 3.5) * (1 - Math.cos(a)) / (1 - Math.cos(1.42)))]; }, 9, 0.36, mat);
      KIT.beam([x, roof(0), Z(0)], [x, roof(hw), Z(hw)], 0.46, mat); }
    const yk = yw + k * (t + hw) * 0.66 + 0.2, dk = (yk + 0.35 - yw) / k - t; KIT.beam([x, yk, za + dk], [x, yk, zb - dk], 0.42, mat); KIT.beam([x, yk, zc], [x, roof(hw), zc], 0.36, mat); KIT.geo(new THREE.SphereGeometry(0.32, 8, 6), gold, new THREE.Matrix4().makeTranslation(x, yk - 0.3, zc)); };
})();
