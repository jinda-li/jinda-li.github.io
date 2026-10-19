// Pier, boats, path steps, clothesline, hammock, table, flagpole with pennant, fire ring, bonfire, lantern.
import * as THREE from 'three';
import { Batch, vcMat, rng, vary } from './kit.mjs';
import { AC } from './architecture.mjs';

const ink = m => { m.userData.ink = true; return m; };

/** Fixed pier: grey planks laid across, round posts every 2 m, a bench and a steel ladder at the end. */
export function pier({ x, z0, z1, w, y }){
  const g = new THREE.Group(), b = new Batch(), snow = new Batch(), r = rng(31);
  for (let z = z0; z < z1; z += .155) b.box(w, .045, .135, vary(AC.plank, r, .08), [x, y, z + .07], [0, (r() - .5) * .015, 0]);
  for (const s of [-1, 1]) b.box(.09, .12, z1 - z0, AC.plankDark, [x + s * (w / 2 - .12), y - .08, (z0 + z1) / 2]);
  for (let z = z0 + .5; z <= z1 + .01; z += 2) for (const s of [-1, 1]) b.cyl(.085, .085, 2.4, vary(AC.plankDark, r, .1), [x + s * (w / 2 - .05), y - 1.1, Math.min(z, z1 - .1)], [0, 0, 0], 8);
  // Bench across the end.
  b.box(1.0, .06, .34, AC.wood, [x, y + .44, z1 - .35]);
  for (const s of [-1, 1]) b.box(.08, .4, .3, AC.wood, [x + s * .42, y + .22, z1 - .35]);
  // Steel ladder with curved handrails on the east side of the end.
  const lx = x + w / 2 + .02, lz = z1 - .8;
  for (const s of [-1, 1]){
    b.cyl(.025, .025, 1.5, AC.steel, [lx + .05, y - .55, lz + s * .25], [0, 0, 0], 6);
    b.add(new THREE.TorusGeometry(.16, .025, 6, 12, Math.PI), AC.steel, [lx - .1, y + .2, lz + s * .25], [0, 0, 0]);
  }
  for (let i = 0; i < 3; i++) b.box(.1, .03, .5, AC.steel, [lx + .05, y - .2 - i * .3, lz]);
  // Snow lies on the deck in winter.
  snow.box(w + .04, .12, z1 - z0, AC.snow, [x, y + .08, (z0 + z1) / 2], [0, 0, 0], .05);
  g.add(ink(b.mesh(vcMat())));
  const sn = snow.mesh(vcMat()); sn.visible = false; g.add(sn);
  g.userData = { snow: sn, end: new THREE.Vector3(x, y, z1) };
  return g;
}

/** Clinker-style rowing boat: coloured hull, pale interior, thwarts and two oars. Bow points +z. */
export function rowboat(hull = '#b2402e', inside = '#ece4d6', { oars = true } = {}){
  const g = new THREE.Group(), b = new Batch();
  const shape = (sx, sy, sz, col, y) => b.add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    (c, X, Y, Z) => c.set(col).multiplyScalar(1 - Math.max(0, Math.sin(Y * 24) * .05)), [0, y, 0], [0, 0, 0], [sx, sy, sz]);
  shape(.7, .42, 2.25, hull, .38);
  shape(.62, .36, 2.15, inside, .42);
  b.add(new THREE.TorusGeometry(1, .045, 6, 32), '#7d5a3a', [0, .4, 0], [Math.PI / 2, 0, 0], [.69, 2.24, 1]);
  for (const z of [-.75, .1, .85]) b.box(1.1, .05, .26, AC.wood, [0, .3, z]);
  b.box(.06, .3, .5, AC.wood, [0, .32, -2.05]);
  // Oars resting across the thwarts.
  if (oars) for (const s of [-1, 1]){
    b.cyl(.025, .025, 2.5, '#c49a62', [s * .25, .4, .2], [Math.PI / 2, 0, s * .06], 6);
    b.box(.13, .02, .5, '#c49a62', [s * .3, .4, 1.35], [0, s * .06, 0]);
  }
  g.add(ink(b.mesh(vcMat())));
  return g;
}

