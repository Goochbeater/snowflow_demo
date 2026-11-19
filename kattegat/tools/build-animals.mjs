// Offline asset build: farm animals (CC0 OBJ) -> src/assets/animals.json with per-vertex colour,
// part tags (legs / head / tail) and pivots so the vertex shader can walk, graze and wag them.
//   node tools/build-animals.mjs <dir-with-OBJ-and-MTL>
import fs from 'fs';
const dir = process.argv[2];
// species: [file, real length (m), leg-top fraction of height, neck start fraction of length, tail fraction]
const SPEC = { sheep: ['Sheep', 1.25, 0.36, 0.7, 0.1], horse: ['Horse', 2.15, 0.45, 0.72, 0.08], cow: ['Cow', 2.15, 0.4, 0.8, 0.06], pig: ['Pig', 1.4, 0.3, 0.84, 0.06], dog: ['Pug', 0.8, 0.42, 0.72, 0.12] };
function parse(name) {
  const mtl = fs.readFileSync(`${dir}/${name}.mtl`, 'utf8'); const kd = {}; let cur = null;
  for (const l of mtl.split('\n')) { const p = l.trim().split(/\s+/); if (p[0] === 'newmtl') cur = p[1]; if (p[0] === 'Kd') kd[cur] = p.slice(1, 4).map(Number); }
  const obj = fs.readFileSync(`${dir}/${name}.obj`, 'utf8'); const V = []; const tris = []; let m = null;
  for (const l of obj.split('\n')) {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'v') V.push(p.slice(1, 4).map(Number));
    else if (p[0] === 'usemtl') m = p[1];
    else if (p[0] === 'f') { const ids = p.slice(1).map((q) => parseInt(q.split('/')[0], 10) - 1); for (let k = 1; k < ids.length - 1; k++) tris.push([ids[0], ids[k], ids[k + 1], m]); }
  }
  return { V, tris, kd };
}
const out = {};
for (const [key, [file, len, legF, neckF, tailF]] of Object.entries(SPEC)) {
  const { V, tris, kd } = parse(file);
  let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  for (const v of V) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); }
  const s = len / (max[2] - min[2]); const cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2;
  const P = V.map((v) => [(v[0] - cx) * s, (v[1] - min[1]) * s, (v[2] - cz) * s]);
  const H = (max[1] - min[1]) * s, legTop = H * legF, zNeck = -len / 2 + len * neckF, zTail = -len / 2 + len * tailF;
  // flat-shaded, colour per face (vertices unshared)
  const pos = [], col = [], part = [], piv = [];
  // leg centres: mean z of low vertices front/back
  const low = P.filter((p) => p[1] < legTop * 0.6);
  const zMid = low.reduce((a, p) => a + p[2], 0) / low.length;
  const lc = (front) => { const q = low.filter((p) => (p[2] > zMid) === front); return q.reduce((a, p) => a + p[2], 0) / q.length; };
  const zF = lc(true), zB = lc(false);
  for (const [a, b, c, mname] of tris) {
    const k = kd[mname] || [0.5, 0.5, 0.5];
    const cyM = (P[a][1] + P[b][1] + P[c][1]) / 3, czM = (P[a][2] + P[b][2] + P[c][2]) / 3, cxM = (P[a][0] + P[b][0] + P[c][0]) / 3;
    for (const i of [a, b, c]) {
      const p = P[i]; pos.push(...p.map((x) => +x.toFixed(4))); col.push(...k.map((x) => +x.toFixed(3)));
      let tag = 0, pv = [0, 0];
      if (cyM < legTop && !(key === 'pig' && czM > zNeck)) { const front = czM > zMid; tag = (front ? 1 : 3) + (cxM > 0 ? 0 : 1); pv = [legTop, front ? zF : zB]; }
      else if (czM > zNeck) { tag = 5; pv = [legTop + (H - legTop) * 0.45, zNeck]; }
      else if (czM < zTail) { tag = 6; pv = [cyM, zTail]; }
      part.push(tag); piv.push(+pv[0].toFixed(3), +pv[1].toFixed(3));
    }
  }
  out[key] = { pos, col, part, piv, H: +H.toFixed(3), len };
  console.log(key, 'tris', tris.length, 'H', H.toFixed(2));
}
// goats: the sheep's body with brown coat, a beard and swept horns
{
  const sh = out.sheep; const g = { pos: [...sh.pos], col: [], part: [...sh.part], piv: [...sh.piv], H: sh.H, len: sh.len };
  for (let i = 0; i < sh.col.length; i += 3) { const v = sh.col[i]; g.col.push(...(v > 0.3 ? [0.32, 0.22, 0.13] : [0.06, 0.05, 0.04])); }
  // horns: two curved tapered prisms on the head
  let hx = 0, hy = 0, hz = -1e9; for (let i = 0; i < sh.pos.length; i += 3) if (sh.part[i / 3] === 5 && sh.pos[i + 2] > hz) { hz = sh.pos[i + 2]; hy = sh.pos[i + 1]; }
  const headTopY = Math.max(...sh.pos.filter((_, i) => i % 3 === 1 && sh.part[Math.floor(i / 3)] === 5));
  for (const sx of [-1, 1]) {
    let prev = null;
    for (let k = 0; k <= 4; k++) {
      const t = k / 4, r = 0.035 * (1 - t) + 0.006;
      const c = [sx * (0.05 + 0.04 * t), headTopY - 0.02 + 0.12 * Math.sin(t * 1.4), hz - 0.17 - 0.16 * t];
      const ring = [[c[0] - r, c[1], c[2]], [c[0] + r, c[1], c[2]], [c[0], c[1] + r, c[2]]];
      if (prev) for (let q = 0; q < 3; q++) { const q2 = (q + 1) % 3; for (const tri of [[prev[q], ring[q], ring[q2]], [prev[q], ring[q2], prev[q2]]]) for (const v of tri) { g.pos.push(...v.map((x) => +x.toFixed(4))); g.col.push(0.55, 0.5, 0.42); g.part.push(5); g.piv.push(sh.piv[sh.part.indexOf(5) * 2], sh.piv[sh.part.indexOf(5) * 2 + 1]); } }
      prev = ring;
    }
  }
  out.goat = g;
}
// compact: positions in mm, colours as palette indices, pivots per part tag
const packed = {};
for (const [k, d] of Object.entries(out)) {
  const pal = [], ci = [];
  for (let i = 0; i < d.col.length; i += 3) { const key = d.col.slice(i, i + 3).join(','); let j = pal.findIndex((q) => q.join(',') === key); if (j < 0) { j = pal.length; pal.push(d.col.slice(i, i + 3)); } ci.push(j); }
  const piv = {}; d.part.forEach((t, i) => { if (!piv[t]) piv[t] = [d.piv[i * 2], d.piv[i * 2 + 1]]; });
  packed[k] = { p: d.pos.map((v) => Math.round(v * 1000)), c: ci, t: d.part, pal, piv, H: d.H, len: d.len };
}
fs.writeFileSync(new URL('../src/assets/animals.json', import.meta.url), JSON.stringify(packed));
const out2 = packed;
console.log('wrote animals.json', (JSON.stringify(out2).length / 1024).toFixed(0), 'KB');
