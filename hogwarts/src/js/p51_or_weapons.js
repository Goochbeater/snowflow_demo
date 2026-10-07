/* ==== p51_or_weapons.js ==== */
/* OPUS RING — forged weapons. A Weapon is a Saber whose "blade" is steel: the same grip / sweep / trail machinery, no
   glow. +Y is the blade axis, y = 0 the middle of the grip. Conjured holy weapons (Margit) keep the glowing blade. */
SABER.COL.steel = [0.62, 0.68, 0.8]; SABER.COL.gold = [1.0, 0.66, 0.16]; SABER.COL.holy = [1.0, 0.8, 0.34]; SABER.COL.fire = [1.0, 0.32, 0.06];
const WPN = { KINDS: {} };
WPN.mats = function () {
  if (WPN._m) return WPN._m;
  const st = TEX.sets.steel, gd = TEX.sets.gold;
  const P = (o) => new THREE.MeshStandardMaterial(o);
  WPN._m = {
    steel: P({ color: 0xb9bec6, metalness: 1, roughness: 0.64, envMapIntensity: 1.0 }),
    dark: P({ color: 0x4a4c52, metalness: 1, roughness: 0.5, envMapIntensity: 0.9 }),
    iron: P({ color: 0x6a6660, metalness: 0.9, roughness: 0.62, envMapIntensity: 0.8 }),
    gold: P({ color: 0xd9a63c, metalness: 1, roughness: 0.34, roughnessMap: gd && gd.roughnessMap, envMapIntensity: 1.3 }),
    leather: P({ color: 0x2a1c12, metalness: 0, roughness: 0.7 }),
    wood: P({ color: 0x4a3420, metalness: 0, roughness: 0.85 }),
    bone: P({ color: 0xcfc4a8, metalness: 0, roughness: 0.6 }),
    red: P({ color: 0x6a0f0c, metalness: 0, roughness: 0.8 }),
  };
  return WPN._m;
};
/* a double-edged blade: diamond section, straight taper then a point. from y0, length L, half width w, half thickness t */
WPN.bladeGeo = function (y0, L, w, t, o) {
  o = o || {}; const tip = o.tip || 0.14, w1 = o.w1 !== undefined ? o.w1 : w * 0.62, n = 6, P = [], I = [];
  const ring = (y, ww, tt) => { P.push(ww, y, 0, 0, y, tt, -ww, y, 0, 0, y, -tt); };
  for (let i = 0; i <= n; i++) { const f = i / n, y = y0 + (L - tip) * f, ww = lerp(w, w1, f) * (1 + (o.leaf || 0) * Math.sin(f * PI)), cv = (o.curve || 0) * f * f; const k = P.length; ring(y, ww, t * lerp(1, 0.6, f)); if (cv) for (let q = k; q < P.length; q += 3) P[q] += cv; }
  const tipX = (o.curve || 0) * 1.25; P.push(tipX, y0 + L, 0);
  for (let i = 0; i < n; i++) for (let s = 0; s < 4; s++) { const a = i * 4 + s, b = i * 4 + (s + 1) % 4, c = a + 4, d = b + 4; I.push(a, b, d, a, d, c); }
  const T = (n + 1) * 4; for (let s = 0; s < 4; s++) I.push(n * 4 + s, n * 4 + (s + 1) % 4, T);
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g = g.toNonIndexed(); g.computeVertexNormals(); return g;
};
WPN.M = function (g, geo, mat, x, y, z, rx, ry, rz) { const me = new THREE.Mesh(geo, mat); me.position.set(x || 0, y || 0, z || 0); me.rotation.set(rx || 0, ry || 0, rz || 0); me.castShadow = true; g.add(me); return me; };
WPN.sword = function (o) {   // { blade, w, grip, guard, gold, fuller, pommel }
  const M = WPN.mats(), g = new THREE.Group(), A = (geo, mat, x, y, z, rx, ry, rz) => WPN.M(g, geo, mat, x, y, z, rx, ry, rz);
  const hilt = o.gold ? M.gold : M.dark, gl = o.grip || 0.2, gw = o.guard || 0.2, y1 = gl / 2;
  A(new THREE.CylinderGeometry(0.0145, 0.016, gl, 10), M.leather, 0, 0, 0);
  for (let i = 0; i < 5; i++) A(new THREE.TorusGeometry(0.0158, 0.0022, 5, 12), o.gold ? M.gold : M.iron, 0, -y1 + 0.02 + i * (gl - 0.04) / 4, 0, HALF);
  A(new THREE.SphereGeometry(o.pommel || 0.026, 12, 8), hilt, 0, -y1 - 0.018, 0).scale.set(1, 0.8, 0.75);
  A(KIT.chamferGeo(gw / 2, 0.013, 0.017, 0.005), hilt, 0, y1 + 0.012, 0);                           // cross-guard
  for (const s of [1, -1]) A(new THREE.SphereGeometry(0.017, 8, 6), hilt, s * gw / 2, y1 + 0.012, 0);
  A(KIT.chamferGeo(0.026, 0.02, 0.014, 0.004), hilt, 0, y1 + 0.03, 0);                                 // rain-guard
  A(WPN.bladeGeo(y1 + 0.02, o.blade, o.w || 0.028, o.t || 0.0055, { w1: o.w1, tip: o.tip, curve: o.curve, leaf: o.leaf }), o.bladeMat || M.steel);
  if (o.fuller !== 0) A(new THREE.BoxGeometry(0.008, o.blade * 0.62, (o.t || 0.0055) * 2 + 0.0012), M.dark, 0, y1 + 0.03 + o.blade * 0.31, 0);
  g.userData = { ends: [y1 + 0.02], grips: [-0.03, 0.05], len: gl, blade: o.blade, steel: true };
  return g;
};
WPN.pole = function (o) {   // shaft + head; { len, head: 'spear'|'halberd'|'axe'|'club'|'pick', gold }
  const M = WPN.mats(), g = new THREE.Group(), A = (geo, mat, x, y, z, rx, ry, rz) => WPN.M(g, geo, mat, x, y, z, rx, ry, rz);
  const L = o.len, y0 = -(o.below || L * 0.35), top = y0 + L, met = o.gold ? M.gold : M.steel, sh = o.gold ? M.gold : M.wood, r = o.r || 0.017;
  A(new THREE.CylinderGeometry(r, r * 1.1, L, 10), sh, 0, y0 + L / 2, 0);
  A(new THREE.ConeGeometry(r * 1.3, 0.09, 8), met, 0, y0 - 0.04, 0, PI);
  let bl = 0.4, b0 = top - 0.05;
  if (o.head === 'spear') { A(WPN.bladeGeo(top - 0.02, 0.36, 0.034, 0.008, { w1: 0.03, tip: 0.2, leaf: 0.5 }), met); A(new THREE.CylinderGeometry(r * 1.5, r * 1.2, 0.1, 10), met, 0, top - 0.05, 0); bl = 0.4; b0 = top - 0.04; }
  else if (o.head === 'halberd' || o.head === 'axe') {
    const s = o.hs || 1, sh2 = new THREE.Shape(); sh2.moveTo(0.01, -0.16 * s); sh2.quadraticCurveTo(0.2 * s, -0.24 * s, 0.26 * s, -0.02 * s); sh2.quadraticCurveTo(0.29 * s, 0.14 * s, 0.2 * s, 0.26 * s); sh2.quadraticCurveTo(0.12 * s, 0.1 * s, 0.01, 0.1 * s); sh2.lineTo(0.01, -0.16 * s);
    const eg = new THREE.ExtrudeGeometry(sh2, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1 }); eg.translate(0, 0, -0.006);
    A(eg, met, 0, top - 0.22 * s, 0);
    if (o.head === 'axe') { const e2 = eg.clone(); e2.rotateY(PI); A(e2, met, 0, top - 0.22 * s, 0); A(new THREE.ConeGeometry(0.03, 0.2, 8), met, 0, top + 0.08, 0); }
    else { A(WPN.bladeGeo(top - 0.02, 0.42, 0.03, 0.008, { tip: 0.25 }), met); A(new THREE.ConeGeometry(0.022, 0.2, 6), met, -0.09, top - 0.18, 0, 0, 0, HALF); }
    A(new THREE.CylinderGeometry(r * 1.7, r * 1.5, 0.34 * s, 10), met, 0, top - 0.2 * s, 0);
    bl = 0.62 * s + 0.2; b0 = top - 0.42 * s;
  } else if (o.head === 'club') {
    const cg = new THREE.CylinderGeometry(r * 3.6, r * 1.4, L * 0.42, 9, 4), p = cg.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (hash3(i, 3, 7) - 0.5) * 0.22; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } cg.computeVertexNormals();
    A(cg, M.wood, 0, top - L * 0.2, 0);
    for (let i = 0; i < 3; i++) A(new THREE.TorusGeometry(r * (2.1 + i * 0.55), 0.008, 5, 14), M.iron, 0, top - L * 0.36 + i * L * 0.12, 0, HALF);
    for (let i = 0; i < 7; i++) { const a = i * 2.4, yy = top - L * 0.3 + (i % 4) * L * 0.08; A(new THREE.ConeGeometry(0.018, 0.07, 5), M.iron, Math.cos(a) * r * 3.2, yy, Math.sin(a) * r * 3.2, 0, 0, -HALF).rotation.set(Math.sin(a) * HALF, 0, -Math.cos(a) * HALF); }
    bl = L * 0.5; b0 = top - L * 0.46;
  }
  g.userData = { ends: [b0], grips: [-0.2, 0.2], len: L, blade: bl, steel: true };
  return g;
};
WPN.KINDS = {
  longsword: () => WPN.sword({ blade: 0.98, w: 0.03, grip: 0.24, guard: 0.24 }),
  sword: () => WPN.sword({ blade: 0.78, w: 0.028, grip: 0.16, guard: 0.18 }),
  greatsword: () => WPN.sword({ blade: 1.36, w: 0.05, w1: 0.042, t: 0.008, grip: 0.36, guard: 0.34, pommel: 0.036 }),
  knightsword: () => WPN.sword({ blade: 1.12, w: 0.038, grip: 0.28, guard: 0.28, gold: true }),
  cleaver: () => WPN.sword({ blade: 1.05, w: 0.06, w1: 0.085, t: 0.009, grip: 0.3, guard: 0.1, tip: 0.3, curve: 0.16, fuller: 0, bladeMat: WPN.mats().iron }),
  dagger: () => WPN.sword({ blade: 0.34, w: 0.022, grip: 0.12, guard: 0.1, fuller: 0 }),
  spear: () => WPN.pole({ len: 2.1, head: 'spear', below: 0.9 }),
  halberd: () => WPN.pole({ len: 2.3, head: 'halberd', below: 0.9 }),
  ghalberd: () => WPN.pole({ len: 2.9, head: 'halberd', below: 1.0, gold: true, hs: 1.5, r: 0.024 }),
  gaxe: () => WPN.pole({ len: 1.5, head: 'axe', below: 0.42, gold: true, hs: 1.25, r: 0.022 }),
  club: () => WPN.pole({ len: 1.5, head: 'club', below: 0.45, r: 0.024 }),
  cane: () => WPN.pole({ len: 1.7, head: 'club', below: 0.6, r: 0.02 }),
  torch: () => { const M = WPN.mats(), g = new THREE.Group(); WPN.M(g, new THREE.CylinderGeometry(0.018, 0.014, 0.7, 8), M.wood, 0, 0.15, 0); WPN.M(g, new THREE.CylinderGeometry(0.035, 0.022, 0.14, 8), M.iron, 0, 0.55, 0);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.2, 0.6), toneMapped: false })); fl.position.y = 0.68; fl.scale.set(1, 1.6, 1); g.add(fl); g.userData = { ends: [0.3], grips: [0, 0.05], len: 0.7, blade: 0.4, steel: true, flame: fl }; return g; },
  crossbow: () => { const M = WPN.mats(), g = new THREE.Group(); WPN.M(g, KIT.chamferGeo(0.02, 0.3, 0.028, 0.006), M.wood, 0, 0.05, 0); const bow = new THREE.TorusGeometry(0.28, 0.011, 5, 16, PI * 0.8); WPN.M(g, bow, M.dark, 0, 0.3, 0, HALF, 0, PI * 0.1 + HALF).rotation.set(HALF, PI * 0.1, 0);
    WPN.M(g, new THREE.CylinderGeometry(0.003, 0.003, 0.5, 4), M.bone, 0, 0.22, 0.0, 0, 0, HALF); WPN.M(g, KIT.chamferGeo(0.012, 0.05, 0.03, 0.004), M.wood, 0, -0.2, -0.04, 0.4);
    g.userData = { ends: [0.3], grips: [-0.1, 0.14], len: 0.6, blade: 0.1, steel: true, mz: 0.36 }; return g; },
};
/* merge a weapon's many small meshes into one per material (a camp of soldiers is otherwise hundreds of draw calls) */
WPN.bake = function (g) {
  const by = new Map(); g.updateMatrixWorld(true);
  for (const c of g.children.slice()) { if (!c.isMesh || Array.isArray(c.material)) continue; c.updateMatrix(); const geo = c.geometry.clone(); geo.applyMatrix4(c.matrix); if (!by.has(c.material)) by.set(c.material, []); by.get(c.material).push(geo); g.remove(c); }
  for (const [mat, list] of by) { const me = new THREE.Mesh(ARM.merge(list), mat); me.castShadow = true; g.add(me); }
  return g;
};
(function () { for (const k in WPN.KINDS) { const f = WPN.KINDS[k]; WPN.KINDS[k] = () => WPN.bake(f()); } })();
/* an enemy's prop (the Enemy class expects userData.glow + .muzzle, and the prop in the scene) */
WPN.prop = function (kind) {
  const g = WPN.KINDS[kind]();
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); glow.visible = false; g.add(glow); g.userData.glow = glow;
  const mz = new THREE.Object3D(); mz.position.y = g.userData.mz || (g.userData.ends[0] + g.userData.blade * 0.8); g.add(mz); g.userData.muzzle = mz;
  R.scene.add(g); return g;
};
(function () { const s0 = CAST.staff, r0 = CAST.rifle; CAST.staff = (k) => (WPN.KINDS[k] ? WPN.prop(k) : s0(k)); CAST.rifle = (k) => (WPN.KINDS[k] ? WPN.prop(k) : r0(k));
  const b0 = SABER.buildSingle; SABER.buildSingle = (k) => (WPN.KINDS[k] ? WPN.KINDS[k]() : b0(k)); })();
