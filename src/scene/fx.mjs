// Soft puffs (clouds, chimney smoke, sauna steam), snow and fireflies.
import * as THREE from 'three';
import { rng } from './kit.mjs';

const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
`;

/** Camera-facing soft blobs drawn in one call. Each puff: position, size, shade (0 underside .. 1 lit top), alpha. */
export class Puffs {
  constructor(max, { fog = true, depthTest = true } = {}){
    this.max = max; this.n = 0;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.pos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.par = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);   // size, shade, alpha, seed
    this.pos.setUsage(THREE.DynamicDrawUsage); this.par.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.pos); g.setAttribute('iPar', this.par);
    g.instanceCount = 0;
    this.uniforms = {
      cShade: { value: new THREE.Color('#8890b8') }, cMid: { value: new THREE.Color('#d8dcec') }, cLit: { value: new THREE.Color('#ffffff') },
      fogColor: { value: new THREE.Color() }, fogNear: { value: 1e4 }, fogFar: { value: 2e4 }, useFog: { value: fog ? 1 : 0 },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, depthTest,
      vertexShader: /* glsl */`
        attribute vec3 iPos; attribute vec4 iPar;
        varying vec2 vUv; varying vec4 vPar; varying float vDepth;
        void main(){
          vUv = position.xy; vPar = iPar;
          vec4 mv = modelViewMatrix * vec4(iPos, 1.);
          mv.xy += position.xy * iPar.x;
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 cShade, cMid, cLit, fogColor; uniform float fogNear, fogFar, useFog;
        varying vec2 vUv; varying vec4 vPar; varying float vDepth;
        ${NOISE}
        void main(){
          float r = length(vUv);
          float n = vn(vUv * 2.2 + vPar.w * 17.) * .6 + vn(vUv * 5. + vPar.w * 5.) * .4;
          float a = smoothstep(1., .25, r + (n - .5) * .45) * vPar.z;
          if (a < .004) discard;
          float s = clamp(vPar.y + vUv.y * .3 + (n - .5) * .2, 0., 1.);
          vec3 col = s < .5 ? mix(cShade, cMid, s * 2.) : mix(cMid, cLit, s * 2. - 1.);
          if (useFog > .5) col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth));
          gl_FragColor = vec4(col, a);
        }`,
    });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.frustumCulled = false;
    this.items = [];
  }
  add(p){ if (this.items.length < this.max) this.items.push(p); return p; }
  /** Write the live items to the GPU buffers. Each item: {x,y,z,size,shade,alpha,seed}. */
  flush(){
    const P = this.pos.array, Q = this.par.array; let i = 0;
    for (const p of this.items){
      if (p.alpha <= .002) continue;
      P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z;
      Q[i * 4] = p.size; Q[i * 4 + 1] = p.shade; Q[i * 4 + 2] = p.alpha; Q[i * 4 + 3] = p.seed;
      i++;
    }
    this.mesh.geometry.instanceCount = i;
    this.pos.needsUpdate = this.par.needsUpdate = true;
  }
}

/** Big soft cumulus clouds in the sky, slowly drifting east. */
export function makeClouds(){
  const sys = new Puffs(360, { fog: false }), r = rng(31), clusters = [];
  for (let c = 0; c < 14; c++){
    const ang = -Math.PI * .6 + r() * Math.PI * 1.2, dist = 170 + r() * 120;
    const cl = { x: Math.sin(ang) * dist, y: 16 + r() * 22, z: -Math.cos(ang) * dist - 30, puffs: [], speed: .25 + r() * .3 };
    const n = 14 + Math.floor(r() * 10), w = 26 + r() * 26;
    for (let i = 0; i < n; i++){
      const u = (r() - .5), up = Math.abs(r() + r() - 1) * (1 - Math.abs(u) * 1.4);
      cl.puffs.push(sys.add({ ox: u * w, oy: up * w * .32, oz: (r() - .5) * 10, size: 8 + r() * 9 + up * 5, shade: .25 + up * .9, alpha: .95, seed: r() * 10 }));
    }
    clusters.push(cl);
  }
  sys.update = (dt, opacity) => {
    for (const cl of clusters){
      cl.x += cl.speed * dt; if (cl.x > 200) cl.x -= 400;
      for (const p of cl.puffs){ p.x = cl.x + p.ox; p.y = cl.y + p.oy; p.z = cl.z + p.oz; p.alpha = .95 * opacity; }
    }
    sys.flush();
  };
  return sys;
}

/** Chimney smoke and the sauna steam cloud. */
export function makeSmoke(){
  const sys = new Puffs(420), r = rng(41);
  const emitters = [];
  const clouds = [];
  sys.emitter = (pos, rate = 2.5) => { const e = { pos, rate, acc: 0, on: true }; emitters.push(e); return e; };
  /** Throw water on the stones: a burst of steam that gathers into a small cloud and drifts over the lake. */
  sys.loyly = (from, door) => {
    const cloud = { x: from.x, y: from.y + 2.5, z: from.z, vx: .25, vz: .55, t: 0 };
    for (let i = 0; i < 34; i++){
      const src = i % 3 === 0 ? door : from;
      sys.add({
        x: src.x + (r() - .5) * .4, y: src.y, z: src.z + (r() - .5) * .4, size: .25, grow: .5 + r() * .5,
        vx: (r() - .5) * .6, vy: 1.4 + r() * 1.2, vz: (r() - .5) * .6, shade: .7, alpha: 0, seed: r() * 10, life: 0,
        ox: (r() - .5) * 2.6, oy: Math.abs(r() + r() - 1) * 1.1, oz: (r() - .5) * 1.4, target: .75 + r() * .7, cloud,
      });
    }
    clouds.push(cloud);
  };
  sys.update = (dt, wind) => {
    for (const e of emitters){
      if (!e.on) continue;
      e.acc += dt * e.rate;
      while (e.acc > 1){ e.acc -= 1; sys.add({ x: e.pos.x, y: e.pos.y, z: e.pos.z, vx: (r() - .5) * .1, vy: .55 + r() * .25, vz: (r() - .5) * .1, size: .22, grow: .28, shade: .55, alpha: 0, seed: r() * 10, life: 0, max: 6 + r() * 3 }); }
    }
    for (const c of clouds){
      c.t += dt;
      if (c.t > 3){ c.x += c.vx * dt; c.z += c.vz * dt; c.y += Math.min(.5, .1 + c.t * .02) * dt; }
    }
    for (const p of sys.items){
      p.life += dt;
      if (p.cloud){
        const c = p.cloud, k = Math.min(1, Math.max(0, (p.life - 1.2) / 2.5));
        if (k > 0){
          p.x += (c.x + p.ox - p.x) * k * dt * 1.5; p.y += (c.y + p.oy - p.y) * k * dt * 1.5; p.z += (c.z + p.oz - p.z) * k * dt * 1.5;
          p.size += (p.target - p.size) * dt * .8;
          p.shade = .15 + p.oy * .5;
        } else { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy *= 1 - dt * .6; p.size += p.grow * dt; }
        p.alpha = Math.min(.42, p.life * .9) * (1 - Math.max(0, (c.t - 35) / 10));
        if (c.t > 45) p.dead = true;
      } else {
        p.x += (p.vx + wind.x * Math.min(1, p.life * .4)) * dt; p.y += p.vy * dt; p.z += (p.vz + wind.y * Math.min(1, p.life * .4)) * dt;
        p.size += p.grow * dt;
        p.alpha = Math.min(.3, p.life * .5) * Math.max(0, 1 - p.life / p.max);
        if (p.life > p.max) p.dead = true;
      }
    }
    sys.items = sys.items.filter(p => !p.dead);
    for (let i = clouds.length - 1; i >= 0; i--) if (clouds[i].t > 45) clouds.splice(i, 1);
    sys.flush();
  };
  sys.clouds = clouds;
  /** Drop any steam clouds still drifting (used when the film jumps to another season). */
  sys.clearSteam = () => { clouds.length = 0; sys.items = sys.items.filter(p => !p.cloud); };
  return sys;
}

/** Points that fall (snow) or hover and blink (fireflies), kept in a box around a centre. */
export function makeSnow(count = 1400){
  const r = rng(51), g = new THREE.BufferGeometry(), pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++){ pos.set([(r() - .5) * 50, r() * 22, (r() - .5) * 50], i * 3); seed[i] = r(); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, center: { value: new THREE.Vector3() }, amount: { value: 0 }, scale: { value: 300 }, color: { value: new THREE.Color('#ffffff') } },
    vertexShader: /* glsl */`
      attribute float seed; uniform float time, scale, amount; uniform vec3 center; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y - time * (.6 + seed * .5), 22.);
        p.x += sin(time * .5 + seed * 30.) * .6 + time * .25; p.z += cos(time * .4 + seed * 20.) * .4;
        p.xz = mod(p.xz - center.xz + 25., 50.) - 25. + center.xz;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = scale * (.06 + seed * .06) / -mv.z;
        vA = step(seed, amount) * smoothstep(60., 10., -mv.z);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 color; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5 || vA < .01) discard; gl_FragColor = vec4(color, vA * smoothstep(.5, .1, d) * .9); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return pts;
}

