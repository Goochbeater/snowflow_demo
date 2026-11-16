// ===== 60-sky: day & night, the sky dome, moon, stars + constellations, lamp glows, clouds, smoke, sails =====
{
  const G = AF.G, P = AF.PLAN, V3 = THREE.Vector3, sm = AF.smooth;
  AF.atmos = { fireScreenRaw: 0 };
  { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.13)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); G.glowTex = new THREE.CanvasTexture(cv); }
  // hour: [sunColour, sunI, hemiSky, hemiGround, hemiI, ambI, skyTop, skyHorizon, fogNear, fogFar]
  const KEY = [
    [0, 0x9ab0ff, 0.7, 0x4a60b8, 0x24304e, 1.3, 0.42, 0x060920, 0x1a2452, 70, 430],
    [4.8, 0x9ab0ff, 0.7, 0x4a60b8, 0x24304e, 1.3, 0.42, 0x060920, 0x1a2452, 70, 430],
    [6.0, 0xffa878, 1.1, 0x9a9ad8, 0x5a4a48, 0.85, 0.3, 0x35489a, 0xffa888, 80, 460],
    [7.6, 0xfff0d0, 2.2, 0xcfe3ff, 0x6b6a3e, 1.0, 0.34, 0x4a8ae0, 0xc4e2f4, 110, 560],
    [13, 0xfff6e4, 2.6, 0xcfe3ff, 0x6b6a3e, 1.08, 0.36, 0x3f86e6, 0xc8e6f6, 120, 600],
    [16.8, 0xffdfae, 2.4, 0xd8dcf0, 0x6b5a3e, 1.0, 0.34, 0x4a80d0, 0xffdcae, 110, 560],
    [18.8, 0xff8c52, 1.5, 0xb492c4, 0x5a4244, 0.85, 0.3, 0x38327c, 0xff9466, 90, 480],
    [20.0, 0x9a8cd8, 0.5, 0x5a5aa8, 0x2a2a44, 0.85, 0.3, 0x15183e, 0x5a3c72, 75, 440],
    [21.2, 0x9ab0ff, 0.7, 0x4a60b8, 0x24304e, 1.3, 0.42, 0x060920, 0x1a2452, 70, 430],
    [24, 0x9ab0ff, 0.7, 0x4a60b8, 0x24304e, 1.3, 0.42, 0x060920, 0x1a2452, 70, 430],
  ];
  const ca = new THREE.Color(), cb = new THREE.Color();
  const kc = (i, t, h, out) => { let k = 0; while (k < KEY.length - 2 && KEY[k + 1][0] <= h) k++; const a = KEY[k], b = KEY[k + 1], f = AF.clamp((h - a[0]) / (b[0] - a[0]), 0, 1); if (t) return out.set(a[i]).lerp(cb.set(b[i]), f); return a[i] + (b[i] - a[i]) * f; };
  const U = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new V3(0, 1, 0) }, uMoon: { value: new V3(0, 1, 0) }, uSunC: { value: new THREE.Color() }, uNight: { value: 0 }, uTime: { value: 0 }, uAurora: { value: 0 } };
  const starU = { uT: { value: 0 }, uA: { value: 0 }, uPx: { value: 1 } };
  const lineU = { uVis: { value: new Float32Array(12) }, uA: { value: 0 } };
  const glowU = { uNight: { value: 0 }, uPx: { value: 1 }, uT: { value: 0 }, uTex: { value: null } };
  const sunDir = new V3(), moonDir = new V3();
  // ---------------- constellations (degrees from the pole, azimuth; stars as tangent-plane offsets)
  const CON = [
    { id: 'lantern', name: 'The Lantern', lore: 'The first light hung in the dark, so the stars could find their way home.', c: [16, 20], s: [[0, 4], [-2.5, 1], [2.5, 1], [0, -2.5], [0, 6.5]], l: [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4]] },
    { id: 'fairy', name: 'The Little Fairy', lore: 'Small as a thimble, bright as a bell. Sailors wish on her wingtips.', c: [30, 95], s: [[0, 0], [0, 3], [-4, 4], [-3, -1], [4, 4], [3, -1], [0, -4]], l: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [2, 3], [4, 5]] },
    { id: 'dragon', name: 'The Sleeping Dragon', lore: 'She curled round the world to keep it warm, and has not woken since.', c: [38, 160], s: [[-8, 0], [-5, 2], [-2, 1], [1, 2.5], [4, 1], [6, -1], [4, -3], [7, -4.5]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]] },
    { id: 'kettle', name: 'The Kettle', lore: 'When it tips toward the hills, the baker says, rain by Tuesday.', c: [24, 215], s: [[-3, -2], [3, -2], [3.5, 1.5], [-3.5, 1.5], [0, 3.5], [6, 0.5]], l: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [3, 4], [2, 5]] },
    { id: 'cat', name: 'The Cat', lore: 'She watches the Fisher\'s Hook every night. One day she will pounce.', c: [40, 265], s: [[-3, -3], [-3, 1], [-4.5, 3.5], [-1.5, 2.4], [1, 0], [4, -0.5], [5.5, 2.5], [3, -3]], l: [[0, 1], [1, 2], [2, 3], [3, 1], [1, 4], [4, 5], [5, 6], [5, 7], [7, 0]] },
    { id: 'oak', name: 'The Great Oak', lore: 'Its roots are the roads of Moonwick; its acorns, every lit window.', c: [12, 300], s: [[0, -5], [0, -1], [-3, 2], [3, 2], [0, 5], [-5, 4], [5, 4]], l: [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [3, 6]] },
    { id: 'key', name: 'The Key', lore: 'Nobody knows what it opens. The wizard says: "Tomorrow."', c: [44, 330], s: [[-5, 0], [-1, 0], [2, 0], [4, 2], [6, 0], [4, -2], [-4, -1.6], [-2.5, -1.6]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2], [0, 6], [1, 7]] },
    { id: 'crown', name: 'The Crown of Moths', lore: 'Seven moths who loved the moon so dearly that she let them stay.', c: [42, 55], s: [[-5, -1], [-3, 2], [-1, -0.5], [0, 3], [1, -0.5], [3, 2], [5, -1]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]] },
    { id: 'hook', name: 'The Fisher\'s Hook', lore: 'Old Fen swears he caught it once, and threw it back.', c: [46, 240], s: [[0, 6], [0, 2], [0, -2], [1.5, -4.5], [4, -4.5], [5, -2]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
    { id: 'hat', name: 'The Wizard\'s Hat', lore: 'Crooked at the tip, like the real one. It points to the Spire at midnight.', c: [27, 125], s: [[-5, -3], [5, -3], [2, -1], [0.5, 5], [-2, -1]], l: [[0, 1], [0, 4], [4, 3], [3, 2], [2, 1], [4, 2]] },
  ];
  G.CON = CON;
  const D2R = Math.PI / 180;
  const polar = (th, ph) => new V3(Math.sin(th * D2R) * Math.cos(ph * D2R), Math.cos(th * D2R), Math.sin(th * D2R) * Math.sin(ph * D2R));
  const starGroup = new THREE.Group(); starGroup.name = 'sky';
  const POLE = new V3(0, Math.sin(52 * D2R), Math.cos(52 * D2R)).normalize(), qBase = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), POLE), qRot = new THREE.Quaternion();
  AF.onBuild('sky', 700, () => {
    const S = AF.scene, cam = AF.camera;
    cam.far = 2600; cam.updateProjectionMatrix();
    // dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2200, 32, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w * 0.9999; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uTop, uHor, uSun, uMoon, uSunC; uniform float uNight, uTime, uAurora;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
        void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.0);
          vec3 c = mix(uHor, uTop, pow(y, 0.55)); if (d.y < 0.0) c = mix(uHor, uHor * 0.75, min(1.0, -d.y * 4.0));
          float sd = max(dot(d, uSun), 0.0); c += uSunC * (pow(sd, 6.0) * 0.22 + pow(sd, 60.0) * 0.5) * (1.0 - uNight); c = mix(c, vec3(1.0, 0.97, 0.86) * 1.6, smoothstep(0.9993, 0.9996, sd) * (1.0 - uNight));
          float md = dot(d, uMoon); float disc = smoothstep(0.9985, 0.9989, md);
          vec3 q = d - uMoon * md; vec2 mp = vec2(dot(q, normalize(cross(uMoon, vec3(0.0, 1.0, 0.0)))), q.y) * 60.0;
          float crat = 0.82 + 0.18 * n2(mp * 2.2 + 3.0) - 0.16 * smoothstep(0.45, 0.6, n2(mp * 1.1));
          float ph = smoothstep(-0.2, 0.35, mp.x * 0.5 + 0.55 + sqrt(max(0.0, 1.0 - mp.y * mp.y * 0.34)) * 0.4);
          c += vec3(0.55, 0.62, 0.9) * (pow(max(md, 0.0), 300.0) * 0.5 + pow(max(md, 0.0), 30.0) * 0.12) * uNight;
          c = mix(c, vec3(1.0, 0.98, 0.9) * crat * (0.35 + 0.75 * ph), disc * max(uNight, 0.25));
          // milky band + aurora
          float band = exp(-pow((d.x * 0.6 + d.z * 0.5 - d.y * 0.35) * 3.2, 2.0)) * n2(d.xz * 7.0 + d.y * 5.0); c += vec3(0.16, 0.18, 0.34) * band * uNight * smoothstep(0.0, 0.3, d.y);
          if (uAurora > 0.001) { float a = atan(d.z, d.x); float w = sin(a * 5.0 + uTime * 0.35 + n2(vec2(a * 3.0, uTime * 0.1)) * 4.0) * 0.5 + 0.5; float cur = smoothstep(0.12, 0.3, d.y) * (1.0 - smoothstep(0.35, 0.85, d.y)) * pow(w, 2.0);
            float ray = 0.6 + 0.4 * sin(a * 70.0 + uTime * 1.3 + d.y * 9.0); c += mix(vec3(0.2, 1.0, 0.6), vec3(0.7, 0.4, 1.0), smoothstep(0.2, 0.7, d.y)) * cur * ray * uAurora * 0.85; }
          gl_FragColor = vec4(c, 1.0); }` }));
    dome.name = 'sky'; dome.frustumCulled = false; dome.renderOrder = -20; S.add(dome); G.dome = dome;
    // stars
    const rr = AF.rng(909), pos = [], siz = [], phs = [], col = [], lpos = [], lci = [];
    const push = (v, s, cc) => { pos.push(v.x * 2000, v.y * 2000, v.z * 2000); siz.push(s); phs.push(rr() * 6.283); col.push(cc[0], cc[1], cc[2]); };
    for (let i = 0; i < 2400; i++) { const u = rr() * 2 - 1, a = rr() * 6.283, s = Math.sqrt(1 - u * u), m = Math.pow(rr(), 6); const t = rr(); push(new V3(s * Math.cos(a), u, s * Math.sin(a)), 1.7 + m * 4.6, t < 0.15 ? [1, 0.82, 0.7] : t < 0.3 ? [0.75, 0.85, 1] : [1, 1, 1]); }
    CON.forEach((cn, ci) => { const cdir = polar(cn.c[0], cn.c[1]), up = new V3(0, 1, 0), e1 = new V3().crossVectors(up, cdir).normalize(), e2 = new V3().crossVectors(cdir, e1).normalize(); cn.dir = cdir; cn.pts = cn.s.map((p) => cdir.clone().addScaledVector(e1, Math.tan(p[0] * 1.25 * D2R)).addScaledVector(e2, Math.tan(p[1] * 1.25 * D2R)).normalize());
      cn.pts.forEach((v, j) => push(v, 6.5 + (j % 3) * 1.1, [1, 0.96, 0.8])); for (const [a, b] of cn.l) { const A = cn.pts[a], B = cn.pts[b]; lpos.push(A.x * 1990, A.y * 1990, A.z * 1990, B.x * 1990, B.y * 1990, B.z * 1990); lci.push(ci, ci); } });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('aS', new THREE.Float32BufferAttribute(siz, 1)); sg.setAttribute('aP', new THREE.Float32BufferAttribute(phs, 1)); sg.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3));
    const stars = new THREE.Points(sg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: starU,
      vertexShader: 'attribute float aS, aP; attribute vec3 aC; uniform float uT, uPx; varying vec3 vC; varying float vA; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vA = (0.72 + 0.28 * sin(uT * (1.2 + fract(aP) * 2.0) + aP)) * smoothstep(-40.0, 260.0, wp.y); vC = aC; gl_PointSize = aS * uPx; gl_Position = projectionMatrix * viewMatrix * wp; gl_Position.z = gl_Position.w * 0.9998; }',
      fragmentShader: 'uniform float uA; varying vec3 vC; varying float vA; void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p); float a = 1.0 - smoothstep(0.0, 0.5, d); a = a * a + (1.0 - smoothstep(0.0, 0.5, min(abs(p.x), abs(p.y)) * 6.0 + d)) * 0.6; gl_FragColor = vec4(vC * a * vA * uA, 1.0); }' }));
    stars.frustumCulled = false; stars.renderOrder = -19;
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3)); lg.setAttribute('aI', new THREE.Float32BufferAttribute(lci, 1));
    const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: lineU,
      vertexShader: 'attribute float aI; uniform float uVis[12]; varying float vV; void main(){ vV = uVis[int(aI + 0.5)]; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.9998; }',
      fragmentShader: 'uniform float uA; varying float vV; void main(){ gl_FragColor = vec4(vec3(0.75, 0.88, 1.0) * vV * uA, 1.0); }' }));
    lines.frustumCulled = false; lines.renderOrder = -19;
    starGroup.add(stars, lines); S.add(starGroup);
    // shooting star
    const ssG = new THREE.BufferGeometry(); ssG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3)); ssG.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 0, 0, 0], 3));
    const ss = new THREE.Line(ssG, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); ss.frustumCulled = false; ss.visible = false; S.add(ss); G.shoot = { m: ss, t: 0, next: 8, a: new V3(), v: new V3() };
    // glows on every registered light
    { glowU.uTex.value = G.glowTex;
      const L = AF.lights, n = L.length, p = new Float32Array(n * 3), c3 = new Float32Array(n * 3), m = new Float32Array(n * 3), cc = new THREE.Color();
      L.forEach((l, i) => { p[i * 3] = l.x; p[i * 3 + 1] = l.y; p[i * 3 + 2] = l.z; cc.set(l.color); const k = l.kind; c3[i * 3] = cc.r; c3[i * 3 + 1] = cc.g; c3[i * 3 + 2] = cc.b; m[i * 3] = k === 'window' ? 9 : k === 'street' ? 5.5 : k === 'shroom' ? 3.4 : k === 'magic' ? 5 : k === 'fairy' ? 3.4 : k === 'pool' ? 11 : 4; m[i * 3 + 1] = (k === 'magic' || k === 'hearth' || k === 'pool') ? 0 : 1; m[i * 3 + 2] = AF.hash2(i, 7); });
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(p, 3)); gg.setAttribute('aC', new THREE.BufferAttribute(c3, 3)); gg.setAttribute('aM', new THREE.BufferAttribute(m, 3));
      const pts = new THREE.Points(gg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: glowU,
        vertexShader: 'attribute vec3 aC, aM; uniform float uNight, uPx, uT; varying vec3 vC; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float on = mix(1.0, smoothstep(aM.z * 0.45 + 0.2, aM.z * 0.45 + 0.34, uNight), aM.y); float fl = 0.9 + 0.1 * sin(uT * (5.0 + aM.z * 7.0) + aM.z * 40.0); float dist = -mv.z; gl_PointSize = clamp(aM.x * uPx * 150.0 / dist, 0.0, 90.0 * uPx) * step(0.01, on); vC = aC * on * fl * (0.55 + 0.45 * uNight) * (1.0 - smoothstep(500.0, 900.0, dist)); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D uTex; varying vec3 vC; void main(){ float a = texture2D(uTex, gl_PointCoord).a; gl_FragColor = vec4(vC * a * 1.7, 1.0); }' }));
      pts.frustumCulled = false; pts.renderOrder = 5; S.add(pts); G.glowPts = pts; }
    // clouds (blocky, three.js)
    { const geos = [], cr = AF.rng(5); for (let i = 0; i < 16; i++) { const cx = (cr() - 0.5) * 1300, cz = (cr() - 0.5) * 1300, cy = 150 + cr() * 70; for (let j = 0; j < 6; j++) { const w = 26 + cr() * 34, g = new THREE.BoxGeometry(w, 7 + cr() * 7, 18 + cr() * 22); g.translate(cx + (cr() - 0.5) * 50, cy + (cr() - 0.5) * 6, cz + (cr() - 0.5) * 30); geos.push(g); } }
      const m = new THREE.Mesh(AF.addons.BGU.mergeGeometries(geos), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false })); m.name = 'clouds'; m.frustumCulled = false; S.add(m); G.clouds = m; }
    // windmill sails
    if (G.mill) { const grp = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0x6a4a30 }), cloth = new THREE.MeshLambertMaterial({ color: 0xefe6d0 }); for (let i = 0; i < 4; i++) { const b = new THREE.Group(); const sp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7.5, 0.25), wood); sp.position.y = 3.75; const sl = new THREE.Mesh(new THREE.BoxGeometry(1.7, 5.6, 0.1), cloth); sl.position.set(0.95, 4.4, 0); b.add(sp, sl); b.rotation.z = i * Math.PI / 2; grp.add(b); } const hub = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.2), wood); grp.add(hub); grp.position.set(G.mill.x, G.mill.y, G.mill.z + 0.5); grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.userData.noCull = true; } }); S.add(grp); G.sails = grp; G.windBoost = 0; }
    // the lantern's beam + halo for the finale (hidden until then)
    { const g = new THREE.CylinderGeometry(0.4, 26, 420, 20, 1, true); g.translate(0, 210, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(G.lantern.x, G.lantern.y, G.lantern.z); m.frustumCulled = false; m.userData.noCull = true; S.add(m); G.beam = m;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.glowTex, color: 0xfff0b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.scale.set(60, 60, 1); sp.position.copy(m.position); S.add(sp); G.lanternHalo = sp; }
  });
  G.sky = { U, lineU, starU, CON, starGroup, conDir: (i, out) => (out || new V3()).copy(CON[i].dir).applyQuaternion(starGroup.quaternion), aurora: 0, lit: 0 };
  // time of day
  AF.timeTick = (dt) => {
    const T = AF.time; if (!T.paused) { T.hours += dt * T.speed; if (T.hours >= 24) { T.hours -= 24; T.day++; AF.emit('newday', T.day); } }
    const h = T.hours, a = (h - 5.5) / 14 * Math.PI, el = Math.sin(a), b = ((h + 24 - 17.5) % 24) / 14 * Math.PI;
    sunDir.set(Math.cos(a) * 0.75, el * 0.8 + 0.02, -el * 0.55 - 0.18).normalize(); moonDir.set(-Math.cos(b) * 0.62, Math.sin(b) * 0.8 + 0.03, 0.55 - Math.sin(b) * 0.2).normalize();
    T.night = 1 - sm(-0.12, 0.2, el); const useSun = el > 0.03;
    T.sunDir.copy(useSun ? sunDir : (moonDir.y > 0.05 ? moonDir : sunDir.set(0.3, 0.8, 0.5).normalize()));
    const fade = useSun ? sm(0.03, 0.16, el) : sm(-0.03, -0.14, el) * 0.9 + 0.1;
    AF.sun.color.copy(kc(1, true, h, ca)); AF.sun.intensity = kc(2, false, h) * fade;
    AF.hemi.color.copy(kc(3, true, h, ca)); AF.hemi.groundColor.copy(kc(4, true, h, ca)); AF.hemi.intensity = kc(5, false, h); AF.amb.intensity = kc(6, false, h);
    U.uTop.value.copy(kc(7, true, h, ca)); U.uHor.value.copy(kc(8, true, h, ca)); U.uSun.value.copy(sunDir); U.uMoon.value.copy(moonDir); U.uSunC.value.copy(AF.sun.color); U.uNight.value = T.night;
    const fog = AF.scene.fog; fog.color.copy(U.uHor.value).lerp(ca.copy(U.uTop.value), 0.25); fog.near = kc(9, false, h); fog.far = kc(10, false, h); AF.scene.background = null; { const V = G.quality ? G.quality.view : 1e9; if (V < 1e8) { fog.far = Math.min(fog.far, V + 20); fog.near = Math.min(fog.near, V * 0.3); } if (G.mountains) { const mm = G.mountains.material; mm.fog = false; mm.color.setScalar(0.42 + 0.3 * (1 - T.night)).multiply(AF.sun.color).lerp(fog.color, 0.35); mm.emissive.copy(fog.color).multiplyScalar(0.5); } }
    const MU = AF.mat.uniforms; MU.uSkyH.value.copy(U.uHor.value); MU.uSkyZ.value.copy(U.uTop.value);
  };
  AF.onTick('sky', 700, (dt, t) => {
    const cam = AF.camera, T = AF.time, px = AF.renderer.getPixelRatio();
    U.uTime.value = t; U.uAurora.value += (G.sky.aurora - U.uAurora.value) * Math.min(1, dt * 0.6);
    if (G.dome) G.dome.position.copy(cam.position);
    starGroup.position.copy(cam.position); qRot.setFromAxisAngle(new V3(0, 1, 0), T.hours / 24 * Math.PI * 2 * 0.5 + T.day * 0.4); starGroup.quaternion.copy(qBase).multiply(qRot);
    starU.uT.value = t; starU.uA.value = sm(0.35, 0.95, T.night); starU.uPx.value = px; lineU.uA.value = starU.uA.value;
    glowU.uNight.value = T.night; glowU.uPx.value = px * (AF.renderer.domElement.height / px) / 720; glowU.uT.value = t;
    if (G.clouds) { G.clouds.position.x = ((t * 1.6 + 650) % 1300) - 650; G.clouds.material.color.copy(U.uHor.value).lerp(ca.set(0xffffff), 0.55 * (1 - T.night)).multiplyScalar(1 - T.night * 0.55); }
    if (G.sails) { G.windBoost = Math.max(0, (G.windBoost || 0) - dt * 0.4); G.sails.rotation.z -= dt * (0.5 + G.windBoost * 5); }
    // chimney smoke + waterfall mist near the camera
    if (AF.fx && Math.random() < dt * 9 && AF.chimneys.length) { const c = AF.chimneys[(Math.random() * AF.chimneys.length) | 0]; if (Math.hypot(c.x - cam.position.x, c.z - cam.position.z) < 110) AF.fx.smoke(c.x, c.y + 0.3, c.z, { n: 1, size: 1.1, dark: 0.22, rise: 1.5, life: 5, grow: 1.6, a: 0.3, spread: 0.1 }); }
    if (AF.fx && G.fall && G.fall.length && Math.hypot(P.CRAG[0] + 30 - cam.position.x, P.CRAG[1] - cam.position.z) < 120) { if (Math.random() < dt * 14) { const f = G.fall[(Math.random() * G.fall.length) | 0]; AF.fx.smoke(f.x, f.y + 0.4, f.z, { n: 1, size: 1.2, dark: 0.04, rise: 0.6, life: 1.6, grow: 1.4, a: 0.3, spread: 0.6, vel: [1.5, -0.5, 0] }); } }
    // shooting stars
    const sh = G.shoot; if (sh) { if (sh.t > 0) { sh.t -= dt; const k = 1 - sh.t / 0.9, pa = sh.m.geometry.attributes.position; const hx = sh.a.x + sh.v.x * k, hy = sh.a.y + sh.v.y * k, hz = sh.a.z + sh.v.z * k; pa.setXYZ(0, cam.position.x + hx, cam.position.y + hy, cam.position.z + hz); pa.setXYZ(1, cam.position.x + hx - sh.v.x * 0.22, cam.position.y + hy - sh.v.y * 0.22, cam.position.z + hz - sh.v.z * 0.22); pa.needsUpdate = true; sh.m.material.opacity = Math.sin(k * Math.PI); if (sh.t <= 0) sh.m.visible = false; }
      else if (T.night > 0.8) { sh.next -= dt * (1 + G.sky.aurora * 6); if (sh.next <= 0) { sh.next = 5 + Math.random() * 14; const az = Math.random() * 6.283, alt = 0.5 + Math.random() * 0.7; sh.a.set(Math.cos(az) * Math.cos(alt), Math.sin(alt), Math.sin(az) * Math.cos(alt)).multiplyScalar(1900); sh.v.set(Math.random() - 0.5, -0.35 - Math.random() * 0.3, Math.random() - 0.5).multiplyScalar(900); sh.t = 0.9; sh.m.visible = true; AF.emit('shooting-star'); } } }
    if (G.beam) { const k = G.sky.lit; G.beam.material.opacity += (k * 0.1 * (0.4 + 0.6 * T.night) - G.beam.material.opacity) * Math.min(1, dt); G.lanternHalo.material.opacity += (k * (0.35 + 0.5 * T.night) - G.lanternHalo.material.opacity) * Math.min(1, dt); G.beam.rotation.y = t * 0.1; }
  });
}
