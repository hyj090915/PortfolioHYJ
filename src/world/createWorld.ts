import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { isMobileViewport, prefersReducedMotion } from '@/lib/env';
import { pointer } from '@/lib/pointer';
import { theme } from '@/lib/theme';
import { worldControl } from '@/lib/worldControl';
import { clay, createPalette } from './materials';
import { ThemeBlender } from './themes';
import { buildDiorama } from './diorama';
import { createAmbientUniforms, createClouds, createStars, installCloudShadows } from './ambient';
import { createScrollChoreography } from './scroll';
import { MascotController } from './mascot/controller';
import { createNameplate } from './nameplate';
import { createServerTower } from './server';
import { DESKTOP_FOV, MOBILE_STAGE, isMobileLayout } from './layout';

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  /** 스크롤 구간 (위 → 아래) */
  sectionIds: string[];
  pant: HTMLElement;
  zzz: HTMLElement;
  /** 모바일: 문서 흐름 안에 확보한 무대의 실제 화면 좌표와 높이 */
  stageBounds: (stage: 'hero' | 'contact') => { top: number; height: number };
}

/**
 * 배경 3D 클레이 월드. 화면 전체를 덮는 땅 위의 디오라마 + 마스코트.
 * React 와 독립적으로 자기 루프를 돈다. 반환된 dispose() 로 정리.
 */
