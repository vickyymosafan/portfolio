import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, BatchCollector } from './geometry.js';
import { BENCH } from './seatLayout.js';

function createRng(seed = 12345) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createCartoonTree(x, z, scale = 1, seed = 42) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  const rand = createRng(seed);
  const batch = new BatchCollector();

  // Raised garden earth base
  batch.addCylinder([0, 0.08 * scale, 0], 1.3 * scale, 1.5 * scale, 0.16 * scale, materials.soil);

  // Base border stones
  const stoneCount = 7;
  for (let i = 0; i < stoneCount; i += 1) {
    const angle = (i / stoneCount) * Math.PI * 2 + rand() * 0.4;
    const dist = (1.35 + rand() * 0.2) * scale;
    const sx = Math.cos(angle) * dist;
    const sz = Math.sin(angle) * dist;
    batch.addSphere([sx, 0.12 * scale, sz], [0.28 * scale, 0.18 * scale, 0.24 * scale], materials.stone, {
      rotation: [0, rand() * Math.PI, 0],
    });
  }

  // Tapered trunk with root flares
  const trunkHeight = 2.4 * scale;
  batch.addCylinder([0, trunkHeight * 0.5, 0], 0.26 * scale, 0.42 * scale, trunkHeight, materials.bark, {
    rotation: [0, 0, (rand() - 0.5) * 0.08],
  });

  // Root flares
  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + rand() * 0.3;
    const rx = Math.cos(angle) * 0.35 * scale;
    const rz = Math.sin(angle) * 0.35 * scale;
    batch.addCylinder([rx, 0.2 * scale, rz], 0.12 * scale, 0.24 * scale, 0.45 * scale, materials.bark, {
      rotation: [Math.sin(angle) * 0.4, 0, -Math.cos(angle) * 0.4],
    });
  }

  // Branches
  batch.addCylinder([-0.28 * scale, 2.1 * scale, 0.1 * scale], 0.14 * scale, 0.2 * scale, 1.1 * scale, materials.bark, {
    rotation: [-0.2, 0, 0.55],
  });
  batch.addCylinder([0.3 * scale, 2.25 * scale, -0.08 * scale], 0.13 * scale, 0.19 * scale, 1.05 * scale, materials.bark, {
    rotation: [0.22, 0, -0.52],
  });

  // Foliage puffs
  const foliageBaseY = 2.5 * scale;

  // Tier 1: Lower skirt
  const tier1Positions = [
    [-0.7 * scale, foliageBaseY + 0.2 * scale, 0.3 * scale, 1.0 * scale],
    [0.75 * scale, foliageBaseY + 0.3 * scale, -0.2 * scale, 1.05 * scale],
    [0.1 * scale, foliageBaseY + 0.1 * scale, -0.8 * scale, 0.95 * scale],
    [-0.1 * scale, foliageBaseY + 0.25 * scale, 0.8 * scale, 1.02 * scale],
  ];
  for (const [px, py, pz, sz] of tier1Positions) {
    batch.addSphere([px, py, pz], [sz, sz * 0.82, sz], materials.foliageDeep, {
      rotation: [0, rand() * Math.PI, 0],
    });
  }

  // Tier 2: Mid crown
  const tier2Positions = [
    [0, foliageBaseY + 0.9 * scale, 0, 1.25 * scale],
    [-0.6 * scale, foliageBaseY + 1.0 * scale, -0.4 * scale, 0.95 * scale],
    [0.6 * scale, foliageBaseY + 0.95 * scale, 0.45 * scale, 1.0 * scale],
    [-0.4 * scale, foliageBaseY + 0.85 * scale, 0.6 * scale, 0.9 * scale],
  ];
  for (const [px, py, pz, sz] of tier2Positions) {
    batch.addSphere([px, py, pz], [sz, sz * 0.85, sz], materials.foliageMid, {
      rotation: [0, rand() * Math.PI, 0],
    });
  }

  // Tier 3: Sunlit crest
  const tier3Positions = [
    [0.1 * scale, foliageBaseY + 1.7 * scale, 0.05 * scale, 0.95 * scale],
    [-0.3 * scale, foliageBaseY + 1.6 * scale, -0.2 * scale, 0.78 * scale],
    [0.35 * scale, foliageBaseY + 1.55 * scale, 0.25 * scale, 0.75 * scale],
  ];
  for (const [px, py, pz, sz] of tier3Positions) {
    batch.addSphere([px, py, pz], [sz, sz * 0.9, sz], materials.foliageBright, {
      rotation: [0, rand() * Math.PI, 0],
    });
  }

  // Fruit / blossom dots
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2 + rand() * 0.5;
    const rad = (0.9 + rand() * 0.3) * scale;
    const bx = Math.cos(angle) * rad;
    const bz = Math.sin(angle) * rad;
    const by = foliageBaseY + (0.7 + rand() * 0.9) * scale;
    batch.addSphere([bx, by, bz], [0.1 * scale, 0.1 * scale, 0.1 * scale], i % 2 === 0 ? materials.coral : materials.yellow);
  }

  batch.build(tree, true);
  return tree;
}

