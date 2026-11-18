// Bundles everything (three.js included) into one self-contained HTML file: dist/kattegat.html
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';

const r = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020', legalComments: 'none' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kattegat — The Fleet Comes Home</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#0b0a0a}#app{position:fixed;inset:0}
#loading{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(#1c1814,#070606);color:#e9dcc2;font:15px Georgia,serif;letter-spacing:.2em;transition:opacity .8s;z-index:10}
#loading h1{font-weight:400;font-size:30px;letter-spacing:.4em;margin:0 0 12px}#loadmsg{color:#a8987c;letter-spacing:.08em;font-size:13px}</style></head>
<body><div id="app"></div><div id="loading"><h1>KATTEGAT</h1><div id="loadmsg">…</div></div>
<script>${js}</script></body></html>`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/kattegat.html', html);
console.log('wrote dist/kattegat.html', (html.length / 1024).toFixed(0) + ' KB');
