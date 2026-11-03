import { describe, expect, it } from 'vitest';
import { orderByRecentUse } from './recent';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

describe('orderByRecentUse', () => {
  it('최근 사용 순으로 앞에 배치하고 나머지는 원래 순서', () => {
    expect(orderByRecentUse(items, ['c', 'a']).map((i) => i.id)).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
  });
  it('목록에 없는 id는 무시', () => {
    expect(orderByRecentUse(items, ['x', 'b']).map((i) => i.id)).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });
  it('중복 id는 한 번만', () => {
    expect(orderByRecentUse(items, ['b', 'b']).map((i) => i.id)).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });
  it('최근 사용이 없으면 그대로', () => {
    expect(orderByRecentUse(items, [])).toEqual(items);
  });
});
