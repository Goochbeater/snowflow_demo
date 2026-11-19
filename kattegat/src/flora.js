// Village vegetation from CC0 nature models: birch stands and broadleaf shade trees, berry bushes,
// flower patches, plants, mossy rocks and stumps — scattered around (never on) roads, yards and fields.
import * as THREE from 'three';
import props from './assets/props.json';
import { stdMat, U } from './materials.js';
import { RNG, polyDist } from './util.js';
import { villageMask } from './terrain.js';

// Soft foliage: leaves get normals that radiate from the crown's centre (so a crown shades like one soft
// mass instead of a cluster of facets) plus a sway weight; trunks, stems and rocks keep their own normals.
function geo(d) {
  const n = d.c.length; const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), leaf = new Float32Array(n);
  let cx = 0, cy = 0, cz = 0, nl = 0, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    pos[i * 3] = d.p[i * 3] / 2000; pos[i * 3 + 1] = d.p[i * 3 + 1] / 2000; pos[i * 3 + 2] = d.p[i * 3 + 2] / 2000;
    const cc = d.pal[d.c[i]]; const lum = (cc[0] + cc[1] + cc[2]) / 3; const k = lum > 0.5 ? 0.55 : 0.8; col.set([cc[0] * k, cc[1] * k, cc[2] * k], i * 3);
    y0 = Math.min(y0, pos[i * 3 + 1]); y1 = Math.max(y1, pos[i * 3 + 1]);
    if (cc[1] > cc[0] * 1.05 && cc[1] > cc[2] * 1.05) { leaf[i] = 1; cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; nl++; }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(d.i);
  g.computeVertexNormals();
  if (nl > 8) {
    cx /= nl; cy /= nl; cz /= nl; let ex = 0, ey = 0, ez = 0;
    for (let i = 0; i < n; i++) if (leaf[i]) { ex = Math.max(ex, Math.abs(pos[i * 3] - cx)); ey = Math.max(ey, Math.abs(pos[i * 3 + 1] - cy)); ez = Math.max(ez, Math.abs(pos[i * 3 + 2] - cz)); }
    const N = g.attributes.normal;
    for (let i = 0; i < n; i++) if (leaf[i]) {
      const dx = (pos[i * 3] - cx) / (ex || 1), dy = (pos[i * 3 + 1] - cy) / (ey || 1), dz = (pos[i * 3 + 2] - cz) / (ez || 1);
      const l = Math.hypot(dx, dy, dz) || 1; const nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
      // mostly radial, a little of the facet left in for leaf-clump texture
      const rx = dx / l * 0.62 + nx * 0.38, ry = dy / l * 0.62 + ny * 0.38 + 0.15, rz = dz / l * 0.62 + nz * 0.38; const rl = Math.hypot(rx, ry, rz) || 1;
      N.setXYZ(i, rx / rl, ry / rl, rz / rl);
      leaf[i] = 0.3 + 0.7 * Math.max(0, (pos[i * 3 + 1] - y0) / ((y1 - y0) || 1));
    }
  }
  g.setAttribute('aLeaf', new THREE.BufferAttribute(leaf, 1));
  g.computeBoundingSphere();
  return g;
}
function floraMaterial() {
  const m = stdMat({ snow: true }, { vertexColors: true, roughness: 0.85 });
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh) => {
    base(sh);
    sh.vertexShader = 'attribute float aLeaf; uniform float uTime; uniform vec2 uWind; varying float vLeaf;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vLeaf = aLeaf;
      if (aLeaf > 0.0) {
        vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float ph = ip.x * 0.37 + ip.z * 0.23;
        float sw = sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.9 + ph * 1.7 + position.y * 3.0) * 0.25;
        transformed.xz += (uWind * 0.02 + uWind * sw * 0.012) * aLeaf * aLeaf / max(0.3, length(instanceMatrix[1].xyz));
        transformed.y += sin(uTime * 3.7 + ph + position.x * 9.0) * 0.004 * aLeaf;
      }`);
    sh.uniforms.uWind = U.uWind; sh.uniforms.uSun = U.uSun; sh.uniforms.uSunCol = U.uSunCol;
    // leaves let light through: crowns glow when you look toward the sun, and never go flat black in shade
    sh.fragmentShader = 'varying float vLeaf; uniform vec3 uSun; uniform vec3 uSunCol;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      if (vLeaf > 0.0) { vec3 vd = normalize(kWP - cameraPosition); float bk = pow(max(dot(vd, normalize(uSun)), 0.0), 2.5) * max(uSun.y + 0.08, 0.0);
        totalEmissiveRadiance += diffuseColor.rgb * uSunCol * (bk * 1.6 + 0.12) * smoothstep(0.0, 0.3, vLeaf); }`);
  };
  m.customProgramCacheKey = () => 'flora';
  return m;
}
export class Flora {
  constructor(scene, L, grid, seed) {
    const rng = new RNG(seed * 17 + 3); const R = () => rng.next();
    const mat = floraMaterial();
    const lists = {}; for (const k in props) lists[k] = [];
    const H = (x, z) => grid.get(x, z);
    const clear = (x, z, r) => {
      if (H(x, z) < 2.6 || z < 120 - Math.abs(x) * 0.05) return false;
      if (Math.hypot(x - 150, z - 175) < 45) return false; // keep the hero view over the beach open
      for (const rd of L.roads) if (polyDist(x, z, rd.pts) < rd.w * 0.6 + r) return false;
      for (const b of L.B) if (Math.hypot(b.x - x, b.z - z) < b.len * 0.55 + r + 1.5) return false;
      for (const f of L.fields) if (x > f.x0 - r && x < f.x1 + r && z > f.z0 - r && z < f.z1 + r) return false;
      for (const p of L.pens) if (Math.hypot(p.x - x, p.z - z) < p.r + r + 1) return false;
      for (const k of ['thing', 'practice', 'woodlot', 'godswood', 'villageBeacon', 'ring', 'pyre', 'lootPile', 'shipyard']) if (Math.hypot(L.S[k][0] - x, L.S[k][1] - z) < (k === 'godswood' ? 28 : 14) + r) return false;
      if (((x - L.PC[0]) / L.PRX) ** 2 + ((z - L.PC[1]) / L.PRZ) ** 2 < 1.15 && ((x - L.PC[0]) / L.PRX) ** 2 + ((z - L.PC[1]) / L.PRZ) ** 2 > 0.82) return false; // palisade line
      return true;
    };
    const put = (name, x, z, h, rot = R() * 6.28) => { lists[name].push([x, H(x, z) - 0.05, z, h, rot]); };
    // birch stands
    for (let c = 0; c < 34; c++) {
      const cx = R() * 760 - 380, cz = 130 + R() * 440; if (villageMask(cx, cz) < 0.3) continue;
      const n = 3 + Math.floor(R() * 7);
      for (let k = 0; k < n; k++) { const x = cx + (R() - 0.5) * 22, z = cz + (R() - 0.5) * 22; if (clear(x, z, 2)) put(R() < 0.5 ? 'BirchTree_1' : 'BirchTree_3', x, z, 8 + R() * 5); }
    }
    // broadleaf shade trees by the houses and along the stream
    for (const b of L.B) if (b.kind === 'house' && R() < 0.45) { const a = R() * 6.28, d = b.len * 0.6 + 6 + R() * 5; const x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d; if (clear(x, z, 3)) put(R() < 0.5 ? 'CommonTree_1' : 'CommonTree_3', x, z, 9 + R() * 6); }
    for (let k = 0; k < 40; k++) { const t = R(); const x = -150 + (t * 40) + (R() - 0.5) * 30, z = 140 + t * 600; if (clear(x, z, 3)) put(R() < 0.5 ? 'CommonTree_1' : 'BirchTree_1', x, z, 9 + R() * 5); }
    // bushes, berries and plants hugging walls and yard edges
    for (const b of L.B) {
      if (b.kind === 'hall') continue;
      const n = b.kind === 'house' ? 3 + Math.floor(R() * 4) : 1;
      for (let k = 0; k < n; k++) {
        const side = R() < 0.5 ? -1 : 1, along = (R() - 0.5) * b.len * 0.9, off = b.wid / 2 + 1.6 + R() * 2.5;
        const x = b.x + Math.cos(b.rot) * along + Math.sin(b.rot) * off * side, z = b.z - Math.sin(b.rot) * along + Math.cos(b.rot) * off * side;
        if (Math.hypot(x - b.door[0], z - b.door[1]) < 3) continue;
        const kind = R(); put(kind < 0.4 ? 'Bush_1' : kind < 0.7 ? 'BushBerries_1' : 'Plant_1', x, z, kind < 0.7 ? 0.9 + R() * 0.8 : 0.5 + R() * 0.4);
      }
    }
    // flower patches and mossy stones in the meadows
    for (let k = 0; k < 900 && lists.Flowers.length < 380; k++) { const x = R() * 760 - 380, z = 125 + R() * 450; if (villageMask(x, z) > 0.35 && clear(x, z, 0.6)) { const n = 2 + Math.floor(R() * 4); for (let j = 0; j < n; j++) put('Flowers', x + (R() - 0.5) * 3, z + (R() - 0.5) * 3, 0.35 + R() * 0.25); } }
    for (let k = 0; k < 600 && lists.Rock_Moss_1.length + lists.Rock_Moss_4.length < 170; k++) { const x = R() * 800 - 400, z = 120 + R() * 480; if (villageMask(x, z) > 0.15 && clear(x, z, 1)) put(R() < 0.5 ? 'Rock_Moss_1' : 'Rock_Moss_4', x, z, 0.5 + R() ** 2 * 1.8); }
    for (let k = 0; k < 70; k++) { const x = L.S.woodlot[0] + (R() - 0.5) * 70, z = L.S.woodlot[1] + (R() - 0.5) * 60; if (clear(x, z, 0.8)) put('TreeStump_Moss', x, z, 0.5 + R() * 0.4); }
    // instanced, static
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const [name, list] of Object.entries(lists)) {
      if (!list.length) continue;
      const im = new THREE.InstancedMesh(geo(props[name]), mat, list.length);
      const cc = new THREE.Color();
      list.forEach(([x, y, z, h, rot], i) => { q.setFromAxisAngle(up, rot); m4.compose(v.set(x, y, z), q, s.set(h, h, h)); im.setMatrixAt(i, m4); const r1 = R(), r2 = R(); cc.setRGB(0.82 + r1 * 0.3, 0.86 + r1 * 0.22 + r2 * 0.08, 0.8 + r2 * 0.25); im.setColorAt(i, cc); });
      im.castShadow = !/Flowers|Plant|Rock/.test(name); im.receiveShadow = true;
      scene.add(im);
    }
    this.counts = Object.fromEntries(Object.entries(lists).map(([k, l]) => [k, l.length]));
  }
}
