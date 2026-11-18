// Terrain meshes + painted ground overlay, fjord water, waterfall & stream, sky dome, lighting presets.
import * as THREE from 'three';
import { heightAt, STREAM, FALLS, waterSDF } from './terrain.js';
import { clamp, smoothstep, lerp, fbm, RNG, catmull } from './util.js';
import { stdMat, U, GLSL_NOISE, MAXL } from './materials.js';

export const INNER = { x0: -800, z0: -700, x1: 800, z1: 900 };

function terrainColor(x, z, h, slope, out) {
  // returns linear rgb
  const n = fbm(x * 0.03, z * 0.03, 3) * 0.5 + 0.5;
  let r, g, b;
  if (h < -0.5) { r = 0.11; g = 0.1; b = 0.08; }
  else if (h < 3.6 && slope < 0.4) { const t = smoothstep(-0.5, 2.0, h); r = lerp(0.2, 0.46, t); g = lerp(0.17, 0.39, t); b = lerp(0.12, 0.27, t); const u = smoothstep(2.6, 3.6, h); r = lerp(r, 0.1, u); g = lerp(g, 0.17, u); b = lerp(b, 0.06, u); }
  else {
    // grass -> heath -> rock -> scree
    const gr = [0.07 + n * 0.05, 0.14 + n * 0.07, 0.04];
    const heath = [0.13, 0.13, 0.06];
    const rock = [0.13 + n * 0.07, 0.13 + n * 0.07, 0.135 + n * 0.06];
    const th = smoothstep(160, 380, h + n * 80);
    r = lerp(gr[0], heath[0], th); g = lerp(gr[1], heath[1], th); b = lerp(gr[2], heath[2], th);
    const tr = smoothstep(1.0, 1.7, slope + (n - 0.5) * 0.5);
    r = lerp(r, rock[0], tr); g = lerp(g, rock[1], tr); b = lerp(b, rock[2], tr);
  }
  out[0] = r; out[1] = g; out[2] = b;
}

