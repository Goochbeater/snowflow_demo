// Bundles src/ into a single self-contained index.html (plus an artifact fragment).
// Usage: node build.mjs [artifactOutPath]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const css = readFileSync(join(src, 'style.css'), 'utf8');
const body = readFileSync(join(src, 'body.html'), 'utf8');
const jsDir = join(src, 'js');
// binary assets (hand models etc.) are embedded as data URIs so the page stays a single file
const assetDir = join(src, 'assets');
const assets = {};
const MIME = { glb: 'model/gltf-binary', bin: 'application/octet-stream' };
for (const f of readdirSync(assetDir).filter(f => /\.(glb|bin)$/.test(f))) { const ext = f.split('.').pop(); assets[f.replace(/\.(glb|bin)$/, '')] = `data:${MIME[ext]};base64,` + readFileSync(join(assetDir, f)).toString('base64'); }
const assetJs = `// ---- 00b-assets (generated) ----\nconst ASSET_DATA = ${JSON.stringify(assets)};\n`;
const files = readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `// ---- ${f} ----\n` + readFileSync(join(jsDir, f), 'utf8') + (f.startsWith('00-') ? '\n' + assetJs : '')).join('\n');

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700;800&family=Barlow+Semi+Condensed:wght@500;600;700&display=swap">';
const ADDONS_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/';
const importmap = `<script type="importmap">{"imports":{"three":"${THREE_URL}","three/addons/":"${ADDONS_URL}"}}</script>`;

const fragment = `<title>Quidditch Skybound</title>
${fonts}
<style>
${css}
</style>
${body}
${importmap}
<script type="module">
${js}
</script>
`;

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0a0c16">
<meta name="color-scheme" content="dark">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
${fragment.replace('<title>', '<title>').split('\n').slice(0, 1).join('\n')}
${fonts}
<style>
${css}
</style>
</head>
<body>
${body}
${importmap}
<script type="module">
${js}
</script>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), full);
if (process.argv[2]) writeFileSync(process.argv[2], fragment);
console.log('built', (full.length / 1024).toFixed(1) + ' KB');
