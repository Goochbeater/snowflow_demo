/* ==== p99e_touch_tests.js ==== */
/* TOUCH TESTS — with ?test&touch=1, after the main run: the screens keep their buttons once the touch layer has rewritten
   their words, the spell wheel casts on a slide, a stored layout moves a button and RESET returns it, a tap on the errand
   opens the journal, a Seeker has no PASS, and the pause opens on its tabs. */
TEST.touchRun = async function () {
  const frames = async (n) => { for (let i = 0; i < (n || 2); i++) await new Promise((r) => requestAnimationFrame(() => r())); };
  const ctr = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  try {
    // the Quidditch setup: a chip still answers after the rewriter's frame has passed
    HL.Q.setup(); await frames(3); TEST.steps(2);
    const chip = [...document.querySelectorAll('#hlScreen .hlBtn[data-k="role"]')].find((b) => !b.classList.contains('sel'));
    const was = chip && chip.textContent.trim(); if (chip) chip.click(); await frames(2);
    const now = [...document.querySelectorAll('#hlScreen .hlBtn[data-k="role"].sel')].map((b) => b.textContent.trim()).join();
    TEST.ok('touch: the Quidditch setup\'s chips answer after their words are rewritten', !!chip && now === was, `tapped ${was}, selected ${now}`);
    const back = document.querySelector('#hlScreen .hlBtn[data-back]'); if (back) back.click(); await frames(2);
    TEST.ok('touch: BACK on the setup still leaves it', MG.state !== 'house' || !document.querySelector('#hlScreen [data-go]'), MG.state);
    if (MG.state !== 'play') { HL.begin(HL.house || 'gryffindor', HL.witch, true); await TEST.wait(() => MG.state === 'play' && !HL._beginning, 600); }
    if (CAM.cine) CAM.cine.t = CAM.cine.dur || 1e9; TEST.steps(30);
    if (TOUCH.wheel && TOUCH.wheel.fight) { const P = PLAYER.a; TEST.place(P.x + 200, HL.gy(P.x + 200, P.z) + 0.2, P.z, 0); TEST.steps(120); }
    // the spell wheel: press, slide onto the first petal, let go — that spell is cast
    { const B = TOUCH.btn.wheel, W = TOUCH.wheel, id = TOUCH.btn.s0.dataset.spell; TOUCH.frame(); const [cx, cy] = ctr(B), ev = (t, x, y) => B.dispatchEvent(new PointerEvent(t, { pointerId: 31, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch' }));
      HL.P.cd[id] = 0; ev('pointerdown', cx, cy); TEST.steps(2); const open = W.open && TOUCH.btn.s0.classList.contains('on');
      ev('pointermove', cx + Math.cos(30 * D2R) * 72 * TOUCH.u, cy - Math.sin(30 * D2R) * 72 * TOUCH.u); const hot = W.hot; ev('pointerup', cx + 60, cy - 36); TEST.steps(20);
      TEST.ok('touch: the spell wheel opens and a slide onto a petal casts it', open && hot === 0 && (HL.P.cd[id] || 0) > 0, `open ${open}, hot ${hot}, ${id} cooldown ${(HL.P.cd[id] || 0).toFixed(1)}`); }
    // a stored layout moves CAST by its offset; RESET puts it back
    { const C = TOUCH.cfg, b = TOUCH.btn.cast; TOUCH.layout(); const [x0, y0] = ctr(b); C.pos.foot = { cast: [-20, -10] }; TOUCH.layout(); const [x1, y1] = ctr(b); delete C.pos.foot; TOUCH.layout(); const [x2, y2] = ctr(b);
      TEST.ok('touch: a stored layout moves a button by its offset, and clearing it returns it', Math.abs(x1 - x0 + 20 * TOUCH.u) < 1.5 && Math.abs(y1 - y0 + 10 * TOUCH.u) < 1.5 && Math.abs(x2 - x0) < 0.5 && Math.abs(y2 - y0) < 0.5, `${x0.toFixed(0)},${y0.toFixed(0)} → ${x1.toFixed(0)},${y1.toFixed(0)} → ${x2.toFixed(0)},${y2.toFixed(0)}`); }
    // a tap on the errand opens the journal (it sits under the stick's half of the screen)
    { const Q = HL.ui.el.Quest, [x, y] = ctr(Q), Z = TOUCH.zone, ev = (t) => Z.dispatchEvent(new PointerEvent(t, { pointerId: 32, clientX: x - Q.getBoundingClientRect().width * 0.2, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch' }));
      ev('pointerdown'); ev('pointerup'); await new Promise((r) => setTimeout(r, 120)); TEST.steps(4);
      TEST.ok('touch: a tap on the errand opens the journal, and the stick stays put', MG.state === 'journal' && TOUCH.stick.id === null, MG.state); if (MG.state === 'journal') HL.J.close(); TEST.steps(2); }
    // the pause on a phone: its tabs, one section at a time
    { HL.noPauseT = 0; HL.ui.pause(); await frames(1); const box = document.querySelector('#hlScreen .hlPause.pz'), secs = box ? [...box.querySelectorAll('.sec')] : [];
      const snd = box && box.querySelector('.nav[data-pz="sound"]'); if (snd) snd.click(); const on = secs.filter((s) => s.classList.contains('on')).map((s) => s.dataset.pz).join();
      TEST.ok('touch: the pause is tabs with one section showing', !!box && secs.length === 4 && on === 'sound', `sections ${secs.length}, showing ${on}`);
      const r = document.querySelector('#hlScreen .hlBtn[data-a="r"]'); if (r) r.click(); TEST.steps(2); }
    // a Seeker has no PASS
    { TOUCH.mode = ''; const Q = HL.Q, me0 = Q.me; Q.me = { role: 'seeker' }; const mn = TOUCH.modeNow; TOUCH.modeNow = () => 'match'; TOUCH.frame(); const hidden = !TOUCH.btn.pass.classList.contains('on');
      Q.me = { role: 'chaser' }; TOUCH.frame(); const shown = TOUCH.btn.pass.classList.contains('on'); TOUCH.modeNow = mn; Q.me = me0; TOUCH.mode = ''; TOUCH.frame();
      TEST.ok('touch: a Seeker has no PASS button, a Chaser has', hidden && shown, `seeker hidden ${hidden}, chaser shown ${shown}`); }
  } catch (e) { TEST.ok('touch test run threw', false, String(e.stack || e).slice(0, 400)); }
};
{ const r0 = TEST.run; TEST.run = async function () { await r0.apply(this, arguments); if (!TOUCH.on) return; MG.manual = true; const n0 = TEST.n, p0 = TEST.pass; await TEST.touchRun();
    MG.testResult = TEST.pass + '/' + TEST.n; document.title = MG.testResult + ' · HOGWARTS tests'; console.log('TOUCH TESTS ' + (TEST.pass - p0) + '/' + (TEST.n - n0)); console.log('TEST RESULT ' + MG.testResult); MG.manual = false; }; }
