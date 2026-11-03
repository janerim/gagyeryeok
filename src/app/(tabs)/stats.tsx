import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/common/ScreenHeader';

/** 월별 통계는 3주차 범위. */
export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader left="통계" />
      <View style={styles.body}>
        <Text style={styles.placeholder}>월별 통계는 3주차에 만듭니다.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
});
