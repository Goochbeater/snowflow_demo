// ===================== UI: screens, settings, flow =====================
const SETTINGS_SCHEMA = [
  { key: 'quality', label: 'Graphics', type: 'seg', opts: [['auto', 'Auto'], ['low', 'Low'], ['med', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']], apply: v => Render.applyTier(v === 'auto' ? Platform.autoTier : v) },
  { key: 'fps', label: 'Frame rate', type: 'seg', opts: [[30, '30'], [60, '60'], [90, '90'], [120, '120']] },
  { key: 'sens', label: 'Steering', type: 'range', min: 0.5, max: 2, step: 0.05 },
  { key: 'invert', label: 'Invert pitch', type: 'seg', opts: [[false, 'Off'], [true, 'On']] },
  { key: 'gyro', label: 'Gyro aim', type: 'seg', opts: [[false, 'Off'], [true, 'On']], apply: v => Input.setGyro(v) },
  { key: 'aimAssist', label: 'Aim assist', type: 'seg', opts: [['auto', 'Auto'], ['off', 'Off'], ['low', 'Low'], ['high', 'High']] },
  { key: 'ballFocus', label: 'Ball focus', type: 'seg', opts: [['toggle', 'Button'], ['always', 'Always on'], ['off', 'Off']] },
  { key: 'trackAssist', label: 'Lock-on steering', type: 'seg', opts: [['high', 'Strong'], ['low', 'Light'], ['off', 'Off']] },
  { key: 'finisherLen', label: 'Finishers', type: 'seg', opts: [['full', 'Full'], ['short', 'Short'], ['off', 'Off']] },
  { key: 'haptics', label: 'Haptics', type: 'seg', opts: [[true, 'On'], [false, 'Off']] },
  { key: 'reduceMotion', label: 'Reduce motion', type: 'seg', opts: [[false, 'Off'], [true, 'On']] },
  { key: 'comfort', label: 'Comfort vignette', type: 'seg', opts: [[false, 'Off'], [true, 'On']] },
  { key: 'horizonLock', label: 'Horizon lock', type: 'seg', opts: [[false, 'Off'], [true, 'On']] },
  { key: 'radar', label: 'Radar', type: 'seg', opts: [[true, 'On'], [false, 'Off']] },
  { key: 'uiScale', label: 'Button size', type: 'range', min: 0.8, max: 1.3, step: 0.05, apply: () => Platform.applyClasses() },
  { key: 'uiOpacity', label: 'Button opacity', type: 'range', min: 0.35, max: 1, step: 0.05, apply: v => document.documentElement.style.setProperty('--uio', v) },
  { key: 'music', label: 'Music', type: 'range', min: 0, max: 1, step: 0.05, apply: () => Sound.applyVolumes() },
  { key: 'sfx', label: 'Effects', type: 'range', min: 0, max: 1, step: 0.05, apply: () => Sound.applyVolumes() },
  { key: 'crowd', label: 'Crowd', type: 'range', min: 0, max: 1, step: 0.05, apply: () => Sound.applyVolumes() },
];
const SETUP_SCHEMA = [
  { key: 'difficulty', label: 'Difficulty', type: 'seg', opts: [['rookie', 'Rookie'], ['pro', 'Pro'], ['legend', 'Legend']] },
  { key: 'length', label: 'Match length', type: 'seg', opts: [[0, '3 min'], [1, '6 min'], [2, '10 min']] },
  { key: 'weather', label: 'Conditions', type: 'seg', opts: [['golden', 'Golden hour'], ['overcast', 'Drizzle'], ['night', 'Night']] },
  { key: 'snitch', label: 'Snitch value', type: 'seg', opts: [['arcade', 'Arcade · 30'], ['classic', 'Classic · 150']] },
];

const UI = {
  cur: null, from: null,
  init() {
    const $ = id => document.getElementById(id);
    this.$ = $;
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { Sound.play('ui'); this.go(b.dataset.go); }));
    $('tapPlay').parentElement.parentElement.addEventListener('click', () => this.tapToPlay());
    const unlock = () => { if (Sound.ctx && Sound.ctx.state !== 'running') Sound.ctx.resume().catch(() => {}); };
    document.addEventListener('touchend', unlock, { passive: true }); document.addEventListener('click', unlock);
    $('startMatch').addEventListener('click', () => { Sound.play('ui'); this.startMatch(); });
    $('settingsDone').addEventListener('click', () => { Sound.play('ui'); saveSettings(); this.go(this.from || 'menu'); });
    $('pResume').addEventListener('click', () => this.resume(true));
    $('pRestart').addEventListener('click', () => { this.hideAll(); this.startMode(Game.mode === 'lab' || Game.mode === 'slab' ? Game.mode : 'match'); });
    $('pSettings').addEventListener('click', () => { this.from = 'pause'; this.go('settings'); });
    $('pQuit').addEventListener('click', () => this.quit());
    $('resMenu').addEventListener('click', () => this.quit());
    $('resAgain').addEventListener('click', () => { this.hideAll(); this.startMode('match'); });
    $('hintsGo').addEventListener('click', () => { $('hints').classList.remove('on'); SaveData.seenHints = true; persist(); this.resume(false); });
    document.documentElement.style.setProperty('--uio', Settings.uiOpacity);
    this.buildRows($('settingsRows'), SETTINGS_SCHEMA);
    this.buildRows($('setupRows'), SETUP_SCHEMA);
    this.buildTeams();
    Events.on('hidden', () => { if (Game.mode !== 'demo' && (Game.state === 'play' || Game.state === 'finisher' || Game.state === 'countdown')) this.pause(); Sound.suspend(); });
    Events.on('visible', () => { if (Sound.ctx) Sound.resume(); if (Game.mode !== 'demo') Platform.requestWake(); });
    Events.on('fullscreenExit', () => { if (Game.mode !== 'demo' && Game.state === 'play') this.pause(); });
    Events.on('resize', ({ folded }) => {
      Render.resize();
      if (Game.mode !== 'demo' && (Game.state === 'play' || Game.state === 'finisher') && (folded || Platform.needsRotate())) this.autoPause();
    });
    Events.on('contextlost', () => { this.contextLost = true; HUD.bigCount('<small>RESTORING GRAPHICS…</small>', 99); });
    Events.on('contextrestored', () => { this.contextLost = false; Render.buildEnv(); HUD.el.overlay.classList.remove('on'); });
  },
  buildRows(root, schema) {
    root.innerHTML = '';
    for (const s of schema) {
      const row = document.createElement('div'); row.className = 'row';
      const id = 'set_' + s.key;
      row.innerHTML = `<label for="${id}">${s.label}</label>`;
      if (s.type === 'seg') {
        const seg = document.createElement('div'); seg.className = 'seg'; seg.id = id;
        for (const [v, t] of s.opts) {
          const b = document.createElement('button'); b.textContent = t; b.type = 'button';
          b.classList.toggle('on', Settings[s.key] === v);
          b.addEventListener('click', () => {
            Settings[s.key] = v; saveSettings(); Sound.play('ui');
            seg.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on');
            s.apply && s.apply(v);
          });
          seg.appendChild(b);
        }
        row.appendChild(seg);
      } else {
        const r = document.createElement('input'); r.type = 'range'; r.id = id; r.min = s.min; r.max = s.max; r.step = s.step; r.value = Settings[s.key];
        r.addEventListener('input', () => { Settings[s.key] = parseFloat(r.value); s.apply && s.apply(Settings[s.key]); });
        r.addEventListener('change', () => saveSettings());
        row.appendChild(r);
      }
      root.appendChild(row);
    }
  },
  buildTeams() {
    const mk = (root, key) => {
      root.innerHTML = '';
      CONFIG.teams.forEach((T, i) => {
        const c = document.createElement('button'); c.type = 'button'; c.className = 'teamCard';
        c.innerHTML = `<img alt="" src="${Tex.crestURL[i]}"><span>${T.name.toUpperCase()}</span>`;
        c.addEventListener('click', () => {
          Settings[key] = i;
          if (Settings.team === Settings.opp) { if (key === 'team') Settings.opp = (i + 1) % 4; else Settings.team = (i + 1) % 4; }
          saveSettings(); Sound.play('ui'); this.refreshTeams();
        });
        root.appendChild(c);
      });
    };
    mk(this.$('pickTeam'), 'team'); mk(this.$('pickOpp'), 'opp'); this.refreshTeams();
  },
  refreshTeams() {
    this.$('pickTeam').querySelectorAll('.teamCard').forEach((c, i) => { c.classList.toggle('on', i === Settings.team); });
    this.$('pickOpp').querySelectorAll('.teamCard').forEach((c, i) => { c.classList.toggle('vs', i === Settings.opp); c.classList.toggle('dis', i === Settings.team); });
  },
  hideAll() { document.querySelectorAll('.screen').forEach(s => { s.hidden = true; }); },
  show(id) { this.hideAll(); const el = this.$(id); if (el) el.hidden = false; this.cur = id; },
  go(where) {
    if (where === 'menu') this.show('scrMenu');
    else if (where === 'setup') { this.refreshTeams(); this.show('scrSetup'); }
    else if (where === 'settings') { if (this.cur !== 'scrPause') this.from = this.cur === 'scrMenu' ? 'menu' : this.from; this.buildRows(this.$('settingsRows'), SETTINGS_SCHEMA); this.show('scrSettings'); }
    else if (where === 'pause') this.show('scrPause');
    else if (where === 'howto') { this.finList(this.$('finList')); this.show('scrHowto'); }
    else if (where === 'records') { this.records(); this.show('scrRecords'); }
    else if (where === 'lab') { this.hideAll(); this.startMode('lab'); }
    else if (where === 'slab') { this.hideAll(); this.startMode('slab'); }
  },
  finList(root) {
    root.innerHTML = Object.keys(SEEKER_DEFS).map(id => { const d = SEEKER_DEFS[id]; return `<div class="fin"><b>${d.name} · SEEKER</b><span class="gest">${d.gesture}</span>${d.desc}</div>`; }).join('') + Finishers.order.map(id => {
      const d = FIN_DEFS[id], locked = d.unlock && !SaveData.unlocked[d.unlock];
      return `<div class="fin ${locked ? 'locked' : ''}"><b>${d.name}${locked ? ' · LOCKED' : ''}</b><span class="gest">${d.gesture}</span>${d.desc}${locked ? `<br><small>${d.unlock === 'thunder' ? 'Win a match to unlock.' : 'Reach SS style rank or win on Legend.'}</small>` : ''}</div>`;
    }).join('');
  },
  records() {
    const s = SaveData, R = ['D', 'C', 'B', 'A', 'S', 'SS'];
    this.$('recStats').innerHTML = [['BEST STYLE', s.best.toLocaleString()], ['WINS', `${s.wins} / ${s.matches}`], ['FINISHERS LANDED', s.finishers], ['BEST RANK', R[s.bestRank] || 'D']].map(([k, v]) => `<div class="stat"><i>${k}</i><b>${v}</b></div>`).join('');
    this.finList(this.$('recFin'));
  },
  title() {
    this.show('scrTitle'); HUD.show(false);
  },
  tapToPlay() {
    if (this.cur !== 'scrTitle') return;
    Sound.init(); if (Sound.music) Sound.music.start(); Sound.play('ui');
    Platform.enterImmersive();
    this.show('scrMenu');
  },
  startMatch() { this.hideAll(); this.startMode('match'); },
  startMode(mode) {
    Sound.init(); if (Sound.music) Sound.music.start();
    Input.reset();
    World.setWeather(mode === 'lab' || mode === 'slab' ? 'golden' : Settings.weather);
    Game.setup(mode);
    Platform.requestWake();
    if (mode === 'match' && !SaveData.seenHints) { Game.state = 'paused'; this.$('hints').classList.add('on'); }
    if (mode === 'lab') HUD.ticker('Finisher Lab: hold SHOOT and swipe, draw a circle, or triple-tap PASS.');
    if (mode === 'slab') HUD.ticker('Seeker Lab: chase the Snitch, then hold CATCH and swipe ↑ ↓ ← → or draw a circle.');
  },
  pause() {
    if (Game.mode === 'demo' || Game.state === 'end' || this.cur === 'scrPause') return;
    if (Game.state === 'finisher') Finishers.skip();
    this.prevState = Game.state === 'countdown' ? 'countdown' : 'play';
    Game.state = 'paused'; Input.reset(); this.show('scrPause'); HUD.controls.classList.remove('on');
  },
  autoPause() {
    if (Game.state === 'finisher') Finishers.skip();
    this.prevState = 'play'; Game.state = 'paused'; Input.reset();
    if (Platform.needsRotate()) return this.pause();
    this.resume(true);
  },
  resume(countdown) {
    this.hideAll(); this.cur = null; HUD.show(true);
    if (Platform.needsRotate()) { Game.state = 'paused'; this.show('scrPause'); return; }
    if (!countdown) { Game.state = this.prevState || 'play'; return; }
    let n = 3; HUD.bigCount(String(n), 1.1);
    const tick = () => { n--; if (n > 0) { HUD.bigCount(String(n), 1.1); Sound.play('ui'); setTimeout(tick, 650); } else { HUD.bigCount('GO', 0.5); Game.state = this.prevState || 'play'; } };
    clearTimeout(this.resumeTO); this.resumeTO = setTimeout(tick, 650);
  },
  quit() {
    Input.reset(); HUD.show(false); Sound.chant(false);
    World.setWeather(Settings.weather === 'overcast' ? 'golden' : Settings.weather);
    Game.setup('demo'); this.show('scrMenu');
  },
  results(win) {
    HUD.show(false);
    const G = Game, A = CONFIG.teams[G.houses[0]], B = CONFIG.teams[G.houses[1]], st = G.stats, R = ['D', 'C', 'B', 'A', 'S', 'SS'];
    this.$('resVerdict').textContent = win < 0 ? 'A Draw' : win === 0 ? 'Victory' : 'Defeat';
    this.$('resA').textContent = G.score[0]; this.$('resB').textContent = G.score[1];
    this.$('resA').style.color = A.ui; this.$('resB').style.color = B.ui;
    this.$('resNA').textContent = A.name.toUpperCase(); this.$('resNB').textContent = B.name.toUpperCase();
    const rows = [['STYLE SCORE', G.style.score.toLocaleString()], ['BEST RANK', R[st.bestRank]], ['GOALS', st.goals], ['ASSISTS', st.assists], ['STEALS', st.steals], ['PERFECT DODGES', st.dodges], ['FINISHERS', st.finishers], ['TOP SPEED', Math.round(st.topSpeed * 3.6) + ' km/h']];
    if (st.best) rows.push(['BEST FINISHER', `${st.best.name} · ${st.best.rating.toLowerCase()}`]);
    if (st.snitch) rows.push(['SNITCH', 'Caught by you']);
    this.$('resStats').innerHTML = rows.map(([k, v]) => `<div class="stat"><i>${k}</i><b>${v}</b></div>`).join('');
    this.$('resUnlock').textContent = G.newUnlock ? `New finisher unlocked: ${G.newUnlock}` : '';
    G.newUnlock = null;
    this.show('scrResults');
  },
};
