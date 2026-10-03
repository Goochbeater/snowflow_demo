// ===================== RIGGED HUMANS =====================
// Quaternius "Universal Base Characters" bodies + hair and "Universal Animation Library" clips (CC0).
// Clothing is painted in the shader from bind-pose regions (no extra textures), so one program
// covers Quidditch kits, school uniforms, dress robes, winter coats, tracksuits and staff robes.
// Broom-riding poses are solved once at load with two-bone IK and blended per frame.
const SKIN_TONES = ['#f4d6c2', '#e8b996', '#cf9670', '#a46a45', '#71452b', '#4b2c1c'];
const HAIR_COLS = ['#15100c', '#3a2416', '#68401f', '#9c6a36', '#d6b16e', '#8a2d12', '#b9b2a8', '#23262f'];
const HAIR_STYLES = ['Hair_SimpleParted', 'Hair_Long', 'Hair_Buns', 'Hair_Buzzed', 'Hair_BuzzedFemale'];
const HAIR_FOR = { Hair_SimpleParted: 'm', Hair_Long: 'f', Hair_Buns: 'f', Hair_Buzzed: 'm', Hair_BuzzedFemale: 'f', Hair_Beard: 'm' };
const OUTFIT_ID = { kit: 0, school: 1, formal: 2, coat: 3, track: 4, staff: 5, casual: 6 };
const OUTFIT_SKIRT = { school: 'long', formal: 'long', staff: 'floor', coat: 'knee' };

