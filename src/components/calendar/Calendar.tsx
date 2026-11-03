import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { buildMonthGrid, type CalendarDay } from '@/domain/calendar';

type Props = {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  onPressDay: (day: CalendarDay) => void;
  /** 날짜 숫자 아래 내용. 앱마다 다른 부분이라 밖에서 주입한다 */
  renderDay?: (day: CalendarDay) => ReactNode;
};

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const weekdayColor = (weekday: number) =>
  weekday === 6 ? Colors.saturday : weekday === 0 ? Colors.sunday : Colors.textPrimary;

/** 월요일 시작 달력 그리드. 토요일 파랑, 일요일 빨강, 오늘 하이라이트 (책력과 동일) */
export function Calendar({ month, today, onPressDay, renderDay }: Props) {
  const weeks = buildMonthGrid(month);

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={label} style={[styles.weekLabel, { color: weekdayColor((i + 1) % 7) }]}>
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].date} style={styles.week}>
          {week.map((day) => {
            const isToday = day.date === today;
            return (
              <Pressable
                key={day.date}
                onPress={() => onPressDay(day)}
                style={({ pressed }) => [
                  styles.cell,
                  isToday && styles.todayCell,
                  pressed && { backgroundColor: Colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    { color: weekdayColor(day.weekday) },
                    !day.inMonth && styles.outOfMonth,
                    isToday && styles.todayNum,
                  ]}
                >
                  {day.day}
                </Text>
                {renderDay && <View style={!day.inMonth && styles.outOfMonth}>{renderDay(day)}</View>}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 4 },
  weekRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  week: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  cell: { flex: 1, alignItems: 'center', paddingTop: 6, gap: 2, borderRadius: 8 },
  todayCell: { backgroundColor: Colors.todayBg },
  dayNum: { fontSize: 13, fontWeight: '600' },
  todayNum: { color: Colors.primaryDark, fontWeight: '800' },
  outOfMonth: { opacity: 0.3 },
});
