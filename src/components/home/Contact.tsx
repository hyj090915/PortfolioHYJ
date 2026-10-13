import { PROFILE } from '@/data/profile';

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact-kicker mobile-only">NEXT CHAPTER</div>
      <h2>같이 굴러갈 팀<br /><em>찾고 있어요.</em></h2>
      <p className="contact-intro mobile-only">만드는 이야기, 함께할 이야기.<br />편하게 연락 주세요.</p>
      <div className="links">
        <a className="btn primary" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
        {PROFILE.links.map(([label, href]) => (
          <a key={label} className="btn ghost" href={href} target="_blank" rel="noreferrer">{label}</a>
        ))}
      </div>
      <div className="mobile-world-stage mobile-only" />
      <footer className="contact-footer mobile-only">
        <span>계속 배우고, 계속 만드는 한예준.</span>
        <a href="#top" aria-label="맨 위로 돌아가기">Back to top <span aria-hidden="true">↑</span></a>
      </footer>
    </section>
  );
}
