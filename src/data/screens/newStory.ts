import type { ProjectScreen } from '@/types/project';

const BASE = '/projects/newstory/screens';

export const NEWSTORY_SCREENS: ProjectScreen[] = [
  {
    id: 'article-original', title: '기사 원문 읽기', category: '기사 상세',
    description: '기사 원문을 읽다가 동화체·소설체·카드요약 탭으로 읽는 형식을 바꿀 수 있습니다. 보관함 저장과 공유도 같은 화면에서 이어집니다.',
    detail: 'Flutter 상세 화면에서 원문과 변환 결과를 함께 제공합니다. 공용 변환 캐시와 사용자별 변환 기록을 분리해 같은 기사를 다시 읽는 흐름을 구성했습니다.',
    src: `${BASE}/01-article-original.webp`, thumbnail: `${BASE}/01-article-original-thumb.webp`, width: 1080, height: 2112,
  },
  {
    id: 'reading-level', title: '용어 설명 난이도 선택', category: '변환 설정',
    description: '쉬움·보통·어려움 중에서 용어 설명의 양을 고른 뒤 변환을 시작합니다. 같은 기사도 자신에게 맞는 설명 수준으로 읽을 수 있습니다.',
    detail: '스타일과 난이도를 변환 API에 함께 전달합니다. 난이도마다 표시하는 용어 수가 달라 기사·스타일·난이도를 모두 캐시 키에 포함했습니다.',
    src: `${BASE}/02-reading-level.webp`, thumbnail: `${BASE}/02-reading-level-thumb.webp`, width: 1080, height: 2107,
  },
  {
    id: 'fairytale', title: '동화체로 읽기', category: '읽기 스타일',
    description: '뉴스 내용을 동화처럼 풀어쓴 문장으로 읽습니다. 강조된 용어나 용어 전체 보기를 통해 낯선 표현의 뜻을 확인할 수 있습니다.',
    detail: 'Claude API로 기사 내용을 유지하며 동화체로 변환합니다. 본문과 용어 풀이를 나누어 전달하고, 같은 조건의 요청에는 저장된 결과를 재사용합니다.',
    src: `${BASE}/03-fairytale.webp`, thumbnail: `${BASE}/03-fairytale-thumb.webp`, width: 1080, height: 2102,
  },
  {
    id: 'novel', title: '소설체로 읽기', category: '읽기 스타일',
    description: '같은 기사를 소설체 문장으로 읽고, 밑줄로 표시된 어려운 용어를 확인합니다. 상단 탭으로 다른 읽기 형식과 원문을 오갈 수 있습니다.',
    detail: '스타일별 변환 결과를 캐시에 저장하고 Flutter 화면에서 본문과 용어 표시를 구분해 그립니다. 캐시가 있으면 원문 크롤링과 AI 재호출 없이 응답합니다.',
    src: `${BASE}/04-novel.webp`, thumbnail: `${BASE}/04-novel-thumb.webp`, width: 1080, height: 2097,
  },
  {
    id: 'card-summary', title: '카드요약으로 핵심 읽기', category: '읽기 스타일',
    description: '기사의 핵심을 번호가 붙은 짧은 카드로 정리해 읽습니다. 요약 결과를 보관함에 저장하거나 공유할 수 있습니다.',
    detail: '동화체·소설체와 함께 카드요약을 변환 스타일로 제공합니다. 공용 캐시를 재사용하면서 사용자별 변환 기록은 따로 저장합니다.',
    src: `${BASE}/05-card-summary.webp`, thumbnail: `${BASE}/05-card-summary-thumb.webp`, width: 1080, height: 2097,
  },
  {
    id: 'inline-glossary', title: '읽는 중 바로 용어 풀이', category: '읽기 도움',
    description: '본문에서 강조된 용어를 누르면 설명 창이 열립니다. 모르는 단어의 뜻을 확인한 뒤 읽던 내용으로 돌아갈 수 있습니다.',
    detail: '본문의 용어 표시와 풀이 데이터를 연결했습니다. 변환 응답에서 분리한 용어 설명을 Flutter의 팝업으로 보여줍니다.',
    src: `${BASE}/06-inline-glossary.webp`, thumbnail: `${BASE}/06-inline-glossary-thumb.webp`, width: 1080, height: 2115,
  },
  {
    id: 'glossary-list', title: '용어 모아 보기', category: '읽기 도움',
    description: '기사에 등장하는 용어와 쉬운 풀이를 하단 시트에서 한 번에 확인합니다. 본문 곳곳에 있는 설명을 목록으로 모았습니다.',
    detail: 'Claude가 반환하는 {{term:용어|뜻풀이}} 표기를 파싱해 본문과 용어 목록으로 나눕니다. 같은 풀이 데이터를 본문 팝업과 전체 목록에서 사용합니다.',
    src: `${BASE}/07-glossary-list.webp`, thumbnail: `${BASE}/07-glossary-list-thumb.webp`, width: 1080, height: 2096,
  },
  {
    id: 'direct-convert', title: '뉴스 링크 직접 변환', category: '직접 변환',
    description: '읽고 싶은 기사 URL을 붙여 넣고 동화체·소설체·카드요약 중 원하는 형식을 선택합니다. 홈 목록 밖에서 찾은 기사도 변환 요청을 시작할 수 있습니다.',
    detail: '캐시를 먼저 조회하고, 저장된 결과가 없으면 Jsoup으로 원문을 추출한 뒤 Claude에 변환을 요청합니다. 결과는 캐시와 사용자별 기록에 나누어 저장합니다.',
    src: `${BASE}/08-direct-convert.webp`, thumbnail: `${BASE}/08-direct-convert-thumb.webp`, width: 1080, height: 2099,
  },
  {
    id: 'login', title: '로그인', category: '계정',
    description: '카카오·Google 로그인 버튼과 이메일·비밀번호 입력 폼을 한 화면에 모았습니다. 하단에서는 회원가입 화면으로 이동할 수 있습니다.',
    detail: '백엔드에서 카카오·Google 소셜 로그인과 JWT 인증을 구현했습니다. 사용자별 변환 기록과 보관함을 구분하는 인증 흐름의 시작점입니다.',
    src: `${BASE}/09-login.webp`, thumbnail: `${BASE}/09-login-thumb.webp`, width: 1080, height: 2115,
  },
  {
    id: 'my-settings', title: 'MY와 위젯 설정', category: '계정 · 설정',
    description: '프로필과 오늘의 카드요약 위젯 설정을 확인하고, 계정·알림·언어·문의·약관 메뉴로 이동합니다. 로그아웃도 이 화면에 모았습니다.',
    detail: '개인 설정을 한 화면으로 정리하고, 오늘의 카드요약을 제공하는 홈 위젯 API와 연결되는 설정 진입점을 마련했습니다.',
    src: `${BASE}/10-my-settings.webp`, thumbnail: `${BASE}/10-my-settings-thumb.webp`, width: 1080, height: 2105,
  },
  {
    id: 'home-before-fix', title: 'RSS 개선 전 홈 화면', category: '개발 기록 · 개선 전',
    description: '카테고리 탭과 기사 제목·언론사·발행 시점을 보여주는 개발 중 캡처입니다. 당시 기사 분류가 모두 ‘전체’로 표시되고, 설명에 HTML 태그가 노출되는 문제가 있었습니다.',
    detail: 'RSS 소스의 주소·카테고리·태그 파싱을 점검하게 된 배경을 보여줍니다. 이후 섹션별 피드로 카테고리를 지정하고 파싱 버그를 수정한 과정은 트러블슈팅에 정리했습니다.',
    src: `${BASE}/11-home-before-fix.webp`, thumbnail: `${BASE}/11-home-before-fix-thumb.webp`, width: 1080, height: 2108,
  },
];
