// ===================== MODELS: flyers, first-person viewmodel, balls =====================
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const brass = () => linCol(0.75, 0.52, 0.18);
const FLUTTER_GLSL = /* glsl */`
  float ph = dot(modelMatrix[3].xyz, vec3(0.31, 0.17, 0.23));
  transformed.x += sin(uTime * 13.0 + position.z * 7.0 + ph) * 0.05 * aFlutter;
  transformed.y += sin(uTime * 17.0 + position.z * 9.0 + ph * 1.7) * 0.07 * aFlutter;
  transformed.z += sin(uTime * 9.0 + ph) * 0.03 * aFlutter;`;

const SKIN = [linCol(0.62, 0.42, 0.3), linCol(0.5, 0.32, 0.21), linCol(0.34, 0.2, 0.12), linCol(0.18, 0.1, 0.06), linCol(0.66, 0.48, 0.36)];
const HAIR = [linCol(0.03, 0.02, 0.015), linCol(0.18, 0.09, 0.03), linCol(0.45, 0.3, 0.12), linCol(0.32, 0.08, 0.02), linCol(0.6, 0.5, 0.3)];

function limbGeo(a, b, r, color, fl = 0, segs = 7) {
  const len = a.distanceTo(b);
  const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 3, segs);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1));
  return Geo.prep(g, color, m, { attr: { aFlutter: () => fl } });
}
function cylBetween(a, b, r0, r1, color, segs = 8) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, segs);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1));
  return Geo.prep(g, color, m, { attr: { aFlutter: () => 0 } });
}

