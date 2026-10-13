import * as THREE from 'three';
import { clay } from '../materials';
import { R } from './body';

const CAP_BASE = R * 0.7;
const CAP_H = 0.95;
const CAP_BEND = 0.48;
const CAP_DROP = 0.2;

/**
 * 밤에만 쓰는 수면모자.
 * 늘어나는 몸 밖(씬)에 두고 머리 꼭대기 마커 위치만 따라가게 해서, 당겨도 모자 모양은 안 변한다.
 * 끝부분은 몸 가속도로 흔들리는 감쇠 진자.
 */
export function createNightcap(scene: THREE.Scene, body: THREE.Group) {
  const marker = new THREE.Object3D();
  marker.position.y = CAP_BASE;
  body.add(marker);
  const cap = new THREE.Group();
  scene.add(cap);

  // 높이마다 반지름 = max(원뿔, 그 높이의 머리 반지름 + 여유) → 머리가 모자를 뚫지 않음
  const profile = Array.from({ length: 33 }, (_, i) => {
    const h = i / 32, y = h * CAP_H;
    const cone = 0.56 * Math.pow(1 - h, 0.8);
    const head = Math.sqrt(Math.max(0, R * R - (CAP_BASE + y) ** 2));
    return new THREE.Vector2(Math.max(cone, head > 0 ? head + 0.035 : 0) + 0.004, y - CAP_H / 2);
  });
  const geo = new THREE.LatheGeometry(profile, 56);
  const orig = Float32Array.from(geo.attributes.position.array);

  const cone = new THREE.Mesh(geo, clay('#1d2c78', { sheen: 0.4, side: THREE.DoubleSide }));
  cone.position.y = CAP_H / 2;
  cone.castShadow = true;
  const brim = new THREE.Mesh(new THREE.TorusGeometry(profile[0].x - 0.01, 0.085, 16, 56), clay('#f4f5f7'));
  brim.rotation.x = Math.PI / 2;
  brim.position.y = 0.02;
  brim.castShadow = true;
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), clay('#f4f5f7'));
  pom.castShadow = true;
  cap.add(cone, brim, pom);

  /** sw = 끝부분 좌우 흔들림 (로컬 단위) */
  function bend(sw: number) {
    const pos = geo.attributes.position;
    const a = pos.array as Float32Array;
    for (let i = 0; i < pos.count; i++) {
      const x = orig[i * 3], y = orig[i * 3 + 1], z = orig[i * 3 + 2];
      const h = (y + CAP_H / 2) / CAP_H, b = h * h; // 위쪽만 흐물흐물
      a[i * 3] = x + b * (CAP_BEND + sw);
      a[i * 3 + 1] = y - b * CAP_DROP - Math.abs(sw) * b * 0.25;
      a[i * 3 + 2] = z;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    pom.position.set(CAP_BEND + sw, CAP_H - CAP_DROP - Math.abs(sw) * 0.25 + 0.02, 0);
  }
  bend(0);
  cap.scale.setScalar(0.001);
  cap.visible = false;

  let shown = 0;
  const swing = { x: 0, v: 0 };
  const tmp = new THREE.Vector3();
  const q = new THREE.Quaternion();

  return {
    /** @returns 나뭇잎을 보여줄지 (모자 쓰면 숨김) */
    update(o: {
      dt: number; night: boolean; root: THREE.Group; body: THREE.Group;
      sc: number; side: number; ang: number; ax: number; roll: number;
    }): boolean {
      const target = o.night ? 1 : 0;
      shown += (target - shown) * (1 - Math.exp(-o.dt * 7));
      cap.visible = shown > 0.01;
      const pop = target ? 1 + Math.sin(Math.min(1, shown) * Math.PI) * 0.25 : 1;

      // 머리에 올라타기: 위치는 (늘어난) 마커에서, 회전은 구르기/뒤집기만 — 늘어남은 무시
      o.root.updateMatrixWorld(true);
      marker.getWorldPosition(tmp);
      cap.position.copy(tmp);
      q.copy(o.root.quaternion).multiply(o.body.quaternion);
      cap.quaternion.copy(q);
      // 찌그러지거나 옆으로 늘어난 머리가 모자를 뚫지 않을 만큼만 넓힘
      const headW = Math.max(1, o.root.scale.x * Math.sqrt((o.sc * Math.sin(o.ang)) ** 2 + (o.side * Math.cos(o.ang)) ** 2));
      const cs = Math.max(0.001, shown * pop);
      cap.scale.set(cs * headW, cs, cs * headW);

      if (cap.visible) {
        const accLocal = o.ax * Math.cos(o.roll);
        swing.v += (-swing.x * 55 - swing.v * 5.5 - accLocal * 0.035) * o.dt;
        swing.x = THREE.MathUtils.clamp(swing.x + swing.v * o.dt, -0.14, 0.14);
        bend(swing.x);
      }
      return shown < 0.5;
    },
  };
}
