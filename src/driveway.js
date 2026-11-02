import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector } from './geometry.js';
import { createOutdoorParkingLot } from './vehicles.js';
import { createWaterRipplesTexture } from './textures.js';

/**
 * Creates Zone B & C: Paved Driveway, Parking Court & Fountain Roundabout
 * Located in front of the Mansion: x: [-8.0, 28.0], z: [4.5, 24.0]
 */
export function createDriveway(scene, world, RAPIER, staticBodies) {
  const driveGroup = new THREE.Group();
  scene.add(driveGroup);
  const batch = new BatchCollector();

  // 1. Central Fountain Roundabout (x = 0.0, z = 13.0)
  const fountainX = 0.0;
  const fountainZ = 13.0;

  // Circular cobblestone turnaround road (radius 7.2m)
  batch.addCylinder([fountainX, 0.015, fountainZ], 7.2, 7.2, 0.04, materials.cobbleCircle, { segments: 32 });

  // Outer stone curb separating cobblestones from lawn
  for (let i = 0; i < 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2;
    const cx = fountainX + Math.cos(angle) * 7.25;
    const cz = fountainZ + Math.sin(angle) * 7.25;
    batch.addBox([cx, 0.08, cz], [0.35, 0.16, 0.95], materials.trim, {
      rotation: [0, -angle, 0],
    });
  }

  // Multi-Tiered Classical Stone Fountain Basin (Octagonal, radius 3.0m, height 0.68m)
  const basinRadius = 3.0;
  const basinSides = 8;
  const segLen = 2 * basinRadius * Math.sin(Math.PI / basinSides); // ~2.296m

  // Stepped octagonal sub-base plinth on cobblestones
  batch.addCylinder([fountainX, 0.06, fountainZ], basinRadius + 0.35, basinRadius + 0.42, 0.10, materials.stoneDark, { segments: 16 });
  batch.addCylinder([fountainX, 0.13, fountainZ], basinRadius + 0.15, basinRadius + 0.25, 0.08, materials.stoneWarm, { segments: 16 });

  for (let i = 0; i < basinSides; i += 1) {
    const angle = (i / basinSides) * Math.PI * 2;
    const nextAngle = ((i + 1) / basinSides) * Math.PI * 2;
    const midAngle = (angle + nextAngle) * 0.5;
    const mx = fountainX + Math.cos(midAngle) * basinRadius;
    const mz = fountainZ + Math.sin(midAngle) * basinRadius;
    const wallRot = [0, -midAngle - Math.PI * 0.5, 0];

    // Main wall segment with sculpted layered mouldings
    // 1. Lower stone base moulding
    batch.addBox([mx, 0.20, mz], [segLen - 0.15, 0.16, 0.44], materials.stoneDark, { rotation: wallRot });
    // 2. Main wall body
    batch.addBox([mx, 0.46, mz], [segLen - 0.22, 0.44, 0.36], materials.stoneWarm, { rotation: wallRot });
    // 3. Recessed ashlar accent panel on exterior face for architectural depth
    const outNormalX = Math.cos(midAngle);
    const outNormalZ = Math.sin(midAngle);
    batch.addBox(
      [mx + outNormalX * 0.02, 0.46, mz + outNormalZ * 0.02],
      [segLen - 0.55, 0.34, 0.38],
      materials.stone,
      { rotation: wallRot }
    );
    // 4. Coping support bed moulding
    batch.addBox([mx, 0.70, mz], [segLen - 0.05, 0.06, 0.46], materials.trim, { rotation: wallRot });
    // 5. Grand rolled bullnose coping cap
    batch.addBox([mx, 0.76, mz], [segLen + 0.12, 0.08, 0.54], materials.trim, { rotation: wallRot });
  }

  // 8 Classical Corner Piers / Plinths at Octagon Vertices
  for (let i = 0; i < basinSides; i += 1) {
    const vAngle = (i / basinSides) * Math.PI * 2;
    const vx = fountainX + Math.cos(vAngle) * (basinRadius + 0.02);
    const vz = fountainZ + Math.sin(vAngle) * (basinRadius + 0.02);
    const pierRot = [0, -vAngle, 0];

    // Stepped pier base
    batch.addBox([vx, 0.14, vz], [0.58, 0.24, 0.58], materials.stoneDark, { rotation: pierRot });
    // Pier shaft with decorative bevels
    batch.addBox([vx, 0.48, vz], [0.50, 0.52, 0.50], materials.stoneWarm, { rotation: pierRot });
    // Pier capital cornice
    batch.addBox([vx, 0.76, vz], [0.58, 0.08, 0.58], materials.trim, { rotation: pierRot });
    batch.addBox([vx, 0.82, vz], [0.52, 0.06, 0.52], materials.trim, { rotation: pierRot });

    // Alternating corner ornaments: 4 Corner Jet Nozzles (inward-aimed) + 4 Sculpted Stone Spheres
    batch.addCylinder([vx, 0.88, vz], 0.10, 0.14, 0.08, materials.brass, { segments: 12 });
    if (i % 2 === 0) {
      // Polished brass perimeter jet nozzle (aimed inward and upward)
      const aimAngle = vAngle + Math.PI;
      batch.addCylinder(
        [vx, 0.94, vz],
        0.04, 0.07, 0.14,
        materials.brass,
        { segments: 8, rotation: [0.65, aimAngle, 0] }
      );
      batch.addSphere([vx, 0.92, vz], [0.06, 0.06, 0.06], materials.brass, { shadow: false });
    } else {
      // Classical sculpted stone sphere & finial cap
      batch.addSphere([vx, 0.99, vz], [0.12, 0.15, 0.12], materials.stoneWarm);
      batch.addSphere([vx, 1.14, vz], [0.04, 0.06, 0.04], materials.brass, { shadow: false });
    }
  }

  // Basin interior floor: mosaic pattern & water bed
  batch.addCylinder([fountainX, 0.04, fountainZ], basinRadius - 0.25, basinRadius - 0.25, 0.04, materials.poolTile, { segments: 24 });

  // Main fountain water basin surface (rich turquoise with animated caustics)
  const waterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(basinRadius - 0.22, basinRadius - 0.22, 0.05, 24),
    materials.waterfallPond
  );
  waterDisc.position.set(fountainX, 0.55, fountainZ);
  waterDisc.receiveShadow = true;
  driveGroup.add(waterDisc);

  // Central Multi-Tier Classical Sculpted Stone Architecture (x = fountainX, z = fountainZ)
  // 1. Grand Basin Sub-Plinth (Lantai Kolam Bawah)
  batch.addCylinder([fountainX, 0.18, fountainZ], 1.48, 1.58, 0.28, materials.stoneDark, { segments: 24 });
  batch.addCylinder([fountainX, 0.36, fountainZ], 1.28, 1.40, 0.16, materials.stoneWarm, { segments: 24 });
  batch.addCylinder([fountainX, 0.48, fountainZ], 1.18, 1.28, 0.10, materials.trim, { segments: 24 });

  // 2. Fluted Column Shaft supporting Tier 1 Bowl
  batch.addCylinder([fountainX, 0.92, fountainZ], 0.76, 0.92, 0.82, materials.stoneWarm, { segments: 24 });
  // Classical fluting ribs around column
  const flutingCount = 16;
  for (let f = 0; f < flutingCount; f += 1) {
    const fAngle = (f / flutingCount) * Math.PI * 2;
    const fx = fountainX + Math.cos(fAngle) * 0.85;
    const fz = fountainZ + Math.sin(fAngle) * 0.85;
    batch.addCylinder([fx, 0.92, fz], 0.035, 0.042, 0.74, materials.trim, { segments: 6 });
  }
  // Shaft astragal & collar ring
  batch.addCylinder([fountainX, 1.26, fountainZ], 0.88, 0.78, 0.12, materials.trim, { segments: 24 });
  batch.addCylinder([fountainX, 1.30, fountainZ], 0.90, 0.90, 0.04, materials.brass, { segments: 24 });

  // 8 Console Corbel Brackets supporting Tier 1 Bowl
  const corbelCount = 8;
  for (let c = 0; c < corbelCount; c += 1) {
    const cAngle = (c / corbelCount) * Math.PI * 2;
    const cosC = Math.cos(cAngle);
    const sinC = Math.sin(cAngle);
    // Stepped scroll bracket
    batch.addBox(
      [fountainX + cosC * 1.08, 1.30, fountainZ + sinC * 1.08],
      [0.18, 0.26, 0.54],
      materials.stoneWarm,
      { rotation: [0, -cAngle, 0] }
    );
    batch.addBox(
      [fountainX + cosC * 1.28, 1.40, fountainZ + sinC * 1.28],
      [0.14, 0.16, 0.32],
      materials.trim,
      { rotation: [0, -cAngle, 0] }
    );
  }

  // 3. Grand Lower Bowl (Tier 1 - Diameter 3.5m, Expansive Classical Stone Bowl)
  // Underside curvature profile
  batch.addCylinder([fountainX, 1.38, fountainZ], 1.48, 0.90, 0.18, materials.stoneWarm, { segments: 24 });
  batch.addCylinder([fountainX, 1.48, fountainZ], 1.72, 1.48, 0.12, materials.stoneWarm, { segments: 24 });

  // Tier 1 Rolled Coping Rim (hollow ring coping with open interior pool)
  const tier1RimWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.76, 1.72, 0.12, 28, 1, true),
    materials.stoneWarm
  );
  tier1RimWall.position.set(fountainX, 1.54, fountainZ);
  driveGroup.add(tier1RimWall);

  const tier1RimRing = new THREE.Mesh(
    new THREE.RingGeometry(1.62, 1.76, 28),
    materials.trim
  );
  tier1RimRing.rotation.x = -Math.PI * 0.5;
  tier1RimRing.position.set(fountainX, 1.60, fountainZ);
  driveGroup.add(tier1RimRing);

  const tier1GoldBead = new THREE.Mesh(
    new THREE.RingGeometry(1.74, 1.78, 28),
    materials.brass
  );
  tier1GoldBead.rotation.x = -Math.PI * 0.5;
  tier1GoldBead.position.set(fountainX, 1.605, fountainZ);
  driveGroup.add(tier1GoldBead);

  // Tier 1 Interior Water Pool (gleaming crystal turquoise water inside hollow bowl)
  const tier1WaterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.64, 1.64, 0.04, 28),
    materials.waterfallPond
  );
  tier1WaterDisc.position.set(fountainX, 1.57, fountainZ);
  tier1WaterDisc.renderOrder = 2;
  driveGroup.add(tier1WaterDisc);

  // 4 Sculpted Rosette/Lion Brass Spouts on Tier 1
  for (let s = 0; s < 4; s += 1) {
    const sAngle = (s / 4) * Math.PI * 2;
    // Stone mounting boss
    batch.addBox(
      [fountainX + Math.cos(sAngle) * 1.68, 1.52, fountainZ + Math.sin(sAngle) * 1.68],
      [0.22, 0.16, 0.16],
      materials.stoneWarm,
      { rotation: [0, -sAngle, 0] }
    );
    // Brass spout nozzle
    batch.addCylinder(
      [fountainX + Math.cos(sAngle) * 1.78, 1.50, fountainZ + Math.sin(sAngle) * 1.78],
      0.035, 0.045, 0.16,
      materials.brass,
      { rotation: [Math.PI * 0.5, 0, sAngle] }
    );
  }

  // 4. Middle Pedestal (Baluster Vase Shaft supporting Tier 2)
  batch.addCylinder([fountainX, 1.74, fountainZ], 0.54, 0.68, 0.24, materials.stoneWarm, { segments: 20 });
  batch.addCylinder([fountainX, 1.90, fountainZ], 0.38, 0.44, 0.12, materials.brass, { segments: 20 });
  batch.addSphere([fountainX, 2.06, fountainZ], [0.52, 0.26, 0.52], materials.stoneWarm);
  batch.addCylinder([fountainX, 2.22, fountainZ], 0.40, 0.48, 0.22, materials.stoneWarm, { segments: 20 });
  batch.addCylinder([fountainX, 2.38, fountainZ], 0.62, 0.40, 0.12, materials.trim, { segments: 20 });

  // 6 Console brackets under Tier 2 Bowl
  for (let c = 0; c < 6; c += 1) {
    const cAngle = (c / 6) * Math.PI * 2;
    batch.addBox(
      [fountainX + Math.cos(cAngle) * 0.62, 2.36, fountainZ + Math.sin(cAngle) * 0.62],
      [0.12, 0.18, 0.36],
      materials.stoneWarm,
      { rotation: [0, -cAngle, 0] }
    );
  }

  // 5. Upper Bowl (Tier 2 - Diameter 2.3m, Hollow Classical Stone Bowl)
  batch.addCylinder([fountainX, 2.48, fountainZ], 0.92, 0.62, 0.16, materials.stoneWarm, { segments: 20 });

  const tier2RimWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.14, 1.10, 0.10, 24, 1, true),
    materials.stoneWarm
  );
  tier2RimWall.position.set(fountainX, 2.56, fountainZ);
  driveGroup.add(tier2RimWall);

  const tier2RimRing = new THREE.Mesh(
    new THREE.RingGeometry(1.02, 1.15, 24),
    materials.trim
  );
  tier2RimRing.rotation.x = -Math.PI * 0.5;
  tier2RimRing.position.set(fountainX, 2.61, fountainZ);
  driveGroup.add(tier2RimRing);

  const tier2GoldBead = new THREE.Mesh(
    new THREE.RingGeometry(1.13, 1.16, 24),
    materials.brass
  );
  tier2GoldBead.rotation.x = -Math.PI * 0.5;
  tier2GoldBead.position.set(fountainX, 2.615, fountainZ);
  driveGroup.add(tier2GoldBead);

  // Tier 2 Interior Water Pool (fills upper bowl to brim)
  const tier2WaterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.03, 1.03, 0.04, 24),
    materials.waterfallPond
  );
  tier2WaterDisc.position.set(fountainX, 2.58, fountainZ);
  tier2WaterDisc.renderOrder = 2;
  driveGroup.add(tier2WaterDisc);

  // 6 Brass water spouts mounted on Tier 2 Bowl rim
  for (let s = 0; s < 6; s += 1) {
    const sAngle = (s / 6) * Math.PI * 2;
    batch.addCylinder(
      [fountainX + Math.cos(sAngle) * 1.12, 2.54, fountainZ + Math.sin(sAngle) * 1.12],
      0.025, 0.035, 0.14,
      materials.brass,
      { rotation: [Math.PI * 0.5, 0, sAngle] }
    );
  }

  // 6. Crowning Finial Urn (Tier 3 Puncak Air Mancur)
  batch.addCylinder([fountainX, 2.76, fountainZ], 0.28, 0.38, 0.20, materials.stoneWarm, { segments: 16 });
  batch.addSphere([fountainX, 2.98, fountainZ], [0.32, 0.34, 0.32], materials.stoneWarm);
  batch.addCylinder([fountainX, 3.20, fountainZ], 0.22, 0.28, 0.18, materials.stoneWarm, { segments: 16 });
  batch.addCylinder([fountainX, 3.32, fountainZ], 0.28, 0.22, 0.10, materials.trim, { segments: 16 });
  // Gold chalice spout header
  batch.addCylinder([fountainX, 3.42, fountainZ], 0.26, 0.16, 0.14, materials.brass, { segments: 16 });
  // Central heavy brass nozzle
  batch.addCylinder([fountainX, 3.52, fountainZ], 0.08, 0.12, 0.10, materials.brass, { segments: 16 });
  // Ring of 8 satellite nozzles
  for (let n = 0; n < 8; n += 1) {
    const nAngle = (n / 8) * Math.PI * 2;
    const nx = fountainX + Math.cos(nAngle) * 0.18;
    const nz = fountainZ + Math.sin(nAngle) * 0.18;
    batch.addCylinder(
      [nx, 3.46, nz],
      0.02, 0.03, 0.08,
      materials.brass,
      { rotation: [0.35, nAngle, 0], segments: 8 }
    );
  }

  // 1.B Animated Living Fountain Water (Central Geyser Jet, Spouting Nozzle Arcs, Cascades, Ripples & Splash Droplets)
  const fountainWater = createAnimatedFountainWater(driveGroup, fountainX, fountainZ);
  driveGroup.userData.fountainWater = fountainWater;
  driveGroup.update = (dt, elapsed) => {
    fountainWater.update(dt, elapsed);
  };

  // Fountain Physics Collider (solid stone basin + full-height central pillar to prevent any clipping/tembus)
  const fountainBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(fountainX, 0, fountainZ)
  );
  // Solid outer basin collider (radius 3.15m, height 1.1m)
  world.createCollider(RAPIER.ColliderDesc.cylinder(0.55, basinRadius + 0.15).setTranslation(0, 0.55, 0), fountainBody);
  // Solid center pillar & upper bowls collider (radius 1.75m, height 4.0m)
  world.createCollider(RAPIER.ColliderDesc.cylinder(2.0, 1.75).setTranslation(0, 2.0, 0), fountainBody);
  staticBodies.push(fountainBody);

  // 2. Asphalt Driveway & Garage Parking Court (x: [8.0, 26.0], z: [4.5, 22.0])
  // Main driveway corridor to garage
  batch.addBox([18.5, 0.02, 13.5], [15.0, 0.04, 17.0], materials.asphaltRoad);

  // Stone curbs flanking the driveway
  batch.addBox([10.8, 0.08, 13.5], [0.35, 0.16, 17.0], materials.stoneWarm);
  batch.addBox([26.2, 0.08, 13.5], [0.35, 0.16, 17.0], materials.stoneWarm);

  // Luxury Outdoor Resident & Guest Parking Court: 2 Sports Cars + 2 Motorcycles
  createOutdoorParkingLot(scene, world, RAPIER, staticBodies);

  // 3. Landscaping Islands with Ornamental Cypress Trees & Lavender
  // Balanced setback from curbs (west curb x = 10.8, east curb x = 26.2, fountain roundabout radius 7.25m)
  // Perfectly centered on lawn verges with clean margins and zero clipping
  // 3. Landscaping Islands with Ornamental Cypress Trees & Lavender framing the East Lawn
  const islandSpecs = [
    { x: 28.4, z: 7.5, r: 1.4 },
    { x: 28.4, z: 18.5, r: 1.4 },
  ];

  for (const isl of islandSpecs) {
    // Raised soil mound
    batch.addCylinder([isl.x, 0.12, isl.z], isl.r, isl.r + 0.2, 0.22, materials.soil, { segments: 16 });
    // Curb stones
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      const bx = isl.x + Math.cos(angle) * (isl.r + 0.1);
      const bz = isl.z + Math.sin(angle) * (isl.r + 0.1);
      batch.addBox([bx, 0.16, bz], [0.22, 0.2, 0.45], materials.stoneWarm, { rotation: [0, -angle, 0] });
    }

    // Slender Italian Cypress Tree in center of each island
    batch.addCylinder([isl.x, 0.8, isl.z], 0.18, 0.28, 1.6, materials.bark);
    batch.addCylinder([isl.x, 2.2, isl.z], 0.72, 0.85, 2.4, materials.foliageDeep, { segments: 12 });
    batch.addCylinder([isl.x, 3.6, isl.z], 0.45, 0.72, 1.8, materials.foliageMid, { segments: 12 });
    batch.addCylinder([isl.x, 4.6, isl.z], 0.1, 0.45, 1.2, materials.foliageBright, { segments: 8 });

    // Cypress tree trunk collider
    const cyBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(isl.x, 1.5, isl.z)
    );
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.5, 0.35), cyBody);
    staticBodies.push(cyBody);

    // Lavender & golden flower clusters around base
    for (let f = 0; f < 6; f += 1) {
      const fAngle = (f / 6) * Math.PI * 2;
      const fx = isl.x + Math.cos(fAngle) * (isl.r * 0.65);
      const fz = isl.z + Math.sin(fAngle) * (isl.r * 0.65);
      batch.addSphere([fx, 0.35, fz], [0.32, 0.24, 0.32], f % 2 === 0 ? materials.blueSky : materials.yellowSun);
    }
  }

  // 4. Victorian Cast-Iron Street Lanterns along Driveway (cleanly positioned on lawn verge)
  const lampPositions = [
    [8.6, 13.0],
    [27.8, 13.0],
    [18.5, 21.5],
  ];

  for (const [lx, lz] of lampPositions) {
    // Stepped pedestal base
    batch.addBox([lx, 0.2, lz], [0.55, 0.38, 0.55], materials.metalDark);
    batch.addCylinder([lx, 1.8, lz], 0.08, 0.14, 3.0, materials.metalDark);
    // Double scroll brackets
    batch.addBox([lx, 3.3, lz], [0.8, 0.08, 0.12], materials.metalDark);
    // Twin lantern cages
    for (const sx of [-0.35, 0.35]) {
      batch.addBox([lx + sx, 3.1, lz], [0.26, 0.38, 0.26], materials.glass);
      batch.addSphere([lx + sx, 3.1, lz], [0.08, 0.12, 0.08], materials.glow, { shadow: false });
      batch.addCylinder([lx + sx, 3.35, lz], 0.02, 0.32, 0.12, materials.metalDark, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });
    }

    // Street lamp pole collider
    const lampBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(lx, 1.6, lz)
    );
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.6, 0.3), lampBody);
    staticBodies.push(lampBody);
  }

  batch.build(driveGroup, true);
  return driveGroup;
}

