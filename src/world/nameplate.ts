import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { pointer } from '@/lib/pointer';
import fontData from './fonts/bricolage-800-yejun.json';
import type { Palette } from './materials';
import { MOBILE_STAGE, isMobileLayout } from './layout';
import { onWorldTap } from './input';

/**
 * 히어로 뒤쪽 땅 위에 서 있는 클레이 이름 "yejun."
 * 로고와 같은 폰트(Bricolage Grotesque 800)를 입체로 뽑아서 한 글자씩 바닥에 올려둔 장난감 글자.
 * - 마우스 올리면 그 글자가 통 튐, 클릭하면 크게 튀면서 한 바퀴
 * - 마스코트가 쿵 하고 착지하면 가까운 글자부터 차례로 들썩
 */

const TEXT = 'yejun.';
/** 글자마다 살짝 다른 각도/앞뒤 — 손으로 늘어놓은 느낌 */
const JITTER: [ry: number, dz: number][] = [[0.1, 0.05], [-0.06, -0.08], [0.08, 0.1], [-0.1, -0.04], [0.05, 0.06], [0, 0.12]];

interface Letter {
  mesh: THREE.Mesh;
  baseX: number;
  baseRy: number;
  y: number; vy: number;
  spin: number;
  sq: number; sqV: number;
  hovered: boolean;
}

export function createNameplate(scene: THREE.Scene, M: Palette) {
  const font = new FontLoader().parse(fontData as unknown as Parameters<FontLoader['parse']>[0]);
  const size = 1.6;
  const gap = size * 0.07;

  const group = new THREE.Group();
  const letters: Letter[] = [];
  let cursor = 0;
  [...TEXT].forEach((ch, i) => {
    const geo = new TextGeometry(ch, {
      font, size, depth: size * 0.22, curveSegments: 10,
      bevelEnabled: true, bevelThickness: size * 0.045, bevelSize: size * 0.03, bevelSegments: 5,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    // 글자마다 바닥에 닿게 (y 최소 = 0), 가운데 기준으로 회전하게 x/z 중심 맞춤
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    const w = bb.max.x - bb.min.x;
    const mesh = new THREE.Mesh(geo, ch === '.' ? M.blue : M.name);
    mesh.castShadow = mesh.receiveShadow = true;
    const [ry, dz] = JITTER[i];
    const x = cursor + w / 2;
    mesh.position.set(x, 0, dz);
    mesh.rotation.y = ry;
    group.add(mesh);
    letters.push({ mesh, baseX: x, baseRy: ry, y: 0, vy: 0, spin: 0, sq: 0, sqV: 0, hovered: false });
    cursor += w + gap;
  });
  const total = cursor - gap;
  group.rotation.y = -0.06;

  /** PC: 히어로 오른쪽 뒤편 / 모바일: 무대 가운데 뒤, 조금 작게 */
  function setLayout(mobile: boolean) {
    if (mobile) {
      const s = MOBILE_STAGE.name.scale;
      group.scale.setScalar(s);
      group.position.set(MOBILE_STAGE.hero.cam - (total * s) / 2, 0, MOBILE_STAGE.name.z);
    } else {
      group.scale.setScalar(1);
      group.position.set(1.3, 0, -4.4);
    }
  }
  setLayout(false);
  scene.add(group);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const meshes = letters.map((l) => l.mesh);
  let lastPointerCheck = -1;
  const tmp = new THREE.Vector3();

  const hop = (l: Letter, v: number, spin = 0) => {
    if (l.y > 0.05 && v < 3.5) return;
    l.vy = Math.max(l.vy, v);
    l.sqV -= v * 1.2;
    if (spin) l.spin = spin;
  };

  function pick(camera: THREE.Camera, cx: number, cy: number): Letter | null {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? letters[meshes.indexOf(hit.object as THREE.Mesh)] : null;
  }

  let camRef: THREE.Camera | null = null;
  const onDown = (e: PointerEvent) => {
    if (!camRef || e.button !== 0 || (e.target as Element).closest('a, button')) return;
    if (document.body.classList.contains('grabbing')) return; // 마스코트를 잡은 클릭이면 무시
    const l = pick(camRef, e.clientX, e.clientY);
    if (l) hop(l, 6, Math.PI * 2);
  };
  const disposeInput = onWorldTap(onDown);

  return {
    setLayout,

    /** 마스코트가 착지했을 때: 세기 · 위치 → 가까운 글자부터 차례로 들썩 */
    thump(strength: number, atX: number) {
      letters.forEach((l) => {
        l.mesh.getWorldPosition(tmp);
        const dist = Math.abs(tmp.x - atX);
        const v = Math.min(2.4, strength * 0.28) * Math.exp(-dist * 0.25);
        if (v > 0.35) setTimeout(() => hop(l, v), dist * 45);
      });
    },

    update(dt: number, camera: THREE.Camera, grabbingMascot: boolean) {
      camRef = camera;
      // 마우스 올린 글자 통
      if (!isMobileLayout() && pointer.moved !== lastPointerCheck && !grabbingMascot) {
        lastPointerCheck = pointer.moved;
        const over = pick(camera, pointer.x, pointer.y);
        letters.forEach((l) => {
          const now = l === over;
          if (now && !l.hovered) hop(l, 3.2);
          l.hovered = now;
        });
      }
      letters.forEach((l) => {
        l.vy -= 22 * dt;
        l.y += l.vy * dt;
        if (l.y < 0) {
          if (l.vy < -2) l.sqV += l.vy * 1.1; // 착지하면 찌그러짐
          l.y = 0;
          l.vy = 0;
        }
        l.sqV += (-l.sq * 220 - l.sqV * 12) * dt;
        l.sq += l.sqV * dt;
        const s = THREE.MathUtils.clamp(l.sq, -0.3, 0.3);
        if (l.spin > 0) l.spin = Math.max(0, l.spin - dt * 10);
        l.mesh.position.y = l.y;
        l.mesh.scale.set(1 - s * 0.4, 1 + s, 1 - s * 0.4);
        l.mesh.rotation.y = l.baseRy + l.spin;
        l.mesh.rotation.z = THREE.MathUtils.clamp(l.vy * 0.03, -0.15, 0.15);
      });
    },

    dispose() {
      disposeInput();
    },
  };
}
