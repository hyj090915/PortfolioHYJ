import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Palette } from './materials';

const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material) =>
  new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat);

/**
 * x 축을 따라 늘어선 소품들. 스크롤하면 카메라가 옆으로 이동하면서 차례로 보인다.
 * hero(x≈0~7) → projects(x≈9~16) → contact(x≈22)
 */
export function buildDiorama(scene: THREE.Scene, M: Palette) {
  const add = <T extends THREE.Mesh>(mesh: T, x: number, y: number, z: number, ry = 0): T => {
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };

  // 히어로 오른쪽은 이름 글자(nameplate.ts) 자리라 비워두고, 쌓인 블록 · 서버는 조금 더 오른쪽
  // (히어로 → 프로젝트로 넘어가는 구간에서 보임)
  const blocks = [
    add(rbox(1.3, 1.3, 1.3, 0.22, M.cream), 9.6, 0.65, -2.6, 0.4),
    add(rbox(1.0, 1.0, 1.0, 0.2, M.ink), 9.75, 1.8, -2.65, -0.2),
    add(rbox(0.7, 0.7, 0.7, 0.16, M.blue), 9.65, 2.65, -2.6, 0.5),
  ];
  const desktopBlocks = blocks.map((block) => block.position.clone());

  // 서버 타워는 server.ts (클릭하면 과열되는 이스터에그가 있어서 따로 뺌)
  const donut = add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.24, 32, 64), M.sand), 6.4, 0.24, -0.4);
  donut.rotation.x = -Math.PI / 2;
  const desktopDonut = donut.position.clone();
  const cylinder = add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 48), M.cream), 8.9, 0.45, -5.2);

  // 마스코트가 굴러가는 조약돌 길
  for (let x = -2; x < 30; x += 0.9) {
    const s = 0.07 + Math.random() * 0.05;
    const p = add(new THREE.Mesh(new THREE.SphereGeometry(s, 12, 12), M.sand), x + Math.random() * 0.3, s * 0.4, 1.6 + Math.sin(x * 0.5) * 0.25);
    p.scale.y = 0.55;
  }

  // projects (화면 오른쪽 절반은 글자라 소품은 왼쪽 / 뒤쪽에만)
  ([[7.2, 0], [7.9, 1], [8.6, 2]] as const).forEach(([x, i]) =>
    add(rbox(0.7, 0.5 + i * 0.5, 0.9, 0.12, i === 2 ? M.ink : M.sand), x, (0.5 + i * 0.5) / 2, -1.4),
  );

  // contact — 우체통 블록 (모바일에선 이 자리에 서버 타워가 서서 숨김)
  const mailbox = add(rbox(1.2, 1.5, 0.9, 0.2, M.blue), 25.8, 0.75, -2.4, -0.4);
  const slotC = rbox(0.7, 0.1, 0.05, 0.04, M.ink);
  slotC.position.set(25.9, 1.1, -1.97);
  slotC.rotation.y = -0.4;
  scene.add(slotC);
  const ball = add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), M.cream), 27.4, 0.4, -0.6);
  const phone = add(rbox(0.3, 2.6, 1.5, 0.12, M.cream), 28.4, 1.3, -3.6, -0.5);
  const screen = rbox(0.05, 2.1, 1.1, 0.08, M.blue);
  screen.position.set(28.25, 1.3, -3.5);
  screen.rotation.y = -0.5;
  scene.add(screen);

  return {
    setLayout(mobile: boolean) {
      mailbox.visible = slotC.visible = ball.visible = phone.visible = screen.visible = cylinder.visible = !mobile;
      // PC의 작은 장난감들을 모바일 첫 무대에도 모아, 좁은 화면에 디오라마의 성격을 살린다.
      const mobileBlocks = [[-1.85, 0.338, 0.05], [-1.77, 0.936, 0], [-1.82, 1.378, 0.05]] as const;
      blocks.forEach((block, i) => {
        block.scale.setScalar(mobile ? 0.52 : 1);
        if (mobile) {
          const [x, y, z] = mobileBlocks[i];
          block.position.set(x, y, z);
        }
        else block.position.copy(desktopBlocks[i]);
      });
      donut.scale.setScalar(mobile ? 0.65 : 1);
      if (mobile) donut.position.set(-1.35, 0.156, 0.6);
      else donut.position.copy(desktopDonut);
    },
  };
}
