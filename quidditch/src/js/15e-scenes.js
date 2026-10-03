// ===================== SCENES: 3D sets, cast, camera direction, dialogue =====================
// A set is its own THREE.Scene with lights, an environment map and named anchors/camera shots.
// The 'world' set reuses the stadium scene (pitch, castle, lake) with temporary cast members.
const Scenes = {
  active: false, set: null, scene: null, cast: {}, t: 0, cam: null, lines: [], onDone: null, mode: null,
  sets: {},
  // camera state
  cp: new THREE.Vector3(), cl: new THREE.Vector3(), cfov: 50, shake: 0,
  get(name, variant) {
    const key = name + ':' + (variant || '');
    if (!this.sets[key]) this.sets[key] = SetBuilders[name](variant || '');
    return this.sets[key];
  },
  // enter a set (no script): used by hub backgrounds, locker room and press room
  enter(name, variant, opts = {}) {
    this.leave(true);
    const S = this.get(name, variant);
    this.set = S; this.scene = S.world ? Render.scene : S.scene; this.active = true; this.mode = opts.mode || 'view';
    this.saveEnv();
    if (S.world) { World.setWeather(opts.weather || S.weather || 'golden'); Game.setup('demo'); Game.state = 'idle'; for (const f of Game.flyers) f.mesh.visible = false; Robes.list.forEach(r => { r.hide = true; }); Game.quaffle.mesh.visible = false; Game.quaffle.glow.visible = false; for (const b of Game.bludgers) b.mesh.visible = false; }
    if (S.onEnter) S.onEnter(opts);
    this.applyEnv(S);
    if (S.cams && S.cams.default) this.shot(S.cams.default, true);
    this.t = 0;
    return S;
  },
  leave(quiet) {
    if (!this.active) return;
    for (const id in this.cast) this.cast[id].h.dispose();
    this.cast = {};
    if (this.set && this.set.onLeave) this.set.onLeave();
    this.active = false; this.set = null; this.scene = null; this.mode = null;
    Dialogue.hide();
    const fx = Render.post.fx; fx.letterbox = 0;
    this.restoreEnv();
    if (!quiet) { World.setWeather(Settings.weather === 'overcast' ? 'golden' : Settings.weather); Game.setup('demo'); }
  },
  saveEnv() {
    if (this._env) return;
    this._env = { fogCol: SHARED.uFogCol.value.clone(), fogSun: SHARED.uFogSun.value.clone(), fogDen: SHARED.uFogDen.value, sun: SHARED.uSunDirW.value.clone(), fx: Object.assign({}, Render.post.fx), sky: {} };
    for (const k in SKYU) this._env.sky[k] = SKYU[k].value.clone ? SKYU[k].value.clone() : SKYU[k].value;
  },
  restoreEnv() {
    const e = this._env; if (!e) return; this._env = null;
    SHARED.uFogCol.value.copy(e.fogCol); SHARED.uFogSun.value.copy(e.fogSun); SHARED.uFogDen.value = e.fogDen; SHARED.uSunDirW.value.copy(e.sun);
    for (const k in e.sky) { if (SKYU[k].value.copy) SKYU[k].value.copy(e.sky[k]); else SKYU[k].value = e.sky[k]; }
    const fx = Render.post.fx; for (const k of ['bloom', 'exposure', 'vignette', 'sat', 'contrast', 'grain', 'ca', 'blur', 'shafts', 'flare']) fx[k] = e.fx[k];
    fx.tint.copy(e.fx.tint); fx.lift.copy(e.fx.lift); fx.shadowTint.copy(e.fx.shadowTint); fx.highTint.copy(e.fx.highTint);
  },
  applyEnv(S) {
    if (S.world) return;
    const E = S.env || {};
    SHARED.uFogCol.value.set(E.fog || 0x1a1410); SHARED.uFogSun.value.set(E.fog || 0x1a1410); SHARED.uFogDen.value = E.fogDen || 0.012;
    const fx = Render.post.fx;
    fx.bloom = E.bloom ?? 1.1; fx.exposure = E.exposure ?? 1.0; fx.vignette = E.vignette ?? 0.42; fx.sat = E.sat ?? 1.04; fx.contrast = E.contrast ?? 1.05; fx.grain = 0.03; fx.ca = 0; fx.blur = 0; fx.shafts = 0; fx.flare = 0;
    fx.tint.set(E.tint || 0xffffff); fx.lift.set(E.lift || 0x000000); fx.shadowTint.setRGB(...(E.sh || [0.0, 0.006, 0.02])); fx.highTint.setRGB(...(E.hi || [0.03, 0.012, -0.012]));
    if (E.sky) { for (const k in E.sky) { const v = E.sky[k]; if (Array.isArray(v)) SKYU[k].value.setRGB(...v); else SKYU[k].value = v; } }
    if (E.sun) SHARED.uSunDirW.value.set(...E.sun).normalize();
  },
  // ---------- cast ----------
  spawn(id, spec) {
    const S = Career.S;
    let look;
    if (id === 'me') { const P = S.profile; look = { body: P.body, skin: P.skin, hair: P.hair, hairCol: P.hairCol, beard: P.beard }; }
    else if (id === 'friend' || id === 'capt') { const m = S.mates[id === 'friend' ? S.friend : S.capt]; look = m ? Object.assign({}, m.look, { body: m.body }) : Humans.look(id.length * 77); }
    else if (id === 'rival') look = Object.assign({}, S.rival.look, { body: S.rival.body });
    else if (spec.look) look = spec.look;
    else look = Humans.look((id.charCodeAt(0) * 131 + id.length * 17 + (S ? S.seed % 97 : 0)) >>> 0);
    const team = spec.o && spec.o.team != null ? spec.o.team : id === 'rival' ? S.rival.house : Career.S ? Career.myTeam() : 0;
    const outfit = (spec.o && spec.o.outfit) || 'school';
    const h = new Human(Object.assign({}, look, Outfits.of(outfit, team, id, spec.o || {})));
    const a = typeof spec.at === 'string' ? this.set.anchors[spec.at] : spec.at;
    if (a) { h.root.position.set(a[0], a[1], a[2]); h.root.rotation.y = a[3] || 0; }
    this.scene.add(h.root);
    h.play(spec.anim || 'idle');
    this.cast[id] = { h, spec, walk: null };
    return h;
  },
  // ---------- camera ----------
  shot(s, snap) {
    const res = v => typeof v === 'function' ? v() : v;
    const p = new THREE.Vector3(...res(s.p)), l = new THREE.Vector3(...res(s.l));
    this.cam = { p0: snap ? p.clone() : this.cp.clone(), l0: snap ? l.clone() : this.cl.clone(), f0: snap ? (s.fov || 45) : this.cfov,
      p1: p, l1: l, f1: s.fov || 45, p2: s.p2 ? new THREE.Vector3(...res(s.p2)) : null, l2: s.l2 ? new THREE.Vector3(...res(s.l2)) : null, t: 0, blend: snap ? 0 : (s.blend ?? 0.9), dur: s.dur || 6, orbit: s.orbit || null };
    if (snap) { this.cp.copy(p); this.cl.copy(l); this.cfov = s.fov || 45; }
  },
  updateCamera(rdt) {
    const c = this.cam, cam = Render.camera; if (!c) return;
    c.t += rdt;
    const b = c.blend > 0 ? easeInOut(c.t / c.blend) : 1, u = easeInOut(c.t / c.dur);
    const P = _v1.copy(c.p1), L = _v2.copy(c.l1);
    if (c.p2) P.lerp(c.p2, u); if (c.l2) L.lerp(c.l2, u);
    if (c.orbit) { const a = c.orbit.a0 + c.t * c.orbit.w, r = c.orbit.r; P.set(c.orbit.c[0] + Math.sin(a) * r, c.orbit.c[1] + c.orbit.h, c.orbit.c[2] + Math.cos(a) * r); L.set(...c.orbit.c); }
    if (b < 1) { P.lerpVectors(c.p0, P, b); L.lerpVectors(c.l0, L, b); }
    this.cp.copy(P); this.cl.copy(L); this.cfov = lerp(c.f0, c.f1, b);
    // gentle handheld drift
    const t = performance.now() / 1000, d = Settings.reduceMotion ? 0 : 0.012;
    cam.position.copy(P).add(_v3.set(Math.sin(t * 0.7) * d, Math.sin(t * 0.9 + 1) * d, Math.cos(t * 0.6) * d));
    cam.lookAt(L);
    cam.fov = this.cfov; cam.updateProjectionMatrix();
  },
  update(rdt) {
    if (!this.active) return;
    this.t += rdt;
    SHARED.uTime.value += rdt;
    for (const id in this.cast) {
      const c = this.cast[id];
      if (c.walk) {
        const w = c.walk; w.t += rdt; const u = clamp(w.t / w.dur, 0, 1);
        c.h.root.position.lerpVectors(w.from, w.to, u);
        const dx = w.to.x - w.from.x, dz = w.to.z - w.from.z; c.h.root.rotation.y = damp(c.h.root.rotation.y, Math.atan2(dx, dz), 8, rdt);
        if (u >= 1) { c.walk = null; c.h.play(w.then || 'idle'); if (w.face != null) c.h.root.rotation.y = w.face; }
      }
      c.h.update(rdt);
    }
    if (this.set.update) this.set.update(rdt, this.t);
    if (this.mode !== 'free') this.updateCamera(rdt);
    Script.update(rdt);
  },
  render() { Render.post.render(this.scene, Render.camera); },
};

