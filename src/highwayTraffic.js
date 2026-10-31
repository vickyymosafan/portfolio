import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder } from './geometry.js';

// Dedicated Traffic Signal & Vehicle Materials with high-visibility illumination
const trafficMats = {
  housing: new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.5, metalness: 0.6 }),
  backingBoard: new THREE.MeshStandardMaterial({ color: 0x0d1013, roughness: 0.7, metalness: 0.3 }),
  borderYellow: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }),
  redOn: new THREE.MeshBasicMaterial({ color: 0xff2828 }),
  redOff: new THREE.MeshStandardMaterial({ color: 0x3d0808, roughness: 0.85 }),
  yellowOn: new THREE.MeshBasicMaterial({ color: 0xffb800 }),
  yellowOff: new THREE.MeshStandardMaterial({ color: 0x3d2c08, roughness: 0.85 }),
  greenOn: new THREE.MeshBasicMaterial({ color: 0x10e060 }),
  greenOff: new THREE.MeshStandardMaterial({ color: 0x083818, roughness: 0.85 }),
  pedRedOn: new THREE.MeshBasicMaterial({ color: 0xff3838 }),
  pedGreenOn: new THREE.MeshBasicMaterial({ color: 0x22dd77 }),
  pedOff: new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.85 }),
  taxiYellow: new THREE.MeshStandardMaterial({ color: 0xf5b51b, roughness: 0.22, metalness: 0.15 }),
  coupeRed: new THREE.MeshStandardMaterial({ color: 0xdf2525, roughness: 0.18, metalness: 0.28 }),
  sedanBlue: new THREE.MeshStandardMaterial({ color: 0x1d58b0, roughness: 0.18, metalness: 0.35 }),
  scooterMint: new THREE.MeshStandardMaterial({ color: 0x48bca6, roughness: 0.25, metalness: 0.12 }),
  scooterOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.25, metalness: 0.15 }),
  scooterCyan: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.25, metalness: 0.15 }),
  headlightLens: new THREE.MeshBasicMaterial({ color: 0xfffae6 }),
  taillightLens: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  brakeLightOn: new THREE.MeshBasicMaterial({ color: 0xff0808 }),
  brakeLightOff: new THREE.MeshStandardMaterial({ color: 0x5a0a0a, roughness: 0.65 }),
};

/**
 * Builds a stylized driver character seated inside a car with animated steering & head.
 */
function buildCarDriver(parent, [dx, dy, dz], options = {}) {
  const driverGroup = new THREE.Group();
  driverGroup.position.set(dx, dy, dz);
  parent.add(driverGroup);

  const shirtMat = options.shirtMat || materials.clothingNavy;
  const hairMat = options.hairMat || materials.hairDark;

  // Driver bucket seat
  addBox(driverGroup, [0, -0.15, -0.05], [0.46, 0.14, 0.46], materials.leatherDark);
  addBox(driverGroup, [0, 0.15, -0.25], [0.44, 0.50, 0.12], materials.leatherDark);
  addBox(driverGroup, [0, 0.44, -0.23], [0.24, 0.16, 0.10], materials.leatherDark);

  // Torso group for breathing
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.12, -0.10);
  driverGroup.add(torsoGroup);
  addBox(torsoGroup, [0, 0, 0], [0.38, 0.36, 0.22], shirtMat);
  addBox(torsoGroup, [0, 0.16, 0.08], [0.16, 0.05, 0.08], materials.clothingWhite);

  // Steering wheel group (rotates with steering animation)
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 0.20, 0.21);
  wheelGroup.rotation.x = -0.45;
  driverGroup.add(wheelGroup);
  addCylinder(wheelGroup, [0, 0, 0], 0.15, 0.15, 0.025, materials.metalDark, { segments: 16 });
  addCylinder(wheelGroup, [0, 0, -0.06], 0.025, 0.025, 0.14, materials.chrome, { rotation: [Math.PI * 0.5, 0, 0] });
  addBox(wheelGroup, [0, 0, 0], [0.28, 0.03, 0.02], materials.metalDark);

  // Arms reaching to steering wheel
  const leftArm = addCylinder(torsoGroup, [-0.15, 0.02, 0.16], 0.045, 0.05, 0.28, shirtMat, { rotation: [1.1, 0, -0.2] });
  const rightArm = addCylinder(torsoGroup, [0.15, 0.02, 0.16], 0.045, 0.05, 0.28, shirtMat, { rotation: [1.1, 0, 0.2] });
  // Hands on wheel
  addSphere(torsoGroup, [-0.12, 0.06, 0.29], [0.04, 0.04, 0.04], materials.skin);
  addSphere(torsoGroup, [0.12, 0.06, 0.29], [0.04, 0.04, 0.04], materials.skin);

  // Head group for looking around / glancing at mirrors
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.45, -0.08);
  driverGroup.add(headGroup);

  addCylinder(headGroup, [0, -0.12, 0], 0.055, 0.06, 0.08, materials.skin);
  addSphere(headGroup, [0, 0, 0], [0.12, 0.14, 0.12], materials.skin);
  // Hair / Cap
  if (options.hasCap) {
    addSphere(headGroup, [0, 0.03, 0], [0.13, 0.12, 0.13], materials.clothingRed);
    addBox(headGroup, [0, 0.01, 0.14], [0.16, 0.025, 0.14], materials.clothingRed);
  } else {
    addSphere(headGroup, [0, 0.05, -0.01], [0.135, 0.11, 0.135], hairMat);
    addSphere(headGroup, [0, 0.04, 0.06], [0.12, 0.06, 0.08], hairMat);
  }
  // Sunglasses
  addBox(headGroup, [0, 0.00, 0.11], [0.18, 0.045, 0.03], materials.metalDark);

  return { driverGroup, torsoGroup, headGroup, wheelGroup, leftArm, rightArm };
}

/**
 * Builds a stylized motorcycle rider with articulated left leg (plants foot when stopped).
 */
