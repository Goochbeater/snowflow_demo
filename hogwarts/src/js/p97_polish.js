/* ==== p97_polish.js ==== */
/* POLISH — from the outside review: a match that ends like one (FULL TIME on the board, the controls put away, the
   whistle's toast alone on screen), a status line that does not cry "loose Quaffle" during the flyover, and the first
   flight's controls hint put away when you land. */
{ const Q = HL.Q;
  const st0 = Q.status; Q.status = function () { if (Q.phase === 'intro' || Q.phase === 'count') return 'Brooms up…'; if (Q.phase === 'over') return '<b>FULL TIME</b>'; return st0.apply(this, arguments); };
  const end0 = Q.end; Q.end = function () { const was = Q.phase; const r = end0.apply(this, arguments); if (was !== 'over' && Q.phase === 'over') { const U = HL.ui; U.el.Hint.classList.remove('on'); U.hintT = 0; } return r; };
}
/* on glass the controls go away at the whistle */
{ const m0 = TOUCH.modeNow; TOUCH.modeNow = function () { if (typeof Locker !== 'undefined' && Locker.on && Locker.panel) return 'wait';   /* (a team talk is a conversation, not a cut-scene to skip) */
  const m = m0.apply(this, arguments); return m === 'match' && HL.Q.phase === 'over' ? 'wait' : m; }; }
/* the flight controls hint goes when you land (it used to linger over the castle for its full ten seconds) */
{ const h0 = HL.ui.hint; HL.ui.hint = function () { delete HL.ui.el.Hint.dataset.fly; return h0.apply(this, arguments); };
  const m0 = HL.ui.onMount; HL.ui.onMount = function (on) { const E = HL.ui.el.Hint, had = E.innerHTML; m0.apply(this, arguments); if (on && E.innerHTML !== had) { E.dataset.fly = '1';
      /* on a phone the first flight's lesson is one short line under the rider (two lines of six chips lay over the broom) */
      if (document.body.classList.contains('touch')) MG.after(0.12, () => { if (PLAYER.state !== 'fly' || !E.dataset.fly) return; HL.ui.hint('Push the stick to fly · <kbd>SHIFT</kbd> · <kbd>SPACE</kbd><kbd>C</kbd> climb and dive · steer where you look · <kbd>B</kbd> to land', 10); E.dataset.fly = '1'; }, true); }
    else if (!on && E.dataset.fly) { E.classList.remove('on'); HL.ui.hintT = 0; delete E.dataset.fly; } }; }
/* QUIT TO TITLE asks twice (it sat under the thumb and quit on one tap); the legal line and the build stamp keep out of the buttons' way */
{ const p0 = HL.ui.pause; HL.ui.pause = function () { p0.apply(this, arguments); if (MG.state !== 'pause') return; const b = HL.ui.el.Screen.querySelector('.hlBtn[data-a="t"]'); if (!b) return; const go = b.onclick, t0 = b.textContent;
  b.onclick = function (e) { if (!b.classList.contains('tcSure')) { b.classList.add('tcSure'); b.textContent = 'TAP AGAIN TO QUIT'; setTimeout(() => { if (b.isConnected) { b.classList.remove('tcSure'); b.textContent = t0; } }, 3000); return; } return go.call(this, e); }; }; }
{ const t0 = HL.ui.title; HL.ui.title = function () { t0.apply(this, arguments); const U = HL.ui, v = U.el.Screen.querySelector('.hlTitle .v'); if (v && !MG.flags.debug) v.style.display = 'none';
  /* nothing from the game left over the logo (a location card or a hint still running when you quit) */ U.el.Toast.classList.remove('on'); U.toastT = 0; U.el.Hint.classList.remove('on'); U.hintT = 0; }; }
