// ============================================================
// Registry — 모든 부품 정의를 모아 파생 데이터를 제공합니다
// ============================================================
// 새 부품 추가 방법:
//   1. 이 폴더에 새 def 파일 생성 (예: fireburst.ts)
//   2. 아래 import 한 줄 추가
//   3. ALL_DEFS 배열에 추가
// 그러면 팔레트/설명/크기/해금/데미지 계산에 자동 반영됩니다.
import type { ComponentDef } from './def';
import { red } from './red';
import { blueGen } from './blueGen';
import { wire } from './wire';
import { circle } from './circle';
import { oval } from './oval';
import { kernel } from './kernel';
import { mixed2 } from './mixed2';
import { mixedCore } from './mixedCore';
import { eraser } from './eraser';

/** 등록된 모든 부품 정의 */
export const ALL_DEFS: ComponentDef[] = [
  red,
  blueGen,
  wire,
  circle,
  oval,
  kernel,
  mixed2,
  mixedCore,
  eraser,
];

const DEF_BY_TYPE: Map<string, ComponentDef> = new Map(ALL_DEFS.map(d => [d.type, d]));

/** 타입으로 정의 조회 (없으면 undefined) */
export function getDef(type: string): ComponentDef | undefined {
  return DEF_BY_TYPE.get(type);
}

/** order 순으로 정렬된 모든 타입 (팔레트 순서) */
export const ORDERED_TYPES: string[] = [...ALL_DEFS]
  .sort((a, b) => a.order - b.order)
  .map(d => d.type);

/** 데미지를 발생시키는 회로 타입 목록 */
export const CIRCUIT_TYPES: Set<string> = new Set(
  ALL_DEFS.filter(d => d.role === 'circuit').map(d => d.type),
);

/** 설계판에 저장 가능한 부품 타입 (도구 제외) */
export const STORABLE_TYPES: Set<string> = new Set(
  ALL_DEFS.filter(d => d.role !== 'tool').map(d => d.type),
);
