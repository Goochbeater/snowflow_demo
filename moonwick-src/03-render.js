// ===== 03-render: renderer, scene, camera, baseline lights, loop, debug handle  (OWNER: coordinator) =====
{
  const cv = document.getElementById('cv');
  const R = AF.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: AF.SHOT || AF.TEST, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(devicePixelRatio || 1, AF.SHOT ? 1 : 1.5));
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.0;
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  AF.maxAniso = R.capabilities.getMaxAnisotropy();

  const S = AF.scene = new THREE.Scene();
  S.background = new THREE.Color(0x9cc4e4);
  S.fog = new THREE.Fog(0xbcd3e0, 120, 620);
  const cam = AF.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.08, 2500);
  cam.position.set(-160, 120, 220); cam.lookAt(0, 0, 0);
  S.add(cam);

  // Baseline lights — the atmosphere part (60-atmos.js) takes these over (AF.sun, AF.hemi, AF.amb) and drives them.
  const sun = AF.sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sun.position.set(120, 180, 80); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 1; sc.far = 900;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
  S.add(sun); S.add(sun.target);
  AF.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6b5a3e, 1.1); S.add(AF.hemi);
  AF.amb = new THREE.AmbientLight(0xffffff, 0.35); S.add(AF.amb);
  // shadow focus: parts set AF.shadowFocus (Vector3) + AF.shadowRadius; default follows the camera target
  AF.shadowFocus = new THREE.Vector3(); AF.shadowRadius = 140; AF.camTarget = new THREE.Vector3();
  AF.onTick('shadow-follow', 890, () => {
    const f = AF.shadowFocus, r = AF.shadowRadius;
    const d = AF.time.sunDir;
    sun.target.position.copy(f);
    sun.position.copy(f).addScaledVector(d, 400);
    if (sc.right !== r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.updateProjectionMatrix(); }
    // texel snapping reduces shadow shimmer
    const texel = (2 * r) / sun.shadow.mapSize.x;
    sun.target.position.x = Math.round(sun.target.position.x / texel) * texel;
    sun.target.position.z = Math.round(sun.target.position.z / texel) * texel;
    sun.position.copy(sun.target.position).addScaledVector(d, 400);
  });

  // fallback time-of-day (the atmosphere part replaces AF.timeTick)
  AF.timeTick = (dt) => {
    const T = AF.time; if (!T.paused) T.hours = (T.hours + dt * T.speed) % 24;
    const a = (T.hours - 6) / 12 * Math.PI; // 6h sunrise, 18h sunset
    T.sunDir.set(Math.cos(a) * 0.8, Math.max(0.05, Math.sin(a)), 0.45).normalize();
    T.night = AF.smooth(0.15, -0.1, Math.sin(a));
  };
  AF.onTick('time', 5, (dt) => { AF.timeTick(dt); AF.mat.uniforms.uNight.value = AF.time.night; });

  // fallback camera when no mode is active (tests / shots): AF.camPose(pos, target)
  AF.camPose = (px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); AF.camTarget.set(tx, ty, tz); cam.lookAt(AF.camTarget); AF.shadowFocus.set(tx, 0, tz); };

  // resize
  AF.resize = () => {
    const w = AF.SHOT ? (+AF.Q.get('w') || 1280) : (innerWidth || 1280), h = AF.SHOT ? (+AF.Q.get('h') || 720) : (innerHeight || 720);
    // (perf) a pixel budget, not just a ratio cap: about 3.6 M pixels whatever the window, so a big or Retina window holds 60 fps
    if (!AF.SHOT) R.setPixelRatio(Math.max(0.75, Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(+(AF.Q.get('px') || 3.6e6) / Math.max(1, w * h)))));
    R.setSize(w, h, !AF.SHOT); cam.aspect = w / h; cam.updateProjectionMatrix();
    AF.emit('resize', w, h);
  };
  addEventListener('resize', AF.resize); AF.resize();

  // render: post part may replace AF.renderFrame
  AF.renderFrame = () => R.render(S, cam);

  // loop
  let last = performance.now(), fpsAcc = 0, fpsN = 0;
  const slow = { t: 0, scale: 1 };
  AF.timeScale = 1;
  // AF.slowmo(0.35, 1.4): run the world at 35% speed for 1.4 real seconds, then ease back (ignored while one is running)
  AF.slowmo = (scale = 0.35, secs = 1.2) => { if (!AF.Q.has('slowmo')) return;      /* no slow motion: it breaks the immersion */
    if (slow.t > 0.2 || AF.SHOT) return; slow.scale = scale; slow.t = secs; };
  AF.fps = 60;
  AF.paused = false;
  const frame = (dt) => {
    AF.clock.dt = dt; AF.clock.t += dt; AF.clock.frame++;
    const prof = AF.PROF;
    for (const h of AF.hooks.tick) {
      let t0 = 0; if (prof) t0 = performance.now();
      try { h.fn(dt, AF.clock.t); if (prof) { const e = performance.now() - t0; prof[h.name] = (prof[h.name] || 0) + e; if (e > (prof['max:' + h.name] || 0)) prof['max:' + h.name] = e; } }
      catch (e) { if (h.errs++ < 3) console.error('[af] tick ' + h.name + ' threw:', e); if (h.errs === 3) AF.errors.push({ part: 'tick:' + h.name, msg: String(e && e.stack || e) }); }
    }
    { let t0 = 0; if (prof) { t0 = performance.now(); R.info.autoReset = false; R.info.reset(); } try { AF.renderFrame(); } catch (e) { AF.warnOnce('render threw', e); } if (prof) { const e = performance.now() - t0; prof.render = (prof.render || 0) + e; prof.frames = (prof.frames || 0) + 1; prof.calls = R.info.render.calls; prof.tris = R.info.render.triangles; if (e > 22) (prof.rs = prof.rs || []).push([Math.round(e), R.info.programs.length, AF.world.group.children.length, R.info.memory.geometries, R.info.memory.textures]); } }
    AF.input.endFrame();
  };
  AF.frame = frame;
  let lastTick = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!AF.ready || AF.paused) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000); last = now; lastTick = now;
    fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { AF.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
    // slow motion beats (AF.slowmo): the whole world runs at AF.timeScale, eased back to 1
    if (slow.t > 0) { slow.t -= dt; const k = slow.t <= 0 ? 0 : Math.min(1, slow.t / 0.45); AF.timeScale = 1 + (slow.scale - 1) * k * k * (3 - 2 * k); } else AF.timeScale = 1;
    AF.realDt = dt; frame(dt * AF.timeScale * (AF.cine && AF.cine.active ? AF.cine.scale : 1));
  };
  requestAnimationFrame(loop);
  // hidden-tab pump (the Claude browser pane never fires rAF). Only runs while hidden.
  {
    const MC = new MessageChannel(); let pumping = false;
    MC.port1.onmessage = () => {
      if (!document.hidden || AF.SHOT) { pumping = false; return; }
      const n = performance.now();
      if (AF.ready && !AF.paused && n - lastTick > 17) { const dt = Math.min(0.1, (n - lastTick) / 1000); lastTick = n; last = n; frame(dt); }
      MC.port2.postMessage(0);
    };
    const kick = () => { if (document.hidden && !pumping && !AF.SHOT) { pumping = true; MC.port2.postMessage(0); } };
    document.addEventListener('visibilitychange', kick); kick();
  }
  // deterministic stepping for tests / headless shots
  AF.step = (n = 1, dt = 1 / 60) => { const was = AF.paused; AF.paused = true; for (let i = 0; i < n; i++) frame(dt); AF.paused = was; return AF.clock.frame; };
  // same, without drawing (fast: for tests that only need the simulation)
  AF.stepSim = (n = 1, dt = 1 / 60) => { const was = AF.paused, rf = AF.renderFrame; AF.paused = true; AF.renderFrame = () => {}; try { for (let i = 0; i < n; i++) frame(dt); } finally { AF.renderFrame = rf; AF.paused = was; } return AF.clock.frame; };
  AF.pause = () => { AF.paused = true; };
  AF.resume = () => { AF.paused = false; };
  AF.capture = () => { AF.renderFrame(); return cv.toDataURL('image/png'); };

  // yield between boot stages (setTimeout is clamped to 1 s in hidden tabs)
  AF.yield = () => new Promise((res) => { if (document.hidden) { const mc = new MessageChannel(); mc.port1.onmessage = () => res(); mc.port2.postMessage(0); } else setTimeout(res, 0); });

  window.__af = AF;
}

