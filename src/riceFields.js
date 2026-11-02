import * as THREE from 'three';
import { materials, palette, vertexColorFamilies } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector } from './geometry.js';

/**
 * Creates Zone H: Sawah (Terraced Flooded Rice Paddies & Agricultural Landscape)
 * Features 4 stepped flooded paddies, earthen bunds (pematang sawah),
 * rows of rice stalk clusters, modern yellow agricultural tractor,
 * traditional resting gazebo (saung sawah), and scarecrow (orang-orangan sawah).
 * Spans x: [-10.0, 48.0], z: [-46.0, -19.0]
 */
export function createRiceFields(scene, world, RAPIER, staticBodies) {
  const riceGroup = new THREE.Group();
  scene.add(riceGroup);
  const batch = new BatchCollector();
  let farmerNPC = null;
  const extraFarmers = [];

  // Farm foundation soil base (z: [-46.0, -19.0], x: [-10.0, 48.0])
  batch.addBox([19.0, -0.06, -32.5], [58.0, 0.12, 27.0], materials.paddySoil);

  // =========================================================================
  // 1. Terraced Flooded Rice Paddies (Petak Sawah Berundak)
  // =========================================================================
  const paddies = [
    // Paddy 1 (West plot, near path): x: [-6.0, 8.0], z: [-42.0, -32.0]
    { x: 1.0, z: -37.0, w: 13.0, d: 9.0, h: 0.18, waterY: 0.22 },
    // Paddy 2 (Center-North plot): x: [10.0, 26.0], z: [-44.0, -32.0]
    { x: 18.0, z: -38.0, w: 15.0, d: 11.0, h: 0.28, waterY: 0.32 },
    // Paddy 3 (East plot): x: [28.0, 44.0], z: [-42.0, -30.0]
    { x: 36.0, z: -36.0, w: 15.0, d: 11.0, h: 0.38, waterY: 0.42 },
    // Paddy 4 (South terraced plot): x: [6.0, 32.0], z: [-30.0, -21.0]
    { x: 19.0, z: -25.5, w: 25.0, d: 8.0, h: 0.12, waterY: 0.16 },
  ];

  for (const p of paddies) {
    // Earthen basin base
    batch.addBox([p.x, p.h * 0.5, p.z], [p.w, p.h, p.d], materials.paddySoil);

    // Reflective flooded water sheet
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(p.w - 0.7, 0.04, p.d - 0.7),
      materials.ricePaddyWater
    );
    water.position.set(p.x, p.waterY, p.z);
    water.receiveShadow = true;
    riceGroup.add(water);

    // Water level physics collider
    const pBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(p.x, p.waterY * 0.5, p.z));
    world.createCollider(RAPIER.ColliderDesc.cuboid(p.w * 0.5, p.waterY * 0.5, p.d * 0.5), pBody);
    staticBodies.push(pBody);

    // Organic rows of rice plant clusters (rumpun padi)
    const stepX = 1.65;
    const stepZ = 1.7;
    for (let rx = p.x - p.w * 0.5 + 1.2; rx <= p.x + p.w * 0.5 - 1.2; rx += stepX) {
      for (let rz = p.z - p.d * 0.5 + 1.2; rz <= p.z + p.d * 0.5 - 1.2; rz += stepZ) {
        // Vary between young vibrant green and golden ripening rice
        const isMature = (rx + rz) % 3 < 1.2;
        const mat = isMature ? materials.ricePlantGold : materials.ricePlantGreen;
        const plantH = isMature ? 0.72 : 0.55;

        // Central cluster & splayed blade
        batch.addCylinder([rx, p.waterY + plantH * 0.45, rz], 0.08, 0.28, plantH, mat, { segments: 5 });
        batch.addCylinder([rx + 0.08, p.waterY + plantH * 0.45, rz], 0.04, 0.18, plantH * 0.9, mat, {
          rotation: [0.15, 0, 0.2],
          segments: 4,
        });
      }
    }
  }

  // Raised earthen bunds (pematang sawah) separating the plots - walkable paths
  const bundPaths = [
    // North-South bund between Paddy 1 & 2 (x = 9.0)
    { x: 9.0, z: -37.0, w: 1.1, d: 11.0, h: 0.35 },
    // North-South bund between Paddy 2 & 3 (x = 27.0)
    { x: 27.0, z: -37.0, w: 1.1, d: 11.0, h: 0.42 },
    // East-West bund between North plots & South plot (z = -31.0)
    { x: 19.0, z: -30.8, w: 42.0, d: 1.2, h: 0.32 },
    // Outer perimeter bunds
    { x: -6.5, z: -37.0, w: 1.2, d: 11.0, h: 0.25 },
    { x: 44.5, z: -37.0, w: 1.2, d: 11.0, h: 0.45 },
  ];

  for (const b of bundPaths) {
    batch.addBox([b.x, b.h * 0.5, b.z], [b.w, b.h, b.d], materials.paddySoil);
    // Green grassy path top
    batch.addBox([b.x, b.h + 0.01, b.z], [b.w - 0.2, 0.02, b.d - 0.2], materials.grassLight);

    const bBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(b.x, b.h * 0.5, b.z));
    world.createCollider(RAPIER.ColliderDesc.cuboid(b.w * 0.5, b.h * 0.5, b.d * 0.5), bBody);
    staticBodies.push(bBody);
  }

  // =========================================================================
  // 2. Modern Yellow Agricultural Tractor (Traktor Sawah) (x = 24.5, z = -30.8)
  // =========================================================================
  const tracX = 24.5;
  const tracZ = -30.8;
  const tracGroup = new THREE.Group();
  tracGroup.position.set(tracX, 0.32, tracZ);
  tracGroup.rotation.y = Math.PI * 0.5; // facing east
  riceGroup.add(tracGroup);

  const tb = new BatchCollector();
  // Main chassis & engine housing
  tb.addBox([0, 0.72, 0], [3.2, 0.65, 1.4], materials.tractorYellow);
  // Hood front taper
  tb.addBox([1.1, 0.82, 0], [1.1, 0.5, 1.25], materials.tractorYellow);
  // Black front radiator grille
  tb.addBox([1.66, 0.75, 0], [0.06, 0.45, 1.0], materials.metalDark);
  // Twin front round work lights
  tb.addCylinder([1.68, 0.95, 0.4], 0.12, 0.12, 0.06, materials.glow, { rotation: [0, 0, Math.PI * 0.5], shadow: false });
  tb.addCylinder([1.68, 0.95, -0.4], 0.12, 0.12, 0.06, materials.glow, { rotation: [0, 0, Math.PI * 0.5], shadow: false });
  // Vertical vertical chrome exhaust smoke stack pipe
  tb.addCylinder([0.85, 1.6, 0.5], 0.06, 0.06, 1.1, materials.chrome);
  tb.addCylinder([0.85, 2.18, 0.5], 0.04, 0.08, 0.15, materials.chrome);

  // Open-air driver cockpit, seat & steering wheel
  tb.addBox([-0.4, 1.15, 0], [0.8, 0.18, 0.8], materials.leatherDark); // Seat cushion
  tb.addBox([-0.72, 1.45, 0], [0.12, 0.5, 0.75], materials.leatherDark); // Seat backrest
  // Steering column and wheel
  tb.addCylinder([0.2, 1.35, 0], 0.04, 0.04, 0.5, materials.metalDark, { rotation: [0, 0, -0.4] });
  tb.addCylinder([0.35, 1.58, 0], 0.22, 0.22, 0.04, materials.metalDark, { rotation: [0, 0, -0.4], segments: 12 });

  // Sturdy safety roll bar cage (ROPS)
  tb.addCylinder([-0.75, 1.85, 0.62], 0.05, 0.05, 1.5, materials.metalDark);
  tb.addCylinder([-0.75, 1.85, -0.62], 0.05, 0.05, 1.5, materials.metalDark);
  tb.addBox([-0.75, 2.6, 0], [0.1, 0.1, 1.34], materials.metalDark);
  // Roof canopy shade
  tb.addBox([-0.4, 2.68, 0], [1.4, 0.06, 1.45], materials.tractorYellow);

  // Large rear tread tires
  for (const sz of [-0.95, 0.95]) {
    tb.addCylinder([-0.65, 0.85, sz], 0.85, 0.85, 0.48, materials.tractorTire, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 16,
    });
    tb.addCylinder([-0.65, 0.85, sz + (sz > 0 ? 0.08 : -0.08)], 0.52, 0.52, 0.38, materials.tractorYellow, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 12,
    });
  }
  // Smaller front steering wheels
  for (const sz of [-0.85, 0.85]) {
    tb.addCylinder([1.15, 0.5, sz], 0.5, 0.5, 0.34, materials.tractorTire, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 14,
    });
    tb.addCylinder([1.15, 0.5, sz + (sz > 0 ? 0.06 : -0.06)], 0.3, 0.3, 0.26, materials.tractorYellow, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 10,
    });
  }

  tb.build(tracGroup, true);

  // Tractor physics collider
  const tracBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(tracX, 1.1, tracZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(1.8, 1.1, 1.1), tracBody);
  staticBodies.push(tracBody);

  // =========================================================================
  // 3. Traditional Resting Gazebo (Saung Sawah Sunda) (x = 3.5, z = -30.8)
  // =========================================================================
  const saungX = 3.5;
  const saungZ = -30.8;
  const saungW = 4.0;
  const saungD = 3.5;

  // 4 Bamboo stilt posts elevating the saung platform
  const stiltOffsets = [
    [-saungW * 0.45, -saungD * 0.45],
    [saungW * 0.45, -saungD * 0.45],
    [-saungW * 0.45, saungD * 0.45],
    [saungW * 0.45, saungD * 0.45],
  ];
  for (const [sx, sz] of stiltOffsets) {
    batch.addCylinder([saungX + sx, 1.8, saungZ + sz], 0.09, 0.1, 2.8, materials.woodWarm);
  }

  // Raised split-bamboo floor platform (balé-balé)
  batch.addBox([saungX, 0.72, saungZ], [saungW, 0.16, saungD], materials.woodLight);
  // Low perimeter bamboo balustrades with entry opening
  batch.addBox([saungX, 1.05, saungZ - saungD * 0.46], [saungW - 0.4, 0.08, 0.08], materials.woodLight);
  batch.addBox([saungX - saungW * 0.46, 1.05, saungZ], [0.08, 0.08, saungD - 0.4], materials.woodLight);
  batch.addBox([saungX + saungW * 0.46, 1.05, saungZ], [0.08, 0.08, saungD - 0.4], materials.woodLight);

  // Traditional thatched palm fiber / alang-alang pyramid roof (atap ijuk)
  batch.addCylinder([saungX, 3.45, saungZ], 0.1, 3.2, 1.8, materials.strawHat, {
    segments: 4,
    rotation: [0, Math.PI * 0.25, 0],
  });
  // Overhanging roof eaves
  batch.addBox([saungX, 2.65, saungZ], [saungW + 1.2, 0.12, saungD + 1.2], materials.woodDark);

  // Interior low tea table with clay teapot and cups
  batch.addBox([saungX, 0.95, saungZ], [1.1, 0.28, 0.8], materials.woodWarm);
  batch.addSphere([saungX, 1.15, saungZ], [0.12, 0.12, 0.12], materials.ceramicTerracotta);
  batch.addCylinder([saungX + 0.28, 1.14, saungZ], 0.05, 0.06, 0.08, materials.ceramic);

  // Bamboo access ladder
  batch.addBox([saungX, 0.38, saungZ + saungD * 0.5 + 0.35], [1.0, 0.08, 0.8], materials.woodWarm, {
    rotation: [0.38, 0, 0],
  });

  // Saung physics collider
  const saungBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(saungX, 1.6, saungZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(saungW * 0.5, 1.6, saungD * 0.5), saungBody);
  staticBodies.push(saungBody);

  // =========================================================================
  // 4. Traditional Scarecrow (Orang-orangan Sawah) (x = 14.0, z = -26.0)
  // =========================================================================
  const scareX = 14.0;
  const scareZ = -26.0;

  // Vertical wooden bamboo mast pole
  batch.addCylinder([scareX, 1.4, scareZ], 0.04, 0.05, 2.6, materials.woodDark);
  // Horizontal outstretched arms crossbar
  batch.addCylinder([scareX, 1.9, scareZ], 0.035, 0.035, 2.2, materials.woodDark, {
    rotation: [0, 0, Math.PI * 0.5],
  });

  // Tattered red fabric shirt draped over torso
  batch.addBox([scareX, 1.6, scareZ], [0.65, 0.85, 0.3], materials.coral);
  // Fluttering fabric sleeves
  batch.addCylinder([scareX - 0.65, 1.88, scareZ], 0.12, 0.08, 0.75, materials.coral, { rotation: [0, 0, Math.PI * 0.5] });
  batch.addCylinder([scareX + 0.65, 1.88, scareZ], 0.12, 0.08, 0.75, materials.coral, { rotation: [0, 0, Math.PI * 0.5] });

  // Straw stuffing tufts poking out of cuffs
  batch.addSphere([scareX - 1.05, 1.88, scareZ], [0.1, 0.08, 0.1], materials.hayGolden);
  batch.addSphere([scareX + 1.05, 1.88, scareZ], [0.1, 0.08, 0.1], materials.hayGolden);

  // Burlap sack head with stitched friendly face
  batch.addSphere([scareX, 2.3, scareZ], [0.24, 0.28, 0.24], materials.strawHat);
  // Button eyes & smile
  batch.addSphere([scareX - 0.09, 2.35, scareZ + 0.23], [0.03, 0.03, 0.03], materials.inkDark);
  batch.addSphere([scareX + 0.09, 2.35, scareZ + 0.23], [0.03, 0.03, 0.03], materials.inkDark);

  // Traditional conical woven bamboo hat (Caping Petani)
  batch.addCylinder([scareX, 2.6, scareZ], 0.02, 0.52, 0.32, materials.strawHat);

  // Scarecrow collider
  const scBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(scareX, 1.4, scareZ));
  world.createCollider(RAPIER.ColliderDesc.cylinder(1.4, 0.25), scBody);
  staticBodies.push(scBody);

  // =========================================================================
  // 5. Traditional Rice Farmer NPC (Pak Tani in Caping & Holding Cangkul)
  // =========================================================================
  const farmerX = 18.0;
  const farmerZ = -32.5;
  const fGroup = new THREE.Group();
  fGroup.position.set(farmerX, 0.32, farmerZ);
  fGroup.rotation.y = 0.4;
  riceGroup.add(fGroup);

  const fb = new BatchCollector();
  // Rolled up dark trousers and bare feet
  fb.addCylinder([-0.15, 0.5, 0], 0.12, 0.13, 0.65, materials.guardUniform);
  fb.addCylinder([0.15, 0.5, 0], 0.12, 0.13, 0.65, materials.guardUniform);
  fb.addBox([-0.15, 0.08, 0], [0.16, 0.16, 0.28], materials.skin);
  fb.addBox([0.15, 0.08, 0], [0.16, 0.16, 0.28], materials.skin);

  // Torso in woven light tunic shirt
  fb.addBox([0, 1.25, 0], [0.58, 0.72, 0.38], materials.cream);
  // Waist sash fabric
  fb.addBox([0, 0.92, 0], [0.62, 0.12, 0.42], materials.coral);

  // Arms holding cangkul (hoe)
  fb.addCylinder([-0.35, 1.2, 0.15], 0.09, 0.09, 0.65, materials.skin, { rotation: [0.4, 0, 0.2] });
  fb.addCylinder([0.35, 1.2, 0.15], 0.09, 0.09, 0.65, materials.skin, { rotation: [0.4, 0, -0.2] });
  // Head
  fb.addSphere([0, 1.82, 0], [0.21, 0.23, 0.21], materials.skin);

  // Indonesian Conical Straw Caping Hat
  fb.addCylinder([0, 2.05, 0], 0.02, 0.58, 0.34, materials.strawHat);

  // Traditional Hoe (Cangkul)
  fb.addCylinder([0, 0.9, 0.4], 0.03, 0.03, 1.4, materials.woodDark, { rotation: [-0.3, 0, 0] });
  // Iron hoe blade
  fb.addBox([0, 0.22, 0.65], [0.24, 0.32, 0.04], materials.metalDark, { rotation: [-0.65, 0, 0] });

  const fGeo = fb.toMergedGeometry();
  if (fGeo) {
    const fMesh = new THREE.Mesh(fGeo, vertexColorFamilies.matte);
    fMesh.castShadow = true;
    fMesh.receiveShadow = true;
    fMesh.matrixAutoUpdate = false;
    fMesh.updateMatrix();
    fGroup.add(fMesh);
  }

  // Farmer physics collider
  const farmerBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(farmerX, 1.2, farmerZ));
  world.createCollider(RAPIER.ColliderDesc.cylinder(1.0, 0.35), farmerBody);
  staticBodies.push(farmerBody);

  farmerNPC = { group: fGroup, clock: 0 };

  // =========================================================================
  // 5b. Farmer 2: Tani Tandur (Bending Down Planting Rice Seedlings in Plot 3)
  // =========================================================================
  const f2X = 32.5;
  const f2Y = 0.44;
  const f2Z = -36.5;
  const f2Group = new THREE.Group();
  f2Group.position.set(f2X, f2Y, f2Z);
  f2Group.rotation.y = 0.2;
  riceGroup.add(f2Group);

  const fb2 = new BatchCollector();
  // Rolled-up mud trousers
  fb2.addCylinder([-0.16, 0.36, -0.06], 0.12, 0.13, 0.54, materials.guardUniform, { rotation: [-0.15, 0, 0] });
  fb2.addCylinder([0.16, 0.36, -0.06], 0.12, 0.13, 0.54, materials.guardUniform, { rotation: [-0.15, 0, 0] });
  // Torso bending forward over the flooded paddy
  fb2.addBox([0, 0.90, 0.18], [0.56, 0.68, 0.36], materials.tunic, { rotation: [0.48, 0, 0] });
  fb2.addBox([0, 0.68, 0.06], [0.58, 0.12, 0.38], materials.coral, { rotation: [0.48, 0, 0] }); // Waist sash
  // Arms reaching down towards water planting rice seedlings
  fb2.addCylinder([-0.28, 0.72, 0.38], 0.08, 0.08, 0.56, materials.skin, { rotation: [0.85, 0, -0.15] });
  fb2.addCylinder([0.28, 0.72, 0.38], 0.08, 0.08, 0.56, materials.skin, { rotation: [0.85, 0, 0.15] });
  fb2.addSphere([-0.24, 0.46, 0.56], [0.07, 0.07, 0.07], materials.skin);
  fb2.addSphere([0.24, 0.46, 0.56], [0.07, 0.07, 0.07], materials.skin);
  // Bundles of green rice seedlings held in hands being planted into flooded soil
  for (const sx of [-0.24, 0.24]) {
    fb2.addCylinder([sx, 0.42, 0.60], 0.06, 0.06, 0.18, materials.foliageBright);
    for (const off of [-0.04, 0, 0.04]) {
      fb2.addCylinder([sx + off, 0.52, 0.60 + off], 0.012, 0.012, 0.22, materials.foliageBright, { rotation: [off * 3, 0, off * 2] });
    }
  }
  // Head tilted down toward paddy mud
  fb2.addSphere([0, 1.25, 0.38], [0.20, 0.22, 0.20], materials.skin);
  // Conical Indonesian Caping straw hat shielding from tropical sun
  fb2.addCylinder([0, 1.44, 0.42], 0.02, 0.58, 0.32, materials.strawHat, { rotation: [0.48, 0, 0] });

  const f2Geo = fb2.toMergedGeometry();
  if (f2Geo) {
    const f2Mesh = new THREE.Mesh(f2Geo, vertexColorFamilies.matte);
    f2Mesh.castShadow = true;
    f2Mesh.receiveShadow = true;
    f2Mesh.matrixAutoUpdate = false;
    f2Mesh.updateMatrix();
    f2Group.add(f2Mesh);
  }

  const f2Body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(f2X, f2Y + 0.8, f2Z));
  world.createCollider(RAPIER.ColliderDesc.cylinder(0.8, 0.35), f2Body);
  staticBodies.push(f2Body);
  extraFarmers.push({ group: f2Group, baseY: f2Y, clock: 0.5, speed: 2.4, amp: 0.012 });

  // =========================================================================
  // 5c. Farmer 3: Tani Pikulan (Carrying Harvested Rice Sheaves on Bund Path)
  // =========================================================================
  const f3X = 10.5;
  const f3Y = 0.32;
  const f3Z = -34.8;
  const f3Group = new THREE.Group();
  f3Group.position.set(f3X, f3Y, f3Z);
  f3Group.rotation.y = -1.1; // Striding along the earthen bund path
  riceGroup.add(f3Group);

  const fb3 = new BatchCollector();
  // Striding trousers & bare feet
  fb3.addCylinder([-0.16, 0.48, 0.12], 0.12, 0.13, 0.65, materials.guardUniform, { rotation: [0.2, 0, 0] });
  fb3.addCylinder([0.16, 0.48, -0.12], 0.12, 0.13, 0.65, materials.guardUniform, { rotation: [-0.2, 0, 0] });
  fb3.addBox([-0.16, 0.08, 0.18], [0.15, 0.15, 0.28], materials.skin);
  fb3.addBox([0.16, 0.08, -0.06], [0.15, 0.15, 0.28], materials.skin);
  // Light woven tunic shirt & crimson waist sash
  fb3.addBox([0, 1.25, 0], [0.58, 0.72, 0.38], materials.cream);
  fb3.addBox([0, 0.92, 0], [0.62, 0.12, 0.42], materials.coral);
  // Arms resting on the shoulder pole (pikulan)
  fb3.addCylinder([-0.28, 1.45, 0.15], 0.08, 0.08, 0.52, materials.skin, { rotation: [-0.3, 0, 0.3] });
  fb3.addCylinder([0.28, 1.45, 0.15], 0.08, 0.08, 0.52, materials.skin, { rotation: [-0.3, 0, -0.3] });
  fb3.addSphere([-0.22, 1.62, 0.28], [0.07, 0.07, 0.07], materials.skin);
  fb3.addSphere([0.22, 1.62, 0.28], [0.07, 0.07, 0.07], materials.skin);
  // Head & Caping
  fb3.addSphere([0, 1.82, 0], [0.21, 0.23, 0.21], materials.skin);
  fb3.addCylinder([0, 2.05, 0], 0.02, 0.58, 0.34, materials.strawHat);

  // Traditional Curved Bamboo Shoulder Yoke (Pikulan)
  fb3.addCylinder([0, 1.60, 0], 0.032, 0.032, 2.5, materials.woodWarm, { rotation: [Math.PI * 0.5, 0, 0] });
  // Twin Conical Woven Baskets suspended from pole ends filled with golden harvested rice
  for (const bz of [-1.15, 1.15]) {
    // Suspension jute cords
    fb3.addCylinder([0, 1.18, bz], 0.008, 0.008, 0.85, materials.woodDark);
    // Woven bamboo basket body
    fb3.addCylinder([0, 0.72, bz], 0.38, 0.22, 0.52, materials.strawHat, { segments: 14 });
    fb3.addCylinder([0, 0.96, bz], 0.40, 0.40, 0.04, materials.woodDark, { segments: 14 });
    // Overflowing bundles of golden ripe harvested rice grain (gabah)
    fb3.addSphere([0, 0.98, bz], [0.36, 0.22, 0.36], materials.hayGolden);
    for (const a of [0, 1.2, 2.4, 3.6, 4.8]) {
      fb3.addCylinder([Math.cos(a) * 0.22, 1.08, bz + Math.sin(a) * 0.22], 0.02, 0.04, 0.28, materials.hayGolden, { rotation: [Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3] });
    }
  }

  const f3Geo = fb3.toMergedGeometry();
  if (f3Geo) {
    const f3Mesh = new THREE.Mesh(f3Geo, vertexColorFamilies.matte);
    f3Mesh.castShadow = true;
    f3Mesh.receiveShadow = true;
    f3Mesh.matrixAutoUpdate = false;
    f3Mesh.updateMatrix();
    f3Group.add(f3Mesh);
  }

  const f3Body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(f3X, f3Y + 1.0, f3Z));
  world.createCollider(RAPIER.ColliderDesc.cylinder(1.0, 0.40), f3Body);
  staticBodies.push(f3Body);
  extraFarmers.push({ group: f3Group, baseY: f3Y, clock: 1.2, speed: 2.8, amp: 0.016 });

  // =========================================================================
  // 6. Northern World Perimeter Boundary Wall (z = -46.5)
  // =========================================================================
  const northBoundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(19.0, 1.5, -46.5));
  world.createCollider(RAPIER.ColliderDesc.cuboid(30.0, 1.5, 0.4), northBoundBody);
  staticBodies.push(northBoundBody);

  batch.build(riceGroup, true);

  return {
    group: riceGroup,
    update: (delta) => {
      if (farmerNPC) {
        farmerNPC.clock += delta;
        farmerNPC.group.position.y = 0.32 + Math.sin(farmerNPC.clock * 2.2) * 0.008;
      }
      for (const ef of extraFarmers) {
        ef.clock += delta;
        ef.group.position.y = ef.baseY + Math.sin(ef.clock * ef.speed) * ef.amp;
      }
    },
  };
}