function makeTerrainGeom(x0, z0, x1, z1, nx, nz, lowerInside) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2);
  g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = g.attributes.position; const cols = new Float32Array(p.count * 3); const c = [0, 0, 0];
  const H = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); H[i] = heightAt(x, z); }
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); let h = H[i];
    const e = (x1 - x0) / nx;
    const hx = heightAt(x + e, z), hz = heightAt(x, z + e);
    const slope = Math.hypot(hx - h, hz - h) / e;
    terrainColor(x, z, h, slope, c);
    if (lowerInside && x > INNER.x0 + 30 && x < INNER.x1 - 30 && z > INNER.z0 + 30 && z < INNER.z1 - 30) h -= 12;
    p.setY(i, h);
    cols[i * 3] = c[0]; cols[i * 3 + 1] = c[1]; cols[i * 3 + 2] = c[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

export function paintOverlay(L, grid) {
  const N = 2048, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  const W = INNER.x1 - INNER.x0, Hh = INNER.z1 - INNER.z0;
  const px = (x) => (x - INNER.x0) / W * N, pz = (z) => (z - INNER.z0) / Hh * N, s = N / W;
  g.clearRect(0, 0, N, N);
  const rng = new RNG(99);
  const blob = (x, z, r, colr, a) => { const gr = g.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), r * s); gr.addColorStop(0, colr.replace('A', a)); gr.addColorStop(1, colr.replace('A', 0)); g.fillStyle = gr; g.beginPath(); g.arc(px(x), pz(z), r * s, 0, 7); g.fill(); };
  // fields: strip farming
  for (const f of L.fields) {
    g.save(); g.translate(px((f.x0 + f.x1) / 2), pz((f.z0 + f.z1) / 2)); g.rotate(f.rot);
    const w = (f.x1 - f.x0) * s, h = (f.z1 - f.z0) * s;
    const strips = 7;
    for (let i = 0; i < strips; i++) {
      const kind = rng.int(0, 2);
      g.fillStyle = ['rgba(176,150,70,0.92)', 'rgba(110,128,52,0.9)', 'rgba(92,66,40,0.92)'][kind];
      g.fillRect(-w / 2, -h / 2 + i * h / strips, w, h / strips - 2);
      g.strokeStyle = kind === 2 ? 'rgba(60,42,26,0.6)' : 'rgba(120,100,50,0.35)'; g.lineWidth = 1;
      for (let k = 0; k < w; k += 3) { g.beginPath(); g.moveTo(-w / 2 + k, -h / 2 + i * h / strips); g.lineTo(-w / 2 + k, -h / 2 + (i + 1) * h / strips - 2); g.stroke(); }
    }
    g.restore();
  }
  // yards around buildings
  for (const b of L.B) blob(b.door[0], b.door[1], b.kind === 'hall' ? 30 : Math.max(8, b.len * 0.55), 'rgba(92,72,48,A)', 0.75);
  // pens: trampled mud
  for (const p of L.pens) blob(p.x, p.z, p.r * 1.05, p.kind === 'pig' ? 'rgba(52,38,24,A)' : 'rgba(86,74,46,A)', p.kind === 'pig' ? 0.95 : 0.55);
  // roads
  for (const r of L.roads) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [w, a] of [[r.w * 2.0, 0.35], [r.w * 1.25, 0.8], [r.w * 0.7, 0.9]]) {
      g.strokeStyle = r.kind === 'beach' ? `rgba(110,92,66,${a * 0.6})` : `rgba(96,76,52,${a})`; g.lineWidth = w * s;
      g.beginPath(); r.pts.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z)))); g.stroke();
    }
    // wheel ruts
    g.strokeStyle = 'rgba(60,46,32,0.5)'; g.lineWidth = 0.35 * s;
    for (const o of [-0.7, 0.7]) { g.beginPath(); r.pts.forEach(([x, z], i) => { const xx = px(x + o), zz = pz(z + o * 0.3); i ? g.lineTo(xx, zz) : g.moveTo(xx, zz); }); g.stroke(); }
  }
  // feast beach, shipyard, forge soot, ring, pyre, woodlot, godswood
  const S = L.S;
  blob(S.feast[0], S.feast[1] + 5, 75, 'rgba(118,98,70,A)', 0.55);
  blob(S.shipyard[0], S.shipyard[1] - 6, 22, 'rgba(160,128,84,A)', 0.85);
  blob(S.woodlot[0] + 6, S.woodlot[1] + 3, 16, 'rgba(150,120,78,A)', 0.8);
  blob(S.forge[0] + 8, S.forge[1] + 6, 12, 'rgba(30,26,22,A)', 0.85);
  blob(S.ring[0], S.ring[1], 6.4, 'rgba(150,128,96,A)', 0.95);
  blob(S.pyre[0], S.pyre[1], 7, 'rgba(40,34,28,A)', 0.8);
  blob(S.godswood[0], S.godswood[1] + 4, 24, 'rgba(58,50,30,A)', 0.6);
  blob(S.thing[0], S.thing[1], 15, 'rgba(96,110,58,A)', 0.5);
  blob(S.practice[0] + 6, S.practice[1], 26, 'rgba(110,98,62,A)', 0.55);
  // stream bed pebbles
  g.strokeStyle = 'rgba(70,70,64,0.85)'; g.lineWidth = 6 * s; g.beginPath(); STREAM.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z)))); g.stroke();
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export function buildTerrain(L, grid) {
  const inner = makeTerrainGeom(INNER.x0, INNER.z0, INNER.x1, INNER.z1, 400, 400, false);
  const outer = makeTerrainGeom(-3200, -5200, 3200, 2600, 220, 260, true);
  U.uOverlay.value = paintOverlay(L, grid);
  U.uOvBounds.value.set(INNER.x0, INNER.z0, INNER.x1 - INNER.x0, INNER.z1 - INNER.z0);
  const mat = stdMat({ snow: true, overlay: true, wet: true, peaks: true, rock: true }, { roughness: 0.95 });
  const matO = stdMat({ snow: true, peaks: true, rock: true }, { roughness: 0.97 });
  const m1 = new THREE.Mesh(inner, mat); m1.receiveShadow = true; m1.castShadow = true;
  const m2 = new THREE.Mesh(outer, matO); m2.receiveShadow = true;
  return [m1, m2];
}

