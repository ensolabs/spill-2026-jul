'use strict';

// Positions and cable lengths are metres. Flight.step receives elapsed seconds.
window.Flight = (() => {
  const base = Object.freeze({x:30, y:2, z:55});
  const ship = Object.freeze({x:0, y:2, z:-75});
  const sites = Object.freeze({ship,base});
  const duration = 180;
  const stowed = 0.75;
  const cableLimit = 25;
  const fairlead = 1.05;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const approach = (value, target, step) => value + clamp(target-value, -step, step);
  const toggles = ['KeyE', 'KeyH', 'KeyL', 'KeyC'];

  return class Flight {
    static get sites() { return sites; }
    constructor() { this.reset(); }

    reset() {
      this.state = {
        x:0, y:18, z:24, vx:0, vy:0, vz:0,
        heading:0, yawRate:0, followCamera:true,
        hook:{x:0, y:18-fairlead-stowed, z:24}, rope:stowed,
        attached:false, light:true, hover:true, deployed:false, target:ship,
        phase:'approach', remaining:duration, elapsed:0, progress:0, quality:0,
        distance:99, guidance:'Fly north to the vessel. Look for a flare on the aft deck.'
      };
      this.previousKeys = new Set();
      // Deflection is expressed as slopes relative to the local downward vertical.
      this.swing = {x:0, z:0, vx:0, vz:0};
      this.contact = 0;
      return this.state;
    }

    step(dt, keys) {
      const s = this.state;
      if (s.phase === 'complete' || s.phase === 'failed') return s;
      if (!Number.isFinite(dt) || dt < 0) return s;
      for (const code of toggles) {
        if (!keys.has(code) || this.previousKeys.has(code)) continue;
        if (code === 'KeyE') s.deployed = !s.deployed;
        if (code === 'KeyH') s.hover = !s.hover;
        if (code === 'KeyC') s.followCamera = !s.followCamera;
        if (code === 'KeyL') s.light = !s.light;
      }
      this.previousKeys = new Set(toggles.filter(code => keys.has(code)));
      // Decouple cable stability and contact timing from display refresh rate.
      let left = Math.min(dt, duration);
      while (left > 0 && s.phase !== 'complete' && s.phase !== 'failed') {
        const h = Math.min(left, 1/60);
        this.advance(h, keys);
        left -= h;
      }
      return s;
    }

    advance(h, keys) {
      const s = this.state;
      s.elapsed = Math.min(duration, s.elapsed+h);
      s.remaining = duration-s.elapsed;
      const startVx = s.vx, startVz = s.vz;
      const shifted = keys.has('ShiftLeft') || keys.has('ShiftRight');
      const sideways = shifted ? 0 : Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
      const forward = shifted ? 0 : Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
      const vertical = Number((keys.has('ArrowUp') || shifted && keys.has('KeyW'))) - Number((keys.has('ArrowDown') || shifted && keys.has('KeyS')));
      const stickLength = Math.max(1, Math.hypot(sideways, forward));
      const speed = s.attached ? 13 : 16;
      const pedals = Number((keys.has('ArrowRight') || shifted && keys.has('KeyD'))) - Number((keys.has('ArrowLeft') || shifted && keys.has('KeyA')));
      s.yawRate += (pedals*Math.PI/2-s.yawRate)*(1-Math.exp(-8*h));
      s.heading = (s.heading+s.yawRate*h+2*Math.PI)%(2*Math.PI);
      const cos=Math.cos(s.heading), sin=Math.sin(s.heading);
      let targetVx = (sideways*cos-forward*sin)*speed/stickLength;
      let targetVz = (sideways*sin+forward*cos)*speed/stickLength;
      if (!sideways && !forward && s.hover && s.distance < 9) {
        targetVx = clamp((s.target.x-s.x)*0.95, -3.5, 3.5);
        targetVz = clamp((s.target.z-s.z)*0.95, -3.5, 3.5);
      }
      const driving = sideways || forward;
      const response = driving ? 1.1 : s.hover ? 2.8 : 0.4;
      const blend = 1-Math.exp(-response*h);
      const gust = s.hover ? 0 : 0.65*Math.sin(s.elapsed*0.48);
      s.vx += (targetVx-s.vx)*blend + gust*h;
      s.vz += (targetVz-s.vz)*blend;
      s.vy += (vertical*6-s.vy)*(1-Math.exp(-2.3*h));
      s.x = clamp(s.x+s.vx*h, -39, 39);
      s.y = clamp(s.y+s.vy*h, 6, 44);
      s.z = clamp(s.z+s.vz*h, -108, 86);
      if (Math.abs(s.x)===39) s.vx = 0;
      if (s.y===6 || s.y===44) s.vy = 0;
      if (s.z===-108 || s.z===86) s.vz = 0;
      s.distance = Math.hypot(s.x-s.target.x, s.z-s.target.z);

      const overDeck = [base, ship].some(deck =>
        Math.abs(s.x-deck.x)<5.5 && Math.abs(s.z-deck.z)<6.5
      );
      const surface = overDeck ? base.y+1 : 0.6;
      const available = Math.max(stowed, s.y-fairlead-surface);
      const desired = s.deployed ? Math.min(cableLimit,available) : stowed;
      s.rope = Math.min(available, approach(s.rope,desired,(s.deployed?6:7)*h));
      const q = this.swing;
      const length = Math.max(1.3,s.rope);
      const gravity = 9.81/length;
      const damping = (s.attached?0.5:0.72) + 1.4/length;
      q.vx += (-gravity*q.x - damping*q.vx - (s.vx-startVx)/(h*length))*h;
      q.vz += (-gravity*q.z - damping*q.vz - (s.vz-startVz)/(h*length))*h;
      q.x = clamp(q.x+q.vx*h,-1.2,1.2);
      q.z = clamp(q.z+q.vz*h,-1.2,1.2);
      const drop = s.rope/Math.hypot(1,q.x,q.z);
      s.hook.x = s.x+q.x*drop;
      s.hook.y = s.y-fairlead-drop;
      s.hook.z = s.z+q.z*drop;

      const miss = Math.hypot(s.hook.x-s.target.x,s.hook.z-s.target.z);
      const swingSpeed = drop*Math.hypot(q.vx,q.vz);
      const airspeed = Math.hypot(s.vx,s.vy,s.vz);
      const withinReach = miss < 3.6 && Math.abs(s.hook.y-(s.target.y+1))<1.75;
      this.contact = s.deployed && withinReach && airspeed<3.2 && swingSpeed<3.6
        ? this.contact+h : 0;
      s.progress = Math.min(1,this.contact/0.65);
      if (s.progress===1) {
        if (s.phase==='approach') {
          s.quality = Math.round(clamp(100-miss*3-swingSpeed*2-airspeed*2,0,100));
          s.attached = true;
          s.phase = 'return';
          s.target = base;
          s.distance = Math.hypot(s.x-base.x,s.z-base.z);
          s.deployed = false;
          this.contact = s.progress = 0;
        } else {
          s.phase = 'complete';
          s.attached = false;
          s.guidance = 'Survivor safely ashore. Rescue complete.';
          return;
        }
      }
      if (s.remaining<=0) {
        s.phase='failed';
        s.guidance='The weather window has closed.';
      } else if (s.distance>12) {
        s.guidance = s.attached ? 'Survivor secured. Fly southeast to the shore base.' : 'Fly north to the vessel. Look for a flare on the aft deck.';
      } else if (s.y>cableLimit+3) {
        s.guidance='Descend below 28 m so the cable can reach the target.';
      } else if (!s.deployed) {
        s.guidance='Press E to lower the winch over the beacon.';
      } else if (!withinReach) {
        s.guidance='Center the hook over the beacon and let the line settle.';
      } else {
        s.guidance=s.attached?'Hold steady for the shore team.':'Hold steady for pickup.';
      }
    }
  };
})();
