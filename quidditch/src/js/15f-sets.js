// ===================== SETS: procedural interiors and exteriors for cutscenes, locker room and press =====================
// ---------- PBR canvas textures: albedo + normal + roughness from a procedural height field ----------
const PBR = {
  cache: {},
  // layout(i) -> list of cells {x,y,w,h,r(round),tone}; profile -> height inside a cell
  make(key, opts) {
    if (this.cache[key]) return this.cache[key];
    const N = opts.size || 512, H = new Float32Array(N * N), A = new Float32Array(N * N * 3), R = new Float32Array(N * N);
    const base = new THREE.Color(opts.color || '#777'), gap = new THREE.Color(opts.gap || '#222'), rnd = mulberry32(opts.seed || 7);
    const noise = (x, y, s) => fbm2(x * s, y * s, 3);
    // mortar / background
    for (let i = 0; i < N * N; i++) { H[i] = 0; A[i * 3] = gap.r; A[i * 3 + 1] = gap.g; A[i * 3 + 2] = gap.b; R[i] = opts.gapRough ?? 0.95; }
    for (const c of opts.cells(rnd, N)) {
      const tone = c.tone ?? (0.82 + rnd() * 0.3), hue = c.hue || 0, bev = c.bevel ?? opts.bevel ?? 4;
      const cr = base.r * tone * (1 + hue), cg = base.g * tone, cb = base.b * tone * (1 - hue * 0.5);
      const x0 = Math.floor(c.x), y0 = Math.floor(c.y), x1 = Math.ceil(c.x + c.w), y1 = Math.ceil(c.y + c.h);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const px = ((x % N) + N) % N, py = ((y % N) + N) % N, i = py * N + px;
        let d;
        if (c.round) { const cx = c.x + c.w / 2, cy = c.y + c.h / 2, rx = c.w / 2, ry = c.h / 2; const q = Math.hypot((x - cx) / rx, (y - cy) / ry); if (q > 1) continue; d = (1 - q) * Math.min(rx, ry); }
        else d = Math.min(x - c.x, c.x + c.w - x, y - c.y, c.y + c.h - y);
        if (d <= 0) continue;
        const prof = c.round ? Math.sqrt(clamp(d / (Math.min(c.w, c.h) * 0.5), 0, 1)) : smoothstep(0, bev, d);
        const n = noise(px, py, opts.ns || 0.045), n2 = noise(px + 91, py + 37, 0.2);
        const h = prof * (0.7 + 0.3 * n) + (opts.grain ? Math.sin((opts.grainAxis ? py : px) * opts.grain + n * 9) * 0.04 : 0);
        H[i] = Math.max(H[i], h);
        const sh = (0.86 + 0.28 * n) * (0.92 + 0.12 * n2) * (opts.grain ? 0.9 + 0.12 * Math.sin((opts.grainAxis ? py : px) * opts.grain * 0.5 + n * 14) : 1);
        A[i * 3] = cr * sh; A[i * 3 + 1] = cg * sh; A[i * 3 + 2] = cb * sh;
        R[i] = clamp((opts.rough ?? 0.8) + (n2 - 0.5) * 0.25 - (1 - prof) * 0.05, 0.05, 1);
      }
    }
    // cracks and grime
    if (opts.grime) for (let i = 0; i < N * N; i++) { const x = i % N, y = (i / N) | 0, g = noise(x + 13, y + 7, 0.012); const k = 1 - opts.grime * smoothstep(0.55, 0.85, g); A[i * 3] *= k; A[i * 3 + 1] *= k; A[i * 3 + 2] *= k; }
    const mk = (fill, srgb) => { const t = canvasTex(N, N, (g) => { const id = g.createImageData(N, N); fill(id.data); g.putImageData(id, 0, 0); }, srgb, true); t.anisotropy = 8; return t; };
    const lin2s = v => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255;
    const map = mk(d => { for (let i = 0; i < N * N; i++) { d[i * 4] = lin2s(A[i * 3]); d[i * 4 + 1] = lin2s(A[i * 3 + 1]); d[i * 4 + 2] = lin2s(A[i * 3 + 2]); d[i * 4 + 3] = 255; } }, true);
    const st = opts.strength || 3;
    const normalMap = mk(d => {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const h = (xx, yy) => H[((yy + N) % N) * N + ((xx + N) % N)];
        const dx = (h(x + 1, y) - h(x - 1, y)) * st, dy = (h(x, y - 1) - h(x, y + 1)) * st;
        const l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
        d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (-dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
      }
    }, false);
    const roughnessMap = mk(d => { for (let i = 0; i < N * N; i++) { const v = R[i] * 255; d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } }, false);
    return (this.cache[key] = { map, normalMap, roughnessMap });
  },
  // running-bond blocks (ashlar walls, bricks)
  blocks(rows, cols, jitter = 0.08, mortar = 3) {
    return (r, N) => { const out = [], h = N / rows, w = N / cols; for (let j = 0; j < rows; j++) { const off = (j % 2) * w * 0.5 + (r() - 0.5) * w * jitter; for (let i = -1; i < cols + 1; i++) { const ww = w * (0.8 + r() * 0.4); out.push({ x: i * w + off + mortar / 2, y: j * h + mortar / 2, w: ww - mortar, h: h - mortar, hue: (r() - 0.5) * 0.08 }); } } return out; };
  },
  flags() { return (r, N) => { const out = []; const rows = 4; let y = 0; for (let j = 0; j < rows; j++) { const h = N / rows; let x = r() * 40; while (x < N + 60) { const w = 70 + r() * 110; out.push({ x, y: y + 3, w: w - 6, h: h - 6, tone: 0.75 + r() * 0.35, hue: (r() - 0.5) * 0.1, bevel: 6 }); x += w; } y += h; } return out; }; },
  planks(n) { return (r, N) => { const out = [], h = N / n; for (let j = 0; j < n; j++) { let x = -r() * 200; while (x < N) { const w = 160 + r() * 260; out.push({ x, y: j * h + 1, w: w - 2, h: h - 2, tone: 0.75 + r() * 0.4, hue: (r() - 0.5) * 0.12, bevel: 2 }); x += w; } } return out; }; },
  cobbles() { return (r, N) => { const out = []; const s = 34; for (let y = 0; y < N; y += s * 0.86) for (let x = (Math.floor(y / s) % 2) * s * 0.5; x < N; x += s) out.push({ x: x + (r() - 0.5) * 6, y: y + (r() - 0.5) * 6, w: s * (0.85 + r() * 0.2), h: s * (0.75 + r() * 0.2), round: true, tone: 0.65 + r() * 0.45 }); return out; }; },
  tiles(n) { return (r, N) => { const out = [], s = N / n; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out.push({ x: i * s + 2, y: j * s + 2, w: s - 4, h: s - 4, tone: 0.9 + r() * 0.15, bevel: 3 }); return out; }; },
};
const SetTex = {
  stone: () => PBR.make('ashlar', { cells: PBR.blocks(8, 4, 0.2, 4), color: '#9c978e', gap: '#5a554e', rough: 0.86, strength: 3, grime: 0.4, bevel: 7 }),
  darkStone: () => PBR.make('dstone', { cells: PBR.blocks(10, 5, 0.25, 5), color: '#5a554f', gap: '#24211e', rough: 0.9, strength: 5, grime: 0.5, bevel: 4, seed: 11 }),
  flags: () => PBR.make('flags', { cells: PBR.flags(), color: '#7a7268', gap: '#2a2622', rough: 0.72, strength: 3, grime: 0.3, seed: 5 }),
  oak: () => PBR.make('oak', { cells: PBR.planks(6), color: '#6a4426', gap: '#1a0f08', rough: 0.55, strength: 1.5, grain: 0.35, ns: 0.02, seed: 3 }),
  darkWood: () => PBR.make('dwood', { cells: PBR.planks(8), color: '#3a2214', gap: '#0d0804', rough: 0.42, strength: 1.2, grain: 0.4, ns: 0.02, seed: 9 }),
  cobble: () => PBR.make('cobble', { cells: PBR.cobbles(), color: '#6c6660', gap: '#2a2826', rough: 0.8, strength: 6, grime: 0.25, seed: 13 }),
  tile: () => PBR.make('tile', { cells: PBR.tiles(8), color: '#c9c3b6', gap: '#4a4640', rough: 0.3, strength: 2, seed: 17 }),
  plaster: () => PBR.make('plaster', { cells: () => [{ x: 0, y: 0, w: 512, h: 512, bevel: 0.0001 }], color: '#b8a58a', gap: '#b8a58a', rough: 0.92, strength: 1, ns: 0.03, grime: 0.25, seed: 19 }),
};
// a material with tiled PBR maps; repeat set per-mesh via uv scale
function pbrMat(T, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ map: T.map, normalMap: T.normalMap, roughnessMap: T.roughnessMap, roughness: 1, metalness: 0, color: opts.color || 0xffffff, normalScale: new THREE.Vector2(opts.ns || 1, opts.ns || 1), side: opts.side || THREE.FrontSide });
  return patchMaterial(m, { key: 'pbr' });
}
// box with world-scaled UVs so textures tile at a constant density
function tBox(w, h, d, s = 0.5) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, n = g.attributes.normal, p = g.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const x = p.getX(i) + w / 2, y = p.getY(i) + h / 2, z = p.getZ(i) + d / 2;
    if (ay > 0.5) uv.setXY(i, x * s, z * s); else if (ax > 0.5) uv.setXY(i, z * s, y * s); else uv.setXY(i, x * s, y * s);
  }
  return g;
}
function tPlane(w, h, s = 0.5) { const g = new THREE.PlaneGeometry(w, h); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * s, uv.getY(i) * h * s); return g; }
const mesh = (g, m, x = 0, y = 0, z = 0, ry = 0, cast = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = cast; o.receiveShadow = true; return o; };

