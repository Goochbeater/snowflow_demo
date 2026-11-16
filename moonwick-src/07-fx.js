// ===== 07-fx: particles — flame, smoke, sparks, dust, flying rubble, flashes, lights  (OWNER: coordinator) =====
// Two instanced billboard pools (additive: flame/sparks/flash · blended: smoke/dust/spray), one instanced pool of physical
// voxel cubes (rubble), a small pool of point lights. Everything is simulated on the CPU in typed arrays.
{
  const W = AF.W, V3 = THREE.Vector3;
  const rnd = Math.random, rs = (a) => (rnd() * 2 - 1) * a;
  // ---- puff atlas (2x2 soft noisy blobs)
  const mkAtlas = () => {
    const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S * 2;
    const g = cv.getContext('2d'), img = g.createImageData(S * 2, S * 2), d = img.data;
    for (let t = 0; t < 4; t++) {
      const ox = (t & 1) * S, oy = (t >> 1) * S, sd = t * 37.7;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const u = (x + 0.5) / S * 2 - 1, v = (y + 0.5) / S * 2 - 1, r = Math.hypot(u, v);
        const n = AF.fbm2(u * 2.6 + sd, v * 2.6 - sd, 4), n2 = AF.fbm2(u * 6 + sd * 2, v * 6 + sd, 3);
        let a = 1 - AF.smooth(0.25 + n * 0.5, 0.62 + n * 0.42, r); a *= 0.55 + 0.45 * n2; a = Math.max(0, Math.min(1, a));
        const lum = 0.45 + 0.55 * AF.smooth(0.2, 0.9, n * 0.6 + n2 * 0.4 + (0.35 - v * 0.35));
        const i = ((oy + y) * S * 2 + ox + x) * 4; d[i] = d[i + 1] = d[i + 2] = Math.round(lum * 255); d[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; return tex;
  };
  const atlas = mkAtlas();
  const quad = new THREE.PlaneGeometry(1, 1);
  const mkPool = (N, additive) => {
    const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.attributes.position = quad.attributes.position; g.attributes.uv = quad.attributes.uv;
    const aPos = new Float32Array(N * 3), aMisc = new Float32Array(N * 4), aCol = new Float32Array(N * 4);
    const bP = new THREE.InstancedBufferAttribute(aPos, 3), bM = new THREE.InstancedBufferAttribute(aMisc, 4), bC = new THREE.InstancedBufferAttribute(aCol, 4);
    for (const b of [bP, bM, bC]) b.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aPos', bP); g.setAttribute('aMisc', bM); g.setAttribute('aCol', bC); g.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uTime: { value: 0 }, uFlameK: { value: 1 }, uDragW: { value: new THREE.Vector4(0, 0, 0, 0) }, uTex: { value: atlas }, uLight: { value: new THREE.Color(1, 1, 1) }, uFogC: { value: new THREE.Color(0.7, 0.8, 0.9) }, uFog: { value: new THREE.Vector2(120, 620) } },
      vertexShader: `
        attribute vec3 aPos; attribute vec4 aMisc; attribute vec4 aCol; uniform vec4 uDragW;
        varying vec2 vUv; varying vec4 vCol; varying float vD; varying float vStretch; varying float vNear; varying vec2 vL; varying float vSeed; varying float vKind;
        void main() {
          vec4 mv = viewMatrix * vec4(aPos, 1.0);
          float c = cos(aMisc.y), s = sin(aMisc.y);
          vec2 q = position.xy; q.y *= aMisc.w;
          mv.xy += vec2(q.x * c - q.y * s, q.x * s + q.y * c) * aMisc.x;
          gl_Position = projectionMatrix * mv;
          float tz = floor(aMisc.z + 0.01), t = mod(tz, 4.0); vKind = floor(tz * 0.25 + 0.01);
          vUv = (uv + vec2(mod(t, 2.0), floor(t * 0.5))) * 0.5; vCol = aCol; vD = -mv.z; vL = uv; vStretch = aMisc.w; vSeed = fract(aMisc.y * 1.731 + aPos.x * 0.173 + aPos.z * 0.119);
          // a puff right in front of the lens fades out instead of filling the screen
          vNear = smoothstep(aMisc.x * 0.25 + 0.4, aMisc.x * 1.1 + 2.0, vD) * clamp(1.7 - aMisc.x / max(vD, 0.2) * 3.2, 0.22, 1.0);      // ...and nothing may paper over the whole view
          // CLARITY: whatever hangs between the lens and the dragon thins out round it, so the player never loses the dragon
          if (uDragW.w > 0.5) { vec4 dv = viewMatrix * vec4(uDragW.xyz, 1.0); if (-mv.z < -dv.z - 0.6) { vec4 dc = projectionMatrix * dv; vec2 dn = dc.xy / max(dc.w, 0.01), pn = gl_Position.xy / max(gl_Position.w, 0.01); float asp = projectionMatrix[1][1] / projectionMatrix[0][0]; float sd = length((pn - dn) * vec2(asp, 1.0)); vNear *= mix(0.10, 1.0, smoothstep(0.16, 0.55, sd)); } }
        }`,
      fragmentShader: additive ? `
        uniform sampler2D uTex; uniform vec2 uFog; uniform float uTime; uniform float uFlameK; varying float vStretch; varying vec2 vUv; varying vec4 vCol; varying float vD; varying float vNear; varying vec2 vL; varying float vSeed; varying float vKind;
        void main() {
          vec4 t = texture2D(uTex, vUv);
          float f = smoothstep(uFog.x, uFog.y * 1.6, vD);
          float shape = t.a * t.a * (0.6 + 0.8 * t.r); vec3 col = vCol.rgb;
          if (vKind < 0.5) {
            // LIVING FLAME: noise streams up through the puff and eats it into tongues; the heart stays pale, the torn edges go red
            // a TONGUE: wide and white-hot at the root, narrowing to a dark red tip that tears away
            float ty = vL.y, tx = (vL.x - 0.5) * (1.0 + ty * ty * 1.9);
            float rim = (1.0 - smoothstep(0.22, 0.46, length(vec2(tx, (ty - 0.42) * 0.82)))) * smoothstep(0.0, 0.10, ty);
            vec2 nu = vec2(vL.x * 0.85 + vSeed * 3.0, vL.y * 0.62 - uTime * (0.38 + vSeed * 0.3) + vSeed * 5.0);
            float n = (texture2D(uTex, abs(fract(nu * 0.5) * 2.0 - 1.0) * 0.40 + vec2(0.55, 0.05)).r - 0.45) * 1.82;
            float n2 = (texture2D(uTex, abs(fract(nu * 1.15 + 0.37) * 2.0 - 1.0) * 0.40 + vec2(0.05, 0.55)).r - 0.45) * 1.82;
            float e = t.a * 1.3 + (n * 0.68 + n2 * 0.32 - 0.5) * 0.9 * rim;
            float body = smoothstep(0.30, 0.95, e) * rim, core = smoothstep(0.85, 1.3, e);
            float hgt = smoothstep(0.12, 0.92, ty);
            core *= 1.0 - hgt * 0.85;
            shape = body * (0.45 + 1.25 * core) * (1.0 - 0.55 * hgt) * mix(uFlameK, 1.0, smoothstep(2.85, 2.95, vStretch));      // hero flames (the firestorm) are never dimmed
            vec3 ramp = mix(vec3(1.0, 0.40, 0.07), vec3(0.62, 0.07, 0.015), smoothstep(0.35, 1.0, hgt));
            col *= mix(ramp, vec3(1.0, 0.93, 0.70), core);
          }
          gl_FragColor = vec4(col * shape * vCol.a * (1.0 - f * 0.85) * vNear * mix(0.3, 1.0, smoothstep(3.0, 18.0, vD)), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` : `
        uniform sampler2D uTex; uniform vec3 uLight; uniform vec3 uFogC; uniform vec2 uFog; uniform float uTime; varying vec2 vUv; varying vec4 vCol; varying float vD; varying float vNear; varying vec2 vL; varying float vSeed; varying float vKind;
        void main() {
          vec4 t = texture2D(uTex, vUv);
          // smoke and dust curl: slow noise drifts through the puff so its edge is wisps, not a disc
          vec2 nu = vec2(vL.x * 0.7 + vSeed * 2.0 + uTime * 0.05, vL.y * 0.7 - uTime * (0.12 + vSeed * 0.1) + vSeed * 4.0);
          float n = (texture2D(uTex, abs(fract(nu * 0.5) * 2.0 - 1.0) * 0.40 + vec2(0.55, 0.55)).r - 0.45) * 1.82;
          float rim = 1.0 - smoothstep(0.24, 0.48, length(vL - 0.5));
          float wisp = smoothstep(0.16, 0.74, t.a * 1.15 + (n - 0.5) * 0.6 * rim) * rim;
          t.r = clamp(t.r + (n - 0.5) * 0.35, 0.0, 1.0);
          float a = wisp * min(1.0, vCol.a) * (0.15 + 0.85 * vNear) * mix(0.26, 1.0, smoothstep(6.0, 34.0, vD)); if (a < 0.004) discard;
          float glow = max(0.0, vCol.a - 1.0);                         // alpha above 1 = lit from below by fire
          vec3 c = vCol.rgb * (0.5 + 0.75 * t.r) * uLight + vec3(1.0, 0.38, 0.08) * glow * (1.3 - t.r);
          float f = smoothstep(uFog.x, uFog.y, vD);
          c = mix(c, uFogC, f * 0.9);
          gl_FragColor = vec4(c, a * (1.0 - f * 0.5));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = additive ? 6 : 5; mesh.name = additive ? 'fx-add' : 'fx-alpha';
    // sim state: px py pz vx vy vz age life s0 s1 rot vrot r g b a drag buoy kind tile
    const ST = 22, st = new Float32Array(N * ST);
    return { N, n: 0, st, ST, aPos, aMisc, aCol, bP, bM, bC, g, mesh, mat, additive };
  };
  const ADD = mkPool(9000, true), ALP = mkPool(7000, false);
  // kinds: additive 0 flame (colour ramp) 1 spark 2 flash 3 ember ; alpha 0 smoke 1 dust 2 spray
  const emit = (P, x, y, z, vx, vy, vz, life, s0, s1, r, g, b, a, drag, buoy, kind, str) => {
    let i;
    if (P.n < P.N) i = P.n++; else i = (rnd() * P.N) | 0;       // full: overwrite a random one
    const o = i * P.ST, s = P.st;
    s[o] = x; s[o + 1] = y; s[o + 2] = z; s[o + 3] = vx; s[o + 4] = vy; s[o + 5] = vz; s[o + 6] = 0; s[o + 7] = life; s[o + 8] = s0; s[o + 9] = s1;
    { const fl = P.additive && kind === 0; s[o + 10] = fl ? rs(0.4) : rnd() * 6.283; s[o + 11] = fl ? rs(0.35) : rs(1.2); } s[o + 12] = r; s[o + 13] = g; s[o + 14] = b; s[o + 15] = a; s[o + 16] = drag; s[o + 17] = buoy; s[o + 18] = kind; s[o + 19] = (rnd() * 4) | 0; s[o + 20] = str || 1; s[o + 21] = 0;
  };
  const stepPool = (P, dt, wx, wz) => {
    const s = P.st, ST = P.ST, ap = P.aPos, am = P.aMisc, ac = P.aCol, add = P.additive;
    let n = P.n;
    for (let i = 0; i < n; i++) {
      const o = i * ST;
      let age = s[o + 6] + dt; const life = s[o + 7];
      if (age >= life) { n--; if (i < n) { s.copyWithin(o, n * ST, n * ST + ST); i--; } continue; }
      s[o + 6] = age;
      const k = age / life, drag = s[o + 16], kind = s[o + 18];
      const dk = Math.max(0, 1 - drag * dt);
      let vx = s[o + 3] * dk, vy = s[o + 4] * dk + s[o + 17] * dt, vz = s[o + 5] * dk;
      if (!add || kind === 3) { const wk = Math.min(1, age * 0.6) * dt * 0.9; vx += (wx * 6 - vx) * wk; vz += (wz * 6 - vz) * wk; }
      s[o + 3] = vx; s[o + 4] = vy; s[o + 5] = vz;
      s[o] += vx * dt; s[o + 1] += vy * dt; s[o + 2] += vz * dt;
      s[o + 10] += s[o + 11] * dt;
      const i3 = i * 3, i4 = i * 4;
      ap[i3] = s[o]; ap[i3 + 1] = s[o + 1]; ap[i3 + 2] = s[o + 2];
      const size = s[o + 8] + (s[o + 9] - s[o + 8]) * (add ? k : 1 - (1 - k) * (1 - k));
      am[i4] = size; am[i4 + 1] = s[o + 10]; am[i4 + 2] = s[o + 19] + kind * 4; am[i4 + 3] = s[o + 20];
      let r = s[o + 12], g = s[o + 13], b = s[o + 14], a = s[o + 15];
      if (add) {
        if (kind === 0) { // flame ramp: white-yellow -> orange -> red -> gone
          const h = 1 - k; r = (1.05 + 0.95 * h) * r; g = (0.1 + 1.05 * h * h) * g; b = (0.008 + 0.42 * h * h * h * h) * b; a *= Math.min(1, k * 9) * (1 - k * k);
        } else if (kind === 2) a *= (1 - k) * (1 - k);
        else a *= Math.min(1, (1 - k) * 3) * (kind === 3 ? 0.6 + 0.4 * Math.sin(age * 17 + i) : 1);
      } else {
        const fade = Math.min(1, k * 7) * (1 - k) * (1 - k * 0.3);
        if (kind === 0 && a > 1) a = 1 + (a - 1) * Math.max(0, 1 - k * 3.5); // under-glow dies as the puff rises
        a = a > 1 ? (fade + (a - 1) * fade) : a * fade;
        if (kind === 0 && a > 1) a = Math.min(a, 1 + fade * 1.2);
      }
      ac[i4] = r; ac[i4 + 1] = g; ac[i4 + 2] = b; ac[i4 + 3] = a;
    }
    P.n = n; P.g.instanceCount = n;
    P.bP.needsUpdate = P.bM.needsUpdate = P.bC.needsUpdate = true;
    if (n < P.N) { P.bP.updateRange.count = n * 3; P.bM.updateRange.count = n * 4; P.bC.updateRange.count = n * 4; } else { P.bP.updateRange.count = P.bM.updateRange.count = P.bC.updateRange.count = -1; }
    for (const b of [P.bP, P.bM, P.bC]) b.updateRange.offset = 0;
  };

  // ---- flying rubble: instanced voxel cubes with the world material
  const DN = 5000;
  const cubeM = new AF.Model(1, 1, 1); cubeM.set(0, 0, 0, 1);
  const cubeG = AF.meshModel(cubeM, { vs: 1, anchor: [0.5, 0.5, 0.5] });
  const dPal = new Uint16Array(DN);
  cubeG.deleteAttribute('aPal'); const dPalAttr = new THREE.InstancedBufferAttribute(dPal, 1); dPalAttr.setUsage(THREE.DynamicDrawUsage); cubeG.setAttribute('aPal', dPalAttr);
  let dMesh = null;
  const DS = 16, dst = new Float32Array(DN * DS); let dn = 0;   // px py pz vx vy vz ax ay az ang spin size age life rest pal
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), ax3 = new V3(), p3 = new V3(), s3 = new V3();
  const FX = AF.fx = {};
  FX.pools = { ADD, ALP };
  const palPick = (pal) => Array.isArray(pal) || (pal && pal.length) ? (pal[(rnd() * pal.length) | 0] || AF.DK.wallDark) : (pal || AF.DK.wallDark);
  const dShape = new Uint8Array(DN);
  FX.cube = (x, y, z, vx, vy, vz, pal, size, life, shape) => {
    let i; if (dn < DN) i = dn++; else i = (rnd() * DN) | 0; dShape[i] = shape | 0;
    const o = i * DS; dst[o] = x; dst[o + 1] = y; dst[o + 2] = z; dst[o + 3] = vx; dst[o + 4] = vy; dst[o + 5] = vz;
    const a = rnd() * 6.283, b = rs(1); dst[o + 6] = Math.cos(a) * Math.sqrt(1 - b * b); dst[o + 7] = b; dst[o + 8] = Math.sin(a) * Math.sqrt(1 - b * b);
    dst[o + 9] = rnd() * 6; dst[o + 10] = rs(9); dst[o + 11] = size || 0.25; dst[o + 12] = 0; dst[o + 13] = life || (4 + rnd() * 4); dst[o + 14] = 0; dst[o + 15] = pal; dPal[i] = pal;
  };
  FX.debris = (x, y, z, o = {}) => {
    const n = o.n ?? 12, sp = o.speed ?? 7, up = o.up ?? 0.6;
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, e = rnd() * 1.4 - 0.3 + up * 0.5, v = sp * (0.35 + rnd() * 0.9), ce = Math.cos(e);
      FX.cube(x + rs(o.spread ?? 0.6), y + rs(o.spread ?? 0.6), z + rs(o.spread ?? 0.6), Math.cos(a) * ce * v, Math.sin(e) * v + sp * up * 0.4, Math.sin(a) * ce * v, (() => { const c = palPick(o.pal); return rnd() < 0.65 && AF.sootOf ? (AF.sootOf(c) || c) : c; })(), o.size ?? (rnd() < 0.1 ? 0.36 : 0.1 + rnd() * 0.14));
    }
  };
  // WRECKAGE with a shape: charred beams and broken slabs of wall and roof that tumble, land and lie where they fell
  FX.beams = (x, y, z, o = {}) => {
    const n = o.n ?? 4, sp = o.speed ?? 3;
    for (let i = 0; i < n; i++) { const a = rnd() * 6.283, v = sp * (0.3 + rnd()), beam = rnd() < (o.beamP ?? 0.6); let c = palPick(o.pal); if (AF.sootOf && rnd() < 0.75) c = AF.sootOf(c) || c;
      FX.cube(x + rs(o.spread ?? 1.2), y + rnd() * 1.2, z + rs(o.spread ?? 1.2), Math.cos(a) * v, 1 + rnd() * 3, Math.sin(a) * v, c, beam ? 0.26 + rnd() * 0.14 : 0.34 + rnd() * 0.2, 14 + rnd() * 10, beam ? 1 : 2); }
  };
  let deposits = 0;
  const stepDebris = (dt) => {
    if (!dMesh) return;
    const im = dMesh.instanceMatrix.array; let n = dn; deposits = 0;
    const SOL = AF.PAL.solid;
    for (let i = 0; i < n; i++) {
      const o = i * DS;
      let age = dst[o + 12] + dt; const life = dst[o + 13];
      if (age >= life) { n--; if (i < n) { dst.copyWithin(o, n * DS, n * DS + DS); dPal[i] = dPal[n]; dShape[i] = dShape[n]; i--; } continue; }
      dst[o + 12] = age;
      let x = dst[o], y = dst[o + 1], z = dst[o + 2];
      if (dst[o + 14] < 1) {
        let vx = dst[o + 3], vy = dst[o + 4] - 22 * dt, vz = dst[o + 5];
        const nx = x + vx * dt, ny = y + vy * dt, nz = z + vz * dt;
        const gy = W.groundY(nx, nz), hs = dst[o + 11] * 0.5;
        let hit = ny - hs < gy, c = 0;
        if (!hit) { c = W.getM(nx, ny - hs, nz); hit = c !== 0 && SOL[c] === 1; }
        if (hit) {
          if (gy < AF.PLAN.SEA_Y - 0.3 && ny - hs < AF.PLAN.SEA_Y && !c) { if (rnd() < 0.15) FX.splash(nx, nz, { size: 0.5 }); dst[o + 13] = age; continue; }   // sank
          if (Math.abs(vy) < 3.2 && vx * vx + vz * vz < 6) {
            dst[o + 14] = 1; dst[o + 10] = 0;
            // come to rest: sometimes become real rubble in the world
            if (dShape[i]) { dst[o + 6] = 0; dst[o + 7] = 1; dst[o + 8] = 0; } if (deposits < 6 && rnd() < 0.1 && dst[o + 11] < 0.3 && !dShape[i]) {      /* thrown crumbs mostly vanish: the rubble is the heap at the wall foot, not cubes across the square */ const bx = W.bx(x), bz = W.bz(z), by = W.by(Math.max(gy, AF.surfaceBelow(x, z, y + 0.3, 3)) + 0.01); if (!W.get(bx, by, bz)) { const lz = W.lazy; W.lazy = true; W.set(bx, by, bz, dPal[i]); W.lazy = lz; deposits++; dst[o + 13] = age; continue; } }
            dst[o + 13] = Math.min(life, age + 1.5 + rnd() * 2);
          } else { vy = Math.abs(vy) * 0.28; vx *= 0.55; vz *= 0.55; dst[o + 10] *= 0.5; if (ny - hs < gy) y = gy + hs; }
          dst[o + 3] = vx; dst[o + 4] = vy; dst[o + 5] = vz;
        } else { x = nx; y = ny; z = nz; dst[o + 3] = vx; dst[o + 4] = vy; dst[o + 5] = vz; }
        dst[o] = x; dst[o + 1] = y; dst[o + 2] = z; dst[o + 9] += dst[o + 10] * dt;
      }
      const cp = AF.camera.position, cd = Math.hypot(x - cp.x, y - cp.y, z - cp.z), k = age / life, sc = dst[o + 11] * (k > 0.85 ? (1 - k) / 0.15 : 1) * Math.min(1, cd / 2.5);
      ax3.set(dst[o + 6], dst[o + 7], dst[o + 8]); q4.setFromAxisAngle(ax3, dst[o + 9]); p3.set(x, y, z); { const sh = dShape[i]; if (sh === 1) s3.set(sc * 5.5, sc * 0.75, sc * 0.75); else if (sh === 2) s3.set(sc * 3.2, sc * 0.45, sc * 2.6); else s3.set(sc, sc, sc); }
      m4.compose(p3, q4, s3); m4.toArray(im, i * 16);
    }
    dn = n; dMesh.count = n; dMesh.instanceMatrix.needsUpdate = true; dPalAttr.needsUpdate = true;
  };

  // ---- lights: 4 for flashes, 4 for the biggest fires
  const flashL = [], fireL = [];
  FX.fireLights = fireL;
  // ---- shock rings
  const rings = []; let ringMat = null;

  // ---- public emitters
  FX.fire = (x, y, z, o = {}) => {
    const n = o.n ?? 4, sz = o.size ?? 1.2, life = o.life ?? 0.7, v = o.vel || [0, 0, 0], sp = o.spread ?? 0.35, rise = o.rise ?? 3.2;
    for (let i = 0; i < n; i++) emit(ADD, x + rs(sp), y + rs(sp * 0.6), z + rs(sp), v[0] + rs(0.8), v[1] + rise * (0.5 + rnd()), v[2] + rs(0.8), life * (0.6 + rnd() * 0.8), sz * (0.5 + rnd() * 0.5), sz * (1.1 + rnd() * 0.7), 1, 1, 1, o.a ?? 0.85, o.drag ?? 0.6, o.buoy ?? 3.5, 0, o.stretch ?? 1.7);
  };
  FX.smoke = (x, y, z, o = {}) => {
    const n = o.n ?? 2, sz = (o.size ?? 2.4) * ((o.dark ?? 0.7) < 0.2 ? 1.25 : 1), life = o.life ?? 6, v = o.vel || [0, 0, 0], d = o.dark ?? 0.7, rise = o.rise ?? 2.6, sp = o.spread ?? 0.6, glow = o.glow ?? 0;
    for (let i = 0; i < n; i++) { const c = (1 - d) * (0.55 + rnd() * 0.25) + 0.035; emit(ALP, x + rs(sp), y + rs(sp * 0.5), z + rs(sp), v[0] + rs(0.6), v[1] + rise * (0.6 + rnd() * 0.8), v[2] + rs(0.6), life * (0.7 + rnd() * 0.6), sz * (0.45 + rnd() * 0.3), sz * (o.grow ?? 3.2) * (0.8 + rnd() * 0.5), c * 1.05 * (d < 0.2 ? 0.55 : 1), c * (d < 0.2 ? 0.55 : 1), c * 0.97 * (d < 0.2 ? 0.58 : 1), ((o.a ?? 0.62) * (d < 0.2 ? 0.3 : 1)) + glow,      /* pale steam is thin, wide and grey at dusk: never the brightest thing in the street */ o.drag ?? 0.35, o.buoy ?? 0.5, 0, o.stretch); }
  };
  FX.dust = (x, y, z, o = {}) => {
    const n = o.n ?? 6, sz = o.size ?? 2, col = new THREE.Color(o.color ?? 0xa59a86), sp = o.speed ?? 3, life = o.life ?? 3;
    for (let i = 0; i < n; i++) { const a = rnd() * 6.283, v = sp * (0.3 + rnd()); emit(ALP, x + rs(0.8), y + rs(0.5), z + rs(0.8), Math.cos(a) * v, rnd() * sp * 0.5, Math.sin(a) * v, life * (0.6 + rnd() * 0.8), sz * 0.5, sz * (2 + rnd() * 1.5), col.r * 0.7, col.g * 0.7, col.b * 0.7, o.a ?? 0.5, 1.4, 0.15, 1); }
  };
  FX.sparks = (x, y, z, o = {}) => {
    const n = o.n ?? 12, sp = o.speed ?? 9, life = o.life ?? 1.2, col = new THREE.Color(o.color ?? 0xffb347);
    for (let i = 0; i < n; i++) { const a = rnd() * 6.283, e = rs(1.2) + 0.5, v = sp * (0.3 + rnd()); emit(ADD, x, y, z, Math.cos(a) * Math.cos(e) * v, Math.sin(e) * v, Math.sin(a) * Math.cos(e) * v, life * (0.4 + rnd()), 0.22, 0.08, col.r * 5, col.g * 4, col.b * 3, 1, 0.8, -9, 1); }
  };
  FX.embers = (x, y, z, o = {}) => {
    const n = o.n ?? 6, sp = o.spread ?? 1.5;
    for (let i = 0; i < n; i++) emit(ADD, x + rs(sp), y + rs(sp * 0.5), z + rs(sp), rs(1.5), 1.5 + rnd() * 3.5, rs(1.5), 2.5 + rnd() * 4, 0.16, 0.1, 6, 2.6, 0.5, 1, 0.25, 0.9, 3);
  };
  FX.flash = (x, y, z, o = {}) => {
    const col = new THREE.Color(o.color ?? 0xffc880), life = o.life ?? 0.35, I = o.intensity ?? 1, range = o.range ?? 40;
    if (o.sprite !== false) emit(ADD, x, y, z, 0, 0, 0, life, Math.min(14, range * 0.22), Math.min(30, range * 0.5), col.r * 6 * I, col.g * 5 * I, col.b * 4 * I, 1, 0, 0, 2);
    let best = flashL[0]; for (const l of flashL) if (l.userData.t <= 0) { best = l; break; } else if (l.userData.t < best.userData.t) best = l;
    if (best) { best.position.set(x, y, z); best.color.copy(col); best.userData.I = 900 * I * (range / 40); best.userData.t = best.userData.life = life * 1.6; best.distance = range * 2.2; }
  };
  FX.ring = (x, y, z, o = {}) => { if (!ringMat) return; let r = rings.find((q) => q.t <= 0); if (!r) return; r.mesh.position.set(x, y + 0.15, z); r.R = o.r ?? 14; r.t = r.life = o.life ?? 0.7; r.mesh.visible = true; };
  FX.splash = (x, z, o = {}) => {
    const sz = o.size ?? 1, y = AF.PLAN.SEA_Y;
    for (let i = 0; i < 10 * sz + 4; i++) emit(ALP, x + rs(0.6 * sz), y + rnd() * 0.5, z + rs(0.6 * sz), rs(2.2 * sz), (5 + rnd() * 7) * Math.sqrt(sz), rs(2.2 * sz), 0.8 + rnd() * 0.7, 0.22 * sz, 0.9 * sz, 0.92, 0.96, 1, 0.5, 0.5, -11, 2);
    for (let i = 0; i < 8; i++) { const a = rnd() * 6.283; emit(ALP, x + Math.cos(a) * sz, y + 0.1, z + Math.sin(a) * sz, Math.cos(a) * 2.5 * sz, 0.2, Math.sin(a) * 2.5 * sz, 1.2 + rnd(), 0.5 * sz, 1.8 * sz, 0.9, 0.95, 1, 0.3, 1.2, 0, 2); }
  };
  // the full fireball-on-impact show. Used by AF.boom.
  FX.explosion = (x, y, z, r, pals) => {
    FX.flash(x, y + 1, z, { intensity: 1.6 * Math.min(2, r / 5), range: r * 9, life: 0.45, sprite: false });      // light, not a disc
    const nf = Math.round(12 + r * 5.5);
    for (let i = 0; i < nf; i++) { const a = rnd() * 6.283, e = rs(1.3) + 0.35, v = r * (1.2 + rnd() * 3.2), ce = Math.cos(e); emit(ADD, x + rs(r * 0.3), y + rs(r * 0.3), z + rs(r * 0.3), Math.cos(a) * ce * v, Math.sin(e) * v + r * 0.6, Math.sin(a) * ce * v, 0.4 + rnd() * 0.55, r * 0.42, r * (0.7 + rnd() * 0.6), 1, 1, 1, 0.95, 2.2, 5, 0, 1); }
    for (let i = 0; i < Math.round(10 + r * 4); i++) { const a = rnd() * 6.283, v = r * (0.4 + rnd() * 1.6); FX.smoke(x + Math.cos(a) * r * 0.4, y + rnd() * r * 0.6, z + Math.sin(a) * r * 0.4, { n: 1, size: r * 0.55, dark: 0.82, rise: 3 + rnd() * 5, life: 5 + rnd() * 5, vel: [Math.cos(a) * v, r * 0.5, Math.sin(a) * v], grow: 2.6, glow: 1.4, a: 0.7, drag: 0.9 }); }
    FX.sparks(x, y, z, { n: Math.round(30 + r * 12), speed: r * 4.5, life: 1.6 });
    FX.embers(x, y + r * 0.5, z, { n: Math.round(r * 5), spread: r });
    FX.dust(x, y, z, { n: Math.round(8 + r * 3), size: r * 0.8, speed: r * 2.2, life: 4 });
    /* no ground ring: the shock is the atmosphere's screen ripple */
    if (pals && pals.length) FX.debris(x, y, z, { n: Math.min(150, Math.round(30 + r * r * 3)), pal: pals, speed: r * 3.4, up: 0.9, spread: r * 0.6 });
  };

  AF.onBuild('fx', 610, () => {
    AF.scene.add(ALP.mesh); AF.scene.add(ADD.mesh);
    dMesh = new THREE.InstancedMesh(cubeG, AF.mat.voxel, DN); dMesh.count = 0; dMesh.frustumCulled = false; dMesh.castShadow = false; dMesh.receiveShadow = true; dMesh.name = 'fx-debris'; dMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); AF.scene.add(dMesh);
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffb060, 0, 80, 1.6); l.userData.t = 0; AF.scene.add(l); flashL.push(l); }
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xff7a2a, 0, 70, 1.5); l.userData.I = 0; AF.scene.add(l); fireL.push(l); }
    ringMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), ringMat.clone()); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 4; AF.scene.add(m); rings.push({ mesh: m, t: 0, life: 1, R: 10 }); }
  });
  FX.timeScale = 1;
  AF.onTick('fx', 720, (dt) => {
    const wd = AF.fire && AF.fire.wind || { x: 0, z: 0 };
    stepPool(ADD, dt, wd.x, wd.z); stepPool(ALP, dt, wd.x, wd.z); stepDebris(dt);
    for (const l of flashL) { if (l.userData.t > 0) { l.userData.t -= dt; const k = Math.max(0, l.userData.t / l.userData.life); l.intensity = l.userData.I * k * k; } else l.intensity = 0; }
    for (const r of rings) if (r.t > 0) { r.t -= dt; const k = 1 - Math.max(0, r.t / r.life), s = r.R * (0.15 + 0.85 * Math.sqrt(k)); r.mesh.scale.set(s, s, s); r.mesh.material.opacity = 0.55 * (1 - k) * (1 - k); if (r.t <= 0) r.mesh.visible = false; }
    // light + fog for the blended particles
    const fog = AF.scene.fog, U = ALP.mat.uniforms, UA = ADD.mat.uniforms; U.uTime.value = UA.uTime.value = AF.clock.t;
    { const fs = (AF.atmos && AF.atmos.fireScreenRaw) || 0; UA.uFlameK.value += ((1 - 0.72 * Math.min(1, Math.max(0, (fs - 0.2) / 0.3))) - UA.uFlameK.value) * Math.min(1, dt * 3);      /* never more than about a third of the screen in flame */
      const D = AF.dragon, on = AF.playing && D && D.alive ? 1 : 0; if (D) { U.uDragW.value.set(D.pos.x, D.pos.y + 0.6, D.pos.z, on); UA.uDragW.value.copy(U.uDragW.value); } }
    if (fog) { U.uFogC.value.copy(fog.color); if (fog.isFog) { U.uFog.value.set(fog.near, fog.far); UA.uFog.value.set(fog.near, fog.far); } else { const d = 1 / Math.max(1e-5, fog.density); U.uFog.value.set(d * 0.15, d * 2.2); UA.uFog.value.set(d * 0.15, d * 2.2); } }
    const night = AF.time.night, sc = AF.sun.color, k = Math.min(1.25, AF.sun.intensity / 2.6) * (1 - night * 0.85);
    U.uLight.value.setRGB(0.2 + sc.r * k * 0.9 + 0.1 * (1 - night), 0.22 + sc.g * k * 0.9 + 0.1 * (1 - night), 0.27 + sc.b * k * 0.9 + 0.12 * (1 - night));
    AF.stats.fx = ADD.n + ALP.n + dn;
  });
}