class Weapon extends Saber {
  /* opt.glow: a conjured blade of light of that colour instead of steel; opt.scale: giant's weapon */
  constructor(kind, opt) {
    opt = opt || {};
    super(kind, opt.glow || 'steel', opt);
    const ud = this.hilt.userData; this.len = opt.len || ud.blade; this.steel = !opt.glow; this.kind = kind;
    this.ign = this.ends.map(() => 1); this.ignT = this.ends.map(() => 1);
    if (this.steel) {
      for (const b of this.blades) b.g.visible = false;
      for (const L of this.lights) R.removeLight(L);
      this.lights = this.lights.map(() => ({ pos: new THREE.Vector3(), i: 0, on: false }));
      for (const t of this.trails) { t.mat.uniforms.uCol.value.setRGB(0.5, 0.55, 0.66); t.maxAge = 0.09; }
    } else {
      // a holy blade: wider, softer, and the forged steel under it hidden
      for (const b of this.blades) { b.layers[0].material.uniforms.uR.value = 0.012; b.layers[1].material.uniforms.uR.value = 0.024; b.layers[2].material.uniforms.uR.value = 0.05; b.layers[3].material.uniforms.uR.value = 0.11; }
      this.hilt.traverse((o) => { if (o.isMesh) o.visible = false; });
    }
  }
  update(dt, now) { super.update(dt, now); if (this.steel) for (const L of this.lights) L.i = 0; }
}
/* shields (strapped to the left forearm, bone 7): heater / round / greatshield, painted with a device */
WPN.shield = function (kind, col, col2) {
  const g = new THREE.Group(), M = WPN.mats();
  const face = new THREE.MeshStandardMaterial({ color: col || 0x7a1a14, roughness: 0.6, metalness: 0.15, envMapIntensity: 0.6 });
  if (kind === 'round') { const d = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 8, 0, TAU, 0, 0.5), face); d.rotation.x = HALF; d.scale.z = 0.5; d.position.z = -0.27; g.add(d); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.163, 0.012, 6, 24), M.iron); g.add(rim); const boss = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.steel); boss.position.z = 0.03; g.add(boss); }
  else { const tall = kind === 'great' ? 1.5 : 1, sh = new THREE.Shape(); sh.moveTo(-0.2, 0.26 * tall); sh.lineTo(0.2, 0.26 * tall); sh.lineTo(0.2, -0.02); sh.quadraticCurveTo(0.17, -0.26 * tall, 0, -0.36 * tall); sh.quadraticCurveTo(-0.17, -0.26 * tall, -0.2, -0.02); sh.lineTo(-0.2, 0.26 * tall);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.008, bevelSegments: 2 }), p = eg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - p.getX(i) * p.getX(i) * 1.3);   // curved across the arm
    eg.computeVertexNormals(); const me = new THREE.Mesh(eg, [M.iron, face]); me.geometry.groups.forEach((gr, i) => { gr.materialIndex = i === 0 ? 1 : 0; }); g.add(me);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6 * tall, 0.012), new THREE.MeshStandardMaterial({ color: col2 || 0xc9a24a, roughness: 0.5, metalness: 0.6 })); band.position.set(0, -0.04, 0.02); g.add(band);
    const band2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.012), band.material); band2.position.set(0, 0.1 * tall, 0.014); g.add(band2); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return kind === 'round' ? WPN.bake(g) : g;
};
/* arrows / bolts: a dark shaft instead of a blaster streak */
(function () {
  const f0 = COMBAT.fire;
  COMBAT.fire = function (p, dir, o) {
    const b = f0(p, dir, o);
    if (o && o.arrow) { b.core.material = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 0.8 }); b.core.scale.set(0.5, 0.5, 0.85); b.glow.visible = false; R.removeLight(b.L); b.L = { pos: b.p, i: 0 }; b.arrow = true; b.c0 = null; b.k0 = 1;
      b.orient = function () { this.g.position.copy(this.p); this.g.lookAt(_v1.copy(this.p).add(this.v)); }; b.orient(); }
    else if (o && o.holy) { b.core.scale.set(2.2, 2.2, 0.8); b.glow.scale.set(5, 5, 1); }
    return b;
  };
})();
/* strap a shield to the left forearm (bone 7): its face outward, its height across the arm so it stands upright in guard */
WPN.strap = function (s) { s.position.set(0.136, -0.117, 0.012); s.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(0, 1, 0), V3(0, 0, 1), V3(1, 0, 0))); return s; };
