// ===================== MODELS: flyers, first-person viewmodel, balls =====================
const V = (x, y, z) => new THREE.Vector3(x, y, z);
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

  flyerGeo(team, role, look) {
    const T = CONFIG.teams[team];
    const robe = new THREE.Color(T.c1), trim = new THREE.Color(T.c2);
    const skin = look.skin, hair = look.hair;
    const pants = linCol(0.05, 0.045, 0.04), boot = linCol(0.08, 0.045, 0.025), glove = linCol(0.16, 0.08, 0.035);
    const woodC = linCol(0.2, 0.1, 0.045);
    const straw = (x, y, z) => linCol(0.3, 0.2, 0.075).multiplyScalar(0.55 + 0.6 * vnoise2(Math.atan2(y, x) * 9, z * 6));
    const P = [];
    const add = (g, c, m, fl) => P.push(Geo.prep(g, c, m, { attr: { aFlutter: typeof fl === 'function' ? fl : () => (fl || 0) } }));
    // broom
    add(new THREE.CylinderGeometry(0.032, 0.038, 2.1, 8), woodC, M4(0, 0, -0.3, Math.PI / 2, 0, 0));
    add(new THREE.ConeGeometry(0.2, 0.95, 14, 2), straw, M4(0, 0, 1.2, -Math.PI / 2, 0, 0));
    add(new THREE.TorusGeometry(0.065, 0.022, 6, 14), linCol(0.06, 0.04, 0.03), M4(0, 0, 0.78));
    add(new THREE.TorusGeometry(0.04, 0.012, 6, 12), linCol(0.6, 0.45, 0.15), M4(0, 0, -1.3));
    add(new THREE.BoxGeometry(0.36, 0.03, 0.06), woodC, M4(0, -0.3, 0.32));
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), woodC, M4(0, -0.15, 0.32));
    // body
    const keeper = role === 'keeper', beater = role === 'beater';
    P.push(limbGeo(V(0, 0.2, 0.22), V(0, 0.56, -0.1), 0.17, robe));
    if (keeper) add(new THREE.BoxGeometry(0.36, 0.34, 0.12), trim, M4(0, 0.4, -0.2, -0.75, 0, 0));
    add(new THREE.SphereGeometry(0.115, 16, 12), skin, M4(0, 0.79, -0.26));
    add(new THREE.SphereGeometry(0.125, 16, 8, 0, TAU, 0, Math.PI * 0.55), hair, M4(0, 0.805, -0.245, -0.35, 0, 0));
    add(new THREE.TorusGeometry(0.119, 0.014, 4, 18), linCol(0.07, 0.04, 0.025), M4(0, 0.8, -0.26, Math.PI / 2 - 0.15, 0, 0));
    for (const sx of [-0.046, 0.046]) add(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 10), linCol(0.12, 0.3, 0.38), M4(sx, 0.8, -0.37, Math.PI / 2, 0, 0));
    add(new THREE.TorusGeometry(0.1, 0.03, 6, 14), trim, M4(0, 0.63, -0.15, Math.PI / 2 - 0.5, 0, 0));
    // arms
    const arms = beater
      ? [[V(-0.19, 0.55, -0.06), V(-0.24, 0.33, -0.38), V(-0.05, 0.035, -0.66)], [V(0.19, 0.55, -0.06), V(0.34, 0.48, -0.08), V(0.38, 0.72, -0.22)]]
      : [[V(-0.19, 0.55, -0.06), V(-0.24, 0.33, -0.38), V(-0.05, 0.035, -0.7)], [V(0.19, 0.55, -0.06), V(0.24, 0.33, -0.34), V(0.05, 0.035, -0.56)]];
    for (const [sh, el, ha] of arms) {
      P.push(limbGeo(sh, el, 0.058, robe));
      P.push(limbGeo(el, ha.clone().lerp(el, 0.25), 0.052, robe));
      P.push(limbGeo(ha.clone().lerp(el, 0.25), ha.clone().lerp(el, 0.12), 0.055, trim));
      add(new THREE.SphereGeometry(keeper ? 0.08 : 0.052, 10, 8), glove, M4(ha.x, ha.y, ha.z));
    }
    if (beater) {
      const h = arms[1][2];
      P.push(cylBetween(h.clone().add(V(0, -0.06, 0.04)), h.clone().add(V(0.06, 0.8, 0.32)), 0.03, 0.06, linCol(0.28, 0.16, 0.07)));
    }
    // legs
    for (const sx of [-1, 1]) {
      const hip = V(sx * 0.12, 0.13, 0.24), knee = V(sx * 0.19, -0.06, -0.16), foot = V(sx * 0.15, -0.3, 0.3);
      P.push(limbGeo(hip, knee, 0.072, pants));
      P.push(limbGeo(knee, foot, 0.06, boot));
    }
    // robe skirt + cape (flutter)
    add(new THREE.CylinderGeometry(0.2, 0.37, 0.62, 16, 4, true), (x, y, z) => robe.clone().multiplyScalar(0.8 + 0.25 * clamp(y * 2, 0, 1)), M4(0, 0.3, 0.17, -0.6, 0, 0), (x, y, z) => clamp(z / 0.6, 0, 1) * clamp((0.55 - y) / 0.5, 0, 1));
    add(new THREE.PlaneGeometry(0.52, 0.98, 3, 7), (x, y, z) => (Math.abs(x) > 0.2 ? trim : robe), M4(0, 0.405, 0.43, -1.15, 0, 0), (x, y, z) => clamp(z / 0.85, 0, 1));
    return Geo.merge(P, ['aFlutter']);
  },
  flyer(team, role, seed) {
    const look = { skin: SKIN[seed % SKIN.length], hair: HAIR[(seed * 3 + 1) % HAIR.length] };
    const mesh = new THREE.Mesh(this.flyerGeo(team, role, look), this.flyerMat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  },

  viewmodel(team) {
    const T = CONFIG.teams[team];
    const robe = new THREE.Color(T.c1), trim = new THREE.Color(T.c2), glove = linCol(0.15, 0.075, 0.032);
    const vm = new THREE.Group();
    const shaft = [];
    shaft.push(cylBetween(V(0, -0.36, 0.4), V(0, -0.17, -2.1), 0.034, 0.028, linCol(0.2, 0.1, 0.045), 12));
    shaft.push(Geo.prep(new THREE.TorusGeometry(0.036, 0.012, 6, 14), linCol(0.6, 0.45, 0.15), M4(0, -0.173, -2.06, -0.08, 0, 0), { attr: { aFlutter: () => 0 } }));
    shaft.push(Geo.prep(new THREE.ConeGeometry(0.24, 1.0, 16, 2), (x, y, z) => linCol(0.3, 0.2, 0.075).multiplyScalar(0.6 + 0.6 * vnoise2(Math.atan2(y + 0.8, x) * 9, z * 6)), M4(0, -0.48, 1.45, -Math.PI / 2 + 0.08, 0, 0), { attr: { aFlutter: () => 0 } }));
    const sm = new THREE.Mesh(Geo.merge(shaft, ['aFlutter']), this.flyerMat); sm.receiveShadow = true;
    vm.add(sm);
    const L = [];
    L.push(limbGeo(V(-0.34, -0.66, 0.2), V(-0.075, -0.275, -0.56), 0.062, robe));
    { const d = V(-0.075, -0.275, -0.56).sub(V(-0.34, -0.66, 0.2)).normalize(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), d);
      L.push(Geo.prep(new THREE.TorusGeometry(0.06, 0.014, 6, 18), trim, new THREE.Matrix4().compose(V(-0.1, -0.31, -0.49), q, V(1, 1, 1)), { attr: { aFlutter: () => 0 } })); }
    L.push(Geo.prep(new THREE.SphereGeometry(0.052, 14, 10), glove, M4(-0.045, -0.245, -0.64, 0, 0, 0, 1, 0.85, 1.25), { attr: { aFlutter: () => 0 } }));
    L.push(limbGeo(V(-0.02, -0.235, -0.62), V(0.012, -0.225, -0.67), 0.017, glove));
    const lm = new THREE.Mesh(Geo.merge(L, ['aFlutter']), this.flyerMat); lm.receiveShadow = true;
    vm.add(lm);
    const R = [];
    R.push(limbGeo(V(0, 0, 0), V(0, 0, 0.74), 0.062, robe));
    R.push(Geo.prep(new THREE.TorusGeometry(0.06, 0.014, 6, 18), trim, M4(0, 0, 0.68), { attr: { aFlutter: () => 0 } }));
    const rArm = new THREE.Mesh(Geo.merge(R, ['aFlutter']), this.flyerMat); rArm.receiveShadow = true;
    vm.add(rArm);
    const rGlove = new THREE.Mesh(Geo.merge([Geo.prep(new THREE.SphereGeometry(0.054, 14, 10), glove, M4(0, 0, 0, 0, 0, 0, 1, 0.85, 1.25), { attr: { aFlutter: () => 0 } }), limbGeo(V(-0.04, 0.02, -0.02), V(-0.07, 0.04, -0.07), 0.02, glove)], ['aFlutter']), this.flyerMat);
    vm.add(rGlove);
    const ball = new THREE.Mesh(this.quaffleGeo, this.quaffleMat); ball.visible = false; ball.scale.setScalar(0.44);
    vm.add(ball);
    vm.traverse(o => { o.frustumCulled = false; });
    return { group: vm, shaft: sm, left: lm, rArm, rGlove, ball, shoulder: V(0.34, -0.66, 0.2) };
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
