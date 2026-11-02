import * as THREE from 'three';

// Pre-allocated math structures to prevent garbage collection allocations in animation loop (100% lag-free)
const _forward = new THREE.Vector3();
const _displacement = { x: 0, y: 0, z: 0 };
const _targetCamPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();
const _dismountPos = new THREE.Vector3();

/**
 * Motorcycle Controller
 * High-performance, 60fps responsive vehicle physics, audio synthesis, camera tracking, and HUD.
 */
export class MotorcycleController {
  constructor({ scene, world, RAPIER, characterRig, characterController, playerCollider, playerBody, camera, keys }) {
    this.scene = scene;
    this.world = world;
    this.RAPIER = RAPIER;
    this.characterRig = characterRig;
    this.characterController = characterController;
    this.playerCollider = playerCollider;
    this.playerBody = playerBody;
    this.camera = camera;
    this.keys = keys;

    this.motorcycles = [];
    this.activeBike = null;
    this.isRiding = false;

    // Dynamics state
    this.currentSpeed = 0;       // m/s
    this.targetSpeed = 0;
    this.bikeYaw = 0;            // radians
    this.bankAngle = 0;          // radians
    this.turnRate = 0;
    this.engineRunning = false;
    this.engineRpm = 1000;

    // Config
    this.maxSpeedNormal = 15.0;  // ~54 km/h
    this.maxSpeedBoost = 23.0;   // ~83 km/h
    this.maxSpeedReverse = -3.8; // ~14 km/h
    this.accelRate = 11.5;
    this.brakeRate = 20.0;
    this.dragRate = 4.2;

    // Web Audio Synthesizer
    this.audioCtx = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.audioInitialized = false;

    // UI Cache
    this.hudEl = null;
    this.hudSpeedEl = null;
    this.hudNameEl = null;
    this.hudGearEl = null;
    this.savedCameraFov = camera?.fov || 60;

    this.initHUD();
  }

  registerMotorcycles(list) {
    if (!Array.isArray(list)) return;
    for (const b of list) {
      if (b && !this.motorcycles.includes(b)) {
        this.motorcycles.push(b);
      }
    }
  }

  getNearestMotorcycle(px, py, pz, maxDist = 2.8) {
    let nearest = null;
    let minDist = maxDist;
    for (const bike of this.motorcycles) {
      if (!bike || !bike.position) continue;
      const dist = Math.hypot(px - bike.position.x, pz - bike.position.z);
      if (dist < minDist && Math.abs(py - bike.position.y) < 2.0) {
        minDist = dist;
        nearest = bike;
      }
    }
    return nearest;
  }

  initHUD() {
    if (typeof document === 'undefined') return;
    let hud = document.getElementById('motorcycle-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'motorcycle-hud';
      hud.className = 'motorcycle-hud is-hidden';
      hud.setAttribute('role', 'region');
      hud.setAttribute('aria-label', 'Motorcycle Dashboard');
      hud.innerHTML = `
        <div class="motorcycle-hud-content">
          <div class="motorcycle-hud-header">
            <span class="motorcycle-hud-icon">🏍️</span>
            <span class="motorcycle-hud-name" id="motorcycle-hud-name">SUPERSPORT 1000cc</span>
            <span class="motorcycle-hud-gear" id="motorcycle-hud-gear">GEAR N</span>
          </div>
          <div class="motorcycle-hud-speedometer">
            <span class="motorcycle-speed-number" id="motorcycle-speed-val">0</span>
            <span class="motorcycle-speed-unit">KM/H</span>
          </div>
          <div class="motorcycle-hud-guide">
            <span><span class="keycap">W</span> Gas</span>
            <span><span class="keycap">S</span> Rem / Mundur</span>
            <span><span class="keycap">A D</span> Belok</span>
            <span><span class="keycap">SHIFT</span> Boost</span>
            <button type="button" class="motorcycle-dismount-btn" id="motorcycle-dismount-btn"><span class="keycap">E</span> Turun</button>
          </div>
        </div>
      `;
      document.body.appendChild(hud);

      const dismountBtn = hud.querySelector('#motorcycle-dismount-btn');
      dismountBtn?.addEventListener('click', () => {
        if (this.isRiding) this.dismount();
      });
    }

    this.hudEl = hud;
    this.hudSpeedEl = document.getElementById('motorcycle-speed-val');
    this.hudNameEl = document.getElementById('motorcycle-hud-name');
    this.hudGearEl = document.getElementById('motorcycle-hud-gear');
  }

