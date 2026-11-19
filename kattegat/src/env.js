// Terrain meshes + painted ground overlay, fjord water, waterfall & stream, sky dome, lighting presets.
import * as THREE from 'three';
import { heightAt, STREAM, FALLS, waterSDF, forestDensity, FJORD } from './terrain.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { clamp, smoothstep, lerp, fbm, RNG, catmull } from './util.js';
import { stdMat, U, GLSL_NOISE, MAXL } from './materials.js';
import { terrainMaterial, TU } from './terrainmat.js';

export const INNER = { x0: -800, z0: -700, x1: 800, z1: 900 };

function terrainSplat(x, z, h, slope, out) {
  // material weights per vertex: [sand, forest floor, gravel/scree, heath]; grass is the base, rock comes from the pixel normal
  const n = fbm(x * 0.03, z * 0.03, 3) * 0.5 + 0.5, n2 = fbm(x * 0.004 + 9, z * 0.004, 3) * 0.5 + 0.5;
  let sand = 0, forest = 0, gravel = 0, heath = 0;
  if (h < -0.4) sand = 1;
  else if (z < 122 - Math.abs(x) * 0.05 && z > 20 && Math.abs(x) < 330 && h < 9 && slope < 0.5) {
    // the landing beach runs up to the shore road
    sand = 1 - smoothstep(110 - Math.abs(x) * 0.05, 122 - Math.abs(x) * 0.05, z + (n - 0.5) * 6);
    gravel = smoothstep(-0.2, 0.6, h) * (1 - smoothstep(0.6, 1.4, h)) * 0.55 * smoothstep(0.45, 0.7, n);
  } else if (h < 3.4 && slope < 0.45) {
    // other shores: shingle at the waterline, sand above, turf from 3 m
    sand = 1 - smoothstep(2.2, 3.4, h + (n - 0.5) * 1.2);
    gravel = (1 - smoothstep(0.4, 1.6, h)) * smoothstep(0.35, 0.6, n2) * 0.9;
  } else {
    heath = smoothstep(220, 420, h + (n2 - 0.5) * 120);
    forest = forestDensity(x, z, h, slope);
    gravel = smoothstep(0.7, 1.05, slope + (n - 0.5) * 0.5) * (0.5 + 0.5 * n2);
  }
  out[0] = sand; out[1] = forest; out[2] = gravel; out[3] = heath;
}

function makeTerrainGeom(x0, z0, x1, z1, nx, nz, lowerInside) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2);
  g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = g.attributes.position; const cols = new Float32Array(p.count * 3), spl = new Float32Array(p.count * 4); const c = [0, 0, 0, 0];
  const H = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) H[i] = heightAt(p.getX(i), p.getZ(i));
  const e = (x1 - x0) / nx, W = nx + 1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); let h = H[i];
    const ix = i % W, iz = Math.floor(i / W);
    const at = (dx, dz) => H[Math.min(nz, Math.max(0, iz + dz)) * W + Math.min(nx, Math.max(0, ix + dx))];
    const slope = Math.hypot(at(1, 0) - h, at(0, 1) - h) / e;
    terrainSplat(x, z, h, slope, c);
    // cavity occlusion: gullies and valley floors darken, ridges and buttresses catch light
    let ao = 0;
    for (const r of [Math.max(1, Math.round(18 / e)), Math.max(2, Math.round(55 / e))]) {
      const avg = (at(r, 0) + at(-r, 0) + at(0, r) + at(0, -r) + at(r, r) + at(-r, -r) + at(r, -r) + at(-r, r)) / 8;
      ao += (avg - h) / (r * e);
    }
    const k = Math.min(1.12, Math.max(0.55, 1 - ao * 0.5)) * (0.92 + 0.16 * (fbm(x * 0.006 + 3, z * 0.006, 2) * 0.5 + 0.5));
    if (lowerInside && x > INNER.x0 + 30 && x < INNER.x1 - 30 && z > INNER.z0 + 30 && z < INNER.z1 - 30) h -= 12;
    p.setY(i, h);
    cols[i * 3] = k; cols[i * 3 + 1] = k; cols[i * 3 + 2] = k;
    spl.set(c, i * 4);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.setAttribute('aSplat', new THREE.BufferAttribute(spl, 4));
  g.computeVertexNormals();
  return g;
}

