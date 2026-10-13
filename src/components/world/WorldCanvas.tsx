import { useEffect, useRef } from 'react';
import { createWorld } from '@/world/createWorld';

/** 배경 3D 월드 + 마스코트 말풍선(헥헥, zzz). 말풍선 위치·투명도는 월드 루프가 직접 갱신한다. */
export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pantRef = useRef<HTMLDivElement>(null);
  const zzzRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const world = createWorld({
      canvas: canvasRef.current!,
      sectionIds: ['top', 'projects', 'contact'],
      pant: pantRef.current!,
      zzz: zzzRef.current!,
      stageBounds: (stage) => {
        const section = document.querySelector(stage === 'hero' ? '.hero' : '.contact');
        const bounds = section?.querySelector('.mobile-world-stage')?.getBoundingClientRect();
        if (bounds?.height) return { top: bounds.top, height: bounds.height };
        const text = section?.querySelector(stage === 'hero' ? '.hero-actions, .sub' : '.links');
        return { top: (text?.getBoundingClientRect().bottom ?? 0) + 20, height: Math.min(350, Math.max(250, innerWidth * 0.74)) };
      },
    });
    return () => world.dispose();
  }, []);

  return (
    <>
      <canvas id="world" ref={canvasRef} />
      <div className="pant" ref={pantRef} />
      <div className="zzz" ref={zzzRef}>
        <span>z</span>
        <span>z</span>
        <span>Z</span>
      </div>
    </>
  );
}
