/** 프로젝트 줄 DOM 을 slug 로 찾기 위한 등록부 (상세 페이지가 펼쳐지고 접히는 위치 계산용) */
const rows = new Map<string, HTMLAnchorElement>();

export const rowRegistry = {
  set(slug: string, el: HTMLAnchorElement | null) {
    if (el) rows.set(slug, el);
    else rows.delete(slug);
  },
  get: (slug: string) => rows.get(slug) ?? null,
};
