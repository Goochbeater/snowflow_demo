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
body.touch #hlQuest .o:after { content: ''; }`;
  document.head.appendChild(css);
  HL.START.push((L) => { const E = HL.ui.el; if (E && E.Quest && !E.Quest._tap) { E.Quest._tap = true; E.Quest.addEventListener('click', () => { E.Quest.classList.add('full'); clearTimeout(E.Quest._ft); E.Quest._ft = setTimeout(() => E.Quest.classList.remove('full'), 5000); }); }
    L.updates.push(() => { if (!TOUCH.on || MG.state !== 'play') return; const H = HL.ui.el.Hint; if (!H || !H.classList.contains('on')) return;
      if (/look around/i.test(H.textContent)) { if (HL.save.looked) { H.classList.remove('on'); HL.ui.hintT = 0; } else if (Math.abs(IN.A.lx) + Math.abs(IN.A.ly) > 0.002) { HL.save.looked = 1; HL.store(); MG.after(0.8, () => { if (/look around/i.test(H.textContent)) { H.classList.remove('on'); HL.ui.hintT = 0; } }, true); } } }); }); }