// outfit parameters per role/team
const Outfits = {
  of(outfit, team, id, o) {
    const T = CONFIG.teams[team] || CONFIG.teams[0];
    const sch = T.kind === 'house' ? T : CONFIG.teams[0];
    switch (outfit) {
      case 'school': return { outfit: 'school', c1: '#101014', c2: sch.c1, c4: sch.c2, c3: '#2a2a2e' };
      case 'kit': return Object.assign({ outfit: 'kit' }, Kits.of(team));
      case 'track': return { outfit: 'track', c1: shade(T.c1, -0.1), c2: T.c2, c3: T.c1, c4: T.c2 };
      case 'formal': { const P = ['#1d1838', '#2a0f18', '#0f2a22', '#1a1a1a', '#3a2a10', '#22104a'], G = ['#d8b060', '#c8ccd4', '#d8b060', '#c8a050']; const k = (id.charCodeAt(0) + id.length * 3) % P.length; return { outfit: 'formal', c1: o.c1 || (id === 'me' ? shade(T.c1, -0.35) : P[k]), c2: G[k % G.length], c4: '#e8e2d6', c3: '#111' }; }
      case 'staff': return { outfit: 'staff', c1: '#1d1b24', c2: '#9a8a5a', c4: '#3a3242', c3: '#222' };
      case 'coat': { const C = ['#3b2a20', '#2a3040', '#402a2a', '#2a3a2a', '#3a3a3e'], SC = [['#7a1a1a', '#d8b060'], ['#1a2c6b', '#c8c8c8'], ['#2a4a2a', '#d8d0c0'], ['#4a2a5a', '#e8c070']]; const k = (id.charCodeAt(0) + id.length) % C.length; const sc = /^(me|friend|capt|rival|mate_)/.test(id) ? [sch.c1, sch.c2] : SC[(id.charCodeAt(id.length - 1) + k) % SC.length]; return { outfit: 'coat', c1: o.c1 || C[k], c2: sc[0], c4: sc[1], c3: '#222' }; }
      case 'casual': { const C = ['#3a4a5a', '#5a3a3a', '#3a5a4a', '#4a4a4a', '#5a4a30']; return { outfit: 'casual', c1: o.c1 || C[(id.charCodeAt(0) + id.length) % C.length], c2: '#c8c8c8', c3: '#202838', c4: '#fff' }; }
    }
    return { outfit };
  },
};

