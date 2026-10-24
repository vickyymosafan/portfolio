import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, BatchCollector } from './geometry.js';

export function createArchitecture(scene, world, RAPIER, staticBodies, cameraBlockers) {
  const building = new THREE.Group();
  scene.add(building);
  const archBatch = new BatchCollector();

  const addColliderBox = (pos, halfExtents) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos[0], pos[1], pos[2]));
    world.createCollider(RAPIER.ColliderDesc.cuboid(halfExtents[0], halfExtents[1], halfExtents[2]), body);
    staticBodies.push(body);
    return body;
  };

  // ==========================================
  // 1. FOUNDATION & FLOOR (Wider 28m x 24m depth)
  // House footprint: x: [-14.0, 14.0], z: [4.0, -20.0], center z: -8.0
  // ==========================================
  const floor = addBox(building, [0, -0.12, -8.0], [28.0, 0.24, 24.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([0, -0.18, -8.0], [14.0, 0.18, 12.0]);

  // Stone foundation skirting (exterior plinth)
  archBatch.addBox([0, 0.16, 4.05], [28.4, 0.38, 0.4], materials.foundation);
  archBatch.addBox([-14.1, 0.16, -8.0], [0.4, 0.38, 24.4], materials.foundation);
  archBatch.addBox([14.1, 0.16, -8.0], [0.4, 0.38, 24.4], materials.foundation);
  archBatch.addBox([0, 0.16, -20.05], [28.4, 0.38, 0.4], materials.foundation);

  // ==========================================
  // 2. EXPANDED FRONT PORCH & COLUMNS (16m wide x 3.8m deep)
  // ==========================================
  archBatch.addBox([0, 0.08, 5.8], [16.0, 0.22, 3.6], materials.woodLight);
  addColliderBox([0, -0.03, 5.8], [8.0, 0.11, 1.8]);
  archBatch.addBox([0, -0.04, 7.8], [6.4, 0.16, 1.2], materials.stone); // Grand front steps
  addColliderBox([0, -0.12, 7.8], [3.2, 0.08, 0.6]);

  // Porch turned columns & capitals (solid, rich architectural silhouette)
  const porchColX = [-6.8, -3.4, 3.4, 6.8];
  for (const x of porchColX) {
    // Square stone pedestal base
    archBatch.addBox([x, 0.26, 7.4], [0.72, 0.34, 0.72], materials.stone);
    // Lower turned torus plinth molding
    archBatch.addCylinder([x, 0.48, 7.4], 0.32, 0.34, 0.12, materials.woodWarm, { segments: 16 });
    // Tapered main column shaft (solid, opaque, prominent silhouette)
    archBatch.addCylinder([x, 2.4, 7.4], 0.25, 0.29, 3.8, materials.column, { segments: 20 });
    // Central decorative wooden ring
    archBatch.addCylinder([x, 1.25, 7.4], 0.30, 0.30, 0.14, materials.woodWarm, { segments: 16 });
    // Upper turned neck ring
    archBatch.addCylinder([x, 4.18, 7.4], 0.28, 0.26, 0.12, materials.woodWarm, { segments: 16 });
    // Turned capital abacus & cornice block
    archBatch.addBox([x, 4.38, 7.4], [0.68, 0.14, 0.68], materials.stone);
    archBatch.addBox([x, 4.50, 7.4], [0.76, 0.12, 0.76], materials.wainscot);
    addColliderBox([x, 2.0, 7.4], [0.36, 2.0, 0.36]);
  }

  // Porch balustrade & railings
  for (const [x1, x2] of [[-6.8, -3.4], [3.4, 6.8]]) {
    const cx = (x1 + x2) * 0.5;
    const len = Math.abs(x2 - x1) - 0.72;
    archBatch.addBox([cx, 1.05, 7.4], [len, 0.08, 0.14], materials.woodLight);
    archBatch.addBox([cx, 0.45, 7.4], [len, 0.08, 0.14], materials.woodLight);
    for (let bx = x1 + 0.48; bx <= x2 - 0.48; bx += 0.34) {
      archBatch.addCylinder([bx, 0.75, 7.4], 0.04, 0.04, 0.54, materials.trim, { segments: 8 });
    }
    addColliderBox([cx, 0.65, 7.4], [len * 0.5, 0.65, 0.12]);
  }

  // Porch roof canopy
  archBatch.addBox([0, 4.85, 6.0], [17.0, 0.42, 4.2], materials.roof);
  archBatch.addBox([0, 4.62, 6.0], [16.8, 0.12, 4.0], materials.trim);

  // Hanging flower baskets on porch
  for (const hx of [-5.1, 5.1]) {
    archBatch.addCylinder([hx, 4.5, 7.4], 0.015, 0.015, 0.45, materials.metalDark);
    archBatch.addSphere([hx, 4.22, 7.4], [0.32, 0.24, 0.32], materials.terracotta);
    archBatch.addSphere([hx, 4.34, 7.4], [0.4, 0.28, 0.4], materials.foliageBright);
    archBatch.addSphere([hx - 0.14, 4.38, 7.46], [0.12, 0.12, 0.12], materials.coral);
    archBatch.addSphere([hx + 0.16, 4.36, 7.34], [0.12, 0.12, 0.12], materials.yellow);
  }

  // Welcome floor mat
  archBatch.addBox([0, 0.19, 4.9], [2.4, 0.03, 1.2], materials.woodDark);

  // ==========================================
  // 3. EXTERIOR WALLS (with collision & camera blocking)
  // ==========================================
  // Left Wall (x = -14.0)
  const wallL = addBox(building, [-14.0, 2.6, -8.0], [0.65, 5.2, 24.0], materials.wall, { shadow: true });
  cameraBlockers.push(wallL);
  addColliderBox([-14.0, 2.6, -8.0], [0.325, 2.6, 12.0]);
  archBatch.addBox([-13.95, 0.65, -8.0], [0.68, 1.1, 24.0], materials.wainscot);

  // Right Wall (x = 14.0)
  const wallR = addBox(building, [14.0, 2.6, -8.0], [0.65, 5.2, 24.0], materials.wall, { shadow: true });
  cameraBlockers.push(wallR);
  addColliderBox([14.0, 2.6, -8.0], [0.325, 2.6, 12.0]);
  archBatch.addBox([13.95, 0.65, -8.0], [0.68, 1.1, 24.0], materials.wainscot);

  // Front Facade (z = 4.0, entrance opening width 6.8m from x = -3.4 to 3.4)
  const frontL = addBox(building, [-8.7, 2.6, 4.0], [10.6, 5.2, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(frontL);
  addColliderBox([-8.7, 2.6, 4.0], [5.3, 2.6, 0.325]);
  archBatch.addBox([-8.7, 0.65, 4.05], [10.6, 1.1, 0.68], materials.wainscot);

  const frontR = addBox(building, [8.7, 2.6, 4.0], [10.6, 5.2, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(frontR);
  addColliderBox([8.7, 2.6, 4.0], [5.3, 2.6, 0.325]);
  archBatch.addBox([8.7, 0.65, 4.05], [10.6, 1.1, 0.68], materials.wainscot);

  const frontHeader = addBox(building, [0, 4.4, 4.0], [6.8, 1.6, 0.65], materials.coral, { shadow: true });
  cameraBlockers.push(frontHeader);
  addColliderBox([0, 4.4, 4.0], [3.4, 0.8, 0.325]);

  // Rear Facade (z = -20.0, rear opening width 6.8m)
  const rearL = addBox(building, [-8.7, 2.6, -20.0], [10.6, 5.2, 0.6], materials.wall, { shadow: true });
  cameraBlockers.push(rearL);
  addColliderBox([-8.7, 2.6, -20.0], [5.3, 2.6, 0.3]);

  const rearR = addBox(building, [8.7, 2.6, -20.0], [10.6, 5.2, 0.6], materials.wall, { shadow: true });
  cameraBlockers.push(rearR);
  addColliderBox([8.7, 2.6, -20.0], [5.3, 2.6, 0.3]);

  const rearHeader = addBox(building, [0, 4.4, -20.0], [6.8, 1.6, 0.6], materials.wall);
  cameraBlockers.push(rearHeader);

  // Rear French doors & terrace deck (x: [-9.0, 9.0], z: [-20.0, -26.0])
  addBox(building, [0, 2.0, -20.0], [5.8, 3.6, 0.08], materials.glass);
  addColliderBox([0, 1.8, -20.0], [2.9, 1.8, 0.08]);
  archBatch.addBox([0, -0.02, -23.0], [18.0, 0.22, 6.0], materials.terraceTiles);

  // ==========================================
  // 3b. INTERIOR PARTITION WALLS & GRAND ARCHED OPENINGS
  // Separating Bay 1 (z: 4.0 to -4.4), Bay 2 (z: -4.4 to -12.2), Bay 3 (z: -12.2 to -20.0)
  // Promenade corridor width = 6.8m (x = -3.4 to 3.4)
  // Arched doorways: x = [-6.4, -3.4] (3.0m wide) and [3.4, 6.4] (3.0m wide)
  // Solid partition walls: x = [-14.0, -6.4] (7.6m wide) and [6.4, 14.0] (7.6m wide)
  // ==========================================
  for (const pz of [-4.4, -12.2]) {
    // Left solid partition wall
    const partL = addBox(building, [-10.2, 2.6, pz], [7.6, 5.2, 0.42], materials.wall, { shadow: true });
    cameraBlockers.push(partL);
    addColliderBox([-10.2, 2.6, pz], [3.8, 2.6, 0.21]);
    archBatch.addBox([-10.2, 0.65, pz], [7.6, 1.1, 0.46], materials.wainscot);

    // Right solid partition wall
    const partR = addBox(building, [10.2, 2.6, pz], [7.6, 5.2, 0.42], materials.wall, { shadow: true });
    cameraBlockers.push(partR);
    addColliderBox([10.2, 2.6, pz], [3.8, 2.6, 0.21]);
    archBatch.addBox([10.2, 0.65, pz], [7.6, 1.1, 0.46], materials.wainscot);

    // Decorative overhead lintel arch beam across the doorway openings (3.0m span)
    archBatch.addBox([-4.9, 4.35, pz], [3.0, 0.9, 0.44], materials.wall);
    archBatch.addBox([4.9, 4.35, pz], [3.0, 0.9, 0.44], materials.wall);
    archBatch.addBox([-4.9, 3.82, pz], [3.0, 0.16, 0.48], materials.woodWarm);
    archBatch.addBox([4.9, 3.82, pz], [3.0, 0.16, 0.48], materials.woodWarm);

    // Turned architectural columns flanking the doorways
    for (const cx of [-6.4, -3.4, 3.4, 6.4]) {
      archBatch.addBox([cx, 2.6, pz], [0.42, 5.2, 0.48], materials.woodWarm);
      archBatch.addBox([cx, 0.35, pz], [0.5, 0.7, 0.54], materials.wainscot);
      archBatch.addBox([cx, 4.85, pz], [0.5, 0.3, 0.54], materials.trim);
    }

    // Overhead hallway grand arch timber beam spanning central promenade (6.8m)
    archBatch.addBox([0, 4.75, pz], [6.8, 0.42, 0.42], materials.woodDark);
  }

  // ==========================================
  // 4. WINDOWS & FLOWER BOXES
  // ==========================================
  // Front windows (centered on left and right wings at x = ±8.7)
  for (const x of [-8.7, 8.7]) {
    addBox(building, [x, 2.7, 4.05], [3.6, 2.2, 0.06], materials.glass);
    archBatch.addBox([x, 1.55, 4.1], [3.9, 0.22, 0.18], materials.trim);
    archBatch.addBox([x, 3.85, 4.1], [3.9, 0.2, 0.18], materials.trim);
    archBatch.addBox([x - 1.85, 2.7, 4.1], [0.2, 2.4, 0.18], materials.trim);
    archBatch.addBox([x + 1.85, 2.7, 4.1], [0.2, 2.4, 0.18], materials.trim);
    archBatch.addBox([x, 2.7, 4.11], [0.1, 2.2, 0.14], materials.wainscot);
    archBatch.addBox([x, 2.7, 4.11], [3.6, 0.1, 0.14], materials.wainscot);

    // Exterior flower box
    archBatch.addBox([x, 1.32, 4.28], [3.5, 0.32, 0.42], materials.woodWarm);
    archBatch.addBox([x, 1.48, 4.28], [3.4, 0.05, 0.38], materials.soil);
    for (let fi = -1.4; fi <= 1.4; fi += 0.4) {
      archBatch.addSphere([x + fi, 1.62, 4.28], [0.18, 0.18, 0.18], materials.foliageBright);
      archBatch.addSphere([x + fi, 1.72, 4.28], [0.08, 0.08, 0.08], fi % 0.8 === 0 ? materials.coral : materials.yellow);
    }
  }

  // Side panoramic windows (centered on the 3 bays at z = -0.2, -8.3, -16.1)
  const bayCentersZ = [-0.2, -8.3, -16.1];
  for (const [x, side] of [[-14.0, -1], [14.0, 1]]) {
    for (const z of bayCentersZ) {
      addBox(building, [x, 2.8, z], [0.06, 2.2, 3.8], materials.glass);
      archBatch.addBox([x + side * 0.05, 1.65, z], [0.22, 0.18, 4.1], materials.trim);
      archBatch.addBox([x + side * 0.05, 3.95, z], [0.22, 0.18, 4.1], materials.trim);
      archBatch.addBox([x + side * 0.05, 2.8, z - 1.95], [0.22, 2.4, 0.18], materials.trim);
      archBatch.addBox([x + side * 0.05, 2.8, z + 1.95], [0.22, 2.4, 0.18], materials.trim);
      archBatch.addBox([x + side * 0.06, 2.8, z], [0.18, 2.2, 0.1], materials.wainscot);
      archBatch.addBox([x + side * 0.06, 2.8, z], [0.18, 0.1, 3.8], materials.wainscot);
    }
  }

  // ==========================================
  // 5. STYLIZED GABLED ROOF STRUCTURE WITH CHIMNEY
  // ==========================================
  const roofGroup = new THREE.Group();
  building.add(roofGroup);
  const roofBatch = new BatchCollector();

  roofBatch.addBox([-7.3, 6.4, -8.0], [15.2, 0.38, 25.8], materials.roof, { rotation: [0, 0, 0.22] });
  roofBatch.addBox([7.3, 6.4, -8.0], [15.2, 0.38, 25.8], materials.roof, { rotation: [0, 0, -0.22] });
  roofBatch.addBox([0, 7.85, -8.0], [0.85, 0.38, 26.2], materials.roofTrim);
  roofBatch.addBox([0, 5.95, 4.05], [16.0, 1.5, 0.55], materials.wallAccent);
  roofBatch.addBox([0, 6.95, 4.05], [9.2, 1.3, 0.55], materials.wallAccent);
  roofBatch.addBox([-4.6, 6.55, 4.35], [9.6, 0.22, 0.35], materials.woodWarm, { rotation: [0, 0, 0.22] });
  roofBatch.addBox([4.6, 6.55, 4.35], [9.6, 0.22, 0.35], materials.woodWarm, { rotation: [0, 0, -0.22] });

  // Red Brick Chimney
  const cx = 9.5;
  const cz = -2.5;
  roofBatch.addBox([cx, 7.6, cz], [1.3, 2.8, 1.3], materials.wainscot);
  roofBatch.addBox([cx, 9.05, cz], [1.5, 0.18, 1.5], materials.stone);
  roofBatch.addCylinder([cx, 9.4, cz], 0.3, 0.36, 0.5, materials.terracotta, { segments: 12 });
  roofBatch.build(roofGroup, true);

  // Chimney smoke puffs with dedicated transparent materials (never mutates shared materials.trim)
  for (let s = 0; s < 3; s += 1) {
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.75 - s * 0.2,
      depthWrite: false,
    });
    addSphere(
      roofGroup,
      [cx + (s + 1) * 0.28, 9.9 + s * 0.7, cz + (s + 1) * 0.2],
      [0.38 + s * 0.16, 0.35 + s * 0.14, 0.38 + s * 0.16],
      smokeMat,
      { shadow: false }
    );
  }

  // ==========================================
  // 6. GRAND CENTRAL PROMENADE ARCHITECTURE
  // ==========================================
  // Central grand runner carpet (3.6m wide, spanning full 24m depth)
  archBatch.addBox([0, -0.005, -8.0], [3.6, 0.02, 23.6], materials.coral);

  // Promenade Corinthian/Turned pilasters with glowing wall sconces
  const pilastersZ = [3.2, -4.4, -12.2, -19.2];
  for (const side of [-1, 1]) {
    const x = side * 3.4;
    for (const pz of pilastersZ) {
      const pil = addBox(building, [x, 2.6, pz], [0.42, 5.2, 1.8], materials.wall, { shadow: true });
      addColliderBox([x, 2.6, pz], [0.21, 2.6, 0.9]);
      archBatch.addBox([x - side * 0.24, 2.8, pz], [0.14, 0.26, 0.14], materials.brass);
      addSphere(building, [x - side * 0.24, 2.8, pz], [0.14, 0.14, 0.14], materials.glow, { shadow: false });
    }
  }

  // Ceiling rafters & chandeliers along the grand hall
  for (const z of [2.0, -1.0, -4.4, -8.3, -12.2, -16.1, -19.0]) {
    archBatch.addBox([0, 5.15, z], [27.6, 0.22, 0.32], materials.woodDark);
    archBatch.addCylinder([0, 4.65, z], 0.025, 0.025, 0.85, materials.brass);
    archBatch.addSphere([0, 4.2, z], [0.36, 0.2, 0.36], materials.brass);
    addSphere(building, [0, 4.08, z], [0.22, 0.1, 0.22], materials.glow, { shadow: false });
  }

  // Build batched architecture
  archBatch.build(building, true);

  // ==========================================
  // 7. WELCOME SIGNBOARD ON FRONT GABLE
  // ==========================================
  addBox(building, [0, 5.85, 4.42], [5.0, 1.25, 0.14], materials.woodDark);
  const welcomeSignCanvas = document.createElement('canvas');
  welcomeSignCanvas.width = 1024;
  welcomeSignCanvas.height = 256;
  const sCtx = welcomeSignCanvas.getContext('2d');
  sCtx.fillStyle = '#223830';
  sCtx.fillRect(0, 0, 1024, 256);
  sCtx.strokeStyle = '#d89c47';
  sCtx.lineWidth = 10;
  sCtx.strokeRect(16, 16, 992, 224);
  sCtx.fillStyle = '#fffdf7';
  sCtx.font = '900 68px "Nunito", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.letterSpacing = '2px';
  sCtx.fillText('VICKY’S CARTOONVERSE', 512, 142);
  sCtx.fillStyle = '#f0c458';
  sCtx.font = '700 28px "DM Sans", sans-serif';
  sCtx.fillText('3D INTERACTIVE PORTFOLIO', 512, 195);

  const signTex = new THREE.CanvasTexture(welcomeSignCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.08),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4, metalness: 0.05 })
  );
  signMesh.position.set(0, 5.85, 4.51);
  building.add(signMesh);

  return { building, roofGroup };
}

