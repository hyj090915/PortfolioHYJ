/**
 * 전역 포인터 상태. 3D 월드 · 커서 · 미리보기 카드가 같이 읽는다.
 * React 상태로 두면 매 프레임 리렌더가 생기니까 가변 객체로 둔다.
 */
export const pointer = {
  x: innerWidth / 2,
  y: innerHeight / 2,
  /** 마지막으로 움직인 시각 (performance.now) */
  moved: 0,
};

addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.moved = performance.now();
});

// 터치는 누르기 전에 move 가 없어서, 누른 순간 좌표를 맞춰둔다 (마우스는 이미 같은 값)
addEventListener('pointerdown', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
