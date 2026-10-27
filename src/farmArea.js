import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector } from './geometry.js';

/**
 * Creates Zone G: Peternakan (Farm & Livestock Area)
 * Features Red Barn, Silo, Cattle Pasture with Holstein Cows,
 * Chicken Coop with Chickens, and Aquaculture Fish Ponds with swimming fish.
 * Spans x: [-45.0, -13.0], z: [-46.0, -19.0]
 */
export function createFarmArea(scene, world, RAPIER, staticBodies) {
  const farmGroup = new THREE.Group();
  scene.add(farmGroup);
  const batch = new BatchCollector();

  const animatedCows = [];
  const animatedChickens = [];
  const animatedFish = [];
  let farmWorker = null;

  // Farm ground gravel/dirt foundation (z: [-46.0, -19.0], x: [-45.0, -13.0])
  batch.addBox([-29.0, -0.05, -32.5], [32.0, 0.12, 27.0], materials.soil);

  // =========================================================================
  // 1. Red American Barn (x = -34.0, z = -35.0)
  // =========================================================================
  const barnX = -34.0;
  const barnZ = -35.0;
  const barnW = 12.0;
  const barnD = 10.0;
  const barnH = 5.5;

  // Stone foundation
  batch.addBox([barnX, 0.3, barnZ], [barnW + 0.4, 0.6, barnD + 0.4], materials.foundation);
  // Red timber walls
  batch.addBox([barnX, barnH * 0.5 + 0.3, barnZ], [barnW, barnH, barnD], materials.barnRed);
  // White vertical corner trim
  for (const sx of [-barnW * 0.5, barnW * 0.5]) {
    for (const sz of [-barnD * 0.5, barnD * 0.5]) {
      batch.addBox([barnX + sx, barnH * 0.5 + 0.3, barnZ + sz], [0.35, barnH + 0.2, 0.35], materials.barnWhite);
    }
  }

  // Double gambrel barn roof (lower steep slope, upper shallow slope)
  // Lower steep roof pitches (left & right)
  batch.addBox([barnX - 4.2, barnH + 1.2, barnZ], [4.5, 0.22, barnD + 0.8], materials.barnRoof, { rotation: [0, 0, 0.62] });
  batch.addBox([barnX + 4.2, barnH + 1.2, barnZ], [4.5, 0.22, barnD + 0.8], materials.barnRoof, { rotation: [0, 0, -0.62] });
  // Upper shallow roof ridge
  batch.addBox([barnX - 1.6, barnH + 2.4, barnZ], [3.8, 0.2, barnD + 0.8], materials.barnRoof, { rotation: [0, 0, 0.25] });
  batch.addBox([barnX + 1.6, barnH + 2.4, barnZ], [3.8, 0.2, barnD + 0.8], materials.barnRoof, { rotation: [0, 0, -0.25] });
  // White roof fascia trim
  batch.addBox([barnX, barnH + 2.9, barnZ], [0.3, 0.3, barnD + 0.9], materials.barnWhite);

  // Roof Cupola & Weather Vane
  batch.addBox([barnX, barnH + 3.4, barnZ], [1.6, 1.0, 1.6], materials.barnWhite);
  batch.addCylinder([barnX, barnH + 4.2, barnZ], 0.02, 1.3, 0.6, materials.barnRoof, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });
  batch.addCylinder([barnX, barnH + 4.8, barnZ], 0.03, 0.03, 0.8, materials.brass);
  // Rooster silhouette
  batch.addBox([barnX, barnH + 5.2, barnZ], [0.55, 0.35, 0.05], materials.brass);

  // Front (South-facing) White Cross-Braced Barn Sliding Doors (x = -34.0, z = -30.0)
  batch.addBox([barnX, 1.8, barnZ + barnD * 0.5 + 0.08], [4.2, 3.2, 0.12], materials.barnWhite);
  // Door frame and red panels with white X cross braces
  batch.addBox([barnX - 1.05, 1.8, barnZ + barnD * 0.5 + 0.12], [1.8, 2.9, 0.08], materials.barnRed);
  batch.addBox([barnX + 1.05, 1.8, barnZ + barnD * 0.5 + 0.12], [1.8, 2.9, 0.08], materials.barnRed);
  // Upper hay loft loading door and protruding hoist beam
  batch.addBox([barnX, 4.4, barnZ + barnD * 0.5 + 0.08], [1.8, 1.6, 0.08], materials.barnWhite);
  batch.addBox([barnX, 5.4, barnZ + barnD * 0.5 + 0.6], [0.2, 0.2, 1.4], materials.woodDark);
  // Hanging hoist pulley
  batch.addCylinder([barnX, 5.0, barnZ + barnD * 0.5 + 1.1], 0.12, 0.12, 0.06, materials.brass, { rotation: [0, 0, Math.PI * 0.5] });

  // Barn exterior gooseneck lamp above doors
  batch.addCylinder([barnX, 3.8, barnZ + barnD * 0.5 + 0.45], 0.02, 0.02, 0.6, materials.metalDark, { rotation: [Math.PI * 0.35, 0, 0] });
  batch.addCylinder([barnX, 3.65, barnZ + barnD * 0.5 + 0.7], 0.06, 0.35, 0.15, materials.metalDark);
  batch.addSphere([barnX, 3.6, barnZ + barnD * 0.5 + 0.7], [0.08, 0.1, 0.08], materials.glow, { shadow: false });

  const barnLight = new THREE.PointLight(0xffdfa0, 1.2, 8.0, 2.0);
  barnLight.position.set(barnX, 3.6, barnZ + barnD * 0.5 + 0.7);
  farmGroup.add(barnLight);

  // Barn physics collider
  const barnBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(barnX, barnH * 0.5 + 0.3, barnZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(barnW * 0.5, barnH * 0.5, barnD * 0.5), barnBody);
  staticBodies.push(barnBody);

  // =========================================================================
  // 2. Feed Silo (x = -42.5, z = -36.0)
  // =========================================================================
  const siloX = -42.5;
  const siloZ = -36.0;
  const siloR = 2.0;
  const siloH = 9.5;

  // Concrete foundation base
  batch.addCylinder([siloX, 0.35, siloZ], siloR + 0.2, siloR + 0.2, 0.7, materials.foundation, { segments: 24 });
  // Corrugated metal vertical silo body
  batch.addCylinder([siloX, siloH * 0.5 + 0.7, siloZ], siloR, siloR, siloH, materials.siloMetal, { segments: 24 });
  // Decorative horizontal metal bands
  for (let y = 2.0; y <= siloH; y += 2.2) {
    batch.addCylinder([siloX, y, siloZ], siloR + 0.04, siloR + 0.04, 0.08, materials.chrome, { segments: 24 });
  }
  // Domed metal top cap
  batch.addSphere([siloX, siloH + 0.7, siloZ], [siloR, 1.4, siloR], materials.siloDome);
  // Silo access ladder (steel rungs)
  for (let ly = 1.0; ly <= siloH; ly += 0.5) {
    batch.addBox([siloX + siloR + 0.1, ly, siloZ], [0.08, 0.04, 0.5], materials.metalDark);
  }

  // Silo physics collider
  const siloBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(siloX, siloH * 0.5 + 0.7, siloZ));
  world.createCollider(RAPIER.ColliderDesc.cylinder(siloH * 0.5 + 0.7, siloR), siloBody);
  staticBodies.push(siloBody);

  // =========================================================================
  // 3. Cattle Pasture & Holstein Cows (x: [-28.0, -14.0], z: [-44.0, -32.0])
  // =========================================================================
  const pastX = -21.0;
  const pastZ = -38.0;
  const pastW = 14.0;
  const pastD = 12.0;

  // Lush green pasture ground
  batch.addBox([pastX, 0.01, pastZ], [pastW - 0.5, 0.04, pastD - 0.5], materials.lawnRaised);

  // Split-rail wooden fence surrounding cattle pasture
  function addPastureFence() {
    const postStep = 3.2;
    // South fence
    for (let x = pastX - pastW * 0.5; x <= pastX + pastW * 0.5; x += postStep) {
      batch.addBox([x, 0.65, pastZ + pastD * 0.5], [0.18, 1.3, 0.18], materials.woodDark);
    }
    batch.addBox([pastX, 0.45, pastZ + pastD * 0.5], [pastW, 0.1, 0.08], materials.woodWarm);
    batch.addBox([pastX, 0.95, pastZ + pastD * 0.5], [pastW, 0.1, 0.08], materials.woodWarm);

    // North fence
    for (let x = pastX - pastW * 0.5; x <= pastX + pastW * 0.5; x += postStep) {
      batch.addBox([x, 0.65, pastZ - pastD * 0.5], [0.18, 1.3, 0.18], materials.woodDark);
    }
    batch.addBox([pastX, 0.45, pastZ - pastD * 0.5], [pastW, 0.1, 0.08], materials.woodWarm);
    batch.addBox([pastX, 0.95, pastZ - pastD * 0.5], [pastW, 0.1, 0.08], materials.woodWarm);

    // East fence (facing courtyard/mansion)
    for (let z = pastZ - pastD * 0.5; z <= pastZ + pastD * 0.5; z += postStep) {
      batch.addBox([pastX + pastW * 0.5, 0.65, z], [0.18, 1.3, 0.18], materials.woodDark);
    }
    batch.addBox([pastX + pastW * 0.5, 0.45, pastZ], [0.08, 0.1, pastD], materials.woodWarm);
    batch.addBox([pastX + pastW * 0.5, 0.95, pastZ], [0.08, 0.1, pastD], materials.woodWarm);
  }
  addPastureFence();

  // Pasture fence colliders
  const fenceNorth = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pastX, 0.65, pastZ - pastD * 0.5));
  world.createCollider(RAPIER.ColliderDesc.cuboid(pastW * 0.5, 0.65, 0.2), fenceNorth);
  staticBodies.push(fenceNorth);

  const fenceEast = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pastX + pastW * 0.5, 0.65, pastZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.65, pastD * 0.5), fenceEast);
  staticBodies.push(fenceEast);

  const fenceSouth = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pastX, 0.65, pastZ + pastD * 0.5));
  world.createCollider(RAPIER.ColliderDesc.cuboid(pastW * 0.5, 0.65, 0.2), fenceSouth);
  staticBodies.push(fenceSouth);

  // Heavy timber feed trough filled with golden hay
  batch.addBox([pastX - 3.5, 0.35, pastZ - 2.5], [2.8, 0.6, 0.9], materials.woodDark);
  batch.addBox([pastX - 3.5, 0.65, pastZ - 2.5], [2.6, 0.15, 0.75], materials.hayGolden);

  // Stone water trough with blue water
  batch.addBox([pastX + 3.5, 0.35, pastZ - 2.5], [2.4, 0.6, 0.9], materials.stoneWarm);
  batch.addBox([pastX + 3.5, 0.55, pastZ - 2.5], [2.1, 0.1, 0.7], materials.waterfallPond);

  // Stacked golden hay bales (cylindrical rolled bales & rectangular bales)
  // Rolled bales
  for (const [rx, rz] of [[pastX - 4.5, pastZ + 3.5], [pastX - 2.5, pastZ + 3.5], [pastX - 3.5, pastZ + 4.8]]) {
    batch.addCylinder([rx, 0.65, rz], 0.65, 0.65, 1.1, materials.hayGolden, { rotation: [0, 0, Math.PI * 0.5], segments: 16 });
  }
  // Rectangular stacked bales
  for (const [bx, by, bz] of [
    [pastX + 3.2, 0.3, pastZ + 3.5],
    [pastX + 4.4, 0.3, pastZ + 3.5],
    [pastX + 3.8, 0.7, pastZ + 3.5],
  ]) {
    batch.addBox([bx, by, bz], [1.1, 0.5, 0.65], materials.hayGolden);
  }

  // 3 Stylized Cartoon Holstein Cows
  function createHolsteinCow(cx, cz, rotY) {
    const cowRig = new THREE.Group();
    cowRig.position.set(cx, 0, cz);
    cowRig.rotation.y = rotY;
    farmGroup.add(cowRig);

    const cb = new BatchCollector();

    // 4 sturdy legs with dark hooves
    const legOffsets = [
      [-0.45, 0.45, 0.75],
      [0.45, 0.45, 0.75],
      [-0.45, 0.45, -0.75],
      [0.45, 0.45, -0.75],
    ];
    for (const [lx, ly, lz] of legOffsets) {
      cb.addCylinder([lx, ly, lz], 0.14, 0.16, 0.75, materials.cowWhite, { segments: 10 });
      cb.addCylinder([lx, 0.08, lz], 0.16, 0.18, 0.16, materials.cowBlack, { segments: 10 });
    }

    // Main rounded barrel body
    cb.addBox([0, 1.15, 0], [1.35, 1.1, 2.1], materials.cowWhite);
    // Distinctive organic black patches across body
    cb.addSphere([0.5, 1.45, 0.3], [0.38, 0.28, 0.45], materials.cowBlack);
    cb.addSphere([-0.45, 1.35, -0.4], [0.35, 0.28, 0.52], materials.cowBlack);
    cb.addSphere([0.15, 1.6, -0.2], [0.42, 0.22, 0.38], materials.cowBlack);
    cb.addSphere([-0.3, 0.95, 0.5], [0.32, 0.25, 0.36], materials.cowBlack);

    // Udder underside
    cb.addSphere([0, 0.65, -0.3], [0.32, 0.22, 0.35], materials.cowPink);

    // Tail with hairy tuft
    cb.addCylinder([0, 1.0, -1.15], 0.04, 0.05, 0.7, materials.cowWhite, { rotation: [0.25, 0, 0] });
    cb.addSphere([0, 0.65, -1.25], [0.1, 0.14, 0.1], materials.cowBlack);

    cb.build(cowRig, true);

    // Separate head group for idle head bobbing
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.45, 1.05);
    cowRig.add(headGroup);

    const hb = new BatchCollector();
    // Neck
    hb.addBox([0, 0.05, 0.2], [0.72, 0.75, 0.65], materials.cowWhite);
    // Head cube with rounded features
    hb.addBox([0, 0.25, 0.55], [0.78, 0.8, 0.82], materials.cowWhite);
    // Black patch over one eye
    hb.addSphere([0.22, 0.42, 0.72], [0.24, 0.22, 0.22], materials.cowBlack);
    // Cute pink muzzle
    hb.addBox([0, 0.08, 0.98], [0.65, 0.42, 0.35], materials.cowPink);
    // Nostrils
    hb.addSphere([-0.14, 0.12, 1.15], [0.04, 0.06, 0.04], materials.cowBlack);
    hb.addSphere([0.14, 0.12, 1.15], [0.04, 0.06, 0.04], materials.cowBlack);
    // Big dark cartoon eyes
    hb.addSphere([-0.36, 0.42, 0.78], [0.08, 0.08, 0.08], materials.cowBlack);
    hb.addSphere([0.36, 0.42, 0.78], [0.08, 0.08, 0.08], materials.cowBlack);
    // White eye highlights
    hb.addSphere([-0.38, 0.45, 0.84], [0.03, 0.03, 0.03], materials.cowWhite);
    hb.addSphere([0.38, 0.45, 0.84], [0.03, 0.03, 0.03], materials.cowWhite);
    // Cute horizontal floppy ears
    hb.addBox([-0.54, 0.45, 0.48], [0.38, 0.14, 0.22], materials.cowWhite, { rotation: [0, 0, -0.2] });
    hb.addBox([0.54, 0.45, 0.48], [0.38, 0.14, 0.22], materials.cowBlack, { rotation: [0, 0, 0.2] });
    // Small curved horns
    hb.addCylinder([-0.28, 0.74, 0.48], 0.03, 0.07, 0.28, materials.strawHat, { rotation: [0.15, 0, -0.35] });
    hb.addCylinder([0.28, 0.74, 0.48], 0.03, 0.07, 0.28, materials.strawHat, { rotation: [0.15, 0, 0.35] });

    hb.build(headGroup, true);

    // Physics collider
    const cowBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, 0.85, cz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.7, 0.85, 1.1), cowBody);
    staticBodies.push(cowBody);

    return {
      group: cowRig,
      head: headGroup,
      clock: Math.random() * 10,
    };
  }

  animatedCows.push(createHolsteinCow(pastX - 3.0, pastZ, 0.4));
  animatedCows.push(createHolsteinCow(pastX + 2.5, pastZ + 1.2, -0.8));
  animatedCows.push(createHolsteinCow(pastX, pastZ - 3.2, Math.PI * 0.9));

  // =========================================================================
  // 4. Chicken Coop & Chickens (x = -38.5, z = -25.0)
  // =========================================================================
  const coopX = -38.5;
  const coopZ = -25.0;

  // Stilt posts elevating the wooden coop
  for (const [sx, sz] of [[-1.2, -1.0], [1.2, -1.0], [-1.2, 1.0], [1.2, 1.0]]) {
    batch.addCylinder([coopX + sx, 0.5, coopZ + sz], 0.08, 0.08, 1.0, materials.woodDark);
  }
  // Elevated coop house
  batch.addBox([coopX, 1.75, coopZ], [2.8, 1.5, 2.4], materials.woodLight);
  // Pitched tin roof
  batch.addBox([coopX - 0.75, 2.65, coopZ], [1.6, 0.1, 2.7], materials.siloDome, { rotation: [0, 0, 0.42] });
  batch.addBox([coopX + 0.75, 2.65, coopZ], [1.6, 0.1, 2.7], materials.siloDome, { rotation: [0, 0, -0.42] });
  // Pop door & wooden access ramp down to ground
  batch.addBox([coopX + 1.42, 1.45, coopZ], [0.06, 0.7, 0.55], materials.metalDark);
  batch.addBox([coopX + 2.1, 0.52, coopZ], [1.4, 0.06, 0.5], materials.woodWarm, { rotation: [0, 0, -0.68] });
  // Rung cleats on ramp
  for (let rx = 1.6; rx <= 2.6; rx += 0.25) {
    batch.addBox([coopX + rx, (2.8 - rx) * 0.72, coopZ], [0.04, 0.04, 0.45], materials.woodDark);
  }

  // Fenced chicken run
  const runX = coopX + 3.2;
  const runZ = coopZ;
  batch.addBox([runX, 0.01, runZ], [4.5, 0.02, 3.8], materials.soil);
  // Wire mesh fence posts
  for (const [px, pz] of [
    [runX - 2.2, runZ - 1.8], [runX + 2.2, runZ - 1.8],
    [runX - 2.2, runZ + 1.8], [runX + 2.2, runZ + 1.8],
    [runX + 2.2, runZ],
  ]) {
    batch.addCylinder([px, 0.6, pz], 0.05, 0.05, 1.2, materials.woodDark);
  }
  // Low wire fence railing
  batch.addBox([runX, 0.95, runZ + 1.8], [4.4, 0.04, 0.04], materials.metalDark);
  batch.addBox([runX, 0.95, runZ - 1.8], [4.4, 0.04, 0.04], materials.metalDark);
  batch.addBox([runX + 2.2, 0.95, runZ], [0.04, 0.04, 3.6], materials.metalDark);

  // Coop physics collider
  const coopBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(coopX, 1.2, coopZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(1.5, 1.2, 1.3), coopBody);
  staticBodies.push(coopBody);

  // 4 Stylized Cartoon Chickens
  function createChicken(kx, kz, rotY) {
    const chkRig = new THREE.Group();
    chkRig.position.set(kx, 0, kz);
    chkRig.rotation.y = rotY;
    farmGroup.add(chkRig);

    const cb = new BatchCollector();
    // Yellow stick legs
    cb.addCylinder([-0.08, 0.14, 0], 0.02, 0.02, 0.28, materials.chickenBeak);
    cb.addCylinder([0.08, 0.14, 0], 0.02, 0.02, 0.28, materials.chickenBeak);
    // Rounded egg-shaped white body
    cb.addSphere([0, 0.42, 0], [0.22, 0.24, 0.28], materials.chickenFeather);
    // Fluffy tail feathers pointing up
    cb.addBox([0, 0.52, -0.22], [0.14, 0.22, 0.12], materials.chickenFeather, { rotation: [0.45, 0, 0] });
    // Little wings on sides
    cb.addSphere([-0.2, 0.42, 0], [0.06, 0.14, 0.18], materials.chickenFeather);
    cb.addSphere([0.2, 0.42, 0], [0.06, 0.14, 0.18], materials.chickenFeather);
    // Cute round head
    cb.addSphere([0, 0.62, 0.16], [0.14, 0.14, 0.14], materials.chickenFeather);
    // Bright red crown comb
    cb.addBox([0, 0.78, 0.14], [0.04, 0.12, 0.18], materials.chickenComb);
    // Red wattle under chin
    cb.addBox([0, 0.52, 0.28], [0.04, 0.08, 0.06], materials.chickenComb);
    // Yellow triangular beak
    cb.addCylinder([0, 0.62, 0.32], 0.01, 0.06, 0.12, materials.chickenBeak, { rotation: [Math.PI * 0.5, 0, 0] });
    // Beady black eyes
    cb.addSphere([-0.1, 0.65, 0.24], [0.025, 0.025, 0.025], materials.cowBlack);
    cb.addSphere([0.1, 0.65, 0.24], [0.025, 0.025, 0.025], materials.cowBlack);

    cb.build(chkRig, true);

    return {
      group: chkRig,
      clock: Math.random() * 10,
    };
  }

  animatedChickens.push(createChicken(runX - 0.8, runZ - 0.5, 0.5));
  animatedChickens.push(createChicken(runX + 0.8, runZ + 0.6, -1.2));
  animatedChickens.push(createChicken(runX + 1.2, runZ - 0.8, 2.1));
  animatedChickens.push(createChicken(runX - 0.2, runZ + 0.9, -0.4));

  // =========================================================================
  // 5. Aquaculture Fish Ponds & Swimming Fish (x: [-24.0, -14.0], z: [-29.0, -21.0])
  // =========================================================================
  const pondX = -19.0;
  const pondZ = -25.0;
  const pondW = 9.0;
  const pondD = 7.5;

  // Raised stone perimeter basin
  batch.addBox([pondX, 0.3, pondZ], [pondW, 0.6, pondD], materials.stoneWarm);
  // Recessed crystal blue water surface
  const waterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(pondW - 0.8, 0.05, pondD - 0.8),
    materials.waterfallPond
  );
  waterMesh.position.set(pondX, 0.45, pondZ);
  waterMesh.receiveShadow = true;
  farmGroup.add(waterMesh);

  // Central dividing walkway / pier with safety handrail
  batch.addBox([pondX, 0.55, pondZ], [1.2, 0.15, pondD - 0.2], materials.woodWarm);
  for (let z = pondZ - 3.0; z <= pondZ + 3.0; z += 1.5) {
    batch.addCylinder([pondX - 0.55, 0.95, z], 0.04, 0.04, 0.8, materials.woodDark);
    batch.addCylinder([pondX + 0.55, 0.95, z], 0.04, 0.04, 0.8, materials.woodDark);
  }
  // Rope handrail
  batch.addBox([pondX - 0.55, 1.3, pondZ], [0.04, 0.04, pondD - 0.8], materials.strawHat);
  batch.addBox([pondX + 0.55, 1.3, pondZ], [0.04, 0.04, pondD - 0.8], materials.strawHat);

  // Wooden fish feeding bucket on the pier
  batch.addCylinder([pondX, 0.78, pondZ], 0.2, 0.24, 0.35, materials.woodLight);
  batch.addCylinder([pondX, 0.9, pondZ], 0.18, 0.18, 0.05, materials.hayGolden);

  // Pond physics collider
  const pondBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pondX, 0.35, pondZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(pondW * 0.5, 0.35, pondD * 0.5), pondBody);
  staticBodies.push(pondBody);

  // 6 Stylized Swimming Koi / Fish in the ponds
  function createFish(westSide = true) {
    const fGroup = new THREE.Group();
    farmGroup.add(fGroup);

    const fb = new BatchCollector();
    // Sleek orange/gold fish body
    fb.addSphere([0, 0, 0], [0.12, 0.15, 0.38], materials.yellowSun);
    // Tail fin
    fb.addBox([0, 0, -0.38], [0.02, 0.22, 0.18], materials.coral);
    // Side fins
    fb.addBox([0.14, 0, 0.05], [0.14, 0.02, 0.1], materials.coral, { rotation: [0, 0.3, 0] });
    fb.addBox([-0.14, 0, 0.05], [0.14, 0.02, 0.1], materials.coral, { rotation: [0, -0.3, 0] });

    fb.build(fGroup, false);

    const centerX = westSide ? pondX - 2.4 : pondX + 2.4;
    const centerZ = pondZ;
    const radiusX = 1.4 + Math.random() * 0.5;
    const radiusZ = 2.0 + Math.random() * 0.6;
    const speed = 0.8 + Math.random() * 0.4;

    return {
      group: fGroup,
      centerX,
      centerZ,
      radiusX,
      radiusZ,
      speed,
      angle: Math.random() * Math.PI * 2,
    };
  }

  for (let i = 0; i < 3; i += 1) animatedFish.push(createFish(true));
  for (let i = 0; i < 3; i += 1) animatedFish.push(createFish(false));

  // =========================================================================
  // 6. Farm Worker NPC (Peternak in Overalls & Straw Hat)
  // =========================================================================
  const workerX = -28.5;
  const workerZ = -28.0;
  const wGroup = new THREE.Group();
  wGroup.position.set(workerX, 0, workerZ);
  wGroup.rotation.y = -0.6;
  farmGroup.add(wGroup);

  const wb = new BatchCollector();
  // Work boots
  wb.addBox([-0.16, 0.12, 0], [0.2, 0.24, 0.34], materials.leatherDark);
  wb.addBox([0.16, 0.12, 0], [0.2, 0.24, 0.34], materials.leatherDark);
  // Blue denim overalls
  wb.addCylinder([-0.16, 0.55, 0], 0.12, 0.14, 0.68, materials.farmerOveralls);
  wb.addCylinder([0.16, 0.55, 0], 0.12, 0.14, 0.68, materials.farmerOveralls);
  // Torso in red checkered shirt with overall straps
  wb.addBox([0, 1.35, 0], [0.62, 0.78, 0.4], materials.farmerShirt);
  wb.addBox([-0.18, 1.42, 0.21], [0.09, 0.65, 0.03], materials.farmerOveralls); // Left strap
  wb.addBox([0.18, 1.42, 0.21], [0.09, 0.65, 0.03], materials.farmerOveralls); // Right strap
  wb.addBox([0, 1.15, 0.21], [0.42, 0.35, 0.03], materials.farmerOveralls); // Bib
  // Arms
  wb.addCylinder([-0.38, 1.3, 0.1], 0.09, 0.09, 0.65, materials.farmerShirt, { rotation: [0.2, 0, 0.15] });
  wb.addCylinder([0.38, 1.3, 0.1], 0.09, 0.09, 0.65, materials.farmerShirt, { rotation: [0.2, 0, -0.15] });
  // Hands
  wb.addSphere([-0.42, 0.95, 0.2], [0.08, 0.08, 0.08], materials.skin);
  wb.addSphere([0.42, 0.95, 0.2], [0.08, 0.08, 0.08], materials.skin);
  // Head & friendly smile
  wb.addSphere([0, 1.95, 0], [0.22, 0.24, 0.22], materials.skin);
  // Wide-brim woven straw hat
  wb.addCylinder([0, 2.12, 0], 0.52, 0.52, 0.05, materials.strawHat);
  wb.addCylinder([0, 2.22, 0], 0.24, 0.26, 0.2, materials.strawHat);

  // Wooden pitchfork held in hand
  wb.addCylinder([-0.42, 1.25, 0.25], 0.03, 0.03, 1.8, materials.woodDark);
  // Metal fork prongs
  wb.addBox([-0.42, 2.05, 0.25], [0.28, 0.04, 0.04], materials.chrome);
  for (const px of [-0.54, -0.46, -0.38, -0.3]) {
    wb.addCylinder([px, 2.22, 0.25], 0.015, 0.015, 0.32, materials.chrome);
  }

  wb.build(wGroup, true);

  // Farmer physics collider
  const fBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(workerX, 1.0, workerZ));
  world.createCollider(RAPIER.ColliderDesc.cylinder(1.0, 0.35), fBody);
  staticBodies.push(fBody);

  farmWorker = { group: wGroup, clock: 0 };

  batch.build(farmGroup, true);

  return {
    group: farmGroup,
    update: (delta) => {
      // 1. Animate cows (gentle breathing & head grazing)
      for (const c of animatedCows) {
        c.clock += delta;
        c.head.rotation.x = Math.sin(c.clock * 1.2) * 0.15 + 0.1;
        c.head.rotation.y = Math.sin(c.clock * 0.5) * 0.08;
      }
      // 2. Animate chickens (frequent quick pecks)
      for (const chk of animatedChickens) {
        chk.clock += delta;
        chk.group.rotation.x = Math.sin(chk.clock * 4.5) > 0.4 ? 0.35 : 0;
      }
      // 3. Animate swimming fish (swimming in elliptical paths)
      for (const f of animatedFish) {
        f.angle += delta * f.speed;
        const fx = f.centerX + Math.cos(f.angle) * f.radiusX;
        const fz = f.centerZ + Math.sin(f.angle) * f.radiusZ;
        f.group.position.set(fx, 0.35 + Math.sin(f.angle * 2.0) * 0.04, fz);
        // Face tangential velocity direction
        f.group.rotation.y = -f.angle + Math.PI * 0.5;
      }
      // 4. Farm worker idle
      if (farmWorker) {
        farmWorker.clock += delta;
        farmWorker.group.position.y = Math.sin(farmWorker.clock * 1.8) * 0.006;
      }
    },
  };
}
