import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Recurring } from '@/types';

type Props = {
  recurringId: string | null;
  /** 삭제되지 않은 자동이체 전체 */
  recurrings: Recurring[];
  onEdit: (recurringId: string) => void;
  onUnlink: () => void;
  onPressLink: () => void;
  /** 이 거래 내용으로 새 자동이체를 만든다 */
  onCreate: () => void;
  /** 연결할 수 있는 자동이체가 있는지 */
  canLink: boolean;
};

/** 거래 상세 위쪽: 자동이체 거래임을 알리고 수정·해제, 아니면 새로 만들기·연결 */
export function RecurringLinkCard({
  recurringId,
  recurrings,
  onEdit,
  onUnlink,
  onPressLink,
  onCreate,
  canLink,
}: Props) {
  if (!recurringId) {
    return (
      <View style={styles.linkRows}>
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={15} color={Colors.primaryDark} />
          <Text style={styles.linkText}>이 거래로 자동이체 만들기</Text>
        </Pressable>
        {canLink && (
          <Pressable
            onPress={onPressLink}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Ionicons name="repeat" size={15} color={Colors.primaryDark} />
            <Text style={styles.linkText}>자동이체 연결</Text>
            <Ionicons name="chevron-forward" size={15} color={Colors.primaryDark} />
          </Pressable>
        )}
      </View>
    );
  }

  const recurring = recurrings.find((r) => r.id === recurringId);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="repeat" size={15} color={Colors.primaryDark} />
        <Text style={styles.title} numberOfLines={1}>
          자동이체로 기록된 거래 · {recurring?.name ?? '삭제된 자동이체'}
        </Text>
      </View>
      <Text style={styles.hint}>
        여기서 고치면 이 거래만 바뀌어요.{recurring ? ' 앞으로의 금액은 자동이체에서 고쳐 주세요.' : ''}
      </Text>
      <View style={styles.actions}>
        {recurring && (
          <Pressable
            onPress={() => onEdit(recurring.id)}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>자동이체 수정</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onUnlink}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>연결 해제</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 10, backgroundColor: Colors.primaryLight, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  hint: { fontSize: 12, color: Colors.primaryDark },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  linkRows: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  linkText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
});
