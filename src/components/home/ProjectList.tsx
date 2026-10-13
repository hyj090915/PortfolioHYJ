import { PROJECTS } from '@/data/projects';
import { peek } from '@/lib/peek';
import ProjectRow from './ProjectRow';

export default function ProjectList() {
  return (
    <section className="projects" id="projects">
      <div className="inner" ref={peek.setAnchor}>
        <div className="projects-kicker mobile-only"><span>SELECTED WORK</span><span>직접 부딪히며 만든 것들</span></div>
        <div className="sec-title">
          <h2>Projects</h2>
          <small>{String(PROJECTS.length).padStart(2, '0')}</small>
        </div>
        {PROJECTS.map((p) => (
          <ProjectRow key={p.slug} project={p} />
        ))}
      </div>
    </section>
  );
}
