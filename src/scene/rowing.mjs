// Rowing: a little boat game on the lake. The boat leaves the pier, passes a row of Finnish
// channel-marker gates (viitta: red spar to port, green to starboard, a paper lantern on each),
// one gate per chapter of the path, and comes back to the pier. The stage owns the scene;
// this module owns the boat, the gates, the course and the follow camera.
import * as THREE from 'three';
import { Batch, vcMat, rng, vary } from './kit.mjs';
import { rowboat } from './props.mjs';

const ink = m => { m.userData.ink = true; return m; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// The course, an unhurried loop: out past the reed bay, along the shore and round the little pine
// islet, out to the pine island with its red boathouse, across to the long island far to the
// south (from there the whole lakeside lies ahead like the painting on the home page), back
// north past the granite skerries, and home to the pier. Gates are spaced evenly along it.
const WAY = [[-1.2, 8.5], [5, 15], [16, 12.5], [27, 11.5], [36, 18.5], [39, 31], [33.5, 44], [31, 53], [24, 62], [13, 67.5], [0, 66.5],
  [-12, 58], [-19, 47], [-19.5, 36], [-14, 23], [-7, 13.5], [-1.4, 9.2]];
export const DOCK = new THREE.Vector3(-1.25, 0, 7.2);
const GATE_W = 4.6;

const PAPER = new THREE.Color('#ffe2a6'), DIM = new THREE.Color('#d8cdb6'), LIT = new THREE.Color('#ffc46e');

function buoy(red, r){
  const b = new Batch();
  const col = red ? '#b2402e' : '#3f7a4e';
  b.cyl(.09, .11, 2.6, vary(col, r, .08), [0, .5, 0], [0, 0, 0], 8);                  // the spar, standing out of the water
  b.cyl(.13, .13, .22, '#eee6d4', [0, .75, 0], [0, 0, 0], 8);                           // a pale band, as real viitta have
  if (red) b.cyl(.2, .2, .34, col, [0, 1.95, 0], [0, 0, 0], 10);                        // port: a cylinder on top
  else b.cone(.24, .46, col, [0, 2.02, 0], [0, 0, 0], 10);                               // starboard: a cone
  b.box(.04, .04, .55, '#3a2f26', [0, 2.35, .22]);                                       // the arm the lantern hangs from
  b.cyl(.14, .22, .14, '#2f3a3a', [0, -.78, 0], [0, 0, 0], 8);                          // a float collar at the waterline
  const g = new THREE.Group();
  g.add(ink(b.mesh(vcMat())));
  // A paper lantern: warm when lit, the colour of the paper when not.
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, .36, 10), new THREE.MeshBasicMaterial({ color: DIM.clone() }));
  lamp.position.set(0, 2.08, .45); lamp.castShadow = false;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.2, .1, 10), vcMat({ color: '#2a2622' })); cap.position.set(0, 2.31, .45);
  g.add(lamp, ink(cap));
  g.userData.lamp = lamp;
  return g;
}

const loader = new THREE.TextureLoader();
/** A small painted sign on a raft beside the gate, showing the project's picture to the boat as it comes. */
function sign(cover, r){
  const g = new THREE.Group(), b = new Batch();
  b.box(1.5, .16, 1.1, vary('#8a7f70', r, .08), [0, -.05, 0]);                      // the raft
  b.box(.09, 1.5, .09, AC_POST, [0, .7, .25]);
  b.box(1.9, 1.34, .07, '#3a2f26', [0, 1.55, .25]);                                   // the board's dark frame
  g.add(ink(b.mesh(vcMat())));
  const mat = new THREE.MeshLambertMaterial({ color: '#d8cdb6', emissive: '#2a2418' });
  if (cover) loader.load(cover, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.color.set('#ffffff'); mat.needsUpdate = true; });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.76, 1.2), mat);
  pic.position.set(0, 1.55, .21); pic.rotation.y = Math.PI;                           // faces the boat coming up from behind
  const back = pic.clone(); back.position.z = .29; back.rotation.y = 0; back.scale.x = -1;   // and the same picture on the back
  g.add(pic, back);
  return g;
}
const AC_POST = '#5a4a3a';

