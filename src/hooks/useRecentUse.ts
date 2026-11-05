import { useEffect, useState } from 'react';
import { repositories } from '@/data/repositories';
import type { TransactionType } from '@/types';

const LIMIT = 5;

type RecentUse = { categoryIds: string[]; accountIds: string[] };

/**
 * 입력 화면용 최근 사용 id 목록 (최근 순).
 * 카테고리는 앞에 두는 데, 계좌는 마지막에 쓴 것을 미리 선택하는 데 쓴다
 * (계좌 칩의 순서는 계좌 관리에서 정한 그대로 둔다).
 */
export function useRecentUse(type: TransactionType) {
  const [recent, setRecent] = useState<RecentUse>({ categoryIds: [], accountIds: [] });

  useEffect(() => {
    let alive = true;
    Promise.all([
      repositories.transaction.recentCategoryIds(type, LIMIT),
      repositories.transaction.recentAccountIds(type, LIMIT),
    ])
      .then(([categoryIds, accountIds]) => {
        if (alive) setRecent({ categoryIds, accountIds });
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [type]);

  return recent;
}
