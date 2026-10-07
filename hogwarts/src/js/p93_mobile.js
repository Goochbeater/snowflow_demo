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
body.touch #hlQuest .t { font-size: 9px; letter-spacing: 0.26em; } body.touch #hlQuest .n { font-size: 15px; margin: 1px 0 2px; } body.touch #hlQuest .o { font-size: 12.5px; line-height: 1.25; padding-left: 13px; } body.touch #hlQuest .o:before { top: 5px; width: 5px; height: 5px; }
body.touch #hlVit { left: 50%; bottom: auto; top: calc(6px + env(safe-area-inset-top)); width: 230px; transform: translateX(-50%); }
body.touch #hlVit .crest { width: 26px; height: 30px; bottom: auto; top: 0; } body.touch #hlVit .bars { margin-left: 34px; } body.touch #hlVit .nm { font-size: 9px; margin-bottom: 3px; letter-spacing: 0.2em; }
body.touch #hlHp { height: 8px; } body.touch #hlAm { height: 4px; margin-top: 4px; } body.touch #hlVit .am { display: none; }
body.touch #hlPts { right: calc(176px * var(--tu, 1)); top: calc(6px + env(safe-area-inset-top)); } body.touch #hlPts .t { font-size: 8px; letter-spacing: 0.22em; } body.touch #hlPts .n { font-size: 17px; }
body.touch #hlGold { right: calc(176px * var(--tu, 1)); top: calc(40px + env(safe-area-inset-top)); font-size: 12px; }
body.touch #hlPot { display: none; }
body.touch #hlHint { bottom: calc(8px + env(safe-area-inset-bottom)); left: 47%; font-size: 12.5px; padding: 6px 14px; max-width: 44vw; width: max-content; line-height: 1.35; }
body.touch #hlPrompt { top: 58%; font-size: 14px; padding: 5px 14px; }
body.touch #hlToast { top: 13%; padding: 12px 40px 14px; max-width: 70vw; } body.touch #hlToast .a { font-size: 20px; letter-spacing: 0.16em; } body.touch #hlToast .b { font-size: 13px; } body.touch #hlToast hr { width: 200px; margin: 4px auto; }
body.touch #hlPop { top: 30%; font-size: 15px; } body.touch #hlName { bottom: 30%; font-size: 15px; }
body.touch[data-tm="fly"] #hlHint, body.touch[data-tm="match"] #hlHint { bottom: calc(92px + env(safe-area-inset-bottom)); max-width: 50vw; }
body.touch #hlFly { bottom: calc(8px + env(safe-area-inset-bottom)); width: 190px; } body.touch #hlFly .sp { font-size: 20px; } body.touch #hlFly .al { font-size: 9px; margin-top: 3px; }
body.touch #hlSay { bottom: calc(10px + env(safe-area-inset-bottom)); width: min(560px, 48vw); left: 47%; padding: 8px 16px 10px; pointer-events: none; }
body.touch #hlSay .nm { font-size: 10px; } body.touch #hlSay .tx { font-size: 14px; min-height: 38px; margin-top: 4px; } body.touch #hlSay .more { font-size: 8px; }
body.touch #hlItem { top: 30%; left: 12px; width: 240px; transform: scale(0.82); transform-origin: 0 50%; }
body.touch #hlQ { top: calc(4px + env(safe-area-inset-top)); } body.touch #hlQ .sb { padding: 3px 12px; gap: 9px; } body.touch #hlQ .sc { font-size: 24px; min-width: 38px; } body.touch #hlQ .cl { font-size: 11px; } body.touch #hlQ .tm { font-size: 11px; } body.touch #hlQ .st { font-size: 11px; margin-top: 3px; }
body.touch #hlTgt span { font-size: 11px; }
body.touch #hlQtut { top: calc(4px + env(safe-area-inset-top)) !important; max-width: 62vw !important; padding: 6px 14px 8px !important; transform: translateX(-50%) scale(0.86) !important; transform-origin: 50% 0 !important; } body.touch .hlDmg { font-size: 16px; }
/* ---------------- screens on a short display */
@media (max-height: 620px) {
  .hlBtn { font-size: 15px; padding: 8px 24px; margin: 4px; min-width: 230px; letter-spacing: 0.26em; }
  .hlBtn:hover, .hlBtn.sel { letter-spacing: 0.3em; }
  .hlTitle { padding-bottom: 5vh; } .hlTitle h1 { font-size: min(8vw, 17vh); top: 2.5vh; } .hlTitle h2 { font-size: min(1.7vw, 3.2vh); top: calc(2.5vh + min(9vw, 19vh)); }
  .hlTitle .hlBtn { min-width: 272px; box-sizing: border-box; }
  .hlTitle .cr { font-size: 9px; max-width: 40vw; bottom: 6px; } .hlTitle .v { font-size: 9px; bottom: 6px; }
  .hlSort { overflow-y: auto; justify-content: safe center; padding: 8px 0 12px; } .hlSort p { max-width: 86vw; text-align: center; }
  .hlSort h3 { font-size: 19px; } .hlSort p { font-size: 13px; margin: 0 0 10px; }
  .hlHouses { gap: 10px; } .hlH { height: min(50vh, 300px); width: min(19vw, 190px); } .hlH .tr { font-size: 10px; margin-top: 4px; padding: 0 4px; line-height: 1.25; } .hlH svg { width: 54%; margin-top: 9%; } .hlH .nm { font-size: min(1.8vw, 16px); }
  .hlRow { margin-top: 10px; gap: 6px; flex-wrap: wrap; justify-content: center; } .hlRow .hlBtn { min-width: 110px; font-size: 12px; padding: 7px 14px; }
  .hlPause { flex-flow: row wrap; justify-content: center; align-content: safe center; overflow-y: auto; padding: 10px 4vw 14px; gap: 0 6px; } .hlPause h3 { font-size: 20px; margin: 0 0 6px; }
  .hlPause > :not(.hlBtn) { flex-basis: 100%; text-align: center; } .hlPause > .hlKeys { display: grid; justify-content: center; text-align: left; } .hlPause > .hlRow { display: flex; }
  .hlPause > .hlBtn { min-width: 0; flex: 0 1 40vw; max-width: 340px; font-size: 13px; padding: 8px 10px; }
  .hlKeys { font-size: 12.5px; gap: 3px 18px; margin: 2px 0 10px; }
  .hlJ .book { height: 92vh; width: 96vw; } .hlJ .pg { padding: 14px 18px 26px; } .hlJ h1 { font-size: 20px; } .hlJ .rule { margin: 3px 20px 6px; }
  .hlJ .list { height: calc(100% - 58px); } .hlJ .it { font-size: 14px; padding: 4px 6px; } .hlJ .sec { font-size: 10px; margin: 8px 0 4px; }
  .hlJ h2 { font-size: 19px; } .hlJ .by { font-size: 12.5px; } .hlJ .desc { font-size: 13.5px; line-height: 1.36; margin: 6px 2px; } .hlJ .desc:first-letter { font-size: 30px; }
  .hlJ .ob { font-size: 13px; padding: 2px 0 2px 22px; } .hlJ .rw { font-size: 12.5px; margin-top: 6px; } .hlJ .foot { font-size: 9px; bottom: 6px; } .hlJ .pg.r { overflow-y: auto; }
  .hlJ .letter { max-height: 94vh; overflow-y: auto; padding: 18px 26px 30px; font-size: 14.5px; line-height: 1.4; width: min(620px, 80vw); }
  .hlJ .letter .crest { font-size: 18px; } .hlJ .letter .crest span { font-size: 12px; } .hlJ .letter p { margin: 0 0 8px; } .hlJ .letter p.sig i { font-size: 20px; } .hlJ .letter .seal { width: 52px; height: 52px; font-size: 21px; right: 26px; bottom: 30px; }
  /* the pack: the whole screen, three columns sized to it, the bag scrolling if it must */
  .hlInv .box { width: 100vw; height: 100vh; grid-template-columns: minmax(150px, 24%) auto minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 0 12px; padding: calc(8px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) 8px calc(14px + env(safe-area-inset-left)); animation: none; box-shadow: none; border: 0; }
  .hlInv .cn, .hlInv .box:before { display: none; } .hlInv .hd { padding: 0 0 4px; } .hlInv .hd h2 { font-size: 15px; } .hlInv .hd .fl { flex-basis: 90px; } #invClose { top: 6px; right: 60px; font-size: 10px; padding: 3px 8px; }
  .hlInv .sh { font-size: 8.5px; letter-spacing: .22em; padding-bottom: 3px; margin-bottom: 5px; } .hlInv .ccol, .hlInv .dcol, .hlInv .rcol { min-height: 0; overflow-y: auto; }
  #invWho { padding: 0 0 4px; } #invWho .lv { font-size: 9px; } #invWho .lv b { font-size: 17px; } #invWho .xp { height: 5px; margin: 4px 6px 2px; } #invWho .xpn { font-size: 10px; }
  #invStats .st { font-size: 11px; padding: 1.5px 1px; } #invStats .st b { font-size: 11px; } #invStats .gap { height: 4px; } #invGold { font-size: 14px; padding-top: 6px; } #invGold:before { width: 14px; height: 14px; }
  #invDoll { grid-template-columns: min(48px, 11vh) min(118px, 27vh) min(48px, 11vh); grid-template-rows: repeat(5, min(48px, 11vh)); gap: 6px 8px; } #invDoll .stage:after { font-size: 9px; }
  #invBag { grid-template-columns: repeat(6, minmax(0, 52px)); gap: 4px; } .islot .lab { font-size: 7px; } .hlInv .hint { font-size: 10px; padding-top: 6px; line-height: 1.35; }
  /* the map: the sheet as tall as the screen, the storeys and the card beside it smaller */
  .hlMap.mm .view { height: 96vh; max-width: 58vw; } .hlMap.mm .tabs3 { gap: 4px; margin-right: 10px; } .hlMap.mm .tab3 { font-size: 12.5px !important; padding: 4px 18px 4px 8px !important; } .hlMap.mm .tab3 small { font-size: 9.5px !important; }
  .hlMap.mm .card { width: 190px; margin-left: 10px; padding: 10px 12px; max-height: 94vh; overflow-y: auto; box-sizing: border-box; } .hlMap.mm .card h3 { font-size: 21px !important; margin: 0 0 4px; } .hlMap.mm .card b { font-size: 11px !important; } .hlMap.mm .card p { font-size: 12px; } .hlMap.mm .card .lg { font-size: 11.5px; margin: 3px 0; gap: 6px; }
  #hlTip { width: 250px; font-size: 12.5px; } #hlTip .th { padding: 8px 64px 8px 11px; min-height: 52px; } #hlTip .ti { width: 54px; height: 54px; } #hlTip .tn { font-size: 15px; } #hlTip .tt { font-size: 11.5px; } #hlTip .tbd { padding: 6px 11px 8px; }
}
/* ---------------- the touch layer's own adjustments */
body.touch .hlJ .foot:last-child, body.touch .hlTitle .v { opacity: 0.6; }
body.touch .hlSlot.tcSel { border-color: #fff3c4; box-shadow: 0 0 12px rgba(255,230,160,0.6); }
body.touch .tcKeys { max-width: 92vw; }
body.touch .tcSet .hlBtn { min-width: 90px; }
`;
  document.head.appendChild(st);
});
