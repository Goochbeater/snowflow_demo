// ===================== HUD =====================
const IND_SVG = {
  mate: c => `<svg viewBox="-17 -17 34 34"><path d="M0 -11 L9 7 L0 3 L-9 7 Z" fill="${c}" stroke="#000" stroke-opacity=".55" stroke-width="1.5"/></svg>`,
  target: (c = '#ffe39a') => `<svg viewBox="-17 -17 34 34"><circle r="12" fill="none" stroke="${c}" stroke-width="2.6" stroke-dasharray="6 4"/><circle r="3" fill="${c}"/></svg>`,
  hoop: () => `<svg viewBox="-17 -17 34 34"><circle r="9" fill="none" stroke="#e8b84a" stroke-width="3"/><path d="M0 9 V16" stroke="#e8b84a" stroke-width="3"/></svg>`,
  quaffle: () => `<svg viewBox="-17 -17 34 34"><circle r="8" fill="#b3261e" stroke="#fff" stroke-width="2"/></svg>`,
  bludger: () => `<svg viewBox="-17 -17 34 34"><circle r="8" fill="#1a1a1e" stroke="#ff4a2a" stroke-width="2.5"/></svg>`,
  snitch: () => `<svg viewBox="-17 -17 34 34"><path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z" fill="#ffd65a" stroke="#fff6c8" stroke-width="1.2"/></svg>`,
  arrow: c => `<svg viewBox="-17 -17 34 34"><path d="M12 0 L-6 -9 L-2 0 L-6 9 Z" fill="${c}" stroke="#000" stroke-opacity=".5" stroke-width="1.4"/></svg>`,
};

