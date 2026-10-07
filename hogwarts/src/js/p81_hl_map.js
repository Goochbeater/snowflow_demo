/* ==== p81_hl_map.js ==== */
/* HOGWARTS — the map (M): the grounds seen from above, painted once from the live world onto parchment; you, your
   errand, the named places and the Floo flames (click one to travel). */
HL.map = { W: 1500, cx: -40, cz: 60, N: 1024, url: null };
HL.map.uv = function (x, z) { const M = HL.map; return [(M.cx + M.W / 2 - x) / M.W, (M.cz + M.W / 2 - z) / M.W]; };
HL.map.bake = function () {
  const M = HL.map, N = M.N, r = R.renderer, rt = new THREE.WebGLRenderTarget(N, N, { depthBuffer: true }), cam = new THREE.OrthographicCamera(-M.W / 2, M.W / 2, M.W / 2, -M.W / 2, 1, 2400);
  cam.position.set(M.cx, 1200, M.cz); cam.up.set(0, 0, 1); cam.lookAt(M.cx, 0, M.cz); cam.updateMatrixWorld(true);
  const fd = R.scene.fog ? R.scene.fog.density : 0, hi = R.hemi.intensity, vis = []; if (R.scene.fog) R.scene.fog.density = 0; R.hemi.intensity = HL.LOOK.hemiI * Math.PI * 1.3;
  for (const a of [PLAYER.a].concat(HL.npcs)) if (a && a.root.visible) { a.root.visible = false; vis.push(a); }
  const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.clear(true, true, true); r.render(R.scene, cam); const px = new Uint8Array(N * N * 4); r.readRenderTargetPixels(rt, 0, 0, N, N, px); r.setRenderTarget(prev); rt.dispose();
  if (R.scene.fog) R.scene.fog.density = fd; R.hemi.intensity = hi; for (const a of vis) a.root.visible = true;
  const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N), rs = mulberry(5);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const s = ((N - 1 - j) * N + i) * 4, t = (j * N + i) * 4; let R0 = Math.pow(Math.min(1, px[s] / 255 * 1.5), 1 / 2.2), G0 = Math.pow(Math.min(1, px[s + 1] / 255 * 1.5), 1 / 2.2), B0 = Math.pow(Math.min(1, px[s + 2] / 255 * 1.5), 1 / 2.2);
    const l = R0 * 0.3 + G0 * 0.6 + B0 * 0.1, water = B0 > G0 * 1.02 && B0 > R0 * 1.15 && l < 0.5, k = 0.5, n = (rs() - 0.5) * 0.05; R0 = lerp(l, R0, k); G0 = lerp(l, G0, k); B0 = lerp(l, B0, k);
    const du = i / N - 0.5, dv = j / N - 0.5, vg = 1 - Math.pow(Math.hypot(du, dv) * 1.42, 3) * 0.75;
    im.data[t] = clamp((water ? 0.52 : 0.2 + R0 * 0.86) * 255 * (1.05 + n) * vg + 18, 0, 255); im.data[t + 1] = clamp((water ? 0.6 : 0.17 + G0 * 0.8) * 255 * (1.0 + n) * vg + 12, 0, 255); im.data[t + 2] = clamp((water ? 0.62 : 0.11 + B0 * 0.62) * 255 * (0.95 + n) * vg, 0, 255); im.data[t + 3] = 255; }
  x.putImageData(im, 0, 0);
  // a ruled border, a compass
  x.strokeStyle = 'rgba(60,36,14,0.8)'; x.lineWidth = 6; x.strokeRect(14, 14, N - 28, N - 28); x.lineWidth = 1.5; x.strokeRect(26, 26, N - 52, N - 52);
  x.save(); x.translate(N - 110, N - 110); x.strokeStyle = 'rgba(60,36,14,0.85)'; x.fillStyle = 'rgba(60,36,14,0.85)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 44, 0, TAU); x.stroke(); for (let k = 0; k < 4; k++) { x.rotate(HALF); x.beginPath(); x.moveTo(0, -56); x.lineTo(7, 0); x.lineTo(-7, 0); x.fill(); } x.font = '22px HLA, Georgia, serif'; x.textAlign = 'center'; x.fillText('N', 0, -62); x.restore();
  M.url = c.toDataURL('image/jpeg', 0.9);
};
HL.map.css = `
.hlMap { position: absolute; inset: 0; background: rgba(4,3,6,0.86); display: flex; align-items: center; justify-content: center; gap: 28px; }
.hlMap .sheet { position: relative; height: min(88vh, 62vw); aspect-ratio: 1; background-size: cover; box-shadow: 0 20px 70px #000, 0 0 0 1px #2a1c0c; border-radius: 3px; overflow: hidden; }
.hlMap .lab { position: absolute; transform: translate(-50%, -50%); font-family: 'HLA', serif; font-size: 13px; letter-spacing: 0.14em; color: #2a1806; text-shadow: 0 0 6px rgba(240,220,170,0.9), 0 0 2px rgba(240,220,170,1); white-space: nowrap; pointer-events: none; }
.hlMap .lab.big { font-size: 20px; letter-spacing: 0.3em; } .hlMap .me { position: absolute; width: 0; height: 0; } .hlMap .me i { position: absolute; left: -9px; top: -13px; border-left: 9px solid transparent; border-right: 9px solid transparent; border-bottom: 24px solid #b01c14; filter: drop-shadow(0 0 4px #fff); }
.hlMap .qm { position: absolute; width: 16px; height: 16px; margin: -8px; border: 2px solid #8a5a00; background: #ffd040; transform: rotate(45deg); box-shadow: 0 0 10px #ffd040; animation: hlpulse 0.9s infinite alternate; }
.hlMap .fl { position: absolute; width: 22px; height: 22px; margin: -11px; border-radius: 50%; background: radial-gradient(#c8ffd8, #1c9a48 60%, #0a3a1c); border: 1.5px solid #063a16; cursor: pointer; pointer-events: auto; box-shadow: 0 0 10px #40ff80; } .hlMap .fl:hover { transform: scale(1.35); }
.hlMap .pg { position: absolute; width: 8px; height: 8px; margin: -4px; background: #2a5a9a; transform: rotate(45deg); opacity: 0.85; } .hlMap .cs { position: absolute; width: 9px; height: 7px; margin: -4px; background: #6a3a0a; border: 1px solid #f0d080; }
.hlMap .side { width: 300px; color: #e6dcc6; } .hlMap .side h3 { font-family: 'HLA', serif; font-weight: 400; letter-spacing: 0.4em; font-size: 24px; color: var(--gold); margin: 0 0 14px; } .hlMap .side p { font-size: 16px; margin: 0 0 10px; line-height: 1.35; } .hlMap .side b { color: var(--gold); font-weight: 400; font-family: 'HLA', serif; letter-spacing: 0.1em; font-size: 13px; display: block; margin-top: 12px; }
.hlMap .lg { display: flex; align-items: center; gap: 10px; font-size: 15px; margin: 6px 0; } .hlMap .lg span { position: relative; width: 22px; height: 22px; display: inline-block; } .hlMap .lg span > * { position: absolute !important; left: 11px !important; top: 11px !important; }
`;
HL.map.PLACES = () => [['Hogwarts', 30, 300, 1], ['Hogsmeade', HL.VIL.x, HL.VIL.z + 46], ['Quidditch Pitch', HL.PITCH.x, HL.PITCH.z + 120], ['The Black Lake', 250, -200, 1], ['The Forbidden Forest', -170, 470, 1], ['Gamekeeper’s Hut', HL.HUT.x, HL.HUT.z - 22], ['Boathouse', (HL.BOAT ? HL.BOAT[0] : 150) + 30, (HL.BOAT ? HL.BOAT[1] : 46) - 20], ['Owlery', HL.OWLERY ? HL.OWLERY[0] : 204, (HL.OWLERY ? HL.OWLERY[2] : 176) + 22], ['The Viaduct', -52, -150], ['Standing Stones', HL.MAGE[0], HL.MAGE[1] + 22], ['Troll’s Hollow', HL.TROLL[0], HL.TROLL[1] + 20]];
HL.map.open = function () {
  if (MG.state !== 'play' || !PLAYER.a) return; const M = HL.map, U = HL.ui; if (!M.url) { M.bake(); const st = document.createElement('style'); st.textContent = M.css; document.head.appendChild(st); }
  MG.state = 'map'; if (document.exitPointerLock) document.exitPointerLock(); const a = PLAYER.a, pc = (x, z) => { const u = M.uv(x, z); return `left:${(u[0] * 100).toFixed(2)}%;top:${(u[1] * 100).toFixed(2)}%`; }, q = HL.quest.way && !HL.Q.on ? HL.quest.way() : null, Qc = HL.quest.cur();
  let h = ''; for (const p of M.PLACES()) h += `<div class="lab ${p[3] ? 'big' : ''}" style="${pc(p[1], p[2])}">${p[0]}</div>`;
  for (const s of HL.SECRETS) if (s.got) h += `<div class="pg" style="${pc(s.p.x, s.p.z)}"></div>`; for (const c of HL.LOOT.chests) if (c.open) h += `<div class="cs" style="${pc(c.x, c.z)}"></div>`;
  HL.FLOO.forEach((f, i) => { h += `<div class="fl" data-f="${i}" title="${f.name}" style="${pc(f.p[0], f.p[2])}"></div>`; });
  if (q) h += `<div class="qm" style="${pc(q[0], q[2])}"></div>`; h += `<div class="me" style="${pc(a.x, a.z)};transform:rotate(${(-CAM.yaw).toFixed(3)}rad)"><i></i></div>`;
  const S = U.screen(`<div class="hlMap"><div class="sheet" style="background-image:url(${M.url})">${h}</div><div class="side"><h3>THE GROUNDS</h3><b>${Qc.t}</b><p>${Qc.n}</p>
    <b>FOUND</b><p>Field Guide pages ${HL.SECRETS.filter((s) => s.got).length} / ${HL.SECRETS.length}<br>Chests opened ${HL.LOOT.chests.filter((c) => c.open).length} / ${HL.LOOT.chests.length}</p>
    <b>LEGEND</b><div class="lg"><span><div class="me"><i></i></div></span>You</div><div class="lg"><span><div class="qm"></div></span>Your errand</div><div class="lg"><span><div class="fl"></div></span>Floo flame — click to travel</div><div class="lg"><span><div class="pg"></div></span>Page found</div><div class="lg"><span><div class="cs"></div></span>Chest opened</div>
    <p style="margin-top:18px;font-style:italic;color:#a89a80"><kbd>M</kbd> or <kbd>Esc</kbd> to fold the map</p></div></div>`);
  const close = () => { U.screen(''); MG.state = 'play'; MG.onKey = null; IN.buf = {}; HL.noPauseT = MG.rt + 0.25; };
  S.querySelectorAll('.fl[data-f]').forEach((e) => e.onclick = () => { if (HL.Q.on || PLAYER.state === 'fly') { HL.ui.toast('', 'Land first — Floo powder needs your feet on the ground.'); return; } const f = HL.FLOO[+e.dataset.f]; U.fade(1); close(); setTimeout(() => { const p = PLAYER.a; p.x = f.p[0]; p.y = f.p[1] + 0.1; p.z = f.p[2]; p.vx = p.vy = p.vz = 0; p.yaw = f.p[3]; CAM.yaw = f.p[3]; CAM.snap = true; if (p.inst.cloth && p.inst.cloth.reset) p.inst.cloth.reset(); U.fade(0); U.spellName(f.name); }, 500); });
  MG.onKey = (c) => { if (c === 'Escape' || c === 'KeyM') close(); };
};
(function () { const w0 = HL.worldUpdate; HL.worldUpdate = function (dt) { w0(dt); if (IN.take('map')) HL.map.open(); }; })();
