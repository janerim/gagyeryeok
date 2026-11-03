import { useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { formatWon } from '@/domain/money';
import { sumTotals } from '@/domain/stats';
import type { Category, Transaction } from '@/types';
import { TransactionRow } from './TransactionRow';

type Props = {
  date: string | null; // null이면 닫힘
  items: Transaction[]; // 해당 날짜 거래
  accountName: Map<string, string>;
  categoryById: Map<string, Category>;
  onClose: () => void;
  onEdit: (id: string) => void;
  onAdd: (date: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 달력에서 날짜를 누르면 올라오는 그날 내역 시트 */
export function DaySheet({ date, items, accountName, categoryById, onClose, onEdit, onAdd }: Props) {
  // iOS는 시트가 닫히는 도중에 모달 화면을 띄우면 무시되므로, 완전히 닫힌 뒤(onDismiss) 이동한다
  const pending = useRef<(() => void) | null>(null);
  const closeThen = (action: () => void) => {
    pending.current = action;
    onClose();
  };
  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const d = date ? parseISO(date) : null;
  const totals = sumTotals(items);

  return (
    <Modal
      visible={date !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={runPending}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {d ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})` : ''}
            </Text>
            <Pressable
              onPress={() => date && closeThen(() => onAdd(date))}
              style={styles.addBtn}
              hitSlop={8}
            >
              <Text style={styles.addBtnText}>+ 추가</Text>
            </Pressable>
          </View>
          {items.length > 0 && (
            <Text style={styles.summary}>
              수입 <Text style={{ color: Colors.income }}>{formatWon(totals.income)}</Text>
              {'   '}지출 <Text style={{ color: Colors.expense }}>{formatWon(totals.expense)}</Text>
            </Text>
          )}
          <ScrollView style={{ maxHeight: 400 }}>
            {items.map((t) => (
              <TransactionRow
                key={t.id}
                tx={t}
                accountName={accountName}
                categoryById={categoryById}
                onPress={() => closeThen(() => onEdit(t.id))}
              />
            ))}
            {items.length === 0 && <Text style={styles.empty}>내역이 없습니다</Text>}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
  },
  addBtnText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
  summary: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  empty: { paddingVertical: 28, textAlign: 'center', color: Colors.textSecondary },
});
