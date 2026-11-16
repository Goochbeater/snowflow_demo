// ===== 99-boot: run build stages, mesh the world, start  (OWNER: coordinator) =====
// Build order table (see CONTRACT.md):
//  100 terrain heightmap · 150 water/roads painting · 200 rail bed · 300 buildings · 400 street furniture + nature
//  500 MESH WORLD (core) · 600 dynamic actors (cars, trains, people) · 700 atmosphere/post · 800 player + UI · 900 final
AF.onBuild('mesh-world', 500, async () => { await AF.meshWorld(async (f) => { AF.loader(0.55 + f * 0.3, 'raising the rooftops… ' + Math.round(f * 100) + '%'); await AF.yield(); }); });
AF.loader = (f, msg) => {
  const fill = document.getElementById('ldfill'), m = document.getElementById('ldmsg');
  if (fill) fill.style.width = Math.round(f * 100) + '%';
  if (m && msg) m.textContent = msg;
};
(async () => {
  const t0 = performance.now();
  const stages = AF.hooks.build.slice().sort((a, b) => a.order - b.order);
  AF.stageTimes = {};
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (s.order !== 500) AF.loader(s.order < 500 ? 0.05 + 0.5 * i / stages.length : 0.85 + 0.15 * i / stages.length, s.name.replace(/-/g, ' ') + '…');
    await AF.yield();
    const ts = performance.now();
    try { await s.fn(); }
    catch (e) { console.error('[af] build stage ' + s.name + ' threw:', e); AF.errors.push({ part: 'build:' + s.name, msg: String(e && e.stack || e) }); }
    AF.stageTimes[s.name] = Math.round(performance.now() - ts);
  }
  if (AF.PAL.dirty) AF.PAL.upload();
  AF.bootMs = Math.round(performance.now() - t0);
  console.log('[af] boot', AF.bootMs, 'ms', JSON.stringify(AF.stageTimes));
  if (!AF.mode) {
    if (AF.modes.aerial) AF.setMode('aerial');
    else { const v = AF.PLAN.views[0]; AF.camPose(...v.pos, ...v.target); }
  }
  // No hitches on first use. (1) The number of lights three.js sees must never change (a light toggled visible recompiles
  // every lit material): every light is pinned visible, and "hidden" just means intensity 0. (2) Every material is really
  // DRAWN once behind the loading card (hidden pooled objects shown, empty instanced pools given one instance), because the
  // GPU builds its pipelines at first draw, not at compile.
  AF.pinLight = (l) => {
    if (l._afPinned) return; l._afPinned = true;
    let vis = l.visible, inten = l.intensity;
    Object.defineProperty(l, 'visible', { get: () => true, set: (v) => { vis = !!v; }, configurable: true });
    Object.defineProperty(l, 'intensity', { get: () => (vis ? inten : 0), set: (v) => { inten = v; }, configurable: true });
  };
  AF.pinLights = () => { let n = 0; AF.scene.traverse((o) => { if (o.isLight && !o._afPinned) { AF.pinLight(o); n++; } }); return n; };
  AF.onTick('pin-lights', 995, () => { if (AF.clock.frame % 90 === 0) { const n = AF.pinLights(); if (n && AF.ready && AF.clock.t > 3) AF.warnOnce('lights added after boot: ' + n + ' (causes a recompile hitch; create lights at build time)'); } });
  AF.prewarm = () => {
    const t = performance.now(), hid = [], inst = [];
    AF.pinLights();
    AF.scene.traverse((o) => {
      if (!o.visible && !o.isLight) { hid.push(o); o.visible = true; }
      if (o.isInstancedMesh && o.count === 0) { inst.push([o, 0]); o.count = 1; }
      else if (o.geometry && o.geometry.isInstancedBufferGeometry && o.geometry.instanceCount === 0) { inst.push([o, 1]); o.geometry.instanceCount = 1; }
    });
    const cull = []; AF.scene.traverse((o) => { if (o.isMesh && o.frustumCulled) { cull.push(o); o.frustumCulled = false; } });
    try { AF.renderer.compile(AF.scene, AF.camera); AF.renderFrame(); AF.renderFrame(); } catch (e) { console.warn('[af] prewarm', e); }
    for (const o of cull) o.frustumCulled = true;
    for (const o of hid) o.visible = false;
    for (const [o, k] of inst) { if (k) o.geometry.instanceCount = 0; else o.count = 0; }
    AF.stats.prewarmMs = Math.round(performance.now() - t);
  };
  AF.loader(0.97, 'raising the rooftops…'); await AF.yield();
  if (AF.world.buildAllNear && AF.Q.has('allnear')) AF.world.buildAllNear();
  AF.loader(0.99, 'lighting the lanterns…'); await AF.yield();
  AF.prewarm();
  AF.ready = true;
  AF.emit('ready');
  const ld = document.getElementById('loader'); if (ld) { ld.classList.add('done'); setTimeout(() => ld.remove(), 1500); }
  if (AF.TEST) {
    AF.step(3);
    const res = []; let pass = 0;
    for (const t of AF.hooks.tests) {
      let ok = false, info = '';
      try { const r = await t.fn(); ok = r === true || (r && r.ok); info = r && r.info ? r.info : (typeof r === 'string' ? r : ''); }
      catch (e) { info = 'threw ' + (e && e.message); }
      res.push({ name: t.name, ok, info }); if (ok) pass++;
      console.log('[test] ' + (ok ? 'PASS' : 'FAIL') + ' ' + t.name + (info ? ' — ' + info : ''));
    }
    AF.testResult = { pass, total: res.length, res };
    document.title = `${pass}/${res.length} ${AF.PLAN.name}`;
    console.log(`[test] ${pass}/${res.length}`);
  }
})();
