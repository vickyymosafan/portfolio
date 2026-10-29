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
  // 9 Bespoke Architectural Pavilions across Ground Floor (y = 0) and Lantai 2 (y = 5.2)
  // Designed to embody the exact LinkedIn & GitHub portfolio sequence:
  // 01 About Me -> 02 Work Experience -> 03 Education -> 04 Volunteering ->
  // 05 Licenses & Certifications -> 06 Projects -> 07 Architectural Domain & Tooling ->
  // 08 GitHub Contributions -> 09 Contact
  const roomSpecs = [
    // --- LANTAI 1 (GROUND FLOOR, y = 0.0) ---
    { id: 'about', x: 0.0, y: 0.0, z: -2.0, title: 'About Me', subtitle: '01 · M. VICKY MOSAFAN', accent: palette.coral, rugMat: materials.carpetPersian },
    { id: 'projects', x: -11.0, y: 0.0, z: -2.0, title: 'Featured Projects', subtitle: '06 · ARTIFACT GALLERY', accent: palette.pinkRose, rugMat: materials.carpetBauhaus },
    { id: 'skills', x: 10.75, y: 0.0, z: -2.0, title: 'Tech & Tooling', subtitle: '07 · ARCHITECTURAL DOMAIN', accent: palette.blueSky, rugMat: materials.blue },
    { id: 'garage', x: 21.0, y: 0.0, z: -2.0, title: 'Licenses & Certifications', subtitle: '05 · VERIFIED CREDENTIALS', accent: palette.goldBrass, rugMat: materials.epoxyFloor },
    { id: 'contact', x: 0.0, y: 0.0, z: -11.8, title: 'Let’s Connect', subtitle: '09 · LINKEDIN & GITHUB', accent: palette.coral, rugMat: materials.terraceTiles },

    // --- LANTAI 2 (SECOND FLOOR, y = 5.2m) ---
    { id: 'bedroom', x: -11.0, y: 5.2, z: -2.0, title: 'Education', subtitle: '03 · ACADEMIC HONORS', accent: palette.bluePastel, rugMat: materials.carpetPersian },
    { id: 'bathroom', x: 0.0, y: 5.2, z: -2.0, title: 'Volunteering', subtitle: '04 · LEADERSHIP & COMMUNITY', accent: palette.mintSage, rugMat: materials.carpetBauhaus },
    { id: 'experience', x: 10.75, y: 5.2, z: -2.0, title: 'Work Experience', subtitle: '02 · LINKEDIN CAREER', accent: palette.yellowSun, rugMat: materials.carpetPersian },
    { id: 'process', x: 21.0, y: 5.2, z: -2.0, title: 'GitHub Activity', subtitle: '08 · 1,039 CONTRIBUTIONS', accent: palette.mintSage, rugMat: materials.mint },
  ];

  for (let i = 0; i < roomSpecs.length; i += 1) {
    const spec = roomSpecs[i];

    // Custom area rug for all indoor non-garage pavilions
    if (spec.id !== 'garage' && spec.id !== 'contact' && spec.id !== 'about') {
      const rugW = spec.id === 'bathroom' ? 7.6 : 8.4;
      const rugD = spec.id === 'bathroom' ? 6.0 : 6.4;
      addBox(building, [spec.x, spec.y + 0.02, spec.z], [rugW, 0.016, rugD], spec.rugMat, { receive: false, shadow: false });
    } else if (spec.id === 'about') {
      // Grand central designer area rug defining the About Me Rotunda space
      addBox(building, [-1.4, spec.y + 0.02, 1.7], [6.4, 0.016, 4.6], spec.rugMat, { receive: false, shadow: false });
    }

    // Presentation Display Board mounted in every pavilion (all 9 sections)
    createDisplayBoard(building, spec, world, RAPIER, staticBodies);

    // Bespoke architectural interior & thematic furniture with physics colliders
    buildRoomFurniture(building, spec, world, RAPIER, staticBodies);

    // Interactive glowing floor beacon placed conveniently in front/center of each room
    const isAbout = spec.id === 'about';
    const beaconX = isAbout ? -1.4 : spec.x;
    const beaconZ = spec.id === 'contact' ? -11.8 : (spec.id === 'bathroom' ? -2.2 : (isAbout ? 1.7 : -1.5));
    createFloorBeacon(building, beaconX, spec.y, beaconZ, spec.accent);

    // Register interaction point covering the full room bay
    const roomInfo = portfolio.rooms.find((r) => r.id === spec.id);
    interactionPoints.push({
      id: spec.id,
      title: roomInfo ? roomInfo.title : spec.subtitle,
      position: new THREE.Vector3(beaconX, spec.y + 0.9, beaconZ),
      radius: spec.id === 'bathroom' ? 5.6 : 6.8,
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

  const isAbout = id === 'about';
  const bx = isAbout ? -5.35 : x;
  const by = y;
  let bz = -7.8;
  if (id === 'contact') bz = -15.2;
  else if (isAbout) bz = 1.7;
  else if (id === 'experience' || id === 'bedroom') bz = -7.08;
  else if (id === 'bathroom' || id === 'garage' || id === 'process') bz = -7.45;
  const rotY = isAbout ? Math.PI * 0.5 : 0;

  const display = new THREE.Group();
  display.position.set(bx, by, bz);
  display.rotation.y = rotY;
  parent.add(display);

  // Architectural fluted acoustic timber slats & brass frame behind "About Me" board
  if (isAbout) {
    addBox(display, [0, 2.5, -0.02], [4.2, 3.9, 0.04], materials.woodDark);
    for (let s = -1.95; s <= 1.95; s += 0.2) {
      if (Math.abs(s) > 1.52) {
        addBox(display, [s, 2.5, 0.02], [0.08, 3.8, 0.04], materials.woodLight);
      }
    }
    addBox(display, [0, 4.46, 0.01], [4.26, 0.06, 0.06], materials.brass);
    addBox(display, [0, 0.56, 0.01], [4.26, 0.06, 0.06], materials.brass);
    addBox(display, [-2.12, 2.5, 0.01], [0.06, 3.9, 0.06], materials.brass);
    addBox(display, [2.12, 2.5, 0.01], [0.06, 3.9, 0.06], materials.brass);
  }

  // Wall mounted plaque frame with brushed brass trim
  const boardW = isAbout ? 3.0 : (id === 'bathroom' ? 3.2 : 3.5);
  const boardH = isAbout ? 1.8 : 1.95;
  addBox(display, [0, 2.7, 0.06], [boardW + 0.12, boardH + 0.12, 0.06], materials.brass);
  addBox(display, [0, 2.7, 0.09], [boardW, boardH, 0.08], materials.woodDark);

  // Canvas sign texture
  const signTex = createSignTexture(title, subtitle, accent, 512, 340);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW - 0.2, boardH - 0.2),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45, metalness: 0.05 })
  );
  signMesh.position.set(0, 2.7, 0.15);
  signMesh.castShadow = false;
  signMesh.receiveShadow = false;
  display.add(signMesh);

  // Twin brass picture lamps over board
  for (const lx of isAbout ? [-0.65, 0.65] : [0]) {
    addBox(display, [lx, 2.7 + boardH * 0.5 + 0.14, 0.25], [isAbout ? 0.9 : boardW * 0.55, 0.06, 0.16], materials.brass);
    addSphere(display, [lx, 2.7 + boardH * 0.5 + 0.05, 0.25], [0.14, 0.05, 0.14], materials.glow, { shadow: false });
  }
}

