/* ==== p70_hl_core.js ==== */
/* HOGWARTS — core: the houses, the save, the golden-hour sky and haze, the crag above the Black Lake, and the mason's
   kit for buildings you can walk (and fly) into: walls with real door and window openings, gabled and conical slate
   roofs with ceilings, floors, stairs. */
const HL = { Y0: 62, BUILD: [], START: [], zones: [], t: 0, house: 'gryffindor', witch: false };
HL.HOUSES = {
  gryffindor: { name: 'Gryffindor', col: 0x8a1818, col2: 0xd8a326, cloth: [0x6e1012, 0xb8442c], trait: 'Daring · Nerve · Chivalry', beast: 'lion', css: '#b22222', css2: '#e2b23a' },
  slytherin: { name: 'Slytherin', col: 0x1c5a34, col2: 0xb8bcc0, cloth: [0x12462a, 0x4a9a64], trait: 'Ambition · Cunning · Resolve', beast: 'serpent', css: '#1f7a45', css2: '#c8ccd0' },
  ravenclaw: { name: 'Ravenclaw', col: 0x1c3a7a, col2: 0xa8763a, cloth: [0x142c66, 0x4a6ab8], trait: 'Wit · Learning · Wisdom', beast: 'eagle', css: '#2a4ea0', css2: '#c08a4a' },
  hufflepuff: { name: 'Hufflepuff', col: 0xd8a418, col2: 0x1c1a16, cloth: [0xb88a10, 0xe8c85a], trait: 'Loyalty · Patience · Fair play', beast: 'badger', css: '#e0aa20', css2: '#2a2620' },
};
HL.H = () => HL.HOUSES[HL.house];
HL.save = { house: null, witch: false, points: 0, quest: 0, found: {}, best: {} };
HL.load = function () { try { const s = JSON.parse(localStorage.getItem('hogwarts_legacy_v1') || 'null'); if (s) Object.assign(HL.save, s); } catch (e) { /* no storage */ } if (HL.save.house) { HL.house = HL.save.house; HL.witch = !!HL.save.witch; } };
HL.store = function () { try { localStorage.setItem('hogwarts_legacy_v1', JSON.stringify(HL.save)); } catch (e) { /* ignore */ } };

