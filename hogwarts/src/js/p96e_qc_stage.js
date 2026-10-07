/* ==== p96e_qc_stage.js ==== */
/* QUIDDITCH CAREER — the director. The career's scenes (p96c: data — who stands where, which shot, who says what, the
   choices) staged in the castle itself rather than in sets of their own: the Great Hall with its four house tables and
   its bewitched ceiling, a common room, the Potions classroom, Hogsmeade's high street, the Black Lake, the players'
   gate of the pitch. Each stage is a frame in the world (an origin and a heading) with anchors and camera shots laid
   out in it; the cast are the castle's own students and staff in your house's robes, posed with its mocap; the camera
   runs on the engine's cine camera; lines come up in a dialogue box, choices as buttons. The API is the one the career
   was written against (Scenes.enter / spawn / shot / leave, Script.play / tap / skip, Dialogue). */
const Scenes = { active: false, set: null, cast: {}, t: 0, cam: null, mode: null, cp: new THREE.Vector3(), cl: new THREE.Vector3(), cfov: 50, F: null, extras: [] };
/* ------------------------------------------------------------------ frames: local [x right, y up, z forward] → world */
Scenes.frame = (x, y, z, yaw) => ({ x, y, z, yaw, s: Math.sin(yaw), c: Math.cos(yaw) });
/* (a rotation by the frame's heading, the engine's sense of yaw: local +z is the frame's forward, local +x its forward turned a quarter clockwise seen from above — at heading 0, the world's own axes) */
Scenes.W = function (p, out) { const F = Scenes.F; out = out || new THREE.Vector3(); if (!F) return out.set(p[0], p[1], p[2]); return out.set(F.x + F.c * p[0] + F.s * p[2], F.y + p[1], F.z - F.s * p[0] + F.c * p[2]); };
Scenes.WY = (yaw) => (Scenes.F ? Scenes.F.yaw : 0) + (yaw || 0);
/* ------------------------------------------------------------------ props for the occasions the castle does not dress for itself */
const SProps = {
  mats: null,
  M() { if (this.mats) return this.mats; const m = this.mats = {}; m.pump = new THREE.MeshStandardMaterial({ color: 0xd8701a, roughness: 0.6 }); m.stem = new THREE.MeshStandardMaterial({ color: 0x4a5a22, roughness: 0.8 });
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#ffd070'; g.beginPath(); g.moveTo(30, 52); g.lineTo(50, 52); g.lineTo(40, 34); g.fill(); g.beginPath(); g.moveTo(78, 52); g.lineTo(98, 52); g.lineTo(88, 34); g.fill(); g.beginPath(); g.moveTo(22, 74); g.lineTo(106, 74); g.lineTo(92, 98); g.lineTo(78, 88); g.lineTo(64, 100); g.lineTo(50, 88); g.lineTo(36, 98); g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; m.face = new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2.4, 1.6, 0.7) });
    m.fir = new THREE.MeshStandardMaterial({ color: 0x1c3a22, roughness: 0.85 }); m.trunk = new THREE.MeshStandardMaterial({ color: 0x3a2614, roughness: 0.9 }); m.bauble = [0xc82020, 0xe8b830, 0x2a5ad0, 0xd8d8e0].map((c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.8, roughness: 0.25, emissive: c, emissiveIntensity: 0.25 }));
    m.light = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.2) }); m.snow = new THREE.MeshStandardMaterial({ color: 0xf2f5fa, roughness: 0.7 });
    { const c2 = document.createElement('canvas'); c2.width = c2.height = 32; const g2 = c2.getContext('2d'), gr = g2.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 32, 32); m.flake = new THREE.CanvasTexture(c2); }
    return m; },
  pumpkin(s) { const M = this.M(), g = new THREE.Group(), geo = new THREE.SphereGeometry(0.42, 18, 12), pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), a = Math.atan2(z, x), k = 1 + 0.06 * Math.cos(a * 8); pa.setXYZ(i, x * k, pa.getY(i) * 0.82, z * k); } geo.computeVertexNormals();
    const b = new THREE.Mesh(geo, M.pump); b.castShadow = true; g.add(b); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.16, 6), M.stem); st.position.y = 0.38; g.add(st); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), M.face); f.position.set(0, 0.02, 0.4); g.add(f); g.scale.setScalar(s || 1); return g; },
  fir(h) { const M = this.M(), g = new THREE.Group(), n = 6; const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, h * 0.18, 8), M.trunk); tr.position.y = h * 0.09; g.add(tr);
    for (let i = 0; i < n; i++) { const t = i / n, r = (1 - t) * h * 0.3 + 0.2, c = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.26, 12), M.fir); c.position.y = h * 0.16 + t * h * 0.72 + h * 0.13; c.castShadow = true; g.add(c);
      for (let k = 0; k < 7 - i; k++) { const a = k / (7 - i) * TAU + i, bb = new THREE.Mesh(new THREE.SphereGeometry(0.07 + RNG() * 0.04, 8, 6), i % 2 ? M.bauble[(k + i) % 4] : M.light); bb.position.set(Math.cos(a) * r * 0.86, c.position.y - h * 0.1, Math.sin(a) * r * 0.86); g.add(bb); } }
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), M.light); star.position.y = h * 1.02; g.add(star); return g; },
  snow(cx, cy, cz, w, hgt) { const N = 2600, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = cx + (RNG() - 0.5) * w; pos[i * 3 + 1] = cy + RNG() * hgt; pos[i * 3 + 2] = cz + (RNG() - 0.5) * w; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: 0xffffff, map: this.M().flake, size: 0.12, transparent: true, opacity: 0.9, depthWrite: false }); const pts = new THREE.Points(g, m); pts.frustumCulled = false;
    pts.userData.tick = (dt) => { for (let i = 0; i < N; i++) { let y = pos[i * 3 + 1] - dt * (0.6 + (i % 7) * 0.08); if (y < cy) y += hgt; pos[i * 3 + 1] = y; pos[i * 3] += Math.sin(MG.rt * 0.7 + i) * dt * 0.15; } g.attributes.position.needsUpdate = true; }; return pts; },
  /* put a list of props into the stage, removed with it */
  place(S, list) { S.props = (S.props || []).concat(list); for (const o of list) R.scene.add(o); const l0 = S.onLeave, u0 = S.update; S.onLeave = () => { for (const o of list) R.scene.remove(o); if (l0) l0(); }; S.update = (dt, t) => { for (const o of list) { if (o.userData.tick) o.userData.tick(dt, t); if (o.userData.bob) o.position.y = o.userData.bob + Math.sin(t * 1.1 + o.userData.ph) * 0.18; } if (u0) u0(dt, t); }; },
};
/* ------------------------------------------------------------------ the stages */
const STAGES = {
  /* the Great Hall: the frame stands in the aisle between the middle tables, facing the dais (local −z is the dais, +z the doors) */
  hall(variant) {
    const G = HL.GHR; if (!G) return null; const xc = (G.x0 + G.x1) / 2, Y = HL.Y0, za = G.z0 + 17, zb = G.z1 - 6, zm = (za + zb) / 2;
    const F = Scenes.frame(xc, Y, zm, 0);   // heading +z (toward the doors): the dais is local −z
    const L = zb - za, TX = [-12.4, -4.3, 4.3, 12.4];   // the house tables across the hall: gryffindor, slytherin, ravenclaw, hufflepuff
    const h = Career.S ? Career.S.profile.house : 0, hx = TX[h], dz = (G.z1 - G.z0) / 2;
    const seat = (x, z, yaw) => [x, 0, z, yaw, 'sit'];
    const A = {
      seatMe: seat(hx - 1.15, -2.0, PI / 2), seatF: seat(hx + 1.15, -1.3, -PI / 2), firstYears: [-1.6, 0, -(zm - za) + 3.5, 0], stool: [0, 0, -(zm - za) - 3.2, PI], high: [0, 0.45, -(zm - G.z0) + 7.2 - 1.5, 0],
      danceMe: [-0.6, 0, -L * 0.18, 0.4], danceP: [0.6, 0, -L * 0.18 + 0.7, PI + 0.4], dance1: [-3, 0, -L * 0.22, 0.2], dance2: [3.2, 0, -L * 0.15, -0.6], dance3: [-2.4, 0, -L * 0.05, 2.6], dance4: [2.6, 0, -L * 0.3, 3.4],
      examMe: [hx - 1.15, 0, 0, PI / 2, 'sit'], examF: [hx + 1.15, 0, 1.6, -PI / 2, 'sit'],
    };
    const C = {
      default: { p: [0, 5.5, dz - 2], l: [0, 3.5, -10], fov: 50 },
      hallWide: { p: [0, 8.5, L / 2 + 3], l: [0, 4.2, -L / 2], p2: [0, 6.2, L / 2 - 6], l2: [0, 3.2, -L / 2 - 2], fov: 56, dur: 9 },
      hallDoor: { p: [0.4, 1.7, L / 2 + 4], l: [0, 7, 0], p2: [0.2, 2.2, L / 2 - 2], fov: 60, dur: 7 },
      stool: { p: [2.4, 1.7, A.stool[2] + 3.6], l: [0, 1.45, A.stool[2]], p2: [1.7, 1.6, A.stool[2] + 2.8], fov: 36, dur: 8 },
      houseTable: { p: [hx + 3.6, 2.1, -2 + 5.4], l: [hx, 0.95, -2], p2: [hx + 2.8, 1.7, -2 + 3.8], fov: 44, dur: 8 },
      tableClose: { p: [hx - 0.15, 1.3, 0.9], l: [hx + 0.1, 1.05, -1.8], p2: [hx + 0.2, 1.25, 0.4], fov: 40, dur: 9 },
      pumpkins: { p: [hx + 2, 1.5, 2], l: [hx, 10, -10], p2: [hx + 1, 1.7, 0], fov: 58, dur: 8 },
      trees: { p: [6, 2, 4], l: [12, 5, -6], p2: [5, 2.4, 0], fov: 50, dur: 8 },
      yuleWide: { p: [0, 7, L * 0.3], l: [0, 1.5, -L * 0.18], p2: [3, 5, L * 0.12], fov: 48, dur: 10 },
      danceOrbit: { orbit: { c: [0, 1.2, -L * 0.18], r: 3.6, h: 0.5, a0: 0.4, w: 0.12 }, p: [0, 2, 4], l: [0, 1.2, 0], fov: 42, dur: 20 },
      examWide: { p: [0, 6.5, 12], l: [0, 1, -12], p2: [-2, 4.5, 6], fov: 50, dur: 10 },
    };
    const S = { F, anchors: A, cams: C, house: h, tables: TX, variant, extras: variant === 'yule' || variant === 'exams' ? 0 : 6 };
    const prev = Scenes.F; Scenes.F = F; const list = [];
    if (variant === 'halloween') for (let i = 0; i < 26; i++) { const p = SProps.pumpkin(0.9 + RNG() * 0.4), w = Scenes.W([TX[i % 4] + (RNG() - 0.5) * 5, 6.5 + RNG() * 4, -L / 2 + 4 + (i / 26) * (L - 4)], new THREE.Vector3()); p.position.copy(w); p.rotation.y = F.yaw + PI + (RNG() - 0.5) * 0.8; p.userData.bob = w.y; p.userData.ph = i; list.push(p); }
    if (variant === 'christmas' || variant === 'yule' || variant === 'gala') for (const [lx, lz] of [[-15.5, -8], [15.5, -8], [-15.5, 8], [15.5, 8]]) { const t = SProps.fir(variant === 'gala' ? 5.5 : 7), w = Scenes.W([lx, 0, lz], new THREE.Vector3()); t.position.copy(w); list.push(t); }
    Scenes.F = prev; if (list.length) SProps.place(S, list);
    return S;
  },
  /* a common room: by the fire, two armchairs (chairL / chairR), a friend standing (standF) */
  common(variant) {
    /* your own house's: the towers' lounges are furnished alike (the anchors fit either); Slytherin's runs long under the lake
       with its armchairs in facing pairs, Hufflepuff's is round them about a low table by the cellar fire */
    const hk = QC.key(Career.S ? Career.S.profile.house : 0), D = HL.DUN, yd = D ? HL.Y0 - D.d : 0;
    if (hk === 'slytherin' && D && D.sly) { const R = D.sly, z = R.z0 + 11.6, F = Scenes.frame(R.cx, yd, z, PI);
      const A = { chairL: [-1.6, 0, 0, HALF, 'sit'], chairR: [1.6, 0, 0, -HALF, 'sit'], standF: [0.9, 0, 1.6, PI - 0.4], fire: [0, 0, -(R.z1 - z) + 1.2, PI], board: [0, 0, -2.5, PI] };
      const C = { default: { p: [0.4, 1.7, 3.6], l: [0, 1.0, -2], fov: 50 }, fire: { p: [-0.6, 1.4, 2.6], l: [0.1, 1.0, -1.4], p2: [0.4, 1.35, 1.8], fov: 44, dur: 12 }, hub: { orbit: { c: [0, 1.4, -1.2], r: 4.2, h: 0.5, a0: 0.3, w: 0.04 }, p: [0, 1.6, 3], l: [0, 1, -1], fov: 50, dur: 999 } };
      return { F, anchors: A, cams: C, variant }; }
    if (hk === 'hufflepuff' && D && D.huf) { const R = D.huf, ox = R.cx - 0.6, oz = R.cz, F = Scenes.frame(ox, yd, oz, PI);   // looking up the room (north), the fire on the left
      // its armchairs stand round the table facing outward; the two on the south side face the camera
      const ch = (a) => { const an = a / 5 * TAU + 0.5; return [-Math.cos(an) * 2.2, 0, -Math.sin(an) * 2.6, -an + HALF - PI, 'sit']; };
      const A = { chairL: ch(3), chairR: ch(4), standF: [0.9, 0, 1.1, PI - 0.4], fire: [(ox - R.x0) - 1.2, 0, 0, HALF], board: [0, 0, -2.5, PI] };
      const C = { default: { p: [0.3, 1.6, 5.4], l: [0, 1.0, 1.0], fov: 50 }, fire: { p: [-0.8, 1.4, 4.6], l: [0.4, 1.0, 1.2], p2: [0.4, 1.35, 4.2], fov: 46, dur: 12 }, hub: { orbit: { c: [0, 1.2, 0], r: 2.8, h: 0.8, a0: 0.3, w: 0.04 }, p: [0, 1.6, 3], l: [0, 1, -1], fov: 54, dur: 999 } };
      return { F, anchors: A, cams: C, variant }; }
    const c = (HL.COMMONS && HL.COMMONS[hk]) || HL.COMMON; if (!c) return null; const F = Scenes.frame(c[0], c[1], c[2], 0);
    const A = { chairL: [-1.1, 0, -0.6, PI / 2 - 0.5, 'sit'], chairR: [1.1, 0, -0.6, -PI / 2 + 0.5, 'sit'], standF: [0.9, 0, 1.1, PI - 0.4], fire: [0, 0, -3.2, PI], board: [0, 0, -2.5, PI] };
    const C = { default: { p: [0.2, 1.7, 3.4], l: [0, 1.0, -2], fov: 50 }, fire: { p: [-0.5, 1.4, 2.4], l: [0.1, 1.0, -1.4], p2: [0.4, 1.35, 1.6], fov: 44, dur: 12 }, hub: { orbit: { c: [0, 1.1, -0.6], r: 3.8, h: 0.7, a0: 0.3, w: 0.04 }, p: [0, 1.6, 3], l: [0, 1, -1], fov: 46, dur: 999 } };
    return { F, anchors: A, cams: C, variant };
  },
  /* Potions (or Charms): the desks in rows before the professor */
  potions(variant) {
    const P = HL.plan(0), name = variant === 'charms' ? 'THE CHARMS CLASSROOM' : 'THE POTIONS CLASSROOM'; let c = P.comps.find((q) => q.name === name) || P.comps.find((q) => /POTIONS|ALCHEMY/.test(q.name || ''));
    if (!c) return null; const x = (P.X(c.R.i0) + P.X(c.R.i1 + 1)) / 2, z = (P.Z(c.R.j0) + P.Z(c.R.j1 + 1)) / 2, w = Math.abs(P.X(c.R.i0) - P.X(c.R.i1 + 1)), d = Math.abs(P.Z(c.R.j0) - P.Z(c.R.j1 + 1)), along = d >= w;
    const F = Scenes.frame(x, P.y, z, along ? PI : HALF), D = along ? d : w;
    const A = { deskMe: [-1.0, 0, 0.6, 0], deskF: [0.6, 0, 0.6, 0], deskR: [2.2, 0, -0.8, 0], prof: [0, 0, -D / 2 + 2.4, PI] };
    const C = { default: { p: [0, 2.4, D / 2 - 1], l: [0, 1.2, -2], fov: 52 }, potionsWide: { p: [-3.5, 3.0, D / 2 - 1.2], l: [0, 1.2, -1.5], p2: [-2.2, 2.6, D / 2 - 2.4], fov: 52, dur: 10 },
      cauldron: { p: [-0.3, 1.75, -1.5], l: [-0.6, 1.25, 0.6], p2: [0.0, 1.7, -1.2], fov: 46, dur: 10 } };
    return { F, anchors: A, cams: C, variant };
  },
  /* Hogsmeade: the high street, looking down it */
  hogsmeade(variant) {
    const V = HL.VIL; if (!V) return null; const x = V.x + 6, z = V.z, y = HL.gy(x, z); const F = Scenes.frame(x, y, z, -HALF);
    const A = { streetMe: [-0.6, 0, 6, PI * 0.9], streetF: [0.6, 0, 5.4, -PI * 0.85], streetR: [0.3, 0, 2.2, 0] };
    const C = { default: { p: [0, 2, 12], l: [0, 1.5, 0], fov: 50 }, streetWide: { p: [2.5, 4.5, 16], l: [0, 2, -8], p2: [1.5, 3.4, 11], fov: 50, dur: 10 }, streetClose: { p: [1.4, 1.65, 8.2], l: [-0.1, 1.45, 5.6], p2: [1.1, 1.6, 7.6], fov: 40, dur: 10 } };
    const S = { F, anchors: A, cams: C, variant, ground: true };
    if (variant === 'snow') { const prev = Scenes.F; Scenes.F = F; const w = Scenes.W([0, 0, 4], new THREE.Vector3()); Scenes.F = prev; SProps.place(S, [SProps.snow(w.x, w.y, w.z, 34, 14)]); }
    return S;
  },
  /* the Black Lake: a boat on the open water below the crag, the castle lit on the cliff above (first-years cross by boat) */
  lake() {
    const x = 322, z = 58, wy = 0.32, Y = Math.atan2(30 - x, 112 - z), F = Scenes.frame(x, wy, z, Y);   // out on the open loch east of the crag, bow to the castle
    const A = { boatMe: [-0.32, -0.12, 0.35, 0, 'sit'], boatF: [0.32, -0.12, -0.55, 0, 'sit'] };
    const C = { default: { p: [2.5, 1.6, -5], l: [0, 1.2, 2], fov: 50 }, lakeWide: { p: [6, 6.5, -12], l: [0, 34, 240], p2: [3.5, 4.2, -7], l2: [0, 30, 240], fov: 46, dur: 11 }, boats: { p: [1.5, 1.25, 2.4], l: [0, 0.85, -0.1], p2: [1.25, 1.2, 2.0], fov: 40, dur: 9 } };
    // the boat: a clinker hull, two thwarts, a lantern on a crook at the bow
    const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.82 }), dark = new THREE.MeshStandardMaterial({ color: 0x2e1e10, roughness: 0.9 });
    { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.62 * Math.sin(t * HALF) + 0.02, -0.34 + t * 0.42)); } const hull = new THREE.LatheGeometry(pts, 24, 0, PI); hull.rotateZ(PI); hull.scale(1, 1, 2.6); hull.computeVertexNormals(); const m = new THREE.Mesh(hull, new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.82, side: THREE.DoubleSide })); m.position.y = 0.08; m.castShadow = true; g.add(m); }
    for (const zz of [0.35, -0.55]) { const th = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.24), wood); th.position.set(0, 0.0, zz); g.add(th); }
    { const crook = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.1, 6), dark); crook.position.set(0, 0.5, 1.45); g.add(crook); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.1, 0.9) })); lamp.position.set(0, 1.02, 1.5); g.add(lamp); g.userData.lamp = lamp; }
    const w = (Scenes.F = F, Scenes.W([0, 0, 0], new THREE.Vector3())); g.position.set(w.x, wy, w.z); g.rotation.y = Y; R.scene.add(g);
    const lt = R.addLight ? R.addLight({ pos: Scenes.W([0, 1.05, 1.5], new THREE.Vector3()), col: new THREE.Color(1, 0.72, 0.4), i: 6, range: 7, prio: 6, on: true, persist: true }) : null;
    return { F, anchors: A, cams: C, boat: g, update(dt, t) { g.position.y = wy + Math.sin(t * 1.3) * 0.03; g.rotation.z = Math.sin(t * 0.9) * 0.025; g.rotation.x = Math.sin(t * 1.1) * 0.015; for (const id in Scenes.cast) { const c = Scenes.cast[id]; c.a.sitY = wy - 0.12 + Math.sin(t * 1.3) * 0.03; } }, onLeave() { R.scene.remove(g); if (lt) lt.i = 0; } };
  },
  /* the players' gate of the pitch: the huddle before a match (the career's locker room), and the walk out */
  locker(variant) {
    // on the grass just inside the players' gate (a gap in the west stands between two braziers), facing the gate: the pitch is behind you
    const C0 = HL.PITCH, Q = HL.Q; const F = Scenes.frame(C0.x - Q.AX + 4, Q.Y0, C0.z - 20, -HALF);
    const A = { lockMe: [0, 0, -1.7, 0], board: [0, 0, 2.6, PI], pitchMe: [0, 0, -12, 0], me: [0, 0, 0, PI + 0.35] };
    for (let i = 0; i < 7; i++) { const a = -1.2 + i * (2.4 / 6); A['mate' + i] = [Math.sin(a) * 2.7, 0, Math.cos(a) * 2.7 - 1.5, a + PI]; }
    const C = { default: { p: [0.4, 1.9, -6.4], l: [0, 1.2, 0.6], fov: 50 }, lockerWide: { p: [3.4, 2.4, -5.4], l: [0, 1.1, 0.4], p2: [2.4, 2.1, -4.4], fov: 52, dur: 10 }, board: { p: [0.7, 1.7, 0.9], l: [0, 1.4, 2.6], fov: 46 },
      hub: { orbit: { c: [0, 4.6, 0.2], r: 8, h: -2.8, a0: PI - 0.5, w: 0.03 }, p: [0, 2, -6], l: [0, 1.2, 0], fov: 52, dur: 999 } };   // (low, looking up at the stands and the sky)
    return { F, anchors: A, cams: C, variant, ground: true };
  },
  /* the pitch itself */
  world(variant) {
    const C0 = HL.PITCH, Q = HL.Q; const F = Scenes.frame(C0.x, Q.Y0, C0.z, 0);
    const A = { pitchMe: [0, 0, -14, 0], pitchF: [1.4, 0, -13.2, -0.3], pitchCapt: [-1.2, 0, -12.6, 0.4], standsMe: [-Q.AX - 8, 3.2, -10, HALF], standsF: [-Q.AX - 8, 3.2, -9, HALF] };
    const C = { default: { p: [0, 6, -40], l: [0, 6, 20], fov: 52 }, pitchLow: { p: [3, 1.4, -8.5], l: [0, 1.3, -14], p2: [2.2, 1.5, -9.5], fov: 44, dur: 9 }, standsView: { p: [-Q.AX - 10, 5, -12], l: [0, 6, 10], p2: [-Q.AX - 9.5, 4.6, -8], fov: 52, dur: 10 }, castle: { p: [0, 30, -60], l: [-210, 60, -300], p2: [0, 26, -50], fov: 48, dur: 10 } };
    return { F, anchors: A, cams: C, variant, ground: true };
  },
  /* the press: pitch-side, under the stand (the reporters sit on a bench before you) */
  press(variant) {
    const C0 = HL.PITCH, Q = HL.Q, rx = C0.x - Q.AX - 4, rz = C0.z - 30; const F = Scenes.frame(rx - 2, Q.Y0, rz, HALF);
    const A = { seat: [0, 0, -1.6, 0], rep0: [-2.0, 0, 1.4, PI], rep1: [0.4, 0, 1.6, PI], rep2: [2.3, 0, 1.2, PI], quill: [3.0, 1.2, 1.9] };
    const C = { default: { p: [0, 1.7, 4.4], l: [0, 1.2, -1.6], fov: 48 }, reporters: { p: [-1.35, 1.78, -3.7], l: [0.6, 1.25, 1.4], fov: 54 }, player: { p: [0.5, 1.55, 0.5], l: [0, 1.45, -1.6], fov: 38 }, quill: { p: [3.0, 1.6, 0.6], l: [3.0, 1.2, 1.9], fov: 34 } };
    C.rep = (i) => { const a = A['rep' + i]; return { p: [a[0] * 0.4, 1.55, a[2] - 2.2], l: [a[0], 1.5, a[2]], fov: 36 }; };
    // the Quick-Quotes Quill (acid green, scribbling on its own) and the photographers' flashes
    const quill = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x5cff6a, emissive: 0x1a8a20, emissiveIntensity: 1.4, roughness: 0.4, side: THREE.DoubleSide }), f = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.34, 1, 4), m); f.rotation.z = 0.5; f.position.y = 0.12; quill.add(f);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 })); pad.position.y = -0.04; quill.add(pad); } quill.visible = false; R.scene.add(quill);
    const flash = () => { const i = (Math.random() * 3) | 0, a = A['rep' + i], w = Scenes.W([a[0] + (Math.random() - 0.5) * 2, 1.9, a[2] + 0.8]); FX.flashLight(w, [1, 1, 1.05], 26, 9, 0.09); };
    const S = { F, anchors: A, cams: C, variant, ground: true, quill, flash, update(dt, t) { if (quill.visible) { quill.rotation.y = Math.sin(t * 9) * 0.4; quill.children[0].rotation.x = Math.sin(t * 23) * 0.3; } }, onLeave() { R.scene.remove(quill); } };
    return S;
  },
  studio() { return STAGES.locker('school'); },
};
/* ------------------------------------------------------------------ who is who: castle templates for the career's people */
Scenes.tpl = function (id, spec) {
  const S = Career.S, o = (spec && spec.o) || {}, kit = o.outfit === 'kit' || o.outfit === 'track';
  const pro = S && S.phase !== 'school' && kit, myKey = pro ? QC.key(Career.myTeam()) : QC.key(S ? S.profile.house : 0);
  const formal = o.outfit === 'formal', staff = /^(prof|head|hooch|scout|rep|press|coach|agent|minister|extra)/.test(id), dress = formal && !staff ? 'ball' : null;   // dress robes at the balls
  if (id === 'me') { const P = S.profile; return HL.student(dress || myKey, P.body === 'f', (P.look && P.look.v) || 0, kit); }
  const mate = id === 'friend' ? S && S.mates[S.friend] : id === 'capt' ? S && S.mates[S.capt] : /^mate_/.test(id) ? S && S.mates[id.slice(5)] : null;
  if (mate) return HL.student(dress || myKey, mate.body === 'f', (mate.look && mate.look.v) || 1, kit);
  if (id === 'rival' && S && S.rival) return HL.student(dress || QC.key(S.rival.house), S.rival.body === 'f', (S.rival.look && S.rival.look.v) || 2, kit);
  if (dress) { const h = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0); return HL.student('ball', h % 2 === 1, 1 + (h % 6), false); }
  if (S && S.phase === 'school' && /^(rep|extra)/.test(id) && (o.outfit === 'casual' || o.outfit === 'coat')) { const h = [...id].reduce((s2, ch) => s2 + ch.charCodeAt(0), 0); return HL.student(QC.key(h % 4), h % 2 === 1, 1 + (h % 6), false); }   // at school the press pack is half pupils (the commentator, the school paper)
  if (o.outfit === 'staff' || staff || formal || o.outfit === 'coat') { const h = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0); return h % 2 ? 'prof_a' : 'prof_b'; }
  const h = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0), team = o.team != null ? o.team : S ? (S.phase === 'school' ? S.profile.house : Career.myTeam()) : 0;
  return HL.student(QC.key(team), h % 2 === 1, 1 + (h % 6), kit);
};
Scenes.need = async function (list) { const names = [...new Set(list.map((c) => Scenes.tpl(c.id, c)))]; await CAST.need(names); };
/* ------------------------------------------------------------------ entering and leaving */
Scenes.enter = function (name, variant, opts) {
  opts = opts || {}; this.leave(true);
  if (MG.state === 'title' || MG.state === 'house') HL.ui.screen('');   // (a scene never plays under the title's buttons)
  const S = (STAGES[name] || STAGES.world)(variant || '') || STAGES.world(''); this.set = S; this.F = S.F; this.active = true; this.mode = opts.mode || 'view'; this.t = 0;
  // the player's own body steps aside (it stands at the stage, unseen, so that what goes by where you are — the castle's lights and voices, who is drawn — follows the scene)
  const P = PLAYER.a; if (P) { if (HL.fly.on) HL.fly.dismount(true); this._pl = { x: P.x, y: P.y, z: P.z, yaw: P.yaw, st: PLAYER.state, ms: MG.state }; const w = Scenes.W([0, 0, 2.5]); P.x = w.x; P.z = w.z; P.y = S.F.y; P.vx = P.vy = P.vz = 0; PLAYER.state = 'cine'; Scenes.hidePlayer(true); }
  this._ms = MG.state === 'scene' ? (this._ms || 'play') : MG.state; MG.state = 'scene'; HL.ui.show(false); if (HL.ui.sayOff) HL.ui.sayOff(); if (HL.Q && HL.Q.hud && HL.Q.hud.cv) HL.Q.hud.cv.style.display = 'none';
  CAM.cine = { t: 0, dur: 1e9, hold: true, fov: 50, skip: false, fn: () => Scenes.camNow() };
  if (S.cams && S.cams.default) this.shot(S.cams.default, true);
  if (S.extras) Scenes.fillHall(S);
  return S;
};
Scenes.hidePlayer = function (h) { const P = PLAYER.a; if (!P) return; P.root.visible = !h; if (P.wand) P.wand.visible = !h; if (P.inst.cloth) P.inst.cloth.setVisible(!h); };
Scenes.leave = function (quiet) {
  if (!this.active) return;
  for (const id in this.cast) this.cast[id].a.dispose(); this.cast = {}; for (const a of this.extras) a.dispose(); this.extras = []; if (this.set && this.set.onLeave) this.set.onLeave();
  this.active = false; this.set = null; this.F = null; this.mode = null; Dialogue.hide(); CAM.cine = null; CAM.snap = true;
  const P = PLAYER.a, p = this._pl; if (P && p) { P.x = p.x; P.y = p.y; P.z = p.z; P.yaw = p.yaw; PLAYER.state = p.st === 'cine' ? 'move' : p.st || 'move'; Scenes.hidePlayer(false); CAM.reset(P.yaw); } this._pl = null;
  if (!quiet) { MG.state = this._ms === 'scene' ? 'play' : (this._ms || 'play'); }
};
/* a feast's benches: a few of the castle's students seated near you at your table and the next */
Scenes.fillHall = function (S) { const n = S.extras || 0, tx = S.tables; let k = 0; const R0 = mulberry(77 + (Career.S ? Career.S.year : 0));
  for (let i = 0; i < n * 2 && k < n; i++) { const t = i % 2 ? S.house : (S.house + 1) % 4, side = i % 4 < 2 ? -1 : 1, z = -6 + (i >> 1) * 1.9 + R0() * 0.5; if (t === S.house && Math.abs(z + 1.6) < 1.6) continue;
    const tpl = HL.student(QC.key(t), R0() < 0.5, 1 + ((i * 5) % 6)); if (!CHAR.T[tpl]) continue; const a = Scenes.actor(tpl, [tx[t] + side * 1.15, 0, z, side < 0 ? PI / 2 : -PI / 2, 'sit']); a.base = 'sit'; this.extras.push(a); k++; } };
