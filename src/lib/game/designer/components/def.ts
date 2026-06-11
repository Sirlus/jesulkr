// ============================================================
// ComponentDef — 부품(술식) 단일 정의 인터페이스
// ============================================================
// 새 부품을 추가하려면 이 인터페이스 형식으로 파일 하나를 만들고
// registry.ts 에 등록하기만 하면 됩니다.
// 팔레트 순서, 설명, 크기, 해금 맵, 데미지 계산이 모두 이 파일에서 파생됩니다.
import type { Component } from '../../types';

/** 부품 역할 구분 */
export type ComponentRole =
  | 'mana' // 마나 소스 (빨간 점)
  | 'generator' // 마나 생성기 (파란)
  | 'wire' // 도선 (연결만)
  | 'circuit' // 회로 (데미지 발생)
  | 'tool'; // 도구 (지우개 등, 설계판에 저장되지 않음)

/** 회로 데미지 계산에 전달되는 컨텍스트 */
export interface CalcContext {
  /** 이 회로에 연결된 빨간 마나 개수 (직접 인접 + 도선망) */
  red: number;
  /** 이 회로에 연결된 활성 파란 마나 개수 */
  blue: number;
  /** 계산 대상 부품 */
  component: Component;
  /** 설계판의 전체 부품 목록 */
  components: Component[];
  /** 이 부품과 직접 인접한 부품들 (4방향) */
  neighbors: Component[];
  /** 임의의 부품에 연결된(직접+도선) 부품 중 predicate 일치 개수 */
  connectedTo: (target: Component, predicate: (c: Component) => boolean) => number;
  /** 해당 id 의 파란 마나 생성기가 활성 상태인지 */
  isActiveBlue: (id: number) => boolean;
}

/** 회로 데미지 계산 결과 */
export interface CalcResult {
  /** 일반 데미지 */
  damage: number;
  /** 특수(분산/AOE) 데미지 */
  aoe?: number;
  /** breakdown 에 표시할 상세 설명 */
  detail: string;
}

/** 부품 하나의 완전한 정의 */
export interface ComponentDef {
  /** 부품 타입 식별자 (Component.type 과 일치) */
  type: string;
  /** 부품 역할 */
  role: ComponentRole;
  /** 표시 이름 */
  name: string;
  /** 도구 설명 */
  text: string;
  /** 공식 요약 */
  formula: string;
  /** 기본 크기 (회전 전) */
  size: { w: number; h: number; rotatable?: boolean };
  /** 사용 가능해지는 맵 번호 (1=기본 해금) */
  requiredMap: number;
  /** 팔레트 정렬 순서 (작을수록 앞) */
  order: number;
  /** 회로 데미지 계산 (role === 'circuit' 인 경우에만) */
  calc?: (ctx: CalcContext) => CalcResult;
}
