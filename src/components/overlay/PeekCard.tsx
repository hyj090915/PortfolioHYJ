import { useEffect, useRef } from 'react';
import { usePeek, peek } from '@/lib/peek';
import { pointer } from '@/lib/pointer';

/** 프로젝트 줄에 마우스 올리면 목록 왼쪽에서 커서 높이를 따라다니는 요약 카드. 커서 속도만큼 기울어짐 */
export default function PeekCard() {
  const { data, on } = usePeek();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0, x = 0, y = 0, lastX = 0, tilt = 0;
    const loop = () => {
      const el = ref.current, anchor = peek.getAnchor();
      if (el && anchor) {
        const inner = anchor.getBoundingClientRect();
        x += (inner.left - 320 - x) * 0.14;
        y += (pointer.y - 60 - y) * 0.14;
        tilt += ((pointer.x - lastX) * 0.6 - tilt) * 0.15;
        lastX = pointer.x;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${Math.min(12, Math.max(-12, tilt))}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={on ? 'peek on' : 'peek'} ref={ref}>
      <div className="k">{data?.k}</div>
      <div className="v">{data?.v}</div>
      <div className="t">{data?.t}</div>
    </div>
  );
}