export function createCartoonBush(x, z, scale = 1, seed = 17) {
  const bush = new THREE.Group();
  bush.position.set(x, 0, z);
  const rand = createRng(seed);
  const batch = new BatchCollector();

  // Core base mound
  batch.addSphere([0, 0.42 * scale, 0], [0.85 * scale, 0.65 * scale, 0.8 * scale], materials.foliageDeep);

  // Side lobes
  const lobes = [
    [-0.45 * scale, 0.38 * scale, 0.2 * scale, 0.65 * scale, materials.foliageMid],
    [0.48 * scale, 0.4 * scale, -0.15 * scale, 0.68 * scale, materials.foliageMid],
    [-0.1 * scale, 0.35 * scale, -0.45 * scale, 0.62 * scale, materials.foliageDeep],
    [0.15 * scale, 0.42 * scale, 0.45 * scale, 0.66 * scale, materials.foliageMid],
    [0, 0.75 * scale, 0.05 * scale, 0.62 * scale, materials.foliageBright],
    [-0.2 * scale, 0.7 * scale, -0.1 * scale, 0.52 * scale, materials.foliageBright],
  ];
  for (const [lx, ly, lz, ls, mat] of lobes) {
    batch.addSphere([lx, ly, lz], [ls, ls * 0.88, ls], mat, {
      rotation: [0, rand() * Math.PI, 0],
    });
  }

  // Flower blossoms on bush
  const flowerCount = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < flowerCount; i += 1) {
    const angle = (i / flowerCount) * Math.PI * 2 + rand() * 0.4;
    const dist = (0.45 + rand() * 0.3) * scale;
    const fx = Math.cos(angle) * dist;
    const fz = Math.sin(angle) * dist;
    const fy = (0.55 + rand() * 0.35) * scale;
    batch.addSphere([fx, fy, fz], [0.08 * scale, 0.08 * scale, 0.08 * scale], rand() > 0.5 ? materials.pink : materials.cream);
  }

  batch.build(bush, true);
  return bush;
}

export function createFlowerBed(parent, x, z, width = 3, depth = 1.2, seed = 99) {
  const bed = new THREE.Group();
  bed.position.set(x, 0, z);
  parent.add(bed);
  const rand = createRng(seed);
  const batch = new BatchCollector();

  // Raised stone garden border & soil
  batch.addBox([0, 0.12, 0], [width, 0.24, depth], materials.stone);
  batch.addBox([0, 0.22, 0], [width - 0.24, 0.06, depth - 0.24], materials.soil);

  // Flowers
  const count = Math.floor(width * depth * 4.5);
  for (let i = 0; i < count; i += 1) {
    const fx = (rand() - 0.5) * (width - 0.5);
    const fz = (rand() - 0.5) * (depth - 0.5);
    const stemH = 0.25 + rand() * 0.18;
    // Green stem
    batch.addCylinder([fx, 0.22 + stemH * 0.5, fz], 0.02, 0.025, stemH, materials.foliageDeep);
    // Flower head
    const flowerMat = [materials.coral, materials.yellow, materials.pink, materials.purple, materials.cream][i % 5];
    batch.addSphere([fx, 0.22 + stemH + 0.04, fz], [0.09, 0.07, 0.09], flowerMat, {
      rotation: [0, rand() * Math.PI, 0],
    });
    // Center eye
    batch.addSphere([fx, 0.22 + stemH + 0.08, fz], [0.035, 0.035, 0.035], materials.yellow);
  }

  batch.build(bed, true);
  return bed;
}

