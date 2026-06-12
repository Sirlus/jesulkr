# Phase 3: 도움말 모달 (Help Modal)

> 예상 시간: 3시간
> 선행 조건: Phase 1, 2 완료

## 작업 목록

### 3.1 HelpModal 컴포넌트 구조 설계
**파일**: `src/lib/components/HelpModal.svelte` (신규)

```svelte
<script lang="ts">
  import { t } from '$lib/game/i18n';
  import { MAPS, STAR_THRESHOLDS, TOOL_ORDER, TOOL_DESCRIPTIONS } from '$lib/game/constants';
  
  let { open = $bindable(false) } = $props<{ open?: boolean }>();
  let activeTab = $state<'overview' | 'components' | 'controls' | 'maps'>('overview');
  
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
    }
  }
</script>

<svelte:window onkeydown={onKeyDown} />

{#if open}
  <div class="modalOverlay" onclick={() => open = false} onkeydown={() => {}} role="button" tabindex="-1">
    <div class="modalContent" onclick={(e) => e.stopPropagation()} onkeydown={() => {}} role="dialog">
      <div class="modalHeader">
        <h2>{t('help')}</h2>
        <button class="closeBtn" onclick={() => open = false}>×</button>
      </div>
      
      <nav class="tabs">
        <button class:active={activeTab === 'overview'} onclick={() => activeTab = 'overview'}>개요</button>
        <button class:active={activeTab === 'components'} onclick={() => activeTab = 'components'}>부품</button>
        <button class:active={activeTab === 'controls'} onclick={() => activeTab = 'controls'}>조작법</button>
        <button class:active={activeTab === 'maps'} onclick={() => activeTab = 'maps'}>맵</button>
      </nav>
      
      <div class="tabContent">
        {#if activeTab === 'overview'}
          <!-- 개요 탭 -->
        {:else if activeTab === 'components'}
          <!-- 부품 탭 -->
        {:else if activeTab === 'controls'}
          <!-- 조작법 탭 -->
        {:else if activeTab === 'maps'}
          <!-- 맵 탭 -->
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modalOverlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modalContent {
    background: var(--bg-primary);
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .modalHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
  }
  
  .tabs button {
    flex: 1;
    padding: 10px;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .tabs button.active {
    border-bottom: 2px solid var(--accent);
  }
  
  .tabContent {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  }
</style>
```

### 3.2 개요 탭 구현
```svelte
{#if activeTab === 'overview'}
  <h3>Jesulkr란?</h3>
  <p>술식을 설계하여 몬스터의 침공으로부터 기지를 지키는 타워 디펜스 게임입니다.</p>
  
  <h4>핵심 루프</h4>
  <ol>
    <li><strong>설계</strong>: 술식(스펠)을 설계합니다</li>
    <li><strong>저장</strong>: 5개 슬롯에 저장합니다</li>
    <li><strong>전투</strong>: 전투에서 술식을 발사합니다</li>
    <li><strong>별 획득</strong>: 점수로 별을 획득합니다</li>
    <li><strong>해금</strong>: 새 부품과 맵이 해금됩니다</li>
  </ol>
  
  <h4>술식 통계</h4>
  <ul>
    <li><strong>쿨타임</strong>: 발사 후 다시 발사할 수 있는 시간</li>
    <li><strong>마나 소모</strong>: 발사 시 필요한 마나</li>
    <li><strong>일반 데미지</strong>: 기본 피해량</li>
    <li><strong>특수 데미지</strong>: AOE(范围的) 피해</li>
    <li><strong>안정도</strong>: v2 - 회로 활성화에 필요</li>
  </ul>
{/if}
```

### 3.3 부품 탭 구현
```svelte
{:else if activeTab === 'components'}
  <h3>부품 목록</h3>
  
  <h4>마나원</h4>
  <table>
    <thead><tr><th>부품</th><th>설명</th><th>공식</th></tr></thead>
    <tbody>
      {#each TOOL_ORDER as tool}
        {@const info = TOOL_DESCRIPTIONS[tool]}
        <tr>
          <td>{info.name}</td>
          <td>{info.text}</td>
          <td>{info.formula}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  
  <h4>저장 조건</h4>
  <ul>
    <li>빨간 마나 1개 이상</li>
    <li>회로 1개 이상</li>
    <li>일반 데미지 1 이상</li>
  </ul>
{/if}
```

### 3.4 조작법 탭 구현
```svelte
{:else if activeTab === 'controls'}
  <h3>조작법</h3>
  
  <h4>기본 키</h4>
  <table>
    <thead><tr><th>키</th><th>동작</th></tr></thead>
    <tbody>
      <tr><td>D</td><td>설계 화면 열기/닫기</td></tr>
      <tr><td>Space</td><td>일시정지/재개</td></tr>
      <tr><td>R</td><td>전투 재시작</td></tr>
      <tr><td>1~5</td><td>해당 슬롯 발사</td></tr>
      <tr><td>Z/X/C/V</td><td>배속 1x/2x/4x/8x</td></tr>
      <tr><td>Esc</td><td>설계 화면 닫기</td></tr>
    </tbody>
  </table>
  
  <h4>마우스</h4>
  <ul>
    <li><strong>설계판 좌클릭</strong>: 부품 배치</li>
    <li><strong>설계판 우클릭</strong>: 부품 삭제</li>
    <li><strong>전투 화면 클릭</strong>: 몬스터 수동 타겟팅</li>
  </ul>
{/if}
```

### 3.5 맵 탭 구현
```svelte
{:else if activeTab === 'maps'}
  <h3>맵 목록</h3>
  
  {#each [1, 2, 3] as mapId}
    {@const map = MAPS[mapId]}
    {@const stars = STAR_THRESHOLDS[mapId]}
    {#if map}
      <div class="mapInfo">
        <h4>{map.name}</h4>
        <p>{map.desc}</p>
        <p><strong>별 조건</strong>: {stars[0]} / {stars[1]} / {stars[2]} pts</p>
        {#if mapId === 3}
          <p><strong>보스</strong>: HP {map.bossHp} (등장: {map.firstBossAt}초)</p>
        {/if}
      </div>
    {/if}
  {/each}
{/if}
```

---

## 완료 체크리스트

- [ ] 3.1 HelpModal.svelte 기본 구조 생성
- [ ] 3.2 개요 탭 구현 (게임 설명, 핵심 루프)
- [ ] 3.3 부품 탭 구현 (18개 부품 테이블)
- [ ] 3.4 조작법 탭 구현 (키 테이블)
- [ ] 3.5 맵 탭 구현 (3개 맵 정보)
- [ ] 3.6 닫기 로직 (X 버튼, Esc, 오버레이 클릭)
- [ ] 3.7 CSS 스타일 최적화
- [ ] 3.8 bun run check 통과 확인

---

## 예상 산출물

| 文件 | 상태 |
|-----|------|
| `src/lib/components/HelpModal.svelte` | 신규 |
