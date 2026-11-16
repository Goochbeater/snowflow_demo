// ===== 09-kit (voxel-destruction add-on): a material-tagged palette (AF.DK, merged into AF.K) + instanced burnable flags =====
// Every colour here carries its material (stone, wood, thatch, cloth, leaf, metal, glass, earth, tile, plaster, explosive).
// In your own parts ALWAYS pass a material with AF.col(0xRRGGBB, { mat: 'wood' }) — that is what decides how it burns and breaks.
// AF.K.<name> is a palette index. Every colour here already carries its material. Make your own extra colours with
// AF.col(0xRRGGBB, { mat: '...' , jitter, edge }) — ALWAYS pass mat.
{
  const c = (hex, mat, o = {}) => AF.col(hex, Object.assign({ mat }, o));
  AF.DK = {
    // city stone (warm honey-grey limestone) — walls, towers, castle
    wall: c(0xa59a86, 'stone', { jitter: 0.85, edge: 0.75 }), wallDark: c(0x8a8070, 'stone', { jitter: 0.85, edge: 0.75 }), wallLight: c(0xbdb29c, 'stone', { jitter: 0.7, edge: 0.7 }),
    wallMoss: c(0x7f8566, 'stone', { jitter: 0.9, edge: 0.6 }), ashlar: c(0xc9bfa9, 'stone', { jitter: 0.45, edge: 0.6 }), granite: c(0x77756f, 'stone', { jitter: 0.8, edge: 0.7 }),
    rock: c(0x6f6a62, 'stone', { jitter: 0.95, edge: 0.5 }), rockDark: c(0x55514c, 'stone', { jitter: 0.95, edge: 0.5 }), rockWarm: c(0x857a68, 'stone', { jitter: 0.9, edge: 0.5 }),
    cobble: c(0x7d776d, 'stone', { jitter: 0.9, edge: 0.75 }), cobbleDark: c(0x66615a, 'stone', { jitter: 0.9, edge: 0.75 }), flag: c(0x9a9488, 'stone', { jitter: 0.5, edge: 0.6 }),
    brick: c(0x9c5a40, 'stone', { jitter: 0.8, edge: 0.7 }), brickDark: c(0x7c4532, 'stone', { jitter: 0.8, edge: 0.7 }), marble: c(0xe4dfd2, 'stone', { jitter: 0.2, edge: 0.3 }),
    // timber
    oak: c(0x4a3322, 'wood', { jitter: 0.7 }), oakDark: c(0x33241a, 'wood', { jitter: 0.6 }), plank: c(0x7a5733, 'wood', { jitter: 0.8 }), plankLight: c(0x9b7445, 'wood', { jitter: 0.8 }),
    pine: c(0xb08a55, 'wood', { jitter: 0.7 }), driftwood: c(0x8b8273, 'wood', { jitter: 0.8 }), tarred: c(0x2e2823, 'wood', { jitter: 0.5 }), hull: c(0x5b3d26, 'wood', { jitter: 0.7 }),
    // infill + plaster
    daub: c(0xe6d9b8, 'plaster', { jitter: 0.35, edge: 0.25 }), daubWarm: c(0xdcc59a, 'plaster', { jitter: 0.4, edge: 0.25 }), daubGrey: c(0xc9c2b2, 'plaster', { jitter: 0.4, edge: 0.25 }),
    daubPink: c(0xd9b29c, 'plaster', { jitter: 0.4, edge: 0.25 }), daubOchre: c(0xcfa55c, 'plaster', { jitter: 0.4, edge: 0.25 }), lime: c(0xf0ead8, 'plaster', { jitter: 0.25, edge: 0.2 }),
    // roofs
    thatch: c(0xc2a15a, 'thatch', { jitter: 0.95, edge: 0.35 }), thatchOld: c(0x9a8552, 'thatch', { jitter: 0.95, edge: 0.35 }), thatchMoss: c(0x86884f, 'thatch', { jitter: 0.95, edge: 0.35 }),
    tile: c(0xb5553a, 'tile', { jitter: 0.8, edge: 0.6 }), tileDark: c(0x94442f, 'tile', { jitter: 0.8, edge: 0.6 }), tileOld: c(0xa66a4c, 'tile', { jitter: 0.85, edge: 0.6 }),
    slate: c(0x4f5a66, 'tile', { jitter: 0.7, edge: 0.6 }), slateDark: c(0x3d4650, 'tile', { jitter: 0.7, edge: 0.6 }), shingle: c(0x6b5540, 'wood', { jitter: 0.85, edge: 0.6 }),
    lead: c(0x7d8790, 'metal', { jitter: 0.3, edge: 0.4 }), copperGreen: c(0x5fa08a, 'metal', { jitter: 0.4, edge: 0.4 }),
    // cloth (burns): royal crimson + gold, harbour blue, market stripes
    crimson: c(0xa3202a, 'cloth', { jitter: 0.25, edge: 0.2 }), gold: c(0xe0b03a, 'cloth', { jitter: 0.25, edge: 0.2 }), royalBlue: c(0x2c4f9a, 'cloth', { jitter: 0.25, edge: 0.2 }),
    seaGreen: c(0x2f8a6f, 'cloth', { jitter: 0.25, edge: 0.2 }), sail: c(0xe9dfc4, 'cloth', { jitter: 0.3, edge: 0.15 }), sailOld: c(0xc9bb98, 'cloth', { jitter: 0.4, edge: 0.15 }),
    canvas: c(0xcdb98a, 'cloth', { jitter: 0.4, edge: 0.2 }), awnRed: c(0xc0453a, 'cloth', { jitter: 0.3, edge: 0.2 }), awnBlue: c(0x3f6fae, 'cloth', { jitter: 0.3, edge: 0.2 }),
    awnGreen: c(0x4f8f4a, 'cloth', { jitter: 0.3, edge: 0.2 }), awnYellow: c(0xe3b84a, 'cloth', { jitter: 0.3, edge: 0.2 }), rope: c(0xa89468, 'cloth', { jitter: 0.6, edge: 0.3 }),
    // straw + hay + crops
    hay: c(0xd9b85a, 'thatch', { jitter: 0.9, edge: 0.3 }), straw: c(0xcfb46a, 'thatch', { jitter: 0.9, edge: 0.3 }), wheat: c(0xd8b24c, 'thatch', { jitter: 0.95, edge: 0.2, solid: false }),
    // plants
    leaf: c(0x4f7f3a, 'leaf', { jitter: 0.95, edge: 0.3 }), leafDark: c(0x36602f, 'leaf', { jitter: 0.95, edge: 0.3 }), leafLight: c(0x7da04a, 'leaf', { jitter: 0.95, edge: 0.3 }),
    leafAutumn: c(0xc7862f, 'leaf', { jitter: 0.95, edge: 0.3 }), hedge: c(0x3f6a35, 'leaf', { jitter: 0.9, edge: 0.3 }), ivy: c(0x3c6b3a, 'leaf', { jitter: 0.9, edge: 0.3 }), bark: c(0x4d3a2a, 'wood', { jitter: 0.8 }),
    grass: c(0x6f9a3e, 'earth', { jitter: 0.9 }), grassDry: c(0x9a9a4e, 'earth', { jitter: 0.9 }), dirt: c(0x7a5634, 'earth', { jitter: 0.8 }), mud: c(0x5a4630, 'earth', { jitter: 0.8 }), sand: c(0xd8c48e, 'earth', { jitter: 0.6 }),
    // metal
    iron: c(0x3d3f44, 'metal', { jitter: 0.4, edge: 0.5 }), steel: c(0x8b9198, 'metal', { jitter: 0.3, edge: 0.5 }), bronze: c(0x9a6c33, 'metal', { jitter: 0.35, edge: 0.5 }), brass: c(0xc79a3f, 'metal', { jitter: 0.3, edge: 0.4 }), goldMetal: c(0xe4bb44, 'metal', { jitter: 0.2, edge: 0.4 }),
    // light + fire that is part of the scenery
    torch: c(0xffb347, 'wood', { emit: 0xff9a3a, emitK: 3.2, mode: 'always', jitter: 0, edge: 0 }), ember: c(0xff7a2a, 'stone', { emit: 0xff5a18, emitK: 2.6, mode: 'always', jitter: 0.3, edge: 0 }),
    candle: c(0xfff0c0, 'glass', { emit: 0xffd27a, emitK: 2.4, mode: 'always', jitter: 0, edge: 0 }), windowWarm: c(0x3b3a36, 'glass', { emit: 0xffb85a, emitK: 1.5, mode: 'night', jitter: 0.15, edge: 0.15 }),
    windowDim: c(0x30323a, 'glass', { emit: 0xd98a3a, emitK: 0.8, mode: 'night', jitter: 0.15, edge: 0.15 }), windowDark: c(0x2a2e36, 'glass', { jitter: 0.15, edge: 0.15 }),
    stainedRed: c(0xb8323a, 'glass', { emit: 0xff5a5a, emitK: 0.9, mode: 'night', jitter: 0.1, edge: 0.3 }), stainedBlue: c(0x2f55b0, 'glass', { emit: 0x5a8aff, emitK: 0.9, mode: 'night', jitter: 0.1, edge: 0.3 }),
    stainedGold: c(0xd9a83a, 'glass', { emit: 0xffd25a, emitK: 0.9, mode: 'night', jitter: 0.1, edge: 0.3 }), stainedGreen: c(0x2f8f4f, 'glass', { emit: 0x5aff8a, emitK: 0.8, mode: 'night', jitter: 0.1, edge: 0.3 }),
    // things that go bang
    powder: c(0x3a2f2a, 'explosive', { jitter: 0.5, edge: 0.6 }), pitch: c(0x1d1a18, 'explosive', { jitter: 0.3, edge: 0.4 }), oilBarrel: c(0x5c3a22, 'explosive', { jitter: 0.6, edge: 0.7 }),
  };
  // the add-on palette is AF.DK; it is also merged under AF.K (a world's own AF.K names always win)
  AF.K = Object.assign({}, AF.DK, AF.K || {});
}