export function createGardenPath(parent) {
  const pathGroup = new THREE.Group();
  parent.add(pathGroup);
  const rand = createRng(77);
  const batch = new BatchCollector();

  // Main gravel bed foundation (leads from front gate z = 16.5 to porch steps z = 8.0)
  batch.addBox([0, -0.02, 12.0], [5.4, 0.1, 10.5], materials.path);

  // Flagstone circular pavers down the central garden walkway
  for (let z = 16.0; z >= 8.2; z -= 1.25) {
    for (const offset of [-1.35, 0, 1.35]) {
      const px = offset + (rand() - 0.5) * 0.35;
      const pz = z + (rand() - 0.5) * 0.3;
      const sx = 0.65 + rand() * 0.25;
      const sz = 0.58 + rand() * 0.2;
      batch.addSphere([px, 0.045, pz], [sx, 0.07, sz], rand() > 0.4 ? materials.stone : materials.foundation, {
        rotation: [0, rand() * Math.PI, 0],
      });
    }
  }

  // Cross path in front of porch steps (z = 7.8)
  batch.addBox([0, -0.01, 6.8], [17.0, 0.09, 2.8], materials.path);
  for (let x = -7.5; x <= 7.5; x += 1.3) {
    if (Math.abs(x) < 0.6) continue;
    const px = x + (rand() - 0.5) * 0.25;
    const pz = 6.8 + (rand() - 0.5) * 0.3;
    const sx = 0.58 + rand() * 0.2;
    const sz = 0.55 + rand() * 0.2;
    batch.addSphere([px, 0.045, pz], [sx, 0.07, sz], materials.stone, {
      rotation: [0, rand() * Math.PI, 0],
    });
  }

  batch.build(pathGroup, true);
  return pathGroup;
}

export function createGardenFence(parent) {
  const fenceGroup = new THREE.Group();
  parent.add(fenceGroup);
  const batch = new BatchCollector();

  // Left and Right Boundary Picket Fences (x = ±16.8 to frame 28m house)
  for (const side of [-1, 1]) {
    const x = side * 16.8;
    // Stone foundation curb
    batch.addBox([x, 0.15, -6.0], [0.4, 0.3, 34], materials.stone);

    // Fence Posts & Rails
    for (let z = -22.5; z <= 10.5; z += 2.4) {
      batch.addBox([x, 0.75, z], [0.22, 1.1, 0.22], materials.trim);
      batch.addCylinder([x, 1.34, z], 0.02, 0.16, 0.16, materials.trim, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });

      // Warm lantern on alternating posts
      if (Math.abs(z % 4.8) < 0.5) {
        batch.addCylinder([x - side * 0.22, 1.05, z], 0.03, 0.03, 0.3, materials.brass);
        batch.addBox([x - side * 0.28, 1.2, z], [0.18, 0.24, 0.18], materials.brass);
        addSphere(fenceGroup, [x - side * 0.28, 1.2, z], [0.12, 0.14, 0.12], materials.glow, { shadow: false });
      }
    }

    // Horizontal rails
    batch.addBox([x, 0.52, -6.0], [0.12, 0.1, 33], materials.trim);
    batch.addBox([x, 0.95, -6.0], [0.12, 0.1, 33], materials.trim);

    // Vertical pickets
    for (let z = -22; z <= 10; z += 0.48) {
      batch.addBox([x + side * 0.08, 0.76, z], [0.06, 0.78, 0.18], materials.trim);
      batch.addCylinder([x + side * 0.08, 1.18, z], 0.01, 0.09, 0.12, materials.trim, { segments: 4 });
    }
  }

  // Front Entrance Gate Posts with Handcrafted Carriage Lanterns (x = ±3.4 at z = 16.5)
  for (const side of [-1, 1]) {
    const gx = side * 3.4;
    // Layered stone pillar with decorative capital
    batch.addBox([gx, 0.95, 16.5], [0.72, 1.9, 0.72], materials.stone);
    batch.addBox([gx, 1.94, 16.5], [0.86, 0.12, 0.86], materials.trim);
    batch.addBox([gx, 2.03, 16.5], [0.56, 0.08, 0.56], materials.trim);

    // Cast iron lantern pedestal
    batch.addCylinder([gx, 2.11, 16.5], 0.16, 0.22, 0.08, materials.metalDark, { segments: 12 });

    // Lantern glass enclosure & dark corner posts
    batch.addBox([gx, 2.42, 16.5], [0.36, 0.52, 0.36], materials.glass);
    for (const cx of [-1, 1]) {
      for (const cz of [-1, 1]) {
        batch.addBox([gx + cx * 0.17, 2.42, 16.5 + cz * 0.17], [0.035, 0.52, 0.035], materials.metalDark);
      }
    }

    // Warm glowing candle inside
    addSphere(fenceGroup, [gx, 2.4, 16.5], [0.09, 0.14, 0.09], materials.glow, { shadow: false });

    // Pyramid lantern roof & brass finial
    batch.addCylinder([gx, 2.72, 16.5], 0.04, 0.44, 0.14, materials.metalDark, { segments: 4, rotation: [0, Math.PI * 0.25, 0] });
    batch.addSphere([gx, 2.82, 16.5], [0.055, 0.055, 0.055], materials.brass, { shadow: false });

    // Soft warm point light illuminating stone entrance
    const gateLight = new THREE.PointLight(0xffdf99, 1.2, 7.0, 1.8);
    gateLight.position.set(gx, 2.42, 16.5);
    fenceGroup.add(gateLight);
  }

  batch.build(fenceGroup, true);
  return fenceGroup;
}

