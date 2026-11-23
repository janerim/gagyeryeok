import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';
import { inputStyle } from '@/components/common/Field';
import { FormFooter } from '@/components/common/FormFooter';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { repositories } from '@/data/repositories';
import { formatWon } from '@/domain/money';
import { WEEKDAY_NAMES } from '@/domain/recurring';
import { compareText, retroPeriod, shiftRetroPeriod, summarizeRetro } from '@/domain/retro';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import type { RetroPeriodType, Transaction } from '@/types';

const TYPE_OPTIONS: { key: RetroPeriodType; label: string }[] = [
  { key: 'WEEK', label: '주간' },
  { key: 'MONTH', label: '월간' },
];

const NOTE_PLACEHOLDER: Record<RetroPeriodType, string> = {
  WEEK: '이번 주 소비를 한두 줄로. 예: 금요일 퇴근길 쇼핑을 조심하자',
  MONTH: '이번 달 소비를 한두 줄로. 다음 달에 바꿔 볼 것 하나',
};

/**
 * 회고: 한 주·한 달의 지출을 돌아본다.
 * 위에서부터 자동 요약(지출, 충동 구매, 지난 주기와 비교) → 충동 구매 패턴 → 남긴 리뷰 모아 보기 →
 * 아직 표시하지 않은 지출 → 직접 쓰는 메모
 */