function buildMotorcycleRider(parent, [rx, ry, rz], options = {}) {
  const riderGroup = new THREE.Group();
  riderGroup.position.set(rx, ry, rz);
  parent.add(riderGroup);

  const jacketMat = options.jacketMat || materials.leatherDark;
  const helmetMat = options.helmetMat || (options.isRetro ? trafficMats.scooterMint : materials.m4GlossBlack);
  const pantsMat = materials.clothingNavy;

  // Left Leg (Articulated hip joint for planting foot firmly on asphalt when stopped!)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.28, -0.06);
  riderGroup.add(leftLeg);
  // Upper thigh
  addCylinder(leftLeg, [0, 0, 0], 0.065, 0.07, 0.32, pantsMat, { rotation: [0.75, 0, -0.2] });
  // Lower leg
  addCylinder(leftLeg, [-0.02, -0.20, -0.10], 0.055, 0.06, 0.30, pantsMat, { rotation: [-0.65, 0, 0] });
  // Boot
  addBox(leftLeg, [-0.02, -0.34, -0.06], [0.08, 0.09, 0.18], materials.metalDark);

  // Right Leg (rests securely on footpeg)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.28, -0.06);
  riderGroup.add(rightLeg);
  addCylinder(rightLeg, [0, 0, 0], 0.065, 0.07, 0.32, pantsMat, { rotation: [0.75, 0, 0.2] });
  addCylinder(rightLeg, [0.02, -0.20, -0.10], 0.055, 0.06, 0.30, pantsMat, { rotation: [-0.65, 0, 0] });
  addBox(rightLeg, [0.02, -0.34, -0.06], [0.08, 0.09, 0.18], materials.metalDark);

  // Torso (leaning forward in active posture)
  const leanAngle = options.isRetro ? 0.16 : 0.40;
  const torso = new THREE.Group();
  torso.position.set(0, 0.38, -0.08);
  torso.rotation.x = leanAngle;
  riderGroup.add(torso);

  addBox(torso, [0, 0.18, 0], [0.36, 0.38, 0.22], jacketMat);
  // Jacket decorative center stripe
  addBox(torso, [0, 0.18, 0.115], [0.06, 0.36, 0.015], materials.coral);

  // Arms reaching down & forward to handlebars
  addCylinder(torso, [-0.16, 0.22, 0.14], 0.045, 0.05, 0.34, jacketMat, { rotation: [0.95, 0, -0.25] });
  addCylinder(torso, [0.16, 0.22, 0.14], 0.045, 0.05, 0.34, jacketMat, { rotation: [0.95, 0, 0.25] });
  // Gloved hands
  addSphere(torso, [-0.14, 0.10, 0.32], [0.045, 0.045, 0.045], materials.metalDark);
  addSphere(torso, [0.14, 0.10, 0.32], [0.045, 0.045, 0.045], materials.metalDark);

  // Neck
  addCylinder(torso, [0, 0.40, 0.02], 0.055, 0.06, 0.09, materials.skin);

  // Head / Helmet (for active scanning & road nod)
  const helmet = new THREE.Group();
  helmet.position.set(0, 0.52, 0.04);
  torso.add(helmet);

  addSphere(helmet, [0, 0, 0], [0.16, 0.17, 0.17], helmetMat, { smooth: true });
  addBox(helmet, [0, -0.08, 0.10], [0.18, 0.09, 0.14], helmetMat);
  addBox(helmet, [0, 0.01, 0.14], [0.20, 0.08, 0.06], materials.metalDark);
  addCylinder(helmet, [0, 0.01, 0.14], 0.11, 0.11, 0.07, materials.chrome, { rotation: [Math.PI * 0.5, 0, 0], segments: 14 });

  return { riderGroup, torso, helmet, leftLeg, rightLeg, leanAngle };
}

/**
 * Builds a dynamic animated highway car with rotating wheels, solid framed roof, and driver.
 */