// clothing thickness (metres) pushed out along the bind normal: torso+arms, legs, boots, gloves
const OUTFIT_INFL = { kit: [0.006, 0.004, 0.008, 0.003], school: [0.011, 0.004, 0.006, 0], formal: [0.01, 0.005, 0.006, 0], coat: [0.017, 0.005, 0.01, 0.004], track: [0.007, 0.005, 0.007, 0], staff: [0.012, 0.004, 0.006, 0], casual: [0.006, 0.004, 0.007, 0] };
const HUMAN_VHEAD = /* glsl */`varying vec3 vBind; uniform vec4 uJA, uJY, uJL, uInfl; uniform float uForce;`;
const HUMAN_VDISP = /* glsl */`
vBind = position;
if (uForce < 0.5) {
  float ax = abs(position.x);
  float arm = smoothstep(uJA.x - 0.035, uJA.x + 0.02, ax) * step(uJY.y - 0.2, position.y);
  float hand = arm * smoothstep(uJA.z - 0.012, uJA.z + 0.004, ax);
  float head = (1.0 - arm) * smoothstep(uJY.x - 0.03, uJY.x - 0.005, position.y) * max(1.0 - smoothstep(0.06, 0.08, ax), smoothstep(uJY.x + 0.035, uJY.x + 0.07, position.y));
  float leg = (1.0 - arm) * (1.0 - smoothstep(uJL.x - 0.01, uJL.x + 0.05, position.y));
  float boot = leg * (1.0 - smoothstep(uJL.z + 0.14, uJL.z + 0.2, position.y));
  float body = (1.0 - head) * (1.0 - hand) * (1.0 - leg);
  transformed += normal * (body * uInfl.x + leg * (1.0 - boot) * uInfl.y + boot * uInfl.z + hand * uInfl.w);
}
`;
const HUMAN_FHEAD = /* glsl */`
varying vec3 vBind;
uniform vec3 uSkin, uAvg, uC1, uC2, uC3, uC4;
uniform float uPat, uOut, uForce, uHasEmb, uHem, uHemT;
uniform vec4 uJA, uJY, uJL, uEmbP;
uniform sampler2D uEmb;
`;
const HUMAN_ALBEDO = /* glsl */`
vec3 qb = vBind; float qax = abs(qb.x);
float qShX = uJA.x, qElX = uJA.y, qWrX = uJA.z;
float qNeckY = uJY.x, qChestY = uJY.y, qWaistY = uJY.z;
float qCrY = uJL.x, qKnY = uJL.y, qAnY = uJL.z;
vec3 qTex = diffuseColor.rgb;
vec3 qSkinC = qTex * (uSkin / max(uAvg, vec3(0.02)));
float qTl = dot(qTex, vec3(0.3, 0.55, 0.15)), qAl = dot(uAvg, vec3(0.3, 0.55, 0.15));
vec3 qSkinB = mix(qSkinC, uSkin * (0.92 + 0.16 * texture2D(uNoise, vBind.xy * 4.0).r), smoothstep(0.62, 0.35, qTl / max(qAl, 0.01)));
float qArm = smoothstep(qShX - 0.035, qShX + 0.02, qax) * step(qChestY - 0.2, qb.y);
float qHand = qArm * smoothstep(qWrX - 0.012, qWrX + 0.004, qax);
float qFore = qArm * smoothstep(qElX + 0.01, qElX + 0.035, qax) * (1.0 - qHand);
float qHead = (1.0 - qArm) * smoothstep(qNeckY - 0.03, qNeckY - 0.005, qb.y) * max(1.0 - smoothstep(0.06, 0.08, qax), smoothstep(qNeckY + 0.035, qNeckY + 0.07, qb.y));
float qLeg = (1.0 - qArm) * (1.0 - smoothstep(qCrY - 0.01, qCrY + 0.05, qb.y));
float qTorso = (1.0 - qArm) * (1.0 - qHead) * (1.0 - qLeg);
float qFront = smoothstep(-0.005, 0.035, qb.z);
float qN1 = texture2D(uNoise, qb.xy * vec2(2.7, 1.9) + qb.z).r;
float qN2 = texture2D(uNoise, qb.yz * vec2(6.1, 4.3) + qb.x * 3.0).g;
vec3 qc = qSkinC; float qCloth = 0.0; float qRough = 0.7; float qMetal = 0.0; float qBumpAmp = 0.0; float qKnit = 0.0;
vec3 qLeather = vec3(0.13, 0.068, 0.032) * (0.8 + 0.4 * qN1);
vec3 qBoot = vec3(0.035, 0.024, 0.017) * (0.85 + 0.3 * qN2);
float qOpenW = 0.055 + max(0.0, qNeckY - qb.y) * 0.06;
float qOpen = qTorso * qFront * (1.0 - step(qOpenW, qax));
float qV = qNeckY - 0.085 + qax * 1.35;
float qVin = qFront * step(qV, qb.y) * (1.0 - qArm) * (1.0 - qHead);
float qVedge = qFront * (1.0 - qArm) * (1.0 - qHead) * (1.0 - smoothstep(0.004, 0.016, abs(qb.y - qV)));
if (uForce > 0.5) {
  // robe skirt shell: outer cloth, house lining on the inside, a turned hem
  qc = uC1; qCloth = 1.0; qRough = 0.88; qBumpAmp = 1.2;
  if (!gl_FrontFacing) qc = uC2 * 0.75;
  if (qb.y < uHem + 0.035) qc = mix(qc, uC2, 0.85 * uHemT);
} else if (uOut < 0.5) {
  // Quidditch kit: patterned jersey, V-neck, leather arm guards, gloves, breeches, knee pads, boots
  float qp = 0.0;
  if (uPat > 0.5 && uPat < 1.5) qp = step(0.5, fract(qb.x * 7.0 + 0.25));
  else if (uPat > 1.5 && uPat < 2.5) qp = step(0.5, fract(qb.y * 6.5));
  else if (uPat > 2.5 && uPat < 3.5) qp = step(0.0, qb.x);
  else if (uPat > 3.5) qp = 1.0 - step(0.055, abs(qb.y - qChestY - 0.02 + qb.x * 0.95));
  vec3 qJ = mix(uC1, uC2, qp);
  if (qTorso + qArm > 0.5) { qc = qJ; qCloth = 1.0; qRough = 0.8; qBumpAmp = 1.0; }
  if (qFore > 0.5) { float strap = step(0.72, fract((qax - qElX) * 26.0)); qc = mix(vec3(0.36, 0.22, 0.11) * (0.85 + 0.3 * qN2), qLeather * 0.7, strap); qRough = 0.5; qBumpAmp = 0.6; }
  float qCuff = qArm * (1.0 - qHand) * (1.0 - smoothstep(0.004, 0.012, abs(qax - (qElX + 0.03))));
  if (qCuff > 0.5) { qc = uC2; qRough = 0.6; }
  if (qHand > 0.5) { qc = qLeather * 1.25; qCloth = 1.0; qRough = 0.42; qBumpAmp = 0.4; }
  if (qVin > 0.5) { qc = qSkinB; qCloth = 0.0; qRough = 0.7; qBumpAmp = 0.0; }
  if (qVedge > 0.5) { qc = uC2; qCloth = 1.0; }
  float qBelt = qTorso * (1.0 - smoothstep(0.012, 0.022, abs(qb.y - (qCrY + 0.1))));
  if (qBelt > 0.5) { qc = qLeather * 0.8; qRough = 0.45; if (qFront > 0.5 && qax < 0.03) { qc = vec3(0.75, 0.52, 0.2); qMetal = 1.0; qRough = 0.3; } }
  if (qLeg > 0.5) {
    qc = uC3 * (0.92 + 0.12 * qN1); qCloth = 1.0; qRough = 0.86; qBumpAmp = 0.9;
    float qKnee = qFront * (1.0 - smoothstep(0.055, 0.08, abs(qb.y - qKnY)));
    if (qKnee > 0.5) { qc = qLeather; qRough = 0.5; qBumpAmp = 0.5; }
    if (qb.y < qAnY + 0.21) { qc = qBoot; qRough = 0.38; qBumpAmp = 0.3; if (qb.y > qAnY + 0.18) qc = qLeather * 0.9; if (qb.y < 0.022) qc = vec3(0.01); }
  }
  if (uHasEmb > 0.5 && qTorso > 0.5) {
    vec2 eu = vec2(qb.x - uEmbP.x, qb.y - uEmbP.y) / uEmbP.z + 0.5;
    if (eu.x > 0.0 && eu.x < 1.0 && eu.y > 0.0 && eu.y < 1.0) { vec4 e = texture2D(uEmb, eu); qc = mix(qc, e.rgb, e.a * qFront); }
  }
} else if (uOut < 1.5) {
  // Hogwarts uniform: open black robe, grey V-neck jumper with house trim, white shirt, striped tie
  if (qTorso + qArm > 0.5) { qc = uC1 * (0.9 + 0.2 * qN1); qCloth = 1.0; qRough = 0.9; qBumpAmp = 1.2; }
  if (qOpen > 0.5) {
    qc = vec3(0.17, 0.17, 0.18) * (0.9 + 0.2 * qN2); qKnit = 1.0; qBumpAmp = 1.0;
    if (qVin > 0.5) { qc = vec3(0.78, 0.78, 0.76); qKnit = 0.0; qBumpAmp = 0.4;
      if (qax < 0.022 && qb.y > qChestY - 0.12) { float st = step(0.5, fract((qb.y + qb.x) * 22.0)); qc = mix(uC2, uC4, st); qRough = 0.55; } }
    if (qVedge > 0.5) qc = uC2;
  }
  float qEdge = qTorso * qFront * (1.0 - smoothstep(0.004, 0.012, abs(qax - qOpenW)));
  if (qEdge > 0.5) qc = uC2 * 0.8;
  if (qArm > 0.5 && qax > qWrX - 0.04 && qHand < 0.5) { qc = vec3(0.78, 0.78, 0.76); qBumpAmp = 0.4; }
  if (qHand > 0.5) { qc = qSkinC; qCloth = 0.0; qBumpAmp = 0.0; qRough = 0.7; }
  if (qLeg > 0.5) { qc = vec3(0.045, 0.045, 0.05) * (0.9 + 0.2 * qN1); qCloth = 1.0; qRough = 0.85; qBumpAmp = 0.8; if (qb.y < qAnY + 0.07) { qc = vec3(0.02); qRough = 0.25; qBumpAmp = 0.1; } }
} else if (uOut < 2.5 || (uOut > 4.5 && uOut < 5.5)) {
  // dress robes / staff robes: rich cloth, metallic trim along the opening and cuffs
  if (qTorso + qArm > 0.5) { qc = uC1 * (0.88 + 0.24 * qN1); qCloth = 1.0; qRough = 0.62; qBumpAmp = 0.8; }
  float qEdge = qTorso * qFront * (1.0 - smoothstep(0.005, 0.016, abs(qax - qOpenW)));
  float qCuff = qArm * (1.0 - qHand) * (1.0 - smoothstep(0.006, 0.02, abs(qax - (qWrX - 0.04))));
  if (qEdge + qCuff > 0.5) { qc = uC2; qMetal = 0.8; qRough = 0.35; }
  if (qOpen > 0.5) { qc = uC4; qRough = 0.55; if (qVin > 0.5) { qc = vec3(0.8); } }
  if (qHand > 0.5) { qc = qSkinC; qCloth = 0.0; qBumpAmp = 0.0; qRough = 0.7; }
  if (qLeg > 0.5) { qc = uC1 * 0.45; qCloth = 1.0; qRough = 0.7; qBumpAmp = 0.6; if (qb.y < qAnY + 0.07) { qc = vec3(0.015); qRough = 0.2; } }
} else if (uOut < 3.5) {
  // winter: wool coat with brass buttons, striped scarf, knitted gloves, boots
  if (qTorso + qArm > 0.5) { qc = uC1 * (0.85 + 0.3 * qN1); qCloth = 1.0; qRough = 0.95; qBumpAmp = 1.5; }
  if (qTorso > 0.5 && qFront > 0.5 && length(vec2(qax - 0.035, (fract(qb.y * 10.0) - 0.5) / 10.0)) < 0.008 && qb.y < qChestY + 0.1 && qb.y > qCrY) { qc = vec3(0.8, 0.58, 0.25); qMetal = 1.0; qRough = 0.3; }
  float qScarf = (1.0 - qArm) * step(qNeckY - 0.06, qb.y) * step(qb.y, qNeckY + 0.05) * (1.0 - step(0.1 + max(0.0, qb.y - qNeckY) * 0.4, qax));
  float qTail = qTorso * qFront * (1.0 - step(0.04, abs(qb.x - 0.07))) * step(qChestY - 0.12, qb.y);
  if (qScarf + qTail > 0.5) { float st = step(0.5, fract(qb.y * 18.0)); qc = mix(uC2, uC4, st) * (0.85 + 0.3 * qN2); qKnit = 1.0; qBumpAmp = 1.4; qRough = 0.95; }
  if (qHand > 0.5) { qc = uC4 * 0.6; qCloth = 1.0; qKnit = 1.0; qBumpAmp = 1.2; }
  if (qLeg > 0.5) { qc = vec3(0.06, 0.055, 0.05) * (0.9 + 0.2 * qN1); qCloth = 1.0; qRough = 0.85; qBumpAmp = 0.8; if (qb.y < qAnY + 0.17) { qc = vec3(0.05, 0.03, 0.018) * (0.85 + 0.3 * qN2); qRough = 0.4; qBumpAmp = 0.3; if (qb.y > qAnY + 0.145) qc = vec3(0.32, 0.27, 0.22); if (qb.y < 0.022) qc = vec3(0.012); } }
} else {
  // tracksuit / casual: piping down the sleeves and legs, trainers
  if (qTorso + qArm > 0.5) { qc = uC1; qCloth = 1.0; qRough = 0.6; qBumpAmp = 0.5; }
  float qPipe = qArm * (1.0 - smoothstep(0.008, 0.016, abs(qb.y - (qChestY + 0.13))));
  if (qPipe > 0.5) qc = uC2;
  if (qVin > 0.5 && uOut > 5.5) { qc = qSkinB; qCloth = 0.0; qBumpAmp = 0.0; }
  if (qHand > 0.5) { qc = qSkinC; qCloth = 0.0; qBumpAmp = 0.0; qRough = 0.7; }
  if (qLeg > 0.5) {
    qc = uOut > 5.5 ? vec3(0.06, 0.08, 0.13) : uC1 * 0.9; qCloth = 1.0; qRough = 0.7; qBumpAmp = 0.6;
    float qLp = 1.0 - smoothstep(0.006, 0.014, abs(qax - 0.165));
    if (qLp > 0.5 && uOut < 5.5) qc = uC2;
    if (qb.y < qAnY + 0.07) { qc = vec3(0.75); qRough = 0.5; }
  }
}
diffuseColor.rgb = qc;
`;
const HUMAN_ROUGH = /* glsl */`roughnessFactor = mix(roughnessFactor, qRough, max(qCloth, step(0.5, qBumpAmp + qMetal)));`;
const HUMAN_NORMAL = /* glsl */`
{
  normal = normalize(mix(normal, nGeoQ, qCloth * (uForce > 0.5 ? 1.0 : 0.9)));
  if (qBumpAmp > 0.0) {
    vec3 b = vBind;
    float h = (texture2D(uNoise, b.xy * vec2(9.0, 7.0) + b.z * 3.0).r - 0.5) * 0.004;
    h += (texture2D(uNoise, b.yz * vec2(38.0, 31.0) + b.x * 9.0).b - 0.5) * 0.0018;
    float ax = abs(b.x);
    h += sin(ax * 140.0 + b.y * 30.0) * exp(-pow((ax - uJA.y) / 0.055, 2.0)) * 0.0035;
    h += sin(b.y * 120.0 + b.x * 18.0) * exp(-pow((b.y - uJL.y) / 0.07, 2.0)) * 0.003;
    h += sin(b.y * 70.0 + b.x * 26.0) * exp(-pow((b.y - uJY.z) / 0.09, 2.0)) * 0.0025;
    if (qKnit > 0.5) h += abs(sin(b.x * 420.0) * sin(b.y * 300.0)) * 0.0012;
    vec3 sp = -vViewPosition, dx = dFdx(sp), dy = dFdy(sp);
    float hx = dFdx(h), hy = dFdy(h);
    vec3 r1 = cross(dy, normal), r2 = cross(normal, dx);
    float det = dot(dx, r1);
    vec3 grad = sign(det) * (hx * r1 + hy * r2);
    normal = normalize(abs(det) * normal - grad * qBumpAmp);
  }
}
`;