/* ------------------------------------------------------------------ light: a low sun over the lake, long shadows */
/* late afternoon: the sun low in the south-west, raking across the castle (it was high and behind the player's shoulder: every wall the bridge faces was lit flat) */
HL.SUNV = [0.74, 0.40, -0.54]; HL.SUN = new THREE.Vector3(HL.SUNV[0], HL.SUNV[1], HL.SUNV[2]).normalize();
(function () {   // haze for every built-in material: thicker low down, warm toward the sun, blue away from it
  const C = THREE.ShaderChunk, T = HL.SUN, f = (v) => v.toFixed(4), cut = C.fog_fragment.indexOf('#ifdef USE_FOG\n\t#ifdef FOG_EXP2');
  const pre = cut > 0 ? C.fog_fragment.slice(0, cut) : '';
  C.fog_fragment = pre + `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fDist = length( vFogV );
		vec3 fDirW = normalize( ( vec4( vFogV, 0.0 ) * viewMatrix ).xyz );
		float fH = cameraPosition.y + fDirW.y * fDist * 0.5;
		float fK = fogDensity * fDist * ( 0.5 + 0.9 * exp( - max( fH - 10.0, 0.0 ) * 0.014 ) );
		float fogFactor = 1.0 - exp( - fK * fK );
		float fGl = pow( max( dot( fDirW, vec3( ${f(T.x)}, ${f(T.y * 0.4)}, ${f(T.z)} ) ), 0.0 ), 4.0 );
		vec3 fCol = fogColor * ( 0.8 + 0.2 * clamp( fDirW.y * 3.0 + 0.6, 0.0, 1.0 ) ) + fGl * vec3( 0.8, 0.41, 0.11 ) + pow( max( dot( fDirW, vec3( ${f(T.x)}, ${f(T.y * 0.4)}, ${f(T.z)} ) ), 0.0 ), 1.5 ) * vec3( 0.09, 0.04, 0.0 );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, fCol, fogFactor );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
	#endif
#endif`;
})();
HL.sky = function (L) {
  const S = HL.SUN.clone(), fc = new THREE.Color(0.36, 0.43, 0.56);
  const U = { uT: { value: 0 }, uS: { value: S }, uFog: { value: fc }, uSg: { value: new THREE.Vector3(S.x, S.y * 0.4, S.z).normalize() } };
  const dome = SKY.dome(U, `uniform vec3 uS, uFog, uSg;
    void main(){ vec3 d = normalize(vD); float el = d.y; float s = max(dot(d, uS), 0.0), sg = pow(max(dot(d, uSg), 0.0), 4.0);
      vec3 zen = vec3(0.055, 0.12, 0.34), mid = vec3(0.30, 0.40, 0.62);
      vec3 c = mix(mid, zen, smoothstep(0.06, 0.62, el));
      vec3 hor = uFog + sg * vec3(0.95, 0.48, 0.12);
      /* a band of rose and gold along the horizon, deepest toward the sun, a cool lilac away from it */
      c = mix(c, mix(vec3(0.60, 0.54, 0.66), vec3(1.7, 0.92, 0.42), pow(sg, 0.7)), (1.0 - smoothstep(0.0, 0.42, el)) * 0.95);
      c += vec3(1.0, 0.5, 0.18) * pow(s, 6.0) * 1.0 + vec3(1.0, 0.8, 0.5) * pow(s, 50.0) * 1.5;
      c += vec3(58.0, 40.0, 20.0) * smoothstep(0.99935, 0.9997, s);
      vec2 cp = d.xz / max(0.1, el + 0.14);
      vec2 wp = cp * 0.5 + vec2(uT * 0.0035, uT * 0.0012); wp += vec2(fb(cp * 0.55 + 3.1), fb(cp * 0.55 + 9.7)) * 0.75;
      float dn = fb(wp * 0.9) * 0.6 + fb(wp * 2.4 + 5.0) * 0.28 + fb(wp * 5.3 + 1.7) * 0.12;
      float cl = smoothstep(0.42, 0.66, dn), thick = smoothstep(0.5, 0.82, dn);
      vec3 lit = mix(vec3(1.05, 0.86, 0.78), vec3(2.0, 1.05, 0.5), pow(s, 1.2) * 0.75 + 0.4 * sg);
      vec3 belly = mix(vec3(0.30, 0.28, 0.42), vec3(1.0, 0.46, 0.3), pow(s, 2.0) * 0.8 + 0.22 + 0.2 * sg);
      vec3 cc = mix(lit, belly, thick);
      c = mix(c, cc, cl * smoothstep(0.015, 0.2, el) * 0.95);
      c = mix(hor, c, smoothstep(-0.01, 0.1, el));
      gl_FragColor = vec4(c, 1.0); }`);
  LEVEL.add(dome); L.updates.push((dt, t) => { dome.position.copy(R.camera.position); U.uT.value = t; });
  const env = new THREE.Scene(); env.add(new THREE.Mesh(dome.geometry, dome.material)); L.env = env; L.sunDir = S; L.treeDir = S;
  HL.LOOK = { sunI: 3.0, hemiI: 2.5, exposure: 1.0 };
  R.setSun(S.clone(), 0xffd9ae, HL.LOOK.sunI, 0xb8c6e2, 0xa09482, HL.LOOK.hemiI);
  L.sunCol = R.sun.color.clone().multiplyScalar(R.sun.intensity / Math.PI);
  const G = R.G; G.exposure = 1.0; G.bloom = 0.2; G.bloomThr = 1.15; G.sat = 1.06; G.contrast = 1.02; G.lift = 0; G.vig = 0.36; G.ca = 0.05; G.haze = 0; G.grain = 0.01; G.ao = 0.8; G.aoR = 0.55; G.rays = 0;
  CM.fillU.value.setRGB(0.5, 0.5, 0.54); CM.rimU.value.setRGB(0.9, 0.62, 0.36);
  R.setShadowBox(46, 260); G.vol = 0.55; G.volDen = 0.0042; G.volFall = 0.02; G.volH = HL.Y0 - 30; G.volOut = 1.0; G.volG = 0.74; G.volMax = 150; G.volAmb.setRGB(0.003, 0.004, 0.006); G.volTint.setRGB(1.0, 0.8, 0.56);
  G.gShadow.setRGB(0.94, 0.98, 1.08); G.gHigh.setRGB(1.05, 1.0, 0.92);
  R.scene.fog = new THREE.FogExp2(fc, 0.00105);
  R.setLightCount(R.NL); R.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  R.camera.far = 3600; R.camera.near = 0.12; R.camera.updateProjectionMatrix();
  return { dome, U };
};

