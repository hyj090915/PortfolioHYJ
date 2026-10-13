import { useEffect, useMemo, useRef, useState } from 'react';
import type { Architecture } from '@/types/project';

const NODE_W = 160;
const NODE_H = 64;

/**
 * 아키텍처 다이어그램 (SVG).
 * - 노드에 마우스 올리면 연결된 경로만 남고 나머지는 흐려짐
 * - 주 경로(main) 위로 파란 점이 요청 방향으로 흐름
 */
export default function ArchDiagram({ arch }: { arch: Architecture }) {
  const nodes = useMemo(() => arch.nodes.map((n) => ({ w: NODE_W, h: NODE_H, ...n })), [arch]);
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const edges = useMemo(
    () =>
      arch.edges.map(([from, to, label, main], i) => {
        const A = byId[from], B = byId[to];
        const x0 = A.x + A.w, y0 = A.y + A.h / 2, x3 = B.x, y3 = B.y + B.h / 2, mx = (x0 + x3) / 2;
        return { i, from, to, label, main, d: `M${x0},${y0} C${mx},${y0} ${mx},${y3} ${x3},${y3}`, lx: mx, ly: (y0 + y3) / 2 - 10 };
      }),
    [arch, byId],
  );
  const mainEdges = edges.filter((e) => e.main);

  // 호버 강조
  const [hover, setHover] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = nodes.find((n) => n.id === selectedId) ?? nodes.find((n) => n.core) ?? nodes[0];
  const selectedEdges = edges.filter((e) => e.from === selected.id || e.to === selected.id);
  const hot = useMemo(() => {
    const nodeIds = new Set<string>(), edgeIdx = new Set<number>();
    if (hover) {
      nodeIds.add(hover);
      edges.forEach((e) => {
        if (e.from === hover || e.to === hover) {
          edgeIdx.add(e.i);
          nodeIds.add(e.from === hover ? e.to : e.from);
        }
      });
    }
    return { nodeIds, edgeIdx };
  }, [hover, edges]);

  // 요청 패킷 애니메이션
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const pktRefs = useRef<(SVGCircleElement | null)[]>([]);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 800px)');
    let raf = 0;
    const syncAnimation = () => {
      cancelAnimationFrame(raf);
      if (mobile.matches) return;

      const runs = mainEdges.flatMap((e, i) => {
        const path = pathRefs.current[e.i]!;
        const len = path.getTotalLength();
        return [0, 1].map((k) => ({ path, len, c: pktRefs.current[i * 2 + k]!, ph: k * 0.5 + i * 0.17, sp: 0.35 + (i % 3) * 0.05 }));
      });
      const tick = (now: number) => {
        runs.forEach((r) => {
          const u = ((now / 1000) * r.sp + r.ph) % 1;
          const p = r.path.getPointAtLength(u * r.len);
          r.c.setAttribute('cx', String(p.x));
          r.c.setAttribute('cy', String(p.y));
          r.c.setAttribute('opacity', String(Math.min(1, Math.min(u, 1 - u) * 8)));
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    syncAnimation();
    mobile.addEventListener('change', syncAnimation);
    return () => {
      cancelAnimationFrame(raf);
      mobile.removeEventListener('change', syncAnimation);
    };
  }, [arch]);

  const cls = (base: string, isHot: boolean) => (isHot ? `${base} hot` : base);

  return (
    <div className={hover ? 'arch focus' : 'arch'} data-arch>
      <div className="arch-mobile">
        <p className="arch-mobile-help">노드를 탭해 연결을 살펴보세요 <span>{nodes.length} NODES</span></p>
        <div className="arch-node-picker" aria-label="아키텍처 노드 선택">
          {nodes.map((n) => (
            <button key={n.id} type="button" aria-pressed={selected.id === n.id} onClick={() => setSelectedId(n.id)}>
              <i aria-hidden="true" />{n.label}
            </button>
          ))}
        </div>
        <div className="arch-connections" aria-live="polite">
          <div className="arch-selected"><strong>{selected.label}</strong><span>{selected.sub}</span></div>
          <ul>
            {selectedEdges.map((e) => (
              <li key={e.i} className={e.main ? 'main' : undefined}>
                <span>{byId[e.from].label}</span><b aria-hidden="true">→</b><span>{byId[e.to].label}</span>
                {e.label && <small>{e.label}</small>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <svg viewBox={`0 0 ${arch.w} ${arch.h}`} role="img" aria-label="아키텍처">
        {edges.map((e) => (
          <path
            key={`e${e.i}`}
            ref={(el) => (pathRefs.current[e.i] = el)}
            className={cls(e.main ? 'edge main' : 'edge', hot.edgeIdx.has(e.i))}
            data-a={e.from}
            data-b={e.to}
            d={e.d}
          />
        ))}
        {edges.map((e) =>
          e.label ? (
            <text key={`l${e.i}`} className={cls('elabel', hot.edgeIdx.has(e.i))} x={e.lx} y={e.ly} textAnchor="middle">
              {e.label}
            </text>
          ) : null,
        )}
        <g className="pkts">
          {mainEdges.flatMap((_, i) =>
            [0, 1].map((k) => <circle key={`${i}-${k}`} ref={(el) => (pktRefs.current[i * 2 + k] = el)} r={4} className="pkt" />),
          )}
        </g>
        {nodes.map((n) => (
          <g
            key={n.id}
            className={cls(n.core ? 'node core' : 'node', hot.nodeIds.has(n.id))}
            data-id={n.id}
            onPointerEnter={() => setHover(n.id)}
            onPointerLeave={() => setHover(null)}
          >
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} />
            <text x={n.x + n.w / 2} y={n.y + 28} textAnchor="middle">{n.label}</text>
            <text className="sub" x={n.x + n.w / 2} y={n.y + 47} textAnchor="middle">{n.sub ?? ''}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
