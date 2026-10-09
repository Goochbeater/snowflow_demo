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
  const m0 = HL.ui.onMount; HL.ui.onMount = function (on) { const E = HL.ui.el.Hint, had = E.innerHTML; m0.apply(this, arguments); if (on && E.innerHTML !== had) E.dataset.fly = '1';
    else if (!on && E.dataset.fly) { E.classList.remove('on'); HL.ui.hintT = 0; delete E.dataset.fly; } }; }
/* QUIT TO TITLE asks twice (it sat under the thumb and quit on one tap); the legal line and the build stamp keep out of the buttons' way */
{ const p0 = HL.ui.pause; HL.ui.pause = function () { p0.apply(this, arguments); if (MG.state !== 'pause') return; const b = HL.ui.el.Screen.querySelector('.hlBtn[data-a="t"]'); if (!b) return; const go = b.onclick, t0 = b.textContent;
  b.onclick = function (e) { if (!b.classList.contains('tcSure')) { b.classList.add('tcSure'); b.textContent = 'TAP AGAIN TO QUIT'; setTimeout(() => { if (b.isConnected) { b.classList.remove('tcSure'); b.textContent = t0; } }, 3000); return; } return go.call(this, e); }; }; }
{ const t0 = HL.ui.title; HL.ui.title = function () { t0.apply(this, arguments); const U = HL.ui, v = U.el.Screen.querySelector('.hlTitle .v'); if (v && !MG.flags.debug) v.style.display = 'none';
  /* nothing from the game left over the logo (a location card or a hint still running when you quit) */ U.el.Toast.classList.remove('on'); U.toastT = 0; U.el.Hint.classList.remove('on'); U.hintT = 0; }; }
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
