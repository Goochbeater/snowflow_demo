// ===== 02-voxel: world grid, heightmap, models, meshers, material, collision  (OWNER: coordinator) =====
// Units: metres. Block (voxel) = 0.25 m. World x,z in [-300, 300), y in [-16, 112).
// Ground is a HEIGHTMAP of block columns (W.H, W.C); everything standing on it is VOXELS (W.set / W.fill).
const VS = 0.25, INV = 4;
const NX = 2400, NY = 512, NZ = 2400, CS = 16;
const X0 = -300, Y0 = -16, Z0 = -300;
const CX = NX / CS, CY = NY / CS, CZ = NZ / CS;
const W = AF.W = { VS, NX, NY, NZ, X0, Y0, Z0, CS };
W.chunks = new Array(CX * CY * CZ).fill(null);
W.H = new Int16Array(NX * NZ);        // ground top in blocks above y=0 (top surface y = H*0.25)
W.C = new Uint16Array(NX * NZ);       // top colour index
W.S = new Uint16Array(NX * NZ);       // side colour index (0 = use top colour for the top block, dirt below)
W.C.fill(AF.col('grass'));
const GOFF = -Y0 * INV;               // block index (by) of the cell sitting just above y=0

W.bx = (x) => Math.floor((x - X0) * INV);
W.by = (y) => Math.floor((y - Y0) * INV);
W.bz = (z) => Math.floor((z - Z0) * INV);
W.xOf = (bx) => X0 + bx * VS; W.yOf = (by) => Y0 + by * VS; W.zOf = (bz) => Z0 + bz * VS;

W.get = (bx, by, bz) => {
  if (bx < 0 || by < 0 || bz < 0 || bx >= NX || by >= NY || bz >= NZ) return 0;
  const ch = W.chunks[((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4)];
  return ch ? ch[((bx & 15) * 16 + (by & 15)) * 16 + (bz & 15)] : 0;
};
W.live = false;                       // true once the world is meshed: from then on every W.set re-meshes what it touches
W.set = (bx, by, bz, c) => {
  if (bx < 0 || by < 0 || bz < 0 || bx >= NX || by >= NY || bz >= NZ) return;
  const ci = ((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4);
  let ch = W.chunks[ci];
  if (!ch) { if (!c) return; if (W.live && W.snap[ci] === 0) W.orig.set(ci, null); ch = W.chunks[ci] = new Uint16Array(4096); }
  const li = ((bx & 15) * 16 + (by & 15)) * 16 + (bz & 15), old = ch[li];
  if (old === c) return;
  if (W.live && W.snap[ci] !== 2) {
    // first change since boot (or since it was last fully mended): keep the original so magic can put it back
    if (W.snap[ci] === 0 && !W.orig.has(ci)) W.orig.set(ci, ch.slice());
    W.snap[ci] = 2; const fk = (((bx >> 4) >> 2) << 10) + ((bz >> 4) >> 2); W.cellDmg.set(fk, (W.cellDmg.get(fk) || 0) + 1);
  }
  ch[li] = c;
  if (W.live) W.touch(bx, by, bz, ci, old, c);
};
W.snap = new Uint8Array(CX * CY * CZ);   // per chunk: 0 untouched · 1 has an original and equals it · 2 differs from its original
W.orig = new Map();                       // chunk index -> Uint16Array(4096) original (null = the chunk did not exist)
W.cellDmg = new Map();                    // 16 m ground cell -> number of chunks in it that differ from their original
W.origT = new Map();                      // terrain tile -> { H, C } original heights/colours
W.dirty = new Set();
// metre helpers. fill() is [x0,x1) etc, snapped to the block grid with Math.round.
W.setM = (x, y, z, c) => W.set(W.bx(x), W.by(y), W.bz(z), c);
W.getM = (x, y, z) => W.get(W.bx(x), W.by(y), W.bz(z));
W.fillB = (bx0, by0, bz0, bx1, by1, bz1, c) => {
  if (bx0 > bx1) [bx0, bx1] = [bx1, bx0]; if (by0 > by1) [by0, by1] = [by1, by0]; if (bz0 > bz1) [bz0, bz1] = [bz1, bz0];
  for (let x = bx0; x < bx1; x++) for (let y = by0; y < by1; y++) for (let z = bz0; z < bz1; z++) W.set(x, y, z, c);
};
const rb = (v, o) => Math.round((v - o) * INV);
W.fill = (x0, y0, z0, x1, y1, z1, c) => W.fillB(rb(x0, X0), rb(y0, Y0), rb(z0, Z0), rb(x1, X0), rb(y1, Y0), rb(z1, Z0), c);
W.clear = (x0, y0, z0, x1, y1, z1) => W.fill(x0, y0, z0, x1, y1, z1, 0);
// hollow box shell (walls only, no floor/ceiling) with thickness t metres
W.walls = (x0, y0, z0, x1, y1, z1, c, t = 0.25) => {
  W.fill(x0, y0, z0, x1, y1, z0 + t, c); W.fill(x0, y0, z1 - t, x1, y1, z1, c);
  W.fill(x0, y0, z0, x0 + t, y1, z1, c); W.fill(x1 - t, y0, z0, x1, y1, z1, c);
};

// ---- heightmap
W.col = (x, z) => { const bx = W.bx(x), bz = W.bz(z); return (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) ? -1 : bx * NZ + bz; };
W.hB = (bx, bz) => (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) ? 0 : W.H[bx * NZ + bz];
W.groundY = (x, z) => { const i = W.col(x, z); return i < 0 ? 0 : W.H[i] * VS; };
// set ground rect [x0,x1) x [z0,z1) to height hBlocks with top colour c (and optional side colour s)
W.ground = (x0, z0, x1, z1, hBlocks, c, s) => {
  const a = rb(Math.min(x0, x1), X0), b = rb(Math.max(x0, x1), X0), d = rb(Math.min(z0, z1), Z0), e = rb(Math.max(z0, z1), Z0);
  for (let bx = Math.max(0, a); bx < Math.min(NX, b); bx++) for (let bz = Math.max(0, d); bz < Math.min(NZ, e); bz++) {
    const i = bx * NZ + bz; if (hBlocks != null) W.H[i] = hBlocks; if (c) W.C[i] = c; if (s != null) W.S[i] = s;
  }
  W.tDirty = true;
};
// paint only the colour
W.paint = (x0, z0, x1, z1, c) => W.ground(x0, z0, x1, z1, null, c);
// per-column callback over a rect: fn(bx, bz, i, x, z)
W.eachCol = (x0, z0, x1, z1, fn) => {
  const a = Math.max(0, rb(x0, X0)), b = Math.min(NX, rb(x1, X0)), d = Math.max(0, rb(z0, Z0)), e = Math.min(NZ, rb(z1, Z0));
  for (let bx = a; bx < b; bx++) for (let bz = d; bz < e; bz++) fn(bx, bz, bx * NZ + bz, X0 + (bx + 0.5) * VS, Z0 + (bz + 0.5) * VS);
};

// ---------------------------------------------------------------- models (dense small voxel grids)
// const m = new AF.Model(w,h,d); m.set(x,y,z,c); m.box(x0,y0,z0,x1,y1,z1,c) [exclusive max]
// geometry = AF.meshModel(m, { vs: 1/16, anchor:[0.5,0,0.5] })   (anchor = fraction of size at the local origin)
class Model {
  constructor(w, h, d) { this.w = w; this.h = h; this.d = d; this.v = new Uint16Array(w * h * d); }
  idx(x, y, z) { return (x * this.h + y) * this.d + z; }
  in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  get(x, y, z) { return this.in(x, y, z) ? this.v[(x * this.h + y) * this.d + z] : 0; }
  set(x, y, z, c) { x |= 0; y |= 0; z |= 0; if (this.in(x, y, z)) this.v[(x * this.h + y) * this.d + z] = c; return this; }
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = Math.max(0, Math.min(x0, x1) | 0); x < Math.min(this.w, Math.max(x0, x1)); x++)
      for (let y = Math.max(0, Math.min(y0, y1) | 0); y < Math.min(this.h, Math.max(y0, y1)); y++)
        for (let z = Math.max(0, Math.min(z0, z1) | 0); z < Math.min(this.d, Math.max(z0, z1)); z++) this.v[(x * this.h + y) * this.d + z] = c;
    return this;
  }
  sphere(cx, cy, cz, r, c, fn) { // fn(x,y,z) optional filter/colour picker returning colour or 0
    for (let x = Math.floor(cx - r); x <= cx + r; x++) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz;
      if (dx * dx + dy * dy + dz * dz <= r * r) { const k = fn ? fn(x, y, z) : c; if (k) this.set(x, y, z, k); }
    }
    return this;
  }
  line(x0, y0, z0, x1, y1, z1, c, r = 0) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0))) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t; if (r > 0) this.sphere(x, y, z, r, c); else this.set(Math.floor(x), Math.floor(y), Math.floor(z), c); }
    return this;
  }
  // mirror x: copy left half onto right half
  mirrorX() { for (let x = 0; x < this.w >> 1; x++) for (let y = 0; y < this.h; y++) for (let z = 0; z < this.d; z++) this.set(this.w - 1 - x, y, z, this.get(x, y, z)); return this; }
}
AF.Model = Model;

// stamp a Model into the WORLD grid: model voxel = world block. rot = 0..3 quarter turns about Y (around model origin corner).
// (x,y,z) metres = where model voxel (0,0,0)'s min corner lands (before rotation). skipAir default true.
W.stamp = (m, x, y, z, rot = 0, opts = {}) => {
  const bx = rb(x, X0), by = rb(y, Y0), bz = rb(z, Z0);
  for (let i = 0; i < m.w; i++) for (let j = 0; j < m.h; j++) for (let k = 0; k < m.d; k++) {
    const c = m.v[(i * m.h + j) * m.d + k]; if (!c && opts.skipAir !== false) continue;
    let u = i, w = k;
    if (rot === 1) { u = k; w = m.w - 1 - i; } else if (rot === 2) { u = m.w - 1 - i; w = m.d - 1 - k; } else if (rot === 3) { u = m.d - 1 - k; w = i; }
    W.set(bx + u, by + j, bz + w, c);
  }
};

// ---------------------------------------------------------------- geometry emission (shared by all meshers)
// Vertex layout: position(3) uv(2: block units, in-plane) aPal(1: palette index) aAN(1: ao*8 + normalIndex)
// normal index: 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z
class GeoBuf {
  constructor() { this.p = []; this.uv = []; this.pal = []; this.an = []; this.idx = []; this.n = 0; }
  quad(v0, v1, v2, v3, uv0, uv1, uv2, uv3, pal, nIdx, ao) { // v* = [x,y,z], ao = [a0..a3] 0..3 ; CCW when seen from outside
    const b = this.n;
    this.p.push(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2]);
    this.uv.push(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1], uv3[0], uv3[1]);
    this.pal.push(pal, pal, pal, pal);
    this.an.push(ao[0] * 8 + nIdx, ao[1] * 8 + nIdx, ao[2] * 8 + nIdx, ao[3] * 8 + nIdx);
    if (ao[0] + ao[2] < ao[1] + ao[3]) this.idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b);
    else this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    this.n += 4;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    // compact types (shader reads them as floats): 12 + 4 + 2 + 1 = 19 bytes per vertex
    g.setAttribute('aBU', new THREE.BufferAttribute(new Int16Array(this.uv), 2));
    g.setAttribute('aPal', new THREE.BufferAttribute(new Uint16Array(this.pal), 1));
    g.setAttribute('aAN', new THREE.BufferAttribute(new Uint8Array(this.an), 1));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}
AF.GeoBuf = GeoBuf;

