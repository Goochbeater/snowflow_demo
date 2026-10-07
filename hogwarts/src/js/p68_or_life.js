/* ==== p68_or_life.js ==== */
/* OPUS RING — a living land. Sheep and deer that graze and bolt, birds that wheel overhead and burst up from the grass,
   leaves on the wind, cloud shadows crossing the hills, a carriage hauled by trolls with its escort, patrols on the
   road — and the country beyond the map's edge: the plateau, the mountains, a ruined bridge striding into the sea,
   a far peninsula with its castle, the Divine Tower, a lesser Erdtree in the eastern woods. */
const LIFE = { list: [] };
WORLD.TIME = { value: 0 };
/* ------------------------------------------------------------------ sheep and deer */
Object.assign(QUAD.SPEC, {
  sheep: { box: [-0.4, 0.05, -0.8, 0.4, 1.15, 0.95], res: 0.034, hips: [[0.13, 0.5, 0.26], [-0.13, 0.5, 0.26], [0.13, 0.5, -0.28], [-0.13, 0.5, -0.28]], up: 0.25, lo: 0.25, seat: [0, 0.8, 0], len: 1.1,
    upF: [[0.05, 0.0], [0.052, -0.06], [0.036, -0.18], [0.03, -0.25]], upH: [[0.06, 0.0], [0.062, -0.06], [0.04, -0.18], [0.03, -0.25]], lo_: [[0.03, 0.0], [0.024, -0.1], [0.022, -0.2], [0.032, -0.235], [0.034, -0.25], [0.0, -0.25]], hoofY: -0.22 },
  deer: { box: [-0.4, 0.1, -1.0, 0.4, 2.3, 1.3], res: 0.03, hips: [[0.13, 0.98, 0.34], [-0.13, 0.98, 0.34], [0.13, 1.0, -0.42], [-0.13, 1.0, -0.42]], up: 0.5, lo: 0.5, seat: [0, 1.3, 0], len: 1.7,
    upF: [[0.07, 0.0], [0.075, -0.06], [0.05, -0.24], [0.036, -0.5]], upH: [[0.09, 0.0], [0.1, -0.08], [0.06, -0.26], [0.038, -0.5]], lo_: [[0.036, 0.0], [0.026, -0.1], [0.022, -0.38], [0.03, -0.45], [0.032, -0.5], [0.0, -0.5]], hoofY: -0.46 },
});
(function () {
  const s0 = QUAD.sculpt;
  QUAD.sculpt = function (kind, o) {
    if (kind !== 'sheep' && kind !== 'deer') return s0(kind, o);
    const S = QUAD.SPEC[kind];
    const gz = !!o.graze; return PROPS.sdfMesh('quad8_' + kind + (o.horns ? 'h' : '') + (gz ? 'z' : ''), (grp) => { const C = grp(0, 0.08), H = grp(1, 0.03), X = grp(2, 0.01);
      if (kind === 'sheep') { C.add(SDF.ell([0, 0.66, -0.02], [0.24, 0.23, 0.42])); C.add(SDF.ell([0, 0.7, 0.24], [0.2, 0.2, 0.2]), 'su', 0.08); C.add(SDF.ell([0, 0.68, -0.3], [0.21, 0.21, 0.2]), 'su', 0.08);
        for (let i = 0; i < 9; i++) C.add(SDF.sph([Math.sin(i * 2.4) * 0.17, 0.74 + Math.cos(i * 1.7) * 0.1, -0.3 + i * 0.075], 0.11), 'su', 0.05);   // wool
        if (gz) { H.add(SDF.rcone([0, 0.62, 0.4], [0, 0.34, 0.6], 0.085, 0.06)); H.add(SDF.ell([0, 0.26, 0.64], [0.05, 0.07, 0.05]), 'su', 0.03); H.both(SDF.rcone([0.06, 0.6, 0.5], [0.15, 0.58, 0.52], 0.03, 0.012), 'su', 0.015);
          if (o.horns) { X.both(SDF.rcone([0.05, 0.66, 0.5], [0.14, 0.74, 0.46], 0.026, 0.02)); X.both(SDF.rcone([0.14, 0.74, 0.46], [0.17, 0.66, 0.38], 0.02, 0.008), 'su', 0.012); }
          X.both(SDF.sph([0.048, 0.4, 0.6], 0.01)); }
        else { H.add(SDF.rcone([0, 0.76, 0.4], [0, 0.72, 0.62], 0.085, 0.06)); H.add(SDF.ell([0, 0.7, 0.68], [0.05, 0.05, 0.07]), 'su', 0.03); H.both(SDF.rcone([0.06, 0.8, 0.46], [0.15, 0.78, 0.44], 0.03, 0.012), 'su', 0.015);
          if (o.horns) { X.both(SDF.rcone([0.05, 0.84, 0.44], [0.13, 0.9, 0.36], 0.026, 0.02)); X.both(SDF.rcone([0.13, 0.9, 0.36], [0.16, 0.8, 0.3], 0.02, 0.008), 'su', 0.012); }
          X.both(SDF.sph([0.045, 0.76, 0.6], 0.01)); } }
      else { C.add(SDF.ell([0, 1.1, -0.04], [0.17, 0.2, 0.5])); C.add(SDF.ell([0, 1.1, 0.3], [0.18, 0.24, 0.24]), 'su', 0.08); C.add(SDF.ell([0, 1.14, -0.4], [0.18, 0.22, 0.22]), 'su', 0.08);
        C.both(SDF.ell([0.12, 1.02, 0.34], [0.07, 0.18, 0.11]), 'su', 0.05); C.both(SDF.ell([0.12, 1.04, -0.42], [0.08, 0.2, 0.14]), 'su', 0.05);
        H.add(SDF.rcone([0, 1.16, -0.62], [0, 1.1, -0.72], 0.05, 0.03));
        // the head and neck in the body's frame, raised or lowered to the grass
        const hp = gz ? ((p) => { const dy = p[1] - 1.22, dz = p[2] - 0.42; return [p[0], 1.22 + (dy * -0.358 - dz * 0.934) * 1.6, 0.42 + (dy * 0.934 - dz * 0.358) * 1.6]; }) : ((p) => p);
        C.add(SDF.rcone(hp([0, 1.22, 0.42]), hp([0, 1.66, 0.66]), 0.11, 0.065), 'su', 0.08); C.add(SDF.sph(hp([0, 1.74, 0.72]), 0.078), 'su', 0.04); C.add(SDF.rcone(hp([0, 1.72, 0.78]), hp([0, 1.64, 0.94]), 0.05, 0.03), 'su', 0.03);
        C.add(SDF.rcone(hp([0.05, 1.8, 0.66]), hp([0.13, 1.88, 0.62]), 0.028, 0.008), 'su', 0.015); C.add(SDF.rcone(hp([-0.05, 1.8, 0.66]), hp([-0.13, 1.88, 0.62]), 0.028, 0.008), 'su', 0.015);
        if (o.horns) { for (const sd of [1, -1]) { X.add(SDF.rcone(hp([sd * 0.045, 1.82, 0.68]), hp([sd * 0.13, 2.04, 0.58]), 0.016, 0.012)); X.add(SDF.rcone(hp([sd * 0.13, 2.04, 0.58]), hp([sd * 0.2, 2.2, 0.62]), 0.012, 0.006), 'su', 0.008); X.add(SDF.rcone(hp([sd * 0.11, 1.98, 0.6]), hp([sd * 0.14, 2.06, 0.74]), 0.01, 0.005), 'su', 0.008); X.add(SDF.rcone(hp([sd * 0.16, 2.1, 0.6]), hp([sd * 0.26, 2.16, 0.56]), 0.01, 0.005), 'su', 0.008); } }
        X.add(SDF.sph(hp([0, 1.64, 0.955]), 0.014)); X.add(SDF.sph(hp([0.052, 1.76, 0.78]), 0.011)); X.add(SDF.sph(hp([-0.052, 1.76, 0.78]), 0.011)); }
    }, S.box, S.res);
  };
})();
/* one animal = one draw: the sculpted body and its four legs merged, painted per vertex; the gait bends the legs in the
   vertex shader (aLeg: hip y, hip z, 1 upper / 2 lower, leg index) */
