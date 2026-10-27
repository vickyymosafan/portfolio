import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, BatchCollector } from './geometry.js';
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
    if (spec.id !== 'garage' && spec.id !== 'bathroom' && spec.id !== 'contact' && spec.id !== 'about') {
      const rugW = 8.4;
      const rugD = 6.4;
      addBox(building, [spec.x, spec.y + 0.005, spec.z], [rugW, 0.02, rugD], spec.rugMat, { receive: true, shadow: false });
    } else if (spec.id === 'about') {
      // Grand central designer area rug defining the About Me Pavilion space
      addBox(building, [-1.4, spec.y + 0.005, 1.7], [6.2, 0.02, 4.4], spec.rugMat, { receive: true, shadow: false });
    }

    // Presentation Display Board Mounted on back wall of room (leaving center clear)
    if (spec.id !== 'garage' && spec.id !== 'bathroom' && spec.id !== 'bedroom') {
      createDisplayBoard(building, spec, world, RAPIER, staticBodies);
    }

    // Room-specific furnishings with physics colliders
    buildRoomFurniture(building, spec, world, RAPIER, staticBodies);

    // Interactive glowing floor beacon placed conveniently in front/center of each room
    const isAbout = spec.id === 'about';
    const beaconX = isAbout ? -1.4 : spec.x;
    const beaconZ = spec.id === 'contact' ? -11.8 : (spec.id === 'bathroom' ? -5.5 : (isAbout ? 1.7 : -1.5));
    createFloorBeacon(building, beaconX, spec.y, beaconZ, spec.accent);

    // Register interaction point covering the full room bay
    const roomInfo = portfolio.rooms.find((r) => r.id === spec.id);
    interactionPoints.push({
      id: spec.id,
      title: roomInfo ? roomInfo.title : spec.subtitle,
      position: new THREE.Vector3(beaconX, spec.y + 0.9, beaconZ),
      radius: spec.id === 'bathroom' ? 4.8 : 6.8,
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

  // Mount seamlessly on a solid structural wall
  // For 'about' (About Me Room), mount on the dedicated solid West feature wall at x = -5.35, z = 1.7
  // facing East into the spacious About Me pavilion salon.
  const isAbout = id === 'about';
  const bx = isAbout ? -5.35 : x;
  const by = y;
  const bz = id === 'contact' ? -15.2 : (isAbout ? 1.7 : -7.8);
  const rotY = isAbout ? Math.PI * 0.5 : 0;

  const display = new THREE.Group();
  display.position.set(bx, by, bz);
  display.rotation.y = rotY;
  parent.add(display);

  // Architectural fluted acoustic timber slats & brass frame behind "About Me" board
  if (isAbout) {
    // Acoustic dark wood panel (width 4.0m, height 3.8m)
    addBox(display, [0, 2.5, -0.02], [4.0, 3.8, 0.04], materials.woodDark);
    // Fluted decorative wooden slats on flanking sides
    for (let s = -1.9; s <= 1.9; s += 0.2) {
      if (Math.abs(s) > 1.55) {
        addBox(display, [s, 2.5, 0.02], [0.08, 3.8, 0.04], materials.woodLight);
      }
    }
    // Brushed brass framing perimeter
    addBox(display, [0, 4.42, 0.01], [4.06, 0.06, 0.06], materials.brass);
    addBox(display, [0, 0.58, 0.01], [4.06, 0.06, 0.06], materials.brass);
    addBox(display, [-2.02, 2.5, 0.01], [0.06, 3.8, 0.06], materials.brass);
    addBox(display, [2.02, 2.5, 0.01], [0.06, 3.8, 0.06], materials.brass);
  }

  // Wall mounted plaque frame
  const boardW = isAbout ? 3.0 : 3.6;
  const boardH = isAbout ? 1.8 : 2.0;
  addBox(display, [0, 2.7, 0.08], [boardW, boardH, 0.1], materials.woodDark);

  // Canvas sign texture
  const signTex = createSignTexture(title, subtitle, accent, 512, 340);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW - 0.2, boardH - 0.2),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45, metalness: 0.05 })
  );
  signMesh.position.set(0, 2.7, 0.14);
  display.add(signMesh);

  // Twin brass picture lamps over board
  for (const lx of isAbout ? [-0.65, 0.65] : [0]) {
    addBox(display, [lx, 2.7 + boardH * 0.5 + 0.12, 0.25], [isAbout ? 0.9 : boardW * 0.55, 0.06, 0.16], materials.brass);
    addSphere(display, [lx, 2.7 + boardH * 0.5 + 0.04, 0.25], [0.14, 0.05, 0.14], materials.glow, { shadow: false });
  }
}

