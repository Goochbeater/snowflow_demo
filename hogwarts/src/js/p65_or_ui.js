/* ==== p65_or_ui.js ==== */
/* OPUS RING — the menu: Equipment, Inventory, Status, Map, System; at a Site of Grace: level up, fast travel, the sacred
   flask; at a merchant: trade; at a smithing table: strengthen armaments. Mouse, keyboard and pad all drive it. */
const UI = { root: null, tab: 'equip', pick: null, from: null, invCat: 'weapon' };
UI.TABS = [['equip', 'EQUIPMENT'], ['inv', 'INVENTORY'], ['status', 'STATUS'], ['map', 'MAP'], ['sys', 'SYSTEM']];
UI.h = function (tag, cls, html, par) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined && html !== null) e.innerHTML = html; if (par) par.appendChild(e); return e; };
UI.isOpen = () => MENU.cur === 'er';
UI.open = function (tab, o) {
  o = o || {}; if (!PLAYER.a) return; EQ.ensure();
  if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { /* */ }
  UI.from = o.from || null; UI.ctx = o; UI.tab = tab || UI.tab || 'equip'; UI.pick = null;
  if (!UI.from) { MG.state = 'pause'; } HUD.show(false); MENU.cur = 'er';
  UI.render(); MG.onKey = UI.key;
};
UI.close = function () {
  const from = UI.from, ctx = UI.ctx; MENU.el().innerHTML = ''; UI.root = null; MG.onKey = null; MENU.cur = null; UI.from = null; GAME.store();
  if (from === 'grace') { MENU.open('grace', { Gr: ctx.Gr }); return; }
  if (from === 'talk') { MG.state = 'play'; HUD.show(true); IN.buf = {}; OR.noPauseT = MG.rt + 0.35; return; }
  MG.state = 'play'; HUD.show(true); IN.buf = {}; OR.noPauseT = MG.rt + 0.35;
};
UI.back = function () { if (UI.pick) { UI.pick = null; UI.render(); return; } if (UI.sub) { UI.sub = null; UI.render(); return; } UI.close(); };
UI.key = function (code) {
  if (!UI.root) return;
  if (code === 'Escape' || code === 'Backspace' || (code === 'KeyI' && !UI.from)) { UI.back(); return; }
  const tabs = UI.tabsShown(); if ((code === 'KeyQ' || code === 'KeyE') && tabs.length > 1 && !UI.pick) { const i = tabs.findIndex((t) => t[0] === UI.tab); UI.tab = tabs[(i + (code === 'KeyE' ? 1 : tabs.length - 1)) % tabs.length][0]; UI.sub = null; UI.render(); return; }
  const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1] };
  if (dirs[code]) { UI.move(dirs[code][0], dirs[code][1]); return; }
  if (code === 'Enter' || code === 'Space' || code === 'KeyF' || code === 'NumpadEnter') { const s = UI.root.querySelector('.fc.sel'); if (s) s.click(); }
};
UI.focus = function (el) { if (!el || !UI.root) return; for (const e of UI.root.querySelectorAll('.fc.sel')) e.classList.remove('sel'); el.classList.add('sel'); if (el._hover) el._hover(); if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); };
UI.move = function (dx, dy) {
  const all = [...UI.root.querySelectorAll('.fc')].filter((e) => e.offsetParent !== null), cur = UI.root.querySelector('.fc.sel'); if (!all.length) return; if (!cur) { UI.focus(all[0]); return; }
  const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let best = null, bs = 1e9;
  for (const e of all) { if (e === cur) continue; const q = e.getBoundingClientRect(), ex = q.left + q.width / 2 - cx, ey = q.top + q.height / 2 - cy, along = ex * dx + ey * dy, across = Math.abs(ex * dy) + Math.abs(ey * dx); if (along < 4) continue; const sc = along + across * 2.4; if (sc < bs) { bs = sc; best = e; } }
  if (best) UI.focus(best);
};
UI.fc = function (el, hover, click) { el.classList.add('fc'); el._hover = hover; el.addEventListener('mouseenter', () => UI.focus(el)); el.addEventListener('click', (ev) => { ev.stopPropagation(); if (click) click(); }); return el; };
UI.tabsShown = () => (UI.from === 'shop' || UI.from === 'smith' || UI.from === 'level' || UI.from === 'travel' ? [] : UI.from === 'grace' ? UI.TABS.slice(0, 3) : UI.TABS);
UI.render = function () {
  const tabs = UI.tabsShown(), title = { shop: UI.ctx.title || 'MERCHANT', smith: 'SMITHING TABLE', level: 'LEVEL UP', travel: 'TRAVEL BY GRACE' }[UI.from] || (UI.TABS.find((t) => t[0] === UI.tab) || ['', ''])[1];
  const d = UI.h('div', 'menu on'); d.id = 'er'; MENU.el().innerHTML = ''; MENU.el().appendChild(d); UI.root = d;
  const top = UI.h('div', 'top', null, d); UI.h('div', 'ttl', title, top);
  const tb = UI.h('div', 'tabs', null, top); for (const [k, n] of tabs) { const t = UI.h('div', 'tab' + (k === UI.tab ? ' on' : ''), n, tb); t.addEventListener('click', () => { UI.tab = k; UI.pick = null; UI.sub = null; UI.render(); }); }
  UI.rn = UI.h('div', 'rn', String(GAME.save.runes || 0), top);
  const body = UI.h('div', 'body', null, d); UI.L = UI.h('div', 'left', null, body); UI.Rt = UI.h('div', 'right', null, body);
  const foot = UI.h('div', 'foot', null, d); UI.h('div', '', (tabs.length > 1 ? '<kbd>Q</kbd><kbd>E</kbd> SWITCH PAGE &nbsp; ' : '') + '<kbd>↑↓←→</kbd> MOVE &nbsp; <kbd>ENTER</kbd> SELECT', foot); UI.h('div', '', '<kbd>ESC</kbd> ' + (UI.pick || UI.sub ? 'BACK' : 'CLOSE'), foot);
  const page = UI.from === 'shop' ? UI.pShop : UI.from === 'smith' ? UI.pSmith : UI.from === 'level' ? UI.pLevel : UI.from === 'travel' ? UI.pTravel : { equip: UI.pEquip, inv: UI.pInv, status: UI.pStatus, map: UI.pMap, sys: UI.pSys }[UI.tab];
  page(); const first = UI.root.querySelector('.fc.eqd') || UI.root.querySelector('.fc'); if (first) UI.focus(first);
};
UI.cell = function (par, id, label, o) {
  o = o || {}; const d = ITEM.DB[id], c = UI.h('div', 'cell' + (d ? '' : ' none') + (o.eqd ? ' eqd' : ''), null, par);
  if (d) { const im = UI.h('img', '', null, c); im.src = ICON.get(id); const n = o.count !== undefined ? o.count : (d.stack ? EQ.count(id) : 0); if (n) UI.h('b', '', String(n), c); const up = d.cat === 'weapon' ? EQ.upLevel(id) : 0; if (up) UI.h('em', '', '+' + up, c); }
  UI.h('small', '', label !== undefined ? label : (d ? d.name.replace('Ash of War: ', '') : 'NONE'), c);
  UI.fc(c, () => UI.detail(id, o.cmp, o.extra), o.click); return c;
};
UI.statRows = function (d) {
  const R = [], s = GAME.save, g = (a, b) => R.push([a, b]);
  if (d.cat === 'weapon') { g('Attack power', Math.round(EQ.atk(d) * 100)); g('Swing speed', Math.round(d.spd * 100) + '%'); g('Stamina use', Math.round(d.stam * 100) + '%'); g('Scaling', 'Str ' + d.sc[0] + ' · Dex ' + d.sc[1]); if (d.bleed) g('Passive', 'Blood loss'); if (d.holy) g('Passive', 'Holy'); if (d.poise) g('Stagger', '×' + d.poise); g('Strengthened', '+' + EQ.upLevel(d.id) + ' / 5'); g('Weight', d.wt.toFixed(1)); }
  else if (d.cat === 'shield') { g('Guarded damage negation', Math.round(d.guard * 100) + '%'); g('Guard stability', Math.round(100 / d.stab)); g('Weight', d.wt.toFixed(1)); }
  else if (d.cat === 'armor') { g('Damage negation', Math.round(d.def * 100) + '%'); g('Poise', d.poise); g('Weight', d.wt.toFixed(1)); }
  else if (d.cat === 'ash' || d.cat === 'spell') { g('FP cost', d.fp); if (d.school) g('Scales with', d.school === 'int' ? 'Intelligence' : 'Faith'); }
  else if (d.cat === 'talisman') g('Weight', d.wt.toFixed(1));
  else if (d.stack) g('Held', EQ.count(d.id) + ' / ' + d.stack);
  void s; return R;
};
UI.detail = function (id, cmp, extra) {
  const R = UI.Rt; R.innerHTML = ''; const d = ITEM.DB[id]; if (!d) { UI.h('div', 'dd', extra || 'Nothing equipped.', R); return; }
  const im = UI.h('img', 'dimg', null, R); im.src = ICON.get(id); UI.h('div', 'dn', d.name, R); UI.h('div', 'dc', ITEM.catName(d.cat).toUpperCase(), R);
  const t = UI.h('table', '', null, R); for (const [a, b] of UI.statRows(d)) { const tr = UI.h('tr', '', null, t); UI.h('td', '', a, tr); UI.h('td', '', String(b), tr); }
  UI.h('div', 'dd', d.desc, R); if (extra) UI.h('div', '', extra, R);
};
/* ------------------------------------------------------------------ equipment */
UI.SLOTS = [['Armament', [['rh', 'RIGHT HAND', 'weapon'], ['lh', 'LEFT HAND', 'shield']]], ['Armour', [['armor', 'ARMOUR', 'armor']]], ['Talismans', [['tal0', 'TALISMAN 1', 'talisman'], ['tal1', 'TALISMAN 2', 'talisman'], ['tal2', 'TALISMAN 3', 'talisman']]],
  ['Skill and Spells', [['ash', 'ASH OF WAR', 'ash'], ['spell0', 'SPELL 1', 'spell'], ['spell1', 'SPELL 2', 'spell']]], ['Quick Items', [['quick0', 'ITEM 1', 'use'], ['quick1', 'ITEM 2', 'use'], ['quick2', 'ITEM 3', 'use'], ['quick3', 'ITEM 4', 'use']]]];
