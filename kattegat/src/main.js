import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { HeightGrid } from './terrain.js';
import { makeLayout } from './layout.js';
import { buildGraph } from './graph.js';
import { createWorld, Sim, DT, ARC_END, AN, CA, ROLE_LABEL, KBITS, clock } from './sim.js';
import { U, MAXL } from './materials.js';
import { generateTextures } from './texgen.js';
import { buildTerrain, buildWater, buildFalls, buildSky, lightAt, WU } from './env.js';
import { buildSettlement } from './buildings.js';
import { Fleet } from './ships.js';
import { Villagers } from './villagers.js';
import { FX, Emitters } from './fx.js';
import { Forest } from './trees.js';
import { clamp, lerp, smoothstep, hash2 } from './util.js';
import { buildUI } from './ui.js';
import { Grass } from './grass.js';
import { GrassField } from './grassfield.js';
import { Flora } from './flora.js';
import { FirstPerson } from './fp.js';

const qs = new URLSearchParams(location.search);
const P = {
  seed: parseInt(qs.get('seed') || '1234', 10), speed: 1, sea: 0.35, wind: 0.45, windDir: -1.9, tide: 0.0, season: 0.12, density: 1, heat: 1, smoke: 1, traffic: 0.6,
  sun: 0.66, era: 3, overlay: false, rumor: false, photo: false,
};
const startT = qs.has('t') ? parseFloat(qs.get('t')) : 430;
if (qs.has('sun')) P.sun = parseFloat(qs.get('sun'));
if (qs.has('era')) P.era = parseInt(qs.get('era'), 10);

const loading = document.getElementById('loading');
const setLoad = (s) => { const el = document.getElementById('loadmsg'); if (el) el.textContent = s; };
const frameYield = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

