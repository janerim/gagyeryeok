import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';
import { selectVisibleAccounts, useAccountStore } from '@/store/accountStore';

/** 계좌 탭. 잔액 표시는 2주차에 추가한다. */
export default function AccountsScreen() {
  const accounts = useAccountStore(selectVisibleAccounts);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        left="계좌"
        right={
          <Pressable onPress={() => router.push('/settings/accounts')} style={hb.btn}>
            <Text style={hb.text}>관리</Text>
          </Pressable>
        }
      />
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.purpose ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.purpose}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.type}>{ACCOUNT_TYPE_LABELS[item.type]}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 계좌가 없습니다.</Text>
            <Pressable onPress={() => router.push('/account-form')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>계좌 추가</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  badgeText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  type: { marginTop: 2, fontSize: 13, color: Colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});
