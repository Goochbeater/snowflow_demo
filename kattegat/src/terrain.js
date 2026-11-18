// Closed analytic geography: a winding, steep fjord with a narrows, a bay at its head,
// a village shelf nestled under mountains, a stream and a waterfall.
import { clamp, lerp, smoothstep, fbm, ridged, distToSeg, polyDist, vnoise } from './util.js';

// Fjord centreline capsules [x, z, radius]
export const FJORD = [
  [0, -170, 250], [-70, -620, 200], [10, -980, 82], [150, -1340, 115],
  [60, -1820, 230], [-170, -2400, 280], [-220, -3200, 320], [-200, -4200, 360],
];
export const VILLAGE_C = [0, 250];
export const STREAM = [[-150, 780], [-170, 640], [-120, 520], [-140, 420], [-105, 300], [-120, 200], [-100, 120], [-88, 60]];
export const FALLS = { x: 300, z: -120 }; // waterfall base area, east wall of the bay

function smin(a, b, k) { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); }

export function waterSDF(x, z) {
  let d = 1e9;
  for (let i = 0; i < FJORD.length - 1; i++) {
    const a = FJORD[i], b = FJORD[i + 1];
    const [dd, t] = distToSeg(x, z, a[0], a[1], b[0], b[1]);
    const r = lerp(a[2], b[2], t);
    d = smin(d, dd - r, 70);
  }
  // wobbly shoreline
  d += fbm(x * 0.008, z * 0.008, 3) * 28;
  // keep the village beach line smooth & gentle
  return d;
}

export function villageMask(x, z) {
  const d = Math.hypot((x - VILLAGE_C[0]) * 0.92, z - VILLAGE_C[1]);
  return 1 - smoothstep(270, 440, d);
}

export function heightAt(x, z) {
  const vm = villageMask(x, z);
  let dw = waterSDF(x, z);
  // straight-ish beach in front of village
  const beachD = z - 62 - fbm(x * 0.01, 3.3, 2) * 6 - Math.abs(x) * 0.04;
  dw = lerp(dw, beachD, smoothstep(0.25, 0.8, vm) * smoothstep(320, 120, Math.abs(x)) * smoothstep(-110, -20, z));
  let h;
  if (dw < 0) {
    const depth = Math.min(60, -dw * 0.35 + (-dw) * (-dw) * 0.002);
    h = -0.6 - depth * (1 - 0.6 * vm) + fbm(x * 0.02, z * 0.02, 2) * 0.8;
    h = Math.max(h, -70);
    if (dw > -12) h = lerp(h, dw * 0.12, smoothstep(-12, 0, dw));
  } else {
    // mountains everywhere but the village shelf
    const n = ridged(x * 0.0021 + 7.1, z * 0.0021 - 3.3, 6);
    const cliff = smoothstep(4, 230, dw);
    const apron = smoothstep(2, 160, dw) * (40 + 34 * n);
    const wall = Math.pow(smoothstep(70, 430, dw), 0.75) * (300 + 440 * n);
    let mtn = apron + wall + fbm(x * 0.01, z * 0.01, 4) * 18 * cliff;
    // terrace knees
    mtn += smoothstep(0, 1, cliff) * fbm(x * 0.004, z * 0.004, 3) * 60;
    // gullies and buttresses
    mtn += cliff * (ridged(x * 0.011 + 3.7, z * 0.011, 3) - 0.35) * 38 + cliff * fbm(x * 0.03, z * 0.03, 2) * 7;
    // village terrain: gentle rise from beach, hall knoll, rolling fields
    const vd = Math.hypot(x - VILLAGE_C[0], z - VILLAGE_C[1]);
    let vil = 0.6 + Math.max(0, dw) * 0.075 + Math.max(0, z - 70) * 0.03;
    vil += fbm(x * 0.012 + 11, z * 0.012, 3) * 3.0;
    vil += 7 * Math.exp(-((x - 0) ** 2 + (z - 350) ** 2) / (2 * 55 * 55)); // hall knoll
    vil += smoothstep(300, 470, vd) * 70 * (0.6 + 0.4 * n);
    const beach = dw * 0.06;
    h = lerp(mtn + beach, vil, vm);
    h = lerp(dw * 0.09, h, smoothstep(0, 22, dw));
  }
  // stream bed
  if (z > 40 && z < 800) {
    const sd = polyDist(x, z, STREAM);
    if (sd < 9) h -= (1 - sd / 9) ** 2 * 2.4;
  }
  return h;
}

// Fast grid for agent placement / terrain sampling
export class HeightGrid {
  constructor(x0, z0, x1, z1, step) {
    this.x0 = x0; this.z0 = z0; this.step = step;
    this.nx = Math.ceil((x1 - x0) / step) + 1; this.nz = Math.ceil((z1 - z0) / step) + 1;
    this.h = new Float32Array(this.nx * this.nz);
    for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++)
      this.h[j * this.nx + i] = heightAt(x0 + i * step, z0 + j * step);
  }
  get(x, z) {
    const fx = (x - this.x0) / this.step, fz = (z - this.z0) / this.step;
    if (fx < 0 || fz < 0 || fx >= this.nx - 1 || fz >= this.nz - 1) return heightAt(x, z);
    const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, n = this.nx, H = this.h;
    const a = H[j * n + i], b = H[j * n + i + 1], c = H[(j + 1) * n + i], d = H[(j + 1) * n + i + 1];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  slope(x, z) {
    const e = 2;
    const gx = (this.get(x + e, z) - this.get(x - e, z)) / (2 * e);
    const gz = (this.get(x, z + e) - this.get(x, z - e)) / (2 * e);
    return [gx, gz, Math.hypot(gx, gz)];
  }
}

// Fjord sailing line from open sea to the bay
export function fjordLine() {
  const pts = [];
  for (let i = FJORD.length - 1; i >= 0; i--) pts.push([FJORD[i][0], FJORD[i][1]]);
  return pts;
}
export { vnoise };

// Shared forest density: drives both tree placement and the dark forest-floor colour,
// so wooded slopes read as solid spruce forest at any distance.
export function forestDensity(x, z, h, slope) {
  if (h < 3 || h > 420) return 0;
  const vm = villageMask(x, z);
  if (vm > 0.6) return 0;
  const n = fbm(x * 0.0065 + 20, z * 0.0065, 3) * 0.5 + 0.5;
  let d = smoothstep(0.2, 0.5, n);
  d *= 1 - smoothstep(1.25, 1.95, slope);
  d *= 1 - smoothstep(250, 400, h + (n - 0.5) * 120);
  d *= 1 - smoothstep(0.3, 0.6, vm);
  return d;
}