export function createGardenBench(parent, x, y, z, rotationY = 0) {
  const bench = new THREE.Group();
  bench.position.set(x, y, z);
  bench.rotation.y = rotationY;
  parent.add(bench);
  const batch = new BatchCollector();

  const { width, seatDepth, seatTop, backZ, backTop, armTop, frameX } = BENCH;
  const frontZ = seatDepth * 0.5 - 0.08;
  const slatW = width - 0.24;

  // Cast iron frames: outer sides (left/right) plus a central reinforcing rib for the wide bench
  for (const side of [-1, 0, 1]) {
    const fx = side * frameX;
    const isCenter = side === 0;
    const legThick = isCenter ? 0.09 : 0.13;
    const legZ = isCenter ? 0.09 : 0.13;

    // Front leg
    batch.addBox([fx, (seatTop - 0.07) * 0.5, frontZ], [legThick, seatTop - 0.07, legZ], materials.metalDark);
    // Rear leg
    batch.addBox([fx, (seatTop - 0.07) * 0.5, backZ + 0.08], [legThick, seatTop - 0.07, legZ], materials.metalDark);
    // Rear vertical backrest upright spine
    batch.addBox([fx, (backTop + 0.1) * 0.5, backZ], [legThick, backTop - 0.1, 0.1], materials.metalDark);
    // Seat horizontal support beam
    batch.addBox([fx, seatTop - 0.07, 0], [legThick, 0.08, seatDepth], materials.metalDark);

    // Armrests only on outer sides
    if (!isCenter) {
      batch.addBox([fx, armTop, 0.02], [0.18, 0.08, seatDepth * 0.95], materials.woodLight);
      batch.addBox([fx, (armTop + seatTop) * 0.5, frontZ], [0.1, armTop - seatTop, 0.1], materials.metalDark);
    }
  }

  // Wooden seat slats (6 smooth contoured slats spanning front to back, top surface = seatTop)
  const seatSlats = 6;
  for (let i = 0; i < seatSlats; i += 1) {
    const z = -seatDepth * 0.5 + 0.12 + (i * (seatDepth - 0.24)) / (seatSlats - 1);
    batch.addBox([0, seatTop - 0.035, z], [slatW, 0.07, 0.13], materials.woodLight);
  }

  // Wooden backrest slats (5 ergonomic slats supporting the tall cartoon torso up to shoulders)
  const backSlats = 5;
  for (let i = 0; i < backSlats; i += 1) {
    const yPos = seatTop + 0.22 + (i * (backTop - seatTop - 0.32)) / (backSlats - 1);
    batch.addBox([0, yPos, backZ], [slatW, 0.16, 0.06], materials.woodLight);
  }

  batch.build(bench, true);
  bench.userData.seatAnchorLocal = [0, seatTop, 0.10];
  return bench;
}

