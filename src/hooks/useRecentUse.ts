import { useEffect, useState } from 'react';
import { repositories } from '@/data/repositories';
import type { TransactionType } from '@/types';

const LIMIT = 5;

/**
 * 입력 화면에서 "최근 사용" 카테고리를 앞에 두기 위한 id 목록 (최근 순).
 * 계좌는 종류별로 묶어 계좌 관리의 순서대로 보여 주므로 여기서 다루지 않는다.
 */
export function useRecentUse(type: TransactionType) {
  const [recent, setRecent] = useState<{ categoryIds: string[] }>({ categoryIds: [] });

  useEffect(() => {
    let alive = true;
    repositories.transaction
      .recentCategoryIds(type, LIMIT)
      .then((categoryIds) => {
        if (alive) setRecent({ categoryIds });
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [type]);

  return recent;
}
