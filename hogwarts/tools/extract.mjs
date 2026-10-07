// Split the single-file release build (createwithmark "HOGWARTS · Legacy of Magic") into the source tree:
//   src/shell.html            page skeleton + CSS (analytics removed), with <!--@SCRIPTS--> where the code goes
//   src/vendor/three.r160.js  the bundled three.js
//   src/js/<module>.js        one file per engine/game module (the /* ==== name ==== */ markers)
//   src/data/<id>.json        JSON blocks (rig, meshes, physics)
//   assets/<id>.<ext>         binary blocks (textures, meshes, mocap, sounds) + assets/manifest.json
// usage: node tools/extract.mjs <release.html>
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(process.argv[2], 'utf8');
const dirs = ['src/js', 'src/vendor', 'src/data', 'assets'].map((d) => path.join(root, d)); dirs.forEach((d) => fs.mkdirSync(d, { recursive: true }));
const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
const magic = (b) => b[0] === 0x89 && b[1] === 0x50 ? 'png' : b[0] === 0xff && b[1] === 0xd8 ? 'jpg' : (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) ? 'mp3' : b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 ? 'webp' : 'bin';
const manifest = {}; let code = 0;
const shell = src.replace(re, (m, attrs, body) => {
  const id = (attrs.match(/id="([^"]+)"/) || [])[1], type = (attrs.match(/type="([^"]+)"/) || [])[1], mime = (attrs.match(/data-m="([^"]+)"/) || [])[1];
  if (!type) {
    if (/createwithmark/.test(body)) return '';                              // the host's analytics (inert off its domain): dropped
    if (/const REVISION = '(\d+)'/.test(body)) { fs.writeFileSync(path.join(root, 'src/vendor/three.r160.js'), body); return '<!--@SCRIPTS-->'; }
    else {                                                                        // the game: split at its module markers
      const mk = /\/\* ==== (.+?) ==== \*\//g; const at = []; let x; while ((x = mk.exec(body))) at.push([x.index, x[1]]);
      at.forEach(([i, name], k) => fs.writeFileSync(path.join(root, 'src/js', name), body.slice(i, k + 1 < at.length ? at[k + 1][0] : body.length).replace(/\s+$/, '') + '\n'));
      fs.writeFileSync(path.join(root, 'src/js/_order.json'), JSON.stringify(at.map((a) => a[1]), null, 0));
      code++;
    }
    return '';
  }
  if (type === 'application/json') { fs.writeFileSync(path.join(root, 'src/data', id + '.json'), body.trim()); manifest[id] = { json: 1 }; return ''; }
  const buf = Buffer.from(body.trim(), 'base64'), ext = magic(buf);
  fs.writeFileSync(path.join(root, 'assets', id + '.' + ext), buf);
  manifest[id] = { f: id + '.' + ext, m: mime || '', n: buf.length };
  return '';
}).replace(/<!-- Meta Pixel Code[\s\S]*?End Meta Pixel Code -->\s*/, '').replace(/<noscript>[\s\S]*?<\/noscript>\s*/g, '').replace(/<!-- Vercel Web Analytics[^>]*-->\s*/g, '').replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(path.join(root, 'src/shell.html'), shell);
fs.writeFileSync(path.join(root, 'assets/manifest.json'), JSON.stringify(manifest, null, 0));
const bins = Object.values(manifest).filter((v) => v.f);
console.log('code blocks', code, '| json', Object.keys(manifest).length - bins.length, '| binaries', bins.length, (bins.reduce((s, v) => s + v.n, 0) / 1048576).toFixed(1) + ' MB');