/* ------------------------------------------------------------------ the cast */
Scenes.actor = function (tpl, at) {
  const w = Scenes.W(at), sit = at[4] === 'sit', y = Scenes.set && Scenes.set.ground ? HL.gy(w.x, w.z) + 0.05 : w.y;
  const a = new Actor(CHAR.T[tpl], { x: w.x, y, z: w.z, yaw: Scenes.WY(at[3]), hp: 100, team: 'npc', moves: MOV.wizard, r: 0.3, h: 1.8 });
  a.noTarget = true; a.base = sit ? 'sit' : 'calm'; a.grounded = true; a.sitY = sit ? y : undefined; a.x = w.x; a.y = y; a.z = w.z; a.root.traverse((q) => { if (q.isMesh) q.castShadow = true; });
  a.animate(0.016 + RNG()); a.pose3D(0.016); return a;
};
Scenes.spawn = function (id, spec) {
  const tpl = Scenes.tpl(id, spec); if (!CHAR.T[tpl]) { console.warn('stage: template not ready', tpl); return null; }
  let at = typeof spec.at === 'string' ? this.set.anchors[spec.at] : spec.at; if (!at) at = [0, 0, 0, 0];
  const anim = spec.anim || 'idle', sit = /^sit/.test(anim) || at[4] === 'sit', a = Scenes.actor(tpl, sit && at[4] !== 'sit' ? at.concat(['sit']).slice(0, 4).concat(['sit']) : at);
  const c = { a, spec, walk: null, sit }; this.cast[id] = c; Scenes.anim(c, anim); return a;
};
/* the career's clip names on the castle's mocap */
Scenes.anim = function (c, name) {
  const a = c.a; c.cur = name;
  if (/^sit/.test(name) || c.sit) { a.setBase('sit', 0.25); return; }
  const base = { idle: 'calm', talk: 'talk', walk: 'calm', jog: 'calm', sprint: 'calm', dance: 'talk', spell: 'calm', cast: 'calm', kneel: 'calm', fold: 'fold', interact: 'calm' }[name] || 'calm';
  a.setBase(base, 0.3);
  if (name === 'cheer' || name === 'dance') a.play('cheer', { fade: 0.15 }); else if (name === 'spell' || name === 'cast') a.play('castUp', { fade: 0.12 }); else if (name === 'interact' || name === 'pickup') a.play('interact', { fade: 0.12 });
};
/* ------------------------------------------------------------------ the camera */
Scenes.shot = function (s, snap) {
  if (!s) return; const res = (v) => typeof v === 'function' ? v() : v, Wv = (v) => Scenes.W(res(v), new THREE.Vector3());
  const p = Wv(s.p), l = Wv(s.l);
  this.cam = { p0: snap ? p.clone() : this.cp.clone(), l0: snap ? l.clone() : this.cl.clone(), f0: snap ? (s.fov || 45) : this.cfov, p1: p, l1: l, f1: s.fov || 45, p2: s.p2 ? Wv(s.p2) : null, l2: s.l2 ? Wv(s.l2) : null, t: 0, blend: snap ? 0 : (s.blend !== undefined ? s.blend : 0.9), dur: s.dur || 6, orbit: s.orbit || null };
  if (snap) { this.cp.copy(p); this.cl.copy(l); this.cfov = s.fov || 45; }
};
Scenes.camNow = function () {
  const c = this.cam; if (!c) return { pos: this.cp, look: this.cl };
  const b = c.blend > 0 ? easeIO(sat(c.t / c.blend)) : 1, u = easeIO(sat(c.t / c.dur)), P = _v3.copy(c.p1), L = _v4.copy(c.l1);
  if (c.p2) P.lerp(c.p2, u); if (c.l2) L.lerp(c.l2, u);
  if (c.orbit) { const o = c.orbit, a = o.a0 + c.t * o.w; Scenes.W([o.c[0] + Math.sin(a) * o.r, o.c[1] + o.h, o.c[2] + Math.cos(a) * o.r], P); Scenes.W(o.c, L); }
  if (b < 1) { P.lerpVectors(c.p0, P, b); L.lerpVectors(c.l0, L, b); }
  // keep the eye out of walls: pulled in along its line to what it looks at
  { const d = _v5.copy(P).sub(L), dl = d.length(); if (dl > 0.3 && dl < 14 && !Scenes.noLos) { d.multiplyScalar(1 / dl); const hit = PHY.ray(L.x, L.y, L.z, d.x, d.y, d.z, dl, 'los'); if (hit && hit.t < dl) P.copy(L).addScaledVector(d, Math.max(0.4, hit.t - 0.25)); } }
  const t = MG.rt, k = 0.012; P.x += Math.sin(t * 0.7) * k; P.y += Math.sin(t * 0.9 + 1) * k; P.z += Math.cos(t * 0.6) * k;
  this.cp.copy(P); this.cl.copy(L); this.cfov = lerp(c.f0, c.f1, b); if (CAM.cine) CAM.cine.fov = this.cfov;
  return { pos: this.cp, look: this.cl };
};
/* ------------------------------------------------------------------ the frame while a scene plays (MG.state 'scene': the world lives, nobody plays) */
Scenes.update = function (dt) {
  if (!this.active) return; this.t += dt; if (this.cam) this.cam.t += dt;
  for (const id in this.cast) { const c = this.cast[id], a = c.a;
    if (c.walk) { const w = c.walk; w.t += dt; const u = sat(w.t / w.dur); a.x = lerp(w.from.x, w.to.x, u); a.z = lerp(w.from.z, w.to.z, u); a.y = Scenes.set && Scenes.set.ground ? HL.gy(a.x, a.z) + 0.05 : a.y; a.speed = u < 1 ? w.v : 0; a.mvx = 0; a.mvz = 1; a.yaw = dampA(a.yaw, Math.atan2(w.to.x - w.from.x, w.to.z - w.from.z), 8, dt); if (u >= 1) { c.walk = null; a.speed = 0; Scenes.anim(c, w.then || 'idle'); if (w.face != null) a.yaw = Scenes.WY(w.face); } }
    else a.speed = 0;
    if (c.sit) { a.y = a.sitY; a.grounded = true; }
    a.animate(dt); a.pose3D(dt); }
  for (const a of this.extras) { a.animate(dt); a.pose3D(dt); }
  if (this.set && this.set.update) this.set.update(dt, this.t);
  Script.update(dt);
};
{ const u0 = HL.update; HL.update = function (rdt) {
  if (MG.state !== 'scene') return u0(rdt);
  const dt = Math.min(rdt, 0.05); MG.dt = dt; MG.t += dt; HL.t += dt;
  Scenes.update(dt); if (window.Locker && Locker.on) Locker.update(rdt); if (window.PressRoom) PressRoom.update(rdt);
  LEVEL.update(dt); if (HL.worldUpdate) HL.worldUpdate(dt); FX.update(dt); CAM.update(rdt);
  R.updateShadow(_v1.copy(R.camera.position).addScaledVector(R.camera.getWorldDirection(_v2), 12)); if (HL.ui) HL.ui.update(rdt);
}; if (MG.gameUpdate === u0) MG.gameUpdate = HL.update; }   // (the engine holds the frame function by reference)

