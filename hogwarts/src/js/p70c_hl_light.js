/* ==== p70c_hl_light.js ==== */
/* HOGWARTS — candle and torch light. The engine has a pool of seven moving point lights; a castle interior needs
   dozens. Every lit material gets a second, fixed-size loop of "static" lights (no shadows): the nearest twenty to
   the eye are uploaded each frame from HL.SL, flickering, so halls are lit in warm pools with darkness between. */
HL.NSL = 16; HL.SL = []; HL.slP = new Float32Array(HL.NSL * 4); HL.slC = new Float32Array(HL.NSL * 3); HL.slSel = []; HL.slT = 0;
(function () {
  const C = THREE.ShaderChunk;
  for (const k of ['lambert', 'standard', 'physical', 'phong']) { THREE.ShaderLib[k].uniforms.uSLp = { value: HL.slP }; THREE.ShaderLib[k].uniforms.uSLc = { value: HL.slC }; }
  C.lights_pars_begin += `\nuniform vec4 uSLp[ ${HL.NSL} ];\nuniform vec3 uSLc[ ${HL.NSL} ];\n`;
  C.lights_fragment_begin = C.lights_fragment_begin.replace('IncidentLight directLight;', `IncidentLight directLight;
#if defined( RE_Direct )
	for ( int si = 0; si < ${HL.NSL}; si ++ ) {
		vec4 sL = uSLp[ si ]; if ( sL.w <= 0.0 ) continue;
		vec3 sV = sL.xyz - geometryPosition; float sD = length( sV ); if ( sD > sL.w ) continue;
		float sA = 1.0 - sD / sL.w; sA = sA * sA / ( 1.0 + sD * sD * 0.07 );
		vec3 sN = sV / max( sD, 0.001 );
		if ( si < 3 ) { directLight.color = uSLc[ si ] * sA; directLight.direction = sN; directLight.visible = true; RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight ); }
		else reflectedLight.directDiffuse += uSLc[ si ] * sA * max( dot( geometryNormal, sN ), 0.0 ) * material.diffuseColor * 0.3183;
	}
#endif`);
})();
/* a static light: colour, intensity, range; flicker 0..1 */
HL.sl = function (x, y, z, col, i, range, o) { o = o || {}; const c = new THREE.Color(col), L = { x, y, z, r: c.r * i, g: c.g * i, b: c.b * i, range: range || 10, fl: o.flicker || 0, ph: HL.SL.length * 1.7, w: 0, k: 1 }; HL.SL.push(L); return L; };
HL.slUpdate = function (dt) {
  const c = R.camera.position; HL.slT -= dt;
  if (HL.slT <= 0) { HL.slT = 0.2; const P = PLAYER.a, cand = [];
    for (const L of HL.SL) { let d = Math.hypot(L.x - c.x, (L.y - c.y) * 2.5, L.z - c.z); if (P) d = Math.min(d, Math.hypot(L.x - P.x, (L.y - P.y - 1) * 2.5, L.z - P.z) + 2); if (d > L.range * 3 + 40) { L.w = 0; continue; } L._s = d - L.range * 0.9; cand.push(L); }
    cand.sort((a, b) => a._s - b._s); for (let i = HL.NSL; i < cand.length; i++) cand[i].w = 0; HL.slSel = cand.slice(0, HL.NSL); }
};
/* uploaded in VIEW space just before the frame is drawn (no per-fragment matrix work) */
HL._slInv = new THREE.Matrix4();
HL.slUpload = function (dt) {
  const t = MG.rt, P4 = HL.slP, C3 = HL.slC, cam = R.camera; cam.updateMatrixWorld(); const e = HL._slInv.copy(cam.matrixWorld).invert().elements;
  for (let i = 0; i < HL.NSL; i++) { const L = HL.slSel[i]; if (!L) { P4[i * 4 + 3] = 0; continue; } L.w = Math.min(1, L.w + dt * 2.5);
    const f = L.fl ? 1 - L.fl * (0.14 + 0.1 * Math.sin(t * 11 + L.ph) + 0.07 * Math.sin(t * 23.7 + L.ph * 2.3)) : 1, k = L.w * f * L.k * (HL.slGain || 1);
    P4[i * 4] = e[0] * L.x + e[4] * L.y + e[8] * L.z + e[12]; P4[i * 4 + 1] = e[1] * L.x + e[5] * L.y + e[9] * L.z + e[13]; P4[i * 4 + 2] = e[2] * L.x + e[6] * L.y + e[10] * L.z + e[14]; P4[i * 4 + 3] = L.range; C3[i * 3] = L.r * k; C3[i * 3 + 1] = L.g * k; C3[i * 3 + 2] = L.b * k; }
};
HL.START.push((L) => { L.updates.push((dt) => HL.slUpdate(dt)); });
(function () { const r0 = R.render; R.render = function (dt) { HL.slUpload(Math.max(dt, 0)); r0(dt); }; })();
/* lanterns and fires feed the static field instead of the pool (which is kept for spells and other moving lights) */
HL.lantern = function (L, x, y, z, o) {
  o = o || {}; const M = HL.M();
  KIT.box(x - 0.16, y - 0.24, z - 0.16, x + 0.16, y + 0.24, z + 0.16, KIT.emis(o.col || 0xffb060, o.glow || 4), { col: false });
  KIT.box(x - 0.2, y + 0.24, z - 0.2, x + 0.2, y + 0.3, z + 0.2, M.iron, { col: false }); KIT.box(x - 0.2, y - 0.3, z - 0.2, x + 0.2, y - 0.24, z + 0.2, M.iron, { col: false });
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) KIT.box(x + a * 0.18 - 0.02, y - 0.26, z + b * 0.18 - 0.02, x + a * 0.18 + 0.02, y + 0.26, z + b * 0.18 + 0.02, M.iron, { col: false });
  return HL.sl(x, y, z, o.col || 0xffa858, (o.i || 16) * 0.55, (o.range || 13) * 1.25, { flicker: 0.5 });
};
(function () { const f0 = WORLD.fire; WORLD.fire = function (L, x, y, z, size, o) { const n = R.lightSrc.length, me = f0(L, x, y, z, size, o); if (R.lightSrc.length > n) { const Lt = R.lightSrc.pop(); HL.sl(Lt.pos.x, Lt.pos.y, Lt.pos.z, Lt.col.getHex(), Lt.i * 0.75, Lt.range * 1.35, { flicker: 1 }); } return me; }; })();
