# 가계력 (Gagyeryeok) 기획서

> '~력' 시리즈(책력 → 가계력 → 소식력)의 두 번째 앱. 개인용 가계부 앱.
> 이 문서는 Claude Code가 구현 작업의 기준으로 삼는 문서다. 범위 밖 기능은 제안만 하고 구현하지 않는다.

---

## 1. 개요

| 항목 | 내용 |
|---|---|
| 앱 이름 | 가계력 |
| 한 줄 설명 | 모바일에서 10초 안에 기록하고, 달력에서 한 달 돈 흐름을 한눈에 보는 가계부 |
| 타깃 사용자 | 1차: 나 (개인 사용) / 2차: 유료화 가능성 검토 |
| 플랫폼 | iOS 앱 (Expo). 추후 웹 확장 예정 |
| 저장 전략 | 1차: 로컬(SQLite) 전용 → 3차: 서버 동기화 추가 |
| 시리즈 규칙 | 메인 화면은 달력. 하단 탭 4개. 책력과 UI 구조 통일 |

---

## 2. 문제 정의 (왜 만드나)

현재 Numbers 스프레드시트로 가계부를 쓰면서 생긴 불편:

1. **모바일에서 입력·조회가 너무 불편**해서 기록을 미루게 된다.
2. 매일 기록은 하지만 **주·월·분기·연 통계**를 보려면 손이 많이 간다.
3. **구독·자동이체**가 어디서 얼마나 빠져나가는지 한눈에 안 보인다.
4. **계좌 목록·카테고리 목록을 시트마다 따로 관리**해야 한다. 계좌 하나 추가하면 모든 시트에 다시 추가해야 한다.

→ 4번은 앱에서는 계좌·카테고리를 마스터 테이블로 두고 거래가 ID로 참조하면 설계만으로 해결된다.
   ("동기화"라는 단어는 3차의 기기 간 동기화에만 쓴다.)

---

## 3. 사용 시나리오

1. 퇴근길 지하철에서 오늘 쓴 돈을 **10초 안에** 입력한다.
2. **매주** 지출을 확인하고, 생활비 계좌의 잔액 상황을 확인한다.
3. 월말에 이번 달 카테고리별 지출을 확인한다.
4. 매달 빠져나가는 구독·자동이체 목록과 합계, 다음 출금일을 본다.
5. 월급 계좌에서 생활비 계좌로 돈을 옮긴 것을 기록한다. (지출이 아니라 **이체**로 집계되어야 함)

---

## 4. 기능 범위

### MVP (1차) — "이것만 있으면 Numbers를 버릴 수 있다"
- [ ] 거래 빠른 입력: 지출 / 수입 / 계좌이체
- [ ] 자동이체(정기 거래) 등록: 지출형 / 이체형, 주기와 출금일
- [ ] 계좌 마스터 관리 (추가·수정·숨김, 용도 표시 예: 생활비)
- [ ] 카테고리 마스터 관리 (지출/수입 구분, 정렬)
- [ ] 달력 홈: 날짜별 수입·지출 표시, 이번 달 요약, 예정된 자동이체 미리보기
- [ ] 날짜 탭 → 해당 일 내역 하단 시트
- [ ] 내역 목록 (월 단위, 필터: 유형/계좌/카테고리)
- [ ] 계좌 화면: 계좌별 현재 잔액 (초기 잔액 + 입금 − 출금)
- [ ] 월별 통계: 카테고리별 지출 비율, 수입·지출 합계
- [ ] 로컬 저장 (SQLite)

### 2차
- 주·분기·연 통계, 월별 추이 그래프
- 예산 설정 및 초과 알림
- CSV / Numbers 데이터 가져오기 (기존 기록 이관)
- 로컬 백업 파일 내보내기/가져오기

### 3차 (서버 도입 시점 = 웹 확장 시점)
- 계정(인증), 서버 백업, 기기 간 동기화 — Spring Boot + PostgreSQL
- 웹 버전 (통계 대시보드 중심)
- 유료화 (결제, 구독)

### 하지 않는 것 (명시적 제외)
- 은행·카드사 자동 연동 (스크래핑, 오픈뱅킹)
- 공유 가계부 (다인 사용)
- 안드로이드 (iOS 우선)

---

## 5. 화면 목록 & 흐름

하단 탭 4개: **캘린더 | 내역 | 계좌 | 통계** (책력의 캘린더 | 전체 기록 | 읽고 싶은 | 통계 구조와 대응)

