import { PROFILE } from '@/data/profile';

export default function Hero() {
  const [line1, line2, accent] = PROFILE.headline;
  return (
    <section className="hero" id="top">
      <div className="eyebrow">{PROFILE.role}</div>
      <h1>
        <span className="line"><span>{line1}</span></span>
        <span className="line"><span>{line2}<em>{accent}</em></span></span>
      </h1>
      <p className="sub"><b>{PROFILE.name}</b> — {PROFILE.intro}</p>
      <div className="hero-actions mobile-only">
        <a href="#projects" className="hero-project-link">만든 것들 둘러보기 <span aria-hidden="true">↘</span></a>
        <span className="hero-personal-note">직접 만들고, 직접 운영해요.</span>
      </div>
      <div className="mobile-world-stage mobile-only" />
      <div className="hero-bottom mobile-only">
        <span>작은 호기심에서, 실제 서비스까지.</span>
        <a href="#projects" aria-label="프로젝트로 스크롤"><span aria-hidden="true">↓</span></a>
      </div>
      <div className="scroll-hint"><i />SCROLL</div>
    </section>
  );
}
