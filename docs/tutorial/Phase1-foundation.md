# Phase 1: 기반 구축 (Foundation)

> 예상 시간: 2시간
> 선행 조건: 없음

## 작업 목록

### 1.1 튜토리얼 Seen 플래그 함수 추가
**파일**: `src/lib/game/core/StorageMisc.ts` (신규)

```typescript
// ============================================================
// Storage — Miscellaneous (튜토리얼 Seen 등)
// ============================================================
import { STORAGE_KEY_TUTORIAL_SEEN } from '../constants';

export function loadTutorialSeen(): boolean {
  return localStorage.getItem(STORAGE_KEY_TUTORIAL_SEEN) === 'true';
}

export function saveTutorialSeen(seen: boolean): void {
  localStorage.setItem(STORAGE_KEY_TUTORIAL_SEEN, String(seen));
}
```

**기존 파일에 통합する場合**:
- `src/lib/game/core/StorageBase.ts` 또는
- `src/lib/game/controllers/StorageController.ts`

### 1.2 i18n에 힌트 메시지 추가
**파일**: `src/lib/game/i18n/ko.ts`, `src/lib/game/i18n/en.ts`

```typescript
// ko.ts에 추가
'hint.open.designer': '설계 화면에서 D를 눌러 술식을 설계하세요',
'hint.place.components': '빨간 마나와 회로를 배치하세요',
'hint.save.slot': '저장 버튼을 눌러 슬롯에 저장하세요',
'hint.start.battle': '전투 시작 버튼을 눌러 전투를 시작하세요',
'hint.cast.spells': '키 1~5로 술식을 발사하세요',
'hint.select.tool': '도구를 선택하고 설계판을 클릭하세요.',
'hint.congratulations': '첫 술식을 저장했습니다! 전투를 시작해 보세요.',
'help': '도움말',

// en.ts에 추가
'hint.open.designer': 'Press D to open the spell designer',
'hint.place.components': 'Place red mana and a circuit',
'hint.save.slot': 'Click Save to save to a slot',
'hint.start.battle': 'Click Start Battle to begin',
'hint.cast.spells': 'Press 1~5 to cast spells',
'hint.select.tool': 'Select a tool and click the design board.',
'hint.congratulations': 'Spell saved! Start the battle.',
'help': 'Help',
```

### 1.3 TutorialHints 유틸리티 함수 작성
**파일**: `src/lib/game/ui/TutorialHints.ts` (신규)

```typescript
// ============================================================
// Tutorial Hints — 온보딩 힌트 표시 유틸리티
// ============================================================
import { showToast } from './Toast';
import { loadTutorialSeen, saveTutorialSeen } from '../core/StorageMisc';
import { t } from '../i18n';

export type HintType =
  | 'open-designer'
  | 'place-components'
  | 'save-slot'
  | 'start-battle'
  | 'cast-spells'
  | 'congratulations';

/** 힌트 표시 여부 확인 */
export function shouldShowHint(type: HintType): boolean {
  return loadTutorialSeen();
}

/** 특정 힌트 표시 (중복 방지) */
export function showHint(type: HintType): void {
  const messages: Record<HintType, string> = {
    'open-designer': t('hint.open.designer'),
    'place-components': t('hint.place.components'),
    'save-slot': t('hint.save.slot'),
    'start-battle': t('hint.start.battle'),
    'cast-spells': t('hint.cast.spells'),
    'congratulations': t('hint.congratulations'),
  };
  
  showToast(messages[type] || '', 'info');
}

/** 튜토리얼 완료 처리 */
export function completeTutorial(): void {
  saveTutorialSeen(true);
}
```

---

## 완료 체크리스트

- [ ] 1.1 StorageMisc.ts 파일 생성 또는 기존 Storage에 통합
- [ ] 1.2 i18n/ko.ts에 힌트 메시지 8개 추가
- [ ] 1.3 i18n/en.ts에 힌트 메시지 8개 추가
- [ ] 1.4 TutorialHints.ts 파일 생성
- [ ] 1.5 bun run check 통과 확인

---

## 예상 산출물

| 파일 | 상태 |
|-----|------|
| `src/lib/game/core/StorageMisc.ts` | 신규 또는 통합 |
| `src/lib/game/ui/TutorialHints.ts` | 신규 |
| `i18n/ko.ts` | 수정 |
| `i18n/en.ts` | 수정 |
