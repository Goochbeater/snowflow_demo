/* ==== p69b_or_polish.js ==== */
/* OPUS RING — polish. Resting at grace is a small scene: the light flares, the Tarnished kneels beside it, the eye
   swings round to hold both — and only when the words have faded does the menu come. */
(function () {
  const rest0 = OR.rest, leave0 = OR.leaveGrace, open0 = MENU.open;
  MENU.open = function (name, o) {
    if (name === 'grace' && OR._deferGrace) { OR._deferGrace = false; const Gr = o.Gr; OR.noPauseT = MG.rt + 3.4;
      MG.after(2.9, () => { if (PLAYER.state === 'cine' && OR.curGrace === Gr && !MENU.cur) MENU.open('grace', o); }, true); return; }
    return open0(name, o);
  };
  OR.restCam = function (Gr) {
    const a = PLAYER.a, cam = R.camera, p0 = cam.position.clone(), f0 = cam.getWorldDirection(new THREE.Vector3()), l0 = p0.clone().addScaledVector(f0, Math.max(3, p0.distanceTo(V3(a.x, a.y + 1.2, a.z))));
    const mid = V3((Gr.x + a.x) / 2, Gr.y + 0.85, (Gr.z + a.z) / 2), d = V3(a.x - Gr.x, 0, a.z - Gr.z); if (d.lengthSq() < 0.01) d.set(0, 0, -1); d.normalize(); const pr = V3(-d.z, 0, d.x);
    let best = null;
    for (const sd of (pr.dot(p0.clone().sub(mid)) >= 0 ? [1, -1] : [-1, 1])) { const c = mid.clone().addScaledVector(d, 2.5).addScaledVector(pr, sd * 3.0); c.y = Math.max(mid.y + 0.75, WORLD.gy(c.x, c.z) + 0.9);
      const dir = c.clone().sub(mid), len = dir.length(); dir.normalize(); const hit = PHY.ray(mid.x, mid.y, mid.z, dir.x, dir.y, dir.z, len + 0.4, 'los'); if (!hit) { best = c; break; } }
    const p1 = best || p0.clone(), rt = V3(0, 0, 0).crossVectors(mid.clone().sub(p1).setY(0).normalize(), YUP), l1 = mid.clone().addScaledVector(rt, -1.25); l1.y = mid.y + 0.1;
    document.body.classList.add('rest');
    CAM.play({ hold: true, dur: 2.6, fov: 44, fn: (t) => { const c = CAM.cine; if (PLAYER.state !== 'cine' || OR.curGrace !== Gr) { c.hold = false; c.dur = 0; document.body.classList.remove('rest'); }
      const e = easeIO(sat(t / 2.6)), sway = Math.sin(Math.max(0, t - 1.5) * 0.11) * 0.3; return { pos: _rp.lerpVectors(p0, p1, e).addScaledVector(rt, sway * e), look: _rl.lerpVectors(l0, l1, e) }; } });
  };
  const _rp = new THREE.Vector3(), _rl = new THREE.Vector3();
  OR.rest = function (Gr) {
    const first = !Gr.found, a = PLAYER.a; if (first && !MG.test) OR._deferGrace = true;
    rest0(Gr);
    if (!a || PLAYER.state !== 'cine' || OR.curGrace !== Gr) { OR._deferGrace = false; return; }   // refused: foes near
    if (first) { HUD.banner('LOST GRACE DISCOVERED', 'gold', 3.2); Gr.flare = 1; FX.ring(V3(Gr.x, Gr.y + 0.12, Gr.z), [2.4, 1.6, 0.5], 4.2, 1.1); FX.flashLight(V3(Gr.x, Gr.y + 1, Gr.z), [1, 0.75, 0.3], 16, 16, 0.8);
      for (let i = 0; i < 46; i++) { const an = RNG() * TAU; FX.puff(V3(Gr.x, Gr.y + 0.5, Gr.z), 1, { add: true, size: 0.02, grow: 0.15, col: [2.6, 1.8, 0.6], a: 1, life: 2.2 + RNG() * 1.6, spread: 0.1, vel: V3(Math.cos(an) * (1 + RNG() * 2.4), 1.2 + RNG() * 2.6, Math.sin(an) * (1 + RNG() * 2.4)), drag: 1.6, rise: 0.5 }); } }
    else { Gr.flare = 0.45; FX.ring(V3(Gr.x, Gr.y + 0.12, Gr.z), [2.0, 1.4, 0.45], 2.4, 0.7); }
    // kneel beside the light, not in it
    { const dx = a.x - Gr.x, dz = a.z - Gr.z, dd = Math.hypot(dx, dz), want = 1.45; if (dd < want - 0.05) { const ux = dd > 0.05 ? dx / dd : -Math.sin(CAM.yaw), uz = dd > 0.05 ? dz / dd : -Math.cos(CAM.yaw), nx = Gr.x + ux * want, nz = Gr.z + uz * want; if (Math.abs(WORLD.gy(nx, nz) - a.y) < 0.6) { a.x = nx; a.z = nz; } }
      a.yaw = Math.atan2(Gr.x - a.x, Gr.z - a.z); }
    if (!MG.test) OR.restCam(Gr);
  };
  OR.leaveGrace = function () { const a = PLAYER.a, c = R.camera; document.body.classList.remove('rest'); if (CAM.cine && a) { CAM.cine = null; CAM.yaw = Math.atan2(a.x - c.position.x, a.z - c.position.z); CAM.pitch = -0.16; CAM.snap = true; } leave0(); };
})();
/* ------------------------------------------------------------------ worn ground: no turf under fires, tents, graces, chests (applied to every grass field's density map) */
WORLD.clearGrass = function (L, x, z, r) { (L._clear = L._clear || []).push([x, z, r]); };
WORLD.applyClear = function (L) {
  const G = L.G, C = L._clear; if (!G || !C || !C.length || !L.grassTexs) return;
  for (const tex of L.grassTexs) { const d = tex.image.data, W = G.W; for (const [x, z, r] of C) { const i0 = Math.floor((x - r - G.x0) / G.res) - 1, i1 = Math.ceil((x + r - G.x0) / G.res) + 1, j0 = Math.floor((z - r - G.z0) / G.res) - 1, j1 = Math.ceil((z + r - G.z0) / G.res) + 1;
      for (let j = Math.max(0, j0); j <= Math.min(G.Hn - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(W - 1, i1); i++) { const rr = Math.max(r, G.res * 0.8), dd = Math.hypot(G.x0 + i * G.res - x, G.z0 + j * G.res - z), k = smooth(rr * 0.6, rr + G.res * 0.8, dd); d[(j * W + i) * 4 + 1] *= k; } }
    tex.needsUpdate = true; }
  L._clear.length = 0;
};
/* ------------------------------------------------------------------ small lights: one card that faces the eye — a seed, a halo and (for things to pick up) a thin column rising out of it */
WORLD.glowMat = function (col, column, k) {
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, uniforms: { uT: WORLD.TIME, uCol: { value: new THREE.Color(col[0], col[1], col[2]) }, uK: { value: k || 1 }, uColumn: { value: column ? 1 : 0 }, uPh: { value: RNG() * 6 } },
    vertexShader: `varying vec2 vP; varying float vFar; void main(){ vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); float d = length(mv.xyz), s = max(1.0, d * 0.03); vFar = smoothstep(14.0, 50.0, d); mv.xy += position.xy * 1.5 * s; vP = position.xy * 2.0; gl_Position = projectionMatrix * mv;
      vec4 nb = projectionMatrix * vec4(mv.xyz * (1.0 - min(0.8, d * 0.2) / max(d, 0.01)), 1.0); gl_Position.z = nb.z / nb.w * gl_Position.w; }`,
    fragmentShader: `uniform float uT, uK, uColumn, uPh; uniform vec3 uCol; varying vec2 vP; varying float vFar;
      void main(){ float r = length(vP); float seed = exp(-r * r * 900.0) * 5.0 + exp(-r * r * 150.0) * 1.2, halo = exp(-r * r * 18.0) * 0.4 + exp(-r * r * 5.0) * 0.12;
        float colm = uColumn * exp(-vP.x * vP.x * 1400.0) * smoothstep(-0.02, 0.06, vP.y) * exp(-max(vP.y, 0.0) * 3.2) * 1.1 * (1.0 - vFar);
        float k = (seed + halo + colm) * (0.86 + 0.14 * sin(uT * 2.4 + uPh)) * (1.0 - smoothstep(0.8, 1.0, r)); gl_FragColor = vec4(mix(uCol, vec3(1.0), clamp(seed * 0.25, 0.0, 0.8)) * k * uK, 1.0); }` });
  return m;
};
WORLD.glow = function (x, y, z, col, column, k) { const me = new THREE.Mesh(WORLD._gq || (WORLD._gq = new THREE.PlaneGeometry(1, 1)), WORLD.glowMat(col, column, k)); me.position.set(x, y, z); me.renderOrder = 6; me.frustumCulled = false; LEVEL.add(me); return me; };
/* a thing to pick up */
WORLD.item = function (L, x, z, o) {
  o = o || {}; const id = L.id + ':' + (o.id || (x | 0) + '_' + (z | 0)); if (GAME.save.items && GAME.save.items[id] && !o.respawn) return null;
  const y = o.y !== undefined ? o.y : WORLD.gy(x, z), col = o.col || [1.6, 1.7, 2.2], c1 = [col[0] * 0.55, col[1] * 0.55, col[2] * 0.55];
  const core = WORLD.glow(x, y + 0.42, z, c1, true, 1);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 0.5, z), col: new THREE.Color(col[0] * 0.5, col[1] * 0.5, col[2] * 0.5), i: 1.4, range: 4.5, prio: 1, on: true });
  let I = null; L.updates.push((dt, t) => { if (!core.visible) return; core.position.y = y + 0.42 + Math.sin(t * 1.6 + x) * 0.04; const c = R.camera.position; if (Math.hypot(c.x - x, c.z - z) < 40 && RNG() < dt * 5) FX.puff(V3(x + rnd(-0.12, 0.12), y + 0.4, z + rnd(-0.12, 0.12)), 1, { add: true, size: 0.022, grow: 0.2, col, a: 0.9, life: 1.5, spread: 0.08, rise: 0.75, drag: 0.5 }); });
  I = WORLD.interact(L, V3(x, y + 0.6, z), 2.0, IN.keyLabel('grip') + ' PICK UP', () => { I.off = true; core.visible = false; Lt.on = false; Lt.i = 0; GAME.save.items = GAME.save.items || {}; if (!o.respawn) GAME.save.items[id] = 1; OR.loot(o); GAME.store();
    for (let i = 0; i < 14; i++) FX.puff(V3(x, y + 0.45, z), 1, { add: true, size: 0.03, grow: 0.2, col, a: 1, life: 0.9, spread: 1.4, rise: 1.6, drag: 2 }); });
  return I;
};
/* a message scrawled on the ground: glowing strokes on worn turf, an ember of light over them */
WORLD.message = function (L, x, z, text) {
  const y = WORLD.gy(x, z) + 0.05; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rs = mulberry((x * 31 + z * 17) | 0);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(255,140,40,0.9)'; g.shadowBlur = 14;
  for (let row = 0; row < 3; row++) { let px = 38 + rs() * 16; const py = 78 + row * 50; g.strokeStyle = 'rgba(255,214,150,0.95)'; g.lineWidth = 5;
    while (px < 214) { const w = 12 + rs() * 22; g.beginPath(); g.moveTo(px, py + (rs() - 0.5) * 20); g.quadraticCurveTo(px + w * 0.5, py + (rs() - 0.5) * 46, px + w, py + (rs() - 0.5) * 20); if (rs() < 0.5) g.lineTo(px + w * 0.6, py + 16 * (rs() - 0.3)); g.stroke(); px += w + 5 + rs() * 8; } }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const me = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.5, 0.8, 0.3), toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3 })); me.rotation.x = -HALF; me.rotation.z = rs() * TAU; me.position.set(x, y, z); me.renderOrder = 4; LEVEL.add(me);
  WORLD.glow(x, y + 0.22, z, [0.9, 0.42, 0.12], false, 0.5); WORLD.clearGrass(L, x, z, 0.8);
  L.updates.push((dt) => { const cc = R.camera.position; if (Math.hypot(cc.x - x, cc.z - z) < 30 && RNG() < dt * 2.2) FX.puff(V3(x + rnd(-0.5, 0.5), y + 0.05, z + rnd(-0.5, 0.5)), 1, { add: true, size: 0.016, grow: 0.1, col: [2.6, 1.2, 0.35], a: 0.9, life: 1.8, spread: 0.05, rise: 0.5, drag: 0.4 }); });
  WORLD.interact(L, V3(x, y + 0.9, z), 1.7, IN.keyLabel('grip') + ' READ MESSAGE', () => HUD.sub('', '“' + text + '”', 4));
};
/* ------------------------------------------------------------------ a golden sapling: a slender young tree whose bark and leaves are light */
WORLD.sapling = function (L, x, z, o) {
  o = o || {}; const y = WORLD.gy(x, z), grp = new THREE.Group(), s = (o.s || 1) * 0.8, G = WORLD.treeGeo(7000 + ((x * 7 + z * 13) | 0) % 50, { h: 6.5 });
  const bark = new THREE.MeshStandardMaterial({ map: TEX.sets.bark.map, normalMap: TEX.sets.bark.normalMap, color: 0xf0e0b4, roughness: 0.7, emissive: new THREE.Color(1.0, 0.62, 0.2), emissiveIntensity: 0.5, envMapIntensity: 0.3 });
  const tr = new THREE.Mesh(G.trunk, bark); tr.castShadow = true; grp.add(tr);
  const lm = new THREE.ShaderMaterial({ uniforms: { map: { value: WORLD.leafTex() }, uT: WORLD.TIME }, side: THREE.DoubleSide, toneMapped: false, fog: false,
    vertexShader: 'uniform float uT; varying vec2 vUv; varying float vH; void main(){ vUv = uv; vec3 p = position; p += vec3(sin(uT * 1.3 + position.y * 1.7), cos(uT * 1.7 + position.z) * 0.5, cos(uT * 1.1 + position.x * 1.3)) * 0.035; vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform float uT; varying vec2 vUv; varying float vH; void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.4) discard; float l = dot(t.rgb, vec3(0.3, 0.6, 0.1)) / 0.14; vec3 c = mix(vec3(1.0, 0.56, 0.12), vec3(1.0, 0.86, 0.42), clamp(l * 0.6, 0.0, 1.0)) * (0.9 + 0.5 * l) * (1.05 + 0.12 * sin(uT * 1.4 + vH * 2.0)); gl_FragColor = vec4(c * vec3(0.62, 0.52, 0.34), 1.0); }' });
  const lv = new THREE.Mesh(G.leaves, lm); grp.add(lv);
  grp.position.set(x, y, z); grp.scale.setScalar(s); LEVEL.add(grp); PHY.cyl(x, z, 0.22 * s, y - 1, y + 3);
  WORLD.glow(x, y + 4.3 * s, z, [0.5, 0.34, 0.1], false, 0.9).scale.setScalar(1);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 3.6 * s, z), col: new THREE.Color(1.0, 0.75, 0.3), i: 7, range: 16, prio: 1, on: true });
  L.updates.push((dt, t) => { Lt.i = (7 + Math.sin(t * 1.7) * 0.6) * (L.lightK || 1); const c = R.camera.position; if (Math.hypot(c.x - x, c.z - z) < 55 && RNG() < dt * 7) FX.puff(V3(x + rnd(-2.2, 2.2) * s, y + (2.6 + RNG() * 3.2) * s, z + rnd(-2.2, 2.2) * s), 1, { add: true, size: 0.024, grow: 0.1, col: [2.6, 1.8, 0.6], a: 0.95, life: 4.5, spread: 0.15, rise: -0.3, drag: 0.2 }); });
  WORLD.clearGrass(L, x, z, 0.6);
  if (o.seed !== false) WORLD.loot(L, x + 0.9, z + 0.7, [['seed', 1]], { id: 'sap' + (x | 0) });
};
/* ------------------------------------------------------------------ a soldier's tent: canvas that sags between ridge and pegs, flaps parted on a dark inside, poles, guy ropes */
REALM.tentGeo = function () {
  if (REALM._tg) return REALM._tg; const P = [], UV = [], C = [], I = [], W = 1.8, Hh = 2.15, Lh = 1.95, rs = mulberry(77);
  const v = (x, y, z, u, w, c) => { P.push(x, y, z); UV.push(u, w); C.push(c, c * 0.98, c * 0.94); return P.length / 3 - 1; };
  const grime = (y) => 0.34 + 0.66 * smooth(0.0, 1.3, y) - 0.1 * rs();
  for (const sd of [-1, 1]) { const NU = 8, NV = 10, b = P.length / 3;   // the two slopes
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, w = j / NV, pegs = Math.abs(Math.sin(w * PI * 3)), sag = Math.sin(u * PI) * (0.1 + 0.07 * pegs) + u * u * 0.05 * (1 - pegs);
        const x = sd * (W * u + sag * 0.35), y = Hh * (1 - u) - sag * 0.75 + (i === NU ? 0.05 * (1 - pegs) : 0), z = -Lh + w * Lh * 2 + Math.sin(u * 3 + w * 7) * 0.015; v(x, Math.max(0.02, y), z, w * Lh * 2 / 0.16, u * 2.8 / 0.16, grime(y)); }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = b + j * (NU + 1) + i, c = a + NU + 1; if (sd > 0) I.push(a, c, a + 1, a + 1, c, c + 1); else I.push(a, a + 1, c, a + 1, c + 1, c); } }
  { const z = -Lh, top = v(0, Hh, z, 0, 0, 0.8), l = v(-W, 0.02, z, -W / 0.16, Hh / 0.16, 0.5), r = v(W, 0.02, z, W / 0.16, Hh / 0.16, 0.5), m = v(0, 0.02, z - 0.06, 0, Hh / 0.16, 0.52); I.push(top, m, l, top, r, m); }   // back wall
  for (const sd of [-1, 1]) { const z = Lh, top = v(sd * 0.02, Hh, z, 0, 0, 0.82), out = v(sd * W, 0.02, z, sd * W / 0.16, Hh / 0.16, 0.5), inn = v(sd * 0.62, 0.02, z + 0.22, sd * 0.3, Hh / 0.16, 0.56), mid = v(sd * 0.3, Hh * 0.5, z + 0.1, sd * 0.1, 0.5 * Hh / 0.16, 0.7); I.push(top, out, mid, mid, out, inn); }   // front flaps, drawn back
  { const z = Lh - 0.5, a = v(-0.9, 0.0, z, 0, 0, 0), b2 = v(0.9, 0.0, z, 0, 0, 0), c = v(0, Hh * 0.96, z, 0, 0, 0); I.push(a, b2, c); const f1 = v(-W, 0.03, -Lh, 0, 0, 0.05), f2 = v(W, 0.03, -Lh, 0, 0, 0.05), f3 = v(W, 0.03, Lh, 0, 0, 0.05), f4 = v(-W, 0.03, Lh, 0, 0, 0.05); I.push(f1, f3, f2, f1, f4, f3); }   // the dark inside, the floor
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); REALM._tg = g; return g;
};
LIM.tent = function (L, x, z, yaw) {
  const y = WORLD.gy(x, z), M = WORLD.M(), hs = TEX.sets.hessian, k = 0.92 + hash2(x | 0, z | 0) * 0.2;
  const mat = REALM._tm2 || (REALM._tm2 = new THREE.MeshStandardMaterial({ map: hs ? hs.map : null, normalMap: hs ? hs.normalMap : null, color: 0xf4e8cc, roughness: 1, metalness: 0, side: THREE.DoubleSide, vertexColors: true, envMapIntensity: 0.15 })); if (hs) mat.normalScale.set(0.5, 0.5);
  const me = new THREE.Mesh(REALM.tentGeo(), mat); me.position.set(x, y - 0.03, z); me.rotation.y = yaw; me.scale.set(k, k, k); me.castShadow = true; me.receiveShadow = true; LEVEL.add(me);
  const c = Math.cos(yaw), s = Math.sin(yaw), P = (lx, ly, lz) => [x + (lx * c + lz * s) * k, y + ly * k, z + (-lx * s + lz * c) * k];
  KIT.beam(P(0, 2.2, -2.1), P(0, 2.2, 2.1), 0.07, M.wood); for (const lz of [-1.95, 1.95]) KIT.beam(P(0, -0.2, lz), P(0, 2.5, lz), 0.07, M.wood);
  for (const [lx, lz] of [[1.5, 3.5], [-1.5, 3.5], [1.5, -3.5], [-1.5, -3.5]]) { const a = P(0, 2.3, lz > 0 ? 1.95 : -1.95), b = P(lx, 0, lz); b[1] = WORLD.gy(b[0], b[2]) + 0.05; KIT.beam(a, b, 0.018, M.wood); KIT.beam([b[0], b[1] - 0.15, b[2]], [b[0] + (b[0] - a[0]) * 0.03, b[1] + 0.22, b[2] + (b[2] - a[2]) * 0.03], 0.045, M.wood); }
  PHY.obox(x, z, 1.6 * k, 1.85 * k, y, y + 1.9, yaw); WORLD.clearGrass(L, x, z, 1.9);
};
/* ------------------------------------------------------------------ the levels apply their worn ground once everything has been placed */
(function () {
  const g0 = WORLD.grace, cf0 = WORLD.campfire, ch0 = WORLD.chest;
  WORLD.grace = function (L, cp, x, z, name, guide) { WORLD.clearGrass(L, x, z, 1.3); return g0(L, cp, x, z, name, guide); };
  WORLD.campfire = function (L, x, z) { WORLD.clearGrass(L, x, z, 1.2); return cf0(L, x, z); };
  WORLD.chest = function (L, x, z, yaw, give, o) { WORLD.clearGrass(L, x, z, 0.7); return ch0(L, x, z, yaw, give, o); };
  for (const id in LEVEL.defs) { const def = LEVEL.defs[id], b0 = def.build, s0 = def.onStart; def.build = async function (L) { const r = await b0(L); WORLD.applyClear(L); return r; }; if (s0) def.onStart = function (L, cp) { const r = s0(L, cp); WORLD.applyClear(L); return r; }; }
})();
/* ------------------------------------------------------------------ fire: tongues of flame that lick and break, a hot core, a halo, embers on the draught */
WORLD.flameMat = function () {
  if (WORLD._fm2) return WORLD._fm2;
  WORLD._fm2 = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'uniform float uT; varying vec2 vUv; varying float vS; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); vS = w.x * 3.1 + w.z * 1.7; vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); float sx = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2])), sy = length(vec3(modelMatrix[1][0], modelMatrix[1][1], modelMatrix[1][2])); vec3 p = w.xyz + r * position.x * sx * 1.9 + vec3(0.0, 1.0, 0.0) * position.y * sy * 0.95; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv; varying float vS;
      float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 u = vUv; float t = uT * 1.5 + vS;
        float n1 = n(vec2(u.x * 3.2 + sin(u.y * 4.0 + t) * 0.25, u.y * 2.4 - t * 1.9)), n2 = n(vec2(u.x * 7.0 + 3.0, u.y * 5.2 - t * 3.2)), n3 = n(vec2(u.x * 16.0 + 9.0, u.y * 10.0 - t * 5.4));
        float nz = n1 * 0.55 + n2 * 0.3 + n3 * 0.15; float x = (u.x - 0.5) * 2.4 + (n1 - 0.5) * 0.9 * u.y + sin(t * 2.3 + u.y * 5.0) * 0.08 * u.y;
        float w = mix(0.8, 0.03, pow(u.y, 0.85)) * (0.6 + 0.8 * nz) * (0.82 + 0.3 * sin(u.x * 19.0 + t * 1.7 + n2 * 4.0) * u.y);
        float body = 1.0 - smoothstep(w * 0.25, w, abs(x)); float top = smoothstep(0.0, 0.06, u.y) * (1.0 - smoothstep(0.22, 0.9, u.y + (nz - 0.5) * 1.25));
        float f = body * top, heat = f * (1.0 - u.y * 0.7) * (0.7 + 0.6 * n2);
        vec3 c = mix(vec3(2.6, 0.32, 0.03), vec3(5.0, 1.7, 0.22), smoothstep(0.1, 0.45, heat)); c = mix(c, vec3(6.4, 4.8, 2.2), smoothstep(0.5, 0.92, heat));
        float glow = exp(-x * x * 3.0) * exp(-u.y * 3.2) * 0.22;
        gl_FragColor = vec4(c * f * (0.8 + 0.4 * n3) + vec3(2.4, 0.9, 0.2) * glow, 1.0); }` });
  return WORLD._fm2;
};
(function () {
  const f0 = WORLD.fire;
  WORLD.fire = function (L, x, y, z, size, o) {
    const me = f0(L, x, y, z, size, o); const hal = WORLD.glow(x, y + size * 0.5, z, [0.5, 0.2, 0.05], false, 0.55 * Math.min(1.4, size + 0.4));
    L.updates.push((dt) => { const c = R.camera.position, d = Math.hypot(c.x - x, c.z - z); hal.visible = me.visible; if (!me.visible || d > 55) return;
      if (RNG() < dt * (3 + size * 9)) FX.puff(V3(x + rnd(-0.2, 0.2) * size, y + size * (0.3 + RNG() * 0.6), z + rnd(-0.2, 0.2) * size), 1, { add: true, size: 0.014 + RNG() * 0.012, grow: 0.1, col: [3.2, 1.3, 0.25], a: 1, life: 1.1 + RNG() * 1.4, spread: 0.35 * size, vel: V3(rnd(-0.3, 0.3), 1.2 + RNG() * 1.6, rnd(-0.3, 0.3)), drag: 0.5, rise: 0.6 });
      if (size > 0.6 && d < 35 && RNG() < dt * 1.6) FX.puff(V3(x, y + size * 1.5, z), 1, { size: 0.35 * size, grow: 3, col: [0.07, 0.065, 0.06], a: 0.22, life: 2.6, spread: 0.2, vel: V3(0.5, 1.2, 0.2), drag: 0.3, rise: 0.5 }); });
    return me;
  };
  /* a campfire: a ring of stones (the scanned pit where it is loaded), charred logs leaning together, the fire in the middle */
  WORLD.campfire = function (L, x, z) {
    const y = WORLD.gy(x, z), M = WORLD.M(); WORLD.clearGrass(L, x, z, 1.5);
    if (AST.sets.stone_fire_pit) { const p = AST.mesh('firepit', { env: 0.3, grade: [0.6, 0.8, 0.8, 0.8] }); p.position.set(x, y - 0.06, z); p.rotation.y = x * 1.3; p.scale.setScalar(1.05); LEVEL.add(p); }
    else for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; TERRAIN.rock(x + Math.cos(a) * 0.62, z + Math.sin(a) * 0.62, 0.17, 0.2, i * 7 + 3, TERRAIN.cliffMat(0x8a8478), { col: false, y: y + 0.03, detail: 1 }); }
    const char = WORLD._char || (WORLD._char = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.95, emissive: new THREE.Color(1.0, 0.25, 0.04), emissiveIntensity: 0.5 })); char.userData.tscale = 1;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; KIT.rbox(x + Math.cos(a) * 0.2, y + 0.2, z + Math.sin(a) * 0.2, 0.055, 0.34, 0.055, 0.85 * Math.sin(a), 0, -0.85 * Math.cos(a), char, 0.02); }
    PHY.cyl(x, z, 0.62, y - 1, y + 0.5);
    return WORLD.fire(L, x, y + 0.12, z, 0.95, { range: 12, i: 4.2 });
  };
})();

/* ------------------------------------------------------------------ HUD: the bars grow with the Tarnished */
(function () { const u0 = HUD.update; let last = '';
  HUD.update = function (dt) { u0(dt); const P = PLAYER.a; if (!OR.curGrace && document.body.classList.contains('rest')) document.body.classList.remove('rest'); if (!P) return; const w = (v, base) => (46 + 54 * sat((v - base) / 320)).toFixed(1) + '%', hp = w(OR.hpMax(), 100), fp = w(OR.fpMax ? OR.fpMax() : 60, 60) , st = w(OR.stamMax(), 100), key = hp + fp + st;
    if (key !== last) { last = key; MG.$('hpBar').style.width = hp; MG.$('fpBar').style.width = 'calc(' + fp + ' * 0.7)'; MG.$('rageBar').style.width = 'calc(' + st + ' * 0.84)'; } };
})();

/* ------------------------------------------------------------------ graphics detail: FULL (everything) or PERFORMANCE (no undergrowth, flower drifts, cloud shadows or leaf shadows, a notch less resolution; turf and trees stay) */
WORLD.detail = 1;
WORLD.setDetail = function (d, quiet) {
  WORLD.detail = d; try { localStorage.setItem('or_detail', String(d)); } catch (e) { /* */ }
  const L = LEVEL.cur; if (!L) return;
  R.scene.traverse((o) => { if ((o.isInstancedMesh && o.material && o.material._sway) || (o.isPoints && o.material.uniforms && o.material.uniforms.uCl)) { o._lean = d === 0; if (d === 0) o.visible = false; else if (o.isPoints) o.visible = true; } });
  if (L._cloudK === undefined) L._cloudK = WORLD.CLOUD[1]; WORLD.CLOUD[1] = d === 0 ? 0 : L._cloudK;
  R.scene.traverse((o) => { if (o.isInstancedMesh && o.material && o.material.customProgramCacheKey && o.material.customProgramCacheKey() === 'orleaf') { if (o._cs === undefined) o._cs = o.castShadow; o.castShadow = d === 0 ? false : o._cs; } });
  R.dynScale = d === 0 ? 0.82 : 1; R.applyScale();   // (a fixed step in resolution, not the adaptive one)
  if (!quiet) HUD.pop(d === 0 ? 'GRAPHICS: PERFORMANCE' : 'GRAPHICS: FULL DETAIL');
};
(function () { try { const v = localStorage.getItem('or_detail'); if (v === '0' && !MG.test) WORLD.detail = 0; } catch (e) { /* */ }
  for (const id in LEVEL.defs) { const def = LEVEL.defs[id], s0 = def.onStart; def.onStart = function (L, cp) { const r = s0 ? s0(L, cp) : undefined; if (WORLD.detail === 0) WORLD.setDetail(0, true); return r; }; }
  // the scatter's own distance culling must not bring lean-mode plants back
  const sc0 = AST.scatter; AST.scatter = function (L, list, o) { const out = sc0(L, list, o); L.updates.push(() => { if (WORLD.detail !== 0) return; for (const b of out) for (const m of b.ms) if (m._lean) m.visible = false; }); return out; };
})();
