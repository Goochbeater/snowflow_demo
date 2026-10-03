// ===================== BOOT & LOOP =====================
let lastFrameT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const cap = Settings.fps;
  if (lastFrameT && cap < 115 && now - lastFrameT < 1000 / cap - 2) return;
  const rdt = lastFrameT ? Math.min((now - lastFrameT) / 1000, 0.1) : 1 / 60;
  lastFrameT = now;
  Perf.sample(rdt);
  if (UI.contextLost) return;
  Game.update(rdt);
  const paused = Game.state === 'paused';
  Robes.update(paused ? 0 : rdt * Game.curTs);
  Cam.update(rdt);
  World.update(paused ? 0 : rdt * Game.curTs, paused ? 0 : rdt);
  FX.update(paused ? 0 : rdt * Game.curTs);
  const cam = Render.camera;
  Render.placeSun(Game.player && Cam.mode === 'fp' ? Game.player.pos : _v1.copy(cam.position).addScaledVector(_v2.set(0, 0, -1).applyQuaternion(cam.quaternion), 30));
  // sun shafts follow the sun on screen
  const fx = Render.post.fx, w = World.weather;
  _v1.copy(SHARED.uSunDirW.value).multiplyScalar(1000).add(cam.position).project(cam);
  const inFront = _v1.z < 1, edge = Math.max(Math.abs(_v1.x), Math.abs(_v1.y));
  fx.sunScreen.set(_v1.x * 0.5 + 0.5, _v1.y * 0.5 + 0.5);
  fx.shafts = (w ? w.shafts : 0) * (1 - World.nightMix) * (inFront ? smoothstep(1.6, 0.4, edge) : 0);
  fx.flare = (World.flareBase || 0) * (inFront ? smoothstep(1.05, 0.75, edge) : 0) * (Game.state === 'finisher' ? 0.4 : 1);
  HUD.update(rdt);
  Render.render();
}

(async function boot() {
  const bar = document.getElementById('loadBar'), tip = document.getElementById('loadTip');
  const progress = (p, t) => { bar.style.width = Math.round(p * 100) + '%'; if (t) tip.textContent = t; };
  try {
    Platform.init();
    if (Platform.noWebGL2) { tip.textContent = 'This game needs WebGL 2. Update Chrome or Samsung Internet and try again.'; return; }
    progress(0.05, 'Waking the castle…'); await nextFrame();
    Render.init(document.getElementById('gl'));
    progress(0.12, 'Weaving the banners…'); await nextFrame();
    await buildTextures(); SHARED.uNoise.value = Tex.noise;
    progress(0.25, 'Mowing the pitch…'); await nextFrame();
    await World.build(progress);
    progress(0.7, 'Stitching the gloves…'); await nextFrame();
    await Hands.load();
    progress(0.71, 'Fitting the robes…'); await nextFrame();
    await Humans.load();
    progress(0.72, 'Waxing the brooms…'); await nextFrame();
    Models.init(); Robes.init(); FX.init(); Game.init(); HUD.init(); Input.init(); UI.init();
    World.setWeather(Settings.weather === 'overcast' ? 'golden' : Settings.weather);
    Game.setup('demo');
    progress(0.86, 'Polishing the hoops…'); await nextFrame();
    // warm every shader up front so the first finisher never hitches
    const warm = [];
    for (const t of FX.trails) { t.mesh.visible = true; warm.push(t.mesh); }
    const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.1), Models.ghostMat); Render.scene.add(ghost);
    const lv = World.lanterns.visible, rv = World.rain.visible; World.lanterns.visible = true; World.rain.visible = true;
    Game.snitch.group.visible = true;
    Render.renderer.compile(Render.scene, Render.camera);
    Cam.update(1 / 60); Render.render();
    for (const m of warm) m.visible = false;
    Render.scene.remove(ghost); World.lanterns.visible = lv; World.rain.visible = rv; Game.snitch.group.visible = false;
    progress(1, 'Ready.'); await nextFrame();
    window.__game = { Robes, Hands, Humans, Human, RidePoses, Kits, Models, AI, Game, Finishers, Input, UI, Render, Settings, World, Cam, HUD, Perf, Sound, SaveData };
    window.__ready = true;
    requestAnimationFrame(frame);
    UI.title();
  } catch (e) {
    console.error(e);
    tip.textContent = 'Something went wrong while loading: ' + (e && e.message ? e.message : e);
    window.__err = String(e && e.stack || e);
  }
})();
