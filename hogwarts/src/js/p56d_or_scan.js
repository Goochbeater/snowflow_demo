/* ==== p56d_or_scan.js ==== */
/* OPUS RING — the scanned world: the ground, the rock and the masonry take photo-scanned surfaces (Poly Haven CC0). */
/* ------------------------------------------------------------------ ground */
(function () {
  const lim0 = TERRAIN.limMat;
  TERRAIN.limMat = function (key, o) {
    o = o || {}; const S = TEX.sets; if (!(S.grass2 && S.grass2.photo && S.mossrock && S.trail)) return lim0(key, o);
    const D = S[{ flag: 'tiles', dirt: 'trail' }[o.dirt || 'dirt'] || o.dirt] || S.trail, RK = S[o.rock || 'mossrock'] || S.dryrock;
    const m = new THREE.MeshLambertMaterial({ map: S.grass2.map, color: 0xffffff });
    const U = { tGN: { value: S.grass2.normalMap }, tM1: { value: (S.grass1 || S.grass2).map }, tM2: { value: (S.moor || S.grass2).map }, tDirt: { value: D.map }, tDirtN: { value: D.normalMap }, tCliff: { value: RK.map }, tCliffN: { value: RK.normalMap },
      uTintA: { value: new THREE.Color(o.scanTintA !== undefined ? o.scanTintA : 0xdcdcc0) }, uTintB: { value: new THREE.Color(o.scanTintB !== undefined ? o.scanTintB : 0xe4dcb8) }, uRockTint: { value: new THREE.Color(o.scanRock !== undefined ? o.scanRock : 0xb4b6b0) }, uDirtTint: { value: new THREE.Color(o.scanDirt !== undefined ? o.scanDirt : 0xd8d0bc) },
      uSc: { value: new THREE.Vector4(o.grassSc || 2.3, o.dirtSc || D.scale * 1.2, o.rockSc || 5.0, o.rockBig || 23.0) } };
    m.userData.U = U;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aBl; attribute vec3 aMac; varying vec3 vWP; varying vec3 vWN; varying vec3 vBl; varying vec3 vMac;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal); vBl = aBl; vMac = aMac;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tGN, tM1, tM2, tDirt, tDirtN, tCliff, tCliffN; uniform vec3 uTintA, uTintB, uRockTint, uDirtTint; uniform vec4 uSc; varying vec3 vWP; varying vec3 vWN; varying vec3 vBl; varying vec3 vMac;')
        .replace('#include <map_fragment>', `
          vec3 wn0 = normalize(vWN); vec3 an = abs(wn0); vec3 bw = pow(an, vec3(6.0)); bw /= (bw.x + bw.y + bw.z);
          float dCam = length(vViewPosition);
          float mac = vMac.x, mac2 = vMac.y, gPat = vMac.z;
          float slope = 1.0 - smoothstep(0.6, 0.76, wn0.y + (mac2 - 0.5) * 0.1);
          float gRock = clamp(max(slope, vBl.y), 0.0, 1.0);
          float gRoad = clamp(vBl.x, 0.0, 1.0);
          vec3 c = vec3(0.0);
          if (gRock < 0.99) {
            vec3 base = vec3(0.0);
            if (gRoad < 0.99) {
              // the turf itself up close; beyond it only the two aerial scans (moss-yellow heath and deep green) by the macro noise
              vec3 det = texture2D(map, vWP.xz / uSc.x).rgb;
              vec3 m1 = texture2D(tM1, vWP.xz / 37.0).rgb, m2 = texture2D(tM2, vWP.xz / 131.0 + 0.31).rgb;
              vec3 macro = mix(m2 * 1.25, m1 * 0.85, smoothstep(0.38, 0.62, mac + (gPat - 0.25) * 0.5));
              macro = mix(macro, vec3(dot(macro, vec3(0.3, 0.6, 0.1))) * vec3(1.06, 1.05, 0.62), 0.6);   // the heath seen from afar is grass, not soil
              float dl = dot(det, vec3(0.3, 0.6, 0.1)) / 0.36;
              det = mix(vec3(dot(det, vec3(0.3, 0.6, 0.1))), det, 0.8); macro = mix(vec3(dot(macro, vec3(0.3, 0.6, 0.1))), macro, 0.75);
              vec3 nearC = mix(det, macro * dl, 0.55);
              vec3 grassC = mix(nearC, macro, smoothstep(8.0, 70.0, dCam));
              grassC *= mix(uTintA, uTintB, smoothstep(0.3, 0.6, mac)) * (0.82 + 0.36 * mac2);
              base = grassC * (1.0 - gRoad); }
            if (gRoad > 0.01) { vec3 dc = texture2D(tDirt, vWP.xz / uSc.y).rgb; dc = mix(vec3(dot(dc, vec3(0.3, 0.6, 0.1))), dc, 0.4); base += dc * uDirtTint * (0.85 + 0.3 * mac2) * gRoad; }
            c = base * (1.0 - gRock);
          }
          if (gRock > 0.01) {
            vec3 rockC = texture2D(tCliff, vWP.zy / uSc.z).rgb * bw.x + texture2D(tCliff, vWP.xz / uSc.z).rgb * bw.y + texture2D(tCliff, vWP.xy / uSc.z).rgb * bw.z;
            rockC *= 0.6 + 1.0 * texture2D(tCliff, (bw.y > 0.5 ? vWP.xz : (bw.x > bw.z ? vWP.zy : vWP.xy)) / uSc.w + 0.37).g;
            rockC = mix(vec3(dot(rockC, vec3(0.3, 0.6, 0.1))), rockC, 0.55) * 2.3; c += rockC * uRockTint * (0.9 + 0.2 * mac) * gRock;
          }
          c *= 1.0 - vBl.z * 0.55;
          diffuseColor.rgb *= c;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          { vec3 w0 = normalize(vWN); vec3 wN2 = w0;
            if (dCam < 90.0 && gRock < 0.99) { vec3 tG = mix(texture2D(tGN, vWP.xz / uSc.x).xyz, texture2D(tDirtN, vWP.xz / uSc.y).xyz, gRoad) * 2.0 - 1.0; float nk = 0.9 * (1.0 - smoothstep(25.0, 90.0, dCam)); wN2 = normalize(vec3(w0.x + tG.x * nk, w0.y, w0.z - tG.y * nk)); }
            if (gRock > 0.01) {
              float fk = 1.0 - 0.7 * smoothstep(60.0, 220.0, dCam);
              vec3 tX = texture2D(tCliffN, vWP.zy / uSc.z).xyz * 2.0 - 1.0, tY = texture2D(tCliffN, vWP.xz / uSc.z).xyz * 2.0 - 1.0, tZ = texture2D(tCliffN, vWP.xy / uSc.z).xyz * 2.0 - 1.0;
              tX.xy *= 1.6 * fk; tZ.xy *= 1.6 * fk; tY.xy *= 1.3 * fk;
              tX = vec3(tX.xy + w0.zy, abs(tX.z) * w0.x); tY = vec3(tY.xy + w0.xz, abs(tY.z) * w0.y); tZ = vec3(tZ.xy + w0.xy, abs(tZ.z) * w0.z);
              vec3 wR = normalize(tX.zyx * bw.x + tY.xzy * bw.y + tZ.xyz * bw.z);
              wN2 = normalize(mix(wN2, wR, gRock));
            }
            normal = normalize((viewMatrix * vec4(wN2, 0.0)).xyz); }`);
    };
    m.customProgramCacheKey = () => 'limscan_' + key;
    return m;
  };
  /* loose rock and small stones: the lichen-grey scanned rock */
  const cm0 = TERRAIN.cliffMat;
  TERRAIN.cliffMat = function (tint) {
    const s = TEX.sets.mossrock; if (!s || !s.photo) return cm0(tint);
    const key = 'scan' + (tint || 0xffffff); TERRAIN._cm = TERRAIN._cm || {}; if (TERRAIN._cm[key]) return TERRAIN._cm[key];
    const m = new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, roughnessMap: s.roughnessMap, roughness: 1, envMapIntensity: 0.35, color: new THREE.Color(tint || 0xffffff).lerp(new THREE.Color(0xffffff), 0.6) });
    m.userData.tscale = 3.4; TERRAIN._cm[key] = m; return m;
  };
  /* masonry: scanned ashlar for standing walls, darker rubble for the oldest work, scanned flags and planks */
  const M0 = WORLD.M;
  WORLD.M = function () {
    if (WORLD._M) return WORLD._M; const S = TEX.sets; if (!(S.sandstone && S.sandstone.photo)) return M0();
    const P = (n, o) => TEX.mat(n, Object.assign({ macro: 0.5, streak: 0.25 }, o));
    WORLD._M = { wall: P('ashlar', { color: 0xf2f4fc, scale: 2.6 }), dark: P('ashlar', { color: 0xdde4f2, scale: 2.6 }), rubble: P('rubble', { color: 0xd4d8dc, scale: 3.0 }), ruin: P('rubble', { color: 0xdcdedc, scale: 2.8 }),
      floor: P(S.tiles ? 'tiles' : 'ashlar', { color: 0xb4b2aa, scale: 3.4 }), paving: P(S.slate ? 'slate' : 'ashlar', { color: 0xa8a69e, scale: 2.6 }), wood: P(S.planks && S.planks.photo ? 'planks' : 'planks', { color: 0xe6d8c4, scale: 2.0 }), roof: P(S.roofslate ? 'roofslate' : 'ashlar', { color: 0x70727a, scale: 3.0 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2c2c30, metalness: 0.9, roughness: 0.5 }), gold: new THREE.MeshStandardMaterial({ color: 0xc9a04a, metalness: 1, roughness: 0.35 }) };
    WORLD._M.iron.userData.tscale = 1; WORLD._M.gold.userData.tscale = 1;
    return WORLD._M;
  };
})();
/* foliage from the scanned leaves and blades */
(function () { const l0 = WORLD.leafTex, b0 = WORLD.bladeTex;
  WORLD.leafTex = () => AST.tex['fol_leaf:s'] || l0(); WORLD.bladeTex = () => AST.tex['fol_grass:s'] || b0(); })();
/* which scans each region needs */
AST.BASE_SETS = ['grass2', 'grass1', 'moor', 'trail', 'cobble', 'mossrock', 'dryrock', 'sandstone', 'ashlar', 'rubble', 'blocks5', 'tiles', 'slate', 'planks', 'roofslate', 'bark'];
