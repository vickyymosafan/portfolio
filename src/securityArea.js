import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addCylinder, addSphere, BatchCollector } from './geometry.js';

/**
 * Creates Zone I: Perimeter Wall, Main Security Checkpoint,
 * Monument Wall, Guardhouse & External Public Highway
 * Spans x: [-48.0, 48.0], z: [23.0, 42.0]
 */
export function createSecurityArea(scene, world, RAPIER, staticBodies) {
  const securityGroup = new THREE.Group();
  scene.add(securityGroup);
  const batch = new BatchCollector();
  const animatedGuards = [];

  // =========================================================================
  // 1. External Public Highway & Sidewalk (z: [26.0, 42.0])
  // =========================================================================
  // Raised concrete sidewalk in front of estate wall (z: [25.0, 29.5], x: [-48.0, 48.0])
  batch.addBox([0, 0.1, 27.25], [96.0, 0.2, 4.5], materials.curbConcrete);
  // Concrete curb drop facing roadway (z = 29.5)
  batch.addBox([0, 0.12, 29.5], [96.0, 0.24, 0.35], materials.stoneWarm);

  // Main 2-lane asphalt public highway (z: [29.6, 41.5], x: [-52.0, 52.0])
  batch.addBox([0, 0.02, 35.5], [104.0, 0.04, 11.8], materials.asphaltRoad);

  // Painted road markings: Center double dashed yellow lines
  for (let x = -50.0; x <= 50.0; x += 4.5) {
    // Leave gap for pedestrian crosswalk (x: [-4.0, 4.0])
    if (x > -5.0 && x < 5.0) continue;
    batch.addBox([x, 0.045, 35.35], [2.6, 0.008, 0.18], materials.asphaltMarkingYellow);
    batch.addBox([x, 0.045, 35.65], [2.6, 0.008, 0.18], materials.asphaltMarkingYellow);
  }

  // White road edge solid shoulder lines
  batch.addBox([0, 0.045, 30.2], [104.0, 0.008, 0.2], materials.asphaltMarkingWhite);
  batch.addBox([0, 0.045, 40.8], [104.0, 0.008, 0.2], materials.asphaltMarkingWhite);

  // Pedestrian Zebra Crosswalk in front of estate main gate (x: [-3.8, 3.8], z: [30.0, 41.0])
  for (let cz = 30.5; cz <= 40.5; cz += 1.4) {
    batch.addBox([0, 0.048, cz], [7.2, 0.008, 0.75], materials.asphaltMarkingWhite);
  }

  // Roadway Street Light Poles (Modern curved LED cobra-head poles at z = 29.0)
  const streetLightXs = [-42.0, -26.0, -10.0, 10.0, 26.0, 42.0];
  for (const lx of streetLightXs) {
    // Base pedestal
    batch.addBox([lx, 0.25, 29.0], [0.6, 0.5, 0.6], materials.metalDark);
    // Vertical mast
    batch.addCylinder([lx, 3.2, 29.0], 0.1, 0.16, 5.8, materials.metalDark);
    // Overhanging curved arm extending toward roadway (z = 31.5)
    batch.addBox([lx, 5.9, 30.2], [0.12, 0.12, 2.5], materials.metalDark, { rotation: [0.18, 0, 0] });
    // Cobra-head luminaire fixture
    batch.addBox([lx, 5.75, 31.4], [0.38, 0.14, 0.95], materials.metalDark);
    // Glowing LED emitter lens
    batch.addBox([lx, 5.68, 31.4], [0.28, 0.04, 0.75], materials.glow, { shadow: false });

    // Roadway spotlight
    const roadLight = new THREE.SpotLight(0xfff4db, 1.8, 18.0, Math.PI * 0.28, 0.45);
    roadLight.position.set(lx, 5.6, 31.4);
    roadLight.target.position.set(lx, 0, 35.5);
    securityGroup.add(roadLight);
    securityGroup.add(roadLight.target);

    // Pole physics collider
    const poleBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(lx, 3.0, 29.0));
    world.createCollider(RAPIER.ColliderDesc.cylinder(3.0, 0.3), poleBody);
    staticBodies.push(poleBody);
  }

  // =========================================================================
  // 2. White Luxury SUV Vehicle on Public Road (x = -18.0, z = 33.2)
  // =========================================================================
  const suvX = -18.0;
  const suvZ = 33.2;
  const suvRot = 0; // facing east along highway
  const suvGroup = new THREE.Group();
  suvGroup.position.set(suvX, 0, suvZ);
  securityGroup.add(suvGroup);

  const suvBatch = new BatchCollector();
  // Chassis lower skirt
  suvBatch.addBox([0, 0.35, 0], [4.8, 0.32, 2.1], materials.carRubber);
  // Lower bodywork
  suvBatch.addBox([0, 0.65, 0], [4.6, 0.45, 2.05], materials.carSuvWhite);
  // Hood and front fascia
  suvBatch.addBox([1.4, 0.85, 0], [1.6, 0.35, 1.95], materials.carSuvWhite);
  // Chrome front grille
  suvBatch.addBox([2.22, 0.75, 0], [0.08, 0.38, 1.4], materials.chrome);
  // LED Headlight strips
  suvBatch.addBox([2.18, 0.82, 0.72], [0.1, 0.14, 0.38], materials.glow, { shadow: false });
  suvBatch.addBox([2.18, 0.82, -0.72], [0.1, 0.14, 0.38], materials.glow, { shadow: false });
  // Cabin greenhouse & roof
  suvBatch.addBox([-0.4, 1.35, 0], [2.6, 0.72, 1.75], materials.carGlass);
  suvBatch.addBox([-0.4, 1.75, 0], [2.5, 0.08, 1.72], materials.carSuvWhite);
  // Roof rack rails
  suvBatch.addBox([-0.4, 1.83, 0.75], [2.2, 0.06, 0.06], materials.metalDark);
  suvBatch.addBox([-0.4, 1.83, -0.75], [2.2, 0.06, 0.06], materials.metalDark);
  // Rear tailgate and bumper
  suvBatch.addBox([-2.25, 0.68, 0], [0.18, 0.48, 1.98], materials.carSuvWhite);
  // Red LED taillights
  suvBatch.addBox([-2.32, 0.88, 0.72], [0.08, 0.15, 0.36], materials.fireEmber, { shadow: false });
  suvBatch.addBox([-2.32, 0.88, -0.72], [0.08, 0.15, 0.36], materials.fireEmber, { shadow: false });

  // 4 Alloy Wheels with rubber tires
  const wheelOffsets = [
    [1.4, 0.42, 1.05],
    [1.4, 0.42, -1.05],
    [-1.4, 0.42, 1.05],
    [-1.4, 0.42, -1.05],
  ];
  for (const [wx, wy, wz] of wheelOffsets) {
    suvBatch.addCylinder([wx, wy, wz], 0.42, 0.42, 0.28, materials.carRubber, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 16,
    });
    suvBatch.addCylinder([wx, wy, wz + (wz > 0 ? 0.06 : -0.06)], 0.28, 0.28, 0.18, materials.chrome, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 12,
    });
  }
  suvBatch.build(suvGroup, true);

  // SUV physics collider
  const suvBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(suvX, 0.9, suvZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.4, 0.9, 1.1), suvBody);
  staticBodies.push(suvBody);

  // =========================================================================
  // 3. Grand Monument Entrance Wall & Welcome Wall (z = 24.5)
  // =========================================================================
  // Main Entrance Monument: "VICKY'S WORLD" (x: [2.5, 10.5], z = 24.5)
  const monX = 6.5;
  const monZ = 24.5;
  // Tiered stone foundation plinth
  batch.addBox([monX, 0.25, monZ], [8.4, 0.5, 1.4], materials.foundation);
  // Main stone pylon wall
  batch.addBox([monX, 1.7, monZ], [8.0, 2.4, 0.95], materials.monumentWall);
  // Overhanging classical cornice cap
  batch.addBox([monX, 2.98, monZ], [8.5, 0.18, 1.25], materials.trim);

  // Inset bronze plaque with texture: VICKY'S WORLD - DEVELOPER • CREATOR • EXPLORER
  // South-facing plaque (facing outward to road)
  batch.addBox([monX, 1.75, monZ + 0.5], [6.8, 1.8, 0.06], materials.monumentSignMain);

  // Tiered planter boxes with colorful flowers in front of monument
  batch.addBox([monX, 0.35, monZ + 1.15], [7.8, 0.45, 0.65], materials.stoneWarm);
  batch.addBox([monX, 0.58, monZ + 1.15], [7.5, 0.08, 0.5], materials.soil);
  for (let f = -3.4; f <= 3.4; f += 0.85) {
    batch.addSphere([monX + f, 0.72, monZ + 1.15], [0.28, 0.2, 0.28], (Math.abs(f) % 1.7 < 0.5) ? materials.yellowSun : materials.coral);
  }

  // Monument twin decorative stone columns with brass carriage lanterns
  for (const sx of [-4.1, 4.1]) {
    batch.addBox([monX + sx, 1.8, monZ], [0.85, 2.8, 1.1], materials.foundation);
    batch.addBox([monX + sx, 3.25, monZ], [0.95, 0.15, 1.15], materials.trim);
    // Lantern
    batch.addBox([monX + sx, 3.65, monZ], [0.34, 0.5, 0.34], materials.glass);
    batch.addSphere([monX + sx, 3.65, monZ], [0.1, 0.14, 0.1], materials.glow, { shadow: false });
    batch.addCylinder([monX + sx, 3.98, monZ], 0.02, 0.38, 0.16, materials.brass, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });

    const mLight = new THREE.PointLight(0xffdfa0, 1.2, 8.0, 2.0);
    mLight.position.set(monX + sx, 3.65, monZ);
    securityGroup.add(mLight);
  }

  // Monument wall physics collider
  const monBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(monX, 1.5, monZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(4.3, 1.5, 0.7), monBody);
  staticBodies.push(monBody);

  // East Welcome Wing Wall: "Welcome to VICKY MOSAFAN" (x: [18.0, 28.5], z = 24.5)
  const welX = 23.2;
  batch.addBox([welX, 0.22, monZ], [10.5, 0.44, 1.1], materials.foundation);
  batch.addBox([welX, 1.5, monZ], [10.0, 2.1, 0.75], materials.monumentWall);
  batch.addBox([welX, 2.62, monZ], [10.4, 0.14, 0.95], materials.trim);
  // Inset welcome plaque
  batch.addBox([welX, 1.55, monZ + 0.4], [7.2, 1.6, 0.06], materials.monumentSignWelcome);

  const welBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(welX, 1.3, monZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(5.2, 1.3, 0.5), welBody);
  staticBodies.push(welBody);

  // =========================================================================
  // 4. Main Entrance Gate Piers & Black Wrought Iron Gates (x: [-4.2, 4.2], z = 24.5)
  // =========================================================================
  // Twin monumental gate piers flanking driveway entry
  const gatePierXs = [-4.8, 1.8]; // left of driveway, right of driveway (driveway connects at x: [-4.0, 1.0])
  for (const gpx of gatePierXs) {
    batch.addBox([gpx, 0.3, monZ], [1.1, 0.6, 1.1], materials.foundation);
    batch.addBox([gpx, 2.1, monZ], [0.95, 3.0, 0.95], materials.column);
    batch.addBox([gpx, 3.65, monZ], [1.15, 0.16, 1.15], materials.trim);
    // Grand spherical brass finial with carriage lantern
    batch.addSphere([gpx, 3.9, monZ], [0.22, 0.22, 0.22], materials.brass);
    batch.addBox([gpx, 4.25, monZ], [0.38, 0.52, 0.38], materials.glass);
    batch.addSphere([gpx, 4.25, monZ], [0.12, 0.16, 0.12], materials.glow, { shadow: false });
    batch.addCylinder([gpx, 4.58, monZ], 0.02, 0.42, 0.15, materials.metalDark, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });

    const pierLight = new THREE.PointLight(0xffe6a3, 1.5, 9.0, 1.8);
    pierLight.position.set(gpx, 4.25, monZ);
    securityGroup.add(pierLight);

    const pierBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(gpx, 2.0, monZ));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.55, 2.0, 0.55), pierBody);
    staticBodies.push(pierBody);
  }

  // Grand open wrought-iron gate leaves swinging inward (clear opening 5.5m)
  // Left gate leaf swung open at angle
  batch.addBox([-4.2, 1.6, 23.2], [0.08, 2.6, 2.2], materials.metalDark);
  // Gate decorative vertical iron bars
  for (let bz = 22.2; bz <= 24.2; bz += 0.3) {
    batch.addCylinder([-4.2, 1.6, bz], 0.025, 0.025, 2.5, materials.metalDark);
    batch.addSphere([-4.2, 2.9, bz], [0.04, 0.06, 0.04], materials.brass);
  }
  // Right gate leaf swung open at angle
  batch.addBox([1.2, 1.6, 23.2], [0.08, 2.6, 2.2], materials.metalDark);
  for (let bz = 22.2; bz <= 24.2; bz += 0.3) {
    batch.addCylinder([1.2, 1.6, bz], 0.025, 0.025, 2.5, materials.metalDark);
    batch.addSphere([1.2, 2.9, bz], [0.04, 0.06, 0.04], materials.brass);
  }

  // =========================================================================
  // 5. Security Guardhouse (Pos Satpam) (x: [-14.5, -9.5], z: [23.5, 27.5])
  // =========================================================================
  const ghX = -12.0;
  const ghZ = 25.5;
  // Raised stone foundation
  batch.addBox([ghX, 0.22, ghZ], [5.2, 0.44, 4.2], materials.foundation);
  // Stucco walls
  batch.addBox([ghX, 1.7, ghZ], [4.8, 2.5, 3.8], materials.securityBoothWall);
  // Flat overhanging roof with metal fascia
  batch.addBox([ghX, 3.05, ghZ], [5.8, 0.22, 4.8], materials.securityBoothRoof);
  // Modern roof parapet
  batch.addBox([ghX, 3.22, ghZ], [5.6, 0.14, 4.6], materials.trim);

  // Large glass inspection windows on front (South) and East (facing entrance driveway)
  // South window (facing road)
  batch.addBox([ghX, 1.75, ghZ + 1.92], [2.8, 1.25, 0.06], materials.glass);
  // East window (watching cars enter gate)
  batch.addBox([ghX + 2.42, 1.75, ghZ], [0.06, 1.25, 2.4], materials.glass);

  // Guardhouse entry door on West side
  batch.addBox([ghX - 2.42, 1.35, ghZ], [0.08, 2.2, 1.1], materials.woodDark);

  // Interior Security Desk & CCTV Monitors
  batch.addBox([ghX + 1.2, 0.85, ghZ + 0.8], [1.6, 0.75, 1.4], materials.woodWarm);
  // 3 CCTV Monitor screens glowing
  batch.addBox([ghX + 1.2, 1.45, ghZ + 1.2], [0.75, 0.45, 0.06], materials.screenCode);
  batch.addBox([ghX + 1.85, 1.45, ghZ + 0.7], [0.06, 0.45, 0.65], materials.screenTerminal);

  // Warm ceiling downlight inside guardhouse
  const ghLight = new THREE.PointLight(0xffdf99, 1.4, 7.0, 1.8);
  ghLight.position.set(ghX, 2.6, ghZ);
  securityGroup.add(ghLight);

  // Guardhouse exterior signage: "SECURITY 24/7" badge
  batch.addBox([ghX + 2.45, 2.55, ghZ], [0.04, 0.38, 1.4], materials.metalDark);
  batch.addBox([ghX + 2.47, 2.55, ghZ], [0.02, 0.32, 1.3], materials.asphaltMarkingWhite);

  // Guardhouse physics collider
  const ghBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(ghX, 1.5, ghZ));
  world.createCollider(RAPIER.ColliderDesc.cuboid(2.5, 1.5, 2.0), ghBody);
  staticBodies.push(ghBody);

  // =========================================================================
  // 6. Security Guard NPCs (Uniformed Guards)
  // =========================================================================
  function createGuardRig(gx, gz, rotY, isPatrol = false) {
    const rig = new THREE.Group();
    rig.position.set(gx, 0, gz);
    rig.rotation.y = rotY;
    securityGroup.add(rig);

    const gb = new BatchCollector();

    // Boots
    gb.addBox([-0.18, 0.12, 0], [0.22, 0.24, 0.38], materials.carRubber);
    gb.addBox([0.18, 0.12, 0], [0.22, 0.24, 0.38], materials.carRubber);
    // Dark uniform trousers
    gb.addCylinder([-0.18, 0.58, 0], 0.12, 0.14, 0.72, materials.guardUniform);
    gb.addCylinder([0.18, 0.58, 0], 0.12, 0.14, 0.72, materials.guardUniform);
    // Duty belt with holster and brass buckle
    gb.addBox([0, 0.98, 0], [0.65, 0.1, 0.45], materials.leatherDark);
    gb.addBox([0, 0.98, 0.23], [0.12, 0.08, 0.04], materials.guardBadge);
    gb.addBox([0.28, 0.95, 0.1], [0.12, 0.18, 0.12], materials.leatherDark); // Holster/pouch
    gb.addBox([-0.28, 0.98, 0.05], [0.08, 0.16, 0.08], materials.metalDark); // Radio
    // Torso in navy security shirt with pocket flaps & gold badge
    gb.addBox([0, 1.45, 0], [0.68, 0.85, 0.44], materials.guardUniform);
    gb.addBox([0.18, 1.58, 0.23], [0.1, 0.1, 0.02], materials.guardBadge); // Shield badge
    // Gold shoulder epaulets
    gb.addBox([-0.36, 1.82, 0], [0.16, 0.04, 0.22], materials.guardBadge);
    gb.addBox([0.36, 1.82, 0], [0.16, 0.04, 0.22], materials.guardBadge);
    // Arms (standing attentively)
    gb.addCylinder([-0.42, 1.35, 0.05], 0.1, 0.1, 0.7, materials.guardUniform, { rotation: [0.15, 0, 0.1] });
    gb.addCylinder([0.42, 1.35, 0.05], 0.1, 0.1, 0.7, materials.guardUniform, { rotation: [0.15, 0, -0.1] });
    // Hands
    gb.addSphere([-0.46, 0.95, 0.12], [0.09, 0.09, 0.09], materials.skin);
    gb.addSphere([0.46, 0.95, 0.12], [0.09, 0.09, 0.09], materials.skin);
    // Head & face
    gb.addSphere([0, 2.05, 0], [0.24, 0.26, 0.24], materials.skin);
    // Aviator sunglasses
    gb.addBox([0, 2.1, 0.22], [0.35, 0.1, 0.06], materials.glass);
    // Peaked Security Cap with gold chin strap & badge
    gb.addCylinder([0, 2.28, 0], 0.28, 0.26, 0.18, materials.guardCap);
    gb.addBox([0, 2.22, 0.24], [0.36, 0.04, 0.22], materials.guardCap, { rotation: [0.18, 0, 0] }); // Visor brim
    gb.addBox([0, 2.32, 0.25], [0.08, 0.08, 0.02], materials.guardBadge); // Cap badge

    gb.build(rig, true);

    // Static physics collider for standing guard
    const gBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(gx, 1.1, gz));
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.1, 0.35), gBody);
    staticBodies.push(gBody);

    return {
      group: rig,
      baseX: gx,
      baseZ: gz,
      isPatrol,
      clock: Math.random() * 10,
    };
  }

  // Guard 1: Standing at main gate checkpoint (x = -3.2, z = 25.2)
  animatedGuards.push(createGuardRig(-3.2, 25.2, 0, false));
  // Guard 2: Standing at guardhouse doorway (x = -15.2, z = 25.5)
  animatedGuards.push(createGuardRig(-15.2, 25.5, Math.PI * 0.5, false));

  // =========================================================================
  // 7. Outer Perimeter Wall & Security Fencing (x: [-48.0, 48.0], z = 24.5)
  // =========================================================================
  // Wall segments connecting to estate sides
  const wallSegments = [
    // West wing wall: from -48.0 to -15.5
    { x: -31.75, w: 32.5 },
    // Between guardhouse & gate: -9.0 to -5.5
    { x: -7.25, w: 3.5 },
    // Between monument & welcome: 11.0 to 18.0
    { x: 14.5, w: 7.0 },
    // East outer wall: 29.0 to 48.0
    { x: 38.5, w: 19.0 },
  ];

  for (const ws of wallSegments) {
    batch.addBox([ws.x, 0.2, monZ], [ws.w, 0.4, 0.65], materials.foundation);
    batch.addBox([ws.x, 1.25, monZ], [ws.w, 1.7, 0.45], materials.monumentWall);
    batch.addBox([ws.x, 2.15, monZ], [ws.w, 0.12, 0.6], materials.trim);

    const wBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(ws.x, 1.1, monZ));
    world.createCollider(RAPIER.ColliderDesc.cuboid(ws.w * 0.5, 1.1, 0.35), wBody);
    staticBodies.push(wBody);
  }

  // Southern World Boundary Wall along highway edge (z = 42.0)
  // Prevents falling off the world edge
  const southBoundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 1.5, 42.2));
  world.createCollider(RAPIER.ColliderDesc.cuboid(52.0, 1.5, 0.4), southBoundBody);
  staticBodies.push(southBoundBody);

  batch.build(securityGroup, true);

  return {
    group: securityGroup,
    update: (delta) => {
      for (const g of animatedGuards) {
        g.clock += delta;
        // Subtle natural breathing & posture shift
        g.group.position.y = Math.sin(g.clock * 2.0) * 0.008;
        if (!g.isPatrol) {
          // Slow head/torso scanning
          g.group.rotation.y += Math.sin(g.clock * 0.8) * 0.003;
        }
      }
    },
  };
}
