/* ==== p77_hl_ui.js ==== */
/* HOGWARTS — the interface: title, the Sorting (choose a house, witch or wizard), the HUD (health, Ancient Magic,
   the spell diamonds with cooldowns, reticle and target plate, quest tracker and waypoint, flight gauges, prompts),
   floating damage, toasts, and the pause menu. All DOM, built here. */
HL.ui = { el: {}, dmgs: [], last: {}, hintT: 0, toastT: 0, popT: 0, nameT: 0, wardT: 0 };
HL.ui.css = function () { return `
@font-face { font-family: 'HLA'; src: url(data:font/woff2;base64,${HL.FONT_A}) format('woff2'); font-weight: 400 900; }
@font-face { font-family: 'HLB'; src: url(data:font/woff2;base64,${HL.FONT_B}) format('woff2'); font-weight: 400 800; }
#hud, #menus { display: none !important; }
#hl { position: absolute; inset: 0; pointer-events: none; font-family: 'HLB', Georgia, serif; color: #efe6d2; user-select: none; overflow: hidden; --gold: #d9b86a; --hc: #b22222; --hc2: #e2b23a; }
#hl * { box-sizing: border-box; }
#hl .f { font-family: 'HLA', 'Trajan Pro', Georgia, serif; letter-spacing: 0.14em; }
#hlHud { position: absolute; inset: 0; opacity: 0; transition: opacity 0.6s; } #hlHud.on { opacity: 1; }
#hlRet { position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; margin: -13px 0 0 -13px; transition: transform 0.12s; }
#hlRet i { position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -2.5px; background: #fff; transform: rotate(45deg); box-shadow: 0 0 6px rgba(0,0,0,0.9); opacity: 0.9; }
#hlRet b { position: absolute; inset: 0; border: 1.5px solid rgba(255,255,255,0.0); transform: rotate(45deg) scale(0.6); transition: all 0.15s; }
#hlRet.t b { border-color: var(--gold); transform: rotate(45deg) scale(1); box-shadow: 0 0 10px rgba(217,184,106,0.6); }
#hlRet.fly i { width: 3px; height: 3px; margin: -1.5px; opacity: 0.5; }
#hlTgt { position: absolute; width: 150px; margin-left: -75px; text-align: center; opacity: 0; transition: opacity 0.2s; } #hlTgt.on { opacity: 1; }
#hlTgt span { font-size: 13px; letter-spacing: 0.12em; text-shadow: 0 1px 3px #000; } #hlTgt u { display: block; height: 5px; margin-top: 3px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.25); }
#hlTgt u i { display: block; height: 100%; background: linear-gradient(#e0483a, #9a1c14); } #hlTgt em { display: block; font-style: normal; font-size: 11px; margin-top: 3px; color: #ffd98a; letter-spacing: 0.1em; text-shadow: 0 1px 3px #000; min-height: 13px; }
#hlVit { position: absolute; left: 34px; bottom: 30px; width: 300px; }
#hlVit .crest { position: absolute; left: 0; bottom: 0; width: 58px; height: 66px; } #hlVit .bars { margin-left: 70px; }
#hlHp { height: 12px; background: rgba(8,8,10,0.66); border: 1px solid rgba(239,230,210,0.35); position: relative; transform: skewX(-18deg); }
#hlHp i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(#63d06a, #2c8a3a); transition: width 0.15s; } #hlHp s { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,255,255,0.5); }
#hlAm { height: 6px; margin-top: 6px; width: 70%; background: rgba(8,8,10,0.66); border: 1px solid rgba(239,230,210,0.25); transform: skewX(-18deg); } #hlAm i { display: block; height: 100%; background: linear-gradient(90deg, #3a8cff, #bfe6ff); box-shadow: 0 0 8px #58aaff; }
#hlAm.full i { animation: hlpulse 0.9s infinite alternate; } @keyframes hlpulse { from { filter: brightness(1); } to { filter: brightness(1.7); } }
#hlVit .nm { font-size: 12px; letter-spacing: 0.22em; margin-bottom: 5px; color: #d8cfba; text-shadow: 0 1px 3px #000; } #hlVit .am { font-size: 10px; letter-spacing: 0.16em; margin-top: 4px; color: #9fc8ff; text-shadow: 0 1px 3px #000; opacity: 0.85; }
#hlBar { position: absolute; right: 34px; bottom: 28px; display: grid; grid-template-columns: repeat(4, 58px); gap: 8px 6px; }
.hlS { width: 54px; height: 54px; position: relative; transform: rotate(45deg) scale(0.86); background: rgba(10,10,14,0.72); border: 1.5px solid rgba(239,230,210,0.4); box-shadow: 0 2px 10px rgba(0,0,0,0.5); transition: transform 0.12s, border-color 0.2s; }
.hlS > * { position: absolute; } .hlS svg { inset: 9px; width: 34px; height: 34px; transform: rotate(-45deg); }
.hlS .cd { inset: 0; background: rgba(0,0,0,0.72); transform-origin: bottom; } .hlS .k { transform: rotate(-45deg); left: -5px; top: -5px; font-size: 12px; font-family: 'HLA', serif; color: #fff; text-shadow: 0 1px 3px #000; }
.hlS .n { transform: rotate(-45deg); right: -2px; bottom: -2px; font-size: 13px; font-family: 'HLA', serif; color: #fff; text-shadow: 0 1px 3px #000; }
.hlS.rdy { border-color: var(--c); } .hlS.go { transform: rotate(45deg) scale(1.05); border-color: #fff; } .hlS.no { animation: hlno 0.25s; } @keyframes hlno { 30% { transform: rotate(45deg) scale(0.8) translateX(3px); } 60% { transform: rotate(45deg) scale(0.8) translateX(-3px); } }
#hlBarT { position: absolute; right: 34px; bottom: 162px; width: 250px; text-align: right; font-size: 11px; letter-spacing: 0.2em; color: #cfc6b0; text-shadow: 0 1px 3px #000; }
#hlQuest { position: absolute; left: 0; top: 0; width: 470px; padding: 26px 40px 30px 34px; text-shadow: 0 1px 3px #000, 0 0 10px rgba(0,0,0,0.85); background: radial-gradient(ellipse at 0% 0%, rgba(8,6,10,0.62), rgba(8,6,10,0.3) 45%, rgba(8,6,10,0) 72%); } #hlQuest .t { font-size: 12px; letter-spacing: 0.3em; color: var(--gold); } #hlQuest .n { font-size: 21px; margin: 2px 0 4px; letter-spacing: 0.08em; }
#hlQuest .o { font-size: 16px; color: #e6dcc6; padding-left: 16px; position: relative; line-height: 1.3; } #hlQuest .o:before { content: ''; position: absolute; left: 1px; top: 7px; width: 7px; height: 7px; border: 1px solid var(--gold); transform: rotate(45deg); }
#hlWay { position: absolute; width: 0; height: 0; opacity: 0; } #hlWay.on { opacity: 1; } #hlWay i { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; border: 2px solid var(--gold); transform: rotate(45deg); background: rgba(217,184,106,0.25); box-shadow: 0 0 12px rgba(217,184,106,0.7); }
#hlWay span { position: absolute; left: -40px; width: 80px; top: 16px; text-align: center; font-size: 12px; letter-spacing: 0.1em; text-shadow: 0 1px 3px #000; }
#hlPts { position: absolute; right: 34px; top: 30px; text-align: right; text-shadow: 0 1px 4px #000; } #hlPts .t { font-size: 11px; letter-spacing: 0.3em; color: #cfc6b0; } #hlPts .n { font-size: 26px; color: var(--gold); }
#hlPrompt { position: absolute; left: 50%; top: 62%; transform: translateX(-50%); font-size: 17px; letter-spacing: 0.06em; padding: 7px 18px; background: rgba(8,8,12,0.62); border: 1px solid rgba(217,184,106,0.5); opacity: 0; transition: opacity 0.2s; white-space: nowrap; } #hlPrompt.on { opacity: 1; }
#hl kbd { font-family: 'HLA', serif; font-size: 0.82em; border: 1px solid rgba(239,230,210,0.7); border-radius: 3px; padding: 1px 6px; margin: 0 3px; background: rgba(255,255,255,0.08); }
#hlHint { position: absolute; left: 50%; bottom: 118px; transform: translateX(-50%); font-size: 16px; padding: 8px 20px; background: rgba(8,8,12,0.55); border-top: 1px solid rgba(217,184,106,0.4); border-bottom: 1px solid rgba(217,184,106,0.4); opacity: 0; transition: opacity 0.4s; text-align: center; max-width: 80vw; } #hlHint.on { opacity: 1; }
#hlToast { position: absolute; left: 50%; top: 15%; transform: translateX(-50%); text-align: center; opacity: 0; transition: opacity 0.5s; text-shadow: 0 2px 6px #000, 0 0 14px rgba(0,0,0,0.9); padding: 22px 90px 26px; background: radial-gradient(ellipse at center, rgba(8,6,10,0.58), rgba(8,6,10,0.3) 45%, rgba(8,6,10,0) 72%); } #hlToast.on { opacity: 1; }
#hlToast .a { font-size: 30px; letter-spacing: 0.2em; color: var(--gold); } #hlToast .b { font-size: 17px; margin-top: 4px; color: #e6dcc6; } #hlToast hr { border: 0; height: 1px; width: 320px; background: linear-gradient(90deg, transparent, var(--gold), transparent); margin: 6px auto; }
#hlPop { position: absolute; left: 50%; top: 34%; transform: translateX(-50%); font-size: 20px; letter-spacing: 0.3em; color: #fff; text-shadow: 0 0 12px #6fb4ff, 0 2px 4px #000; opacity: 0; } #hlPop.on { animation: hlpop 1.1s forwards; }
@keyframes hlpop { 0% { opacity: 0; transform: translateX(-50%) scale(1.5); } 15% { opacity: 1; transform: translateX(-50%) scale(1); } 75% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) translateY(-14px); } }
#hlName { position: absolute; left: 50%; bottom: 23%; transform: translateX(-50%); font-size: 19px; letter-spacing: 0.3em; text-shadow: 0 2px 6px #000; opacity: 0; transition: opacity 0.3s; font-style: italic; } #hlName.on { opacity: 0.95; }
.hlDmg { position: absolute; font-family: 'HLA', serif; font-size: 20px; text-shadow: 0 1px 4px #000; will-change: transform, opacity; }
#hlHurt { position: absolute; inset: 0; box-shadow: inset 0 0 160px 40px rgba(170,10,10,0.75); opacity: 0; } #hlFade { position: absolute; inset: 0; background: #000; opacity: 0; transition: opacity 0.6s; }
#hlFly { position: absolute; left: 50%; bottom: 34px; transform: translateX(-50%); width: 280px; text-align: center; opacity: 0; transition: opacity 0.3s; text-shadow: 0 1px 4px #000; } #hlFly.on { opacity: 1; }
#hlFly .sp { font-size: 30px; } #hlFly .sp small { font-size: 12px; letter-spacing: 0.2em; margin-left: 4px; color: #cfc6b0; } #hlFly u { display: block; height: 5px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3); margin-top: 4px; } #hlFly u i { display: block; height: 100%; background: linear-gradient(90deg, #d9b86a, #fff3c4); }
#hlFly .al { font-size: 11px; letter-spacing: 0.2em; margin-top: 5px; color: #cfc6b0; }
#hlMarks i { position: absolute; width: 12px; height: 12px; margin: -6px; border: 1.5px solid #7fc4ff; transform: rotate(45deg); box-shadow: 0 0 10px #58aaff; } #hlMarks i.f { border-color: #ff6a5a; box-shadow: 0 0 10px #ff4a3a; }
#hlQ { position: absolute; left: 50%; top: 18px; transform: translateX(-50%); display: none; text-align: center; text-shadow: 0 1px 4px #000; } #hlQ.on { display: block; }
#hlQ .sb { display: flex; align-items: center; gap: 14px; background: rgba(8,8,12,0.6); padding: 6px 18px; border: 1px solid rgba(217,184,106,0.45); } #hlQ .tm { font-size: 13px; letter-spacing: 0.14em; } #hlQ .sc { font-size: 34px; min-width: 56px; }
#hlQ .cl { font-size: 15px; letter-spacing: 0.2em; padding: 0 8px; color: #cfc6b0; } #hlQ .st { font-size: 14px; margin-top: 6px; letter-spacing: 0.14em; min-height: 18px; } #hlQ .st b { color: #ffd76a; }
#hlScreen { position: absolute; inset: 0; pointer-events: auto; display: none; } #hlScreen.on { display: block; }
.hlTitle { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 9vh; background: linear-gradient(rgba(10,7,16,0.72), rgba(10,7,16,0.34) 17%, rgba(0,0,0,0) 36%, rgba(0,0,0,0) 58%, rgba(6,4,3,0.7)); }
.hlTitle h1 { font-family: 'HLA', serif; font-weight: 500; font-size: min(9.4vw, 118px); letter-spacing: 0.24em; padding-left: 0.24em; margin: 0; color: #f4ead2; background: linear-gradient(#fffaf0 8%, #f3dfa8 48%, #c9984a 92%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 18px rgba(0,0,0,0.8)) drop-shadow(0 0 34px rgba(226,178,90,0.35)); position: absolute; top: 3.2vh; white-space: nowrap; }
.hlTitle h2 { font-family: 'HLA', serif; font-weight: 400; font-size: min(1.9vw, 20px); letter-spacing: 0.86em; padding-left: 0.86em; color: #f1d58e; position: absolute; top: calc(3.2vh + min(10.6vw, 134px)); text-shadow: 0 2px 6px #000, 0 0 18px rgba(0,0,0,0.9); margin: 0; white-space: nowrap; display: flex; align-items: center; gap: 22px; } .hlTitle h2:before, .hlTitle h2:after { content: ''; width: min(9vw, 120px); height: 1px; background: linear-gradient(90deg, transparent, rgba(241,213,142,0.9)); } .hlTitle h2:after { transform: scaleX(-1); margin-left: -0.86em; }
.hlBtn { pointer-events: auto; cursor: pointer; font-family: 'HLA', serif; font-size: 19px; letter-spacing: 0.34em; padding: 12px 40px; margin: 6px; color: #efe6d2; background: rgba(10,10,14,0.5); border: 1px solid rgba(217,184,106,0.55); transition: all 0.18s; min-width: 320px; text-align: center; }
.hlBtn:hover, .hlBtn.sel { background: rgba(217,184,106,0.22); border-color: #fff3c4; color: #fff; letter-spacing: 0.4em; }
.hlTitle .v { position: absolute; bottom: 12px; right: 18px; font-size: 11px; letter-spacing: 0.12em; color: rgba(239,230,210,0.5); } .hlTitle .cr { position: absolute; bottom: 12px; left: 18px; font-size: 11px; color: rgba(239,230,210,0.45); max-width: 46vw; }
.hlSort { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 40%, rgba(10,8,14,0.55), rgba(4,3,6,0.92)); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hlSort h3 { font-family: 'HLA', serif; font-weight: 400; letter-spacing: 0.5em; font-size: 26px; margin: 0 0 4px; color: var(--gold); } .hlSort p { margin: 0 0 22px; font-size: 18px; color: #cfc6b0; font-style: italic; }
.hlHouses { display: flex; gap: 18px; } .hlH { pointer-events: auto; cursor: pointer; width: min(21vw, 250px); height: min(56vh, 480px); position: relative; border: 1px solid rgba(239,230,210,0.25); transition: all 0.25s; overflow: hidden; display: flex; flex-direction: column; align-items: center; background: linear-gradient(var(--a), var(--b)); clip-path: polygon(0 0, 100% 0, 100% 90%, 50% 100%, 0 90%); filter: saturate(0.6) brightness(0.62); }
.hlH:hover, .hlH.sel { filter: none; transform: translateY(-10px); border-color: #fff3c4; box-shadow: 0 16px 50px rgba(0,0,0,0.6); }
.hlH svg { width: 62%; margin-top: 12%; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); } .hlH .nm { font-family: 'HLA', serif; font-size: min(1.9vw, 23px); letter-spacing: 0.2em; margin-top: 8%; text-shadow: 0 2px 6px rgba(0,0,0,0.6); } .hlH .tr { font-size: 14px; margin-top: 8px; opacity: 0.9; text-align: center; padding: 0 10px; font-style: italic; }
.hlRow { display: flex; gap: 12px; margin-top: 22px; align-items: center; } .hlRow .hlBtn { min-width: 150px; font-size: 14px; padding: 9px 20px; }
.hlPause { position: absolute; inset: 0; background: rgba(4,3,6,0.72); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hlPause h3 { font-family: 'HLA', serif; font-weight: 400; letter-spacing: 0.6em; font-size: 30px; color: var(--gold); margin: 0 0 18px; }
.hlKeys { display: grid; grid-template-columns: auto auto; gap: 5px 26px; font-size: 15px; margin: 4px 0 20px; color: #ded4bc; } .hlKeys b { text-align: right; font-weight: 400; color: #fff; }
`; };
/* a house crest: a shield in the house colours bearing a simple charge */
HL.ui.crest = function (house) {
  const H = HL.HOUSES[house], ch = { gryffindor: 'M50 30 c-9 0 -15 7 -15 16 c0 5 2 9 5 12 l-5 16 l8 -4 l7 9 l7 -9 l8 4 l-5 -16 c3 -3 5 -7 5 -12 c0 -9 -6 -16 -15 -16 z M43 44 a2 2 0 1 0 0.1 0 M57 44 a2 2 0 1 0 0.1 0',
    slytherin: 'M62 34 c-10 -8 -26 -2 -24 10 c1 9 20 8 20 16 c0 6 -12 6 -18 1 l-4 6 c10 9 30 6 30 -7 c0 -11 -20 -10 -20 -17 c0 -5 9 -6 13 -2 z',
    ravenclaw: 'M30 44 c8 -12 22 -14 34 -6 l8 -4 l-4 9 c2 8 -1 16 -8 21 l-4 14 l-6 -11 c-9 0 -17 -6 -20 -23 z M58 44 a2 2 0 1 0 0.1 0',
    hufflepuff: 'M28 58 c2 -14 14 -22 28 -20 l10 -6 l-2 9 c6 3 9 8 9 13 l-6 2 c-2 9 -10 14 -20 14 c-9 0 -17 -4 -19 -12 z M62 48 a2 2 0 1 0 0.1 0' }[house];
  return `<svg viewBox="0 0 100 116"><defs><linearGradient id="cg${house}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${H.css}"/><stop offset="1" stop-color="${H.css}" stop-opacity="0.72"/></linearGradient></defs>
    <path d="M6 6 h88 v54 c0 26 -20 42 -44 52 c-24 -10 -44 -26 -44 -52 z" fill="url(#cg${house})" stroke="${H.css2}" stroke-width="4"/><path d="M14 14 h72 v46 c0 20 -16 34 -36 43 c-20 -9 -36 -23 -36 -43 z" fill="none" stroke="${H.css2}" stroke-width="1.2" opacity="0.6"/>
    <path d="${ch}" fill="${H.css2}" fill-rule="evenodd"/></svg>`;
};
HL.ui.GLYPH = { levioso: 'M12 20 V6 M6 11 l6 -6 l6 6 M5 21 h14', accio: 'M20 5 A9 9 0 1 0 20 19 M20 5 v6 h-6 M11 12 h3', depulso: 'M4 12 h10 M10 6 l6 6 l-6 6 M19 5 v14', incendio: 'M12 3 c1 5 6 6 6 12 a6 6 0 0 1 -12 0 c0 -3 2 -4 3 -6 c1 2 2 2 3 1 c1 -2 0 -5 0 -7 z', confringo: 'M3 12 h8 M8 8 l4 4 l-4 4 M17 12 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M17 5 v2 M17 17 v2 M22 12 h1',
  expelliarmus: 'M5 19 L17 7 M14 5 l5 5 M4 6 l3 3 M7 4 l1 3 M3 10 l3 1', glacius: 'M12 3 v18 M4 7.5 l16 9 M20 7.5 l-16 9 M12 6 l-2 -2 M12 6 l2 -2 M12 18 l-2 2 M12 18 l2 2', bombarda: 'M12 12 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M12 2 v3 M12 19 v3 M2 12 h3 M19 12 h3 M5 5 l2 2 M17 17 l2 2 M19 5 l-2 2 M7 17 l-2 2' };
