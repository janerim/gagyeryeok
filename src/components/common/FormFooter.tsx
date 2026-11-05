import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  saveLabel: string;
  onSave: () => void;
  saving?: boolean;
  /** 있으면 왼쪽에 삭제 버튼을 둔다 (수정 모드) */
  onDelete?: () => void;
  /** 키보드가 떠 있는 동안에는 버튼 대신 키보드를 내리는 '완료' 줄만 보여준다 */
  keyboardOpen?: boolean;
};

/** 폼 하단 고정 버튼 줄: [삭제] [저장/수정]. 삭제가 한 줄을 따로 차지하지 않도록 */
export function FormFooter({
  saveLabel,
  onSave,
  saving = false,
  onDelete,
  keyboardOpen = false,
}: Props) {
  // 키보드 바로 위에 저장 버튼이 있으면 숫자를 치다 잘못 눌러 저장될 수 있어서 '완료'만 둔다
  if (keyboardOpen) {
    return (
      <View style={styles.doneBar}>
        <Pressable onPress={Keyboard.dismiss} hitSlop={10} accessibilityRole="button">
          <Text style={styles.doneText}>완료</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.footer}>
      {onDelete && (
        <Pressable onPress={onDelete} disabled={saving} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>삭제</Text>
        </Pressable>
      )}
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={[styles.saveBtn, saving && { opacity: 0.5 }]}
      >
        <Text style={styles.saveText}>{saveLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: Colors.danger, fontSize: 16, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  doneText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
