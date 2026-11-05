# 가계력 할 일

다른 기기나 세션에서 이어서 작업할 때 보는 문서다. 결정된 내용은 여기 적고, 끝난 항목은 체크한다.
기능 범위의 큰 틀은 [gagyeryeok-plan.md](../gagyeryeok-plan.md), 스토어 문구는 [appstore-metadata.md](appstore-metadata.md).

## 현재 상태 (2026-11-05)

- TestFlight 에 **0.1.0 빌드 6** 까지 올라가 있다. 한 달쯤 실사용 테스트 뒤 App Store 출시 예정.
- 출시 때 정할 것: 버전 번호(0.1.0 → 1.0.0?), `docs/appstore-metadata.md` 의 "미정" 항목.
- 빌드·제출: `eas build --platform ios --profile production --non-interactive --auto-submit`
  (빌드 번호는 자동 증가. 끝나면 App Store Connect → TestFlight 에 5~10분 뒤 나타난다)
- 확인 명령: `npm run typecheck`, `npm test`, `npx expo export --platform ios --output-dir /tmp/x` (번들 깨짐 확인)

## 진행 중: 실사용 피드백 7가지

사용자 요청과 합의한 설계. 묶음 순서대로 하고, 묶음마다 커밋 + TestFlight 빌드.

### 1차 묶음 (작은 것들)

- [ ] **내역·통계에 "이번 달" 버튼** — 캘린더의 "오늘" 버튼과 같은 자리(헤더 오른쪽).
- [ ] **달 선택 팝업** — 헤더의 `26년 11월` 글자를 누르면 시트: `‹ 2026 ›` + 12개월 격자.
      `MonthNavigator` 에 `onPressLabel` 을 추가해 캘린더·내역·통계 세 탭에 한 번에 적용.
- [ ] **내역 필터 초기화** — 유형·계좌·카테고리 중 하나라도 걸려 있으면 필터 줄 끝에 `✕` 버튼, 누르면 전부 해제.
- [ ] **거래 입력 화면 압축**
  - 날짜를 한 줄로: `날짜  ‹ 2026.11.04 (수) ›  오늘` (라벨을 같은 줄에). 날짜 글자를 누르면 달력 시트에서 직접 고른다.
    `DateStepper` 에 달력 시트를 붙이면 자동이체의 시작일도 같이 좋아진다. 달력은 기존 `Calendar` 컴포넌트 재사용.
  - 하단 버튼을 한 줄로: `[삭제] [수정]` (삭제는 좁은 빨간 테두리, 수정은 넓은 초록). 새 거래는 저장만.
    계좌·자동이체 폼도 같은 푸터 컴포넌트(`FormFooter`)로 통일.

### 2차: 홈에 생활비 잔액

- [ ] 계좌 폼에 **"홈에 잔액 표시"** 토글 (한 계좌만 켜진다). `account.show_on_home` 컬럼 추가 → 마이그레이션 v2.
      백업/복원은 스키마 버전을 들고 다니므로 추가 작업 없음(`restore` 가 예전 백업에 v2 를 적용한다).
- [ ] 캘린더 요약 아래 한 줄:
      `생활비 통장 523,000원 · 예정 자동이체 −120,000 → 쓸 수 있는 403,000 · 25일 남음, 하루 1.6만`
  - 잔액 = `computeBalance` (계좌 탭과 같은 계산)
  - 예정 자동이체 = 이번 달 남은 출금 중 이 계좌가 출금 계좌인 것 (`scheduledByDate` 재사용, 이체 포함)
  - 하루 = 쓸 수 있는 돈 ÷ (이번 달 남은 일수, 오늘 포함)
- 나중에 월 예산 설정(기획서 2차)으로 키울 수 있다.

### 3차: 월 캘린더에 주간 합계

- [ ] 달력 오른쪽에 **8번째 열**: 각 주의 **지출 합계만** (`-23.4만`). 요일 헤더에는 `주`.
      날짜 칸이 53pt → 47pt 정도로 줄어든다. 수입은 넣지 않는다.
- 나중에: 주 합계 칸을 누르면 그 주 내역 시트.

### 4차: 계좌·카테고리 순서를 드래그로

- [ ] 계좌 관리·카테고리 관리에 **편집** 버튼 → 편집 모드에서 행 오른쪽 `≡` 손잡이를 끌어 이동 → **완료**.
      항상 드래그되게 하지 않는 이유: 스크롤하다 실수로 옮기기 쉽다.
- 라이브러리: `react-native-reorderable-list` (0.18, 네이티브 코드 없음 → Expo Go 가능,
  peer: reanimated ≥3.12, gesture-handler ≥2.12 — 우리는 4.7 / 3.3).
  gesture-handler 3 과 안 맞으면 `Gesture.Pan` + reanimated 로 직접 구현.
- 기존 ▲▼ 버튼은 드래그가 되면 뺀다.

## 그다음 (기획서 2차 범위)

- 주·분기·연 통계, 월별 추이 그래프
- 예산 설정 및 초과 알림
- CSV / Numbers 가져오기
- 실사용 중 나온 자잘한 것들은 이 문서 맨 아래에 적는다.

## 작업 방식 메모

- 화면 변경은 실제 기기(Expo Go 또는 TestFlight)에서 본다. 같은 Wi-Fi 가 아니면 Expo Go 는 안 붙는다.
- 시뮬레이터로 스크린샷을 찍을 때: `xcrun simctl create` 로 임시 기기 → Expo Go 설치 →
  `defaults write host.exp.Exponent EXDevMenuIsOnboardingFinished -bool true` (안내 시트 끄기) →
  `exp://127.0.0.1:8081/--/<route>` 로 딥링크. 앱 DB 는 `Documents/ExponentExperienceData/@janerim/gagyeryeok/SQLite/gagyeryeok.db`.
- 커밋 메시지는 한국어 한 줄 + 필요하면 본문.
