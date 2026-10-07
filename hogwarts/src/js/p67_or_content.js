/* ==== p67_or_content.js ==== */
/* OPUS RING — things to find: treasure chests, pickups, Kalé's wares, the smithing table, a golden sapling's seed. */
/* a chest (scanned): glints until opened, then stays shut and dull */
WORLD.chest = function (L, x, z, yaw, give, o) {
  o = o || {}; const id = L.id + ':chest' + (o.id || (x | 0) + '_' + (z | 0)), y = o.y !== undefined ? o.y : WORLD.gy(x, z), done = GAME.save.items && GAME.save.items[id];
  let me = null; if (AST.sets.treasure_chest) { me = AST.mesh('chest', { env: 0.5 }); me.scale.setScalar(1.25); me.position.set(x, y, z); me.rotation.y = yaw || 0; LEVEL.add(me); } else KIT.box(x - 0.5, y, z - 0.3, x + 0.5, y + 0.6, z + 0.3, WORLD.M().wood);
  PHY.obox(x, z, 0.62, 0.36, y, y + 0.8, yaw || 0);
  if (done) return null;
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 1.0, z), col: new THREE.Color(1.0, 0.8, 0.4), i: 1.6, range: 5, prio: 1, on: true });
  const up = (dt, t) => { if (!Lt.on) return; if (RNG() < dt * 5) FX.puff(V3(x + rnd(-0.4, 0.4), y + 0.8, z + rnd(-0.3, 0.3)), 1, { add: true, size: 0.03, grow: 0.2, col: [2.4, 1.8, 0.6], a: 0.9, life: 1.6, spread: 0.1, rise: 0.5 }); }; L.updates.push(up);
  const I = WORLD.interact(L, V3(x, y + 0.9, z), 2.3, IN.keyLabel('grip') + ' OPEN', () => { I.off = true; Lt.on = false; Lt.i = 0; GAME.save.items = GAME.save.items || {}; GAME.save.items[id] = 1; let k = 0; for (const [it, n] of give) MG.after(k++ * 1.1, () => EQ.give(it, n), true); if (o.runes) OR.addRunes(o.runes); GAME.store(); FX.flashLight(V3(x, y + 0.8, z), [1, 0.8, 0.4], 6, 6, 0.5); });
  return I;
};
/* a pickup that grants items (the glow's colour tells what kind) */
WORLD.loot = function (L, x, z, give, o) { o = o || {}; const d = ITEM.DB[give[0][0]] || {}, col = d.cat === 'weapon' || d.cat === 'shield' || d.cat === 'armor' ? [1.8, 1.7, 2.4] : d.cat === 'ash' || d.cat === 'spell' ? [0.8, 1.4, 2.6] : d.cat === 'talisman' ? [2.4, 1.2, 2.2] : [2.2, 1.7, 0.7];
  return WORLD.item(L, x, z, Object.assign({ give, col }, o)); };