/** A boat lying upside down on two logs on the shore. */
export function upturnedBoat(hull = '#3f6f9a'){
  const g = new THREE.Group(), b = new Batch();
  b.add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), (c, X, Y) => c.set(hull).multiplyScalar(.92 + Math.min(Y * 1.2, .12)), [0, .16, 0], [0, 0, 0], [.62, .36, 1.9]);
  b.add(new THREE.TorusGeometry(1, .04, 6, 28), '#e8e0d0', [0, .17, 0], [Math.PI / 2, 0, 0], [.62, 1.9, 1]);
  for (const z of [-.9, .9]) b.cyl(.09, .09, 1.4, '#7a5a3c', [0, .06, z], [0, 0, Math.PI / 2], 7);
  g.add(ink(b.mesh(vcMat())));
  return g;
}

/** Stepping stones and wooden steps along the path. */
export function pathDetails(path, height, steep){
  const b = new Batch(), r = rng(37);
  for (let i = 0; i < path.length - 1; i++){
    const [ax, az] = path[i], [bx, bz] = path[i + 1], len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
    for (let t = .3; t < len; t += .75){
      const x = ax + (bx - ax) * t / len, z = az + (bz - az) * t / len, h = height(x, z), dh = height(x + Math.sin(ang) * .4, z + Math.cos(ang) * .4) - h;
      if (steep(i)) b.box(.95, .1, .32, vary(AC.plank, r, .1), [x, h + .03, z], [0, ang, 0], .02);
      else if (r() < .7) b.add(new THREE.CylinderGeometry(.3, .32, .1, 8), vary(AC.stone2, r, .12), [x + (r() - .5) * .2, h + .02, z], [0, r() * 3, 0], [1, 1, .8]);
      void dh;
    }
  }
  return ink(b.mesh(vcMat()));
}

/** Rope between two points with towels; a, b are [x, y, z] tops of the posts or trunks. */
export function clothesline(a, bTop){
  const g = new THREE.Group(), b = new Batch();
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...bTop), mid = A.clone().lerp(B, .5), len = A.distanceTo(B);
  const dir = B.clone().sub(A).normalize(), yaw = Math.atan2(dir.x, dir.z);
  b.box(.015, .015, len, '#e6e1d6', [mid.x, mid.y - .05, mid.z], [0, yaw, 0]);
  [['#e86a5a', .28], ['#f3c851', .5], ['#6aa2d8', .7]].forEach(([c, t]) => {
    const p = A.clone().lerp(B, t);
    b.box(.55, .7, .025, c, [p.x, p.y - .45 - Math.sin(t * Math.PI) * .08, p.z], [0, yaw + Math.PI / 2, 0], .01);
  });
  g.add(ink(b.mesh(vcMat())));
  return g;
}

/** Striped cloth hammock between two trunks at a and b (ground points), hung at 1.5 m. */
export function hammock(a, bPt){
  const g = new THREE.Group();
  const A = new THREE.Vector3(a[0], a[1] + 1.5, a[2]), B = new THREE.Vector3(bPt[0], bPt[1] + 1.5, bPt[2]);
  const len = A.distanceTo(B), seg = 24, w = .9;
  const geo = new THREE.PlaneGeometry(len, w, seg, 4);
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
  for (let i = 0; i < P.count; i++){
    const u = P.getX(i) / len + .5, v = P.getY(i) / w + .5;
    const sag = Math.sin(u * Math.PI) * .75, curl = (v - .5) ** 2 * .9 * Math.sin(u * Math.PI);
    P.setXYZ(i, P.getX(i) * (1 - .0), -sag + curl, (v - .5) * w * (.3 + .7 * Math.sin(u * Math.PI)));
    c.set(Math.floor(v * 7) % 2 ? '#e9e2d2' : '#c4513d'); col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, vcMat({ side: THREE.DoubleSide })); m.castShadow = true;
  const holder = new THREE.Group(); holder.add(m);
  holder.position.copy(A.clone().lerp(B, .5)); holder.rotation.y = Math.atan2(-(B.z - A.z), B.x - A.x);
  g.add(holder); ink(m);
  g.userData = { holder };
  return g;
}