function makeGate(i, item){
  const r = rng(91 + i * 7), g = new THREE.Group();
  const port = buoy(true, r), star = buoy(false, r);
  port.position.x = -GATE_W / 2; star.position.x = GATE_W / 2;
  g.add(port, star);
  const sg = sign(item && item.cover, r);
  sg.position.set(GATE_W / 2 + 1.7, -.12, .4); sg.rotation.y = -.35;
  g.add(sg);
  g.userData = { lamps: [port.userData.lamp, star.userData.lamp], buoys: [port, star, sg], phase: r() * 6 };
  return g;
}

/** Two swans drifting off the long island, for company on the far side of the lake. */
function swans(){
  const g = new THREE.Group();
  for (const [x, z, ry, s] of [[0, 0, .4, 1], [1.5, .9, .7, .85]]){
    const b = new Batch();
    b.sphere(.5, '#f4f1ea', [0, .12, 0], [1, .55, 1.6], 12);
    b.add(new THREE.TorusGeometry(.36, .07, 6, 14, Math.PI * .9), '#f4f1ea', [0, .5, .42], [0, Math.PI / 2, 0]);
    b.sphere(.11, '#f4f1ea', [0, .82, .62], [1, .9, 1.4], 8);
    b.cone(.05, .2, '#d8643a', [0, .79, .8], [Math.PI / 2, 0, 0], 6);
    const m = ink(b.mesh(vcMat())); m.position.set(x, 0, z); m.rotation.y = ry; m.scale.setScalar(s);
    g.add(m);
  }
  return g;
}

/** Oars that can row. Each pivots at its oarlock (side -1 or +1 along x); the blade sweeps and dips through a stroke. */
function makeOar(side){
  const pivot = new THREE.Group(), b = new Batch();
  b.cyl(.024, .024, 2.6, '#c49a62', [side * .6, 0, 0], [0, 0, Math.PI / 2], 6);
  b.box(.56, .2, .04, '#b88c55', [side * 1.7, 0, 0]);
  pivot.add(ink(b.mesh(vcMat())));
  pivot.position.set(side * .62, .5, .15);
  return pivot;
}

