import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import type { Project } from '@/types/project';
import { findProject } from '@/data/projects';
import { prefersReducedMotion } from '@/lib/env';
import { peek } from '@/lib/peek';
import { rowRegistry } from '@/lib/rowRegistry';
import { worldControl } from '@/lib/worldControl';
import ProjectDetail from './ProjectDetail';
import { CONTENT_DELAY, PAUSE_DELAY, collapseTo, expandFrom, expandInstant, fadeInWrap, fadeOutWrap, morphTitle } from './motion';

type Intent = { kind: 'open'; fromRow: HTMLAnchorElement | null } | { kind: 'switch' } | null;

/**
 * 주소(/projects/:slug)를 보고 상세 페이지를 열고 닫는다.
 * - 목록에서 누르면: 그 줄이 화면 전체로 펼쳐지고 제목이 날아가 붙음
 * - 주소로 바로 들어오면: 연출 없이 열림
 * - 뒤로가기 / ← Projects / Esc: 원래 줄 자리로 접힘
 */
export default function DetailOverlay() {
  const match = useMatch('/projects/:slug');
  const routeSlug = match?.params.slug;
  const location = useLocation();
  const navigate = useNavigate();

  const layerRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  const intent = useRef<Intent>(null);
  /** 앱 안에서 열었는지 (닫을 때 history.back 해도 되는지) */
  const openedInApp = useRef(false);
  const firstRoute = useRef(true);
  const timers = useRef<number[]>([]);
  const closing = useRef<Animation | null>(null);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /* 주소 변화 → 열기 / 바꾸기 / 닫기 */
  useEffect(() => {
    const isFirst = firstRoute.current;
    firstRoute.current = false;
    const next = findProject(routeSlug);

    if (next && (!project || !open || closing.current)) {
      // 열기 (접히는 중에 다시 앞으로 가기 한 경우 포함)
      closing.current?.cancel();
      closing.current = null;
      clearTimers();
      openedInApp.current = !isFirst;
      intent.current = { kind: 'open', fromRow: isFirst ? null : rowRegistry.get(next.slug) };
      peek.hide();
      document.body.classList.add('detail-open');
      setProject(next);
      setOpen(true);
      setShown(false);
    } else if (next && project && next.slug !== project.slug) {
      // 이전/다음
      intent.current = { kind: 'switch' };
      setProject(next);
    } else if (!next && project && open) {
      // 닫기
      clearTimers();
      worldControl.paused = false;
      setShown(false);
      document.body.classList.remove('detail-open');
      const anim = collapseTo(layerRef.current!, rowRegistry.get(project.slug), prefersReducedMotion);
      closing.current = anim;
      anim.onfinish = () => {
        if (closing.current !== anim) return;
        closing.current = null;
        setOpen(false);
        setProject(null);
      };
    }
  }, [routeSlug]);

  /* 내용이 DOM 에 들어간 직후(페인트 전) 연출 시작 */
  useLayoutEffect(() => {
    const it = intent.current;
    const layer = layerRef.current;
    if (!it || !layer || !project) return;
    intent.current = null;

    if (it.kind === 'open') {
      layer.scrollTop = 0;
      const title = layer.querySelector<HTMLElement>('.d-title')!;
      const rowTitle = it.fromRow?.querySelector<HTMLElement>('h3');
      if (it.fromRow && rowTitle && !prefersReducedMotion) {
        expandFrom(layer, it.fromRow);
        morphTitle(rowTitle, title);
        later(() => setShown(true), CONTENT_DELAY);
      } else {
        expandInstant(layer);
        setShown(true);
      }
      later(() => (worldControl.paused = true), PAUSE_DELAY);
    } else {
      layer.scrollTop = 0;
      fadeInWrap(layer.querySelector('.wrap')!);
    }
  }, [project, open]);

  const requestClose = useCallback(() => {
    if (openedInApp.current) navigate(-1);
    else navigate('/', { replace: true });
  }, [navigate]);

  const go = useCallback(
    (slug: string) => {
      const wrap = layerRef.current?.querySelector('.wrap');
      if (!wrap) return;
      fadeOutWrap(wrap).onfinish = () => navigate(`/projects/${slug}`, { replace: true, state: location.state });
    },
    [navigate, location.state],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && project && routeSlug) requestClose();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [project, routeSlug, requestClose]);

  useEffect(() => () => clearTimers(), []);

  const className = ['detail', open && 'open', shown && 'shown'].filter(Boolean).join(' ');

  return (
    <div className={className} id="detail" aria-live="polite" ref={layerRef}>
      {project && <ProjectDetail project={project} onClose={requestClose} onGo={go} />}
    </div>
  );
}
