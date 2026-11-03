import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { addMonths, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { TX_TYPES, TX_TYPE_LABELS } from '@/constants/labels';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { PickerSheet } from '@/components/common/PickerSheet';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';
import { formatWon } from '@/domain/money';
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
  const [sheet, setSheet] = useState<SheetKind>(null);

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
        return true;
      }),
    [items, typeFilter, accountFilter, categoryFilter]
  );

  const sections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return [...map.entries()].map(([date, data]) => ({ date, data }));
  }, [filtered]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === 'INCOME') income += t.amount;
      else if (t.type === 'EXPENSE') expense += t.amount;
    }
    return { income, expense };
  }, [filtered]);

  const monthDate = parseISO(`${month}-01`);
  const shiftMonth = (d: number) => setMonth(format(addMonths(monthDate, d), 'yyyy-MM'));

  const confirmDelete = (t: Transaction) =>
    Alert.alert('삭제', '이 거래를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(t.id) },
    ]);

  const describe = (t: Transaction) => {
    if (t.type === 'TRANSFER') {
      return `${accountName.get(t.accountId) ?? '?'} → ${accountName.get(t.toAccountId ?? '') ?? '?'}`;
    }
    const c = t.categoryId ? categoryById.get(t.categoryId) : undefined;
    return c ? `${c.icon ? c.icon + ' ' : ''}${c.name}` : '카테고리 없음';
  };

  const amountText = (t: Transaction) => {
    const n = formatWon(t.amount);
    if (t.type === 'EXPENSE') return `-${n}`;
    if (t.type === 'INCOME') return `+${n}`;
    return n;
  };

  const amountColor = (t: Transaction) =>
    t.type === 'EXPENSE' ? Colors.expense : t.type === 'INCOME' ? Colors.income : Colors.transfer;

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
          />
        }
        right={
          <Pressable
            onPress={() => router.push('/transaction-form')}
            style={[hb.btn, hb.btnPrimary]}
          >
            <Text style={hb.textPrimary}>+</Text>
          </Pressable>
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
        renderSectionHeader={({ section }) => {
          const d = parseISO(section.date);
          return (
            <Text style={styles.sectionHeader}>
              {`${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`}
            </Text>
          );
        }}
        renderItem={({ item }) => (
          <ReanimatedSwipeable
            renderRightActions={() => (
              <Pressable onPress={() => confirmDelete(item)} style={styles.deleteAction}>
                <Text style={styles.deleteActionText}>삭제</Text>
              </Pressable>
            )}
            overshootRight={false}
          >
            <Pressable
              onPress={() => router.push({ pathname: '/transaction-form', params: { id: item.id } })}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{describe(item)}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {[
                    item.type === 'TRANSFER' ? null : accountName.get(item.accountId) ?? '?',
                    item.memo,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Text style={[styles.rowAmount, { color: amountColor(item) }]}>
                {amountText(item)}
              </Text>
            </Pressable>
          </ReanimatedSwipeable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {items.length === 0 ? '이번 달 내역이 없습니다.' : '필터에 맞는 내역이 없습니다.'}
            </Text>
          </View>
        }
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
    <Pressable onPress={onPress} style={[styles.filterBtn, active && styles.filterBtnActive]}>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSub: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
  rowAmount: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
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
