/** 상세 페이지 전환 연출 (Web Animations API) */

export const EASE = 'cubic-bezier(.7,0,.2,1)';
export const OPEN_MS = 700;
export const TITLE_MS = 760;
export const CLOSE_MS = 560;
/** 펼쳐지기 시작하고 나머지 내용이 올라오는 시점 */
export const CONTENT_DELAY = 420;
/** 완전히 덮인 뒤 3D 렌더 멈추는 시점 */
export const PAUSE_DELAY = 720;

const FULL = 'inset(0px 0px 0px 0px round 0px)';

/** 요소 사각형 → clip-path inset */
export const insetOf = (r: DOMRect) =>
  `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 12px)`;

/** 목록 줄 자리에서 화면 전체로 펼침 */
export function expandFrom(layer: HTMLElement, row: HTMLElement) {
  layer.animate([{ clipPath: insetOf(row.getBoundingClientRect()) }, { clipPath: FULL }], { duration: OPEN_MS, easing: EASE, fill: 'forwards' });
}

/** 연출 없이 바로 펼침 */
export function expandInstant(layer: HTMLElement) {
  layer.animate([{ clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 1, fill: 'forwards' });
}

/** 목록 줄 자리로 (안 보이면 가운데로) 접음 */
export function collapseTo(layer: HTMLElement, row: HTMLElement | null, reduce: boolean) {
  const r = row?.getBoundingClientRect();
  const visible = !!r && r.bottom > 0 && r.top < innerHeight;
  return layer.animate([{ clipPath: FULL }, { clipPath: visible ? insetOf(r!) : 'inset(50% 0px 50% 0px round 0px)' }], {
    duration: reduce ? 1 : CLOSE_MS,
    easing: EASE,
    fill: 'forwards',
  });
}

/** 줄 제목이 날아가서 상세 페이지 큰 제목에 착 붙는 연출 */
export function morphTitle(from: HTMLElement, to: HTMLElement) {
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const fromStyle = getComputedStyle(from), toStyle = getComputedStyle(to);
  const fa = parseFloat(fromStyle.fontSize), fb = parseFloat(toStyle.fontSize);
  const ghost = from.cloneNode(true) as HTMLElement;
  ghost.className = 'morph';
  Object.assign(ghost.style, {
    fontFamily: fromStyle.fontFamily,
    fontSize: `${fa}px`,
    fontWeight: '800',
    letterSpacing: toStyle.letterSpacing,
    lineHeight: '1',
    color: 'var(--accent)',
  });
  document.body.appendChild(ghost);
  to.style.visibility = 'hidden';
  ghost.animate(
    [
      { transform: `translate(${a.left}px, ${a.top}px) scale(1)`, color: getComputedStyle(document.documentElement).getPropertyValue('--accent') },
      { transform: `translate(${b.left}px, ${b.top}px) scale(${fb / fa})`, color: toStyle.color },
    ],
    { duration: TITLE_MS, easing: EASE, fill: 'forwards' },
  ).onfinish = () => {
    to.style.visibility = '';
    ghost.remove();
  };
}

/** 이전/다음 프로젝트로 넘길 때 본문 교체 */
export const fadeOutWrap = (wrap: Element) =>
  wrap.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });

export const fadeInWrap = (wrap: Element) =>
  wrap.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