/* the title: the logo and the menu down the left over a dark scrim, the castle standing in the right of the frame (the
   camera is aimed to its left, p77) — the logo sat on the spires and the buttons on the castle's walls */
{ const css = document.createElement('style'); css.textContent = `
html body .hlTitle { align-items: flex-start; justify-content: center; padding: 0 0 0 calc(max(5vw, 28px) + env(safe-area-inset-left)); background: linear-gradient(90deg, rgba(9,7,13,.86) 0%, rgba(9,7,13,.6) 28%, rgba(9,7,13,.18) 48%, rgba(9,7,13,0) 62%), linear-gradient(rgba(0,0,0,0) 72%, rgba(6,4,3,.5)); }
html body .hlTitle h1 { position: static; font-size: min(6.6vw, 14.5vh, 96px); letter-spacing: .16em; padding-left: 0; line-height: 1; margin: 0 0 0 -0.04em; }
html body .hlTitle h2 { position: static; font-size: min(1.45vw, 3vh, 17px); letter-spacing: .6em; padding-left: .08em; margin: .7em 0 1.5em; gap: 16px; }
html body .hlTitle h2:before { display: none; } html body .hlTitle h2:after { transform: none; margin-left: 0; width: min(7vw, 90px); background: linear-gradient(90deg, rgba(241,213,142,.9), transparent); }
html body .hlTitle .hlBtn { margin: 5px 0; min-width: 0; width: min(34vw, 340px); box-sizing: border-box; text-align: left; padding-left: 22px; padding-right: 12px; white-space: nowrap; font-size: min(17px, 4.2vh); letter-spacing: .28em; }
html body .hlTitle .hlBtn:hover, html body .hlTitle .hlBtn.sel { letter-spacing: .32em; }
html body .hlTitle .cr { left: calc(max(5vw, 28px) + env(safe-area-inset-left)); max-width: min(38vw, 420px); font-size: 10px; line-height: 1.35; opacity: .8; }
@media (max-height: 380px) { html body .hlTitle h2 { margin: .5em 0 1em; } html body .hlTitle .hlBtn { padding-top: 7px; padding-bottom: 7px; margin: 4px 0; } html body .hlTitle .cr { font-size: 9px; } }
/* a bout of Crossed Wands: the quest and its waypoint step aside; on a phone the bar hangs under your own vitals, not on them */
body.hlDuelOn #hlQuest, body.hlDuelOn #hlWay { opacity: 0 !important; transition: opacity .3s; }
body.touch #hlDuel { top: calc(46px + env(safe-area-inset-top)) !important; min-width: 250px !important; max-width: 46vw; padding: 5px 14px 7px !important; }
/* the pack on glass: one close (the round one every screen has), and nothing of the pack's under it */
html body.touch #invClose { display: none; } html body.touch .hlInv .box { padding-right: calc(58px + env(safe-area-inset-right)); }
@media (max-height: 380px) { html body #invStats .st { font-size: 10.5px; padding: .5px 1px; } html body #invStats .gap { height: 2px; } html body #invWho .lv b { font-size: 15px; } html body #invGold { padding-top: 3px; font-size: 13px; } }
/* the match setup (and the Sorting): what is chosen reads as chosen — gold-filled, the rest dimmed — the options fall in
   groups, and the one way forward is the gold button (thirteen equal outlined boxes read as a debug menu) */
.hlSort:has([data-go]) :is(.hlBtn[data-k], .hlBtn[data-w]) { opacity: .66; background: rgba(10,10,14,.5); border-color: rgba(217,184,106,.3); }
.hlSort:has([data-go]) :is(.hlBtn[data-k], .hlBtn[data-w]).sel { opacity: 1; background: linear-gradient(rgba(226,194,122,.34), rgba(226,194,122,.16)); border-color: #e8c97a; color: #fff6dc; box-shadow: inset 0 0 0 1px rgba(255,236,190,.3), 0 0 14px rgba(226,194,122,.18); }
.hlSort:has([data-go]) .hlBtn[data-k="role"][data-v="chaser"], .hlSort:has([data-go]) .hlBtn[data-k="len"][data-v="180"] { margin-left: 26px; }
.hlSort .hlBtn[data-go] { background: linear-gradient(#e6c780, #b48c3c); color: #1c1307; border-color: #f7dfa0; text-shadow: none; box-shadow: 0 2px 14px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,250,225,.6); }
.hlSort .hlBtn[data-go]:hover, .hlSort .hlBtn[data-go].sel { background: linear-gradient(#f2d692, #c49a46); color: #120c04; }
body.touch .hlSort:has([data-k]) > p:nth-last-of-type(2) { display: none; }   /* (the keyboard line) */
/* the career's team: a face on each card, the captain's armband, what the bar measures */
#scrCareer .mate { display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center; }
#scrCareer .mate svg.face { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.05); }
#scrCareer .mate .mt { min-width: 0; } #scrCareer .mate b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#scrCareer .mate em.cap { font-style: normal; font-size: 10px; letter-spacing: .06em; padding: 0 5px; border-radius: 4px; background: var(--gold, #e8b84a); color: #1c1307; vertical-align: 2px; }
#scrCareer .mate em.up { font-style: normal; color: #f08a6a; } #scrCareer .mate small { display: block; font-size: 10.5px; opacity: .6; margin-top: 3px; letter-spacing: .04em; }
/* the profile on a phone: everything, DONE included, without scrolling */
@media (max-height: 460px) {
  #scrCareer .panel.wide:has(.attrs) .lvl { margin-bottom: 4px; } #scrCareer .panel.wide:has(.attrs) .lvl span { font-size: 11px; }
  #scrCareer .attrs .attr { padding: 0 !important; gap: 6px; } #scrCareer .attrs .attr span { font-size: 12px; } #scrCareer .attrs .attr button { width: 26px !important; height: 26px !important; font-size: 15px; border-radius: 7px; }
  #scrCareer .persona { padding: 6px 10px; margin-bottom: 6px; } #scrCareer .persona > span { margin-bottom: 2px; } #scrCareer .pbar { margin-top: 2px; grid-template-columns: 20px 80px 1fr; gap: 6px; font-size: 11px; } #scrCareer .pbar .tone { width: 18px; height: 18px; }
  #scrCareer .panel.wide:has(.attrs) .stats { grid-template-columns: repeat(4, 1fr) !important; gap: 4px; } #scrCareer .panel.wide:has(.attrs) .stat { padding: 2px 7px !important; } #scrCareer .panel.wide:has(.attrs) .stat b { font-size: 15px; } #scrCareer .panel.wide:has(.attrs) .stat i { font-size: 9.5px; }
  #scrCareer .panel.wide:has(.attrs) .actions { margin-top: 6px; } }
/* the pause menu on a landscape phone: the controls down the left, the settings and the way out on the right, all of it
   on one screen (stacked, QUIT TO TITLE fell off the bottom of a 412-px screen) */
@media (max-height: 620px) and (min-width: 700px) {
  html body .hlPause { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1fr); grid-auto-flow: row dense; align-content: center; gap: 6px 10px; padding: calc(10px + env(safe-area-inset-top)) calc(4vw + env(safe-area-inset-right)) 10px calc(4vw + env(safe-area-inset-left)); overflow-y: auto; }
  html body .hlPause > h3 { grid-column: 1; grid-row: 1; text-align: left; margin: 0 0 2px; align-self: end; }
  html body .hlPause > .hlKeys { grid-column: 1; grid-row: 2 / span 7; align-self: start; justify-content: start; font-size: 11.5px; line-height: 1.32; gap: 1px 12px; margin: 0; }
  html body .hlPause > .tcSet { grid-column: 2 / span 2; flex-wrap: wrap; justify-content: flex-start; gap: 4px; margin: 0; }
  html body .hlPause > .tcSet .hlBtn { min-width: 0; padding: 5px 9px; font-size: 11px; margin: 0; } html body .hlPause > .tcSet .tcVal { min-width: 70px; font-size: 11.5px; }
  html body .hlPause > .hlBtn { grid-column: auto; max-width: none; width: auto; margin: 0; padding: 7px 8px; font-size: 12px; letter-spacing: .16em; }
  html body .hlPause > .hlBtn[data-a="r"], html body .hlPause > .hlBtn[data-a="t"] { grid-column: 2 / span 2; max-width: none; } }
/* on a phone the objective is two lines at most over the view (the whole of it is in the journal) */
body.touch #hlQuest .o { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; }
/* the map's card fits a phone's height without scrolling */
@media (max-height: 620px) { html body .hlMap.mm .card { padding: 8px 11px; } html body .hlMap.mm .card h3 { font-size: 19px !important; margin: 0 0 2px; } html body .hlMap.mm .card p { font-size: 11.5px; margin: 1px 0 3px; line-height: 1.25; } html body .hlMap.mm .card .lg { font-size: 11px; margin: 1px 0; } html body .hlMap.mm .card b { margin-top: 3px; } html body .hlMap.mm .card p.how { font-size: 11.5px !important; line-height: 1.3; opacity: .85; } }`;
  document.head.appendChild(css); }
