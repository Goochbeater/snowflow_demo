// ===== 01-core: namespace, hooks, utils, palette, input, time  (OWNER: coordinator) =====
const AF = window.AF;
AF.BUILD = '@@BUILD@@';
AF.Q = new URLSearchParams(location.search);
AF.TEST = AF.Q.has('test');
AF.SHOT = AF.Q.has('shot');
AF.DBG = AF.Q.has('dbg');
AF.ready = false;

// ---------------------------------------------------------------- hooks
// Build stages run once at boot, sorted by order (see CONTRACT.md for the order table).
// Ticks run every frame sorted by order: fn(dt, t). Errors are caught, logged once per hook, and the hook keeps running.
AF.hooks = { build: [], tick: [], tests: [] };
AF.onBuild = (name, order, fn) => { AF.hooks.build.push({ name, order, fn }); };
AF.onTick = (name, order, fn) => { AF.hooks.tick.push({ name, order, fn, errs: 0 }); AF.hooks.tick.sort((a, b) => a.order - b.order); };
AF.test = (name, fn) => { AF.hooks.tests.push({ name, fn }); };
AF.warnOnce = (() => { const seen = new Set(); return (k, ...a) => { if (!seen.has(k)) { seen.add(k); console.warn('[af]', k, ...a); } }; })();

