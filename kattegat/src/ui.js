// Compact overlay UI: three time scrubbers, camera presets, world controls, inspector, saga log.
const CSS = `
:root{--bg:rgba(14,13,12,.72);--bd:rgba(255,236,200,.14);--tx:#efe6d4;--mut:#a89c86;--acc:#f0b25a;--acc2:#7fc3e8}
#ui{position:fixed;inset:0;pointer-events:none;font:12px/1.35 "Segoe UI",system-ui,sans-serif;color:var(--tx)}
#ui .pan{pointer-events:auto;background:var(--bg);border:1px solid var(--bd);border-radius:10px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
#title{position:absolute;left:14px;top:12px;padding:10px 14px;max-width:340px}
#title h1{margin:0;font:600 17px/1.1 Georgia,serif;letter-spacing:.18em}
#title .sub{color:var(--mut);margin-top:3px}
#title .phase{margin-top:8px;font:600 14px/1.2 Georgia,serif;color:var(--acc)}
#title .stats{margin-top:4px;color:var(--mut);font-variant-numeric:tabular-nums}
#cams{position:absolute;right:14px;top:12px;display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;max-width:min(560px,60vw);padding:7px}
#cams button,#ctl button,.seg button{pointer-events:auto;background:rgba(255,255,255,.06);color:var(--tx);border:1px solid var(--bd);border-radius:6px;padding:4px 8px;font:inherit;cursor:pointer}
#cams button.on,.seg button.on{background:var(--acc);color:#1b140b;border-color:var(--acc)}
#cams button:hover,#ctl button:hover{border-color:var(--acc)}
#ctl{position:absolute;right:14px;top:132px;width:236px;padding:8px 12px 10px}
#ctl summary{cursor:pointer;font-weight:600;letter-spacing:.06em;list-style:none}
#ctl label{display:grid;grid-template-columns:96px 1fr;align-items:center;gap:6px;margin:5px 0;color:var(--mut)}
#ctl input[type=range]{width:100%;accent-color:var(--acc)}
#ctl .row{display:flex;gap:6px;align-items:center;margin:6px 0;flex-wrap:wrap}
.seg{display:inline-flex;gap:3px}
#tl{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;width:min(880px,calc(100vw - 28px));padding:8px 14px 10px}
.scr{display:grid;grid-template-columns:118px 1fr 120px;align-items:center;gap:10px;margin:3px 0}
.scr .nm{color:var(--mut);font-weight:600;letter-spacing:.04em}
.scr .val{text-align:right;font-variant-numeric:tabular-nums;color:var(--tx)}
.track{position:relative;height:30px}
.track input{position:absolute;inset:8px 0 auto 0;width:100%;margin:0;accent-color:var(--acc);z-index:2}
.track .ahead{position:absolute;left:0;top:13px;height:5px;border-radius:3px;background:rgba(127,195,232,.35);z-index:1}
.track .mk{position:absolute;top:-1px;font-size:10px;color:var(--mut);transform:translateX(-50%);white-space:nowrap}
.track .mk::after{content:"";position:absolute;left:50%;top:12px;width:1px;height:10px;background:rgba(255,236,200,.35)}
.track .lbls{position:absolute;inset:auto 0 -2px 0;display:flex;justify-content:space-between;font-size:10px;color:var(--mut)}
#log{position:absolute;left:14px;bottom:128px;width:340px;padding:8px 12px;max-height:150px;overflow:hidden}
#log div{margin:2px 0;color:#d9cfbd}#log b{color:var(--acc);font-weight:600;margin-right:6px;font-variant-numeric:tabular-nums}
#log .grief{color:#9fc0ff}#log .fight{color:#ff9d7a}#log .reunion{color:#ffe2a6}
#insp{position:absolute;left:14px;top:150px;width:300px;padding:10px 12px;display:none}
#insp h2{margin:0;font:600 15px/1.2 Georgia,serif}#insp .r{color:var(--mut)}
#insp .bars{display:grid;grid-template-columns:70px 1fr;gap:3px 8px;margin:8px 0;align-items:center}
#insp .bar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}#insp .bar i{display:block;height:100%;background:var(--acc)}
#insp .goal{color:var(--acc);margin-top:6px}#insp .dest{color:var(--acc2)}
#insp ul{margin:6px 0 0;padding-left:16px;max-height:150px;overflow:auto;color:#d9cfbd}
#insp .x{position:absolute;right:8px;top:6px;cursor:pointer;color:var(--mut)}
#insp .btns{display:flex;gap:6px;margin-top:8px}#insp button{pointer-events:auto;background:rgba(255,255,255,.06);color:var(--tx);border:1px solid var(--bd);border-radius:6px;padding:3px 8px;cursor:pointer}
#hint{position:absolute;left:50%;transform:translateX(-50%);bottom:122px;color:var(--mut);font-size:11px;opacity:.8}
#busy{position:absolute;left:50%;top:14px;transform:translateX(-50%);padding:5px 12px;display:none;color:var(--acc)}
.photo #title,.photo #cams,.photo #ctl,.photo #tl,.photo #log,.photo #insp,.photo #hint{display:none!important}
#lb1,#lb2{position:fixed;left:0;right:0;height:0;background:#000;transition:height .5s;pointer-events:none}#lb1{top:0}#lb2{bottom:0}
.photo #lb1,.photo #lb2{height:8vh}
#pexit{position:fixed;right:16px;bottom:12vh;display:none;pointer-events:auto;background:rgba(0,0,0,.5);color:#fff;border:1px solid #fff4;border-radius:6px;padding:4px 10px;cursor:pointer}
.photo #pexit{display:block}
@media (max-width:760px){#ctl{top:auto;bottom:150px;width:200px}#log{display:none}#title{max-width:60vw}#cams{max-width:90vw;top:auto;bottom:205px;right:8px}}
`;

