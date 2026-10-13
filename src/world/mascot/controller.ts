import * as THREE from 'three';
import { pointer } from '@/lib/pointer';
import { R, buildMascotBody, type MascotBody } from './body';
import { createNightcap } from './nightcap';
import { createSweat } from './sweat';

const TAU = Math.PI * 2;
const BLUE = new THREE.Color('#2f5bff');
const RED = new THREE.Color('#ff4a3d');
const clamp = THREE.MathUtils.clamp;
const SHOCK_SEC = 1.5;

interface Grab { t0: number; x0: number; y0: number; moved: boolean; bx: number }

export interface MascotFrame {
  dt: number;
  /** 누적 시간 (초) */
  t: number;
  /** performance.now() */
  now: number;
  camera: THREE.PerspectiveCamera;
  /** 스크롤 위치로 정해진 목표 x */
  targetX: number;
  night: boolean;
  reduce: boolean;
}

/**
 * 마스코트 행동 전부:
 * 스크롤 따라 굴러가기 · 멈추면 다시 똑바로 서기 · 클릭 점프 · 꾹 잡아당기면 슬라임처럼 늘어나기 ·
 * 빨리 굴리면 지쳐서 빨개지고 헥헥 · 밤엔 모자 쓰고 가만 두면 잠들기 · 눈은 커서 따라가기
 */
export class MascotController {
  private readonly m: MascotBody;
  private readonly cap: ReturnType<typeof createNightcap>;
  private readonly sweat: ReturnType<typeof createSweat>;
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly mv = new THREE.Vector3();
  private camera: THREE.PerspectiveCamera | null = null;
  private grab: Grab | null = null;
  /** 쿵 하고 착지했을 때 (세기, x 위치) */
  onLand: ((strength: number, x: number) => void) | null = null;

  get grabbing() {
    return this.grab !== null;
  }

  private readonly st = {
    x: 0, vx: 0, y: 0, vy: 0,
    squash: 0, squashV: 0,
    sproutA: 0, sproutV: 0,
    blinkAt: performance.now() + 2000, blink: 0,
    roll: 0, lastMove: performance.now(), righting: false,
    flip: 0, dizzy: 0,
    s: 0, sV: 0, ang: 0, q: 0, qV: 0, // 슬라임 늘어남 / 눌림
    tired: 0, fatigue: 0, sleep: 0,
    shock: 0, shockDir: 1, // 깜짝 놀람 남은 시간(초) / 놀란 쪽 방향
  };

  constructor(
    scene: THREE.Scene,
    startX: number,
    private readonly bubbles: { pant: HTMLElement; zzz: HTMLElement },
    beforeCap: () => void,
  ) {
    this.m = buildMascotBody(scene);
    beforeCap(); // 구름 · 별이 모자보다 먼저 씬에 들어가도록 (시안과 같은 순서)
    this.cap = createNightcap(scene, this.m.body);
    this.sweat = createSweat(scene);
    this.st.x = startX;
    addEventListener('pointerdown', this.onDown);
    addEventListener('pointermove', this.onMove);
    addEventListener('pointerup', this.onUp);
    addEventListener('pointercancel', this.onUp);
    addEventListener('blur', this.onUp);
    addEventListener('touchstart', this.onTouchStart, { passive: false });
  }

  dispose() {
    removeEventListener('pointerdown', this.onDown);
    removeEventListener('pointermove', this.onMove);
    removeEventListener('pointerup', this.onUp);
    removeEventListener('pointercancel', this.onUp);
    removeEventListener('blur', this.onUp);
    removeEventListener('touchstart', this.onTouchStart);
  }

  /** 깜짝 놀람: 폴짝 뛰고, 눈 동그랗게 뜨고 그쪽을 쳐다보며 덜덜 (자고 있었으면 깸) */
  startle(fromX: number) {
    const st = this.st;
    st.shock = SHOCK_SEC;
    st.shockDir = fromX >= st.x ? 1 : -1;
    st.blink = 0;
    if (st.y > 0.05 || this.grab) return;
    st.vy = 6.4;
    st.squashV -= 5;
  }

