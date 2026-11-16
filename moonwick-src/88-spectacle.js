// ===== 88-spectacle (voxel-destruction add-on): what a blast does BEYOND the hole, and how the big moments are shown  (OWNER: coordinator) =====
//  - SHOCKWAVE: every big blast sends a wave through the street — windows shatter, roof tiles lift, plaster cracks, loose cloth catches
//  - FIRE SPLASH: a dragon's fireball throws burning fragments that arc away and start fires where they land
//  - COLLAPSE: a falling building sends a wall of dust rolling down the streets around it
//  - AF.cine: a short slow-motion cutaway of a big collapse (hard cut in, swoop back). Events: 'cine' {on, title, sub, secs}
//  - DUSK: the clock runs on toward night while the city burns
{
  const W = AF.W, PM = AF.PAL.mat, M = AF.MAT, FX = AF.fx, rnd = Math.random, rs = (k) => (rnd() - 0.5) * 2 * k;
  const NX = W.NX || 2400, NZ = W.NZ || 2400, CY = W.NY >> 4, CZ = NZ >> 4;
  // the streets' damp colours shine (the voxel shader's wet flag)
  if (AF.streetWetCols && AF.PAL.setWet) AF.streetWetCols.forEach((c, i) => AF.PAL.setWet(c, i < 2 ? 1 : 0.75));
  const DR = AF.drama = { shocks: 0, glass: 0, tiles: 0, cracks: 0, bombs: 0, lit: 0, cines: 0 };

  // ---------------------------------------------------------------- 1. shockwave (worked through in slabs, a few per frame)
  const shocks = [];
  AF.on('boom', (e) => {
    if (!W.live || e.r < 3.4 || e.by === 'water') return;
    const R = Math.min(15, e.r * 2.7);
    shocks.push({ x: e.x, y: e.y, z: e.z, r: e.r, R, k: 0, n: Math.ceil(R * 4), fire: e.fire > 0 }); DR.shocks++;
    if (shocks.length > 5) shocks.shift();
    // flags and banners within reach are torn off (and catch)
    const fl = AF.kit && AF.kit.flags; if (fl) for (let i = 0; i < fl.length; i++) { const f = fl[i]; if (f.dead || f.ship) continue; const dx = f.x - e.x, dz = f.z - e.z; if (dx > R || dx < -R || dz > R || dz < -R) continue; if (dx * dx + dz * dz + (f.y - e.y) * (f.y - e.y) < R * R * 0.6) f.kill(e.fire > 0); }
  });
  const slab = (s, bx) => {
    if (bx < 0 || bx >= NX) return;
    const cx = (s.x - W.X0) * 4, cy = (s.y - W.Y0) * 4, cz = (s.z - W.Z0) * 4, R4 = s.R * 4, r4 = s.r * 1.3 * 4;
    const dx = bx + 0.5 - cx, hz = Math.sqrt(Math.max(0, R4 * R4 - dx * dx)) | 0;
    const bz0 = Math.max(0, Math.floor(cz - hz)), bz1 = Math.min(NZ - 1, Math.ceil(cz + hz)), by0 = Math.max(0, Math.floor(cy - R4)), by1 = Math.min(W.NY - 1, Math.ceil(cy + R4));
    for (let bz = bz0; bz <= bz1; bz++) {
      const dz = bz + 0.5 - cz, dh2 = dx * dx + dz * dz;
      for (let by = by0; by <= by1; by++) {
        if ((by & 15) === 0 || by === by0) { if (!W.chunks[((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4)]) { by = (by | 15); continue; } }
        const c = W.get(bx, by, bz); if (!c) continue;
        const dy = by + 0.5 - cy, d2 = dh2 + dy * dy; if (d2 > R4 * R4 || d2 < r4 * r4) continue;
        const mat = PM[c], k = 1 - Math.sqrt(d2) / R4;      // 1 at the blast, 0 at the edge of the wave
        if (mat === M.glass) {
          W.set(bx, by, bz, 0); DR.glass++;
          if ((DR.glass & 7) === 0) { const wx = W.xOf(bx) + 0.125, wy = W.yOf(by) + 0.125, wz = W.zOf(bz) + 0.125, l = Math.sqrt(d2) || 1; FX.sparks(wx, wy, wz, { n: 1, speed: 4, life: 0.35, color: 0xcfe8ff }); FX.cube(wx, wy, wz, dx / l * 5 + rs(2), 1 + rnd() * 2, dz / l * 5 + rs(2), c, 0.09, 2.5); }
        } else if (mat === M.tile) {
          if (AF.hash3(bx, by, bz) < 0.16 * k && !W.get(bx, by + 1, bz)) { W.set(bx, by, bz, 0); DR.tiles++; const l = Math.sqrt(dh2) || 1; FX.cube(W.xOf(bx) + 0.125, W.yOf(by) + 0.3, W.zOf(bz) + 0.125, dx / l * (2 + rnd() * 4), 2 + rnd() * 5 * k, dz / l * (2 + rnd() * 4), c, 0.2, 4 + rnd() * 3); }
        } else if (mat === M.plaster) {
          if (AF.hash3(bx >> 1, by >> 1, bz >> 1) < 0.22 * k * k) { const so = AF.sootOf(c); if (so !== c) { W.set(bx, by, bz, so); DR.cracks++; } }
        } else if (s.fire && (mat === M.cloth || mat === M.thatch)) {
          if (rnd() < 0.05 * k && AF.fire && AF.fire.lightVoxel) { AF.fire.lightVoxel(0, bx, by, bz, c); DR.lit++; }
        }
      }
    }
  };
  AF.onTick('drama-shock', 148, () => {
    for (let i = shocks.length - 1; i >= 0; i--) {
      const s = shocks[i], cx = Math.floor((s.x - W.X0) * 4);
      for (let q = 0; q < 5 && s.k <= s.n; q++, s.k++) { slab(s, cx + s.k); if (s.k) slab(s, cx - s.k); }
      if (s.k === 6) for (let j = 0; j < 7; j++) { const a = rnd() * 6.283, d = s.R * (0.45 + rnd() * 0.5), px = s.x + Math.cos(a) * d, pz = s.z + Math.sin(a) * d, py = AF.surfaceBelow(px, pz, s.y + 8, 40); FX.dust(px, py + 0.4, pz, { n: 2, size: 1.6, speed: 2.2, life: 2.6, a: 0.36 }); }
      if (s.k > s.n) shocks.splice(i, 1);
    }
  });

  // ---------------------------------------------------------------- 2. fire splash: burning fragments from a fireball
  const bombs = [];
  AF.on('boom', (e) => {
    if (e.by !== 'dragon' || !(e.fire > 0) || e.r < 3.4 || !W.live) return;
    const n = 6 + ((rnd() * 4) | 0);
    for (let i = 0; i < n && bombs.length < 48; i++) { const a = rnd() * 6.283, v = 6 + rnd() * 9; bombs.push({ x: e.x + Math.cos(a) * 1.2, y: e.y + 1 + rnd() * 1.5, z: e.z + Math.sin(a) * 1.2, vx: Math.cos(a) * v, vy: 5 + rnd() * 8, vz: Math.sin(a) * v, t: 0, s: 0 }); DR.bombs++; }
  });
  AF.onTick('drama-bombs', 149, (dt) => {
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i]; b.t += dt; b.vy -= 13 * dt;
      const sp = Math.hypot(b.vx, b.vy, b.vz) || 1, step = sp * dt;
      const h = b.t > 0.12 ? AF.rayVox(b.x, b.y, b.z, b.vx / sp, b.vy / sp, b.vz / sp, step + 0.3, true) : null;
      if (h || b.t > 5) {
        if (h && !h.water) { AF.ignite(h.x, h.y, h.z, 1.5, 1.1, true); FX.fire(h.x, h.y + 0.3, h.z, { n: 5, size: 1.0, life: 0.6 }); FX.sparks(h.x, h.y + 0.2, h.z, { n: 8, speed: 5, life: 0.8 }); if (FX.flash) FX.flash(h.x, h.y + 0.5, h.z, { color: 0xff8a30, intensity: 0.5, range: 9, life: 0.25, sprite: false }); }
        else if (h && h.water && FX.splash) FX.splash(h.x, h.z, { size: 0.6 });
        bombs.splice(i, 1); continue;
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      b.s += dt; if (b.s > 0.03) { b.s = 0; FX.fire(b.x, b.y, b.z, { n: 1, size: 0.55, life: 0.45, rise: 0.6, spread: 0.08 }); if (rnd() < 0.3) FX.smoke(b.x, b.y, b.z, { n: 1, size: 0.5, dark: 0.85, life: 1.6, rise: 0.8, grow: 2.2, a: 0.4 }); }
    }
  });

  // ---------------------------------------------------------------- 3. a falling building: dust rolls out along the ground
  AF.on('collapse', (e) => {
    if (!e || e.voxels < 1200 || !e.box) return;
    const b = e.box, k = Math.min(1, e.voxels / 12000), n = Math.round(10 + 26 * k), gy = AF.surfaceBelow(e.x, e.z, b[1] + 3, 30);
    const hx = (b[3] - b[0]) / 2 + 1, hz = (b[5] - b[2]) / 2 + 1;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + rs(0.2), ca = Math.cos(a), sa = Math.sin(a), px = e.x + ca * hx, pz = e.z + sa * hz, v = 4 + 7 * k + rnd() * 3;
      FX.smoke(px, gy + 0.8 + rnd() * 1.2, pz, { n: 1, size: 1.6 + 1.6 * k, dark: 0.34, rise: 0.5, grow: 3.4, life: 4 + rnd() * 3, vel: [ca * v, 0.4, sa * v], drag: 0.9, buoy: 0.12, a: 0.5 });
    }
    // and a column of it up the height of the thing as it goes
    const top = Math.min(b[4], gy + 30); for (let y = gy + 2; y < top; y += 3) FX.smoke(e.x + rs(hx * 0.6), y, e.z + rs(hz * 0.6), { n: 1, size: 2.2, dark: 0.4, rise: 1.2, grow: 2.6, life: 4.5, a: 0.42 });
  });

  // ---------------------------------------------------------------- 4b. WOW // (a) a fireball's blast rolls down the street as a wave of flame, and a fireball column climbs out of it
  AF.on('boom', (e) => {
    if (e.by !== 'dragon' || !(e.fire > 0) || e.r < 3.4 || !W.live) return;
    const gy = AF.surfaceBelow(e.x, e.z, e.y + 2, 30), low = e.y - gy < 4.5;
    if (low) for (let i = 0; i < 34; i++) {
      const a = i / 34 * 6.283 + rs(0.1), ca = Math.cos(a), sa = Math.sin(a), v = 10 + rnd() * 7;
      FX.fire(e.x + ca * 1.4, gy + 0.35 + rnd() * 0.5, e.z + sa * 1.4, { n: 1, size: 1.3 + rnd() * 0.9, life: 0.5 + rnd() * 0.3, vel: [ca * v, 0.6, sa * v], rise: 1.2, spread: 0.15, a: 0.85, drag: 1.7, buoy: 1.2, stretch: 1.5 });
      if (i % 3 === 0) FX.dust(e.x + ca * 2, gy + 0.3, e.z + sa * 2, { n: 1, size: 1.8, speed: 7, life: 1.6, a: 0.3 });
    }
    for (let i = 0; i < 9; i++) FX.fire(e.x + rs(1.2), e.y + 0.5 + i * 0.5, e.z + rs(1.2), { n: 1, size: 2.6 + rnd() * 1.6, life: 0.9 + rnd() * 0.5, vel: [rs(1.5), 7 + i * 0.9, rs(1.5)], rise: 2, spread: 0.4, a: 0.8, drag: 0.9, buoy: 1.5, stretch: 1.25 });
    for (let i = 0; i < 5; i++) FX.smoke(e.x + rs(1.5), e.y + 3 + i, e.z + rs(1.5), { n: 1, size: 3 + rnd() * 1.5, dark: 0.9, rise: 6, life: 5 + rnd() * 3, grow: 3, a: 0.5, glow: 1.2, vel: [rs(1), 7, rs(1)] });
  });
  // (b) FIRESTORM: when a quarter burns hot enough a spinning column of fire stands up out of it, wanders, and spreads the blaze
  const WH = DR.whirl = { on: false, t: 0, dur: 13, x: 0, y: 0, z: 0, cool: 10, n: 0, acc: 0, scan: 0, phase: 0 };
  WH.start = (x, y, z) => { if (WH.on) return false; WH.on = true; WH.t = 0; WH.x = x; WH.y = y; WH.z = z; WH.n++; WH.dur = 12 + rnd() * 4; AF.emit('toast', 'A FIRESTORM RISES', true); AF.emit('deed', { label: 'A firestorm rises over the town' }); return true; };
  AF.onTick('drama-whirl', 334, (dt, t) => {
    const F = AF.fire, HF = AF.heatField, cam = AF.camera.position, test = AF.Q.has('whirl');
    if (!WH.on) {
      WH.cool -= dt; WH.scan -= dt; if (WH.cool > 0 || WH.scan > 0 || !F || !HF || !AF.playing || F.count < (test ? 800 : 6000)) return; WH.scan = 1;
      const N = HF.N, k = N / 600, cx = ((cam.x + 300) * k) | 0, cz = ((cam.z + 300) * k) | 0, D = HF.data; let best = test ? 80 : 160, bi = -1;
      for (let z = Math.max(1, cz - 30); z < Math.min(N - 1, cz + 30); z++) for (let x = Math.max(1, cx - 30); x < Math.min(N - 1, cx + 30); x++) { const v = D[(z * N + x) * 4]; if (v > best) { const dx = x - cx, dz = z - cz; if (dx * dx + dz * dz > 16) { best = v; bi = z * N + x; } } }
      if (bi >= 0) { const x = (bi % N + 0.5) / k - 300, z = (((bi / N) | 0) + 0.5) / k - 300; WH.start(x, AF.surfaceBelow(x, z, D[bi * 4 + 1] / 255 * 128 - 16 + 6, 40), z); }
      return;
    }
    WH.t += dt; const u = WH.t / WH.dur; if (u >= 1) { WH.on = false; WH.cool = (18 + rnd() * 10) * (1 - 0.5 * Math.min(1, DR.p || 0)); return; }
    const env = Math.min(1, u * 5, (1 - u) * 4), H = 24 * env, d = Math.hypot(cam.x - WH.x, cam.z - WH.z); WH.phase += dt * 5.5;
    WH.x += Math.sin(t * 0.7) * dt * 1.2; WH.z += Math.cos(t * 0.53) * dt * 1.2;
    WH.acc += dt * (d < 120 ? 640 : 220) * env;
    while (WH.acc > 1) {
      WH.acc -= 1; const h = Math.pow(rnd(), 0.75) * H, a = WH.phase + rnd() * 6.283 + h * 0.35, r = 1.2 + h * 0.16, sw = h * 0.09;
      const px = WH.x + Math.cos(a) * r + Math.sin(t * 1.3 + h * 0.2) * sw, pz = WH.z + Math.sin(a) * r + Math.cos(t * 1.1 + h * 0.2) * sw, tv = 8 + h * 0.25;
      FX.fire(px, WH.y + 0.4 + h, pz, { n: 1, size: 0.9 + h * 0.06 + rnd() * 0.5, life: 0.55 + rnd() * 0.3, vel: [-Math.sin(a) * tv, 9 + rnd() * 4, Math.cos(a) * tv], rise: 1, spread: 0.15, a: 0.95, drag: 0.5, buoy: 2, stretch: 3.0 });
    }
    if (rnd() < dt * 9) FX.smoke(WH.x + rs(2), WH.y + H * (0.8 + rnd() * 0.4), WH.z + rs(2), { n: 1, size: 3.5 + rnd() * 2, dark: 0.92, rise: 7, life: 6 + rnd() * 4, grow: 3.2, a: 0.45, glow: 1.4 });
    if (rnd() < dt * 14) FX.sparks(WH.x + rs(1.5), WH.y + rnd() * H, WH.z + rs(1.5), { n: 4, speed: 12, life: 1.1 });
    if (rnd() < dt * 4 && FX.flash) FX.flash(WH.x, WH.y + H * 0.4, WH.z, { color: 0xff8a30, intensity: 0.5 * env, range: 34, life: 0.3, sprite: false });
    if (rnd() < dt * 1.3) { const a = rnd() * 6.283, rr = 3 + rnd() * 6; AF.ignite(WH.x + Math.cos(a) * rr, WH.y + 1 + rnd() * 6, WH.z + Math.sin(a) * rr, 1.8, 0.9, true); }
    if (d < 45 && rnd() < dt * 3) AF.shake(0.1 * env * (1 - d / 45), WH.x, WH.y + 6, WH.z);
  });
  // (c) EMBERS ON THE WIND: once the city is burning, glowing embers stream past the camera
  let embAcc = 0; const fwdV = new THREE.Vector3();
  AF.onTick('drama-embers', 335, (dt) => {
    const F = AF.fire; if (!F || !AF.playing || F.count < 1500 || (AF.cine && AF.cine.active)) return;
    const cam = AF.camera; embAcc += dt * Math.min(46, F.count / 700) * (1 + Math.min(1, DR.p || 0)); cam.getWorldDirection(fwdV);
    while (embAcc > 1) { embAcc -= 1; const d = 5 + rnd() * 26, lat = rs(15); FX.embers(cam.position.x + fwdV.x * d - fwdV.z * lat, cam.position.y + rs(7) + 1, cam.position.z + fwdV.z * d + fwdV.x * lat, { n: 1, spread: 0.6 }); }
  });
  // (d) BURNING SEA: a ship that is going down goes up in a fireball first and leaves flames on the water
  const slicks = [];
  AF.on('ship-sinking', (sh) => {
    if (!sh || sh.land || slicks.length > 5 || sh.x == null) return; const len = sh.lengthM || (sh.d ? sh.d * 0.25 : 20), sy = AF.PLAN.SEA_Y;
    slicks.push({ sh, x: sh.x, z: sh.z, r: Math.max(5, len * 0.4), t: 30, acc: 0 });
    if (FX.flash) FX.flash(sh.x, sy + 5, sh.z, { color: 0xffa040, intensity: 1.2, range: 70, life: 0.5, sprite: false });
    for (let i = 0; i < 12; i++) FX.fire(sh.x + rs(len * 0.25), sy + 2 + rnd() * 6, sh.z + rs(len * 0.25), { n: 1, size: 3 + rnd() * 2, life: 1 + rnd() * 0.6, vel: [rs(2), 8 + rnd() * 6, rs(2)], rise: 2, a: 0.8, drag: 0.9, stretch: 1.3 });
    FX.sparks(sh.x, sy + 4, sh.z, { n: 40, speed: 16, life: 1.6 });
  });
  AF.onTick('drama-slicks', 336, (dt) => {
    for (let i = slicks.length - 1; i >= 0; i--) {
      const s = slicks[i]; s.t -= dt; if (s.t <= 0) { slicks.splice(i, 1); continue; }
      if (s.sh && !s.sh.sunk) { s.x = s.sh.x; s.z = s.sh.z; }
      const k = Math.min(1, s.t / 8), sy = AF.PLAN.SEA_Y; s.acc += dt * 34 * k;
      while (s.acc > 1) {
        s.acc -= 1; const a = rnd() * 6.283, r = Math.sqrt(rnd()) * s.r * (1.2 - 0.2 * k), px = s.x + Math.cos(a) * r, pz = s.z + Math.sin(a) * r;
        FX.fire(px, sy + 0.15, pz, { n: 1, size: 0.8 + rnd(), life: 0.6 + rnd() * 0.4, rise: 2.2, spread: 0.3, a: 0.75, stretch: 1.8 });
        if (rnd() < 0.06) FX.smoke(px, sy + 1.5, pz, { n: 1, size: 2.4, dark: 0.92, rise: 4, life: 6, grow: 3, a: 0.4, glow: 0.8 });
      }
    }
  });

  // ---------------------------------------------------------------- 4c. WOW, second pass
  // (g) RAINING FIRE: a firestorm hurls burning brands that arc out over the district and start fires where they fall
  let brAcc = 0;
  AF.onTick('drama-brands', 339, (dt) => {
    if (!WH.on) return; const u = WH.t / WH.dur, env = Math.min(1, u * 5, (1 - u) * 4); brAcc += dt * 2.6 * env;
    while (brAcc > 1) { brAcc -= 1; if (bombs.length >= 60) continue; const a = rnd() * 6.283, v = 7 + rnd() * 11; bombs.push({ x: WH.x + Math.cos(a) * 2, y: WH.y + 10 + rnd() * 12, z: WH.z + Math.sin(a) * 2, vx: Math.cos(a) * v, vy: 6 + rnd() * 9, vz: Math.sin(a) * v, t: 0, s: 0 }); }
  });
  // (h) THE POWDER GOES UP: a great blast (a magazine, a powder store) gets a towering fireball, a racing ring of fire and dust,
  //     brands thrown over the roofs, slow motion and a camera kick
  let megaT = -99;
  AF.on('boom', (e) => {
    if (!W.live || e.r < 6.5 || e.by === 'dragon') return;      /* powder stores ashore (r up to 12.5) and ships' magazines (6.8) */
    const gy = AF.surfaceBelow(e.x, e.z, e.y + 3, 40);
    for (let i = 0; i < 26; i++) { const h = i * 1.5, w = i > 17 ? (i - 17) * 1.1 : 0.6; FX.fire(e.x + rs(1.5 + w), e.y + 1 + h * 0.4, e.z + rs(1.5 + w), { n: 1, size: 3 + rnd() * 2 + w * 0.6, life: 1.3 + rnd() * 0.8, vel: [rs(2 + w), 9 + h * 0.55, rs(2 + w)], rise: 2, spread: 0.6, a: 0.9, drag: 0.8, buoy: 1.2, stretch: 3.0 }); }
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * 6.283, ca = Math.cos(a), sa = Math.sin(a), v = 16 + rnd() * 10;
      FX.fire(e.x + ca * 2, gy + 0.4 + rnd(), e.z + sa * 2, { n: 1, size: 1.8 + rnd() * 1.4, life: 0.7 + rnd() * 0.4, vel: [ca * v, 0.8, sa * v], rise: 1.2, spread: 0.2, a: 0.9, drag: 1.4, buoy: 1.2, stretch: 1.5 });
      if (i % 2 === 0) FX.smoke(e.x + ca * 3, gy + 0.8, e.z + sa * 3, { n: 1, size: 3, dark: 0.4, rise: 0.6, grow: 3.4, life: 4 + rnd() * 2, vel: [ca * v * 0.8, 0.4, sa * v * 0.8], drag: 0.9, buoy: 0.1, a: 0.5 });
    }
    for (let i = 0; i < 14; i++) FX.smoke(e.x + rs(3), e.y + 8 + i * 2, e.z + rs(3), { n: 1, size: 6 + rnd() * 3, dark: 0.93, rise: 8, life: 10 + rnd() * 6, grow: 2.8, a: 0.55, glow: 1.6, vel: [rs(1.5), 9, rs(1.5)] });
    FX.sparks(e.x, e.y + 2, e.z, { n: 90, speed: 26, life: 2.2 }); if (FX.flash) FX.flash(e.x, e.y + 6, e.z, { color: 0xffb060, intensity: 2.2, range: 110, life: 0.7, sprite: false });
    for (let i = 0; i < 10 && bombs.length < 60; i++) { const a = rnd() * 6.283, v = 10 + rnd() * 14; bombs.push({ x: e.x, y: e.y + 3, z: e.z, vx: Math.cos(a) * v, vy: 10 + rnd() * 12, vz: Math.sin(a) * v, t: 0, s: 0 }); }
    AF.shake(2.2, e.x, e.y, e.z);
    if (AF.playing && megaT < AF.clock.t - 6) { megaT = AF.clock.t; if (AF.slowmo) AF.slowmo(0.3, 1.6); AF.emit('toast', 'THE POWDER GOES UP', true); }
  });
  // (j) a burning building that falls throws a fountain of flame and embers
  AF.on('collapse', (e) => {
    if (!e || e.voxels < 2500 || !AF.fire || !AF.fire.heat || !(AF.fire.heat(e.x, e.z) > 0.15)) return;
    const b = e.box, gy = AF.surfaceBelow(e.x, e.z, (b ? b[1] : e.y) + 3, 30), k = Math.min(1, e.voxels / 12000);
    for (let i = 0; i < 10 + 14 * k; i++) FX.fire(e.x + rs(2.5), gy + 1 + rnd() * 3, e.z + rs(2.5), { n: 1, size: 1.8 + rnd() * 1.4 + 1.2 * k, life: 0.9 + rnd() * 0.6, vel: [rs(3), 6 + rnd() * 8, rs(3)], rise: 2, spread: 0.5, a: 0.85, drag: 0.9, stretch: 3.0 });
    FX.sparks(e.x, gy + 3, e.z, { n: 50 + ((60 * k) | 0), speed: 14 + 8 * k, life: 2 }); FX.embers(e.x, gy + 4, e.z, { n: 30, spread: 5 });
  });

  // ---------------------------------------------------------------- 4d. WOW, third pass
  const later = [];
  AF.onTick('drama-later', 341, (dt) => { for (let i = later.length - 1; i >= 0; i--) { const q = later[i]; q.t -= dt; if (q.t <= 0) { later.splice(i, 1); try { q.fn(); } catch (e) { console.error('[af] drama later', e); } } } });
  // (l) a LANDMARK falling erupts: sparks to the sky, a ring of dust, the ground shakes, and a firestorm takes its place
  let lmT = -99;
  AF.on('structure-destroyed', (s) => {
    if (!s || !s.box || !AF.playing) return; const b = s.box, vol = (b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]);
    if (vol < 3000) return; const x = (b[0] + b[3]) / 2, z = (b[2] + b[5]) / 2, gy = AF.surfaceBelow(x, z, b[1] + 4, 40), k = Math.min(1, vol / 12000);
    FX.sparks(x, gy + 6, z, { n: 60 + ((90 * k) | 0), speed: 16 + 10 * k, life: 2.6 }); FX.embers(x, gy + 5, z, { n: 40, spread: 8 });
    for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283, v = 8 + 8 * k; FX.smoke(x + Math.cos(a) * 3, gy + 1, z + Math.sin(a) * 3, { n: 1, size: 2.6 + 2 * k, dark: 0.35, rise: 0.5, grow: 3.4, life: 4 + rnd() * 3, vel: [Math.cos(a) * v, 0.4, Math.sin(a) * v], drag: 0.9, buoy: 0.1, a: 0.5 }); }
    AF.shake(0.8 + 1.2 * k, x, gy, z);
    if (AF.clock.t - lmT > 10 && vol > 6000) { lmT = AF.clock.t; if (AF.slowmo) AF.slowmo(0.35, 1.2); if (AF.fire && AF.fire.heat && AF.fire.heat(x, z) > 0.1) WH.start(x, gy, z); }
  });
  // (m) FIRE-BORN LIGHTNING: over a city that is really burning, the smoke throws lightning down onto the roofs
  DR.bolt = (x, z) => {
    const y1 = AF.surfaceBelow(x, z, 100, 130), y0 = y1 + 55 + rnd() * 25, n = 78; let px = x + rs(14), pz = z + rs(14);
    for (let i = 0; i <= n; i++) { const k = i / n; px += (x - px) / (n - i + 1) + rs(1.1) * (1 - k); pz += (z - pz) / (n - i + 1) + rs(1.1) * (1 - k); if (i % 9 === 4) { px += rs(3.5) * (1 - k); pz += rs(3.5) * (1 - k); } FX.flash(px, y0 + (y1 - y0) * k, pz, { color: 0xcfd8ff, intensity: 1.3, range: 3.2 + rnd() * 1.2, life: 0.17 + rnd() * 0.08 }); }
    FX.flash(x, y0 - 10, z, { color: 0xbfd0ff, intensity: 1.5, range: 150, life: 0.22, sprite: false });
    FX.flash(x, y1 + 1, z, { color: 0xdfe6ff, intensity: 1.4, range: 26, life: 0.3 });
    FX.sparks(x, y1 + 0.5, z, { n: 30, speed: 14, life: 1.2, color: 0xdfe8ff }); if (rnd() < 0.6) AF.ignite(x, y1, z, 2, 1.2, true);
    if (rnd() < 0.45 && AF.playing) AF.boom(x, y1 - 0.4, z, { r: 2.3, power: 1, fire: 1, by: 'chain' });      // it blasts a bite out of the roof it strikes
    AF.shake(0.25, x, y1, z); DR.bolts = (DR.bolts | 0) + 1;
  };
  let ltT = 10;
  AF.onTick('drama-lightning', 340, (dt) => {
    const F = AF.fire; if (!F || !AF.playing || F.count < (DR.p > 0.5 ? 13000 : 20000) || (AF.cine && AF.cine.active)) return;
    ltT -= dt; if (ltT > 0) return; ltT = (5 + rnd() * 9) * (1 - 0.5 * Math.min(1, DR.p || 0));
    const cam = AF.camera; cam.getWorldDirection(fwdV); const d = 60 + rnd() * 90, lat = rs(60), x = cam.position.x + fwdV.x * d - fwdV.z * lat, z = cam.position.z + fwdV.z * d + fwdV.x * lat;
    if (Math.abs(x) < 280 && Math.abs(z) < 280) DR.bolt(x, z);
  });

  // ---------------------------------------------------------------- 4g. WOW, seventh pass
  // (t) SCARS: every fireball leaves a blackened crater with embers glowing in it at once (written straight into the burnt field)
  AF.on('boom', (e) => {
    const HF = AF.heatField; if (!HF || !W.live || e.r < 3.4 || !(e.fire > 0) || (e.by !== 'dragon' && e.by !== 'chain')) return;
    const N = HF.N, k = N / 600, D = HF.data, cx = (e.x + 300) * k, cz = (e.z + 300) * k, rr = e.r * 1.25 * k;
    for (let z = Math.max(0, Math.floor(cz - rr)); z <= Math.min(N - 1, Math.ceil(cz + rr)); z++) for (let x = Math.max(0, Math.floor(cx - rr)); x <= Math.min(N - 1, Math.ceil(cx + rr)); x++) {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz) / rr; if (d > 1) continue; const o = (z * N + x) * 4; D[o + 2] = Math.max(D[o + 2], Math.round(230 * (1 - d * d * 0.6))); if (D[o + 1] === 0) D[o + 1] = Math.max(0, Math.min(255, Math.round((e.y + 16) / 128 * 255))); }
    HF.tex.needsUpdate = true;
  });
}
