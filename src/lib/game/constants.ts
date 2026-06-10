// ============================================================
// Jesulkr v1.3 — Constants & Configuration
// ============================================================
import type { MapDef, ControlAction, ToolDescriptor, ComponentType } from './types';

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
export const STORAGE_KEY_LANGUAGE = 'jesulkr_language_v1';
export const STORAGE_KEY_RUN_MODE = 'magic_design_game_selected_run_mode_v1';
export const STORAGE_KEY_RECORDS = 'magic_design_game_map_records_v3';
export const STORAGE_KEY_RECORDS_LEGACY = 'magic_design_game_map_records_v2';
export const STORAGE_KEY_UNLOCKS = 'magic_design_game_map_unlocks_star_v2';
export const STORAGE_KEY_RECORDS_OLD = 'magic_design_game_map_records_v1';
export const STORAGE_KEY_UNLOCKS_LEGACY = 'magic_design_game_map_unlocks_v1';

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
    desc: '몬스터 HP가 1~50 사이로 등장합니다. 별 조건: 55,000 / 60,000 / 65,000점. 파란 마나 생성기, 도선, 2칸 혼합 회로가 해금됩니다.',
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
export const TOOL_DESCRIPTIONS: Record<string, ToolDescriptor> = {
  red: {
    name: '빨간 점 마나',
    text: '기본 마나 소스입니다. 배치 1개당 마나 비용 +1. 기존 빨간 회로와 혼합 회로가 읽을 수 있습니다.',
    formula: '비용 +1',
  },
  blueGen: {
    name: '파란 마나 생성기',
    text: '빨간 마나와 직접 인접하거나 도선으로 연결되어야 작동합니다. 작동하면 추가 마나 2를 쓰고 파란 마나 1개를 제공합니다.',
    formula: '연결 빨간 마나 ≥ 1 → 파란 마나 1개, 비용 +2',
  },
  wire: {
    name: '도선',
    text: '맵 2에서 해금됩니다. 마나를 먼 회로에 연결합니다. 같은 도선망에 연결된 마나는 회로에 인접한 마나처럼 계산됩니다. 자체 비용과 일반 데미지는 없습니다.',
    formula: '연결 전달',
  },
  circle: {
    name: '1칸 회로',
    text: '연결된 빨간 마나를 일반 데미지로 바꿉니다. 일반 데미지가 1 이상 나오는 작동 중 상태일 때만 9칸 혼합 핵의 조건 부품으로 인정됩니다.',
    formula: '연결 빨간 마나 수 × 1',
  },
  oval: {
    name: '2칸 타원',
    text: '기존 빨간 2칸 회로입니다. 연결된 빨간 마나 2개 묶음마다 일반 데미지 5를 냅니다.',
    formula: 'floor(빨간 마나 / 2) × 5',
  },
  kernel: {
    name: '2x2 핵',
    text: '기존 빨간 2x2 핵입니다. 연결된 빨간 마나 3개 묶음마다 일반 데미지 12를 냅니다.',
    formula: 'floor(빨간 마나 / 3) × 12',
  },
  mixed2: {
    name: '2칸 혼합 회로',
    text: '빨간 마나와 파란 마나를 한 쌍으로 묶어 고효율 일반 데미지를 냅니다.',
    formula: 'min(빨간 마나, 파란 마나) × 8',
  },
  mixedCore: {
    name: '9칸 혼합 핵',
    text: '3x3 고위 회로입니다. 빨간 마나 1개, 파란 마나 2개, 작동 중인 1칸 회로 1개가 한 묶음입니다. 묶음마다 일반 데미지 60과 특수 데미지 분산 3을 줍니다. 분산은 기지에 가까운 적 최대 3개에게 각각 피해를 주는 방식입니다.',
    formula: 'min(빨강 마나, floor(파란 마나 / 2), 인접 활성 1칸 회로 수) × (일반 60 + 분산 3)',
  },
  eraser: {
    name: '지우개',
    text: '클릭하거나 드래그한 칸의 부품을 제거합니다. 지우개가 아니어도 설계판에서 우클릭하면 즉시 삭제됩니다.',
    formula: '제거',
  },
};

export const TOOL_ORDER: ComponentType[] = [
  'red', 'blueGen', 'wire', 'circle', 'oval', 'kernel', 'mixed2', 'mixedCore', 'eraser',
];

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
  if (tool === 'blueGen' || tool === 'wire' || tool === 'mixed2') return 2;
  if (tool === 'mixedCore') return 3;
  return 1;
}
