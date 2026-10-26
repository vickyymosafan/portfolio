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
  // 8 Grand Themed Rooms across Ground Floor (y = 0) and Lantai 2 (y = 5.2)
  // Matching Vicky's World Map:
  // Lantai 1: Project Gallery, Living Room, Home Office, Garasi
  // Lantai 2: Master Bedroom, Bathroom, Library Nook, Creative Studio
  const roomSpecs = [
    // --- LANTAI 1 (GROUND FLOOR, y = 0.0) ---
    { id: 'about', x: 0.0, y: 0.0, z: -2.0, title: 'Beyond the Code', subtitle: 'CHAPTER 01 · ABOUT ME', accent: palette.coral, rugMat: materials.carpetPersian },
    { id: 'projects', x: -11.0, y: 0.0, z: -2.0, title: 'The Artifact Gallery', subtitle: 'CHAPTER 03 · PROJECTS', accent: palette.pinkRose, rugMat: materials.carpetBauhaus },
    { id: 'skills', x: 10.75, y: 0.0, z: -2.0, title: 'The Engineering Workshop', subtitle: 'CHAPTER 04 · SKILLS & TOOLS', accent: palette.blueSky, rugMat: materials.blue },
    { id: 'garage', x: 21.0, y: 0.0, z: -2.0, title: 'Private Garage & Workshop', subtitle: 'BMW M-SERIES & TOOLS', accent: palette.goldBrass, rugMat: materials.epoxyFloor },
    { id: 'contact', x: 0.0, y: 0.0, z: -11.8, title: 'The Final Scene', subtitle: 'COME SAY HELLO', accent: palette.coral, rugMat: materials.terraceTiles },

    // --- LANTAI 2 (SECOND FLOOR, y = 5.2m) ---
    { id: 'bedroom', x: -11.0, y: 5.2, z: -2.0, title: 'Master Bedroom', subtitle: 'REST & RECHARGE', accent: palette.bluePastel, rugMat: materials.carpetBauhaus },
    { id: 'bathroom', x: 0.0, y: 5.2, z: -2.0, title: 'Master Bathroom', subtitle: 'RELAX & REFRESH', accent: palette.mintSage, rugMat: materials.bathroomTile },
    { id: 'experience', x: 10.75, y: 5.2, z: -2.0, title: 'The Engineering Journey', subtitle: 'STORY & MILESTONES', accent: palette.yellowSun, rugMat: materials.carpetPersian },
    { id: 'process', x: 21.0, y: 5.2, z: -2.0, title: 'Creative Studio', subtitle: 'CHAPTER 02 · PROCESS', accent: palette.mintSage, rugMat: materials.mint },
  ];

  for (let i = 0; i < roomSpecs.length; i += 1) {
    const spec = roomSpecs[i];

    // Custom area rug for non-garage/bathroom spaces
    if (spec.id !== 'garage' && spec.id !== 'bathroom' && spec.id !== 'contact') {
      const rugW = spec.id === 'about' ? 7.8 : 8.4;
      const rugD = spec.id === 'about' ? 6.4 : 6.4;
      addBox(building, [spec.x, spec.y + 0.005, spec.z], [rugW, 0.02, rugD], spec.rugMat, { receive: true, shadow: false });
    }

    // Presentation Display Board Mounted on back wall of room (leaving center clear)
    if (spec.id !== 'garage' && spec.id !== 'bathroom' && spec.id !== 'bedroom') {
      createDisplayBoard(building, spec, world, RAPIER, staticBodies);
    }

    // Room-specific furnishings with physics colliders
    buildRoomFurniture(building, spec, world, RAPIER, staticBodies);

    // Interactive glowing floor beacon placed conveniently in front/center of each room
    const beaconX = spec.x;
    const beaconZ = spec.id === 'contact' ? -11.8 : -1.5;
    createFloorBeacon(building, beaconX, spec.y, beaconZ, spec.accent);

    // Register interaction point covering the full room bay
    const roomInfo = portfolio.rooms.find((r) => r.id === spec.id);
    interactionPoints.push({
      id: spec.id,
      title: roomInfo ? roomInfo.title : spec.subtitle,
      position: new THREE.Vector3(beaconX, spec.y + 0.9, beaconZ),
      radius: 6.8,
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
  const { x, y, id, title, subtitle, accent } = room;

  // Mount seamlessly on the back wall of the room (z = -7.8)
  const bx = x;
  const by = y;
  const bz = id === 'contact' ? -15.2 : -7.8;

  const display = new THREE.Group();
  display.position.set(bx, by, bz);
  parent.add(display);

  // Wall mounted plaque frame
  addBox(display, [0, 2.8, 0.08], [3.6, 2.0, 0.1], materials.woodDark);

  // Canvas sign texture
  const signTex = createSignTexture(title, subtitle, accent, 512, 340);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.8),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45, metalness: 0.05 })
  );
  signMesh.position.set(0, 2.8, 0.14);
  display.add(signMesh);

  // Brass picture lamp over board
  addBox(display, [0, 3.9, 0.25], [1.8, 0.08, 0.16], materials.brass);
  addSphere(display, [0, 3.82, 0.25], [0.16, 0.06, 0.16], materials.glow, { shadow: false });
}

