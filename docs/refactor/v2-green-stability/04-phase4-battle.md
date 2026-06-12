# Phase 4: 전투 시스템 반영

> **현재 상태**: `BattleEngine.ts`에서 직접 데미지 처리, `DamageResolver.ts`는 테스트/미래용, `CastingSystem.ts`는 green/stability 체크 없음

## 변경 파일

### 1. `BattleEngine.ts`

현재 `BattleEngine.ts`는 발사체 해결 로직을 직접 수행합니다. `globalDamage` 처리를 여기에 추가합니다.

```diff
  // 7. Resolve projectiles
  const newCasts: CastProjectile[] = [];
  for (const c of casts2) {
    c.remainingTicks--;
    if (c.remainingTicks <= 0) {
      let target = m.find(x => x.id === c.targetId && x.hp > 0) ?? null;
      if (!target) target = getAutoTarget(m);
      if (target) {
        target.hp -= c.spell.damage;
        e.push({ type: 'hit' as const, x: target.x, y: target.y, t: 0, life: 0.5, text: `-${c.spell.damage}` });
        const aoe = c.spell.aoeDamage || 0;
        if (aoe > 0) {
          const aoeT = m.filter(x => x.hp > 0).sort((a, b) => b.y - a.y).slice(0, 3);
          for (const at of aoeT) { at.hp -= aoe; e.push({ type: 'hit' as const, x: at.x, y: at.y, t: 0, life: 0.42, text: `-${aoe}` }); }
          e.push({ type: 'aoe' as const, x: ctx.canvasWidth / 2, y: ctx.canvasHeight / 2, t: 0, life: 0.55, text: `분산 ${aoe}` });
        }
+
+       // v2: global damage (all monsters)
+       const global = Number(c.spell.globalDamage) || 0;
+       if (global > 0) {
+         for (const mon of m) {
+           if (mon.hp > 0) {
+             mon.hp -= global;
+             e.push({ type: 'hit' as const, x: mon.x, y: mon.y, t: 0, life: 0.35, text: `-${global}` });
+           }
+         }
+         e.push({ type: 'aoe' as const, x: ctx.canvasWidth / 2, y: ctx.canvasHeight / 2, t: 0, life: 0.6, text: `전체 ${global}` });
+       }
+
        for (const mon of m) {
          if (mon.hp <= 0) {
            killedAny = true;
            nextScore += mon.maxHp * 10;
            e.push({ type: 'kill' as const, x: mon.x, y: mon.y, t: 0, life: 0.7, text: `+${mon.maxHp * 10}` });
            if (sid === mon.id) sid = null;
          }
        }
      }
    } else {
      newCasts.push(c);
    }
  }
```

### 2. `DamageResolver.ts`

`resolveCast`는 현재 소스에서 직접 호출되지 않지만, 테스트와 향후 통합을 위해 동일하게 업데이트합니다.

```diff
  export function resolveCast(
    cast: CastProjectile,
    monsters: Monster[],
    canvasWidth: number,
    canvasHeight: number,
  ): ResolveResult {
    // ... 기존 normal damage 및 AOE 처리 ...

+   // v2: global damage
+   const global = Number(cast.spell.globalDamage) || 0;
+   if (global > 0) {
+     for (const m of monsters) {
+       if (m.hp > 0) {
+         m.hp -= global;
+         effects.push({ type: 'hit', x: m.x, y: m.y, t: 0, life: 0.35, text: `-${global}` });
+       }
+     }
+     aoeEffects.push({ type: 'aoe', x: canvasWidth / 2, y: canvasHeight / 2, t: 0, life: 0.6, text: `전체 ${global}` });
+   }

    // ... 기존 킬/점수 처리 ...
  }
```

### 3. `CastingSystem.ts`

안정도/녹색 요구사항은 설계 단계에서 이미 `valid`로 검증되므로, 시전 시에는 레거시 호환성만 확보하면 됩니다.

```diff
  export function tryCastSlot(
    index: number,
    spell: SpellData | null,
    // ... 나머지 매개변수 ...
  ): { result: CastResult; newMana?: number; projectile?: CastProjectile } {
    // ... 기존 체크들 ...

+   // v2: 레거시 저장 데이터 호환
+   const safeSpell = spell
+     ? { ...spell, globalDamage: Number(spell.globalDamage) || 0 }
+     : spell;
+
    // 마나 체크 시 safeSpell 사용
-   if (mana < spell.manaCost) {
+   if (mana < safeSpell.manaCost) {
      return { result: { success: false, message: '마나 부족' } };
    }

    // ... projectile 생성 시 safeSpell 사용 ...
  }
```

> **참고**: 현재 `CastingSystem.ts`에서 `tryCastSlot`은 `spell`이 `null`이 아님이 보장된 후에만 사용되므로, 실제 적용 시 `safeSpell` 변수를 도입하거나 `spell.globalDamage` 접근 시 `?? 0`을 사용하면 됩니다.

---

## 완료 조건

- [ ] `BattleEngine.ts`: `globalDamage` 처리 추가
- [ ] `DamageResolver.ts`: `globalDamage` 지원
- [ ] `CastingSystem.ts`: `globalDamage` 기본값 처리
- [ ] `npm run test` 통과

## 예상 소요: 1시간
