/* ==== p72e1_hl_occ.js ==== */
/* HOGWARTS — who stands where. One grid per storey at half a metre: walls (1), doorways and the three metres either side
   of every doorway (2) are marked before anything is furnished; furniture is only ever placed on free cells and marks
   them (3, or 5 when it stands tall against a wall); people, chests and flames take the nearest free spot (4). */
HL.occ = (function () { const S = 2, G = {};
  const grid = (k) => { if (G[k]) return G[k]; const P = HL.plan(k), NX = P.NX, NZ = P.NZ, W = NX * S, H = NZ * S, a = new Uint8Array(W * H);
    const set = (i, j, v, only0) => { if (i < 0 || j < 0 || i >= NX || j >= NZ) return; for (let b = 0; b < S; b++) for (let c = 0; c < S; c++) { const s = (j * S + b) * W + i * S + c; if (!only0 || a[s] === 0) a[s] = v; } };
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { if (P.door[j * NX + i]) set(i, j, 2); else if (P.isW(i, j)) set(i, j, 1); }
    for (const d of P.doors) { /* on the upper storeys a gap in an outer wall is glazed, not a way through: it is wall to anyone walking */ if (k > 0 && (d.dir === 1 ? (!P.rf(d.i0, d.j0 - 1) || !P.rf(d.i0, d.j1)) : (!P.rf(d.i0 - 1, d.j0) || !P.rf(d.i1, d.j0)))) { for (let j = d.j0; j < d.j1; j++) for (let i = d.i0; i < d.i1; i++) set(i, j, 1); continue; }
      if (d.dir === 1) { for (let j = d.j0 - 3; j < d.j1 + 3; j++) for (let i = d.i0 - 1; i < d.i1 + 1; i++) set(i, j, 2, true); } else { for (let i = d.i0 - 3; i < d.i1 + 3; i++) for (let j = d.j0 - 1; j < d.j1 + 1; j++) set(i, j, 2, true); } }
    return (G[k] = { a, W, H, P }); };
  const box = (x, z, hw, hd, yaw, pad) => { const c = Math.abs(Math.cos(yaw || 0)), s = Math.abs(Math.sin(yaw || 0)), ex = hw * c + hd * s + (pad || 0), ez = hw * s + hd * c + (pad || 0), X0 = HL.PL.X0, Z0 = HL.PL.Z0; return [Math.floor((X0 - x - ex) * S + 1e-6), Math.ceil((X0 - x + ex) * S - 1e-6) - 1, Math.floor((Z0 - z - ez) * S + 1e-6), Math.ceil((Z0 - z + ez) * S - 1e-6) - 1]; };
  const free = (k, x, z, hw, hd, yaw, pad) => { const g = grid(k), b = box(x, z, hw, hd, yaw, pad); if (b[0] < 0 || b[2] < 0 || b[1] >= g.W || b[3] >= g.H) return false; for (let j = b[2]; j <= b[3]; j++) for (let i = b[0]; i <= b[1]; i++) if (g.a[j * g.W + i]) return false; return true; };
  const mark = (k, x, z, hw, hd, yaw, v) => { const g = grid(k), b = box(x, z, hw, hd, yaw, 0); for (let j = Math.max(0, b[2]); j <= Math.min(g.H - 1, b[3]); j++) for (let i = Math.max(0, b[0]); i <= Math.min(g.W - 1, b[1]); i++) if (g.a[j * g.W + i] !== 1 && !(g.a[j * g.W + i] === 6 && v !== 6)) g.a[j * g.W + i] = v || 3; return b; };
  const put = (k, x, z, hw, hd, yaw, pad, v) => free(k, x, z, hw, hd, yaw, pad) ? (mark(k, x, z, hw, hd, yaw, v), true) : false;
  const at = (k, x, z) => { const g = grid(k), i = Math.floor((HL.PL.X0 - x) * S), j = Math.floor((HL.PL.Z0 - z) * S); return i < 0 || j < 0 || i >= g.W || j >= g.H ? 1 : g.a[j * g.W + i]; };
  /* the nearest free place for something of radius r, searched outward from (x, z); it is then taken */
  const spot = (k, x, z, r, maxR, v) => { for (let rr = 0; rr <= (maxR || 6); rr += 0.5) { const n = rr ? Math.ceil(rr * 5) : 1; for (let q = 0; q < n; q++) { const a2 = q / n * TAU + rr, px = x + Math.cos(a2) * rr, pz = z + Math.sin(a2) * rr; if (free(k, px, pz, r, r, 0, 0.2)) { mark(k, px, pz, r, r, 0, v || 4); return [px, pz]; } } } return null; };
  return { S, grid, box, free, mark, put, at, spot, G };
})();
/* A way across one storey for a walking body: breadth-first over the half-metre grid, keeping a cell clear of walls and
   furniture on every side. Returns points a couple of paces apart, or null. Used by the walking tests (the bot that plays the castle). */