// ---------------------------------------------------------------- water
export const WU = {
  uSea: { value: 0.35 }, uFogCol: { value: new THREE.Color() }, uFogD: { value: 0.0002 },
  uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uDepth: { value: null },
  uWake: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uNW: { value: 0 },
  uDBounds: { value: new THREE.Vector4(INNER.x0, INNER.z0, INNER.x1 - INNER.x0, INNER.z1 - INNER.z0) },
};
export function waveH(x, z, t, sea, wind) {
  const a = 0.15 + sea * 0.9;
  return a * (0.5 * Math.sin(x * 0.05 * wind[0] + z * 0.05 * wind[1] + t * 0.9) + 0.3 * Math.sin(x * 0.11 - z * 0.07 + t * 1.4) + 0.2 * Math.sin(-x * 0.03 + z * 0.13 + t * 1.1));
}
export function buildWater(grid) {
  // depth texture over the inner region
  const N = 512, data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = INNER.x0 + (i + 0.5) / N * (INNER.x1 - INNER.x0), z = INNER.z0 + (j + 0.5) / N * (INNER.z1 - INNER.z0);
    const h = grid.get(x, z);
    const d = clamp((-h + 4) / 40, 0, 1);
    data[(j * N + i) * 4] = d * 255; data[(j * N + i) * 4 + 3] = 255;
  }
  const dt = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); dt.needsUpdate = true; dt.magFilter = THREE.LinearFilter; dt.minFilter = THREE.LinearFilter;
  WU.uDepth.value = dt;
  const geo = new THREE.PlaneGeometry(6400, 7800, 260, 300); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -1300);
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, U, WU),
    transparent: false,
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uSea; uniform vec2 uWind; uniform float uTide;
      varying vec3 vW; varying float vH;
      void main(){
        vec3 p = position; float a = 0.15 + uSea * 0.9;
        float h = a * (0.5 * sin(p.x*0.05*uWind.x + p.z*0.05*uWind.y + uTime*0.9) + 0.3*sin(p.x*0.11 - p.z*0.07 + uTime*1.4) + 0.2*sin(-p.x*0.03 + p.z*0.13 + uTime*1.1));
        p.y = uTide + h; vH = h;
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uSea; uniform vec2 uWind; uniform float uTide; uniform float uDark;
      uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uFogCol; uniform float uFogD;
      uniform sampler2D uDepth; uniform vec4 uDBounds;
      uniform vec4 uLP[${MAXL}]; uniform vec3 uLC[${MAXL}]; uniform int uNL;
      uniform vec4 uWake[16]; uniform int uNW;
      varying vec3 vW; varying float vH;
      ${GLSL_NOISE}
      void main(){
        vec2 p = vW.xz; vec2 wd = normalize(uWind + 1e-4); vec2 wp = vec2(dot(p, wd), dot(p, vec2(-wd.y, wd.x)));
        float t = uTime;
        // analytic swell slope
        float a = 0.15 + uSea * 0.9;
        float dx = a * (0.5*0.05*uWind.x*cos(p.x*0.05*uWind.x + p.y*0.05*uWind.y + t*0.9) + 0.3*0.11*cos(p.x*0.11 - p.y*0.07 + t*1.4) - 0.2*0.03*cos(-p.x*0.03 + p.y*0.13 + t*1.1));
        float dz = a * (0.5*0.05*uWind.y*cos(p.x*0.05*uWind.x + p.y*0.05*uWind.y + t*0.9) - 0.3*0.07*cos(p.x*0.11 - p.y*0.07 + t*1.4) + 0.2*0.13*cos(-p.x*0.03 + p.y*0.13 + t*1.1));
        // wind-combed streaks: noise stretched along the wind
        float comb = kFbm(vec2(wp.x * 0.012 - t * 0.05, wp.y * 0.09));
        float gust = smoothstep(0.35, 0.8, comb) * (0.4 + uSea);
        vec2 rp = p * 0.35 + wd * t * 0.8;
        float r1 = kNoise(rp + vec2(t*0.3, 0.)), r2 = kNoise(rp * 2.3 - vec2(0., t*0.5)), r3 = kNoise(p * 1.6 + wd * t * 1.6);
        vec2 rip = (vec2(r1 - 0.5, r2 - 0.5) * 0.35 + vec2(r3 - 0.5) * 0.25) * (0.25 + gust * 0.9 + uSea * 0.5);
        vec3 N = normalize(vec3(-dx + rip.x, 1.0, -dz + rip.y));
        vec3 V = normalize(cameraPosition - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        vec3 sky = mix(uHor, uZen, smoothstep(0.0, 0.5, R.y));
        // the fjord walls darken the reflection close to shore
        vec2 duv = (vW.xz - uDBounds.xy) / uDBounds.zw;
        float depth = 40.0; bool inD = duv.x > 0. && duv.y > 0. && duv.x < 1. && duv.y < 1.;
        if (inD) depth = texture2D(uDepth, duv).r * 40.0 - 4.0 + uTide;
        float wall = smoothstep(0.02, 0.25, R.y);
        sky *= mix(0.18, 0.62, wall);
        vec3 deep = mix(vec3(0.004, 0.009, 0.012), vec3(0.02, 0.045, 0.045), smoothstep(30.0, 2.0, depth));
        deep = mix(deep, vec3(0.13, 0.12, 0.09), smoothstep(2.5, 0.2, depth) * 0.6);
        vec3 col = mix(deep, sky, fres);
        // sun glitter — the silver comb
        float sp = pow(max(dot(R, uSun), 0.0), 400.0) * 3.0 + pow(max(dot(R, uSun), 0.0), 40.0) * 0.12;
        col += uSunCol * sp * (0.35 + gust * 0.8) * smoothstep(-0.05, 0.05, uSun.y);
        col += vec3(0.07, 0.08, 0.09) * gust * 0.22 * (1.0 - uDark * 0.8);
        // firelight on black water: long broken columns
        vec3 fl = vec3(0.);
        for (int i = 0; i < ${MAXL}; i++) {
          if (i >= uNL) break;
          vec3 d = uLP[i].xyz - vW; float d2 = dot(d, d); vec3 L = d * inversesqrt(d2);
          float rr = uLP[i].w;
          float s1 = pow(max(dot(R, L), 0.0), 160.0) * 1.1 + pow(max(dot(R, L), 0.0), 18.0) * 0.035;
          fl += uLC[i] * s1 / (1.0 + d2 / (rr * rr * 80.0));
          fl += uLC[i] * 0.06 / (1.0 + d2 / (rr * rr * 0.5));
        }
        col += fl;
        // shore foam + ship wakes
        float foam = 0.0;
        if (inD) {
          float sh = smoothstep(0.7 + uSea * 0.6, 0.0, depth);
          foam += sh * smoothstep(0.45, 0.75, kNoise(p * 0.7 + t * 0.4) + sin(depth * 6.0 - t * 2.2) * 0.25);
        }
        for (int i = 0; i < 16; i++) {
          if (i >= uNW) break;
          vec4 w = uWake[i]; vec2 dd = p - w.xy; float c = cos(w.z), s = sin(w.z);
          float fwd = dd.x * s + dd.y * c; float side = dd.x * c - dd.y * s;
          float behind = -fwd - 8.0;
          float v = smoothstep(0.0, 6.0, behind) * smoothstep(90.0, 0.0, behind);
          float arm = abs(abs(side) - behind * 0.33);
          foam += v * smoothstep(1.6, 0.0, arm) * w.w * 0.6 * kNoise(p * 0.9 - t);
          foam += v * smoothstep(2.4, 0.0, abs(side)) * w.w * 0.5 * kNoise(p * 1.2 + t) * smoothstep(60.0, 0.0, behind);
          float bow = smoothstep(14.0, 10.0, length(vec2(side * 1.8, fwd - 6.0)));
          foam += bow * w.w * 0.8 * kNoise(p * 2.0 + t * 2.0);
        }
        foam += gust * smoothstep(0.7, 0.95, kNoise(p * 0.5 + wd * t)) * uSea * 0.6;
        col = mix(col, vec3(0.62, 0.65, 0.64) * (0.2 + 0.8 * uSunCol * (1.0 - uDark * 0.88)), clamp(foam, 0.0, 0.75));
        float fd = length(cameraPosition - vW);
        float ff = 1.0 - exp(-uFogD * uFogD * fd * fd);
        col = mix(col, uFogCol, clamp(ff, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

// waterfall + stream ribbons
export function buildFalls(grid) {
  const group = new THREE.Group();
  // find a line up the east wall away from the water
  const base = [FALLS.x, FALLS.z];
  const dir = [0.85, 0.35]; const l = Math.hypot(...dir); dir[0] /= l; dir[1] /= l;
  // walk inland until we're well up the cliff
  let bx = base[0], bz = base[1];
  while (waterSDF(bx, bz) < -2) { bx += dir[0] * 2; bz += dir[1] * 2; }
  bx -= dir[0] * 4; bz -= dir[1] * 4;
  const pts = []; let topY = 0;
  for (let d = 0; d <= 220; d += 4) { const x = bx + dir[0] * d, z = bz + dir[1] * d; const h = heightAt(x, z); pts.push([x, Math.max(h, 0) + 0.6, z]); topY = h; if (h > 230) break; }
  const W = 9;
  const pos = [], uv = [], idx = [];
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, y, z] = pts[i];
    if (i) acc += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1], z - pts[i - 1][2]);
    const w = W * (0.6 + 0.4 * (i / pts.length));
    pos.push(x - dir[1] * w, y + 1.0, z + dir[0] * w, x + dir[1] * w, y + 1.0, z - dir[0] * w);
    uv.push(0, acc, 1, acc);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const fallMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, U, WU), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uSunCol; uniform float uDark; uniform vec3 uFogCol; uniform float uFogD; varying vec2 vUv; varying vec3 vW; ${GLSL_NOISE}
      void main(){ float n = kFbm(vec2(vUv.x * 6.0, vUv.y * 0.12 + uTime * 1.6)); float n2 = kNoise(vec2(vUv.x * 18.0, vUv.y * 0.4 + uTime * 3.0));
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        float a = edge * (0.45 + 0.5 * n) * (0.6 + 0.4 * n2);
        vec3 c = mix(vec3(0.7,0.76,0.8), vec3(1.0), n2) * (0.3 + 0.7 * (1.0 - uDark * 0.85)) * (0.75 + 0.35*uSunCol);
        float fd = length(cameraPosition - vW); c = mix(c, uFogCol, clamp(1.0 - exp(-uFogD*uFogD*fd*fd), 0., 1.));
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  });
  group.add(new THREE.Mesh(g, fallMat));
  // stream through the village
  const sp = catmull(STREAM, 6); const sPos = [], sUv = [], sIdx = []; let sAcc = 0;
  for (let i = 0; i < sp.length; i++) {
    const [x, z] = sp[i]; const nx = sp[Math.min(i + 1, sp.length - 1)], px = sp[Math.max(i - 1, 0)];
    const tx = nx[0] - px[0], tz = nx[1] - px[1], tl = Math.hypot(tx, tz) || 1;
    const y = Math.max(grid.get(x, z) + 0.45, 0.2);
    if (i) sAcc += Math.hypot(x - sp[i - 1][0], z - sp[i - 1][1]);
    sPos.push(x - tz / tl * 2.4, y, z + tx / tl * 2.4, x + tz / tl * 2.4, y, z - tx / tl * 2.4); sUv.push(0, sAcc, 1, sAcc);
    if (i) { const a = (i - 1) * 2; sIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(sUv, 2)); sg.setIndex(sIdx);
  const sMat = fallMat.clone(); sMat.uniforms = fallMat.uniforms;
  sMat.fragmentShader = sMat.fragmentShader.replace('uTime * 1.6', 'uTime * -0.35').replace('uTime * 3.0', 'uTime * -0.7').replace('vUv.y * 0.12', 'vUv.y * 0.25');
  group.add(new THREE.Mesh(sg, sMat));
  const mistAt = [pts[1][0], 2, pts[1][2]];
  const fallTop = pts[pts.length - 1];
  return { group, mistAt, fallTop, fallPts: pts };
}

// ---------------------------------------------------------------- sky
export function buildSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uZen: WU.uZen, uHor: WU.uHor, uSun: U.uSun, uSunCol: U.uSunCol, uDark: U.uDark, uTime: U.uTime, uGlow: { value: new THREE.Color(1, 0.5, 0.2) } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uGlow; uniform float uDark; uniform float uTime; varying vec3 vD;
      ${GLSL_NOISE}
      void main(){ vec3 d = normalize(vD); float h = d.y;
        vec3 c = mix(uHor, uZen, smoothstep(-0.02, 0.45, h));
        float sd = max(dot(d, normalize(uSun)), 0.0);
        c += uGlow * pow(sd, 6.0) * 0.55 * (1.0 - smoothstep(0.0, 0.5, h));
        c += uSunCol * pow(sd, 900.0) * 30.0 * smoothstep(-0.03, 0.02, uSun.y);
        c += uSunCol * pow(sd, 60.0) * 0.6;
        // high cloud streaks
        vec2 cp = d.xz / max(h + 0.12, 0.05);
        float cl = smoothstep(0.55, 0.85, kFbm(cp * 1.4 + vec2(uTime * 0.004, 0.))) * smoothstep(0.0, 0.25, h);
        vec3 cc = mix(uHor * 1.25 + uGlow * 0.4, vec3(0.08,0.09,0.12), uDark * 0.8);
        c = mix(c, cc, cl * 0.6);
        // stars
        vec3 sp = floor(d * 380.0); float st = kHash(sp.xy + sp.z * 17.0);
        c += vec3(1.0, 0.95, 0.85) * step(0.9975, st) * uDark * smoothstep(0.05, 0.3, h) * (0.6 + 0.4 * sin(uTime * 3.0 + st * 100.0)) * (1.0 - cl);
        // aurora hint on the darkest nights
        float au = smoothstep(0.1, 0.35, h) * smoothstep(0.7, 0.3, h) * kFbm(vec2(d.x * 3.0 + uTime * 0.01, d.z * 0.8)) ;
        c += vec3(0.1, 0.5, 0.3) * au * uDark * uDark * 0.25;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), mat);
  m.frustumCulled = false; m.renderOrder = -10;
  return m;
}

