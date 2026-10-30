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
    color: 0x58ecff,
    emissive: 0x1aa0b8,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.85,
    roughness: 0.08,
    metalness: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xd6f7fc,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.88,
    roughness: 0.25,
    depthWrite: false,
  });

  const cascadeMat = new THREE.MeshStandardMaterial({
    color: 0x4ee5f8,
    emissive: 0x127788,
    emissiveIntensity: 0.28,
    map: waterFlowTexture,
    transparent: true,
    opacity: 0.62,
    roughness: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 1. Central Spouting Geyser Column (y = 3.28 to 4.35)
  const jetGroup = new THREE.Group();
  jetGroup.position.set(0, 3.28, 0);
  waterGroup.add(jetGroup);

  const jetHeight = 1.05;
  const jetColumnGeo = new THREE.CylinderGeometry(0.05, 0.14, jetHeight, 12, 1, true);
  const jetColumn = new THREE.Mesh(jetColumnGeo, waterJetMat);
  jetColumn.position.y = jetHeight * 0.5;
  jetGroup.add(jetColumn);

  const innerJet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.09, jetHeight + 0.02, 8, 1, true),
    foamMat
  );
  innerJet.position.y = jetHeight * 0.5;
  jetGroup.add(innerJet);

  const apexCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.65),
    waterJetMat
  );
  apexCrown.position.y = jetHeight;
  jetGroup.add(apexCrown);

  const apexFoam = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 6),
    foamMat
  );
  apexFoam.scale.set(1.2, 0.65, 1.2);
  apexFoam.position.y = jetHeight + 0.06;
  jetGroup.add(apexFoam);

  // Six weeping water ribbons arching outward and falling down from the apex crest
  const ribbonCount = 6;
  const topRibbons = [];
  for (let r = 0; r < ribbonCount; r += 1) {
    const rAngle = (r / ribbonCount) * Math.PI * 2;
    const cosR = Math.cos(rAngle);
    const sinR = Math.sin(rAngle);

    const rp0 = new THREE.Vector3(cosR * 0.04, jetHeight, sinR * 0.04);
    const rp1 = new THREE.Vector3(cosR * 0.22, jetHeight + 0.08, sinR * 0.22);
    const rp2 = new THREE.Vector3(cosR * 0.38, jetHeight - 0.25, sinR * 0.38);
    const rp3 = new THREE.Vector3(cosR * 0.44, jetHeight - 0.65, sinR * 0.44);
    const rCurve = new THREE.CatmullRomCurve3([rp0, rp1, rp2, rp3]);
    const rGeo = new THREE.TubeGeometry(rCurve, 12, 0.024, 6, false);
    const rMesh = new THREE.Mesh(rGeo, waterJetMat);
    jetGroup.add(rMesh);
    topRibbons.push(rMesh);
  }

  // 2. Four Parabolic Spouting Arcs from Brass Nozzles (y = 2.42 to 1.58)
  const spoutArcs = [];
  for (let s = 0; s < 4; s += 1) {
    const sAngle = (s / 4) * Math.PI * 2;
    const cosA = Math.cos(sAngle);
    const sinA = Math.sin(sAngle);

    const p0 = new THREE.Vector3(cosA * 0.96, 2.42, sinA * 0.96);
    const p1 = new THREE.Vector3(cosA * 1.26, 2.62, sinA * 1.26);
    const p2 = new THREE.Vector3(cosA * 1.48, 2.15, sinA * 1.48);
    const p3 = new THREE.Vector3(cosA * 1.44, 1.58, sinA * 1.44);
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

    const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.042, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, waterJetMat);
    waterGroup.add(tubeMesh);
    spoutArcs.push(tubeMesh);

    const splashCrown = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.24, 12),
      foamMat
    );
    splashCrown.rotation.x = -Math.PI * 0.5;
    splashCrown.position.set(cosA * 1.44, 1.60, sinA * 1.44);
    waterGroup.add(splashCrown);
  }

  // 3. Cascading Overflow Water Curtains
  const upperCascadeGeo = new THREE.CylinderGeometry(0.92, 1.18, 0.83, 24, 1, true);
  const upperCascade = new THREE.Mesh(upperCascadeGeo, cascadeMat);
  upperCascade.position.y = 2.035;
  waterGroup.add(upperCascade);

  const lowerCascadeGeo = new THREE.CylinderGeometry(1.52, 1.95, 0.90, 28, 1, true);
  const lowerCascade = new THREE.Mesh(lowerCascadeGeo, cascadeMat);
  lowerCascade.position.y = 1.03;
  waterGroup.add(lowerCascade);

  // 4. Dynamic Expanding Ripple Rings in Main Basin (y = 0.57)
  const mainRipples = [];
  const rippleCount = 3;
  for (let i = 0; i < rippleCount; i += 1) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x98f4ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.90, 1.00, 24),
      ringMat
    );
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.y = 0.57;
    ring.userData = { phase: i / rippleCount, mat: ringMat };
    waterGroup.add(ring);
    mainRipples.push(ring);
  }

  // 5. Active Droplet Splash Particles (InstancedMesh)
  const dropletCount = 60;
  const dropletGeo = new THREE.SphereGeometry(0.042, 6, 5);
  const dropletMat = new THREE.MeshStandardMaterial({
    color: 0x76f5ff,
    emissive: 0x22aacc,
    emissiveIntensity: 0.5,
    roughness: 0.05,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const dropletsMesh = new THREE.InstancedMesh(dropletGeo, dropletMat, dropletCount);
  dropletsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  waterGroup.add(dropletsMesh);

  const dropletData = [];
  for (let i = 0; i < dropletCount; i += 1) {
    const isTopJet = i < 36;
    dropletData.push({
      isTopJet,
      x: 0,
      y: isTopJet ? 3.3 + Math.random() * 1.5 : 1.6 + Math.random() * 0.5,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      scale: 0.7 + Math.random() * 0.6,
      nozzleIndex: i % 4,
    });
  }

  function resetDroplet(d) {
    if (d.isTopJet) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.55;
      d.x = Math.cos(angle) * 0.08;
      d.y = 4.15 + Math.random() * 0.15;
      d.z = Math.sin(angle) * 0.08;
      d.vx = Math.cos(angle) * speed;
      d.vy = 0.6 + Math.random() * 1.0;
      d.vz = Math.sin(angle) * speed;
    } else {
      const sAngle = (d.nozzleIndex / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 0.25 + Math.random() * 0.45;
      d.x = Math.cos(sAngle) * 1.44;
      d.y = 1.60;
      d.z = Math.sin(sAngle) * 1.44;
      d.vx = Math.cos(sAngle) * speed + (Math.random() - 0.5) * 0.2;
      d.vy = 0.6 + Math.random() * 0.9;
      d.vz = Math.sin(sAngle) * speed + (Math.random() - 0.5) * 0.2;
    }
  }

  for (const d of dropletData) {
    resetDroplet(d);
  }

  const dummy = new THREE.Object3D();

  function update(dt, elapsed) {
    const jetScaleY = 1.0 + Math.sin(elapsed * 5.5) * 0.06;
    const jetScaleXZ = 1.0 + Math.cos(elapsed * 4.2) * 0.04;
    jetColumn.scale.set(jetScaleXZ, jetScaleY, jetScaleXZ);
    innerJet.scale.set(jetScaleXZ * 0.9, jetScaleY * 1.02, jetScaleXZ * 0.9);
    jetGroup.rotation.y += dt * 0.35;
    apexCrown.position.y = jetHeight + Math.sin(elapsed * 5.5) * 0.04;
    apexFoam.position.y = jetHeight + 0.06 + Math.sin(elapsed * 5.5 + 0.5) * 0.05;

    causticTexture.offset.x = (causticTexture.offset.x + dt * 0.08) % 1;
    causticTexture.offset.y = (causticTexture.offset.y + dt * 0.06) % 1;
    waterFlowTexture.offset.y = (waterFlowTexture.offset.y - dt * 1.6) % 1;

    for (let s = 0; s < spoutArcs.length; s += 1) {
      spoutArcs[s].scale.y = 1.0 + Math.sin(elapsed * 4.0 + s) * 0.03;
    }

    upperCascade.scale.x = 1.0 + Math.sin(elapsed * 3.5) * 0.02;
    upperCascade.scale.z = 1.0 + Math.cos(elapsed * 3.5) * 0.02;
    lowerCascade.scale.x = 1.0 + Math.cos(elapsed * 3.0) * 0.02;
    lowerCascade.scale.z = 1.0 + Math.sin(elapsed * 3.0) * 0.02;

    for (const r of mainRipples) {
      r.userData.phase = (r.userData.phase + dt * 0.45) % 1.0;
      const progress = r.userData.phase;
      const currentRadius = 0.95 + progress * 1.85;
      r.scale.set(currentRadius / 0.95, currentRadius / 0.95, 1);
      r.userData.mat.opacity = Math.max(0, (1.0 - progress) * 0.55);
    }

    const gravity = 4.2;
    for (let i = 0; i < dropletCount; i += 1) {
      const d = dropletData[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      d.vy -= gravity * dt;

      const minY = d.isTopJet ? 2.50 : 0.60;
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
