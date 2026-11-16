// SEA_Y: the water level the add-on uses for splashes and sinking. Worlds without water get a level far below the map.
if (AF.PLAN && AF.PLAN.SEA_Y == null) AF.PLAN.SEA_Y = -64;
// ===== 06-fire: fire that spreads through whatever burns  (OWNER: coordinator) =====
// A burning voxel is marked IN THE GRID by a fire-coloured palette index (material 'fire', flickering emissive) and listed
// here with its fuel. Each burning voxel is visited ~5 times a second: it tries to light neighbours (upward and downwind
// first), throws the odd brand downwind, and when its fuel is spent it turns to char or to nothing — and whatever leaned on it
// (plaster panels, roof tiles, glass) starts to fall. Heat is kept on a 128x128 map that every surface in the world reads as glow.
{
  const W = AF.W, P = AF.PAL, M = AF.MAT, MP = AF.MATP, rnd = Math.random;
  const FCOL = [
    AF.col(0xffb850, { mat: 'fire', emit: 0xffc060, emitK: 3.6, mode: 'fire', jitter: 0.2, edge: 0 }),
    AF.col(0xff9a34, { mat: 'fire', emit: 0xff9a30, emitK: 3.3, mode: 'fire', jitter: 0.2, edge: 0 }),
    AF.col(0xff7420, { mat: 'fire', emit: 0xff7420, emitK: 3.0, mode: 'fire', jitter: 0.2, edge: 0 }),
    AF.col(0xe84c16, { mat: 'fire', emit: 0xff4e14, emitK: 2.6, mode: 'fire', jitter: 0.2, edge: 0 }),
    AF.col(0x7a260e, { mat: 'fire', emit: 0xf03c0c, emitK: 1.9, mode: 'fire', jitter: 0.3, edge: 0.2 }),
  ];
  const CHAR = [
    AF.col(0x1c1816, { mat: 'char', jitter: 0.35, edge: 0.5 }), AF.col(0x221c19, { mat: 'char', jitter: 0.35, edge: 0.5 }), AF.col(0x181412, { mat: 'char', jitter: 0.35, edge: 0.5 }),
    AF.col(0x241e1a, { mat: 'char', jitter: 0.35, edge: 0.5 }), AF.col(0x241a14, { mat: 'char', emit: 0xff4a10, emitK: 0.9, mode: 'fire', jitter: 0.6, edge: 0.4 }),
  ];
  const ASH = AF.col(0x6a655f, { mat: 'char', jitter: 0.8, edge: 0.3 });
  const F = AF.fire = { count: 0, total: 0, cityBurnt: 0, wind: { x: 0.62, z: -0.36 }, FCOL, CHAR, EMBER: CHAR[4], peak: 0, cells: 0 };
  const CAP = 260000;
  const fx = new Int32Array(CAP), fy = new Int32Array(CAP), fz = new Int32Array(CAP), ft = new Float32Array(CAP), fm = new Uint8Array(CAP), fv = new Uint8Array(CAP), fo = new Uint16Array(CAP);
  let n = 0, cursor = 0;
  // heat map (same grid as AF.glow: 128 over 600 m)
  const GN = 128, GC = 600 / GN;
  const cnt = new Int32Array(GN * GN), ysum = new Float64Array(GN * GN), heat = new Float32Array(GN * GN), ember = new Float32Array(GN * GN), tmp = new Float32Array(GN * GN);
  // WATER thrown by the citizens, per cell, in "voxels it can still put out". A wet cell also resists catching fire.
  const water = new Float32Array(GN * GN);
  F.waterPer = +(AF.Q.get('water') || 165);      /* water slows a fire where it lands; it does not erase a district */ F.doused = 0; F.refused = 0; F.thrown = 0;
  const cellOf = (x, z) => { const i = Math.floor((x + 300) / GC), k = Math.floor((z + 300) / GC); return (i < 0 || k < 0 || i >= GN || k >= GN) ? -1 : k * GN + i; };
  const vol = (v) => v === 0 ? null : AF.ships.list[v - 1];
  const getV = (v, x, y, z) => v === 0 ? W.get(x, y, z) : AF.ships.list[v - 1].get(x, y, z);
  const setV = (v, x, y, z, c) => { if (v === 0) { const lz = W.lazy; W.lazy = true; W.set(x, y, z, c); W.lazy = lz; } else AF.ships.list[v - 1].set(x, y, z, c); };
  const wp = new THREE.Vector3();
  const worldOf = (v, x, y, z) => v === 0 ? wp.set(W.xOf(x) + 0.125, W.yOf(y) + 0.125, W.zOf(z) + 0.125) : AF.ships.list[v - 1].voxWorld(x, y, z, wp);

  let lastIgnEv = 0;
  const light = (v, x, y, z, c) => {
    if (n >= CAP) return false;
    const mat = P.mat[c], mp = MP[mat];
    if (mat === M.explosive) { F.detonate(v, x, y, z); return true; }
    if (!(mp.burn > 0)) return false;
    if (v === 0) { const wc = cellOf(W.xOf(x), W.zOf(z)); if (wc >= 0 && water[wc] > 0.5 && rnd() < (water[wc] > 12 ? 0.95 : 0.75)) { water[wc] -= 0.15; F.refused++; return false; } }
    fo[n] = c;
    setV(v, x, y, z, FCOL[(AF.hash3(x >> 2, y >> 2, z >> 2) * 2.4 + rnd() * 0.9) | 0]);
    fx[n] = x; fy[n] = y; fz[n] = z; fm[n] = mat; fv[n] = v; ft[n] = mp.fuel * (0.55 + rnd() * 0.9); n++;
    if (v === 0) { const ci = cellOf(W.xOf(x), W.zOf(z)); if (ci >= 0) { cnt[ci]++; ysum[ci] += y; } } else AF.ships.list[v - 1].fireN++;
    F.count = n - smoulderN;
    if (AF.clock.t - lastIgnEv > 0.6) { lastIgnEv = AF.clock.t; const p = worldOf(v, x, y, z); AF.emit('ignite', { x: p.x, y: p.y, z: p.z }); }
    return true;
  };
  F.lightVoxel = light;
  // explosives: one keg lights the whole store. Gather the cluster, blast once, sized by how much there was.
  const pendingBooms = [];
  F.detonate = (v, x, y, z) => {
    // grow a box until it holds the whole store, then clear it and blast from its centre
    let R = 6, cntE = 0, sx = 0, sy = 0, sz = 0;
    for (let pass = 0; pass < 6; pass++) {
      cntE = 0; sx = sy = sz = 0; let edge = false;
      for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) { const c = getV(v, x + dx, y + dy, z + dz); if (c && P.mat[c] === M.explosive) { cntE++; sx += dx; sy += dy; sz += dz; if (Math.abs(dx) > R - 3 || Math.abs(dy) > R - 3 || Math.abs(dz) > R - 3) edge = true; } }
      if (!edge || R >= 38) break; R += 8;
    }
    for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) { const c = getV(v, x + dx, y + dy, z + dz); if (c && P.mat[c] === M.explosive) setV(v, x + dx, y + dy, z + dz, 0); }
    if (!cntE) return;
    const p = worldOf(v, x + Math.round(sx / cntE), y + Math.round(sy / cntE), z + Math.round(sz / cntE));
    const px = p.x, py = p.y, pz = p.z, r = Math.min(v ? 6.8 : 12.5, 2.4 + Math.cbrt(cntE) * 0.72);      // a ship's magazine breaks her back; it does not vaporise her
    pendingBooms.push({ x: px, y: py, z: pz, r, t: 0.08 + rnd() * 0.3 });
    if (cntE > 500) { const k = Math.min(6, 2 + (cntE / 700) | 0); for (let i = 0; i < k; i++) { const a = rnd() * 6.283, d = r * (0.5 + rnd() * 0.6); pendingBooms.push({ x: px + Math.cos(a) * d, y: py + rnd() * r * 0.5, z: pz + Math.sin(a) * d, r: r * (0.45 + rnd() * 0.2), t: 0.35 + i * 0.22 + rnd() * 0.2 }); } }
  };
  // set what burns within r (metres) alight. k scales the chance. Returns how many voxels caught.
  // ---- things that are not in the voxel grid burn too: placed props (stalls, carts, crates, signs) and the kit's flags
  const burningProps = [];
  F.burnProp = (pr) => {
    if (!pr || pr.dead || pr.burnT) return false; if (pr.mat === 'stone' || pr.mat === 'metal') return false;
    const bb = pr.geo && (pr.geo.boundingBox || (pr.geo.computeBoundingBox(), pr.geo.boundingBox)); if (!bb) return false;
    pr.burnT = 3 + rnd() * 4.5; pr.burnW = Math.max(0.3, (bb.max.x - bb.min.x + bb.max.z - bb.min.z) * 0.25); pr.burnH = Math.max(0.4, bb.max.y - bb.min.y); pr.burnY = bb.min.y; pr.burnS = 0;
    if (burningProps.length < 400) burningProps.push(pr); F.propsLit = (F.propsLit | 0) + 1; return true;
  };
  const stepProps = (dt) => {
    for (let i = burningProps.length - 1; i >= 0; i--) {
      const pr = burningProps[i]; if (pr.dead) { burningProps.splice(i, 1); continue; }
      pr.burnT -= dt; pr.burnS -= dt;
      if (pr.burnS <= 0) { pr.burnS = 0.07 + rnd() * 0.08; const w = pr.burnW, h = pr.burnH;
        AF.fx.fire(pr.x + (rnd() - 0.5) * 2 * w, pr.y + pr.burnY + rnd() * h, pr.z + (rnd() - 0.5) * 2 * w, { n: 1, size: 0.5 + Math.min(1.1, w * 0.6), life: 0.55, rise: 2.6, spread: 0.15, a: 0.7 });
        if (rnd() < 0.12) AF.fx.smoke(pr.x, pr.y + pr.burnY + h + 0.4, pr.z, { n: 1, size: 0.9 + w, dark: 0.85, rise: 2.4, life: 3.5, grow: 2.6, a: 0.42, glow: 0.6 });
        if (rnd() < 0.05) { let n = 0; AF.propsNear(pr.x, pr.y + pr.burnY + h * 0.5, pr.z, w + 1.6, (q) => { if (q !== pr && n < 2 && F.burnProp(q)) n++; }); }      // it jumps to what stands next to it
      }
      if (pr.burnT <= 0) {
        const px = pr.x, py = pr.y + pr.burnY + pr.burnH * 0.4, pz = pr.z; AF.killProp(pr); burningProps.splice(i, 1);
        AF.fx.debris(px, py, pz, { n: 2 + Math.round(pr.burnW * 2), pal: CHAR, speed: 2.2, up: 0.3, spread: pr.burnW, size: 0.14 }); AF.fx.sparks(px, py, pz, { n: 10, speed: 4, life: 0.9 });
        if (F.count < F.hardCap) AF.ignite(px, py, pz, 1.2 + pr.burnW * 0.5, 0.8, true);
      }
    }
  };
  AF.onTick('fire-props', 331, (dt) => { if (burningProps.length) stepProps(dt); });
  F.burningProps = burningProps;
  AF.ignite = (x, y, z, r = 1, k = 1, soot) => {
    let lit = 0;
    if (AF.propsNear && rnd() < k * 1.6) AF.propsNear(x, y, z, r + 0.9, (pr) => { if (F.burnProp(pr)) lit++; });
    { const fg = AF.kit && AF.kit.flags; if (fg && rnd() < k * 1.2) for (let i = 0; i < fg.length; i++) { const f = fg[i]; if (f.dead) continue; const dx = f.x - x, dz = f.z - z; if (dx > 3 || dx < -3 || dz > 3 || dz < -3) continue; if (dx * dx + dz * dz < (r + 1.2) * (r + 1.2) && f.y > y - 1 && f.y - 3.5 < y + r) { f.kill(true); lit++; } } }
    const bx0 = W.bx(x - r), bx1 = W.bx(x + r), by0 = W.by(y - r), by1 = W.by(y + r), bz0 = W.bz(z - r), bz1 = W.bz(z + r), cx = (x + 300) * 4, cy = (y + 16) * 4, cz = (z + 300) * 4, r2 = r * r * 16;
    for (let bx = bx0; bx <= bx1; bx++) for (let by = by0; by <= by1; by++) for (let bz = bz0; bz <= bz1; bz++) {
      const c = W.get(bx, by, bz); if (!c) continue;
      const dx = bx + 0.5 - cx, dy = by + 0.5 - cy, dz = bz + 0.5 - cz; if (dx * dx + dy * dy + dz * dz > r2) continue;
      const mat = P.mat[c], b = MP[mat].burn;
      if (b > 0) { if (rnd() < b * k && (F.count < F.hardCap || rnd() < 0.1)) { if (light(0, bx, by, bz, c)) lit++; } }
      else if (soot && mat !== M.fire && mat !== M.char && mat !== M.glass && rnd() < soot) { const s = AF.sootOf(c); if (s !== c) { const lz = W.lazy; W.lazy = true; W.set(bx, by, bz, s); W.lazy = lz; } }
      else if (mat === M.glass && soot && rnd() < 0.5) { const lz = W.lazy; W.lazy = true; W.set(bx, by, bz, 0); W.lazy = lz; }
    }
    if (AF.ships.igniteNear) lit += AF.ships.igniteNear(x, y, z, r, k);
    return lit;
  };
  // blacken the ground
  F.scorchGround = (x, z, r, k = 1) => {
    const b0 = W.bx(x - r), b1 = W.bx(x + r), d0 = W.bz(z - r), d1 = W.bz(z + r), cx = (x + 300) * 4, cz = (z + 300) * 4, r2 = r * r * 16;
    for (let bx = b0; bx <= b1; bx++) for (let bz = d0; bz <= d1; bz++) {
      if (bx < 0 || bz < 0 || bx >= W.NX || bz >= W.NZ) continue;
      const dx = bx + 0.5 - cx, dz = bz + 0.5 - cz, d2 = dx * dx + dz * dz; if (d2 > r2) continue;
      if (rnd() < k * (1 - d2 / r2) * 1.4) { const i = bx * W.NZ + bz; if (W.yOf(W.H[i]) < AF.PLAN.SEA_Y + 0.15) continue;      /* river, moat and sea beds lie under water: they do not scorch (the canal was turning into a black sheet) */
        const c = W.C[i], s = AF.sootOf(c); if (s !== c) W.setH(bx, bz, null, s); }
    }
  };
  F.heat = (x, z) => { const ci = cellOf(x, z); return ci < 0 ? 0 : heat[ci]; };
  F.burningAt = (x, y, z, r = 1.5) => {
    const ci = cellOf(x, z); if (ci >= 0 && heat[ci] < 0.02 && !n) return false;
    const bx = W.bx(x), by = W.by(y), bz = W.bz(z), s = Math.max(1, Math.round(r * 2));
    for (let dx = -s; dx <= s; dx += s) for (let dy = -s; dy <= s; dy += s) for (let dz = -s; dz <= s; dz += s) { const c = W.get(bx + dx, by + dy, bz + dz); if (c && P.mat[c] === M.fire) return true; }
    for (let dy = -2; dy <= 4; dy++) { const c = W.get(bx, by + dy, bz); if (c && P.mat[c] === M.fire) return true; }
    return false;
  };
  F.nearest = (x, z, maxR = 60) => {
    const ci = Math.floor((x + 300) / GC), ck = Math.floor((z + 300) / GC), R = Math.ceil(maxR / GC);
    let best = null, bd = maxR * maxR;
    for (let k = Math.max(0, ck - R); k <= Math.min(GN - 1, ck + R); k++) for (let i = Math.max(0, ci - R); i <= Math.min(GN - 1, ci + R); i++) {
      const c = k * GN + i; if (cnt[c] <= 0) continue;
      const wx = -300 + (i + 0.5) * GC, wz = -300 + (k + 0.5) * GC, d2 = (wx - x) * (wx - x) + (wz - z) * (wz - z);
      if (d2 < bd) { bd = d2; best = { x: wx, y: W.yOf(ysum[c] / cnt[c]), z: wz, d: Math.sqrt(d2), n: cnt[c] }; }
    }
    return best;
  };
  // Throw water. Soaks the ground cells (4.7 m) within r: every unit of `power` can put out ~F.waterPer burning voxels there
  // over the next moments (they are restored, blackened) and the cell stays wet for a while, resisting new fire.
  F.douse = (x, y, z, r = 1.5, power = 1) => {
    const i0 = Math.floor((x - r + 300) / GC), i1 = Math.floor((x + r + 300) / GC), k0 = Math.floor((z - r + 300) / GC), k1 = Math.floor((z + r + 300) / GC);
    let cells = 0; for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) if (i >= 0 && k >= 0 && i < GN && k < GN) cells++;
    if (!cells) return 0;
    const add = power * F.waterPer / cells; let burning = 0;
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) if (i >= 0 && k >= 0 && i < GN && k < GN) { const c = k * GN + i; water[c] = Math.min(1500, water[c] + add); burning += cnt[c]; }
    // the water runs and soaks: the ring of cells around gets a share too (this is what makes a firebreak)
    const soak = add * 0.14;
    for (let k = k0 - 1; k <= k1 + 1; k++) for (let i = i0 - 1; i <= i1 + 1; i++) if (i >= 0 && k >= 0 && i < GN && k < GN && (k < k0 || k > k1 || i < i0 || i > i1)) { const c = k * GN + i; water[c] = Math.min(1500, water[c] + soak); }
    F.thrown += power;
    return burning;      // how much is burning where the water went (0 = wasted on a place that is not alight)
  };
  F.wetAt = (x, z) => { const ci = cellOf(x, z); return ci < 0 ? 0 : Math.min(1, water[ci] / 100); };
  // the nearest EDGE of a fire: a burning cell with an unburnt, cool neighbour — where a brigade should stand and throw
  F.front = (x, z, maxR = 80) => {
    const ci = Math.floor((x + 300) / GC), ck = Math.floor((z + 300) / GC), R = Math.ceil(maxR / GC);
    let best = null, bs = 1e18;
    for (let k = Math.max(1, ck - R); k <= Math.min(GN - 2, ck + R); k++) for (let i = Math.max(1, ci - R); i <= Math.min(GN - 2, ci + R); i++) {
      const c = k * GN + i; if (cnt[c] <= 0) continue;
      let edge = 0; if (cnt[c - 1] === 0 && ember[c - 1] < 0.3) edge++; if (cnt[c + 1] === 0 && ember[c + 1] < 0.3) edge++; if (cnt[c - GN] === 0 && ember[c - GN] < 0.3) edge++; if (cnt[c + GN] === 0 && ember[c + GN] < 0.3) edge++;
      if (!edge) continue;
      const wx = -300 + (i + 0.5) * GC, wz = -300 + (k + 0.5) * GC, d2 = (wx - x) * (wx - x) + (wz - z) * (wz - z); if (d2 > maxR * maxR) continue;
      const sc = d2 * (1 + water[c] / 200) / (0.6 + edge * 0.2);       // nearer, drier, more exposed first
      if (sc < bs) { bs = sc; best = { x: wx, y: W.yOf(ysum[c] / cnt[c]), z: wz, heat: heat[c], n: cnt[c], d: Math.sqrt(d2) }; }
    }
    return best;
  };
  // ---- the dragon's breath
  let breathEv = 0, breathAcc = 0;
  // ---- THE JET: the body of the dragon's breath is one continuous beam from the jaws — white-hot core, orange sheath, torn
  // red edge, noise racing down it — drawn as two crossed camera-facing ribbons. The particles are only its fringe.
  let jetT = 0, jetR = 26, jetK = 0, jetMesh = null; const jetO = new THREE.Vector3(), jetD = new THREE.Vector3(0, 0, -1), jetU = { uA: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3() }, uK: { value: 0 }, uTime: { value: 0 }, uW: { value: 1 } };
  AF.onBuild('fire-jet', 612, () => {
    const g = new THREE.PlaneGeometry(1, 1, 1, 24);
    const m = new THREE.ShaderMaterial({ uniforms: jetU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: `uniform vec3 uA; uniform vec3 uB; uniform float uW; varying vec2 vQ;
        void main() { float t = uv.y; vec3 p = mix(uA, uB, t); vec3 ax = normalize(uB - uA); vec3 sd = normalize(cross(ax, cameraPosition - p));
          float w = uW * (0.16 + 1.25 * pow(t, 0.8)); p += sd * (uv.x - 0.5) * 2.0 * w; vQ = vec2((uv.x - 0.5) * 2.0, t); gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float uK; uniform float uTime; varying vec2 vQ;
        float h(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        float n(vec2 p){ vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
        void main() { float x = abs(vQ.x), t = vQ.y;
          float f = n(vec2(vQ.x * 2.2, t * 7.0 - uTime * 13.0)) * 0.6 + n(vec2(vQ.x * 5.0 + 3.0, t * 16.0 - uTime * 22.0)) * 0.4;
          float edge = 1.0 - smoothstep(0.30 + 0.5 * f * (0.4 + t), 0.98, x);            // torn outline, wider tears toward the end
          float core = 1.0 - smoothstep(0.0, 0.22 + 0.18 * f, x);
          float along = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.55, 1.0, t + (f - 0.5) * 0.35));
          vec3 col = mix(vec3(0.85, 0.10, 0.015), vec3(1.0, 0.42, 0.06), smoothstep(0.1, 0.7, edge * f + (1.0 - t) * 0.3)); col = mix(col, vec3(1.0, 0.92, 0.66), core * (1.0 - t * 0.75));
          float a = edge * along * (0.55 + 0.9 * core) * uK; gl_FragColor = vec4(col * a * 2.6, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    jetMesh = new THREE.Mesh(g, m); jetMesh.frustumCulled = false; jetMesh.renderOrder = 6; jetMesh.name = 'breath-jet'; jetMesh.visible = false; AF.scene.add(jetMesh);
  });
  AF.onTick('fire-jet', 333, (dt, t) => {
    if (!jetMesh) return; jetT -= dt; jetK += ((jetT > 0 ? 1 : 0) - jetK) * Math.min(1, dt * (jetT > 0 ? 14 : 9));
    jetMesh.visible = jetK > 0.02; if (!jetMesh.visible) return;
    // as far as it gets before it meets something
    const h = AF.rayVox(jetO.x, jetO.y, jetO.z, jetD.x, jetD.y, jetD.z, jetR, true), L = h ? Math.max(2.5, h.d + 0.8) : jetR;
    jetU.uA.value.copy(jetO); jetU.uB.value.copy(jetO).addScaledVector(jetD, L); jetU.uK.value = jetK; jetU.uTime.value = t; jetU.uW.value = 0.5 + L * 0.03;
  });
  const bd = new THREE.Vector3(), bu = new THREE.Vector3(), bv = new THREE.Vector3(), bt = new THREE.Vector3();
  F.breath = (ox, oy, oz, dx, dy, dz, dt, o = {}) => {
    const range = Math.max(o.range ?? 26, 16), cone = o.cone ?? 0.13;
    bd.set(dx, dy, dz).normalize(); bu.set(0, 1, 0).cross(bd); if (bu.lengthSq() < 1e-4) bu.set(1, 0, 0); bu.normalize(); bv.crossVectors(bd, bu);
    const dv = AF.dragon ? AF.dragon.vel : bt.set(0, 0, 0);
    // the stream: fast flame blobs that swell as they travel — a roaring cone from the jaws to where it lands
    const sp = range / 0.6; breathAcc += dt * 170; jetT = 0.12; jetO.set(ox, oy, oz); jetD.copy(bd); jetR = range;
    const A = AF.fx.pools.ADD;
    while (breathAcc > 1) {
      breathAcc -= 1;
      const a = rnd() * 6.283, c = Math.sqrt(rnd()) * cone, u = Math.cos(a) * c, v = Math.sin(a) * c, s = sp * (0.7 + rnd() * 0.45), j = rnd() * dt * sp;
      const vx = (bd.x + bu.x * u + bv.x * v) * s + dv.x * 0.45, vy = (bd.y + bu.y * u + bv.y * v) * s + dv.y * 0.45, vz = (bd.z + bu.z * u + bv.z * v) * s + dv.z * 0.45;
      const full = A.n >= A.N, before = A.n;
      AF.fx.fire(ox + bd.x * j, oy + bd.y * j, oz + bd.z * j, { n: 1, size: 1.1, life: 0.72 * (0.75 + rnd() * 0.45), vel: [vx, vy, vz], spread: 0.1, rise: 0, drag: 0.5, buoy: 2.2, a: 0.66 });
      if (!full && A.n > before) { const i = before * A.ST; A.st[i + 3] = vx; A.st[i + 4] = vy; A.st[i + 5] = vz; A.st[i + 8] = range * 0.010 + rnd() * 0.1; A.st[i + 9] = range * (0.022 + rnd() * 0.022); A.st[i + 20] = 1.6; }      /* a JET: thin, fast, white-hot at the root — not a cloud in front of the head */
    }
    if (rnd() < dt * 9) AF.fx.flash(ox + bd.x * range * 0.3, oy + bd.y * range * 0.3, oz + bd.z * range * 0.3, { intensity: 0.16, range: 17, life: 0.22, color: 0xff9a40, sprite: false });
    if (rnd() < dt * 26) AF.fx.smoke(ox + bd.x * range * 0.85, oy + bd.y * range * 0.85, oz + bd.z * range * 0.85, { n: 1, size: 3.5, dark: 0.85, rise: 4, life: 3.5, glow: 1.4, vel: [bd.x * 9 + dv.x * 0.3, bd.y * 9, bd.z * 9 + dv.z * 0.3] });
    // what it touches
    const rays = 4; let cxh = 0, cyh = 0, czh = 0, hitAny = false;
    for (let i = 0; i < rays; i++) {
      const a = rnd() * 6.283, c = i === 0 ? 0 : Math.sqrt(rnd()) * cone * 1.25, u = Math.cos(a) * c, v = Math.sin(a) * c;
      const rx = bd.x + bu.x * u + bv.x * v, ry = bd.y + bu.y * u + bv.y * v, rz = bd.z + bu.z * u + bv.z * v;
      const h = AF.rayVox(ox, oy, oz, rx, ry, rz, range, false);
      let hx, hy, hz, d;
      if (h) { hx = h.x; hy = h.y; hz = h.z; d = h.d; } else { d = range; hx = ox + rx * d; hy = oy + ry * d; hz = oz + rz * d; }
      if (h && h.water) { if (rnd() < 0.3) AF.fx.smoke(hx, hy + 0.3, hz, { n: 1, size: 2, dark: 0.05, rise: 5, life: 1.8, a: 0.5 }); if (i === 0) { cxh = hx; cyh = hy; czh = hz; hitAny = true; } continue; }
      if (i === 0) { cxh = hx; cyh = hy; czh = hz; hitAny = true; }
      if (i === 0) {
        // the jet burns what it passes, not only what it ends on: one point along it each frame, and the ground under that point
        const fd = Math.min(d, range) * (0.25 + rnd() * 0.7), px = ox + rx * fd, py = oy + ry * fd, pz = oz + rz * fd, kk = 0.6 * dt * 60 * satK();
        AF.ignite(px, py, pz, 1.3 + fd * 0.06, kk, 0.05);
        const gy = AF.surfaceBelow(px, pz, py, 12); if (py - gy < 6 && py - gy > 0.6) { AF.ignite(px, gy + 0.5, pz, 1.7, kk * 0.8, 0.05); if (rnd() < 0.25) AF.fx.fire(px, gy + 0.4, pz, { n: 1, size: 1.1, life: 0.5, rise: 3, spread: 0.8, a: 0.6 }); }
      }
      if (!h) {
        // spent in the open air: the flame falls. Whatever is under the end of the jet catches.
        const gy = AF.surfaceBelow(hx, hz, hy, 30); if (hy - gy < 16 && !(AF.isSea && AF.isSea(hx, hz) && gy <= AF.PLAN.SEA_Y + 0.2)) { AF.ignite(hx, gy + 0.6, hz, 2.4, 0.7 * dt * 60 / rays * satK(), 0.05); if (rnd() < 0.3) { AF.fx.fire(hx, gy + 0.5, hz, { n: 1, size: 1.6, life: 0.55, rise: 4, spread: 1.4, a: 0.65 }); F.scorchGround(hx, hz, 2.2, 0.1); } }
      }
      if (h) {
        const low = h.ground || hy - W.groundY(hx, hz) < 1.2, r = low ? 1.8 + d * 0.09 : 1.4 + d * 0.045;      // on the ground the flame splashes outward: it reaches the stalls and doorways beside the street
        if (h.ship) h.ship.ignite(hx, hy, hz, r * 1.2, 1.4 * dt * 60 / rays);
        else { AF.ignite(hx - rx * 0.2, hy - ry * 0.2, hz - rz * 0.2, r, 0.95 * dt * 60 / rays * satK(), 0.05); if (h.ground || hy - W.groundY(hx, hz) < 1.5) F.scorchGround(hx, hz, r * 1.2, 0.12); }
        if (rnd() < 0.5) AF.fx.sparks(hx, hy, hz, { n: 4, speed: 8, life: 0.9 });
        if (rnd() < 0.5) AF.fx.fire(hx, hy + 0.3, hz, { n: 1, size: 0.9 + r * 0.3, life: 0.55, rise: 4.5, spread: r * 0.7, a: 0.7, stretch: 2.0 });      // it splashes where it lands: low flames running outward, not a bonfire
      }
    }
    if (AF.clock.t - breathEv > 0.12 && hitAny) { breathEv = AF.clock.t; AF.emit('breath', { x: cxh, y: cyh, z: czh, ox, oy, oz, dx: bd.x, dy: bd.y, dz: bd.z, range }); }
  };

  // the more that is burning, the harder it is for new fire to start (paces the city's death and protects the frame rate)
  F.softCap = 30000; F.hardCap = 58000;
  const satK = () => { const c = F.count; return c < F.softCap ? 1 : Math.max(0.03, 1 - (c - F.softCap) / (F.hardCap - F.softCap)); };
  F.satK = satK;
  // ---- neighbour offsets, biased up and downwind
  const OFF = [];
  const mkOff = () => {
    OFF.length = 0; const wx = F.wind.x, wz = F.wind.z;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 3; dy++) for (let dz = -2; dz <= 2; dz++) {
      if (!dx && !dy && !dz) continue; const d = Math.hypot(dx, dy, dz); if (d > 3.2) continue;
      let w = 1 / (d * d); if (dy > 0) w *= 2.6; if (dy < 0) w *= 0.45; w *= Math.max(0.35, 1 + (dx * wx + dz * wz) / d * 0.9);
      const k = Math.max(1, Math.round(w * 6)); for (let i = 0; i < k; i++) OFF.push(dx, dy, dz);
    }
  };
  mkOff();
  // brands in flight: {x,y,z (target), t}
  const brands = [];
  const NB6 = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
  F.spreadK = +(AF.Q.get('spread') || 0.62);      // global spread-rate knob // char does not stand for long: a burnt timber crumbles a few seconds after the flame leaves it, unless it is a stump on
  // something sound. What rested on it (tiles, plaster, the floor above) then has nothing under it and the structure pass drops it.
  let smoulderN = 0;
  const SMO = 255;
  const smoulder = (i, dtv) => {
    const x = fx[i], y = fy[i], z = fz[i], v = fv[i];
    const c = getV(v, x, y, z);
    if (!c || P.mat[c] !== M.char) return false;
    ft[i] -= dtv; if (ft[i] > 0) return true;
    const b = getV(v, x, y - 1, z), bm = b ? P.mat[b] : -1;
    let keep;
    if (v === 0 && !b && W.yOf(y) - W.groundY(W.xOf(x), W.zOf(z)) < 0.3) keep = rnd() < 0.7;      // lying on the ground
    else if (bm < 0) keep = false;
    else if (bm === M.char || bm === M.fire) keep = rnd() < 0.22;
    else keep = rnd() < 0.5;
    if (!keep) {
      setV(v, x, y, z, 0);
      if (rnd() < 0.012) { const p = worldOf(v, x, y, z); AF.fx.cube(p.x, p.y, p.z, (rnd() - 0.5) * 1.5, 0, (rnd() - 0.5) * 1.5, c, 0.16, 3); if (rnd() < 0.3) AF.fx.embers(p.x, p.y, p.z, { n: 2, spread: 0.4 }); }
      if (v === 0) for (let k = 0; k < 7; k++) { const nx = x + ((rnd() * 9) | 0) - 4, ny = y + ((rnd() * 9) | 0) - 4, nz = z + ((rnd() * 9) | 0) - 4, nc = W.get(nx, ny, nz); if (!nc) continue; const nm = P.mat[nc]; if (nm !== M.fire && nm !== M.char && nm !== M.glass && MP[nm].burn === 0) { const so = AF.sootOf(nc); if (so !== nc) W.set(nx, ny, nz, so); } }
    if (v === 0 && AF.struct) AF.struct.burnt(x, y, z);
    }
    return false;
  };
  const visit = (i, dtv) => {
    if (fm[i] === SMO) return smoulder(i, dtv);
    const x = fx[i], y = fy[i], z = fz[i], v = fv[i];
    const c = getV(v, x, y, z);
    if (!c || P.mat[c] !== M.fire) return false;           // blasted, doused or fallen: forget it
    if (v !== 0) { const s = AF.ships.list[v - 1]; if (s.sunk || (!s.land && s.voxWorld(x, y, z, wp).y < AF.PLAN.SEA_Y)) { s.set(x, y, z, CHAR[0]); return false; } if (s.water >= 1 && rnd() < 0.5 * (dtv / 0.2)) { s.water -= 1; F.doused++; const oc = fo[i]; s.set(x, y, z, oc && P.mat[oc] !== M.fire ? AF.sootOf(oc) : CHAR[0]); return false; } }
    if (v === 0) { const wc = cellOf(W.xOf(x), W.zOf(z)); if (wc >= 0 && water[wc] >= 1 && rnd() < 0.55 * (dtv / 0.2)) { water[wc] -= 1; F.doused++; const oc = fo[i]; setV(0, x, y, z, oc && P.mat[oc] !== M.fire ? AF.sootOf(oc) : CHAR[0]); if (rnd() < 0.004) { const p = worldOf(0, x, y, z); AF.fx.smoke(p.x, p.y + 0.4, p.z, { n: 1, size: 1.3, dark: 0.06, rise: 3.5, life: 2.2, a: 0.42 }); } return false; } }
    const mat = fm[i], mp = MP[mat];
    const t = ft[i] - dtv; ft[i] = t;
    // try to light neighbours
    const tries = mat === M.wood ? 2 : 3, sat = satK();
    for (let k = 0; k < tries; k++) {
      const o = ((rnd() * (OFF.length / 3)) | 0) * 3, nx = x + OFF[o], ny = y + OFF[o + 1], nz = z + OFF[o + 2];
      const nc = getV(v, nx, ny, nz); if (!nc) continue;
      const nm = P.mat[nc]; if (nm === M.fire || nm === M.char) continue;
      const b = MP[nm].burn; if (b > 0 && rnd() < b * 0.34 * (mat === M.leaf && nm === M.leaf ? 3.2 : v !== 0 ? 1.15 : F.spreadK * sat) * (dtv / 0.2)) light(v, nx, ny, nz, nc);
    }
    if (mat === M.leaf) for (let k = 0; k < 3; k++) { const o = ((rnd() * (OFF.length / 3)) | 0) * 3, nx = x + OFF[o], ny = y + OFF[o + 1], nz = z + OFF[o + 2], nc = getV(v, nx, ny, nz); if (nc && P.mat[nc] === M.leaf && rnd() < 0.6 * (dtv / 0.2)) light(v, nx, ny, nz, nc); }      // foliage flashes through the whole crown
    // a tongue of flame licking across a gap (alleys, jetties): further when the place is an inferno
    if (rnd() < 0.03 * F.spreadK * sat * (dtv / 0.2)) {
      const ci0 = v === 0 ? cellOf(W.xOf(x), W.zOf(z)) : -1, hh = ci0 >= 0 ? heat[ci0] : 0.5, reach = 4 + hh * 10, a = rnd() * 6.283, d = 3 + rnd() * reach;
      const lx = Math.round(Math.cos(a) * d + F.wind.x * d * 0.6), lz = Math.round(Math.sin(a) * d + F.wind.z * d * 0.6), ly = Math.round((rnd() - 0.25) * 6);
      const nc = getV(v, x + lx, y + ly, z + lz);
      if (nc) { const nm = P.mat[nc], b = MP[nm].burn; if (b > 0 && nm !== M.fire && rnd() < b * (0.5 + hh)) light(v, x + lx, y + ly, z + lz, nc); }
    }
    // burning bits drop: a fire overhead lights what lies under it (roof -> loft -> floor)
    if (v === 0 && rnd() < 0.012 * F.spreadK * sat * (dtv / 0.2) && !W.get(x, y - 1, z)) {
      for (let d = 2; d < 56; d++) { const bc = W.get(x, y - d, z); if (bc) { const bm = P.mat[bc]; if (MP[bm].burn > 0 && bm !== M.fire) { light(0, x, y - d, z, bc); if (rnd() < 0.5) AF.ignite(W.xOf(x), W.yOf(y - d) + 0.2, W.zOf(z), 0.6, 1.5); } break; } if (W.yOf(y - d) < W.groundY(W.xOf(x), W.zOf(z))) break; }
    }
    // a brand on the wind
    if (v === 0 && rnd() < 0.0015 * sat * dtv / 0.2 * F.spreadK * (mat === M.thatch ? 2.2 : 1)) {
      const wl = Math.hypot(F.wind.x, F.wind.z) || 1, d = 5 + rnd() * rnd() * 34, lat = (rnd() * 2 - 1) * d * 0.35;
      const px = W.xOf(x), pz = W.zOf(z), tx = px + F.wind.x / wl * d - F.wind.z / wl * lat, tz = pz + F.wind.z / wl * d + F.wind.x / wl * lat, py = W.yOf(y);
      brands.push({ x: tx, z: tz, y: py + 14, t: 0.8 + d * 0.06 });
      const tt = 0.8 + d * 0.06; AF.fx.pools && AF.fx.sparks(px, py + 0.6, pz, { n: 1, speed: 0.1, life: tt * 1.6, color: 0xffa040 });
      const A = AF.fx.pools.ADD, q = (A.n - 1) * A.ST; A.st[q + 3] = (tx - px) / tt; A.st[q + 5] = (tz - pz) / tt; A.st[q + 4] = 9 + rnd() * 3; A.st[q + 7] = tt * 1.05; A.st[q + 8] = 0.4; A.st[q + 9] = 0.3; A.st[q + 16] = 0; A.st[q + 17] = -12;
    }
    if (t > 0) { if (t < 1.3 && c !== FCOL[3] && c !== FCOL[4] && rnd() < 0.5) setV(v, x, y, z, FCOL[3 + ((rnd() * 2) | 0)]); return true; }
    // burnt out
    F.total++; if (v === 0) { const wx = W.xOf(x), wz = W.zOf(z); if (wx > -184 && wx < 184 && wz > -212 && wz < 216) F.cityBurnt++; }
    const left = rnd() < mp.left;
    setV(v, x, y, z, left ? CHAR[(rnd() * CHAR.length) | 0] : (mat === M.thatch && rnd() < 0.05 ? ASH : 0));
    for (let k = 0; k < 18; k += 3) {
      const nx = x + NB6[k], ny = y + NB6[k + 1], nz = z + NB6[k + 2], nc = getV(v, nx, ny, nz); if (!nc) continue;
      const nm = P.mat[nc];
      if ((nm === M.plaster && rnd() < 0.22) || (nm === M.tile && rnd() < 0.4) || (nm === M.glass && rnd() < 0.8)) {
        setV(v, nx, ny, nz, 0);
        if (rnd() < 0.03) { const p = worldOf(v, nx, ny, nz); AF.fx.cube(p.x, p.y, p.z, (rnd() - 0.5) * 2, 0.5, (rnd() - 0.5) * 2, AF.sootOf(nc) || nc, 0.16, 3); }
      } else if (nm !== M.fire && nm !== M.char && MP[nm].burn === 0 && rnd() < 0.9) { const s = AF.sootOf(nc); if (s !== nc) setV(v, nx, ny, nz, s); }
    }
    if (v === 0 && AF.struct) AF.struct.burnt(x, y, z);
    // signs and other fine props hanging on what just burnt go with it
    if (v === 0 && AF.world.props.length && rnd() < 0.25) { const p = worldOf(v, x, y, z); AF.propsNear(p.x, p.y, p.z, 0.9, (pr) => { AF.killProp(pr); AF.fx.embers(pr.x, pr.y, pr.z, { n: 3, spread: 0.3 }); }); }
    if (left) { unburn(i); fm[i] = SMO; ft[i] = 4 + rnd() * 13; smoulderN++; return true; }
    return false;
  };
  // take a list entry out of the heat/burning counts (it burnt out)
  const unburn = (i) => {
    const v = fv[i];
    if (v === 0) { const ci = cellOf(W.xOf(fx[i]), W.zOf(fz[i])); if (ci >= 0) { cnt[ci]--; ysum[ci] -= fy[i]; if (cnt[ci] <= 0) { cnt[ci] = 0; ysum[ci] = 0; } ember[ci] = Math.min(1, ember[ci] + 0.004); } }
    else { const s = AF.ships.list[v - 1]; s.fireN = Math.max(0, s.fireN - 1); s.burntN++; }
  };
  const drop = (i) => {
    if (fm[i] === SMO) { smoulderN--; n--; if (i < n) { fx[i] = fx[n]; fy[i] = fy[n]; fz[i] = fz[n]; ft[i] = ft[n]; fm[i] = fm[n]; fv[i] = fv[n]; fo[i] = fo[n]; } return; }
    const v = fv[i];
    if (v === 0) { const ci = cellOf(W.xOf(fx[i]), W.zOf(fz[i])); if (ci >= 0) { cnt[ci]--; ysum[ci] -= fy[i]; if (cnt[ci] <= 0) { cnt[ci] = 0; ysum[ci] = 0; } ember[ci] = Math.min(1, ember[ci] + 0.004); } }
    else { const s = AF.ships.list[v - 1]; s.fireN = Math.max(0, s.fireN - 1); s.burntN++; }
    n--; if (i < n) { fx[i] = fx[n]; fy[i] = fy[n]; fz[i] = fz[n]; ft[i] = ft[n]; fm[i] = fm[n]; fv[i] = fv[n]; fo[i] = fo[n]; }
  };

  let mapT = 0, lightT = 0, windT = 0, smokeAcc = 0, flameAcc = 0;
  const hot = [];   // hottest cells (for lights + big smoke)
  const HF = { N: 256, cnt: new Float32Array(256 * 256), ys: new Float32Array(256 * 256), data: new Uint8Array(256 * 256 * 4), tex: null };
  HF.tex = new THREE.DataTexture(HF.data, 256, 256, THREE.RGBAFormat, THREE.UnsignedByteType); HF.tex.minFilter = HF.tex.magFilter = THREE.LinearFilter; HF.tex.generateMipmaps = false; HF.tex.needsUpdate = true;
  AF.heatField = HF; if (AF.mat && AF.mat.uniforms && AF.mat.uniforms.uHeat) AF.mat.uniforms.uHeat.value = HF.tex;
  AF.on('structure-restored', (s) => { if (!s || !s.box) return; const b = s.box, k = 256 / 600; for (let z = Math.max(0, ((b[2] + 300) * k) | 0); z <= Math.min(255, ((b[5] + 300) * k) | 0); z++) for (let x = Math.max(0, ((b[0] + 300) * k) | 0); x <= Math.min(255, ((b[3] + 300) * k) | 0); x++) HF.data[(z * 256 + x) * 4 + 2] = 0; });      // what a mender raises is clean again
  let colAcc = 0, tongueAcc = 0, ruinAcc = 0; const ruins = []; F.ruins = ruins;
  AF.on('structure-destroyed', (s) => { if (!s || !s.box || ruins.length >= 90) return; const b = s.box; ruins.push({ x: (b[0] + b[3]) / 2, y: AF.surfaceBelow((b[0] + b[3]) / 2, (b[2] + b[5]) / 2, b[1] + 6, 30), z: (b[2] + b[5]) / 2, w: Math.min(9, Math.max(2, (b[3] - b[0] + b[5] - b[2]) / 3)) }); });
  AF.onTick('fire', 330, (dt, t) => {
    // pending detonations
    for (let i = pendingBooms.length - 1; i >= 0; i--) { const b = pendingBooms[i]; b.t -= dt; if (b.t <= 0) { pendingBooms.splice(i, 1); AF.boom(b.x, b.y, b.z, { r: b.r, power: 1.2, fire: 1.2, by: 'powder' }); } }
    // brands land
    for (let i = brands.length - 1; i >= 0; i--) { const b = brands[i]; b.t -= dt; if (b.t <= 0) { brands.splice(i, 1); const h = AF.rayVox(b.x, b.y + 10, b.z, 0, -1, 0, 60, false); if (h && !h.ground && h.c) { const m = P.mat[h.c], pr = m === M.thatch || m === M.cloth ? 0.95 : m === M.leaf ? 0.7 : m === M.wood ? 0.22 : 0; if (rnd() < pr) AF.ignite(h.x, h.y - 0.1, h.z, 0.7, 3); } } }
    // visit a slice so that every burning voxel is seen about every 0.2 s
    if (n) {
      const per = 0.2, k = Math.min(n, Math.max(40, Math.ceil(n * dt / per))), dtv = Math.max(dt, Math.min(0.5, n * dt / k));
      for (let j = 0; j < k && n > 0; j++) { if (cursor >= n) cursor = 0; if (visit(cursor, dtv)) cursor++; else drop(cursor); }
      F.count = n - smoulderN; if (F.count > F.peak) F.peak = F.count;
    }
    // flames + smoke where it burns
    const nb = n - smoulderN;
    if (nb > 0) {
      flameAcc += dt * Math.min(800, 50 + nb * 0.055); smokeAcc += dt * Math.min(130, 6 + nb * 0.008);
      const cam = AF.camera.position;
      while (flameAcc > 1) {
        flameAcc -= 1; let i = (rnd() * n) | 0; /* flames are spent where the player is: far fires keep a third of theirs */ for (let q = 0; q < 2; q++) { const dx0 = W.xOf(fx[i]) - cam.x, dz0 = W.zOf(fz[i]) - cam.z; if (fv[i] !== 0 || dx0 * dx0 + dz0 * dz0 < 4900 || rnd() < 0.34) break; i = (rnd() * n) | 0; } if (fm[i] === SMO) { if (rnd() < 0.5) continue; const q = worldOf(fv[i], fx[i], fy[i], fz[i]); if (rnd() < 0.2) AF.fx.embers(q.x, q.y + 0.3, q.z, { n: 1, spread: 0.3 }); continue; }
        const p = worldOf(fv[i], fx[i], fy[i], fz[i]);
        const ci = cellOf(p.x, p.z), h = ci >= 0 ? heat[ci] : 0.4, d = p.distanceTo(cam), sz = (0.5 + h * 0.9) * (d > 150 ? 2.6 : d > 60 ? 1.6 : 1);
        // one in twelve near the camera is a GREAT tongue — rooted on the very block that burns, never in the sky or on a sound roof
        if (d < 70 && h > 0.3 && rnd() < (d < 30 ? 0.26 : 0.085)) AF.fx.fire(p.x, p.y + 0.2, p.z, { n: 1, size: 1.5 + h * 2.0 + rnd() * 1.2, life: 0.9 + rnd() * 0.45, rise: 1.8 + h * 2.2, spread: 0.15, a: 0.8, stretch: 2.1 + rnd() * 0.7, buoy: 1.4 });
        else AF.fx.fire(p.x, p.y + 0.2 + h * 0.3, p.z, { n: 1, size: sz, life: 0.55 + h * 0.5, rise: 2 + h * 3, spread: 0.3, a: 0.54, buoy: 2.2 });
        if (rnd() < 0.04) AF.fx.embers(p.x, p.y + 1, p.z, { n: 1 });
      }
      while (smokeAcc > 1) {
        smokeAcc -= 1; const i = (rnd() * n) | 0, p = worldOf(fv[i], fx[i], fy[i], fz[i]);
        const ci = cellOf(p.x, p.z), h = ci >= 0 ? heat[ci] : 0.4;
        AF.fx.smoke(p.x, p.y + 1.5 + h * 3, p.z, { n: 1, size: 2 + h * 4.2, dark: 0.82 + h * 0.14, rise: 3 + h * 6, life: 5 + h * 6.5, grow: 3 + h * 1.5, glow: 0.5 + h * 1.6, a: 0.46 + h * 0.12, buoy: 0.5 + h * 0.6 });
      }
    }
    // smouldering ruins
    // THE PALL: every hot quarter sends up a tall dark column that leans with the wind and lasts — the landmark that shows where
    // the dragon has been, lit orange from below by its own fire
    // THE PALL: every hot quarter sends up a tall dark column that leans with the wind and lasts — the landmark that shows where
    // the dragon has been, lit orange from below by its own fire
    // THE TONGUES: each hot cell throws a few great flames from where it burns — big, tall, rooted, each one different
    if (hot.length) { tongueAcc += dt * Math.min(64, hot.length * 4); const cp = AF.camera.position; while (tongueAcc > 1) { tongueAcc -= 1; let c = hot[(rnd() * hot.length) | 0]; /* the great flames go where the player is looking from: nearest of three picks */ for (let q = 0; q < 2; q++) { const c2 = hot[(rnd() * hot.length) | 0]; if ((c2.x - cp.x) * (c2.x - cp.x) + (c2.z - cp.z) * (c2.z - cp.z) < (c.x - cp.x) * (c.x - cp.x) + (c.z - cp.z) * (c.z - cp.z)) c = c2; } const hh = Math.min(1, c.h), s0 = 1.5 + hh * 2.0 + rnd() * 1.2;
      AF.fx.fire(c.x + (rnd() - 0.5) * 4, c.y + 0.3 + rnd() * 1.2, c.z + (rnd() - 0.5) * 4, { n: 1, size: s0, life: 0.95 + rnd() * 0.5, rise: 2.4 + hh * 3.2, spread: 0.2, a: 0.8, stretch: 2.1 + rnd() * 0.7, buoy: 2.6 }); } }
    if (hot.length) { colAcc += dt * Math.min(12, 1.6 + hot.length * 0.6); while (colAcc > 1) { colAcc -= 1; const c = hot[(rnd() * hot.length) | 0], hh = Math.min(1, c.h);
      AF.fx.smoke(c.x + (rnd() - 0.5) * 5, c.y + 4 + rnd() * 3, c.z + (rnd() - 0.5) * 5, { n: 1, size: 4.2 + hh * 2.8, dark: 0.93, rise: 4.5 + hh * 2.5, life: 22 + rnd() * 14, grow: 4.2, glow: 0.9 + hh * 0.9, a: 0.2, buoy: 0.95, drag: 0.2, stretch: 1.35 + rnd() * 0.5 }); } }
    // ...and every ruin smoulders for the rest of the evening: the skyline tells the score
    if (ruins.length) { ruinAcc += dt * Math.min(16, ruins.length * 0.4); const cp2 = AF.camera.position; while (ruinAcc > 1) { ruinAcc -= 1; const r = ruins[(rnd() * ruins.length) | 0];
      // seen from afar, every ruin stands under its own dark column: the skyline tells the score. Up close it is only a haze.
      if (Math.hypot(r.x - cp2.x, r.z - cp2.z) > 55) { AF.fx.smoke(r.x + (rnd() - 0.5) * r.w, r.y + 3 + rnd() * 3, r.z + (rnd() - 0.5) * r.w, { n: 1, size: 6 + rnd() * 3, dark: 0.92, rise: 3.6, life: 30 + rnd() * 14, grow: 3.2, a: 0.34, buoy: 0.85, drag: 0.18, glow: 0.5, stretch: 1.4 + rnd() * 0.5 }); continue; } AF.fx.smoke(r.x + (rnd() - 0.5) * r.w, r.y + 1 + rnd() * 2, r.z + (rnd() - 0.5) * r.w, { n: 1, size: 2.8 + rnd() * 1.8, dark: 0.78, rise: 2.6, life: 13 + rnd() * 7, grow: 4.2, a: 0.15, buoy: 0.7, drag: 0.25, glow: 0.25 });      /* wide, pale, low: a haze over the ruin, not dots in the sky */ if (rnd() < 0.08) AF.fx.embers(r.x, r.y + 1, r.z, { n: 2, spread: r.w * 0.4 }); } }
    if (hot.length && rnd() < dt * 3) { const c = hot[(rnd() * hot.length) | 0]; AF.fx.smoke(c.x + (rnd() - 0.5) * 4, c.y + 1, c.z + (rnd() - 0.5) * 4, { n: 1, size: 2, dark: 0.55, rise: 2, life: 7, a: 0.35 }); }
    // heat map + glow texture
    mapT -= dt;
    if (mapT <= 0) {
      mapT = 0.2; let cells = 0;
      for (let i = 0; i < GN * GN; i++) { if (water[i] > 0) { water[i] = water[i] * 0.9965 - 0.03; if (water[i] < 0) water[i] = 0; } const c = cnt[i]; const target = c > 0 ? Math.min(1, Math.log2(1 + c) / 8.5) : 0; if (c > 0) cells++; heat[i] += (target - heat[i]) * (target > heat[i] ? 0.5 : 0.07); if (heat[i] < 0.004) heat[i] = 0; ember[i] *= 0.9992; }
      F.cells = cells;
      // ships add their heat where they are now
      tmp.set(heat);
      for (const s of AF.ships.list) if (s.fireN > 20 && !s.sunk) { const ci = cellOf(s.x, s.z); if (ci >= 0) tmp[ci] = Math.max(tmp[ci], Math.min(1, Math.log2(1 + s.fireN) / 8.5)); }
      const D = AF.glow.data; hot.length = 0;
      for (let k = 0; k < GN; k++) for (let i = 0; i < GN; i++) {
        const c = k * GN + i; let s = tmp[c] * 4, w = 4;
        if (i > 0) { s += tmp[c - 1] * 2; w += 2; } if (i < GN - 1) { s += tmp[c + 1] * 2; w += 2; } if (k > 0) { s += tmp[c - GN] * 2; w += 2; } if (k < GN - 1) { s += tmp[c + GN] * 2; w += 2; }
        if (i > 0 && k > 0) { s += tmp[c - GN - 1]; w++; } if (i < GN - 1 && k > 0) { s += tmp[c - GN + 1]; w++; } if (i > 0 && k < GN - 1) { s += tmp[c + GN - 1]; w++; } if (i < GN - 1 && k < GN - 1) { s += tmp[c + GN + 1]; w++; }
        const g = Math.min(1, s / w * 1.5 + ember[c] * 0.22);
        const yb = cnt[c] > 0 ? ysum[c] / cnt[c] : (D[c * 4 + 1] ? (D[c * 4 + 1] / 255 * 128) * 4 : (W.H[Math.min(W.NX - 1, Math.floor((-300 + (i + 0.5) * GC + 300) * 4)) * W.NZ + Math.min(W.NZ - 1, Math.floor((-300 + (k + 0.5) * GC + 300) * 4))] + 64));
        D[c * 4] = Math.round(g * 255); D[c * 4 + 1] = Math.max(0, Math.min(255, Math.round(yb / 4 / 128 * 255))); D[c * 4 + 2] = Math.round(ember[c] * 255); D[c * 4 + 3] = 255;
        if (heat[c] > 0.3) hot.push({ x: -300 + (i + 0.5) * GC, y: W.yOf(yb), z: -300 + (k + 0.5) * GC, h: heat[c] });
      }
      AF.glow.tex.needsUpdate = true;
      // ---- THE FINE HEAT FIELD : fire and soot are DRAWN from a smooth 2.3 m field, filtered across block edges, not
      // per block. R = heat now (blurred, eased), G = height of the fire, B = how burnt the place is (only ever grows).
      { const FN = HF.N, cN = HF.cnt, yS = HF.ys, D2 = HF.data, k = FN / 600; cN.fill(0); yS.fill(0);
        for (let i = 0; i < n; i++) { if (fv[i] !== 0 || fm[i] === SMO) continue; const cx = ((W.xOf(fx[i]) + 300) * k) | 0, cz = ((W.zOf(fz[i]) + 300) * k) | 0; if (cx < 0 || cz < 0 || cx >= FN || cz >= FN) continue; const c = cz * FN + cx; cN[c]++; yS[c] += fy[i]; }
        for (let z = 1; z < FN - 1; z++) for (let x = 1; x < FN - 1; x++) { const c = z * FN + x;
          const s = cN[c] * 4 + (cN[c - 1] + cN[c + 1] + cN[c - FN] + cN[c + FN]) * 2 + cN[c - FN - 1] + cN[c - FN + 1] + cN[c + FN - 1] + cN[c + FN + 1];
          const o = c * 4; if (s === 0 && D2[o] === 0) continue;
          const tgt = Math.min(255, Math.log2(1 + s / 16) / 6.2 * 255), cur = D2[o]; D2[o] = Math.round(cur + (tgt - cur) * (tgt > cur ? 0.55 : 0.3));
          if (cN[c] > 0) D2[o + 1] = Math.max(0, Math.min(255, Math.round(yS[c] / cN[c] / 4 / 128 * 255)));
          else if (s > 0 && D2[o + 1] === 0) { let ys = 0, ns = 0; for (const q of [c - 1, c + 1, c - FN, c + FN]) if (cN[q] > 0) { ys += yS[q] / cN[q]; ns++; } if (ns) D2[o + 1] = Math.max(0, Math.min(255, Math.round(ys / ns / 4 / 128 * 255))); }
          if (tgt > 22) D2[o + 2] = Math.min(255, D2[o + 2] + Math.max(1, Math.round(tgt * 0.03))); }      // black comes over the last third of a burn, not at once      // the neighbours of a burnt house are sooted too
        HF.tex.needsUpdate = true; }
    }
    // point lights on the fires nearest the camera
    lightT -= dt;
    if (lightT <= 0 && AF.fx.fireLights && AF.fx.fireLights.length) {
      lightT = 0.4; const cam = AF.camera.position;
      for (const c of hot) c.s = c.h * 60 - Math.hypot(c.x - cam.x, c.y - cam.y, c.z - cam.z) * 0.5;
      hot.sort((a, b) => b.s - a.s);
      const L = AF.fx.fireLights, used = [];
      for (let i = 0; i < L.length; i++) {
        let c = null; for (const h of hot) { if (used.every((u) => Math.hypot(u.x - h.x, u.z - h.z) > 22)) { c = h; break; } }
        if (c) { used.push(c); L[i].position.set(c.x, c.y + 5, c.z); L[i].userData.I = 500 * c.h; L[i].distance = 55 + c.h * 40; } else L[i].userData.I = 0;
      }
    }
    if (AF.fx.fireLights) for (const l of AF.fx.fireLights) l.intensity += (l.userData.I * (0.8 + 0.3 * Math.sin(t * 11 + l.id) + 0.15 * Math.sin(t * 23.7 + l.id * 2)) - l.intensity) * Math.min(1, dt * 6);
    // the wind wanders a little
    windT -= dt; if (windT <= 0) { windT = 6; const a = Math.atan2(-0.36, 0.62) + Math.sin(t * 0.021) * 0.35 + Math.sin(t * 0.0077 + 2) * 0.25, s = 0.62 + 0.14 * Math.sin(t * 0.05); F.wind.x = Math.cos(a) * s; F.wind.z = Math.sin(a) * s; mkOff(); }
    AF.score.burnt = F.total;
  });
  // THE number for the HUD: how far gone the town is, 0..1. Half is how much of what could burn inside the city has burnt
  // (a gutted city has lost ~60% of its fuel), half is how many registered structures have fallen (~75% = rubble).
  AF.cityRuin = () => { const b = W.cityFlam0 ? Math.min(1, F.cityBurnt / (W.cityFlam0 * 0.6)) : 0, r = Math.min(1, (AF.struct ? AF.struct.ruin : 0) / 0.75); return Math.min(1, 0.5 * b + 0.5 * r); };
  // how much of the city is burning / has burnt (0..1), for the HUD and the sky
  F.intensity = () => Math.min(1, (n - smoulderN) / 60000);
}
