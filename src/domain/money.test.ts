import { describe, expect, it } from 'vitest';
import { formatWon, formatWonShort, parseWon } from './money';

describe('formatWon', () => {
  it('천 단위 콤마', () => {
    expect(formatWon(0)).toBe('0');
    expect(formatWon(999)).toBe('999');
    expect(formatWon(1000)).toBe('1,000');
    expect(formatWon(12345678)).toBe('12,345,678');
  });
  it('음수', () => {
    expect(formatWon(-1500)).toBe('-1,500');
  });
});

describe('formatWonShort', () => {
  it('1만 미만은 콤마 표기', () => {
    expect(formatWonShort(0)).toBe('0');
    expect(formatWonShort(9800)).toBe('9,800');
    expect(formatWonShort(9999)).toBe('9,999');
  });
  it('1만 이상은 만 단위 소수 한 자리', () => {
    expect(formatWonShort(10000)).toBe('1만');
    expect(formatWonShort(123000)).toBe('12.3만');
    expect(formatWonShort(123456)).toBe('12.3만');
    expect(formatWonShort(125000)).toBe('12.5만');
    expect(formatWonShort(1000000)).toBe('100만');
    expect(formatWonShort(15500000)).toBe('1550만');
  });
  it('반올림으로 자리 올림', () => {
    expect(formatWonShort(99950)).toBe('10만');
  });
  it('음수 부호 유지', () => {
    expect(formatWonShort(-123000)).toBe('-12.3만');
    expect(formatWonShort(-500)).toBe('-500');
  });
});

describe('parseWon', () => {
  it('콤마·단위·공백 제거', () => {
    expect(parseWon('12,300')).toBe(12300);
    expect(parseWon('12300원')).toBe(12300);
    expect(parseWon(' 1 000 ')).toBe(1000);
  });
  it('숫자가 없으면 0', () => {
    expect(parseWon('')).toBe(0);
    expect(parseWon('abc')).toBe(0);
  });
});
