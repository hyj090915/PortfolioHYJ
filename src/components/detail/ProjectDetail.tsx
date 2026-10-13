import { useRef } from 'react';
import type { Project } from '@/types/project';
import { PROJECTS } from '@/data/projects';
import ArchDiagram from './ArchDiagram';
import FlowSteps from './FlowSteps';
import RoleCards from './RoleCards';
import TroubleList from './TroubleList';
import TechStack from '@/components/shared/TechStack';
import ScreenGallery from './ScreenGallery';
import { prefersReducedMotion } from '@/lib/env';

interface Props {
  project: Project;
  onClose: () => void;
  onGo: (slug: string) => void;
}

/** 상세 페이지 본문: 헤더 · 개요 · 구조 · 트러블슈팅 · 회고 · 이전/다음 */
export default function ProjectDetail({ project: p, onClose, onGo }: Props) {
  const screensRef = useRef<HTMLElement>(null);
  const i = PROJECTS.indexOf(p);
  const prev = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const hasScreens = Boolean(p.screens?.length);
  const sectionNumber = (number: number) => String(number + (hasScreens ? 1 : 0)).padStart(2, '0');

  return (
    <>
      <div className="d-top">
        <button className="d-back" data-close onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>Projects
        </button>
        <span className="d-crumb">{p.no} / {String(PROJECTS.length).padStart(2, '0')}</span>
      </div>

      <div className="wrap" key={p.slug}>
        <div className="d-no fade">PROJECT {p.no}</div>
        <h1 className="d-title">{p.title}</h1>
        <p className="d-lead fade">{p.lead}</p>
        <dl className="d-meta fade">
          {p.meta.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        {(p.links.length > 0 || hasScreens) && <div className="d-links fade">
          {p.links.map(([label, href, primary]) => (
            <a key={href} className={primary ? 'btn primary' : 'btn ghost'} href={href} target="_blank" rel="noreferrer">{label} ↗</a>
          ))}
          {hasScreens && <button type="button" className="btn ghost" onClick={() => {
            screensRef.current?.focus({ preventScroll: true });
            screensRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
          }}>화면 둘러보기 ↓</button>}
        </div>}
        <TechStack items={p.stack} className="d-stack fade" />

        <section className="d-sec fade">
          <header><b>01</b><h2>개요</h2></header>
          <div className={p.image ? 'd-over' : 'd-over text-only'}>
            <div className="d-overview">
              {p.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {p.image && (
              <figure className="d-preview">
                <a href={p.image.src} target="_blank" rel="noreferrer" aria-label={`${p.title} 화면 크게 보기 (새 탭)`}>
                  <img src={p.image.src} alt={p.image.alt} loading="lazy" decoding="async" />
                </a>
                <figcaption><span>{p.image.caption}</span><span aria-hidden="true">↗</span></figcaption>
              </figure>
            )}
          </div>
          <div className="d-work">
            {p.work.map(([group, items]) => (
              <div key={group}>
                <h4>{group}</h4>
                <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        {hasScreens && <section className="d-sec fade" id="project-screens" ref={screensRef} tabIndex={-1} aria-label="주요 화면">
          <header><b>02</b><h2>주요 화면</h2><small>{p.screens!.length}장</small></header>
          <ScreenGallery key={p.slug} screens={p.screens!} projectTitle={p.title} />
        </section>}

        <section className="d-sec fade">
          <header><b>{sectionNumber(2)}</b><h2>구조</h2><small>Architecture</small></header>
          <ArchDiagram arch={p.arch} />
          <div className="arch-note">{p.arch.note}</div>
          {p.roles && <RoleCards roles={p.roles} />}
          {p.flows.map((f) => <FlowSteps key={f.title} flow={f} />)}
          {p.learnings && (
            <div className="d-learning">
              <h3>구현하며 배운 것</h3>
              <div className="d-learning-grid">
                {p.learnings.map(([title, body]) => (
                  <article key={title}><h4>{title}</h4><p>{body}</p></article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="d-sec fade">
          <header><b>{sectionNumber(3)}</b><h2>트러블슈팅</h2><small>{p.trouble.length}건</small></header>
          <TroubleList items={p.trouble} />
        </section>

        <section className="d-sec fade">
          <header><b>{sectionNumber(4)}</b><h2>회고</h2></header>
          <div className="d-retrospective">
            {p.retrospective.map(([title, body], index) => (
              <article key={title}>
                <span className="reflection-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div><h3>{title}</h3><p>{body}</p></div>
              </article>
            ))}
          </div>
        </section>

        <nav className="d-next fade">
          <button onClick={() => onGo(prev.slug)}><small>← 이전</small><strong>{prev.title}</strong></button>
          <button onClick={() => onGo(next.slug)}><small>다음 →</small><strong>{next.title}</strong></button>
        </nav>
      </div>
    </>
  );
}
