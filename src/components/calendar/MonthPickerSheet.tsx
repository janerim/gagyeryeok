import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';

type Props = {
  visible: boolean;
  month: string; // YYYY-MM
  onSelect: (month: string) => void;
  onClose: () => void;
};

/** 헤더의 월 글자를 누르면 올라오는 연·월 선택 시트 */
export function MonthPickerSheet({ visible, month, onSelect, onClose }: Props) {
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  // 열 때마다 지금 보고 있는 달의 연도에서 시작
  useEffect(() => {
    if (visible) setYear(Number(month.slice(0, 4)));
  }, [visible, month]);
  const thisMonth = format(new Date(), 'yyyy-MM');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.yearRow}>
            <Pressable
              onPress={() => setYear(year - 1)}
              hitSlop={12}
              style={styles.arrow}
              accessibilityRole="button"
              accessibilityLabel="이전 해"
            >
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <Text style={styles.year}>{year}년</Text>
            <Pressable
              onPress={() => setYear(year + 1)}
              hitSlop={12}
              style={styles.arrow}
              accessibilityRole="button"
              accessibilityLabel="다음 해"
            >
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {Array.from({ length: 12 }, (_, i) => {
              const key = `${year}-${String(i + 1).padStart(2, '0')}`;
              const selected = key === month;
              const current = key === thisMonth;
              return (
                <View key={key} style={styles.cell}>
                  <Pressable
                    onPress={() => {
                      onSelect(key);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.pill,
                      selected && styles.pillSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        current && styles.pillTextCurrent,
                        selected && styles.pillTextSelected,
                      ]}
                    >
                      {i + 1}월
                    </Text>
                  </Pressable>
                </View>
              );
            })}
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
    paddingHorizontal: 16,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 26, lineHeight: 28, color: Colors.textPrimary },
  year: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, minWidth: 70, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '25%', padding: 4 },
  pill: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  pillSelected: { backgroundColor: Colors.primary },
  pillText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  pillTextCurrent: { color: Colors.primaryDark, fontWeight: '800' },
  pillTextSelected: { color: '#fff' },
});