export function picnicTable(){
  const b = new Batch();
  b.box(1.8, .07, .8, AC.wood, [0, .75, 0], [0, 0, 0], .02);
  for (const s of [-1, 1]){
    b.box(1.8, .06, .28, AC.wood, [0, .45, s * .65], [0, 0, 0], .02);
    b.box(.08, .9, .08, '#9a7650', [s * .7, .4, .32], [-.45, 0, 0]); b.box(.08, .9, .08, '#9a7650', [s * .7, .4, -.32], [.45, 0, 0]);
  }
  return ink(b.mesh(vcMat()));
}

/** White flagpole with the long blue-and-white pennant; the cloth is waved in update(). */
export function flagpole(){
  const g = new THREE.Group(), b = new Batch();
  b.cyl(.05, .08, 8, '#f4f2ee', [0, 4, 0], [0, 0, 0], 8);
  b.sphere(.1, '#e9e4da', [0, 8.05, 0], 1, 8);
  g.add(ink(b.mesh(vcMat())));
  const len = 4.2, geo = new THREE.PlaneGeometry(len, .5, 30, 2);
  const P = geo.attributes.position, col = new Float32Array(P.count * 3), blue = new THREE.Color('#2a5aa8'), white = new THREE.Color('#f4f4f0');
  for (let i = 0; i < P.count; i++){
    const u = P.getX(i) / len + .5;
    P.setY(i, P.getY(i) * (1 - u * .92));                              // tapers to a point
    const c = Math.abs(P.getY(i)) < .25 * (1 - u * .92) * .22 && u > .02 ? white : blue;
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.translate(len / 2, 0, 0);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const cloth = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  cloth.position.set(.05, 7.7, 0); g.add(cloth);
  g.userData = { cloth, base: geo.attributes.position.array.slice() };
  return g;
}

/** Fire ring of stones with three stumps; flames animated in update(). */
export function fireRing(){
  const g = new THREE.Group(), b = new Batch(), r = rng(41);
  for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; b.sphere(.2, vary(AC.stone, r, .12), [Math.cos(a) * .6, .06, Math.sin(a) * .6], [1.1, .7, 1], 7); }
  for (let i = 0; i < 4; i++){ const a = i * 1.6 + .3; b.cyl(.06, .06, .7, '#5e4430', [Math.cos(a) * .12, .2, Math.sin(a) * .12], [Math.cos(a) * .9, 0, Math.sin(a) * .9 + Math.PI / 2], 6); }
  for (const a of [.6, 2.4, 4.3]) b.cyl(.26, .28, .44, '#8a6a4c', [Math.cos(a) * 1.7, .22, Math.sin(a) * 1.7], [0, 0, 0], 12);
  g.add(ink(b.mesh(vcMat())));
  const flames = new THREE.Group();
  [['#ffb347', .17, .65], ['#ffd27a', .12, .5], ['#ff8f3a', .14, .55]].forEach(([c, rr, h], i) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 7), new THREE.MeshBasicMaterial({ color: c }));
    f.position.set((i - 1) * .08, .25 + h / 2, (i % 2) * .06); flames.add(f);
  });
  g.add(flames);
  const light = new THREE.PointLight('#ff9b4a', 0, 10, 1.5); light.position.set(0, 1, 0); g.add(light);
  g.userData = { flames, light };
  return g;
}

