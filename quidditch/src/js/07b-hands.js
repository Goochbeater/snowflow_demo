// ===================== RIGGED HANDS (WebXR Input Profiles generic hand, MIT) =====================
// Fingers are posed procedurally: each joint gets a flexion axis computed from the rest pose,
// so a single "curl" value per finger produces a believable grip, cup, reach or fist.
const FINGERS = ['thumb', 'index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'];
const HAND_POSES = {
  grip:  { curl: [0.62, 0.92, 0.95, 0.97, 1.0], spread: 0.0 },
  hold:  { curl: [0.25, 0.32, 0.36, 0.4, 0.44], spread: 0.55 },
  open:  { curl: [0.05, 0.05, 0.06, 0.08, 0.1], spread: 0.75 },
  fist:  { curl: [0.85, 1.0, 1.0, 1.0, 1.0], spread: 0.0 },
};

const Hands = {
  ready: false, src: {},
  async load() {
    try {
      const loader = new GLTFLoader();
      for (const side of ['left', 'right']) {
        const b64 = ASSET_DATA['hand-' + side].split(',')[1];
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
        const gltf = await new Promise((res, rej) => loader.parse(bin, '', res, rej));
        this.src[side] = gltf.scene;
      }
      this.ready = true;
    } catch (e) { console.warn('hand models unavailable', e); this.ready = false; }
  },
  make(side) {
    const root = this.src[side];
    if (!root || root.userData.hand) return root && root.userData.hand;
    const leather = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#8a6a50'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,22,10' : '150,110,80'},${Math.random() * 0.12})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 2.5, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(230,200,150,.35)'; g.lineWidth = 1.2; g.setLineDash([3, 3]);
      for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(0, 20 + k * 42); g.bezierCurveTo(80, 10 + k * 42, 170, 40 + k * 42, 256, 22 + k * 42); g.stroke(); }
    }, true, true);
    const mat = stdMat({ color: 0x6e4630, map: leather, roughness: 0.42, metalness: 0.0 }, { key: 'glove' });
    let mesh = null; root.traverse(o => { if (o.isSkinnedMesh) mesh = o; o.frustumCulled = false; });
    mesh.material = mat; mesh.castShadow = false; mesh.receiveShadow = true;
    const bones = {}; root.traverse(o => { if (o.name === 'wrist' || FINGERS.some(f => o.name.startsWith(f))) bones[o.name] = o; });
    root.updateMatrixWorld(true);
    // all joints are siblings under the armature: do forward kinematics ourselves (armature space)
    const arm = bones.wrist.parent, armInv = new THREE.Matrix4().copy(arm.matrixWorld).invert();
    const ap = n => new THREE.Vector3().setFromMatrixPosition(bones[n].matrixWorld).applyMatrix4(armInv);
    const W = ap('wrist'), I = ap('index-finger-phalanx-proximal'), M = ap('middle-finger-phalanx-proximal'), P = ap('pinky-finger-phalanx-proximal');
    const D = M.clone().sub(W).normalize();
    let K = P.clone().sub(I).normalize();
    const N = new THREE.Vector3().crossVectors(K, D).normalize(); if (side === 'left') N.negate();
    K = new THREE.Vector3().crossVectors(D, N).normalize(); if (side === 'left') K.negate();
    const chains = {};
    for (const f of FINGERS) {
      const names = f === 'thumb' ? ['wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip']
        : [f + '-metacarpal', f + '-phalanx-proximal', f + '-phalanx-intermediate', f + '-phalanx-distal', f + '-tip'];
      const js = names.map(n => ({ b: bones[n], p: bones[n].position.clone(), q: bones[n].quaternion.clone() }));
      for (let k = 1; k < js.length; k++) {
        const a = js[k - 1], b = js[k], qi = a.q.clone().invert();
        b.relP = b.p.clone().sub(a.p).applyQuaternion(qi); b.relQ = qi.clone().multiply(b.q);
        if (k < js.length - 1) {
          const dir = js[k + 1].p.clone().sub(b.p).normalize();
          const axisA = new THREE.Vector3().crossVectors(N, dir).normalize();
          if (f === 'thumb') axisA.lerp(D, k === 1 ? 0.55 : 0.35).normalize();
          const bi = b.q.clone().invert();
          b.axis = axisA.applyQuaternion(bi).normalize();
          b.spreadAxis = N.clone().applyQuaternion(bi).normalize();
        }
      }
      chains[f] = js;
    }
    // placement frame in hand-root space
    const am = arm.matrixWorld, amRot = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(am));
    const toRoot = v => v.clone().applyMatrix4(am);
    const Kr = K.clone().applyQuaternion(amRot), Nr = N.clone().applyQuaternion(amRot);
    const grip = toRoot(W.clone().add(I).add(M).add(P).multiplyScalar(0.25).lerp(M, 0.25).addScaledVector(N, -0.03));
    const basis = new THREE.Matrix4().makeBasis(Kr, Nr, new THREE.Vector3().crossVectors(Kr, Nr));
    const h = { side, root, mesh, chains, grip, wrist: toRoot(W), basisInv: basis.clone().invert(), curl: [0, 0, 0, 0, 0], spread: 0, quat: new THREE.Quaternion(), pos: new THREE.Vector3() };
    root.userData.hand = h;
    return h;
  },
  // blend toward a named pose and solve each finger chain
  pose(h, name, k) {
    const PZ = HAND_POSES[name];
    for (let i = 0; i < 5; i++) h.curl[i] = lerp(h.curl[i], PZ.curl[i], k);
    h.spread = lerp(h.spread, PZ.spread, k);
    const amax = [[0.45, 0.5, 0.6], [1.35, 1.6, 1.0], [1.4, 1.65, 1.05], [1.45, 1.6, 1.0], [1.4, 1.55, 1.0]];
    const so = [0.2, -0.16, 0.0, 0.12, 0.26];
    const pp = this._p || (this._p = new THREE.Vector3()), pq = this._q || (this._q = new THREE.Quaternion());
    FINGERS.forEach((f, i) => {
      const js = h.chains[f];
      pp.copy(js[0].p); pq.copy(js[0].q);
      for (let k2 = 1; k2 < js.length; k2++) {
        const j = js[k2];
        pp.add(_v1.copy(j.relP).applyQuaternion(pq));
        pq.multiply(j.relQ);
        if (j.axis) {
          _q1.setFromAxisAngle(j.axis, h.curl[i] * amax[i][k2 - 1]); pq.multiply(_q1);
          if (k2 === 1 && i > 0) { _q2.setFromAxisAngle(j.spreadAxis, h.spread * so[i] * (h.side === 'left' ? -1 : 1)); pq.multiply(_q2); }
        }
        j.b.position.copy(pp); j.b.quaternion.copy(pq);
      }
    });
  },
  // place the hand so its grip point sits at `pos` with knuckle line K and back-of-hand N (camera space)
  place(h, pos, K, N, rate = 1) {
    _v1.copy(K).normalize(); _v2.copy(N).addScaledVector(_v1, -_v1.dot(N)).normalize(); _v3.crossVectors(_v1, _v2);
    _m1.makeBasis(_v1, _v2, _v3).multiply(h.basisInv);
    _q2.setFromRotationMatrix(_m1);
    h.quat.slerp(_q2, rate); h.pos.lerp(pos, rate);
    h.root.quaternion.copy(h.quat);
    h.root.position.copy(h.pos).sub(_v4.copy(h.grip).applyQuaternion(h.quat));
  },
};
