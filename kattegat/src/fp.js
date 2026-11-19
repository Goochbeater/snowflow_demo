// First-person walking: pointer-lock look, WASD, run, jump, head-bob; collides with buildings,
// the palisade (except at its gates) and the water's edge; climbs onto piers and the palisade walk.
import * as THREE from 'three';
import { clamp, lerp } from './util.js';

export class FirstPerson {
  constructor(camera, dom, grid, L, P, GR) {
    this.camera = camera; this.dom = dom; this.grid = grid; this.L = L; this.P = P; this.GR = GR;
    this.active = false; this.locked = false;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.pitch = 0; this.vy = 0; this.onGround = true; this.bob = 0;
    this.keys = {};
    this.look = new THREE.Vector3();
    addEventListener('keydown', (e) => { if (!this.active) return; this.keys[e.code] = true; if (e.code === 'Space') { e.preventDefault(); if (this.onGround) { this.vy = 4.6; this.onGround = false; } } });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    dom.addEventListener('click', () => { if (this.active && !this.locked) dom.requestPointerLock?.(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === dom; });
    addEventListener('mousemove', (e) => {
      if (!this.active || !this.locked) return;
      this.yaw -= e.movementX * 0.0022; this.pitch = clamp(this.pitch - e.movementY * 0.0022, -1.45, 1.45);
    });
    // touch: drag to look, two-finger hold to walk
    let tl = null; dom.addEventListener('touchstart', (e) => { if (!this.active) return; tl = [e.touches[0].clientX, e.touches[0].clientY]; this.keys.KeyW = e.touches.length > 1; }, { passive: true });
    dom.addEventListener('touchmove', (e) => { if (!this.active || !tl) return; const x = e.touches[0].clientX, y = e.touches[0].clientY; this.yaw -= (x - tl[0]) * 0.005; this.pitch = clamp(this.pitch - (y - tl[1]) * 0.005, -1.4, 1.4); tl = [x, y]; this.keys.KeyW = e.touches.length > 1; }, { passive: true });
    dom.addEventListener('touchend', () => { tl = null; this.keys.KeyW = false; }, { passive: true });
    // building footprints for collision
    this.boxes = L.B.map((b) => ({ x: b.x, z: b.z, c: Math.cos(b.rot), s: Math.sin(b.rot), hl: b.len / 2 + 0.45, hw: b.wid / 2 + 0.45, kind: b.kind }));
  }
  enter(from) {
    this.active = true; this.prevFov = this.camera.fov; this.camera.fov = 72; this.camera.updateProjectionMatrix();
    let x = from.x, z = from.z;
    if (this.grid.get(x, z) < this.P.tide + 0.3 || Math.abs(x) > 600 || z < -100 || z > 700) { x = 40; z = 120; }
    this.pos.set(x, this.ground(x, z), z);
    const d = new THREE.Vector3(); this.camera.getWorldDirection(d); this.yaw = Math.atan2(-d.x, -d.z); this.pitch = 0;
    this.dom.requestPointerLock?.();
  }
  exit() { this.active = false; this.camera.fov = this.prevFov || 50; this.camera.updateProjectionMatrix(); if (document.pointerLockElement) document.exitPointerLock(); }
  ground(x, z) {
    let y = this.grid.get(x, z);
    // walkways: piers and the palisade walk are standable
    const G = this.GR.G; const n = G.nearest(x, z, 12, (k) => !isNaN(G.y[k]));
    if (n >= 0 && Math.hypot(G.x[n] - x, G.z[n] - z) < (G.tag[n] === 3 ? 1.7 : 0.9) && (G.tag[n] !== 4 || this.P.era >= 2) && (G.tag[n] !== 3 || this.P.era >= 2)) y = Math.max(y, G.y[n] + 0.05);
    return y;
  }
  blocked(x, z, y) {
    if (this.grid.get(x, z) < this.P.tide - 0.7 && y < this.P.tide + 1) return true; // knee-deep is as far as you wade
    for (const b of this.boxes) {
      const dx = x - b.x, dz = z - b.z; if (dx * dx + dz * dz > (b.hl + 2) ** 2) continue;
      const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      if (Math.abs(lx) < b.hl && Math.abs(lz) < b.hw && y < this.grid.get(b.x, b.z) + 6) return true;
    }
    if (this.P.era >= 2) {
      const L = this.L; const r = Math.hypot((x - L.PC[0]) / L.PRX, (z - L.PC[1]) / L.PRZ);
      const r0 = Math.hypot((this.pos.x - L.PC[0]) / L.PRX, (this.pos.z - L.PC[1]) / L.PRZ);
      const atGate = L.gates.some((g) => Math.hypot(g[0] - x, g[1] - z) < 3.6);
      if (!atGate && (r - 1.0) * (r0 - 1.0) < 0 && y < this.grid.get(x, z) + 2.2) return true;
    }
    return false;
  }
  update(dt) {
    const k = this.keys; const run = k.ShiftLeft || k.ShiftRight;
    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0), s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    const sp = run ? 6.2 : 2.6;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let vx = (fx * f + rx * s), vz = (fz * f + rz * s); const l = Math.hypot(vx, vz); if (l > 0) { vx = vx / l * sp; vz = vz / l * sp; }
    this.vel.x = lerp(this.vel.x, vx, Math.min(1, dt * 10)); this.vel.z = lerp(this.vel.z, vz, Math.min(1, dt * 10));
    const nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    // slide along obstacles
    if (!this.blocked(nx, nz, this.pos.y)) { this.pos.x = nx; this.pos.z = nz; }
    else if (!this.blocked(nx, this.pos.z, this.pos.y)) this.pos.x = nx;
    else if (!this.blocked(this.pos.x, nz, this.pos.y)) this.pos.z = nz;
    const gy = this.ground(this.pos.x, this.pos.z);
    this.vy -= 12 * dt; this.pos.y += this.vy * dt;
    if (this.pos.y <= gy) { this.pos.y = lerp(this.pos.y, gy, 0.6); if (this.pos.y < gy) this.pos.y = gy; this.vy = 0; this.onGround = true; }
    const moving = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround) this.bob += dt * moving * 2.1;
    const bobY = Math.sin(this.bob * 2) * 0.035 * Math.min(1, moving / 2.6), bobX = Math.cos(this.bob) * 0.025 * Math.min(1, moving / 2.6);
    const eye = 1.66;
    this.camera.position.set(this.pos.x + rx * bobX, this.pos.y + eye + bobY, this.pos.z + rz * bobX);
    const cp = Math.cos(this.pitch);
    this.look.set(this.camera.position.x + fx * cp * 10, this.camera.position.y + Math.sin(this.pitch) * 10, this.camera.position.z + fz * cp * 10);
    this.camera.lookAt(this.look);
  }
}
