import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector } from './geometry.js';
import { createOutdoorParkingLot } from './vehicles.js';

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

  // Driveway animation update (no-op now that fountain is removed)
  driveGroup.update = (dt, elapsed) => {};

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

export function createAnimatedFountainWater(parent, fx = 0, fz = 13, basinRadius = 3.0) {
  return {
    group: new THREE.Group(),
    update: () => {},
  };
}
