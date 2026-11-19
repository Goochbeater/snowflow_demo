// Material swatch board: each layer tiled 2x2 under a grazing light (dist/tex.html).
import * as THREE from 'three';
import { generateTextures, LAYERS } from './texgen.js';
document.getElementById('loading')?.remove();
const q = new URLSearchParams(location.search); const only = q.get('only');
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(innerWidth, innerHeight); document.body.style.margin = 0; document.body.appendChild(r.domElement);
const T = generateTextures(r);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x222222);
const list = only ? only.split(',').map((n) => LAYERS.indexOf(n)) : LAYERS.map((_, i) => i);
const cols = only ? list.length : 8, rows = Math.ceil(list.length / cols); const W = 2 / cols, H = 2 / rows;
const mat = (l) => new THREE.ShaderMaterial({
  uniforms: { A: { value: T.albedo }, N: { value: T.normal }, L: { value: l }, rep: { value: parseFloat(q.get('rep') || '2') } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `precision highp sampler2DArray; uniform sampler2DArray A; uniform sampler2DArray N; uniform float L; uniform float rep; varying vec2 vUv;
    void main(){ vec2 uv = vUv * rep; vec4 a = texture(A, vec3(uv, L)); vec3 n = texture(N, vec3(uv, L)).xyz * 2.0 - 1.0; vec3 l = normalize(vec3(-0.6, 0.5, 0.45));
      float d = max(dot(n, l), 0.0); vec3 c = a.rgb * (0.25 + 1.1 * d); gl_FragColor = vec4(pow(c, vec3(1.0/2.2)), 1.0); }`,
});
list.forEach((l, k) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.97, H * 0.97), mat(l)); m.position.set(-1 + W * (k % cols + 0.5), 1 - H * (Math.floor(k / cols) + 0.5), 0); scene.add(m);
  const d = document.createElement('div'); d.textContent = LAYERS[l]; d.style.cssText = `position:fixed;left:${(k % cols) / cols * 100}%;top:${Math.floor(k / cols) / rows * 100}%;color:#fff;font:bold 14px sans-serif;text-shadow:0 0 4px #000;padding:4px`; document.body.appendChild(d);
});
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
r.render(scene, cam); window.done = true;
