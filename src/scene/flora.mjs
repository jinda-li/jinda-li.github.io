// Trees and plants, built as a few varied geometries each and instanced.
// Spruce: dark drooping tiers with stubby edges. Pine: orange upper trunk, flat crown clumps.
// Birch: white trunk with notches, loose see-through leaf clumps. Plus rowan, juniper, bilberry,
// reeds, lily pads, lupins and granite boulders.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Batch, rng, noise2, C } from './kit.mjs';

export const FC = {
  spruce: '#24342d', spruceTop: '#2e4337', spruceShade: '#1c2a25',
  pineBark: '#6b5a4a', pineOrange: '#c3713a', pine: '#3b5238', pine2: '#4b6243',
  bark: '#ece7dc', barkMark: '#2a2624', leaf: ['#8a9c58', '#9aaa64', '#77894c'], leafAutumn: ['#cfa23c', '#dbb653', '#bd8a33'],
  rowan: '#5f7f3a', rowanAutumn: '#c0452b', berry: '#d4502a', flower: '#f1ece0',
  juniper: '#3e5245', bilberry: '#4c6e30', bilberryAutumn: '#a3442a', moss: '#7d9440',
  reed: '#6f8e3c', reedGold: '#c4a14e', reedDry: '#b9a27a', cattail: '#5a3d28',
  lily: '#4f6d34', lilyFlower: '#e8c23a', lupine: ['#6f5bb5', '#8a6cc8', '#c47ab0', '#efe6f2'],
  snow: '#f2f4f7',
};

/** Push the rim of a cone down (drooping branches) and wobble its radius (stubby branch tips). */
function droopCone(r, h, droop, seed, seg = 16){
  const g = new THREE.ConeGeometry(r, h, seg, 2, false);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), rad = Math.hypot(x, z);
    if (rad < 1e-4) continue;
    const a = Math.atan2(z, x), k = rad / r;
    const wob = 1 + .16 * Math.sin(a * 7 + seed) + .08 * Math.sin(a * 13 + seed * 2.3);
    P.setXYZ(i, x * wob, y - droop * k * k, z * wob);
  }
  g.computeVertexNormals();
  return g;
}

export function spruceGeo(seed, winter){
  const b = new Batch(), r = rng(seed);
  const tiers = 6 + Math.floor(r() * 4), H = 6.5 + r() * 3, base = .8;
  b.cyl(.14, .2, base + .6, '#4a3a2e', [0, (base + .6) / 2, 0], [0, 0, 0], 6);
  for (let i = 0; i < tiers; i++){
    const t = i / (tiers - 1), y = base + t * (H - base - 1.2);
    const rad = (1.6 - t * 1.25) * (.9 + r() * .2), h = 1.5 - t * .55;
    const col = new THREE.Color(FC.spruceShade).lerp(C(FC.spruceTop), t * .8 + r() * .15);
    b.add(droopCone(rad, h, .35 + (1 - t) * .25, r() * 10), col, [0, y + h / 2, 0], [0, r() * 6, 0]);
    if (winter) b.add(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), FC.snow, [0, y + h * .45, 0], [r() * .3, 0, r() * .3], [rad * .72, .32, rad * .72]);
  }
  b.cone(.18, 1.4, FC.spruceTop, [0, H - .3, 0], [0, 0, 0], 6);
  return b.geometry();
}

export function pineGeo(seed, winter, lean = 0){
  const b = new Batch(), r = rng(seed);
  const H = 6.5 + r() * 2.5, bend = (r() - .5) * .4;
  // Trunk: grey-brown below, orange-copper above, with a gentle bend.
  const pts = []; for (let i = 0; i <= 6; i++){ const t = i / 6; pts.push(new THREE.Vector3(Math.sin(t * 1.5) * bend + t * t * lean * H * .35, t * H, 0)); }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .22, 7);
  const P = tube.attributes.position;
  for (let i = 0; i < P.count; i++){ const t = P.getY(i) / H; P.setX(i, P.getX(i) + 0); void t; }
  b.add(tube, (c, x, y) => c.set(FC.pineBark).lerp(C(FC.pineOrange), Math.min(1, Math.max(0, (y / H - .35) * 2.2))), [0, 0, 0]);
  const top = pts[6];
  const n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++){
    const a = r() * Math.PI * 2, d = i ? .45 + r() * 1.1 : 0, y = H * (.72 + r() * .25), s = .6 + r() * .5;
    const px = top.x * (y / H) + Math.cos(a) * d, pz = Math.sin(a) * d;
    if (i > 0) b.cyl(.06, .08, d + .2, FC.pineOrange, [px * .5 + top.x * (y / H) * .5, y - .25, pz * .5], [0, -a, Math.PI / 2 - .25], 5);
    const g = new THREE.IcosahedronGeometry(1, 1);
    b.add(g, (c, x, yy) => c.set(FC.pine).lerp(C(FC.pine2), Math.max(0, yy - y) / s * 2), [px, y, pz], [0, r() * 6, 0], [s * 1.3, s * .5, s * 1.2]);
    if (winter) b.add(new THREE.IcosahedronGeometry(1, 1), FC.snow, [px, y + s * .28, pz], [0, 0, 0], [s * 1.1, s * .18, s * 1.0]);
  }
  return b.geometry();
}

