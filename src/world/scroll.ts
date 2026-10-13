import * as THREE from 'three';
import { MOBILE_STAGE } from './layout';

/** 섹션마다 카메라 x 위치와, 카메라 기준 마스코트 위치 */
interface Key { cam: number; off: number }

export function createScrollChoreography(sectionIds: string[]) {
  const keys: Key[] = [
    { cam: 0, off: 3.4 },   // hero: 마스코트 오른쪽
    { cam: 12, off: -4.6 }, // projects: 글이 오른쪽이라 마스코트는 왼쪽
    { cam: 22, off: 2.4 },  // contact
  ];
  const smooth = (t: number) => t * t * (3 - 2 * t);

  return {
    startX: keys[0].off,

    /**
     * 모바일: 무대는 히어로/연락처 두 곳뿐이고 페이지와 같이 세로로 스크롤된다.
     * shift = 무대를 위로 밀어 올릴 픽셀 (음수면 아직 화면 아래에 있음)
     */
    mobileStage() {
      const y = scrollY;
      const lastTop = document.getElementById(sectionIds[sectionIds.length - 1])?.offsetTop ?? 0;
      const limit = innerHeight * 1.5;
      const clampShift = (v: number) => Math.max(-limit, Math.min(limit, v));
      // 두 무대 다 화면 밖인 중간 지점에서 무대를 바꿔치기
      if (y < lastTop / 2) return { stage: 'hero' as const, cam: MOBILE_STAGE.hero.cam, x: MOBILE_STAGE.hero.cam + MOBILE_STAGE.hero.mascot, shift: clampShift(y) };
      return { stage: 'contact' as const, cam: MOBILE_STAGE.contact.cam, x: MOBILE_STAGE.contact.cam + MOBILE_STAGE.contact.mascot, shift: clampShift(y - lastTop) };
    },

    /** PC: 현재 스크롤 위치의 목표 { 카메라 x, 마스코트 x } */
    target() {
      const y = scrollY;
      const tops = sectionIds.map((id) => document.getElementById(id)?.offsetTop ?? 0);
      let i = 0;
      while (i < tops.length - 1 && y > tops[i + 1]) i++;
      if (i === tops.length - 1) return { cam: keys[i].cam, x: keys[i].cam + keys[i].off };
      const t = smooth(Math.min(1, Math.max(0, (y - tops[i]) / (tops[i + 1] - tops[i]))));
      const cam = THREE.MathUtils.lerp(keys[i].cam, keys[i + 1].cam, t);
      const off = THREE.MathUtils.lerp(keys[i].off, keys[i + 1].off, t);
      return { cam, x: cam + off };
    },
  };
}