HL.ui.build = function () {
  const U = HL.ui; if (U.root) return;
  const st = document.createElement('style'); st.textContent = U.css(); document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'hl'; U.root = root;
  root.innerHTML = `<div id="hlHud"><div id="hlMarks"></div><div id="hlWay"><i></i><span></span></div><div id="hlTgt"><span></span><u><i></i></u><em></em></div><div id="hlRet"><b></b><i></i></div>
    <div id="hlQuest"><div class="t f"></div><div class="n f"></div><div class="o"></div></div><div id="hlPts"><div class="t f">HOUSE POINTS</div><div class="n f">0</div></div>
    <div id="hlVit"><div class="crest"></div><div class="bars"><div class="nm f"></div><div id="hlHp"><s></s><i></i></div><div id="hlAm"><i></i></div><div class="am f">ANCIENT MAGIC <kbd>X</kbd></div></div></div>
    <div id="hlBarT" class="f"></div><div id="hlBar"></div><div id="hlFly"><div class="sp f"><span>0</span><small>KNOTS</small></div><u><i></i></u><div class="al f"></div></div>
    <div id="hlQ"><div class="sb"><span class="cl f" id="hlQa"></span><span class="sc f" id="hlQsa">0</span><span class="tm f" id="hlQt">0:00</span><span class="sc f" id="hlQsb">0</span><span class="cl f" id="hlQb"></span></div><div class="st f" id="hlQs"></div></div>
    <div id="hlPrompt"></div><div id="hlHint"></div><div id="hlName" class="f"></div><div id="hlPop" class="f"></div></div>
    <div id="hlToast"><div class="a f"></div><hr><div class="b"></div></div><div id="hlHurt"></div><div id="hlFade"></div><div id="hlScreen"></div>`;
  document.body.appendChild(root);
  for (const e of root.querySelectorAll('[id]')) U.el[e.id.slice(2)] = e;
  const bar = U.el.Bar; U.slots = [];
  HL.BAR.forEach((id, i) => { const S = HL.SPELLS[id], d = document.createElement('div'); d.className = 'hlS rdy'; d.style.setProperty('--c', `rgb(${S.col.map((v) => Math.round(v * 255)).join(',')})`);
    d.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="rgb(${S.col.map((v) => Math.round(Math.min(1, v * 0.7 + 0.3) * 255)).join(',')})" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${U.GLYPH[id]}"/></svg><div class="cd" style="transform:scaleY(0)"></div><span class="k">${i + 1}</span><span class="n"></span>`;
    bar.appendChild(d); U.slots.push({ d, cd: d.querySelector('.cd'), n: d.querySelector('.n'), id, last: -1 }); });
  U.theme();
};
HL.ui.theme = function () { const U = HL.ui, H = HL.H(); if (!U.root) return; U.root.style.setProperty('--hc', H.css); U.root.style.setProperty('--hc2', H.css2); U.el.Vit.querySelector('.crest').innerHTML = U.crest(HL.house); U.el.Vit.querySelector('.nm').textContent = H.name.toUpperCase(); };
HL.ui.show = function (on) { HL.ui.build(); HL.ui.el.Hud.classList.toggle('on', !!on); };
HL.ui.toast = function (a, b, dur) { const e = HL.ui.el.Toast; e.querySelector('.a').textContent = a || ''; e.querySelector('.b').textContent = b || ''; e.querySelector('hr').style.display = a ? '' : 'none'; e.classList.add('on'); HL.ui.toastT = dur || 4.5; };
HL.ui.hint = function (html, dur) { const e = HL.ui.el.Hint; e.innerHTML = html; e.classList.add('on'); HL.ui.hintT = dur || 7; };
HL.ui.pop = function (t) { const e = HL.ui.el.Pop; e.textContent = t; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); };
HL.ui.spellName = function (t) { const e = HL.ui.el.Name; e.textContent = t; e.classList.add('on'); HL.ui.nameT = 1.3; };
HL.ui.deny = function (id) { const U = HL.ui, s = U.slots.find((q) => q.id === id); if (s) { s.d.classList.remove('no'); void s.d.offsetWidth; s.d.classList.add('no'); } };
HL.ui.hurt = function (amt) { HL.ui.hurtK = Math.min(1, (HL.ui.hurtK || 0) + 0.35 + amt * 0.02); };
HL.ui.fade = function (v) { HL.ui.el.Fade.style.opacity = v; };
HL.ui.wardHint = function (t) { if (HL.ui.wardT > 0) return; HL.ui.wardT = 2.5; HL.ui.pop(t.ward === 'guard' ? 'PROTEGO · WAIT FOR IT TO DROP' : t.ward === 'fire' ? 'WARDED · USE FIRE' : t.ward === 'force' ? 'WARDED · USE FORCE' : 'WARDED · USE CONTROL'); };
HL.ui.dmg = function (p, n, col) { const U = HL.ui; if (U.dmgs.length > 24) { const o = U.dmgs.shift(); o.e.remove(); } const e = document.createElement('div'); e.className = 'hlDmg'; e.textContent = Math.round(n); e.style.color = `rgb(${col.map((v) => Math.round(Math.min(1, v * 0.6 + 0.4) * 255)).join(',')})`; if (n >= 40) e.style.fontSize = '27px';
  U.el.Hud.appendChild(e); U.dmgs.push({ e, p: p.clone().add(V3(rnd(-0.2, 0.2), 0.5, rnd(-0.2, 0.2))), t: 0 }); };