// Control map over the inner region, one material per channel: R trodden earth (roads, yards), G mud (pens, soot, ash),
// B field strips (value encodes the crop), A gravel (stream bed). Each channel is painted in grey on its own pass.
export function paintCtrl(L) {
  const N = 2048, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const W = INNER.x1 - INNER.x0, Hh = INNER.z1 - INNER.z0;
  const px = (x) => (x - INNER.x0) / W * N, pz = (z) => (z - INNER.z0) / Hh * N, s = N / W;
  const out = new Uint8Array(N * N * 4);
  const grey = (v, a) => `rgba(${v},${v},${v},${a})`;
  const blob = (x, z, r, a, v = 255) => { const gr = g.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), r * s); gr.addColorStop(0, grey(v, a)); gr.addColorStop(0.55, grey(v, a * 0.75)); gr.addColorStop(1, grey(v, 0)); g.fillStyle = gr; g.beginPath(); g.arc(px(x), pz(z), r * s, 0, 7); g.fill(); };
  const line = (pts, w, a, ox = 0, oz = 0) => { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = grey(255, a); g.lineWidth = w * s; g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(px(x + ox), pz(z + oz)) : g.moveTo(px(x + ox), pz(z + oz)))); g.stroke(); };
  const pass = (ch, paint) => {
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
    paint(); const d = g.getImageData(0, 0, N, N).data;
    for (let i = 0, j = ch; i < d.length; i += 4, j += 4) out[j] = d[i];
  };
  const S = L.S, rng = new RNG(99);
  pass(0, () => { // trodden earth
    for (const b of L.B) blob(b.door[0], b.door[1], b.kind === 'hall' ? 26 : Math.max(7, b.len * 0.5), 0.8);
    for (const r of L.roads) for (const [w, a] of [[r.w * 1.9, 0.3], [r.w * 1.2, 0.75], [r.w * 0.7, 0.95]]) line(r.pts, w, r.kind === 'beach' ? a * 0.55 : a);
    blob(S.feast[0], S.feast[1] + 5, 70, 0.35);
    blob(S.shipyard[0], S.shipyard[1] - 6, 22, 0.9);
    blob(S.woodlot[0] + 6, S.woodlot[1] + 3, 16, 0.85);
    blob(S.ring[0], S.ring[1], 6.4, 1);
    blob(S.thing[0], S.thing[1], 15, 0.45);
    blob(S.practice[0] + 6, S.practice[1], 26, 0.6);
    blob(S.godswood[0], S.godswood[1] + 4, 20, 0.3);
  });
  pass(1, () => { // mud, soot, ash, ruts
    for (const p of L.pens) blob(p.x, p.z, p.r * 1.05, p.kind === 'pig' ? 1 : 0.6);
    for (const r of L.roads) if (r.kind !== 'beach') for (const o of [-0.75, 0.75]) line(r.pts, 0.45, 0.55, o, o * 0.3);
    blob(S.forge[0] + 8, S.forge[1] + 6, 11, 0.9);
    blob(S.pyre[0], S.pyre[1], 7, 0.85);
    for (const b of L.B) if (rng.next() < 0.5) blob(b.door[0] + rng.range(-1, 1), b.door[1] + rng.range(-1, 1), 2.6, 0.7);
  });
  pass(2, () => { // field strips
    for (const f of L.fields) {
      g.save(); g.translate(px((f.x0 + f.x1) / 2), pz((f.z0 + f.z1) / 2)); g.rotate(f.rot);
      const w = (f.x1 - f.x0) * s, h = (f.z1 - f.z0) * s, strips = 7;
      for (let i = 0; i < strips; i++) {
        const v = [235, 174, 82][rng.int(0, 2)]; g.fillStyle = grey(v, 1);
        g.fillRect(-w / 2, -h / 2 + i * h / strips, w, h / strips - 1.5);
      }
      g.restore();
    }
  });
  pass(3, () => { // gravel
    line(STREAM, 6, 0.95); line(STREAM, 9, 0.35);
  });
  L.ctrlData = out; L.ctrlN = N;
  const tex = new THREE.DataTexture(out, N, N, THREE.RGBAFormat); tex.needsUpdate = true;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 8;
  return tex;
}

