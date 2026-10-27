import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector, mergeStaticHierarchy } from './geometry.js';

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
  for (let i = 0; i < basinSides; i += 1) {
    const angle = (i / basinSides) * Math.PI * 2;
    const nextAngle = ((i + 1) / basinSides) * Math.PI * 2;
    const midAngle = (angle + nextAngle) * 0.5;
    const mx = fountainX + Math.cos(midAngle) * basinRadius;
    const mz = fountainZ + Math.sin(midAngle) * basinRadius;
    const segLen = 2 * basinRadius * Math.sin(Math.PI / basinSides);
    batch.addBox([mx, 0.38, mz], [segLen + 0.12, 0.68, 0.38], materials.stoneWarm, {
      rotation: [0, -midAngle - Math.PI * 0.5, 0],
    });
    // Decorative coping cap
    batch.addBox([mx, 0.74, mz], [segLen + 0.18, 0.08, 0.52], materials.trim, {
      rotation: [0, -midAngle - Math.PI * 0.5, 0],
    });
  }

  // Fountain water basin surface
  const waterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(basinRadius - 0.2, basinRadius - 0.2, 0.05, 16),
    materials.waterfallPond
  );
  waterDisc.position.set(fountainX, 0.55, fountainZ);
  waterDisc.receiveShadow = true;
  driveGroup.add(waterDisc);

  // Central sculpted stone pedestal & mid-tier water shell
  batch.addCylinder([fountainX, 0.85, fountainZ], 0.75, 0.95, 1.2, materials.stoneWarm, { segments: 16 });
  batch.addCylinder([fountainX, 1.5, fountainZ], 1.55, 0.45, 0.28, materials.stoneWarm, { segments: 16 });
  // Upper water pool
  batch.addCylinder([fountainX, 1.58, fountainZ], 1.45, 1.45, 0.04, materials.waterfallPond, { segments: 16 });
  // Second tier fluted basin
  batch.addCylinder([fountainX, 2.05, fountainZ], 0.45, 0.65, 0.85, materials.stoneWarm, { segments: 16 });
  batch.addCylinder([fountainX, 2.45, fountainZ], 0.95, 0.35, 0.22, materials.stoneWarm, { segments: 16 });
  batch.addCylinder([fountainX, 2.52, fountainZ], 0.88, 0.88, 0.04, materials.waterfallPond, { segments: 16 });
  // Classical stone finial urn with brass water spouts (no strange egg!)
  batch.addCylinder([fountainX, 2.78, fountainZ], 0.28, 0.18, 0.38, materials.stoneWarm, { segments: 12 });
  batch.addSphere([fountainX, 3.02, fountainZ], [0.26, 0.22, 0.26], materials.stoneWarm);
  batch.addCylinder([fountainX, 3.18, fountainZ], 0.12, 0.24, 0.14, materials.brass, { segments: 12 });
  batch.addSphere([fountainX, 3.28, fountainZ], [0.08, 0.12, 0.08], materials.brass, { shadow: false });

  // 4 Brass water spouts on upper bowl
  for (let s = 0; s < 4; s += 1) {
    const sAngle = (s / 4) * Math.PI * 2;
    batch.addCylinder(
      [fountainX + Math.cos(sAngle) * 0.95, 2.42, fountainZ + Math.sin(sAngle) * 0.95],
      0.02, 0.02, 0.12,
      materials.brass,
      { rotation: [Math.PI * 0.5, 0, sAngle] }
    );
  }

  // Soft underwater fountain spotlight
  const fountainLight = new THREE.PointLight(0x70d6ff, 1.4, 7.0, 1.8);
  fountainLight.position.set(fountainX, 1.2, fountainZ);
  driveGroup.add(fountainLight);

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

  // Painted parking bay guide lines for visitors (x: [14.0, 25.0], z: [8.0, 15.0])
  const stallZs = [8.5, 11.5, 14.5];
  for (const sz of stallZs) {
    batch.addBox([15.5, 0.045, sz], [5.2, 0.008, 0.12], materials.trim);
  }
  batch.addBox([13.0, 0.045, 11.5], [0.12, 0.008, 6.2], materials.trim);

  // 3. Landscaping Islands with Ornamental Cypress Trees & Lavender
  const islandSpecs = [
    { x: 9.2, z: 7.5, r: 1.8 },
    { x: 9.2, z: 18.5, r: 1.8 },
    { x: 27.2, z: 7.5, r: 1.6 },
    { x: 27.2, z: 18.5, r: 1.6 },
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

  // 4. Victorian Cast-Iron Street Lanterns along Driveway
  const lampPositions = [
    [10.5, 13.0],
    [26.5, 13.0],
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
  mergeStaticHierarchy(driveGroup);
  return driveGroup;
}
