// HOGWARTS · Legacy of Magic — build.
//   node build.mjs                 → dist/hogwarts.html   one self-contained page, every asset embedded (≈ 80 MB)
//   node build.mjs web [outDir]    → outDir/index.html + outDir/a/*   the page (code + JSON) with its assets beside it:
//                                    music streamed from its own files, sounds and textures in a few packs, the rig
//                                    and mesh buffers as they are (what the published artifact serves)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.dirname(fileURLToPath(import.meta.url));
const R = (...p) => path.join(root, ...p);
const mode = process.argv[2] === 'web' ? 'web' : 'single';
const shell = fs.readFileSync(R('src/shell.html'), 'utf8');
const three = fs.readFileSync(R('src/vendor/three.r160.js'), 'utf8');
const mods = fs.readdirSync(R('src/js')).filter((f) => f.endsWith('.js')).sort();
const game = '\n' + mods.map((f) => fs.readFileSync(R('src/js', f), 'utf8')).join('\n');
const manifest = JSON.parse(fs.readFileSync(R('assets/manifest.json'), 'utf8'));
const json = Object.keys(manifest).filter((id) => manifest[id].json).map((id) => `<script type="application/json" id="${id}">${fs.readFileSync(R('src/data', id + '.json'), 'utf8')}</script>`).join('\n');
const bins = Object.keys(manifest).filter((id) => manifest[id].f);
for (const s of [three, game]) if (/<\/script/i.test(s)) throw new Error('a script contains </script');
const page = (pre, post) => shell.replace('<!--@SCRIPTS-->', () => `${pre}<script>${three}</script>\n<script>${game}</script>\n${json}\n${post}`);

if (mode === 'single') {
  const data = bins.map((id) => { const v = manifest[id]; return `<script type="application/octet-stream"${v.m ? ` data-m="${v.m}"` : ''} id="${id}">${fs.readFileSync(R('assets', v.f)).toString('base64')}</script>`; }).join('\n');
  const out = process.env.OUT || R('dist/hogwarts.html'); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page('', data)); console.log('built', out, (fs.statSync(out).size / 1048576).toFixed(1) + ' MB,', mods.length, 'modules');
} else {
  const out = process.argv[3] || R('dist/web'), A = path.join(out, 'a'); fs.rmSync(A, { recursive: true, force: true }); fs.mkdirSync(A, { recursive: true });
  // music streams from its own file (the short win sting is decoded, so it rides in the sound pack); the rig / mesh buffers stay whole; sounds go in one pack, textures in four
  const M = {}, packs = {}, kind = (id) => /^snd_mus_(?!win$)/.test(id) ? 'file' : /^snd_/.test(id) ? 'sfx' : /^tex_/.test(id) ? 'tex' : 'file';
  const tex = bins.filter((id) => kind(id) === 'tex').sort(), TP = 4, texTotal = tex.reduce((s, id) => s + manifest[id].n, 0);
  let acc = 0; for (const id of tex) { const k = Math.min(TP - 1, Math.floor(acc / (texTotal / TP))); acc += manifest[id].n; (packs['tex' + k] = packs['tex' + k] || []).push(id); }
  packs.sfx = bins.filter((id) => kind(id) === 'sfx').sort();
  for (const id of bins.filter((id) => kind(id) === 'file')) { const v = manifest[id]; fs.copyFileSync(R('assets', v.f), path.join(A, v.f)); M[id] = { f: v.f, m: v.m || '', n: v.n }; }
  const P = {};
  for (const [name, ids] of Object.entries(packs)) {
    const parts = []; let o = 0;
    for (const id of ids) { const v = manifest[id], b = fs.readFileSync(R('assets', v.f)); parts.push(b); M[id] = { p: name, o, n: b.length, m: v.m || '', x: v.f.split('.').pop() }; o += b.length; const pad = (8 - (o % 8)) % 8; if (pad) { parts.push(Buffer.alloc(pad)); o += pad; } }
    fs.writeFileSync(path.join(A, name + '.pack'), Buffer.concat(parts)); P[name] = { f: name + '.pack', n: o };
  }
  const head = `<script>window.__HL_ASSETS=${JSON.stringify({ base: 'a/', packs: P, items: M })};</script>\n`;
  fs.writeFileSync(path.join(out, 'index.html'), page(head, ''));
  const files = fs.readdirSync(A), tot = files.reduce((s, f) => s + fs.statSync(path.join(A, f)).size, 0);
  console.log('built', path.join(out, 'index.html'), (fs.statSync(path.join(out, 'index.html')).size / 1048576).toFixed(2) + ' MB +', files.length, 'asset files', (tot / 1048576).toFixed(1) + ' MB,', mods.length, 'modules');
}
