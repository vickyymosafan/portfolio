import * as THREE from 'three';
import { materials, palette, vertexColorFamilies } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector } from './geometry.js';

/**
 * Creates Zone I: Perimeter Wall, Main Security Checkpoint,
 * Monument Wall, Guardhouse & External Public Highway
 * Faithfully matches "Vicky's Developer Life World Map.png"
 * Spans x: [-48.0, 48.0], z: [23.0, 42.0]
 */
export function createSecurityArea(scene, world, RAPIER, staticBodies) {
  const securityGroup = new THREE.Group();
  scene.add(securityGroup);
  const batch = new BatchCollector();
  const animatedGuards = [];

  // =========================================================================
  // 1. External Public Highway, Sidewalk & Curb (z: [25.0, 42.0])
  // =========================================================================
  // Raised concrete sidewalk in front of estate wall (z: [25.0, 29.5], x: [-48.0, 48.0])
  batch.addBox([0, 0.1, 27.25], [96.0, 0.2, 4.5], materials.curbConcrete);
  // Concrete curb drop facing roadway (z = 29.5)
  batch.addBox([0, 0.12, 29.5], [96.0, 0.24, 0.35], materials.stoneWarm);

  // Main 2-lane asphalt public highway (z: [29.6, 41.5], x: [-52.0, 52.0])
  batch.addBox([0, 0.02, 35.5], [104.0, 0.04, 11.8], materials.asphaltRoad);

  // Center double dashed yellow lines
  for (let x = -50.0; x <= 50.0; x += 4.5) {
    if (x > -5.0 && x < 5.0) continue; // Gap for crosswalk
    batch.addBox([x, 0.045, 35.35], [2.6, 0.008, 0.18], materials.asphaltMarkingYellow);
    batch.addBox([x, 0.045, 35.65], [2.6, 0.008, 0.18], materials.asphaltMarkingYellow);
  }

  // White road edge solid shoulder lines
  batch.addBox([0, 0.045, 30.2], [104.0, 0.008, 0.2], materials.asphaltMarkingWhite);
  batch.addBox([0, 0.045, 40.8], [104.0, 0.008, 0.2], materials.asphaltMarkingWhite);

  // Pedestrian Zebra Crosswalk in front of estate main gate (x: [-3.8, 3.8], z: [30.0, 41.0])
  for (let cz = 30.5; cz <= 40.5; cz += 1.4) {
    batch.addBox([0, 0.048, cz], [7.2, 0.008, 0.75], materials.asphaltMarkingWhite);
  }

  // Roadway Street Light Poles (Modern curved LED cobra-head poles at z = 29.0)
  const streetLightXs = [-42.0, -26.0, -10.0, 10.0, 26.0, 42.0];
  for (const lx of streetLightXs) {
    batch.addBox([lx, 0.25, 29.0], [0.6, 0.5, 0.6], materials.metalDark);
    batch.addCylinder([lx, 3.2, 29.0], 0.1, 0.16, 5.8, materials.metalDark);
    batch.addBox([lx, 5.9, 30.2], [0.12, 0.12, 2.5], materials.metalDark, { rotation: [0.18, 0, 0] });
    batch.addBox([lx, 5.75, 31.4], [0.38, 0.14, 0.95], materials.metalDark);
    batch.addBox([lx, 5.68, 31.4], [0.28, 0.04, 0.75], materials.glow, { shadow: false });

    const poleBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(lx, 3.0, 29.0));
    world.createCollider(RAPIER.ColliderDesc.cylinder(3.0, 0.3), poleBody);
    staticBodies.push(poleBody);
  }

  // =========================================================================
  // 2. White Luxury SUV Vehicle on Public Road (x = -18.0, z = 33.2)
  // =========================================================================
  const suvX = -18.0;
  const suvZ = 33.2;
  const suvGroup = new THREE.Group();
  suvGroup.position.set(suvX, 0, suvZ);
  securityGroup.add(suvGroup);

  const suvBatch = new BatchCollector();
  suvBatch.addBox([0, 0.35, 0], [4.8, 0.32, 2.1], materials.carRubber);
  suvBatch.addBox([0, 0.65, 0], [4.6, 0.45, 2.05], materials.carSuvWhite);
  suvBatch.addBox([1.4, 0.85, 0], [1.6, 0.35, 1.95], materials.carSuvWhite);
  suvBatch.addBox([2.22, 0.75, 0], [0.08, 0.38, 1.4], materials.chrome);
  suvBatch.addBox([2.18, 0.82, 0.72], [0.1, 0.14, 0.38], materials.glow, { shadow: false });
  suvBatch.addBox([2.18, 0.82, -0.72], [0.1, 0.14, 0.38], materials.glow, { shadow: false });
  suvBatch.addBox([-0.4, 1.35, 0], [2.6, 0.72, 1.75], materials.carGlass);
  suvBatch.addBox([-0.4, 1.75, 0], [2.5, 0.08, 1.72], materials.carSuvWhite);
  suvBatch.addBox([-0.4, 1.83, 0.75], [2.2, 0.06, 0.06], materials.metalDark);
  suvBatch.addBox([-0.4, 1.83, -0.75], [2.2, 0.06, 0.06], materials.metalDark);
  suvBatch.addBox([-2.25, 0.68, 0], [0.18, 0.48, 1.98], materials.carSuvWhite);
  suvBatch.addBox([-2.32, 0.88, 0.72], [0.08, 0.15, 0.36], materials.fireEmber, { shadow: false });
  suvBatch.addBox([-2.32, 0.88, -0.72], [0.08, 0.15, 0.36], materials.fireEmber, { shadow: false });

  const wheelOffsets = [
    [1.4, 0.42, 1.05],
    [1.4, 0.42, -1.05],
    [-1.4, 0.42, 1.05],
    [-1.4, 0.42, -1.05],
  ];
  for (const [wx, wy, wz] of wheelOffsets) {
    suvBatch.addCylinder([wx, wy, wz], 0.42, 0.42, 0.28, materials.carRubber, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 16,
    });
    suvBatch.addCylinder([wx, wy, wz + (wz > 0 ? 0.06 : -0.06)], 0.28, 0.28, 0.18, materials.chrome, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 12,
    });
  }
  suvBatch.build(suvGroup, true);

  const suvBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(suvX, 0.9, suvZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.4, 0.9, 1.1), suvBody);
  staticBodies.push(suvBody);

  // =========================================================================
  // 3. Helper: Luxury Estate Wall Pillar with Carriage Lantern
  // =========================================================================
  function addPerimeterPillar(px, pz, addLight = false) {
    // Tiered foundation base plinth
    batch.addBox([px, 0.24, pz], [1.08, 0.48, 1.08], materials.foundation);
    // Square architectural pillar shaft
    batch.addBox([px, 1.6, pz], [0.88, 2.24, 0.88], materials.perimeterPillar);
    // Recessed inset panels on 4 faces
    batch.addBox([px, 1.6, pz + 0.44], [0.68, 1.84, 0.02], materials.perimeterPanel);
    batch.addBox([px, 1.6, pz - 0.44], [0.68, 1.84, 0.02], materials.perimeterPanel);
    batch.addBox([px + 0.44, 1.6, pz], [0.02, 1.84, 0.68], materials.perimeterPanel);
    batch.addBox([px - 0.44, 1.6, pz], [0.02, 1.84, 0.68], materials.perimeterPanel);
    // Tiered cornice neck & capital
    batch.addBox([px, 2.76, pz], [0.96, 0.08, 0.96], materials.perimeterCap);
    batch.addBox([px, 2.88, pz], [1.14, 0.16, 1.14], materials.perimeterCap);

    // --- Classic Luxury Carriage Lantern on top of Pillar ---
    // Lantern base mount
    batch.addBox([px, 3.02, pz], [0.36, 0.12, 0.36], materials.carriageLanternMetal);
    batch.addCylinder([px, 3.12, pz], 0.08, 0.12, 0.08, materials.carriageLanternMetal);
    // 4 Corner bronze struts
    for (const [cx, cz] of [[0.14, 0.14], [-0.14, 0.14], [0.14, -0.14], [-0.14, -0.14]]) {
      batch.addBox([px + cx, 3.42, pz + cz], [0.035, 0.52, 0.035], materials.carriageLanternMetal);
    }
    // Luminous glass lantern core
    batch.addBox([px, 3.42, pz], [0.26, 0.46, 0.26], materials.carriageLanternGlass);
    batch.addSphere([px, 3.42, pz], [0.11, 0.16, 0.11], materials.glow, { shadow: false });
    // Pyramidal lantern roof cap with brass peak
    batch.addCylinder([px, 3.74, pz], 0.02, 0.4, 0.18, materials.carriageLanternMetal, {
      segments: 4,
      rotation: [0, Math.PI * 0.25, 0],
    });
    batch.addSphere([px, 3.86, pz], [0.05, 0.05, 0.05], materials.estateGateGold);

    // Physics collider
    const pBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(px, 1.5, pz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 1.5, 0.5), pBody);
    staticBodies.push(pBody);
  }

  // =========================================================================
  // 4. Helper: Modular Luxury Estate Wall Panel with Sidewalk Planter Bed
  // =========================================================================
  function addPerimeterWallSection(startX, endX, z = 24.5) {
    const width = Math.abs(endX - startX);
    const midX = (startX + endX) * 0.5;

    // Foundation plinth
    batch.addBox([midX, 0.24, z], [width, 0.48, 0.65], materials.foundation);
    // Main cream wall body
    batch.addBox([midX, 1.42, z], [width, 1.88, 0.44], materials.perimeterPillar);
    // Architectural recessed molding panel on front (facing road) and rear
    batch.addBox([midX, 1.42, z + 0.23], [width - 0.25, 1.5, 0.02], materials.perimeterPanel);
    batch.addBox([midX, 1.42, z - 0.23], [width - 0.25, 1.5, 0.02], materials.perimeterPanel);
    // Beveled molded top coping rail
    batch.addBox([midX, 2.42, z], [width + 0.06, 0.12, 0.62], materials.perimeterCap);

    // --- Lush Planter Bed along Sidewalk (Front of Wall) ---
    const planterZ = z + 0.95;
    // Raised stone planter border
    batch.addBox([midX, 0.25, planterZ], [width, 0.42, 0.72], materials.stoneWarm);
    // Nutrient soil fill
    batch.addBox([midX, 0.46, planterZ], [width - 0.1, 0.06, 0.58], materials.soil);

    // Continuous manicured green hedges and vibrant cartoon flower clusters
    const step = 0.95;
    for (let fx = startX + 0.5; fx <= endX - 0.4; fx += step) {
      // Rounded green hedge shrub
      batch.addSphere([fx, 0.62, planterZ], [0.36, 0.26, 0.32], materials.hedgeGreen);
      // Flower blossoms
      const flowerMat = (Math.abs(fx * 3.7) % 3 < 1)
        ? materials.flowerYellow
        : (Math.abs(fx * 3.7) % 3 < 2 ? materials.flowerCoral : materials.flowerWhite);
      batch.addSphere([fx, 0.76, planterZ], [0.14, 0.14, 0.14], flowerMat);
      batch.addSphere([fx + 0.18, 0.72, planterZ + 0.08], [0.1, 0.1, 0.1], materials.flowerYellow);
    }

    // Mini ground uplight fixture on wall panel
    if (width >= 3.0) {
      batch.addCylinder([midX, 0.55, planterZ + 0.15], 0.04, 0.05, 0.12, materials.carriageLanternMetal);
      batch.addSphere([midX, 0.62, planterZ + 0.15], [0.05, 0.05, 0.05], materials.glow, { shadow: false });
    }

    // Physics collider
    const wBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(midX, 1.2, z));
    world.createCollider(RAPIER.ColliderDesc.cuboid(width * 0.5, 1.2, 0.35), wBody);
    staticBodies.push(wBody);
  }

  // =========================================================================
  // 5. Central Grand Monument Wall ("VICKY'S WORLD") (x: [1.6, 8.4], z = 24.5)
  // =========================================================================
  const monMidX = 5.0;
  const monZ = 24.5;
  // Flanking monumental stone columns with carriage lanterns
  addPerimeterPillar(1.6, monZ, true);
  addPerimeterPillar(8.4, monZ, true);

  // Deep stone tiered base foundation
  batch.addBox([monMidX, 0.3, monZ], [6.2, 0.6, 1.15], materials.foundation);
  // Main architectural monument pylon
  batch.addBox([monMidX, 1.75, monZ], [5.9, 2.3, 0.85], materials.perimeterPillar);
  // Recessed bronze display frame backing
  batch.addBox([monMidX, 1.75, monZ + 0.38], [5.4, 1.9, 0.14], materials.metalDark);
  // Tiered pediment & classical cornice cap
  batch.addBox([monMidX, 2.96, monZ], [6.3, 0.14, 1.15], materials.perimeterCap);
  batch.addBox([monMidX, 3.1, monZ], [5.8, 0.14, 1.05], materials.perimeterCap);

  // High-resolution illuminated South-facing display plaque
  batch.addBox([monMidX, 1.75, monZ + 0.46], [5.2, 1.75, 0.05], materials.monumentSignMain);

  // Raised stone planter bed in front of monument ("VICKY'S WORLD")
  const monPlanterZ = monZ + 1.1;
  batch.addBox([monMidX, 0.24, monPlanterZ], [6.0, 0.46, 0.76], materials.stoneWarm);
  batch.addBox([monMidX, 0.48, monPlanterZ], [6.14, 0.06, 0.84], materials.perimeterCap);
  batch.addBox([monMidX, 0.49, monPlanterZ], [5.8, 0.04, 0.62], materials.soil);

  // Manicured low boxwood hedge along back of planter
  batch.addBox([monMidX, 0.56, monPlanterZ - 0.10], [5.4, 0.14, 0.28], materials.foliageDeep);
  for (let fx = -2.4; fx <= 2.4; fx += 0.8) {
    batch.addSphere([monMidX + fx, 0.60, monPlanterZ - 0.08], [0.34, 0.11, 0.22], (Math.abs(fx) % 1.6 < 0.8) ? materials.foliageMid : materials.foliageDeep, { smooth: true });
  }

  // Botanical flower blossoms & river pebbles in front
  const monFlowerColors = [materials.flowerCoral, materials.flowerYellow, materials.flowerWhite];
  for (let fx = -2.2; fx <= 2.2; fx += 0.55) {
    const fMat = monFlowerColors[Math.abs(Math.round(fx * 3)) % monFlowerColors.length];
    batch.addSphere([monMidX + fx, 0.52, monPlanterZ + 0.12], [0.07, 0.04, 0.07], fMat, { smooth: true });
    batch.addSphere([monMidX + fx + 0.14, 0.50, monPlanterZ + 0.15], [0.04, 0.025, 0.04], materials.stoneCream, { smooth: true });
  }

  // Twin brass ground floodlights washing up at VICKY'S WORLD sign
  for (const lx of [-1.8, 1.8]) {
    batch.addBox([monMidX + lx, 0.51, monPlanterZ + 0.22], [0.18, 0.08, 0.16], materials.brass);
    batch.addCylinder([monMidX + lx, 0.56, monPlanterZ + 0.22], 0.05, 0.05, 0.04, materials.brass, { segments: 12, smooth: true, rotation: [-0.4, 0, 0] });
    batch.addSphere([monMidX + lx, 0.57, monPlanterZ + 0.20], [0.05, 0.03, 0.05], materials.glow, { shadow: false });
  }

  // Monument physics collider
  const monBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(monMidX, 1.5, monZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(3.1, 1.5, 0.65), monBody);
  staticBodies.push(monBody);

  // Wall segment between monument & welcome wall (x: [8.85, 17.05])
  addPerimeterWallSection(8.85, 17.05, monZ);
  addPerimeterPillar(13.0, monZ, true);

  // =========================================================================
  // 6. Right Welcome Wall ("Welcome to VICKY MOSAFAN") (x: [17.5, 27.5], z = 24.5)
  // =========================================================================
  const welMidX = 22.5;
  addPerimeterPillar(17.5, monZ, true);
  addPerimeterPillar(27.5, monZ, true);

  batch.addBox([welMidX, 0.28, monZ], [9.2, 0.55, 1.05], materials.foundation);
  batch.addBox([welMidX, 1.65, monZ], [8.8, 2.2, 0.78], materials.perimeterPillar);
  batch.addBox([welMidX, 1.65, monZ + 0.35], [8.0, 1.8, 0.12], materials.metalDark);
  batch.addBox([welMidX, 2.82, monZ], [9.2, 0.14, 0.95], materials.perimeterCap);

  // High-resolution welcome plaque with V icon
  batch.addBox([welMidX, 1.65, monZ + 0.42], [7.8, 1.65, 0.05], materials.monumentSignWelcome);

  // Raised stone planter bed in front of welcome wall ("Welcome to VICKY MOSAFAN")
  const welPlanterZ = monZ + 1.0;
  batch.addBox([welMidX, 0.22, welPlanterZ], [8.8, 0.44, 0.68], materials.stoneWarm);
  batch.addBox([welMidX, 0.45, welPlanterZ], [8.96, 0.06, 0.76], materials.perimeterCap);
  batch.addBox([welMidX, 0.46, welPlanterZ], [8.6, 0.04, 0.54], materials.soil);

  // Manicured low boxwood hedge along back of planter (stays comfortably below sign frame y = 0.825)
  batch.addBox([welMidX, 0.53, welPlanterZ - 0.08], [8.2, 0.12, 0.28], materials.foliageDeep);
  for (let fx = -3.6; fx <= 3.6; fx += 0.8) {
    batch.addSphere([welMidX + fx, 0.57, welPlanterZ - 0.06], [0.36, 0.11, 0.22], (Math.abs(fx) % 1.6 < 0.8) ? materials.foliageMid : materials.foliageDeep, { smooth: true });
  }

  // Botanical flower blossoms & river pebbles in front
  const welFlowerColors = [materials.flowerCoral, materials.flowerYellow, materials.flowerWhite];
  for (let fx = -3.5; fx <= 3.5; fx += 0.5) {
    const fMat = welFlowerColors[Math.abs(Math.round(fx * 3)) % welFlowerColors.length];
    batch.addSphere([welMidX + fx, 0.49, welPlanterZ + 0.12], [0.07, 0.04, 0.07], fMat, { smooth: true });
    batch.addSphere([welMidX + fx + 0.12, 0.48, welPlanterZ + 0.15], [0.04, 0.025, 0.04], materials.stoneCream, { smooth: true });
  }

  // Triple brass ground floodlights illuminating welcome sign
  for (const lx of [-2.6, 0.0, 2.6]) {
    batch.addBox([welMidX + lx, 0.48, welPlanterZ + 0.18], [0.18, 0.08, 0.16], materials.brass);
    batch.addCylinder([welMidX + lx, 0.53, welPlanterZ + 0.18], 0.05, 0.05, 0.04, materials.brass, { segments: 12, smooth: true, rotation: [-0.4, 0, 0] });
    batch.addSphere([welMidX + lx, 0.54, welPlanterZ + 0.16], [0.05, 0.03, 0.05], materials.glow, { shadow: false });
  }

  const welBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(welMidX, 1.4, monZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(4.4, 1.4, 0.55), welBody);
  staticBodies.push(welBody);

  // =========================================================================
  // 7. East Perimeter Wall Segments (x: [28.0, 48.0], z = 24.5)
  // =========================================================================
  const eastPillarXs = [32.5, 37.5, 42.5, 48.0];
  let curEastX = 27.95;
  for (const px of eastPillarXs) {
    addPerimeterWallSection(curEastX, px - 0.45, monZ);
    addPerimeterPillar(px, monZ, true);
    curEastX = px + 0.45;
  }

  // =========================================================================
  // 8. Main Entrance Gate & Pillars (x: [-7.6, 0.6], z = 24.5)
  // =========================================================================
  const gateLeftPierX = -7.6;
  const gateRightPierX = 0.6;
  // Grand monumental entrance gate piers flanking driveway
  for (const gpx of [gateLeftPierX, gateRightPierX]) {
    // Grand tiered pedestal base
    batch.addBox([gpx, 0.32, monZ], [1.32, 0.64, 1.32], materials.foundation);
    batch.addBox([gpx, 2.05, monZ], [1.12, 2.82, 1.12], materials.perimeterPillar);
    // Recessed panel details
    batch.addBox([gpx, 2.05, monZ + 0.56], [0.85, 2.4, 0.04], materials.perimeterPanel);
    batch.addBox([gpx, 2.05, monZ - 0.56], [0.85, 2.4, 0.04], materials.perimeterPanel);
    // Classical capital with dental molding
    batch.addBox([gpx, 3.52, monZ], [1.25, 0.12, 1.25], materials.perimeterCap);
    batch.addBox([gpx, 3.65, monZ], [1.42, 0.14, 1.42], materials.perimeterCap);
    // Polished gold brass spherical finial
    batch.addSphere([gpx, 3.92, monZ], [0.24, 0.24, 0.24], materials.estateGateGold);
    // Grand Carriage Lantern
    batch.addBox([gpx, 4.3, monZ], [0.46, 0.6, 0.46], materials.carriageLanternGlass);
    batch.addSphere([gpx, 4.3, monZ], [0.16, 0.2, 0.16], materials.glow, { shadow: false });
    batch.addCylinder([gpx, 4.7, monZ], 0.03, 0.52, 0.22, materials.carriageLanternMetal, {
      segments: 4,
      rotation: [0, Math.PI * 0.25, 0],
    });

    const pierBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(gpx, 2.0, monZ));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.66, 2.0, 0.66), pierBody);
    staticBodies.push(pierBody);
  }

  // --- Grand Luxury Charcoal & Gold Estate Gate Leaves ---
  // Beautiful folding / swung open leaves flanking entrance (clear opening 6.6m!)
  // Left Gate Leaf (swung open inward against wall at x = -7.0, z = 23.2)
  batch.addBox([-7.0, 1.6, 23.2], [0.12, 2.7, 2.5], materials.estateGateDark);
  // Gold horizontal trims
  batch.addBox([-7.0, 0.55, 23.2], [0.14, 0.08, 2.45], materials.estateGateGold);
  batch.addBox([-7.0, 1.6, 23.2], [0.14, 0.08, 2.45], materials.estateGateGold);
  batch.addBox([-7.0, 2.7, 23.2], [0.14, 0.1, 2.45], materials.estateGateGold);
  // Vertical security pickets with brass finials
  for (let gz = 22.1; gz <= 24.3; gz += 0.28) {
    batch.addCylinder([-7.0, 1.6, gz], 0.024, 0.024, 2.65, materials.estateGateDark);
    batch.addSphere([-7.0, 2.96, gz], [0.045, 0.07, 0.045], materials.estateGateGold);
  }

  // Right Gate Leaf (swung open inward against wall at x = 0.0, z = 23.2)
  batch.addBox([0.0, 1.6, 23.2], [0.12, 2.7, 2.5], materials.estateGateDark);
  batch.addBox([0.0, 0.55, 23.2], [0.14, 0.08, 2.45], materials.estateGateGold);
  batch.addBox([0.0, 1.6, 23.2], [0.14, 0.08, 2.45], materials.estateGateGold);
  batch.addBox([0.0, 2.7, 23.2], [0.14, 0.1, 2.45], materials.estateGateGold);
  for (let gz = 22.1; gz <= 24.3; gz += 0.28) {
    batch.addCylinder([0.0, 1.6, gz], 0.024, 0.024, 2.65, materials.estateGateDark);
    batch.addSphere([0.0, 2.96, gz], [0.045, 0.07, 0.045], materials.estateGateGold);
  }

  // Driveway paved stone apron crossing from street through gate (x: [-6.8, -0.2], z: [24.0, 29.5])
  batch.addBox([-3.5, 0.11, 26.75], [6.6, 0.22, 5.5], materials.drivewayStone);

  // =========================================================================
  // 9. Automated Security Boom Barrier (Palang Pintu Otomatis)
  // =========================================================================
  // Control pedestal near the security booth (x = -6.4, z = 24.8)
  const barPedX = -6.4;
  const barPedZ = 24.8;
  batch.addBox([barPedX, 0.6, barPedZ], [0.44, 1.2, 0.44], materials.estateGateDark);
  batch.addBox([barPedX, 1.15, barPedZ], [0.48, 0.12, 0.48], materials.metalDark);
  // Status LED beacon (Green active access)
  batch.addSphere([barPedX, 1.25, barPedZ], [0.08, 0.08, 0.08], materials.glow, { shadow: false });

  // Rotating barrier arm raised at 45 degrees welcoming entry
  const barGroup = new THREE.Group();
  barGroup.position.set(barPedX + 0.18, 0.95, barPedZ);
  barGroup.rotation.z = Math.PI * 0.28; // Raised 50 degrees
  securityGroup.add(barGroup);

  const barBatch = new BatchCollector();
  // Striped barrier arm (alternating bright orange and white safety segments)
  for (let i = 0; i < 9; i++) {
    const segX = i * 0.45 + 0.22;
    barBatch.addBox([segX, 0, 0], [0.44, 0.14, 0.06], (i % 2 === 0) ? materials.barrierOrange : materials.barrierWhite);
  }
  // Rubber impact tip
  barBatch.addBox([4.2, 0, 0], [0.12, 0.15, 0.07], materials.carRubber);
  barBatch.build(barGroup, true);

  // Modern stainless security bollards flanking the entrance lane
  const bollardXs = [-6.7, -0.4];
  for (const bx of bollardXs) {
    batch.addCylinder([bx, 0.45, 25.8], 0.12, 0.12, 0.9, materials.chrome);
    batch.addSphere([bx, 0.9, 25.8], [0.12, 0.06, 0.12], materials.chrome);
    // Amber reflector ring
    batch.addCylinder([bx, 0.72, 25.8], 0.125, 0.125, 0.08, materials.flowerYellow, { shadow: false });
  }

  // =========================================================================
  // 10. Security Guardhouse / Booth ("Pos Satpam") (x: [-14.5, -9.0], z: [23.5, 27.5])
  // =========================================================================
  const ghX = -11.75;
  const ghZ = 25.5;
  const ghW = 5.2;
  const ghD = 4.0;
  // Raised stone foundation plinth
  batch.addBox([ghX, 0.24, ghZ], [ghW + 0.5, 0.48, ghD + 0.5], materials.foundation);
  // High-end stucco walls matching villa
  batch.addBox([ghX, 1.8, ghZ], [ghW, 2.65, ghD], materials.securityBoothWall);
  // Architectural trim band
  batch.addBox([ghX, 0.55, ghZ], [ghW + 0.08, 0.12, ghD + 0.08], materials.trim);
  batch.addBox([ghX, 2.95, ghZ], [ghW + 0.1, 0.12, ghD + 0.1], materials.trim);

  // Overhanging modern flat roof with dark fascia matching reference map
  batch.addBox([ghX, 3.2, ghZ], [ghW + 1.2, 0.26, ghD + 1.2], materials.securityBoothRoof);
  batch.addBox([ghX, 3.38, ghZ], [ghW + 1.0, 0.14, ghD + 1.0], materials.trim);

  // --- Panoramic Observation Windows ---
  // South window (facing road and pedestrian sidewalk)
  batch.addBox([ghX, 1.85, ghZ + ghD * 0.5 + 0.02], [3.2, 1.4, 0.12], materials.windowFrameDark);
  batch.addBox([ghX, 1.85, ghZ + ghD * 0.5 + 0.03], [3.0, 1.24, 0.06], materials.glass);

  // East window (facing driveway entrance, barrier & visitors)
  batch.addBox([ghX + ghW * 0.5 + 0.02, 1.85, ghZ], [0.12, 1.4, 2.6], materials.windowFrameDark);
  batch.addBox([ghX + ghW * 0.5 + 0.03, 1.85, ghZ], [0.06, 1.24, 2.4], materials.glass);

  // North window (facing inner villa garden and driveway loop)
  batch.addBox([ghX, 1.85, ghZ - ghD * 0.5 - 0.02], [2.8, 1.4, 0.12], materials.windowFrameDark);
  batch.addBox([ghX, 1.85, ghZ - ghD * 0.5 - 0.03], [2.6, 1.24, 0.06], materials.glass);

  // West entrance door for security personnel
  batch.addBox([ghX - ghW * 0.5 - 0.02, 1.45, ghZ], [0.1, 2.2, 1.1], materials.woodDark);
  batch.addCylinder([ghX - ghW * 0.5 - 0.06, 1.4, ghZ + 0.38], 0.02, 0.02, 0.16, materials.chrome);

  // Exterior Security 24/7 Signage Plaques
  // East side facing driveway: "ESTATE SECURITY - 24/7 GUARD"
  batch.addBox([ghX + ghW * 0.5 + 0.04, 2.62, ghZ], [0.04, 0.44, 1.8], materials.metalDark);
  batch.addBox([ghX + ghW * 0.5 + 0.06, 2.62, ghZ], [0.03, 0.4, 1.7], materials.monumentSignSecurity);

  // South side facing road: Security Badge
  batch.addBox([ghX, 2.62, ghZ + ghD * 0.5 + 0.04], [1.8, 0.44, 0.04], materials.metalDark);
  batch.addBox([ghX, 2.62, ghZ + ghD * 0.5 + 0.06], [1.7, 0.4, 0.03], materials.monumentSignSecurity);

  // --- Interior Security Console & Surveillance Center ---
  // Security console desk in walnut & dark slate
  batch.addBox([ghX + 1.2, 0.9, ghZ + 0.8], [1.8, 0.78, 1.4], materials.woodWarm);
  batch.addBox([ghX + 1.2, 0.94, ghZ + 0.8], [1.84, 0.04, 1.44], materials.metalDark);
  // 3 Multi-screen CCTV surveillance monitors
  batch.addBox([ghX + 1.1, 1.5, ghZ + 1.3], [0.75, 0.46, 0.06], materials.screenCode);
  batch.addBox([ghX + 1.85, 1.5, ghZ + 0.75], [0.06, 0.46, 0.7], materials.screenTerminal);
  batch.addBox([ghX + 0.4, 1.5, ghZ + 1.3], [0.55, 0.42, 0.06], materials.screenCode);
  // High-back ergonomic security officer chair
  batch.addBox([ghX + 0.9, 0.65, ghZ], [0.55, 0.1, 0.55], materials.leatherDark);
  batch.addBox([ghX + 0.9, 1.1, ghZ - 0.25], [0.5, 0.85, 0.1], materials.leatherDark);

  // Guardhouse physics collider
  const ghBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(ghX, 1.6, ghZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid((ghW + 0.4) * 0.5, 1.6, (ghD + 0.4) * 0.5), ghBody);
  staticBodies.push(ghBody);

  // =========================================================================
  // 11. West Perimeter Wall Segments (x: [-48.0, -14.5], z = 24.5)
  // =========================================================================
  const westPillarXs = [-19.5, -24.5, -29.5, -34.5, -39.5, -44.5, -48.0];
  let curWestX = -14.65;
  for (const px of westPillarXs) {
    addPerimeterWallSection(px + 0.45, curWestX, monZ);
    addPerimeterPillar(px, monZ, true);
    curWestX = px - 0.45;
  }

  // =========================================================================
  // 12. Security Guard NPCs (Uniformed Satpam with Peaked Cap & White Gloves)
  // =========================================================================
  function createGuardRig(gx, gz, rotY, role = 'gate') {
    const rig = new THREE.Group();
    rig.position.set(gx, 0, gz);
    rig.rotation.y = rotY;
    securityGroup.add(rig);

    const gb = new BatchCollector();

    // Polished black tactical service boots
    gb.addBox([-0.18, 0.12, 0.02], [0.22, 0.24, 0.38], materials.carRubber);
    gb.addBox([0.18, 0.12, 0.02], [0.22, 0.24, 0.38], materials.carRubber);

    // Dark navy uniform trousers with sharp crease
    gb.addCylinder([-0.18, 0.58, 0], 0.12, 0.14, 0.72, materials.guardUniform);
    gb.addCylinder([0.18, 0.58, 0], 0.12, 0.14, 0.72, materials.guardUniform);

    // Signature Indonesian VIP Satpam White Duty Belt with polished gold buckle
    gb.addBox([0, 0.98, 0], [0.66, 0.11, 0.45], materials.guardWhite);
    gb.addBox([0, 0.98, 0.23], [0.14, 0.09, 0.03], materials.guardBadge); // Gold buckle
    gb.addBox([0.28, 0.95, 0.08], [0.12, 0.18, 0.12], materials.leatherDark); // Holster
    gb.addBox([-0.28, 0.98, 0.05], [0.09, 0.18, 0.09], materials.metalDark); // Walkie-talkie
    // Walkie-talkie tall flexible antenna
    gb.addCylinder([-0.28, 1.2, 0.05], 0.01, 0.015, 0.3, materials.metalDark);

    // Navy blue security tunic/shirt
    gb.addBox([0, 1.45, 0], [0.72, 0.86, 0.46], materials.guardUniform);
    // White inner collar peaking through
    gb.addBox([0, 1.88, 0.05], [0.34, 0.08, 0.28], materials.guardWhite);
    // Gold center shirt buttons
    for (let by = 1.15; by <= 1.75; by += 0.2) {
      gb.addSphere([0, by, 0.24], [0.025, 0.025, 0.025], materials.guardBadge);
    }
    // Gold chest shield badge on left breast
    gb.addBox([0.19, 1.58, 0.24], [0.11, 0.11, 0.02], materials.guardBadge);
    // White name tag on right breast ("SECURITY")
    gb.addBox([-0.19, 1.58, 0.24], [0.12, 0.04, 0.02], materials.guardWhite);

    // Gold shoulder epaulets (Tanda Pangkat Satpam) with rank stripes
    gb.addBox([-0.38, 1.83, 0], [0.18, 0.04, 0.24], materials.guardBadge);
    gb.addBox([0.38, 1.83, 0], [0.18, 0.04, 0.24], materials.guardBadge);
    // White security lanyard cord draping from left shoulder
    gb.addCylinder([0.22, 1.45, 0.22], 0.015, 0.015, 0.45, materials.guardWhite, { rotation: [0, 0, 0.35] });

    // Arms in attentive security posture with White Service Gloves
    if (role === 'gate') {
      // Guard 1: Hands clasped formally in front at duty belt (Standard VIP Satpam Siap Sedia)
      gb.addCylinder([-0.42, 1.4, 0.05], 0.1, 0.1, 0.65, materials.guardUniform, { rotation: [0.25, 0, 0.22] });
      gb.addCylinder([0.42, 1.4, 0.05], 0.1, 0.1, 0.65, materials.guardUniform, { rotation: [0.25, 0, -0.22] });
      // Forearms angled inward
      gb.addCylinder([-0.28, 1.05, 0.18], 0.09, 0.09, 0.45, materials.guardUniform, { rotation: [0.65, 0.5, 0] });
      gb.addCylinder([0.28, 1.05, 0.18], 0.09, 0.09, 0.45, materials.guardUniform, { rotation: [0.65, -0.5, 0] });
      // White service gloves clasped together
      gb.addSphere([-0.08, 0.98, 0.25], [0.1, 0.09, 0.09], materials.guardWhite);
      gb.addSphere([0.08, 0.98, 0.25], [0.1, 0.09, 0.09], materials.guardWhite);
    } else {
      // Guard 2: Holding visitor register clipboard
      gb.addCylinder([-0.42, 1.4, 0.05], 0.1, 0.1, 0.65, materials.guardUniform, { rotation: [0.35, 0, 0.2] });
      gb.addCylinder([0.42, 1.4, 0.05], 0.1, 0.1, 0.65, materials.guardUniform, { rotation: [0.45, 0, -0.2] });
      // Left arm holding clipboard
      gb.addBox([-0.18, 1.25, 0.32], [0.28, 0.38, 0.04], materials.woodDark, { rotation: [0.4, 0.1, 0] });
      gb.addBox([-0.18, 1.25, 0.34], [0.24, 0.32, 0.01], materials.guardWhite, { rotation: [0.4, 0.1, 0] });
      gb.addSphere([-0.3, 1.15, 0.28], [0.09, 0.09, 0.09], materials.guardWhite);
      // Right hand holding silver pen
      gb.addSphere([0.2, 1.2, 0.3], [0.09, 0.09, 0.09], materials.guardWhite);
      gb.addCylinder([0.15, 1.25, 0.34], 0.01, 0.01, 0.16, materials.chrome, { rotation: [0.5, 0.3, 0] });
    }

    // Stylized cartoon head
    gb.addSphere([0, 2.06, 0], [0.25, 0.27, 0.25], materials.skin);
    // Dark styled hair visible under cap
    gb.addSphere([0, 2.08, -0.06], [0.27, 0.26, 0.25], materials.hairDark);

    // Aviator sunglasses
    gb.addBox([0, 2.12, 0.24], [0.36, 0.11, 0.06], materials.glass);
    gb.addBox([0, 2.12, 0.24], [0.38, 0.12, 0.02], materials.carriageLanternMetal);

    // --- Official Peaked Security Cap (Topi Dinas Satpam) ---
    // Cap base crown in dark navy
    gb.addCylinder([0, 2.28, 0.02], 0.3, 0.28, 0.18, materials.guardCap);
    // Flared upper top crown
    gb.addCylinder([0, 2.38, 0.04], 0.34, 0.31, 0.08, materials.guardCap);
    // Glossy black visor / brim sloping downward
    gb.addBox([0, 2.22, 0.28], [0.38, 0.04, 0.24], materials.leatherDark, { rotation: [0.22, 0, 0] });
    // Gold braided chin cord above the visor
    gb.addCylinder([0, 2.26, 0.27], 0.016, 0.016, 0.32, materials.guardBadge, { rotation: [0, 0, Math.PI * 0.5] });
    // Gold embossed security crest / emblem on front of cap
    gb.addBox([0, 2.34, 0.29], [0.09, 0.1, 0.03], materials.guardBadge);

    const gGeo = gb.toMergedGeometry();
    if (gGeo) {
      const gMesh = new THREE.Mesh(gGeo, vertexColorFamilies.matte);
      gMesh.castShadow = true;
      gMesh.receiveShadow = true;
      gMesh.matrixAutoUpdate = false;
      gMesh.updateMatrix();
      rig.add(gMesh);
    }

    // Physics collider
    const gBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(gx, 1.1, gz));
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.1, 0.38), gBody);
    staticBodies.push(gBody);

    return {
      group: rig,
      baseX: gx,
      baseZ: gz,
      role,
      clock: Math.random() * 10,
    };
  }

  // Guard 1 (Sisi Kiri / West Flank): Stationed at main gate checkpoint & boom barrier
  animatedGuards.push(createGuardRig(-5.8, 25.5, Math.PI * 0.06, 'gate'));
  // Guard 2 (Sisi Kanan / East Flank): Stationed at right gate pier & visitor check post
  animatedGuards.push(createGuardRig(0.85, 25.6, -Math.PI * 0.15, 'window'));

  // =========================================================================
  // 13. Southern World Boundary Wall along highway edge (z = 42.0)
  // =========================================================================
  const southBoundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 1.5, 42.2));
  world.createCollider(RAPIER.ColliderDesc.cuboid(52.0, 1.5, 0.4), southBoundBody);
  staticBodies.push(southBoundBody);

  batch.build(securityGroup, true);

  return {
    group: securityGroup,
    update: (delta) => {
      for (const g of animatedGuards) {
        g.clock += delta;
        // Subtle natural breathing & posture shift
        g.group.position.y = Math.sin(g.clock * 2.2) * 0.007;
        // Watchful scanning back and forth
        g.group.rotation.y += Math.sin(g.clock * 0.9) * 0.0025;
      }
    },
  };
}
