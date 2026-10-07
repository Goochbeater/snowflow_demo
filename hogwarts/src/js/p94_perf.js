/* ==== p94_perf.js ==== */
/* PERF — graphics to suit the device. Four settings, chosen in the pause menu and kept:
     AUTO    a phone starts at MEDIUM and steps down by itself if the frame rate will not hold; a desktop runs HIGH
     HIGH    the game as built: ~1.6 MP, 2× MSAA, SSAO, the marched sunlight, screen-space reflections, 2048 shadows
     MEDIUM  ~1.0 MP, no MSAA (the composite's sharpen does the edges), SSAO, the marched sunlight, 1024 shadows
     LOW     ~0.62 MP, no SSAO, light shafts instead of the marched volume, no reflections, shadows every third frame
   On a phone the resolution also breathes with the frame rate (down to 62 % of the budget, aiming at 30+), and
   textures larger than 1024² are halved as they are made (eight 2048² maps were ~170 MB of video memory). */
const PERF = { set: 'auto', tier: 'high', mob: false, lowT: 0, dynT: 0, stepped: false };
PERF.mob = (() => { const ua = navigator.userAgent || ''; return /Android|iPhone|iPad|Mobile/i.test(ua) || (TOUCH.want() && Math.min(screen.width || 9999, screen.height || 9999) < 1000); })() || MG.flags.mob === 1 || MG.flags.mob === true;
try { const s = localStorage.getItem('hl_gfx'); if (s && /^(auto|high|medium|low)$/.test(s)) PERF.set = s; } catch (e) { /* */ }
if (MG.flags.gfx && /^(auto|high|medium|low)$/.test(MG.flags.gfx)) PERF.set = MG.flags.gfx;
PERF.pick = () => PERF.set === 'auto' ? (PERF.mob ? (PERF.stepped ? 'low' : 'medium') : 'high') : PERF.set;
PERF.BUDGET = { high: [1.6e6, 1.25], medium: [1.0e6, 1.1], low: [0.62e6, 0.95] };
PERF.tier = PERF.pick();
PERF.texCap = () => PERF.mob || PERF.tier === 'low' ? 1024 : 4096;
/* a texture source no larger than the cap (an <img> above it is redrawn smaller) */
PERF.fit = function (img) {
  const cap = PERF.texCap(), w = img && (img.naturalWidth || img.width), h = img && (img.naturalHeight || img.height); if (!w || (w <= cap && h <= cap)) return img;
  const k = cap / Math.max(w, h), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); return c;
};
PERF.apply = function (resize) {
  PERF.tier = PERF.pick(); const T = PERF.tier;
  if (R.sun && R.sun.shadow) { const want = T === 'high' ? 2048 : 1024; if (R.sun.shadow.mapSize.x !== want) { R.sun.shadow.mapSize.set(want, want); if (R.sun.shadow.map) { R.sun.shadow.map.dispose(); R.sun.shadow.map = null; } } }
  R.shEvery = T === 'low' ? 3 : 2;
  if (resize !== false && R.renderer) R.resize(true);
};
/* the budget: pixels per frame by tier (an explicit ?dpr still wins) */
{ const rs0 = R.resize; R.resize = function () {
  const w = Math.max(1, window.innerWidth || 1280), h = Math.max(1, window.innerHeight || 720), B = PERF.BUDGET[PERF.tier] || PERF.BUDGET.high;
  if (MG.flags.dpr || PERF.tier === 'high' && !PERF.mob) return rs0.apply(this, arguments);
  R.cw = w; R.ch = h; R.dprBase = Math.min(window.devicePixelRatio || 1, B[1], Math.sqrt(B[0] / (w * h)));
  const wantMsaa = MG.flags.msaa !== undefined ? +MG.flags.msaa : 0; if (wantMsaa !== R.msaa) { R.msaa = wantMsaa; if (R.rt) { R.rt.dispose(); R.rt = null; R.w = 0; } }
  R.applyScale();
}; }
/* the frame: what the tier leaves out, and (on a phone) the resolution following the frame rate */
{ const r0 = R.render; R.render = function (dt) {
  const G = R.G, low = PERF.tier === 'low'; let ao, vol, ssr;
  if (low) { ao = G.ao; vol = G.vol; ssr = G.ssr; G.ao = 0; G.vol = 0; G.ssr = 0; }
  r0.call(this, dt);
  if (low) { G.ao = ao; G.vol = vol; G.ssr = ssr; }
  if (PERF.mob && dt > 0 && MG.state === 'play' && !document.hidden && MG.rt > 5 && !MG.headless) {
    PERF.dynT += dt; if (PERF.dynT > 1.5) { PERF.dynT = 0; const f = R.fpsEMA, old = R.dynScale;
      if (f < 29) R.dynScale = Math.max(0.62, R.dynScale - 0.07); else if (f > 48) R.dynScale = Math.min(1, R.dynScale + 0.05);
      if (Math.abs(old - R.dynScale) > 1e-3) R.applyScale();
      // AUTO steps down once if even the smallest frame will not hold
      if (PERF.set === 'auto' && !PERF.stepped && R.dynScale <= 0.63 && f < 25) { PERF.lowT += 1.5; if (PERF.lowT > 6) { PERF.stepped = true; R.dynScale = 0.85; PERF.apply(); HL.ui && HL.ui.pop && HL.ui.pop('GRAPHICS · LOW'); } } else PERF.lowT = 0; } }
}; }
/* the game turns its own dynamic resolution off when a level starts: on a phone ours takes over */
{ const os0 = HL.onStart; HL.onStart = function (L) { os0.call(this, L); if (PERF.mob) R.dynScale = 1; }; }
{ const ri0 = R.init; R.init = function () { ri0.apply(this, arguments); PERF.apply(false); }; }
/* textures: through the cap */
{ const at0 = AST.texture; AST.texture = async function (id, srgb, o) {
  if (PERF.texCap() >= 4096) return at0.apply(this, arguments);
  o = o || {}; const key = id + (srgb ? ':s' : ':l') + (o.flip === false ? 'n' : ''); if (AST.tex[key]) return AST.tex[key];
  const img = await AST.image(id); if (!img) { console.warn('AST: no texture', id); return null; }
  const t = new THREE.Texture(PERF.fit(img)); t.flipY = o.flip !== false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(o.aniso || 8, 4); t.needsUpdate = true;
  AST.tex[key] = t; return t;
}; }
{ const qt0 = QB.texture; QB.texture = async function (name, srgb) {
  if (PERF.texCap() >= 4096) return qt0.apply(this, arguments);
  const key = name + (srgb ? ':s' : ':l'); if (QB.tex[key]) return QB.tex[key];
  if (!ASSETS.has('tex_' + name)) return null;
  const img = new Image(); img.src = ASSETS.url('tex_' + name); try { await img.decode(); } catch (e) { /* */ }
  const t = new THREE.Texture(PERF.fit(img)); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; t.needsUpdate = true;
  QB.tex[key] = t; return t;
}; }
/* the pause menu: GRAPHICS · AUTO / HIGH / MEDIUM / LOW (in place of the old FULL / PERFORMANCE switch) */
{ const p0 = HL.ui.pause; HL.ui.pause = function () {
  p0.apply(this, arguments); if (MG.state !== 'pause') return; const b = HL.ui.el.Screen.querySelector('.hlBtn[data-a="q"]'); if (!b) return;
  const lbl = () => 'GRAPHICS · ' + PERF.set.toUpperCase() + (PERF.set === 'auto' ? ' (' + PERF.tier.toUpperCase() + ')' : '');
  b.textContent = lbl(); b.onclick = () => { const L = ['auto', 'high', 'medium', 'low']; PERF.set = L[(L.indexOf(PERF.set) + 1) % L.length]; PERF.stepped = false; try { localStorage.setItem('hl_gfx', PERF.set); localStorage.removeItem('hl_dpr'); } catch (e) { /* */ } MG.flags.dpr = 0; R.dynScale = 1; PERF.apply(); b.textContent = lbl(); };
}; }
