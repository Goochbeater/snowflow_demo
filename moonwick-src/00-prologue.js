// ===== prologue: module scope shared by every part (only THREE + ADDONS live here) =====
const THREE = await import('three');
const ADDONS = {};
{
  const [ec, rp, ub, sp, op, bgu] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
  ]);
  Object.assign(ADDONS, ec, rp, ub, sp, op, { BGU: bgu });
}
window.THREE = THREE;
window.AF = window.AF || {};
window.AF.addons = ADDONS;
window.AF.errors = [];
window.AF.partError = (part, e) => {
  console.error('[af] part ' + part + ' threw at top level:', e);
  window.AF.errors.push({ part, msg: String(e && (e.stack || e.message) || e) });
};

// ?only=10,40,41  -> run only those numbered parts (plus the core 00-09 and 90-99);  ?skip=55,57 -> leave those out
window.AF.partOn = (f) => { const n = +f.slice(0, 2); if (n < 10 || n >= 90) return true; const on = new URLSearchParams(location.search).get('only'), off = new URLSearchParams(location.search).get('skip'); if (on && !on.split(',').some((k) => +k === n)) return false; if (off && off.split(',').some((k) => +k === n)) return false; return true; };
