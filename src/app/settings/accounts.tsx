import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { Colors } from '@/constants/colors';
import { ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import { formatWon } from '@/domain/money';
import { useAccountStore } from '@/store/accountStore';
import type { Account } from '@/types';

/** 계좌 관리: 편집을 누르면 ≡ 손잡이를 끌어 순서를 바꾼다 */
export default function AccountsSettingsScreen() {
  const accounts = useAccountStore((s) => s.accounts);
  const reorder = useAccountStore((s) => s.reorder);
  const [editing, setEditing] = useState(false);
  // 드래그 직후 저장이 끝나기 전까지 화면이 되돌아가지 않도록 순서를 로컬에 둔다
  const [list, setList] = useState(accounts);
  useEffect(() => setList(accounts), [accounts]);

  const onReorder = ({ from, to }: ReorderableListReorderEvent) => {
    const next = reorderItems(list, from, to);
    setList(next);
    reorder(next.map((a) => a.id)).catch(console.error);
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
      <ReorderableList
        data={list}
        keyExtractor={(a) => a.id}
        onReorder={onReorder}
        renderItem={({ item }) => <AccountRow item={item} editing={editing} />}
        ListEmptyComponent={<Text style={styles.empty}>계좌가 없습니다.</Text>}
        ListFooterComponent={
          <Pressable onPress={() => router.push('/account-form')} style={styles.addBtn}>
            <Text style={styles.addText}>+ 계좌 추가</Text>
          </Pressable>
        }
      />
    </View>
  );
}

function AccountRow({ item, editing }: { item: Account; editing: boolean }) {
  const drag = useReorderableDrag();
  return (
    <Pressable
      disabled={editing}
      onPress={() => router.push({ pathname: '/account-form', params: { id: item.id } })}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: Colors.surface },
        item.isHidden && { opacity: 0.45 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.purpose ? <Text style={styles.purpose}>{item.purpose}</Text> : null}
          {item.isHidden && <Text style={styles.hidden}>숨김</Text>}
        </View>
        <Text style={styles.sub}>
          {ACCOUNT_TYPE_LABELS[item.type]} · 초기 잔액 {formatWon(item.initialBalance)}원
        </Text>
      </View>
      {editing ? (
        <Pressable
          onPressIn={drag}
          hitSlop={10}
          style={styles.handle}
          accessibilityRole="button"
          accessibilityLabel="순서 변경"
        >
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  purpose: {
    fontSize: 12,
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
  },
  hidden: { fontSize: 12, color: Colors.textSecondary },
  sub: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.textSecondary },
  handle: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  handleText: { fontSize: 22, color: Colors.textSecondary },
  empty: { padding: 24, textAlign: 'center', color: Colors.textSecondary },
  addBtn: { padding: 16, alignItems: 'center' },
  addText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