/* ===================== SCRIPT RUNNER (cutscenes) ===================== */
const Script = {
  beats: null, i: 0, waitT: 0, waiting: null, done: null,
  async play(script, done) {
    HL.ui.fade(1); Dialogue.loading(true);
    try { await Scenes.need((script.cast || []).concat([{ id: 'me', o: {} }])); } catch (e) { console.warn('stage cast', e); }
    if (window.CareerUI) CareerUI.backdrop = null; Scenes.enter(script.set, script.variant, { weather: script.weather });
    for (const c of script.cast || []) Scenes.spawn(c.id, c);
    this.beats = script.beats.slice(); this.i = 0; this.done = done; this.waiting = null; this.waitT = 0;
    // a few frames under the black so the new view is drawn (and its shaders built) before it is shown
    for (let k = 0; k < 3; k++) await new Promise((r) => requestAnimationFrame(r));
    Dialogue.loading(false); HL.ui.fade(0); Dialogue.show(true); MG.onKey = (code) => { if (code === 'Enter' || code === 'Space' || code === 'KeyE') Script.tap(); else if (code === 'Escape') Script.skip(); };
    this.next();
  },
  next() {
    while (this.beats && this.i < this.beats.length) {
      const b = this.beats[this.i++];
      if (b.cam) { const s = typeof b.cam === 'string' ? Scenes.set.cams[b.cam] : b.cam; if (s) Scenes.shot(s, !!b.snap); continue; }
      if (b.anim) { for (const id in b.anim) if (Scenes.cast[id]) Scenes.anim(Scenes.cast[id], b.anim[id]); continue; }
      if (b.walk) { for (const id in b.walk) { const c = Scenes.cast[id]; if (!c) continue; const [x, z, dur, then, face] = b.walk[id], to = Scenes.W([x, 0, z]); c.sit = false; c.a.sitY = undefined; c.walk = { from: new THREE.Vector3(c.a.x, c.a.y, c.a.z), to, t: 0, dur: dur || 2, then, face, v: Math.hypot(to.x - c.a.x, to.z - c.a.z) / (dur || 2) }; c.a.setBase('calm', 0.2); } continue; }
      if (b.fx) continue;
      if (b.title) { Dialogue.card(b.title, b.sub); this.waiting = 'wait'; this.waitT = 2.6; return; }
      if (b.wait) { this.waiting = 'wait'; this.waitT = b.wait; Dialogue.line(null); return; }
      if (b.say) { const [who, text] = b.say; this.speaker(who); Dialogue.line(Story.names(who), text, who); this.waiting = 'tap'; return; }
      if (b.choice) { this.waiting = 'choice'; Dialogue.choices(b.choice, (ch) => this.choose(ch)); return; }
    }
    this.finish();
  },
  speaker(who) {
    for (const id in Scenes.cast) { const c = Scenes.cast[id]; if (c.sit) continue; if (id === who) Scenes.anim(c, c.spec.anim === 'dance' ? 'dance' : 'talk'); else if (c.cur === 'talk') Scenes.anim(c, c.spec.anim && c.spec.anim !== 'talk' ? c.spec.anim : 'idle'); }
    const c = Scenes.cast[who]; if (c) { for (const id in Scenes.cast) { const o = Scenes.cast[id]; if (o === c || o.sit || o.walk) continue; const ty = Math.atan2(c.a.x - o.a.x, c.a.z - o.a.z); if (Math.abs(wrapA(ty - o.a.yaw)) < 1.4) o.a.lookYaw = clamp(wrapA(ty - o.a.yaw), -0.9, 0.9); } }
  },
  choose(ch) {
    const S = Career.S;
    if (ch.tone) S.persona[ch.tone] = (S.persona[ch.tone] || 0) + 1;
    const fx = ch.fx || {};
    if (fx.chem && S.friend && S.mates[S.friend]) S.mates[S.friend].chem = clamp(S.mates[S.friend].chem + fx.chem, 0, 100);
    for (const k of ['fame', 'fans', 'trust']) if (fx[k]) S[k] = clamp(S[k] + fx[k], 0, 100);
    if (fx.gal) S.gal = Math.max(0, S.gal + fx.gal);
    if (fx.attr) S.attrs[fx.attr[0]] = Math.min(Career.attrCap(), S.attrs[fx.attr[0]] + fx.attr[1]);
    if (fx.rivalry && S.rival) S.rival.heat = clamp(S.rival.heat + fx.rivalry, 0, 100);
    if (fx.captain) S.captain = true;
    if (fx.partner) S.flags.partner = fx.partner;
    Sound.play('ui');
    if (ch.reply) this.beats.splice(this.i, 0, { say: ch.reply });
    this.waiting = null; this.next();
  },
  tap() { if (this.waiting === 'tap') { if (Dialogue.typing()) { Dialogue.finishTyping(); return; } this.waiting = null; this.next(); } else if (this.waiting === 'wait' && this.waitT < 1.8) { this.waitT = 0; } },
  update(dt) { if (this.waiting === 'wait') { this.waitT -= dt; if (this.waitT <= 0) { this.waiting = null; Dialogue.card(null); this.next(); } } },
  skip() { if (!this.beats) return; this.beats = this.beats.filter((b, k) => k < this.i || b.choice); this.next(); },
  finish() {
    const d = this.done; this.beats = null; this.done = null; this.waiting = null; MG.onKey = null;
    Dialogue.hide();
    if (d) d();
  },
};
/* a sound for the menus and the dialogue (the castle's own mixer) */
const Sound = { play(k, o) { try { const A = HL.AU; if (!A || !A.play) return; const n = { ui: 'ui_click', cheer: 'cheer', whistle: 'whistle', page: 'page' }[k] || k; if (A.has(n)) A.play(n, Object.assign({ vol: 0.5, vary: false }, o || {})); else if (A.has('ui')) A.play('ui', { vol: 0.4 }); } catch (e) { /* */ } }, init() {}, crowdRoar() { this.play('cheer'); } };

