import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ===================== CONFIG =====================
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const CONFIG = {
  pitch: {
    a: 75, b: 30, hoopX: 70, hoopZ: [-7.5, 0, 7.5], hoopY: [12, 16, 12], hoopR: 1.9,
    standA: 92, standB: 50, towers: 24, boundA: 140, boundB: 96, ceiling: 78, floor: 0.9,
  },
  flight: {
    cruise: 22, boost: 38, brake: 11, accel: 1.6, decel: 2.4, grip: 3.4,
    yawRate: 1.8, pitchRate: 1.55, brakeTurn: 1.7, maxPitch: 1.25,
    bank: 0.45, maxBank: 0.65, dive: 9,
    boostDrain: 0.32, boostRegen: 0.075, slipRegen: 0.45, carryMul: 0.9,
  },
  finisherCost: 0.5,
  ball: { g: 5.5, drag: 0.07, pass: 32, shotMin: 32, shotMax: 50, catchR: 2.5, charge: 0.75 },
  bludger: { roam: 11, struck: 33, hitR: 1.35, playerGap: 6 },
  snitch: { speed: 24, jink: 35 },
  fov: { h: 96, vMax: 75 },
  difficulty: {
    rookie: { react: 0.55, aim: 0.55, keeperSpeed: 6, keeperReach: 1.45, turn: 0.82, steal: 0.3, beaterCd: 11, assist: 1.0, seekerCatch: 0.08, speed: 0.92, finisherSave: 0.0, keeperSave: 0.3 },
    pro:    { react: 0.35, aim: 0.75, keeperSpeed: 8, keeperReach: 1.75, turn: 0.95, steal: 0.5, beaterCd: 7.5, assist: 0.75, seekerCatch: 0.14, speed: 1.0, finisherSave: 0.06, keeperSave: 0.48 },
    legend: { react: 0.2, aim: 0.9, keeperSpeed: 10, keeperReach: 2.05, turn: 1.1, steal: 0.7, beaterCd: 5, assist: 0.5, seekerCatch: 0.2, speed: 1.06, finisherSave: 0.2, keeperSave: 0.66 },
  },
  tiers: {
    low:   { name: 'low',   prMax: 1.25, budget: 0.9e6, msaa: 0, shadow: 0,    crowd: 0.35, trees: 0.45, bloom: 4 },
    med:   { name: 'med',   prMax: 1.75, budget: 1.6e6, msaa: 4, shadow: 1024, crowd: 0.65, trees: 0.7,  bloom: 5 },
    high:  { name: 'high',  prMax: 2.0,  budget: 2.4e6, msaa: 4, shadow: 2048, crowd: 1.0,  trees: 1.0,  bloom: 5 },
    ultra: { name: 'ultra', prMax: 3.0,  budget: 3.8e6, msaa: 4, shadow: 2048, crowd: 1.0,  trees: 1.0,  bloom: 6 },
  },
  teams: [
    { name: 'Gryffindor', short: 'GRY', c1: '#8a1414', c2: '#d9a82a', ui: '#e0413a', letter: 'G' },
    { name: 'Slytherin',  short: 'SLY', c1: '#1b5a33', c2: '#c4c8cc', ui: '#3fae6a', letter: 'S' },
    { name: 'Ravenclaw',  short: 'RAV', c1: '#1a2c6b', c2: '#a8763a', ui: '#5b86e6', letter: 'R' },
    { name: 'Hufflepuff', short: 'HUF', c1: '#e3b02a', c2: '#2f2722', ui: '#f2c230', letter: 'H' },
  ],
};

// ===================== MATH =====================
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const smooth01 = t => t * t * (3 - 2 * t);
const smoothstep = (a, b, x) => smooth01(clamp((x - a) / (b - a), 0, 1));
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIn = t => { t = clamp(t, 0, 1); return t * t * t; };
const easeInOut = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const wrapAngle = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _rng = mulberry32(20261002);
const rnd = (a = 0, b = 1) => a + (b - a) * _rng();
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(_rng() * arr.length)];
const chance = p => Math.random() < p;

// value noise (CPU) for terrain/placement
const _perm = new Uint8Array(512);
{
  const r = mulberry32(7); const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) _perm[i] = p[i & 255];
}
function vnoise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const a = _perm[_perm[X] + Y] / 255, b = _perm[_perm[X + 1] + Y] / 255;
  const c = _perm[_perm[X] + Y + 1] / 255, d = _perm[_perm[X + 1] + Y + 1] / 255;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm2(x, y, oct = 4) {
  let s = 0, amp = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += vnoise2(x, y) * amp; n += amp; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; amp *= 0.5; }
  return s / n;
}
function ridged2(x, y, oct = 5) {
  let s = 0, amp = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { const v = 1 - Math.abs(vnoise2(x, y) * 2 - 1); s += v * v * amp; n += amp; x = x * 2.1 + 3.3; y = y * 2.1 + 7.7; amp *= 0.5; }
  return s / n;
}

// keyframe track sampler: [[t, v], ...]
function sampleTrack(track, t) {
  if (!track || !track.length) return 0;
  if (t <= track[0][0]) return track[0][1];
  for (let i = 1; i < track.length; i++) {
    const k = track[i];
    if (t <= k[0]) { const p = track[i - 1]; const u = (t - p[0]) / (k[0] - p[0] || 1); return lerp(p[1], k[1], smooth01(u)); }
  }
  return track[track.length - 1][1];
}

// shared temporaries (never hold references across calls)
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _e1 = new THREE.Euler(0, 0, 0, 'YXZ');
const _m1 = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);
const col = hex => new THREE.Color(hex);

function bezier(out, a, b, c, t) {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z);
}
function yawPitchFromDir(d) {
  const h = Math.hypot(d.x, d.z);
  return [Math.atan2(-d.x, -d.z), Math.atan2(d.y, h)];
}

// ===================== EVENTS / STORAGE =====================
const Events = {
  _h: {},
  on(n, f) { (this._h[n] ||= []).push(f); },
  emit(n, a) { const l = this._h[n]; if (l) for (const f of l) f(a); },
};
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }

const DEFAULT_SETTINGS = {
  quality: 'auto', fps: 60, sens: 1, invert: false, gyro: false, gyroSens: 1, haptics: true,
  finisherLen: 'full', trackAssist: 'high', reduceMotion: false, comfort: false, horizonLock: false, aimAssist: 'auto',
  music: 0.6, sfx: 0.9, crowd: 0.75, uiScale: 1, uiOpacity: 0.85, radar: true, voice: false,
  team: 0, opp: 1, difficulty: 'pro', length: 1, weather: 'golden', snitch: 'arcade',
};
const Settings = Object.assign({}, DEFAULT_SETTINGS, lsGet('qsb_settings', {}));
const saveSettings = () => lsSet('qsb_settings', Settings);
const SaveData = Object.assign({ best: 0, wins: 0, matches: 0, finishers: 0, bestRank: 0, unlocked: { thunder: false, starfall: false }, seenHints: false }, lsGet('qsb_save', {}));
const persist = () => lsSet('qsb_save', SaveData);
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
