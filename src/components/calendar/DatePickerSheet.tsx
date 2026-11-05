import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { addMonths, format, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { Calendar } from './Calendar';
import { MonthNavigator } from './MonthNavigator';

type Props = {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
};

/** 날짜 글자를 누르면 올라오는 달력 시트. 날짜를 고르면 바로 닫힌다 */
export function DatePickerSheet({ visible, value, onSelect, onClose }: Props) {
  const [month, setMonth] = useState(value.slice(0, 7));
  useEffect(() => {
    if (visible) setMonth(value.slice(0, 7));
  }, [visible, value]);

  const monthDate = parseISO(`${month}-01`);
  const shiftMonth = (d: number) => setMonth(format(addMonths(monthDate, d), 'yyyy-MM'));
  const today = format(new Date(), 'yyyy-MM-dd');
  const pick = (date: string) => {
    onSelect(date);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <MonthNavigator
              date={monthDate}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
            />
            <Pressable onPress={() => pick(today)} style={styles.todayBtn}>
              <Text style={styles.todayText}>오늘</Text>
            </Pressable>
          </View>
          {/* Calendar 는 주 행이 flex 로 늘어나므로 높이를 정해 준다 */}
          <View style={styles.calendar}>
            <Calendar
              month={month}
              today={today}
              selected={value}
              onPressDay={(day) => pick(day.date)}
              onSwipeLeft={() => shiftMonth(1)}
              onSwipeRight={() => shiftMonth(-1)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
  },
  todayText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
  calendar: { height: 300 },
});
