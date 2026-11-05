/** 계좌 하나의 거래 합계 (삭제 제외, 기간 무관) */
export type AccountSums = {
  income: number; // INCOME, account_id 기준
  expense: number; // EXPENSE, account_id 기준
  transferIn: number; // TRANSFER, to_account_id 기준
  transferOut: number; // TRANSFER, account_id 기준
};

export const EMPTY_SUMS: AccountSums = { income: 0, expense: 0, transferIn: 0, transferOut: 0 };

/** 잔액 = 초기 잔액 + 수입 + 이체 입금 − 지출 − 이체 출금 */
export function computeBalance(initialBalance: number, sums: AccountSums = EMPTY_SUMS): number {
  return initialBalance + sums.income + sums.transferIn - sums.expense - sums.transferOut;
}

/** 여러 계좌의 잔액 합계. 카드처럼 잔액이 음수인 계좌는 그만큼 깎인다 */
export function totalBalance(
  accounts: { id: string; initialBalance: number }[],
  sums: Map<string, AccountSums>
): number {
  return accounts.reduce((total, a) => total + computeBalance(a.initialBalance, sums.get(a.id)), 0);
}
