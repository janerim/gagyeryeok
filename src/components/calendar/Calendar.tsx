import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { buildMonthGrid, type CalendarDay } from '@/domain/calendar';

type Props = {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  /** 날짜 선택용으로 쓸 때 테두리로 표시할 날짜 */
  selected?: string;
  onPressDay: (day: CalendarDay) => void;
  /** 날짜 숫자 아래 내용. 앱마다 다른 부분이라 밖에서 주입한다 */
  renderDay?: (day: CalendarDay) => ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const weekdayColor = (weekday: number) =>
  weekday === 6 ? Colors.saturday : weekday === 0 ? Colors.sunday : Colors.textPrimary;

/** 월요일 시작 달력 그리드. 토요일 파랑, 일요일 빨강, 오늘 하이라이트 (책력과 동일) */
export function Calendar({
  month,
  today,
  selected,
  onPressDay,
  renderDay,
  onSwipeLeft,
  onSwipeRight,
}: Props) {
  const weeks = buildMonthGrid(month);

  // 책력과 같은 기준: 가로로 50 이상 밀면 달 이동, 세로로 먼저 움직이면 무시
  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX < -50) onSwipeLeft?.();
      else if (e.translationX > 50) onSwipeRight?.();
    });

  return (
    <GestureDetector gesture={pan}>
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
              const isSelected = day.date === selected;
              return (
                <Pressable
                  key={day.date}
                  onPress={() => onPressDay(day)}
                  style={({ pressed }) => [
                    styles.cell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                    pressed && { backgroundColor: Colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      { color: weekdayColor(day.weekday) },
                      !day.inMonth && styles.outOfMonth,
                      (isToday || isSelected) && styles.todayNum,
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
    </GestureDetector>
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
  selectedCell: { borderWidth: 1.5, borderColor: Colors.primary },
  dayNum: { fontSize: 13, fontWeight: '600' },
  todayNum: { color: Colors.primaryDark, fontWeight: '800' },
  outOfMonth: { opacity: 0.3 },
});
