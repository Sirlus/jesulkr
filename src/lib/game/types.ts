// ============================================================
// Jesulkr v1.3 — Core Type Definitions
// ============================================================

/** 게임 화면 상태 */
export type GameState = 'design' | 'ready' | 'battle' | 'paused' | 'gameover';

/** 기록 모드 */
export type RunMode = 'assist' | 'pure';

/** 지원 언어 */
export type Language = 'ko' | 'en';

/** 부품 타입 */
export type ComponentType =
  | 'red' | 'blueGen' | 'wire'
  | 'circle' | 'oval' | 'kernel'
  | 'mixed2' | 'mixedCore'
  | 'eraser';

/** 설계도 위 부품 하나 */
export interface Component {
  id: number;
  type: ComponentType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

/** 맵 정보 */
export interface MapDef {
  id: number;
  shortName: string;
  name: string;
  desc: string;
  minHp: number;
  maxHp: number;
  repeatingBoss?: boolean;
  firstBossAt?: number;
  bossHp?: number;
  bossInterval?: number;
  bossIntervalDecay?: number;
}

/** 저장/불러오기용 술식 데이터 */
export interface SpellData {
  id: string;
  name: string;
  width: number;
  height: number;
  components: Component[];
  castTime: number;
  manaCost: number;
  damage: number;
  aoeDamage: number;
  breakdown: string[];
}

/** 술식 통계 (편집 시 실시간 계산) */
export interface SpellStats {
  castTime: number;
  seconds: number;
  manaCost: number;
  redCount: number;
  activeBlueCount: number;
  inactiveBlueCount: number;
  damage: number;
  aoeDamage: number;
  breakdown: string[];
  valid: boolean;
}

/** 몬스터 */
export interface Monster {
  id: number;
  lane: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  boss: boolean;
  reached?: boolean;
}

/** 발사체 (날아가는 술식) */
export interface CastProjectile {
  id: number;
  spell: SpellData;
  targetId: number;
  slotIndex: number;
  remainingTicks: number;
  totalTicks: number;
  done?: boolean;
}

/** 시각 효과 */
export interface VisualEffect {
  type: 'hit' | 'kill' | 'aoe' | 'base';
  x: number;
  y: number;
  t: number;
  life: number;
  text: string;
}

/** 전투 상태 (진행 중인 런) */
export interface BattleState {
  score: number;
  mana: number;
  baseHp: number;
  survival: number;
  monsters: Monster[];
  casts: CastProjectile[];
  effects: VisualEffect[];
  cooldowns: number[];
  selectedTargetId: number | null;
  spawnTimer: number;
  nextMonsterId: number;
  nextCastId: number;
  accumulator: number;
  lastTime: number;
  battleStarted: boolean;
  battleSpeed: number;
  activeRunMapId: number | null;
  activeRunMode: string | null;
  nextBossAt: number;
  bossInterval: number;
}

/** 맵 기록 */
export interface MapRecord {
  score: number;
  time: number;
}

/** 맵 기록 컬렉션 */
export interface Records {
  assist: Record<string, MapRecord>;
  pure: Record<string, MapRecord>;
}

/** 키 바인딩 하나 */
export interface KeyBinding {
  code: string;
  key: string;
  label: string;
}

/** 조작 액션 정의 */
export interface ControlAction {
  id: string;
  name: string;
  desc: string;
  def: KeyBinding;
}

/** 키 설정 타겟 */
export type KeyTarget =
  | { type: 'slot'; index: number }
  | { type: 'control'; id: string };

/** 도선 네트워크 그래프 */
export interface ConnectionGraph {
  groups: WireGroup[];
  compGroups: Map<number, Set<number>>;
}

export interface WireGroup {
  ids: Set<number>;
  cells: Set<string>;
  components: Set<number>;
}

/** 도구 설명 */
export interface ToolDescriptor {
  name: string;
  text: string;
  formula: string;
}