// Greedy mesher over a padded dense grid accessor.
// dims [sx,sy,sz]; get(x,y,z) valid for -1..s (padding); scale (m per voxel); origin [ox,oy,oz] (metres of voxel 0 corner);
// uvOff [ux,uy,uz] added to voxel coords for uv continuity; out: {opaque:GeoBuf, glass:GeoBuf}
const AOK = [0, 1, 2, 3];
// pad: Uint16Array of (sx+2)*(sy+2)*(sz+2) with a 1-voxel border, index ((x+1)*(sy+2)+(y+1))*(sz+2)+(z+1).
// 65535 in the pad = "solid, never drawn" (underground). sliceCnt (optional): [[per-x count],[per-y],[per-z]] of drawable voxels.
function greedyPad(sx, sy, sz, pad, scale, origin, uvOff, out, flat, sliceCnt) {
  const P = AF.PAL, OP = P.opaque, GL = P.glass, dims = [sx, sy, sz];
  const SZ = sz + 2, SX = (sy + 2) * SZ, stride = [SX, SZ, 1];
  const I0 = SX + SZ + 1;
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3, v = (d + 2) % 3;
    const du = dims[u], dv = dims[v], su = stride[u], sv = stride[v], sd = stride[d];
    const mask = new Int32Array(du * dv);
    const cnt = sliceCnt ? sliceCnt[d] : null;
    for (let side = 0; side < 2; side++) {
      const dir = side === 0 ? 1 : -1, off = sd * dir;
      const nIdx = d * 2 + side;
      for (let k = 0; k < dims[d]; k++) {
        if (cnt && !cnt[k]) continue;
        let any = false;
        const base = I0 + k * sd;
        for (let j = 0; j < dv; j++) {
          const rowBase = base + j * sv, mrow = j * du;
          for (let i = 0; i < du; i++) {
            const idx = rowBase + i * su;
            const c = pad[idx];
            let key = 0;
            if (c !== 0 && c !== 65535) {
              const f = idx + off, nb = pad[f];
              const glass = GL[c] === 1;
              const visible = glass ? (nb === 0) : !(nb === 65535 || (nb !== 0 && OP[nb] === 1));
              if (visible) {
                let ao = 255;
                if (!glass && !flat) {
                  let t;
                  t = pad[f - su]; const s10 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + su]; const s12 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f - sv]; const s01 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + sv]; const s21 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f - su - sv]; const c00 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + su - sv]; const c20 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + su + sv]; const c22 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f - su + sv]; const c02 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  const a0 = (s10 && s01) ? 0 : 3 - (s10 + s01 + c00), a1 = (s12 && s01) ? 0 : 3 - (s12 + s01 + c20);
                  const a2 = (s12 && s21) ? 0 : 3 - (s12 + s21 + c22), a3 = (s10 && s21) ? 0 : 3 - (s10 + s21 + c02);
                  ao = a0 | (a1 << 2) | (a2 << 4) | (a3 << 6);
                }
                key = (c << 8 | ao) + 1; any = true;
              }
            }
            mask[mrow + i] = key;
          }
        }
        if (!any) continue;
        const plane = k + (side === 0 ? 1 : 0);
        for (let j = 0; j < dv; j++) for (let i = 0; i < du;) {
          const key = mask[i + j * du];
          if (!key) { i++; continue; }
          const ab = (key - 1) & 255;
          const canU = ((ab & 3) === ((ab >> 2) & 3)) && (((ab >> 6) & 3) === ((ab >> 4) & 3));
          const canV = ((ab & 3) === ((ab >> 6) & 3)) && (((ab >> 2) & 3) === ((ab >> 4) & 3));
          let w = 1; if (canU) while (i + w < du && mask[i + w + j * du] === key) w++;
          let h = 1, done = false;
          while (canV && j + h < dv) { for (let q = 0; q < w; q++) if (mask[i + q + (j + h) * du] !== key) { done = true; break; } if (done) break; h++; }
          const c = (key - 1) >> 8;
          const ao = [ab & 3, (ab >> 2) & 3, (ab >> 4) & 3, (ab >> 6) & 3];
          const corner = (a, b) => { const p = [0, 0, 0]; p[d] = plane; p[u] = a; p[v] = b; return [origin[0] + p[0] * scale, origin[1] + p[1] * scale, origin[2] + p[2] * scale]; };
          const uvc = (a, b) => [a + uvOff[u], b + uvOff[v]];
          const p0 = corner(i, j), p1 = corner(i + w, j), p2 = corner(i + w, j + h), p3 = corner(i, j + h);
          const t0 = uvc(i, j), t1 = uvc(i + w, j), t2 = uvc(i + w, j + h), t3 = uvc(i, j + h);
          const buf = GL[c] ? out.glass : out.opaque;
          if (side === 0) buf.quad(p0, p1, p2, p3, t0, t1, t2, t3, c, nIdx, ao);
          else buf.quad(p0, p3, p2, p1, t0, t3, t2, t1, c, nIdx, [ao[0], ao[3], ao[2], ao[1]]);
          for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) mask[i + a + (j + b) * du] = 0;
          i += w;
        }
      }
    }
  }
}
const padModel = (m) => {
  const H2 = m.h + 2, D2 = m.d + 2, pad = new Uint16Array((m.w + 2) * H2 * D2);
  for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) {
    const src = (x * m.h + y) * m.d, dst = ((x + 1) * H2 + (y + 1)) * D2 + 1;
    for (let z = 0; z < m.d; z++) pad[dst + z] = m.v[src + z];
  }
  return pad;
};
// compat: greedy with a get(x,y,z) accessor valid on -1..s
function greedy(sx, sy, sz, get, scale, origin, uvOff, out, flat) {
  const H2 = sy + 2, D2 = sz + 2, pad = new Uint16Array((sx + 2) * H2 * D2);
  for (let x = -1; x <= sx; x++) for (let y = -1; y <= sy; y++) for (let z = -1; z <= sz; z++) pad[((x + 1) * H2 + (y + 1)) * D2 + (z + 1)] = get(x, y, z) || 0;
  greedyPad(sx, sy, sz, pad, scale, origin, uvOff, out, flat);
}
AF.greedy = greedy;

// 2x downsampled, AO-free version of a model geometry (used for distant regions). Cached on the geometry.
AF.lodOf = (g) => {
  if (g.userData.lod !== undefined) return g.userData.lod;
  const src = g.userData.src;
  if (!src || src.vs >= 0.45 || src.m.w * src.m.h * src.m.d > 4e6) { g.userData.lod = null; return null; }   // already coarse: keep as is
  const m = src.m, F = src.vs >= 0.2 ? 2 : Math.max(2, Math.round(0.25 / src.vs)), w = Math.ceil(m.w / F), h = Math.ceil(m.h / F), d = Math.ceil(m.d / F);
  const L = new Model(w, h, d);
  const cnt = new Map();
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) {
    cnt.clear(); let best = 0, bn = 0;
    for (let a = 0; a < F; a++) for (let b = 0; b < F; b++) for (let c = 0; c < F; c++) {
      const v = m.get(F * x + a, F * y + b, F * z + c); if (!v || AF.PAL.glass[v]) continue;
      const k = (cnt.get(v) || 0) + 1; cnt.set(v, k); if (k > bn) { bn = k; best = v; }
    }
    if (best) L.v[(x * h + y) * d + z] = best;
  }
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const vs2 = src.vs * F, an = src.anchor;
  greedyPad(w, h, d, padModel(L), vs2, [-m.w * src.vs * an[0], -m.h * src.vs * an[1], -m.d * src.vs * an[2]], [0, 0, 0], out, true);
  g.userData.lod = out.opaque.n ? out.opaque.geometry() : null;
  return g.userData.lod;
};
AF.meshModel = (m, o = {}) => {
  const vs = o.vs ?? 1 / 16, an = o.anchor ?? [0.5, 0, 0.5];
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const origin = [-m.w * vs * an[0], -m.h * vs * an[1], -m.d * vs * an[2]];
  greedyPad(m.w, m.h, m.d, padModel(m), vs, origin, [0, 0, 0], out, o.flat);
  const g = out.opaque.geometry();
  g.userData.vs = vs; g.userData.src = { m, vs, anchor: an };
  if (out.glass.n) g.userData.glass = out.glass.geometry();
  return g;   // g.userData.glass holds the transparent part (if any)
};
// Build a THREE.Mesh (with glass child) from a model; castShadow on by default
AF.modelMesh = (m, o = {}) => {
  const g = m.isBufferGeometry ? m : AF.meshModel(m, o);
  const mesh = new THREE.Mesh(g, AF.mat.voxel); mesh.castShadow = o.cast ?? true; mesh.receiveShadow = true;
  if (g.userData.glass) { const gm = new THREE.Mesh(g.userData.glass, AF.mat.glass); gm.renderOrder = 2; mesh.add(gm); }
  return mesh;
};