export function createRowing({ scene, W, water, height }){
  const curve = new THREE.CatmullRomCurve3(WAY.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const root = new THREE.Group(); root.visible = false; scene.add(root);

  // The game boat: the same rowboat without its resting oars, and two oars that row.
  const boat = rowboat('#b2402e', '#ece4d6', { oars: false });
  const oars = [makeOar(-1), makeOar(1)];
  boat.add(...oars); root.add(boat);

  const pair = swans(); pair.position.set(-6, -.12, 64); scene.add(pair);
  let gates = [], spots = [];
  const S = {
    on: false, n: 0, next: 0, done: false, x: 0, z: 0, yaw: 0, v: 0, w: 0, stroke: [0, 0], input: { f: 0, r: 0 },
    camYaw: 0, wake: 0, onGate: null, onDock: null, lastGate: -1,
  };

  function build(items){
    const n = items.length;
    for (const g of gates) root.remove(g);
    gates = []; spots = [];
    // Gates sit between the start and the last stretch home; the pier itself is the finish.
    for (let i = 0; i < n; i++){
      const u = (i + 1) / (n + 1.15);
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const g = makeGate(i, items[i]);
      // Slide the gate along its line until both buoys and the sign raft float in open water.
      const nx = t.z, nz = -t.x, wet = (x, z) => height(x, z) < -.9;
      for (const o of [0, .8, -.8, 1.6, -1.6, 2.4, -2.4, 3.2, -3.2]){
        const cx = p.x + nx * o, cz = p.z + nz * o;
        if ([-GATE_W / 2 - .6, 0, GATE_W / 2 + 2.6].every(k => wet(cx + nx * k, cz + nz * k))){ p.x = cx; p.z = cz; break; }
      }
      g.position.set(p.x, -.15, p.z);
      g.rotation.y = Math.atan2(t.x, t.z);
      root.add(g); gates.push(g); spots.push({ p, t, yaw: g.rotation.y });
    }
  }

  function start(items, { onGate, onDock }){
    const n = items.length;
    build(items);
    Object.assign(S, { on: true, n, next: 0, done: false, v: 0, w: 0, stroke: [0, 0], onGate, onDock, lastGate: -1 });
    S.x = W.boat.position.x; S.z = W.boat.position.z + .4;
    // Point the bow at the first gate, and start the camera out over the water.
    S.yaw = Math.atan2(spots[0].p.x - S.x, spots[0].p.z - S.z);
    S.camOff = OFFS.find(o => clear(S.yaw + o, 30)) ?? 0; S.camYaw = S.yaw + S.camOff;
    W.boat.visible = false; root.visible = true;
    gates.forEach(paint);
  }
  function stop(){
    S.on = false; root.visible = false; W.boat.visible = true;
  }
  function paint(g, i){
    const k = i < S.next ? 2 : i === S.next ? 1 : 0;
    g.userData.state = k;
  }

  // Keep the boat on the water: if the bow or stern would ground, push it back out.
  function ground(x, z){ return height(x, z) > -.45; }
  function collide(){
    const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw);
    for (const s of [2.1, -2.1, 0]){
      const px = S.x + fx * s, pz = S.z + fz * s;
      if (!ground(px, pz)) continue;
      // Push away down the slope of the ground.
      const e = .5, gx = height(px + e, pz) - height(px - e, pz), gz = height(px, pz + e) - height(px, pz - e);
      const gl = Math.hypot(gx, gz) || 1;
      S.x -= gx / gl * .06; S.z -= gz / gl * .06; S.v *= .6;
    }
    // A soft fence far out, so nobody rows off the edge of the painting.
    const cx = 10, cz = 38, dx = S.x - cx, dz = S.z - cz, d = Math.hypot(dx / 52, dz / 44);
    if (d > 1){ S.x = cx + dx / d; S.z = cz + dz / d; S.v *= .9; }
  }

  function update(dt, t){
    // The swans drift in a slow circle, whether or not anyone is rowing.
    pair.position.set(-6 + Math.sin(t * .02) * 9, -.12, 63 + Math.cos(t * .02) * 3); pair.rotation.y = t * .02 + Math.PI / 2;
    if (!S.on) return;
    const { f, r } = S.input;
    // Oar 0 is on the -x side, oar 1 on +x. Facing the bow (+z), screen right is -x, so turning right
    // means pulling the +x oar harder. Forward pulls both.
    const pull = [f - r * .9, f + r * .9].map(x => Math.max(-1, Math.min(1, x)));
    let thrust = 0, torque = 0;
    for (let k = 0; k < 2; k++){
      const a = Math.abs(pull[k]);
      if (a > .05 || S.stroke[k] % 1 > .02) S.stroke[k] += dt * (a > .05 ? .78 : .9);   // finish a stroke already begun
      const ph = S.stroke[k] % 1, drive = ph < .55 ? Math.sin(ph / .55 * Math.PI) : 0;
      const sgn = Math.sign(pull[k]) || 1;
      thrust += drive * sgn * .5 * (a > .05 ? 1 : .3);
      torque += drive * sgn * (k === 0 ? 1 : -1) * .5;
      // Oar pose: the blade reaches toward the bow at the catch, sweeps aft in the water through the
      // drive, then lifts and returns. `sweep` > 0 is toward the bow.
      const sweep = (ph < .55 ? .55 - ph / .55 * 1.1 : -.55 + (ph - .55) / .45 * 1.1) * sgn;
      const lift = ph < .55 ? -.2 : .1 + Math.sin((ph - .55) / .45 * Math.PI) * .08;
      const side = k === 0 ? -1 : 1;
      oars[k].rotation.set(0, -side * sweep, side * lift);
    }
    S.v += (thrust * 3 - S.v * .55) * dt;
    S.w += (torque * 1.25 - S.w * 1.8) * dt;
    S.yaw += S.w * dt;
    S.x += Math.sin(S.yaw) * S.v * dt; S.z += Math.cos(S.yaw) * S.v * dt;
    collide();

    boat.position.set(S.x, -.18 + Math.sin(t * 1.3) * .025, S.z);
    boat.rotation.set(Math.sin(t * .8) * .012 - S.v * .012, S.yaw, Math.sin(t * 1.1) * .02 - S.w * .06);

    // A wake: small rings left behind while the boat moves.
    S.wake += dt * Math.abs(S.v);
    if (S.wake > .9){ S.wake = 0; water.ripple(S.x - Math.sin(S.yaw) * 1.8, S.z - Math.cos(S.yaw) * 1.8, Math.min(1, .35 + Math.abs(S.v) * .4), t); }

    // Gates: crossing the line between the two spars counts; so does passing close by the middle.
    if (S.next < S.n){
      const sp = spots[S.next], dx = S.x - sp.p.x, dz = S.z - sp.p.z;
      const along = dx * sp.t.x + dz * sp.t.z, across = Math.abs(dx * sp.t.z - dz * sp.t.x);
      if ((along > 0 && along < 2.5 && across < GATE_W / 2 + .8) || Math.hypot(dx, dz) < 1.6){
        const g = gates[S.next];
        for (const b of g.userData.buoys) { const q = b.getWorldPosition(new THREE.Vector3()); water.ripple(q.x, q.z, 1.2, t); }
        water.ripple(sp.p.x, sp.p.z, 1.5, t);
        g.userData.passedAt = t;
        S.next++; S.onGate && S.onGate(S.next - 1);
      }
    } else if (!S.done && Math.hypot(S.x - DOCK.x, S.z - DOCK.z) < 3.2){
      S.done = true; S.onDock && S.onDock();
    }

    // Lanterns: dark paper ahead, a soft breathing glow on the next gate, warm and steady once passed.
    gates.forEach((g, i) => {
      const st = i < S.next ? 2 : i === S.next ? 1 : 0;
      const pulse = .75 + .25 * Math.sin(t * 2.4);
      const flash = g.userData.passedAt != null ? Math.max(0, 1 - (t - g.userData.passedAt) / 1.2) : 0;
      for (const L of g.userData.lamps){
        if (st === 2) L.material.color.copy(LIT).multiplyScalar(1.6 + flash * 1.6);
        else if (st === 1) L.material.color.copy(PAPER).multiplyScalar(1.2 + pulse * .9);
        else L.material.color.copy(DIM);
      }
      g.userData.buoys.forEach((b, k) => { b.position.y = Math.sin(t * 1.2 + g.userData.phase + k * 1.7) * .06; b.rotation.z = Math.sin(t * .9 + k + g.userData.phase) * .03; });
    });
  }

  /** Where the camera should be: high and far behind the boat, on a long lens, so it stays a painting. */
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();
  // The camera must stay out over the water: behind the boat when it can, otherwise swung round
  // to the side until both it and its line of sight to the boat are clear of the shore and its trees.
  const OFFS = [0, .45, -.45, .9, -.9, 1.35, -1.35, 1.8, -1.8, 2.3, -2.3, 2.8, -2.8, Math.PI];
  function clear(yaw, back){
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    for (let k = 1; k <= 4; k++){ const d = back * k / 4; if (height(S.x - fx * d, S.z - fz * d) > -.6 + (k === 4 ? -.5 : 0)) return false; }
    return true;
  }
  function follow(dt, tall){
    const back = tall ? 26 : 30, up = tall ? 12 : 9.5;
    if (S.camOff != null && clear(S.yaw + S.camOff, back) && Math.abs(S.camOff) > 0 && clear(S.yaw, back)) S.camOff = 0;   // go back behind when it is clear again
    if (S.camOff == null || !clear(S.yaw + S.camOff, back)) S.camOff = OFFS.find(o => clear(S.yaw + o, back)) ?? 0;
    // The camera swings round slowly after the boat, never snapping.
    S.camYaw = S.camYaw + wrap(S.yaw + S.camOff - S.camYaw) * (1 - Math.exp(-dt * .8));
    const fx = Math.sin(S.camYaw), fz = Math.cos(S.camYaw);
    camPos.set(S.x - fx * back, up, S.z - fz * back);
    camTarget.set(S.x + fx * 7, .6, S.z + fz * 7);
    return { pos: camPos, target: camTarget };
  }

  return {
    S, start, stop, update, follow, curve,
    gateAnchor(i){ const g = gates[i]; return g ? g.localToWorld(new THREE.Vector3(0, 3, 0)) : null; },
    dockAnchor(){ return DOCK.clone().setY(2.2); },
    boatPos(){ return new THREE.Vector3(S.x, 0, S.z); },
    /** For tests: where the boat is and where it should head next. */
    debug(){ const sp = spots[S.next]; return { x: S.x, z: S.z, yaw: S.yaw, v: S.v, next: S.next, tx: sp ? sp.p.x : DOCK.x, tz: sp ? sp.p.z : DOCK.z, len: curve.getLength() }; },
  };
}