function buildTrafficCar(type = 'sedan', colorMat) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const wheels = [];
  const brakeLights = [];
  const wheelRadius = type === 'suv' ? 0.38 : 0.32;
  const wheelWidth = type === 'suv' ? 0.26 : 0.22;
  let carLen = 4.4;
  let carW = 1.95;
  let trackW = 1.60;
  let wheelbase = 2.6;
  let driverRig;

  if (type === 'sports') {
    carLen = 4.3;
    carW = 1.92;
    wheelbase = 2.5;

    // Aerodynamic low-slung chassis
    addBox(bodyGroup, [0, 0.32, 0], [carW, 0.24, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.52, 0], [carW - 0.06, 0.32, carLen - 0.1], trafficMats.coupeRed);
    addBox(bodyGroup, [0, 0.56, 1.25], [carW - 0.15, 0.20, 1.4], trafficMats.coupeRed);

    // Cabin glass
    addBox(bodyGroup, [0, 0.96, -0.1], [carW - 0.26, 0.50, 2.0], materials.carGlass);

    // Solid Pillars & Roof
    addBox(bodyGroup, [-0.80, 0.94, 0.72], [0.08, 0.52, 0.10], trafficMats.coupeRed, { rotation: [-0.44, 0, 0] });
    addBox(bodyGroup, [0.80, 0.94, 0.72], [0.08, 0.52, 0.10], trafficMats.coupeRed, { rotation: [-0.44, 0, 0] });
    addBox(bodyGroup, [-0.80, 0.94, -0.82], [0.10, 0.52, 0.12], trafficMats.coupeRed, { rotation: [0.38, 0, 0] });
    addBox(bodyGroup, [0.80, 0.94, -0.82], [0.10, 0.52, 0.12], trafficMats.coupeRed, { rotation: [0.38, 0, 0] });
    // Solid roof
    addBox(bodyGroup, [0, 1.22, -0.12], [carW - 0.22, 0.10, 1.65], trafficMats.coupeRed);

    // Rear sports spoiler
    addBox(bodyGroup, [0, 0.78, -1.95], [carW - 0.3, 0.05, 0.24], materials.carbonFiber);
    addBox(bodyGroup, [-0.6, 0.70, -1.95], [0.06, 0.16, 0.06], materials.metalDark);
    addBox(bodyGroup, [0.6, 0.70, -1.95], [0.06, 0.16, 0.06], materials.metalDark);

    // Headlights & Taillights
    addBox(bodyGroup, [-0.68, 0.55, 2.05], [0.32, 0.10, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.68, 0.55, 2.05], [0.32, 0.10, 0.06], trafficMats.headlightLens);
    const b1 = addBox(bodyGroup, [-0.60, 0.62, -2.12], [0.26, 0.12, 0.06], trafficMats.taillightLens);
    const b2 = addBox(bodyGroup, [0.60, 0.62, -2.12], [0.26, 0.12, 0.06], trafficMats.taillightLens);
    brakeLights.push(b1, b2);

    driverRig = buildCarDriver(bodyGroup, [-0.35, 0.48, -0.1], { shirtMat: materials.coral });
  } else if (type === 'taxi') {
    carLen = 4.2;
    carW = 1.85;
    wheelbase = 2.45;

    // Compact city taxi body
    addBox(bodyGroup, [0, 0.34, 0], [carW, 0.26, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.58, 0], [carW - 0.05, 0.36, carLen - 0.1], trafficMats.taxiYellow);
    addBox(bodyGroup, [0, 0.62, 1.2], [carW - 0.15, 0.24, 1.3], trafficMats.taxiYellow);

    // Greenhouse cabin & solid pillars
    addBox(bodyGroup, [0, 1.05, -0.15], [carW - 0.26, 0.58, 2.0], materials.carGlass);
    addBox(bodyGroup, [-0.76, 1.05, 0.70], [0.08, 0.58, 0.10], trafficMats.taxiYellow, { rotation: [-0.35, 0, 0] });
    addBox(bodyGroup, [0.76, 1.05, 0.70], [0.08, 0.58, 0.10], trafficMats.taxiYellow, { rotation: [-0.35, 0, 0] });
    addBox(bodyGroup, [-0.76, 1.05, -0.15], [0.08, 0.58, 0.10], trafficMats.taxiYellow);
    addBox(bodyGroup, [0.76, 1.05, -0.15], [0.08, 0.58, 0.10], trafficMats.taxiYellow);
    addBox(bodyGroup, [-0.76, 1.05, -1.02], [0.08, 0.58, 0.10], trafficMats.taxiYellow);
    addBox(bodyGroup, [0.76, 1.05, -1.02], [0.08, 0.58, 0.10], trafficMats.taxiYellow);
    // Solid thick roof
    addBox(bodyGroup, [0, 1.36, -0.15], [carW - 0.20, 0.12, 1.9], trafficMats.taxiYellow);

    // Taxi Roof Sign: illuminated "TAXI" pod
    addBox(bodyGroup, [0, 1.48, -0.15], [0.55, 0.14, 0.24], materials.chrome);
    addBox(bodyGroup, [0, 1.48, -0.15], [0.50, 0.12, 0.22], trafficMats.yellowOn);

    // Headlights & Taillights
    addBox(bodyGroup, [-0.65, 0.58, 2.02], [0.28, 0.14, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.65, 0.58, 2.02], [0.28, 0.14, 0.06], trafficMats.headlightLens);
    const b1 = addBox(bodyGroup, [-0.65, 0.64, -2.02], [0.28, 0.14, 0.06], trafficMats.taillightLens);
    const b2 = addBox(bodyGroup, [0.65, 0.64, -2.02], [0.28, 0.14, 0.06], trafficMats.taillightLens);
    brakeLights.push(b1, b2);

    driverRig = buildCarDriver(bodyGroup, [-0.35, 0.54, -0.05], { hasCap: true, shirtMat: materials.clothingWhite });
  } else if (type === 'suv') {
    carLen = 4.8;
    carW = 2.10;
    wheelbase = 2.8;

    // Robust luxury SUV lower body & bumpers
    addBox(bodyGroup, [0, 0.40, 0], [carW, 0.32, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.72, 0], [carW - 0.05, 0.44, carLen - 0.1], colorMat);
    addBox(bodyGroup, [0, 0.88, 1.4], [carW - 0.15, 0.32, 1.5], colorMat); // hood

    // Windshield & side glass block
    addBox(bodyGroup, [0, 1.34, -0.2], [carW - 0.28, 0.62, 2.3], materials.carGlass);

    // SOLID STRUCTURAL PILLARS (connects lower body firmly to roof!)
    // Front A-pillars (slanted back)
    addBox(bodyGroup, [-0.85, 1.32, 0.82], [0.10, 0.64, 0.12], colorMat, { rotation: [-0.38, 0, 0] });
    addBox(bodyGroup, [0.85, 1.32, 0.82], [0.10, 0.64, 0.12], colorMat, { rotation: [-0.38, 0, 0] });
    // Center B-pillars (vertical)
    addBox(bodyGroup, [-0.86, 1.34, -0.2], [0.10, 0.62, 0.14], colorMat);
    addBox(bodyGroup, [0.86, 1.34, -0.2], [0.10, 0.62, 0.14], colorMat);
    // Rear D-pillars (sturdy luxury SUV rear upright)
    addBox(bodyGroup, [-0.85, 1.34, -1.25], [0.12, 0.62, 0.18], colorMat);
    addBox(bodyGroup, [0.85, 1.34, -1.25], [0.12, 0.62, 0.18], colorMat);

    // Thick solid roof on top (seamlessly capping the pillars and cabin)
    addBox(bodyGroup, [0, 1.68, -0.2], [carW - 0.22, 0.12, 2.45], colorMat);

    // Roof rails on top of roof
    for (const rx of [-0.76, 0.76]) {
      addBox(bodyGroup, [rx, 1.78, -0.2], [0.06, 0.08, 2.1], materials.metalDark);
    }

    // Grille & Headlights
    addBox(bodyGroup, [0, 0.82, 2.32], [1.2, 0.34, 0.06], materials.chrome);
    addBox(bodyGroup, [-0.76, 0.86, 2.30], [0.35, 0.15, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.76, 0.86, 2.30], [0.35, 0.15, 0.06], trafficMats.headlightLens);
    const b1 = addBox(bodyGroup, [-0.76, 0.90, -2.32], [0.35, 0.16, 0.06], trafficMats.taillightLens);
    const b2 = addBox(bodyGroup, [0.76, 0.90, -2.32], [0.35, 0.16, 0.06], trafficMats.taillightLens);
    brakeLights.push(b1, b2);

    driverRig = buildCarDriver(bodyGroup, [-0.38, 0.72, 0.0], { shirtMat: materials.poloNavy });
  } else {
    // Default executive sedan
    addBox(bodyGroup, [0, 0.34, 0], [carW, 0.26, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.58, 0], [carW - 0.05, 0.34, carLen - 0.1], colorMat);
    addBox(bodyGroup, [0, 0.64, 1.35], [carW - 0.15, 0.22, 1.3], colorMat);

    // Greenhouse cabin & pillars
    addBox(bodyGroup, [0, 1.05, -0.1], [carW - 0.26, 0.54, 2.1], materials.carGlass);
    addBox(bodyGroup, [-0.80, 1.05, 0.78], [0.09, 0.54, 0.10], colorMat, { rotation: [-0.40, 0, 0] });
    addBox(bodyGroup, [0.80, 1.05, 0.78], [0.09, 0.54, 0.10], colorMat, { rotation: [-0.40, 0, 0] });
    addBox(bodyGroup, [-0.80, 1.05, -0.1], [0.09, 0.54, 0.12], colorMat);
    addBox(bodyGroup, [0.80, 1.05, -0.1], [0.09, 0.54, 0.12], colorMat);
    addBox(bodyGroup, [-0.80, 1.05, -0.98], [0.09, 0.54, 0.12], colorMat, { rotation: [0.36, 0, 0] });
    addBox(bodyGroup, [0.80, 1.05, -0.98], [0.09, 0.54, 0.12], colorMat, { rotation: [0.36, 0, 0] });
    // Solid roof
    addBox(bodyGroup, [0, 1.34, -0.12], [carW - 0.22, 0.10, 1.75], colorMat);

    addBox(bodyGroup, [-0.68, 0.60, 2.12], [0.30, 0.12, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.68, 0.60, 2.12], [0.30, 0.12, 0.06], trafficMats.headlightLens);
    const b1 = addBox(bodyGroup, [-0.68, 0.66, -2.12], [0.30, 0.14, 0.06], trafficMats.taillightLens);
    const b2 = addBox(bodyGroup, [0.68, 0.66, -2.12], [0.30, 0.14, 0.06], trafficMats.taillightLens);
    brakeLights.push(b1, b2);

    driverRig = buildCarDriver(bodyGroup, [-0.35, 0.52, -0.05], { shirtMat: materials.poloGreen });
  }

  // 4 Wheels
  const halfTrack = trackW * 0.5;
  const halfWb = wheelbase * 0.5;
  const wheelPositions = [
    [-halfTrack, wheelRadius, halfWb],
    [halfTrack, wheelRadius, halfWb],
    [-halfTrack, wheelRadius, -halfWb],
    [halfTrack, wheelRadius, -halfWb],
  ];

  for (const [wx, wy, wz] of wheelPositions) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wy, wz);
    root.add(wheelGroup);

    addCylinder(wheelGroup, [0, 0, 0], wheelRadius, wheelRadius, wheelWidth, materials.carRubber, {
      segments: 18,
      rotation: [0, 0, Math.PI * 0.5]
    });
    addCylinder(wheelGroup, [wx > 0 ? 0.03 : -0.03, 0, 0], wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth * 0.9, materials.m4WheelRim, {
      segments: 14,
      rotation: [0, 0, Math.PI * 0.5]
    });
    addCylinder(wheelGroup, [wx > 0 ? 0.08 : -0.08, 0, 0], 0.06, 0.06, 0.08, materials.chrome, {
      segments: 10,
      rotation: [0, 0, Math.PI * 0.5]
    });

    wheels.push(wheelGroup);
  }

  return { root, bodyGroup, wheels, length: carLen, radius: wheelRadius, driverRig, brakeLights };
}

