// ===== 20-build: the village — a building kit and every house, shop and prop in Moonwick =====
{
  const G = AF.G = AF.G || {}; G.places = {}; G.spots = {}; G.props = [];
  const c = (hex, mat, o = {}) => AF.col(hex, Object.assign({ mat }, o));
  const K = AF.K;
  Object.assign(K, {
    rPlum: c(0x6b4a7a, 'tile', { jitter: 0.8, edge: 0.6 }), rTeal: c(0x3f8086, 'tile', { jitter: 0.8, edge: 0.6 }), rRust: c(0xb5613a, 'tile', { jitter: 0.8, edge: 0.6 }), rBlue: c(0x4a5f96, 'tile', { jitter: 0.8, edge: 0.6 }), rMoss: c(0x74884a, 'thatch', { jitter: 0.95, edge: 0.35 }),
    rRed: c(0xa8423a, 'tile', { jitter: 0.8, edge: 0.6 }), rStar: c(0x39386e, 'tile', { jitter: 0.7, edge: 0.6 }),
    wCream: c(0xefe2c2, 'plaster', { jitter: 0.3, edge: 0.2 }), wPink: c(0xe8c0b0, 'plaster', { jitter: 0.3, edge: 0.2 }), wMint: c(0xcfe0c4, 'plaster', { jitter: 0.3, edge: 0.2 }), wSky: c(0xc6d8e6, 'plaster', { jitter: 0.3, edge: 0.2 }), wButter: c(0xf0d98e, 'plaster', { jitter: 0.3, edge: 0.2 }), wLilac: c(0xd6c8e6, 'plaster', { jitter: 0.3, edge: 0.2 }),
    dRed: c(0xb03a3a, 'wood', { jitter: 0.3 }), dBlue: c(0x3a62a8, 'wood', { jitter: 0.3 }), dGreen: c(0x3f8a4f, 'wood', { jitter: 0.3 }), dYellow: c(0xe0b23a, 'wood', { jitter: 0.3 }), dPurple: c(0x7a4a9a, 'wood', { jitter: 0.3 }),
    barnRed: c(0x9a3a2e, 'wood', { jitter: 0.6 }), whiteWood: c(0xeee8da, 'wood', { jitter: 0.3 }),
    book1: c(0x8a2f3a, 'cloth', { jitter: 0.5 }), book2: c(0x2f5a8a, 'cloth', { jitter: 0.5 }), book3: c(0x3a7a4a, 'cloth', { jitter: 0.5 }), book4: c(0xb08a3a, 'cloth', { jitter: 0.5 }), book5: c(0x6a3a7a, 'cloth', { jitter: 0.5 }),
    quilt1: c(0xc05a6a, 'cloth', { jitter: 0.5 }), quilt2: c(0x5a8ac0, 'cloth', { jitter: 0.5 }), quilt3: c(0x8ac05a, 'cloth', { jitter: 0.5 }), pillow: c(0xf4efe4, 'cloth', { jitter: 0.2 }),
    bread: c(0xd9a55a, 'thatch', { jitter: 0.5 }), pie: c(0xc97a3a, 'thatch', { jitter: 0.4 }), pumpkin: c(0xe8822a, 'leaf', { jitter: 0.4 }), cabbage: c(0x8fc060, 'leaf', { jitter: 0.6 }), apple: c(0xd03a3a, 'leaf', { jitter: 0.3 }),
    potion1: c(0x7ae0c0, 'glass', { emit: 0x4affc0, emitK: 1.6, mode: 'always', jitter: 0 }), potion2: c(0xd07ae0, 'glass', { emit: 0xc04aff, emitK: 1.6, mode: 'always', jitter: 0 }), potion3: c(0xe0c07a, 'glass', { emit: 0xffc04a, emitK: 1.4, mode: 'always', jitter: 0 }),
    rune: c(0x7a8a9a, 'stone', { emit: 0x5ad0ff, emitK: 2.2, mode: 'night', jitter: 0.3 }), bell: c(0xd8a83a, 'metal', { jitter: 0.2, edge: 0.4 }),
    lampGlass: c(0xfff1c9, 'glass', { emit: 0xffc870, emitK: 3.2, mode: 'night', jitter: 0, edge: 0 }),
    waterV: c(0x6fc0e0, 'earth', { jitter: 0.3, edge: 0, solid: false, emit: 0x2a5a70, emitK: 0.5, mode: 'always' }),
    flowerR: c(0xe85a6a, 'leaf', { jitter: 0.3, edge: 0.1, solid: false }), flowerY: c(0xf2d24a, 'leaf', { jitter: 0.3, edge: 0.1, solid: false }), flowerB: c(0x7a9af2, 'leaf', { jitter: 0.3, edge: 0.1, solid: false }), flowerW: c(0xf6f2ee, 'leaf', { jitter: 0.3, edge: 0.1, solid: false }), flowerP: c(0xc87ae8, 'leaf', { jitter: 0.3, edge: 0.1, solid: false }),
    stem: c(0x4f9a3a, 'leaf', { jitter: 0.5, edge: 0.1, solid: false }), rug1: c(0x9a3a4a, 'cloth', { jitter: 0.4 }), rug2: c(0x3a5a8a, 'cloth', { jitter: 0.4 }),
  });
  const W = AF.W, P = AF.PLAN;
  const mn = Math.min, mx = Math.max;
  // local frame: front wall is local z = 0 and faces outward along -z(local). rot: 0 north, 1 east, 2 south, 3 west.
  const frame = (ox, oz, w, d, rot) => {
    const pt = (lx, lz) => rot === 0 ? [ox + lx, oz + lz] : rot === 1 ? [ox + d - lz, oz + lx] : rot === 2 ? [ox + w - lx, oz + d - lz] : [ox + lz, oz + w - lx];
    const f = (x0, y0, z0, x1, y1, z1, col) => { const a = pt(x0, z0), b = pt(x1, z1); W.fill(mn(a[0], b[0]), y0, mn(a[1], b[1]), mx(a[0], b[0]), y1, mx(a[1], b[1]), col); };
    const out = [[0, -1], [1, 0], [0, 1], [-1, 0]][rot];
    return { pt, f, out, rot, w, d, yawOut: Math.atan2(out[0], out[1]), yawIn: Math.atan2(-out[0], -out[1]) };
  };
  G.frame = frame;
  const spot = (name, x, y, z, o = {}) => { const s = Object.assign({ name, x, y, z, yaw: 0 }, o); (G.spots[name] = G.spots[name] || []).push(s); return s; };
  G.addSpot = spot;
  const lamp = (x, y, z, o = {}) => { W.fill(x - 0.125, y, z - 0.125, x + 0.125, y + 0.25, z + 0.125, K.lampGlass); AF.addLight(Object.assign({ x, y: y + 0.12, z, kind: 'street' }, o)); };
  G.lamp = lamp;
  const lampPost = (x, z) => { const y = W.groundY(x, z); W.fill(x - 0.125, y, z - 0.125, x + 0.125, y + 2.5, z + 0.125, K.iron); W.fill(x - 0.25, y + 2.5, z - 0.25, x + 0.25, y + 2.75, z + 0.25, K.iron); lamp(x, y + 2.75, z, { post: true }); W.fill(x - 0.25, y + 3, z - 0.25, x + 0.25, y + 3.25, z + 0.25, K.iron); };

  // ---------------------------------------------------------------- the house kit
  const house = (o) => {
    const { w, d, rot } = o, st = o.st || 1, y0 = o.y ?? 1, wall = o.wall || K.wCream, roof = o.roof || K.thatch, beam = o.beam || K.oak, door = o.door || K.dRed;
    const fw = rot & 1 ? d : w, fd = rot & 1 ? w : d, ox = o.x, oz = o.z;
    W.ground(ox - 0.75, oz - 0.75, ox + fw + 0.75, oz + fd + 0.75, Math.round(y0 * 4));
    const F = frame(ox, oz, w, d, rot), f = F.f, H = st * 3, top = y0 + 0.25 + H, dx = o.dx ?? w / 2;
    f(0, y0, 0, w, y0 + 0.75, d, o.base || K.wallDark); f(0.25, y0 + 0.25, 0.25, w - 0.25, y0 + 0.75, d - 0.25, 0); f(0.25, y0, 0.25, w - 0.25, y0 + 0.25, d - 0.25, o.floor || K.plank);
    // shell
    f(0, y0 + 0.75, 0, w, top, 0.25, wall); f(0, y0 + 0.75, d - 0.25, w, top, d, wall); f(0, y0 + 0.75, 0, 0.25, top, d, wall); f(w - 0.25, y0 + 0.75, 0, w, top, d, wall);
    // timber frame
    for (let s = 1; s <= st; s++) { const y = y0 + s * 3; f(0, y, 0, w, y + 0.25, 0.25, beam); f(0, y, d - 0.25, w, y + 0.25, d, beam); f(0, y, 0, 0.25, y + 0.25, d, beam); f(w - 0.25, y, 0, w, y + 0.25, d, beam); if (s < st) { f(0.25, y, 0.25, w - 0.25, y + 0.25, d - 0.25, K.plank); } }
    const nx = mx(1, Math.round(w / 2.25)), nz = mx(1, Math.round(d / 2.25));
    for (let i = 0; i <= nx; i++) { const x = mn(w - 0.25, i * (w - 0.25) / nx); const xs = Math.round(x * 4) / 4; f(xs, y0 + 0.75, 0, xs + 0.25, top, 0.25, beam); f(xs, y0 + 0.75, d - 0.25, xs + 0.25, top, d, beam); }
    for (let i = 0; i <= nz; i++) { const z = Math.round(mn(d - 0.25, i * (d - 0.25) / nz) * 4) / 4; f(0, y0 + 0.75, z, 0.25, top, z + 0.25, beam); f(w - 0.25, y0 + 0.75, z, w, top, z + 0.25, beam); }
    // windows (night-lit)
    const win = o.win || K.windowWarm;
    for (let s = 0; s < st; s++) {
      const y = y0 + 1.5 + s * 3;
      for (let i = 0; i < nx; i++) { const x = Math.round(((i + 0.5) * (w - 0.25) / nx - 0.25) * 4) / 4; if (!(s === 0 && Math.abs(x + 0.375 - dx) < 1.3)) { f(x, y, 0, x + 0.75, y + 1, 0.25, win); f(x - 0.25, y - 0.25, -0.25, x + 1, y, 0, beam); } f(x, y, d - 0.25, x + 0.75, y + 1, d, win); }
      for (let i = 0; i < nz; i++) { const z = Math.round(((i + 0.5) * (d - 0.25) / nz - 0.25) * 4) / 4; if (!(o.chim !== false && i === nz - 1)) f(w - 0.25, y, z, w, y + 1, z + 0.75, win); f(0, y, z, 0.25, y + 1, z + 0.75, win); }
    }
    // door
    if (o.open) { f(o.open[0], y0 + 0.25, 0, o.open[1], y0 + 2.75, 0.25, 0); f(o.open[0] - 0.25, y0 + 0.25, 0, o.open[0], y0 + 3, 0.25, beam); f(o.open[1], y0 + 0.25, 0, o.open[1] + 0.25, y0 + 3, 0.25, beam); }
    else {
      f(dx - 0.75, y0 + 0.25, 0, dx + 0.75, y0 + 2.5, 0.25, door); f(dx - 0.5, y0 + 0.25, 0, dx + 0.5, y0 + 2.25, 0.25, 0);
      f(dx + 0.5, y0 + 0.25, 0.25, dx + 0.75, y0 + 2.25, 1.25, door);                       // the door leaf, standing open
      f(dx - 0.75, y0, -0.5, dx + 0.75, y0 + 0.25, 0, K.flag);
    }
    { const p = F.pt(dx - 1, -0.125); lamp(p[0], y0 + 2.25, p[1], { kind: 'porch' }); }
    // roof (ridge along local x), slope = rise per quarter-metre step
    const sl = o.slope || 1, ov = 0.5; let k = 0, y = top;
    for (; ; k++) {
      const za = -ov + k * 0.25, zb = d + ov - k * 0.25; if (zb - za < 0.5) break;
      for (let j = 0; j < sl; j++) { f(-ov, y, za, w + ov, y + 0.25, za + 0.5, roof); f(-ov, y, zb - 0.5, w + ov, y + 0.25, zb, roof); if (zb - za > 1) { f(0, y, za + 0.5, 0.25, y + 0.25, zb - 0.5, wall); f(w - 0.25, y, za + 0.5, w, y + 0.25, zb - 0.5, wall); } y += 0.25; }
      if (k % 5 === 4 && zb - za > 2) { f(0.25, y - 0.25, za + 0.5, w - 0.25, y, za + 0.75, beam); f(0.25, y - 0.25, zb - 0.75, w - 0.25, y, zb - 0.5, beam); }
    }
    f(-ov, y, d / 2 - 0.25, w + ov, y + 0.25, d / 2 + 0.25, o.ridge || beam);
    const peak = y + 0.25;
    if (o.chim !== false) {
      const cz = d - 1.75; f(w - 1, y0 + 0.25, cz, w - 0.25, peak + 0.75, cz + 1, K.brick); f(w - 1.25, peak + 0.75, cz - 0.25, w, peak + 1, cz + 1.25, K.brickDark);
      f(w - 1.25, y0 + 0.25, cz - 0.25, w - 1, y0 + 1.5, cz + 1.25, K.wallDark); f(w - 1.25, y0 + 0.25, cz, w - 1, y0 + 1.25, cz + 1, 0); f(w - 1, y0 + 0.25, cz + 0.25, w - 0.75, y0 + 0.75, cz + 0.75, K.ember);
      const p = F.pt(w - 0.6, cz + 0.5); AF.addChimney(p[0], peak + 1, p[1]); AF.addLight({ x: F.pt(w - 1.4, cz + 0.5)[0], y: y0 + 0.8, z: F.pt(w - 1.4, cz + 0.5)[1], kind: 'hearth', color: 0xff8a3a });
    }
    if (st > 1) {       // stairs along the back wall
      for (let i = 0; i < 12; i++) f(1 + i * 0.25, y0 + 0.25, d - 1.25, 1.25 + i * 0.25, y0 + 0.5 + i * 0.25, d - 0.25, K.plankLight);
      f(1, y0 + 3, d - 1.25, 4.5, y0 + 3.25, d - 0.25, 0);
    }
    const a = F.pt(0, 0), b = F.pt(w, d), dp = F.pt(dx, -1.6), ip = F.pt(dx, 1.6);
    const B = AF.addBuilding({ id: o.id, name: o.name, kind: o.kind || 'house', box: [mn(a[0], b[0]) - 0.5, y0, mn(a[1], b[1]) - 0.5, mx(a[0], b[0]) + 0.5, peak + 1, mx(a[1], b[1]) + 0.5], doors: [{ x: dp[0], y: y0, z: dp[1], yaw: F.yawIn }] });
    const pl = G.places[o.id] = { id: o.id, name: o.name, door: dp, inside: ip, y: y0 + 0.25, F, B, top, peak };
    const h = { F, f, pt: F.pt, y: y0 + 0.25, y2: y0 + 3.25, top, peak, w, d, pl,
      spot(name, lx, lz, oo = {}) { const p = F.pt(lx, lz); return spot(name, p[0], oo.y ?? (oo.up ? y0 + 3.25 : y0 + 0.25), p[1], Object.assign({ place: o.id, yaw: F.yawIn }, oo)); },
      light(lx, ly, lz, oo = {}) { const p = F.pt(lx, lz); lamp(p[0], ly, p[1], Object.assign({ kind: 'interior' }, oo)); } };
    if (o.sign) { try { const m = AF.textModel(o.sign, o.signFg || K.gold, { bg: o.signBg || K.oakDark, pad: 1, depth: 1 }), g = AF.meshModel(m, { vs: 0.0625, anchor: [0.5, 0, 0.5] }); const sp = F.pt(o.signX ?? w / 2, -0.3); AF.placeStatic(g, sp[0], y0 + 2.6, sp[1], (rot + (o.signFlip ?? 2)) % 4, { collide: false }); } catch (e) { console.warn(e); } }
    return h;
  };
  G.house = house;
  // ---------------------------------------------------------------- furniture (local coords of a house `h`)
  const FN = {
    bed(h, x, z, q = K.quilt1, up) { const y = up ? h.y2 : h.y; h.f(x, y, z, x + 1, y + 0.5, z + 2, K.plankLight); h.f(x, y + 0.5, z, x + 1, y + 0.75, z + 2, q); h.f(x, y + 0.5, z + 1.5, x + 1, y + 0.75, z + 2, K.pillow); h.f(x, y, z + 2, x + 1, y + 1.25, z + 2.25, K.oak); h.spot('bed:' + h.pl.id, x + 0.5, z + 0.9, { y: y + 0.75, kind: 'bed', up, yaw: h.F.yawOut }); },
    table(h, x, z, w = 1.5, d = 1, up) { const y = up ? h.y2 : h.y; h.f(x, y + 0.75, z, x + w, y + 1, z + d, K.plank); for (const [a, b] of [[x, z], [x + w - 0.25, z], [x, z + d - 0.25], [x + w - 0.25, z + d - 0.25]]) h.f(a, y, b, a + 0.25, y + 0.75, b + 0.25, K.oak); },
    chair(h, x, z, up) { const y = up ? h.y2 : h.y; h.f(x, y, z, x + 0.5, y + 0.5, z + 0.5, K.plankLight); h.spot('sit:' + h.pl.id, x + 0.25, z + 0.25, { y: y + 0.5, kind: 'sit', up }); },
    shelf(h, x, z, w, alongX = true, books = true, up) { const y = up ? h.y2 : h.y, cs = [K.book1, K.book2, K.book3, K.book4, K.book5]; for (let s = 0; s < 4; s++) { const yy = y + s * 0.5; if (alongX) { h.f(x, yy, z, x + w, yy + 0.25, z + 0.5, K.oak); if (books) for (let i = 0; i < w * 4; i++) if (AF.hash3(i, s, x * 7 + z) > 0.15) h.f(x + i * 0.25, yy + 0.25, z, x + i * 0.25 + 0.25, yy + 0.5, z + 0.25, cs[(AF.hash3(i, s, 3) * 5) | 0]); } else { h.f(x, yy, z, x + 0.5, yy + 0.25, z + w, K.oak); if (books) for (let i = 0; i < w * 4; i++) if (AF.hash3(i, s, x * 7 + z) > 0.15) h.f(x, yy + 0.25, z + i * 0.25, x + 0.25, yy + 0.5, z + i * 0.25 + 0.25, cs[(AF.hash3(i, s, 5) * 5) | 0]); } } },
    counter(h, x, z, w, d = 0.75) { h.f(x, h.y, z, x + w, h.y + 1, z + d, K.plank); h.f(x, h.y + 1, z, x + w, h.y + 1.25, z + d, K.plankLight); },
    barrel(h, x, z, y) { y = y ?? h.y; h.f(x, y, z, x + 0.75, y + 1, z + 0.75, K.plank); h.f(x, y + 0.25, z, x + 0.75, y + 0.5, z + 0.75, K.iron); h.f(x, y + 0.75, z, x + 0.75, y + 1, z + 0.75, K.oak); },
    crate(h, x, z, top) { h.f(x, h.y, z, x + 0.75, h.y + 0.75, z + 0.75, K.pine); if (top) h.f(x, h.y + 0.75, z, x + 0.75, h.y + 1, z + 0.75, top); },
    rug(h, x, z, w, d, col = K.rug1, up) { const y = up ? h.y2 : h.y; h.f(x, y - 0.25, z, x + w, y, z + d, col); },
    homey(h, q) { FN.rug(h, 2, 2, h.w - 4, h.d - 4.25, q === K.quilt2 ? K.rug2 : K.rug1); FN.table(h, 1, 1.25); FN.chair(h, 1.5, 2.5); FN.chair(h, 0.5, 0.5); FN.shelf(h, 0.25, h.d - 3.5, 2, false, true); if (h.top - h.y > 4) { FN.bed(h, h.w - 1.5, 0.5, q, true); FN.bed(h, h.w - 3, 0.5, K.quilt3, true); FN.rug(h, 5, 2.5, 2, 1.5, K.rug2, true); FN.shelf(h, 0.25, 0.5, 2, false, true, true); } else FN.bed(h, 0.5, h.d - 5.75 > 3 ? 3.5 : 3, q); h.spot('home:' + h.pl.id, h.w / 2, h.d / 2, { kind: 'stand' }); },
  };
  G.FN = FN;

  AF.onBuild('village', 300, () => {
    const R = AF.rng(11);
    // ---- the Drowsy Dragon inn
    { const h = house({ id: 'inn', name: 'The Drowsy Dragon', kind: 'inn', x: -27, z: -6, w: 15, d: 11, rot: 2, st: 2, wall: K.wButter, roof: K.rPlum, door: K.dGreen, sign: 'DROWSY DRAGON', dx: 5 });
      FN.counter(h, 9.5, 2, 4.5); for (let i = 0; i < 4; i++) { FN.barrel(h, 9.75 + i * 1.1, 0.4); h.f(10 + i * 1.1, h.y + 1.25, 2.25, 10.25 + i * 1.1, h.y + 1.5, 2.5, [K.potion3, K.glass, K.potion3, K.glass][i]); }
      h.spot('work:inn', 11.5, 1.4, { kind: 'counter', yaw: h.F.yawIn + Math.PI }); h.spot('bar', 10, 3.4, { kind: 'stand', yaw: h.F.yawOut }); h.spot('bar', 12, 3.4, { kind: 'stand', yaw: h.F.yawOut });
      for (const [x, z] of [[1.5, 2], [5, 5.5], [1.5, 6.5]]) { FN.table(h, x, z, 1.5, 1.25); FN.chair(h, x - 0.75, z + 0.4); FN.chair(h, x + 1.75, z + 0.4); h.f(x + 0.5, h.y + 1, z + 0.5, x + 0.75, h.y + 1.25, z + 0.75, K.candle); }
      h.f(8, h.y, 7.5, 12, h.y + 0.25, 9.5, K.plankLight); h.spot('stage', 10, 8.5, { kind: 'stand', y: h.y + 0.25, yaw: h.F.yawOut }); FN.rug(h, 3, 3.5, 5, 1.5, K.rug1);
      h.light(4, h.y + 2.5, 5, {}); h.light(10, h.y + 2.5, 5, {});
      for (let i = 0; i < 3; i++) { FN.bed(h, 6 + i * 3, 0.5, [K.quilt1, K.quilt2, K.quilt3][i], true); }
      FN.shelf(h, 0.25, 4, 3, false, true, true); FN.rug(h, 6, 4, 6, 2, K.rug2, true);
    }
    // ---- bakery
    { const h = house({ id: 'bakery', name: 'Oatley\'s Bakery', kind: 'shop', x: 14, z: -3, w: 9, d: 8, rot: 2, st: 2, wall: K.wPink, roof: K.rRust, door: K.dYellow, sign: 'BAKERY' });
      FN.counter(h, 1, 3, 4.5); for (let i = 0; i < 4; i++) h.f(1.25 + i, h.y + 1.25, 3.25, 1.75 + i, h.y + 1.5, 3.5, i === 2 ? K.pie : K.bread);
      h.f(0.25, h.y, 5.5, 2.25, h.y + 2, 7.5, K.brick); h.f(0.75, h.y + 0.5, 5.5, 1.75, h.y + 1.25, 5.75, 0); h.f(0.75, h.y + 0.5, 5.75, 1.75, h.y + 0.75, 6.5, K.ember);
      FN.table(h, 4, 5.5, 2, 1); h.f(4.25, h.y + 1, 5.75, 5, h.y + 1.25, 6.25, K.daub); FN.barrel(h, 6.5, 6.5); FN.crate(h, 5.6, 6.6, K.bread);
      h.spot('work:bakery', 3, 4.3, { kind: 'counter', yaw: h.F.yawOut }); h.spot('oven', 1.25, 4.9, { kind: 'work', yaw: h.F.yawIn }); h.spot('knead', 4.6, 4.9, { kind: 'work', yaw: h.F.yawIn });
      { const p = h.pt(6.6, -0.4); W.fill(p[0] - 0.5, h.y + 1.25, p[1] - 0.25, p[0] + 0.5, h.y + 1.5, p[1] + 0.25, K.plank); G.pie = { x: p[0], y: h.y + 1.5, z: p[1] }; }
      FN.bed(h, 6.5, 0.5, K.quilt1, true); FN.bed(h, 4.5, 0.5, K.quilt3, true); FN.rug(h, 4, 3.5, 3, 2, K.rug1, true); h.light(4.5, h.y + 2.5, 4, {});
    }
    // ---- apothecary (Granny Marrow)
    { const h = house({ id: 'apoth', name: 'Marrow\'s Remedies', kind: 'shop', x: 27, z: -3, w: 8, d: 8, rot: 2, st: 1, slope: 2, wall: K.wMint, roof: K.rTeal, door: K.dPurple, sign: 'REMEDIES', win: K.stainedGreen });
      FN.counter(h, 3.5, 3.5, 3.5); FN.shelf(h, 0.25, 3, 4, false, false);
      for (let i = 0; i < 8; i++) { h.f(0.25, h.y + 0.75 + (i % 3) * 0.5, 3.1 + i * 0.45, 0.5, h.y + 1 + (i % 3) * 0.5, 3.35 + i * 0.45, [K.potion1, K.potion2, K.potion3][i % 3]); }
      h.f(5, h.y, 5.5, 6.25, h.y + 0.75, 6.75, K.iron); h.f(5.25, h.y + 0.75, 5.75, 6, h.y + 1, 6.5, K.potion1); AF.addLight({ x: h.pt(5.6, 6.1)[0], y: h.y + 1.2, z: h.pt(5.6, 6.1)[1], kind: 'magic', color: 0x4affc0 });
      h.f(4, h.y + 1.25, 3.75, 4.25, h.y + 1.5, 4, K.potion2); FN.chair(h, 1.5, 1); FN.rug(h, 2, 1.5, 3, 1.5, K.rug2); FN.bed(h, 0.5, 5.5 - 0.25, K.quilt3);
      h.spot('work:apoth', 5, 4.9, { kind: 'counter', yaw: h.F.yawOut }); h.spot('cauldron', 4.4, 6.1, { kind: 'work', yaw: h.F.yawIn - Math.PI / 2 }); h.light(4, h.y + 2.4, 2.5, { color: 0x9affc0 });
    }
    // ---- tailor & hatter
    { const h = house({ id: 'tailor', name: 'Wren & Thimble', kind: 'shop', x: -39, z: -2, w: 8, d: 7, rot: 2, st: 2, wall: K.wLilac, roof: K.rBlue, door: K.dRed, sign: 'HATS' });
      FN.counter(h, 1, 3, 3); for (let i = 0; i < 3; i++) { h.f(4.75 + i, h.y, 5.5, 5 + i, h.y + 1.25, 5.75, K.oak); h.f(4.5 + i, h.y + 1.25, 5.25, 5.25 + i, h.y + 1.5, 6, [K.crimson, K.royalBlue, K.gold][i]); h.f(4.6 + i, h.y + 1.5, 5.4, 5.1 + i, h.y + 1.9, 5.9, [K.crimson, K.royalBlue, K.gold][i]); }
      FN.table(h, 4.5, 2.5, 2, 1); h.f(4.75, h.y + 1, 2.75, 5.75, h.y + 1.25, 3.25, K.seaGreen); h.spot('work:tailor', 2.5, 4.3, { kind: 'counter', yaw: h.F.yawOut }); h.spot('loom', 5.5, 4, { kind: 'work' });
      FN.bed(h, 5.5, 0.5, K.quilt2, true); FN.shelf(h, 0.25, 0.5, 2.5, false, true, true); h.light(4, h.y + 2.5, 3.5, {});
    }
    // ---- general store
    { const h = house({ id: 'store', name: 'Tumble\'s Sundries', kind: 'shop', x: 13, z: 15, w: 9, d: 8, rot: 0, st: 2, wall: K.wSky, roof: K.slate, door: K.dBlue, sign: 'SUNDRIES' });
      FN.counter(h, 4.5, 3.5, 3.5); FN.shelf(h, 0.25, 3, 4, false, false); for (let i = 0; i < 7; i++) h.f(0.25, h.y + 0.75 + (i % 2) * 0.5, 3.1 + i * 0.5, 0.5, h.y + 1 + (i % 2) * 0.5, 3.4 + i * 0.5, [K.apple, K.cabbage, K.bread, K.potion3][i % 4]);
      FN.barrel(h, 1.5, 1); FN.crate(h, 2.5, 6.5, K.apple); FN.crate(h, 3.5, 6.5, K.cabbage); FN.crate(h, 1, 6.5, K.pumpkin);
      h.spot('work:store', 6, 4.9, { kind: 'counter', yaw: h.F.yawOut }); h.light(4.5, h.y + 2.5, 3.5, {});
      FN.bed(h, 7, 0.5, K.quilt2, true); FN.bed(h, 5.5, 0.5, K.quilt1, true); FN.bed(h, 5.5, 3.5, K.quilt3, true); FN.bed(h, 7, 3.5, K.quilt3, true);
    }
    // ---- bookshop & post
    { const h = house({ id: 'books', name: 'Quill\'s Books & Post', kind: 'shop', x: 26, z: 15, w: 8, d: 7, rot: 0, st: 2, wall: K.wCream, roof: K.rRed, door: K.dGreen, sign: 'BOOKS' });
      FN.shelf(h, 0.25, 2, 4, false); FN.shelf(h, 2.5, 6.25, 3, true); FN.shelf(h, 3, 3.5, 2.5, true); FN.counter(h, 5, 2, 2.25); FN.chair(h, 5.5, 4.5);
      h.f(5.25, h.y + 1.25, 2.25, 5.75, h.y + 1.5, 2.5, K.lime); h.spot('work:books', 6, 3.2, { kind: 'counter', yaw: h.F.yawOut }); h.spot('read', 2.2, 2.8, { kind: 'browse', yaw: h.F.yawIn + Math.PI / 2 }); h.light(4, h.y + 2.5, 3.5, {});
      FN.bed(h, 6, 0.5, K.quilt2, true); FN.shelf(h, 0.25, 0.5, 3, false, true, true); FN.table(h, 3, 3, 1.5, 1, true);
    }
    // ---- smithy (open front)
    { const h = house({ id: 'smithy', name: 'Thorn\'s Forge', kind: 'shop', x: -24, z: 15, w: 10, d: 8, rot: 0, st: 1, wall: K.wall, beam: K.oakDark, roof: K.slateDark, open: [1, 6], sign: 'FORGE', signX: 8 });
      h.f(7, h.y, 4.5, 9.5, h.y + 1, 7.5, K.brickDark); h.f(7.5, h.y + 1, 5, 9, h.y + 1.25, 7, K.ember); AF.addLight({ x: h.pt(8.2, 6)[0], y: h.y + 1.6, z: h.pt(8.2, 6)[1], kind: 'hearth', color: 0xff7a2a });
      h.f(4, h.y, 3.5, 4.75, h.y + 0.5, 4, K.oak); h.f(3.75, h.y + 0.5, 3.25, 5, h.y + 0.75, 4.25, K.iron); FN.barrel(h, 1, 6.5); h.f(1, h.y + 1, 6.5, 1.75, h.y + 1.25, 7.25, K.waterV);
      FN.table(h, 1, 3, 1.5, 1); h.f(1.25, h.y + 1, 3.25, 2.25, h.y + 1.25, 3.5, K.steel); h.spot('work:smithy', 4.4, 4.9, { kind: 'work', yaw: h.F.yawOut }); h.spot('forge', 6.4, 6, { kind: 'work', yaw: h.F.yawIn - Math.PI / 2 });
      FN.bed(h, 0.5, 0.75, K.quilt2);
    }
    // ---- carpenter
    { const h = house({ id: 'carp', name: 'Sorrel\'s Workshop', kind: 'shop', x: -37, z: 15, w: 8, d: 7, rot: 0, st: 1, wall: K.wCream, roof: K.thatchOld, door: K.dBlue });
      FN.table(h, 4, 4, 2.5, 1.25); h.f(4.25, h.y + 1, 4.25, 6, h.y + 1.25, 4.75, K.pine); FN.crate(h, 1, 5.5); FN.crate(h, 1.9, 5.5); h.f(0.5, h.y, 1, 0.75, h.y + 2, 3, K.pine); FN.bed(h, 6.5, 0.75, K.quilt3);
      h.spot('work:carp', 5, 3.4, { kind: 'work' }); h.light(4, h.y + 2.4, 3, {});
    }
    // ---- cottages
    const cot = (id, name, x, z, rot, wall, roof, door, st, q) => { const h = house({ id, name, x, z, w: 8, d: 7, rot, st, wall, roof, door }); FN.homey(h, q); h.light(4, h.y + 2.4, 3.5, {}); return h; };
    cot('cotA', 'Rose Cottage', -53, -2, 2, K.wPink, K.thatch, K.dGreen, 1, K.quilt1);
    cot('cotB', 'Fen\'s Cottage', -50, 15, 0, K.wSky, K.rMoss, K.dYellow, 1, K.quilt2);
    cot('cotC', 'Lantern Cottage', -11, -31, 1, K.wButter, K.rRust, K.dBlue, 2, K.quilt3);
    cot('cotD', 'Tumbledown', -11, -46, 1, K.wMint, K.thatchOld, K.dRed, 2, K.quilt1);
    cot('cotE', 'Larkspur Cottage', 4, -32, 3, K.wLilac, K.rTeal, K.dYellow, 2, K.quilt2);
    cot('cotF', 'The Watch House', 4, -47, 3, K.wCream, K.slate, K.dGreen, 1, K.quilt3);
    cot('cotG', 'Dew Cottage', 4, 28, 3, K.wPink, K.rBlue, K.dPurple, 1, K.quilt1);
    cot('farmh', 'Rook Farmhouse', -90, 14, 2, K.wCream, K.thatch, K.dRed, 2, K.quilt2);
    // ---- chapel with bell tower
    { const h = house({ id: 'chapel', name: 'Chapel of the Lantern', kind: 'chapel', x: -24, z: 40, w: 14, d: 9, rot: 1, st: 1, slope: 2, wall: K.lime, base: K.wall, roof: K.slate, door: K.dBlue, win: K.stainedBlue, chim: false, dx: 4.5 });
      for (let i = 0; i < 3; i++) { h.f(1.5, h.y, 2.5 + i * 1.75, 3.5, h.y + 0.5, 3 + i * 1.75, K.plank); h.f(5.5, h.y, 2.5 + i * 1.75, 7.5, h.y + 0.5, 3 + i * 1.75, K.plank); }
      h.f(3.5, h.y, 7.25, 5.5, h.y + 1, 8, K.marble); h.f(4.25, h.y + 1, 7.4, 4.75, h.y + 1.5, 7.9, K.candle); AF.addLight({ x: h.pt(4.5, 7.6)[0], y: h.y + 1.6, z: h.pt(4.5, 7.6)[1], kind: 'interior' });
      FN.rug(h, 4, 1, 1, 6, K.rug2); h.spot('work:chapel', 4.5, 6.5, { kind: 'stand', yaw: h.F.yawOut }); h.spot('pew', 2.5, 3.3, { kind: 'stand' }); h.spot('pew', 6.5, 5, { kind: 'stand' });
      // bell tower at the back corner
      const f = h.f, y0 = 1, tx = 10, tz = 5; f(tx, y0, tz, tx + 4, y0 + 13, tz + 4, K.lime); f(tx + 0.5, y0 + 0.25, tz + 0.5, tx + 3.5, y0 + 14, tz + 3.5, 0); f(tx, y0, tz, tx + 4, y0 + 0.75, tz + 4, K.wall); f(tx + 0.5, y0, tz + 0.5, tx + 3.5, y0 + 0.25, tz + 3.5, K.flag);
      f(tx - 0.25, y0 + 0.25, tz + 1.5, tx + 0.75, y0 + 2.25, tz + 2.5, 0);
      for (const [a, b] of [[tx, tz + 1], [tx + 3.5, tz + 1], [tx + 1, tz], [tx + 1, tz + 3.5]]) { const vx = a === tx || a === tx + 3.5; f(a, y0 + 10, b, a + (vx ? 0.5 : 2), y0 + 12, b + (vx ? 2 : 0.5), 0); }
      f(tx + 0.5, y0 + 9.5, tz + 0.5, tx + 3.5, y0 + 9.75, tz + 3.5, K.plank); f(tx + 1.5, y0 + 10.75, tz + 1.5, tx + 2.5, y0 + 11.75, tz + 2.5, K.bell); f(tx + 1.75, y0 + 11.75, tz + 1.75, tx + 2.25, y0 + 12.5, tz + 2.25, K.oak); f(tx + 0.5, y0 + 12.5, tz + 1.75, tx + 3.5, y0 + 12.75, tz + 2.25, K.oak);
      for (let k = 0; k < 8; k++) f(tx - 0.25 + k * 0.25, y0 + 13 + k * 0.5, tz - 0.25 + k * 0.25, tx + 4.25 - k * 0.25, y0 + 13.5 + k * 0.5, tz + 4.25 - k * 0.25, K.slate);
      f(tx + 1.875, y0 + 17, tz + 1.875, tx + 2.125, y0 + 18.5, tz + 2.125, K.goldMetal);
      f(tx + 2, y0 + 0.25, tz + 2, tx + 2.25, y0 + 10.75, tz + 2.25, K.rope);
      const bp = h.pt(tx + 2, tz + 2); G.bell = { x: bp[0], y: y0 + 11.2, z: bp[1], ropeY: y0 + 0.25 };
      const a = h.pt(tx, tz), b = h.pt(tx + 4, tz + 4); AF.addStructure({ id: 'belfry', name: 'the belfry', kind: 'tower', box: [mn(a[0], b[0]), y0, mn(a[1], b[1]), mx(a[0], b[0]), y0 + 19, mx(a[1], b[1])] });
    }
    // ---- fisher's hut
    { const h = house({ id: 'fisher', name: 'Old Fen\'s Hut', x: 12, z: 66, w: 6, d: 5, rot: 1, st: 1, wall: K.driftwood, beam: K.oakDark, roof: K.rMoss, door: K.dBlue, y: 1 }); FN.bed(h, 0.5, 2.25, K.quilt2); FN.barrel(h, 4.75, 3.75); h.spot('home:fisher', 3, 2.5, {}); }
    // ---- barn + coop
    { const h = house({ id: 'barn', name: 'the barn', kind: 'barn', x: -104, z: 14, w: 10, d: 9, rot: 2, st: 2, wall: K.barnRed, beam: K.whiteWood, roof: K.shingle, open: [3.5, 6.5], chim: false, y: 2, floor: K.dirt, base: K.barnRed });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2 - (i & 1); j++) h.f(0.5 + i * 1.5, h.y + j * 1, 6, 1.75 + i * 1.5, h.y + 1 + j * 1, 8, K.hay);
      h.f(7, h.y, 5.5, 9.5, h.y + 1, 8.5, K.hay); h.f(6, h.y + 2.75, 0.25, 9.75, h.y + 3, 8.75, K.plank); h.f(7, h.y + 3, 6, 9.5, h.y + 4, 8.5, K.hay); h.spot('work:barn', 5, 4, { kind: 'work' });
      const cp = [-72, 30]; W.fill(cp[0], 2, cp[1], cp[0] + 3, 3.5, cp[1] + 2.5, K.plankLight); W.fill(cp[0] + 0.25, 2, cp[1] + 0.25, cp[0] + 2.75, 3.25, cp[1] + 2.25, 0); W.fill(cp[0] + 1, 2, cp[1], cp[0] + 1.75, 2.75, cp[1] + 0.25, 0);
      for (let k = 0; k < 6; k++) { W.fill(cp[0] - 0.25 + k * 0.25, 3.5 + k * 0.25, cp[1] - 0.25, cp[0] + 3.25 - k * 0.25, 3.75 + k * 0.25, cp[1] + 2.75, K.rRed); }
      W.fill(cp[0] + 0.5, 2, cp[1] + 1.5, cp[0] + 2.5, 2.25, cp[1] + 2.25, K.straw); G.coop = { x: cp[0] + 1.4, y: 2, z: cp[1] - 2 }; spot('work:coop', cp[0] + 1.4, 2, cp[1] - 1.5, { kind: 'work', yaw: 0 });
    }
    // ---- windmill on its mound (sails are a three.js mesh, added by the life part)
    { const cx = 112, cz = -14, y0 = 5, r = 3.5;
      for (let y = 0; y < 44; y++) { const rr = r - y * 0.022 * 1; for (let bx = -16; bx < 16; bx++) for (let bz = -16; bz < 16; bz++) { const d = Math.hypot(bx + 0.5, bz + 0.5) * 0.25; if (d < rr && (d > rr - 0.5 || y % 14 === 0)) W.setM(cx + bx * 0.25 + 0.01, y0 + y * 0.25, cz + bz * 0.25 + 0.01, y < 3 ? K.wallDark : y % 14 === 0 && d < rr - 0.5 ? K.plank : (AF.hash3(bx >> 1, y >> 1, bz >> 1) < 0.12 ? K.wallLight : K.lime)); } }
      for (let k = 0; k < 14; k++) { const rr = 3.4 - k * 0.25; for (let bx = -16; bx < 16; bx++) for (let bz = -16; bz < 16; bz++) { const d = Math.hypot(bx + 0.5, bz + 0.5) * 0.25; if (d < rr && d > rr - 0.6) W.setM(cx + bx * 0.25 + 0.01, y0 + 11 + k * 0.25, cz + bz * 0.25 + 0.01, K.rRust); } }
      W.fill(cx - 0.5, y0 + 0.25, cz + 2.5, cx + 0.5, y0 + 2.25, cz + 3.75, 0); W.fill(cx - 0.75, y0, cz + 3.4, cx + 0.75, y0 + 0.25, cz + 4.4, K.flag);
      for (const a of [0.9, 2.5, 4.2]) W.fill(cx + Math.cos(a) * 3.2 - 0.25, y0 + 5, cz + Math.sin(a) * 3.2 - 0.25, cx + Math.cos(a) * 3.2 + 0.5, y0 + 6, cz + Math.sin(a) * 3.2 + 0.5, K.windowWarm);
      W.fill(cx - 1, y0 + 0.25, cz - 1, cx + 1, y0 + 0.75, cz + 1, K.wall); W.fill(cx - 2.5, y0 + 0.25, cz - 1, cx - 1.75, y0 + 1.25, cz + 0.5, K.canvas);
      AF.addStructure({ id: 'mill', name: 'the windmill', kind: 'tower', box: [cx - 4, y0, cz - 4, cx + 4, y0 + 15, cz + 4] });
      G.mill = { x: cx, y: y0 + 9.5, z: cz + 3.6 }; G.places.mill = { id: 'mill', name: 'the Windmill', door: [cx, cz + 5.5], inside: [cx, cz + 1.8], y: y0 + 0.25 };
      spot('work:mill', cx + 0.2, y0 + 0.25, cz + 1.9, { kind: 'work', place: 'mill' }); spot('work:mill', cx + 4, y0, cz + 6, { kind: 'work' });
      lamp(cx - 1, y0 + 2.4, cz + 3.7, { kind: 'porch' });
    }
    // ---- the well in the square
    { const x = 5, z = 4, y = 1; W.fill(x - 1, y, z - 1, x + 1, y + 1, z + 1, K.wall); W.fill(x - 0.75, y + 0.25, z - 0.75, x + 0.75, y + 1, z + 0.75, 0); W.fill(x - 0.75, y, z - 0.75, x + 0.75, y + 0.5, z + 0.75, K.waterV);
      W.fill(x - 1, y + 1, z - 0.125, x - 0.75, y + 2.75, z + 0.125, K.oak); W.fill(x + 0.75, y + 1, z - 0.125, x + 1, y + 2.75, z + 0.125, K.oak); W.fill(x - 1, y + 2.5, z - 0.125, x + 1, y + 2.75, z + 0.125, K.oak);
      for (let k = 0; k < 4; k++) W.fill(x - 1.25, y + 2.75 + k * 0.25, z - 1 + k * 0.25, x + 1.25, y + 3 + k * 0.25, z + 1 - k * 0.25, K.rTeal);
      G.well = { x, y: y + 1, z }; }
    // ---- notice board, benches, market stalls, lamp posts
    { W.fill(-6, 1, 3.5, -5.75, 2.75, 3.75, K.oak); W.fill(-3.75, 1, 3.5, -3.5, 2.75, 3.75, K.oak); W.fill(-6, 1.75, 3.5, -3.5, 2.75, 3.75, K.pine); W.fill(-5.5, 2, 3.75, -5, 2.5, 3.8, K.lime); W.fill(-4.5, 2.1, 3.75, -4, 2.6, 3.8, K.daubWarm); G.board = { x: -4.75, y: 2, z: 4.4 }; }
    const bench = (x, z, alongX, yaw) => { const y = W.groundY(x, z); if (alongX) { W.fill(x - 0.75, y, z - 0.25, x + 0.75, y + 0.5, z + 0.25, K.plankLight); } else W.fill(x - 0.25, y, z - 0.75, x + 0.25, y + 0.5, z + 0.75, K.plankLight); spot('bench', x, y + 0.5, z, { kind: 'sit', yaw }); };
    bench(-9, 17, true, Math.PI); bench(9.5, 2, false, -Math.PI / 2); bench(-10.5, 6, false, Math.PI / 2); bench(30, 84 - 14, true, 0.6); bench(165, -22, true, Math.PI * 0.5); bench(-4, 58, false, Math.PI / 2);
    const stall = (x, z, awn, goods, name) => { const y = 1; for (const [a, b] of [[x, z], [x + 2.75, z], [x, z + 1.75], [x + 2.75, z + 1.75]]) W.fill(a, y, b, a + 0.25, y + 2.25 + (b > z ? 0.5 : 0), b + 0.25, K.pine);
      for (let k = 0; k < 10; k++) for (let i = 0; i < 7; i++) W.fill(x - 0.25 + i * 0.5, y + 2.25 + (k >> 2) * 0.25, z - 0.25 + k * 0.25, x + 0.25 + i * 0.5, y + 2.5 + (k >> 2) * 0.25, z + k * 0.25, i & 1 ? awn : K.sail);
      W.fill(x + 0.25, y + 0.75, z + 0.25, x + 2.75, y + 1, z + 1.5, K.plank); for (let i = 0; i < 5; i++) W.fill(x + 0.4 + i * 0.45, y + 1, z + 0.5, x + 0.7 + i * 0.45, y + 1.25, z + 0.8 + (i & 1) * 0.3, goods[i % goods.length]);
      spot('work:' + name, x + 1.5, y, z + 2.4, { kind: 'counter', yaw: Math.PI }); spot('shop', x + 1.5, y, z - 1, { kind: 'browse', yaw: 0 }); };
    stall(5, 17, K.awnRed, [K.apple, K.cabbage, K.pumpkin, K.bread], 'stall1'); stall(9.5, 12, K.awnBlue, [K.potion1, K.potion2, K.goldMetal, K.potion3], 'stall2'); stall(-10, 10.5 - 13, K.awnGreen, [K.flowerR, K.flowerY, K.flowerP, K.flowerB, K.flowerW], 'flowers');
    for (const [x, z] of [[-12.5, 4], [12.5, 16], [-12, 17.5], [12, 2.5], [3, -24], [-3, -40], [34, 12.5], [-34, 7.5], [3, 38], [-3, 52], [50, 12.5], [82, 7.5], [-60, 9], [3, -52]]) lampPost(x, z);
    // ---- bridge
    { const y = 1; W.fill(55, y, 8, 77, y + 0.25, 12, K.wall); for (let x = 55; x < 77; x += 0.25) { const a = Math.sin((x - 55) / 22 * Math.PI) * 0.9; const yy = Math.round((y + a) * 4) / 4; W.fill(x, yy - 0.25, 8, x + 0.25, yy + 0.25, 12, K.wall); W.fill(x, yy + 0.25, 8, x + 0.25, yy + 1, 8.25, K.wallLight); W.fill(x, yy + 0.25, 11.75, x + 0.25, yy + 1, 12, K.wallLight); if (Math.abs(x - 66) < 5.5 && Math.abs(x - 66) > 1.5) W.fill(x, -2, 8.25, x + 0.25, yy - 0.5 - (1.6 - Math.abs(Math.abs(x - 66) - 3.5)) * 1.2, 11.75, 0); else if (x > 58 && x < 74) W.fill(x, -2, 8.25, x + 0.25, yy - 0.25, 11.75, K.wallDark); }
      lamp(57, 2.6, 8.1, {}); lamp(75, 2.6, 11.9, {}); AF.addStructure({ id: 'bridge', name: 'the old bridge', kind: 'bridge', box: [55, -2, 8, 77, 3, 12] }); }
    // ---- jetty
    { for (let i = 0; i < 44; i++) { const t = i / 44, x = 22 + t * 12, z = 78 + t * 7; W.fill(x - 0.75, 0.25, z - 0.75, x + 0.75, 0.5, z + 0.75, i & 1 ? K.plank : K.plankLight); if (i % 8 === 4) { W.fill(x - 0.75, -3, z - 0.75, x - 0.5, 1, z - 0.5, K.oakDark); W.fill(x + 0.5, -3, z + 0.5, x + 0.75, 1, z + 0.75, K.oakDark); } }
      G.fishSpot = { x: 34.3, y: 0.5, z: 85.4 }; spot('fish', 33.6, 0.5, 84.8, { kind: 'fish', yaw: 1.0 }); lamp(34.6, 1.0, 84.4, {}); FN.barrel({ f: W.fill, y: 0.5 }, 30.5, 82.9); }
    // ---- farm: fences, pumpkins, scarecrow, hay
    const fence = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.25); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n, y = W.groundY(x, z); if (i % 8 === 0) W.fill(x, y, z, x + 0.25, y + 1, z + 0.25, K.oak); else { W.setM(x, y + 0.5, z, K.plankLight); W.setM(x, y + 0.75, z, 0); } } };
    fence(-105, 43, -63, 43); fence(-105, 75, -63, 75); fence(-105, 43, -105, 75); fence(-63, 43, -63, 58); fence(-63, 62, -63, 75); fence(-76, 28, -66, 28); fence(-66, 28, -66, 36); fence(-76, 36, -66, 36); fence(-76, 33, -76, 36);
    G.crops = [];
    for (let x = -102; x < -85; x += 2) for (let z = 46; z < 73; z += 2.25) { const y = W.groundY(x, z); if (R() < 0.8) { W.fill(x, y, z, x + 0.25, y + 0.75, z + 0.25, K.wheat); W.fill(x + 0.5, y, z + 0.75, x + 0.75, y + 0.75, z + 1, K.wheat); W.fill(x + 1, y, z + 0.25, x + 1.25, y + 0.5, z + 0.5, K.wheat); } }
    for (let x = -79; x < -66; x += 2.25) for (let z = 47; z < 72; z += 3) { const y = W.groundY(x, z); if (R() < 0.75) { const s = R() < 0.5 ? 0.5 : 0.75; W.fill(x, y, z, x + s, y + s - 0.25 + 0.25, z + s, K.pumpkin); W.setM(x + 0.25, y + s, z + 0.25, K.stem); G.crops.push({ x: x + s / 2, y, z: z + s / 2, s, kind: 'pumpkin' }); } else { W.fill(x, y, z, x + 0.5, y + 0.25, z + 0.5, K.cabbage); } }
    { const x = -82, z = 60, y = W.groundY(x, z); W.fill(x, y, z, x + 0.25, y + 2, z + 0.25, K.oak); W.fill(x - 0.75, y + 1.25, z, x + 1, y + 1.5, z + 0.25, K.oak); W.fill(x - 0.25, y + 0.75, z, x + 0.5, y + 1.5, z + 0.25, K.awnBlue); W.fill(x - 0.25, y + 1.75, z - 0.125, x + 0.5, y + 2.25, z + 0.375, K.canvas); W.fill(x - 0.5, y + 2.25, z - 0.25, x + 0.75, y + 2.5, z + 0.5, K.straw); G.scarecrow = { x: x + 0.1, y: y + 1.5, z: z + 0.1 }; }
    for (const [x, z] of [[-92, 38], [-90, 39.5], [-66, 40], [-99, 39]]) { const y = W.groundY(x, z); W.fill(x, y, z, x + 1.25, y + 1, z + 1, K.hay); }
    // ---- laundry by the river, bunting over the square
    { const y = 1; for (const [x0, z0, x1, z1] of [[49, 22, 49, 30], [46, 32, 52, 37]]) { W.fill(x0, y, z0, x0 + 0.25, y + 2.25, z0 + 0.25, K.oak); W.fill(x1, y, z1, x1 + 0.25, y + 2.25, z1 + 0.25, K.oak); const n = 5; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; AF.kit.flag(x0 + (x1 - x0) * t, y + 2.2, z0 + (z1 - z0) * t, { kind: 'banner', w: 0.8, h: 0.9 + (i % 3) * 0.3, c1: [0xf4efe4, 0xc05a6a, 0x5a8ac0, 0xf0d98e, 0xf4efe4][i], yaw: Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2 }); } }
      spot('work:laundry', 50.5, 1, 26, { kind: 'work', yaw: -Math.PI / 2 }); spot('work:laundry', 49, 1, 34.5, { kind: 'work', yaw: 0.6 });
      const cols = [0xc0453a, 0xe3b84a, 0x3f6fae, 0x4f8f4a, 0xc87ae8]; const poles = [[-13, -1], [13, -1], [14, 21], [-13, 21]];
      for (const [x, z] of poles) W.fill(x, 1, z, x + 0.25, 5.5, z + 0.25, K.oak);
      for (let p = 0; p < 4; p++) { const a = poles[p], b = poles[(p + 1) % 4]; for (let i = 1; i < 12; i++) { const t = i / 12; AF.kit.flag(a[0] + (b[0] - a[0]) * t, 5.4 - Math.sin(t * Math.PI) * 0.9, a[1] + (b[1] - a[1]) * t, { kind: 'banner', w: 0.45, h: 0.6, c1: cols[(i + p) % 5], yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2 }); } } }
    // ---- graveyard + standing stones + ridge-top observatory circle
    for (let i = 0; i < 9; i++) { const x = -30 + (i % 3) * 3 + R(), z = 60 + ((i / 3) | 0) * 3.2 + R(), y = W.groundY(x, z); W.fill(x, y, z, x + 0.75, y + 0.75 + (i % 2) * 0.25, z + 0.25, i % 4 === 0 ? K.wallMoss : K.granite); }
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, x = -60 + Math.cos(a) * 6.5, z = -60 + Math.sin(a) * 6.5, y = W.groundY(x, z), hh = 2.5 + (i % 3) * 0.75; W.fill(x - 0.5, y, z - 0.375, x + 0.5, y + hh, z + 0.375, i % 3 ? K.granite : K.wallMoss); W.fill(x - 0.25, y + hh - 1, z - 0.4, x + 0.25, y + hh - 0.5, z + 0.4, K.rune); }
    W.fill(-60.75, 4, -60.75, -59.25, 4.5, -59.25, K.granite); W.fill(-60.25, 4.5, -60.25, -59.75, 4.75, -59.75, K.rune); G.stones = { x: -60, y: 4.5, z: -60 }; AF.addLight({ x: -60, y: 5.4, z: -60, kind: 'magic', color: 0x5ad0ff });
    { const cx = 165, cz = -32, y = P.RIDGE_Y; W.eachCol(cx - 8, cz - 8, cx + 8, cz + 8, (bx, bz, i, x, z) => { const d = Math.hypot(x - cx, z - cz); if (d < 7) { W.H[i] = y * 4; W.C[i] = d < 5 && ((Math.atan2(z - cz, x - cx) / Math.PI * 6 + 12) | 0) % 2 ? K.flagT : K.sqCob2; } });
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = cx + Math.cos(a) * 6.2, z = cz + Math.sin(a) * 6.2; W.fill(x - 0.25, y, z - 0.25, x + 0.25, y + 0.75 + (i % 3 === 0 ? 1.25 : 0), z + 0.25, K.granite); if (i % 3 === 0) W.fill(x - 0.25, y + 1.5, z - 0.25, x + 0.25, y + 1.75, z + 0.25, K.rune); }
      W.fill(cx - 0.25, y, cz - 0.25, cx + 0.25, y + 1.25, cz + 0.25, K.oak); W.fill(cx - 0.25, y + 1.25, cz - 1, cx + 0.25, y + 1.75, cz + 0.75, K.brass); W.fill(cx - 0.125, y + 1.375, cz - 1.25, cx + 0.125, y + 1.625, cz - 1, K.glass);
      W.fill(cx + 2, y, cz + 1.5, cx + 4, y + 0.25, cz + 3.5, K.quilt2); G.scope = { x: cx, y: y + 1.5, z: cz + 1.2 }; G.blanket = { x: cx + 3, y: y + 0.25, z: cz + 2.5 }; lamp(cx - 3.5, y + 0.25, cz + 3.5, {}); }
    // crag-top gate pillars + lamps on the climb
    for (const n of ['gate', 'c1', 'c2', 'c3']) { const a = P.N[n]; lampPost(a[0] + 2.4, a[1] + 1); }
    for (const n of ['e3', 'm1', 'r1', 'r2', 'r3', 'r4', 'w3', 'w4', 'w5', 's3', 'grave']) { const a = P.N[n]; lampPost(a[0] + 2, a[1] + 1.8); }
  });
}
