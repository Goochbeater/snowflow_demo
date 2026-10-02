// ===================== AUDIO: fully synthesized with WebAudio =====================
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const Sound = {
  ctx: null, ready: false, bus: {},
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    let ctx;
    try { ctx = this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { return; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.22;
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    this.master.connect(comp); comp.connect(ctx.destination);
    for (const k of ['music', 'sfx', 'crowd', 'amb']) { const g = ctx.createGain(); g.connect(this.master); this.bus[k] = g; }
    const len = ctx.sampleRate * 2;
    const nb = ctx.createBuffer(1, len, ctx.sampleRate); const nd = nb.getChannelData(0);
    for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    const pb = ctx.createBuffer(1, len, ctx.sampleRate); const pd = pb.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; pd[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18; }
    this.pink = pb;
    this.buildWind(); this.buildCrowd(); this.buildHum(); this.buildRain();
    this.music = new Music(this);
    this.applyVolumes();
    this.ready = true;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
  },
  suspend() { try { this.ctx && this.ctx.suspend(); } catch (e) { /* ignore */ } },
  resume() { try { this.ctx && this.ctx.resume(); } catch (e) { /* ignore */ } },
  applyVolumes() {
    if (!this.ctx) return;
    this.bus.music.gain.value = Settings.music * 0.5;
    this.bus.sfx.gain.value = Settings.sfx;
    this.bus.crowd.gain.value = Settings.crowd * 0.85;
    this.bus.amb.gain.value = Settings.sfx * 0.75;
  },
  loopSrc(buf) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 1.5); return s; },
  buildWind() {
    const c = this.ctx;
    const src = this.loopSrc(this.pink);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(lp); lp.connect(g);
    let pan = null;
    if (c.createStereoPanner) { pan = c.createStereoPanner(); g.connect(pan); pan.connect(this.bus.amb); } else g.connect(this.bus.amb);
    const src2 = this.loopSrc(this.noise);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7; bp.frequency.value = 900;
    const g2 = c.createGain(); g2.gain.value = 0;
    src2.connect(bp); bp.connect(g2); g2.connect(this.bus.amb);
    this.wind = { lp, g, pan, bp, g2 };
  },
  setWind(speed, bank, extra = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime, s = clamp(speed / 40, 0, 1.5);
    this.wind.lp.frequency.setTargetAtTime(220 + s * s * 2600 + extra * 2000, t, 0.08);
    this.wind.g.gain.setTargetAtTime(0.04 + s * s * 0.42 + extra * 0.3, t, 0.08);
    this.wind.bp.frequency.setTargetAtTime(500 + s * 1100 + extra * 900, t, 0.15);
    this.wind.g2.gain.setTargetAtTime(Math.max(0, s - 0.5) * 0.06 + extra * 0.05, t, 0.15);
    if (this.wind.pan) this.wind.pan.pan.setTargetAtTime(clamp(-bank * 1.2, -0.7, 0.7), t, 0.1);
  },
  buildCrowd() {
    const c = this.ctx;
    const s1 = this.loopSrc(this.pink);
    const bp1 = c.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 520; bp1.Q.value = 0.8;
    const g1 = c.createGain(); g1.gain.value = 0.12;
    s1.connect(bp1); bp1.connect(g1); g1.connect(this.bus.crowd);
    const s2 = this.loopSrc(this.noise);
    const bp2 = c.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1500; bp2.Q.value = 1.3;
    const g2 = c.createGain(); g2.gain.value = 0.0;
    s2.connect(bp2); bp2.connect(g2); g2.connect(this.bus.crowd);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.21;
    const lg = c.createGain(); lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g1.gain); lfo.start();
    // chant modulator (used on victory)
    const chant = c.createGain(); chant.gain.value = 0;
    const cs = this.loopSrc(this.pink); const cbp = c.createBiquadFilter(); cbp.type = 'bandpass'; cbp.frequency.value = 700; cbp.Q.value = 3;
    const clfo = c.createOscillator(); clfo.type = 'square'; clfo.frequency.value = 1.8; const clg = c.createGain(); clg.gain.value = 0.0;
    cs.connect(cbp); cbp.connect(chant); clfo.connect(clg); clg.connect(chant.gain); chant.connect(this.bus.crowd); clfo.start();
    this.crowd = { g1, g2, bp1, bp2, base: 0.12, chant: clg };
  },
  crowdBase(level) {
    if (!this.ready) return;
    this.crowd.base = 0.08 + level * 0.18;
    const t = this.ctx.currentTime;
    this.crowd.g1.gain.setTargetAtTime(this.crowd.base, t, 0.6);
    this.crowd.g2.gain.setTargetAtTime(level * 0.06, t, 0.6);
  },
  crowdRoar(amount = 1, dur = 3) {
    if (!this.ready) return;
    const t = this.ctx.currentTime, { g1, g2, bp2 } = this.crowd;
    for (const g of [g1.gain, g2.gain, bp2.frequency]) { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); }
    g1.gain.linearRampToValueAtTime(this.crowd.base + 0.45 * amount, t + 0.25);
    g1.gain.setTargetAtTime(this.crowd.base, t + 0.6, dur * 0.35);
    g2.gain.linearRampToValueAtTime(0.32 * amount, t + 0.3);
    g2.gain.setTargetAtTime(0.02, t + 0.7, dur * 0.35);
    bp2.frequency.linearRampToValueAtTime(1900, t + 0.3);
    bp2.frequency.setTargetAtTime(1500, t + 0.8, 1);
  },
  crowdGroan() {
    if (!this.ready) return;
    const t = this.ctx.currentTime, { g1, bp1 } = this.crowd;
    g1.gain.cancelScheduledValues(t); g1.gain.setValueAtTime(g1.gain.value, t);
    g1.gain.linearRampToValueAtTime(this.crowd.base + 0.3, t + 0.3); g1.gain.setTargetAtTime(this.crowd.base, t + 0.6, 0.8);
    bp1.frequency.cancelScheduledValues(t); bp1.frequency.setValueAtTime(520, t);
    bp1.frequency.linearRampToValueAtTime(300, t + 0.6); bp1.frequency.linearRampToValueAtTime(520, t + 1.6);
  },
  chant(on) { if (this.ready) this.crowd.chant.gain.setTargetAtTime(on ? 0.12 : 0, this.ctx.currentTime, 0.4); },
  buildHum() {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 70;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 35.5;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = c.createGain(); g.gain.value = 0;
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.bus.sfx); o.start(); o2.start();
    this.hum = { o, o2, g, lp };
  },
  setHum(level, pitch = 1) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.hum.g.gain.setTargetAtTime(level * 0.22, t, 0.05);
    this.hum.o.frequency.setTargetAtTime(70 * pitch, t, 0.05);
    this.hum.o2.frequency.setTargetAtTime(35.5 * pitch, t, 0.05);
    this.hum.lp.frequency.setTargetAtTime(300 + level * 900, t, 0.05);
  },
  buildRain() {
    const c = this.ctx; const s = this.loopSrc(this.noise);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
    const g = c.createGain(); g.gain.value = 0; s.connect(hp); hp.connect(g); g.connect(this.bus.amb);
    this.rain = g;
  },
  setRain(level) { if (this.ready) this.rain.gain.setTargetAtTime(level * 0.12, this.ctx.currentTime, 0.5); },

  // --- one-shot helpers ---
  env(param, t, a, peak, d) { param.setValueAtTime(0.0001, t); param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); param.exponentialRampToValueAtTime(0.0001, t + a + d); },
  osc(type, f, t, dur, bus = 'sfx') {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const g = this.ctx.createGain(); g.gain.value = 0; o.connect(g); g.connect(this.bus[bus]);
    o.start(t); o.stop(t + dur + 0.1); return { o, g };
  },
  nz(t, dur, type, f, Q, bus = 'sfx', buf) {
    const s = this.ctx.createBufferSource(); s.buffer = buf || this.noise;
    const fl = this.ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = Q;
    const g = this.ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.bus[bus]);
    s.start(t, Math.random() * 1.2); s.stop(t + dur + 0.1); return { s, fl, g };
  },
  chord(notes, t, dur, vol, bright = 3000, type = 'sawtooth') {
    for (const m of notes) for (const det of [-7, 7]) {
      const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = det;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.5;
      lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(bright, t + 0.12); lp.frequency.exponentialRampToValueAtTime(600, t + dur);
      const g = this.ctx.createGain(); g.gain.value = 0;
      o.connect(lp); lp.connect(g); g.connect(this.bus.sfx);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.05);
    }
  },
  play(name, opt = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.004 + (opt.delay || 0), v = opt.vol ?? 1;
    switch (name) {
      case 'whoosh': { const n = this.nz(t, 0.45, 'bandpass', 380, 1.4); n.fl.frequency.exponentialRampToValueAtTime(2400, t + 0.16); n.fl.frequency.exponentialRampToValueAtTime(450, t + 0.42); this.env(n.g.gain, t, 0.07, 0.55 * v, 0.34); break; }
      case 'throw': { this.play('whoosh', { vol: 0.7 * v }); const o = this.osc('sine', 160, t, 0.15); o.o.frequency.exponentialRampToValueAtTime(70, t + 0.12); this.env(o.g.gain, t, 0.005, 0.5 * v, 0.12); break; }
      case 'catch': { const o = this.osc('sine', 190, t, 0.16); o.o.frequency.exponentialRampToValueAtTime(65, t + 0.14); this.env(o.g.gain, t, 0.004, 0.7 * v, 0.14); const n = this.nz(t, 0.05, 'highpass', 2400, 0.7); this.env(n.g.gain, t, 0.002, 0.35 * v, 0.04); break; }
      case 'crack': { const n = this.nz(t, 0.1, 'highpass', 1300, 0.8); this.env(n.g.gain, t, 0.002, 0.95 * v, 0.08); const o = this.osc('triangle', 460, t, 0.1); o.o.frequency.exponentialRampToValueAtTime(180, t + 0.08); this.env(o.g.gain, t, 0.002, 0.5 * v, 0.08); break; }
      case 'hit': { const o = this.osc('sine', 95, t, 0.5); o.o.frequency.exponentialRampToValueAtTime(35, t + 0.4); this.env(o.g.gain, t, 0.004, 1.0 * v, 0.45); const n = this.nz(t, 0.35, 'lowpass', 700, 0.7); this.env(n.g.gain, t, 0.004, 0.8 * v, 0.3); this.play('crack', { vol: 0.6 * v }); break; }
      case 'thud': { const o = this.osc('sine', 120, t, 0.3); o.o.frequency.exponentialRampToValueAtTime(45, t + 0.25); this.env(o.g.gain, t, 0.004, 0.7 * v, 0.25); const n = this.nz(t, 0.2, 'lowpass', 500, 0.7); this.env(n.g.gain, t, 0.004, 0.5 * v, 0.18); break; }
      case 'bell': {
        const base = opt.f || 520; const parts = [[1, 0.42, 2.6], [2.76, 0.22, 1.7], [5.4, 0.14, 1.1], [8.93, 0.08, 0.7], [0.5, 0.2, 2.8]];
        for (const [m, a, d] of parts) { const o = this.osc('sine', base * m, t, d); this.env(o.g.gain, t, 0.004, a * v, d); }
        break;
      }
      case 'stinger': this.chord([62, 69, 74, 78], t, 1.4, 0.05 * v, 3800); this.chord([50], t, 1.4, 0.07 * v, 1200); break;
      case 'denied': { this.chord([57, 60], t, 0.9, 0.05 * v, 1600); const o = this.osc('sawtooth', 220, t, 0.8); o.o.frequency.exponentialRampToValueAtTime(130, t + 0.7); this.env(o.g.gain, t, 0.02, 0.08 * v, 0.7); break; }
      case 'boost': { const n = this.nz(t, 0.6, 'lowpass', 300, 1.2); n.fl.frequency.exponentialRampToValueAtTime(3200, t + 0.35); this.env(n.g.gain, t, 0.04, 0.45 * v, 0.5); const o = this.osc('sine', 80, t, 0.4); o.o.frequency.exponentialRampToValueAtTime(140, t + 0.3); this.env(o.g.gain, t, 0.02, 0.3 * v, 0.35); break; }
      case 'dodge': { this.play('whoosh', { vol: 0.9 * v }); break; }
      case 'perfect': { [1046, 1318, 1568, 2093].forEach((f, i) => { const o = this.osc('sine', f, t + i * 0.045, 0.5); this.env(o.g.gain, t + i * 0.045, 0.005, 0.18 * v, 0.45); }); break; }
      case 'steal': { this.play('thud', { vol: 0.8 * v }); this.play('whoosh', { vol: 0.6 * v }); break; }
      case 'whistle': {
        const d = opt.dur || 0.38; const o = this.osc('sine', 2900, t, d); const l = this.ctx.createOscillator(); l.frequency.value = 26; const lg = this.ctx.createGain(); lg.gain.value = 140; l.connect(lg); lg.connect(o.o.frequency); l.start(t); l.stop(t + d + 0.1);
        o.g.gain.setValueAtTime(0.0001, t); o.g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.02); o.g.gain.setValueAtTime(0.16 * v, t + d - 0.05); o.g.gain.exponentialRampToValueAtTime(0.0001, t + d); break;
      }
      case 'impact': { const o = this.osc('sine', 62, t, 1.3); o.o.frequency.exponentialRampToValueAtTime(26, t + 1.1); this.env(o.g.gain, t, 0.006, 1.0 * v, 1.2); const n = this.nz(t, 0.8, 'lowpass', 900, 0.6); this.env(n.g.gain, t, 0.005, 0.8 * v, 0.7); this.play('bell', { vol: 0.9 * v, f: 440 }); break; }
      case 'boom': { const o = this.osc('sine', 48, t, 1.6); o.o.frequency.exponentialRampToValueAtTime(22, t + 1.4); this.env(o.g.gain, t, 0.004, 1.0 * v, 1.5); const n = this.nz(t, 1.2, 'lowpass', 1800, 0.5); n.fl.frequency.exponentialRampToValueAtTime(120, t + 1.0); this.env(n.g.gain, t, 0.003, 1.0 * v, 1.1); break; }
      case 'rise': { const n = this.nz(t, 0.9, 'bandpass', 300, 2); n.fl.frequency.exponentialRampToValueAtTime(4000, t + 0.85); n.g.gain.setValueAtTime(0.0001, t); n.g.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.8); n.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); break; }
      case 'flutter': { const n = this.nz(t, 0.25, 'bandpass', 5200, 3); const l = this.ctx.createOscillator(); l.frequency.value = 48; const lg = this.ctx.createGain(); lg.gain.value = 0.12 * v; l.connect(lg); lg.connect(n.g.gain); l.start(t); l.stop(t + 0.3); this.env(n.g.gain, t, 0.02, 0.12 * v, 0.2); break; }
      case 'firework': { const o = this.osc('sine', 700, t, 0.6); o.o.frequency.exponentialRampToValueAtTime(1900, t + 0.55); this.env(o.g.gain, t, 0.05, 0.05 * v, 0.5); for (let i = 0; i < 9; i++) { const tt = t + 0.6 + i * 0.035 + Math.random() * 0.05; const n = this.nz(tt, 0.06, 'highpass', 2500 + Math.random() * 3000, 1); this.env(n.g.gain, tt, 0.002, 0.25 * v, 0.05); } const b = this.nz(t + 0.58, 0.5, 'lowpass', 600, 0.6); this.env(b.g.gain, t + 0.58, 0.004, 0.5 * v, 0.45); break; }
      case 'ui': { const o = this.osc('sine', 660, t, 0.08); o.o.frequency.exponentialRampToValueAtTime(990, t + 0.06); this.env(o.g.gain, t, 0.004, 0.18 * v, 0.06); break; }
      case 'swing': { const n = this.nz(t, 0.3, 'bandpass', 250, 1.5); n.fl.frequency.exponentialRampToValueAtTime(900, t + 0.25); this.env(n.g.gain, t, 0.05, 0.35 * v, 0.22); break; }
      case 'rank': { [784, 1175, 1568].forEach((f, i) => { const o = this.osc('triangle', f, t + i * 0.06, 0.4); this.env(o.g.gain, t + i * 0.06, 0.005, 0.12 * v, 0.35); }); break; }
      case 'ready': { [880, 1320].forEach((f, i) => { const o = this.osc('sine', f, t + i * 0.08, 0.3); this.env(o.g.gain, t + i * 0.08, 0.005, 0.14 * v, 0.28); }); break; }
      case 'snitch': this.chord([74, 78, 81, 86], t, 2.0, 0.035 * v, 5000, 'triangle'); this.play('flutter', { vol: 1.5 }); break;
      case 'tick': { const o = this.osc('square', 1800, t, 0.03); this.env(o.g.gain, t, 0.001, 0.08 * v, 0.025); const n = this.nz(t, 0.03, 'highpass', 4000, 1); this.env(n.g.gain, t, 0.001, 0.12 * v, 0.02); break; }
      case 'ring': { [1318, 1760, 2637].forEach((f, i) => { const o = this.osc('sine', f, t + i * 0.03, 0.6); this.env(o.g.gain, t + i * 0.03, 0.004, 0.12 * v, 0.55); }); break; }
      case 'end': this.chord([50, 57, 62, 66, 69], t, 2.6, 0.05 * v, 3200); this.play('whistle', { dur: 1.1 }); break;
    }
  },
  update() {},
};