LIFE.geo = function (kind, graze, horns, cols) {
  const key = kind + (graze ? 'z' : '') + (horns ? 'h' : ''); LIFE._geo = LIFE._geo || {}; if (LIFE._geo[key]) return LIFE._geo[key];
  const S = QUAD.SPEC[kind], P = [], N = [], C = [], A = [], col = new THREE.Color();
  const add = (g, cf, leg) => { const ni = g.index ? g.toNonIndexed() : g, p = ni.attributes.position, n = ni.attributes.normal, ao = ni.attributes.aAO; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); const c = cf(i), k = ao ? 0.5 + 0.5 * ao.getX(i) : 1; C.push(c.r * k, c.g * k, c.b * k); A.push(leg[0], leg[1], leg[2], leg[3]); } };
  { const b = QUAD.sculpt(kind, { horns, graze }), idx = b.index, mat = new Uint8Array(b.attributes.position.count); for (const gr of b.groups) for (let i = gr.start; i < gr.start + gr.count; i++) mat[idx.getX(i)] = gr.materialIndex;
    const ni = b.toNonIndexed(), cc = [new THREE.Color(cols[0]), new THREE.Color(cols[1]), new THREE.Color(cols[2])]; let k = 0; const order = []; for (let i = 0; i < idx.count; i++) order.push(mat[idx.getX(i)]);
    add(ni, (i) => cc[order[i]] || cc[0], [0, 0, 0, 0]); void k; }
  const lathe = (prof) => { const pts = prof.slice().reverse().map((q) => new THREE.Vector2(Math.max(1e-4, q[0]), q[1])); const lg = new THREE.LatheGeometry(pts, 7); lg.computeVertexNormals(); return lg; }, lc = new THREE.Color(cols[3]);
  S.hips.forEach((h, i) => { const up = lathe(i < 2 ? S.upF : S.upH); up.translate(h[0], h[1], h[2]); add(up, () => lc, [h[1], h[2], 1, i]); const lo = lathe(S.lo_); lo.translate(h[0], h[1] - S.up, h[2]); add(lo, () => lc, [h[1], h[2], 2, i]); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aLeg', new THREE.Float32BufferAttribute(A, 4));
  g.computeBoundingSphere(); g.boundingSphere.radius *= 1.3; void col; LIFE._geo[key] = g; return g;
};
LIFE.mat = function (U) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, envMapIntensity: 0.3 });
  m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aLeg; uniform vec4 uGait; uniform vec4 uOff; uniform float uUp; varying vec3 vOPl;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      vOPl = position;
      if (aLeg.z > 0.5) { float o = aLeg.w < 0.5 ? uOff.x : aLeg.w < 1.5 ? uOff.y : aLeg.w < 2.5 ? uOff.z : uOff.w; float ph = (uGait.x + o) * 6.2832, fr = aLeg.w < 1.5 ? 1.0 : 0.0;
        float au = -sin(ph) * uGait.y + mix(-0.16, 0.04, fr), al = max(0.0, cos(ph)) * uGait.y * 1.5 + mix(0.3, 0.0, fr);
        vec2 q = transformed.yz, hip = aLeg.xy;
        if (aLeg.z > 1.5) { vec2 kn = hip - vec2(uUp, 0.0), d = q - kn; q = kn + vec2(d.x * cos(al) - d.y * sin(al), d.x * sin(al) + d.y * cos(al)); }
        vec2 d2 = q - hip; q = hip + vec2(d2.x * cos(au) - d2.y * sin(au), d2.x * sin(au) + d2.y * cos(au)); transformed.yz = q; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vOPl; float lh(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float ln(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(lh(i), lh(i + vec3(1,0,0)), f.x), mix(lh(i + vec3(0,1,0)), lh(i + vec3(1,1,0)), f.x), f.y), mix(mix(lh(i + vec3(0,0,1)), lh(i + vec3(1,0,1)), f.x), mix(lh(i + vec3(0,1,1)), lh(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.78 + 0.4 * (ln(vOPl * vec3(46.0, 30.0, 40.0)) * 0.6 + ln(vOPl * 9.0) * 0.4);'); };
  m.customProgramCacheKey = () => 'lifebeast';
  return m;
};
class Grazer {
  constructor(kind, x, z, o) {
    o = o || {}; this.kind = kind; const deer = kind === 'deer', S = QUAD.SPEC[kind], cols = deer ? [0x9a7a56, 0xd8ccb0, o.horns ? 0xd8ccb0 : 0x100c0a, 0x76603e] : [0xcfc8b8, 0x302a26, o.horns ? 0xc8bca0 : 0x100c0a, 0x2c2622];
    this.U = { uGait: { value: new THREE.Vector4(RNG(), 0, 0, 0) }, uOff: { value: new THREE.Vector4(0, 0.5, 0.5, 0) }, uUp: { value: S.up } };
    this.gUp = LIFE.geo(kind, false, !!o.horns, cols); this.gDn = LIFE.geo(kind, true, !!o.horns, cols);
    const g = new THREE.Group(), me = new THREE.Mesh(this.gDn, LIFE.mat(this.U)); me.castShadow = true; me.receiveShadow = true; g.add(me); g.scale.setScalar(o.scale || 1); R.scene.add(g); this.Q = { g }; this.me = me; this.sc = o.scale || 1; this.ph = RNG(); this.amp = 0;
    this.x = x; this.z = z; this.y = WORLD.gy(x, z); this.yaw = RNG() * TAU; this.vx = 0; this.vz = 0; this.vy = 0; this.r = deer ? 0.45 : 0.4; this.h = deer ? 1.7 : 0.9; this.step = 0.5; this.speed = 0;
    this.hp = this.hpMax = deer ? 30 : 18; this.alive = true; this.team = 'foe'; this.hidden = false; this.iframe = 0; this.flash = 0; this.noExec = true; this.isBeast = true; this.wild = true; this.runes = deer ? 40 : 18; this.name = deer ? 'Deer' : 'Sheep';
    this.alerted = false; this.state = 'graze'; this.stT = RNG() * 4; this.home = [x, z]; this.tgt = null; this.deadT = 0; this.roll = 0; this.wait = RNG() * 6;
    this.react = (i) => { this.flee(i && i.src); FX.puff(this.chest(), 4, { size: 0.08, grow: 2, col: [0.3, 0.02, 0.02], a: 0.8, life: 0.4, spread: 1.5, rise: -3 }); }; this.die = () => { this.rollS = RNG() < 0.5 ? 1 : -1; this.vx *= 0.5; this.vz *= 0.5; };
    COMBAT.actors.push(this); this.sync(0);
  }
  dist(o) { return Math.hypot(o.x - this.x, o.z - this.z); } angTo(o) { return Math.atan2(o.x - this.x, o.z - this.z); }
  chest(out) { return (out || new THREE.Vector3()).set(this.x, this.y + this.h * 0.6, this.z); } head(out) { return this.chest(out); }
  forward(out) { return (out || new THREE.Vector3()).set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  moveH(dx, dz) { return PHY.move(this, dx, dz); } alert() {} flinch() {}
  sync(dt) { const g = this.Q.g, sp = this.speed / this.sc, deer = this.kind === 'deer', gal = smooth(deer ? 4.5 : 3.2, deer ? 8 : 5.5, sp);
    this.amp = damp(this.amp, clamp(sp / (deer ? 6 : 4), 0, 1), 6, dt); this.ph = (this.ph + dt * (sp < 0.1 ? 0 : lerp(1.2, 2.6, clamp(sp / 9, 0, 1)) * (deer ? 1 : 1.5))) % 1;
    this.U.uGait.value.set(this.ph, this.amp * 0.66 * (sp < 0.1 ? 0 : 1), 0, 0); this.U.uOff.value.set(0, lerp(0.5, 0.12, gal), lerp(0.5, 0.52, gal), lerp(0, 0.64, gal));
    g.position.set(this.x, this.y + Math.abs(Math.sin(this.ph * TAU)) * 0.07 * this.amp * (1 + gal), this.z); g.rotation.set(Math.sin(this.ph * TAU * 2 + 0.8) * 0.06 * this.amp * gal, this.yaw, this.roll, 'YXZ');
    const dn = this.alive && this.state === 'graze' && !this.tgt && this.stT > 0.5, want = dn ? this.gDn : this.gUp; if (this.me.geometry !== want) this.me.geometry = want; }
  flee(from) { const P = from || PLAYER.a; this.state = 'flee'; this.stT = 0; this.fleeT = 3.5 + RNG() * 2.5; const a = P ? Math.atan2(this.x - P.x, this.z - P.z) + rnd(-0.5, 0.5) : RNG() * TAU; this.fa = a;
    for (const g of LIFE.list) if (g !== this && g.alive && g.state !== 'flee' && g.dist(this) < 13) { g.state = 'flee'; g.stT = -RNG() * 0.4; g.fleeT = 3 + RNG() * 3; g.fa = a + rnd(-0.6, 0.6); } }
  update(dt) {
    this.stT += dt; this.iframe = Math.max(0, this.iframe - dt); this.flash = Math.max(0, this.flash - dt);
    if (!this.alive) { this.deadT += dt; this.roll = damp(this.roll, HALF * (this.rollS || 1), 7, dt); this.vx *= 0.9; this.vz *= 0.9; PHY.move(this, this.vx * dt, this.vz * dt); QUAD.fall(this, dt); this.speed = 0; this.sync(dt); if (this.deadT > 8 && !this.hidden) { this.hidden = true; this.Q.g.visible = false; } return; }
    const P = PLAYER.a, d = P ? this.dist(P) : 99; let tvx = 0, tvz = 0;
    if (this.state === 'graze') { const near = this.kind === 'deer' ? 13 : 7.5; if (P && P.alive && (d < near || (d < near * 1.9 && P.speed > 5.5) || (PLAYER.state === 'ride' && d < near * 2))) this.flee();
      else if (this.tgt) { const dx = this.tgt[0] - this.x, dz = this.tgt[1] - this.z, dd = Math.hypot(dx, dz); if (dd < 0.5 || this.stT > 9) { this.tgt = null; this.stT = 0; this.wait = 2 + RNG() * 7; } else { tvx = dx / dd * 1.0; tvz = dz / dd * 1.0; this.yaw = dampA(this.yaw, Math.atan2(dx, dz), 3, dt); } }
      else { if (this.stT > (this.wait || 3)) { const a = RNG() * TAU, r = 2 + RNG() * 7; this.tgt = [this.home[0] + Math.cos(a) * r, this.home[1] + Math.sin(a) * r]; this.stT = 0; } } }
    else if (this.state === 'flee') { if (this.stT > 0) { const sp = this.kind === 'deer' ? 9.5 : 6.4; this.fa += Math.sin(this.stT * 3 + this.x) * dt * 0.8; tvx = Math.sin(this.fa) * sp; tvz = Math.cos(this.fa) * sp; this.yaw = dampA(this.yaw, this.fa, 8, dt); }
      if (this.stT > this.fleeT) { this.state = 'graze'; this.stT = 0; this.tgt = null; this.home = [this.x, this.z]; } }
    this.vx = damp(this.vx, tvx, 5, dt); this.vz = damp(this.vz, tvz, 5, dt);
    const h0 = PHY.hf ? PHY.hf(this.x + this.vx * 0.3, this.z + this.vz * 0.3) : 0; if (h0 === null || h0 < LIM.WATER + 0.2 || h0 - this.y > 1.6) { this.fa = (this.fa || this.yaw) + 1.6; this.tgt = null; this.vx *= 0.3; this.vz *= 0.3; }
    PHY.move(this, this.vx * dt, this.vz * dt); QUAD.fall(this, dt); this.speed = Math.hypot(this.vx, this.vz); this.sync(dt);
  }
  dispose() { if (this.Q.g.parent) this.Q.g.parent.remove(this.Q.g); const i = COMBAT.actors.indexOf(this); if (i >= 0) COMBAT.actors.splice(i, 1); }
}
LIFE.herds = function (L, defs) {
  L.herdDefs = defs; const make = () => { for (const g of LIFE.list) g.dispose(); LIFE.list.length = 0; const rs = MG.rs('herds');
    for (const [kind, x, z, n] of defs) for (let i = 0; i < n; i++) { const a = rs() * TAU, r = 1.5 + rs() * 6, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; { const h = PHY.hf(px, pz); if (h === null || h < LIM.WATER + 0.6 || Math.abs(PHY.hf(px + 2, pz) - h) > 1.1 || Math.abs(PHY.hf(px, pz + 2) - h) > 1.1) continue; } LIFE.list.push(new Grazer(kind, px, pz, { horns: i === 0, scale: 0.88 + rs() * 0.28 })); } };
  make(); (L.onRespawn = L.onRespawn || []).push(make);
  L.updates.push((dt) => { const c = R.camera.position; for (const g of LIFE.list) { const d = Math.hypot(g.x - c.x, g.z - c.z), far = d > 95; if (far !== !!g.asleep) { g.asleep = far; g.Q.g.visible = !far && !g.hidden; } g.me.castShadow = d < 45; if (!far) g.update(d > 45 ? dt : dt); } });
  const d0 = L.dispose; L.dispose = () => { if (d0) d0(); for (const g of LIFE.list) g.dispose(); LIFE.list.length = 0; };
};
/* ------------------------------------------------------------------ birds */
LIFE.birds = function (L, o) {
  o = o || {}; const N = o.n || 64, P = [], I = [], W = [];   // body + two wings; aW marks wing tips (they flap)
  // a spindle of a body (beak, breast, back, tail fan) and two wings of two panels each; aW: 0 body, 0.5 wrist, 1 tip
  P.push(0, 0.01, 0.19, 0, 0.055, 0.03, 0, -0.045, 0.02, 0.05, 0, 0.03, -0.05, 0, 0.03, 0, 0.012, -0.13, 0.05, 0.0, -0.25, -0.05, 0.0, -0.25); W.push(0, 0, 0, 0, 0, 0, 0, 0);
  I.push(0, 3, 1, 0, 1, 4, 0, 2, 3, 0, 4, 2, 1, 3, 5, 1, 5, 4, 2, 5, 3, 2, 4, 5, 5, 6, 7);
  for (const sd of [1, -1]) { const b = P.length / 3; P.push(sd * 0.04, 0.03, 0.08, sd * 0.04, 0.03, -0.08, sd * 0.24, 0.03, 0.07, sd * 0.24, 0.03, -0.1, sd * 0.5, 0.03, -0.06); W.push(0, 0, 0.5, 0.5, 1); I.push(b, b + 2, b + 1, b + 1, b + 2, b + 3, b + 2, b + 4, b + 3); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1)); g.setIndex(I);
  const ph = new Float32Array(N), sc = new Float32Array(N), nSky0 = Math.floor(N * 0.55); for (let i = 0; i < N; i++) { ph[i] = RNG() * TAU; sc[i] = i < nSky0 ? 2.0 + RNG() * 1.4 : 1.15; } g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(sc, 1));
  const iPos = new Float32Array(N * 4); const ia = new THREE.InstancedBufferAttribute(iPos, 4); ia.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aI', ia); g.instanceCount = N;
  const fl = new Float32Array(N); const fa = new THREE.InstancedBufferAttribute(fl, 1); fa.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aF', fa);
  const U = { uT: WORLD.TIME, uFog: { value: new THREE.Color() }, uFogD: { value: 0.002 } };
  const m = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, vertexShader: `attribute float aW, aPh, aF, aS; attribute vec4 aI; uniform float uT; varying float vD;
      void main(){ vec3 p = position; float fold = 1.0 - smoothstep(0.0, 0.12, aF); float fl = sin(uT * (9.0 + aF * 9.0) + aPh) * (0.25 + 0.75 * aF); p.y += aW * (0.05 + fl * 0.26) * (1.0 - fold); p.x *= 1.0 - aW * 0.25 * abs(fl);
        p.x = mix(p.x, sign(p.x) * 0.045, fold * step(0.01, aW)); p.z -= fold * aW * 0.12; p.y += fold * 0.11 + fold * abs(sin(uT * 0.9 + aPh * 3.0)) * step(0.985, sin(uT * 0.7 + aPh)) * 0.03;
        float c = cos(aI.w), s = sin(aI.w); vec3 w = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c) * aS + aI.xyz; vec4 mv = viewMatrix * vec4(w, 1.0); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'uniform vec3 uFog; uniform float uFogD; varying float vD; void main(){ float f = 1.0 - exp(-uFogD * uFogD * vD * vD * 0.6); gl_FragColor = vec4(mix(vec3(0.035, 0.035, 0.04), uFog, f), 1.0); }' });
  const me = new THREE.Mesh(g, m); me.frustumCulled = false; LEVEL.add(me);
  // flocks aloft: each wheels about a slow-drifting centre
  const B = [], rs = MG.rs('birds'), nSky = Math.floor(N * 0.55), flocks = o.flocks || [[0, 60, -150, 70], [120, 80, 40, 90], [-110, 70, 220, 80], [40, 110, 420, 110]];
  for (let i = 0; i < N; i++) { if (i < nSky) { const f = flocks[i % flocks.length]; B.push({ sky: true, f, a: rs() * TAU, r: f[3] * (0.3 + rs() * 0.7), h: f[1] + rs() * 26, w: (0.1 + rs() * 0.08) * (rs() < 0.5 ? 1 : -1), bob: rs() * 9 }); }
    else { const s = (o.ground || [])[(i - nSky) % Math.max(1, (o.ground || []).length)] || [0, -260]; const a = rs() * TAU, r = rs() * 3.5; B.push({ sky: false, hx: s[0] + Math.cos(a) * r, hz: s[1] + Math.sin(a) * r, st: 0, t: rs() * 5, x: 0, y: 0, z: 0, yaw: rs() * TAU, vx: 0, vy: 0, vz: 0, peck: rs() * 9 }); } }
  const reset = (b) => { b.st = 0; b.x = b.hx; b.z = b.hz; b.y = (WORLD.gy(b.hx, b.hz) || 0) + 0.08; };
  for (const b of B) if (!b.sky) reset(b);
  L.updates.push((dt, t) => { const Pl = PLAYER.a, c = R.camera.position; if (R.scene.fog) { U.uFog.value.copy(R.scene.fog.color); U.uFogD.value = R.scene.fog.density; }
    for (let i = 0; i < N; i++) { const b = B[i]; let x, y, z, yaw, f = 0.35;
      if (b.sky) { b.a += b.w * dt; x = b.f[0] + Math.cos(b.a) * b.r + Math.sin(t * 0.03 + i) * 40; z = b.f[2] + Math.sin(b.a) * b.r + Math.cos(t * 0.027 + i) * 40; y = b.h + Math.sin(t * 0.3 + b.bob) * 4; yaw = -b.a + (b.w > 0 ? 0 : PI); f = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.7 + b.bob)); }
      else { if (b.st === 0) { f = 0; b.t -= dt; if (b.t < 0) { b.t = 1 + RNG() * 4; b.yaw += rnd(-1.2, 1.2); } if (Pl && Math.hypot(Pl.x - b.x, Pl.z - b.z) < 11 + (Pl.speed > 5 ? 6 : 0)) { b.st = 1; b.t = 0; const a = Math.atan2(b.x - Pl.x, b.z - Pl.z) + rnd(-0.7, 0.7); b.vx = Math.sin(a) * rnd(5, 8); b.vz = Math.cos(a) * rnd(5, 8); b.vy = rnd(3.5, 6); b.yaw = a; } }
        else if (b.st === 1) { f = 1; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vy = damp(b.vy, 1.2, 0.8, dt); if (b.t > 9) { b.st = 2; b.t = 0; b.y = -999; } }
        else { b.t += dt; if (b.t > 30 && Math.hypot(c.x - b.hx, c.z - b.hz) > 60) reset(b); }
        x = b.x; y = b.y; z = b.z; yaw = b.yaw; }
      iPos[i * 4] = x; iPos[i * 4 + 1] = y; iPos[i * 4 + 2] = z; iPos[i * 4 + 3] = yaw; fl[i] = f; }
    ia.needsUpdate = true; fa.needsUpdate = true; });
};
/* ------------------------------------------------------------------ leaves on the wind (a box of them rides with the camera) */
LIFE.leaves = function (L, o) {
  o = o || {}; const N = o.n || 260, S = 34, off = new Float32Array(N * 4), pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { off[i * 4] = RNG() * S; off[i * 4 + 1] = RNG() * 16; off[i * 4 + 2] = RNG() * S; off[i * 4 + 3] = RNG(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aOff', new THREE.BufferAttribute(off, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const U = { uT: WORLD.TIME, uCam: { value: new THREE.Vector3() }, uPx: { value: 600 }, uFog: { value: new THREE.Color() } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: false, vertexShader: `attribute vec4 aOff; uniform float uT, uPx; uniform vec3 uCam; varying float vK; varying float vR;
      void main(){ float S = ${S.toFixed(1)}; vec3 p = aOff.xyz; p.x += uT * (1.4 + aOff.w) + sin(uT * 0.8 + aOff.w * 30.0) * 0.8; p.z += uT * 0.5 + cos(uT * 0.6 + aOff.w * 17.0) * 0.8; p.y -= uT * (0.55 + aOff.w * 0.5);
        p.xz = uCam.xz + mod(p.xz - uCam.xz + S * 0.5, S) - S * 0.5; p.y = uCam.y - 4.0 + mod(p.y - uCam.y, 16.0);
        vec4 mv = viewMatrix * vec4(p, 1.0); vK = aOff.w; vR = uT * (2.0 + aOff.w * 3.0) + aOff.w * 40.0; float edge = 1.0 - smoothstep(S * 0.34, S * 0.5, length(p.xz - uCam.xz));
        gl_PointSize = edge * clamp((0.05 + 0.04 * aOff.w) * uPx / max(1.0, -mv.z), 0.0, 9.0) * step(1.2, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uFog; varying float vK; varying float vR; void main(){ vec2 d = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); d = vec2(d.x * c - d.y * s, d.x * s + d.y * c); if (abs(d.x) * 2.6 + abs(d.y) > 0.45) discard;
        vec3 col = mix(vec3(0.3, 0.26, 0.09), vec3(0.36, 0.2, 0.06), step(0.5, vK)) * (0.7 + 0.5 * abs(c)); gl_FragColor = vec4(mix(col, uFog, 0.15), 1.0); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; LEVEL.add(pts);
  L.updates.push(() => { U.uCam.value.copy(R.camera.position); U.uPx.value = R.h / (2 * Math.tan(R.camera.fov * D2R / 2)); if (R.scene.fog) U.uFog.value.copy(R.scene.fog.color); });
};
/* ------------------------------------------------------------------ the caravan: two trolls in harness, a covered carriage, its escort */
LIFE.carriage = function () {   // merged: one mesh of timber, one of canvas, one per wheel
  const g = new THREE.Group(), S = TEX.sets, hs = S.hessian || S.planks;
  const wood = LIFE._cw || (LIFE._cw = new THREE.MeshStandardMaterial({ map: S.planks.map, normalMap: S.planks.normalMap, color: 0xf0e2cc, roughness: 0.9, envMapIntensity: 0.3 })), cloth = LIFE._cc || (LIFE._cc = new THREE.MeshStandardMaterial({ map: hs.map, normalMap: hs.normalMap, color: 0xe6dcc0, roughness: 1, side: THREE.DoubleSide, envMapIntensity: 0.2 }));
  const W = [], B = (w, h, d, x, y, z) => { const bg = new THREE.BoxGeometry(w, h, d); bg.translate(x, y, z); W.push(bg); };
  B(2.6, 0.22, 5.2, 0, 1.45, 0); B(2.6, 1.0, 0.14, 0, 2.05, -2.53); B(2.6, 1.0, 0.14, 0, 2.05, 2.53); for (const s of [-1, 1]) { B(0.14, 1.0, 5.2, s * 1.23, 2.05, 0); for (let i = 0; i < 4; i++) B(0.16, 2.3, 0.16, s * 1.23, 2.7, -2.2 + i * 1.47); }
  B(0.18, 0.18, 4.2, 0, 1.3, 4.6); B(3.4, 0.16, 0.2, 0, 1.3, 6.6); B(0.2, 0.2, 3.3, 0, 1.0, -1.6 + 1.6); for (const z of [-1.6, 1.6]) B(3.0, 0.16, 0.16, 0, 0.98, z);   // pole, yoke, perch and axles
  const body = new THREE.Mesh(ARM.merge(W), wood); body.castShadow = true; body.receiveShadow = true; g.add(body);
  { const P = [], UV = [], I = [], N = 14, M = 8; for (let j = 0; j <= M; j++) for (let i = 0; i <= N; i++) { const a = i / N * PI, z = -2.6 + j / M * 5.2; P.push(Math.cos(a) * 1.36, 2.55 + Math.sin(a) * 1.55 + Math.sin(j * 1.57) * 0.03, z); UV.push(i / N * 3, j / M * 4); } for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; I.push(a, b, c, b, d, c); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); cg.setIndex(I); cg.computeVertexNormals(); const cm = new THREE.Mesh(cg, cloth); cm.castShadow = true; g.add(cm); }
  const wg = LIFE._wg || (LIFE._wg = (() => { const Q = [], rim = new THREE.TorusGeometry(0.95, 0.09, 6, 22); rim.rotateY(HALF); Q.push(rim); for (let k = 0; k < 4; k++) { const sp = new THREE.BoxGeometry(0.08, 1.8, 0.1); sp.rotateX(k * PI / 4); Q.push(sp); } const hub = new THREE.CylinderGeometry(0.16, 0.16, 0.3, 10); hub.rotateZ(HALF); Q.push(hub); return ARM.merge(Q); })());
  const wheels = []; for (const sx of [-1, 1]) for (const sz of [-1.6, 1.6]) { const w = new THREE.Mesh(wg, wood); w.position.set(sx * 1.5, 0.98, sz); w.castShadow = true; g.add(w); wheels.push(w); }
  g.userData.wheels = wheels; return g;
};
LIFE.caravan = function (L, track, o) {
  o = o || {}; const car = LIFE.carriage(); LEVEL.add(car); const P0 = track(0), N = P0.length, C = { car, t: [], g: [], x: P0[0][0], z: P0[0][1], yaw: 0, stopped: false, pi: 3 }, T = {};
  const lane = (ln) => T[ln] || (T[ln] = track(ln)), pt = (ln, i) => lane(ln)[((i % N) + N) % N];
  const add = (type, ln, di) => { const p = pt(ln, C.pi + di - 1), e = WORLD.make(type, p[0], p[1], {}); e.lane = ln; e.di = di; e.caravan = C; if (e.D) e.D = Object.assign({}, e.D, { sight: type === 'troll' ? 7 : 13 }); return e; };
  const spawn = () => { C.pi = 3; C.stopped = false; C.t = [add('troll', -1.5, 0), add('troll', 1.5, 0)]; C.g = [add('knight', 0, 1), add('soldier', 0, -2)];
    const a = pt(0, C.pi - 2), b = pt(0, C.pi - 1); C.x = a[0]; C.z = a[1]; C.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (const e of C.t.concat(C.g)) e.yaw = C.yaw; };
  spawn(); (L.onRespawn = L.onRespawn || []).push(spawn);
  const id = L.id + ':caravan', chest = (GAME.save.items || {})[id] ? null : WORLD.interact(L, V3(0, 0, 0), 0.01, IN.keyLabel('grip') + ' SEARCH THE CARRIAGE', () => { chest.off = true; GAME.save.items = GAME.save.items || {}; GAME.save.items[id] = 1; let k = 0; for (const [it, n] of (o.give || [['rune3', 1]])) MG.after(k++ * 1.1, () => EQ.give(it, n), true); GAME.store(); });
  const lines = []; for (let i = 0; i < 2; i++) { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const ln = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x14120f })); ln.frustumCulled = false; LEVEL.add(ln); lines.push(ln); }
  L.updates.push((dt) => {
    const all = C.t.concat(C.g), Tl = C.t.filter((e) => e.alive);
    if (!C.stopped && (all.some((e) => e.alive && e.alerted) || Tl.length < 2)) { C.stopped = true; for (const e of all) { if (!e.alive) continue; e.patrol = null; e.home = [e.x, e.z]; e.homeYaw = e.yaw; if (!e.alerted && e.alert) e.alert(); } }
    if (!C.stopped) {
      let there = true;
      for (const e of all) { if (!e.alive) continue; const w = pt(e.lane, C.pi + e.di), d = Math.hypot(w[0] - e.x, w[1] - e.z);
        if (d < 0.9) { e.patrol = null; e.home = [e.x, e.z]; e.homeYaw = C.yaw; } else { e.patrol = [w]; e.pi = 0; }   // wait in place for the others
        if (e.di === 0 && d > 1.6) there = false; }
      if (there) C.pi++;
      const mx = (Tl[0].x + Tl[1].x) / 2, mz = (Tl[0].z + Tl[1].z) / 2, dx = mx - C.x, dz = mz - C.z, d = Math.hypot(dx, dz) || 1, mv = d - 7.6;
      C.yaw = dampA(C.yaw, Math.atan2(dx, dz), 2.2, dt); if (Math.abs(mv) > 0.02) { const st = clamp(mv, -2.4 * dt, 2.4 * dt); C.x += dx / d * st; C.z += dz / d * st; for (const w of car.userData.wheels) w.rotation.x += st / 0.95; }
    }
    const y = WORLD.gy(C.x, C.z), f = [Math.sin(C.yaw), Math.cos(C.yaw)]; car.position.set(C.x, y - 0.03, C.z); car.rotation.y = C.yaw;
    C.t.forEach((e, i) => { const p = lines[i].geometry.attributes.position, sd = i ? 1 : -1; if (e.alive && !C.stopped) { p.setXYZ(0, C.x + f[0] * 6.6 + f[1] * sd * 1.6, y + 1.3, C.z + f[1] * 6.6 - f[0] * sd * 1.6); p.setXYZ(1, e.x, e.y + 3.1, e.z); lines[i].visible = true; p.needsUpdate = true; } else lines[i].visible = false; });
    if (chest) { chest.p.set(C.x - f[0] * 3.3, y + 1.0, C.z - f[1] * 3.3); chest.r = C.stopped ? 3.2 : 0.01; }
    // the carriage is solid to the Tarnished
    const P = PLAYER.a; if (P && PLAYER.state !== 'ride') { const lx = (P.x - C.x) * f[1] - (P.z - C.z) * f[0], lz = (P.x - C.x) * f[0] + (P.z - C.z) * f[1]; if (Math.abs(lx) < 1.8 && Math.abs(lz) < 2.95 && P.y < y + 2.4) { const px = 1.8 - Math.abs(lx), pz = 2.95 - Math.abs(lz); if (px < pz) { const s = Math.sign(lx) || 1; P.x += f[1] * s * px; P.z -= f[0] * s * px; } else { const s = Math.sign(lz) || 1; P.x += f[0] * s * pz; P.z += f[1] * s * pz; } } }
  });
  return C;
};
/* ------------------------------------------------------------------ the country beyond the edge of the map */
WORLD.outer = function (L, G, hfn, o) {
  o = o || {}; const res = o.res || 24, Rm = o.range || 1500, x0 = -Rm, z0 = -Rm, n = Math.round(Rm * 2 / res), P = [], C = [], I = [], idx = new Int32Array((n + 1) * (n + 1)).fill(-1), col = new THREE.Color();
  const H = (x, z) => { const cx = clamp(x, G.x0, G.x1), cz = clamp(z, G.z0, G.z1), dOut = Math.hypot(x - cx, z - cz); let h = hfn(x, z); if (o.extra) h = o.extra(x, z, h);
    if (dOut > 0 && h > -20) { const m = fbm2(x * 0.0016 + 3, z * 0.0016 + 7, 4), rg = 1 - Math.abs(fbm2(x * 0.004 + 11, z * 0.004, 3) - 0.5) * 2; h += smooth(60, 420, dOut) * (m * 150 + rg * rg * 110 - 40) * (o.land ? o.land(x, z) : 1); }
    return h; };
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { let x = x0 + i * res, z = z0 + j * res, edge = false;
    if (x > G.x0 && x < G.x1 && z > G.z0 && z < G.z1) {   // inside the playable grid: the ring's inner vertices are drawn onto its boundary, the rest dropped
      const dx = Math.min(x - G.x0, G.x1 - x), dz = Math.min(z - G.z0, G.z1 - z); if (Math.min(dx, dz) > res) continue;
      if (dx <= res) x = x - G.x0 < G.x1 - x ? G.x0 : G.x1; if (dz <= res) z = z - G.z0 < G.z1 - z ? G.z0 : G.z1; edge = true; }
    const h = H(x, z) - (edge ? 0.6 : 0), e = res, sl = Math.hypot(H(x + e, z) - H(x - e, z), H(x, z + e) - H(x, z - e)) / (2 * e);
    idx[j * (n + 1) + i] = P.length / 3; P.push(x, h, z); const rock = smooth(0.3, 0.62, sl), snow = smooth(190, 260, h + fbm2(x * 0.01, z * 0.01, 2) * 40), g = fbm2(x * 0.004, z * 0.004 + 4, 2);
    col.setRGB(lerp(0.2 + g * 0.06, 0.3, rock), lerp(0.21 + g * 0.06, 0.3, rock), lerp(0.1, 0.27, rock)); if (h < -18) col.setRGB(0.16, 0.17, 0.15); col.lerp(new THREE.Color(0.62, 0.63, 0.62), snow * 0.7); C.push(col.r, col.g, col.b); }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = idx[j * (n + 1) + i], b = idx[j * (n + 1) + i + 1], c = idx[(j + 1) * (n + 1) + i + 1], d = idx[(j + 1) * (n + 1) + i]; if (a < 0 || b < 0 || c < 0 || d < 0) continue; I.push(a, d, b, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  const me = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); me.receiveShadow = false; me.castShadow = false; me.frustumCulled = false; me.userData.H = H; LEVEL.add(me); return me;
};
/* a far landmark built with the castle kit at explicit heights; an island of rock under it */
WORLD.island = function (L, cx, cz, rx, rz, top, seed) {
  const n = 40, P = [], C = [], I = [], rs = mulberry(seed || 5);
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1, v = j / n * 2 - 1, r = Math.hypot(u, v) + (fbm2(u * 2.2 + seed, v * 2.2, 3) - 0.5) * 0.5, k = 1 - smooth(0.55, 0.98, r), h = -32 + k * (top + 32) + (fbm2(u * 6 + seed, v * 6, 2) - 0.5) * 16 * k;
    P.push(cx + u * rx, h, cz + v * rz); const rock = smooth(0.2, 0.8, 1 - k) ; C.push(lerp(0.2, 0.3, rock), lerp(0.21, 0.3, rock), lerp(0.1, 0.27, rock)); }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 2, d = a + n + 1; I.push(a, d, b, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  const me = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); me.frustumCulled = false; LEVEL.add(me); void rs; return me;
};
/* a lesser Erdtree standing in the world (the same painting, small, at a place) */
WORLD.minorErdtree = function (L, x, y, z, H) {
  const U = { map: { value: WORLD.erdPaint() }, uK: { value: 0.8 } };
  const me = new THREE.Mesh(new THREE.PlaneGeometry(H, H), new THREE.ShaderMaterial({ uniforms: U, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform sampler2D map; uniform float uK; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb * vec3(1.0, 0.7, 0.3) * t.a * uK * 0.7, 1.0); }' }));
  me.position.set(x, y + H * 0.48, z); me.renderOrder = -5; LEVEL.add(me);
  L.updates.push(() => { const c = R.camera.position, d = Math.hypot(c.x - x, c.z - z); me.rotation.y = Math.atan2(c.x - x, c.z - z); U.uK.value = 0.85 * clamp(1.25 - d / 1300, 0.25, 1); });
  return me;
};
/* cloud shadows: the ground and the grass darken together under slow drifting cloud */
WORLD.CLOUD_GLSL = `float cHs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float cNs(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(cHs(i), cHs(i + vec2(1, 0)), f.x), mix(cHs(i + vec2(0, 1)), cHs(i + vec2(1, 1)), f.x), f.y); }
  float cloudShade(vec2 w, float t){ vec2 p = w * 0.0046 + t * vec2(0.012, 0.0045); p += 0.35 * sin(p.yx * 2.7 + 1.3); float n = cNs(p); return 1.07 - 0.33 * smoothstep(0.34, 0.68, n); }`;
(function () {
  const C = THREE.ShaderChunk; WORLD.CLOUD = new Float32Array([0, 0]);   // time, strength — one array shared by every material
  for (const k of ['lambert', 'standard', 'physical', 'phong']) THREE.ShaderLib[k].uniforms.uCloudT = { value: WORLD.CLOUD };
  C.fog_pars_fragment += '\n#if defined( USE_FOG ) && ( defined( LAMBERT ) || defined( STANDARD ) || defined( PHONG ) )\nuniform vec2 uCloudT;\n' + WORLD.CLOUD_GLSL + '\n#endif';
  C.fog_fragment = '#if defined( USE_FOG ) && ( defined( LAMBERT ) || defined( STANDARD ) || defined( PHONG ) )\n\tif ( uCloudT.y > 0.0 ) { vec3 cW = cameraPosition + ( vec4( vFogV, 0.0 ) * viewMatrix ).xyz; gl_FragColor.rgb *= mix( 1.0, cloudShade( cW.xz, uCloudT.x ), uCloudT.y ); }\n#endif\n' + C.fog_fragment;
  const lu = LEVEL.update; LEVEL.update = function (dt) { WORLD.TIME.value += dt; WORLD.CLOUD[0] = WORLD.TIME.value; lu(dt); };
})();
