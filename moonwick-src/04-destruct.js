// ===== 04-destruct: blasts, structural collapse, falling masonry, rubble, anchors, score  (OWNER: coordinator) =====
// AF.boom carves a jagged hole (soft things break further out than stone), scorches and lights the rim, craters the ground and
// throws rubble. Then the STRUCTURE pass runs: (1) anything no longer connected to the ground (searched on the 1 m occupancy
// grid) comes down; (2) any registered structure with a storey that has lost more than half its material drops everything
// above that storey. What comes down is cut into ~3 m pieces that fall, punch through what is under them and end as rubble.
{
  const W = AF.W, P = AF.PAL, M = AF.MAT, MP = AF.MATP, rnd = Math.random, rs = (a) => (rnd() * 2 - 1) * a;
  const MX = W.MX, MY = W.MY, MZ = W.MZ, NZ = W.NZ, NX = W.NX;
  // ---- score + alert
  AF.score = { slain: 0, soldiers: 0, civilians: 0, structures: 0, ships: 0, mounts: 0, voxels: 0, burnt: 0, add(k, n = 1) { this[k] = (this[k] || 0) + n; AF.emit('score', k, n); } };
  AF.alert = { level: 0, t: 0, why: '' };          // 0 peace · 1 alarm (dragon sighted) · 2 siege (the city is under attack)
  AF.setAlert = (level, why) => { if (level <= AF.alert.level) return; AF.alert.level = level; AF.alert.t = AF.clock.t; AF.alert.why = why || ''; AF.emit('alert', level, why); };
  // ---- the dragon (the dragon part fills this in; everyone else reads it)
  AF.dragon = { pos: new THREE.Vector3(0, 80, 400), vel: new THREE.Vector3(0, 0, -30), fwd: new THREE.Vector3(0, 0, -1), mouth: new THREE.Vector3(0, 80, 396), hp: 1000, maxHp: 1000, alive: true, radius: 4.5, breathing: false,
    hit(dmg, info) { if (!this.alive) return; this.hp = Math.max(0, this.hp - dmg); AF.emit('dragon-hit', dmg, info || {}); if (this.hp <= 0) { this.alive = false; AF.emit('dragon-down'); } } };
  AF.shake = (amount, x, y, z) => AF.emit('shake', { amount, x, y, z });

  // ---- support + anchors
  AF.supported = (x, y, z) => {
    if (y - W.groundY(x, z) < 0.4) return true;
    const bx = W.bx(x), by = W.by(y), bz = W.bz(z);
    for (let d = 1; d <= 2; d++) if (W.get(bx, by - d, bz)) return true;
    return !!(W.get(bx + 1, by, bz) || W.get(bx - 1, by, bz) || W.get(bx, by, bz + 1) || W.get(bx, by, bz - 1) || W.get(bx, by, bz));
  };
  AF.anchors = [];
  AF.anchor = (a) => { a.r = a.r ?? 1; a.dead = false; AF.anchors.push(a); return a; };
  AF.loseAnchor = (a, reason) => { if (a.dead) return; a.dead = true; try { a.onLost && a.onLost(reason); } catch (e) { console.error('[af] anchor', e); } };
  AF.dyn = (obj, x, y, z, o = {}) => {
    if (!obj.parent) AF.scene.add(obj);
    return AF.anchor({ x, y, z, r: o.r ?? 1.2, obj, onLost(reason) { if (obj.parent) obj.parent.remove(obj); obj.visible = false; AF.fx.debris(x, y + 0.5, z, { n: o.n ?? 10, pal: o.pal || [AF.DK.plank, AF.DK.oak], speed: 5 }); if (o.onLost) o.onLost(reason); } });
  };
  let anchorScan = 0;
  AF.onTick('anchors', 860, () => {
    const L = AF.anchors; if (!L.length) return;
    for (let i = 0; i < 40; i++) { const a = L[anchorScan++ % L.length]; if (!a.dead && !AF.supported(a.x, a.y, a.z)) AF.loseAnchor(a, 'fall'); }
    if (AF.clock.frame % 600 === 0) AF.anchors = L.filter((a) => !a.dead);
  });
  const sweepLoose = (x0, y0, z0, x1, y1, z1) => {   // metres box: props, anchors and lights that lost their footing
    for (const a of AF.anchors) if (!a.dead && a.x >= x0 && a.x <= x1 && a.y >= y0 && a.y <= y1 + 2 && a.z >= z0 && a.z <= z1 && !AF.supported(a.x, a.y, a.z)) AF.loseAnchor(a, 'fall');
    for (const l of AF.lights) if (!l.dead && l.x >= x0 && l.x <= x1 && l.y >= y0 && l.y <= y1 + 3 && l.z >= z0 && l.z <= z1 && !AF.supported(l.x, l.y, l.z) && !AF.supported(l.x, l.y + 0.6, l.z)) l.dead = true;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, r = Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 1;
    AF.propsNear(cx, cy, cz, r, (pr) => { if (pr.x < x0 - 0.5 || pr.x > x1 + 0.5 || pr.y < y0 - 0.5 || pr.y > y1 + 2 || pr.z < z0 - 0.5 || pr.z > z1 + 0.5) return; if (!AF.supported(pr.x, pr.y + 0.1, pr.z)) { AF.killProp(pr); if (rnd() < 0.5) AF.fx.debris(pr.x, pr.y + 0.3, pr.z, { n: 3, pal: [AF.DK.plank, AF.DK.oak, AF.DK.wallDark], speed: 3 }); } });
  };

  // ---- quiet sphere removal (no effects)
  AF.carve = (x, y, z, r) => {
    const bx0 = W.bx(x - r), bx1 = W.bx(x + r), by0 = W.by(y - r), by1 = W.by(y + r), bz0 = W.bz(z - r), bz1 = W.bz(z + r), r2 = (r * 4) * (r * 4);
    const cx = (x - W.X0) * 4, cy = (y - W.Y0) * 4, cz = (z - W.Z0) * 4;
    let n = 0;
    for (let bx = bx0; bx <= bx1; bx++) for (let by = by0; by <= by1; by++) for (let bz = bz0; bz <= bz1; bz++) {
      const dx = bx + 0.5 - cx, dy = by + 0.5 - cy, dz = bz + 0.5 - cz;
      if (dx * dx + dy * dy + dz * dz <= r2 && W.get(bx, by, bz)) { W.set(bx, by, bz, 0); n++; }
    }
    return n;
  };

  // ---- THE BLAST
  const checks = [];     // structure checks waiting: {x0..z1 (metres), t}
  const queueCheck = (x0, y0, z0, x1, y1, z1, t = 0.12) => {
    for (const c of checks) if (x0 >= c.x0 - 2 && x1 <= c.x1 + 2 && y0 >= c.y0 - 2 && y1 <= c.y1 + 2 && z0 >= c.z0 - 2 && z1 <= c.z1 + 2) return;
    if (checks.length < 40) checks.push({ x0, y0, z0, x1, y1, z1, t });
  };
  AF.WEAK = +(AF.Q.get('weak') || 0.7);      // a storey that keeps less than this share of its material lets go of everything above it
  AF.boom = (x, y, z, o = {}) => {
    const own = o.by === 'cannon' || o.by === 'pitch' || o.by === 'garrison' || o.by === 'catapult';      // a defender's miss: it breaks things, it never burns the city or sets off its powder (nothing happens that the player did not cause)
    const r = o.r ?? 5.5, power = o.power ?? 1, fireK = own ? 0 : (o.fire ?? 1), R = r * 1.34 + 0.5, F = AF.fire;
    if (AF.isSea && y < AF.PLAN.SEA_Y + 0.3 && AF.isSea(x, z)) y = AF.PLAN.SEA_Y + 0.3;      // a blast in the water happens at the surface
    const bx0 = W.bx(x - R), bx1 = W.bx(x + R), by0 = Math.max(0, W.by(y - R)), by1 = Math.min(W.NY - 1, W.by(y + R)), bz0 = W.bz(z - R), bz1 = W.bz(z + R);
    const cx = (x - W.X0) * 4, cy = (y - W.Y0) * 4, cz = (z - W.Z0) * 4, ir = 1 / (r * 4);
    const pals = []; let removed = 0;
    const CY = W.NY >> 4, CZ = NZ >> 4;
    for (let bx = Math.max(0, bx0); bx <= Math.min(NX - 1, bx1); bx++) {
      const dx = bx + 0.5 - cx;
      for (let bz = Math.max(0, bz0); bz <= Math.min(NZ - 1, bz1); bz++) {
        const dz = bz + 0.5 - cz, dh2 = dx * dx + dz * dz;
        for (let by = by0; by <= by1; by++) {
          if ((by & 15) === 0 || by === by0) { if (!W.chunks[((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4)]) { by = (by | 15); continue; } }
          const c = W.get(bx, by, bz); if (!c) continue;
          const dy = by + 0.5 - cy, d = Math.sqrt(dh2 + dy * dy) * ir; if (d > 1.34) continue;
          const mat = P.mat[c], f = 1.26 - 0.38 * MP[mat].tough, dj = d + (AF.hash3(bx >> 1, by >> 1, bz >> 1) - 0.5) * 0.24;
          if (dj < f) {
            if (mat === M.explosive && o.by !== 'chain') { if (own) continue; F.detonate(0, bx, by, bz); continue; }
            W.set(bx, by, bz, 0); removed++;
            if (mat !== M.fire) { if (pals.length < 48) pals.push(c); else if (rnd() < 0.01) pals[(rnd() * 48) | 0] = c; }
          } else if (dj < f + 0.3) {
            if (mat === M.explosive) { if (!own) F.detonate(0, bx, by, bz); }
            else if (MP[mat].burn > 0) { if (rnd() < 0.7 * fireK) F.lightVoxel(0, bx, by, bz, c); }
            else if (mat === M.glass) W.set(bx, by, bz, 0);
            else if (mat !== M.fire && mat !== M.char && rnd() < 0.8) { const s = AF.sootOf(c); if (s !== c) W.set(bx, by, bz, s); }
          }
        }
      }
    }
    // crater + scorch
    const gy = W.groundY(x, z), sea = AF.PLAN.SEA_Y, overWater = gy < sea - 0.2;
    if (!overWater && y - gy < r * 0.95) {
      const depth = Math.min(2.6, r * 0.42) * (1 - Math.max(0, y - gy) / (r * 0.95)), mud = AF.sootOf(AF.DK.dirt), RR = r * 1.05;
      const a0 = W.bx(x - RR), a1 = W.bx(x + RR), d0 = W.bz(z - RR), d1 = W.bz(z + RR);
      for (let bx = Math.max(0, a0); bx <= Math.min(NX - 1, a1); bx++) for (let bz = Math.max(0, d0); bz <= Math.min(NZ - 1, d1); bz++) {
        const dd = Math.hypot(bx + 0.5 - cx, bz + 0.5 - cz) * ir; if (dd >= 1) continue;
        const i = bx * NZ + bz, dep = depth * (1 - dd * dd) + (AF.hash2(bx >> 1, bz >> 1) - 0.5) * 0.5;
        const nh = W.H[i] - Math.max(0, Math.round(dep * 4));
        W.setH(bx, bz, nh, dd < 0.75 ? (rnd() < 0.3 ? AF.sootOf(AF.DK.rockDark) : mud) : AF.sootOf(W.C[i]));
      }
      F.scorchGround(x, z, r * 1.7, 0.7);
    } else if (overWater && y < sea + 1.6) AF.fx.splash(x, z, { size: r * 0.45 });
    AF.score.add('voxels', removed);
    for (const a of AF.anchors) if (!a.dead && Math.hypot(a.x - x, a.y - y, a.z - z) < r + a.r) AF.loseAnchor(a, 'blast');
    AF.propsNear(x, y, z, r * 1.15, (pr) => AF.killProp(pr));
    for (const l of AF.lights) if (!l.dead && Math.hypot(l.x - x, l.y - y, l.z - z) < r * 1.2) l.dead = true;
    if (!o.silent) AF.fx.explosion(x, y, z, r, pals);
    if (AF.ships.blast && !own) AF.ships.blast(x, y, z, r, power, fireK);
    W.burst = 14; W.urgentNear(x, y, z);
    queueCheck(x - R - 1, y - R - 1, z - R - 1, x + R + 1, y + R + 1, z + R + 1, 0.1);
    if ((o.by || 'dragon') === 'dragon' && removed > 2200 && AF.playing && AF.slowmo && AF.clock.t - (AF._slowT || -9) > 4.5) { AF._slowT = AF.clock.t; AF.slowmo(0.4, 0.75); }
    AF.emit('boom', { x, y, z, r, power, by: o.by || 'dragon', fire: fireK, removed });
    AF.shake(r * 0.22 * power, x, y, z);
    return removed;
  };

  // ---- STRUCTURE
  let mark = null, marked = null, mcount = 0, stack = null, comp = null;
  const CAPN = 160000;
  const ensure = () => { if (!mark) { mark = new Uint8Array(MX * MY * MZ); marked = new Int32Array(900000); stack = new Int32Array(900000); comp = new Int32Array(CAPN + 16); } };
  const groundedCell = (mx, my, mz) => {
    const bx = mx * 4, bz = mz * 4, H = W.H;
    const h = Math.max(H[bx * NZ + bz], H[(bx + 3) * NZ + bz], H[bx * NZ + bz + 3], H[(bx + 3) * NZ + bz + 3], H[(bx + 2) * NZ + bz + 2]);
    return (my - 16) * 4 <= h + 1;       // cell bottom (blocks above y=0) at or under the ground top (+1 block)
  };
  // returns number of cells of a floating component (in comp[]) or 0
  const probe = (seed) => {
    const occ = W.occ; let sp = 0, cn = 0, found = false; const m0 = mcount;
    stack[sp++] = seed; mark[seed] = 1; marked[mcount++] = seed;
    while (sp > 0) {
      const i = stack[--sp]; comp[cn++] = i;
      const mz = i % MZ, my = ((i / MZ) | 0) % MY, mx = (i / (MY * MZ)) | 0;
      if (groundedCell(mx, my, mz) || cn >= CAPN || mcount > 880000) { found = true; break; }
      // push order: up, sides, down (down is popped first)
      let nb;
      if (my < MY - 1) { nb = i + MZ; if (occ[nb]) { const k = mark[nb]; if (k === 2) { found = true; break; } if (!k) { mark[nb] = 1; marked[mcount++] = nb; stack[sp++] = nb; } } }
      if (mx > 0) { nb = i - MY * MZ; if (occ[nb]) { const k = mark[nb]; if (k === 2) { found = true; break; } if (!k) { mark[nb] = 1; marked[mcount++] = nb; stack[sp++] = nb; } } }
      if (mx < MX - 1) { nb = i + MY * MZ; if (occ[nb]) { const k = mark[nb]; if (k === 2) { found = true; break; } if (!k) { mark[nb] = 1; marked[mcount++] = nb; stack[sp++] = nb; } } }
      if (mz > 0) { nb = i - 1; if (occ[nb]) { const k = mark[nb]; if (k === 2) { found = true; break; } if (!k) { mark[nb] = 1; marked[mcount++] = nb; stack[sp++] = nb; } } }
      if (mz < MZ - 1) { nb = i + 1; if (occ[nb]) { const k = mark[nb]; if (k === 2) { found = true; break; } if (!k) { mark[nb] = 1; marked[mcount++] = nb; stack[sp++] = nb; } } }
      if (my > 0) { nb = i - MZ; if (occ[nb]) { const k = mark[nb]; if (k === 2) { found = true; break; } if (!k) { mark[nb] = 1; marked[mcount++] = nb; stack[sp++] = nb; } } }
    }
    if (found) { for (let k = m0; k < mcount; k++) mark[marked[k]] = 2; return 0; }
    for (let k = 0; k < cn; k++) mark[comp[k]] = 3;
    return cn;
  };
  // structure baselines
  const sBox = (s) => { const b = s.box; return [Math.max(0, Math.floor((Math.min(b[0], b[3]) + 300))), Math.max(0, Math.floor(Math.min(b[1], b[4]) + 16)), Math.max(0, Math.floor(Math.min(b[2], b[5]) + 300)), Math.min(MX, Math.ceil(Math.max(b[0], b[3]) + 300)), Math.min(MY, Math.ceil(Math.max(b[1], b[4]) + 16)), Math.min(MZ, Math.ceil(Math.max(b[2], b[5]) + 300))]; };
  const layerCount = (m, my) => { const occ = W.occ; let n = 0; for (let mx = m[0]; mx < m[3]; mx++) { const o = (mx * MY + my) * MZ; for (let mz = m[2]; mz < m[5]; mz++) if (occ[o + mz]) n++; } return n; };
  const baseline = (s) => { const m = s.m = sBox(s); s.base = new Int16Array(Math.max(0, m[4] - m[1])); let tot = 0; for (let my = m[1]; my < m[4]; my++) { const c = layerCount(m, my); s.base[my - m[1]] = c; tot += c; } s.total0 = tot; s.left = 1; };
  AF.on('ready', () => { const t = performance.now(); for (const s of AF.structures) baseline(s); AF.stats.structMs = Math.round(performance.now() - t); });
  AF.struct = { checks, ruin: 0, fallen: 0 };
  const burntCells = new Set();
  AF.struct.burnt = (bx, by, bz) => { if (burntCells.size < 4000) burntCells.add(((bx >> 2) * MY + (by >> 2)) * MZ + (bz >> 2)); };

  // ---- pieces of falling masonry
  const pieces = [], pendingPieces = [];   // pending: {cells:[macro idx], cx,cy,cz centroid, minY, info}
  const MAXP = 520;
  const pm = new THREE.Vector3(), pq = new THREE.Quaternion(), pax = new THREE.Vector3();
  const rubble = (x, y, z, cols, k, spread) => {
    const lz = W.lazy; W.lazy = true;
    for (let j = 0; j < k; j++) {
      const sq = spread * 0.5, px = x + rs(sq) * rnd(), pz = z + rs(sq) * rnd(), top = AF.surfaceBelow(px, pz, y + 2.5, 40);      // tight: the rubble HEAPS
      const bx = W.bx(px), bz = W.bz(pz), by = W.by(top + 0.01);
      if (top < AF.PLAN.SEA_Y - 0.4 && W.groundY(px, pz) < AF.PLAN.SEA_Y - 0.4 && top <= W.groundY(px, pz) + 0.01) continue;   // lost in the water
      if (!W.get(bx, by, bz)) { let c = cols[(rnd() * cols.length) | 0]; const q = rnd(); if (P.mat[c] === M.fire || q < 0.28) c = AF.fire.CHAR[(rnd() * 4) | 0]; else if (q < 0.37 && AF.fire.EMBER) c = AF.fire.EMBER; else if (q < 0.86) { const so = AF.sootOf(c); if (so) c = so; } W.set(bx, by, bz, c); }      // dark, sooted, a few embers: a ruin, not spilled bricks
    }
    W.lazy = lz;
  };
  const makePiece = (pp) => {
    // gather voxels of up to 27 macro cells into one 12^3 model
    const cells = pp.cells, ox = pp.kx * 12, oy = pp.ky * 12, oz = pp.kz * 12;
    const m = new AF.Model(12, 12, 12); let cnt = 0, burning = 0; const cols = [];
    for (const ci of cells) {
      const mz = ci % MZ, my = ((ci / MZ) | 0) % MY, mx = (ci / (MY * MZ)) | 0, bx = mx * 4, by = my * 4, bz = mz * 4;
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
        const v = W.get(bx + a, by + b, bz + c); if (!v) continue;
        m.v[((bx + a - ox) * 12 + (by + b - oy)) * 12 + (bz + c - oz)] = v; cnt++; W.set(bx + a, by + b, bz + c, 0);
        if (P.mat[v] === M.fire) burning++; if (cols.length < 10 || rnd() < 0.02) cols[cols.length < 10 ? cols.length : (rnd() * 10) | 0] = v;
      }
    }
    if (!cnt) return;
    const wx = W.xOf(ox) + 1.5, wy = W.yOf(oy) + 1.5, wz = W.zOf(oz) + 1.5;
    const info = pp.info;
    if (cnt < 5 || pieces.length >= MAXP) {   // crumbs, or too much in the air already: straight to rubble
      AF.fx.debris(wx, wy, wz, { n: Math.min(6, cnt), pal: cols, speed: 3, up: 0.2 });
      if (cnt >= 5) { rubble(wx, wy, wz, cols, Math.min(60, Math.round(cnt * 0.25)), 2.4); if (rnd() < 0.3) AF.fx.dust(wx, wy, wz, { n: 2, size: 3 }); }
      return;
    }
    const geo = AF.meshModel(m, { vs: 0.25, anchor: [0.5, 0.5, 0.5] });
    const mesh = new THREE.Mesh(geo, AF.mat.voxel); mesh.castShadow = true; mesh.receiveShadow = true; mesh.position.set(wx, wy, wz); mesh.userData.noCull = true; AF.scene.add(mesh);
    const dx = wx - info.cx, dz = wz - info.cz, dl = Math.hypot(dx, dz) || 1, out = 0.6 + rnd() * 1.8 + (info.push || 0);
    pieces.push({ mesh, x: wx, y: wy, z: wz, vx: dx / dl * out + rs(0.6) + (info.tipx || 0) * Math.min(9, (wy - info.minY) * 0.28), vy: -rnd() * 1.5, vz: dz / dl * out + rs(0.6) + (info.tipz || 0) * Math.min(9, (wy - info.minY) * 0.28), ax: rs(1), ay: rs(1), az: rs(1), spin: rs(1.6), ang: 0, n: cnt, cols, burning, punched: 0, delay: Math.max(0, (wy - info.minY) * 0.018 + rnd() * 0.1), age: 0 });
  };
  const collapse = (cn, info) => {
    // group the floating macro cells into 3 m pieces, bottom first
    const groups = new Map(); let sx = 0, sy = 0, sz = 0, minY = 1e9, maxY = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, vox = 0;
    for (let k = 0; k < cn; k++) {
      const ci = comp[k], mz = ci % MZ, my = ((ci / MZ) | 0) % MY, mx = (ci / (MY * MZ)) | 0;
      const kx = (mx / 3) | 0, ky = (my / 3) | 0, kz = (mz / 3) | 0, key = (kx * 64 + ky) * 256 + kz;
      let g = groups.get(key); if (!g) groups.set(key, g = { cells: [], kx, ky, kz, info: null }); g.cells.push(ci);
      sx += mx; sy += my; sz += mz; vox += W.occ[ci]; if (my < minY) minY = my; if (my > maxY) maxY = my; if (mx < x0) x0 = mx; if (mx > x1) x1 = mx; if (mz < z0) z0 = mz; if (mz > z1) z1 = mz;
    }
    const inf = Object.assign({ cx: sx / cn - 300 + 0.5, cz: sz / cn - 300 + 0.5, minY: minY - 16 }, info || {});
    const list = [...groups.values()].sort((a, b) => a.ky - b.ky);
    for (const g of list) { g.info = inf; pendingPieces.push(g); }
    const box = [x0 - 300, minY - 16, z0 - 300, x1 - 299, maxY - 15, z1 - 299], cy = sy / cn - 16 + 0.5, r = Math.hypot(x1 - x0 + 1, maxY - minY + 1, z1 - z0 + 1) / 2;
    if (vox > 9000 && info && info.structure && AF.playing) AF.slowmo(0.4, 1.5);      // a tower going: give the player a beat to watch it
    if (vox > 300) { AF.emit('collapse', { x: inf.cx, y: cy, z: inf.cz, r, box, structure: info && info.structure, voxels: vox }); AF.shake(Math.min(2.2, 0.25 + vox / 9000), inf.cx, cy, inf.cz); }
    if (vox > 1500) AF.fx.dust(inf.cx, minY - 16, inf.cz, { n: Math.min(40, 6 + (vox / 800) | 0), size: Math.min(9, 3 + r * 0.3), speed: 5 + r * 0.25, life: 6 });
    AF.struct.fallen += vox;
    queueCheck(box[0] - 1.5, box[1] - 1, box[2] - 1.5, box[3] + 1.5, box[4] + 8, box[5] + 1.5, 0.6);
    return box;
  };
  const stoneCell = (mx, my, mz) => { const bx = mx * 4, by = my * 4, bz = mz * 4; let st = 0, n = 0; for (let a = 0; a < 4; a += 2) for (let b = 0; b < 4; b += 2) for (let d = 0; d < 4; d += 2) { const v = W.get(bx + a, by + b, bz + d); if (v) { n++; const mt = P.mat[v]; if (mt === M.stone || mt === M.metal) st++; } } return n > 0 && st * 2 > n; };
  const runCheck = (c) => {
    ensure(); mcount = 0;
    const occ = W.occ;
    const m0 = Math.max(0, Math.floor(c.x0 + 300) - 1), m1 = Math.min(MX - 1, Math.floor(c.x1 + 300) + 1), y0 = Math.max(0, Math.floor(c.y0 + 16) - 1), y1 = Math.min(MY - 1, Math.floor(c.y1 + 16) + 1), z0 = Math.max(0, Math.floor(c.z0 + 300) - 1), z1 = Math.min(MZ - 1, Math.floor(c.z1 + 300) + 1);
    // 1. floating components
    for (let mx = m0; mx <= m1; mx++) for (let my = y0; my <= y1; my++) { const o = (mx * MY + my) * MZ; for (let mz = z0; mz <= z1; mz++) { const i = o + mz; if (!occ[i] || mark[i]) continue; const cn = probe(i); if (cn > 0) { const b = collapse(cn, {}); sweepLoose(b[0], b[1], b[2], b[3], b[4], b[5]); } } }
    for (let k = 0; k < mcount; k++) mark[marked[k]] = 0;
    // 2. registered structures: a storey that lost more than half its material drops everything above it
    for (const s of AF.structures) {
      if (!s.alive || !s.base) continue; const m = s.m;
      if (m[3] <= m0 || m[0] > m1 || m[4] <= y0 || m[1] > y1 || m[5] <= z0 || m[2] > z1) continue;
      let fail = -1;
      for (let my = Math.max(m[1], y0); my < Math.min(m[4], y1 + 1); my++) { const b = s.base[my - m[1]]; if (b < 8) continue; if (layerCount(m, my) < b * (s.weak ?? AF.WEAK)) { fail = my; break; } }
      let left = 0; for (let my = m[1]; my < m[4]; my++) left += layerCount(m, my);
      if (fail >= 0 && fail < m[4] - 1) {
        // what falls: the part of the building over the wound (not the whole footprint), and never a stone stack that still
        // stands on stone all the way down — so a hit leaves a jagged half house, its chimney and its stone walls
        const hx = (c.x1 - c.x0) * 0.5, hz = (c.z1 - c.z0) * 0.5, ccx = (c.x0 + c.x1) * 0.5 + 300, ccz = (c.z0 + c.z1) * 0.5 + 300, kx = Math.max(3.5, hx * 0.6), kz = Math.max(3.5, hz * 0.6);
        const part = !c.whole && (m[3] - m[0]) * (m[5] - m[2]) > 30, fx0 = part ? Math.max(m[0], Math.floor(ccx - kx)) : m[0], fx1 = part ? Math.min(m[3], Math.ceil(ccx + kx)) : m[3], fz0 = part ? Math.max(m[2], Math.floor(ccz - kz)) : m[2], fz1 = part ? Math.min(m[5], Math.ceil(ccz + kz)) : m[5];
        let cn = 0; for (let mx = fx0; mx < fx1; mx++) for (let mz = fz0; mz < fz1; mz++) {
          let stone = true; for (let my = m[1]; my < fail && stone; my++) if (!occ[(mx * MY + my) * MZ + mz]) stone = false;      // supported all the way down?
          for (let my = fail; my < m[4]; my++) { const i = (mx * MY + my) * MZ + mz; if (!occ[i]) { stone = false; continue; } if (stone && stoneCell(mx, my, mz)) continue; stone = false; if (cn < CAPN) comp[cn++] = i; }
        }
        if (cn > 0) { const scx = (m[0] + m[3]) / 2 - 300, scz = (m[2] + m[5]) / 2 - 300, bx = (c.x0 + c.x1) / 2 - scx, bz = (c.z0 + c.z1) / 2 - scz, bl = Math.hypot(bx, bz); const b = collapse(cn, { structure: s, push: 0.4, tipx: bl > 0.5 ? bx / bl : 0, tipz: bl > 0.5 ? bz / bl : 0 }); sweepLoose(b[0], b[1], b[2], b[3], b[4], b[5]); left = 0; for (let my = m[1]; my < fail; my++) left += layerCount(m, my); }
      }
      s.left = s.total0 ? left / s.total0 : 0;
      if (s.left < 0.42) { s.alive = false; AF.score.add('structures'); AF.emit('structure-destroyed', s); }
    }
    let dead = 0; for (const s of AF.structures) if (!s.alive) dead++; AF.struct.ruin = AF.structures.length ? dead / AF.structures.length : 0;
    sweepLoose(c.x0, c.y0, c.z0, c.x1, c.y1, c.z1);
  };
  let burnT = 0;
  AF.onTick('structure', 340, (dt) => {
    if (!W.live || !W.occ) return;
    // cut pending pieces loose, a few ms per frame, bottom first (this IS the collapse animation)
    if (pendingPieces.length) { const t0 = performance.now(); let k = 0; while (k < pendingPieces.length && (performance.now() - t0 < 5 || AF.SHOT)) { makePiece(pendingPieces[k++]); if (AF.SHOT && k >= 40) break; } pendingPieces.splice(0, k); W.burst = Math.max(W.burst, 4); }
    else if (checks.length) {
      for (let i = checks.length - 1, done = 0; i >= 0 && done < 2; i--) { const c = checks[i]; c.t -= dt; if (c.t <= 0) { checks.splice(i, 1); runCheck(c); done++; if (pendingPieces.length) break; } }
      for (const c of checks) if (c.t > 0) c.t -= dt * 0;
    }
    // fire eats structures too: check where things burnt out
    burnT -= dt;
    if (burnT <= 0 && burntCells.size && !pendingPieces.length && checks.length < 6) {
      burnT = 0.5; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9, first = -1, n = 0;
      for (const ci of burntCells) {
        const mz = ci % MZ, my = ((ci / MZ) | 0) % MY, mx = (ci / (MY * MZ)) | 0;
        if (first < 0) { first = ci; x0 = x1 = mx; y0 = y1 = my; z0 = z1 = mz; }
        else if (Math.abs(mx - x0) > 14 || Math.abs(mz - z0) > 14 || Math.abs(mx - x1) > 14 || Math.abs(mz - z1) > 14) continue;
        if (mx < x0) x0 = mx; if (mx > x1) x1 = mx; if (my < y0) y0 = my; if (my > y1) y1 = my; if (mz < z0) z0 = mz; if (mz > z1) z1 = mz;
        burntCells.delete(ci); if (++n > 600) break;
      }
      if (first >= 0) queueCheck(x0 - 300 - 1, y0 - 16 - 1, z0 - 300 - 1, x1 - 299 + 1, y1 - 15 + 2, z1 - 299 + 1, 0);
    }
    // falling pieces
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt; p.vy -= 15 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.ang += p.spin * dt;
      let hit = false, ground = false;
      const gy = W.groundY(p.x, p.z);
      if (p.y - 1.3 < gy) { hit = true; ground = true; }
      else if (p.age > 0.12 && (AF.solidAt(p.x, p.y - 1.3, p.z) || AF.solidAt(p.x + 0.9, p.y - 1.1, p.z + 0.9) || AF.solidAt(p.x - 0.9, p.y - 1.1, p.z - 0.9))) hit = true;
      if (hit) {
        const sp = -p.vy;
        if (ground && gy < AF.PLAN.SEA_Y - 0.5) { AF.fx.splash(p.x, p.z, { size: 1.6 }); }
        else if (!ground && sp > 8 && p.punched < 2 && rnd() < 0.75) { p.punched++; AF.carve(p.x, p.y - 1.6, p.z, 1.45); p.vy *= 0.5; p.vx *= 0.6; p.vz *= 0.6; queueCheck(p.x - 3, p.y - 5, p.z - 3, p.x + 3, p.y + 1, p.z + 3, 0.25); if (rnd() < 0.5) AF.fx.dust(p.x, p.y - 1.5, p.z, { n: 2, size: 2.5 }); AF.emit('crush', { x: p.x, y: p.y - 1.5, z: p.z, r: 2 }); continue; }
        else {
          rubble(p.x, p.y, p.z, p.cols, Math.min(220, Math.round(p.n * 0.42)), 2.2);
          AF.fx.debris(p.x, p.y - 0.5, p.z, { n: Math.min(10, 2 + (p.n / 50) | 0), pal: p.cols, speed: 2 + sp * 0.35, up: 0.5, spread: 1.2 });
          AF.fx.dust(p.x, p.y - 1, p.z, { n: 3, size: 2.8, speed: 2 + sp * 0.2 });
          if (AF.fx.beams) AF.fx.beams(p.x, p.y - 0.4, p.z, { n: Math.min(7, 2 + (p.n / 40) | 0), pal: p.cols, speed: 1.5 + sp * 0.25 });
          if (p.burning > 8) { AF.fx.sparks(p.x, p.y, p.z, { n: 18, speed: 7 }); if (AF.fx.embers) AF.fx.embers(p.x, p.y, p.z, { n: 8, spread: 1.6 }); if (AF.ignite && rnd() < 0.7) AF.ignite(p.x, p.y - 1, p.z, 1.8, 0.9, true); }
          AF.emit('crush', { x: p.x, y: p.y - 1.3, z: p.z, r: 2.4 });
          if (sp > 6) AF.shake(0.12, p.x, p.y, p.z);
        }
        AF.scene.remove(p.mesh); p.mesh.geometry.dispose(); pieces.splice(i, 1); continue;
      }
      pax.set(p.ax, p.ay, p.az).normalize(); pq.setFromAxisAngle(pax, p.ang);
      p.mesh.position.set(p.x, p.y, p.z); p.mesh.quaternion.copy(pq);
      if (p.burning > 12 && rnd() < dt * 8) AF.fx.fire(p.x, p.y, p.z, { n: 1, size: 1.6, life: 0.5 });
      if (p.y < -30 || p.age > 12) { AF.scene.remove(p.mesh); p.mesh.geometry.dispose(); pieces.splice(i, 1); }
    }
    AF.stats.pieces = pieces.length + pendingPieces.length;
  });
  AF.struct.pieces = pieces;
  AF.struct.check = queueCheck;

  // ---- MENDING: put the world back the way it was (used by the mender wizards)
  // AF.mend.targets(x, z, maxR, n) -> damaged 16 m cells that are not on fire; AF.mend.begin(x0,z0,x1,z1) -> job
  // job.step(n) restores up to n voxels bottom-up and returns how many; job.y, job.progress, job.done, job.blocked, job.cancel()
  const CYn = W.NY >> 4, CZn = NZ >> 4, CXn = NX >> 4;
  const structAt = (x, z) => { let best = null; for (const st of AF.structures) { const b = st.box; if (x >= Math.min(b[0], b[3]) && x <= Math.max(b[0], b[3]) && z >= Math.min(b[2], b[5]) && z <= Math.max(b[2], b[5])) { if (!best || (!st.alive && best.alive) || (st.name && !best.name)) best = st; } } return best; };
  const recount = (st) => { if (!st.base) return 1; const m = st.m; let left = 0; for (let my = m[1]; my < m[4]; my++) left += layerCount(m, my); st.left = st.total0 ? left / st.total0 : 0; return st.left; };
  const reviveIn = (x0, z0, x1, z1) => {
    for (const st of AF.structures) { const b = st.box; if (Math.max(b[0], b[3]) < x0 || Math.min(b[0], b[3]) > x1 || Math.max(b[2], b[5]) < z0 || Math.min(b[2], b[5]) > z1) continue; const l = recount(st); if (!st.alive && l > 0.85) { st.alive = true; AF.score.structures = Math.max(0, AF.score.structures - 1); AF.emit('structure-restored', st); } }
    let dead = 0; for (const st of AF.structures) if (!st.alive) dead++; AF.struct.ruin = AF.structures.length ? dead / AF.structures.length : 0;
  };
  AF.mend = { restored: 0, jobs: 0 };
  const cellStruct = new Map();
  AF.mend.targets = (x, z, maxR = 120, n = 6) => {
    const out = [];
    for (const [fk, cntD] of W.cellDmg) {
      if (cntD <= 0) continue;
      const cx0 = W.X0 + (fk >> 10) * 16, cz0 = W.Z0 + (fk & 1023) * 16, mx = cx0 + 8, mz = cz0 + 8, d = Math.hypot(mx - x, mz - z);
      if (d > maxR) continue; if (AF.fire.heat(mx, mz) > 0.15) continue;
      let st = cellStruct.get(fk); if (st === undefined) { st = structAt(mx, mz) || null; cellStruct.set(fk, st); }
      if (cntD < 2 && !(st && !st.alive)) continue;          // a scuff, not worth a wizard
      out.push({ x: mx, y: W.groundY(mx, mz) + 4, z: mz, x0: cx0, z0: cz0, x1: cx0 + 16, z1: cz0 + 16, damage: cntD, structure: st, d, score: d - cntD * 4 - (st && st.name ? 30 : 0) - (st && !st.alive ? 40 : 0) });
    }
    out.sort((a, b) => a.score - b.score); return out.slice(0, n);
  };
  // treat what stands in this rectangle NOW as its original state (for things built after boot, e.g. test blocks)
  AF.mend.adopt = (x0, z0, x1, z1) => { const c0 = Math.max(0, Math.floor((x0 - W.X0) / 4)), c1 = Math.min(CXn - 1, Math.floor((x1 - W.X0) / 4)), d0 = Math.max(0, Math.floor((z0 - W.Z0) / 4)), d1 = Math.min(CZn - 1, Math.floor((z1 - W.Z0) / 4)); for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) { for (let cy = 0; cy < CYn; cy++) { const ci = (cx * CYn + cy) * CZn + cz; if (W.snap[ci]) { W.snap[ci] = 0; W.orig.delete(ci); } } W.cellDmg.delete(((cx >> 2) << 10) + (cz >> 2)); } };
  AF.mend.begin = (x0, z0, x1, z1) => {
    if (x0 > x1) [x0, x1] = [x1, x0]; if (z0 > z1) [z0, z1] = [z1, z0];
    const c0 = Math.max(0, Math.floor((x0 - W.X0) / 4)), c1 = Math.min(CXn - 1, Math.floor((x1 - W.X0 - 0.01) / 4)), d0 = Math.max(0, Math.floor((z0 - W.Z0) / 4)), d1 = Math.min(CZn - 1, Math.floor((z1 - W.Z0 - 0.01) / 4));
    let list = [];
    for (let cy = 0; cy < CYn; cy++) for (let cx = c0; cx <= c1; cx++) for (let cz = d0; cz <= d1; cz++) { const ci = (cx * CYn + cy) * CZn + cz; if (W.snap[ci] === 2) list.push(ci); }
    // the ground first: craters fill, scorch fades
    W.mending = true;
    for (const [tk, t] of W.origT) { if (!t.dirty) continue; const tx0 = W.X0 + t.x0 / 4, tz0 = W.Z0 + t.z0 / 4; if (tx0 + 8 < x0 || tx0 > x1 || tz0 + 8 < z0 || tz0 > z1) continue; let all = true; for (let a = 0; a < 32; a++) for (let b = 0; b < 32; b++) { const bx = t.x0 + a, bz = t.z0 + b, wx = W.X0 + bx / 4, wz = W.Z0 + bz / 4; if (wx < x0 || wx > x1 || wz < z0 || wz > z1) { all = false; continue; } const j = bx * NZ + bz; if (W.H[j] !== t.H[a * 32 + b] || W.C[j] !== t.C[a * 32 + b]) W.setH(bx, bz, t.H[a * 32 + b], t.C[a * 32 + b]); } if (all) t.dirty = false; }
    W.mending = false;
    const total = list.length; let idx = 0, cur = 0, skip = [], fireLeft = false;
    const job = { y: W.groundY((x0 + x1) / 2, (z0 + z1) / 2), progress: total ? 0 : 1, done: total === 0, blocked: false, restored: 0, x0, z0, x1, z1 };
    AF.mend.jobs++;
    job.cancel = () => { job.done = true; reviveIn(x0, z0, x1, z1); };
    job.step = (n) => {
      if (job.done) return 0; n = Math.floor(n); if (n <= 0) return 0;
      let did = 0; const lz = W.lazy; W.lazy = true; const FM = AF.fire, sea = AF.PLAN.SEA_Y;
      while (n > 0) {
        if (idx >= list.length) {
          if (skip.length) { list = skip; skip = []; idx = 0; cur = 0; job.blocked = true; break; }      // only burning chunks remain: try again later
          job.done = true; job.progress = 1; job.blocked = false; reviveIn(x0, z0, x1, z1); break;
        }
        const ci = list[idx], cz = ci % CZn, cy = ((ci / CZn) | 0) % CYn, cx = (ci / (CYn * CZn)) | 0, wx = W.X0 + cx * 4 + 2, wz = W.Z0 + cz * 4 + 2;
        if (cur === 0 && FM.heat(wx, wz) > 0.22) { skip.push(ci); idx++; continue; }
        const orig = W.orig.get(ci) || null; let ch = W.chunks[ci]; const ox = cx * 16, oy = cy * 16, oz = cz * 16;
        job.y = W.yOf(oy + (cur >> 8)); job.blocked = false;
        let fin = true;
        for (; cur < 4096; cur++) {
          // cur is y-major so a chunk rises layer by layer: cur = y*256 + x*16 + z
          const y = cur >> 8, x = (cur >> 4) & 15, z = cur & 15, li = (x * 16 + y) * 16 + z, o = orig ? orig[li] : 0, c = ch ? ch[li] : 0;
          if (c === o) continue;
          if (c && P.mat[c] === M.fire) { fireLeft = true; continue; }
          W.set(ox + x, oy + y, oz + z, o); if (!ch) ch = W.chunks[ci];
          if (o && MP[P.mat[o]].burn > 0 && FM.cityBurnt > 0 && wx > -184 && wx < 184 && wz > -212 && wz < 216) FM.cityBurnt--;
          did++; if (--n <= 0) { fin = false; cur++; break; }
        }
        if (fin || cur >= 4096) {
          if (!fireLeft) { W.snap[ci] = 1; const fk = ((cx >> 2) << 10) + (cz >> 2), k = (W.cellDmg.get(fk) || 1) - 1; if (k <= 0) W.cellDmg.delete(fk); else W.cellDmg.set(fk, k); } else skip.push(ci);
          fireLeft = false; idx++; cur = 0; job.progress = total ? Math.min(1, (total - (list.length - idx) - skip.length) / total) : 1;
          if ((idx & 7) === 0) reviveIn(x0, z0, x1, z1);
        }
      }
      W.lazy = lz; job.restored += did; AF.mend.restored += did; return did;
    };
    return job;
  };
}
