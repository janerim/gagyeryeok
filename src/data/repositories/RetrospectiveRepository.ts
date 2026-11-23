import type { RetroPeriodType, Retrospective } from '@/types';

export interface RetrospectiveRepository {
  find(periodType: RetroPeriodType, periodKey: string): Promise<Retrospective | null>;
  /** 그 주기의 메모를 저장한다. 빈 메모면 지운다 */
  save(periodType: RetroPeriodType, periodKey: string, note: string): Promise<void>;
}
