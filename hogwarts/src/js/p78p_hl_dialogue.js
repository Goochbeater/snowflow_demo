/* ==== p78p_hl_dialogue.js ==== */
/* HOGWARTS — people speak in a dialogue box, not a banner: a name plate, the line written out as it is said, at the foot
   of the screen; the speaker turns to you while it is up. (Banners are kept for places, quests and rewards.) */
HL.START.push(function (L) { const U = HL.ui; if (!U.el || !U.el.Hud) return; let el = document.getElementById('hlSay');
  if (!el) { const css = document.createElement('style'); css.textContent = `
#hlSay{position:absolute;left:50%;bottom:21%;transform:translateX(-50%) translateY(8px);width:min(780px,78vw);padding:14px 28px 17px;background:linear-gradient(rgba(22,15,9,.96),rgba(10,7,5,.94));border:1px solid rgba(214,170,74,.6);border-radius:3px;box-shadow:0 12px 44px rgba(0,0,0,.65),inset 0 0 0 3px rgba(0,0,0,.4),inset 0 0 0 4px rgba(214,170,74,.14);opacity:0;transition:opacity .28s,transform .28s;pointer-events:none;z-index:7}
#hlSay.on{opacity:1;transform:translateX(-50%) translateY(0)}
#hlSay .nm{font-family:HLA,Georgia,serif;font-size:14px;letter-spacing:.26em;color:#e2b84e;text-transform:uppercase;display:flex;align-items:center;gap:12px}
#hlSay .nm:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(214,170,74,.7),transparent)}
#hlSay .nm:before{content:'❖';font-size:12px;color:#c79a3a}
#hlSay .tx{font-family:HLB,Georgia,serif;font-size:21px;line-height:1.38;color:#f1e6ca;margin-top:7px;min-height:58px;text-shadow:0 1px 3px #000}
#hlSay .tx .rest{opacity:0}
#hlSay .more{position:absolute;right:16px;bottom:8px;font-family:HLA,Georgia,serif;font-size:10px;letter-spacing:.24em;color:rgba(226,184,78,.75)}`; document.head.appendChild(css);
    el = document.createElement('div'); el.id = 'hlSay'; el.innerHTML = '<div class="nm"></div><div class="tx"><span class="shown"></span><span class="rest"></span></div><div class="more"></div>'; U.el.Hud.appendChild(el); }
  const S = HL.SAYBOX = { el, t: 0, n: 0, text: '', who: null, on: false }, nm = el.querySelector('.nm'), shown = el.querySelector('.shown'), rest = el.querySelector('.rest'), more = el.querySelector('.more');
  /* say(name, line, seconds, speaker actor, hint for the corner e.g. 'E — MORE') */
  U.say = function (name, line, dur, who, hint) { if (!line) return; S.text = String(line); S.n = 0; S.t = Math.max(dur || 0, 2.6 + S.text.length * 0.052); S.who = who || null; S.on = true; nm.textContent = name || ''; nm.style.display = name ? '' : 'none'; shown.textContent = ''; rest.textContent = S.text; more.textContent = hint || ''; el.classList.add('on'); dim(true); if (HL.SAY && HL.SAY.el) HL.SAY.el.style.opacity = 0; if (U.el.Toast) { U.el.Toast.classList.remove('on'); U.toastT = 0; } };
  const dim = (on) => { for (const k of ['Hint', 'Prompt', 'Use']) if (U.el[k]) U.el[k].style.visibility = on ? 'hidden' : ''; };
  U.sayOff = function () { S.on = false; S.who = null; el.classList.remove('on'); dim(false); };
  L.updates.push((dt) => { if (!S.on) return; const P = PLAYER.a; if (MG.state !== 'play' || HL.Q.on || (HL.duel && HL.duel.on && HL.duel.phase === 'fight')) { U.sayOff(); return; }
    if (S.n < S.text.length) { S.n = Math.min(S.text.length, S.n + dt * 62); const k = Math.floor(S.n); shown.textContent = S.text.slice(0, k); rest.textContent = S.text.slice(k); }
    S.t -= dt; const w = S.who; if (w && P) { const d = Math.hypot(w.x - P.x, w.z - P.z); if (d > 9) S.t = Math.min(S.t, 0.2); else if (w.turn !== false && w.sitY === undefined && !w.ghost) { /* the speaker turns to face you */ const ty = Math.atan2(P.x - w.x, P.z - w.z); w.yaw += wrapA(ty - w.yaw) * Math.min(1, dt * 4); } }
    if (S.t <= 0) U.sayOff(); });
});
/* whenever a screen comes up (the map, the journal, the pack, the pause) nothing spoken is left hanging over it */
{ const s0 = HL.ui.screen; HL.ui.screen = function (html) { if (html) { if (HL.SAY && HL.SAY.el) HL.SAY.el.style.opacity = 0; if (HL.SAYBOX && HL.SAYBOX.on && HL.ui.sayOff) HL.ui.sayOff(); } return s0.call(this, html); }; }
