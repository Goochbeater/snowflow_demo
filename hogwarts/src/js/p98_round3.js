/* ==== p98_round3.js ==== */
/* ROUND 3 — from the second outside review (3/10). Quidditch presented as a sport on television: a goal is replayed from
   beside the hoop it went through, and nothing of the last goal is left on the screen at full time. */
{ const Q = HL.Q;
  /* the replay: two and a half seconds turning about the scoring hoop, slowed, then back behind you (a goal was a word
     popped over an unchanged camera) */
  const g0 = Q.goal; Q.goal = function (team, hoop) {
    const r = g0.apply(this, arguments);
    if (Q.on && Q.phase === 'play' && !Q.tut && hoop && !CAM.cine) {
      const h = V3(hoop.x, hoop.y, hoop.z), side = Math.sign(hoop.z - HL.PITCH.z) || 1, a0 = side > 0 ? 0.6 : PI + 0.6, mine = team === 0, dur = mine ? 2.6 : 1.8;
      MG.slowmo = 0.4; MG.slowmoT = 0; MG.slowmoDur = mine ? 1.4 : 0.9;
      CAM.play({ dur, fov: 44, hold: false, fn: (t) => { const a = a0 + t * 0.55, rr = 9.5 - t * 0.8; return { pos: _v1.set(h.x + Math.sin(a) * rr, h.y + 1.2 - t * 0.5, h.z - side * Math.abs(Math.cos(a)) * rr), look: _v2.copy(h) }; },
        onEnd: () => { const Rd = HL.fly && HL.fly.R; CAM.reset(Rd ? Rd.yaw : CAM.yaw); CAM.pitch = -0.12; } });
    }
    return r;
  };
  /* at the final whistle the last goal's word goes before the result is called (it lay under GRYFFINDOR WIN!) */
  const e0 = Q.end; Q.end = function () { const E = HL.ui.el; if (E && E.Pop) { E.Pop.classList.remove('on'); E.Pop.textContent = ''; } if (CAM.cine && !CAM.cine.hold) CAM.cine = null; return e0.apply(this, arguments); };
}
/* the HUD on a phone, thinner (round 3: "about 40 % of a 412-px frame is chrome"):
   - a card that comes up (a new side quest, a place) sits below the top bar and the points step aside while it shows;
   - the look hint retires for good the first time you drag to look;
   - the tracker is the quest's name and one line of what to do; a tap shows the whole objective for a few seconds */
{ const css = document.createElement('style'); css.textContent = `
body.touch #hlToast { top: 24% !important; } @media (max-height: 380px) { body.touch #hlToast { top: 20% !important; } }
body.touch:has(#hlToast.on) :is(#hlPts, #hlGold) { opacity: 0; transition: opacity .3s; }
body.touch #hlQuest .t { display: none; } body.touch #hlQuest { pointer-events: auto; }
body.touch #hlQuest:not(.full) .o { -webkit-line-clamp: 1 !important; line-clamp: 1 !important; }
body.touch #hlQuest .o:after { content: ''; }
body:has(#lkPanel.on) #hlPrompt, body:has(#lkPanel.on) #lkGate { visibility: hidden !important; }`;
  document.head.appendChild(css);
  HL.START.push((L) => { const E = HL.ui.el; if (E && E.Quest && !E.Quest._tap) { E.Quest._tap = true; E.Quest.addEventListener('click', () => { E.Quest.classList.add('full'); clearTimeout(E.Quest._ft); E.Quest._ft = setTimeout(() => E.Quest.classList.remove('full'), 5000); }); }
    L.updates.push(() => { if (!TOUCH.on || MG.state !== 'play') return; const H = HL.ui.el.Hint; if (!H || !H.classList.contains('on')) return;
      if (/look around/i.test(H.textContent)) { if (HL.save.looked) { H.classList.remove('on'); HL.ui.hintT = 0; } else if (Math.abs(IN.A.lx) + Math.abs(IN.A.ly) > 0.002) { HL.save.looked = 1; HL.store(); MG.after(0.8, () => { if (/look around/i.test(H.textContent)) { H.classList.remove('on'); HL.ui.hintT = 0; } }, true); } } }); }); }
