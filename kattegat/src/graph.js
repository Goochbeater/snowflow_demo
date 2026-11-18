// Walk-graph: roads, lanes, doors, beach mesh, docks, hall steps, palisade walk, scaffolds.
import { resample } from './util.js';

export class WalkGraph {
  constructor() { this.x = []; this.z = []; this.y = []; this.adj = []; this.tag = []; this.cell = new Map(); this.cache = new Map(); }
  key(x, z) { return ((Math.floor(x / 10) + 500) * 2000 + (Math.floor(z / 10) + 500)); }
  add(x, z, y = NaN, tag = 0) {
    const id = this.x.length;
    this.x.push(x); this.z.push(z); this.y.push(y); this.adj.push([]); this.tag.push(tag);
    const k = this.key(x, z); if (!this.cell.has(k)) this.cell.set(k, []); this.cell.get(k).push(id);
    return id;
  }
  link(a, b) { if (a === b || this.adj[a].includes(b)) return; this.adj[a].push(b); this.adj[b].push(a); }
  nearest(x, z, maxR = 400, filter = null) {
    let best = -1, bd = 1e18;
    for (let r = 1; r <= Math.ceil(maxR / 10); r++) {
      const cx = Math.floor(x / 10), cz = Math.floor(z / 10);
      for (let i = cx - r; i <= cx + r; i++) for (let j = cz - r; j <= cz + r; j++) {
        if (Math.abs(i - cx) !== r && Math.abs(j - cz) !== r && r > 1) continue;
        const l = this.cell.get((i + 500) * 2000 + (j + 500)); if (!l) continue;
        for (const id of l) {
          if (filter && !filter(id)) continue;
          const d = (this.x[id] - x) ** 2 + (this.z[id] - z) ** 2; if (d < bd) { bd = d; best = id; }
        }
      }
      if (best >= 0 && Math.sqrt(bd) < r * 10 - 10) break;
    }
    return best;
  }
  addLine(pts, step = 6, y = null, tag = 0, snap = 3.5) {
    const rs = resample(pts, step); const ids = [];
    for (let i = 0; i < rs.length; i++) {
      const [x, z] = rs[i];
      let id = -1;
      if (snap > 0) {
        const n = this.nearest(x, z, 20, (k) => isNaN(this.y[k]) === (y === null));
        if (n >= 0 && Math.hypot(this.x[n] - x, this.z[n] - z) < snap) id = n;
      }
      if (id < 0) id = this.add(x, z, y === null ? NaN : (typeof y === 'function' ? y(x, z, i) : y), tag);
      if (ids.length) this.link(ids[ids.length - 1], id);
      ids.push(id);
    }
    return ids;
  }
  connect(x, z, step = 6, y = NaN, tag = 0) { // add a spur from point to nearest node
    const n = this.nearest(x, z, 400, (k) => isNaN(this.y[k]));
    const id = this.add(x, z, y, tag);
    const d = Math.hypot(this.x[n] - x, this.z[n] - z);
    const m = Math.floor(d / step);
    let prev = id;
    for (let i = 1; i <= m; i++) {
      const t = i / (m + 1);
      const k = this.add(x + (this.x[n] - x) * t, z + (this.z[n] - z) * t);
      this.link(prev, k); prev = k;
    }
    this.link(prev, n);
    return id;
  }
  path(a, b) {
    if (a === b || b === undefined || b < 0 || a < 0 || a === undefined) return [a >= 0 ? a : b];
    const ck = a * 65536 + b;
    const c = this.cache.get(ck); if (c) return c;
    const N = this.x.length;
    const g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = [[0, a]]; g[a] = 0;
    const bx = this.x[b], bz = this.z[b];
    while (heap.length) {
      // binary heap pop
      const top = heap[0]; const last = heap.pop();
      if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } }
      const u = top[1]; if (closed[u]) continue; closed[u] = 1;
      if (u === b) break;
      for (const v of this.adj[u]) {
        if (closed[v]) continue;
        const ng = g[u] + Math.hypot(this.x[u] - this.x[v], this.z[u] - this.z[v]);
        if (ng < g[v]) {
          g[v] = ng; from[v] = u;
          const f = ng + Math.hypot(this.x[v] - bx, this.z[v] - bz);
          heap.push([f, v]); let i = heap.length - 1;
          while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; }
        }
      }
    }
    const out = [];
    if (from[b] < 0) { out.push(a, b); } else { let u = b; while (u !== -1) { out.push(u); u = from[u]; } out.reverse(); }
    if (this.cache.size > 20000) this.cache.clear();
    this.cache.set(ck, out);
    return out;
  }
}

