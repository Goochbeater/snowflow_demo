/* ==== p96g_qc_css.js ==== */
/* QUIDDITCH CAREER — its stylesheet (Skybound's, scoped to its own screens and dressed in the castle's gold). */
QC.CSS = String.raw`#scrCareer, #press, #locker { --night: #0a0c16; --ink: #121522; --parchment: #f1e4c6; --gold: #e2b84e; --gold-hi: #ffe39a; --ember: #e0533a; --mist: #b8c4d3; --glass: rgba(14,10,7,0.78); --glass-hi: rgba(30,22,12,0.86); --line: rgba(214,170,74,0.42);
  --f-display: 'HLA', 'Trajan Pro', Georgia, serif; --f-head: 'HLA', 'Trajan Pro', Georgia, serif; --f-ui: 'HLB', Georgia, serif; --sl: env(safe-area-inset-left, 0px); --sr: env(safe-area-inset-right, 0px); --st: env(safe-area-inset-top, 0px); --sb: env(safe-area-inset-bottom, 0px); --ui: 1;
  font-family: var(--f-ui); color: var(--parchment); -webkit-tap-highlight-color: transparent; }
#scrCareer button, #press button, #locker button { font: inherit; color: inherit; }
#scrCareer { position: absolute; inset: 0; z-index: 24; display: grid; place-items: center; padding: calc(12px + var(--st)) calc(16px + var(--sr)) calc(12px + var(--sb)) calc(16px + var(--sl)); box-sizing: border-box; pointer-events: auto; }
#scrCareer[hidden] { display: none !important; }
#scrCareer * { box-sizing: border-box; }
#scrCareer { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: calc(12px + var(--st)) calc(16px + var(--sr)) calc(12px + var(--sb)) calc(16px + var(--sl)); }
#scrCareer[hidden] { display: none !important; }
#scrCareer .scrim { background: radial-gradient(ellipse at 50% 40%, rgba(10,12,22,.25), rgba(6,7,14,.78)); }
#scrCareer .panel {
  background: var(--glass); backdrop-filter: blur(10px) saturate(1.2); -webkit-backdrop-filter: blur(10px) saturate(1.2);
  border: 1px solid var(--line); border-radius: 18px; padding: 18px 20px; width: min(760px, 100%);
  max-height: 100%; overflow-y: auto; touch-action: pan-y; box-shadow: 0 20px 60px rgba(0,0,0,.5);
}
#scrCareer .panel h2 { font-family: var(--f-head); font-weight: 800; letter-spacing: .12em; margin: 0 0 12px; font-size: 20px; color: var(--gold-hi); text-wrap: balance; }
#scrCareer .panel h3 { font-family: var(--f-head); font-weight: 700; letter-spacing: .1em; font-size: 13px; margin: 0 0 6px; color: var(--mist); }
#scrCareer .bar, #locker .bar, #press .bar { height: 4px; background: rgba(255,255,255,.12); border-radius: 4px; overflow: hidden; margin: 22px 0 10px; }
#scrCareer .bar i, #locker .bar i, #press .bar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--gold), var(--gold-hi)); transition: width .2s; }
#scrCareer .tip { font-size: 13px; opacity: .75; letter-spacing: .04em; min-height: 1.4em; }
#scrCareer .menuGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
#scrCareer .mbtn { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(241,228,198,.18); background: rgba(255,255,255,.04); cursor: pointer; min-height: 56px; }
#scrCareer .mbtn b { font-family: var(--f-head); letter-spacing: .1em; font-size: 15px; color: var(--parchment); }
#scrCareer .mbtn small { opacity: .68; font-size: 12.5px; line-height: 1.25; }
#scrCareer .mbtn.primary { border-color: var(--gold); background: linear-gradient(135deg, rgba(232,184,74,.28), rgba(232,184,74,.08)); }
#scrCareer .mbtn.primary b { color: var(--gold-hi); }
#scrCareer .mbtn:active { transform: scale(.98); }
#scrCareer .row { display: grid; grid-template-columns: 112px 1fr; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
#scrCareer .row > label { font-weight: 600; font-size: 13.5px; letter-spacing: .04em; opacity: .9; }
#scrCareer .seg { display: flex; flex-wrap: wrap; gap: 6px; }
#scrCareer .seg button { padding: 7px 12px; border-radius: 9px; border: 1px solid rgba(241,228,198,.2); background: rgba(255,255,255,.04); font-weight: 600; font-size: 13.5px; min-height: 36px; cursor: pointer; }
#scrCareer .seg button.on { border-color: var(--gold); background: rgba(232,184,74,.22); color: var(--gold-hi); }
#scrCareer .teams { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; }
#scrCareer .teamCard { border-radius: 12px; border: 2px solid transparent; padding: 6px 4px 8px; background: rgba(255,255,255,.04); display: grid; justify-items: center; gap: 4px; cursor: pointer; }
#scrCareer .teamCard img { width: 46px; height: 56px; }
#scrCareer .teamCard { min-width: 0; }
#scrCareer .teamCard span { font-family: var(--f-head); font-size: clamp(8.5px, 0.75vw + 3px, 11px); letter-spacing: .02em; font-weight: 700; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#scrCareer .teamCard .short { display: none; }
@media (max-width: 760px) {
#scrCareer .teamCard .long { display: none; }
#scrCareer .teamCard .short { display: block; font-size: 13px; letter-spacing: .1em; }
 
}
#scrCareer .panel::after { content: ''; position: sticky; display: block; bottom: -16px; height: 18px; margin: 0 -16px -16px; pointer-events: none; background: linear-gradient(180deg, rgba(14,16,28,0), rgba(14,16,28,.9)); }
#scrCareer .teamCard.on { border-color: var(--gold); background: rgba(232,184,74,.16); }
#scrCareer .teamCard.vs { border-color: var(--mist); background: rgba(169,188,211,.12); }
#scrCareer .teamCard.dis { opacity: .3; }
#scrCareer .actions, #locker .actions, #press .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap; }
#scrCareer .act, #locker .act, #press .act { padding: 11px 20px; border-radius: 11px; border: 1px solid rgba(241,228,198,.25); background: rgba(255,255,255,.05); font-family: var(--f-head); font-weight: 700; letter-spacing: .14em; font-size: 13.5px; cursor: pointer; min-height: 44px; }
#scrCareer .act.go, #locker .act.go, #press .act.go { border-color: var(--gold); background: linear-gradient(180deg, #f0c45a, #b9832a); color: #241400; }
#scrCareer input[type=range] { width: 100%; accent-color: var(--gold); touch-action: pan-x; height: 28px; }
#scrCareer .twocol { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); column-gap: 22px; }
#scrCareer .results { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; text-align: center; margin: 4px 0 14px; }
#scrCareer .results .big { font-family: var(--f-display); font-size: 44px; font-weight: 900; font-variant-numeric: tabular-nums; }
#scrCareer .results .nm { font-family: var(--f-head); letter-spacing: .12em; font-size: 13px; }
#scrCareer .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
#scrCareer .stat { padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,.04); }
#scrCareer .stat i { display: block; font-style: normal; font-size: 11.5px; letter-spacing: .1em; opacity: .7; }
#scrCareer .stat b { font-size: 20px; font-variant-numeric: tabular-nums; }
#scrCareer .verdict { text-align: center; font-family: var(--f-display); font-size: 28px; color: var(--gold-hi); margin-bottom: 6px; }
@media (max-height: 420px) {
#scrCareer .panel { padding: 12px 14px; border-radius: 14px; }
#scrCareer .panel h2 { font-size: 17px; margin-bottom: 8px; }
#scrCareer .row { grid-template-columns: 96px 1fr; padding: 4px 0; }
#scrCareer .seg button { padding: 5px 10px; min-height: 32px; font-size: 13px; }
#scrCareer .teamCard img { width: 34px; height: 42px; }
#scrCareer .results .big { font-size: 34px; }
#scrCareer .results { margin: 2px 0 6px; }
#scrCareer .verdict { font-size: 24px !important; margin-bottom: 0 !important; }
#scrCareer .stats { grid-template-columns: repeat(4, 1fr) !important; gap: 5px; }
#scrCareer .stat { padding: 4px 8px; }
#scrCareer .stat b { font-size: 15px; }
#scrCareer .stat i { font-size: 10px; }


}
#scrCareer { background: linear-gradient(90deg, rgba(6,7,12,.72), rgba(6,7,12,.18) 60%, rgba(6,7,12,0)); place-items: stretch; }
#scrCareer .panel { align-self: center; justify-self: center; }
#scrCareer .panel.wide { width: min(900px, 100%); }
#scrCareer .note, #locker .note, #press .note { opacity: .8; line-height: 1.45; font-size: 14.5px; margin: 0 0 8px; }
#scrCareer .bar, #locker .bar, #press .bar { position: relative; height: 6px; border-radius: 4px; background: rgba(255,255,255,.12); overflow: hidden; }
#scrCareer .bar > i, #locker .bar > i, #press .bar > i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; background: linear-gradient(90deg, #b9832a, #ffe39a); }
#scrCareer .bar > u, #locker .bar > u, #press .bar > u { position: absolute; top: -2px; bottom: -2px; width: 2px; background: #fff; opacity: .55; text-decoration: none; }
.tone { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; font-style: normal; font-size: 13px; flex: none; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2); }
.tone.gr { color: #ffe39a; border-color: #e8b84a; }
.tone.tm { color: #8ac8ff; border-color: #5ab0ff; }
.tone.sh { color: #ffb0f0; border-color: #e070d0; }
.tone.fi { color: #ff9a6a; border-color: #e0533a; }
.tone.de { color: #c8ccd4; }
#scrCareer .up, #locker .up, #press .up { color: #7ae08a !important; }
#scrCareer .dn, #locker .dn, #press .dn { color: #ff7a6a !important; }
#scrCareer .hub { display: grid; grid-template-columns: minmax(300px, 420px) 1fr; grid-template-rows: auto auto 1fr auto; gap: 10px 18px; height: 100%; align-content: start; }
#scrCareer .hubTop { grid-column: 1; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: var(--glass); border: 1px solid var(--line); }
#scrCareer .hubTop img { width: 40px; height: 48px; }
#scrCareer .hubWho { flex: 1; min-width: 0; }
#scrCareer .hubWho b { display: block; font-family: var(--f-head); font-size: 17px; letter-spacing: .06em; color: var(--gold-hi); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#scrCareer .hubWho span { font-size: 12.5px; opacity: .78; }
#scrCareer .hubOvr, #scrCareer .hubGal { text-align: center; padding: 0 6px; }
#scrCareer .hubOvr b, #scrCareer .hubGal b { display: block; font-family: var(--f-head); font-size: 22px; line-height: 1; }
#scrCareer .hubOvr span, #scrCareer .hubGal span { font-size: 11px; letter-spacing: .1em; opacity: .7; }
#scrCareer .hubMeters { grid-column: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; padding: 10px 12px; border-radius: 14px; background: var(--glass); }
#scrCareer .meter { display: grid; grid-template-columns: 52px 1fr 28px; align-items: center; gap: 6px; }
#scrCareer .meter span { font-size: 11px; letter-spacing: .1em; opacity: .75; }
#scrCareer .meter b { font-size: 13px; text-align: right; font-variant-numeric: tabular-nums; }
#scrCareer .hubMain { grid-column: 1; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
#scrCareer .evCard { padding: 14px 16px; border-radius: 16px; background: linear-gradient(160deg, rgba(40,30,12,.82), rgba(10,10,18,.8)); border: 1px solid var(--gold); box-shadow: 0 14px 40px rgba(0,0,0,.45); }
#scrCareer .evWhen { font-size: 11.5px; letter-spacing: .16em; color: var(--mist); text-transform: uppercase; }
#scrCareer .evLabel { font-family: var(--f-head); font-size: 18px; letter-spacing: .05em; color: var(--gold-hi); margin: 4px 0 6px; display: flex; gap: 8px; align-items: center; }
#scrCareer .evLabel i { font-style: normal; }
#scrCareer .evCard .vs { display: flex; align-items: center; gap: 14px; margin: 4px 0; }
#scrCareer .evCard .vs img { width: 42px; height: 52px; }
#scrCareer .evCard .vs b { font-family: var(--f-head); opacity: .6; }
#scrCareer .evSub { font-size: 13px; opacity: .8; }
#scrCareer .evCard .actions { justify-content: flex-start; margin-top: 10px; }
#scrCareer .miniTable { display: grid; gap: 2px; padding: 8px 12px; border-radius: 12px; background: var(--glass); font-size: 13px; }
#scrCareer .miniTable div { display: grid; grid-template-columns: 18px 1fr auto; gap: 8px; opacity: .8; }
#scrCareer .miniTable div.me { opacity: 1; color: var(--gold-hi); font-weight: 700; }
#scrCareer .miniTable i { font-style: normal; opacity: .6; }
#scrCareer .hubTabs { grid-column: 2; grid-row: 1 / span 4; justify-self: end; align-self: start; display: grid; gap: 7px; width: min(190px, 100%); }
#scrCareer .htab { position: relative; display: flex; align-items: center; gap: 8px; padding: 9px 13px; width: 100%; text-align: left; border-radius: 11px; background: var(--glass); border: 1px solid rgba(241,228,198,.18); font-family: var(--f-head); letter-spacing: .1em; font-size: 12.5px; cursor: pointer; min-height: 42px; }
#scrCareer .htab i { font-style: normal; }
#scrCareer .htab em { position: absolute; top: 50%; right: 8px; transform: translateY(-50%); min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--ember); font-style: normal; font-size: 11px; display: grid; place-items: center; font-family: var(--f-ui); }
#scrCareer .htab[disabled] { opacity: .35; }
#scrCareer .creator { display: grid; grid-template-columns: minmax(320px, 470px) 1fr; height: 100%; }
#scrCareer .crPanel { padding: 14px 16px; border-radius: 16px; background: var(--glass-hi); border: 1px solid var(--line); overflow-y: auto; max-height: 100%; touch-action: pan-y; }
#scrCareer .crPanel h2 { font-family: var(--f-head); color: var(--gold-hi); letter-spacing: .12em; font-size: 19px; margin: 0 0 8px; }
#scrCareer .crPanel input, #scrCareer .crPanel select { width: 100%; padding: 9px 11px; border-radius: 9px; border: 1px solid rgba(241,228,198,.25); background: rgba(0,0,0,.35); color: var(--parchment); font: inherit; font-size: 15px; -webkit-user-select: text; user-select: text; touch-action: manipulation; }
#scrCareer .crPanel input.err { border-color: var(--ember); }
#scrCareer .swatches { display: flex; gap: 6px; flex-wrap: wrap; }
#scrCareer .swatches button { width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); cursor: pointer; }
#scrCareer .swatches button.on { border-color: var(--gold-hi); box-shadow: 0 0 0 2px rgba(232,184,74,.4); }
#scrCareer .resPanel { width: min(640px, 100%); }
#scrCareer .results img { width: 34px; height: 42px; display: block; margin: 0 auto 2px; }
#scrCareer .rating { text-align: center; margin: 4px 0 10px; }
#scrCareer .rating b { font-family: var(--f-head); font-size: 34px; color: var(--gold-hi); }
#scrCareer .rating span { display: block; font-size: 11px; letter-spacing: .16em; opacity: .75; }
#scrCareer .resGoals { margin-top: 10px; display: grid; gap: 4px; font-size: 13.5px; }
#scrCareer .resGoals .ok { color: #7ae08a; }
#scrCareer .resGoals .chem { display: flex; gap: 14px; flex-wrap: wrap; opacity: .9; }
#scrCareer .resGoals .chem div { display: flex; gap: 5px; }
#scrCareer .lvlUp { margin-top: 10px; padding: 8px 12px; border-radius: 10px; text-align: center; background: linear-gradient(90deg, rgba(232,184,74,.35), rgba(232,184,74,.1)); color: var(--gold-hi); font-family: var(--f-head); letter-spacing: .12em; font-size: 13.5px; }
#scrCareer .actions.sticky, #locker .actions.sticky, #press .actions.sticky { position: sticky; bottom: -16px; padding: 10px 0 2px; background: linear-gradient(180deg, rgba(14,16,28,0), rgba(14,16,28,.95) 40%); }
#scrCareer .lvl b { font-family: var(--f-head); letter-spacing: .12em; color: var(--gold-hi); }
#scrCareer .lvl span { display: block; font-size: 12px; opacity: .75; margin-top: 4px; }
#scrCareer .lvl .bar { margin-top: 6px; }
#scrCareer .attrs { display: grid; gap: 8px; margin-top: 12px; }
#scrCareer .attr { display: grid; grid-template-columns: 78px 1fr 30px 34px; align-items: center; gap: 8px; }
#scrCareer .attr span { font-size: 13px; }
#scrCareer .attr b { text-align: right; font-variant-numeric: tabular-nums; }
#scrCareer .attr button { width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--gold); background: rgba(232,184,74,.2); color: var(--gold-hi); font-size: 18px; cursor: pointer; }
#scrCareer .attr button[disabled] { opacity: .25; }
#scrCareer .persona { padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,.04); margin-bottom: 10px; }
#scrCareer .persona > b { font-family: var(--f-head); color: var(--gold-hi); letter-spacing: .08em; }
#scrCareer .persona > span { display: block; font-size: 11px; opacity: .65; letter-spacing: .14em; margin-bottom: 6px; }
#scrCareer .pbar { display: grid; grid-template-columns: 26px 86px 1fr; align-items: center; gap: 8px; margin-top: 5px; font-size: 12px; }
#scrCareer .pbar .tone { width: 22px; height: 22px; font-size: 11px; }
#scrCareer .roster { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
#scrCareer .mate { padding: 9px 11px; border-radius: 11px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); }
#scrCareer .mate b { display: block; font-size: 14px; }
#scrCareer .mate span { font-size: 12px; opacity: .7; }
#scrCareer .mate .bar { margin-top: 6px; }
#scrCareer .rival { margin-top: 10px; padding: 9px 12px; border-radius: 11px; border: 1px solid rgba(224,83,58,.5); background: rgba(224,83,58,.1); }
#scrCareer .rival span { display: block; font-size: 12px; opacity: .75; }
#scrCareer .brooms { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
#scrCareer .broomCard { padding: 11px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); display: grid; gap: 6px; }
#scrCareer .broomCard.on { border-color: var(--gold); }
#scrCareer .broomCard b { font-family: var(--f-head); letter-spacing: .06em; color: var(--gold-hi); }
#scrCareer .broomCard small { opacity: .7; font-size: 12px; line-height: 1.3; }
#scrCareer .bstat { display: grid; grid-template-columns: 70px 1fr; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .1em; opacity: .85; }
#scrCareer .offers { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
#scrCareer .offer { padding: 12px; border-radius: 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(241,228,198,.2); display: grid; justify-items: center; gap: 4px; text-align: center; cursor: pointer; }
#scrCareer .offer img { width: 54px; height: 66px; }
#scrCareer .offer b { font-family: var(--f-head); color: var(--gold-hi); letter-spacing: .05em; }
#scrCareer .offer span { font-size: 12px; opacity: .7; }
#scrCareer .offer small { opacity: .75; font-style: italic; font-size: 12px; }
#scrCareer .ostat { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
#scrCareer .ostat i { font-style: normal; font-size: 11.5px; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,.08); }
#scrCareer .awards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; }
#scrCareer .awards div { padding: 10px; border-radius: 12px; background: rgba(255,255,255,.04); }
#scrCareer .awards img { width: 40px; }
#scrCareer .awards b { display: block; font-family: var(--f-head); color: var(--gold-hi); }
#scrCareer .awards span { font-size: 11.5px; opacity: .75; }
#scrCareer .frogCard { margin: 0 auto; width: min(320px, 100%); padding: 14px; border-radius: 14px; text-align: center; background: linear-gradient(160deg, #5a3a8a, #2a1840); border: 3px solid #d8b060; box-shadow: 0 0 30px rgba(216,176,96,.4); }
#scrCareer .frogCard .fcTop { font-family: var(--f-head); font-size: 11px; letter-spacing: .2em; color: #ffe39a; }
#scrCareer .frogCard canvas { width: 160px; height: 192px; border-radius: 8px; margin: 8px 0; border: 2px solid #d8b060; }
#scrCareer .frogCard b { font-family: var(--f-display); font-size: 20px; color: #ffe39a; }
#scrCareer .frogCard p { font-size: 13px; line-height: 1.4; opacity: .9; }
#scrCareer .paperWrap { width: min(980px, 100%); height: 100%; max-height: 100%; display: grid; grid-template-rows: auto 1fr; justify-self: center; }
#scrCareer .paperTabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; }
#scrCareer .paperTabs button { padding: 8px 12px; border-radius: 10px 10px 0 0; background: var(--glass); border: 1px solid rgba(241,228,198,.18); border-bottom: none; font-family: var(--f-head); letter-spacing: .06em; font-size: 12.5px; white-space: nowrap; cursor: pointer; }
#scrCareer .paperTabs button.on { background: #e9dfc6; color: #1d150b; }
#scrCareer .paperTabs .close { margin-left: auto; border-radius: 10px; border-bottom: 1px solid rgba(241,228,198,.18); }
#scrCareer .paperBody { display: grid; grid-template-columns: 230px 1fr; gap: 10px; min-height: 0; background: rgba(8,9,14,.75); border-radius: 0 12px 12px 12px; padding: 10px; }
#scrCareer .paperList { overflow-y: auto; display: grid; gap: 4px; align-content: start; touch-action: pan-y; }
#scrCareer .paperList button { text-align: left; padding: 8px 10px; border-radius: 9px; background: rgba(255,255,255,.04); border: 1px solid transparent; cursor: pointer; }
#scrCareer .paperList button b { display: block; font-size: 12.5px; line-height: 1.25; }
#scrCareer .paperList button span { font-size: 11px; opacity: .6; }
#scrCareer .paperList button.on { border-color: var(--gold); background: rgba(232,184,74,.12); }
#scrCareer .paperList button.fresh b::before { content: '● '; color: var(--ember); }
#scrCareer .paperEmpty { opacity: .6; padding: 20px; text-align: center; grid-column: 1 / -1; }
#scrCareer .paper { overflow-y: auto; touch-action: pan-y; background: #e9dfc6 url() ; color: #1d150b; border-radius: 8px; padding: 14px 18px; font-family: Georgia, 'Times New Roman', serif; box-shadow: inset 0 0 60px rgba(120,90,40,.35); }
#scrCareer .paper header { text-align: center; border-bottom: 3px double #3a2a14; padding-bottom: 6px; margin-bottom: 8px; }
#scrCareer .paper .mast { font-family: var(--f-display); font-size: 30px; letter-spacing: .04em; line-height: 1; }
#scrCareer .paper.quibbler .mast { font-family: Georgia, serif; font-style: italic; font-weight: 900; color: #3a1a6a; }
#scrCareer .paper.witch .mast { font-family: var(--f-head); color: #8a1a5a; letter-spacing: .14em; }
#scrCareer .paper .dateline { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; margin-top: 4px; opacity: .75; }
#scrCareer .paper h1 { font-family: var(--f-head); font-weight: 800; font-size: 25px; line-height: 1.1; margin: 6px 0; text-align: center; letter-spacing: .02em; }
#scrCareer .paper h3 { font-size: 13px; font-style: italic; text-align: center; margin: 0 0 8px; opacity: .8; }
#scrCareer .paper .photo { float: left; margin: 2px 14px 8px 0; text-align: center; }
#scrCareer .paper .photo figcaption { font-size: 10.5px; font-style: italic; opacity: .7; margin-top: 2px; }
#scrCareer .paper .photo canvas { width: min(320px, 46vw); aspect-ratio: 16 / 9; height: auto; border: 2px solid #3a2a14; filter: contrast(1.05); background: #c8b890; }
#scrCareer .paper .photo span { display: block; font-size: 10.5px; font-style: italic; opacity: .7; }
#scrCareer .paper p { font-size: 15px; line-height: 1.5; margin: 0 0 10px; text-align: justify; }
#scrCareer .paper blockquote { margin: 8px 0 8px 0; padding-left: 12px; overflow: hidden; border-left: 3px solid #8a6a3a; font-size: 15px; font-style: italic; }
#scrCareer .paper cite { display: block; font-size: 12px; font-style: normal; opacity: .7; margin-top: 2px; }
#scrCareer .quillNote { clear: both; font-size: 12px; color: #2a8a10; font-style: italic; }
#scrCareer .ltable { width: 100%; border-collapse: collapse; font-size: 13.5px; grid-column: 1 / -1; }
#scrCareer .ltable th, #scrCareer .ltable td { padding: 6px 6px; text-align: center; border-bottom: 1px solid rgba(255,255,255,.08); }
#scrCareer .ltable .l { text-align: left; }
#scrCareer .ltable img { width: 20px; height: 24px; vertical-align: middle; }
#scrCareer .ltable tr.me { color: var(--gold-hi); background: rgba(232,184,74,.1); }
#scrCareer .ltable th { font-size: 11px; letter-spacing: .12em; opacity: .7; font-weight: 600; }
#scrCareer .fix { grid-column: 1 / -1; overflow-y: auto; display: grid; gap: 3px; align-content: start; touch-action: pan-y; }
#scrCareer .fix h4 { margin: 8px 0 2px; font-family: var(--f-head); font-size: 12px; letter-spacing: .14em; color: var(--mist); }
#scrCareer .fix div { display: grid; grid-template-columns: 1fr 70px 1fr; gap: 8px; font-size: 13px; padding: 3px 6px; border-radius: 6px; }
#scrCareer .fix div span:first-child { text-align: right; }
#scrCareer .fix div b { text-align: center; }
#scrCareer .fix div.me { background: rgba(232,184,74,.12); color: var(--gold-hi); }
#scrCareer .letter { position: relative; overflow-y: auto; touch-action: pan-y; background: #efe4c8; color: #24180c; border-radius: 6px; padding: 18px 20px; font-family: Georgia, serif; box-shadow: inset 0 0 50px rgba(120,90,40,.35); }
#scrCareer .letter h3 { font-family: var(--f-head); margin: 0 0 4px; }
#scrCareer .letter .from { font-size: 12px; opacity: .7; margin-bottom: 10px; }
#scrCareer .letter p { font-size: 15px; line-height: 1.55; }
#scrCareer .letter .seal { position: absolute; right: 16px; top: 14px; width: 38px; height: 38px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #d84a3a, #7a1a12); box-shadow: 0 2px 4px rgba(0,0,0,.4); }
@keyframes bob { 50% { transform: translateY(3px); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } }
@keyframes card { 0% { opacity: 0; letter-spacing: .5em; } 20%, 75% { opacity: 1; letter-spacing: .22em; } 100% { opacity: 0; } }
#locker { position: fixed; inset: 0; z-index: 15; display: none; touch-action: none; }
#locker.on { display: block; }
#locker .lkTop { position: absolute; left: calc(12px + var(--sl)); right: calc(12px + var(--sr)); top: calc(10px + var(--st)); display: flex; gap: 12px; align-items: flex-start; pointer-events: none; }
#locker .lkTop > * { pointer-events: auto; }
#locker .lkTitle { padding: 8px 12px; border-radius: 12px; background: var(--glass); }
#locker .lkTitle b { display: block; font-family: var(--f-head); font-size: 14px; letter-spacing: .08em; color: var(--gold-hi); }
#locker .lkTitle span { font-size: 12px; opacity: .8; }
#locker .lkGoals { display: grid; gap: 3px; padding: 7px 11px; border-radius: 12px; background: var(--glass); font-size: 12.5px; max-width: 280px; }
#locker .lkGoal i { font-style: normal; color: var(--gold); margin-right: 6px; }
#locker .lkGoal.dim { opacity: .6; }
#locker .lkGoal.tac { opacity: .85; color: var(--mist); }
#locker .lkBtns { margin-left: auto; display: flex; gap: 8px; }
#locker .lkStick { position: absolute; width: 100px; height: 100px; margin: -50px 0 0 -50px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); display: none; }
#locker .lkStick.on { display: block; }
#locker .lkStick i { position: absolute; left: 30px; top: 30px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.4); }
#locker .lkHint { position: absolute; left: 50%; bottom: calc(18px + var(--sb)); transform: translateX(-50%); font-size: 12.5px; opacity: 1; transition: opacity .6s; padding: 6px 12px; border-radius: 10px; background: rgba(0,0,0,.4); pointer-events: none; }
#locker .lkCross { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: rgba(255,255,255,.7); box-shadow: 0 0 4px #000; pointer-events: none; }
#locker .lkAct { position: absolute; left: 50%; top: calc(50% + 30px); transform: translateX(-50%) scale(.9); padding: 10px 18px; border-radius: 12px; border: 1px solid var(--gold); background: rgba(20,14,4,.8); color: var(--gold-hi); font-family: var(--f-head); letter-spacing: .14em; font-size: 13px; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
#locker .lkAct.on { opacity: 1; pointer-events: auto; transform: translateX(-50%) scale(1); }
#locker .lkPanel { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(560px, 92vw); max-height: 86%; overflow-y: auto; display: none; touch-action: pan-y; }
#locker .lkPanel.on { display: block; }
#locker .lkCard { padding: 14px 16px; border-radius: 16px; background: var(--glass-hi); border: 1px solid var(--line); box-shadow: 0 20px 60px rgba(0,0,0,.5); }
#locker .lkWho b { font-family: var(--f-head); font-size: 17px; color: var(--gold-hi); letter-spacing: .06em; }
#locker .lkWho span { display: block; font-size: 12px; opacity: .75; margin-bottom: 6px; text-transform: capitalize; }
#locker .lkLine { font-size: 16px; font-style: italic; margin: 10px 0; line-height: 1.4; }
#locker .lkLine em { font-style: normal; font-size: 12px; margin-left: 6px; }
#locker .lkOpts, #locker .lkTac { display: grid; gap: 7px; }
#locker .lkOpt { display: flex; gap: 10px; align-items: center; text-align: left; padding: 10px 12px; border-radius: 11px; background: rgba(255,255,255,.05); border: 1px solid rgba(241,228,198,.2); font-size: 14.5px; cursor: pointer; }
#locker .lkTac .lkOpt { display: grid; gap: 2px; }
#locker .lkOpt b { font-family: var(--f-head); letter-spacing: .04em; }
#locker .lkOpt small { opacity: .7; font-size: 12px; }
#locker .lkOpt.on { border-color: var(--gold); background: rgba(232,184,74,.16); }
#locker .lkGoalOffer { padding: 10px 12px; border-radius: 11px; background: rgba(232,184,74,.12); border: 1px solid rgba(232,184,74,.4); font-size: 14px; }
#locker .lkGoalOffer span { display: block; margin-top: 4px; font-size: 12px; color: var(--gold-hi); }
#locker .lkDone { opacity: .7; font-size: 13.5px; }
#locker .lkStats { display: grid; gap: 6px; }
#locker .lkStats div { display: grid; grid-template-columns: 80px 1fr 28px; align-items: center; gap: 8px; font-size: 13px; }
#locker .lkStats i { font-style: normal; }
#press { position: fixed; inset: 0; z-index: 15; display: none; pointer-events: none; }
#press.on { display: block; }
#press > * { pointer-events: auto; }
#press .prTop { position: absolute; left: calc(14px + var(--sl)); top: calc(10px + var(--st)); padding: 8px 12px; border-radius: 12px; background: var(--glass); }
#press .prTop b { display: block; font-family: var(--f-head); letter-spacing: .14em; font-size: 13px; color: var(--gold-hi); }
#press .prTop span { font-size: 12px; opacity: .8; }
#press .prSkip { position: absolute; top: calc(10px + var(--st)); right: calc(14px + var(--sr)); }
#press .prReps { position: absolute; left: 50%; bottom: calc(14px + var(--sb)); transform: translateX(-50%); width: min(880px, 94vw); display: none; grid-template-columns: repeat(3, 1fr); gap: 8px; }
#press .prReps.on { display: grid; }
#press .prHint { grid-column: 1 / -1; text-align: center; font-family: var(--f-head); letter-spacing: .12em; font-size: 13px; text-shadow: 0 2px 6px #000; }
#press .prRep { display: grid; gap: 2px; text-align: left; padding: 10px 12px; border-radius: 12px; background: rgba(10,11,20,.86); border: 1px solid rgba(241,228,198,.22); cursor: pointer; }
#press .prRep b { font-family: var(--f-head); font-size: 14px; letter-spacing: .04em; }
#press .prRep span { font-size: 12px; opacity: .75; }
#press .prRep em { font-style: normal; font-size: 11px; letter-spacing: .1em; }
#press .prRep small { font-size: 11.5px; opacity: .65; line-height: 1.25; }
#press .prRep.easy em { color: #7ae08a; }
#press .prRep.mid em { color: #e8b84a; }
#press .prRep.hard em { color: #ff7a6a; }
#press .prRep.hard { border-color: rgba(255,122,106,.55) !important; }
#press .prQ { position: absolute; left: 50%; top: calc(14% + var(--st)); transform: translateX(-50%); width: min(760px, 92vw); padding: 12px 16px; border-radius: 14px; background: rgba(8,9,16,.86); border: 1px solid rgba(232,184,74,.35); display: none; }
#press .prQ.on { display: block; }
#press .prBy { font-size: 12px; opacity: .8; margin-bottom: 4px; }
#press .prBy b { font-family: var(--f-head); letter-spacing: .06em; color: var(--mist); }
#press .prText { font-size: 17px; line-height: 1.4; font-style: italic; }
#press .prTimer { margin-top: 8px; height: 3px; border-radius: 2px; background: rgba(255,255,255,.12); overflow: hidden; }
#press .prTimer i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #e0533a, #e8b84a); }
#press .prAns { position: absolute; left: 50%; bottom: calc(10px + var(--sb)); transform: translateX(-50%); width: min(900px, 96vw); display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
#press .prA { display: flex; gap: 9px; align-items: flex-start; text-align: left; padding: 9px 11px; border-radius: 12px; background: rgba(10,11,20,.9); border: 1px solid rgba(241,228,198,.22); cursor: pointer; animation: fadeUp .3s ease both; }
#press .prA b { display: block; font-family: var(--f-head); font-size: 11.5px; letter-spacing: .14em; }
#press .prA span { display: block; font-size: 13.5px; line-height: 1.3; margin: 2px 0; }
#press .prA .fx { display: flex; gap: 7px; flex-wrap: wrap; }
#press .prA .fx i { font-style: normal; font-size: 11px; letter-spacing: .08em; opacity: .8; }
#press .prToast { position: absolute; left: 50%; top: 46%; transform: translateX(-50%); display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; opacity: 0; pointer-events: none; }
#press .prToast.on { animation: card 2.4s ease both; }
#press .prToast i { font-style: normal; font-family: var(--f-head); letter-spacing: .12em; font-size: 15px; text-shadow: 0 2px 8px #000; }
#press .prToast i.quill { color: #8fd16a; opacity: .92; flex-basis: 100%; text-align: center; font-size: 13px; }
@media (max-height: 420px) {
#scrCareer .hub { grid-template-columns: minmax(280px, 380px) 1fr; gap: 6px 14px; }
#scrCareer .hubTop { padding: 6px 10px; }
#scrCareer .hubTop img { width: 30px; height: 36px; }
#scrCareer .hubMeters { padding: 6px 10px; gap: 4px 12px; }
#scrCareer .evCard { padding: 10px 12px; }
#scrCareer .evLabel { font-size: 15.5px; }
#scrCareer .evCard .vs img { width: 32px; height: 40px; }
#scrCareer .htab { padding: 5px 10px; min-height: 34px; font-size: 11.5px; }
#scrCareer .hubTabs { gap: 5px; width: 170px; }
#scrCareer .miniTable { display: none; }
#press .prA span { font-size: 12.5px; }
#press .prA { padding: 7px 9px; }
#press .prText { font-size: 15px; }
#press .prQ { top: calc(58px + var(--st)); left: 50%; right: auto; transform: translateX(-50%); width: min(640px, 72vw); padding: 8px 14px; }   /* (under the title and SKIP, not over them) */
#scrCareer .paper h1 { font-size: 20px; }
#scrCareer .paper .mast { font-size: 24px; }
#scrCareer .paper p { font-size: 14px; }
#scrCareer .paperBody { grid-template-columns: 190px 1fr; }
#scrCareer .resPanel .stats { grid-template-columns: repeat(4, 1fr); }
#scrCareer .resPanel .stat { padding: 4px 8px; }
#scrCareer .resPanel .stat b { font-size: 16px; }
#scrCareer .creator { grid-template-columns: minmax(300px, 440px) 1fr; }
#scrCareer .crPanel .row { padding: 3px 0; }
#locker .lkGoals { display: none; }


}
@media (max-width: 760px) {
#scrCareer .hub { grid-template-columns: 1fr 150px; }
#scrCareer .paperBody { grid-template-columns: 1fr; }
#scrCareer .paperList { max-height: 120px; }
#press .prReps { grid-template-columns: 1fr; }
#press .prAns { grid-template-columns: 1fr; }


}
#scrCareer body.wide .hub { grid-template-columns: minmax(340px, 480px) 1fr; }


/* the castle's own look: square gilt-edged panels, its fonts, its gold */
#scrCareer .panel, #locker .lkCard, #press .prQ, #press .prRep, #press .prA { border-radius: 3px; background: linear-gradient(180deg, rgba(24,17,10,.92), rgba(10,7,5,.93)); border: 1px solid rgba(214,170,74,.55); box-shadow: 0 0 0 1px #000, 0 20px 60px rgba(0,0,0,.6), inset 0 0 0 3px rgba(0,0,0,.35), inset 0 0 0 4px rgba(214,170,74,.1); backdrop-filter: none; -webkit-backdrop-filter: none; }
#scrCareer .panel h2 { font-weight: 500; letter-spacing: .24em; background: linear-gradient(#fffaf0 8%, #f3dfa8 48%, #c9984a 92%); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 2px 2px #000); }
#scrCareer .mbtn, #scrCareer .act, #scrCareer .seg button, #scrCareer .htab, #scrCareer .offer, #scrCareer .broomCard, #scrCareer .paperTabs button, #scrCareer .paperList button { border-radius: 2px; }
#scrCareer .act.go, #press .act.go { background: linear-gradient(180deg, #f0d48a, #b98a3a); color: #1c1206; border-color: #fff1c4; }
#scrCareer input, #scrCareer select { font: inherit; font-size: 15px; color: #f1e6ca; background: rgba(0,0,0,.35); border: 1px solid rgba(214,170,74,.45); border-radius: 2px; padding: 7px 10px; width: 100%; }
#scrCareer input.err { border-color: #ff6a5a; }
#scrCareer .creator { width: 100%; height: 100%; display: grid; grid-template-columns: minmax(300px, 46%) 1fr; align-items: center; }
#scrCareer .crPanel { max-height: 100%; overflow-y: auto; background: linear-gradient(180deg, rgba(24,17,10,.9), rgba(10,7,5,.92)); border: 1px solid rgba(214,170,74,.5); padding: 14px 18px; }
#scrCareer .crPanel h2 { font-family: var(--f-head); font-weight: 500; letter-spacing: .2em; font-size: 19px; margin: 0 0 6px; color: #f3dfa8; }
#scrCareer .note, #locker .note, #press .note { font-style: italic; opacity: .85; }
#locker .lkBtns { margin-right: 52px; } #locker .act { min-height: 36px; padding: 8px 14px; }
@media (max-height: 620px) { #scrCareer .crPanel { padding: 10px 12px; } #scrCareer .row { grid-template-columns: 92px 1fr; padding: 3px 0; } #scrCareer .seg button { padding: 4px 8px; min-height: 30px; font-size: 12px; } #scrCareer .crPanel h2 { font-size: 16px; } #scrCareer .note { font-size: 12px; } }
/* (outside review) the meters' bars had inherited the loading bar's 22 px margins: the hub ran off the Fold's cover screen */
#scrCareer .meter .bar, #scrCareer .attr .bar, #scrCareer .mate .bar, #scrCareer .bstat .bar, #locker .lkWho .bar, #locker .lkStats .bar { margin: 0; }
#scrCareer .hub { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
#scrCareer .evCard .actions { flex-wrap: nowrap; } #scrCareer .evCard .act { padding: 9px 14px; font-size: 12px; letter-spacing: .1em; white-space: nowrap; }
@media (max-height: 380px) { #scrCareer .hubMeters { grid-template-columns: repeat(4, 1fr); padding: 6px 10px; } #scrCareer .meter { grid-template-columns: 1fr auto; gap: 2px 4px; } #scrCareer .meter .bar { grid-column: 1 / -1; grid-row: 2; }
  #scrCareer .evCard .vs { display: none; } #scrCareer .evCard { padding: 10px 12px; } #scrCareer .hubTop { padding: 6px 10px; } }
/* the NEEDLER's card is red-edged; the hardest question is not the safe one */
#press .prRep.hard { border-color: rgba(255,122,106,.55) !important; }
svg.qi { width: 1.2em; height: 1.2em; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; vertical-align: -0.24em; flex: none; }
.tone svg.qi { width: 15px; height: 15px; vertical-align: 0; } #scrCareer .pbar .tone svg.qi { width: 13px; height: 13px; }
@media (max-height: 620px) and (min-aspect-ratio: 16/10) { #scrCareer .resPanel { justify-self: end; width: min(540px, 57vw); } }
/* the creator's BEGIN stays in reach while the form scrolls */
#scrCareer .crPanel > .actions { position: sticky; bottom: -14px; margin: 10px -16px -14px; padding: 10px 16px 12px; background: linear-gradient(180deg, rgba(24,17,10,0), rgba(24,17,10,.96) 30%); z-index: 2; }
/* the creator's three pages and its faces */
#scrCareer .crTabs { display: flex; gap: 4px; margin: 0 0 8px; border-bottom: 1px solid var(--line); }
#scrCareer .crTabs button { flex: 1; padding: 8px 6px 9px; min-height: 40px; background: none; border: 0; border-bottom: 2px solid transparent; font-family: var(--f-head); letter-spacing: .12em; font-size: 12px; text-transform: uppercase; opacity: .7; cursor: pointer; }
#scrCareer .crTabs button.on { opacity: 1; color: var(--gold-hi); border-bottom-color: var(--gold); }
#scrCareer .crPage { display: grid; gap: 0; } #scrCareer .crPage[hidden] { display: none !important; }
#scrCareer .seg.looks { gap: 6px; } #scrCareer .seg.looks button { width: 48px; height: 48px; min-height: 0; padding: 2px; border-radius: 50% !important; display: grid; place-items: center; }
#scrCareer .seg.looks button.on { box-shadow: 0 0 0 2px var(--gold), 0 0 14px rgba(232,184,74,.45); }
#scrCareer .seg.looks svg.face { width: 42px; height: 42px; border-radius: 50%; }
#scrCareer .crWhy { margin: 8px 0 0; font-size: 13px; }
#scrCareer .seg button { min-height: 40px; }
@media (max-height: 620px) { #scrCareer .seg button { min-height: 38px; } #scrCareer .crTabs button { min-height: 36px; padding: 6px; } #scrCareer .seg.looks button { width: 44px; height: 44px; } #scrCareer .seg.looks svg.face { width: 38px; height: 38px; } }
/* results: the three numbers that matter, large, counting up; the rest in a line */
#scrCareer .potm { display: flex; align-items: center; justify-content: center; gap: 8px; margin: -2px 0 6px; font-family: var(--f-head); letter-spacing: .2em; font-size: 12px; color: #241400; background: linear-gradient(90deg, rgba(240,196,90,0), #f0c45a 20%, #f0c45a 80%, rgba(240,196,90,0)); padding: 4px 0; }
#scrCareer .keyRow { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 8px; align-items: end; margin: 4px 0 6px; text-align: center; }
#scrCareer .key b { display: block; font-family: var(--f-display); font-size: 36px; line-height: 1; font-variant-numeric: tabular-nums; color: #f6ead0; }
#scrCareer .key i { display: block; font-style: normal; font-size: 11px; letter-spacing: .16em; opacity: .75; margin-top: 4px; }
#scrCareer .key.rate { position: relative; } #scrCareer .key.rate b { font-size: 46px; color: var(--gold-hi); }
#scrCareer .key.rate u { display: block; height: 4px; margin: 6px auto 0; width: 70%; border-radius: 2px; background: linear-gradient(90deg, var(--gold) calc(var(--k, 1) * var(--r) * 100%), rgba(255,255,255,.12) 0); }
#scrCareer .resLine { text-align: center; font-style: italic; opacity: .85; margin: 4px 0 6px; font-size: 14px; }
#scrCareer .gains { display: flex; justify-content: center; gap: 16px; font-family: var(--f-head); font-size: 12.5px; letter-spacing: .1em; color: var(--gold-hi); margin-bottom: 4px; } #scrCareer .gains .dn { color: #ff8a7a; }
@media (max-height: 620px) { #scrCareer .key b { font-size: 28px; } #scrCareer .key.rate b { font-size: 36px; } #scrCareer .results .big { font-size: 30px; } #scrCareer .resLine { margin: 2px 0 4px; font-size: 13px; } }
/* the hub: one quiet card style for who you are and how you stand; the event alone in gold */
#scrCareer .hubTop, #scrCareer .hubMeters { border-radius: 3px !important; background: linear-gradient(180deg, rgba(20,15,10,.84), rgba(10,8,6,.84)) !important; border: 1px solid rgba(214,170,74,.26) !important; box-shadow: none !important; }
/* the huddle's two buttons sit over the thumb, above TALK (they were up in the top corner) */
body.touch #locker .lkBtns { position: fixed; right: calc(12px + env(safe-area-inset-right)); bottom: calc(150px * var(--tu, 1) + env(safe-area-inset-bottom)); margin: 0; flex-direction: column; align-items: flex-end; gap: 8px; }
body.touch #locker .lkBtns .act.go { order: -1; min-height: 46px; padding: 10px 18px; }
#locker .lkGate { position: absolute; transform: translate(-50%, -100%); pointer-events: none; font-family: var(--f-head); letter-spacing: .16em; font-size: 12px; color: #241400; background: linear-gradient(180deg, #f0d48a, #b98a3a); padding: 5px 12px; border-radius: 2px; box-shadow: 0 0 0 1px #000, 0 6px 18px rgba(0,0,0,.5); white-space: nowrap; display: none; }
#locker .lkGate.on { display: block; } #locker .lkGate:after { content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px; border: 6px solid transparent; border-bottom: 0; border-top-color: #b98a3a; }
#scrCareer .seg.looks { display: grid !important; grid-template-columns: repeat(6, minmax(0, 46px)); gap: 5px; }
#scrCareer .seg.looks button { width: 100% !important; height: auto !important; aspect-ratio: 1; }
#scrCareer .seg.looks svg.face { width: 88% !important; height: 88% !important; }
#scrCareer .crPanel > .actions { flex-wrap: nowrap; } #scrCareer .crPanel > .actions [hidden] { display: none !important; }
#scrCareer .menuGrid .mhead { grid-column: 1 / -1; font-family: var(--f-head); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--mist); margin: 4px 0 -2px; }
#scrCareer .mbtn.q { padding: 8px 12px; } #scrCareer .mbtn.q b { font-size: 13px; }
#scrCareer .paperEmpty { display: grid; gap: 6px; place-items: center; text-align: center; padding: 48px 20px; } #scrCareer .paperEmpty b { font-family: var(--f-display); font-size: 26px; color: var(--gold-hi); } #scrCareer .paperEmpty span { opacity: .8; font-style: italic; }
@media (max-height: 620px) { #scrCareer .attr { padding: 2px 0 !important; } #scrCareer .attr button { width: 30px; height: 30px; min-height: 0; } #scrCareer .panel.wide .stats .stat { padding: 3px 8px; } }
/* the broom shop: every card the same shape, the broom drawn, the price you cannot pay greyed with what you lack */
#scrCareer .broomCard { grid-template-rows: auto auto auto auto 1fr auto; align-content: stretch; }
#scrCareer .broomCard svg.bart { width: 100%; height: 30px; }
#scrCareer .broomCard small { min-height: 2.6em; } #scrCareer .broomCard .act { align-self: end; }
#scrCareer .broomCard .need { font-size: 11px; text-align: center; color: #ff9a8a; margin-top: -2px; }
#scrCareer .act[disabled] { background: rgba(255,255,255,.035) !important; color: rgba(241,228,198,.5) !important; border-color: rgba(241,228,198,.14) !important; cursor: default; box-shadow: none !important; }
#scrCareer .act svg.qi { width: 1em; height: 1em; vertical-align: -0.12em; }
`;
