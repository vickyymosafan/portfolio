import * as THREE from 'three';
import { SIT_ROOT_OFFSET, SEAT_DEFINITIONS } from './seatLayout.js';

export const InteractionMode = {
  NONE: 'NONE',
  SITTING: 'SITTING',
  DOOR: 'DOOR',
};

export const InteractionState = {
  IDLE: 'IDLE',
  VALIDATING: 'VALIDATING',
  APPROACHING: 'APPROACHING',
  PLAYING_CINEMATIC: 'PLAYING_CINEMATIC',
  COMPLETING: 'COMPLETING',
  RESTORING: 'RESTORING',
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export class WorldInteractionManager {
  constructor(options = {}) {
    this.scene = options.scene || null;
    this.camera = options.camera || null;
    this.characterRig = options.characterRig || null;
    this.playerBody = options.playerBody || null;
    this.cameraBlockers = options.cameraBlockers || [];

    // Dedicated raycasting for camera obstruction detection
    this._camRaycaster = new THREE.Raycaster();
    this._rayHits = [];

    // Callbacks to synchronize external systems (main.js physics & camera)
    this.onPositionUpdate = options.onPositionUpdate || null;
    this.onCameraSync = options.onCameraSync || null;
    this.onStateChange = options.onStateChange || null;

    this.mode = InteractionMode.NONE;
    this.lifecycleState = InteractionState.IDLE;
    this.activeSeat = null;
    this.activeDoorControls = null;

    this.stateClock = 0;
    this.stateDuration = 0.5;
    this.watchdogClock = 0;
    this.watchdogLimit = 3.2; // Max allowable duration before fail-safe triggers
    this.debugMode = Boolean(options.debug ?? false);

    // Reusable math vectors for camera and character interpolation
    this._camStartPos = new THREE.Vector3();
    this._camStartLook = new THREE.Vector3();
    this._camTargetPos = new THREE.Vector3();
    this._camTargetLook = new THREE.Vector3();
    this._currentLook = new THREE.Vector3();
    this._tempV1 = new THREE.Vector3();

    this._charStartPos = new THREE.Vector3();
    this._charTargetPos = new THREE.Vector3();
    this._charStartRot = 0;
    this._charTargetRot = 0;

    // Saved gameplay camera parameters before interaction began
    this.savedCameraDistance = 4.4;
    this.savedYaw = 0;
    this.savedPitch = 0.25;

    // Defined Seating Targets in the world with exact anchor positions & facing orientations
    // Automatically populated from centralized SEAT_DEFINITIONS derived from furniture geometry.
    this.seats = Object.values(SEAT_DEFINITIONS);
  }

  setContext({ scene, camera, characterRig, playerBody, cameraBlockers, onPositionUpdate, onCameraSync, onStateChange }) {
    if (scene) this.scene = scene;
    if (camera) this.camera = camera;
    if (characterRig) this.characterRig = characterRig;
    if (playerBody) this.playerBody = playerBody;
    if (cameraBlockers) this.cameraBlockers = cameraBlockers;
    if (onPositionUpdate) this.onPositionUpdate = onPositionUpdate;
    if (onCameraSync) this.onCameraSync = onCameraSync;
    if (onStateChange) this.onStateChange = onStateChange;
  }

  /**
   * Raycast obstruction detection against building geometry and room partition walls.
   * Pulls camera safely in front of any detected obstacle with a protective margin.
   */
  resolveCameraObstruction(targetPos, lookTarget, minClearance = 0.35) {
    if (!this.cameraBlockers || this.cameraBlockers.length === 0) return;

    const dx = targetPos.x - lookTarget.x;
    const dy = targetPos.y - lookTarget.y;
    const dz = targetPos.z - lookTarget.z;
    const totalDist = Math.hypot(dx, dy, dz);
    if (totalDist < 0.1) return;

    this._tempV1.set(dx / totalDist, dy / totalDist, dz / totalDist);
    this._camRaycaster.set(lookTarget, this._tempV1);
    this._camRaycaster.far = totalDist;

    this._rayHits.length = 0;
    this._camRaycaster.intersectObjects(this.cameraBlockers, false, this._rayHits);

    if (this._rayHits.length > 0) {
      const hitDist = this._rayHits[0].distance;
      const safeDist = Math.max(1.6, hitDist - minClearance);
      targetPos.copy(lookTarget).addScaledVector(this._tempV1, safeDist);
    }
  }

  setDebug(enabled) {
    this.debugMode = Boolean(enabled);
  }

  logDebug(event, details = {}) {
    if (!this.debugMode) return;
    console.log(`[InteractionDebug] ${event}`, details);
  }

  isActive() {
    return this.mode !== InteractionMode.NONE;
  }

  isInputLocked() {
    return this.mode !== InteractionMode.NONE;
  }

  isTransitioning() {
    return (
      this.lifecycleState === InteractionState.APPROACHING ||
      this.lifecycleState === InteractionState.RESTORING ||
      (this.mode === InteractionMode.DOOR && this.lifecycleState === InteractionState.PLAYING_CINEMATIC)
    );
  }

  /**
   * Find nearest interactable seat within range
   */
  getNearbySeat(px, pz, py = undefined) {
    if (!isFiniteNumber(px) || !isFiniteNumber(pz)) return null;
    let nearest = null;
    let nearestDist = Infinity;
    for (const seat of this.seats) {
      if (py !== undefined && isFiniteNumber(py) && Math.abs(py - seat.pos[1]) > 2.4) {
        continue;
      }
      const dx = px - seat.pos[0];
      const dz = pz - seat.pos[2];
      const dist = Math.hypot(dx, dz);
      if (dist < seat.radius && dist < nearestDist) {
        nearest = seat;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  /**
   * State Machine Lifecycle: Sitting Interaction
   * IDLE -> VALIDATING -> APPROACHING -> PLAYING_CINEMATIC (Seated Idle) -> RESTORING -> IDLE
   */
  toggleSit(px, pz, playerState = {}, py = undefined) {
    // 1. If currently seated, stand up
    if (this.mode === InteractionMode.SITTING) {
      if (this.lifecycleState === InteractionState.PLAYING_CINEMATIC) {
        return this.standUp();
      }
      // If currently approaching or restoring, reject spam input
      return false;
    }

    // 2. Reject if any other interaction is running
    if (this.lifecycleState !== InteractionState.IDLE || this.mode !== InteractionMode.NONE) {
      return false;
    }

    // 3. VALIDATING
    this.lifecycleState = InteractionState.VALIDATING;
    const seat = this.getNearbySeat(px, pz, py);
    if (!seat) {
      this.lifecycleState = InteractionState.IDLE;
      return false;
    }

    const char = this.characterRig?.character;
    if (!char) {
      this.lifecycleState = InteractionState.IDLE;
      return false;
    }

    // Capture initial gameplay camera parameters
    this.savedCameraDistance = isFiniteNumber(playerState.cameraDistance) ? playerState.cameraDistance : 4.4;
    this.savedYaw = isFiniteNumber(playerState.yaw) ? playerState.yaw : 0;
    this.savedPitch = isFiniteNumber(playerState.pitch) ? playerState.pitch : 0.25;

    this.activeSeat = seat;
    this.mode = InteractionMode.SITTING;
    // Procedural pose (the rig is mesh-based; there is no AnimationClip). It blends in while the
    // root moves onto the seat so the character never pops into the seated pose.
    this.characterRig?.setActionState(seat.isDesk ? 'WORKING_DESK' : 'SITTING');

    // 4. APPROACHING PHASE
    this.lifecycleState = InteractionState.APPROACHING;
    this.stateClock = 0;
    this.stateDuration = 0.38; // Smooth, intentional character approach
    this.watchdogClock = 0;

    // Start character transform
    this._charStartPos.copy(char.position);
    this._charStartRot = char.rotation.y;

    // Target seat position and rotation
    this._charTargetPos.set(seat.pos[0], seat.pos[1] + SIT_ROOT_OFFSET, seat.pos[2]);
    this._charTargetRot = seat.charFacing;

    // Start camera framing: start look-at ALWAYS derived from character head, never getWorldDirection dirt
    if (this.camera) {
      this._camStartPos.copy(this.camera.position);
      this._camStartLook.set(char.position.x, char.position.y + 1.25, char.position.z);
      this._currentLook.copy(this._camStartLook);

      // Camera sits at 3/4 hero composition facing the seated subject
      if (seat.cameraShot) {
        this._camTargetPos.set(seat.cameraShot.pos[0], seat.cameraShot.pos[1], seat.cameraShot.pos[2]);
        this._camTargetLook.set(seat.cameraShot.look[0], seat.cameraShot.look[1], seat.cameraShot.look[2]);
      } else {
        const camAngle = seat.charFacing + 0.60;
        const camDist = 3.6;
        let targetCamZ = seat.pos[2] + Math.cos(camAngle) * camDist;
        if (seat.id === 'sofa_living') {
          targetCamZ = Math.min(3.4, targetCamZ);
        }
        this._camTargetPos.set(
          seat.pos[0] + Math.sin(camAngle) * camDist,
          seat.pos[1] + 1.52,
          targetCamZ
        );
        this._camTargetLook.set(seat.pos[0], seat.pos[1] + 1.15, seat.pos[2]);
      }

      // Clamp to designated interior room boundaries if defined
      if (seat.roomBounds) {
        const b = seat.roomBounds;
        this._camTargetPos.x = THREE.MathUtils.clamp(this._camTargetPos.x, b.minX, b.maxX);
        this._camTargetPos.z = THREE.MathUtils.clamp(this._camTargetPos.z, b.minZ, b.maxZ);
      }

      // Resolve physical camera obstruction using raycasting against building walls and obstacles
      this.resolveCameraObstruction(this._camTargetPos, this._camTargetLook);
    }

    this.logDebug('SIT_APPROACHING', {
      seatId: seat.id,
      from: [char.position.x, char.position.z],
      to: [seat.pos[0], seat.pos[2]],
    });

    if (this.onStateChange) this.onStateChange(this.lifecycleState);
    return true;
  }

  getStandPosition(seat) {
    if (seat.standPos) {
      return {
        x: seat.standPos[0],
        y: seat.standPos[1] !== undefined ? seat.standPos[1] : 1.12,
        z: seat.standPos[2],
      };
    }
    const stepDist = 1.35;
    return {
      x: seat.pos[0] + Math.sin(seat.charFacing) * stepDist,
      y: 1.12,
      z: seat.pos[2] + Math.cos(seat.charFacing) * stepDist,
    };
  }

  standUp() {
    if (this.mode !== InteractionMode.SITTING) return false;
    if (this.lifecycleState === InteractionState.RESTORING) return false;

    this.lifecycleState = InteractionState.RESTORING;
    this.stateClock = 0;
    this.stateDuration = 0.48;
    this.watchdogClock = 0;

    // Reset character rig pose to standing IDLE
    if (this.characterRig) {
      this.characterRig.setActionState('IDLE');
    }

    const char = this.characterRig?.character;
    const seat = this.activeSeat;

    if (char && seat) {
      const stand = this.getStandPosition(seat);
      this._charStartPos.copy(char.position);
      this._charTargetPos.set(stand.x, stand.y, stand.z);
      this._charStartRot = char.rotation.y;
      this._charTargetRot = seat.charFacing;
    }

    // Camera smoothly blends from seated framing to third-person follow
    if (this.camera && char) {
      this._camStartPos.copy(this.camera.position);
      this._camStartLook.copy(this._currentLook);

      const horizontal = this.savedCameraDistance * Math.cos(this.savedPitch);
      this._camTargetPos.set(
        this._charTargetPos.x + Math.sin(this.savedYaw) * horizontal,
        this._charTargetPos.y + 1.4 + Math.sin(this.savedPitch) * this.savedCameraDistance,
        this._charTargetPos.z + Math.cos(this.savedYaw) * horizontal
      );
      this._camTargetLook.set(this._charTargetPos.x, this._charTargetPos.y + 1.25, this._charTargetPos.z);
      this.resolveCameraObstruction(this._camTargetPos, this._camTargetLook);
    }

    this.logDebug('STAND_UP_STARTED');
    if (this.onStateChange) this.onStateChange(this.lifecycleState);
    return true;
  }

  /**
   * State Machine Lifecycle: Garden Door Interaction
   * IDLE -> VALIDATING -> APPROACHING -> PLAYING_CINEMATIC -> RESTORING -> IDLE
   */
  toggleDoor(doorControls, playerState = {}) {
    if (this.lifecycleState !== InteractionState.IDLE || this.mode !== InteractionMode.NONE) {
      return false;
    }
    if (!doorControls) return false;
    if (doorControls.isBusy?.()) {
      this.logDebug('DOOR_REJECTED', { reason: 'busy', doorState: doorControls.getState?.() });
      return false;
    }

    const char = this.characterRig?.character;
    if (!char) return false;

    // 1. VALIDATING
    this.lifecycleState = InteractionState.VALIDATING;
    const isOutdoor = char.position.z > 3.92;
    const doorCenterZ = 3.92;

    const distToDoor = Math.hypot(char.position.x - 0, char.position.z - doorCenterZ);
    if (distToDoor > 4.6) {
      this.lifecycleState = InteractionState.IDLE;
      return false;
    }

    // Save gameplay camera parameters
    this.savedCameraDistance = isFiniteNumber(playerState.cameraDistance) ? playerState.cameraDistance : 4.4;
    this.savedYaw = isFiniteNumber(playerState.yaw) ? playerState.yaw : 0;
    this.savedPitch = isFiniteNumber(playerState.pitch) ? playerState.pitch : 0.25;

    this.mode = InteractionMode.DOOR;
    this.activeDoorControls = doorControls;

    // 2. APPROACHING PHASE
    this.lifecycleState = InteractionState.APPROACHING;
    this.stateClock = 0;
    this.stateDuration = 0.32;
    this.watchdogClock = 0;

    const isUpperFloor = char.position.y > 3.0;
    const floorY = isUpperFloor ? 5.2 : 0.0;

    // Correct character orientation facing the door:
    // When outdoor (z > 3.92): door is at z = 3.92 (-Z direction). In Three.js, Math.PI faces -Z.
    // When indoor (z < 3.92): door is at z = 3.92 (+Z direction). In Three.js, 0 faces +Z.
    const facingYaw = isOutdoor ? Math.PI : 0;
    const approachZ = isOutdoor ? 4.9 : 2.95;

    this._charStartPos.copy(char.position);
    this._charTargetPos.set(0, char.position.y, approachZ);
    this._charStartRot = char.rotation.y;
    this._charTargetRot = facingYaw;

    // Compute cinematic framing inside the porch/balcony footprint
    if (this.camera) {
      this._camStartPos.copy(this.camera.position);
      this._camStartLook.set(char.position.x, char.position.y + 1.3, char.position.z);
      this._currentLook.copy(this._camStartLook);

      if (isOutdoor) {
        this._camTargetPos.set(1.1, floorY + 2.0, 7.6);
        this._camTargetLook.set(0, floorY + 1.8, 4.0);
      } else {
        this._camTargetPos.set(1.1, floorY + 2.0, 0.4);
        this._camTargetLook.set(0, floorY + 1.8, 3.9);
      }
    }

    this.logDebug('DOOR_APPROACHING', { isOutdoor, approachZ, facingYaw });
    if (this.onStateChange) this.onStateChange(this.lifecycleState);
    return true;
  }

  /**
   * Sound effect for physical door latch
   */
  playDoorLatchSound(isOpen) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isOpen ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isOpen ? 220 : 140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isOpen ? 360 : 75, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }

  /**
   * Synchronize position across character mesh, Rapier physics, and main.js state
   */
  syncPosition(x, y, z, charYaw) {
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) return;

    if (this.characterRig?.character) {
      this.characterRig.character.position.set(x, y, z);
      if (isFiniteNumber(charYaw)) {
        this.characterRig.character.rotation.y = charYaw;
      }
    }

    if (this.playerBody) {
      this.playerBody.setTranslation({ x, y, z }, true);
      if (this.playerBody.setNextKinematicTranslation) {
        this.playerBody.setNextKinematicTranslation({ x, y, z });
      }
    }

    if (this.onPositionUpdate) {
      this.onPositionUpdate(x, y, z, charYaw);
    }
  }

  /** Snapshot for diagnostics: seat anchor, root/pelvis world positions, state. */
  describe() {
    const char = this.characterRig?.character;
    const pelvis = this.characterRig?.pelvisGroup;
    const pv = pelvis && pelvis.getWorldPosition ? pelvis.getWorldPosition(new THREE.Vector3()) : null;
    return {
      mode: this.mode,
      state: this.lifecycleState,
      seat: this.activeSeat ? { id: this.activeSeat.id, pos: this.activeSeat.pos } : null,
      root: char ? char.position.toArray() : null,
      pelvisWorld: pv ? pv.toArray() : null,
      camera: this.camera ? this.camera.position.toArray() : null,
    };
  }

  /**
   * User cancellation (Esc key)
   */
  cancelAny() {
    if (this.mode === InteractionMode.NONE && this.lifecycleState === InteractionState.IDLE) {
      return false;
    }
    return this.recover('user_cancel');
  }

  /**
   * Centralized fail-safe recovery mechanism
   */
  recover(reason = 'unknown') {
    this.logDebug('RECOVERY_TRIGGERED', { reason, mode: this.mode, state: this.lifecycleState });

    // 1. Reset character rig animation to IDLE
    if (this.characterRig) {
      this.characterRig.setActionState('IDLE');
      if (this.characterRig.state) {
        this.characterRig.state.targetActionWeight = 0;
        this.characterRig.state.actionWeight = 0;
      }
    }

    // 2. Ensure valid character position & ground alignment
    this.activeDoorControls?.settle?.();
    const char = this.characterRig?.character;
    if (char) {
      if (this.mode === InteractionMode.SITTING && this.activeSeat) {
        // Never leave the character inside the furniture: stand clear of the seat
        const stand = this.getStandPosition(this.activeSeat);
        this.syncPosition(stand.x, stand.y, stand.z, this.activeSeat.charFacing);
      } else {
        if (!isFiniteNumber(char.position.x) || !isFiniteNumber(char.position.y) || !isFiniteNumber(char.position.z)) {
          char.position.set(0, 1.12, 16.8);
        }
        char.position.y = Math.max(1.12, char.position.y);
        this.syncPosition(char.position.x, char.position.y, char.position.z, char.rotation.y);
      }
    }

    // 4. Safely restore follow camera
    if (this.camera && char) {
      const dist = isFiniteNumber(this.savedCameraDistance) ? this.savedCameraDistance : 5.0;
      const pitch = isFiniteNumber(this.savedPitch) ? this.savedPitch : 0.25;
      const yaw = isFiniteNumber(this.savedYaw) ? this.savedYaw : 0;
      const horizontal = dist * Math.cos(pitch);

      this.camera.position.set(
        char.position.x + Math.sin(yaw) * horizontal,
        char.position.y + 1.4 + Math.sin(pitch) * dist,
        char.position.z + Math.cos(yaw) * horizontal
      );
      this.camera.lookAt(char.position.x, char.position.y + 1.25, char.position.z);

      if (this.onCameraSync) {
        this.onCameraSync(yaw, pitch, dist);
      }
    }

    // 5. Reset all state flags
    this.mode = InteractionMode.NONE;
    this.lifecycleState = InteractionState.IDLE;
    this.activeSeat = null;
    this.activeDoorControls = null;
    this.stateClock = 0;
    this.watchdogClock = 0;

    if (this.onStateChange) this.onStateChange(this.lifecycleState);
    return true;
  }

  /**
   * Per-frame update loop for camera, character, and interaction transitions
   */
  update(dt) {
    if (this.mode === InteractionMode.NONE && this.lifecycleState === InteractionState.IDLE) {
      return false;
    }

    // Watchdog check: prevent permanent softlock under any circumstance
    if (this.lifecycleState !== InteractionState.IDLE) {
      // Do not timeout while stably seated in seated idle
      const isStablySeated = this.mode === InteractionMode.SITTING && this.lifecycleState === InteractionState.PLAYING_CINEMATIC;
      if (!isStablySeated) {
        this.watchdogClock += dt;
        if (this.watchdogClock > this.watchdogLimit) {
          this.recover(`watchdog_timeout_${this.lifecycleState}`);
          return true;
        }
      }
    }

    this.stateClock += dt;
    const rawProgress = Math.min(1.0, this.stateClock / Math.max(0.01, this.stateDuration));
    const ease = easeInOutCubic(rawProgress);

    const char = this.characterRig?.character;

    // ==========================================
    // 1. APPROACHING STATE
    // ==========================================
    if (this.lifecycleState === InteractionState.APPROACHING) {
      // Smoothly interpolate character position and rotation toward target anchor
      if (char) {
        const p = this._tempV1.lerpVectors(this._charStartPos, this._charTargetPos, ease);
        const rotDiff = normalizeAngle(this._charTargetRot - this._charStartRot);
        this.syncPosition(p.x, p.y, p.z, this._charStartRot + rotDiff * ease);
      }

      // Smoothly interpolate camera to framing angle
      if (this.camera) {
        this.camera.position.lerpVectors(this._camStartPos, this._camTargetPos, ease);
        this._currentLook.lerpVectors(this._camStartLook, this._camTargetLook, ease);
        this.camera.lookAt(this._currentLook);
      }

      // Complete approach transition
      if (rawProgress >= 1.0) {
        if (char) {
          this.syncPosition(this._charTargetPos.x, this._charTargetPos.y, this._charTargetPos.z, this._charTargetRot);
        }

        if (this.mode === InteractionMode.SITTING) {
          // Seated idle: pose is already blended in; hold the seat transform
          this.lifecycleState = InteractionState.PLAYING_CINEMATIC;
          this.stateClock = 0;
          this.stateDuration = 0.5;
          this.watchdogClock = 0;
          this.logDebug('SEATED', this.describe());
          if (this.onStateChange) this.onStateChange(this.lifecycleState);
        } else if (this.mode === InteractionMode.DOOR) {
          this.lifecycleState = InteractionState.PLAYING_CINEMATIC;
          this.stateClock = 0;
          this.stateDuration = 1.6; // Upper bound for the door swing; real completion is the callback
          this.watchdogClock = 0;
          this._doorDone = false;

          if (this.characterRig) {
            this.characterRig.setActionState('DOOR_REACH');
          }

          const started = this.activeDoorControls?.toggle?.((nowOpen) => {
            this._doorDone = true;
            this.playDoorLatchSound(nowOpen);
            this.logDebug('DOOR_COMPLETE', { open: nowOpen });
          });
          if (started === false || !this.activeDoorControls) {
            this.recover('door_busy_or_missing');
            return true;
          }
          if (this.onStateChange) this.onStateChange(this.lifecycleState);
        }
      }
      return true;
    }

    // ==========================================
    // 2. PLAYING CINEMATIC STATE
    // ==========================================
    if (this.lifecycleState === InteractionState.PLAYING_CINEMATIC) {
      if (this.mode === InteractionMode.SITTING) {
        // Smooth damp camera in seated idle view
        if (this.camera) {
          this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._camTargetPos.x, 7.0, dt);
          this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._camTargetPos.y, 7.0, dt);
          this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._camTargetPos.z, 7.0, dt);
          this._currentLook.x = THREE.MathUtils.damp(this._currentLook.x, this._camTargetLook.x, 7.0, dt);
          this._currentLook.y = THREE.MathUtils.damp(this._currentLook.y, this._camTargetLook.y, 7.0, dt);
          this._currentLook.z = THREE.MathUtils.damp(this._currentLook.z, this._camTargetLook.z, 7.0, dt);
          this.camera.lookAt(this._currentLook);
        }
      } else if (this.mode === InteractionMode.DOOR) {
        // Camera holds steady cinematic composition while door opens/closes
        if (this.camera) {
          this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._camTargetPos.x, 8.0, dt);
          this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._camTargetPos.y, 8.0, dt);
          this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._camTargetPos.z, 8.0, dt);
          this._currentLook.copy(this._camTargetLook);
          this.camera.lookAt(this._camTargetLook);
        }

        // Door finished (real completion callback) -> restore camera and control.
        // Fallback: if the door never reports completion, force it to its final pose.
        if (this._doorDone || rawProgress >= 1.0) {
          if (!this._doorDone) {
            this.logDebug('DOOR_CALLBACK_MISSING_SETTLING');
            this.activeDoorControls?.settle?.();
          }
          this.lifecycleState = InteractionState.RESTORING;
          this.stateClock = 0;
          this.stateDuration = 0.52; // Smooth camera restore blend
          this.watchdogClock = 0;

          if (this.characterRig) {
            this.characterRig.setActionState('IDLE');
          }

          if (this.camera && char) {
            this._camStartPos.copy(this.camera.position);
            this._camStartLook.copy(this._camTargetLook);

            const horizontal = this.savedCameraDistance * Math.cos(this.savedPitch);
            this._camTargetPos.set(
              char.position.x + Math.sin(this.savedYaw) * horizontal,
              char.position.y + 1.4 + Math.sin(this.savedPitch) * this.savedCameraDistance,
              char.position.z + Math.cos(this.savedYaw) * horizontal
            );
            this._camTargetLook.set(char.position.x, char.position.y + 1.25, char.position.z);
          }
          if (this.onStateChange) this.onStateChange(this.lifecycleState);
        }
      }
      return true;
    }

    // ==========================================
    // 3. RESTORING STATE
    // ==========================================
    if (this.lifecycleState === InteractionState.RESTORING) {
      if (char && (this.mode === InteractionMode.SITTING)) {
        const p = this._tempV1.lerpVectors(this._charStartPos, this._charTargetPos, ease);
        this.syncPosition(p.x, p.y, p.z, undefined);
      }

      if (this.camera) {
        this.camera.position.lerpVectors(this._camStartPos, this._camTargetPos, ease);
        this._currentLook.lerpVectors(this._camStartLook, this._camTargetLook, ease);
        this.camera.lookAt(this._currentLook);
      }

      if (rawProgress >= 1.0) {
        // Complete restoration
        if (char && (this.mode === InteractionMode.SITTING)) {
          this.syncPosition(this._charTargetPos.x, this._charTargetPos.y, this._charTargetPos.z, this._charTargetRot);
        }

        // Synchronize main camera controller yaw, pitch, distance
        if (this.onCameraSync) {
          this.onCameraSync(this.savedYaw, this.savedPitch, this.savedCameraDistance);
        }

        this.mode = InteractionMode.NONE;
        this.lifecycleState = InteractionState.IDLE;
        this.activeSeat = null;
        this.activeDoorControls = null;
        this.stateClock = 0;
        this.watchdogClock = 0;

        this.logDebug('RESTORATION_COMPLETED');
        if (this.onStateChange) this.onStateChange(this.lifecycleState);
      }
      return true;
    }

    return false;
  }
}