// Light keyframes for the sun scrubber: dawn fog / clear noon / golden hour / dusk
const KEYS = [
  { t: 0.0, el: 6, az: 70, sun: [1.0, 0.66, 0.46], si: 1.8, sky: [0.66, 0.7, 0.78], gnd: [0.25, 0.23, 0.2], hi: 0.95, zen: [0.32, 0.42, 0.6], hor: [0.86, 0.72, 0.62], fog: [0.72, 0.68, 0.66], fd: 0.0019, exp: 1.0, dark: 0.15, glow: [1.0, 0.55, 0.35] },
  { t: 0.33, el: 52, az: 140, sun: [1.0, 0.96, 0.9], si: 3.2, sky: [0.55, 0.68, 0.9], gnd: [0.28, 0.25, 0.2], hi: 1.0, zen: [0.18, 0.36, 0.72], hor: [0.66, 0.76, 0.88], fog: [0.62, 0.7, 0.8], fd: 0.00018, exp: 0.95, dark: 0.0, glow: [0.6, 0.6, 0.6] },
  { t: 0.66, el: 15, az: 245, sun: [1.0, 0.66, 0.36], si: 3.0, sky: [0.62, 0.6, 0.7], gnd: [0.3, 0.22, 0.15], hi: 0.95, zen: [0.2, 0.28, 0.5], hor: [0.98, 0.62, 0.36], fog: [0.7, 0.55, 0.45], fd: 0.00026, exp: 1.05, dark: 0.25, glow: [1.0, 0.45, 0.15] },
  { t: 1.0, el: -7, az: 238, sun: [0.9, 0.4, 0.3], si: 0.25, sky: [0.2, 0.25, 0.42], gnd: [0.06, 0.05, 0.06], hi: 0.55, zen: [0.015, 0.025, 0.07], hor: [0.32, 0.18, 0.2], fog: [0.06, 0.06, 0.1], fd: 0.00045, exp: 1.25, dark: 1.0, glow: [0.85, 0.3, 0.12] },
];
export function lightAt(s) {
  s = clamp(s, 0, 1);
  let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].t < s) i++;
  const a = KEYS[i], b = KEYS[i + 1]; const t = smoothstep(a.t, b.t, s);
  const o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, j) => lerp(v, b[k][j], t)) : lerp(a[k], b[k], t);
  return o;
}
