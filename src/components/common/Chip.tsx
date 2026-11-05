import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** 선택됐을 때 배경색. 기본은 primary */
  color?: string;
  /** 선택 전에도 연한 초록으로 칠한다 (같은 줄에서 카드를 통장과 구분할 때, 아이콘의 카드 색) */
  tinted?: boolean;
};

export function Chip({ label, selected = false, onPress, color, tinted = false }: Props) {
  const bg = color ?? Colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        tinted && styles.tinted,
        selected && { backgroundColor: bg, borderColor: bg },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.text, tinted && styles.textTinted, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tinted: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  text: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  textTinted: { color: Colors.primaryDark },
  textSelected: { color: '#fff', fontWeight: '600' },
});
