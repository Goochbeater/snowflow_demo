// Minimal overlay: a wordmark, one slim control bar with popovers, a one-line event ticker, and an inspector on click.
const CSS = `
:root{--glass:rgba(12,12,14,.58);--bd:rgba(255,240,215,.12);--tx:#f1e9da;--mut:#a59a88;--acc:#e9b064}
#ui{position:fixed;inset:0;pointer-events:none;font:12px/1.4 "Inter","Segoe UI",system-ui,sans-serif;color:var(--tx);-webkit-font-smoothing:antialiased}
#ui .g{background:var(--glass);border:1px solid var(--bd);backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2)}
#mark{position:absolute;left:20px;top:16px;pointer-events:auto;cursor:default;text-shadow:0 1px 8px rgba(0,0,0,.55)}
#mark .w{font:500 13px/1 Georgia,serif;letter-spacing:.42em;color:#f6efe2}
#mark .p{margin-top:6px;font:italic 14px/1.25 Georgia,serif;color:#f3d9ae;max-width:46vw}
#mark .s{margin-top:5px;color:#cfc3ae;font-size:11px;display:none;font-variant-numeric:tabular-nums}
#mark:hover .s{display:block}
#bar{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);width:min(780px,calc(100vw - 24px));height:42px;border-radius:21px;display:flex;align-items:center;gap:4px;padding:0 8px;pointer-events:auto}
#bar button{all:unset;cursor:pointer;height:30px;min-width:30px;border-radius:15px;display:grid;place-items:center;color:var(--tx);opacity:.82;font:600 11px/1 inherit;padding:0 6px;box-sizing:border-box}
#bar button:hover{opacity:1;background:rgba(255,255,255,.07)}#bar button.on{color:var(--acc);opacity:1}
#bar svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
#arc{position:relative;flex:1;height:30px;margin:0 6px}
#arc input{position:absolute;inset:0;width:100%;margin:0;opacity:0;cursor:pointer;z-index:3}
#arc .tr{position:absolute;left:0;right:0;top:14px;height:2px;background:rgba(255,255,255,.14);border-radius:1px}
#arc .ah{position:absolute;left:0;top:14px;height:2px;background:rgba(160,200,230,.35);border-radius:1px}
#arc .fl{position:absolute;left:0;top:13px;height:4px;background:var(--acc);border-radius:2px}
#arc .kn{position:absolute;top:9px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(233,176,100,.35)}
#arc .mk{position:absolute;top:11px;width:2px;height:8px;margin-left:-1px;background:rgba(255,255,255,.35);border-radius:1px}
#arc .mk.k{background:rgba(255,255,255,.75)}
#arc .tip{position:absolute;bottom:26px;transform:translateX(-50%);font-size:10px;color:var(--mut);white-space:nowrap;opacity:0;transition:opacity .2s}
#arc:hover .tip{opacity:1}
#clock{font:500 12px/1 inherit;font-variant-numeric:tabular-nums;color:#e8dcc6;width:40px;text-align:right}
.sep{width:1px;height:18px;background:var(--bd);margin:0 3px}
.pop{position:absolute;bottom:68px;border-radius:14px;padding:12px 14px;pointer-events:auto;display:none;min-width:220px}
.pop.open{display:block}
.pop h4{margin:0 0 8px;font:600 10px/1 inherit;letter-spacing:.14em;color:var(--mut);text-transform:uppercase}
.pop label{display:grid;grid-template-columns:92px 1fr;align-items:center;gap:8px;margin:7px 0;color:#d6cbb8}
.pop input[type=range]{width:100%;accent-color:var(--acc);height:14px}
.pop .list button{all:unset;display:block;width:100%;box-sizing:border-box;padding:6px 8px;border-radius:8px;cursor:pointer;color:#e6dccb}
.pop .list button:hover{background:rgba(255,255,255,.07)}.pop .list button.on{color:var(--acc)}
.stops{display:flex;gap:4px}.stops button{all:unset;flex:1;text-align:center;padding:7px 4px;border-radius:8px;cursor:pointer;color:#d6cbb8;background:rgba(255,255,255,.05);font-size:11px}
.stops button.on{background:var(--acc);color:#1c140a}
.tog{display:flex;gap:6px;flex-wrap:wrap}.tog button{all:unset;padding:6px 10px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,.06);color:#e6dccb}.tog button.on{background:var(--acc);color:#1c140a}
#tick{position:absolute;left:50%;bottom:66px;transform:translateX(-50%);max-width:min(700px,90vw);text-align:center;font:italic 13px/1.3 Georgia,serif;color:#f4e6cc;text-shadow:0 1px 10px rgba(0,0,0,.8),0 0 2px rgba(0,0,0,.6);transition:opacity .8s;pointer-events:none}
#tick b{font:500 10px/1 inherit;font-style:normal;color:var(--acc);margin-right:8px;letter-spacing:.06em}
#tick.grief{color:#bcd3ff}#tick.fight{color:#ffb79a}
#insp{position:absolute;right:16px;top:16px;width:270px;border-radius:14px;padding:12px 14px;display:none;pointer-events:auto}
#insp h2{margin:0;font:500 16px/1.2 Georgia,serif}#insp .r{color:var(--mut);margin-top:2px}
#insp .bars{display:grid;grid-template-columns:66px 1fr;gap:4px 8px;margin:9px 0;align-items:center;color:var(--mut);font-size:11px}
#insp .bar{height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}#insp .bar i{display:block;height:100%;background:var(--acc)}
#insp .goal{color:#f3d9ae;margin-top:4px}#insp .dest{color:#9fcbe6}
#insp ul{margin:6px 0 0;padding-left:14px;max-height:120px;overflow:auto;color:#d6cbb8;font-size:11px}
#insp .x{position:absolute;right:10px;top:8px;cursor:pointer;color:var(--mut)}
#insp .act{display:flex;gap:6px;margin-top:9px}#insp .act button{all:unset;cursor:pointer;padding:4px 10px;border-radius:8px;background:rgba(255,255,255,.07)}
#hint{position:absolute;left:50%;top:18px;transform:translateX(-50%);color:#d8ccb6;font-size:11px;text-shadow:0 1px 6px #000;transition:opacity 1.2s}
#busy{position:absolute;left:50%;bottom:94px;transform:translateX(-50%);color:var(--acc);display:none;font-size:11px;letter-spacing:.08em}
.photo #mark,.photo #bar,.photo .pop,.photo #tick,.photo #insp,.photo #hint{display:none!important}
#lb1,#lb2{position:fixed;left:0;right:0;height:0;background:#000;transition:height .6s;pointer-events:none}#lb1{top:0}#lb2{bottom:0}
.photo #lb1,.photo #lb2{height:9vh}
#xh{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:rgba(255,245,225,.85);box-shadow:0 0 0 1px rgba(0,0,0,.4);display:none}
#fphint{position:absolute;left:50%;top:16px;transform:translateX(-50%);color:#e9dcc6;font-size:11px;text-shadow:0 1px 6px #000;display:none}
.fp #xh,.fp #fphint{display:block}.fp #hint{display:none}
@media (max-width:640px){#mark .p{font-size:12px}#tick{bottom:62px;font-size:12px}}
`;
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  era: '<svg viewBox="0 0 24 24"><path d="M3 20h18M5 20V11l7-6 7 6v9M9 20v-5h6v5"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  world: '<svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  walk: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4.5" r="2"/><path d="M11 21l2-6-2.5-2 1-5 3 3 3 1M10.5 8L7 10l-1 3M13 15l3 6"/></svg>',
  photo: '<svg viewBox="0 0 24 24"><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/></svg>',
};

