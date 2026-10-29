import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, mergeSubtreeMeshes } from './geometry.js';

/**
 * Creates the stylized cartoon character rig with hierarchical articulation:
 * - Root character container & dynamic contact shadow
 * - Torso (knitted tunic, white collar, ribbed hem, crossbody messenger bag)
 * - Head (stylized face, layered haircut, dynamic cowlick tuft, glinting eyes, blush, button nose, warm smile)
 * - Arms with shoulder and elbow joints (sweater sleeves, cuffs, stylized hands with thumbs)
 * - Legs with hip, knee, and ankle joints (white trousers, designer sneakers with rubber soles & toe caps)
 */
export function createCharacter(scene) {
  const character = new THREE.Group();
  character.userData.isDynamic = true;
  scene.add(character);
  character.position.set(0, 1.12, 16.8);

  // Dynamic stylized ground contact shadow blob
  const shadowGeo = new THREE.CircleGeometry(0.55, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1b3026,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = -0.96;
  character.add(shadow);

  // Pelvis / Core base
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0, 0);
  character.add(pelvisGroup);

  // Torso / Sweater Group (swivels with walking and leans forward)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0, 0);
  pelvisGroup.add(torsoGroup);

  // 1. Knitted Tunic Body
  // Main body sphere
  const bodyMesh = addSphere(torsoGroup, [0, 0.08, 0], [0.42, 0.54, 0.35], materials.tunic, { shadow: true });
  // Ribbed waist hem
  addCylinder(torsoGroup, [0, -0.32, 0], 0.35, 0.38, 0.18, materials.tunic, { segments: 18 });
  // Inner white collared shirt neck & collar flaps
  addCylinder(torsoGroup, [0, 0.52, 0], 0.22, 0.26, 0.16, materials.trim, { segments: 16 });
  addBox(torsoGroup, [-0.1, 0.52, 0.18], [0.12, 0.08, 0.14], materials.trim, { rotation: [0.35, -0.2, 0.3] });
  addBox(torsoGroup, [0.1, 0.52, 0.18], [0.12, 0.08, 0.14], materials.trim, { rotation: [0.35, 0.2, -0.3] });

  // 2. Crossbody Leather Messenger Bag with Brass Clasp & Strap
  const strapAngle = 0.58;
  addCylinder(torsoGroup, [0.04, 0.14, 0.02], 0.44, 0.44, 0.08, materials.leatherDark, { rotation: [0.28, 0, strapAngle] });
  // Shoulder pad on right shoulder
  addBox(torsoGroup, [0.28, 0.38, 0.04], [0.14, 0.06, 0.22], materials.leather, { rotation: [0.2, 0, strapAngle] });
  // Leather pouch at left hip
  const bagGroup = new THREE.Group();
  bagGroup.position.set(-0.4, -0.16, 0.16);
  bagGroup.rotation.set(0.12, -0.25, 0.1);
  torsoGroup.add(bagGroup);
  // Main satchel body
  addBox(bagGroup, [0, 0, 0], [0.18, 0.34, 0.3], materials.leather);
  // Flap covering upper half
  addBox(bagGroup, [-0.03, 0.06, 0], [0.14, 0.22, 0.32], materials.leatherDark);
  // Brass buckle clasp
  addBox(bagGroup, [-0.07, -0.04, 0], [0.06, 0.1, 0.1], materials.brass, { shadow: false });
  mergeSubtreeMeshes(torsoGroup, false, true);
  const mergedBodyMesh = torsoGroup.children.find((c) => c.isMesh) || bodyMesh;

  // 3. Head & Face
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.94, 0);
  torsoGroup.add(headGroup);

  // Stylized head with soft peachy skin
  const headMesh = addSphere(headGroup, [0, 0, 0], [0.45, 0.48, 0.43], materials.skin);

  // Stylized Ears
  for (const side of [-1, 1]) {
    const ear = addSphere(headGroup, [side * 0.44, -0.02, 0.02], [0.07, 0.11, 0.09], materials.skin);
    ear.rotation.y = side * 0.25;
    addSphere(headGroup, [side * 0.45, -0.02, 0.03], [0.035, 0.06, 0.05], materials.skinBlush, { shadow: false });
  }

  // Layered Voluminous Chestnut Hair
  // Main rear/top crown volume
  addSphere(headGroup, [0, 0.18, -0.08], [0.48, 0.44, 0.48], materials.hair);
  addSphere(headGroup, [0, 0.35, 0.0], [0.46, 0.28, 0.44], materials.hair);
  addSphere(headGroup, [0, -0.06, -0.22], [0.44, 0.35, 0.32], materials.hair);

  // Front Swept Bangs framing forehead
  addSphere(headGroup, [-0.2, 0.24, 0.32], [0.22, 0.18, 0.18], materials.hair);
  addSphere(headGroup, [0.18, 0.24, 0.32], [0.22, 0.18, 0.18], materials.hair);
  addSphere(headGroup, [0.02, 0.28, 0.37], [0.2, 0.16, 0.16], materials.hair);
  addSphere(headGroup, [-0.1, 0.32, 0.35], [0.18, 0.15, 0.16], materials.hair);

  // Sideburn tufts framing the face
  addSphere(headGroup, [-0.38, 0.08, 0.18], [0.14, 0.25, 0.16], materials.hair, { rotation: [0.1, 0, 0.2] });
  addSphere(headGroup, [0.38, 0.08, 0.18], [0.14, 0.25, 0.16], materials.hair, { rotation: [0.1, 0, -0.2] });

  // Rosy Blush Cheeks
  addSphere(headGroup, [-0.25, -0.07, 0.36], [0.09, 0.05, 0.04], materials.skinBlush, { shadow: false });
  addSphere(headGroup, [0.25, -0.07, 0.36], [0.09, 0.05, 0.04], materials.skinBlush, { shadow: false });

  // Expressive 3D Eyes with Iris Gradient, Pupils & Dual Catchlights
  for (const side of [-1, 1]) {
    const eyeX = side * 0.18;
    // Eye sclera (soft white almond)
    addSphere(headGroup, [eyeX, 0.02, 0.375], [0.085, 0.11, 0.06], materials.trim, { shadow: false });
    // Stylized rich teal iris
    addSphere(headGroup, [eyeX, 0.02, 0.415], [0.062, 0.085, 0.035], materials.iris, { shadow: false });
    // Dark deep pupil
    addSphere(headGroup, [eyeX, 0.02, 0.435], [0.042, 0.06, 0.02], materials.ink, { shadow: false });
    // Primary specular catchlight (top-side sparkle)
    addSphere(headGroup, [eyeX + side * 0.022, 0.05, 0.45], [0.024, 0.024, 0.02], materials.trim, { shadow: false });
    // Secondary micro-catchlight (bottom twinkle)
    addSphere(headGroup, [eyeX - side * 0.015, -0.02, 0.45], [0.012, 0.012, 0.01], materials.trim, { shadow: false });
    // Expressive stylized eyebrow
    addBox(headGroup, [eyeX, 0.15, 0.375], [0.15, 0.035, 0.04], materials.hair, { rotation: [0, 0, side * -0.16] });
  }

  // Cute Button Nose with soft blush
  addSphere(headGroup, [0, -0.07, 0.435], [0.048, 0.042, 0.045], materials.skinBlush, { shadow: false });

  // Warm Friendly Smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.017, 6, 12, Math.PI),
    materials.ink
  );
  smile.position.set(0, -0.175, 0.395);
  smile.rotation.set(0, 0, Math.PI);
  headGroup.add(smile);

  // Dynamic Expressive Cowlick Tuft (ahoge) on top crown
  const hairTuft = new THREE.Group();
  hairTuft.position.set(-0.16, 0.44, 0.06);
  hairTuft.rotation.set(0.15, 0.1, 0.35);
  headGroup.add(hairTuft);
  addSphere(hairTuft, [0, 0.1, 0], [0.11, 0.2, 0.11], materials.hair);
  addSphere(hairTuft, [0.04, 0.24, 0.04], [0.08, 0.14, 0.08], materials.hair, { rotation: [0.2, 0, 0.2] });

  mergeSubtreeMeshes(headGroup, false, true);
  const mergedHeadMesh = headGroup.children.find((c) => c.isMesh) || headMesh;

  // 4. Arms with Articulated Shoulder & Elbow Joints
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.44, 0.36, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.44, 0.36, 0);
  torsoGroup.add(leftArm, rightArm);

  // Left Forearm group
  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.28, 0);

  // Right Forearm group
  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.28, 0);

  // Left & Right Hands
  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.28, 0);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.28, 0);

  // Build arm geometry
  for (const [armGroup, forearmGroup, handGroup, side] of [
    [leftArm, leftForearm, leftHand, -1],
    [rightArm, rightForearm, rightHand, 1],
  ]) {
    // Upper arm sweater sleeve
    addCylinder(armGroup, [0, -0.14, 0], 0.125, 0.115, 0.28, materials.tunic);
    mergeSubtreeMeshes(armGroup, false, true);
    armGroup.add(forearmGroup);

    // Forearm sleeve & ribbed knitted cuff + hand merged into forearm bone
    addCylinder(forearmGroup, [0, -0.12, 0], 0.115, 0.105, 0.24, materials.tunic);
    addCylinder(forearmGroup, [0, -0.24, 0], 0.115, 0.115, 0.06, materials.tunic);
    forearmGroup.add(handGroup);
    addSphere(handGroup, [0, -0.04, 0], [0.085, 0.1, 0.075], materials.skin);
    addSphere(handGroup, [side * 0.055, -0.02, 0.04], [0.038, 0.05, 0.038], materials.skin, {
      rotation: [0.3, side * 0.4, side * 0.3],
    });
    mergeSubtreeMeshes(forearmGroup, false, true);
  }

  // 5. Legs with Articulated Hip, Knee, and Ankle/Foot Joints
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.19, -0.32, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.19, -0.32, 0);
  pelvisGroup.add(leftLeg, rightLeg);

  // Knee joints (lower leg)
  const leftLowerLeg = new THREE.Group();
  leftLowerLeg.position.set(0, -0.3, 0);

  const rightLowerLeg = new THREE.Group();
  rightLowerLeg.position.set(0, -0.3, 0);

  // Sneaker / Shoes
  const leftShoe = new THREE.Group();
  leftShoe.position.set(0, -0.3, 0.05);

  const rightShoe = new THREE.Group();
  rightShoe.position.set(0, -0.3, 0.05);

  for (const [thighGroup, calfGroup, shoeGroup] of [
    [leftLeg, leftLowerLeg, leftShoe],
    [rightLeg, rightLowerLeg, rightShoe],
  ]) {
    // Upper thigh trousers
    addCylinder(thighGroup, [0, -0.15, 0], 0.155, 0.145, 0.3, materials.trousers);
    mergeSubtreeMeshes(thighGroup, false, true);
    thighGroup.add(calfGroup);

    // Lower calf trousers & cuff hem
    addCylinder(calfGroup, [0, -0.14, 0], 0.145, 0.135, 0.28, materials.trousers);
    addCylinder(calfGroup, [0, -0.27, 0], 0.145, 0.145, 0.06, materials.trousers);
    mergeSubtreeMeshes(calfGroup, false, true);
    calfGroup.add(shoeGroup);

    // Designer Sneaker
    addBox(shoeGroup, [0, 0.05, 0.02], [0.22, 0.13, 0.36], materials.sneakerCoral);
    addBox(shoeGroup, [0, 0.09, 0.04], [0.14, 0.06, 0.2], materials.trim);
    addBox(shoeGroup, [0, 0.12, 0.06], [0.12, 0.02, 0.14], materials.trim);
    addBox(shoeGroup, [0, -0.03, 0.03], [0.24, 0.06, 0.39], materials.sneakerSole);
    addBox(shoeGroup, [0, -0.065, 0.03], [0.245, 0.03, 0.4], materials.leatherDark);
    addSphere(shoeGroup, [0, 0.02, 0.18], [0.115, 0.08, 0.095], materials.sneakerSole);
    addBox(shoeGroup, [0, 0.06, -0.14], [0.2, 0.09, 0.06], materials.trim);
    mergeSubtreeMeshes(shoeGroup, false, true);
  }

  const rig = {
    character,
    shadow,
    bodyMesh: mergedBodyMesh,
    torsoGroup,
    pelvisGroup,
    headGroup,
    headMesh: mergedHeadMesh,
    hairTuft,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftShoe,
    rightShoe,
    state: {
      smoothedSpeed: 0,
      walkPhase: 0,
      idlePhase: 0,
      bankAngle: 0,
      squash: 1.0,
      lastGrounded: true,
      lastYaw: 0,
      actionState: 'IDLE',
      actionWeight: 0,
      targetActionWeight: 0,
      targetHeadPitch: 0,
      targetHeadYaw: 0,
    },
    setActionState: (action, options = {}) => {
      const s = rig.state;
      s.actionState = action;
      s.targetActionWeight = action === 'IDLE' ? 0 : 1;
      if (options.headPitch !== undefined) s.targetHeadPitch = options.headPitch;
      if (options.headYaw !== undefined) s.targetHeadYaw = options.headYaw;
    },
  };
  return rig;
}

