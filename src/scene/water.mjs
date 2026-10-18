// The lake: a planar reflection distorted by wind ripples, wind "silver roads" (calm and
// rippled bands, as in Gallen-Kallela's Lake Keitele), depth tint, shore foam, sun glitter,
// click ripples, and a winter mode of snowy ice with an avanto hole.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

const RIPPLES = 8;

export function makeWater(depthTex, avanto){
  const shader = {
    name: 'Lake',
    uniforms: {
      color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      depthTex: { value: depthTex }, time: { value: 0 },
      deep: { value: new THREE.Color('#2c4a6a') }, shallow: { value: new THREE.Color('#5d7a62') }, skyCol: { value: new THREE.Color('#9fb8d8') },
      refl: { value: .85 }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, sunVis: { value: 1 },
      fogColor: { value: new THREE.Color() }, fogNear: { value: 30 }, fogFar: { value: 120 },
      ice: { value: 0 }, snow: { value: new THREE.Color('#eef2f7') }, iceCol: { value: new THREE.Color('#9fb7c9') },
      avanto: { value: new THREE.Vector3(avanto.x, avanto.z, avanto.r) },
      ripples: { value: Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0)) },
      wind: { value: new THREE.Vector2(.6, .3) }, lit: { value: new THREE.Color(1, 1, 1) },
    },
    vertexShader: /* glsl */`
      uniform mat4 textureMatrix;
      varying vec4 vUv; varying vec3 vWorld; varying float vDepth;
      void main(){
        vUv = textureMatrix * vec4(position, 1.);
        vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz;
        vec4 mv = viewMatrix * w; vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse, depthTex;
      uniform vec3 deep, shallow, skyCol, sunDir, sunCol, fogColor, snow, iceCol, avanto, lit;
      uniform float time, refl, sunVis, fogNear, fogFar, ice;
      uniform vec4 ripples[${RIPPLES}];
      uniform vec2 wind;
      varying vec4 vUv; varying vec3 vWorld; varying float vDepth;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.) * .3 + vn(p * 4.1 + 3.) * .2; }
      // Height of the small waves; the gradient gives the surface normal.
      float waves(vec2 p, float calm){
        vec2 q = p + wind * time;
        float w = vn(q * vec2(.9, 2.2)) * .5 + vn(q * vec2(2.1, 4.7) - time * .3) * .3 + vn(q * 6.3 + time * .5) * .2;
        return w * calm;
      }
      void main(){
        vec2 p = vWorld.xz;
        vec2 dUv = (p + 80.) / 160.;
        float depth = texture2D(depthTex, dUv).r * 3.4;
        // Wind bands: long streaks across the lake, some mirror-calm, some rippled.
        float band = smoothstep(.4, .68, fbm(vec2(p.x * .014 + time * .006, p.y * .2)));
        float calm = mix(.25, 1., band) * smoothstep(0., .6, depth);
        float e = .05, h0 = waves(p, calm);
        vec2 grad = vec2(waves(p + vec2(e, 0), calm) - h0, waves(p + vec2(0, e), calm) - h0) / e;
        // Click ripples: rings that spread and fade.
        for (int i = 0; i < ${RIPPLES}; i++){
          vec4 r = ripples[i]; float age = time - r.z;
          if (age < 0. || age > 5.) continue;
          vec2 dv = p - r.xy; float dist = length(dv);
          float ring = sin(dist * 9. - age * 7.) * exp(-pow((dist - age * 1.1) * 1.6, 2.)) * (1. - age / 5.) * r.w;
          grad += normalize(dv + 1e-4) * ring * 1.2;
        }
        vec3 n = normalize(vec3(-grad.x * .35, 1., -grad.y * .35));
        vec3 view = normalize(cameraPosition - vWorld);
        float fres = .12 + .88 * pow(1. - max(dot(view, vec3(0, 1, 0)), 0.), 3.5);
        vec2 uv = vUv.xy / vUv.w + n.xz * .028;
        vec3 reflC = texture2D(tDiffuse, uv).rgb;
        // Reflections are a little lower in contrast and pulled toward the sky colour;
        // inside the wind lanes the rippled surface scatters the sky, so they read as pale streaks.
        reflC = mix(reflC, (reflC + skyCol) * .5, .22);
        reflC = mix(reflC, skyCol * 1.04, band * .55);
        vec3 body = mix(shallow, deep, smoothstep(.05, 2.2, depth));
        vec3 col = mix(body, reflC * .94, clamp(fres * refl + .38, 0., 1.));

        // Sun glitter.
        vec3 hv = normalize(normalize(sunDir) + view);
        float spec = pow(max(dot(n, hv), 0.), 380.) * 3. + step(.996, dot(n, hv)) * step(.5, vn(p * 9. + time * 2.)) * 2.;
        col += sunCol * spec * sunVis;
        // Foam where it is shallow at the shore.
        float foam = smoothstep(.16, .02, depth) * (.55 + .45 * sin(time * 1.3 + p.x * 2.1 + p.y * 1.7));
        col = mix(col, vec3(.92, .95, .97) * (skyCol * .3 + .75), foam * .45 * (1. - ice));
        // Winter: snowy ice, darker clear patches, cracks, and the open avanto hole.
        if (ice > .01){
          float hole = smoothstep(avanto.z, avanto.z - .12, length(p - avanto.xy));
          float clear = smoothstep(.63, .7, fbm(p * .16 + 3.));
          float crack = smoothstep(.02, 0., abs(vn(p * .7) - .5)) * .5;
          vec3 iceC = mix(snow, iceCol, clear * .8);
          iceC = mix(iceC, reflC * .6 + iceCol * .4, clear * .35);
          iceC *= 1. - crack * .25 * clear;
          iceC = mix(iceC, snow * .96, smoothstep(.3, .0, depth) * .5);
          iceC *= lit;
          // Ploughed track from the pier out onto the ice.
          col = mix(col, iceC, ice * (1. - hole));
          col = mix(col, col * .55, smoothstep(avanto.z + .1, avanto.z, length(p - avanto.xy)) * smoothstep(avanto.z - .15, avanto.z, length(p - avanto.xy)) * ice);
        }
        col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth));
        gl_FragColor = vec4(col, 1.);
      }`,
  };
  const geo = new THREE.PlaneGeometry(400, 400);
  const water = new Reflector(geo, { shader, textureWidth: 512, textureHeight: 512, clipBias: .003 });
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  const U = water.material.uniforms;
  U.depthTex.value = depthTex;
  let next = 0;
  water.ripple = (x, z, strength = 1, t) => { U.ripples.value[next].set(x, z, t, strength); next = (next + 1) % RIPPLES; };
  water.U = U;
  return water;
}
