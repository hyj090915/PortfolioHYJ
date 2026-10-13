import * as THREE from 'three';
import { R } from './body';

/** 지쳤을 때 튀는 땀방울 (월드 좌표) */
export function createSweat(scene: THREE.Scene) {
  const mat = new THREE.MeshStandardMaterial({ color: '#cfe0ff', roughness: 0.2, transparent: true });
  const drops = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat.clone());
    m.scale.set(0.8, 1.3, 0.8);
    m.visible = false;
    scene.add(m);
    return { m, v: new THREE.Vector3(), life: 0 };
  });
  let nextDrop = 0;

  return {
    update(dt: number, now: number, panting: boolean, x: number, y: number) {
      if (panting && now > nextDrop) {
        nextDrop = now + 260 + Math.random() * 300;
        const d = drops.find((d) => d.life <= 0);
        if (d) {
          const sideSign = Math.random() < 0.5 ? -1 : 1;
          d.m.position.set(x + sideSign * R * 0.7, y + R * 1.7, 0.9);
          d.v.set(sideSign * (0.8 + Math.random()), 2 + Math.random(), 0.3);
          d.life = 1;
          d.m.visible = true;
        }
      }
      drops.forEach((d) => {
        if (d.life <= 0) return;
        d.life -= dt * 1.4;
        d.v.y -= 9 * dt;
        d.m.position.addScaledVector(d.v, dt);
        d.m.material.opacity = Math.max(0, d.life);
        if (d.life <= 0 || d.m.position.y < 0) {
          d.life = 0;
          d.m.visible = false;
        }
      });
    },
  };
}