// ---------------------------------------------------------------- the voxel material
// MeshStandardMaterial with palette lookup, baked AO, per-block edge + jitter, and night/always emissive.
AF.mat = {};
{
  const P = AF.PAL;
  const texA = new THREE.DataTexture(P.albedo, 128, 64, THREE.RGBAFormat, THREE.FloatType);
  const texE = new THREE.DataTexture(P.emit, 128, 64, THREE.RGBAFormat, THREE.FloatType);
  for (const t of [texA, texE]) { t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; }
  // per colour: R = material, G = wet (0..255: damp stone, puddles, gutters — set with AF.PAL.setWet(colourIndex, 0..1))
  const palM = new Uint8Array(128 * 64 * 4); P.wet = new Uint8Array(128 * 64);
  const fillM = () => { for (let i = 0; i < 8192; i++) { palM[i * 4] = P.mat[i]; palM[i * 4 + 1] = P.wet[i]; } };
  P.setWet = (c, k = 1) => { if (c > 0 && c < 8192) { P.wet[c] = Math.round(Math.max(0, Math.min(1, k)) * 255); P.dirty = true; } };
  fillM();
  const texM = new THREE.DataTexture(palM, 128, 64, THREE.RGBAFormat, THREE.UnsignedByteType); texM.minFilter = texM.magFilter = THREE.NearestFilter; texM.generateMipmaps = false; texM.unpackAlignment = 1; texM.needsUpdate = true;
  AF.PAL.upload = () => { fillM(); texA.needsUpdate = true; texE.needsUpdate = true; texM.needsUpdate = true; P.dirty = false; };
  AF.onTick('palette', 1, () => { if (P.dirty) AF.PAL.upload(); });
  // fire-glow map: 128x128 over the whole world (R = heat 0..1, G = height of the fire). Written by 06-fire, read by every voxel surface.
  const glowData = new Uint8Array(128 * 128 * 4);
  const glowTex = new THREE.DataTexture(glowData, 128, 128, THREE.RGBAFormat, THREE.UnsignedByteType);
  glowTex.minFilter = glowTex.magFilter = THREE.LinearFilter; glowTex.generateMipmaps = false; glowTex.needsUpdate = true;
  AF.glow = { data: glowData, tex: glowTex, N: 128 };
  const U = AF.mat.uniforms = { uPalA: { value: texA }, uPalE: { value: texE }, uNight: { value: 0 }, uEmitBoost: { value: 1 }, uEdge: { value: 1 }, uAO: { value: new THREE.Vector4(0.42, 0.62, 0.82, 1.0) }, uTime: { value: 0 }, uGlow: { value: glowTex }, uGlowK: { value: 2.2 }, uSkyH: { value: new THREE.Color(0.7, 0.6, 0.6) }, uSkyZ: { value: new THREE.Color(0.3, 0.35, 0.6) }, uHeat: { value: null }, uSheetK: { value: 0 }, uSee: { value: new THREE.Vector4(0, 0, 0, 0) }, uSee2: { value: new THREE.Vector4(0, -99, 0, 0) }, uPalM: { value: texM }, uDetail: { value: +(AF.Q.get('detail') ?? 1) } };
  AF.onTick('vox-time', 2, (dt, t) => { U.uTime.value = t; { const fs = (AF.atmos && AF.atmos.fireScreenRaw) || 0; U.uSheetK.value += (Math.min(1, Math.max(0, (fs - 0.16) / 0.3)) - U.uSheetK.value) * Math.min(1, dt * 2.5); } { const D = AF.dragon, on = AF.playing && D && D.alive && !(AF.cine && AF.cine.active) && !AF.Q.has('nosee'); if (D) U.uSee.value.set(D.pos.x, D.pos.y + 0.7, D.pos.z, on ? 1 : 0); const cp = AF.camera.position; let roof = 0; if (on && AF.rayVox) { const h = AF.rayVox(cp.x, cp.y, cp.z, 0, 1, 0, 7, true); if (h && !h.water) roof = 1; else { const h2 = AF.rayVox(cp.x, cp.y, cp.z, 0, -1, 0, 3.5, true); if (h2 && !h2.ground && !h2.water && cp.y - h2.y < 3.2 && h2.y > W.groundY(cp.x, cp.z) + 1.5) roof = 1; } } U.uSee2.value.x += (roof * 11 - U.uSee2.value.x) * Math.min(1, dt * 7); U.uSee2.value.y = W.groundY(cp.x, cp.z) + 0.45; } const fg = AF.scene && AF.scene.fog; if (fg) U.uSkyH.value.copy(fg.color); if (AF.hemi) U.uSkyZ.value.copy(AF.hemi.color).multiplyScalar(Math.min(1, 0.25 + AF.hemi.intensity * 0.45)); });
  const vsHead = `
    attribute float aPal; attribute float aAN; attribute vec2 aBU;
    uniform sampler2D uPalA; uniform sampler2D uPalE; uniform sampler2D uPalM; varying float vMt; varying float vWet;
    varying vec3 vAlb; varying vec4 vEmi; varying vec2 vBU; varying float vAO; varying float vJit; varying float vNI; varying vec3 vWP; varying float vNoSoot;
  `;
  const wpCode = `
    vNoSoot = 0.0;
    #ifdef USE_INSTANCING
      vNoSoot = 1.0;
    #endif
    {
      vec4 afw = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        afw = instanceMatrix * afw;
      #endif
      vWP = (modelMatrix * afw).xyz;
    }
  `;
  const nrmCode = `
    float nIdx = mod(aAN, 8.0);
    vec3 objectNormal = nIdx < 0.5 ? vec3(1.,0.,0.) : nIdx < 1.5 ? vec3(-1.,0.,0.) : nIdx < 2.5 ? vec3(0.,1.,0.) : nIdx < 3.5 ? vec3(0.,-1.,0.) : nIdx < 4.5 ? vec3(0.,0.,1.) : vec3(0.,0.,-1.);
    #ifdef USE_TANGENT
      vec3 objectTangent = vec3( tangent.xyz );
    #endif
  `;
  const palCode = `
    vec2 pUV = vec2((mod(aPal, 128.0) + 0.5) / 128.0, (floor(aPal / 128.0) + 0.5) / 64.0);
    vec4 pa = texture2D(uPalA, pUV); vec4 pe = texture2D(uPalE, pUV);
    vAlb = pa.rgb; vJit = pa.a; vEmi = pe; vBU = aBU; vNI = mod(aAN, 8.0);
    vAO = floor(aAN / 8.0 + 0.001);
    { vec4 pm = texture2D(uPalM, pUV); vMt = floor(pm.r * 255.0 + 0.5); vWet = pm.g; }
  `;
  const fsHead = `
    uniform float uNight; uniform float uEmitBoost; uniform float uEdge; uniform vec4 uAO; uniform float uTime; uniform sampler2D uGlow; uniform float uGlowK;
    varying vec3 vAlb; varying vec4 vEmi; varying vec2 vBU; varying float vAO; varying float vJit; varying float vNI; varying vec3 vWP;
    float afHash(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
    uniform sampler2D uHeat; uniform float uSheetK; float afHeat; vec4 afHF; float afSoot; varying float vNoSoot;
    uniform vec4 uSee; uniform vec4 uSee2; uniform float uDetail; uniform vec3 uSkyH; uniform vec3 uSkyZ; varying float vMt; varying float vWet;
    float afH; float afBK; float afEmK; float afRough; float afMetal;
    float afVN(vec2 p){ vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f); return mix(mix(afHash(vec3(i, 1.7)), afHash(vec3(i + vec2(1., 0.), 1.7)), f.x), mix(afHash(vec3(i + vec2(0., 1.), 1.7)), afHash(vec3(i + vec2(1., 1.), 1.7)), f.x), f.y); }
  `;
  const colCode = `
    {
      // SEE-THROUGH: whatever stands between the lens and the dragon dissolves in a soft-edged tunnel, so a roof or a wall never hides it
      if (uSee.w > 0.5) { vec3 sab = uSee.xyz - cameraPosition; float sL = length(sab); vec3 sd = sab / max(sL, 0.01); float st = dot(vWP - cameraPosition, sd);
        if (st > 0.2 && st < sL - 1.6) { float sr = length(vWP - cameraPosition - sd * st), sR = 0.9 + st * 0.34;
          // when the lens is under a roof (backed into a house), the whole room round it goes, not just a porthole: the player sees the street, never a floor and furniture
          if (uSee2.x > 0.05 && vWP.y > uSee2.y) sR = max(sR, uSee2.x * (1.0 - smoothstep(3.0, 9.0, st)));
          // a CLEAN cut: gone inside, there outside, and only a hair-thin broken edge between (no dot screen over the picture)
          float sk = 1.0 - smoothstep(sR * 0.93, sR, sr);
          if (sk > 0.0) { float dth = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); if (sk >= 0.999 || dth < sk) discard; } } }
      float ao = vAO < 0.5 ? uAO.x : vAO < 1.5 ? uAO.y : vAO < 2.5 ? uAO.z : uAO.w;
      vec2 cell = floor(vBU + 0.0005);
      vec2 f = vBU - cell;
      vec2 fw = fwidth(vBU);
      float fwm = max(fw.x, fw.y);
      float near = 1.0 - smoothstep(0.08, 0.45, fwm);
      float edgeK = fract(vEmi.a) * 2.0 * uEdge;
      vec2 e2 = min(f, 1.0 - f) / max(fw, vec2(1e-4));
      float edge = 1.0 - smoothstep(0.6, 1.8, min(e2.x, e2.y));
      float hl = (1.0 - smoothstep(0.5, 1.6, f.x / max(fw.x,1e-4))) * 0.5 + (1.0 - smoothstep(0.5, 1.6, (1.0 - f.y) / max(fw.y,1e-4))) * 0.5;
      float j = (afHash(vec3(cell, vNI * 7.0 + 3.0)) - 0.5) * 2.0;
      float shade = 1.0 + j * vJit * 0.09 * (0.35 + 0.65 * near);
      shade *= 1.0 - edge * 0.22 * edgeK * near;
      shade *= 1.0 + hl * 0.05 * edgeK * near;
      // ---- MATERIAL DETAIL (sub-voxel): what the surface is made of, drawn at 3 cm, with relief for the light to catch
      afH = 0.5; afBK = 0.0; afEmK = 1.0; afRough = -1.0; afMetal = 0.0;
      vec3 dTint = vec3(1.0); float afWood = 0.0;
      if (uDetail > 0.01) {
        vec2 hv = vNI < 3.5 ? vBU.yx : vBU.xy;                      // walls: (along, up)
        bool topF = vNI > 1.5 && vNI < 3.5;
        vec2 fh = fwidth(hv); float px = max(max(fh.x, fh.y), 1e-4);  // voxels per pixel
        float lodB = 1.0 - smoothstep(0.38, 1.0, px);              // block-size features
        float lodM = 1.0 - smoothstep(0.14, 0.38, px);              // third-of-a-block
        float lodF = 1.0 - smoothstep(0.06, 0.17, px);             // fine grain
        float aa = px * 1.4;
        float det = 1.0;
        if (px < 1.0) {      // (perf) none of this is visible once a block is about a pixel: skip it for the far city
        if (vMt < 0.5) {                                            // STONE: coursed ashlar on walls, flags underfoot
          vec2 q; vec2 id;
          if (topF) { vec2 c2 = hv * 0.5; float r2 = floor(c2.y); c2.x += mod(r2, 2.0) * 0.5; id = floor(c2); q = fract(c2) * 2.0; q = min(q, 2.0 - q); }
          else { float row = floor(hv.y * 0.5); float bx = hv.x + mod(row, 2.0) * 2.0; id = vec2(floor(bx * 0.25), row); q = vec2(fract(bx * 0.25) * 4.0, fract(hv.y * 0.5) * 2.0); q = min(q, vec2(4.0, 2.0) - q); }
          float d = min(q.x, q.y);
          float mort = 1.0 - smoothstep(0.045, 0.11 + aa, d);
          float tint = afHash(vec3(id, 5.0)) - 0.5;
          det = (1.0 + tint * 0.17 * lodB) * (1.0 - mort * 0.30 * lodB);
          det *= 1.0 + (afHash(vec3(floor(hv * 7.0), 9.0)) - 0.5) * 0.08 * lodF + (afVN(hv * 0.45) - 0.5) * 0.10 * lodB;
          afH = 1.0 - mort; afBK = 0.035 * lodB; afRough = 0.92;
        } else if (vMt < 1.5 || vMt > 11.5) {                       // WOOD: boards with a seam every block, wavy grain
          float seam, gr;
          if (topF) { float f1 = fract(hv.y); seam = 1.0 - smoothstep(0.03, 0.07 + aa, min(f1, 1.0 - f1)); float rowp = floor(hv.y); float jb = fract(hv.x / 7.0 + afHash(vec3(rowp, 3.0, 1.0))) * 7.0; seam = max(seam, 1.0 - smoothstep(0.03, 0.07 + aa, min(jb, 7.0 - jb))); gr = afHash(vec3(floor(hv.x * 1.2 + rowp * 3.7), floor(hv.y * 11.0 + sin(hv.x * 2.3) * 1.2), 2.0)); det = 1.0 + (afHash(vec3(rowp, floor((hv.x + afHash(vec3(rowp, 3.0, 1.0)) * 7.0) / 7.0), 4.0)) - 0.5) * 0.14 * lodB; }
          else { float f1 = fract(hv.y); seam = (1.0 - smoothstep(0.02, 0.06 + aa, min(f1, 1.0 - f1))) * 0.55; gr = afHash(vec3(floor(hv.x * 1.2), floor(hv.y * 11.0 + sin(hv.x * 2.3) * 1.2), 2.0)); det = 1.0 + (afHash(vec3(floor(hv.y), floor(hv.x * 0.25), 4.0)) - 0.5) * 0.10 * lodB; }
          det *= (1.0 - seam * 0.30 * lodB) * (1.0 + (gr - 0.5) * 0.15 * lodF);
          { float peg = 1.0 - smoothstep(0.07, 0.11, length(fract(hv * vec2(0.5, 1.0) + vec2(0.25, 0.5)) - 0.5)); afWood = ((gr - 0.42) * 0.9 * lodF + (afVN(hv * vec2(0.7, 5.0)) - 0.45) * 0.7 * lodM - peg * 0.5 * lodM) * (1.0 - seam); }      // dark timber cannot show a multiplied grain: add it
          afH = 1.0 - seam; afBK = 0.022 * lodB; afRough = 0.82;
        } else if (vMt < 2.5) {                                     // THATCH: combed straw, trimmed in layers
          vec2 sv = topF ? hv : hv; float st = afHash(vec3(floor(sv.x * 9.0), floor(sv.y * 0.7 + afHash(vec3(floor(sv.x * 9.0), 1.0, 1.0)) * 3.0), 3.0)) - 0.5;
          float lay = fract(sv.y * 0.5); float trim = (1.0 - smoothstep(0.0, 0.16 + aa, lay)) * (topF ? 0.4 : 1.0);
          det = (1.0 + st * 0.22 * lodF + (afHash(vec3(floor(sv.x * 2.0), floor(sv.y * 0.5), 6.0)) - 0.5) * 0.12 * lodB) * (1.0 - trim * 0.24 * lodB);
          afH = 1.0 - trim; afBK = 0.03 * lodB; afRough = 0.97;
        } else if (vMt < 3.5) {                                     // CLOTH: weave and soft folds
          det = 1.0 + sin(hv.x * 44.0) * sin(hv.y * 44.0) * 0.07 * lodF + sin(hv.x * 2.1 + sin(hv.y * 0.7) * 1.5) * 0.06 * lodB;
          afRough = 0.95;
        } else if (vMt < 4.5) {                                     // LEAF: dappled leaves
          float lf = afHash(vec3(floor(hv * 3.0 + vec2(sin(hv.y * 2.0), cos(hv.x * 2.0)) * 0.3), 4.0));
          det = 1.0 + (lf - 0.45) * 0.26 * lodM + (afVN(hv * 0.6) - 0.5) * 0.12 * lodB; if (lf > 0.9) dTint = mix(dTint, vec3(1.12, 1.1, 0.8), lodM);
          afH = lf; afBK = 0.012 * lodM;
        } else if (vMt < 5.5) {                                     // METAL: brushed, a little shine
          det = 1.0 + (afHash(vec3(floor(hv.x * 1.3), floor(hv.y * 18.0), 8.0)) - 0.5) * 0.10 * lodF + (afVN(hv * 0.8) - 0.5) * 0.08 * lodB;
          afRough = 0.42; afMetal = 0.35;
        } else if (vMt < 6.5) {                                     // GLASS: leaded diamond panes
          float a1 = abs(fract((hv.x + hv.y) * 1.5) - 0.5), b1 = abs(fract((hv.x - hv.y) * 1.5) - 0.5);
          float lead = (1.0 - smoothstep(0.035, 0.07 + aa * 1.5, min(a1, b1))) * lodM;
          float pane = afHash(vec3(floor((hv.x + hv.y) * 1.5), floor((hv.x - hv.y) * 1.5), 2.0));
          det = mix(1.0 + (pane - 0.5) * 0.22 * lodM, 0.28, lead); afEmK = mix(1.0 + (pane - 0.5) * 0.3 * lodM, 0.22, lead);
          afH = 1.0 - lead; afBK = 0.01 * lodM; afRough = 0.14;
        } else if (vMt < 7.5) {                                     // EARTH / GRASS: grain, patches, the odd pebble
          float gn = afHash(vec3(floor(hv * 5.0), 6.0));
          det = 1.0 + (gn - 0.5) * 0.13 * lodM + (afVN(hv * 0.33) - 0.5) * 0.16 * lodB + (afVN(hv * 0.06 + 7.0) - 0.5) * 0.10;
          if (gn > 0.965) det *= 1.0 + 0.22 * lodM;
          afH = gn; afBK = 0.008 * lodM; afRough = 0.96;
        } else if (vMt < 8.5) {                                     // ROOF TILE: overlapping shingles, every one a slightly different fire
          vec2 t = vec2(hv.x + mod(floor(hv.y), 2.0) * 0.5, hv.y); vec2 id = floor(t), f2 = fract(t);
          float seam = 1.0 - smoothstep(0.03, 0.075 + aa, min(f2.x, 1.0 - f2.x));
          float lip = smoothstep(0.0, 0.10 + aa, f2.y) * (1.0 - smoothstep(0.55, 1.0, f2.y) * 0.75);   // dark gap under each butt end, shade under the course above
          float tv = afHash(vec3(id, 2.0));
          det = (1.0 + (tv - 0.5) * 0.30 * lodB) * (1.0 - seam * 0.26 * lodB) * mix(1.0, 0.70 + 0.42 * lip, lodB);
          if (tv > 0.90) dTint = mix(dTint, vec3(0.82, 0.96, 0.74), lodB * 0.8);     // moss and lichen
          det *= 1.0 + (afHash(vec3(floor(hv * 6.0), 3.0)) - 0.5) * 0.07 * lodF;
          afH = (1.0 - seam) * lip; afBK = 0.04 * lodB; afRough = 0.66;
        } else if (vMt < 9.5) {                                     // PLASTER: limewash, mottled and patched
          det = 1.0 + (afVN(hv * 0.5) - 0.5) * 0.13 * lodB + (afVN(hv * 2.3 + 11.0) - 0.5) * 0.08 * lodM + (afHash(vec3(floor(hv * 8.0), 1.0)) - 0.5) * 0.045 * lodF;
          float ck = abs(afVN(hv * 0.9 + 31.0) - 0.5); det *= 1.0 - (1.0 - smoothstep(0.004, 0.012 + px * 0.25, ck)) * 0.09 * lodM * step(0.7, afVN(hv * 0.17 + 3.0));
          afH = afVN(hv * 2.3 + 11.0); afBK = 0.006 * lodM; afRough = 0.93;
        } else if (vMt < 10.5) {                                    // CHAR: cracked, flaked
          float flake = afVN(hv * 2.2), flake2 = afVN(hv * 5.5 + 7.0);      // alligatored char: soft scales, no lines
          det = 0.82 + 0.3 * flake * lodM + 0.14 * flake2 * lodF;
          afH = flake * 0.7 + flake2 * 0.3; afBK = 0.03 * lodM; afRough = 0.98;
        }
        // every surface: big weather stains, rain streaks down the walls, grime gathered in the creases — and the whole lot pushed harder
        float stain = afVN(hv * 0.11 + 5.0) - 0.5, streak = topF ? 0.0 : (afVN(vec2(hv.x * 2.6, hv.y * 0.22)) - 0.5);
        float grime = (1.0 - ao) * (0.5 + 0.5 * afVN(hv * 1.7));
        det = 1.0 + (det - 1.0) * 1.7;
        det *= (1.0 + stain * 0.26 * lodB) * (1.0 + streak * 0.20 * lodB * (vMt < 0.5 || vMt > 8.5 ? 1.0 : 0.45)) * (1.0 - grime * 0.30 * lodB);
        shade *= mix(1.0, clamp(det, 0.35, 1.6), uDetail); afBK *= uDetail * 1.7;
        }
      }
      diffuseColor.rgb *= vAlb * dTint * ao * shade;
      diffuseColor.rgb = max(diffuseColor.rgb + vec3(0.050, 0.038, 0.026) * afWood * uDetail * ao, vec3(0.0));
      { // SOOT: everything beside a fire blackens, most where the fire is hottest — so a burning front is dark timber and
        // masonry with fire on it, not pale squares between orange ones
        afHF = texture2D(uHeat, (vWP.xz + 300.0) / 600.0);
        float hfy = afHF.g * 128.0 - 16.0, hn = 0.5, hn2 = 0.5; if (afHF.r + afHF.b > 0.004) { hn = afVN(vec2(vWP.x + vWP.z, vWP.y) * 0.7); hn2 = afVN(vec2(vWP.x - vWP.z, vWP.y) * 2.3); }      // (perf) no noise where nothing has burnt
        afHeat = clamp(afHF.r * exp(-max(0.0, abs(vWP.y - hfy) - 5.0) * 0.1) * (0.62 + 0.5 * hn + 0.26 * hn2), 0.0, 1.0);
        float burnt = afHF.b * (1.0 - smoothstep(15.0, 27.0, vWP.y - hfy)) *      /* the roofs over a burnt house go dark too: the skyline shows what has burnt */ (0.7 + 0.42 * hn + 0.2 * hn2);
        // soot comes on with the heat but only goes fully black once the place has really burnt (the fire is never painted on a black wall)
        float so = max(smoothstep(0.08, 0.6, afHeat) * 0.72, smoothstep(0.28, 0.72, burnt));
        // things that MOVE — the dragon, soldiers, ships — never take the world's soot: they carry only their own fire
        if (vNoSoot > 0.5) { so = 0.0; afHF.b = 0.0; afHeat = floor(vEmi.a) > 2.5 ? 0.7 : 0.0; }
        afSoot = so;
        // char is DARK GREY with the surface still readable in it (courses, grain), a touch cool — never a black hole
        // plaster takes soot like timber: every material ends at the SAME warm brown-black, keeping only its own relief and shading
        if (so > 0.01 && floor(vEmi.a) < 2.5) { float sl = dot(diffuseColor.rgb, vec3(0.34)), al = max(dot(vAlb, vec3(0.34)), 0.05), dt2 = clamp(sl / al, 0.0, 1.3); float top1 = (vNI > 1.5 && vNI < 2.5) ? 1.0 : 0.0; diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.062, 0.050, 0.042), vec3(0.105, 0.098, 0.092), top1 * 0.8) * (0.45 + 0.85 * dt2), min(1.0, so * 1.04)); }      // ash lies paler on what faces up: roofs, floors and rubble step away from the walls      // one smooth field of soot: nothing pale is left in a burnt shell
      }
      if (vWet > 0.02) { diffuseColor.rgb *= 1.0 - 0.32 * vWet; afRough = mix(afRough < 0.0 ? 0.88 : afRough, 0.16, vWet); afBK *= 1.0 - 0.6 * vWet; }
    }
  `;
  const bumpCode = `
    if (afBK > 0.0005) {
      vec3 afsx = dFdx(-vViewPosition), afsy = dFdy(-vViewPosition);
      vec3 afr1 = cross(afsy, normal), afr2 = cross(normal, afsx);
      float afdt = dot(afsx, afr1);
      vec3 afgr = sign(afdt) * (dFdx(afH) * afr1 + dFdy(afH) * afr2) * afBK;
      normal = normalize(abs(afdt) * normal - afgr);
    }
  `;
  const roughCode = `
    if (afRough >= 0.0) roughnessFactor = afRough;
    metalnessFactor = max(metalnessFactor, afMetal);
  `;
  const emiCode = `
    {
      float mode = floor(vEmi.a);
      float on = mode > 1.5 ? 1.0 : mode > 0.5 ? uNight : 0.0;
      if (mode > 2.5) {
        // burning voxel: every block flickers on its own clock
        vec2 cl = floor(vBU + 0.0005);
        float ph = afHash(vec3(cl, vNI + 1.0)) * 7.0, tt = uTime * 7.0 + ph, ti = floor(tt), tf = tt - ti;
        float n0 = afHash(vec3(cl + 3.1, ti)), n1 = afHash(vec3(cl + 3.1, ti + 1.0));
        // coarse (1 m) breathing + a little per-block shimmer: reads as glowing mass from the air, not glitter
        vec3 cw = floor(vWP * 1.0);
        float bt = uTime * 2.3 + afHash(cw) * 6.283;
        on = 0.86 + 0.28 * afVN(vec2(vWP.x + vWP.z, vWP.y) * 0.45 + vec2(uTime * 0.7, -uTime * 0.9));      // one slow breath across the whole wall: no per-block steps
        // FIRE ON THE SURFACE: flame noise streams up the face in world space, straight across the block grid, so a burning
        // wall is one roiling sheet with white-hot seams and dark charred patches — not a set of orange squares
        vec2 fq = (vNI > 1.5 && vNI < 3.5) ? vWP.xz * 1.3 + vec2(uTime * 0.5, -uTime * 0.7) : vec2((vWP.x + vWP.z) * 2.1 + 0.45 * sin(vWP.y * 1.3 - uTime * 2.2 + (vWP.x + vWP.z) * 0.6), vWP.y * 0.40 - uTime * 2.0);      // tall narrow tongues that waver as they climb
        float f1 = afVN(fq), f2 = afVN(fq * 2.7 + vec2(3.7, -uTime * 2.1)), f3 = afVN(fq * 6.1 + vec2(-1.3, -uTime * 3.7));
        float fl = clamp(f1 * 0.55 + f2 * 0.30 + f3 * 0.15, 0.0, 1.0);
        float hot = smoothstep(0.40 + 0.22 * uSheetK, 0.78 + 0.10 * uSheetK, fl), core = smoothstep(0.70 + 0.10 * uSheetK, 0.90 + 0.05 * uSheetK, fl);      // the more of the screen is fire, the more dark is held: the timber skeleton shows through
        float eI = max(vEmi.r, max(vEmi.g, vEmi.b)); eI = eI < 1.4 ? eI * 0.8 : 2.5;      // every burning face carries the same fire (embers stay dim): the sheet is continuous
        vec3 ramp = mix(vec3(0.75, 0.07, 0.01), vec3(1.0, 0.40, 0.05), hot); ramp = mix(ramp, vec3(1.0, 0.86, 0.50), core);
        diffuseColor.rgb = mix(vec3(0.035, 0.028, 0.024), diffuseColor.rgb * 0.5, hot * 0.6);       // what is not flame is char
        eI *= 0.22 + 0.78 * smoothstep(0.08, 0.6, afHeat);      // a block that has just caught is an ember; the sheet comes up with the smooth heat of the place, across block edges
        totalEmissiveRadiance += ramp * eI * on * (0.06 + 0.95 * hot + 0.7 * core) * (1.0 - 0.48 * uSheetK) * uEmitBoost;
        on = 0.0;
      }
      if (mode < 2.5) on *= 1.0 - smoothstep(0.25, 0.6, afHF.b);      // a gutted house has no lamps on
      totalEmissiveRadiance += vEmi.rgb * on * uEmitBoost * afEmK;
      // a house on fire glows from INSIDE: its windows are the brightest thing on the wall
      if (vMt > 5.5 && vMt < 6.5 && afHeat > 0.08) totalEmissiveRadiance += vec3(1.0, 0.50, 0.12) * smoothstep(0.08, 0.5, afHeat) * (1.5 + 0.7 * afVN(vBU * 0.6 + vec2(uTime * 1.3, -uTime * 2.1))) * uEmitBoost;
      // what has burnt: a cool rim of sky on the char so it has form, and a few tiny bright ember points (never patches)
      if (afSoot > 0.05 && mode < 2.5) {
        // from far off a burnt quarter still GLOWS: low, patchy, slow — the picture agrees with the bar (only at a distance; up close it is the ember points)
        { float fpx = max(fwidth(vBU).x, fwidth(vBU).y), far = smoothstep(0.22, 0.6, fpx); if (far > 0.01 && afHF.b > 0.4) { float gp = smoothstep(0.55, 0.85, afVN(vWP.xz * 0.16 + 3.0 + vec2(uTime * 0.02, 0.0))) * (0.7 + 0.3 * sin(uTime * 0.8 + vWP.x * 0.3)); totalEmissiveRadiance += vec3(0.95, 0.24, 0.035) * gp * far * smoothstep(0.4, 0.9, afHF.b) * 0.55 * (1.0 - smoothstep(2.0, 16.0, vWP.y - (afHF.g * 128.0 - 16.0))); } }
        totalEmissiveRadiance += mix(uSkyZ, vec3(dot(uSkyZ, vec3(0.33))), 0.85) * afSoot * ((vNI > 1.5 && vNI < 2.5) ? 0.05 : 0.016);
        if (afHF.b > 0.35 && vMt != 6.0) { float epx = max(fwidth(vBU).x, fwidth(vBU).y), es = epx > 0.1 ? 1.0 : 3.0; vec2 ec = floor(vBU * es + 0.001); float eh = afHash(vec3(ec, vNI + 4.0)), ecl = smoothstep(0.52, 0.8, afVN(vWP.xz * 0.3 + 9.0)); if (eh > ((vNI > 1.5 && vNI < 2.5) ? mix(0.9975, es > 2.0 ? 0.955 : 0.985, ecl) : 0.9988)) { float fl = 0.45 + 0.55 * sin(uTime * (1.5 + eh * 40.0) + eh * 90.0); totalEmissiveRadiance += vec3(1.0, 0.36, 0.06) * fl * 2.4 * smoothstep(0.35, 0.8, afHF.b) * (1.0 - smoothstep(0.0, 9.0, vWP.y - (afHF.g * 128.0 - 16.0))); } }
      }
      // WET stone and water lie in the street like glass: they hold the sky too
      if (vWet > 0.02 && uDetail > 0.01) {
        vec3 afvd2 = normalize(vViewPosition); vec3 afrw2 = normalize((vec4(reflect(-afvd2, normal), 0.0) * viewMatrix).xyz);
        float affr2 = 0.05 + 0.95 * pow(1.0 - clamp(dot(afvd2, normal), 0.0, 1.0), 4.0);
        totalEmissiveRadiance += mix(uSkyH * 0.9, uSkyZ, smoothstep(-0.05, 0.55, afrw2.y)) * affr2 * vWet * 0.7;
      }
      // GLASS holds the sky: every pane reflects the evening (more at a glancing angle), so a dark window is never a flat square
      if (vMt > 5.5 && vMt < 6.5 && uDetail > 0.01) {
        vec3 afvd = normalize(vViewPosition); vec3 afrw = normalize((vec4(reflect(-afvd, normal), 0.0) * viewMatrix).xyz);
        float affr = 0.14 + 0.86 * pow(1.0 - clamp(dot(afvd, normal), 0.0, 1.0), 3.5);
        vec3 afsky = mix(uSkyH * 0.9, uSkyZ, smoothstep(-0.05, 0.55, afrw.y)) * (0.75 + 0.5 * afVN(vBU * 0.7 + afrw.xz * 2.0));
        totalEmissiveRadiance += afsky * affr * clamp(afEmK, 0.0, 1.0) * 0.85;
      }
      // glow of nearby fires on every surface
      vec4 gl = texture2D(uGlow, (vWP.xz + 300.0) / 600.0);
      float gk = gl.r * gl.r * exp(-max(0.0, abs(vWP.y - (gl.g * 128.0 - 16.0)) - 6.0) * 0.06);
      if (vNoSoot < 0.5) gk *= 0.22 + 0.78 * smoothstep(0.0, 0.22, afHF.r);      // firelight is for what stands beside a flame: the quarter beyond is not painted orange
      float gfl = 0.86 + 0.14 * sin(uTime * 9.0 + vWP.x * 0.7 + vWP.z * 0.9);
      vec3 afKeep = diffuseColor.rgb; { float afmx = max(afKeep.r, max(afKeep.g, afKeep.b)); diffuseColor.rgb = afKeep * (0.24 / max(0.24, afmx)); }      // firelight falls evenly: a pale panel beside a fire does not become a yellow rectangle
      totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.36, 0.09) * gk * gfl * uGlowK;
      diffuseColor.rgb = afKeep;
      // the fire sheet runs over what stands IN the fire too (plaster, brick, tile between the burning timbers): one sheet
      if (afHeat > 0.16 && mode < 2.5 && vMt != 6.0) {
        vec2 fq2 = (vNI > 1.5 && vNI < 3.5) ? vWP.xz * 1.3 + vec2(uTime * 0.5, -uTime * 0.7) : vec2((vWP.x + vWP.z) * 2.1 + 0.45 * sin(vWP.y * 1.3 - uTime * 2.2 + (vWP.x + vWP.z) * 0.6), vWP.y * 0.40 - uTime * 2.0);
        float s1 = afVN(fq2), s2 = afVN(fq2 * 2.7 + vec2(3.7, -uTime * 2.1));
        float lick = smoothstep(0.42 + 0.2 * uSheetK, 0.80 + 0.1 * uSheetK, s1 * 0.62 + s2 * 0.38) * smoothstep(0.16, 0.7, afHeat) * (1.0 - 0.4 * uSheetK);      // only in the heart of a fire, and only in tongues: the rest stays black
        totalEmissiveRadiance += mix(vec3(0.7, 0.08, 0.012), vec3(1.0, 0.42, 0.06), lick) * lick * 1.9 * uEmitBoost;
      }
    }
  `;
  AF.voxelShader = { vsHead, nrmCode, palCode, wpCode, fsHead, colCode, emiCode };
  const patch = (mat, key) => {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = vsHead + sh.vertexShader
        .replace('#include <beginnormal_vertex>', nrmCode)
        .replace('#include <color_vertex>', '#include <color_vertex>\n' + palCode)
        .replace('#include <project_vertex>', wpCode + '\n#include <project_vertex>');
      sh.fragmentShader = fsHead + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + colCode)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + emiCode)
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n' + roughCode)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + bumpCode);
      if (typeof key === 'string' && (key.indexOf('ew-') === 0 || key === 'mover')) sh.vertexShader = sh.vertexShader.replace('vNoSoot = 0.0;', 'vNoSoot = 1.0;');
      if (typeof key === 'string' && key.indexOf('ew-') === 0) sh.fragmentShader = sh.fragmentShader.replace('if (uSee.w > 0.5) {', 'if (false) {');      // the dragon and rider never dissolve in their own see-through
      if (AF.mat.extraPatch) AF.mat.extraPatch(sh, key);
    };
    mat.customProgramCacheKey = () => 'afvox-' + key;
    return mat;
  };
  AF.mat.patchVoxel = patch;
  AF.mat.voxel = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'solid');
  AF.mat.mover = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'mover');      // ships and other moving voxel bodies
  AF.mat.glass = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.38, depthWrite: false }), 'glass');
  AF.mat.water = new THREE.MeshStandardMaterial({ color: 0x3b6f8f, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.82 });
}