function buildRoomFurniture(parent, room, world, RAPIER, staticBodies) {
  const { x, y, z, id } = room;

  if (id === 'about') {
    // =========================================================================
    // 01 · ABOUT ME — EXECUTIVE BIOGRAPHICAL ROTUNDA & IDENTITY PAVILION
    // Monumental feature wall, Flanking Identity Columns, 4 Pillars of Engineering
    // Craft, Central Rotunda Table with 3D Estate Scale Model (Maquette), and
    // Executive Lounge Suite
    // =========================================================================

    // Multi-tier Sculptural Ring Chandelier centered in About Me Pavilion (y = 4.6)
    const chandelier = new THREE.Group();
    chandelier.position.set(x - 1.4, y + 4.6, 1.7);
    parent.add(chandelier);
    addCylinder(chandelier, [0, 0, 0], 1.65, 1.65, 0.1, materials.brass, { segments: 24 });
    addCylinder(chandelier, [0, -0.04, 0], 1.54, 1.54, 0.06, materials.glow, { segments: 24, shadow: false });
    addCylinder(chandelier, [0, 0.35, 0], 0.95, 0.95, 0.08, materials.brass, { segments: 20 });
    addCylinder(chandelier, [0, 0.31, 0], 0.86, 0.86, 0.05, materials.glow, { segments: 20, shadow: false });
    for (let c = 0; c < 3; c += 1) {
      const angle = (c / 3) * Math.PI * 2;
      addCylinder(chandelier, [Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.5], 0.015, 0.015, 0.9, materials.brass);
    }

    // Flanking Illuminated Biographical Columns on West Wall (z = -0.35 and z = 3.75)
    for (const cz of [-0.35, 3.75]) {
      addBox(parent, [x - 5.18, y + 2.25, cz], [0.36, 4.3, 0.46], materials.woodDark);
      addBox(parent, [x - 4.98, y + 2.25, cz], [0.04, 3.9, 0.08], materials.glow, { shadow: false });
      addBox(parent, [x - 5.12, y + 1.0, cz], [0.38, 0.05, 0.48], materials.brass);
      addSphere(parent, [x - 5.05, y + 1.25, cz], [0.11, 0.11, 0.11], materials.gold);
    }

    // --- FEATURE WALL EXHIBITION CONSOLE (Below "About Me" Display Board at x = -5.12, z = 1.7) ---
    addBox(parent, [x - 5.12, y + 0.46, 1.7], [0.48, 0.54, 3.5], materials.woodDark);
    addBox(parent, [x - 5.10, y + 0.75, 1.7], [0.52, 0.05, 3.56], materials.stone);
    addBox(parent, [x - 4.86, y + 0.46, 1.7], [0.02, 0.48, 3.4], materials.brass);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 5.12, y + 0.45, 1.7], [0.28, 0.45, 1.78]);

    // Signature Biographical Artifacts on Credenza:
    // 1. Center: Golden Developer Architecture Crest (<VM/>) on Stepped Marble Plinth
    addBox(parent, [x - 5.05, y + 0.84, 1.7], [0.24, 0.12, 0.58], materials.stoneWarm);
    addBox(parent, [x - 5.05, y + 0.96, 1.7], [0.08, 0.24, 0.46], materials.gold);
    addSphere(parent, [x - 5.05, y + 1.16, 1.7], [0.09, 0.09, 0.09], materials.glow, { shadow: false });
    // 2. North: Innovation Milestone Star Trophy in Gold
    addCylinder(parent, [x - 5.06, y + 0.84, 2.65], 0.10, 0.12, 0.18, materials.brass, { segments: 14 });
    addSphere(parent, [x - 5.06, y + 1.02, 2.65], [0.09, 0.14, 0.09], materials.gold);
    // 3. South: Sculptural Teal Ceramic Bonsai Planter
    addCylinder(parent, [x - 5.06, y + 0.85, 0.75], 0.12, 0.09, 0.20, materials.ceramicTeal, { segments: 14 });
    addSphere(parent, [x - 5.06, y + 1.04, 0.75], [0.16, 0.12, 0.16], materials.foliageBright);

    // --- 4 ARCHITECTURAL PILLARS OF VICKY'S CRAFT (SOLID, Backend, Frontend/3D, AI SDLC) ---
    const pillars = [
      { z: 3.05, mat: materials.blue, cap: materials.brass },
      { z: 2.15, mat: materials.emerald, cap: materials.gold },
      { z: 1.25, mat: materials.coral, cap: materials.brass },
      { z: 0.35, mat: materials.gold, cap: materials.gold },
    ];
    for (const p of pillars) {
      addBox(parent, [x - 3.35, y + 0.42, p.z], [0.40, 0.84, 0.40], materials.woodWarm);
      addBox(parent, [x - 3.35, y + 0.86, p.z], [0.46, 0.04, 0.46], p.cap);
      addSphere(parent, [x - 3.35, y + 1.04, p.z], [0.11, 0.14, 0.11], p.mat);
      addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.35, y + 0.45, p.z], [0.24, 0.45, 0.24]);
    }

    // --- CENTRAL IDENTITY ROTUNDA TABLE WITH 3D ARCHITECTURAL MAQUETTE OF VICKY'S ESTATE ---
    // Circular Italian Marble & Brushed Brass Rotunda Table at [x - 1.4, z = 1.7]
    const rotunda = new THREE.Group();
    rotunda.position.set(x - 1.4, y, 1.7);
    parent.add(rotunda);
    addCylinder(rotunda, [0, 0.32, 0], 0.42, 0.52, 0.64, materials.woodDark, { segments: 20 });
    addCylinder(rotunda, [0, 0.66, 0], 0.88, 0.88, 0.06, materials.stone, { segments: 24 });
    addCylinder(rotunda, [0, 0.695, 0], 0.90, 0.90, 0.02, materials.brass, { segments: 24 });
    // Miniature 3D Architectural Scale Model (Maquette) of the Mansion on top of the Rotunda Table!
    addBox(rotunda, [0, 0.72, 0], [1.15, 0.03, 0.85], materials.foliageMid); // Mini estate lawn
    addBox(rotunda, [-0.36, 0.74, 0.08], [0.24, 0.02, 0.36], materials.poolWater, { shadow: false }); // Mini pool
    addBox(rotunda, [0.06, 0.82, -0.04], [0.58, 0.18, 0.32], materials.wall); // Mini mansion body
    addBox(rotunda, [0.06, 0.93, -0.04], [0.64, 0.06, 0.38], materials.roof); // Mini slate roof
    for (const mcx of [-0.10, -0.03, 0.03, 0.10]) {
      addCylinder(rotunda, [0.06 + mcx, 0.82, 0.14], 0.012, 0.012, 0.18, materials.column, { segments: 8 });
    }
    addSphere(rotunda, [0.06, 1.08, -0.04], [0.08, 0.08, 0.08], materials.glow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.4, y + 0.48, 1.7], [0.88, 0.48, 0.88]);

    // --- EXECUTIVE BIOGRAPHICAL LOUNGE SUITE (Oriented West toward About Me Feature Wall) ---
    // Pair of Sculpted Terracotta & Brushed-Brass Lounge Armchairs at x = +0.55
    for (const cz of [-0.85, 0.85]) {
      const arm = new THREE.Group();
      arm.position.set(x + 0.55, y, 1.7 + cz);
      arm.rotation.y = Math.PI;
      parent.add(arm);
      addBox(arm, [0, 0.16, 0], [0.88, 0.05, 0.82], materials.brass);
      addBox(arm, [0, 0.40, 0], [0.84, 0.38, 0.78], materials.terracotta);
      addBox(arm, [0.34, 0.78, 0], [0.14, 0.54, 0.78], materials.terracotta, { rotation: [0, 0, -0.14] });
      addBox(arm, [0.02, 0.58, -0.36], [0.80, 0.24, 0.10], materials.woodDark);
      addBox(arm, [0.02, 0.58, 0.36], [0.80, 0.24, 0.10], materials.woodDark);
      addBox(arm, [0.20, 0.66, 0], [0.14, 0.32, 0.40], cz > 0 ? materials.cushionYellow : materials.cushionMint);
      addFurnitureCollider(world, RAPIER, staticBodies, [x + 0.55, y + 0.45, 1.7 + cz], [0.46, 0.45, 0.44]);
    }

    // Architectural Fig Tree in Corner (x = -4.6, z = 3.2)
    addCylinder(parent, [x - 4.6, y + 0.45, 3.2], 0.38, 0.28, 0.9, materials.ceramicTerracotta, { segments: 16 });
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      addSphere(parent, [x - 4.6 + Math.cos(angle) * 0.38, y + 1.35 + (i % 2) * 0.18, 3.2 + Math.sin(angle) * 0.38], [0.36, 0.22, 0.36], materials.foliageBright);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.6, y + 0.55, 3.2], [0.4, 0.55, 0.4]);

    // Rear Media Wall on West Partition (x = -5.35, z = -6.0)
    const mediaWall = new THREE.Group();
    mediaWall.position.set(x - 5.35, y + 2.2, -6.0);
    mediaWall.rotation.y = Math.PI * 0.5;
    parent.add(mediaWall);
    addBox(mediaWall, [0, 0, 0], [2.6, 1.5, 0.06], materials.metalDark);
    addBox(mediaWall, [0, 0, 0.04], [2.48, 1.38, 0.02], materials.artLandscape, { shadow: false });
    addBox(parent, [x - 5.15, y + 0.42, -6.0], [0.42, 0.42, 2.4], materials.woodDark);
    addBox(parent, [x - 5.14, y + 0.64, -6.0], [0.40, 0.02, 2.3], materials.stone);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 5.15, y + 0.45, -6.0], [0.25, 0.45, 1.25]);
  } else if (id === 'projects') {
    // =========================================================================
    // 06 · PROJECTS — FLAGSHIP SOFTWARE & AI PRODUCT EXPO PAVILION
    // Panorama Product Wall, AI/RAG Vector Graph Hologram Kiosk, FinTech Bullish
    // Candlestick Kiosk, Healthcare/Enterprise SaaS Wall, and Museum Viewing Bench
    // =========================================================================

    // Architectural Acoustic Backdrop Slats flanking the central Featured Projects board on back wall
    for (const side of [-1, 1]) {
      addBox(parent, [x + side * 3.5, y + 2.55, z - 5.76], [2.75, 3.6, 0.05], materials.woodDark);
      addBox(parent, [x + side * 3.5, y + 4.38, z - 5.74], [2.82, 0.06, 0.08], materials.brass);
    }

    // 3 Illuminated 4K Product Showcase Screens (2 flanking the central display board, 1 on West wall)
    const showcases = [
      { pos: [x - 3.5, y + 2.6, z - 5.68], rotY: 0, mat: materials.screenCode, accentMat: materials.coral },
      { pos: [x + 3.5, y + 2.6, z - 5.68], rotY: 0, mat: materials.screenGlow, accentMat: materials.emeraldBright },
      { pos: [x - 4.75, y + 2.6, z - 1.8], rotY: Math.PI * 0.5, mat: materials.screenTerminal, accentMat: materials.gold },
    ];
    for (const sc of showcases) {
      const frame = new THREE.Group();
      frame.position.set(sc.pos[0], sc.pos[1], sc.pos[2]);
      frame.rotation.y = sc.rotY;
      parent.add(frame);
      addBox(frame, [0, 0, 0], [2.55, 1.75, 0.08], materials.metalDark);
      addBox(frame, [0, 0, 0.05], [2.38, 1.58, 0.02], sc.mat, { shadow: false });
      addBox(frame, [0, -1.04, 0.05], [1.6, 0.16, 0.04], materials.brass);
      addBox(frame, [0, -1.04, 0.08], [1.4, 0.06, 0.02], sc.accentMat, { shadow: false });
      addBox(frame, [0, 1.08, 0.18], [1.1, 0.06, 0.14], materials.brass);
      addSphere(frame, [0, 1.02, 0.18], [0.1, 0.04, 0.1], materials.glow, { shadow: false });
    }

    // West Island Kiosk (x - 3.3, z - 3.4): Beyond-RAG ASI & Hybrid Vector Retrieval Hologram Pod
    const ragPod = new THREE.Group();
    ragPod.position.set(x - 3.3, y, z - 3.4);
    parent.add(ragPod);
    addCylinder(ragPod, [0, 0.12, 0], 0.85, 0.92, 0.24, materials.woodDark, { segments: 16 });
    addCylinder(ragPod, [0, 0.58, 0], 0.56, 0.64, 0.72, materials.stone, { segments: 16 });
    addCylinder(ragPod, [0, 0.96, 0], 0.68, 0.68, 0.06, materials.brass, { segments: 16 });
    // Floating 3D Hybrid Retrieval Vector Graph Sculpture (Core + Orbital Rings + Knowledge Nodes)
    addSphere(ragPod, [0, 1.52, 0], [0.22, 0.22, 0.22], materials.blueSky, { shadow: false });
    addCylinder(ragPod, [0, 1.52, 0], 0.48, 0.48, 0.025, materials.brass, { rotation: [0.42, 0, 0.32], segments: 18 });
    addCylinder(ragPod, [0, 1.52, 0], 0.44, 0.44, 0.025, materials.gold, { rotation: [-0.38, 0, -0.45], segments: 18 });
    for (let n = 0; n < 4; n += 1) {
      const a = (n / 4) * Math.PI * 2 + 0.4;
      addSphere(ragPod, [Math.cos(a) * 0.44, 1.52 + (n % 2 === 0 ? 0.14 : -0.14), Math.sin(a) * 0.44], [0.07, 0.07, 0.07], n % 2 === 0 ? materials.coral : materials.glow, { shadow: false });
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.3, y + 0.85, z - 3.4], [0.75, 0.85, 0.75]);

    // East Island Kiosk (x + 3.3, z - 3.4): Destino Copytrade & MQL5 Algo-Trading Bullish Candlestick Pod
    const algoPod = new THREE.Group();
    algoPod.position.set(x + 3.3, y, z - 3.4);
    parent.add(algoPod);
    addCylinder(algoPod, [0, 0.12, 0], 0.85, 0.92, 0.24, materials.woodDark, { segments: 16 });
    addCylinder(algoPod, [0, 0.58, 0], 0.56, 0.64, 0.72, materials.stone, { segments: 16 });
    addCylinder(algoPod, [0, 0.96, 0], 0.68, 0.68, 0.06, materials.brass, { segments: 16 });
    // 3D Ascending Financial Candlestick Chart Sculpture on top of the pod!
    const candles = [
      { dx: -0.32, h: 0.28, y0: 1.22, mat: materials.emerald },
      { dx: -0.16, h: 0.22, y0: 1.28, mat: materials.coral },
      { dx: 0.0, h: 0.36, y0: 1.38, mat: materials.emeraldBright },
      { dx: 0.16, h: 0.30, y0: 1.50, mat: materials.emerald },
      { dx: 0.32, h: 0.42, y0: 1.66, mat: materials.gold },
    ];
    for (const c of candles) {
      addCylinder(algoPod, [c.dx, c.y0, 0], 0.015, 0.015, c.h + 0.18, materials.brass, { segments: 8 });
      addBox(algoPod, [c.dx, c.y0, 0], [0.10, c.h, 0.10], c.mat);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 3.3, y + 0.85, z - 3.4], [0.75, 0.85, 0.75]);

    // West Wall Console Table below the 3rd Showcase Screen (x - 4.4, z - 1.8)
    addBox(parent, [x - 4.4, y + 0.48, z - 1.8], [0.65, 0.52, 2.6], materials.woodDark);
    addBox(parent, [x - 4.38, y + 0.76, z - 1.8], [0.68, 0.04, 2.66], materials.stone);
    addBox(parent, [x - 4.35, y + 0.92, z - 2.3], [0.36, 0.26, 0.52], materials.wall); // Mini Posyandu clinic model
    addBox(parent, [x - 4.35, y + 1.08, z - 2.3], [0.42, 0.06, 0.58], materials.coral);
    addBox(parent, [x - 4.35, y + 0.90, z - 1.2], [0.32, 0.24, 0.45], materials.screenGlow, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.4, y + 0.5, z - 1.8], [0.38, 0.5, 1.35]);

    // Upholstered Gallery Center Bench in Navy Velvet & Brushed Brass
    addBox(parent, [x, y + 0.46, z + 0.5], [3.2, 0.36, 1.15], materials.navy);
    addBox(parent, [x, y + 0.25, z + 0.5], [3.26, 0.06, 1.20], materials.brass);
    addBox(parent, [x - 1.25, y + 0.14, z + 0.5], [0.18, 0.28, 1.05], materials.woodDark);
    addBox(parent, [x + 1.25, y + 0.14, z + 0.5], [0.18, 0.28, 1.05], materials.woodDark);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.35, z + 0.5], [1.65, 0.35, 0.65]);
  } else if (id === 'skills') {
    // =========================================================================
    // 07 · ARCHITECTURAL DOMAIN & CORE TECHNOLOGIES & TOOLING
    // 6-Domain Matrix Wall, Principal Architect 4-Monitor Battle Station,
    // Dual Enterprise Backend & Vector Database Server Racks, and Blueprint Wall
    // =========================================================================

    // 6 Architectural Domain Pillars flanking the central Display Board on Back Wall (z = -7.68)
    // Matching the 6 rows: Languages, Frontend, Backend, Databases, AI Tooling, DevOps
    const domainPillarSpecs = [
      { dx: -3.8, dy: 3.4, colorMat: materials.blue },
      { dx: -3.8, dy: 2.5, colorMat: materials.screenGlow },
      { dx: -3.8, dy: 1.6, colorMat: materials.emerald },
      { dx: 3.8, dy: 3.4, colorMat: materials.navy },
      { dx: 3.8, dy: 2.5, colorMat: materials.coral },
      { dx: 3.8, dy: 1.6, colorMat: materials.gold },
    ];
    for (const side of [-1, 1]) {
      addBox(parent, [x + side * 3.8, y + 2.5, z - 5.74], [1.9, 3.4, 0.08], materials.woodDark);
      addBox(parent, [x + side * 3.8, y + 4.24, z - 5.72], [1.98, 0.06, 0.12], materials.brass);
    }
    for (const dp of domainPillarSpecs) {
      addBox(parent, [x + dp.dx, y + dp.dy, z - 5.66], [1.65, 0.62, 0.06], materials.metalDark);
      addBox(parent, [x + dp.dx, y + dp.dy, z - 5.62], [1.52, 0.48, 0.03], dp.colorMat);
      addSphere(parent, [x + dp.dx - 0.62, y + dp.dy, z - 5.58], [0.06, 0.06, 0.06], materials.glow, { shadow: false });
    }

    // Executive Principal Architect Desk in Warm Oak & Brushed Steel facing forward (+Z)
    addBox(parent, [x, y + 0.95, z - 1.4], [4.8, 0.14, 1.65], materials.woodWarm);
    addBox(parent, [x, y + 0.87, z - 1.4], [4.84, 0.04, 1.68], materials.brass);
    addBox(parent, [x - 2.15, y + 0.46, z - 1.4], [0.22, 0.92, 1.45], materials.metalDark);
    addBox(parent, [x + 2.15, y + 0.46, z - 1.4], [0.22, 0.92, 1.45], materials.metalDark);
    addBox(parent, [x, y + 1.03, z - 1.3], [3.4, 0.02, 1.1], materials.ink);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.55, z - 1.4], [2.4, 0.55, 0.85]);

    // 4-Monitor Principal Architect Array (Triple Curved + 4th Overhead Telemetry Screen)
    const monitorConfigs = [
      { dx: -1.22, dy: 1.48, rotY: 0.24, rotX: 0, mat: materials.screenTerminal },
      { dx: 0.0, dy: 1.48, rotY: 0.0, rotX: 0, mat: materials.screenCode },
      { dx: 1.22, dy: 1.48, rotY: -0.24, rotX: 0, mat: materials.screenCad },
      { dx: 0.0, dy: 2.12, rotY: 0.0, rotX: 0.18, mat: materials.screenTerminal },
    ];
    for (const mc of monitorConfigs) {
      const mon = new THREE.Group();
      mon.position.set(x + mc.dx, y + mc.dy, z - 1.72);
      mon.rotation.set(mc.rotX, mc.rotY, 0);
      parent.add(mon);
      addBox(mon, [0, 0, 0], [1.14, 0.62, 0.07], materials.metalDark);
      addBox(mon, [0, 0, 0.042], [1.06, 0.54, 0.02], mc.mat, { shadow: false });
    }
    addCylinder(parent, [x, y + 1.52, z - 1.82], 0.045, 0.045, 1.15, materials.metalDark);

    // Custom Liquid-Cooled Glass Workstation Tower on right side of desk
    const pc = new THREE.Group();
    pc.position.set(x + 1.98, y + 1.38, z - 1.4);
    parent.add(pc);
    addBox(pc, [0, 0, 0], [0.44, 0.72, 0.82], materials.metalDark);
    addBox(pc, [-0.23, 0, 0], [0.02, 0.68, 0.78], materials.glass);
    addBox(pc, [-0.05, 0.1, 0], [0.28, 0.25, 0.5], materials.screenGlow, { shadow: false });

    // Ergonomic High-Back Architect Chair in front of desk
    const chair = new THREE.Group();
    chair.position.set(x, y, z - 0.15);
    parent.add(chair);
    addCylinder(chair, [0, 0.1, 0], 0.38, 0.38, 0.06, materials.metalDark, { segments: 16 });
    addCylinder(chair, [0, 0.32, 0], 0.05, 0.05, 0.38, materials.brass);
    addBox(chair, [0, 0.55, 0], [0.75, 0.12, 0.75], materials.metalDark);
    addBox(chair, [0, 1.15, -0.34], [0.68, 1.05, 0.08], materials.metalDark);
    addBox(chair, [0, 1.75, -0.34], [0.42, 0.22, 0.08], materials.brass);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.6, z - 0.15], [0.42, 0.6, 0.42]);

    // West Wall (x - 4.45, z - 2.2): Dual Enterprise Backend & Vector Database Server Racks
    // Representing Node.js / NestJS / Laravel + PostgreSQL / MySQL / MongoDB / Supabase Vector
    for (const rz of [-3.2, -1.5]) {
      const rack = new THREE.Group();
      rack.position.set(x - 4.45, y + 1.4, z + rz);
      parent.add(rack);
      addBox(rack, [0, 0, 0], [0.95, 2.8, 1.15], materials.metalDark);
      addBox(rack, [0.48, 0, 0], [0.02, 2.6, 1.02], materials.glass);
      for (let by = -1.0; by <= 1.0; by += 0.34) {
        addBox(rack, [0.06, by, 0], [0.78, 0.22, 0.96], materials.ink);
        addBox(rack, [0.46, by, -0.32], [0.02, 0.05, 0.18], by > 0 ? materials.emeraldBright : materials.screenGlow, { shadow: false });
        addSphere(rack, [0.46, by, 0.32], [0.03, 0.03, 0.03], materials.gold, { shadow: false });
      }
      addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.45, y + 1.4, z + rz], [0.52, 1.4, 0.62]);
    }
    // 3D Relational & Vector Database Cylinder Stack next to Server Racks (x - 4.35, z + 0.2)
    for (let tier = 0; tier < 3; tier += 1) {
      const ty = y + 0.32 + tier * 0.42;
      addCylinder(parent, [x - 4.35, ty, z + 0.2], 0.46, 0.46, 0.32, tier === 2 ? materials.emerald : materials.blue, { segments: 18 });
      addCylinder(parent, [x - 4.35, ty + 0.17, z + 0.2], 0.48, 0.48, 0.03, materials.brass, { segments: 18 });
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 4.35, y + 0.7, z + 0.2], [0.5, 0.7, 0.5]);

    // East Partition Wall (x + 5.05, z - 1.5): System Architecture Blueprint Whiteboard
    const wb = new THREE.Group();
    wb.position.set(x + 5.05, y + 2.6, z - 1.5);
    wb.rotation.y = -Math.PI * 0.5;
    parent.add(wb);
    addBox(wb, [0, 0, 0], [4.0, 2.0, 0.06], materials.trim);
    addBox(wb, [0, 0, 0.04], [3.8, 1.8, 0.02], materials.whiteboardDiagram, { shadow: false });
    addBox(wb, [0, -0.95, 0.08], [2.8, 0.04, 0.12], materials.metalDark);
  } else if (id === 'garage') {
    // =========================================================================
    // 05 · LICENSES & CERTIFICATIONS — EXECUTIVE CREDENTIAL VAULT & BMW M4 SHOWROOM
    // Hall of 6 Gold-Framed Certification Plaques, 2 Glass Credential Trophy
    // Cabinets, Illuminated Showroom Turntable Podium, and BMW M4 Competition
    // =========================================================================

    // Illuminated Circular Marble & Brass Showroom Turntable Podium beneath the BMW M4
    addCylinder(parent, [x, y + 0.02, z - 0.5], 2.72, 2.78, 0.04, materials.brass, { segments: 32, shadow: false });
    addCylinder(parent, [x, y + 0.045, z - 0.5], 2.58, 2.58, 0.03, materials.stone, { segments: 32, shadow: false, receive: false });
    addCylinder(parent, [x, y + 0.012, z - 0.5], 2.82, 2.82, 0.015, materials.glow, { segments: 32, shadow: false });

    // Stylized BMW M4 Competition Coupe centered on the showroom turntable
    buildSportsCar(parent, x, y + 0.05, z - 0.5);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.75, z - 0.5], [1.15, 0.75, 2.3]);

    // Back Wall (z = -7.5): Hall of Verified Credentials & 6 Gold-Framed Certification Plaques
    // Flanking the central "05 · VERIFIED CREDENTIALS — Licenses & Certifications" board
    addBox(parent, [x, y + 2.5, z - 5.68], [8.6, 4.2, 0.12], materials.woodEspresso);
    addBox(parent, [x, y + 4.62, z - 5.64], [8.7, 0.08, 0.18], materials.brass);
    addBox(parent, [x, y + 0.42, z - 5.64], [8.7, 0.08, 0.18], materials.brass);

    const certCoords = [
      [-3.15, 3.45], [-3.15, 2.35], [-3.15, 1.25],
      [3.15, 3.45], [3.15, 2.35], [3.15, 1.25],
    ];
    for (let c = 0; c < certCoords.length; c += 1) {
      const [cx, cy] = certCoords[c];
      // Brushed gold frame + dark velvet certificate mat + ivory parchment + golden seal
      addBox(parent, [x + cx, y + cy, z - 5.56], [1.85, 0.86, 0.06], materials.gold);
      addBox(parent, [x + cx, y + cy, z - 5.52], [1.72, 0.74, 0.03], materials.navy);
      addBox(parent, [x + cx, y + cy, z - 5.49], [1.48, 0.54, 0.02], materials.cream);
      addCylinder(parent, [x + cx + 0.52, y + cy - 0.12, z - 5.47], 0.09, 0.09, 0.02, materials.gold, { rotation: [Math.PI * 0.5, 0, 0], segments: 12 });
      addBox(parent, [x + cx - 0.15, y + cy + 0.08, z - 5.47], [0.85, 0.06, 0.015], c % 2 === 0 ? materials.coral : materials.blue, { shadow: false });
    }

    // West & East Showroom Walls: 2 Tall Illuminated Glass Credential & Trophy Cabinets
    for (const side of [-1, 1]) {
      const cab = new THREE.Group();
      cab.position.set(x + side * 4.15, y, z - 2.8);
      cab.rotation.y = side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      parent.add(cab);
      addBox(cab, [0, 1.45, 0], [2.2, 2.9, 0.65], materials.woodDark);
      addBox(cab, [0, 2.92, 0], [2.28, 0.08, 0.72], materials.brass);
      for (const sy of [0.85, 1.55, 2.25]) {
        addBox(cab, [0, sy, 0.04], [2.04, 0.04, 0.56], materials.brass);
        // Golden Certification Trophies & Cloud Architecture Cubes on shelves
        addCylinder(cab, [-0.55, sy + 0.18, 0.06], 0.11, 0.14, 0.28, materials.gold, { segments: 14 });
        addSphere(cab, [0, sy + 0.22, 0.06], [0.13, 0.13, 0.13], sy > 1.5 ? materials.glow : materials.blueSky, { shadow: false });
        addBox(cab, [0.55, sy + 0.18, 0.06], [0.24, 0.28, 0.06], materials.coral);
      }
      addBox(cab, [0, 1.45, 0.33], [2.06, 2.7, 0.02], materials.glass);
      addFurnitureCollider(world, RAPIER, staticBodies, [x + side * 4.15, y + 1.45, z - 2.8], [0.4, 1.45, 1.15]);
    }
  } else if (id === 'bedroom') {
    // =========================================================================
    // 03 · EDUCATION — UNIVERSITY ACADEMIC HALL & RRF THESIS LAB
    // (Lantai 2 Left, x = -11.0, y = 5.2, z = -2.0)
    // Grand Academic Honors Colonnade & Bookcase Wall, Cum Laude GPA 3.94/4.00
    // Mortarboard Toga & Diploma Pedestal, Weighted RRF Thesis Research Desk & Whiteboard
    // =========================================================================

    // 1. Grand University Honors Colonnade & Bookcase Wall on Back Wall (z = -7.3)
    const acadWall = new THREE.Group();
    acadWall.position.set(x, y, z - 5.3);
    parent.add(acadWall);

    addBox(acadWall, [0, 2.4, -0.1], [8.8, 4.8, 0.25], materials.woodDark);
    addBox(acadWall, [0, 4.72, 0.05], [9.0, 0.16, 0.42], materials.brass);
    // Classical Academic Fluted Columns framing the central 03 · Education display board
    for (const cx of [-4.1, -2.05, 2.05, 4.1]) {
      addCylinder(acadWall, [cx, 2.35, 0.12], 0.16, 0.18, 4.6, materials.cream, { segments: 12 });
      addBox(acadWall, [cx, 0.12, 0.12], [0.44, 0.24, 0.44], materials.brass);
      addBox(acadWall, [cx, 4.58, 0.12], [0.44, 0.22, 0.44], materials.brass);
    }
    // Left & Right Academic Wing Bookshelves with batched hardcover reference volumes
    const eduBooks = new BatchCollector();
    const eduPalette = [materials.navy, materials.terracotta, materials.emerald, materials.gold, materials.blueSky, materials.coral];
    for (const side of [-1, 1]) {
      const wingX = side * 3.08;
      for (const sy of [0.85, 1.65, 2.45, 3.25, 4.05]) {
        addBox(acadWall, [wingX, sy, 0.08], [1.75, 0.06, 0.38], materials.woodWarm);
        for (let b = -0.72; b <= 0.72; b += 0.24) {
          const seed = Math.abs(Math.sin(b * 19.3 + sy * 7.1 + side));
          const bh = 0.38 + seed * 0.18;
          eduBooks.addBox(
            [wingX + b, sy + 0.03 + bh * 0.5, 0.1],
            [0.18, bh, 0.28],
            eduPalette[Math.abs(Math.round(b * 10 + sy * 3)) % eduPalette.length]
          );
        }
      }
    }
    eduBooks.build(acadWall, false);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 2.4, z - 5.3], [4.4, 2.4, 0.35]);

    // 2. Cum Laude GPA 3.94/4.00 Graduation & Diploma Monument Pedestal (Left, x - 2.3, z - 2.3)
    const gradPod = new THREE.Group();
    gradPod.position.set(x - 2.3, y, z - 2.3);
    parent.add(gradPod);

    addCylinder(gradPod, [0, 0.08, 0], 1.15, 1.25, 0.16, materials.woodDark, { segments: 16 });
    addCylinder(gradPod, [0, 0.18, 0], 1.02, 1.05, 0.05, materials.gold, { segments: 16 });
    addCylinder(gradPod, [0, 0.68, 0], 0.52, 0.62, 0.96, materials.ceramic, { segments: 16 });
    addCylinder(gradPod, [0, 1.18, 0], 0.68, 0.64, 0.08, materials.brass, { segments: 16 });

    // 3D Graduation Mortarboard Cap (Topi Toga Wisuda) with Golden Tassel
    addCylinder(gradPod, [-0.15, 1.28, 0.05], 0.22, 0.20, 0.14, materials.navy, { segments: 12 });
    addBox(gradPod, [-0.15, 1.37, 0.05], [0.58, 0.04, 0.58], materials.navy, { rotation: [0.06, Math.PI * 0.25, 0] });
    addSphere(gradPod, [-0.15, 1.40, 0.05], [0.04, 0.04, 0.04], materials.gold, { shadow: false, lowPoly: true });
    addBox(gradPod, [0.08, 1.33, 0.18], [0.04, 0.18, 0.04], materials.gold, { rotation: [0, 0, -0.35] });

    // Rolled Cum Laude Diploma Scroll tied with Crimson Ribbon + Golden GPA 3.94 Star Trophy
    addCylinder(gradPod, [0.22, 1.27, 0.18], 0.05, 0.05, 0.42, materials.cream, { rotation: [0, 0.4, Math.PI * 0.5], segments: 10 });
    addCylinder(gradPod, [0.22, 1.27, 0.18], 0.056, 0.056, 0.06, materials.coral, { rotation: [0, 0.4, Math.PI * 0.5], segments: 10 });
    addCylinder(gradPod, [0.18, 1.38, -0.18], 0.09, 0.12, 0.32, materials.gold, { segments: 12 });
    addSphere(gradPod, [0.18, 1.60, -0.18], [0.12, 0.12, 0.12], materials.glow, { shadow: false, lowPoly: true });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.3, y + 0.85, z - 2.3], [1.1, 0.85, 1.1]);

    // 3. Weighted RRF Thesis & Academic Research Desk (Right, x + 2.1, z - 2.1)
    const thesisDesk = new THREE.Group();
    thesisDesk.position.set(x + 2.1, y, z - 2.1);
    parent.add(thesisDesk);

    addBox(thesisDesk, [0, 0.88, 0], [2.8, 0.1, 1.35], materials.woodWarm);
    addBox(thesisDesk, [0, 0.94, 0], [2.84, 0.03, 1.39], materials.brass);
    addBox(thesisDesk, [-1.2, 0.44, 0], [0.22, 0.88, 1.15], materials.woodDark);
    addBox(thesisDesk, [1.2, 0.44, 0], [0.22, 0.88, 1.15], materials.woodDark);
    // Dual Thesis Analysis Monitors (Dense Vector + BM25 Lexical Fusion)
    for (const mx of [-0.58, 0.42]) {
      addBox(thesisDesk, [mx, 1.36, -0.28], [0.95, 0.58, 0.06], materials.metalDark);
      addBox(thesisDesk, [mx, 1.36, -0.24], [0.89, 0.52, 0.02], mx < 0 ? materials.screenCode : materials.screenGlow, { shadow: false });
      addCylinder(thesisDesk, [mx, 1.02, -0.3], 0.04, 0.05, 0.22, materials.metalDark);
    }
    // Brass & Sky-Blue Academic Terrestrial Globe on right corner of desk
    addCylinder(thesisDesk, [1.05, 0.98, 0.15], 0.14, 0.16, 0.05, materials.brass, { segments: 12 });
    addCylinder(thesisDesk, [1.05, 1.16, 0.15], 0.02, 0.02, 0.34, materials.brass);
    addSphere(thesisDesk, [1.05, 1.24, 0.15], [0.18, 0.18, 0.18], materials.blueSky, { lowPoly: true });
    // Stacked Thesis Manuscripts
    addBox(thesisDesk, [-1.05, 0.99, 0.2], [0.36, 0.08, 0.46], materials.navy);
    addBox(thesisDesk, [-1.03, 1.06, 0.2], [0.34, 0.06, 0.44], materials.gold);
    // Scholar Ergonomic Leather Chair
    addBox(thesisDesk, [-0.08, 0.5, 0.95], [0.74, 0.12, 0.72], materials.terracotta);
    addBox(thesisDesk, [-0.08, 1.05, 1.28], [0.70, 0.98, 0.12], materials.terracotta);
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.1, y + 0.75, z - 1.9], [1.45, 0.75, 1.1]);

    // 4. Weighted RRF Formula & Hybrid Architecture Whiteboard on West Wall (x - 4.78, z - 1.5)
    const wb = new THREE.Group();
    wb.position.set(x - 4.78, y + 2.2, z - 1.5);
    wb.rotation.y = Math.PI * 0.5;
    parent.add(wb);
    addBox(wb, [0, 0, 0], [3.2, 1.85, 0.08], materials.brass);
    addBox(wb, [0, 0, 0.05], [3.04, 1.68, 0.03], materials.ceramic);
    // 3D Diagram nodes on whiteboard (BM25 + pgvector -> Weighted RRF -> Cross-Encoder Rerank)
    addBox(wb, [-0.95, 0.32, 0.08], [0.68, 0.34, 0.03], materials.blueSky);
    addBox(wb, [-0.95, -0.28, 0.08], [0.68, 0.34, 0.03], materials.emerald);
    addBox(wb, [0.0, 0.02, 0.08], [0.76, 0.42, 0.04], materials.gold);
    addBox(wb, [0.95, 0.02, 0.08], [0.68, 0.38, 0.03], materials.coral);
  } else if (id === 'bathroom') {
    // =========================================================================
    // 04 · VOLUNTEERING — COMMUNITY IMPACT, CODING WORKSHOP & HIMAFORSI MEDIATECH HUB
    // (Lantai 2 Center, x = 0.0, y = 5.2, z = -2.0)
    // Community Leadership Stage & Dual Interactive Teaching Screens, Guest Speaker
    // Lectern, "RTIK Goes to School" Student Coding Workshop Tables, HIMAFORSI Camera Rig
    // =========================================================================

    // 1. Community Leadership Backdrop & Dual Interactive Teaching Screens on Back Wall (z = -7.3)
    const volWall = new THREE.Group();
    volWall.position.set(x, y, z - 5.3);
    parent.add(volWall);

    addBox(volWall, [0, 0.12, 0.65], [8.6, 0.24, 1.8], materials.woodWarm);
    addBox(volWall, [0, 0.25, 1.52], [8.64, 0.04, 0.08], materials.brass);
    // Left & Right Interactive Classroom Display Screens flanking 04 · Volunteering board
    for (const side of [-1, 1]) {
      const sx = side * 3.1;
      addBox(volWall, [sx, 2.35, 0.08], [2.1, 1.35, 0.1], materials.metalDark);
      addBox(volWall, [sx, 2.35, 0.14], [1.96, 1.22, 0.02], side < 0 ? materials.screenCode : materials.screenGlow, { shadow: false });
      addBox(volWall, [sx, 2.35, 0.02], [2.24, 1.48, 0.04], materials.brass);
    }

    // 2. Guest Speaker Lectern / Podium ("Guru Tamu SMK Muhammadiyah 5 Kepanjen")
    const lectern = new THREE.Group();
    lectern.position.set(x + 1.65, y + 0.24, z - 4.15);
    lectern.rotation.y = -0.25;
    parent.add(lectern);
    addBox(lectern, [0, 0.58, 0], [0.78, 1.16, 0.56], materials.woodDark);
    addBox(lectern, [0, 1.18, 0.04], [0.88, 0.08, 0.68], materials.woodWarm, { rotation: [0.22, 0, 0] });
    addBox(lectern, [0, 0.78, 0.29], [0.52, 0.42, 0.03], materials.gold);
    addCylinder(lectern, [0.18, 1.32, -0.05], 0.015, 0.015, 0.28, materials.chrome, { rotation: [0.3, 0, 0] });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 1.65, y + 0.85, z - 4.15], [0.55, 0.85, 0.5]);

    // 3. "RTIK Goes to School" Collaborative Student Coding Workshop Tables (Cleared from right staircase)
    for (const tx of [-1.35, 0.85]) {
      const wTable = new THREE.Group();
      wTable.position.set(x + tx, y, z - 1.3);
      parent.add(wTable);

      addBox(wTable, [0, 0.78, 0], [1.85, 0.08, 1.1], materials.cream);
      addBox(wTable, [0, 0.83, 0], [1.89, 0.03, 1.14], materials.woodWarm);
      addCylinder(wTable, [-0.75, 0.39, -0.4], 0.05, 0.05, 0.78, materials.metalDark);
      addCylinder(wTable, [0.75, 0.39, -0.4], 0.05, 0.05, 0.78, materials.metalDark);
      addCylinder(wTable, [-0.75, 0.39, 0.4], 0.05, 0.05, 0.78, materials.metalDark);
      addCylinder(wTable, [0.75, 0.39, 0.4], 0.05, 0.05, 0.78, materials.metalDark);

      // Student Coding Laptops on Workshop Table
      for (const lx of [-0.46, 0.46]) {
        addBox(wTable, [lx, 0.85, -0.08], [0.42, 0.025, 0.30], materials.chrome);
        addBox(wTable, [lx, 1.02, -0.22], [0.42, 0.28, 0.025], materials.metalDark, { rotation: [-0.2, 0, 0] });
        addBox(wTable, [lx, 1.02, -0.205], [0.38, 0.24, 0.01], lx < 0 ? materials.screenCode : materials.screenGlow, {
          rotation: [-0.2, 0, 0],
          shadow: false,
        });
      }
      // Workshop Collaborative Stools
      for (const stx of [-0.48, 0.48]) {
        addCylinder(wTable, [stx, 0.48, 0.75], 0.22, 0.22, 0.08, stx < 0 ? materials.emerald : materials.coral, { segments: 12 });
        addCylinder(wTable, [stx, 0.24, 0.75], 0.04, 0.06, 0.46, materials.metalDark);
      }
      addFurnitureCollider(world, RAPIER, staticBodies, [x + tx, y + 0.55, z - 1.2], [0.98, 0.55, 0.85]);
    }

    // 4. HIMAFORSI MediaTech Cinema Camera Rig, Softbox Key Light & Editing Station (West Wing)
    const camRig = new THREE.Group();
    camRig.position.set(x - 2.85, y, z - 2.1);
    camRig.rotation.y = 0.45;
    parent.add(camRig);
    // Tripod legs & center column
    addCylinder(camRig, [0, 0.65, 0], 0.04, 0.28, 1.3, materials.metalDark, { segments: 8 });
    // Cinema Broadcast Camera Body, Matte Box Lens & Top Handle
    addBox(camRig, [0, 1.38, 0], [0.28, 0.26, 0.46], materials.ink);
    addCylinder(camRig, [0, 1.38, 0.32], 0.11, 0.09, 0.24, materials.metalDark, { rotation: [Math.PI * 0.5, 0, 0], segments: 12 });
    addBox(camRig, [0, 1.38, 0.45], [0.26, 0.22, 0.06], materials.brass);
    addBox(camRig, [0.22, 1.44, -0.05], [0.18, 0.12, 0.03], materials.screenGlow, { shadow: false });

    // Studio LED Softbox Key Light next to Camera Rig
    const softbox = new THREE.Group();
    softbox.position.set(x - 3.65, y, z - 3.3);
    softbox.rotation.y = 0.55;
    parent.add(softbox);
    addCylinder(softbox, [0, 0.85, 0], 0.03, 0.24, 1.7, materials.metalDark, { segments: 8 });
    addBox(softbox, [0, 1.78, 0.05], [0.75, 0.55, 0.18], materials.ink, { rotation: [0.15, 0, 0] });
    addBox(softbox, [0, 1.78, 0.15], [0.68, 0.48, 0.02], materials.glow, { rotation: [0.15, 0, 0], shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 3.2, y + 0.9, z - 2.6], [0.85, 0.9, 1.0]);
  } else if (id === 'experience') {
    // =========================================================================
    // 02 · WORK EXPERIENCE — CORPORATE CAREER TIMELINE HALL & FINTECH COMMAND CENTER
    // (Lantai 2 Mid-Right, x = 10.75, y = 5.2, z = -2.0)
    // 5-Role LinkedIn Chronological Career Wall (Destino Copytrade, MQL5 Algo Trading,
    // Posyandu UNMUH, PT. Antosa Architect, Bank Mandiri), FinTech Trading Desk & Enterprise Table
    // =========================================================================

    // 1. 5-Role Chronological LinkedIn Career Wall on Back Wall (z = -7.3)
    const careerWall = new THREE.Group();
    careerWall.position.set(x, y, z - 5.3);
    parent.add(careerWall);

    addBox(careerWall, [0, 2.4, -0.12], [8.8, 4.8, 0.22], materials.woodDark);
    // Illuminated Horizontal Golden Career Timeline Rail across full width
    addBox(careerWall, [0, 4.35, 0.04], [8.4, 0.08, 0.08], materials.gold);
    addBox(careerWall, [0, 4.35, 0.09], [8.2, 0.03, 0.02], materials.glow, { shadow: false });
    for (const nodeX of [-3.6, -2.2, 0, 2.2, 3.6]) {
      addSphere(careerWall, [nodeX, 4.35, 0.11], [0.09, 0.09, 0.09], materials.gold, { shadow: false, lowPoly: true });
    }

    // 4 Illuminated Corporate Role Showcase Bays flanking the central 02 · Work Experience board
    const roleBays = [
      { bx: -3.2, by: 2.95, accent: materials.emeraldBright, screen: materials.screenGlow }, // Destino Copytrade
      { bx: -3.2, by: 1.35, accent: materials.gold, screen: materials.screenCode },          // MQL5 Algo Trading
      { bx: 3.2, by: 2.95, accent: materials.coral, screen: materials.screenGlow },          // Posyandu UNMUH
      { bx: 3.2, by: 1.35, accent: materials.blueSky, screen: materials.screenCad },         // PT. Antosa & Bank Mandiri
    ];
    for (const bay of roleBays) {
      addBox(careerWall, [bay.bx, bay.by, 0.05], [1.95, 1.25, 0.12], materials.ink);
      addBox(careerWall, [bay.bx, bay.by, 0.01], [2.08, 1.36, 0.06], materials.brass);
      addBox(careerWall, [bay.bx, bay.by + 0.52, 0.12], [1.82, 0.10, 0.03], bay.accent);
      addBox(careerWall, [bay.bx, bay.by - 0.06, 0.12], [1.78, 0.92, 0.02], bay.screen, { shadow: false });
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 2.4, z - 5.3], [4.4, 2.4, 0.3]);

    // 2. FinTech & MQL5 Algorithmic Copytrading Command Desk (Left, x - 2.3, z - 2.1)
    const fintechDesk = new THREE.Group();
    fintechDesk.position.set(x - 2.3, y, z - 2.1);
    parent.add(fintechDesk);

    addBox(fintechDesk, [0, 0.88, 0], [2.5, 0.1, 1.25], materials.woodDark);
    addBox(fintechDesk, [0, 0.94, 0], [2.54, 0.03, 1.29], materials.brass);
    addBox(fintechDesk, [-1.05, 0.44, 0], [0.2, 0.88, 1.1], materials.metalDark);
    addBox(fintechDesk, [1.05, 0.44, 0], [0.2, 0.88, 1.1], materials.metalDark);
    // Triple MetaTrader 5 / Destino Copytrade Curved Displays
    for (const [idx, mx] of [-0.78, 0, 0.78].entries()) {
      const rotY = idx === 0 ? 0.25 : idx === 2 ? -0.25 : 0;
      const mz = idx === 1 ? -0.28 : -0.18;
      addBox(fintechDesk, [mx, 1.34, mz], [0.74, 0.52, 0.05], materials.metalDark, { rotation: [0, rotY, 0] });
      addBox(fintechDesk, [mx, 1.34, mz + 0.03], [0.68, 0.46, 0.02], idx === 1 ? materials.screenCode : materials.screenGlow, {
        rotation: [0, rotY, 0],
        shadow: false,
      });
    }
    // 3D Bullish Financial Candlestick Sculpture on corner of desk
    for (let c = 0; c < 4; c += 1) {
      const ch = 0.16 + c * 0.07;
      addBox(fintechDesk, [-0.95 + c * 0.12, 0.95 + ch * 0.5, 0.32], [0.07, ch, 0.07], c === 1 ? materials.coral : materials.emeraldBright);
    }
    // Executive Trading Chair
    addBox(fintechDesk, [0, 0.5, 0.88], [0.72, 0.12, 0.7], materials.navy);
    addBox(fintechDesk, [0, 1.05, 1.2], [0.68, 0.96, 0.12], materials.navy);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 2.3, y + 0.75, z - 1.9], [1.3, 0.75, 1.05]);

    // 3. Enterprise & Posyandu Architecture Table (Right, x + 2.3, z - 2.1)
    const entTable = new THREE.Group();
    entTable.position.set(x + 2.3, y, z - 2.1);
    parent.add(entTable);

    addBox(entTable, [0, 0.88, 0], [2.5, 0.1, 1.25], materials.ceramic);
    addBox(entTable, [0, 0.94, 0], [2.54, 0.03, 1.29], materials.brass);
    addBox(entTable, [-1.05, 0.44, 0], [0.2, 0.88, 1.1], materials.woodWarm);
    addBox(entTable, [1.05, 0.44, 0], [0.2, 0.88, 1.1], materials.woodWarm);
    // PT. Antosa Architect 3D Building Blueprint Scale Model on Left Half
    addBox(entTable, [-0.55, 0.97, 0], [0.95, 0.04, 0.78], materials.blueSky);
    addBox(entTable, [-0.65, 1.16, -0.05], [0.36, 0.34, 0.36], materials.cream);
    addBox(entTable, [-0.32, 1.10, 0.08], [0.28, 0.22, 0.32], materials.woodWarm);
    addBox(entTable, [-0.65, 1.35, -0.05], [0.42, 0.05, 0.42], materials.terracotta);
    // Posyandu UNMUH Clinical Health Telemetry & Bank Mandiri Mobile Kiosk on Right Half
    addBox(entTable, [0.58, 1.32, -0.2], [0.92, 0.56, 0.06], materials.metalDark);
    addBox(entTable, [0.58, 1.32, -0.16], [0.86, 0.50, 0.02], materials.screenGlow, { shadow: false });
    addBox(entTable, [0.58, 0.98, 0.25], [0.24, 0.04, 0.42], materials.ink);
    addBox(entTable, [0.58, 1.005, 0.25], [0.20, 0.01, 0.36], materials.blueSky, { shadow: false });
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.3, y + 0.75, z - 2.1], [1.3, 0.75, 0.75]);

    // 4. Executive Career Lounge Bench in Foreground Center (x, z + 0.55)
    const bench = new THREE.Group();
    bench.position.set(x, y, z + 0.55);
    parent.add(bench);
    addBox(bench, [0, 0.42, 0], [2.4, 0.36, 0.9], materials.terracotta);
    addBox(bench, [0, 0.2, 0], [2.44, 0.08, 0.94], materials.brass);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.42, z + 0.55], [1.25, 0.42, 0.5]);
  } else if (id === 'process') {
    // =========================================================================
    // 08 · GITHUB CONTRIBUTIONS — 3D GITHUB CONTRIBUTION OBSERVATORY & DEVOPS HUB
    // (Lantai 2 Far-Right, x = 21.0, y = 5.2, z = -2.0)
    // Monumental 3D GitHub Contribution Heatmap Wall (1,039 Contributions in green/emerald
    // tiles), Open-Source DevOps Command Desk, and 6-Stage Deterministic SDLC Pipeline Console
    // =========================================================================

    // 1. Monumental 3D GitHub Contribution Heatmap Wall on Back Wall (z = -7.5)
    const ghWall = new THREE.Group();
    ghWall.position.set(x, y, z - 5.5);
    parent.add(ghWall);

    addBox(ghWall, [0, 2.4, -0.08], [8.2, 4.7, 0.16], materials.ink);
    addBox(ghWall, [0, 4.72, 0.02], [8.4, 0.12, 0.28], materials.emeraldBright);

    // Batched 3D GitHub Contribution Grid Tiles surrounding the central 08 · GitHub board
    const ghBatch = new BatchCollector();
    const ghLevels = [materials.stone, materials.mint, materials.emerald, materials.emeraldBright];
    for (let col = -14; col <= 14; col += 1) {
      const gx = col * 0.26;
      for (let row = 0; row < 11; row += 1) {
        const gy = 0.72 + row * 0.34;
        // Leave central window open for the 08 · GitHub Contributions display board
        if (Math.abs(gx) < 1.95 && gy > 1.05 && gy < 3.65) continue;
        const hash = Math.abs(Math.sin(col * 12.9898 + row * 78.233));
        const lvl = hash > 0.78 ? 3 : hash > 0.52 ? 2 : hash > 0.28 ? 1 : 0;
        const depth = 0.06 + lvl * 0.045;
        ghBatch.addBox([gx, gy, depth * 0.5], [0.21, 0.26, depth], ghLevels[lvl]);
      }
    }
    ghBatch.build(ghWall, false);
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 2.4, z - 5.5], [4.1, 2.4, 0.25]);

    // 2. Open-Source & CI/CD DevOps Command Desk (Left-Center, x - 1.1, z - 2.1)
    const devopsDesk = new THREE.Group();
    devopsDesk.position.set(x - 1.1, y, z - 2.1);
    parent.add(devopsDesk);

    addBox(devopsDesk, [0, 0.92, 0], [3.2, 0.12, 1.35], materials.woodDark);
    addBox(devopsDesk, [0, 0.99, 0], [3.24, 0.03, 1.39], materials.emeraldBright);
    addBox(devopsDesk, [-1.4, 0.46, 0], [0.22, 0.92, 1.2], materials.metalDark);
    addBox(devopsDesk, [1.4, 0.46, 0], [0.22, 0.92, 1.2], materials.metalDark);
    // Dual Widescreen GitHub Actions & PR Review Monitors
    for (const sx of [-0.72, 0.72]) {
      addBox(devopsDesk, [sx, 1.52, -0.25], [1.22, 0.74, 0.07], materials.metalDark);
      addBox(devopsDesk, [sx, 1.52, -0.20], [1.14, 0.66, 0.02], sx < 0 ? materials.screenCode : materials.screenGlow, { shadow: false });
      addCylinder(devopsDesk, [sx, 1.08, -0.28], 0.04, 0.05, 0.24, materials.metalDark);
    }
    // Mechanical Keyboard & Green Commit Streak Status Bar
    addBox(devopsDesk, [0, 1.02, 0.22], [0.72, 0.03, 0.24], materials.ink);
    addBox(devopsDesk, [0, 1.04, 0.22], [0.66, 0.015, 0.18], materials.emeraldBright, { shadow: false });
    // Ergonomic Developer Chair
    addBox(devopsDesk, [0, 0.52, 0.95], [0.74, 0.12, 0.72], materials.ink);
    addBox(devopsDesk, [0, 1.08, 1.28], [0.68, 0.98, 0.12], materials.emerald);
    addFurnitureCollider(world, RAPIER, staticBodies, [x - 1.1, y + 0.75, z - 1.9], [1.65, 0.75, 1.1]);

    // 3. 6-Stage Deterministic SDLC Pipeline Console (Right, x + 2.35, z - 2.0)
    const sdlc = new THREE.Group();
    sdlc.position.set(x + 2.35, y, z - 2.0);
    parent.add(sdlc);

    addBox(sdlc, [0, 0.52, 0], [1.65, 1.04, 1.1], materials.ink);
    addBox(sdlc, [0, 1.06, 0], [1.72, 0.06, 1.16], materials.brass);
    // 6 Glowing 3D SDLC Stage Pillars (01 Discovery -> 06 Observability)
    const stageMats = [materials.blueSky, materials.gold, materials.emeraldBright, materials.coral, materials.glow, materials.emerald];
    for (let s = 0; s < 6; s += 1) {
      const sx = -0.62 + s * 0.25;
      const sh = 0.24 + s * 0.06;
      addBox(sdlc, [sx, 1.09 + sh * 0.5, 0], [0.16, sh, 0.36], stageMats[s]);
    }
    addFurnitureCollider(world, RAPIER, staticBodies, [x + 2.35, y + 0.75, z - 2.0], [0.9, 0.75, 0.65]);
  } else if (id === 'contact') {
    // =========================================================================
    // 09 · CONTACT — EXECUTIVE VIP NETWORKING PAVILION & GARDEN VERANDA
    // (Rear Terrace, x = 0.0, y = 0.0, z = -11.8)
    // Architectural Wood-Slat Backdrop, Symmetrical Teak & Cream VIP Lounge Sofas,
    // Marble & Brass Coffee Table with Golden Connection Sculpture & Lantern Pillars
    // =========================================================================

    // Symmetrical VIP Lounge Sofas flanking the Rear Terrace
    for (const side of [-1, 1]) {
      const vipSofa = new THREE.Group();
      vipSofa.position.set(x + side * 2.55, y, z + 0.15);
      vipSofa.rotation.y = side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      parent.add(vipSofa);

      addBox(vipSofa, [0, 0.22, 0], [2.2, 0.28, 0.95], materials.woodDark);
      addBox(vipSofa, [0, 0.44, 0.04], [2.04, 0.2, 0.84], materials.cream);
      addBox(vipSofa, [0, 0.82, -0.36], [2.04, 0.56, 0.2], materials.cream);
      addBox(vipSofa, [-0.98, 0.58, 0], [0.2, 0.48, 0.92], materials.woodWarm);
      addBox(vipSofa, [0.98, 0.58, 0], [0.2, 0.48, 0.92], materials.woodWarm);
      addBox(vipSofa, [-0.55, 0.66, -0.14], [0.42, 0.34, 0.18], materials.terracotta);
      addBox(vipSofa, [0.55, 0.66, -0.14], [0.42, 0.34, 0.18], materials.emerald);
      addFurnitureCollider(world, RAPIER, staticBodies, [x + side * 2.55, y + 0.55, z + 0.15], [0.55, 0.55, 1.15]);
    }

    // Central Marble & Brass Networking Table with Golden Envelope / Connection Sculpture
    addBox(parent, [x, y + 0.38, z + 0.15], [2.1, 0.08, 1.1], materials.ceramic);
    addBox(parent, [x, y + 0.43, z + 0.15], [2.16, 0.03, 1.16], materials.brass);
    addBox(parent, [x - 0.8, y + 0.19, z + 0.15], [0.16, 0.38, 0.85], materials.woodDark);
    addBox(parent, [x + 0.8, y + 0.19, z + 0.15], [0.16, 0.38, 0.85], materials.woodDark);
    // 3D Golden Communication & Global Networking Sculpture on Table Center
    addCylinder(parent, [x, y + 0.48, z + 0.15], 0.24, 0.28, 0.06, materials.woodDark, { segments: 12 });
    addBox(parent, [x, y + 0.68, z + 0.15], [0.52, 0.34, 0.08], materials.gold, { rotation: [0, 0.35, 0] });
    addSphere(parent, [x, y + 0.95, z + 0.15], [0.12, 0.12, 0.12], materials.glow, { shadow: false, lowPoly: true });
    addFurnitureCollider(world, RAPIER, staticBodies, [x, y + 0.45, z + 0.15], [1.15, 0.45, 0.65]);

    // Architectural Wood-Slat & Brass Pavilion Backdrop behind the 09 · Contact Display Board (z = -15.35)
    addBox(parent, [x, y + 2.2, z - 3.55], [4.6, 4.2, 0.16], materials.woodDark);
    addBox(parent, [x, y + 4.34, z - 3.48], [4.8, 0.12, 0.34], materials.brass);
    for (const side of [-1, 1]) {
      addCylinder(parent, [x + side * 2.15, y + 2.15, z - 3.42], 0.12, 0.14, 4.1, materials.brass, { segments: 10 });
    }

    // Warm Illuminated Garden Lantern Pillars flanking the Contact Board
    for (const side of [-1, 1]) {
      const lx = x + side * 2.65;
      const lz = z - 1.55;
      addBox(parent, [lx, y + 0.65, lz], [0.36, 1.3, 0.36], materials.woodDark);
      addBox(parent, [lx, y + 1.34, lz], [0.42, 0.08, 0.42], materials.brass);
      addBox(parent, [lx, y + 1.56, lz], [0.26, 0.36, 0.26], materials.glow, { shadow: false });
      addBox(parent, [lx, y + 1.78, lz], [0.44, 0.08, 0.44], materials.brass);
    }
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

