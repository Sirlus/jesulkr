// ============================================================
// Jesulkr v1.3 — Constants & Configuration
// ============================================================
import type { MapDef, ControlAction, ToolDescriptor, ComponentType } from './types';
import { ALL_DEFS, ORDERED_TYPES, getDef } from './designer/components/registry';

// ── Storage Keys ──────────────────────────────────────────────
export const STORAGE_KEY_SLOTS = 'magic_design_game_slots_v2';
export const STORAGE_KEY_SLOTS_LEGACY = 'magic_design_game_slots_v1';
export const STORAGE_KEY_DECKS = 'magic_design_game_decks_v1';
export const STORAGE_KEY_DECK_NAMES = 'magic_design_game_deck_names_v1';
export const STORAGE_KEY_KEY_BINDINGS = 'magic_design_game_key_bindings_v1';
export const STORAGE_KEY_CONTROL_BINDINGS = 'magic_design_game_control_bindings_v1';
export const STORAGE_KEY_SLOT_AUTO = 'magic_design_game_slot_auto_modes_v1';
export const STORAGE_KEY_AUTO_MANA_RESERVE = 'magic_design_game_auto_mana_reserve_v1';
export const STORAGE_KEY_MANA_BONUS = 'magic_design_game_mana_bonus_enabled_v1';
export const STORAGE_KEY_TUTORIAL_SEEN = 'jesulkr_tutorial_seen_v2';
export const STORAGE_KEY_LANGUAGE = 'jesulkr_language_v1';
export const STORAGE_KEY_RUN_MODE = 'magic_design_game_selected_run_mode_v1';
export const STORAGE_KEY_RECORDS = 'magic_design_game_map_records_v3';
export const STORAGE_KEY_RECORDS_LEGACY = 'magic_design_game_map_records_v2';
export const STORAGE_KEY_UNLOCKS = 'magic_design_game_map_unlocks_star_v2';
export const STORAGE_KEY_RECORDS_OLD = 'magic_design_game_map_records_v1';
export const STORAGE_KEY_UNLOCKS_LEGACY = 'magic_design_game_map_unlocks_v1';

// ── v2 Green/Stability Constants ──────────────────────────────
/** 프로토타입: 모든 도구 강제 해금 */
export const PROTOTYPE_UNLOCK_ALL_TOOLS = false;

/** 녹색 마나 관련 */
export const GREEN_MANA = {
  /** greenMana가 mixed2 접촉 시 추가로 소모하는 마나 */
  COST_PER_ACTIVE: 2,
  /** 활성화 시 제공하는 초록 마나 */
  MANA_PROVIDED: 1,
} as const;

/** 안정도 관련 */
export const STABILITY = {
  /** 안정기 1개가 제공하는 안정도 */
  PER_STABILIZER: 1,
  /** 안정기 영향 범위 (쉐비셰프 거리) */
  RANGE: 1,
  /** 안정기 활성에 필요한 파란 마나 연결 수 */
  BLUE_REQUIRED: 1,
} as const;

/** 중형 허브 관련 */
export const MEDIUM_HUB = {
  /** 활성에 필요한 안정도 */
  STABILITY_REQUIRED: 1,
} as const;

/** 중형 도선 관련 */
export const MEDIUM_WIRE = {
  /** 전달되는 색상 */
  COLORS: ['red', 'blue', 'green'] as const,
} as const;

/** 소형 도선 관련 */
export const SMALL_WIRE = {
  /** 전달되는 색상 (초록 제외) */
  COLORS: ['red', 'blue'] as const,
} as const;

/** 추출기 관련 */
export const EXTRACTOR = {
  /** 색상 순환 순서 */
  COLOR_CYCLE: ['red', 'blue', 'green'] as const,
  /** 회전 → 출력 방향 (우/하/좌/상) */
  DIRECTION_MAP: [
    { dx: 1, dy: 0 }, // 0: 우
    { dx: 0, dy: 1 }, // 1: 하
    { dx: -1, dy: 0 }, // 2: 좌
    { dx: 0, dy: -1 }, // 3: 상
  ] as const,
} as const;

