/**
 * 최근 사용한 id를 앞으로 보내고, 나머지는 원래 순서를 유지한다.
 * recentIds는 최근 순(가장 최근이 0번)이어야 한다.
 */
export function orderByRecentUse<T extends { id: string }>(
  items: T[],
  recentIds: string[]
): T[] {
  const byId = new Map(items.map((it) => [it.id, it]));
  const head: T[] = [];
  const used = new Set<string>();
  for (const id of recentIds) {
    const it = byId.get(id);
    if (it && !used.has(id)) {
      head.push(it);
      used.add(id);
    }
  }
  const tail = items.filter((it) => !used.has(it.id));
  return [...head, ...tail];
}
