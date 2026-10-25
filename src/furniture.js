import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder } from './geometry.js';
import { createSignTexture } from './textures.js';
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
  // 9 Grand Themed Mansion Environments across Ground Floor (y = 0) and Second Floor (y = 5.2)
  const roomSpecs = [
    // --- GROUND FLOOR ---
    { id: 'about', x: 0.0, y: 0.0, z: 0.5, title: 'Beyond the Code', subtitle: 'CHAPTER 01 · ABOUT ME', accent: palette.coral, rugMat: materials.carpetPersian },
    { id: 'projects', x: -11.0, y: 0.0, z: -1.5, title: 'The Artifact Gallery', subtitle: 'CHAPTER 03 · PROJECTS', accent: palette.pinkRose, rugMat: materials.carpetBauhaus },
    { id: 'skills', x: 10.75, y: 0.0, z: -1.5, title: 'The Engineering Workshop', subtitle: 'CHAPTER 04 · SKILLS & TOOLS', accent: palette.blueSky, rugMat: materials.blue },
    { id: 'garage', x: 21.0, y: 0.0, z: -1.5, title: 'Private Garage & Workshop', subtitle: 'BMW M-SERIES & TOOLS', accent: palette.goldBrass, rugMat: materials.epoxyFloor },
    { id: 'contact', x: 0.0, y: 0.0, z: -22.5, title: 'The Final Scene', subtitle: 'COME SAY HELLO', accent: palette.coral, rugMat: materials.terraceTiles },

    // --- SECOND FLOOR (y = 5.2m) ---
    { id: 'bedroom', x: -11.0, y: 5.2, z: -1.5, title: 'Master Bedroom', subtitle: 'REST & RECHARGE', accent: palette.bluePastel, rugMat: materials.carpetBauhaus },
    { id: 'bathroom', x: 0.0, y: 5.2, z: -13.5, title: 'Master Bathroom', subtitle: 'RELAX & REFRESH', accent: palette.mintSage, rugMat: materials.bathroomTile },
    { id: 'experience', x: 10.5, y: 5.2, z: -1.5, title: 'The Engineering Journey', subtitle: 'STORY & MILESTONES', accent: palette.yellowSun, rugMat: materials.carpetPersian },
    { id: 'process', x: 21.0, y: 5.2, z: -1.5, title: 'Creative Studio', subtitle: 'CHAPTER 02 · PROCESS', accent: palette.mintSage, rugMat: materials.mint },
  ];

  for (let i = 0; i < roomSpecs.length; i += 1) {
    const spec = roomSpecs[i];

    // Custom area rug for non-garage/bathroom spaces
    if (spec.id !== 'garage' && spec.id !== 'bathroom') {
      const rugW = spec.id === 'about' ? 8.2 : 8.8;
      const rugD = spec.id === 'about' ? 6.2 : 6.8;
      addBox(building, [spec.x, spec.y + 0.005, spec.z], [rugW, 0.02, rugD], spec.rugMat, { receive: true, shadow: false });
    }

    // Presentation Display Board (Mounted on back wall of room)
    if (spec.id !== 'garage' && spec.id !== 'bathroom' && spec.id !== 'bedroom') {
      createDisplayBoard(building, spec, world, RAPIER, staticBodies);
    }

    // Room-specific furnishings with physics colliders
    buildRoomFurniture(building, spec, world, RAPIER, staticBodies);

    // Interactive glowing floor beacon placed directly in front of display board or key flagship object
    let beaconX = spec.x;
    let beaconZ = spec.z;
    if (spec.id === 'about') {
      // Placed at side foyer gallery wall, leaving center entrance 100% open
      beaconX = -3.8;
      beaconZ = 2.4;
    } else if (spec.id === 'projects') {
      beaconX = -11.0;
      beaconZ = -3.5;
    } else if (spec.id === 'skills') {
      // Clear of arched doorway at x=5.5, placed in front of desk workstation
      beaconX = 10.5;
      beaconZ = -5.5;
    } else if (spec.id === 'experience') {
      // Inside library nook reading alcove, clearing top of stairs completely
      beaconX = 10.5;
      beaconZ = -5.0;
    } else if (spec.id === 'process') {
      // Inside creative studio back wall, clearing connecting arch from library
      beaconX = 21.0;
      beaconZ = -5.0;
    } else if (spec.id === 'contact') {
      beaconX = 3.6;
      beaconZ = -20.2;
    } else if (spec.id === 'garage') {
      beaconX = 21.0;
      beaconZ = 1.4;
    } else if (spec.id === 'bedroom') {
      beaconX = -11.0;
      beaconZ = 0.6;
    } else if (spec.id === 'bathroom') {
      beaconX = 0.0;
      beaconZ = -11.8;
    }
    createFloorBeacon(building, beaconX, spec.y, beaconZ, spec.accent);

    // Register interaction point
    const roomInfo = portfolio.rooms.find((r) => r.id === spec.id);
    interactionPoints.push({
      id: spec.id,
      title: roomInfo ? roomInfo.title : spec.subtitle,
      position: new THREE.Vector3(beaconX, spec.y + 0.9, beaconZ),
      radius: 4.2,
      action: () => openDetailsCallback(spec.id),
      getLabel: () => `Explore ${roomInfo ? roomInfo.title : spec.subtitle}`,
    });
  }
}

function createFloorBeacon(parent, x, y, z, colorHex) {
  const beacon = new THREE.Group();
  beacon.position.set(x, y + 0.025, z);
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

function createDisplayBoard(parent, room, world, RAPIER, staticBodies) {
  const { x, y, z, id, title, subtitle, accent } = room;

  let bx = x;
  let by = y;
  let bz = z - 3.4 + 0.16;
  let brotY = 0;

  if (id === 'about') {
    // Mounted against West foyer wall: leaves 100% of the front entrance door & walkway spacious & open
    bx = -5.0;
    bz = 2.4;
    brotY = Math.PI * 0.5;
  } else if (id === 'projects') {
    // Mounted on back wall of gallery
    bx = -11.0;
    bz = -4.75;
    brotY = 0;
  } else if (id === 'skills') {
    // Mounted on rear North wall: leaves arched door at x=5.5 completely clear
    bx = 10.5;
    bz = -7.0;
    brotY = 0;
  } else if (id === 'experience') {
    // Inside Library Nook reading alcove: leaving stairs & mezzanine landing 100% clear
    bx = 10.5;
    bz = -6.8;
    brotY = 0;
  } else if (id === 'process') {
    // Back wall of studio: leaves connecting archway from library wide open
    bx = 21.0;
    bz = -6.8;
    brotY = 0;
  } else if (id === 'contact') {
    // Terrace side pergola column: leaves center panoramic view completely open
    bx = 4.8;
    bz = -20.2;
    brotY = -Math.PI * 0.5;
  }

  const display = new THREE.Group();
  display.position.set(bx, by, bz);
  display.rotation.y = brotY;
  parent.add(display);

  // Elevated easel & frame stand
  addBox(display, [0, 2.9, 0], [3.8, 2.2, 0.14], materials.woodDark);
  addBox(display, [0, 1.65, 0.22], [3.5, 0.12, 0.5], materials.woodWarm);
  addBox(display, [-1.45, 0.8, 0.25], [0.16, 1.6, 0.16], materials.metalDark);
  addBox(display, [1.45, 0.8, 0.25], [0.16, 1.6, 0.16], materials.metalDark);

  // Canvas sign texture
  const signTex = createSignTexture(title, subtitle, accent, 512, 340);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2.0),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45, metalness: 0.05 })
  );
  signMesh.position.set(0, 2.9, 0.085);
  display.add(signMesh);

  // Brass picture lamp over board
  addBox(display, [0, 4.1, 0.25], [1.8, 0.08, 0.16], materials.brass);
  addSphere(display, [0, 4.02, 0.25], [0.16, 0.06, 0.16], materials.glow, { shadow: false });

  // Physics collider preventing walking through easel
  if (world && RAPIER && staticBodies) {
    addFurnitureCollider(world, RAPIER, staticBodies, [bx, by + 1.5, bz], [1.8, 1.5, 0.25]);
  }
}

