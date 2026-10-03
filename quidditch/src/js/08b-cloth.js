// ===================== VERLET CLOTH ROBES =====================
// Position-based (Jakobsen-style) cloth: verlet integration, relaxed distance constraints
// (structural + shear + bend), pinned along the shoulders, aerodynamic drag from the flyer's
// airspeed, speed-scaled flutter, and collision against the rider's torso and hips.
const ROBE_W = 8, ROBE_H = 11, ROBE_DT = 1 / 60;

const Robes = {
  list: [], mat: null, tex: null, acc: 0,
  init() {
    this.tex = canvasTex(1024, 512, (g) => {
      for (let i = 0; i < 4; i++) {
        const T = CONFIG.teams[i], x0 = i * 256;
        const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, shade(T.c1, 0.06)); gr.addColorStop(1, shade(T.c1, -0.28));
        g.fillStyle = gr; g.fillRect(x0, 0, 256, 512);
        for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * Math.sin(k * 1.7)})`; g.fillRect(x0 + k * 26 + 8, 0, 9, 512); }
        g.globalAlpha = 0.07;
        for (let k = 0; k < 2200; k++) { g.fillStyle = k % 2 ? '#000' : '#fff'; g.fillRect(x0 + Math.random() * 256, Math.random() * 512, 1, 2 + Math.random() * 4); }
        g.globalAlpha = 1;
        g.fillStyle = T.c2;
        g.fillRect(x0, 0, 256, 18); g.fillRect(x0, 0, 16, 512); g.fillRect(x0 + 240, 0, 16, 512);
        g.fillRect(x0, 470, 256, 42);
        g.fillStyle = shade(T.c1, -0.15); g.fillRect(x0, 482, 256, 8); g.fillRect(x0 + 20, 0, 3, 470); g.fillRect(x0 + 233, 0, 3, 470);
        drawCrest(g, i, x0 + 128, 92, 64, 78, Tex.font);
      }
    });
    this.tex.wrapS = this.tex.wrapT = THREE.ClampToEdgeWrapping;
    this.mat = stdMat({ map: this.tex, side: THREE.DoubleSide, roughness: 0.86, metalness: 0 }, { key: 'robe' });
  },
  create(f) { const r = new Robe(f); this.list.push(r); Render.scene.add(r.mesh); return r; },
  clear() { for (const r of this.list) { Render.scene.remove(r.mesh); r.mesh.geometry.dispose(); } this.list = []; },
  update(dt) {
    this.acc = Math.min(this.acc + dt, ROBE_DT * 3);
    const cam = Render.camera.position;
    let steps = 0;
    while (this.acc >= ROBE_DT) { this.acc -= ROBE_DT; steps++; }
    if (!steps) return;
    this.frame = (this.frame || 0) + 1;
    for (const r of this.list) {
      r.mesh.visible = !r.hide && (r.f.mesh.visible || (r.f.isPlayer && Cam.mode === 'fp' && Cam.lookBack > 0.45));
      if (!r.mesh.visible) continue;
      const d = r.f.pos.distanceTo(cam), every = d < 35 ? 1 : d < 90 ? 2 : 4;
      if ((this.frame + r.f.id) % every) continue;
      r.iters = d < 35 ? 4 : 2;
      for (let s = 0; s < steps; s++) r.step(ROBE_DT * every);
      r.upload();
    }
  },
};

class Robe {
  constructor(f) {
    this.f = f; const W = ROBE_W, H = ROBE_H, n = W * H;
    this.p = new Float32Array(n * 3); this.o = new Float32Array(n * 3);
    // pins: an arc across the upper back, shoulder to shoulder (flyer-local space)
    const back = V(0, 0.6, 0.09), nb = V(0, 0.664, 0.747), cape = f.mesh.userData.cape;
    this.pinLocal = []; this.cape = cape;
    if (cape) this.pinLocal = cape.pins.map(p => p.clone());
    else for (let i = 0; i < W; i++) {
      const a = lerp(-Math.PI / 2 * 0.92, Math.PI / 2 * 0.92, i / (W - 1));
      this.pinLocal.push(back.clone().add(V(Math.sin(a) * 0.21, -Math.abs(Math.sin(a)) * 0.04, 0)).addScaledVector(nb, (Math.cos(a) - 1) * 0.13));
    }
    const hRest = this.pinLocal[0].distanceTo(this.pinLocal[1]), vRest = 0.105;
    const C = [];
    const id = (i, j) => j * W + i;
    const add = (a, b, rest, k) => C.push(a, b, rest, k);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const flare = 1 + (j / (H - 1)) * 0.45, hr = hRest * flare;
      if (i < W - 1) add(id(i, j), id(i + 1, j), hr, 1);
      if (j < H - 1) add(id(i, j), id(i, j + 1), vRest, 1);
      if (i < W - 1 && j < H - 1) { const d = Math.hypot(hr, vRest); add(id(i, j), id(i + 1, j + 1), d, 0.7); add(id(i + 1, j), id(i, j + 1), d, 0.7); }
      if (i < W - 2) add(id(i, j), id(i + 2, j), hr * 2, 0.35);
      if (j < H - 2) add(id(i, j), id(i, j + 2), vRest * 2, 0.4);
    }
    this.c = new Float32Array(C);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    const uv = new Float32Array(n * 2), u0 = f.house * 0.25 + 0.002, uw = 0.246;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { uv[id(i, j) * 2] = u0 + uw * i / (W - 1); uv[id(i, j) * 2 + 1] = 1 - j / (H - 1); }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const idx = []; for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) { const a = id(i, j), b = a + 1, c2 = a + W, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, Robes.mat); this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
    this.last = new THREE.Vector3(1e9, 0, 0);
    this.seed = Math.random() * 10;
    this.reset();
  }
  pin(i, out) { return out.copy(this.pinLocal[i]).applyQuaternion(this.f.quat).add(this.f.pos); }
  reset() {
    const W = ROBE_W, H = ROBE_H, d = _v5.set(0, -0.55, 0.84).normalize().applyQuaternion(this.f.quat);
    for (let i = 0; i < W; i++) {
      this.pin(i, _v4);
      for (let j = 0; j < H; j++) { const k = (j * W + i) * 3; this.p[k] = this.o[k] = _v4.x + d.x * j * 0.105; this.p[k + 1] = this.o[k + 1] = _v4.y + d.y * j * 0.105; this.p[k + 2] = this.o[k + 2] = _v4.z + d.z * j * 0.105; }
    }
    this.pin(ROBE_W >> 1, this.last);
    this.upload();
  }
  step(dt) {
    const f = this.f, W = ROBE_W, H = ROBE_H, P = this.p, O = this.o;
    this.pin(W >> 1, _v4);
    if (_v4.distanceTo(this.last) > 8) { this.reset(); return; }
    this.last.copy(_v4);
    const t = Game.time + this.seed, spd = f.vel.length(), dt2 = dt * dt, k = 2.8;
    const up = f.up, rt = f.right;
    const wx = 1.2, wy = 0, wz = 0.6; // light ambient breeze
    for (let j = 1; j < H; j++) {
      const fl = spd * 0.2 * (j / (H - 1)) + 0.6;
      for (let i = 0; i < W; i++) {
        const q = (j * W + i) * 3;
        const vx = (P[q] - O[q]) / dt, vy = (P[q + 1] - O[q + 1]) / dt, vz = (P[q + 2] - O[q + 2]) / dt;
        const s1 = Math.sin(t * 13 + j * 0.9 + i * 0.35), s2 = Math.sin(t * 9.3 + j * 1.4 + i * 0.6);
        const ax = (wx - vx) * k + (up.x * s1 + rt.x * s2 * 0.7) * fl;
        const ay = (wy - vy) * k - 6.5 + (up.y * s1 + rt.y * s2 * 0.7) * fl;
        const az = (wz - vz) * k + (up.z * s1 + rt.z * s2 * 0.7) * fl;
        const nx = P[q] + (P[q] - O[q]) * 0.985 + ax * dt2, ny = P[q + 1] + (P[q + 1] - O[q + 1]) * 0.985 + ay * dt2, nz = P[q + 2] + (P[q + 2] - O[q + 2]) * 0.985 + az * dt2;
        O[q] = P[q]; O[q + 1] = P[q + 1]; O[q + 2] = P[q + 2];
        P[q] = nx; P[q + 1] = ny; P[q + 2] = nz;
      }
    }
    for (let i = 0; i < W; i++) { this.pin(i, _v4); const q = i * 3; O[q] = P[q]; O[q + 1] = P[q + 1]; O[q + 2] = P[q + 2]; P[q] = _v4.x; P[q + 1] = _v4.y; P[q + 2] = _v4.z; }
    // collision primitives in world space
    const cp = this.cape;
    const A = (cp ? _v1.copy(cp.colA) : _v1.set(0, 0.2, 0.22)).applyQuaternion(f.quat).add(f.pos), B = (cp ? _v2.copy(cp.colB) : _v2.set(0, 0.6, -0.1)).applyQuaternion(f.quat).add(f.pos);
    const hip = (cp ? _v3.copy(cp.hip) : _v3.set(0, 0.1, 0.24)).applyQuaternion(f.quat).add(f.pos);
    const ABx = B.x - A.x, ABy = B.y - A.y, ABz = B.z - A.z, AB2 = ABx * ABx + ABy * ABy + ABz * ABz;
    const C = this.c, nc = C.length;
    for (let it = 0; it < (this.iters || 4); it++) {
      for (let c = 0; c < nc; c += 4) {
        const a = C[c] * 3, b = C[c + 1] * 3, rest = C[c + 2], stiff = C[c + 3];
        const dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = (len - rest) / len * stiff;
        const pa = a < W * 3, pb = b < W * 3;
        if (pa && pb) continue;
        if (pa) { P[b] -= dx * diff; P[b + 1] -= dy * diff; P[b + 2] -= dz * diff; }
        else if (pb) { P[a] += dx * diff; P[a + 1] += dy * diff; P[a + 2] += dz * diff; }
        else { const h = diff * 0.5; P[a] += dx * h; P[a + 1] += dy * h; P[a + 2] += dz * h; P[b] -= dx * h; P[b + 1] -= dy * h; P[b + 2] -= dz * h; }
      }
      for (let q = W * 3; q < P.length; q += 3) {
        // torso capsule
        let u = ((P[q] - A.x) * ABx + (P[q + 1] - A.y) * ABy + (P[q + 2] - A.z) * ABz) / AB2; u = u < 0 ? 0 : u > 1 ? 1 : u;
        let cx = A.x + ABx * u, cy = A.y + ABy * u, cz = A.z + ABz * u;
        let dx = P[q] - cx, dy = P[q + 1] - cy, dz = P[q + 2] - cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 0.23 && d > 1e-5) { const s = 0.23 / d; P[q] = cx + dx * s; P[q + 1] = cy + dy * s; P[q + 2] = cz + dz * s; }
        dx = P[q] - hip.x; dy = P[q + 1] - hip.y; dz = P[q + 2] - hip.z; d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 0.24 && d > 1e-5) { const s = 0.24 / d; P[q] = hip.x + dx * s; P[q + 1] = hip.y + dy * s; P[q + 2] = hip.z + dz * s; }
        if (P[q + 1] < 0.08) P[q + 1] = 0.08;
      }
    }
  }
  upload() {
    const g = this.mesh.geometry;
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
  }
}
