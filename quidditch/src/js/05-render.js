// ===================== RENDERER + POST PIPELINE (HDR, bloom, shafts, grading) =====================
const POST_VS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const PRE_FS = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee; varying vec2 vUv;
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
void main() {
  vec3 a = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  vec3 b = texture2D(tSrc, vUv + uTexel * vec2( 1.0, -1.0)).rgb;
  vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0,  1.0)).rgb;
  vec3 d = texture2D(tSrc, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  float wa = 1.0 / (1.0 + luma(a)), wb = 1.0 / (1.0 + luma(b)), wc = 1.0 / (1.0 + luma(c)), wd = 1.0 / (1.0 + luma(d));
  vec3 col = (a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd);
  float br = max(col.r, max(col.g, col.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee); soft = soft * soft / (4.0 * uKnee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  gl_FragColor = vec4(min(col * contrib, vec3(60.0)), 1.0);
}`;

const DOWN_FS = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
vec3 s(float x, float y) { return texture2D(tSrc, vUv + uTexel * vec2(x, y)).rgb; }
void main() {
  vec3 col = s(0.0, 0.0) * 0.125
    + (s(-2.0, 2.0) + s(2.0, 2.0) + s(-2.0, -2.0) + s(2.0, -2.0)) * 0.03125
    + (s(0.0, 2.0) + s(-2.0, 0.0) + s(2.0, 0.0) + s(0.0, -2.0)) * 0.0625
    + (s(-1.0, 1.0) + s(1.0, 1.0) + s(-1.0, -1.0) + s(1.0, -1.0)) * 0.125;
  gl_FragColor = vec4(col, 1.0);
}`;

const UP_FS = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uWeight; varying vec2 vUv;
vec3 s(float x, float y) { return texture2D(tSrc, vUv + uTexel * vec2(x, y)).rgb; }
void main() {
  vec3 col = (s(-1.0, 1.0) + s(1.0, 1.0) + s(-1.0, -1.0) + s(1.0, -1.0)) * 0.0625
    + (s(0.0, 1.0) + s(-1.0, 0.0) + s(1.0, 0.0) + s(0.0, -1.0)) * 0.125 + s(0.0, 0.0) * 0.25;
  gl_FragColor = vec4(col * uWeight, 1.0);
}`;

const COMP_FS = /* glsl */`
uniform sampler2D tScene; uniform sampler2D tBloom; uniform sampler2D tNoise;
uniform vec2 uRes; uniform float uTime;
uniform float uBloom, uExposure, uVignette, uCA, uBlur, uSat, uFlash, uKeepHue, uLetterbox, uGrain, uContrast, uRain, uCloudFog, uShafts, uHit;
uniform vec2 uBlurCenter; uniform vec2 uSunScreen;
uniform vec3 uFlashColor; uniform vec3 uKeepColor; uniform vec3 uTint; uniform vec3 uLift; uniform vec3 uCloudCol; uniform vec3 uShadowTint; uniform vec3 uHighTint; uniform float uFlare;
varying vec2 vUv;
vec3 aces(vec3 x) { const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
vec3 toSRGB(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  if (uRain > 0.001) {
    vec2 ruv = vec2(uv.x * aspect, uv.y) * 1.7;
    vec4 n = texture2D(tNoise, ruv + vec2(0.0, uTime * 0.02));
    vec4 n2 = texture2D(tNoise, ruv * 1.9 + vec2(0.37, uTime * 0.035));
    float drop = smoothstep(0.55, 0.75, n.a) + smoothstep(0.6, 0.8, n2.a) * 0.6;
    uv += (n.rg - 0.5) * 0.035 * drop * uRain;
  }
  vec2 dc = uv - 0.5;
  vec3 col;
  if (uCA > 0.0005) { vec2 off = dc * uCA; col = vec3(texture2D(tScene, uv - off).r, texture2D(tScene, uv).g, texture2D(tScene, uv + off).b); }
  else col = texture2D(tScene, uv).rgb;
  if (uBlur > 0.0005) {
    vec2 dir = (uv - uBlurCenter) * uBlur;
    vec3 acc = col;
    for (int i = 1; i < 10; i++) acc += texture2D(tScene, uv - dir * (float(i) / 10.0)).rgb;
    col = acc / 10.0;
  }
  vec3 bloom = texture2D(tBloom, uv).rgb;
  col += bloom * uBloom;
  if (uShafts > 0.001) {
    vec2 dl = uSunScreen - uv;
    float sd = length(dl * vec2(aspect, 1.0));
    vec2 d = dl * (0.55 / 16.0); vec2 p = uv; vec3 sh = vec3(0.0); float w = 1.0;
    for (int i = 0; i < 16; i++) { p += d; sh += min(texture2D(tBloom, clamp(p, 0.001, 0.999)).rgb, vec3(3.0)) * w; w *= 0.9; }
    col += sh * (uShafts * 0.045 * smoothstep(1.1, 0.05, sd));
  }
  if (uFlare > 0.001) {
    float vis = clamp(dot(texture2D(tBloom, uSunScreen).rgb, vec3(0.333)) * 0.35, 0.0, 1.0);
    vec2 sv = uSunScreen - 0.5; vec3 fl = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      float k = -0.35 - float(i) * 0.42;
      vec2 gp = 0.5 + sv * k;
      float d = length((uv - gp) * vec2(aspect, 1.0)), r = 0.025 + float(i) * 0.022;
      fl += mix(vec3(0.45, 0.75, 1.0), vec3(1.0, 0.6, 0.35), float(i) / 3.0) * (1.0 - smoothstep(r * 0.55, r, d)) * (0.22 - float(i) * 0.035);
    }
    float dy = abs(uv.y - uSunScreen.y), dx = abs(uv.x - uSunScreen.x) * aspect;
    fl += vec3(1.0, 0.72, 0.45) * exp(-dy * 120.0) * exp(-dx * 2.0) * 0.5;
    fl += vec3(1.0, 0.8, 0.6) * exp(-length((uv - uSunScreen) * vec2(aspect, 1.0)) * 7.0) * 0.25;
    col += fl * uFlare * vis;
  }
  col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * 0.5 + uCloudCol, uCloudFog * 0.8);
  col *= uExposure * uTint;
  col = aces(col);
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(col + uShadowTint * (1.0 - l) * (1.0 - l) + uHighTint * l * l, 0.0);
  float sat = uSat;
  if (uKeepHue > 0.001) {
    vec3 cn = col / max(max(col.r, max(col.g, col.b)), 1e-3);
    vec3 kn = uKeepColor / max(max(uKeepColor.r, max(uKeepColor.g, uKeepColor.b)), 1e-3);
    float m = 1.0 - smoothstep(0.22, 0.55, distance(cn, kn));
    sat = mix(sat, mix(0.0, 1.5, m), uKeepHue);
  }
  col = max(mix(vec3(l), col, sat), 0.0);
  col = toSRGB(col + uLift * (1.0 - col));
  col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float vig = smoothstep(0.55, 1.5, length(dc * 2.0 * vec2(1.0, 1.0 / max(aspect, 1.0) * 1.3)));
  col *= 1.0 - uVignette * vig;
  col = mix(col, vec3(0.6, 0.0, 0.0), uHit * vig * 0.85);
  col = mix(col, uFlashColor, uFlash);
  col += (hash(uv * uRes + fract(uTime) * 91.7) - 0.5) * uGrain;
  float bar = step(uv.y, uLetterbox) + step(1.0 - uLetterbox, uv.y);
  col *= 1.0 - clamp(bar, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

class Post {
  constructor(r, hdr) {
    this.r = r; this.type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(g); this.quad.frustumCulled = false;
    this.qscene = new THREE.Scene(); this.qscene.add(this.quad);
    this.qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mk = (fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: POST_VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, ...extra });
    this.mPre = mk(PRE_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.6 }, uKnee: { value: 0.6 } });
    this.mDown = mk(DOWN_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mUp = mk(UP_FS, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uWeight: { value: 1 } }, { blending: THREE.AdditiveBlending });
    this.fx = {
      bloom: 0.9, exposure: 1, vignette: 0.32, ca: 0, blur: 0, sat: 1.06, flash: 0, keepHue: 0, letterbox: 0,
      grain: 0.028, contrast: 1.04, rain: 0, cloudFog: 0, shafts: 0, hit: 0,
      blurCenter: new THREE.Vector2(0.5, 0.5), sunScreen: new THREE.Vector2(0.5, 0.5),
      flashColor: new THREE.Color(1, 1, 1), keepColor: new THREE.Color(1, 0, 0), tint: new THREE.Color(1, 1, 1), lift: new THREE.Color(0, 0, 0), cloudCol: new THREE.Color(0.7, 0.7, 0.7), shadowTint: new THREE.Color(0, 0, 0), highTint: new THREE.Color(0, 0, 0), flare: 0,
    };
    const U = (v) => ({ value: v });
    this.mComp = mk(COMP_FS, {
      tScene: U(null), tBloom: U(null), tNoise: SHARED.uNoise, uRes: U(new THREE.Vector2(1, 1)), uTime: SHARED.uTime,
      uBloom: U(0), uExposure: U(1), uVignette: U(0), uCA: U(0), uBlur: U(0), uSat: U(1), uFlash: U(0), uKeepHue: U(0), uLetterbox: U(0),
      uGrain: U(0), uContrast: U(1), uRain: U(0), uCloudFog: U(0), uShafts: U(0), uHit: U(0),
      uBlurCenter: U(this.fx.blurCenter), uSunScreen: U(this.fx.sunScreen), uFlashColor: U(this.fx.flashColor), uKeepColor: U(this.fx.keepColor), uTint: U(this.fx.tint), uLift: U(this.fx.lift), uCloudCol: U(this.fx.cloudCol), uShadowTint: U(this.fx.shadowTint), uHighTint: U(this.fx.highTint), uFlare: U(0),
    });
    this.levels = 5; this.mips = []; this.rt = null;
  }
  dispose() { if (this.rt) this.rt.dispose(); for (const m of this.mips) m.dispose(); this.mips = []; this.rt = null; }
  setSize(w, h, msaa, levels) {
    this.dispose(); this.w = w; this.h = h; this.levels = levels || 5;
    this.rt = new THREE.WebGLRenderTarget(w, h, { type: this.type, samples: msaa, depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    let mw = w, mh = h;
    for (let i = 0; i < this.levels; i++) {
      mw = Math.max(2, mw >> 1); mh = Math.max(2, mh >> 1);
      this.mips.push(new THREE.WebGLRenderTarget(mw, mh, { type: this.type, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }));
    }
    this.mComp.uniforms.uRes.value.set(w, h);
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.qscene, this.qcam); }
  render(scene, cam) {
    const r = this.r;
    r.setRenderTarget(this.rt); r.clear(true, true, false); r.render(scene, cam);
    const fx = this.fx;
    if (fx.bloom > 0.001) {
      this.mPre.uniforms.tSrc.value = this.rt.texture; this.mPre.uniforms.uTexel.value.set(1 / this.w, 1 / this.h);
      this.pass(this.mPre, this.mips[0]);
      for (let i = 1; i < this.levels; i++) { const s = this.mips[i - 1]; this.mDown.uniforms.tSrc.value = s.texture; this.mDown.uniforms.uTexel.value.set(1 / s.width, 1 / s.height); this.pass(this.mDown, this.mips[i]); }
      for (let i = this.levels - 1; i > 0; i--) { const s = this.mips[i]; this.mUp.uniforms.tSrc.value = s.texture; this.mUp.uniforms.uTexel.value.set(1 / s.width, 1 / s.height); this.mUp.uniforms.uWeight.value = 0.85; this.pass(this.mUp, this.mips[i - 1]); }
    }
    const u = this.mComp.uniforms;
    u.tScene.value = this.rt.texture; u.tBloom.value = this.mips[0].texture;
    u.uBloom.value = fx.bloom * 0.22; u.uExposure.value = fx.exposure; u.uVignette.value = fx.vignette; u.uCA.value = fx.ca; u.uBlur.value = fx.blur;
    u.uSat.value = fx.sat; u.uFlash.value = fx.flash; u.uKeepHue.value = fx.keepHue; u.uLetterbox.value = fx.letterbox; u.uGrain.value = fx.grain;
    u.uContrast.value = fx.contrast; u.uFlare.value = fx.flare; u.uRain.value = fx.rain; u.uCloudFog.value = fx.cloudFog; u.uShafts.value = fx.shafts; u.uHit.value = fx.hit;
    this.pass(this.mComp, null);
  }
}

const Render = {
  renderer: null, scene: null, camera: null, post: null, tier: CONFIG.tiers.high, dynScale: 1, pr: 1, sun: null, hemi: null, env: null,
  init(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.autoClear = false;
    r.setClearColor(0x000000, 1);
    this.hdr = r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float');
    const tname = Settings.quality === 'auto' ? Platform.autoTier : Settings.quality;
    this.tier = CONFIG.tiers[tname] || CONFIG.tiers.high;
    r.shadowMap.enabled = this.tier.shadow > 0;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, Platform.aspect, 0.05, 7000);
    this.scene.add(this.camera);
    this.post = new Post(r, this.hdr);
    // lights
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = this.tier.shadow > 0;
    const s = this.tier.shadow || 1024;
    this.sun.shadow.mapSize.set(s, s);
    const sc = this.sun.shadow.camera; sc.left = -78; sc.right = 78; sc.top = 78; sc.bottom = -78; sc.near = 10; sc.far = 900;
    this.sun.shadow.bias = -0.00035; this.sun.shadow.normalBias = 0.06;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0x8899cc, 0x44361e, 0.8);
    this.scene.add(this.hemi);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); Events.emit('contextlost'); }, false);
    canvas.addEventListener('webglcontextrestored', () => { this.post.dispose(); this.post = new Post(r, this.hdr); this.resize(); Events.emit('contextrestored'); }, false);
    this.resize();
  },
  resize() {
    const w = Platform.w, h = Platform.h, t = this.tier;
    const dpr = Math.min(Platform.dpr, t.prMax);
    const budget = Math.min(1, Math.sqrt(t.budget / (w * h * dpr * dpr)));
    this.pr = Math.max(0.5, dpr * budget * this.dynScale);
    this.renderer.setPixelRatio(this.pr);
    this.renderer.setSize(w, h, true);
    const bw = Math.max(2, Math.floor(w * this.pr)), bh = Math.max(2, Math.floor(h * this.pr));
    this.post.setSize(bw, bh, t.msaa, t.bloom);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },
  baseVFov() {
    const a = Platform.w / Platform.h, h = CONFIG.fov.h * DEG;
    const v = Math.min(2 * Math.atan(Math.tan(h / 2) / a), CONFIG.fov.vMax * DEG);
    return v / DEG;
  },
  setFov(mul) {
    const v = this.baseVFov() * DEG;
    const f = 2 * Math.atan(Math.tan(v / 2) * mul) / DEG;
    if (Math.abs(f - this.camera.fov) > 0.01) { this.camera.fov = f; this.camera.updateProjectionMatrix(); }
  },
  dropTier() {
    const order = ['ultra', 'high', 'med', 'low']; const i = order.indexOf(this.tier.name);
    if (i < 0 || i >= order.length - 1) return false;
    this.applyTier(order[i + 1]); return true;
  },
  applyTier(name) {
    const prevShadow = this.tier.shadow > 0;
    this.tier = CONFIG.tiers[name];
    const on = this.tier.shadow > 0;
    if (on) { this.sun.shadow.mapSize.set(this.tier.shadow, this.tier.shadow); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
    if (on !== prevShadow) {
      this.renderer.shadowMap.enabled = on; this.sun.castShadow = on;
      this.scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); });
    }
    World.applyDensity && World.applyDensity();
    this.dynScale = 1;
    this.resize();
  },
  buildEnv() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const sc = new THREE.Scene();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), World.skyMat);
    sc.add(sky);
    const rt = pm.fromScene(sc, 0, 0.5, 400);
    if (this.env) this.env.dispose();
    this.env = rt;
    this.scene.environment = rt.texture;
    pm.dispose(); sky.geometry.dispose();
  },
  placeSun(focus) {
    const d = SHARED.uSunDirW.value, step = 156 / (this.tier.shadow || 1024);
    const fx = Math.round(focus.x / step) * step, fz = Math.round(focus.z / step) * step, fy = Math.round(Math.max(0, focus.y * 0.5) / step) * step;
    this.sun.target.position.set(fx, fy, fz);
    this.sun.position.set(fx + d.x * 420, fy + d.y * 420, fz + d.z * 420);
    this.sun.target.updateMatrixWorld();
  },
  render() { this.post.render(this.scene, this.camera); },
};

const Perf = {
  acc: 0, n: 0, t: 0, stable: 0, slow: 0, lastUp: -99, lockUntil: 0, fps: 60,
  sample(dt) {
    this.acc += dt; this.n++; this.t += dt;
    if (this.t >= 0.5) { const avg = this.acc / this.n; this.fps = 1 / avg; this.evaluate(avg); this.acc = 0; this.n = 0; this.t = 0; }
  },
  evaluate(avg) {
    const target = 1 / Settings.fps, now = performance.now() / 1000;
    if (avg > target * 1.14) {
      this.stable = 0;
      if (Render.dynScale > 0.56) {
        Render.dynScale = Math.max(0.55, Render.dynScale * 0.9); Render.resize();
        if (now - this.lastUp < 4) this.lockUntil = now + 25;
      } else if ((this.slow += 0.5) > 3) { this.slow = 0; Render.dropTier(); }
    } else {
      this.slow = 0; this.stable += 0.5;
      if (this.stable > 6 && Render.dynScale < 1 && now > this.lockUntil) { Render.dynScale = Math.min(1, Render.dynScale * 1.06); Render.resize(); this.lastUp = now; this.stable = 0; }
    }
  },
};
