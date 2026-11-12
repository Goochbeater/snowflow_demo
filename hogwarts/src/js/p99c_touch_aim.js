/* ==== p99c_touch_aim.js ==== */
/* TOUCH AIM — on a phone the reticle is the middle of the screen and the only way to move it is a drag, which a thumb
   on CAST cannot make. Two helps, as action games on phones give them:
   - tap a foe (anywhere on the open view) and the view swings onto them; the usual soft lean then keeps them there;
   - press CAST with nobody under the reticle and the view turns to the nearest foe in sight in front of you (within 22 m
     and 75° of where you look).
   A drag of the view, the foe's fall or two seconds end the swing. */
{ const F = TOUCH.focus = { e: null, t: 0, hold: 0 }, v = new THREE.Vector3();
  const foes = () => (COMBAT.actors || []).filter((e) => e.alive && e.team !== 'hero' && !e.hidden && !e.noTarget && e.chest).concat((HL.dummies || []).filter((d) => d.chest && PLAYER.a && Math.hypot(d.x - PLAYER.a.x, d.z - PLAYER.a.z) < 30));   // (the practice dummies too)
  const onScreen = (e) => { e.chest(v); v.project(R.camera); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return null; return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
  const aim = (e) => { F.e = e; F.t = 0; F.hold = 0; };
  /* a tap on a foe */
  const t0 = TOUCH.tap; TOUCH.tap = function (x, y) { const r = t0.apply(this, arguments); if (TOUCH.mode !== 'foot' || !PLAYER.a) return r; let best = null, bd = 64;
    for (const e of foes()) { const s = onScreen(e); if (!s) continue; const d = Math.hypot(s[0] - x, s[1] - (y + 10)); if (d < bd) { bd = d; best = e; } }
    if (best) { aim(best); TOUCH.buzz(6); } return r; };
  /* CAST with no one under the reticle */
  const p0 = TOUCH.press; TOUCH.press = function (id) { const r = p0.apply(this, arguments);
    if (id === 'cast' && TOUCH.mode === 'foot' && PLAYER.a && !(HL.P && HL.P.target) && !F.e) { const a = PLAYER.a, cam = R.camera, o = cam.getWorldPosition(new THREE.Vector3()), d = cam.getWorldDirection(new THREE.Vector3()); let best = null, bs = 1e9;
      for (const e of foes()) { const c = e.chest(new THREE.Vector3()), dist = Math.hypot(c.x - a.x, c.z - a.z); if (dist > 22) continue; const to = c.clone().sub(o).normalize(), ang = Math.acos(clamp(to.dot(d), -1, 1)); if (ang > 1.3) continue;
        const q = c.clone().addScaledVector(to, -0.7); if (typeof PHY !== 'undefined' && PHY.los && !PHY.los(o.x, o.y, o.z, q.x, q.y, q.z)) continue;   /* (sight to just short of them: a dummy's own post blocked the line to its chest) */ const sc = dist + ang * 12; if (sc < bs) { bs = sc; best = e; } }
      if (best) aim(best); }
    return r; };
  /* the swing: fast, then let go once they are under the reticle (or the player takes the view back) */
  const poll0 = IN.poll; IN.poll = function () { poll0(); if (!TOUCH.on || !F.e) return; const e = F.e, a = PLAYER.a, dt = MG.rdt || 1 / 60; F.t += dt;
    const dragging = Object.values(TOUCH.look).some((L) => L.moved > 12);
    if (!e.alive || !a || TOUCH.mode !== 'foot' || dragging || F.t > 2) { F.e = null; return; }
    const c = e.chest(v), ty = Math.atan2(c.x - a.x, c.z - a.z), d = wrapA(ty - CAM.yaw); IN.A.lx -= d * (1 - Math.exp(-12 * dt));
    if (Math.abs(d) < 0.05) { F.hold += dt; if (F.hold > 0.5) F.e = null; } };
}
