import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = { label: string; children: ReactNode };

/** 폼의 "라벨 + 입력" 한 묶음 */
export function Field({ label, children }: Props) {
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
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
});