const Humans = {
  ready: false, S: {}, hairSrc: {}, clips: {}, matCache: {}, hairMats: {}, poses: {},
  async load() {
    try {
      const loader = new GLTFLoader();
      const parse = k => new Promise((res, rej) => loader.parse(assetBuffer(k), '', res, rej));
      const [m, f, h] = await Promise.all([parse('human-male'), parse('human-female'), parse('human-hair')]);
      h.scene.updateMatrixWorld(true);
      h.scene.traverse(o => { if (o.isMesh) this.hairSrc[o.name] = o; });
      this.S.m = this.prep(m.scene, 'm');
      this.S.f = this.prep(f.scene, 'f');
      this.decodeClips(assetBuffer('human-anims'));
      for (const t of ['m', 'f']) this.buildHairOffsets(this.S[t]);
      this.blankTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); this.blankTex.needsUpdate = true;
      for (const t of ['m', 'f']) this.poses[t] = RidePoses.solve(t);
      this.ready = true;
    } catch (e) { console.warn('human models unavailable', e); this.ready = false; }
  },
  prep(scene, type) {
    scene.updateMatrixWorld(true);
    let body = null, eyes = null, brows = null;
    scene.traverse(o => {
      if (!o.isSkinnedMesh) return;
      const n = o.material.name || '';
      if (/Eye/.test(n)) eyes = o; else if (/Hair/.test(n)) brows = o; else body = o;
    });
    const bones = {}, idx = {};
    body.skeleton.bones.forEach((b, i) => { bones[b.name] = b; idx[b.name] = i; });
    const wp = n => bones[n].getWorldPosition(new THREE.Vector3());
    const J = {
      shX: Math.abs(wp('upperarm_l').x), elX: Math.abs(wp('lowerarm_l').x), wrX: Math.abs(wp('hand_l').x),
      neckY: wp('neck_01').y, chestY: wp('spine_03').y, waistY: wp('spine_01').y, headY: wp('Head').y,
      crY: wp('thigh_l').y, knY: wp('calf_l').y, anY: wp('foot_l').y, pelvis: wp('pelvis'),
    };
    const bm = body.material;
    const S = {
      type, scene, body, eyes, brows, bones, idx, J, names: body.skeleton.bones.map(b => b.name),
      map: bm.map, normalMap: bm.normalMap, roughMap: bm.roughnessMap,
      avg: this.texAvg(bm.map), restQ: body.skeleton.bones.map(b => b.quaternion.clone()), restP: body.skeleton.bones.map(b => b.position.clone()),
    };
    S.uJA = new THREE.Vector4(J.shX, J.elX, J.wrX, 0);
    S.uJY = new THREE.Vector4(J.neckY, J.chestY, J.waistY, 0);
    S.uJL = new THREE.Vector4(J.crY, J.knY, J.anY, J.headY);
    S.skirt = {};
    for (const len of ['knee', 'long', 'floor']) S.skirt[len] = this.skirtGeo(S, len);
    return S;
  },
  // average skin colour of the base texture (ignoring the dark underwear), in linear space
  texAvg(tex) {
    const out = new THREE.Color(0.55, 0.32, 0.22);
    try {
      const c = document.createElement('canvas'); c.width = c.height = 48;
      const g = c.getContext('2d'); g.drawImage(tex.image, 0, 0, 48, 48);
      const d = g.getImageData(0, 0, 48, 48).data; let r = 0, gg = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 765; if (l < 0.3) continue; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
      if (n) out.setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
    } catch (e) { /* keep default */ }
    return new THREE.Vector3(out.r, out.g, out.b);
  },
  // open-fronted robe shell hanging from the chest (robes) or waist (coats), skinned down the spine,
  // pelvis and thighs; each ring is fitted to the body's measured cross-section plus a margin
  skirtGeo(S, len) {
    const J = S.J, pos = S.body.geometry.attributes.position;
    const measure = y => {
      let x = 0.05, zf = 0.05, zb = -0.05;
      for (let i = 0; i < pos.count; i++) { const py = pos.getY(i); if (Math.abs(py - y) > 0.025) continue; const px = Math.abs(pos.getX(i)); if (px > J.shX - 0.02 && py > J.crY) continue; if (py < J.crY && px > 0.32) continue; x = Math.max(x, px); zf = Math.max(zf, pos.getZ(i)); zb = Math.min(zb, pos.getZ(i)); }
      return [x, zf, zb];
    };
    const top = len === 'knee' ? J.waistY + 0.06 : J.chestY - 0.03;
    const hem = len === 'knee' ? J.knY - 0.06 : len === 'long' ? J.anY + 0.14 : J.anY + 0.04;
    const R = 16, A = 32, gap = len === 'knee' ? 0.1 : 0.2;
    const P = [], UV = [], SI = [], SW = [], I = [];
    const ix = n => S.idx[n];
    let prev = null;
    for (let r = 0; r <= R; r++) {
      const t = r / R, y = lerp(top, hem, t);
      // the shell never narrows again below the hips: it drapes
      let m = y > J.crY - 0.05 ? measure(y) : prev;
      if (prev && y <= J.crY + 0.08) m = [Math.max(m[0], prev[0]), Math.max(m[1], prev[1]), Math.min(m[2], prev[2])];
      prev = m;
      const below = Math.max(0, J.crY - y), flare = below * (len === 'knee' ? 0.14 : 0.2);
      const mg = 0.028 + (y < J.crY ? 0.02 : 0);
      for (let a = 0; a <= A; a++) {
        const u = a / A, th = lerp(gap, TAU - gap, u), sx = Math.sin(th), cz = Math.cos(th);
        const fold = 1 + Math.sin(th * 9 + t * 2) * 0.03 * smoothstep(0.2, 1, t);
        const x = sx * (m[0] + mg + flare) * fold, z = (cz > 0 ? cz * (m[1] + mg + flare * 0.7) : cz * (-m[2] + mg + flare)) * fold;
        P.push(x, y, z); UV.push(u, t);
        if (y > J.chestY - 0.06) { SI.push(ix('spine_03'), ix('spine_02'), 0, 0); SW.push(0.7, 0.3, 0, 0); }
        else if (y > J.waistY) { const k = (y - J.waistY) / Math.max(0.01, J.chestY - 0.06 - J.waistY); SI.push(ix('spine_02'), ix('spine_01'), 0, 0); SW.push(k, 1 - k, 0, 0); }
        else if (y > J.crY + 0.04) { const k = (y - J.crY - 0.04) / Math.max(0.01, J.waistY - J.crY - 0.04); SI.push(ix('spine_01'), ix('pelvis'), 0, 0); SW.push(k * 0.6, 1 - k * 0.6, 0, 0); }
        else { const wl = smoothstep(0, 0.45, (J.crY + 0.04 - y)) * 0.85, side = smoothstep(-0.55, 0.55, sx); SI.push(ix('pelvis'), ix('thigh_l'), ix('thigh_r'), 0); SW.push(1 - wl, wl * side, wl * (1 - side), 0); }
      }
    }
    for (let r = 0; r < R; r++) for (let a = 0; a < A; a++) { const i0 = r * (A + 1) + a, i1 = i0 + 1, i2 = i0 + A + 1, i3 = i2 + 1; I.push(i0, i2, i1, i1, i2, i3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
    g.setIndex(I); g.computeVertexNormals();
    g.userData.hem = hem;
    return g;
  },
  // hair meshes are authored in body space at bind pose: express them relative to the head bone
  buildHairOffsets(S) {
    S.hairOff = {};
    const headW = new THREE.Matrix4();
    for (const name in this.hairSrc) {
      const owner = this.S[HAIR_FOR[name] || 'm'] || S;
      headW.copy(owner.bones.Head.matrixWorld).invert();
      const m = headW.clone().multiply(this.hairSrc[name].matrixWorld);
      // a style authored on the other body: nudge by the difference in head height
      if (owner !== S) {
        const dy = S.J.headY - owner.J.headY;
        const t = new THREE.Matrix4().makeTranslation(0, dy, 0);
        m.copy(new THREE.Matrix4().copy(S.bones.Head.matrixWorld).invert().multiply(t).multiply(this.hairSrc[name].matrixWorld));
      }
      S.hairOff[name] = m;
    }
  },
  decodeClips(buf) {
    const dv = new DataView(buf), hl = dv.getUint32(0, true);
    const H = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
    let base = 4 + hl; base += (4 - (base % 4)) % 4;
    for (const c of H.clips) {
      const times = new Float32Array(c.n); for (let i = 0; i < c.n; i++) times[i] = Math.min(c.dur, i / H.fps);
      const tracks = [];
      for (const t of c.tracks) {
        const tm = t.m === 1 ? [0] : times;
        if (t.p === 'q') {
          const q = new Int16Array(buf, base + t.o, t.m * 4), v = new Float32Array(t.m * 4);
          for (let i = 0; i < v.length; i++) v[i] = q[i] / 32767;
          tracks.push(new THREE.QuaternionKeyframeTrack(t.b + '.quaternion', tm, v));
        } else tracks.push(new THREE.VectorKeyframeTrack(t.b + '.position', tm, new Float32Array(buf, base + t.o, t.m * 3).slice()));
      }
      this.clips[c.key] = new THREE.AnimationClip(c.key, c.dur, tracks);
    }
  },
  clothMat(o, S, skirt) {
    const key = [S.type, o.outfit, o.c1, o.c2, o.c3, o.c4, o.skin, o.pattern, o.emblemKey || '', skirt ? 'S' + skirt : ''].join('|');
    if (this.matCache[key]) return this.matCache[key];
    const lc = h => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); };
    const sk = new THREE.Color(SKIN_TONES[o.skin] || SKIN_TONES[1]);
    const U = {
      uSkin: { value: new THREE.Vector3(sk.r, sk.g, sk.b) }, uAvg: { value: S.avg },
      uC1: { value: lc(o.c1) }, uC2: { value: lc(o.c2) }, uC3: { value: lc(o.c3) }, uC4: { value: lc(o.c4) },
      uPat: { value: o.pattern || 0 }, uOut: { value: OUTFIT_ID[o.outfit] || 0 }, uForce: { value: skirt ? 1 : 0 }, uHem: { value: skirt ? S.skirt[skirt].userData.hem : 0 }, uHemT: { value: skirt && (o.outfit === 'formal' || o.outfit === 'staff') ? 1 : 0 },
      uJA: { value: S.uJA }, uJY: { value: S.uJY }, uJL: { value: S.uJL },
      uEmb: { value: o.emblem || this.blankTex }, uHasEmb: { value: o.emblem ? 1 : 0 },
      uEmbP: { value: new THREE.Vector4(0.1, S.J.chestY + 0.05, 0.13, 0) },
      uInfl: { value: new THREE.Vector4(...(OUTFIT_INFL[o.outfit] || OUTFIT_INFL.kit)) },
    };
    const mat = new THREE.MeshStandardMaterial({ map: S.map, normalMap: skirt ? null : S.normalMap, roughnessMap: skirt ? null : S.roughMap, roughness: skirt ? 0.88 : 1, metalness: 0, side: skirt ? THREE.DoubleSide : THREE.FrontSide });
    patchMaterial(mat, { key: 'human' + (skirt ? 'S' : ''), uniforms: U, vHead: HUMAN_VHEAD, vDisp: HUMAN_VDISP, fHead: HUMAN_FHEAD, albedo: HUMAN_ALBEDO, rough: HUMAN_ROUGH });
    const ob = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      ob(sh, r);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nvec3 nGeoQ = normal;')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + HUMAN_NORMAL)
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = qMetal;');
    };
    this.matCache[key] = mat;
    return mat;
  },
  hairMat(src, col) {
    const key = src.uuid + col;
    if (this.hairMats[key]) return this.hairMats[key];
    const m = stdMat({ map: src.map, normalMap: src.normalMap, color: new THREE.Color(col).multiplyScalar(1.6), roughness: 0.48, metalness: 0, side: THREE.DoubleSide }, { key: 'hair' });
    this.hairMats[key] = m; return m;
  },
  eyeMat(src) {
    if (this._eye) return this._eye;
    return (this._eye = stdMat({ map: src.map, normalMap: src.normalMap, roughness: 0.12, metalness: 0 }, { key: 'eye' }));
  },
  // deterministic look for an NPC from a seed
  look(seed, body) {
    const r = mulberry32(seed * 7919 + 13);
    const b = body || (r() < 0.5 ? 'm' : 'f');
    const styles = b === 'm' ? [0, 0, 3, 3, 1] : [1, 1, 2, 4, 0];
    return { body: b, skin: Math.floor(r() * SKIN_TONES.length), hair: styles[Math.floor(r() * styles.length)], hairCol: HAIR_COLS[Math.floor(r() * HAIR_COLS.length)], beard: b === 'm' && r() < 0.18 };
  },
};

