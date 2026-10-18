// Sky dome: multi-stop gradient keyed by elevation, horizon glow toward the sun,
// sun and moon discs, twinkling stars and a winter aurora.
import * as THREE from 'three';

export function makeSky(){
  const u = {
    s0: { value: new THREE.Color() }, s1: { value: new THREE.Color() }, s2: { value: new THREE.Color() }, s3: { value: new THREE.Color() }, s4: { value: new THREE.Color() },
    haze: { value: new THREE.Color() }, glow: { value: new THREE.Color() }, glowAmt: { value: 0 }, glowW: { value: 50 },
    sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, sunVis: { value: 0 },
    moonDir: { value: new THREE.Vector3(0, 1, 0) }, moonVis: { value: 0 }, moonPhase: { value: .5 },
    stars: { value: 0 }, aurora: { value: 0 }, time: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 s0, s1, s2, s3, s4, haze, glow, sunDir, sunCol, moonDir;
      uniform float glowAmt, glowW, sunVis, moonVis, moonPhase, stars, aurora, time;
      varying vec3 vDir;
      float h31(vec3 p){ p = fract(p * .1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vDir);
        float e = degrees(asin(clamp(d.y, -1., 1.)));
        vec3 c;
        if (e < 0.) c = mix(s4, haze, smoothstep(0., -6., e));
        else if (e < 3.) c = mix(s4, s3, e / 3.);
        else if (e < 10.) c = mix(s3, s2, (e - 3.) / 7.);
        else if (e < 24.) c = mix(s2, s1, (e - 10.) / 14.);
        else c = mix(s1, s0, smoothstep(24., 80., e));
        // Glow toward the sun's azimuth, strongest at the horizon.
        vec2 hz = normalize(d.xz + 1e-5), sz = normalize(sunDir.xz + 1e-5);
        float az = degrees(acos(clamp(dot(hz, sz), -1., 1.)));
        float g = exp(-pow(az / glowW, 2.)) * exp(-max(e, 0.) / 14.) * glowAmt;
        c = mix(c, glow, clamp(g, 0., 1.));
        // Sun.
        float sd = dot(d, normalize(sunDir));
        c += sunCol * (smoothstep(.9994, .9997, sd) * 3. + pow(max(sd, 0.), 280.) * .9 + pow(max(sd, 0.), 18.) * .12) * sunVis;
        // Moon with a soft phase shading.
        vec3 md = normalize(moonDir); float mdd = dot(d, md);
        if (mdd > .9990){
          vec3 t = normalize(cross(md, vec3(0, 1, 0))); vec3 b = cross(t, md);
          vec2 q = vec2(dot(d - md, t), dot(d - md, b)) / .045;
          float lit = smoothstep(-.2, .2, q.x * (moonPhase < .5 ? 1. : -1.) + cos(moonPhase * 6.2832) * sqrt(max(0., 1. - q.y * q.y)));
          c = mix(c, vec3(1., .97, .9) * (.25 + .9 * lit), smoothstep(.99905, .9993, mdd) * moonVis);
        }
        c += vec3(.9, .9, 1.) * pow(max(mdd, 0.), 60.) * .12 * moonVis;
        // Stars.
        if (stars > .01 && e > 2.){
          vec3 g3 = floor(d * 260.); float s = h31(g3);
          float tw = .6 + .4 * sin(time * (1.5 + s * 3.) + s * 60.);
          float star = step(.9965, s) * smoothstep(.35, 0., length(fract(d * 260.) - .5)) * tw;
          c += vec3(.95, .95, 1.) * star * stars * smoothstep(2., 14., e) * 1.4;
        }
        // Aurora: folded curtains with vertical rays, green into violet at the top.
        if (aurora > .01 && e > 4.){
          float a = atan(d.x, -d.z);
          float fold = sin(a * 3. + vn(vec2(a * 2., time * .05)) * 4. + time * .04);
          float band = exp(-pow((e - 15. - fold * 5.) / 7., 2.));
          float rays = .55 + .45 * vn(vec2(a * 60., time * .25)) * vn(vec2(a * 13., time * .1));
          vec3 ac = mix(vec3(.25, 1., .55), vec3(.6, .35, 1.), smoothstep(14., 30., e));
          c += ac * band * rays * aurora * .9 * smoothstep(3., 9., e);
        }
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  return { mesh, u };
}