export function buildUI(o) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ui = document.createElement('div'); ui.id = 'ui'; document.body.appendChild(ui);
  const P = o.P;
  ui.innerHTML = `
  <div id="lb1"></div><div id="lb2"></div>
  <div id="mark"><div class="w">KATTEGAT</div><div class="p" id="phase"></div><div class="s" id="stats"></div></div>
  <div id="hint">drag to orbit · right-drag to pan · scroll to zoom · click a villager · P photo · R reset</div>
  <div id="tick"></div><div id="busy">re-living the evening…</div>
  <div id="bar" class="g">
    <button id="play" title="Play / pause (space)"></button>
    <button id="spd" title="Simulation speed">1×</button>
    <div id="arc"><div class="tr"></div><div class="ah" id="ahead"></div><div class="fl" id="fill"></div><div class="kn" id="knob"></div><input type="range" id="arcI" min="0" max="${o.ARC_END}" step="1"></div>
    <span id="clock"></span><span class="sep"></span>
    <button data-p="sun" title="Light">${ICON.sun}</button>
    <button data-p="era" title="Settlement years">${ICON.era}</button>
    <button data-p="cam" title="Camera">${ICON.cam}</button>
    <button data-p="world" title="World">${ICON.world}</button>
    <button data-p="eye" title="Overlays">${ICON.eye}</button>
    <button id="walk" title="Walk the village in first person (F)">${ICON.walk}</button>
    <button id="photo" title="Photo mode (P)">${ICON.photo}</button>
  </div>
  <div class="pop g" id="pop-sun"><h4>Light</h4><label>Time of day<input type="range" id="sun" min="0" max="1" step="0.005"></label>
    <div class="stops" id="sunStops"><button data-v="0">Dawn fog</button><button data-v="0.33">Noon</button><button data-v="0.66">Golden</button><button data-v="1">Dusk</button></div></div>
  <div class="pop g" id="pop-era"><h4>Settlement years</h4><div class="stops" id="eraStops"><button data-v="0">Yr 1<br>tents</button><button data-v="1">Yr 14<br>longhouses</button><button data-v="2">Yr 31<br>palisade</button><button data-v="3">Yr 58<br>jarl's seat</button></div></div>
  <div class="pop g" id="pop-cam"><h4>Camera</h4><div class="list" id="camList"></div></div>
  <div class="pop g" id="pop-world" style="min-width:270px"><h4>World</h4>
    <label>Sea state<input type="range" id="sea" min="0" max="1" step="0.01"></label>
    <label>Wind<input type="range" id="wind" min="0" max="1" step="0.01"></label>
    <label>Wind from<input type="range" id="wdir" min="-3.14" max="3.14" step="0.01"></label>
    <label>Tide<input type="range" id="tide" min="-1.4" max="1.4" step="0.01"></label>
    <label>Snow &amp; season<input type="range" id="season" min="0" max="1" step="0.01"></label>
    <label>Crowd<input type="range" id="dens" min="0.1" max="1" step="0.01"></label>
    <label>Celebration<input type="range" id="heat" min="0.3" max="2" step="0.01"></label>
    <label>Smoke<input type="range" id="smoke" min="0" max="1.5" step="0.01"></label>
    <label>Boats<input type="range" id="traffic" min="0" max="1" step="0.01"></label>
    <label>Seed<span style="display:flex;gap:6px"><input id="seed" style="width:64px;background:#0005;color:var(--tx);border:1px solid var(--bd);border-radius:6px;padding:3px 6px"><span class="tog"><button id="reseed">New raid</button></span></span></label></div>
  <div class="pop g" id="pop-eye"><h4>Overlays</h4><div class="tog"><button id="ovl">Paths &amp; intent</button><button id="rum">Rumor map</button><button id="refl">Reflections</button></div></div>
  <div id="xh"></div><div id="fphint">WASD walk · Shift run · Space jump · E look at someone · F or Esc leave · click to capture the mouse</div>
  <div id="insp" class="g"><span class="x" id="ix">✕</span><div id="ib"></div><div class="act"><button id="ifollow">Follow</button></div></div>`;
  const $ = (id) => document.getElementById(id);
  // popovers
  const pops = ['sun', 'era', 'cam', 'world', 'eye']; let open = null;
  const bar = $('bar');
  const toggle = (name, btn) => {
    for (const p of pops) $('pop-' + p).classList.remove('open');
    [...bar.querySelectorAll('[data-p]')].forEach((b) => b.classList.remove('on'));
    if (open === name) { open = null; return; }
    open = name; const pop = $('pop-' + name); pop.classList.add('open'); btn.classList.add('on');
    const r = btn.getBoundingClientRect(); const w = pop.offsetWidth;
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
  };
  bar.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => toggle(b.dataset.p, b)));
  addEventListener('pointerdown', (e) => { if (open && !e.target.closest('.pop') && !e.target.closest('#bar')) toggle(open, bar.querySelector(`[data-p="${open}"]`)); });
  // play / speed
  const speeds = [1, 4, 16];
  const syncPlay = () => { $('play').innerHTML = P.speed ? ICON.pause : ICON.play; };
  $('play').onclick = () => { P.speed = P.speed ? 0 : (P._last || 1); if (P.speed) P._last = P.speed; syncPlay(); };
  $('spd').onclick = () => { const cur = P.speed || P._last || 1; const n = speeds[(speeds.indexOf(cur) + 1) % speeds.length]; P._last = n; if (P.speed) P.speed = n; $('spd').textContent = n + '×'; };
  syncPlay();
  // cameras
  const camList = $('camList');
  for (const n of ['Reset view', ...o.presets]) {
    const b = document.createElement('button'); b.textContent = n; b.dataset.n = n;
    b.onclick = () => (n === 'Reset view' ? o.reset() : o.goPreset(n));
    camList.appendChild(b);
  }
  // world sliders
  const bind = (id, key) => { const el = $(id); el.value = P[key]; el.oninput = () => { P[key] = parseFloat(el.value); }; return el; };
  bind('sea', 'sea'); bind('wind', 'wind'); bind('wdir', 'windDir'); bind('tide', 'tide'); bind('season', 'season'); bind('dens', 'density'); bind('smoke', 'smoke'); bind('traffic', 'traffic');
  bind('heat', 'heat').onchange = () => o.invalidate();
  const sunEl = $('sun'); sunEl.value = P.sun; sunEl.oninput = () => { P.sun = parseFloat(sunEl.value); };
  $('sunStops').querySelectorAll('button').forEach((b) => (b.onclick = () => { P.sun = parseFloat(b.dataset.v); sunEl.value = P.sun; }));
  const eraBtns = [...$('eraStops').querySelectorAll('button')];
  const syncEra = () => eraBtns.forEach((b) => b.classList.toggle('on', +b.dataset.v === P.era));
  eraBtns.forEach((b) => (b.onclick = () => { P.era = +b.dataset.v; syncEra(); })); syncEra();
  const tg = (id, key, def) => { const b = $(id); if (def !== undefined && P[key] === undefined) P[key] = def; b.classList.toggle('on', !!P[key]); b.onclick = () => { P[key] = !P[key]; b.classList.toggle('on', !!P[key]); }; };
  tg('ovl', 'overlay'); tg('rum', 'rumor'); tg('refl', 'refl', true);
  $('seed').value = P.seed; $('reseed').onclick = () => { const v = parseInt($('seed').value, 10); o.newSeed(v === P.seed || isNaN(v) ? Math.floor(Math.random() * 99999) : v); };
  const photo = (on) => { P.photo = on; ui.classList.toggle('photo', on); };
  $('photo').onclick = () => photo(true);
  $('walk').onclick = () => o.toggleFP();
  // arc scrubber
  const arcI = $('arcI'); let dragging = false;
  arcI.addEventListener('pointerdown', () => (dragging = true)); addEventListener('pointerup', () => (dragging = false));
  arcI.oninput = () => o.scrubTo(parseFloat(arcI.value));
  const NOM = [['beach', 190, 'Keels on the sand'], ['feast', 420, 'The feast'], ['ring', 700, 'Wrestling'], ['pyre', 1150, 'The pyre'], ['embers', 1500, 'Silence after'], ['asleep', 1900, 'Asleep']];
  const arc = $('arc'); const mk = {};
  for (const [k, t, lbl] of NOM) { const d = document.createElement('div'); d.className = 'mk'; arc.appendChild(d); const tip = document.createElement('div'); tip.className = 'tip'; tip.textContent = lbl; arc.appendChild(tip); mk[k] = [d, tip, t]; }
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (e.key === 'r' || e.key === 'R') o.reset();
    if (e.key === 'p' || e.key === 'P') photo(!P.photo);
    if (e.key === 'Escape') { photo(false); showAgent(null); if (ui.classList.contains('fp')) o.toggleFP(); }
    if (e.key === ' ') { $('play').onclick(); e.preventDefault(); }
  });
  setTimeout(() => ($('hint').style.opacity = 0), 9000);
  // inspector
  let cur = null;
  const showAgent = (a) => { cur = a; $('insp').style.display = a ? 'block' : 'none'; if (!a) o.deselect(); else renderAgent(a); };
  $('ix').onclick = () => showAgent(null);
  $('ifollow').onclick = () => cur && o.followAgent(cur.id);
  const moodWord = (a) => a.grief > 0.5 ? 'grieving' : a.drunk > 0.6 ? 'roaring drunk' : a.mood > 0.8 ? 'jubilant' : a.mood > 0.62 ? 'glad' : a.mood > 0.45 ? 'steady' : a.mood > 0.3 ? 'troubled' : 'bitter';
  const renderAgent = (a) => {
    const A = o.agents();
    const spouse = a.spouse >= 0 ? A[a.spouse] : null;
    const fate = a.fate === 'raider' ? 'home from the raid' : a.fate === 'wounded' ? 'home wounded' : 'stayed home';
    const bar2 = (n, v) => `<span>${n}</span><span class="bar"><i style="width:${Math.round(v * 100)}%"></i></span>`;
    const lost = a.kin.filter((k) => !A[k].alive).map((k) => A[k].name.split(' ')[0]);
    $('ib').innerHTML = `<h2>${a.name}</h2><div class="r">${o.roleLabel[a.role] || a.role} · ${a.age} · ${fate}${spouse ? ' · ' + (spouse.alive ? 'wed to ' : 'widow of ') + spouse.name.split(' ')[0] : ''}</div>
      ${lost.length ? `<div style="color:#bcd3ff;margin-top:3px">Lost on the raid: ${lost.join(', ')}</div>` : ''}
      <div class="bars">${bar2('Mood', a.mood)}${bar2('Hunger', a.hunger)}${bar2('Warmth', a.warmth)}${bar2('Exhaustion', a.fatigue)}${bar2('Courage', a.courage)}${bar2('Mead', a.drunk)}</div>
      <div>Feeling <b>${moodWord(a)}</b>${a.excited > 0 ? ' · <span style="color:var(--acc)">spreading news</span>' : ''}</div>
      <div class="goal">${a.goalTxt || a.act}</div><div class="dest">${a.moving ? '→ ' + (a.destTxt || '…') : a.aboard ? 'aboard ship' : 'at ' + (a.destTxt || 'rest')}</div>
      <ul>${a.mem.slice().reverse().map((m) => `<li>${m}</li>`).join('')}</ul>`;
  };
  const phaseOf = (S) => {
    const sea = S.ships.filter((s) => s.state === 0).length, beached = S.ships.length - sea;
    const sleepF = S.stats.sleeping / Math.max(1, S.stats.total);
    if (sleepF > 0.88) return 'The village sleeps';
    if (sleepF > 0.45) return 'Torches gutter out; the village stumbles home';
    if (S.pyre.lit >= 0 && S.quiet > 0.6) return 'The pyre burns, and the beach falls silent';
    if (S.pyre.lit >= 0) return 'After the fire, the feast stirs again, quieter';
    if (S.flags.feastActive >= 0) return S.ring.a >= 0 ? 'The feast roars; a wrestling ring has formed' : S.flags.skald >= 0 ? 'The feast; the skald sings the raid' : 'The feast is dragged out onto the sand';
    if (beached === 0) return 'Sails in the narrows; the village runs to the water';
    if (sea > 0) return `Keels grinding up the sand: ${beached} beached, ${sea} still coming in`;
    return 'The crews come ashore';
  };
  let lastLog = -1, tickT = 0;
  return {
    setSun: (v) => { P.sun = v; sunEl.value = v; },
    setFP: (on) => { ui.classList.toggle('fp', on); $('walk').classList.toggle('on', on); },
    setActiveCam: (n) => { [...camList.children].forEach((c) => c.classList.toggle('on', c.dataset.n === n)); },
    showAgent,
    tick: (S, info) => {
      const f = S.t / o.ARC_END * 100;
      if (!dragging) arcI.value = S.t;
      $('fill').style.width = f + '%'; $('knob').style.left = f + '%';
      $('ahead').style.width = (info.ahead / o.ARC_END * 100) + '%';
      for (const k in mk) { const [d, tip, t] = mk[k]; const tt = info.marks[k] ?? t; const p = tt / o.ARC_END * 100 + '%'; d.style.left = p; tip.style.left = p; d.classList.toggle('k', info.marks[k] !== undefined); }
      $('clock').textContent = o.clock(S.t);
      $('phase').textContent = phaseOf(S);
      const dead = S.agents.filter((a) => !a.alive).length, st = S.stats;
      $('stats').innerHTML = `${S.ships.length} ships home from ${S.raidTarget} · ${dead} did not return<br>${st.total} villagers · ${st.feasting || 0} feasting · ${st.ringWatch || 0} at the ring · ${st.mourning || 0} mourning · ${st.sleeping || 0} asleep · ${info.fps.toFixed(0)} fps`;
      $('busy').style.display = info.catching ? 'block' : 'none';
      const lg = S.log, tick = $('tick');
      if (lg.length && lg[lg.length - 1].t !== lastLog) { const e = lg[lg.length - 1]; lastLog = e.t; tick.innerHTML = `<b>${o.clock(e.t)}</b>${e.msg}`; tick.className = e.kind; tick.style.opacity = 1; tickT = performance.now(); }
      if (performance.now() - tickT > 6500) tick.style.opacity = 0;
      if (info.selected && cur) renderAgent(info.selected);
    },
  };
}
