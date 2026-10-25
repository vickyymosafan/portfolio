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

  // =========================================================================
  // 1. FOUNDATION & GROUND FLOOR SLABS
  // Footprint: x: [-16.5, 26.0] (42.5m wide), z: [4.2, -18.0] (22.2m deep)
  // Center: x ≈ 4.75, z ≈ -6.9
  // =========================================================================

  // Main living / gallery / office hardwood floor (x: [-16.5, 16.0], z: [4.2, -18.0])
  addBox(building, [-0.25, -0.12, -6.9], [32.5, 0.24, 22.2], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([-0.25, -0.18, -6.9], [16.25, 0.18, 11.1]);

  // Luxury private garage polished dark epoxy floor (x: [16.0, 26.0], z: [4.2, -18.0])
  addBox(building, [21.0, -0.12, -6.9], [10.0, 0.24, 22.2], materials.epoxyFloor, { shadow: false, receive: true });
  addColliderBox([21.0, -0.18, -6.9], [5.0, 0.18, 11.1]);

  // Exterior stone plinth skirting foundation around entire 42.5m perimeter
  archBatch.addBox([4.75, 0.16, 4.25], [42.8, 0.38, 0.4], materials.foundation);
  archBatch.addBox([-16.6, 0.16, -6.9], [0.4, 0.38, 22.6], materials.foundation);
  archBatch.addBox([26.1, 0.16, -6.9], [0.4, 0.38, 22.6], materials.foundation);
  archBatch.addBox([4.75, 0.16, -18.05], [42.8, 0.38, 0.4], materials.foundation);

  // =========================================================================
  // 2. GRAND ENTRANCE STEPS & FRONT PORCH
  // Porch platform at z = [4.2, 7.8], x = [-6.5, 6.5]
  // =========================================================================
  archBatch.addBox([0, 0.08, 6.0], [13.0, 0.22, 3.6], materials.woodLight);
  addColliderBox([0, -0.03, 6.0], [6.5, 0.11, 1.8]);

  // Grand descending stone stairs with wide treads leading to front roundabout
  for (let step = 0; step < 4; step += 1) {
    const sy = -0.04 - step * 0.08;
    const sz = 7.8 + step * 0.55;
    const sw = 9.2 - step * 0.4;
    archBatch.addBox([0, sy, sz], [sw, 0.16, 0.6], materials.stone);
    addColliderBox([0, sy - 0.06, sz], [sw * 0.5, 0.08, 0.3]);
  }

  // Double-height front monumental columns (height 10.2m)
  const frontColX = [-5.5, -2.2, 2.2, 5.5];
  for (const cx of frontColX) {
    // Pedestal base
    archBatch.addBox([cx, 0.45, 7.6], [0.85, 0.7, 0.85], materials.stone);
    archBatch.addCylinder([cx, 0.9, 7.6], 0.38, 0.42, 0.2, materials.woodWarm, { segments: 16 });
    // Lower shaft
    archBatch.addCylinder([cx, 3.0, 7.6], 0.32, 0.36, 4.0, materials.column, { segments: 20 });
    // Mid capital / floor ring at second floor level
    archBatch.addBox([cx, 5.2, 7.6], [0.8, 0.3, 0.8], materials.woodWarm);
    // Upper shaft
    archBatch.addCylinder([cx, 7.6, 7.6], 0.28, 0.32, 4.5, materials.column, { segments: 20 });
    // Upper ornate capital
    archBatch.addBox([cx, 10.0, 7.6], [0.95, 0.35, 0.95], materials.stone);
    addColliderBox([cx, 5.0, 7.6], [0.45, 5.0, 0.45]);
  }

  // Porch balustrades & railings on ground floor
  for (const [x1, x2] of [[-5.5, -2.2], [2.2, 5.5]]) {
    const mx = (x1 + x2) * 0.5;
    const len = Math.abs(x2 - x1) - 0.8;
    archBatch.addBox([mx, 1.05, 7.6], [len, 0.08, 0.14], materials.woodLight);
    archBatch.addBox([mx, 0.45, 7.6], [len, 0.08, 0.14], materials.woodLight);
    for (let bx = x1 + 0.45; bx <= x2 - 0.45; bx += 0.35) {
      archBatch.addCylinder([bx, 0.75, 7.6], 0.04, 0.04, 0.52, materials.trim, { segments: 8 });
    }
    addColliderBox([mx, 0.7, 7.6], [len * 0.5, 0.65, 0.12]);
  }

  // Hanging porch flower planters
  for (const hx of [-3.85, 3.85]) {
    archBatch.addCylinder([hx, 4.8, 7.6], 0.015, 0.015, 0.6, materials.metalDark);
    archBatch.addSphere([hx, 4.45, 7.6], [0.36, 0.26, 0.36], materials.terracotta);
    archBatch.addSphere([hx, 4.6, 7.6], [0.45, 0.3, 0.45], materials.foliageBright);
    archBatch.addSphere([hx - 0.15, 4.65, 7.65], [0.12, 0.12, 0.12], materials.coral);
    archBatch.addSphere([hx + 0.15, 4.62, 7.55], [0.12, 0.12, 0.12], materials.yellow);
  }

  // =========================================================================
  // 3. EXTERIOR WALLS (Two-story structure, 10.4m height, with cameraBlockers)
  // =========================================================================
  // Left West Wall (x = -16.5, z: [4.2, -18.0])
  const wallWest = addBox(building, [-16.5, 5.2, -6.9], [0.65, 10.4, 22.2], materials.wall, { shadow: true });
  cameraBlockers.push(wallWest);
  addColliderBox([-16.5, 5.2, -6.9], [0.325, 5.2, 11.1]);
  archBatch.addBox([-16.45, 0.65, -6.9], [0.68, 1.1, 22.2], materials.wainscot);
  archBatch.addBox([-16.45, 5.85, -6.9], [0.68, 0.5, 22.2], materials.trim);

  // Right East Wall (x = 26.0, z: [4.2, -18.0])
  const wallEast = addBox(building, [26.0, 5.2, -6.9], [0.65, 10.4, 22.2], materials.wall, { shadow: true });
  cameraBlockers.push(wallEast);
  addColliderBox([26.0, 5.2, -6.9], [0.325, 5.2, 11.1]);
  archBatch.addBox([25.95, 0.65, -6.9], [0.68, 1.1, 22.2], materials.wainscot);
  archBatch.addBox([25.95, 5.85, -6.9], [0.68, 0.5, 22.2], materials.trim);

  // Front Facades (z = 4.2)
  // Project Gallery front wall (x: [-16.5, -5.5], width 11.0m)
  const frontGallery = addBox(building, [-11.0, 5.2, 4.2], [11.0, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(frontGallery);
  addColliderBox([-11.0, 5.2, 4.2], [5.5, 5.2, 0.325]);
  archBatch.addBox([-11.0, 0.65, 4.25], [11.0, 1.1, 0.68], materials.wainscot);

  // Home Office front wall (x: [5.5, 16.0], width 10.5m)
  const frontOffice = addBox(building, [10.75, 5.2, 4.2], [10.5, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(frontOffice);
  addColliderBox([10.75, 5.2, 4.2], [5.25, 5.2, 0.325]);
  archBatch.addBox([10.75, 0.65, 4.25], [10.5, 1.1, 0.68], materials.wainscot);

  // Central Grand Entrance Header (z = 4.2, x: [-5.5, 5.5], width 11.0m)
  // Entrance opening is 4.0m wide (x: [-2.0, 2.0]), door height 3.6m
  const frontHeader = addBox(building, [0, 8.0, 4.2], [11.0, 4.8, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(frontHeader);
  addColliderBox([0, 8.0, 4.2], [5.5, 2.4, 0.325]);

  const frontDoorLintel = addBox(building, [0, 4.4, 4.2], [4.0, 1.6, 0.65], materials.coral, { shadow: true });
  cameraBlockers.push(frontDoorLintel);
  addColliderBox([0, 4.4, 4.2], [2.0, 0.8, 0.325]);

  // Flanking pillars at front entrance doorway (x = ±2.0)
  for (const fx of [-2.0, 2.0]) {
    const p = addBox(building, [fx, 2.2, 4.2], [0.55, 4.4, 0.65], materials.wall);
    cameraBlockers.push(p);
    addColliderBox([fx, 2.2, 4.2], [0.275, 2.2, 0.325]);
  }

  // Garage Front Facade (x: [16.0, 26.0], z = 4.2, width 10.0m)
  // Wide open garage door opening (7.6m wide from x = 17.2 to 24.8, height 3.8m)
  const garageHeader = addBox(building, [21.0, 7.3, 4.2], [10.0, 6.2, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(garageHeader);
  addColliderBox([21.0, 7.3, 4.2], [5.0, 3.1, 0.325]);

  const garagePostL = addBox(building, [16.6, 2.0, 4.2], [1.2, 4.0, 0.65], materials.woodDark);
  cameraBlockers.push(garagePostL);
  addColliderBox([16.6, 2.0, 4.2], [0.6, 2.0, 0.325]);

  const garagePostR = addBox(building, [25.4, 2.0, 4.2], [1.2, 4.0, 0.65], materials.woodDark);
  cameraBlockers.push(garagePostR);
  addColliderBox([25.4, 2.0, 4.2], [0.6, 2.0, 0.325]);

  // Roll-up garage door in recessed track (open at upper position)
  archBatch.addBox([21.0, 3.9, 4.1], [7.8, 0.45, 0.25], materials.metalDark);
  archBatch.addBox([21.0, 4.05, 4.1], [7.6, 0.15, 0.35], materials.brass);

  // Rear Facades (z = -18.0)
  const rearWallLeft = addBox(building, [-11.0, 5.2, -18.0], [11.0, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearWallLeft);
  addColliderBox([-11.0, 5.2, -18.0], [5.5, 5.2, 0.325]);

  const rearWallCenter = addBox(building, [0, 7.6, -18.0], [11.0, 5.6, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearWallCenter);
  addColliderBox([0, 7.6, -18.0], [5.5, 2.8, 0.325]);

  const rearWallRight = addBox(building, [10.75, 5.2, -18.0], [10.5, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearWallRight);
  addColliderBox([10.75, 5.2, -18.0], [5.25, 5.2, 0.325]);

  const rearGarage = addBox(building, [21.0, 5.2, -18.0], [10.0, 10.4, 0.65], materials.wall, { shadow: true });
  cameraBlockers.push(rearGarage);
  addColliderBox([21.0, 5.2, -18.0], [5.0, 5.2, 0.325]);

  // French glass sliding doors to rear garden terrace (x: [-3.0, 3.0], z = -18.0)
  // Left fixed side pane (x = -2.25, width 1.5m)
  addBox(building, [-2.25, 2.4, -18.0], [1.5, 4.6, 0.08], materials.glass);
  addColliderBox([-2.25, 2.4, -18.0], [0.75, 2.4, 0.08]);
  // Right fixed side pane (x = 2.25, width 1.5m)
  addBox(building, [2.25, 2.4, -18.0], [1.5, 4.6, 0.08], materials.glass);
  addColliderBox([2.25, 2.4, -18.0], [0.75, 2.4, 0.08]);
  // Top transom lintel above open doorway
  addBox(building, [0, 4.4, -18.0], [3.0, 0.6, 0.18], materials.woodDark);
  // Center (x: [-1.5, 1.5]) is completely clear and walkable out to the terrace!

  // Architectural Raised Garden Veranda & Terrace (z = [-18.0, -26.5], x = [-10.0, 10.0])
  addBox(building, [0, 0.04, -22.25], [20.0, 0.24, 8.5], materials.stone, { shadow: true, receive: true });
  addColliderBox([0, 0.0, -22.25], [10.0, 0.16, 4.25]);
  // Terracotta terrace tile finish
  addBox(building, [0, 0.14, -22.25], [19.6, 0.04, 8.1], materials.terraceTiles, { shadow: false, receive: true });

  // Wide descending stone steps leading down to rear lawn
  for (let s = 0; s < 3; s += 1) {
    const stepZ = -26.5 - s * 0.55;
    const stepY = 0.06 - s * 0.07;
    const stepW = 12.0 - s * 0.4;
    archBatch.addBox([0, stepY, stepZ], [stepW, 0.14, 0.55], materials.stone);
    addColliderBox([0, stepY - 0.05, stepZ], [stepW * 0.5, 0.07, 0.275]);
  }

  // Modern perimeter glass & teak balustrade around terrace
  for (const [bx, bz, bw, bd] of [
    [-9.7, -22.25, 0.14, 8.1],
    [9.7, -22.25, 0.14, 8.1],
    [-6.5, -26.45, 6.4, 0.14],
    [6.5, -26.45, 6.4, 0.14],
  ]) {
    addBox(building, [bx, 0.65, bz], [bw, 0.95, bd], materials.glass);
    archBatch.addBox([bx, 1.15, bz], [bw + 0.06, 0.08, bd + 0.06], materials.woodWarm);
    addColliderBox([bx, 0.65, bz], [bw * 0.5 + 0.05, 0.5, bd * 0.5 + 0.05]);
  }

  // =========================================================================
  // 4. INTERIOR PARTITION WALLS & GRAND ARCADES
  // Separating wings on Ground Floor & Upper Floor
  // =========================================================================
  // Ground Floor: Gallery/Living room partition at x = -5.5 (z: [4.2, -7.5])
  const partWestG1 = addBox(building, [-5.5, 2.6, 1.8], [0.45, 5.2, 4.4], materials.wall, { shadow: true });
  cameraBlockers.push(partWestG1);
  addColliderBox([-5.5, 2.6, 1.8], [0.225, 2.6, 2.2]);

  // Grand arched opening (3.4m wide) between Living Room and Gallery (z: [-0.4, -3.8])
  archBatch.addBox([-5.5, 4.5, -2.1], [0.48, 1.4, 3.4], materials.wall);
  archBatch.addBox([-5.5, 3.75, -2.1], [0.52, 0.16, 3.4], materials.woodWarm);

  const partWestG2 = addBox(building, [-5.5, 2.6, -5.8], [0.45, 5.2, 3.8], materials.wall, { shadow: true });
  cameraBlockers.push(partWestG2);
  addColliderBox([-5.5, 2.6, -5.8], [0.225, 2.6, 1.9]);

  // Ground Floor: Living room/Office partition at x = 5.5 (z: [4.2, -7.5])
  const partEastG1 = addBox(building, [5.5, 2.6, 1.8], [0.45, 5.2, 4.4], materials.wall, { shadow: true });
  cameraBlockers.push(partEastG1);
  addColliderBox([5.5, 2.6, 1.8], [0.225, 2.6, 2.2]);

  // Grand arched opening (3.4m wide) between Living Room and Home Office (z: [-0.4, -3.8])
  archBatch.addBox([5.5, 4.5, -2.1], [0.48, 1.4, 3.4], materials.wall);
  archBatch.addBox([5.5, 3.75, -2.1], [0.52, 0.16, 3.4], materials.woodWarm);

  const partEastG2 = addBox(building, [5.5, 2.6, -5.8], [0.45, 5.2, 3.8], materials.wall, { shadow: true });
  cameraBlockers.push(partEastG2);
  addColliderBox([5.5, 2.6, -5.8], [0.225, 2.6, 1.9]);

  // Ground Floor: Office/Garage partition at x = 16.0 (z: [4.2, -7.5])
  const partGarage = addBox(building, [16.0, 2.6, -1.65], [0.45, 5.2, 11.7], materials.wall, { shadow: true });
  cameraBlockers.push(partGarage);
  addColliderBox([16.0, 2.6, -1.65], [0.225, 2.6, 5.85]);

  // Rear Ground cross partition wall at z = -7.5 (separating front bays from rear promenade)
  for (const [x1, x2] of [[-16.5, -5.5], [5.5, 26.0]]) {
    const cx = (x1 + x2) * 0.5;
    const w = Math.abs(x2 - x1);
    const p = addBox(building, [cx, 2.6, -7.5], [w, 5.2, 0.45], materials.wall, { shadow: true });
    cameraBlockers.push(p);
    addColliderBox([cx, 2.6, -7.5], [w * 0.5, 2.6, 0.225]);
  }

  // =========================================================================
  // 5. SECOND FLOOR FLOOR-SLABS & MEZZANINE (Elevation y = 5.2m)
  // Double-height living room atrium opening: x: [-4.5, 4.5], z: [0.0, 4.2]
  // Stairwell opening: x: [-1.8, 1.8], z: [-2.2, -7.5]
  // ALL OTHER AREAS HAVE 100% SOLID CONTINUOUS STRUCTURAL FLOORS (NO GAPS/HOLES)
  // =========================================================================
  // Second floor thickness: 0.28m, top surface = 5.2, bottom surface = 4.92

  // Master Bedroom entire West Wing floor slab (x: [-16.5, -4.5], z: [4.2, -18.0])
  addBox(building, [-10.5, 5.06, -6.9], [12.0, 0.28, 22.2], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([-10.5, 5.06, -6.9], [6.0, 0.14, 11.1]);

  // Master Bedroom West Balcony (x: [-19.0, -16.5], z: [3.5, -6.5]) overlooking pool
  addBox(building, [-17.75, 5.06, -1.5], [2.5, 0.28, 10.0], materials.terraceTiles, { shadow: true, receive: true });
  addColliderBox([-17.75, 5.06, -1.5], [1.25, 0.14, 5.0]);
  // Balcony modern glass railing
  addBox(building, [-18.9, 5.75, -1.5], [0.08, 1.1, 10.0], materials.glass);
  archBatch.addBox([-18.9, 6.32, -1.5], [0.12, 0.08, 10.0], materials.woodWarm);
  addColliderBox([-18.9, 5.75, -1.5], [0.08, 0.55, 5.0]);
  addColliderBox([-17.75, 5.75, 3.4], [1.25, 0.55, 0.08]);
  addColliderBox([-17.75, 5.75, -6.4], [1.25, 0.55, 0.08]);

  // Library Nook entire East Wing floor slab (x: [4.5, 16.0], z: [4.2, -18.0])
  addBox(building, [10.25, 5.06, -6.9], [11.5, 0.28, 22.2], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([10.25, 5.06, -6.9], [5.75, 0.14, 11.1]);

  // Creative Studio Far East Wing floor slab (x: [16.0, 26.0], z: [4.2, -18.0])
  addBox(building, [21.0, 5.06, -6.9], [10.0, 0.28, 22.2], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([21.0, 5.06, -6.9], [5.0, 0.14, 11.1]);

  // Creative Studio East Balcony (x: [26.0, 28.5], z: [3.5, -6.5]) overlooking garden
  addBox(building, [27.25, 5.06, -1.5], [2.5, 0.28, 10.0], materials.terraceTiles, { shadow: true, receive: true });
  addColliderBox([27.25, 5.06, -1.5], [1.25, 0.14, 5.0]);
  // Balcony modern glass railing
  addBox(building, [28.4, 5.75, -1.5], [0.08, 1.1, 10.0], materials.glass);
  archBatch.addBox([28.4, 6.32, -1.5], [0.12, 0.08, 10.0], materials.woodWarm);
  addColliderBox([28.4, 5.75, -1.5], [0.08, 0.55, 5.0]);
  addColliderBox([27.25, 5.75, 3.4], [1.25, 0.55, 0.08]);
  addColliderBox([27.25, 5.75, -6.4], [1.25, 0.55, 0.08]);

  // Central Mezzanine landing & gallery walkway (x: [-4.5, 4.5], z: [-7.5, -10.0])
  addBox(building, [0, 5.06, -8.75], [9.0, 0.28, 2.5], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([0, 5.06, -8.75], [4.5, 0.14, 1.25]);

  // Master Bathroom Suite floor slab (x: [-4.5, 4.5], z: [-10.0, -18.0])
  addBox(building, [0, 5.06, -14.0], [9.0, 0.28, 8.0], materials.bathroomTile, { shadow: false, receive: true });
  addColliderBox([0, 5.06, -14.0], [4.5, 0.14, 4.0]);

  // Mezzanine safety glass & wood railings overlooking Living Room below
  archBatch.addBox([-3.15, 5.75, -7.5], [2.7, 1.1, 0.08], materials.glass);
  archBatch.addBox([-3.15, 6.32, -7.5], [2.7, 0.08, 0.12], materials.woodWarm);
  addColliderBox([-3.15, 5.75, -7.5], [1.35, 0.55, 0.08]);

  archBatch.addBox([3.15, 5.75, -7.5], [2.7, 1.1, 0.08], materials.glass);
  archBatch.addBox([3.15, 6.32, -7.5], [2.7, 0.08, 0.12], materials.woodWarm);
  addColliderBox([3.15, 5.75, -7.5], [1.35, 0.55, 0.08]);

  // Second Floor Interior Partitions (Height y: [5.2, 10.4])
  // 1. Master Bedroom / Mezzanine partition at x = -4.5
  // South wall section (z: [0.0, -7.0])
  const partMBS = addBox(building, [-4.5, 7.8, -3.5], [0.45, 5.2, 7.0], materials.wall, { shadow: true });
  cameraBlockers.push(partMBS);
  addColliderBox([-4.5, 7.8, -3.5], [0.225, 2.6, 3.5]);
  // Grand Arched Doorway into Master Bedroom (z: [-7.0, -9.6], 2.6m wide walkthrough)
  archBatch.addBox([-4.5, 9.45, -8.3], [0.48, 1.9, 2.6], materials.wall);
  archBatch.addBox([-4.5, 8.45, -8.3], [0.52, 0.16, 2.6], materials.woodWarm);
  // North wall section enclosing Bedroom & Bathroom (z: [-9.6, -18.0])
  const partMBN = addBox(building, [-4.5, 7.8, -13.8], [0.45, 5.2, 8.4], materials.wall, { shadow: true });
  cameraBlockers.push(partMBN);
  addColliderBox([-4.5, 7.8, -13.8], [0.225, 2.6, 4.2]);

  // 2. Library / Mezzanine partition at x = 4.5
  // South wall section (z: [0.0, -7.0])
  const partLibS = addBox(building, [4.5, 7.8, -3.5], [0.45, 5.2, 7.0], materials.wall, { shadow: true });
  cameraBlockers.push(partLibS);
  addColliderBox([4.5, 7.8, -3.5], [0.225, 2.6, 3.5]);
  // Grand Arched Doorway into Library Nook (z: [-7.0, -9.6], 2.6m wide walkthrough)
  archBatch.addBox([4.5, 9.45, -8.3], [0.48, 1.9, 2.6], materials.wall);
  archBatch.addBox([4.5, 8.45, -8.3], [0.52, 0.16, 2.6], materials.woodWarm);
  // North wall section enclosing Library & Bathroom (z: [-9.6, -18.0])
  const partLibN = addBox(building, [4.5, 7.8, -13.8], [0.45, 5.2, 8.4], materials.wall, { shadow: true });
  cameraBlockers.push(partLibN);
  addColliderBox([4.5, 7.8, -13.8], [0.225, 2.6, 4.2]);

  // 3. Master Bathroom Suite Front Wall at z = -10.0 (x: [-4.5, 4.5])
  const partBathL = addBox(building, [-2.9, 7.8, -10.0], [3.2, 5.2, 0.45], materials.wall, { shadow: true });
  cameraBlockers.push(partBathL);
  addColliderBox([-2.9, 7.8, -10.0], [1.6, 2.6, 0.225]);

  const partBathR = addBox(building, [2.9, 7.8, -10.0], [3.2, 5.2, 0.45], materials.wall, { shadow: true });
  cameraBlockers.push(partBathR);
  addColliderBox([2.9, 7.8, -10.0], [1.6, 2.6, 0.225]);
  // Arched Bathroom doorway lintel & trim (2.6m wide walkthrough in center)
  archBatch.addBox([0, 9.45, -10.0], [2.6, 1.9, 0.48], materials.wall);
  archBatch.addBox([0, 8.45, -10.0], [2.6, 0.16, 0.52], materials.woodWarm);

  // 4. Library / Creative Studio Connecting Wall at x = 16.0
  // South wall section (z: [4.2, 0.5])
  const partStudioS = addBox(building, [16.0, 7.8, 2.35], [0.45, 5.2, 3.7], materials.wall, { shadow: true });
  cameraBlockers.push(partStudioS);
  addColliderBox([16.0, 7.8, 2.35], [0.225, 2.6, 1.85]);
  // Grand Connecting Gallery Portal between Library & Creative Studio (z: [0.5, -2.5], 3.0m wide walkthrough)
  archBatch.addBox([16.0, 9.45, -1.0], [0.48, 1.9, 3.0], materials.wall);
  archBatch.addBox([16.0, 8.45, -1.0], [0.52, 0.16, 3.0], materials.woodWarm);
  // North wall section (z: [-2.5, -18.0])
  const partStudioN = addBox(building, [16.0, 7.8, -10.25], [0.45, 5.2, 15.5], materials.wall, { shadow: true });
  cameraBlockers.push(partStudioN);
  addColliderBox([16.0, 7.8, -10.25], [0.225, 2.6, 7.75]);

  // =========================================================================
  // 6. GRAND OPEN STAIRCASE (Walkable connection from Ground Floor to Floor 2)
  // Origin: x: 0, starts at z = -2.2 (y = 0.0), ascends to z = -7.5 (y = 5.2)
  // Step length = 5.3m, Rise = 5.2m. 16 steps of 0.33m run and 0.325m rise.
  // =========================================================================
  const numSteps = 16;
  const stairWidth = 3.2;
  const startZ = -2.2;
  const endZ = -7.5;
  const startY = 0.0;
  const endY = 5.2;

  for (let i = 0; i < numSteps; i += 1) {
    const t = (i + 0.5) / numSteps;
    const curZ = startZ + (endZ - startZ) * t;
    const curY = startY + (endY - startY) * t;
    const stepDepth = Math.abs(endZ - startZ) / numSteps + 0.08;
    const stepHeight = (endY - startY) / numSteps;

    // Wooden tread
    archBatch.addBox([0, curY, curZ], [stairWidth, 0.12, stepDepth], materials.woodWarm);
    // Brass edge riser trim
    archBatch.addBox([0, curY + 0.04, curZ + stepDepth * 0.45], [stairWidth, 0.04, 0.04], materials.brass);
    // Solid riser support below
    archBatch.addBox([0, curY - stepHeight * 0.5, curZ], [stairWidth - 0.2, stepHeight, stepDepth - 0.04], materials.woodDark);

    // Collider step block (autostep handles up to 0.32m; this step height is 0.325m, so we slice into smooth collider blocks)
    addColliderBox([0, curY - 0.1, curZ], [stairWidth * 0.5, stepHeight * 0.5, stepDepth * 0.5]);
  }

  // Smooth incline helper wedge collider under staircase to ensure 100% snag-free climbing
  for (let i = 0; i < numSteps; i += 2) {
    const t = (i + 1) / numSteps;
    const wz = startZ + (endZ - startZ) * t;
    const wy = startY + (endY - startY) * t;
    addColliderBox([0, wy - 0.25, wz], [stairWidth * 0.48, 0.25, (Math.abs(endZ - startZ) / numSteps)]);
  }

  // Polished mahogany stair stringers and balustrades with turned balusters
  for (const side of [-1, 1]) {
    const sx = side * (stairWidth * 0.5 - 0.08);
    // Continuous angled handrail
    const midZ = (startZ + endZ) * 0.5;
    const midY = (startY + endY) * 0.5 + 1.1;
    const stairLen = Math.hypot(endZ - startZ, endY - startY);
    const stairAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));

    archBatch.addBox([sx, midY, midZ], [0.12, 0.12, stairLen], materials.woodDark, {
      rotation: [side > 0 ? stairAngle : stairAngle, 0, 0],
    });

    // Turned balusters every other step
    for (let i = 0; i < numSteps; i += 2) {
      const t = (i + 0.5) / numSteps;
      const bz = startZ + (endZ - startZ) * t;
      const by = startY + (endY - startY) * t + 0.55;
      archBatch.addCylinder([sx, by, bz], 0.035, 0.035, 1.0, materials.trim, { segments: 8 });
    }
    // Lateral safety collider along stair edges
    addColliderBox([sx, midY - 0.4, midZ], [0.12, 0.8, stairLen * 0.5]);
  }

  // =========================================================================
  // 7. WINDOWS & LIGHT-WELLS
  // Large floor-to-ceiling panoramic glass arrays matching luxury modern estate
  // =========================================================================
  // Project Gallery ground floor west glass wall opening to pool (x = -16.48, z: [-1.0, -5.5])
  addBox(building, [-16.48, 2.6, -3.25], [0.06, 4.4, 4.8], materials.glass);
  archBatch.addBox([-16.45, 0.4, -3.25], [0.14, 0.8, 5.0], materials.trim);
  archBatch.addBox([-16.45, 4.8, -3.25], [0.14, 0.4, 5.0], materials.trim);

  // Master Bedroom second floor west sliding glass wall to balcony (x = -16.48, z: [-1.0, -5.5], y: [5.2, 9.6])
  addBox(building, [-16.48, 7.6, -3.25], [0.06, 4.4, 4.8], materials.glass);
  archBatch.addBox([-16.45, 9.8, -3.25], [0.14, 0.4, 5.0], materials.trim);

  // Creative Studio second floor east sliding glass wall to balcony (x = 25.98, z: [-1.0, -5.5], y: [5.2, 9.6])
  addBox(building, [25.98, 7.6, -3.25], [0.06, 4.4, 4.8], materials.glass);
  archBatch.addBox([25.95, 9.8, -3.25], [0.14, 0.4, 5.0], materials.trim);

  // Front panoramic windows on Ground & Second Floors
  for (const wx of [-11.0, 10.75]) {
    // Ground floor window (y = 2.6, height 3.2m, width 4.8m)
    addBox(building, [wx, 2.6, 4.25], [4.8, 3.2, 0.06], materials.glass);
    archBatch.addBox([wx, 0.95, 4.3], [5.2, 0.18, 0.2], materials.trim);
    archBatch.addBox([wx, 4.25, 4.3], [5.2, 0.18, 0.2], materials.trim);

    // Second floor window (y = 7.8, height 3.2m, width 4.8m)
    addBox(building, [wx, 7.8, 4.25], [4.8, 3.2, 0.06], materials.glass);
    archBatch.addBox([wx, 6.15, 4.3], [5.2, 0.18, 0.2], materials.trim);
    archBatch.addBox([wx, 9.45, 4.3], [5.2, 0.18, 0.2], materials.trim);

    // Flower boxes under ground floor windows
    archBatch.addBox([wx, 0.72, 4.48], [4.6, 0.34, 0.42], materials.woodWarm);
    archBatch.addBox([wx, 0.88, 4.48], [4.5, 0.05, 0.38], materials.soil);
    for (let fi = -1.8; fi <= 1.8; fi += 0.45) {
      archBatch.addSphere([wx + fi, 1.05, 4.48], [0.2, 0.2, 0.2], materials.foliageBright);
      archBatch.addSphere([wx + fi, 1.16, 4.48], [0.09, 0.09, 0.09], fi % 0.9 === 0 ? materials.coral : materials.yellow);
    }
  }

  // =========================================================================
  // 8. ROOF STRUCTURE & CHIMNEY (In roofGroup for interior transparency)
  // =========================================================================
  const roofGroup = new THREE.Group();
  building.add(roofGroup);
  const roofBatch = new BatchCollector();

  // Modern Multi-Tiered Gabled Roof Over Main 42.5m Estate (Elevation y = 10.4 to 12.6m)
  // Left Wing Gable
  roofBatch.addBox([-11.0, 11.2, -6.9], [12.8, 0.38, 23.8], materials.roof, { rotation: [0, 0, 0.14] });
  // Center Double-Height Atrium Raised Skylight Roof
  roofBatch.addBox([0, 12.1, -6.9], [11.8, 0.42, 23.8], materials.roof);
  roofBatch.addBox([0, 12.5, -6.9], [1.2, 0.38, 24.2], materials.roofTrim);
  // Right Wing Gable
  roofBatch.addBox([11.0, 11.2, -6.9], [12.8, 0.38, 23.8], materials.roof, { rotation: [0, 0, -0.14] });
  // Garage Flat Modern Overhang Roof with architectural trim
  roofBatch.addBox([21.0, 10.8, -6.9], [11.5, 0.45, 23.8], materials.roof);
  roofBatch.addBox([21.0, 11.1, -6.9], [11.8, 0.18, 24.2], materials.roofTrim);

  // Red Brick Fireplace Chimney on living room roof
  const cx = 4.2;
  const cz = -1.8;
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
  // =========================================================================
  addBox(building, [0, 9.6, 4.6], [7.2, 1.6, 0.18], materials.woodDark);
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
    new THREE.PlaneGeometry(6.8, 1.45),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4, metalness: 0.05 })
  );
  signMesh.position.set(0, 9.6, 4.71);
  building.add(signMesh);

  // Sconces along front facade
  for (const sx of [-11.0, -5.5, 5.5, 11.0, 16.0, 25.5]) {
    archBatch.addBox([sx, 4.2, 4.35], [0.14, 0.28, 0.14], materials.brass);
    addSphere(building, [sx, 4.2, 4.35], [0.14, 0.14, 0.14], materials.glow, { shadow: false });
  }

  // Build batched architecture
  archBatch.build(building, true);

  return { building, roofGroup };
}

export function createInteractiveDoors(scene, world, RAPIER, doorColliders, interactionPoints) {
  const frame = new THREE.Group();
  frame.position.set(0, 0, 4.12);
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
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 1.65, 4.2));
    const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(0.77, 1.65, 0.1), body);
    doorColliders.push(collider);
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
    position: new THREE.Vector3(0, 0.7, 4.2),
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
