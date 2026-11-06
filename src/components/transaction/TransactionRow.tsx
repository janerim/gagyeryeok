import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { formatWon } from '@/domain/money';
import type { Category, Transaction } from '@/types';

type Props = {
  tx: Transaction;
  accountName: Map<string, string>;
  categoryById: Map<string, Category>;
  onPress: () => void;
};

const describe = (t: Transaction, accountName: Map<string, string>, categoryById: Map<string, Category>) => {
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

/** 거래 한 줄: 카테고리(이체는 계좌 → 계좌), 계좌·자동이체 여부·메모, 금액 */
export function TransactionRow({ tx, accountName, categoryById, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{describe(tx, accountName, categoryById)}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {/* 메모가 길어 잘려도 보이도록 자동이체를 메모 앞에 둔다 */}
          {[
            tx.type === 'TRANSFER' ? null : accountName.get(tx.accountId) ?? '?',
            tx.recurringId ? '자동이체' : null,
            tx.memo,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor(tx) }]}>{amountText(tx)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sub: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
  amount: { fontSize: 16, fontWeight: '700', marginLeft: 12 },
});
