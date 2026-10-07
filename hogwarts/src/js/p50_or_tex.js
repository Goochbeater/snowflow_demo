/* ==== p50_or_tex.js ==== */
/* OPUS RING — textures for the Lands Between (grass, earth, limestone, ashlar, flagstones, wood, bark), the Limgrave
   terrain material (grass / road / cliff blended by slope + painted masks) and a cached, chunked heightfield. */
/* tileable Voronoi on an n×n jittered lattice: returns [d1, d2, cell id] */
TEX.vor = function (u, v, n, seed) {
  const x = u * n, y = v * n, ix = Math.floor(x), iy = Math.floor(y); let d1 = 9, d2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = ix + i, cy = iy + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
    const px = cx + 0.15 + 0.7 * hash3(wx, wy, seed || 11), py = cy + 0.15 + 0.7 * hash3(wx, wy, (seed || 11) + 7);
    const d = Math.hypot(px - x, py - y); if (d < d1) { d2 = d1; d1 = d; id = hash3(wx, wy, 91); } else if (d < d2) d2 = d;
  }
  return [d1, d2, id];
};
Object.assign(TEX.G, {
  grass(u, v, o) {   // short turf seen from above: mottled greens, fine blade grain
    const n = TEX.tn(u * 8, v * 8, 8, 5), f = TEX.tn(u * 64, v * 64, 64, 2), s = TEX.tn(u * 128 + 3, v * 40, 8, 2), m = TEX.tn(u * 4 + 9, v * 4 + 2, 4, 3);
    const b = 0.3 + n * 0.16 + f * 0.1 + s * 0.06;
    const dry = smooth(0.52, 0.75, m) * 0.5;
    o[0] = b * lerp(0.8, 1.0, dry); o[1] = b * lerp(0.96, 0.92, dry); o[2] = b * lerp(0.42, 0.44, dry);
    o[3] = f * 0.6 + n * 0.4; o[4] = 0.95;
  },
  dirt(u, v, o) {   // trodden earth + pebbles
    const n = TEX.tn(u * 8, v * 8, 8, 5), f = TEX.tn(u * 64, v * 64, 64, 2), V2 = TEX.vor(u, v, 22, 5), peb = V2[2] > 0.72 ? smooth(0.32, 0.12, V2[0]) : 0;
    const b = 0.4 + n * 0.1 + f * 0.05;
    o[0] = b * 1.02 + peb * 0.07; o[1] = b * 0.88 + peb * 0.065; o[2] = b * 0.68 + peb * 0.06; o[3] = n * 0.4 + f * 0.3 + peb * 0.5; o[4] = 0.93;
  },
  cliff(u, v, o) {   // fractured Limgrave limestone: big plates broken into facets, dark open joints, faint bedding, lichen
    const w1 = (TEX.tn(u * 4, v * 4, 4, 3) - 0.5) * 0.07, w2 = (TEX.tn(u * 4 + 5, v * 4 + 2, 4, 3) - 0.5) * 0.07;
    const A = TEX.vor(u + w1, v + w2, 5, 3), B = TEX.vor(u + w2 * 0.6, v + w1 * 0.6, 13, 7);
    const eA = smooth(0.0, 0.05, A[1] - A[0]), eB = smooth(0.0, 0.05, B[1] - B[0]);
    const n = TEX.tn(u * 16, v * 16, 16, 4), f = TEX.tn(u * 64, v * 64, 64, 2), l = TEX.tn(u * 4 + 7, v * 4 + 3, 4, 3), strata = Math.sin((v * 9 + w1 * 6) * TAU) * 0.5 + 0.5;
    let b = 0.5 + (A[2] - 0.5) * 0.14 + (B[2] - 0.5) * 0.1 + n * 0.1 + f * 0.05 + strata * 0.03;
    b *= lerp(0.6, 1, eA) * lerp(0.9, 1, eB);
    const lich = smooth(0.6, 0.8, l) * 0.3;
    o[0] = b * lerp(0.98, 0.82, lich); o[1] = b * lerp(0.95, 0.92, lich); o[2] = b * lerp(0.88, 0.64, lich);
    o[3] = A[2] * 0.5 + B[2] * 0.22 + n * 0.25 + f * 0.08 - (1 - eA) * 0.7 - (1 - eB) * 0.15; o[4] = 0.9;
  },
  ashlar(u, v, o) {   // castle masonry: coursed blocks of uneven length, soft worn joints, weather stains, lichen
    const rows = 8, ry = v * rows, row = Math.floor(ry), fy = ry - row, per = 3 + (row % 3 === 1 ? 1 : 0) + (row % 4 === 2 ? 1 : 0), ox = hash2(row, 3) * 0.7;
    const rx = u * per + ox, col = Math.floor(rx), fx = rx - col, idc = ((col % per) + per) % per;
    const id = hash3(idc, row, 5), id2 = hash3(idc, row, 9);
    const wob = (TEX.tn(u * 32, v * 32, 32, 2) - 0.5) * 0.012;
    const ex = Math.min(fx, 1 - fx) * (1 / per) * 3 + wob, ey = Math.min(fy, 1 - fy) / rows * 3 + wob;
    const edge = Math.min(ex, ey), joint = smooth(0.02, 0.004, edge), bevel = smooth(0.0, 0.035, edge);
    const n = TEX.tn(u * 16, v * 16, 16, 4), f = TEX.tn(u * 64, v * 64, 64, 2), st = TEX.tn(u * 4 + 3, v * 2 + 1, 2, 4), li = TEX.tn(u * 8 + 9, v * 8 + 4, 8, 3);
    let b = 0.46 + (id - 0.5) * 0.06 + n * 0.12 + f * 0.06 - smooth(0.45, 0.8, st) * 0.07;
    b *= 1 - joint * 0.26;
    const warm = 0.96 + id2 * 0.07, moss = smooth(0.6, 0.9, li) * 0.26;
    o[0] = b * warm * lerp(1, 0.78, moss); o[1] = b * 0.98 * lerp(1, 0.95, moss); o[2] = b * (0.9 - (id2 - 0.5) * 0.06) * lerp(1, 0.6, moss);
    o[3] = bevel * 0.5 + n * 0.35 + f * 0.1 + (id - 0.5) * 0.12; o[4] = 0.86 + n * 0.1;
  },
  flag(u, v, o) {   // worn paving: courses of slabs of uneven width, some cracked, dirt in the joints
    const rows = 5, ry = v * rows, row = Math.floor(ry), fy = ry - row, per = 2 + Math.floor(hash2(row, 21) * 3), ox = hash2(row, 13);
    const rx = u * per + ox, col = Math.floor(rx), fx = rx - col, idc = ((col % per) + per) % per, id = hash3(idc, row, 15);
    const wob = (TEX.tn(u * 16 + 3, v * 16, 16, 2) - 0.5) * 0.02;
    const ex = Math.min(fx, 1 - fx) / per * 3.5 + wob, ey = Math.min(fy, 1 - fy) / rows * 3.5 + wob, edge = Math.min(ex, ey), joint = smooth(0.03, 0.006, edge);
    const n = TEX.tn(u * 16, v * 16, 16, 4), f = TEX.tn(u * 64, v * 64, 64, 2), w = TEX.tn(u * 4 + 5, v * 4, 4, 3);
    const cr = id > 0.7 ? Math.pow(Math.max(0, 1 - Math.abs(TEX.tn(u * 8 + id * 30, v * 8, 8, 2) - 0.5) * 40), 2) : 0;
    let b = 0.42 + (id - 0.5) * 0.1 + n * 0.12 + f * 0.05 - smooth(0.5, 0.8, w) * 0.08; b *= 1 - joint * 0.42 - cr * 0.3;
    o[0] = b; o[1] = b * 0.98; o[2] = b * 0.92; o[3] = smooth(0.0, 0.05, edge) * 0.5 + n * 0.3 - cr * 0.4; o[4] = 0.8 + n * 0.15;
  },
  planks(u, v, o) {   // weathered timber
    const p = u * 6, pi = Math.floor(p), fp = p - pi, id = hash2(pi, 4), g = TEX.tn(u * 48 + id * 20, v * 4 + id * 7, 4, 4), n = TEX.tn(u * 8, v * 8, 8, 3);
    const seam = fp < 0.03 || fp > 0.97 ? 1 : 0, grain = Math.sin((g * 9 + v * 3) * TAU) * 0.5 + 0.5;
    const b = (0.3 + id * 0.08 + grain * 0.07 + n * 0.06) * (1 - seam * 0.6);
    o[0] = b * 1.05; o[1] = b * 0.82; o[2] = b * 0.6; o[3] = seam ? 0 : 0.5 + grain * 0.3; o[4] = 0.85;
  },
  bark(u, v, o) {
    const g = TEX.tn(u * 14, v * 3, 2, 4), n = TEX.tn(u * 32, v * 32, 32, 3), rid = Math.pow(Math.abs(Math.sin((u * 9 + g * 1.2) * PI)), 0.7);
    const b = 0.2 + rid * 0.16 + n * 0.08;
    o[0] = b * 1.0; o[1] = b * 0.88; o[2] = b * 0.74; o[3] = rid * 0.8 + n * 0.2; o[4] = 0.95;
  },
  gold(u, v, o) {   // hammered gilt (armour, the Erdtree's bark)
    const n = TEX.tn(u * 16, v * 16, 16, 4), V2 = TEX.vor(u, v, 14, 2);
    const b = 0.78 + n * 0.12 - V2[0] * 0.2;
    o[0] = b; o[1] = b * 0.78; o[2] = b * 0.36; o[3] = 1 - V2[0] * 1.2 + n * 0.2; o[4] = 0.32 + n * 0.25;
  },
  steel(u, v, o) {   // worn plate: brushed, pitted, darker in the hollows
    const n = TEX.tn(u * 8, v * 8, 8, 5), s = TEX.tn(u * 96, v * 6, 6, 2), p = TEX.tn(u * 48 + 3, v * 48, 48, 2);
    const pit = smooth(0.72, 0.9, p);
    const b = 0.62 + n * 0.16 + s * 0.08 - pit * 0.25;
    o[0] = b; o[1] = b; o[2] = b * 1.03; o[3] = 0.6 + n * 0.2 - pit * 0.5; o[4] = 0.3 + n * 0.3 + pit * 0.3;
  },
});
TEX.OR_CFG = { grass: { scale: 3, bump: 3 }, dirt: { scale: 3.4, bump: 4 }, cliff: { scale: 5, bump: 4.4 }, ashlar: { scale: 3.2, bump: 2.6, size: 1024 }, flag: { scale: 3.6, bump: 2.6 }, planks: { scale: 2.4, bump: 4 }, bark: { scale: 2, bump: 6, size: 256 },
  gold: { scale: 1, bump: 3, size: 256 }, steel: { scale: 1, bump: 2, size: 256 } };
