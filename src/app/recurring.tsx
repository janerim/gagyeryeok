import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { formatWon } from '@/domain/money';
import { monthTotal, nextOccurrence, scheduleLabel } from '@/domain/recurring';
import { useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useRecurringStore } from '@/store/recurringStore';

/** 자동이체 목록: 이번 달 합계, 각 항목의 주기·계좌·다음 출금일 */
export default function RecurringScreen() {
  const items = useRecurringStore((s) => s.items);
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);

  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const today = format(new Date(), 'yyyy-MM-dd');
  // 나가는 돈(지출·이체)과 들어오는 돈(수입)은 따로 합산한다
  const month = today.slice(0, 7);
  const total = monthTotal(items.filter((r) => r.type !== 'INCOME'), month);
  const incomeTotal = monthTotal(items.filter((r) => r.type === 'INCOME'), month);

  const accountText = (r: (typeof items)[number]) =>
    r.type === 'TRANSFER'
      ? `${accountName.get(r.accountId) ?? '?'} → ${accountName.get(r.toAccountId ?? '') ?? '?'}`
      : accountName.get(r.accountId) ?? '?';

  return (
    <View style={styles.screen}>
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>이번 달 자동이체</Text>
          <Text style={styles.summaryValue}>{formatWon(total)}원</Text>
        </View>
        {incomeTotal > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이번 달 자동 입금</Text>
            <Text style={[styles.summaryValue, { color: Colors.income }]}>
              +{formatWon(incomeTotal)}원
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => {
          const next = nextOccurrence(item, today);
          const c = item.categoryId ? categoryById.get(item.categoryId) : undefined;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/recurring-form', params: { id: item.id } })}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {c?.icon ? `${c.icon} ` : item.type === 'TRANSFER' ? '↔︎ ' : ''}
                  {item.name}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {`${scheduleLabel(item)} · ${accountText(item)}`}
                </Text>
              </View>
              <View style={styles.right}>
                <Text
                  style={[
                    styles.amount,
                    {
                      color:
                        item.type === 'EXPENSE'
                          ? Colors.expense
                          : item.type === 'INCOME'
                            ? Colors.income
                            : Colors.transfer,
                    },
                  ]}
                >
                  {item.type === 'INCOME' ? '+' : ''}
                  {formatWon(item.amount)}
                </Text>
                <Text style={styles.next}>
                  {next ? `다음 ${format(parseISO(next), 'M/d')}` : '종료'}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 자동이체가 없습니다.</Text>
            <Text style={styles.emptySub}>구독료, 공과금, 생활비 이체처럼{'\n'}매달 나가는 돈을 등록해 두세요.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable onPress={() => router.push('/recurring-form')} style={styles.addBtn}>
          <Text style={styles.addText}>+ 자동이체 추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  summary: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sub: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
  right: { alignItems: 'flex-end', marginLeft: 12 },
  amount: { fontSize: 16, fontWeight: '700' },
  next: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  emptySub: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  addBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
