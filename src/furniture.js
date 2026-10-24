import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, BatchCollector } from './geometry.js';
import { createSignTexture, createPaintingTexture } from './textures.js';
import { portfolio } from './portfolio.js';

function addFurnitureCollider(world, RAPIER, staticBodies, position, halfExtents) {
  if (!world || !RAPIER || !staticBodies) return null;
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(position[0], position[1], position[2])
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(halfExtents[0], halfExtents[1], halfExtents[2]),
    body
  );
  staticBodies.push(body);
  return body;
}

export function createRoomInteriors(building, interactionPoints, openDetailsCallback, world, RAPIER, staticBodies) {
  // 6 Spacious Room Bays (Footprint per room: 10.4m wide x 7.6m deep)
  const roomSpecs = [
    { id: 'about', x: -8.5, z: -0.2, title: 'Beyond the Code', subtitle: 'CHAPTER 01 · ABOUT ME', accent: palette.coral, rugMat: materials.coral },
    { id: 'skills', x: 8.5, z: -0.2, title: 'The Engineering Workshop', subtitle: 'CHAPTER 04 · SKILLS & TOOLS', accent: palette.blueSky, rugMat: materials.blue },
    { id: 'experience', x: -8.5, z: -8.3, title: 'The Engineering Journey', subtitle: 'STORY & MILESTONES', accent: palette.yellowSun, rugMat: materials.yellow },
    { id: 'projects', x: 8.5, z: -8.3, title: 'The Artifact Gallery', subtitle: 'CHAPTER 03 · PROJECTS', accent: palette.pinkRose, rugMat: materials.pink },
    { id: 'process', x: -8.5, z: -16.1, title: 'Blueprint to Deployment', subtitle: 'CHAPTER 02 · PROCESS', accent: palette.mintSage, rugMat: materials.mint },
    { id: 'contact', x: 8.5, z: -16.1, title: 'The Final Scene', subtitle: 'COME SAY HELLO', accent: palette.coral, rugMat: materials.terraceTiles },
  ];

  for (let i = 0; i < roomSpecs.length; i += 1) {
    const spec = roomSpecs[i];
    // Generous custom area rug (10.2m x 7.2m)
    addBox(building, [spec.x, -0.005, spec.z], [10.2, 0.03, 7.2], spec.rugMat, { receive: true, shadow: false });

    // Decorative wall baseboard along outer perimeter
    const wallX = spec.x < 0 ? -13.65 : 13.65;
    addBox(building, [wallX, 0.22, spec.z], [0.12, 0.44, 7.2], materials.trim);

    // Presentation Display Board (Mounted on back partition wall, elevated to y = 2.85)
    createDisplayBoard(building, spec);

    // Room-specific furnishings with generous clearance and solid physics colliders
    buildRoomFurniture(building, spec, world, RAPIER, staticBodies);

    // Interactive glowing floor beacon placed naturally on the rug
    const beaconX = spec.x + (spec.x < 0 ? 1.8 : -1.8);
    const beaconZ = spec.z - 0.4;
    createFloorBeacon(building, beaconX, beaconZ, spec.accent);

    // Register interaction point
    const roomInfo = portfolio.rooms.find((r) => r.id === spec.id);
    interactionPoints.push({
      id: spec.id,
      title: roomInfo ? roomInfo.title : spec.subtitle,
      position: new THREE.Vector3(beaconX, 0.9, beaconZ),
      radius: 4.5,
      action: () => openDetailsCallback(spec.id),
      getLabel: () => `Explore ${roomInfo ? roomInfo.title : spec.subtitle}`,
    });
  }
}

function createFloorBeacon(parent, x, z, colorHex) {
  const beacon = new THREE.Group();
  beacon.position.set(x, 0.025, z);
  parent.add(beacon);

  const ringGeo = new THREE.RingGeometry(0.48, 0.68, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI * 0.5;
  beacon.add(ring);

  const centerDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 16),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
  );
  centerDisc.rotation.x = -Math.PI * 0.5;
  beacon.add(centerDisc);
}

