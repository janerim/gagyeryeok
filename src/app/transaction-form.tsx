import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';
import { TX_TYPES, TX_TYPE_LABELS } from '@/constants/labels';
import { AmountInput } from '@/components/common/AmountInput';
import { Chip } from '@/components/common/Chip';
import { DateStepper } from '@/components/common/DateStepper';
import { Field, inputStyle } from '@/components/common/Field';
import { FormFooter } from '@/components/common/FormFooter';
import { orderByRecentUse } from '@/domain/recent';
import { useRecentUse } from '@/hooks/useRecentUse';
import { repositories } from '@/data/repositories';
import { useShallow } from 'zustand/react/shallow';
import { selectVisibleAccounts, useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useTransactionStore } from '@/store/transactionStore';
import type { Account, TransactionInput, TransactionType } from '@/types';

const TYPE_COLOR: Record<TransactionType, string> = {
  EXPENSE: Colors.expense,
  INCOME: Colors.income,
  TRANSFER: Colors.transfer,
};

export default function TransactionFormScreen() {
  const { id, date: initialDate } = useLocalSearchParams<{ id?: string; date?: string }>();
  const isEdit = !!id;

  const accounts = useAccountStore(useShallow(selectVisibleAccounts));
  const categories = useCategoryStore((s) => s.categories);
  const { add, edit, remove } = useTransactionStore();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const recent = useRecentUse(type);

  // 수정 모드: 기존 거래 불러오기
  useEffect(() => {
    if (!id) return;
    repositories.transaction.findById(id).then((tx) => {
      if (!tx) return;
      setType(tx.type);
      setAmount(tx.amount);
      setCategoryId(tx.categoryId);
      setAccountId(tx.accountId);
      setToAccountId(tx.toAccountId);
      setDate(tx.date);
      setMemo(tx.memo ?? '');
    });
  }, [id]);

  const categoryOptions = useMemo(() => {
    if (type === 'TRANSFER') return [];
    const active = categories.filter((c) => c.deletedAt === null && c.type === type);
    return orderByRecentUse(active, recent.categoryIds);
  }, [categories, type, recent.categoryIds]);

  const changeType = (t: TransactionType) => {
    setType(t);
    setCategoryId(null); // 지출/수입 카테고리가 다르므로 초기화
    if (t !== 'TRANSFER') setToAccountId(null);
  };

  const onSave = async () => {
    if (amount <= 0) return Alert.alert('금액을 입력해 주세요');
    if (!accountId) return Alert.alert(type === 'INCOME' ? '입금 계좌를 선택해 주세요' : '출금 계좌를 선택해 주세요');
    if (type === 'TRANSFER') {
      if (!toAccountId) return Alert.alert('입금 계좌를 선택해 주세요');
      if (toAccountId === accountId) return Alert.alert('출금 계좌와 입금 계좌가 같습니다');
    } else if (!categoryId) {
      return Alert.alert('카테고리를 선택해 주세요');
    }

    const payload: TransactionInput = {
      type,
      amount,
      date,
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : null,
      categoryId: type === 'TRANSFER' ? null : categoryId,
      memo: memo.trim() || null,
    };
    setSaving(true);
    try {
      if (isEdit && id) await edit(id, payload);
      else await add(payload);
      router.back();
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert('삭제', '이 거래를 삭제할까요?', [
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
        <Text style={styles.noticeText}>거래를 입력하려면 계좌가 하나 이상 필요합니다.</Text>
        <Pressable onPress={() => router.replace('/account-form')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>계좌 추가</Text>
        </Pressable>
      </View>
    );
  }

  const accountLabel = type === 'INCOME' ? '입금 계좌' : '출금 계좌';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        {/* 유형 세그먼트 */}
        <View style={styles.segment}>
          {TX_TYPES.map((t) => {
            const on = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => changeType(t)}
                style={[styles.segmentItem, on && { backgroundColor: TYPE_COLOR[t] }]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                  {TX_TYPE_LABELS[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AmountInput value={amount} onChange={setAmount} autoFocus={!isEdit} large />

        <Field label="메모 (선택)">
          <TextInput
            style={inputStyle}
            value={memo}
            onChangeText={setMemo}
            placeholder="예: 점심, 넷플릭스"
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="done"
          />
        </Field>

        {type !== 'TRANSFER' && (
          <Field label="카테고리">
            <View style={styles.chips}>
              {categoryOptions.map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.icon ? c.icon + ' ' : ''}${c.name}`}
                  selected={c.id === categoryId}
                  onPress={() => setCategoryId(c.id)}
                  color={TYPE_COLOR[type]}
                />
              ))}
              {categoryOptions.length === 0 && (
                <Pressable onPress={() => router.push('/settings/categories')}>
                  <Text style={styles.link}>카테고리가 없습니다. 추가하기 ›</Text>
                </Pressable>
              )}
            </View>
          </Field>
        )}

        <Field label={accountLabel}>
          <AccountChips accounts={accounts} selectedId={accountId} onSelect={setAccountId} />
        </Field>

        {type === 'TRANSFER' && (
          <Field label="입금 계좌">
            <AccountChips accounts={accounts} selectedId={toAccountId} onSelect={setToAccountId} />
          </Field>
        )}

        <Field label="날짜" inline>
          <DateStepper value={date} onChange={setDate} />
        </Field>
      </ScrollView>

      <FormFooter
        saveLabel={isEdit ? '수정' : '저장'}
        onSave={onSave}
        saving={saving}
        onDelete={isEdit ? onDelete : undefined}
      />
    </View>
  );
}

/** 계좌 관리에서 정한 순서대로 한 줄에. 카드는 색으로 통장과 구분한다 */
function AccountChips({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {accounts.map((a) => (
        <Chip
          key={a.id}
          label={a.name}
          selected={a.id === selectedId}
          onPress={() => onSelect(a.id)}
          tinted={a.type === 'CARD'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  noticeText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  segmentTextOn: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  link: { color: Colors.primary, fontSize: 14, paddingVertical: 8 },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
