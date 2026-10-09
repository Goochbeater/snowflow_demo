/* ==== p93_mobile.js ==== */
/* MOBILE — the interface fitted to a phone held sideways (the Fold's cover screen is 882 × 344 CSS pixels, a Pixel
   9a 923 × 411, the Fold opened 1104 × 882): the HUD packed into the corners the thumbs leave free, every screen
   (title, Sorting, pause, journal, letter, pack, map, Quidditch) laid out to fit a short screen and scroll where it
   must. Applies to short screens whether or not they are touch; the touch layer adds its own room for the buttons. */
HL.START.push(function () {
  if (document.getElementById('hlMobCss')) return;
  const st = document.createElement('style'); st.id = 'hlMobCss'; st.textContent = `
/* ---------------- the HUD, with buttons under both thumbs */
body.touch #hlQuest { padding: calc(8px + env(safe-area-inset-top)) 18px 14px calc(12px + env(safe-area-inset-left)); width: min(42vw, 380px); background: radial-gradient(ellipse at 0% 0%, rgba(8,6,10,0.6), rgba(8,6,10,0.25) 50%, rgba(8,6,10,0) 75%); }
body.touch #hlQuest .t { font-size: 10.5px; letter-spacing: 0.16em; } body.touch #hlQuest .n { font-size: 15px; margin: 1px 0 2px; } body.touch #hlQuest .o { font-size: 12.5px; line-height: 1.25; padding-left: 13px; } body.touch #hlQuest .o:before { top: 5px; width: 5px; height: 5px; }
body.touch #hlVit { left: 50%; bottom: auto; top: calc(6px + env(safe-area-inset-top)); width: 230px; transform: translateX(-50%); }
body.touch #hlVit .crest { width: 26px; height: 30px; bottom: auto; top: 0; } body.touch #hlVit .bars { margin-left: 34px; } body.touch #hlVit .nm { font-size: 10.5px; margin-bottom: 3px; letter-spacing: 0.12em; }
body.touch #hlHp { height: 8px; } body.touch #hlAm { height: 4px; margin-top: 4px; } body.touch #hlVit .am { display: none; }
body.touch #hlPts { right: max(226px, calc(230px * var(--tu, 1))); top: calc(6px + env(safe-area-inset-top)); } body.touch #hlPts .t { font-size: 10px; letter-spacing: 0.12em; } body.touch #hlPts .n { font-size: 17px; }
body.touch #hlGold { right: max(226px, calc(230px * var(--tu, 1))); top: calc(40px + env(safe-area-inset-top)); font-size: 12px; }
body.touch #hlPot { display: none; }
body.touch #hlHint { bottom: calc(8px + env(safe-area-inset-bottom)); left: 47%; font-size: 12.5px; padding: 6px 14px; max-width: 44vw; width: max-content; line-height: 1.35; }
body.touch #hlPrompt { top: 58%; font-size: 14px; padding: 5px 14px; }
body.touch #hlToast { top: 13%; padding: 12px 40px 14px; max-width: 70vw; } body.touch #hlToast .a { font-size: 20px; letter-spacing: 0.16em; } body.touch #hlToast .b { font-size: 13px; } body.touch #hlToast hr { width: 200px; margin: 4px auto; }
body.touch #hlPop { top: 30%; font-size: 15px; } body.touch #hlName { bottom: 30%; font-size: 15px; }
body.touch[data-tm="fly"] #hlHint { bottom: calc(92px + env(safe-area-inset-bottom)); max-width: 50vw; }
/* in a match the hint reads under the scoreboard, clear of your rider; the knots readout gives way to the House Spirit bar */
body.touch.tq #hlHint { top: calc(66px + env(safe-area-inset-top)); bottom: auto; max-width: 54vw; } body.touch.tq #hlFly { display: none; }
body.touch #hlFly { bottom: calc(8px + env(safe-area-inset-bottom)); width: 190px; } body.touch #hlFly .sp { font-size: 20px; } body.touch #hlFly .al { font-size: 10px; margin-top: 3px; letter-spacing: .1em; }
body.touch #hlSay { bottom: calc(10px + env(safe-area-inset-bottom)); width: min(560px, 48vw); left: 47%; padding: 8px 16px 10px; pointer-events: none; }
body.touch #hlSay .nm { font-size: 10px; } body.touch #hlSay .tx { font-size: 14px; min-height: 38px; margin-top: 4px; } body.touch #hlSay .more { font-size: 10px; }
body.touch #hlItem { top: 30%; left: 12px; width: 240px; transform: scale(0.82); transform-origin: 0 50%; }
body.touch #hlQ { top: calc(4px + env(safe-area-inset-top)); } body.touch #hlQ .sb { padding: 3px 12px; gap: 9px; } body.touch #hlQ .sc { font-size: 24px; min-width: 38px; } body.touch #hlQ .cl { font-size: 11px; } body.touch #hlQ .tm { font-size: 11px; } body.touch #hlQ .st { font-size: 11px; margin-top: 3px; }
body.touch #hlTgt span { font-size: 11px; }
body.touch #hlQtut { top: calc(4px + env(safe-area-inset-top)) !important; max-width: 62vw !important; padding: 6px 14px 8px !important; transform: translateX(-50%) scale(0.86) !important; transform-origin: 50% 0 !important; } body.touch .hlDmg { font-size: 16px; }
/* ---------------- screens on a short display */
@media (max-height: 620px) {
  body .hlBtn { font-size: 15px; padding: 8px 24px; margin: 4px; min-width: 230px; letter-spacing: 0.26em; }
  body .hlBtn:hover, body .hlBtn.sel { letter-spacing: 0.3em; }
  body .hlTitle { padding-bottom: 5vh; } body .hlTitle h1 { font-size: min(8vw, 17vh); top: 2.5vh; } body .hlTitle h2 { font-size: min(1.7vw, 3.2vh); top: calc(2.5vh + min(9vw, 19vh)); }
  body .hlTitle .hlBtn { min-width: 272px; box-sizing: border-box; }
  body .hlTitle .cr { font-size: 10px; line-height: 1.3; max-width: calc(50vw - 172px); bottom: 6px; } body .hlTitle .v { font-size: 9px; bottom: 6px; }
  body .hlSort { overflow-y: auto; justify-content: safe center; padding: 8px 0 12px; } body .hlSort p { max-width: 86vw; text-align: center; }
  body .hlSort h3 { font-size: 19px; } body .hlSort p { font-size: 13px; margin: 0 0 10px; }
  body .hlHouses { gap: 10px; } body .hlH { height: min(50vh, 300px); width: min(19vw, 190px); } body .hlH .tr { font-size: 10px; margin-top: 4px; padding: 0 4px; line-height: 1.25; } body .hlH svg { width: 54%; margin-top: 9%; } body .hlH .nm { font-size: min(1.8vw, 16px); }
  body .hlRow { margin-top: 10px; gap: 6px; flex-wrap: wrap; justify-content: center; } body .hlRow .hlBtn { min-width: 110px; font-size: 12px; padding: 7px 14px; }
  body .hlPause { flex-flow: row wrap; justify-content: center; align-content: safe center; overflow-y: auto; padding: 10px 4vw 14px; gap: 0 6px;  background: rgba(4,3,6,0.88); backdrop-filter: blur(3px); } body .hlPause h3 { font-size: 20px; margin: 0 0 6px; }
  body .hlPause > :not(.hlBtn) { flex-basis: 100%; text-align: center; } body .hlPause > .hlKeys { display: grid; justify-content: center; text-align: left; } body .hlPause > .hlRow { display: flex; }
  body .hlPause > .hlBtn { min-width: 0; flex: 0 1 40vw; max-width: 340px; font-size: 13px; padding: 8px 10px; }
  body .hlKeys { font-size: 12.5px; gap: 3px 18px; margin: 2px 0 10px; }
  body .hlJ .book { height: 92vh; width: 96vw; } body .hlJ .pg { padding: 14px 18px 26px; } body .hlJ h1 { font-size: 20px; } body .hlJ .rule { margin: 3px 20px 6px; }
  body .hlJ .list { height: calc(100% - 58px); } body .hlJ .it { font-size: 14px; padding: 4px 6px; } body .hlJ .sec { font-size: 10px; margin: 8px 0 4px; }
  body .hlJ h2 { font-size: 19px; } body .hlJ .by { font-size: 12.5px; } body .hlJ .desc { font-size: 13.5px; line-height: 1.36; margin: 6px 2px; } body .hlJ .desc:first-letter { font-size: 30px; }
  body .hlJ .ob { font-size: 13px; padding: 2px 0 2px 22px; } body .hlJ .rw { font-size: 12.5px; margin-top: 6px; } body .hlJ .foot { font-size: 9px; bottom: 6px; } body .hlJ .pg.r { overflow-y: auto; }
  body .hlJ .letter { max-height: 94vh; overflow-y: auto; padding: 18px 26px 30px; font-size: 14.5px; line-height: 1.4; width: min(620px, 80vw); }
  body .hlJ .letter .crest { font-size: 18px; } body .hlJ .letter .crest span { font-size: 12px; } body .hlJ .letter p { margin: 0 0 8px; } body .hlJ .letter p.sig i { font-size: 20px; } body .hlJ .letter .seal { width: 52px; height: 52px; font-size: 21px; right: 26px; bottom: 30px; }
  /* the pack: the whole screen, three columns sized to it, the bag scrolling if it must */
  body .hlInv .box { zoom: 1 !important; width: 100vw; height: 100vh; grid-template-columns: minmax(150px, 24%) auto minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 0 12px; padding: calc(8px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) 8px calc(14px + env(safe-area-inset-left)); animation: none; box-shadow: none; border: 0; }
  body .hlInv .cn, body .hlInv .box:before { display: none; } body .hlInv .hd { padding: 0 0 4px; } body .hlInv .hd h2 { font-size: 15px; } body .hlInv .hd .fl { flex-basis: 90px; } body #invClose { top: 6px; right: 60px; font-size: 10px; padding: 3px 8px; }
  body .hlInv .sh { font-size: 10px; letter-spacing: .14em; padding-bottom: 3px; margin-bottom: 5px; } body .hlInv .ccol, body .hlInv .dcol, body .hlInv .rcol { min-height: 0; overflow-y: auto; }
  body #invWho { padding: 0 0 4px; } body #invWho .lv { font-size: 9px; } body #invWho .lv b { font-size: 17px; } body #invWho .xp { height: 5px; margin: 4px 6px 2px; } body #invWho .xpn { font-size: 10px; }
  body #invStats .st { font-size: 11px; padding: 1.5px 1px; } body #invStats .st b { font-size: 11px; } body #invStats .gap { height: 4px; } body #invGold { font-size: 14px; padding-top: 6px; } body #invGold:before { width: 14px; height: 14px; }
  body #invDoll { grid-template-columns: min(48px, 11vh) min(118px, 27vh) min(48px, 11vh); grid-template-rows: repeat(5, min(48px, 11vh)); gap: 6px 8px; } body #invDoll .stage:after { font-size: 9px; }
  body #invBag { grid-template-columns: repeat(6, minmax(0, 52px)); gap: 4px; } body .islot .lab { font-size: 9px; } body .hlInv .hint { font-size: 10px; padding-top: 6px; line-height: 1.35; }
  /* the map: the sheet as tall as the screen, the storeys and the card beside it smaller */
  body .hlMap.mm .view { height: 96vh; max-width: 58vw; } body .hlMap.mm .tabs3 { gap: 4px; margin-right: 10px; } body .hlMap.mm .tab3 { font-size: 12.5px !important; padding: 4px 18px 4px 8px !important; } body .hlMap.mm .tab3 small { font-size: 9.5px !important; }
  body .hlMap.mm .card { width: 190px; margin-left: 10px; padding: 10px 12px; max-height: 94vh; overflow-y: auto; box-sizing: border-box; } body .hlMap.mm .card h3 { font-size: 21px !important; margin: 0 0 4px; } body .hlMap.mm .card b { font-size: 11px !important; } body .hlMap.mm .card p { font-size: 12px; } body .hlMap.mm .card .lg { font-size: 11.5px; margin: 3px 0; gap: 6px; }
  body #hlTip { width: 250px; font-size: 12.5px; } body #hlTip .th { padding: 8px 64px 8px 11px; min-height: 52px; } body #hlTip .ti { width: 54px; height: 54px; } body #hlTip .tn { font-size: 15px; } body #hlTip .tt { font-size: 11.5px; } body #hlTip .tbd { padding: 6px 11px 8px; }
}
/* ---------------- the Fold's cover screen (344 px tall): the hint wider and smaller so it takes fewer lines of the view */
@media (max-height: 380px) {
  body.touch #hlHint { font-size: 11px; max-width: 58vw; padding: 4px 12px; line-height: 1.3; }
  body.touch[data-tm="fly"] #hlHint { bottom: calc(80px + env(safe-area-inset-bottom)); max-width: 58vw; }
  body.touch #hlQuest { width: min(38vw, 340px); } body.touch #hlQuest .o { font-size: 11.5px; } body.touch #hlQuest .n { font-size: 14px; }
  body .hlPause { padding: 4px 3vw 6px; } body .hlPause h3 { font-size: 16px; margin: 0 0 2px; }
  body .hlPause .hlKeys { font-size: 10.5px; gap: 0 14px; margin: 0 0 3px; line-height: 1.22; }
  body .hlPause > .hlBtn { padding: 5px 8px; font-size: 12px; margin: 3px; } body .hlPause .hlRow { margin-top: 1px; } body .hlPause .hlRow .hlBtn { padding: 4px 10px; font-size: 11px; margin: 2px; }
  body.touch.tq #hlHint { top: calc(56px + env(safe-area-inset-top)); max-width: 62vw; }
  body.touch #hlToast { top: 9%; padding: 8px 30px 10px; } body.touch #hlToast .a { font-size: 17px; } body.touch #hlToast .b { font-size: 12px; }
}
/* ---------------- the touch layer's own adjustments */
/* the pause menu in the order a player reaches for it: RESUME first and gold; the four sound switches together; settings; QUIT last and quiet */
@media (max-height: 620px) {
  body .hlPause > h3 { order: -4; } body .hlPause > .hlKeys { order: -3; } body .hlPause > .tcSet { order: -2; }
  body .hlPause > .hlBtn[data-a="r"] { order: -1; flex: 0 1 82vw; max-width: 690px; background: linear-gradient(180deg, #f0d48a, #b98a3a); color: #1c1206; border-color: #fff1c4; }
  body .hlPause > .hlBtn[data-snd] { order: 1; flex: 0 1 19.5vw; max-width: 170px; font-size: 11px; letter-spacing: .14em; padding-left: 4px; padding-right: 4px; }
  body .hlPause > .hlBtn[data-a="q"], body .hlPause > .hlBtn[data-a="h"] { order: 2; }
  body .hlPause > .hlBtn[data-a="t"] { order: 3; flex: 0 1 82vw; max-width: 690px; background: none; border-color: rgba(214,170,74,.22); opacity: .82; }
}
#hlToast .b { text-wrap: balance; } body:has(#hlToast.on) #hlQuest { opacity: .55; transition: opacity .3s; }
body.touch .hlBark { font-size: 12.5px !important; max-width: 220px !important; padding: 4px 10px 5px !important; }
/* full-screen screens (map, journal, pack) hide the HUD behind them; the storey tabs keep to one line */
body:has(#hlScreen .hlMap, #hlScreen .hlJ, #hlScreen .hlInv) :is(#hlQuest, #hlVit, #hlPts, #hlGold, #hlHint, #hlSay) { visibility: hidden; }
body .hlMap.mm .tab3 { white-space: nowrap; }
/* career scenes on a phone: subtitles, not a dialogue box over the speakers' chests (the box stays for choices) */
@media (max-height: 620px) { body.touch #dlg .lb { height: 4vh; }
  body.touch .dlgBox { left: 6vw; right: auto; width: 58vw; bottom: calc(4vh + 4px); transform: translateY(6px); padding: 18px 14px 8px; background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.66) 34%); border: 0; box-shadow: none; }
  body.touch .dlgBox.on { transform: none; } body.touch .dlgBox .dlgWho { font-size: 12px; } body.touch .dlgBox .dlgText { font-size: 15px; min-height: 0; text-shadow: 0 1px 4px #000, 0 0 2px #000; }
  body.touch .dlgChoices { bottom: calc(4vh + 6px); } }
body.touch .dlgSkip, body.touch[data-tm="cine"] #skip { display: none !important; }   /* one SKIP on glass: the round one */
body.touch .tcSet .tcVal { display: inline-flex; align-items: center; justify-content: center; min-width: 96px; padding: 0 6px; font: 13px 'HLA', Georgia, serif; letter-spacing: .12em; color: #e8d7a8; }
body.touch .hlBtn.tcSure { border-color: #e06a4e; color: #ffb4a0; }
body.touch .hlJ .foot:last-child, body.touch .hlTitle .v { opacity: 0.6; }
body.touch .hlSlot.tcSel { border-color: #fff3c4; box-shadow: 0 0 12px rgba(255,230,160,0.6); }
body.touch .tcKeys { max-width: 92vw; }
body.touch .tcSet .hlBtn { min-width: 90px; }
`;
  document.head.appendChild(st);
});
