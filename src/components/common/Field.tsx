import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  label: string;
  children: ReactNode;
  /** 라벨을 입력과 같은 줄 왼쪽에 둔다 (한 줄이면 충분한 입력용) */
  inline?: boolean;
};

/** 폼의 "라벨 + 입력" 한 묶음 */
export function Field({ label, children, inline = false }: Props) {
  if (inline) {
    return (
      <View style={styles.inline}>
        <Text style={styles.label}>{label}</Text>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export const inputStyle = StyleSheet.create({
  text: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
}).text;

const styles = StyleSheet.create({
  container: { gap: 6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
});
