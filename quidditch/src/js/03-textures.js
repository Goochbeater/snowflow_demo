// ===================== PROCEDURAL TEXTURES =====================
const Tex = {};

function canvasTex(w, h, draw, srgb = true, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  t.needsUpdate = true;
  t.userData.canvas = c;
  return t;
}

function makeNoiseTexture(size = 256) {
  const data = new Uint8Array(size * size * 4);
  const lattice = (period, seed) => { const r = mulberry32(seed); const g = new Float32Array(period * period); for (let i = 0; i < g.length; i++) g[i] = r(); return g; };
  const vn = (g, P, x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % P) + P) % P, x1 = (x0 + 1) % P, y0 = ((yi % P) + P) % P, y1 = (y0 + 1) % P;
    const a = g[y0 * P + x0], b = g[y0 * P + x1], c = g[y1 * P + x0], d = g[y1 * P + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const chan = (base, oct, seed) => {
    const out = new Float32Array(size * size); const lats = [];
    for (let o = 0; o < oct; o++) lats.push(lattice(base << o, seed + o * 31));
    let mn = 1e9, mx = -1e9;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let s = 0, amp = 0.5;
      for (let o = 0; o < oct; o++) { const P = base << o; s += vn(lats[o], P, x / size * P, y / size * P) * amp; amp *= 0.5; }
      out[y * size + x] = s; if (s < mn) mn = s; if (s > mx) mx = s;
    }
    for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) / (mx - mn);
    return out;
  };
  const R = chan(4, 5, 11), G = chan(8, 4, 57), B = chan(16, 3, 91);
  // tileable cellular (F1) for droplets/sparkle
  const pts = []; const r = mulberry32(5);
  for (let i = 0; i < 28; i++) pts.push([r(), r()]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = x / size, py = y / size; let d = 9;
    for (const [qx, qy] of pts) { let dx = Math.abs(px - qx), dy = Math.abs(py - qy); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); d = Math.min(d, dx * dx + dy * dy); }
    const i = (y * size + x) * 4;
    data[i] = R[y * size + x] * 255; data[i + 1] = G[y * size + x] * 255; data[i + 2] = B[y * size + x] * 255;
    data[i + 3] = clamp(1 - Math.sqrt(d) * 9, 0, 1) * 255;
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

