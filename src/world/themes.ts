import * as THREE from 'three';
import type { ThemeName } from '@/lib/theme';
import type { Palette } from './materials';

interface ThemeSpec {
  bg: string; ground: string; cream: string; sand: string; ink: string; name: string;
  /** 반구광 하늘/땅 색 */
  sky: string; grd: string;
  sun: string;
  hI: number; sI: number; env: number;
}

const THEMES: Record<ThemeName, ThemeSpec> = {
  day:   { bg: '#f3f4f6', ground: '#e4e6e9', cream: '#f5f6f8', sand: '#c8ccd3', ink: '#26282d', name: '#23252b', sky: '#ffffff', grd: '#b9bec6', sun: '#ffffff', hI: 1.1, sI: 2.2, env: 0.55 },
  night: { bg: '#15161a', ground: '#1e1f24', cream: '#4a4d56', sand: '#2e3037', ink: '#0d0e10', name: '#dcdfe6', sky: '#b4bde6', grd: '#0a0b0d', sun: '#c9d3ff', hI: 0.45, sI: 1.6, env: 0.2 },
};

const COLOR_KEYS = ['bg', 'ground', 'cream', 'sand', 'ink', 'name', 'sky', 'grd', 'sun'] as const;
const NUM_KEYS = ['hI', 'sI', 'env'] as const;
type ColorKey = (typeof COLOR_KEYS)[number];
type NumKey = (typeof NUM_KEYS)[number];

interface Targets {
  scene: THREE.Scene;
  ground: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  palette: Palette;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
}

/** 낮 ↔ 밤 전환 시 씬의 색·조명을 부드럽게 섞는다 */
export class ThemeBlender {
  private cur = {} as Record<ColorKey, THREE.Color> & Record<NumKey, number>;
  private tgt = {} as Record<ColorKey, THREE.Color> & Record<NumKey, number>;
  night = false;

  constructor(private readonly t: Targets) {}

  set(name: ThemeName, instant: boolean) {
    this.night = name === 'night';
    const spec = THEMES[name];
    COLOR_KEYS.forEach((k) => {
      this.tgt[k] = new THREE.Color(spec[k]);
      if (instant || !this.cur[k]) this.cur[k] = this.tgt[k].clone();
    });
    NUM_KEYS.forEach((k) => {
      this.tgt[k] = spec[k];
      if (instant || this.cur[k] == null) this.cur[k] = spec[k];
    });
  }

  step(dt: number) {
    const { cur, tgt } = this;
    const a = 1 - Math.exp(-dt * 4);
    COLOR_KEYS.forEach((k) => cur[k].lerp(tgt[k], a));
    NUM_KEYS.forEach((k) => (cur[k] += (tgt[k] - cur[k]) * a));

    const { scene, ground, palette, hemi, sun } = this.t;
    (scene.background as THREE.Color).copy(cur.bg);
    ground.material.color.copy(cur.ground);
    palette.cream.color.copy(cur.cream);
    palette.sand.color.copy(cur.sand);
    palette.ink.color.copy(cur.ink);
    palette.name.color.copy(cur.name);
    hemi.color.copy(cur.sky);
    hemi.groundColor.copy(cur.grd);
    hemi.intensity = cur.hI;
    sun.color.copy(cur.sun);
    sun.intensity = cur.sI;
    scene.environmentIntensity = cur.env;
  }
}