// ===================== SCRIPT RUNNER (cutscenes) =====================
const Script = {
  beats: null, i: 0, waitT: 0, waiting: null, done: null,
  play(script, done) {
    const S = Scenes.enter(script.set, script.variant, { weather: script.weather });
    for (const c of script.cast || []) Scenes.spawn(c.id, c);
    Render.post.fx.letterbox = 0.085;
    this.beats = script.beats; this.i = 0; this.done = done; this.waiting = null; this.waitT = 0;
    Dialogue.show(true);
    this.next();
  },
  next() {
    while (this.beats && this.i < this.beats.length) {
      const b = this.beats[this.i++];
      if (b.cam) { const s = typeof b.cam === 'string' ? Scenes.set.cams[b.cam] : b.cam; if (s) Scenes.shot(s, !!b.snap); continue; }
      if (b.anim) { for (const id in b.anim) if (Scenes.cast[id]) Scenes.cast[id].h.play(b.anim[id]); continue; }
      if (b.walk) { for (const id in b.walk) { const c = Scenes.cast[id]; if (!c) continue; const [x, z, dur, then, face] = b.walk[id]; c.walk = { from: c.h.root.position.clone(), to: new THREE.Vector3(x, c.h.root.position.y, z), t: 0, dur: dur || 2, then, face }; c.h.play('walk'); } continue; }
      if (b.fx) { if (Scenes.set.fx) Scenes.set.fx(b.fx); continue; }
      if (b.title) { Dialogue.card(b.title, b.sub); this.waiting = 'wait'; this.waitT = 2.6; return; }
      if (b.wait) { this.waiting = 'wait'; this.waitT = b.wait; Dialogue.line(null); return; }
      if (b.say) { const [who, text] = b.say; this.speaker(who); Dialogue.line(Story.names(who), text, who); this.waiting = 'tap'; return; }
      if (b.choice) { this.waiting = 'choice'; Dialogue.choices(b.choice, ch => this.choose(ch)); return; }
    }
    this.finish();
  },
  speaker(who) {
    for (const id in Scenes.cast) { const c = Scenes.cast[id]; const sit = /^sit/.test(c.h.cur); if (id === who) c.h.play(sit ? 'sitTalk' : c.spec.anim === 'dance' ? 'dance' : c.spec.anim === 'spell' || c.spec.anim === 'cast' ? c.spec.anim : 'talk'); else if (c.h.cur === 'talk' || c.h.cur === 'sitTalk') c.h.play(sit ? 'sit' : c.spec.anim === 'talk' ? 'idle' : (c.spec.anim || 'idle')); }
  },
  choose(ch) {
    const S = Career.S;
    if (ch.tone) S.persona[ch.tone] = (S.persona[ch.tone] || 0) + 1;
    const fx = ch.fx || {};
    if (fx.chem && S.friend && S.mates[S.friend]) S.mates[S.friend].chem = clamp(S.mates[S.friend].chem + fx.chem, 0, 100);
    for (const k of ['fame', 'fans', 'trust']) if (fx[k]) S[k] = clamp(S[k] + fx[k], 0, 100);
    if (fx.gal) S.gal = Math.max(0, S.gal + fx.gal);
    if (fx.attr) S.attrs[fx.attr[0]] = Math.min(Career.attrCap(), S.attrs[fx.attr[0]] + fx.attr[1]);
    if (fx.rivalry && S.rival) S.rival.heat = clamp(S.rival.heat + fx.rivalry, 0, 100);
    if (fx.captain) S.captain = true;
    if (fx.partner) S.flags.partner = fx.partner;
    Sound.play('ui');
    if (ch.reply) { this.beats.splice(this.i, 0, { say: ch.reply }); }
    this.waiting = null; this.next();
  },
  tap() { if (this.waiting === 'tap') { if (Dialogue.typing()) { Dialogue.finishTyping(); return; } this.waiting = null; this.next(); } else if (this.waiting === 'wait' && this.waitT < 1.8) { this.waitT = 0; } },
  update(rdt) { if (this.waiting === 'wait') { this.waitT -= rdt; if (this.waitT <= 0) { this.waiting = null; Dialogue.card(null); this.next(); } } },
  skip() { if (!this.beats) return; this.beats = this.beats.filter((b, k) => k < this.i || b.choice); this.next(); },
  finish() {
    const d = this.done; this.beats = null; this.done = null; this.waiting = null;
    Dialogue.hide(); Render.post.fx.letterbox = 0;
    if (d) d();
  },
};

