import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';
import { Colors } from '@/constants/colors';
import { AmountInput } from '@/components/common/AmountInput';
import { Chip } from '@/components/common/Chip';
import { DateStepper } from '@/components/common/DateStepper';
import { Field, inputStyle } from '@/components/common/Field';
import { nextOccurrence, scheduleLabel } from '@/domain/recurring';
import { selectVisibleAccounts, useAccountStore } from '@/store/accountStore';
import { selectActiveCategories, useCategoryStore } from '@/store/categoryStore';
import { useRecurringStore } from '@/store/recurringStore';
import type { RecurringCycle, RecurringInput, RecurringType } from '@/types';

const TYPE_OPTIONS: { key: RecurringType; label: string; color: string }[] = [
  { key: 'EXPENSE', label: '지출', color: Colors.expense },
  { key: 'TRANSFER', label: '이체', color: Colors.transfer },
];

const CYCLE_OPTIONS: { key: RecurringCycle; label: string }[] = [
  { key: 'MONTHLY', label: '매월' },
  { key: 'YEARLY', label: '매년' },
];

export default function RecurringFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const existing = useRecurringStore((s) => s.items.find((r) => r.id === id));
  const { add, edit, remove, currentPeriodTransactions, applyToTransactions } = useRecurringStore();
  const accounts = useAccountStore(useShallow(selectVisibleAccounts));
  const categories = useCategoryStore(useShallow(selectActiveCategories('EXPENSE')));

  const today = format(new Date(), 'yyyy-MM-dd');
  const [name, setName] = useState('');
  const [type, setType] = useState<RecurringType>('EXPENSE');
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [cycle, setCycle] = useState<RecurringCycle>('MONTHLY');
  const [billingDayText, setBillingDayText] = useState(String(new Date().getDate()));
  const [startDate, setStartDate] = useState(today);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setType(existing.type);
    setAmount(existing.amount);
    setCategoryId(existing.categoryId);
    setAccountId(existing.accountId);
    setToAccountId(existing.toAccountId);
    setCycle(existing.cycle);
    setBillingDayText(String(existing.billingDay));
    setStartDate(existing.startDate);
  }, [existing]);

  const billingDay = Number(billingDayText);
  const validDay = Number.isInteger(billingDay) && billingDay >= 1 && billingDay <= 31;

  const preview = useMemo(() => {
    if (!validDay) return null;
    const schedule = { cycle, billingDay, startDate, endDate: existing?.endDate ?? null };
    // 시작일이 미래면 nextOccurrence가 시작일부터 찾아 준다
    return { label: scheduleLabel(schedule), next: nextOccurrence(schedule, today) };
  }, [validDay, cycle, billingDay, startDate, today, existing?.endDate]);

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('이름을 입력해 주세요');
    if (amount <= 0) return Alert.alert('금액을 입력해 주세요');
    if (!accountId) return Alert.alert('출금 계좌를 선택해 주세요');
    if (type === 'TRANSFER') {
      if (!toAccountId) return Alert.alert('입금 계좌를 선택해 주세요');
      if (toAccountId === accountId) return Alert.alert('출금 계좌와 입금 계좌가 같습니다');
    } else if (!categoryId) {
      return Alert.alert('카테고리를 선택해 주세요');
    }
    if (!validDay) return Alert.alert('출금일은 1~31 사이로 입력해 주세요');

    const input: RecurringInput = {
      name: name.trim(),
      type,
      amount,
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : null,
      categoryId: type === 'EXPENSE' ? categoryId : null,
      cycle,
      billingDay,
      startDate,
      endDate: existing?.endDate ?? null,
    };
    setSaving(true);
    try {
      if (!isEdit || !id) {
        await add(input);
        return router.back();
      }
      await edit(id, input);
      // 이번 주기 거래가 이미 있으면 그것도 바꿀지 묻는다 (지난 주기 거래는 건드리지 않음)
      const updated = useRecurringStore.getState().items.find((r) => r.id === id);
      const txs = updated ? await currentPeriodTransactions(updated) : [];
      if (!updated || txs.length === 0) return router.back();
      Alert.alert(
        '이미 기록된 거래',
        `${cycle === 'MONTHLY' ? '이번 달' : '올해'}에 이미 기록된 거래(${txs
          .map((t) => format(parseISO(t.date), 'M/d'))
          .join(', ')})도 바꿀까요?`,
        [
          { text: '앞으로만', style: 'cancel', onPress: () => router.back() },
          {
            text: '같이 수정',
            onPress: () =>
              applyToTransactions(updated, txs)
                .then(() => router.back())
                .catch((e) => Alert.alert('수정 실패', e?.message ?? String(e))),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert('삭제', '이 자동이체를 삭제할까요?\n이미 기록된 거래는 그대로 남습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await remove(id);
          router.back();
        },
      },
    ]);
  };

  if (accounts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noticeText}>자동이체를 등록하려면 계좌가 하나 이상 필요합니다.</Text>
        <Pressable onPress={() => router.replace('/account-form')} style={styles.saveBtn}>
          <Text style={styles.saveText}>계좌 추가</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <Field label="이름">
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="예: 넷플릭스, 생활비 이체"
            placeholderTextColor={Colors.textSecondary}
            autoFocus={!isEdit}
          />
        </Field>

        <Field label="유형">
          <View style={styles.chips}>
            {TYPE_OPTIONS.map((t) => (
              <Chip
                key={t.key}
                label={t.label}
                selected={t.key === type}
                color={t.color}
                onPress={() => setType(t.key)}
              />
            ))}
          </View>
        </Field>

        <Field label="금액">
          <AmountInput value={amount} onChange={setAmount} />
        </Field>

        {type === 'EXPENSE' && (
          <Field label="카테고리">
            <View style={styles.chips}>
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.icon ? c.icon + ' ' : ''}${c.name}`}
                  selected={c.id === categoryId}
                  color={Colors.expense}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>
          </Field>
        )}

        <Field label="출금 계좌">
          <View style={styles.chips}>
            {accounts.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                selected={a.id === accountId}
                onPress={() => setAccountId(a.id)}
              />
            ))}
          </View>
        </Field>

        {type === 'TRANSFER' && (
          <Field label="입금 계좌">
            <View style={styles.chips}>
              {accounts.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  selected={a.id === toAccountId}
                  onPress={() => setToAccountId(a.id)}
                />
              ))}
            </View>
          </Field>
        )}

        <Field label="주기">
          <View style={styles.chips}>
            {CYCLE_OPTIONS.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                selected={c.key === cycle}
                onPress={() => setCycle(c.key)}
              />
            ))}
          </View>
        </Field>

        <Field label="출금일">
          <View style={styles.dayRow}>
            <TextInput
              style={[inputStyle, styles.dayInput]}
              value={billingDayText}
              onChangeText={(t) => setBillingDayText(t.replace(/[^\d]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <Text style={styles.dayUnit}>일</Text>
            <Text style={styles.dayHint}>31일은 짧은 달에 말일로 처리돼요</Text>
          </View>
        </Field>

        <Field label={cycle === 'YEARLY' ? '시작일 (이 날짜의 월이 매년 출금 월)' : '시작일'}>
          <DateStepper value={startDate} onChange={setStartDate} />
        </Field>

        {preview && (
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              {preview.label}
              {preview.next ? ` · 다음 출금 ${format(parseISO(preview.next), 'yyyy.MM.dd')}` : ''}
            </Text>
            <Text style={styles.previewSub}>
              시작일 이후 출금일이 되면 앱을 열 때 자동으로 기록돼요.
            </Text>
          </View>
        )}

        {isEdit && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>삭제</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        >
          <Text style={styles.saveText}>{isEdit ? '수정' : '저장'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  noticeText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayInput: { width: 64, textAlign: 'center' },
  dayUnit: { fontSize: 15, color: Colors.textPrimary },
  dayHint: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  preview: { padding: 14, borderRadius: 10, backgroundColor: Colors.primaryLight, gap: 4 },
  previewText: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  previewSub: { fontSize: 12, color: Colors.primaryDark },
  deleteBtn: { alignItems: 'center', paddingVertical: 12 },
  deleteText: { color: Colors.danger, fontSize: 15, fontWeight: '600' },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
