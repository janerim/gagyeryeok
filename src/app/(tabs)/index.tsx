import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, endOfMonth, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { Calendar } from '@/components/calendar/Calendar';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { MonthPickerSheet } from '@/components/calendar/MonthPickerSheet';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';
import { DaySheet } from '@/components/transaction/DaySheet';
import { repositories } from '@/data/repositories';
import { computeBalance, type AccountSums } from '@/domain/balance';
import { sheetShift } from '@/domain/calendar';
import { homeBalance } from '@/domain/homeBalance';
import { formatWon, formatWonShort } from '@/domain/money';
import { scheduledByDate } from '@/domain/recurring';
import { dailyTotals, sumTotals } from '@/domain/stats';
import { selectHomeAccount, useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useRecurringStore } from '@/store/recurringStore';
import { useTransactionStore } from '@/store/transactionStore';

/** 캘린더 홈: 이번 달 요약 + 날짜별 수입·지출, 날짜 탭 시 그날 내역 시트 */
export default function CalendarScreen() {
  const { month, items, setMonth, reload } = useTransactionStore();
  const accounts = useAccountStore((s) => s.accounts);
  const homeAccount = useAccountStore(selectHomeAccount);
  const categories = useCategoryStore((s) => s.categories);
  const recurrings = useRecurringStore((s) => s.items);
  const [selected, setSelected] = useState<string | null>(null);
  // 시트를 닫은 뒤에도 달력에 남겨 두는 마지막으로 누른 날짜
  const [lastPressed, setLastPressed] = useState<string | undefined>();
  // 시트가 누른 날짜를 가리지 않도록 화면을 올리는 데 쓴다
  const [cellBottom, setCellBottom] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const shift = useRef(new Animated.Value(0)).current;
  const [monthPicker, setMonthPicker] = useState(false);
  const [sums, setSums] = useState<Map<string, AccountSums>>(new Map());

  useEffect(() => {
    reload().catch(console.error);
  }, [reload]);

  useEffect(() => {
    Animated.timing(shift, {
      toValue: selected ? -sheetShift(cellBottom, windowHeight, sheetHeight) : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [selected, cellBottom, windowHeight, sheetHeight, shift]);

  // 홈 계좌 잔액: 거래가 바뀔 때마다(items) 전체 기간 합계를 다시 가져온다
  useEffect(() => {
    if (!homeAccount) return;
    repositories.transaction.sumsByAccount().then(setSums).catch(console.error);
  }, [items, homeAccount]);

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

  // 홈 계좌의 쓸 수 있는 돈. 보고 있는 달과 상관없이 "이번 달" 기준
  const home = useMemo(() => {
    if (!homeAccount) return null;
    const tomorrow = format(addDays(parseISO(today), 1), 'yyyy-MM-dd');
    const to = format(endOfMonth(parseISO(today)), 'yyyy-MM-dd');
    const upcoming = [...scheduledByDate(recurrings, tomorrow, to).values()].flat();
    const balance = computeBalance(homeAccount.initialBalance, sums.get(homeAccount.id));
    return homeBalance(homeAccount.id, balance, upcoming, today);
  }, [homeAccount, recurrings, sums, today]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.View style={[styles.content, { transform: [{ translateY: shift }] }]}>
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
              <Pressable
                onPress={() => router.push('/settings')}
                style={[hb.btn, hb.iconBtn]}
                accessibilityRole="button"
                accessibilityLabel="설정"
              >
                <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
              </Pressable>
              <Pressable onPress={() => setMonth(today.slice(0, 7))} style={hb.btn}>
                <Text style={hb.text}>오늘</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/transaction-form')}
                style={[hb.btn, hb.iconBtn, hb.btnPrimary]}
                accessibilityRole="button"
                accessibilityLabel="거래 추가"
              >
                <Ionicons name="add" size={24} color="#fff" />
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

        {home && homeAccount && (
          <Pressable
            onPress={() =>
              router.navigate({ pathname: '/history', params: { accountId: homeAccount.id } })
            }
            style={({ pressed }) => [styles.home, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.homeSub}>
              {homeAccount.name} {formatWon(home.balance)}원
              {home.scheduledIn - home.scheduledOut !== 0 &&
                ` · 예정 자동이체 ${signedWon(home.scheduledIn - home.scheduledOut)}`}
            </Text>
            <View style={styles.homeRow}>
              <Text style={styles.homeLine}>
                쓸 수 있는{' '}
                <Text style={[styles.homeAvailable, home.available < 0 && { color: Colors.expense }]}>
                  {formatWon(home.available)}원
                </Text>
              </Text>
              <Text style={styles.homeSub}>
                {home.daysLeft}일 남음 · 하루 {formatWonShort(home.perDay)}
              </Text>
            </View>
          </Pressable>
        )}

        <Calendar
          month={month}
          today={today}
          selected={lastPressed}
          onSwipeLeft={() => shiftMonth(1)}
          onSwipeRight={() => shiftMonth(-1)}
          onPressDay={(day, e) => {
            // 다른 달 날짜를 누르면 그 달로 이동만 한다 (그 달 내역은 아직 안 불러왔으므로)
            if (!day.inMonth) shiftMonth(day.date < `${month}-01` ? -1 : 1);
            else {
              const cell = e.currentTarget;
            if (typeof cell !== 'number') {
              cell.measureInWindow((_x, y, _w, h) => setCellBottom(y + h));
            }
              setSelected(day.date);
              setLastPressed(day.date);
            }
          }}
          renderWeek={(week) => {
            // 그 주의 실제 지출 합계. 예정 자동이체는 넣지 않는다
            const expense = week.reduce((sum, d) => sum + (byDay.get(d.date)?.expense ?? 0), 0);
            if (expense === 0) return null;
            return (
              <Text style={[styles.cellAmount, styles.weekAmount]} numberOfLines={1}>
                {`-${formatWonShort(expense)}`}
              </Text>
            );
          }}
          renderDay={(day) => {
            if (!day.inMonth) return null;
            const t = byDay.get(day.date);
            // 예정 자동이체도 이체는 칸에 표시하지 않는다 (수입·지출만)
            const planned = scheduled.get(day.date) ?? [];
            const plannedSum = (type: 'INCOME' | 'EXPENSE') =>
              planned.filter((r) => r.type === type).reduce((sum, r) => sum + r.amount, 0);
            const plannedIncome = plannedSum('INCOME');
            const plannedExpense = plannedSum('EXPENSE');
            if (!t && plannedIncome === 0 && plannedExpense === 0) return null;
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
                {plannedIncome > 0 && (
                  <Text
                    style={[styles.cellAmount, styles.planned, { color: Colors.income }]}
                    numberOfLines={1}
                  >
                    {`+${formatWonShort(plannedIncome)}`}
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
      </Animated.View>
      {/* 화면이 올라가도 내용이 상태바 글자와 겹치지 않게 가린다 */}
      <View style={[styles.statusBarCover, { height: topInset }]} />

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
        onHeightChange={setSheetHeight}
        onEdit={(id) => router.push({ pathname: '/transaction-form', params: { id } })}
        onAdd={(date) => router.push({ pathname: '/transaction-form', params: { date } })}
        onEditRecurring={(id) => router.push({ pathname: '/recurring-form', params: { id } })}
      />
    </SafeAreaView>
  );
}

const signedWon = (n: number) => `${n < 0 ? '−' : '+'}${formatWon(Math.abs(n))}`;

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
  content: { flex: 1 },
  statusBarCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
  },
  summary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  home: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    gap: 2,
  },
  homeRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  homeLine: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  homeAvailable: { fontSize: 17, fontWeight: '800' },
  homeSub: { fontSize: 12, color: Colors.primaryDark },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  cellAmount: { fontSize: 10, fontWeight: '600', letterSpacing: -0.3 },
  weekAmount: { color: Colors.expense, fontWeight: '700', paddingTop: 1 },
  planned: { opacity: 0.55 },
});
