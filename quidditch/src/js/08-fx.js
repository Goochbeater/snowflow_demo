// ===================== FX: instanced particles + ribbon trails =====================
const PARTICLE_VS = /* glsl */`
attribute vec3 iPos; attribute vec4 iCol; attribute vec4 iDat; attribute vec3 iVel;
varying vec4 vCol; varying vec2 vUv; varying float vType; varying vec3 vWPos;
void main() {
  vUv = position.xy + 0.5; vCol = iCol; vType = iDat.w;
  vec4 mv = viewMatrix * vec4(iPos, 1.0);
  vec2 q = position.xy * iDat.x;
  if (iDat.y > 0.0) {
    vec3 vv = (viewMatrix * vec4(iVel, 0.0)).xyz;
    vec2 d = vv.xy; float l = length(d);
    if (l > 1e-4) { d /= l; vec2 n = vec2(-d.y, d.x); q = d * position.y * iDat.x * (1.0 + iDat.y * l) + n * position.x * iDat.x; }
  } else {
    float c = cos(iDat.z), s = sin(iDat.z); q = mat2(c, s, -s, c) * q;
  }
  mv.xy += q;
  vWPos = iPos;
  gl_Position = projectionMatrix * mv;
}`;
const PARTICLE_FS = /* glsl */`
uniform sampler2D uNoise;
varying vec4 vCol; varying vec2 vUv; varying float vType; varying vec3 vWPos;
void main() {
  vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a;
  int t = int(vType + 0.5);
  if (t == 0) { a = smoothstep(1.0, 0.0, r); a *= a; }
  else if (t == 1) { a = smoothstep(0.18, 0.0, abs(r - 0.8)) + smoothstep(0.8, 0.0, r) * 0.12; }
  else if (t == 2) { a = max(smoothstep(0.14, 0.0, abs(p.x)) * smoothstep(1.0, 0.0, abs(p.y)), smoothstep(0.14, 0.0, abs(p.y)) * smoothstep(1.0, 0.0, abs(p.x))); a = max(a, pow(smoothstep(0.6, 0.0, r), 2.0)); }
  else if (t == 3) { a = step(max(abs(p.x), abs(p.y) * 1.7), 0.85); }
  else { float n = texture2D(uNoise, vUv * 0.45 + vCol.a * 0.31 + vWPos.xz * 0.01).r; a = smoothstep(1.0, 0.1, r) * smoothstep(0.2, 0.7, n + 0.25); }
  float al = vCol.a * a;
  if (al < 0.003) discard;
  gl_FragColor = vec4(vCol.rgb, al);
}`;

class Particles {
  constructor(max, additive) {
    this.max = max; this.n = 0;
    const g = this.geo = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aDat = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aVel = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.aPos); g.setAttribute('iCol', this.aCol); g.setAttribute('iDat', this.aDat); g.setAttribute('iVel', this.aVel);
    g.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({ uniforms: { uNoise: SHARED.uNoise }, vertexShader: PARTICLE_VS, fragmentShader: PARTICLE_FS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 22 : 12;
    this.p = [];
    for (let i = 0; i < max; i++) this.p.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, s0: 1, s1: 1, r: 1, g: 1, b: 1, a0: 1, a1: 0, drag: 0, grav: 0, type: 0, stretch: 0, rot: 0, vrot: 0, follow: null, fx: 0, fy: 0, fz: 0 });
  }
  spawn(o) {
    if (this.n >= this.max) return null;
    const p = this.p[this.n++];
    p.x = o.x; p.y = o.y; p.z = o.z; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.life = 0; p.max = o.life || 1; p.s0 = o.s0 ?? 1; p.s1 = o.s1 ?? p.s0;
    p.r = o.r ?? 1; p.g = o.g ?? 1; p.b = o.b ?? 1; p.a0 = o.a0 ?? 1; p.a1 = o.a1 ?? 0;
    p.drag = o.drag || 0; p.grav = o.grav || 0; p.type = o.type || 0; p.stretch = o.stretch || 0;
    p.rot = o.rot ?? Math.random() * TAU; p.vrot = o.vrot || 0; p.follow = o.follow || null;
    if (p.follow) { p.fx = p.x - p.follow.x; p.fy = p.y - p.follow.y; p.fz = p.z - p.follow.z; }
    return p;
  }
  clear() { this.n = 0; this.geo.instanceCount = 0; }
  update(dt) {
    const P = this.aPos.array, C = this.aCol.array, D = this.aDat.array, Vv = this.aVel.array;
    let i = 0;
    while (i < this.n) {
      const p = this.p[i];
      p.life += dt;
      if (p.life >= p.max) { this.n--; this.p[i] = this.p[this.n]; this.p[this.n] = p; continue; }
      const k = Math.exp(-p.drag * dt);
      p.vx *= k; p.vy = p.vy * k - p.grav * dt; p.vz *= k;
      if (p.follow) { p.fx += p.vx * dt; p.fy += p.vy * dt; p.fz += p.vz * dt; p.x = p.follow.x + p.fx; p.y = p.follow.y + p.fy; p.z = p.follow.z + p.fz; }
      else { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
      p.rot += p.vrot * dt;
      const t = p.life / p.max;
      P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z;
      C[i * 4] = p.r; C[i * 4 + 1] = p.g; C[i * 4 + 2] = p.b; C[i * 4 + 3] = lerp(p.a0, p.a1, t) * (t < 0.08 ? t / 0.08 : 1);
      D[i * 4] = lerp(p.s0, p.s1, t); D[i * 4 + 1] = p.stretch; D[i * 4 + 2] = p.rot; D[i * 4 + 3] = p.type;
      Vv[i * 3] = p.vx; Vv[i * 3 + 1] = p.vy; Vv[i * 3 + 2] = p.vz;
      i++;
    }
    this.geo.instanceCount = this.n;
    for (const a of [this.aPos, this.aCol, this.aDat, this.aVel]) { a.clearUpdateRanges(); a.addUpdateRange(0, Math.max(1, this.n) * a.itemSize); a.needsUpdate = true; }
  }
}

