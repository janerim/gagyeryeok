import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, addMonths, endOfMonth, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { Calendar } from '@/components/calendar/Calendar';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { MonthPickerSheet } from '@/components/calendar/MonthPickerSheet';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';
import { DaySheet } from '@/components/transaction/DaySheet';
import { formatWon, formatWonShort } from '@/domain/money';
import { scheduledByDate } from '@/domain/recurring';
import { dailyTotals, sumTotals } from '@/domain/stats';
import { useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useRecurringStore } from '@/store/recurringStore';
import { useTransactionStore } from '@/store/transactionStore';

/** 캘린더 홈: 이번 달 요약 + 날짜별 수입·지출, 날짜 탭 시 그날 내역 시트 */
export default function CalendarScreen() {
  const { month, items, setMonth, reload } = useTransactionStore();
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);
  const recurrings = useRecurringStore((s) => s.items);
  const [selected, setSelected] = useState<string | null>(null);
  const [monthPicker, setMonthPicker] = useState(false);

  useEffect(() => {
    reload().catch(console.error);
  }, [reload]);

  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const byDay = useMemo(() => dailyTotals(items), [items]);
  const totals = useMemo(() => sumTotals(items), [items]);
  const selectedItems = useMemo(
    () => (selected ? items.filter((t) => t.date === selected) : []),
    [items, selected]
  );

  const monthDate = parseISO(`${month}-01`);
  const shiftMonth = (d: number) => setMonth(format(addMonths(monthDate, d), 'yyyy-MM'));
  const today = format(new Date(), 'yyyy-MM-dd');

  // 내일부터 이 달 말까지 출금 예정인 자동이체 (오늘까지는 이미 거래로 기록됨)
  const scheduled = useMemo(() => {
    const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');
    const from = tomorrow > `${month}-01` ? tomorrow : `${month}-01`;
    const to = format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd');
    return scheduledByDate(recurrings, from, to);
  }, [recurrings, month, today]);
  const net = totals.income - totals.expense;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        left={
          <MonthNavigator
            date={monthDate}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            onPressLabel={() => setMonthPicker(true)}
          />
        }
        right={
          <>
            <Pressable onPress={() => router.push('/settings')} style={hb.btn}>
              <Text style={[hb.text, styles.gear]}>⚙︎</Text>
            </Pressable>
            <Pressable onPress={() => setMonth(today.slice(0, 7))} style={hb.btn}>
              <Text style={hb.text}>오늘</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/transaction-form')}
              style={[hb.btn, hb.btnPrimary]}
            >
              <Text style={hb.textPrimary}>+</Text>
            </Pressable>
          </>
        }
      />

      <View style={styles.summary}>
        <SummaryItem label="수입" value={formatWon(totals.income)} color={Colors.income} />
        <SummaryItem label="지출" value={formatWon(totals.expense)} color={Colors.expense} />
        <SummaryItem
          label="합계"
          value={(net > 0 ? '+' : '') + formatWon(net)}
          color={Colors.textPrimary}
        />
      </View>

      <Calendar
        month={month}
        today={today}
        onSwipeLeft={() => shiftMonth(1)}
        onSwipeRight={() => shiftMonth(-1)}
        onPressDay={(day) => {
          // 다른 달 날짜를 누르면 그 달로 이동만 한다 (그 달 내역은 아직 안 불러왔으므로)
          if (!day.inMonth) shiftMonth(day.date < `${month}-01` ? -1 : 1);
          else setSelected(day.date);
        }}
        renderDay={(day) => {
          if (!day.inMonth) return null;
          const t = byDay.get(day.date);
          // 예정 자동이체도 이체는 칸에 표시하지 않는다 (지출만)
          const plannedExpense = (scheduled.get(day.date) ?? [])
            .filter((r) => r.type === 'EXPENSE')
            .reduce((sum, r) => sum + r.amount, 0);
          if (!t && plannedExpense === 0) return null;
          return (
            <>
              {t && t.income > 0 && (
                <Text style={[styles.cellAmount, { color: Colors.income }]} numberOfLines={1}>
                  {`+${formatWonShort(t.income)}`}
                </Text>
              )}
              {t && t.expense > 0 && (
                <Text style={[styles.cellAmount, { color: Colors.expense }]} numberOfLines={1}>
                  {`-${formatWonShort(t.expense)}`}
                </Text>
              )}
              {plannedExpense > 0 && (
                <Text
                  style={[styles.cellAmount, styles.planned, { color: Colors.expense }]}
                  numberOfLines={1}
                >
                  {`-${formatWonShort(plannedExpense)}`}
                </Text>
              )}
            </>
          );
        }}
      />

      <MonthPickerSheet
        visible={monthPicker}
        month={month}
        onSelect={(m) => setMonth(m).catch(console.error)}
        onClose={() => setMonthPicker(false)}
      />
      <DaySheet
        date={selected}
        items={selectedItems}
        scheduled={selected ? scheduled.get(selected) : undefined}
        accountName={accountName}
        categoryById={categoryById}
        onClose={() => setSelected(null)}
        onEdit={(id) => router.push({ pathname: '/transaction-form', params: { id } })}
        onAdd={(date) => router.push({ pathname: '/transaction-form', params: { date } })}
        onEditRecurring={(id) => router.push({ pathname: '/recurring-form', params: { id } })}
      />
    </SafeAreaView>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  gear: { fontSize: 28, lineHeight: 32 },
  summary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  cellAmount: { fontSize: 10, fontWeight: '600', letterSpacing: -0.3 },
  planned: { opacity: 0.4 },
});
