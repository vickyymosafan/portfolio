import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder } from './geometry.js';

// Dedicated Traffic Signal Materials with high-visibility illumination
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
};

/**
 * Builds a stylized driver character seated inside a car.
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
  // Headrest
  addBox(driverGroup, [0, 0.44, -0.23], [0.24, 0.16, 0.10], materials.leatherDark);

  // Torso
  addBox(driverGroup, [0, 0.12, -0.10], [0.38, 0.36, 0.22], shirtMat);
  // Collar accent
  addBox(driverGroup, [0, 0.30, -0.02], [0.16, 0.05, 0.08], materials.clothingWhite);

  // Arms reaching to steering wheel
  addCylinder(driverGroup, [-0.15, 0.14, 0.06], 0.045, 0.05, 0.28, shirtMat, { rotation: [1.1, 0, -0.2] });
  addCylinder(driverGroup, [0.15, 0.14, 0.06], 0.045, 0.05, 0.28, shirtMat, { rotation: [1.1, 0, 0.2] });
  // Hands
  addSphere(driverGroup, [-0.12, 0.18, 0.20], [0.04, 0.04, 0.04], materials.skin);
  addSphere(driverGroup, [0.12, 0.18, 0.20], [0.04, 0.04, 0.04], materials.skin);

  // Steering wheel
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 0.20, 0.21);
  wheelGroup.rotation.x = -0.45;
  driverGroup.add(wheelGroup);
  addCylinder(wheelGroup, [0, 0, 0], 0.15, 0.15, 0.025, materials.metalDark, { segments: 16 });
  addCylinder(wheelGroup, [0, 0, -0.06], 0.025, 0.025, 0.14, materials.chrome, { rotation: [Math.PI * 0.5, 0, 0] });

  // Neck & Head
  addCylinder(driverGroup, [0, 0.33, -0.08], 0.055, 0.06, 0.08, materials.skin);
  addSphere(driverGroup, [0, 0.45, -0.08], [0.12, 0.14, 0.12], materials.skin);
  // Hair / Cap
  if (options.hasCap) {
    addSphere(driverGroup, [0, 0.48, -0.08], [0.13, 0.12, 0.13], materials.clothingRed);
    addBox(driverGroup, [0, 0.46, 0.06], [0.16, 0.025, 0.14], materials.clothingRed);
  } else {
    addSphere(driverGroup, [0, 0.50, -0.09], [0.135, 0.11, 0.135], hairMat);
    addSphere(driverGroup, [0, 0.49, -0.02], [0.12, 0.06, 0.08], hairMat);
  }
  // Cool sunglasses
  addBox(driverGroup, [0, 0.45, 0.03], [0.18, 0.045, 0.03], materials.metalDark);

  return driverGroup;
}

/**
 * Builds a stylized motorcycle rider in active riding posture with helmet and hands on grips.
 */
function buildMotorcycleRider(parent, [rx, ry, rz], options = {}) {
  const riderGroup = new THREE.Group();
  riderGroup.position.set(rx, ry, rz);
  parent.add(riderGroup);

  const jacketMat = options.jacketMat || materials.leatherDark;
  const helmetMat = options.helmetMat || (options.isRetro ? trafficMats.scooterMint : materials.m4GlossBlack);
  const pantsMat = materials.clothingNavy;

  // Legs bent on footpegs
  for (const lx of [-0.18, 0.18]) {
    // Upper thigh
    addCylinder(riderGroup, [lx, 0.28, -0.06], 0.065, 0.07, 0.32, pantsMat, { rotation: [0.75, 0, lx > 0 ? 0.2 : -0.2] });
    // Lower leg
    addCylinder(riderGroup, [lx * 1.05, 0.08, -0.16], 0.055, 0.06, 0.30, pantsMat, { rotation: [-0.65, 0, 0] });
    // Boots
    addBox(riderGroup, [lx * 1.05, -0.06, -0.12], [0.08, 0.09, 0.18], materials.metalDark);
  }

  // Torso leaning forward slightly
  const leanAngle = options.isRetro ? 0.15 : 0.42;
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

  // Full-Face / Retro Helmet
  const helmet = new THREE.Group();
  helmet.position.set(0, 0.52, 0.04);
  torso.add(helmet);

  addSphere(helmet, [0, 0, 0], [0.16, 0.17, 0.17], helmetMat, { smooth: true });
  // Chin bar
  addBox(helmet, [0, -0.08, 0.10], [0.18, 0.09, 0.14], helmetMat);
  // Dark tinted visor
  addBox(helmet, [0, 0.01, 0.14], [0.20, 0.08, 0.06], materials.metalDark);
  addCylinder(helmet, [0, 0.01, 0.14], 0.11, 0.11, 0.07, materials.chrome, { rotation: [Math.PI * 0.5, 0, 0], segments: 14 });

  return riderGroup;
}