// ── Game Balance ──────────────────────────────────────────────
export const TICK_SEC = 1 / 20;
export const HIT_DELAY_TICKS = 4;
export const CORE_AOE_TARGET_LIMIT = 3;
export const MAX_MANA = 20;
export const BASE_MANA_REGEN = 6;
export const STAR_MANA_REGEN = 10;
export const LANES = 5;
export const CELL = 58;
export const GAP = 4;
export const MAX_FRAME = 11;
export const MANA_BONUS_STAR_COUNT = 5;
export const MAX_SPELL_NAME_LENGTH = 18;
export const TOAST_DURATION_MS = 1400;
export const UNLOCK_ALL_MAPS_CODE = '1111';
export const SPAWN_TIMER_BATTLE_START = 10;
export const SPAWN_TIMER_DEFAULT = 12;

// ── Star Thresholds ───────────────────────────────────────────
export const STAR_THRESHOLDS: Record<number, number[]> = {
  1: [15000, 20000, 25000],
  2: [55000, 65000, 75000],
  3: [60000, 70000, 80000],
};

// ── Maps ──────────────────────────────────────────────────────
export const MAPS: (MapDef | null)[] = [
  null,
  {
    id: 1,
    shortName: '맵 1',
    name: '맵 1: 기본 침공',
    desc: '몬스터 HP가 1~20 사이로 등장합니다. 별 조건: 15,000 / 20,000 / 25,000점.',
    minHp: 1,
    maxHp: 20,
  },
  {
    id: 2,
    shortName: '맵 2',
    name: '맵 2: 강화 침공',
    desc: '몬스터 HP가 1~50 사이로 등장합니다. 별 조건: 55,000 / 65,000 / 75,000점. 파란 마나 생성기, 도선, 2칸 혼합 회로가 해금됩니다.',
    minHp: 1,
    maxHp: 50,
  },
  {
    id: 3,
    shortName: '맵 3',
    name: '맵 3: 반복 보스',
    desc: 'HP 1~20 몬스터와 HP 500 보스가 반복 등장합니다. 별 조건: 60,000 / 70,000 / 80,000점. 9칸 혼합 핵이 해금됩니다.',
    minHp: 1,
    maxHp: 20,
    repeatingBoss: true,
    firstBossAt: 30,
    bossHp: 500,
    bossInterval: 30,
    bossIntervalDecay: 0.84,
  },
];

// ── Tools ─────────────────────────────────────────────────────
// 부품 정의는 designer/components/ 의 레지스트리에서 파생됩니다.
export const TOOL_DESCRIPTIONS: Record<string, ToolDescriptor> = Object.fromEntries(
  ALL_DEFS.map(d => [d.type, { name: d.name, text: d.text, formula: d.formula }]),
);

export const TOOL_ORDER: ComponentType[] = ORDERED_TYPES as ComponentType[];

// ── Control Actions ───────────────────────────────────────────
export const CONTROL_ACTIONS: ControlAction[] = [
  { id: 'toggleDesign', name: '설계 열기/닫기', desc: '전투 화면과 설계 화면을 전환', def: { code: 'KeyD', key: 'd', label: 'D' } },
  { id: 'pause', name: '일시정지', desc: '전투 중 정지/재개', def: { code: 'Space', key: ' ', label: 'SPC' } },
  { id: 'restart', name: '전투 재시작', desc: '현재 선택된 맵으로 바로 재시작', def: { code: 'KeyR', key: 'r', label: 'R' } },
  { id: 'mapSelect', name: '맵 선택', desc: '맵 선택창 열기', def: { code: 'KeyM', key: 'm', label: 'M' } },
  { id: 'speed1', name: '전투 속도 1x', desc: '전투 배속을 1배로 변경', def: { code: 'KeyZ', key: 'z', label: 'Z' } },
  { id: 'speed2', name: '전투 속도 2x', desc: '전투 배속을 2배로 변경', def: { code: 'KeyX', key: 'x', label: 'X' } },
  { id: 'speed4', name: '전투 속도 4x', desc: '전투 배속을 4배로 변경', def: { code: 'KeyC', key: 'c', label: 'C' } },
  { id: 'speed8', name: '전투 속도 8x', desc: '전투 배속을 8배로 변경', def: { code: 'KeyV', key: 'v', label: 'V' } },
];

// ── Tool unlock map requirements ──────────────────────────────
export function requiredMapForTool(tool: string): number {
  return getDef(tool)?.requiredMap ?? 1;
}
