// ===================== SHARED UNIFORMS, SKY & FOG GLSL, MATERIAL PATCHING =====================
const SHARED = {
  uTime: { value: 0 },
  uSunDirW: { value: new THREE.Vector3(0.5, 0.25, 0.8).normalize() },
  uFogCol: { value: new THREE.Color(0.7, 0.7, 0.75) },
  uFogSun: { value: new THREE.Color(1, 0.8, 0.6) },
  uFogDen: { value: 0.00085 },
  uNoise: { value: null },
  uNight: { value: 0 },
};
const SKYU = {
  uSunCol: { value: new THREE.Color(1, 0.8, 0.6) },
  uZenith: { value: new THREE.Color(0.15, 0.3, 0.6) },
  uHorizon: { value: new THREE.Color(0.9, 0.75, 0.6) },
  uGroundCol: { value: new THREE.Color(0.15, 0.13, 0.11) },
  uCloudLit: { value: new THREE.Color(1.2, 1.0, 0.85) },
  uCloudDark: { value: new THREE.Color(0.4, 0.4, 0.48) },
  uCloudCover: { value: 0.45 },
  uStars: { value: 0 },
  uCloudSpeed: { value: 1 },
};
const fogUniforms = () => ({ uSunDirW: SHARED.uSunDirW, uFogCol: SHARED.uFogCol, uFogSun: SHARED.uFogSun, uFogDen: SHARED.uFogDen });

const FOG_PARS = /* glsl */`
uniform vec3 uSunDirW; uniform vec3 uFogCol; uniform vec3 uFogSun; uniform float uFogDen;
`;
const FOG_GLSL = /* glsl */`
{
  vec3 fv = vWPos - cameraPosition;
  float fd = length(fv);
  float fogF = 1.0 - exp(-pow(fd * uFogDen, 1.45));
  fogF *= mix(0.42, 1.0, exp(-max(vWPos.y, 0.0) * 0.0045));
  float sunAmt = pow(max(dot(fv / max(fd, 0.001), uSunDirW), 0.0), 5.0);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uFogCol, uFogSun, sunAmt), clamp(fogF, 0.0, 1.0));
}
`;

const SKY_PARS = /* glsl */`
uniform vec3 uSunCol; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGroundCol;
uniform vec3 uCloudLit; uniform vec3 uCloudDark; uniform float uCloudCover; uniform float uStars; uniform float uCloudSpeed;
uniform sampler2D uNoise; uniform float uTime;
float cloudDensity(vec2 p) {
  vec2 w = vec2(uTime * 0.0022, uTime * 0.0006) * uCloudSpeed;
  float n = texture2D(uNoise, p * 0.00042 + w).r * 0.62
          + texture2D(uNoise, p * 0.0013 + w * 1.7).g * 0.28
          + texture2D(uNoise, p * 0.0055 - w * 2.5).b * 0.12;
  return smoothstep(1.0 - uCloudCover, 1.0 - uCloudCover + 0.32, n);
}
vec3 skyColor(vec3 d, float withClouds) {
  float h = d.y;
  float sd = max(dot(d, uSunDirW), 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.48));
  col += uSunCol * (0.22 * pow(sd, 4.0) * exp(-max(h, 0.0) * 2.6) + 0.10 * pow(sd, 24.0) + 0.5 * pow(sd, 300.0));
  col = mix(col, uGroundCol, smoothstep(0.0, -0.1, h));
  if (uStars > 0.01 && h > 0.0) {
    vec3 sp = d * 260.0; vec3 cell = floor(sp);
    float r = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float st = step(0.9968, r) * smoothstep(0.42, 0.0, length(fract(sp) - 0.5));
    col += vec3(0.9, 0.95, 1.1) * st * uStars * (2.0 + 1.5 * sin(uTime * 2.7 + r * 90.0)) * smoothstep(0.0, 0.2, h);
    col += vec3(0.05, 0.06, 0.1) * uStars * texture2D(uNoise, d.xz / max(h, 0.2) * 0.15).r * smoothstep(0.1, 0.6, h);
  }
  vec3 sunDisk = uSunCol * smoothstep(0.99955, 0.99978, sd) * 46.0;
  if (withClouds > 0.5 && h > 0.0) {
    float t = 900.0 / max(h, 0.035);
    vec2 p = d.xz * t;
    float dens = cloudDensity(p);
    vec2 sd2 = normalize(uSunDirW.xz + 1e-4);
    float dl = cloudDensity(p + sd2 * 260.0);
    float light = clamp(0.55 + (dens - dl) * 1.6, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudLit, light);
    cc += uSunCol * pow(sd, 7.0) * 0.9 * (1.0 - dens * 0.6);
    float fade = smoothstep(0.0, 0.22, h);
    cc = mix(col, cc, 0.25 + 0.75 * fade);
    float a = dens * (0.35 + 0.65 * fade);
    sunDisk *= 1.0 - smoothstep(0.0, 0.5, dens);
    col = mix(col, cc, a);
  }
  return col + sunDisk;
}
`;

