import { Fragment } from 'react';
import type { Trouble, TroubleRow } from '@/types/project';

function Row({ row: [label, value] }: { row: TroubleRow }) {
  if (value === null) return null;
  const res = label === '결과' ? 'res' : undefined;
  return (
    <Fragment>
      <dt className={res}>{label}</dt>
      <dd className={res}>
        {Array.isArray(value) ? <ul>{value.map((x) => <li key={x}>{x}</li>)}</ul> : value}
      </dd>
    </Fragment>
  );
}

export default function TroubleList({ items }: { items: Trouble[] }) {
  return (
    <div className="ts">
      {items.map((t) => (
        <article key={t.title}>
          <div>
            <div className="big">{t.big}</div>
            <div className="big-cap">{t.cap}</div>
          </div>
          <div>
            <h3>{t.title}</h3>
            <dl>{t.rows.map((r) => <Row key={r[0]} row={r} />)}</dl>
          </div>
        </article>
      ))}
    </div>
  );
}
