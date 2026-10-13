import * as THREE from 'three';

/** 클레이 재질: 거칠게 + 살짝 sheen 을 줘서 말랑해 보이게 */
export const clay = (hex: THREE.ColorRepresentation, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({
    color: hex, roughness: 0.78, metalness: 0, sheen: 0.6, sheenRoughness: 0.8, sheenColor: '#ffffff', ...extra,
  });

/** 소품 공용 팔레트. cream/sand/ink 는 낮·밤 테마에 따라 색이 바뀐다. */
export function createPalette() {
  return {
    cream: clay('#f7f1e6'),
    sand: clay('#ddd0bb'),
    ink: clay('#2a2824'),
    blue: clay('#2f5bff'),
    blueSoft: clay('#8fa6ff'),
    /** 이름 글자 (낮엔 먹색, 밤엔 밝은 회색) */
    name: clay('#23252b'),
  };
}
export type Palette = ReturnType<typeof createPalette>;
