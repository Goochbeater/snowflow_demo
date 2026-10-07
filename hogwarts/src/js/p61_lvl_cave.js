/* ==== p61_lvl_cave.js ==== */
/* GROVESIDE CAVE — a wolf den under the western scarp of Limgrave, and the Beastman that rules it. */
const CAVE = {};
CAVE.PATH = [[0, -6], [2, 22], [-14, 44], [-10, 70], [10, 88], [6, 112], [0, 150]];
CAVE.d = function (x, z) { const P = CAVE.PATH; let bd = 1e9; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); bd = Math.min(bd, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return bd; };
CAVE.w = function (x, z) {   // signed distance to the cave walls (negative inside): the passage, a side den, the great chamber
  const n = (fbm2(x * 0.11 + 3, z * 0.11, 3) - 0.5) * 3.4;
  return Math.min(CAVE.d(x, z) - 4.6 - smooth(-6, 4, -Math.abs(z - 44)) * 0, Math.hypot(x + 30, z - 60) - 9, Math.hypot(x, z - 150) - 19, Math.hypot(x + 20, z - 58) - 7) + n;
};
CAVE.h = function (x, z) { const w = CAVE.w(x, z), fl = 0.5 * (fbm2(x * 0.09, z * 0.09, 2) - 0.5) + smooth(60, 120, z) * -2.5; return fl + smooth(0, 5.5, w) * 15 + (w > 0 ? Math.min(6, w * 0.6) : 0); };
CAVE.c = function (x, z) { const w = CAVE.w(x, z), big = 1 - smooth(14, 22, Math.hypot(x, z - 150)), fl = CAVE.h(x, z); return fl + Math.max(0.2, (4.2 + big * 6.5 + 1.4 * (fbm2(x * 0.16 + 9, z * 0.16, 3) - 0.5) * 2) * smooth(0.6, -3.2, w)); };
LEVEL.def('cave', {
  get photo() { return AST.BASE_SETS; },
  chapter: 'LIMGRAVE', name: 'GROVESIDE CAVE', region: 'LIMGRAVE', world: 'cave', mount: false, cast: ['beastman'],
  tex: ['grass', 'dirt', 'cliff', 'ashlar', 'flag', 'planks', 'steel', 'gold'],
  start: [0, null, -2, 0], checkpoints: [[0, null, -2, 0], [0, null, 118, 0]], killY: -30,
  async build(L) {
    R.scene.background = new THREE.Color(0x010101);
    R.setSun(new THREE.Vector3(0.2, 1, 0.1), 0x6a7a9a, 0.0, 0x8696b8, 0x4a4238, 1.5);
    R.setLightCount(R.NL);
    R.G.exposure = 1.45; R.G.bloom = 0.3; R.G.bloomThr = 0.9; R.G.sat = 1.0; R.G.contrast = 1.08; R.G.vig = 0.5; R.G.ca = 0.12; R.G.vol = 0; R.G.ao = 1.0;
    CM.fillU.value.setRGB(0.2, 0.2, 0.22); CM.rimU.value.setRGB(0.3, 0.32, 0.4);
    R.scene.fog = new THREE.FogExp2(new THREE.Color(0.01, 0.012, 0.016), 0.022);
    const mat = TERRAIN.limMat('cave', { tintA: 0x505040, tintB: 0x605848, rockTint: 0x8a8478, dirtTint: 0x6a5e50 });
    const G = await TERRAIN.grid(CAVE.h, -52, -22, 40, 180, 1, mat, { paint: (x, z) => [1, smooth(-1.5, 1.5, CAVE.w(x, z)), 0], chunk: 48, progress: (p) => MG.loadUI(0.56 + p * 0.3, 'Descending') });
    TERRAIN.ceiling(G, CAVE.c, mat);
    L.G = G; const rs = MG.rs('cave'), rock = TERRAIN.cliffMat(0x8a8478), gy = WORLD.gy;
    const env = new THREE.Scene(); env.background = new THREE.Color(0.012, 0.012, 0.015); L.env = env;
    for (let i = 0; i < 46; i++) { const z = -4 + rs() * 170, x = -44 + rs() * 76; const w = CAVE.w(x, z); if (w > -1.2 || w < -6) continue; const r = 0.4 + rs() * 1.2; TERRAIN.rock(x, z, r, r * (0.8 + rs() * 2.2), i * 31 + 5, rock, { detail: 2, col: r > 0.9 }); }
    // stalagmites and the roots of the scarp
    for (let i = 0; i < 30; i++) { const z = rs() * 160, x = -44 + rs() * 76; if (CAVE.w(x, z) > -1 || CAVE.w(x, z) < -5) continue; const y = gy(x, z), h = 1 + rs() * 2.6; KIT.geo(new THREE.ConeGeometry(0.22 + rs() * 0.3, h, 7), rock, new THREE.Matrix4().makeTranslation(x, y + h / 2 - 0.1, z), { worldUV: true }); PHY.cyl(x, z, 0.25, y, y + h * 0.6); }
    // torches left by those who came before; pale glowing fungus
    for (const [x, z] of [[3.5, 4], [-2.5, 26], [-17.5, 46], [-6.5, 72], [13, 90], [2.5, 116]]) { const y = gy(x, z); WORLD.torch(L, x, y + 1.7, z, 0); }
    for (let i = 0; i < 26; i++) { const z = rs() * 165, x = -46 + rs() * 80; const w = CAVE.w(x, z); if (w > -0.3 || w < -3.5) continue; const y = gy(x, z), c = rs() < 0.5 ? 0x7af0d0 : 0x9ac8ff;
      for (let k = 0; k < 3; k++) KIT.geo(new THREE.SphereGeometry(0.07 + rs() * 0.09, 8, 6), KIT.emis(c, 1.6), new THREE.Matrix4().makeTranslation(x + rnd(-0.3, 0.3), y + 0.08 + rs() * 0.2, z + rnd(-0.3, 0.3)));
      if (i % 3 === 0) R.addLight({ pos: new THREE.Vector3(x, y + 0.5, z), col: new THREE.Color(c), i: 5, range: 8, prio: 0.6, on: true }); }
    // bones in the den
    for (let i = 0; i < 16; i++) { const a = rs() * TAU, r = rs() * 6, x = -30 + Math.cos(a) * r, z = 60 + Math.sin(a) * r; KIT.rbox(x, gy(x, z) + 0.05, z, 0.3 + rs() * 0.3, 0.03, 0.03, 0, rs() * PI, 0, ARM.mat('bone'), 0.01); }
    // the way out
    WORLD.interact(L, V3(0, gy(0, -6) + 1.2, -6), 3.4, IN.keyLabel('grip') + ' RETURN TO LIMGRAVE', () => GAME.travel('limgrave', 4));
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending, vertexShader: 'varying vec2 vP; void main(){ vP = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vP; void main(){ float r = length(vP * vec2(1.0, 1.15)); float k = exp(-r * r * 5.0) * 1.5 + exp(-r * r * 1.6) * 0.35; gl_FragColor = vec4(vec3(1.0, 0.92, 0.72) * k * (1.0 - smoothstep(0.85, 1.0, r)), 1.0); }' })); hole.position.set(0, gy(0, -8) + 1.9, -9.4); LEVEL.add(hole);   // daylight at the mouth: a soft glare, not a disc
    R.addLight({ pos: new THREE.Vector3(0, gy(0, -6) + 2, -6), col: new THREE.Color(1.0, 0.9, 0.7), i: 18, range: 16, prio: 1, on: true });
    WORLD.grace(L, 1, 6, 121, 'GROVESIDE CAVE', null);
    // the Tarnished carries a lantern at the hip
    const lamp = R.addLight({ pos: new THREE.Vector3(), col: new THREE.Color(1.0, 0.84, 0.64), i: 9, range: 20, prio: 3, on: true });
    for (const q of R.lightSrc) if (!q.persist) { q.i *= 6; q.range *= 1.3; } L.lightK = 6;
    L.updates.push(() => { const a = PLAYER.a; if (a) lamp.pos.set(a.x + Math.sin(a.yaw) * 0.4, a.y + 1.3, a.z + Math.cos(a.yaw) * 0.4); });
  },
  onStart(L, cp) {
    if (MG.titleMode) return;
    HUD.area('GROVESIDE CAVE'); HUD.obj('');
    const sp = WORLD.spawn;
    for (const [x, z] of [[2, 30], [-12, 46], [-28, 58], [-32, 62], [-26, 64], [-8, 74], [9, 92]]) sp('wolf', x, z, { yaw: rnd(0, TAU) });
    WORLD.item(L, -33, 57, { name: 'Golden Rune [2]', runes: 400 });
    WORLD.arena(L, 'beastman', 'beastman', [0, 154, PI], [3.6, 127, 0.15, 10, 7], { major: false,
      onEnter: () => {}, onDefeat: () => { WORLD.item(L, 0, 156, { id: 'beastSeed', give: [['beast_cleaver', 1], ['ash_frost', 1], ['seed', 1]] }); } });
    WORLD.message(L, 7, 116, 'Beast ahead, be wary of left');
  },
});
