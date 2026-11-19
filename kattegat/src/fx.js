// GPU particles (smoke, embers, sparks, mist, snow), billboard flames, gulls and ravens, dawn fog banks.
import * as THREE from 'three';
import { U, GLSL_NOISE } from './materials.js';
import { WU } from './env.js';
import { hash2, RNG, clamp, lerp } from './util.js';

function makePuff() {
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * N * 0.22, r = N * (0.12 + rnd() * 0.16);
    const x = N / 2 + Math.cos(a) * d, y = N / 2 + Math.sin(a) * d;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); const v = 200 + Math.floor(rnd() * 55);
    gr.addColorStop(0, `rgba(${v},${v},${v},0.32)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; return t;
}
export class Emitters {
  constructor() { this.list = []; }
  add(pos, kind, size = 1, n = 20) { const i = this.list.length; this.list.push({ pos, kind, size, n, s: 0, heat: 0 }); return i; }
}

export class FX {
  constructor(scene, E) {
    this.scene = scene; this.E = E;
    const nE = E.list.length; this.nE = nE;
    this.emData = new Uint8Array(nE * 4);
    this.emTex = new THREE.DataTexture(this.emData, nE, 1, THREE.RGBAFormat); this.emTex.needsUpdate = true;
    const common = { uEm: { value: this.emTex }, uEmN: { value: nE }, uSmoke: { value: 1 }, uPx: { value: 600 }, uPuff: { value: makePuff() } };
    this.common = common;
    // ---------------- smoke
    let total = 0; for (const e of E.list) total += e.n;
    const org = new Float32Array(total * 3), sd = new Float32Array(total * 4);
    let k = 0;
    E.list.forEach((e, ei) => { for (let j = 0; j < e.n; j++, k++) { org.set(e.pos, k * 3); sd.set([j / e.n + hash2(ei, j) * 0.05, (e.kind === 'pyre' ? 22 : e.kind === 'beacon' ? 18 : 18) * (0.8 + hash2(j, ei) * 0.4), e.size, ei], k * 4); } });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(org, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
    this.smoke = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, WU, common), transparent: true, depthWrite: false,
      vertexShader: `uniform sampler2D uEm; uniform float uEmN; uniform float uTime; uniform vec2 uWind; uniform float uSmoke; uniform float uPx;
        attribute vec4 aSeed; varying float vA; varying float vAge; varying float vHeat; varying vec3 vW; varying float vRot;
        ${GLSL_NOISE}
        void main(){
          vec4 em = texture2D(uEm, vec2((aSeed.w + 0.5) / uEmN, 0.5));
          float life = aSeed.y; float age = fract(uTime / life + aSeed.x);
          float on = step(kHash(vec2(aSeed.x * 91.0, aSeed.w)), em.r * uSmoke);
          float sz = aSeed.z * (1.0 + em.b * 2.0);
          vec3 p = position;
          float rise = age * life * (1.5 + em.g * 1.0) * (0.6 + sz * 0.25);
          vec2 drift = uWind * age * age * life * 1.6 * (0.6 + 0.4 * sz);
          p += vec3(drift.x, rise, drift.y);
          p.x += (kNoise(vec2(aSeed.x * 40.0, uTime * 0.3 + aSeed.w)) - 0.5) * age * 6.0 * sz;
          p.z += (kNoise(vec2(uTime * 0.3 + aSeed.w, aSeed.x * 40.0)) - 0.5) * age * 6.0 * sz;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = sz * (1.5 + age * 6.0);
          gl_PointSize = min(on * size * uPx / max(1.0, -mv.z), 420.0);
          vA = on * smoothstep(0.0, 0.12, age) * pow(1.0 - age, 1.4) * (0.12 + 0.13 * em.r) * smoothstep(18.0, 90.0, -mv.z);
          vRot = aSeed.x * 40.0 + age * (kHash(vec2(aSeed.x, 7.0)) - 0.5) * 3.0;
          vAge = age; vHeat = em.g; vW = p;
        }`,
      fragmentShader: `uniform vec3 uSunCol; uniform float uDark; uniform vec3 uFogCol; uniform float uFogD; uniform sampler2D uPuff; varying float vA; varying float vAge; varying float vHeat; varying vec3 vW; varying float vRot;
        ${GLSL_NOISE}
        void main(){ vec2 c = gl_PointCoord - 0.5; float cs = cos(vRot), sn = sin(vRot); vec2 uv = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs) + 0.5;
          vec4 pf = texture2D(uPuff, uv);
          float a = pf.a * vA * (1.0 - uDark * 0.4);
          if (a < 0.003) discard;
          vec3 base = mix(vec3(0.5, 0.48, 0.46), vec3(0.38, 0.39, 0.42), vAge) * (0.75 + 0.35 * pf.r) * mix(0.35 + 0.6 * uSunCol, vec3(0.05, 0.06, 0.09), uDark);
          base += vec3(1.0, 0.42, 0.12) * vHeat * pow(1.0 - vAge, 16.0) * 0.9 * (0.2 + uDark);
          float fd = length(cameraPosition - vW); base = mix(base, uFogCol, clamp(1.0 - exp(-uFogD*uFogD*fd*fd), 0., 1.));
          gl_FragColor = vec4(base, a);
          #include <colorspace_fragment>
        }`,
    }));
    this.smoke.frustumCulled = false; scene.add(this.smoke);
    // ---------------- embers & sparks (additive)
    const fireE = E.list.map((e, i) => [e, i]).filter(([e]) => e.kind !== 'house' && e.kind !== 'oven');
    let te = 0; for (const [e] of fireE) te += e.kind === 'pyre' ? 260 : e.kind === 'forge' ? 120 : e.kind === 'beacon' ? 90 : 50;
    const eo = new Float32Array(te * 3), es = new Float32Array(te * 4); k = 0;
    for (const [e, ei] of fireE) { const n = e.kind === 'pyre' ? 260 : e.kind === 'forge' ? 120 : e.kind === 'beacon' ? 90 : 50; for (let j = 0; j < n; j++, k++) { eo.set(e.pos, k * 3); es.set([hash2(j, ei * 3), (e.kind === 'forge' ? 1.1 : 3.5) * (0.6 + hash2(ei, j * 5) * 0.8), e.kind === 'forge' ? 2 : e.kind === 'pyre' ? 1.6 : 1, ei], k * 4); } }
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(eo, 3)); eg.setAttribute('aSeed', new THREE.BufferAttribute(es, 4));
    this.embers = new THREE.Points(eg, new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, WU, common), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform sampler2D uEm; uniform float uEmN; uniform float uTime; uniform vec2 uWind; uniform float uPx; attribute vec4 aSeed; varying float vA;
        ${GLSL_NOISE}
        void main(){ vec4 em = texture2D(uEm, vec2((aSeed.w + 0.5) / uEmN, 0.5));
          float life = aSeed.y; float age = fract(uTime / life + aSeed.x); vec3 p = position;
          float heat = em.g; float spark = step(1.5, aSeed.z);
          float on = step(kHash(vec2(aSeed.x * 33.0, aSeed.w + 1.0)), heat * (spark > 0.5 ? em.a : 1.0));
          // sparks burst out of the anvil, embers climb from the fires
          vec3 dir = vec3(kHash(vec2(aSeed.x, 1.0)) - 0.5, 0.6 + kHash(vec2(aSeed.x, 2.0)), kHash(vec2(aSeed.x, 3.0)) - 0.5);
          if (spark > 0.5) { p += dir * age * 4.5 - vec3(0., 4.9 * age * age, 0.); }
          else { p += vec3(0., age * life * 3.2 * aSeed.z, 0.) + vec3(uWind.x, 0., uWind.y) * age * life * 1.2; p.x += sin(uTime * 3.0 + aSeed.x * 50.0) * age * 1.5; p.z += cos(uTime * 2.6 + aSeed.x * 40.0) * age * 1.5; }
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = on * (spark > 0.5 ? 0.12 : 0.16) * uPx / max(1.0, -mv.z) * (1.0 - age * 0.5);
          vA = on * (1.0 - age) * (0.6 + 0.4 * sin(uTime * 20.0 + aSeed.x * 99.0)); }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(1.0, 0.55, 0.18) * vA * 2.5 * smoothstep(0.5, 0.0, d), 1.0); }`,
    }));
    this.embers.frustumCulled = false; scene.add(this.embers);
    // ---------------- flames (cylindrical billboards)
    const MAXF = 420; this.MAXF = MAXF;
    const qg = new THREE.InstancedBufferGeometry();
    qg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
    this.fData = new Float32Array(MAXF * 4); this.fAttr = new THREE.InstancedBufferAttribute(this.fData, 4); this.fAttr.setUsage(THREE.DynamicDrawUsage);
    qg.setAttribute('aF', this.fAttr); qg.instanceCount = 0;
    this.flames = new THREE.Mesh(qg, new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aF; uniform float uTime; uniform vec2 uWind; varying vec2 vUv; varying float vS; varying float vK;
        void main(){ vUv = position.xy; vS = aF.w; vK = fract(aF.x * 0.37 + aF.z * 0.11);
          vec3 right = normalize(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
          float w = aF.w * 0.7, h = aF.w * 1.6;
          vec3 p = aF.xyz + right * position.x * w + vec3(0., position.y * h, 0.);
          p.xz += uWind * position.y * position.y * h * 0.15;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float uTime; uniform float uDark; varying vec2 vUv; varying float vS; varying float vK;
        ${GLSL_NOISE}
        void main(){ vec2 uv = vUv; float n = kFbm(vec2(uv.x * 3.0 + vK * 10.0, uv.y * 2.2 - uTime * 2.6 - vK * 7.0));
          float shape = smoothstep(0.5, 0.0, abs(uv.x) * (1.0 + uv.y * 1.6)) * smoothstep(1.0, 0.25, uv.y + (n - 0.5) * 0.8) * smoothstep(0.0, 0.08, uv.y);
          float core = smoothstep(0.3, 0.0, abs(uv.x) * (1.0 + uv.y * 3.0)) * smoothstep(0.6, 0.0, uv.y + (n - 0.5) * 0.4);
          vec3 c = mix(vec3(0.9, 0.25, 0.04), vec3(1.0, 0.7, 0.25), core) + vec3(1.0, 0.9, 0.6) * core * core;
          float a = shape * (0.7 + 0.3 * uDark);
          gl_FragColor = vec4(c * a * 1.6, 1.0); }`,
    }));
    this.flames.frustumCulled = false; scene.add(this.flames);
    // ---------------- snow
    const NS = 26000; const sp = new Float32Array(NS * 3); const rr = new RNG(4);
    for (let i = 0; i < NS; i++) sp.set([rr.range(-120, 120), rr.range(0, 90), rr.range(-120, 120)], i * 3);
    const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.snow = new THREE.Points(sgeo, new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, common, { uCam: { value: new THREE.Vector3() }, uAmt: { value: 0 } }), transparent: true, depthWrite: false,
      vertexShader: `uniform float uTime; uniform vec2 uWind; uniform vec3 uCam; uniform float uAmt; uniform float uPx; varying float vA;
        void main(){ vec3 p = position; p.y = mod(p.y - uTime * 1.6, 90.0); p.xz += uWind * (90.0 - p.y) * 0.6 + vec2(sin(uTime + p.y), cos(uTime * 0.8 + p.x)) * 0.6;
          p.x = mod(p.x - uCam.x + 120.0, 240.0) - 120.0 + uCam.x; p.z = mod(p.z - uCam.z + 120.0, 240.0) - 120.0 + uCam.z; p.y += uCam.y - 45.0;
          float on = step(fract(position.x * 13.7 + position.z * 7.1), uAmt);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = on * 0.12 * uPx / max(1.0, -mv.z); vA = on; }`,
      fragmentShader: `uniform float uDark; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.92) * (1.0 - uDark * 0.7), vA * 0.85); }`,
    }));
    this.snow.frustumCulled = false; scene.add(this.snow);
    // ---------------- birds: gulls over the shore, ravens over the godswood and pyre
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, -0.9, 0.05, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0, 0, -0.2, 0.9, 0.05, -0.1, 0, 0, 0.35, -0.08, -0.05, -0.4, 0.08, -0.05, -0.4], 3));
    bg.computeVertexNormals();
    const birdMat = (color) => { const m = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }); m.onBeforeCompile = (sh) => { sh.uniforms.uTime = U.uTime; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float ph = uTime * 9.0 + float(gl_InstanceID) * 1.37; transformed.y += abs(position.x) * sin(ph) * 0.7;'); }; return m; };
    this.gulls = new THREE.InstancedMesh(bg, birdMat(0xe8e8e2), 140); this.gulls.frustumCulled = false; scene.add(this.gulls);
    this.ravens = new THREE.InstancedMesh(bg, birdMat(0x141418), 40); this.ravens.frustumCulled = false; scene.add(this.ravens);
    this.birds = [];
    const rb = new RNG(12);
    for (let i = 0; i < 140; i++) this.birds.push({ kind: 0, cx: rb.range(-200, 280), cz: rb.range(-150, 110), r: rb.range(10, 45), h: rb.range(8, 40), w: rb.range(0.2, 0.5) * (rb.chance(0.5) ? 1 : -1), ph: rb.range(0, 6.28), x: 0, y: 0, z: 0, scatter: 0 });
    for (let i = 0; i < 40; i++) this.birds.push({ kind: 1, cx: 0, cz: 0, r: rb.range(8, 30), h: rb.range(15, 45), w: rb.range(0.15, 0.35), ph: rb.range(0, 6.28), x: 0, y: 0, z: 0, home: i % 3 });
    // ---------------- dawn fog banks
    this.fogBanks = [];
    const fm = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, WU, { uAmt: { value: 0 } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uTime; uniform float uAmt; uniform vec3 uFogCol; uniform vec2 uWind; varying vec3 vW; ${GLSL_NOISE}
        void main(){ float n = kFbm(vW.xz * 0.004 + uWind * uTime * 0.004 + vW.y * 0.01); float a = smoothstep(0.35, 0.8, n) * uAmt;
          float fd = length(cameraPosition - vW); a *= smoothstep(10.0, 120.0, fd);
          gl_FragColor = vec4(uFogCol * 1.05, a * 0.55);
          #include <colorspace_fragment>
        }`,
    });
    this.fogMat = fm;
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2600, 3200), fm); m.rotation.x = -Math.PI / 2; m.position.set(0, 6 + i * 9, -900); m.renderOrder = 5; scene.add(m); this.fogBanks.push(m); }
    // ---------------- waterfall mist
    this.mistFor = null;
  }
  addMist(pts) {
    const n = 900; const p = new Float32Array(n * 3), s = new Float32Array(n * 4); const r = new RNG(8);
    for (let i = 0; i < n; i++) { const k = r.next() < 0.6 ? 0 : Math.floor(r.next() * pts.length); const q = pts[k]; p.set([q[0] + r.range(-6, 6), q[1], q[2] + r.range(-6, 6)], i * 3); s.set([r.next(), r.range(4, 9), k === 0 ? 3.2 : 1.6, 0], i * 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(s, 4));
    const m = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, WU, this.common), transparent: true, depthWrite: false,
      vertexShader: `uniform float uTime; uniform vec2 uWind; uniform float uPx; attribute vec4 aSeed; varying float vA;
        void main(){ float age = fract(uTime / aSeed.y + aSeed.x); vec3 p = position + vec3(uWind.x, 0.5, uWind.y) * age * 12.0 + vec3(0., -age * 4.0 * step(aSeed.z, 2.0), 0.);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(aSeed.z * (1.5 + age * 3.0) * uPx / max(1.0, -mv.z), 160.0); vA = (1.0 - age) * smoothstep(0.0, 0.15, age) * 0.09 * smoothstep(10.0, 60.0, -mv.z); }`,
      fragmentShader: `uniform vec3 uSunCol; uniform float uDark; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.85, 0.88, 0.9) * (0.3 + 0.7 * uSunCol) * (1.0 - uDark * 0.8), vA * smoothstep(0.5, 0.0, d));
        #include <colorspace_fragment>
      }`,
    }));
    m.frustumCulled = false; this.scene.add(m);
  }
  setEmitter(i, strength, heat, size, pulse = 0) { const d = this.emData; d[i * 4] = clamp(strength, 0, 1) * 255; d[i * 4 + 1] = clamp(heat, 0, 1) * 255; d[i * 4 + 2] = clamp(size, 0, 1) * 255; d[i * 4 + 3] = clamp(pulse, 0, 1) * 255; }
  commit() { this.emTex.needsUpdate = true; }
  setFlames(list) {
    const n = Math.min(list.length, this.MAXF);
    for (let i = 0; i < n; i++) this.fData.set(list[i], i * 4);
    this.flames.geometry.instanceCount = n; this.fAttr.needsUpdate = true;
  }
  updateBirds(t, dt, S, L, grid, scatterPts) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    let gi = 0, ri = 0;
    const homes = [L.S.godswood, L.S.pyre, L.S.hallDoor];
    for (const b of this.birds) {
      if (b.kind === 0) {
        // gulls scatter when a keel grinds in or a crowd rushes near their circle
        for (const p of scatterPts) if (Math.hypot(p[0] - b.cx, p[1] - b.cz) < 40 && b.scatter <= 0) { b.scatter = 6; b.cx += (b.cx - p[0]) * 1.5 + (hash2(b.ph * 100, t) - 0.5) * 80; b.cz += (b.cz - p[1]) * 0.8 - 30; b.h += 15; }
        if (b.scatter > 0) b.scatter -= dt; else { b.h = lerp(b.h, 14 + (b.ph % 1) * 20, dt * 0.05); }
        b.cx = clamp(b.cx, -300, 320); b.cz = clamp(b.cz, -320, 120);
      } else { const h = homes[b.home]; b.cx = h[0]; b.cz = h[1] + 6; }
      b.ph += b.w * dt * (b.scatter > 0 ? 3 : 1);
      const nx = b.cx + Math.cos(b.ph) * b.r, nz = b.cz + Math.sin(b.ph) * b.r;
      const gy = Math.max(0, grid.get(nx, nz));
      const ny = gy + b.h + Math.sin(b.ph * 3) * 2;
      const yaw = Math.atan2(nx - b.x, nz - b.z);
      b.x = lerp(b.x || nx, nx, Math.min(1, dt * 3)); b.y = lerp(b.y || ny, ny, Math.min(1, dt * 2)); b.z = lerp(b.z || nz, nz, Math.min(1, dt * 3));
      e.set(0, yaw, -Math.sign(b.w) * 0.3, 'YXZ'); q.setFromEuler(e); v.set(b.x, b.y, b.z);
      s.setScalar(b.kind === 0 ? 1.0 : 0.8);
      m.compose(v, q, s);
      if (b.kind === 0) this.gulls.setMatrixAt(gi++, m); else this.ravens.setMatrixAt(ri++, m);
    }
    this.gulls.instanceMatrix.needsUpdate = true; this.ravens.instanceMatrix.needsUpdate = true;
  }
}