export function birchGeo(seed, season){
  const b = new Batch(), r = rng(seed);
  const stems = r() < .3 ? 2 : 1, H = 5.2 + r() * 2.2;
  for (let s = 0; s < stems; s++){
    const lean = (r() - .5) * .25 + (s ? .18 : 0), pts = [];
    for (let i = 0; i <= 6; i++){ const t = i / 6; pts.push(new THREE.Vector3(Math.sin(t * 2 + seed) * .25 + t * lean * H * .3, t * H * (s ? .85 : 1), Math.cos(t * 1.7 + seed) * .15)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 16, .14 - s * .03, 7);
    const P = tube.attributes.position; for (let i = 0; i < P.count; i++){ const t = P.getY(i) / H; P.setX(i, P.getX(i) * (1 - t * .45)); P.setZ(i, P.getZ(i) * (1 - t * .45)); }
    b.add(tube, (c, x, y) => {
      const notch = Math.sin(y * 7.3 + seed) > .86 || Math.sin(y * 3.1 + seed * 2) > .94;
      c.set(y < .9 ? FC.barkMark : notch ? FC.barkMark : FC.bark);
      if (y < 1.6 && y >= .9) c.lerp(C(FC.barkMark), .45);
    }, [s * .3, 0, 0]);
    const top = curve.getPoint(1);
    if (season === 'winter' || season === 'late'){
      for (let i = 0; i < 7; i++){ const a = i * 1.1 + r(), y = H * (.55 + i * .06); b.cyl(.02, .035, 1.6, '#d9d2c4', [top.x * .8 + Math.cos(a) * .45, y, Math.sin(a) * .45], [Math.sin(a) * .8, 0, -Math.cos(a) * .8], 5); }
      continue;
    }
    // Loose leaf clumps with sky between them; each clump is a few overlapping blobs.
    const leaf = season === 'autumn' ? FC.leafAutumn : FC.leaf;
    // A few loose, flattened leaf clumps hanging off the upper trunk, with sky between them.
    const clumps = 4 + Math.floor(r() * 2);
    for (let i = 0; i < clumps; i++){
      const a = i / clumps * Math.PI * 2 + r() * .8, d = .5 + r() * .8, y = H * (.5 + i / clumps * .42 + r() * .06);
      const cx = top.x * (y / H) + Math.cos(a) * d, cz = Math.sin(a) * d, col = leaf[i % 3];
      for (let k = 0; k < 2; k++){
        const s = .5 + r() * .3;
        b.add(new THREE.IcosahedronGeometry(s, 1), col, [cx + (r() - .5) * .6, y - k * .25, cz + (r() - .5) * .6], [r(), r(), r()], [1.2, .62, 1.2]);
      }
      b.cyl(.015, .03, d + .3, '#5a5148', [top.x * (y / H) + Math.cos(a) * d * .5, y - .15, Math.sin(a) * d * .5], [0, -a, Math.PI / 2 - .5], 4);
    }
  }
  return b.geometry();
}

export function rowanGeo(season){
  const b = new Batch(), r = rng(71);
  b.cyl(.1, .15, 3.4, '#6a5f55', [0, 1.7, 0], [0, 0, .06], 7);
  const leaf = season === 'autumn' ? FC.rowanAutumn : FC.rowan;
  for (let i = 0; i < 7; i++){
    const a = i * .9, d = i ? .9 : 0, y = 3.6 + (i % 3) * .45;
    b.add(new THREE.IcosahedronGeometry(.85, 1), leaf, [Math.cos(a) * d, y, Math.sin(a) * d], [r(), r(), r()], [1, .8, 1]);
    if (season !== 'winter') for (let k = 0; k < 3; k++)
      b.sphere(.12, season === 'summer' ? FC.flower : FC.berry, [Math.cos(a) * (d + .6) + (r() - .5) * .3, y + (r() - .3) * .5, Math.sin(a) * (d + .6) + (r() - .5) * .3], 1, 6);
  }
  if (season === 'winter') return new Batch().cyl(.1, .15, 3.4, '#6a5f55', [0, 1.7, 0], [0, 0, .06], 7).geometry();
  return b.geometry();
}

export function juniperGeo(seed){
  const b = new Batch(), r = rng(seed), H = 1.4 + r() * 1.6;
  for (let i = 0; i < 3; i++) b.add(droopCone(.35 + r() * .2, H * (1 - i * .2), .05, r() * 10, 9), FC.juniper, [(r() - .5) * .3, H * (1 - i * .2) / 2, (r() - .5) * .3]);
  return b.geometry();
}

export function boulderGeo(seed){ // granite boulder
  let g = new THREE.IcosahedronGeometry(1, 2); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = .84 + noise2(x * 1.2 + seed, z * 1.2 + y) * .3;
    P.setXYZ(i, x * k * 1.15, y * k * .7, z * k);
  }
  g.computeVertexNormals();
  // Pale dry top, dark wet underside.
  return new Batch().add(g, (c, x, y) => c.set('#5f5751').lerp(C('#a99e96'), Math.min(1, Math.max(0, (y + .2) * 1.6))).lerp(C('#bdb59c'), Math.max(0, y - .45) * .6)).geometry();
}

