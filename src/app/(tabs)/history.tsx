import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { addMonths, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { TX_TYPES, TX_TYPE_LABELS } from '@/constants/labels';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { MonthPickerSheet } from '@/components/calendar/MonthPickerSheet';
import { PickerSheet } from '@/components/common/PickerSheet';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { formatWon } from '@/domain/money';
import { sumTotals } from '@/domain/stats';
import { useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction, TransactionType } from '@/types';

type SheetKind = 'type' | 'account' | 'category' | null;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HistoryScreen() {
  const { month, items, setMonth, reload, remove } = useTransactionStore();
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);

  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [query, setQuery] = useState(''); // 메모 검색어. 보고 있는 달 안에서만 찾는다
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [monthPicker, setMonthPicker] = useState(false);
  const keyword = query.trim().toLowerCase();
  const hasFilter = !!(typeFilter || accountFilter || categoryFilter || keyword);
  const clearFilters = () => {
    setTypeFilter(null);
    setAccountFilter(null);
    setCategoryFilter(null);
    setQuery('');
  };

  // 계좌 탭·통계 탭에서 계좌/카테고리를 눌러 들어오면 그것만으로 필터
  const { accountId: accountParam, categoryId: categoryParam } = useLocalSearchParams<{
    accountId?: string;
    categoryId?: string;
  }>();
  useEffect(() => {
    if (!accountParam && !categoryParam) return;
    setTypeFilter(null);
    setAccountFilter(accountParam ?? null);
    setCategoryFilter(categoryParam ?? null);
    // 파라미터를 비워 둬야 같은 항목으로 다시 들어와도 필터가 다시 걸린다
    router.setParams({ accountId: undefined, categoryId: undefined });
  }, [accountParam, categoryParam]);

  useEffect(() => {
    reload().catch(console.error);
  }, [reload]);

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filtered = useMemo(
    () =>
      items.filter((t) => {
        if (typeFilter && t.type !== typeFilter) return false;
        if (accountFilter && t.accountId !== accountFilter && t.toAccountId !== accountFilter)
          return false;
        if (categoryFilter && t.categoryId !== categoryFilter) return false;
        if (keyword && !(t.memo ?? '').toLowerCase().includes(keyword)) return false;
        return true;
      }),
    [items, typeFilter, accountFilter, categoryFilter, keyword]
  );

  const sections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return [...map.entries()].map(([date, data]) => ({ date, data }));
  }, [filtered]);

  const totals = useMemo(() => sumTotals(filtered), [filtered]);

  const monthDate = parseISO(`${month}-01`);
  const shiftMonth = (d: number) => setMonth(format(addMonths(monthDate, d), 'yyyy-MM'));

  // 취소하면 밀어서 열린 줄을 다시 닫는다
  const confirmDelete = (t: Transaction, close: () => void) =>
    Alert.alert('삭제', '이 거래를 삭제할까요?', [
      { text: '취소', style: 'cancel', onPress: close },
      { text: '삭제', style: 'destructive', onPress: () => remove(t.id) },
    ]);

  const filterLabel = (value: string | null, fallback: string, lookup: (v: string) => string) =>
    value ? lookup(value) : fallback;

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
            <Pressable onPress={() => setMonth(format(new Date(), 'yyyy-MM'))} style={hb.btn}>
              <Text style={hb.text}>이번 달</Text>
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

      <View style={styles.filters}>
        <FilterButton
          label={filterLabel(typeFilter, '유형', (v) => TX_TYPE_LABELS[v as TransactionType])}
          active={!!typeFilter}
          onPress={() => setSheet('type')}
        />
        <FilterButton
          label={filterLabel(accountFilter, '계좌', (v) => accountName.get(v) ?? '?')}
          active={!!accountFilter}
          onPress={() => setSheet('account')}
        />
        <FilterButton
          label={filterLabel(categoryFilter, '카테고리', (v) => categoryById.get(v)?.name ?? '?')}
          active={!!categoryFilter}
          onPress={() => setSheet('category')}
        />
        {hasFilter && (
          <Pressable
            onPress={clearFilters}
            style={styles.resetBtn}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="필터 초기화"
          >
            <Text style={styles.resetText}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="메모 검색"
          placeholderTextColor={Colors.textSecondary}
          clearButtonMode="while-editing"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          수입 <Text style={{ color: Colors.income }}>{formatWon(totals.income)}</Text>
        </Text>
        <Text style={styles.summaryText}>
          지출 <Text style={{ color: Colors.expense }}>{formatWon(totals.expense)}</Text>
        </Text>
        <Text style={styles.summaryText}>{filtered.length}건</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => {
          const d = parseISO(section.date);
          // 그날 합계. 필터·검색이 걸려 있으면 보이는 거래만 더한다
          const day = sumTotals(section.data);
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {`${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`}
              </Text>
              <Text style={styles.sectionTotals}>
                {day.income > 0 && (
                  <Text style={{ color: Colors.income }}>{`+${formatWon(day.income)}`}</Text>
                )}
                {day.income > 0 && day.expense > 0 && '  '}
                {day.expense > 0 && (
                  <Text style={{ color: Colors.expense }}>{`-${formatWon(day.expense)}`}</Text>
                )}
              </Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <ReanimatedSwipeable
            renderRightActions={(_progress, _translation, swipeable) => (
              <Pressable
                onPress={() => confirmDelete(item, swipeable.close)}
                style={styles.deleteAction}
              >
                <Text style={styles.deleteActionText}>삭제</Text>
              </Pressable>
            )}
            overshootRight={false}
          >
            <TransactionRow
              tx={item}
              accountName={accountName}
              categoryById={categoryById}
              onPress={() => router.push({ pathname: '/transaction-form', params: { id: item.id } })}
            />
          </ReanimatedSwipeable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {items.length === 0 ? '이번 달 내역이 없습니다.' : '조건에 맞는 내역이 없습니다.'}
            </Text>
          </View>
        }
      />

      <MonthPickerSheet
        visible={monthPicker}
        month={month}
        onSelect={(m) => setMonth(m).catch(console.error)}
        onClose={() => setMonthPicker(false)}
      />
      <PickerSheet
        visible={sheet === 'type'}
        title="유형"
        allowAll
        options={TX_TYPES.map((t) => ({ key: t, label: TX_TYPE_LABELS[t] }))}
        value={typeFilter}
        onSelect={(k) => setTypeFilter(k as TransactionType | null)}
        onClose={() => setSheet(null)}
      />
      <PickerSheet
        visible={sheet === 'account'}
        title="계좌"
        allowAll
        options={accounts.map((a) => ({ key: a.id, label: a.name }))}
        value={accountFilter}
        onSelect={setAccountFilter}
        onClose={() => setSheet(null)}
      />
      <PickerSheet
        visible={sheet === 'category'}
        title="카테고리"
        allowAll
        options={categories
          .filter((c) => c.deletedAt === null)
          .map((c) => ({ key: c.id, label: `${TX_TYPE_LABELS[c.type]} · ${c.name}` }))}
        value={categoryFilter}
        onSelect={setCategoryFilter}
        onClose={() => setSheet(null)}
      />
    </SafeAreaView>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      accessibilityRole="button"
      accessibilityLabel={`${label} 필터`}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>
        {label} ▾
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.primaryDark },
  resetBtn: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  search: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  summaryText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  list: { paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  sectionTotals: { fontSize: 15, fontWeight: '800' },
  deleteAction: {
    width: 80,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: { color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
});