// ---------------------------------------------------------------- world meshing (runs as build stage 500)
// Regions of 128x128 columns (32 m). Each region -> 1 opaque mesh (terrain + voxels) + 1 glass mesh.
// DESTRUCTIBLE: every region mesh is made of SEGMENTS (one per 16^3 chunk, one per 32x32-column terrain tile) that remember
// their index range. When a segment changes after boot its range is blanked in the region mesh and it gets its own small
// mesh, re-meshed in ~0.5 ms; quiet segments are folded back into one "damage" mesh per region so draw calls stay low.
AF.world = { group: null, regions: new Map(), props: [], water: [], segs: new Map() };
const REG = 128, TILE = 32, TNX = NX / TILE;
// static props: geometry from AF.meshModel placed in the world (merged into region meshes). rot = quarter turns.
AF.placeStatic = (geo, x, y, z, rot = 0, o = {}) => {
  const pr = { geo, x, y, z, rot: ((rot % 4) + 4) % 4, dead: false, col: null, mat: o.mat }; AF.world.props.push(pr); AF.world.indexProp(pr);
  if (o.collide !== false) {
    const bb = geo.boundingBox || (geo.computeBoundingBox(), geo.boundingBox);
    let a = [bb.min.x, bb.min.z], b = [bb.max.x, bb.max.z];
    const r = ((rot % 4) + 4) % 4;
    const R = (p) => r === 0 ? p : r === 1 ? [p[1], -p[0]] : r === 2 ? [-p[0], -p[1]] : [-p[1], p[0]];
    const pa = R(a), pb = R(b);
    pr.col = AF.addCollider(x + Math.min(pa[0], pb[0]), y + bb.min.y, z + Math.min(pa[1], pb[1]), x + Math.max(pa[0], pb[0]), y + bb.max.y, z + Math.max(pa[1], pb[1]));
  }
  return pr;
};
AF.addWater = (geo, mat) => { AF.world.water.push({ geo, mat }); };