export function createWorld({ canvas, sectionIds, pant, zzz, stageBounds }: WorldOptions) {
  const reduce = prefersReducedMotion;

  /* renderer / scene */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobileViewport ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f2ece2');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(DESKTOP_FOV, innerWidth / innerHeight, 0.1, 200);

  const hemi = new THREE.HemisphereLight('#ffffff', '#b9bec6', 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e2', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  /* 땅 — 화면을 꽉 채워서 이게 곧 배경 */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), clay('#efe7da', { sheen: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const amb = createAmbientUniforms();
  installCloudShadows(ground.material, amb);
  scene.add(ground);

  const palette = createPalette();
  const blender = new ThemeBlender({ scene, ground, palette, hemi, sun });
  blender.set(theme.get(), true);
  const unsubTheme = theme.subscribe((name, instant) => blender.set(name, instant));

  const diorama = buildDiorama(scene, palette);
  const scroll = createScrollChoreography(sectionIds);

  let clouds!: ReturnType<typeof createClouds>;
  let stars!: THREE.Points;
  let mobile = isMobileLayout();
  const startX = mobile ? scroll.mobileStage().x : scroll.startX;
  const mascot = new MascotController(scene, startX, { pant, zzz }, () => {
    clouds = createClouds(scene);
    stars = createStars(scene, amb, renderer.getPixelRatio());
  });

  const nameplate = createNameplate(scene, palette);
  mascot.onLand = (strength, x) => nameplate.thump(strength, x);

  // 서버가 터지면: 마스코트 깜짝, 글자 들썩
  const server = createServerTower(scene, palette, {
    onExplode: (x) => {
      mascot.startle(x);
      nameplate.thump(9, x);
    },
  });

  /* PC ↔ 모바일 무대 전환 (layout.ts 설명 참고) */
  const fog = new THREE.Fog(0xffffff, MOBILE_STAGE.fog.near, MOBILE_STAGE.fog.far);
  let stage: 'hero' | 'contact' | null = null;
  const mobileFov = () => THREE.MathUtils.radToDeg(2 * Math.atan(
    Math.tan(THREE.MathUtils.degToRad(MOBILE_STAGE.horizontalFov) / 2) / camera.aspect,
  ));
  function applyLayout() {
    camera.fov = mobile ? mobileFov() : DESKTOP_FOV;
    if (!mobile) camera.clearViewOffset();
    camera.updateProjectionMatrix();
    scene.fog = mobile ? fog : null;
    nameplate.setLayout(mobile);
    server.setLayout(mobile);
    diorama.setLayout(mobile);
    stage = null;
  }
  applyLayout();

  /* loop */
  const clock = new THREE.Clock();
  const probe = new THREE.Vector3();
  let camX = 0;
  let nightAmt = 0;
  let raf = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    const t = clock.elapsedTime;
    const now = performance.now();
    const stageNow = mobile ? scroll.mobileStage() : null;
    const tgt = stageNow ?? scroll.target();

    blender.step(dt);
    nightAmt += ((blender.night ? 1 : 0) - nightAmt) * (1 - Math.exp(-dt * 2.2));
    amb.uTime.value = t;
    amb.uNight.value = nightAmt;
    amb.uDay.value = 1 - nightAmt;
    stars.visible = nightAmt > 0.01;
    clouds.update(dt, t, camX, nightAmt, reduce, mobile ? MOBILE_STAGE.cloudLift : 0);

    // 카메라: 스크롤 따라 옆으로, 마우스 따라 살짝
    const px = pointer.x / innerWidth - 0.5, py = pointer.y / innerHeight - 0.5;
    if (stageNow) {
      // 모바일: 카메라는 무대 앞에 고정, 무대 전체가 페이지와 같이 세로로 스크롤됨
      if (stageNow.stage !== stage) {
        stage = stageNow.stage;
        mascot.teleport(stageNow.x);
      }
      camX = stageNow.cam;
      const lift = MOBILE_STAGE.lift;
      // 손가락을 놓은 위치가 카메라를 움직이지 않도록 터치 무대의 시점은 고정.
      camera.position.set(camX, 6.2 + lift, 11);
      camera.lookAt(camX, 0.9 + lift, -0.5);
      camera.clearViewOffset();
      camera.fov = mobileFov();
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const spec = MOBILE_STAGE[stageNow.stage];
      const bounds = stageBounds(stageNow.stage);
      const projectedY = (x: number, y: number, z: number) => ((1 - probe.set(x, y, z).project(camera).y) / 2) * innerHeight;
      let topPx = projectedY(spec.top[0], spec.top[1], spec.top[2]);
      let feetPx = projectedY(stageNow.x, 0, 0.8);
      const available = Math.max(1, bounds.height - MOBILE_STAGE.gapTop - MOBILE_STAGE.gapBottom);
      // 태블릿에서는 무대 높이에 맞춰 한 번 더 축소. 화면 높이가 짧아도 글을 침범하지 않음.
      const fit = Math.min(1, available / Math.max(1, feetPx - topPx));
      if (fit < 1) {
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / fit));
        camera.updateProjectionMatrix();
        topPx = projectedY(spec.top[0], spec.top[1], spec.top[2]);
        feetPx = projectedY(stageNow.x, 0, 0.8);
      }
      const top = bounds.top + MOBILE_STAGE.gapTop + Math.max(0, (available - (feetPx - topPx)) / 2);
      camera.setViewOffset(innerWidth, innerHeight, 0, topPx - top, innerWidth, innerHeight);
      fog.color.copy(scene.background as THREE.Color);
    } else {
      camX += (tgt.cam - camX) * (reduce ? 1 : 1 - Math.exp(-dt * 5));
      camera.position.set(camX + px * 0.6, 6.2 - py * 0.4, 11);
      camera.lookAt(camX + px * 0.2, 0.9, -0.5);
    }
    if (server.shake > 0 && !reduce) {
      // 서버 폭발 직후 잠깐 흔들림
      const k = server.shake * server.shake * 0.16;
      camera.position.x += Math.sin(t * 71) * k;
      camera.position.y += Math.cos(t * 83) * k;
    }
    sun.position.set(camX + 6, 12, 8);
    sun.target.position.set(camX, 0, 0);

    mascot.update({ dt, t, now, camera, targetX: tgt.x, night: blender.night, reduce });
    nameplate.update(dt, camera, mascot.grabbing);
    server.update({ dt, t, camera, night: blender.night });

    if (!worldControl.paused) renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  frame();

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (isMobileLayout() !== mobile) {
      mobile = !mobile;
      applyLayout();
    }
  };
  addEventListener('resize', onResize);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      unsubTheme();
      mascot.dispose();
      nameplate.dispose();
      server.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
