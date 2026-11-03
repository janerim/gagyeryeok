import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { selectActiveCategories, useCategoryStore } from '@/store/categoryStore';
import type { CategoryType } from '@/types';

export default function CategoriesSettingsScreen() {
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const categories = useCategoryStore(selectActiveCategories(type));
  const reorder = useCategoryStore((s) => s.reorder);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const ids = categories.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder(ids).catch(console.error);
  };

  return (
    <View style={styles.screen}>
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

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/category-form', params: { id: item.id } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
          >
            <Text style={styles.name}>
              {item.icon ? `${item.icon} ` : ''}
              {item.name}
            </Text>
            <View style={styles.orderBtns}>
              <Pressable onPress={() => move(index, -1)} hitSlop={6} style={styles.orderBtn}>
                <Text style={[styles.orderText, index === 0 && styles.orderDisabled]}>▲</Text>
              </Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={6} style={styles.orderBtn}>
                <Text
                  style={[
                    styles.orderText,
                    index === categories.length - 1 && styles.orderDisabled,
                  ]}
                >
                  ▼
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
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
  },
  name: { fontSize: 16, color: Colors.textPrimary },
  orderBtns: { flexDirection: 'row', gap: 4 },
  orderBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontSize: 14, color: Colors.textSecondary },
  orderDisabled: { opacity: 0.2 },
  empty: { padding: 24, textAlign: 'center', color: Colors.textSecondary },
  addBtn: { padding: 16, alignItems: 'center' },
  addText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
