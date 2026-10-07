/* ==== p58_or_hud.js ==== */
/* OPUS RING — HUD additions: the great banners (YOU DIED / ENEMY FELLED / LOST GRACE DISCOVERED), runes, the flask,
   item pop-ups, area titles, damage dealt shown on the great enemy's bar. */
(function () {
  const i0 = HUD.init;
  HUD.init = function () { i0(); for (const id of ['banner', 'runes', 'runeGain', 'flaskN', 'slFlask', 'slSteed', 'slAsh', 'itemPop', 'itemN', 'itemD']) HUD.el[id] = MG.$(id); };
  HUD.banner = function (text, kind, dur) { const e = HUD.el.banner; e.className = 'ui'; void e.offsetWidth; e.textContent = text; e.style.animationDuration = (dur || 4.4) + 's'; e.className = 'ui on ' + (kind || 'gold'); HUD.bannerText = text; };
  HUD.item = function (name, desc) { HUD.el.itemN.textContent = name; HUD.el.itemD.textContent = desc || ''; HUD.el.itemPop.classList.add('on'); HUD.itemT = 3.4; };
  HUD.bossHit = function (n) { if (n <= 0) return; HUD.bossDmg = (HUD.bossDmgT > 0 ? HUD.bossDmg : 0) + n; HUD.bossDmgT = 2.6; };
  HUD.area = function (name, sub) { HUD.toast(sub || '', name, 4.2); };
  HUD.setBoss = function (a, name, sub, cls) { HUD.boss = a; HUD.el.bossN.textContent = name || ''; HUD.el.bossSub.textContent = ''; HUD.el.bossFill.className = cls || ''; HUD.el.boss.classList.toggle('on', !!a); HUD.bossDmgT = 0; };
  HUD.obj = function (t) { HUD.el.objD.textContent = t || ''; MG.$('objT').style.visibility = t ? 'visible' : 'hidden'; if (t) { HUD.el.objD.style.color = '#ffe9a8'; setTimeout(() => { HUD.el.objD.style.color = ''; }, 1200); } };
  const u0 = HUD.update;
  HUD.update = function (dt) {
    u0(dt);
    const s = GAME.save, E = HUD.el;
    if (HUD._runes !== s.runes) { HUD._runes = s.runes; E.runes.textContent = String(s.runes || 0); }
    if (HUD.runeT > 0) { HUD.runeT -= dt; E.runeGain.textContent = '+' + HUD.runeGain; E.runeGain.classList.add('on'); if (HUD.runeT <= 0) { E.runeGain.classList.remove('on'); HUD.runeGain = 0; } }
    if (HUD._fl !== OR.flasks) { HUD._fl = OR.flasks; E.flaskN.textContent = OR.flasks; E.slFlask.classList.toggle('empty', OR.flasks <= 0); }
    const st = !!s.torrent; if (HUD._st !== st) { HUD._st = st; E.slSteed.classList.toggle('off', !st); }
    if (HUD.itemT > 0) { HUD.itemT -= dt; if (HUD.itemT <= 0) E.itemPop.classList.remove('on'); }
    if (HUD.bossDmgT > 0) { HUD.bossDmgT -= dt; E.bossSub.textContent = HUD.bossDmgT > 0 ? String(Math.round(HUD.bossDmg)) : ''; }
    if (E.prompt.innerHTML.indexOf('EXECUTE') >= 0) E.prompt.innerHTML = E.prompt.innerHTML.replace('EXECUTE', 'CRITICAL HIT');
    OR.update(dt);
  };
})();