/**
 * Builds a dynamic animated highway motorcycle/scooter with rotating wheels and rider.
 */
function buildTrafficMotorcycle(style = 'scooter', colorMat) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const wheels = [];
  const brakeLights = [];
  const isRetro = style === 'retro';
  const wheelRadius = isRetro ? 0.25 : 0.28;
  const wheelW = 0.11;
  const bikeLen = isRetro ? 1.9 : 2.1;
  const halfWb = 0.68;

  // Frame / Engine block
  addBox(bodyGroup, [0, 0.32, 0], [0.32, 0.26, 0.90], materials.metalDark);
  addCylinder(bodyGroup, [0, 0.32, -0.05], 0.14, 0.14, 0.36, materials.chrome, { segments: 12, rotation: [0, 0, Math.PI * 0.5] });

  if (isRetro) {
    // Curvaceous vintage Vespa-style scooter body
    addBox(bodyGroup, [0, 0.38, 0.35], [0.42, 0.36, 0.40], colorMat);
    addBox(bodyGroup, [0, 0.65, 0.52], [0.55, 0.52, 0.06], colorMat, { rotation: [-0.22, 0, 0] });
    addBox(bodyGroup, [0, 0.22, 0.25], [0.44, 0.06, 0.50], materials.carRubber);
    addBox(bodyGroup, [0, 0.46, -0.45], [0.48, 0.38, 0.65], colorMat);
    addBox(bodyGroup, [0, 0.55, -0.82], [0.38, 0.04, 0.22], materials.chrome);
    addCylinder(bodyGroup, [0, 0.96, 0.48], 0.10, 0.10, 0.10, materials.chrome, { segments: 16, rotation: [Math.PI * 0.5, 0, 0] });
    addSphere(bodyGroup, [0, 0.96, 0.54], [0.09, 0.09, 0.04], trafficMats.headlightLens);
  } else {
    // Sporty streetfighter motorcycle
    addBox(bodyGroup, [0, 0.58, 0.12], [0.38, 0.28, 0.60], colorMat);
    addBox(bodyGroup, [0, 0.68, 0.32], [0.34, 0.22, 0.42], colorMat, { rotation: [-0.3, 0, 0] });
    addCylinder(bodyGroup, [-0.17, 0.45, 0.05], 0.02, 0.02, 0.55, materials.coral, { rotation: [0.7, 0, 0] });
    addCylinder(bodyGroup, [0.17, 0.45, 0.05], 0.02, 0.02, 0.55, materials.coral, { rotation: [0.7, 0, 0] });
    addCylinder(bodyGroup, [0.18, 0.32, -0.45], 0.045, 0.055, 0.48, materials.chrome, { rotation: [0.35, 0, 0] });
    addBox(bodyGroup, [0, 0.88, 0.62], [0.24, 0.20, 0.16], materials.metalDark);
    addBox(bodyGroup, [0, 0.88, 0.70], [0.18, 0.08, 0.04], trafficMats.headlightLens);
  }

  // Handlebars with grips & chrome stem
  addCylinder(bodyGroup, [0, 0.86, 0.44], 0.025, 0.025, 0.26, materials.chrome);
  addBox(bodyGroup, [0, 0.98, 0.44], [0.65, 0.04, 0.04], materials.chrome);
  for (const hx of [-0.30, 0.30]) {
    addBox(bodyGroup, [hx, 0.98, 0.44], [0.08, 0.055, 0.055], materials.metalDark);
    addCylinder(bodyGroup, [hx * 0.9, 1.05, 0.44], 0.01, 0.01, 0.14, materials.chrome);
    addBox(bodyGroup, [hx * 0.9, 1.12, 0.44], [0.08, 0.05, 0.02], materials.metalDark);
  }

  // Tail light / Brake light
  const bm = addBox(bodyGroup, [0, 0.52, -bikeLen * 0.48], [0.16, 0.08, 0.04], trafficMats.taillightLens);
  brakeLights.push(bm);

  // Rider seated with animated limbs
  const riderRig = buildMotorcycleRider(bodyGroup, [0, 0.38, -0.15], { isRetro, helmetMat: colorMat });

  // Front & Rear Wheels
  for (const wz of [halfWb, -halfWb]) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, wheelRadius, wz);
    root.add(wheelGroup);

    addCylinder(wheelGroup, [0, 0, 0], wheelRadius, wheelRadius, wheelW, materials.carRubber, {
      segments: 18,
      rotation: [0, 0, Math.PI * 0.5]
    });
    addCylinder(wheelGroup, [0, 0, 0], wheelRadius * 0.68, wheelRadius * 0.68, wheelW * 0.8, materials.chrome, {
      segments: 14,
      rotation: [0, 0, Math.PI * 0.5]
    });
    wheels.push(wheelGroup);
  }

  return { root, bodyGroup, wheels, length: bikeLen, radius: wheelRadius, riderRig, brakeLights };
}

