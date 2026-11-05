import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  /** 있으면 월 글자를 눌러 연·월 선택 시트를 연다 */
  onPressLabel?: () => void;
};

/** 책력과 동일한 `‹ 26년 11월 ›` 월 이동 헤더 */
export function MonthNavigator({ date, onPrev, onNext, onPressLabel }: Props) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = date.getMonth() + 1;
  const label = `${yy}년 ${mm}월`;
  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} hitSlop={12} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      {onPressLabel ? (
        <Pressable onPress={onPressLabel} hitSlop={8}>
          <Text style={styles.label}>
            {label} <Text style={styles.caret}>▾</Text>
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      <Pressable onPress={onNext} hitSlop={12} style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  arrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 26,
    color: Colors.textPrimary,
    fontWeight: '400',
    lineHeight: 28,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 90,
    textAlign: 'center',
  },
  caret: { fontSize: 14, color: Colors.textSecondary },
});