function buildRoomFurniture(parent, room, world, RAPIER, staticBodies) {
  const { x, y, z, id } = room;

  if (id === 'about') {
    // =========================================================================
    // 1. GRAND LIVING ROOM (Ground Floor Center, x = 0, y = 0, z = 0.5)
    // Double-height atrium, modern ring chandelier, sectional sofa, fireplace,
    // media wall with slatted wood, coffee table with tea set, wall art
    // =========================================================================
    // Modern Sculptural Ring Chandelier suspended from double-height ceiling (y = 8.6)
    const chandelier = new THREE.Group();
    chandelier.position.set(x, y + 8.6, z);
    parent.add(chandelier);
    addCylinder(chandelier, [0, 0, 0], 1.6, 1.6, 0.12, materials.brass, { segments: 24 });
    addCylinder(chandelier, [0, -0.05, 0], 1.5, 1.5, 0.08, materials.glow, { segments: 24, shadow: false });
    // Thin brass suspension cables to ceiling
    for (let c = 0; c < 3; c += 1) {
      const angle = (c / 3) * Math.PI * 2;
      addCylinder(chandelier, [Math.cos(angle) * 1.5, 0.9, Math.sin(angle) * 1.5], 0.015, 0.015, 1.8, materials.brass);
    }

    // Grand Entrance Foyer Inlaid Architectural Medallion (Spacious, open entrance welcoming the player)
    addCylinder(parent, [x, y + 0.008, z + 2.0], 1.8, 1.8, 0.01, materials.wainscot, { segments: 32 });
    addCylinder(parent, [x, y + 0.012, z + 2.0], 1.5, 1.5, 0.01, materials.woodDark, { segments: 32 });
    addCylinder(parent, [x, y + 0.016, z + 2.0], 0.65, 0.65, 0.01, materials.brass, { segments: 24 });

    // Luxury sectional sofa in warm coral fabric shifted westward to leave foyer 100% open
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(x - 2.8, y, z - 0.4);
    sofaGroup.rotation.y = 0.25;
    parent.add(sofaGroup);
    addBox(sofaGroup, [0, 0.42, 0], [4.2, 0.45, 1.2], materials.coral);
    addBox(sofaGroup, [0, 0.95, -0.45], [4.2, 0.65, 0.32], materials.coral);
    addBox(sofaGroup, [-2.0, 0.65, 0], [0.35, 0.6, 1.2], materials.coral);
    addBox(sofaGroup, [1.7, 0.42, 1.1], [1.2, 0.45, 1.2], materials.coral);
    addBox(sofaGroup, [2.15, 0.65, 1.1], [0.3, 0.6, 1.2], materials.coral);
    addBox(sofaGroup, [-1.4, 0.8, -0.25], [0.45, 0.45, 0.22], materials.cushionYellow, { rotation: [0.1, 0.2, 0] });
    addBox(sofaGroup, [0.8, 0.8, -0.25], [0.45, 0.45, 0.22], materials.cushionMint, { rotation: [0.1, -0.2, 0] });
    addBox(sofaGroup, [-0.2, 0.8, -0.25], [0.45, 0.45, 0.22], materials.cushionBlue, { rotation: [0.1, -0.1, 0] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.8, y + 0.48, z - 0.4], [2.1, 0.48, 0.65]);

    // Accent Lounge Armchair facing west toward coffee table & sofa
    const armChair = new THREE.Group();
    armChair.position.set(x - 0.8, y, z - 0.4);
    armChair.rotation.y = -Math.PI * 0.5;
    parent.add(armChair);
    addBox(armChair, [0, 0.42, 0], [1.1, 0.42, 1.1], materials.cushionMint);
    addBox(armChair, [0, 0.95, -0.45], [1.1, 0.65, 0.24], materials.cushionMint);
    addBox(armChair, [-0.48, 0.65, 0], [0.16, 0.5, 1.0], materials.woodDark);
    addBox(armChair, [0.48, 0.65, 0], [0.16, 0.5, 1.0], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 0.8, y + 0.5, z - 0.4], [0.6, 0.5, 0.6]);

    // Low Glass & Oak Round Coffee Table
    addCylinder(parent, [x - 1.8, y + 0.38, z - 0.4], 1.05, 1.05, 0.08, materials.glass, { segments: 24 });
    addCylinder(parent, [x - 1.8, y + 0.18, z - 0.4], 0.22, 0.35, 0.34, materials.woodDark, { segments: 12 });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.8, y + 0.22, z - 0.4], [1.05, 0.22, 1.05]);

    // Ceramic Teapot, Cups & Fruit Bowl on table
    addSphere(parent, [x - 1.6, y + 0.52, z - 0.4], [0.12, 0.11, 0.12], materials.ceramicTeal);
    addSphere(parent, [x - 1.6, y + 0.62, z - 0.4], [0.035, 0.035, 0.035], materials.brass, { shadow: false });
    addCylinder(parent, [x - 1.95, y + 0.48, z - 0.25], 0.06, 0.05, 0.09, materials.ceramic, { segments: 12 });
    addCylinder(parent, [x - 1.8, y + 0.48, z - 0.58], 0.06, 0.05, 0.09, materials.ceramic, { segments: 12 });
    // Decorative fruit bowl with oranges
    addCylinder(parent, [x - 2.1, y + 0.46, z - 0.3], 0.18, 0.12, 0.08, materials.ceramic, { segments: 14 });
    addSphere(parent, [x - 2.1, y + 0.54, z - 0.3], [0.07, 0.07, 0.07], materials.coral, { shadow: false });
    addSphere(parent, [x - 2.04, y + 0.53, z - 0.24], [0.06, 0.06, 0.06], materials.coral, { shadow: false });

    // Side Table with Brass Table Lamp
    const sideTable = new THREE.Group();
    sideTable.position.set(x - 4.6, y, z + 0.6);
    parent.add(sideTable);
    addCylinder(sideTable, [0, 0.55, 0], 0.38, 0.38, 0.06, materials.woodWarm);
    addCylinder(sideTable, [0, 0.27, 0], 0.05, 0.05, 0.54, materials.brass);
    addCylinder(sideTable, [0, 0.8, 0], 0.18, 0.24, 0.35, materials.cream, { segments: 16 });
    addSphere(sideTable, [0, 0.75, 0], [0.1, 0.1, 0.1], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.6, y + 0.4, z + 0.6], [0.38, 0.4, 0.38]);

    // Stone Fireplace with Hearth, Glowing Embers & Log Basket on West wall
    const fp = new THREE.Group();
    fp.position.set(x - 5.0, y, z - 0.6);
    fp.rotation.y = Math.PI * 0.5;
    parent.add(fp);
    addBox(fp, [0, 1.4, 0], [0.95, 2.8, 2.8], materials.wainscot);
    addBox(fp, [0.08, 0.95, 0], [0.85, 1.7, 2.0], materials.metalDark);
    addBox(fp, [0.05, 2.85, 0], [1.15, 0.18, 3.1], materials.woodDark);
    // Glowing coals, fire, and hearth logs
    addBox(fp, [0.22, 0.25, 0], [0.65, 0.18, 1.4], materials.fireEmber, { shadow: false });
    addSphere(fp, [0.18, 0.55, 0], [0.26, 0.38, 0.26], materials.fire, { shadow: false });
    addSphere(fp, [0.18, 0.52, 0], [0.45, 0.3, 0.45], materials.glow, { shadow: false });
    // Firewood log basket next to fireplace
    addCylinder(fp, [0.15, 0.3, 1.5], 0.28, 0.24, 0.38, materials.bark, { segments: 12 });
    // Brass candlesticks with glowing flame on mantelpiece
    addCylinder(fp, [0.12, 3.15, -0.9], 0.05, 0.07, 0.42, materials.brass);
    addSphere(fp, [0.12, 3.4, -0.9], [0.03, 0.06, 0.03], materials.fire, { shadow: false });
    addCylinder(fp, [0.12, 3.12, 0.9], 0.05, 0.07, 0.36, materials.brass);
    addSphere(fp, [0.12, 3.34, 0.9], [0.03, 0.06, 0.03], materials.fire, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 5.0, y + 1.4, z - 0.6], [0.55, 1.4, 1.55]);

    // Media Wall on East Wall (x = 4.8): Slatted wood accent, 75" TV, Soundbar, Media Console
    const mediaWall = new THREE.Group();
    mediaWall.position.set(x + 4.8, y, z - 0.6);
    mediaWall.rotation.y = -Math.PI * 0.5;
    parent.add(mediaWall);
    // Slatted wood accent panel
    addBox(mediaWall, [0, 2.6, -0.05], [4.6, 5.2, 0.1], materials.woodSlats);
    // OLED Television with ambient art
    addBox(mediaWall, [0, 2.4, 0.1], [3.2, 1.8, 0.08], materials.metalDark);
    addBox(mediaWall, [0, 2.4, 0.15], [3.05, 1.65, 0.02], materials.artLandscape, { shadow: false });
    // Soundbar below TV
    addBox(mediaWall, [0, 1.35, 0.14], [2.2, 0.14, 0.18], materials.metalDark);
    // Media console cabinet
    addBox(mediaWall, [0, 0.48, 0.45], [4.0, 0.72, 0.75], materials.woodDark);
    // Decorative ceramics & coffee table design books on media console
    addCylinder(mediaWall, [-1.2, 0.98, 0.45], 0.12, 0.08, 0.28, materials.ceramicTeal, { segments: 14 });
    addBox(mediaWall, [1.1, 0.88, 0.45], [0.45, 0.08, 0.35], materials.coral);
    addBox(mediaWall, [1.1, 0.94, 0.45], [0.42, 0.06, 0.32], materials.cream);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 4.8, y + 0.48, z - 0.6], [0.5, 0.48, 2.1]);

    // Potted indoor Monstera Deliciosa palm in decorative ceramic planter
    addCylinder(parent, [x + 3.8, y + 0.45, z + 2.2], 0.45, 0.35, 0.9, materials.ceramicTerracotta, { segments: 16 });
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      const px = x + 3.8 + Math.cos(angle) * 0.42;
      const pz = z + 2.2 + Math.sin(angle) * 0.42;
      addSphere(parent, [px, y + 1.45 + (i % 2) * 0.22, pz], [0.42, 0.22, 0.42], materials.foliageBright);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, y + 0.6, z + 2.2], [0.45, 0.6, 0.45]);

    // Framed modern art canvas on upper gallery wall
    addBox(parent, [x - 2.8, y + 6.2, z - 3.2], [2.4, 1.6, 0.08], materials.woodDark);
    addBox(parent, [x - 2.8, y + 6.2, z - 3.15], [2.2, 1.4, 0.04], materials.artModern, { shadow: false });
  } else if (id === 'projects') {
    // =========================================================================
    // 2. PROJECT GALLERY (Ground Floor Left, x = -11.0, y = 0, z = -1.5)
    // 4 Dedicated Flagship Project Holographic Pedestals, velvet stanchions,
    // upholstered museum bench, gallery wall spotlights, potted olive tree
    // =========================================================================
    const projectVitrines = [
      { pz: z + 2.4, title: 'IntelliChat AI', color: materials.blueSky, shape: 'gem' },
      { pz: z + 0.8, title: 'System Gov', color: materials.brass, shape: 'ring' },
      { pz: z - 0.8, title: 'Beyond-RAG ASI', color: materials.screenGlow, shape: 'sphere' },
      { pz: z - 2.4, title: 'Smart Kost SaaS', color: materials.coral, shape: 'box' },
    ];

    for (const v of projectVitrines) {
      const ped = new THREE.Group();
      ped.position.set(x - 3.8, y, v.pz);
      parent.add(ped);

      // Fluted wood pedestal with dark top
      addBox(ped, [0, 0.55, 0], [1.1, 1.1, 1.1], materials.woodWarm);
      addBox(ped, [0, 1.12, 0], [1.2, 0.08, 1.2], materials.woodDark);
      // Acrylic museum vitrine glass case
      addBox(ped, [0, 1.75, 0], [1.05, 1.15, 1.05], materials.glass);

      // Rotating Holographic Core Artifact
      if (v.shape === 'gem') {
        addSphere(ped, [0, 1.75, 0], [0.28, 0.35, 0.28], v.color, { shadow: false });
        addCylinder(ped, [0, 1.75, 0], 0.45, 0.45, 0.03, materials.brass, { rotation: [0.35, 0, 0.35] });
      } else if (v.shape === 'ring') {
        addCylinder(ped, [0, 1.75, 0], 0.32, 0.32, 0.28, materials.brass, { segments: 16 });
        addSphere(ped, [0, 1.75, 0], [0.18, 0.18, 0.18], materials.coral, { shadow: false });
      } else if (v.shape === 'sphere') {
        addSphere(ped, [0, 1.75, 0], [0.3, 0.3, 0.3], v.color, { shadow: false });
        addCylinder(ped, [0, 1.75, 0], 0.48, 0.48, 0.02, materials.carChrome, { rotation: [0.4, 0, 0.2] });
      } else {
        addBox(ped, [0, 1.75, 0], [0.36, 0.36, 0.36], v.color, { shadow: false, rotation: [0.2, 0.4, 0] });
      }

      // Small plaque on front of pedestal
      addBox(ped, [0.56, 0.85, 0], [0.04, 0.2, 0.48], materials.brass);

      // Ceiling recessed spotlight highlighting this vitrine
      addCylinder(parent, [x - 3.8, y + 5.15, v.pz], 0.14, 0.18, 0.12, materials.metalDark);
      addSphere(parent, [x - 3.8, y + 5.08, v.pz], [0.1, 0.04, 0.1], materials.glow, { shadow: false });

      addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.8, y + 0.9, v.pz], [0.62, 0.9, 0.62]);
    }

    // Museum Velvet Rope Stanchions guarding the pedestals
    for (let sz = z - 2.8; sz <= z + 2.8; sz += 1.4) {
      addCylinder(parent, [x - 2.6, y + 0.48, sz], 0.04, 0.04, 0.96, materials.brass);
      addSphere(parent, [x - 2.6, y + 0.98, sz], [0.08, 0.08, 0.08], materials.brass);
      addCylinder(parent, [x - 2.6, y + 0.04, sz], 0.22, 0.22, 0.08, materials.brass, { segments: 16 });
    }
    // Velvet connecting cord
    addBox(parent, [x - 2.6, y + 0.92, z], [0.04, 0.05, 5.6], materials.coral);

    // Museum upholstered gallery bench
    addBox(parent, [x + 1.2, y + 0.45, z], [2.4, 0.42, 1.1], materials.cushionBlue);
    addBox(parent, [x + 0.2, y + 0.2, z], [0.14, 0.4, 1.0], materials.woodDark);
    addBox(parent, [x + 2.2, y + 0.2, z], [0.14, 0.4, 1.0], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 1.2, y + 0.35, z], [1.25, 0.35, 0.6]);

    // Potted indoor olive tree in corner
    addCylinder(parent, [x - 4.2, y + 0.45, z + 2.8], 0.45, 0.35, 0.9, materials.ceramicTerracotta, { segments: 16 });
    addCylinder(parent, [x - 4.2, y + 1.25, z + 2.8], 0.08, 0.1, 1.05, materials.bark);
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      addSphere(parent, [x - 4.2 + Math.cos(angle) * 0.42, y + 1.5, z + 2.8 + Math.sin(angle) * 0.42], [0.35, 0.24, 0.35], materials.foliageMid);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.2, y + 0.55, z + 2.8], [0.45, 0.55, 0.45]);

    // Gallery Guest Book / Catalog Stand near entryway
    const catalogStand = new THREE.Group();
    catalogStand.position.set(x + 2.8, y, z + 2.4);
    catalogStand.rotation.y = -Math.PI * 0.35;
    parent.add(catalogStand);
    addCylinder(catalogStand, [0, 0.5, 0], 0.04, 0.04, 1.0, materials.brass);
    addCylinder(catalogStand, [0, 0.02, 0], 0.22, 0.22, 0.04, materials.brass, { segments: 16 });
    addBox(catalogStand, [0, 1.05, 0], [0.55, 0.04, 0.42], materials.woodDark, { rotation: [0.35, 0, 0] });
    addBox(catalogStand, [0, 1.08, 0], [0.48, 0.03, 0.36], materials.cream, { rotation: [0.35, 0, 0] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.8, y + 0.55, z + 2.4], [0.3, 0.55, 0.3]);
  } else if (id === 'skills') {
    // =========================================================================
    // 3. HOME OFFICE (Ground Floor Right, x = 10.75, y = 0, z = -1.5)
    // Developer workstation, curved triple screens with live syntax highlighted code,
    // custom PC tower with RGB, studio mic on boom arm, server rack, architecture whiteboard
    // =========================================================================
    // Developer Desk along East wall (x = 10.75 + 3.8 = 14.55)
    addBox(parent, [x + 3.8, y + 0.95, z], [1.6, 0.16, 4.4], materials.woodWarm);
    addBox(parent, [x + 3.8, y + 0.48, z - 2.0], [1.4, 0.95, 0.22], materials.metalDark);
    addBox(parent, [x + 3.8, y + 0.48, z + 2.0], [1.4, 0.95, 0.22], materials.metalDark);
    addBox(parent, [x + 3.8, y + 1.04, z], [1.1, 0.02, 3.2], materials.ink);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, y + 0.55, z], [0.85, 0.55, 2.25]);

    // Triple monitor curved setup (Left: Terminal, Center: VS Code, Right: CAD 3D)
    for (const dz of [-1.15, 0, 1.15]) {
      const angle = dz === 0 ? 0 : dz > 0 ? -0.22 : 0.22;
      const mon = new THREE.Group();
      mon.position.set(x + 3.8, y + 1.62, z + dz);
      mon.rotation.y = -Math.PI * 0.5 + angle;
      parent.add(mon);
      addBox(mon, [0, 0, 0], [1.14, 0.74, 0.08], materials.metalDark);
      const scrMat = dz === 0 ? materials.screenCode : dz < 0 ? materials.screenTerminal : materials.screenCad;
      addBox(mon, [0, 0, 0.045], [1.06, 0.66, 0.02], scrMat, { shadow: false });
      addCylinder(mon, [0, -0.44, 0], 0.05, 0.05, 0.36, materials.metalDark);
      addBox(mon, [0, -0.6, 0], [0.38, 0.04, 0.28], materials.metalDark);
    }

    // Studio Near-Field Monitors flanking screens
    for (const sz of [-1.85, 1.85]) {
      addBox(parent, [x + 3.8, y + 1.35, z + sz], [0.32, 0.48, 0.3], materials.metalDark);
      addCylinder(parent, [x + 3.63, y + 1.38, z + sz], 0.09, 0.09, 0.04, materials.yellowSun, { rotation: [0, 0, Math.PI * 0.5] });
      addCylinder(parent, [x + 3.63, y + 1.22, z + sz], 0.05, 0.05, 0.04, materials.brass, { rotation: [0, 0, Math.PI * 0.5] });
    }

    // High-End Custom PC Tower with RGB on desk
    const pc = new THREE.Group();
    pc.position.set(x + 4.1, y + 1.45, z + 1.8);
    pc.rotation.y = -Math.PI * 0.5;
    parent.add(pc);
    addBox(pc, [0, 0, 0], [0.55, 0.65, 0.32], materials.metalDark);
    addBox(pc, [0, 0, 0.165], [0.5, 0.58, 0.02], materials.glass);
    addBox(pc, [0, 0, 0.1], [0.42, 0.45, 0.1], materials.screenGlow, { shadow: false });

    // Studio Microphone on Scissor Boom Arm
    addCylinder(parent, [x + 3.2, y + 1.4, z - 0.4], 0.018, 0.018, 0.55, materials.metalDark, { rotation: [0.4, 0, 0.3] });
    addCylinder(parent, [x + 3.0, y + 1.55, z - 0.3], 0.04, 0.04, 0.16, materials.chrome);

    // Mechanical keyboard with WASD highlighted keys & mouse
    addBox(parent, [x + 3.4, y + 1.06, z], [0.38, 0.03, 0.95], materials.metalDark);
    addBox(parent, [x + 3.42, y + 1.08, z - 0.15], [0.06, 0.02, 0.06], materials.coral); // W key
    addBox(parent, [x + 3.36, y + 1.08, z - 0.22], [0.06, 0.02, 0.06], materials.coral); // A key
    addBox(parent, [x + 3.36, y + 1.08, z - 0.15], [0.06, 0.02, 0.06], materials.coral); // S key
    addBox(parent, [x + 3.36, y + 1.08, z - 0.08], [0.06, 0.02, 0.06], materials.coral); // D key
    addBox(parent, [x + 3.4, y + 1.05, z + 0.65], [0.18, 0.03, 0.12], materials.mint); // mouse
    // Ceramic developer coffee mug
    addCylinder(parent, [x + 3.35, y + 1.12, z - 0.8], 0.07, 0.06, 0.12, materials.coral, { segments: 12 });
    addCylinder(parent, [x + 3.35, y + 1.14, z - 0.8], 0.058, 0.058, 0.02, materials.woodDark, { segments: 12 });
    // Studio over-ear headphones resting on desk edge
    const hp = new THREE.Group();
    hp.position.set(x + 3.35, y + 1.08, z + 1.1);
    hp.rotation.y = 0.4;
    parent.add(hp);
    addCylinder(hp, [0, 0.06, 0], 0.12, 0.12, 0.04, materials.metalDark, { rotation: [0, 0, Math.PI * 0.5] });
    addCylinder(hp, [0, 0.06, -0.12], 0.06, 0.06, 0.05, materials.ink, { rotation: [Math.PI * 0.5, 0, 0] });
    addCylinder(hp, [0, 0.06, 0.12], 0.06, 0.06, 0.05, materials.ink, { rotation: [Math.PI * 0.5, 0, 0] });

    // Ergonomic Office Chair (directly facing the desk, triple monitors, and mechanical keyboard)
    const chair = new THREE.Group();
    chair.position.set(x + 2.6, y, z);
    chair.rotation.y = 0;
    parent.add(chair);
    addBox(chair, [0, 0.55, 0], [0.72, 0.14, 0.72], materials.mint);
    addBox(chair, [-0.3, 1.05, 0], [0.14, 0.88, 0.68], materials.mint);
    addCylinder(chair, [0, 0.25, 0], 0.06, 0.06, 0.5, materials.metalDark);
    addCylinder(chair, [0, 0.05, 0], 0.34, 0.34, 0.06, materials.metalDark, { segments: 8 });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.6, y + 0.55, z], [0.42, 0.55, 0.42]);

    // Tech bookshelf in front-right corner
    addBox(parent, [x + 2.8, y + 1.8, z + 2.8], [2.4, 3.6, 0.45], materials.woodDark);
    for (let shelf = 0.6; shelf <= 3.2; shelf += 0.8) {
      addBox(parent, [x + 2.8, y + shelf, z + 2.8], [2.3, 0.06, 0.42], materials.woodWarm);
    }
    // Colorful technical reference books on shelves
    for (let bx = -0.8; bx <= 0.8; bx += 0.25) {
      addBox(parent, [x + 2.8 + bx, y + 1.6, z + 2.8], [0.18, 0.44, 0.32], materials.blueSky);
      addBox(parent, [x + 2.8 + bx, y + 2.4, z + 2.8], [0.18, 0.44, 0.32], materials.coral);
    }
    // Miniature developer robot mascot figurine on bookshelf
    addBox(parent, [x + 2.8, y + 3.32, z + 2.8], [0.18, 0.22, 0.18], materials.brass);
    addSphere(parent, [x + 2.8, y + 3.48, z + 2.8], [0.1, 0.1, 0.1], materials.screenGlow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.8, y + 1.8, z + 2.8], [1.2, 1.8, 0.28]);

    // Architecture Whiteboard with real diagram texture on partition wall
    const wb = new THREE.Group();
    wb.position.set(x - 4.2, y + 1.8, z);
    wb.rotation.y = Math.PI * 0.5;
    parent.add(wb);
    addBox(wb, [0, 0, 0], [3.2, 1.8, 0.06], materials.trim);
    addBox(wb, [0, 0, 0.04], [3.0, 1.6, 0.02], materials.whiteboardDiagram, { shadow: false });
    // Marker tray & dry-erase markers
    addBox(wb, [0, -0.92, 0.08], [2.2, 0.04, 0.12], materials.metalDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.2, y + 1.8, z], [0.1, 0.9, 1.6]);
  } else if (id === 'garage') {
    // =========================================================================
    // 4. GARASI (Ground Floor Far Right, x = 21.0, y = 0, z = -1.5)
    // BMW M-Series sports car, painted guide lines, heavy-duty rolling tool chest,
    // mechanic workbench with cast-iron vise, tool pegboard, tire storage rack
    // =========================================================================
    // Painted garage parking boundary guide lines
    addBox(parent, [x - 1.4, y + 0.008, z - 0.5], [0.14, 0.01, 5.2], materials.trim, { shadow: false });
    addBox(parent, [x + 1.4, y + 0.008, z - 0.5], [0.14, 0.01, 5.2], materials.trim, { shadow: false });
    addBox(parent, [x, y + 0.008, z - 3.1], [2.94, 0.01, 0.14], materials.trim, { shadow: false });

    // Build Stylized BMW M-Series Sports Car (x = 21.0, z = -0.5)
    buildSportsCar(parent, x, y, z - 0.5);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.75, z - 0.5], [1.15, 0.75, 2.3]);

    // Heavy-duty hydraulic floor trolley jack next to BMW
    const floorJack = new THREE.Group();
    floorJack.position.set(x - 1.8, y + 0.12, z + 1.6);
    floorJack.rotation.y = 0.5;
    parent.add(floorJack);
    addBox(floorJack, [0, 0, 0], [0.32, 0.14, 0.85], materials.coral);
    addCylinder(floorJack, [0, 0.15, -0.2], 0.09, 0.09, 0.08, materials.metalDark);
    addCylinder(floorJack, [0, 0.45, 0.35], 0.02, 0.02, 0.75, materials.carChrome, { rotation: [0.6, 0, 0] });

    // Red Rolling Heavy-Duty Tool Chest
    const toolChest = new THREE.Group();
    toolChest.position.set(x - 3.4, y + 0.65, z - 3.2);
    parent.add(toolChest);
    addBox(toolChest, [0, 0, 0], [1.4, 1.3, 0.75], materials.coral);
    for (let d = -0.45; d <= 0.45; d += 0.22) {
      addBox(toolChest, [0, d, 0.39], [1.25, 0.16, 0.04], materials.metalDark);
      addBox(toolChest, [0, d, 0.42], [0.35, 0.04, 0.04], materials.carChrome);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.4, y + 0.65, z - 3.2], [0.72, 0.65, 0.4]);

    // Mechanic Workbench on back wall
    addBox(parent, [x + 0.8, y + 0.95, z - 3.6], [3.6, 0.14, 1.2], materials.metalDark);
    addBox(parent, [x - 0.8, y + 0.45, z - 3.6], [0.2, 0.9, 1.0], materials.metalDark);
    addBox(parent, [x + 2.4, y + 0.45, z - 3.6], [0.2, 0.9, 1.0], materials.metalDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 0.8, y + 0.5, z - 3.6], [1.85, 0.5, 0.6]);

    // Tool Pegboard on wall above bench with hanging tools & task lamp
    addBox(parent, [x + 0.8, y + 2.2, z - 4.1], [3.6, 1.6, 0.08], materials.woodEspresso);
    // Chrome hanging tool rail
    addBox(parent, [x + 0.8, y + 2.5, z - 4.02], [3.2, 0.04, 0.04], materials.carChrome);
    // Hanging chrome combination wrenches & pliers
    for (let wx = -1.2; wx <= 1.2; wx += 0.38) {
      addBox(parent, [x + 0.8 + wx, y + 2.22, z - 4.02], [0.06, 0.36, 0.03], materials.carChrome);
    }
    // Red cordless power drill hanging on peg
    addBox(parent, [x - 0.2, y + 1.95, z - 4.0], [0.18, 0.22, 0.12], materials.coral);
    addCylinder(parent, [x - 0.2, y + 2.05, z - 3.9], 0.025, 0.025, 0.18, materials.metalDark, { rotation: [Math.PI * 0.5, 0, 0] });
    // Overhead angled industrial task lamp above workbench
    addCylinder(parent, [x + 0.8, y + 2.92, z - 3.8], 0.18, 0.26, 0.16, materials.brass, { rotation: [0.4, 0, 0] });
    addSphere(parent, [x + 0.8, y + 2.86, z - 3.75], [0.09, 0.09, 0.09], materials.glow, { shadow: false });

    // Heavy metal vise on bench
    addBox(parent, [x - 0.6, y + 1.15, z - 3.3], [0.35, 0.28, 0.35], materials.metalDark);
    // Oil cans on bench
    addCylinder(parent, [x + 1.8, y + 1.15, z - 3.4], 0.08, 0.08, 0.26, materials.yellowSun);
    addCylinder(parent, [x + 2.1, y + 1.15, z - 3.4], 0.08, 0.08, 0.26, materials.carPaintBlue);

    // Performance Tire Storage Rack along East wall (Industrial 4-post open steel rack)
    const rackX = x + 4.2;
    // 4 vertical matte black steel square posts
    for (const pz of [z - 1.6, z + 1.6]) {
      addBox(parent, [rackX + 0.18, y + 1.35, pz], [0.08, 2.7, 0.08], materials.metalDark);
      addBox(parent, [rackX - 0.38, y + 1.35, pz], [0.08, 2.7, 0.08], materials.metalDark);
      addBox(parent, [rackX - 0.1, y + 2.65, pz], [0.55, 0.08, 0.08], materials.metalDark);
    }
    // 2 pairs of chrome tubular tire cradle rails (lower tier & upper tier)
    for (const ry of [y + 0.35, y + 1.25]) {
      addCylinder(parent, [rackX + 0.08, ry, z], 0.035, 0.035, 3.25, materials.carChrome, { rotation: [Math.PI * 0.5, 0, 0] });
      addCylinder(parent, [rackX - 0.28, ry, z], 0.035, 0.035, 3.25, materials.carChrome, { rotation: [Math.PI * 0.5, 0, 0] });
    }
    // 6 Performance Rubber Tires with Chrome Alloy Wheels resting on the rails
    for (let tz = -1.2; tz <= 1.2; tz += 0.8) {
      addCylinder(parent, [rackX - 0.1, y + 0.55, z + tz], 0.42, 0.42, 0.35, materials.carRubber, { rotation: [0, 0, Math.PI * 0.5], segments: 16 });
      addCylinder(parent, [rackX - 0.1, y + 0.55, z + tz], 0.26, 0.26, 0.37, materials.carChrome, { rotation: [0, 0, Math.PI * 0.5], segments: 14 });
      addCylinder(parent, [rackX - 0.1, y + 1.45, z + tz], 0.42, 0.42, 0.35, materials.carRubber, { rotation: [0, 0, Math.PI * 0.5], segments: 16 });
      addCylinder(parent, [rackX - 0.1, y + 1.45, z + tz], 0.26, 0.26, 0.37, materials.carChrome, { rotation: [0, 0, Math.PI * 0.5], segments: 14 });
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [rackX - 0.1, y + 1.4, z], [0.38, 1.4, 1.7]);

    // Overhead Industrial LED light fixtures
    for (const lz of [-2.0, 1.0]) {
      addBox(parent, [x, y + 4.75, z + lz], [6.0, 0.08, 0.25], materials.glow, { shadow: false });
    }
  } else if (id === 'bedroom') {
    // =========================================================================
    // 5. MASTER BEDROOM (Upper Floor Left, x = -11.0, y = 5.2, z = -1.5)
    // King-size platform bed, padded headboard, nightstands, wardrobe,
    // balcony lounge armchair, vanity dresser with mirror
    // =========================================================================
    const bed = new THREE.Group();
    bed.position.set(x, y, z - 1.5);
    parent.add(bed);
    // Platform base
    addBox(bed, [0, 0.25, 0], [3.2, 0.45, 3.4], materials.woodDark);
    // Thick mattress
    addBox(bed, [0, 0.65, 0.1], [2.9, 0.42, 3.0], materials.bedLinen);
    // Padded upholstered headboard against back wall
    addBox(bed, [0, 1.45, -1.55], [3.4, 1.8, 0.35], materials.bedLinenDark);
    // Cozy duvet & folded throw
    addBox(bed, [0, 0.75, 0.4], [2.95, 0.22, 2.2], materials.bedLinenDark);
    // Pillows
    addBox(bed, [-0.75, 0.95, -0.9], [0.95, 0.22, 0.55], materials.bedLinen);
    addBox(bed, [0.75, 0.95, -0.9], [0.95, 0.22, 0.55], materials.bedLinen);
    addBox(bed, [0, 0.92, -0.75], [0.55, 0.2, 0.35], materials.cushionYellow);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.6, z - 1.5], [1.65, 0.6, 1.75]);

    // Bedside Nightstands with designer drum shade lamps & accessories
    for (const side of [-1, 1]) {
      const nx = x + side * 2.2;
      addBox(parent, [nx, y + 0.45, z - 3.0], [0.8, 0.85, 0.7], materials.woodWarm);
      // Designer lamp
      addCylinder(parent, [nx, y + 0.92, z - 3.0], 0.16, 0.16, 0.03, materials.brass);
      addCylinder(parent, [nx, y + 1.12, z - 3.0], 0.02, 0.02, 0.38, materials.brass);
      addCylinder(parent, [nx, y + 1.32, z - 3.0], 0.22, 0.26, 0.32, materials.cream, { segments: 16 });
      addSphere(parent, [nx, y + 1.30, z - 3.0], [0.08, 0.08, 0.08], materials.glow, { shadow: false });
      // Bedside accessories
      if (side === -1) {
        // Modern minimalist alarm clock
        addBox(parent, [nx - 0.18, y + 0.94, z - 2.85], [0.16, 0.12, 0.08], materials.metalDark);
        addBox(parent, [nx - 0.18, y + 0.94, z - 2.8], [0.14, 0.10, 0.02], materials.screenGlow, { shadow: false });
      } else {
        // Water carafe & glass tumbler
        addCylinder(parent, [nx + 0.18, y + 0.98, z - 2.85], 0.05, 0.06, 0.18, materials.glass);
        addCylinder(parent, [nx + 0.28, y + 0.94, z - 2.85], 0.04, 0.04, 0.10, materials.glass);
      }
      addFurnitureCollider(world, RAPIER, staticBodies, [nx, y + 0.45, z - 3.0], [0.42, 0.45, 0.38]);
    }

    // Bedroom Vanity Dresser with round illuminated mirror along East wall
    const dresser = new THREE.Group();
    dresser.position.set(x + 3.8, y, z - 0.5);
    dresser.rotation.y = -Math.PI * 0.5;
    parent.add(dresser);
    addBox(dresser, [0, 0.8, 0], [2.2, 0.85, 0.65], materials.woodWarm);
    // Large round mirror with brass frame
    addCylinder(dresser, [0, 1.85, -0.28], 0.75, 0.75, 0.04, materials.brass, { rotation: [Math.PI * 0.5, 0, 0], segments: 24 });
    addCylinder(dresser, [0, 1.85, -0.26], 0.7, 0.7, 0.02, materials.mirror, { rotation: [Math.PI * 0.5, 0, 0], segments: 24 });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, y + 0.5, z - 0.5], [0.38, 0.5, 1.15]);

    // Bedroom Lounge Armchair near West Balcony door
    const loungeChair = new THREE.Group();
    loungeChair.position.set(x - 3.4, y, z + 1.6);
    loungeChair.rotation.y = 0.6;
    parent.add(loungeChair);
    addBox(loungeChair, [0, 0.48, 0], [1.1, 0.45, 1.1], materials.cushionBlue);
    addBox(loungeChair, [0, 1.1, -0.45], [1.1, 0.9, 0.28], materials.cushionBlue);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.4, y + 0.55, z + 1.6], [0.65, 0.55, 0.65]);

    // Framed art above bed
    addBox(parent, [x, y + 3.2, z - 3.05], [2.4, 1.4, 0.06], materials.artLandscape, { shadow: false });
  } else if (id === 'bathroom') {
    // =========================================================================
    // 6. MASTER BATHROOM (Upper Floor Center, x = 0, y = 5.2, z = -13.5)
    // Freestanding oval bathtub, walk-in glass shower, double floating vanity,
    // modern wall-hung toilet, heated towel rack, potted spa bamboo
    // =========================================================================
    // Freestanding modern soaking tub in center
    const tub = new THREE.Group();
    tub.position.set(x, y + 0.45, z);
    parent.add(tub);
    addBox(tub, [0, 0, 0], [2.4, 0.85, 1.4], materials.ceramic);
    addBox(tub, [0, 0.25, 0], [2.1, 0.7, 1.1], materials.ceramic);
    // Polished chrome freestanding floor spout
    addCylinder(tub, [1.3, 0.4, 0], 0.04, 0.04, 0.85, materials.chrome);
    // Wooden bath tray caddy across soaking tub with candle & washcloth
    addBox(tub, [0, 0.62, 0], [0.45, 0.03, 1.25], materials.woodWarm);
    addCylinder(tub, [0, 0.69, 0.2], 0.04, 0.04, 0.10, materials.cream);
    addSphere(tub, [0, 0.75, 0.2], [0.015, 0.025, 0.015], materials.fire, { shadow: false });
    addBox(tub, [0, 0.66, -0.25], [0.18, 0.05, 0.28], materials.cushionMint);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.45, z], [1.25, 0.45, 0.75]);

    // Spa potted bamboo in corner
    addCylinder(parent, [x + 3.8, y + 0.4, z - 3.2], 0.3, 0.22, 0.7, materials.ceramicTerracotta, { segments: 16 });
    for (let b = -0.12; b <= 0.12; b += 0.12) {
      addCylinder(parent, [x + 3.8 + b, y + 1.4, z - 3.2], 0.025, 0.025, 1.4, materials.foliageDark);
      addSphere(parent, [x + 3.8 + b, y + 2.05, z - 3.2], [0.22, 0.14, 0.22], materials.foliageBright);
    }

    // Walk-in glass shower enclosure in rear corner (x: [-3.5, -1.5])
    addBox(parent, [x - 2.8, y + 1.9, z - 2.4], [1.8, 3.8, 0.08], materials.glass);
    addBox(parent, [x - 1.9, y + 1.9, z - 3.2], [0.08, 3.8, 1.6], materials.glass);
    addCylinder(parent, [x - 2.8, y + 3.4, z - 3.2], 0.22, 0.22, 0.05, materials.chrome);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.8, y + 1.9, z - 2.4], [0.9, 1.9, 0.08]);

    // Double floating vanity with backlit LED mirror along East wall (x = 3.8)
    const vanityX = x + 3.8;
    addBox(parent, [vanityX, y + 0.85, z], [1.0, 0.48, 3.2], materials.woodDark);
    addBox(parent, [vanityX, y + 1.1, z], [1.05, 0.08, 3.3], materials.ceramic);
    for (const vz of [-0.75, 0.75]) {
      addCylinder(parent, [vanityX, y + 1.2, z + vz], 0.35, 0.28, 0.16, materials.ceramic, { segments: 16 });
      addCylinder(parent, [vanityX + 0.35, y + 1.35, z + vz], 0.03, 0.03, 0.32, materials.chrome);
    }
    // Double backlit mirrors
    for (const vz of [-0.75, 0.75]) {
      addBox(parent, [vanityX + 0.48, y + 2.3, z + vz], [0.06, 1.6, 1.1], materials.mirror);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [vanityX, y + 0.7, z], [0.55, 0.7, 1.65]);

    // Heated towel ladder with bath towels
    const towelRack = new THREE.Group();
    towelRack.position.set(x - 3.8, y + 1.4, z + 1.2);
    towelRack.rotation.y = Math.PI * 0.5;
    parent.add(towelRack);
    addCylinder(towelRack, [-0.4, 0, 0], 0.025, 0.025, 2.2, materials.chrome);
    addCylinder(towelRack, [0.4, 0, 0], 0.025, 0.025, 2.2, materials.chrome);
    for (let ty = -0.8; ty <= 0.8; ty += 0.4) {
      addCylinder(towelRack, [0, ty, 0], 0.02, 0.02, 0.8, materials.chrome, { rotation: [0, 0, Math.PI * 0.5] });
      addBox(towelRack, [0, ty, 0.04], [0.65, 0.25, 0.08], materials.cream);
    }
  } else if (id === 'experience') {
    // =========================================================================
    // 7. LIBRARY NOOK (Upper Floor Right, x = 10.5, y = 5.2, z = -1.5)
    // Full-height bookshelves with rolling brass library ladder, hundreds of books,
    // wingback chair, brass floor reading lamp, antique globe, side table
    // =========================================================================
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(x + 4.2, y, z);
    parent.add(shelfGroup);
    // Backing panel against East wall (+x)
    addBox(shelfGroup, [0.22, 2.4, 0], [0.08, 4.8, 5.8], materials.woodDark);
    // Outer casing (top, bottom, and side panels)
    addBox(shelfGroup, [0, 0.1, 0], [0.52, 0.2, 5.8], materials.woodDark);
    addBox(shelfGroup, [0, 4.7, 0], [0.52, 0.2, 5.8], materials.woodDark);
    addBox(shelfGroup, [0, 2.4, -2.85], [0.52, 4.8, 0.1], materials.woodDark);
    addBox(shelfGroup, [0, 2.4, 2.85], [0.52, 4.8, 0.1], materials.woodDark);
    for (let sy = 0.6; sy <= 4.4; sy += 0.72) {
      addBox(shelfGroup, [-0.02, sy, 0], [0.46, 0.06, 5.6], materials.woodWarm);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 4.2, y + 2.4, z], [0.32, 2.4, 2.9]);

    // Rich bookshelf contents facing west (-x) into the room
    const bookColors = [materials.coral, materials.yellowSun, materials.blueSky, materials.mint, materials.pinkRose, materials.woodDark];
    for (let row = 0; row < 5; row += 1) {
      const by = 0.95 + row * 0.72;
      for (let bz = -2.35; bz <= 2.35; bz += 0.32) {
        const seed = Math.abs(Math.sin(bz * 13.7 + row * 5.3));
        const bookH = 0.38 + seed * 0.16;
        const bookW = 0.18 + (seed % 0.1) * 0.8;
        const isLeaning = seed > 0.82 && bz < 2.0;
        addBox(
          shelfGroup,
          [-0.08, by - 0.24 + bookH * 0.5, bz],
          [0.32, bookH, bookW],
          bookColors[Math.abs(Math.round(bz * 7 + row)) % bookColors.length],
          isLeaning ? { rotation: [0.18, 0, 0] } : {}
        );
      }
      // Brass bookends at edges
      addBox(shelfGroup, [-0.08, by, -2.55], [0.34, 0.32, 0.05], materials.brass);
      addBox(shelfGroup, [-0.08, by, 2.55], [0.34, 0.32, 0.05], materials.brass);
    }

    // Potted indoor succulent on shelf 3
    addCylinder(shelfGroup, [-0.08, 0.95 + 2 * 0.72 + 0.1, 1.8], 0.14, 0.1, 0.18, materials.ceramic, { segments: 12 });
    addSphere(shelfGroup, [-0.08, 0.95 + 2 * 0.72 + 0.25, 1.8], [0.16, 0.12, 0.16], materials.foliageBright);

    // Antique globe on shelf 4
    addCylinder(shelfGroup, [-0.08, 0.95 + 3 * 0.72 + 0.08, -1.8], 0.16, 0.16, 0.04, materials.brass);
    addCylinder(shelfGroup, [-0.08, 0.95 + 3 * 0.72 + 0.22, -1.8], 0.02, 0.02, 0.26, materials.brass);
    addSphere(shelfGroup, [-0.08, 0.95 + 3 * 0.72 + 0.36, -1.8], [0.16, 0.16, 0.16], materials.bluePastel);

    // Rolling brass library ladder
    const ladder = new THREE.Group();
    ladder.position.set(x + 3.8, y + 2.1, z - 1.2);
    ladder.rotation.z = -0.18;
    parent.add(ladder);
    addCylinder(ladder, [-0.22, 0, 0], 0.03, 0.03, 4.4, materials.brass);
    addCylinder(ladder, [0.22, 0, 0], 0.03, 0.03, 4.4, materials.brass);
    for (let r = -1.8; r <= 1.8; r += 0.4) {
      addCylinder(ladder, [0, r, 0], 0.02, 0.02, 0.44, materials.brass, { rotation: [0, 0, Math.PI * 0.5] });
    }

    // Cozy Wingback Chair with soft yellow cushion & footstool
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x - 1.8, y, z + 1.2);
    chairGroup.rotation.y = -0.45;
    parent.add(chairGroup);
    addBox(chairGroup, [0, 0.52, 0], [1.05, 0.48, 1.05], materials.coral);
    addBox(chairGroup, [0, 1.15, -0.42], [1.05, 0.95, 0.28], materials.coral);
    addBox(chairGroup, [-0.48, 0.85, 0], [0.24, 0.65, 1.05], materials.coral);
    addBox(chairGroup, [0.48, 0.85, 0], [0.24, 0.65, 1.05], materials.coral);
    addBox(chairGroup, [0, 0.65, -0.1], [0.4, 0.35, 0.18], materials.cushionYellow, { rotation: [0.15, 0, 0] });
    addBox(chairGroup, [0, 0.35, 1.2], [0.72, 0.38, 0.72], materials.cushionYellow);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.8, y + 0.6, z + 1.2], [0.65, 0.6, 0.65]);

    // Brass floor reading lamp
    addCylinder(parent, [x - 0.4, y + 1.6, z + 1.6], 0.03, 0.03, 3.2, materials.brass);
    addCylinder(parent, [x - 0.4, y + 0.04, z + 1.6], 0.36, 0.36, 0.08, materials.brass, { segments: 16 });
    addSphere(parent, [x - 0.4, y + 2.95, z + 1.6], [0.14, 0.14, 0.14], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 0.4, y + 0.8, z + 1.6], [0.25, 0.8, 0.25]);

    // Side table with teacup and antique globe
    addCylinder(parent, [x - 1.2, y + 0.38, z - 0.5], 0.42, 0.42, 0.06, materials.woodDark, { segments: 16 });
    addCylinder(parent, [x - 1.2, y + 0.18, z - 0.5], 0.06, 0.06, 0.36, materials.woodDark);
    addSphere(parent, [x - 1.2, y + 0.65, z - 0.5], [0.18, 0.18, 0.18], materials.bluePastel);
    addCylinder(parent, [x - 1.2, y + 0.46, z - 0.5], 0.22, 0.22, 0.02, materials.brass);
  } else if (id === 'process') {
    // =========================================================================
    // 8. CREATIVE STUDIO (Upper Floor Far Right, x = 21.0, y = 5.2, z = -1.5)
    // Architect drafting table, studio monitors, acoustic foam, electric guitar,
    // music production workstation with 61-key MIDI keyboard and DAW waveform screen
    // =========================================================================
    // Tilt-top Architect Drafting Table
    const desk = new THREE.Group();
    desk.position.set(x - 2.8, y, z);
    parent.add(desk);
    addBox(desk, [0, 1.05, 0], [2.4, 0.12, 1.6], materials.woodWarm, { rotation: [-0.22, 0, 0] });
    addBox(desk, [-1.05, 0.5, 0], [0.14, 1.0, 1.3], materials.metalDark);
    addBox(desk, [1.05, 0.5, 0], [0.14, 1.0, 1.3], materials.metalDark);
    addBox(desk, [0, 1.15, 0], [1.6, 0.02, 1.1], materials.trim, { rotation: [-0.22, 0, 0] });
    addCylinder(desk, [0.85, 1.25, 0.4], 0.06, 0.06, 0.95, materials.blueSky, { rotation: [0, 0, Math.PI * 0.5] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.8, y + 0.6, z], [1.25, 0.6, 0.85]);

    // Music Production Station along East wall: Desk, 61-Key MIDI Keyboard, Audio Interface & DAW Monitor
    const musicStation = new THREE.Group();
    musicStation.position.set(x + 3.8, y, z);
    musicStation.rotation.y = -Math.PI * 0.5;
    parent.add(musicStation);
    addBox(musicStation, [0, 0.95, 0], [2.8, 0.12, 1.2], materials.woodDark);
    // 61-Key MIDI Keyboard
    addBox(musicStation, [0, 1.05, 0.25], [1.6, 0.08, 0.4], materials.ink);
    addBox(musicStation, [0, 1.1, 0.3], [1.5, 0.03, 0.28], materials.cream);
    // Studio Audio Interface Box on desk with glowing knob
    addBox(musicStation, [-0.95, 1.05, 0.1], [0.38, 0.12, 0.28], materials.coral);
    addCylinder(musicStation, [-0.95, 1.13, 0.1], 0.04, 0.04, 0.04, materials.brass);
    addSphere(musicStation, [-0.95, 1.14, 0.1], [0.02, 0.02, 0.02], materials.glow, { shadow: false });
    // Studio reference headphones resting next to interface
    addCylinder(musicStation, [-0.95, 1.04, 0.38], 0.09, 0.09, 0.05, materials.metalDark, { rotation: [0, 0, Math.PI * 0.5] });
    // DAW Audio Waveform Screen
    addBox(musicStation, [0, 1.65, -0.2], [1.4, 0.85, 0.06], materials.metalDark);
    addBox(musicStation, [0, 1.65, -0.16], [1.32, 0.76, 0.02], materials.screenDAW, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, y + 0.5, z], [0.65, 0.5, 1.45]);

    // Studio Sound Acoustic Foam Wall Panels along East wall
    for (let py = 1.2; py <= 3.8; py += 1.2) {
      for (let pz = -2.0; pz <= 2.0; pz += 1.2) {
        addBox(parent, [x + 4.85, y + py, z + pz], [0.08, 1.0, 1.0], materials.acousticFoam);
      }
    }

    // Electric Guitar on stand in corner
    const guitar = new THREE.Group();
    guitar.position.set(x + 3.8, y, z + 2.4);
    guitar.rotation.set(0.15, -0.4, 0);
    parent.add(guitar);
    addCylinder(guitar, [0, 0.45, 0], 0.03, 0.03, 0.9, materials.metalDark);
    addBox(guitar, [0, 0.55, 0.08], [0.45, 0.65, 0.1], materials.coral);
    addBox(guitar, [0, 1.25, 0.08], [0.1, 0.8, 0.06], materials.woodWarm);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, y + 0.7, z + 2.4], [0.35, 0.7, 0.35]);
  } else if (id === 'contact') {
    // =========================================================================
    // 9. GARDEN TERRACE (Ground Floor Rear, x = 0.0, y = 0, z = -22.5)
    // Outdoor teak sofa, coffee table, terrace pergola with wisteria pods,
    // modern stainless BBQ grill, terracotta planters
    // =========================================================================
    // Modern Luxury Teak Outdoor Sofa
    const teakSofa = new THREE.Group();
    teakSofa.position.set(x + 3.8, y, z);
    teakSofa.rotation.y = -Math.PI * 0.5;
    parent.add(teakSofa);
    addBox(teakSofa, [0, 0.42, 0], [3.2, 0.38, 1.1], materials.woodWarm);
    addBox(teakSofa, [0, 0.9, -0.42], [3.2, 0.65, 0.24], materials.woodWarm);
    addBox(teakSofa, [0, 0.55, 0], [3.0, 0.15, 0.95], materials.cushionMint);
    addBox(teakSofa, [-1.55, 0.65, 0], [0.18, 0.55, 1.1], materials.woodWarm);
    addBox(teakSofa, [1.55, 0.65, 0], [0.18, 0.55, 1.1], materials.woodWarm);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8, y + 0.5, z], [0.6, 0.5, 1.65]);

    // Low Teak Coffee Table
    addBox(parent, [x + 2.2, y + 0.42, z], [1.1, 0.38, 1.8], materials.woodWarm);
    addCylinder(parent, [x + 2.2, y + 0.65, z - 0.3], 0.14, 0.14, 0.32, materials.glass);
    addCylinder(parent, [x + 2.2, y + 0.55, z + 0.3], 0.08, 0.07, 0.16, materials.ceramicTeal);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.2, y + 0.25, z], [0.55, 0.25, 0.9]);

    // Stainless Steel Modern Outdoor BBQ Grill Station with Granite Prep Counter
    const grill = new THREE.Group();
    grill.position.set(x - 3.8, y + 0.65, z - 1.2);
    grill.rotation.y = Math.PI * 0.5;
    parent.add(grill);
    addBox(grill, [0, 0, 0], [1.5, 0.9, 0.75], materials.carChrome);
    addBox(grill, [0, 0.65, -0.05], [1.46, 0.42, 0.7], materials.metalDark);
    addCylinder(grill, [0, 0.75, 0.3], 0.025, 0.025, 0.95, materials.carChrome, { rotation: [0, 0, Math.PI * 0.5] });
    // Granite food prep counter next to grill
    addBox(parent, [x - 3.8, y + 0.52, z + 0.8], [0.85, 0.94, 1.8], materials.wainscot);
    addBox(parent, [x - 3.8, y + 1.02, z + 0.8], [0.95, 0.08, 1.9], materials.stone);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.8, y + 0.65, z - 1.2], [0.45, 0.65, 0.85]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.8, y + 0.55, z + 0.8], [0.5, 0.55, 1.0]);

    // Pergola overhead with ambient hanging lanterns
    const perg = new THREE.Group();
    perg.position.set(x + 3.8, y, z);
    parent.add(perg);
    addCylinder(perg, [-1.3, 2.4, -1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addCylinder(perg, [1.3, 2.4, -1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addCylinder(perg, [-1.3, 2.4, 1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addCylinder(perg, [1.3, 2.4, 1.8], 0.12, 0.14, 4.8, materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 - 1.3, y + 2.4, z - 1.8], [0.15, 2.4, 0.15]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 + 1.3, y + 2.4, z - 1.8], [0.15, 2.4, 0.15]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 - 1.3, y + 2.4, z + 1.8], [0.15, 2.4, 0.15]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.8 + 1.3, y + 2.4, z + 1.8], [0.15, 2.4, 0.15]);
    for (let rz = -1.8; rz <= 1.8; rz += 0.9) {
      addBox(perg, [0, 4.75, rz], [3.2, 0.18, 0.14], materials.woodWarm);
    }
    // Ambient hanging lantern under pergola
    addCylinder(perg, [0, 4.2, 0], 0.02, 0.02, 0.9, materials.brass);
    addBox(perg, [0, 3.65, 0], [0.28, 0.38, 0.28], materials.metalDark);
    addSphere(perg, [0, 3.65, 0], [0.12, 0.12, 0.12], materials.glow, { shadow: false });

    // Terracotta planters flanking the French doors to terrace
    for (const px of [-2.8, 2.8]) {
      addCylinder(parent, [x + px, y + 0.35, -18.8], 0.32, 0.24, 0.65, materials.terracotta, { segments: 16 });
      addSphere(parent, [x + px, y + 0.85, -18.8], [0.45, 0.45, 0.45], materials.foliageBright);
      addSphere(parent, [x + px + 0.1, y + 0.95, -18.75], [0.1, 0.1, 0.1], materials.coral);
    }
  }
}