/**
 * Builds a dynamic animated highway car with rotating wheels and driver.
 */
function buildTrafficCar(type = 'sedan', colorMat) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const wheels = [];
  const wheelRadius = type === 'suv' ? 0.38 : 0.32;
  const wheelWidth = 0.22;
  let carLen = 4.4;
  let carW = 1.95;
  let trackW = 1.8;
  let wheelbase = 2.6;

  if (type === 'sports') {
    carLen = 4.3;
    carW = 1.90;
    wheelbase = 2.5;

    // Sleek sports body
    addBox(bodyGroup, [0, 0.34, 0], [carW, 0.26, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.54, 0], [carW - 0.05, 0.32, carLen - 0.1], colorMat);
    // Low aerodynamic hood
    addBox(bodyGroup, [0, 0.56, 1.3], [carW - 0.15, 0.18, 1.4], colorMat);
    // Cabin with tinted glass
    addBox(bodyGroup, [0, 0.96, -0.2], [carW - 0.28, 0.54, 1.9], materials.carGlass);
    // Roof
    addBox(bodyGroup, [0, 1.25, -0.25], [carW - 0.32, 0.06, 1.4], materials.m4GlossBlack);
    // Rear ducktail spoiler
    addBox(bodyGroup, [0, 0.82, -1.98], [carW - 0.3, 0.08, 0.22], materials.m4GlossBlack);

    // Headlights & Taillights
    addBox(bodyGroup, [-0.68, 0.55, 2.05], [0.32, 0.12, 0.08], trafficMats.headlightLens);
    addBox(bodyGroup, [0.68, 0.55, 2.05], [0.32, 0.12, 0.08], trafficMats.headlightLens);
    addBox(bodyGroup, [-0.68, 0.62, -2.05], [0.34, 0.12, 0.08], trafficMats.taillightLens);
    addBox(bodyGroup, [0.68, 0.62, -2.05], [0.34, 0.12, 0.08], trafficMats.taillightLens);

    // Driver inside (right-hand drive / left-hand drive balanced at x = -0.35)
    buildCarDriver(bodyGroup, [-0.35, 0.48, -0.1], { shirtMat: materials.coral });
  } else if (type === 'taxi') {
    carLen = 4.2;
    carW = 1.85;
    wheelbase = 2.45;

    // Compact city taxi body
    addBox(bodyGroup, [0, 0.34, 0], [carW, 0.26, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.58, 0], [carW - 0.05, 0.36, carLen - 0.1], trafficMats.taxiYellow);
    addBox(bodyGroup, [0, 0.62, 1.2], [carW - 0.15, 0.24, 1.3], trafficMats.taxiYellow);
    // Tall cheerful greenhouse cabin
    addBox(bodyGroup, [0, 1.05, -0.15], [carW - 0.24, 0.62, 2.0], materials.carGlass);
    addBox(bodyGroup, [0, 1.38, -0.15], [carW - 0.28, 0.06, 1.8], trafficMats.taxiYellow);

    // Taxi Roof Sign: illuminated "TAXI" pod
    addBox(bodyGroup, [0, 1.48, -0.15], [0.55, 0.14, 0.24], materials.chrome);
    addBox(bodyGroup, [0, 1.48, -0.15], [0.50, 0.12, 0.22], trafficMats.yellowOn);

    // Headlights & Taillights
    addBox(bodyGroup, [-0.65, 0.58, 2.02], [0.28, 0.14, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.65, 0.58, 2.02], [0.28, 0.14, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [-0.65, 0.64, -2.02], [0.28, 0.14, 0.06], trafficMats.taillightLens);
    addBox(bodyGroup, [0.65, 0.64, -2.02], [0.28, 0.14, 0.06], trafficMats.taillightLens);

    // Driver with cap
    buildCarDriver(bodyGroup, [-0.35, 0.54, -0.05], { hasCap: true, shirtMat: materials.clothingWhite });
  } else if (type === 'suv') {
    carLen = 4.8;
    carW = 2.10;
    wheelbase = 2.8;

    // Robust luxury SUV
    addBox(bodyGroup, [0, 0.40, 0], [carW, 0.32, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.72, 0], [carW - 0.05, 0.44, carLen - 0.1], colorMat);
    addBox(bodyGroup, [0, 0.88, 1.4], [carW - 0.15, 0.32, 1.5], colorMat);
    addBox(bodyGroup, [0, 1.38, -0.2], [carW - 0.25, 0.68, 2.4], materials.carGlass);
    addBox(bodyGroup, [0, 1.74, -0.2], [carW - 0.28, 0.07, 2.3], colorMat);
    // Roof rails
    for (const rx of [-0.75, 0.75]) {
      addBox(bodyGroup, [rx, 1.82, -0.2], [0.05, 0.06, 2.1], materials.metalDark);
    }
    // Grille & Headlights
    addBox(bodyGroup, [0, 0.82, 2.32], [1.2, 0.34, 0.06], materials.chrome);
    addBox(bodyGroup, [-0.76, 0.86, 2.30], [0.35, 0.15, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.76, 0.86, 2.30], [0.35, 0.15, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [-0.76, 0.90, -2.32], [0.35, 0.16, 0.06], trafficMats.taillightLens);
    addBox(bodyGroup, [0.76, 0.90, -2.32], [0.35, 0.16, 0.06], trafficMats.taillightLens);

    // Executive driver
    buildCarDriver(bodyGroup, [-0.38, 0.72, 0.0], { shirtMat: materials.poloNavy });
  } else {
    // Default executive sedan
    addBox(bodyGroup, [0, 0.34, 0], [carW, 0.26, carLen], materials.carRubber);
    addBox(bodyGroup, [0, 0.58, 0], [carW - 0.05, 0.34, carLen - 0.1], colorMat);
    addBox(bodyGroup, [0, 0.64, 1.35], [carW - 0.15, 0.22, 1.3], colorMat);
    addBox(bodyGroup, [0, 1.05, -0.1], [carW - 0.25, 0.56, 2.1], materials.carGlass);
    addBox(bodyGroup, [0, 1.34, -0.15], [carW - 0.28, 0.06, 1.6], colorMat);

    addBox(bodyGroup, [-0.68, 0.60, 2.12], [0.30, 0.12, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [0.68, 0.60, 2.12], [0.30, 0.12, 0.06], trafficMats.headlightLens);
    addBox(bodyGroup, [-0.68, 0.66, -2.12], [0.30, 0.14, 0.06], trafficMats.taillightLens);
    addBox(bodyGroup, [0.68, 0.66, -2.12], [0.30, 0.14, 0.06], trafficMats.taillightLens);

    buildCarDriver(bodyGroup, [-0.35, 0.52, -0.05], { shirtMat: materials.poloGreen });
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

    // Tire rubber
    addCylinder(wheelGroup, [0, 0, 0], wheelRadius, wheelRadius, wheelWidth, materials.carRubber, {
      segments: 18,
      rotation: [0, 0, Math.PI * 0.5]
    });
    // Alloy rim
    addCylinder(wheelGroup, [wx > 0 ? 0.03 : -0.03, 0, 0], wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth * 0.9, materials.m4WheelRim, {
      segments: 14,
      rotation: [0, 0, Math.PI * 0.5]
    });
    // Center cap
    addCylinder(wheelGroup, [wx > 0 ? 0.08 : -0.08, 0, 0], 0.06, 0.06, 0.08, materials.chrome, {
      segments: 10,
      rotation: [0, 0, Math.PI * 0.5]
    });

    wheels.push(wheelGroup);
  }

  return { root, bodyGroup, wheels, length: carLen, radius: wheelRadius };
}

/**
 * Builds a dynamic animated highway motorcycle/scooter with rotating wheels and rider.
 */
function buildTrafficMotorcycle(style = 'scooter', colorMat) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const wheels = [];
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
    // Curved front shield
    addBox(bodyGroup, [0, 0.65, 0.52], [0.55, 0.52, 0.06], colorMat, { rotation: [-0.22, 0, 0] });
    // Footboard
    addBox(bodyGroup, [0, 0.22, 0.25], [0.44, 0.06, 0.50], materials.carRubber);
    // Rear bulbous cowl
    addBox(bodyGroup, [0, 0.46, -0.45], [0.48, 0.38, 0.65], colorMat);
    // Chrome luggage rack & bumper
    addBox(bodyGroup, [0, 0.55, -0.82], [0.38, 0.04, 0.22], materials.chrome);
    // Round retro headlight
    addCylinder(bodyGroup, [0, 0.96, 0.48], 0.10, 0.10, 0.10, materials.chrome, { segments: 16, rotation: [Math.PI * 0.5, 0, 0] });
    addSphere(bodyGroup, [0, 0.96, 0.54], [0.09, 0.09, 0.04], trafficMats.headlightLens);
  } else {
    // Sporty streetfighter motorcycle
    addBox(bodyGroup, [0, 0.58, 0.12], [0.38, 0.28, 0.60], colorMat);
    // Angular sport tank & fairing
    addBox(bodyGroup, [0, 0.68, 0.32], [0.34, 0.22, 0.42], colorMat, { rotation: [-0.3, 0, 0] });
    // Trellis frame accent
    addCylinder(bodyGroup, [-0.17, 0.45, 0.05], 0.02, 0.02, 0.55, materials.coral, { rotation: [0.7, 0, 0] });
    addCylinder(bodyGroup, [0.17, 0.45, 0.05], 0.02, 0.02, 0.55, materials.coral, { rotation: [0.7, 0, 0] });
    // Titanium exhaust pipe
    addCylinder(bodyGroup, [0.18, 0.32, -0.45], 0.045, 0.055, 0.48, materials.chrome, { rotation: [0.35, 0, 0] });
    // Angular LED headlight mask
    addBox(bodyGroup, [0, 0.88, 0.62], [0.24, 0.20, 0.16], materials.metalDark);
    addBox(bodyGroup, [0, 0.88, 0.70], [0.18, 0.08, 0.04], trafficMats.headlightLens);
  }

  // Handlebars with grips & chrome stem
  addCylinder(bodyGroup, [0, 0.86, 0.44], 0.025, 0.025, 0.26, materials.chrome);
  addBox(bodyGroup, [0, 0.98, 0.44], [0.65, 0.04, 0.04], materials.chrome);
  for (const hx of [-0.30, 0.30]) {
    addBox(bodyGroup, [hx, 0.98, 0.44], [0.08, 0.055, 0.055], materials.metalDark); // rubber grips
    // Mirrors
    addCylinder(bodyGroup, [hx * 0.9, 1.05, 0.44], 0.01, 0.01, 0.14, materials.chrome);
    addBox(bodyGroup, [hx * 0.9, 1.12, 0.44], [0.08, 0.05, 0.02], materials.metalDark);
  }

  // Tail light
  addBox(bodyGroup, [0, 0.52, -bikeLen * 0.48], [0.16, 0.08, 0.04], trafficMats.taillightLens);

  // Rider seated
  buildMotorcycleRider(bodyGroup, [0, 0.38, -0.15], { isRetro, helmetMat: colorMat });

  // Front & Rear Wheels
  for (const wz of [halfWb, -halfWb]) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, wheelRadius, wz);
    root.add(wheelGroup);

    // Tire
    addCylinder(wheelGroup, [0, 0, 0], wheelRadius, wheelRadius, wheelW, materials.carRubber, {
      segments: 18,
      rotation: [0, 0, Math.PI * 0.5]
    });
    // Rim
    addCylinder(wheelGroup, [0, 0, 0], wheelRadius * 0.68, wheelRadius * 0.68, wheelW * 0.8, materials.chrome, {
      segments: 14,
      rotation: [0, 0, Math.PI * 0.5]
    });
    wheels.push(wheelGroup);
  }

  return { root, bodyGroup, wheels, length: bikeLen, radius: wheelRadius };
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
  // Diagonal brace
  addCylinder(mastGroup, [0, armY - 0.5, armEnd * 0.28], 0.05, 0.05, 1.4, trafficMats.housing, {
    rotation: [armZDir * 0.65, 0, 0]
  });

  // --- Overhead 3-Aspect Traffic Signal Head (Dual-Faced for 360° visibility) ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, armY - 0.65, armEnd * 0.75);
  // Rotate head:
  // facingDir = -1 faces East (+X, for Westbound lane) -> rotation.y = Math.PI * 0.5
  // facingDir = +1 faces West (-X, for Eastbound lane) -> rotation.y = -Math.PI * 0.5
  headGroup.rotation.y = facingDir === -1 ? Math.PI * 0.5 : -Math.PI * 0.5;
  mastGroup.add(headGroup);

  const redMeshes = [];
  const yellowMeshes = [];
  const greenMeshes = [];
  const pedRedMeshes = [];
  const pedGreenMeshes = [];

  // Main housing body
  addBox(headGroup, [0, 0, 0], [0.42, 1.35, 0.64], trafficMats.housing);

  // Helper to build 3-aspect face
  function addSignalFace(parent, zOffset, isNegative) {
    const dir = isNegative ? -1 : 1;
    // Target backboard with yellow safety border
    addBox(parent, [0, 0, zOffset], [0.65, 1.45, 0.04], trafficMats.backingBoard);
    addBox(parent, [0, 0, zOffset + dir * 0.01], [0.61, 1.41, 0.02], trafficMats.borderYellow);

    const lensRadius = 0.12;
    const rM = addCylinder(parent, [0, 0.36, zOffset + dir * 0.08], lensRadius, lensRadius, 0.06, trafficMats.redOff, {
      segments: 16,
      rotation: [Math.PI * 0.5, 0, 0]
    });
    const yM = addCylinder(parent, [0, 0.0, zOffset + dir * 0.08], lensRadius, lensRadius, 0.06, trafficMats.yellowOff, {
      segments: 16,
      rotation: [Math.PI * 0.5, 0, 0]
    });
    const gM = addCylinder(parent, [0, -0.36, zOffset + dir * 0.08], lensRadius, lensRadius, 0.06, trafficMats.greenOn, {
      segments: 16,
      rotation: [Math.PI * 0.5, 0, 0]
    });
    redMeshes.push(rM);
    yellowMeshes.push(yM);
    greenMeshes.push(gM);

    // Sun hoods over lenses
    for (const ly of [0.36, 0.0, -0.36]) {
      addCylinder(parent, [0, ly + 0.11, zOffset + dir * 0.14], 0.13, 0.13, 0.14, trafficMats.housing, {
        segments: 12,
        rotation: [Math.PI * 0.5, 0, 0]
      });
    }
  }

  // Primary face (front facing oncoming traffic)
  addSignalFace(headGroup, 0.32, false);
  // Secondary face (reverse face for oncoming reverse/crosswalk visibility)
  addSignalFace(headGroup, -0.32, true);

  // --- Pedestrian Signal Head at Eye Level on Post (facing crosswalk) ---
  const pedGroup = new THREE.Group();
  pedGroup.position.set(0, 2.5, 0.28 * armZDir);
  // Face perpendicular across crosswalk
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
  // North Pole on sidewalk (z = 29.3, x = 4.8) facing Eastbound approaching vehicles (facing +X)
  const northSignal = buildTrafficLightMast(trafficGroup, [4.8, 0.12, 29.3], -1, { armSpan: 4.8 });
  // South Pole on road verge (z = 41.5, x = -4.8) facing Westbound approaching vehicles (facing -X)
  const southSignal = buildTrafficLightMast(trafficGroup, [-4.8, 0.02, 41.5], 1, { armSpan: 4.8 });

  const signals = [northSignal, southSignal];

  // Add Rapier colliders for the traffic light poles so player can't walk through them
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
    { type: 'car', model: 'sports', mat: trafficMats.coupeRed, startX: 24.0, speed: 12.0 },
    { type: 'bike', model: 'scooter', mat: trafficMats.scooterCyan, startX: 8.0, speed: 12.5 },
    { type: 'car', model: 'suv', mat: materials.carSuvWhite, startX: -14.0, speed: 11.5 },
    { type: 'car', model: 'taxi', mat: trafficMats.taxiYellow, startX: -34.0, speed: 11.0 },
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
      lane: 'westbound',
      dir: -1,
      x: spec.startX,
      z: 32.8,
      speed: spec.speed,
      cruisingSpeed: spec.speed,
      clock: Math.random() * 20,
    });
  }

  // Eastbound Lane (South lane, z = 38.2, moving direction = +1 [from -X to +X])
  const ebSpecs = [
    { type: 'car', model: 'sedan', mat: trafficMats.sedanBlue, startX: -26.0, speed: 12.0 },
    { type: 'bike', model: 'sport', mat: trafficMats.scooterOrange, startX: -10.0, speed: 13.0 },
    { type: 'bike', model: 'retro', mat: trafficMats.scooterMint, startX: 12.0, speed: 11.0 },
    { type: 'car', model: 'sedan', mat: materials.carSuvBlack, startX: 30.0, speed: 11.5 },
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
      lane: 'eastbound',
      dir: 1,
      x: spec.startX,
      z: 38.2,
      speed: spec.speed,
      cruisingSpeed: spec.speed,
      clock: Math.random() * 20,
    });
  }

  // =========================================================================
  // 4. Traffic Light State Machine & Controller
  // =========================================================================
  const initialLightParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('trafficLight')
    : null;
  let trafficLightState = (initialLightParam && ['RED', 'YELLOW', 'GREEN'].includes(initialLightParam.toUpperCase()))
    ? initialLightParam.toUpperCase()
    : 'GREEN';
  let holdTrafficLight = !!initialLightParam;
  let stateTimer = 0;
  const GREEN_DURATION = 10.0;
  const YELLOW_DURATION = 3.0;
  const RED_DURATION = 8.0;

  function updateSignalLenses() {
    const isGreen = trafficLightState === 'GREEN';
    const isYellow = trafficLightState === 'YELLOW';
    const isRed = trafficLightState === 'RED';

    const gMat = isGreen ? trafficMats.greenOn : trafficMats.greenOff;
    const yMat = isYellow ? trafficMats.yellowOn : trafficMats.yellowOff;
    const rMat = isRed ? trafficMats.redOn : trafficMats.redOff;
    const prMat = isRed ? trafficMats.pedOff : trafficMats.pedRedOn;
    const pgMat = isRed ? trafficMats.pedGreenOn : trafficMats.pedOff;

    for (const sig of signals) {
      for (const m of sig.greenMeshes) m.material = gMat;
      for (const m of sig.yellowMeshes) m.material = yMat;
      for (const m of sig.redMeshes) m.material = rMat;
      for (const m of sig.pedRedMeshes) m.material = prMat;
      for (const m of sig.pedGreenMeshes) m.material = pgMat;
    }
  }

  // Initialize lens states
  updateSignalLenses();

  // =========================================================================
  // 5. Update Loop
  // =========================================================================
  const ROAD_MIN_X = -54.0;
  const ROAD_MAX_X = 54.0;
  const STOP_LINE_WB = 5.2;   // Westbound stop bar at x = 5.2
  const STOP_LINE_EB = -5.2;  // Eastbound stop bar at x = -5.2

  function update(delta) {
    const dt = Math.min(0.06, delta);
    if (!holdTrafficLight) {
      stateTimer += dt;

      // Cycle traffic light
      if (trafficLightState === 'GREEN' && stateTimer >= GREEN_DURATION) {
        trafficLightState = 'YELLOW';
        stateTimer = 0;
        updateSignalLenses();
      } else if (trafficLightState === 'YELLOW' && stateTimer >= YELLOW_DURATION) {
        trafficLightState = 'RED';
        stateTimer = 0;
        updateSignalLenses();
      } else if (trafficLightState === 'RED' && stateTimer >= RED_DURATION) {
        trafficLightState = 'GREEN';
        stateTimer = 0;
        updateSignalLenses();
      }
    }

    // Sort vehicles in each lane by distance along travel direction to calculate queueing
    for (const laneName of ['westbound', 'eastbound']) {
      const laneVehicles = vehicles.filter((v) => v.lane === laneName);
      const isWB = laneName === 'westbound';
      const stopLineX = isWB ? STOP_LINE_WB : STOP_LINE_EB;
      const dir = isWB ? -1 : 1;

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
        if (trafficLightState === 'RED') {
          // If approaching stop line within 20m and hasn't crossed yet
          if (distToStop > -0.5 && distToStop < 22.0) {
            mustStopForSignal = true;
          }
        } else if (trafficLightState === 'YELLOW') {
          // If approaching but far enough to stop comfortably (> 6m)
          if (distToStop > 6.0 && distToStop < 20.0) {
            mustStopForSignal = true;
          }
        }

        // 2. Queueing & Distance to vehicle ahead
        let distToLeader = 999.0;
        let leaderSpeed = v.cruisingSpeed;
        if (i > 0) {
          const leader = laneVehicles[i - 1];
          // Positive distance between front of current and rear of leader
          distToLeader = ((leader.x - v.x) * dir) - (leader.length * 0.5 + v.length * 0.5);
          leaderSpeed = leader.speed;
        }

        // 3. Acceleration / Deceleration Logic
        let targetSpeed = v.cruisingSpeed;

        if (mustStopForSignal && distToStop <= 18.0) {
          // Smooth deceleration towards stop line
          const decelTarget = Math.max(0, (distToStop - 0.8) * 1.4);
          targetSpeed = Math.min(targetSpeed, decelTarget);
        }

        // Keep safe following distance behind leader (min buffer 2.2m)
        if (distToLeader < 16.0) {
          const followTarget = Math.max(0, Math.min(leaderSpeed, (distToLeader - 2.2) * 1.5));
          targetSpeed = Math.min(targetSpeed, followTarget);
        }

        // Apply smooth acceleration/braking
        if (v.speed < targetSpeed) {
          v.speed = Math.min(targetSpeed, v.speed + 6.5 * dt);
        } else if (v.speed > targetSpeed) {
          v.speed = Math.max(targetSpeed, v.speed - 9.0 * dt);
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
        // Rolling forward: wheel rotation around local X axis
        const angularVelocity = (v.speed / v.radius) * dt;
        for (const w of v.wheels) {
          w.rotation.x += angularVelocity;
        }

        // 7. Suspension Bobbing & Idle Vibration
        if (v.speed > 0.5) {
          v.bodyGroup.position.y = Math.sin(v.clock * 14.0) * 0.012;
          if (v.type === 'bike') {
            // Subtle dynamic banking lean when riding
            v.bodyGroup.rotation.z = Math.sin(v.clock * 3.0) * 0.025;
          }
        } else {
          // Subtle engine idle rumble when stopped at red light
          v.bodyGroup.position.y = Math.sin(v.clock * 22.0) * 0.003;
          if (v.type === 'bike') {
            v.bodyGroup.rotation.z = 0;
          }
        }
      }
    }
  }

  const api = {
    trafficGroup,
    update,
    getLightState: () => trafficLightState,
    setLightState: (st, hold = false) => {
      trafficLightState = st;
      stateTimer = 0;
      holdTrafficLight = hold;
      updateSignalLenses();
    },
    signals,
    vehicles,
  };
  if (typeof window !== 'undefined') {
    window.__TRAFFIC_SYSTEM__ = api;
  }
  return api;
}