function meshTerrainRect(bx0, bz0, bx1, bz1, buf) {
  const H = W.H, C = W.C, S = W.S, dirtI = AF.col('dirt');
  const w = bx1 - bx0, d = bz1 - bz0;
  const vox = (bx, by, bz) => { const c = W.get(bx, by, bz); return c && AF.PAL.opaque[c]; };
  const occCol = (bx, bz, h) => (W.hB(bx, bz) > h) || vox(bx, h + GOFF, bz);
  // top faces, greedy over (h, colour, ao)
  const key = new Float64Array(w * d);
  for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
    const bx = bx0 + i, bz = bz0 + k, ci = bx * NZ + bz, h = H[ci];
    if (vox(bx, h + GOFF, bz)) { key[i * d + k] = 0; continue; }   // covered by a voxel floor: hidden
    const s10 = occCol(bx - 1, bz, h) ? 1 : 0, s12 = occCol(bx + 1, bz, h) ? 1 : 0, s01 = occCol(bx, bz - 1, h) ? 1 : 0, s21 = occCol(bx, bz + 1, h) ? 1 : 0;
    let ao = 255;
    if (s10 | s12 | s01 | s21 | (occCol(bx - 1, bz - 1, h) ? 1 : 0) | (occCol(bx + 1, bz - 1, h) ? 1 : 0) | (occCol(bx + 1, bz + 1, h) ? 1 : 0) | (occCol(bx - 1, bz + 1, h) ? 1 : 0)) {
      const c00 = occCol(bx - 1, bz - 1, h) ? 1 : 0, c20 = occCol(bx + 1, bz - 1, h) ? 1 : 0, c22 = occCol(bx + 1, bz + 1, h) ? 1 : 0, c02 = occCol(bx - 1, bz + 1, h) ? 1 : 0;
      const A = (a, b, c) => (a && b) ? 0 : 3 - (a + b + c);
      ao = A(s10, s01, c00) | (A(s12, s01, c20) << 2) | (A(s12, s21, c22) << 4) | (A(s10, s21, c02) << 6);
    }
    key[i * d + k] = ((h + 32768) * 8192 + C[ci]) * 256 + ao + 1;
  }
  for (let i = 0; i < w; i++) for (let k = 0; k < d;) {
    const kk = key[i * d + k]; if (!kk) { k++; continue; }
    const lit = ((kk - 1) % 256) === 255;
    const aoq = (kk - 1) % 256, zc = !lit && (aoq & 3) === ((aoq >> 6) & 3) && ((aoq >> 2) & 3) === ((aoq >> 4) & 3), xc = !lit && !zc && (aoq & 3) === ((aoq >> 2) & 3) && ((aoq >> 4) & 3) === ((aoq >> 6) & 3);
    let len = 1; if (lit || zc) while (k + len < d && key[i * d + k + len] === kk) len++;
    let wid = 1, stop = false;
    while ((lit || xc) && i + wid < w) { for (let t = 0; t < len; t++) if (key[(i + wid) * d + k + t] !== kk) { stop = true; break; } if (stop) break; wid++; }
    const v = kk - 1, aob = v % 256, rest = Math.floor(v / 256), c = rest % 8192, h = Math.floor(rest / 8192) - 32768;
    const y = h * VS, xa = X0 + (bx0 + i) * VS, xb = xa + wid * VS, za = Z0 + (bz0 + k) * VS, zb = za + len * VS;
    const ao = aob === 255 ? [3, 3, 3, 3] : [aob & 3, (aob >> 2) & 3, (aob >> 4) & 3, (aob >> 6) & 3];
    const u0 = bx0 + i, v0 = bz0 + k;
    buf.quad([xa, y, za], [xa, y, zb], [xb, y, zb], [xb, y, za], [u0, v0], [u0, v0 + len], [u0 + wid, v0 + len], [u0 + wid, v0], c, 2, [ao[0], ao[3], ao[2], ao[1]]);
    for (let a = 0; a < wid; a++) for (let t = 0; t < len; t++) key[(i + a) * d + k + t] = 0;
    k += len;
  }
  // side faces: for each column edge where the neighbour is lower
  const side = (dx, dz, nIdx) => {
    const alongX = dz !== 0;
    const nA = alongX ? w : d, nB = alongX ? d : w;
    for (let b = 0; b < nB; b++) {
      let a = 0;
      while (a < nA) {
        const bx = bx0 + (alongX ? a : b), bz = bz0 + (alongX ? b : a), ci = bx * NZ + bz, h = H[ci], nh = W.hB(bx + dx, bz + dz);
        if (nh >= h || bx + dx < 0 || bz + dz < 0 || bx + dx >= NX || bz + dz >= NZ) { a++; continue; }
        const topC = C[ci], sideC = S[ci] || (h - nh > 1 ? dirtI : topC);
        let run = 1;
        while (a + run < nA) {
          const bx2 = bx0 + (alongX ? a + run : b), bz2 = bz0 + (alongX ? b : a + run), c2 = bx2 * NZ + bz2;
          if (H[c2] !== h || W.hB(bx2 + dx, bz2 + dz) !== nh || C[c2] !== topC || (S[c2] || (h - nh > 1 ? dirtI : C[c2])) !== sideC) break;
          run++;
        }
        const emit = (ylo, yhi, col) => {
          if (yhi <= ylo) return;
          const Y0b = ylo * VS, Y1b = yhi * VS;
          if (alongX) {
            const zf = Z0 + (bz0 + b + (dz > 0 ? 1 : 0)) * VS, xa = X0 + (bx0 + a) * VS, xb = xa + run * VS, u0 = bx0 + a;
            if (dz > 0) buf.quad([xa, Y0b, zf], [xb, Y0b, zf], [xb, Y1b, zf], [xa, Y1b, zf], [u0, ylo], [u0 + run, ylo], [u0 + run, yhi], [u0, yhi], col, nIdx, [1, 1, 3, 3]);
            else buf.quad([xb, Y0b, zf], [xa, Y0b, zf], [xa, Y1b, zf], [xb, Y1b, zf], [u0 + run, ylo], [u0, ylo], [u0, yhi], [u0 + run, yhi], col, nIdx, [1, 1, 3, 3]);
          } else {
            const xf = X0 + (bx0 + b + (dx > 0 ? 1 : 0)) * VS, za = Z0 + (bz0 + a) * VS, zb = za + run * VS, u0 = bz0 + a;
            if (dx > 0) buf.quad([xf, Y0b, zb], [xf, Y0b, za], [xf, Y1b, za], [xf, Y1b, zb], [u0 + run, ylo], [u0, ylo], [u0, yhi], [u0 + run, yhi], col, nIdx, [1, 1, 3, 3]);
            else buf.quad([xf, Y0b, za], [xf, Y0b, zb], [xf, Y1b, zb], [xf, Y1b, za], [u0, ylo], [u0 + run, ylo], [u0 + run, yhi], [u0, yhi], col, nIdx, [1, 1, 3, 3]);
          }
        };
        if (W.sideFn && h - nh > 1) {
          let y0 = nh, cur = W.sideFn(bx, bz, nh, topC) || sideC;
          for (let y = nh + 1; y <= h - 1; y++) { const c2 = y === h - 1 ? -1 : (W.sideFn(bx, bz, y, topC) || sideC); if (c2 !== cur) { emit(y0, y, cur); y0 = y; cur = c2; } }
          emit(h - 1, h, topC);
        } else if (sideC === topC) emit(nh, h, topC); else { emit(nh, h - 1, sideC); emit(h - 1, h, topC); }
        a += run;
      }
    }
  };
  side(1, 0, 0); side(-1, 0, 1); side(0, 1, 4); side(0, -1, 5);
}