// ---------------------------------------------------------------- dynamic small-object distance cull (coordinator)
// Small moving meshes (people parts, animals, car bodies, props) beyond AF.CULL.dist are moved to layer 31 (not rendered by
// the camera or the shadow map); beyond AF.CULL.shadow they stop casting shadows. Owners' own .visible toggles still work.
{
  AF.CULL = { dist: 280, shadow: 110, radius: 3.5, list: [], frame: 0, stats: { managed: 0, culled: 0, noShadow: 0 } };
  const C = AF.CULL, v = new THREE.Vector3();
  const skipNames = new Set(['world', 'sky', 'clouds', 'land-horizon']);
  const collect = () => {
    C.list.length = 0;
    for (const top of AF.scene.children) {
      if (skipNames.has(top.name) || top.isLight || top.isCamera) continue;
      top.traverse((o) => {
        if (!(o.isMesh) || o.isInstancedMesh || o.frustumCulled === false || !o.geometry || o.userData.noCull) return;
        const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
        const s = o.matrixWorld.elements; const sc = Math.max(Math.hypot(s[0], s[1], s[2]), Math.hypot(s[8], s[9], s[10]));
        if (!g.boundingSphere || g.boundingSphere.radius * sc > C.radius) return;
        if (o.userData.afCast === undefined) o.userData.afCast = o.castShadow;
        C.list.push(o);
      });
    }
    C.stats.managed = C.list.length;
  };
  AF.onTick('dyn-cull', 885, () => {
    if (!AF.ready) return;
    if (C.frame++ % 90 === 0) collect();
    const cp = AF.camera.position; let culled = 0, ns = 0;
    const L = C.list, n = L.length, part = 3, k = C.frame % part;
    for (let i = k; i < n; i += part) {
      const o = L[i]; v.setFromMatrixPosition(o.matrixWorld);
      const d = v.distanceTo(cp);
      if (d > C.dist) { if (!o.userData.afCulled) { o.userData.afCulled = true; o.layers.set(31); } culled++; }
      else if (o.userData.afCulled) { o.userData.afCulled = false; o.layers.set(0); }
      const cast = o.userData.afCast && d < C.shadow;
      if (o.castShadow !== cast) o.castShadow = cast;
      if (!cast) ns++;
    }
    C.stats.culled = culled * part; C.stats.noShadow = ns * part;
  });
}
