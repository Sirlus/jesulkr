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
import { red3 } from './red3';
import { blueGen } from './blueGen';
import { wire } from './wire';
import { mediumWire } from './mediumWire';
import { mediumHub } from './mediumHub';
import { extractor } from './extractor';
import { stabilizer } from './stabilizer';
import { circle } from './circle';
import { oval } from './oval';
import { kernel } from './kernel';
import { mixed2 } from './mixed2';
import { greenMana } from './greenMana';
import { green3x2 } from './green3x2';
import { greenPair2 } from './greenPair2';
import { mixedCore } from './mixedCore';
import { ultimateCore } from './ultimateCore';
import { eraser } from './eraser';

/** 등록된 모든 부품 정의 */
export const ALL_DEFS: ComponentDef[] = [
  red,
  red3,
  blueGen,
  wire,
  mediumWire,
  mediumHub,
  extractor,
  stabilizer,
  circle,
  oval,
  kernel,
  mixed2,
  greenMana,
  green3x2,
  greenPair2,
  mixedCore,
  ultimateCore,
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

/** 모든 부품 정의의 style을 합친 CSS 문자열 (전역 주입용) */
export function getComponentStyles(): string {
  return ALL_DEFS.map(d => d.style ?? '')
    .filter(Boolean)
    .join('\n');
}
