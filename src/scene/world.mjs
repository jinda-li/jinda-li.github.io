// Assembles the lakeside from terrain, buildings, props and plants (layout in DESIGN.md).
import * as THREE from 'three';
import { vcMat, rng, noise2, smooth } from './kit.mjs';
import { L, PATH, shoreZ, height, rockMask, distToPath, buildTerrain, farLand } from './terrain.mjs';
import { sauna, cottage, woodshed, outhouse, well } from './architecture.mjs';
import { pier, rowboat, upturnedBoat, pathDetails, clothesline, hammock, picnicTable, flagpole, fireRing, kokko, lantern } from './props.mjs';
import { juniperGeo, boulderGeo, bilberryGeo, reedGeo, lilyGeo, lupineGeo, instanced, FC } from './flora.mjs';
import { speciesSpec, STYLES, treeMaterial } from './trees.mjs';

export { L, height, shoreZ };
const SEASONS = ['summer', 'autumn', 'winter'];

function plan(){
  const r = rng(101), T = { spruce: [], pine: [], birch: [], aspen: [], alder: [], juniper: [], boulder: [], bilberry: [], reed: [], lily: [], lupine: [], rowan: [] };
  const at = (x, z, o = {}) => ({ x, z, y: height(x, z) - .08, ry: r() * 6.28, s: 1, ...o });
  const near = (x, z, list, d) => list.some(p => Math.hypot(p.x - x, p.z - z) < d);
  const cabinClear = (x, z) => Math.hypot(x - L.cabin.x, z - L.cabin.z) < 7.5;
  // Keep the view from the lake to the cottage open: no trees within 4.5 m of that line of sight.
  const CAM = [13, 44];
  const inSight = (x, z) => {
    if (z > 3 || z < L.cabin.z + 2) return false;
    const t = (z - CAM[1]) / (L.cabin.z - CAM[1]), lx = CAM[0] + (L.cabin.x - CAM[0]) * t;
    return Math.abs(x - lx) < 4.5;
  };
  // A corridor with no tall trees behind the cottage, so its roof reads against the pale ridge.
  const skyGap = (x, z) => Math.abs(x - L.cabin.x - (z - L.cabin.z) * -.08) < 6.5 && z < L.cabin.z - 3;
  const blocked = (x, z) =>
    cabinClear(x, z) || inSight(x, z) || distToPath(x, z) < 1.3 || Math.hypot(x - L.sauna.x, z - L.sauna.z) < 4.2 ||
    Math.hypot(x - L.woodshed.x, z - L.woodshed.z) < 2.6 || (Math.abs(x - L.pier.x) < 1.6 && z > -1) ||
    Math.hypot(x - 9.5, z + 19) < 2 || Math.hypot(x - 12, z + 24) < 2 || Math.hypot(x - 8.6, z + 12.4) < 2.6 ||
    Math.hypot(x - L.fire.x, z - L.fire.z) < 2.6;

  // ---- hand-placed key trees ----
  T.pine.push(at(-9.6, 1.4, { s: .95, ry: -2.36, lean: .55, key: 'lone' }));                    // lone pine leaning over the lake
  T.pine.push(at(L.islet.x - .8, L.islet.z, { s: .7 }), at(L.islet.x + 1.1, L.islet.z - .6, { s: .82 }), at(L.islet.x + .2, L.islet.z + .9, { s: .55 }));
  T.pine.push(at(-3.4, -15.6, { s: 1.05 }), at(-.7, -17.8, { s: 1.1 }));                        // hammock pines
  T.pine.push(at(11.4, -21.5, { s: 1.15 }), at(.6, -23, { s: 1.0 }), at(13.5, -15.5, { s: 1.1 }), at(-1.5, -10.2, { s: .9 }));
  T.birch.push(at(-7.6, -5.4, { s: .9 }), at(-4.7, -6.5, { s: .85 }));                          // clothesline birches
  T.birch.push(at(.8, -4.4, { s: 1.0 }), at(-.6, -2.9, { s: .8 }), at(10.2, -4.6, { s: .9 }));
  for (let i = 0; i < 7; i++) T.birch.push(at(13 + r() * 5, -5 - r() * 6, { s: .8 + r() * .35 }));  // airy group on the right
  T.rowan.push(at(1.9, -14.6, { s: 1.1 }));
  for (let i = 0; i < 9; i++){                                                                 // dark spruce group framing the left
    const x = -15.5 - r() * 6, z = -2.5 - r() * 7.5;
    T.spruce.push(at(x, z, { s: 1.05 + r() * .45, rz: (r() - .5) * .06 }));
  }

  // ---- procedural fill ----
  for (let i = 0; i < 9000 && T.spruce.length < 300; i++){
    const x = (r() - .5) * 150, z = -6 - r() * 70, d = shoreZ(x) - z;
    if (d < 9 || blocked(x, z) || rockMask(x, z) > .2) continue;
    const cl = noise2(x * .08 + 4, z * .08);
    if (cl < (d < 18 ? .55 : .36)) continue;                      // clusters with clearings between
    const gap = skyGap(x, z);
    if (gap && r() < .85) continue;
    if (near(x, z, T.spruce, d > 20 ? 1.25 : 1.8)) continue;
    T.spruce.push(at(x, z, { s: (gap ? .4 : .55 + r() ** 1.4 * .75) * (1 - smooth(18, 45, d) * .3), rz: (r() - .5) * .07 }));
  }
  for (let i = 0; i < 3000 && T.pine.length < 14; i++){
    const x = (r() - .5) * 90, z = -3 - r() * 40, d = shoreZ(x) - z;
    if (d < 4 || blocked(x, z) || skyGap(x, z) || near(x, z, T.pine, 4) || near(x, z, T.spruce, 2) || (x > 0 && x < 11 && z > -16)) continue;
    if (noise2(x * .1, z * .1 + 9) < .45) continue;
    T.pine.push(at(x, z, { s: .8 + r() * .4 }));
  }
  for (let i = 0; i < 3000 && T.birch.length < 24; i++){
    const x = (r() - .5) * 60, z = 1 - r() * 20, d = shoreZ(x) - z;
    if (d < 1.5 || d > 14 || blocked(x, z) || rockMask(x, z) > .3 || (x > 2 && x < 9.5 && z < -6)) continue;
    if (near(x, z, T.birch, 3) || near(x, z, T.pine, 2.5)) continue;
    T.birch.push(at(x, z, { s: .75 + r() * .4 }));
  }
  // Aspen in the mixed belt (rounder crowns, orange-red in autumn), grey alder right along the shore.
  T.birch = T.birch.filter((p, i) => { if (i > 10 && i % 3 === 0){ T.aspen.push({ ...p, s: p.s * 1.05 }); return false; } return true; });
  for (let i = 0; i < 2000 && T.aspen.length < 12; i++){
    const x = (r() - .5) * 50, z = -4 - r() * 14, d = shoreZ(x) - z;
    if (d < 4 || blocked(x, z) || near(x, z, T.birch, 3) || near(x, z, T.aspen, 3.5) || near(x, z, T.pine, 2.5)) continue;
    T.aspen.push(at(x, z, { s: .8 + r() * .35 }));
  }
  for (let i = 0; i < 3000 && T.alder.length < 7; i++){
    const x = (r() - .5) * 46, z = shoreZ(x) - .4 - r() * 2.2, h = height(x, z);
    if (h < .1 || blocked(x, z) || rockMask(x, z) > .25 || (x > -4 && x < 12) || near(x, z, T.alder, 2.2) || near(x, z, T.birch, 1.6)) continue;
    T.alder.push(at(x, z, { s: .85 + r() * .35 }));
  }
  for (let i = 0; i < 1500 && T.juniper.length < 14; i++){
    const x = (r() - .5) * 50, z = -1 - r() * 12;
    if (blocked(x, z) || rockMask(x, z) < .1 || height(x, z) < .3) continue;
    T.juniper.push(at(x, z, { s: .7 + r() * .6 }));
  }
  // Boulders: clusters at the waterline and a few in the forest.
  const clusters = [[-10.5, 2.5], [-8, 3.6], [-2.2, 1.6], [6.2, -1.6], [10, .2], [13.6, -.6], [-13.5, -.4], [L.islet.x - 3, L.islet.z + 2]];
  for (const [cx, cz] of clusters) for (let i = 0; i < 4; i++){
    const x = cx + (r() - .5) * 3, z = cz + (r() - .5) * 2;
    if (Math.abs(x - L.pier.x) < 1.2 && z > 0) continue;
    T.boulder.push(at(x, z, { s: .35 + r() ** 2 * 1.1, y: height(x, z) - .2 }));
  }
  for (let i = 0; i < 18; i++){ const x = (r() - .5) * 60, z = -6 - r() * 25; if (!blocked(x, z)) T.boulder.push(at(x, z, { s: .4 + r() * .8, y: height(x, z) - .25 })); }
  // Bilberry on the forest floor.
  for (let i = 0; i < 4000 && T.bilberry.length < 260; i++){
    const x = (r() - .5) * 80, z = -2 - r() * 40, d = shoreZ(x) - z;
    if (d < 3 || blocked(x, z) || rockMask(x, z) > .1 || noise2(x * .3, z * .3) < .45) continue;
    if (Math.hypot(x - L.cabin.x, z - (L.cabin.z + 5)) < 9) continue;
    T.bilberry.push(at(x, z, { s: .8 + r() * .7, y: height(x, z) - .05 }));
  }
  // Reed belt in the bay and a few clumps along the west shore.
  for (let i = 0; i < 3000 && T.reed.length < 46; i++){
    const west = i % 4 === 0, x = west ? -14 - r() * 14 : -.4 + r() * 8, z = shoreZ(x) + .2 + r() * 2.6, h = height(x, z);
    if (h > .02 || h < -.75 || (Math.abs(x - L.pier.x) < 1.3) || near(x, z, T.reed, .7)) continue;
    T.reed.push({ x, z, y: h, ry: r() * 6, s: .8 + r() * .5 });
  }
  for (const [x, z] of [[-.2, 2.6], [1.4, 1.6], [.6, 4.2], [2.6, 2.9]]) T.lily.push({ x, z, y: .02, ry: r() * 6, s: .9 + r() * .4 });
  for (let i = 0; i < 4000 && T.lupine.length < 30; i++){
    const pc = i % 2 ? [1.6, -9.5] : [9.6, -15.2], x = pc[0] + (r() - .5) * 4, z = pc[1] + (r() - .5) * 3;
    if (distToPath(x, z) > 2.2 && Math.hypot(x - L.cabin.x, z - L.cabin.z) > 8.5) continue;
    if (distToPath(x, z) < .8 || cabinClear(x, z) && Math.hypot(x - L.cabin.x, z - L.cabin.z) < 6.5) continue;
    T.lupine.push(at(x, z, { s: .9 + r() * .6, y: height(x, z), c: Math.floor(r() * 4) }));
  }
  return T;
}

