// Procedural material library, authored on the GPU at load time.
// Every layer is a seamlessly tiling 512² texture: albedo (sRGB) + roughness, and normal + height.
// Layers are packed into two mipmapped texture arrays for terrain, buildings and props.
import * as THREE from 'three';

export const LAYERS = ['grass', 'dirt', 'mud', 'sand', 'rock', 'forest', 'snow', 'gravel', 'plank', 'wattle', 'turf', 'shingle', 'stone', 'tar', 'crop', 'thatch'];
export const LID = Object.fromEntries(LAYERS.map((n, i) => [n, i]));
const RES = 512;

const GEN = /* glsl */`
precision highp float;
uniform int uLayer; uniform int uOut; varying vec2 vUv;
#define TAU 6.28318530718
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x * 3.7 + p.y); }
vec2 h22(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vn(vec2 x, float P) { vec2 i = floor(x), f = fract(x); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(mod(i, P)), h21(mod(i + vec2(1, 0), P)), u.x), mix(h21(mod(i + vec2(0, 1), P)), h21(mod(i + vec2(1, 1), P)), u.x), u.y); }
float fbm(vec2 uv, float f0, int oct) { float s = 0.0, a = 0.5, f = f0, n = 0.0; for (int i = 0; i < 8; i++) { if (i >= oct) break; s += a * vn(uv * f, f); n += a; f *= 2.0; a *= 0.5; } return s / n; }
float fbmA(vec2 uv, vec2 f0, int oct) { float s = 0.0, a = 0.5, n = 0.0; vec2 f = f0; for (int i = 0; i < 8; i++) { if (i >= oct) break; vec2 x = uv * f; vec2 ii = floor(x), ff = fract(x); vec2 u = ff * ff * (3.0 - 2.0 * ff);
  float v = mix(mix(h21(mod(ii, f)), h21(mod(ii + vec2(1, 0), f)), u.x), mix(h21(mod(ii + vec2(0, 1), f)), h21(mod(ii + vec2(1, 1), f)), u.x), u.y); s += a * v; n += a; f *= 2.0; a *= 0.5; } return s / n; }
// periodic Worley: x = F1, y = F2, z = cell id
vec3 wor(vec2 uv, float n, float jit) { vec2 x = uv * n; vec2 i = floor(x), f = fract(x); float F1 = 9.0, F2 = 9.0, id = 0.0;
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) { vec2 g = vec2(xx, yy); vec2 c = mod(i + g, n); vec2 o = 0.5 + (h22(c) - 0.5) * jit; float d = length(g + o - f);
    if (d < F1) { F2 = F1; F1 = d; id = h21(c + 17.3); } else if (d < F2) F2 = d; }
  return vec3(F1, F2, id); }
float segD(vec2 p, vec2 a, vec2 b, out float t) { vec2 pa = p - a, ba = b - a; t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * t); }
// a carpet of strokes (blades, needles, straw): returns mask, t along stroke, stroke id
vec3 strokes(vec2 uv, float n, float len, float wid, float dirBias, float dirSpread) {
  vec2 x = uv * n; vec2 i = floor(x), f = fract(x); vec3 best = vec3(0.0);
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) for (int k = 0; k < 3; k++) {
    vec2 g = vec2(xx, yy); vec2 c = mod(i + g, n) + float(k) * 37.0; vec2 r = h22(c);
    vec2 a = g + r; float ang = dirBias + (h21(c + 3.1) - 0.5) * dirSpread; float L = len * (0.55 + 0.9 * h21(c + 5.7));
    vec2 b = a + vec2(cos(ang), sin(ang)) * L; float t; float d = segD(f, a, b, t);
    float w = wid * (1.0 - 0.85 * t) * (0.6 + 0.8 * h21(c + 9.2)); float m = smoothstep(w, w * 0.25, d);
    if (m * (0.6 + 0.4 * t) > best.x * (0.6 + 0.4 * best.y)) best = vec3(m, t, h21(c + 1.7)); }
  return best; }
vec3 sat(vec3 c, float s) { float l = dot(c, vec3(0.299, 0.587, 0.114)); return mix(vec3(l), c, s); }

void layer(int L, vec2 uv, out vec3 col, out float h, out float r) {
  float n1 = fbm(uv, 4.0, 5), n2 = fbm(uv + 0.37, 8.0, 4), n3 = fbm(uv, 32.0, 3);
  if (L == 0) { // meadow grass: a dense lawn of overlapping blades, dry patches, clover
    float dry = smoothstep(0.5, 0.75, fbm(uv + 3.0, 3.0, 5));
    col = mix(vec3(0.12, 0.19, 0.05), vec3(0.19, 0.25, 0.07), n1); col = mix(col, vec3(0.3, 0.28, 0.12), dry * 0.6); h = n2 * 0.15; r = 0.88;
    for (int k = 0; k < 3; k++) {
      vec3 s = strokes(uv + float(k) * 0.31, k == 0 ? 26.0 : k == 1 ? 44.0 : 70.0, 1.0, 0.13, 0.6 * float(k), 6.28);
      if (s.x > 0.02) {
        vec3 g = mix(vec3(0.16, 0.3, 0.06), vec3(0.32, 0.43, 0.11), s.z); g = mix(g, vec3(0.5, 0.45, 0.22), dry * step(0.6, s.z));
        if (s.z > 0.94) g = vec3(0.55, 0.5, 0.28);
        g *= 0.6 + 0.55 * s.y; float hh = s.x * (0.25 + 0.6 * s.y) + float(k) * 0.05;
        if (hh > h) { col = mix(col, g, s.x); h = hh; } } }
    float cl = smoothstep(0.64, 0.72, fbm(uv + 2.0, 7.0, 4)); vec3 w = wor(uv, 70.0, 0.8);
    if (cl > 0.0 && w.x < 0.45) { col = mix(col, vec3(0.15, 0.35, 0.1) * (0.8 + 0.3 * w.z), cl); h = max(h, cl * (0.75 - w.x)); }
  } else if (L == 1) { // trodden earth: packed dirt with damp patches, embedded grit, scuffs and a few dry stalks
    float big = fbm(uv + 5.0, 2.0, 5);
    col = mix(vec3(0.31, 0.235, 0.16), vec3(0.47, 0.37, 0.25), big) * (0.85 + 0.3 * n2) * (0.92 + 0.14 * n3);
    float damp = smoothstep(0.55, 0.7, fbm(uv + 9.0, 4.0, 5)); col *= 1.0 - 0.28 * damp; h = n2 * 0.3 + big * 0.2; r = 0.95 - 0.25 * damp;
    vec2 wp = uv + (vec2(fbm(uv, 16.0, 3), fbm(uv + 4.0, 16.0, 3)) - 0.5) * 0.02;
    vec3 w = wor(wp, 24.0, 1.0); float sz = 0.08 + 0.3 * pow(fract(w.z * 7.0), 2.0);
    if (w.x < sz && w.z > 0.62) { float d = 1.0 - w.x / sz; col = mix(col, mix(vec3(0.4, 0.38, 0.35), vec3(0.58, 0.53, 0.45), fract(w.z * 13.0)) * (0.7 + 0.4 * d), smoothstep(0.0, 0.3, d)); h = max(h, 0.3 + 0.5 * sqrt(d)); r = 0.75; }
    vec3 g = wor(uv, 90.0, 1.0); if (g.z > 0.7 && g.x < 0.25) { col *= 1.12; h += 0.06; }
    vec3 s = strokes(uv, 10.0, 0.8, 0.04, 0.0, 6.2); if (s.x > 0.2 && s.z > 0.85) { col = mix(col, vec3(0.58, 0.5, 0.3) * (0.7 + 0.4 * s.y), s.x * 0.85); h = max(h, s.x * 0.45); }
  } else if (L == 2) { // mud: dark churned earth, small wet hollows and hoof-prints
    float big = fbm(uv + 2.0, 3.0, 6);
    col = mix(vec3(0.14, 0.1, 0.065), vec3(0.26, 0.19, 0.12), big) * (0.85 + 0.3 * n3); h = big * 0.5 + n2 * 0.25; r = 0.55;
    float pd = smoothstep(0.6, 0.64, fbm(uv + 1.3, 6.0, 6)); col = mix(col, vec3(0.07, 0.06, 0.05), pd); r = mix(r, 0.05, pd); h = mix(h, 0.08, pd);
    vec3 w = wor(uv, 12.0, 0.9); if (w.z > 0.78) { float e = smoothstep(0.26, 0.12, w.x) * smoothstep(0.3, 0.6, fbm(uv * 3.0, 16.0, 2)); col *= 1.0 - 0.25 * e; h -= e * 0.3; r = mix(r, 0.25, e); }
    vec3 s = strokes(uv, 9.0, 0.7, 0.03, 0.0, 6.28); if (s.x > 0.3 && s.z > 0.8) { col = mix(col, vec3(0.4, 0.33, 0.18), s.x * 0.7); h = max(h, s.x * 0.5); }
  } else if (L == 3) { // beach sand: fine grains, soft irregular wind ripples, shell grit
    float warp = fbm(uv, 2.0, 4) * 2.4 + fbm(uv + 3.0, 4.0, 3) * 0.6;
    float rip = sin((uv.y * 16.0 + uv.x * 3.0 + warp) * TAU); rip = (rip * 0.5 + 0.5); rip = pow(rip, 1.6) * smoothstep(0.25, 0.65, fbm(uv + 8.0, 3.0, 4));
    float grain = vn(uv * 512.0, 512.0), grain2 = vn(uv * 256.0 + 3.0, 256.0);
    col = mix(vec3(0.6, 0.51, 0.37), vec3(0.74, 0.65, 0.49), n1 * 0.7 + 0.3 * grain2) * (0.86 + 0.22 * grain) * (0.96 + 0.06 * rip); h = rip * 0.3 + grain * 0.12 + n2 * 0.25; r = 0.93;
    vec3 w = wor(uv, 48.0, 1.0); if (w.z > 0.93 && w.x < 0.11) { col = vec3(0.86, 0.82, 0.74); h += 0.15; }
    if (w.z < 0.03 && w.x < 0.14) col = mix(col, vec3(0.28, 0.26, 0.24), 0.8);
  } else if (L == 4) { // weathered granite cliff: ridged mass, broken joints, rain streaks, lichen
    float rg = 1.0 - abs(2.0 * fbm(uv + 1.7, 3.0, 6) - 1.0); rg = rg * rg;
    float strata = fbmA(uv, vec2(2.0, 9.0), 5);
    vec3 c = wor(uv, 4.0, 1.0); float jm = smoothstep(0.38, 0.62, fbm(uv + 2.4, 5.0, 4));
    float crack = smoothstep(0.08, 0.0, c.y - c.x) * jm; crack *= crack; vec3 c2 = wor(uv + 0.5, 11.0, 1.0); float crack2 = smoothstep(0.035, 0.0, c2.y - c2.x) * smoothstep(0.5, 0.7, fbm(uv, 7.0, 3)) * 0.5;
    float spk = vn(uv * 256.0, 256.0);
    col = mix(vec3(0.33, 0.33, 0.32), vec3(0.56, 0.55, 0.52), 0.5 * rg + 0.3 * strata + 0.2 * c.z) * (0.86 + 0.26 * spk);
    float streak = fbmA(uv + 4.0, vec2(24.0, 2.0), 4); col *= 0.8 + 0.32 * streak;
    float stain = fbm(uv + 6.0, 4.0, 4); col = mix(col, col * vec3(1.08, 0.95, 0.82), smoothstep(0.5, 0.75, stain) * 0.7);
    float li = smoothstep(0.6, 0.66, fbm(uv + 4.1, 8.0, 5)) * smoothstep(0.3, 0.7, rg); col = mix(col, mix(vec3(0.5, 0.54, 0.3), vec3(0.66, 0.48, 0.2), step(0.55, fbm(uv, 6.0, 2))), li * 0.8);
    col *= 1.0 - 0.6 * max(crack, crack2);
    h = 0.55 * rg + 0.25 * strata + 0.15 * n3 - 0.45 * crack - 0.25 * crack2; r = 0.8 - li * 0.1;
  } else if (L == 5) { // forest floor: spruce needles, cones, small moss cushions, twigs, a few leaves
    col = mix(vec3(0.11, 0.075, 0.05), vec3(0.2, 0.14, 0.09), n1) * (0.85 + 0.3 * n3); h = n2 * 0.3; r = 0.92;
    vec3 s = strokes(uv, 46.0, 0.75, 0.05, 0.0, 6.28); if (s.x > 0.1) { col = mix(col, mix(vec3(0.46, 0.27, 0.12), vec3(0.62, 0.43, 0.22), s.z) * (0.75 + 0.35 * s.y), s.x); h = max(h, s.x * 0.5); }
    vec3 s2 = strokes(uv + 0.5, 30.0, 0.7, 0.05, 1.0, 6.28); if (s2.x > 0.1 && s2.z > 0.4) { col = mix(col, vec3(0.38, 0.22, 0.1) * (0.7 + 0.4 * s2.y), s2.x); h = max(h, s2.x * 0.45); }
    float ms = smoothstep(0.6, 0.66, fbm(uv + 0.7, 9.0, 5)); vec3 w = wor(uv, 110.0, 1.0);
    col = mix(col, mix(vec3(0.16, 0.25, 0.07), vec3(0.28, 0.36, 0.1), w.z) * (0.7 + 0.5 * (1.0 - w.x)), ms); h = mix(h, 0.5 + 0.3 * (1.0 - w.x), ms);
    vec3 cn = wor(uv, 7.0, 1.0); if (cn.z > 0.82 && cn.x < 0.13) { col = vec3(0.3, 0.19, 0.1) * (0.6 + 2.0 * (0.13 - cn.x)); h = max(h, 0.8 - cn.x * 3.0); }
    vec3 t = strokes(uv, 5.0, 0.8, 0.03, 0.4, 6.28); if (t.x > 0.3 && t.z > 0.72) { col = mix(col, vec3(0.3, 0.21, 0.13), t.x); h = max(h, 0.7 * t.x); }
  } else if (L == 6) { // snow: soft drifts, wind-polished crust
    col = mix(vec3(0.82, 0.86, 0.92), vec3(0.95, 0.96, 0.98), n1) * (0.97 + 0.04 * n3); h = n1 * 0.6 + n2 * 0.2; r = 0.55 + 0.35 * vn(uv * 200.0, 200.0);
  } else if (L == 7) { // gravel & shingle beach: packed rounded stones
    vec3 a = wor(uv, 18.0, 1.0), b = wor(uv + 0.31, 31.0, 1.0); vec3 w = a.x / (0.45 + 0.2 * a.z) < b.x / (0.45 + 0.2 * b.z) ? a : b; float rad = 0.45 + 0.2 * w.z;
    float d = clamp(1.0 - w.x / rad, 0.0, 1.0); vec3 sc = mix(mix(vec3(0.38, 0.37, 0.35), vec3(0.55, 0.52, 0.47), fract(w.z * 7.0)), vec3(0.42, 0.33, 0.25), step(0.8, fract(w.z * 3.0)));
    col = mix(vec3(0.1, 0.09, 0.08), sc * (0.8 + 0.3 * d), smoothstep(0.0, 0.18, d)); h = sqrt(d) * 0.9; r = 0.7;
  } else if (L == 8) { // weathered planks: grain, one butt-joint per board, knots, iron nails, gaps
    float N = 4.0; float b = floor(uv.y * N); float fy = fract(uv.y * N); float jx = h21(vec2(b, 3.0));
    float ux = fract(uv.x - jx); float side = step(0.5, ux); float bid = h21(vec2(b, side + 1.0));
    float grain = fbmA(uv + vec2(0.0, bid), vec2(2.0, 44.0), 5); float ring = sin((grain * 7.0 + fy * 2.0 + bid * 5.0) * TAU) * 0.5 + 0.5;
    col = mix(vec3(0.35, 0.27, 0.19), vec3(0.53, 0.42, 0.31), bid * 0.55 + grain * 0.45) * (0.8 + 0.26 * ring); col = sat(col, 0.7);
    float gap = smoothstep(0.0, 0.03, fy) * smoothstep(1.0, 0.97, fy); float jd = min(ux, 1.0 - ux); float joint = smoothstep(0.0, 0.006, jd) * smoothstep(0.0, 0.006, abs(ux - 0.5));
    float wear = smoothstep(0.4, 0.0, min(fy, 1.0 - fy)) * 0.15; col *= 1.0 - wear;
    col *= mix(0.22, 1.0, gap * joint); h = 0.55 * gap * joint + 0.25 * grain + 0.1 * ring;
    vec3 k = wor(uv, 6.0, 1.0); if (k.z > 0.78) { float e = smoothstep(0.1, 0.02, k.x * vec2(1.0, 1.0).x); col = mix(col, vec3(0.19, 0.12, 0.07), e); h -= 0.2 * e; }
    for (int q = 0; q < 2; q++) { vec2 np = vec2(min(abs(ux - 0.5), jd) * 4.0, fy - (q == 0 ? 0.3 : 0.7)); if (length(np * vec2(1.0, 1.0) - vec2(0.05, 0.0)) < 0.022) { col = vec3(0.13, 0.12, 0.11); h = 0.7; } }
    r = 0.88;
  } else if (L == 9) { // wattle and daub: woven hazel rods under cracked clay plaster
    float rows = 12.0; float ry = uv.y * rows; float row = floor(ry); float fy = fract(ry);
    float wv = sin((uv.x * 8.0 + row * 0.5) * TAU) * 0.18; float rod = smoothstep(0.42, 0.18, abs(fy - 0.5 - wv));
    float stake = smoothstep(0.035, 0.01, abs(fract(uv.x * 8.0) - 0.5));
    vec3 wood = mix(vec3(0.33, 0.23, 0.14), vec3(0.45, 0.33, 0.2), fbmA(uv, vec2(16.0, 2.0), 3));
    float hw = max(rod * (0.6 + 0.4 * cos((uv.x * 8.0 + row * 0.5) * TAU)), stake);
    float daub = smoothstep(0.38, 0.5, fbm(uv + 0.9, 5.0, 6) + 0.12);
    vec3 clay = mix(vec3(0.58, 0.48, 0.34), vec3(0.72, 0.62, 0.46), n2) * (0.9 + 0.15 * n3);
    vec3 cc = wor(uv, 9.0, 1.0); float crk = smoothstep(0.018, 0.0, cc.y - cc.x) * daub * smoothstep(0.45, 0.65, fbm(uv + 6.0, 6.0, 4)); clay *= 1.0 - 0.45 * crk;
    col = mix(wood * (0.6 + 0.5 * hw), clay, daub); h = mix(hw * 0.7, 0.75 + 0.2 * n2, daub) - crk * 0.2; r = 0.93;
  } else if (L == 10) { // turf roof: long grass, dry tufts, sod showing through
    col = mix(vec3(0.17, 0.13, 0.08), vec3(0.24, 0.2, 0.11), n1); h = n2 * 0.25; r = 0.92;
    vec3 s1 = strokes(uv, 14.0, 1.2, 0.08, -1.57, 1.2), s2 = strokes(uv + 0.4, 24.0, 1.0, 0.07, -1.57, 2.0);
    for (int k = 0; k < 2; k++) { vec3 s = k == 0 ? s1 : s2; if (s.x > 0.05) { vec3 g = mix(vec3(0.2, 0.3, 0.08), vec3(0.42, 0.42, 0.14), s.z); if (s.z > 0.7) g = mix(vec3(0.5, 0.42, 0.2), vec3(0.6, 0.52, 0.28), s.y);
      g *= 0.55 + 0.55 * s.y; float hh = s.x * (0.3 + 0.7 * s.y); if (hh > h) { col = mix(col, g, s.x); h = hh; } } }
  } else if (L == 11) { // wooden shingles: staggered overlapping courses
    float N = 9.0, M = 7.0; float row = floor(uv.y * N); float fy = fract(uv.y * N); float x = uv.x * M + 0.5 * mod(row, 2.0); float col_ = floor(x); float fx = fract(x);
    float id = h21(vec2(mod(col_, M), row)); float grain = fbmA(uv + id, vec2(4.0, 30.0), 4);
    col = mix(vec3(0.3, 0.25, 0.2), vec3(0.47, 0.4, 0.32), id * 0.7 + grain * 0.3) * (0.85 + 0.2 * grain);
    float edge = smoothstep(0.0, 0.05, fx) * smoothstep(1.0, 0.95, fx); float lap = smoothstep(0.0, 0.12, fy);
    col *= mix(0.35, 1.0, edge) * mix(0.55, 1.0, lap); h = (1.0 - fy) * 0.6 * edge + grain * 0.2; // thick butt at the lower edge
    float moss = smoothstep(0.62, 0.7, fbm(uv + 3.3, 4.0, 5)) * (1.0 - fy); col = mix(col, vec3(0.25, 0.32, 0.12), moss * 0.8); r = 0.86;
  } else if (L == 12) { // dry stone: fitted boulders with dark soil joints and lichen
    vec3 w = wor(uv, 4.0, 0.85); float d = w.y - w.x; float st = smoothstep(0.02, 0.09, d);
    col = mix(vec3(0.38, 0.37, 0.34), vec3(0.58, 0.55, 0.5), w.z * 0.6 + n2 * 0.4) * (0.85 + 0.25 * n3);
    float li = smoothstep(0.62, 0.68, fbm(uv + 7.0, 5.0, 4)); col = mix(col, vec3(0.6, 0.6, 0.38), li * 0.6);
    col = mix(vec3(0.1, 0.09, 0.07), col, st); h = st * (0.5 + 0.4 * smoothstep(0.0, 0.3, d) + 0.1 * n2); r = 0.85;
  } else if (L == 13) { // tarred timber: dark resinous grain with a dull sheen
    float grain = fbmA(uv, vec2(3.0, 48.0), 5); float ring = sin((grain * 9.0) * TAU) * 0.5 + 0.5;
    col = mix(vec3(0.09, 0.06, 0.04), vec3(0.2, 0.13, 0.08), grain * 0.7 + ring * 0.3); h = grain * 0.5 + ring * 0.15; r = 0.42 + 0.25 * n2;
  } else if (L == 14) { // barley stubble: drilled rows of stalks over dark tilth
    float rows = 16.0; float fy = fract(uv.y * rows); float rowM = smoothstep(0.5, 0.15, abs(fy - 0.5));
    col = mix(vec3(0.2, 0.15, 0.1), vec3(0.28, 0.21, 0.14), n1); h = n2 * 0.2;
    vec3 s = strokes(uv, 32.0, 0.6, 0.06, 1.57, 0.6); float m = s.x * rowM;
    col = mix(col, mix(vec3(0.62, 0.5, 0.26), vec3(0.78, 0.66, 0.38), s.z) * (0.6 + 0.5 * s.y), m); h = max(h, m * (0.4 + 0.6 * s.y)); r = 0.9;
  } else { // thatch / straw bundles
    vec3 s1 = strokes(uv, 18.0, 1.6, 0.09, 1.57, 0.25), s2 = strokes(uv + 0.3, 30.0, 1.2, 0.07, 1.57, 0.35);
    col = vec3(0.3, 0.24, 0.12); h = 0.1; r = 0.9;
    for (int k = 0; k < 2; k++) { vec3 s = k == 0 ? s1 : s2; vec3 g = mix(vec3(0.6, 0.5, 0.26), vec3(0.78, 0.68, 0.42), s.z) * (0.6 + 0.5 * s.y); float hh = s.x * (0.4 + 0.6 * s.z); if (hh > h) { col = mix(col, g, s.x); h = hh; } }
  }
  col = clamp(col, 0.0, 1.0); h = clamp(h, 0.0, 1.0);
}
void main() {
  vec3 col; float h, r; layer(uLayer, vUv, col, h, r);
  if (uOut == 0) gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), r);
  else gl_FragColor = vec4(h, h, h, 1.0);
}`;
const NORM = /* glsl */`
precision highp float; uniform sampler2D uH; uniform float uK; varying vec2 vUv;
float H(vec2 o) { return texture2D(uH, fract(vUv + o / ${RES}.0)).r; }
void main() { float dx = (H(vec2(1, 0)) - H(vec2(-1, 0))) * 0.5 + (H(vec2(2, 0)) - H(vec2(-2, 0))) * 0.125, dy = (H(vec2(0, 1)) - H(vec2(0, -1))) * 0.5 + (H(vec2(0, 2)) - H(vec2(0, -2))) * 0.125;
  vec3 n = normalize(vec3(-dx * uK, -dy * uK, 1.0)); float ao = clamp(1.0 - (H(vec2(0)) < 0.5 ? (0.5 - H(vec2(0))) * 0.6 : 0.0), 0.0, 1.0);
  gl_FragColor = vec4(n * 0.5 + 0.5, H(vec2(0))); }`;
