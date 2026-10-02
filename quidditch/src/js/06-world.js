// ===================== GEOMETRY HELPERS =====================
const Geo = {
  prep(geo, color, matrix, opts = {}) {
    if (matrix) geo.applyMatrix4(matrix);
    if (!geo.index) { const n = geo.attributes.position.count; const idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; geo.setIndex(new THREE.BufferAttribute(idx, 1)); }
    const n = geo.attributes.position.count, pos = geo.attributes.position;
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const cc = typeof color === 'function' ? color(pos.getX(i), pos.getY(i), pos.getZ(i), i) : color;
      c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    if (opts.attr) for (const k in opts.attr) {
      const fn = opts.attr[k], a = new Float32Array(n);
      for (let i = 0; i < n; i++) a[i] = fn(pos.getX(i), pos.getY(i), pos.getZ(i), i);
      geo.setAttribute(k, new THREE.BufferAttribute(a, 1));
    }
    if (opts.worldUV) {
      const uv = geo.attributes.uv, nr = geo.attributes.normal, s = opts.worldUV;
      for (let i = 0; i < n; i++) {
        const nx = Math.abs(nr.getX(i)), ny = Math.abs(nr.getY(i)), nz = Math.abs(nr.getZ(i));
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (ny > 0.6) uv.setXY(i, x * s, z * s); else if (nx > nz) uv.setXY(i, z * s, y * s); else uv.setXY(i, x * s, y * s);
      }
    }
    if (opts.uvRect) {
      const uv = geo.attributes.uv, [u0, v0, u1, v1] = opts.uvRect;
      for (let i = 0; i < n; i++) uv.setXY(i, lerp(u0, u1, uv.getX(i)), lerp(v0, v1, uv.getY(i)));
    }
    return geo;
  },
  merge(list, extra = []) {
    const attrs = ['position', 'normal', 'uv', 'color', ...extra];
    const sizes = { position: 3, normal: 3, uv: 2, color: 3 };
    for (const e of extra) sizes[e] = 1;
    let vc = 0, ic = 0;
    for (const g of list) { vc += g.attributes.position.count; ic += g.index.count; }
    const arrays = {}; for (const a of attrs) arrays[a] = new Float32Array(vc * sizes[a]);
    const index = new Uint32Array(ic);
    let vo = 0, io = 0;
    for (const g of list) {
      const n = g.attributes.position.count;
      for (const a of attrs) { const src = g.attributes[a]; if (src) arrays[a].set(src.array.length === n * sizes[a] ? src.array : src.array.subarray(0, n * sizes[a]), vo * sizes[a]); }
      const idx = g.index.array; for (let i = 0; i < idx.length; i++) index[io + i] = idx[i] + vo;
      vo += n; io += idx.length;
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    for (const a of attrs) out.setAttribute(a, new THREE.BufferAttribute(arrays[a], sizes[a]));
    out.setIndex(new THREE.BufferAttribute(index, 1));
    out.computeBoundingSphere(); out.computeBoundingBox();
    return out;
  },
};
const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
const linCol = (r, g, b) => new THREE.Color(r, g, b);

// ===================== TERRAIN HEIGHT =====================
function terrainH(x, z) {
  const r = Math.hypot(x, z);
  let h = 0;
  if (r > 175) {
    h += smoothstep(175, 430, r) * (fbm2(x * 0.0045 + 3, z * 0.0045 - 7, 4) * 46 + 3);
    h += smoothstep(760, 1450, r) * (ridged2(x * 0.0016, z * 0.0016, 5) * 380 + 40);
  }
  const lx = (x - 40) / 300, lz = (z + 440) / 172, ld = Math.sqrt(lx * lx + lz * lz);
  if (ld < 1.45) h = lerp(-7, h, smoothstep(0.84, 1.32, ld));
  const cd = Math.hypot(x - 30, z + 770);
  if (cd < 260) h = Math.max(h, lerp(46, h, smoothstep(105, 235, cd)));
  return h;
}

// ===================== WEATHER PRESETS (linear colors) =====================
const WEATHER = {
  golden: {
    label: 'Golden Hour', el: 11, az: 35, sunCol: [1.0, 0.64, 0.36], sunI: 3.7, zenith: [0.07, 0.17, 0.45], horizon: [0.56, 0.52, 0.6], ground: [0.1, 0.085, 0.07],
    cover: 0.5, cLit: [1.55, 1.05, 0.7], cDark: [0.34, 0.29, 0.36], fog: [0.42, 0.44, 0.54], fogSun: [1.45, 0.88, 0.5], fogDen: 0.0008,
    hemiSky: [0.42, 0.5, 0.75], hemiGnd: [0.24, 0.17, 0.09], hemiI: 1.0, envI: 0.85, exposure: 1.0, stars: 0, rain: 0, night: 0, shafts: 0.55, flood: 0, sat: 1.08, lift: [0.012, 0.006, 0.0], sh: [-0.004, 0.012, 0.03], hi: [0.035, 0.012, -0.02], flare: 1, motes: 1,
  },
  overcast: {
    label: 'Overcast Drizzle', el: 32, az: 120, sunCol: [0.8, 0.83, 0.88], sunI: 1.15, zenith: [0.3, 0.33, 0.38], horizon: [0.52, 0.55, 0.58], ground: [0.12, 0.12, 0.12],
    cover: 0.93, cLit: [0.78, 0.8, 0.84], cDark: [0.26, 0.28, 0.31], fog: [0.42, 0.45, 0.48], fogSun: [0.56, 0.58, 0.62], fogDen: 0.0017,
    hemiSky: [0.66, 0.72, 0.8], hemiGnd: [0.22, 0.22, 0.2], hemiI: 1.7, envI: 1.0, exposure: 1.12, stars: 0, rain: 1, night: 0, shafts: 0, flood: 0, sat: 0.92, lift: [0.0, 0.004, 0.008], sh: [0.0, 0.008, 0.016], hi: [0.0, 0.0, 0.0], flare: 0, motes: 0,
  },
  night: {
    label: 'Night Match', el: 38, az: -55, sunCol: [0.5, 0.62, 1.0], sunI: 0.6, zenith: [0.004, 0.007, 0.022], horizon: [0.028, 0.036, 0.07], ground: [0.01, 0.012, 0.02],
    cover: 0.34, cLit: [0.1, 0.12, 0.18], cDark: [0.015, 0.02, 0.035], fog: [0.025, 0.035, 0.065], fogSun: [0.07, 0.09, 0.15], fogDen: 0.0011,
    hemiSky: [0.2, 0.25, 0.45], hemiGnd: [0.05, 0.04, 0.03], hemiI: 0.55, envI: 0.7, exposure: 1.45, stars: 1, rain: 0, night: 1, shafts: 0, flood: 230, sat: 1.05, lift: [0.0, 0.004, 0.012], sh: [0.0, 0.008, 0.035], hi: [0.025, 0.012, -0.01], flare: 0.4, motes: 1,
  },
};

// ===================== WORLD =====================
const World = {
  hoops: [], towers: [], ringDeriv: null, crowdTotal: 0, weather: null, nightMix: 0,
  excite: [0, 0, 0, 0, 0], wave: { ang: 0, amt: 0 },
  sectorTeam(i) { return Math.floor(i / (CONFIG.pitch.towers / 4)) % 4; },

  async build(progress) {
    const S = Render.scene;
    this.skyMat = makeSkyMaterial();
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(3500, 48, 24), this.skyMat);
    this.sky.renderOrder = 1000; this.sky.frustumCulled = false;
    S.add(this.sky);
    this.flood = new THREE.PointLight(0xffd9a0, 0, 330, 1.0); this.flood.position.set(0, 75, 0); S.add(this.flood);
    progress(0.3, 'Raising the hills…'); await nextFrame();
    this.buildTerrain(); this.buildWater();
    progress(0.4, 'Building the stands…'); await nextFrame();
    this.buildStadium();
    progress(0.5, 'Seating the crowd…'); await nextFrame();
    this.buildCrowd();
    progress(0.58, 'Planting the forest…'); await nextFrame();
    this.buildCastle(); this.buildTrees();
    progress(0.66, 'Gathering clouds…'); await nextFrame();
    this.buildClouds(); this.buildLanterns(); this.buildRain(); this.buildMotes();
    this.applyDensity();
  },

  buildTerrain() {
    const radii = [0, 30, 70, 110, 150, 172];
    for (let r = 180; r < 3200; r *= 1.042) radii.push(r);
    const segs = 220, rings = radii.length;
    const pos = new Float32Array(rings * (segs + 1) * 3);
    let k = 0;
    for (let i = 0; i < rings; i++) for (let j = 0; j <= segs; j++) {
      const a = j / segs * TAU, r = radii[i], x = Math.cos(a) * r, z = Math.sin(a) * r;
      pos[k++] = x; pos[k++] = terrainH(x, z); pos[k++] = z;
    }
    const idx = [];
    for (let i = 0; i < rings - 1; i++) for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const mat = stdMat({ color: 0xffffff, roughness: 0.95, metalness: 0 }, { key: 'ground', albedo: GROUND_ALBEDO, wnormal: true, rough: 'roughnessFactor = mix(0.95, 0.55, snow);' });
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.matrixAutoUpdate = false;
    Render.scene.add(m); this.ground = m;
  },

  buildWater() {
    const g = new THREE.PlaneGeometry(760, 460, 1, 1); g.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...fogUniforms(), ...SKYU, uNoise: SHARED.uNoise, uTime: SHARED.uTime },
      vertexShader: /* glsl */`varying vec3 vWPos; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWPos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: FOG_PARS + SKY_PARS + /* glsl */`
        varying vec3 vWPos;
        void main() {
          vec2 p = vWPos.xz;
          vec2 n1 = texture2D(uNoise, p * 0.011 + vec2(uTime * 0.007, uTime * 0.004)).rg - 0.5;
          vec2 n2 = texture2D(uNoise, p * 0.043 + vec2(-uTime * 0.011, uTime * 0.009)).gb - 0.5;
          vec2 n3 = texture2D(uNoise, p * 0.17 + vec2(uTime * 0.03, -uTime * 0.02)).rb - 0.5;
          vec3 N = normalize(vec3((n1.x + n2.x * 0.6 + n3.x * 0.35) * 0.32, 1.0, (n1.y + n2.y * 0.6 + n3.y * 0.35) * 0.32));
          vec3 V = normalize(vWPos - cameraPosition);
          vec3 R = reflect(V, N); R.y = abs(R.y) + 0.015; R = normalize(R);
          vec3 sky = skyColor(R, 1.0);
          float fres = 0.02 + 0.98 * pow(1.0 - max(dot(-V, N), 0.0), 5.0);
          vec3 deep = vec3(0.004, 0.018, 0.024) + uHorizon * 0.02;
          gl_FragColor = vec4(mix(deep, sky * 0.9, fres), 1.0);
          ${FOG_GLSL}
        }`,
    });
    const m = new THREE.Mesh(g, mat); m.position.set(40, -0.35, -440); m.updateMatrix(); m.matrixAutoUpdate = false;
    Render.scene.add(m);
  },

  // ellipse helpers for the stand ring
  ringPoint(th, o, out) {
    const A = CONFIG.pitch.standA, B = CONFIG.pitch.standB;
    let nx = Math.cos(th) / A, nz = Math.sin(th) / B; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    out.x = A * Math.cos(th) + nx * o; out.z = B * Math.sin(th) + nz * o; out.nx = nx; out.nz = nz;
    return out;
  },
  dsdth(th) { const A = CONFIG.pitch.standA, B = CONFIG.pitch.standB; return Math.hypot(A * Math.sin(th), B * Math.cos(th)); },

  buildStadium() {
    const P = CONFIG.pitch, N = P.towers;
    const wood = [], drapes = [], pennants = [], gold = [], banners = [];
    const rp = { x: 0, z: 0, nx: 0, nz: 0 };
    const woodCol = (k) => (x, y, z) => { const v = 0.82 + 0.25 * vnoise2(x * 0.7 + k, z * 0.7 + y * 0.3); return linCol(v, v * 0.97, v * 0.93); };
    const dark = linCol(0.55, 0.5, 0.46);
    this.crowdSeats = [];
    for (let i = 0; i < N; i++) {
      const th = (i + 0.5) / N * TAU;
      this.ringPoint(th, 3, rp);
      const team = this.sectorTeam(i), T = CONFIG.teams[team];
      const H = [13, 16, 19, 16][i % 4] + (i % 6 === 3 ? 3 : 0);
      const yaw = Math.atan2(-rp.nx, -rp.nz);
      const base = M4(rp.x, 0, rp.z, 0, yaw, 0);
      const L = (geo, color, m, opts) => Geo.prep(geo, color, base.clone().multiply(m), opts);
      wood.push(L(new THREE.BoxGeometry(4.6, H, 4.6), (x, y, z) => linCol(0.52, 0.47, 0.42).multiplyScalar(0.8 + 0.3 * vnoise2(x, y)), M4(0, H / 2, 0), { worldUV: 0.25 }));
      for (const sx of [-2.45, 2.45]) for (const sz of [-2.45, 2.45]) wood.push(L(new THREE.BoxGeometry(0.55, H + 0.4, 0.55), woodCol(i), M4(sx, H / 2, sz), { worldUV: 0.25 }));
      for (const side of [-1, 1]) for (const d of [-1, 1]) {
        const len = Math.hypot(4.9, H * 0.5);
        wood.push(L(new THREE.BoxGeometry(0.22, len, 0.22), dark, M4(side * 2.5, H * 0.25 + (d > 0 ? H * 0.5 : 0) * 0.98, 0, Math.atan2(4.9, H * 0.5) * d, 0, 0), { worldUV: 0.25 }));
      }
      wood.push(L(new THREE.BoxGeometry(7.6, 0.5, 7.6), woodCol(i + 3), M4(0, H, 0), { worldUV: 0.25 }));
      for (let k = 0; k < 4; k++) wood.push(L(new THREE.BoxGeometry(7.0, 0.55, 1.3), woodCol(i + k), M4(0, H + 0.5 + k * 0.55, 2.7 - k * 1.25), { worldUV: 0.25 }));
      wood.push(L(new THREE.BoxGeometry(7.6, 3.6, 0.3), woodCol(i + 7), M4(0, H + 2.1, -3.65), { worldUV: 0.25 }));
      for (const sx of [-3.65, 3.65]) wood.push(L(new THREE.BoxGeometry(0.3, 2.4, 7.3), woodCol(i + 9), M4(sx, H + 1.5, 0), { worldUV: 0.25 }));
      wood.push(L(new THREE.BoxGeometry(7.2, 0.14, 0.14), dark, M4(0, H + 1.35, 3.35)));
      for (const sx of [-3.5, 3.5]) for (const sz of [-3.5, 3.5]) wood.push(L(new THREE.BoxGeometry(0.28, 4.6, 0.28), woodCol(i), M4(sx, H + 2.6, sz), { worldUV: 0.25 }));
      const roofC = new THREE.Color(T.c1).multiplyScalar(0.9);
      wood.push(L(new THREE.ConeGeometry(6.0, 5.2, 4, 1), (x, y, z) => roofC.clone().multiplyScalar(0.75 + 0.35 * vnoise2(x * 2, y * 2)), M4(0, H + 4.9 + 2.6, 0, 0, Math.PI / 4, 0)));
      gold.push(L(new THREE.SphereGeometry(0.42, 10, 8), linCol(1, 1, 1), M4(0, H + 10.4, 0)));
      gold.push(L(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 6), linCol(1, 1, 1), M4(0, H + 12.2, 0)));
      // pennant
      const pen = new THREE.PlaneGeometry(3.2, 1.2, 8, 1);
      const pc = new THREE.Color(i % 2 ? T.c2 : T.c1);
      pennants.push(L(pen, pc, M4(1.6, H + 13.3, 0), { attr: { aWave: (x, y, z) => 0 } }));
      { // compute aWave from local x before transform: re-derive after prep using distance from pole
        const g = pennants[pennants.length - 1], p = g.attributes.position, w = g.attributes.aWave;
        const px = rp.x, pz = rp.z;
        for (let v = 0; v < p.count; v++) { const d = Math.hypot(p.getX(v) - px, p.getZ(v) - pz); w.setX(v, clamp(d / 3.2, 0, 1)); }
        // taper to a point
        for (let v = 0; v < p.count; v++) { const t = w.getX(v); const yy = p.getY(v), cy = H + 13.3; p.setY(v, cy + (yy - cy) * (1 - t * 0.85)); }
      }
      // drape banner on the inward face
      const dh = H - 1.4;
      const dg = new THREE.PlaneGeometry(4.3, dh, 1, 10);
      drapes.push(L(dg, linCol(1, 1, 1), M4(0, 0.8 + dh / 2, 2.34), { uvRect: [team * 0.25 + 0.004, 0.04, team * 0.25 + 0.246, 0.99], attr: { aWave: (x, y) => 0 } }));
      {
        const g = drapes[drapes.length - 1], p = g.attributes.position, w = g.attributes.aWave;
        for (let v = 0; v < p.count; v++) w.setX(v, clamp((0.8 + dh - p.getY(v)) / dh, 0, 1) * 0.6);
      }
      this.towers.push({ th, x: rp.x, z: rp.z, H, team, top: H + 10.5 });
      // tower crowd seats
      for (let k = 0; k < 4; k++) for (let s = 0; s < 11; s++) {
        const lx = -3.1 + s * 0.62 + rnd(-0.08, 0.08), lz = 2.7 - k * 1.25 + 0.1, ly = H + 0.5 + k * 0.55 + 0.28;
        _v1.set(lx, ly, lz).applyMatrix4(base);
        this.crowdSeats.push({ x: _v1.x, y: _v1.y, z: _v1.z, face: yaw, th, team });
      }
    }
    // lower stands between towers
    for (let i = 0; i < N; i++) {
      const t0 = this.towers[i], t1 = this.towers[(i + 1) % N];
      let a0 = t0.th, a1 = t1.th; if (a1 < a0) a1 += TAU;
      a0 += 4.2 / this.dsdth(a0); a1 -= 4.2 / this.dsdth(a1);
      const arc = (a1 - a0) * this.dsdth((a0 + a1) / 2);
      const M = Math.max(3, Math.round(arc / 2.6));
      const team = this.sectorTeam(i), rows = 9;
      for (let s = 0; s < M; s++) {
        const ta = lerp(a0, a1, s / M), tb = lerp(a0, a1, (s + 1) / M);
        for (let k = 0; k < rows; k++) {
          const o = -1.5 + k * 1.15, top = 1.0 + k * 0.75;
          const pa = this.ringPoint(ta, o, {}), pb = this.ringPoint(tb, o, {});
          const cx = (pa.x + pb.x) / 2, cz = (pa.z + pb.z) / 2, len = Math.hypot(pb.x - pa.x, pb.z - pa.z) + 0.06;
          const yaw = Math.atan2(pb.x - pa.x, pb.z - pa.z) - Math.PI / 2;
          wood.push(Geo.prep(new THREE.BoxGeometry(len, top, 1.18), woodCol(k + s), M4(cx, top / 2, cz, 0, yaw, 0), { worldUV: 0.25 }));
          const np = Math.floor(len / 0.56);
          for (let j = 0; j < np; j++) {
            const f = (j + 0.5) / np + rnd(-0.12, 0.12) / np;
            const thp = lerp(ta, tb, f), q = this.ringPoint(thp, o + 0.15, {});
            this.crowdSeats.push({ x: q.x, y: top + 0.02, z: q.z, face: Math.atan2(-q.nx, -q.nz), th: thp, team });
          }
        }
        // back wall + banner
        const o = 8.75, pa = this.ringPoint(ta, o, {}), pb = this.ringPoint(tb, o, {});
        const cx = (pa.x + pb.x) / 2, cz = (pa.z + pb.z) / 2, len = Math.hypot(pb.x - pa.x, pb.z - pa.z) + 0.06;
        const yaw = Math.atan2(pb.x - pa.x, pb.z - pa.z) - Math.PI / 2;
        wood.push(Geo.prep(new THREE.BoxGeometry(len, 10.6, 0.4), woodCol(s), M4(cx, 5.3, cz, 0, yaw, 0), { worldUV: 0.25 }));
        const bg = new THREE.PlaneGeometry(len, 2.6, 2, 1);
        const inward = Math.atan2(-pa.nx, -pa.nz);
        banners.push(Geo.prep(bg, linCol(1, 1, 1), M4(cx - pa.nx * 0.25, 8.9, cz - pa.nz * 0.25, 0, inward, 0), { uvRect: [team * 0.25 + 0.004, 0.045, team * 0.25 + 0.246, 0.31], attr: { aWave: () => 0.12 } }));
      }
    }
    // hoops
    for (const side of [-1, 1]) for (let h = 0; h < 3; h++) {
      const x = side * P.hoopX, z = P.hoopZ[h], y = P.hoopY[h], R = P.hoopR;
      const postTop = y - R;
      gold.push(Geo.prep(new THREE.CylinderGeometry(0.15, 0.22, postTop, 12), linCol(1, 1, 1), M4(x, postTop / 2, z)));
      gold.push(Geo.prep(new THREE.CylinderGeometry(0.28, 0.95, 1.5, 16), linCol(1, 1, 1), M4(x, 0.75, z)));
      gold.push(Geo.prep(new THREE.TorusGeometry(0.3, 0.07, 6, 16), linCol(1, 1, 1), M4(x, postTop * 0.5, z, Math.PI / 2, 0, 0)));
      gold.push(Geo.prep(new THREE.TorusGeometry(0.26, 0.06, 6, 16), linCol(1, 1, 1), M4(x, postTop - 0.1, z, Math.PI / 2, 0, 0)));
      const ringMat = stdMat({ color: 0xd9a43a, metalness: 1, roughness: 0.22, emissive: 0xffb02e, emissiveIntensity: 0.0 }, { key: 'gold' });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.12, 12, 64), ringMat);
      ring.position.set(x, y, z); ring.rotation.y = Math.PI / 2; ring.castShadow = true;
      Render.scene.add(ring);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.1, 48), new THREE.ShaderMaterial({
        uniforms: { uGlow: { value: 0 }, uTime: SHARED.uTime, uCol: { value: new THREE.Color(1.6, 1.1, 0.45) } },
        vertexShader: /* glsl */`varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform float uGlow; uniform float uTime; uniform vec3 uCol; varying vec2 vP;
          void main() { float r = length(vP) / ${(R - 0.1).toFixed(2)}; float rim = smoothstep(0.55, 1.0, r);
            float sw = 0.5 + 0.5 * sin(r * 18.0 - uTime * 3.0);
            float a = rim * (0.05 + 0.03 * sw) + uGlow * (0.25 + 0.75 * rim) * (0.7 + 0.3 * sw);
            gl_FragColor = vec4(uCol * (1.0 + uGlow * 3.0), a); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }));
      disc.position.copy(ring.position); disc.rotation.y = Math.PI / 2;
      Render.scene.add(disc);
      this.hoops.push({ pos: new THREE.Vector3(x, y, z), side, idx: h, ring, disc, glow: 0, spin: 0, defending: side < 0 ? 0 : 1, normal: new THREE.Vector3(side, 0, 0) });
    }
    for (let i = 0; i < N; i++) {
      const t0 = this.towers[i], t1 = this.towers[(i + 1) % N], T = CONFIG.teams[t0.team], T2 = CONFIG.teams[t1.team];
      const a = new THREE.Vector3(t0.x, t0.H + 6.6, t0.z), b = new THREE.Vector3(t1.x, t1.H + 6.6, t1.z);
      const len = a.distanceTo(b), nf = Math.floor(len / 1.1), pt = (u, out) => out.lerpVectors(a, b, u).add(_v6.set(0, -Math.sin(u * Math.PI) * 2.2, 0));
      for (let k = 0; k < nf; k++) {
        const u0 = (k + 0.15) / nf, u1 = (k + 0.85) / nf, p0 = pt(u0, new THREE.Vector3()), p1 = pt(u1, new THREE.Vector3());
        const tip = p0.clone().lerp(p1, 0.5).add(_v6.set(0, -0.75, 0));
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, tip.x, tip.y, tip.z], 3));
        const c = new THREE.Color(k % 3 === 0 ? T.c2 : k % 3 === 1 ? T.c1 : T2.c1);
        pennants.push(Geo.prep(g, c, null, { attr: { aWave: (x, y, z, vi) => (vi === 2 ? 0.25 : 0) } }));
      }
    }
    const woodMat = stdMat({ map: Tex.wood, vertexColors: true, roughness: 0.82, metalness: 0 }, { key: 'wood' });
    const woodMesh = new THREE.Mesh(Geo.merge(wood), woodMat);
    woodMesh.castShadow = true; woodMesh.receiveShadow = true; woodMesh.matrixAutoUpdate = false;
    Render.scene.add(woodMesh);
    const waveV = /* glsl */`
      float ph = position.x * 0.35 + position.z * 0.35;
      transformed += normal * (sin(uTime * 1.7 + position.y * 0.55 + ph) * 0.24 + sin(uTime * 3.3 + position.y * 1.4 + ph * 2.0) * 0.08) * aWave;`;
    const drapeMat = stdMat({ map: Tex.banners, roughness: 0.88, side: THREE.DoubleSide }, { key: 'drape', vHead: 'attribute float aWave;', vDisp: waveV });
    const drapeMesh = new THREE.Mesh(Geo.merge([...drapes, ...banners], ['aWave']), drapeMat);
    drapeMesh.receiveShadow = true; drapeMesh.castShadow = false; drapeMesh.matrixAutoUpdate = false;
    Render.scene.add(drapeMesh);
    const penMat = stdMat({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }, {
      key: 'pennant', vHead: 'attribute float aWave;',
      vDisp: 'transformed += normal * sin(uTime * 7.0 - aWave * 5.0 + position.x * 0.2 + position.z * 0.2) * 0.4 * aWave; transformed.y -= aWave * aWave * 0.4;',
    });
    const penMesh = new THREE.Mesh(Geo.merge(pennants, ['aWave']), penMat); penMesh.matrixAutoUpdate = false;
    Render.scene.add(penMesh);
    this.goldMat = stdMat({ color: 0xd9a43a, metalness: 1, roughness: 0.26, emissive: 0x3a2400, emissiveIntensity: 0.3 }, { key: 'gold' });
    const goldMesh = new THREE.Mesh(Geo.merge(gold), this.goldMat); goldMesh.castShadow = true; goldMesh.matrixAutoUpdate = false;
    Render.scene.add(goldMesh);
  },

  buildCrowd() {
    const seats = this.crowdSeats;
    for (let i = seats.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [seats[i], seats[j]] = [seats[j], seats[i]]; }
    const n = seats.length; this.crowdTotal = n;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const off = new Float32Array(n * 3), shirt = new Float32Array(n * 3), data = new Float32Array(n * 4);
    const neutrals = [linCol(0.05, 0.05, 0.06), linCol(0.25, 0.22, 0.2), linCol(0.4, 0.4, 0.42), linCol(0.12, 0.09, 0.06)];
    for (let i = 0; i < n; i++) {
      const s = seats[i];
      let team = s.team; if (Math.random() < 0.18) team = Math.floor(Math.random() * 4);
      const T = CONFIG.teams[team], r = Math.random();
      const c = r < 0.58 ? new THREE.Color(T.c1) : r < 0.82 ? new THREE.Color(T.c2) : pick(neutrals).clone();
      c.multiplyScalar(0.8 + Math.random() * 0.35);
      off[i * 3] = s.x; off[i * 3 + 1] = s.y; off[i * 3 + 2] = s.z;
      shirt[i * 3] = c.r; shirt[i * 3 + 1] = c.g; shirt[i * 3 + 2] = c.b;
      data[i * 4] = Math.random(); data[i * 4 + 1] = team; data[i * 4 + 2] = s.face; data[i * 4 + 3] = s.th;
    }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute('aShirt', new THREE.InstancedBufferAttribute(shirt, 3));
    g.setAttribute('aData', new THREE.InstancedBufferAttribute(data, 4));
    g.instanceCount = n;
    this.crowdU = { uExcite: { value: this.excite }, uWaveAng: { value: 0 }, uWaveAmt: { value: 0 }, uLightCol: { value: new THREE.Color(1, 1, 1) }, uAmb: { value: new THREE.Color(0.3, 0.3, 0.35) } };
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...fogUniforms(), uTime: SHARED.uTime, uAtlas: { value: Tex.crowd }, ...this.crowdU },
      vertexShader: /* glsl */`
        attribute vec3 aOff; attribute vec3 aShirt; attribute vec4 aData;
        uniform float uTime; uniform float uExcite[5]; uniform float uWaveAng; uniform float uWaveAmt;
        uniform vec3 uSunDirW; uniform vec3 uLightCol; uniform vec3 uAmb;
        varying vec2 vUv; varying vec3 vShirt; varying vec3 vSkin; varying vec3 vHair; varying vec3 vLight; varying vec3 vWPos;
        void main() {
          float seed = aData.x;
          int team = int(aData.y + 0.5);
          float ex = uExcite[team] * step(0.22, fract(seed * 7.13));
          float wd = abs(mod(aData.w - uWaveAng + 3.14159, 6.28318) - 3.14159);
          float wave = uWaveAmt * smoothstep(0.34, 0.0, wd);
          float jump = max(ex, wave);
          float hop = ex * abs(sin(uTime * (6.5 + seed * 3.0) + seed * 21.0)) * 0.3 + wave * 0.32;
          float bob = sin(uTime * (1.6 + seed * 2.4) + seed * 37.0) * 0.022;
          float variant = jump > 0.3 ? (seed > 0.5 ? 1.0 : 2.0) : (seed > 0.94 ? 3.0 : 0.0);
          vec3 base = aOff + vec3(0.0, bob + hop, 0.0);
          vec3 toCam = cameraPosition - base; toCam.y = 0.0; toCam /= max(length(toCam), 0.001);
          vec3 right = vec3(toCam.z, 0.0, -toCam.x);
          float sz = 0.92 + fract(seed * 13.7) * 0.22;
          vec3 wp = base + right * position.x * 0.64 * sz + vec3(0.0, position.y * 1.18 * sz, 0.0);
          vUv = vec2((position.x + 0.5 + variant) * 0.25, position.y);
          vShirt = aShirt;
          float s1 = fract(seed * 91.3), s2 = fract(seed * 53.1);
          vSkin = mix(mix(vec3(0.6, 0.4, 0.28), vec3(0.34, 0.2, 0.12), s1), vec3(0.1, 0.06, 0.035), step(0.82, s1) * 0.7);
          vHair = mix(mix(vec3(0.04, 0.03, 0.02), vec3(0.32, 0.18, 0.07), s2), vec3(0.6, 0.45, 0.22), step(0.86, s2));
          vec3 fn = vec3(sin(aData.z), 0.0, cos(aData.z));
          vec3 sh = normalize(vec3(uSunDirW.x, 0.0, uSunDirW.z) + 1e-4);
          float ndl = max(dot(fn, sh), 0.0) * smoothstep(-0.05, 0.12, uSunDirW.y);
          vLight = uAmb + uLightCol * (0.22 + 0.78 * ndl);
          vWPos = wp;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
      fragmentShader: FOG_PARS + /* glsl */`
        uniform sampler2D uAtlas;
        varying vec2 vUv; varying vec3 vShirt; varying vec3 vSkin; varying vec3 vHair; varying vec3 vLight; varying vec3 vWPos;
        void main() {
          vec4 m = texture2D(uAtlas, vUv);
          if (m.a < 0.5) discard;
          vec3 c = (vShirt * m.r + vSkin * m.g + vHair * m.b) * vLight;
          gl_FragColor = vec4(c, 1.0);
          ${FOG_GLSL}
        }`,
    });
    this.crowd = new THREE.Mesh(g, mat); this.crowd.frustumCulled = false;
    Render.scene.add(this.crowd);
  },

  buildCastle() {
    const C = new THREE.Vector3(30, 46, -770), parts = [], win = [];
    const stone = (x, y, z) => { const v = 0.75 + 0.3 * vnoise2(x * 0.1, y * 0.13 + z * 0.1); return linCol(0.2 * v, 0.19 * v, 0.18 * v); };
    const slate = linCol(0.08, 0.09, 0.13);
    const box = (x, y, z, w, h, d) => parts.push(Geo.prep(new THREE.BoxGeometry(w, h, d), stone, M4(C.x + x, C.y + y + h / 2, C.z + z)));
    const tower = (x, z, r, h, roof = 1.6) => {
      parts.push(Geo.prep(new THREE.CylinderGeometry(r, r * 1.08, h, 14), stone, M4(C.x + x, C.y + h / 2, C.z + z)));
      parts.push(Geo.prep(new THREE.CylinderGeometry(r * 1.18, r * 1.18, 2, 14), stone, M4(C.x + x, C.y + h + 1, C.z + z)));
      parts.push(Geo.prep(new THREE.ConeGeometry(r * 1.3, r * roof * 2.4, 14), slate, M4(C.x + x, C.y + h + 2 + r * roof * 1.2, C.z + z)));
      for (let k = 0; k < Math.floor(h / 9); k++) for (const a of [-0.35, 0.35]) win.push(Geo.prep(new THREE.BoxGeometry(0.9, 2.2, 0.3), linCol(1, 1, 1), M4(C.x + x + Math.sin(a) * r, C.y + 6 + k * 9, C.z + z + Math.cos(a) * r, 0, a, 0)));
    };
    box(-30, 0, 0, 70, 30, 26); box(30, 0, 6, 46, 24, 20); box(-5, 0, -30, 30, 36, 20); box(0, 0, 30, 110, 10, 6);
    parts.push(Geo.prep(new THREE.ConeGeometry(26, 16, 4), slate, M4(C.x - 30, C.y + 38, C.z, 0, Math.PI / 4, 0, 1, 1, 0.4)));
    tower(18, -10, 9, 84, 1.9); tower(-62, 8, 6, 54); tower(-40, -20, 5, 62); tower(54, 14, 6, 46); tower(64, -18, 5, 40);
    tower(0, 24, 4.5, 36); tower(-14, -40, 7, 70); tower(40, -34, 4, 58); tower(-80, -6, 4, 40); tower(80, 0, 4.5, 34);
    for (let k = 0; k < 9; k++) win.push(Geo.prep(new THREE.BoxGeometry(1.6, 3.4, 0.3), linCol(1, 1, 1), M4(C.x - 60 + k * 7, C.y + 14, C.z + 13.2)));
    for (let k = 0; k < 6; k++) win.push(Geo.prep(new THREE.BoxGeometry(1.4, 3, 0.3), linCol(1, 1, 1), M4(C.x + 12 + k * 6, C.y + 12, C.z + 16.2)));
    const mat = stdMat({ vertexColors: true, roughness: 0.9 }, { key: 'castle' });
    const m = new THREE.Mesh(Geo.merge(parts), mat); m.matrixAutoUpdate = false; Render.scene.add(m);
    this.winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.04, 0.03) });
    patchMaterial(this.winMat, { key: 'win' });
    const wm = new THREE.Mesh(Geo.merge(win), this.winMat); wm.matrixAutoUpdate = false; Render.scene.add(wm);
  },

  buildTrees() {
    const coni = [], deci = [];
    const trunk = linCol(0.12, 0.07, 0.04);
    coni.push(Geo.prep(new THREE.CylinderGeometry(0.25, 0.4, 3.4, 5, 1, true), trunk, M4(0, 1.7, 0)));
    [[3.4, 6.2, 4.6], [2.7, 5.2, 7.6], [1.7, 4.2, 10.4]].forEach(([r, h, y], k) => coni.push(Geo.prep(new THREE.ConeGeometry(r, h, 6, 1, true), (x, yy) => linCol(0.03, 0.075 + k * 0.01, 0.035).multiplyScalar(0.55 + 0.6 * clamp((yy - (y - h / 2)) / h, 0, 1)), M4(0, y, 0))));
    deci.push(Geo.prep(new THREE.CylinderGeometry(0.3, 0.45, 4.5, 5, 1, true), trunk, M4(0, 2.25, 0)));
    for (const [x, y, z, r] of [[0, 6.4, 0, 3.4], [1.4, 5.2, 0.8, 2.4], [-1.3, 5.6, -0.6, 2.6]]) {
      const g = new THREE.IcosahedronGeometry(r, 0); const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) { const s = 1 + (vnoise2(p.getX(v) * 1.3 + x, p.getY(v) * 1.3 + z) - 0.5) * 0.45; p.setXYZ(v, p.getX(v) * s, p.getY(v) * s, p.getZ(v) * s); }
      g.computeVertexNormals();
      deci.push(Geo.prep(g, (xx, yy) => linCol(0.06, 0.1, 0.03).multiplyScalar(0.6 + 0.5 * clamp((yy - 3) / 6, 0, 1)), M4(x, y, z)));
    }
    const sway = 'float hh = max(position.y, 0.0); vec3 ip = instanceMatrix[3].xyz; float sw = sin(uTime * 1.2 + ip.x * 0.05 + ip.z * 0.07) * 0.01 * hh; transformed.x += sw; transformed.z += sw * 0.6;';
    const mat = stdMat({ vertexColors: true, roughness: 0.92 }, { key: 'tree', vDisp: sway });
    const placeOK = (x, z) => {
      const r = Math.hypot(x, z); if (r < 190) return false;
      const lx = (x - 40) / 300, lz = (z + 440) / 172; if (Math.sqrt(lx * lx + lz * lz) < 1.12) return false;
      if (Math.hypot(x - 30, z + 770) < 120) return false;
      if (terrainH(x, z) > 190) return false;
      return fbm2(x * 0.006 + 11, z * 0.006 - 4, 3) > 0.47 || Math.random() < 0.08;
    };
    const mk = (geo, count) => {
      const im = new THREE.InstancedMesh(geo, mat, count);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
      let i = 0, guard = 0;
      while (i < count && guard++ < count * 40) {
        const r = Math.random() < 0.55 ? rnd(195, 520) : Math.sqrt(rnd(520 * 520, 1150 * 1150)), a = rnd(0, TAU), x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!placeOK(x, z)) continue;
        const sc = rnd(0.75, 1.75) * (1 + smoothstep(400, 1100, r) * 0.6);
        p.set(x, terrainH(x, z) - 0.4, z); q.setFromAxisAngle(UP, rnd(0, TAU)); s.set(sc, sc * rnd(0.85, 1.25), sc);
        m.compose(p, q, s); im.setMatrixAt(i, m);
        c.setRGB(rnd(0.75, 1.2), rnd(0.8, 1.2), rnd(0.7, 1.1)); im.setColorAt(i, c);
        i++;
      }
      im.count = i; im.userData.total = i; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
      Render.scene.add(im); return im;
    };
    this.trees = [mk(Geo.merge(coni), 2000), mk(Geo.merge(deci), 700)];
  },

  buildClouds() {
    const puffs = [];
    const cluster = (cx, cy, cz, spread, n, size) => { for (let i = 0; i < n; i++) puffs.push([cx + rnd(-spread, spread), cy + rnd(-spread * 0.25, spread * 0.3), cz + rnd(-spread, spread) * 0.7, size * rnd(0.7, 1.3), Math.random()]); };
    for (let i = 0; i < 26; i++) { const a = rnd(0, TAU), r = rnd(220, 1500); cluster(Math.cos(a) * r, rnd(150, 300), Math.sin(a) * r, rnd(40, 90), rndi(7, 13), rnd(45, 80)); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.6; cluster(Math.cos(a) * 124, rnd(60, 72), Math.sin(a) * 86, 18, 8, 26); }
    this.lowClouds = puffs.slice(-32).map(p => new THREE.Vector3(p[0], p[1], p[2]));
    const n = puffs.length, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const off = new Float32Array(n * 3), sz = new Float32Array(n * 2);
    this.puffData = puffs;
    puffs.forEach((p, i) => { off.set([p[0], p[1], p[2]], i * 3); sz.set([p[3], p[4]], i * 2); });
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.InstancedBufferAttribute(sz, 2).setUsage(THREE.DynamicDrawUsage));
    g.instanceCount = n;
    Tex.puff.wrapS = Tex.puff.wrapT = THREE.ClampToEdgeWrapping;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...fogUniforms(), ...SKYU, uPuff: { value: Tex.puff }, uNoise: SHARED.uNoise },
      vertexShader: /* glsl */`
        attribute vec3 aOff; attribute vec2 aSize; uniform vec3 uSunDirW;
        varying vec2 vUv; varying vec2 vP; varying float vFade; varying vec3 vWPos; varying vec3 vSunV; varying float vSeed;
        void main() {
          vSeed = aSize.y;
          float a = aSize.y * 6.2831;
          vUv = mat2(cos(a), sin(a), -sin(a), cos(a)) * position.xy + 0.5;
          vP = position.xy * 2.0;
          vec4 mv = viewMatrix * vec4(aOff, 1.0);
          mv.xy += position.xy * aSize.x;
          vFade = smoothstep(8.0, 45.0, length(mv.xyz));
          vWPos = aOff; vSunV = normalize((viewMatrix * vec4(uSunDirW, 0.0)).xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: FOG_PARS + /* glsl */`
        uniform sampler2D uPuff; uniform sampler2D uNoise; uniform vec3 uCloudLit; uniform vec3 uCloudDark; uniform vec3 uSunCol; uniform vec3 uZenith;
        varying vec2 vUv; varying vec2 vP; varying float vFade; varying vec3 vWPos; varying vec3 vSunV; varying float vSeed;
        void main() {
          vec4 t = texture2D(uPuff, vUv);
          float nz = texture2D(uNoise, vUv * 0.42 + vSeed * 3.7).r * 0.65 + texture2D(uNoise, vUv * 1.1 - vSeed).g * 0.35;
          float a = smoothstep(0.2, 0.7, t.a * 1.3 + (nz - 0.5) * 0.9) * t.a * 1.25 * vFade;
          if (a < 0.008) discard;
          vec3 n = normalize(vec3(vP, sqrt(max(1.0 - dot(vP, vP), 0.04))));
          float l = dot(n, vSunV) * 0.5 + 0.5;
          vec3 c = mix(uCloudDark * 1.35 + uZenith * 0.35, uCloudLit, smoothstep(0.1, 0.95, l)) * (0.82 + 0.3 * nz);
          c += uSunCol * pow(max(dot(normalize(vec3(vP * 0.3, -1.0)), vSunV), 0.0), 6.0) * smoothstep(0.9, 0.2, t.a) * 0.35;
          gl_FragColor = vec4(c * 0.92, a * 0.85);
          ${FOG_GLSL}
        }`,
      transparent: true, depthWrite: false,
    });
    this.clouds = new THREE.Mesh(g, mat); this.clouds.frustumCulled = false; this.clouds.renderOrder = 5;
    Render.scene.add(this.clouds);
    this.cloudSortT = 0;
  },
  sortClouds() {
    const cam = Render.camera.position, P = this.puffData;
    P.sort((a, b) => ((b[0] - cam.x) ** 2 + (b[1] - cam.y) ** 2 + (b[2] - cam.z) ** 2) - ((a[0] - cam.x) ** 2 + (a[1] - cam.y) ** 2 + (a[2] - cam.z) ** 2));
    const g = this.clouds.geometry, off = g.attributes.aOff, sz = g.attributes.aSize;
    P.forEach((p, i) => { off.array[i * 3] = p[0]; off.array[i * 3 + 1] = p[1]; off.array[i * 3 + 2] = p[2]; sz.array[i * 2] = p[3]; sz.array[i * 2 + 1] = p[4]; });
    off.needsUpdate = true; sz.needsUpdate = true;
  },

  buildLanterns() {
    const n = 80, g = new THREE.SphereGeometry(0.32, 10, 8); g.scale(1, 1.35, 1);
    this.lanternMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.4, 0.9) });
    patchMaterial(this.lanternMat, { key: 'lantern', vDisp: 'vec3 ip = instanceMatrix[3].xyz; transformed.y += sin(uTime * 0.9 + ip.x * 0.31 + ip.z * 0.17) * 0.9;' });
    const im = new THREE.InstancedMesh(g, this.lanternMat, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const a = rnd(0, TAU); m.makeTranslation(Math.cos(a) * rnd(80, 100), rnd(17, 34), Math.sin(a) * rnd(40, 56)); im.setMatrixAt(i, m); }
    im.frustumCulled = false; im.visible = false; Render.scene.add(im); this.lanterns = im;
  },

  buildRain() {
    const n = 2600, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const seed = new Float32Array(n * 3); for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 3)); g.instanceCount = n;
    this.rainU = { uCam: { value: new THREE.Vector3() }, uAmt: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: SHARED.uTime, ...this.rainU },
      vertexShader: /* glsl */`
        attribute vec3 aSeed; uniform float uTime; uniform vec3 uCam; varying float vA;
        void main() {
          vec3 box = vec3(40.0, 28.0, 40.0);
          vec3 p = aSeed * box; p.y -= uTime * 26.0; p.x -= uTime * 3.5;
          p = mod(p - uCam, box) + uCam - box * 0.5;
          vec3 fall = normalize(vec3(-3.5, -26.0, 0.0));
          vec3 side = normalize(cross(fall, normalize(cameraPosition - p)));
          vec3 wp = p + side * position.x * 0.025 + fall * position.y * 1.1;
          vA = smoothstep(1.0, 4.0, length(cameraPosition - p));
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
      fragmentShader: /* glsl */`uniform float uAmt; varying float vA; void main() { gl_FragColor = vec4(0.75, 0.8, 0.88, 0.2 * uAmt * vA); }`,
      transparent: true, depthWrite: false,
    });
    this.rain = new THREE.Mesh(g, mat); this.rain.frustumCulled = false; this.rain.visible = false; this.rain.renderOrder = 30;
    Render.scene.add(this.rain);
  },

  buildMotes() {
    const n = 320, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const seed = new Float32Array(n * 4); for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = n;
    this.motesU = { uCam: { value: new THREE.Vector3() }, uNight: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: SHARED.uTime, uSunDirW: SHARED.uSunDirW, uSunCol: SKYU.uSunCol, ...this.motesU },
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uTime; uniform vec3 uCam; uniform vec3 uSunDirW; uniform vec3 uSunCol; uniform float uNight;
        varying vec3 vC; varying vec2 vUv;
        void main() {
          vec3 box = vec3(34.0, 18.0, 34.0);
          vec3 p = aSeed.xyz * box + vec3(sin(uTime * 0.3 + aSeed.w * 30.0), sin(uTime * 0.21 + aSeed.x * 40.0) * 0.6, cos(uTime * 0.27 + aSeed.y * 30.0)) * 1.5;
          p += vec3(uTime * 0.6, 0.0, uTime * 0.25);
          p = mod(p - uCam, box) + uCam - box * 0.5;
          vec3 toP = normalize(p - cameraPosition);
          float mie = pow(max(dot(toP, uSunDirW), 0.0), 6.0);
          float d = distance(p, cameraPosition);
          float fade = smoothstep(1.0, 3.5, d) * (1.0 - smoothstep(10.0, 17.0, d));
          float tw = 0.6 + 0.4 * sin(uTime * (2.0 + aSeed.w * 3.0) + aSeed.x * 50.0);
          vC = mix(uSunCol * (0.05 + mie * 1.8), vec3(0.9, 0.62, 0.14) * tw, uNight) * fade;
          vUv = position.xy + 0.5;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          mv.xy += position.xy * (0.035 + aSeed.w * 0.04) * (1.0 + uNight * 1.5);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`varying vec3 vC; varying vec2 vUv; void main() { float r = length(vUv * 2.0 - 1.0); float a = 1.0 - smoothstep(0.0, 1.0, r); gl_FragColor = vec4(vC * a * a, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.motes = new THREE.Mesh(g, mat); this.motes.frustumCulled = false; this.motes.renderOrder = 25;
    Render.scene.add(this.motes);
  },
  applyDensity() {
    const t = Render.tier;
    if (this.crowd) this.crowd.geometry.instanceCount = Math.floor(this.crowdTotal * t.crowd);
    if (this.trees) for (const im of this.trees) im.count = Math.floor(im.userData.total * t.trees);
  },

  setWeather(name) {
    const w = WEATHER[name] || WEATHER.golden; this.weather = w; this.weatherName = name;
    this.applySky(0);
    Render.buildEnv();
  },
  applySky(nightMix) {
    this.nightMix = nightMix;
    const w = this.weather, n = WEATHER.night, m = nightMix;
    const mix3 = (a, b) => new THREE.Color(lerp(a[0], b[0], m), lerp(a[1], b[1], m), lerp(a[2], b[2], m));
    const el = w.el * DEG, az = w.az * DEG;
    SHARED.uSunDirW.value.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).normalize();
    SKYU.uSunCol.value.copy(mix3(w.sunCol, n.sunCol));
    SKYU.uZenith.value.copy(mix3(w.zenith, n.zenith));
    SKYU.uHorizon.value.copy(mix3(w.horizon, n.horizon));
    SKYU.uGroundCol.value.copy(mix3(w.ground, n.ground));
    SKYU.uCloudLit.value.copy(mix3(w.cLit, n.cLit));
    SKYU.uCloudDark.value.copy(mix3(w.cDark, n.cDark));
    SKYU.uCloudCover.value = lerp(w.cover, n.cover, m);
    SKYU.uStars.value = lerp(w.stars, 1, m);
    SHARED.uFogCol.value.copy(mix3(w.fog, n.fog));
    SHARED.uFogSun.value.copy(mix3(w.fogSun, n.fogSun));
    SHARED.uFogDen.value = lerp(w.fogDen, n.fogDen, m);
    const night = lerp(w.night, 1, m);
    SHARED.uNight.value = night;
    const sc = SKYU.uSunCol.value, mx = Math.max(sc.r, sc.g, sc.b);
    Render.sun.color.setRGB(sc.r / mx, sc.g / mx, sc.b / mx);
    Render.sun.intensity = lerp(w.sunI, n.sunI, m);
    Render.hemi.color.copy(mix3(w.hemiSky, n.hemiSky));
    Render.hemi.groundColor.copy(mix3(w.hemiGnd, n.hemiGnd));
    Render.hemi.intensity = lerp(w.hemiI, n.hemiI, m);
    Render.scene.environmentIntensity = lerp(w.envI, n.envI, m);
    this.flood.intensity = lerp(w.flood, n.flood, m);
    const fx = Render.post.fx;
    fx.exposure = lerp(w.exposure, n.exposure, m); fx.sat = lerp(w.sat, n.sat, m); fx.shafts = lerp(w.shafts, 0, m);
    fx.lift.setRGB(lerp(w.lift[0], n.lift[0], m), lerp(w.lift[1], n.lift[1], m), lerp(w.lift[2], n.lift[2], m));
    fx.rain = w.rain * (1 - m);
    fx.shadowTint.setRGB(lerp(w.sh[0], n.sh[0], m), lerp(w.sh[1], n.sh[1], m), lerp(w.sh[2], n.sh[2], m));
    fx.highTint.setRGB(lerp(w.hi[0], n.hi[0], m), lerp(w.hi[1], n.hi[1], m), lerp(w.hi[2], n.hi[2], m));
    this.flareBase = lerp(w.flare, n.flare, m);
    if (this.motes) { this.motes.visible = lerp(w.motes, n.motes, m) > 0.5; this.motesU.uNight.value = night; }
    this.rain.visible = w.rain > 0 && m < 0.5; this.rainU.uAmt.value = w.rain;
    this.lanterns.visible = night > 0.3;
    this.winMat.color.setRGB(lerp(0.05, 4.2, night), lerp(0.04, 2.3, night), lerp(0.03, 0.8, night));
    this.goldMat.emissiveIntensity = 0.3 + night * 1.2;
    const amb = Render.hemi.color.clone().multiplyScalar(Render.hemi.intensity * 0.35);
    this.crowdU.uAmb.value.copy(amb);
    this.crowdU.uLightCol.value.copy(Render.sun.color).multiplyScalar(Render.sun.intensity * 0.3 + night * 0.4);
    Sound.setRain && Sound.setRain(fx.rain);
  },

  // ---------- collision queries ----------
  bandQuery(x, z, out) {
    const A = CONFIG.pitch.standA, B = CONFIG.pitch.standB;
    const th = Math.atan2(z / B, x / A);
    this.ringPoint(th, 0, out);
    out.th = th; out.o = (x - out.x) * out.nx + (z - out.z) * out.nz;
    return out;
  },
  bandSolid(q) {
    const N = CONFIG.pitch.towers;
    let th = q.th; if (th < 0) th += TAU;
    const i = ((Math.round(th / TAU * N - 0.5) % N) + N) % N, t = this.towers[i];
    const s = wrapAngle(th - t.th) * this.dsdth(th);
    if (Math.abs(s) < 4.1 && q.o > -1.0 && q.o < 7.1) return { h: t.top, o0: -1.0, o1: 7.1 };
    if (q.o < -2.2 || q.o > 9.2) return null;
    if (q.o > 8.4) return { h: 10.6, o0: -2.2, o1: 9.2 };
    return { h: 1.0 + clamp((q.o + 1.5) / 1.15, 0, 8) * 0.75 + 0.2, o0: -2.2, o1: 9.2 };
  },
  // pushes p out of solid geometry; returns collision normal or null
  collide(p, rad, nOut) {
    const q = this.bandQuery(p.x, p.z, this._q || (this._q = {}));
    const s = this.bandSolid(q);
    if (s && p.y < s.h + rad) {
      const up = s.h + rad - p.y, inn = q.o - (s.o0 - rad), out = (s.o1 + rad) - q.o;
      if (up < inn && up < out) { p.y += up; nOut.set(0, 1, 0); }
      else if (inn < out) { p.x -= q.nx * inn; p.z -= q.nz * inn; nOut.set(-q.nx, 0, -q.nz); }
      else { p.x += q.nx * out; p.z += q.nz * out; nOut.set(q.nx, 0, q.nz); }
      return nOut;
    }
    for (const h of this.hoops) {
      const dx = p.x - h.pos.x, dz = p.z - h.pos.z;
      if (Math.abs(dx) > 4 || Math.abs(dz) > 4) continue;
      const postTop = h.pos.y - CONFIG.pitch.hoopR;
      const hd = Math.hypot(dx, dz);
      if (p.y < postTop && hd < 0.35 + rad) { const k = (0.35 + rad - hd) / Math.max(hd, 0.001); p.x += dx * k; p.z += dz * k; nOut.set(dx, 0, dz).normalize(); return nOut; }
      const dy = p.y - h.pos.y, radial = Math.hypot(dy, dz);
      const tx = dx, tr = radial - CONFIG.pitch.hoopR, td = Math.hypot(tx, tr), min = 0.12 + rad;
      if (td < min) {
        const k = (min - td) / Math.max(td, 0.001);
        const ry = radial > 0.001 ? dy / radial : 1, rz = radial > 0.001 ? dz / radial : 0;
        p.x += tx * k; p.y += ry * tr * k; p.z += rz * tr * k;
        nOut.set(tx, ry * tr, rz * tr).normalize(); return nOut;
      }
    }
    return null;
  },
  nearSolid(p) { // distance-ish to nearest solid (for near-miss detection)
    const q = this.bandQuery(p.x, p.z, this._q2 || (this._q2 = {}));
    const s = this.bandSolid(q);
    let d = 99;
    if (s) d = Math.max(0, p.y - s.h);
    else { const toIn = -2.2 - q.o; if (toIn > 0 && p.y < 10) d = Math.min(d, toIn); }
    for (const h of this.hoops) {
      const dx = p.x - h.pos.x, dz = p.z - h.pos.z;
      if (Math.abs(dx) > 6 || Math.abs(dz) > 6) continue;
      if (p.y < h.pos.y - CONFIG.pitch.hoopR) d = Math.min(d, Math.hypot(dx, dz) - 0.3);
      const dy = p.y - h.pos.y; d = Math.min(d, Math.hypot(dx, Math.hypot(dy, dz) - CONFIG.pitch.hoopR) - 0.12);
    }
    return d;
  },

  update(dt, rdt) {
    SHARED.uTime.value += dt;
    const cam = Render.camera.position;
    this.sky.position.copy(cam);
    for (let i = 0; i < 5; i++) this.excite[i] = Math.max(0, this.excite[i] - rdt * 0.22);
    this.wave.ang += rdt * 0.9;
    this.crowdU.uWaveAng.value = this.wave.ang % TAU;
    this.crowdU.uWaveAmt.value = damp(this.crowdU.uWaveAmt.value, this.wave.amt, 1.5, rdt);
    for (const h of this.hoops) {
      h.glow = Math.max(0, h.glow - rdt * 0.7);
      h.ring.material.emissiveIntensity = h.glow * 3 + SHARED.uNight.value * 0.5;
      h.disc.material.uniforms.uGlow.value = h.glow;
      if (Math.abs(h.spin) > 0.01) { h.ring.rotation.y += h.spin * dt; h.spin *= Math.exp(-1.2 * dt); }
      else if (h.spin !== 0) { h.spin = 0; h.ring.rotation.y = damp(h.ring.rotation.y, Math.round((h.ring.rotation.y - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2, 4, dt); }
    }
    if (this.rain.visible) this.rainU.uCam.value.copy(cam);
    if (this.motes && this.motes.visible) this.motesU.uCam.value.copy(cam);
    if ((this.cloudSortT -= rdt) < 0) { this.cloudSortT = 0.4; this.sortClouds(); }
    let cf = 0;
    for (const c of this.lowClouds) { const d = c.distanceTo(cam); if (d < 22) cf = Math.max(cf, 1 - d / 22); }
    Render.post.fx.cloudFog = damp(Render.post.fx.cloudFog, cf * 0.9, 4, rdt);
    Render.post.fx.cloudCol.copy(SKYU.uCloudLit.value).multiplyScalar(0.6);
  },
};