/**
 * Creates the high-fidelity animated water effects for the central fountain:
 * 1. Central high-spouting geyser jet with pulsating spray crown & umbrella fall
 * 2. Four parabolic spouting arcs arching outward from brass nozzles into mid basin
 * 3. Cascading overflow water curtains falling between basin tiers with UV animation
 * 4. Concentric expanding ripple rings on the main pond surface
 * 5. Dynamic gravity splash droplet particles (InstancedMesh)
 */
export function createAnimatedFountainWater(parent, fx = 0, fz = 13) {
  const waterGroup = new THREE.Group();
  waterGroup.position.set(fx, 0, fz);
  parent.add(waterGroup);

  const causticTexture = createWaterRipplesTexture(256, 256);
  causticTexture.wrapS = THREE.RepeatWrapping;
  causticTexture.wrapT = THREE.RepeatWrapping;
  causticTexture.repeat.set(2, 2);

  const waterFlowTexture = createWaterRipplesTexture(256, 256);
  waterFlowTexture.wrapS = THREE.RepeatWrapping;
  waterFlowTexture.wrapT = THREE.RepeatWrapping;
  waterFlowTexture.repeat.set(1, 3);

  const waterJetMat = new THREE.MeshStandardMaterial({
    color: 0x54eeff,
    emissive: 0x1aa0b8,
    emissiveIntensity: 0.52,
    transparent: true,
    opacity: 0.88,
    roughness: 0.06,
    metalness: 0.10,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe6fbff,
    emissiveIntensity: 0.85,
    transparent: true,
    opacity: 0.94,
    roughness: 0.30,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const cascadeMat = new THREE.MeshStandardMaterial({
    color: 0x48e8fc,
    emissive: 0x168b9c,
    emissiveIntensity: 0.38,
    map: waterFlowTexture,
    transparent: true,
    opacity: 0.74,
    roughness: 0.10,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 1. Central Spouting High-Pressure Geyser Column (y = 3.52 to 4.87)
  const jetGroup = new THREE.Group();
  jetGroup.position.set(0, 3.52, 0);
  waterGroup.add(jetGroup);

  const jetHeight = 1.35;
  const jetColumnGeo = new THREE.CylinderGeometry(0.08, 0.22, jetHeight, 16, 1, true);
  const jetColumn = new THREE.Mesh(jetColumnGeo, waterJetMat);
  jetColumn.position.y = jetHeight * 0.5;
  jetGroup.add(jetColumn);

  const innerJet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.15, jetHeight + 0.04, 12, 1, true),
    foamMat
  );
  innerJet.position.y = jetHeight * 0.5;
  jetGroup.add(innerJet);

  const apexCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.70),
    waterJetMat
  );
  apexCrown.position.y = jetHeight;
  jetGroup.add(apexCrown);

  const apexFoam = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 8),
    foamMat
  );
  apexFoam.scale.set(1.25, 0.80, 1.25);
  apexFoam.position.y = jetHeight + 0.08;
  jetGroup.add(apexFoam);

  // Secondary foam puffs on geyser head
  for (let p = 0; p < 4; p += 1) {
    const pAngle = (p / 4) * Math.PI * 2;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), foamMat);
    puff.position.set(Math.cos(pAngle) * 0.12, jetHeight + 0.04, Math.sin(pAngle) * 0.12);
    jetGroup.add(puff);
  }

  // Eight weeping water ribbons arching outward and falling down from apex crest
  const ribbonCount = 8;
  const topRibbons = [];
  for (let r = 0; r < ribbonCount; r += 1) {
    const rAngle = (r / ribbonCount) * Math.PI * 2;
    const cosR = Math.cos(rAngle);
    const sinR = Math.sin(rAngle);

    const rp0 = new THREE.Vector3(cosR * 0.06, jetHeight + 0.04, sinR * 0.06);
    const rp1 = new THREE.Vector3(cosR * 0.32, jetHeight + 0.12, sinR * 0.32);
    const rp2 = new THREE.Vector3(cosR * 0.48, jetHeight - 0.32, sinR * 0.48);
    const rp3 = new THREE.Vector3(cosR * 0.52, jetHeight - 0.85, sinR * 0.52);
    const rCurve = new THREE.CatmullRomCurve3([rp0, rp1, rp2, rp3]);
    const rGeo = new THREE.TubeGeometry(rCurve, 14, 0.028, 6, false);
    const rMesh = new THREE.Mesh(rGeo, waterJetMat);
    jetGroup.add(rMesh);
    topRibbons.push(rMesh);
  }

  // 2. Eight Parabolic Spouting Arcs from Crowning Satellite Nozzles into Tier 2 Bowl (y = 3.46 to 2.62)
  const topSatelliteArcs = [];
  for (let s = 0; s < 8; s += 1) {
    const sAngle = (s / 8) * Math.PI * 2;
    const cosA = Math.cos(sAngle);
    const sinA = Math.sin(sAngle);

    const p0 = new THREE.Vector3(cosA * 0.18, 3.46, sinA * 0.18);
    const p1 = new THREE.Vector3(cosA * 0.52, 3.75, sinA * 0.52);
    const p2 = new THREE.Vector3(cosA * 0.82, 3.25, sinA * 0.82);
    const p3 = new THREE.Vector3(cosA * 0.96, 2.62, sinA * 0.96);
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

    const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.034, 6, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, waterJetMat);
    waterGroup.add(tubeMesh);
    topSatelliteArcs.push(tubeMesh);

    // Splash ring in Tier 2 bowl
    const splash = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.18, 12), foamMat);
    splash.rotation.x = -Math.PI * 0.5;
    splash.position.set(cosA * 0.96, 2.63, sinA * 0.96);
    waterGroup.add(splash);
  }

  // 3. Cascading Overflow Water Curtains (Tier 2 to Tier 1)
  const upperCascadeGeo = new THREE.CylinderGeometry(1.14, 1.34, 0.96, 28, 1, true);
  const upperCascade = new THREE.Mesh(upperCascadeGeo, cascadeMat);
  upperCascade.position.y = 2.10;
  waterGroup.add(upperCascade);

  // Upper foaming rim lip ring
  const upperFoamRim = new THREE.Mesh(new THREE.RingGeometry(1.10, 1.18, 28), foamMat);
  upperFoamRim.rotation.x = -Math.PI * 0.5;
  upperFoamRim.position.y = 2.65;
  waterGroup.add(upperFoamRim);

  // Upper impact boiling foam ring in Tier 1 bowl
  const upperImpactFoam = new THREE.Mesh(new THREE.RingGeometry(1.26, 1.42, 28), foamMat);
  upperImpactFoam.rotation.x = -Math.PI * 0.5;
  upperImpactFoam.position.y = 1.58;
  waterGroup.add(upperImpactFoam);

  // 12 Distinct Falling Water Ribbons pouring from Tier 2 scalloped rim into Tier 1
  const upperWaterRibbons = [];
  for (let r = 0; r < 12; r += 1) {
    const rAngle = (r / 12) * Math.PI * 2;
    const cosR = Math.cos(rAngle);
    const sinR = Math.sin(rAngle);

    const rp0 = new THREE.Vector3(cosR * 1.15, 2.64, sinR * 1.15);
    const rp1 = new THREE.Vector3(cosR * 1.22, 2.30, sinR * 1.22);
    const rp2 = new THREE.Vector3(cosR * 1.30, 1.90, sinR * 1.30);
    const rp3 = new THREE.Vector3(cosR * 1.35, 1.58, sinR * 1.35);
    const rCurve = new THREE.CatmullRomCurve3([rp0, rp1, rp2, rp3]);
    const rGeo = new THREE.TubeGeometry(rCurve, 12, 0.038, 6, false);
    const rMesh = new THREE.Mesh(rGeo, waterJetMat);
    waterGroup.add(rMesh);
    upperWaterRibbons.push(rMesh);
  }

  // 4. Six Parabolic Spouting Arcs from Mid-Tier Lion Spouts & Nozzles (y = 1.48 to 0.58)
  const midSpoutArcs = [];
  for (let s = 0; s < 6; s += 1) {
    const sAngle = (s / 6) * Math.PI * 2;
    const cosA = Math.cos(sAngle);
    const sinA = Math.sin(sAngle);

    const p0 = new THREE.Vector3(cosA * 1.78, 1.48, sinA * 1.78);
    const p1 = new THREE.Vector3(cosA * 2.18, 1.78, sinA * 2.18);
    const p2 = new THREE.Vector3(cosA * 2.45, 1.25, sinA * 2.45);
    const p3 = new THREE.Vector3(cosA * 2.52, 0.58, sinA * 2.52);
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

    const tubeGeo = new THREE.TubeGeometry(curve, 18, 0.046, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, waterJetMat);
    waterGroup.add(tubeMesh);
    midSpoutArcs.push(tubeMesh);

    const splashCrown = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.32, 14), foamMat);
    splashCrown.rotation.x = -Math.PI * 0.5;
    splashCrown.position.set(cosA * 2.52, 0.59, sinA * 2.52);
    waterGroup.add(splashCrown);
  }

  // 5. Grand Cascading Overflow Water Curtain (Tier 1 to Main Pond Basin)
  const lowerCascadeGeo = new THREE.CylinderGeometry(1.76, 2.15, 0.98, 32, 1, true);
  const lowerCascade = new THREE.Mesh(lowerCascadeGeo, cascadeMat);
  lowerCascade.position.y = 1.07;
  waterGroup.add(lowerCascade);

  // Lower foaming rim lip ring
  const lowerFoamRim = new THREE.Mesh(new THREE.RingGeometry(1.70, 1.80, 32), foamMat);
  lowerFoamRim.rotation.x = -Math.PI * 0.5;
  lowerFoamRim.position.y = 1.62;
  waterGroup.add(lowerFoamRim);

  // Lower impact boiling foam ring in Main Basin
  const lowerImpactFoam = new THREE.Mesh(new THREE.RingGeometry(2.02, 2.28, 32), foamMat);
  lowerImpactFoam.rotation.x = -Math.PI * 0.5;
  lowerImpactFoam.position.y = 0.58;
  waterGroup.add(lowerImpactFoam);

  // 16 Distinct Falling Water Ribbons pouring from Tier 1 rim into Main Basin
  const lowerWaterRibbons = [];
  for (let r = 0; r < 16; r += 1) {
    const rAngle = (r / 16) * Math.PI * 2;
    const cosR = Math.cos(rAngle);
    const sinR = Math.sin(rAngle);

    const rp0 = new THREE.Vector3(cosR * 1.76, 1.60, sinR * 1.76);
    const rp1 = new THREE.Vector3(cosR * 1.88, 1.25, sinR * 1.88);
    const rp2 = new THREE.Vector3(cosR * 2.02, 0.90, sinR * 2.02);
    const rp3 = new THREE.Vector3(cosR * 2.15, 0.58, sinR * 2.15);
    const rCurve = new THREE.CatmullRomCurve3([rp0, rp1, rp2, rp3]);
    const rGeo = new THREE.TubeGeometry(rCurve, 14, 0.042, 6, false);
    const rMesh = new THREE.Mesh(rGeo, waterJetMat);
    waterGroup.add(rMesh);
    lowerWaterRibbons.push(rMesh);
  }

  // 6. Eight Inward-Shooting Perimeter Arcs from Octagon Corner Piers to Center (y = 0.95 to 0.58)
  const perimeterInwardArcs = [];
  for (let p = 0; p < 8; p += 1) {
    const pAngle = (p / 8) * Math.PI * 2;
    const cosP = Math.cos(pAngle);
    const sinP = Math.sin(pAngle);

    const p0 = new THREE.Vector3(cosP * 2.95, 0.95, sinP * 2.95);
    const p1 = new THREE.Vector3(cosP * 2.15, 1.85, sinP * 2.15);
    const p2 = new THREE.Vector3(cosP * 1.50, 1.40, sinP * 1.50);
    const p3 = new THREE.Vector3(cosP * 1.25, 0.58, sinP * 1.25);
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.038, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, waterJetMat);
    waterGroup.add(tubeMesh);
    perimeterInwardArcs.push(tubeMesh);

    // Foam ring at nozzle base
    const nozzleSplash = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.16, 10), foamMat);
    nozzleSplash.rotation.x = -Math.PI * 0.5;
    nozzleSplash.position.set(cosP * 2.95, 0.96, sinP * 2.95);
    waterGroup.add(nozzleSplash);

    // Inward arc impact foam splash crown in pond
    const impactSplash = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.26, 12), foamMat);
    impactSplash.rotation.x = -Math.PI * 0.5;
    impactSplash.position.set(cosP * 1.25, 0.59, sinP * 1.25);
    waterGroup.add(impactSplash);
  }

  // 7. Dynamic Expanding Ripple Rings in Main Basin (y = 0.57)
  const mainRipples = [];
  const rippleCount = 4;
  for (let i = 0; i < rippleCount; i += 1) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x98f4ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 0.98, 28),
      ringMat
    );
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.y = 0.57;
    ring.userData = { phase: i / rippleCount, mat: ringMat };
    waterGroup.add(ring);
    mainRipples.push(ring);
  }

  // 8. Active Droplet Splash Particles (InstancedMesh - 180 Particles)
  const dropletCount = 180;
  const dropletGeo = new THREE.SphereGeometry(0.046, 6, 5);
  const dropletMat = new THREE.MeshStandardMaterial({
    color: 0x7cf5ff,
    emissive: 0x22b2cc,
    emissiveIntensity: 0.55,
    roughness: 0.05,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const dropletsMesh = new THREE.InstancedMesh(dropletGeo, dropletMat, dropletCount);
  dropletsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  waterGroup.add(dropletsMesh);

  const dropletData = [];
  for (let i = 0; i < dropletCount; i += 1) {
    // 0..59: Top geyser apex burst
    // 60..99: Upper cascade spray
    // 100..139: Lower cascade waterfall spray
    // 140..179: Perimeter inward arc splash
    const type = i < 60 ? 'top' : i < 100 ? 'upper' : i < 140 ? 'lower' : 'perimeter';
    dropletData.push({
      type,
      x: 0,
      y: 1.0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      scale: 0.7 + Math.random() * 0.6,
      index: i,
    });
  }

  function resetDroplet(d) {
    if (d.type === 'top') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.45 + Math.random() * 0.65;
      d.x = Math.cos(angle) * 0.12;
      d.y = 4.70 + Math.random() * 0.20;
      d.z = Math.sin(angle) * 0.12;
      d.vx = Math.cos(angle) * speed;
      d.vy = 0.8 + Math.random() * 1.2;
      d.vz = Math.sin(angle) * speed;
    } else if (d.type === 'upper') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.30 + Math.random() * 0.45;
      d.x = Math.cos(angle) * 1.20;
      d.y = 2.62 + Math.random() * 0.10;
      d.z = Math.sin(angle) * 1.20;
      d.vx = Math.cos(angle) * speed;
      d.vy = 0.4 + Math.random() * 0.7;
      d.vz = Math.sin(angle) * speed;
    } else if (d.type === 'lower') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.55;
      d.x = Math.cos(angle) * 1.85;
      d.y = 1.58 + Math.random() * 0.10;
      d.z = Math.sin(angle) * 1.85;
      d.vx = Math.cos(angle) * speed;
      d.vy = 0.5 + Math.random() * 0.8;
      d.vz = Math.sin(angle) * speed;
    } else {
      // Perimeter inward arc splashdown
      const pAngle = (d.index % 8 / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 0.35 + Math.random() * 0.50;
      d.x = Math.cos(pAngle) * 1.25;
      d.y = 0.60;
      d.z = Math.sin(pAngle) * 1.25;
      d.vx = (Math.random() - 0.5) * speed * 2;
      d.vy = 0.8 + Math.random() * 1.1;
      d.vz = (Math.random() - 0.5) * speed * 2;
    }
  }

  for (const d of dropletData) {
    resetDroplet(d);
  }

  const dummy = new THREE.Object3D();

  function update(dt, elapsed) {
    // Geyser animation
    const jetScaleY = 1.0 + Math.sin(elapsed * 5.5) * 0.08;
    const jetScaleXZ = 1.0 + Math.cos(elapsed * 4.2) * 0.05;
    jetColumn.scale.set(jetScaleXZ, jetScaleY, jetScaleXZ);
    innerJet.scale.set(jetScaleXZ * 0.9, jetScaleY * 1.02, jetScaleXZ * 0.9);
    jetGroup.rotation.y += dt * 0.35;
    apexCrown.position.y = jetHeight + Math.sin(elapsed * 5.5) * 0.05;
    apexFoam.position.y = jetHeight + 0.08 + Math.sin(elapsed * 5.5 + 0.5) * 0.06;

    // UV scrolling
    causticTexture.offset.x = (causticTexture.offset.x + dt * 0.08) % 1;
    causticTexture.offset.y = (causticTexture.offset.y + dt * 0.06) % 1;
    waterFlowTexture.offset.y = (waterFlowTexture.offset.y - dt * 1.8) % 1;

    // Cascade breathing
    upperCascade.scale.x = 1.0 + Math.sin(elapsed * 3.5) * 0.025;
    upperCascade.scale.z = 1.0 + Math.cos(elapsed * 3.5) * 0.025;
    lowerCascade.scale.x = 1.0 + Math.cos(elapsed * 3.0) * 0.025;
    lowerCascade.scale.z = 1.0 + Math.sin(elapsed * 3.0) * 0.025;

    // Spout arcs pulsation
    for (let s = 0; s < topSatelliteArcs.length; s += 1) {
      topSatelliteArcs[s].scale.y = 1.0 + Math.sin(elapsed * 4.5 + s) * 0.03;
    }
    for (let s = 0; s < midSpoutArcs.length; s += 1) {
      midSpoutArcs[s].scale.y = 1.0 + Math.sin(elapsed * 4.0 + s) * 0.035;
    }
    for (let p = 0; p < perimeterInwardArcs.length; p += 1) {
      perimeterInwardArcs[p].scale.y = 1.0 + Math.sin(elapsed * 3.8 + p) * 0.03;
    }

    // Dynamic expanding ripple rings
    for (const r of mainRipples) {
      r.userData.phase = (r.userData.phase + dt * 0.42) % 1.0;
      const progress = r.userData.phase;
      const currentRadius = 0.90 + progress * 2.05;
      r.scale.set(currentRadius / 0.90, currentRadius / 0.90, 1);
      r.userData.mat.opacity = Math.max(0, (1.0 - progress) * 0.65);
    }

    // Physics simulation for droplets
    const gravity = 4.8;
    for (let i = 0; i < dropletCount; i += 1) {
      const d = dropletData[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      d.vy -= gravity * dt;

      const minY = d.type === 'top' ? 2.65 : d.type === 'upper' ? 1.58 : 0.58;
      if (d.y < minY) {
        resetDroplet(d);
      }

      dummy.position.set(d.x, d.y, d.z);
      const s = d.scale * Math.max(0.2, Math.min(1.2, (d.y - minY) * 1.5));
      dummy.scale.set(s, s * 1.25, s);
      dummy.updateMatrix();
      dropletsMesh.setMatrixAt(i, dummy.matrix);
    }
    dropletsMesh.instanceMatrix.needsUpdate = true;
  }

  return {
    group: waterGroup,
    update,
  };
}