// ===================== DIALOGUE UI =====================
const Dialogue = {
  el: null, typT: null, full: '',
  init() {
    const d = document.createElement('div'); d.id = 'dlg';
    d.innerHTML = `<div class="dlgCard" id="dlgCard"><b></b><span></span></div><div class="dlgBox" id="dlgBox"><div class="dlgWho" id="dlgWho"></div><div class="dlgText" id="dlgText"></div><div class="dlgNext">▼</div></div><div class="dlgChoices" id="dlgChoices"></div><button class="dlgSkip" id="dlgSkip">SKIP ▸▸</button>`;
    document.body.appendChild(d); this.el = d;
    d.addEventListener('click', e => { if (e.target.closest('.dlgChoices') || e.target.closest('.dlgSkip')) return; Script.tap(); });
    d.querySelector('#dlgSkip').addEventListener('click', e => { e.stopPropagation(); Script.skip(); });
  },
  show(on) { this.el.classList.toggle('on', !!on); this.el.querySelector('#dlgSkip').style.display = on ? '' : 'none'; },
  hide() { this.show(false); this.line(null); this.card(null); this.el.querySelector('#dlgChoices').innerHTML = ''; },
  card(t, s) { const c = this.el.querySelector('#dlgCard'); if (!t) { c.classList.remove('on'); return; } c.querySelector('b').textContent = t; c.querySelector('span').textContent = s || ''; c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); },
  line(who, text, id) {
    const box = this.el.querySelector('#dlgBox');
    if (!text) { box.classList.remove('on'); return; }
    box.classList.add('on');
    const w = this.el.querySelector('#dlgWho'); w.textContent = who || ''; w.style.display = who ? '' : 'none';
    const col = id === 'me' ? '#ffe39a' : id === 'rival' ? '#ff9a7a' : '#cfe0ff'; w.style.color = col;
    this.full = text; const t = this.el.querySelector('#dlgText'); t.textContent = '';
    clearInterval(this.typT); let i = 0;
    this.typT = setInterval(() => { i += 2; t.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(this.typT); this.typT = null; } }, 22);
    Sound.play('ui', { vol: 0.25 });
  },
  typing() { return !!this.typT; },
  finishTyping() { clearInterval(this.typT); this.typT = null; this.el.querySelector('#dlgText').textContent = this.full; },
  choices(list, cb) {
    const root = this.el.querySelector('#dlgChoices'); root.innerHTML = '';
    this.el.querySelector('#dlgBox').classList.remove('on');
    list.forEach(ch => {
      const b = document.createElement('button'); b.className = 'dlgChoice';
      b.innerHTML = `${ch.tone ? `<i class="tone ${ch.tone}">${TONE_ICON[ch.tone]}</i>` : ''}<span>${ch.t}</span>`;
      b.addEventListener('click', e => { e.stopPropagation(); root.innerHTML = ''; cb(ch); });
      root.appendChild(b);
    });
  },
};