function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogUniforms(), ...SKYU, uNoise: SHARED.uNoise, uTime: SHARED.uTime },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p; gl_Position.z = p.w * 0.99999; }`,
    fragmentShader: FOG_PARS + SKY_PARS + /* glsl */`
      varying vec3 vDir;
      void main() { vec3 d = normalize(vDir); gl_FragColor = vec4(skyColor(d, 1.0), 1.0); }`,
    side: THREE.BackSide, depthWrite: false, depthTest: true,
  });
}

// Patches a built-in material with world-position fog, wind, flutter etc.
function patchMaterial(mat, o = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = SHARED.uTime; sh.uniforms.uNoise = SHARED.uNoise; sh.uniforms.uNight = SHARED.uNight;
    Object.assign(sh.uniforms, fogUniforms(), o.uniforms || {});
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nvarying vec3 vWPos;\nvarying vec3 vWNormal;\n${o.vHead || ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${o.vDisp || ''}`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 wp4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp4 = instanceMatrix * wp4;
        #endif
          vWPos = (modelMatrix * wp4).xyz; ${o.wnormal ? 'vWNormal = normalize(mat3(modelMatrix) * objectNormal);' : 'vWNormal = vec3(0.0, 1.0, 0.0);'} }
        ${o.vPost || ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime; uniform float uNight; uniform sampler2D uNoise;\nvarying vec3 vWPos;\nvarying vec3 vWNormal;\n${FOG_PARS}\n${o.fHead || ''}`)
      .replace('#include <fog_fragment>', FOG_GLSL);
    if (o.albedo) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\n${o.albedo}`);
    if (o.rough) sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${o.rough}`);
    if (o.emis) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${o.emis}`);
  };
  mat.customProgramCacheKey = () => 'qsb_' + (o.key || 'base');
  mat.fog = false;
  return mat;
}
const stdMat = (params, o) => patchMaterial(new THREE.MeshStandardMaterial(params), o);

const GROUND_ALBEDO = /* glsl */`
  vec2 p = vWPos.xz;
  float n1 = texture2D(uNoise, p * 0.0032).r;
  float n2 = texture2D(uNoise, p * 0.019).g;
  float n3 = texture2D(uNoise, p * 0.12).b;
  float n4 = texture2D(uNoise, p * 0.85).r;
  vec3 c = mix(vec3(0.040, 0.095, 0.020), vec3(0.095, 0.165, 0.040), n1);
  c = mix(c, vec3(0.19, 0.16, 0.07), smoothstep(0.55, 0.82, n2 * 0.7 + n1 * 0.3) * 0.55);
  c *= (0.78 + 0.44 * n3) * (0.86 + 0.28 * n4);
  float rr = length(p);
  vec2 q = p / vec2(${CONFIG.pitch.a.toFixed(1)}, ${CONFIG.pitch.b.toFixed(1)});
  float e = length(q);
  float inP = 1.0 - smoothstep(0.985, 1.02, e);
  float stripe = step(0.5, fract(p.x / 11.0));
  vec3 pitchCol = mix(vec3(0.052, 0.135, 0.026), vec3(0.082, 0.185, 0.038), stripe) * (0.9 + 0.2 * n3) * (0.94 + 0.12 * n4);
  c = mix(c, pitchCol, inP);
  float fw = max(fwidth(p.x) + fwidth(p.y), 0.02) * 0.8;
  float dE = (e - 1.0) * rr / max(e, 0.001);
  float ln = 1.0 - smoothstep(0.11, 0.11 + fw, abs(dE));
  ln = max(ln, 1.0 - smoothstep(0.11, 0.11 + fw, abs(rr - 9.0)));
  ln = max(ln, (1.0 - smoothstep(0.11, 0.11 + fw, abs(abs(p.x) - 52.0))) * inP);
  ln = max(ln, (1.0 - smoothstep(0.11, 0.11 + fw, abs(p.x))) * inP);
  c = mix(c, vec3(0.62, 0.63, 0.58) * (0.85 + 0.2 * n4), ln * 0.85);
  // worn grass under the stands
  vec2 sq = p / vec2(${CONFIG.pitch.standA.toFixed(1)}, ${CONFIG.pitch.standB.toFixed(1)});
  float se = length(sq);
  c = mix(c, vec3(0.09, 0.07, 0.045) * (0.8 + 0.4 * n3), smoothstep(0.06, 0.0, abs(se - 1.05)) * 0.7);
  float slope = 1.0 - clamp(vWNormal.y, 0.0, 1.0);
  float hh = vWPos.y;
  float fMask = smoothstep(3.0, 16.0, hh) * (1.0 - smoothstep(170.0, 240.0, hh)) * smoothstep(0.38, 0.62, n1 * 0.55 + n2 * 0.45 + 0.12);
  c = mix(c, vec3(0.018, 0.04, 0.018) * (0.7 + 0.6 * n2), fMask * 0.88);
  vec3 rock = vec3(0.12, 0.11, 0.10) * (0.65 + 0.7 * n3);
  c = mix(c, rock, clamp(smoothstep(0.32, 0.55, slope) + smoothstep(210.0, 270.0, hh) * 0.7, 0.0, 1.0));
  float snow = smoothstep(255.0, 300.0, hh + n2 * 40.0) * (1.0 - smoothstep(0.55, 0.78, slope));
  c = mix(c, vec3(0.82, 0.85, 0.9), snow);
  float shore = (1.0 - smoothstep(0.3, 2.5, hh)) * smoothstep(-7.0, -0.4, hh) * step(240.0, rr);
  c = mix(c, vec3(0.13, 0.11, 0.08) * (0.8 + 0.4 * n3), shore * 0.85);
  diffuseColor.rgb = c;
`;