function variants(list, n){ const out = Array.from({ length: n }, () => []); list.forEach((p, i) => out[p.v ?? i % n].push(p)); return out; }

export function buildWorld(){
  const root = new THREE.Group();
  const terrain = buildTerrain(); root.add(terrain); root.add(farLand());
  const T = plan(), mat = vcMat(), season = {};
  for (const s of SEASONS){
    const g = new THREE.Group(); g.visible = s === 'summer';
    variants(T.bilberry, 3).forEach((list, i) => g.add(instanced(bilberryGeo(i * 5 + 1, s === 'autumn', s === 'winter'), list, mat, { shadow: false })));
    if (s !== 'winter'){
      variants(T.reed, 3).forEach((list, i) => g.add(instanced(reedGeo(i * 3 + 2, s), list, mat)));
      g.add(instanced(lilyGeo(9), T.lily, mat, { shadow: false }));
    } else variants(T.reed, 2).forEach((list, i) => g.add(instanced(reedGeo(i * 3 + 2, s), list.filter((_, k) => k % 2 === 0), mat)));
    if (s === 'summer'){
      const lm = instanced(lupineGeo(), T.lupine, mat, { tint: false, shadow: false }), c = new THREE.Color();
      T.lupine.forEach((p, i) => lm.setColorAt(i, c.set(FC.lupine[p.c])));
      g.add(lm);
    }
    season[s] = g; root.add(g);
  }
  variants(T.juniper, 2).forEach((list, i) => root.add(instanced(juniperGeo(i + 3), list, mat)));
  variants(T.boulder, 3).forEach((list, i) => root.add(instanced(boulderGeo(i * 2.7), list, mat)));

  // ---- buildings ----
  const place = (obj, x, z, yaw = 0, dy = 0) => { obj.position.set(x, height(x, z) + dy, z); obj.rotation.y = yaw; root.add(obj); return obj; };
  const S = place(sauna(), L.sauna.x, L.sauna.z, -Math.PI / 2 + L.sauna.yaw, -.12);     // ridge runs toward the lake
  S.scale.z = -1;                                                                        // mirror so the porch faces the pier (east)
  const C = place(cottage(), L.cabin.x, L.cabin.z, L.cabin.yaw, -.1);
  const W = place(woodshed(), L.woodshed.x, L.woodshed.z, L.woodshed.yaw, -.05);
  place(outhouse(), 12, -24, -.4, -.05);
  place(well(), 9.5, -19, .3, -.05);

  // ---- props ----
  const P = pier(L.pier); root.add(P);
  const boat = rowboat(); boat.position.set(L.pier.x + 1.35, -.18, 5.6); boat.rotation.y = .04; root.add(boat);
  const upturned = upturnedBoat(); place(upturned, 3.6, -3.4, .6, .02);
  const winterBoat = upturnedBoat('#b2402e'); place(winterBoat, -2.9, -2.7, 1.2, .1); winterBoat.visible = false;
  const lamp = lantern(); lamp.position.set(L.pier.x - L.pier.w / 2 + .1, L.pier.y, L.pier.z1 - .1); root.add(lamp);
  root.add(pathDetails(PATH, height, i => i >= 3));
  const bt = (x, z) => [x, height(x, z) + 1.75, z];
  root.add(clothesline(bt(-7.6, -5.4), bt(-4.7, -6.5)));
  const ham = hammock([-3.4, height(-3.4, -15.6), -15.6], [-.7, height(-.7, -17.8), -17.8]); root.add(ham);
  place(picnicTable(), 8.6, -12.4, .25);
  const flag = place(flagpole(), 9.8, -13.2);
  const fire = place(fireRing(), L.fire.x, L.fire.z);
  const bonfire = place(kokko(), L.kokko.x, L.kokko.z, 0, -.1); bonfire.visible = false;

  return {
    root, terrain, season, sauna: S, cabin: C, woodshed: W, pier: P, boat, upturned, winterBoat, lantern: lamp,
    hammock: ham, flag, fire, kokko: bonfire, plan: T, trees: null, billboards: [], treeStyle: null, seasonKey: 'summer',
  };
}