// one chunk -> padded 18^3 array (with neighbours and "underground = solid"). Returns false when the chunk is empty.
const _pad = new Uint16Array(18 * 18 * 18), _cnt = [new Int32Array(16), new Int32Array(16), new Int32Array(16)], _hcol = new Int32Array(18 * 18);
function padChunk(cx, cy, cz) {
  const ch = W.chunks[(cx * CY + cy) * CZ + cz]; if (!ch) return false;
  const cnt = _cnt, pad = _pad, hcol = _hcol;
  cnt[0].fill(0); cnt[1].fill(0); cnt[2].fill(0);
  let any = false;
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) { const b = (x * 16 + y) * 16; for (let z = 0; z < 16; z++) if (ch[b + z]) { any = true; cnt[0][x]++; cnt[1][y]++; cnt[2][z]++; } }
  if (!any) return false;
  const ox = cx * 16, oy = cy * 16, oz = cz * 16;
  for (let x = -1; x <= 16; x++) for (let z = -1; z <= 16; z++) hcol[(x + 1) * 18 + (z + 1)] = W.hB(ox + x, oz + z) + GOFF;
  pad.fill(0);
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
    const src = (x * 16 + y) * 16, dst = ((x + 1) * 18 + (y + 1)) * 18 + 1;
    for (let z = 0; z < 16; z++) pad[dst + z] = ch[src + z];
  }
  for (let x = -1; x <= 16; x++) for (let y = -1; y <= 16; y++) for (let z = -1; z <= 16; z++) {
    if (x >= 0 && y >= 0 && z >= 0 && x < 16 && y < 16 && z < 16) { z = 15; continue; }
    pad[((x + 1) * 18 + (y + 1)) * 18 + (z + 1)] = W.get(ox + x, oy + y, oz + z);
  }
  for (let x = -1; x <= 16; x++) for (let z = -1; z <= 16; z++) {
    const top = hcol[(x + 1) * 18 + (z + 1)] - oy;   // cells with local y < top are underground
    if (top <= -1) continue;
    const yMax = Math.min(16, top - 1);
    for (let y = -1; y <= yMax; y++) { const i = ((x + 1) * 18 + (y + 1)) * 18 + (z + 1); if (pad[i] === 0) pad[i] = 65535; }
  }
  return true;
}
function meshChunk(cx, cy, cz, out) {
  if (!padChunk(cx, cy, cz)) return false;
  greedyPad(16, 16, 16, _pad, VS, [X0 + cx * 16 * VS, Y0 + cy * 16 * VS, Z0 + cz * 16 * VS], [cx * 16, cy * 16, cz * 16], out, false, _cnt);
  return true;
}

// ---- segments
const SEGS = AF.world.segs;   // key: chunk index (>= 0) or -(tileKey + 1)
const FOLDS = AF.world.folds = new Map(), activeFolds = new Set();
const segOf = (key, rk) => {
  let s = SEGS.get(key);
  if (!s) {
    let fk;
    if (key >= 0) fk = ((((key / (CY * CZ)) | 0) >> 2) << 10) + ((key % CZ) >> 2);
    else { const tk = -key - 1; fk = ((((tk / TNX) | 0) >> 1) << 10) + ((tk % TNX) >> 1); }
    s = { key, rk, fk, o0: 0, o1: 0, g0: 0, g1: 0, live: false, q: 0, next: 0, lastT: 0, mesh: null, gmesh: null, inDmg: false, d0: 0, d1: 0, dg0: 0, dg1: 0 }; SEGS.set(key, s);
  }
  return s;
};
const regOf = (rk) => { let r = AF.world.regions.get(rk); if (!r) { r = { k: rk, opaque: null, glass: null }; AF.world.regions.set(rk, r); } return r; };
// fold cells (16 m x 16 m columns): the changed segments of a cell are merged into one "damage" mesh when they go quiet
const foldOf = (fk) => { let f = FOLDS.get(fk); if (!f) { f = { k: fk, hot: new Set(), merged: [], dmg: null, dmgGlass: null, lastChange: 0 }; FOLDS.set(fk, f); } return f; };

// ---- static props: merged per region with typed arrays. FAR version (downsampled, flat) always exists;
// the NEAR full-detail version is streamed in for regions within AF.LOD_DIST of the camera and freed beyond it.
const ROTN = [[0, 1, 2, 3, 4, 5], [5, 4, 2, 3, 0, 1], [1, 0, 2, 3, 5, 4], [4, 5, 2, 3, 1, 0]];
AF.world.propsByRegion = new Map();
const regionKeyOf = (x, z) => { const bx = W.bx(x), bz = W.bz(z); if (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) return -1; return (bx >> 7) * 64 + (bz >> 7); };
AF.world.indexProp = (pr) => { const k = regionKeyOf(pr.x, pr.z); if (k < 0) return; pr.rk = k; let a = AF.world.propsByRegion.get(k); if (!a) AF.world.propsByRegion.set(k, a = []); a.push(pr); };
function mergeProps(list, pick, tag) {
  let nv = 0, ni = 0;
  const parts = [];
  for (const pr of list) { if (pr.dead) continue; const g = pick(pr); if (!g) { pr[tag + '0'] = pr[tag + '1'] = 0; continue; } parts.push([pr, g]); nv += g.attributes.position.count; ni += g.index.count; }
  if (!nv) return null;
  const P = new Float32Array(nv * 3), U = new Int16Array(nv * 2), L = new Uint16Array(nv), N = new Uint8Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const [pr, g] of parts) {
    const p = g.attributes.position.array, uv = g.attributes.aBU.array, pal = g.attributes.aPal.array, an = g.attributes.aAN.array, ix = g.index.array, r = pr.rot, rn = ROTN[r];
    const n = g.attributes.position.count;
    for (let i = 0; i < n; i++) {
      let x = p[i * 3], z = p[i * 3 + 2];
      if (r === 1) { const t = x; x = z; z = -t; } else if (r === 2) { x = -x; z = -z; } else if (r === 3) { const t = x; x = -z; z = t; }
      const j = vo + i;
      P[j * 3] = pr.x + x; P[j * 3 + 1] = pr.y + p[i * 3 + 1]; P[j * 3 + 2] = pr.z + z;
      U[j * 2] = uv[i * 2]; U[j * 2 + 1] = uv[i * 2 + 1]; L[j] = pal[i];
      const a = an[i], nidx = a % 8; N[j] = a - nidx + rn[nidx];
    }
    for (let i = 0; i < ix.length; i++) I[io + i] = vo + ix[i];
    pr[tag + '0'] = io; pr[tag + '1'] = io + ix.length;
    vo += n; io += ix.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('aBU', new THREE.BufferAttribute(U, 2));
  geo.setAttribute('aPal', new THREE.BufferAttribute(L, 1));
  geo.setAttribute('aAN', new THREE.BufferAttribute(N, 1));
  geo.setIndex(new THREE.BufferAttribute(I, 1));
  geo.computeBoundingSphere();
  return geo;
}
function afDisposeArray() { this.array = null; }
const regMesh = (geo, mat, cast, keep) => {
  // static region data: once uploaded, drop the JS copies of the shading attributes (positions + index stay)
  if (!keep) for (const k of ['aBU', 'aPal', 'aAN']) { const at = geo.attributes[k]; if (at) at.onUpload(afDisposeArray); }
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); if (mat === AF.mat.glass) m.renderOrder = 2; AF.world.group.add(m); return m; };
const dropMesh = (m) => { if (!m) return; AF.world.group.remove(m); m.geometry.dispose(); };
AF.world.lod = new Map();   // key -> {cx, cz, far, near, nearGlass, props}
AF.LOD_DIST = 150;
function buildNear(reg) {
  const t = performance.now();
  const g = mergeProps(reg.props, (pr) => pr.geo, 'n');
  const gg = mergeProps(reg.props, (pr) => pr.geo.userData.glass || null, 'ng');
  reg.near = g ? regMesh(g, AF.mat.voxel, true) : null;
  reg.nearGlass = gg ? regMesh(gg, AF.mat.glass, false) : null;
  reg.nearBuilt = true;
  AF.stats.nearMs = Math.round(performance.now() - t);
}
function freeNear(reg) { dropMesh(reg.near); dropMesh(reg.nearGlass); reg.near = reg.nearGlass = null; reg.nearBuilt = false; }
const zeroRange = (mesh, a, b) => { if (!mesh || b <= a) return; const ix = mesh.geometry.index; ix.array.fill(0, a, b); ix.needsUpdate = true; };
// remove a static prop from the world (blown up, burnt, or lost its footing)
AF.killProp = (pr) => {
  if (pr.dead) return; pr.dead = true;
  const reg = AF.world.lod.get(pr.rk);
  if (reg) { zeroRange(reg.far, pr.f0 | 0, pr.f1 | 0); if (reg.nearBuilt) { zeroRange(reg.near, pr.n0 | 0, pr.n1 | 0); zeroRange(reg.nearGlass, pr.ng0 | 0, pr.ng1 | 0); } }
  if (pr.col) { AF.removeCollider(pr.col); pr.col = null; }
};
// props whose anchor lies within r of a point: fn(prop, distance)
AF.propsNear = (x, y, z, r, fn) => {
  const r2 = r * r;
  for (let i = Math.floor((x - r - X0) / 32); i <= Math.floor((x + r - X0) / 32); i++) for (let k = Math.floor((z - r - Z0) / 32); k <= Math.floor((z + r - Z0) / 32); k++) {
    const a = AF.world.propsByRegion.get(i * 64 + k); if (!a) continue;
    for (const pr of a) { if (pr.dead) continue; const dx = pr.x - x, dy = pr.y + 0.3 - y, dz = pr.z - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 <= r2) fn(pr, Math.sqrt(d2)); }
  }
};

AF.meshRegion = (rx, rz) => {
  const k = rx * 64 + rz, reg = regOf(k);
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const T = AF.stats.meshT || (AF.stats.meshT = { terrain: 0, voxel: 0, far: 0, gpu: 0 });
  let tt = performance.now();
  const bx0 = rx * REG, bz0 = rz * REG, bx1 = Math.min(NX, bx0 + REG), bz1 = Math.min(NZ, bz0 + REG);
  for (let tx = bx0; tx < bx1; tx += TILE) for (let tz = bz0; tz < bz1; tz += TILE) {
    const o0 = out.opaque.idx.length;
    meshTerrainRect(tx, tz, Math.min(bx1, tx + TILE), Math.min(bz1, tz + TILE), out.opaque);
    const s = segOf(-((tx / TILE) * TNX + tz / TILE + 1), k); s.o0 = o0; s.o1 = out.opaque.idx.length;
  }
  T.terrain += performance.now() - tt; tt = performance.now();
  for (let cx = bx0 >> 4; cx < bx1 >> 4; cx++) for (let cz = bz0 >> 4; cz < bz1 >> 4; cz++) for (let cy = 0; cy < CY; cy++) {
    const ci = (cx * CY + cy) * CZ + cz; if (!W.chunks[ci]) continue;
    const o0 = out.opaque.idx.length, g0 = out.glass.idx.length;
    if (!meshChunk(cx, cy, cz, out)) continue;
    if (out.opaque.idx.length > o0 || out.glass.idx.length > g0) { const s = segOf(ci, k); s.o0 = o0; s.o1 = out.opaque.idx.length; s.g0 = g0; s.g1 = out.glass.idx.length; }
  }
  T.voxel += performance.now() - tt; tt = performance.now();
  if (out.opaque.n) { reg.opaque = regMesh(out.opaque.geometry(), AF.mat.voxel, true); reg.opaque.userData.region = k; }
  if (out.glass.n) reg.glass = regMesh(out.glass.geometry(), AF.mat.glass, false);
  const props = AF.world.propsByRegion.get(k) || [];
  let farQ = 0;
  if (props.length) {
    const lr = { cx: X0 + (rx + 0.5) * REG * VS, cz: Z0 + (rz + 0.5) * REG * VS, props, far: null, near: null, nearGlass: null, nearBuilt: false };
    const tf = performance.now();
    const fg = mergeProps(props, (pr) => AF.lodOf(pr.geo) || pr.geo, 'f');
    T.far += performance.now() - tf;
    if (fg) { lr.far = regMesh(fg, AF.mat.voxel, true); farQ = fg.attributes.position.count / 4; }
    AF.world.lod.set(k, lr);
  }
  return out.opaque.n / 4 + farQ;
};
// (coordinator) every region's close-up prop mesh is built BEHIND THE LOADER and kept: building one the moment the player
// first comes within range stalled a frame each time (the stutter over the harbour and down Kingsway in real play)
AF.world.buildAllNear = () => { let n = 0; const t = performance.now(); for (const r of AF.world.lod.values()) if (!r.nearBuilt) { buildNear(r); n++; if (r.near) r.near.visible = false; if (r.nearGlass) r.nearGlass.visible = false; } AF.world.keepNear = true; AF.stats.nearAll = { n, ms: Math.round(performance.now() - t) }; return n; };
AF.onTick('prop-lod', 880, () => {
  if (!AF.world.group) return;
  const c = AF.camera.position, D = AF.LOD_DIST;
  let budget = AF.SHOT || AF.TEST ? 1e9 : 10, best = null, bestD = 1e9;
  const t0 = performance.now();
  for (const r of AF.world.lod.values()) {
    const d = Math.hypot(r.cx - c.x, r.cz - c.z, Math.max(0, c.y - 12) * 0.7);
    if (!r.nearBuilt && d < D) {
      if (budget > 1e8) buildNear(r);
      else if (d < bestD) { bestD = d; best = r; }
    } else if (r.nearBuilt && d > D + 70 && !AF.world.keepNear) freeNear(r);
    const showNear = r.nearBuilt && d < D + 25;
    if (r.near) r.near.visible = showNear;
    if (r.nearGlass) r.nearGlass.visible = showNear;
    if (r.far) r.far.visible = !showNear;
  }
  if (best && performance.now() - t0 < budget) buildNear(best);
});
AF.meshWorld = async (progress) => {
  AF.stats = AF.stats || {}; AF.stats.meshT = null;
  if (!AF.world.group) { AF.world.group = new THREE.Group(); AF.world.group.name = 'world'; AF.scene.add(AF.world.group); }
  const NR = Math.ceil(NX / REG);
  let quads = 0, done = 0;
  const t0 = performance.now();
  // ?near=x,z,r  -> mesh only the regions within r metres of (x,z): fast boots while working on one area
  const nq = (AF.Q.get('near') || '').split(',').map(Number), near = nq.length === 3 && nq.every(isFinite) ? nq : null;
  for (let rx = 0; rx < NR; rx++) {
    for (let rz = 0; rz < NR; rz++) {
      done++;
      if (near) { const cx = X0 + (rx + 0.5) * 32, cz = Z0 + (rz + 0.5) * 32; if (Math.abs(cx - near[0]) > near[2] + 16 || Math.abs(cz - near[1]) > near[2] + 16) continue; }
      quads += AF.meshRegion(rx, rz);
    }
    if (progress) await progress(done / (NR * NR));
  }
  for (const w of AF.world.water) { const m = new THREE.Mesh(w.geo, w.mat || AF.mat.water); m.receiveShadow = true; m.renderOrder = 1; m.name = 'water'; AF.world.group.add(m); w.mesh = m; }
  W.buildOcc();
  W.live = true;
  AF.stats = Object.assign(AF.stats || {}, { quads, meshMs: Math.round(performance.now() - t0) });
  for (const k in AF.stats.meshT) AF.stats.meshT[k] = Math.round(AF.stats.meshT[k]);
  console.log('[af] world meshed:', quads, 'quads in', AF.stats.meshMs, 'ms', JSON.stringify(AF.stats.meshT));
};

