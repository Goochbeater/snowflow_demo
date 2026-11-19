// Offline asset build: selected CC0 nature models (OBJ+MTL) -> src/assets/props.json
//   node tools/build-props.mjs <dir-with-OBJ-and-MTL>
import fs from 'fs';
const dir = process.argv[2];
const PICK = ['BirchTree_1', 'BirchTree_3', 'CommonTree_1', 'CommonTree_3', 'Bush_1', 'BushBerries_1', 'Flowers', 'Plant_1', 'Rock_Moss_1', 'Rock_Moss_4', 'TreeStump_Moss'];
const out = {};
for (const name of PICK) {
  const mtl = fs.readFileSync(`${dir}/${name}.mtl`, 'utf8'); const kd = {}; let cur = null;
  for (const l of mtl.split('\n')) { const p = l.trim().split(/\s+/); if (p[0] === 'newmtl') cur = p[1]; if (p[0] === 'Kd') kd[cur] = p.slice(1, 4).map(Number); }
  const V = [], tris = []; let m = null;
  for (const l of fs.readFileSync(`${dir}/${name}.obj`, 'utf8').split('\n')) {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'v') V.push(p.slice(1, 4).map(Number)); else if (p[0] === 'usemtl') m = p[1];
    else if (p[0] === 'f') { const ids = p.slice(1).map((q) => parseInt(q.split('/')[0], 10) - 1); for (let k = 1; k < ids.length - 1; k++) tris.push([ids[0], ids[k], ids[k + 1], m]); }
  }
  let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  for (const v of V) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); }
  const H = max[1] - min[1], cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2;
  const pal = [], p = [], c = [], idx = [], map = new Map();
  for (const [a, b, d, mn] of tris) {
    const k = (kd[mn] || [0.5, 0.5, 0.5]).map((x) => +x.toFixed(3)); const key = k.join(','); let j = pal.findIndex((q) => q.join(',') === key); if (j < 0) { j = pal.length; pal.push(k); }
    for (const i of [a, b, d]) {
      const q = [Math.round(((V[i][0] - cx) / H) * 2000), Math.round(((V[i][1] - min[1]) / H) * 2000), Math.round(((V[i][2] - cz) / H) * 2000)];
      const vk = q.join(',') + '|' + j; let vi = map.get(vk);
      if (vi === undefined) { vi = c.length; map.set(vk, vi); p.push(...q); c.push(j); }
      idx.push(vi);
    }
  }
  out[name] = { p, c, pal, i: idx }; // unit height (1/2000 steps), base at y=0
  console.log(name, tris.length, 'tris');
}
fs.writeFileSync(new URL('../src/assets/props.json', import.meta.url), JSON.stringify(out));
console.log('wrote props.json', (JSON.stringify(out).length / 1024).toFixed(0), 'KB');