// ---------- shared props ----------
const Props = {
  mats: null,
  init() {
    if (this.mats) return;
    const M = this.mats = {};
    M.gold = stdMat({ color: 0xd9a845, metalness: 1, roughness: 0.25 }, { key: 'gold' });
    M.brass = stdMat({ color: 0xb08038, metalness: 1, roughness: 0.38 }, { key: 'brass' });
    M.iron = stdMat({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.5 }, { key: 'iron' });
    M.wax = stdMat({ color: 0xf2e8d2, roughness: 0.6, emissive: 0x3a2a10, emissiveIntensity: 0.4 }, { key: 'wax' });
    M.cloth = c => stdMat({ color: c, roughness: 0.9, side: THREE.DoubleSide }, { key: 'cloth' });
    M.glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.35, envMapIntensity: 1.5 });
    M.flame = new THREE.SpriteMaterial({ map: Models.glowTex, color: new THREE.Color(3.2, 1.9, 0.7), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  },
  // instanced floating candles with flicker + bob, plus additive flame sprites (as instanced quads)
  candles(n, area, y0, y1, seed = 1) {
    const r = mulberry32(seed), g = new THREE.Group();
    const cg = new THREE.CylinderGeometry(0.045, 0.05, 0.42, 10); cg.translate(0, 0.21, 0);
    const im = new THREE.InstancedMesh(cg, this.mats.wax, n);
    const fq = new THREE.InstancedBufferGeometry(); fq.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); fq.setIndex([0, 1, 2, 0, 2, 3]);
    const off = new Float32Array(n * 4), m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const x = lerp(area[0], area[1], r()), z = lerp(area[2], area[3], r()), y = lerp(y0, y1, r()), s = 0.8 + r() * 0.5;
      m.compose(_v1.set(x, y, z), _q1.identity(), _v2.set(s, s, s)); im.setMatrixAt(i, m);
      off[i * 4] = x; off[i * 4 + 1] = y + 0.45 * s; off[i * 4 + 2] = z; off[i * 4 + 3] = r() * 100;
    }
    im.castShadow = false; im.receiveShadow = false;
    // bob the candle bodies too (vertex shader on wax material is shared, so bob only the flames and use tiny sway)
    fq.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); fq.instanceCount = n;
    const fm = new THREE.ShaderMaterial({
      uniforms: { uTime: SHARED.uTime, uMap: { value: Models.glowTex } },
      vertexShader: /* glsl */`attribute vec4 aOff; uniform float uTime; varying vec2 vUv; varying float vF;
        void main() { vUv = position.xy * 0.5 + 0.5; float f = 0.8 + 0.2 * sin(uTime * 13.0 + aOff.w) * sin(uTime * 7.3 + aOff.w * 2.0); vF = f;
          vec4 mv = modelViewMatrix * vec4(aOff.xyz, 1.0); mv.xy += position.xy * vec2(0.035, 0.065) * f; mv.y += 0.02; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform sampler2D uMap; varying vec2 vUv; varying float vF;
        void main() { vec4 t = texture2D(uMap, vUv); gl_FragColor = vec4(vec3(3.6, 2.0, 0.75) * t.a * vF, t.a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const flames = new THREE.Mesh(fq, fm); flames.frustumCulled = false;
    // big soft halos (one per ~8 candles) for the glowing-air look
    const hq = fq.clone(); hq.instanceCount = Math.floor(n / 6);
    const hm = fm.clone(); hm.uniforms = { uTime: SHARED.uTime, uMap: { value: Models.glowTex } };
    hm.vertexShader = fm.vertexShader.replace('vec2(0.06, 0.11)', 'vec2(0.75, 0.75)'); hm.fragmentShader = fm.fragmentShader.replace('vec3(3.6, 2.0, 0.75) * t.a * vF', 'vec3(0.5, 0.28, 0.1) * t.a * t.a * vF');
    const halos = new THREE.Mesh(hq, hm); halos.frustumCulled = false;
    g.add(im, flames, halos);
    return g;
  },
  // animated fire (fireplace, torches, cauldron burners)
  fire(w, h, intensity = 1) {
    const g = new THREE.Group();
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: SHARED.uTime, uNoise: SHARED.uNoise, uI: { value: intensity } },
      vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform float uTime; uniform sampler2D uNoise; uniform float uI; varying vec2 vUv;
        void main() { vec2 p = vUv; float n = texture2D(uNoise, vec2(p.x * 1.3, p.y * 0.9 - uTime * 0.9)).r * 0.6 + texture2D(uNoise, vec2(p.x * 2.7 + 0.3, p.y * 1.8 - uTime * 1.7)).g * 0.4;
          float shape = (1.0 - abs(p.x - 0.5) * 2.0) * (1.0 - p.y);
          float f = smoothstep(0.25, 0.75, shape * 1.25 + n * 0.55 - p.y * 0.35);
          vec3 c = mix(vec3(1.6, 0.25, 0.02), vec3(4.0, 2.4, 0.6), smoothstep(0.4, 1.0, f));
          gl_FragColor = vec4(c * f * uI, f); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.y = h * 0.42; q.frustumCulled = false;
    g.add(q);
    const light = new THREE.PointLight(0xff9a48, 6 * intensity, 9, 1.6); light.position.y = h * 0.5; g.add(light);
    g.userData = { light, base: 6 * intensity };
    return g;
  },
  flicker(fires, t) { for (const f of fires) { const u = f.userData; u.light.intensity = u.base * (0.82 + 0.1 * Math.sin(t * 11 + u.base) + 0.08 * Math.sin(t * 23.7)); } },
  table(len, w = 0.95, hgt = 0.76, mat) {
    const g = new THREE.Group(), M = mat || pbrMat(SetTex.oak());
    g.add(mesh(tBox(w, 0.07, len, 0.6), M, 0, hgt - 0.035, 0));
    for (let z = -len / 2 + 0.6; z <= len / 2 - 0.5; z += Math.max(1.8, (len - 1.2) / Math.ceil((len - 1.2) / 3))) g.add(mesh(tBox(w * 0.7, hgt - 0.07, 0.12, 0.6), M, 0, (hgt - 0.07) / 2, z));
    return g;
  },
  // tall carved wooden chair with a red cushion (high table); the headmistress's is taller and gilded
  throne(head) {
    const g = new THREE.Group(), W = pbrMat(SetTex.darkWood()), R = stdMat({ color: 0x6a1414, roughness: 0.8 }, { key: 'uph' });
    const hb = head === true ? 2.2 : 1.6;
    g.add(mesh(tBox(0.62, 0.08, 0.58, 1), W, 0, 0.48, 0)); g.add(mesh(new THREE.BoxGeometry(0.54, 0.07, 0.5), R, 0, 0.55, 0.02));
    g.add(mesh(tBox(0.62, hb - 0.5, 0.07, 1), W, 0, 0.5 + (hb - 0.5) / 2, -0.27));
    const arch = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.07, 16, 1, false, -Math.PI / 2, Math.PI), W, 0, hb, -0.27); arch.rotation.x = Math.PI / 2; g.add(arch);
    for (const sx of [-0.28, 0.28]) { g.add(mesh(tBox(0.06, 0.5, 0.06, 1), W, sx, 0.24, 0.24)); g.add(mesh(tBox(0.06, hb, 0.06, 1), W, sx, hb / 2, -0.27)); g.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), head === true ? this.mats.gold : W, sx, hb + 0.04, -0.27)); }
    if (head === true) g.add(mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), this.mats.gold, 0, hb - 0.32, -0.23, 0, false));
    return g;
  },
  bench(len, mat) { const g = new THREE.Group(), M = mat || pbrMat(SetTex.oak()); g.add(mesh(tBox(0.36, 0.06, len, 0.6), M, 0, 0.44, 0)); for (let z = -len / 2 + 0.4; z <= len / 2 - 0.3; z += 2.6) g.add(mesh(tBox(0.3, 0.41, 0.08, 0.6), M, 0, 0.205, z)); return g; },
  chair(col, mat) {
    const g = new THREE.Group(), W = mat || pbrMat(SetTex.darkWood()), U = stdMat({ color: col, roughness: 0.85 }, { key: 'uph' });
    g.add(mesh(new THREE.BoxGeometry(0.85, 0.42, 0.8), U, 0, 0.32, 0));
    g.add(mesh(new THREE.BoxGeometry(0.85, 0.8, 0.18), U, 0, 0.82, -0.36));
    for (const sx of [-0.4, 0.4]) g.add(mesh(new THREE.BoxGeometry(0.16, 0.5, 0.78), U, sx, 0.6, 0));
    const cush = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8, 0, TAU, 0, Math.PI / 2), U); cush.scale.set(1, 0.18, 0.95); cush.position.y = 0.53; g.add(cush);
    for (const sx of [-0.36, 0.36]) for (const sz of [-0.32, 0.32]) g.add(mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.12, 6), W, sx, 0.06, sz));
    return g;
  },
  // pointed gothic window: glass panel with leading, stone surround
  windowArch(w, h, glassMat, frameMat) {
    const g = new THREE.Group(), s = new THREE.Shape(), r = w / 2;
    s.moveTo(-r, 0); s.lineTo(-r, h - r * 1.2); s.quadraticCurveTo(-r, h, 0, h + r * 0.15); s.quadraticCurveTo(r, h, r, h - r * 1.2); s.lineTo(r, 0); s.closePath();
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(s, 10), glassMat); g.add(glass);
    const fr = new THREE.Shape(); fr.moveTo(-r - 0.25, -0.2); fr.lineTo(-r - 0.25, h - r * 1.2); fr.quadraticCurveTo(-r - 0.25, h + 0.35, 0, h + r * 0.15 + 0.4); fr.quadraticCurveTo(r + 0.25, h + 0.35, r + 0.25, h - r * 1.2); fr.lineTo(r + 0.25, -0.2); fr.closePath(); fr.holes.push(s);
    const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.35, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 10 }), frameMat); fm.position.z = -0.02; fm.castShadow = true; g.add(fm);
    // mullions
    for (const x of [-r / 3, r / 3]) g.add(mesh(new THREE.BoxGeometry(0.08, h - r * 0.4, 0.12), frameMat, x, (h - r * 0.4) / 2, 0.02, 0, false));
    return g;
  },
  // stained/leaded glass texture (emissive)
  glassTex(tint, night) {
    const key = 'glass' + (night ? 'N' : 'D'); if (this[key]) return this[key];
    return (this[key] = canvasTex(256, 512, (g, w, h) => {
      const r = mulberry32(night ? 41 : 43);
      // background field: a vertical wash, cooler at the top
      const gr = g.createLinearGradient(0, 0, 0, h);
      if (night) { gr.addColorStop(0, '#0a1430'); gr.addColorStop(0.6, '#142650'); gr.addColorStop(1, '#203a68'); }
      else { gr.addColorStop(0, '#5a84c8'); gr.addColorStop(0.5, '#c8b070'); gr.addColorStop(1, '#a0503a'); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // large quarry panes with subtle per-pane tone
      const pw = 42, ph = 56;
      for (let y = 0; y < h + ph; y += ph) for (let x = (Math.floor(y / ph) % 2) * pw / 2 - pw; x < w + pw; x += pw) {
        const l = (r() - 0.5) * (night ? 10 : 18), hue = night ? 220 + r() * 25 : r() < 0.15 ? 0 + r() * 20 : r() < 0.3 ? 120 + r() * 30 : 40 + r() * 15;
        g.fillStyle = `hsla(${hue},${night ? 50 : 55}%,${(night ? 22 : 52) + l}%,${night ? 0.55 : 0.42})`;
        g.beginPath(); g.moveTo(x + pw / 2, y - ph / 2); g.lineTo(x + pw, y); g.lineTo(x + pw / 2, y + ph / 2); g.lineTo(x, y); g.closePath(); g.fill();
      }
      // a central medallion (a crest in the glass)
      g.fillStyle = night ? 'rgba(90,120,200,.35)' : 'rgba(255,220,140,.55)'; g.beginPath(); g.arc(w / 2, h * 0.32, 52, 0, TAU); g.fill();
      g.strokeStyle = night ? 'rgba(150,180,255,.5)' : 'rgba(255,240,200,.8)'; g.lineWidth = 4; g.stroke();
      // lead cames
      g.strokeStyle = 'rgba(12,10,8,.92)'; g.lineWidth = 3;
      for (let k = -h; k < w + h; k += pw) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h * pw / ph / 2 * 2, h); g.stroke(); g.beginPath(); g.moveTo(k, 0); g.lineTo(k - h * pw / ph / 2 * 2, h); g.stroke(); }
      g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h * 0.32, 52, 0, TAU); g.stroke();
      for (const y of [h * 0.62, h * 0.86]) { g.fillStyle = 'rgba(12,10,8,.92)'; g.fillRect(0, y, w, 6); }
      if (tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
    }, true, false));
  },
  banner(team, w, h) {
    const t = canvasTex(256, 768, g => drawBannerAtlas(g, [team, team, team, team], Tex.font)); t.repeat.set(0.25, 1);
    const m = stdMat({ map: t, roughness: 0.85, side: THREE.DoubleSide }, { key: 'drape', vHead: 'attribute float aWave;', vDisp: 'transformed.z += sin(uTime * 1.3 + position.y * 0.6 + position.x) * 0.12 * aWave;' });
    const geo = new THREE.PlaneGeometry(w, h, 4, 12), p = geo.attributes.position, a = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) a[i] = clamp((h / 2 - p.getY(i)) / h, 0, 1);
    geo.setAttribute('aWave', new THREE.BufferAttribute(a, 1));
    const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; return o;
  },
  firTree(h) {
    const g = new THREE.Group(), M = stdMat({ color: 0x1a3a22, roughness: 0.9 }, { key: 'fir' }), Sn = stdMat({ color: 0xf0f4f8, roughness: 0.7 }, { key: 'snow' });
    for (let i = 0; i < 6; i++) { const t = i / 6, r = lerp(h * 0.32, h * 0.06, t), y = h * (0.15 + t * 0.75); const c = mesh(new THREE.ConeGeometry(r, h * 0.28, 12), M, 0, y, 0); g.add(c); const s = mesh(new THREE.ConeGeometry(r * 0.75, h * 0.08, 12), Sn, 0, y + h * 0.1, 0, 0, false); g.add(s); }
    g.add(mesh(new THREE.CylinderGeometry(h * 0.04, h * 0.05, h * 0.15, 8), stdMat({ color: 0x3a2414 }, { key: 'bark' }), 0, h * 0.07, 0));
    // baubles + fairy lights
    const r = mulberry32(h * 100), n = 40, im = new THREE.InstancedMesh(new THREE.SphereGeometry(h * 0.018, 8, 6), stdMat({ color: 0xffffff, roughness: 0.2, metalness: 0.6, emissive: 0xffffff, emissiveIntensity: 1.6 }, { key: 'bauble' }), n);
    const cc = [0xffd060, 0xff3030, 0x40a0ff, 0xffffff, 0x60ff90], m = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < n; i++) { const t = r() * 0.85, a = r() * TAU, rr = lerp(h * 0.3, h * 0.05, t) * 0.95; m.makeTranslation(Math.cos(a) * rr, h * (0.12 + t * 0.8), Math.sin(a) * rr); im.setMatrixAt(i, m); im.setColorAt(i, col.set(cc[i % cc.length])); }
    g.add(im);
    const star = mesh(new THREE.OctahedronGeometry(h * 0.05), stdMat({ color: 0xffd060, emissive: 0xffc040, emissiveIntensity: 3, metalness: 1, roughness: 0.2 }, { key: 'star' }), 0, h * 1.0, 0, 0, false); g.add(star);
    return g;
  },
  // instanced feast dishes on gold platters
  feastKit() {
    const M = this.mats, food = stdMat({ color: 0xffffff, roughness: 0.5, vertexColors: true }, { key: 'food' });
    const lathe = (pts, n = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n);
    const tint = (g, c) => Geo.prep(g, typeof c === 'function' ? c : new THREE.Color(c), null);
    const roast = () => { const b = new THREE.SphereGeometry(0.13, 16, 12); b.scale(1.25, 0.72, 0.9); b.translate(0, 0.07, 0); const l1 = new THREE.CapsuleGeometry(0.03, 0.09, 3, 8); l1.rotateZ(1.1); l1.translate(0.15, 0.1, 0.05); const l2 = l1.clone(); l2.translate(0, 0, -0.1); return Geo.merge([tint(b, (x, y) => linCol(0.36, 0.16, 0.05).multiplyScalar(0.7 + y * 3)), tint(l1, linCol(0.42, 0.2, 0.07)), tint(l2, linCol(0.42, 0.2, 0.07))]); };
    const pie = () => { const c = lathe([[0, 0], [0.15, 0], [0.16, 0.06], [0.14, 0.08], [0, 0.085]], 20); return Geo.merge([tint(c, (x, y, z) => linCol(0.62, 0.38, 0.14).multiplyScalar(0.8 + 0.3 * Math.sin(Math.atan2(z, x) * 12) * (y > 0.06 ? 1 : 0.2)))]); };
    const bread = () => { const g = new THREE.CapsuleGeometry(0.06, 0.18, 4, 10); g.rotateZ(Math.PI / 2); g.scale(1, 0.75, 1); g.translate(0, 0.05, 0); return Geo.merge([tint(g, (x, y) => linCol(0.58, 0.34, 0.12).multiplyScalar(0.75 + y * 4))]); };
    const fruit = () => { const bowl = lathe([[0, 0], [0.06, 0], [0.15, 0.05], [0.16, 0.07]], 18); const P = [tint(bowl, linCol(0.62, 0.45, 0.18))]; const cs = [linCol(0.6, 0.05, 0.03), linCol(0.25, 0.5, 0.06), linCol(0.8, 0.4, 0.04), linCol(0.45, 0.06, 0.25)]; for (let i = 0; i < 6; i++) { const f = new THREE.SphereGeometry(0.045, 10, 8); f.translate(Math.cos(i) * 0.07, 0.08 + (i % 2) * 0.03, Math.sin(i) * 0.07); P.push(tint(f, cs[i % 4])); } return Geo.merge(P); };
    const pitcher = () => Geo.merge([tint(lathe([[0, 0], [0.06, 0], [0.075, 0.05], [0.055, 0.17], [0.065, 0.22]], 16), linCol(0.7, 0.5, 0.16))]);
    const pudding = () => { const d = lathe([[0, 0], [0.12, 0], [0.11, 0.06], [0.08, 0.11], [0, 0.13]], 18); return Geo.merge([tint(d, (x, y) => y > 0.1 ? linCol(0.8, 0.75, 0.6) : linCol(0.28, 0.12, 0.05))]); };
    const kinds = { roast: roast(), pie: pie(), bread: bread(), fruit: fruit(), pitcher: pitcher(), pudding: pudding() };
    const platter = lathe([[0, 0], [0.2, 0], [0.24, 0.02], [0.25, 0.03]], 24);
    const lists = {}; for (const k in kinds) lists[k] = [];
    const plat = [];
    return {
      place(k, x, y, z, ry) { lists[k].push([x, y + 0.025, z, ry]); if (k !== 'pitcher') plat.push([x, y, z]); },
      finish() {
        const g = new THREE.Group(), m = new THREE.Matrix4();
        for (const k in kinds) { const L = lists[k]; if (!L.length) continue; const im = new THREE.InstancedMesh(kinds[k], k === 'pitcher' ? M.gold : food, L.length); L.forEach(([x, y, z, ry], i) => { m.makeRotationY(ry).setPosition(x, y, z); im.setMatrixAt(i, m); }); im.castShadow = true; g.add(im); }
        const pm = new THREE.InstancedMesh(platter, M.gold, plat.length); plat.forEach(([x, y, z], i) => { m.makeTranslation(x, y, z); pm.setMatrixAt(i, m); }); g.add(pm);
        return g;
      },
    };
  },
  // the Sorting Hat: patched, slumped leather with a brim and a creased "mouth"
  sortingHat() {
    const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push(new THREE.Vector2(lerp(0.17, 0.012, Math.pow(t, 0.8)) * (1 + 0.06 * Math.sin(t * 18)), t * 0.62)); }
    const g = new THREE.LatheGeometry(pts, 22), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), z = p.getZ(i), bend = Math.pow(y / 0.62, 2.2) * 0.22; p.setX(i, x + bend + Math.sin(y * 23 + z * 9) * 0.008); p.setY(i, y - Math.pow(y / 0.62, 3) * 0.12); p.setZ(i, z + Math.sin(y * 17 + x * 11) * 0.008); }
    g.computeVertexNormals();
    const leather = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#4a3420'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '20,12,6' : '110,80,50'},${Math.random() * 0.14})`; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 0, TAU); c.fill(); } c.strokeStyle = 'rgba(10,6,2,.6)'; c.lineWidth = 2; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h); c.stroke(); } c.fillStyle = 'rgba(8,4,2,.9)'; c.beginPath(); c.ellipse(128, 70, 60, 7, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(96, 40, 14, 5, 0, 0, TAU); c.ellipse(160, 40, 14, 5, 0, 0, TAU); c.fill(); }, true, true);
    const M = stdMat({ map: leather, roughness: 0.85, side: THREE.DoubleSide }, { key: 'hat' });
    const hat = new THREE.Group(); hat.add(new THREE.Mesh(g, M));
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 24), M); brim.rotation.x = Math.PI / 2; brim.scale.set(1.15, 1.05, 0.35); hat.add(brim);
    hat.traverse(o => { o.castShadow = true; });
    return hat;
  },
  stool() { const g = new THREE.Group(), W = pbrMat(SetTex.oak()); g.add(mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.05, 16), W, 0, 0.47, 0)); for (let k = 0; k < 3; k++) { const a = k * 2.094, lg = mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.48, 6), W, Math.cos(a) * 0.15, 0.23, Math.sin(a) * 0.15); lg.rotation.z = Math.cos(a) * 0.12; lg.rotation.x = -Math.sin(a) * 0.12; g.add(lg); } return g; },
  pumpkin(s) {
    const face = this._pf || (this._pf = canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff';
      const f = cx => { g.beginPath(); g.moveTo(cx - 26, 48); g.lineTo(cx - 13, 30); g.lineTo(cx - 3, 48); g.fill(); g.beginPath(); g.moveTo(cx + 3, 48); g.lineTo(cx + 13, 30); g.lineTo(cx + 26, 48); g.fill(); g.beginPath(); g.moveTo(cx - 30, 68); for (let i = 0; i <= 8; i++) g.lineTo(cx - 30 + i * 7.5, 68 + (i % 2 ? 12 : 20)); g.lineTo(cx + 30, 68); g.quadraticCurveTo(cx, 102, cx - 30, 68); g.fill(); };
      f(64);
    }, false));
    const skin = this._ps || (this._ps = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#e07a1a'; g.fillRect(0, 0, w, h); for (let k = 0; k < 10; k++) { const gr = g.createLinearGradient(k * 25.6, 0, k * 25.6 + 25.6, 0); gr.addColorStop(0, 'rgba(90,30,0,.35)'); gr.addColorStop(0.5, 'rgba(255,170,60,.12)'); gr.addColorStop(1, 'rgba(90,30,0,.35)'); g.fillStyle = gr; g.fillRect(k * 25.6, 0, 25.6, h); } }));
    const m = stdMat({ map: skin, emissiveMap: face, emissive: new THREE.Color(3.2, 1.6, 0.4), emissiveIntensity: 1, roughness: 0.55 }, { key: 'pumpkin' });
    const g = new THREE.SphereGeometry(s, 24, 16); g.scale(1, 0.82, 1);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 - 0.07 * Math.pow(Math.abs(Math.sin(a * 5)), 0.5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    g.computeVertexNormals();
    const o = new THREE.Mesh(g, m); o.castShadow = false;
    const stem = mesh(new THREE.CylinderGeometry(s * 0.07, s * 0.11, s * 0.32, 6), stdMat({ color: 0x3a4a1a, roughness: 0.8 }, { key: 'stem' }), 0, s * 0.86, 0, 0, false); stem.rotation.z = 0.2; o.add(stem);
    const glow = new THREE.PointLight(0xff8a30, 0.6, 4, 2); o.add(glow);
    return o;
  },
  // falling snow inside a volume
  snow(n, box, size = 0.05, speed = 0.8) {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), r = mulberry32(77);
    for (let i = 0; i < n; i++) { p[i * 3] = lerp(box[0], box[1], r()); p[i * 3 + 1] = lerp(box[2], box[3], r()); p[i * 3 + 2] = lerp(box[4], box[5], r()); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: SHARED.uTime, uBox: { value: new THREE.Vector4(box[2], box[3] - box[2], speed, size) }, uMap: { value: Models.glowTex } },
      vertexShader: /* glsl */`uniform float uTime; uniform vec4 uBox; varying float vA;
        void main() { vec3 q = position; float ph = fract(q.x * 13.1 + q.z * 7.7);
          q.y = uBox.x + mod(q.y - uBox.x - uTime * uBox.z * (0.7 + ph * 0.6), uBox.y);
          q.x += sin(uTime * 0.7 + ph * 20.0) * 0.4; q.z += cos(uTime * 0.6 + ph * 17.0) * 0.4;
          vec4 mv = modelViewMatrix * vec4(q, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uBox.w * 900.0 / -mv.z; vA = smoothstep(60.0, 5.0, -mv.z); }`,
      fragmentShader: /* glsl */`uniform sampler2D uMap; varying float vA; void main() { float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vec3(1.2) * a * vA, a * vA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const o = new THREE.Points(g, m); o.frustumCulled = false; return o;
  },
  // drifting dust in light beams
  motes(n, box) { const o = this.snow(n, box, 0.012, 0.05); o.material.fragmentShader = o.material.fragmentShader.replace('vec3(1.2)', 'vec3(1.4, 1.1, 0.7) * 0.5'); return o; },
  // a parchment sign with text
  sign(text, w, h, bg = '#2a1a10', fg = '#e8c070', font = Tex.font) {
    const t = canvasTex(512, Math.round(512 * h / w), (g, W, H) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
      g.fillStyle = fg; g.font = `700 ${Math.round(H * 0.38)}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 4);
    });
    return mesh(new THREE.PlaneGeometry(w, h), stdMat({ map: t, roughness: 0.6, side: THREE.DoubleSide }, { key: 'sign' }), 0, 0, 0, 0, false);
  },
};