function buildRoomFurniture(parent, room, world, RAPIER, staticBodies) {
  const { x, y, z, id } = room;

  if (id === 'about') {
    // =========================================================================
    // 1. GRAND LIVING ROOM (Lantai 1 Center, x = 0.0, y = 0.0, z = -2.0)
    // Curving contemporary sectional sofa, round coffee table, media wall with OLED TV,
    // fireplace, brass ring chandelier, potted palms, open to front porch
    // =========================================================================

    // Modern Sculptural Ring Chandelier (y = 4.8)
    const chandelier = new THREE.Group();
    chandelier.position.set(x, y + 4.6, z);
    parent.add(chandelier);
    addCylinder(chandelier, [0, 0, 0], 1.6, 1.6, 0.1, materials.brass, { segments: 24 });
    addCylinder(chandelier, [0, -0.04, 0], 1.5, 1.5, 0.06, materials.glow, { segments: 24, shadow: false });
    for (let c = 0; c < 3; c += 1) {
      const angle = (c / 3) * Math.PI * 2;
      addCylinder(chandelier, [Math.cos(angle) * 1.5, 0.35, Math.sin(angle) * 1.5], 0.015, 0.015, 0.7, materials.brass);
    }

    // Curved Contemporary Sectional Sofa facing forward (+Z)
    // Center curved section
    addBox(parent, [x, y + 0.42, z - 0.2], [4.4, 0.45, 1.2], materials.coral);
    addBox(parent, [x, y + 0.95, z - 0.7], [4.4, 0.65, 0.32], materials.coral);
    // Left wing
    addBox(parent, [x - 2.2, y + 0.42, z + 0.5], [1.2, 0.45, 1.8], materials.coral);
    addBox(parent, [x - 2.7, y + 0.65, z + 0.5], [0.3, 0.6, 1.8], materials.coral);
    // Right wing
    addBox(parent, [x + 2.2, y + 0.42, z + 0.5], [1.2, 0.45, 1.8], materials.coral);
    addBox(parent, [x + 2.7, y + 0.65, z + 0.5], [0.3, 0.6, 1.8], materials.coral);

    // Decorative throw cushions on sofa
    addBox(parent, [x - 1.4, y + 0.8, z - 0.5], [0.45, 0.45, 0.22], materials.cushionYellow, { rotation: [0.1, 0.2, 0] });
    addBox(parent, [x + 1.4, y + 0.8, z - 0.5], [0.45, 0.45, 0.22], materials.cushionMint, { rotation: [0.1, -0.2, 0] });
    addBox(parent, [x, y + 0.8, z - 0.5], [0.45, 0.45, 0.22], materials.cushionBlue, { rotation: [0.1, 0, 0] });

    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.5, z - 0.2], [2.2, 0.5, 0.8]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.2, y + 0.5, z + 0.5], [0.65, 0.5, 0.9]);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.2, y + 0.5, z + 0.5], [0.65, 0.5, 0.9]);

    // Low Round Solid Oak & Marble Center Coffee Table
    addCylinder(parent, [x, y + 0.36, z + 0.8], 1.1, 1.1, 0.08, materials.woodDark, { segments: 24 });
    addCylinder(parent, [x, y + 0.18, z + 0.8], 0.28, 0.38, 0.34, materials.brass, { segments: 16 });
    // Decorative ceramic teapot & cups on table
    addSphere(parent, [x + 0.2, y + 0.48, z + 0.8], [0.12, 0.11, 0.12], materials.ceramicTeal);
    addCylinder(parent, [x - 0.2, y + 0.46, z + 0.7], 0.06, 0.05, 0.08, materials.ceramic, { segments: 12 });
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.25, z + 0.8], [1.1, 0.25, 1.1]);

    // Back Feature Media Wall (z = -7.8)
    const mediaWall = new THREE.Group();
    mediaWall.position.set(x, y, z - 5.6);
    parent.add(mediaWall);
    // Dark slatted wood feature panel
    addBox(mediaWall, [0, 2.6, 0], [6.8, 5.0, 0.1], materials.woodSlats);
    // 85" OLED TV Screen showing landscape artwork
    addBox(mediaWall, [0, 2.8, 0.12], [3.8, 2.1, 0.08], materials.metalDark);
    addBox(mediaWall, [0, 2.8, 0.17], [3.65, 1.95, 0.02], materials.artLandscape, { shadow: false });
    // Soundbar
    addBox(mediaWall, [0, 1.55, 0.14], [2.4, 0.14, 0.16], materials.metalDark);
    // Floating media console
    addBox(mediaWall, [0, 0.65, 0.4], [5.0, 0.65, 0.7], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.65, z - 5.2], [2.5, 0.65, 0.4]);

    // Flanking Potted Fiddle-leaf Fig Palms in Ceramic Planters
    for (const px of [-3.8, 3.8]) {
      addCylinder(parent, [x + px, y + 0.45, z + 2.2], 0.45, 0.35, 0.9, materials.ceramicTerracotta, { segments: 16 });
      for (let i = 0; i < 7; i += 1) {
        const angle = (i / 7) * Math.PI * 2;
        addSphere(parent, [x + px + Math.cos(angle) * 0.4, y + 1.4 + (i % 2) * 0.2, z + 2.2 + Math.sin(angle) * 0.4], [0.4, 0.22, 0.4], materials.foliageBright);
      }
      addFurnitureCollider(world, RAPIER, staticBodies, [x + px, y + 0.6, z + 2.2], [0.45, 0.6, 0.45]);
    }
  } else if (id === 'projects') {
    // =========================================================================
    // 2. PROJECT GALLERY (Lantai 1 Left, x = -11.0, y = 0.0, z = -2.0)
    // 3 Large Illuminated Digital Showcase Screens on back wall, gallery bench,
    // museum pedestals with holographic artifacts, spotlight track
    // =========================================================================

    // 3 Large Illuminated Project Wall Showcases on back wall (z = -7.7)
    const showcases = [
      { dx: -3.2, title: 'Beyond-RAG ASI', mat: materials.screenCode },
      { dx: 0.0, title: 'IntelliChat AI', mat: materials.screenGlow },
      { dx: 3.2, title: 'Smart Kost SaaS', mat: materials.screenCad },
    ];

    for (const sc of showcases) {
      const frame = new THREE.Group();
      frame.position.set(x + sc.dx, y + 2.6, z - 5.7);
      parent.add(frame);
      // Modern beveled black frame
      addBox(frame, [0, 0, 0], [2.8, 1.9, 0.1], materials.metalDark);
      // Glowing showcase screen
      addBox(frame, [0, 0, 0.06], [2.6, 1.7, 0.03], sc.mat, { shadow: false });
      // Brass title plaque below screen
      addBox(frame, [0, -1.1, 0.06], [1.6, 0.18, 0.04], materials.brass);
      // Top picture spotlight
      addBox(frame, [0, 1.15, 0.2], [1.2, 0.06, 0.14], materials.brass);
      addSphere(frame, [0, 1.08, 0.2], [0.1, 0.04, 0.1], materials.glow, { shadow: false });
    }

    // Upholstered Gallery Center Bench in Navy Velvet
    addBox(parent, [x, y + 0.45, z + 0.5], [3.2, 0.42, 1.2], materials.cushionBlue);
    addBox(parent, [x - 1.2, y + 0.2, z + 0.5], [0.16, 0.4, 1.1], materials.woodDark);
    addBox(parent, [x + 1.2, y + 0.2, z + 0.5], [0.16, 0.4, 1.1], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.35, z + 0.5], [1.6, 0.35, 0.65]);

    // 2 Flanking Museum Pedestals with Holographic Glass Vitrines
    for (const px of [-3.8, 3.8]) {
      const ped = new THREE.Group();
      ped.position.set(x + px, y, z - 1.2);
      parent.add(ped);
      addBox(ped, [0, 0.55, 0], [1.1, 1.1, 1.1], materials.woodWarm);
      addBox(ped, [0, 1.12, 0], [1.2, 0.08, 1.2], materials.woodDark);
      addBox(ped, [0, 1.75, 0], [1.05, 1.15, 1.05], materials.glass);
      // Rotating core artifact
      if (px < 0) {
        addSphere(ped, [0, 1.75, 0], [0.28, 0.35, 0.28], materials.blueSky, { shadow: false });
        addCylinder(ped, [0, 1.75, 0], 0.45, 0.45, 0.03, materials.brass, { rotation: [0.35, 0, 0.35] });
      } else {
        addBox(ped, [0, 1.75, 0], [0.36, 0.36, 0.36], materials.coral, { shadow: false, rotation: [0.2, 0.4, 0] });
      }
      addFurnitureCollider(world, RAPIER, staticBodies, [x + px, y + 0.9, z - 1.2], [0.62, 0.9, 0.62]);
    }

    // Potted olive tree in front left corner
    addCylinder(parent, [x - 4.2, y + 0.45, z + 2.8], 0.45, 0.35, 0.9, materials.ceramicTerracotta, { segments: 16 });
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      addSphere(parent, [x - 4.2 + Math.cos(angle) * 0.4, y + 1.45, z + 2.8 + Math.sin(angle) * 0.4], [0.35, 0.24, 0.35], materials.foliageMid);
    }
  } else if (id === 'skills') {
    // =========================================================================
    // 3. HOME OFFICE (Lantai 1 Right, x = 10.75, y = 0.0, z = -2.0)
    // Developer battle station: Solid wood desk facing forward (+Z), triple glowing screens,
    // ergonomic mesh chair, custom PC tower with RGB, architecture whiteboard on back wall
    // =========================================================================

    // Executive Developer Desk in warm oak facing forward (+Z)
    addBox(parent, [x, y + 0.95, z - 1.4], [4.6, 0.16, 1.6], materials.woodWarm);
    addBox(parent, [x - 2.1, y + 0.48, z - 1.4], [0.22, 0.95, 1.4], materials.metalDark);
    addBox(parent, [x + 2.1, y + 0.48, z - 1.4], [0.22, 0.95, 1.4], materials.metalDark);
    // Desk mat
    addBox(parent, [x, y + 1.04, z - 1.3], [3.2, 0.02, 1.1], materials.ink);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.55, z - 1.4], [2.3, 0.55, 0.85]);

    // Triple Curved Monitor Setup mounted on desk arms facing forward (+Z)
    const monitorConfigs = [
      { dx: -1.2, rotY: 0.22, mat: materials.screenTerminal },
      { dx: 0.0, rotY: 0.0, mat: materials.screenCode },
      { dx: 1.2, rotY: -0.22, mat: materials.screenCad },
    ];

    for (const mc of monitorConfigs) {
      const mon = new THREE.Group();
      mon.position.set(x + mc.dx, y + 1.62, z - 1.7);
      mon.rotation.y = mc.rotY;
      parent.add(mon);
      addBox(mon, [0, 0, 0], [1.14, 0.74, 0.08], materials.metalDark);
      addBox(mon, [0, 0, 0.045], [1.06, 0.66, 0.02], mc.mat, { shadow: false });
      addCylinder(mon, [0, -0.44, 0], 0.05, 0.05, 0.36, materials.metalDark);
      addBox(mon, [0, -0.6, 0], [0.38, 0.04, 0.28], materials.metalDark);
    }

    // High-End Custom PC Tower with RGB on desk right side
    const pc = new THREE.Group();
    pc.position.set(x + 1.9, y + 1.42, z - 1.4);
    parent.add(pc);
    addBox(pc, [0, 0, 0], [0.45, 0.72, 0.82], materials.metalDark);
    addBox(pc, [-0.23, 0, 0], [0.02, 0.68, 0.78], materials.glass);
    addBox(pc, [-0.05, 0.1, 0], [0.3, 0.25, 0.5], materials.screenGlow, { shadow: false });

    // Ergonomic High-Back Mesh Chair in front of desk
    const chair = new THREE.Group();
    chair.position.set(x, y, z - 0.2);
    parent.add(chair);
    // Base & casters
    addCylinder(chair, [0, 0.1, 0], 0.38, 0.38, 0.06, materials.metalDark, { segments: 16 });
    addCylinder(chair, [0, 0.32, 0], 0.05, 0.05, 0.38, materials.brass);
    // Seat cushion
    addBox(chair, [0, 0.55, 0], [0.75, 0.12, 0.75], materials.metalDark);
    // Mesh backrest
    addBox(chair, [0, 1.15, -0.34], [0.68, 1.05, 0.08], materials.metalDark);
    // Headrest
    addBox(chair, [0, 1.75, -0.34], [0.42, 0.22, 0.08], materials.metalDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.6, z - 0.2], [0.42, 0.6, 0.42]);

    // System Architecture Whiteboard on Back Wall (z = -7.8)
    const wb = new THREE.Group();
    wb.position.set(x, y + 2.8, z - 5.7);
    parent.add(wb);
    addBox(wb, [0, 0, 0], [4.4, 2.2, 0.06], materials.trim);
    addBox(wb, [0, 0, 0.04], [4.2, 2.0, 0.02], materials.whiteboardDiagram, { shadow: false });
    addBox(wb, [0, -1.05, 0.08], [3.2, 0.04, 0.12], materials.metalDark);
  } else if (id === 'garage') {
    // =========================================================================
    // 4. GARASI (Lantai 1 Far-Right, x = 21.0, y = 0.0, z = -2.0)
    // BMW M-Series sports car parked inside, polished dark epoxy floor with guides,
    // rolling red tool chest, workbench with vise, tool pegboard, wall hung sports bike
    // =========================================================================

    // Painted garage parking boundary guide lines
    addBox(parent, [x - 1.4, y + 0.008, z - 0.5], [0.14, 0.01, 5.2], materials.trim, { shadow: false });
    addBox(parent, [x + 1.4, y + 0.008, z - 0.5], [0.14, 0.01, 5.2], materials.trim, { shadow: false });
    addBox(parent, [x, y + 0.008, z - 3.1], [2.94, 0.01, 0.14], materials.trim, { shadow: false });

    // Stylized BMW M-Series Sports Coupe centered inside garage
    buildSportsCar(parent, x, y, z - 0.5);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.75, z - 0.5], [1.15, 0.75, 2.3]);

    // Red Rolling Heavy-Duty Tool Chest against West partition wall
    const toolChest = new THREE.Group();
    toolChest.position.set(x - 3.8, y + 0.65, z - 3.8);
    parent.add(toolChest);
    addBox(toolChest, [0, 0, 0], [1.4, 1.3, 0.75], materials.coral);
    for (let d = -0.45; d <= 0.45; d += 0.22) {
      addBox(toolChest, [0, d, 0.39], [1.25, 0.16, 0.04], materials.metalDark);
      addBox(toolChest, [0, d, 0.42], [0.35, 0.04, 0.04], materials.carChrome);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.8, y + 0.65, z - 3.8], [0.72, 0.65, 0.4]);

    // Mechanic Workbench on back wall (z = -7.4)
    addBox(parent, [x, y + 0.95, z - 5.2], [3.8, 0.14, 1.2], materials.metalDark);
    addBox(parent, [x - 1.6, y + 0.45, z - 5.2], [0.2, 0.9, 1.0], materials.metalDark);
    addBox(parent, [x + 1.6, y + 0.45, z - 5.2], [0.2, 0.9, 1.0], materials.metalDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.5, z - 5.2], [1.95, 0.5, 0.6]);

    // Tool Pegboard on wall above bench with hanging tools & task lamp
    addBox(parent, [x, y + 2.2, z - 5.7], [3.8, 1.6, 0.08], materials.woodEspresso);
    addBox(parent, [x, y + 2.5, z - 5.62], [3.2, 0.04, 0.04], materials.carChrome);
    for (let wx = -1.2; wx <= 1.2; wx += 0.38) {
      addBox(parent, [x + wx, y + 2.22, z - 5.62], [0.06, 0.36, 0.03], materials.carChrome);
    }
    // Heavy metal vise on bench
    addBox(parent, [x - 1.2, y + 1.15, z - 4.9], [0.35, 0.28, 0.35], materials.metalDark);

    // Wall-Mounted Sports Road Bicycle hung on East wall (x = 25.5)
    const bike = new THREE.Group();
    bike.position.set(x + 4.4, y + 2.2, z - 0.5);
    bike.rotation.y = -Math.PI * 0.5;
    parent.add(bike);
    // Wheels
    addCylinder(bike, [-0.85, 0, 0], 0.45, 0.45, 0.05, materials.carRubber, { rotation: [0, 0, Math.PI * 0.5] });
    addCylinder(bike, [0.85, 0, 0], 0.45, 0.45, 0.05, materials.carRubber, { rotation: [0, 0, Math.PI * 0.5] });
    // Frame tubes (cyan sport color)
    addCylinder(bike, [0, 0.25, 0], 0.03, 0.03, 1.2, materials.blueSky, { rotation: [0, 0, 0.35] });
    addCylinder(bike, [0, 0.1, 0], 0.03, 0.03, 1.1, materials.blueSky, { rotation: [0, 0, -0.45] });
    // Handlebars & seat
    addBox(bike, [0.75, 0.6, 0], [0.06, 0.1, 0.45], materials.metalDark);
    addBox(bike, [-0.25, 0.65, 0], [0.26, 0.06, 0.14], materials.metalDark);
  } else if (id === 'bedroom') {
    // =========================================================================
    // 5. MASTER BEDROOM (Lantai 2 Left, x = -11.0, y = 5.2, z = -2.0)
    // King-size platform bed centered against back wall, warm wood headboard panel with
    // sconces, designer bedside nightstands with lamps, plush duvet, wardrobe
    // =========================================================================

    const bed = new THREE.Group();
    bed.position.set(x, y, z - 3.4);
    parent.add(bed);

    // Warm vertical wood headboard feature wall on back wall (z = -7.7)
    addBox(bed, [0, 2.2, -1.9], [6.2, 4.4, 0.1], materials.woodWarm);
    // Padded upholstered backrest
    addBox(bed, [0, 1.35, -1.75], [3.6, 1.5, 0.25], materials.bedLinenDark);
    // Platform bed frame
    addBox(bed, [0, 0.25, 0], [3.4, 0.45, 3.6], materials.woodDark);
    // Thick mattress
    addBox(bed, [0, 0.65, 0.1], [3.1, 0.42, 3.2], materials.bedLinen);
    // Crisp white duvet & folded dark throw blanket
    addBox(bed, [0, 0.75, 0.4], [3.15, 0.22, 2.4], materials.bedLinenDark);
    // Fluffy pillows
    addBox(bed, [-0.85, 0.95, -1.0], [1.0, 0.22, 0.55], materials.bedLinen);
    addBox(bed, [0.85, 0.95, -1.0], [1.0, 0.22, 0.55], materials.bedLinen);
    addBox(bed, [0, 0.92, -0.85], [0.65, 0.2, 0.35], materials.cushionYellow);

    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.6, z - 3.4], [1.8, 0.6, 1.9]);

    // Bedside Nightstands flanking King Bed
    for (const side of [-1, 1]) {
      const nx = x + side * 2.4;
      const nz = z - 5.0;
      addBox(parent, [nx, y + 0.45, nz], [0.85, 0.85, 0.75], materials.woodWarm);
      // Designer bedside lamp with warm glow
      addCylinder(parent, [nx, y + 0.92, nz], 0.16, 0.16, 0.03, materials.brass);
      addCylinder(parent, [nx, y + 1.15, nz], 0.02, 0.02, 0.42, materials.brass);
      addCylinder(parent, [nx, y + 1.35, nz], 0.24, 0.28, 0.35, materials.cream, { segments: 16 });
      addSphere(parent, [nx, y + 1.32, nz], [0.08, 0.08, 0.08], materials.glow, { shadow: false });
      addFurnitureCollider(world, RAPIER, staticBodies, [nx, y + 0.45, nz], [0.45, 0.45, 0.4]);
    }

    // Wardrobe / Closet Cabinet against West wall (x = -16.0)
    addBox(parent, [x - 4.4, y + 2.2, z - 1.5], [1.2, 4.4, 3.4], materials.woodDark);
    addBox(parent, [x - 3.75, y + 2.2, z - 1.5], [0.08, 4.2, 3.2], materials.woodWarm);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.4, y + 2.2, z - 1.5], [0.65, 2.2, 1.75]);

    // Designer lounge accent chair facing forward
    const loungeChair = new THREE.Group();
    loungeChair.position.set(x + 3.2, y, z + 0.5);
    loungeChair.rotation.y = -0.4;
    parent.add(loungeChair);
    addBox(loungeChair, [0, 0.42, 0], [1.0, 0.42, 1.0], materials.cushionBlue);
    addBox(loungeChair, [0, 0.95, -0.4], [1.0, 0.65, 0.22], materials.cushionBlue);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.2, y + 0.5, z + 0.5], [0.55, 0.5, 0.55]);
  } else if (id === 'bathroom') {
    // =========================================================================
    // 6. MASTER BATHROOM (Lantai 2 Center, x = 0.0, y = 5.2, z = -2.0)
    // Directly above Living Room! Luxurious modern spa bathroom:
    // Freestanding oval soaking tub in center, walk-in glass shower cabin on left,
    // double floating vanity counter with illuminated mirror on right
    // =========================================================================

    // Centerpiece: Freestanding Modern Oval Soaking Bathtub in center (x = 0, z = -2.0)
    const tub = new THREE.Group();
    tub.position.set(x, y + 0.42, z - 1.8);
    parent.add(tub);
    // Outer porcelain oval body
    addCylinder(tub, [0, 0, 0], 1.25, 0.95, 0.84, materials.ceramic, { segments: 24 });
    // Inner tub recess with clear spa water
    addCylinder(tub, [0, 0.15, 0], 1.1, 0.85, 0.6, materials.ceramic, { segments: 24 });
    addCylinder(tub, [0, 0.18, 0], 1.05, 0.8, 0.05, materials.poolWater, { segments: 24, shadow: false });
    // Floor-mounted chrome freestanding tub filler & hand shower
    addCylinder(parent, [x + 1.25, y + 0.55, z - 1.8], 0.03, 0.03, 1.1, materials.chrome);
    addBox(parent, [x + 1.15, y + 1.05, z - 1.8], [0.22, 0.05, 0.05], materials.chrome);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.45, z - 1.8], [1.3, 0.45, 1.0]);

    // Walk-in Glass Shower Cabin on Left (x = -3.4, z = -4.2)
    const showerX = x - 3.4;
    const showerZ = z - 4.2;
    // Shower tray plinth
    addBox(parent, [showerX, y + 0.08, showerZ], [2.2, 0.16, 2.2], materials.ceramic);
    // Clear glass shower partition panels
    addBox(parent, [showerX + 1.05, y + 2.1, showerZ], [0.06, 4.0, 2.2], materials.glass);
    addBox(parent, [showerX, y + 2.1, showerZ + 1.05], [2.1, 4.0, 0.06], materials.glass);
    // Chrome ceiling rain showerhead & mixer
    addCylinder(parent, [showerX, y + 3.8, showerZ], 0.22, 0.22, 0.04, materials.chrome);
    addCylinder(parent, [showerX, y + 4.0, showerZ], 0.025, 0.025, 0.4, materials.chrome);
    addFurnitureCollider(world, RAPIER, staticBodies, [showerX, y + 2.0, showerZ], [1.15, 2.0, 1.15]);

    // Floating Double Vanity Counter with Illuminated Mirror on Right (x = 3.2, z = -4.2)
    const vanityX = x + 3.2;
    const vanityZ = z - 4.2;
    // Wood vanity cabinet
    addBox(parent, [vanityX, y + 0.85, vanityZ], [3.2, 0.48, 1.0], materials.woodDark);
    addBox(parent, [vanityX, y + 1.1, vanityZ], [3.3, 0.08, 1.05], materials.ceramic);
    // Twin ceramic vessel sinks & chrome faucets
    for (const vx of [-0.85, 0.85]) {
      addCylinder(parent, [vanityX + vx, y + 1.22, vanityZ], 0.32, 0.26, 0.18, materials.ceramic, { segments: 16 });
      addCylinder(parent, [vanityX + vx, y + 1.38, vanityZ - 0.32], 0.03, 0.03, 0.32, materials.chrome);
    }
    // Large illuminated mirror on back wall
    addBox(parent, [vanityX, y + 2.5, vanityZ - 0.52], [3.0, 1.8, 0.06], materials.mirror);
    addBox(parent, [vanityX, y + 2.5, vanityZ - 0.54], [3.2, 2.0, 0.02], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [vanityX, y + 0.7, vanityZ], [1.65, 0.7, 0.55]);

    // Luxury rolled bath towels in woven basket
    addCylinder(parent, [x + 1.8, y + 0.22, z + 0.5], 0.32, 0.26, 0.42, materials.bark, { segments: 14 });
    addSphere(parent, [x + 1.8, y + 0.45, z + 0.5], [0.26, 0.15, 0.26], materials.cream);
  } else if (id === 'experience') {
    // =========================================================================
    // 7. LIBRARY NOOK (Lantai 2 Mid-Right, x = 10.75, y = 5.2, z = -2.0)
    // Floor-to-ceiling wooden bookshelves spanning back wall packed with colorful books,
    // cozy teal velvet reading sofa with cushions, brass arc reading lamp, side table
    // =========================================================================

    // Floor-to-ceiling Bookshelf Spanning the Back Wall (z = -7.5)
    const shelf = new THREE.Group();
    shelf.position.set(x, y, z - 5.4);
    parent.add(shelf);

    // Outer dark wood shelving frame
    addBox(shelf, [0, 2.4, 0], [7.8, 4.8, 0.5], materials.woodDark);
    for (let sy = 0.8; sy <= 4.2; sy += 0.8) {
      addBox(shelf, [0, sy, 0.02], [7.6, 0.06, 0.48], materials.woodWarm);
    }

    // Rows of Colorful Hardcover Books
    const bookColors = [materials.coral, materials.yellowSun, materials.blueSky, materials.mint, materials.pinkRose, materials.woodDark];
    for (let row = 0; row < 5; row += 1) {
      const by = 0.95 + row * 0.8;
      for (let bx = -3.4; bx <= 3.4; bx += 0.32) {
        const seed = Math.abs(Math.sin(bx * 13.7 + row * 5.3));
        const bookH = 0.42 + seed * 0.18;
        const bookW = 0.18 + (seed % 0.1) * 0.8;
        addBox(
          shelf,
          [bx, by - 0.24 + bookH * 0.5, 0.05],
          [bookW, bookH, 0.36],
          bookColors[Math.abs(Math.round(bx * 7 + row)) % bookColors.length]
        );
      }
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 2.4, z - 5.4], [3.9, 2.4, 0.35]);

    // Cozy Loveseat / Reading Sofa in Teal/Mint Velvet facing forward (+Z)
    const sofa = new THREE.Group();
    sofa.position.set(x, y, z - 0.8);
    parent.add(sofa);
    addBox(sofa, [0, 0.45, 0], [2.8, 0.45, 1.2], materials.mint);
    addBox(sofa, [0, 1.0, -0.45], [2.8, 0.7, 0.3], materials.mint);
    addBox(sofa, [-1.3, 0.68, 0], [0.25, 0.55, 1.2], materials.mint);
    addBox(sofa, [1.3, 0.68, 0], [0.25, 0.55, 1.2], materials.mint);
    addBox(sofa, [-0.65, 0.8, -0.2], [0.42, 0.38, 0.2], materials.cushionYellow, { rotation: [0.1, 0.15, 0] });
    addBox(sofa, [0.65, 0.8, -0.2], [0.42, 0.38, 0.2], materials.cushionCoral, { rotation: [0.1, -0.15, 0] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.55, z - 0.8], [1.45, 0.55, 0.65]);

    // Brass Arc Floor Lamp curving over reading sofa
    const lamp = new THREE.Group();
    lamp.position.set(x - 2.2, y, z - 0.8);
    parent.add(lamp);
    addCylinder(lamp, [0, 0.04, 0], 0.36, 0.36, 0.08, materials.brass, { segments: 16 });
    addCylinder(lamp, [0, 1.6, 0], 0.03, 0.03, 3.2, materials.brass);
    addCylinder(lamp, [0.55, 3.2, 0], 0.03, 0.03, 1.2, materials.brass, { rotation: [0, 0, Math.PI * 0.45] });
    addCylinder(lamp, [1.1, 2.8, 0], 0.22, 0.28, 0.25, materials.brass, { segments: 16 });
    addSphere(lamp, [1.1, 2.7, 0], [0.1, 0.1, 0.1], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.2, y + 0.8, z - 0.8], [0.35, 0.8, 0.35]);

    // Round oak side table with steaming coffee mug
    addCylinder(parent, [x + 2.0, y + 0.38, z - 0.4], 0.45, 0.45, 0.06, materials.woodDark, { segments: 16 });
    addCylinder(parent, [x + 2.0, y + 0.18, z - 0.4], 0.06, 0.06, 0.36, materials.woodDark);
    addCylinder(parent, [x + 2.0, y + 0.48, z - 0.4], 0.08, 0.07, 0.12, materials.ceramic, { segments: 12 });
  } else if (id === 'process') {
    // =========================================================================
    // 8. CREATIVE STUDIO (Lantai 2 Far-Right, x = 21.0, y = 5.2, z = -2.0)
    // Creator workstation facing forward (+Z): Dual screens, studio monitors, electric guitar
    // on floor stand, synthesizer keyboard, acoustic foam wall panels
    // =========================================================================

    // Creator Desk in dark walnut facing forward (+Z)
    addBox(parent, [x, y + 0.95, z - 2.2], [3.8, 0.14, 1.5], materials.woodDark);
    addBox(parent, [x - 1.7, y + 0.48, z - 2.2], [0.2, 0.95, 1.3], materials.metalDark);
    addBox(parent, [x + 1.7, y + 0.48, z - 2.2], [0.2, 0.95, 1.3], materials.metalDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.55, z - 2.2], [1.95, 0.55, 0.8]);

    // Dual Widescreen Creative Monitors on Desk
    for (const sx of [-0.75, 0.75]) {
      addBox(parent, [x + sx, y + 1.62, z - 2.4], [1.2, 0.76, 0.08], materials.metalDark);
      addBox(parent, [x + sx, y + 1.62, z - 2.35], [1.12, 0.68, 0.02], sx < 0 ? materials.screenDAW : materials.screenCad, { shadow: false });
    }

    // Studio Near-Field Audio Monitors (Speakers) on desk
    for (const spx of [-1.55, 1.55]) {
      addBox(parent, [x + spx, y + 1.35, z - 2.2], [0.32, 0.48, 0.32], materials.metalDark);
      addCylinder(parent, [x + spx, y + 1.38, z - 2.02], 0.09, 0.09, 0.04, materials.yellowSun, { rotation: [Math.PI * 0.5, 0, 0] });
    }

    // 49-Key Synthesizer Keyboard on pull-out desk shelf
    addBox(parent, [x, y + 0.88, z - 1.6], [2.2, 0.08, 0.45], materials.ink);
    addBox(parent, [x, y + 0.94, z - 1.55], [2.1, 0.03, 0.32], materials.cream);

    // Electric Guitar on Floor Stand on right side of desk (x = 23.4)
    const guitarGroup = new THREE.Group();
    guitarGroup.position.set(x + 2.5, y, z - 1.2);
    guitarGroup.rotation.y = -0.35;
    parent.add(guitarGroup);
    // Guitar stand
    addCylinder(guitarGroup, [0, 0.04, 0], 0.28, 0.28, 0.08, materials.metalDark, { segments: 12 });
    addCylinder(guitarGroup, [0, 0.55, 0], 0.025, 0.025, 1.1, materials.metalDark);
    // Guitar solid contoured body (Cherry Red)
    addBox(guitarGroup, [0, 0.6, 0.08], [0.55, 0.75, 0.1], materials.coral);
    addBox(guitarGroup, [0, 0.88, 0.08], [0.42, 0.35, 0.08], materials.coral);
    // Maple neck & headstock with chrome tuning pegs
    addBox(guitarGroup, [0, 1.35, 0.08], [0.12, 0.95, 0.06], materials.woodLight);
    addBox(guitarGroup, [0, 1.88, 0.08], [0.16, 0.24, 0.05], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.5, y + 0.7, z - 1.2], [0.4, 0.7, 0.4]);

    // Studio Ergonomic Mesh Chair
    addBox(parent, [x, y + 0.52, z - 0.9], [0.72, 0.12, 0.72], materials.metalDark);
    addBox(parent, [x, y + 1.1, z - 1.22], [0.65, 1.0, 0.08], materials.metalDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.6, z - 0.9], [0.4, 0.6, 0.4]);

    // Acoustic Foam Wall Panels on Back Wall (z = -7.7)
    for (let ax = -2.4; ax <= 2.4; ax += 1.2) {
      for (let ay = 2.0; ay <= 4.0; ay += 1.0) {
        addBox(parent, [x + ax, y + ay, z - 5.7], [0.95, 0.85, 0.08], materials.acousticFoam);
      }
    }
  } else if (id === 'contact') {
    // Rear Terrace Patio Furniture (y = 0.0, z = -11.8)
    addBox(parent, [x, y + 0.38, z], [3.2, 0.4, 1.4], materials.woodWarm);
    addBox(parent, [x - 1.8, y + 0.45, z], [1.0, 0.42, 1.0], materials.cushionMint);
    addBox(parent, [x + 1.8, y + 0.45, z], [1.0, 0.42, 1.0], materials.cushionMint);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.45, z], [2.4, 0.45, 0.8]);
  }
}

