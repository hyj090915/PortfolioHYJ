import { useEffect, useRef } from 'react';
import { hasFinePointer } from '@/lib/env';
import { pointer } from '@/lib/pointer';
import { theme } from '@/lib/theme';

const TRAIL_LIFE = 170; // ms — 꼬리가 남는 시간

/**
 * 커서: 낮엔 해, 밤엔 별.
 * 위치는 이벤트 좌표를 그대로 써서 딜레이 0, 움직임은 모양(빛살 회전 · 별 기울기)에만.
 * 밤에는 지나간 길을 따라 가늘어지는 꼬리가 붙는다.
 */
export default function Cursor() {
  const curRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<SVGGElement>(null);
  const starRef = useRef<SVGSVGElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!hasFinePointer) return;
    const cur = curRef.current!, rays = raysRef.current!, star = starRef.current!;
    const tc = trailRef.current!, tx = tc.getContext('2d')!;

    const sizeTrail = () => {
      const d = Math.min(devicePixelRatio, 2);
      tc.width = innerWidth * d;
      tc.height = innerHeight * d;
      tx.setTransform(d, 0, 0, d, 0, 0);
    };
    sizeTrail();

    cur.style.opacity = '0';
    const onMove = (e: PointerEvent) => {
      cur.style.opacity = '1';
      cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      cur.classList.toggle('link', !!(e.target as Element).closest('a, button'));
    };
    const onDown = () => cur.classList.add('press');
    const onUp = () => cur.classList.remove('press');
    const onLeave = () => (cur.style.opacity = '0');
    const onEnter = () => (cur.style.opacity = '1');
    addEventListener('resize', sizeTrail);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    const bits: { x: number; y: number; vx: number; vy: number; life: number; r: number }[] = [];
    const hist: { x: number; y: number; t: number }[] = [];
    let px = pointer.x, py = pointer.y, rayRot = 0, last = performance.now(), raf = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
      last = now;
      const vx = pointer.x - px, vy = pointer.y - py;
      px = pointer.x;
      py = pointer.y;
      const sp = Math.hypot(vx, vy);
      const night = theme.isNight();

      // 낮: 빨리 움직일수록 빛살이 빨리 돌고, 멈추면 천천히
      rayRot += (0.25 + Math.min(sp, 40) * 0.35) * dt * 60 * 0.5;
      rays.setAttribute('transform', `rotate(${rayRot % 360} 15 15)`);
      // 밤: 별이 은은하게 반짝이고 움직이는 쪽으로 기울어짐
      const tw = 1 + Math.sin(now * 0.004) * 0.06 + Math.sin(now * 0.0107) * 0.04;
      star.style.transform = `rotate(${Math.min(25, Math.max(-25, vx * 1.2))}deg) scale(${tw})`;

      // 밤 꼬리: 별에서 시작해서 실제 지나간 길을 따라 가늘어짐
      tx.clearRect(0, 0, innerWidth, innerHeight);
      if (night) {
        const lastPt = hist[hist.length - 1];
        if (!lastPt || Math.hypot(pointer.x - lastPt.x, pointer.y - lastPt.y) > 0.5) hist.push({ x: pointer.x, y: pointer.y, t: now });
      }
      while (hist.length && now - hist[0].t > TRAIL_LIFE) hist.shift();
      if (!night) hist.length = 0;
      if (hist.length > 2) {
        tx.lineCap = 'round';
        tx.lineJoin = 'round';
        tx.shadowColor = 'rgba(160,180,255,.9)';
        tx.shadowBlur = 8;
        for (let i = 1; i < hist.length; i++) {
          const a = hist[i - 1], c = hist[i];
          const f = 1 - (now - c.t) / TRAIL_LIFE; // 머리 1 → 꼬리 0
          if (f <= 0) continue;
          tx.strokeStyle = `rgba(226,233,255,${(f * f * 0.85).toFixed(3)})`;
          tx.lineWidth = 0.6 + f * f * 3.2;
          tx.beginPath();
          tx.moveTo(a.x, a.y);
          tx.lineTo(c.x, c.y);
          tx.stroke();
        }
        tx.shadowBlur = 0;
        // 꼬리에서 떨어져 나오는 작은 불티
        if (sp > 3 && Math.random() < 0.55) {
          const h = hist[Math.floor(Math.random() * hist.length * 0.7)];
          bits.push({ x: h.x, y: h.y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1, r: 0.5 + Math.random() * 0.9 });
        }
      }
      for (let i = bits.length - 1; i >= 0; i--) {
        const q = bits[i];
        q.life -= dt * 3.2;
        if (q.life <= 0) {
          bits.splice(i, 1);
          continue;
        }
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        tx.globalAlpha = q.life * 0.8;
        tx.fillStyle = '#e2e9ff';
        tx.beginPath();
        tx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        tx.fill();
      }
      tx.globalAlpha = 1;
      if (bits.length > 80) bits.splice(0, bits.length - 80);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', sizeTrail);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <>
      <canvas id="trail" ref={trailRef} />
      <div className="cursor" ref={curRef}>
        <svg className="c c-sun" viewBox="0 0 30 30">
          <circle className="core" cx="15" cy="15" r="5" />
          <g className="rays" ref={raysRef}>
            <line x1="15" y1="4" x2="15" y2="6.5" /><line x1="15" y1="23.5" x2="15" y2="26" />
            <line x1="4" y1="15" x2="6.5" y2="15" /><line x1="23.5" y1="15" x2="26" y2="15" />
            <line x1="7.2" y1="7.2" x2="9" y2="9" /><line x1="21" y1="21" x2="22.8" y2="22.8" />
            <line x1="7.2" y1="22.8" x2="9" y2="21" /><line x1="21" y1="9" x2="22.8" y2="7.2" />
          </g>
        </svg>
        <svg className="c c-star" viewBox="0 0 26 26" ref={starRef}>
          <path d="M13 2 C13.8 9.5 16.5 12.2 24 13 C16.5 13.8 13.8 16.5 13 24 C12.2 16.5 9.5 13.8 2 13 C9.5 12.2 12.2 9.5 13 2Z" />
        </svg>
      </div>
    </>
  );
}