UI.slotGet = function (k) { const e = GAME.save.eq, m = /^(tal|spell|quick)(\d)$/.exec(k); return m ? e[m[1]][+m[2]] : e[k]; };
UI.slotSet = async function (k, id) {
  const e = GAME.save.eq, m = /^(tal|spell|quick)(\d)$/.exec(k);
  if (m) { const arr = e[m[1]], i = +m[2]; if (id) { const j = arr.indexOf(id); if (j >= 0 && j !== i) arr[j] = arr[i]; } arr[i] = id || null; } else e[k] = id || (k === 'lh' || k === 'ash' ? null : e[k]);
  if (k === 'rh') EQ.applyWeapon(); if (k === 'lh') EQ.applyShield(); if (k === 'armor') await EQ.applyArmor(); EQ.refresh(); HUD._q = null;
};
UI.pEquip = function () {
  const L = UI.L, s = GAME.save;
  if (UI.pick) { const [k, label, cat] = UI.pick, cur = UI.slotGet(k); UI.h('h3', '', 'SELECT · ' + label, L); const g = UI.h('div', 'grid', null, L);
    if (cat !== 'weapon' && cat !== 'armor') UI.cell(g, null, 'REMOVE', { click: async () => { await UI.slotSet(k, null); UI.pick = null; UI.render(); } });
    for (const id of ITEM.order) { const d = ITEM.DB[id]; if (d.cat !== cat || !EQ.count(id)) continue; UI.cell(g, id, undefined, { eqd: id === cur, click: async () => { await UI.slotSet(k, id); UI.pick = null; UI.render(); } }); }
    return; }
  for (const [name, slots] of UI.SLOTS) { UI.h('h3', '', name.toUpperCase(), L); const g = UI.h('div', 'grid', null, L);
    for (const sl of slots) { if (sl[0] === 'tal2' && EQ.talSlots() < 3) continue; const id = UI.slotGet(sl[0]); UI.cell(g, id, sl[1], { click: () => { UI.pick = sl; UI.render(); }, extra: id ? null : 'Empty. Select to choose from what you carry.' }); } }
  const ld = EQ.load(), lm = EQ.loadMax(); UI.h('h3', '', 'EQUIP LOAD', L); UI.h('div', '', ld.toFixed(1) + ' / ' + lm.toFixed(1) + ' &nbsp;·&nbsp; ' + (ld / lm > 0.7 ? '<span class="dnn">Heavy load: slow rolls</span>' : ld / lm > 0.3 ? 'Medium load' : 'Light load'), L);
};
/* ------------------------------------------------------------------ inventory */
UI.pInv = function () {
  const L = UI.L, tb = UI.h('div', 'tabs', null, L); tb.style.position = 'static'; tb.style.transform = 'none'; tb.style.marginBottom = '12px'; tb.style.flexWrap = 'wrap';
  for (const [c, n] of ITEM.CATS) { const t = UI.h('div', 'tab' + (c === UI.invCat ? ' on' : ''), n.toUpperCase(), tb); t.addEventListener('click', () => { UI.invCat = c; UI.render(); }); }
  const g = UI.h('div', 'grid', null, L), e = GAME.save.eq, eqd = new Set([e.rh, e.lh, e.armor, e.ash].concat(e.tal, e.spell, e.quick)); let n = 0;
  for (const id of ITEM.order) { const d = ITEM.DB[id]; if (d.cat !== UI.invCat || !EQ.count(id)) continue; n++;
    UI.cell(g, id, undefined, { eqd: eqd.has(id), click: () => { if (d.runes && !UI.from) { OR.useItem(id); UI.render(); } } , extra: d.runes ? '<span class="btn">ENTER · USE</span>' : null }); }
  if (!n) UI.h('div', 'dd', 'You carry nothing of this kind yet.', L);
};
/* ------------------------------------------------------------------ status */
UI.pStatus = function () {
  const L = UI.L, R = UI.Rt, s = GAME.save, a = PLAYER.a;
  UI.h('h3', '', 'THE TARNISHED', L); const t = UI.h('table', '', null, L), row = (tb, k, v) => { const tr = UI.h('tr', '', null, tb); UI.h('td', '', k, tr); UI.h('td', '', String(v), tr); };
  row(t, 'Level', OR.level()); row(t, 'Runes held', s.runes || 0); row(t, 'Runes to next level', OR.levelCost());
  UI.h('h3', '', 'ATTRIBUTES', L); const t2 = UI.h('table', '', null, L); for (const [k, n] of EQ.attrs) row(t2, n, 10 + (s[k] || 0));
  UI.h('h3', '', 'JOURNEY', L); const t3 = UI.h('table', '', null, L), tm = s.t || 0; row(t3, 'Time', Math.floor(tm / 3600) + ':' + String(Math.floor(tm / 60) % 60).padStart(2, '0') + ':' + String(Math.floor(tm % 60)).padStart(2, '0')); row(t3, 'Deaths', s.deaths || 0); row(t3, 'Great enemies felled', Object.keys(s.felled || {}).length); row(t3, 'Sites of grace found', Object.keys(s.graces || {}).length);
  UI.h('h3', '', 'BODY', R); const t4 = UI.h('table', '', null, R); row(t4, 'HP', Math.round(a.hp) + ' / ' + OR.hpMax()); row(t4, 'FP', Math.round(PLAYER.fp) + ' / ' + OR.fpMax()); row(t4, 'Stamina', OR.stamMax()); row(t4, 'Equip load', EQ.load().toFixed(1) + ' / ' + EQ.loadMax().toFixed(1));
  UI.h('h3', '', 'ATTACK AND DEFENCE', R); const t5 = UI.h('table', '', null, R); row(t5, EQ.W().name, Math.round(EQ.atk() * 100)); row(t5, 'Damage negation', Math.round((1 - OR.defMul()) * 100) + '%'); row(t5, 'Guarded negation', Math.round((1 - OR.guardLeak()) * 100) + '%'); row(t5, 'Sorcery scaling', Math.round(OR.spellMul('int') * 100)); row(t5, 'Incantation scaling', Math.round(OR.spellMul('fai') * 100));
  row(t5, 'Sacred flask', (s.flaskMax || 3) + ' crimson · ' + (s.ceruMax || 1) + ' cerulean');
};
/* ------------------------------------------------------------------ system */
UI.pSys = function () {
  const L = UI.L, R = UI.Rt, b = (t, fn) => UI.fc(UI.h('div', 'row', t, L), () => {}, fn);
  b('Resume', () => UI.close()); b('Return to the last site of grace', () => { UI.close(); GAME.retry(); });
  b('Difficulty · ' + MG.difficulty.toUpperCase(), () => { const Lq = ['easy', 'normal', 'hard']; MG.difficulty = Lq[(Lq.indexOf(MG.difficulty) + 1) % 3]; UI.render(); });
  b('Graphics · ' + (WORLD.detail === 0 ? 'PERFORMANCE' : 'FULL DETAIL'), () => { WORLD.setDetail(WORLD.detail === 0 ? 1 : 0); UI.render(); });
  b('Quit to title', () => { MENU.el().innerHTML = ''; UI.root = null; MG.onKey = null; MENU.cur = null; MENU.toTitle(); });
  const K = (a, k) => '<tr><td>' + a + '</td><td>' + k + '</td></tr>';
  UI.h('h3', '', 'CONTROLS', R); UI.h('table', '', K('Move · camera', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · mouse') + K('Attack · heavy', '<kbd>LMB</kbd> · <kbd>RMB</kbd>') + K('Guard (parry on impact)', '<kbd>Q</kbd>') + K('Roll / backstep · sprint', 'tap / hold <kbd>SHIFT</kbd>') + K('Jump', '<kbd>SPACE</kbd>') + K('Lock on', '<kbd>TAB</kbd>')
    + K('Ash of War', '<kbd>E</kbd>') + K('Cast spell · next spell', '<kbd>G</kbd> · <kbd>T</kbd>') + K('Use item · next item', '<kbd>R</kbd> · <kbd>Z</kbd>') + K('Interact', '<kbd>F</kbd>') + K('Torrent', '<kbd>X</kbd>') + K('Menu · map', '<kbd>ESC</kbd> / <kbd>I</kbd> · <kbd>M</kbd>'), R);
};
/* ------------------------------------------------------------------ map */
UI.pMap = function () {
  const L = UI.L, Lv = LEVEL.cur; UI.Rt.style.display = 'none'; L.style.overflow = 'hidden'; L.style.position = 'relative';
  const w = UI.h('div', 'mapwrap', null, L), cv = UI.h('canvas', 'map', null, w), G = Lv && Lv.G; if (!G) { UI.h('div', 'dd', 'No map of this place.', L); return; }
  if (!Lv._map) Lv._map = UI.bakeMap(G); const b0 = Lv._map, base = { width: b0.width * 2, height: b0.height * 2 }; cv.width = base.width; cv.height = base.height; const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(b0, 0, 0, base.width, base.height); x.scale(2, 2); base.width = b0.width; base.height = b0.height;
  const sx = base.width / (G.x1 - G.x0), sz = base.height / (G.z1 - G.z0), P = (wx, wz) => [(wx - G.x0) * sx, base.height - (wz - G.z0) * sz];
  x.textAlign = 'center'; x.font = '15px Georgia';
  for (const g of (Lv.graces || [])) { const p = P(g.x, g.z); x.globalAlpha = g.found ? 1 : 0.35; x.fillStyle = '#ffd772'; x.shadowColor = '#ffb030'; x.shadowBlur = 14; x.beginPath(); x.arc(p[0], p[1], 6, 0, TAU); x.fill(); x.shadowBlur = 0; x.strokeStyle = '#6a4a10'; x.lineWidth = 1.5; x.stroke(); }
  x.globalAlpha = 1; const big = base.width / 340;
  for (const m of (Lv.def.mapMarks || [])) { const p = P(m[0], m[1]), kind = m[3] || 'place';
    if (kind === 'region') { x.font = 'italic ' + Math.round(13 * big) + 'px "EB Garamond", Georgia, serif'; x.fillStyle = 'rgba(58,40,18,0.55)'; x.fillText(m[2].split('').join(' '), p[0], p[1]); continue; }
    x.strokeStyle = '#3a2812'; x.fillStyle = '#3a2812'; x.lineWidth = 1.6;
    if (kind === 'ruin') { x.strokeRect(p[0] - 5, p[1] - 5, 10, 10); x.beginPath(); x.moveTo(p[0] - 5, p[1] + 5); x.lineTo(p[0] + 5, p[1] - 5); x.stroke(); }
    else if (kind === 'camp') { x.beginPath(); x.moveTo(p[0] - 6, p[1] + 5); x.lineTo(p[0], p[1] - 6); x.lineTo(p[0] + 6, p[1] + 5); x.closePath(); x.stroke(); }
    else if (kind === 'castle') { x.fillRect(p[0] - 8, p[1] - 3, 16, 9); for (const d of [-8, -2, 4]) x.fillRect(p[0] + d, p[1] - 8, 4, 6); }
    else if (kind === 'cave') { x.beginPath(); x.arc(p[0], p[1] + 3, 6, PI, 0); x.closePath(); x.fill(); }
    else { x.beginPath(); x.arc(p[0], p[1], 2.5, 0, TAU); x.fill(); }
    x.font = 'italic ' + Math.round(8.6 * big) + 'px "EB Garamond", Georgia, serif'; x.lineWidth = 3; x.strokeStyle = 'rgba(214,196,150,0.75)'; x.strokeText(m[2], p[0], p[1] + 9 + 8 * big); x.fillStyle = '#2a1c0c'; x.fillText(m[2], p[0], p[1] + 9 + 8 * big); }
  { const cx = base.width - 46 * big / 2 - 14, cy = 46 * big / 2 + 14, r = 15 * big / 2; x.strokeStyle = 'rgba(58,40,18,0.8)'; x.fillStyle = 'rgba(58,40,18,0.8)'; x.lineWidth = 1.2; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();   // compass
    for (let k = 0; k < 4; k++) { const a = k * HALF; x.beginPath(); x.moveTo(cx + Math.sin(a) * r * 1.5, cy - Math.cos(a) * r * 1.5); x.lineTo(cx + Math.sin(a + 0.35) * r * 0.4, cy - Math.cos(a + 0.35) * r * 0.4); x.lineTo(cx + Math.sin(a - 0.35) * r * 0.4, cy - Math.cos(a - 0.35) * r * 0.4); x.closePath(); k === 0 ? x.fill() : x.stroke(); }
    x.font = Math.round(7 * big) + 'px "EB Garamond", Georgia, serif'; x.fillText('N', cx, cy - r * 1.7); }
  const a = PLAYER.a, p = P(a.x, a.z); x.save(); x.translate(p[0], p[1]); x.rotate(-a.yaw + PI); x.fillStyle = '#b01a12'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 13); x.lineTo(8, -9); x.lineTo(0, -4); x.lineTo(-8, -9); x.closePath(); x.fill(); x.stroke(); x.restore();
};
UI.bakeMap = function (G) {   // a parchment relief of the grid: hill shading, water, cliffs, the road
  const k = 2, W = Math.floor(G.nx / k), H = Math.floor(G.nz / k), c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2; const s = document.createElement('canvas'); s.width = W; s.height = H; const x = s.getContext('2d'), im = x.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const gi = i * k, gj = (H - 1 - j) * k, h = G.H[gj * G.W + gi], hx = G.H[gj * G.W + Math.min(G.nx, gi + k)], hz = G.H[Math.min(G.nz, gj + k) * G.W + gi];
    const sh = clamp(0.5 + (h - hx) * 0.16 + (hz - h) * 0.16, 0, 1), sl = Math.abs(h - hx) + Math.abs(h - hz), road = G.BL[(gj * G.W + gi) * 3]; let r = 196, g = 178, b = 132;
    if (h < -1.2) { r = 128; g = 146; b = 142; } else { const t = clamp(h / 70, 0, 1); r = lerp(186, 150, t); g = lerp(176, 134, t); b = lerp(128, 98, t); { const ck = 1 - 0.3 * smooth(1.6, 5, sl); r *= ck; g *= ck; b *= ck; } if (G.BL[(gj * G.W + gi) * 3 + 1] < 0.3 && h > -1 && fbm2(gi * 0.021 + 3, gj * 0.021, 3) > 0.56 && hash2(i * 3, j * 7) > 0.55) { r *= 0.8; g *= 0.86; b *= 0.72; } if (road > 0.5 && h > -1) { r = 214; g = 198; b = 158; } const m = 0.72 + sh * 0.5; r *= m; g *= m; b *= m; }
    const n = (hash2(i, j) - 0.5) * 10, q = (j * W + i) * 4; im.data[q] = clamp(r + n, 0, 255); im.data[q + 1] = clamp(g + n, 0, 255); im.data[q + 2] = clamp(b + n, 0, 255); im.data[q + 3] = 255; }
  x.putImageData(im, 0, 0); const X = c.getContext('2d'); X.imageSmoothingQuality = 'high'; X.drawImage(s, 0, 0, c.width, c.height);
  const g = X.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.3, c.width / 2, c.height / 2, c.height * 0.75); g.addColorStop(0, 'rgba(60,40,10,0)'); g.addColorStop(1, 'rgba(50,34,10,0.55)'); X.fillStyle = g; X.fillRect(0, 0, c.width, c.height); return c;
};
/* ------------------------------------------------------------------ level up */
UI.pLevel = function () {
  const L = UI.L, R = UI.Rt, s = GAME.save; UI.add = UI.add || {}; let n = 0, cost = 0; for (const k in UI.add) { for (let i = 0; i < UI.add[k]; i++) { cost += OR.levelCost(n); n++; } }
  const nextCost = OR.levelCost(n), can = (s.runes || 0) - cost >= nextCost;
  UI.h('h3', '', 'ATTRIBUTES · SELECT TO RAISE', L);
  for (const [k, name, what] of EQ.attrs) { const add = UI.add[k] || 0, r = UI.h('div', 'row' + (can ? '' : ''), name + ' <span>' + what + '</span>', L); UI.h('div', '', '<b>' + (10 + (s[k] || 0)) + '</b>' + (add ? '<i>→ ' + (10 + (s[k] || 0) + add) + '</i>' : ''), r);
    UI.fc(r, () => {}, () => { if (!can) return; UI.add[k] = (UI.add[k] || 0) + 1; UI._lf = k; UI.render(); }); r.dataset.k = k; }
  const t = UI.h('table', '', null, R), row = (a, b, cls) => { const tr = UI.h('tr', '', null, t); UI.h('td', '', a, tr); UI.h('td', cls || '', String(b), tr); };
  row('Level', OR.level() + (n ? ' → ' + (OR.level() + n) : ''), n ? 'up' : ''); row('Runes held', s.runes || 0); row('Runes needed', cost + (can || n ? '' : ' (next: ' + nextCost + ')')); row('Next level costs', nextCost);
  const a = UI.add; for (const k in a) s[k] = (s[k] || 0) + a[k]; const hp = OR.hpMax(), fp = OR.fpMax(), st = OR.stamMax(); for (const k in a) s[k] -= a[k];
  row('HP', OR.hpMax() + (hp !== OR.hpMax() ? ' → ' + hp : ''), hp !== OR.hpMax() ? 'up' : ''); row('FP', OR.fpMax() + (fp !== OR.fpMax() ? ' → ' + fp : ''), fp !== OR.fpMax() ? 'up' : ''); row('Stamina', OR.stamMax() + (st !== OR.stamMax() ? ' → ' + st : ''), st !== OR.stamMax() ? 'up' : '');
  const ok = UI.fc(UI.h('div', 'btn' + (n ? '' : ' dis'), 'CONFIRM', R), () => {}, () => { for (const k in UI.add) s[k] = (s[k] || 0) + UI.add[k]; s.runes -= cost; UI.add = {}; EQ.refresh(); const p = PLAYER.a; p.hp = p.hpMax = OR.hpMax(); PLAYER.fp = PLAYER.fpMax; PLAYER.stam = OR.stamMax(); GAME.store(); UI.render(); });
  UI.fc(UI.h('div', 'btn' + (n ? '' : ' dis'), 'RESET', R), () => {}, () => { UI.add = {}; UI.render(); }); void ok;
  if (UI._lf) { const e = [...L.querySelectorAll('.row')].find((r) => r.dataset.k === UI._lf); if (e) setTimeout(() => UI.focus(e), 0); }
};
/* ------------------------------------------------------------------ travel */
/* every site of grace is open for travel from the start ([checkpoint, name, boss that must be felled first — the grace only appears once it is]) */
UI.GRACES = { limgrave: [[0, 'The First Step'], [1, 'Church of Elleh'], [2, 'Gatefront'], [3, 'Stormhill Shack'], [4, 'Groveside Cave Entrance'], [5, 'Castleward Tunnel Approach']], cave: [[1, 'Groveside Cave — before the Beastman']],
  margit: [[1, 'Castleward Tunnel — before Margit'], [2, 'Margit, the Fell Omen', 'margit']], stormveil: [[0, 'Stormveil Main Gate'], [1, 'Rampart Tower'], [2, 'Secluded Cell — before Godrick'], [3, 'Godrick the Grafted', 'godrick']] };