function buildSportsCar(parent, cx, cy, cz) {
  const car = new THREE.Group();
  car.position.set(cx, cy, cz);
  parent.add(car);

  // Main aerodynamic body lower chassis (Alpine White)
  addBox(car, [0, 0.42, 0], [2.1, 0.42, 4.4], materials.carPaintWhite, { shadow: true });
  // Aggressive front bumper splitter & lower air intake
  addBox(car, [0, 0.22, 2.15], [2.05, 0.24, 0.32], materials.metalDark);
  addBox(car, [0, 0.16, 2.28], [2.12, 0.08, 0.18], materials.carChrome);
  // Iconic BMW M Kidney Grille (twin black/chrome grilles)
  addBox(car, [-0.34, 0.46, 2.22], [0.38, 0.26, 0.04], materials.metalDark);
  addBox(car, [0.34, 0.46, 2.22], [0.38, 0.26, 0.04], materials.metalDark);
  addBox(car, [-0.34, 0.46, 2.23], [0.42, 0.28, 0.02], materials.carChrome);
  addBox(car, [0.34, 0.46, 2.23], [0.42, 0.28, 0.02], materials.carChrome);

  // Angular LED Headlights with iconic angel-eye rings
  for (const hx of [-0.82, 0.82]) {
    addBox(car, [hx, 0.52, 2.18], [0.45, 0.16, 0.08], materials.glass);
    addSphere(car, [hx, 0.52, 2.19], [0.12, 0.05, 0.02], materials.glow, { shadow: false });
  }

  // Sloped Hood with M power bulge
  addBox(car, [0, 0.65, 1.1], [1.9, 0.18, 2.0], materials.carPaintWhite);
  addBox(car, [0, 0.74, 1.0], [0.65, 0.08, 1.6], materials.carPaintWhite);

  // Sleek Aerodynamic Greenhouse Cabin with Tinted Glass & Panoramic Roof
  addBox(car, [0, 1.08, -0.3], [1.72, 0.65, 2.4], materials.carGlass);
  addBox(car, [0, 1.38, -0.3], [1.65, 0.08, 1.9], materials.carPaintWhite);

  // Rear Trunk Deck & M Sport Carbon Spoiler
  addBox(car, [0, 0.72, -1.85], [1.85, 0.22, 0.95], materials.carPaintWhite);
  addBox(car, [0, 0.88, -2.22], [1.92, 0.06, 0.22], materials.metalDark);
  // Rear diffuser & Quad M Chrome Exhaust Pipes
  addBox(car, [0, 0.24, -2.22], [1.98, 0.24, 0.16], materials.metalDark);
  for (const ex of [-0.65, -0.45, 0.45, 0.65]) {
    addCylinder(car, [ex, 0.22, -2.32], 0.06, 0.06, 0.18, materials.carChrome, { rotation: [Math.PI * 0.5, 0, 0], segments: 14 });
  }

  // 4 M-Performance Chrome Alloy Wheels with Wide Rubber Tires
  const wheelZ = [-1.35, 1.35];
  const wheelX = [-1.08, 1.08];
  for (const wz of wheelZ) {
    for (const wx of wheelX) {
      // Rubber tire
      addCylinder(car, [wx, 0.38, wz], 0.38, 0.38, 0.28, materials.carRubber, { rotation: [0, 0, Math.PI * 0.5], segments: 20 });
      // Chrome alloy spoke wheel
      addCylinder(car, [wx + (wx > 0 ? 0.03 : -0.03), 0.38, wz], 0.25, 0.25, 0.28, materials.carChrome, { rotation: [0, 0, Math.PI * 0.5], segments: 16 });
      // Blue M-Sport brake caliper inside wheel
      addBox(car, [wx, 0.46, wz], [0.12, 0.12, 0.18], materials.carPaintBlue);
    }
  }

  // Aerodynamic side mirrors
  for (const mx of [-1.02, 1.02]) {
    addBox(car, [mx, 0.92, 0.6], [0.22, 0.12, 0.18], materials.carPaintWhite);
    addBox(car, [mx, 0.92, 0.58], [0.18, 0.09, 0.02], materials.mirror);
  }
}