export function createInteractiveDoors(scene, world, RAPIER, doorColliders, interactionPoints) {
  const frame = new THREE.Group();
  frame.position.set(0, 0, 3.92);
  scene.add(frame);

  addBox(frame, [-1.7, 1.8, 0], [0.32, 3.6, 0.36], materials.coral);
  addBox(frame, [1.7, 1.8, 0], [0.32, 3.6, 0.36], materials.coral);
  addBox(frame, [0, 3.65, 0], [3.72, 0.32, 0.38], materials.yellow);

  const doorLeft = new THREE.Group();
  const doorRight = new THREE.Group();
  doorLeft.position.set(-1.54, 0, 0.04);
  doorRight.position.set(1.54, 0, 0.04);
  frame.add(doorLeft, doorRight);

  addBox(doorLeft, [0.77, 1.65, 0], [1.54, 3.3, 0.12], materials.woodLight);
  addBox(doorRight, [-0.77, 1.65, 0], [1.54, 3.3, 0.12], materials.woodLight);
  addBox(doorLeft, [0.77, 1.7, 0.07], [1.12, 2.4, 0.04], materials.wainscot);
  addBox(doorRight, [-0.77, 1.7, 0.07], [1.12, 2.4, 0.04], materials.wainscot);
  addSphere(doorLeft, [1.36, 1.55, 0.12], [0.08, 0.08, 0.08], materials.brass);
  addSphere(doorRight, [-1.36, 1.55, 0.12], [0.08, 0.08, 0.08], materials.brass);

  for (const x of [-0.77, 0.77]) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 1.65, 4.0));
    const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(0.77, 1.65, 0.1), body);
    doorColliders.push(collider);
  }

  // Hinges are the doorLeft/doorRight pivots (x = -1.54 / +1.54). Leaves extend away
  // from the hinge, so rotation.y = -/+ angle swings both leaves outward toward +z.
  const OPEN_ANGLE = 1.6; // radians (~92deg)
  const DOOR_DURATION = 0.8; // seconds
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // 'closed' | 'opening' | 'open' | 'closing'. Logical open/closed only changes on finish.
  let state = 'closed';
  let from = 0;
  let to = 0;
  let clock = 0;
  let pendingCallback = null;

  const setAngle = (a) => {
    doorLeft.rotation.y = -a;
    doorRight.rotation.y = a;
  };
  const currentAngle = () => doorRight.rotation.y;

  const finish = () => {
    setAngle(to);
    state = to > 0 ? 'open' : 'closed';
    if (state === 'closed') {
      for (const collider of doorColliders) collider.setEnabled(true);
    }
    const cb = pendingCallback;
    pendingCallback = null;
    if (cb) cb(state === 'open');
  };

  const update = (dt) => {
    if (state !== 'opening' && state !== 'closing') return;
    clock += dt;
    const t = Math.min(1, clock / DOOR_DURATION);
    setAngle(from + (to - from) * easeInOut(t));
    if (t >= 1) finish();
  };

  // Returns false (and does nothing) while a swing is in progress.
  const toggle = (onComplete) => {
    if (state === 'opening' || state === 'closing') return false;
    const opening = state === 'closed';
    from = currentAngle();
    to = opening ? OPEN_ANGLE : 0;
    clock = 0;
    state = opening ? 'opening' : 'closing';
    pendingCallback = onComplete || null;
    if (opening) {
      for (const collider of doorColliders) collider.setEnabled(false);
    }
    return true;
  };

  // Jump to the final pose (used by recovery so the door never stays half-way).
  const settle = () => {
    if (state === 'opening' || state === 'closing') finish();
  };

  const controls = {
    toggle,
    settle,
    update,
    isOpen: () => state === 'open',
    isBusy: () => state === 'opening' || state === 'closing',
    getState: () => state,
    panels: { doorLeft, doorRight },
    hingeWorld: () => ({
      left: doorLeft.getWorldPosition(new THREE.Vector3()),
      right: doorRight.getWorldPosition(new THREE.Vector3()),
    }),
  };

  interactionPoints.push({
    id: 'door',
    type: 'door',
    title: 'Front door',
    position: new THREE.Vector3(0, 0.7, 4.0),
    radius: 3.2,
    controls,
    action: () => {
      const manager = window.__worldInteractions;
      if (manager) {
        return manager.toggleDoor(controls, window.__playerCameraState ? window.__playerCameraState() : {});
      }
      return toggle();
    },
    getLabel: () => {
      if (state === 'opening') return 'Opening the garden door...';
      if (state === 'closing') return 'Closing the garden door...';
      return state === 'open' ? 'Close the garden door' : 'Open the garden door';
    },
  });

  return controls;
}