(function () { const i0 = TEX.init; TEX.init = async function (list, progress) {
  const mine = list.filter((n) => TEX.OR_CFG[n] && !TEX.sets[n]); let i = 0;
  for (const n of mine) { TEX.build(n, TEX.G[n], TEX.OR_CFG[n]); i++; if (progress) await progress(i / list.length); else await MG.yield(); }
  return i0(list.filter((n) => !TEX.OR_CFG[n]), progress);
}; })();

/* ------------------------------------------------------------------ Limgrave ground */
TERRAIN.limMat = function (key, o) {
  o = o || {};
  const G = TEX.sets.grass, D = TEX.sets[o.dirt || 'dirt'], C = TEX.sets.cliff;
  // Lambert + few texture taps: this shader covers most of the screen, so every sample counts. The large-scale colour
  // drift comes from a per-vertex attribute (aMac) instead of low-frequency texture lookups; rock is only sampled on rock.
  const m = new THREE.MeshLambertMaterial({ map: G.map });
  const U = { tDirt: { value: D.map }, tCliff: { value: C.map }, tCliffN: { value: C.normalMap }, tGrassN: { value: G.normalMap },
    uTintA: { value: new THREE.Color(o.tintA || 0x9c9a68) }, uTintB: { value: new THREE.Color(o.tintB || 0xaea268) }, uRockTint: { value: new THREE.Color(o.rockTint || 0xffffff) }, uDirtTint: { value: new THREE.Color(o.dirtTint || 0xffffff) } };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aBl; attribute vec3 aMac; varying vec3 vWP; varying vec3 vWN; varying vec3 vBl; varying vec3 vMac;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal); vBl = aBl; vMac = aMac;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tDirt, tCliff, tCliffN, tGrassN; uniform vec3 uTintA, uTintB, uRockTint, uDirtTint; varying vec3 vWP; varying vec3 vWN; varying vec3 vBl; varying vec3 vMac;')
      .replace('#include <map_fragment>', `
        vec3 wn0 = normalize(vWN); vec3 an = abs(wn0); vec3 bw = pow(an, vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
        float dCam = length(vViewPosition);
        float mac = vMac.x, mac2 = vMac.y, gPat = vMac.z;
        float slope = 1.0 - smoothstep(0.58, 0.74, wn0.y + (mac2 - 0.5) * 0.08);
        float gRock = clamp(max(slope, vBl.y), 0.0, 1.0);
        float gRoad = clamp(vBl.x + (1.0 - smoothstep(0.74, 0.86, wn0.y)) * 0.7, 0.0, 1.0);
        vec3 c = vec3(0.0);
        if (gRock < 0.99) {
          vec3 base = vec3(0.0);
          if (gRoad < 0.99) { vec3 g1 = texture2D(map, vWP.xz / 3.1).rgb; vec3 grassC = dCam > 26.0 ? mix(g1, texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * vWP.xz / 8.3).rgb, 0.5 + 0.35 * smoothstep(26.0, 90.0, dCam)) : g1;
            grassC = mix(vec3(dot(grassC, vec3(0.3, 0.6, 0.1))), grassC, 0.8);
            grassC *= mix(uTintA, uTintB, smoothstep(0.3, 0.6, mac)) * (0.7 + 0.6 * mac2) * (0.8 + 1.0 * gPat) * 1.3; base = grassC * (1.0 - gRoad); }
          if (gRoad > 0.01) base += texture2D(tDirt, vWP.xz / 3.4).rgb * uDirtTint * (0.8 + 0.4 * mac2) * gRoad;
          c = base * (1.0 - gRock);
        }
        if (gRock > 0.01) {
          vec3 rockC = texture2D(tCliff, vWP.zy / 5.0).rgb * bw.x + texture2D(tCliff, vWP.xz / 5.0).rgb * bw.y + texture2D(tCliff, vWP.xy / 5.0).rgb * bw.z;
          float fineR = dCam < 160.0 ? texture2D(tCliff, (bw.x > bw.z ? vWP.zy : vWP.xy) / 1.3).g : 0.5;
          rockC *= 0.5 + 1.1 * texture2D(tCliff, (bw.y > 0.5 ? vWP.xz : (bw.x > bw.z ? vWP.zy : vWP.xy)) / 27.0 + 0.37).g;   // a second, much larger octave hides the 5 m repeat on tall faces
          rockC *= (0.72 + 0.56 * fineR * (1.0 - smoothstep(40.0, 160.0, dCam)) + 0.28 * smoothstep(40.0, 160.0, dCam)) * uRockTint * (0.85 + 0.3 * mac);
          c += rockC * gRock;
        }
        c *= 1.0 - vBl.z * 0.55;   // painted shade (under trees, damp hollows, scorched ground)
        diffuseColor.rgb *= c;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 w0 = normalize(vWN); vec3 wN2 = w0;
          if (dCam < 110.0 && gRock < 0.99) { vec3 tG = texture2D(tGrassN, vWP.xz / 3.1).xyz * 2.0 - 1.0; float nk = 0.5 * (1.0 - smoothstep(30.0, 110.0, dCam)) * (1.0 - 0.72 * gRoad); wN2 = normalize(vec3(w0.x + tG.x * nk, w0.y, w0.z + tG.y * nk)); }
          if (gRock > 0.01) {
            float fk = 1.0 - 0.75 * smoothstep(60.0, 200.0, dCam);
            vec3 tX = texture2D(tCliffN, vWP.zy / 5.0).xyz * 2.0 - 1.0, tY = texture2D(tCliffN, vWP.xz / 5.0).xyz * 2.0 - 1.0, tZ = texture2D(tCliffN, vWP.xy / 5.0).xyz * 2.0 - 1.0;
            tX.xy *= 1.1 * fk; tZ.xy *= 1.1 * fk; tY.xy *= 0.8 * fk;
            tX = vec3(tX.xy + w0.zy, abs(tX.z) * w0.x); tY = vec3(tY.xy + w0.xz, abs(tY.z) * w0.y); tZ = vec3(tZ.xy + w0.xy, abs(tZ.z) * w0.z);
            vec3 wR = normalize(tX.zyx * bw.x + tY.xzy * bw.y + tZ.xyz * bw.z);
            wN2 = normalize(mix(wN2, wR, gRock));
          }
          normal = normalize((viewMatrix * vec4(wN2, 0.0)).xyz); }`);
  };
  m.customProgramCacheKey = () => 'limgrave2_' + key;
  return m;
};
/* a cached heightfield: f(x,z) is sampled once onto a grid (res metres); the mesh, the physics, the grass and the props
   all read the grid (bilinear). paint(x, z, h, nrmY) -> [road, rock, shade] per vertex. Built in chunks so the frustum
   culls most of a kilometre-wide map. */