/* ------------------------------------------------------------------ the land */
HL.sdRR = (x, z, hx, hz, r) => { const qx = Math.abs(x) - hx + r, qz = Math.abs(z) - hz + r; return Math.min(Math.max(qx, qz), 0) + Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) - r; };
HL.PITCH = { x: 250, z: 330, y: 31 };
HL.HUT = { x: -128, z: 250 };
HL.CAMP = { x: -250, z: 430 };
HL.lake = function (x, z) {   // 1 in the loch, 0 on land
  const w = (fbm2(x * 0.006 + 2, z * 0.006 + 5, 3) - 0.5) * 90;
  const a = 1 - smooth(250, 330, Math.hypot(x - 210, z + 290) + w), b = 1 - smooth(130, 200, Math.hypot(x - 380, z - 40) + w), c = 1 - smooth(120, 190, Math.hypot(x - 60, z + 150) + w * 0.6);
  let m = Math.max(a, b, c);
  m *= smooth(60, 120, Math.hypot(x + 30, z + 335) + w * 0.3);            // the headland where the viaduct lands
  m *= smooth(-190, -110, x + w * 0.4);                                   // the eastern shore
  return m;
};
HL.h = function (x, z) {
  const n1 = fbm2(x * 0.0038 + 7, z * 0.0038 + 3, 4), n2 = fbm2(x * 0.021, z * 0.021 + 9, 3), n3 = fbm2(x * 0.09 + 1, z * 0.09, 2);
  let y = 31 + (n1 - 0.5) * 30 + (n2 - 0.5) * 4;
  const far = Math.hypot(x - 20, z - 90);
  y += smooth(360, 640, far) * 80 * (0.5 + n1);                           // the land climbs toward the mountains
  y += smooth(250, 520, z) * (1 - smooth(-40, 120, x)) * 14;              // the forest stands on rising ground
  // the Quidditch pitch: a levelled meadow
  { const d = HL.sdRR(x - HL.PITCH.x, z - HL.PITCH.z, 86, 138, 60); y = lerp(HL.PITCH.y, y, smooth(0, 46, d)); }
  { const d = Math.hypot(x - HL.HUT.x, z - HL.HUT.z); y = lerp(34, y, smooth(14, 40, d)); }
  { const d = HL.sdRR(x + 335, z + 450, 84, 44, 36); y = lerp(60 + (n2 - 0.5) * 1.6, y, smooth(0, 70, d)); }                 // Hogsmeade stands on a shelf above the eastern shore
  // the headland south of the viaduct, and the ridge that carries its road east
  { const d = Math.hypot(x + 30, z + 335) + (n2 - 0.5) * 16; y = lerp(HL.Y0 - 0.25, y, smooth(52, 100, d)); }
  const lk = HL.lake(x, z); y = lerp(y, -16, lk * lk * (3 - 2 * lk));
  // the castle crag: a table of rock with sheer faces to the loch, an easier bank to the north
  { const d = HL.sdRR(x - 19, z - 98, 150, 172, 46) + (n2 - 0.5) * 16 + (n3 - 0.5) * 3;
    const north = smooth(40, 110, z) * (1 - smooth(60, 130, Math.abs(x)));
    const k = 1 - smooth(-3, lerp(34, 150, north), d); y = lerp(y, HL.Y0 - 0.3, k * k * (3 - 2 * k)); if (d < -3) y = HL.Y0 - 0.3; }
  return y;
};
HL.gy = (x, z) => { const h = PHY.hf ? PHY.hf(x, z) : null; return h === null ? HL.h(x, z) : h; };