/* a golden sapling: a child of the Erdtree, a seed in the grass at its foot */
WORLD.sapling = function (L, x, z, o) {
  o = o || {}; const y = WORLD.gy(x, z), grp = new THREE.Group(), rs = mulberry((x * 7 + z * 13) | 0), bark = new THREE.MeshStandardMaterial({ color: 0xd8c08a, roughness: 0.6, emissive: new THREE.Color(0.9, 0.62, 0.2), emissiveIntensity: 0.55 });
  const TP = [], tips = [], tube = (a, b, r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, a.distanceTo(b), 6, 1, true); g.translate(0, a.distanceTo(b) / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(YUP, b.clone().sub(a).normalize())); g.translate(a.x, a.y, a.z); TP.push(g); };
  const grow = (p, d, len, r, depth) => { const e = p.clone().addScaledVector(d, len); tube(p, e, r, r * 0.65); if (depth >= 4) { tips.push(e); return; } for (let k = 0; k < (depth === 0 ? 3 : 2); k++) { const az = (k + rs()) / (depth === 0 ? 3 : 2) * TAU, sp = 0.5 + rs() * 0.4; grow(e, d.clone().multiplyScalar(Math.cos(sp)).addScaledVector(V3(Math.cos(az), 0.3, Math.sin(az)), Math.sin(sp)).normalize(), len * 0.66, r * 0.6, depth + 1); } tips.push(e); };
  grow(V3(0, -0.2, 0), V3(0.05, 1, 0.02).normalize(), 2.4, 0.16, 0); const tr = new THREE.Mesh(ARM.merge(TP), bark); tr.castShadow = true; grp.add(tr);
  const n = tips.length * 14, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const t = tips[i % tips.length]; pos[i * 3] = t.x + (rs() - 0.5) * 0.9; pos[i * 3 + 1] = t.y + (rs() - 0.4) * 0.8; pos[i * 3 + 2] = t.z + (rs() - 0.5) * 0.9; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ color: new THREE.Color(2.6, 1.9, 0.6), size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, map: WORLD.dotTex() }); grp.add(new THREE.Points(pg, pm));
  grp.position.set(x, y, z); grp.scale.setScalar(o.s || 1); LEVEL.add(grp); PHY.cyl(x, z, 0.3, y - 1, y + 3);
  const Lt = R.addLight({ pos: new THREE.Vector3(x, y + 3.5, z), col: new THREE.Color(1.0, 0.75, 0.3), i: 6, range: 14, prio: 1, on: true });
  L.updates.push((dt, t) => { pm.opacity = 0.75 + 0.2 * Math.sin(t * 1.3 + x); Lt.i = (6 + Math.sin(t * 1.7) * 0.6) * (L.lightK || 1); const c = R.camera.position; if (Math.hypot(c.x - x, c.z - z) < 50 && RNG() < dt * 4) FX.puff(V3(x + rnd(-2, 2), y + 2 + RNG() * 3, z + rnd(-2, 2)), 1, { add: true, size: 0.03, grow: 0.1, col: [2.4, 1.8, 0.6], a: 0.9, life: 4, spread: 0.2, rise: -0.25, drag: 0.2 }); });
  if (o.seed !== false) WORLD.loot(L, x + 0.9, z + 0.7, [['seed', 1]], { id: 'sap' + (x | 0) });
};
WORLD.dotTex = function () { if (WORLD._dot) return WORLD._dot; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); WORLD._dot = new THREE.CanvasTexture(c); return WORLD._dot; };
OR.KALE = [['dagger_throw', 60], ['fire_pot', 120, 8], ['crab', 100, 6], ['fire_grease', 150, 5], ['stone1', 200, 6], ['short_spear', 600], ['shield_kite', 900], ['set_soldier', 800], ['sp_flame', 900], ['tal_turtle', 1500], ['tal_sacrificial', 1000]];
(function () {
  const wrap = (id, fn) => { const def = LEVEL.defs[id], b0 = def.build; def.build = async function (L) { await b0(L); fn(L); }; };
  wrap('limgrave', (L) => {
    const gy = WORLD.gy, K = L.kalePos;
    // the Church of Elleh: Kalé's pack, the smithing table
    if (K) { const px = K[0] - 1.3, pz = K[1] + 0.3; if (AST.sets.wooden_crate_01) { const c = AST.mesh('crate', { env: 0.3 }); c.position.set(px, gy(px, pz), pz); c.rotation.y = 0.5; c.scale.setScalar(1.1); LEVEL.add(c); }
      WORLD.interact(L, V3(px, gy(px, pz) + 0.8, pz), 1.9, IN.keyLabel('grip') + ' BROWSE KALÉ\'S WARES', () => UI.openSub('shop', null, { title: 'MERCHANT KALÉ', key: 'kale', wares: OR.KALE }));
      WORLD.interact(L, V3(-46 + 5.3, gy(-46 + 5.3, -150 + 2.6) + 1.0, -150 + 2.6), 1.8, IN.keyLabel('grip') + ' USE THE SMITHING TABLE', () => UI.openSub('smith', null, {})); }
    WORLD.loot(L, -52, -158, [['sp_heal', 1]], { id: 'heal' }); WORLD.loot(L, -40, -145, [['stone1', 2]], { id: 'st0' });
    // the First Step and the road down
    WORLD.loot(L, 9, -292, [['dagger_throw', 5]], { id: 'd0' }); WORLD.loot(L, -8, -278, [['crab', 2]], { id: 'c0' }); WORLD.loot(L, 21, -243, [['rune1', 2]], { id: 'r0' });
    // Gatefront: the soldiers' stores
    WORLD.chest(L, 33, 74, 0.6, [['lordsworn_gs', 1]], { id: 'gf1' }); WORLD.chest(L, 16, 58, -0.8, [['ash_lion', 1], ['stone1', 2]], { id: 'gf2' }); WORLD.loot(L, 40, 60, [['fire_pot', 3]], { id: 'gfp' }); WORLD.loot(L, 22, 86, [['shield_heater', 1]], { id: 'gfs' });
    // the lake ruins and the lake shore
    WORLD.chest(L, 180, -118, 2.2, [['tal_crimson', 1], ['rune3', 1]], { id: 'lk1' }); WORLD.loot(L, 168, -104, [['sp_pebble', 1]], { id: 'lkp' }); WORLD.loot(L, 104, -52, [['club', 1]], { id: 'lkc' }); WORLD.loot(L, 238, -18, [['stone1', 2]], { id: 'lks' });
    // off the road: rewards for wandering
    WORLD.loot(L, -100, -70, [['ash_flame', 1]], { id: 'w1' }); WORLD.loot(L, 96, 22, [['mace', 1]], { id: 'w2' }); WORLD.loot(L, -76, 30, [['tal_axe', 1]], { id: 'w3' }); WORLD.loot(L, 118, 66, [['ash_resolve', 1]], { id: 'w4' }); WORLD.loot(L, -128, 100, [['warhammer', 1]], { id: 'w5' });
    WORLD.loot(L, 70, 136, [['rune3', 1]], { id: 'w6' }); WORLD.loot(L, 60, -250, [['tal_cerulean', 1]], { id: 'w7' }); WORLD.loot(L, -38, -244, [['fire_grease', 2]], { id: 'w8' }); WORLD.loot(L, 150, -40, [['halberd', 1]], { id: 'w9' });
    // Stormhill
    WORLD.chest(L, -44, 310, 1.2, [['tal_viridian', 1], ['stone1', 3]], { id: 'sh1' }); WORLD.loot(L, 84, 352, [['ash_hound', 1]], { id: 'sh2' }); WORLD.loot(L, -90, 306, [['uchigatana', 1]], { id: 'sh3' }); WORLD.loot(L, 46, 300, [['ash_sacred', 1]], { id: 'sh4' }); WORLD.loot(L, -44, 420, [['rune7', 1]], { id: 'sh5' });
    // golden saplings
    WORLD.sapling(L, 58, 20, { s: 1.3 }); WORLD.sapling(L, -20, 262, { s: 1.5 });
  });
  wrap('cave', (L) => { WORLD.loot(L, -10, 30, [['stone1', 2]], { id: 'cv1' }); WORLD.loot(L, 8, 84, [['tal_scarab', 1]], { id: 'cv2' }); });
  wrap('margit', (L) => { WORLD.loot(L, -8, 60, [['rune3', 1]], { id: 'mg1', y: MRG.floor(60) }); WORLD.loot(L, 9, 110, [['fire_pot', 3]], { id: 'mg2', y: MRG.floor(110) }); });
  wrap('stormveil', (L) => { const F = STV.floor;
    WORLD.chest(L, -33, 50, HALF, [['set_exile', 1], ['stone1', 3]], { id: 'sv1', y: F(-33, 50) }); WORLD.chest(L, 33, 120, -HALF, [['shield_great', 1]], { id: 'sv2', y: F(33, 120) }); WORLD.chest(L, -33, 160, HALF, [['set_knight', 1], ['tal_dragoncrest', 1]], { id: 'sv3', y: F(-33, 160) });
    WORLD.chest(L, 32, 228, -HALF, [['set_banished', 1], ['tal_favor', 1]], { id: 'sv4', y: F(32, 228) }); WORLD.loot(L, -20, 96, [['sp_lightning', 1]], { id: 'sv5', y: F(-20, 96) }); WORLD.loot(L, 20, 30, [['sp_reject', 1]], { id: 'sv6', y: F(20, 30) }); WORLD.loot(L, -30, 240, [['rune7', 1]], { id: 'sv7', y: F(-30, 240) }); });
})();