class Human {
  constructor(opts = {}) {
    const o = this.o = Object.assign({ body: 'm', skin: 1, hair: 0, hairCol: HAIR_COLS[1], beard: false, outfit: 'kit', c1: '#7a1010', c2: '#d4a02a', c3: '#d9d2c3', c4: '#f2f2f2', pattern: 0, emblem: null, emblemKey: '', scale: 1 }, opts);
    const S = this.S = Humans.S[o.body] || Humans.S.m;
    this.root = SkeletonUtils.clone(S.scene);
    this.bones = {}; this.meshes = [];
    this.root.traverse(n => {
      if (n.isBone) this.bones[n.name] = n;
      if (n.isSkinnedMesh) { this.meshes.push(n); n.castShadow = true; n.receiveShadow = true; n.frustumCulled = false; }
    });
    this.body = this.meshes.find(m => m.name === S.body.name) || this.meshes[0];
    this.skeleton = this.body.skeleton;
    this.list = this.skeleton.bones;
    this.body.material = Humans.clothMat(o, S, null);
    for (const m of this.meshes) {
      if (m === this.body) continue;
      if (S.eyes && m.name === S.eyes.name) { m.material = Humans.eyeMat(S.eyes.material); m.castShadow = false; }
      else m.material = Humans.hairMat(m.material, o.hairCol);
    }
    const head = this.bones.Head;
    const addHair = name => {
      const src = Humans.hairSrc[name]; if (!src) return;
      const h = new THREE.Mesh(src.geometry, Humans.hairMat(src.material, o.hairCol));
      S.hairOff[name].decompose(h.position, h.quaternion, h.scale);
      h.castShadow = true; h.receiveShadow = true;
      head.add(h); this.hairMesh = h;
    };
    if (o.hair >= 0 && HAIR_STYLES[o.hair]) addHair(HAIR_STYLES[o.hair]);
    if (o.beard) addHair('Hair_Beard');
    const sl = o.skirt !== undefined ? o.skirt : OUTFIT_SKIRT[o.outfit];
    if (sl) {
      const sk = new THREE.SkinnedMesh(S.skirt[sl], Humans.clothMat(o, S, sl));
      sk.castShadow = true; sk.receiveShadow = true; sk.frustumCulled = false;
      this.body.parent.add(sk); sk.bind(this.skeleton, this.body.bindMatrix);
      this.skirt = sk;
    }
    this.root.scale.setScalar(o.scale);
    this.mixer = null; this.action = null; this.cur = '';
  }
  setVisible(v) { this.root.visible = v; }
  // ---- animation clips ----
  play(key, { fade = 0.35, loop = true, speed = 1, at = null } = {}) {
    const clip = Humans.clips[key]; if (!clip) return null;
    if (!this.mixer) this.mixer = new THREE.AnimationMixer(this.root);
    const a = this.mixer.clipAction(clip);
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !loop; a.timeScale = speed;
    if (this.action === a) { if (!loop) a.reset(); return a; }
    a.reset(); if (at !== null) a.time = at * clip.duration; else if (loop) a.time = Math.random() * clip.duration;
    a.play();
    if (this.action && fade > 0) this.action.crossFadeTo(a, fade, false); else if (this.action) this.action.stop();
    this.action = a; this.cur = key;
    return a;
  }
  update(dt) { if (this.mixer) this.mixer.update(dt); }
  // ---- direct pose (array of local quaternions + pelvis position) ----
  applyPose(q, pelvisPos) {
    const L = this.list;
    for (let i = 0; i < L.length; i++) L[i].quaternion.fromArray(q, i * 4);
    if (pelvisPos) this.bones.pelvis.position.copy(pelvisPos);
  }
  attach(boneName, obj) { (this.bones[boneName] || this.root).add(obj); return obj; }
  worldPos(boneName, out) { return this.bones[boneName].getWorldPosition(out); }
  dispose() { if (this.mixer) this.mixer.stopAllAction(); this.root.removeFromParent(); }
}