/* a match opens like a broadcast: through the flyover a lower third names the two sides with their crests, the competition
   and the ground, and your job in it (the castle's title card said the same in the middle of the sky); then the count is
   called in big numerals in the middle of the screen */
{ const Q = HL.Q, U = HL.ui; let lt = null;
  const css = document.createElement('style'); css.textContent = `
#qcLT { position: absolute; left: calc(4vw + env(safe-area-inset-left)); bottom: calc(9vh + env(safe-area-inset-bottom)); z-index: 16; pointer-events: none; font-family: 'HLB', Georgia, serif; color: #f1e6ca; opacity: 0; transform: translateX(-24px); transition: opacity .45s, transform .55s cubic-bezier(.2,.8,.2,1); }
#qcLT.on { opacity: 1; transform: none; }
#qcLT .bd { display: flex; align-items: center; gap: 14px; padding: 10px 18px 10px 12px; background: linear-gradient(90deg, rgba(10,8,6,.92), rgba(18,13,8,.86) 70%, rgba(18,13,8,0)); border-left: 3px solid #d9b86a; }
#qcLT .cr { width: 44px; height: 54px; flex: none; display: grid; place-items: center; } #qcLT .cr img, #qcLT .cr svg { width: 100%; height: 100%; object-fit: contain; }
#qcLT .tn b { display: block; font-family: 'HLA', Georgia, serif; font-size: 22px; letter-spacing: .1em; line-height: 1; color: var(--c, #f1e6ca); }
#qcLT .tn span { display: block; font-size: 12px; letter-spacing: .08em; opacity: .75; margin-top: 3px; }
#qcLT .vs { font-family: 'HLA', Georgia, serif; font-size: 15px; letter-spacing: .2em; opacity: .7; }
#qcLT .meta { margin: 6px 0 0 15px; font-size: 12.5px; letter-spacing: .14em; text-transform: uppercase; color: #d9b86a; }
#qcLT .role { margin: 3px 0 0 15px; font-size: 14px; font-style: italic; opacity: .92; max-width: 60vw; }
@media (max-height: 420px) { #qcLT { bottom: calc(5vh + env(safe-area-inset-bottom)); } #qcLT .cr { width: 34px; height: 42px; } #qcLT .tn b { font-size: 17px; } #qcLT .role { font-size: 12.5px; } #qcLT .meta { font-size: 11px; } }
body.qcount #hlPop { top: 34% !important; font-family: 'HLA', Georgia, serif; font-size: min(18vh, 96px) !important; letter-spacing: .06em; color: #fff3c4; text-shadow: 0 0 22px rgba(255,200,90,.75), 0 4px 18px #000; }`;
  HL.START.push(() => { if (!css.isConnected) document.head.appendChild(css); });
  const side = (k) => { const M = QC.match, i = M ? (k ? M.opp : M.mine) : null, hk = Q.teams && Q.teams[k], H = HL.HOUSES[hk] || {};
    if (M && i != null) { const T = CONFIG.teams[i] || {}; return { crest: `<img alt="" src="${Tex.crestURL[i]}">`, name: (T.kind === 'house' ? T.name : (teamName(i).split(' ').pop())).toUpperCase(), sub: T.kind === 'house' ? 'Hogwarts' : T.kind === 'nation' ? 'National side' : (T.city || T.home || teamName(i)), col: T.ui || T.c1 || H.css }; }
    return { crest: HL.ui.crest ? HL.ui.crest(hk) : '', name: (H.name || '').toUpperCase(), sub: 'Hogwarts', col: H.css }; };
  const show = () => { if (!lt) { lt = document.createElement('div'); lt.id = 'qcLT'; (HL.ui.root || document.body).appendChild(lt); }
    const A = side(0), B = side(1), M = QC.match, comp = M && M.ev ? M.ev.label : M && M.drill ? (M.drill.lesson ? 'First flying lesson' : 'Training') : Q.opt && Q.opt.tut ? 'Flying lesson' : 'House match';
    const ground = M && Career.S && Career.S.phase !== 'school' ? (M.ev && M.ev.home === false ? side(1).sub : side(0).sub) + ' · the stadium' : 'The Hogwarts Quidditch Pitch';
    const role = Q.me && Q.me.role === 'seeker' ? 'You fly Seeker · find the Golden Snitch and close your hand on it' : 'You fly Chaser · take the Quaffle through the far hoops, ten points a goal';
    lt.innerHTML = `<div class="bd"><div class="cr">${A.crest}</div><div class="tn" style="--c:${A.col}"><b>${A.name}</b><span>${A.sub}</span></div><div class="vs">V</div><div class="tn" style="--c:${B.col}"><b>${B.name}</b><span>${B.sub}</span></div><div class="cr">${B.crest}</div></div><div class="meta">${comp} · ${ground}</div><div class="role">${role}</div>`;
    U.el.Toast.classList.remove('on'); U.toastT = 0; requestAnimationFrame(() => lt.classList.add('on')); };
  const i0 = Q.intro; Q.intro = function () { const r = i0.apply(this, arguments); try { show(); } catch (e) { console.warn('lower third', e); } return r; };
  const u0 = U.update; U.update = function () { const r = u0.apply(this, arguments); const ph = Q.on ? Q.phase : '';
    if (lt && lt.classList.contains('on') && ph !== 'intro') lt.classList.remove('on'); document.body.classList.toggle('qcount', ph === 'count'); return r; };
}
/* one voice at a time: a hint that only repeats the errand the tracker already shows is not shown (the same sentence sat top-left and bottom-centre) */
{ const h0 = HL.ui.hint, words = (t) => (t || '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  HL.ui.hint = function (html) { try { const q = HL.ui.el.Quest, o = q && q.style.display !== 'none' && q.querySelector('.o'); if (o && html) { const a = new Set(words(o.textContent)), b = words(html); if (a.size >= 5 && b.length && b.filter((w) => a.has(w)).length / b.length > 0.6) return; } } catch (e) { /* */ } return h0.apply(this, arguments); }; }
/* the career is scored: its scenes and screens had no music and no room tone at all (the castle's score only knew the open game) */
HL.musicHook = function (st, m) {
  if (typeof QC === 'undefined' || !QC.active || (HL.Q && HL.Q.on)) return undefined;
  if (typeof Locker !== 'undefined' && Locker.on) return 'mus_match';
  if (st !== 'scene' || typeof Scenes === 'undefined' || !Scenes.set) return st === 'scene' ? 'mus_title' : undefined;
  const S = Scenes.set, v = S.variant || '', live = typeof Script !== 'undefined' && Script.beats; let n = null;
  if (S.tables) n = /yule|gala|christmas|feast|halloween|sorting/.test(v) ? 'mus_feast' : 'mus_hall';
  else if (S.boat) n = 'mus_title'; else if (S.quill || S.anchors && S.anchors.lockMe) n = 'mus_match'; else if (S.anchors && S.anchors.streetMe) n = 'mus_village';
  else if (S.anchors && S.anchors.pitchMe) n = live ? 'mus_match' : 'mus_castle2'; else n = live ? 'mus_hall' : 'mus_castle';
  return HL.AU && HL.AU.has(n) ? n : 'mus_castle'; };
HL.bedHook = function (st) {
  const A = HL.AU; if (!A || typeof QC === 'undefined' || !QC.active || (HL.Q && HL.Q.on)) return false;
  if (typeof Locker !== 'undefined' && Locker.on) { A.bed('crowd_loop', 0.32); A.bed('amb_out', 0.35); return false; }
  if (st !== 'scene' || typeof Scenes === 'undefined' || !Scenes.set) return false; const S = Scenes.set;
  if (S.tables) A.bed('amb_hall', 0.6); else if (S.boat) A.bed('amb_lake', 0.7); else if (S.quill || (S.anchors && (S.anchors.lockMe || S.anchors.pitchMe))) { A.bed('crowd_loop', S.quill ? 0.2 : 0.35); A.bed('amb_out', 0.4); }
  else if (S.anchors && S.anchors.streetMe) { A.bed('amb_village', 0.55); A.bed('amb_out', 0.3); } else if (S.anchors && S.anchors.chairL) A.bed('amb_fire', 0.65); else A.bed('amb_hall', 0.35);
  return true; };
/* the Hat calls the house in its own voice */
{ const n0 = Script.next; Script.next = function () { const r = n0.apply(this, arguments); try { const b = this.beats && this.beats[this.i - 1]; if (b && b.say && b.say[0] === 'hat' && /better be/i.test(b.say[1]) && HL.AU && Career.S) { const k = QC.key(Career.S.profile.house); if (HL.AU.has('hat_' + k)) HL.AU.play('hat_' + k, { vol: 0.9, vary: false }); } } catch (e) { /* */ } return r; }; }
