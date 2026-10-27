import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const sharedGeometries = {
  box: new RoundedBoxGeometry(1, 1, 1, 1, 0.04),
  flatBox: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 14, 10),
  lowSphere: new THREE.SphereGeometry(1, 10, 8),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
  smoothCylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: new THREE.ConeGeometry(1, 1, 10),
};

export function addBox(parent, position, size, surface, options = {}) {
  const geo = options.sharp ? sharedGeometries.flatBox : sharedGeometries.box;
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  const vol = size[0] * size[1] * size[2];
  // Cast shadows only for volumetric structures or when explicitly enabled
  mesh.castShadow = options.shadow !== undefined ? options.shadow : (vol > 0.04);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  parent.add(mesh);
  return mesh;
}

export function addSphere(parent, position, size, surface, options = {}) {
  const geo = options.lowPoly ? sharedGeometries.lowSphere : sharedGeometries.sphere;
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  const vol = size[0] * size[1] * size[2];
  mesh.castShadow = options.shadow !== undefined ? options.shadow : (vol > 0.04);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  parent.add(mesh);
  return mesh;
}

export function addCylinder(parent, position, radiusTop, radiusBottom, height, surface, options = {}) {
  const segments = options.segments ?? 10;
  const geo = segments === 10 ? sharedGeometries.cylinder : new THREE.CylinderGeometry(1, 1, 1, segments);
  const mesh = new THREE.Mesh(geo, surface);
  const avgRadius = (radiusTop + radiusBottom) * 0.5;
  mesh.position.set(...position);
  mesh.scale.set(avgRadius, height, avgRadius);
  const vol = Math.PI * avgRadius * avgRadius * height;
  mesh.castShadow = options.shadow !== undefined ? options.shadow : (vol > 0.04);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  parent.add(mesh);
  return mesh;
}

// High-performance BatchCollector to merge static geometries by material
// Reduces thousands of separate draw calls down to tens of draws
export class BatchCollector {
  constructor() {
    this.batches = new Map();
  }

  addBox(position, size, material, options = {}) {
    // Default batched structural boxes to crisp flatBox for peak 60 FPS performance
    const baseGeo = options.rounded ? sharedGeometries.box : sharedGeometries.flatBox;
    let geo = baseGeo.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      options.rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...options.rotation)) : new THREE.Quaternion(),
      new THREE.Vector3(...size)
    );
    geo.applyMatrix4(matrix);
    this._push(material, geo);
  }

  addCylinder(position, radiusTop, radiusBottom, height, material, options = {}) {
    const segments = options.segments ?? 12;
    const baseGeo = segments === 12 ? sharedGeometries.cylinder : new THREE.CylinderGeometry(1, 1, 1, segments);
    let geo = baseGeo.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    const avgRadius = (radiusTop + radiusBottom) * 0.5;
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      options.rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...options.rotation)) : new THREE.Quaternion(),
      new THREE.Vector3(avgRadius, height, avgRadius)
    );
    geo.applyMatrix4(matrix);
    this._push(material, geo);
  }

  addSphere(position, size, material, options = {}) {
    const baseGeo = options.lowPoly ? sharedGeometries.lowSphere : sharedGeometries.sphere;
    let geo = baseGeo.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      options.rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...options.rotation)) : new THREE.Quaternion(),
      new THREE.Vector3(...size)
    );
    geo.applyMatrix4(matrix);
    this._push(material, geo);
  }

  _push(material, geo) {
    if (!this.batches.has(material)) {
      this.batches.set(material, []);
    }
    this.batches.get(material).push(geo);
  }

  build(parent, defaultShadow = true) {
    const resultMeshes = [];
    for (const [material, geometries] of this.batches.entries()) {
      if (geometries.length === 0) continue;
      let mesh;
      if (geometries.length === 1) {
        mesh = new THREE.Mesh(geometries[0], material);
      } else {
        const merged = mergeGeometries(geometries);
        for (const g of geometries) g.dispose();
        mesh = new THREE.Mesh(merged, material);
      }
      mesh.castShadow = defaultShadow;
      mesh.receiveShadow = defaultShadow;
      parent.add(mesh);
      resultMeshes.push(mesh);
    }
    this.batches.clear();
    return resultMeshes;
  }
}