function createDisplayBoard(parent, room) {
  const { x, z, title, subtitle, accent } = room;
  // Mount display board securely against the back partition wall (leaving 4.5m of open clearance in front)
  const backZ = z - 3.82;

  const display = new THREE.Group();
  display.position.set(x, 0, backZ + 0.16);
  parent.add(display);

  // Elevated easel & frame stand (center at y = 3.0 so board is comfortably above foreground)
  addBox(display, [0, 3.0, 0], [4.0, 2.3, 0.16], materials.woodDark);
  addBox(display, [0, 1.7, 0.25], [3.7, 0.14, 0.55], materials.woodWarm);
  addBox(display, [-1.55, 0.84, 0.3], [0.18, 1.7, 0.18], materials.woodDark);
  addBox(display, [1.55, 0.84, 0.3], [0.18, 1.7, 0.18], materials.woodDark);

  // High-resolution typeset canvas sign
  const signTex = createSignTexture(title, subtitle, accent, 512, 340);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.78, 2.1),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45, metalness: 0.05 })
  );
  signMesh.position.set(0, 3.0, 0.095);
  display.add(signMesh);

  // Brass picture lamp over board
  addBox(display, [0, 4.28, 0.3], [2.0, 0.08, 0.18], materials.brass);
  addSphere(display, [0, 4.2, 0.3], [0.18, 0.07, 0.18], materials.glow, { shadow: false });
}