  /** 굴러가는 과정 없이 바로 그 자리에 세움 (모바일에서 무대가 바뀔 때) */
  teleport(x: number) {
    const st = this.st;
    st.x = x;
    st.vx = 0;
    st.roll = 0;
    st.righting = false;
    st.fatigue = 0;
  }

  /* ---------- input ---------- */

  private hit(cx: number, cy: number) {
    if (!this.camera) return false;
    this.ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    return this.ray.intersectObject(this.m.root, true).length > 0;
  }

  private poke() {
    const st = this.st;
    if (st.y > 0.05) return;
    st.vy = 7.5;
    st.squashV -= 6;
    st.flip = TAU;
    st.dizzy = 1.4;
  }

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('a, button')) return;
    if (!this.hit(e.clientX, e.clientY)) return;
    this.grab = { t0: performance.now(), x0: e.clientX, y0: e.clientY, moved: false, bx: this.st.x };
    document.body.classList.add('grabbing');
    e.preventDefault();
  };

  /** 터치: 마스코트를 잡은 터치면 스크롤 대신 당기기가 되게 */
  private onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t || (e.target as Element).closest('a, button')) return;
    if (this.hit(t.clientX, t.clientY)) e.preventDefault();
  };

  private onMove = (e: PointerEvent) => {
    const g = this.grab;
    if (g && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 6) g.moved = true;
  };

  private onUp = () => this.release();

  private release(slipped = false) {
    const g = this.grab, st = this.st;
    if (!g) return;
    const quick = !slipped && performance.now() - g.t0 < 260 && !g.moved;
    if (quick) this.poke();
    else {
      // 놓으면 탄성으로 튕겨 돌아감 (sV/qV 가 출렁임을 이어감)
      if (st.s > 0.05) {
        st.sV = -st.s * 10;
        const up = Math.cos(st.ang);
        if (up > 0.35) st.vy = st.s * 6 * up; // 위로 당겼다 놓으면 바닥에서 튀어오름
      }
      if (st.q > 0.05) {
        st.qV = -st.q * 12;
        st.vy = Math.max(st.vy, st.q * 9); // 눌렀다 놓으면 통 튐
      }
      if (slipped) st.dizzy = 0.9;
    }
    this.grab = null;
    document.body.classList.remove('grabbing');
  }

  /* ---------- per frame ---------- */

  update(f: MascotFrame) {
    const { dt, t, now, camera, night, reduce } = f;
    const { st, m, mv, grab } = this;
    this.camera = camera;

    // 공 중심의 화면 좌표
    mv.set(st.x, R + st.y, 0.6).project(camera);
    const sx = ((mv.x + 1) / 2) * innerWidth, sy = ((1 - mv.y) / 2) * innerHeight;

    // 스크롤 목표로 가는 스프링 (잡혀 있으면 제자리)
    const k = 26, damp = 7.5;
    const tx = grab ? grab.bx + clamp((pointer.x - grab.x0) * 0.0015, -0.25, 0.25) : f.targetX;
    const ax = (tx - st.x) * k - st.vx * damp;
    st.vx += ax * dt;
    const dx = st.vx * dt;
    st.x += dx;

    // 몸 전체가 구름
    if (Math.abs(st.vx) > 0.3) {
      st.lastMove = now;
      st.righting = false;
    }
    st.roll -= dx / R;

    // 몇 초 가만있으면 폴짝 뛰면서 똑바로 섬
    const nearest = Math.round(st.roll / TAU) * TAU;
    const off = st.roll - nearest;
    if (!st.righting && !grab && now - st.lastMove > 2400 && Math.abs(off) > 0.08 && st.y === 0) {
      st.righting = true;
      if (Math.abs(off) > 0.5) {
        st.vy = 4.2;
        st.squashV -= 3;
      }
    }
    if (st.righting) {
      st.roll += (nearest - st.roll) * (1 - Math.exp(-dt * 7));
      if (Math.abs(st.roll - nearest) < 0.005) {
        st.roll = nearest;
        st.righting = false;
      }
    }
    m.body.rotation.z = st.roll;

    // 클릭하면 앞으로 한 바퀴
    if (st.flip > 0) {
      const d = Math.min(st.flip, dt * 11);
      st.flip -= d;
      m.body.rotation.x += d;
    } else m.body.rotation.x = 0;

    // 중력
    st.vy -= 22 * dt;
    st.y += st.vy * dt;
    if (st.y < 0) {
      if (st.vy < -3) {
        st.squashV += st.vy * 0.9;
        this.onLand?.(-st.vy, st.x);
      }
      st.y = 0;
      st.vy = 0;
    }

    // 포인터가 한동안 가만있으면 혼자 폴짝
    if (!reduce && !night && !grab && now - pointer.moved > 6000 && st.y === 0 && st.tired < 0.2 && Math.sin(t * 1.3) > 0.995) st.vy = 3.2;

    // 착지 / 속도에 따른 찌그러짐
    const sq = -st.squash * 180 - st.squashV * 11;
    st.squashV += sq * dt;
    st.squash += st.squashV * dt;
    const speed = Math.min(Math.abs(st.vx) * 0.03, 0.12);
    const s = clamp(st.squash, -0.35, 0.35);
    m.root.scale.set(1 - s * 0.5 + speed, 1 + s - speed * 0.6, 1 - s * 0.5);
    m.root.position.set(st.x, st.y, 0.6);
    m.root.rotation.z = clamp(-st.vx * 0.04, -0.25, 0.25);

    // 깜짝 놀람 (0→1 세기, 끝날 때 스르륵 풀림)
    st.shock = Math.max(0, st.shock - dt);
    const shock = Math.min(1, st.shock / 0.35);
    if (shock > 0 && st.y === 0) m.root.position.x += Math.sin(t * 74) * 0.022 * shock; // 덜덜

    // 슬라임 당기기 — 커서 위치가 아니라 "잡은 곳에서 얼마나 끌었나" 기준
    mv.set(st.x + R, R + st.y, 0.6).project(camera);
    const pxPerUnit = Math.max(1, Math.abs(((mv.x + 1) / 2) * innerWidth - sx) / R);
    let ext = 0, pressTarget = 0;
    if (grab) {
      let ddx = pointer.x - grab.x0, ddy = -(pointer.y - grab.y0); // +y = 위
      const raw = Math.hypot(ddx, ddy);
      const DEAD = 8; // 이만큼은 그냥 쥐고만 있음
      if (raw > DEAD) {
        const kk = (raw - DEAD) / raw;
        ddx *= kk;
        ddy *= kk;
        // 아래로 당기면 땅을 뚫는 대신 납작하게 눌림
        const down = Math.max(0, -ddy) / pxPerUnit;
        pressTarget = 0.32 * (1 - Math.exp(-down / (R * 0.9)));
        const upY = Math.max(0, ddy);
        const pull = Math.hypot(ddx, upY) / pxPerUnit;
        // 처음엔 쉽게, 멀수록 버팀
        const MAX = R * 1.5;
        ext = MAX * (1 - Math.exp(-pull / MAX));
        if (pull > 0.02) {
          const a = Math.atan2(ddx, upY); // 0 = 바로 위
          let diff = a - st.ang;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          st.ang += diff * 0.25;
        }
        // 너무 멀리 당기면 손에서 미끄러짐
        if (pull > MAX * 2.6) this.release(true);
      }
    }
    const grabbing = this.grab !== null; // 이번 프레임에 미끄러져 놓쳤을 수 있어서 다시 읽음
    const sTarget = ext / (2 * R);
    st.sV += ((sTarget - st.s) * 150 - st.sV * (grabbing ? 18 : 4.2)) * dt;
    st.s = Math.max(-0.3, st.s + st.sV * dt);
    st.qV += ((pressTarget - st.q) * 150 - st.qV * (grabbing ? 18 : 5)) * dt;
    st.q = clamp(st.q + st.qV * dt, -0.2, 0.4);

    const sc = 1 + st.s, side = 1 / Math.sqrt(Math.max(sc, 0.4));
    m.stretchPivot.rotation.z = -st.ang;
    m.unrot.rotation.z = st.ang;
    m.stretchScale.scale.set(side, sc, side);
    // 반대쪽은 바닥에 붙어 있고 잡은 쪽이 늘어남
    const offX = Math.sin(st.ang) * R * st.s;
    let offY = Math.cos(st.ang) * R * st.s;
    // 늘어난 타원의 가장 낮은 점이 땅 밑으로 안 가게
    const cA = Math.cos(st.ang), sA = Math.sin(st.ang);
    const halfY = Math.sqrt((R * sc * cA) ** 2 + (R * side * sA) ** 2);
    offY = Math.max(offY, halfY - R);
    m.stretchPivot.position.set(offX, offY, 0);
    // 눌림 (피벗이 땅이라 가라앉지 않고 옆으로 퍼짐)
    const q = st.q;
    m.root.scale.set(m.root.scale.x * (1 + q * 0.6), m.root.scale.y * (1 - q), m.root.scale.z * (1 + q * 0.6));

    // 너무 빨리 구르면 지침 → 빨개지고 헥헥. 피로 누적을 절반으로 줄여 약 두 배 오래 움직인다.
    const over = Math.max(0, Math.abs(st.vx) - 5);
    st.fatigue = Math.min(3, st.fatigue + over * dt * 0.225);
    if (over === 0) st.fatigue = Math.max(0, st.fatigue - dt * 0.28);
    const tiredTarget = clamp((st.fatigue - 0.8) / 0.9, 0, 1);
    st.tired += (tiredTarget - st.tired) * (1 - Math.exp(-dt * (tiredTarget > st.tired ? 6 : 1.5)));
    m.bodyMat.color.copy(BLUE).lerp(RED, Math.min(1, st.tired * 1.15));
    m.blushMat.opacity = 0.5 + st.tired * 0.45;
    m.blushes.forEach((b) => b.scale.set(1.5 + st.tired * 0.8, 1 + st.tired * 0.5, 1));
    const panting = st.tired > 0.35;
    const breath = panting ? Math.sin(t * 17) : 0;

    // 밤: 몇 초 가만두면 잠듦, 아무 입력이나 오면 깜짝 놀라 깸
    const calm = night && !grabbing && st.y === 0 && Math.abs(st.vx) < 0.2 && !st.righting && st.tired < 0.2 && st.flip <= 0;
    const sleepy = calm && now - pointer.moved > 3500 && now - st.lastMove > 3500;
    if (sleepy) st.sleep = Math.min(1, st.sleep + dt * 0.45);
    else {
      if (st.sleep > 0.7) {
        st.vy = 3.4;
        st.squashV -= 3;
        st.blink = 1;
      }
      st.sleep = Math.max(0, st.sleep - dt * 6);
    }
    const zz = st.sleep > 0.6 ? Math.sin(t * 1.8) : 0;
    m.center.scale.set(1 - breath * 0.025 - zz * 0.012, 1 + breath * 0.045 + zz * 0.03, 1 - breath * 0.025 - zz * 0.012);
    m.root.rotation.z += st.sleep * 0.14; // 고개가 옆으로 기움
    const { pant, zzz } = this.bubbles;
    zzz.style.opacity = String(Math.max(0, (st.sleep - 0.6) * 2.5));
    zzz.style.transform = `translate(${sx + 40}px, ${sy - 110}px)`;

    // 수면모자
    m.sprout.visible = this.cap.update({ dt, night, root: m.root, body: m.body, sc, side, ang: st.ang, ax, roll: st.roll });

    // 땀
    this.sweat.update(dt, now, panting, st.x, st.y);

    // 입 + 헥헥 말풍선
    const mouthOpen = shock > 0.3 || panting || (grabbing && (st.s > 0.08 || st.q > 0.08)) || (st.y > 0.4 && st.sleep < 0.1) || st.sleep > 0.6;
    m.smile.visible = !mouthOpen;
    m.open.visible = mouthOpen;
    m.open.scale.setScalar(1);
    if (shock > 0.3) m.open.scale.set(0.75, 1.15, 1);
    else if (panting) m.open.scale.set(1, 0.8 + Math.abs(breath) * 0.5, 1);
    else if (st.sleep > 0.6) m.open.scale.set(0.45, 0.4 + (zz + 1) * 0.12, 1);
    m.tongue.visible = panting && shock <= 0.3;
    // 머리 옆 말풍선: 놀라면 "!?", 지치면 "헥헥"
    if (shock > 0) {
      pant.style.opacity = String(shock);
      pant.style.fontSize = '28px';
      pant.style.transform = `translate(${sx + 40}px, ${sy - 104}px)`;
      pant.textContent = '!?';
    } else {
      pant.style.opacity = String(panting ? Math.min(1, (st.tired - 0.35) * 3) : 0);
      pant.style.fontSize = '';
      pant.style.transform = `translate(${sx + 44}px, ${sy - 90 - Math.abs(breath) * 4}px)`;
      pant.textContent = Math.sin(t * 8.5) > 0 ? '헥' : '헥헥';
    }

    // 나뭇잎 흔들림
    st.sproutV += (-st.sproutA * 60 - st.sproutV * 4 - ax * 0.004 + st.vy * 0.002) * dt * 10;
    st.sproutA += st.sproutV * dt;
    m.sprout.rotation.z = clamp(st.sproutA, -0.9, 0.9);

    // 커서 쳐다보기 — 굴러서 돌아간 몸 기준으로 변환
    let lx = (pointer.x - sx) / 260, ly = (pointer.y - sy) / 260;
    const len = Math.hypot(lx, ly);
    if (len > 1) {
      lx /= len;
      ly /= len;
    }
    if (st.dizzy > 0) {
      st.dizzy -= dt;
      lx = Math.cos(t * 18) * 0.9;
      ly = Math.sin(t * 18) * 0.9;
    }
    if (st.tired > 0.5) ly = Math.max(ly, 0.5); // 지쳐서 위를 못 봄
    if (shock > 0) {
      // 터진 쪽을 쳐다봄
      lx += (st.shockDir * 0.95 - lx) * shock;
      ly += (-0.25 - ly) * shock;
    }
    lx *= 1 - st.sleep;
    ly = ly * (1 - st.sleep) + st.sleep * 0.6;
    const c = Math.cos(-st.roll), sn = Math.sin(-st.roll);
    const lxl = lx * c - -ly * sn, lyl = lx * sn + -ly * c;
    const upright = Math.pow(Math.max(0, Math.cos(off)), 3);
    m.face.rotation.y += (lx * 0.35 * upright - m.face.rotation.y) * 0.12;
    m.face.rotation.x += (ly * 0.2 * upright - m.face.rotation.x) * 0.12;
    const pupilK = 1 - 0.42 * shock; // 놀라면 눈동자가 콩알만 해짐
    m.eyes.forEach((e) => {
      e.pupil.position.x += (lxl * e.size * 0.42 - e.pupil.position.x) * 0.25;
      e.pupil.position.y += (lyl * e.size * 0.38 - e.pupil.position.y) * 0.25;
      e.pupil.scale.set(pupilK, pupilK, 0.1);
    });

    // 눈꺼풀: 깜빡임 / 잡히면 질끈 / 지치면 처짐 / 자면 감김
    if (now > st.blinkAt) {
      st.blink = 1;
      st.blinkAt = now + 1800 + Math.random() * 3200;
    }
    st.blink = Math.max(0, st.blink - dt * 7);
    let lid = 1 - Math.sin(st.blink * Math.PI) * 0.9;
    if (grabbing && (st.s > 0.08 || st.q > 0.08)) lid = Math.min(lid, 0.28);
    lid = Math.min(lid, 1 - st.tired * 0.45, 1 - st.sleep * 0.93);
    if (shock > 0) lid = lid + (1.22 - lid) * shock; // 눈 동그랗게
    m.eyes.forEach((e) => (e.lid.scale.y = lid));
  }
}