const HUD = {
  init() {
    const $ = id => document.getElementById(id);
    this.$ = $;
    this.root = $('hud'); this.controls = $('controls');
    this.el = { ptsA: $('ptsA'), ptsB: $('ptsB'), nameA: $('nameA'), nameB: $('nameB'), chipA: $('chipA'), chipB: $('chipB'), clock: $('clock'), ring: $('flairRing'), reticle: $('reticle'), rank: $('rankLetter'), stylePts: $('stylePts'), banner: $('banner'), stamp: $('stamp'), popups: $('popups'), ticker: $('ticker'), hint: $('hint'), warn: $('warnArc'), comfort: $('comfort'), shoot: $('bShoot'), shootLbl: $('shootLbl'), swap: $('bSwap'), radar: $('radar'), overlay: $('overlayMsg') };
    this.radarCtx = this.el.radar.getContext('2d');
    this.el.pass = $('bPass'); this.el.passLbl = $('passLbl'); this.el.lock = $('lockOn'); this.el.lockLbl = $('lockLbl');
    this.el.focusBtn = $('bFocus'); this.el.farrow = $('focusArrow'); this.el.farrowG = $('focusArrowG'); this.el.farrowLbl = $('focusArrowLbl');
    this.boostCtx = $('boostMeter').getContext('2d');
    this.chargeCtx = $('chargeMeter').getContext('2d');
    const box = $('inds'); this.inds = [];
    for (let i = 0; i < 14; i++) { const d = document.createElement('div'); d.className = 'ind'; d.innerHTML = '<div class="g"></div><div class="lbl"></div>'; box.appendChild(d); this.inds.push({ el: d, g: d.firstChild, lbl: d.lastChild, key: '', on: false }); }
    this.cache = {}; this.frame = 0; this.lastBoost = -1; this.lastCharge = -1;
  },
  set(k, v, el) { if (this.cache[k] !== v) { this.cache[k] = v; el.textContent = v; } },
  show(on) { this.root.classList.toggle('on', on); this.controls.classList.toggle('on', on); this.visible = on; },
  cinematic(on) { this.root.style.opacity = on ? '0' : ''; this.controls.style.opacity = on ? '0' : ''; this.inCine = on; },
  matchStart() {
    if (Game.mode === 'demo') { this.show(false); return; }
    const A = CONFIG.teams[Game.houses[0]], B = CONFIG.teams[Game.houses[1]];
    this.el.nameA.textContent = A.short; this.el.nameB.textContent = B.short;
    for (const [chip, T] of [[this.el.chipA, A], [this.el.chipB, B]]) { chip.style.background = T.c1; chip.style.color = T.c2; chip.style.border = `1px solid ${T.c2}`; chip.textContent = T.letter; }
    document.documentElement.style.setProperty('--team-a', A.ui); document.documentElement.style.setProperty('--team-b', B.ui);
    this.cache = {}; this.rank(0); this.setShootLabel('SHOOT'); this.swap(false);
    this.$('radar').style.display = Settings.radar ? '' : 'none';
    this.el.clock.parentElement.style.display = '';
    const lab = (Game.mode === 'lab' || Game.mode === 'slab') && !Game.drill;
    this.$('clock').style.display = '';
    if (lab) { this.cache.clock = Game.mode === 'lab' ? 'FINISHER LAB' : 'SEEKER LAB'; this.el.clock.textContent = this.cache.clock; }
    this.labMode = lab;
    this.show(true);
  },
  bigCount(t, hold = 0.8) {
    const o = this.el.overlay; o.innerHTML = t; o.classList.add('on');
    clearTimeout(this.countTO); this.countTO = setTimeout(() => o.classList.remove('on'), hold * 1000);
  },
  banner(title, sub) {
    this.bannerT = performance.now();
    const b = this.el.banner; b.classList.remove('show'); void b.offsetWidth;
    b.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`; b.classList.add('show');
  },
  stamp(text, cls) {
    const s = this.el.stamp; s.className = ''; void s.offsetWidth;
    s.textContent = text; s.className = 'show ' + (cls || '');
  },
  popup(text, bad) {
    const d = document.createElement('div'); d.className = 'popup'; d.textContent = text;
    if (bad) d.style.textShadow = '0 0 10px rgba(255,80,60,.95), 0 2px 4px #000';
    d.style.top = (36 + (this.popN = ((this.popN || 0) + 1) % 3) * 5) + '%';
    this.el.popups.appendChild(d); setTimeout(() => d.remove(), 1150);
  },
  ticker(text) {
    const t = this.el.ticker; t.textContent = text; t.classList.add('on');
    clearTimeout(this.tickTO); this.tickTO = setTimeout(() => t.classList.remove('on'), 3200);
  },
  hint(text, dur = 2) {
    const wait = 2200 - (performance.now() - (this.bannerT || -1e9));
    if (wait > 0) { clearTimeout(this.hintQ); this.hintQ = setTimeout(() => this.hint(text, dur), wait); return; }
    const h = this.el.hint; h.textContent = text; h.classList.add('on');
    clearTimeout(this.hintTO); this.hintTO = setTimeout(() => h.classList.remove('on'), dur * 1000);
  },
  rank(r) {
    const L = ['D', 'C', 'B', 'A', 'S', 'SS'][r] || 'D', el = this.el.rank;
    el.textContent = L; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  },
  swap(on) { this.el.swap.classList.toggle('on', on); },
  setShootLabel(t) { if (this.cache.shoot !== t) { this.cache.shoot = t; this.el.shootLbl.textContent = t; } },
  comfort(v) { this.el.comfort.style.opacity = v.toFixed(2); },
  arc(ctx, v, color, w, zone) {
    const c = ctx.canvas, r = c.width / 2 - w;
    ctx.clearRect(0, 0, c.width, c.width);
    ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(c.width / 2, c.width / 2, r, 0, TAU); ctx.stroke();
    if (zone) { ctx.strokeStyle = 'rgba(125,255,154,.35)'; ctx.beginPath(); ctx.arc(c.width / 2, c.width / 2, r, -Math.PI / 2 + TAU * zone[0], -Math.PI / 2 + TAU * zone[1]); ctx.stroke(); }
    if (v > 0.005) { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(c.width / 2, c.width / 2, r, -Math.PI / 2, -Math.PI / 2 + TAU * v); ctx.stroke(); }
  },
  // the button cluster (measured on resize) is a no-go zone for off-screen arrows and labels
  measureSafe() {
    const r = { right: 0, bottom: 0 }, W = Platform.w, H = Platform.h;
    for (const id of ['bShoot', 'bPass', 'bBoost', 'bFocus', 'bLook']) { const el = document.getElementById(id); if (!el || !el.offsetParent) continue; const b = el.getBoundingClientRect(); if (b.width) { r.right = Math.max(r.right, W - b.left + 8); r.bottom = Math.max(r.bottom, H - b.top + 8); } }
    this.safe = r; this.safeT = performance.now();
  },
  project(p, out, margin = 30) {
    const cam = Render.camera, W = Platform.w, H = Platform.h;
    if (!this.safe || performance.now() - this.safeT > 2000) this.measureSafe();
    _v6.copy(p).project(cam);
    const behind = _v6.z > 1;
    let x = (_v6.x * 0.5 + 0.5) * W, y = (-_v6.y * 0.5 + 0.5) * H;
    if (behind) { x = W - x; y = H - y; }
    out.on = !behind && x > margin && x < W - margin && y > margin + 40 && y < H - margin;
    if (!out.on) {
      const cx = W / 2, cy = H / 2; let dx = x - cx, dy = y - cy;
      if (behind && Math.abs(dy) < 1) dy = 1;
      const s = Math.min((cx - margin) / Math.max(Math.abs(dx), 1e-3), (cy - margin - 20) / Math.max(Math.abs(dy), 1e-3));
      x = cx + dx * s; y = cy + dy * s; out.ang = Math.atan2(dy, dx);
      // slide out of the bottom-right controls and keep clear of the score bar
      const S = this.safe;
      if (S && x > W - S.right && y > H - S.bottom) { if (dx > dy * (W / H)) y = Math.min(y, H - S.bottom); else x = Math.min(x, W - S.right); }
      y = Math.max(y, 64);
    }
    out.x = x; out.y = y; return out;
  },
  ind(i, key, html, p, label, cls, alwaysArrow) {
    const s = this.inds[i]; if (!s) return;
    const pr = this.project(p, this._pr || (this._pr = {}));
    const arrow = !pr.on;
    const k = key + (arrow ? 'a' : '');
    if (s.key !== k) { s.key = k; s.g.innerHTML = arrow ? IND_SVG.arrow(cls || '#fff') : html; }
    if (!s.on) { s.el.style.display = 'block'; s.on = true; }
    const rot = arrow ? `rotate(${pr.ang}rad)` : '';
    s.el.style.transform = `translate3d(${pr.x.toFixed(1)}px,${(pr.y - (arrow ? 0 : 18)).toFixed(1)}px,0)`;
    s.g.style.transform = rot;
    if (arrow && label === 'CALL') label = '';
    if (s.lblText !== label) { s.lblText = label; s.lbl.textContent = label || ''; }
    s.el.classList.toggle('call', label === 'CALL');
  },
  update(rdt) {
    if (!this.visible) return;
    this.frame++;
    const G = Game, p = G.player, e = this.el;
    this.set('a', String(G.score[0]), e.ptsA); this.set('b', String(G.score[1]), e.ptsB);
    if (G.mode === 'match') {
      const c = G.drill ? Math.max(0, G.drill.t) : G.overtime ? G.otT : G.clock, m = Math.floor(c / 60), s = Math.floor(c % 60);
      if (!this.labMode) this.set('clock', (G.overtime ? '+' : '') + m + ':' + String(s).padStart(2, '0'), e.clock);
      e.clock.classList.toggle('ot', G.overtime);
    }
    const p0 = G.player, seekerMode = p0 && p0.role === 'seeker';
    const fl = clamp(seekerMode ? (G.focus || 0) : G.flair, 0, 1);
    if (this.cache.fl !== Math.round(fl * 100)) { this.cache.fl = Math.round(fl * 100); e.ring.setAttribute('stroke-dashoffset', (188.5 * (1 - fl)).toFixed(1)); e.reticle.classList.toggle('full', fl >= CONFIG.finisherCost); }
    e.reticle.classList.toggle('seek', !!seekerMode);
    this.set('style', G.style.score.toLocaleString(), e.stylePts);
    if (!p) return;
    const sReady = G.seekerFinisherReady(), ready = G.finisherReady() || sReady;
    e.shoot.classList.toggle('ready', ready);
    const Q = G.quaffle;
    this.setShootLabel(p.role === 'seeker' ? (sReady ? 'CATCH' : 'GRAB') : ready ? 'FINISH' : p.hasBall ? 'SHOOT' : Q.holder && Q.holder.side !== p.side ? 'STEAL' : 'SHOOT');
    const canCall = p.role === 'chaser' && !p.hasBall && Q.holder && Q.holder.side === p.side && Q.holder !== p;
    const pl = p.hasBall ? 'PASS' : canCall ? 'CALL' : 'PASS';
    if (this.cache.pass !== pl) { this.cache.pass = pl; e.passLbl.textContent = pl; }
    e.pass.classList.toggle('callable', !!canCall); e.pass.classList.toggle('dim', !p.hasBall && !canCall);
    this.updateLock(G, p);
    if (Math.abs(p.boost - this.lastBoost) > 0.01) { this.lastBoost = p.boost; this.arc(this.boostCtx, p.boost, p.boost > 0.25 ? '#8fd3ff' : '#ff7a5c', 6); }
    const ch = Input.shootHeld && p.hasBall ? clamp((G.rtime - Input.shootT) / CONFIG.ball.charge, 0, 1) : 0;
    if (Math.abs(ch - this.lastCharge) > 0.01) { this.lastCharge = ch; this.arc(this.chargeCtx, ch, ch >= 0.68 && ch <= 0.94 ? '#7dff9a' : ch >= 1 ? '#ffe39a' : '#e8b84a', 7, Input.shootHeld && p.hasBall ? [0.68, 0.94] : null); }
    // indicators
    let i = 0;
    const pt = G.passTarget();
    if (G.state === 'play' || G.state === 'end') {
      for (const m of G.teams[p.side]) {
        if (m === p || m.role !== 'chaser') continue;
        const T = CONFIG.teams[m.house], lbl = Q.holder === m ? (G.rtime - (m.ai.passingT || -9) < 1 ? 'PASSING' : 'HAS IT') : m.ai.call ? 'CALL' : m === pt && p.hasBall ? 'PASS' : '';
        this.ind(i++, 'mate' + m.house, IND_SVG.mate(T.ui), _v4.copy(m.pos).addScaledVector(UP, 1.6), lbl, T.ui);
      }
      if (p.hasBall && p.role === 'chaser') { const h = G.targetHoop(); if (h) { const ok = G.shotLinedUp(); this.ind(i++, ok ? 'targetOk' : 'target', IND_SVG.target(ok ? '#7dff9a' : '#ffe39a'), h.pos, '', ok ? '#7dff9a' : '#ffe39a'); } }
      else if (Q.holder !== p && !Q.hidden && G.lock !== Q && !(G.focusOn && G.focusKind === 'QUAFFLE')) this.ind(i++, 'q', IND_SVG.quaffle(), Q.pos, Q.holder ? '' : 'QUAFFLE ' + Math.round(Q.pos.distanceTo(p.pos)) + 'm', '#e0533a');
      for (const b of G.bludgers) { if (b.state === 'struck' && b.byside !== p.side && b.pos.distanceTo(p.pos) < 60) this.ind(i++, 'b', IND_SVG.bludger(), b.pos, '', '#ff4a2a'); }
      if (G.snitch.active) this.ind(i++, 'sn', IND_SVG.snitch(), G.snitch.pos, p.role === 'seeker' ? Math.round(G.snitch.pos.distanceTo(p.pos)) + 'm' : '', '#ffd65a');
    }
    for (; i < this.inds.length; i++) { const s = this.inds[i]; if (s.on) { s.on = false; s.el.style.display = 'none'; } }
    // bludger warning arc
    let wa = 0, wang = 0;
    for (const b of G.bludgers) {
      if (b.state !== 'struck' || b.byside === p.side) continue;
      const d = b.pos.distanceTo(p.pos); _v1.subVectors(p.pos, b.pos);
      if (d < 40 && _v1.dot(b.vel) > 0) { const a = 1 - d / 40; if (a > wa) { wa = a; _v2.copy(b.pos); } }
    }
    if (G.warnT > 0 && G.warnFrom) { wa = Math.max(wa, 0.6); if (wa === 0.6) _v2.copy(G.warnFrom.pos); }
    if (wa > 0) {
      _v3.copy(_v2).applyMatrix4(Render.camera.matrixWorldInverse);
      wang = Math.atan2(_v3.x, _v3.y);
      e.warn.style.transform = `rotate(${wang}rad)`;
    }
    e.warn.style.opacity = (wa * 1.2).toFixed(2);
    if (p.outOfBounds && !this.inCine && this.frame % 30 === 0) this.hint('TURN BACK', 1);
    if (Settings.radar && this.frame % 3 === 0) this.drawRadar();
  },
  updateLock(G, p) {
    const el = this.el.lock, fa = this.el.farrow;
    const fb = this.el.focusBtn, showBtn = Settings.ballFocus === 'toggle' && Game.mode !== 'slab';
    if (this.cache.fbShow !== showBtn) { this.cache.fbShow = showBtn; fb.style.display = showBtn ? '' : 'none'; }
    fb.classList.toggle('on', !!G.focusOn);
    // focus mode shows the objective; otherwise the lock-on target
    let pos = null, kind = null;
    if (G.focusOn && G.focusKind && Settings.ballFocus !== 'off') { pos = G.focusPt; kind = G.focusKind; }
    else if (G.lock) { pos = G.lock.pos; kind = G.lock === G.snitch ? 'SNITCH' : G.lock === G.quaffle ? 'QUAFFLE' : 'CARRIER'; }
    const hideBoth = () => { if (this.lockOn) { el.style.display = 'none'; this.lockOn = false; } if (this.faOn) { fa.style.display = 'none'; this.faOn = false; } };
    if (!pos || this.inCine || kind === 'HOOP') { hideBoth(); return; }
    const pr = this.project(pos, this._lp || (this._lp = {}), 46);
    const d = Math.round(pos.distanceTo(p.pos)), lbl = kind + ' ' + d + 'm';
    if (!pr.on) {
      if (this.lockOn) { el.style.display = 'none'; this.lockOn = false; }
      if (!this.faOn) { fa.style.display = 'block'; this.faOn = true; }
      const ay = clamp(pr.y, 96, Platform.h - 70), ax = clamp(pr.x, 60, Platform.w - 60);
      fa.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0)`;
      this.el.farrowG.style.transform = `rotate(${pr.ang}rad)`;
      if (this.cache.fa !== lbl) { this.cache.fa = lbl; this.el.farrowLbl.textContent = lbl; }
      return;
    }
    if (this.faOn) { fa.style.display = 'none'; this.faOn = false; }
    if (!this.lockOn) { el.style.display = 'block'; this.lockOn = true; }
    const age = clamp((G.rtime - (G.lockT || 0)) / 0.25, 0, 1), sc = lerp(1.8, 1, easeOut(age));
    el.style.transform = `translate3d(${pr.x.toFixed(1)}px,${pr.y.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
    if (this.cache.lock !== lbl) { this.cache.lock = lbl; this.el.lockLbl.textContent = lbl; }
    el.classList.toggle('near', kind !== 'QUAFFLE' && d < 13);
    el.classList.toggle('focus', !!G.focusOn && !!G.focusKind);
  },
  // heading-up radar: whatever is in front of you is at the top
  drawRadar() {
    const c = this.radarCtx, W = c.canvas.width, H = c.canvas.height, G = Game, p = G.player;
    if (!p) return;
    const fl = Math.hypot(p.fwd.x, p.fwd.z) || 1, fx = p.fwd.x / fl, fz = p.fwd.z / fl;
    const cx = W / 2, cy = H * 0.6, s = (W / 2 - 6) / 95;
    const X = (x, z) => cx + ((x - p.pos.x) * -fz + (z - p.pos.z) * fx) * s;
    const Y = (x, z) => cy - ((x - p.pos.x) * fx + (z - p.pos.z) * fz) * s;
    const dot = (x, z, r, fill, stroke) => { const px = X(x, z), py = Y(x, z); c.beginPath(); c.arc(clamp(px, 4, W - 4), clamp(py, 4, H - 4), r, 0, TAU); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } };
    c.clearRect(0, 0, W, H);
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    c.strokeStyle = 'rgba(241,228,198,.35)'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, x = Math.cos(a) * CONFIG.pitch.a, z = Math.sin(a) * CONFIG.pitch.b; i ? c.lineTo(X(x, z), Y(x, z)) : c.moveTo(X(x, z), Y(x, z)); }
    c.stroke();
    c.restore();
    const sx = G.attackSign(p.side);
    for (const h of World.hoops) dot(h.pos.x, h.pos.z, 3.2, h.side === sx ? '#ffe39a' : '#8a7a50');
    for (const f of G.flyers) { if (f.isPlayer) continue; dot(f.pos.x, f.pos.z, f.role === 'keeper' ? 4 : 3.2, CONFIG.teams[f.house].ui); }
    for (const b of G.bludgers) if (b.mesh.visible) dot(b.pos.x, b.pos.z, 3, '#111', '#ff5a3a');
    if (!G.quaffle.hidden) dot(G.quaffle.pos.x, G.quaffle.pos.z, 4.6, '#ff3a2a', '#fff');
    if (G.snitch.active) dot(G.snitch.pos.x, G.snitch.pos.z, 3.4, '#ffd65a');
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(cx, cy - 8); c.lineTo(cx - 5.5, cy + 5); c.lineTo(cx, cy + 2); c.lineTo(cx + 5.5, cy + 5); c.closePath(); c.fill();
  },
};
