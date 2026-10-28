import * as THREE from 'three';

/**
 * CameraController - Manages third-person follow camera, occlusion raycasting,
 * indoor ceiling clamping, orbit angles, and overview/aerial mode.
 * Adheres to Single Responsibility Principle (SRP) and High Performance rendering guidelines.
 */
export class CameraController {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.cameraBlockers = options.cameraBlockers || [];
    this.roofGroup = options.roofGroup || null;

    // Orbit state
    this.yaw = options.yaw || 0;
    this.pitch = options.pitch || 0.35;
    this.userZoom = 1.0;
    this.cameraDistance = 6.8;
    this.cameraDistanceGoal = 6.8;
    this.cameraSafeDistance = 6.8;
    this.lastCollisionCheck = 0;

    // Overview / Aerial Map mode
    this.overviewMode = false;
    this.overviewCamPos = new THREE.Vector3(0, 48, 62);
    this.overviewTarget = new THREE.Vector3(0, 0, 8);
    this.teleportOverride = null;

    // Reusable Three.js vectors & raycaster for zero garbage collection
    this.raycaster = new THREE.Raycaster();
    this.rayHits = [];
    this.cameraOrigin = new THREE.Vector3();
    this.cameraDesired = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();
    this.dampVector = new THREE.Vector3();
    this.lookPoint = new THREE.Vector3();
  }

  setRoofGroup(group) {
    this.roofGroup = group;
  }

  setBlockers(blockers) {
    this.cameraBlockers = blockers;
  }

  setOverview(enabled) {
    this.overviewMode = enabled;
  }

  setTeleportOverride(override) {
    this.teleportOverride = override;
  }

  rotate(deltaYaw, deltaPitch) {
    this.yaw += deltaYaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch + deltaPitch, -0.42, 0.88);
  }

  zoom(delta) {
    this.userZoom = THREE.MathUtils.clamp(this.userZoom + delta, 0.45, 2.2);
  }

  isInsideHouse(x, z) {
    return z <= 3.8 && z >= -8.0 && x >= -16.5 && x <= 26.0;
  }

  /**
   * Main camera update invoked every frame.
   * @param {number} dt Delta time in seconds
   * @param {number} timestamp Current performance timestamp in ms
   * @param {object} playerPos { x, y, z } Character position
   * @param {object} activeStates { panelOpen, settingsOpen, tourActive, cinematicActive, interactionActive }
   * @param {Set} keys Active key set
   */
  update(dt, timestamp, playerPos, activeStates = {}, keys = null) {
    const { x: physX, y: physY, z: physZ } = playerPos;
    const inHouse = this.isInsideHouse(physX, physZ);

    if (this.roofGroup) {
      this.roofGroup.visible = this.overviewMode ? true : !inHouse;
    }

    if (activeStates.cinematicActive || activeStates.interactionActive) {
      return;
    }

    if (this.teleportOverride) {
      this.camera.position.set(
        this.teleportOverride.cam[0],
        this.teleportOverride.cam[1],
        this.teleportOverride.cam[2]
      );
      this.camera.lookAt(
        this.teleportOverride.target[0],
        this.teleportOverride.target[1],
        this.teleportOverride.target[2]
      );
      return;
    }

    if (this.overviewMode) {
      if (this.roofGroup) this.roofGroup.visible = true;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.overviewCamPos.x, 5.0, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.overviewCamPos.y, 5.0, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.overviewCamPos.z, 5.0, dt);
      this.lookPoint.x = THREE.MathUtils.damp(this.lookPoint.x, this.overviewTarget.x, 6.0, dt);
      this.lookPoint.y = THREE.MathUtils.damp(this.lookPoint.y, this.overviewTarget.y, 6.0, dt);
      this.lookPoint.z = THREE.MathUtils.damp(this.lookPoint.z, this.overviewTarget.z, 6.0, dt);
      this.camera.lookAt(this.lookPoint);
      return;
    }

    const isPortrait = this.camera.aspect < 1.0;
    const baseDistance = inHouse ? (isPortrait ? 3.2 : 3.4) : (isPortrait ? 7.6 : 6.8);
    this.cameraDistanceGoal = baseDistance * this.userZoom;

    const targetY = physY + (isPortrait ? 1.35 : 1.25);
    this.cameraTarget.set(physX, targetY, physZ);

    // Dynamic pitch boundaries
    const maxPitch = inHouse ? 0.82 : 0.92;
    const minPitch = inHouse ? -0.38 : -0.52;
    this.pitch = THREE.MathUtils.clamp(this.pitch, minPitch, maxPitch);

    // Keyboard rotation controls (Q, [, ], PageUp, PageDown)
    if (keys && !activeStates.panelOpen && !activeStates.settingsOpen && !activeStates.tourActive) {
      if (keys.has('KeyQ')) this.yaw += 2.4 * dt;
      if (keys.has('BracketLeft')) this.yaw += 2.4 * dt;
      if (keys.has('BracketRight')) this.yaw -= 2.4 * dt;
      if (keys.has('PageUp')) this.pitch = THREE.MathUtils.clamp(this.pitch + 1.6 * dt, minPitch, maxPitch);
      if (keys.has('PageDown')) this.pitch = THREE.MathUtils.clamp(this.pitch - 1.6 * dt, minPitch, maxPitch);
    }

    // Over-the-shoulder offset for cinematic depth
    const horizontal = this.cameraDistance * Math.cos(this.pitch);
    const shoulderOffset = isPortrait ? 0 : 0.22;
    const shoulderX = Math.cos(this.yaw) * shoulderOffset;
    const shoulderZ = -Math.sin(this.yaw) * shoulderOffset;

    this.cameraDesired.set(
      physX + Math.sin(this.yaw) * horizontal + shoulderX,
      physY + (inHouse ? 1.38 : 1.52) + Math.sin(this.pitch) * this.cameraDistance,
      physZ + Math.cos(this.yaw) * horizontal + shoulderZ
    );

    // Ceiling height adaptation: Floor 1 (max 3.8m) vs Floor 2 (max 10.2m)
    if (inHouse) {
      const isUpperFloor = physY > 3.0;
      const minCamY = isUpperFloor ? 5.5 : 0.8;
      const maxCamY = isUpperFloor ? 10.2 : 3.8;
      this.cameraDesired.y = THREE.MathUtils.clamp(this.cameraDesired.y, minCamY, maxCamY);
    }

    const dx = this.cameraDesired.x - this.cameraTarget.x;
    const dy = this.cameraDesired.y - this.cameraTarget.y;
    const dz = this.cameraDesired.z - this.cameraTarget.z;
    const desiredDistance = Math.hypot(dx, dy, dz);
    this.dampVector.set(dx, dy, dz).normalize();

    // Collision raycasting throttled to ~30Hz to prevent main-thread bottleneck
    if (timestamp - this.lastCollisionCheck > 32) {
      this.lastCollisionCheck = timestamp;
      this.cameraOrigin.copy(this.cameraTarget);
      this.raycaster.set(this.cameraTarget, this.dampVector);
      this.raycaster.far = desiredDistance;
      this.raycaster.intersectObjects(this.cameraBlockers, false, this.rayHits);
      this.cameraSafeDistance = this.rayHits.length ? Math.max(1.8, this.rayHits[0].distance - 0.35) : desiredDistance;
      this.rayHits.length = 0;
    }

    const effectiveDistance = Math.min(this.cameraSafeDistance, desiredDistance);
    const dampSpeed = this.cameraSafeDistance < this.cameraDistance ? 16.0 : 5.0;
    this.cameraDistance = THREE.MathUtils.damp(this.cameraDistance, effectiveDistance, dampSpeed, dt);

    this.cameraDesired.copy(this.cameraTarget).addScaledVector(this.dampVector, this.cameraDistance);
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.cameraDesired.x, 9.0, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.cameraDesired.y, 9.0, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.cameraDesired.z, 9.0, dt);

    this.lookPoint.copy(this.cameraTarget);
    this.lookPoint.y += 0.22;
    this.camera.lookAt(this.lookPoint);
  }
}

