import { create } from 'zustand';
import { repositories } from '@/data/repositories';
import type { Category, CategoryInput, CategoryType } from '@/types';

type CategoryStore = {
  categories: Category[]; // 삭제된 것 포함 (과거 거래 이름 표시용)
  loaded: boolean;
  load: () => Promise<void>;
  add: (input: CategoryInput) => Promise<Category>;
  edit: (id: string, input: CategoryInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
};

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loaded: false,
  load: async () => {
    const categories = await repositories.category.listAll();
    set({ categories, loaded: true });
  },
  add: async (input) => {
    const created = await repositories.category.create(input);
    await get().load();
    return created;
  },
  edit: async (id, input) => {
    await repositories.category.update(id, input);
    await get().load();
  },
  remove: async (id) => {
    await repositories.category.softDelete(id);
    await get().load();
  },
  reorder: async (ids) => {
    await repositories.category.reorder(ids);
    await get().load();
  },
}));

export const selectActiveCategories =
  (type: CategoryType) => (s: CategoryStore) =>
    s.categories.filter((c) => c.deletedAt === null && c.type === type);
