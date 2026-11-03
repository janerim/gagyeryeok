import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Colors } from '@/constants/colors';
import { formatWon, parseWon } from '@/domain/money';

type Props = {
  value: number; // 원 단위 정수
  onChange: (v: number) => void;
  autoFocus?: boolean;
  /** 금액 글자 크기를 키운 강조형 (거래 입력용) */
  large?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
};

/** 숫자 키패드로 받고 천 단위 콤마로 보여주는 금액 입력 */
export function AmountInput({ value, onChange, autoFocus, large, returnKeyType }: Props) {
  return (
    <View style={[styles.box, large && styles.boxLarge]}>
      <TextInput
        style={[styles.input, large && styles.inputLarge]}
        value={value === 0 ? '' : formatWon(value)}
        onChangeText={(t) => onChange(parseWon(t))}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={Colors.textSecondary}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        selectTextOnFocus
      />
      <Text style={[styles.unit, large && styles.unitLarge]}>원</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  boxLarge: { borderWidth: 0, borderBottomWidth: 2, borderColor: Colors.primary, borderRadius: 0 },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  inputLarge: { fontSize: 32, fontWeight: '700', paddingVertical: 8 },
  unit: { marginLeft: 6, fontSize: 15, color: Colors.textSecondary },
  unitLarge: { fontSize: 20 },
});
