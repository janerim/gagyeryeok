import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  /** 왼쪽 영역. 문자열이면 제목으로, 노드면 그대로 렌더 */
  left: ReactNode;
  right?: ReactNode;
};

/** 탭 화면 상단 바: 왼쪽 제목(또는 월 이동), 오른쪽 버튼들 */
export function ScreenHeader({ left, right }: Props) {
  return (
    <View style={styles.row}>
      {typeof left === 'string' ? <Text style={styles.title}>{left}</Text> : left}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export const headerButtonStyles = StyleSheet.create({
  btn: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  /** 아이콘만 있는 버튼. 좁은 화면(375pt)에서 헤더가 넘치지 않도록 정사각형으로 고정 */
  iconBtn: { width: 36, paddingHorizontal: 0 },
  btnPrimary: { backgroundColor: Colors.primary },
  text: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
