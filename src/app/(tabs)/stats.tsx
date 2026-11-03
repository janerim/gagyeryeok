import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { formatWon } from '@/domain/money';
import { expenseByCategory, sumTotals } from '@/domain/stats';
import { useCategoryStore } from '@/store/categoryStore';
import { useTransactionStore } from '@/store/transactionStore';

/** 월별 통계: 수입·지출·순액, 카테고리별 지출 비율. 카테고리를 누르면 그 카테고리 내역으로 */
export default function StatsScreen() {
  const { month, items, setMonth, reload } = useTransactionStore();
  const categories = useCategoryStore((s) => s.categories);

  useEffect(() => {
    reload().catch(console.error);
  }, [reload]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const totals = useMemo(() => sumTotals(items), [items]);
  const shares = useMemo(() => expenseByCategory(items), [items]);

  const monthDate = parseISO(`${month}-01`);
  const shiftMonth = (d: number) => setMonth(format(addMonths(monthDate, d), 'yyyy-MM'));
  const net = totals.income - totals.expense;
  const maxAmount = shares[0]?.amount ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        left={
          <MonthNavigator
            date={monthDate}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.totals}>
          <TotalRow label="수입" value={formatWon(totals.income)} color={Colors.income} />
          <TotalRow label="지출" value={formatWon(totals.expense)} color={Colors.expense} />
          <View style={styles.divider} />
          <TotalRow
            label="순액"
            value={(net > 0 ? '+' : '') + formatWon(net)}
            color={net < 0 ? Colors.expense : Colors.textPrimary}
            bold
          />
        </View>

        <Text style={styles.sectionTitle}>카테고리별 지출</Text>
        {shares.length === 0 && <Text style={styles.empty}>이번 달 지출이 없습니다.</Text>}
        {shares.map((s) => {
          const c = s.categoryId ? categoryById.get(s.categoryId) : undefined;
          const label = c ? `${c.icon ? c.icon + ' ' : ''}${c.name}` : '카테고리 없음';
          return (
            <Pressable
              key={s.categoryId ?? '__none__'}
              disabled={!s.categoryId}
              onPress={() =>
                router.navigate({ pathname: '/history', params: { categoryId: s.categoryId! } })
              }
              style={({ pressed }) => [styles.shareRow, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.shareHead}>
                <Text style={styles.shareLabel} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.sharePct}>{Math.round(s.ratio * 100)}%</Text>
                <Text style={styles.shareAmount}>{formatWon(s.amount)}</Text>
              </View>
              {/* 막대 길이는 가장 큰 카테고리 기준이라 1위가 꽉 차고 나머지가 비교된다 */}
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${maxAmount ? (s.amount / maxAmount) * 100 : 0}%` }]}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.totalValue, { color }, bold && styles.bold]}>{value}원</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  totals: { padding: 16, borderRadius: 12, backgroundColor: Colors.surface, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '600' },
  bold: { fontWeight: '800', fontSize: 17 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  empty: { paddingVertical: 24, textAlign: 'center', color: Colors.textSecondary },
  shareRow: { paddingVertical: 10, gap: 6 },
  shareHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sharePct: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  shareAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, minWidth: 80, textAlign: 'right' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.surface, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: Colors.expense },
});
