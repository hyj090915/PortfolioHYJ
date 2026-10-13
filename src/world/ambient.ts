import * as THREE from 'three';
import { clay } from './materials';

/** 셰이더들이 같이 쓰는 유니폼 */
export function createAmbientUniforms() {
  return { uTime: { value: 0 }, uDay: { value: 1 }, uNight: { value: 0 } };
}
export type AmbientUniforms = ReturnType<typeof createAmbientUniforms>;

/** 낮: 땅 위로 아주 옅은 구름 그림자가 흘러간다 (알베도만 살짝 어둡게) */
export function installCloudShadows(mat: THREE.Material, amb: AmbientUniforms) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = amb.uTime;
    sh.uniforms.uDay = amb.uDay;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
      varying vec3 vWP; uniform float uTime; uniform float uDay;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      vec2 cp = vWP.xz * 0.06 + vec2(uTime * 0.018, uTime * 0.007);
      float cl = smoothstep(0.5, 0.78, fbm(cp));
      diffuseColor.rgb *= 1.0 - cl * 0.1 * uDay;`);
  };
}

interface CloudData { x: number; y: number; z: number; v: number; base: number; ph: number }

/** 낮: 화면 윗줄 뒤편에 천천히 흘러가는 작은 클레이 구름 */
export function createClouds(scene: THREE.Scene) {
  const mat = clay('#ffffff', { sheen: 0.3, transparent: true });
  const PUFFS: [number, number, number, number][] = [[0, 0, 0, 0.55], [0.58, -0.1, 0.05, 0.42], [-0.55, -0.12, 0, 0.4], [0.18, 0.26, -0.05, 0.4], [-0.2, 0.18, 0.12, 0.32]];
  const clouds: { g: THREE.Group; u: CloudData }[] = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const n = 3 + (i % 3);
    PUFFS.slice(0, n).forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat);
      m.position.set(x, y, z);
      m.scale.y = 0.78;
      g.add(m);
    });
    const base = 0.55 + Math.random() * 0.4;
    const u = { x: -8 + i * 7.5 + Math.random() * 3, y: 2.0 + Math.random() * 0.7, z: -5.5 - Math.random() * 3, v: 0.06 + Math.random() * 0.07, base, ph: Math.random() * 6 };
    scene.add(g);
    clouds.push({ g, u });
  }

  return {
    /** lift: 구름 고도 보정 (모바일 무대용) */
    update(dt: number, t: number, camX: number, nightAmt: number, reduce: boolean, lift = 0) {
      clouds.forEach(({ g, u }) => {
        u.x += u.v * dt * (reduce ? 0 : 1);
        if (u.x > camX + 24) u.x -= 56; // 보이는 구간 밖으로 나가면 반대편으로
        if (u.x < camX - 32) u.x += 56;
        const k = Math.max(0.001, 1 - nightAmt);
        g.position.set(u.x, u.y + lift + Math.sin(t * 0.3 + u.ph) * 0.06 + nightAmt * 1.5, u.z);
        g.scale.setScalar(u.base * (0.6 + 0.4 * k));
        g.visible = k > 0.02;
      });
      mat.opacity = 1 - nightAmt;
    },
  };
}

/** 밤: 소품 뒤 공간의 별. 대부분 흐리고 몇 개만 밝게, 각자 다른 박자로 반짝임 */
export function createStars(scene: THREE.Scene, amb: AmbientUniforms, pixelRatio: number) {
  const COUNT = 520;
  const pos = new Float32Array(COUNT * 3);
  const data = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = -14 + Math.random() * 58;
    pos[i * 3 + 1] = 0.8 + Math.pow(Math.random(), 0.7) * 3.6;
    pos[i * 3 + 2] = -19 + Math.random() * 15;
    const r = Math.random();
    data[i * 4] = 1.2 + Math.pow(r, 7) * 7.5; // 크기: 멱법칙 → 큰 별은 드물게
    data[i * 4 + 1] = Math.random() * 6.283; // 위상
    data[i * 4 + 2] = 0.25 + Math.random() * 0.9; // 반짝임 속도
    data[i * 4 + 3] = 0.25 + Math.pow(r, 3) * 0.75; // 밝기
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: amb.uTime, uNight: amb.uNight, uPR: { value: pixelRatio } },
    vertexShader: `
    attribute vec4 aData; uniform float uTime; uniform float uPR; varying float vA;
    void main() {
      vec3 p = position;
      p.x += sin(uTime * 0.05 + aData.y) * 0.12;
      p.y += sin(uTime * 0.07 + aData.y * 1.7) * 0.05;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float tw = 0.6 + 0.4 * sin(uTime * aData.z + aData.y) * sin(uTime * aData.z * 0.43 + aData.y * 2.3);
      vA = aData.w * tw;
      gl_PointSize = aData.x * uPR * (34.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
    fragmentShader: `
    uniform float uNight; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float glow = smoothstep(0.5, 0.0, d);
      float core = smoothstep(0.16, 0.0, d);
      float a = (glow * glow * 0.5 + core * 0.8) * vA * uNight;
      if (a < 0.003) discard;
      gl_FragColor = vec4(vec3(0.86, 0.9, 1.0), a);
    }`,
  });
  const stars = new THREE.Points(geo, mat);
  stars.frustumCulled = false;
  scene.add(stars);
  return stars;
}