// ---------- trees, in a chosen style ----------
const TREE_KINDS = [['spruce', 5, 11], ['pine', 4, 5], ['birch', 5, 3], ['aspen', 3, 19], ['alder', 3, 23], ['rowan', 1, 29]];

/** (Re)build all trees in one style: each species has a few variants, each variant is instanced. */
export function setTreeStyle(world, style){
  if (world.trees){
    world.root.remove(world.trees.root);
    world.trees.root.traverse(o => { if (o.isMesh){ o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  }
  const build = STYLES[style] || STYLES.round, T = world.plan, root = new THREE.Group(), groups = {};
  world.billboards = [];
  for (const s of SEASONS){
    const g = new THREE.Group(); g.visible = false; groups[s] = g; root.add(g);
    const addKind = (kind, list, seed, opts) => {
      if (!list.length) return;
      for (const part of build(speciesSpec(kind, seed, s, opts))){
        const m = instanced(part.geo, list, treeMaterial(kind, part), { shadow: !part.billboard });
        if (part.billboard) world.billboards.push({ mesh: m, list });
        g.add(m);
      }
    };
    for (const [kind, n, base] of TREE_KINDS){
      const list = kind === 'pine' ? T.pine.filter(p => !p.lean) : T[kind];
      variants(list, n).forEach((l, i) => addKind(kind, l, base + i * 7));
    }
    T.pine.filter(p => p.lean).forEach(p => addKind('pine', [p], 77, { lean: p.lean }));
  }
  world.trees = { root, groups }; world.root.add(root); world.treeStyle = style;
  for (const s in groups) groups[s].visible = s === world.seasonKey;
  world._bbCam = null;
}

/** Turn the painted flats to face the camera (only when the camera has moved). */
const _o = new THREE.Object3D();
export function updateBillboards(world, cam){
  if (!world.billboards.length) return;
  if (world._bbCam && world._bbCam.distanceToSquared(cam) < 1e-4) return;
  world._bbCam = cam.clone();
  for (const { mesh, list } of world.billboards){
    list.forEach((p, i) => {
      _o.position.set(p.x, p.y, p.z); _o.rotation.set(0, Math.atan2(cam.x - p.x, cam.z - p.z), 0); _o.scale.setScalar(p.s);
      _o.updateMatrix(); mesh.setMatrixAt(i, _o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
}

export function setSeason(world, key){
  const k = key === 'late' ? 'autumn' : key === 'spring' ? 'summer' : key;
  for (const s in world.season) world.season[s].visible = s === k;
  world.seasonKey = k;
  if (world.trees) for (const s in world.trees.groups) world.trees.groups[s].visible = s === k;
  world.terrain.geometry.attributes.color.array.set(world.terrain.userData.cols[k]);
  world.terrain.geometry.attributes.color.needsUpdate = true;
  const w = k === 'winter';
  for (const o of [world.sauna, world.cabin, world.woodshed, world.pier]) if (o.userData.snow) o.userData.snow.visible = w;
  world.root.traverse(o => { if (o.userData && o.userData.snow && o.userData.snow.isMesh) o.userData.snow.visible = w; });
  world.boat.visible = !w; world.winterBoat.visible = w;
  return k;
}
