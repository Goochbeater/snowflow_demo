// ===================== HUD =====================
const IND_SVG = {
  mate: c => `<svg viewBox="-17 -17 34 34"><path d="M0 -11 L9 7 L0 3 L-9 7 Z" fill="${c}" stroke="#000" stroke-opacity=".55" stroke-width="1.5"/></svg>`,
  target: () => `<svg viewBox="-17 -17 34 34"><circle r="12" fill="none" stroke="#ffe39a" stroke-width="2.4" stroke-dasharray="6 4"/><circle r="3" fill="#ffe39a"/></svg>`,
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
    this.boostCtx = $('boostMeter').getContext('2d');
    this.chargeCtx = $('chargeMeter').getContext('2d');
    const box = $('inds'); this.inds = [];
    for (let i = 0; i < 14; i++) { const d = document.createElement('div'); d.className = 'ind'; d.innerHTML = '<div class="g"></div><div class="lbl"></div>'; box.appendChild(d); this.inds.push({ el: d, g: d.firstChild, lbl: d.lastChild, key: '', on: false }); }
    this.cache = {}; this.frame = 0; this.lastBoost = -1; this.lastCharge = -1;
  },
  set(k, v, el) { if (this.cache[k] !== v) { this.cache[k] = v; el.textContent = v; } },
  show(on) { this.root.classList.toggle('on', on); this.controls.classList.toggle('on', on); this.visible = on; },
  cinematic(on) { this.root.style.opacity = on ? '0' : ''; this.controls.style.opacity = on ? '0.15' : ''; this.inCine = on; },
  matchStart() {
    if (Game.mode === 'demo') { this.show(false); return; }
    const A = CONFIG.teams[Game.houses[0]], B = CONFIG.teams[Game.houses[1]];
    this.el.nameA.textContent = A.short; this.el.nameB.textContent = B.short;
    for (const [chip, T] of [[this.el.chipA, A], [this.el.chipB, B]]) { chip.style.background = T.c1; chip.style.color = T.c2; chip.style.border = `1px solid ${T.c2}`; chip.textContent = T.letter; }
    document.documentElement.style.setProperty('--team-a', A.ui); document.documentElement.style.setProperty('--team-b', B.ui);
    this.cache = {}; this.rank(0); this.setShootLabel('SHOOT'); this.swap(false);
    this.$('radar').style.display = Settings.radar ? '' : 'none';
    this.el.clock.parentElement.style.display = '';
    this.$('clock').style.display = Game.mode === 'lab' ? 'none' : '';
    this.show(true);
  },
  bigCount(t, hold = 0.8) {
    const o = this.el.overlay; o.innerHTML = t; o.classList.add('on');
    clearTimeout(this.countTO); this.countTO = setTimeout(() => o.classList.remove('on'), hold * 1000);
  },
  banner(title, sub) {
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
  arc(ctx, v, color, w) {
    const c = ctx.canvas, r = c.width / 2 - w;
    ctx.clearRect(0, 0, c.width, c.width);
    ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(c.width / 2, c.width / 2, r, 0, TAU); ctx.stroke();
    if (v > 0.005) { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(c.width / 2, c.width / 2, r, -Math.PI / 2, -Math.PI / 2 + TAU * v); ctx.stroke(); }
  },
  project(p, out, margin = 30) {
    const cam = Render.camera, W = Platform.w, H = Platform.h;
    _v6.copy(p).project(cam);
    const behind = _v6.z > 1;
    let x = (_v6.x * 0.5 + 0.5) * W, y = (-_v6.y * 0.5 + 0.5) * H;
    if (behind) { x = W - x; y = H - y; }
    out.on = !behind && x > margin && x < W - margin && y > margin && y < H - margin;
    if (!out.on) {
      const cx = W / 2, cy = H / 2; let dx = x - cx, dy = y - cy;
      if (behind && Math.abs(dy) < 1) dy = 1;
      const s = Math.min((cx - margin) / Math.max(Math.abs(dx), 1e-3), (cy - margin) / Math.max(Math.abs(dy), 1e-3));
      x = cx + dx * s; y = cy + dy * s; out.ang = Math.atan2(dy, dx);
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
    if (s.lblText !== label) { s.lblText = label; s.lbl.textContent = label || ''; }
    s.el.classList.toggle('call', label === 'CALL');
  },
  update(rdt) {
    if (!this.visible) return;
    this.frame++;
    const G = Game, p = G.player, e = this.el;
    this.set('a', String(G.score[0]), e.ptsA); this.set('b', String(G.score[1]), e.ptsB);
    if (G.mode === 'match') {
      const c = G.overtime ? G.otT : G.clock, m = Math.floor(c / 60), s = Math.floor(c % 60);
      this.set('clock', (G.overtime ? '+' : '') + m + ':' + String(s).padStart(2, '0'), e.clock);
      e.clock.classList.toggle('ot', G.overtime);
    }
    const fl = clamp(G.flair, 0, 1);
    if (this.cache.fl !== Math.round(fl * 100)) { this.cache.fl = Math.round(fl * 100); e.ring.setAttribute('stroke-dashoffset', (188.5 * (1 - fl)).toFixed(1)); e.reticle.classList.toggle('full', fl >= 1); }
    this.set('style', G.style.score.toLocaleString(), e.stylePts);
    if (!p) return;
    const ready = G.finisherReady();
    e.shoot.classList.toggle('ready', ready);
    const Q = G.quaffle;
    this.setShootLabel(p.role === 'seeker' ? 'GRAB' : ready ? 'FINISH' : p.hasBall ? 'SHOOT' : Q.holder && Q.holder.side !== p.side ? 'STEAL' : 'SHOOT');
    if (Math.abs(p.boost - this.lastBoost) > 0.01) { this.lastBoost = p.boost; this.arc(this.boostCtx, p.boost, p.boost > 0.25 ? '#8fd3ff' : '#ff7a5c', 6); }
    const ch = Input.shootHeld && p.hasBall ? clamp((G.rtime - Input.shootT) / CONFIG.ball.charge, 0, 1) : 0;
    if (Math.abs(ch - this.lastCharge) > 0.01) { this.lastCharge = ch; this.arc(this.chargeCtx, ch, ch >= 1 ? '#ffe39a' : '#e8b84a', 7); }
    // indicators
    let i = 0;
    const pt = G.passTarget();
    if (G.state === 'play' || G.state === 'end') {
      for (const m of G.teams[p.side]) {
        if (m === p || m.role !== 'chaser') continue;
        const T = CONFIG.teams[m.house], lbl = m.ai.call ? 'CALL' : m === pt && p.hasBall ? 'PASS' : '';
        this.ind(i++, 'mate' + m.house, IND_SVG.mate(T.ui), _v4.copy(m.pos).addScaledVector(UP, 1.6), lbl, T.ui);
      }
      if (p.hasBall && p.role === 'chaser') { const h = G.targetHoop(); if (h) this.ind(i++, 'target', IND_SVG.target(), h.pos, '', '#ffe39a'); }
      else if (Q.holder !== p) this.ind(i++, 'q', IND_SVG.quaffle(), Q.pos, Q.holder ? '' : 'QUAFFLE', '#e0533a');
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
  drawRadar() {
    const c = this.radarCtx, W = c.canvas.width, H = c.canvas.height, G = Game;
    const mx = x => W / 2 + x / 105 * (W / 2 - 8), mz = z => H / 2 + z / 62 * (H / 2 - 8);
    c.clearRect(0, 0, W, H);
    c.strokeStyle = 'rgba(241,228,198,.35)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(W / 2, H / 2, CONFIG.pitch.a / 105 * (W / 2 - 8), CONFIG.pitch.b / 62 * (H / 2 - 8), 0, 0, TAU); c.stroke();
    c.fillStyle = '#e8b84a'; for (const h of World.hoops) { c.beginPath(); c.arc(mx(h.pos.x), mz(h.pos.z), 3, 0, TAU); c.fill(); }
    for (const f of G.flyers) {
      if (f.isPlayer) continue;
      c.fillStyle = CONFIG.teams[f.house].ui; c.beginPath(); c.arc(mx(f.pos.x), mz(f.pos.z), f.role === 'keeper' ? 4 : 3.2, 0, TAU); c.fill();
    }
    for (const b of G.bludgers) { if (!b.mesh.visible) continue; c.fillStyle = '#111'; c.strokeStyle = '#ff5a3a'; c.lineWidth = 1.5; c.beginPath(); c.arc(mx(b.pos.x), mz(b.pos.z), 3, 0, TAU); c.fill(); c.stroke(); }
    c.fillStyle = '#ff5a4a'; c.beginPath(); c.arc(mx(G.quaffle.pos.x), mz(G.quaffle.pos.z), 3.6, 0, TAU); c.fill();
    if (G.snitch.active) { c.fillStyle = '#ffd65a'; c.beginPath(); c.arc(mx(G.snitch.pos.x), mz(G.snitch.pos.z), 3, 0, TAU); c.fill(); }
    const p = G.player; if (p) {
      c.save(); c.translate(mx(p.pos.x), mz(p.pos.z)); c.rotate(Math.atan2(p.fwd.z, p.fwd.x));
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-5, -5); c.lineTo(-3, 0); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
    }
  },
};
