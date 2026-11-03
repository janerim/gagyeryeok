import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths } from 'date-fns';
import { Colors } from '@/constants/colors';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { ScreenHeader, headerButtonStyles as hb } from '@/components/common/ScreenHeader';

/** 캘린더 홈. 달력 그리드는 2주차 범위라 지금은 헤더와 진입 버튼만 둔다. */
export default function CalendarScreen() {
  const [month, setMonth] = useState(() => new Date());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        left={
          <MonthNavigator
            date={month}
            onPrev={() => setMonth((d) => addMonths(d, -1))}
            onNext={() => setMonth((d) => addMonths(d, 1))}
          />
        }
        right={
          <>
            <Pressable onPress={() => router.push('/settings')} style={hb.btn}>
              <Text style={hb.text}>⚙︎</Text>
            </Pressable>
            <Pressable onPress={() => setMonth(new Date())} style={hb.btn}>
              <Text style={hb.text}>오늘</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/transaction-form')}
              style={[hb.btn, hb.btnPrimary]}
            >
              <Text style={hb.textPrimary}>+</Text>
            </Pressable>
          </>
        }
      />
      <View style={styles.body}>
        <Text style={styles.placeholder}>달력은 2주차에 만듭니다.</Text>
        <Text style={styles.placeholderSub}>+ 로 거래를 입력하고, 내역 탭에서 확인하세요.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholder: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  placeholderSub: { fontSize: 13, color: Colors.textSecondary },
});
