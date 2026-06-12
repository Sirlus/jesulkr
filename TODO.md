# 리팩토링 TODO: 와이어 타입 하드코딩 제거

## Plan: constants.ts의 상수를 활용하도록 리팩토링

### 1단계: constants.ts에 헬퍼 함수 추가
- [x] `isWireType(type)` - 와이어 유형(wire/mediumWire/mediumHub) 확인
- [x] `getWireColors(type)` - 해당 유형이 전달하는 색상 배열 반환

### 2단계: WireNetwork.ts 수정
- [x] constants.ts에서 헬퍼 함수 임포트
- [x] `isWireForColor()` 함수 리팩토링 - 하드코딩 제거
- [x] `wireTypes` 하드코딩을 `isWireType()` 사용으로 대체

### 3단계: 테스트 및 검증
- [x] 빌드 확인
- [x] 테스트 통과 (141개)
