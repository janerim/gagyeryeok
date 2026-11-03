/** 원 단위 정수를 천 단위 콤마 문자열로. 예: 12345 → "12,345" */
export function formatWon(amount: number): string {
  const abs = Math.abs(Math.trunc(amount));
  const body = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return amount < 0 ? `-${body}` : body;
}

/**
 * 달력 칸용 축약. 1만 미만은 콤마 표기, 1만 이상은 "만" 단위 소수 한 자리.
 * 예: 9800 → "9,800", 123000 → "12.3만", 1000000 → "100만", -123000 → "-12.3만"
 */
export function formatWonShort(amount: number): string {
  const abs = Math.abs(Math.trunc(amount));
  const sign = amount < 0 ? '-' : '';
  if (abs < 10_000) return sign + formatWon(abs);
  const man = Math.round(abs / 1_000) / 10; // 소수 첫째 자리까지
  const text = Number.isInteger(man) ? man.toString() : man.toFixed(1);
  return `${sign}${text}만`;
}

/** 입력창 문자열("12,300", "12300원")에서 정수 원 단위를 뽑는다. 숫자가 없으면 0. */
export function parseWon(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}
