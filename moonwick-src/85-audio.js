// ===== 85-audio: tiny procedural sounds (WebAudio). Starts on the first tap; can be switched off in Options. =====
{
  const G = AF.G; let ac = null, master = null;
  const init = () => { if (ac || AF.SHOT) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination); } catch (e) { ac = null; } };
  addEventListener('pointerdown', () => { init(); if (ac && ac.state === 'suspended') ac.resume(); }, { passive: true }); addEventListener('keydown', init);
  const tone = (f, t0, dur, type = 'sine', vol = 0.2, f2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05); };
  const noise = (t0, dur, f, vol = 0.2, q = 1) => { const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(master); s.start(t0); };
  const PENT = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  const S = {
    cast(t) { for (let i = 0; i < 4; i++) tone(PENT[2 + i] * 2, t + i * 0.045, 0.25, 'sine', 0.09); }, tick(t) { tone(880, t, 0.05, 'triangle', 0.06); }, talk(t) { tone(440, t, 0.07, 'triangle', 0.08); tone(554, t + 0.06, 0.08, 'triangle', 0.07); }, page(t) { noise(t, 0.12, 2400, 0.1); },
    deed(t) { tone(659, t, 0.18, 'triangle', 0.14); tone(988, t + 0.12, 0.3, 'triangle', 0.14); }, quest(t) { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.5, 'triangle', 0.12)); }, star(t) { for (let i = 0; i < 8; i++) tone(PENT[i] * 2, t + i * 0.06, 0.6, 'sine', 0.08); },
    place(t) { tone(392, t, 0.5, 'sine', 0.1); tone(587, t + 0.15, 0.6, 'sine', 0.1); }, bell(t) { for (const [m, v] of [[1, 0.3], [2.0, 0.16], [2.76, 0.12], [5.4, 0.06]]) tone(220 * m, t, 2.6, 'sine', v); }, pop(t) { noise(t, 0.35, 900, 0.3, 0.6); tone(180, t, 0.25, 'sine', 0.2, 60); },
    hop(t) { tone(300, t, 0.12, 'sine', 0.1, 520); }, purr(t) { for (let i = 0; i < 10; i++) noise(t + i * 0.05, 0.04, 160, 0.25, 2); }, pet(t) { tone(700, t, 0.1, 'sine', 0.1, 900); }, plink(t) { tone(1400, t, 0.3, 'sine', 0.14, 700); }, clang(t) { tone(820, t, 0.3, 'square', 0.06); tone(1630, t, 0.2, 'square', 0.04); },
    note(t) { tone(PENT[(Math.random() * 8) | 0], t, 0.45, 'triangle', 0.14); }, bite(t) { tone(900, t, 0.08, 'square', 0.08); tone(1200, t + 0.1, 0.08, 'square', 0.08); }, nope(t) { tone(200, t, 0.15, 'sawtooth', 0.05, 150); }, possess(t) { noise(t, 0.5, 600, 0.2, 3); tone(300, t, 0.5, 'sine', 0.1, 900); }, release(t) { noise(t, 0.4, 900, 0.2, 3); tone(900, t, 0.4, 'sine', 0.1, 300); },
    hurt(t) { tone(240, t, 0.25, 'sawtooth', 0.12, 110); }, hit(t) { noise(t, 0.15, 1800, 0.25); tone(500, t, 0.12, 'square', 0.07, 250); }, roar(t) { noise(t, 1.1, 180, 0.6, 1.2); tone(90, t, 1.1, 'sawtooth', 0.14, 50); }, win(t) { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, t + i * 0.12, 0.9, 'triangle', 0.12)); },
    finale(t) { [262, 330, 392, 523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, t + i * 0.16, 2.6, 'sine', 0.1); tone(f * 2, t + i * 0.16 + 0.08, 2, 'triangle', 0.05); }); },
  };
  AF.on('sfx', (k) => { if (!ac || G.soundOn === false || !S[k]) return; try { S[k](ac.currentTime + 0.01); } catch (e) {} });
  // ambience: crickets at night, a few birds by day, soft wing-hum when flying fast
  let nxt = 2;
  AF.onTick('ambience', 960, (dt) => { if (!ac || G.soundOn === false || AF.mode !== 'play') return; nxt -= dt; if (nxt > 0) return; const t = ac.currentTime + 0.02, n = AF.time.night;
    if (n > 0.6) { nxt = 0.5 + Math.random() * 1.6; const f = 3800 + Math.random() * 900; for (let i = 0; i < 3; i++) tone(f, t + i * 0.07, 0.05, 'sine', 0.018); } else { nxt = 1.2 + Math.random() * 4; const f = 1800 + Math.random() * 1600; for (let i = 0; i < 2 + ((Math.random() * 3) | 0); i++) tone(f * (1 + i * 0.1), t + i * 0.09, 0.08, 'sine', 0.03, f * 1.25); } });
}