async function boot() {
  // ------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.getElementById('app').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x88909a, 0.0004);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.4, 14000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.075; controls.rotateSpeed = 0.55; controls.zoomSpeed = 1.1; controls.panSpeed = 0.9;
  controls.minDistance = 2.5; controls.maxDistance = 4200; controls.maxPolarAngle = Math.PI * 0.495; controls.screenSpacePanning = false;
  controls.zoomToCursor = true;

  setLoad('Raising the fjord…'); await frameYield();
  const grid = new HeightGrid(-800, -700, 800, 900, 2.5);
  setLoad('Laying out the settlement…'); await frameYield();
  const L = makeLayout(P.seed, grid);
  const GR = buildGraph(L, grid);
  const S0 = createWorld(P.seed, L, GR, grid, P);
  const sim = new Sim(L, GR, grid);
  let S = S0; sim.setState(S);

  setLoad('Cutting turf and timber…'); await frameYield();
  const SK = buildSky(); scene.add(SK.sky, SK.stars);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(SK.envSky);
  let envRT = null, envKey = -1, envT = 0;
  const updateEnv = () => { const old = envRT; envRT = pmrem.fromScene(envScene, 0, 0.1, 1000); scene.environment = envRT.texture; if (old) old.dispose(); };
  const TEX = generateTextures(renderer);
  const [terrIn, terrOut] = buildTerrain(L, grid, TEX); scene.add(terrIn, terrOut);
  const water = buildWater(grid); scene.add(water);
  const falls = buildFalls(grid); scene.add(falls.group);
  const settle = buildSettlement(L, grid, P.seed); for (const m of settle.meshes) scene.add(m);
  setLoad('Planting the forests…'); await frameYield();
  const forest = new Forest(scene, L, grid, P.seed);
  const grass = new Grass(scene, L, grid); grass.noTufts = true;
  const gfield = new GrassField(scene, terrIn.geometry, TEX);
  if (qs.get('grass') === 'lo') gfield.lowQ = true;
  if (qs.get('grass') === '0') gfield.off = true;
  const flora = new Flora(scene, L, grid, P.seed);
  setLoad('Caulking the longships…'); await frameYield();
  const fleet = new Fleet(scene, S, grid);
  setLoad('Dressing the villagers…'); await frameYield();
  const crowd = new Villagers(scene, S, grid, sim);
  crowd.animals.setLayout(L, grid);

  // ------------------------------------------------------------- lights
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true;
  sun.shadow.mapSize.set(3072, 3072); const sc = sun.shadow.camera; sc.left = -240; sc.right = 240; sc.top = 240; sc.bottom = -240; sc.near = 10; sc.far = 2200; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xaaccff, 0x443322, 0.8); scene.add(hemi);
  const fillPts = Array.from({ length: 4 }, () => { const l = new THREE.PointLight(0xff8833, 0, 40, 1.6); scene.add(l); return l; });

  // ------------------------------------------------------------- emitters & fire sources
  const E = new Emitters();
  const src = []; // every light/flame source: {kind, pos, em, idx, delay}
  for (const b of L.B) {
    if (b.smoke) { const em = E.add(b.smoke, 'house', b.kind === 'hall' ? 1.6 : 0.85, b.kind === 'hall' ? 80 : 46); src.push({ kind: 'hearth', b, em, pos: b.doorGlow || b.smoke, delay: hash2(b.id, 3) * 0.7, eraMin: b.kind === 'pit' ? 0 : 1 }); }
    if (b.tentSmoke) { const em = E.add(b.tentSmoke, 'cook', 0.9, 12); src.push({ kind: 'cook', b, em, pos: b.tentSmoke, delay: hash2(b.id, 4) * 0.6, eraMin: 0, eraMax: 1 }); }
    if (b.forgeFire) { const em = E.add(b.forgeFire, 'fire', 1.4, 26); src.push({ kind: 'forgeFire', em, pos: b.forgeFire, delay: 0 }); const em2 = E.add(b.anvil, 'forge', 0.5, 4); src.push({ kind: 'anvil', em: em2, pos: b.anvil, delay: 0 }); const em3 = E.add(b.hearth, 'fire', 0.8, 10); src.push({ kind: 'forgeHearth', em: em3, pos: b.hearth, delay: 0 }); }
  }
  L.bonfires.forEach((bf, i) => { const p = [bf.x, grid.get(bf.x, bf.z) + 0.6, bf.z]; const em = E.add(p, 'fire', 1.6, 80); src.push({ kind: 'bonfire', i, em, pos: p, delay: 0.1 + i * 0.05 }); });
  { const p = [L.S.pyre[0], grid.get(L.S.pyre[0], L.S.pyre[1]) + 1.5, L.S.pyre[1]]; const em = E.add(p, 'pyre', 3.4, 150); src.push({ kind: 'pyre', em, pos: p, delay: 0 }); }
  L.beacons.forEach((b, i) => { const p = [b.x, b.fireY + 1, b.z]; const em = E.add(p, 'beacon', 2.6, 40); src.push({ kind: 'beacon', i, em, pos: p, delay: 0.15 + i * 0.07, eraMin: b.village || b.lookout ? 2 : 3 }); });
  L.torches.forEach((t, i) => { const pal = i < L.nPalTorches; const y = grid.get(t.x, t.z) + (pal ? 5.4 : 2.6); src.push({ kind: 'torch', i, pos: [t.x, y, t.z], delay: 0.25 + (i / L.torches.length) * 0.55, eraMin: pal ? 2 : 1 }); });
  if (L.S.tarPot) { const em = E.add(L.S.tarPot, 'fire', 0.6, 10); src.push({ kind: 'tar', em, pos: L.S.tarPot, delay: 0.3 }); }
  { const p = [L.S.dye[0], grid.get(L.S.dye[0], L.S.dye[1] - 1) + 0.5, L.S.dye[1] - 1]; const em = E.add(p, 'fire', 0.7, 10); src.push({ kind: 'cookfire', em, pos: p, delay: 0.4 }); }
  for (const b of L.B) if (b.kind === 'bakery') for (let k = 0; k < 3; k++) { /* ovens smoke via house emitter */ }
  const fx = new FX(scene, E);
  fx.addMist(falls.fallPts.filter((_, i) => i % 3 === 0).slice(0, 18));
  // door glows: light spilling out of every doorway at night
  const doorGeo = new THREE.PlaneGeometry(1.1, 1.7); doorGeo.translate(0, 0.0, 0);
  const doorMesh = new THREE.InstancedMesh(doorGeo, new THREE.MeshBasicMaterial({ color: 0xffa040, toneMapped: false, side: THREE.DoubleSide }), L.B.length);
  doorMesh.frustumCulled = false; scene.add(doorMesh);
  // ship lanterns
  const lanternMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb050, toneMapped: false }), 64);
  lanternMesh.frustumCulled = false; scene.add(lanternMesh);

  const ropes = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x3a2e22 }));
  ropes.frustumCulled = false; scene.add(ropes);
  // ------------------------------------------------------------- post
  const crt = new THREE.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, crt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.5, 0.6, 0.85); composer.addPass(bloom);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uVig: { value: 0.32 }, uSat: { value: 1.12 }, uCon: { value: 1.08 }, uWarm: { value: 0.5 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig; uniform float uSat; uniform float uCon; uniform float uWarm; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = max(c.rgb, 0.0);
        float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = mix(vec3(l), col, uSat);
        col = 0.18 * pow(col / 0.18 + 1e-5, vec3(uCon));
        // split-tone: cool shadows, warm highlights
        float t = smoothstep(0.02, 0.6, l);
        col *= mix(vec3(0.94, 0.98, 1.06), vec3(1.0 + 0.05 * uWarm, 1.0, 0.96 - 0.04 * uWarm), t);
        vec2 d = vUv - 0.5; col *= 1.0 - uVig * pow(length(d) * 1.35, 2.4);
        gl_FragColor = vec4(col, c.a); }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());
  // ---------------- planar reflection of the fjord
  const reflRT = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
  WU.uRefl.value = reflRT.texture;
  const reflCam = new THREE.PerspectiveCamera();
  const _n = new THREE.Vector3(0, 1, 0), _rp = new THREE.Vector3(), _cp = new THREE.Vector3(), _rm = new THREE.Matrix4(), _la = new THREE.Vector3(), _tg = new THREE.Vector3(), _vw = new THREE.Vector3();
  const _pl = new THREE.Plane(), _cl = new THREE.Vector4(), _q = new THREE.Vector4();
  const hideInRefl = [];
  const renderReflection = () => {
    const pr = renderer.getPixelRatio() * 0.5;
    const w = Math.floor(innerWidth * pr), h = Math.floor(innerHeight * pr);
    if (reflRT.width !== w || reflRT.height !== h) reflRT.setSize(w, h);
    _cp.setFromMatrixPosition(camera.matrixWorld);
    _rp.set(_cp.x, P.tide, _cp.z);
    _vw.subVectors(_rp, _cp); if (_vw.dot(_n) > 0) { WU.uReflOn.value = 0; return; }
    _vw.reflect(_n).negate().add(_rp);
    _rm.extractRotation(camera.matrixWorld);
    _la.set(0, 0, -1).applyMatrix4(_rm).add(_cp);
    _tg.subVectors(_rp, _la).reflect(_n).negate().add(_rp);
    reflCam.position.copy(_vw); reflCam.up.set(0, 1, 0).applyMatrix4(_rm).reflect(_n); reflCam.lookAt(_tg);
    reflCam.far = camera.far; reflCam.updateMatrixWorld(); reflCam.projectionMatrix.copy(camera.projectionMatrix);
    WU.uRMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);
    _pl.setFromNormalAndCoplanarPoint(_n, _rp).applyMatrix4(reflCam.matrixWorldInverse);
    _cl.set(_pl.normal.x, _pl.normal.y, _pl.normal.z, _pl.constant);
    const pm = reflCam.projectionMatrix.elements;
    _q.x = (Math.sign(_cl.x) + pm[8]) / pm[0]; _q.y = (Math.sign(_cl.y) + pm[9]) / pm[5]; _q.z = -1.0; _q.w = (1.0 + pm[10]) / pm[14];
    _cl.multiplyScalar(2.0 / _cl.dot(_q));
    pm[2] = _cl.x; pm[6] = _cl.y; pm[10] = _cl.z + 1.0 - 0.003; pm[14] = _cl.w;
    const vis = hideInRefl.map((o) => o.visible); hideInRefl.forEach((o) => (o.visible = false));
    const au = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
    const prevRT = renderer.getRenderTarget();
    renderer.setRenderTarget(reflRT); renderer.clear(); renderer.render(scene, reflCam);
    renderer.setRenderTarget(prevRT); renderer.shadowMap.autoUpdate = au;
    hideInRefl.forEach((o, i) => (o.visible = vis[i]));
    WU.uReflOn.value = 1;
  };

  // ------------------------------------------------------------- timeline & snapshots
  const SNAP = 20;
  const snaps = new Map();
  const clone = (st) => { const p = st.params; st.params = null; const c = structuredClone(st); st.params = p; c.params = P; return c; };
  const record = (st) => { const k = Math.floor(st.t / SNAP + 1e-6); if (!snaps.has(k) && Math.abs(st.t - k * SNAP) < DT * 1.5) snaps.set(k, clone(st)); };
  snaps.set(0, clone(S0));
  const marks = {};
  const noteMarks = (st) => {
    const f = st.flags;
    if (f.firstBeach >= 0) marks.beach = f.firstBeach; if (f.feastActive >= 0) marks.feast = f.feastActive; if (f.horn >= 0) marks.horn = f.horn;
    if (st.pyre.lit >= 0) marks.pyre = st.pyre.lit; if (f.lastBeach >= 0) marks.procession = f.lastBeach;
    if (st.ring.bouts > 0 && marks.ring === undefined) marks.ring = st.t;
    if (st.pyre.lit >= 0 && st.quiet < 0.5 && st.t > st.pyre.lit + 300 && marks.embers === undefined) marks.embers = st.t;
    if (st.stats.sleeping > st.stats.total * 0.85 && marks.asleep === undefined) marks.asleep = st.t;
  };
  // catch up to the default moment before the first frame
  setLoad('The fleet is sighted in the narrows…'); await frameYield();
  while (S.t < startT - 1e-6) { sim.step(); record(S); noteMarks(S); }
  // a second simulation runs ahead in the background, filling snapshots for instant scrubbing
  const ahead = new Sim(L, GR, grid); let AS = clone(S); ahead.setState(AS);
  let target = null; // scrub target time
  let acc = 0;
  const invalidateFuture = () => { for (const k of [...snaps.keys()]) if (k * SNAP > S.t + 1) snaps.delete(k); AS = clone(S); ahead.setState(AS); for (const k in marks) if (marks[k] > S.t) delete marks[k]; };
  const scrubTo = (T) => {
    T = clamp(T, 0, ARC_END);
    if (T >= S.t && T - S.t < 25) { target = T; return; }
    let k = Math.floor(T / SNAP); while (k > 0 && !snaps.has(k)) k--;
    S = clone(snaps.get(k)); sim.setState(S); target = T;
  };

  // ------------------------------------------------------------- camera presets
  const tv = new THREE.Vector3();
  const lead = () => S.ships.find((s) => s.state === 0) || S.ships[S.ships.length - 1];
  const beachShip = () => { let b = null; for (const s of S.ships) if (s.state >= 1 && (!b || s.tState > b.tState)) b = s; return b || lead(); };
  const jarl = S.agents.find((a) => a.role === 'jarl');
  const presets = {
    'The return': () => ({ pos: [168, 36, 182], tgt: [-30, 2, -170] }),
    'The beaching': () => { const s = beachShip(); return { pos: [s.x + 34, 14, s.z + 30], tgt: [s.x, 2, s.z], follow: () => { const q = beachShip(); return [q.x, 2, q.z]; } }; },
    'The procession': () => { const j = S.agents[jarl.id]; return { pos: [j.x + 16, grid.get(j.x, j.z) + 11, j.z + 20], tgt: [j.x, grid.get(j.x, j.z) + 1.5, j.z], follow: () => { const a = S.agents[jarl.id]; return [a.x, grid.get(a.x, a.z) + 1.5, a.z]; } }; },
    'Great hall feast': () => ({ pos: [38, 11, 122], tgt: [-4, 2, 88] }),
    'Wrestling ring': () => ({ pos: [L.S.ring[0] + 9, 6.5, L.S.ring[1] + 12], tgt: [L.S.ring[0], 1.6, L.S.ring[1]] }),
    'Forge face': () => { const f = L.B.find((b) => b.kind === 'forge'); const sx = Math.sin(f.rot), cz = Math.cos(f.rot); return { pos: [f.anvil[0] + sx * 7 + cz * 2.5, f.anvil[1] + 0.9, f.anvil[2] + cz * 7 - sx * 2.5], tgt: [f.anvil[0], f.anvil[1] + 0.2, f.anvil[2]] }; },
    'The pyre': () => ({ pos: [L.S.pyre[0] + 26, 12, L.S.pyre[1] + 34], tgt: [L.S.pyre[0], 3, L.S.pyre[1]] }),
    'The godswood': () => { const g = L.S.godswood, gy = grid.get(g[0], g[1]); return { pos: [g[0] + 30, gy + 9, g[1] - 24], tgt: [g[0], gy + 5, g[1] + 6] }; },
    'Ridge god-view': () => ({ pos: [150, 430, 420], tgt: [0, 0, -900] }),
    'Longship bow': () => ({ bow: true }),
    'Fjord-rim sunset': () => ({ pos: [-560, 420, -1480], tgt: [20, 20, 160], sunset: true }),
  };
  let camAnim = null, follow = null, bowShip = -1, bowMode = false;
  const goPreset = (name) => {
    if (fp.active) toggleFP();
    const p = presets[name](); follow = null; bowMode = false;
    if (p.bow) { const s = S.ships.find((q) => q.state === 0) || S.ships[0]; bowShip = s.id; bowMode = true; return; }
    if (p.sunset && P.sun < 0.55) ui.setSun(0.66);
    camAnim = { t: 0, dur: 2.2, p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...p.pos), t1: new THREE.Vector3(...p.tgt) };
    follow = p.follow || null;
    ui.setActiveCam(name);
  };
  const initial = presets['The return']();
  camera.position.set(...initial.pos); controls.target.set(...initial.tgt);
  controls.addEventListener('start', () => { camAnim = null; if (bowMode) { bowMode = false; } });
  const fp = new FirstPerson(camera, renderer.domElement, grid, L, P, GR);
  const toggleFP = () => {
    if (fp.active) {
      fp.exit(); controls.enabled = true;
      const d = new THREE.Vector3(); camera.getWorldDirection(d);
      controls.target.copy(camera.position).addScaledVector(d, 12); camera.position.addScaledVector(d, -8).add(new THREE.Vector3(0, 5, 0));
    } else { camAnim = null; follow = null; bowMode = false; controls.enabled = false; fp.enter(controls.target); }
    ui.setFP(fp.active);
  };
  addEventListener('keydown', (e) => { if ((e.key === 'f' || e.key === 'F') && e.target.tagName !== 'INPUT') toggleFP(); if (e.key === 'e' || e.key === 'E') { if (fp.active) { const id = pick(innerWidth / 2, innerHeight / 2, 60); selected = id; ui.showAgent(id >= 0 ? S.agents[id] : null); } } });

  // ------------------------------------------------------------- inspect & overlays
  let selected = -1;
  const pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.95, depthTest: false }));
  pathLine.renderOrder = 20; pathLine.frustumCulled = false; scene.add(pathLine);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.35, 32), new THREE.MeshBasicMaterial({ color: 0xffd36a, side: THREE.DoubleSide, depthTest: false, transparent: true }));
  ring.rotation.x = -Math.PI / 2; ring.renderOrder = 21; scene.add(ring);
  const destRing = ring.clone(); destRing.material = ring.material.clone(); destRing.material.color.set(0x6ad3ff); scene.add(destRing);
  const intentLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthTest: false }));
  intentLines.frustumCulled = false; intentLines.renderOrder = 19; scene.add(intentLines);
  const rumorPts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, depthTest: false, transparent: true }));
  rumorPts.frustumCulled = false; rumorPts.renderOrder = 22; scene.add(rumorPts);
  hideInRefl.push(water, pathLine, ring, destRing, intentLines, rumorPts, fx.snow, ...fx.fogBanks, ...gfield.rings.map((r) => r.mesh));
  const pick = (cx, cy, rad = 22) => {
    let best = -1, bd = rad * rad; const v = new THREE.Vector3();
    for (let i = 0; i < crowd.N; i++) {
      const Lk = crowd.look[i]; if (!Lk.vis) continue;
      v.set(Lk.wx, Lk.wy + 1.0 * Lk.scale, Lk.wz).project(camera); if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight;
      const d = (sx - cx) ** 2 + (sy - cy) ** 2; if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY, performance.now()]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (fp.active) return;
    if (!downAt) return; const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
    if (moved < 5 && performance.now() - downAt[2] < 400) { const id = pick(e.clientX, e.clientY); selected = id; ui.showAgent(id >= 0 ? S.agents[id] : null); }
    downAt = null;
  });

  // ------------------------------------------------------------- UI
  const ui = buildUI({
    P, presets: Object.keys(presets), goPreset, scrubTo, ARC_END,
    getT: () => S.t, invalidate: () => invalidateFuture(),
    reset: () => { if (fp.active) toggleFP(); goPreset('The return'); },
    toggleFP: () => toggleFP(),
    followAgent: (id) => { follow = () => { const a = S.agents[id]; return [a.x, (isNaN(a.ey) ? grid.get(a.x, a.z) : a.ey) + 1.4, a.z]; }; const t = follow(); camAnim = { t: 0, dur: 1.5, p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(t[0] + 9, t[1] + 6, t[2] + 11), t1: new THREE.Vector3(...t) }; },
    deselect: () => { selected = -1; },
    newSeed: (sd) => { location.search = '?seed=' + sd; },
    roleLabel: ROLE_LABEL, agents: () => S.agents, clock,
  });
  ui.setActiveCam('The return');

  // ------------------------------------------------------------- per-frame light gathering
  let kindle = P.sun > 0.85 ? 1 : 0;
  let eraShown = -1; const eraAnim = new Map();
  const tmpCol = new THREE.Color();
  const fireCol = [1.0, 0.5, 0.18];
  const lights = [];
  const updateEra = (dt) => {
    if (eraShown !== P.era) {
      for (const m of settle.meshes) { const vis = P.era >= m.userData.min && P.era < m.userData.max; if (vis && !m.visible) { eraAnim.set(m, 0); } m.visible = vis; }
      eraShown = P.era;
    }
    for (const [m, t] of eraAnim) { const nt = t + dt / 1.4; m.position.y = -14 * (1 - smoothstep(0, 1, nt)); if (nt >= 1) { m.position.y = 0; eraAnim.delete(m); } else eraAnim.set(m, nt); }
  };

  // ------------------------------------------------------------- loop
  let lowQ = false;
  let last = performance.now(), frames = 0, fpsT = 0, fps = 60, uiT = 0;
  const clockT = { t: 0 };
  loading.style.opacity = 0; setTimeout(() => loading.remove(), 900);
  const loop = () => {
    requestAnimationFrame(loop);
    const now = performance.now(); const rawDt = Math.min(0.5, (now - last) / 1000); let dt = Math.min(0.1, rawDt); last = now;
    clockT.t += dt; const t = clockT.t;
    frames++; fpsT += dt; if (fpsT > 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
    // ---------------- simulation (fixed timestep, independent of the camera)
    const t0 = performance.now();
    if (target !== null) {
      while (S.t < target - 1e-6 && performance.now() - t0 < 28) { sim.step(); record(S); noteMarks(S); }
      if (S.t >= target - 1e-6) { target = null; acc = 0; }
    } else if (P.speed > 0 && S.t < ARC_END) {
      acc += dt * P.speed; let n = 0;
      while (acc >= DT && n < 80) { sim.step(); record(S); noteMarks(S); acc -= DT; n++; }
      if (n >= 80) acc = 0;
    }
    // background look-ahead
    if (AS.t < ARC_END) { const t1 = performance.now(); while (AS.t < ARC_END && performance.now() - t1 < (P.speed === 0 ? 9 : 4)) { ahead.step(); record(AS); noteMarks(AS); } }
    const alpha = target !== null ? 1 : clamp(acc / DT, 0, 1);
    // ---------------- light & atmosphere
    const lk = lightAt(P.sun);
    const el = lk.el * Math.PI / 180, az = lk.az * Math.PI / 180;
    const sd = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    U.uSun.value.copy(sd); U.uSunCol.value.setRGB(...lk.sun);
    sun.color.setRGB(...lk.sun); sun.intensity = lk.si * (1 - P.season * 0.25);
    const tg = controls.target;
    const snapT = new THREE.Vector3(Math.round(tg.x / 20) * 20, 0, Math.round(tg.z / 20) * 20);
    sun.position.copy(snapT).addScaledVector(sd.y > 0.05 ? sd : new THREE.Vector3(sd.x, 0.15, sd.z).normalize(), 900); sun.target.position.copy(snapT);
    const camDist = camera.position.distanceTo(tg);
    const ext = clamp(camDist * 1.4, 120, 700); sc.left = sc.bottom = -ext; sc.right = sc.top = ext; sc.updateProjectionMatrix();
    hemi.color.setRGB(...lk.sky); hemi.groundColor.setRGB(...lk.gnd); hemi.intensity = lk.hi * (1 + P.season * 0.2);
    WU.uZen.value.setRGB(...lk.zen); WU.uHor.value.setRGB(...lk.hor);
    { const su = SK.sky.material.uniforms; su.sunPosition.value.copy(sd); su.turbidity.value = lk.tb; su.rayleigh.value = lk.ry; su.mieCoefficient.value = 0.005; su.mieDirectionalG.value = 0.82; }
    envT += rawDt; if (Math.abs(envKey - P.sun) > 0.004 && envT > 0.2) { envKey = P.sun; envT = 0; updateEnv(); }
    scene.environmentIntensity = lk.env * (1 - P.season * 0.1);
    const fogD = lk.fd * (1 + P.season * 0.6) * (P.sun < 0.15 ? 1 : 1);
    scene.fog.color.setRGB(...lk.fog); scene.fog.density = fogD;
    WU.uFogCol.value.setRGB(...lk.fog); WU.uFogD.value = fogD;
    renderer.toneMappingExposure = lk.exp;
    U.uDark.value = lk.dark;
    kindle = lerp(kindle, lk.dark, Math.min(1, dt * 0.35));
    bloom.strength = 0.22 + lk.dark * 0.5; bloom.threshold = lerp(0.92, 0.72, lk.dark);
    U.uTime.value = t; U.uSnow.value = smoothstep(0.35, 0.95, P.season); U.uTide.value = P.tide;
    U.uWind.value.set(Math.cos(P.windDir) * (0.2 + P.wind * 1.6), Math.sin(P.windDir) * (0.2 + P.wind * 1.6));
    WU.uSea.value = P.sea;
    fx.fogMat.uniforms.uAmt.value = smoothstep(0.3, 0.0, P.sun) * 1.0 + P.season * 0.15;
    fx.snow.material.uniforms.uAmt.value = smoothstep(0.55, 1.0, P.season); fx.snow.material.uniforms.uCam.value.copy(camera.position);
    fx.common.uSmoke.value = P.smoke; fx.common.uPx.value = innerHeight * renderer.getPixelRatio() * 0.9;
    updateEra(dt);
    // ---------------- dynamic systems
    fleet.update(S, alpha, t, P, P.era, dt);
    crowd.items.pyreAndFires(S, L, grid);
    if (P.era < 2) for (const a of S.agents) if (!isNaN(a.ey)) a.ey = NaN;
    crowd.viewer = fp.active ? camera.position : null;
    crowd.update(S, alpha, t, dt, camera, P, fleet);
    forest.update(camera);
    grass.update(fp.active ? fp.pos : controls.target, P.season);
    gfield.update(camera.position, fp.active ? fp.pos : null, P.season, camera.position.y - grid.get(camera.position.x, camera.position.z), camera);
    { const rp = []; const bv = new THREE.Vector3();
      for (const a of S.agents) { if (a.act !== 'haul' || a.moving || !a.alive) continue; const Lk = crowd.look[a.id]; if (!Lk.vis) continue; const fs = fleet.ships[a.p]; bv.set((a.id % 2 ? 0.6 : -0.6), 2.6, 11.4).applyMatrix4(fs.g.matrixWorld); if (Math.hypot(bv.x - Lk.wx, bv.z - Lk.wz) > 24) continue; rp.push(Lk.wx, Lk.wy + 1.15, Lk.wz, bv.x, bv.y, bv.z); }
      ropes.geometry.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); }
    // gulls scatter where keels grind and crowds rush
    const scat = []; for (const sh of S.ships) if (sh.state === 1) scat.push([sh.x, sh.z]);
    if (S.ring.a >= 0) scat.push(L.S.ring);
    fx.updateBirds(t, dt, S, L, grid, scat);
    // ---------------- fires, smoke, flames and the 32 brightest lights
    lights.length = 0; const flames = [];
    const flick = (k) => 0.82 + 0.18 * Math.sin(t * 11 + k * 3.1) * Math.sin(t * 7.3 + k);
    const kf = (d) => smoothstep(d, d + 0.12, kindle * 1.15);
    const heatV = P.heat;
    for (const s of src) {
      if (s.eraMin !== undefined && P.era < s.eraMin) { if (s.em !== undefined) fx.setEmitter(s.em, 0, 0, 0); continue; }
      if (s.eraMax !== undefined && P.era >= s.eraMax) { if (s.em !== undefined) fx.setEmitter(s.em, 0, 0, 0); continue; }
      let on = 0, heat = 0, size = 0, rad = 0, fl = 0;
      switch (s.kind) {
        case 'hearth': { const h = S.hearth[s.b.id] ?? 0.4; on = 0.55 + 0.45 * h; fx.setEmitter(s.em, on, 0.0, s.b.kind === 'hall' ? 0.6 : 0.2); if (kf(s.delay) > 0.01) lights.push([s.pos[0], s.pos[1], s.pos[2], 8 * h * kf(s.delay), 1.1 * h, s.kind]); continue; }
        case 'cook': { on = 0.9; fx.setEmitter(s.em, on, 0.6, 0.1); flames.push([s.pos[0], s.pos[1] - 0.5, s.pos[2], 0.8 * flick(s.b.id)]); lights.push([s.pos[0], s.pos[1] + 0.5, s.pos[2], 5, 0.8 * kf(s.delay) + 0.1, s.kind]); continue; }
        case 'bonfire': { const b = S.bonfires[s.i]; on = b.lit > 0 ? 0.5 + b.fuel * 0.5 : 0; heat = on; size = on * (0.4 + 0.3 * heatV); rad = 7 + 6 * on; fl = on * (1.4 + 1.0 * b.fuel) * (0.7 + 0.3 * heatV); break; }
        case 'pyre': { const py = S.pyre; if (py.lit >= 0) { const age = S.t - py.lit; on = clamp(age / 20, 0, 1) * clamp(1 - (age - 280) / 260, 0.08, 1); } heat = on; size = on; rad = 26 * on; fl = on * 5.5; break; }
        case 'beacon': { const lit = S.beacons[s.i].lit >= 0; on = lit ? 1 : 0; heat = on; size = on * 0.8; rad = 30 * on; fl = on * (4.5 + 3 * kf(s.delay)); break; }
        case 'torch': { const lit = S.torches[s.i].lit >= 0; on = lit ? 1 : 0; fl = on * 0.42 * (0.6 + 0.4 * kf(s.delay)); rad = 5 * on; if (on) flames.push([s.pos[0], s.pos[1], s.pos[2], fl * flick(s.i)]); if (on && kf(s.delay) > 0.02) lights.push([s.pos[0], s.pos[1] + 0.4, s.pos[2], rad, kf(s.delay) * flick(s.i), s.kind]); continue; }
        case 'forgeFire': on = 0.4 + 0.6 * S.forgeHeat; heat = on; size = 0.3; rad = 7; fl = 0.9 * on; break;
        case 'forgeHearth': on = S.forgeHeat; heat = on; rad = 5; fl = 0.5 * on; size = 0; break;
        case 'anvil': { const pulse = S.forgeHammer > 0 ? (Math.sin(t * 5) > 0.92 ? 1 : 0) : 0; fx.setEmitter(s.em, 0, S.forgeHeat, 0, pulse); continue; }
        case 'tar': case 'cookfire': on = 0.8; heat = 0.7; size = 0.1; rad = 4; fl = 0.6; break;
      }
      if (s.em !== undefined) fx.setEmitter(s.em, on, heat, size);
      if (fl > 0) flames.push([s.pos[0], s.pos[1] - 0.6 + (s.kind === 'pyre' ? 1.6 : 0), s.pos[2], fl * flick(s.em || 0)]);
      if (on > 0) { const k = s.kind === 'beacon' ? kf(s.delay) : 1; lights.push([s.pos[0], s.pos[1] + 1, s.pos[2], rad, on * (0.35 + 0.65 * k) * flick((s.em || 0) + 2), s.kind]); }
    }
    for (const h of crowd.heldTorches) { flames.push([h[0], h[1], h[2], 0.35 * flick(h[0])]); lights.push([h[0], h[1], h[2], 4, 0.9, 'held']); }
    // ship lanterns strung across black water at dusk
    let li = 0; const lm = new THREE.Matrix4();
    const lanternOn = smoothstep(0.35, 0.7, kindle);
    const allShips = fleet.ships.filter((s) => s.g.visible);
    allShips.forEach((s, i) => {
      const on = lanternOn * smoothstep(i / allShips.length * 0.8, i / allShips.length * 0.8 + 0.2, kindle * 1.2);
      for (const lz of [-10.6, 11.2]) {
        tv.set(0, lz > 0 ? 5.2 : 4.4, lz).applyMatrix4(s.g.matrixWorld);
        lm.makeScale(on, on, on).setPosition(tv); lanternMesh.setMatrixAt(li++, lm);
        if (on > 0.05) { lights.push([tv.x, tv.y, tv.z, 7, on, 'lantern']); flames.push([tv.x, tv.y - 0.15, tv.z, 0.25 * on]); }
      }
    });
    lanternMesh.count = li; lanternMesh.instanceMatrix.needsUpdate = true;
    // doors
    let di = 0; const dm = new THREE.Matrix4(), dq = new THREE.Quaternion(), dv = new THREE.Vector3(), ds = new THREE.Vector3();
    for (const b of L.B) {
      if (!b.doorGlow || (b.kind !== 'hall' && P.era < 1)) continue;
      const g = (S.hearth[b.id] ?? 0.4) * smoothstep(0.2, 0.6, kindle) * kf(hash2(b.id, 3) * 0.7);
      dq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rot); dv.set(...b.doorGlow); ds.set(b.kind === 'hall' ? 2.4 : 1.25, b.kind === 'hall' ? 1.8 : 1.15, 1).multiplyScalar(g > 0.02 ? 1 : 0);
      dm.compose(dv, dq, ds); doorMesh.setMatrixAt(di++, dm);
    }
    doorMesh.count = di; doorMesh.instanceMatrix.needsUpdate = true; doorMesh.material.color.setRGB(1, 0.55, 0.2).multiplyScalar(0.6 + 1.2 * kindle);
    fx.commit(); fx.setFlames(flames);
    // choose the brightest lights near the view for the shared glow uniforms
    const cx = tg.x, cz = tg.z;
    for (const l of lights) { const d = Math.hypot(l[0] - cx, l[2] - cz); l.score = l[3] * l[4] / (1 + d / 120) * (l[5] === 'beacon' ? 3 : 1); }
    lights.sort((a, b) => b.score - a.score);
    const nl = Math.min(MAXL, lights.length);
    const glowK = 0.3 + 1.1 * lk.dark;
    for (let i = 0; i < nl; i++) {
      const l = lights[i];
      U.uLP.value[i].set(l[0], l[1], l[2], Math.max(0.5, l[3]));
      U.uLC.value[i].set(fireCol[0] * l[4] * glowK, fireCol[1] * l[4] * glowK, fireCol[2] * l[4] * glowK);
    }
    U.uNL.value = nl;
    for (let i = 0; i < 4; i++) { const l = lights[i]; if (l && lk.dark > 0.2) { fillPts[i].position.set(l[0], l[1] + 1, l[2]); fillPts[i].intensity = l[4] * 60 * lk.dark; fillPts[i].distance = l[3] * 4; } else fillPts[i].intensity = 0; }
    // ---------------- camera
    if (fp.active) {
      fp.update(Math.min(0.05, rawDt));
      controls.target.copy(fp.look);
    } else {
      if (camAnim) {
        camAnim.t += rawDt; const k = smoothstep(0, 1, camAnim.t / camAnim.dur);
        if (follow) { const f = follow(); camAnim.t1.set(...f); }
        camera.position.lerpVectors(camAnim.p0, camAnim.p1, k); controls.target.lerpVectors(camAnim.t0, camAnim.t1, k);
        if (camAnim.t >= camAnim.dur) camAnim = null;
      } else if (follow) {
        const f = follow(); tv.set(...f).sub(controls.target); camera.position.add(tv); controls.target.add(tv);
      }
      if (bowMode) {
        const s = fleet.ships[bowShip]; const m = s.g.matrixWorld;
        const p = new THREE.Vector3(0, 6.5, 8.5).applyMatrix4(m); const look = new THREE.Vector3(0, 3, 70).applyMatrix4(m);
        camera.position.lerp(p, Math.min(1, dt * 4)); controls.target.lerp(look, Math.min(1, dt * 4));
        if (S.ships[bowShip].state >= 2) { const nx = S.ships.find((q) => q.state === 0); if (nx) bowShip = nx.id; }
      }
      controls.update();
      // keep the camera above ground
      const gy = grid.get(camera.position.x, camera.position.z);
      if (camera.position.y < gy + 1.2) camera.position.y = gy + 1.2;
    }
    // ---------------- overlays
    if (selected >= 0) {
      const a = S.agents[selected], Lk = crowd.look[selected];
      ring.visible = Lk.vis; ring.position.set(Lk.wx, Lk.wy + 0.08, Lk.wz);
      const pts = [new THREE.Vector3(Lk.wx, Lk.wy + 0.3, Lk.wz)];
      if (a.moving && a.path) { for (let k = a.pi; k < a.path.length; k++) { const n = a.path[k]; const y = isNaN(GR.G.y[n]) ? grid.get(GR.G.x[n], GR.G.z[n]) : GR.G.y[n]; pts.push(new THREE.Vector3(GR.G.x[n], y + 0.3, GR.G.z[n])); } pts.push(new THREE.Vector3(a.tx, grid.get(a.tx, a.tz) + 0.3, a.tz)); }
      pathLine.geometry.setFromPoints(pts); pathLine.visible = pts.length > 1;
      destRing.visible = a.moving; destRing.position.set(a.tx, grid.get(a.tx, a.tz) + 0.1, a.tz);
    } else { ring.visible = false; pathLine.visible = false; destRing.visible = false; }
    if (P.overlay) {
      const pos = [], cols = []; const c = new THREE.Color();
      for (let i = 0; i < crowd.N; i++) {
        const a = S.agents[i], Lk = crowd.look[i]; if (!Lk.vis || !a.moving || a.aboard) continue;
        if ((Lk.wx - camera.position.x) ** 2 + (Lk.wz - camera.position.z) ** 2 > 450 * 450) continue;
        c.setHSL((hash2(a.act.length, a.act.charCodeAt(0)) * 0.9), 0.8, 0.6);
        pos.push(Lk.wx, Lk.wy + 1.9, Lk.wz, a.tx, grid.get(a.tx, a.tz) + 0.2, a.tz); cols.push(c.r, c.g, c.b, c.r * 0.4, c.g * 0.4, c.b * 0.4);
      }
      intentLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); intentLines.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      intentLines.visible = true;
    } else intentLines.visible = false;
    if (P.rumor) {
      const pos = [], cols = [];
      for (let i = 0; i < crowd.N; i++) { const a = S.agents[i], Lk = crowd.look[i]; if (!Lk.vis) continue; pos.push(Lk.wx, Lk.wy + 2.3 * Lk.scale, Lk.wz); const k = a.know; const col = a.grief > 0.3 ? [0.4, 0.6, 1] : k & KBITS.K_PYRE ? [0.9, 0.9, 0.9] : k & KBITS.K_FEAST ? [1, 0.45, 0.1] : k & KBITS.K_FLEET ? [1, 0.85, 0.2] : [0.35, 0.35, 0.35]; cols.push(...col); }
      rumorPts.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rumorPts.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); rumorPts.visible = true;
    } else rumorPts.visible = false;
    if (!lowQ && fps < 28 && t > 10) { lowQ = true; gfield.lowQ = true; renderer.setPixelRatio(1); composer.setPixelRatio(1); composer.setSize(innerWidth, innerHeight); }
    if (P.refl !== false) { if (!lowQ || (frames & 1) === 0) renderReflection(); } else WU.uReflOn.value = 0;
    composer.render();
    // ---------------- UI refresh
    uiT += dt; if (uiT > 0.2) { uiT = 0; ui.tick(S, { fps, ahead: AS.t, marks, catching: target !== null, rendered: crowd.rendered, selected: selected >= 0 ? S.agents[selected] : null }); }
  };
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });
  window.__k = { S: () => S, P, camera, controls, goPreset, scrubTo, ui, renderer, scene, fp, toggleFP, fpAt: (x, z, yaw, pitch = 0) => { if (!fp.active) toggleFP(); fp.pos.set(x, grid.get(x, z), z); fp.yaw = yaw; fp.pitch = pitch; } };
  loop();
}
boot().catch((e) => { console.error(e); setLoad('Error: ' + e.message); });