/* ===================== DIALOGUE UI ===================== */
const Dialogue = {
  el: null, typT: null, full: '',
  css: `
#dlg { position: absolute; inset: 0; z-index: 25; display: none; font-family: 'HLB', Georgia, serif; color: #f1e6ca; -webkit-tap-highlight-color: transparent; user-select: none; }
#dlg.on { display: block; }
#dlg .lb { position: absolute; left: 0; right: 0; height: 9vh; background: #000; pointer-events: none; } #dlg .lb.t { top: 0; } #dlg .lb.b { bottom: 0; }
.dlgBox { position: absolute; left: 50%; bottom: calc(9vh + 12px); transform: translateX(-50%) translateY(6px); width: min(780px, 86vw); padding: 12px 26px 16px; background: linear-gradient(rgba(22,15,9,.95), rgba(10,7,5,.94)); border: 1px solid rgba(214,170,74,.6); border-radius: 3px; box-shadow: 0 12px 44px rgba(0,0,0,.65), inset 0 0 0 3px rgba(0,0,0,.4), inset 0 0 0 4px rgba(214,170,74,.14); opacity: 0; transition: opacity .25s, transform .25s; }
.dlgBox.on { opacity: 1; transform: translateX(-50%); }
.dlgWho { font-family: 'HLA', Georgia, serif; font-size: 13px; letter-spacing: .26em; text-transform: uppercase; display: flex; align-items: center; gap: 12px; }
.dlgWho:after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(214,170,74,.7), transparent); }
.dlgText { font-size: 19px; line-height: 1.4; margin-top: 6px; min-height: 2.8em; text-shadow: 0 1px 3px #000; }
.dlgNext { position: absolute; right: 16px; bottom: 7px; font-size: 10px; color: #e2b84e; animation: dlgBob 1.1s ease-in-out infinite; } @keyframes dlgBob { 50% { transform: translateY(3px); } }
.dlgChoices { position: absolute; left: 50%; bottom: calc(9vh + 12px); transform: translateX(-50%); width: min(700px, 86vw); display: grid; gap: 7px; }
.dlgChoice { display: flex; gap: 12px; align-items: center; text-align: left; padding: 10px 16px; background: linear-gradient(rgba(22,15,9,.93), rgba(10,7,5,.93)); border: 1px solid rgba(214,170,74,.45); border-radius: 3px; color: #f1e6ca; font: inherit; font-size: 16px; cursor: pointer; animation: dlgIn .3s ease both; }
.dlgChoice:hover, .dlgChoice:active { border-color: #fff3c4; background: linear-gradient(rgba(70,52,24,.95), rgba(30,22,10,.95)); }
.dlgChoice:nth-child(2) { animation-delay: .06s; } .dlgChoice:nth-child(3) { animation-delay: .12s; } @keyframes dlgIn { from { opacity: 0; transform: translateY(8px); } }
.dlgChoice .tone { flex: none; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 13px; border: 1px solid rgba(214,170,74,.6); }
.dlgCard { position: absolute; left: 0; right: 0; top: 33%; text-align: center; opacity: 0; pointer-events: none; }
.dlgCard.on { animation: dlgCard 2.6s ease both; } @keyframes dlgCard { 0% { opacity: 0; letter-spacing: .1em; } 15%, 80% { opacity: 1; } 100% { opacity: 0; letter-spacing: .2em; } }
.dlgCard b { display: block; font-family: 'HLA', Georgia, serif; font-weight: 500; font-size: clamp(28px, 6vw, 58px); letter-spacing: .16em; background: linear-gradient(#fffaf0 8%, #f3dfa8 48%, #c9984a 92%); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 4px 16px rgba(0,0,0,.8)); }
.dlgCard span { font-family: 'HLA', Georgia, serif; letter-spacing: .4em; font-size: 13px; color: #e6d6ae; text-shadow: 0 2px 6px #000; }
.dlgSkip { position: absolute; top: calc(9vh + 10px); right: 18px; padding: 6px 14px; background: rgba(0,0,0,.45); border: 1px solid rgba(214,170,74,.45); color: #e6d6ae; font-family: 'HLA', Georgia, serif; letter-spacing: .2em; font-size: 11px; cursor: pointer; }
.dlgLoad { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-family: 'HLA', Georgia, serif; letter-spacing: .4em; font-size: 12px; color: #a8987a; display: none; } #dlg.ld .dlgLoad { display: block; }
@media (max-height: 620px) { #dlg .lb { height: 6vh; } .dlgBox { bottom: calc(6vh + 6px); padding: 8px 16px 10px; width: min(640px, 80vw); } .dlgWho { font-size: 10px; } .dlgText { font-size: 14.5px; min-height: 2.7em; margin-top: 3px; } .dlgChoices { bottom: calc(6vh + 6px); gap: 5px; width: min(620px, 80vw); } .dlgChoice { padding: 7px 12px; font-size: 13.5px; } .dlgSkip { top: calc(6vh + 6px); } }`,
  init() {
    if (this.el) return; const st = document.createElement('style'); st.textContent = this.css; document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'dlg';
    d.innerHTML = `<div class="lb t"></div><div class="lb b"></div><div class="dlgCard" id="dlgCard"><b></b><span></span></div><div class="dlgBox" id="dlgBox"><div class="dlgWho" id="dlgWho"></div><div class="dlgText" id="dlgText"></div><div class="dlgNext">▼</div></div><div class="dlgChoices" id="dlgChoices"></div><button class="dlgSkip" id="dlgSkip">SKIP ▸▸</button><div class="dlgLoad">…</div>`;
    document.body.appendChild(d); this.el = d;
    d.addEventListener('click', (e) => { if (e.target.closest('.dlgChoices') || e.target.closest('.dlgSkip')) return; Script.tap(); });
    d.querySelector('#dlgSkip').addEventListener('click', (e) => { e.stopPropagation(); Script.skip(); });
  },
  loading(on) { this.init(); this.el.classList.toggle('on', on || this.el.classList.contains('on')); this.el.classList.toggle('ld', !!on); },
  show(on) { this.init(); this.el.classList.toggle('on', !!on); this.el.querySelector('#dlgSkip').style.display = on ? '' : 'none'; },
  hide() { if (!this.el) return; this.show(false); this.line(null); this.card(null); this.el.querySelector('#dlgChoices').innerHTML = ''; },
  card(t, s) { this.init(); const c = this.el.querySelector('#dlgCard'); if (!t) { c.classList.remove('on'); return; } c.querySelector('b').textContent = t; c.querySelector('span').textContent = s || ''; c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); },
  line(who, text, id) {
    this.init(); const box = this.el.querySelector('#dlgBox');
    if (!text) { box.classList.remove('on'); return; }
    box.classList.add('on');
    const w = this.el.querySelector('#dlgWho'); w.textContent = who || ''; w.style.display = who ? '' : 'none'; w.style.color = id === 'me' ? '#ffe39a' : id === 'rival' ? '#ff9a7a' : '#e2b84e';
    this.full = text; const t = this.el.querySelector('#dlgText'); t.textContent = '';
    clearInterval(this.typT); let i = 0;
    this.typT = setInterval(() => { i += 2; t.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(this.typT); this.typT = null; } }, 22);
  },
  typing() { return !!this.typT; },
  finishTyping() { clearInterval(this.typT); this.typT = null; this.el.querySelector('#dlgText').textContent = this.full; },
  choices(list, cb) {
    this.init(); const root = this.el.querySelector('#dlgChoices'); root.innerHTML = ''; this.el.querySelector('#dlgBox').classList.remove('on');
    list.forEach((ch) => { const b = document.createElement('button'); b.className = 'dlgChoice'; b.innerHTML = `${ch.tone ? `<i class="tone ${ch.tone}">${TONE_ICON[ch.tone]}</i>` : ''}<span>${ch.t}</span>`; b.addEventListener('click', (e) => { e.stopPropagation(); root.innerHTML = ''; cb(ch); }); root.appendChild(b); });
  },
};
