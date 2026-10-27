import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, BatchCollector } from './geometry.js';

export function createArchitecture(scene, world, RAPIER, staticBodies, cameraBlockers) {
  const building = new THREE.Group();
  scene.add(building);
  const archBatch = new BatchCollector();

  const addColliderBox = (pos, halfExtents) => {
    if (!world || !RAPIER || !staticBodies) return null;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos[0], pos[1], pos[2]));
    world.createCollider(RAPIER.ColliderDesc.cuboid(halfExtents[0], halfExtents[1], halfExtents[2]), body);
    staticBodies.push(body);
    return body;
  };

  /**
   * Builds an architectural floor-to-ceiling glass curtain wall with frames, mullions & physics collider
   * Ensures the facade is completely enclosed and cannot be walked through.
   */
  const addGlassFacade = (x1, x2, yBottom, yTop, panels = 4, opts = {}) => {
    const width = Math.abs(x2 - x1);
    const height = yTop - yBottom;
    const centerX = (x1 + x2) * 0.5;
    const centerY = (yBottom + yTop) * 0.5;
    const z = 3.8;
    const frameMat = materials.windowFrame || materials.metalDark;
    const glassMat = opts.glassMat || materials.glass;

    // 1. Base sill/curb & top header beam
    const frameDepth = 0.16;
    const frameThick = 0.10;
    archBatch.addBox([centerX, yBottom + frameThick * 0.5, z], [width, frameThick, frameDepth], frameMat);
    archBatch.addBox([centerX, yTop - frameThick * 0.5, z], [width, frameThick, frameDepth], frameMat);

    // 2. Left & Right vertical jamb posts
    archBatch.addBox([x1 + frameThick * 0.5, centerY, z], [frameThick, height - frameThick * 2, frameDepth], frameMat);
    archBatch.addBox([x2 - frameThick * 0.5, centerY, z], [frameThick, height - frameThick * 2, frameDepth], frameMat);

    // 3. Intermediate vertical mullions
    const step = width / panels;
    const mullionThick = 0.08;
    for (let p = 1; p < panels; p += 1) {
      const mx = x1 + p * step;
      archBatch.addBox([mx, centerY, z], [mullionThick, height - frameThick * 2, frameDepth * 0.88], frameMat);
    }

    // 4. Horizontal transom bars (give modern floor-to-ceiling architectural proportions)
    const transomHeights = opts.transoms ?? [
      yBottom + height * 0.26,
      yBottom + height * 0.74,
    ];
    for (const ty of transomHeights) {
      if (ty > yBottom + 0.35 && ty < yTop - 0.35) {
        archBatch.addBox([centerX, ty, z], [width - frameThick * 2, 0.06, frameDepth * 0.82], frameMat);
      }
    }

    // 5. Crystal clear luxury glass panels
    const innerH = height - frameThick * 2;
    for (let p = 0; p < panels; p += 1) {
      const px = x1 + (p + 0.5) * step;
      const pw = step - mullionThick * 0.85;
      addBox(building, [px, centerY, z], [pw, innerH, 0.04], glassMat, { shadow: false });
    }

    // 6. Solid impenetrable Rapier static collider from floor to ceiling (cannot be penetrated)
    addColliderBox([centerX, centerY, z], [width * 0.5, height * 0.5, 0.25]);
  };

  // =========================================================================
  // 1. FOUNDATION & GROUND FLOOR SLABS
  // Footprint: x: [-16.5, 26.0] (42.5m wide), z: [3.8, -8.2] (12.0m deep)
  // Center: x ≈ 4.75, z ≈ -2.2
  // =========================================================================

  // Ground Floor Hardwood Floor (Bays 1-3: Gallery, Living Room, Home Office)
  // x: [-16.5, 16.0], z: [3.8, -8.2] -> width 32.5m, depth 12.0m, center x = -0.25, z = -2.2
  addBox(building, [-0.25, -0.12, -2.2], [32.5, 0.24, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([-0.25, -0.12, -2.2], [16.25, 0.12, 6.0]);

  // Luxury Private Garage Dark Polished Epoxy Floor (Bay 4: x: [16.0, 26.0], z: [3.8, -8.2])
  addBox(building, [21.0, -0.12, -2.2], [10.0, 0.24, 12.0], materials.epoxyFloor, { shadow: false, receive: true });
  addColliderBox([21.0, -0.12, -2.2], [5.0, 0.12, 6.0]);

  // Exterior Stone Plinth Skirting Foundation around perimeter
  archBatch.addBox([4.75, 0.16, 3.85], [42.8, 0.38, 0.4], materials.foundation);
  archBatch.addBox([-16.6, 0.16, -2.2], [0.4, 0.38, 12.4], materials.foundation);
  archBatch.addBox([26.1, 0.16, -2.2], [0.4, 0.38, 12.4], materials.foundation);
  archBatch.addBox([4.75, 0.16, -8.25], [42.8, 0.38, 0.4], materials.foundation);

  // =========================================================================
  // 2. GRAND ENTRANCE STEPS & FRONT PORCH
  // Porch platform at z = [3.8, 7.6], x = [-6.5, 6.5]
  // =========================================================================
  archBatch.addBox([0, 0.08, 5.7], [13.0, 0.22, 3.8], materials.woodLight);
  addColliderBox([0, -0.03, 5.7], [6.5, 0.11, 1.9]);

  // Grand descending stone stairs with wide curved treads leading to front fountain roundabout
  for (let step = 0; step < 4; step += 1) {
    const sy = -0.04 - step * 0.08;
    const sz = 7.6 + step * 0.55;
    const sw = 9.6 - step * 0.4;
    archBatch.addBox([0, sy, sz], [sw, 0.16, 0.6], materials.stone);
    addColliderBox([0, sy - 0.06, sz], [sw * 0.5, 0.08, 0.3]);
  }

  // Double-height front monumental columns (height 10.2m) flanking central entrance
  const frontColX = [-5.5, -2.2, 2.2, 5.5];
  for (const cx of frontColX) {
    // Pedestal base
    archBatch.addBox([cx, 0.45, 7.4], [0.85, 0.7, 0.85], materials.stone);
    archBatch.addCylinder([cx, 0.9, 7.4], 0.38, 0.42, 0.2, materials.woodWarm, { segments: 16 });
    // Lower shaft (ground floor)
    archBatch.addCylinder([cx, 3.0, 7.4], 0.32, 0.36, 4.0, materials.column, { segments: 20 });
    // Mid capital / floor ring at second floor level
    archBatch.addBox([cx, 5.2, 7.4], [0.8, 0.3, 0.8], materials.woodWarm);
    // Upper shaft (second floor)
    archBatch.addCylinder([cx, 7.6, 7.4], 0.28, 0.32, 4.5, materials.column, { segments: 20 });
    // Upper ornate capital
    archBatch.addBox([cx, 10.0, 7.4], [0.95, 0.35, 0.95], materials.stone);
    addColliderBox([cx, 5.0, 7.4], [0.45, 5.0, 0.45]);
  }

  // Porch balustrades & railings on ground floor
  for (const [x1, x2] of [[-5.5, -2.2], [2.2, 5.5]]) {
    const mx = (x1 + x2) * 0.5;
    const len = Math.abs(x2 - x1) - 0.8;
    archBatch.addBox([mx, 1.05, 7.4], [len, 0.08, 0.14], materials.woodLight);
    archBatch.addBox([mx, 0.45, 7.4], [len, 0.08, 0.14], materials.woodLight);
    for (let bx = x1 + 0.45; bx <= x2 - 0.45; bx += 0.35) {
      archBatch.addCylinder([bx, 0.75, 7.4], 0.04, 0.04, 0.52, materials.trim, { segments: 8 });
    }
    addColliderBox([mx, 0.7, 7.4], [len * 0.5, 0.65, 0.12]);
  }

  // Hanging porch flower planters
  for (const hx of [-3.85, 3.85]) {
    archBatch.addCylinder([hx, 4.8, 7.4], 0.015, 0.015, 0.6, materials.metalDark);
    archBatch.addSphere([hx, 4.45, 7.4], [0.36, 0.26, 0.36], materials.terracotta);
    archBatch.addSphere([hx, 4.6, 7.4], [0.45, 0.3, 0.45], materials.foliageBright);
    archBatch.addSphere([hx - 0.15, 4.65, 7.45], [0.12, 0.12, 0.12], materials.coral);
    archBatch.addSphere([hx + 0.15, 4.62, 7.35], [0.12, 0.12, 0.12], materials.yellow);
  }

  // Porch roof canopy over entrance (y = 5.2m to 5.6m)
  archBatch.addBox([0, 5.35, 5.8], [13.4, 0.32, 4.0], materials.roof);
  archBatch.addBox([0, 5.48, 5.8], [13.6, 0.14, 4.2], materials.roofTrim);
  archBatch.addBox([0, 5.16, 5.8], [13.2, 0.12, 3.8], materials.woodWarm);

  // =========================================================================
  // 3. EXTERIOR WALLS & ARCHITECTURAL CUTAWAY POSTS
  // Full 2-story height (10.4m), with open cutaway facing south (+Z)
  // =========================================================================

  // Left West Wall (x = -16.5, z: [3.8, -8.2])
  const wallWest = addBox(building, [-16.5, 5.2, -2.2], [0.65, 10.4, 12.0], materials.wall, { shadow: true });
  cameraBlockers.push(wallWest);
  addColliderBox([-16.5, 5.2, -2.2], [0.325, 5.2, 6.0]);
  archBatch.addBox([-16.45, 0.65, -2.2], [0.68, 1.1, 12.0], materials.wainscot);
  archBatch.addBox([-16.45, 5.2, -2.2], [0.68, 0.3, 12.0], materials.woodWarm);

  // Right East Wall (x = 26.0, z: [3.8, -8.2])
  const wallEast = addBox(building, [26.0, 5.2, -2.2], [0.65, 10.4, 12.0], materials.wall, { shadow: true });
  cameraBlockers.push(wallEast);
  addColliderBox([26.0, 5.2, -2.2], [0.325, 5.2, 6.0]);
  archBatch.addBox([25.95, 0.65, -2.2], [0.68, 1.1, 12.0], materials.wainscot);
  archBatch.addBox([25.95, 5.2, -2.2], [0.68, 0.3, 12.0], materials.woodWarm);

  // Rear North Wall (z = -8.2, x: [-16.5, 26.0], width 42.5m)
  const rearWallLeft = addBox(building, [-11.0, 5.2, -8.2], [11.0, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearWallLeft);
  addColliderBox([-11.0, 5.2, -8.2], [5.5, 5.2, 0.325]);

  const rearWallCenter = addBox(building, [0, 7.6, -8.2], [11.0, 5.6, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearWallCenter);
  addColliderBox([0, 7.6, -8.2], [5.5, 2.8, 0.325]);

  const rearWallRight = addBox(building, [10.75, 5.2, -8.2], [10.5, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearWallRight);
  addColliderBox([10.75, 5.2, -8.2], [5.25, 5.2, 0.325]);

  const rearGarage = addBox(building, [21.0, 5.2, -8.2], [10.0, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearGarage);
  addColliderBox([21.0, 5.2, -8.2], [5.0, 5.2, 0.325]);

  // Chapter 1 Living Room rear wall flanks & terrace opening portal (z = -8.2, x: [-5.5, 5.5])
  // Solid left wall flank (x: [-5.5, -2.4], width 3.1m) - mounts the "About Me" display board
  const rearFlankLeft = addBox(building, [-3.95, 2.4, -8.2], [3.1, 4.8, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearFlankLeft);
  addColliderBox([-3.95, 2.4, -8.2], [1.55, 2.4, 0.325]);

  // Solid right wall flank (x: [2.4, 5.5], width 3.1m) - wraps alongside the staircase
  const rearFlankRight = addBox(building, [3.95, 2.4, -8.2], [3.1, 4.8, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearFlankRight);
  addColliderBox([3.95, 2.4, -8.2], [1.55, 2.4, 0.325]);

  // Lintel beam & header over the 4.8m wide sliding glass portal
  const rearLintel = addBox(building, [0, 4.55, -8.2], [5.0, 0.5, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearLintel);
  addColliderBox([0, 4.55, -8.2], [2.5, 0.25, 0.325]);
  archBatch.addBox([0, 4.35, -8.2], [5.0, 0.12, 0.36], materials.trim);
  archBatch.addBox([0, 0.04, -8.2], [5.0, 0.08, 0.24], materials.trim);

  // Rear Garden Veranda & Terrace (z = [-8.2, -15.5], x = [-10.0, 10.0])
  addBox(building, [0, 0.04, -11.85], [20.0, 0.24, 7.3], materials.stone, { shadow: true, receive: true });
  addColliderBox([0, 0.0, -11.85], [10.0, 0.16, 3.65]);
  addBox(building, [0, 0.14, -11.85], [19.6, 0.04, 6.9], materials.terraceTiles, { shadow: false, receive: true });

  // Rear descending stone steps
  for (let s = 0; s < 3; s += 1) {
    const stepZ = -15.5 - s * 0.55;
    const stepY = 0.06 - s * 0.07;
    const stepW = 12.0 - s * 0.4;
    archBatch.addBox([0, stepY, stepZ], [stepW, 0.14, 0.55], materials.stone);
    addColliderBox([0, stepY - 0.05, stepZ], [stepW * 0.5, 0.07, 0.275]);
  }

  // Modern perimeter glass & teak balustrade around rear terrace
  for (const [bx, bz, bw, bd] of [
    [-9.7, -11.85, 0.14, 6.9],
    [9.7, -11.85, 0.14, 6.9],
    [-6.5, -15.45, 6.4, 0.14],
    [6.5, -15.45, 6.4, 0.14],
  ]) {
    addBox(building, [bx, 0.65, bz], [bw, 0.95, bd], materials.glass);
    archBatch.addBox([bx, 1.15, bz], [bw + 0.06, 0.08, bd + 0.06], materials.woodWarm);
    addColliderBox([bx, 0.65, bz], [bw * 0.5 + 0.05, 0.5, bd * 0.5 + 0.05]);
  }

  // Architectural Front Cutaway Framing Posts (Crisp room boundary pilasters at z = 3.8)
  // Pilasters give the cutaway clean architectural framing without obstructing the rooms
  const cutawayPilasterX = [-16.5, -5.5, 5.5, 16.0, 26.0];
  for (const px of cutawayPilasterX) {
    // Ground floor section (y: [0, 5.2])
    archBatch.addBox([px, 2.6, 3.8], [0.65, 5.2, 0.65], materials.wall);
    archBatch.addBox([px, 0.65, 3.82], [0.68, 1.1, 0.68], materials.wainscot);
    // Floor band at y = 5.2
    archBatch.addBox([px, 5.2, 3.82], [0.85, 0.35, 0.85], materials.woodWarm);
    // Upper floor section (y: [5.2, 10.4])
    archBatch.addBox([px, 7.8, 3.8], [0.65, 5.2, 0.65], materials.wall);
    archBatch.addBox([px, 10.2, 3.82], [0.85, 0.35, 0.85], materials.stone);
    addColliderBox([px, 5.2, 3.8], [0.325, 5.2, 0.325]);
  }

  // Ground Floor Front Header Lintel Beams (framing the tops of Lantai 1 rooms, y = 4.8 to 5.2)
  for (const [x1, x2] of [[-16.5, -5.5], [5.5, 16.0], [16.0, 26.0]]) {
    const mx = (x1 + x2) * 0.5;
    const w = Math.abs(x2 - x1);
    archBatch.addBox([mx, 4.95, 3.8], [w, 0.5, 0.45], materials.trim);
    archBatch.addBox([mx, 4.65, 3.8], [w, 0.12, 0.5], materials.woodWarm);
  }

  // Upper Floor Front Header Lintel Beams (framing the tops of Lantai 2 rooms, y = 9.8 to 10.4)
  for (const [x1, x2] of [[-16.5, -5.5], [-5.5, 5.5], [5.5, 16.0], [16.0, 26.0]]) {
    const mx = (x1 + x2) * 0.5;
    const w = Math.abs(x2 - x1);
    archBatch.addBox([mx, 10.15, 3.8], [w, 0.5, 0.45], materials.trim);
    archBatch.addBox([mx, 9.85, 3.8], [w, 0.12, 0.5], materials.woodWarm);
  }

  // Garage Front Roll-up Door Frame & Header Housing (x: [16.0, 26.0], z = 3.8)
  archBatch.addBox([21.0, 4.35, 3.75], [9.4, 0.7, 0.55], materials.woodDark);
  archBatch.addBox([21.0, 4.15, 3.7], [8.8, 0.3, 0.4], materials.metalDark);
  archBatch.addBox([16.4, 2.2, 3.8], [0.65, 4.4, 0.45], materials.woodDark);
  archBatch.addBox([25.6, 2.2, 3.8], [0.65, 4.4, 0.45], materials.woodDark);

  // =========================================================================
  // 3B. FRONT ARCHITECTURAL GLASS FACADE (Ground Floor / Lantai 1, y: [0.06, 4.75])
  // Modern floor-to-ceiling panoramic glass walls with dark architectural frames
  // Fully enclosed with solid physical Rapier colliders (cannot be penetrated)
  // =========================================================================

  // Bay 1: Project Gallery Front Glass (x: [-16.15, -5.85])
  addGlassFacade(-16.15, -5.85, 0.06, 4.75, 4);

  // Bay 2: Living Room Entrance Flanking Glass Walls
  // West flank (x: [-5.15, -1.8])
  addGlassFacade(-5.15, -1.8, 0.06, 4.75, 2);
  // East flank (x: [1.8, 5.15])
  addGlassFacade(1.8, 5.15, 0.06, 4.75, 2);
  // Transom window above the main double door (y: [3.65, 4.75], x: [-1.75, 1.75])
  addGlassFacade(-1.75, 1.75, 3.65, 4.75, 2, { transoms: [] });

  // Bay 3: Home Office Front Glass (x: [5.85, 15.65])
  addGlassFacade(5.85, 15.65, 0.06, 4.75, 4);

  // Bay 4: Garage Showroom Tinted Glass Curtain Wall (x: [16.8, 25.2], y: [0.06, 4.15])
  addGlassFacade(16.8, 25.2, 0.06, 4.15, 4, {
    glassMat: materials.garageGlass,
    transoms: [1.05, 2.05, 3.05],
  });

  // =========================================================================
  // 4. INTERIOR PARTITION WALLS & ARCHWAYS (Ground Floor, y: [0, 5.2])
  // Dividing Project Gallery, Living Room, Home Office, Garasi
  // =========================================================================

  // Partition Gallery / About Me Room at x = -5.5 (z: [3.8, -8.2])
  // 1. Front Dedicated About Me Feature Wall Section (z: [3.8, -0.4], depth 4.2m, center z = 1.7)
  const partWestG1 = addBox(building, [-5.5, 2.6, 1.7], [0.45, 5.2, 4.2], materials.wall, { shadow: true });
  cameraBlockers.push(partWestG1);
  addColliderBox([-5.5, 2.6, 1.7], [0.225, 2.6, 2.1]);
  // Architectural wainscoting and top crown molding
  archBatch.addBox([-5.45, 0.65, 1.7], [0.48, 1.1, 4.2], materials.wainscot);
  archBatch.addBox([-5.45, 5.05, 1.7], [0.50, 0.18, 4.2], materials.trim);

  // 2. Grand Arched Walkthrough Portal into Project Gallery (3.4m wide, z: [-0.4, -3.8], center z = -2.1)
  archBatch.addBox([-5.5, 4.35, -2.1], [0.48, 1.7, 3.4], materials.wall);
  archBatch.addBox([-5.5, 3.45, -2.1], [0.52, 0.16, 3.4], materials.woodWarm);
  // Architectural fluted pilasters framing the gallery entrance portal
  archBatch.addBox([-5.5, 2.6, -0.45], [0.52, 5.2, 0.22], materials.woodLight);
  archBatch.addBox([-5.5, 2.6, -3.75], [0.52, 5.2, 0.22], materials.woodLight);

  // 3. Rear Solid Wall Section (z: [-3.8, -8.2], depth 4.4m, center z = -6.0)
  const partWestG2 = addBox(building, [-5.5, 2.6, -6.0], [0.45, 5.2, 4.4], materials.wall, { shadow: true });
  cameraBlockers.push(partWestG2);
  addColliderBox([-5.5, 2.6, -6.0], [0.225, 2.6, 2.2]);
  archBatch.addBox([-5.45, 0.65, -6.0], [0.48, 1.1, 4.4], materials.wainscot);
  archBatch.addBox([-5.45, 5.05, -6.0], [0.50, 0.18, 4.4], materials.trim);

  // Partition Living Room / Home Office at x = 5.5 (z: [3.8, -8.2])
  // Front entrance portal from foyer into Home Office (width 2.2m, z: [0.9, 3.1])
  const partEastFrontPost = addBox(building, [5.5, 2.6, 3.45], [0.45, 5.2, 0.7], materials.wall, { shadow: true });
  cameraBlockers.push(partEastFrontPost);
  addColliderBox([5.5, 2.6, 3.45], [0.225, 2.6, 0.35]);

  archBatch.addBox([5.5, 4.4, 2.0], [0.48, 1.6, 2.2], materials.wall);
  archBatch.addBox([5.5, 3.55, 2.0], [0.52, 0.14, 2.2], materials.woodWarm);

  // Solid structural wall behind portal against which the side staircase ascends (z: [-8.2, 0.9], length 9.1m)
  const partEastSolid = addBox(building, [5.5, 2.6, -3.65], [0.45, 5.2, 9.1], materials.wall, { shadow: true });
  cameraBlockers.push(partEastSolid);
  addColliderBox([5.5, 2.6, -3.65], [0.225, 2.6, 4.55]);

  // Partition Home Office / Garasi at x = 16.0 (z: [3.8, -8.2])
  // Front wall section (z: [3.8, -0.9], depth 4.7m)
  const partGarageFront = addBox(building, [16.0, 2.6, 1.45], [0.45, 5.2, 4.7], materials.wall, { shadow: true });
  cameraBlockers.push(partGarageFront);
  addColliderBox([16.0, 2.6, 1.45], [0.225, 2.6, 2.35]);

  // Wide Walkthrough Doorway between Office and Garage at z = -2.0 (width 2.2m, z: [-0.9, -3.1])
  archBatch.addBox([16.0, 4.25, -2.0], [0.48, 1.9, 2.2], materials.wall);
  archBatch.addBox([16.0, 3.25, -2.0], [0.52, 0.14, 2.2], materials.woodWarm);

  // Rear wall section (z: [-3.1, -8.2], depth 5.1m)
  const partGarageRear = addBox(building, [16.0, 2.6, -5.65], [0.45, 5.2, 5.1], materials.wall, { shadow: true });
  cameraBlockers.push(partGarageRear);
  addColliderBox([16.0, 2.6, -5.65], [0.225, 2.6, 2.55]);

  // =========================================================================
  // 5. SECOND FLOOR SLABS & MEZZANINE (Elevation y = 5.2m)
  // Perfectly stacked directly above Lantai 1 rooms
  // Top surface = 5.2m, bottom surface = 4.92m, thickness = 0.28m
  // =========================================================================

  // Master Bedroom Floor Slab (Bay 1: x: [-16.5, -5.5], z: [3.8, -8.2])
  addBox(building, [-11.0, 5.06, -2.2], [11.0, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([-11.0, 5.06, -2.2], [5.5, 0.14, 6.0]);

  // Master Bathroom Floor Slabs & Upper Mezzanine (Bay 2: x: [-5.5, 5.5], z: [3.8, -8.2])
  // Main bathroom & atrium floor slab (x: [-5.5, 2.6], width 8.1m, depth 12.0m)
  addBox(building, [-1.45, 5.06, -2.2], [8.1, 0.28, 12.0], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([-1.45, 5.06, -2.2], [4.05, 0.14, 6.0]);

  // Rear upper landing floor slab (connecting top of stairs to bathroom, bedroom, & library, x: [2.6, 5.5], z: [-5.6, -8.2])
  addBox(building, [4.05, 5.06, -6.9], [2.9, 0.28, 2.6], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([4.05, 5.06, -6.9], [1.45, 0.14, 1.3]);

  // Front upper overlook floor slab (x: [2.6, 5.5], z: [0.8, 3.8])
  addBox(building, [4.05, 5.06, 2.3], [2.9, 0.28, 3.0], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([4.05, 5.06, 2.3], [1.45, 0.14, 1.5]);

  // Modern safety glass balustrades framing the stairwell opening on Lantai 2 (open well at x: [2.6, 5.5], z: [-5.6, 0.8])
  // Inner side balustrade along x = 2.65
  addBox(building, [2.65, 5.65, -2.4], [0.06, 0.9, 6.4], materials.glass);
  archBatch.addBox([2.65, 6.12, -2.4], [0.1, 0.08, 6.4], materials.woodWarm);
  addColliderBox([2.65, 5.65, -2.4], [0.06, 0.45, 3.2]);

  // Front balustrade along z = 0.8 (x: [2.7, 5.4])
  addBox(building, [4.05, 5.65, 0.8], [2.7, 0.9, 0.06], materials.glass);
  archBatch.addBox([4.05, 6.12, 0.8], [2.7, 0.08, 0.1], materials.woodWarm);
  addColliderBox([4.05, 5.65, 0.8], [1.35, 0.45, 0.06]);

  // Library Nook Floor Slab (Bay 3: x: [5.5, 16.0], z: [3.8, -8.2])
  addBox(building, [10.75, 5.06, -2.2], [10.5, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([10.75, 5.06, -2.2], [5.25, 0.14, 6.0]);

  // Creative Studio Floor Slab (Bay 4: x: [16.0, 26.0], z: [3.8, -8.2])
  addBox(building, [21.0, 5.06, -2.2], [10.0, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([21.0, 5.06, -2.2], [5.0, 0.14, 6.0]);

  // Continuous Architectural Floor Fascia Beam along the front cutaway edge (z = 3.8, y = 5.06)
  archBatch.addBox([4.75, 5.06, 3.85], [42.8, 0.32, 0.35], materials.woodWarm);
  archBatch.addBox([4.75, 5.22, 3.87], [43.0, 0.08, 0.38], materials.trim);

  // =========================================================================
  // 5B. FRONT ARCHITECTURAL GLASS FACADE (Upper Floor / Lantai 2, y: [5.25, 9.85])
  // Full-height panoramic floor-to-ceiling glass walls across all upper rooms
  // Solid physical Rapier colliders preventing any fall-out or penetration
  // =========================================================================

  // Bay 1: Master Bedroom Front Glass (x: [-16.15, -5.85])
  addGlassFacade(-16.15, -5.85, 5.25, 9.85, 4);

  // Bay 2: Bathroom & Central Atrium Front Glass (x: [-5.15, 5.15])
  addGlassFacade(-5.15, 5.15, 5.25, 9.85, 4);

  // Bay 3: Library Nook Front Glass (x: [5.85, 15.65])
  addGlassFacade(5.85, 15.65, 5.25, 9.85, 4);

  // Bay 4: Creative Studio Front Glass (x: [16.35, 25.65])
  addGlassFacade(16.35, 25.65, 5.25, 9.85, 4);

  // =========================================================================
  // 6. SECOND FLOOR INTERIOR PARTITIONS (y: [5.2, 10.4])
  // Separating Master Bedroom, Bathroom, Library Nook, Creative Studio
  // =========================================================================

  // Partition Bedroom / Bathroom at x = -5.5 (z: [3.8, -8.2])
  // Front section
  const partMBS = addBox(building, [-5.5, 7.8, 1.8], [0.45, 5.2, 4.0], materials.wall, { shadow: true });
  cameraBlockers.push(partMBS);
  addColliderBox([-5.5, 7.8, 1.8], [0.225, 2.6, 2.0]);
  // Arched walkthrough portal connecting Bedroom to Bathroom / Mezzanine (z: [-1.2, -4.2])
  archBatch.addBox([-5.5, 9.6, -2.7], [0.48, 1.6, 3.0], materials.wall);
  archBatch.addBox([-5.5, 8.75, -2.7], [0.52, 0.16, 3.0], materials.woodWarm);
  // Rear section
  const partMBN = addBox(building, [-5.5, 7.8, -6.2], [0.45, 5.2, 4.0], materials.wall, { shadow: true });
  cameraBlockers.push(partMBN);
  addColliderBox([-5.5, 7.8, -6.2], [0.225, 2.6, 2.0]);

  // Partition Bathroom / Library at x = 5.5 (z: [3.8, -8.2])
  // Front section (z: [0.8, 3.8])
  const partLibS = addBox(building, [5.5, 7.8, 2.3], [0.45, 5.2, 3.0], materials.wall, { shadow: true });
  cameraBlockers.push(partLibS);
  addColliderBox([5.5, 7.8, 2.3], [0.225, 2.6, 1.5]);

  // Mid section along stairwell ascent (z: [-5.6, 0.8], depth 6.4m - solid structural backdrop)
  const partLibMid = addBox(building, [5.5, 7.8, -2.4], [0.45, 5.2, 6.4], materials.wall, { shadow: true });
  cameraBlockers.push(partLibMid);
  addColliderBox([5.5, 7.8, -2.4], [0.225, 2.6, 3.2]);

  // Arched walkthrough portal connecting Upper Landing to Library (z: [-5.8, -7.8])
  archBatch.addBox([5.5, 9.3, -6.8], [0.48, 2.2, 2.0], materials.wall);
  archBatch.addBox([5.5, 8.2, -6.8], [0.52, 0.16, 2.0], materials.woodWarm);

  // North corner post (z: [-7.8, -8.2])
  const partLibN = addBox(building, [5.5, 7.8, -8.0], [0.45, 5.2, 0.4], materials.wall, { shadow: true });
  cameraBlockers.push(partLibN);
  addColliderBox([5.5, 7.8, -8.0], [0.225, 2.6, 0.2]);

  // Partition Library / Creative Studio at x = 16.0 (z: [3.8, -8.2])
  // Front section
  const partStudioS = addBox(building, [16.0, 7.8, 1.8], [0.45, 5.2, 4.0], materials.wall, { shadow: true });
  cameraBlockers.push(partStudioS);
  addColliderBox([16.0, 7.8, 1.8], [0.225, 2.6, 2.0]);
  // Connecting Gallery Portal between Library & Creative Studio (z: [-1.2, -4.2])
  archBatch.addBox([16.0, 9.6, -2.7], [0.48, 1.6, 3.0], materials.wall);
  archBatch.addBox([16.0, 8.75, -2.7], [0.52, 0.16, 3.0], materials.woodWarm);
  // Rear section
  const partStudioN = addBox(building, [16.0, 7.8, -6.2], [0.45, 5.2, 4.0], materials.wall, { shadow: true });
  cameraBlockers.push(partStudioN);
  addColliderBox([16.0, 7.8, -6.2], [0.225, 2.6, 2.0]);

  // =========================================================================
  // 7. ARCHITECTURAL FLOATING SIDE STAIRCASE (Ground Floor to Lantai 2)
  // Positioned along East flank of Living Room (x = 4.05), leaving the central
  // entrance-to-terrace grand axis (x: [-3.0, 3.0]) 100% open and unobstructed.
  // Origin: x: 4.05, starts at z = 0.6 (y = 0.0), ascends smoothly northward to z = -5.8 (y = 5.2)
  // Run = 6.4m, Rise = 5.2m. 26 steps (rise: 20cm, depth: 24.6cm).
  // Includes smooth inclined ramp collider for effortless 100% snag-free climbing.
  // =========================================================================
  const numSteps = 26;
  const stairX = 4.05;
  const stairWidth = 1.7;
  const startZ = 0.6;
  const endZ = -5.8;
  const startY = 0.0;
  const endY = 5.2;

  for (let i = 0; i < numSteps; i += 1) {
    const t = (i + 0.5) / numSteps;
    const curZ = startZ + (endZ - startZ) * t;
    const curY = startY + (endY - startY) * t;
    const stepDepth = Math.abs(endZ - startZ) / numSteps + 0.06;
    const stepHeight = (endY - startY) / numSteps;

    // Wooden tread
    archBatch.addBox([stairX, curY, curZ], [stairWidth, 0.08, stepDepth], materials.woodWarm);
    // Brass edge riser trim
    archBatch.addBox([stairX, curY + 0.03, curZ + stepDepth * 0.45], [stairWidth, 0.03, 0.03], materials.brass);
    // Solid riser support below
    archBatch.addBox([stairX, curY - stepHeight * 0.5, curZ], [stairWidth - 0.08, stepHeight, stepDepth - 0.02], materials.woodDark);
  }

  // Smooth inclined ramp collider for butter-smooth slope climbing in Rapier
  if (world && RAPIER && staticBodies) {
    const stairLen = Math.hypot(endZ - startZ, endY - startY);
    const stairAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));
    const rampBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(stairX, (startY + endY) * 0.5, (startZ + endZ) * 0.5)
        .setRotation({ x: Math.sin(stairAngle * 0.5), y: 0, z: 0, w: Math.cos(stairAngle * 0.5) })
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(stairWidth * 0.48, 0.06, stairLen * 0.5 + 0.15), rampBody);
    staticBodies.push(rampBody);
  }

  // Inner floating glass balustrade with mahogany handrail along the open (left) side of the stairs
  const sx = stairX - stairWidth * 0.5; // x = 3.2
  const midZ = (startZ + endZ) * 0.5;
  const midY = (startY + endY) * 0.5 + 1.0;
  const stairLen = Math.hypot(endZ - startZ, endY - startY);
  const stairAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));

  // Polished mahogany top handrail
  archBatch.addBox([sx, midY, midZ], [0.10, 0.10, stairLen], materials.woodDark, {
    rotation: [stairAngle, 0, 0],
  });

  // Architectural crystal clear glass balustrade panel along staircase flight
  archBatch.addBox([sx, midY - 0.42, midZ], [0.04, 0.76, stairLen], materials.glass, {
    rotation: [stairAngle, 0, 0],
  });

  // Vertical stainless steel standoff balusters
  for (let i = 0; i < numSteps; i += 3) {
    const t = (i + 0.5) / numSteps;
    const bz = startZ + (endZ - startZ) * t;
    const by = startY + (endY - startY) * t + 0.5;
    archBatch.addCylinder([sx, by, bz], 0.025, 0.025, 0.95, materials.trim, { segments: 8 });
  }
  addColliderBox([sx, midY - 0.35, midZ], [0.08, 0.75, stairLen * 0.5]);

  // Under-stair modern architectural feature (minimalist warm teak plinth with ambient display ledge)
  archBatch.addBox([stairX, 0.15, -4.0], [stairWidth - 0.1, 0.3, 3.2], materials.woodDark);
  archBatch.addBox([stairX, 0.31, -4.0], [stairWidth - 0.2, 0.02, 3.0], materials.stone);

  // =========================================================================
  // 8. LUXURY PITCHED GABLED ROOF STRUCTURE (`roofGroup`)
  // Matching Vicky's World Map villa architecture:
  // Pitched dark charcoal gables, warm wood soffits/overhangs, triangular pediments
  // =========================================================================
  const roofGroup = new THREE.Group();
  building.add(roofGroup);
  const roofBatch = new BatchCollector();

  // West Wing Gable (Over Master Bedroom, x: [-16.5, -5.5])
  roofBatch.addBox([-11.0, 10.9, -2.2], [11.8, 0.38, 13.0], materials.roof, { rotation: [0, 0, 0.12] });
  roofBatch.addBox([-11.0, 10.7, -2.2], [11.6, 0.18, 12.8], materials.woodWarm, { rotation: [0, 0, 0.12] });

  // Center High Atrium Gable (Over Bathroom & Grand Entrance, x: [-5.5, 5.5])
  // High triangular gable peak matching the map's prominent central pediment
  roofBatch.addBox([0, 11.8, -2.2], [12.0, 0.42, 13.2], materials.roof);
  roofBatch.addBox([0, 12.15, -2.2], [1.4, 0.38, 13.6], materials.roofTrim);
  roofBatch.addBox([0, 11.55, -2.2], [11.6, 0.18, 12.8], materials.woodWarm);

  // Triangular gable pediment front face over central entrance (z = 3.8)
  roofBatch.addBox([0, 11.1, 3.85], [11.4, 1.6, 0.3], materials.wall);
  roofBatch.addBox([0, 11.95, 3.9], [11.8, 0.22, 0.4], materials.roofTrim);

  // East Wing Gable (Over Library Nook, x: [5.5, 16.0])
  roofBatch.addBox([10.75, 10.9, -2.2], [11.2, 0.38, 13.0], materials.roof, { rotation: [0, 0, -0.12] });
  roofBatch.addBox([10.75, 10.7, -2.2], [11.0, 0.18, 12.8], materials.woodWarm, { rotation: [0, 0, -0.12] });

  // Garage Flat Modern Overhang Roof with Architectural Fascia (Bay 4, x: [16.0, 26.0])
  roofBatch.addBox([21.0, 10.6, -2.2], [10.8, 0.45, 13.0], materials.roof);
  roofBatch.addBox([21.0, 10.9, -2.2], [11.2, 0.18, 13.4], materials.roofTrim);
  roofBatch.addBox([21.0, 10.35, -2.2], [10.6, 0.18, 12.8], materials.woodWarm);

  // Red Brick Fireplace Chimney on living room roof
  const cx = 4.2;
  const cz = -2.0;
  roofBatch.addBox([cx, 11.8, cz], [1.4, 3.2, 1.4], materials.wainscot);
  roofBatch.addBox([cx, 13.5, cz], [1.6, 0.2, 1.6], materials.stone);
  roofBatch.addCylinder([cx, 13.9, cz], 0.32, 0.38, 0.6, materials.terracotta, { segments: 12 });
  roofBatch.build(roofGroup, true);

  // Chimney animated smoke puffs
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
      [cx + (s + 1) * 0.28, 14.5 + s * 0.8, cz + (s + 1) * 0.2],
      [0.42 + s * 0.18, 0.38 + s * 0.16, 0.42 + s * 0.18],
      smokeMat,
      { shadow: false }
    );
  }

  // =========================================================================
  // 9. GRAND ENTRANCE SIGNBOARD ("VICKY'S WORLD")
  // Mounted directly above the porch entrance columns
  // =========================================================================
  addBox(building, [0, 5.85, 7.4], [7.2, 1.45, 0.18], materials.woodDark);
  const welcomeCanvas = document.createElement('canvas');
  welcomeCanvas.width = 1024;
  welcomeCanvas.height = 256;
  const sCtx = welcomeCanvas.getContext('2d');
  sCtx.fillStyle = '#223830';
  sCtx.fillRect(0, 0, 1024, 256);
  sCtx.strokeStyle = '#d89c47';
  sCtx.lineWidth = 12;
  sCtx.strokeRect(16, 16, 992, 224);
  sCtx.fillStyle = '#fffdf7';
  sCtx.font = '900 64px "Nunito", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.letterSpacing = '3px';
  sCtx.fillText('VICKY’S WORLD', 512, 135);
  sCtx.fillStyle = '#f0c458';
  sCtx.font = '700 28px "DM Sans", sans-serif';
  sCtx.fillText('DEVELOPER · CREATOR · EXPLORER', 512, 192);

  const signTex = new THREE.CanvasTexture(welcomeCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 1.35),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4, metalness: 0.05 })
  );
  signMesh.position.set(0, 5.85, 7.51);
  building.add(signMesh);

  // Warm Brass Wall Sconces along cutaway pilasters
  for (const sx of [-16.5, -5.5, 5.5, 16.0, 25.5]) {
    // Ground floor sconces
    archBatch.addBox([sx, 3.8, 3.95], [0.14, 0.28, 0.14], materials.brass);
    addSphere(building, [sx, 3.8, 3.95], [0.12, 0.12, 0.12], materials.glow, { shadow: false });
    // Upper floor sconces
    archBatch.addBox([sx, 8.8, 3.95], [0.14, 0.28, 0.14], materials.brass);
    addSphere(building, [sx, 8.8, 3.95], [0.12, 0.12, 0.12], materials.glow, { shadow: false });
  }

  // Build batched architecture
  archBatch.build(building, true);

  return { building, roofGroup };
}

export function createInteractiveDoors(scene, world, RAPIER, doorColliders, interactionPoints) {
  const frameMat = materials.windowFrame || materials.metalDark;

  // -----------------------------------------------------------------
  // 1. FRONT ENTRANCE FULL-GLASS DOORS (z = 3.75, x: [-1.6, 1.6])
  // -----------------------------------------------------------------
  const frontFrame = new THREE.Group();
  frontFrame.position.set(0, 0, 3.75);
  scene.add(frontFrame);

  // Modern architectural portal frame
  addBox(frontFrame, [-1.65, 1.8, 0], [0.18, 3.6, 0.22], frameMat);
  addBox(frontFrame, [1.65, 1.8, 0], [0.18, 3.6, 0.22], frameMat);
  addBox(frontFrame, [0, 3.65, 0], [3.48, 0.18, 0.24], frameMat);

  const doorLeft = new THREE.Group();
  const doorRight = new THREE.Group();
  doorLeft.position.set(-1.54, 0, 0.04);
  doorRight.position.set(1.54, 0, 0.04);
  frontFrame.add(doorLeft, doorRight);

  // Left leaf (Full glass with sleek aluminum frame & brass handle)
  addBox(doorLeft, [0.77, 3.25, 0], [1.52, 0.10, 0.08], frameMat);
  addBox(doorLeft, [0.77, 0.08, 0], [1.52, 0.16, 0.08], frameMat);
  addBox(doorLeft, [0.05, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorLeft, [1.49, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorLeft, [0.77, 1.65, 0], [1.38, 3.10, 0.04], materials.glass);
  addCylinder(doorLeft, [1.38, 1.55, 0.06], [0.022, 0.85, 0.022], materials.brass);
  addCylinder(doorLeft, [1.38, 1.55, -0.06], [0.022, 0.85, 0.022], materials.brass);

  // Right leaf (Full glass with sleek aluminum frame & brass handle)
  addBox(doorRight, [-0.77, 3.25, 0], [1.52, 0.10, 0.08], frameMat);
  addBox(doorRight, [-0.77, 0.08, 0], [1.52, 0.16, 0.08], frameMat);
  addBox(doorRight, [-0.05, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorRight, [-1.49, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorRight, [-0.77, 1.65, 0], [1.38, 3.10, 0.04], materials.glass);
  addCylinder(doorRight, [-1.38, 1.55, 0.06], [0.022, 0.85, 0.022], materials.brass);
  addCylinder(doorRight, [-1.38, 1.55, -0.06], [0.022, 0.85, 0.022], materials.brass);

  if (world && RAPIER && doorColliders) {
    for (const x of [-0.77, 0.77]) {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 1.65, 3.8));
      const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(0.77, 1.65, 0.1), body);
      doorColliders.push(collider);
    }
  }

  const OPEN_ANGLE = 1.6;
  const DOOR_DURATION = 0.8;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
    if (state === 'closed' && doorColliders) {
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

  const toggle = (onComplete) => {
    if (state === 'opening' || state === 'closing') return false;
    const opening = state === 'closed';
    from = currentAngle();
    to = opening ? OPEN_ANGLE : 0;
    clock = 0;
    state = opening ? 'opening' : 'closing';
    pendingCallback = onComplete || null;
    if (opening && doorColliders) {
      for (const collider of doorColliders) collider.setEnabled(false);
    }
    return true;
  };

  const settle = () => {
    if (state === 'opening' || state === 'closing') finish();
  };

  const frontControls = {
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
    title: 'Front entrance glass doors',
    position: new THREE.Vector3(0, 0.7, 3.8),
    radius: 3.2,
    controls: frontControls,
    action: () => {
      const manager = window.__worldInteractions;
      if (manager) {
        return manager.toggleDoor(frontControls, window.__playerCameraState ? window.__playerCameraState() : {});
      }
      return toggle();
    },
    getLabel: () => {
      if (state === 'opening') return 'Opening entrance doors...';
      if (state === 'closing') return 'Closing entrance doors...';
      return state === 'open' ? 'Close entrance doors' : 'Open entrance doors';
    },
  });

  // -----------------------------------------------------------------
  // 2. REAR TERRACE FULL-GLASS SLIDING DOORS (z = -8.2, x: [-2.4, 2.4])
  // -----------------------------------------------------------------
  const rearGroup = new THREE.Group();
  rearGroup.position.set(0, 0, -8.2);
  scene.add(rearGroup);

  // Modern perimeter frame and tracks
  addBox(rearGroup, [-2.42, 2.18, 0], [0.10, 4.36, 0.20], frameMat);
  addBox(rearGroup, [2.42, 2.18, 0], [0.10, 4.36, 0.20], frameMat);
  addBox(rearGroup, [0, 4.32, 0], [4.94, 0.10, 0.22], frameMat);
  addBox(rearGroup, [0, 0.04, 0], [4.94, 0.08, 0.22], frameMat);

  // Left & Right sliding door leaves (slight z-offset so they bypass smoothly)
  const rearDoorLeft = new THREE.Group();
  const rearDoorRight = new THREE.Group();
  rearDoorLeft.position.set(-1.2, 0, -0.02);
  rearDoorRight.position.set(1.2, 0, 0.02);
  rearGroup.add(rearDoorLeft, rearDoorRight);

  // Left sliding leaf (width 2.40m, height 4.22m, full glass)
  addBox(rearDoorLeft, [0, 2.16, 0], [2.28, 4.12, 0.05], materials.glass);
  addBox(rearDoorLeft, [0, 4.24, 0], [2.38, 0.08, 0.08], frameMat);
  addBox(rearDoorLeft, [0, 0.06, 0], [2.38, 0.12, 0.08], frameMat);
  addBox(rearDoorLeft, [-1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addBox(rearDoorLeft, [1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addCylinder(rearDoorLeft, [0.95, 1.8, 0.055], [0.024, 0.95, 0.024], materials.brass);
  addCylinder(rearDoorLeft, [0.95, 1.8, -0.055], [0.024, 0.95, 0.024], materials.brass);

  // Right sliding leaf (width 2.40m, height 4.22m, full glass)
  addBox(rearDoorRight, [0, 2.16, 0], [2.28, 4.12, 0.05], materials.glass);
  addBox(rearDoorRight, [0, 4.24, 0], [2.38, 0.08, 0.08], frameMat);
  addBox(rearDoorRight, [0, 0.06, 0], [2.38, 0.12, 0.08], frameMat);
  addBox(rearDoorRight, [-1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addBox(rearDoorRight, [1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addCylinder(rearDoorRight, [-0.95, 1.8, 0.055], [0.024, 0.95, 0.024], materials.brass);
  addCylinder(rearDoorRight, [-0.95, 1.8, -0.055], [0.024, 0.95, 0.024], materials.brass);

  // Dynamic Rapier static colliders for rear sliding doors (active when closed)
  const rearColliders = [];
  if (world && RAPIER) {
    for (const x of [-1.2, 1.2]) {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 2.18, -8.2));
      const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(1.2, 2.18, 0.12), body);
      rearColliders.push(collider);
    }
  }

  let rearState = 'closed';
  let rearFrom = 0;
  let rearTo = 0;
  let rearClock = 0;
  let rearPendingCallback = null;
  const SLIDE_TRAVEL = 2.2;

  const setRearSlide = (t) => {
    rearDoorLeft.position.x = -1.2 - SLIDE_TRAVEL * t;
    rearDoorRight.position.x = 1.2 + SLIDE_TRAVEL * t;
  };

  const finishRear = () => {
    setRearSlide(rearTo);
    rearState = rearTo > 0 ? 'open' : 'closed';
    if (rearState === 'closed') {
      for (const col of rearColliders) col.setEnabled(true);
    }
    const cb = rearPendingCallback;
    rearPendingCallback = null;
    if (cb) cb(rearState === 'open');
  };

  const updateRear = (dt) => {
    if (rearState !== 'opening' && rearState !== 'closing') return;
    rearClock += dt;
    const t = Math.min(1, rearClock / DOOR_DURATION);
    const eased = easeInOut(t);
    setRearSlide(rearFrom + (rearTo - rearFrom) * eased);
    if (t >= 1) finishRear();
  };

  const toggleRear = (onComplete) => {
    if (rearState === 'opening' || rearState === 'closing') return false;
    const opening = rearState === 'closed';
    rearFrom = rearState === 'closed' ? 0 : 1;
    rearTo = opening ? 1 : 0;
    rearClock = 0;
    rearState = opening ? 'opening' : 'closing';
    rearPendingCallback = onComplete || null;
    if (opening) {
      for (const col of rearColliders) col.setEnabled(false);
    }
    return true;
  };

  const settleRear = () => {
    if (rearState === 'opening' || rearState === 'closing') finishRear();
  };

  const rearControls = {
    toggle: toggleRear,
    settle: settleRear,
    update: updateRear,
    isOpen: () => rearState === 'open',
    isBusy: () => rearState === 'opening' || rearState === 'closing',
    getState: () => rearState,
    panels: { rearDoorLeft, rearDoorRight },
  };

  interactionPoints.push({
    id: 'door_rear',
    type: 'door',
    title: 'Terrace glass doors',
    position: new THREE.Vector3(0, 0.7, -8.2),
    radius: 3.5,
    controls: rearControls,
    action: () => toggleRear(),
    getLabel: () => {
      if (rearState === 'opening') return 'Opening terrace glass doors...';
      if (rearState === 'closing') return 'Closing terrace glass doors...';
      return rearState === 'open' ? 'Close terrace glass doors' : 'Open terrace glass doors';
    },
  });

  return {
    front: frontControls,
    rear: rearControls,
    toggle: (cb) => frontControls.toggle(cb),
    settle: () => { frontControls.settle(); rearControls.settle(); },
    update: (dt) => { frontControls.update(dt); rearControls.update(dt); },
    isOpen: () => frontControls.isOpen() || rearControls.isOpen(),
    isBusy: () => frontControls.isBusy() || rearControls.isBusy(),
    getState: () => frontControls.getState(),
    panels: {
      doorLeft,
      doorRight,
      rearDoorLeft,
      rearDoorRight,
    },
    hingeWorld: frontControls.hingeWorld,
  };
}
