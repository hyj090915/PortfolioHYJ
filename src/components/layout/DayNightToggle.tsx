import { theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

/** 해 ↔ 달로 모핑되는 낮/밤 버튼. 모양 변화는 전부 CSS(toggle.css) */
export default function DayNightToggle() {
  const night = useTheme() === 'night';
  return (
    <button className="dn" id="dn" aria-label={night ? '낮으로 전환' : '밤으로 전환'} onClick={theme.toggle}>
      <svg viewBox="0 0 24 24">
        <mask id="dnMask">
          <rect width="24" height="24" fill="#fff" />
          <circle className="bite" cx="30" cy="0" r="7" fill="#000" />
        </mask>
        <circle className="core" cx="12" cy="12" r="5" fill="currentColor" mask="url(#dnMask)" />
        <g className="rays">
          <line x1="12" y1="1.5" x2="12" y2="3.5" /><line x1="12" y1="20.5" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" /><line x1="20.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.6" y1="4.6" x2="6" y2="6" /><line x1="18" y1="18" x2="19.4" y2="19.4" />
          <line x1="4.6" y1="19.4" x2="6" y2="18" /><line x1="18" y1="6" x2="19.4" y2="4.6" />
        </g>
      </svg>
    </button>
  );
}
