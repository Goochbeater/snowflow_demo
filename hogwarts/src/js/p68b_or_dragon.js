/* ==== p68b_or_dragon.js ==== */
/* OPUS RING — the dragon over Limgrave. A great wyvern on a long circuit: north of the river, round the Crag Keep,
   low over the road below the First Step, out across the lake — where it burns the ruins it once burnt before.
   It is weather, not a fight: a sculpted body, two membrane wings that beat in the vertex shader, fire that kills. */
LIFE.dragonBody = function () {
  return PROPS.sdfMesh('dragon4', (grp) => { const C = grp(0, 0.35), B = grp(1, 0.2), E = grp(3, 0.02);
    // trunk, keel, hips
    C.add(SDF.ell([0, 0, 0], [1.55, 1.5, 4.0])); C.add(SDF.ell([0, -0.25, 2.1], [1.8, 1.85, 2.3]), 'su', 0.5); C.add(SDF.ell([0, 0.1, -2.6], [1.35, 1.3, 2.2]), 'su', 0.5);
    C.both(SDF.ell([1.5, 0.65, 2.3], [0.95, 0.75, 1.3]), 'su', 0.4);   // wing shoulders
    // neck in an S, a long wedge of a head, jaw a little open
    C.add(SDF.rcone([0, 0.2, 3.6], [0, 1.5, 6.6], 1.2, 0.8), 'su', 0.5); C.add(SDF.rcone([0, 1.5, 6.6], [0, 1.9, 9.0], 0.8, 0.62), 'su', 0.3);
    C.add(SDF.ell([0, 2.0, 10.0], [0.72, 0.62, 1.25]), 'su', 0.25); C.add(SDF.rcone([0, 1.95, 10.6], [0, 1.7, 12.3], 0.5, 0.26), 'su', 0.2); C.add(SDF.rcone([0, 1.42, 10.2], [0, 1.1, 11.9], 0.34, 0.16), 'su', 0.12);
    C.both(SDF.ell([0.42, 2.3, 10.5], [0.2, 0.16, 0.42]), 'su', 0.1);   // brow ridges
    // tail
    C.add(SDF.rcone([0, 0.1, -3.8], [0, -0.3, -8.4], 1.2, 0.8), 'su', 0.5); C.add(SDF.rcone([0, -0.3, -8.4], [0, -0.1, -13.2], 0.8, 0.42), 'su', 0.3); C.add(SDF.rcone([0, -0.1, -13.2], [0, 0.5, -18.2], 0.42, 0.07), 'su', 0.2);
    // hind legs, tucked back along the tail
    C.both(SDF.ell([1.25, -0.9, -2.3], [0.68, 0.85, 1.5]), 'su', 0.3); C.both(SDF.rcone([1.4, -1.3, -2.8], [1.5, -1.9, -4.9], 0.46, 0.28), 'su', 0.2); C.both(SDF.rcone([1.5, -1.9, -4.9], [1.45, -1.6, -6.3], 0.26, 0.16), 'su', 0.12);
    // the pale belly
    B.add(SDF.ell([0, -1.15, 0.9], [1.05, 0.7, 3.4])); B.add(SDF.rcone([0, -0.5, 4.0], [0, 0.95, 7.4], 0.62, 0.46), 'su', 0.2);
    E.both(SDF.sph([0.5, 2.12, 10.75], 0.13));
  }, [-3.2, -3.0, -19, 3.2, 3.4, 13], 0.2);
};
/* a wing in the body's frame (right wing; mirror for the left): arm, forearm, four fingers, membrane scalloped between them. aU = span distance from the shoulder */
LIFE.dragonWing = function (sd) {
  const S = [0, 0], E = [5.2, 1.5], Wr = [10, 3.0], F = [[18, 1.6], [16.4, -4.0], [12.6, -7.6], [8.2, -9.2]], Bd = [0.2, -6.4], x0 = 1.55, y0 = 0.95, z0 = 2.3;
  const P = [], N = [], U = [], C = [], I = [];
  const v = (p, col, dy) => { P.push(sd * (x0 + p[0]), y0 + (dy || 0), z0 + p[1]); N.push(0, 1, 0); U.push(Math.max(0, p[0])); C.push(col[0], col[1], col[2]); return P.length / 3 - 1; };
  const mem = [0.2, 0.1, 0.075], memD = [0.1, 0.055, 0.045], mid = (a, b, pull, c) => [(a[0] + b[0]) / 2 + (c[0] - (a[0] + b[0]) / 2) * pull, (a[1] + b[1]) / 2 + (c[1] - (a[1] + b[1]) / 2) * pull];
  // membrane: fans from the wrist and the elbow, each panel subdivided so the scallops and the bending read
  const fan = (c, a, b, pull) => { const n = 5, ic = v(c, memD); let prev = v(a, mem); for (let i = 1; i <= n; i++) { const t = i / n, q = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], k = Math.sin(t * PI) * pull, p = [q[0] + (c[0] - q[0]) * k, q[1] + (c[1] - q[1]) * k], cur = v(p, i === n ? mem : [mem[0] * 0.9, mem[1] * 0.9, mem[2] * 0.9]); I.push(ic, prev, cur); prev = cur; } };
  fan(Wr, F[0], F[1], 0.26); fan(Wr, F[1], F[2], 0.26); fan(Wr, F[2], F[3], 0.26); fan(E, F[3], Bd, 0.3);
  { const a = v(S, memD), b = v(E, memD), c = v(Bd, mem), d = v(Wr, memD), e = v(F[3], mem), f = v(E, memD); I.push(a, b, c, f, d, e); }
  // bones: tapered three-sided struts standing a little proud of the membrane
  const bone = (a, b, r0, r1) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, col = [0.07, 0.06, 0.055]; const i0 = P.length / 3;
    for (const [p, r] of [[a, r0], [b, r1]]) { v([p[0] + nx * r, p[1] + nz * r], col, 0); v([p[0] - nx * r, p[1] - nz * r], col, 0); v(p, col, r * 1.5); v(p, col, -r * 1.5); }
    for (const [q0, q1] of [[0, 2], [2, 1], [1, 3], [3, 0]]) I.push(i0 + q0, i0 + q1, i0 + 4 + q0, i0 + q1, i0 + 4 + q1, i0 + 4 + q0); };
  bone(S, E, 0.5, 0.36); bone(E, Wr, 0.36, 0.26); for (const f of F) bone(Wr, f, 0.2, 0.05); bone([Wr[0] - 0.2, Wr[1]], [Wr[0] + 0.5, Wr[1] + 1.6], 0.16, 0.02);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(U, 1)); g.setIndex(I); return g;
};
/* horns, the crest of spines down the back, claws: plain cones merged into one mesh */
LIFE.dragonSpikes = function () {
  const G = [], cone = (a, b, r) => { const A = V3(a[0], a[1], a[2]), B = V3(b[0], b[1], b[2]), l = A.distanceTo(B), g = new THREE.ConeGeometry(r, l, 6, 1); g.translate(0, l / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YUP, B.clone().sub(A).normalize())); g.translate(A.x, A.y, A.z); G.push(g); };
  for (const sd of [1, -1]) { cone([sd * 0.42, 2.3, 9.8], [sd * 1.05, 3.5, 7.7], 0.26); cone([sd * 0.62, 1.9, 9.7], [sd * 1.4, 2.05, 8.4], 0.17); cone([sd * 0.3, 2.45, 10.4], [sd * 0.5, 3.0, 9.6], 0.12); for (let k = 0; k < 3; k++) cone([sd * (1.33 + k * 0.12), -1.6, -6.2], [sd * (1.25 + k * 0.2), -2.15, -7.0], 0.1); }
  for (let i = 0; i < 26; i++) { const z = 8.6 - i * 1.02, y = z > 3.6 ? 0.9 + (z - 3.6) * 0.33 : z > -3.8 ? 1.45 - Math.abs(z) * 0.06 : 1.2 + (z + 3.8) * 0.085, hgt = (z > -8 ? 0.85 : 0.45) * (0.7 + 0.3 * Math.sin(i * 2.1)) * (z > 6 ? 0.6 : 1); cone([0, y - 0.25, z], [0, y + hgt, z - 0.55], 0.2); }
  return ARM.merge(G);
};
/* scales: mottling in object space, a darker back, paler flanks */
LIFE.scaleHook = function (m) {
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOPd;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOPd = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vOPd; float dh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float dn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(dh(i), dh(i + vec3(1,0,0)), f.x), mix(dh(i + vec3(0,1,0)), dh(i + vec3(1,1,0)), f.x), f.y), mix(mix(dh(i + vec3(0,0,1)), dh(i + vec3(1,0,1)), f.x), mix(dh(i + vec3(0,1,1)), dh(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ float sc = dn(vOPd * vec3(2.6, 2.6, 1.7)) * 0.6 + dn(vOPd * 7.0) * 0.4; float bk = smoothstep(-0.6, 1.4, vOPd.y - abs(vOPd.x) * 0.3); diffuseColor.rgb *= (0.55 + 0.9 * sc) * mix(1.25, 0.7, bk); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.25, 0.8, 0.62), smoothstep(0.55, 0.8, sc)); }')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor - 0.25 * dn(vOPd * 7.0), 0.25, 1.0);'); };
  m.customProgramCacheKey = () => 'drgscale'; return m;
};
LIFE.dragon = function (L, o) {
  o = o || {}; const g = new THREE.Group(), U = { uFlap: { value: new THREE.Vector2(0, 0.5) } };
  const scale = LIFE.scaleHook(new THREE.MeshStandardMaterial({ color: 0x4a443e, roughness: 0.6, metalness: 0.1, envMapIntensity: 0.5 })), belly = new THREE.MeshStandardMaterial({ color: 0x7c684e, roughness: 0.8, envMapIntensity: 0.3 }), horn = new THREE.MeshStandardMaterial({ color: 0x8c8068, roughness: 0.5, envMapIntensity: 0.4 }), eye = new THREE.MeshBasicMaterial({ color: 0xffb040 });
  const body = new THREE.Mesh(LIFE.dragonBody(), [scale, belly, horn, eye]); body.frustumCulled = false; g.add(body);
  const spk = new THREE.Mesh(LIFE.dragonSpikes(), horn); spk.frustumCulled = false; g.add(spk);
  const wm = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  wm.onBeforeCompile = (sh) => { sh.uniforms.uFlap = U.uFlap;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aU; uniform vec2 uFlap; varying float vU;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { float sgn = sign(position.x), u = aU, k = u / 18.0; float ph = uFlap.x - k * 1.1, th = uFlap.y * (0.3 + 0.7 * k) * sin(ph) + 0.1 + 0.16 * k; float fold = 1.0 - 0.2 * uFlap.y * max(0.0, cos(ph)) * k;
        float uu = u * fold, y0 = 0.95, dy = position.y - y0; transformed.x = sgn * (1.55 + uu * cos(th) - dy * sin(th)); transformed.y = y0 + uu * sin(th) + dy * cos(th); transformed.z += sin(ph - 0.6) * uFlap.y * k * 1.4 - k * k * 1.2; vU = k; }`).replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = vec3(0.0, 1.0, 0.0);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vU;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.75 + 0.6 * vU;')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse = max(reflectedLight.directDiffuse, reflectedLight.indirectDiffuse * 0.4) + diffuseColor.rgb * vec3(1.0, 0.5, 0.22) * 0.3;'); };   // the membrane lets the sky through
  wm.customProgramCacheKey = () => 'drgwing';
  for (const sd of [1, -1]) { const w = new THREE.Mesh(LIFE.dragonWing(sd), wm); w.frustumCulled = false; g.add(w); }
  g.scale.setScalar(o.scale || 1.25); LEVEL.add(g);
  const cx = 30, cz = -120, ra = 178, rb = 86, per = o.period || 62, th0 = HALF - 0.42, D = { g, breath: 0, cd: 6, burn: [], th: th0 };
  const pos = (th, out) => out.set(cx + ra * Math.cos(th), 86 + 11 * Math.sin(th * 2 + 1) + 3 * Math.sin(th * 5), cz + rb * Math.sin(th));
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), m4 = new THREE.Matrix4(), fw = new THREE.Vector3(), rt = new THREE.Vector3(), up = new THREE.Vector3(), mouth = new THREE.Vector3(), tgt = new THREE.Vector3(), RU = [176, -112];
  let ph = 0, amp = 0.5;
  L.updates.push((dt, t) => {
    const th = th0 + t / per * TAU; D.th = th; pos(th, p); pos(th + 0.03, p2);
    // beat hard when climbing, glide on the long reaches
    const climb = (p2.y - p.y) / 0.03, want = clamp(0.36 + climb * 0.012 + 0.3 * Math.sin(t * 0.23) + (D.breath > 0 ? 0.3 : 0), 0.1, 0.9); amp = damp(amp, want, 1.5, dt); ph += dt * lerp(2.4, 4.2, amp); U.uFlap.value.set(ph, amp);
    fw.subVectors(p2, p).normalize(); const turn = TAU / per, bank = 0.34 + 0.06 * Math.sin(t * 0.4);   // it circles one way: a steady bank into the turn
    rt.crossVectors(YUP, fw).normalize(); up.crossVectors(fw, rt); m4.makeBasis(rt, up, fw); g.quaternion.setFromRotationMatrix(m4); g.rotateZ(-bank); void turn;
    g.position.copy(p); g.position.y += -Math.sin(ph) * 0.7 * amp;
    // ---- fire on the ruins
    if (MG.titleMode) return;
    const dR = Math.hypot(p.x - RU[0], p.z - RU[1]); D.cd -= dt;
    if (D.breath <= 0 && D.cd <= 0 && dR < 96 && fw.x * (RU[0] - p.x) + fw.z * (RU[1] - p.z) > 0) { D.breath = 3.4; D.cd = per * 0.7; D.sweep = [RU[0] - fw.x * 16 + rnd(-6, 6), RU[1] - fw.z * 16 + rnd(-6, 6), fw.x, fw.z]; }
    if (D.breath > 0) { D.breath -= dt; const k = 1 - D.breath / 3.4, gx = D.sweep[0] + D.sweep[2] * k * 36, gz = D.sweep[1] + D.sweep[3] * k * 36, gy = Math.max(WORLD.gy(gx, gz), LIM.WATER);
      mouth.set(0, 1.5, 12.4).applyMatrix4(g.matrixWorld); tgt.set(gx, gy, gz); const dir = tgt.clone().sub(mouth), len = dir.length(); dir.normalize();
      for (let i = 0; i < 5; i++) { const f = RNG(), q = mouth.clone().addScaledVector(dir, f * len); FX.puff(q, 1, { add: true, size: 1.2 + f * 5, grow: 3, col: [3.2, 1.5 - f * 0.6, 0.3], a: 0.55, life: 0.45 + f * 0.3, spread: 0.6 + f * 2.5, vel: dir.clone().multiplyScalar(30), drag: 1.5, rise: 2 }); }
      if (RNG() < dt * 9) D.burn.push({ x: gx + rnd(-2.5, 2.5), y: gy, z: gz + rnd(-2.5, 2.5), t: 7 + RNG() * 3 });
      if (RNG() < dt * 5) FX.flashLight(tgt.clone().setY(gy + 2), [3, 1.4, 0.4], 22, 34, 0.5); }
    // the ground it leaves burning
    const P = PLAYER.a; D.tick = (D.tick || 0) - dt; const hit = D.tick <= 0; if (hit) D.tick = 0.4;
    for (let i = D.burn.length - 1; i >= 0; i--) { const b = D.burn[i]; b.t -= dt; if (b.t <= 0) { D.burn.splice(i, 1); continue; }
      if (RNG() < dt * 14) FX.puff(V3(b.x + rnd(-1.6, 1.6), b.y + 0.3, b.z + rnd(-1.6, 1.6)), 1, { add: true, size: 0.9, grow: 1.6, col: [3.0, 1.2, 0.25], a: 0.7 * Math.min(1, b.t / 2), life: 0.7, spread: 0.4, rise: 3.2 });
      if (RNG() < dt * 2) FX.puff(V3(b.x, b.y + 1.5, b.z), 1, { size: 1.6, grow: 2.4, col: [0.08, 0.075, 0.07], a: 0.3, life: 2.4, spread: 0.6, rise: 2.6 });
      if (hit && P && P.alive && Math.hypot(P.x - b.x, P.z - b.z) < 3.4 && Math.abs(P.y - b.y) < 3) { COMBAT.damage(P, 16, { kind: 'fire', unblockable: true, dir: V3(P.x - b.x, 0, P.z - b.z).normalize() }); D.tick = 0.4; }
      if (hit) for (const e of ENEMY.list) if (e.alive && !e.hidden && Math.hypot(e.x - b.x, e.z - b.z) < 3.2) COMBAT.damage(e, 30, { kind: 'fire', unblockable: true, dir: V3(0, 0, 1) }); }
  });
  L.dragon = D; return D;
};
