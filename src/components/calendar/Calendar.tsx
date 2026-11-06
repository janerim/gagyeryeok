import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { buildMonthGrid, type CalendarDay } from '@/domain/calendar';

type Props = {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  /** 테두리로 표시할 날짜 */
  selected?: string;
  /** 누른 칸의 화면 위치가 필요하면 e.currentTarget 으로 잰다 */
  onPressDay: (day: CalendarDay, e: GestureResponderEvent) => void;
  /** 날짜 숫자 아래 내용. 앱마다 다른 부분이라 밖에서 주입한다 */
  renderDay?: (day: CalendarDay) => ReactNode;
  /** 주 행 오른쪽 열 내용 (주간 합계 등). 있으면 8번째 열이 생긴다 */
  renderWeek?: (week: CalendarDay[]) => ReactNode;
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
  renderWeek,
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
          {renderWeek && <Text style={[styles.weekLabel, styles.weekColHeader]}>주</Text>}
        </View>
        {weeks.map((week) => (
          <View key={week[0].date} style={styles.week}>
            {week.map((day) => {
              const isToday = day.date === today;
              const isSelected = day.date === selected;
              return (
                <Pressable
                  key={day.date}
                  onPress={(e) => onPressDay(day, e)}
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
                  {/* 칸 크기가 변하지 않도록 테두리를 내용 위에 겹친다 */}
                  {isSelected && <View pointerEvents="none" style={styles.selectedBorder} />}
                </Pressable>
              );
            })}
            {renderWeek && <View style={styles.weekCol}>{renderWeek(week)}</View>}
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
  // 주간 합계 열. 날짜 칸보다 좁게 고정해 7칸을 덜 줄인다
  weekColHeader: { flex: 0, width: 46, color: Colors.textSecondary },
  weekCol: {
    width: 46,
    alignItems: 'center',
    paddingTop: 6,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Colors.border,
  },
  todayCell: { backgroundColor: Colors.todayBg },
  selectedCell: { backgroundColor: Colors.primaryLight },
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: Colors.primary,
  },
  dayNum: { fontSize: 13, fontWeight: '600' },
  todayNum: { color: Colors.primaryDark, fontWeight: '800' },
  outOfMonth: { opacity: 0.3 },
});