// ---- base ground (order 90): a flat, correct-height stand-in so every part has ground under it from the first minute.
// The land agent's real terrain (order 100) replaces it but keeps the same levels inside the walls and on the crag plateau.

// ---- flags, banners and pennants: ONE instanced draw call for the whole world, all flying in the same wind, and they burn.
// AF.kit.flag(x, y, z, { w: 2.4, h: 1.4, c1: 0xa3202a, c2: 0xe0b03a, kind: 'flag' | 'banner' | 'pennant', yaw })
//   (x,y,z) = top of the hoist (where the cloth meets the pole). flag/pennant fly downwind from the pole; a banner hangs down from a
//   horizontal bar and faces `yaw`. c2 is a stripe/border colour. Returns a handle {dead}. The pole is yours to build (voxels).
{
  const MAXF = 3200, flags = [];
  let mesh = null, n = 0, moved = false;
  const geo = new THREE.PlaneGeometry(1, 1, 8, 4); geo.translate(0.5, -0.5, 0);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, lights: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uWind: { value: new THREE.Vector2(0.6, -0.35) }, uSun: { value: new THREE.Color(1, 1, 1) }, uAmb: { value: 0.5 } }]),
    vertexShader: `
      attribute vec4 aA; attribute vec4 aB; attribute vec3 aC1; attribute vec3 aC2;
      uniform float uT; uniform vec2 uWind; varying vec2 vUv; varying vec3 vC1; varying vec3 vC2; varying float vSh; varying float vKind;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vC1 = aC1; vC2 = aC2; vKind = aB.z;
        vec2 wd = normalize(uWind);
        float ph = aA.x * 0.37 + aA.z * 0.53, t = uT * (2.6 + fract(ph) * 1.2) + ph;
        vec3 p;
        if (aB.z < 1.5) { // flag / pennant: along the wind
          float u = position.x, v = position.y;
          float wave = sin(u * 5.5 - t * 2.4) * 0.16 * u + sin(u * 9.0 - t * 3.7 + 1.3) * 0.05 * u;
          float droop = u * u * 0.22 * (1.0 - min(1.0, length(uWind) * 1.2));
          vec3 along = vec3(wd.x, 0.0, wd.y), side = vec3(-wd.y, 0.0, wd.x);
          float hh = aB.z > 0.5 ? mix(1.0, 0.06, u) : 1.0;   // pennant tapers
          p = aA.xyz + along * (u * aB.x) + vec3(0.0, (v * hh - (1.0 - hh) * 0.5) * aB.y - droop * aB.x, 0.0) + side * wave * aB.x;
          vSh = 0.82 + 0.3 * cos(u * 5.5 - t * 2.4);
        } else { // banner: hangs from a bar, faces yaw
          float u = position.x - 0.5, v = -position.y;
          float sway = sin(t * 0.9 + v * 2.2) * 0.07 * v;
          vec3 right = vec3(cos(aA.w), 0.0, -sin(aA.w)), fwd = vec3(sin(aA.w), 0.0, cos(aA.w));
          p = aA.xyz + right * (u * aB.x) + vec3(0.0, -v * aB.y, 0.0) + fwd * sway * aB.y;
          vSh = 0.9 + 0.2 * sin(t * 0.9 + v * 2.2 + 1.0);
        }
        p = mix(aA.xyz, p, aB.w);    // aB.w = 0 hides it
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 uSun; uniform float uAmb; varying vec2 vUv; varying vec3 vC1; varying vec3 vC2; varying float vSh; varying float vKind;
      #include <fog_pars_fragment>
      void main() {
        vec2 g = floor(vUv * vec2(10.0, 6.0));
        float border = (vKind > 1.5) ? step(vUv.y, 0.12) + step(0.42, vUv.x) * step(vUv.x, 0.58) * step(0.3, vUv.y) * step(vUv.y, 0.8) : step(0.38, vUv.y) * step(vUv.y, 0.62);
        vec3 c = mix(vC1, vC2, clamp(border, 0.0, 1.0));
        if (vKind > 1.5 && vUv.y > 0.93 && fract(vUv.x * 4.0) > 0.5) discard;   // dagged lower edge
        float j = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
        c *= (0.94 + 0.08 * j) * vSh;
        gl_FragColor = vec4(c * (uSun * 0.75 + uAmb), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const A = new Float32Array(MAXF * 4), B = new Float32Array(MAXF * 4), C1 = new Float32Array(MAXF * 3), C2 = new Float32Array(MAXF * 3);
  AF.kit = AF.kit || {};
  AF.kit.flags = flags;
  AF.kit.flag = (x, y, z, o = {}) => {
    if (n >= MAXF) return { dead: true };
    const i = n++, kind = o.kind === 'banner' ? 2 : o.kind === 'pennant' ? 1 : 0;
    A[i * 4] = x; A[i * 4 + 1] = y; A[i * 4 + 2] = z; A[i * 4 + 3] = o.yaw || 0;
    B[i * 4] = o.w ?? (kind === 2 ? 1.2 : 2.4); B[i * 4 + 1] = o.h ?? (kind === 2 ? 3 : 1.4); B[i * 4 + 2] = kind; B[i * 4 + 3] = 1;
    const c1 = new THREE.Color(o.c1 ?? 0xa3202a), c2 = new THREE.Color(o.c2 ?? o.c1 ?? 0xe0b03a);
    C1.set([c1.r, c1.g, c1.b], i * 3); C2.set([c2.r, c2.g, c2.b], i * 3);
    const f = { i, x, y, z, dead: false, ship: null };
    f.move = (nx, ny, nz) => { f.x = nx; f.y = ny; f.z = nz; A[i * 4] = nx; A[i * 4 + 1] = ny; A[i * 4 + 2] = nz; moved = true; };
    f.kill = (burn) => { if (f.dead) return; f.dead = true; B[i * 4 + 3] = 0; if (mesh) mesh.geometry.attributes.aB.needsUpdate = true; if (burn && AF.fx.embers) AF.fx.embers(x, y - 0.5, z, { n: 10 }); };
    flags.push(f);
    if (mesh) { for (const k of ['aA', 'aB', 'aC1', 'aC2']) mesh.geometry.attributes[k].needsUpdate = true; mesh.geometry.instanceCount = n; }
    return f;
  };
  AF.onBuild('flags', 610, () => {
    const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; g.attributes.position = geo.attributes.position; g.attributes.uv = geo.attributes.uv;
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
    g.setAttribute('aC1', new THREE.InstancedBufferAttribute(C1, 3)); g.setAttribute('aC2', new THREE.InstancedBufferAttribute(C2, 3));
    g.instanceCount = n;
    mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'flags'; AF.scene.add(mesh);
  });
  let scan = 0;
  AF.onTick('flags', 705, (dt, t) => {
    mat.uniforms.uT.value = t;
    if (AF.fire && AF.fire.wind) mat.uniforms.uWind.value.set(AF.fire.wind.x, AF.fire.wind.z);
    const night = AF.time.night; mat.uniforms.uAmb.value = 0.5 - 0.3 * night; mat.uniforms.uSun.value.copy(AF.sun.color).multiplyScalar(Math.min(1, AF.sun.intensity / 2.6) * (1 - 0.6 * night));
    if (moved && mesh) { mesh.geometry.attributes.aA.needsUpdate = true; moved = false; }
    for (let k = 0; k < 12 && flags.length; k++) { const f = flags[scan++ % flags.length]; if (f.dead || f.ship) continue; if (!AF.supported(f.x, f.y - 0.3, f.z)) f.kill(false); else if (AF.fire.burningAt(f.x, f.y - 0.5, f.z, 1.6)) f.kill(true); }
  });
  AF.on('boom', (e) => { for (const f of flags) if (!f.dead && Math.hypot(f.x - e.x, f.y - e.y, f.z - e.z) < e.r * 1.5) f.kill(true); });
}
