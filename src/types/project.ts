/** 목록 줄에 마우스 올리면 뜨는 요약 카드 */
export interface ProjectPeek {
  /** 라벨 (예: TROUBLE 01) */
  k: string;
  /** 본문 한 줄 */
  v: string;
  /** 하단 메타 */
  t: string;
}

export interface ArchNode {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  /** 기본 160 */
  w?: number;
  /** 핵심 서버 (파란 테두리) */
  core?: boolean;
}

/** [from, to, label, 요청이 흐르는 주 경로 여부] */
export type ArchEdge = [from: string, to: string, label: string, main: boolean];

export interface Architecture {
  w: number;
  h: number;
  nodes: ArchNode[];
  edges: ArchEdge[];
  note: string;
}

/** [제목, 설명, 분기 단계 여부] */
export type FlowStep = [title: string, desc: string, branch?: boolean];

export interface Flow {
  title: string;
  steps: FlowStep[];
  foot: string;
}

/** [역할명, 보조 라벨, 권한 목록] */
export type Role = [name: string, note: string, items: string[]];

/** [라벨, 값]. 확인된 내용이 없는 null 항목은 화면에서 생략한다. */
export type TroubleRow = [label: string, value: string | string[] | null];

export interface Trouble {
  /** 왼쪽에 크게 박히는 숫자/키워드 */
  big: string;
  cap: string;
  title: string;
  rows: TroubleRow[];
}

/** [라벨, URL, 강조 버튼 여부] */
export type ProjectLink = [label: string, href: string, primary: boolean];

export interface ProjectScreen {
  id: string;
  title: string;
  category: string;
  description: string;
  detail: string;
  src: string;
  thumbnail: string;
  width: number;
  height: number;
}

export interface Project {
  slug: string;
  no: string;
  title: string;

  /* 목록 */
  summary: string;
  stackLine: string;
  roleLabel: string;
  peek: ProjectPeek;

  /* 상세 */
  lead: string;
  overview: string[];
  retrospective: [title: string, body: string][];
  learnings?: [title: string, body: string][];
  image?: { src: string; alt: string; caption: string };
  screens?: ProjectScreen[];
  meta: [label: string, value: string][];
  links: ProjectLink[];
  stack: string[];
  work: [group: string, items: string[]][];
  arch: Architecture;
  roles?: Role[];
  flows: Flow[];
  trouble: Trouble[];
}
