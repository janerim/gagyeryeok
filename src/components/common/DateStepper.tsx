import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { DatePickerSheet } from '@/components/calendar/DatePickerSheet';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 날짜 선택: 하루 단위 이동 + 오늘, 날짜 글자를 누르면 달력에서 직접 고른다 */
export function DateStepper({ value, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const date = parseISO(value);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const shift = (d: number) => onChange(format(addDays(date, d), 'yyyy-MM-dd'));
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => shift(-1)}
        style={styles.arrow}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="이전 날"
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Pressable onPress={() => setPickerOpen(true)} style={styles.valueBtn} hitSlop={6}>
        <Text style={styles.value}>
          {`${format(date, 'yyyy.MM.dd')} (${WEEKDAYS[date.getDay()]})`}
          <Text style={styles.caret}> ▾</Text>
        </Text>
      </Pressable>
      <Pressable
        onPress={() => shift(1)}
        style={styles.arrow}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="다음 날"
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
      <DatePickerSheet
        visible={pickerOpen}
        value={value}
        onSelect={onChange}
        onClose={() => setPickerOpen(false)}
      />
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
  valueBtn: { flex: 1 },
  value: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  caret: { fontSize: 12, color: Colors.textSecondary },
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