// ===================== BROOM RIDING POSES (solved once with IK, blended per frame) =====================
// Flyer space: forward -Z, up +Y, right +X; the broom handle runs along the Z axis at y = 0.
const RIDE = {
  seat: V(0, 0.12, 0.3),
  gripL: V(0.0, 0.0, -0.62), gripR: V(0.0, 0.0, -0.47),
  stirL: V(-0.16, -0.3, 0.42), stirR: V(0.16, -0.3, 0.42),
  ball: V(0.36, 0.42, -0.35),
};
const RidePoses = {
  T: null,
  solve(type) {
    const T = new Human({ body: type, outfit: 'kit', hair: -1 });
    const S = T.S, root = T.root;
    root.rotation.set(0, Math.PI, 0); root.updateMatrixWorld(true);
    const B = T.bones, n = T.list.length;
    const reset = () => { T.list.forEach((b, i) => { b.quaternion.copy(S.restQ[i]); b.position.copy(S.restP[i]); }); root.updateMatrixWorld(true); };
    const wq = b => b.getWorldQuaternion(new THREE.Quaternion());
    const wp = b => b.getWorldPosition(new THREE.Vector3());
    const setWQ = (b, q) => { const pq = b.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); b.quaternion.copy(pq.multiply(q)); b.updateMatrixWorld(true); };
    const rotW = (b, axis, ang) => setWQ(b, new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(wq(b)));
    const aim = (b, c, dir) => { const d0 = wp(c).sub(wp(b)).normalize(); setWQ(b, new THREE.Quaternion().setFromUnitVectors(d0, dir.clone().normalize()).multiply(wq(b))); };
    const ik = (a, b, c, target, pole) => {
      const A = wp(a), l1 = wp(b).distanceTo(A), l2 = wp(c).distanceTo(wp(b));
      const d = target.clone().sub(A), dist = clamp(d.length(), 0.05, (l1 + l2) * 0.999); d.normalize();
      const cosA = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
      const pp = pole.clone().sub(d.clone().multiplyScalar(pole.dot(d))).normalize();
      const elbow = A.clone().addScaledVector(d, l1 * cosA).addScaledVector(pp, l1 * sinA);
      aim(a, b, elbow.clone().sub(A));
      aim(b, c, A.clone().addScaledVector(d, dist).sub(elbow));
    };
    // rest-pose hand frames (fingers along +-X, palms down) for orienting hands
    reset();
    const handRef = {};
    for (const s of ['l', 'r']) {
      const h = B['hand_' + s], f = wp(B['middle_01_' + s]).sub(wp(h)).normalize();
      const side = wp(B['index_01_' + s]).sub(wp(B['pinky_01_' + s])).normalize();
      let palm = new THREE.Vector3().crossVectors(f, side).normalize(); if (palm.y > 0) palm.negate();
      handRef[s] = { q: wq(h), f, palm };
    }
    const setHand = (s, fDir, palmDir) => {
      const R = handRef[s];
      const basis = (f, p) => { const ff = f.clone().normalize(), pp = p.clone().sub(ff.clone().multiplyScalar(p.dot(ff))).normalize(); return new THREE.Matrix4().makeBasis(ff, pp, new THREE.Vector3().crossVectors(ff, pp)); };
      const Mb = basis(R.f, R.palm), Mt = basis(fDir, palmDir);
      const rot = new THREE.Quaternion().setFromRotationMatrix(Mt.multiply(Mb.transpose()));
      setWQ(B['hand_' + s], rot.multiply(R.q.clone()));
    };
    // finger curl axes measured at rest so a single angle closes each joint toward the palm
    const FING = ['index', 'middle', 'ring', 'pinky'];
    const curlAxis = {};
    for (const s of ['l', 'r']) {
      const side = wp(B['index_01_' + s]).sub(wp(B['pinky_01_' + s])).normalize();
      for (const fn of [...FING, 'thumb']) for (const k of ['01', '02', '03']) {
        const bn = `${fn}_${k}_${s}`, b = B[bn]; if (!b) continue;
        let ax = fn === 'thumb' ? handRef[s].f.clone().multiplyScalar(-1).add(handRef[s].palm.clone().multiplyScalar(0.4)).normalize() : side.clone();
        const tip = B[`${fn}_04_leaf_${s}`] || B[`${fn}_03_${s}`];
        const t0 = wp(tip), q0 = b.quaternion.clone();
        const axl = ax.clone().applyQuaternion(wq(b).invert());
        b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axl, 0.4)); b.updateMatrixWorld(true);
        const moved = wp(tip).sub(t0);
        b.quaternion.copy(q0); b.updateMatrixWorld(true);
        if (moved.dot(handRef[s].palm) < 0) axl.negate();
        curlAxis[bn] = axl;
      }
    }
    const curl = (s, amt, thumb = 0.6) => {
      for (const fn of [...FING, 'thumb']) ['01', '02', '03'].forEach((k, j) => {
        const bn = `${fn}_${k}_${s}`, b = B[bn]; if (!b || !curlAxis[bn]) return;
        const a = fn === 'thumb' ? thumb * [0.35, 0.55, 0.5][j] : amt * [1.05, 1.35, 0.95][j];
        b.quaternion.copy(S.restQ[S.idx[bn]]).multiply(new THREE.Quaternion().setFromAxisAngle(curlAxis[bn], a));
      });
      root.updateMatrixWorld(true);
    };
    const X = V(1, 0, 0), Y = V(0, 1, 0);
    const out = {};
    const body = (lean, tuck) => {
      reset();
      const pel = B.pelvis;
      rotW(pel, X, -0.34 - tuck * 0.12);
      // seat the pelvis on the handle
      pel.position.copy(pel.parent.worldToLocal(RIDE.seat.clone())); root.updateMatrixWorld(true);
      rotW(B.spine_01, X, -lean * 0.26); rotW(B.spine_02, X, -lean * 0.22); rotW(B.spine_03, X, -lean * 0.15);
      // keep the head level, eyes forward
      rotW(B.neck_01, X, lean * 0.4);
      const hq = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI).premultiply(new THREE.Quaternion().setFromAxisAngle(X, 0.05 + tuck * 0.05));
      setWQ(B.Head, hq);
      // legs astride, knees forward, feet back in the stirrups
      for (const s of ['l', 'r']) {
        const sg = s === 'l' ? -1 : 1;
        ik(B['thigh_' + s], B['calf_' + s], B['foot_' + s], s === 'l' ? RIDE.stirL : RIDE.stirR, V(sg * 0.45, -0.15, -1));
        aim(B['foot_' + s], B['ball_' + s], V(sg * 0.12, -0.55, -0.82));
      }
      // clavicles reach slightly forward
      for (const s of ['l', 'r']) rotW(B['clavicle_' + s], Y, (s === 'l' ? -1 : 1) * 0.12);
    };
    const resetArm = s => { for (const bn of ['upperarm_', 'lowerarm_', 'hand_']) { const b = B[bn + s]; b.quaternion.copy(S.restQ[S.idx[bn + s]]); } root.updateMatrixWorld(true); };
    const armOnBroom = (s, grip) => {
      const sg = s === 'l' ? -1 : 1;
      const wrist = grip.clone().add(V(sg * 0.07, 0.05, 0.04));
      resetArm(s);
      ik(B['upperarm_' + s], B['lowerarm_' + s], B['hand_' + s], wrist, V(sg * 0.8, -0.45, 0.25));
      setHand(s, V(-sg * 0.75, -0.62, -0.18), V(-sg * 0.55, -0.83, 0));
      curl(s, 1.05, 0.9);
    };
    const armTo = (s, wrist, fDir, palm, pole, curlAmt = 0.5, thumb = 0.5) => {
      resetArm(s);
      ik(B['upperarm_' + s], B['lowerarm_' + s], B['hand_' + s], wrist, pole);
      setHand(s, fDir, palm); curl(s, curlAmt, thumb);
    };
    const snap = () => {
      const q = new Float32Array(n * 4); T.list.forEach((b, i) => b.quaternion.toArray(q, i * 4));
      return { q, pelvis: B.pelvis.position.clone(), neckW: wq(B.neck_01), headW: wq(B.Head) };
    };
    // base riding poses per role
    body(1.0, 0); armOnBroom('l', RIDE.gripL); armOnBroom('r', RIDE.gripR); out.ride = snap();
    out.pins = this.capePins(T, B, wp);
    body(1.25, 1); armOnBroom('l', RIDE.gripL); armOnBroom('r', RIDE.gripR); out.tuck = snap();
    // right-arm overlays (all keep the left hand on the broom)
    body(1.0, 0); armOnBroom('l', RIDE.gripL);
    armTo('r', RIDE.ball.clone().add(V(-0.04, -0.1, 0.07)), V(-0.1, 0.55, -0.83), V(0.1, 0.85, 0.5), V(0.9, -0.4, 0.4), 0.55, 0.6); out.hold = snap();
    armTo('r', V(0.16, 0.34, -0.9), V(0.05, -0.15, -1), V(0, -1, 0), V(0.8, -0.6, 0.1), 0.25, 0.3); out.throw = snap();
    armTo('r', V(0.14, 0.5, -0.92), V(0, 0.2, -1), V(0, -0.6, -0.4), V(0.8, -0.5, 0), 0.15, 0.2); out.reach = snap();
    // right fist around a bat: knuckle line (pinky->index) runs along the bat, palm = bat x fingers
    const armBat = (wrist, bat, fHint, pole) => {
      const b = bat.clone().normalize(), f = fHint.clone().sub(b.clone().multiplyScalar(fHint.dot(b))).normalize();
      armTo('r', wrist, f, new THREE.Vector3().crossVectors(b, f), pole, 1.2, 1.0);
    };
    armBat(V(0.3, 0.36, -0.2), V(0.25, 0.55, 0.8), V(0, -0.3, -1), V(1, -0.5, 0.3)); out.batRest = snap();
    armBat(V(0.34, 0.6, 0.08), V(0.1, 0.8, 0.6), V(0.3, 0, -1), V(1, -0.2, 0.5)); out.batUp = snap();
    armBat(V(-0.1, 0.34, -0.62), V(-0.75, 0.05, -0.65), V(0, -1, 0.2), V(0.9, -0.3, -0.2)); out.batHit = snap();
    // keeper block: both arms wide
    body(0.8, 0);
    armTo('l', V(-0.75, 0.62, -0.18), V(-0.6, 0.6, -0.5), V(0, 0, -1), V(-0.6, -0.8, 0.3), 0.2, 0.3);
    armTo('r', V(0.75, 0.62, -0.18), V(0.6, 0.6, -0.5), V(0, 0, -1), V(0.6, -0.8, 0.3), 0.2, 0.3); out.block = snap();
    // arm masks for overlays
    const isR = nm => /_(r)$/.test(nm) && /(clavicle|upperarm|lowerarm|hand|index|middle|ring|pinky|thumb)/.test(nm);
    const isArm = nm => /_(l|r)$/.test(nm) && /(clavicle|upperarm|lowerarm|hand|index|middle|ring|pinky|thumb)/.test(nm);
    out.maskR = []; out.maskArms = [];
    T.list.forEach((b, i) => { if (isR(b.name)) out.maskR.push(i); if (isArm(b.name)) out.maskArms.push(i); });
    out.headIdx = T.list.indexOf(B.Head);
    T.dispose();
    return out;
  },
  // cape attachment: an arc across the upper back plus collision proxies, in flyer space
  capePins(T, B, wp) {
    const L = wp(B.upperarm_l), R = wp(B.upperarm_r), s1 = wp(B.spine_01), nk = wp(B.neck_01);
    const spine = nk.clone().sub(s1).normalize(), back = new THREE.Vector3().crossVectors(V(1, 0, 0), spine).normalize();
    const pins = [];
    for (let i = 0; i < ROBE_W; i++) {
      const u = i / (ROBE_W - 1), a = lerp(-Math.PI / 2 * 0.92, Math.PI / 2 * 0.92, u);
      const p = L.clone().lerp(R, u).lerp(nk, 0.25).addScaledVector(back, 0.09 + Math.cos(a) * 0.06).addScaledVector(spine, -0.04 - Math.abs(Math.sin(a)) * 0.03);
      pins.push(p);
    }
    return { pins, colA: s1.clone().addScaledVector(back, -0.02), colB: nk.clone().addScaledVector(spine, -0.05), hip: wp(B.pelvis).add(V(0, -0.02, 0.04)) };
  },
};

