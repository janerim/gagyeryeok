import type { Category, CategoryInput } from '@/types';

export interface CategoryRepository {
  /** 삭제된 것 포함 전체. 화면에서 과거 거래의 카테고리명을 찾을 때 필요 */
  listAll(): Promise<Category[]>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  /** ids 순서대로 sort_order 를 0부터 다시 매긴다 */
  reorder(ids: string[]): Promise<void>;
}
