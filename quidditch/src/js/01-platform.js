// ===================== PLATFORM: viewport, fold, GPU tier, device APIs =====================
const Platform = {
  w: 1, h: 1, dpr: 1, aspect: 1, wide: false, portrait: false, gpu: '', autoTier: 'med', noWebGL2: false, wake: null,
  init() {
    this.measure();
    this.detectGPU();
    let t = 0;
    const onR = () => { clearTimeout(t); t = setTimeout(() => this.onResize(), 150); };
    addEventListener('resize', onR);
    try { screen.orientation && screen.orientation.addEventListener('change', onR); } catch (e) { /* older browsers */ }
    if (window.visualViewport) visualViewport.addEventListener('resize', onR);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { Events.emit('hidden'); this.releaseWake(); }
      else { Events.emit('visible'); }
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) Events.emit('fullscreenExit'); });
    addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturestart', e => e.preventDefault());
    this.applyClasses();
  },
  measure() {
    this.w = Math.max(1, Math.round(window.innerWidth));
    this.h = Math.max(1, Math.round(window.innerHeight));
    this.dpr = window.devicePixelRatio || 1;
    this.aspect = this.w / this.h;
    this.portrait = this.h > this.w;
    // near-square screens (Galaxy Z Fold inner display ~1.2:1) get the "wide" layout
    this.wide = Math.max(this.w, this.h) / Math.min(this.w, this.h) < 1.6;
  },
  applyClasses() {
    document.body.classList.toggle('wide', this.wide);
    document.documentElement.style.setProperty('--ui', (Settings.uiScale * (this.wide ? 1.25 : 1)).toFixed(3));
    document.getElementById('rotate').classList.toggle('on', this.needsRotate());
  },
  needsRotate() { return this.portrait && !this.wide; },
  onResize() {
    const pw = this.w, ph = this.h, pWide = this.wide;
    this.measure();
    if (pw === this.w && ph === this.h) return;
    const folded = pWide !== this.wide || Math.abs(pw * ph - this.w * this.h) > 0.25 * pw * ph;
    this.applyClasses();
    Events.emit('resize', { folded });
  },
  detectGPU() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      if (!gl) { this.noWebGL2 = true; return; }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      this.gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      const g = this.gpu.toLowerCase();
      if (/swiftshader|llvmpipe|software|softpipe/.test(g)) this.autoTier = 'low';
      else if (/adreno.*\b(6[5-9]\d|7\d\d|8\d\d)\b|mali-g(7[1-9]|6[1-9]|9\d|1\d\d)|immortalis|xclipse|apple|nvidia|geforce|radeon|iris|arc/.test(g)) this.autoTier = 'high';
      else this.autoTier = 'med';
      const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    } catch (e) { this.autoTier = 'med'; }
  },
  async enterImmersive() {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    } catch (e) { /* fullscreen not allowed here */ }
    try { if (!this.wide && screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { /* lock unsupported */ }
    this.requestWake();
  },
  async requestWake() {
    try { if (navigator.wakeLock && !this.wake) { this.wake = await navigator.wakeLock.request('screen'); this.wake.addEventListener('release', () => { this.wake = null; }); } } catch (e) { this.wake = null; }
  },
  releaseWake() { try { if (this.wake) this.wake.release(); } catch (e) { /* ignore */ } this.wake = null; },
  vibrate(p) { if (!Settings.haptics) return; try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } },
};
