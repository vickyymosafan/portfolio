import * as THREE from 'three';
import { materials, palette, vertexColorFamilies } from './materials.js';
import { addBox, addSphere, addCylinder, BatchCollector, mergeSubtreeMeshes } from './geometry.js';

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
  // 2. GRAND ENTRANCE STEPS & FRONT PORCH WITH CONTINUOUS STONE FOUNDATION
  // Porch platform at z = [3.8, 7.6], x = [-6.5, 6.5]
  // Complete architectural foundation (pondasi batu alam, stylobate, umpak tiang)
  // =========================================================================

  // 1. Heavy Continuous Stone Foundation Skirt & Stylobate Podium (Pondasi Dasar Batu Alam)
  // Extends into the earth from y = -0.55 up to ground level (y = 0.05) to firmly ground the porch
  archBatch.addBox([0, -0.25, 5.75], [13.8, 0.60, 4.2], materials.foundation);
  addColliderBox([0, -0.25, 5.75], [6.9, 0.30, 2.1]);

  // Stepped architectural plinth stylobate molding around porch perimeter
  archBatch.addBox([0, 0.02, 5.7], [13.6, 0.16, 4.0], materials.stone);
  archBatch.addBox([0, 0.12, 5.7], [13.4, 0.06, 3.9], materials.trim);

  // Porch platform finish floor at z = [3.8, 7.6], x = [-6.5, 6.5]
  archBatch.addBox([0, 0.18, 5.7], [13.0, 0.12, 3.8], materials.woodLight);
  addColliderBox([0, 0.08, 5.7], [6.5, 0.12, 1.9]);

  // Grand descending stone stairs with wide curved treads leading to front fountain roundabout
  for (let step = 0; step < 4; step += 1) {
    const sy = -0.04 - step * 0.08;
    const sz = 7.6 + step * 0.55;
    const sw = 9.6 - step * 0.4;
    archBatch.addBox([0, sy, sz], [sw, 0.16, 0.6], materials.stone);
    addColliderBox([0, sy - 0.06, sz], [sw * 0.5, 0.08, 0.3]);
  }

  // Foundation Wing Cheek Retaining Walls flanking the grand stone stairs
  for (const sx of [-4.9, 4.9]) {
    archBatch.addBox([sx, -0.15, 8.4], [0.45, 0.55, 2.4], materials.foundation);
    archBatch.addBox([sx, 0.16, 8.4], [0.55, 0.12, 2.45], materials.stone);
    archBatch.addBox([sx, 0.24, 7.6], [0.65, 0.22, 0.65], materials.stone);
    archBatch.addBox([sx, 0.10, 9.5], [0.65, 0.22, 0.65], materials.stone);
  }

  // Double-height front monumental columns (height 10.2m) flanking central entrance
  const frontColX = [-5.5, -2.2, 2.2, 5.5];
  for (const cx of frontColX) {
    // A. Sub-grade reinforced foundation footing pad (Tapak Pondasi Umpak Cakar Ayam)
    archBatch.addBox([cx, -0.22, 7.4], [1.2, 0.56, 1.2], materials.foundation);

    // B. Stepped stone pedestal base (Umpak Pondasi Batu Alam Bertingkat)
    archBatch.addBox([cx, 0.18, 7.4], [1.05, 0.24, 1.05], materials.stone);
    archBatch.addBox([cx, 0.48, 7.4], [0.88, 0.40, 0.88], materials.stone);
    archBatch.addCylinder([cx, 0.72, 7.4], 0.42, 0.46, 0.12, materials.woodWarm, { segments: 16 });
    archBatch.addCylinder([cx, 0.82, 7.4], 0.38, 0.42, 0.10, materials.brass, { segments: 16 });

    // C. Lower shaft (ground floor)
    archBatch.addCylinder([cx, 2.95, 7.4], 0.32, 0.36, 4.15, materials.column, { segments: 20 });

    // D. Mid capital / floor ring at second floor level
    archBatch.addBox([cx, 5.2, 7.4], [0.8, 0.3, 0.8], materials.woodWarm);

    // E. Upper shaft (second floor)
    archBatch.addCylinder([cx, 7.6, 7.4], 0.28, 0.32, 4.5, materials.column, { segments: 20 });

    // F. Upper ornate classical capital
    archBatch.addCylinder([cx, 9.75, 7.4], 0.34, 0.30, 0.2, materials.woodWarm, { segments: 16 });
    archBatch.addBox([cx, 9.95, 7.4], [0.95, 0.22, 0.95], materials.stone);
    archBatch.addBox([cx, 10.10, 7.4], [1.05, 0.12, 1.05], materials.brass);

    addColliderBox([cx, 5.0, 7.4], [0.45, 5.0, 0.45]);
  }

  // =========================================================================
  // 2A. MONUMENTAL CLASSICAL ENTABLATURE & PORTICO SUPERSTRUCTURE
  // Structural beams resting on top of the 4 columns at y = 10.15 - 10.95m
  // Tying all columns together and connecting back to the mansion front wall
  // =========================================================================

  // 1. Architrave (Balok Epistyle / Balok Gelagar Utama)
  // Continuous transverse structural stone beam resting on the 4 column capitals (spanning 12.4m)
  archBatch.addBox([0, 10.28, 7.4], [12.6, 0.36, 0.84], materials.stone);
  archBatch.addBox([0, 10.12, 7.4], [12.4, 0.06, 0.76], materials.brass);

  // Longitudinal return tie-beams (Balok Pengikat Samping) connecting side columns (cx = -5.5, 5.5) back to wall (z = 3.8)
  for (const sx of [-5.5, 5.5]) {
    archBatch.addBox([sx, 10.28, 5.6], [0.68, 0.36, 3.6], materials.stone);
    archBatch.addBox([sx, 10.12, 5.6], [0.60, 0.06, 3.6], materials.brass);
  }

  // 2. Frieze Band (Balok Fascia Arsitektural)
  archBatch.addBox([0, 10.60, 7.4], [12.3, 0.34, 0.74], materials.wall);
  for (const sx of [-5.5, 5.5]) {
    archBatch.addBox([sx, 10.60, 5.6], [0.60, 0.34, 3.6], materials.wall);
  }
  // Decorative modillion / triglyph bracket accents at each column axis
  for (const cx of frontColX) {
    archBatch.addBox([cx, 10.60, 7.82], [0.40, 0.30, 0.10], materials.brass);
    archBatch.addBox([cx, 10.60, 7.86], [0.32, 0.22, 0.04], materials.woodDark);
  }

  // 3. Cornice Molding (Listplang Geison Bertingkat)
  // Projecting molded cornice with drip cap
  archBatch.addBox([0, 10.84, 7.4], [12.9, 0.18, 0.98], materials.stone);
  archBatch.addBox([0, 10.95, 7.4], [13.0, 0.04, 1.04], materials.brass);
  for (const sx of [-5.5, 5.5]) {
    archBatch.addBox([sx, 10.84, 5.6], [0.78, 0.18, 3.7], materials.stone);
    archBatch.addBox([sx, 10.95, 5.6], [0.84, 0.04, 3.75], materials.brass);
  }

  // 4. Portico Luxury Coffered Ceiling Soffit (Plafon Kayu Mewah di Bawah Kanopi Portico)
  archBatch.addBox([0, 10.05, 5.6], [11.8, 0.08, 3.5], materials.woodWarm);
  // Recessed warm lighting fixtures in the portico ceiling
  for (const lx of [-3.8, 0, 3.8]) {
    archBatch.addCylinder([lx, 10.03, 5.6], 0.24, 0.24, 0.04, materials.brass, { segments: 12 });
    addSphere(building, [lx, 10.00, 5.6], [0.16, 0.06, 0.16], materials.glow, { shadow: false });
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

  // =========================================================================
  // 2B. SECOND FLOOR EXECUTIVE BALCONY TERRACE (z: [3.8, 7.8], x: [-6.7, 6.7])
  // Directly extends over the grand entrance portico at y = 5.06 - 5.22m
  // =========================================================================

  // 1. Structural Concrete Cantilever Balcony Slab (flush with Lantai 2 interior floor slab at y = 5.06)
  addBox(building, [0, 5.04, 5.8], [13.4, 0.24, 4.0], materials.stone, { shadow: false, receive: true });
  addColliderBox([0, 5.04, 5.8], [6.7, 0.12, 2.0]);

  // 2. Premium Weather-Resistant Outdoor Teak Wood Decking Planks (y = 5.21, top at 5.235, starting at z = 3.92)
  addBox(building, [0, 5.21, 5.835], [13.1, 0.05, 3.83], materials.woodFloor, { shadow: false, receive: true });

  // 3. Lower Soffit & Ceiling Panel of Porch Entrance with Recessed Warm Lighting
  archBatch.addBox([0, 4.90, 5.8], [13.2, 0.14, 3.8], materials.woodWarm);
  archBatch.addBox([0, 4.82, 5.8], [13.4, 0.06, 4.0], materials.roofTrim);
  // Recessed warm ceiling downlights illuminating the front steps below
  for (const lx of [-4.5, -1.5, 1.5, 4.5]) {
    archBatch.addCylinder([lx, 4.88, 5.8], 0.22, 0.22, 0.04, materials.brass, { segments: 12 });
    addSphere(building, [lx, 4.87, 5.8], [0.15, 0.06, 0.15], materials.glow, { shadow: false });
  }

  // 4. Perimeter Cantilever Architectural Fascia Beams & Stone Trim
  archBatch.addBox([0, 5.06, 7.85], [13.6, 0.32, 0.18], materials.trim);
  archBatch.addBox([-6.75, 5.06, 5.8], [0.18, 0.32, 4.1], materials.trim);
  archBatch.addBox([6.75, 5.06, 5.8], [0.18, 0.32, 4.1], materials.trim);
  archBatch.addBox([0, 5.22, 7.86], [13.7, 0.06, 0.22], materials.woodDark);
  archBatch.addBox([-6.76, 5.22, 5.8], [0.22, 0.06, 4.15], materials.woodDark);
  archBatch.addBox([6.76, 5.22, 5.8], [0.22, 0.06, 4.15], materials.woodDark);

  // =========================================================================
  // 2C. ARCHITECTURAL BALCONY RAILING & SAFETY BALUSTRADE (Lantai 2 Balkon)
  // Konsep Arsitektur: Pagar pengaman bertingkat dengan pegangan tangan ergonomis,
  // tiang balustrade kokoh, panel kaca tempered bening, dan base curb pencegah jatuh.
  // Standard safety code height: 1.10m above finished deck (y = 5.21 + 1.10 = 6.31m).
  // =========================================================================

  // A. Handrails (Pegangan Tangan) - Profil ergonomis kayu mahoni / jati gelap dengan aksen kuningan
  // West Handrail (x = -6.65, z: [3.8, 7.85], length 4.05m)
  archBatch.addBox([-6.65, 6.31, 5.825], [0.14, 0.08, 4.05], materials.woodDark);
  archBatch.addBox([-6.65, 6.26, 5.825], [0.16, 0.02, 4.05], materials.brass);

  // East Handrail (x = 6.65, z: [3.8, 7.85], length 4.05m)
  archBatch.addBox([6.65, 6.31, 5.825], [0.14, 0.08, 4.05], materials.woodDark);
  archBatch.addBox([6.65, 6.26, 5.825], [0.16, 0.02, 4.05], materials.brass);

  // Front-West Handrail (z = 7.85, x: [-6.65, -3.7], length 2.95m)
  archBatch.addBox([-5.175, 6.31, 7.85], [2.95, 0.08, 0.14], materials.woodDark);
  archBatch.addBox([-5.175, 6.26, 7.85], [2.95, 0.02, 0.16], materials.brass);

  // Front-East Handrail (z = 7.85, x: [3.7, 6.65], length 2.95m)
  archBatch.addBox([5.175, 6.31, 7.85], [2.95, 0.08, 0.14], materials.woodDark);
  archBatch.addBox([5.175, 6.26, 7.85], [2.95, 0.02, 0.16], materials.brass);

  // Central Balcony Parapet Handrail crowning the "Vicky's World" centerpiece (z = 7.88, x: [-3.7, 3.7], in front of columns)
  archBatch.addBox([0, 6.62, 7.88], [7.5, 0.10, 0.22], materials.woodDark);
  archBatch.addBox([0, 6.56, 7.88], [7.54, 0.02, 0.24], materials.brass);

  // B. Base Shoe Plinth Channels (Curb pengaman lantai penahan panel kaca)
  const shoeMat = materials.windowFrame || materials.metalDark;
  archBatch.addBox([-6.65, 5.28, 5.825], [0.12, 0.10, 4.05], shoeMat);
  archBatch.addBox([6.65, 5.28, 5.825], [0.12, 0.10, 4.05], shoeMat);
  archBatch.addBox([-5.175, 5.28, 7.85], [2.95, 0.10, 0.12], shoeMat);
  archBatch.addBox([5.175, 5.28, 7.85], [2.95, 0.10, 0.12], shoeMat);

  // C. Architectural Safety Glass Infill Panels (Panel kaca tempered bening & berkelas)
  addBox(building, [-6.65, 5.79, 5.825], [0.04, 0.92, 3.85], materials.glass, { shadow: false });
  addBox(building, [6.65, 5.79, 5.825], [0.04, 0.92, 3.85], materials.glass, { shadow: false });
  addBox(building, [-5.175, 5.79, 7.85], [2.75, 0.92, 0.04], materials.glass, { shadow: false });
  addBox(building, [5.175, 5.79, 7.85], [2.75, 0.92, 0.04], materials.glass, { shadow: false });

  // D. Stainless / Brass Standoff Baluster Spigots (Klem penjepit struktural kaca)
  for (let bz = 4.3; bz <= 7.4; bz += 0.75) {
    archBatch.addCylinder([-6.65, 5.79, bz], 0.022, 0.022, 0.94, materials.brass, { segments: 8 });
    archBatch.addCylinder([6.65, 5.79, bz], 0.022, 0.022, 0.94, materials.brass, { segments: 8 });
  }
  for (const bx of [-6.0, -5.3, -4.6, -3.9, 3.9, 4.6, 5.3, 6.0]) {
    archBatch.addCylinder([bx, 5.79, 7.85], 0.022, 0.022, 0.94, materials.brass, { segments: 8 });
  }

  // E. Solid Architectural Balustrade Newel Posts (Tiang utama pembatas balkon)
  const balconyPosts = [
    [-6.65, 7.85],   // Front-West Corner
    [6.65, 7.85],    // Front-East Corner
    [-6.65, 3.8],    // Wall Anchor West
    [6.65, 3.8],     // Wall Anchor East
    [-3.7, 7.85],    // Center Parapet West Flank
    [3.7, 7.85],     // Center Parapet East Flank
  ];
  for (const [px, pz] of balconyPosts) {
    archBatch.addBox([px, 5.35, pz], [0.22, 0.24, 0.22], materials.stone);
    archBatch.addBox([px, 5.80, pz], [0.18, 0.88, 0.18], materials.column);
    archBatch.addBox([px, 6.28, pz], [0.20, 0.08, 0.20], materials.brass);
    archBatch.addBox([px, 6.38, pz], [0.22, 0.12, 0.22], materials.woodDark);
  }

  // F. Solid Rapier Safety Colliders for Balcony Perimeter (mencegah karakter jatuh)
  addColliderBox([-6.65, 5.85, 5.825], [0.15, 0.70, 2.05]); // West
  addColliderBox([6.65, 5.85, 5.825], [0.15, 0.70, 2.05]);  // East
  addColliderBox([0, 5.85, 7.88], [6.7, 0.70, 0.15]);        // Front

  // G. Luxury Balcony Greenery & Ornamental Potted Topiaries ("Better visual di depan")
  for (const tx of [-5.8, 5.8]) {
    archBatch.addCylinder([tx, 5.48, 5.4], 0.42, 0.32, 0.52, materials.terracotta, { segments: 16 });
    archBatch.addCylinder([tx, 5.74, 5.4], 0.44, 0.42, 0.06, materials.terracotta, { segments: 16 });
    archBatch.addCylinder([tx, 5.73, 5.4], 0.38, 0.38, 0.04, materials.soil, { segments: 12 });
    archBatch.addSphere([tx, 6.22, 5.4], [0.46, 0.46, 0.46], materials.foliageBright);
    archBatch.addSphere([tx, 6.45, 5.4], [0.34, 0.34, 0.34], materials.foliageMid);
    archBatch.addSphere([tx - 0.2, 5.85, 5.5], [0.08, 0.08, 0.08], materials.coral);
    archBatch.addSphere([tx + 0.2, 5.85, 5.3], [0.08, 0.08, 0.08], materials.yellow);
    archBatch.addSphere([tx, 5.88, 5.55], [0.08, 0.08, 0.08], materials.bluePastel);
    addColliderBox([tx, 5.85, 5.4], [0.45, 0.65, 0.45]);
  }

  // H. Balcony Terrace Cafe Lounge Set (Bistro Table & Chairs on East Wing)
  const bistroX = 3.6;
  const bistroZ = 5.2;
  archBatch.addCylinder([bistroX, 5.25, bistroZ], 0.32, 0.32, 0.04, materials.brass, { segments: 14 });
  archBatch.addCylinder([bistroX, 5.55, bistroZ], 0.04, 0.04, 0.56, materials.brass, { segments: 10 });
  archBatch.addCylinder([bistroX, 5.85, bistroZ], 0.48, 0.48, 0.04, materials.ceramic, { segments: 20 });
  archBatch.addCylinder([bistroX + 0.12, 5.92, bistroZ + 0.08], 0.06, 0.05, 0.10, materials.ceramicTeal, { segments: 10 });
  for (const [cx, cz, rotY] of [[bistroX - 0.65, bistroZ, Math.PI * 0.5], [bistroX + 0.65, bistroZ, -Math.PI * 0.5]]) {
    archBatch.addBox([cx, 5.48, cz], [0.44, 0.06, 0.44], materials.woodDark);
    archBatch.addBox([cx, 5.34, cz], [0.38, 0.22, 0.38], materials.metalDark);
    archBatch.addBox([cx, 5.52, cz], [0.42, 0.05, 0.42], materials.cushionCoral);
    archBatch.addBox([cx + (rotY > 0 ? -0.18 : 0.18), 5.78, cz], [0.06, 0.52, 0.42], materials.woodDark);
  }

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
  addBox(building, [0, 0.04, -11.85], [20.0, 0.20, 7.3], materials.stone, { shadow: true, receive: true });
  addColliderBox([0, 0.0, -11.85], [10.0, 0.16, 3.65]);
  addBox(building, [0, 0.16, -11.85], [19.6, 0.04, 6.9], materials.terraceTiles, { shadow: false, receive: true });

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

  // Ground Floor Front Header Lintel Beams (framing the tops of Lantai 1 rooms, y = 4.75 to 4.92)
  for (const [x1, x2] of [[-16.5, -5.5], [5.5, 16.0], [16.0, 26.0]]) {
    const mx = (x1 + x2) * 0.5;
    const w = Math.abs(x2 - x1);
    archBatch.addBox([mx, 4.835, 3.8], [w, 0.17, 0.36], materials.trim);
    archBatch.addBox([mx, 4.74, 3.8], [w, 0.04, 0.40], materials.woodWarm);
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

  // Bay 4: Garage Showroom Front - Operated by Interactive Overhead Sectional Glass Garage Door
  // Created dynamically with smooth upward lifting tracks & Rapier physics in createInteractiveDoors()

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
  // Architectural Code: 1.05m height safety balustrade with ergonomic handrail & brass spigots
  // Base shoe curb channels
  archBatch.addBox([2.65, 5.26, -2.4], [0.10, 0.10, 6.4], materials.windowFrame);
  archBatch.addBox([4.05, 5.26, 0.8], [2.7, 0.10, 0.10], materials.windowFrame);

  // Inner side glass panel along x = 2.65
  addBox(building, [2.65, 5.75, -2.4], [0.04, 0.88, 6.4], materials.glass, { shadow: false });
  archBatch.addBox([2.65, 6.25, -2.4], [0.12, 0.08, 6.4], materials.woodDark);
  archBatch.addBox([2.65, 6.20, -2.4], [0.14, 0.02, 6.4], materials.brass);
  addColliderBox([2.65, 5.75, -2.4], [0.08, 0.55, 3.2]);

  // Front glass panel along z = 0.8 (x: [2.7, 5.4])
  addBox(building, [4.05, 5.75, 0.8], [2.7, 0.88, 0.04], materials.glass, { shadow: false });
  archBatch.addBox([4.05, 6.25, 0.8], [2.7, 0.08, 0.12], materials.woodDark);
  archBatch.addBox([4.05, 6.20, 0.8], [2.7, 0.02, 0.14], materials.brass);
  addColliderBox([4.05, 5.75, 0.8], [1.35, 0.55, 0.08]);

  // Corner and terminal newel posts for stairwell void
  for (const [vx, vz] of [[2.65, 0.8], [2.65, -5.6], [5.4, 0.8]]) {
    archBatch.addBox([vx, 5.75, vz], [0.16, 1.05, 0.16], materials.woodDark);
    archBatch.addBox([vx, 5.26, vz], [0.18, 0.10, 0.18], materials.brass);
    archBatch.addBox([vx, 6.30, vz], [0.18, 0.08, 0.18], materials.brass);
  }

  // Library Nook Floor Slab (Bay 3: x: [5.5, 16.0], z: [3.8, -8.2])
  addBox(building, [10.75, 5.06, -2.2], [10.5, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([10.75, 5.06, -2.2], [5.25, 0.14, 6.0]);

  // Creative Studio Floor Slab (Bay 4: x: [16.0, 26.0], z: [3.8, -8.2])
  addBox(building, [21.0, 5.06, -2.2], [10.0, 0.28, 12.0], materials.woodFloor, { shadow: false, receive: true });
  addColliderBox([21.0, 5.06, -2.2], [5.0, 0.14, 6.0]);

  // Architectural Floor Fascia Beam along the front cutaway edge (z = 3.88, y = 5.06)
  // Split into West and East wings to cleanly bypass the central second-floor balcony door threshold
  for (const [bx, bw] of [[-9.15, 14.7], [13.9, 24.2]]) {
    archBatch.addBox([bx, 5.06, 3.88], [bw, 0.28, 0.32], materials.woodWarm);
    archBatch.addBox([bx, 5.22, 3.89], [bw, 0.06, 0.34], materials.trim);
  }

  // =========================================================================
  // 5B. FRONT ARCHITECTURAL GLASS FACADE (Upper Floor / Lantai 2, y: [5.25, 9.85])
  // Full-height panoramic floor-to-ceiling glass walls across all upper rooms
  // Solid physical Rapier colliders preventing any fall-out or penetration
  // =========================================================================

  // Bay 1: Master Bedroom Front Glass (x: [-16.15, -5.85])
  addGlassFacade(-16.15, -5.85, 5.25, 9.85, 4);

  // Bay 2: Bathroom & Central Atrium Front Glass with Grand Balcony Portal (Lantai 2)
  // West flanking glass curtain wall (x: [-5.15, -1.8])
  addGlassFacade(-5.15, -1.8, 5.25, 9.85, 2);
  // East flanking glass curtain wall (x: [1.8, 5.15])
  addGlassFacade(1.8, 5.15, 5.25, 9.85, 2);
  // Transom window above the second floor balcony doors (y: [8.55, 9.85], x: [-1.8, 1.8])
  addGlassFacade(-1.8, 1.8, 8.55, 9.85, 2, { transoms: [] });

  // Architectural Portal Architrave Framing for 2nd Floor Balcony Doorway (x: [-1.8, 1.8], y: [5.20, 8.55], z = 3.8)
  const portalFrameMat = materials.windowFrame || materials.metalDark;
  archBatch.addBox([0, 8.50, 3.8], [3.65, 0.18, 0.22], portalFrameMat);
  archBatch.addBox([-1.76, 6.85, 3.8], [0.18, 3.25, 0.22], portalFrameMat);
  archBatch.addBox([1.76, 6.85, 3.8], [0.18, 3.25, 0.22], portalFrameMat);
  archBatch.addBox([0, 5.22, 3.8], [3.65, 0.06, 0.22], materials.brass); // Flush brass threshold (ends at z = 3.91)

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

  // =========================================================================
  // ARCHITECTURAL STAIRCASE RAILING & BALUSTRADE (Railing Tangga)
  // Konsep Arsitektur: Media pengaman pada hunian bertingkat dengan pegangan tangan ergonomis,
  // tiang balustrade awal & akhir, klem spigots kuningan, dan pegangan tangan dinding (wall handrail).
  // =========================================================================
  const sx = stairX - stairWidth * 0.5; // x = 3.2
  const midZ = (startZ + endZ) * 0.5;
  const midY = (startY + endY) * 0.5 + 1.0;
  const stairLen = Math.hypot(endZ - startZ, endY - startY);
  const stairAngle = Math.atan2(endY - startY, Math.abs(endZ - startZ));

  // 1. Starting Newel Post (Tiang Awal Tangga) pada anak tangga pertama
  archBatch.addBox([sx, 0.55, startZ + 0.05], [0.18, 1.10, 0.18], materials.woodDark);
  archBatch.addBox([sx, 0.08, startZ + 0.05], [0.22, 0.16, 0.22], materials.brass);
  archBatch.addBox([sx, 1.14, startZ + 0.05], [0.20, 0.08, 0.20], materials.brass);
  archBatch.addSphere([sx, 1.24, startZ + 0.05], [0.10, 0.10, 0.10], materials.brass);

  // 2. Intermediate Support Post (Tiang Tengah Tangga)
  archBatch.addBox([sx, midY - 0.40, midZ], [0.14, 1.05, 0.14], materials.woodDark);
  archBatch.addBox([sx, midY + 0.14, midZ], [0.16, 0.06, 0.16], materials.brass);

  // 3. Top Landing Newel Post (Tiang Puncak Tangga) menyambung ke void Lantai 2
  archBatch.addBox([sx, endY + 0.55, endZ - 0.05], [0.18, 1.10, 0.18], materials.woodDark);
  archBatch.addBox([sx, endY + 0.08, endZ - 0.05], [0.22, 0.16, 0.22], materials.brass);
  archBatch.addBox([sx, endY + 1.14, endZ - 0.05], [0.20, 0.08, 0.20], materials.brass);
  archBatch.addSphere([sx, endY + 1.24, endZ - 0.05], [0.10, 0.10, 0.10], materials.brass);

  // 4. Polished mahogany top handrail (Pegangan Tangan Tangga Kiri)
  archBatch.addBox([sx, midY, midZ], [0.12, 0.10, stairLen], materials.woodDark, {
    rotation: [stairAngle, 0, 0],
  });
  archBatch.addBox([sx, midY - 0.04, midZ], [0.14, 0.02, stairLen], materials.brass, {
    rotation: [stairAngle, 0, 0],
  });

  // 5. Architectural crystal clear glass balustrade panel along staircase flight
  archBatch.addBox([sx, midY - 0.42, midZ], [0.04, 0.76, stairLen], materials.glass, {
    rotation: [stairAngle, 0, 0],
  });

  // 6. Brass standoff clamp balusters every 2 steps
  for (let i = 0; i < numSteps; i += 2) {
    const t = (i + 0.5) / numSteps;
    const bz = startZ + (endZ - startZ) * t;
    const by = startY + (endY - startY) * t + 0.52;
    archBatch.addCylinder([sx, by, bz], 0.024, 0.024, 0.94, materials.brass, { segments: 8 });
  }
  addColliderBox([sx, midY - 0.35, midZ], [0.10, 0.75, stairLen * 0.5]);

  // 7. Wall-Mounted Handrail (Pegangan Tangan Dinding Kanan pada x = 4.86, menempel di dinding x = 5.5)
  const wallHx = stairX + stairWidth * 0.5 - 0.04; // 4.86
  archBatch.addBox([wallHx, midY, midZ], [0.08, 0.08, stairLen], materials.woodDark, {
    rotation: [stairAngle, 0, 0],
  });
  // Brass mounting brackets anchoring to the solid wall
  for (let i = 2; i < numSteps; i += 5) {
    const t = (i + 0.5) / numSteps;
    const bz = startZ + (endZ - startZ) * t;
    const by = startY + (endY - startY) * t + 0.98;
    archBatch.addBox([wallHx + 0.08, by, bz], [0.12, 0.03, 0.05], materials.brass);
    archBatch.addCylinder([wallHx + 0.14, by, bz], 0.04, 0.04, 0.02, materials.brass, { segments: 8 });
  }

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

  // =========================================================================
  // GRAND MONUMENTAL PORTICO GABLED ROOF & PEDIMENT (Over the 4 Columns, z: [3.8, 7.85])
  // Crowns the monumental columns with a neoclassical triangular pediment & roof
  // =========================================================================

  // Sloping portico gabled roof pitches matching central atrium ridge line
  // West slope
  roofBatch.addBox([-3.2, 11.80, 5.825], [7.1, 0.40, 4.3], materials.roof, { rotation: [0, 0, 0.22] });
  roofBatch.addBox([-3.2, 11.58, 5.825], [6.9, 0.16, 4.15], materials.woodWarm, { rotation: [0, 0, 0.22] });
  // East slope
  roofBatch.addBox([3.2, 11.80, 5.825], [7.1, 0.40, 4.3], materials.roof, { rotation: [0, 0, -0.22] });
  roofBatch.addBox([3.2, 11.58, 5.825], [6.9, 0.16, 4.15], materials.woodWarm, { rotation: [0, 0, -0.22] });

  // Ridge cap bridging portico roof seamlessly back into central atrium roof
  roofBatch.addBox([0, 12.60, 5.825], [1.3, 0.34, 4.4], materials.roofTrim);

  // Front Triangular Portico Tympanum (Dinding Segitiga Pediment Depan at z = 7.45)
  roofBatch.addBox([0, 11.35, 7.45], [11.8, 0.70, 0.26], materials.wall);
  roofBatch.addBox([0, 11.85, 7.45], [7.8, 0.50, 0.26], materials.wall);
  roofBatch.addBox([0, 12.25, 7.45], [3.8, 0.40, 0.26], materials.wall);

  // Raking cornice trim (listplang miring pediment) framing front triangle
  roofBatch.addBox([-3.2, 11.90, 7.62], [7.1, 0.24, 0.38], materials.roofTrim, { rotation: [0, 0, 0.22] });
  roofBatch.addBox([3.2, 11.90, 7.62], [7.1, 0.24, 0.38], materials.roofTrim, { rotation: [0, 0, -0.22] });

  // Apex acroterion finial ornament crowning the pediment
  roofBatch.addBox([0, 12.82, 7.68], [0.48, 0.36, 0.28], materials.brass);
  roofBatch.addCylinder([0, 13.08, 7.68], 0.10, 0.18, 0.32, materials.brass, { segments: 12 });

  // Classical decorative brass medallion crest in center of pediment tympanum
  roofBatch.addCylinder([0, 11.55, 7.60], 0.65, 0.65, 0.08, materials.brass, { segments: 24, rotation: [Math.PI * 0.5, 0, 0] });
  roofBatch.addCylinder([0, 11.55, 7.64], 0.48, 0.48, 0.06, materials.woodDark, { segments: 24, rotation: [Math.PI * 0.5, 0, 0] });
  roofBatch.addSphere([0, 11.55, 7.68], [0.20, 0.20, 0.10], materials.brass);

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

  // Chimney smoke puffs merged into roofBatch
  for (let s = 0; s < 3; s += 1) {
    roofBatch.addSphere(
      [cx + (s + 1) * 0.28, 14.5 + s * 0.8, cz + (s + 1) * 0.2],
      [0.42 + s * 0.18, 0.38 + s * 0.16, 0.42 + s * 0.18],
      materials.trim,
      { shadow: false }
    );
  }
  roofGroup.userData.isDynamic = true;
  const rGeo = roofBatch.toMergedGeometry();
  if (rGeo) {
    const rMesh = new THREE.Mesh(rGeo, vertexColorFamilies.shingles);
    rMesh.castShadow = true;
    rMesh.receiveShadow = true;
    rMesh.matrixAutoUpdate = false;
    rMesh.updateMatrix();
    roofGroup.add(rMesh);
  }

  // =========================================================================
  // 9. GRAND ENTRANCE SIGNBOARD ("VICKY'S WORLD")
  // Mounted proudly IN FRONT of the monumental columns (z = 7.88 - 7.99)
  // Ensures columns (z = 7.4) remain cleanly behind the sign with zero clipping.
  // =========================================================================

  // Structural architectural mounting brackets connecting the columns (cx = -2.2, 2.2) to the sign
  for (const cx of [-2.2, 2.2]) {
    archBatch.addBox([cx, 5.85, 7.62], [0.42, 1.25, 0.38], materials.stone);
    archBatch.addBox([cx, 5.85, 7.78], [0.46, 1.28, 0.06], materials.brass);
  }

  // Solid backing signboard structure in front of the columns
  addBox(building, [0, 5.85, 7.88], [7.4, 1.45, 0.16], materials.woodDark);
  archBatch.addBox([0, 5.85, 7.96], [7.44, 1.49, 0.04], materials.brass);
  archBatch.addBox([0, 5.10, 7.88], [7.5, 0.08, 0.22], materials.trim);

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
    new THREE.PlaneGeometry(7.0, 1.35),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4, metalness: 0.05 })
  );
  signMesh.position.set(0, 5.85, 7.99);
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

  // Wall Sconces flanking second floor balcony glass doors
  for (const sx of [-2.05, 2.05]) {
    archBatch.addBox([sx, 7.3, 3.96], [0.12, 0.26, 0.16], materials.brass);
    archBatch.addBox([sx, 7.3, 4.06], [0.18, 0.32, 0.18], materials.windowFrame);
    addSphere(building, [sx, 7.3, 4.06], [0.10, 0.10, 0.10], materials.glow, { shadow: false });
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
  doorLeft.userData.isDynamic = true;
  doorRight.userData.isDynamic = true;
  doorLeft.position.set(-1.54, 0, 0.04);
  doorRight.position.set(1.54, 0, 0.04);
  frontFrame.add(doorLeft, doorRight);

  // Left leaf (Full glass with sleek aluminum frame & brass handle)
  addBox(doorLeft, [0.77, 3.25, 0], [1.52, 0.10, 0.08], frameMat);
  addBox(doorLeft, [0.77, 0.08, 0], [1.52, 0.16, 0.08], frameMat);
  addBox(doorLeft, [0.05, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorLeft, [1.49, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorLeft, [0.77, 1.65, 0], [1.38, 3.10, 0.04], materials.glass);
  addCylinder(doorLeft, [1.38, 1.55, 0.06], 0.022, 0.022, 0.85, materials.brass);
  addCylinder(doorLeft, [1.38, 1.55, -0.06], 0.022, 0.022, 0.85, materials.brass);
  mergeSubtreeMeshes(doorLeft, false);

  // Right leaf (Full glass with sleek aluminum frame & brass handle)
  addBox(doorRight, [-0.77, 3.25, 0], [1.52, 0.10, 0.08], frameMat);
  addBox(doorRight, [-0.77, 0.08, 0], [1.52, 0.16, 0.08], frameMat);
  addBox(doorRight, [-0.05, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorRight, [-1.49, 1.65, 0], [0.10, 3.3, 0.08], frameMat);
  addBox(doorRight, [-0.77, 1.65, 0], [1.38, 3.10, 0.04], materials.glass);
  addCylinder(doorRight, [-1.38, 1.55, 0.06], 0.022, 0.022, 0.85, materials.brass);
  addCylinder(doorRight, [-1.38, 1.55, -0.06], 0.022, 0.022, 0.85, materials.brass);
  mergeSubtreeMeshes(doorRight, false);

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
    radius: 3.8,
    controls: frontControls,
    action: () => {
      const manager = window.__worldInteractions;
      if (manager) {
        const ok = manager.toggleDoor(frontControls, window.__playerCameraState ? window.__playerCameraState() : {});
        if (ok) return true;
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
  rearDoorLeft.userData.isDynamic = true;
  rearDoorRight.userData.isDynamic = true;
  rearDoorLeft.position.set(-1.2, 0, -0.02);
  rearDoorRight.position.set(1.2, 0, 0.02);
  rearGroup.add(rearDoorLeft, rearDoorRight);

  // Left sliding leaf (width 2.40m, height 4.22m, full glass)
  addBox(rearDoorLeft, [0, 2.16, 0], [2.28, 4.12, 0.05], materials.glass);
  addBox(rearDoorLeft, [0, 4.24, 0], [2.38, 0.08, 0.08], frameMat);
  addBox(rearDoorLeft, [0, 0.06, 0], [2.38, 0.12, 0.08], frameMat);
  addBox(rearDoorLeft, [-1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addBox(rearDoorLeft, [1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addCylinder(rearDoorLeft, [0.95, 1.8, 0.055], 0.024, 0.024, 0.95, materials.brass);
  addCylinder(rearDoorLeft, [0.95, 1.8, -0.055], 0.024, 0.024, 0.95, materials.brass);
  mergeSubtreeMeshes(rearDoorLeft, false);

  // Right sliding leaf (width 2.40m, height 4.22m, full glass)
  addBox(rearDoorRight, [0, 2.16, 0], [2.28, 4.12, 0.05], materials.glass);
  addBox(rearDoorRight, [0, 4.24, 0], [2.38, 0.08, 0.08], frameMat);
  addBox(rearDoorRight, [0, 0.06, 0], [2.38, 0.12, 0.08], frameMat);
  addBox(rearDoorRight, [-1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addBox(rearDoorRight, [1.15, 2.16, 0], [0.08, 4.24, 0.08], frameMat);
  addCylinder(rearDoorRight, [-0.95, 1.8, 0.055], 0.024, 0.024, 0.95, materials.brass);
  addCylinder(rearDoorRight, [-0.95, 1.8, -0.055], 0.024, 0.024, 0.95, materials.brass);
  mergeSubtreeMeshes(rearDoorRight, false);

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

  // -----------------------------------------------------------------
  // 3. SECOND FLOOR BALCONY FULL-GLASS DOORS (z = 3.75, y = 5.22, x: [-1.6, 1.6])
  // -----------------------------------------------------------------
  const balconyFrame = new THREE.Group();
  balconyFrame.position.set(0, 5.22, 3.75);
  scene.add(balconyFrame);

  // Modern architectural portal frame
  addBox(balconyFrame, [-1.65, 1.62, 0], [0.18, 3.24, 0.22], frameMat);
  addBox(balconyFrame, [1.65, 1.62, 0], [0.18, 3.24, 0.22], frameMat);
  addBox(balconyFrame, [0, 3.28, 0], [3.48, 0.16, 0.24], frameMat);

  const balconyDoorLeft = new THREE.Group();
  const balconyDoorRight = new THREE.Group();
  balconyDoorLeft.userData.isDynamic = true;
  balconyDoorRight.userData.isDynamic = true;
  balconyDoorLeft.position.set(-1.54, 0, 0.04);
  balconyDoorRight.position.set(1.54, 0, 0.04);
  balconyFrame.add(balconyDoorLeft, balconyDoorRight);

  // Left leaf (Full glass with sleek aluminum frame & brass handle)
  addBox(balconyDoorLeft, [0.77, 2.95, 0], [1.52, 0.10, 0.08], frameMat);
  addBox(balconyDoorLeft, [0.77, 0.08, 0], [1.52, 0.16, 0.08], frameMat);
  addBox(balconyDoorLeft, [0.05, 1.50, 0], [0.10, 3.0, 0.08], frameMat);
  addBox(balconyDoorLeft, [1.49, 1.50, 0], [0.10, 3.0, 0.08], frameMat);
  addBox(balconyDoorLeft, [0.77, 1.50, 0], [1.38, 2.80, 0.04], materials.glass);
  addCylinder(balconyDoorLeft, [1.38, 1.40, 0.06], 0.022, 0.022, 0.85, materials.brass);
  addCylinder(balconyDoorLeft, [1.38, 1.40, -0.06], 0.022, 0.022, 0.85, materials.brass);
  mergeSubtreeMeshes(balconyDoorLeft, false);

  // Right leaf (Full glass with sleek aluminum frame & brass handle)
  addBox(balconyDoorRight, [-0.77, 2.95, 0], [1.52, 0.10, 0.08], frameMat);
  addBox(balconyDoorRight, [-0.77, 0.08, 0], [1.52, 0.16, 0.08], frameMat);
  addBox(balconyDoorRight, [-0.05, 1.50, 0], [0.10, 3.0, 0.08], frameMat);
  addBox(balconyDoorRight, [-1.49, 1.50, 0], [0.10, 3.0, 0.08], frameMat);
  addBox(balconyDoorRight, [-0.77, 1.50, 0], [1.38, 2.80, 0.04], materials.glass);
  addCylinder(balconyDoorRight, [-1.38, 1.40, 0.06], 0.022, 0.022, 0.85, materials.brass);
  addCylinder(balconyDoorRight, [-1.38, 1.40, -0.06], 0.022, 0.022, 0.85, materials.brass);
  mergeSubtreeMeshes(balconyDoorRight, false);

  const balconyColliders = [];
  if (world && RAPIER) {
    for (const x of [-0.77, 0.77]) {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 5.22 + 1.50, 3.8));
      const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(0.77, 1.50, 0.1), body);
      balconyColliders.push(collider);
    }
  }

  let balconyState = 'closed';
  let balconyFrom = 0;
  let balconyTo = 0;
  let balconyClock = 0;
  let balconyPendingCallback = null;

  const setBalconyAngle = (a) => {
    balconyDoorLeft.rotation.y = -a;
    balconyDoorRight.rotation.y = a;
  };
  const currentBalconyAngle = () => balconyDoorRight.rotation.y;

  const finishBalcony = () => {
    setBalconyAngle(balconyTo);
    balconyState = balconyTo > 0 ? 'open' : 'closed';
    if (balconyState === 'closed') {
      for (const collider of balconyColliders) collider.setEnabled(true);
    }
    const cb = balconyPendingCallback;
    balconyPendingCallback = null;
    if (cb) cb(balconyState === 'open');
  };

  const updateBalcony = (dt) => {
    if (balconyState !== 'opening' && balconyState !== 'closing') return;
    balconyClock += dt;
    const t = Math.min(1, balconyClock / DOOR_DURATION);
    setBalconyAngle(balconyFrom + (balconyTo - balconyFrom) * easeInOut(t));
    if (t >= 1) finishBalcony();
  };

  const toggleBalcony = (onComplete) => {
    if (balconyState === 'opening' || balconyState === 'closing') return false;
    const opening = balconyState === 'closed';
    balconyFrom = currentBalconyAngle();
    balconyTo = opening ? OPEN_ANGLE : 0;
    balconyClock = 0;
    balconyState = opening ? 'opening' : 'closing';
    balconyPendingCallback = onComplete || null;
    if (opening) {
      for (const collider of balconyColliders) collider.setEnabled(false);
    }
    return true;
  };

  const settleBalcony = () => {
    if (balconyState === 'opening' || balconyState === 'closing') finishBalcony();
  };

  const balconyControls = {
    toggle: toggleBalcony,
    settle: settleBalcony,
    update: updateBalcony,
    isOpen: () => balconyState === 'open',
    isBusy: () => balconyState === 'opening' || balconyState === 'closing',
    getState: () => balconyState,
    panels: { doorLeft: balconyDoorLeft, doorRight: balconyDoorRight },
    hingeWorld: () => ({
      left: balconyDoorLeft.getWorldPosition(new THREE.Vector3()),
      right: balconyDoorRight.getWorldPosition(new THREE.Vector3()),
    }),
  };

  interactionPoints.push({
    id: 'door_balcony',
    type: 'door',
    title: 'Balcony glass doors',
    position: new THREE.Vector3(0, 5.9, 3.8),
    radius: 3.5,
    controls: balconyControls,
    action: () => toggleBalcony(),
    getLabel: () => {
      if (balconyState === 'opening') return 'Opening balcony glass doors...';
      if (balconyState === 'closing') return 'Closing balcony glass doors...';
      return balconyState === 'open' ? 'Close balcony glass doors' : 'Open balcony glass doors';
    },
  });

  // -----------------------------------------------------------------
  // 4. OVERHEAD SECTIONAL GLASS GARAGE DOOR (x: 21.0, z = 3.80)
  // Opens upwards into the garage ceiling along curved overhead tracks
  // -----------------------------------------------------------------
  const garageFrameGroup = new THREE.Group();
  scene.add(garageFrameGroup);

  // Vertical Guide Rails / Tracks (running from floor y = 0.06 to header y = 4.15)
  // Left jamb vertical track at x = 16.74, z = 3.80
  addBox(garageFrameGroup, [16.74, 2.10, 3.80], [0.08, 4.10, 0.12], frameMat);
  addBox(garageFrameGroup, [16.77, 2.10, 3.80], [0.04, 4.10, 0.05], materials.metalDark);
  // Right jamb vertical track at x = 25.26, z = 3.80
  addBox(garageFrameGroup, [25.26, 2.10, 3.80], [0.08, 4.10, 0.12], frameMat);
  addBox(garageFrameGroup, [25.23, 2.10, 3.80], [0.04, 4.10, 0.05], materials.metalDark);

  // Horizontal Ceiling Guide Tracks (extending 4.3m back into garage ceiling at y = 4.18)
  addBox(garageFrameGroup, [16.74, 4.18, 1.65], [0.08, 0.06, 4.30], frameMat);
  addBox(garageFrameGroup, [25.26, 4.18, 1.65], [0.08, 0.06, 4.30], frameMat);

  // Ceiling Steel Hanger Brackets supporting the horizontal tracks from y = 5.10
  for (const hangZ of [2.8, 0.6]) {
    addBox(garageFrameGroup, [16.74, 4.64, hangZ], [0.04, 0.92, 0.04], frameMat);
    addBox(garageFrameGroup, [25.26, 4.64, hangZ], [0.04, 0.92, 0.04], frameMat);
  }

  // Torsion Spring Assembly & Central Motor Unit above the header (y = 4.30, z = 3.65)
  addCylinder(garageFrameGroup, [21.0, 4.30, 3.65], 0.035, 0.035, 8.4, frameMat, { segments: 12 }, [0, 0, Math.PI / 2]);
  addCylinder(garageFrameGroup, [17.5, 4.30, 3.65], 0.065, 0.065, 0.75, materials.metalDark, { segments: 12 }, [0, 0, Math.PI / 2]);
  addCylinder(garageFrameGroup, [24.5, 4.30, 3.65], 0.065, 0.065, 0.75, materials.metalDark, { segments: 12 }, [0, 0, Math.PI / 2]);
  // Commercial electric door opener motor
  addBox(garageFrameGroup, [21.0, 4.32, 3.42], [0.65, 0.32, 0.50], materials.metalDark);
  addBox(garageFrameGroup, [21.0, 4.24, 3.16], [0.24, 0.10, 0.04], materials.goldBrass);
  addBox(garageFrameGroup, [21.0, 4.32, 1.80], [0.06, 0.06, 3.50], frameMat);

  // Wall-Mounted Control Station with Illuminated LED Status (x = 16.35, y = 1.35, z = 3.86)
  addBox(garageFrameGroup, [16.35, 1.35, 3.86], [0.16, 0.26, 0.03], materials.metalDark);
  addBox(garageFrameGroup, [16.35, 1.35, 3.87], [0.18, 0.28, 0.01], materials.brass);
  const garageIndicator = addBox(garageFrameGroup, [16.35, 1.35, 3.88], [0.07, 0.07, 0.02], materials.glow);

  // 4 Horizontal Sectional Glass Panels (each 1.01m tall, 8.44m wide)
  const garagePanels = [];
  const PANEL_WIDTH = 8.44;
  const PANEL_HEIGHT = 1.01;
  const MULLION_X = [-2.50, -0.83, 0.83, 2.50];
  const PANE_CENTERS = [-3.34, -1.67, 0, 1.67, 3.34];

  for (let k = 0; k < 4; k += 1) {
    const panelGroup = new THREE.Group();
    panelGroup.userData.isDynamic = true;

    // Perimeter Aluminum Frame
    addBox(panelGroup, [0, 0.46, 0], [PANEL_WIDTH, 0.08, 0.06], frameMat);
    addBox(panelGroup, [0, -0.46, 0], [PANEL_WIDTH, 0.08, 0.06], frameMat);
    addBox(panelGroup, [-4.18, 0, 0], [0.08, 0.98, 0.06], frameMat);
    addBox(panelGroup, [4.18, 0, 0], [0.08, 0.98, 0.06], frameMat);

    // 4 Intermediate Vertical Mullions (creating 5 panoramic bays)
    for (const mx of MULLION_X) {
      addBox(panelGroup, [mx, 0, 0], [0.06, 0.88, 0.05], frameMat);
    }

    // 5 Tinted Architectural Glass Panes
    for (const cx of PANE_CENTERS) {
      addBox(panelGroup, [cx, 0, 0], [1.58, 0.86, 0.03], materials.garageGlass, { shadow: false });
    }

    // Heavy-duty side roller shafts
    addCylinder(panelGroup, [-4.22, 0.40, 0], 0.022, 0.022, 0.06, materials.metalDark, { segments: 8 }, [0, 0, Math.PI / 2]);
    addCylinder(panelGroup, [4.22, 0.40, 0], 0.022, 0.022, 0.06, materials.metalDark, { segments: 8 }, [0, 0, Math.PI / 2]);

    // Bottom Panel (k = 0): Rubber weather seal and center lift handle
    if (k === 0) {
      addBox(panelGroup, [0, -0.49, 0], [PANEL_WIDTH, 0.06, 0.08], materials.metalDark);
      addBox(panelGroup, [0, -0.32, 0.05], [0.36, 0.04, 0.04], materials.brass);
    }

    mergeSubtreeMeshes(panelGroup, false);
    scene.add(panelGroup);
    garagePanels.push(panelGroup);
  }

  // Rapier Static Physical Collider across the garage opening (active when closed)
  const garageColliders = [];
  if (world && RAPIER) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(21.0, 2.05, 3.80));
    const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(4.25, 2.05, 0.15), body);
    garageColliders.push(collider);
    if (doorColliders) doorColliders.push(collider);
  }

  // Kinematic Door Slide State
  let garageState = 'closed';
  let garageFrom = 0;
  let garageTo = 0;
  let garageClock = 0;
  let garagePendingCallback = null;
  const GARAGE_DURATION = 1.35;

  const setGarageSlide = (progress) => {
    const eased = easeInOut(progress);
    const d = 4.30 * eased; // Travel distance along track

    for (let k = 0; k < 4; k += 1) {
      const panel = garagePanels[k];
      const s = 0.52 + k * 1.01 + d;

      let y, z, rotX;
      if (s <= 3.65) {
        // Vertical lift path
        y = s;
        z = 3.80;
        rotX = 0;
      } else if (s <= 4.25) {
        // 90-degree curved bend into ceiling
        const u = (s - 3.65) / 0.60;
        const alpha = u * (Math.PI * 0.5);
        y = 3.65 + 0.50 * Math.sin(alpha);
        z = 3.80 - 0.50 * (1 - Math.cos(alpha));
        rotX = -alpha;
      } else {
        // Overhead horizontal ceiling track
        const h = s - 4.25;
        y = 4.15;
        z = 3.30 - h;
        rotX = -Math.PI * 0.5;
      }

      panel.position.set(21.0, y, z);
      panel.rotation.set(rotX, 0, 0);
    }
  };

  // Initialize panels in closed position
  setGarageSlide(0);

  const playGarageSound = (opening) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const base = opening ? 120 : 100;
      osc.frequency.setValueAtTime(base, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(base + (opening ? 22 : -15), ctx.currentTime + 1.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.4);
    } catch {}
  };

  const finishGarage = () => {
    setGarageSlide(garageTo);
    garageState = garageTo > 0 ? 'open' : 'closed';
    if (garageState === 'closed') {
      for (const col of garageColliders) col.setEnabled(true);
    }
    const cb = garagePendingCallback;
    garagePendingCallback = null;
    if (cb) cb(garageState === 'open');
  };

  const updateGarage = (dt) => {
    if (garageState !== 'opening' && garageState !== 'closing') return;
    garageClock += dt;
    const t = Math.min(1, garageClock / GARAGE_DURATION);
    setGarageSlide(garageFrom + (garageTo - garageFrom) * t);
    if (t >= 1) finishGarage();
  };

  const toggleGarage = (onComplete) => {
    if (garageState === 'opening' || garageState === 'closing') return false;
    const opening = garageState === 'closed';
    garageFrom = garageState === 'closed' ? 0 : 1;
    garageTo = opening ? 1 : 0;
    garageClock = 0;
    garageState = opening ? 'opening' : 'closing';
    garagePendingCallback = onComplete || null;

    // Immediately disable collider when opening to allow character walkthrough
    if (opening) {
      for (const col of garageColliders) col.setEnabled(false);
    }

    playGarageSound(opening);
    return true;
  };

  const settleGarage = () => {
    if (garageState === 'opening' || garageState === 'closing') finishGarage();
  };

  const garageControls = {
    toggle: toggleGarage,
    settle: settleGarage,
    update: updateGarage,
    isOpen: () => garageState === 'open',
    isBusy: () => garageState === 'opening' || garageState === 'closing',
    getState: () => garageState,
    panels: garagePanels,
  };

  interactionPoints.push({
    id: 'door_garage',
    type: 'door',
    title: 'Garage overhead glass door',
    position: new THREE.Vector3(21.0, 1.2, 3.80),
    radius: 4.8,
    controls: garageControls,
    action: () => toggleGarage(),
    getLabel: () => {
      if (garageState === 'opening') return 'Opening garage door...';
      if (garageState === 'closing') return 'Closing garage door...';
      return garageState === 'open' ? 'Close garage door' : 'Open garage door';
    },
  });

  return {
    front: frontControls,
    rear: rearControls,
    balcony: balconyControls,
    garage: garageControls,
    toggle: (cb) => frontControls.toggle(cb),
    settle: () => { frontControls.settle(); rearControls.settle(); balconyControls.settle(); garageControls.settle(); },
    update: (dt) => { frontControls.update(dt); rearControls.update(dt); balconyControls.update(dt); garageControls.update(dt); },
    isOpen: () => frontControls.isOpen() || rearControls.isOpen() || balconyControls.isOpen() || garageControls.isOpen(),
    isBusy: () => frontControls.isBusy() || rearControls.isBusy() || balconyControls.isBusy() || garageControls.isBusy(),
    getState: () => frontControls.getState(),
    panels: {
      doorLeft,
      doorRight,
      rearDoorLeft,
      rearDoorRight,
      balconyDoorLeft,
      balconyDoorRight,
      garagePanels,
    },
    hingeWorld: frontControls.hingeWorld,
  };
}
