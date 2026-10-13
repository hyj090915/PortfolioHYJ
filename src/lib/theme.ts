/**
 * 낮/밤 테마 스토어.
 * - 초기값: localStorage → 없으면 접속 시각 (19시~6시 = 밤). index.html 인라인 스크립트와 같은 규칙.
 * - 바꾸면 <html data-theme> 갱신, 0.7초 동안 색 전환(.theming), 선택 기억.
 */
export type ThemeName = 'day' | 'night';

const STORAGE_KEY = 'yj-daynight';
const TRANSITION_MS = 750;

function readInitial(): ThemeName {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* 사생활 보호 모드 등 */
  }
  if (saved === 'day' || saved === 'night') return saved;
  const h = new Date().getHours();
  return h >= 19 || h < 6 ? 'night' : 'day';
}

type Listener = (name: ThemeName, instant: boolean) => void;

let current: ThemeName = readInitial();
let transitionTimer = 0;
const listeners = new Set<Listener>();

document.documentElement.dataset.theme = current;

export const theme = {
  get: (): ThemeName => current,
  isNight: (): boolean => current === 'night',

  set(name: ThemeName) {
    current = name;
    const root = document.documentElement;
    root.classList.add('theming');
    clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => root.classList.remove('theming'), TRANSITION_MS);
    root.dataset.theme = name;
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* 저장 실패해도 동작엔 문제 없음 */
    }
    listeners.forEach((fn) => fn(name, false));
  },

  toggle() {
    theme.set(current === 'night' ? 'day' : 'night');
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
