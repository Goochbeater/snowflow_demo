// ===== 08-ships: ships are floating voxel bodies that sail, burn, break and sink  (OWNER: coordinator) =====
// Each ship keeps its own dense voxel grid (the Model you pass in), meshed in 16^3 sections under one moving Group.
// Blasts carve it, fire runs through it with the same rules as the city (06-fire), masts that lose their footing topple into
// the sea, a holed or burnt-out hull settles, lists and goes down.
{
  const SH = AF.ships = { list: [], defs: [] };
  const W = AF.W, P = AF.PAL, M = AF.MAT, MP = AF.MATP, rnd = Math.random, rs = (a) => (rnd() * 2 - 1) * a;
  // AF.ships.add({ name, kind, model, waterline, x, z, yaw, route, speed, moored, cannons, crew, flags })
  //   model     : AF.Model in WORLD-SIZE voxels (0.25 m). x = across the beam, y = up, z = along the keel with the BOW at +z.
  //   waterline : how many voxel rows of the model sit under water (the hull's draught), e.g. 8 = 2 m
  //   x, z, yaw : where she floats; heading = (sin yaw, cos yaw)
  //   route     : [[x,z],...] loop to sail (omit for a moored ship); speed m/s (3-6)
  //   cannons   : [{x,y,z, side}] in local METRES from the ship origin (centre of the beam, waterline, midships); side -1 port (−x) / +1 starboard (+x) / 0 chaser
  //   crew      : [{x,y,z, role}] local standing points on deck (role: 'gunner'|'sailor'|'captain'|'lookout'|'archer')
  //   flags     : [{x,y,z, c1, c2, kind}] local mast-top points: the core flies a flag there
  //   arrive    : waypoint radius in metres (default 14; use ~3 for river barges); turn: rad/s (default 0.22)
  //   mounts    : [{x,y,z, type:'ballista', yaw, arc}] local deck pads for big ship ballistas (the garrison builds the weapon)
  //   loopFrom  : when the route's last point is reached, continue from this index (approach leg, then a holding loop)
  let built = false;
  SH.add = (d) => { if (built) return SH.spawn(d); SH.defs.push(d); return d; };
  // add a ship while the game is running (reinforcements). Emits 'ship-spawned'.
  SH.spawn = (d) => { if (!built) { SH.defs.push(d); return d; } let s = null; try { s = build(d); } catch (e) { console.error('[af] ship spawn ' + d.name, e); return null; } AF.emit('ship-spawned', s); return s; };
  const v3 = new THREE.Vector3(), v3b = new THREE.Vector3(), m4 = new THREE.Matrix4();
  const fallers = [];
  const build = (d) => {
    const m = d.model, w = m.w, h = m.h, dd = m.d, land = !!d.land, wl = d.waterline ?? (land ? 0 : 8), g = new THREE.Group(), hullTop = land ? 12 : wl + 3;
    const s = Object.assign(d, { id: SH.list.length, vid: SH.list.length + 1, group: g, alive: true, sinking: false, sunk: false, burning: 0, hull: 1, speed: d.speed ?? 4, seg: 0, t: rnd() * 10, fireN: 0, burntN: 0, wl, w, h, d: dd, sinkT: 0, wantYaw: null, vel: new THREE.Vector3(), land, water: 0 });
    s.douse = (power = 1) => { s.water = Math.min(3000, s.water + power * AF.fire.waterPer); return s.fireN; };
    s.x = d.x; s.z = d.z; s.yaw = d.yaw || 0;
    s.rad = Math.hypot(w, h, dd) * 0.125 + 1;
    s.cannons = (d.cannons || []).map((c) => Object.assign({ alive: true }, c));
    s.mounts = (d.mounts || []).map((c) => Object.assign({ alive: true, type: 'ballista' }, c));
    s.crew = d.crew || [];
    const SXN = Math.ceil(w / 16), SYN = Math.ceil(h / 16), SZN = Math.ceil(dd / 16);
    const secs = new Array(SXN * SYN * SZN).fill(null), dirty = new Set();
    s.inv = new THREE.Matrix4();
    s.get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= dd) ? 0 : m.v[(x * h + y) * dd + z];
    let count = 0, hullN = 0, flam = 0;
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < dd; z++) { const c = m.v[(x * h + y) * dd + z]; if (c) { count++; if (y < hullTop) hullN++; if (MP[P.mat[c]].burn > 0) flam++; } }
    s.count0 = s.count = count; s.hull0 = s.hullN = hullN; s.flam0 = Math.max(1, flam);
    const markSec = (x, y, z) => { if (x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < dd) dirty.add(((x >> 4) * SYN + (y >> 4)) * SZN + (z >> 4)); };
    s.set = (x, y, z, c) => {
      if (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= dd) return;
      const i = (x * h + y) * dd + z, old = m.v[i]; if (old === c) return; m.v[i] = c;
      if (!old !== !c) { const k = c ? 1 : -1; s.count += k; if (y < hullTop) s.hullN += k; s.floatDirty = true; }
      markSec(x, y, z); const lx = x & 15, ly = y & 15, lz = z & 15;
      if (lx === 0) markSec(x - 1, y, z); else if (lx === 15) markSec(x + 1, y, z); if (ly === 0) markSec(x, y - 1, z); else if (ly === 15) markSec(x, y + 1, z); if (lz === 0) markSec(x, y, z - 1); else if (lz === 15) markSec(x, y, z + 1);
    };
    // undamaged, the whole ship is ONE mesh (each 16^3 section remembers its index range); a section that changes is blanked
    // out of it and gets its own small mesh
    const secGeo = (si, out) => { const sz = si % SZN, sy = ((si / SZN) | 0) % SYN, sx = (si / (SYN * SZN)) | 0, ox = sx * 16, oy = sy * 16, oz = sz * 16; AF.greedy(16, 16, 16, (x, y, z) => s.get(ox + x, oy + y, oz + z), 0.25, [(ox - w / 2) * 0.25, (oy - wl) * 0.25, (oz - dd / 2) * 0.25], [ox, oy, oz], out, false); };
    const ranges = new Int32Array(secs.length * 4), live = new Uint8Array(secs.length);
    let baseMesh = null, baseGlass = null;
    {
      const out = { opaque: new AF.GeoBuf(), glass: new AF.GeoBuf() };
      for (let si = 0; si < secs.length; si++) { ranges[si * 4] = out.opaque.idx.length; ranges[si * 4 + 2] = out.glass.idx.length; secGeo(si, out); ranges[si * 4 + 1] = out.opaque.idx.length; ranges[si * 4 + 3] = out.glass.idx.length; }
      if (out.opaque.n) { baseMesh = new THREE.Mesh(out.opaque.geometry(), (AF.mat.mover || AF.mat.voxel)); baseMesh.castShadow = true; baseMesh.receiveShadow = true; baseMesh.userData.noCull = true; g.add(baseMesh); }
      if (out.glass.n) { baseGlass = new THREE.Mesh(out.glass.geometry(), AF.mat.glass); baseGlass.renderOrder = 2; baseGlass.userData.noCull = true; g.add(baseGlass); }
    }
    const meshSec = (si) => {
      if (!live[si]) { live[si] = 1; if (baseMesh && ranges[si * 4 + 1] > ranges[si * 4]) { baseMesh.geometry.index.array.fill(0, ranges[si * 4], ranges[si * 4 + 1]); baseMesh.geometry.index.needsUpdate = true; } if (baseGlass && ranges[si * 4 + 3] > ranges[si * 4 + 2]) { baseGlass.geometry.index.array.fill(0, ranges[si * 4 + 2], ranges[si * 4 + 3]); baseGlass.geometry.index.needsUpdate = true; } }
      const out = { opaque: new AF.GeoBuf(), glass: new AF.GeoBuf() };
      secGeo(si, out);
      let sec = secs[si];
      if (sec) for (const q of sec) { g.remove(q); q.geometry.dispose(); }
      if (!out.opaque.n && !out.glass.n) { secs[si] = null; return; }
      sec = secs[si] = [];
      if (out.opaque.n) { const q = new THREE.Mesh(out.opaque.geometry(), (AF.mat.mover || AF.mat.voxel)); q.castShadow = false; q.receiveShadow = true; q.userData.noCull = true; g.add(q); sec.push(q); }
      if (out.glass.n) { const q = new THREE.Mesh(out.glass.geometry(), AF.mat.glass); q.renderOrder = 2; q.userData.noCull = true; g.add(q); sec.push(q); }
    };
    s.remesh = (budget) => { let k = 0; for (const si of dirty) { dirty.delete(si); meshSec(si); if (++k >= budget) break; } return k; };
    s.dirtyN = () => dirty.size;
    // voxel index <-> world
    s.voxWorld = (x, y, z, out) => (out || new THREE.Vector3()).set((x + 0.5 - w / 2) * 0.25, (y + 0.5 - wl) * 0.25, (z + 0.5 - dd / 2) * 0.25).applyMatrix4(g.matrixWorld);
    s.toWorld = (lx, ly, lz, out) => (out || new THREE.Vector3()).set(lx, ly, lz).applyMatrix4(g.matrixWorld);
    s.toLocal = (wx, wy, wz, out) => (out || new THREE.Vector3()).set(wx, wy, wz).applyMatrix4(s.inv);
    s.worldVox = (wx, wy, wz, out) => { const o = s.toLocal(wx, wy, wz, out); o.set(o.x * 4 + w / 2, o.y * 4 + wl, o.z * 4 + dd / 2); return o; };
    s.solidAt = (wx, wy, wz) => { const o = s.worldVox(wx, wy, wz, v3b); return !!s.get(Math.floor(o.x), Math.floor(o.y), Math.floor(o.z)); };
    // highest solid voxel top (world y) under a local point: for crew standing on deck
    s.deckY = (lx, lz, fromY = 30) => { const x = Math.floor(lx * 4 + w / 2), z = Math.floor(lz * 4 + dd / 2); for (let y = Math.min(h - 1, Math.floor(fromY * 4 + wl)); y >= 0; y--) if (s.get(x, y, z)) return (y + 1 - wl) * 0.25; return null; };
    s.ignite = (wx, wy, wz, r = 1.5, k = 1) => {
      const o = s.worldVox(wx, wy, wz, v3), R = Math.ceil(r * 4), cx = o.x, cy = o.y, cz = o.z, r2 = r * r * 16; let lit = 0;
      for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(w - 1, Math.floor(cx + R)); x++) for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(h - 1, Math.floor(cy + R)); y++) for (let z = Math.max(0, Math.floor(cz - R)); z <= Math.min(dd - 1, Math.floor(cz + R)); z++) {
        const c = m.v[(x * h + y) * dd + z]; if (!c) continue; const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz; if (dx * dx + dy * dy + dz * dz > r2) continue;
        const mat = P.mat[c], b = MP[mat].burn; if (b > 0 && rnd() < b * k) { if (AF.fire.lightVoxel(s.vid, x, y, z, c)) lit++; }
      }
      return lit;
    };
    s.blast = (wx, wy, wz, r, power, fireK) => {
      r *= s.sinking ? 0.45 : 0.86;      /* a ship is holed and broken, never erased: there must be a hull left to burn, roll and go down */
      const o = s.worldVox(wx, wy, wz, v3), R = Math.ceil(r * 1.34 * 4) + 1, cx = o.x, cy = o.y, cz = o.z, ir = 1 / (r * 4); let removed = 0; const pals = [];
      for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(w - 1, Math.floor(cx + R)); x++) for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(h - 1, Math.floor(cy + R)); y++) for (let z = Math.max(0, Math.floor(cz - R)); z <= Math.min(dd - 1, Math.floor(cz + R)); z++) {
        const c = m.v[(x * h + y) * dd + z]; if (!c) continue; const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz, dn = Math.sqrt(dx * dx + dy * dy + dz * dz) * ir; if (dn > 1.34) continue;
        const mat = P.mat[c], f = 1.26 - 0.38 * MP[mat].tough, dj = dn + (AF.hash3(x >> 1, y >> 1, z >> 1) - 0.5) * 0.24;
        if (dj < f) { if (mat === M.explosive) { AF.fire.detonate(s.vid, x, y, z); continue; } s.set(x, y, z, 0); removed++; if (pals.length < 32 && mat !== M.fire) pals.push(c); }
        else if (dj < f + 0.32) { if (mat === M.explosive) AF.fire.detonate(s.vid, x, y, z); else if (MP[mat].burn > 0 && rnd() < 0.7 * fireK) AF.fire.lightVoxel(s.vid, x, y, z, c); }
      }
      if (removed) { AF.fx.debris(wx, wy, wz, { n: Math.min(120, 20 + (removed / 40) | 0), pal: pals, speed: r * 3, up: 0.9, spread: r * 0.5 }); AF.score.add('voxels', removed); s.floatT = 0.15; AF.emit('ship-hit', s, removed); }
      return removed;
    };
    // what is no longer joined to the hull falls away
    let seen = null, stack = null;
    s.checkFloat = () => {
      s.floatDirty = false;
      if (!seen) { seen = new Uint8Array(w * h * dd); stack = new Int32Array(w * h * dd > 600000 ? 600000 : w * h * dd); }
      seen.fill(0); let sp = 0; const HD = h * dd, v = m.v;
      for (let x = 0; x < w; x++) for (let y = 0; y <= Math.min(h - 1, land ? 3 : wl + 1); y++) for (let z = 0; z < dd; z++) { const i = (x * h + y) * dd + z; if (v[i] && !seen[i] && sp < stack.length) { seen[i] = 1; stack[sp++] = i; } }
      while (sp > 0) {
        const i = stack[--sp], z = i % dd, y = ((i / dd) | 0) % h, x = (i / HD) | 0; let nb;
        if (x > 0) { nb = i - HD; if (v[nb] && !seen[nb]) { seen[nb] = 1; if (sp < stack.length) stack[sp++] = nb; } }
        if (x < w - 1) { nb = i + HD; if (v[nb] && !seen[nb]) { seen[nb] = 1; if (sp < stack.length) stack[sp++] = nb; } }
        if (y > 0) { nb = i - dd; if (v[nb] && !seen[nb]) { seen[nb] = 1; if (sp < stack.length) stack[sp++] = nb; } }
        if (y < h - 1) { nb = i + dd; if (v[nb] && !seen[nb]) { seen[nb] = 1; if (sp < stack.length) stack[sp++] = nb; } }
        if (z > 0) { nb = i - 1; if (v[nb] && !seen[nb]) { seen[nb] = 1; if (sp < stack.length) stack[sp++] = nb; } }
        if (z < dd - 1) { nb = i + 1; if (v[nb] && !seen[nb]) { seen[nb] = 1; if (sp < stack.length) stack[sp++] = nb; } }
      }
      // everything unseen is adrift: lift it out into one falling model (bounded) + loose cubes
      let x0 = w, y0 = h, z0 = dd, x1 = -1, y1 = -1, z1 = -1, n = 0;
      for (let x = 0; x < w; x++) for (let y = wl + 2; y < h; y++) for (let z = 0; z < dd; z++) { const i = (x * h + y) * dd + z; if (v[i] && !seen[i]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; } }
      if (!n) return 0;
      const fw = x1 - x0 + 1, fh = y1 - y0 + 1, fd = z1 - z0 + 1;
      const big = n > 60 && fw * fh * fd < 1500000 && fallers.length < 10;
      const fm = big ? new AF.Model(fw, fh, fd) : null; let cubes = 0;
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const i = (x * h + y) * dd + z, c = v[i]; if (c && !seen[i]) { if (fm) fm.v[((x - x0) * fh + (y - y0)) * fd + (z - z0)] = c; else if (cubes < 40 && rnd() < 0.3) { const p = s.voxWorld(x, y, z, v3); AF.fx.cube(p.x, p.y, p.z, rs(2), rnd() * 2, rs(2), P.mat[c] === M.fire ? AF.fire.CHAR[0] : c, 0.25, 5); cubes++; } s.set(x, y, z, 0); } }
      if (fm) {
        const geo = AF.meshModel(fm, { vs: 0.25, anchor: [0.5, 0, 0.5] }), mesh = new THREE.Mesh(geo, (AF.mat.mover || AF.mat.voxel)); mesh.castShadow = true; mesh.userData.noCull = true;
        const base = s.voxWorld((x0 + x1) / 2, y0 - 0.5, (z0 + z1) / 2, new THREE.Vector3()); mesh.position.copy(base); mesh.rotation.order = 'YXZ'; mesh.rotation.y = s.yaw; AF.scene.add(mesh);
        const a = rnd() * 6.283; fallers.push({ mesh, vy: 0, tip: 0, tipV: 0.25 + rnd() * 0.3, ax: Math.cos(a), az: Math.sin(a), h: fh * 0.25, t: 0, wet: false, vx: s.vel.x, vz: s.vel.z });
      }
      s.floatDirty = false;
      return n;
    };
    g.position.set(s.x, land ? W.groundY(s.x, s.z) : AF.PLAN.SEA_Y, s.z); g.rotation.order = 'YXZ'; g.rotation.y = s.yaw; g.updateMatrixWorld(true); s.inv.copy(g.matrixWorld).invert();
    AF.scene.add(g); SH.list.push(s);
    // flags at the mastheads
    s.flagH = (d.flags || []).map((f) => { const p = s.toWorld(f.x, f.y, f.z); const hnd = AF.kit.flag(p.x, p.y, p.z, { c1: f.c1, c2: f.c2, kind: f.kind || 'pennant', w: f.w ?? 3, h: f.h ?? 0.9 }); hnd.ship = s; hnd.local = f; return hnd; });
    return s;
  };
  AF.onBuild('ships', 600, () => { built = true; for (const d of SH.defs) { try { build(d); } catch (e) { console.error('[af] ship ' + d.name, e); AF.errors.push({ part: 'ship:' + d.name, msg: String(e && e.stack || e) }); } } });

  // ---- queries used by everyone
  SH.igniteNear = (x, y, z, r, k) => { let n = 0; for (const s of SH.list) if (!s.sunk && Math.hypot(s.x - x, s.z - z) < s.rad + r) n += s.ignite(x, y, z, r, k); return n; };
  SH.blast = (x, y, z, r, power, fireK) => { for (const s of SH.list) if (!s.sunk && Math.hypot(s.x - x, s.z - z, s.group.position.y + s.h * 0.06 - y) < s.rad + r * 1.4) s.blast(x, y, z, r, power, fireK); };
  SH.solidAt = (x, y, z) => { for (const s of SH.list) if (!s.sunk && Math.hypot(s.x - x, s.z - z) < s.rad && s.solidAt(x, y, z)) return s; return null; };
  const lo = new THREE.Vector3(), ld = new THREE.Vector3();
  SH.ray = (ox, oy, oz, dx, dy, dz, maxD) => {
    let best = null;
    for (const s of SH.list) {
      if (s.sunk) continue;
      const cx = s.x - ox, cy = s.group.position.y + s.h * 0.05 - oy, cz = s.z - oz, tca = cx * dx + cy * dy + cz * dz; if (tca < -s.rad || tca > maxD + s.rad) continue;
      const d2 = cx * cx + cy * cy + cz * cz - tca * tca; if (d2 > s.rad * s.rad) continue;
      s.worldVox(ox, oy, oz, lo); ld.set(dx, dy, dz).transformDirection(s.inv);
      // clip to the grid box
      let t0 = 0, t1 = maxD * 4, ok = true; const mn = [0, 0, 0], mx = [s.w, s.h, s.d], o = [lo.x, lo.y, lo.z], dv = [ld.x, ld.y, ld.z];
      for (let a = 0; a < 3; a++) { if (Math.abs(dv[a]) < 1e-9) { if (o[a] < mn[a] || o[a] > mx[a]) { ok = false; break; } } else { let ta = (mn[a] - o[a]) / dv[a], tb = (mx[a] - o[a]) / dv[a]; if (ta > tb) { const q = ta; ta = tb; tb = q; } if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) { ok = false; break; } } }
      if (!ok) continue;
      let t = t0 + 1e-4, x = Math.floor(o[0] + dv[0] * t), y = Math.floor(o[1] + dv[1] * t), z = Math.floor(o[2] + dv[2] * t);
      const sx = dv[0] > 0 ? 1 : -1, sy = dv[1] > 0 ? 1 : -1, sz = dv[2] > 0 ? 1 : -1;
      const tdx = dv[0] ? Math.abs(1 / dv[0]) : 1e9, tdy = dv[1] ? Math.abs(1 / dv[1]) : 1e9, tdz = dv[2] ? Math.abs(1 / dv[2]) : 1e9;
      const px = o[0] + dv[0] * t, py = o[1] + dv[1] * t, pz = o[2] + dv[2] * t;
      let tx = t + (dv[0] ? (dv[0] > 0 ? x + 1 - px : px - x) * tdx : 1e9), ty = t + (dv[1] ? (dv[1] > 0 ? y + 1 - py : py - y) * tdy : 1e9), tz = t + (dv[2] ? (dv[2] > 0 ? z + 1 - pz : pz - z) * tdz : 1e9);
      for (let i = 0; i < 700 && t <= t1; i++) {
        const c = s.get(x, y, z);
        if (c) { const d = t / 4; if (!best || d < best.d) best = { x: ox + dx * d, y: oy + dy * d, z: oz + dz * d, bx: x, by: y, bz: z, c, nx: 0, ny: 1, nz: 0, d, ground: false, ship: s }; break; }
        if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; } else if (ty < tz) { y += sy; t = ty; ty += tdy; } else { z += sz; t = tz; tz += tdz; }
      }
    }
    return best;
  };
  // every voxel ray in the game sees ships too
  const baseRay = AF.rayVox;
  // ...and the water: a ray that goes down into the sea stops at the surface ({water:true})
  const isSea = (x, z) => (Math.abs(x) < 299.5 && Math.abs(z) < 299.5) ? W.groundY(x, z) < AF.PLAN.SEA_Y - 0.2 : z > 110;
  AF.isSea = isSea;
  AF.rayVox = (ox, oy, oz, dx, dy, dz, maxD = 200, solidOnly = true) => {
    const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    let h = baseRay(ox, oy, oz, dx, dy, dz, maxD, solidOnly);
    const sea = AF.PLAN.SEA_Y;
    if (dy < -1e-4 && oy > sea) { const tw = (oy - sea) / -dy; if (tw < (h ? h.d : maxD)) { const wx = ox + dx * tw, wz = oz + dz * tw; if (isSea(wx, wz)) h = { x: wx, y: sea, z: wz, bx: 0, by: 0, bz: 0, c: 0, nx: 0, ny: 1, nz: 0, d: tw, ground: false, water: true }; } }
    if (!SH.list.length) return h;
    const sh = SH.ray(ox, oy, oz, dx, dy, dz, h ? h.d : maxD);
    return sh || h;
  };

  let wakeT = 0;
  AF.onTick('ships', 240, (dt, t) => {
    const sea = AF.PLAN.SEA_Y; wakeT -= dt; const wake = wakeT <= 0; if (wake) wakeT = 0.12;
    let budget = 6;
    for (const s of SH.list) {
      if (s.sunk) continue;
      const g = s.group, ox = s.x, oz = s.z;
      // sail
      if (!s.moored && !s.sinking && s.route && s.route.length > 1) {
        let want;
        if (s.steer != null && s.wantYaw == null) s.wantYaw = s.steer;
        if (s.wantYaw != null) want = s.wantYaw;
        else { const p = s.route[s.seg % s.route.length], dx = p[0] - s.x, dz = p[1] - s.z; if (Math.hypot(dx, dz) < (s.arrive ?? 14)) { s.seg++; if (s.loopFrom != null && s.seg >= s.route.length) s.seg = s.loopFrom; } want = Math.atan2(dx, dz); }
        // never run aground: if the water ahead is shallow, go back to the route
        const ax = s.x + Math.sin(s.yaw) * 30, az = s.z + Math.cos(s.yaw) * 30;
        if (!s.land && s.wantYaw != null && Math.abs(ax) < 299 && Math.abs(az) < 299 && W.groundY(ax, az) > sea - 2.5) { s.wantYaw = null; s.steer = null; }
        if (s.steer == null) s.wantYaw = null; else s.wantYaw = s.steer;
        { const tr = s.turn ?? 0.22; s.yaw += AF.clamp(AF.angDiff(s.yaw, want), -tr * dt, tr * dt); }
        const sp = s.speed * (0.35 + 0.65 * Math.min(1, s.hull));
        s.x += Math.sin(s.yaw) * sp * dt; s.z += Math.cos(s.yaw) * sp * dt;
      }
      s.vel.set((s.x - ox) / Math.max(dt, 1e-4), 0, (s.z - oz) / Math.max(dt, 1e-4));
      // state
      s.hull = s.hullN / s.hull0; s.burning = Math.min(1, s.fireN / (s.flam0 * 0.25));
      if (!s.sinking && (s.hull < 0.5 || s.count / s.count0 < 0.6 || s.burntN / s.flam0 > 0.3)) {      /* two or three fireballs doom a ship: she lists, burns and goes down over 16-26 s */ s.sinking = true; s.alive = false; s.sinkRoll = (rnd() < 0.5 ? -1 : 1) * (0.35 + rnd() * 0.45); s.sinkPitch = rs(0.3); s.sinkDur = 16 + rnd() * 10; AF.emit('ship-sinking', s); }
      let y = sea + Math.sin(t * 0.9 + s.t) * 0.12, roll = Math.sin(t * 0.7 + s.t * 2) * 0.025, pitch = Math.sin(t * 0.55 + s.t) * 0.012;
      if (s.land) {
        // a land machine: rides the ground, rumbles when it moves, and when it is finished it comes apart
        const gy = Math.max(W.groundY(s.x, s.z), W.groundY(s.x + Math.sin(s.yaw) * 2, s.z + Math.cos(s.yaw) * 2), W.groundY(s.x - Math.sin(s.yaw) * 2, s.z - Math.cos(s.yaw) * 2));
        s.gy = s.gy == null ? gy : s.gy + (gy - s.gy) * Math.min(1, dt * 4); y = s.gy;
        const mv = Math.min(1, s.vel.length() / 2); roll = Math.sin(t * 5.1 + s.t) * 0.006 * mv; pitch = Math.sin(t * 4.3 + s.t * 2) * 0.005 * mv;
        if (s.sinking) {
          s.sinkT += dt; const k = Math.min(1, s.sinkT / 1.3); roll += s.sinkRoll * 0.5 * k * k; pitch += s.sinkPitch * k * k; y -= k * k * 0.8;
          if (k >= 1) {
            const pals = [], mm = s.model; for (let i = 0; i < 400; i++) { const c = mm.v[(rnd() * mm.v.length) | 0]; if (c && P.mat[c] !== M.fire) pals.push(c); }
            const c0 = s.toWorld(0, s.h * 0.1, 0, v3); AF.fx.debris(c0.x, c0.y, c0.z, { n: 140, pal: pals.length ? pals : null, speed: 7, up: 0.8, spread: 2.5 }); AF.fx.dust(c0.x, c0.y, c0.z, { n: 14, size: 4, speed: 5 });
            s.sunk = true; g.visible = false; AF.scene.remove(g); for (const f of s.flagH) f.kill && f.kill(false); AF.emit('body-wrecked', s); AF.shake(0.5, s.x, y, s.z); continue;
          }
        }
      } else
      if (s.sinking) {
        s.sinkT += dt; const k = Math.min(1, s.sinkT / s.sinkDur), e = k * k * (3 - 2 * k);
        y -= e * (s.h * 0.25 * 0.5 + 6) * k; roll += s.sinkRoll * Math.min(1, e * 1.6); pitch += s.sinkPitch * e;
        if (rnd() < dt * 6) AF.fx.splash(s.x + rs(s.w * 0.12), s.z + rs(s.d * 0.1), { size: 0.7 + rnd() });
        if (k >= 1) { s.sunk = true; g.visible = false; AF.scene.remove(g); for (const f of s.flagH) f.kill && f.kill(false); AF.score.add('ships'); AF.emit('ship-sunk', s); AF.fx.splash(s.x, s.z, { size: 3 }); continue; }
      }
      g.position.set(s.x, y, s.z); g.rotation.y = s.yaw; g.rotation.z = roll; g.rotation.x = pitch; g.updateMatrixWorld(true); s.inv.copy(g.matrixWorld).invert();
      if (wake && !s.land && !s.moored && !s.sinking && s.route) { const p = s.toWorld(rs(s.w * 0.1), 0.1, -s.d * 0.12, v3); AF.fx.splash && AF.fx.pools && AF.fx.dust(p.x, sea + 0.15, p.z, { n: 1, size: 1.2, color: 0xeef4f8, speed: 0.8, life: 2.2, a: 0.35 }); }
      // housekeeping
      if (budget > 0 && s.dirtyN()) budget -= s.remesh(Math.min(budget, 3));
      if (s.floatT != null) { s.floatT -= dt; if (s.floatT <= 0) { s.floatT = null; s.checkFloat(); } }
      else if (s.floatDirty && (s.fireN > 0 || s.burntN > 0) && ((AF.clock.frame + s.id * 7) % 45) === 0) s.checkFloat();
      if (((AF.clock.frame + s.id * 11) % 50) === 0) for (const c of s.cannons) { if (!c.alive) continue; if (s.sinking) { c.alive = false; continue; } const x = Math.floor(c.x * 4 + s.w / 2), yv = Math.floor(c.y * 4 + s.wl), z = Math.floor(c.z * 4 + s.d / 2); let ok = false; for (let a = -2; a <= 2 && !ok; a++) for (let b = -2; b <= 1 && !ok; b++) for (let e = -2; e <= 2 && !ok; e++) if (s.get(x + a, yv + b, z + e)) ok = true; if (!ok) c.alive = false; }
      if (((AF.clock.frame + s.id * 13) % 50) === 0) for (const c of s.mounts) { if (!c.alive) continue; if (s.sinking) { c.alive = false; continue; } const x = Math.floor(c.x * 4 + s.w / 2), yv = Math.floor(c.y * 4 + s.wl), z = Math.floor(c.z * 4 + s.d / 2); let ok = false; for (let a = -2; a <= 2 && !ok; a++) for (let b = -3; b <= -1 && !ok; b++) for (let e = -2; e <= 2 && !ok; e++) if (s.get(x + a, yv + b, z + e)) ok = true; if (!ok) c.alive = false; }
      for (const f of s.flagH) { if (f.dead) continue; const L = f.local, p = s.toWorld(L.x, L.y, L.z, v3); f.move(p.x, p.y, p.z); if (((AF.clock.frame + s.id) % 40) === 0) { const x = Math.floor(L.x * 4 + s.w / 2), yv = Math.floor(L.y * 4 + s.wl), z = Math.floor(L.z * 4 + s.d / 2); let ok = false; for (let b = 0; b <= 6 && !ok; b++) for (let a = -1; a <= 1 && !ok; a++) for (let e = -1; e <= 1 && !ok; e++) if (s.get(x + a, yv - b, z + e)) ok = true; if (!ok) f.kill(true); } }
    }
    // toppling masts and wreckage
    for (let i = fallers.length - 1; i >= 0; i--) {
      const f = fallers[i]; f.t += dt; f.tipV += dt * 0.9; f.tip = Math.min(1.5, f.tip + f.tipV * dt); f.vy -= 9 * dt * (f.wet ? 0.15 : 1);
      f.mesh.position.y += f.vy * dt; f.mesh.position.x += f.vx * dt * 0.5; f.mesh.position.z += f.vz * dt * 0.5;
      f.mesh.rotation.x = f.az * f.tip; f.mesh.rotation.z = -f.ax * f.tip;
      if (!f.wet && f.mesh.position.y + Math.cos(f.tip) * f.h * 0.3 < sea + 0.5) { f.wet = true; f.vy *= 0.2; AF.fx.splash(f.mesh.position.x + f.ax * f.h * 0.4, f.mesh.position.z + f.az * f.h * 0.4, { size: 2.2 }); AF.fx.splash(f.mesh.position.x, f.mesh.position.z, { size: 1.5 }); }
      if (f.t > 9 || f.mesh.position.y < sea - f.h - 3) { AF.scene.remove(f.mesh); f.mesh.geometry.dispose(); fallers.splice(i, 1); }
    }
  });
}
