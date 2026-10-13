import { isMobileLayout } from './layout';

/** 모바일은 스크롤이 끝난 뒤 탭으로 판정하고, PC는 기존처럼 누르는 순간 반응한다. */
export function onWorldTap(activate: (event: PointerEvent) => void) {
  let touch: { id: number; x: number; y: number; scroll: number } | null = null;
  const cancel = () => { touch = null; };
  const down = (event: PointerEvent) => {
    cancel();
    if (event.button !== 0 || (event.target as Element).closest('a, button') || document.body.classList.contains('grabbing')) return;
    if (isMobileLayout() && event.pointerType === 'touch') {
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: scrollY };
    } else activate(event);
  };
  const move = (event: PointerEvent) => {
    if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 10) cancel();
  };
  const up = (event: PointerEvent) => {
    const tap = touch;
    cancel();
    if (!tap || tap.id !== event.pointerId || Math.abs(scrollY - tap.scroll) > 2) return;
    if (Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= 10) activate(event);
  };
  addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', cancel);
  addEventListener('blur', cancel);

  return () => {
    removeEventListener('pointerdown', down);
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', cancel);
    removeEventListener('blur', cancel);
  };
}