UI.pTravel = function () {
  const L = UI.L, s = GAME.save, ctxHere = (lv, cp) => LEVEL.cur.id === lv && UI.ctx && UI.ctx.Gr && UI.ctx.Gr.cp === cp; let n = 0;
  for (const lv of GAME.seq) { const def = LEVEL.defs[lv]; let head = false; (UI.GRACES[lv] || []).forEach(([cp, name, boss]) => { if (boss && !(s.felled && s.felled[boss])) return; if (!head) { UI.h('h3', '', def.name, L); head = true; } n++;
      const title = String(name) + (ctxHere(lv, cp) ? ' <span>you are here</span>' : '');
      UI.fc(UI.h('div', 'row', title, L), () => {}, () => { const here = LEVEL.cur.id === lv; MENU.el().innerHTML = ''; UI.root = null; MG.onKey = null; MENU.cur = null; UI.from = null; const a = PLAYER.a; if (a) { a.setBase('idleCalm', 0.2); PLAYER.state = 'move'; } MG.state = 'play'; OR.curGrace = null;
        if (here) { LEVEL.cur.cp = cp; s.cp = cp; OR.respawn(false); HUD.show(true); } else GAME.travel(lv, cp); }); }); }
  if (!n) UI.h('div', 'dd', 'No other grace has been found.', L);
  UI.h('div', 'dd', 'Every site of lost grace is open to the Tarnished. The two beyond the lords appear once the lord is felled.', UI.Rt);
};
/* ------------------------------------------------------------------ trade and smithing */
UI.pShop = function () {
  const L = UI.L, s = GAME.save, g = UI.h('div', 'grid', null, L);
  for (const [id, price, max] of UI.ctx.wares) { const d = ITEM.DB[id], sold = d.stack ? false : EQ.count(id) > 0, key = (UI.ctx.key || 'shop') + ':' + id, left = max ? max - ((s.bought || {})[key] || 0) : 99; if (sold || left <= 0) continue;
    UI.cell(g, id, price + ' RUNES', { count: max ? left : undefined, extra: '<span class="btn' + ((s.runes || 0) >= price ? '' : ' dis') + '">ENTER · BUY FOR ' + price + '</span>', click: () => { if ((s.runes || 0) < price) { UI.h('div', 'dd dnn', 'Not enough runes.', UI.Rt); return; } s.runes -= price; s.bought = s.bought || {}; s.bought[key] = (s.bought[key] || 0) + 1; EQ.give(id, id === 'dagger_throw' ? 5 : 1, true); UI.render(); } }); }
};
UI.pSmith = function () {
  const L = UI.L, s = GAME.save, g = UI.h('div', 'grid', null, L);
  for (const id of ITEM.order) { const d = ITEM.DB[id]; if (d.cat !== 'weapon' || !EQ.count(id)) continue; const lv = EQ.upLevel(id), need = lv + 1, cost = 300 * (lv + 1), can = lv < 5 && EQ.count('stone1') >= need && (s.runes || 0) >= cost;
    UI.cell(g, id, undefined, { eqd: s.eq.rh === id, extra: lv >= 5 ? 'This armament can be strengthened no further here.' : 'Strengthen to +' + (lv + 1) + ': <b>' + need + '</b> Smithing Stone [1] (held ' + EQ.count('stone1') + ') and <b>' + cost + '</b> runes.<br><span class="btn' + (can ? '' : ' dis') + '">ENTER · STRENGTHEN</span>',
      click: () => { if (!can) return; EQ.take('stone1', need); s.runes -= cost; s.up[id] = lv + 1; UI.render(); } }); }
};
/* ------------------------------------------------------------------ hooks: pause → menu, grace menu, HUD slots, item pop-ups */
(function () {
  const open0 = MENU.open;
  MENU.open = function (name, o) {
    if (name === 'pause') { UI.open('equip'); return; }
    if (name === 'grace') {
      o = o || {}; MENU.cur = name; MENU.sel = 0; if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { /* */ }
      const s = GAME.save, seeds = EQ.count('seed'), d = MENU.mk(`<div class="hd">${o.Gr.name}</div><div class="sub2">SITE OF GRACE</div><div class="mlist">
        <div class="mi" id="mLvl">LEVEL UP<small>${OR.levelCost()} runes to the next level</small></div>
        <div class="mi" id="mTrv">TRAVEL<small>to another site of grace</small></div>
        <div class="mi ${seeds ? '' : 'dis'}" id="mFlk">SACRED FLASK<small>${seeds ? 'use a Golden Seed for one more charge' : 'no Golden Seed held'}</small></div>
        <div class="mi" id="mEq">EQUIPMENT<small>arms, armour, skills and spells</small></div>
        <div class="mi" id="mLeave">LEAVE</div></div>
        <div class="stats">Level <b>${OR.level()}</b> · Runes <b>${s.runes || 0}</b><br>Flask of Crimson Tears <b>${s.flaskMax || 3}</b> · Cerulean <b>${s.ceruMax || 1}</b></div>`, 'grace');
      const sub = (from, tab) => () => { MENU.el().innerHTML = ''; MG.onKey = null; UI.add = {}; UI.open(tab || 'equip', { from, Gr: o.Gr }); if (from !== 'grace') { const c0 = UI.close; void c0; } };
      MENU.item(d, '#mLvl', () => { MENU.el().innerHTML = ''; UI.add = {}; UI.openSub('level', o.Gr); }); MENU.item(d, '#mTrv', () => { MENU.el().innerHTML = ''; UI.openSub('travel', o.Gr); });
      MENU.item(d, '#mFlk', () => { if (!EQ.count('seed')) return; EQ.take('seed'); if ((s.flaskMax || 3) <= (s.ceruMax || 1) * 3 - 1 + 3) s.flaskMax = (s.flaskMax || 3) + 1; else s.ceruMax = (s.ceruMax || 1) + 1; OR.flasks = s.flaskMax; OR.flasksC = s.ceruMax; GAME.store(); MENU.open('grace', o); });
      MENU.item(d, '#mEq', sub('grace', 'equip')); MENU.item(d, '#mLeave', () => OR.leaveGrace());
      MENU.bindList(d, () => OR.leaveGrace()); return;
    }
    return open0(name, o);
  };
  /* sub-pages of the grace (level up, travel) and of the world (shop, smith) return where they came from */
  UI.openSub = function (kind, Gr, ctx) { UI.open('equip', Object.assign({ from: kind, Gr }, ctx || {})); };
  const cl0 = UI.close;
  UI.close = function () { const from = UI.from, ctx = UI.ctx; if (from === 'level' || from === 'travel') { MENU.el().innerHTML = ''; UI.root = null; MG.onKey = null; MENU.cur = null; UI.from = null; GAME.store(); MENU.open('grace', { Gr: ctx.Gr }); return; }
    if (from === 'shop' || from === 'smith') { UI.from = 'talk'; } cl0(); };
  const hi0 = HUD.init; HUD.init = function () { hi0(); for (const id of ['slItemI', 'slAshI', 'slSpellI', 'slSpell', 'itemI']) HUD.el[id] = MG.$(id); };
  HUD.item = function (name, desc, id) { const E = HUD.el; E.itemN.textContent = name; E.itemD.textContent = desc || ''; if (E.itemI) E.itemI.src = id && ITEM.DB[id] ? ICON.get(id) : ''; E.itemPop.classList.add('on'); HUD.itemT = 3.4; };
  const hu0 = HUD.update;
  HUD.update = function (dt) {
    hu0(dt); const E = HUD.el, s = GAME.save; if (!s.eq || !E.slItemI) return;
    const qid = s.eq.quick[s.eq.qi] || s.eq.quick.find((x) => x) || null, d = ITEM.DB[qid], n = !d ? 0 : d.flask === 'hp' ? OR.flasks : d.flask === 'fp' ? (OR.flasksC || 0) : EQ.count(qid);
    const sid = s.eq.spell[s.eq.si] || s.eq.spell.find((x) => x) || null, key = qid + '|' + n + '|' + s.eq.ash + '|' + sid;
    if (HUD._q !== key) { HUD._q = key; E.slItemI.src = d ? ICON.get(qid) : ''; E.flaskN.textContent = d ? n : ''; E.slFlask.classList.toggle('empty', !n); E.slAshI.src = s.eq.ash ? ICON.get(s.eq.ash) : ''; E.slSpellI.src = sid ? ICON.get(sid) : ''; E.slSpell.classList.toggle('off', !sid); }
    if (MG.state === 'play' && !MENU.cur && PLAYER.a && PLAYER.a.alive && PLAYER.state !== 'cine' && MG.rt > (OR.noPauseT || 0)) { if (IN.hit('menu')) UI.open('equip'); else if (IN.hit('map')) UI.open('map'); }
  };
  /* loot can carry items */
  const lt0 = OR.loot; OR.loot = function (o) { if (o.give) { for (const [id, n] of o.give) EQ.give(id, n); if (o.runes) OR.addRunes(o.runes); if (o.fn) o.fn(); GAME.store(); return; } lt0(o); };
})();
