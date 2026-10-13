import WorldCanvas from '@/components/world/WorldCanvas';
import Nav from '@/components/layout/Nav';
import Hero from '@/components/home/Hero';
import ProjectList from '@/components/home/ProjectList';
import Contact from '@/components/home/Contact';
import DetailOverlay from '@/components/detail/DetailOverlay';
import PeekCard from '@/components/overlay/PeekCard';
import Cursor from '@/components/overlay/Cursor';

/**
 * 한 페이지 구조. /projects/:slug 로 들어와도 홈은 그대로 깔려 있고
 * 그 위로 상세 페이지가 펼쳐진다 (DetailOverlay 가 주소를 보고 열고 닫음).
 */
export default function App() {
  return (
    <>
      <WorldCanvas />
      <Nav />
      <main>
        <Hero />
        <ProjectList />
        <Contact />
      </main>
      <DetailOverlay />
      <PeekCard />
      <Cursor />
    </>
  );
}
