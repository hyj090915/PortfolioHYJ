import type { ProjectScreen } from '@/types/project';

const base = '/projects/gbsw-dorm/screens/';

export const GBSW_SCREENS: ProjectScreen[] = [
  {
    id: 'notices', title: '기숙사 공지사항', category: 'WEB · 생활 안내',
    description: '중요 공지를 먼저 보여주고, 작성자·조회 수·등록일을 함께 표시합니다. 제목 검색으로 필요한 기숙사 공지를 찾아볼 수 있습니다.',
    detail: 'React 반응형 화면과 공지 API를 연결했습니다. 사용자 역할에 맞는 메뉴를 제공하고, 같은 공지를 웹과 모바일 앱에서 확인하도록 구성했습니다.',
    src: `${base}02-notices.webp`, thumbnail: `${base}02-notices-thumb.webp`, width: 3024, height: 1642,
  },
  {
    id: 'notices-mobile', title: '모바일 공지와 빈 화면 안내', category: 'APP · 생활 안내',
    description: '모바일에서는 공지 제목과 등록일을 중심으로 목록을 보여줍니다. 표시할 공지가 없을 때는 안내 문구를 보여주고, 아래에서 제목으로 검색할 수 있습니다.',
    detail: 'React 반응형 화면을 Flutter WebView 앱에서도 사용합니다. 좁은 화면에 맞춰 목록 정보를 줄이고, 데이터가 없는 상태도 별도 화면으로 안내했습니다.',
    src: `${base}10-notices-mobile.webp`, thumbnail: `${base}10-notices-mobile-thumb.webp`, width: 1080, height: 2316,
  },
  {
    id: 'penalty-request', title: '규정에 맞춰 벌점 요청', category: 'WEB · 층장 업무',
    description: '대상 학생을 선택하고 규정에 있는 벌점 사유와 점수를 확인합니다. 상세 사유를 입력하고 학생을 추가해 요청을 제출하는 화면입니다.',
    detail: '층장의 요청을 관리자가 승인하거나 반려하는 처리 흐름을 구현했습니다. 요청 접수와 처리 결과를 알림으로 전달하고, 점수는 확인 과정을 거쳐 반영합니다.',
    src: `${base}04-penalty-request.webp`, thumbnail: `${base}04-penalty-request-thumb.webp`, width: 3024, height: 1648,
  },
  {
    id: 'my-points', title: '내 상벌점과 처리 내역', category: 'WEB · 점수 조회',
    description: '누적 상점·벌점과 순점수를 한눈에 확인합니다. 전체·상점·벌점 필터 아래에서 사유, 날짜와 승인 상태를 함께 볼 수 있습니다.',
    detail: '상벌점 요청과 승인·반려 처리를 학생의 점수 조회 화면으로 연결했습니다. 역할별 API 접근 제어를 적용해 자신의 내역을 확인하도록 구성했습니다.',
    src: `${base}07-my-points.webp`, thumbnail: `${base}07-my-points-thumb.webp`, width: 3014, height: 1642,
  },
  {
    id: 'my-points-mobile', title: '앱에서 확인하는 내 점수', category: 'APP · 점수 조회',
    description: '모바일에서도 누적 점수 요약과 내역 필터를 먼저 보여줍니다. 각 내역은 점수·사유·승인 상태가 담긴 카드로 확인할 수 있습니다.',
    detail: '웹의 상벌점 조회 화면을 작은 화면에 맞춰 배치하고 Flutter WebView에서 제공합니다. 앱에는 FCM 푸시를 연결해 상벌점 처리 알림도 받을 수 있게 했습니다.',
    src: `${base}11-my-points-mobile.webp`, thumbnail: `${base}11-my-points-mobile-thumb.webp`, width: 1080, height: 2316,
  },
  {
    id: 'calendar', title: '귀가·잔류 일정 달력', category: 'WEB · 생활 안내',
    description: '월별 달력에서 귀가주·잔류주와 방학 일정을 확인합니다. 색과 텍스트를 함께 표시해 일정 종류를 구분하고 이전·다음 달로 이동합니다.',
    detail: '학생은 귀가 달력을 조회하고 관리자는 일정을 관리하도록 역할을 나눴습니다. 공지와 함께 기숙사 생활에 필요한 정보를 웹과 앱에서 제공합니다.',
    src: `${base}05-calendar.webp`, thumbnail: `${base}05-calendar-thumb.webp`, width: 3024, height: 1650,
  },
  {
    id: 'login', title: '학번으로 로그인', category: 'WEB · 인증',
    description: '학번과 비밀번호로 로그인한 뒤 자신의 역할에 맞는 기숙사 기능을 이용합니다. 서비스의 진입 화면을 한 장의 로그인 폼으로 정리했습니다.',
    detail: 'JWT 인증과 역할별 API 접근 제어를 구현했습니다. 운영 중 초기 비밀번호 문제가 발생한 뒤에는, 비밀번호 미변경 계정의 API 접근을 서버 필터에서도 차단하도록 보완했습니다.',
    src: `${base}01-login.webp`, thumbnail: `${base}01-login-thumb.webp`, width: 3024, height: 1648,
  },
  {
    id: 'login-mobile', title: '앱 로그인 화면', category: 'APP · 인증',
    description: '학교 로고와 학번·비밀번호 입력, 로그인 버튼을 세로로 배치했습니다. 로그인 전 계정 사용 안내까지 확인할 수 있는 모바일 진입 화면입니다.',
    detail: 'Flutter WebView 앱에서 웹과 같은 JWT 인증 흐름을 사용합니다. 초기 비밀번호 미변경 계정의 API 접근은 서버의 계정 상태 필터에서도 차단하도록 보완했습니다.',
    src: `${base}12-login-mobile.webp`, thumbnail: `${base}12-login-mobile-thumb.webp`, width: 1080, height: 2316,
  },
  {
    id: 'settings-archive', title: '초기 계정·알림 설정', category: 'WEB · 운영 초기 기록',
    description: '비밀번호 변경과 종류별 알림 설정을 모은 운영 초기 화면입니다. 상점·벌점·공지 알림 외에, 현재 종료된 커뮤니티·불편사항 기능의 설정도 포함되어 있습니다.',
    detail: '웹 푸시·FCM·문자 알림을 구현했습니다. 이후 계정 보안을 보완하며 프론트엔드의 비밀번호 변경 안내뿐 아니라 서버에서도 계정 상태를 검사하도록 했습니다.',
    src: `${base}08-settings-archive.webp`, thumbnail: `${base}08-settings-archive-thumb.webp`, width: 3022, height: 1640,
  },
  {
    id: 'community-web-archive', title: '초기 웹 커뮤니티', category: 'WEB · 운영 초기 기록',
    description: '전체·층별 채널에서 게시글과 댓글 수, 작성일을 확인하던 웹 화면입니다. 현재는 게시판 작성 기능을 종료했으며, 이 화면은 운영 초기 기록입니다.',
    detail: '게시글을 카드 목록으로 제공하고 모바일에서도 같은 내용을 볼 수 있게 구성했습니다. 운영 중 보안 사고에 대응해 글쓰기를 동결한 뒤 작성 기능을 제거했습니다.',
    src: `${base}03-community-web-archive.webp`, thumbnail: `${base}03-community-web-archive-thumb.webp`, width: 3024, height: 1646,
  },
  {
    id: 'community-archive', title: '초기 모바일 커뮤니티', category: 'APP · 운영 초기 기록',
    description: '전체·층별 채널을 구분하고 게시글을 카드 목록으로 보여주던 모바일 화면입니다. 이 캡처는 운영 초기 모습으로, 현재 게시판 작성 기능은 종료했습니다.',
    detail: 'Flutter WebView 앱에서 반응형 웹 화면을 제공했습니다. 운영 중 보안 사고 이후 글쓰기 기능을 동결하고, 게시판과 불편사항 작성 기능을 제거한 경험은 트러블슈팅과 회고에 정리했습니다.',
    src: `${base}09-community-archive.webp`, thumbnail: `${base}09-community-archive-thumb.webp`, width: 1080, height: 2316,
  },
  {
    id: 'complaints-archive', title: '초기 불편사항 접수', category: 'WEB · 운영 초기 기록',
    description: '시설·설비, 소음, 기타로 유형을 나누고 내용과 사진을 첨부해 불편사항을 접수하던 화면입니다. 현재 작성 기능은 제거되어 운영 초기 기록으로 남겼습니다.',
    detail: '접수 폼과 내 접수 이력을 나눠 구성했습니다. 보안 사고 이후 학생 글쓰기를 동결하고 게시판·불편사항 작성 기능을 제거한 과정은 트러블슈팅에 정리했습니다.',
    src: `${base}06-complaints-archive.webp`, thumbnail: `${base}06-complaints-archive-thumb.webp`, width: 3024, height: 1644,
  },
];
