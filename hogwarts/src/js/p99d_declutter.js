/* ==== p99d_declutter.js ==== */
/* DECLUTTER — on a phone the view comes first. What stays on screen is what you act on; the rest appears when it
   changes or when it matters:
   - house points and galleons show for four seconds when they change (and in the pack and the pause), not always;
   - the vitals are the crest and the bars (the house's name over them said what the crest says);
   - the Wiggenweld button shows when you carry one and are hurt or fighting (it sat greyed in the top bar all game);
   - Lumos is a petal of the spell wheel (p99_round4), so the right-hand column is the broom and Revelio;
   - the errand at the top left is the way into the journal (tap it), so the top bar is the pack, the map and the menu. */
{ const css = document.createElement('style'); css.textContent = `
body.touch #hlPts, body.touch #hlGold { transition: opacity .5s; }
body.touch:not(.hlStatOn) #hlPts, body.touch:not(.hlStatOn) #hlGold { opacity: 0 !important; pointer-events: none; }
body.touch #hlVit .nm { display: none; } body.touch #hlVit .bars { padding-top: 8px; }
body.touch #hlFly { width: 170px; bottom: calc(6px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: auto auto; justify-content: center; align-items: baseline; column-gap: 12px; }
body.touch #hlFly.on { opacity: .88; } body.touch #hlFly .sp { order: 1; font-size: 15px; } body.touch #hlFly .sp small { font-size: 10.5px; letter-spacing: .14em; margin-left: 3px; }
body.touch #hlFly .al { order: 2; margin: 0; font-size: 10.5px; letter-spacing: .12em; } body.touch #hlFly u { order: 3; grid-column: 1 / -1; height: 2px; border: 0; margin-top: 3px; background: rgba(0,0,0,.45); }`;   /* (the flight gauge one small line at the foot: speed · height, the boost under it) */
  { const c4 = document.createElement('style'); c4.textContent = `body.touch #hlToast { padding: 10px 34px 12px; } body.touch #hlToast .a { font-size: 17px; } body.touch #hlToast .b { font-size: 12.5px; } body.touch #hlToast hr { width: 160px; }
@media (max-height: 380px) { body.touch #hlToast .a { font-size: 15px; } body.touch #hlToast .b { font-size: 11.5px; } }`; document.head.appendChild(c4); }   /* (a notice is a banner, not a headline) */
  document.head.appendChild(css);
  let pts = null, gold = null, statT = 0, warm = 0;
  const u0 = HL.ui.update; HL.ui.update = function (dt) { const r = u0.apply(this, arguments); if (!TOUCH.on) return r;
    const p = HL.save ? HL.save.points || 0 : 0, g = typeof LOOTH !== 'undefined' ? LOOTH.gold : 0;
    if (MG.state === 'play') warm += dt || 0;   /* (the purse and the points filling in as a game loads are not news) */
    if (pts !== null && warm > 2 && (p !== pts || g !== gold)) statT = 4; pts = p; gold = g; statT = Math.max(0, statT - (dt || 0));
    const on = statT > 0; if (on !== document.body.classList.contains('hlStatOn')) document.body.classList.toggle('hlStatOn', on); return r; };
  HL.START.push(() => { warm = 0; pts = null; });
  { let pl = null; const L0 = HL.ui.update; HL.ui.update = function () { const r = L0.apply(this, arguments), on = MG.state === 'play'; if (on !== pl) { pl = on; document.body.classList.toggle('hlPlaying', on); } return r; }; }
  const f0 = TOUCH.frame; TOUCH.frame = function () { const r = f0.apply(this, arguments); const B = TOUCH.btn.potion; if (!B || (TOUCH.editor && TOUCH.editor.on)) return r;
    if (TOUCH.mode === 'match') { const sk = !!(HL.Q.me && HL.Q.me.role === 'seeker'), P2 = TOUCH.btn.pass; if (P2 && P2.classList.contains('on') === sk) P2.classList.toggle('on', !sk); }   /* (a Seeker has no Quaffle to pass or call for: the button did nothing) */
    { const fg = TOUCH.mode === 'foot' && !!(TOUCH.wheel && TOUCH.wheel.fight); if (fg !== document.body.classList.contains('tcFight')) document.body.classList.toggle('tcFight', fg); }
    if (TOUCH.mode === 'foot') { const a = PLAYER.a, pots = typeof LOOTH !== 'undefined' && LOOTH.pots ? LOOTH.pots.wiggen || 0 : 0, hurt = a && a.hpMax && a.hp < a.hpMax * 0.9, fight = TOUCH.wheel && TOUCH.wheel.fight;
      const want = pots > 0 && !!(hurt || fight); if (want !== B.classList.contains('on')) B.classList.toggle('on', want); }
    return r; };
  /* the journal's door is the errand itself: the top bar closes up (the pack takes the journal's place, the potion the pack's) */
  const css2 = document.createElement('style'); css2.textContent = `
#tc .tcB[data-id="journal"] { display: none !important; }
body.touch #hlQuest { cursor: pointer; } body.touch #hlQuest .n::after { content: ''; display: inline-block; width: .42em; height: .42em; margin: 0 0 .12em .45em; border-right: 1.5px solid #e8c56e; border-bottom: 1.5px solid #e8c56e; transform: rotate(-45deg); opacity: .85; }`;
  document.head.appendChild(css2);
  (TOUCH.baseFix = TOUCH.baseFix || []).push(() => { const B = TOUCH.btn; if (!B.journal) return; const jx = B.journal.style.left, bx = B.bag.style.left; B.bag.style.left = jx; B.potion.style.left = bx; });
  const journal = () => { TOUCH.key('KeyJ', true); setTimeout(() => TOUCH.key('KeyJ', false), 70); TOUCH.buzz(5); };
  HL.START.push(() => { const Q = HL.ui.el && HL.ui.el.Quest; if (!Q || Q._jr) return; Q._jr = true;
    Q.addEventListener('click', (e) => { if (!TOUCH.on || MG.state !== 'play') return; e.stopImmediatePropagation(); journal(); }, true); });
  /* (the errand sits in the stick's half of the screen, under the touch layer: a touch that lands on it is a tap on it, not the stick) */
  const hitQ = (x, y) => { const Q = HL.ui.el && HL.ui.el.Quest; if (!Q || MG.state !== 'play' || !(TOUCH.mode === 'foot' || TOUCH.mode === 'fly') || getComputedStyle(Q).display === 'none' || +getComputedStyle(Q).opacity < 0.3) return false;   /* (hidden in a duel: a tap there is a look) */ const r = Q.getBoundingClientRect(); return r.width > 0 && x >= r.left && x <= r.right + 6 && y >= r.top && y <= r.bottom + 6; };
  const zd0 = TOUCH.zoneDown; TOUCH.zoneDown = function (e) { if (hitQ(e.clientX, e.clientY)) { TOUCH.look[e.pointerId] = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0 }; return; } return zd0.apply(this, arguments); };
  const tp0 = TOUCH.tap; TOUCH.tap = function (x, y) { if (hitQ(x, y)) { journal(); return; } return tp0.apply(this, arguments); };
  /* the words that named the journal's button name the errand instead */
  const fx0 = TOUCH.fixEl; TOUCH.fixEl = function (el) { if (TOUCH.on && el && el.nodeType === 1 && el.querySelectorAll) for (const k of el.querySelectorAll('kbd:not(.tk)')) { if (k.textContent.trim() !== 'J') continue; const nx = k.nextSibling, pv = k.previousSibling;
      if (pv && pv.nodeType === 3 && /\($/.test(pv.textContent) && nx && nx.nodeType === 3 && /^\)/.test(nx.textContent)) k.replaceWith('tap your errand, top left');
      else if (nx && nx.nodeType === 3 && /^\s*opens your quest journal/.test(nx.textContent)) { k.replaceWith('Your errand, top left,'); } }
    return fx0.apply(this, arguments); };
  /* the pause on a phone: RESUME and a short rail of tabs on the left, one section at a time on the right (it was a cheat
     sheet, a wrapping row of settings and eight buttons on one screen, with the HUD showing through on the cover) */
  { let tab = 'controls'; const css3 = document.createElement('style'); css3.textContent = `
body.touch #hlScreen .hlPause.pz { display: grid !important; grid-template-columns: minmax(170px, 230px) minmax(0, 520px); justify-content: center; align-content: center; gap: 0 26px; padding: max(14px, env(safe-area-inset-top)) max(4vw, 18px) 14px; background: rgba(4,3,6,.95); }
body.touch:has(#hlScreen .hlPause) #hlHud { visibility: hidden; }
.pz > * { text-align: left !important; flex-basis: auto !important; } .pz .pzL { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pz .pzL h3 { margin: 0 0 8px !important; text-align: left; font-size: 20px; letter-spacing: .5em; }
.pz .pzL .hlBtn { margin: 0 !important; width: 100%; max-width: none; min-width: 0; box-sizing: border-box; text-align: left; padding: 9px 14px; font-size: 12.5px; letter-spacing: .2em; }
.pz .pzL .nav.on { background: rgba(240,207,124,.13); border-color: #f0cf7c; color: #fff3d0; } .pz .pzL .hlBtn[data-a="t"] { margin-top: 6px !important; opacity: .8; }
.pz .pzR { border-left: 1px solid rgba(240,207,124,.2); padding-left: 24px; display: flex; flex-direction: column; justify-content: center; min-height: 200px; min-width: 0; }
.pz .sec { display: none; } .pz .sec.on { display: grid; gap: 10px; align-content: center; }
.pz .row { display: grid; grid-template-columns: minmax(7.5em, 10em) minmax(0, 1fr); align-items: center; gap: 12px; } .pz .row > span { font: 400 11.5px 'HLA', Georgia, serif; letter-spacing: .16em; color: #cbbf9f; }
.pz .ctl { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; } .pz .ctl .hlBtn, .pz .grid2 .hlBtn, .pz .col .hlBtn { margin: 0 !important; min-width: 0; max-width: none; padding: 9px 14px; font-size: 12px; letter-spacing: .14em; }
.pz .ctl output { min-width: 3.4em; text-align: center; font: 400 13px 'HLA', Georgia, serif; color: #f0cf7c; } .pz .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .pz .col { display: grid; gap: 8px; }
.pz .sec[data-pz="help"] .hlKeys { margin: 0; font-size: 12px; line-height: 1.35; gap: 3px 14px; max-height: 70vh; overflow-y: auto; }
@media (max-height: 380px) { body.touch #hlScreen .hlPause.pz { padding-top: 8px; padding-bottom: 8px; } .pz .pzL { gap: 4px; } .pz .pzL .hlBtn { padding: 7px 12px; } .pz .pzL h3 { font-size: 17px; margin-bottom: 4px !important; } .pz .sec.on { gap: 7px; } .pz .ctl .hlBtn, .pz .grid2 .hlBtn, .pz .col .hlBtn { padding: 7px 12px; } }`;
    document.head.appendChild(css3);
    const restructure = () => { const box = HL.ui.el.Screen.querySelector('.hlPause'); if (!box || box.classList.contains('pz')) return;
      const q = (sel) => box.querySelector(':scope > ' + sel), byText = (re) => [...box.querySelectorAll(':scope > .hlBtn')].find((b) => re.test(b.textContent));
      const h3 = q('h3'), keys = q('.hlKeys'), set = q('.tcSet'), resume = q('.hlBtn[data-a="r"]'), quit = q('.hlBtn[data-a="t"]'); if (!resume || !set) return;
      const snd = [q('.hlBtn[data-snd]'), byText(/^MUSIC/), byText(/^SOUND EFFECTS/), byText(/^VOICES/)], game = [q('.hlBtn[data-a="q"]'), q('.hlBtn[data-a="h"]')];
      const mk = (cls) => { const d = document.createElement('div'); d.className = cls; return d; }, L = mk('pzL'), Rr = mk('pzR');
      const show = (k) => { tab = k; for (const n of L.querySelectorAll('.nav')) n.classList.toggle('on', n.dataset.pz === k); for (const x of Rr.querySelectorAll('.sec')) x.classList.toggle('on', x.dataset.pz === k); };
      const nav = (k, label) => { const b = mk('hlBtn nav'); b.dataset.pz = k; b.textContent = label; b.onclick = (e) => { e.stopPropagation(); show(k); }; return b; };
      const sec = (k) => { const x = mk('sec'); x.dataset.pz = k; Rr.appendChild(x); return x; };
      const row = (x, label, els) => { const d = mk('row'), sp = document.createElement('span'), w = mk('ctl'); sp.textContent = label; for (const e of els) if (e) w.appendChild(e); d.append(sp, w); x.appendChild(d); };
      const K = [...set.children], kid = (t) => K.find((k) => k.dataset && k.dataset.t === t), out = K.find((k) => k.tagName === 'OUTPUT');
      const sc = sec('controls'), lm = kid('s-'), lp = kid('s+'), sz = kid('z'), hz = kid('h'), lay = kid('lay');
      if (lm) lm.textContent = '−'; if (lp) lp.textContent = '+'; if (out) out.textContent = out.textContent.replace(/^LOOK\s*/, '');
      if (sz) sz.textContent = sz.textContent.replace(/^BUTTONS\s*·\s*/, ''); if (hz) hz.textContent = hz.textContent.replace(/^BUZZ\s*·\s*/, ''); if (lay) lay.textContent = 'CUSTOMISE';
      row(sc, 'LOOK SPEED', [lm, out, lp]); row(sc, 'BUTTON SIZE', [sz]); row(sc, 'VIBRATION', [hz]); row(sc, 'LAYOUT', [lay]); set.remove();
      const ss = sec('sound'), g2 = mk('grid2'); for (const b of snd) if (b) g2.appendChild(b); ss.appendChild(g2);
      const sg = sec('game'), c2 = mk('col'); for (const b of game) if (b) c2.appendChild(b); sg.appendChild(c2);
      const sh = sec('help'); if (keys) sh.appendChild(keys);
      for (const x of [...box.children]) if (x !== h3 && x !== resume && x !== quit) c2.appendChild(x);   // (anything else a module put on the pause goes with the game's settings)
      L.append(...[h3, resume, nav('controls', 'CONTROLS'), nav('sound', 'SOUND'), nav('game', 'GAME'), nav('help', 'HOW TO PLAY'), quit].filter(Boolean));
      box.append(L, Rr); box.classList.add('pz'); show(tab); };
    const pz1 = HL.ui.pause; HL.ui.pause = function () { const r = pz1.apply(this, arguments); if (TOUCH.on && MG.state === 'pause') try { restructure(); } catch (e) { console.warn('pause layout', e); } return r; }; }
  /* the duel: once its line has been read the bar is the opponent's name and health, slim (it kept its title over the foe's
     head), and the targeting nameplate over the foe goes while the bar says the same */
  if (HL.duel) { const D = HL.duel, c5 = document.createElement('style'); c5.textContent = `
body.touch #hlDuel.slim { min-width: 200px !important; padding: 4px 12px 6px !important; } body.touch #hlDuel.slim > div:first-child { display: none; }
body.touch #hlDuel.slim > div { margin-top: 2px !important; font-size: 12.5px !important; } body.touch.hlDuelOn #hlTgt { display: none !important; }
body.touch.hlDuelOn #tc .tcB:is([data-id="jump"], [data-id="broom"], [data-id="revelio"]) { display: none !important; }
body:not(.hlPlaying) #hlDuel { visibility: hidden; }
body.touch.tcFight #tc .tcB:is([data-id="broom"], [data-id="revelio"]) { display: none !important; }   /* (with a foe at hand, no broom and nothing to reveal: two fewer targets in a fight) */   /* (the bar is the fight's: it stood over the map) */   /* (in the ring: no broom, nothing hidden to reveal, nothing to jump) */`;
    document.head.appendChild(c5);
    HL.START.push(() => { if (!D.show || D.show._slim) return; const s0 = D.show;   /* (the bar's show is made when the level starts) */
      D.show = function () { const r = s0.apply(this, arguments), el = document.getElementById('hlDuel'); if (el) el.classList.toggle('slim', D.phase === 'fight' && MG.rt >= (D.lineT || 0)); return r; }; D.show._slim = true; }); }
  /* the match setup on a phone: each setting a label and its choices, on an aligned two-column grid over a dark panel (they
     flowed two to a wrapped line with their labels ragged and RIVALS clipped at the edge); the keyboard line goes */
  { const c6 = document.createElement('style'); c6.textContent = `
body.touch #hlScreen:has(.hlSort.qs) { background: radial-gradient(ellipse at 50% 58%, rgba(8,6,10,.88), rgba(8,6,10,.7) 62%, rgba(8,6,10,.5)); } body.touch .hlSort.qs { padding-bottom: calc(10px + env(safe-area-inset-bottom)); }
body.touch .hlSort.qs .hlH { height: min(30vh, 260px) !important; }
body.touch .hlSort.qs .qgrid { display: grid; grid-template-columns: auto auto; gap: 7px 26px; justify-content: center; margin: 10px 0 12px; }
body.touch .hlSort.qs .qg { display: flex; align-items: center; gap: 6px; } body.touch .hlSort.qs .qg .rl { margin: 0 4px 0 0 !important; width: 6.2em; text-align: right; flex: none; font: 400 11px 'HLA', Georgia, serif; letter-spacing: .14em; color: #c9b27a; opacity: .85; white-space: nowrap; }
body.touch .hlSort.qs .qg .hlBtn { margin: 0; padding: 7px 12px; font-size: 12px; min-width: 0; }
body.touch .hlSort.qs > p:last-child { display: none; } body.touch .hlSort.qs .hlRow:empty { display: none; }
@media (max-height: 380px) { body.touch .hlSort.qs .qgrid { gap: 5px 18px; margin: 6px 0 8px; } body.touch .hlSort.qs .qg .hlBtn { padding: 5px 10px; font-size: 11.5px; } body.touch .hlSort.qs > p { display: none; } }`;
    document.head.appendChild(c6);
    const tidy = (S) => { const box = S.querySelector('.hlSort'); if (!box || box.classList.contains('qs')) return; const rows = [...box.querySelectorAll(':scope > .hlRow')].filter((r) => r.querySelector('.rl')); if (!rows.length) return;
      const grid = document.createElement('div'); grid.className = 'qgrid';
      for (const r of rows) { let g = null; for (const c of [...r.childNodes]) { if (c.nodeType === 1 && c.classList.contains('rl')) { g = document.createElement('div'); g.className = 'qg'; grid.appendChild(g); } if (g) g.appendChild(c); } }
      rows[0].before(grid); for (const r of rows) r.remove(); box.classList.add('qs'); };
    const sc0 = HL.ui.screen; HL.ui.screen = function (html) { const S = sc0.apply(this, arguments); if (TOUCH.on && html && S && S.querySelector('.hlSort [data-go]') && S.querySelector('.hlSort .rl')) try { tidy(S); } catch (e) { console.warn('setup layout', e); } return S; }; }
  /* the pack on a phone: the statistics are the ones that say something (health, and any your things raise: eleven rows of
     "+0%" were most of the left column), the house name fits its column, the hint is one line */
  if (typeof LOOTH !== 'undefined' && LOOTH.render) { const c7 = document.createElement('style'); c7.textContent = `
body.touch #invWho .lv b { font-size: min(26px, 2.6vw) !important; white-space: nowrap; } body.touch #invStats .st.z { display: none; } body.touch #invStats .gap:has(+ .gap), body.touch #invStats .gap:last-child { display: none; }
body.touch .hlInv .islot .lab { font-size: 9.5px; letter-spacing: .06em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }`;
    document.head.appendChild(c7);
    const r0 = LOOTH.render; LOOTH.render = function () { const r = r0.apply(this, arguments); if (!TOUCH.on) return r; const S = HL.ui.el.Screen;
      S.querySelectorAll('#invStats .st').forEach((d, i) => { const v = (d.querySelector('b') || {}).textContent || ''; if (i > 0 && /^[+−-]?0(%| \/s)$/.test(v.trim())) d.classList.add('z'); });
      const st = S.querySelector('#invStats'); if (st) { let prev = true; for (const c of [...st.children]) { const gap = c.classList.contains('gap'), shown = !c.classList.contains('z'); if (gap) { c.style.display = prev ? 'none' : ''; prev = true; } else if (shown) prev = false; } }
      const h = S.querySelector('.hlInv .hint'); if (h) h.innerHTML = '<b>Tap</b> to wear or take off · <b>hold</b> to sell · tap a potion to drink'; return r; }; }
  /* the map on a phone: the card is your errand and what you have found; the legend and the how-to were a third of the screen */
  { const c8 = document.createElement('style'); c8.textContent = `body.touch .hlMap .card .lg, body.touch .hlMap .card .how { display: none; } body.touch .hlMap .card b:has(+ .lg), body.touch .hlMap .card b:has(+ .how) { display: none; }`; document.head.appendChild(c8); }
  /* the match on a phone: the line under the score says what is happening, in a few words (the buttons already say what
     to press: "— LMB shoot (hold to wind up) · E pass" doubled them, and the keys were left as letters); and while the
     opening controls line is up, it is the only line under the score */
  { const Q = HL.Q, st1 = Q.status; Q.status = function () { const s0 = st1.apply(this, arguments); if (!TOUCH.on || typeof s0 !== 'string') return s0;
      if (Q.me && Q.me.role === 'seeker') return s0.replace(/ — stay on its tail/, ' ·');
      const B = Q.ball, me = Q.me; if (Q.on && Q.phase === 'play' && B) { const snitch = Q.snitch ? '<b>SNITCH LOOSE</b> · ' : '';
        if (B.holder === me) return snitch + 'You have the Quaffle'; if (B.holder && B.holder.team === 0) return snitch + 'Your Chaser has it — CALL for it'; if (B.holder) return snitch + 'Rivals have it — TACKLE the carrier'; return snitch + 'Loose Quaffle — fly at it'; }
      return s0; };
    const c9 = document.createElement('style'); c9.textContent = `body.touch.tq:has(#hlHint.on) #hlQs { visibility: hidden; }`; document.head.appendChild(c9); }
}

