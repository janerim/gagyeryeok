import { useEffect, useState } from 'react';
import { repositories } from '@/data/repositories';
import type { TransactionType } from '@/types';

const LIMIT = 5;

/** 입력 화면에서 "최근 사용"을 앞에 두기 위한 id 목록 (최근 순) */
export function useRecentUse(type: TransactionType) {
  const [recent, setRecent] = useState<{ categoryIds: string[]; accountIds: string[] }>({
    categoryIds: [],
    accountIds: [],
  });

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
