import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

export type PickerOption = { key: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  value: string | null;
  onSelect: (key: string | null) => void;
  onClose: () => void;
  /** 맨 위에 "전체" 항목을 두고 선택 시 null 을 돌려준다 */
  allowAll?: boolean;
};

/** 아래에서 올라오는 단일 선택 목록 */
export function PickerSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  allowAll = false,
}: Props) {
  const rows: { key: string | null; label: string }[] = allowAll
    ? [{ key: null, label: '전체' }, ...options]
    : options;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {rows.map((r) => {
              const selected = r.key === value;
              return (
                <Pressable
                  key={r.key ?? '__all__'}
                  onPress={() => {
                    onSelect(r.key);
                    onClose();
                  }}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
                >
                  <Text style={[styles.rowText, selected && styles.rowTextSel]}>
                    {r.label}
                  </Text>
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
            {rows.length === 0 && <Text style={styles.empty}>항목이 없습니다</Text>}
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
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowText: { fontSize: 16, color: Colors.textPrimary },
  rowTextSel: { color: Colors.primary, fontWeight: '700' },
  check: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  empty: { paddingVertical: 20, textAlign: 'center', color: Colors.textSecondary },
});
