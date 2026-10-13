import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Palette } from './materials';
import { MOBILE_STAGE } from './layout';
import { onWorldTap } from './input';

/**
 * 서버 타워 + 이스터에그.
 * 자꾸 클릭하면 과열 → 연기가 점점 짙어짐 → 계속 누르면 터짐 → 몇 초 뒤 랙이 한 칸씩 쌓이면서 복구.
 * 가만두면 서서히 식는다.
 */

/** PC 위치 (모바일 위치는 layout.ts 의 MOBILE_STAGE.server) */
const DESKTOP_POS = { x: 7.7, z: -5.0, ry: -0.35, scale: 1 };
const W = 1.2, H = 2.4, D = 1.1;
/** 이만큼 달아오르면 터짐 (클릭 1번 = 1, 가만두면 4초에 1씩 식음) */
const EXPLODE_AT = 8;
const SMOKE_FROM = 2.5;
const RESPAWN_DELAY = 3.2;
const RACKS = 4;

const rbox = (w: number, h: number, d: number, r: number, mat: THREE.Material) =>
  new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

interface Puff { m: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>; v: THREE.Vector3; life: number; dur: number; s0: number; s1: number; a: number }
interface Chunk { m: THREE.Mesh; v: THREE.Vector3; w: THREE.Vector3; r: number; life: number }

export interface ServerFrame { dt: number; t: number; camera: THREE.Camera; night: boolean }

