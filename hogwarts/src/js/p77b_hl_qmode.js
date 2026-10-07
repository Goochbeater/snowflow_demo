/* ==== p77b_hl_qmode.js ==== */
/* HOGWARTS — Quidditch as the main event: its own entry on the title screen. Pick a house, a position (Chaser or
   Seeker), a difficulty and a match length; play a friendly or the House Cup (the three other houses in turn, a
   league table); a flying camera introduces each match and a results card closes it. */
(function () {
  const Q = HL.Q, C = HL.PITCH, U = HL.ui;
  Q.set = { house: 'gryffindor', rival: 'slytherin', role: 'chaser', diff: 1, len: 300, cup: false, sn: 30 };
  try { const s = JSON.parse(localStorage.getItem('hl_qset') || 'null'); if (s) Object.assign(Q.set, s); } catch (e) { /* */ }
  Q.best = {}; try { Q.best = JSON.parse(localStorage.getItem('hl_qbest') || '{}') || {}; } catch (e) { /* */ }
  Q.intro = function () {   // a sweep round the pitch, the two sides drawn up facing one another
    const t0 = 0; CAM.play({ dur: 5.4, fov: 48, hold: false, fn: (t) => { const a = 0.6 + t * 0.34, r = 62 - t * 5; return { pos: _v1.set(C.x + Math.sin(a) * r * 0.8, Q.Y0 + 26 - t * 2.4, C.z + Math.cos(a) * r), look: _v2.set(C.x, Q.Y0 + 9, C.z) }; }, onEnd: () => { CAM.reset(0); } }); void t0; };
  Q.setup = function (story) {
    U.build(); MG.state = 'house'; Q.pitchCam = true; U.show(false); if (document.exitPointerLock) document.exitPointerLock(); const S = Q.set, hs = Object.keys(HL.HOUSES); if (story) { S.house = HL.house; S.cup = false; if (S.rival === S.house) S.rival = Q.RIVAL[S.house]; }
    const opt = (k, v, label) => `<div class="hlBtn ${S[k] === v ? 'sel' : ''}" data-k="${k}" data-v="${v}">${label}</div>`;
    const draw = () => { if (S.rival === S.house) S.rival = Q.RIVAL[S.house]; if (S.sn !== 150) S.sn = 30; let done = false; try { done = !!localStorage.getItem('hl_qtut'); } catch (e) { /* */ }
      const el = U.screen(`<div class="hlSort"><h3>QUIDDITCH</h3><p>${S.cup ? 'The House Cup — three matches, one against each rival house. Most points lifts the cup.' : 'A single match. Choose your side and your rival.'}</p>
        <div class="hlHouses" style="gap:12px">${hs.map((k) => `<div class="hlH ${k === S.house ? 'sel' : ''}" data-h="${k}" style="--a:${HL.HOUSES[k].css}; --b:#0c0a10; height:min(34vh,290px); width:min(15vw,180px)">${U.crest(k)}<div class="nm" style="font-size:15px">${HL.HOUSES[k].name.toUpperCase()}</div><div class="tr">${k === S.house ? 'YOUR TEAM' : (!S.cup && k === S.rival ? 'RIVAL' : '')}</div></div>`).join('')}</div>
        <div class="hlRow">${story ? '' : opt('cup', false, 'FRIENDLY') + opt('cup', true, 'HOUSE CUP')}${opt('role', 'chaser', 'CHASER')}${opt('role', 'seeker', 'SEEKER')}</div>
        <div class="hlRow">${Q.DIFF.map((d, i) => opt('diff', i, d.n + (Q.best[i] ? ' <span style="color:#ffd24a;letter-spacing:0">' + '★'.repeat(Q.best[i]) + '</span>' : ''))).join('')}${opt('len', 180, '3 MIN')}${opt('len', 300, '5 MIN')}${opt('len', 480, '8 MIN')}</div>
        <div class="hlRow">${S.role === 'seeker' ? '' : opt('sn', 30, 'SNITCH · 30') + opt('sn', 150, 'SNITCH · 150 (CLASSIC)')}</div>
        <div class="hlRow"><div class="hlBtn" data-go="1" style="min-width:280px;font-size:18px">TAKE THE FIELD</div><div class="hlBtn" data-les="1" style="${done ? '' : 'border-color:#ffe28a;color:#ffe9b0;box-shadow:0 0 18px rgba(255,210,90,0.35)'}">FLYING LESSON${done ? '' : ' · START HERE'}</div><div class="hlBtn" data-back="1">BACK</div></div>
        <p style="margin-top:10px;font-size:13.5px;color:#cfc6b0"><kbd>W</kbd> fly · <b>mouse</b> steer · <kbd>SHIFT</kbd> boost · <kbd>LMB</kbd> shoot (hold) / lunge · <kbd>E</kbd> pass / call · <kbd>F</kbd> face the play · <kbd>R</kbd> roll</p>
        <p style="margin-top:14px;font-size:14px">${S.role === 'seeker' ? 'Seeker: find the Golden Snitch, hold its slipstream until your hand closes on it — 150 points and the match.' : 'Chaser: carry, pass and shoot the Quaffle through the far hoops, ten points a goal. Late on the Snitch is loosed: ' + S.sn + ' points and the final whistle to the side whose Seeker takes it.'} ${story ? '' : 'Click a house to make it yours; click another to choose your rival.'}</p></div>`);
      el.querySelectorAll('.hlH').forEach((e) => e.onclick = () => { const h = e.dataset.h; if (story) { if (h !== S.house) S.rival = h; } else if (h === S.house) { /* same */ } else if (e.classList.contains('sel') || S.cup) S.house = h; else if (h === S.rival) { S.house = h; S.rival = Q.RIVAL[h]; } else S.rival = h; draw(); });
      el.querySelectorAll('.hlH').forEach((e) => e.ondblclick = () => { if (!story) { S.house = e.dataset.h; draw(); } });
      el.querySelectorAll('[data-k]').forEach((e) => e.onclick = () => { const k = e.dataset.k, v = e.dataset.v; S[k] = k === 'cup' ? v === 'true' : k === 'role' ? v : +v; draw(); });
      el.querySelector('[data-go]').onclick = () => Q.launch(story); el.querySelector('[data-les]').onclick = () => Q.lesson(story); el.querySelector('[data-back]').onclick = () => { Q.pitchCam = false; if (story) { U.screen(''); MG.state = 'play'; U.show(true); MG.onKey = null; } else U.title(); }; };
    draw(); MG.onKey = (c) => { if (c === 'Enter') Q.launch(story); else if (c === 'Escape') { Q.pitchCam = false; if (story) { U.screen(''); MG.state = 'play'; U.show(true); MG.onKey = null; } else U.title(); } };
  };
  Q.lesson = (story) => Q.launch(story, { tut: true, role: 'chaser', diff: 0 });
  Q.launch = async function (story, extra) {
    const S = Q.set; if (S.sn !== 150) S.sn = 30; MG.onKey = null; Q.pitchCam = false; try { localStorage.setItem('hl_qset', JSON.stringify(S)); } catch (e) { /* */ }
    U.fade(1); await new Promise((r) => setTimeout(r, 500)); U.screen('');
    if (!story) { HL.house = S.house; U.theme(); if (HL.onHouse) await HL.onHouse(); const n = HL.student(S.house, HL.witch, 0); await CAST.need([n]); CHAR.T.maul = CHAR.T[n]; PLAYER.spawn(Q.REF[0] + 3, Q.Y0, Q.REF[2], HALF);
      if (extra && extra.tut) { /* the lesson is no part of a cup */ } else { if (S.cup && !Q.cup) Q.cup = { i: 0, rivals: Object.keys(HL.HOUSES).filter((h) => h !== S.house), table: {}, house: S.house }; if (!S.cup) Q.cup = null; } }
    const rival = Q.cup && !(extra && extra.tut) ? Q.cup.rivals[Q.cup.i] : S.rival;
    R.setShadowBox(HL.shadowFoot || 46, 1300); MG.state = 'play'; U.show(true); U.el.Pts.style.display = story ? '' : 'none'; IN.buf = {};
    await Q.start(Object.assign({ house: S.house, rival, diff: S.diff, len: S.len, role: S.role, arcade: !story, sn: S.sn }, extra || {}));
  };
  Q.results = function () {
    const r = Q.result, S = Q.set, st = r.stats, A = HL.HOUSES[r.teams[0]], B = HL.HOUSES[r.teams[1]]; MG.state = 'house'; Q.pitchCam = true; U.show(false); if (document.exitPointerLock) document.exitPointerLock();
    let cupHtml = '', last = false;
    if (Q.cup) { const T = Q.cup.table; T[r.teams[0]] = (T[r.teams[0]] || 0) + r.a; T[r.teams[1]] = (T[r.teams[1]] || 0) + r.b; Q.cup.wins = (Q.cup.wins || 0) + (r.win ? 1 : 0); Q.cup.i++; last = Q.cup.i >= Q.cup.rivals.length;
      const rows = Object.keys(HL.HOUSES).map((h) => [h, T[h] || 0]).sort((p, q) => q[1] - p[1]);
      cupHtml = `<div class="hlKeys" style="grid-template-columns:auto auto;margin-top:14px">${rows.map(([h, p], i) => `<b style="color:${HL.HOUSES[h].css}">${i + 1}. ${HL.HOUSES[h].name.toUpperCase()}</b><span>${p} pts</span>`).join('')}</div>` + (last ? `<h3 style="margin-top:10px">${rows[0][0] === Q.cup.house ? 'THE HOUSE CUP IS YOURS' : HL.HOUSES[rows[0][0]].name.toUpperCase() + ' LIFT THE CUP'}</h3>` : `<p>Next: ${HL.HOUSES[Q.cup.rivals[Q.cup.i]].name}</p>`); }
    /* three stars to play for: the win, five goals of your own (or the Snitch in your hand), and a win by fifty */
    const stars = (r.win ? 1 : 0) + (st.goals >= 5 || st.snitch ? 1 : 0) + (r.win && r.a - r.b >= 50 ? 1 : 0), dI = (Q.opt && Q.opt.diff) || 0; if (stars > (Q.best[dI] || 0)) { Q.best[dI] = stars; try { localStorage.setItem('hl_qbest', JSON.stringify(Q.best)); } catch (e) { /* */ } }
    const el = U.screen(`<div class="hlPause"><h3>${r.win ? 'VICTORY' : r.draw ? 'A DRAW' : 'DEFEAT'}</h3>
      <div style="font-size:36px;letter-spacing:0.25em;color:#ffd24a;text-shadow:0 0 14px rgba(255,200,80,0.5)">${'★'.repeat(stars)}<span style="color:rgba(255,255,255,0.18);text-shadow:none">${'★'.repeat(3 - stars)}</span></div><p style="margin:0 0 6px;font-size:12.5px;color:#a89f8a;letter-spacing:0.06em">${Q.DIFF[dI].n} · a star for the win · for five goals of your own · for winning by fifty</p>
      <div style="font-family:'HLA',serif;font-size:54px;letter-spacing:0.1em"><span style="color:${A.css}">${r.a}</span> <span style="font-size:22px;opacity:0.7"> — </span> <span style="color:${B.css}">${r.b}</span></div>
      <p style="margin:2px 0 14px;font-style:italic;color:#cfc6b0">${A.name} v ${B.name}${r.reason ? ' · ' + r.reason : ''}</p>
      <div class="hlKeys"><b>Your goals</b><span>${st.goals} from ${st.shots} shots</span><b>Passes · tackles</b><span>${st.passes} · ${st.tackles}</span><b>Bludgers dodged · taken</b><span>${st.dodges} · ${st.hits}</span><b>Possession</b><span>${st.possT ? Math.round(st.poss / st.possT * 100) : 0}%</span><b>Steals · Roaring Shots</b><span>${st.steals || 0} · ${st.power || 0}</span><b>Top speed</b><span>${Math.round(st.top * 1.94)} knots</span><b>Snitch</b><span>${st.snitch ? 'caught by you' : '—'}</span></div>${cupHtml}
      <div class="hlRow"><div class="hlBtn" data-a="n">${Q.cup && !last ? 'NEXT MATCH' : 'PLAY AGAIN'}</div><div class="hlBtn" data-a="s">CHANGE SETUP</div><div class="hlBtn" data-a="t">TITLE</div></div></div>`);
    el.querySelectorAll('.hlBtn').forEach((b) => b.onclick = () => { const k = b.dataset.a; if (k === 'n') { if (Q.cup && last) Q.cup = null; Q.launch(false); } else if (k === 's') { Q.cup = null; Q.setup(false); } else { Q.cup = null; U.el.Pts.style.display = ''; U.title(); } });
    MG.onKey = (c) => { if (c === 'Enter') { if (Q.cup && last) Q.cup = null; Q.launch(false); } };
  };
  // the title gets its Quidditch door; in the story the referee opens the same setup
  /* behind the Quidditch screens the eye circles the stadium, not the castle */
  { const u0 = HL.titleUpdate; HL.titleUpdate = function (dt) { if (!(Q.pitchCam && (MG.state === 'house' || MG.state === 'title'))) return u0(dt); u0(dt); Q.pcT = (Q.pcT || 0) + dt; const t = Q.pcT, a = 0.9 + t * 0.05, cam = R.camera; /* (above the tower canopies: lower, the orbit ran through their cloth) */ cam.position.set(C.x + Math.sin(a) * 104, Q.Y0 + 74 + 5 * Math.sin(t * 0.11), C.z + Math.cos(a) * 156); cam.lookAt(C.x, Q.Y0 + 2, C.z); if (Math.abs(cam.fov - 46) > 0.01) { cam.fov = 46; cam.updateProjectionMatrix(); } Q.excite = Math.max(Q.excite, 0.45); }; }
  /* Quidditch on its own: opened with ?quidditch (or as the Quidditch file) the title is the game's own */
  Q.SOLO = !!window.__QUIDDITCH || /[?&]quidditch\b/i.test(location.search);
  Q.soloTitle = function () { U.build(); U.show(false); MG.state = 'title'; if (document.exitPointerLock) document.exitPointerLock(); Q.pitchCam = true; let done = false; try { done = !!localStorage.getItem('hl_qtut'); } catch (e) { /* */ }
    const S = U.screen(`<div class="hlTitle"><h1>QUIDDITCH</h1><h2>THE HOGWARTS HOUSE CUP</h2><div class="hlBtn" data-a="p">PLAY</div><div class="hlBtn" data-a="l" style="${done ? '' : 'border-color:#ffe28a;color:#ffe9b0;box-shadow:0 0 18px rgba(255,210,90,0.35)'}">FLYING LESSON${done ? '' : ' · START HERE'}</div><div class="hlBtn" data-a="h">HOGWARTS · THE WHOLE CASTLE</div>
      <div class="cr">A fan-made tribute. Not affiliated with or endorsed by Warner Bros. or J.K. Rowling. Models &amp; animation: Quaternius (CC0); textures: Poly Haven (CC0).</div><div class="v">${MG.VERSION}</div></div>`);
    S.querySelectorAll('.hlBtn').forEach((b) => b.onclick = () => { const k = b.dataset.a; if (k === 'p') Q.setup(false); else if (k === 'l') Q.lesson(false); else { Q.SOLO = false; U.title(); } }); MG.onKey = (c) => { if (c === 'Enter' || c === 'Space') Q.setup(false); }; };
  const t0 = U.title; U.title = function () { Q.pitchCam = false; if (Q.SOLO) return Q.soloTitle(); t0(); const S = U.el.Screen, box = S.querySelector('.hlTitle'), first = box.querySelector('.hlBtn'); const b = document.createElement('div'); b.className = 'hlBtn'; b.textContent = 'QUIDDITCH'; b.onclick = () => Q.setup(false); first.parentNode.insertBefore(b, S.querySelector('.cr')); };
})();