function buildRoomFurniture(parent, room, world, RAPIER, staticBodies) {
  const { x, z, id } = room;

  if (id === 'about') {
    // ==========================================
    // 1. LIVING ROOM: Sectional sofa in front corner, fireplace on outer wall, coffee table
    // Keeps the 3.2m entrance doorway (at x = -3.4 to -6.4) and center floor 100% CLEAR!
    // ==========================================
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(x + 2.2, 0, z + 2.2);
    parent.add(sofaGroup);
    addBox(sofaGroup, [0, 0.42, 0], [3.8, 0.45, 1.15], materials.coral);
    addBox(sofaGroup, [0, 0.95, -0.42], [3.8, 0.65, 0.32], materials.coral);
    addBox(sofaGroup, [-1.85, 0.65, 0], [0.35, 0.6, 1.15], materials.coral);
    addBox(sofaGroup, [1.5, 0.42, 0.95], [1.1, 0.45, 1.1], materials.coral);
    addBox(sofaGroup, [1.95, 0.65, 0.95], [0.3, 0.6, 1.1], materials.coral);
    addBox(sofaGroup, [-1.3, 0.8, -0.22], [0.45, 0.45, 0.22], materials.cushionYellow, { rotation: [0.1, 0.2, 0] });
    addBox(sofaGroup, [0.9, 0.8, -0.22], [0.45, 0.45, 0.22], materials.cushionMint, { rotation: [0.1, -0.2, 0] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.2, 0.48, z + 2.2], [1.9, 0.48, 0.6]);

    // Round wooden coffee table with ceramic tea set
    addCylinder(parent, [x + 1.8, 0.45, z + 0.8], 0.95, 0.95, 0.1, materials.woodWarm, { segments: 24 });
    addCylinder(parent, [x + 1.8, 0.2, z + 0.8], 0.16, 0.28, 0.4, materials.woodDark, { segments: 12 });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 1.8, 0.25, z + 0.8], [0.95, 0.25, 0.95]);
    // Ceramic Teapot & Cups
    addSphere(parent, [x + 1.95, 0.58, z + 0.72], [0.12, 0.11, 0.12], materials.ceramicTeal);
    addSphere(parent, [x + 1.95, 0.68, z + 0.72], [0.035, 0.035, 0.035], materials.brass, { shadow: false });
    addCylinder(parent, [x + 1.7, 0.55, z + 0.9], 0.06, 0.05, 0.09, materials.ceramic, { segments: 12 });
    addCylinder(parent, [x + 1.85, 0.55, z + 0.95], 0.06, 0.05, 0.09, materials.ceramic, { segments: 12 });
    // Hardcover book stack
    addBox(parent, [x + 1.5, 0.52, z + 0.65], [0.35, 0.06, 0.45], materials.blue, { rotation: [0, 0.25, 0] });

    // Stone Fireplace along outer left wall (x = -13.5)
    const fp = new THREE.Group();
    fp.position.set(x - 4.9, 0, z);
    parent.add(fp);
    addBox(fp, [0, 1.4, 0], [0.95, 2.8, 2.8], materials.wainscot);
    addBox(fp, [0.08, 1.0, 0], [0.85, 1.6, 1.8], materials.metalDark);
    addBox(fp, [0.05, 2.85, 0], [1.15, 0.18, 3.1], materials.woodDark);
    addCylinder(fp, [0.12, 0.32, -0.25], 0.1, 0.1, 0.8, materials.bark, { rotation: [0, 0.4, Math.PI * 0.5] });
    addCylinder(fp, [0.12, 0.32, 0.25], 0.1, 0.1, 0.8, materials.bark, { rotation: [0, -0.4, Math.PI * 0.5] });
    addSphere(fp, [0.15, 0.55, 0], [0.26, 0.38, 0.26], materials.fire, { shadow: false });
    addSphere(fp, [0.15, 0.52, 0], [0.45, 0.3, 0.45], materials.glow, { shadow: false });
    addBox(fp, [0.05, 3.12, -0.75], [0.08, 0.38, 0.48], materials.woodLight);
    addBox(fp, [0.05, 3.1, 0.75], [0.14, 0.32, 0.32], materials.brass);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.9, 1.4, z], [0.55, 1.4, 1.45]);

    // Framed Landscape Artwork above sofa on outer wall
    const landscapeArt = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.2),
      new THREE.MeshStandardMaterial({ map: createPaintingTexture('landscape'), roughness: 0.4 })
    );
    landscapeArt.position.set(x - 5.08, 2.65, z + 2.0);
    landscapeArt.rotation.y = Math.PI * 0.5;
    parent.add(landscapeArt);
    addBox(parent, [x - 5.1, 2.65, z + 2.0], [0.06, 1.34, 1.94], materials.woodDark);

    // Large Potted Fiddle-Leaf Fig Tree in outer corner
    addCylinder(parent, [x - 4.6, 0.48, z + 2.8], 0.48, 0.38, 0.95, materials.ceramicTerracotta, { segments: 16 });
    addCylinder(parent, [x - 4.6, 1.4, z + 2.8], 0.08, 0.1, 1.1, materials.bark);
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      const lx = x - 4.6 + Math.cos(angle) * 0.45;
      const lz = z + 2.8 + Math.sin(angle) * 0.45;
      const ly = 1.6 + (i % 3) * 0.3;
      addSphere(parent, [lx, ly, lz], [0.38, 0.24, 0.38], materials.foliageBright);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.6, 0.6, z + 2.8], [0.48, 0.6, 0.48]);
  } else if (id === 'skills') {
    // ==========================================
    // 2. HOME OFFICE: Workstation desk along outer right window wall, triple monitors, bookshelf
    // ==========================================
    addBox(parent, [x + 4.2, 0.95, z], [1.6, 0.16, 4.4], materials.woodWarm);
    addBox(parent, [x + 4.2, 0.48, z - 2.0], [1.4, 0.95, 0.22], materials.metalDark);
    addBox(parent, [x + 4.2, 0.48, z + 2.0], [1.4, 0.95, 0.22], materials.metalDark);
    addBox(parent, [x + 4.2, 1.04, z], [1.0, 0.02, 3.0], materials.ink);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 4.2, 0.55, z], [0.8, 0.55, 2.2]);

    // Triple monitor curved setup along the desk
    for (const dz of [-1.15, 0, 1.15]) {
      const angle = dz === 0 ? 0 : dz > 0 ? 0.18 : -0.18;
      const mon = new THREE.Group();
      mon.position.set(x + 4.2, 1.6, z + dz);
      mon.rotation.y = Math.PI * 0.5 + angle;
      parent.add(mon);
      addBox(mon, [0, 0, 0], [1.08, 0.72, 0.08], materials.metalDark);
      addBox(mon, [0, 0, 0.045], [0.98, 0.62, 0.02], dz === 0 ? materials.screenGlow : materials.screen, { shadow: false });
      addCylinder(mon, [0, -0.42, 0], 0.05, 0.05, 0.32, materials.metalDark);
      addBox(mon, [0, -0.56, 0.05], [0.38, 0.04, 0.28], materials.metalDark);
    }

    // Desk accessories: Ceramic coffee mug & potted succulent
    addCylinder(parent, [x + 4.0, 1.12, z + 1.6], 0.08, 0.07, 0.15, materials.ceramicTeal, { segments: 12 });
    addCylinder(parent, [x + 4.0, 1.11, z - 1.6], 0.14, 0.1, 0.14, materials.ceramic, { segments: 12 });
    addSphere(parent, [x + 4.0, 1.22, z - 1.6], [0.12, 0.1, 0.12], materials.foliageBright);

    // Ergonomic Office Chair
    const chair = new THREE.Group();
    chair.position.set(x + 3.0, 0, z);
    chair.rotation.y = -Math.PI * 0.5;
    parent.add(chair);
    addBox(chair, [0, 0.55, 0], [0.72, 0.14, 0.72], materials.mint);
    addBox(chair, [-0.3, 1.05, 0], [0.14, 0.88, 0.68], materials.mint);
    addCylinder(chair, [0, 0.25, 0], 0.06, 0.06, 0.5, materials.metalDark);
    addCylinder(chair, [0, 0.05, 0], 0.34, 0.34, 0.06, materials.metalDark, { segments: 8 });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.0, 0.55, z], [0.42, 0.55, 0.42]);

    // Framed Geometric Art on wall above desk
    const techArt = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.2),
      new THREE.MeshStandardMaterial({ map: createPaintingTexture('geometric'), roughness: 0.4 })
    );
    techArt.position.set(x + 5.08, 2.8, z);
    techArt.rotation.y = -Math.PI * 0.5;
    parent.add(techArt);
    addBox(parent, [x + 5.1, 2.8, z], [0.06, 1.34, 1.94], materials.metalDark);

    // Tall tech bookshelf nestled in front-right corner against front wall
    addBox(parent, [x + 3.4, 1.8, z + 3.2], [2.4, 3.6, 0.45], materials.woodDark);
    for (let shelf = 0.6; shelf <= 3.2; shelf += 0.8) {
      addBox(parent, [x + 3.4, shelf, z + 3.2], [2.3, 0.06, 0.42], materials.woodWarm);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.4, 1.8, z + 3.2], [1.2, 1.8, 0.28]);
    // Decorative computer case / server box
    addBox(parent, [x + 2.0, 0.95, z + 3.2], [0.45, 0.65, 0.35], materials.metalDark);
    addSphere(parent, [x + 2.0, 1.2, z + 3.4], [0.03, 0.03, 0.03], materials.blueSky, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.0, 0.5, z + 3.2], [0.28, 0.5, 0.22]);
  } else if (id === 'experience') {
    // ==========================================
    // 3. LIBRARY NOOK: Modular tall bookshelf along outer wall, cozy wingback chair in corner
    // ==========================================
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(x - 4.9, 0, z);
    parent.add(shelfGroup);
    addBox(shelfGroup, [0, 2.4, 0], [0.55, 4.8, 5.8], materials.woodDark);
    for (let sy = 0.6; sy <= 4.4; sy += 0.72) {
      addBox(shelfGroup, [0.05, sy, 0], [0.48, 0.06, 5.6], materials.woodWarm);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.9, 2.4, z], [0.32, 2.4, 2.9]);
    // Colorful book rows
    const bookColors = [materials.coral, materials.yellow, materials.blue, materials.mint, materials.pink];
    for (let row = 0; row < 5; row += 1) {
      const by = 0.95 + row * 0.72;
      for (let bz = -2.4; bz <= 2.4; bz += 0.32) {
        addBox(shelfGroup, [0.1, by, bz], [0.34, 0.48, 0.22], bookColors[Math.abs(Math.round(bz * 7 + row)) % bookColors.length]);
      }
    }

    // Cozy Wingback Chair in front corner with soft yellow cushion
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x - 2.8, 0, z + 2.2);
    chairGroup.rotation.y = 0.55;
    parent.add(chairGroup);
    addBox(chairGroup, [0, 0.52, 0], [1.05, 0.48, 1.05], materials.coral);
    addBox(chairGroup, [0, 1.15, -0.42], [1.05, 0.95, 0.28], materials.coral);
    addBox(chairGroup, [-0.48, 0.85, 0], [0.24, 0.65, 1.05], materials.coral);
    addBox(chairGroup, [0.48, 0.85, 0], [0.24, 0.65, 1.05], materials.coral);
    addBox(chairGroup, [0, 0.65, -0.1], [0.4, 0.35, 0.18], materials.cushionYellow, { rotation: [0.15, 0, 0] });
    addBox(chairGroup, [0, 0.35, 1.2], [0.72, 0.38, 0.72], materials.cushionYellow); // Footstool
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.8, 0.6, z + 2.2], [0.65, 0.6, 0.65]);

    // Brass floor reading lamp
    addCylinder(parent, [x - 1.2, 1.6, z + 2.4], 0.03, 0.03, 3.2, materials.brass);
    addCylinder(parent, [x - 1.2, 0.04, z + 2.4], 0.36, 0.36, 0.08, materials.brass, { segments: 16 });
    addCone(parent, [x - 1.2, 3.1, z + 2.4], 0.38, 0.35, materials.cream);
    addSphere(parent, [x - 1.2, 2.95, z + 2.4], [0.14, 0.14, 0.14], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.2, 0.8, z + 2.4], [0.25, 0.8, 0.25]);

    // Grandfather clock along partition wall
    addBox(parent, [x - 4.6, 1.8, z - 3.4], [0.65, 3.6, 0.65], materials.woodDark);
    addCylinder(parent, [x - 4.25, 2.6, z - 3.4], 0.22, 0.22, 0.06, materials.cream, { segments: 16, rotation: [0, 0, Math.PI * 0.5] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.6, 1.8, z - 3.4], [0.35, 1.8, 0.35]);
  } else if (id === 'projects') {
    // ==========================================
    // 4. PROJECT GALLERY: Vitrine pedestals along outer wall, museum bench, open floor
    // ==========================================
    const vitrines = [
      { pz: z + 2.0, name: 'AI Product' },
      { pz: z - 2.0, name: 'SaaS Platform' },
    ];
    for (const v of vitrines) {
      const ped = new THREE.Group();
      ped.position.set(x + 4.2, 0, v.pz);
      parent.add(ped);
      // Oak Pedestal base
      addBox(ped, [0, 0.55, 0], [1.1, 1.1, 1.1], materials.woodWarm);
      addBox(ped, [0, 1.12, 0], [1.2, 0.08, 1.2], materials.woodDark);
      // Clear Glass Vitrine Case
      addBox(ped, [0, 1.75, 0], [1.05, 1.15, 1.05], materials.glass);
      // Floating 3D diorama miniature inside vitrine
      addSphere(ped, [0, 1.75, 0], [0.26, 0.26, 0.26], materials.blueSky, { shadow: false });
      addCylinder(ped, [0, 1.75, 0], 0.42, 0.42, 0.03, materials.brass, { rotation: [0.35, 0, 0.35] });
      addBox(ped, [0, 1.5, 0], [0.34, 0.24, 0.34], materials.coral);
      addFurnitureCollider(world, RAPIER, staticBodies, [x + 4.2, 0.9, v.pz], [0.62, 0.9, 0.62]);
    }

    // Museum gallery upholstered bench framing vitrines
    addBox(parent, [x + 1.8, 0.45, z + 1.8], [2.2, 0.42, 0.95], materials.cushionBlue);
    addBox(parent, [x + 0.9, 0.2, z + 1.8], [0.14, 0.4, 0.85], materials.woodDark);
    addBox(parent, [x + 2.7, 0.2, z + 1.8], [0.14, 0.4, 0.85], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 1.8, 0.35, z + 1.8], [1.15, 0.35, 0.5]);

    // Potted indoor olive tree
    addCylinder(parent, [x + 4.4, 0.45, z - 3.4], 0.45, 0.35, 0.9, materials.ceramicTerracotta, { segments: 16 });
    addCylinder(parent, [x + 4.4, 1.3, z - 3.4], 0.07, 0.09, 1.0, materials.bark);
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const ox = x + 4.4 + Math.cos(angle) * 0.42;
      const oz = z - 3.4 + Math.sin(angle) * 0.42;
      addSphere(parent, [ox, 1.55 + (i % 2) * 0.2, oz], [0.32, 0.22, 0.32], materials.foliageMid);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 4.4, 0.6, z - 3.4], [0.45, 0.6, 0.45]);
  } else if (id === 'process') {
    // ==========================================
    // 5. CREATIVE STUDIO: Architect drafting table, art easel, blueprint rack
    // ==========================================
    // Tilt-top Architect Drafting Table
    const desk = new THREE.Group();
    desk.position.set(x - 3.8, 0, z);
    parent.add(desk);
    addBox(desk, [0, 1.05, 0], [2.4, 0.12, 1.6], materials.woodWarm, { rotation: [-0.22, 0, 0] });
    addBox(desk, [-1.05, 0.5, 0], [0.14, 1.0, 1.3], materials.metalDark);
    addBox(desk, [1.05, 0.5, 0], [0.14, 1.0, 1.3], materials.metalDark);
    // Large blueprint roll on desk
    addBox(desk, [0, 1.15, 0], [1.6, 0.02, 1.1], materials.trim, { rotation: [-0.22, 0, 0] });
    addCylinder(desk, [0.85, 1.25, 0.4], 0.06, 0.06, 0.95, materials.blueSky, { rotation: [0, 0, Math.PI * 0.5] });
    // Color swatches & brass drafting ruler
    addBox(desk, [-0.65, 1.18, 0.2], [0.3, 0.02, 0.4], materials.coral, { rotation: [-0.22, 0, 0.1] });
    addBox(desk, [-0.65, 1.22, -0.3], [0.04, 0.02, 0.7], materials.brass, { rotation: [-0.22, 0, 0] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.8, 0.6, z], [1.25, 0.6, 0.85]);

    // Wooden Artist Easel with Real Canvas Painting
    const easel = new THREE.Group();
    easel.position.set(x - 4.2, 0, z + 2.4);
    easel.rotation.y = 0.4;
    parent.add(easel);
    addCylinder(easel, [-0.45, 1.35, -0.1], 0.05, 0.05, 2.7, materials.woodDark, { rotation: [0.12, 0, 0.12] });
    addCylinder(easel, [0.45, 1.35, -0.1], 0.05, 0.05, 2.7, materials.woodDark, { rotation: [0.12, 0, -0.12] });
    addCylinder(easel, [0, 1.35, 0.35], 0.04, 0.04, 2.7, materials.woodDark, { rotation: [-0.25, 0, 0] });
    addBox(easel, [0, 1.1, -0.05], [1.3, 0.08, 0.22], materials.woodWarm);
    addBox(easel, [0, 1.55, -0.08], [1.05, 0.85, 0.05], materials.trim); // Canvas Frame
    const canvasArt = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.75),
      new THREE.MeshStandardMaterial({ map: createPaintingTexture('landscape'), roughness: 0.35 })
    );
    canvasArt.position.set(0, 1.55, -0.045);
    canvasArt.rotation.y = Math.PI;
    easel.add(canvasArt);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.2, 1.0, z + 2.4], [0.7, 1.0, 0.45]);

    // Material swatch / storage cabinet tucked against front wall
    addBox(parent, [x - 1.8, 1.2, z + 3.2], [3.0, 2.4, 0.55], materials.woodWarm);
    for (let i = -0.9; i <= 0.9; i += 0.9) {
      addSphere(parent, [x - 1.8 + i, 2.55, z + 3.2], [0.22, 0.18, 0.22], materials.ceramicTerracotta);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.8, 1.2, z + 3.2], [1.55, 1.2, 0.35]);
  } else if (id === 'contact') {
    // ==========================================
    // 6. GARDEN TERRACE LOUNGE: Teak outdoor sofa, pergola with wisteria, terrace planters
    // ==========================================
    const teakSofa = new THREE.Group();
    teakSofa.position.set(x + 3.8, 0, z);
    teakSofa.rotation.y = -Math.PI * 0.5;
    parent.add(teakSofa);
    addBox(teakSofa, [0, 0.42, 0], [3.2, 0.38, 1.1], materials.woodWarm);
    addBox(teakSofa, [0, 0.9, -0.42], [3.2, 0.65, 0.24], materials.woodWarm);
    addBox(teakSofa, [0, 0.55, 0], [3.0, 0.15, 0.95], materials.cushionMint);
    addBox(teakSofa, [-1.55, 0.65, 0], [0.18, 0.55, 1.1], materials.woodWarm);
    addBox(teakSofa, [1.55, 0.65, 0], [0.18, 0.55, 1.1], materials.woodWarm);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, 0.5, z], [0.6, 0.5, 1.65]);

    // Low Teak Coffee Table with Garden Refreshment Set
    addBox(parent, [x + 2.2, 0.42, z], [1.1, 0.38, 1.8], materials.woodWarm);
    addCylinder(parent, [x + 2.2, 0.65, z - 0.3], 0.14, 0.14, 0.32, materials.glass); // Pitcher
    addCylinder(parent, [x + 2.2, 0.55, z + 0.3], 0.08, 0.07, 0.16, materials.ceramicTeal); // Cup
    addCylinder(parent, [x + 2.4, 0.55, z + 0.1], 0.08, 0.07, 0.16, materials.ceramic); // Cup
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.2, 0.25, z], [0.55, 0.25, 0.9]);

    // Wooden Terrace Pergola overhead with hanging Wisteria clusters
    const perg = new THREE.Group();
    perg.position.set(x + 3.8, 0, z);
    parent.add(perg);
    addCylinder(perg, [-1.3, 2.4, -1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addCylinder(perg, [1.3, 2.4, -1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addCylinder(perg, [-1.3, 2.4, 1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addCylinder(perg, [1.3, 2.4, 1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 - 1.3, 2.4, z - 1.8], [0.15, 2.4, 0.15]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 + 1.3, 2.4, z - 1.8], [0.15, 2.4, 0.15]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 - 1.3, 2.4, z + 1.8], [0.15, 2.4, 0.15]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 + 1.3, 2.4, z + 1.8], [0.15, 2.4, 0.15]);
    for (let rz = -1.8; rz <= 1.8; rz += 0.9) {
      addBox(perg, [0, 4.75, rz], [3.2, 0.18, 0.14], materials.woodWarm);
    }
    // Wisteria hanging blossom pods
    for (let wi = 0; wi < 10; wi += 1) {
      const wx = (Math.sin(wi * 1.7) * 1.4);
      const wz = (Math.cos(wi * 2.1) * 1.4);
      addCylinder(perg, [wx, 4.3, wz], 0.14, 0.04, 0.75, materials.purple, { segments: 8 });
      addSphere(perg, [wx, 4.65, wz], [0.28, 0.18, 0.28], materials.foliageBright);
    }

    // Large terracotta garden planters
    addCylinder(parent, [x + 4.6, 0.48, z + 2.8], 0.45, 0.35, 0.95, materials.ceramicTerracotta, { segments: 16 });
    addSphere(parent, [x + 4.6, 1.15, z + 2.8], [0.42, 0.38, 0.42], materials.foliageDeep);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 4.6, 0.6, z + 2.8], [0.45, 0.6, 0.45]);
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2;
      addSphere(parent, [x + 4.6 + Math.cos(angle) * 0.28, 1.4, z + 2.8 + Math.sin(angle) * 0.28], [0.08, 0.08, 0.08], materials.purple);
    }
  }
}

function addCone(parent, position, radius, height, surface) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 16), surface);
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