// ---- runtime edits
// coarse occupancy: voxels per 1 m cell (4^3 blocks). Drives the structural checks in 04-destruct.
const MX = NX >> 2, MY = NY >> 2, MZ = NZ >> 2;
W.MX = MX; W.MY = MY; W.MZ = MZ;
W.occ = null;
W.buildOcc = () => {
  const occ = W.occ = new Uint8Array(MX * MY * MZ);
  // also count what can burn inside the city (walls, castle, harbour): the HUD's "the town burning" is measured against it
  const PM = AF.PAL.mat, MPB = AF.MATP; let flam = 0, all = 0;
  for (let cx = 0; cx < CX; cx++) for (let cy = 0; cy < CY; cy++) for (let cz = 0; cz < CZ; cz++) {
    const ch = W.chunks[(cx * CY + cy) * CZ + cz]; if (!ch) continue;
    const wx = X0 + cx * 4 + 2, wz = Z0 + cz * 4 + 2, city = wx > -184 && wx < 184 && wz > -212 && wz < 216;
    for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) { const b = (x * 16 + y) * 16, o = ((cx * 4 + (x >> 2)) * MY + cy * 4 + (y >> 2)) * MZ + cz * 4; for (let z = 0; z < 16; z++) { const c = ch[b + z]; if (c) { occ[o + (z >> 2)]++; if (city) { all++; if (MPB[PM[c]].burn > 0) flam++; } } } }
  }
  W.cityFlam0 = flam; W.cityVox0 = all;
};
const urgentQ = [], lazyQ = []; let uHead = 0;
W.lazy = false;     // fire sets this around its edits: those chunks re-mesh at most ~3 times a second
W.burst = 0;        // frames of extra re-mesh budget (set by explosions)
W.budget = 5;       // ms per frame
const markSeg = (key, rk) => {
  const s = segOf(key, rk);
  if (W.lazy) { if (s.q === 0) { s.q = 1; lazyQ.push(s); } }
  else if (s.q !== 2) { s.q = 2; urgentQ.push(s); }
};
const markChunk = (ci) => { if (ci >= 0 && W.chunks[ci]) markSeg(ci, (((ci / (CY * CZ)) | 0) >> 3) * 64 + ((ci % CZ) >> 3)); };
const markTile = (bx, bz) => { if (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) return; markSeg(-((bx >> 5) * TNX + (bz >> 5) + 1), (bx >> 7) * 64 + (bz >> 7)); };
W.markTile = markTile;
W.touch = (bx, by, bz, ci, old, c) => {
  if (!old !== !c) { const oi = ((bx >> 2) * MY + (by >> 2)) * MZ + (bz >> 2); if (c) W.occ[oi]++; else W.occ[oi]--; }
  markChunk(ci);
  const lx = bx & 15, ly = by & 15, lz = bz & 15;
  if (lx === 0) markChunk(ci - CY * CZ); else if (lx === 15 && bx < NX - 1) markChunk(ci + CY * CZ);
  if (ly === 0) markChunk(ci - CZ); else if (ly === 15 && by < NY - 1) markChunk(ci + CZ);
  if (lz === 0) markChunk(ci - 1); else if (lz === 15 && bz < NZ - 1) markChunk(ci + 1);
  const dh = by - (W.H[bx * NZ + bz] + GOFF);
  if (dh >= -1 && dh <= 1) { markTile(bx, bz); const tx = bx & 31, tz = bz & 31; if (tx === 0) markTile(bx - 1, bz); else if (tx === 31) markTile(bx + 1, bz); if (tz === 0) markTile(bx, bz - 1); else if (tz === 31) markTile(bx, bz + 1); }
};
// change the ground itself at run time (craters, scorch, rubble mounds). h in blocks (null = keep), c = top colour (0 = keep)
W.setH = (bx, bz, h, c, s) => {
  if (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) return;
  if (W.live && !W.mending) { const tk = (bx >> 5) * TNX + (bz >> 5); if (!W.origT.has(tk)) { const H = new Int16Array(1024), C = new Uint16Array(1024), x0 = (bx >> 5) << 5, z0 = (bz >> 5) << 5; for (let a = 0; a < 32; a++) for (let b = 0; b < 32; b++) { const j = (x0 + a) * NZ + z0 + b; H[a * 32 + b] = W.H[j]; C[a * 32 + b] = W.C[j]; } W.origT.set(tk, { H, C, x0, z0, dirty: true }); } else W.origT.get(tk).dirty = true; }
  const i = bx * NZ + bz, oh = W.H[i];
  if (h != null && h !== oh) {
    W.H[i] = h;
    if (W.live) { const lo = Math.min(oh, h) + GOFF - 1, hi = Math.max(oh, h) + GOFF + 1; for (let cy = Math.max(0, lo >> 4); cy <= Math.min(CY - 1, hi >> 4); cy++) for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) { const cx = (bx + ax) >> 4, cz = (bz + az) >> 4; if (cx >= 0 && cz >= 0 && cx < CX && cz < CZ) markChunk((cx * CY + cy) * CZ + cz); } }
  }
  if (c) W.C[i] = c; if (s != null) W.S[i] = s;
  if (W.live) { markTile(bx, bz); const tx = bx & 31, tz = bz & 31; if (tx === 0) markTile(bx - 1, bz); else if (tx === 31) markTile(bx + 1, bz); if (tz === 0) markTile(bx, bz - 1); else if (tz === 31) markTile(bx, bz + 1); }
};
const segMesh = (old, buf, mat) => {
  if (!buf.n) { if (old) dropMesh(old); return null; }
  const g = buf.geometry();
  if (old) { old.geometry.dispose(); old.geometry = g; if (!old.parent) AF.world.group.add(old); return old; }
  return regMesh(g, mat, false, true);      // lone segment meshes are short-lived: they do not cast shadows until folded
};
W.lazyGap = 0.3;
// Two ways a changed segment gets back on screen:
//  urgent (blasts, collapses): its range is blanked wherever it was drawn and it is shown at once as its own small mesh;
//  lazy (fire): if it already lives in its cell's merged damage mesh, only its geometry is rebuilt and the CELL is marked
//  stale — the cell mesh is re-concatenated a moment later. Thousands of burning chunks therefore cost a few hundred draws.
function remeshSeg(s, lazy) {
  const reg = regOf(s.rk), fc = foldOf(s.fk), now = AF.clock.t;
  const first = !s.live;
  if (first) { s.live = true; zeroRange(reg.opaque, s.o0, s.o1); zeroRange(reg.glass, s.g0, s.g1); }
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  if (s.key >= 0) { const ci = s.key, cz = ci % CZ, cy = ((ci / CZ) | 0) % CY, cx = (ci / (CY * CZ)) | 0; meshChunk(cx, cy, cz, out); }
  else { const tk = -s.key - 1, tx = ((tk / TNX) | 0) * TILE, tz = (tk % TNX) * TILE; meshTerrainRect(tx, tz, tx + TILE, tz + TILE, out.opaque); }
  s.q = 0; s.lastT = now; s.next = now + W.lazyGap; fc.lastChange = now;
  AF.stats.remesh = (AF.stats.remesh | 0) + 1;
  if (lazy && s.inDmg) {
    // stays inside the cell mesh: swap the geometry it will be rebuilt from, leave the picture until the cell re-folds
    if (s.mesh) s.mesh.geometry.dispose(); if (s.gmesh) s.gmesh.geometry.dispose();
    s.mesh = out.opaque.n ? (s.mesh ? (s.mesh.geometry = out.opaque.geometry(), s.mesh) : new THREE.Mesh(out.opaque.geometry(), AF.mat.voxel)) : null;
    s.gmesh = out.glass.n ? (s.gmesh ? (s.gmesh.geometry = out.glass.geometry(), s.gmesh) : new THREE.Mesh(out.glass.geometry(), AF.mat.glass)) : null;
    if (!fc.stale) { fc.stale = true; fc.staleT = now; staleFolds.add(fc); }
    return;
  }
  if (s.inDmg) { zeroRange(fc.dmg, s.d0, s.d1); zeroRange(fc.dmgGlass, s.dg0, s.dg1); s.inDmg = false; const i = fc.merged.indexOf(s); if (i >= 0) fc.merged.splice(i, 1); }
  s.mesh = segMesh(s.mesh, out.opaque, AF.mat.voxel);
  s.gmesh = segMesh(s.gmesh, out.glass, AF.mat.glass);
  if (s.mesh || s.gmesh) { fc.hot.add(s); activeFolds.add(fc); } else fc.hot.delete(s);
}
// fold quiet segments of a cell into its single damage mesh
function concatSegs(list, pick, tag) {
  let nv = 0, ni = 0;
  for (const s of list) { const m = pick(s); if (!m) continue; nv += m.geometry.attributes.position.count; ni += m.geometry.index.count; }
  if (!nv) return null;
  const P = new Float32Array(nv * 3), U = new Int16Array(nv * 2), L = new Uint16Array(nv), N = new Uint8Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const s of list) {
    const m = pick(s); if (!m) { s[tag + '0'] = s[tag + '1'] = 0; continue; }
    const a = m.geometry.attributes, ix = m.geometry.index.array, n = a.position.count;
    P.set(a.position.array, vo * 3); U.set(a.aBU.array, vo * 2); L.set(a.aPal.array, vo); N.set(a.aAN.array, vo);
    for (let i = 0; i < ix.length; i++) I[io + i] = vo + ix[i];
    s[tag + '0'] = io; s[tag + '1'] = io + ix.length; vo += n; io += ix.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aBU', new THREE.BufferAttribute(U, 2));
  geo.setAttribute('aPal', new THREE.BufferAttribute(L, 1)); geo.setAttribute('aAN', new THREE.BufferAttribute(N, 1));
  geo.setIndex(new THREE.BufferAttribute(I, 1)); geo.computeBoundingSphere();
  return geo;
}
const QUIET = 0.22, staleFolds = new Set();
function foldCell(fc, now) {
  for (const s of fc.hot) if (now - s.lastT > QUIET && s.q !== 2) { fc.hot.delete(s); fc.merged.push(s); s.inDmg = true; }
  dropMesh(fc.dmg); dropMesh(fc.dmgGlass); fc.dmg = fc.dmgGlass = null;
  let w = 0; for (const s of fc.merged) { if (s.mesh || s.gmesh) fc.merged[w++] = s; else s.inDmg = false; } fc.merged.length = w;
  const g = concatSegs(fc.merged, (s) => s.mesh, 'd'), gg = concatSegs(fc.merged, (s) => s.gmesh, 'dg');
  if (g) fc.dmg = regMesh(g, AF.mat.voxel, true, true);
  if (gg) fc.dmgGlass = regMesh(gg, AF.mat.glass, false, true);
  for (const s of fc.merged) { if (s.mesh && s.mesh.parent) { AF.world.group.remove(s.mesh); s.mesh.geometry.dispose(); } if (s.gmesh && s.gmesh.parent) { AF.world.group.remove(s.gmesh); s.gmesh.geometry.dispose(); } }
  if (!fc.hot.size) activeFolds.delete(fc);
  fc.stale = false; staleFolds.delete(fc); fc.lastFold = now;
  AF.stats.folds = (AF.stats.folds | 0) + 1;
  return g ? g.attributes.position.count : 0;
}
W.flush = () => { for (const s of urgentQ) if (s.q === 2) remeshSeg(s, false); urgentQ.length = 0; uHead = 0; for (const s of lazyQ) if (s.q === 1) remeshSeg(s, false); lazyQ.length = 0; };
W.pending = () => (urgentQ.length - uHead) + lazyQ.length;
// re-order the urgent queue so the chunks nearest a point (a blast centre) re-mesh first
W.urgentNear = (x, y, z) => {
  const bx = W.bx(x) >> 4, by = W.by(y) >> 4, bz = W.bz(z) >> 4;
  const rest = urgentQ.slice(uHead).filter((s) => s.q === 2);
  const dist = (s) => { if (s.key < 0) { const tk = -s.key - 1; return Math.abs(((tk / TNX) | 0) * 2 + 1 - bx) + Math.abs((tk % TNX) * 2 + 1 - bz); } const ci = s.key; return Math.abs(((ci / (CY * CZ)) | 0) - bx) + Math.abs((((ci / CZ) | 0) % CY) - by) + Math.abs((ci % CZ) - bz); };
  for (const s of rest) s._d = dist(s);
  rest.sort((a, b) => a._d - b._d);
  urgentQ.length = 0; uHead = 0; for (const s of rest) urgentQ.push(s);
};
AF.onTick('remesh', 872, () => {
  if (!W.live) return;
  const t0 = performance.now(), now = AF.clock.t;
  const budget = W.burst > 0 ? 12 : W.budget;
  if (W.burst > 0) W.burst--;
  W.lazyGap = Math.max(0.35, Math.min(2.0, 0.35 + lazyQ.length / 350));
  let n = 0;
  while (uHead < urgentQ.length) { const s = urgentQ[uHead++]; if (s.q !== 2) continue; remeshSeg(s, false); if ((++n & 1) === 0 && performance.now() - t0 > budget) break; }
  if (uHead >= urgentQ.length) { urgentQ.length = 0; uHead = 0; }
  if (lazyQ.length) {
    let w = 0, over = performance.now() - t0 > budget * 0.7;
    for (let i = 0; i < lazyQ.length; i++) {
      const s = lazyQ[i]; if (s.q !== 1) continue;
      if (!over && s.next <= now) { remeshSeg(s, true); if ((++n & 1) === 0 && performance.now() - t0 > budget * 0.7) over = true; }
      else lazyQ[w++] = s;
    }
    lazyQ.length = w;
  }
  // fold: cells with quiet lone segments first (they cost draw calls), then stale cells (fire changed chunks inside them),
  // oldest first; a vertex budget per frame keeps the uploads small
  const t1 = performance.now(); let up = 0, hot = 0, folds = 0;
  const cand = [];
  for (const fc of activeFolds) {
    hot += fc.hot.size;
    let st = 0; for (const s of fc.hot) if (now - s.lastT > QUIET && s.q !== 2) st++;
    if (st >= 4 || (st > 0 && now - fc.lastChange > 0.6)) { fc._st = st; cand.push(fc); }
  }
  if (cand.length) { cand.sort((a, b) => b._st - a._st); for (let i = 0; i < cand.length && folds < 4; i++) { up += foldCell(cand[i], now); folds++; if (up > 110000 || performance.now() - t1 > 2) break; } }
  if (staleFolds.size && up < 110000 && performance.now() - t1 < 2) {
    const gap = Math.max(0.5, Math.min(2.6, 0.5 + staleFolds.size / 120));
    let best = null;
    for (let k = 0; k < 4 && up < 110000 && performance.now() - t1 < 2.2; k++) {
      best = null; for (const fc of staleFolds) if (now - (fc.lastFold || 0) > gap && (!best || fc.staleT < best.staleT)) best = fc;
      if (!best) break; up += foldCell(best, now);
    }
  }
  AF.stats.hotSegs = hot; AF.stats.staleCells = staleFolds.size; AF.stats.remeshMs = performance.now() - t0;
});
AF.remeshDirty = () => W.flush();

