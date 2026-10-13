import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types/project';
import { hasFinePointer } from '@/lib/env';
import { peek } from '@/lib/peek';
import { rowRegistry } from '@/lib/rowRegistry';
import TechStack from '@/components/shared/TechStack';

export default function ProjectRow({ project: p }: { project: Project }) {
  const navigate = useNavigate();
  const featuredTrouble = p.trouble[Number(p.peek.k.match(/\d+/)?.[0] ?? 1) - 1] ?? p.trouble[0];
  const solution = p.peek.v.split('→')[1]?.trim() ?? p.peek.v;

  const open = (e: MouseEvent) => {
    e.preventDefault();
    navigate(`/projects/${p.slug}`, { state: { fromList: true } });
  };

  return (
    <a
      className="row"
      href={`/projects/${p.slug}`}
      ref={(el) => rowRegistry.set(p.slug, el)}
      onClick={open}
      onPointerEnter={() => peek.show(p.peek, hasFinePointer)}
      onPointerLeave={peek.hide}
    >
      <span className="no">{p.no}</span>
      <div className="project-copy">
        <h3>{p.title}</h3>
        <p>{p.summary}</p>
        <TechStack items={p.stackLine.split(' · ')} className="meta" />
      </div>
      <span className="role">{p.roleLabel}</span>
      <span className="project-open mobile-only" aria-hidden="true">↗</span>
      {featuredTrouble && (
        <div className="project-note mobile-only">
          <div className="project-note-heading"><span>DEV NOTE</span><span>{p.peek.k}</span></div>
          <div className="project-note-body">
            <div className="project-note-stat"><strong>{featuredTrouble.big}</strong><span>{featuredTrouble.cap}</span></div>
            <span className="project-note-arrow" aria-hidden="true">→</span>
            <p>{solution}</p>
          </div>
          <div className="project-note-footer"><span>{p.peek.t}</span><span aria-hidden="true">↗</span></div>
        </div>
      )}
    </a>
  );
}
