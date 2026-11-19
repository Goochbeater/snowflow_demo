// Merged-geometry builder: every static thing in the village is pushed here and merged per era bucket.
import * as THREE from 'three';

const _c = new THREE.Color();
export function col(hex, jit = 0, rnd = Math.random) {
  _c.set(hex);
  if (jit) { const k = 1 + (rnd() - 0.5) * 2 * jit; return [_c.r * k, _c.g * k, _c.b * k]; }
  return [_c.r, _c.g, _c.b];
}
const TPL = {};
function tpl(name) {
  if (TPL[name]) return TPL[name];
  let g;
  switch (name) {
    case 'box': g = new THREE.BoxGeometry(1, 1, 1); break;
    case 'cyl': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1); break;
    case 'cyl5': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 1); break;
    case 'cyl12': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 14, 1); break;
    case 'barrel': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 3); { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + 0.16 * (1 - (2 * y) ** 2); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } } break;
    case 'cone': g = new THREE.ConeGeometry(0.5, 1, 8, 1); break;
    case 'cone5': g = new THREE.ConeGeometry(0.5, 1, 5, 1); break;
    case 'sphere': g = new THREE.IcosahedronGeometry(0.5, 1); break;
    case 'rock': g = new THREE.IcosahedronGeometry(0.5, 0); break;
    case 'hemi': g = new THREE.SphereGeometry(0.5, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); break;
    case 'torus': g = new THREE.TorusGeometry(0.4, 0.1, 5, 12); break;
    case 'disc': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1); break;
    case 'plane': g = new THREE.PlaneGeometry(1, 1); break;
  }
  g = g.toNonIndexed(); g.computeVertexNormals();
  TPL[name] = { p: g.attributes.position.array, n: g.attributes.normal.array };
  return TPL[name];
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _nm = new THREE.Matrix3();
export function M(x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _v.set(x, y, z); _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(_v, _q, _s);
}

export class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.l = []; }
  add(name, m, color) {
    const t = tpl(name); const e = m.elements;
    _nm.getNormalMatrix(m); const ne = _nm.elements;
    const P = t.p, N = t.n;
    for (let i = 0; i < P.length; i += 3) {
      const x = P[i], y = P[i + 1], z = P[i + 2];
      this.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
      const a = N[i], b = N[i + 1], c = N[i + 2];
      let nx = ne[0] * a + ne[3] * b + ne[6] * c, ny = ne[1] * a + ne[4] * b + ne[7] * c, nz = ne[2] * a + ne[5] * b + ne[8] * c;
      const l = Math.hypot(nx, ny, nz) || 1;
      this.n.push(nx / l, ny / l, nz / l);
      this.c.push(color[0], color[1], color[2]); this.l.push(color[3] ?? -1);
    }
  }
  // box with world-space parameters (centre, size, yaw)
  box(x, y, z, sx, sy, sz, ry, color, rx = 0, rz = 0) { this.add('box', M(x, y, z, ry, rx, rz, sx, sy, sz), color); }
  // cylinder/pole between two points
  pole(a, b, r, color, name = 'cyl') {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const L = Math.hypot(dx, dy, dz);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L));
    const m = new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(r * 2, L, r * 2));
    this.add(name, m, color);
  }
  tri(a, b, c, color, flip = false) {
    if (flip) [b, c] = [c, b];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const p of [a, b, c]) { this.p.push(p[0], p[1], p[2]); this.n.push(nx, ny, nz); this.c.push(color[0], color[1], color[2]); this.l.push(color[3] ?? -1); }
  }
  quad(a, b, c, d, color, flip = false) { this.tri(a, b, c, color, flip); this.tri(a, c, d, color, flip); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.l, 1));
    g.computeBoundingSphere();
    return g;
  }
  get count() { return this.p.length / 3; }
}
