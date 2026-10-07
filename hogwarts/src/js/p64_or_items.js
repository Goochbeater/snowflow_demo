/* ==== p64_or_items.js ==== */
/* OPUS RING — what the Tarnished owns and wears: armaments, shields, armour sets, talismans, Ashes of War, spells,
   consumables, key items and smithing stones; the equipment that follows from them (stats, load, the body on screen);
   seven attributes; icons for all of it. */
const ITEM = { DB: {}, order: [] };
const EQ = { buffs: {} };
ITEM.GRADE = { S: 1.5, A: 1.25, B: 1.0, C: 0.75, D: 0.5, E: 0.25, '-': 0 };
ITEM.def = function (id, cat, name, o) { const d = Object.assign({ id, cat, name, desc: '', wt: 0 }, o || {}); ITEM.DB[id] = d; ITEM.order.push(id); return d; };
ITEM.CATS = [['weapon', 'Armaments'], ['shield', 'Shields'], ['armor', 'Armour'], ['talisman', 'Talismans'], ['ash', 'Ashes of War'], ['spell', 'Spells'], ['use', 'Tools'], ['key', 'Key Items']];
(function () {
  const W = (id, name, kind, dmg, spd, stam, sc, wt, desc, x) => ITEM.def(id, 'weapon', name, Object.assign({ kind, dmg, spd, stam, sc, wt, desc }, x || {}));
  W('longsword', 'Longsword', 'longsword', 1.0, 1.0, 1.0, 'DD', 3.5, 'A straight sword with a long, slender blade. Well balanced between cut and thrust; the weapon of a wandering knight.');
  W('lordsworn_gs', "Lordsworn's Greatsword", 'greatsword', 1.5, 0.8, 1.35, 'CD', 9, 'Greatsword carried by the knights sworn to the lords of the land. Slow, heavy, and it staggers what it strikes.', { poise: 1.6 });
  W('uchigatana', 'Uchigatana', 'uchigatana', 0.95, 1.12, 0.9, 'DC', 5.5, 'A katana with a long single-edged curved blade, forged in the Land of Reeds. Its cuts open wounds that bleed.', { bleed: 0.18 });
  W('short_spear', 'Short Spear', 'spear', 0.92, 1.06, 0.9, 'DD', 3, 'A spear with a short reach for its kind, easily wielded behind a raised shield.');
  W('halberd', 'Halberd', 'halberd', 1.28, 0.86, 1.2, 'DD', 8, 'A long shaft crowned with both spear and axe. Reaches further than any sword.', { poise: 1.3 });
  W('club', 'Spiked Club', 'club', 1.12, 0.94, 1.05, 'C-', 4, 'A stout wooden club studded with iron. Simple, and brutal on plate.', { poise: 1.4 });
  W('mace', 'Mace', 'mace', 1.18, 0.92, 1.1, 'CE', 5, 'A flanged iron mace. Its blows land heavy and break a guard quickly.', { poise: 1.6 });
  W('warhammer', 'Warpick', 'warhammer', 1.08, 0.98, 1.0, 'DD', 4.5, 'A hammer with a long beak, made to punch through armour.', { poise: 1.3 });
  W('beast_cleaver', "Beastman's Cleaver", 'cleaver', 1.4, 0.84, 1.3, 'B-', 9.5, 'A great curved cleaver of pitted iron, carried by the beastmen of Farum Azula.', { poise: 1.5 });
  W('golden_halberd', 'Golden Halberd', 'ghalberd', 1.62, 0.78, 1.45, 'CD', 13, 'The gilded halberd of a Tree Sentinel, blessed by the Erdtree. Holy light clings to its edge.', { poise: 1.6, holy: 0.2 });
  W('godrick_axe', 'Axe of Godrick', 'gaxe', 1.7, 0.8, 1.4, 'BD', 11, 'The golden greataxe of Godrick the Grafted, inscribed with the beasts of his line.', { poise: 1.8 });
  const S = (id, name, kind, guard, stab, wt, desc, x) => ITEM.def(id, 'shield', name, Object.assign({ kind, guard, stab, wt, desc }, x || {}));
  S('shield_round', 'Riveted Wooden Shield', 'round', 0.78, 1.0, 2, 'A round shield of dark planks bound with iron. Light, but hard blows will drive it aside.');
  S('shield_heater', 'Heater Shield', 'heater', 0.88, 0.95, 3.5, 'An iron-faced shield painted with the red of Godrick\'s levy.');
  S('shield_kite', 'Kite Shield', 'kite', 0.92, 0.85, 4.5, 'A long metal shield that covers the body from shoulder to knee.');
  S('shield_great', 'Gilded Greatshield', 'great', 0.97, 0.62, 9, 'A slab of gilded iron as tall as a man. Almost nothing passes it; it is heavy to hold up.');
  const A = (id, name, tpl, def, poise, wt, desc) => ITEM.def(id, 'armor', name, { tpl, def, poise, wt, desc });
  A('set_vagabond', 'Vagabond Knight Set', 'tarnished', 0.16, 12, 19, 'Worn plate and a patched travelling cloak: the harness of a knight exiled from the land of his birth.');
  A('set_soldier', 'Godrick Soldier Set', 'soldier', 0.1, 6, 11, 'Kettle helm, mail coif and the red surcoat of Godrick\'s foot soldiers.');
  A('set_exile', 'Exile Set', 'exile', 0.12, 9, 13, 'Hood, heavy mantle and blackened half-plate of the banished men who hold Stormveil.');
  A('set_knight', 'Godrick Knight Set', 'knight', 0.22, 18, 26, 'Full plate with a red plume and cloak. Knights of the Grafted lord fight as if they had nothing left.');
  A('set_banished', 'Banished Knight Set', 'banished', 0.26, 24, 31, 'Blackened plate under a wolf pelt. Banished knights were great men once; their arms still are.');
  A('set_sentinel', 'Tree Sentinel Set', 'sentinel', 0.3, 30, 38, 'Gold from crest to spur. The Tree Sentinels guard the Erdtree and those who serve it.');
  const T = (id, name, fx, desc, col) => ITEM.def(id, 'talisman', name, { fx, desc, col, wt: 0.5 });
  T('tal_crimson', 'Crimson Amber Medallion', { hp: 0.08 }, 'A medallion set with crimson amber. Raises maximum HP.', '#b03a2e');
  T('tal_cerulean', 'Cerulean Amber Medallion', { fp: 0.14 }, 'A medallion set with cerulean amber. Raises maximum FP.', '#3a6ab0');
  T('tal_viridian', 'Viridian Amber Medallion', { stam: 0.12 }, 'A medallion set with viridian amber. Raises maximum stamina.', '#3a9a52');
  T('tal_turtle', 'Green Turtle Talisman', { regen: 0.3 }, 'A talisman shaped like a green turtle. Stamina returns more quickly.', '#5a8a4a');
  T('tal_axe', 'Axe Talisman', { heavy: 0.18 }, 'A talisman in the shape of an axe. Heavy attacks strike harder.', '#9a8a6a');
  T('tal_scarab', 'Gold Scarab', { runes: 0.2 }, 'A golden scarab. More runes come from every enemy felled.', '#d9a63c');
  T('tal_dragoncrest', 'Dragoncrest Shield Talisman', { def: 0.1 }, 'An iron shield bearing an ancient dragon. Wounds from blade and blow are lessened.', '#7a7f8a');
  T('tal_favor', "Erdtree's Favor", { hp: 0.04, stam: 0.07, load: 5 }, 'A talisman from the Erdtree itself. Raises HP, stamina and the load one can bear.', '#e8c860');
  T('tal_sacrificial', 'Sacrificial Twig', { keepRunes: 1 }, 'A twig cut from the Erdtree. Lost in the wearer\'s place on death: runes are not dropped.', '#c8b88a');
  const H = (id, name, fp, desc, col) => ITEM.def(id, 'ash', name, { fp, desc, col });
  H('ash_storm', 'Ash of War: Stormcaller', 14, 'Skill of the Stormveil knights. Whirl the blade overhead to raise a ring of wind that throws back everything near.', '#9fc4ff');
  H('ash_lion', "Ash of War: Lion's Claw", 20, 'Skill of the Redmanes. Leap forward, turning, and bring the weapon down with all your weight.', '#ffb060');
  H('ash_frost', 'Ash of War: Hoarfrost Stomp', 16, 'Stamp the ground to send a trail of freezing mist along it. Frost slows those it bites.', '#aee8ff');
  H('ash_hound', "Ash of War: Bloodhound's Step", 8, 'Skill that makes the body vanish for an instant, to reappear a long step away.', '#6a6a7a');
  H('ash_sacred', 'Ash of War: Sacred Blade', 18, 'Throw a blade of golden light, then keep its blessing on the weapon for a while.', '#ffe08a');
  H('ash_flame', 'Ash of War: Flaming Strike', 15, 'Sweep a fan of flame before you. The weapon keeps the fire for a time.', '#ff7a3a');
  H('ash_resolve', 'Ash of War: Determination', 10, 'Hold the blade to your brow in a wordless vow. Your next blow lands far harder.', '#ff5a5a');
  const P = (id, name, fp, school, desc, col) => ITEM.def(id, 'spell', name, { fp, school, desc, col });
  P('sp_pebble', 'Glintstone Pebble', 8, 'int', 'The first sorcery taught at Raya Lucaria. Fires a shard of glintstone at the foe.', '#7ab8ff');
  P('sp_lightning', 'Lightning Spear', 16, 'fai', 'An incantation of the capital\'s ancient dragon cult. Hurl a spear of golden lightning.', '#ffe070');
  P('sp_flame', 'Flame Sling', 12, 'fai', 'An incantation of the fire monks. Throw a ball of raging flame that bursts where it lands.', '#ff8a3a');
  P('sp_heal', 'Heal', 26, 'fai', 'An incantation of the Two Fingers. Restores a great deal of HP to the caster and to allies nearby.', '#ffe8a0');
  P('sp_reject', 'Rejection', 12, 'fai', 'Produce a burst of golden force that drives back all who stand close.', '#ffd060');
  const U = (id, name, desc, o) => ITEM.def(id, 'use', name, Object.assign({ desc }, o || {}));
  U('flask_crimson', 'Flask of Crimson Tears', 'A sacred flask modelled on a golden holy chalice. Filled with crimson tears, it restores HP. Rest at a site of grace to refill it.', { flask: 'hp' });
  U('flask_cerulean', 'Flask of Cerulean Tears', 'Filled with cerulean tears, the flask restores FP. Rest at a site of grace to refill it.', { flask: 'fp' });
  U('dagger_throw', 'Throwing Dagger', 'A small dagger weighted for the hand. Thrown at enemies from a distance.', { stack: 99, col: '#b9bec6' });
  U('fire_pot', 'Fire Pot', 'A clay pot packed with burning pitch. Bursts into flame where it lands.', { stack: 20, col: '#c8683a' });
  U('fire_grease', 'Fire Grease', 'Grease that sets the armament alight for a short while, adding fire to every blow.', { stack: 10, col: '#e88a3a' });
  U('crab', 'Boiled Crab', 'A whole boiled crab, eaten shell and all. Hardens the body against blows for a time.', { stack: 20, col: '#c85a4a' });
  U('rune1', 'Golden Rune [1]', 'A faint remnant of grace found on the fallen. Use to gain 200 runes.', { stack: 99, runes: 200, col: '#e8c860' });
  U('rune3', 'Golden Rune [3]', 'A remnant of grace found on the fallen. Use to gain 600 runes.', { stack: 99, runes: 600, col: '#f0d070' });
  U('rune7', 'Golden Rune [7]', 'A strong remnant of grace. Use to gain 1800 runes.', { stack: 99, runes: 1800, col: '#ffe090' });
  const K = (id, name, desc, o) => ITEM.def(id, 'key', name, Object.assign({ desc }, o || {}));
  K('whistle', 'Spectral Steed Whistle', 'A ring that whistles when blown. Summons the spectral steed Torrent.', { col: '#9fc4ff' });
  K('stone1', 'Smithing Stone [1]', 'A stone found on the bodies of the fallen and in the rock of Limgrave. Strengthens armaments at a smithing table.', { stack: 99, col: '#8a8f9a' });
  K('seed', 'Golden Seed', 'A seed fallen from the Erdtree. Adds a charge to the sacred flask at a site of grace.', { stack: 30, col: '#ffd060' });
  K('rune_godrick', "Godrick's Great Rune", 'The Great Rune of the shardbearer Godrick. Even in pieces, the Elden Ring grants its bearer strength.', { col: '#ffcf5a' });
  K('pouch', 'Talisman Pouch', 'A pouch for carrying talismans. Allows one more talisman to be worn.', { col: '#a88a5a' });
})();
/* scanned and curved blades join the forge's kinds */
(function () {
  const scan = (name, sc, y, o) => function () { if (!(typeof AST !== 'undefined' && AST.sets[AST.info(name).tex])) return WPN.pole({ len: 1.1, head: 'club', below: 0.3 });
    const g = new THREE.Group(), me = new THREE.Mesh(AST.geometry(name), AST.material(name, { metal: 1, env: 0.9, rough: 0.9 })); me.scale.setScalar(sc); me.position.y = y; me.castShadow = true; g.add(me); g.userData = Object.assign({ ends: [0.2], grips: [-0.05, 0.08], len: 0.9, blade: 0.5, steel: true }, o); return g; };
  WPN.KINDS.mace = scan('mace', 1.6, 0.02, { ends: [0.2], blade: 0.78, len: 1.0 });
  WPN.KINDS.warhammer = scan('hammer', 1.5, 0.06, { ends: [0.25], blade: 0.8, len: 1.0 });
  WPN.KINDS.uchigatana = () => { const g = WPN.sword({ blade: 0.96, w: 0.019, w1: 0.017, t: 0.005, grip: 0.3, guard: 0.07, curve: 0.075, tip: 0.12, fuller: 0, pommel: 0.016 }); return WPN.bake(g); };
})();
/* ------------------------------------------------------------------ ownership */
EQ.S = () => GAME.save;
EQ.DEF = () => ({ rh: 'longsword', lh: 'shield_round', armor: 'set_vagabond', ash: 'ash_storm', tal: [null, null, null], quick: ['flask_crimson', 'flask_cerulean', null, null], qi: 0, spell: [null, null], si: 0 });
EQ.ensure = function () {
  const s = EQ.S(); s.inv = s.inv || {}; s.up = s.up || {}; s.eq = Object.assign(EQ.DEF(), s.eq || {});
  for (const id of ['longsword', 'shield_round', 'set_vagabond', 'ash_storm', 'flask_crimson', 'flask_cerulean']) if (!s.inv[id]) s.inv[id] = 1;
  if (s.torrent && !s.inv.whistle) s.inv.whistle = 1;
  for (const k of ['mind', 'dex', 'int', 'fai']) s[k] = s[k] || 0; if (s.ceruMax === undefined) s.ceruMax = 1;
  for (const k of ['rh', 'lh', 'armor', 'ash']) if (s.eq[k] && !ITEM.DB[s.eq[k]]) s.eq[k] = EQ.DEF()[k];
  if (OR.flasksC === undefined) OR.flasksC = s.ceruMax;
};
EQ.count = (id) => (EQ.S().inv && EQ.S().inv[id]) || 0;
EQ.give = function (id, n, quiet) { const s = EQ.S(), d = ITEM.DB[id]; if (!d) return; s.inv = s.inv || {}; n = n || 1;
  if (id === 'seed') { /* kept as an item: spent at grace */ }
  s.inv[id] = Math.min(d.stack || (d.cat === 'use' || d.cat === 'key' ? 1 : 1), (s.inv[id] || 0) + n);
  if (d.cat === 'use' && !d.flask) { const q = s.eq.quick; if (!q.includes(id)) { const i = q.indexOf(null); if (i >= 0) q[i] = id; } }
  if (d.cat === 'spell') { const q = s.eq.spell; if (!q.includes(id)) { const i = q.indexOf(null); if (i >= 0) q[i] = id; } }
  if (!quiet) HUD.item(d.name + (n > 1 ? ' ×' + n : ''), ITEM.catName(d.cat), id);
};
ITEM.catName = (c) => ({ weapon: 'Armament', shield: 'Shield', armor: 'Armour', talisman: 'Talisman', ash: 'Ash of War', spell: 'Spell', use: 'Tool', key: 'Key item' }[c] || '');
EQ.take = function (id, n) { const s = EQ.S(); s.inv[id] = Math.max(0, (s.inv[id] || 0) - (n || 1)); if (!s.inv[id]) { delete s.inv[id]; const q = s.eq.quick, i = q.indexOf(id); if (i >= 0) q[i] = null; } };
EQ.W = () => ITEM.DB[EQ.S().eq.rh] || ITEM.DB.longsword;
EQ.Sh = () => ITEM.DB[EQ.S().eq.lh] || null;
EQ.A = () => ITEM.DB[EQ.S().eq.armor] || ITEM.DB.set_vagabond;
EQ.Ash = () => ITEM.DB[EQ.S().eq.ash] || null;
EQ.talSlots = () => 2 + (EQ.count('pouch') ? 1 : 0);
EQ.tal = function (k) { const s = EQ.S(); let v = 0; for (let i = 0; i < EQ.talSlots(); i++) { const d = ITEM.DB[s.eq.tal[i]]; if (d && d.fx[k]) v += d.fx[k]; } return v; };
EQ.buff = (k) => (EQ.buffs[k] || 0) > MG.t;
EQ.load = function () { const s = EQ.S(); let w = EQ.W().wt + EQ.A().wt + (EQ.Sh() ? EQ.Sh().wt : 0); for (let i = 0; i < EQ.talSlots(); i++) { const d = ITEM.DB[s.eq.tal[i]]; if (d) w += d.wt; } return w; };
EQ.loadMax = () => 48 + (EQ.S().end || 0) * 2.2 + EQ.tal('load');
EQ.heavy = () => EQ.load() / EQ.loadMax() > 0.7;
EQ.upLevel = (id) => (EQ.S().up && EQ.S().up[id]) || 0;
EQ.atk = function (w) { const s = EQ.S(); w = w || EQ.W(); const g = ITEM.GRADE; return w.dmg * (1 + 0.08 * EQ.upLevel(w.id)) * (1 + g[w.sc[0]] * (s.str || 0) * 0.05 + g[w.sc[1]] * (s.dex || 0) * 0.05); };
EQ.attrs = [['vig', 'Vigor', 'HP'], ['mind', 'Mind', 'FP'], ['end', 'Endurance', 'Stamina and equip load'], ['str', 'Strength', 'Heavy armaments'], ['dex', 'Dexterity', 'Swift armaments'], ['int', 'Intelligence', 'Sorceries'], ['fai', 'Faith', 'Incantations']];
/* derived numbers (the rules ask these every frame) */
OR.hpMax = () => Math.round((100 + (OR.S().vig || 0) * 14) * (1 + EQ.tal('hp')) * (OR.S().inv && OR.S().inv.rune_godrick ? 1.1 : 1));
OR.stamMax = () => Math.round((100 + (OR.S().end || 0) * 9) * (1 + EQ.tal('stam')));
OR.fpMax = () => Math.round((60 + (OR.S().mind || 0) * 9) * (1 + EQ.tal('fp')));
OR.attrSum = () => { const s = OR.S(); let n = 0; for (const a of EQ.attrs) n += s[a[0]] || 0; return n; };
OR.levelCost = (extra) => 280 + (OR.attrSum() + (extra || 0)) * 150;
OR.level = () => 1 + OR.attrSum();
OR.dmgMul = () => EQ.atk() * (EQ.buff('fire') ? 1.2 : 1) * (EQ.buff('holy') ? 1.15 : 1) * (EQ.buffs.resolve ? 1.6 : 1);
OR.spellMul = (school) => 1 + (OR.S()[school] || 0) * 0.09;
OR.defMul = (info) => (info && (info.kind === 'fall') ? 1 : (1 - EQ.A().def) * (1 - EQ.tal('def')) * (EQ.buff('crab') ? 0.8 : 1));
OR.guardLeak = () => (EQ.Sh() ? 1 - EQ.Sh().guard : 0.5);
OR.guardStam = () => (EQ.Sh() ? EQ.Sh().stab : 1.5) * 1.15;
(function () { const ar0 = OR.addRunes; OR.addRunes = function (n) { ar0(n); }; })();
/* ------------------------------------------------------------------ the body on screen */
EQ.applyWeapon = function () {
  const a = PLAYER.a; if (!a) return; const w = EQ.W(), old = PLAYER.saber;
  if (old && old.kind === w.kind) return;
  if (old) old.remove();
  const S = new Weapon(w.kind, { prio: 5 }); S.addTo(R.scene); a.saber = S; PLAYER.saber = S; a.setProp(S, false); PLAYER.prevSegs = []; if (COMBAT.snapBlades) COMBAT.snapBlades(S, PLAYER.prevSegs);
};
EQ.applyShield = function () {
  const a = PLAYER.a; if (!a) return; if (a.shieldMesh && a.shieldMesh.parent) a.shieldMesh.parent.remove(a.shieldMesh); a.shieldMesh = null;
  const d = EQ.Sh(); if (!d) return; const sh = WPN.heroShield(d.kind); a.inst.bones[7].add(sh); WPN.strapSide(sh); a.shieldMesh = sh;
};
WPN.heroShield = function (kind) {
  if (kind === 'round') return WPN.roundShield(0.28);
  if (kind === 'kite' && typeof AST !== 'undefined' && AST.sets.kite_shield_body) { const g = new THREE.Group(); for (const n of ['kiteBody', 'kiteTrim']) { const me = new THREE.Mesh(AST.geometry(n), AST.material(n, { metal: n === 'kiteTrim' ? 1 : 0.4, env: 0.7, rough: 1 })); me.scale.setScalar(0.62); me.castShadow = true; g.add(me); } return g; }
  // strapSide expects the face toward +Z and the height along +Y: the forged shields are built that way round
  return WPN.shield(kind === 'great' ? 'great' : 'heater', 0x7a1a14, 0xc9a24a);
};
/* armour: the hero is rebuilt from that set's template, where he stands */
EQ.applyArmor = async function () {
  const tpl = EQ.A().tpl; if (CHAR.T[tpl] && CHAR.T.maul === CHAR.T[tpl]) return;
  await CAST.need([tpl]); const T = CHAR.T[tpl]; T.stats = T.stats || {}; CHAR.T.maul = T;
  const a = PLAYER.a; if (!a) return; const st = { x: a.x, y: a.y, z: a.z, yaw: a.yaw, hp: a.hp, state: PLAYER.state, base: a.base, fp: PLAYER.fp, stam: PLAYER.stam };
  const i = COMBAT.actors.indexOf(a); if (i >= 0) COMBAT.actors.splice(i, 1);
  const cy = CAM.yaw, cp = CAM.pitch; PLAYER.spawn(st.x, st.y, st.z, st.yaw); const b = PLAYER.a; b.hp = Math.min(st.hp, b.hpMax); PLAYER.fp = st.fp; PLAYER.stam = st.stam; CAM.yaw = cy; CAM.pitch = cp;
  if (st.state === 'cine') { PLAYER.state = 'cine'; b.setBase(st.base, 0); }
};
EQ.refresh = function () { const a = PLAYER.a; PLAYER.fpMax = OR.fpMax(); if (a) { a.hpMax = OR.hpMax(); a.hp = Math.min(a.hp, a.hpMax); } PLAYER.fp = Math.min(PLAYER.fp, PLAYER.fpMax); PLAYER.stam = Math.min(PLAYER.stam, OR.stamMax()); };
(function () {
  const sp0 = PLAYER.spawn;
  PLAYER.spawn = function (x, y, z, yaw) { EQ.ensure(); const T = CHAR.T[EQ.A().tpl]; if (T) { T.stats = T.stats || {}; CHAR.T.maul = T; }
    const a = sp0(x, y, z, yaw); PLAYER.fpMax = OR.fpMax(); PLAYER.fp = PLAYER.fpMax; EQ.applyWeapon(); EQ.applyShield(); a.physics(0); a.animate(0.016); a.pose3D(0.016); return a; };
  const at0 = PLAYER.attack;
  PLAYER.attack = function (name) { at0(name); const a = PLAYER.a, w = EQ.W(); if (a.act && PLAYER.state === 'attack') { a.actSpeed *= w.spd; PLAYER.stam -= (OR.COST[a.act] || 12) * (w.stam - 1); if ((a.act === 'heavy') && EQ.tal('heavy')) EQ._heavyK = 1 + EQ.tal('heavy'); else EQ._heavyK = 1; } };
  const lh0 = PLAYER.landHit;
  PLAYER.landHit = function (t, p, dmg, kind) { const w = EQ.W(); dmg *= (EQ._heavyK || 1);
    lh0(t, p, dmg, kind);
    if (EQ.buffs.resolve) { EQ.buffs.resolve = 0; FX.ring(p, [3, 0.6, 0.4], 2.2, 0.3); }
    if (w.bleed && t.alive) { t._bleed = (t._bleed || 0) + w.bleed; if (t._bleed >= 1) { t._bleed = 0; const d = Math.min(t.hpMax * 0.12, 90) + 20; COMBAT.damage(t, d, { src: PLAYER.a, kind: 'bleed', unblockable: true }); FX.puff(p, 16, { size: 0.16, grow: 3, col: [0.5, 0.02, 0.02], a: 0.9, life: 0.7, spread: 3.2, rise: -3, drag: 2 }); HUD.pop('BLOOD LOSS'); if (t.isBoss && HUD.bossHit) HUD.bossHit(d); } }
    if ((EQ.buff('fire') || EQ.buff('holy')) && t.alive !== undefined) FX.puff(p, 5, { add: true, size: 0.2, grow: 2, col: EQ.buff('fire') ? [3, 1.1, 0.3] : [2.6, 2.0, 0.7], a: 0.8, life: 0.4, spread: 1.6, rise: 1 }); };
  const ok0 = PLAYER.onKill;
  PLAYER.onKill = function (t) { const r0 = t.runes; if (t.runes && EQ.tal('runes')) t.runes = Math.round(t.runes * (1 + EQ.tal('runes'))); ok0(t); t.runes = r0; EQ.drop(t); };
  const ng0 = GAME.newGame; GAME.newGame = function () { EQ.buffs = {}; const r = ng0(); return r; };
  const f0 = GAME.fresh; GAME.fresh = () => { const s = f0(); s.mind = 0; s.dex = 0; s.int = 0; s.fai = 0; s.ceruMax = 1; s.inv = { longsword: 1, shield_round: 1, set_vagabond: 1, ash_storm: 1, flask_crimson: 1, flask_cerulean: 1 }; s.up = {}; s.eq = EQ.DEF(); return s; };
  GAME.save = GAME.fresh();
})();
/* what the fallen leave behind */
EQ.DROPS = { soldier: [['dagger_throw', 0.14, 3], ['stone1', 0.07, 1], ['rune1', 0.05, 1]], footman: [['dagger_throw', 0.14, 3], ['stone1', 0.07, 1], ['crab', 0.05, 1]], knight: [['stone1', 0.3, 1], ['rune3', 0.12, 1]], exile: [['fire_pot', 0.16, 2], ['stone1', 0.1, 1]],
  banished: [['stone1', 0.4, 2], ['rune3', 0.2, 1]], noble: [['rune1', 0.3, 1], ['fire_grease', 0.08, 1]], troll: [['rune7', 1, 1], ['stone1', 0.6, 2]], wolf: [['rune1', 0.06, 1]] };
