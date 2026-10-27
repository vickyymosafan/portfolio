import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector, mergeStaticHierarchy } from './geometry.js';

/**
 * Creates Zone F: Private Zen Garden, Waterfall Koi Pond, Arched Footbridge & Tea Gazebo
 * Located East of the Mansion: x: [27.0, 42.0], z: [3.0, -18.0]
 */
export function createZenGarden(scene, world, RAPIER, staticBodies) {
  const zenGroup = new THREE.Group();
  scene.add(zenGroup);
  const batch = new BatchCollector();

  // 1. Natural Granite Waterfall (Northeast Corner: x = 36.5, z = -14.0)
  const wfX = 36.5;
  const wfZ = -14.0;

  // Stacked rugged granite boulders forming the waterfall rock face
  const boulderSpecs = [
    // Base tier
    { x: wfX - 1.8, y: 0.9, z: wfZ, sx: 2.2, sy: 1.8, sz: 2.0 },
    { x: wfX + 1.6, y: 1.1, z: wfZ, sx: 2.4, sy: 2.2, sz: 2.2 },
    { x: wfX, y: 0.8, z: wfZ - 1.4, sx: 3.2, sy: 1.6, sz: 2.0 },
    // Mid tier
    { x: wfX - 0.9, y: 2.1, z: wfZ - 0.4, sx: 2.0, sy: 1.6, sz: 1.8 },
    { x: wfX + 0.9, y: 2.3, z: wfZ - 0.3, sx: 2.2, sy: 1.7, sz: 1.8 },
    // High crest
    { x: wfX, y: 3.2, z: wfZ - 0.8, sx: 2.4, sy: 1.4, sz: 1.6 },
  ];

  for (const b of boulderSpecs) {
    batch.addSphere([b.x, b.y, b.z], [b.sx * 0.5, b.sy * 0.5, b.sz * 0.5], materials.graniteRock, {
      rotation: [0.2, (b.x + b.z) * 0.5, 0.1],
    });
  }

  // Cascading water sheets over rock ledges
  batch.addBox([wfX, 2.5, wfZ + 0.3], [1.4, 0.1, 0.8], materials.waterfallPond, { rotation: [0.45, 0, 0] });
  batch.addBox([wfX, 1.4, wfZ + 0.6], [1.8, 0.1, 1.1], materials.waterfallPond, { rotation: [0.55, 0, 0] });
  // White foaming water lip
  batch.addBox([wfX, 1.35, wfZ + 1.1], [1.9, 0.08, 0.15], materials.cream);

  // Waterfall rock collider
  const rockBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(wfX, 1.8, wfZ)
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.8, 1.8, 2.0), rockBody);
  staticBodies.push(rockBody);

  // 2. Tranquil Koi Pond with Lily Pads (center: x = 34.5, z = -9.0)
  const pondX = 34.5;
  const pondZ = -9.0;
  const pondW = 7.5;
  const pondL = 8.5;

  // Pond water surface
  const pondMesh = new THREE.Mesh(
    new THREE.BoxGeometry(pondW, 0.05, pondL),
    materials.waterfallPond
  );
  pondMesh.position.set(pondX, 0.02, pondZ);
  pondMesh.receiveShadow = true;
  zenGroup.add(pondMesh);

  // Natural warm river stones bordering the koi pond
  const stoneBorderCount = 28;
  for (let i = 0; i < stoneBorderCount; i += 1) {
    const angle = (i / stoneBorderCount) * Math.PI * 2;
    const rx = (pondW * 0.5 + 0.35 + ((i % 3) * 0.15)) * Math.cos(angle);
    const rz = (pondL * 0.5 + 0.35 + ((i % 4) * 0.15)) * Math.sin(angle);
    batch.addSphere([pondX + rx, 0.12, pondZ + rz], [0.38, 0.22, 0.35], materials.stoneWarm, {
      rotation: [0, angle + 0.3, 0],
    });
  }

  // Floating water lilies & lotus blossoms
  const lilyCoords = [
    [pondX - 1.8, pondZ - 1.2],
    [pondX - 1.2, pondZ - 1.6],
    [pondX + 1.4, pondZ - 2.2],
    [pondX + 2.0, pondZ + 1.5],
  ];
  for (const [lx, lz] of lilyCoords) {
    // Green pad
    batch.addCylinder([lx, 0.05, lz], 0.32, 0.32, 0.02, materials.foliageBright, { segments: 12 });
    // Lotus flower
    batch.addSphere([lx, 0.12, lz], [0.12, 0.14, 0.12], materials.pinkRose);
  }

  // Japanese Nishikigoi (Orange & Gold swimming koi fish in the pond)
  const koiCoords = [
    { x: pondX - 0.8, z: pondZ - 0.5, rot: 0.6 },
    { x: pondX + 1.1, z: pondZ - 1.0, rot: -1.2 },
    { x: pondX + 0.4, z: pondZ + 1.8, rot: 2.1 },
  ];
  for (const k of koiCoords) {
    // Slender fish body
    batch.addSphere([k.x, -0.05, k.z], [0.18, 0.08, 0.08], materials.coral, { rotation: [0, k.rot, 0] });
    batch.addSphere([k.x, -0.05, k.z + 0.06], [0.08, 0.04, 0.04], materials.yellowSun, { rotation: [0, k.rot, 0] });
  }

  // 3. Arched Wooden Japanese Footbridge (center: x = 34.5, z = -7.5)
  const bridgeX = pondX;
  const bridgeZ = pondZ + 2.5;

  // Curved deck planks
  const bridgeLength = 4.2;
  const bridgeWidth = 1.8;
  for (let b = 0; b < 14; b += 1) {
    const t = (b / 13) - 0.5; // -0.5 to 0.5
    const bz = bridgeZ + t * bridgeLength;
    const archH = 0.42 * (1.0 - (t * 2) ** 2);
    batch.addBox([bridgeX, 0.22 + archH, bz], [bridgeWidth, 0.08, 0.28], materials.woodWarm);
  }

  // Arched Coral-Red Lacquered Handrails & Posts
  for (const side of [-1, 1]) {
    const bx = bridgeX + side * (bridgeWidth * 0.5 - 0.08);
    // Vertical posts
    for (let p = -1.8; p <= 1.8; p += 0.9) {
      const pt = p / (bridgeLength * 0.5);
      const postArchY = 0.42 * (1.0 - (pt * 0.5) ** 2);
      batch.addBox([bx, 0.65 + postArchY, bridgeZ + p], [0.1, 0.85, 0.1], materials.coralDark);
      batch.addSphere([bx, 1.1 + postArchY, bridgeZ + p], [0.08, 0.08, 0.08], materials.brass, { shadow: false });
    }
    // Continuous curved top rail
    batch.addBox([bx, 1.05, bridgeZ], [0.08, 0.1, bridgeLength + 0.2], materials.coralDark);
  }

  // Bridge Walkable Physics Collider
  const bridgeBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(bridgeX, 0.25, bridgeZ)
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(bridgeWidth * 0.5, 0.2, bridgeLength * 0.5), bridgeBody);
  staticBodies.push(bridgeBody);

  // 4. Traditional Hexagonal Tea Gazebo / Pavilion (x = 34.0, z = -1.5)
  const gazeboX = 34.0;
  const gazeboZ = -1.5;
  const gazeboRadius = 3.2;

  // Hexagonal stone foundation podium
  batch.addCylinder([gazeboX, 0.18, gazeboZ], gazeboRadius, gazeboRadius + 0.2, 0.36, materials.stoneWarm, { segments: 6 });

  // 6 Robust Cedar Wood Columns & Properly Aligned Wrap-Around Benches
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const px = gazeboX + Math.cos(angle) * (gazeboRadius - 0.35);
    const pz = gazeboZ + Math.sin(angle) * (gazeboRadius - 0.35);
    batch.addBox([px, 1.85, pz], [0.22, 3.2, 0.22], materials.woodDark);

    // Perimeter wooden seating bench between columns (leave side 3 open for entrance)
    if (i !== 3) {
      const nextAngle = ((i + 1) / 6) * Math.PI * 2;
      const x1 = Math.cos(angle) * (gazeboRadius - 0.4);
      const z1 = Math.sin(angle) * (gazeboRadius - 0.4);
      const x2 = Math.cos(nextAngle) * (gazeboRadius - 0.4);
      const z2 = Math.sin(nextAngle) * (gazeboRadius - 0.4);

      const mx = gazeboX + (x1 + x2) * 0.5;
      const mz = gazeboZ + (z1 + z2) * 0.5;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const bLen = Math.hypot(dx, dz);
      // Tangent angle so box length aligns perfectly along edge
      const edgeAngle = Math.atan2(-dz, dx);

      // Bench seat plank
      batch.addBox([mx, 0.55, mz], [bLen - 0.25, 0.08, 0.42], materials.woodWarm, {
        rotation: [0, edgeAngle, 0],
      });
      // Bench backrest
      batch.addBox([mx, 0.95, mz], [bLen - 0.25, 0.42, 0.08], materials.woodDark, {
        rotation: [0, edgeAngle, 0],
      });
    }
  }

  // Flared Pagoda Hip Roof (Dark charred cedar shingles with brass finial)
  batch.addCylinder([gazeboX, 3.7, gazeboZ], 0.6, gazeboRadius + 0.6, 0.7, materials.gazeboRoof, { segments: 6 });
  batch.addCylinder([gazeboX, 4.3, gazeboZ], 0.15, 1.4, 0.6, materials.gazeboRoof, { segments: 6 });
  batch.addSphere([gazeboX, 4.75, gazeboZ], [0.18, 0.28, 0.18], materials.brass, { shadow: false });

  // Hanging corner brass wind chimes (furin)
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const cx = gazeboX + Math.cos(angle) * (gazeboRadius + 0.5);
    const cz = gazeboZ + Math.sin(angle) * (gazeboRadius + 0.5);
    batch.addCylinder([cx, 3.3, cz], 0.01, 0.01, 0.35, materials.brass);
    batch.addCylinder([cx, 3.1, cz], 0.04, 0.04, 0.08, materials.brass, { segments: 8 });
  }

  // Central low tea table with ceramic teapot & teacups
  batch.addCylinder([gazeboX, 0.46, gazeboZ], 0.65, 0.65, 0.08, materials.woodDark, { segments: 16 });
  batch.addCylinder([gazeboX, 0.25, gazeboZ], 0.12, 0.12, 0.42, materials.woodDark);
  batch.addSphere([gazeboX, 0.58, gazeboZ], [0.14, 0.12, 0.14], materials.metalDark); // cast iron teapot
  batch.addCylinder([gazeboX + 0.3, 0.54, gazeboZ], 0.06, 0.05, 0.08, materials.cream, { segments: 12 }); // teacup
  batch.addCylinder([gazeboX - 0.25, 0.54, gazeboZ + 0.2], 0.06, 0.05, 0.08, materials.cream, { segments: 12 });

  // Gazebo Physics Collider
  const gazeboBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(gazeboX, 1.5, gazeboZ)
  );
  world.createCollider(RAPIER.ColliderDesc.cylinder(1.5, gazeboRadius), gazeboBody);
  staticBodies.push(gazeboBody);

  // 5. Flowering Japanese Cherry Blossom (Sakura) Trees
  const sakuraCoords = [
    { x: 30.2, z: -3.5, scale: 1.15 },
    { x: 38.5, z: -8.0, scale: 1.25 },
  ];

  for (const s of sakuraCoords) {
    // Gnarled dark trunk
    batch.addCylinder([s.x, 1.2 * s.scale, s.z], 0.24 * s.scale, 0.38 * s.scale, 2.4 * s.scale, materials.bark);
    batch.addCylinder([s.x - 0.4 * s.scale, 2.4 * s.scale, s.z + 0.3 * s.scale], 0.14 * s.scale, 0.2 * s.scale, 1.4 * s.scale, materials.bark, { rotation: [0.4, 0, 0.5] });
    batch.addCylinder([s.x + 0.4 * s.scale, 2.5 * s.scale, s.z - 0.3 * s.scale], 0.13 * s.scale, 0.18 * s.scale, 1.3 * s.scale, materials.bark, { rotation: [-0.3, 0, -0.45] });

    // Puffy Pink Sakura Canopies
    const sakuraSpheres = [
      [-0.8, 2.6, 0.4, 1.1],
      [0.8, 2.8, -0.3, 1.15],
      [0, 3.4, 0, 1.35],
      [-0.4, 3.8, -0.2, 0.95],
      [0.4, 3.7, 0.3, 0.98],
    ];
    for (const [ox, oy, oz, sr] of sakuraSpheres) {
      batch.addSphere(
        [s.x + ox * s.scale, oy * s.scale, s.z + oz * s.scale],
        [sr * s.scale, sr * 0.75 * s.scale, sr * s.scale],
        materials.sakuraBlossom
      );
    }

    // Trunk collider
    const sakuraBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(s.x, 1.2 * s.scale, s.z)
    );
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.2 * s.scale, 0.45 * s.scale), sakuraBody);
    staticBodies.push(sakuraBody);
  }

  // 6. Traditional Carved Granite Toro Stone Lanterns
  const toroPositions = [
    [31.0, -1.0],
    [37.5, -5.0],
    [32.0, -12.5],
  ];
  for (const [tx, tz] of toroPositions) {
    batch.addBox([tx, 0.15, tz], [0.55, 0.3, 0.55], materials.stoneWarm);
    batch.addCylinder([tx, 0.6, tz], 0.12, 0.16, 0.7, materials.stoneWarm);
    batch.addBox([tx, 1.0, tz], [0.65, 0.12, 0.65], materials.stoneWarm);
    batch.addBox([tx, 1.22, tz], [0.42, 0.34, 0.42], materials.woodEspresso);
    batch.addSphere([tx, 1.22, tz], [0.1, 0.1, 0.1], materials.glow, { shadow: false });
    // Pagoda lantern roof
    batch.addCylinder([tx, 1.48, tz], 0.08, 0.75, 0.22, materials.stoneWarm, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });
    batch.addSphere([tx, 1.64, tz], [0.08, 0.08, 0.08], materials.stoneWarm);

  }

  const toroLight = new THREE.PointLight(0xffdf99, 0.9, 6.5, 2.0);
  toroLight.position.set(34.0, 1.35, -6.0);
  zenGroup.add(toroLight);

  batch.build(zenGroup, true);
  mergeStaticHierarchy(zenGroup);
  return zenGroup;
}