export function createServerTower(scene: THREE.Scene, M: Palette, events: { onExplode: (x: number) => void }) {
  const root = new THREE.Group();
  scene.add(root);
  function setLayout(mobile: boolean) {
    const p = mobile ? MOBILE_STAGE.server : DESKTOP_POS;
    root.position.set(p.x, 0, p.z);
    root.rotation.y = p.ry;
    root.scale.setScalar(p.scale);
  }
  setLayout(false);

  /* 본체 — 달아오르면 붉어져야 해서 자기 재질을 따로 가짐 (매 프레임 테마 먹색을 받아옴) */
  const bodyMat = M.ink.clone();
  const tower = rbox(W, H, D, 0.16, bodyMat);
  tower.position.y = H / 2;
  tower.castShadow = tower.receiveShadow = true;
  root.add(tower);
  const leds: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < RACKS; i++) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: '#2f5bff' }));
    led.position.set(-0.35, 0.8 - i * 0.42, 0.56);
    tower.add(led);
    leds.push(led);
    const slot = rbox(0.6, 0.12, 0.05, 0.03, M.sand);
    slot.position.set(0.15, 0.8 - i * 0.42, 0.55);
    tower.add(slot);
  }

  /* 연기: 클레이 느낌 나게 동글동글한 덩어리가 커지면서 올라가다 사라짐 */
  const puffGeo = new THREE.SphereGeometry(1, 14, 12);
  const puffs: Puff[] = Array.from({ length: 44 }, () => {
    const m = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: '#9a9ea6', roughness: 1, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    scene.add(m);
    return { m, v: new THREE.Vector3(), life: 0, dur: 1, s0: 0.1, s1: 0.5, a: 0.7 };
  });
  const smokeLight = new THREE.Color(), smokeDark = new THREE.Color(), smokeCol = new THREE.Color();
  function puff(at: THREE.Vector3, v: THREE.Vector3, dur: number, s0: number, s1: number, a = 0.7) {
    const p = puffs.find((p) => p.life <= 0);
    if (!p) return;
    p.m.position.copy(at);
    p.v.copy(v);
    p.life = 1; p.dur = dur; p.s0 = s0; p.s1 = s1; p.a = a;
    p.m.material.color.copy(smokeCol);
    p.m.visible = true;
  }

  /* 폭발 파편 */
  const chunks: Chunk[] = [];
  const addChunk = (m: THREE.Mesh, r: number) => {
    m.castShadow = true;
    m.visible = false;
    scene.add(m);
    chunks.push({ m, v: new THREE.Vector3(), w: new THREE.Vector3(), r, life: 0 });
  };
  for (let i = 0; i < 11; i++) {
    const s = rand(0.26, 0.56);
    addChunk(rbox(s, s * rand(0.6, 1), s * rand(0.7, 1), s * 0.22, bodyMat), s * 0.4);
  }
  for (let i = 0; i < RACKS; i++) addChunk(rbox(0.6, 0.12, 0.05, 0.03, M.sand), 0.05);
  const ledRed = new THREE.MeshBasicMaterial({ color: '#ff4a3d' });
  for (let i = 0; i < RACKS; i++) addChunk(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), ledRed), 0.06);

  const flash = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 20), new THREE.MeshBasicMaterial({ color: '#fff1c2', transparent: true, opacity: 0, depthWrite: false }));
  flash.visible = false;
  scene.add(flash);

  /* 복구: 랙을 한 칸씩 떨어뜨려 쌓음 */
  const rackH = H / RACKS;
  const racks = Array.from({ length: RACKS }, (_, i) => {
    const m = rbox(W, rackH, D, 0.12, bodyMat);
    m.castShadow = m.receiveShadow = true;
    m.visible = false;
    root.add(m);
    return { m, y: 0, vy: 0, landed: false, sq: 0, sqV: 0, restY: rackH / 2 + i * rackH, startAt: i * 0.3 };
  });

  /* 상태 */
  let mode: 'alive' | 'gone' | 'building' = 'alive';
  let heat = 0;
  let wob = 0, wobV = 0;         // 흔들림
  let sq = 0, sqV = 0;           // 찌그러짐
  let emit = 0;                  // 연기 누적량
  let timer = 0;                 // gone / building 경과 시간
  let bootAt = -1;               // LED 부팅 시작 시각 (t)
  let shake = 0;                 // 카메라 흔들림 남은 세기
  const tmp = new THREE.Vector3(), tmpV = new THREE.Vector3();
  const topWorld = (out: THREE.Vector3) => root.localToWorld(out.set(rand(-0.4, 0.4), H + 0.05, rand(-0.3, 0.3)));

  function explode() {
    mode = 'gone';
    timer = 0;
    tower.visible = false;
    shake = 1;
    // 파편
    chunks.forEach((c) => {
      root.localToWorld(c.m.position.set(rand(-0.5, 0.5), rand(0.2, H), rand(-0.45, 0.45)));
      tmpV.set(c.m.position.x - root.position.x, 0, c.m.position.z - root.position.z).normalize().multiplyScalar(rand(1.5, 5));
      c.v.set(tmpV.x + rand(-1, 1), rand(4, 9), tmpV.z + rand(-1, 1.5));
      c.w.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
      c.m.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      c.m.scale.setScalar(1);
      c.life = rand(2.3, 2.9);
      c.m.visible = true;
    });
    // 섬광 + 연기 덩어리
    flash.position.set(root.position.x, H * 0.55 * root.scale.y, root.position.z);
    flash.scale.setScalar(0.4);
    flash.material.opacity = 0.95;
    flash.visible = true;
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(0.6, 2.6);
      tmp.set(root.position.x + Math.cos(a) * 0.3, rand(0.4, H) * root.scale.y, root.position.z + Math.sin(a) * 0.3);
      puff(tmp, tmpV.set(Math.cos(a) * sp, rand(0.8, 2.6), Math.sin(a) * sp), rand(1.4, 2.2), rand(0.25, 0.4), rand(0.7, 1.1), 0.62);
    }
    events.onExplode(root.position.x);
  }

  function startRebuild() {
    mode = 'building';
    timer = 0;
    racks.forEach((r) => {
      r.y = r.restY + 3.4;
      r.vy = 0; r.landed = false; r.sq = 0; r.sqV = 0;
      r.m.visible = false;
    });
  }

  function finishRebuild(t: number) {
    mode = 'alive';
    racks.forEach((r) => (r.m.visible = false));
    tower.visible = true;
    heat = 0; wob = 0; wobV = 0;
    sq = 0.14; sqV = 0;          // 통 하고 자리 잡음
    bootAt = t;
  }

  function hit() {
    if (mode !== 'alive') return;
    heat += 1;
    wobV += (Math.random() < 0.5 ? -1 : 1) * (2.2 + heat * 0.35);
    sqV -= 2.6;
    if (heat >= SMOKE_FROM) {
      for (let i = 0; i < 2; i++) puff(topWorld(tmp), tmpV.set(rand(-0.3, 0.3), rand(1, 1.6), rand(-0.2, 0.2)), rand(1.2, 1.8), 0.12, rand(0.35, 0.5));
    }
    if (heat >= EXPLODE_AT) explode();
  }

  /* 클릭 */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let camRef: THREE.Camera | null = null;
  const onDown = (e: PointerEvent) => {
    if (!camRef || mode !== 'alive' || e.button !== 0 || (e.target as Element).closest('a, button')) return;
    if (document.body.classList.contains('grabbing')) return; // 마스코트를 잡은 클릭
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camRef);
    if (ray.intersectObject(tower, true).length) hit();
  };
  const disposeInput = onWorldTap(onDown);

  return {
    setLayout,

    /** 폭발 직후 카메라 흔들림 (0~1) */
    get shake() {
      return shake;
    },

    update({ dt, t, camera, night }: ServerFrame) {
      camRef = camera;
      shake = Math.max(0, shake - dt * 3.2);
      const hot = THREE.MathUtils.clamp(heat / EXPLODE_AT, 0, 1);

      // 연기 색: 달아오를수록 짙게 (밤엔 어두운 배경에서 보이게 밝게)
      smokeLight.set(night ? '#b9bdc8' : '#aeb2ba');
      smokeDark.set(night ? '#7d818c' : '#4d5057');
      smokeCol.copy(smokeLight).lerp(smokeDark, hot);

      if (mode === 'alive') {
        heat = Math.max(0, heat - dt * 0.25);
        // 본체: 테마 먹색 → 달아오르면 붉게
        bodyMat.color.copy(M.ink.color).lerp(tmpColor.set('#c2362b'), hot * hot * 0.75);
        // 흔들림 스프링 + 과열되면 계속 덜덜
        wobV += (-wob * 90 - wobV * 6) * dt;
        wob += wobV * dt;
        const jitter = hot > 0.45 ? (hot - 0.45) * 0.05 : 0;
        sqV += (-sq * 200 - sqV * 11) * dt;
        sq += sqV * dt;
        const s = THREE.MathUtils.clamp(sq, -0.25, 0.25);
        tower.scale.set(1 - s * 0.4, 1 + s, 1 - s * 0.4);
        tower.position.set(Math.sin(t * 61) * jitter, (H / 2) * (1 + s), Math.cos(t * 53) * jitter);
        tower.rotation.z = THREE.MathUtils.clamp(wob * 0.06, -0.16, 0.16);
        // 연기
        if (heat >= SMOKE_FROM) {
          emit += (heat - SMOKE_FROM + 0.6) * 1.9 * dt;
          while (emit >= 1) {
            emit -= 1;
            puff(topWorld(tmp), tmpV.set(rand(-0.25, 0.35), rand(0.8, 1.3) + hot * 0.6, rand(-0.15, 0.15)), rand(1.5, 2.3), rand(0.1, 0.16), rand(0.3, 0.42) + hot * 0.35, 0.45 + hot * 0.4);
          }
        }
        // LED: 평소엔 파랗게 깜빡, 달아오른 만큼 위에서부터 빨갛게 (빠르게 깜빡)
        const redCount = Math.min(RACKS, Math.ceil(heat / 2));
        leds.forEach((l, i) => {
          const booting = bootAt >= 0 && t - bootAt < 0.9;
          if (booting) l.material.color.set(t - bootAt > 0.16 * (RACKS - 1 - i) ? '#2f5bff' : '#10142a');
          else if (i < redCount) l.material.color.set(Math.sin(t * (9 + hot * 14) + i) > 0 ? '#ff4a3d' : '#5a1512');
          else l.material.color.set(Math.sin(t * 3 + i * 1.7) > 0.3 ? '#2f5bff' : '#1b2a66');
        });
      } else if (mode === 'gone') {
        timer += dt;
        bodyMat.color.lerp(M.ink.color, 1 - Math.exp(-dt * 1.5)); // 파편이 식음
        if (timer > RESPAWN_DELAY) startRebuild();
      } else {
        // 랙이 한 칸씩 떨어져서 쌓임
        timer += dt;
        bodyMat.color.copy(M.ink.color);
        let allLanded = true;
        racks.forEach((r) => {
          if (timer < r.startAt) { allLanded = false; return; }
          r.m.visible = true;
          if (!r.landed) {
            r.vy -= 30 * dt;
            r.y += r.vy * dt;
            if (r.y <= r.restY) {
              r.y = r.restY;
              r.landed = true;
              r.sqV = r.vy * 0.5;      // 쿵 → 찌그러졌다 펴짐
              root.localToWorld(tmp.set(rand(-0.5, 0.5), r.restY - rackH / 2, 0.5));
              puff(tmp, tmpV.set(rand(-0.6, 0.6), 0.3, 0.5), 0.7, 0.08, 0.26, 0.4);
            } else allLanded = false;
          }
          r.sqV += (-r.sq * 260 - r.sqV * 14) * dt;
          r.sq += r.sqV * dt;
          const s = THREE.MathUtils.clamp(r.sq, -0.3, 0.3);
          r.m.scale.set(1 - s * 0.35, 1 + s, 1 - s * 0.35);
          r.m.position.y = r.y + (rackH / 2) * s;
        });
        if (allLanded && timer > racks[RACKS - 1].startAt + 0.75) finishRebuild(t);
      }

      // 연기 입자
      puffs.forEach((p) => {
        if (p.life <= 0) return;
        p.life -= dt / p.dur;
        if (p.life <= 0) { p.m.visible = false; return; }
        const k = 1 - p.life;
        p.v.multiplyScalar(1 - dt * 0.9);
        p.v.y += 0.5 * dt;
        p.m.position.addScaledVector(p.v, dt);
        p.m.scale.setScalar(p.s0 + (p.s1 - p.s0) * (1 - (1 - k) * (1 - k)));
        p.m.material.opacity = Math.min(1, k * 7) * p.life * p.a;
      });

      // 파편
      chunks.forEach((c) => {
        if (c.life <= 0) return;
        c.life -= dt;
        c.v.y -= 20 * dt;
        c.m.position.addScaledVector(c.v, dt);
        if (c.m.position.y < c.r) {
          c.m.position.y = c.r;
          c.v.y = Math.abs(c.v.y) * 0.36;
          c.v.x *= 0.62; c.v.z *= 0.62;
          c.w.multiplyScalar(0.5);
        }
        c.m.rotation.x += c.w.x * dt; c.m.rotation.y += c.w.y * dt; c.m.rotation.z += c.w.z * dt;
        if (c.life < 0.35) c.m.scale.setScalar(Math.max(0.001, c.life / 0.35));
        if (c.life <= 0) c.m.visible = false;
      });

      // 섬광
      if (flash.visible) {
        flash.scale.addScalar(dt * 13);
        flash.material.opacity -= dt * 4.2;
        if (flash.material.opacity <= 0) flash.visible = false;
      }
    },

    dispose() {
      disposeInput();
    },
  };
}

const tmpColor = new THREE.Color();