TERRAIN.grid = async function (f, x0, z0, x1, z1, res, mat, o) {
  o = o || {};
  const nx = Math.round((x1 - x0) / res), nz = Math.round((z1 - z0) / res), W = nx + 1, Hn = nz + 1;
  const H = new Float32Array(W * Hn);
  for (let j = 0; j < Hn; j++) { for (let i = 0; i < W; i++) H[j * W + i] = f(x0 + i * res, z0 + j * res); if (o.progress && j % 40 === 0) await o.progress(j / Hn * 0.6); }
  const at = (i, j) => H[clamp(j, 0, nz) * W + clamp(i, 0, nx)];
  const hf = (x, z) => {
    const fx = (x - x0) / res, fz = (z - z0) / res; if (fx < 0 || fz < 0 || fx > nx || fz > nz) return null;
    const i = Math.min(nx - 1, Math.floor(fx)), j = Math.min(nz - 1, Math.floor(fz)), u = fx - i, v = fz - j, k = j * W + i;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + W] * (1 - u) + H[k + W + 1] * u) * v;
  };
  // normals + paint per grid vertex
  const NY = new Float32Array(W * Hn), NX = new Float32Array(W * Hn), NZ = new Float32Array(W * Hn), BL = new Float32Array(W * Hn * 3), MC = new Float32Array(W * Hn * 3);
  for (let j = 0; j < Hn; j++) for (let i = 0; i < W; i++) {
    const dx = (at(i + 1, j) - at(i - 1, j)) / (2 * res), dz = (at(i, j + 1) - at(i, j - 1)) / (2 * res), l = 1 / Math.hypot(dx, 1, dz), k = j * W + i;
    NX[k] = -dx * l; NY[k] = l; NZ[k] = -dz * l;
    if (o.paint) { const p = o.paint(x0 + i * res, z0 + j * res, H[k], l); BL[k * 3] = p[0]; BL[k * 3 + 1] = p[1]; BL[k * 3 + 2] = p[2] || 0; }
    { const x = x0 + i * res, z = z0 + j * res; MC[k * 3] = fbm2(x * 0.0085 + 3, z * 0.0085, 3); MC[k * 3 + 1] = fbm2(x * 0.045 + 5, z * 0.045, 3); MC[k * 3 + 2] = fbm2(x * 0.016 + 9, z * 0.016 + 2, 2) * fbm2(x * 0.09, z * 0.09 + 7, 2); }
  }
  // every vertex on the lip or the foot of a drop is rock (otherwise the turf blends down the face in saw teeth)
  for (let j = 0; j < Hn; j++) for (let i = 0; i < W; i++) { const k = j * W + i, h = H[k]; let dh = 0; for (let jj = Math.max(0, j - 1); jj <= Math.min(nz, j + 1); jj++) for (let ii = Math.max(0, i - 1); ii <= Math.min(nx, i + 1); ii++) dh = Math.max(dh, Math.abs(H[jj * W + ii] - h));
    if (dh > 1.8 * res / 2) BL[k * 3 + 1] = Math.max(BL[k * 3 + 1], smooth(1.8 * res / 2, 4.2 * res / 2, dh)); }
  const CH = o.chunk || 40, grp = new THREE.Group();
  for (let cj = 0; cj < nz; cj += CH) for (let ci = 0; ci < nx; ci += CH) {
    const w = Math.min(CH, nx - ci), h = Math.min(CH, nz - cj), n = (w + 1) * (h + 1);
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), B = new Float32Array(n * 3), Mq = new Float32Array(n * 3), I = [];
    for (let j = 0; j <= h; j++) for (let i = 0; i <= w; i++) { const k = j * (w + 1) + i, g = (cj + j) * W + ci + i, x = x0 + (ci + i) * res, z = z0 + (cj + j) * res; Mq[k * 3] = MC[g * 3]; Mq[k * 3 + 1] = MC[g * 3 + 1]; Mq[k * 3 + 2] = MC[g * 3 + 2];
      P[k * 3] = x; P[k * 3 + 1] = H[g]; P[k * 3 + 2] = z; N[k * 3] = NX[g]; N[k * 3 + 1] = NY[g]; N[k * 3 + 2] = NZ[g]; UV[k * 2] = x / 5; UV[k * 2 + 1] = z / 5; B[k * 3] = BL[g * 3]; B[k * 3 + 1] = BL[g * 3 + 1]; B[k * 3 + 2] = BL[g * 3 + 2]; }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const a = j * (w + 1) + i, b = a + 1, c = a + w + 2, d = a + w + 1; I.push(a, d, b, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setAttribute('aBl', new THREE.BufferAttribute(B, 3)); g.setAttribute('aMac', new THREE.BufferAttribute(Mq, 3));
    g.setIndex(I); g.computeBoundingSphere(); g.computeBoundingBox();
    const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.castShadow = !!o.cast; me.matrixAutoUpdate = false; grp.add(me);
    if (o.progress && (ci === 0)) await o.progress(0.6 + 0.4 * cj / nz);
  }
  LEVEL.add(grp);
  PHY.hf = hf;
  return { H, W, Hn, nx, nz, x0, z0, x1, z1, res, hf, BL, NY, group: grp };
};
/* limestone outcrop into KIT buckets (grey Limgrave boulders) */
TERRAIN.cliffMat = function (tint) {
  const s = TEX.sets.cliff; const key = 'cliff' + (tint || 0xffffff);
  TERRAIN._cm = TERRAIN._cm || {}; if (TERRAIN._cm[key]) return TERRAIN._cm[key];
  const m = new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, roughness: 0.9, envMapIntensity: 0.4, color: tint || 0xffffff });
  m.userData.tscale = 5; TEX.macro(m, 1, 0.6); TERRAIN._cm[key] = m; return m;
};
/* a cave roof over a grid terrain: fn(x,z) -> ceiling height. Faces look down; all rock. */
TERRAIN.ceiling = function (G, fn, mat, o) {
  o = o || {}; const st = o.step || 1, nx = Math.floor(G.nx / st), nz = Math.floor(G.nz / st), res = G.res * st, W = nx + 1, n = W * (nz + 1);
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), B = new Float32Array(n * 3), MQ = new Float32Array(n * 3), I = [], Hc = new Float32Array(n);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) Hc[j * W + i] = fn(G.x0 + i * res, G.z0 + j * res);
  const at = (i, j) => Hc[clamp(j, 0, nz) * W + clamp(i, 0, nx)];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const k = j * W + i, x = G.x0 + i * res, z = G.z0 + j * res, dx = (at(i + 1, j) - at(i - 1, j)) / (2 * res), dz = (at(i, j + 1) - at(i, j - 1)) / (2 * res), l = 1 / Math.hypot(dx, 1, dz);
    P[k * 3] = x; P[k * 3 + 1] = Hc[k]; P[k * 3 + 2] = z; N[k * 3] = dx * l; N[k * 3 + 1] = -l; N[k * 3 + 2] = dz * l; UV[k * 2] = x / 5; UV[k * 2 + 1] = z / 5; B[k * 3 + 1] = 1; MQ[k * 3] = 0.5; MQ[k * 3 + 1] = fbm2(x * 0.05, z * 0.05, 2); MQ[k * 3 + 2] = 0.3; }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * W + i, b = a + 1, c = a + W + 1, d = a + W; I.push(a, b, d, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setAttribute('aBl', new THREE.BufferAttribute(B, 3)); g.setAttribute('aMac', new THREE.BufferAttribute(MQ, 3)); g.setIndex(I); g.computeBoundingSphere();
  const me = new THREE.Mesh(g, mat); me.receiveShadow = false; me.castShadow = false; LEVEL.add(me); return me;
};