function shieldPath(g, cx, cy, w, h) {
  g.beginPath();
  g.moveTo(cx - w / 2, cy - h / 2);
  g.lineTo(cx + w / 2, cy - h / 2);
  g.lineTo(cx + w / 2, cy + h * 0.05);
  g.quadraticCurveTo(cx + w / 2, cy + h * 0.38, cx, cy + h / 2);
  g.quadraticCurveTo(cx - w / 2, cy + h * 0.38, cx - w / 2, cy + h * 0.05);
  g.closePath();
}
function drawCrest(g, team, cx, cy, w, h, font) {
  const T = CONFIG.teams[team];
  g.save();
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = w * 0.08; g.shadowOffsetY = w * 0.03;
  shieldPath(g, cx, cy, w, h);
  const gr = g.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  gr.addColorStop(0, T.c1); gr.addColorStop(1, shade(T.c1, -0.35));
  g.fillStyle = gr; g.fill(); g.restore();
  g.lineWidth = w * 0.07; g.strokeStyle = T.c2; shieldPath(g, cx, cy, w, h); g.stroke();
  g.lineWidth = w * 0.018; g.strokeStyle = 'rgba(255,255,255,.35)'; shieldPath(g, cx, cy, w * 0.8, h * 0.82); g.stroke();
  // chevron + letter
  g.fillStyle = shade(T.c2, 0.1); g.globalAlpha = 0.9;
  g.beginPath(); g.moveTo(cx - w * 0.4, cy + h * 0.12); g.lineTo(cx, cy - h * 0.02); g.lineTo(cx + w * 0.4, cy + h * 0.12); g.lineTo(cx + w * 0.4, cy + h * 0.2); g.lineTo(cx, cy + h * 0.06); g.lineTo(cx - w * 0.4, cy + h * 0.2); g.closePath(); g.fill();
  g.globalAlpha = 1;
  g.fillStyle = T.c2; g.font = `900 ${Math.round(h * 0.42)}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = w * 0.04;
  if (T.kind && T.kind !== 'house' && T.emblem) drawEmblem(g, T.emblem, cx, cy - h * 0.13, w * 0.52, T.c2, shade(T.c1, -0.25));
  else g.fillText(T.letter, cx, cy - h * 0.14);
  g.shadowBlur = 0;
  // stars
  g.fillStyle = shade(T.c2, 0.3);
  for (const sx of [-0.28, 0.28]) star(g, cx + w * sx, cy + h * 0.3, w * 0.05);
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, hsl.s, clamp(hsl.l + amt * (amt > 0 ? 1 - hsl.l : hsl.l), 0, 1), THREE.SRGBColorSpace);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}

function drawBannerAtlas(g, teams, font) {
  for (let i = 0; i < 4; i++) {
    const team = teams[i], T = CONFIG.teams[team], x0 = i * 256;
    const gr = g.createLinearGradient(x0, 0, x0, 768); gr.addColorStop(0, shade(T.c1, 0.12)); gr.addColorStop(1, shade(T.c1, -0.3));
    g.fillStyle = gr; g.fillRect(x0, 0, 256, 768);
    g.fillStyle = T.c2; g.fillRect(x0, 0, 18, 768); g.fillRect(x0 + 238, 0, 18, 768);
    g.fillStyle = shade(T.c2, -0.25); g.fillRect(x0 + 24, 0, 4, 768); g.fillRect(x0 + 228, 0, 4, 768);
    // valance scallops
    g.fillStyle = T.c2; g.fillRect(x0, 0, 256, 34);
    for (let s = 0; s < 6; s++) { g.beginPath(); g.arc(x0 + 21 + s * 43, 34, 21, 0, Math.PI); g.fill(); }
    drawCrest(g, team, x0 + 128, 250, 170, 210, font);
    // lower stripes (also used by long stand banners: v in [0, 0.22])
    for (let s = 0; s < 5; s++) { g.fillStyle = s % 2 ? T.c2 : shade(T.c1, -0.1); g.fillRect(x0, 520 + s * 34, 256, 34); }
    g.fillStyle = T.c2;
    for (let s = 0; s < 16; s++) { g.beginPath(); g.moveTo(x0 + s * 16, 690); g.lineTo(x0 + s * 16 + 16, 690); g.lineTo(x0 + s * 16 + 8, 740); g.closePath(); g.fill(); }
    // cloth weave noise
    g.globalAlpha = 0.06;
    for (let k = 0; k < 1400; k++) { g.fillStyle = k % 2 ? '#000' : '#fff'; g.fillRect(x0 + Math.random() * 256, Math.random() * 768, 2, 1 + Math.random() * 6); }
    g.globalAlpha = 1;
  }
}

async function buildTextures() {
  let font = 'Georgia, serif';
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.race([document.fonts.load('900 64px "Cinzel Decorative"'), new Promise(r => setTimeout(r, 1500))]);
      if (document.fonts.check('900 64px "Cinzel Decorative"')) font = '"Cinzel Decorative", Georgia, serif';
    }
  } catch (e) { /* fonts unavailable */ }
  Tex.font = font;
  Tex.noise = makeNoiseTexture(256);

  // tall banner atlas: 4 cells of 256x768, one per stand sector (re-drawn when the stadium is dressed)
  Tex.banners = canvasTex(1024, 768, (g) => drawBannerAtlas(g, [0, 1, 2, 3], font));
  Tex.crestURL = CONFIG.teams.map((_, i) => {
    const c = document.createElement('canvas'); c.width = 92; c.height = 112;
    drawCrest(c.getContext('2d'), i, 46, 56, 80, 100, font);
    return c.toDataURL();
  });

  Tex.wood = canvasTex(256, 256, (g) => {
    g.fillStyle = '#7a5434'; g.fillRect(0, 0, 256, 256);
    for (let p = 0; p < 8; p++) {
      const y0 = p * 32, base = 0.82 + Math.random() * 0.3;
      g.fillStyle = `rgba(${Math.round(120 * base)},${Math.round(84 * base)},${Math.round(52 * base)},1)`; g.fillRect(0, y0, 256, 32);
      for (let l = 0; l < 26; l++) {
        g.strokeStyle = `rgba(40,22,10,${0.08 + Math.random() * 0.14})`; g.lineWidth = 0.6 + Math.random() * 1.4;
        g.beginPath(); const yy = y0 + Math.random() * 32; g.moveTo(0, yy);
        for (let x = 0; x <= 256; x += 16) g.lineTo(x, yy + Math.sin(x * 0.05 + l) * 1.6);
        g.stroke();
      }
      if (Math.random() < 0.6) { g.fillStyle = 'rgba(45,25,12,.45)'; g.beginPath(); g.ellipse(Math.random() * 256, y0 + 16, 6, 3, 0, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(25,14,6,.75)'; g.fillRect(0, y0, 256, 2);
      const nx = Math.random() * 256; g.fillRect(nx, y0, 2, 32);
    }
  }, true, true);

  Tex.crowd = canvasTex(256, 128, (g) => {
    const R = '#ff0000', Gc = '#00ff00', B = '#0000ff';
    for (let v = 0; v < 4; v++) {
      const x0 = v * 64, cx = x0 + 32;
      g.fillStyle = R;
      g.beginPath(); g.moveTo(cx - 17, 128); g.lineTo(cx - 15, 74); g.quadraticCurveTo(cx, 64, cx + 15, 74); g.lineTo(cx + 17, 128); g.fill();
      const arm = (sx, sy, ex, ey, w = 7) => { g.strokeStyle = R; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke(); g.fillStyle = Gc; g.beginPath(); g.arc(ex, ey, 4, 0, TAU); g.fill(); };
      if (v === 0) { arm(cx - 14, 78, cx - 17, 112); arm(cx + 14, 78, cx + 17, 112); }
      if (v === 1) { arm(cx - 13, 77, cx - 26, 40); arm(cx + 13, 77, cx + 26, 40); }
      if (v === 2) { arm(cx - 13, 77, cx - 22, 36); arm(cx + 13, 77, cx + 22, 36); g.fillStyle = R; g.fillRect(cx - 30, 26, 60, 8); }
      if (v === 3) { arm(cx - 14, 78, cx - 17, 112); arm(cx + 13, 77, cx + 21, 44); g.fillStyle = '#000'; g.fillRect(cx + 20, 6, 3, 42); g.fillStyle = R; g.beginPath(); g.moveTo(cx + 23, 6); g.lineTo(cx + 31, 12); g.lineTo(cx + 23, 26); g.fill(); }
      g.fillStyle = Gc; g.beginPath(); g.ellipse(cx, 56, 10, 12, 0, 0, TAU); g.fill();
      g.fillStyle = B; g.beginPath(); g.ellipse(cx, 50, 11, 8, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - 11, 48, 3, 9); g.fillRect(cx + 8, 48, 3, 9);
    }
  }, false);
  Tex.crowd.anisotropy = 1;

  Tex.quaffle = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#7c1a12'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,5,2' : '160,60,40'},${Math.random() * 0.12})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, TAU); g.fill(); }
    for (const yy of [h * 0.33, h * 0.67]) {
      g.strokeStyle = 'rgba(30,6,3,.9)'; g.lineWidth = 6; g.beginPath();
      for (let x = 0; x <= w; x += 4) g.lineTo(x, yy + Math.sin(x / w * TAU * 2) * 26); g.stroke();
      g.strokeStyle = 'rgba(230,200,160,.75)'; g.lineWidth = 2;
      for (let x = 0; x <= w; x += 14) { const y = yy + Math.sin(x / w * TAU * 2) * 26; g.beginPath(); g.moveTo(x - 3, y - 5); g.lineTo(x + 3, y + 5); g.stroke(); }
    }
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(20,4,2,.85)'; g.beginPath(); g.ellipse(w * (0.17 + i * 0.33), h * 0.5, 22, 18, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(200,170,120,.5)'; g.lineWidth = 3; g.stroke(); }
  });

  Tex.bludger = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#26262b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '120,110,100'},${Math.random() * 0.18})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 0, TAU); g.fill(); }
    for (let i = 0; i < 14; i++) { const x = Math.random() * w, y = h * 0.2 + Math.random() * h * 0.6, r = 4 + Math.random() * 10; const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(140,130,120,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    for (let x = 6; x < w; x += 16) { g.fillStyle = '#7a756c'; g.beginPath(); g.arc(x, h / 2, 2.5, 0, TAU); g.fill(); }
  });

  Tex.puff = canvasTex(128, 128, (g) => {
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * TAU, d = Math.random() * 30, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * 0.8, r = 20 + Math.random() * 26;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.34)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    const id = g.getImageData(0, 0, 128, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4, dx = (x - 64) / 64, dy = (y - 64) / 64, rr = Math.sqrt(dx * dx + dy * dy);
      id.data[i + 3] = Math.min(255, id.data[i + 3] * 1.6 * clamp(1.1 - rr, 0, 1));
    }
    g.putImageData(id, 0, 0);
  }, false);
}
