import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <Pressable
        onPress={onPrev}
        hitSlop={12}
        style={styles.arrow}
        accessibilityRole="button"
        accessibilityLabel="이전 달"
      >
        <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
      </Pressable>
      {onPressLabel ? (
        <Pressable
          onPress={onPressLabel}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${label}, 달 선택`}
        >
          <Text style={styles.label}>
            {label} <Text style={styles.caret}>▾</Text>
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      <Pressable
        onPress={onNext}
        hitSlop={12}
        style={styles.arrow}
        accessibilityRole="button"
        accessibilityLabel="다음 달"
      >
        <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // 좁은 화면(375pt)에서 오른쪽 버튼들과 한 줄에 들어가도록 좁게 둔다
    gap: 8,
  },
  arrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