HL.ui.onMount = function (on) { HL.ui.el.Fly.classList.toggle('on', on); HL.ui.el.Ret.classList.toggle('fly', on); if (on && !HL.save.flew && !(HL.Q && (HL.Q.on || HL.Q.loading))) { HL.save.flew = 1; HL.ui.hint('<kbd>W</kbd> fly &nbsp; <kbd>SHIFT</kbd> boost &nbsp; <kbd>S</kbd> brake &nbsp; <kbd>SPACE</kbd>/<kbd>C</kbd> up / down &nbsp; the broom follows where you look &nbsp; <kbd>B</kbd> dismount', 10); } };
HL.proj = function (p, out) { const v = _v5.copy(p).project(R.camera); out.x = (v.x * 0.5 + 0.5) * R.cw; out.y = (-v.y * 0.5 + 0.5) * R.ch; out.z = v.z; return out; };
HL.ui._p = { x: 0, y: 0, z: 0 };
HL.ui.setText = function (key, el, v) { if (HL.ui.last[key] !== v) { HL.ui.last[key] = v; el.textContent = v; } };
HL.ui.update = function (dt) {
  const U = HL.ui; if (!U.root) return; const E = U.el, a = PLAYER.a, P = HL.P, pr = U._p;
  if (U.toastT > 0) { U.toastT -= dt; if (U.toastT <= 0) E.Toast.classList.remove('on'); }
  if (U.hintT > 0) { U.hintT -= dt; if (U.hintT <= 0) E.Hint.classList.remove('on'); }
  if (U.nameT > 0) { U.nameT -= dt; if (U.nameT <= 0) E.Name.classList.remove('on'); }
  if (U.wardT > 0) U.wardT -= dt;
  U.hurtK = Math.max(0, (U.hurtK || 0) - dt * 1.4); const lowHp = a && a.alive && a.hp < 30 ? 0.35 + 0.15 * Math.sin(MG.rt * 5) : 0; E.Hurt.style.opacity = Math.max(U.hurtK, lowHp).toFixed(2);
  if (!a || MG.state !== 'play') return;
  const hp = sat(a.hp / a.hpMax); U.hpLag = U.hpLag === undefined || hp > U.hpLag ? hp : damp(U.hpLag, hp, 2.5, dt);
  if (U.last.hp !== hp) { U.last.hp = hp; E.Hp.querySelector('i').style.width = (hp * 100).toFixed(1) + '%'; } E.Hp.querySelector('s').style.width = (U.hpLag * 100).toFixed(1) + '%';
  const am = Math.round(P.ancient); if (U.last.am !== am) { U.last.am = am; E.Am.querySelector('i').style.width = am + '%'; E.Am.classList.toggle('full', am >= 100); }
  for (const s of U.slots) { const S = HL.SPELLS[s.id], cd = P.cd[s.id] || 0, f = S.cd ? cd / S.cd : 0, q = Math.ceil(cd); if (q !== s.last) { s.last = q; s.n.textContent = q > 0 ? q : ''; s.d.classList.toggle('rdy', q === 0); } s.cd.style.transform = 'scaleY(' + f.toFixed(3) + ')'; }
  // reticle and the target plate
  const t = PLAYER.state === 'fly' ? null : P.target; E.Ret.classList.toggle('t', !!t);
  if (t) { HL.proj(_v4.set(t.x, t.y + t.h * (t.inst && t.inst.scale || 1) + 0.35, t.z), pr); E.Tgt.style.left = pr.x.toFixed(0) + 'px'; E.Tgt.style.top = (pr.y - 34).toFixed(0) + 'px'; E.Tgt.classList.toggle('on', pr.z < 1);
    U.setText('tn', E.Tgt.querySelector('span'), t.label || 'Foe'); const th = Math.round(sat(t.hp / t.hpMax) * 100); if (U.last.th !== th) { U.last.th = th; E.Tgt.querySelector('u i').style.width = th + '%'; }
    const st = t.st || {}; U.setText('ts', E.Tgt.querySelector('em'), t.ward ? '◆ WARDED · ' + (t.ward === 'fire' ? 'FIRE' : t.ward === 'force' ? 'FORCE' : 'CONTROL') : st.freeze > 0 ? 'FROZEN' : st.lift > 0 ? 'LEVITATED' : st.burn > 0 ? 'BURNING' : st.disarm > 0 ? 'DISARMED' : st.stun > 0 ? 'STUNNED' : ''); }
  else E.Tgt.classList.remove('on');
  // floating damage
  for (let i = U.dmgs.length - 1; i >= 0; i--) { const d = U.dmgs[i]; d.t += dt; d.p.y += dt * 0.9; HL.proj(d.p, pr); d.e.style.transform = `translate(${pr.x.toFixed(0)}px, ${pr.y.toFixed(0)}px) translate(-50%, -50%) scale(${(1 + Math.max(0, 0.25 - d.t) * 2.4).toFixed(2)})`; d.e.style.opacity = pr.z > 1 ? 0 : sat(1.6 - d.t * 1.6).toFixed(2); if (d.t > 1) { d.e.remove(); U.dmgs.splice(i, 1); } }
  // waypoint
  const q = HL.quest && HL.quest.way ? HL.quest.way() : null;
  if (q) { HL.proj(_v4.set(q[0], q[1], q[2]), pr); const behind = pr.z > 1, m = 46; let x = pr.x, y = pr.y; if (behind) { x = R.cw - x; y = R.ch - m; } x = clamp(x, m, R.cw - m); y = clamp(y, m + 30, R.ch - m - 60);
    if (document.body.classList.contains('touch')) { y = clamp(y, 96, R.ch * 0.6); if (y > 130) x = Math.min(x, R.cw - 300); x = Math.max(x, 60); }   // (on a phone it stays in the open middle of the view: off the stick, the spell buttons and the quest)
    E.Way.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`; E.Way.classList.add('on'); const dist = Math.hypot(q[0] - a.x, q[1] - a.y, q[2] - a.z); U.setText('wd', E.Way.querySelector('span'), dist > 4 ? Math.round(dist) + ' m' : ''); } else E.Way.classList.remove('on');
  // flight gauges
  if (PLAYER.state === 'fly') { const F = HL.fly; U.setText('fs', E.Fly.querySelector('.sp span'), Math.round(F.speed * 1.94)); E.Fly.querySelector('u i').style.width = (F.boost * 100).toFixed(0) + '%'; U.setText('fa', E.Fly.querySelector('.al'), HL.Q && HL.Q.on ? '\u00a0' : 'ALTITUDE ' + Math.round(a.y) + ' M'); }
  // Revelio marks
  if (P.revT > 0) { const M = E.Marks; let n = 0; const put = (p, foe) => { HL.proj(p, pr); if (pr.z > 1) return; let e = M.children[n]; if (!e) { e = document.createElement('i'); M.appendChild(e); } e.className = foe ? 'f' : ''; e.style.left = pr.x.toFixed(0) + 'px'; e.style.top = pr.y.toFixed(0) + 'px'; e.style.display = ''; e.style.opacity = sat(P.revT / 2).toFixed(2); n++; };
    for (const e of COMBAT.actors) if (e.alive && e.team === 'foe' && !e.hidden && e.dist(a) < 90) put(e.chest(_v4), true);
    if (HL.SECRETS) for (const s of HL.SECRETS) if (!s.got && Math.hypot(s.p.x - a.x, s.p.z - a.z) < 140) put(s.p, false);
    for (let i = n; i < M.children.length; i++) M.children[i].style.display = 'none'; U.marksOn = true; }
  else if (U.marksOn) { U.marksOn = false; for (const e of E.Marks.children) e.style.display = 'none'; }
  U.setText('pts', E.Pts.querySelector('.n'), HL.save.points || 0);
  // the nearest thing to use
  const it = HL.nearInteract ? HL.nearInteract() : null; const key = it ? it.label : ''; if (U.last.prompt !== key) { U.last.prompt = key; E.Prompt.innerHTML = it ? '<kbd>E</kbd> ' + it.label : ''; E.Prompt.classList.toggle('on', !!it); }
};
HL.ui.setQuest = function (t, n, o) { const E = HL.ui.el.Quest; E.querySelector('.t').textContent = t || ''; E.querySelector('.n').textContent = n || ''; E.querySelector('.o').innerHTML = o || ''; E.querySelector('.o').style.display = o ? '' : 'none'; };
/* ------------------------------------------------------------------ screens */
HL.ui.screen = function (html) { const S = HL.ui.el.Screen; S.innerHTML = html || ''; S.classList.toggle('on', !!html); return S; };
HL.ui.title = function () {
  HL.ui.build(); HL.ui.show(false); MG.state = 'title'; if (document.exitPointerLock) document.exitPointerLock();
  const has = !!HL.save.house;
  const S = HL.ui.screen(`<div class="hlTitle"><h1>HOGWARTS</h1><h2>LEGACY OF MAGIC</h2>
    ${has ? `<div class="hlBtn" data-a="cont">CONTINUE · ${HL.HOUSES[HL.save.house].name.toUpperCase()}</div>` : ''}<div class="hlBtn" data-a="new">${has ? 'NEW STUDENT' : 'BEGIN'}</div>
    <div class="cr">A fan-made tribute. Not affiliated with or endorsed by Warner Bros. or J.K. Rowling. Models &amp; animation: Quaternius (CC0); textures: Poly Haven (CC0). Castle layout follows the Hogwarts Legacy castle map (reference: game-maps.com).</div><div class="v">${MG.VERSION}</div></div>`);
  S.querySelectorAll('.hlBtn').forEach((b) => b.onclick = () => { if (b.dataset.a === 'cont') HL.begin(HL.save.house, HL.save.witch, true); else HL.ui.sorting(); });
  MG.onKey = (c) => { if (c === 'Enter' || c === 'Space') { if (has) HL.begin(HL.save.house, HL.save.witch, true); else HL.ui.sorting(); } };
};
HL.ui.sorting = function () {
  MG.state = 'house'; let witch = HL.witch, sel = HL.house;
  const draw = () => { const S = HL.ui.screen(`<div class="hlSort"><h3>THE SORTING</h3><p>“Hmm… difficult. Very difficult. Where shall I put you?”</p><div class="hlHouses">${Object.keys(HL.HOUSES).map((k) => { const H = HL.HOUSES[k];
      return `<div class="hlH ${k === sel ? 'sel' : ''}" data-h="${k}" style="--a:${H.css}; --b:#0c0a10">${HL.ui.crest(k)}<div class="nm">${H.name.toUpperCase()}</div><div class="tr">${H.trait}</div></div>`; }).join('')}</div>
      <div class="hlRow"><div class="hlBtn ${!witch ? 'sel' : ''}" data-w="0">WIZARD</div><div class="hlBtn ${witch ? 'sel' : ''}" data-w="1">WITCH</div><div class="hlBtn" data-go="1" style="min-width:260px">ENTER HOGWARTS</div></div></div>`);
    S.querySelectorAll('.hlH').forEach((e) => { e.onclick = () => { sel = e.dataset.h; draw(); }; e.ondblclick = () => HL.begin(sel, witch); });
    S.querySelectorAll('[data-w]').forEach((e) => e.onclick = () => { witch = e.dataset.w === '1'; draw(); });
    S.querySelector('[data-go]').onclick = () => HL.begin(sel, witch); };
  draw(); const ks = Object.keys(HL.HOUSES);
  MG.onKey = (c) => { let i = ks.indexOf(sel); if (c === 'ArrowLeft' || c === 'KeyA') { sel = ks[(i + 3) % 4]; draw(); } else if (c === 'ArrowRight' || c === 'KeyD') { sel = ks[(i + 1) % 4]; draw(); } else if (c === 'Enter' || c === 'Space') HL.begin(sel, witch); else if (c === 'KeyW' || c === 'KeyS' || c === 'ArrowUp' || c === 'ArrowDown') { witch = !witch; draw(); } };
};
HL.begin = async function (house, witch, cont) {
  if (HL._beginning) return; HL._beginning = true; MG.onKey = null; const U = HL.ui;
  U.fade(1); await new Promise((r) => setTimeout(r, 650)); U.screen('');
  const fresh = !cont || HL.save.house !== house; HL.house = house; HL.witch = !!witch; HL.save.house = house; HL.save.witch = !!witch; if (!cont) { HL.save.quest = 0; HL.save.points = 0; HL.save.found = {}; /* a new term: the ladder, the side quests and the letter start over too */ HL.save.duel = 0; HL.save.sq = {}; HL.save.met = {}; HL.save.floors = {}; HL.save.flown = 0; HL.save.deck = 0; HL.save.letter = 0; HL.save.qPlayed = 0; } HL.store();
  const n = HL.student(house, witch, 0); if (CHAR.T.maul !== CHAR.T[n]) { await CAST.need([n]); CHAR.T.maul = CHAR.T[n]; CHAR.T.maul.stats = {}; }
  U.theme(); if (HL.onHouse) await HL.onHouse(fresh);
  const sp = HL.spawnPoint ? HL.spawnPoint(cont) : LEVEL.cur.def.start; PLAYER.spawn(sp[0], sp[1], sp[2], sp[3] || 0); CAM.reset(sp[3] || 0); IN.buf = {};
  R.setShadowBox(HL.shadowFoot || 46, 1300); MG.state = 'play'; U.show(true); U.fade(0); HL._beginning = false;
  if (HL.quest) HL.quest.start(cont);
  if (!cont && !MG.test) {   // a new student arrives: the eye comes in over the loch and settles behind you on the viaduct
    const P = PLAYER.a; PLAYER.state = 'cine'; U.show(false);
    /* it opens at Hogsmeade Station: the scarlet engine in steam beside the platform, the eye drawing back along it — then over the loch to the castle */
    const ST = HL.STN && HL.STN.plat ? HL.STN : null, T0 = ST ? 4.6 : 0; HL._cineStn = !!ST; if (ST) { /* the first frames of a new view compile their shaders: they are drawn behind the black, and the shot and its captions start when the picture is running */
      U.fade(1); const f0 = MG.frame, w0 = performance.now(); const up = () => { if (MG.frame - f0 < 8 && performance.now() - w0 < 9000) return requestAnimationFrame(up); if (CAM.cine && HL._cineStn) CAM.cine.t = 0; U.fade(0);
        MG.after(0.7, () => { if (CAM.cine) U.toast('HOGSMEADE STATION', 'The first of September. The train is in; the carriages are waiting.', 3.4); }, true); MG.after(T0 + 0.6, () => { if (CAM.cine) U.toast('HOGWARTS', 'A new term. The castle, the grounds and the sky above them are yours to roam.', 6); }, true); }; requestAnimationFrame(up); }
    CAM.play({ dur: 9 + T0, fov: 46, ease: 'lin', fn: (t, u0) => { if (ST && t < T0) { const q = t / T0, ex = HL.VIL.x - 28, pl = ST.plat, k = easeIO(q); HL._cineStn = true; return { pos: _v1.set(ex - 6.5 - k * 6.5, pl.y + 1.05 + k * 1.9, pl.z0 + 1.5 + k * 2.4), look: _v2.set(ex + 5 + k * 4, pl.y + 1.7 - k * 0.2, ST.z - 0.1) }; } HL._cineStn = false; const u = sat((t - T0) / 9); const e = easeIO(u), a = lerp(-1.25, 0.0, e), r = lerp(330, 5.2, e * e), h = lerp(40, 1.9, e); return { pos: _v1.set(P.x + Math.sin(a + PI) * r * 0.9 + (1 - e) * 120, P.y + h + Math.sin(u * PI) * 46, P.z + Math.cos(a + PI) * r), look: _v2.set(lerp(20, P.x, e * e * e), lerp(HL.Y0 + 44, P.y + 6, e * e), lerp(20, P.z + 60, e * e * e)) }; },
      onEnd: () => { if (PLAYER.state === 'cine') PLAYER.state = 'move'; U.show(true); CAM.reset(0); if (ST) U.hint('Click the view to look around with the mouse · <kbd>ESC</kbd> for the controls', 10); } });
    MG.onKey = (c) => { if ((c === 'Enter' || c === 'Space' || c === 'Escape') && CAM.cine) { CAM.cine.t = CAM.cine.dur; MG.onKey = null; } }; }
};
HL.ui.pause = function () {
  if (MG.state !== 'play') return; MG.state = 'pause'; if (document.exitPointerLock) document.exitPointerLock();
  const S = HL.ui.screen(`<div class="hlPause"><h3>PAUSED</h3><div class="hlKeys">
    <b>Move</b><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · look with the mouse (click to capture)</span><b>Sprint / Roll</b><span>hold / tap <kbd>SHIFT</kbd></span><b>Jump</b><span><kbd>SPACE</kbd></span>
    <b>Basic cast</b><span><kbd>LMB</kbd></span><b>Spells</b><span><kbd>1</kbd> – <kbd>8</kbd></span><b>Protego</b><span>hold <kbd>RMB</kbd> or <kbd>Q</kbd> · time it for a Stupefy</span><b>Ancient Magic</b><span><kbd>X</kbd> when the blue meter is full</span>
    <b>Broom</b><span><kbd>B</kbd> mount / dismount · <kbd>SHIFT</kbd> boost · <kbd>SPACE</kbd>/<kbd>C</kbd> up / down</span><b>Interact</b><span><kbd>E</kbd></span><b>Revelio / Lumos</b><span><kbd>R</kbd> / <kbd>L</kbd></span><b>Inventory / Map / Journal</b><span><kbd>I</kbd> / <kbd>M</kbd> / <kbd>J</kbd></span><b>Wiggenweld</b><span><kbd>G</kbd></span><b>Charmed locks</b><span>cast the shown spells in order on <kbd>1</kbd> – <kbd>8</kbd></span></div>
    <div class="hlBtn" data-a="r">RESUME</div><div class="hlBtn" data-a="q">${MG.flags.dpr ? 'GRAPHICS · PERFORMANCE' : 'GRAPHICS · FULL'}</div><div class="hlBtn" data-a="h">CHANGE HOUSE</div><div class="hlBtn" data-a="t">QUIT TO TITLE</div></div>`);
  const resume = () => { HL.ui.screen(''); MG.state = 'play'; MG.onKey = null; IN.buf = {}; HL.noPauseT = MG.rt + 0.3; /* the Esc that resumes must not be read as the Esc that pauses */ };
  S.querySelectorAll('.hlBtn').forEach((b) => b.onclick = () => { const k = b.dataset.a; if (k === 'r') resume(); else if (k === 'h') { HL.ui.show(false); HL.ui.sorting(); } else if (k === 't') { HL.ui.title(); } else if (k === 'q') { MG.flags.dpr = MG.flags.dpr ? 0 : 0.72; R.resize(true); b.textContent = MG.flags.dpr ? 'GRAPHICS · PERFORMANCE' : 'GRAPHICS · FULL'; try { localStorage.setItem('hl_dpr', MG.flags.dpr || ''); } catch (e) { /* */ } } });
  MG.onKey = (c) => { if (c === 'Escape' || c === 'KeyP' || c === 'Enter') resume(); };
};
/* the title's camera: a slow turn around the castle from the loch side, the sun on its western face */
HL.titleUpdate = function (dt) {
  HL.titleT = (HL.titleT || 0) + dt; const t = HL.titleT, a = 0.62 + t * 0.022, r = 330 - 30 * Math.sin(t * 0.05), cam = R.camera;
  cam.position.set(20 + Math.sin(a) * r, 104 + 22 * Math.sin(t * 0.04), 10 - Math.cos(a) * r); cam.lookAt(18, 98, 14); if (Math.abs(cam.fov - 40) > 0.01) { cam.fov = 40; cam.updateProjectionMatrix(); }
  if (PLAYER.a) { PLAYER.a.root.visible = false; if (PLAYER.a.wand) PLAYER.a.wand.visible = false; if (PLAYER.a.inst.cloth) PLAYER.a.inst.cloth.setVisible(false); }
  /* Nobody in the castle is drawn behind a menu. (The people of the world are shown and hidden by the play frame, which does not run here: all 558 of them — 8,000 meshes, eleven million triangles — were being drawn behind the title, which ran at 15 frames a second.) The play frame brings back whoever is near when the game starts. */
  HL._tHide = (HL._tHide || 0) - dt; if (HL._tHide <= 0 && HL.npcs) { HL._tHide = 0.5; for (const a of HL.npcs) if (!a.hiddenN) { a.hiddenN = true; a.root.visible = false; if (a.inst && a.inst.cloth) a.inst.cloth.setVisible(false); } }
};
/* ------------------------------------------------------------------ hooks into the engine's boot */
MENU.titleScene = async function () { await LEVEL.load('hogwarts', { progress: (p) => MG.loadUI(0.55 + p * 0.4, 'Raising the castle') }); MG.state = 'title'; R.setShadowBox(300, 1300); };
MENU.open = function (name) { if (name === 'title') HL.ui.title(); };
MENU.close = function () { MG.onKey = null; };
HL.START.push(() => { HL.ui.build(); try { const d = localStorage.getItem('hl_dpr'); if (d && +d > 0 && +d < 1 && !MG.flags.dpr) { MG.flags.dpr = +d; R.resize(true); } } catch (e) { /* */ } });
HL.onStart = function (L) { R.dynOn = false; R.dynScale = 1; if (MG.flags.play) { if (HL.onHouse) HL.onHouse(); HL.ui.show(true); if (HL.quest) HL.quest.start(true); } };
