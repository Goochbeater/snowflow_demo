/* ==== p50a_assets.js ==== */
/* OPUS RING — scanned assets (Poly Haven, CC0): tiling PBR sets (ph_*), simplified photogrammetry meshes (m.bin) with
   their own albedo / normal / AO-rough-metal maps (md_*). Everything is embedded; textures are decoded on demand. */
const AST = { tex: {}, geo: {}, mats: {}, sets: {}, J: null, buf: null, PH: null };
AST.init = function () {
  if (AST.J) return true; const ej = document.getElementById('mjson'), ep = document.getElementById('phjson'); if (!ej || !ASSETS.has('mbin')) return false;
  AST.J = JSON.parse(ej.textContent); AST.PH = ep ? JSON.parse(ep.textContent) : {};
  AST.buf = ASSETS.buffer('mbin'); return true;
};
AST.image = async function (id) {
  if (!ASSETS.has('tex_' + id)) return null;
  const img = new Image(); img.src = ASSETS.url('tex_' + id); try { await img.decode(); } catch (e) { return null; } return img;
};
AST.texture = async function (id, srgb, o) {
  o = o || {}; const key = id + (srgb ? ':s' : ':l') + (o.flip === false ? 'n' : ''); if (AST.tex[key]) return AST.tex[key];
  const img = await AST.image(id); if (!img) { console.warn('AST: no texture', id); return null; }
  const t = new THREE.Texture(img); t.flipY = o.flip !== false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = o.aniso || 8; t.needsUpdate = true;
  AST.tex[key] = t; return t;
};
/* a tiling set -> TEX.sets[key] (the same shape the procedural sets have, plus an AO map) */
AST.set = async function (key) {
  if (TEX.sets[key] && TEX.sets[key].photo) return TEX.sets[key];
  const [a, n, m] = await Promise.all([AST.texture('ph_' + key + '_alb', true), AST.texture('ph_' + key + '_nor', false), AST.texture('ph_' + key + '_mix', false)]);
  if (!a) return null;
  const s = { map: a, normalMap: n, roughnessMap: m, aoMap: m, emissiveMap: null, scale: (AST.PH && AST.PH[key]) || 2, photo: true }; TEX.sets[key] = s; return s;
};
/* a scanned model's material maps */
AST.mtex = async function (tb) {
  if (AST.sets[tb]) return AST.sets[tb]; AST.init(); const I = (AST.J.tex || {})[tb] || {};
  const [d, n, a] = await Promise.all([AST.texture('md_' + tb + '_d', true, { flip: false }), I.n ? AST.texture('md_' + tb + '_n', false, { flip: false }) : null, I.a ? AST.texture('md_' + tb + '_a', false, { flip: false }) : null]);
  AST.sets[tb] = { map: d, normalMap: n, arm: a, alpha: !!I.alpha }; return AST.sets[tb];
};
AST.need = async function (sets, models, progress) {
  AST.init(); const all = ['fol_leaf', 'fol_grass'].map((k) => () => AST.texture(k, true)).concat((sets || []).map((k) => () => AST.set(k))).concat((models || []).map((m) => () => AST.mtex(AST.J.meshes[m] ? AST.J.meshes[m].tex : m)));
  for (let i = 0; i < all.length; i++) { await all[i](); if (progress && i % 3 === 0) await progress(i / all.length); }
};
AST.arr = function (r) { const T = { uint16: Uint16Array, int8: Int8Array, uint32: Uint32Array, float32: Float32Array }[r.t]; return new T(AST.buf, r.o, r.n); };
AST.info = (name) => (AST.init(), AST.J.meshes[name]);
/* geometry of a mesh (lod 0 = near). Dequantised once and cached. */
AST.geometry = function (name, lod) {
  AST.init(); const E = AST.J.meshes[name]; if (!E) { console.warn('AST: no mesh', name); return new THREE.BoxGeometry(1, 1, 1); }
  lod = Math.min(lod || 0, E.lods.length - 1); const key = name + ':' + lod; if (AST.geo[key]) return AST.geo[key];
  const L = E.lods[lod], qp = AST.arr(L.pos), qn = AST.arr(L.nrm), qu = AST.arr(L.uv), P = new Float32Array(L.nv * 3), N = new Float32Array(L.nv * 3), U = new Float32Array(L.nv * 2);
  for (let i = 0; i < L.nv; i++) { for (let k = 0; k < 3; k++) { P[i * 3 + k] = L.bmin[k] + qp[i * 3 + k] / 65535 * L.bext[k]; N[i * 3 + k] = qn[i * 3 + k] / 127; } U[i * 2] = L.umin[0] + qu[i * 2] / 65535 * L.uext[0]; U[i * 2 + 1] = L.umin[1] + qu[i * 2 + 1] / 65535 * L.uext[1]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  const ix = AST.arr(L.idx); g.setIndex(new THREE.BufferAttribute(ix.slice(), 1)); g.computeBoundingSphere(); g.computeBoundingBox(); AST.geo[key] = g; return g;
};
/* material for a scanned model (its maps must have been loaded with AST.need / AST.mtex). o: { color, rough, metal, env, ns, key, side, alphaTest } */
AST.material = function (name, o) {
  o = o || {}; AST.init(); const E = AST.J.meshes[name], tb = E ? E.tex : name, S = AST.sets[tb]; const key = tb + JSON.stringify(o); if (AST.mats[key]) return AST.mats[key];
  if (!S) console.warn('AST: maps not loaded for', tb);
  const m = new THREE.MeshStandardMaterial({ map: S ? S.map : null, normalMap: S ? S.normalMap : null, color: o.color !== undefined ? o.color : 0xffffff, roughness: o.rough !== undefined ? o.rough : 1, metalness: o.metal !== undefined ? o.metal : 0, envMapIntensity: o.env !== undefined ? o.env : 0.6, side: o.side || (S && S.alpha ? THREE.DoubleSide : THREE.FrontSide) });
  if (S && S.arm) { m.aoMap = S.arm; m.roughnessMap = S.arm; if (o.metal) m.metalnessMap = S.arm; }
  if (S && S.alpha) { m.alphaTest = o.alphaTest || 0.4; m.alphaToCoverage = true; }
  m.normalScale.set(o.ns || 1, o.ns || 1);
  if (o.grade || o.moss || o.detail) {   // grade: [saturation, r, g, b]   moss: 0..1 — upward faces go green   detail: world-space rock grain for pieces scaled far past their scan
    const g = o.grade || [1, 1, 1, 1], mk = o.moss || 0, dk = o.detail || 0, f = (v) => (+v).toFixed(3), DS = TEX.sets.mossrock;
    m.onBeforeCompile = (sh) => { if (dk && DS) { sh.uniforms.tDet = { value: DS.map }; sh.uniforms.tDetN = { value: DS.normalMap }; }
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPd;').replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 wp4 = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wp4 = instanceMatrix * wp4;
      #endif
        vWPd = (modelMatrix * wp4).xyz; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPd; uniform sampler2D tDet, tDetN;').replace('#include <map_fragment>', `#include <map_fragment>
      { float gl = dot(diffuseColor.rgb, vec3(0.3, 0.6, 0.1)); diffuseColor.rgb = mix(vec3(gl), diffuseColor.rgb, ${f(g[0])}) * vec3(${f(g[1])}, ${f(g[2])}, ${f(g[3])}); }
      ${dk && DS ? `{ vec3 gn = abs(normalize(cross(dFdx(vWPd), dFdy(vWPd)))); vec2 du = gn.y > 0.6 ? vWPd.xz : (gn.x > gn.z ? vWPd.zy : vWPd.xy);
        vec3 dt = texture2D(tDet, du / 3.1).rgb; float dl = dot(dt, vec3(0.3, 0.6, 0.1)) / 0.14; diffuseColor.rgb *= mix(1.0, dl, ${f(dk)}); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * dt / 0.15, ${f(dk * 0.35)}); }` : ''}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      ${dk && DS ? `{ vec3 gn2 = abs(normalize(cross(dFdx(vWPd), dFdy(vWPd)))); vec2 du2 = gn2.y > 0.6 ? vWPd.xz : (gn2.x > gn2.z ? vWPd.zy : vWPd.xy); vec3 tn = texture2D(tDetN, du2 / 3.1).xyz * 2.0 - 1.0;
        vec3 q0 = dFdx(vViewPosition), q1 = dFdy(vViewPosition); vec2 s0 = dFdx(du2), s1 = dFdy(du2); vec3 Tn = normalize(q0 * s1.y - q1 * s0.y), Bn = normalize(-q0 * s1.x + q1 * s0.x);
        normal = normalize(normal + (Tn * tn.x + Bn * tn.y) * ${f(dk * 0.9)}); }` : ''}
      { vec3 wnA = normalize((vec4(normal, 0.0) * viewMatrix).xyz); float mo = smoothstep(0.5, 0.86, wnA.y) * ${f(mk)}; float gl2 = dot(diffuseColor.rgb, vec3(0.3, 0.6, 0.1));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.215, 0.09) * (0.55 + 2.2 * gl2), mo); }`); };
    m.customProgramCacheKey = () => 'astg' + g.join('_') + '_' + mk + '_' + dk + (S && S.alpha ? 'a' : '');
  }
  AST.mats[key] = m; return m;
};
AST.mesh = function (name, o) { o = o || {}; const me = new THREE.Mesh(AST.geometry(name, o.lod || 0), o.mat || AST.material(name, o)); me.castShadow = o.shadow !== false; me.receiveShadow = true; return me; };
/* many copies of scanned meshes, batched per kind per cell. Meshes with two LODs are sorted per instance: each frame the
   camera has moved, a batch's copies are dealt between its near and far InstancedMesh.
   list: [{ m: name, p: [x,y,z], s: scale | [sx,sy,sz], r: [rx,ry,rz], c: tint }] */
AST.scatter = function (L, list, o) {
  o = o || {}; const cs = o.cell || 110, by = {}, lodD = o.lodD || 60, out = [];
  for (const it of list) { const k = it.m + '|' + Math.floor(it.p[0] / cs) + '|' + Math.floor(it.p[2] / cs); (by[k] = by[k] || []).push(it); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), col = new THREE.Color();
  for (const k in by) { const arr = by[k], name = arr[0].m, E = AST.J.meshes[name], nl = E.lods.length, n = arr.length, ms = [], M = new Float32Array(n * 16), C = new Float32Array(n * 4), hasCol = arr.some((it) => it.c !== undefined);
    arr.forEach((it, i) => { e.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0, 'YXZ'); q.setFromEuler(e); if (Array.isArray(it.s)) sv.set(it.s[0], it.s[1], it.s[2]); else sv.setScalar(it.s || 1); m4.compose(V3(it.p[0], it.p[1], it.p[2]), q, sv); m4.toArray(M, i * 16);
      const big = Math.max(Math.abs(sv.x), Math.abs(sv.y), Math.abs(sv.z)), rad = Math.hypot(E.size[0], E.size[1], E.size[2]) * 0.5 * big; C[i * 4] = it.p[0]; C[i * 4 + 1] = it.p[1] + E.size[1] * sv.y * 0.5; C[i * 4 + 2] = it.p[2]; C[i * 4 + 3] = rad; });
    for (let li = 0; li < nl; li++) { const mat = o.mat ? o.mat(name, li) : AST.material(name, o.matOpt || {}), im = new THREE.InstancedMesh(AST.geometry(name, li), mat, n); im.castShadow = o.shadow !== false && li === 0; im.receiveShadow = true;
      im.instanceMatrix.array.set(M); im.instanceMatrix.needsUpdate = true; if (hasCol && nl === 1) { arr.forEach((it, i) => im.setColorAt(i, col.set(it.c !== undefined ? it.c : 0xffffff))); im.instanceColor.needsUpdate = true; }
      im.computeBoundingSphere(); if (nl > 1) im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); LEVEL.add(im); ms.push(im); }
    out.push({ ms, M, C, n, bs: ms[0].boundingSphere, last: null }); }
  const lodK = o.lodK !== undefined ? o.lodK : 0.6;
  L.updates.push(() => { const c = R.camera.position; for (const b of out) { const dB = Math.hypot(c.x - b.bs.center.x, c.z - b.bs.center.z) - b.bs.radius;
    if (o.far) { const v = dB < o.far; for (const m of b.ms) m.visible = v; if (!v) continue; }
    if (b.ms.length < 2) continue;
    if (b.last && (dB > lodD * 4 ? b.state === 2 : (Math.abs(c.x - b.last[0]) + Math.abs(c.z - b.last[2]) + Math.abs(c.y - b.last[1]) < 3))) continue;
    b.last = [c.x, c.y, c.z]; const A0 = b.ms[0].instanceMatrix.array, A1 = b.ms[1].instanceMatrix.array; let n0 = 0, n1 = 0;
    for (let i = 0; i < b.n; i++) { const d = Math.hypot(c.x - b.C[i * 4], c.y - b.C[i * 4 + 1], c.z - b.C[i * 4 + 2]) - b.C[i * 4 + 3] * lodK; const src = b.M.subarray(i * 16, i * 16 + 16); if (d < lodD) { A0.set(src, n0 * 16); n0++; } else { A1.set(src, n1 * 16); n1++; } }
    b.ms[0].count = n0; b.ms[1].count = n1; b.ms[0].visible = n0 > 0; b.ms[1].visible = n1 > 0; b.ms[0].instanceMatrix.needsUpdate = true; b.ms[1].instanceMatrix.needsUpdate = true; b.state = n0 === 0 ? 2 : 1; } });
  return out;
};
/* photo sets carry an AO map: give it to every material made from them */
(function () { const m0 = TEX.mat; TEX.mat = function (name, o) { const key = name + JSON.stringify(o || {}), had = TEX._mats && TEX._mats[key]; const m = m0(name, o); const s = TEX.sets[name];
  if (!had && s && s.aoMap) { m.aoMap = s.aoMap; m.aoMapIntensity = (o && o.ao) !== undefined ? o.ao : 0.55; } return m; }; })();