const Models = {
  init() {
    this.flyerMat = stdMat({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }, { key: 'flyer', vHead: 'attribute float aFlutter;', vDisp: FLUTTER_GLSL });
    this.ghostMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.4, 2.4), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    this.quaffleGeo = new THREE.SphereGeometry(0.2, 24, 16);
    this.quaffleMat = stdMat({ map: Tex.quaffle, roughness: 0.55 }, { key: 'quaffle' });
    this.bludgerGeo = new THREE.SphereGeometry(0.21, 22, 14);
    this.bludgerMat = stdMat({ map: Tex.bludger, roughness: 0.36, metalness: 0.85 }, { key: 'bludger' });
    this.snitchMat = stdMat({ color: 0xffc94a, metalness: 1, roughness: 0.18, emissive: 0xffa020, emissiveIntensity: 0.9 }, { key: 'snitch' });
    const gc = document.createElement('canvas'); gc.width = gc.height = 64;
    const g = gc.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.25, 'rgba(255,200,80,.6)'); gr.addColorStop(1, 'rgba(255,160,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.glowTex = new THREE.CanvasTexture(gc); this.glowTex.colorSpace = THREE.SRGBColorSpace;
  },

  // high-detail broom: carved lathe handle with a gentle upturned tip, bindings, brass bands,
  // stirrups and an individually modelled twig tail.
  broomGeo(hi = false) {
    const P = [], A = { attr: { aFlutter: () => 0 } };
    const L = 2.1, rings = [0.08, 0.13, 0.95, 1.02, 1.72, 1.8];
    const pts = [];
    const N = hi ? 70 : 40;
    for (let k = 0; k <= N; k++) {
      const y = k / N * L;
      let r = lerp(0.04, 0.029, y / L);
      for (const rg of rings) r += 0.005 * Math.exp(-(((y - rg) / 0.012) ** 2));
      if (y > L - 0.07) r *= Math.sqrt(Math.max(0.02, 1 - ((y - (L - 0.07)) / 0.075) ** 2)) * 1.12;
      pts.push(new THREE.Vector2(Math.max(r, 0.004), y));
    }
    const lg = new THREE.LatheGeometry(pts, hi ? 18 : 10);
    lg.rotateX(-Math.PI / 2); lg.translate(0, 0, 0.78);
    const pos = lg.attributes.position;
    for (let v = 0; v < pos.count; v++) { const z = pos.getZ(v); if (z < -0.85) pos.setY(v, pos.getY(v) + 0.05 * ((-0.85 - z) / 0.47) ** 2); }
    lg.computeVertexNormals();
    P.push(Geo.prep(lg, (x, y, z) => {
      const g = vnoise2(z * 38, Math.atan2(y, x) * 3) * 0.6 + vnoise2(z * 7, 3.1) * 0.4;
      return linCol(0.24, 0.12, 0.052).lerp(linCol(0.12, 0.058, 0.025), g);
    }, null, A));
    const brass = linCol(0.75, 0.52, 0.18), leather = linCol(0.07, 0.04, 0.025);
    for (const [z, r, c] of [[0.74, 0.046, leather], [0.79, 0.05, brass], [0.84, 0.054, leather], [-1.2, 0.036, brass]])
      P.push(Geo.prep(new THREE.TorusGeometry(r, hi ? 0.009 : 0.012, 6, hi ? 20 : 12), c, M4(0, z < 0 ? 0.035 : 0, z), A));
    // stirrups
    for (const sx of [-1, 1]) {
      P.push(cylBetween(V(sx * 0.02, -0.02, 0.36), V(sx * 0.16, -0.3, 0.38), 0.008, 0.008, brass, 6));
      P.push(Geo.prep(new THREE.TorusGeometry(0.045, 0.008, 5, 10, Math.PI), brass, M4(sx * 0.17, -0.32, 0.38, 0, Math.PI / 2, Math.PI), A));
    }
    // twig tail: dark core for volume + individual twigs
    P.push(Geo.prep(new THREE.ConeGeometry(0.15, 0.85, 12, 1, true), linCol(0.1, 0.065, 0.025), M4(0, 0, 1.25, -Math.PI / 2, 0, 0), A));
    const n = hi ? 150 : 56, rng = mulberry32(hi ? 99 : 7);
    for (let i = 0; i < n; i++) {
      const a = rng() * TAU, r0 = 0.02 + rng() * 0.03, len = 0.75 + rng() * 0.28, spread = 0.1 + rng() * 0.15;
      const a1 = a + (rng() - 0.5) * 0.4;
      const b0 = V(Math.cos(a) * r0, Math.sin(a) * r0, 0.82);
      const mid = V(Math.cos(a1) * (r0 + spread * 0.55), Math.sin(a1) * (r0 + spread * 0.55) - 0.01, 0.82 + len * 0.55);
      const e = V(Math.cos(a1) * (r0 + spread), Math.sin(a1) * (r0 + spread) - 0.03 - rng() * 0.03, 0.82 + len);
      const c = linCol(0.36, 0.25, 0.1).lerp(linCol(0.15, 0.09, 0.035), rng()).multiplyScalar(0.8 + rng() * 0.45);
      const w = (hi ? 0.0045 : 0.007) * (0.8 + rng() * 0.6);
      P.push(cylBetween(b0, mid, w, w * 0.9, c, 3));
      P.push(cylBetween(mid, e, w * 0.9, w * 0.45, c, 3));
    }
    return Geo.merge(P, ['aFlutter']);
  },
  riderGeo(team, role, look) {
    const T = CONFIG.teams[team];
    const robe = new THREE.Color(T.c1), trim = new THREE.Color(T.c2);
    const skin = look.skin, hair = look.hair;
    const pants = linCol(0.05, 0.045, 0.04), boot = linCol(0.08, 0.045, 0.025), glove = linCol(0.16, 0.08, 0.035);
    const P = [];
    const add = (g, c, m, fl) => P.push(Geo.prep(g, c, m, { attr: { aFlutter: typeof fl === 'function' ? fl : () => (fl || 0) } }));
    const keeper = role === 'keeper', beater = role === 'beater';
    P.push(limbGeo(V(0, 0.2, 0.22), V(0, 0.56, -0.1), 0.17, robe));
    add(new THREE.CylinderGeometry(0.16, 0.19, 0.12, 14, 1), linCol(0.09, 0.06, 0.035), M4(0, 0.25, 0.17, -0.6, 0, 0));
    add(new THREE.BoxGeometry(0.05, 0.04, 0.03), brass(), M4(0, 0.25, 0.0, -0.6, 0, 0));
    if (keeper) add(new THREE.BoxGeometry(0.36, 0.34, 0.12), trim, M4(0, 0.4, -0.2, -0.75, 0, 0));
    for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.075, 10, 8), robe.clone().multiplyScalar(0.9), M4(sx * 0.2, 0.56, -0.06, 0, 0, 0, 1, 0.8, 1));
    // head: skull, jaw, nose, ears, hair, goggles
    add(new THREE.SphereGeometry(0.115, 18, 14), skin, M4(0, 0.79, -0.26, 0, 0, 0, 0.95, 1.05, 1));
    add(new THREE.SphereGeometry(0.082, 12, 10), skin, M4(0, 0.735, -0.31, 0, 0, 0, 1, 0.8, 1));
    add(new THREE.ConeGeometry(0.018, 0.045, 6), skin.clone().multiplyScalar(0.92), M4(0, 0.775, -0.385, -Math.PI / 2 - 0.25, 0, 0));
    for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.026, 8, 6), skin.clone().multiplyScalar(0.9), M4(sx * 0.11, 0.79, -0.24, 0, 0, 0, 0.5, 1, 0.8));
    const style = look.style || 0;
    add(new THREE.SphereGeometry(0.127, 16, 9, 0, TAU, 0, Math.PI * (style === 2 ? 0.75 : 0.56)), hair, M4(0, 0.81, -0.24, -0.35, 0, 0));
    if (style === 1) add(new THREE.CylinderGeometry(0.07, 0.04, 0.32, 10, 3, true), hair, M4(0, 0.7, -0.1, -0.9, 0, 0), (x, y, z) => clamp((0.75 - y) / 0.3, 0, 1) * 0.7);
    add(new THREE.TorusGeometry(0.119, 0.014, 4, 18), linCol(0.07, 0.04, 0.025), M4(0, 0.8, -0.26, Math.PI / 2 - 0.15, 0, 0));
    for (const sx of [-0.046, 0.046]) {
      add(new THREE.CylinderGeometry(0.034, 0.034, 0.03, 12), linCol(0.55, 0.42, 0.18), M4(sx, 0.8, -0.37, Math.PI / 2, 0, 0));
      add(new THREE.CircleGeometry(0.028, 12), linCol(0.05, 0.12, 0.16), M4(sx, 0.8, -0.386, 0, Math.PI, 0));
    }
    add(new THREE.TorusGeometry(0.1, 0.03, 6, 14), trim, M4(0, 0.63, -0.15, Math.PI / 2 - 0.5, 0, 0));
    // arms
    const arms = beater
      ? [[V(-0.19, 0.55, -0.06), V(-0.24, 0.33, -0.38), V(-0.05, 0.035, -0.66)], [V(0.19, 0.55, -0.06), V(0.34, 0.48, -0.08), V(0.38, 0.72, -0.22)]]
      : [[V(-0.19, 0.55, -0.06), V(-0.24, 0.33, -0.38), V(-0.05, 0.035, -0.7)], [V(0.19, 0.55, -0.06), V(0.24, 0.33, -0.34), V(0.05, 0.035, -0.56)]];
    for (const [sh, el, ha] of arms) {
      P.push(limbGeo(sh, el, 0.06, robe));
      P.push(limbGeo(el, ha.clone().lerp(el, 0.25), 0.054, robe));
      P.push(Geo.prep(new THREE.TorusGeometry(0.055, 0.014, 6, 14), trim, new THREE.Matrix4().compose(ha.clone().lerp(el, 0.25), new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), ha.clone().sub(el).normalize()), V(1, 1, 1)), { attr: { aFlutter: () => 0 } }));
      add(new THREE.SphereGeometry(keeper ? 0.08 : 0.05, 10, 8), glove, M4(ha.x, ha.y, ha.z, 0, 0, 0, 1, 0.8, 1.25));
    }
    if (beater) {
      const h = arms[1][2];
      P.push(cylBetween(h.clone().add(V(0, -0.06, 0.04)), h.clone().add(V(0.06, 0.8, 0.32)), 0.03, 0.06, linCol(0.28, 0.16, 0.07)));
    }
    for (const sx of [-1, 1]) {
      const hip = V(sx * 0.12, 0.13, 0.24), knee = V(sx * 0.19, -0.06, -0.16), foot = V(sx * 0.15, -0.3, 0.3);
      P.push(limbGeo(hip, knee, 0.074, pants));
      P.push(limbGeo(knee, foot, 0.061, boot));
      add(new THREE.CylinderGeometry(0.068, 0.062, 0.12, 10), boot.clone().multiplyScalar(1.4), M4(sx * 0.17, -0.12, -0.04, -2.3, 0, 0));
    }
    // front robe panel (the back is verlet cloth)
    add(new THREE.CylinderGeometry(0.19, 0.3, 0.45, 16, 3, true, Math.PI * 0.55, Math.PI * 0.9), robe.clone().multiplyScalar(0.85), M4(0, 0.28, 0.12, -0.6, Math.PI, 0), (x, y) => clamp((0.4 - y) / 0.3, 0, 1) * 0.5);
    return Geo.merge(P, ['aFlutter']);
  },
  flyer(team, role, seed) {
    const g = new THREE.Group();
    const broom = new THREE.Mesh(this.broomLo || (this.broomLo = this.broomGeo(false)), this.flyerMat);
    broom.castShadow = true; broom.receiveShadow = true; g.add(broom);
    let rider, human = null, cape = null;
    if (Humans.ready) {
      const K = Kits.of(team), look = Humans.look(seed, K.body); delete K.body;
      human = new Human(Object.assign({}, look, { outfit: 'kit' }, K));
      rider = human.root; rider.rotation.y = Math.PI; g.add(rider);
      if (role === 'beater') human.attach('hand_r', this.bat(human));
      cape = Humans.poses[human.o.body].pins;
    } else {
      const look = { skin: SKIN[seed % SKIN.length], hair: HAIR[(seed * 3 + 1) % HAIR.length], style: seed % 3 };
      rider = new THREE.Mesh(this.riderGeo(team, role, look), this.flyerMat);
      rider.castShadow = true; rider.receiveShadow = true; g.add(rider);
    }
    g.userData = { rider, broom, human, cape };
    return g;
  },
  // Beater's bat, held in the fist: runs along the knuckle line and out past the thumb
  bat(h) {
    const S = h.S, i = S.idx, rp = n => S.restP[i[n]];
    const side = rp('index_01_r').clone().sub(rp('pinky_01_r')).normalize();
    const palm = rp('middle_01_r').clone().multiplyScalar(0.55);
    if (!this.batGeo) {
      const pts = [];
      for (let k = 0; k <= 24; k++) { const y = k / 24 * 0.78; let r = y < 0.16 ? 0.016 : lerp(0.02, 0.042, smoothstep(0.16, 0.7, y)); if (y > 0.74) r *= Math.sqrt(Math.max(0.05, 1 - ((y - 0.74) / 0.045) ** 2)); pts.push(new THREE.Vector2(r, y)); }
      const lg = new THREE.LatheGeometry(pts, 12);
      this.batGeo = Geo.merge([Geo.prep(lg, (x, y, z) => y < 0.16 ? linCol(0.08, 0.045, 0.025) : linCol(0.32, 0.19, 0.09).lerp(linCol(0.2, 0.11, 0.05), vnoise2(y * 30, Math.atan2(z, x) * 2)), null, { attr: { aFlutter: () => 0 } })], ['aFlutter']);
    }
    const m = new THREE.Mesh(this.batGeo, this.flyerMat); m.castShadow = true;
    m.quaternion.setFromUnitVectors(UP, side); m.position.copy(palm).addScaledVector(side, -0.07);
    return m;
  },

  viewmodel(team) {
    const T = CONFIG.teams[team];
    const robe = new THREE.Color(T.c1), trim = new THREE.Color(T.c2), glove = linCol(0.15, 0.075, 0.032);
    const vm = new THREE.Group();
    const sm = new THREE.Mesh(this.broomHi || (this.broomHi = this.broomGeo(true)), this.flyerMat); sm.receiveShadow = true;
    sm.position.set(0, -0.2027, -0.685); sm.rotation.x = 0.0855;
    vm.add(sm);
    const sleeve = () => {
      const R = [cylBetween(V(0, 0, -0.05), V(0, 0, 0.9), 0.075, 0.046, robe, 14), Geo.prep(new THREE.TorusGeometry(0.047, 0.012, 6, 18), trim, M4(0, 0, 0.87), { attr: { aFlutter: () => 0 } })];
      const m = new THREE.Mesh(Geo.merge(R, ['aFlutter']), this.flyerMat); m.receiveShadow = true; vm.add(m); return m;
    };
    const lArm = sleeve(), rArm = sleeve();
    let hl = null, hr = null, lGlove = null, rGlove = null;
    if (Hands.ready) { hl = Hands.make('left'); hr = Hands.make('right'); vm.add(hl.root, hr.root); }
    else {
      const gl = () => { const m = new THREE.Mesh(Geo.merge([Geo.prep(new THREE.SphereGeometry(0.054, 14, 10), glove, M4(0, 0, 0, 0, 0, 0, 1, 0.85, 1.25), { attr: { aFlutter: () => 0 } })], ['aFlutter']), this.flyerMat); vm.add(m); return m; };
      lGlove = gl(); rGlove = gl();
    }
    const ball = new THREE.Mesh(this.quaffleGeo, this.quaffleMat); ball.visible = false; ball.scale.setScalar(0.44);
    vm.add(ball);
    const snitch = this.snitch(); snitch.scale.setScalar(0.42); snitch.visible = false; snitch.userData.glow.scale.set(0.22, 0.22, 1); vm.add(snitch);
    vm.traverse(o => { o.frustumCulled = false; });
    const S = V(0, 0.0857, -1).normalize();
    return { group: vm, shaft: sm, lArm, rArm, hl, hr, lGlove, rGlove, ball, snitch, S, lShoulder: V(-0.3, -0.62, 0.05), shoulder: V(0.3, -0.62, 0.05), shaftAt: z => V(0, -0.2027 + (-0.685 - z) * 0.0857, z) };
  },

  quaffle() { const m = new THREE.Mesh(this.quaffleGeo, this.quaffleMat); m.castShadow = true; return m; },
  bludger() { const m = new THREE.Mesh(this.bludgerGeo, this.bludgerMat); m.castShadow = true; return m; },
  snitch() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), this.snitchMat); g.add(body);
    const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.quadraticCurveTo(0.12, 0.09, 0.32, 0.05); ws.quadraticCurveTo(0.2, 0.0, 0.3, -0.03); ws.quadraticCurveTo(0.15, -0.03, 0, 0);
    const wg = new THREE.ShapeGeometry(ws, 6);
    const wm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.8), transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
    const wl = new THREE.Mesh(wg, wm), wr = new THREE.Mesh(wg, wm);
    wl.rotation.y = Math.PI; wl.position.x = -0.05; wr.position.x = 0.05;
    const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(wl); pr.add(wr); g.add(pl, pr);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: new THREE.Color(3, 2.2, 1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.scale.set(1.3, 1.3, 1); g.add(glow);
    g.userData = { wl: pl, wr: pr, glow };
    return g;
  },
};
