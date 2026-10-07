/* ==== p91_boot.js ==== */
/* BOOT (web build) — the page arrives with its code; the castle's stone, the cast's rigs and the sounds come after it
   in a few packs, fetched with the loading bar before the engine starts. */
(function () {
  const boot0 = MG.boot;
  MG.boot = async function () {
    if (ASSETS.web && !ASSETS.loaded) {
      const lu = MG.loadUI, SHARE = 0.42; let lastT = 0;
      try {
        await ASSETS.load((f, got, tot) => { const now = performance.now(); if (now - lastT < 120 && f < 1) return; lastT = now; lu(f * SHARE, 'Summoning the castle · ' + Math.round(got / 1048576) + ' / ' + Math.round(tot / 1048576) + ' MB'); });
      } catch (e) { MG.fail('The castle could not be fetched (' + (e && e.message || e) + '). Check the connection and reload.'); return; }
      MG.loadUI = (p, m) => lu(SHARE + sat(p) * (1 - SHARE), m);
    }
    return boot0.call(MG);
  };
})();
