import type { Recurring, RecurringInput } from '@/types';

export interface RecurringRepository {
  /** 삭제되지 않은 자동이체, 생성 순 */
  list(): Promise<Recurring[]>;
  findById(id: string): Promise<Recurring | null>;
  create(input: RecurringInput): Promise<Recurring>;
  update(id: string, input: RecurringInput): Promise<void>;
  /** 이미 만들어진 거래는 그대로 둔다 */
  softDelete(id: string): Promise<void>;
}