/** Midsummer bonfire (kokko): a tall stack of branches on the rock. */
export function kokko(){
  const g = new THREE.Group(), b = new Batch(), r = rng(43);
  for (let i = 0; i < 26; i++){
    const a = r() * Math.PI * 2, lean = .25 + r() * .3, h = 1.6 + r() * 1.2;
    b.cyl(.05, .08, h, vary('#6b5038', r, .2), [Math.cos(a) * .55, h / 2 * Math.cos(lean), Math.sin(a) * .55], [Math.sin(a) * lean, 0, -Math.cos(a) * lean], 5);
  }
  g.add(ink(b.mesh(vcMat())));
  const flames = new THREE.Group();
  for (let i = 0; i < 6; i++){
    const f = new THREE.Mesh(new THREE.ConeGeometry(.5 - i * .05, 1.8 - i * .15, 7), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd27a' : '#ff9a40' }));
    f.position.set((r() - .5) * .5, 1.2 + i * .2, (r() - .5) * .5); flames.add(f);
  }
  g.add(flames);
  const light = new THREE.PointLight('#ff8a3a', 0, 26, 1.4); light.position.set(0, 2.2, 0); g.add(light);
  g.userData = { flames, light };
  return g;
}

/** Lantern on a short post at the pier end. */
export function lantern(){
  const g = new THREE.Group(), b = new Batch(), glass = new Batch();
  b.box(.1, 1.0, .1, AC.plankDark, [0, .5, 0]);
  b.box(.26, .05, .26, '#22252b', [0, 1.02, 0]);
  b.cone(.2, .14, '#22252b', [0, 1.32, 0], [0, Math.PI / 4, 0], 4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.025, .26, .025, '#22252b', [sx * .11, 1.16, sz * .11]);
  glass.box(.18, .22, .18, '#ffffff', [0, 1.16, 0]);
  g.add(ink(b.mesh(vcMat())));
  const gm = new THREE.MeshBasicMaterial({ color: '#ffd28a' }), gl = glass.mesh(gm); gl.castShadow = false; g.add(gl);
  const light = new THREE.PointLight('#ffb35c', 0, 8, 1.6); light.position.set(0, 1.2, 0); g.add(light);
  g.userData = { glass: gm, light };
  return g;
}

/** A small red boathouse on posts at the water's edge, with a plank landing, for the pine island. */
export function boathouse(){
  const g = new THREE.Group(), b = new Batch(), r = rng(57);
  const L = 3.6, Wd = 2.6, H = 1.7;
  for (const x of [-L / 2, 0, L / 2]) for (const z of [-Wd / 2, Wd / 2]) b.cyl(.09, .1, 1.6, AC.plankDark, [x, -.4, z], [0, 0, 0], 6);
  b.box(L + .1, .08, Wd + .1, AC.plank, [0, .38, 0]);
  // Falu-red board walls, open at the lake end (+x).
  for (const z of [-Wd / 2, Wd / 2]) for (let i = 0; i < 9; i++) b.box(L / 9 - .02, H, .06, vary('#8f2c22', r, .06), [-L / 2 + (i + .5) * L / 9, .42 + H / 2, z]);
  b.box(.06, H, Wd, '#8a2a20', [-L / 2, .42 + H / 2, 0]);
  b.box(.08, .5, Wd, '#7a251d', [L / 2, .42 + H - .25, 0]);
  for (const s of [-1, 1]) b.box(L + .5, .07, Wd / 2 + .45, '#2f2d2c', [0, .42 + H + .32, s * (Wd / 4 + .1)], [s * .52, 0, 0]);
  b.box(L + .5, .08, .14, '#f0ece2', [0, .42 + H + .02, Wd / 2 + .05]); b.box(L + .5, .08, .14, '#f0ece2', [0, .42 + H + .02, -Wd / 2 - .05]);
  for (const s of [-1, 1]) b.box(.06, .9, .06, '#f0ece2', [L / 2 + .02, .42 + H - .1, s * (Wd / 2 - .05)], [s * .5, 0, 0]);   // white barge boards
  // A landing beside it.
  b.box(2.2, .07, 1.0, AC.plank, [.6, .32, Wd / 2 + .65]);
  for (const x of [-.4, 1.6]) b.cyl(.07, .07, 1.2, AC.plankDark, [x, -.25, Wd / 2 + 1.05], [0, 0, 0], 6);
  g.add(ink(b.mesh(vcMat())));
  return g;
}