export function bilberryGeo(seed, autumn, winter){
  const b = new Batch(), r = rng(seed);
  for (let i = 0; i < 6; i++) b.add(new THREE.IcosahedronGeometry(.35 + r() * .2, 1), winter ? '#e8ecf2' : autumn && i % 2 ? FC.bilberryAutumn : FC.bilberry, [(r() - .5) * 1.1, .1, (r() - .5) * 1.1], [r(), r(), r()], [1, .55, 1]);
  return b.geometry();
}

export function reedGeo(seed, season){
  const b = new Batch(), r = rng(seed);
  const col = season === 'winter' ? FC.reedDry : season === 'autumn' ? FC.reedGold : FC.reed;
  for (let i = 0; i < 13; i++){
    const a = r() * 6.28, d = r() * .35, h = 1.0 + r() * .9, lean = (r() - .5) * .35;
    b.cone(.035, h, col, [Math.cos(a) * d + Math.sin(lean) * h * .5, h / 2, Math.sin(a) * d], [0, 0, lean], 4);
    if (i % 4 === 0 && season !== 'winter') b.capsule(.045, .16, FC.cattail, [Math.cos(a) * d + Math.sin(lean) * h, h * .92, Math.sin(a) * d]);
  }
  return b.geometry();
}

export function lilyGeo(seed){
  const b = new Batch(), r = rng(seed);
  for (let i = 0; i < 7; i++){
    const s = .22 + r() * .18;
    b.add(new THREE.CylinderGeometry(s, s, .015, 12, 1, false, .4, Math.PI * 2 - .4), FC.lily, [(r() - .5) * 1.8, 0, (r() - .5) * 1.4], [0, r() * 6, 0], [1, 1, .85]);
  }
  for (let i = 0; i < 2; i++) b.sphere(.08, FC.lilyFlower, [(r() - .5) * 1.2, .05, (r() - .5) * 1.0], [1, .6, 1], 7);
  return b.geometry();
}

export function lupineGeo(){
  const b = new Batch();
  b.cyl(.015, .02, .6, '#4f7a3e', [0, .3, 0], [0, 0, 0], 4);
  for (let i = 0; i < 8; i++) b.sphere(.055 - i * .004, '#ffffff', [0, .5 + i * .07, 0], 1, 6);
  for (let i = 0; i < 5; i++) b.add(new THREE.ConeGeometry(.14, .05, 7), '#5f8f46', [Math.cos(i * 1.3) * .14, .14, Math.sin(i * 1.3) * .14], [0, i, .4]);
  return b.geometry();
}

/** Instanced mesh from a list of {x,y,z,s,ry,rx,rz,tint}. */
export function instanced(geo, list, mat, { tint = true, shadow = true } = {}){
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), o = new THREE.Object3D(), c = new THREE.Color();
  list.forEach((p, i) => {
    o.position.set(p.x, p.y, p.z); o.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0); o.scale.setScalar(p.s);
    if (p.sy) o.scale.y *= p.sy;
    o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    if (tint) m.setColorAt(i, p.col ? c.set(p.col) : c.setScalar(p.tint ?? 1));
  });
  m.count = list.length;
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}
