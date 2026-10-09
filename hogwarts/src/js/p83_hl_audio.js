/* ==== p83_hl_audio.js ==== */
/* HOGWARTS — sound. Music, sound effects and the students' voices (made with ElevenLabs: tools/eleven.py →
   assets/snd/*.mp3, embedded by rebuild.sh as <script id="snd_NAME">). One small Web Audio mixer:
   · AU.play(name, {pos, vol, bus})   a one-shot, quieter and panned with distance from the eye when given a place
   · AU.bed(name, vol)                a looping bed (wind, the grounds, the Great Hall, the stands) eased to a level
   · AU.music(name)                   the score: cross-fades between themes, and each theme comes round under its own tail
   · AU.say(actor, i, prof)           the line over a passer-by's head, spoken in a voice of their own
   Everything here hangs off the game by wrapping what already happens (a bolt fired, a blast, a goal); nothing in
   the game waits on sound, a missing file is silence, and the pause menus carry a SOUND switch. ?mute starts silent. */
HL.AU = { on: true, ctx: null, buf: {}, pend: {}, played: {}, last: {}, beds: {}, mus: null, want: null, vol: { music: 0.2, sfx: 0.85, voice: 1.0, amb: 0.5 }, n: 0, MUS: [0, 0.1, 0.2, 0.32], musI: 2, SFX: [0, 0.4, 0.7, 1], sfxI: 2, VOX: [0, 0.4, 0.7, 1], voxI: 2, MASTER: 0.72 };   // (music at 0.36 was "a bit loud": it sits under the effects now, and the pause menu sets its level)
(function () {
  const AU = HL.AU, Q = HL.Q, U = HL.ui;
  try { if (localStorage.getItem('hl_snd') === '0') AU.on = false; } catch (e) { /* */ }
  if (/[?&]mute\b/.test(location.search)) AU.on = false;
  try { const m = localStorage.getItem('hl_mus'); if (m !== null && AU.MUS[+m] !== undefined) { AU.musI = +m; AU.vol.music = AU.MUS[AU.musI]; } } catch (e) { /* */ }
  /* the effects have their own level, like the music: it scales the sound effects and the beds of the world together (voices are left alone) */
  try { const m = localStorage.getItem('hl_sfx'); if (m !== null && AU.SFX[+m] !== undefined) AU.sfxI = +m; } catch (e) { /* */ }
  AU.setSfx = function (i) { AU.sfxI = ((i % AU.SFX.length) + AU.SFX.length) % AU.SFX.length; const k = AU.SFX[AU.sfxI]; try { localStorage.setItem('hl_sfx', String(AU.sfxI)); } catch (e) { /* */ } if (AU.ctx) { AU.g_sfx.gain.setTargetAtTime(AU.vol.sfx * k, AU.ctx.currentTime, 0.08); AU.g_amb.gain.setTargetAtTime(AU.vol.amb * k, AU.ctx.currentTime, 0.08); } };
  try { const m = localStorage.getItem('hl_vox'); if (m !== null && AU.VOX[+m] !== undefined) AU.voxI = +m; } catch (e) { /* */ }
  AU.setVox = function (i) { AU.voxI = ((i % AU.VOX.length) + AU.VOX.length) % AU.VOX.length; try { localStorage.setItem('hl_vox', String(AU.voxI)); } catch (e) { /* */ } if (AU.ctx) AU.g_voice.gain.setTargetAtTime(AU.vol.voice * AU.VOX[AU.voxI], AU.ctx.currentTime, 0.08); };
  AU.setMus = function (i) { AU.musI = ((i % AU.MUS.length) + AU.MUS.length) % AU.MUS.length; AU.vol.music = AU.MUS[AU.musI]; try { localStorage.setItem('hl_mus', String(AU.musI)); } catch (e) { /* */ } if (AU.ctx) AU.g_music.gain.setTargetAtTime(AU.vol.music, AU.ctx.currentTime, 0.1); };
  AU.hash = function (t) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };   // (the same hash tools/eleven.py names a spoken line's recording by)
  AU.names = () => ASSETS.ids('snd_').map((id) => id.slice(4));
  AU.has = (n) => ASSETS.has('snd_' + n);
  AU.vars = {}; AU.pick = (base) => { const v = AU.vars[base] || (AU.vars[base] = [base, base + '2', base + '3'].filter((n) => AU.has(n))); return v.length ? v[(Math.random() * v.length) | 0] : base; };   // (what is heard most has more than one take)
  AU.init = function () {
    if (AU.ctx || !AU.names().length) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = AU.ctx = new C(); AU.master = c.createGain(); AU.master.gain.value = AU.on ? AU.MASTER : 0; const cmp = c.createDynamicsCompressor(); cmp.threshold.value = -14; cmp.ratio.value = 3; AU.master.connect(cmp); cmp.connect(c.destination);
    for (const k in AU.vol) { const g = c.createGain(); g.gain.value = AU.vol[k] * (k === 'sfx' || k === 'amb' ? AU.SFX[AU.sfxI] : k === 'voice' ? AU.VOX[AU.voxI] : 1); g.connect(AU.master); AU['g_' + k] = g; }
    AU.queue = AU.names().filter((n) => !/^mus_|^say_/.test(n)); if (AU.has('mus_win')) AU.queue.push('mus_win'); AU.pump();   // the effects are decoded behind the scenes at once; a voice when it is first wanted; the themes are streamed
  };
  AU.load = function (n) {
    if (AU.buf[n]) return Promise.resolve(AU.buf[n]); if (AU.pend[n]) return AU.pend[n]; const u0 = AU.ctx && ASSETS.has('snd_' + n) ? ASSETS.get('snd_' + n) : null; if (!u0) return Promise.resolve(null);
    const u = u0.slice();   /* (decodeAudioData takes the buffer it is given: a copy, so the pack stays whole) */
    /* each take is measured as it is decoded: where its sound actually starts (a cast must answer the click, not 150 ms of silence later) and how loud it peaks (the takes come at very different levels: each is brought to the same) */
    const measure = (b) => { const d = b.getChannelData(0), N = d.length; let pk = 0, first = -1; for (let i = 0; i < N; i += 2) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > pk) pk = v; if (first < 0 && v > 0.03) first = i; } b._off = /_loop$|^amb_|^snitch$|^mus_/.test(n) ? 0 : Math.max(0, (first < 0 ? 0 : first) / b.sampleRate - 0.006); b._norm = pk > 0.02 ? Math.min(4, 0.89 / pk) : 1; };
    /* a recorded walk is cut into its single footfalls: each peak of the envelope that stands clear of its neighbours is one step, kept with its own start, length and level */
    const slice = (b) => { const d = b.getChannelData(0), sr = b.sampleRate, w = Math.floor(sr * 0.008), env = []; let pk = 0; for (let i = 0; i + w <= d.length; i += w) { let m = 0; for (let j = i; j < i + w; j += 2) { const v = d[j] < 0 ? -d[j] : d[j]; if (v > m) m = v; } env.push(m); if (m > pk) pk = m; }
      const th = pk * 0.3, on = []; let last = -99; for (let i = 1; i < env.length - 1; i++) { if (env[i] > th && env[i] >= env[i - 1] && env[i] >= env[i + 1] * 0.85 && i - last > 26) { let s0 = i; while (s0 > 0 && env[s0 - 1] > th * 0.2 && i - s0 < 7) s0--; on.push([s0, env[i]]); last = i; } }
      b._sl = []; for (let k = 0; k < on.length; k++) { const off = Math.max(0, on[k][0] * 0.008 - 0.01), end = k + 1 < on.length ? on[k + 1][0] * 0.008 - 0.03 : b.duration, dur = Math.min(0.36, end - off); if (dur > 0.12) b._sl.push([off, dur, Math.min(4, 0.8 / Math.max(0.05, on[k][1]))]); } };
    return AU.pend[n] = new Promise((res) => { const done = (b) => { if (b) { try { measure(b); if (/^steps_/.test(n)) slice(b); } catch (e) { b._off = 0; b._norm = 1; } AU.buf[n] = b; } delete AU.pend[n]; res(b || null); }; try { const p = AU.ctx.decodeAudioData(u.buffer, done, () => done(null)); if (p && p.catch) p.catch(() => done(null)); } catch (e) { done(null); } });
  };
  AU.pump = function () { const n = AU.queue.shift(); if (!n) return; AU.load(n).then(() => setTimeout(AU.pump, 25)); };
  AU.setOn = function (on) { AU.on = !!on; try { localStorage.setItem('hl_snd', on ? '1' : '0'); } catch (e) { /* */ } if (AU.ctx) AU.master.gain.setTargetAtTime(on ? AU.MASTER : 0, AU.ctx.currentTime, 0.08); };
  { const kick = () => { AU.init(); if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume(); }; window.addEventListener('pointerdown', kick, true); window.addEventListener('keydown', kick, true); }

  /* a one-shot */
  AU.play = function (n, o) {
    AU.played[n] = (AU.played[n] || 0) + 1; if (!AU.ctx || !AU.on) return null; o = o || {}; const c = AU.ctx, now = c.currentTime;
    if (now - (AU.last[n] || -9) < (o.gap === undefined ? 0.07 : o.gap)) return null; const b = AU.buf[n]; if (!b) { AU.load(n); return null; }   // (a sound not yet decoded is skipped, not played late)
    let vol = o.vol === undefined ? 1 : o.vol, pan = 0;
    if (o.pos) { const cam = R.camera, dx = o.pos.x - cam.position.x, dy = (o.pos.y || 0) - cam.position.y, dz = o.pos.z - cam.position.z, d = Math.hypot(dx, dy, dz), ref = o.ref || 10; vol *= 1 / (1 + (d / ref) * (d / ref)); if (vol < 0.012) return null; const e = cam.matrixWorld.elements; pan = clamp((dx * e[0] + dy * e[1] + dz * e[2]) / Math.max(d, 2), -1, 1) * 0.75; }
    AU.last[n] = now; const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; s.playbackRate.value = (o.rate || 1) * (o.vary === false ? 1 : 0.95 + Math.random() * 0.1); g.gain.value = vol * (b._norm || 1); s.connect(g);
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(AU['g_' + (o.bus || 'sfx')]); } else g.connect(AU['g_' + (o.bus || 'sfx')]);
    s.start(0, Math.min(b._off || 0, Math.max(0, b.duration - 0.05))); AU.n++; return s;
  };
  /* one footfall: a slice of the walk recorded for this ground (never the same one twice running); the single-step takes stand in until a walk is decoded */
  AU.step = function (surf, vol) { const c = AU.ctx; if (!c || !AU.on) return; const n = 'steps_' + surf, b = AU.buf[n]; AU.played[n] = (AU.played[n] || 0) + 1;
    if (!b || !b._sl || b._sl.length < 3) { if (!b) AU.load(n); AU.stepN = (AU.stepN || 0) + 1; return AU.play((surf === 'stone' || surf === 'wood' ? 'step_stone' : 'step_grass') + (1 + AU.stepN % 2), { vol: vol * 0.9, gap: 0.05 }); }
    let i = (Math.random() * b._sl.length) | 0; if (i === b._last) i = (i + 1) % b._sl.length; b._last = i; const [off, dur, k] = b._sl[i], s = c.createBufferSource(), g = c.createGain(), v = vol * k * (0.85 + Math.random() * 0.3), t = c.currentTime; s.buffer = b; s.playbackRate.value = 0.94 + Math.random() * 0.12;
    g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + dur - 0.05); g.gain.linearRampToValueAtTime(0.0001, t + dur); s.connect(g); g.connect(AU.g_sfx); s.start(t, off, dur); AU.n++; };
  /* through a ring on the broom: a chime that climbs a step with every ring of the course, and a flourish for the last */
  AU.ring = function (i, n) { AU.play('ring', { vol: 0.9, vary: false, gap: 0.05, rate: Math.pow(2, Math.min(i - 1, 11) / 12) }); if (n && i >= n) setTimeout(() => AU.play('ring_done', { vol: 1, vary: false }), 350); };
  /* speech that is not tied to a passer-by (the commentator, the coach, the Hat, the letter, whoever you are talking to): one voice at a time; a line of higher standing cuts in, an equal or lower one waits its turn out */
  AU.speak = function (n, o) { o = o || {}; AU.played[n] = (AU.played[n] || 0) + 1; const c = AU.ctx; if (!c || !AU.on || !AU.has(n)) return false; const now = c.currentTime, cur = AU.sp; if (cur && now < cur.end && (o.prio || 0) < cur.prio + (cur.n === n ? 9 : 0) + (o.cut ? -9 : 0) && !(o.prio > cur.prio)) return false;
    const go = (b) => { if (!b) return; if (AU.sp && AU.sp.s) { try { AU.sp.g.gain.setTargetAtTime(0, c.currentTime, 0.03); AU.sp.s.stop(c.currentTime + 0.15); } catch (e) { /* */ } } const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; let v = (o.vol === undefined ? 1 : o.vol) * (b._norm || 1);
      if (o.pos) { const cam = R.camera, d = Math.hypot(o.pos.x - cam.position.x, (o.pos.y || 0) - cam.position.y, o.pos.z - cam.position.z); v *= 1 / (1 + (d / 12) * (d / 12)); }
      g.gain.value = v; s.connect(g); g.connect(AU.g_voice); const off = Math.min(b._off || 0, Math.max(0, b.duration - 0.05)); s.start(0, off); AU.sp = { n, s, g, prio: o.prio || 0, end: c.currentTime + b.duration - off }; AU.n++;
      /* the score steps back while someone is speaking */ AU.g_music.gain.cancelScheduledValues(c.currentTime); AU.g_music.gain.setTargetAtTime(AU.vol.music * 0.5, c.currentTime, 0.12); AU.g_music.gain.setTargetAtTime(AU.vol.music, AU.sp.end + 0.2, 0.5); };
    AU.sp = { n, s: null, g: null, prio: o.prio || 0, end: now + 1.2 }; if (AU.buf[n]) go(AU.buf[n]); else AU.load(n).then((b) => { if (AU.sp && AU.sp.n === n) go(b); }); return true; };
  AU.hush = function () { const c = AU.ctx, cur = AU.sp; if (c && cur && cur.s) { try { cur.g.gain.setTargetAtTime(0, c.currentTime, 0.05); cur.s.stop(c.currentTime + 0.25); } catch (e) { /* */ } } AU.sp = null; };
  /* a looping bed, eased to the level asked for each frame it is wanted */
  AU.bed = function (n, vol) { const B = AU.beds[n] || (AU.beds[n] = { t: 0, v: 0, s: null, g: null }); B.t = vol; };
  AU.music = function (n) { AU.want = n; };
  AU.mk = function (n, b, bus, loop) { const c = AU.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = b; s.loop = !!loop; g.gain.value = 0; s.connect(g); g.connect(AU['g_' + bus]); s.start(); return { n, s, g, end: c.currentTime + b.duration }; };
  /* a theme is streamed from its embedded mp3 through an <audio> element (decoded whole, seven minutes of stereo would hold 150 MB) */
  AU.murl = {};
  AU.mkMus = function (n) { let url = AU.murl[n]; if (!url) { if (!ASSETS.has('snd_' + n)) return null; url = AU.murl[n] = ASSETS.url('snd_' + n); }
    const c = AU.ctx, a = new Audio(url), g = c.createGain(); a.preload = 'auto'; g.gain.value = 0; try { c.createMediaElementSource(a).connect(g); } catch (e) { return null; } g.connect(AU.g_music); g.gain.setTargetAtTime(1, c.currentTime, 0.9); const pr = a.play(); if (pr && pr.catch) pr.catch(() => { /* not yet allowed: the next frame asks again */ }); return { n, a, g }; };
  AU.endMus = function (M, tc, ms) { M.g.gain.setTargetAtTime(0, AU.ctx.currentTime, tc); setTimeout(() => { try { M.a.pause(); M.a.removeAttribute('src'); M.a.load(); } catch (e) { /* */ } }, ms); };
  AU.tick = function (dt) {
    const c = AU.ctx; if (!c) return;
    for (const n in AU.beds) { const B = AU.beds[n]; if (!B.s) { if (B.t < 0.004) continue; const b = AU.buf[n]; if (!b) { AU.load(n); continue; } const m = AU.mk(n, b, 'amb', true); B.s = m.s; B.g = m.g; B.v = 0; B.k = b._norm || 1; }
      B.v += (B.t - B.v) * (1 - Math.exp(-2.6 * dt)); B.g.gain.value = B.v * B.k; if (B.t < 0.004 && B.v < 0.004) { try { B.s.stop(); } catch (e) { /* */ } B.s = null; B.g = null; } B.t = 0; }   // (a bed nobody asked for this frame fades away)
    // the score
    const want = AU.want; let M = AU.mus;
    if (M && M.n !== want) { AU.endMus(M, 0.55, 3200); AU.mus = M = null; }
    if (!M && want) M = AU.mus = AU.mkMus(want);
    if (M && M.a.paused && !M.a.ended && c.state === 'running') { const pr = M.a.play(); if (pr && pr.catch) pr.catch(() => { /* */ }); }
    if (M && M.a.duration > 8 && M.a.currentTime > M.a.duration - 3.6) { AU.endMus(M, 1.0, 5200); AU.mus = AU.mkMus(M.n); }   // the theme comes round again under its own tail
  };
  /* the line over a passer-by's head, in a voice of their own (the recordings: say_f00… say_m19 for students, say_pf / say_pm for the staff) */
  AU.say = function (a, i, prof) { const fem = prof ? a.tplN === 'prof_b' : /_f\d/.test(a.tplN || ''), n = 'say_' + (prof ? 'p' : '') + (fem ? 'f' : 'm') + String(i).padStart(2, '0'); AU.spoke = n; if (!AU.buf[n]) { AU.load(n).then((b) => { if (b && AU.spoke === n && HL.SAY && HL.SAY.who === a) AU.play(n, { bus: 'voice', pos: a, ref: 8, vary: false, gap: 0 }); }); return; } AU.play(n, { bus: 'voice', pos: a, ref: 8, vary: false, gap: 0 }); };

  /* ------------------------------------------------------------ what makes a sound */
  const safe = (fn) => function () { try { return fn.apply(this, arguments); } catch (e) { if (!AU.err) { AU.err = String(e.stack || e); } } };
  const wrap = (obj, k, after) => { const f0 = obj[k]; if (typeof f0 !== 'function') return; const sf = safe(after); obj[k] = function () { const r = f0.apply(this, arguments); sf.apply(this, [r].concat([].slice.call(arguments))); return r; }; };
  const mine = (src) => src === PLAYER.a, at = (src) => (mine(src) ? undefined : src);
  // spells: a bolt fired, what it strikes, a blast, fire, the shield, the big ones
  wrap(HL, 'shoot', (r, src, from, dir, id) => { const n = id === 'basic' ? AU.pick('cast_basic') : id === 'stupefy' ? 'stupefy' : AU.has('cast_' + id) ? 'cast_' + id : 'cast_basic'; AU.play(n, { pos: mine(src) ? null : from, vol: mine(src) ? 0.9 : 0.75, ref: 14 }); });
  wrap(HL, 'impact', (r, p, n, S, big) => { AU.play(S && S.name === 'Bombarda' ? 'hit_bombarda' : S && S.kind === 'fire' ? 'hit_fire' : AU.pick('hit_basic'), { pos: p, ref: big ? 22 : 13, vol: big ? 1 : 0.8 }); });
  wrap(HL, 'blast', (r, p, rad) => { AU.play(rad > 4.5 ? 'hit_bombarda' : 'hit_fire', { pos: p, ref: 24, gap: 0.2 }); });
  wrap(HL, 'incendio', (r, a) => { AU.play('cast_incendio', { pos: at(a), ref: 14 }); });
  wrap(HL, 'ancient', () => AU.play('ancient', { vol: 1, vary: false }));
  wrap(HL, 'revelio', () => AU.play('revelio', { vol: 0.8, vary: false }));
  { const d0 = PLAYER.onDamage; PLAYER.onDamage = function (amt, info) { const a = PLAYER.a, hp = a ? a.hp : 0, blk = HL.P.blocking; const r = d0.apply(this, arguments); try { if (a && a.hp < hp - 0.5) AU.play('hurt', { vol: 0.9, gap: 0.25 }); else if (blk && !(info && info.unblockable)) AU.play('protego_block', { gap: 0.12 }); } catch (e) { /* */ } return r; }; }
  if (typeof LOOTH !== 'undefined') wrap(LOOTH, 'drink', () => AU.play('potion', { vol: 0.8, gap: 0.6, vary: false }));
  wrap(HL.fly, 'mount', () => AU.play('broom_mount', { vol: 0.8 }));
  // Quidditch
  wrap(Q, 'goal', (r, team) => { AU.play('goal', { vol: 0.9, vary: false }); AU.play('cheer', { vol: team === 0 ? 1 : 0.5, vary: false, gap: 1 }); });
  wrap(Q, 'knock', (r, f) => AU.play('tackle', { pos: f && f.isPlayer ? null : (f && f.a), ref: 16 }));
  wrap(Q, 'throwBall', (r, f) => AU.play('throw', { pos: f && f.isPlayer ? null : (f && f.a), ref: 16, vol: 0.8 }));
  { const e0 = Q.end; Q.end = function () { const was = Q.phase, r = e0.apply(Q, arguments); try { if (was !== 'over' && Q.phase === 'over') { AU.play('whistle', { vary: false }); AU.play('cheer', { vol: 1, vary: false, gap: 0.5 }); const R0 = Q.result; if (R0 && R0.win) setTimeout(() => AU.play('mus_win', { bus: 'music', vol: 2.2, vary: false }), 900);
        if (R0 && !Q.tut) { const sn = /Seeker caught the Snitch/.test(R0.reason || ''), w = R0.a === R0.b ? '' : HL.HOUSES[R0.teams[R0.a > R0.b ? 0 : 1]].name; Q.say(sn ? R0.reason + '!' : 'Full time — and that is the final whistle!'); setTimeout(() => { if (Q.on) Q.say(w ? w + ' win!' : 'It ends all square!'); }, sn ? 2600 : 3000); } } } catch (e) { /* */ } return r; }; }
  wrap(Q, 'tutFinish', () => AU.play('mus_win', { bus: 'music', vol: 1.6, vary: false }));
  wrap(Q, 'doLunge', () => AU.play('roll', { vol: 0.9 }));
  { const s0 = Q.shoot; if (s0) Q.shoot = function () { const pw = !!Q.power, r = s0.apply(Q, arguments); try { if (pw) AU.play('cast_confringo', { vol: 1, vary: false }); } catch (e) { /* */ } return r; }; }   // a Roaring Shot leaves the hand in fire
  // ---- the spoken extras
  /* your own incantations: the spell's name, in a witch's or a wizard's voice, as it leaves the wand */
  const inc = (w) => { const n = 'inc_' + (HL.witch ? 'f' : 'm') + '_' + String(w || '').toLowerCase(); if (AU.has(n)) AU.play(n, { bus: 'voice', vol: 0.9, vary: false, gap: 0.35 }); };
  { const c0 = PLAYER.cast; PLAYER.cast = function (id) { const p0 = HL.P.pending, r = c0.apply(this, arguments); try { if (HL.P.pending && HL.P.pending !== p0 && id !== 'basic' && HL.SPELLS[id]) inc(HL.SPELLS[id].name); } catch (e) { /* */ } return r; }; }
  wrap(HL, 'shoot', (r, src, from, dir, id) => { if (id === 'stupefy' && mine(src)) inc('Stupefy'); });
  wrap(HL, 'revelio', () => inc('Revelio'));
  /* the commentator: every line of the match's commentary, spoken (goals and the final whistle cut in; the rest wait for a gap) */
  wrap(Q, 'say', (r, t) => { t = String(t || ''); AU.speak('com_' + AU.hash(t), { prio: /score!|through the hoop|win!|whistle|square|caught the Snitch/.test(t) ? 2 : 1, vol: 0.95 }); });
  wrap(Q, 'knock', (r, f, dir, by) => { if (f && f.isPlayer && Q.phase === 'play') Q.say(by === 'TACKLED!' ? 'Tackled — and the Quaffle is gone!' : 'A Bludger! That had to hurt.'); });
  /* the flying coach reads each step of the lesson */
  wrap(Q, 'tutSay', () => { const T = Q.tut; if (T) AU.speak('les_' + T.i + (T.i === 4 && T.sub ? 'b' : ''), { prio: 3, cut: true }); });
  wrap(Q, 'tutFinish', () => AU.speak('les_done', { prio: 3, cut: true }));
  /* the Sorting Hat names your house as a new student is sorted; the Deputy Headmistress reads her letter */
  { const b0 = HL.begin; HL.begin = function (house, witch, cont) { try { if (!cont && !HL._beginning && !MG.test) AU.speak('hat_' + house, { prio: 4, cut: true }); } catch (e) { /* */ } return b0.apply(this, arguments); }; }
  /* whoever you talk to says their line */
  /* (the dialogue box is built afresh at each start of the world, so it is wrapped then, after it exists) */
  HL.START.push(function () { if (!U.say || U.say._au) return; const f0 = U.say; U.say = function (name, line, dur, who) { const r = f0.apply(this, arguments); try { AU.speak('dlg_' + AU.hash(String(line || '').replace(/<[^>]+>/g, '').trim()), { prio: 3, cut: true, pos: who && who.x !== undefined ? who : null }); } catch (e) { /* */ } return r; }; U.say._au = true; });
  // the pages and coins and house points that pop up
  wrap(U, 'pop', (r, t) => { t = String(t || ''); if (/GALLEONS|HOUSE POINTS/.test(t)) AU.play(/HOUSE/.test(t) ? 'quest' : 'collect', { vol: 0.8, vary: false, gap: 0.5 }); else if (/STOLEN|DODGED|INTERCEPTED/.test(t)) AU.play('collect', { vol: 0.45, gap: 0.3 }); else if (/OFF THE RIM/.test(t)) { AU.play('crowd_ooh', { vol: 0.9, vary: false, gap: 1 }); if (Q.on) Q.say('Off the rim! So close.'); } else if (/SAVED/.test(t)) AU.play('crowd_ooh', { vol: 0.8, vary: false, gap: 1 }); });
  wrap(U, 'toast', (r, a) => { a = String(a || ''); if (/QUEST|COMPLETE|FIELD GUIDE|WIN!|CHAMPION/.test(a)) AU.play('quest', { vol: 0.8, vary: false, gap: 1.5 }); });
  // the menus: a page turned when a screen opens, a click on any button
  wrap(U, 'screen', (r, html) => { if (html) AU.play('ui_open', { vol: 0.55, gap: 0.25 }); });
  document.addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('.hlBtn, .hlH')) AU.play('ui_click', { vol: 0.6, gap: 0.03 }); }, true);
  // the SOUND switch in whichever pause menu is up
  { const p0 = U.pause; U.pause = function () { const r = p0.apply(U, arguments); try { const box = document.querySelector('#hlScreen .hlPause'), btns = box && box.querySelectorAll('.hlBtn'); if (box && btns.length && !box.querySelector('[data-snd]')) { const b = document.createElement('div'); b.className = 'hlBtn'; b.dataset.snd = '1'; const lab = () => { b.textContent = AU.on ? 'SOUND · ON' : 'SOUND · OFF'; }; lab(); b.onclick = (ev) => { ev.stopPropagation(); AU.init(); AU.setOn(!AU.on); lab(); }; box.insertBefore(b, btns[btns.length - 1]); const m = document.createElement('div'); m.className = 'hlBtn'; const ml = () => { m.textContent = 'MUSIC · ' + ['OFF', 'LOW', 'MEDIUM', 'HIGH'][AU.musI]; }; ml(); m.onclick = (ev) => { ev.stopPropagation(); AU.init(); AU.setMus(AU.musI + 1); ml(); }; box.insertBefore(m, btns[btns.length - 1]); const f = document.createElement('div'); f.className = 'hlBtn'; const fl = () => { f.textContent = 'SOUND EFFECTS · ' + ['OFF', 'LOW', 'MEDIUM', 'HIGH'][AU.sfxI]; }; fl(); f.onclick = (ev) => { ev.stopPropagation(); AU.init(); AU.setSfx(AU.sfxI + 1); fl(); AU.play('ui_click', { vol: 0.8, gap: 0 }); }; box.insertBefore(f, btns[btns.length - 1]); const vb = document.createElement('div'); vb.className = 'hlBtn'; const vl = () => { vb.textContent = 'VOICES · ' + ['OFF', 'LOW', 'MEDIUM', 'HIGH'][AU.voxI]; }; vl(); vb.onclick = (ev) => { ev.stopPropagation(); AU.init(); AU.setVox(AU.voxI + 1); vl(); }; box.insertBefore(vb, btns[btns.length - 1]); } } catch (e) { /* */ } return r; }; }

  /* ------------------------------------------------------------ every frame: what is heard here and now */
  const S = { lum: false, boost: false, spin: false, cine: 0, qph: '', holder: null, bl: [], comb: 0, chests: 0, found: 0, shield: false };
  AU.frame = function (dt) {
    if (!AU.ctx) return; const a = PLAYER.a, st = MG.state, F = HL.fly, play = st === 'play' && !!a;
    /* the Deputy Headmistress reads her letter as it opens (the journal builds it at each start, so it is caught on the screen, not by wrapping) */
    if (st !== S.st) { if (st === 'journal' && document.querySelector('.hlJ .letter')) AU.speak('letter_' + HL.house, { prio: 2 }); S.st = st; }
    // ---- the score
    let m = null;
    if (st === 'title' || st === 'house' || S.opening) m = 'mus_title';
    else if (Q.on) m = Q.phase === 'over' ? null : 'mus_match';
    else if (play || st === 'pause' || st === 'map' || st === 'inv' || st === 'journal') { let foe = false; if (a) for (const f of HL.foes || []) if (f.alive && Math.hypot(f.x - a.x, f.z - a.z) < 28) { foe = true; break; }
      if ((HL.duel && HL.duel.on) || (foe && HL.P.combatT > 0)) S.comb = 7; else S.comb = Math.max(0, S.comb - dt);
      const z = a ? HL.zoneAt(a.x, a.y + 1, a.z) : null, inside = !!a && (!!z || a.y < HL.Y0 - 4), vil = !!a && HL.VIL && (Math.hypot(a.x - HL.VIL.x, a.z - HL.VIL.z) < 78 || (z && /BROOMSTICKS|HONEYDUKES/.test(z.name || ''))); S.inside = inside; S.zone = z; S.vil = vil; const deep = !!a && a.y < HL.Y0 - 4, hall = z && /GREAT HALL/.test(z.name || '');
      S.flyT = PLAYER.state === 'fly' ? (S.flyT || 0) + dt : 0;
      if (!inside && S.wasIn) S.alt = !S.alt; S.wasIn = inside;   /* (each time you come out of doors the grounds take the other of their two themes) */
      m = S.comb > 0 ? 'mus_duel' : S.flyT > 2.5 ? 'mus_fly' : vil ? 'mus_village' : deep && AU.has('mus_dark') ? 'mus_dark' : hall && AU.has('mus_feast') ? 'mus_feast' : inside ? 'mus_hall' : S.alt && AU.has('mus_castle2') ? 'mus_castle2' : 'mus_castle'; }
    if (HL.musicHook) { const o = HL.musicHook(st, m); if (o !== undefined) m = o; }   // (the career's scenes and screens choose their own)
    if (m && !AU.has(m)) m = AU.has('mus_castle') ? 'mus_castle' : null;
    /* a change of theme has to hold for a moment (stepping through a doorway and back is not two changes of music); the title, a match and a fight take over at once */
    if (m !== S.mWant) { S.mWant = m; S.mT = 0; } else S.mT = (S.mT || 0) + dt; if (S.mT > 1.6 || !AU.want || m === 'mus_title' || m === 'mus_match' || m === 'mus_duel' || !m) AU.music(m);
    // ---- the opening: the engine in steam at the station, then the castle's bell
    { const c = CAM.cine && play && !Q.on ? (HL._cineStn ? 1 : 2) : 0; S.opening = c ? (S.opening || c === 1) : false;   /* (the title theme carries on through the opening: the station, the flight to the castle) */ if (c !== S.cine) { if (c === 1) AU.play('train', { vol: 0.9, vary: false, gap: 3 }); else if (c === 2 && S.cine === 1) AU.play('bell', { vol: 0.7, vary: false, gap: 3 }); S.cine = c; } }
    if (HL.bedHook && HL.bedHook(st)) { AU.tick(dt); return; }
    if (!play) { AU.tick(dt); return; }
    // ---- beds: the grounds, the Great Hall, wind on a broom, the stands
    if (!Q.on) { const zn = S.zone ? S.zone.name || '' : '', stn = HL.STN && HL.STN.plat && Math.abs(a.z - HL.STN.z) < 26 && a.x > HL.STN.x0 - 20 && a.x < HL.STN.x1 + 20;
      if (!S.inside) { AU.bed('amb_out', stn ? 0.25 : 0.55); if (stn) AU.bed('amb_station', 0.75); else if (S.vil) AU.bed('amb_village', 0.55); if (PLAYER.state !== 'fly' && a.y > HL.Y0 + 34) AU.bed('amb_high', 0.6); if (HL.lake && a.y < 6 && HL.lake(a.x, a.z) > 0.2) AU.bed('amb_lake', 0.7); }
      else if (/GREAT HALL/.test(zn)) AU.bed('amb_hall', 0.7); else if (/THREE BROOMSTICKS/.test(zn)) { AU.bed('amb_hall', 0.5); AU.bed('amb_fire', 0.5); } else if (/COMMON ROOM/.test(zn)) AU.bed('amb_fire', 0.7); else if (/LIBRARY/.test(zn)) AU.bed('amb_library', 0.7); else if (a.y < HL.Y0 - 4) AU.bed('amb_dungeon', 0.7); }
    if (PLAYER.state === 'fly') AU.bed('wind_loop', clamp(F.speed / 42, 0.06, 1) * 0.8);
    if (Q.on) AU.bed('crowd_loop', clamp(0.4 + (Q.excite || 0) * 0.3, 0, 1));
    if (Q.on && Q.snitch) { const d = Q.snitch.p.distanceTo(R.camera.position); if (d < 30) AU.bed('snitch', clamp(1 - d / 30, 0, 1) * 0.9); }
    // ---- one-shots read off the state
    if (a.lumos !== S.lum) { S.lum = a.lumos; if (a.lumos) AU.play('lumos', { vol: 0.7, vary: false }); }
    if (HL.P.blocking !== S.shield) { S.shield = HL.P.blocking; if (S.shield) AU.play('protego', { vol: 0.75, gap: 0.3 }); }
    if (F.on) { if (F.boosting && !S.boost) AU.play('boost', { vol: 0.75, gap: 0.5 }); S.boost = F.boosting; const sp = F.spinT > 0; if (sp && !S.spin) AU.play('roll', { vol: 0.8 }); S.spin = sp; } else { S.boost = false; S.spin = false; }
    // your own feet: stone indoors, grass and gravel out of doors, quicker at a run
    { const onFoot = PLAYER.state === 'move' || PLAYER.state === 'sprint', gr = a.grounded !== false;
      if (onFoot && gr && a.speed > 1.3) { S.stepT = (S.stepT || 0) - dt * clamp(a.speed / 3.4, 0.75, 2.1); if (S.stepT <= 0) { S.stepT = 0.47; const wood = S.zone && /BROOMSTICKS|HONEYDUKES/.test(S.zone.name || ''), surf = wood ? 'wood' : S.inside || (HL.inFoot && HL.inFoot(a.x, a.z, 0)) ? 'stone' : S.vil ? 'gravel' : 'grass'; AU.step(surf, surf === 'stone' ? 0.5 : surf === 'wood' ? 0.5 : 0.42); } } else S.stepT = 0.1;
      if (gr && S.air > 0.45 && PLAYER.state !== 'fly') AU.play('land', { vol: 0.7 }); S.air = gr || PLAYER.state === 'fly' ? 0 : (S.air || 0) + dt; }
    { let n = 0; for (const k in HL.save.found || {}) n++; if (n > S.found && S.found >= 0 && S.init) AU.play('collect', { vol: 0.9, vary: false, gap: 0.4 }); S.found = n; }
    if (typeof LOOTH !== 'undefined') { let n = 0; for (const c of LOOTH.chests) if (c.open) n++; if (n > S.chests && S.init) AU.play('chest', { vol: 0.9, vary: false }); S.chests = n; }
    S.init = true;
    if (Q.on) { if (Q.phase !== S.qph) { if (Q.phase === 'play' && S.qph === 'count') { AU.play('whistle', { vary: false }); Q.say('And they’re off!'); } S.qph = Q.phase; }
      if (!!Q.snitch !== !!S.sn) { S.sn = !!Q.snitch; if (S.sn && Q.me && Q.me.role !== 'seeker') Q.say('The Golden Snitch is loose!'); }
      const h = Q.ball ? Q.ball.holder : null; if (h !== S.holder) { if (h) AU.play('catch', { pos: h.isPlayer ? null : h.a, ref: 16, vol: h.isPlayer ? 0.9 : 0.7 }); S.holder = h; }
      (Q.bl || []).forEach((b, i) => { const d = b.park ? 99 : b.p.distanceTo(R.camera.position), near = d < 9; if (near && !S.bl[i]) AU.play('bludger', { pos: b.p, ref: 12 }); S.bl[i] = near; }); } else { S.qph = ''; S.holder = null; S.sn = false; }
    AU.tick(dt);
  };
  { const u0 = HL.update; HL.update = function (rdt) { const r = u0.apply(this, arguments); try { AU.frame(Math.min(rdt, 0.1)); } catch (e) { if (!AU.err) AU.err = String(e.stack || e); } return r; }; if (MG.gameUpdate === u0) MG.gameUpdate = HL.update; }   // (the engine holds the frame function by reference)
})();
