import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import { formatWon } from '@/domain/money';
import { useAccountStore } from '@/store/accountStore';

export default function AccountsSettingsScreen() {
  const accounts = useAccountStore((s) => s.accounts);
  const reorder = useAccountStore((s) => s.reorder);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= accounts.length) return;
    const ids = accounts.map((a) => a.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder(ids).catch(console.error);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        renderItem={({ item, index }) => (
          <Pressable
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
            <View style={styles.orderBtns}>
              <Pressable onPress={() => move(index, -1)} hitSlop={6} style={styles.orderBtn}>
                <Text style={[styles.orderText, index === 0 && styles.orderDisabled]}>▲</Text>
              </Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={6} style={styles.orderBtn}>
                <Text
                  style={[styles.orderText, index === accounts.length - 1 && styles.orderDisabled]}
                >
                  ▼
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
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
  orderBtns: { flexDirection: 'row', gap: 4 },
  orderBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontSize: 14, color: Colors.textSecondary },
  orderDisabled: { opacity: 0.2 },
  empty: { padding: 24, textAlign: 'center', color: Colors.textSecondary },
  addBtn: { padding: 16, alignItems: 'center' },
  addText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
