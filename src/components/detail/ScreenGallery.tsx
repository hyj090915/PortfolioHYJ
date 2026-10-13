import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ProjectScreen } from '@/types/project';

interface Props {
  screens: ProjectScreen[];
  projectTitle: string;
}

export default function ScreenGallery({ screens, projectTitle }: Props) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();
  const screen = screens[selected];
  const count = `${String(selected + 1).padStart(2, '0')} / ${String(screens.length).padStart(2, '0')}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded) dialog.showModal();
    else dialog.close();
  }, [expanded]);

  useEffect(() => {
    if (expanded && zoomed) viewerRef.current?.focus();
  }, [expanded, zoomed]);

  useEffect(() => {
    const button = thumbnailRefs.current[selected];
    const strip = button?.parentElement;
    if (!button || !strip) return;
    const alignSelection = () => {
      const buttonRect = button.getBoundingClientRect();
      const left = buttonRect.left - strip.getBoundingClientRect().left + strip.scrollLeft;
      strip.scrollTo({ left: left - (strip.clientWidth - buttonRect.width) / 2, behavior: 'auto' });
    };
    alignSelection();
    const observer = new ResizeObserver(alignSelection);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [selected]);

  const select = (index: number) => {
    const next = (index + screens.length) % screens.length;
    setSelected(next);
    setZoomed(false);
    if (viewerRef.current) viewerRef.current.scrollTo(0, 0);
  };

  const onViewerKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
    } else if (!zoomed && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      select(selected + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  };

  return (
    <div className="screen-gallery">
      <p className="screen-intro">화면마다 담긴 기능과 구현 과정을 살펴보세요.</p>
      <div className="screen-selector" aria-label={`${projectTitle} 화면 선택`}>
        {screens.map((item, index) => (
          <button
            key={item.id}
            ref={el => { thumbnailRefs.current[index] = el; }}
            type="button"
            className="screen-thumbnail"
            aria-pressed={selected === index}
            aria-controls={panelId}
            onClick={() => select(index)}
          >
            <span className="screen-thumbnail-image"><img src={item.thumbnail} alt="" width={160} height={100} loading="lazy" decoding="async" /></span>
            <span className="screen-thumbnail-name"><i>{String(index + 1).padStart(2, '0')}</i>{item.title}</span>
          </button>
        ))}
      </div>

      <div className="screen-main" id={panelId}>
        <button
          type="button"
          className={`screen-stage${screen.height > screen.width ? ' is-portrait' : ''}`}
          aria-label={`${screen.title} 화면 크게 보기`}
          aria-haspopup="dialog"
          onClick={() => { setZoomed(false); setExpanded(true); }}
        >
          <img src={screen.src} alt={`${projectTitle} — ${screen.title}`} width={screen.width} height={screen.height} loading="lazy" decoding="async" />
          <span className="screen-expand" aria-hidden="true">크게 보기 <span>↗</span></span>
        </button>
        <div className="screen-copy" aria-live="polite" aria-atomic="true">
          <div className="screen-kicker"><span>{screen.category}</span><span>{count}</span></div>
          <h3>{screen.title}</h3>
          <p>{screen.description}</p>
          <div className="screen-detail"><h4>구현 포인트</h4><p>{screen.detail}</p></div>
          <div className="screen-navigation" aria-label="화면 넘기기">
            <button type="button" onClick={() => select(selected - 1)} aria-label="이전 화면">←</button>
            <span>{selected + 1}번째 화면 · 총 {screens.length}개</span>
            <button type="button" onClick={() => select(selected + 1)} aria-label="다음 화면">→</button>
          </div>
        </div>
      </div>

      <dialog
        className={`screen-viewer${zoomed ? ' is-zoomed' : ''}`}
        ref={dialogRef}
        aria-label={`${projectTitle} 화면 확대 보기`}
        onKeyDown={onViewerKey}
        onCancel={event => { event.preventDefault(); setExpanded(false); }}
        onClose={() => setExpanded(false)}
        onClick={event => { if (event.target === event.currentTarget) setExpanded(false); }}
      >
        <div className="screen-viewer-content">
          <header className="screen-viewer-header">
            <div aria-live="polite" aria-atomic="true"><span>{projectTitle} · {count}</span><h3>{screen.title}</h3></div>
            <button type="button" onClick={() => setExpanded(false)} aria-label="확대 보기 닫기" autoFocus>닫기 ×</button>
          </header>
          <div className="screen-viewer-stage" ref={viewerRef} tabIndex={0} role="region" aria-label="확대 이미지 · 방향키로 이동">
            {expanded && <img src={screen.src} alt={`${projectTitle} — ${screen.title}`} width={screen.width} height={screen.height} />}
          </div>
          <footer className="screen-viewer-footer">
            <button type="button" onClick={() => select(selected - 1)} aria-label="확대 보기 이전 화면">← 이전</button>
            <button type="button" onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>{zoomed ? '화면에 맞추기' : '원본 크기로 보기'}</button>
            <button type="button" onClick={() => select(selected + 1)} aria-label="확대 보기 다음 화면">다음 →</button>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