  initAudio() {
    if (this.audioInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();

      // Master gain node
      this.engineGain = this.audioCtx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      // Low-pass filter for engine throaty resonance
      this.engineFilter = this.audioCtx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(420, this.audioCtx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.2, this.audioCtx.currentTime);

      // Dual oscillators: Sawtooth + Triangle for realistic combustion roar
      this.engineOsc1 = this.audioCtx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(36, this.audioCtx.currentTime);

      this.engineOsc2 = this.audioCtx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(72, this.audioCtx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.audioCtx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.audioInitialized = true;
    } catch {
      // Audio fallback silent
    }
  }

  playStarterSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      // Quick starter crank chirp
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.22);
    } catch {
      // Ignore audio error
    }
  }

  updateAudio(dt, throttle, speedFraction) {
    if (!this.audioCtx || !this.engineGain) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      if (!this.isRiding) {
        this.engineGain.gain.setTargetAtTime(0, now, 0.08);
        return;
      }

      // Check if global audio is muted
      const isMuted = window.__audioManager?.isMuted || false;
      const targetVolume = isMuted ? 0 : 0.16 + throttle * 0.08;
      this.engineGain.gain.setTargetAtTime(targetVolume, now, 0.04);

      // Dynamic frequency: idle ~36Hz, top speed ~115Hz
      const targetFreq = 35 + speedFraction * 72 + throttle * 18;
      this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.04);
      this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2.02, now, 0.04);

      // Filter opens up with throttle for deep throaty roar
      const filterCutoff = 380 + speedFraction * 950 + throttle * 600;
      this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.04);
    } catch {
      // Ignore
    }
  }

  mount(bike) {
    if (!bike || this.isRiding) return false;
    this.activeBike = bike;
    this.isRiding = true;
    this.currentSpeed = 0;
    this.bikeYaw = bike.rotation.y;
    this.bankAngle = 0;
    this.camYaw = bike.rotation.y;
    this.engineRunning = true;

    // Retract kickstand & level the motorcycle
    if (bike.userData.kickstandGroup) {
      bike.userData.kickstandGroup.visible = false;
    }
    bike.rotation.z = 0;

    // Turn on forward LED projector headlight
    if (bike.userData.headlightSpot) bike.userData.headlightSpot.intensity = 2.6;
    if (bike.userData.headlightGlow) bike.userData.headlightGlow.intensity = 1.9;

    // Move parked static collider away so it does not block the rider
    if (bike.userData.colliderBody) {
      bike.userData.colliderBody.setTranslation({ x: 0, y: -100, z: 0 }, true);
    }

    // Set character rig pose to RIDING_BIKE
    if (this.characterRig?.setActionState) {
      this.characterRig.setActionState('RIDING_BIKE');
    }

    // Initialize audio synthesizer & play starter crank
    this.initAudio();
    this.playStarterSound();

    // Show HUD
    if (this.hudEl) {
      this.hudEl.classList.remove('is-hidden');
      if (this.hudNameEl) this.hudNameEl.textContent = bike.userData.name || 'SPORT 1000cc';
    }

    return true;
  }

  dismount() {
    if (!this.isRiding || !this.activeBike) return;
    const bike = this.activeBike;

    this.isRiding = false;
    this.currentSpeed = 0;
    this.engineRunning = false;

    // Deploy kickstand & lean bike onto stand
    if (bike.userData.kickstandGroup) {
      bike.userData.kickstandGroup.visible = true;
    }
    const parkedLean = bike.userData.parkedLeanAngle !== undefined ? bike.userData.parkedLeanAngle : -0.10;
    bike.rotation.z = parkedLean;

    // Turn off headlight
    if (bike.userData.headlightSpot) bike.userData.headlightSpot.intensity = 0;
    if (bike.userData.headlightGlow) bike.userData.headlightGlow.intensity = 0;

    // Stop engine sound
    if (this.engineGain && this.audioCtx) {
      this.engineGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.06);
    }

    // Place parked static collider at the new resting spot of the motorcycle
    if (bike.userData.colliderBody) {
      bike.userData.colliderBody.setTranslation(
        { x: bike.position.x, y: 0.65, z: bike.position.z },
        true
      );
    }

    // Place player standing neatly to the left of the parked motorcycle
    const leftOffsetX = -Math.cos(bike.rotation.y) * 0.85;
    const leftOffsetZ = Math.sin(bike.rotation.y) * 0.85;
    const dismountX = bike.position.x + leftOffsetX;
    const dismountY = Math.max(0.04, bike.position.y);
    const dismountZ = bike.position.z + leftOffsetZ;

    if (this.playerBody) {
      this.playerBody.setTranslation({ x: dismountX, y: dismountY + 0.1, z: dismountZ }, true);
      if (this.playerBody.setNextKinematicTranslation) {
        this.playerBody.setNextKinematicTranslation({ x: dismountX, y: dismountY + 0.1, z: dismountZ });
      }
    }

    if (this.characterRig?.character) {
      this.characterRig.character.position.set(dismountX, dismountY, dismountZ);
      this.characterRig.character.rotation.set(0, bike.rotation.y, 0);
    }

    if (this.characterRig?.setActionState) {
      this.characterRig.setActionState('IDLE');
    }

    // Restore camera FOV
    if (this.camera) {
      this.camera.fov = this.savedCameraFov;
      this.camera.updateProjectionMatrix();
    }

    // Hide HUD
    if (this.hudEl) {
      this.hudEl.classList.add('is-hidden');
    }

    this.activeBike = null;
  }

  update(dt) {
    if (!this.isRiding || !this.activeBike) return;
    const bike = this.activeBike;

    // 1. Process Inputs (WASD & Shift)
    const forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    const steerLeft = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const steerRight = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    // 2. Acceleration / Braking Dynamics
    let throttle = 0;
    const maxForward = boost ? this.maxSpeedBoost : this.maxSpeedNormal;

    if (forward) {
      throttle = 1.0;
      this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, maxForward, this.accelRate, dt);
    } else if (backward) {
      if (this.currentSpeed > 0.4) {
        // Braking while rolling forward
        this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, 0, this.brakeRate, dt);
      } else {
        // Reversing
        throttle = 0.4;
        this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, this.maxSpeedReverse, 6.0, dt);
      }
    } else {
      // Natural rolling friction deceleration
      this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, 0, this.dragRate, dt);
    }

    // Stop jitter at near-zero speed
    if (Math.abs(this.currentSpeed) < 0.05) this.currentSpeed = 0;

    // 3. Steering & Banking Dynamics
    const absSpeed = Math.abs(this.currentSpeed);
    const speedRatio = Math.min(1.0, absSpeed / this.maxSpeedNormal);
    let steerInput = 0;
    if (steerLeft) steerInput += 1;
    if (steerRight) steerInput -= 1;

    // Turn rate scales smoothly: agile at low speeds, stable at high speeds
    const baseTurnSpeed = 2.4 - speedRatio * 0.9;
    const movingSign = this.currentSpeed >= 0 ? 1 : -1;
    if (absSpeed > 0.1) {
      this.bikeYaw += steerInput * baseTurnSpeed * movingSign * dt;
    }

    // Realistic banking angle into turn (up to ~20 degrees)
    const targetBank = steerInput * speedRatio * 0.35;
    this.bankAngle = THREE.MathUtils.damp(this.bankAngle, targetBank, 9.0, dt);

    // 4. Kinematic Rapier Collision Movement
    // Local forward is +Z, world forward direction is [sin(yaw), 0, cos(yaw)]
    const fwdX = Math.sin(this.bikeYaw);
    const fwdZ = Math.cos(this.bikeYaw);

    _displacement.x = fwdX * this.currentSpeed * dt;
    _displacement.y = -9.8 * dt; // Gravity
    _displacement.z = fwdZ * this.currentSpeed * dt;

    if (this.characterController && this.playerCollider) {
      this.characterController.computeColliderMovement(this.playerCollider, _displacement);
      const computed = this.characterController.computedMovement();

      // Check if stopped by obstacle/wall
      const expectedDist = Math.hypot(_displacement.x, _displacement.z);
      const actualDist = Math.hypot(computed.x, computed.z);
      if (expectedDist > 0.08 && actualDist < 0.01) {
        // Motorcycle bumped into a wall/curb: dampen speed to prevent sliding stuck
        this.currentSpeed *= 0.5;
      }

      bike.position.x += computed.x;
      bike.position.y += computed.y;
      bike.position.z += computed.z;

      // Keep minimum ground elevation
      if (bike.position.y < 0.04) bike.position.y = 0.04;
    } else {
      bike.position.x += _displacement.x;
      bike.position.z += _displacement.z;
    }

    // Apply orientation and lean angle to bike
    bike.rotation.y = this.bikeYaw;
    bike.rotation.z = this.bankAngle;

    // 5. Keep Player Kinematic Body and Character Rig in sync
    if (this.playerBody) {
      this.playerBody.setTranslation(
        { x: bike.position.x, y: bike.position.y + 0.5, z: bike.position.z },
        true
      );
      if (this.playerBody.setNextKinematicTranslation) {
        this.playerBody.setNextKinematicTranslation({
          x: bike.position.x,
          y: bike.position.y + 0.5,
          z: bike.position.z,
        });
      }
    }

    // Position character rig firmly on the motorcycle saddle
    if (this.characterRig?.character) {
      // In local coordinates of motorcycle, seat is at [0, 0.38, -0.16]
      const saddleOffsetX = -Math.sin(this.bikeYaw) * 0.16;
      const saddleOffsetZ = -Math.cos(this.bikeYaw) * 0.16;

      this.characterRig.character.position.set(
        bike.position.x + saddleOffsetX,
        bike.position.y + 0.38,
        bike.position.z + saddleOffsetZ
      );
      this.characterRig.character.rotation.y = this.bikeYaw;
      this.characterRig.character.rotation.z = this.bankAngle;
    }

    // 6. Audio Synthesizer Update
    this.updateAudio(dt, throttle, speedRatio);

    // 7. HUD Update (Speedometer & Gear)
    const kmh = Math.round(absSpeed * 3.6);
    if (this.hudSpeedEl) {
      this.hudSpeedEl.textContent = String(kmh);
    }
    if (this.hudGearEl) {
      let gear = 'N';
      if (this.currentSpeed < -0.2) gear = 'R';
      else if (kmh > 65) gear = '6';
      else if (kmh > 48) gear = '5';
      else if (kmh > 34) gear = '4';
      else if (kmh > 22) gear = '3';
      else if (kmh > 12) gear = '2';
      else if (kmh > 0) gear = '1';
      this.hudGearEl.textContent = `GEAR ${gear}`;
    }
  }

  updateCamera(dt, camera) {
    if (!this.isRiding || !this.activeBike || !camera) return;
    const bike = this.activeBike;

    if (this.camYaw === undefined) {
      this.camYaw = this.bikeYaw;
    }

    const absSpeed = Math.abs(this.currentSpeed);
    const speedRatio = Math.min(1.0, absSpeed / this.maxSpeedNormal);

    // Smoothly auto-align camera chase yaw with motorcycle forward heading
    let yawDiff = this.bikeYaw - this.camYaw;
    yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
    const alignSpeed = absSpeed > 0.2 ? 4.5 + speedRatio * 3.5 : 2.0;
    this.camYaw += yawDiff * Math.min(1.0, dt * alignSpeed);

    const camDist = 4.3 + speedRatio * 1.4;
    const camHeight = 1.95;

    // Follow behind the smoothed camera yaw
    const fwdX = Math.sin(this.camYaw);
    const fwdZ = Math.cos(this.camYaw);

    _targetCamPos.set(
      bike.position.x - fwdX * camDist,
      bike.position.y + camHeight,
      bike.position.z - fwdZ * camDist
    );

    // Look at point: 3.5m ahead down the road along bike heading
    const bikeFwdX = Math.sin(this.bikeYaw);
    const bikeFwdZ = Math.cos(this.bikeYaw);
    _lookAtPos.set(
      bike.position.x + bikeFwdX * 3.5,
      bike.position.y + 1.15,
      bike.position.z + bikeFwdZ * 3.5
    );

    // Smooth lag-free lerp
    camera.position.lerp(_targetCamPos, Math.min(1.0, dt * 8.5));
    camera.lookAt(_lookAtPos);

    // Dynamic FOV for exhilarating speed sensation
    const targetFov = this.savedCameraFov + speedRatio * 8.0;
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1.0, dt * 4.0));
      camera.updateProjectionMatrix();
    }
  }

  get position() {
    return this.activeBike ? this.activeBike.position : { x: 0, y: 0, z: 0 };
  }
}
