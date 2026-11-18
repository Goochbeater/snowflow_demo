// Seeded randomness, noise and small math helpers shared by every system.
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export class RNG {
  constructor(seed) { this.f = mulberry32(seed >>> 0); }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(a + (b - a + 1) * this.f()); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
  chance(p) { return this.f() < p; }
  normal() { return (this.f() + this.f() + this.f() - 1.5) * 1.15; }
}
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function hash1(n) { return hash2(n | 0, 9127); }
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}
export function fbm(x, y, oct = 5) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
export function ridged(x, y, oct = 5) {
  let s = 0, a = 0.5, f = 1, w = 1;
  for (let i = 0; i < oct; i++) {
    let n = 1 - Math.abs(vnoise(x * f, y * f));
    n *= n; n *= w; w = clamp(n * 1.6, 0, 1);
    s += a * n; f *= 2.1; a *= 0.5;
  }
  return s;
}
export function distToSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  let t = l2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
  t = clamp(t, 0, 1);
  const x = ax + dx * t - px, z = az + dz * t - pz;
  return [Math.sqrt(x * x + z * z), t];
}
export function polyDist(px, pz, pts) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [d] = distToSeg(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < best) best = d;
  }
  return best;
}
export function resample(pts, step) {
  const out = [pts[0].slice()];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    let d = step - carry;
    while (d < L) { const t = d / L; out.push([ax + (bx - ax) * t, az + (bz - az) * t]); d += step; }
    carry = L - (d - step);
  }
  const last = pts[pts.length - 1];
  const lo = out[out.length - 1];
  if (Math.hypot(lo[0] - last[0], lo[1] - last[1]) > step * 0.3) out.push(last.slice());
  return out;
}
export function catmull(pts, perSeg = 6) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

const MALE = ['Bjorn','Ulf','Halfdan','Ragnar','Sigurd','Ivar','Harald','Leif','Torstein','Gunnar','Arne','Erik','Hakon','Knut','Olaf','Sven','Thorkel','Vigund','Asbjorn','Eirik','Floki','Geir','Hrolf','Kjartan','Orm','Rurik','Snorri','Steinar','Toki','Ubbe','Vali','Yngvar','Agnar','Brand','Dag','Egil','Frode','Grim','Hallvard','Ketil','Ottar','Ragnvald','Skeggi','Thord','Ulfar','Bard','Einar','Gisli','Hjalmar','Isak','Kolbein','Mord','Njal','Skuli','Thrain','Vemund','Alrik','Bersi','Dyri','Folkvid','Gorm','Hauk','Jorund','Kari','Ljot','Narfi','Oddr','Rafn','Sote','Tyrfing','Asgaut','Bolli','Eyvind','Hogni','Ingimund','Kalf'];
const FEMALE = ['Sigrid','Astrid','Gudrun','Helga','Ingrid','Thora','Freydis','Gunnhild','Ragnhild','Asa','Bergljot','Dagny','Estrid','Frida','Gyda','Hild','Ingunn','Jorunn','Ketilrid','Liv','Ragna','Signy','Sol','Thordis','Unn','Vigdis','Alfhild','Borghild','Eydis','Gerd','Halla','Hervor','Inga','Katla','Lagertha','Ota','Rannveig','Saldis','Thurid','Yrsa','Aud','Bodil','Disa','Groa','Hlif','Jofrid','Oddny','Svanhild','Tove','Ulfhild','Alof','Brynja','Embla','Gjaflaug','Hallveig','Ljufa','Solveig','Torunn'];
export function makeName(rng, female, fatherName) {
  const n = female ? rng.pick(FEMALE) : rng.pick(MALE);
  const f = fatherName || rng.pick(MALE);
  const base = f.endsWith('r') && f.length > 3 ? f.slice(0, -1) : f;
  return n + ' ' + base + (female ? 'sdottir' : 'sson');
}
export const SHIP_NAMES = ['Sea-Raven','Wave-Strider','Long Serpent','Storm-Mare','Grey Wolf','Iron Gull','Surf-Dragon','Whale-Road','Blood-Eagle','Frost-Wing','Salt-Hound','Fjord-Elk','Red Mare','Hrafn','Skua','Night-Otter'];
export const RAID_TARGETS = ['the minster at Hrafnsey','the Frankish river-towns','the salt-markets of the Wendish coast','the monks of the holy island','the Saxon fort at Haugmouth','the Irish kings at Dubhlinn ford'];