export function buildGraph(L, grid) {
  const G = new WalkGraph();
  const H = (x, z) => grid.get(x, z);
  for (const r of L.roads) G.addLine(r.pts, r.kind === 'path' ? 7 : 6);
  // open beach mesh for crowds
  const beach = [];
  for (let x = -150; x <= 215; x += 9) {
    for (let z = 66; z <= 112; z += 8) {
      if (H(x, z) < 0.15) continue;
      const id = G.add(x, z, NaN, 1); beach.push(id);
    }
  }
  for (const a of beach) for (const b of beach) if (a < b && Math.hypot(G.x[a] - G.x[b], G.z[a] - G.z[b]) < 12.5) G.link(a, b);
  for (const a of beach) { const n = G.nearest(G.x[a], G.z[a], 30, (k) => G.tag[k] === 0 && isNaN(G.y[k])); if (n >= 0 && Math.hypot(G.x[a] - G.x[n], G.z[a] - G.z[n]) < 10) G.link(a, n); }
  // waterline nodes at each beach slot (where ships ground)
  const slotNodes = L.slots.map((s) => G.connect(s.x, s.z + 4, 5));
  // doors
  const doorNodes = L.B.map((b) => {
    const id = G.connect(b.door[0], b.door[1], 6);
    // inside node
    const inside = G.add(b.x, b.z, NaN, 2); G.link(inside, id);
    return { door: id, inside };
  });
  // hall steps and interior
  const hallB = L.B[0];
  // piers (elevated)
  const pierW = G.addLine([[-182, 100], [-182, 70], [-182, 30], [-182, 6]], 6, 1.6, 3, 0);
  G.link(pierW[0], G.nearest(-182, 104, 40, (k) => isNaN(G.y[k])));
  const pierE = G.addLine([[222, 104], [222, 70], [226, 30], [230, 0]], 6, 1.6, 3, 0);
  G.link(pierE[0], G.nearest(222, 108, 40, (k) => isNaN(G.y[k])));
  // palisade walk (elevated ring), joined at the gates by ladders
  const PC = L.PC;
  const walk = G.addLine(L.pal.map(([x, z]) => [PC[0] + (x - PC[0]) * 0.97, PC[1] + (z - PC[1]) * 0.97]), 8, (x, z) => H(x, z) + 2.6, 4, 0);
  for (const g of L.gates) {
    const wn = G.nearest(g[0], g[1], 60, (k) => G.tag[k] === 4);
    const gn = G.nearest(g[0], g[1], 60, (k) => isNaN(G.y[k]));
    if (wn >= 0 && gn >= 0) G.link(wn, gn);
  }
  // shipwright scaffold
  const scaff = G.addLine([[-275, 80], [-268, 80], [-261, 80], [-254, 80]], 6, H(-262, 80) + 2.2, 5, 0);
  G.link(scaff[0], G.nearest(-278, 92, 40, (k) => isNaN(G.y[k])));
  // named site nodes
  const site = {};
  for (const k in L.S) {
    const [x, z] = L.S[k];
    if (k === 'hall') { site[k] = doorNodes[0].inside; continue; }
    site[k] = G.connect(x, z, 6);
  }
  const bonfireNodes = L.bonfires.map((b) => G.connect(b.x, b.z - 3.5, 5));
  const feastNodes = L.feastSpots.map((f) => G.connect(f.x, f.z - 1.6, 5));
  const beaconNodes = L.beacons.map((b) => (b.village || b.lookout ? G.connect(b.x, b.z + 2, 6) : -1));
  const torchNodes = L.torches.map((t) => G.nearest(t.x, t.z, 50, (k) => G.tag[k] === 4 || isNaN(G.y[k])));
  // make sure the whole graph is one connected component
  const N = G.x.length, comp = new Int32Array(N).fill(-1); let nc = 0; const sizes = [];
  for (let i = 0; i < N; i++) {
    if (comp[i] >= 0) continue; const st = [i]; comp[i] = nc; let sz = 0;
    while (st.length) { const u = st.pop(); sz++; for (const v of G.adj[u]) if (comp[v] < 0) { comp[v] = nc; st.push(v); } }
    sizes.push(sz); nc++;
  }
  const main = sizes.indexOf(Math.max(...sizes));
  for (let c = 0; c < nc; c++) {
    if (c === main) continue;
    let ba = -1, bb = -1, bd = 1e18;
    for (let i = 0; i < N; i++) if (comp[i] === c) for (let j = 0; j < N; j++) if (comp[j] === main) {
      const d = (G.x[i] - G.x[j]) ** 2 + (G.z[i] - G.z[j]) ** 2; if (d < bd) { bd = d; ba = i; bb = j; }
    }
    if (ba >= 0) G.link(ba, bb);
  }
  return { G, beach, slotNodes, doorNodes, pierW, pierE, walk, scaff, site, bonfireNodes, feastNodes, beaconNodes, torchNodes };
}