// ---------------------------------------------------------------- math utils
AF.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
AF.lerp = (a, b, t) => a + (b - a) * t;
AF.smooth = (a, b, v) => { const t = AF.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
AF.rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
AF.hash2 = (x, z) => { let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
AF.hash3 = (x, y, z) => AF.hash2(Math.imul(x | 0, 31) + (y | 0) * 7919, z);
AF.noise2 = (x, z) => { // smooth value noise 0..1
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = AF.hash2(xi, zi), b = AF.hash2(xi + 1, zi), c = AF.hash2(xi, zi + 1), d = AF.hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
AF.fbm2 = (x, z, oct = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * AF.noise2(x * f + i * 17.3, z * f - i * 9.1); n += a; a *= 0.5; f *= 2; } return s / n; };
AF.angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ---------------------------------------------------------------- palette
// AF.col(0xRRGGBB, opts?) -> palette index (1..4095). Same args -> same index.
// opts: { emit: 0xRRGGBB, emitK: strength(1), mode: 'night'|'always', jitter: 0..1 (0.5), edge: 0..1 (0.5),
//         solid: true, glass: false, sat: 1 (extra saturation multiplier) }
//   emit+mode 'night'  : glows only when AF.time.night rises (windows, street lamps)
//   emit+mode 'always' : always glows (neon, fire, TV)
//   glass              : rendered in the transparent pass, tinted by the colour; solid for collision
//   solid:false        : visible but walk-through (flowers, tall grass, curtains, hanging signs)
AF.SAT = 1.12;
AF.PALN = 8192;
// MATERIALS — every colour carries one. They decide what burns, what shatters, what a fireball does to it.
//   stone  : walls, towers, cobbles (never burns; scorches black; needs a fireball or a collapse to break)
//   wood   : beams, planks, doors, furniture, hulls, masts, carts (catches, burns 8-14 s, leaves char or nothing)
//   thatch : thatch, straw, hay, wheat, reeds (catches instantly, burns out fast, leaves nothing)
//   cloth  : sails, banners, awnings, tents, curtains, rope, nets (catches instantly, burns out fast)
//   leaf   : leaves, hedges, crops, flowers, grass tufts (burns fast)
//   plaster: wattle-and-daub / plaster infill (does not burn, crumbles when the timber beside it burns)
//   tile   : clay or slate roofing (does not burn; falls in when the rafters go)
//   metal  : iron, bronze, lead, gold (never burns)
//   glass  : shatters from blast and heat
//   earth  : soil, sand, gravel, rubble
//   explosive : powder kegs, pitch and oil barrels (detonates when fire or a blast reaches it)
//   char   : burnt remains (core only)
AF.MAT = { stone: 0, wood: 1, thatch: 2, cloth: 3, leaf: 4, metal: 5, glass: 6, earth: 7, tile: 8, plaster: 9, char: 10, fire: 11, explosive: 12 };
AF.MATNAME = Object.keys(AF.MAT);
// per material: burn = how easily it catches (0 never), fuel = seconds it burns, left = chance a burnt voxel stays as char,
// tough = how hard it is to blast (1 = stone; lower breaks at a larger radius)
AF.MATP = [
  { burn: 0, fuel: 0, left: 1, tough: 1.0 },      // stone
  { burn: 0.5, fuel: 14, left: 0.55, tough: 0.7 }, // wood
  { burn: 1.0, fuel: 4.5, left: 0.04, tough: 0.3 },  // thatch
  { burn: 1.0, fuel: 2.2, left: 0.0, tough: 0.25 },  // cloth
  { burn: 0.7, fuel: 1.7, left: 0.0, tough: 0.25 }, // leaf (a tree goes up like a torch and leaves a black trunk)
  { burn: 0, fuel: 0, left: 1, tough: 1.25 },     // metal
  { burn: 0, fuel: 0, left: 0, tough: 0.15 },     // glass
  { burn: 0, fuel: 0, left: 1, tough: 0.85 },     // earth
  { burn: 0, fuel: 0, left: 1, tough: 0.55 },     // tile
  { burn: 0, fuel: 0, left: 1, tough: 0.5 },      // plaster
  { burn: 0, fuel: 0, left: 1, tough: 0.4 },      // char
  { burn: 0, fuel: 0, left: 0, tough: 0.3 },      // fire
  { burn: 1.0, fuel: 0.4, left: 0, tough: 0.2 },  // explosive
];
AF.PAL = {
  n: 1, key: new Map(), hex: [0], solid: new Uint8Array(AF.PALN), glass: new Uint8Array(AF.PALN), opaque: new Uint8Array(AF.PALN),
  mat: new Uint8Array(AF.PALN), soot: new Uint16Array(AF.PALN),
  albedo: new Float32Array(AF.PALN * 4), emit: new Float32Array(AF.PALN * 4), dirty: true, names: {},
};
// guess a material from the colour when the author did not say (authors SHOULD say)
AF.guessMat = (hex, o) => {
  if (o.glass) return AF.MAT.glass;
  const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d < 1e-4 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0; if (d > 1e-4) { if (mx === r) h = ((g - b) / d + 6) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  if (s < 0.14) return AF.MAT.stone;
  if (h >= 70 && h < 170) return AF.MAT.leaf;
  if (h >= 38 && h < 70 && l > 0.5) return AF.MAT.thatch;
  if (h >= 12 && h < 50 && l < 0.62) return AF.MAT.wood;
  return AF.MAT.stone;
};
AF.col = (hex, o = {}) => {
  if (typeof hex === 'string') { if (AF.PAL.names[hex]) return AF.PAL.names[hex]; hex = parseInt(hex.replace('#', ''), 16); }
  if (typeof hex !== 'number' || !isFinite(hex)) { AF.warnOnce('bad colour ' + hex); hex = 0xff00ff; }
  const k = hex + '|' + (o.emit ?? '') + '|' + (o.emitK ?? '') + '|' + (o.mode ?? '') + '|' + (o.jitter ?? '') + '|' + (o.edge ?? '') + '|' + (o.solid ?? '') + '|' + (o.glass ?? '') + '|' + (o.sat ?? '') + '|' + (o.mat ?? '');
  const P = AF.PAL; let i = P.key.get(k); if (i) return i;
  if (P.n >= AF.PALN - 1) { AF.warnOnce('palette full'); return 1; }
  i = P.n++; P.key.set(k, i); P.hex[i] = hex;
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, Math.min(1, hsl.s * AF.SAT * (o.sat ?? 1)), hsl.l, THREE.SRGBColorSpace);
  P.albedo[i * 4] = c.r; P.albedo[i * 4 + 1] = c.g; P.albedo[i * 4 + 2] = c.b; P.albedo[i * 4 + 3] = o.jitter ?? 0.5;
  const md = o.mode === 'fire' ? 3 : o.mode === 'always' ? 2 : 1;
  if (o.emit != null) { const e = new THREE.Color(o.emit); const k2 = o.emitK ?? 1; P.emit[i * 4] = e.r * k2; P.emit[i * 4 + 1] = e.g * k2; P.emit[i * 4 + 2] = e.b * k2; P.emit[i * 4 + 3] = md + (o.edge ?? 0.5) * 0.5; }
  else P.emit[i * 4 + 3] = (o.edge ?? 0.5) * 0.5;   // 0..0.5 = edge strength, +1 night, +2 always, +3 fire flicker
  P.solid[i] = o.solid === false ? 0 : 1; P.glass[i] = o.glass ? 1 : 0; P.opaque[i] = o.glass ? 0 : 1;
  let m = o.mat; if (typeof m === 'string') { m = AF.MAT[m]; if (m === undefined) { AF.warnOnce('unknown material ' + o.mat); m = undefined; } }
  P.mat[i] = m ?? AF.guessMat(hex, o);
  P.dirty = true;
  return i;
};
// soot-blackened twin of a colour (same material). Made on demand, cached.
AF.sootOf = (i) => {
  const P = AF.PAL; let s = P.soot[i]; if (s) return s;
  if (P.n >= AF.PALN - 1) return i;
  s = P.n++; P.hex[s] = P.hex[i];
  const k = 0.2, lum = (P.albedo[i * 4] + P.albedo[i * 4 + 1] + P.albedo[i * 4 + 2]) / 3;      // soot is nearly one dark tone whatever was under it: a burnt wall is black, not speckled
  P.albedo[s * 4] = (P.albedo[i * 4] * 0.5 + lum * 0.5) * k + 0.008; P.albedo[s * 4 + 1] = (P.albedo[i * 4 + 1] * 0.5 + lum * 0.5) * k + 0.007; P.albedo[s * 4 + 2] = (P.albedo[i * 4 + 2] * 0.5 + lum * 0.5) * k + 0.007; P.albedo[s * 4 + 3] = 0.4;
  P.emit[s * 4 + 3] = 0.25;
  P.solid[s] = P.solid[i]; P.glass[s] = 0; P.opaque[s] = 1; P.mat[s] = P.mat[i] === AF.MAT.glass ? AF.MAT.stone : P.mat[i];
  P.soot[i] = s; P.soot[s] = s; P.dirty = true;
  return s;
};
AF.name = (name, hex, o) => { const i = AF.col(hex, o); AF.PAL.names[name] = i; return i; };
// A few shared colours everyone may use by name: AF.col('grass') etc.
AF.name('grass', 0x6f9a3e, { jitter: 0.9, mat: 'earth' }); AF.name('dirt', 0x7a5634, { jitter: 0.8, mat: 'earth' }); AF.name('asphalt', 0x4a4a4f, { jitter: 0.35, edge: 0.15, mat: 'stone' });
AF.name('sidewalk', 0xb8b0a2, { jitter: 0.3, mat: 'stone' }); AF.name('stone', 0x8e8a82, { jitter: 0.7, mat: 'stone' }); AF.name('water', 0x3d6f8e, { mat: 'earth' });
AF.name('cobble', 0x7d776d, { jitter: 0.85, edge: 0.7, mat: 'stone' }); AF.name('sand', 0xd8c48e, { jitter: 0.6, mat: 'earth' }); AF.name('wood', 0x7a5230, { jitter: 0.7, mat: 'wood' }); AF.name('thatch', 0xc9a655, { jitter: 0.9, mat: 'thatch' });
AF.name('white', 0xf1ede2, { jitter: 0.2, mat: 'plaster' }); AF.name('black', 0x1d1b1a, { jitter: 0.2, mat: 'metal' }); AF.name('glass', 0x9fc3cf, { glass: true, jitter: 0.1, edge: 0 });
AF.name('window', 0x3b4a58, { emit: 0xffc46b, emitK: 1.4, mode: 'night', jitter: 0.15, edge: 0.1, mat: 'glass' });
AF.name('lamp', 0xfff1c9, { emit: 0xffd48a, emitK: 3.0, mode: 'night', jitter: 0, edge: 0, mat: 'glass' });

// ---------------------------------------------------------------- input
AF.input = { down: new Set(), pressed: new Set(), released: new Set(), mouse: { x: 0, y: 0, dx: 0, dy: 0, buttons: 0, wheel: 0, clicked: false } };
{
  const I = AF.input;
  addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (!I.down.has(e.code)) I.pressed.add(e.code);
    I.down.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => { I.down.delete(e.code); I.released.add(e.code); });
  addEventListener('blur', () => { I.down.clear(); I.mouse.buttons = 0; });
  const cv = document.getElementById('cv');
  cv.addEventListener('mousedown', (e) => { I.mouse.buttons = e.buttons; I.mouse.x = e.clientX; I.mouse.y = e.clientY; I.mouse.downX = e.clientX; I.mouse.downY = e.clientY; cv.focus(); });
  addEventListener('mouseup', (e) => {
    const m = I.mouse; m.buttons = e.buttons;
    if (m.downX != null && Math.hypot(e.clientX - m.downX, e.clientY - m.downY) < 5) { m.clicked = true; m.clickX = e.clientX; m.clickY = e.clientY; m.clickButton = e.button; }
    m.downX = null;
  });
  addEventListener('mousemove', (e) => {
    const m = I.mouse;
    if (document.pointerLockElement) { m.dx += e.movementX; m.dy += e.movementY; }
    else { m.dx += e.clientX - m.x; m.dy += e.clientY - m.y; }
    m.x = e.clientX; m.y = e.clientY; m.buttons = e.buttons;
  });
  cv.addEventListener('wheel', (e) => { I.mouse.wheel += e.deltaY; e.preventDefault(); }, { passive: false });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  I.endFrame = () => { I.pressed.clear(); I.released.clear(); I.mouse.dx = 0; I.mouse.dy = 0; I.mouse.wheel = 0; I.mouse.clicked = false; };
  I.key = (code) => I.down.has(code);
  I.hit = (code) => I.pressed.has(code);
}

// ---------------------------------------------------------------- time of day
// hours 0..24. speed = game hours per real second (default: one day = 24 real minutes).
// AF.time.night (0 day .. 1 full night) and AF.time.sunDir are maintained by the atmosphere part (fallback below).
AF.time = { hours: +(AF.Q.get('hour') ?? 18.2), speed: 1 / 420, paused: false, day: 1, night: 0, sunDir: new THREE.Vector3(0.5, 0.7, 0.3).normalize() };
AF.clock = { t: 0, frame: 0, dt: 1 / 60 };

// ---------------------------------------------------------------- registries shared between parts (see CONTRACT.md)
AF.buildings = [];   // {id, name, kind, box:[x0,y0,z0,x1,y1,z1], doors:[{x,y,z,yaw}], floors:[y], owner}
AF.spots = [];       // {building, x,y,z, yaw, kind:'sit'|'stand'|'counter'|'browse'|'bed'|'work', path:[[x,z]...] from door}
AF.lights = [];      // {x,y,z, color, intensity, range, kind:'street'|'interior'|'porch'|'sign', night:true}
AF.interacts = [];   // {x,y,z, r, label, can?():bool, act():void}
AF.chimneys = [];    // {x,y,z}
AF.labels = [];      // {name, x, z, kind:'building'|'street'|'place'|'station'}
AF.viewpoints = [];  // {name, pos:[x,y,z], target:[x,y,z]}
AF.addBuilding = (b) => { b.doors = b.doors || []; AF.buildings.push(b); if (b.box && b.structure !== false) b.struct = AF.addStructure({ id: b.id, name: b.name, kind: b.kind || 'building', box: b.box, building: b }); if (b.name && b.label !== false) AF.labels.push({ name: b.name, x: (b.box[0] + b.box[3]) / 2, z: (b.box[2] + b.box[5]) / 2, kind: 'building' }); return b; };
AF.addSpot = (s) => { AF.spots.push(s); return s; };
AF.addLight = (l) => { AF.lights.push(Object.assign({ color: 0xffc67a, intensity: 1, range: 10, kind: 'interior', night: true }, l)); };
AF.addInteract = (o) => { AF.interacts.push(Object.assign({ r: 2.2 }, o)); return o; };
AF.removeInteract = (o) => { const i = AF.interacts.indexOf(o); if (i >= 0) AF.interacts.splice(i, 1); };
AF.addChimney = (x, y, z) => AF.chimneys.push({ x, y, z });
AF.addLabel = (name, x, z, kind = 'place') => AF.labels.push({ name, x, z, kind });
AF.addViewpoint = (name, pos, target) => AF.viewpoints.push({ name, pos, target });
// generic registries: AF.reg('mount', {...}) -> AF.regs.mount[]   (see CONTRACT.md for the kinds)
AF.regs = {};
AF.reg = (kind, o) => { (AF.regs[kind] = AF.regs[kind] || []).push(o); o.kind2 = kind; return o; };
AF.all = (kind) => AF.regs[kind] || (AF.regs[kind] = []);
// structures: anything that can lose its footing and come down as a whole (towers, wall runs, houses, spires, bridges)
AF.structures = [];
AF.addStructure = (s) => { s.box = s.box.slice(); s.alive = true; s.hp = 1; AF.structures.push(s); return s; };
AF.buildingAt = (x, y, z) => { for (const b of AF.buildings) { const B = b.box; if (x >= B[0] && x <= B[3] && y >= B[1] && y <= B[4] && z >= B[2] && z <= B[5]) return b; } return null; };

// ---------------------------------------------------------------- modes (who owns the camera + controls)
// AF.modes[name] = { enter(opts), exit(), update(dt) }. Only the active mode's update runs (inside tick order 150).
// Owners: 'aerial' + 'walk' -> player part; 'drive' -> vehicles part; 'ride' -> rail part.
AF.modes = {};
AF.mode = null;
AF.setMode = (name, opts = {}) => {
  const prev = AF.mode && AF.modes[AF.mode];
  if (!AF.modes[name]) { AF.warnOnce('no mode ' + name); return; }
  try { prev && prev.exit && prev.exit(name); } catch (e) { console.error('[af] mode exit', e); }
  const from = AF.mode; AF.mode = name;
  try { AF.modes[name].enter && AF.modes[name].enter(opts, from); } catch (e) { console.error('[af] mode enter', e); }
  AF.emit('mode', name, from);
};
AF.onTick('modes', 150, (dt) => { const m = AF.mode && AF.modes[AF.mode]; if (m && m.update) m.update(dt); });

// ---------------------------------------------------------------- tiny event bus
AF._ev = {};
AF.on = (n, fn) => { (AF._ev[n] = AF._ev[n] || []).push(fn); };
AF.emit = (n, ...a) => { for (const fn of AF._ev[n] || []) { try { fn(...a); } catch (e) { console.error('[af] event ' + n, e); } } };
