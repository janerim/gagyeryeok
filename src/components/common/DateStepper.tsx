import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 1주차용 날짜 선택: 하루 단위 이동 + 오늘.
 * 2주차에 달력 컴포넌트가 생기면 직접 선택으로 교체한다.
 */
export function DateStepper({ value, onChange }: Props) {
  const date = parseISO(value);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const shift = (d: number) => onChange(format(addDays(date, d), 'yyyy-MM-dd'));
  return (
    <View style={styles.row}>
      <Pressable onPress={() => shift(-1)} style={styles.arrow} hitSlop={8}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Text style={styles.value}>
        {`${format(date, 'yyyy.MM.dd')} (${WEEKDAYS[date.getDay()]})`}
      </Text>
      <Pressable onPress={() => shift(1)} style={styles.arrow} hitSlop={8}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(todayKey)}
        style={[styles.todayBtn, value === todayKey && { opacity: 0.4 }]}
        disabled={value === todayKey}
      >
        <Text style={styles.todayText}>오늘</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  arrowText: { fontSize: 22, lineHeight: 24, color: Colors.textPrimary },
  value: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
  },
  todayText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
});