### 5.1 캘린더 (홈)
- 상단: `<  26년 11월  >`, 우측에 **오늘** 버튼 + **+** 버튼 (책력과 동일 배치)
- 그 아래 한 줄 요약: 이번 달 수입 / 지출 / 합계
- 월 그리드: 월요일 시작, 토요일 파랑, 일요일 빨강, 오늘 하이라이트 (책력과 동일)
- 날짜 칸 내용: 수입(파랑) / 지출(빨강) 금액을 작게. 칸이 좁으므로 1만 이상은 `-12.3만` 형식
- 미래 날짜의 예정된 자동이체는 흐리게 표시 (가계력 시그니처)
- 날짜 탭 → 그날 내역 하단 시트 (내역 탭 시 수정 화면)

### 5.2 입력 화면 (+ 버튼)
- 상단 세그먼트: 지출 | 수입 | 이체
- 금액 (숫자 키패드 자동 포커스) → 카테고리 (이체는 없음) → 계좌 (이체는 출금/입금 2개) → 날짜(기본 오늘) → 메모(선택) → 저장
- 목표: 지출 기준 **탭 5번 이내, 10초 이내**
- 최근 사용 카테고리·계좌를 앞에 노출

### 5.3 내역
- 월 단위 리스트, 날짜 그룹핑
- 필터: 유형 / 계좌 / 카테고리
- 항목 탭 → 수정, 스와이프 → 삭제(소프트)

### 5.4 계좌
- 계좌 리스트 + 각 잔액, 용도 뱃지(생활비 등)
- 계좌 탭 → 해당 계좌 거래 내역
- 자동이체 관리 진입점 (목록, 다음 출금일, 월 합계)

### 5.5 통계
- 월 선택
- 카테고리별 지출 비율 (도넛 또는 바)
- 수입·지출·순액
- (2차) 주/분기/연 전환, 추이 그래프

### 5.6 설정
- 카테고리 관리, 계좌 관리, (2차) 백업/가져오기

---

## 6. 데이터 모델

### 공통 규칙 (3차 서버 동기화 대비, 처음부터 적용)
- `id`: 앱에서 생성하는 **UUID** (서버 충돌 방지)
- `createdAt`, `updatedAt`: ISO 8601 문자열
- `deletedAt`: **소프트 삭제**. 조회 시 항상 `deletedAt IS NULL` 조건
- 금액은 **원 단위 정수**. 소수 사용 금지
- 날짜는 `YYYY-MM-DD` 문자열, 인덱스 필수

```sql
CREATE TABLE account (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,          -- CHECKING | SAVINGS | CARD | CASH | OTHER
  purpose       TEXT,                   -- 예: 생활비, 월급, 비상금 (자유 입력)
  initial_balance INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_hidden     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE TABLE category (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,          -- EXPENSE | INCOME
  icon          TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE TABLE recurring (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,          -- 예: 넷플릭스, 생활비 이체
  type          TEXT NOT NULL,          -- EXPENSE | TRANSFER
  amount        INTEGER NOT NULL,
  account_id    TEXT NOT NULL,          -- 출금 계좌
  to_account_id TEXT,                   -- TRANSFER일 때 입금 계좌
  category_id   TEXT,                   -- EXPENSE일 때
  cycle         TEXT NOT NULL,          -- MONTHLY | YEARLY
  billing_day   INTEGER NOT NULL,       -- 1~31 (말일 처리: 해당 월 마지막 날로 보정)
  start_date    TEXT NOT NULL,
  end_date      TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE TABLE "transaction" (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,          -- INCOME | EXPENSE | TRANSFER
  amount        INTEGER NOT NULL,
  date          TEXT NOT NULL,          -- YYYY-MM-DD
  account_id    TEXT NOT NULL,          -- INCOME: 입금 계좌 / EXPENSE, TRANSFER: 출금 계좌
  to_account_id TEXT,                   -- TRANSFER일 때 입금 계좌
  category_id   TEXT,                   -- TRANSFER는 NULL
  memo          TEXT,
  recurring_id  TEXT,                   -- 자동이체에서 생성된 거래면 참조
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE INDEX idx_tx_date ON "transaction"(date);
CREATE INDEX idx_tx_account ON "transaction"(account_id);
CREATE INDEX idx_tx_recurring ON "transaction"(recurring_id);
```

### 집계 규칙
- **지출 통계**에 포함: `EXPENSE`만. `TRANSFER`는 절대 지출로 집계하지 않는다.
- **계좌 잔액** = `initial_balance` + (INCOME where account_id) + (TRANSFER where to_account_id) − (EXPENSE where account_id) − (TRANSFER where account_id)
- **달력 날짜 칸** = 해당 일의 INCOME 합, EXPENSE 합 (TRANSFER 제외)
- **자동이체 실행**: 앱 실행 시 `recurring`을 보고 오늘까지 생성되지 않은 거래를 `transaction`으로 생성 (`recurring_id`로 중복 방지). 미래분은 생성하지 않고 달력에 "예정"으로만 계산해서 표시.

---

## 7. 아키텍처 원칙 (웹·서버 확장 대비)

