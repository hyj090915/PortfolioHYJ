import * as THREE from 'three';
import { clay } from '../materials';

/** 마스코트 반지름 */
export const R = 0.72;

/**
 * 굴러다니는 슬라임 공 마스코트의 몸.
 *
 * 계층 (바깥 → 안):
 *   root          땅 기준 피벗 (찌그러짐, 기울기)
 *   └ center      공 중심 (숨쉬기)
 *     └ stretchPivot  당기는 방향으로 회전
 *       └ stretchScale  그 축으로 늘림
 *         └ unrot       회전 되돌리기
 *           └ body      구르는 몸 (얼굴 포함)
 */
export function buildMascotBody(scene: THREE.Scene) {
  const root = new THREE.Group();
  const center = new THREE.Group();
  const stretchPivot = new THREE.Group();
  const stretchScale = new THREE.Group();
  const unrot = new THREE.Group();
  const body = new THREE.Group();
  center.position.y = R;
  root.add(center);
  center.add(stretchPivot);
  stretchPivot.add(stretchScale);
  stretchScale.add(unrot);
  unrot.add(body);
  scene.add(root);

  const bodyMat = clay('#2f5bff', { clearcoat: 0.35, clearcoatRoughness: 0.5 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), bodyMat);
  ball.castShadow = true;
  body.add(ball);

  // 구르는 게 보이도록 몸에 점무늬
  const spotMat = clay('#5a7dff');
  ([[0.3, 0.9, -0.4], [-0.8, 0.4, -0.5], [0.6, -0.5, -0.6], [-0.3, -0.8, 0.4], [0.9, 0.1, -0.3], [-0.6, 0.2, -0.8], [0.2, -0.3, -0.95]] as const).forEach((v) => {
    const d = new THREE.Vector3(...v).normalize();
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 20), spotMat);
    s.position.copy(d.multiplyScalar(R * 0.95));
    s.scale.set(1, 1, 0.3);
    s.lookAt(0, 0, 0);
    body.add(s);
  });

  const face = new THREE.Group();
  body.add(face);

  // 눈: 표면에 붙은 납작한 스티커 (짝짝이)
  const white = new THREE.MeshStandardMaterial({ color: '#fbf8f2', roughness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: '#121110', roughness: 0.35 });
  const eyes: { lid: THREE.Group; pupil: THREE.Mesh; size: number }[] = [];
  [-1, 1].forEach((side) => {
    const size = side < 0 ? 0.17 : 0.2;
    const a = side * 0.33;
    const eg = new THREE.Group();
    eg.position.set(Math.sin(a), 0.22, Math.cos(a)).normalize().multiplyScalar(R * 0.992);
    eg.lookAt(eg.position.clone().multiplyScalar(2));
    const eye = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 32), white);
    eye.scale.z = 0.14;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.52, 24, 24), black);
    pupil.scale.z = 0.1;
    pupil.position.z = size * 0.1;
    const glint = new THREE.Mesh(new THREE.CircleGeometry(size * 0.13, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    glint.position.set(size * 0.16, size * 0.18, size * 0.6);
    pupil.add(glint);
    const lid = new THREE.Group();
    lid.add(eye, pupil);
    eg.add(lid);
    face.add(eg);
    eyes.push({ lid, pupil, size });
  });

  // 입: 웃는 입 / 벌린 입 (헥헥, 잡혔을 때, 잘 때)
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 12, 24, Math.PI), black);
  smile.rotation.z = Math.PI;
  smile.position.set(0.03, -0.12, R * 0.985);
  smile.scale.z = 0.4;
  face.add(smile);
  const open = new THREE.Group();
  open.position.set(0.03, -0.17, R * 0.955);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), new THREE.MeshStandardMaterial({ color: '#3a0f14', roughness: 0.6 }));
  hole.scale.set(1, 1, 0.3);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 20), new THREE.MeshStandardMaterial({ color: '#ff7a86', roughness: 0.5 }));
  tongue.scale.set(1.1, 0.7, 0.4);
  tongue.position.set(0, -0.045, 0.02);
  open.add(hole, tongue);
  open.visible = false;
  face.add(open);

  // 볼터치
  const blushMat = new THREE.MeshBasicMaterial({ color: '#ff8f8f', transparent: true, opacity: 0.5 });
  const blushes: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), blushMat);
    const a = side * 0.6;
    b.position.set(Math.sin(a) * R * 1.003, -0.05, Math.cos(a) * R * 1.003);
    b.lookAt(b.position.clone().multiplyScalar(2));
    b.scale.x = 1.5;
    face.add(b);
    blushes.push(b);
  });

  // 머리 위 나뭇잎 (줄기 없음) — 잎 모양 그대로, 머리 곡면 따라 살짝 휨
  const sprout = new THREE.Group();
  sprout.position.y = R * 0.96;
  body.add(sprout);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.08, 0.13, 0.26, 0.15, 0.4, 0);
  leafShape.bezierCurveTo(0.26, -0.13, 0.08, -0.12, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012, bevelSegments: 4, curveSegments: 24 });
  {
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, pos.getZ(i) - y * y * 1.6 - (x - 0.2) * (x - 0.2) * 0.5);
    }
    leafGeo.computeVertexNormals();
  }
  const leaf = new THREE.Mesh(leafGeo, clay('#6fbf7e', { side: THREE.DoubleSide }));
  leaf.rotation.x = -Math.PI / 2;
  leaf.position.set(-0.08, 0.02, 0.05);
  const leafTilt = new THREE.Group();
  leafTilt.rotation.set(0.45, -0.35, 0.3);
  leafTilt.position.set(0, 0.05, 0.02);
  leafTilt.scale.setScalar(1.6);
  leafTilt.add(leaf);
  const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.34, 6), clay('#4f9a5e'));
  rib.rotation.z = Math.PI / 2;
  rib.position.set(0.19 - 0.08, 0.035, 0.05);
  leafTilt.add(rib);
  sprout.add(leafTilt);
  sprout.traverse((o) => (o.castShadow = true));

  return { root, center, stretchPivot, stretchScale, unrot, body, bodyMat, face, eyes, smile, open, tongue, blushMat, blushes, sprout };
}
export type MascotBody = ReturnType<typeof buildMascotBody>;