export function buildTerrain(L, grid, tex) {
  const inner = makeTerrainGeom(INNER.x0, INNER.z0, INNER.x1, INNER.z1, 400, 400, false);
  const outer = makeTerrainGeom(-3400, -5400, 3400, 2800, 300, 360, true);
  TU.uCtrl.value = paintCtrl(L);
  U.uOvBounds.value.set(INNER.x0, INNER.z0, INNER.x1 - INNER.x0, INNER.z1 - INNER.z0);
  const mat = terrainMaterial(tex);
  const m1 = new THREE.Mesh(inner, mat); m1.receiveShadow = true; m1.castShadow = true;
  const m2 = new THREE.Mesh(outer, mat); m2.receiveShadow = true;
  return [m1, m2];
}

// ---------------------------------------------------------------- water
export const WU = {
  uSea: { value: 0.35 }, uFogCol: { value: new THREE.Color() }, uFogD: { value: 0.0002 },
  uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uDepth: { value: null },
  uWake: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uNW: { value: 0 },
  uDBounds: { value: new THREE.Vector4(INNER.x0, INNER.z0, INNER.x1 - INNER.x0, INNER.z1 - INNER.z0) },
  uRefl: { value: null }, uRMat: { value: new THREE.Matrix4() }, uReflOn: { value: 0 },
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
      uniform float uTime; uniform float uSea; uniform vec2 uWind; uniform float uTide; uniform mat4 uRMat;
      varying vec3 vW; varying float vH; varying vec4 vRC;
      void main(){
        vec3 p = position; float a = 0.15 + uSea * 0.9;
        float h = a * (0.5 * sin(p.x*0.05*uWind.x + p.z*0.05*uWind.y + uTime*0.9) + 0.3*sin(p.x*0.11 - p.z*0.07 + uTime*1.4) + 0.2*sin(-p.x*0.03 + p.z*0.13 + uTime*1.1));
        p.y = uTide + h; vH = h;
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vRC = uRMat * vec4(w.x, uTide, w.z, 1.0);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uSea; uniform vec2 uWind; uniform float uTide; uniform float uDark;
      uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uFogCol; uniform float uFogD;
      uniform sampler2D uDepth; uniform vec4 uDBounds;
      uniform vec4 uLP[${MAXL}]; uniform vec3 uLC[${MAXL}]; uniform int uNL;
      uniform vec4 uWake[16]; uniform int uNW; uniform sampler2D uRefl; uniform float uReflOn;
      varying vec3 vW; varying float vH; varying vec4 vRC;
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
        float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
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
        // planar mirror of the fjord walls, broken up by the wind
        vec4 rc = vRC; rc.xy += (N.xz * (2.2 + gust * 3.0)) * rc.w * 0.012;
        vec3 mirror = textureProj(uRefl, rc).rgb;
        vec3 refl = mix(sky, mirror, uReflOn * (1.0 - gust * 0.35));
        fres = mix(fres, max(fres, 0.32), uReflOn);
        vec3 col = mix(deep, refl, fres);
        // sun glitter — the silver comb
        float sp = pow(max(dot(R, uSun), 0.0), 600.0) * 4.0 + pow(max(dot(R, uSun), 0.0), 60.0) * 0.1;
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

// waterfall: a real drop down the steepest cliff of the bay, plus the village stream
export function buildFalls(grid) {
  const group = new THREE.Group();
  // search the bay rim for the steepest wall
  let best = null;
  for (let a = -0.2; a < 1.9; a += 0.02) {
    const dx = Math.cos(a), dz = -Math.sin(a) * 0.4 + Math.sin(a) * 0.0;
    const dir = [Math.cos(a * 1.4 - 0.2), -Math.sin(a * 1.4 - 0.2)];
    let x = FJORD[0][0], z = FJORD[0][1];
    let k = 0; while (waterSDF(x, z) < 0 && k++ < 400) { x += dir[0] * 2; z += dir[1] * 2; }
    if (z > 30) continue;
    const h1 = heightAt(x + dir[0] * 25, z + dir[1] * 25), h2 = heightAt(x + dir[0] * 60, z + dir[1] * 60);
    const sc = h2 + h1 * 0.5;
    if (!best || sc > best.sc) best = { sc, x, z, dir };
  }
  const { x: bx, z: bz, dir } = best;
  // walk inland to the lip
  const pts = []; let d = -6;
  for (; d < 120; d += 2.5) { const x = bx + dir[0] * d, z = bz + dir[1] * d; const h = heightAt(x, z); pts.push([x, h, z, d]); if (h > 150) break; }
  // the falling sheet: follows the cliff face but stands proud of it
  const W = 7;
  const pos = [], uv = [], idx = [];
  const nx = -dir[1], nz = dir[0];
  let acc = 0;
  const top = pts[pts.length - 1];
  for (let i = pts.length - 1; i >= 0; i--) {
    const [x, h, z] = pts[i];
    const out = 2.5 + (1 - i / pts.length) * 6;  // the sheet arcs outward as it falls
    const px = x - dir[0] * out, pz = z - dir[1] * out, py = Math.max(h + 0.5, -0.5);
    if (i < pts.length - 1) acc += Math.hypot(pts[i + 1][0] - x, pts[i + 1][1] - h, pts[i + 1][2] - z);
    const w = W * (0.55 + 0.45 * (1 - i / pts.length));
    pos.push(px - nx * w, py, pz - nz * w, px + nx * w, py, pz + nz * w); uv.push(0, acc, 1, acc);
    const j = pts.length - 1 - i;
    if (j) { const a = (j - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const fallMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, U, WU), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uSunCol; uniform float uDark; uniform vec3 uFogCol; uniform float uFogD; varying vec2 vUv; varying vec3 vW; ${GLSL_NOISE}
      void main(){
        float streak = kFbm(vec2(vUv.x * 9.0, vUv.y * 0.05 - uTime * 1.2));
        float fine = kNoise(vec2(vUv.x * 40.0, vUv.y * 0.25 - uTime * 4.0));
        float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
        float a = edge * clamp(0.25 + streak * 0.9 + fine * 0.25, 0.0, 1.0) * 0.85;
        vec3 c = mix(vec3(0.55, 0.62, 0.66), vec3(0.95, 0.97, 1.0), fine * streak);
        c *= (0.25 + 0.75 * uSunCol) * (1.0 - uDark * 0.85);
        float fd = length(cameraPosition - vW); c = mix(c, uFogCol, clamp(1.0 - exp(-uFogD*uFogD*fd*fd), 0., 1.));
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  });
  const fm = new THREE.Mesh(g, fallMat); fm.renderOrder = 3; group.add(fm);
  // stream: dark moving water in its bed
  const sp = catmull(STREAM, 6); const sPos = [], sUv = [], sIdx = []; let sAcc = 0;
  for (let i = 0; i < sp.length; i++) {
    const [x, z] = sp[i]; const nx2 = sp[Math.min(i + 1, sp.length - 1)], px2 = sp[Math.max(i - 1, 0)];
    const tx = nx2[0] - px2[0], tz = nx2[1] - px2[1], tl = Math.hypot(tx, tz) || 1;
    const y = Math.max(grid.get(x, z) + 0.6, 0.15);
    if (i) sAcc += Math.hypot(x - sp[i - 1][0], z - sp[i - 1][1]);
    sPos.push(x - tz / tl * 2.2, y, z + tx / tl * 2.2, x + tz / tl * 2.2, y, z - tx / tl * 2.2); sUv.push(0, sAcc, 1, sAcc);
    if (i) { const a = (i - 1) * 2; sIdx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(sUv, 2)); sg.setIndex(sIdx);
  const sMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, U, WU), transparent: true, depthWrite: false,
    vertexShader: fallMat.vertexShader,
    fragmentShader: `uniform float uTime; uniform vec3 uSunCol; uniform float uDark; uniform vec3 uHor; varying vec2 vUv; varying vec3 vW; ${GLSL_NOISE}
      void main(){ float n = kNoise(vec2(vUv.x * 5.0, vUv.y * 0.6 + uTime * 1.5)); float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        vec3 c = mix(vec3(0.02, 0.035, 0.04), uHor * 0.35, smoothstep(0.55, 0.9, n)) * (1.0 - uDark * 0.7);
        c += vec3(0.6) * smoothstep(0.82, 0.95, n) * (1.0 - uDark);
        gl_FragColor = vec4(c, edge * 0.9);
        #include <colorspace_fragment>
      }`,
  });
  group.add(new THREE.Mesh(sg, sMat));
  const fallPts = pts.map(([x, h, z]) => [x - dir[0] * 4, Math.max(h, 0), z - dir[1] * 4]);
  return { group, mistAt: [bx, 1, bz], fallTop: top, fallPts };
}

// ---------------------------------------------------------------- sky: Preetham scattering + stars
export function buildSky() {
  const sky = new Sky(); sky.scale.setScalar(9000);
  const sm = sky.material;
  sm.uniforms.skyGain = { value: 0.6 };
  sm.fragmentShader = 'uniform float skyGain;\n' + sm.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );', 'gl_FragColor = vec4( retColor * skyGain, 1.0 );');
  sm.depthWrite = false; sky.frustumCulled = false; sky.renderOrder = -10;
  // stars & a faint aurora, only after sunset
  const starMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uDark: U.uDark, uTime: U.uTime },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform float uDark; uniform float uTime; varying vec3 vD; ${GLSL_NOISE}
      void main(){ vec3 d = normalize(vD); float h = d.y;
        vec3 sp = floor(d * 1100.0); float st = kHash(sp.xy + sp.z * 17.0);
        vec3 c = vec3(1.0, 0.95, 0.85) * step(0.9985, st) * smoothstep(0.03, 0.25, h) * (0.6 + 0.4 * sin(uTime * 3.0 + st * 100.0)) * 1.4;
        float au = smoothstep(0.12, 0.35, h) * smoothstep(0.75, 0.35, h) * kFbm(vec2(d.x * 3.0 + uTime * 0.01, d.z * 0.8 - uTime * 0.004));
        c += vec3(0.08, 0.45, 0.28) * au * 0.18;
        gl_FragColor = vec4(c * uDark * uDark, 1.0); }`,
  });
  const stars = new THREE.Mesh(new THREE.SphereGeometry(8500, 32, 16), starMat); stars.frustumCulled = false; stars.renderOrder = -9;
  // a second sky for the environment-light probe
  const envSky = new Sky(); envSky.material = sm; envSky.scale.setScalar(500);
  return { sky, stars, envSky };
}

// Light keyframes for the sun scrubber: dawn fog / clear noon / golden hour / dusk
const KEYS = [
  { t: 0.0, el: 4, az: 75, sun: [1.0, 0.72, 0.52], si: 2.4, sky: [0.6, 0.66, 0.78], gnd: [0.2, 0.18, 0.15], hi: 0.35, fog: [0.66, 0.66, 0.7], fd: 0.0016, exp: 0.95, dark: 0.12, glow: [1.0, 0.55, 0.35], tb: 9, ry: 2.6, env: 0.85, zen: [0.3, 0.4, 0.58], hor: [0.8, 0.7, 0.64] },
  { t: 0.33, el: 46, az: 150, sun: [1.0, 0.97, 0.92], si: 3.6, sky: [0.55, 0.68, 0.9], gnd: [0.25, 0.22, 0.18], hi: 0.3, fog: [0.6, 0.69, 0.8], fd: 0.00016, exp: 0.78, dark: 0.0, glow: [0.6, 0.6, 0.6], tb: 3, ry: 1.2, env: 1.0, zen: [0.2, 0.38, 0.7], hor: [0.62, 0.72, 0.85] },
  { t: 0.66, el: 10, az: 242, sun: [1.0, 0.7, 0.42], si: 3.6, sky: [0.6, 0.58, 0.68], gnd: [0.26, 0.2, 0.14], hi: 0.32, fog: [0.72, 0.6, 0.52], fd: 0.00022, exp: 0.9, dark: 0.22, glow: [1.0, 0.45, 0.15], tb: 6, ry: 2.2, env: 0.95, zen: [0.22, 0.3, 0.5], hor: [0.95, 0.66, 0.44] },
  { t: 1.0, el: -3.2, az: 236, sun: [0.9, 0.45, 0.32], si: 0.12, sky: [0.16, 0.21, 0.38], gnd: [0.05, 0.045, 0.05], hi: 0.85, fog: [0.045, 0.05, 0.085], fd: 0.00032, exp: 1.35, dark: 1.0, glow: [0.85, 0.3, 0.12], tb: 4, ry: 3.0, env: 0.6, zen: [0.012, 0.02, 0.05], hor: [0.2, 0.12, 0.15] },
];
export function lightAt(s) {
  s = clamp(s, 0, 1);
  let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].t < s) i++;
  const a = KEYS[i], b = KEYS[i + 1]; const t = smoothstep(a.t, b.t, s);
  const o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, j) => lerp(v, b[k][j], t)) : lerp(a[k], b[k], t);
  return o;
}