HL.occ.path = function (k, ax, az, bx, bz) { const g = HL.occ.grid(k), W = g.W, H = g.H, P = g.P, X0 = HL.PL.X0, Z0 = HL.PL.Z0, blocked = (v) => v === 1 || v === 3 || v === 5 || v === 6;
  const floor = (i, j) => { const pi = i >> 1, pj = j >> 1; if (P.ind(pi, pj)) return true; if (k > 0) return false; const ch = P.at(pi, pj); return ch === 'P' || ch === 'F' || ch === 'c'; };
  const ok = (i, j) => { if (i < 1 || j < 1 || i >= W - 1 || j >= H - 1 || !floor(i, j)) return false; for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) if (blocked(g.a[(j + b) * W + i + a2])) return false; return true; };
  const snap = (x, z) => { const i0 = Math.floor((X0 - x) * 2), j0 = Math.floor((Z0 - z) * 2); for (let r = 0; r < 18; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && ok(i0 + di, j0 + dj)) return [i0 + di, j0 + dj]; return null; };
  const A = snap(ax, az), B = snap(bx, bz); if (!A || !B) return null; const par = new Int32Array(W * H).fill(-1), q = [A[1] * W + A[0]]; par[q[0]] = q[0]; const goal = B[1] * W + B[0]; let found = false;
  for (let h = 0; h < q.length; h++) { const s = q[h]; if (s === goal) { found = true; break; } const i = s % W, j = (s / W) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj, t = nj * W + ni; if (par[t] >= 0 || !ok(ni, nj)) continue; par[t] = s; q.push(t); } }
  if (!found) return null; const cells = []; for (let s = goal; ; s = par[s]) { cells.push(s); if (par[s] === s) break; } cells.reverse(); const pts = [];
  for (let n = 3; n < cells.length; n += 3) pts.push([X0 - (cells[n] % W + 0.5) / 2, Z0 - (((cells[n] / W) | 0) + 0.5) / 2]); const e = cells[cells.length - 1]; pts.push([X0 - (e % W + 0.5) / 2, Z0 - (((e / W) | 0) + 0.5) / 2]); return pts; };
/* Everywhere a walking body can get to on one storey from (x, z): a flood over the same grid and with the same clearance as HL.occ.path.
   near(x, z, r) says whether some reachable cell lies within r of a point — "can the player walk up to this?" */
HL.occ.flood = function (k, sx, sz) { const g = HL.occ.grid(k), W = g.W, H = g.H, P = g.P, X0 = HL.PL.X0, Z0 = HL.PL.Z0, blocked = (v) => v === 1 || v === 3 || v === 5 || v === 6;
  const floor = (i, j) => { const pi = i >> 1, pj = j >> 1; if (P.ind(pi, pj)) return true; if (k > 0) return false; const ch = P.at(pi, pj); return ch === 'P' || ch === 'F' || ch === 'c'; };
  const ok = (i, j) => { if (i < 1 || j < 1 || i >= W - 1 || j >= H - 1 || !floor(i, j)) return false; for (let b = -1; b <= 1; b++) for (let a2 = -1; a2 <= 1; a2++) if (blocked(g.a[(j + b) * W + i + a2])) return false; return true; };
  const seen = new Uint8Array(W * H); let i0 = Math.floor((X0 - sx) * 2), j0 = Math.floor((Z0 - sz) * 2), st = null; for (let r = 0; r < 18 && !st; r++) for (let dj = -r; dj <= r && !st; dj++) for (let di = -r; di <= r && !st; di++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && ok(i0 + di, j0 + dj)) st = (j0 + dj) * W + i0 + di;
  if (st !== null) { const q = [st]; seen[st] = 1; for (let h = 0; h < q.length; h++) { const s = q[h], i = s % W, j = (s / W) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const t = (j + dj) * W + i + di; if (!seen[t] && ok(i + di, j + dj)) { seen[t] = 1; q.push(t); } } } }
  return { seen, near: (x, z, r) => { const ci = Math.floor((X0 - x) * 2), cj = Math.floor((Z0 - z) * 2), n = Math.ceil(r * 2); for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) { if (di * di + dj * dj > n * n) continue; const i = ci + di, j = cj + dj; if (i >= 0 && j >= 0 && i < W && j < H && seen[j * W + i]) return true; } return false; } }; };
/* the bot's legs: W held, the camera turned toward each point in turn; the world is stepped without being drawn */
HL.botWalk = function (pts, o) { o = o || {}; const a = PLAYER.a; MG.noRender = true; IN.fireKey('KeyW', true); let ok = true, at = -1, steps = 0;
  for (let n = 0; n < pts.length && ok; n++) { const x = pts[n][0], z = pts[n][1]; let still = 0, lx = 1e9, lz = 1e9, done = false; for (let st = 0; st < (o.max || 700); st++) { const yaw = Math.atan2(x - a.x, z - a.z); CAM.yaw = yaw; a.yaw = yaw; MG.tick(1 / 60); steps++; if (Math.hypot(a.x - x, a.z - z) < (o.tol || 0.85)) { done = true; break; } if (Math.hypot(a.x - lx, a.z - lz) < 0.004) { if (++still > 45) break; } else still = 0; lx = a.x; lz = a.z; } if (!done) { ok = false; at = n; } }
  IN.fireKey('KeyW', false); MG.tick(1 / 60); MG.noRender = false; return { ok, at, steps, x: +a.x.toFixed(1), y: +(a.y - HL.Y0).toFixed(1), z: +a.z.toFixed(1) }; };
