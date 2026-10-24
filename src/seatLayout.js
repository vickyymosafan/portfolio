// Shared, dependency-free seat dimensions so the rendered furniture and the
// interaction anchors are derived from the exact same numbers.

// Character rig (src/character.js), measured in root-local units:
//  - sole of the shoe ≈ root - 1.00 when standing (root at 1.12, sole at 0.12)
//  - seated thigh underside ≈ root - 0.895 once the pelvis group is lowered by 0.42
//    (pelvis -0.42, hip -0.32, thigh radius 0.155)
// So the root sits SIT_ROOT_OFFSET above the seat surface.
export const SIT_ROOT_OFFSET = 0.895;

// Garden bench in bench-local space (+z is the front of the seat, y up).
// Sized proportionally to the 2.38m stylized cartoon character.
export const BENCH = {
  width: 3.2,
  seatDepth: 1.0,
  seatTop: 0.52,
  backZ: -0.50,
  backTop: 1.72,
  armTop: 0.96,
  frameX: 1.45,
};

/**
 * World-space seat anchor for a garden bench placed with createGardenBench.
 * Seat slats span from local z = -0.38 to +0.38.
 * Placing the pelvis at localZ = 0.10 allows the 0.30m thighs to extend to localZ = 0.40,
 * cleanly clearing the front wooden slat (+0.38) so lower legs hang down without clipping.
 */
export function benchSeatAnchor(x, y, z, rotationY) {
  const localZ = 0.10;
  const worldX = x + Math.sin(rotationY) * localZ;
  const worldZ = z + Math.cos(rotationY) * localZ;
  return {
    pos: [worldX, y + BENCH.seatTop, worldZ],
    charFacing: rotationY,
  };
}

/**
 * Exact seat definitions derived directly from furniture geometry in src/furniture.js
 * Each definition provides:
 *  - pos: exact seat cushion surface position under the character's pelvis
 *  - charFacing: outward-facing orientation
 *  - radius: interaction trigger radius
 *  - cameraShot: room-aware camera framing staying strictly inside room walls
 *  - roomBounds: optional bounding box clamps preventing camera from penetrating partition walls
 */
export const SEAT_DEFINITIONS = {
  bench_yard_left: {
    id: 'bench_yard_left',
    label: 'Garden Bench',
    ...benchSeatAnchor(-9.2, 0, 9.8, 0.35),
    radius: 2.9,
    cameraShot: {
      pos: [-6.8, 1.85, 12.6],
      look: [-9.16, 1.25, 9.89],
    },
  },
  bench_yard_right: {
    id: 'bench_yard_right',
    label: 'Garden Bench',
    ...benchSeatAnchor(9.2, 0, 9.8, -0.35),
    radius: 2.9,
    cameraShot: {
      pos: [6.8, 1.85, 12.6],
      look: [9.16, 1.25, 9.89],
    },
  },
  sofa_living: {
    id: 'sofa_living',
    label: 'Living Room Sofa',
    // Living room sofa in Bay 1 at [-6.3, 0, 2.0] facing 0 (+z). Cushion top = 0.645.
    pos: [-6.3, 0.645, 2.0],
    charFacing: 0,
    radius: 2.5,
    standPos: [-4.2, 1.12, 1.6],
    cameraShot: {
      pos: [-3.8, 1.75, 0.6],
      look: [-6.3, 1.25, 2.0],
    },
    roomBounds: { minX: -12.8, maxX: -2.0, minZ: 0.2, maxZ: 3.4 },
  },
  chair_office: {
    id: 'chair_office',
    label: 'Office Ergonomic Chair',
    // Workstation chair in Bay 1 at [11.5, 0, -0.2] facing +X toward desk at x = 12.7.
    pos: [11.5, 0.62, -0.2],
    charFacing: Math.PI * 0.5,
    radius: 2.2,
    isDesk: true,
    standPos: [10.2, 1.12, -0.2],
    cameraShot: {
      pos: [9.2, 1.75, 1.4],
      look: [11.5, 1.25, -0.2],
    },
    roomBounds: { minX: 6.0, maxX: 12.8, minZ: -1.8, maxZ: 3.4 },
  },
  chair_library: {
    id: 'chair_library',
    label: 'Library Armchair',
    // Wingback chair in Bay 2 at [-11.3, 0, -6.1] rotated 0.55 rad. Cushion top = 0.76.
    pos: [-11.3, 0.76, -6.1],
    charFacing: 0.55,
    radius: 2.2,
    standPos: [-10.2, 1.12, -4.8],
    cameraShot: {
      pos: [-8.8, 1.8, -4.0],
      look: [-11.3, 1.30, -6.1],
    },
    roomBounds: { minX: -12.8, maxX: -4.5, minZ: -8.0, maxZ: -4.8 },
  },
  bench_terrace: {
    id: 'bench_terrace',
    label: 'Terrace Lounge Bench',
    // Garden terrace teak sofa in Bay 3 at [12.3, 0, -16.1] facing -X into room.
    pos: [12.3, 0.625, -16.1],
    charFacing: -Math.PI * 0.5,
    radius: 2.4,
    standPos: [12.0, 1.12, -13.6],
    cameraShot: {
      // Safely inside Contact Room (Bay 3: z between -12.2 and -20.0, x between 4.0 and 14.0)
      pos: [9.2, 1.85, -14.4],
      look: [12.3, 1.25, -16.1],
    },
    roomBounds: { minX: 4.5, maxX: 12.8, minZ: -18.5, maxZ: -13.0 },
  },
};

