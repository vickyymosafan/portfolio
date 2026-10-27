import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector, mergeStaticHierarchy } from './geometry.js';

/**
 * Creates Zone E: Luxury Swimming Pool & Leisure Deck
 * Located West of the Mansion: x: [-33.0, -16.0], z: [4.0, -16.0]
 */
export function createPoolArea(scene, world, RAPIER, staticBodies) {
  const poolGroup = new THREE.Group();
  scene.add(poolGroup);
  const batch = new BatchCollector();

  const deckCenterX = -24.5;
  const deckCenterZ = -6.0;

  // 1. Recessed Travertine Stone Deck surrounding the pool basin
  // Pool dimensions: width 6.6m, length 12.0m, depth 1.4m
  const poolW = 6.6;
  const poolL = 12.0;

  // West deck slab (Sun lounger promenade): x: [-33.0, -27.8]
  const westDeckW = 5.2;
  const westDeckX = deckCenterX - poolW * 0.5 - westDeckW * 0.5; // -30.4
  batch.addBox([westDeckX, 0.08, deckCenterZ], [westDeckW, 0.16, 20.0], materials.foundation);
  batch.addBox([westDeckX, 0.165, deckCenterZ], [westDeckW, 0.02, 19.8], materials.stone);

  // East deck slab (Mansion walkway): x: [-21.2, -16.0]
  const eastDeckW = 5.2;
  const eastDeckX = deckCenterX + poolW * 0.5 + eastDeckW * 0.5; // -18.6
  batch.addBox([eastDeckX, 0.08, deckCenterZ], [eastDeckW, 0.16, 20.0], materials.foundation);
  batch.addBox([eastDeckX, 0.165, deckCenterZ], [eastDeckW, 0.02, 19.8], materials.stone);

  // North deck slab (Connecting front lawn): z: [0.0, 4.0]
  const northDeckD = 4.0;
  const northDeckZ = deckCenterZ + poolL * 0.5 + northDeckD * 0.5; // 2.0
  batch.addBox([deckCenterX, 0.08, northDeckZ], [poolW, 0.16, northDeckD], materials.foundation);
  batch.addBox([deckCenterX, 0.165, northDeckZ], [poolW, 0.02, northDeckD], materials.stone);

  // South deck slab (Cabana pavilion terrace): z: [-16.0, -12.0]
  const southDeckD = 4.0;
  const southDeckZ = deckCenterZ - poolL * 0.5 - southDeckD * 0.5; // -14.0
  batch.addBox([deckCenterX, 0.08, southDeckZ], [poolW, 0.16, southDeckD], materials.foundation);
  batch.addBox([deckCenterX, 0.165, southDeckZ], [poolW, 0.02, southDeckD], materials.stone);

  // Rapier physics colliders for the 4 surrounding deck platforms
  for (const [bx, bz, bw, bd] of [
    [westDeckX, deckCenterZ, westDeckW, 20.0],
    [eastDeckX, deckCenterZ, eastDeckW, 20.0],
    [deckCenterX, northDeckZ, poolW, northDeckD],
    [deckCenterX, southDeckZ, poolW, southDeckD],
  ]) {
    const dBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(bx, 0.08, bz)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(bw * 0.5, 0.08, bd * 0.5), dBody);
    staticBodies.push(dBody);
  }

  // 2. The Sunken Pool Basin
  // Pool Bottom Mosaic Tiles (y = -1.2)
  batch.addBox([deckCenterX, -1.2, deckCenterZ], [poolW, 0.1, poolL], materials.poolTile);

  // Pool Internal Basin Walls (North, South, East, West) with mosaic blue tile
  const wallH = 1.35;
  const wallY = -0.52;
  batch.addBox([deckCenterX, wallY, deckCenterZ - poolL * 0.5 - 0.08], [poolW + 0.36, wallH, 0.18], materials.poolTile);
  batch.addBox([deckCenterX, wallY, deckCenterZ + poolL * 0.5 + 0.08], [poolW + 0.36, wallH, 0.18], materials.poolTile);
  batch.addBox([deckCenterX - poolW * 0.5 - 0.08, wallY, deckCenterZ], [0.18, wallH, poolL + 0.36], materials.poolTile);
  batch.addBox([deckCenterX + poolW * 0.5 + 0.08, wallY, deckCenterZ], [0.18, wallH, poolL + 0.36], materials.poolTile);

  // Polished Stone Pool Coping Rim (White Bullnose edge framing pool opening)
  const copingW = 0.42;
  const copingH = 0.08;
  const copingY = 0.20;
  batch.addBox([deckCenterX, copingY, deckCenterZ - poolL * 0.5 - copingW * 0.5], [poolW + copingW * 2, copingH, copingW], materials.trim);
  batch.addBox([deckCenterX, copingY, deckCenterZ + poolL * 0.5 + copingW * 0.5], [poolW + copingW * 2, copingH, copingW], materials.trim);
  batch.addBox([deckCenterX - poolW * 0.5 - copingW * 0.5, copingY, deckCenterZ], [copingW, copingH, poolL], materials.trim);
  batch.addBox([deckCenterX + poolW * 0.5 + copingW * 0.5, copingY, deckCenterZ], [copingW, copingH, poolL], materials.trim);

  // Shallow End Underwater Entry Steps (North End: z = -0.6 to 0.0)
  for (let s = 0; s < 4; s += 1) {
    const stepY = 0.0 - s * 0.26;
    const stepZ = deckCenterZ + poolL * 0.5 - 0.4 - s * 0.48;
    batch.addBox([deckCenterX, stepY, stepZ], [poolW - 0.2, 0.26, 0.52], materials.poolTile);
  }

  // 3. Shimmering Turquoise Water Surface (elevated at y = 0.08, clearly visible)
  const waterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(poolW - 0.06, 0.04, poolL - 0.06),
    materials.poolWaterShimmer
  );
  waterMesh.position.set(deckCenterX, 0.08, deckCenterZ);
  waterMesh.receiveShadow = true;
  waterMesh.userData.keepSeparate = true;
  poolGroup.add(waterMesh);

  // Underwater LED Pool Lights emitting cool blue glow
  const poolLight = new THREE.PointLight(0x48cae4, 1.4, 7.5, 2.0);
  poolLight.position.set(deckCenterX, -0.4, deckCenterZ);
  poolGroup.add(poolLight);

  for (const lz of [-3.5, 0, 3.5]) {
    // Underwater fixture glass lens
    batch.addCylinder([deckCenterX - poolW * 0.5 + 0.05, -0.4, deckCenterZ + lz], 0.12, 0.12, 0.04, materials.chrome, { rotation: [0, 0, Math.PI * 0.5] });
    batch.addSphere([deckCenterX - poolW * 0.5 + 0.08, -0.4, deckCenterZ + lz], [0.08, 0.08, 0.08], materials.glow, { shadow: false });
  }

  // Chrome Pool Ladder at Deep End (South End)
  const ladderX = deckCenterX + poolW * 0.5 - 0.25;
  const ladderZ = deckCenterZ - poolL * 0.5 + 1.2;
  batch.addCylinder([ladderX - 0.24, 0.55, ladderZ], 0.025, 0.025, 1.6, materials.chrome);
  batch.addCylinder([ladderX + 0.24, 0.55, ladderZ], 0.025, 0.025, 1.6, materials.chrome);
  for (let r = 0; r < 3; r += 1) {
    batch.addCylinder([ladderX, 0.25 - r * 0.35, ladderZ], 0.02, 0.02, 0.48, materials.chrome, { rotation: [0, 0, Math.PI * 0.5] });
  }

  // 4. Teakwood Sun Loungers with Sage & Striped Cushions along West Promenade
  const loungerX = deckCenterX - 5.5; // x = -30.0
  const loungerZs = [deckCenterZ + 4.5, deckCenterZ + 1.5, deckCenterZ - 1.5, deckCenterZ - 4.5];

  for (let i = 0; i < loungerZs.length; i += 1) {
    const lz = loungerZs[i];
    const lounger = new THREE.Group();
    lounger.position.set(loungerX, 0.17, lz);
    lounger.rotation.y = Math.PI * 0.5; // facing East towards pool
    poolGroup.add(lounger);

    // Warm teak frame
    addBox(lounger, [0, 0.16, 0], [2.1, 0.1, 0.85], materials.woodWarm);
    addBox(lounger, [-0.95, 0.08, 0], [0.1, 0.16, 0.82], materials.woodDark);
    addBox(lounger, [0.95, 0.08, 0], [0.1, 0.16, 0.82], materials.woodDark);

    // Reclined backrest & plush cushion
    const cushionMat = i % 2 === 0 ? materials.mint : materials.coral;
    addBox(lounger, [0.2, 0.25, 0], [1.5, 0.08, 0.8], cushionMat);
    addBox(lounger, [-0.7, 0.42, 0], [0.65, 0.08, 0.8], cushionMat, { rotation: [0, 0, 0.32] });

    // Rolled resort pool towel
    addCylinder(lounger, [-0.85, 0.58, 0], 0.09, 0.09, 0.65, materials.cushionYellow, { rotation: [Math.PI * 0.5, 0, 0] });

    // Cocktail side table between pairs
    if (i % 2 === 0) {
      const tableZ = lz - 1.5;
      batch.addCylinder([loungerX, 0.36, tableZ], 0.36, 0.36, 0.06, materials.woodDark, { segments: 16 });
      batch.addCylinder([loungerX, 0.24, tableZ], 0.06, 0.06, 0.30, materials.woodDark);
      // Tropical cocktail glass with straw & lemon slice
      batch.addCylinder([loungerX, 0.45, tableZ], 0.06, 0.05, 0.14, materials.glass, { segments: 12 });
      batch.addCylinder([loungerX, 0.44, tableZ], 0.055, 0.045, 0.11, materials.coral, { segments: 12 });
      batch.addCylinder([loungerX, 0.54, tableZ], 0.008, 0.008, 0.18, materials.yellowSun, { rotation: [0.2, 0, 0] });
      // Designer sunglasses
      batch.addBox([loungerX, 0.40, tableZ + 0.14], [0.12, 0.03, 0.06], materials.metalDark);
    }

    // Collider for lounger
    const lBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(loungerX, 0.3, lz)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.25, 1.1), lBody);
    staticBodies.push(lBody);
  }

  // 5. Luxury Resort Striped Cantilever Umbrellas
  const umbrellaZs = [deckCenterZ + 3.0, deckCenterZ - 3.0];
  for (let idx = 0; idx < umbrellaZs.length; idx += 1) {
    const uz = umbrellaZs[idx];
    const ux = loungerX - 1.2;
    // Heavy granite cast base
    batch.addCylinder([ux, 0.22, uz], 0.45, 0.45, 0.10, materials.metalDark, { segments: 16 });
    // Offset arched matte-black mast
    batch.addCylinder([ux, 1.7, uz], 0.05, 0.05, 3.0, materials.metalDark);
    batch.addCylinder([ux + 0.6, 3.2, uz], 0.04, 0.04, 1.4, materials.metalDark, { rotation: [0, 0, -Math.PI * 0.3] });
    // Octagonal striped canvas canopy
    const umbrellaMat = idx === 0 ? materials.umbrellaStriped : materials.umbrellaYellowStriped;
    batch.addCylinder([ux + 1.1, 3.4, uz], 0.15, 2.0, 0.55, umbrellaMat, { segments: 8 });
    batch.addSphere([ux + 1.1, 3.72, uz], [0.1, 0.1, 0.1], materials.brass, { shadow: false });
  }

  // 6. Luxury Pool Cabana / Shaded Timber Pergola (South Deck, z: [-12.5, -15.5])
  const cabanaX = deckCenterX;
  const cabanaZ = deckCenterZ - 7.5; // z = -13.5
  const cabanaW = 7.5;
  const cabanaD = 3.6;

  // 4 Robust Cedar Columns
  for (const cx of [-cabanaW * 0.5 + 0.3, cabanaW * 0.5 - 0.3]) {
    for (const cz of [-cabanaD * 0.5 + 0.3, cabanaD * 0.5 - 0.3]) {
      batch.addBox([cabanaX + cx, 1.7, cabanaZ + cz], [0.28, 3.2, 0.28], materials.woodDark);
    }
  }

  // Horizontal Pergola Beams & Slatted Warm Cedar Rafters
  batch.addBox([cabanaX, 3.35, cabanaZ - cabanaD * 0.5 + 0.3], [cabanaW + 0.6, 0.22, 0.18], materials.woodDark);
  batch.addBox([cabanaX, 3.35, cabanaZ + cabanaD * 0.5 - 0.3], [cabanaW + 0.6, 0.22, 0.18], materials.woodDark);
  for (let bx = -cabanaW * 0.5; bx <= cabanaW * 0.5; bx += 0.75) {
    batch.addBox([cabanaX + bx, 3.5, cabanaZ], [0.12, 0.18, cabanaD + 0.6], materials.woodWarm);
  }

  // Modern Outdoor Ceiling Fan in Cabana
  batch.addCylinder([cabanaX, 3.25, cabanaZ], 0.03, 0.03, 0.4, materials.metalDark);
  batch.addCylinder([cabanaX, 3.05, cabanaZ], 0.22, 0.22, 0.08, materials.metalDark, { segments: 12 });
  for (let f = 0; f < 4; f += 1) {
    const fAngle = (f / 4) * Math.PI * 2;
    batch.addBox(
      [cabanaX + Math.cos(fAngle) * 0.7, 3.05, cabanaZ + Math.sin(fAngle) * 0.7],
      [1.1, 0.02, 0.2],
      materials.woodDark,
      { rotation: [0, -fAngle, 0.12] }
    );
  }

  // L-Shaped Cabana Outdoor Lounge Sofa with plush cushions
  const cabanaSofa = new THREE.Group();
  cabanaSofa.position.set(cabanaX, 0.18, cabanaZ);
  poolGroup.add(cabanaSofa);
  // Main back sofa bench
  addBox(cabanaSofa, [0, 0.45, -0.9], [5.2, 0.6, 0.9], materials.woodDark);
  addBox(cabanaSofa, [0, 0.85, -1.25], [5.2, 0.65, 0.25], materials.woodDark);
  addBox(cabanaSofa, [0, 0.55, -0.85], [5.0, 0.2, 0.8], materials.cream);
  // Side lounge return
  addBox(cabanaSofa, [-2.0, 0.45, 0], [1.2, 0.6, 1.4], materials.woodDark);
  addBox(cabanaSofa, [-2.0, 0.55, 0], [1.1, 0.2, 1.3], materials.cream);

  // Decorative throw cushions on cabana sofa
  addBox(cabanaSofa, [-1.8, 0.75, -0.75], [0.42, 0.42, 0.18], materials.cushionCoral, { rotation: [0.1, 0.3, 0] });
  addBox(cabanaSofa, [-0.5, 0.75, -0.75], [0.42, 0.42, 0.18], materials.cushionYellow, { rotation: [0.1, -0.2, 0] });
  addBox(cabanaSofa, [1.5, 0.75, -0.75], [0.42, 0.42, 0.18], materials.mint, { rotation: [0.1, 0.15, 0] });

  // Cabana Low Teak Coffee Table
  batch.addBox([cabanaX + 0.5, 0.42, cabanaZ], [2.2, 0.38, 1.1], materials.woodWarm);
  // Architectural candle lantern on coffee table
  batch.addBox([cabanaX + 0.2, 0.65, cabanaZ], [0.22, 0.32, 0.22], materials.metalDark);
  batch.addBox([cabanaX + 0.2, 0.65, cabanaZ], [0.18, 0.28, 0.18], materials.glass);
  batch.addSphere([cabanaX + 0.2, 0.62, cabanaZ], [0.06, 0.08, 0.06], materials.glow, { shadow: false });

  // Red and white lifebuoy ring hanging on front cabana column
  const buoyX = cabanaX + cabanaW * 0.5 - 0.3;
  const buoyZ = cabanaZ + cabanaD * 0.5 - 0.14;
  batch.addCylinder([buoyX, 1.8, buoyZ], 0.32, 0.32, 0.08, materials.coral, { segments: 16, rotation: [Math.PI * 0.5, 0, 0] });
  batch.addCylinder([buoyX, 1.8, buoyZ], 0.18, 0.18, 0.09, materials.stone, { segments: 16, rotation: [Math.PI * 0.5, 0, 0] });

  // Cabana Collider
  const cabanaBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(cabanaX, 1.0, cabanaZ)
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(cabanaW * 0.5, 1.0, cabanaD * 0.5), cabanaBody);
  staticBodies.push(cabanaBody);

  // 7. Outdoor Pool Shower Column (East Deck)
  const showerX = deckCenterX + 6.5; // x = -18.0
  const showerZ = deckCenterZ + 4.5;
  // Teak slatted duckboard
  batch.addBox([showerX, 0.2, showerZ], [1.2, 0.06, 1.2], materials.woodDark);
  // Chrome shower mast & rain shower head
  batch.addCylinder([showerX, 1.4, showerZ - 0.4], 0.04, 0.04, 2.5, materials.chrome);
  batch.addCylinder([showerX, 2.65, showerZ - 0.1], 0.03, 0.03, 0.6, materials.chrome, { rotation: [Math.PI * 0.5, 0, 0] });
  batch.addCylinder([showerX, 2.55, showerZ + 0.1], 0.18, 0.18, 0.04, materials.chrome);

  // 8. Tropical Potted Fan Palms on Deck Corners
  const palmCorners = [
    [deckCenterX - 7.5, deckCenterZ + 9.0],
    [deckCenterX + 7.5, deckCenterZ + 9.0],
    [deckCenterX - 7.5, deckCenterZ - 9.0],
    [deckCenterX + 7.5, deckCenterZ - 9.0],
  ];
  for (const [px, pz] of palmCorners) {
    batch.addCylinder([px, 0.5, pz], 0.45, 0.35, 0.85, materials.ceramicTerracotta, { segments: 16 });
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const lx = px + Math.cos(angle) * 0.5;
      const lz = pz + Math.sin(angle) * 0.5;
      batch.addSphere([lx, 1.4 + (i % 2) * 0.2, lz], [0.45, 0.2, 0.45], materials.foliageBright);
    }
  }

  batch.build(poolGroup, true);
  mergeStaticHierarchy(poolGroup);
  return { poolGroup, waterMesh };
}