// normal strength per layer (height is 0..1 across the tile)
const STRENGTH = [26, 18, 14, 5, 22, 22, 6, 24, 18, 22, 26, 20, 26, 12, 22, 24];

export function generateTextures(renderer) {
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const gen = new THREE.ShaderMaterial({ uniforms: { uLayer: { value: 0 }, uOut: { value: 0 } }, vertexShader: vs, fragmentShader: GEN });
  const nor = new THREE.ShaderMaterial({ uniforms: { uH: { value: null }, uK: { value: 10 } }, vertexShader: vs, fragmentShader: NORM });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gen); scene.add(quad);
  const opt = { type: THREE.UnsignedByteType, depthBuffer: false };
  const rtA = new THREE.WebGLRenderTarget(RES, RES, opt), rtH = new THREE.WebGLRenderTarget(RES, RES, { ...opt, type: THREE.HalfFloatType, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }), rtN = new THREE.WebGLRenderTarget(RES, RES, opt);
  const nL = LAYERS.length, A = new Uint8Array(RES * RES * 4 * nL), N = new Uint8Array(RES * RES * 4 * nL);
  const prevRT = renderer.getRenderTarget(), prevTM = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
  const prevCS = renderer.outputColorSpace;
  for (let l = 0; l < nL; l++) {
    quad.material = gen; gen.uniforms.uLayer.value = l;
    gen.uniforms.uOut.value = 0; renderer.setRenderTarget(rtA); renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rtA, 0, 0, RES, RES, A.subarray(l * RES * RES * 4, (l + 1) * RES * RES * 4));
    gen.uniforms.uOut.value = 1; renderer.setRenderTarget(rtH); renderer.render(scene, cam);
    quad.material = nor; nor.uniforms.uH.value = rtH.texture; nor.uniforms.uK.value = STRENGTH[l];
    renderer.setRenderTarget(rtN); renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rtN, 0, 0, RES, RES, N.subarray(l * RES * RES * 4, (l + 1) * RES * RES * 4));
  }
  renderer.setRenderTarget(prevRT); renderer.toneMapping = prevTM; renderer.outputColorSpace = prevCS;
  const mk = (data, srgb) => {
    const t = new THREE.DataArrayTexture(data, RES, RES, nL);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true; return t;
  };
  for (const r of [rtA, rtH, rtN]) r.dispose(); gen.dispose(); nor.dispose();
  // mean linear albedo per layer, so materials can be calibrated to a target reflectance
  const lin = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; lin[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
  const means = [];
  for (let l = 0; l < nL; l++) { let r = 0, g = 0, b = 0, n = 0; const o = l * RES * RES * 4; for (let i = 0; i < RES * RES * 4; i += 64) { r += lin[A[o + i]]; g += lin[A[o + i + 1]]; b += lin[A[o + i + 2]]; n++; } means.push([r / n, g / n, b / n]); }
  return { albedo: mk(A, true), normal: mk(N, false), count: nL, means };
}
