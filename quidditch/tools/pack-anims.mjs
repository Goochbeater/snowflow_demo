// Packs a subset of Universal Animation Library clips into a compact binary:
// quaternions as int16 at 24 fps, pelvis translation as float32, constant tracks collapsed.
// Usage: THREE_DIR=/path/to/node_modules/three node tools/pack-anims.mjs <UAL1_Standard.glb> <out.bin>
const THREE_DIR = process.env.THREE_DIR || new URL('../node_modules/three', import.meta.url).pathname;
const THREE = await import(THREE_DIR + '/build/three.module.js');
const { GLTFLoader } = await import(THREE_DIR + '/examples/jsm/loaders/GLTFLoader.js');
import { readFileSync, writeFileSync } from 'node:fs';
const PICK = {
  idle: 'Idle_Loop', talk: 'Idle_Talking_Loop', walk: 'Walk_Loop', walkF: 'Walk_Formal_Loop', jog: 'Jog_Fwd_Loop', sprint: 'Sprint_Loop',
  sit: 'Sitting_Idle_Loop', sitTalk: 'Sitting_Talking_Loop', sitIn: 'Sitting_Enter', sitOut: 'Sitting_Exit', dance: 'Dance_Loop',
  spellIn: 'Spell_Simple_Enter', spell: 'Spell_Simple_Idle_Loop', cast: 'Spell_Simple_Shoot', spellOut: 'Spell_Simple_Exit',
  interact: 'Interact', pickup: 'PickUp_Table', drive: 'Driving_Loop', jumpS: 'Jump_Start', jumpL: 'Jump_Loop', jumpE: 'Jump_Land',
  hit: 'Hit_Chest', kneel: 'Fixing_Kneeling', torch: 'Idle_Torch_Loop', crouch: 'Crouch_Idle_Loop', punch: 'Punch_Cross',
};
const FPS = 24;
const buf = readFileSync(process.argv[2]); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
new GLTFLoader().parse(ab, '', g => {
  const header = { fps: FPS, clips: [] }; const chunks = []; let off = 0;
  const push = (arr) => { const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (b.length % 4)) % 4; chunks.push(b, Buffer.alloc(pad)); const o = off; off += b.length + pad; return o; };
  for (const [key, name] of Object.entries(PICK)) {
    const c = g.animations.find(a => a.name === name); if (!c) { console.error('missing', name); continue; }
    const n = Math.max(2, Math.round(c.duration * FPS) + 1);
    const clip = { key, dur: +c.duration.toFixed(4), n, tracks: [] };
    for (const t of c.tracks) {
      const [bone, prop] = t.name.split('.');
      if (prop === 'scale') continue;
      if (prop === 'position' && bone !== 'pelvis') continue;
      const stride = prop === 'quaternion' ? 4 : 3;
      const interp = t.createInterpolant();
      const out = new Float32Array(n * stride);
      for (let i = 0; i < n; i++) { const r = interp.evaluate(Math.min(c.duration, i / FPS)); out.set(r.slice(0, stride), i * stride); }
      if (stride === 4) for (let i = 1; i < n; i++) { let d = 0; for (let k = 0; k < 4; k++) d += out[i * 4 + k] * out[(i - 1) * 4 + k]; if (d < 0) for (let k = 0; k < 4; k++) out[i * 4 + k] *= -1; }
      let constant = true; for (let i = 1; i < n && constant; i++) for (let k = 0; k < stride; k++) if (Math.abs(out[i * stride + k] - out[k]) > 2e-4) { constant = false; break; }
      const m = constant ? 1 : n;
      const tr = { b: bone, p: prop === 'quaternion' ? 'q' : 'p', m };
      if (stride === 4) { const q = new Int16Array(m * 4); for (let i = 0; i < m * 4; i++) q[i] = Math.round(Math.max(-1, Math.min(1, out[i])) * 32767); tr.o = push(q); }
      else tr.o = push(out.slice(0, m * 3));
      clip.tracks.push(tr);
    }
    header.clips.push(clip);
  }
  const hb = Buffer.from(JSON.stringify(header));
  const lenb = Buffer.alloc(4); lenb.writeUInt32LE(hb.length);
  const pad = Buffer.alloc((4 - ((hb.length + 4) % 4)) % 4, 32);
  const out = Buffer.concat([lenb, hb, pad, ...chunks]);
  writeFileSync(process.argv[3], out);
  console.log('anims.bin', out.length, 'bytes', header.clips.length, 'clips');
}, e => console.error(e));
