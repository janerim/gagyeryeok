import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { Colors } from '@/constants/colors';
import { useShallow } from 'zustand/react/shallow';
import { selectActiveCategories, useCategoryStore } from '@/store/categoryStore';
import type { Category, CategoryType } from '@/types';

/** 카테고리 관리: 편집을 누르면 ≡ 손잡이를 끌어 순서를 바꾼다 */
export default function CategoriesSettingsScreen() {
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const categories = useCategoryStore(useShallow(selectActiveCategories(type)));
  const reorder = useCategoryStore((s) => s.reorder);
  const [editing, setEditing] = useState(false);
  // 드래그 직후 저장이 끝나기 전까지 화면이 되돌아가지 않도록 순서를 로컬에 둔다
  const [list, setList] = useState(categories);
  useEffect(() => setList(categories), [categories]);

  const onReorder = ({ from, to }: ReorderableListReorderEvent) => {
    const next = reorderItems(list, from, to);
    setList(next);
    reorder(next.map((c) => c.id)).catch(console.error);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setEditing((e) => !e)} hitSlop={8}>
              <Text style={styles.headerBtn}>{editing ? '완료' : '편집'}</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.segment}>
        {(['EXPENSE', 'INCOME'] as CategoryType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.segmentItem, t === type && styles.segmentItemOn]}
          >
            <Text style={[styles.segmentText, t === type && styles.segmentTextOn]}>
              {t === 'EXPENSE' ? '지출' : '수입'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ReorderableList
        data={list}
        keyExtractor={(c) => c.id}
        onReorder={onReorder}
        renderItem={({ item }) => <CategoryRow item={item} editing={editing} />}
        ListEmptyComponent={<Text style={styles.empty}>카테고리가 없습니다.</Text>}
        ListFooterComponent={
          <Pressable
            onPress={() => router.push({ pathname: '/category-form', params: { type } })}
            style={styles.addBtn}
          >
            <Text style={styles.addText}>+ 카테고리 추가</Text>
          </Pressable>
        }
      />
    </View>
  );
}

function CategoryRow({ item, editing }: { item: Category; editing: boolean }) {
  const drag = useReorderableDrag();
  return (
    <Pressable
      disabled={editing}
      onPress={() => router.push({ pathname: '/category-form', params: { id: item.id } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
    >
      <Text style={styles.name}>
        {item.icon ? `${item.icon} ` : ''}
        {item.name}
      </Text>
      {editing ? (
        <Pressable onPressIn={drag} hitSlop={10} style={styles.handle}>
          <Text style={styles.handleText}>≡</Text>
        </Pressable>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  headerBtn: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  segment: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentItemOn: { backgroundColor: Colors.background },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  segmentTextOn: { color: Colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  name: { fontSize: 16, color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textSecondary },
  handle: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  handleText: { fontSize: 22, color: Colors.textSecondary },
  empty: { padding: 24, textAlign: 'center', color: Colors.textSecondary },
  addBtn: { padding: 16, alignItems: 'center' },
  addText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