EQ.drop = function (t) { if (MG.test) return; const key = (t.D && t.D.tpl) || (t.isBeast ? 'wolf' : null), tb = EQ.DROPS[key]; if (!tb) return; for (const [id, p, n] of tb) if (RNG() < p) { EQ.give(id, n); break; } };
/* ------------------------------------------------------------------ icons */
const ICON = { cache: {} };
ICON.get = function (id) {
  if (ICON.cache[id]) return ICON.cache[id]; const d = ITEM.DB[id]; if (!d) return '';
  let url = null;
  try { if (d.cat === 'weapon') url = ICON.render(WPN.KINDS[d.kind](), { tilt: -0.72 }); else if (d.cat === 'shield') url = ICON.render(WPN.heroShield(d.kind), { tilt: 0, face: true }); } catch (e) { url = null; }
  if (!url) url = ICON.glyph(d);
  ICON.cache[id] = url; return url;
};
/* a studio shot of a model: lit from the upper left, on nothing */
ICON.render = function (obj, o) {
  o = o || {}; const N = 160, r = R.renderer; if (!ICON.rt) { ICON.rt = new THREE.WebGLRenderTarget(N, N, { depthBuffer: true }); ICON.sc = new THREE.Scene(); ICON.sc.add(new THREE.HemisphereLight(0xfff4e0, 0x6a6048, 5.5)); const dl = new THREE.DirectionalLight(0xffffff, 7); dl.position.set(-1.5, 2.5, 3); ICON.sc.add(dl); ICON.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50); ICON.cv = document.createElement('canvas'); ICON.cv.width = ICON.cv.height = N; }
  const sc = ICON.sc, holder = new THREE.Group(); holder.add(obj); obj.traverse((m) => { if (m.isMesh) m.frustumCulled = false; }); sc.add(holder); sc.environment = R.scene.environment;
  if (o.face) holder.rotation.set(0.05, -0.35, 0); else holder.rotation.set(0, 0.5, o.tilt || 0);
  holder.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(holder), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), h = Math.max(sz.x, sz.y) * 0.54 + 0.01;
  const cam = ICON.cam; cam.left = -h; cam.right = h; cam.top = h; cam.bottom = -h; cam.position.set(c.x, c.y, c.z + 10); cam.lookAt(c); cam.updateProjectionMatrix();
  const prev = r.getRenderTarget(), ca = r.getClearAlpha(), cc = r.getClearColor(new THREE.Color()); r.setRenderTarget(ICON.rt); r.setClearColor(0x000000, 0); r.clear(true, true, true); r.render(sc, cam);
  const px = new Uint8Array(N * N * 4); r.readRenderTargetPixels(ICON.rt, 0, 0, N, N, px); r.setRenderTarget(prev); r.setClearColor(cc, ca); sc.remove(holder);
  const x = ICON.cv.getContext('2d'), im = x.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const s = ((N - 1 - j) * N + i) * 4, t = (j * N + i) * 4; for (let k = 0; k < 3; k++) im.data[t + k] = Math.pow(px[s + k] / 255, 1 / 2.2) * 255; im.data[t + 3] = px[s + 3]; }
  x.putImageData(im, 0, 0); return ICON.cv.toDataURL('image/png');
};
ICON.glyph = function (d) {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), col = d.col || '#c8b88a', m = N / 2;
  const glow = (cx, cy, r, cl, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, cl); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a || 1; x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.globalAlpha = 1; };
  x.lineJoin = 'round'; x.lineCap = 'round';
  if (d.flask) { const cl = d.flask === 'hp' ? '#c22a22' : '#2a5ad0'; glow(m, m + 8, 54, cl, 0.35);
    x.fillStyle = '#c9a24a'; x.fillRect(m - 9, 16, 18, 14); x.fillStyle = '#8a6a2a'; x.fillRect(m - 12, 28, 24, 6);
    x.beginPath(); x.moveTo(m - 9, 34); x.bezierCurveTo(m - 40, 52, m - 36, 108, m, 110); x.bezierCurveTo(m + 36, 108, m + 40, 52, m + 9, 34); x.closePath(); x.fillStyle = cl; x.fill(); x.lineWidth = 4; x.strokeStyle = '#d9b860'; x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(m - 12, 66, 6, 18, 0.3, 0, TAU); x.fill(); }
  else if (d.cat === 'talisman') { glow(m, m, 58, col, 0.4); x.strokeStyle = '#6a5a3a'; x.lineWidth = 3; x.beginPath(); x.moveTo(m, 6); x.lineTo(m, 26); x.stroke();
    x.beginPath(); x.arc(m, m + 8, 36, 0, TAU); x.fillStyle = '#b89a54'; x.fill(); x.beginPath(); x.arc(m, m + 8, 27, 0, TAU); x.fillStyle = col; x.fill(); x.lineWidth = 3; x.strokeStyle = '#f0dca0'; x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.ellipse(m - 9, m - 2, 8, 12, 0.6, 0, TAU); x.fill(); }
  else if (d.cat === 'ash') { glow(m, m, 60, col, 0.7); x.strokeStyle = col; x.lineWidth = 5; for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * 5.2 + k * 2.1, r = 6 + t * 40; const px2 = m + Math.cos(a) * r, py2 = m + Math.sin(a) * r; if (i) x.lineTo(px2, py2); else x.moveTo(px2, py2); } x.globalAlpha = 0.8 - k * 0.2; x.stroke(); } x.globalAlpha = 1; glow(m, m, 16, '#ffffff', 0.9); }
  else if (d.cat === 'spell') { glow(m, m, 60, col, 0.5); x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.arc(m, m, 40, 0, TAU); x.stroke(); x.beginPath(); x.arc(m, m, 30, 0, TAU); x.stroke();
    x.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 * 2 - HALF; x.lineTo(m + Math.cos(a) * 30, m + Math.sin(a) * 30); } x.closePath(); x.stroke(); glow(m, m, 14, '#ffffff', 0.85); }
  else if (d.cat === 'armor') { const tint = { tarnished: '#8a8880', soldier: '#9a3a30', exile: '#5a4038', knight: '#b0a898', banished: '#4a4a52', sentinel: '#d9a63c' }[d.tpl] || '#8a8880'; glow(m, m, 58, tint, 0.3);
    x.fillStyle = tint; x.beginPath(); x.moveTo(m - 30, 60); x.bezierCurveTo(m - 32, 14, m + 32, 14, m + 30, 60); x.lineTo(m + 34, 100); x.lineTo(m + 12, 112); x.lineTo(m, 100); x.lineTo(m - 12, 112); x.lineTo(m - 34, 100); x.closePath(); x.fill(); x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.stroke();
    x.fillStyle = '#0c0c0e'; x.fillRect(m - 22, 56, 44, 6); x.fillRect(m - 3, 62, 6, 34); x.strokeStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.moveTo(m, 20); x.lineTo(m, 56); x.stroke(); }
  else if (d.runes) { glow(m, m, 56, col, 0.8); x.strokeStyle = '#fff4c0'; x.lineWidth = 5; x.beginPath(); x.arc(m, m, 26, 0.4, TAU - 0.4); x.stroke(); x.beginPath(); x.moveTo(m, m - 40); x.lineTo(m, m + 40); x.moveTo(m - 22, m - 6); x.lineTo(m + 22, m - 6); x.stroke(); }
  else if (d.id === 'dagger_throw') { x.save(); x.translate(m, m); x.rotate(0.75); x.fillStyle = '#c4c9d2'; x.beginPath(); x.moveTo(0, -52); x.lineTo(9, 6); x.lineTo(-9, 6); x.closePath(); x.fill(); x.fillStyle = '#5a4630'; x.fillRect(-14, 6, 28, 6); x.fillRect(-5, 12, 10, 34); x.restore(); }
  else if (d.id === 'fire_pot' || d.id === 'crab' || d.id === 'fire_grease') { glow(m, m + 6, 50, col, 0.35); x.fillStyle = col; x.beginPath(); x.ellipse(m, m + 14, 34, 38, 0, 0, TAU); x.fill(); x.fillStyle = '#3a2a1c'; x.fillRect(m - 16, 22, 32, 14); x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 3; x.beginPath(); x.ellipse(m, m + 14, 34, 38, 0, 0, TAU); x.stroke(); if (d.id === 'fire_pot') glow(m, 16, 18, '#ff9a3a', 0.95); x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.ellipse(m - 12, m + 2, 7, 14, 0.4, 0, TAU); x.fill(); }
  else if (d.id === 'stone1') { x.fillStyle = '#7d8290'; x.beginPath(); x.moveTo(26, 78); x.lineTo(44, 34); x.lineTo(84, 26); x.lineTo(104, 62); x.lineTo(86, 100); x.lineTo(44, 104); x.closePath(); x.fill(); x.fillStyle = '#a9aeba'; x.beginPath(); x.moveTo(44, 34); x.lineTo(84, 26); x.lineTo(70, 60); x.closePath(); x.fill(); x.fillStyle = '#5a5e6a'; x.beginPath(); x.moveTo(70, 60); x.lineTo(104, 62); x.lineTo(86, 100); x.closePath(); x.fill(); }
  else if (d.id === 'seed') { glow(m, m, 58, '#ffd060', 0.8); x.fillStyle = '#fff0b0'; x.beginPath(); x.ellipse(m, m, 14, 22, 0.3, 0, TAU); x.fill(); }
  else { glow(m, m, 56, col, 0.6); x.strokeStyle = col; x.lineWidth = 6; x.beginPath(); x.arc(m, m - 14, 20, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(m, m + 6); x.lineTo(m, m + 48); x.moveTo(m, m + 30); x.lineTo(m + 16, m + 30); x.moveTo(m, m + 44); x.lineTo(m + 12, m + 44); x.stroke(); }
  return c.toDataURL('image/png');
};