export function makeFireflies(spots, count = 60){
  const r = rng(61), g = new THREE.BufferGeometry(), pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++){ const s = spots[i % spots.length]; pos.set([s.x + (r() - .5) * 6, .4 + r() * 1.6, s.z + (r() - .5) * 4], i * 3); seed[i] = r(); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, amount: { value: 0 }, scale: { value: 300 } },
    vertexShader: /* glsl */`
      attribute float seed; uniform float time, scale; varying float vA;
      void main(){
        vec3 p = position + vec3(sin(time * .4 + seed * 40.), sin(time * .7 + seed * 13.) * .4, cos(time * .3 + seed * 25.)) * .7;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = scale * .18 / -mv.z;
        vA = pow(max(0., sin(time * (1. + seed) + seed * 50.)), 3.);
      }`,
    fragmentShader: /* glsl */`
      uniform float amount; varying float vA;
      void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(1., .9, .45) * 2., vA * amount * smoothstep(.5, 0., d)); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return pts;
}

/** A band of big soft puffs in front of the camera that sweeps across the frame (hides a season change). */
export function makeVeil(){
  const sys = new Puffs(90, { fog: false }), r = rng(71), items = [];
  for (let i = 0; i < 80; i++) items.push(sys.add({ u: r(), v: r(), d: 10 + r() * 14, size: 3.2 + r() * 4.5, shade: .12 + r() * .5, alpha: 0, seed: r() * 10, x: 0, y: 0, z: 0 }));
  const right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
  /** p: 0 (band off to the right) .. 1 (band gone to the left); fully covering around .5. */
  sys.set = (p, camera, amount = 1) => {
    camera.matrixWorld.extractBasis(right, up, fwd); fwd.negate();
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = halfH * camera.aspect;
    for (const it of items){
      const sx = (it.u * 1.2 - .6) * (1 + it.v * .3) + (1.6 - p * 3.2) * 1.3;     // screen x, sweeping right to left
      const sy = it.v * 1.5 - .55;                                                // a low rolling band, not the whole sky
      const P = camera.position.clone().addScaledVector(fwd, it.d).addScaledVector(right, sx * halfW * it.d).addScaledVector(up, sy * halfH * it.d);
      it.x = P.x; it.y = P.y; it.z = P.z;
      it.alpha = amount * .88 * Math.max(0, 1 - Math.abs(sx) * .5);
    }
    sys.flush();
  };
  return sys;
}

/** A cloud bank in world space for the opening shot to dive through. */
export function makeBank(center){
  const sys = new Puffs(220, { fog: false }), r = rng(81);
  for (let i = 0; i < 200; i++){
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    sys.add({ x: center.x + Math.cos(a) * d * 60, y: center.y + (r() - .5) * 18, z: center.z + Math.sin(a) * d * 45 - r() * 20,
      size: 7 + r() * 9, shade: .1 + r() * .75, alpha: .9, seed: r() * 10 });
  }
  sys.flush();
  return sys;
}

/** A small flock of birds: dark V shapes flapping across the sky. */
export function makeBirds(n = 9){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -.55, .12, -.1, -.1, .02, .05, 0, 0, 0, .1, .02, .05, .55, .12, -.1]), 3));
  g.computeVertexNormals();
  const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: '#2a2e36', side: THREE.DoubleSide }), n);
  m.frustumCulled = false;
  const r = rng(91), birds = Array.from({ length: n }, (_, i) => ({ ox: (r() - .5) * 8 - i * .9, oy: (r() - .5) * 2.4, oz: (r() - .5) * 5, ph: r() * 6 }));
  const o = new THREE.Object3D();
  m.update = (t, start, dur = 14, path = { x0: -70, x1: 75, y: 16, z: -38 }) => {
    const k = (t - start) / dur;
    m.visible = k > 0 && k < 1;
    if (!m.visible) return;
    birds.forEach((b, i) => {
      const x = path.x0 + (path.x1 - path.x0) * k + b.ox, y = path.y + b.oy + Math.sin(k * 6 + b.ph) * .6, z = path.z + b.oz;
      o.position.set(x, y, z); o.rotation.set(0, 0, 0);
      const flap = Math.sin(t * 9 + b.ph * 3);
      o.scale.set(1.4, 1.4 * (.3 + .9 * Math.abs(flap)) * Math.sign(flap || 1), 1.4);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return m;
}
