import type { ComponentDef } from './def';

export const mixedCore: ComponentDef = {
  type: 'mixedCore',
  role: 'circuit',
  name: '9칸 혼합 핵',
  text: '3x3 고위 회로입니다. 빨간 마나 1개, 파란 마나 2개, 작동 중인 1칸 회로 1개가 한 묶음입니다. 묶음마다 일반 데미지 60과 특수 데미지 분산 3을 줍니다. 분산은 기지에 가까운 적 최대 3개에게 각각 피해를 주는 방식입니다.',
  formula: 'min(빨강 마나, floor(파란 마나 / 2), 인접 활성 1칸 회로 수) × (일반 60 + 분산 3)',
  size: { w: 3, h: 3 },
  requiredMap: 3,
  order: 7,
  calc: ({ red, blue, neighbors, connectedTo }) => {
    const neighborCircles = neighbors.filter(x => x.type === 'circle');
    const activeCircleCount = neighborCircles.filter(
      x => connectedTo(x, y => y.type === 'red') >= 1,
    ).length;
    const inactiveCircleCount = neighborCircles.length - activeCircleCount;
    const bluePairs = Math.floor(blue / 2);
    const groups = Math.min(red, bluePairs, activeCircleCount);
    const damage = groups * 60;
    const aoe = groups > 0 ? groups * 3 : 0;
    let detail = `min(빨강 ${red}, floor(파란 ${blue} / 2) = ${bluePairs}, 인접 활성 1칸 회로 ${activeCircleCount}) = ${groups}묶음 × (일반 60 + 분산 3)`;
    if (groups > 0) detail += ` / 일반 ${damage}, 특수 분산 ${aoe}`;
    if (inactiveCircleCount > 0) detail += ` / 비활성 1칸 회로 ${inactiveCircleCount}개 제외`;
    return { damage, aoe, detail };
  },
};