/* ------------------------------------------------------------------ masonry */
HL.M = function () {
  if (HL._M) return HL._M; const P = (n, o) => TEX.mat(n, Object.assign({ macro: 0.22, streak: 0.1 }, o));
  const M = HL._M = { stone: P('ashlar', { color: 0xd8d6d2, scale: 2.5, ns: 0.5 }), stoneD: P('ashlar', { color: 0xb2b2b4, scale: 2.5, ns: 0.5 }), pale: P('sandstone', { color: 0xf0e6d6, scale: 4.2 }), rough: P('rubble', { color: 0xd8d0c4, scale: 3 }),
    floor: P('tiles', { color: 0xc8c0b4, scale: 3.2 }), pave: P('tiles', { color: 0xd6d0c4, scale: 2.2, macro: 0.12 }), flag: P('slate', { color: 0xb8b4ac, scale: 2.4 }), wood: P('planks', { color: 0xc8a888, scale: 2.0 }), woodD: P('planks', { color: 0x6a4e3a, scale: 1.6 }),
    roof: P('roofslate', { color: 0x7c8898, scale: 3.0 }), lead: new THREE.MeshStandardMaterial({ color: 0x2c3036, metalness: 0.1, roughness: 0.7, envMapIntensity: 0.3 }), iron: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.5 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd0a444, metalness: 1, roughness: 0.32 }), dark: new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 1, envMapIntensity: 0.1 }),
    glass: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.95, 0.42), toneMapped: false }), glassC: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.62, 0.8), toneMapped: false }) };
  for (const k of ['lead', 'iron', 'gold', 'dark', 'glass', 'glassC']) M[k].userData.tscale = 1; M.glass.userData.noShadow = true;
  return M;
};
/* a quad seen from the side `want` points to (winding fixed up here) */
HL.quad = function (mat, a, b, c, d, want, uvf) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
  if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { n = [-n[0], -n[1], -n[2]]; const t = b; b = d; d = t; }
  KIT.quad(mat, a, b, c, d, n, uvf || ((p) => [p[0] + p[2], p[1]]));
};
HL.tri = function (mat, a, b, c, want) {
  const g = new THREE.BufferGeometry(); const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { const t = b; b = c; c = t; }
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); g.computeVertexNormals(); KIT.geo(g, mat, null, { worldUV: true });
};
/* a gabled roof over [x0,x1]×[z0,z1], ridge along `axis`; slate outside, `inside` material underneath; stone gables */
HL.gable = function (x0, z0, x1, z1, y, rise, axis, o) {
  o = o || {}; const M = HL.M(), out = o.mat || M.roof, ins = o.inside || M.wood, ov = o.ov !== undefined ? o.ov : 0.9, gm = o.gable || M.stone;
  const uvS = (p) => [axis === 'x' ? p[0] : p[2], Math.hypot(p[1], axis === 'x' ? p[2] : p[0])];
  if (axis === 'x') { const zc = (z0 + z1) / 2, hw = (z1 - z0) / 2, k = rise / hw, ye = y - ov * k;
    for (const s of [-1, 1]) { const ze = zc + s * (hw + ov), A = [x0 - ov, ye, ze], B = [x1 + ov, ye, ze], C = [x1 + ov, y + rise, zc], D = [x0 - ov, y + rise, zc];
      HL.quad(out, A, B, C, D, [0, 1, s], uvS); if (o.ceil !== false) HL.quad(ins, [x0, y - 0.02, zc + s * hw], [x1, y - 0.02, zc + s * hw], [x1, y + rise - 0.3, zc], [x0, y + rise - 0.3, zc], [0, -1, -s], uvS); }
    for (const [x, s] of [[x0, -1], [x1, 1]]) { HL.tri(gm, [x, y, z0], [x, y, z1], [x, y + rise, zc], [s, 0, 0]); HL.tri(gm, [x - s * (o.t || 1.6), y, z0], [x - s * (o.t || 1.6), y, z1], [x - s * (o.t || 1.6), y + rise, zc], [-s, 0, 0]); }
    KIT.box(x0 - ov, y + rise - 0.1, zc - 0.22, x1 + ov, y + rise + 0.28, zc + 0.22, M.lead, { col: false });
    for (let k = 0; k < 6; k++) { const f = (k + 0.5) / 6, w = hw * (1 - f); PHY.box(x0, y + rise * k / 6, zc - w, x1, y + rise * (k + 1) / 6, zc + w, { noFloor: k < 5 }); }
  } else { const xc = (x0 + x1) / 2, hw = (x1 - x0) / 2, k = rise / hw, ye = y - ov * k;
    for (const s of [-1, 1]) { const xe = xc + s * (hw + ov), A = [xe, ye, z0 - ov], B = [xe, ye, z1 + ov], C = [xc, y + rise, z1 + ov], D = [xc, y + rise, z0 - ov];
      HL.quad(out, A, B, C, D, [s, 1, 0], uvS); if (o.ceil !== false) HL.quad(ins, [xc + s * hw, y - 0.02, z0], [xc + s * hw, y - 0.02, z1], [xc, y + rise - 0.3, z1], [xc, y + rise - 0.3, z0], [-s, -1, 0], uvS); }
    for (const [z, s] of [[z0, -1], [z1, 1]]) { HL.tri(gm, [x0, y, z], [x1, y, z], [xc, y + rise, z], [0, 0, s]); HL.tri(gm, [x0, y, z - s * (o.t || 1.6)], [x1, y, z - s * (o.t || 1.6)], [xc, y + rise, z - s * (o.t || 1.6)], [0, 0, -s]); }
    KIT.box(xc - 0.22, y + rise - 0.1, z0 - ov, xc + 0.22, y + rise + 0.28, z1 + ov, M.lead, { col: false });
    for (let k = 0; k < 6; k++) { const f = (k + 0.5) / 6, w = hw * (1 - f); PHY.box(xc - w, y + rise * k / 6, z0, xc + w, y + rise * (k + 1) / 6, z1, { noFloor: k < 5 }); }
  }
};
/* a conical slate roof with a lead finial */
HL.cone = function (x, z, r, y, h, o) {
  o = o || {}; const M = HL.M(), g = new THREE.ConeGeometry(r, h, o.seg || 20, 4, true); KIT.geo(g, o.mat || M.roof, new THREE.Matrix4().makeTranslation(x, y + h / 2, z), { uvs: Math.max(3, Math.round(r * 1.4)), uvs2: Math.max(1.5, h / 5) });
  KIT.cyl(x, y - 0.25, z, r * 1.03, 0.35, M.lead, { seg: o.seg || 20, col: false });
  for (let k = 0; k < 4; k++) PHY.cyl(x, z, r * (1 - (k + 0.5) / 4), y + h * k / 4, y + h * (k + 1) / 4, { noFloor: true });
  KIT.cyl(x, y + h - 0.6, z, 0.16, 2.6, M.lead, { seg: 6, col: false, r1: 0.03 }); KIT.geo(new THREE.SphereGeometry(0.3, 8, 6), M.gold, new THREE.Matrix4().makeTranslation(x, y + h + 0.5, z));
};
/* a straight wall (along x: z fixed; along z: x fixed) with openings. ops: [{ p: centre along the wall (world coord), w, s: sill, hd: head }] measured from y */
HL.wall = function (axis, c, a, b, y, h, t, ops, mat, o) {
  o = o || {}; ops = (ops || []).slice().sort((p, q) => p.p - q.p); const M = HL.M(), col = o.col !== false;
  const bx = (u0, u1, y0, y1, cc) => { if (u1 - u0 < 0.02 || y1 - y0 < 0.02) return; if (axis === 'x') KIT.box(u0, y0, c - t / 2, u1, y1, c + t / 2, mat, { col: cc }); else KIT.box(c - t / 2, y0, u0, c + t / 2, y1, u1, mat, { col: cc }); };
  let u = a;
  for (const op of ops) { const u0 = op.p - op.w / 2, u1 = op.p + op.w / 2; bx(u, u0, y, y + h, col); if (op.s > 0) bx(u0, u1, y, y + op.s, col); bx(u0, u1, y + op.hd, y + h, col); u = u1;
    if (op.arch) for (const sd of [-1, 1]) {   // a pointed head over the opening, glazed with warm light, on both faces
      const th = axis === 'x' ? (sd > 0 ? 0 : PI) : (sd > 0 ? HALF : -HALF), px = axis === 'x' ? op.p : c + sd * (t / 2 + 0.01), pz = axis === 'x' ? c + sd * (t / 2 + 0.01) : op.p;
      CAS.arch(px, y + op.hd - 0.02, pz, th, op.w, 0.05, op.arch, M.trim, op.glass || M.glass, { frame: 0.34, depth: 0.26 }); }
    if (op.bars) { const n = Math.max(1, Math.round(op.w / 1.3)) - 1; for (let i = 1; i <= n; i++) { const p = u0 + (u1 - u0) * i / (n + 1); if (axis === 'x') KIT.box(p - 0.12, y + op.s, c - 0.14, p + 0.12, y + op.hd, c + 0.14, M.trim, { col: false }); else KIT.box(c - 0.14, y + op.s, p - 0.12, c + 0.14, y + op.hd, p + 0.12, M.trim, { col: false }); }
      const nt = Math.max(1, Math.round((op.hd - op.s) / 2.4)) - 1; for (let i = 1; i <= nt; i++) { const yy = y + op.s + (op.hd - op.s) * i / (nt + 1); if (axis === 'x') KIT.box(u0, yy - 0.09, c - 0.12, u1, yy + 0.09, c + 0.12, M.trim, { col: false }); else KIT.box(c - 0.12, yy - 0.09, u0, c + 0.12, yy + 0.09, u1, M.trim, { col: false }); } }
    if (op.s > 0) { if (axis === 'x') KIT.box(u0 - 0.2, y + op.s - 0.25, c - t / 2 - 0.2, u1 + 0.2, y + op.s, c + t / 2 + 0.2, mat, { col: false }); else KIT.box(c - t / 2 - 0.2, y + op.s - 0.25, u0 - 0.2, c + t / 2 + 0.2, y + op.s, u1 + 0.2, mat, { col: false }); }
  }
  bx(u, b, y, y + h, col);
};
/* a hollow rectangular building. o: { t, ops: { z: [...], Z: [...], x: [...], X: [...] } (z = wall at z0, Z = at z1, x = at x0, X = at x1), roof: 'x'|'z'|null, rise,
   floor (material | false), butt: buttress pitch, parapet, mat, inside } */