export default function RetroScreen() {
  const params = useLocalSearchParams<{ type?: RetroPeriodType; date?: string }>();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [period, setPeriod] = useState(() =>
    retroPeriod(params.type === 'MONTH' ? 'MONTH' : 'WEEK', params.date ?? today)
  );
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [prevTxs, setPrevTxs] = useState<Transaction[]>([]);
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [saving, setSaving] = useState(false);
  const keyboard = useKeyboardInset();

  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);
  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // 거래를 열어 필수/충동을 표시하고 돌아오면 요약이 바뀌어 있어야 해서, 화면에 올 때마다 다시 읽는다
  useFocusEffect(
    useCallback(() => {
      let stale = false;
      const prev = shiftRetroPeriod(period, -1);
      Promise.all([
        repositories.transaction.listBetween(period.from, period.to),
        repositories.transaction.listBetween(prev.from, prev.to),
      ])
        .then(([cur, before]) => {
          if (stale) return;
          setTxs(cur);
          setPrevTxs(before);
        })
        .catch(console.error);
      return () => {
        stale = true;
      };
    }, [period])
  );

  // 메모는 주기가 바뀔 때만 읽는다 (거래를 보고 돌아왔을 때 쓰던 글이 지워지지 않게)
  useEffect(() => {
    let stale = false;
    repositories.retrospective
      .find(period.type, period.key)
      .then((r) => {
        if (stale) return;
        setSavedNote(r?.note ?? '');
        setNote(r?.note ?? '');
      })
      .catch(console.error);
    return () => {
      stale = true;
    };
  }, [period.type, period.key]);

  const summary = useMemo(() => summarizeRetro(txs, prevTxs), [txs, prevTxs]);
  const dirty = note.trim() !== savedNote;
  const isCurrent = period.key === retroPeriod(period.type, today).key;
  const periodName = period.type === 'WEEK' ? '주' : '달';

  /** 쓰던 메모가 있으면 버릴지 묻고 주기를 바꾼다 */
  const changePeriod = (next: typeof period) => {
    if (next.type === period.type && next.key === period.key) return;
    const go = () => {
      setNote('');
      setSavedNote('');
      setPeriod(next);
    };
    if (!dirty) return go();
    Alert.alert('저장하지 않은 메모', '쓰던 메모를 버리고 이동할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '버리기', style: 'destructive', onPress: go },
    ]);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await repositories.retrospective.save(period.type, period.key, note);
      setSavedNote(note.trim());
      setNote(note.trim());
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const openTx = (id: string) => router.push({ pathname: '/transaction-form', params: { id } });
  const categoryLabel = (id: string | null) => {
    const c = id ? categoryById.get(id) : undefined;
    return c ? `${c.icon ? c.icon + ' ' : ''}${c.name}` : '카테고리 없음';
  };
  const expenseDiff = compareText(period.type, summary.expense, summary.prevExpense, formatWon);
  const impulseDiff = compareText(
    period.type,
    summary.impulse.amount,
    summary.prevImpulse.amount,
    formatWon
  );
  const impulseRatio = summary.expense > 0 ? Math.round((summary.impulse.amount / summary.expense) * 100) : 0;

  return (
    <View style={[styles.screen, { paddingBottom: keyboard.bottom }]}>
      <ScrollView
        ref={keyboard.scrollRef}
        onScroll={keyboard.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.segment}>
          {TYPE_OPTIONS.map((t) => {
            const on = t.key === period.type;
            return (
              <Pressable
                key={t.key}
                // 보고 있던 주기의 시작일이 속한 주·달로 넘어간다. 이번 주기를 보고 있었으면 오늘 기준
                onPress={() => changePeriod(retroPeriod(t.key, isCurrent ? today : period.from))}
                style={[styles.segmentItem, on && styles.segmentItemOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.nav}>
          <Pressable
            onPress={() => changePeriod(shiftRetroPeriod(period, -1))}
            hitSlop={12}
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel={`이전 ${periodName}`}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.navLabel}>{period.label}</Text>
          <Pressable
            onPress={() => changePeriod(shiftRetroPeriod(period, 1))}
            hitSlop={12}
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel={`다음 ${periodName}`}
          >
            <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }} />
          {!isCurrent && (
            <Pressable onPress={() => changePeriod(retroPeriod(period.type, today))} style={styles.todayBtn}>
              <Text style={styles.todayText}>이번 {periodName}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>지출</Text>
            <Text style={[styles.cardValue, { color: Colors.expense }]}>{formatWon(summary.expense)}원</Text>
          </View>
          {expenseDiff && <Text style={styles.cardHint}>{expenseDiff}</Text>}
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>충동 구매 {summary.impulse.count}건</Text>
            <Text style={[styles.cardValue, { color: Colors.impulse }]}>
              {formatWon(summary.impulse.amount)}원
            </Text>
          </View>
          {(summary.impulse.count > 0 || summary.prevImpulse.count > 0) && (
            <Text style={styles.cardHint}>
              {[summary.impulse.count > 0 ? `지출의 ${impulseRatio}%` : null, impulseDiff]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>필수 구매 {summary.needed.count}건</Text>
            <Text style={styles.cardValue}>{formatWon(summary.needed.amount)}원</Text>
          </View>
        </View>

        {summary.impulse.count > 0 && (
          <View>
            <Text style={styles.sectionTitle}>충동 구매가 많았던 곳</Text>
            {summary.impulseByCategory.slice(0, 3).map((c) => (
              <View key={c.categoryId ?? '__none__'} style={styles.patternRow}>
                <Text style={styles.patternLabel} numberOfLines={1}>
                  {categoryLabel(c.categoryId)}
                </Text>
                <Text style={styles.patternCount}>{c.count}건</Text>
                <Text style={styles.patternAmount}>{formatWon(c.amount)}</Text>
              </View>
            ))}
            {summary.impulseWeekday && summary.impulse.count > 1 && (
              <Text style={styles.patternHint}>
                {WEEKDAY_NAMES[summary.impulseWeekday - 1]}요일에 가장 많이 썼어요.
              </Text>
            )}
          </View>
        )}

        <View>
          <Text style={styles.sectionTitle}>남긴 리뷰</Text>
          {summary.reviewed.length === 0 && (
            <Text style={styles.empty}>이 {periodName}에 표시하거나 리뷰를 남긴 지출이 없습니다.</Text>
          )}
          <View style={styles.list}>
            {summary.reviewed.map((t) => (
              <TransactionRow
                key={t.id}
                tx={t}
                accountName={accountName}
                categoryById={categoryById}
                onPress={() => openTx(t.id)}
                showDate
              />
            ))}
          </View>
        </View>

        {summary.unmarked.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>아직 표시하지 않은 지출 {summary.unmarked.length}건</Text>
            <Text style={styles.sectionHint}>눌러서 필수·충동을 표시할 수 있어요.</Text>
            <View style={styles.list}>
              {summary.unmarked.map((t) => (
                <TransactionRow
                  key={t.id}
                  tx={t}
                  accountName={accountName}
                  categoryById={categoryById}
                  onPress={() => openTx(t.id)}
                  showDate
                />
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.sectionTitle}>회고 메모</Text>
          <TextInput
            style={[inputStyle, styles.note]}
            value={note}
            onChangeText={setNote}
            placeholder={NOTE_PLACEHOLDER[period.type]}
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          {!dirty && savedNote !== '' && <Text style={styles.saved}>저장됨</Text>}
        </View>
      </ScrollView>

      {(dirty || keyboard.bottom > 0) && (
        <FormFooter
          saveLabel="메모 저장"
          onSave={onSave}
          saving={saving}
          keyboardOpen={keyboard.bottom > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, gap: 20, paddingBottom: 40 },
  segment: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 10, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  segmentItemOn: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  segmentTextOn: { color: '#fff' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, minWidth: 90, textAlign: 'center' },
  todayBtn: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  todayText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  card: { padding: 16, borderRadius: 12, backgroundColor: Colors.surface, gap: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  cardValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardHint: { marginTop: -4, fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 2 },
  sectionTitle: { marginBottom: 6, fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  sectionHint: { marginTop: -2, marginBottom: 6, fontSize: 12, color: Colors.textSecondary },
  patternRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  patternLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  patternCount: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  patternAmount: { minWidth: 80, textAlign: 'right', fontSize: 15, fontWeight: '700', color: Colors.impulse },
  patternHint: { marginTop: 4, fontSize: 13, color: Colors.textSecondary },
  // 거래 줄은 자기 좌우 여백(16)이 있어서 화면 여백만큼 당긴다
  list: { marginHorizontal: -16 },
  empty: { paddingVertical: 12, fontSize: 13, color: Colors.textSecondary },
  note: { minHeight: 88 },
  saved: { marginTop: 4, fontSize: 12, color: Colors.textSecondary, textAlign: 'right' },
});