/**
 * Builds a modern highway mast-arm traffic light with animated signal aspects.
 */
function buildTrafficLightMast(parent, polePos, facingDir = 1, options = {}) {
  const [px, py, pz] = polePos;
  const mastGroup = new THREE.Group();
  mastGroup.position.set(px, py, pz);
  parent.add(mastGroup);

  const armSpan = options.armSpan || 5.2;
  const isSouthSide = pz > 35.0;
  const armZDir = isSouthSide ? -1 : 1; // reach toward road center

  // Vertical steel mast post
  addBox(mastGroup, [0, 0.3, 0], [0.55, 0.6, 0.55], trafficMats.housing);
  addCylinder(mastGroup, [0, 3.2, 0], 0.12, 0.18, 5.8, trafficMats.housing, { segments: 14 });

  // Horizontal cantilever mast arm reaching over the traffic lane
  const armY = 6.0;
  const armEnd = armSpan * armZDir;
  addCylinder(mastGroup, [0, armY, armEnd * 0.5], 0.08, 0.11, armSpan, trafficMats.housing, {
    segments: 12,
    rotation: [Math.PI * 0.5, 0, 0]
  });
  addCylinder(mastGroup, [0, armY - 0.5, armEnd * 0.28], 0.05, 0.05, 1.4, trafficMats.housing, {
    rotation: [armZDir * 0.65, 0, 0]
  });

  // --- Overhead 3-Aspect Traffic Signal Head (Dual-Faced for complete 360° road visibility) ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, armY - 0.65, armEnd * 0.75);
  headGroup.rotation.y = facingDir === -1 ? Math.PI * 0.5 : -Math.PI * 0.5;
  mastGroup.add(headGroup);

  const redMeshes = [];
  const yellowMeshes = [];
  const greenMeshes = [];
  const pedRedMeshes = [];
  const pedGreenMeshes = [];

  // Main housing body
  addBox(headGroup, [0, 0, 0], [0.42, 1.35, 0.64], trafficMats.housing);

  function addSignalFace(parentGroup, zOffset, isNegative) {
    const dir = isNegative ? -1 : 1;
    addBox(parentGroup, [0, 0, zOffset], [0.65, 1.45, 0.04], trafficMats.backingBoard);
    addBox(parentGroup, [0, 0, zOffset + dir * 0.01], [0.61, 1.41, 0.02], trafficMats.borderYellow);

    const lensRadius = 0.12;
    const rM = addCylinder(parentGroup, [0, 0.36, zOffset + dir * 0.08], lensRadius, lensRadius, 0.06, trafficMats.redOff, {
      segments: 16,
      rotation: [Math.PI * 0.5, 0, 0]
    });
    const yM = addCylinder(parentGroup, [0, 0.0, zOffset + dir * 0.08], lensRadius, lensRadius, 0.06, trafficMats.yellowOff, {
      segments: 16,
      rotation: [Math.PI * 0.5, 0, 0]
    });
    const gM = addCylinder(parentGroup, [0, -0.36, zOffset + dir * 0.08], lensRadius, lensRadius, 0.06, trafficMats.greenOn, {
      segments: 16,
      rotation: [Math.PI * 0.5, 0, 0]
    });
    redMeshes.push(rM);
    yellowMeshes.push(yM);
    greenMeshes.push(gM);

    for (const ly of [0.36, 0.0, -0.36]) {
      addCylinder(parentGroup, [0, ly + 0.11, zOffset + dir * 0.14], 0.13, 0.13, 0.14, trafficMats.housing, {
        segments: 12,
        rotation: [Math.PI * 0.5, 0, 0]
      });
    }
  }

  // Primary & secondary faces on overhead head
  addSignalFace(headGroup, 0.32, false);
  addSignalFace(headGroup, -0.32, true);

  // --- Pedestrian Signal Head at Eye Level on Post (facing crosswalk) ---
  const pedGroup = new THREE.Group();
  pedGroup.position.set(0, 2.5, 0.28 * armZDir);
  pedGroup.rotation.y = isSouthSide ? Math.PI : 0;
  mastGroup.add(pedGroup);

  addBox(pedGroup, [0, 0, 0], [0.28, 0.65, 0.18], trafficMats.housing);
  const pedRedMesh = addBox(pedGroup, [0, 0.14, 0.10], [0.18, 0.22, 0.04], trafficMats.pedOff);
  const pedGreenMesh = addBox(pedGroup, [0, -0.14, 0.10], [0.18, 0.22, 0.04], trafficMats.pedGreenOn);
  pedRedMeshes.push(pedRedMesh);
  pedGreenMeshes.push(pedGreenMesh);

  return {
    mastGroup,
    redMeshes,
    yellowMeshes,
    greenMeshes,
    pedRedMeshes,
    pedGreenMeshes,
    setSignalAspect: (aspect, pedAspect) => {
      const isG = aspect === 'GREEN';
      const isY = aspect === 'YELLOW';
      const isR = aspect === 'RED';
      const isPedWalk = pedAspect === 'GREEN';

      for (const m of greenMeshes) m.material = isG ? trafficMats.greenOn : trafficMats.greenOff;
      for (const m of yellowMeshes) m.material = isY ? trafficMats.yellowOn : trafficMats.yellowOff;
      for (const m of redMeshes) m.material = isR ? trafficMats.redOn : trafficMats.redOff;
      for (const m of pedRedMeshes) m.material = isPedWalk ? trafficMats.pedOff : trafficMats.pedRedOn;
      for (const m of pedGreenMeshes) m.material = isPedWalk ? trafficMats.pedGreenOn : trafficMats.pedOff;
    }
  };
}

/**
 * Creates Zone I Highway dynamic animated traffic system.
 */
