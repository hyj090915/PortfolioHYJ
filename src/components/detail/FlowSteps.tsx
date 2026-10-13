import type { Flow } from '@/types/project';

/** 처리 흐름을 순서대로 보여주는 단계 카드. */
export default function FlowSteps({ flow }: { flow: Flow }) {
  return (
    <div className="flow">
      <div className="flow-head">
        <h3>{flow.title}</h3>
      </div>
      <div className="steps">
        {flow.steps.map(([title, desc, branch], k) => (
          <div key={k} className={branch ? 'step branch' : 'step'}>
            <div className="n">{branch ? '분기' : String(k + 1).padStart(2, '0')}</div>
            <h5>{title}</h5>
            <p>{desc}</p>
          </div>
        ))}
      </div>
      <div className="flow-foot">{flow.foot}</div>
    </div>
  );
}
