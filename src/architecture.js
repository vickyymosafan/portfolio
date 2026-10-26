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

  // French glass sliding doors to rear garden terrace (x: [-3.0, 3.0], z = -8.2)
  addBox(building, [-2.25, 2.4, -8.2], [1.5, 4.6, 0.08], materials.glass);
  addColliderBox([-2.25, 2.4, -8.2], [0.75, 2.4, 0.08]);
  addBox(building, [2.25, 2.4, -8.2], [1.5, 4.6, 0.08], materials.glass);
  addColliderBox([2.25, 2.4, -8.2], [0.75, 2.4, 0.08]);
  addBox(building, [0, 4.4, -8.2], [3.0, 0.6, 0.18], materials.woodDark);

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
  // 4. INTERIOR PARTITION WALLS & ARCHWAYS (Ground Floor, y: [0, 5.2])
  // Dividing Project Gallery, Living Room, Home Office, Garasi
  // =========================================================================

  // Partition Gallery / Living Room at x = -5.5 (z: [3.8, -8.2])
  // Front section
  const partWestG1 = addBox(building, [-5.5, 2.6, 2.2], [0.45, 5.2, 3.2], materials.wall, { shadow: true });
  cameraBlockers.push(partWestG1);
  addColliderBox([-5.5, 2.6, 2.2], [0.225, 2.6, 1.6]);
  // Grand arched walkthrough portal (4.0m wide, z: [-1.4, -5.4])
  archBatch.addBox([-5.5, 4.5, -3.4], [0.48, 1.4, 4.0], materials.wall);
  archBatch.addBox([-5.5, 3.75, -3.4], [0.52, 0.16, 4.0], materials.woodWarm);
  // Rear section
  const partWestG2 = addBox(building, [-5.5, 2.6, -6.8], [0.45, 5.2, 2.8], materials.wall, { shadow: true });
  cameraBlockers.push(partWestG2);
  addColliderBox([-5.5, 2.6, -6.8], [0.225, 2.6, 1.4]);

  // Partition Living Room / Home Office at x = 5.5 (z: [3.8, -8.2])
  // Front section
  const partEastG1 = addBox(building, [5.5, 2.6, 2.2], [0.45, 5.2, 3.2], materials.wall, { shadow: true });
  cameraBlockers.push(partEastG1);
  addColliderBox([5.5, 2.6, 2.2], [0.225, 2.6, 1.6]);
  // Grand arched walkthrough portal (4.0m wide, z: [-1.4, -5.4])
  archBatch.addBox([5.5, 4.5, -3.4], [0.48, 1.4, 4.0], materials.wall);
  archBatch.addBox([5.5, 3.75, -3.4], [0.52, 0.16, 4.0], materials.woodWarm);
  // Rear section
  const partEastG2 = addBox(building, [5.5, 2.6, -6.8], [0.45, 5.2, 2.8], materials.wall, { shadow: true });
  cameraBlockers.push(partEastG2);
  addColliderBox([5.5, 2.6, -6.8], [0.225, 2.6, 1.4]);

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

  // Master Bathroom Floor Slabs & Central Stairwell Atrium (Bay 2: x: [-5.5, 5.5], z: [3.8, -8.2])
  // West bathroom floor slab (under spa bathtub & shower, x: [-5.5, -1.9], width 3.6m)
  addBox(building, [-3.7, 5.06, -2.2], [3.6, 0.28, 12.0], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([-3.7, 5.06, -2.2], [1.8, 0.14, 6.0]);

  // East bathroom floor slab (under vanity counter, x: [1.9, 5.5], width 3.6m)
  addBox(building, [3.7, 5.06, -2.2], [3.6, 0.28, 12.0], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([3.7, 5.06, -2.2], [1.8, 0.14, 6.0]);

  // Rear upper landing floor slab (connecting stairs to bathroom, bedroom, & library, z: [-4.6, -8.2], depth 3.6m)
  addBox(building, [0.0, 5.06, -6.4], [3.8, 0.28, 3.6], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([0.0, 5.06, -6.4], [1.9, 0.14, 1.8]);

  // Modern safety glass balustrades framing the open stairwell atrium on Lantai 2 (x = -1.85 and x = 1.85, z: [-4.6, 3.8])
  for (const bx of [-1.85, 1.85]) {
    addBox(building, [bx, 5.65, -0.4], [0.06, 0.9, 8.4], materials.glass);
    archBatch.addBox([bx, 6.12, -0.4], [0.1, 0.08, 8.4], materials.woodWarm);
    addColliderBox([bx, 5.65, -0.4], [0.06, 0.45, 4.2]);
  }

  // Library Nook Floor Slab (Bay 3: x: [5.5, 16.0], z: [3.8, -8.2])
  addBox(building, [10.75, 5.06, -2.2], [10.5, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([10.75, 5.06, -2.2], [5.25, 0.14, 6.0]);

  // Creative Studio Floor Slab (Bay 4: x: [16.0, 26.0], z: [3.8, -8.2])
  addBox(building, [21.0, 5.06, -2.2], [10.0, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([21.0, 5.06, -2.2], [5.0, 0.14, 6.0]);

  // Continuous Architectural Floor Fascia Beam along the front cutaway edge (z = 3.8, y = 5.06)
  archBatch.addBox([4.75, 5.06, 3.85], [42.8, 0.32, 0.35], materials.woodWarm);
  archBatch.addBox([4.75, 5.22, 3.87], [43.0, 0.08, 0.38], materials.trim);

  // Modern low architectural safety glass balustrades along front cutaway edge of Lantai 2 (y: [5.2, 5.9])
  // Master Bedroom front balustrade
  addBox(building, [-11.0, 5.55, 3.8], [10.2, 0.7, 0.06], materials.glass);
  archBatch.addBox([-11.0, 5.92, 3.8], [10.2, 0.06, 0.1], materials.woodWarm);
  addColliderBox([-11.0, 5.55, 3.8], [5.1, 0.35, 0.06]);

  // Bathroom front balustrades on West & East sides
  addBox(building, [-3.7, 5.55, 3.8], [3.4, 0.7, 0.06], materials.glass);
  archBatch.addBox([-3.7, 5.92, 3.8], [3.4, 0.06, 0.1], materials.woodWarm);
  addColliderBox([-3.7, 5.55, 3.8], [1.7, 0.35, 0.06]);

  addBox(building, [3.7, 5.55, 3.8], [3.4, 0.7, 0.06], materials.glass);
  archBatch.addBox([3.7, 5.92, 3.8], [3.4, 0.06, 0.1], materials.woodWarm);
  addColliderBox([3.7, 5.55, 3.8], [1.7, 0.35, 0.06]);

  // Library Nook front balustrade
  addBox(building, [10.75, 5.55, 3.8], [9.7, 0.7, 0.06], materials.glass);
  archBatch.addBox([10.75, 5.92, 3.8], [9.7, 0.06, 0.1], materials.woodWarm);
  addColliderBox([10.75, 5.55, 3.8], [4.85, 0.35, 0.06]);

  // Creative Studio front balustrade
  addBox(building, [21.0, 5.55, 3.8], [9.2, 0.7, 0.06], materials.glass);
  archBatch.addBox([21.0, 5.92, 3.8], [9.2, 0.06, 0.1], materials.woodWarm);
  addColliderBox([21.0, 5.55, 3.8], [4.6, 0.35, 0.06]);

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
  // Front section
  const partLibS = addBox(building, [5.5, 7.8, 1.8], [0.45, 5.2, 4.0], materials.wall, { shadow: true });
  cameraBlockers.push(partLibS);
  addColliderBox([5.5, 7.8, 1.8], [0.225, 2.6, 2.0]);
  // Arched walkthrough portal connecting Library to Bathroom / Mezzanine (z: [-1.2, -4.2])
  archBatch.addBox([5.5, 9.6, -2.7], [0.48, 1.6, 3.0], materials.wall);
  archBatch.addBox([5.5, 8.75, -2.7], [0.52, 0.16, 3.0], materials.woodWarm);
  // Rear section
  const partLibN = addBox(building, [5.5, 7.8, -6.2], [0.45, 5.2, 4.0], materials.wall, { shadow: true });
  cameraBlockers.push(partLibN);
  addColliderBox([5.5, 7.8, -6.2], [0.225, 2.6, 2.0]);

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
  // 7. GRAND WALKABLE CENTRAL STAIRCASE (Ground Floor to Lantai 2)
  // Origin: x: 0, starts at z = 1.2 (y = 0.0), ascends smoothly northward to z = -4.6 (y = 5.2)
  // Run = 5.8m, Rise = 5.2m. 26 steps (rise: 20cm, depth: 22.3cm).
  // Includes smooth inclined ramp collider for effortless 100% snag-free climbing.
  // =========================================================================
  const numSteps = 26;
  const stairWidth = 3.4;
  const startZ = 1.2;
  const endZ = -4.6;
  const startY = 0.0;
  const endY = 5.2;

  for (let i = 0; i < numSteps; i += 1) {
    const t = (i + 0.5) / numSteps;
    const curZ = startZ + (endZ - startZ) * t;
    const curY = startY + (endY - startY) * t;
    const stepDepth = Math.abs(endZ - startZ) / numSteps + 0.06;
    const stepHeight = (endY - startY) / numSteps;

    // Wooden tread
    archBatch.addBox([0, curY, curZ], [stairWidth, 0.08, stepDepth], materials.woodWarm);
    // Brass edge riser trim
    archBatch.addBox([0, curY + 0.03, curZ + stepDepth * 0.45], [stairWidth, 0.03, 0.03], materials.brass);
    // Solid riser support below
    archBatch.addBox([0, curY - stepHeight * 0.5, curZ], [stairWidth - 0.1, stepHeight, stepDepth - 0.02], materials.woodDark);

    // Multi-tier low-height colliders ensuring perfect Rapier autostep (<0.20m step height)
    addColliderBox([0, curY - 0.04, curZ], [stairWidth * 0.48, stepHeight * 0.5, stepDepth * 0.5]);
  }

  // Seamless ramp collider under treads for butter-smooth slope gliding in Rapier
  if (world && RAPIER && staticBodies) {
    const stairLen = Math.hypot(endZ - startZ, endY - startY);
    const stairAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));
    const rampBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(0, (startY + endY) * 0.5 - 0.06, (startZ + endZ) * 0.5)
        .setRotation({ x: Math.sin(stairAngle * 0.5), y: 0, z: 0, w: Math.cos(stairAngle * 0.5) })
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(stairWidth * 0.48, 0.08, stairLen * 0.5), rampBody);
    staticBodies.push(rampBody);
  }

  // Polished mahogany stair stringers and balustrades with handrails
  for (const side of [-1, 1]) {
    const sx = side * (stairWidth * 0.5);
    const midZ = (startZ + endZ) * 0.5;
    const midY = (startY + endY) * 0.5 + 1.0;
    const stairLen = Math.hypot(endZ - startZ, endY - startY);
    const stairAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));

    archBatch.addBox([sx, midY, midZ], [0.12, 0.12, stairLen], materials.woodDark, {
      rotation: [stairAngle, 0, 0],
    });

    for (let i = 0; i < numSteps; i += 2) {
      const t = (i + 0.5) / numSteps;
      const bz = startZ + (endZ - startZ) * t;
      const by = startY + (endY - startY) * t + 0.5;
      archBatch.addCylinder([sx, by, bz], 0.03, 0.03, 0.95, materials.trim, { segments: 8 });
    }
    addColliderBox([sx, midY - 0.35, midZ], [0.1, 0.75, stairLen * 0.5]);
  }

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
  const frame = new THREE.Group();
  frame.position.set(0, 0, 3.75);
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
    position: new THREE.Vector3(0, 0.7, 3.8),
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