1. **저장소 추상화**: 화면/훅은 SQLite를 직접 호출하지 않는다. `TransactionRepository`, `AccountRepository` 등 인터페이스를 두고 `SqliteTransactionRepository`가 구현한다. 3차에서 "로컬 + 서버 동기화" 구현체로 교체.
2. **도메인 로직은 순수 함수**: 잔액 계산, 통계 집계, 자동이체 다음 출금일 계산, 금액 포맷(`-12.3만`)은 UI·DB 의존 없는 순수 함수로 `domain/`에 둔다. 웹에서 그대로 재사용.
3. **동기화 대비 필드**를 모든 테이블에 유지 (UUID, updated_at, deleted_at). 지금은 쓰지 않아도 제거하지 않는다.
4. **달력 컴포넌트 분리**: 그리드 생성·월 이동·요일 색상·오늘 표시만 책임지는 `Calendar` 컴포넌트. 날짜 칸 내용은 `renderDay(date, data)`로 외부에서 주입. (책력 달력에서 가져오되, 표지·읽은 기간 띠 같은 책력 전용 로직은 가계력에 들여오지 않는다.) 소식력까지 3개째가 될 때 별도 패키지로 분리 예정이므로 지금은 가계력 내부 모듈로 둔다.

### 디렉터리 구조 (제안)

```text
src/
  app/              # expo-router 화면 (탭 4개 + 모달)
  components/
    calendar/       # 공통 달력 (renderDay 주입형)
    ...
  domain/           # 순수 함수: balance, stats, recurring, money
  data/
    db/             # SQLite 초기화, 마이그레이션
    repositories/   # 인터페이스 + Sqlite 구현체
  hooks/            # 화면용 쿼리 훅
  types/
```

---

## 8. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 앱 | Expo (React Native) + TypeScript | 책력과 동일 |
| 라우팅 | expo-router | 탭 + 모달 |
| 로컬 DB | expo-sqlite | 통계를 SQL로 처리 |
| 상태 | 가벼운 전역 상태(zustand 등) + 리포지토리 훅 | 과한 상태 라이브러리 금지 |
| 차트 | 가벼운 RN 차트 라이브러리 1개 | 2차에서 결정 |
| 서버(3차) | Spring Boot + PostgreSQL | 동기화 API(변경분 push/pull), LWW 충돌 처리 |
| 웹(3차) | 미정: Expo 웹 빌드 또는 Next.js | 도메인 로직 재사용 전제 |

---

## 9. 마일스톤

매 주 끝에 "직접 써볼 수 있는 상태"가 목표.

| 주차 | 범위 | 완료 조건 |
|---|---|---|
| 1주 | 프로젝트 셋업, DB 스키마·마이그레이션, 리포지토리, 계좌·카테고리 마스터, 거래 입력(지출/수입/이체) + 내역 목록 | 거래를 넣고 목록에서 볼 수 있다 |
| 2주 | 달력 홈(날짜별 금액, 월 요약, 날짜 탭 시트), 계좌 잔액 화면 | Numbers 없이 하루를 기록할 수 있다 |
| 3주 | 자동이체 등록·자동 생성, 달력 예정 표시, 월별 통계 | 구독·자동이체 흐름이 보인다 |
| 4주 | 실사용하며 입력 속도·UX 다듬기, 기존 기록 수동 이관 | Numbers에서 완전히 갈아탄다 |

---

## 10. 완료 기준 (MVP)

- Numbers 없이 **한 달 동안 가계력으로만** 기록했다.
- 지출 입력이 **탭 5번·10초 이내**에 끝난다.
- 생활비 계좌 잔액이 실제 계좌와 맞는다.
- 계좌이체가 지출 통계에 섞이지 않는다.
- 계좌·카테고리를 한 곳에서만 추가하면 모든 화면에 반영된다.

---

## 11. Claude Code 작업 지침

- 작업은 **9장 마일스톤 순서**로, 한 번에 한 기능씩 진행한다. 구현 전에 변경할 파일과 접근 방식을 짧게 먼저 설명한다.
- **4장 MVP 범위 밖** 기능은 구현하지 않는다. 필요하다고 판단되면 제안만 한다.
- **7장 아키텍처 원칙**은 어기지 않는다. 특히 화면에서 SQLite 직접 호출 금지, TRANSFER를 지출로 집계 금지.
- 도메인 순수 함수(`domain/`)에는 단위 테스트를 함께 작성한다. (잔액 계산, 자동이체 출금일 보정, 금액 포맷은 필수)
- 금액 표기는 한국 원화 기준. 천 단위 콤마, 달력 칸에서는 `만` 단위 축약.
- 외부 라이브러리 추가는 최소화하고, 추가 시 이유를 적는다.
- 커밋 메시지는 한국어로, 기능 단위로 나눈다.
