/** 한 번만 읽는 환경 값. 페이지 로드 시점 기준 (시안과 동일). */
export const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hasFinePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isMobileViewport = innerWidth < 800;