// per-frame rider animation: blend base + overlays, then a head look toward the play
const _rq = new Float32Array(65 * 4), _rq2 = new Float32Array(4);
function blendInto(dst, src, idx, w) {
  if (w <= 0.001) return;
  for (const i of idx) THREE.Quaternion.slerpFlat(dst, i * 4, dst, i * 4, src, i * 4, w);
}
const RiderAnim = {
  frame: 0,
  update(f, dt) {
    const h = f.mesh.userData.human; if (!h || !f.mesh.visible) return;
    const P = Humans.poses[h.o.body]; if (!P) return;
    const d = f.pos.distanceTo(Render.camera.position);
    const every = d < 45 ? 1 : d < 110 ? 2 : 4;
    const st = h.rs || (h.rs = { hold: 0, thr: 0, reach: 0, bat: 0, hit: 0, block: 0, tuck: 0, ly: 0, lp: 0, acc: 0 });
    st.acc += dt;
    if ((this.frame + f.id) % every) return;
    const k = 1 - Math.exp(-10 * st.acc), G = Game, Q = G.quaffle; st.acc = 0;
    const throwing = Q.thrower === f && G.time - Q.throwT < 0.4;
    st.thr = lerp(st.thr, throwing ? 1 : 0, throwing ? Math.min(1, k * 2) : k * 0.6);
    st.hold = lerp(st.hold, f.hasBall && !throwing ? 1 : 0, k);
    st.tuck = lerp(st.tuck, clamp((f.speed - CONFIG.flight.cruise) / 12, 0, 1), k * 0.5);
    const reach = f.role === 'seeker' && G.snitch.active && G.snitch.pos.distanceTo(f.pos) < 6;
    st.reach = lerp(st.reach, reach ? 1 : 0, k);
    if (f.role === 'beater') {
      const wind = f.ai.swing > 0, follow = G.time - (f.swungT || -9) < 0.35;
      st.hit = lerp(st.hit, follow ? 1 : 0, follow ? Math.min(1, k * 2.5) : k * 0.5);
      st.bat = lerp(st.bat, wind ? 1 : 0, wind ? Math.min(1, k * 1.6) : k * 0.5);
    }
    if (f.role === 'keeper') { const inc = Q.state === 'flying' && Q.thrower && Q.thrower.side !== f.side && Q.pos.distanceTo(f.pos) < 22; st.block = lerp(st.block, inc ? 1 : 0, k * 1.5); }
    // base
    const base = st.tuck > 0.02 ? P.tuck : P.ride;
    _rq.set(P.ride.q);
    if (st.tuck > 0.02) { for (let i = 0; i < _rq.length; i += 4) THREE.Quaternion.slerpFlat(_rq, i, _rq, i, P.tuck.q, i, st.tuck); }
    if (f.role === 'beater') { blendInto(_rq, P.batRest.q, P.maskR, 1); blendInto(_rq, P.batUp.q, P.maskR, st.bat); blendInto(_rq, P.batHit.q, P.maskR, st.hit); }
    else { blendInto(_rq, P.hold.q, P.maskR, st.hold); blendInto(_rq, P.reach.q, P.maskR, st.reach); }
    blendInto(_rq, P.throw.q, P.maskR, st.thr);
    if (f.role === 'keeper') blendInto(_rq, P.block.q, P.maskArms, st.block);
    h.applyPose(_rq, base.pelvis);
    // head look: toward the Quaffle (or Snitch for Seekers), clamped
    const tgt = f.role === 'seeker' && G.snitch.active ? G.snitch.pos : f.hasBall ? null : Q.pos;
    let ly = 0, lp = 0;
    if (tgt && d < 90) {
      _v1.copy(tgt).sub(f.pos).applyQuaternion(_q1.copy(f.quat).invert());
      ly = clamp(Math.atan2(-_v1.x, -_v1.z), -1.1, 1.1); lp = clamp(Math.atan2(_v1.y, Math.hypot(_v1.x, _v1.z)), -0.6, 0.5);
    }
    st.ly = lerp(st.ly, ly, k * 0.5); st.lp = lerp(st.lp, lp, k * 0.5);
    if (Math.abs(st.ly) + Math.abs(st.lp) > 0.01) {
      const hb = h.bones.Head;
      _q1.setFromAxisAngle(UP, st.ly); _q2.setFromAxisAngle(_v2.set(1, 0, 0), st.lp); _q1.multiply(_q2);
      // head world (flyer space) = look * restHeadW; local = neckW^-1 * that
      _q2.copy(base.headW).premultiply(_q1);
      hb.quaternion.copy(base.neckW).invert().multiply(_q2);
    }
  },
};

// ===================== KITS: team colours -> clothing parameters =====================
const Kits = {
  tex: {},
  of(team) {
    const T = CONFIG.teams[team];
    return { c1: T.c1, c2: T.c2, c3: T.c3 || '#d8d0bf', c4: T.c4 || T.c2, pattern: T.pattern || 0, emblem: this.emblem(team), emblemKey: 'e' + team, body: T.body };
  },
  emblem(team) {
    if (!this.tex[team]) { const t = canvasTex(128, 128, g => drawCrest(g, team, 64, 64, 96, 116, Tex.font)); t.anisotropy = 2; this.tex[team] = t; }
    return this.tex[team];
  },
};
