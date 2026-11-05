import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import { repositories } from '@/data/repositories';
import { computeBalance, totalBalance, type AccountSums } from '@/domain/balance';
import { formatWon } from '@/domain/money';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';
import { useShallow } from 'zustand/react/shallow';
import { selectVisibleAccounts, useAccountStore } from '@/store/accountStore';
import { useTransactionStore } from '@/store/transactionStore';

/** 계좌 탭: 계좌별 현재 잔액. 계좌를 누르면 그 계좌로 필터된 내역 탭으로 이동 */
export default function AccountsScreen() {
  const accounts = useAccountStore(useShallow(selectVisibleAccounts));
  // 거래가 추가·수정되면 items가 바뀌므로 잔액도 다시 계산한다
  const txItems = useTransactionStore((s) => s.items);
  const [sums, setSums] = useState<Map<string, AccountSums>>(new Map());

  useFocusEffect(
    useCallback(() => {
      repositories.transaction.sumsByAccount().then(setSums).catch(console.error);
    }, [txItems])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        left="계좌"
        right={
          <>
            <Pressable onPress={() => router.push('/recurring')} style={hb.btn}>
              <Text style={hb.text}>자동이체</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/settings/accounts')} style={hb.btn}>
              <Text style={hb.text}>관리</Text>
            </Pressable>
          </>
        }
      />
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        // 숨김이 아닌 계좌 전체의 합계 (카드 포함)
        ListHeaderComponent={
          accounts.length > 0 ? (
            <View style={styles.total}>
              <Text style={styles.totalLabel}>전체 합계</Text>
              <BalanceText amount={totalBalance(accounts, sums)} />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.navigate({ pathname: '/history', params: { accountId: item.id } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.purpose ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.purpose}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.type}>{ACCOUNT_TYPE_LABELS[item.type]}</Text>
            </View>
            <BalanceText amount={computeBalance(item.initialBalance, sums.get(item.id))} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 계좌가 없습니다.</Text>
            <Pressable onPress={() => router.push('/account-form')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>계좌 추가</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function BalanceText({ amount }: { amount: number }) {
  return (
    <Text style={[styles.balance, amount < 0 && { color: Colors.expense }]}>
      {formatWon(amount)}원
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  badgeText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  type: { marginTop: 2, fontSize: 13, color: Colors.textSecondary },
  balance: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginLeft: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});
