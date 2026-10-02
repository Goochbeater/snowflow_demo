// ===================== INPUT: multi-touch controls, gestures, gyro =====================
const Input = {
  steer: { x: 0, y: 0 }, boost: false, brake: false, look: false, shootHeld: false, shootT: 0, tapT: -9, callT: -9,
  gyroYaw: 0, gyroPitch: 0, stick: null, lastStickUp: -9, path: [], swipe: null,
  init() {
    const $ = id => document.getElementById(id);
    const el = this.el = { zStick: $('zStick'), zSwipe: $('zSwipe'), base: $('stickBase'), knob: $('stickKnob'), ghost: $('stickGhost'), shoot: $('bShoot'), pass: $('bPass'), boost: $('bBoost'), look: $('bLook'), swap: $('bSwap'), pause: $('bPause') };
    const now = () => performance.now() / 1000;
    const skipCheck = () => { if (Game.state === 'finisher') { Finishers.skip(); return true; } return false; };

    el.zStick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (skipCheck() || this.stick) return;
      try { el.zStick.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
      this.brake = now() - this.lastStickUp < 0.32;
      this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      el.base.style.left = e.clientX + 'px'; el.base.style.top = e.clientY + 'px';
      el.base.classList.add('on'); el.base.classList.toggle('brake', this.brake); el.ghost.style.opacity = 0;
      el.knob.style.transform = 'translate(0px,0px)';
    });
    el.zStick.addEventListener('pointermove', (e) => {
      const s = this.stick; if (!s || s.id !== e.pointerId) return;
      const R = 54 * Settings.uiScale;
      let dx = e.clientX - s.ox, dy = e.clientY - s.oy; const len = Math.hypot(dx, dy);
      if (len > R) { const k = 1 - R / len; s.ox += dx * k; s.oy += dy * k; dx = e.clientX - s.ox; dy = e.clientY - s.oy; el.base.style.left = s.ox + 'px'; el.base.style.top = s.oy + 'px'; }
      el.knob.style.transform = `translate(${dx}px,${dy}px)`;
      const l = Math.min(1, Math.hypot(dx, dy) / R), dz = 0.08;
      const m = l < dz ? 0 : Math.pow((l - dz) / (1 - dz), 1.55);
      const ang = Math.atan2(dy, dx);
      this.steer.x = Math.cos(ang) * m; this.steer.y = -Math.sin(ang) * m;
    });
    const stickEnd = (e) => {
      const s = this.stick; if (!s || s.id !== e.pointerId) return;
      this.stick = null; this.lastStickUp = now(); this.brake = false; this.steer.x = this.steer.y = 0;
      el.base.classList.remove('on', 'brake'); el.ghost.style.opacity = '';
    };
    el.zStick.addEventListener('pointerup', stickEnd); el.zStick.addEventListener('pointercancel', stickEnd);

    const hold = (b, down, up, move) => {
      let id = null;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (skipCheck() || id !== null) return;
        id = e.pointerId; try { b.setPointerCapture(id); } catch (err) { /* ignore */ }
        b.classList.add('down'); down && down(e);
      });
      if (move) b.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
      const end = (e) => { if (e.pointerId !== id) return; id = null; b.classList.remove('down'); up && up(e); };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
    };
    hold(el.shoot, (e) => { this.shootHeld = true; this.shootT = Game.rtime; this.path = [{ x: e.clientX, y: e.clientY }]; Game.onShootDown(); },
      (e) => { const g = this.gesture(); this.shootHeld = false; Game.onShootUp(Game.rtime - this.shootT, g); },
      (e) => { if (this.path.length < 200) this.path.push({ x: e.clientX, y: e.clientY }); });
    hold(el.pass, () => Game.onPassTap());
    hold(el.boost, () => { this.boost = true; }, () => { this.boost = false; });
    hold(el.look, () => { this.look = true; }, () => { this.look = false; });
    hold(el.swap, () => Game.seekerSwap());
    hold(el.pause, () => UI.pause());

    el.zSwipe.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (skipCheck()) return;
      this.swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now() };
      try { el.zSwipe.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    const swipeEnd = (e) => {
      const s = this.swipe; if (!s || s.id !== e.pointerId) return; this.swipe = null;
      const dx = e.clientX - s.x, dy = e.clientY - s.y, d = Math.hypot(dx, dy);
      if (now() - s.t < 0.5 && d > 38 * Settings.uiScale) Game.onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    el.zSwipe.addEventListener('pointerup', swipeEnd); el.zSwipe.addEventListener('pointercancel', swipeEnd);
    document.getElementById('hud').addEventListener('pointerdown', skipCheck);
    this.onMotion = this.onMotion.bind(this);
    if (Settings.gyro) this.setGyro(true);
  },
  gesture() {
    const P = this.path; if (P.length < 2) return null;
    const a = P[0], b = P[P.length - 1], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    if (P.length > 8) {
      let cx = 0, cy = 0; for (const p of P) { cx += p.x; cy += p.y; } cx /= P.length; cy /= P.length;
      let sweep = 0, maxR = 0, prev = Math.atan2(P[0].y - cy, P[0].x - cx);
      for (const p of P) { const ang = Math.atan2(p.y - cy, p.x - cx); sweep += wrapAngle(ang - prev); prev = ang; maxR = Math.max(maxR, Math.hypot(p.x - cx, p.y - cy)); }
      if (Math.abs(sweep) > 4.6 && maxR > 18) return 'circle';
    }
    if (dist < 40 * Settings.uiScale) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  },
  reset() { this.steer.x = this.steer.y = 0; this.boost = this.brake = this.look = this.shootHeld = false; this.stick = null; this.el && this.el.base.classList.remove('on'); },
  setGyro(on) {
    if (on) {
      try { const req = window.DeviceMotionEvent && DeviceMotionEvent.requestPermission; if (req) req.call(DeviceMotionEvent).catch(() => {}); } catch (e) { /* ignore */ }
      window.addEventListener('devicemotion', this.onMotion);
    } else window.removeEventListener('devicemotion', this.onMotion);
  },
  onMotion(e) {
    const r = e.rotationRate; if (!r || Game.state !== 'play' || !Game.player) return;
    const dt = clamp((e.interval || 16) / (e.interval > 1 ? 1000 : 1), 0.001, 0.05);
    const a = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let yaw, pit;
    if (a === 90) { yaw = r.beta; pit = -r.gamma; }
    else if (a === 270 || a === -90) { yaw = -r.beta; pit = r.gamma; }
    else { yaw = r.gamma; pit = r.beta; }
    const k = DEG * dt * Settings.gyroSens;
    this.gyroYaw += (yaw || 0) * k; this.gyroPitch += (pit || 0) * k * (Settings.invert ? -1 : 1);
  },
};