HL.shell = function (x0, z0, x1, z1, y, h, o) {
  o = o || {}; const M = HL.M(), t = o.t || 1.6, mat = o.mat || M.stone, ops = o.ops || {};
  if (o.gk) { const W = (ax, c, a, b, op, side) => HL.GK.wall(ax, c, a, b, y, h, t, op, { out: mat, in: o.lining || HL.GK.M().wall, side });
    W('x', z0 + t / 2, x0, x1, ops.z, 1); W('x', z1 - t / 2, x0, x1, ops.Z, -1); W('z', x0 + t / 2, z0 + t, z1 - t, ops.x, 1); W('z', x1 - t / 2, z0 + t, z1 - t, ops.X, -1); }
  else { HL.wall('x', z0 + t / 2, x0, x1, y, h, t, ops.z, mat); HL.wall('x', z1 - t / 2, x0, x1, y, h, t, ops.Z, mat);
  HL.wall('z', x0 + t / 2, z0 + t, z1 - t, y, h, t, ops.x, mat); HL.wall('z', x1 - t / 2, z0 + t, z1 - t, y, h, t, ops.X, mat); }
  if (o.floor !== false) KIT.box(x0, y - 1.2, z0, x1, y, z1, mat, { mats: { Y: o.floor || M.floor } });
  // plinth, string course, corbelled cornice
  const ring = (y0, y1, g) => { KIT.box(x0 - g, y0, z0 - g, x1 + g, y1, z0, mat, { col: false }); KIT.box(x0 - g, y0, z1, x1 + g, y1, z1 + g, mat, { col: false }); KIT.box(x0 - g, y0, z0, x0, y1, z1, mat, { col: false }); KIT.box(x1, y0, z0, x1 + g, y1, z1, mat, { col: false }); };
  if (o.plinth !== false) ring(y - 3, y + 1.2, 0.3); ring(y + h - 0.7, y + h, 0.35);
  // buttresses between the windows
  if (o.butt) { const bz = (zc, s) => { const n = Math.round((x1 - x0) / o.butt); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; KIT.box(x - 0.55, y - 3, zc, x + 0.55, y + h * 0.82, zc + s * 1.5, mat, { col: false }); KIT.box(x - 0.45, y + h * 0.82, zc, x + 0.45, y + h + 2.2, zc + s * 0.7, mat, { col: false }); HL.pin(x, y + h + 2.2, zc + s * 0.35, 0.45, 2.2); } };
    if (o.buttZ !== false) { bz(z0, -1); bz(z1, 1); } }
  if (o.roof) HL.gable(x0, z0, x1, z1, y + h, o.rise || (o.roof === 'x' ? (z1 - z0) : (x1 - x0)) * 0.55, o.roof, { inside: o.inside, t, gable: mat });
  else if (o.flat !== false) { KIT.box(x0, y + h, z0, x1, y + h + 0.6, z1, mat, { mats: { Y: M.lead, y: o.inside || M.wood } }); if (o.parapet !== false) CAS.merlons((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2 + 0.3, (z1 - z0) / 2 + 0.3, y + h + 0.6, 0, mat, { pitch: 2.2, mh: 1.4 }); }
};
/* a pinnacle: a small square shaft with a pyramid cap */
HL.pin = function (x, y, z, r, h) { const M = HL.M(); const g = new THREE.ConeGeometry(r * 1.5, h, 4, 1); g.rotateY(PI / 4); KIT.geo(g, M.lead, new THREE.Matrix4().makeTranslation(x, y + h / 2, z), { uvs: 1 }); };
/* a round tower with a conical roof, windows that glow, a collider */
HL.round = function (x, z, r, y, h, o) {
  o = o || {}; const M = HL.M(), yb = o.base !== undefined ? o.base : Math.min(y, HL.h(x, z) - 4);
  const top = CAS.round(x, z, r, yb, y + h - yb, { mat: o.mat || M.stone, roof: 0, win: o.win !== undefined ? o.win : Math.max(2, Math.floor(h / 8)), lit: o.lit !== undefined ? o.lit : 0.45, wa: o.wa, col: false, hollow: o.hollow });
  if (o.col !== false) PHY.cyl(x, z, r, yb, y + h + 1);
  if (r >= 4 && o.arches !== false) { const rs = mulberry((x * 7 + z * 3) | 0), rows = Math.max(1, Math.floor(h / 13)), nw = r > 7 ? 8 : 6;
    for (let k = 0; k < rows; k++) { const wy = y + h - 6.5 - k * 13; if (wy < y + 3) break; for (let i = 0; i < nw; i++) { const a = (i + (k % 2) * 0.5) / nw * TAU + (o.wa || 0); if (rs() < 0.18) continue; CAS.arch(x + Math.sin(a) * (r + 0.02), wy, z + Math.cos(a) * (r + 0.02), a, r > 7 ? 1.3 : 1.0, 2.0, 3.3, o.mat || M.stone, rs() < 0.55 ? M.glass : M.dark, { frame: 0.24, depth: 0.2 }); } }
    KIT.cyl(x, y + h - 2.2, z, r * 1.1, 0.5, o.mat || M.stone, { seg: 20, col: false, r1: r * 1.02 }); }
  if (o.pots) for (let i = 0; i < o.pots; i++) { const a = (i + 0.5) / o.pots * TAU + (o.wa || 0), pr = Math.max(1.1, r * 0.22), px = x + Math.sin(a) * (r + pr * 0.35), pz = z + Math.cos(a) * (r + pr * 0.35), py = y + h - pr * 3.2;
    KIT.cyl(px, py - pr * 1.6, pz, pr, pr * 1.6, o.mat || M.stone, { seg: 10, col: false, r1: pr * 0.25 }); KIT.cyl(px, py, pz, pr, pr * 5, o.mat || M.stone, { seg: 10, col: false }); HL.cone(px, pz, pr * 1.25, py + pr * 5, pr * 3.2, { seg: 10 }); KIT.box(px + Math.sin(a) * pr - 0.12, py + pr * 2.6, pz + Math.cos(a) * pr - 0.12, px + Math.sin(a) * pr + 0.12, py + pr * 3.8, pz + Math.cos(a) * pr + 0.12, M.glass, { col: false }); }
  if (o.roof !== false) HL.cone(x, z, r * 1.22, top + (o.open ? 1.5 : 0), r * (o.steep || 2.3));
  return top;
};
/* a square tower from the castle kit, with a steep pyramid roof */
HL.square = function (x, z, hw, hd, y, h, o) {
  o = o || {}; const M = HL.M(), yb = o.base !== undefined ? o.base : Math.min(y, HL.h(x, z) - 4);
  const top = CAS.tower(x, z, hw, hd, yb, y + h - yb, { mat: o.mat || M.stone, win: o.win, lit: o.lit !== undefined ? o.lit : 0.45, plinth: 0, col: o.col !== false, yaw: o.yaw || 0, buttress: o.buttress });
  if (o.roof !== false) { const rh = Math.max(hw, hd) * (o.steep || 2.4), g = new THREE.ConeGeometry(1, rh, 4, 3); g.rotateY(PI / 4); g.scale(hw * 1.36, 1, hd * 1.36); g.rotateY(o.yaw || 0); KIT.geo(g, M.roof, new THREE.Matrix4().makeTranslation(x, top + 1.2 + rh / 2, z), { uvs: 4, uvs2: 3 });
    KIT.cyl(x, top + rh + 0.6, z, 0.16, 3, M.lead, { seg: 6, col: false, r1: 0.03 }); }
  return top;
};
/* a flight of steps with stone cheeks */
HL.steps = function (x0, z0, x1, z1, y0, y1, axis, mat) { const M = HL.M(); return KIT.stairs(x0, z0, x1, z1, y0, y1, axis, mat || M.flag, Math.max(2, Math.round(Math.abs(y1 - y0) / 0.19))); };
/* merge plain geometries into one, each painted a flat vertex colour (ARM.merge drops colours) */
HL.mergeCol = function (list) { const P = [], N = [], C = []; for (const [g0, c] of list) { const g = g0.index ? g0.toNonIndexed() : g0; if (!g.attributes.normal) g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); C.push(c[0], c[1], c[2]); } }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); o.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return o; };
