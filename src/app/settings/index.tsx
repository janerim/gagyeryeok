import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';

const ITEMS = [
  { label: '카테고리 관리', path: '/settings/categories' },
  { label: '계좌 관리', path: '/settings/accounts' },
] as const;

export default function SettingsScreen() {
  return (
    <View style={styles.screen}>
      {ITEMS.map((it) => (
        <Pressable
          key={it.path}
          onPress={() => router.push(it.path)}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
        >
          <Text style={styles.label}>{it.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: 16, color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textSecondary },
});
