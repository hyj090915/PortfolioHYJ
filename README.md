# yejun. — 포트폴리오

Vite + React + TypeScript + three.js

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ 생성 (타입 검사 포함)
npm run preview   # 빌드 결과 확인
```

## 내용 고치기

| 바꿀 것 | 파일 |
|---|---|
| 프로젝트 목록 · 미리보기 카드 · 상세 페이지 내용 | `src/data/projects.ts` |
| 프로젝트 화면 이미지 | `public/projects/` |
| 화면별 캡처 · 기능 설명 | `src/data/screens/`, `public/projects/*/screens/` |
| 기술스택 아이콘 · 출처 | `src/components/shared/TechStack.tsx`, `public/icons/tech/` |
| 첫 화면 문구 · 이메일 · 링크 | `src/data/profile.ts` |
| 색 · 폰트 | `src/styles/tokens.css` |

프로젝트를 추가하면 목록 · 상세 페이지 · 이전/다음 버튼이 자동으로 따라온다.
개요(`overview`)와 회고(`retrospective`)를 프로젝트 데이터에서 관리한다. 확인되지 않은 트러블슈팅 값은 `null`로 두면 화면에서 생략된다. 연결할 실제 주소가 있는 경우에만 `links`에 추가한다.

프로젝트 본문과 화면 이미지는 2026-10-12에 확인한 [Figma 포트폴리오](https://www.figma.com/proto/7dVXoaBQtylxFyjXeazrEO/한예준포폴?page-id=0%3A1&node-id=62-2) 내용을 반영했다. 화면 이미지는 피그마에 배치된 프로젝트 미리보기이며, 원본 서비스의 최신 상태를 자동으로 반영하지 않는다.

`screens`가 있는 프로젝트에는 주요 화면 갤러리가 표시된다. 화면마다 기능 설명과 구현 포인트를 분리하고, 썸네일 선택·이전/다음·확대 보기·원본 크기 보기를 제공한다. 모달에서 Escape는 확대 보기만 닫고, 원본 크기에서는 방향키로 이미지를 탐색한다.

2026-10-12에 전달받은 캡처는 원본을 보존한 채 WebP와 작은 썸네일로 변환했다. 사이트에 포함한 파일은 전화번호·학교 이메일·학생 식별 정보·초기 비밀번호를 불투명 영역으로 가린 복사본이며, EXIF 등 원본 메타데이터는 포함하지 않는다. 각 이미지 폴더의 `manifest.json`에서 출처 파일명과 가림 좌표를 확인할 수 있다. 기숙사 커뮤니티 캡처는 현재 종료된 기능이므로 운영 초기 기록으로 명시했다.

현재 AWARE-AI 11장, NewStory 11장, 기숙사 12장을 반영했다. NewStory의 MY 계정 정보는 가리고, RSS 파싱·분류 문제가 보이는 홈 캡처는 개선 전 기록으로 구분했다. 2026-10-13에 기숙사 나머지 9장의 다운로드를 확인하고 벌점 요청·상벌점 조회·귀가 달력·모바일 화면을 추가했다. 기숙사 커뮤니티·불편사항·관련 알림 설정은 운영 초기 기록으로 구분했다. 이름·학번·호실·프로필 이니셜·전화번호·초기 비밀번호 값을 가리고, 원본이 변경되지 않았음을 처리 전후 SHA-256으로 확인했다.

## 구조

```
src/
  data/          프로젝트 · 프로필 데이터 (내용은 여기만 고치면 됨)
  types/         데이터 타입
  styles/        CSS (index.css 의 import 순서 = 캐스케이드 순서, 바꾸지 말 것)
  lib/           전역 상태 · 유틸 (테마, 포인터, 미리보기 카드, 환경 값)
  world/         배경 3D 월드 (React 와 독립된 three.js 코드)
    layout.ts    PC / 모바일 무대 배치 (모바일은 3D 를 글 아래 무대로만 씀)
    server.ts    서버 타워 + 이스터에그 (계속 클릭하면 과열 → 연기 → 폭발 → 랙이 쌓이며 복구)
    nameplate.ts 히어로 뒤 클레이 이름 "yejun." (마우스 올리면 통, 클릭하면 한 바퀴)
    fonts/       이름 글자용 폰트 (Bricolage Grotesque 800, y·e·j·u·n·. 만 추출, OFL)
    mascot/      마스코트 몸 · 수면모자 · 땀 · 행동(controller)
  components/
    layout/      상단 내비, 낮/밤 버튼
    home/        히어로 · 프로젝트 목록 · 연락처
    overlay/     커서(해/별) · 미리보기 카드
    world/       3D 캔버스 마운트
    detail/      상세 페이지 (주소 /projects/:slug 로 열림) + 전환 연출
```

## 배포 (Vercel)

1. GitHub 에 push
2. Vercel → Add New → Project → 이 저장소 Import (Framework: Vite 자동 인식)
3. 이후 `main` 에 push 하면 자동 배포, 다른 브랜치/PR 은 Preview URL

`vercel.json` 이 모든 경로를 `index.html` 로 넘겨서 `/projects/gbsw-dorm` 같은 주소로 바로 들어와도 열린다.