function buildRoomFurniture(parent, room, world, RAPIER, staticBodies) {
  const { x, y, z, id } = room;

  if (id === 'about') {
    // =========================================================================
    // 1. CHAPTER 01: ABOUT ME — EXECUTIVE BIOGRAPHICAL PAVILION & ATRIUM
    // Dedicated architectural room with monumental feature wall, career milestone
    // pedestals, interactive paradigm crystal, and airy luxury seating
    // =========================================================================

    // Multi-tier Sculptural Ring Chandelier centered in About Me Pavilion (y = 4.6)
    const chandelier = new THREE.Group();
    chandelier.position.set(x - 1.4, y + 4.6, 1.7);
    parent.add(chandelier);
    addCylinder(chandelier, [0, 0, 0], 1.6, 1.6, 0.1, materials.brass, { segments: 24 });
    addCylinder(chandelier, [0, -0.04, 0], 1.5, 1.5, 0.06, materials.glow, { segments: 24, shadow: false });
    addCylinder(chandelier, [0, 0.35, 0], 0.9, 0.9, 0.08, materials.brass, { segments: 20 });
    addCylinder(chandelier, [0, 0.31, 0], 0.82, 0.82, 0.05, materials.glow, { segments: 20, shadow: false });
    for (let c = 0; c < 3; c += 1) {
      const angle = (c / 3) * Math.PI * 2;
      addCylinder(chandelier, [Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.5], 0.015, 0.015, 0.9, materials.brass);
    }

    // --- FEATURE WALL EXHIBITION CONSOLE (Below "About Me" Display Board at x = -5.15, z = 1.7) ---
    // Floating Walnut Credenza with Polished Italian Marble Top
    addBox(parent, [x - 5.15, y + 0.45, 1.7], [0.44, 0.52, 3.2], materials.woodDark);
    addBox(parent, [x - 5.14, y + 0.72, 1.7], [0.46, 0.04, 3.25], materials.stone);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 5.15, y + 0.45, 1.7], [0.25, 0.45, 1.65]);

    // Exhibition items on the console:
    // 1. Executive Bio Plaque
    addBox(parent, [x - 5.08, y + 0.88, 1.7], [0.06, 0.28, 0.85], materials.woodLight);
    addBox(parent, [x - 5.04, y + 0.88, 1.7], [0.02, 0.24, 0.80], materials.brass);
    // 2. Innovation Milestone Award in Gold
    addCylinder(parent, [x - 5.08, y + 0.82, 2.5], 0.08, 0.10, 0.16, materials.brass, { segments: 14 });
    addSphere(parent, [x - 5.08, y + 0.96, 2.5], [0.07, 0.07, 0.07], materials.gold);
    // 3. Minimalist Ceramic Vase with Flora
    addCylinder(parent, [x - 5.08, y + 0.84, 0.9], 0.09, 0.06, 0.20, materials.ceramicTeal, { segments: 14 });
    addSphere(parent, [x - 5.08, y + 1.02, 0.9], [0.12, 0.16, 0.12], materials.foliageBright);

    // --- 4 ARCHITECTURAL PILLARS OF VICKY'S CRAFT ---
    // 4 Sleek Low Gallery Plinths framing the About Me pavilion space (x = -3.2, z = [2.9, 2.1, 1.3, 0.5])
    const pillars = [
      { z: 2.9, mat: materials.blue },
      { z: 2.1, mat: materials.mint },
      { z: 1.3, mat: materials.coral },
      { z: 0.5, mat: materials.gold },
    ];
    for (const p of pillars) {
      // Fluted pedestal base
      addBox(parent, [x - 3.2, y + 0.38, p.z], [0.38, 0.76, 0.38], materials.woodWarm);
      addBox(parent, [x - 3.2, y + 0.77, p.z], [0.42, 0.03, 0.42], materials.brass);
      // Floating glowing discipline crystal prism
      addSphere(parent, [x - 3.2, y + 0.95, p.z], [0.09, 0.09, 0.09], p.mat);
      addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.2, y + 0.45, p.z], [0.22, 0.45, 0.22]);
    }

    // --- CENTRAL PARADIGM PEDESTAL & INTERACTIVE BEACON ---
    // In the center of the About Me zone (x = -1.4, z = 1.7)
    addCylinder(parent, [x - 1.4, y + 0.42, 1.7], 0.38, 0.42, 0.84, materials.stone, { segments: 18 });
    addCylinder(parent, [x - 1.4, y + 0.85, 1.7], 0.44, 0.44, 0.04, materials.brass, { segments: 18 });
    // Floating rotating crystal
    addSphere(parent, [x - 1.4, y + 1.10, 1.7], [0.14, 0.18, 0.14], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.4, y + 0.45, 1.7], [0.42, 0.45, 0.42]);

    // --- AIRY EXECUTIVE LOUNGE SEATING (Oriented towards About Me Showcase) ---
    // Pair of Bauhaus/Barcelona style armchairs on East side of rug facing West towards the About Me wall
    for (const cz of [-0.65, 0.65]) {
      const arm = new THREE.Group();
      arm.position.set(x + 1.6, y, 1.7 + cz);
      arm.rotation.y = Math.PI; // Face West towards About Me feature wall
      parent.add(arm);
      // Sleek low cantilevered chrome frame
      addBox(arm, [0, 0.16, 0], [0.85, 0.04, 0.75], materials.carChrome);
      // Deep leather seat cushion
      addBox(arm, [0, 0.38, 0.02], [0.82, 0.38, 0.72], materials.terracotta);
      // Angled backrest
      addBox(arm, [0.34, 0.75, 0.02], [0.12, 0.52, 0.72], materials.terracotta, { rotation: [0, 0, -0.15] });
      // Throw cushion
      addBox(arm, [0.22, 0.65, 0.02], [0.12, 0.32, 0.38], cz > 0 ? materials.cushionYellow : materials.cushionMint);
      addFurnitureCollider(world, RAPIER, staticBodies, [x + 1.6, y + 0.45, 1.7 + cz], [0.45, 0.45, 0.42]);
    }

    // Low Sculpted Walnut & Glass Cocktail Table between lounge chairs and central beacon
    addCylinder(parent, [x + 0.7, y + 0.28, 1.7], 0.48, 0.48, 0.06, materials.woodDark, { segments: 18 });
    addCylinder(parent, [x + 0.7, y + 0.14, 1.7], 0.12, 0.16, 0.26, materials.brass, { segments: 14 });
    addSphere(parent, [x + 0.7, y + 0.36, 1.7], [0.08, 0.08, 0.08], materials.ceramicTeal);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 0.7, y + 0.20, 1.7], [0.48, 0.20, 0.48]);

    // Architectural Fig Palm Tree in Corner (x = -4.8, z = 3.3)
    addCylinder(parent, [x - 4.8, y + 0.45, 3.3], 0.38, 0.28, 0.9, materials.ceramicTerracotta, { segments: 16 });
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      addSphere(parent, [x - 4.8 + Math.cos(angle) * 0.38, y + 1.35 + (i % 2) * 0.18, 3.3 + Math.sin(angle) * 0.38], [0.36, 0.22, 0.36], materials.foliageBright);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.8, y + 0.55, 3.3], [0.4, 0.55, 0.4]);

    // --- REAR LOUNGE & MEDIA ATRIUM ZONE (z = -6.0, Near Garden Veranda Doors) ---
    // Wall-Mounted 85" OLED TV and credenza on the rear solid wall (x - 5.35, z = -6.0)
    const mediaWall = new THREE.Group();
    mediaWall.position.set(x - 5.35, y + 2.2, -6.0);
    mediaWall.rotation.y = Math.PI * 0.5;
    parent.add(mediaWall);
    addBox(mediaWall, [0, 0, 0], [2.6, 1.5, 0.06], materials.metalDark);
    addBox(mediaWall, [0, 0, 0.04], [2.48, 1.38, 0.02], materials.artLandscape, { shadow: false });

    // Floating walnut media credenza
    addBox(parent, [x - 5.15, y + 0.42, -6.0], [0.42, 0.42, 2.4], materials.woodDark);
    addBox(parent, [x - 5.14, y + 0.64, -6.0], [0.40, 0.02, 2.3], materials.stone);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 5.15, y + 0.45, -6.0], [0.25, 0.45, 1.25]);
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

    // 2 Museum Pedestals positioned deeper in the gallery flanking showcase screens (leaving entrance wide open)
    for (const px of [-3.4, 3.4]) {
      const ped = new THREE.Group();
      ped.position.set(x + px, y, z - 3.8);
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
      addFurnitureCollider(world, RAPIER, staticBodies, [x + px, y + 0.9, z - 3.8], [0.6, 0.9, 0.6]);
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

    // Freestanding Modern Oval Soaking Bathtub in West Spa Wing (x = -3.7, z = -1.8)
    const tub = new THREE.Group();
    tub.position.set(x - 3.7, y + 0.42, z + 0.2);
    parent.add(tub);
    // Outer porcelain oval body
    addCylinder(tub, [0, 0, 0], 1.25, 0.95, 0.84, materials.ceramic, { segments: 24 });
    // Inner tub recess with clear spa water
    addCylinder(tub, [0, 0.15, 0], 1.1, 0.85, 0.6, materials.ceramic, { segments: 24 });
    addCylinder(tub, [0, 0.18, 0], 1.05, 0.8, 0.05, materials.poolWater, { segments: 24, shadow: false });
    // Floor-mounted chrome freestanding tub filler & hand shower
    addCylinder(parent, [x - 2.45, y + 0.55, z + 0.2], 0.03, 0.03, 1.1, materials.chrome);
    addBox(parent, [x - 2.55, y + 1.05, z + 0.2], [0.22, 0.05, 0.05], materials.chrome);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.7, y + 0.45, z + 0.2], [1.3, 0.45, 1.0]);

    // Walk-in Glass Shower Cabin in Rear-West Corner (x = -3.7, z = -4.4)
    const showerX = x - 3.7;
    const showerZ = z - 4.4;
    // Shower tray plinth
    addBox(parent, [showerX, y + 0.08, showerZ], [2.2, 0.16, 2.2], materials.ceramic);
    // Clear glass shower partition panels
    addBox(parent, [showerX + 1.05, y + 2.1, showerZ], [0.06, 4.0, 2.2], materials.glass);
    addBox(parent, [showerX, y + 2.1, showerZ + 1.05], [2.1, 4.0, 0.06], materials.glass);
    // Chrome ceiling rain showerhead & mixer
    addCylinder(parent, [showerX, y + 3.8, showerZ], 0.22, 0.22, 0.04, materials.chrome);
    addCylinder(parent, [showerX, y + 4.0, showerZ], 0.025, 0.025, 0.4, materials.chrome);
    addFurnitureCollider(world, RAPIER, staticBodies, [showerX, y + 2.0, showerZ], [1.15, 2.0, 1.15]);

    // Floating Double Vanity Counter with Illuminated Mirror on Bathroom Back Wall
    const vanityX = x - 0.4;
    const vanityZ = z - 4.4;
    // Wood vanity cabinet
    addBox(parent, [vanityX, y + 0.85, vanityZ], [3.0, 0.48, 1.0], materials.woodDark);
    addBox(parent, [vanityX, y + 1.1, vanityZ], [3.1, 0.08, 1.05], materials.ceramic);
    // Twin ceramic vessel sinks & chrome faucets
    for (const vx of [-0.75, 0.75]) {
      addCylinder(parent, [vanityX + vx, y + 1.22, vanityZ], 0.3, 0.24, 0.18, materials.ceramic, { segments: 16 });
      addCylinder(parent, [vanityX + vx, y + 1.38, vanityZ - 0.32], 0.03, 0.03, 0.32, materials.chrome);
    }
    // Large illuminated mirror on back wall
    addBox(parent, [vanityX, y + 2.5, vanityZ - 0.52], [2.8, 1.8, 0.06], materials.mirror);
    addBox(parent, [vanityX, y + 2.5, vanityZ - 0.54], [3.0, 2.0, 0.02], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [vanityX, y + 0.7, vanityZ], [1.55, 0.7, 0.55]);

    // Luxury rolled bath towels in woven basket
    addCylinder(parent, [x + 2.4, y + 0.22, z + 1.2], 0.32, 0.26, 0.42, materials.bark, { segments: 14 });
    addSphere(parent, [x + 2.4, y + 0.45, z + 1.2], [0.26, 0.15, 0.26], materials.cream);
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

    // Rows of Colorful Hardcover Books (batched into single draw call per color, no shadow overhead)
    const bookColors = [materials.coral, materials.yellowSun, materials.blueSky, materials.mint, materials.pinkRose, materials.woodDark];
    const bookBatch = new BatchCollector();
    for (let row = 0; row < 5; row += 1) {
      const by = 0.95 + row * 0.8;
      for (let bx = -3.4; bx <= 3.4; bx += 0.32) {
        const seed = Math.abs(Math.sin(bx * 13.7 + row * 5.3));
        const bookH = 0.42 + seed * 0.18;
        const bookW = 0.18 + (seed % 0.1) * 0.8;
        bookBatch.addBox(
          [bx, by - 0.24 + bookH * 0.5, 0.05],
          [bookW, bookH, 0.36],
          bookColors[Math.abs(Math.round(bx * 7 + row)) % bookColors.length]
        );
      }
    }
    bookBatch.build(shelf, false);
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

  // =========================================================================
  // 1. CHASSIS & SCULPTED WIDEBODY (BMW M4 G82 CSL PROPORTIONS)
  // =========================================================================
  // Main lower aerodynamic tub
  addBox(car, [0, 0.30, -0.05], [1.78, 0.28, 4.30], materials.m4Paint, { shadow: true });

  // Sculpted Door Waist & Rocker Panels (Between front & rear wheels, z: -0.65 to +0.65)
  for (const sx of [-0.94, 0.94]) {
    // Upper door panel tucked in for muscular waist
    addBox(car, [sx, 0.46, 0.02], [0.12, 0.30, 1.45], materials.m4Paint);
    // Lower carbon fiber side skirt
    addBox(car, [sx * 1.04, 0.13, 0.02], [0.12, 0.04, 1.55], materials.m4Carbon);
    // Aerodynamic winglet fin ahead of rear wheel arch
    addBox(car, [sx * 1.10, 0.22, -0.62], [0.04, 0.16, 0.22], materials.m4Carbon);
  }

  // Muscular Front Widebody Fenders (Arching over front wheels at z = 1.38)
  for (const fx of [-0.98, 0.98]) {
    // Front fender top ridge
    addBox(car, [fx, 0.56, 1.38], [0.22, 0.14, 1.25], materials.m4Paint);
    // Front fender forward flare (ahead of front wheel)
    addBox(car, [fx, 0.36, 1.88], [0.24, 0.36, 0.45], materials.m4Paint);
    // Front fender rear flare (behind front wheel, with M gill pocket)
    addBox(car, [fx, 0.38, 0.88], [0.22, 0.38, 0.42], materials.m4Paint);
    // M Fender Side Gills (gloss black air vent with chrome M4 bar)
    addBox(car, [fx * 1.025, 0.52, 0.78], [0.02, 0.18, 0.10], materials.m4GlossBlack);
    addBox(car, [fx * 1.032, 0.54, 0.78], [0.012, 0.03, 0.07], materials.carChrome);
  }

  // Muscular Rear Widebody Haunches (Arching over rear wheels at z = -1.35)
  for (const rx of [-1.02, 1.02]) {
    // Rear fender top muscular shoulder
    addBox(car, [rx, 0.58, -1.35], [0.26, 0.16, 1.35], materials.m4Paint);
    // Rear fender forward flare (ahead of rear wheel)
    addBox(car, [rx, 0.38, -0.85], [0.25, 0.38, 0.45], materials.m4Paint);
    // Rear quarter rear flare (behind rear wheel into bumper)
    addBox(car, [rx, 0.38, -1.85], [0.24, 0.38, 0.55], materials.m4Paint);
  }

  // =========================================================================
  // 2. SLOPED HOOD & FRONT NOSE (DYNAMIC FORWARD WEDGE)
  // =========================================================================
  // Sloped hood base: drops smoothly from windshield base (y = 0.70, z = 0.85) to nose (y = 0.54, z = 2.15)
  addBox(car, [0, 0.62, 1.48], [1.70, 0.12, 1.35], materials.m4Paint, {
    rotation: [-0.11, 0, 0],
  });

  // CSL Carbon Hood Center Panel with Red/Black Racing Stripes
  addBox(car, [0, 0.685, 1.48], [1.36, 0.015, 1.32], materials.m4HoodStripes, {
    rotation: [-0.11, 0, 0],
  });

  // Muscular Hood Power Bulge Ridges flanking the central channel
  for (const bx of [-0.36, 0.36]) {
    addBox(car, [bx, 0.698, 1.48], [0.05, 0.025, 1.30], materials.m4Paint, {
      rotation: [-0.11, 0, 0],
    });
  }

  // Front Nose Beak (directly above grilles where BMW Roundel sits)
  addBox(car, [0, 0.56, 2.18], [0.72, 0.10, 0.16], materials.m4Paint, {
    rotation: [-0.15, 0, 0],
  });
  // BMW Roundel Emblem on the sloped nose beak
  addCylinder(car, [0, 0.625, 2.18], 0.052, 0.052, 0.012, materials.m4BmwEmblem, {
    rotation: [0.38, 0, 0],
    segments: 18,
  });

  // =========================================================================
  // 3. FRONT FASCIA: MASSIVE VERTICAL TWIN KIDNEY GRILLES & GERMAN PLATE
  // =========================================================================
  const kidneyWidth = 0.32;
  const kidneyHeight = 0.50;
  const kidneyZ = 2.22;

  // Left & Right Kidney Octagonal Frames (dropping down from nose to lower splitter)
  addBox(car, [-0.20, 0.36, kidneyZ], [kidneyWidth, kidneyHeight, 0.05], materials.m4GlossBlack);
  addBox(car, [0.20, 0.36, kidneyZ], [kidneyWidth, kidneyHeight, 0.05], materials.m4GlossBlack);

  // Recessed Radiator Dark Mesh inside kidneys
  addBox(car, [-0.20, 0.36, kidneyZ - 0.02], [kidneyWidth - 0.04, kidneyHeight - 0.04, 0.04], materials.metalDark);
  addBox(car, [0.20, 0.36, kidneyZ - 0.02], [kidneyWidth - 0.04, kidneyHeight - 0.04, 0.04], materials.metalDark);

  // Body-Colored Center Vertical Bridge between kidneys
  addBox(car, [0, 0.36, kidneyZ + 0.005], [0.06, kidneyHeight + 0.02, 0.04], materials.m4Paint);

  // Body-Colored Sculpted Bumper Panels flanking the kidneys
  for (const bx of [-0.44, 0.44]) {
    addBox(car, [bx, 0.38, 2.19], [0.18, 0.36, 0.10], materials.m4Paint);
  }

  // Horizontal Twin Double Slats inside each kidney
  const slatY = [0.19, 0.29, 0.40, 0.51];
  for (const kx of [-0.20, 0.20]) {
    for (const sy of slatY) {
      addBox(car, [kx, sy, kidneyZ + 0.024], [kidneyWidth - 0.04, 0.02, 0.03], materials.m4GlossBlack);
    }
  }

  // M4 Competition Grille Emblem on upper right kidney with M tricolor stripe
  addBox(car, [0.21, 0.51, kidneyZ + 0.042], [0.075, 0.025, 0.012], materials.m4GlossBlack);
  addBox(car, [0.185, 0.51, kidneyZ + 0.045], [0.014, 0.022, 0.01], materials.m4LaserBlue);
  addBox(car, [0.199, 0.51, kidneyZ + 0.045], [0.014, 0.022, 0.01], materials.blueNavy);
  addBox(car, [0.213, 0.51, kidneyZ + 0.045], [0.014, 0.022, 0.01], materials.coralDark);

  // German DIN License Plate `M DI 4015` across middle of kidneys
  addBox(car, [0, 0.32, kidneyZ + 0.035], [0.82, 0.175, 0.015], materials.m4GlossBlack);
  addBox(car, [0, 0.32, kidneyZ + 0.044], [0.78, 0.155, 0.006], materials.m4PlateFront);

  // Carbon Front Splitter & Corner Winglets (Ultra-low stance)
  addBox(car, [0, 0.10, 2.26], [1.96, 0.035, 0.30], materials.m4Carbon);
  for (const wx of [-0.98, 0.98]) {
    addBox(car, [wx, 0.16, 2.24], [0.045, 0.13, 0.24], materials.m4Carbon);
  }

  // Triangular Corner Air Curtain Intakes (Brake cooling ducts with aero fangs)
  for (const cx of [-0.78, 0.78]) {
    addBox(car, [cx, 0.26, 2.16], [0.26, 0.26, 0.14], materials.m4GlossBlack);
    addBox(car, [cx, 0.26, 2.17], [0.22, 0.22, 0.12], materials.metalDark);
    addBox(car, [cx + (cx > 0 ? 0.11 : -0.11), 0.26, 2.20], [0.025, 0.24, 0.10], materials.m4GlossBlack);
  }

  // =========================================================================
  // 4. M LASER HEADLIGHTS (SWEPT-BACK, SHARP & HIGHLY PROMINENT)
  // =========================================================================
  for (const hx of [-0.64, 0.64]) {
    const rotY = hx > 0 ? -0.24 : 0.24;
    // Dark inner projector bucket
    addBox(car, [hx, 0.50, 2.14], [0.44, 0.13, 0.06], materials.m4GlossBlack, { rotation: [-0.08, rotY, 0] });

    // Dual Inverted-L DRL Glowing Arrows (placed proud in front of bucket)
    const dOffs = [-0.10, 0.09];
    for (const doff of dOffs) {
      const ax = hx + doff * Math.cos(rotY);
      const az = 2.18 + doff * Math.sin(-rotY);
      // Horizontal lower wing of arrow
      addBox(car, [ax, 0.46, az], [0.09, 0.024, 0.02], materials.m4DRLGlow, { rotation: [-0.08, rotY, 0], shadow: false });
      // Angled upper hook of arrow
      addBox(car, [ax + (hx > 0 ? -0.03 : 0.03), 0.51, az], [0.024, 0.08, 0.02], materials.m4DRLGlow, { rotation: [-0.08, rotY, 0], shadow: false });
    }

    // Cyan Laser Accent Strip along upper brow of headlight
    addBox(car, [hx * 0.94, 0.555, 2.185], [0.22, 0.024, 0.02], materials.m4LaserBlue, { rotation: [-0.08, rotY, 0], shadow: false });

    // Outer clear aerodynamic protective lens
    addBox(car, [hx, 0.50, 2.18], [0.46, 0.14, 0.03], materials.glass, { rotation: [-0.08, rotY, 0] });
  }

  // =========================================================================
  // 5. COUPE GREENHOUSE, M CARBON DOUBLE-BUBBLE ROOF & INTERIOR
  // =========================================================================
  // Windshield Cowl Transverse Base Bar
  addBox(car, [0, 0.69, 0.88], [1.46, 0.06, 0.10], materials.m4Paint);
  // Roof Front Transverse Header Bar
  addBox(car, [0, 1.25, 0.08], [1.38, 0.06, 0.10], materials.m4Paint);

  // Front Raked Windshield: Angled smooth dark glass from cowl to roof
  addBox(car, [0, 0.97, 0.48], [1.44, 0.04, 0.94], materials.carGlass, {
    rotation: [0.60, 0, 0],
  });
  // Slender A-Pillars framing windshield sides seamlessly
  for (const ax of [-0.71, 0.71]) {
    addBox(car, [ax, 0.97, 0.48], [0.06, 0.05, 0.94], materials.m4Paint, {
      rotation: [0.60, 0, ax > 0 ? -0.06 : 0.06],
    });
  }

  // Roof Rear Transverse Header Bar
  addBox(car, [0, 1.25, -0.78], [1.38, 0.06, 0.10], materials.m4Paint);
  // Trunk Forward Transverse Deck Transition Bar
  addBox(car, [0, 0.70, -1.55], [1.46, 0.06, 0.10], materials.m4Paint);

  // Fastback Rear Windshield: Sloping from roof to trunk deck
  addBox(car, [0, 0.975, -1.16], [1.42, 0.04, 0.94], materials.carGlass, {
    rotation: [-0.43, 0, 0],
  });
  // Muscular C-Pillars with iconic BMW Hofmeister Kink
  for (const cx of [-0.72, 0.72]) {
    addBox(car, [cx, 0.975, -1.16], [0.07, 0.06, 0.94], materials.m4Paint, {
      rotation: [-0.43, 0, cx > 0 ? -0.06 : 0.06],
    });
  }

  // Side Tinted Coupe Windows & Gloss Black B-Pillar
  for (const wx of [-0.73, 0.73]) {
    addBox(car, [wx, 0.97, -0.35], [0.03, 0.36, 0.88], materials.carGlass);
    addBox(car, [wx * 1.01, 0.97, -0.35], [0.02, 0.36, 0.06], materials.m4GlossBlack); // B-pillar
  }


  // M Carbon Fiber Double-Bubble Roof
  // Left bubble
  addBox(car, [-0.38, 1.24, -0.35], [0.62, 0.04, 1.05], materials.m4Carbon);
  // Right bubble
  addBox(car, [0.38, 1.24, -0.35], [0.62, 0.04, 1.05], materials.m4Carbon);
  // Center recessed aerodynamic depression channel
  addBox(car, [0, 1.22, -0.35], [0.22, 0.025, 1.05], materials.m4Carbon);
  // Roof Shark Fin Antenna
  addBox(car, [0, 1.28, -0.76], [0.04, 0.065, 0.16], materials.m4GlossBlack);

  // Interior: BMW Curved Dual Displays & M Sport Steering Wheel
  addBox(car, [0, 0.72, 0.45], [1.32, 0.10, 0.26], materials.m4InteriorLeather);
  addBox(car, [-0.10, 0.78, 0.40], [0.70, 0.075, 0.02], materials.screenCode);

  // M Sport Steering Wheel with Red 12 o'clock stripe
  addCylinder(car, [-0.36, 0.76, 0.24], 0.13, 0.13, 0.025, materials.m4GlossBlack, {
    rotation: [Math.PI * 0.40, 0, 0],
    segments: 16,
  });
  addBox(car, [-0.36, 0.86, 0.20], [0.025, 0.02, 0.025], materials.coralDark);

  // 2x M Carbon Bucket Seats (Driver & Passenger)
  for (const sx of [-0.36, 0.36]) {
    addBox(car, [sx, 0.44, -0.22], [0.42, 0.12, 0.44], materials.m4InteriorLeather);
    addBox(car, [sx, 0.70, -0.42], [0.40, 0.42, 0.08], materials.m4Carbon, { rotation: [-0.18, 0, 0] });
    addBox(car, [sx, 0.70, -0.38], [0.26, 0.36, 0.03], materials.m4BucketAccent, { rotation: [-0.18, 0, 0] });
    addBox(car, [sx, 0.96, -0.48], [0.24, 0.14, 0.07], materials.m4InteriorLeather, { rotation: [-0.18, 0, 0] });
  }

  // =========================================================================
  // 6. M CARBON TWIN-STALK SIDE MIRRORS
  // =========================================================================
  for (const mx of [-0.94, 0.94]) {
    addBox(car, [mx * 0.92, 0.78, 0.54], [0.08, 0.025, 0.05], materials.m4GlossBlack);
    addBox(car, [mx * 1.04, 0.81, 0.54], [0.16, 0.09, 0.13], materials.m4Carbon);
    addBox(car, [mx * 0.97, 0.86, 0.52], [0.07, 0.03, 0.05], materials.m4Carbon); // M upper fang
    addBox(car, [mx * 1.03, 0.81, 0.48], [0.14, 0.075, 0.01], materials.mirror);
  }

  // =========================================================================
  // 7. REAR FASCIA: CSL DUCKTAIL SPOILER, 3D OLED TAILLIGHTS & QUAD EXHAUSTS
  // =========================================================================
  // Sloped Trunk Deck
  addBox(car, [0, 0.64, -1.85], [1.65, 0.14, 0.85], materials.m4Paint);

  // CSL Integrated Carbon Ducktail Spoiler (sweeping up from trunk lid)
  addBox(car, [0, 0.77, -2.25], [1.62, 0.07, 0.20], materials.m4Carbon, { rotation: [-0.24, 0, 0] });
  addBox(car, [0, 0.81, -2.28], [0.55, 0.04, 0.12], materials.m4Carbon, { rotation: [-0.24, 0, 0] });

  // Rear BMW Roundel Emblem & Chrome M4 Badge
  addCylinder(car, [0, 0.63, -2.26], 0.044, 0.044, 0.01, materials.m4BmwEmblem, {
    rotation: [Math.PI * 0.5, 0, 0],
    segments: 18,
  });
  addBox(car, [0.44, 0.61, -2.26], [0.14, 0.03, 0.01], materials.carChrome);

  // Rear German DIN License Plate `M DI 4015`
  addBox(car, [0, 0.44, -2.25], [0.72, 0.165, 0.015], materials.m4GlossBlack);
  addBox(car, [0, 0.44, -2.258], [0.68, 0.145, 0.005], materials.m4PlateRear);

  // 3D Slim OLED Taillights (L-shaped red light bars)
  for (const tx of [-0.64, 0.64]) {
    addBox(car, [tx, 0.58, -2.24], [0.46, 0.08, 0.05], materials.m4TaillightOLED, { shadow: false });
    addBox(car, [tx, 0.58, -2.248], [0.50, 0.10, 0.03], materials.carGlass);
    addBox(car, [tx + (tx > 0 ? 0.18 : -0.18), 0.55, -2.24], [0.07, 0.05, 0.04], materials.m4TaillightOLED, { shadow: false });
  }

  // Carbon Rear Diffuser with 4 Vertical Strakes
  addBox(car, [0, 0.18, -2.22], [1.82, 0.18, 0.24], materials.m4Carbon);
  for (const stX of [-0.34, -0.11, 0.11, 0.34]) {
    addBox(car, [stX, 0.17, -2.25], [0.03, 0.15, 0.20], materials.m4Carbon);
  }
  // Center F1 Rain Light
  addBox(car, [0, 0.13, -2.27], [0.10, 0.04, 0.02], materials.m4TaillightOLED, { shadow: false });

  // Quad M Chrome Exhaust Pipes
  for (const ex of [-0.62, -0.45, 0.45, 0.62]) {
    addCylinder(car, [ex, 0.19, -2.31], 0.062, 0.062, 0.15, materials.carChrome, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 16,
    });
    addCylinder(car, [ex, 0.19, -2.375], 0.050, 0.050, 0.025, materials.m4GlossBlack, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 14,
    });
  }

  // =========================================================================
  // 8. 4x M FORGED MULTI-SPOKE WHEELS WITH DRILLED CERAMIC ROTORS & GOLD CALIPERS
  // =========================================================================
  const wheelZPositions = [1.38, -1.35]; // Front & Rear axles
  const wheelXPositions = [-1.02, 1.02]; // Left & Right wheel track

  for (const wz of wheelZPositions) {
    for (const wx of wheelXPositions) {
      const isRight = wx > 0;
      const xDir = isRight ? 1 : -1;

      // High-Performance Michelin Rubber Tire (Width = 0.26, radius = 0.34)
      addCylinder(car, [wx, 0.34, wz], 0.34, 0.34, 0.26, materials.carRubber, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 24,
      });

      // Recessed Cross-Drilled Carbon Ceramic Brake Rotor
      addCylinder(car, [wx + xDir * 0.04, 0.34, wz], 0.23, 0.23, 0.03, materials.m4RotorBrake, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 18,
      });

      // Gold 6-Piston M Carbon Ceramic Brake Caliper
      const calZ = wz + (wz > 0 ? 0.09 : -0.09);
      addBox(car, [wx + xDir * 0.05, 0.43, calZ], [0.08, 0.12, 0.15], materials.m4CaliperGold);

      // Satin Black Concave Wheel Hub Face (Placed on the outer plane of the tire)
      const outerX = wx + xDir * 0.132;
      addCylinder(car, [outerX, 0.34, wz], 0.265, 0.265, 0.015, materials.m4WheelRim, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 20,
      });

      // Diamond-Cut Polished Rim Outer Ring
      addCylinder(car, [outerX + xDir * 0.005, 0.34, wz], 0.260, 0.260, 0.012, materials.m4WheelLip, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 20,
      });

      // Floating BMW Roundel Center Hub Cap
      addCylinder(car, [outerX + xDir * 0.012, 0.34, wz], 0.045, 0.045, 0.015, materials.m4BmwEmblem, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 16,
      });

      // 5 M Forged Y-Spoke Pairs on Wheel Face
      for (let s = 0; s < 5; s += 1) {
        const spokeAngle = (s / 5) * Math.PI * 2;
        const spY = 0.34 + Math.sin(spokeAngle) * 0.13;
        const spZ = wz + Math.cos(spokeAngle) * 0.13;
        addBox(car, [outerX + xDir * 0.008, spY, spZ], [0.014, 0.024, 0.16], materials.m4WheelRim, {
          rotation: [spokeAngle, 0, 0],
        });
      }
    }
  }
}