// ---------- environment maps per set ----------
function setEnvMap(top, mid, bottom, blobs = []) {
  const pm = new THREE.PMREMGenerator(Render.renderer), sc = new THREE.Scene();
  const g = new THREE.SphereGeometry(10, 32, 16), c = new Float32Array(g.attributes.position.count * 3), p = g.attributes.position;
  const T = new THREE.Color(top), Mi = new THREE.Color(mid), B = new THREE.Color(bottom), col = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 10; col.copy(y > 0 ? Mi.clone().lerp(T, y) : Mi.clone().lerp(B, -y)); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  sc.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  for (const b of blobs) { const m = new THREE.Mesh(new THREE.SphereGeometry(b.r, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(b.c).multiplyScalar(b.i || 4) })); m.position.set(...b.p); sc.add(m); }
  const rt = pm.fromScene(sc, 0, 0.1, 50); pm.dispose(); return rt.texture;
}

// a barrel vault spanning x in [-w/2, w/2], rising by `rise` above y0, running the length d along z; faces inward
function vaultGeo(w, rise, d, y0, segs = 28) {
  const P = [], N = [], UV = [], I = [];
  for (let i = 0; i <= segs; i++) {
    const a = i / segs * Math.PI, x = Math.cos(a) * w / 2, y = y0 + Math.sin(a) * rise;
    const nx = -Math.cos(a) / (w / 2), ny = -Math.sin(a) / rise, nl = Math.hypot(nx, ny);
    for (const z of [-d / 2, d / 2]) { P.push(x, y, z); N.push(nx / nl, ny / nl, 0); UV.push(i / segs * (w + rise) * 0.35, (z + d / 2) * 0.35); }
  }
  for (let i = 0; i < segs; i++) { const a = i * 2, b = a + 1, c = a + 2, e = a + 3; I.push(a, c, b, b, c, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); return g;
}
// anchors for sitting: the sit clip seats the pelvis about 0.33 m behind the root
const seatAt = (x, z, rot, back = 0.33, y = 0) => [x + Math.sin(rot) * back, y, z + Math.cos(rot) * back, rot];
// ===================== SET BUILDERS =====================
const HALL_X = { 0: -7.2, 3: -2.4, 2: 2.4, 1: 7.2 };
const SetBuilders = {
  // ---------------- THE GREAT HALL ----------------
  hall(variant) {
    Props.init();
    const scene = new THREE.Scene(), L = 60, W = 22, WH = 15;
    const stone = pbrMat(SetTex.stone()), floor = pbrMat(SetTex.flags(), { ns: 1.2 }), oak = pbrMat(SetTex.oak());
    const yule = variant === 'yule' || variant === 'gala', exams = variant === 'exams', xmas = variant === 'christmas', hallo = variant === 'halloween';
    // the Sorting is a feast with a stool and a hat
    const sorting = variant === 'sorting';
    // floor and walls
    const fl = mesh(tPlane(W, L, 0.28), floor, 0, 0, 0, 0, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
    if (yule) { fl.material = pbrMat(SetTex.flags(), { ns: 0.6, color: 0xdde8f4 }); fl.material.roughness = 0.35; }
    for (const sx of [-1, 1]) {
      // wall with window bays: piers + sill + spandrel; tall gothic windows between
      const nb = 6, bay = L / nb;
      for (let i = 0; i < nb; i++) {
        const zc = -L / 2 + bay * (i + 0.5);
        scene.add(mesh(tBox(1.2, WH, bay - 4.2, 0.55), stone, sx * (W / 2 + 0.6), WH / 2, zc - bay / 2 + (bay - 4.2) / 2 - 0.0 + 0.0));
        scene.add(mesh(tBox(1.2, 3.2, 4.2, 0.35), stone, sx * (W / 2 + 0.6), 1.6, zc + (bay - 4.2) / 2 - bay / 2 + (bay - 4.2) / 2 + 2.1 - (bay - 4.2) / 2));
        scene.add(mesh(tBox(1.2, 2.2, 4.2, 0.35), stone, sx * (W / 2 + 0.6), WH - 1.1, zc + (bay - 4.2) / 2 - bay / 2 + (bay - 4.2) / 2 + 2.1 - (bay - 4.2) / 2));
        const win = Props.windowArch(2.6, 7.4, new THREE.MeshBasicMaterial({ map: this._hallGlass || (this._hallGlass = Props.glassTex(null, !exams)), color: exams ? new THREE.Color(2.2, 2.0, 1.7) : new THREE.Color(0.9, 1.0, 1.4), toneMapped: false }), stone);
        win.position.set(sx * (W / 2 + 0.5), 3.4, zc + (bay - 4.2) / 2 - bay / 2 + (bay - 4.2) / 2 + 2.1 - (bay - 4.2) / 2); win.rotation.y = -sx * Math.PI / 2; scene.add(win);
        // pier half-column and capital
        const pz = zc - bay / 2;
        const col = mesh(new THREE.CylinderGeometry(0.42, 0.5, WH - 0.4, 14), stone, sx * (W / 2 - 0.05), (WH - 0.4) / 2, pz); scene.add(col);
        scene.add(mesh(new THREE.CylinderGeometry(0.62, 0.42, 0.6, 14), stone, sx * (W / 2 - 0.05), WH - 0.3, pz));
        // iron torch brackets with flames between bays
        if (i % 2 === 0 && !exams) { const f = Props.fire(0.35, 0.6, 0.6); f.position.set(sx * (W / 2 - 0.55), 4.6, pz); scene.add(f); (scene.userData.fires ||= []).push(f); scene.add(mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.3, 8), Props.mats.iron, sx * (W / 2 - 0.55), 4.45, pz, 0, false)); }
      }
      // cornice and oak wainscot
      scene.add(mesh(tBox(1.6, 0.5, L, 0.35), stone, sx * (W / 2 - 0.1), WH + 0.25, 0));
      const wain = pbrMat(SetTex.darkWood());
      scene.add(mesh(tBox(0.12, 2.6, L - 0.6, 0.8), wain, sx * (W / 2 - 0.02), 1.3, 0));
      scene.add(mesh(tBox(0.2, 0.12, L - 0.6, 0.8), wain, sx * (W / 2 - 0.05), 2.62, 0));
      for (let z = -L / 2 + 1.5; z < L / 2 - 1; z += 1.5) scene.add(mesh(tBox(0.04, 2.2, 0.08, 0.8), wain, sx * (W / 2 - 0.09), 1.3, z, 0, false));
    }
    // end walls: high-table end with a great window, door end with arch
    scene.add(mesh(tBox(W + 2.4, WH + 0.5, 1.2, 0.35), stone, 0, (WH + 0.5) / 2, -L / 2 - 0.6));
    scene.add(mesh(tBox(W + 2.4, WH + 0.5, 1.2, 0.35), stone, 0, (WH + 0.5) / 2, L / 2 + 0.6));
    const great = Props.windowArch(7, 9, new THREE.MeshBasicMaterial({ map: Props.glassTex(null, false), color: exams ? new THREE.Color(2.4, 2.1, 1.7) : new THREE.Color(1.1, 0.9, 1.3), toneMapped: false }), stone);
    great.position.set(0, 4.2, -L / 2 + 0.02); scene.add(great);
    const doorM = pbrMat(SetTex.darkWood());
    for (const sx of [-1, 1]) scene.add(mesh(tBox(2.1, 5.6, 0.2, 0.6), doorM, sx * 1.07, 2.8, L / 2 - 0.05));
    // dais and high table
    scene.add(mesh(tBox(W, 0.6, 6, 0.3), floor, 0, 0.3, -L / 2 + 3));
    const ht = Props.table(14, 1.1, 0.8, oak); ht.rotation.y = Math.PI / 2; ht.position.set(0, 0.6, -L / 2 + 3.4); scene.add(ht);
    const hc = Props.throne(i => i === 0); for (let i = -3; i <= 3; i++) { const c = (i === 0 ? Props.throne(true) : hc).clone(); c.position.set(i * 1.8, 0.6, -L / 2 + 2.2); scene.add(c); }
    // the golden owl lectern
    const lec = new THREE.Group();
    lec.add(mesh(new THREE.LatheGeometry([0.32, 0.3, 0.12, 0.1, 0.11, 0.16].map((r, i) => new THREE.Vector2(r, [0, 0.08, 0.2, 0.9, 1.05, 1.12][i])), 18), Props.mats.gold, 0, 0, 0));
    const body = mesh(new THREE.SphereGeometry(0.2, 18, 14), Props.mats.gold, 0, 1.36, 0); body.scale.set(1, 1.3, 0.85); lec.add(body);
    const head = mesh(new THREE.SphereGeometry(0.14, 16, 12), Props.mats.gold, 0, 1.68, 0.02); head.scale.set(1.15, 1, 0.9); lec.add(head);
    for (const sx of [-1, 1]) { const tuft = mesh(new THREE.ConeGeometry(0.035, 0.12, 6), Props.mats.gold, sx * 0.09, 1.8, 0); tuft.rotation.z = -sx * 0.3; lec.add(tuft); const eye = mesh(new THREE.SphereGeometry(0.028, 10, 8), stdMat({ color: 0x1a0f05, roughness: 0.2 }, { key: 'owlEye' }), sx * 0.055, 1.7, 0.13, 0, false); lec.add(eye); }
    const wingS = new THREE.Shape(); wingS.moveTo(0, 0); wingS.bezierCurveTo(0.25, 0.22, 0.55, 0.42, 0.8, 0.5); wingS.bezierCurveTo(0.62, 0.32, 0.6, 0.18, 0.66, 0.06); wingS.bezierCurveTo(0.5, 0.1, 0.42, -0.02, 0.48, -0.14); wingS.bezierCurveTo(0.3, -0.06, 0.2, -0.16, 0.1, -0.22); wingS.closePath();
    const wingG = new THREE.ExtrudeGeometry(wingS, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 12 });
    for (const sx of [-1, 1]) { const wg = mesh(wingG, Props.mats.gold, sx * 0.12, 1.36, -0.02); wg.scale.set(sx, 1, 1); wg.rotation.y = sx * 0.35; lec.add(wg); }
    lec.add(mesh(new THREE.BoxGeometry(0.56, 0.03, 0.4), Props.mats.gold, 0, 1.13, 0.1)); lec.children[lec.children.length - 1].rotation.x = 0.35;
    lec.position.set(0, 0.6, -L / 2 + 5.4); scene.add(lec);
    // house tables + benches + table settings
    const anchors = {};
    if (!yule && !exams) {
      const plates = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.11, 0.015, 16), Props.mats.gold, 4 * 2 * 60);
      const gob = new THREE.InstancedMesh(new THREE.LatheGeometry([new THREE.Vector2(0.05, 0), new THREE.Vector2(0.05, 0.01), new THREE.Vector2(0.012, 0.03), new THREE.Vector2(0.012, 0.09), new THREE.Vector2(0.045, 0.12), new THREE.Vector2(0.05, 0.18)], 10), Props.mats.gold, 4 * 2 * 60);
      const FD = Props.feastKit(), food = { add: (k, x, y, z, ry) => FD.place(k, x, y, z, ry) };
      const m4 = new THREE.Matrix4(), fc = [0x8a4a1a, 0xc08a3a, 0x6a8a2a, 0xa02a1a, 0xd8b060, 0x5a2a12], col = new THREE.Color(); let pi = 0, fi = 0;
      for (const h of [0, 3, 2, 1]) {
        const x = HALL_X[h];
        const t = Props.table(42, 0.95, 0.76, oak); t.position.set(x, 0, 2); scene.add(t);
        for (const s of [-1, 1]) { const b = Props.bench(42, oak); b.position.set(x + s * 0.78, 0, 2); scene.add(b); }
        for (let k = 0; k < 60; k++) for (const s of [-1, 1]) {
          const z = -18.5 + k * 0.68; m4.makeTranslation(x + s * 0.32, 0.77, z); plates.setMatrixAt(pi, m4); m4.makeTranslation(x + s * 0.3, 0.77, z + 0.25); gob.setMatrixAt(pi, m4); pi++;
        }
        if (variant !== 'leaving') for (let k = 0; k < 26; k++) { const kinds = ['roast', 'pie', 'bread', 'fruit', 'pitcher', 'pudding']; food.add(kinds[(k + h) % kinds.length], x + (k % 2 ? 0.1 : -0.1), 0.77, -18 + k * 1.55, k * 1.3); }
        // banners above each table
        const bn = Props.banner(variant === 'leaving' && Career.S && Career.S.cupWinner != null ? Career.S.cupWinner : h, 2.6, 7.8); bn.position.set(x, 9.6, -12); scene.add(bn);
        const bn2 = Props.banner(variant === 'leaving' && Career.S && Career.S.cupWinner != null ? Career.S.cupWinner : h, 2.6, 7.8); bn2.position.set(x, 9.6, 14); scene.add(bn2);
      }
      plates.count = pi; gob.count = pi; plates.castShadow = false; gob.castShadow = false; scene.add(plates, gob, FD.finish());
    }
    if (exams) {
      const desk = new THREE.Group(); desk.add(mesh(tBox(0.8, 0.05, 0.55, 0.8), oak, 0, 0.74, 0)); for (const sx of [-0.35, 0.35]) desk.add(mesh(tBox(0.05, 0.72, 0.5, 0.8), oak, sx, 0.36, 0));
      const parch = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 }); desk.add(mesh(new THREE.PlaneGeometry(0.3, 0.4).rotateX(-Math.PI / 2), parch, 0, 0.77, 0, 0, false));
      for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) { const d = desk.clone(); d.position.set(-8.4 + c * 2.4, 0, -16 + r * 3); scene.add(d); }
      const stl = Props.stool(); for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) { const st = stl.clone(); st.position.set(-8.4 + c * 2.4, 0, -16 + r * 3 + 0.55); scene.add(st); }
      anchors.examMe = seatAt(-3.6, -7 + 0.55, Math.PI); anchors.examF = seatAt(-1.2, -10 + 0.55, Math.PI);
    }
    // round tables for balls and galas
    if (yule) {
      const cloth = stdMat({ color: variant === 'gala' ? 0xf2ece0 : 0xe8f0ff, roughness: 0.8 }, { key: 'tcloth' });
      for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const t = new THREE.Group(); t.add(mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.76, 24, 1, false), cloth, 0, 0.38, 0)); const cdl = Props.candles(3, [-0.2, 0.2, -0.2, 0.2], 0.78, 0.8, k + 9); t.add(cdl); t.position.set(sx * 7.6, 0, -18 + k * 8); scene.add(t); }
      if (variant === 'yule') {
        const ice = new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.08, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.55, envMapIntensity: 2.5, emissive: 0x16304a, emissiveIntensity: 0.6 });
        for (const [x, z, s] of [[-4.5, -20, 1.6], [4.5, -20, 1.6], [-8, 10, 1.3], [8, 10, 1.3], [0, 22, 2]]) { const g = new THREE.Group(); g.add(mesh(new THREE.IcosahedronGeometry(s * 0.6, 0), ice, 0, s * 1.6, 0)); g.add(mesh(new THREE.ConeGeometry(s * 0.4, s * 1.4, 6), ice, 0, s * 0.7, 0)); g.add(mesh(new THREE.OctahedronGeometry(s * 0.35, 0), ice, s * 0.3, s * 2.3, 0)); g.position.set(x, 0, z); scene.add(g); }
        // frost garlands swagged along the walls, glittering snow and silver light
        const frost = stdMat({ color: 0xffffff, emissive: 0x9ad0ff, emissiveIntensity: 1.6, roughness: 0.3 }, { key: 'frost' });
        for (const sx of [-1, 1]) for (let k = 0; k < 8; k++) { const sw = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.07, 5, 18, Math.PI), frost); sw.position.set(sx * 10.8, 10.4, -26 + k * 7.4); sw.rotation.set(Math.PI, sx * Math.PI / 2, 0); scene.add(sw); }
        scene.add(Props.snow(1200, [-10, 10, 0.3, 14, -28, 28], 0.035, 0.25));
        for (const z of [-14, 0, 14]) { const pl = new THREE.PointLight(0xc8e0ff, 30, 22, 1.6); pl.position.set(0, 6, z); scene.add(pl); }
      } else {
        // chandeliers
        for (const z of [-15, 0, 15]) { const ch = new THREE.Group(); ch.add(mesh(new THREE.TorusGeometry(1.6, 0.06, 6, 32), Props.mats.brass, 0, 0, 0, 0, false)); ch.children[0].rotation.x = Math.PI / 2; ch.add(Props.candles(16, [-1.5, 1.5, -1.5, 1.5], 0.05, 0.08, z + 3)); ch.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 6, 4), Props.mats.iron, 0, 3, 0, 0, false)); ch.position.set(0, 8.5, z); scene.add(ch); }
      }
      anchors.danceMe = [0, 0, 0.3, Math.PI]; anchors.danceP = [0, 0, -0.55, 0];
      anchors.dance1 = [-2.6, 0, 2.6, 0.8]; anchors.dance2 = [-2.1, 0, 3.3, -2.3]; anchors.dance3 = [2.8, 0, -2.2, 2.2]; anchors.dance4 = [3.4, 0, -1.6, -0.9];
    }
    // floating candles (lots), Halloween pumpkins and bats, Christmas trees and snow
    const candles = Props.candles(exams ? 0 : yule ? 120 : 420, [-9.5, 9.5, -27, 27], 8, 12.5, 3); scene.add(candles);
    const pumpkins = [], bats = [];
    if (hallo) {
      for (let i = 0; i < 34; i++) { const p = Props.pumpkin(0.38 + Math.random() * 0.25); p.position.set(rnd(-9, 9), rnd(6, 10), rnd(-26, 26)); p.rotation.y = rnd(0, TAU); p.userData.ph = Math.random() * 10; scene.add(p); pumpkins.push(p); }
      const bg = new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.35, 0.12); s.lineTo(0.28, -0.02); s.lineTo(0.4, -0.08); s.lineTo(0.08, -0.04); s.lineTo(0, -0.1); s.lineTo(-0.08, -0.04); s.lineTo(-0.4, -0.08); s.lineTo(-0.28, -0.02); s.lineTo(-0.35, 0.12); s.closePath(); return s; })());
      const bm = new THREE.MeshBasicMaterial({ color: 0x050405, side: THREE.DoubleSide });
      for (let i = 0; i < 46; i++) { const b = new THREE.Mesh(bg, bm); b.userData = { r: rnd(3, 9), y: rnd(9, 14), a: rnd(0, TAU), w: rnd(0.4, 0.9) * (Math.random() < 0.5 ? 1 : -1), z: rnd(-20, 20) }; scene.add(b); bats.push(b); }
    }
    if (xmas) {
      for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) { const t = Props.firTree(5.5 + (k % 2) * 1.2); t.position.set(sx * 9.6, 0, -22 + k * 9); scene.add(t); }
      scene.add(Props.snow(1600, [-10, 10, 0.2, 15, -28, 28], 0.04, 0.6));
    }
    // enchanted ceiling: the night (or day) sky, seen through the open roof
    const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16, 0, TAU, 0, Math.PI / 2), makeSkyMaterial()); sky.position.y = WH; sky.renderOrder = -1; scene.add(sky);
    // trusses fading into the enchanted sky, for scale
    const trussM = stdMat({ color: 0x24170e, roughness: 0.8 }, { key: 'truss' });
    // the enchanted ceiling is open sky: only short corbels at the wall head
    for (let i = -4; i <= 4; i++) for (const sx of [-1, 1]) { const br = mesh(tBox(1.6, 0.5, 0.5, 0.6), trussM, sx * (W / 2 - 0.6), WH - 0.2, i * 6.6, 0, false); br.rotation.z = sx * 0.35; scene.add(br); }
    // lights: warm ambient bounce from the candles, a cool moon key through the windows, warm fills
    scene.add(new THREE.HemisphereLight(exams ? 0xd8e0f0 : yule ? 0x9ab4e0 : 0x6a7088, 0x3a2414, exams ? 1.4 : 0.9));
    const key = new THREE.DirectionalLight(exams ? 0xfff0dc : yule ? 0xbcd8ff : 0xffc890, exams ? 3.2 : 1.6);
    key.position.set(-14, 26, 12); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 32; sc.bottom = -32; sc.near = 2; sc.far = 80; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
    scene.add(key, key.target);
    const warm = hallo ? 0xff8030 : yule ? 0x9ac8ff : 0xffb060;
    for (const z of [-20, -6, 8, 22]) { const pl = new THREE.PointLight(warm, yule ? 50 : 70, 30, 1.6); pl.position.set(0, 10, z); scene.add(pl); }
    const env = exams
      ? { fog: 0x8a8070, fogDen: 0.006, exposure: 1.0, bloom: 0.9, sky: { uZenith: [0.25, 0.42, 0.75], uHorizon: [0.7, 0.75, 0.8], uStars: 0, uCloudCover: 0.45, uSunCol: [1, 0.9, 0.75], uCloudLit: [1.3, 1.25, 1.15], uCloudDark: [0.55, 0.58, 0.65] }, sun: [0.3, 0.8, 0.4] }
      : { fog: hallo ? 0x1a0e06 : yule ? 0x0a1220 : 0x140e08, fogDen: 0.012, exposure: yule ? 1.05 : 1.15, bloom: 1.25, tint: yule ? 0xe4ecff : 0xffffff, sky: { uZenith: [0.004, 0.008, 0.03], uHorizon: [0.03, 0.04, 0.09], uStars: 1.4, uCloudCover: xmas ? 0.6 : 0.3, uSunCol: [0.3, 0.35, 0.5], uCloudLit: [0.08, 0.1, 0.16], uCloudDark: [0.01, 0.015, 0.03], uGroundCol: [0.01, 0.01, 0.02] }, sun: [-0.3, 0.6, 0.5] };
    scene.environment = setEnvMap(exams ? 0x9ab0d0 : yule ? 0x284060 : 0x4a3a2a, exams ? 0x8a8070 : 0x4a3420, 0x1a1008, exams ? [] : [{ p: [0, 7, 0], r: 2.2, c: yule ? 0x88b8ff : 0xffb060, i: 5 }, { p: [-8, 4, 3], r: 1, c: 0x8aa8ff, i: 2 }]);
    // the school at dinner: seated students around the camera's usual focus
    const extras = [];
    const crowdSeats = [];
    if (!yule && !exams) for (const h of [0, 3, 2, 1]) { const x = HALL_X[h]; for (let k = 0; k < (h === (Career.S ? Career.S.profile.house : 0) ? 7 : 3); k++) for (const sd of [-1, 1]) { const z = (h === (Career.S ? Career.S.profile.house : 0) ? -1 : 1) + k * 1.6 + (sd > 0 ? 0.7 : 0) + (Math.abs(x - HALL_X[Career.S ? Career.S.profile.house : 0]) > 1 ? 3 : 0); if (Math.abs(z - 4.2) < 1.2 && x === HALL_X[Career.S ? Career.S.profile.house : 0]) continue; crowdSeats.push({ a: seatAt(x + sd * 0.78, z, -sd * Math.PI / 2), house: h }); } }
    // anchors: seats at your house table, the stool, the high table
    const hx = HALL_X[Career.S ? Career.S.profile.house : 0];
    Object.assign(anchors, {
      seatMe: seatAt(hx - 0.78, 4.2, Math.PI / 2), seatF: seatAt(hx + 0.78, 4.9, -Math.PI / 2),
      stool: seatAt(0, -L / 2 + 7.8, 0), high: [0, 0.6, -L / 2 + 2.4, 0], firstYears: [-1.6, 0, -L / 2 + 10.5, Math.PI],
    });
    // stool for the Sorting
    let hatObj = null;
    if (variant === 'sorting') { const st = Props.stool(); st.position.set(0, 0, -L / 2 + 7.8); scene.add(st); hatObj = Props.sortingHat(); scene.add(hatObj); }
    const cams = {
      default: { p: [0, 5.5, 27], l: [0, 3.5, -10], fov: 50 },
      hallWide: { p: [0, 7.5, 28.5], l: [0, 4.5, -14], p2: [0, 5.8, 18], l2: [0, 3.2, -18], fov: 52, dur: 9 },
      hallDoor: { p: [0.4, 1.7, 29], l: [0, 6, 0], p2: [0.2, 2.2, 22], fov: 58, dur: 7 },
      stool: { p: [2.2, 1.65, -L / 2 + 11.4], l: [0, 1.45, -L / 2 + 7.8], p2: [1.6, 1.6, -L / 2 + 10.6], fov: 34, dur: 8 },
      houseTable: { p: [hx + 3.4, 1.9, 9.8], l: [hx, 0.9, 4.2], p2: [hx + 2.6, 1.6, 8], fov: 42, dur: 8 },
      tableClose: { p: [hx - 0.15, 1.28, 6.9], l: [hx + 0.1, 1.05, 4.2], p2: [hx + 0.2, 1.25, 6.4], fov: 38, dur: 9 },
      pumpkins: { p: [hx + 2, 1.4, 8], l: [hx, 8, -4], p2: [hx + 1, 1.6, 6], fov: 55, dur: 8 },
      trees: { p: [6, 1.8, 6], l: [9.6, 4, -4], p2: [5, 2.2, 2], fov: 48, dur: 8 },
      yuleWide: { p: [0, 6.5, 24], l: [0, 1.5, 0], p2: [3, 4.5, 16], fov: 46, dur: 10 },
      danceOrbit: { orbit: { c: [0, 1.2, 0], r: 3.4, h: 0.5, a0: 0.4, w: 0.12 }, p: [0, 2, 4], l: [0, 1.2, 0], fov: 40, dur: 20 },
      examWide: { p: [0, 6, 14], l: [0, 1, -12], p2: [-2, 4, 8], fov: 48, dur: 10 },
    };
    const fires = scene.userData.fires || [];
    return {
      scene, anchors, cams, env,
      onEnter() {
        let n = 0;
        for (const c of crowdSeats) { if (n++ > 22) break; const look = Humans.look(n * 977 + c.house * 31); const h = new Human(Object.assign({}, look, Outfits.of('school', c.house, 'x' + n, {}))); h.root.position.set(c.a[0], 0, c.a[2]); h.root.rotation.y = c.a[3]; h.play(Math.random() < 0.4 ? 'sitTalk' : 'sit'); scene.add(h.root); extras.push(h); }
      },
      onLeave() { for (const h of extras) h.dispose(); extras.length = 0; },
      update(dt, t) {
        Props.flicker(fires, t);
        for (const h of extras) h.update(dt);
        if (hatObj) { const me = Scenes.cast.me; if (me) { me.h.bones.Head.getWorldPosition(_v1); hatObj.position.set(_v1.x - 0.02, _v1.y + 0.1, _v1.z - 0.01); hatObj.rotation.set(0, Math.PI * 0.5 + Math.sin(t * 2.2) * 0.08, Math.sin(t * 3.1) * 0.05); } }
        for (const p of pumpkins) { p.position.y += Math.sin(t * 0.8 + p.userData.ph) * 0.002; p.rotation.y += dt * 0.1; }
        for (const b of bats) { const u = b.userData; u.a += dt * u.w; b.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 3 + u.r) * 0.4, u.z + Math.sin(u.a) * u.r); b.rotation.set(0, -u.a, 0); b.scale.y = 0.6 + Math.abs(Math.sin(t * 18 + u.r * 7)) * 0.8; }
      },
      fx(name) { if (name === 'cheer') Sound.crowdRoar(0.5, 2); },
    };
  },
  // ---------------- COMMON ROOM / STUDY / CLUB OFFICE ----------------
  common(variant) {
    Props.init();
    const scene = new THREE.Scene(), office = variant === 'office';
    const team = Career.S ? (office ? (Career.S.club ?? Career.myTeam()) : Career.S.profile.house) : 0, T = CONFIG.teams[team];
    const wallM = office ? pbrMat(SetTex.darkWood()) : pbrMat(SetTex.stone(), { color: 0xd8c8b0 });
    const R = 7, H = 6.2, sides = 8;
    const floor = mesh(new THREE.CircleGeometry(R + 0.6, sides), pbrMat(SetTex.oak()), 0, 0, 0, Math.PI / sides, false); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    // the circle geometry uses unit uvs: tile the floor planks
    { const uv = floor.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 6); }
    for (let i = 0; i < sides; i++) {
      const a = (i + 0.5) / sides * TAU, w = 2 * R * Math.tan(Math.PI / sides) + 0.1;
      const wall = mesh(tBox(w, H, 0.5, 0.4), wallM, Math.sin(a) * (R + 0.25), H / 2, Math.cos(a) * (R + 0.25), a);
      scene.add(wall);
    }
    const ceil = mesh(new THREE.CircleGeometry(R + 0.6, sides), stdMat({ color: 0x2a1c12, roughness: 0.9 }, { key: 'ceil' }), 0, H, 0, 0, false); ceil.rotation.x = Math.PI / 2; scene.add(ceil);
    // fireplace on the north wall (z = -R)
    const fpStone = pbrMat(SetTex.darkStone());
    scene.add(mesh(tBox(3.4, 2.6, 0.9, 0.5), fpStone, 0, 1.3, -R + 0.2));
    scene.add(mesh(tBox(3.9, 0.3, 1.2, 0.5), fpStone, 0, 2.7, -R + 0.3));
    const hole = mesh(new THREE.BoxGeometry(1.9, 1.5, 0.6), new THREE.MeshBasicMaterial({ color: 0x050302 }), 0, 0.75, -R + 0.5, 0, false); scene.add(hole);
    const fire = Props.fire(1.4, 1.0, 1.4); fire.position.set(0, 0.08, -R + 0.9); scene.add(fire);
    fire.userData.light.distance = 14; fire.userData.light.intensity = fire.userData.base = 14;
    const embers = Props.snow(80, [-0.7, 0.7, 0.1, 2.4, -R + 0.6, -R + 1.1], 0.02, -0.4); embers.material.fragmentShader = embers.material.fragmentShader.replace('vec3(1.2)', 'vec3(3.0, 1.2, 0.3)'); scene.add(embers);
    // tapestries in house colours, crest above the mantel
    for (const a of [Math.PI * 0.62, -Math.PI * 0.62, Math.PI * 0.85, -Math.PI * 0.85]) { const b = Props.banner(team, 1.6, 3.8); b.position.set(Math.sin(a) * (R - 0.05), 3.6, Math.cos(a) * (R - 0.05)); b.rotation.y = a + Math.PI; scene.add(b); }
    const crest = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.45), new THREE.MeshStandardMaterial({ map: Kits.emblem(team), transparent: true, roughness: 0.5, metalness: 0.3 })); crest.position.set(0, 3.7, -R + 0.72); scene.add(crest);
    // armchairs, sofa, rug, table
    const U = office ? 0x4a2a1a : new THREE.Color(T.c1).multiplyScalar(0.8).getHex();
    const c1 = Props.chair(U), c2 = Props.chair(U);
    c1.position.set(-1.35, 0, -3.3); c1.rotation.y = Math.PI / 2 - 0.5; c2.position.set(1.35, 0, -3.3); c2.rotation.y = -Math.PI / 2 + 0.5; scene.add(c1, c2);
    const rug = mesh(new THREE.CircleGeometry(2.2, 32), stdMat({ map: canvasTex(256, 256, (g) => { g.fillStyle = T.c1; g.fillRect(0, 0, 256, 256); g.strokeStyle = T.c2; g.lineWidth = 10; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(128, 128, 40 + k * 26, 0, TAU); g.stroke(); } }), roughness: 0.95 }, { key: 'rug' }), 0, 0.012, -2.6, 0, false); rug.rotation.x = -Math.PI / 2; scene.add(rug);
    const tbl = Props.table(1.2, 0.7, 0.5); tbl.position.set(0, 0, -2.2); scene.add(tbl);
    // books and candles on the table, bookshelves on two walls
    const bookM = stdMat({ color: 0xffffff, roughness: 0.7 }, { key: 'book' });
    const books = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.26, 0.19), bookM, 260); const m4 = new THREE.Matrix4(), bc = new THREE.Color(); let bi = 0;
    const shelfM = pbrMat(SetTex.darkWood());
    for (const a of [Math.PI * 0.32, -Math.PI * 0.32]) {
      const sg = new THREE.Group();
      sg.add(mesh(tBox(2.6, 3.2, 0.42, 0.6), shelfM, 0, 1.6, 0));
      for (let s = 0; s < 5; s++) for (let k = 0; k < 24 && bi < 260; k++) { m4.compose(_v1.set(-1.15 + k * 0.095 + Math.random() * 0.01, 0.33 + s * 0.62, 0.24), _q1.setFromAxisAngle(_v3.set(0, 0, 1), (Math.random() - 0.5) * 0.12), _v2.set(1, 0.75 + Math.random() * 0.4, 1)); m4.premultiply(new THREE.Matrix4().makeRotationY(a + Math.PI).setPosition(Math.sin(a) * (R - 0.3), 0, Math.cos(a) * (R - 0.3))); books.setMatrixAt(bi, m4); books.setColorAt(bi, bc.setHSL(Math.random(), 0.45, 0.18 + Math.random() * 0.2)); bi++; }
      sg.position.set(Math.sin(a) * (R - 0.3), 0, Math.cos(a) * (R - 0.3)); sg.rotation.y = a + Math.PI; scene.add(sg);
    }
    books.count = bi; scene.add(books);
    if (variant === 'study') { const pm = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 }); for (let k = 0; k < 7; k++) { const p = mesh(new THREE.PlaneGeometry(0.22, 0.3).rotateX(-Math.PI / 2), pm, rnd(-0.5, 0.5), 0.52, -2.2 + rnd(-0.25, 0.25), rnd(0, TAU), false); scene.add(p); } }
    scene.add(Props.candles(6, [-0.3, 0.3, -2.35, -2.05], 0.51, 0.52, 21));
    // tall window with moonlight
    const win = Props.windowArch(1.6, 3.6, new THREE.MeshBasicMaterial({ map: Props.glassTex(null, true), color: new THREE.Color(0.7, 0.85, 1.4), toneMapped: false }), wallM);
    const wa = Math.PI * 0.5 + 0.4; win.position.set(Math.sin(wa) * (R - 0.02), 1.2, Math.cos(wa) * (R - 0.02)); win.rotation.y = wa + Math.PI; scene.add(win);
    const moon = new THREE.SpotLight(0x8aa8ff, 30, 20, 0.5, 0.6, 1.2); moon.position.set(Math.sin(wa) * (R + 2), 4.5, Math.cos(wa) * (R + 2)); moon.target.position.set(0, 0, -1.5); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); scene.add(moon, moon.target);
    const key = new THREE.PointLight(0xffb878, 9, 8, 1.6); key.position.set(0.2, 2.0, -0.6); scene.add(key);
    const rimL = new THREE.PointLight(0x8aa8ff, 4, 7, 1.8); rimL.position.set(-3, 2.5, -1); scene.add(rimL);
    fire.userData.light.castShadow = true; fire.userData.light.shadow.mapSize.set(1024, 1024); fire.userData.light.shadow.bias = -0.002;
    scene.add(new THREE.HemisphereLight(0x6a6080, 0x3a2414, 1.0));
    scene.environment = setEnvMap(0x2a2030, 0x2a1a10, 0x140a04, [{ p: [0, 1, -8], r: 1.2, c: 0xff9a40, i: 6 }]);
    const anchors = { chairL: seatAt(-1.35, -3.3, Math.PI / 2 - 0.5, 0.26), chairR: seatAt(1.35, -3.3, -Math.PI / 2 + 0.5, 0.26), standF: [0.9, 0, -1.6, -2.6], fire: [0, 0, -5.2, Math.PI] };
    const cams = {
      default: { p: [0.2, 1.6, 1.8], l: [0, 1.0, -4.5], fov: 50 },
      fire: { p: [-0.4, 1.35, 0.6], l: [0.1, 1.0, -4.0], p2: [0.4, 1.3, -0.1], fov: 42, dur: 12 },
      hub: { orbit: { c: [0, 1.1, -3.2], r: 3.8, h: 0.6, a0: 0.3, w: 0.04 }, p: [0, 1.6, 1], l: [0, 1, -3], fov: 46, dur: 999 },
    };
    return { scene, anchors, cams, env: { fog: 0x1a1008, fogDen: 0.014, exposure: 1.35, bloom: 1.15, sh: [0, 0.01, 0.03], hi: [0.04, 0.015, -0.01] }, update(dt, t) { Props.flicker([fire], t); } };
  },
  // ---------------- POTIONS DUNGEON / CHARMS CLASSROOM ----------------
  potions(variant) {
    Props.init();
    const scene = new THREE.Scene(), charms = variant === 'charms';
    const stone = pbrMat(charms ? SetTex.stone() : SetTex.darkStone()), floorM = pbrMat(charms ? SetTex.oak() : SetTex.flags());
    const W = 14, D = 12, H = 5.5;
    const fl = mesh(tPlane(W, D, 0.35), floorM, 0, 0, 0, 0, false); fl.rotation.x = -Math.PI / 2; scene.add(fl);
    for (const sx of [-1, 1]) scene.add(mesh(tBox(0.8, H, D, 0.4), stone, sx * (W / 2 + 0.4), H / 2, 0));
    scene.add(mesh(tBox(W + 1.6, H, 0.8, 0.4), stone, 0, H / 2, -D / 2 - 0.4)); scene.add(mesh(tBox(W + 1.6, H, 0.8, 0.4), stone, 0, H / 2, D / 2 + 0.4));
    // barrel-vaulted ceiling with ribs
    const vault = new THREE.Mesh(vaultGeo(W + 0.4, 2.6, D + 0.4, H), pbrMat(charms ? SetTex.stone() : SetTex.darkStone(), { side: THREE.DoubleSide })); vault.receiveShadow = true; scene.add(vault);
    for (let z = -D / 2 + 1; z < D / 2; z += 2.5) { const rib = new THREE.Mesh(new THREE.TorusGeometry(W / 2 + 0.1, 0.16, 6, 28, Math.PI), stone); rib.scale.set(1, 2.6 / (W / 2 + 0.1), 1); rib.position.set(0, H, z); scene.add(rib); }
    // desks with cauldrons
    const oak = pbrMat(SetTex.darkWood()), anchors = {}, vapours = [], fires = [];
    const caul = new THREE.LatheGeometry([new THREE.Vector2(0.05, 0), new THREE.Vector2(0.22, 0.03), new THREE.Vector2(0.3, 0.14), new THREE.Vector2(0.31, 0.26), new THREE.Vector2(0.26, 0.36), new THREE.Vector2(0.28, 0.38), new THREE.Vector2(0.26, 0.39)], 18);
    const brew = (col) => new THREE.ShaderMaterial({ uniforms: { uTime: SHARED.uTime, uNoise: SHARED.uNoise, uC: { value: new THREE.Color(col).multiplyScalar(1.8) } }, vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: /* glsl */`uniform float uTime; uniform sampler2D uNoise; uniform vec3 uC; varying vec2 vUv; void main() { float n = texture2D(uNoise, vUv * 1.5 + vec2(uTime * 0.05, uTime * 0.03)).r; float b = smoothstep(0.62, 0.7, texture2D(uNoise, vUv * 3.0 - uTime * 0.12).a); gl_FragColor = vec4(uC * (0.6 + n * 0.9) + b * 0.6, 1.0); }` });
    const cols = [0x6a2a8a, 0x2a8a3a, 0x8a5a1a, 0x2a5a8a, 0x8a1a3a];
    let k = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = -4.2 + c * 4.2, z = -1.2 + r * 3, g = new THREE.Group();
      g.add(mesh(tBox(2.6, 0.08, 1.0, 0.7), oak, 0, 0.88, 0)); for (const sx of [-1.2, 1.2]) g.add(mesh(tBox(0.1, 0.84, 0.9, 0.7), oak, sx, 0.42, 0));
      if (!charms) for (const sx of [-0.65, 0.65]) {
        g.add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 10), Props.mats.iron, sx, 0.98, 0));
        const cm = mesh(caul, Props.mats.iron, sx, 1.04, 0); g.add(cm);
        const liq = new THREE.Mesh(new THREE.CircleGeometry(0.27, 20), brew(cols[k++ % cols.length])); liq.rotation.x = -Math.PI / 2; liq.position.set(sx, 1.37, 0); g.add(liq);
        const f = Props.fire(0.28, 0.2, 0.35); f.position.set(sx, 0.92, 0); f.userData.light.intensity = 0; f.userData.base = 0.0; g.add(f);
        const vp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tex.puff, color: new THREE.Color(cols[(k + 4) % cols.length]).multiplyScalar(0.9), transparent: true, depthWrite: false, opacity: 0.18 })); vp.position.set(sx, 1.6, 0); vp.scale.set(0.5, 0.5, 1); g.add(vp); vapours.push(vp);
        const glow = new THREE.PointLight(cols[(k + 4) % cols.length], 1.6, 3, 2); glow.position.set(sx, 1.5, 0); if (k % 2) g.add(glow);
      }
      g.position.set(x, 0, z); scene.add(g);
      if (r === 1 && c === 0) { anchors.deskMe = [x - 0.65, 0, z + 0.7, Math.PI]; anchors.deskF = [x + 0.65, 0, z + 0.7, Math.PI]; }
      if (r === 1 && c === 2) anchors.deskR = [x - 0.65, 0, z + 0.7, Math.PI];
    }
    // shelves of jars
    const jar = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.08, 0.22, 10), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.75, emissive: 0x111111, emissiveIntensity: 0.5 }), 180); const m4 = new THREE.Matrix4(), jc = new THREE.Color(); let ji = 0;
    for (const sx of [-1, 1]) {
      scene.add(mesh(tBox(0.5, 3.2, 8, 0.6), oak, sx * (W / 2 - 0.25), 1.6, 0));
      for (let s = 0; s < 5; s++) for (let j = 0; j < 18 && ji < 180; j++) { m4.makeTranslation(sx * (W / 2 - 0.45), 0.42 + s * 0.62, -3.6 + j * 0.42 + Math.random() * 0.05); jar.setMatrixAt(ji, m4); jar.setColorAt(ji, jc.setHSL(Math.random(), 0.6, 0.35)); ji++; }
    }
    jar.count = ji; scene.add(jar);
    // teacher's desk + blackboard
    scene.add(mesh(tBox(3, 0.9, 1.1, 0.6), oak, 0, 0.45, -D / 2 + 2));
    const board = mesh(new THREE.PlaneGeometry(4.2, 1.8), stdMat({ map: canvasTex(512, 220, (g, w, h) => { g.fillStyle = '#16201a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(230,230,220,.75)'; g.lineWidth = 2; g.font = `28px ${Tex.font}`; g.fillStyle = 'rgba(230,230,220,.8)'; g.fillText(charms ? 'Accio: wrist flick, then pull' : 'Swelling Solution', 30, 50); g.font = '20px Georgia'; g.fillText(charms ? 'Wingardium Leviosa: swish and flick' : '2 dried nettles · 3 snake fangs', 30, 100); g.fillText(charms ? 'Lumos · Nox · Reparo' : 'Stir clockwise x3, then counter x1', 30, 140); g.beginPath(); g.arc(440, 120, 50, 0, TAU); g.stroke(); }), roughness: 0.9 }, { key: 'board' }), 0, 2.4, -D / 2 + 0.02, 0, false);
    scene.add(board);
    // torches / windows
    if (!charms) for (const [x, z] of [[-W / 2 + 0.5, -3], [W / 2 - 0.5, -3], [-W / 2 + 0.5, 3], [W / 2 - 0.5, 3]]) { const f = Props.fire(0.3, 0.55, 0.9); f.position.set(x, 2.8, z); f.userData.light.distance = 10; f.userData.light.intensity = f.userData.base = 9; scene.add(f); fires.push(f); }
    else { for (const sx of [-1, 1]) { const w = Props.windowArch(1.8, 3, new THREE.MeshBasicMaterial({ map: Props.glassTex(null, false), color: new THREE.Color(2.4, 2.2, 1.9), toneMapped: false }), stone); w.position.set(sx * (W / 2 - 0.01), 1.4, 0); w.rotation.y = -sx * Math.PI / 2; scene.add(w); } }
    // floating feathers for Charms
    const feathers = [];
    if (charms) { const fm = stdMat({ color: 0xf4f0e8, roughness: 0.6, side: THREE.DoubleSide }, { key: 'feather' }); for (let i = 0; i < 14; i++) { const f = mesh(new THREE.PlaneGeometry(0.05, 0.28), fm, rnd(-5, 5), rnd(1.5, 3), rnd(-2, 4), 0, false); f.userData.ph = Math.random() * 9; scene.add(f); feathers.push(f); } }
    scene.add(new THREE.HemisphereLight(charms ? 0xc8d4f0 : 0x6a7a68, 0x2a1e12, charms ? 1.5 : 1.0));
    if (!charms) { const warm = new THREE.PointLight(0xffb070, 18, 9, 1.6); warm.position.set(-3, 2.6, 2.2); scene.add(warm); const warm2 = new THREE.PointLight(0xffb070, 10, 9, 1.6); warm2.position.set(3, 2.6, 0); scene.add(warm2); }
    const key = charms ? new THREE.DirectionalLight(0xfff0d8, 3) : new THREE.SpotLight(0xe8ffe0, 34, 18, 0.8, 0.7, 1.2);
    key.position.set(charms ? -9 : 0, charms ? 7 : 5.2, charms ? 2 : 1); key.target.position.set(0, 0, 1); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); if (charms) { const c = key.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; } scene.add(key, key.target);
    scene.add(Props.motes(260, [-6, 6, 0.3, 5, -5, 5]));
    scene.environment = setEnvMap(charms ? 0xa0b0c8 : 0x203020, charms ? 0x7a6a5a : 0x1a1a14, 0x0a0806);
    anchors.prof = [0, 0, -D / 2 + 3.2, 0];
    const cams = {
      default: { p: [0, 2.4, 6], l: [0, 1.2, -3], fov: 50 },
      potionsWide: { p: [-5.5, 3.2, 5.5], l: [0, 1.2, -2], p2: [-3.5, 2.6, 4.5], fov: 50, dur: 10 },
      cauldron: { p: [anchors.deskMe[0] + 0.7, 1.75, anchors.deskMe[2] - 2.1], l: [anchors.deskMe[0] + 0.5, 1.3, anchors.deskMe[2]], p2: [anchors.deskMe[0] + 0.9, 1.7, anchors.deskMe[2] - 1.9], fov: 44, dur: 10 },
    };
    return { scene, anchors, cams, env: { fog: charms ? 0x6a6a70 : 0x101a12, fogDen: charms ? 0.01 : 0.014, exposure: charms ? 1.0 : 1.35, bloom: 1.2, tint: charms ? 0xffffff : 0xf4fff0, sh: [0, 0.015, 0.01], hi: [0.02, 0.03, -0.01] },
      update(dt, t) { Props.flicker(fires, t); for (const v of vapours) { v.position.y = 1.55 + ((t * 0.35 + v.id * 0.37) % 1) * 0.8; v.material.opacity = 0.35 * (1 - ((t * 0.35 + v.id * 0.37) % 1)); v.scale.setScalar(0.5 + ((t * 0.35 + v.id * 0.37) % 1) * 0.9); } for (const f of feathers) { f.position.y += Math.sin(t * 1.3 + f.userData.ph) * 0.003; f.rotation.y += dt * 0.4; f.rotation.z = Math.sin(t + f.userData.ph) * 0.4; } } };
  },
  // ---------------- HOGSMEADE ----------------
  hogsmeade(variant) {
    Props.init();
    const scene = new THREE.Scene(), heavy = variant === 'snow';
    const cob = pbrMat(SetTex.cobble(), { color: 0xd8dde4 });
    const street = mesh(tPlane(16, 90, 0.4), cob, 0, 0, 0, 0, false); street.rotation.x = -Math.PI / 2; scene.add(street);
    const snowM = stdMat({ color: 0xf2f5fa, roughness: 0.75 }, { key: 'snow' });
    const ground = mesh(new THREE.PlaneGeometry(300, 300), snowM, 0, -0.02, 0, 0, false); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    // snow drifts along the edges
    for (const sx of [-1, 1]) { const d = mesh(new THREE.CylinderGeometry(0.6, 0.9, 90, 8, 1), snowM, sx * 5.4, 0, 0, 0, false); d.rotation.x = Math.PI / 2; d.scale.set(1, 1, 0.35); scene.add(d); }
    const timber = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#c8b898'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(80,60,40,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h); g.fillRect(w / 2 - 7, 0, 14, h); g.save(); g.translate(w / 2, h / 2); g.rotate(0.78); g.fillRect(-180, -6, 360, 12); g.restore(); }, true, true);
    const houseM = stdMat({ map: timber, roughness: 0.85 }, { key: 'timber' }), stoneM = pbrMat(SetTex.stone(), { color: 0xc0b8b0 }), roofM = stdMat({ color: 0x3a3230, roughness: 0.8 }, { key: 'slate' });
    const winM = new THREE.MeshBasicMaterial({ map: canvasTex(64, 96, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, 60); gr.addColorStop(0, '#fff2c0'); gr.addColorStop(1, '#e08020'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a10'; g.fillRect(w / 2 - 2, 0, 4, h); g.fillRect(0, h / 2 - 2, w, 4); g.lineWidth = 6; g.strokeStyle = '#2a1a10'; g.strokeRect(0, 0, w, h); }), color: new THREE.Color(2.4, 1.9, 1.3), toneMapped: false });
    const smokes = [], lamps = [];
    const r = mulberry32(31);
    const names = ['THE THREE BROOMSTICKS', 'HONEYDUKES', 'ZONKO\'S', 'SCRIVENSHAFT\'S', 'DERVISH & BANGES', 'GLADRAGS', 'QUALITY QUIDDITCH', 'POST OFFICE'];
    let ni = 0;
    for (const sx of [-1, 1]) for (let z = -38; z < 38;) {
      const w = 5 + r() * 3.5, h = 5 + r() * 4, d = 6 + r() * 2, x = sx * (8 + d / 2 + r() * 0.6);
      const g = new THREE.Group();
      g.add(mesh(tBox(d, 1.2, w, 0.4), stoneM, 0, 0.6, 0));
      const body = mesh(new THREE.BoxGeometry(d, h - 1.2, w), houseM, 0, 1.2 + (h - 1.2) / 2, 0); g.add(body);
      // jettied upper floor and a steep snowy roof
      const rh = 2.6 + r() * 1.6;
      const roof = mesh(new THREE.ConeGeometry(Math.hypot(d, w) * 0.58, rh, 4), roofM, 0, h + rh / 2 - 0.1, 0, Math.PI / 4); roof.scale.set(d / Math.hypot(d, w) * 1.42, 1, w / Math.hypot(d, w) * 1.42); g.add(roof);
      const sn = mesh(new THREE.ConeGeometry(Math.hypot(d, w) * 0.6, rh * 0.5, 4), snowM, 0, h + rh * 0.78, 0, Math.PI / 4, false); sn.scale.copy(roof.scale); g.add(sn);
      // chimney + smoke
      const ch = mesh(tBox(0.7, 2.2, 0.7, 0.5), stoneM, d * 0.2, h + rh * 0.6, w * 0.25); g.add(ch);
      const sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: Tex.puff, color: 0x9a9aa4, transparent: true, depthWrite: false, opacity: 0.4 })); sm.position.set(d * 0.2, h + rh * 0.6 + 1.6, w * 0.25); sm.scale.set(2.5, 2.5, 1); g.add(sm); smokes.push(sm);
      // glowing windows facing the street
      const face = -sx * d / 2 - sx * 0.01;
      for (let k = 0; k < 2; k++) { const wm = mesh(new THREE.PlaneGeometry(0.9, 1.3), winM, face, 2.0 + k * 2.2, (k - 0.5) * w * 0.4, -sx * Math.PI / 2, false); if (h - 1.2 > 2.6 || k === 0) g.add(wm); }
      const shop = mesh(new THREE.PlaneGeometry(2.4, 1.6), winM, face, 1.3, -w * 0.18, -sx * Math.PI / 2, false); g.add(shop);
      const door = mesh(new THREE.PlaneGeometry(1.0, 2.0), pbrMat(SetTex.darkWood()), face, 1.0, w * 0.28, -sx * Math.PI / 2, false); g.add(door);
      if (ni < names.length && r() < 0.8) { const sg = Props.sign(names[ni++], 3.2, 0.7); sg.position.set(face - sx * 0.05, h - 0.6, 0); sg.rotation.y = -sx * Math.PI / 2; g.add(sg); }
      g.position.set(x, 0, z + w / 2); scene.add(g);
      z += w + 0.4 + r() * 1.2;
    }
    // lamp posts with lanterns
    for (const sx of [-1, 1]) for (let z = -34; z <= 34; z += 11) {
      const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), Props.mats.iron, 0, 1.7, 0));
      g.add(mesh(new THREE.BoxGeometry(0.34, 0.45, 0.34), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.1), toneMapped: false }), 0, 3.55, 0, 0, false));
      g.add(mesh(new THREE.ConeGeometry(0.3, 0.25, 4), Props.mats.iron, 0, 3.9, 0, Math.PI / 4, false));
      const pl = new THREE.PointLight(0xffb060, 9, 13, 1.7); pl.position.set(0, 3.5, 0); g.add(pl); lamps.push(pl);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: Models.glowTex, color: new THREE.Color(1.4, 0.9, 0.45), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); halo.position.y = 3.55; halo.scale.set(1.8, 1.8, 1); g.add(halo);
      g.position.set(sx * 6.3, 0, z + (sx > 0 ? 5 : 0)); scene.add(g);
    }
    // mountains and the dusk sky
    const mtn = stdMat({ color: 0x6a7890, roughness: 1 }, { key: 'mtn' });
    {
      const g = new THREE.PlaneGeometry(900, 260, 140, 40), p = g.attributes.position, c = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) + 130; const h = Math.max(0, ridged2(x * 0.006 + 3, 1.7, 5) * 170 * smoothstep(0, 1, y / 260) + fbm2(x * 0.02, y * 0.02, 3) * 25 - 40); p.setY(i, h); p.setZ(i, -y); const sn = smoothstep(70, 110, h + fbm2(x * 0.05, y * 0.05, 2) * 30); c[i * 3] = lerp(0.18, 0.92, sn); c[i * 3 + 1] = lerp(0.2, 0.94, sn); c[i * 3 + 2] = lerp(0.26, 0.98, sn); }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
      const mm = new THREE.Mesh(g, stdMat({ vertexColors: true, roughness: 0.95 }, { key: 'mtn' })); mm.position.set(0, -5, -120); scene.add(mm);
    }
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), makeSkyMaterial()); sky.renderOrder = -1; scene.add(sky);
    scene.add(Props.snow(heavy ? 3500 : 1600, [-14, 14, 0, 16, -40, 40], heavy ? 0.06 : 0.045, heavy ? 1.3 : 0.7));
    scene.add(new THREE.HemisphereLight(0x8090c0, 0x302820, 0.9));
    const moon = new THREE.DirectionalLight(0x9ab0ff, 1.2); moon.position.set(30, 40, -20); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); const c = moon.shadow.camera; c.left = -24; c.right = 24; c.top = 40; c.bottom = -40; c.far = 120; scene.add(moon, moon.target);
    scene.environment = setEnvMap(0x30406a, 0x403848, 0xc0c8d8);
    const anchors = { streetMe: [-0.6, 0, 6, Math.PI * 0.9], streetF: [0.6, 0, 5.4, -Math.PI * 0.85], streetR: [0.3, 0, 2.2, 0] };
    const cams = {
      default: { p: [0, 2.2, 14], l: [0, 2, 0], fov: 50 },
      streetWide: { p: [2.5, 4.6, 22], l: [0, 2.2, -10], p2: [1.2, 2.6, 14], fov: 52, dur: 10 },
      streetClose: { p: [1.6, 1.65, 9.4], l: [0, 1.5, 5.6], p2: [1.2, 1.6, 8.6], fov: 40, dur: 10 },
    };
    return { scene, anchors, cams, env: { fog: 0x4a5068, fogDen: 0.016, exposure: 1.1, bloom: 1.2, tint: 0xf0f2ff, sky: { uZenith: [0.03, 0.05, 0.14], uHorizon: [0.45, 0.32, 0.4], uSunCol: [1.0, 0.5, 0.35], uCloudCover: 0.75, uCloudLit: [0.6, 0.45, 0.5], uCloudDark: [0.12, 0.12, 0.2], uStars: 0.3, uGroundCol: [0.3, 0.3, 0.36] }, sun: [0.2, 0.06, -1], sh: [0, 0.01, 0.04] },
      update(dt, t) { for (const s of smokes) { const u = (t * 0.12 + s.id * 0.13) % 1; s.material.opacity = 0.4 * (1 - u); s.scale.setScalar(2 + u * 4); } } };
  },
  // ---------------- LOCKER ROOM (school / pro / national) + tunnel ----------------
  locker(variant) {
    Props.init();
    const scene = new THREE.Scene(), pro = variant !== 'school' && variant !== '';
    const team = Career.S ? (variant === 'nation' ? Career.S.nation : Career.myTeam()) : 0, T = CONFIG.teams[team] || CONFIG.teams[0];
    const W = 14, D = 9, H = 4.4;
    const floorM = pro ? pbrMat(SetTex.darkWood()) : pbrMat(SetTex.flags());
    const fl = mesh(tPlane(W, D, 0.35), floorM, 0, 0, 0, 0, false); fl.rotation.x = -Math.PI / 2; scene.add(fl);
    if (pro) { fl.material.roughness = 0.6; const em = mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshStandardMaterial({ map: Kits.emblem(team), transparent: true, roughness: 0.3, metalness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }), 0, 0.005, 0, 0, false); em.rotation.x = -Math.PI / 2; scene.add(em); }
    const wallM = pro ? pbrMat(SetTex.darkWood(), { color: 0xc8b8a8 }) : pbrMat(SetTex.stone());
    for (const sz of [-1, 1]) scene.add(mesh(tBox(W, H, 0.4, 0.4), wallM, 0, H / 2, sz * (D / 2 + 0.2)));
    scene.add(mesh(tBox(0.4, H, D, 0.4), wallM, -W / 2 - 0.2, H / 2, 0));
    // the door wall has an opening into the tunnel
    scene.add(mesh(tBox(0.4, H, D / 2 - 1.1, 0.4), wallM, W / 2 + 0.2, H / 2, -(D / 4 + 0.55))); scene.add(mesh(tBox(0.4, H, D / 2 - 1.1, 0.4), wallM, W / 2 + 0.2, H / 2, D / 4 + 0.55)); scene.add(mesh(tBox(0.4, H - 2.8, 2.2, 0.4), wallM, W / 2 + 0.2, 2.8 + (H - 2.8) / 2, 0));
    const ceil = mesh(new THREE.PlaneGeometry(W, D), stdMat({ color: pro ? 0x1a1410 : 0x2a2420, roughness: 0.9 }, { key: 'ceil' }), 0, H, 0, 0, false); ceil.rotation.x = Math.PI / 2; scene.add(ceil);
    // lockers with team robes hanging in them
    const lockM = pbrMat(pro ? SetTex.oak() : SetTex.darkWood()), robeM = stdMat({ map: Robes.tex, roughness: 0.85, side: THREE.DoubleSide }, { key: 'robe' });
    const anchors = {}, lockers = [];
    const plateM = c => new THREE.MeshBasicMaterial({ map: c, toneMapped: true });
    const nameplates = [];
    const shelfItems = [new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0x5a2a1a, roughness: 0.7 }), Props.mats.brass];
    for (const sz of [-1, 1]) for (let i = 0; i < 9; i++) {
      const x = -W / 2 + 1.0 + i * 1.5, z = sz * (D / 2 - 0.35), g = new THREE.Group();
      // an open cubby: back, sides, roof, a seat shelf, a top shelf, a hook and the hanging robe
      const back = sz * 0.27;
      g.add(mesh(tBox(1.35, 2.5, 0.05, 0.8), lockM, 0, 1.25, back));
      for (const sx of [-0.65, 0.65]) g.add(mesh(tBox(0.06, 2.5, 0.6, 0.8), lockM, sx, 1.25, 0));
      g.add(mesh(tBox(1.4, 0.1, 0.65, 0.8), lockM, 0, 2.55, 0)); g.add(mesh(tBox(1.3, 0.06, 0.55, 0.8), lockM, 0, 2.05, 0)); g.add(mesh(tBox(1.3, 0.45, 0.55, 0.8), lockM, 0, 0.225, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6), Props.mats.brass, 0, 1.92, back * 0.55, 0, false)); g.children[g.children.length - 1].rotation.z = Math.PI / 2;
      const robe = mesh(new THREE.PlaneGeometry(0.85, 1.35, 1, 4), robeM, 0, 1.2, back * 0.5, sz > 0 ? Math.PI : 0); g.add(robe);
      // bits and pieces on the top shelf
      g.add(mesh(new THREE.BoxGeometry(0.22, 0.14, 0.3), shelfItems[i % 3], -0.3, 2.15, 0, 0.2 * i, false));
      if (i % 2) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10), shelfItems[(i + 1) % 3], 0.32, 2.17, 0, 0, false));
      const plate = mesh(new THREE.PlaneGeometry(0.9, 0.18), new THREE.MeshStandardMaterial({ color: new THREE.Color(T.c2), metalness: 0.8, roughness: 0.3 }), 0, 2.38, -sz * 0.335, sz > 0 ? Math.PI : 0, false); g.add(plate); nameplates.push({ plate, x, z });
      g.position.set(x, 0, z); scene.add(g); lockers.push({ x, z, sz });
    }
    // benches down the middle
    for (const sz of [-1, 1]) { const b = Props.bench(10, lockM); b.rotation.y = Math.PI / 2; b.position.set(-0.6, 0, sz * 1.9); scene.add(b); }
    // tactics board with chalk diagrams that redraw themselves
    const boardC = document.createElement('canvas'); boardC.width = 512; boardC.height = 320;
    const boardT = new THREE.CanvasTexture(boardC); boardT.colorSpace = THREE.SRGBColorSpace;
    const board = mesh(new THREE.PlaneGeometry(3.2, 2.0), new THREE.MeshStandardMaterial({ map: boardT, roughness: 0.9, emissiveMap: boardT, emissive: 0x444444 }), -W / 2 + 0.03, 2.1, 0, Math.PI / 2, false); scene.add(board);
    scene.add(mesh(tBox(0.12, 2.2, 3.4, 0.6), lockM, -W / 2 + 0.02, 2.1, 0));
    // broom rack
    const rack = new THREE.Group(); rack.add(mesh(tBox(2.6, 0.1, 0.3, 0.6), lockM, 0, 1.9, 0)); rack.add(mesh(tBox(2.6, 0.1, 0.3, 0.6), lockM, 0, 0.5, 0));
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(Models.broomLo || (Models.broomLo = Models.broomGeo(false)), Models.flyerMat); b.rotation.set(Math.PI / 2 - 0.12, 0, 0); b.position.set(-1 + k * 0.5, 1.25, 0.1); b.castShadow = true; rack.add(b); }
    rack.position.set(W / 2 - 2.2, 0, -D / 2 + 0.9); scene.add(rack);
    // mirror
    const mir = mesh(new THREE.PlaneGeometry(1.1, 1.9), new THREE.MeshStandardMaterial({ color: 0x8090a0, metalness: 1, roughness: 0.04, envMapIntensity: 2 }), -W / 2 + 0.03, 1.5, -3.2, Math.PI / 2, false); scene.add(mir);
    // tunnel beyond the door, ending in daylight
    const tunM = pbrMat(SetTex.stone(), { color: 0x9a9088 });
    for (const sz of [-1, 1]) scene.add(mesh(tBox(30, 3.4, 0.4, 0.4), tunM, W / 2 + 15, 1.7, sz * 1.5));
    scene.add(mesh(tBox(30, 0.4, 3.4, 0.4), tunM, W / 2 + 15, 3.5, 0));
    const tf = mesh(tPlane(30, 3, 0.4), pbrMat(SetTex.flags()), W / 2 + 15, 0.002, 0, 0, false); tf.rotation.x = -Math.PI / 2; scene.add(tf);
    const glow = mesh(new THREE.PlaneGeometry(3.2, 3.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.5, 7.5), toneMapped: false }), W / 2 + 29.8, 1.7, 0, -Math.PI / 2, false); scene.add(glow);
    const sunIn = new THREE.SpotLight(0xfff0d8, 80, 40, 0.35, 0.5, 1); sunIn.position.set(W / 2 + 29, 2.2, 0); sunIn.target.position.set(W / 2 - 2, 0, 0); scene.add(sunIn, sunIn.target);
    // ceiling lanterns (floating candles cluster) + key light
    scene.add(Props.candles(pro ? 30 : 14, [-W / 2 + 1, W / 2 - 1, -D / 2 + 1, D / 2 - 1], H - 0.9, H - 0.4, 51));
    const key = new THREE.SpotLight(0xffd8a8, pro ? 70 : 45, 16, 0.95, 0.65, 1.3); key.position.set(-1, H - 0.2, 0.5); key.target.position.set(-1, 0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005; scene.add(key, key.target);
    const fill = new THREE.PointLight(new THREE.Color(T.c1).lerp(new THREE.Color(1, 1, 1), 0.6), 14, 12, 1.5); fill.position.set(4, H - 0.6, 0); scene.add(fill);
    scene.add(new THREE.HemisphereLight(0x8a8070, 0x2a2018, 0.8));
    scene.environment = setEnvMap(0x4a4038, 0x2a2018, 0x140c08, [{ p: [12, 1, 0], r: 2, c: 0xfff0d8, i: 6 }]);
    // anchors: your locker, team-mates around the room, the board, rack, mirror, door
    anchors.lockMe = [-3.5, 0, D / 2 - 1.1, Math.PI];
    anchors.board = [-W / 2 + 1.2, 0, 0.6, -Math.PI / 2];
    const spots = [[-5.1, -D / 2 + 1.1, 0, 'sit'], [-0.6, -1.9, Math.PI / 2, 'sit'], [2.6, -D / 2 + 1.1, 0, 'idle'], [1.9, 1.9, -Math.PI / 2, 'sit'], [-2.2, 1.9, -Math.PI / 2, 'sitTalk'], [4.6, D / 2 - 1.2, Math.PI, 'talk']];
    spots.forEach((s, i) => { anchors['mate' + i] = [s[0], 0, s[1], s[2], s[3]]; });
    const cams = {
      default: { p: [5.5, 1.75, 0.2], l: [-3, 1.4, 0], fov: 55 },
      lockerWide: { p: [6, 2.2, 2.5], l: [-3, 1.2, -0.5], p2: [4.5, 1.9, 1.6], fov: 52, dur: 12 },
      hub: { orbit: { c: [-0.8, 1.1, 0], r: 4.8, h: 0.8, a0: 1.2, w: 0.035 }, p: [4, 1.8, 0], l: [0, 1, 0], fov: 50, dur: 999 },
    };
    // chalk board animation
    const Bd = { t: 0, c: boardC, tex: boardT, tactic: Career.S ? Career.S.tactic : 'hawkshead' };
    const drawBoard = (t) => {
      const g = boardC.getContext('2d'); g.fillStyle = '#1a2a22'; g.fillRect(0, 0, 512, 320);
      g.strokeStyle = 'rgba(230,235,225,.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(256, 160, 230, 130, 0, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(256, 30); g.lineTo(256, 290); g.stroke();
      for (const x of [40, 472]) for (const y of [110, 160, 210]) { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.stroke(); }
      const tac = Bd.tactic, k = (Math.sin(t * 0.8) + 1) / 2;
      g.font = `20px ${Tex.font}`; g.fillStyle = 'rgba(235,240,230,.85)'; g.fillText(TACTICS[tac] ? TACTICS[tac].name : '', 18, 26);
      const pts = { hawkshead: [[220, 160, 330, 160], [200, 120, 300, 110], [200, 200, 300, 210]], porskoff: [[200, 120, 330, 100], [200, 200, 300, 240], [240, 160, 360, 150]], parkin: [[300, 130, 360, 155], [300, 190, 360, 165], [220, 160, 280, 160]], shield: [[200, 160, 300, 160], [240, 120, 330, 140], [240, 200, 330, 180]] }[tac] || [];
      g.strokeStyle = 'rgba(240,240,230,.9)'; g.lineWidth = 3;
      for (const [x0, y0, x1, y1] of pts) { const x = lerp(x0, x1, k), y = lerp(y0, y1, k); g.beginPath(); g.moveTo(x - 9, y - 9); g.lineTo(x + 9, y + 9); g.moveTo(x + 9, y - 9); g.lineTo(x - 9, y + 9); g.stroke(); g.setLineDash([6, 6]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]); }
      for (const [x, y] of [[400, 120], [410, 200], [370, 160]]) { g.beginPath(); g.arc(x - k * 20, y, 10, 0, TAU); g.stroke(); }
      boardT.needsUpdate = true;
    };
    drawBoard(0);
    return {
      scene, anchors, cams, lockers, board: Bd, nameplates, door: new THREE.Vector3(W / 2, 0, 0), bounds: { x0: -W / 2 + 0.6, x1: W / 2 + 0.2, z0: -D / 2 + 0.9, z1: D / 2 - 0.9 },
      env: { fog: 0x140e0a, fogDen: 0.015, exposure: 1.15, bloom: 1.15, sh: [0, 0.01, 0.025], hi: [0.04, 0.02, -0.01] },
      update(dt, t) { Bd.t += dt; if (Math.floor(Bd.t * 10) !== Math.floor((Bd.t - dt) * 10)) drawBoard(Bd.t); },
    };
  },
  // ---------------- PRESS ROOM ----------------
  press(variant) {
    Props.init();
    const scene = new THREE.Scene(), school = variant === 'school', team = Career.S ? Career.myTeam() : 0, T = CONFIG.teams[team];
    const fl = mesh(tPlane(16, 14, 0.4), pbrMat(school ? SetTex.flags() : SetTex.darkWood()), 0, 0, 0, 0, false); fl.rotation.x = -Math.PI / 2; scene.add(fl);
    // sponsor backdrop
    const logos = canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = school ? '#1c1a24' : shade(T.c1, -0.45); g.fillRect(0, 0, w, h);
      const words = school ? ['HOGWARTS', 'HOUSE CUP', 'QUIDDITCH'] : [T.name.toUpperCase(), 'GRINGOTTS', 'DAILY PROPHET', 'NIMBUS', 'BIQL'];
      g.font = `700 34px ${Tex.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      let k = 0; for (let y = 50; y < h; y += 100) for (let x = (y / 100 % 2) * 110 + 90; x < w; x += 220) { const wd = words[k++ % words.length]; if (wd === T.name.toUpperCase() && !school) { drawCrest(g, team, x, y, 54, 66, Tex.font); } else { g.fillStyle = k % 2 ? T.c2 : '#e8e2d6'; g.globalAlpha = 0.85; g.fillText(wd, x, y); g.globalAlpha = 1; } }
    });
    const back = mesh(new THREE.PlaneGeometry(9, 4.5), stdMat({ map: logos, roughness: 0.6 }, { key: 'backdrop' }), 0, 2.25, -3.4, 0, false); scene.add(back);
    scene.add(mesh(tBox(16, 6, 0.4, 0.4), pbrMat(school ? SetTex.stone() : SetTex.darkWood()), 0, 3, -3.7));
    // table with microphones
    const cloth = stdMat({ color: shade(T.c1, -0.2), roughness: 0.9 }, { key: 'tcloth' });
    scene.add(mesh(new THREE.BoxGeometry(3.6, 0.78, 0.9), cloth, 0, 0.39, -2.2));
    const micM = Props.mats.iron;
    for (let k = 0; k < 5; k++) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), micM, 0, 0.15, 0)); g.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), micM, 0, 0.32, 0)); g.position.set(-0.3 + k * 0.15, 0.78, -1.85); g.rotation.x = 0.4; scene.add(g); }
    const chair = Props.chair(0x2a2a30); chair.position.set(0, 0, -2.75); scene.add(chair);
    // rows of reporters' chairs
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const ch = Props.chair(0x3a3a44); ch.scale.setScalar(0.85); ch.position.set(-3.5 + c * 1.4, 0, 1.4 + r * 1.5); ch.rotation.y = Math.PI; scene.add(ch); }
    // camera tripods for flashes
    const flashes = [];
    for (const [x, z] of [[-4.5, 3], [4.5, 3.2], [-2.5, 5.2], [3, 5.6]]) { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const lg = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 4), micM, Math.cos(k * 2.1) * 0.25, 0.7, Math.sin(k * 2.1) * 0.25, 0, false); lg.rotation.z = Math.cos(k * 2.1) * 0.3; lg.rotation.x = -Math.sin(k * 2.1) * 0.3; g.add(lg); } g.add(mesh(new THREE.BoxGeometry(0.3, 0.22, 0.35), micM, 0, 1.5, 0)); const fl = new THREE.PointLight(0xdfe8ff, 0, 12, 1.5); fl.position.set(0, 1.7, -0.2); g.add(fl); const fs = new THREE.Sprite(new THREE.SpriteMaterial({ map: Models.glowTex, color: new THREE.Color(4, 4, 4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); fs.position.set(0, 1.65, -0.25); fs.scale.set(1.2, 1.2, 1); g.add(fs); g.position.set(x, 0, z); g.lookAt(0, 1.5, -2.5); scene.add(g); flashes.push({ l: fl, s: fs, t: 0 }); }
    // the Quick-Quotes Quill (acid green) over a parchment
    const quill = new THREE.Group();
    const qm = stdMat({ color: 0x5aff3a, emissive: 0x2a8a10, emissiveIntensity: 1.2, roughness: 0.4, side: THREE.DoubleSide }, { key: 'quill' });
    const vane = new THREE.Shape(); vane.moveTo(0, 0.05); vane.quadraticCurveTo(0.05, 0.16, 0.018, 0.34); vane.quadraticCurveTo(-0.025, 0.17, 0, 0.05);
    quill.add(new THREE.Mesh(new THREE.ShapeGeometry(vane, 8), qm)); quill.add(mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.46, 4), Props.mats.gold, 0, 0.2, 0, 0, false));
    const parch = mesh(new THREE.PlaneGeometry(0.32, 0.42).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 }), 0, 0, 0, 0, false);
    const qg = new THREE.Group(); qg.add(quill, parch); qg.visible = false; scene.add(qg);
    scene.add(new THREE.HemisphereLight(0xd8dce8, 0x403428, 1.6));
    const key = new THREE.SpotLight(0xfff4e8, 130, 16, 0.65, 0.5, 1.1); key.position.set(1.8, 4.4, 2.6); key.target.position.set(0, 1.1, -2.6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key, key.target);
    const fillR = new THREE.SpotLight(0xe8f0ff, 70, 16, 0.9, 0.6, 1.1); fillR.position.set(-1.5, 4, 6); fillR.target.position.set(0, 0.8, 2.5); scene.add(fillR, fillR.target);
    for (const sx of [-1, 1]) scene.add(mesh(tBox(0.4, 6, 14, 0.4), pbrMat(school ? SetTex.stone() : SetTex.darkWood()), sx * 8, 3, 3.3));
    scene.add(mesh(tBox(16, 6, 0.4, 0.4), pbrMat(school ? SetTex.stone() : SetTex.darkWood()), 0, 3, 10.2));
    const ceilP = mesh(new THREE.PlaneGeometry(16, 14), stdMat({ color: 0x1e1c1a, roughness: 0.9 }, { key: 'ceil' }), 0, 5.6, 3.3, 0, false); ceilP.rotation.x = Math.PI / 2; scene.add(ceilP);
    for (const z of [0, 4, 8]) for (const x of [-4, 0, 4]) { const pl = mesh(new THREE.BoxGeometry(1.2, 0.05, 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 2.1), toneMapped: false }), x, 5.55, z, 0, false); scene.add(pl); }
    const rim = new THREE.SpotLight(new THREE.Color(T.c2).lerp(new THREE.Color(1, 1, 1), 0.5), 30, 10, 0.7, 0.6, 1.2); rim.position.set(-2.5, 3.5, -3.2); rim.target.position.set(0, 1.2, -2.7); scene.add(rim, rim.target);
    scene.environment = setEnvMap(0x606878, 0x403830, 0x201810);
    const anchors = { seat: seatAt(0, -2.75, 0, 0.26), rep0: seatAt(-2.1, 1.4, Math.PI, 0.26), rep1: seatAt(0.7, 1.4, Math.PI, 0.26), rep2: seatAt(2.1, 2.9, Math.PI, 0.26), quill: [2.9, 1.25, 2.2] };
    const cams = {
      default: { p: [0.9, 1.45, 1.6], l: [0, 1.25, -2.7], fov: 36 },
      player: { p: [0.9, 1.45, 1.6], l: [0, 1.25, -2.7], p2: [0.7, 1.42, 1.2], fov: 34, dur: 14 },
      reporters: { p: [-0.6, 1.5, -1.6], l: [0.4, 1.0, 2.2], fov: 52, dur: 8 },
      rep: i => ({ p: [anchors['rep' + i][0] * 0.6 - 0.4, 1.95, anchors['rep' + i][2] - 3.4], l: [anchors['rep' + i][0], 1.05, anchors['rep' + i][2] + 0.1], p2: [anchors['rep' + i][0] * 0.6 - 0.3, 1.9, anchors['rep' + i][2] - 3.1], fov: 30, dur: 8 }),
      quill: { p: [2.4, 1.6, 1.4], l: [2.9, 1.25, 2.2], fov: 30, dur: 6 },
    };
    return { scene, anchors, cams, quill: qg, quillPen: quill,
      env: { fog: 0x2a2620, fogDen: 0.006, exposure: 1.25, bloom: 1.0 },
      flash() { const f = pick(flashes); f.t = 0.12; },
      update(dt, t) {
        for (const f of flashes) { if (Math.random() < dt * 0.35) f.t = 0.1; f.t = Math.max(0, f.t - dt); const k = f.t > 0 ? 1 : 0; f.l.intensity = k * 140; f.s.material.opacity = k; }
        if (qg.visible) { quill.position.set(Math.sin(t * 9) * 0.06, 0.04 + Math.abs(Math.sin(t * 18)) * 0.02, Math.cos(t * 4) * 0.08); quill.rotation.set(0.5, t * 0.3, 0.3 + Math.sin(t * 9) * 0.15); }
      } };
  },
  // ---------------- STUDIO (character creator) ----------------
  studio() {
    Props.init();
    const scene = new THREE.Scene();
    const cyc = mesh(new THREE.SphereGeometry(14, 32, 16, 0, TAU, 0, Math.PI / 2), stdMat({ color: 0x1a1c26, roughness: 0.95, side: THREE.BackSide }, { key: 'cyc' }), 0, 0, 0, 0, false); scene.add(cyc);
    const fl = mesh(new THREE.CircleGeometry(14, 48), stdMat({ color: 0x15161c, roughness: 0.6 }, { key: 'cycf' }), 0, 0, 0, 0, false); fl.rotation.x = -Math.PI / 2; scene.add(fl);
    const disc = mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.08, 48), Props.mats.brass, 0, 0.04, 0); scene.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1) })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.085; scene.add(ring);
    const key = new THREE.SpotLight(0xfff0dc, 70, 14, 0.5, 0.5, 1.2); key.position.set(2.4, 4.2, 3.2); key.target.position.set(0, 1, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key, key.target);
    const rim = new THREE.SpotLight(0x8ab0ff, 60, 12, 0.6, 0.6, 1.2); rim.position.set(-2.5, 3, -3); rim.target.position.set(0, 1.2, 0); scene.add(rim, rim.target);
    const rim2 = new THREE.SpotLight(0xffb070, 35, 12, 0.6, 0.6, 1.2); rim2.position.set(2.8, 2.2, -2.6); rim2.target.position.set(0, 1.2, 0); scene.add(rim2, rim2.target);
    scene.add(new THREE.HemisphereLight(0x50566a, 0x1a1410, 0.8));
    scene.add(Props.motes(200, [-3, 3, 0.2, 4, -3, 3]));
    scene.environment = setEnvMap(0x404860, 0x202430, 0x101014, [{ p: [4, 5, 5], r: 1.4, c: 0xfff0dc, i: 5 }]);
    return { scene, anchors: { stand: [0, 0.08, 0, 0] }, cams: { default: { p: [0, 1.25, 3.6], l: [0, 1.0, 0], fov: 38 }, face: { p: [0, 1.62, 1.25], l: [0, 1.55, 0], fov: 30 } }, env: { fog: 0x101218, fogDen: 0.02, exposure: 1.1, bloom: 1.1 } };
  },
  // ---------------- THE STADIUM / GROUNDS (uses the live world) ----------------
  world(variant) {
    Props.init();
    const anchors = {
      pitchMe: [-2, 0, 5, Math.PI * 0.85], pitchCapt: [-0.6, 0, 3.8, -Math.PI * 0.15], pitchF: [-3.3, 0, 5.9, Math.PI * 0.75],
      standsMe: [-58, 0, 34, -2.2], standsF: [-57.2, 0, 34.9, -2.4],
      boatMe: [38.62, -0.32, -351.3, Math.PI], boatF: [39.18, -0.32, -351.0, Math.PI],
    };
    const cams = {
      default: { p: [0, 6, 18], l: [0, 2, 0], fov: 50 },
      pitchLow: { p: [1.4, 1.5, 9.6], l: [-1.6, 1.3, 4.6], p2: [0.9, 1.45, 8.6], fov: 40, dur: 12 },
      standsView: { p: [-55, 2.2, 37.5], l: [-58, 1.4, 34], p2: [-55.6, 2.0, 37], fov: 44, dur: 12 },
      lakeWide: { p: [44, 2.2, -334], l: [40, 30, -780], p2: [42, 1.6, -340], fov: 46, dur: 10 },
      boats: { p: [41.5, 1.4, -348.5], l: [38.9, 0.9, -352], p2: [41, 1.3, -349.5], fov: 40, dur: 10 },
      castle: { p: [39, 1.4, -356], l: [40, 60, -780], p2: [39, 2.4, -365], fov: 34, dur: 9 },
    };
    const boats = [];
    return {
      world: true, weather: 'golden', anchors, cams,
      onEnter(o) {
        if (o.weather === 'night' || variant === 'lake') World.setWeather('night');
        // boats with lanterns on the lake; the hero boat carries the cast
        const hullM = pbrMat(SetTex.darkWood()); hullM.side = THREE.DoubleSide;
        for (let i = 0; i < 9; i++) {
          const g = new THREE.Group(), hull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, TAU, Math.PI / 2, Math.PI / 2), hullM); hull.scale.set(0.75, 0.42, 1.75); hull.castShadow = true; g.add(hull);
          g.add(mesh(tBox(1.3, 0.06, 0.3, 1), hullM, 0, -0.12, 0.25, 0, false));
          g.add(mesh(new THREE.TorusGeometry(1, 0.03, 4, 32), hullM, 0, 0, 0, 0, false)); g.children[2].rotation.x = Math.PI / 2; g.children[2].scale.set(0.75, 1.75, 1);
          g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 4), Props.mats.iron, 0, 0.35, -1.55, 0, false));
          g.add(mesh(new THREE.BoxGeometry(0.13, 0.17, 0.13), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.7, 0.8), toneMapped: false }), 0, 0.82, -1.55, 0, false));
          const pl = new THREE.PointLight(0xffa850, 2.2, 7, 1.8); pl.position.set(0, 0.85, -1.55); g.add(pl);
          const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: Models.glowTex, color: new THREE.Color(0.55, 0.34, 0.15), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); halo.position.set(0, 0.82, -1.55); halo.scale.set(0.55, 0.55, 1); g.add(halo);
          g.position.set(i === 0 ? 38.9 : 31 + (i % 4) * 4.5 + Math.random() * 1.5, -0.05, i === 0 ? -351.5 : -342 - Math.floor(i / 4) * 8 - (i % 4) * 2.5);
          g.userData.ph = Math.random() * 9; Render.scene.add(g); boats.push(g);
        }
      },
      onLeave() { for (const b of boats) Render.scene.remove(b); boats.length = 0; },
      update(dt, t) { for (const b of boats) { b.position.z -= dt * 0.6; b.rotation.z = Math.sin(t * 1.1 + b.userData.ph) * 0.04; b.position.y = -0.1 + Math.sin(t * 1.4 + b.userData.ph) * 0.04; } for (const id in Scenes.cast) { const c = Scenes.cast[id]; if (c.spec.at === 'boatMe' || c.spec.at === 'boatF') { c.h.root.position.z -= dt * 0.6; if (boats[0]) c.h.root.position.y = boats[0].position.y - 0.22; } } if (Scenes.cam && Scenes.cam.p1.z < -300) { Scenes.cam.p1.z -= dt * 0.6; if (Scenes.cam.p2) Scenes.cam.p2.z -= dt * 0.6; Scenes.cam.l1.z -= dt * 0.6 * (Scenes.cam.l1.z > -400 ? 1 : 0); } },
    };
  },
};
SetBuilders.lake = v => SetBuilders.world('lake');
