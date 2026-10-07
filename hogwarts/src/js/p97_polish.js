/* ==== p97_polish.js ==== */
/* POLISH — from the outside review: a match that ends like one (FULL TIME on the board, the controls put away, the
   whistle's toast alone on screen), a status line that does not cry "loose Quaffle" during the flyover, and the first
   flight's controls hint put away when you land. */
{ const Q = HL.Q;
  const st0 = Q.status; Q.status = function () { if (Q.phase === 'intro' || Q.phase === 'count') return 'Brooms up…'; if (Q.phase === 'over') return '<b>FULL TIME</b>'; return st0.apply(this, arguments); };
  const end0 = Q.end; Q.end = function () { const was = Q.phase; const r = end0.apply(this, arguments); if (was !== 'over' && Q.phase === 'over') { const U = HL.ui; U.el.Hint.classList.remove('on'); U.hintT = 0; } return r; };
}
/* on glass the controls go away at the whistle */
{ const m0 = TOUCH.modeNow; TOUCH.modeNow = function () { const m = m0.apply(this, arguments); return m === 'match' && HL.Q.phase === 'over' ? 'wait' : m; }; }
/* the flight controls hint goes when you land (it used to linger over the castle for its full ten seconds) */
{ const h0 = HL.ui.hint; HL.ui.hint = function () { delete HL.ui.el.Hint.dataset.fly; return h0.apply(this, arguments); };
  const m0 = HL.ui.onMount; HL.ui.onMount = function (on) { const E = HL.ui.el.Hint, had = E.innerHTML; m0.apply(this, arguments); if (on && E.innerHTML !== had) E.dataset.fly = '1';
    else if (!on && E.dataset.fly) { E.classList.remove('on'); HL.ui.hintT = 0; delete E.dataset.fly; } }; }
