// Shared uniforms + shader patches: fire glow from up to 32 world lights, snow, wet sand glints.
import * as THREE from 'three';

export const MAXL = 32;
export const U = {
  uTime: { value: 0 },
  uSnow: { value: 0 },
  uTide: { value: 0 },
  uWind: { value: new THREE.Vector2(1, 0.3) },
  uLP: { value: Array.from({ length: MAXL }, () => new THREE.Vector4(0, -999, 0, 1)) },
  uLC: { value: Array.from({ length: MAXL }, () => new THREE.Vector3()) },
  uNL: { value: 0 },
  uDark: { value: 0 },
  uOverlay: { value: null },
  uOvBounds: { value: new THREE.Vector4(-800, -700, 1600, 1600) },
  uSun: { value: new THREE.Vector3(0, 1, 0) },
  uSunCol: { value: new THREE.Color(1, 1, 1) },
};

export const GLSL_NOISE = /* glsl */`
float kHash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float kNoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(kHash(i),kHash(i+vec2(1,0)),f.x), mix(kHash(i+vec2(0,1)),kHash(i+vec2(1,1)),f.x), f.y); }
float kFbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*kNoise(p); p*=2.07; a*=.5;} return s; }
`;

const VERT_HEAD = `varying vec3 kWP; varying vec3 kWN;\n`;
const VERT_BODY = `
  vec4 kP = vec4(transformed, 1.0);
  vec3 kN = objectNormal;
  #ifdef USE_INSTANCING
    kP = instanceMatrix * kP; kN = mat3(instanceMatrix) * kN;
  #endif
  kP = modelMatrix * kP; kWP = kP.xyz; kWN = normalize(mat3(modelMatrix) * kN);
`;
const FRAG_HEAD = `varying vec3 kWP; varying vec3 kWN;
uniform vec4 uLP[${MAXL}]; uniform vec3 uLC[${MAXL}]; uniform int uNL; uniform float uSnow; uniform float uTime; uniform float uTide; uniform float uDark;
uniform sampler2D uOverlay; uniform vec4 uOvBounds;
${GLSL_NOISE}
`;
function glowLoop(spec) {
  return `
  vec3 kGlow = vec3(0.); vec3 kSpec = vec3(0.);
  vec3 kV = normalize(cameraPosition - kWP);
  for (int i = 0; i < ${MAXL}; i++) {
    if (i >= uNL) break;
    vec3 d = uLP[i].xyz - kWP; float d2 = dot(d, d); float r = uLP[i].w;
    float att = 1.0 / (1.0 + d2 / (r * r)) * clamp(1.0 - d2 / (36.0 * r * r), 0.0, 1.0);
    vec3 L = d * inversesqrt(d2 + 1e-4);
    float lam = max(dot(kN2, L), 0.0) * 0.85 + 0.15;
    kGlow += uLC[i] * att * lam;
    ${spec ? 'vec3 Rf = reflect(-kV, kN2); kSpec += uLC[i] * pow(max(dot(Rf, L), 0.0), 40.0) * att * 1.5;' : ''}
  }
  `;
}

// opts: { snow: bool, overlay: bool (terrain), wet: bool }
export function patch(mat, opts = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + VERT_BODY);
    let f = FRAG_HEAD + sh.fragmentShader;
    let colorExtra = '';
    if (opts.overlay) colorExtra += `
      vec2 ovUv = (kWP.xz - uOvBounds.xy) / uOvBounds.zw;
      if (ovUv.x > 0. && ovUv.y > 0. && ovUv.x < 1. && ovUv.y < 1.) {
        vec4 ov = texture2D(uOverlay, ovUv);
        float grain = 0.82 + 0.36 * kNoise(kWP.xz * 1.7);
        diffuseColor.rgb = mix(diffuseColor.rgb, ov.rgb * grain, ov.a);
      }
      // detail noise
      diffuseColor.rgb *= 0.86 + 0.28 * kFbm(kWP.xz * 0.35);
      // wet sand band by the tide line
      float wetB = smoothstep(uTide + 2.2, uTide + 0.2, kWP.y) * smoothstep(uTide - 3.0, uTide - 0.2, kWP.y);
      diffuseColor.rgb *= 1.0 - 0.45 * wetB;
    `;
    if (opts.snow) colorExtra += `
      float kSn = uSnow * smoothstep(0.35, 0.8, kWN.y + (kNoise(kWP.xz * 0.25) - 0.5) * 0.5);
      kSn *= smoothstep(${opts.overlay ? 'uTide + 1.5' : '-5.0'}, ${opts.overlay ? 'uTide + 5.0' : '-4.0'}, kWP.y);
      kSn = clamp(kSn * (1.0 + smoothstep(120.0, 500.0, kWP.y)) , 0.0, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.97), kSn);
    `;
    if (opts.rock) colorExtra += `
      float kSt = 1.0 - smoothstep(0.55, 0.85, kWN.y);
      float strata = kNoise(vec2(kWP.y * 0.09 + kNoise(kWP.xz * 0.03) * 6.0, (kWP.x + kWP.z) * 0.02));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (0.9 + 0.2 * strata) * (0.85 + 0.3 * kNoise(kWP.xz * 0.08)), kSt);
      float moss = smoothstep(0.6, 0.9, kWN.y) * (1.0 - smoothstep(150.0, 320.0, kWP.y));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.85, 1.08, 0.8), moss * 0.6);
    `;
    if (opts.peaks) colorExtra += `
      float kPk = smoothstep(380.0, 620.0, kWP.y + kNoise(kWP.xz*0.02)*80.0) * smoothstep(0.4, 0.75, kWN.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.91, 0.96), max(kPk, 0.0));
    `;
    f = f.replace('#include <color_fragment>', '#include <color_fragment>\n' + colorExtra);
    f = f.replace('#include <opaque_fragment>', `
      vec3 kN2 = normalize(kWN);
      ${glowLoop(!!opts.wet)}
      outgoingLight += diffuseColor.rgb * kGlow;
      ${opts.wet ? `
        float wetS = smoothstep(uTide + 2.6, uTide + 0.2, kWP.y) * smoothstep(uTide - 2.0, uTide - 0.1, kWP.y);
        outgoingLight += kSpec * wetS * (0.6 + 0.8 * kNoise(kWP.xz * 3.0));
      ` : ''}
      #include <opaque_fragment>`);
    sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => 'k' + JSON.stringify(opts);
  return mat;
}

export function stdMat(opts = {}, params = {}) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.92, metalness: 0.0 }, params));
  return patch(m, opts);
}
