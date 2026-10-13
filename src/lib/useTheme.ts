import { useSyncExternalStore } from 'react';
import { theme, type ThemeName } from './theme';

export function useTheme(): ThemeName {
  return useSyncExternalStore((cb) => theme.subscribe(cb), theme.get);
}
