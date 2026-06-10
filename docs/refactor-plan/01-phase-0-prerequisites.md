# Phase 0: 선행조건

> **목표**: 리팩터링 시작 전, 현재 상태를 정확히 파악하고 안전한 작업 환경 구축  
> **기간**: 당일 (2~4시간)  
> **블로킹 여부**: Phase 1 시작 전에 반드시 완료해야 함

---

## 0-1. 현재 코드베이스 동결

### 할 일

- [ ] `main` 브랜치에서 `refactor/base` 브랜치 생성
- [ ] `refactor/base` 브랜치를 원격에 푸시
- [ ] 현재 작업 중인 변경사항이 있다면 커밋 또는 스태시
- [ ] `docs/CONSISTENCY_REPORT.md`와 `docs/IMPROVEMENTS.md`를 최신 상태로 유지

```bash
git checkout -b refactor/base
git push -u origin refactor/base
```

---

## 0-2. 원작 HTML v1.3 백업 및 참조용 설정

### 할 일

- [ ] `/home/dev/jesulkr/Jesulkr_v1.3.html`을 프로젝트 루트에 `reference-v1.3.html`로 복사 (`.gitignore`에 추가)
- [ ] 원작의 핵심 상수/함수 목록을 `docs/refactor-plan/reference-sheet.md`로 정리 (필요 시)

```bash
cp /home/dev/jesulkr/Jesulkr_v1.3.html ./reference-v1.3.html
echo "reference-v1.3.html" >> .gitignore
```

---

## 0-3. 빌드 환경 검증

### 할 일

- [ ] 현재 `package.json`의 scripts가 정상 동작하는지 확인
- [ ] `bun install` 또는 `npm install` 실행
- [ ] `bun run check` 실행 → TypeScript/Svelte 오류 기록
- [ ] `bun run test` 실행 → 현재 테스트 통과 여부 확인
- [ ] `bun run build` 실행 → 빌드 실패 원인 기록

### 예상 결과물

```
# 빌드 오류 로그 (예시)
[vite]: sveltekit() does not accept "adapter" option
# → Phase 1-1에서 처리

# 타입 오류 로그
src/lib/stores/game.ts:85 - Property 'eraseComponent' does not exist
# → Phase 1-3에서 처리
```

---

## 0-4. Git 훅 설정 (선택)

### 할 일

- [ ] `pre-commit` 훅에 `bun run check`와 `bun run test` 추가 (선택사항)
- [ ] Phase 1~2 동안은 훅 비활성화 가능 (빈번한 커밋을 위해)

```bash
# .git/hooks/pre-commit (임시 비활성화)
echo "#!/bin/sh\n# disabled during refactor phase 1-2" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## 0-5. 작업 일지 템플릿 준비

### 할 일

- [ ] `docs/refactor-plan/daily-log.md` 생성 (템플릿 아래 참고)
- [ ] 매일 작업 시작/종료 시 기록

### daily-log.md 템플릿

```markdown
# 리팩터링 작업 일지

## YYYY-MM-DD

### 오늘 목표
- [ ] 목표 1
- [ ] 목표 2

### 완료한 것
- 완료 항목

### 막힌 것 / 의사결정
- 문제 상황
- 선택한 방향과 이유

### 내일 계획
- 계획 항목
```

---

## 완료 기준

- [ ] `refactor/base` 브랜치가 원격에 존재
- [ ] 원작 HTML이 프로젝트 내에 참조용으로 복사됨
- [ ] 현재 빌드/테스트 상태가 문서화됨
- [ ] `daily-log.md`가 생성됨

---

## 산출물

| 파일 | 설명 |
|------|------|
| `refactor/base` 브랜치 | 리팩터링 기준점 |
| `reference-v1.3.html` | 원작 참조용 (git 추적 제외) |
| `docs/refactor-plan/daily-log.md` | 작업 일지 |