export function createHighwayTraffic(parent, world, RAPIER, staticBodies) {
  const trafficGroup = new THREE.Group();
  parent.add(trafficGroup);

  // =========================================================================
  // 1. White Stop Bars on Road Asphalt before Crosswalk
  // =========================================================================
  // Westbound lane stop line at x = 4.8 (z: [29.8, 35.0])
  addBox(trafficGroup, [4.8, 0.05, 32.4], [0.45, 0.008, 4.8], materials.asphaltMarkingWhite);
  // Eastbound lane stop line at x = -4.8 (z: [35.8, 41.0])
  addBox(trafficGroup, [-4.8, 0.05, 38.4], [0.45, 0.008, 4.8], materials.asphaltMarkingWhite);

  // =========================================================================
  // 2. Working Traffic Light Poles at the Crosswalk
  // =========================================================================
  // North Pole on sidewalk (z = 29.3, x = 4.8) controls Westbound approaching traffic
  const northSignal = buildTrafficLightMast(trafficGroup, [4.8, 0.12, 29.3], -1, { armSpan: 4.8 });
  // South Pole on road verge (z = 41.5, x = -4.8) controls Eastbound approaching traffic
  const southSignal = buildTrafficLightMast(trafficGroup, [-4.8, 0.02, 41.5], 1, { armSpan: 4.8 });

  const signals = [northSignal, southSignal];

  // Add Rapier colliders for the traffic light poles
  if (world && RAPIER && staticBodies) {
    for (const [px, pz] of [[4.8, 29.3], [-4.8, 41.5]]) {
      const poleBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, 2.5, pz));
      world.createCollider(RAPIER.ColliderDesc.cylinder(2.5, 0.25), poleBody);
      staticBodies.push(poleBody);
    }
  }

  // =========================================================================
  // 3. Vehicles in Motion (Cars & Motorcycles with Drivers)
  // =========================================================================
  const vehicles = [];

  // Westbound Lane (North lane, z = 32.8, moving direction = -1 [from +X to -X])
  const wbSpecs = [
    { type: 'car', model: 'sports', mat: trafficMats.coupeRed, startX: 26.0, speed: 13.0, reactionDelay: 0.25, stopOffset: 0.0 },
    { type: 'bike', model: 'scooter', mat: trafficMats.scooterCyan, startX: 10.0, speed: 12.2, reactionDelay: 0.45, stopOffset: 0.3 },
    { type: 'car', model: 'suv', mat: materials.carSuvWhite, startX: -10.0, speed: 11.5, reactionDelay: 0.55, stopOffset: -0.2 },
    { type: 'car', model: 'taxi', mat: trafficMats.taxiYellow, startX: -30.0, speed: 10.8, reactionDelay: 0.65, stopOffset: 0.2 },
  ];

  for (const spec of wbSpecs) {
    const vObj = spec.type === 'car'
      ? buildTrafficCar(spec.model, spec.mat)
      : buildTrafficMotorcycle(spec.model, spec.mat);

    vObj.root.position.set(spec.startX, 0, 32.8);
    // Face -X (moving left)
    vObj.root.rotation.y = -Math.PI * 0.5;
    trafficGroup.add(vObj.root);

    vehicles.push({
      ...vObj,
      type: spec.type,
      lane: 'westbound',
      dir: -1,
      x: spec.startX,
      z: 32.8,
      speed: spec.speed,
      cruisingSpeed: spec.speed,
      reactionDelay: spec.reactionDelay,
      stopOffset: spec.stopOffset,
      isBraking: false,
      startedMovingTimer: 0,
      clock: Math.random() * 20,
    });
  }

  // Eastbound Lane (South lane, z = 38.2, moving direction = +1 [from -X to +X])
  const ebSpecs = [
    { type: 'bike', model: 'retro', mat: trafficMats.scooterMint, startX: -26.0, speed: 11.2, reactionDelay: 0.30, stopOffset: 0.0 },
    { type: 'car', model: 'sedan', mat: trafficMats.sedanBlue, startX: -10.0, speed: 12.5, reactionDelay: 0.50, stopOffset: 0.2 },
    { type: 'bike', model: 'sport', mat: trafficMats.scooterOrange, startX: 10.0, speed: 13.2, reactionDelay: 0.35, stopOffset: -0.2 },
    { type: 'car', model: 'sedan', mat: materials.carSuvBlack, startX: 28.0, speed: 11.8, reactionDelay: 0.60, stopOffset: 0.1 },
  ];

  for (const spec of ebSpecs) {
    const vObj = spec.type === 'car'
      ? buildTrafficCar(spec.model, spec.mat)
      : buildTrafficMotorcycle(spec.model, spec.mat);

    vObj.root.position.set(spec.startX, 0, 38.2);
    // Face +X (moving right)
    vObj.root.rotation.y = Math.PI * 0.5;
    trafficGroup.add(vObj.root);

    vehicles.push({
      ...vObj,
      type: spec.type,
      lane: 'eastbound',
      dir: 1,
      x: spec.startX,
      z: 38.2,
      speed: spec.speed,
      cruisingSpeed: spec.speed,
      reactionDelay: spec.reactionDelay,
      stopOffset: spec.stopOffset,
      isBraking: false,
      startedMovingTimer: 0,
      clock: Math.random() * 20,
    });
  }

  // =========================================================================
  // 4. Non-Simultaneous Multi-Phase Traffic Controller ("Tidak Berbarengan")
  // =========================================================================
  // Phases:
  // 1. 'WB_GREEN' (10.0s): Westbound GREEN, Eastbound RED, Pedestrian RED
  // 2. 'WB_YELLOW' (3.5s): Westbound YELLOW, Eastbound RED, Pedestrian RED
  // 3. 'ALL_RED_PED' (7.0s): Westbound RED, Eastbound RED, Pedestrian GREEN (crosswalk walk!)
  // 4. 'EB_GREEN' (10.0s): Westbound RED, Eastbound GREEN, Pedestrian RED
  // 5. 'EB_YELLOW' (3.5s): Westbound RED, Eastbound YELLOW, Pedestrian RED
  // 6. 'ALL_RED_CLEAR' (3.0s): Westbound RED, Eastbound RED, Pedestrian RED

  const PHASE_DURATIONS = {
    WB_GREEN: 10.0,
    WB_YELLOW: 3.5,
    ALL_RED_PED: 7.0,
    EB_GREEN: 10.0,
    EB_YELLOW: 3.5,
    ALL_RED_CLEAR: 3.0,
  };

  const PHASE_ORDER = ['WB_GREEN', 'WB_YELLOW', 'ALL_RED_PED', 'EB_GREEN', 'EB_YELLOW', 'ALL_RED_CLEAR'];

  const initialLightParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('trafficLight')
    : null;

  let currentPhaseIndex = 0;
  if (initialLightParam) {
    const p = initialLightParam.toUpperCase();
    if (p === 'RED' || p === 'ALL_RED') currentPhaseIndex = 2; // ALL_RED_PED
    else if (p === 'WB_GREEN' || p === 'WEST') currentPhaseIndex = 0;
    else if (p === 'EB_GREEN' || p === 'EAST') currentPhaseIndex = 3;
    else if (p === 'YELLOW') currentPhaseIndex = 1;
  }

  let trafficPhase = PHASE_ORDER[currentPhaseIndex];
  let holdTrafficLight = !!initialLightParam;
  let phaseTimer = 0;
  let timeInGreen = { westbound: 0, eastbound: 0 };

  function getLaneSignalState(lane) {
    if (lane === 'westbound') {
      if (trafficPhase === 'WB_GREEN') return 'GREEN';
      if (trafficPhase === 'WB_YELLOW') return 'YELLOW';
      return 'RED';
    } else {
      if (trafficPhase === 'EB_GREEN') return 'GREEN';
      if (trafficPhase === 'EB_YELLOW') return 'YELLOW';
      return 'RED';
    }
  }

  function updateSignalLenses() {
    let wbAspect = 'RED';
    let ebAspect = 'RED';
    let pedAspect = 'RED';

    if (trafficPhase === 'WB_GREEN') {
      wbAspect = 'GREEN';
      ebAspect = 'RED';
      pedAspect = 'RED';
    } else if (trafficPhase === 'WB_YELLOW') {
      wbAspect = 'YELLOW';
      ebAspect = 'RED';
      pedAspect = 'RED';
    } else if (trafficPhase === 'ALL_RED_PED') {
      wbAspect = 'RED';
      ebAspect = 'RED';
      pedAspect = 'GREEN'; // pedestrian safe crosswalk walking icon
    } else if (trafficPhase === 'EB_GREEN') {
      wbAspect = 'RED';
      ebAspect = 'GREEN';
      pedAspect = 'RED';
    } else if (trafficPhase === 'EB_YELLOW') {
      wbAspect = 'RED';
      ebAspect = 'YELLOW';
      pedAspect = 'RED';
    } else if (trafficPhase === 'ALL_RED_CLEAR') {
      wbAspect = 'RED';
      ebAspect = 'RED';
      pedAspect = 'RED';
    }

    northSignal.setSignalAspect(wbAspect, pedAspect);
    southSignal.setSignalAspect(ebAspect, pedAspect);
  }

  // Initialize signals
  updateSignalLenses();

  // =========================================================================
  // 5. Update Loop with Physics, Queueing, and Driver Animations
  // =========================================================================
  const ROAD_MIN_X = -54.0;
  const ROAD_MAX_X = 54.0;
  const STOP_LINE_WB = 5.2;   // Westbound stop bar at x = 5.2
  const STOP_LINE_EB = -5.2;  // Eastbound stop bar at x = -5.2

  function update(delta) {
    const dt = Math.min(0.06, delta);

    if (!holdTrafficLight) {
      phaseTimer += dt;
      const curDuration = PHASE_DURATIONS[trafficPhase] || 8.0;
      if (phaseTimer >= curDuration) {
        phaseTimer = 0;
        currentPhaseIndex = (currentPhaseIndex + 1) % PHASE_ORDER.length;
        trafficPhase = PHASE_ORDER[currentPhaseIndex];
        updateSignalLenses();
      }
    }

    // Track time in green for realistic ripple departure wave
    if (trafficPhase === 'WB_GREEN') {
      timeInGreen.westbound += dt;
      timeInGreen.eastbound = 0;
    } else if (trafficPhase === 'EB_GREEN') {
      timeInGreen.eastbound += dt;
      timeInGreen.westbound = 0;
    } else {
      timeInGreen.westbound = 0;
      timeInGreen.eastbound = 0;
    }

    // Process vehicles lane by lane
    for (const laneName of ['westbound', 'eastbound']) {
      const laneVehicles = vehicles.filter((v) => v.lane === laneName);
      const isWB = laneName === 'westbound';
      const stopLineX = isWB ? STOP_LINE_WB : STOP_LINE_EB;
      const dir = isWB ? -1 : 1;
      const laneSignal = getLaneSignalState(laneName);
      const greenElapsed = timeInGreen[laneName];

      // Sort front-to-back: vehicle furthest ahead in travel direction comes first
      laneVehicles.sort((a, b) => (b.x * dir) - (a.x * dir));

      for (let i = 0; i < laneVehicles.length; i += 1) {
        const v = laneVehicles[i];
        v.clock += dt;

        // 1. Distance to Stop Line
        // Positive means approaching stop line; negative means already past the stop line
        const distToStop = (stopLineX - v.x) * dir;

        // Determine if this vehicle must stop for traffic light
        let mustStopForSignal = false;
        if (laneSignal === 'RED') {
          // If approaching stop line within 24m and hasn't crossed past yet
          if (distToStop > -0.5 && distToStop < 24.0) {
            mustStopForSignal = true;
          }
        } else if (laneSignal === 'YELLOW') {
          // Yellow light warning: stop if comfortable distance (> 6.5m)
          if (distToStop > 6.5 && distToStop < 22.0) {
            mustStopForSignal = true;
          }
        }

        // 2. Queueing & Distance to vehicle ahead
        let distToLeader = 999.0;
        let leaderSpeed = v.cruisingSpeed;
        if (i > 0) {
          const leader = laneVehicles[i - 1];
          distToLeader = ((leader.x - v.x) * dir) - (leader.length * 0.5 + v.length * 0.5);
          leaderSpeed = leader.speed;
        }

        // 3. Acceleration / Deceleration Logic with Staggered Human Reaction Delay
        let targetSpeed = v.cruisingSpeed;

        // Sequential reaction delay when light turns green
        const reactionWait = v.reactionDelay + (i * 0.45);
        if (laneSignal === 'GREEN' && greenElapsed < reactionWait && distToStop > -1.0 && distToStop < 24.0) {
          // Still reacting/waiting for lead car to pull away
          targetSpeed = Math.min(v.speed, leaderSpeed);
        }

        if (mustStopForSignal && distToStop <= 20.0) {
          // Smooth deceleration towards stop line (with individual stop offset)
          const targetStopDist = 0.8 + (v.stopOffset || 0);
          const decelTarget = Math.max(0, (distToStop - targetStopDist) * 1.5);
          targetSpeed = Math.min(targetSpeed, decelTarget);
        }

        // Safe following distance buffer in queue (min buffer 2.5m for cars, 1.8m for bikes)
        const minBuffer = v.type === 'bike' ? 1.8 : 2.6;
        if (distToLeader < 18.0) {
          const followTarget = Math.max(0, Math.min(leaderSpeed, (distToLeader - minBuffer) * 1.6));
          targetSpeed = Math.min(targetSpeed, followTarget);
        }

        // Smooth acceleration / braking
        if (v.speed < targetSpeed) {
          v.speed = Math.min(targetSpeed, v.speed + 6.0 * dt);
          v.isBraking = false;
        } else if (v.speed > targetSpeed) {
          v.speed = Math.max(targetSpeed, v.speed - 9.0 * dt);
          v.isBraking = (v.speed - targetSpeed) > 0.8;
        } else {
          v.isBraking = false;
        }

        // 4. Update Position
        v.x += v.speed * dt * dir;
        v.root.position.x = v.x;

        // 5. Wrap around world boundaries
        if (dir === -1 && v.x < ROAD_MIN_X) {
          v.x = ROAD_MAX_X;
          v.root.position.x = v.x;
        } else if (dir === 1 && v.x > ROAD_MAX_X) {
          v.x = ROAD_MIN_X;
          v.root.position.x = v.x;
        }

        // 6. Wheel Rotation Animation
        const angularVelocity = (v.speed / v.radius) * dt;
        for (const w of v.wheels) {
          w.rotation.x += angularVelocity;
        }

        // 7. Dynamic Brake Lights Illumination
        const isBrakingOrStopped = v.isBraking || v.speed < 0.4;
        const bMat = isBrakingOrStopped ? trafficMats.brakeLightOn : trafficMats.taillightLens;
        if (v.brakeLights) {
          for (const bl of v.brakeLights) {
            bl.material = bMat;
          }
        }

        // 8. Vehicle Body Dynamics (Braking Nose-Dive, Acceleration Squat, Engine Rumble)
        if (v.speed > 0.5) {
          // Driving suspension vibration
          v.bodyGroup.position.y = Math.sin(v.clock * 14.0) * 0.012;
          // Braking pitch (nose dives forward slightly)
          const targetPitch = v.isBraking ? (dir * -0.026) : 0;
          v.bodyGroup.rotation.z = THREE.MathUtils.lerp(v.bodyGroup.rotation.z, targetPitch, dt * 6.0);
        } else {
          // Engine idle rumble when stopped at red light
          v.bodyGroup.position.y = Math.sin(v.clock * 22.0) * 0.003;
          v.bodyGroup.rotation.z = THREE.MathUtils.lerp(v.bodyGroup.rotation.z, 0, dt * 6.0);
        }

        // 9. Detailed Character Driver & Rider Animations!
        if (v.type === 'car' && v.driverRig) {
          // Steering wheel turns back and forth as driver steers
          const steerAngle = Math.sin(v.clock * 1.8) * 0.28;
          v.driverRig.wheelGroup.rotation.z = steerAngle;
          // Driver's head glances forward, checks mirrors, and road
          v.driverRig.headGroup.rotation.y = Math.sin(v.clock * 1.1) * 0.22;
          v.driverRig.headGroup.rotation.x = Math.sin(v.clock * 3.8) * 0.035;
          // Breathing motion
          v.driverRig.torsoGroup.position.y = Math.sin(v.clock * 2.2) * 0.008;
        } else if (v.type === 'bike' && v.riderRig) {
          // Motorcyclist animations
          const isStopped = v.speed < 0.4;
          if (isStopped) {
            // LEFT FOOT DOWN: Put left leg down on the asphalt road to balance bike while stopped!
            v.riderRig.leftLeg.rotation.x = THREE.MathUtils.lerp(v.riderRig.leftLeg.rotation.x, -0.15, dt * 6.0);
            v.riderRig.leftLeg.position.y = THREE.MathUtils.lerp(v.riderRig.leftLeg.position.y, 0.16, dt * 6.0);
            v.riderRig.leftLeg.rotation.z = THREE.MathUtils.lerp(v.riderRig.leftLeg.rotation.z, -0.35, dt * 6.0);
            // Relaxed upright posture
            v.riderRig.torso.rotation.x = THREE.MathUtils.lerp(v.riderRig.torso.rotation.x, v.riderRig.leanAngle - 0.12, dt * 5.0);
            v.riderRig.torso.rotation.z = THREE.MathUtils.lerp(v.riderRig.torso.rotation.z, 0, dt * 5.0);
          } else {
            // FOOT UP: Lift left foot back up onto the footpeg while riding!
            v.riderRig.leftLeg.rotation.x = THREE.MathUtils.lerp(v.riderRig.leftLeg.rotation.x, 0.75, dt * 6.0);
            v.riderRig.leftLeg.position.y = THREE.MathUtils.lerp(v.riderRig.leftLeg.position.y, 0.28, dt * 6.0);
            v.riderRig.leftLeg.rotation.z = THREE.MathUtils.lerp(v.riderRig.leftLeg.rotation.z, -0.15, dt * 6.0);
            // Active forward riding lean & dynamic body banking into motion
            const targetLean = v.riderRig.leanAngle + (v.isBraking ? 0.06 : 0);
            v.riderRig.torso.rotation.x = THREE.MathUtils.lerp(v.riderRig.torso.rotation.x, targetLean, dt * 5.0);
            v.riderRig.torso.rotation.z = Math.sin(v.clock * 3.2) * 0.04;
          }

          // Rider helmet active scanning (looking left, right, checking mirrors) & road nod
          v.riderRig.helmet.rotation.y = Math.sin(v.clock * 1.3) * 0.24 + Math.sin(v.clock * 0.4) * 0.10;
          v.riderRig.helmet.rotation.x = Math.sin(v.clock * 4.6) * 0.05;
          // Breathing motion
          v.riderRig.torso.position.y = 0.38 + Math.sin(v.clock * 2.5) * 0.012;
        }
      }
    }
  }

  const api = {
    trafficGroup,
    update,
    getPhase: () => trafficPhase,
    getLaneSignalState,
    setPhase: (phaseName, hold = false) => {
      if (PHASE_ORDER.includes(phaseName)) {
        trafficPhase = phaseName;
        currentPhaseIndex = PHASE_ORDER.indexOf(phaseName);
        phaseTimer = 0;
        holdTrafficLight = hold;
        updateSignalLenses();
      }
    },
    signals,
    vehicles,
  };

  if (typeof window !== 'undefined') {
    window.__TRAFFIC_SYSTEM__ = api;
  }

  return api;
}
