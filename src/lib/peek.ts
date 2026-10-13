import { useSyncExternalStore } from 'react';
import type { ProjectPeek } from '@/types/project';

/** 프로젝트 줄에 마우스 올렸을 때 뜨는 카드 상태 */
type PeekState = { data: ProjectPeek | null; on: boolean };

let state: PeekState = { data: null, on: false };
/** 카드가 붙어 다니는 기준 (프로젝트 목록 컬럼) */
let anchor: HTMLElement | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export const peek = {
  show(data: ProjectPeek, visible: boolean) {
    state = { data, on: visible };
    emit();
  },
  setAnchor(el: HTMLElement | null) {
    anchor = el;
  },
  getAnchor: () => anchor,
  hide() {
    if (!state.on) return;
    state = { ...state, on: false };
    emit();
  },
};

export function usePeek(): PeekState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}