/**
 * Procedural animation engine for stylized locomotion:
 * - Seamless blended states: Idle, Walk, Sprint
 * - Velocity-synchronized walk phase: feet never slide regardless of framerate
 * - Dual-joint kinematics: knee flexion lifts feet above ground; elbows pump naturally
 * - Torso lean, pelvis counter-rotation, vertical stride bob
 * - Dynamic hair tuft inertia and banking into turns
 * - Soft landing squash & contact shadow scaling
 */
export function updateCharacterRig(rig, dt, elapsed, moveAmount, grounded) {
  const {
    character,
    shadow,
    torsoGroup,
    pelvisGroup,
    headGroup,
    hairTuft,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftShoe,
    rightShoe,
    state,
  } = rig;

  // 1. Smooth locomotion speed parameter (accelerates & decelerates naturally)
  state.smoothedSpeed = THREE.MathUtils.damp(state.smoothedSpeed, moveAmount, 10.5, dt);
  const isMoving = state.smoothedSpeed > 0.04;
  const isSprinting = state.smoothedSpeed > 1.15;

  // 2. Continuous time-based walk phase accumulation
  // Frequency scales with speed so feet stay synchronized with world translation
  const baseCadence = isSprinting ? 14.8 : 10.2;
  const stepSpeedFactor = THREE.MathUtils.clamp(state.smoothedSpeed, 0.35, 1.6);
  if (isMoving) {
    state.walkPhase += dt * baseCadence * stepSpeedFactor;
  }

  const phase = state.walkPhase;
  const walkWeight = THREE.MathUtils.clamp(state.smoothedSpeed / 1.0, 0, 1);
  const sprintWeight = THREE.MathUtils.clamp((state.smoothedSpeed - 1.0) / 0.5, 0, 1);

  // 3. Grounded vs Air/Jump Detection & Squash Feedback
  if (!state.lastGrounded && grounded) {
    // Just landed: trigger landing squash
    state.squash = 0.90;
  }
  state.lastGrounded = grounded;
  state.squash = THREE.MathUtils.damp(state.squash, 1.0, 9.0, dt);

  // Apply squash & stretch to pelvis
  pelvisGroup.scale.set(
    1 / Math.sqrt(state.squash),
    state.squash,
    1 / Math.sqrt(state.squash)
  );

  // 4. Ground Contact Shadow Dynamic Scaling
  if (grounded) {
    shadow.scale.setScalar(1.0 + (1.0 - state.squash) * 0.5);
    shadow.material.opacity = 0.32;
  } else {
    // In air: shadow shrinks and softens
    shadow.scale.setScalar(0.72);
    shadow.material.opacity = 0.16;
  }

  // 5. Locomotion Logic
  if (isMoving && grounded) {
    const swingSin = Math.sin(phase);
    const swingCos = Math.cos(phase);

    // Stride amplitude
    const strideAmp = THREE.MathUtils.lerp(0.58, 0.88, sprintWeight) * walkWeight;

    // --- LEGS ---
    // Hip rotation (thigh forward/backward swing)
    leftLeg.rotation.x = swingSin * strideAmp;
    rightLeg.rotation.x = -swingSin * strideAmp;

    // Knee flexion: when leg swings forward, knee bends backward to lift foot cleanly over ground
    const leftForwardSwing = -swingSin;
    const rightForwardSwing = swingSin;
    leftLowerLeg.rotation.x = Math.max(0, leftForwardSwing) * (0.85 * walkWeight + 0.35 * sprintWeight);
    rightLowerLeg.rotation.x = Math.max(0, rightForwardSwing) * (0.85 * walkWeight + 0.35 * sprintWeight);

    // Ankle flexion: heel strike to toe push-off
    leftShoe.rotation.x = swingSin * -0.22 * walkWeight;
    rightShoe.rotation.x = -swingSin * -0.22 * walkWeight;

    // --- ARMS ---
    // Arm counter-swing (opposite to leg)
    const armAmp = THREE.MathUtils.lerp(0.52, 0.82, sprintWeight) * walkWeight;
    leftArm.rotation.x = -swingSin * armAmp;
    rightArm.rotation.x = swingSin * armAmp;

    // Elbow flexion: bends forward on upswing and during sprint pump
    const leftArmForward = -swingSin;
    const rightArmForward = swingSin;
    leftForearm.rotation.x = THREE.MathUtils.lerp(0.12, 0.45, sprintWeight) + Math.max(0, leftArmForward) * 0.42 * walkWeight;
    rightForearm.rotation.x = THREE.MathUtils.lerp(0.12, 0.45, sprintWeight) + Math.max(0, rightArmForward) * 0.42 * walkWeight;

    // Natural resting outward arm flare
    leftArm.rotation.z = 0.12 + sprintWeight * 0.08;
    rightArm.rotation.z = -0.12 - sprintWeight * 0.08;

    // --- TORSO ---
    // Forward lean into movement
    const forwardLean = THREE.MathUtils.lerp(0.08, 0.22, sprintWeight) * walkWeight;
    torsoGroup.rotation.x = forwardLean;

    // Pelvis counter-rotation (hip swivel)
    torsoGroup.rotation.y = swingSin * 0.08 * walkWeight;

    // Vertical step bounce (2 bobs per full stride cycle)
    const stepBob = Math.abs(swingSin) * 0.045 * walkWeight;
    torsoGroup.position.y = stepBob;

    // --- HEAD & HAIR ---
    // Head stabilizes against bounce and keeps focus forward
    headGroup.position.y = 0.94 - stepBob * 0.5;
    headGroup.rotation.x = -forwardLean * 0.65;
    headGroup.rotation.z = Math.sin(phase * 0.5) * 0.035 * walkWeight;

    // Hair tuft responds to inertia (bends back with speed, bobs with steps)
    hairTuft.rotation.x = 0.15 - state.smoothedSpeed * 0.16 + Math.sin(phase * 2 - 0.5) * 0.06;
  } else if (!grounded) {
    // --- AIR / JUMPING STATE ---
    // Legs tuck slightly
    leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0.22, 6.0, dt);
    rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0.28, 6.0, dt);
    leftLowerLeg.rotation.x = THREE.MathUtils.damp(leftLowerLeg.rotation.x, 0.35, 6.0, dt);
    rightLowerLeg.rotation.x = THREE.MathUtils.damp(rightLowerLeg.rotation.x, 0.42, 6.0, dt);
    leftShoe.rotation.x = THREE.MathUtils.damp(leftShoe.rotation.x, -0.2, 6.0, dt);
    rightShoe.rotation.x = THREE.MathUtils.damp(rightShoe.rotation.x, -0.2, 6.0, dt);

    // Arms spread out for balance
    leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, -0.25, 6.0, dt);
    rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -0.25, 6.0, dt);
    leftArm.rotation.z = THREE.MathUtils.damp(leftArm.rotation.z, 0.38, 6.0, dt);
    rightArm.rotation.z = THREE.MathUtils.damp(rightArm.rotation.z, -0.38, 6.0, dt);

    torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, -0.06, 6.0, dt);
    torsoGroup.position.y = THREE.MathUtils.damp(torsoGroup.position.y, 0, 6.0, dt);
  } else {
    // --- IDLE STATE (Smooth Breathing, Relaxed Stance & Micro-Gaze) ---
    state.idlePhase += dt * 2.2;
    const idleSin = Math.sin(state.idlePhase);
    const idleSlowSin = Math.sin(state.idlePhase * 0.35);

    // Return legs cleanly to upright grounded stance
    leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10.0, dt);
    rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10.0, dt);
    leftLowerLeg.rotation.x = THREE.MathUtils.damp(leftLowerLeg.rotation.x, 0, 10.0, dt);
    rightLowerLeg.rotation.x = THREE.MathUtils.damp(rightLowerLeg.rotation.x, 0, 10.0, dt);
    leftShoe.rotation.x = THREE.MathUtils.damp(leftShoe.rotation.x, 0, 10.0, dt);
    rightShoe.rotation.x = THREE.MathUtils.damp(rightShoe.rotation.x, 0, 10.0, dt);

    // Arms relax at sides with gentle breathing sway
    leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, idleSin * 0.03, 7.0, dt);
    rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -idleSin * 0.03, 7.0, dt);
    leftArm.rotation.z = THREE.MathUtils.damp(leftArm.rotation.z, 0.11, 7.0, dt);
    rightArm.rotation.z = THREE.MathUtils.damp(rightArm.rotation.z, -0.11, 7.0, dt);
    leftForearm.rotation.x = THREE.MathUtils.damp(leftForearm.rotation.x, 0.06, 7.0, dt);
    rightForearm.rotation.x = THREE.MathUtils.damp(rightForearm.rotation.x, 0.06, 7.0, dt);

    // Torso breathing rise/fall
    torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, idleSin * 0.015, 6.0, dt);
    torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0, 8.0, dt);
    torsoGroup.position.y = THREE.MathUtils.damp(torsoGroup.position.y, idleSin * 0.012, 6.0, dt);

    // Head subtle natural breathing nod and occasional look-around scanning
    headGroup.position.y = 0.94 + idleSin * 0.01;
    headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, idleSin * 0.02, 6.0, dt);
    headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, idleSlowSin * 0.06, 3.0, dt);
    headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, 0, 6.0, dt);

    // Hair tuft gentle breeze sway
    hairTuft.rotation.x = THREE.MathUtils.damp(hairTuft.rotation.x, 0.15 + idleSin * 0.04, 5.0, dt);
  }

  // 6. Action Pose Layer (Sitting, Inspecting, Desk Typing, Door Reaching, Presenting)
  state.actionWeight = THREE.MathUtils.damp(state.actionWeight, state.targetActionWeight, 8.5, dt);
  const aw = state.actionWeight;

  if (aw > 0.005) {
    if (state.actionState === 'SITTING') {
      // Pelvis lowers to chair seat height
      pelvisGroup.position.y = THREE.MathUtils.lerp(pelvisGroup.position.y, -0.42, aw);
      // Thighs rotate forward with relaxed outward hip splay (abduction)
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, -1.50, aw);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -1.50, aw);
      leftLeg.rotation.z = THREE.MathUtils.lerp(leftLeg.rotation.z, 0.08, aw);
      rightLeg.rotation.z = THREE.MathUtils.lerp(rightLeg.rotation.z, -0.08, aw);
      // Knees bend with natural forward calf slant (~4.5 deg forward) so calves clear furniture frames
      leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 1.42, aw);
      rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 1.42, aw);
      // Sneaker soles level with floor
      leftShoe.rotation.x = THREE.MathUtils.lerp(leftShoe.rotation.x, 0.08, aw);
      rightShoe.rotation.x = THREE.MathUtils.lerp(rightShoe.rotation.x, 0.08, aw);
      leftShoe.rotation.z = THREE.MathUtils.lerp(leftShoe.rotation.z, -0.08, aw);
      rightShoe.rotation.z = THREE.MathUtils.lerp(rightShoe.rotation.z, 0.08, aw);
      // Hands rest gently on thighs, clearing armrests
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.24, aw);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.24, aw);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.12, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.12, aw);
      leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, 0.65, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.65, aw);
      leftForearm.rotation.y = THREE.MathUtils.lerp(leftForearm.rotation.y, -0.16, aw);
      rightForearm.rotation.y = THREE.MathUtils.lerp(rightForearm.rotation.y, 0.16, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -0.04, aw);
    } else if (state.actionState === 'INSPECTING') {
      // Hand near chin / thinking pose
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.65, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 1.25, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.25, aw);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.1, aw);
      // Head tilts up/down or turns toward object
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, state.targetHeadPitch, aw);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, state.targetHeadYaw, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08, aw);
    } else if (state.actionState === 'WORKING_DESK') {
      // Complete seated pose at desk (pelvis lowered, thighs forward, calves clearing chair base)
      pelvisGroup.position.y = THREE.MathUtils.lerp(pelvisGroup.position.y, -0.42, aw);
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, -1.50, aw);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -1.50, aw);
      leftLeg.rotation.z = THREE.MathUtils.lerp(leftLeg.rotation.z, 0.08, aw);
      rightLeg.rotation.z = THREE.MathUtils.lerp(rightLeg.rotation.z, -0.08, aw);
      leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 1.42, aw);
      rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 1.42, aw);
      leftShoe.rotation.x = THREE.MathUtils.lerp(leftShoe.rotation.x, 0.08, aw);
      rightShoe.rotation.x = THREE.MathUtils.lerp(rightShoe.rotation.x, 0.08, aw);
      leftShoe.rotation.z = THREE.MathUtils.lerp(leftShoe.rotation.z, -0.08, aw);
      rightShoe.rotation.z = THREE.MathUtils.lerp(rightShoe.rotation.z, 0.08, aw);

      // Upper body: Arms forward over keyboard, typing animation, focused head tilt
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.72, aw);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.72, aw);
      leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, 0.58, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.58, aw);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.14, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.14, aw);
      leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, Math.sin(elapsed * 12) * 0.12, aw);
      rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, Math.sin(elapsed * 12 + Math.PI) * 0.12, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08, aw);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.14, aw);
    } else if (state.actionState === 'DOOR_REACH') {
      // Right hand extends to door handle
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.05, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.32, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.18, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08, aw);
    } else if (state.actionState === 'PRESENTING') {
      // Open hand gesture towards display
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.58, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.52, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.38, aw);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.15, aw);
    }
  } else if (state.targetActionWeight === 0) {
    pelvisGroup.position.y = THREE.MathUtils.damp(pelvisGroup.position.y, 0, 10.0, dt);
  }

  // 7. Turning & Banking (Leaning into sharp turns)
  const currentYaw = character.rotation.y;
  let yawDelta = currentYaw - state.lastYaw;
  // Normalize delta to [-PI, PI]
  yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
  state.lastYaw = currentYaw;

  const targetBank = isMoving ? THREE.MathUtils.clamp(-yawDelta * 3.5, -0.14, 0.14) : 0;
  state.bankAngle = THREE.MathUtils.damp(state.bankAngle, targetBank, 8.0, dt);
  character.rotation.z = state.bankAngle;
}