class Trail {
  constructor(n, width, color, additive = true) {
    this.n = n; this.width = width; this.pts = []; for (let i = 0; i < n; i++) this.pts.push(new THREE.Vector3());
    this.count = 0; this.active = false; this.minDist = 0.15;
    const g = this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 2 * 3); this.tv = new Float32Array(n * 2 * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aT', new THREE.BufferAttribute(this.tv, 2).setUsage(THREE.DynamicDrawUsage));
    const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    this.u = { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      vertexShader: /* glsl */`attribute vec2 aT; varying vec2 vT; varying float vD; void main() { vT = aT; vD = distance(position, cameraPosition); gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uOpacity; varying vec2 vT; varying float vD;
        void main() { float e = 1.0 - abs(vT.y * 2.0 - 1.0); float a = pow(1.0 - vT.x, 1.6) * smoothstep(0.0, 0.6, e) * uOpacity * smoothstep(1.5, 9.0, vD); gl_FragColor = vec4(uColor * (1.0 + e * e * 1.5), a); }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 21; this.mesh.visible = false;
  }
  reset() { this.count = 0; this.mesh.visible = false; }
  push(p) {
    if (this.count > 0 && this.pts[0].distanceToSquared(p) < this.minDist * this.minDist) { this.pts[0].copy(p); return; }
    const last = this.pts.pop(); last.copy(p); this.pts.unshift(last);
    this.count = Math.min(this.n, this.count + 1);
  }
  update(cam) {
    const c = this.count;
    this.mesh.visible = this.active && c > 1;
    if (!this.mesh.visible) return;
    for (let i = 0; i < this.n; i++) {
      const k = Math.min(i, c - 1), p = this.pts[k];
      const a = this.pts[Math.max(0, k - 1)], b = this.pts[Math.min(c - 1, k + 1)];
      _v1.subVectors(a, b); if (_v1.lengthSq() < 1e-8) _v1.set(0, 0, 1);
      _v2.subVectors(cam, p);
      _v3.crossVectors(_v1, _v2).normalize().multiplyScalar(this.width * (1 - k / Math.max(c, 2)) * 0.5);
      this.pos[i * 6] = p.x + _v3.x; this.pos[i * 6 + 1] = p.y + _v3.y; this.pos[i * 6 + 2] = p.z + _v3.z;
      this.pos[i * 6 + 3] = p.x - _v3.x; this.pos[i * 6 + 4] = p.y - _v3.y; this.pos[i * 6 + 5] = p.z - _v3.z;
      const t = k / Math.max(c - 1, 1);
      this.tv[i * 4] = t; this.tv[i * 4 + 1] = 0; this.tv[i * 4 + 2] = t; this.tv[i * 4 + 3] = 1;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aT.needsUpdate = true;
  }
}

const FX = {
  init() {
    this.add = new Particles(2400, true);
    this.alpha = new Particles(1400, false);
    Render.scene.add(this.add.mesh, this.alpha.mesh);
    this.trails = [];
    this.speedT = 0;
  },
  trail(width, color, n = 40) { const t = new Trail(n, width, color); this.trails.push(t); Render.scene.add(t.mesh); return t; },
  update(dt) {
    this.add.update(dt); this.alpha.update(dt);
    const cam = Render.camera.position;
    for (const t of this.trails) t.update(cam);
  },
  clear() { this.add.clear(); this.alpha.clear(); for (const t of this.trails) t.reset(); },
  sparks(pos, color, n = 30, speed = 14, opt = {}) {
    for (let i = 0; i < n; i++) {
      _v1.randomDirection().multiplyScalar(speed * rnd(0.3, 1));
      if (opt.dir) _v1.addScaledVector(opt.dir, speed * 0.6);
      this.add.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: _v1.x, vy: _v1.y, vz: _v1.z, life: rnd(0.4, 1.1) * (opt.life || 1), s0: rnd(0.08, 0.2) * (opt.size || 1), s1: 0.02, r: color.r, g: color.g, b: color.b, a0: 1, a1: 0, drag: 2.2, grav: opt.grav ?? 6, type: 0, stretch: 0.06 });
    }
  },
  ring(pos, color, size, life = 0.7, a0 = 1) { this.add.spawn({ x: pos.x, y: pos.y, z: pos.z, life, s0: size * 0.15, s1: size, r: color.r, g: color.g, b: color.b, a0, a1: 0, type: 1, rot: 0 }); },
  glow(pos, color, size, life = 0.3, a0 = 1) { this.add.spawn({ x: pos.x, y: pos.y, z: pos.z, life, s0: size, s1: size * 1.6, r: color.r, g: color.g, b: color.b, a0, a1: 0, type: 0 }); },
  star(pos, color, size, life = 0.5) { this.add.spawn({ x: pos.x, y: pos.y, z: pos.z, life, s0: size, s1: size * 0.2, r: color.r, g: color.g, b: color.b, a0: 1, a1: 0, type: 2, vrot: 3 }); },
  smoke(pos, color, size = 1, n = 6, opt = {}) {
    for (let i = 0; i < n; i++) {
      _v1.randomDirection().multiplyScalar(rnd(0.5, 2.5) * (opt.speed || 1));
      this.alpha.spawn({ x: pos.x + _v1.x * 0.2, y: pos.y + _v1.y * 0.2, z: pos.z + _v1.z * 0.2, vx: _v1.x, vy: _v1.y + (opt.rise || 0.6), vz: _v1.z, life: rnd(0.8, 1.6) * (opt.life || 1), s0: size * rnd(0.5, 0.9), s1: size * rnd(1.6, 2.6), r: color.r, g: color.g, b: color.b, a0: opt.a ?? 0.45, a1: 0, drag: 1.4, type: 4, vrot: rnd(-1, 1) });
    }
  },
  confetti(pos, colors, n = 80, spread = 10) {
    for (let i = 0; i < n; i++) {
      const c = colors[i % colors.length];
      this.alpha.spawn({ x: pos.x + rnd(-spread, spread), y: pos.y + rnd(0, 4), z: pos.z + rnd(-spread, spread), vx: rnd(-3, 3), vy: rnd(2, 9), vz: rnd(-3, 3), life: rnd(2.5, 4.5), s0: 0.22, s1: 0.22, r: c.r, g: c.g, b: c.b, a0: 1, a1: 0.6, drag: 1.6, grav: 2.2, type: 3, vrot: rnd(-12, 12) });
    }
  },
  firework(pos, color) {
    const c2 = color.clone().lerp(new THREE.Color(1, 1, 1), 0.4);
    for (let i = 0; i < 90; i++) {
      _v1.randomDirection().multiplyScalar(rnd(12, 22));
      const c = i % 3 ? color : c2;
      this.add.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: _v1.x, vy: _v1.y, vz: _v1.z, life: rnd(1.1, 1.9), s0: 0.45, s1: 0.06, r: c.r * 4, g: c.g * 4, b: c.b * 4, a0: 1, a1: 0, drag: 1.5, grav: 4.5, type: 0, stretch: 0.08 });
    }
    this.glow(pos, color.clone().multiplyScalar(2.5), 9, 0.3);
    Sound.play('firework', { vol: 0.6 });
  },
  shockwave(pos, color, size = 16) {
    this.ring(pos, color.clone().multiplyScalar(0.6), size, 0.8, 0.9);
    this.ring(pos, color.clone().multiplyScalar(0.3), size * 1.6, 1.1, 0.6);
    this.glow(pos, color.clone().multiplyScalar(0.45), size * 0.22, 0.35, 0.8);
  },
  speedLines(cam, vel, speed, dt, amount) {
    this.speedT += dt * amount * 90;
    while (this.speedT > 1) {
      this.speedT -= 1;
      const f = _v4.copy(vel).normalize();
      _v5.randomDirection(); _v5.addScaledVector(f, -_v5.dot(f)).normalize().multiplyScalar(rnd(1.6, 5));
      const p = _v6.copy(cam).addScaledVector(f, rnd(10, 22)).add(_v5);
      this.add.spawn({ x: p.x, y: p.y, z: p.z, vx: -vel.x * 0.6, vy: -vel.y * 0.6, vz: -vel.z * 0.6, life: 0.45, s0: 0.03, s1: 0.03, r: 0.9, g: 0.95, b: 1.0, a0: 0.35 * amount, a1: 0, type: 0, stretch: 0.12 });
    }
  },
};
