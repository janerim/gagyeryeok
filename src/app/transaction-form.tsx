import { useEffect, useMemo, useRef, useState } from 'react';
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
import { PickerSheet } from '@/components/common/PickerSheet';
import { RecurringLinkCard } from '@/components/transaction/RecurringLinkCard';
import { formatWon } from '@/domain/money';
import { orderByRecentUse } from '@/domain/recent';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { useRecentUse } from '@/hooks/useRecentUse';
import { repositories } from '@/data/repositories';
import { useShallow } from 'zustand/react/shallow';
import { selectVisibleAccounts, useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useRecurringStore } from '@/store/recurringStore';
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
  const recurrings = useRecurringStore((s) => s.items);
  const { add, edit, remove, linkToRecurring, unlinkFromRecurring } = useTransactionStore();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [recurringId, setRecurringId] = useState<string | null>(null);
  const [linkPicker, setLinkPicker] = useState(false);

  const recent = useRecentUse(type);
  const keyboard = useKeyboardInset();

  // 새 거래: 계좌를 직접 고르기 전까지는 이 유형에서 마지막에 쓴 계좌를 미리 선택해 둔다
  const accountPicked = useRef(false);
  useEffect(() => {
    if (isEdit || accountPicked.current) return;
    const last = recent.accountIds.find((rid) => accounts.some((a) => a.id === rid));
    if (last) setAccountId(last);
  }, [isEdit, recent.accountIds, accounts]);

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
      setRecurringId(tx.recurringId);
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

  const linkable = recurrings.filter((r) => r.type === type);

  const onLink = async (rid: string) => {
    if (!id) return;
    try {
      await linkToRecurring(id, rid);
      setRecurringId(rid);
    } catch (e: any) {
      Alert.alert('연결 실패', e?.message ?? String(e));
    }
  };

  const onUnlink = () => {
    if (!id) return;
    Alert.alert('연결 해제', '이 거래를 자동이체에서 분리할까요?\n거래는 그대로 남고, 자동으로 다시 연결되지 않아요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: () =>
          unlinkFromRecurring(id)
            .then(() => setRecurringId(null))
            .catch((e) => Alert.alert('해제 실패', e?.message ?? String(e))),
      },
    ]);
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
    <View style={[styles.screen, { paddingBottom: keyboard.bottom }]}>
      <ScrollView
        ref={keyboard.scrollRef}
        onScroll={keyboard.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {isEdit && (
          <RecurringLinkCard
            recurringId={recurringId}
            recurrings={recurrings}
            canLink={linkable.length > 0}
            // 자동이체를 고치면 이 거래도 바뀔 수 있어, 예전 값이 남은 이 화면은 닫고 넘어간다
            onEdit={(rid) => router.replace({ pathname: '/recurring-form', params: { id: rid } })}
            onUnlink={onUnlink}
            onPressLink={() => setLinkPicker(true)}
            // 저장된 거래 내용으로 등록 화면을 채운다. 이 화면에서 고치고 저장하지 않은 내용은 넘어가지 않는다
            onCreate={() => router.replace({ pathname: '/recurring-form', params: { fromTx: id } })}
          />
        )}

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
          <AccountChips
            accounts={accounts}
            selectedId={accountId}
            onSelect={(aid) => {
              accountPicked.current = true;
              setAccountId(aid);
            }}
          />
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
        keyboardOpen={keyboard.bottom > 0}
      />

      <PickerSheet
        visible={linkPicker}
        title="연결할 자동이체"
        options={linkable.map((r) => ({ key: r.id, label: `${r.name} · ${formatWon(r.amount)}원` }))}
        value={recurringId}
        onSelect={(k) => k && onLink(k)}
        onClose={() => setLinkPicker(false)}
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