// ---- voxel ray (DDA). Returns null or {x,y,z (hit point), bx,by,bz, c (palette index, 0 = ground), nx,ny,nz, d, ground}
AF.rayVox = (ox, oy, oz, dx, dy, dz, maxD = 200, solidOnly = true) => {
  const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
  let bx = Math.floor((ox - X0) * INV), by = Math.floor((oy - Y0) * INV), bz = Math.floor((oz - Z0) * INV);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx ? Math.abs(VS / dx) : 1e9, tdy = dy ? Math.abs(VS / dy) : 1e9, tdz = dz ? Math.abs(VS / dz) : 1e9;
  const fx = (ox - X0) * INV - bx, fy = (oy - Y0) * INV - by, fz = (oz - Z0) * INV - bz;
  let tx = dx ? (dx > 0 ? 1 - fx : fx) * tdx : 1e9, ty = dy ? (dy > 0 ? 1 - fy : fy) * tdy : 1e9, tz = dz ? (dz > 0 ? 1 - fz : fz) * tdz : 1e9;
  let t = 0, nx = 0, ny = 0, nz = 0;
  const SOL = AF.PAL.solid;
  for (let i = 0; i < 4000 && t <= maxD; i++) {
    if (bx >= 0 && bz >= 0 && bx < NX && bz < NZ && by >= 0 && by < NY) {
      if (by < W.H[bx * NZ + bz] + GOFF) return { x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, bx, by, bz, c: 0, nx, ny, nz, d: t, ground: true };
      const ch = W.chunks[((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4)];
      if (ch) { const c = ch[((bx & 15) * 16 + (by & 15)) * 16 + (bz & 15)]; if (c && (!solidOnly || SOL[c])) return { x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, bx, by, bz, c, nx, ny, nz, d: t, ground: false }; }
      else {
        // empty chunk: skip ahead to its boundary (big speed-up in open air), unless the ground reaches into it
      }
    } else if (by < 0) return null;
    if (tx < ty && tx < tz) { bx += sx; t = tx; tx += tdx; nx = -sx; ny = 0; nz = 0; }
    else if (ty < tz) { by += sy; t = ty; ty += tdy; nx = 0; ny = -sy; nz = 0; }
    else { bz += sz; t = tz; tz += tdz; nx = 0; ny = 0; nz = -sz; }
  }
  return null;
};

// ---------------------------------------------------------------- collision
AF.colliders = new Map();  // 8 m hash -> [box]
AF.addCollider = (x0, y0, z0, x1, y1, z1, tag) => {
  const b = { x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1), tag };
  for (let i = Math.floor(b.x0 / 8); i <= Math.floor(b.x1 / 8); i++) for (let k = Math.floor(b.z0 / 8); k <= Math.floor(b.z1 / 8); k++) {
    const key = i * 100000 + k; let a = AF.colliders.get(key); if (!a) AF.colliders.set(key, a = []); a.push(b);
  }
  return b;
};
AF.removeCollider = (b) => { for (const a of AF.colliders.values()) { const i = a.indexOf(b); if (i >= 0) a.splice(i, 1); } };
// is the point inside something solid?  (voxels with solid flag, the ground, collider boxes)
AF.solidAt = (x, y, z) => {
  const bx = W.bx(x), bz = W.bz(z);
  if (y < W.hB(bx, bz) * VS) return true;
  const c = W.get(bx, W.by(y), bz); if (c && AF.PAL.solid[c]) return true;
  const a = AF.colliders.get(Math.floor(x / 8) * 100000 + Math.floor(z / 8));
  if (a) for (const b of a) if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1 && z >= b.z0 && z < b.z1) return true;
  return false;
};
// AABB (centre x,z; feet y; half-width r; height h) overlaps anything solid?
AF.boxBlocked = (x, y, z, r, h) => {
  const bx0 = W.bx(x - r), bx1 = W.bx(x + r - 1e-4), bz0 = W.bz(z - r), bz1 = W.bz(z + r - 1e-4), by0 = W.by(y + 1e-3), by1 = W.by(y + h);
  for (let bx = bx0; bx <= bx1; bx++) for (let bz = bz0; bz <= bz1; bz++) {
    if (W.hB(bx, bz) * VS > y + 1e-3) return true;
    for (let by = by0; by <= by1; by++) { const c = W.get(bx, by, bz); if (c && AF.PAL.solid[c]) return true; }
  }
  for (let i = Math.floor((x - r) / 8); i <= Math.floor((x + r) / 8); i++) for (let k = Math.floor((z - r) / 8); k <= Math.floor((z + r) / 8); k++) {
    const a = AF.colliders.get(i * 100000 + k); if (!a) continue;
    for (const b of a) if (x + r > b.x0 && x - r < b.x1 && y + h > b.y0 && y + 1e-3 < b.y1 && z + r > b.z0 && z - r < b.z1) return true;
  }
  return false;
};
// highest standing surface at (x,z) at or below y (searching down maxDrop metres). Returns y of the surface.
AF.surfaceBelow = (x, z, y, maxDrop = 60) => {
  const bx = W.bx(x), bz = W.bz(z), g = W.hB(bx, bz) * VS;
  let by = W.by(y - 1e-3);
  const byMin = Math.max(W.by(g), W.by(y - maxDrop));
  for (; by >= byMin; by--) { const c = W.get(bx, by, bz); if (c && AF.PAL.solid[c]) return Math.max(g, W.yOf(by + 1)); }
  let best = g;
  const a = AF.colliders.get(Math.floor(x / 8) * 100000 + Math.floor(z / 8));
  if (a) for (const b of a) if (x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1 && b.y1 <= y + 1e-3 && b.y1 > best) best = b.y1;
  return best;
};
// Kinematic body mover with step-up. body = {x,y,z, vy, r, h, onGround}; wish = desired horizontal displacement (dx,dz).
AF.moveBody = (b, dx, dz, dt, o = {}) => {
  const r = b.r ?? 0.3, h = b.h ?? 1.7, step = o.step ?? 0.55, grav = o.gravity ?? 22;
  const tryAxis = (ax, dist) => {
    if (!dist) return;
    const n = Math.ceil(Math.abs(dist) / 0.2), s = dist / n;
    for (let i = 0; i < n; i++) {
      const nx = ax === 0 ? b.x + s : b.x, nz = ax === 2 ? b.z + s : b.z;
      if (!AF.boxBlocked(nx, b.y, nz, r, h)) { b.x = nx; b.z = nz; continue; }
      if (b.onGround || o.fly) {
        let up = 0.25, ok = false;
        for (; up <= step + 1e-6; up += 0.25) if (!AF.boxBlocked(nx, b.y + up, nz, r, h)) { ok = true; break; }
        if (ok) { b.x = nx; b.z = nz; b.y += up; b.stepped = up; b.vy = 0; b.onGround = true; continue; }
      }
      b.hitWall = true; return;
    }
  };
  b.hitWall = false; b.stepped = 0;
  tryAxis(0, dx); tryAxis(2, dz);
  if (o.fly) return b;
  b.vy = (b.vy || 0) - grav * dt;
  let dy = b.vy * dt;
  if (dy > 0) { if (AF.boxBlocked(b.x, b.y + dy, b.z, r, h)) { b.vy = 0; dy = 0; } b.y += dy; b.onGround = false; }
  else {
    const sb = AF.surfaceBelow(b.x, b.z, b.y + 0.05, 4);
    // check the footprint corners too so you don't fall through a gap narrower than you
    let s = sb; const rr = r * 0.97; for (const [ox, oz] of [[-rr, -rr], [rr, -rr], [-rr, rr], [rr, rr], [0, rr], [0, -rr], [rr, 0], [-rr, 0]]) s = Math.max(s, AF.surfaceBelow(b.x + ox, b.z + oz, b.y + 0.05, 4));
    if (b.stepped || b.y + dy <= s + 1e-3) { b.y = Math.max(b.y, s); b.vy = 0; b.onGround = true; }
    else { b.y += dy; b.onGround = false; }
  }
  return b;
};

// ---------------------------------------------------------------- pixel font (5x7) for voxel signs
// AF.textModel('BAKERY', fg, {bg, pad:1, depth:1, bold:false}) -> Model (x = text direction, y up, z depth)
{
  const G = {
    A: '0E11111F111111', B: '1E11111E11111E', C: '0E11101010110E', D: '1C12111111121C', E: '1F10101E10101F', F: '1F10101E101010', G: '0E1110171111 0F', H: '1111111F111111', I: '0E04040404040E', J: '0702020202120C', K: '11121418141211', L: '1010101010101F', M: '111B1515111111', N: '11111915131111', O: '0E11111111110E', P: '1E11111E101010', Q: '0E111111151209 ', R: '1E11111E141211', S: '0F10100E01011E', T: '1F040404040404', U: '1111111111110E', V: '11111111110A04', W: '11111115151B11', X: '11110A040A1111', Y: '11110A04040404', Z: '1F01020408101F',
    '0': '0E11131519110E', '1': '040C040404040E', '2': '0E110102040 81F', '3': '1F020402011 10E', '4': '02060A121F0202', '5': '1F101E0101110E', '6': '0608101E11110E', '7': '1F010204080808', '8': '0E11110E11110E', '9': '0E11110F01020C',
    ' ': '00000000000000', '.': '0000000000 0C0C', ',': '00000000000C04', "'": '0C0408000000 00', '&': '0C12140815120D', '-': '000000 1F000000', '!': '04040404040004', '?': '0E110102040004', ':': '000C0C000C0C00', '/': '01010204081010', '$': '040F140E051E04', '#': '0A0A1F0A1F0A0A', '*': '00150E1F0E1500',
  };
  const rows = (s) => { s = s.replace(/ /g, ''); const r = []; for (let i = 0; i < 7; i++) r.push(parseInt(s.substr(i * 2, 2), 16) || 0); return r; };
  const glyphs = {}; for (const k in G) glyphs[k] = rows(G[k]);
  AF.font5x7 = glyphs;
  AF.textModel = (str, fg, o = {}) => {
    str = String(str).toUpperCase();
    const pad = o.pad ?? 1, depth = o.depth ?? 1, bgD = o.bg ? (o.bgDepth ?? 1) : 0, sp = o.spacing ?? 1;
    const w = str.length * (5 + sp) - sp + pad * 2, h = 7 + pad * 2;
    const m = new Model(w, h, depth + bgD);
    if (o.bg) m.box(0, 0, 0, w, h, bgD, o.bg);
    for (let i = 0; i < str.length; i++) {
      const g = glyphs[str[i]] || glyphs['?'];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (1 << (4 - c))) {
        for (let dz = 0; dz < depth; dz++) m.set(pad + i * (5 + sp) + c, pad + 6 - r, bgD + dz, fg);
        if (o.bold) m.set(pad + i * (5 + sp) + c + 1, pad + 6 - r, bgD, fg);
      }
    }
    return m;
  };
}