export function buildUI(o) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ui = document.createElement('div'); ui.id = 'ui'; document.body.appendChild(ui);
  const P = o.P;
  ui.innerHTML = `
  <div id="lb1"></div><div id="lb2"></div>
  <div id="title" class="pan"><h1>KATTEGAT</h1><div class="sub" id="sub"></div><div class="phase" id="phase"></div><div class="stats" id="stats"></div></div>
  <div id="cams" class="pan"></div>
  <details id="ctl" class="pan" open><summary>World</summary>
    <div class="row"><span style="color:var(--mut);width:96px">Simulation</span><span class="seg" id="spd"></span></div>
    <label>Sea state<input type="range" id="sea" min="0" max="1" step="0.01"></label>
    <label>Wind<input type="range" id="wind" min="0" max="1" step="0.01"></label>
    <label>Wind from<input type="range" id="wdir" min="-3.14" max="3.14" step="0.01"></label>
    <label>Tide<input type="range" id="tide" min="-1.4" max="1.4" step="0.01"></label>
    <label>Snow &amp; season<input type="range" id="season" min="0" max="1" step="0.01"></label>
    <label>Crowd density<input type="range" id="dens" min="0.1" max="1" step="0.01"></label>
    <label>Celebration heat<input type="range" id="heat" min="0.3" max="2" step="0.01"></label>
    <label>Smoke<input type="range" id="smoke" min="0" max="1.5" step="0.01"></label>
    <label>Boat traffic<input type="range" id="traffic" min="0" max="1" step="0.01"></label>
    <div class="row"><button id="ovl">Paths &amp; intent</button><button id="rum">Rumor map</button><button id="photo">Photo mode</button></div>
    <div class="row"><span style="color:var(--mut)">Seed</span><input id="seed" style="width:70px;background:#0006;color:var(--tx);border:1px solid var(--bd);border-radius:5px;padding:2px 5px" /><button id="reseed">New raid</button></div>
  </details>
  <div id="insp" class="pan"><span class="x" id="ix">✕</span><div id="ib"></div><div class="btns"><button id="ifollow">Follow</button><button id="ipath">Show path</button></div></div>
  <div id="log" class="pan"></div>
  <div id="busy" class="pan">re-living the evening…</div>
  <div id="hint">drag to orbit · right-drag to pan · scroll to zoom · click anyone to inspect · R resets the view · P photo mode</div>
  <div id="tl" class="pan">
    <div class="scr"><span class="nm">RAID ARC</span><div class="track" id="arcT"><div class="ahead" id="ahead"></div><input type="range" id="arc" min="0" max="${o.ARC_END}" step="1"></div><span class="val" id="arcV"></span></div>
    <div class="scr"><span class="nm">SETTLEMENT YEARS</span><div class="track"><input type="range" id="era" min="0" max="3" step="1"><div class="lbls"><span>Yr 1 · hide tents</span><span>Yr 14 · longhouses</span><span>Yr 31 · palisade &amp; docks</span><span>Yr 58 · jarl's seat</span></div></div><span class="val" id="eraV"></span></div>
    <div class="scr"><span class="nm">SUN</span><div class="track"><input type="range" id="sun" min="0" max="1" step="0.005"><div class="lbls"><span>Dawn fog</span><span>Clear noon</span><span>Golden hour</span><span>Dusk</span></div></div><span class="val" id="sunV"></span></div>
  </div>
  <button id="pexit">exit photo mode</button>`;
  const $ = (id) => document.getElementById(id);
  // camera chips
  const cams = $('cams');
  for (const n of ['⟲ Reset', ...o.presets]) {
    const b = document.createElement('button'); b.textContent = n; b.dataset.n = n;
    b.onclick = () => (n.startsWith('⟲') ? o.reset() : o.goPreset(n));
    cams.appendChild(b);
  }
  // speed
  const spd = $('spd');
  for (const [lbl, v] of [['❚❚', 0], ['1×', 1], ['4×', 4], ['16×', 16]]) { const b = document.createElement('button'); b.textContent = lbl; b.onclick = () => { P.speed = v; [...spd.children].forEach((c) => c.classList.toggle('on', c === b)); }; if (v === P.speed) b.classList.add('on'); spd.appendChild(b); }
  const bind = (id, key, after) => { const el = $(id); el.value = P[key]; el.oninput = () => { P[key] = parseFloat(el.value); after && after(); }; return el; };
  bind('sea', 'sea'); bind('wind', 'wind'); bind('wdir', 'windDir'); bind('tide', 'tide'); bind('season', 'season'); bind('dens', 'density'); bind('smoke', 'smoke'); bind('traffic', 'traffic');
  const heatEl = bind('heat', 'heat'); heatEl.onchange = () => o.invalidate();
  const eraEl = $('era'); eraEl.value = P.era; eraEl.oninput = () => { P.era = parseInt(eraEl.value, 10); };
  const sunEl = $('sun'); sunEl.value = P.sun; sunEl.oninput = () => { P.sun = parseFloat(sunEl.value); };
  const arcEl = $('arc'); let dragging = false;
  arcEl.addEventListener('pointerdown', () => (dragging = true)); addEventListener('pointerup', () => (dragging = false));
  arcEl.oninput = () => o.scrubTo(parseFloat(arcEl.value));
  $('ovl').onclick = (e) => { P.overlay = !P.overlay; e.target.classList.toggle('on', P.overlay); e.target.style.background = P.overlay ? 'var(--acc)' : ''; e.target.style.color = P.overlay ? '#1b140b' : ''; };
  $('rum').onclick = (e) => { P.rumor = !P.rumor; e.target.style.background = P.rumor ? 'var(--acc)' : ''; e.target.style.color = P.rumor ? '#1b140b' : ''; };
  const photo = (on) => { P.photo = on; document.body.classList.toggle('photo', on); ui.classList.toggle('photo', on); };
  $('photo').onclick = () => photo(true); $('pexit').onclick = () => photo(false);
  $('seed').value = P.seed; $('reseed').onclick = () => { const v = parseInt($('seed').value, 10); o.newSeed(v === P.seed || isNaN(v) ? Math.floor(Math.random() * 99999) : v); };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (e.key === 'r' || e.key === 'R') o.reset();
    if (e.key === 'p' || e.key === 'P') photo(!P.photo);
    if (e.key === 'Escape') { photo(false); showAgent(null); }
    if (e.key === ' ') { P.speed = P.speed ? 0 : 1; [...spd.children].forEach((c, i) => c.classList.toggle('on', [0, 1, 4, 16][i] === P.speed)); e.preventDefault(); }
  });
  // inspector
  let cur = null;
  const showAgent = (a) => { cur = a; $('insp').style.display = a ? 'block' : 'none'; if (!a) o.deselect(); else renderAgent(a); };
  $('ix').onclick = () => showAgent(null);
  $('ifollow').onclick = () => cur && o.followAgent(cur.id);
  $('ipath').onclick = (e) => { P.overlay = !P.overlay; $('ovl').style.background = P.overlay ? 'var(--acc)' : ''; };
  const moodWord = (a) => a.grief > 0.5 ? 'grieving' : a.drunk > 0.6 ? 'roaring drunk' : a.mood > 0.8 ? 'jubilant' : a.mood > 0.62 ? 'glad' : a.mood > 0.45 ? 'steady' : a.mood > 0.3 ? 'troubled' : 'bitter';
  const renderAgent = (a) => {
    const A = o.agents();
    const spouse = a.spouse >= 0 ? A[a.spouse] : null, rival = a.rival >= 0 ? A[a.rival] : null;
    const fate = a.fate === 'raider' ? 'home from the raid' : a.fate === 'wounded' ? (a.wounded ? 'home from the raid, wounded' : 'home from the raid, bandaged') : 'stayed at home';
    const bar = (n, v) => `<span class="r">${n}</span><span class="bar"><i style="width:${Math.round(v * 100)}%"></i></span>`;
    const kinDead = a.kin.filter((k) => !A[k].alive).map((k) => A[k].name);
    $('ib').innerHTML = `<h2>${a.name}</h2><div class="r">${o.roleLabel[a.role] || a.role} · age ${a.age} · ${fate}</div>
      <div class="r">${spouse ? (spouse.alive ? 'Spouse: ' : 'Widowed — ') + spouse.name : ''}${rival ? ' · Rival: ' + rival.name : ''}</div>
      ${kinDead.length ? `<div style="color:#9fc0ff">Lost on the raid: ${kinDead.join(', ')}</div>` : ''}
      <div class="bars">${bar('Mood', a.mood)}${bar('Hunger', a.hunger)}${bar('Warmth', a.warmth)}${bar('Exhaustion', a.fatigue)}${bar('Courage', a.courage)}${bar('Mead', a.drunk)}</div>
      <div>Feeling <b>${moodWord(a)}</b>${a.excited > 0 ? ' · <span style="color:var(--acc)">excited, spreading news</span>' : ''}</div>
      <div class="goal">▸ ${a.goalTxt || a.act}</div><div class="dest">${a.moving ? '→ heading to ' + (a.destTxt || 'somewhere') : a.aboard ? 'aboard ship' : 'at ' + (a.destTxt || 'rest')}</div>
      <div class="r" style="margin-top:6px">Remembers:</div><ul>${a.mem.slice().reverse().map((m) => `<li>${m}</li>`).join('')}</ul>`;
  };
  // ticking
  const phaseOf = (S) => {
    const sea = S.ships.filter((s) => s.state === 0).length, beached = S.ships.length - sea;
    const sleepF = S.stats.sleeping / Math.max(1, S.stats.total);
    if (sleepF > 0.88) return 'The village sleeps';
    if (sleepF > 0.45) return 'Torches gutter out; the village stumbles home';
    if (S.pyre.lit >= 0 && S.quiet > 0.6) return 'The pyre burns — the beach falls silent';
    if (S.pyre.lit >= 0) return 'After the fire: the feast stirs again, quieter';
    if (S.flags.feastActive >= 0) return S.ring.a >= 0 ? 'The feast roars — a wrestling ring has formed' : S.flags.skald >= 0 ? 'The feast — the skald sings the raid' : 'The feast is dragged out onto the sand';
    if (beached === 0) return S.stats.knowFleet > 40 ? 'Sails in the narrows — the village runs to the water' : 'A boy sights sails in the narrows';
    if (sea > 0) return `Keels grinding up the sand — ${beached} beached, ${sea} still coming in`;
    return 'The crews come ashore; plunder up the slipway';
  };
  const NOM = [['sails', 0, 'Sails'], ['beach', 190, 'Beaching'], ['procession', 520, 'Procession'], ['feast', 420, 'Feast'], ['ring', 700, 'Wrestling'], ['pyre', 1150, 'Pyre'], ['embers', 1500, 'Silence after'], ['asleep', 1900, 'Asleep']];
  const arcT = $('arcT'); const mkEls = {};
  for (const [k, t, lbl] of NOM) { const d = document.createElement('div'); d.className = 'mk'; d.textContent = lbl; arcT.appendChild(d); mkEls[k] = [d, t]; }
  let lastLog = -1;
  const ret = {
    setSun: (v) => { P.sun = v; sunEl.value = v; },
    setActiveCam: (n) => { [...cams.children].forEach((c) => c.classList.toggle('on', c.dataset.n === n)); },
    showAgent,
    tick: (S, info) => {
      if (!dragging) arcEl.value = S.t;
      $('arcV').textContent = o.clock(S.t) + (info.catching ? ' ⟳' : '');
      $('ahead').style.width = (info.ahead / o.ARC_END * 100) + '%';
      for (const k in mkEls) { const [d, t] = mkEls[k]; const tt = info.marks[k] ?? t; d.style.left = (tt / o.ARC_END * 100) + '%'; d.style.opacity = info.marks[k] !== undefined || k === 'sails' ? 1 : 0.45; }
      $('eraV').textContent = ['hide tents', 'longhouses', 'palisade', "jarl's seat"][P.era];
      $('sunV').textContent = P.sun < 0.17 ? 'dawn fog' : P.sun < 0.5 ? 'noon' : P.sun < 0.82 ? 'golden hour' : 'dusk';
      $('sub').textContent = `Seed ${S.seed} · the fleet returns from ${S.raidTarget}`;
      $('phase').textContent = phaseOf(S);
      const dead = S.agents.filter((a) => !a.alive).length, raiders = S.agents.filter((a) => a.ship >= 0).length;
      const st = S.stats;
      $('stats').innerHTML = `${S.ships.length} ships · ${raiders} sailed · <span style="color:#9fc0ff">${dead} did not return</span><br>${st.total} villagers · ${st.feasting || 0} feasting · ${st.ringWatch || 0} at the ring · ${st.dancing || 0} dancing<br>${st.mourning || 0} mourning · ${st.sleeping || 0} asleep · heat ${(S.heat * 100) | 0}% · ${info.rendered} drawn · ${info.fps.toFixed(0)} fps`;
      $('busy').style.display = info.catching ? 'block' : 'none';
      const lg = S.log; if (lg.length && lg[lg.length - 1].t !== lastLog) { lastLog = lg[lg.length - 1].t; $('log').innerHTML = lg.slice(-7).reverse().map((e) => `<div class="${e.kind}"><b>${o.clock(e.t)}</b>${e.msg}</div>`).join(''); }
      if (info.selected && cur) renderAgent(info.selected);
    },
  };
  return ret;
}