/* the World Cup opens as itself: a bumper (QUIDDITCH WORLD CUP in gold on black, the round under it) before the
   lower-third, and the lower-third at 0.85 on the Fold's cover so its lines do not run into each other (round 3) */
{ const Q = HL.Q, css = document.createElement('style'); css.textContent = `
#qcWC { position: absolute; inset: 0; z-index: 40; display: grid; place-content: center; text-align: center; pointer-events: none; background: radial-gradient(ellipse at center, rgba(14,10,4,.92), rgba(0,0,0,.97) 70%); opacity: 0; transition: opacity .45s; }
#qcWC.on { opacity: 1; } #qcWC b { display: block; font: 400 min(7vw, 15vh, 64px) 'HLA', Georgia, serif; letter-spacing: .22em; padding-left: .22em; background: linear-gradient(#fff6d8, #f0cf7c 50%, #b88a36); -webkit-background-clip: text; background-clip: text; color: transparent; }
#qcWC i { display: block; margin-top: 12px; font: italic min(2.2vw, 4.4vh, 18px) 'HLB', Georgia, serif; letter-spacing: .1em; color: #e9dcb8; } #qcWC u { display: block; width: min(40vw, 380px); height: 1px; margin: 14px auto 0; background: linear-gradient(90deg, transparent, #e8c56e, transparent); }
@media (max-height: 380px) { #qcLT { transform-origin: left bottom; } #qcLT.on { transform: scale(.85) !important; } }`;
  HL.START.push(() => { if (!css.isConnected) document.head.appendChild(css); });
  const i0 = Q.intro; Q.intro = function () { const r = i0.apply(this, arguments); const M = typeof QC !== 'undefined' && QC.match, ev = M && M.ev;
    if (ev && ev.comp === 'wc') { let el = document.getElementById('qcWC'); if (!el) { el = document.createElement('div'); el.id = 'qcWC'; (HL.ui.root || document.body).appendChild(el); }
      el.innerHTML = `<b>QUIDDITCH WORLD CUP</b><u></u><i>${ev.label || ''}</i>`; el.classList.add('on'); const lt = document.getElementById('qcLT'); if (lt) lt.style.visibility = 'hidden';
      MG.after(2.4, () => { el.classList.remove('on'); if (lt) lt.style.visibility = ''; }, true); }
    return r; }; }
/* flight into the sun: the bloom starts higher outdoors, and a soft dark scrim sits behind the right thumb's buttons so cream
   on a white sky still reads (round 3: "the flight buttons sit on white") */
{ const css = document.createElement('style'); css.textContent = `
body.touch #tc::before { content: ''; position: fixed; right: 0; bottom: 0; width: min(46vw, 420px); height: min(78vh, 360px); pointer-events: none; background: radial-gradient(ellipse at 82% 78%, rgba(6,5,8,.38), rgba(6,5,8,.16) 45%, rgba(6,5,8,0) 72%); z-index: -1; }
body.touch:not([data-tm="foot"]):not([data-tm="fly"]):not([data-tm="match"]) #tc::before { display: none; }`;
  document.head.appendChild(css);
  HL.START.push(() => { HL._bThr = Math.max(1.32, HL._bThr || 0); }); }
/* career panels that run past the screen say so (a chevron at the foot that goes when you reach the end), and the type
   floor rises: nothing that has to be read below 10.5 px (round 3: 9-10 px labels throughout) */
{ const css = document.createElement('style'); css.textContent = `
#scrCareer .panel.more::before { content: ''; position: sticky; float: right; top: calc(100% - 26px); width: 14px; height: 14px; margin: -14px 2px 0 0; border-right: 2px solid rgba(240,212,140,.85); border-bottom: 2px solid rgba(240,212,140,.85); transform: rotate(45deg); animation: qcMore 1.4s ease-in-out infinite; z-index: 3; pointer-events: none; }
@keyframes qcMore { 0%, 100% { opacity: .35; translate: 0 -3px; } 50% { opacity: 1; translate: 0 2px; } }
html body .hlTitle .cr { font-size: 10.5px !important; } .hlH .tr { font-size: max(11px, 1em) !important; } .hlJ .foot { font-size: 11px !important; opacity: .85; }
#scrCareer .broomCard .need { font-size: 11px !important; letter-spacing: .04em; }`;
  document.head.appendChild(css);
  const mark = () => { const p = document.querySelector('#scrCareer .panel'); if (!p) return; const upd = () => p.classList.toggle('more', p.scrollHeight - p.clientHeight - p.scrollTop > 8); upd(); if (!p._more) { p._more = true; p.addEventListener('scroll', upd, { passive: true }); } };
  if (typeof CareerUI !== 'undefined') { const s0 = CareerUI.show; CareerUI.show = function () { const r = s0.apply(this, arguments); requestAnimationFrame(mark); setTimeout(mark, 300); return r; }; } }