class Music {
  constructor(S) {
    this.S = S; this.ctx = S.ctx;
    this.layers = {};
    for (const k of ['pad', 'perc', 'arp']) { const g = this.ctx.createGain(); g.gain.value = k === 'pad' ? 1 : 0; g.connect(S.bus.music); this.layers[k] = g; }
    this.tempo = 104; this.step = 0; this.nextT = 0; this.playing = false; this.level = 0;
    this.chords = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 48, 57, 60], [48, 55, 60, 64]];
  }
  start() {
    if (this.playing) return;
    this.playing = true; this.nextT = this.ctx.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.schedule(), 40);
  }
  stop() { this.playing = false; clearInterval(this.timer); }
  schedule() {
    if (this.ctx.state !== 'running') return;
    const spb = 60 / this.tempo / 2;
    if (this.nextT < this.ctx.currentTime - 0.2) this.nextT = this.ctx.currentTime + 0.05;
    while (this.nextT < this.ctx.currentTime + 0.18) { this.playStep(this.step, this.nextT, spb); this.nextT += spb; this.step++; }
  }
  playStep(s, t, spb) {
    const bar = Math.floor(s / 8) % 4, chord = this.chords[bar], i8 = s % 8;
    if (i8 === 0) this.pad(chord, t, spb * 8.4);
    if (this.level > 0.25) {
      if (i8 === 0 || i8 === 3 || i8 === 6) this.taiko(t, i8 === 0 ? 1 : 0.65);
      if (i8 % 2 === 1) this.shaker(t);
    }
    if (this.level > 0.6) { const n = chord[[0, 2, 1, 3, 2, 1, 3, 2][i8]] + 12; this.pluck(n, t, spb * 0.9); }
  }
  pad(chord, t, dur) {
    const c = this.ctx;
    for (const m of chord) for (const det of [-6, 6]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650 + this.level * 900;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022, t + 0.6); g.gain.setValueAtTime(0.022, t + dur - 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(this.layers.pad); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  taiko(t, v) {
    const c = this.ctx; const o = c.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(this.layers.perc); o.start(t); o.stop(t + 0.45);
  }
  shaker(t) {
    const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.S.noise;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    s.connect(hp); hp.connect(g); g.connect(this.layers.perc); s.start(t, Math.random()); s.stop(t + 0.1);
  }
  pluck(m, t, d) {
    const c = this.ctx; const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.layers.arp); o.start(t); o.stop(t + d + 0.05);
  }
  setLevel(level) {
    this.level = level; const t = this.ctx.currentTime;
    this.layers.perc.gain.setTargetAtTime(level > 0.25 ? 1 : 0, t, 0.5);
    this.layers.arp.gain.setTargetAtTime(level > 0.6 ? 1 : 0, t, 0.5);
  }
  duck(hold) {
    const g = this.S.bus.music.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.0001, t + 0.12);
    g.setValueAtTime(0.0001, t + hold); g.linearRampToValueAtTime(Settings.music * 0.5, t + hold + 1.2);
  }
}