/**
 * Builds stylized BMW M-Series Sports Car in the garage bay
 */
function buildSportsCar(parent, x, y, z) {
  const car = new THREE.Group();
  car.position.set(x, y, z);
  parent.add(car);

  // 1. Lower chassis / aerodynamic side skirts
  addBox(car, [0, 0.22, 0], [2.15, 0.2, 4.4], materials.metalDark);

  // 2. Main White Aerodynamic Bodywork
  addBox(car, [0, 0.52, 0], [2.05, 0.42, 4.3], materials.carPaintWhite);
  // Sloping aggressive hood
  addBox(car, [0, 0.62, 1.1], [1.95, 0.24, 1.8], materials.carPaintWhite, { rotation: [0.06, 0, 0] });

  // 3. Iconic BMW Kidney Grilles (twin kidneys with chrome bezel & black vertical slats)
  for (const side of [-1, 1]) {
    const gx = side * 0.32;
    addBox(car, [gx, 0.52, 2.18], [0.26, 0.24, 0.06], materials.carChrome);
    addBox(car, [gx, 0.52, 2.2], [0.22, 0.2, 0.04], materials.ink);
  }

  // 4. Aggressive LED Headlights with Angel-Eye Halo Glow
  for (const side of [-1, 1]) {
    const hx = side * 0.78;
    addBox(car, [hx, 0.58, 2.12], [0.38, 0.14, 0.08], materials.carChrome);
    addSphere(car, [hx, 0.58, 2.15], [0.16, 0.06, 0.04], materials.glow, { shadow: false });
  }

  // 5. Sleek Aerodynamic Greenhouse & Sport Interior Cockpit
  // Dark interior cockpit tub
  addBox(car, [0, 0.78, -0.2], [1.45, 0.22, 1.8], materials.ink);
  // Dual coral leather sports bucket seats
  for (const sx of [-0.38, 0.38]) {
    addBox(car, [sx, 0.88, -0.25], [0.4, 0.18, 0.45], materials.coral);
    addBox(car, [sx, 1.08, -0.46], [0.38, 0.34, 0.1], materials.coral);
    addBox(car, [sx, 1.28, -0.46], [0.22, 0.14, 0.08], materials.metalDark);
  }
  // M-Sport steering wheel & dashboard
  addBox(car, [0, 0.86, 0.48], [1.35, 0.22, 0.35], materials.metalDark);
  addCylinder(car, [0.38, 0.98, 0.38], 0.14, 0.14, 0.03, materials.metalDark, { rotation: [0.55, 0, 0] });

  // Aerodynamic Carbon Fiber Roof
  addBox(car, [0, 1.28, -0.2], [1.52, 0.06, 2.05], materials.metalDark);

  // Front Windshield (thin tinted glass flush between hood and roof)
  addBox(car, [0, 1.02, 0.54], [1.46, 0.03, 0.78], materials.carGlass, { rotation: [0.72, 0, 0] });
  // A-Pillars flanking windshield
  for (const side of [-1, 1]) {
    addBox(car, [side * 0.74, 1.02, 0.54], [0.06, 0.05, 0.82], materials.carPaintWhite, { rotation: [0.72, 0, 0] });
  }

  // Rear Windshield (sloping fastback rake)
  addBox(car, [0, 1.02, -1.02], [1.46, 0.03, 0.78], materials.carGlass, { rotation: [-0.68, 0, 0] });
  // C-Pillars flanking rear windshield
  for (const side of [-1, 1]) {
    addBox(car, [side * 0.74, 1.02, -1.02], [0.06, 0.05, 0.82], materials.carPaintWhite, { rotation: [-0.68, 0, 0] });
  }

  // Side Windows
  for (const side of [-1, 1]) {
    addBox(car, [side * 0.78, 1.02, -0.2], [0.03, 0.42, 1.45], materials.carGlass);
    // B-Pillar divider
    addBox(car, [side * 0.79, 1.02, -0.15], [0.035, 0.44, 0.06], materials.metalDark);
  }

  // Dual aerodynamic side mirrors in gloss black
  for (const side of [-1, 1]) {
    addBox(car, [side * 1.05, 0.92, 0.58], [0.2, 0.1, 0.16], materials.metalDark);
  }

  // 6. Rear M-Series Quad Exhaust Pipes & Tail Lights
  for (const side of [-1, 1]) {
    addBox(car, [side * 0.78, 0.68, -2.16], [0.38, 0.12, 0.06], materials.coral);
    for (const ex of [-0.08, 0.08]) {
      addCylinder(car, [side * 0.52 + ex, 0.22, -2.2], 0.055, 0.055, 0.18, materials.carChrome, { rotation: [Math.PI * 0.5, 0, 0], segments: 12 });
    }
  }

  // 7. Wheels & M-Sport Alloy Rims with Blue Calipers
  const wheelPositions = [
    [-1.02, 0.36, 1.35],
    [1.02, 0.36, 1.35],
    [-1.02, 0.36, -1.35],
    [1.02, 0.36, -1.35],
  ];
  for (const [wx, wy, wz] of wheelPositions) {
    const wheel = new THREE.Group();
    wheel.position.set(wx, wy, wz);
    car.add(wheel);
    addCylinder(wheel, [0, 0, 0], 0.36, 0.36, 0.28, materials.carRubber, { rotation: [0, 0, Math.PI * 0.5], segments: 20 });
    addCylinder(wheel, [wx < 0 ? -0.02 : 0.02, 0, 0], 0.25, 0.25, 0.26, materials.carChrome, { rotation: [0, 0, Math.PI * 0.5], segments: 16 });
    addBox(wheel, [0, 0.11, 0], [0.07, 0.15, 0.11], materials.blueSky);
  }

  return car;
}
