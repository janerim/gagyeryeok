import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import { AmountInput } from '@/components/common/AmountInput';
import { Chip } from '@/components/common/Chip';
import { Field, inputStyle } from '@/components/common/Field';
import { useAccountStore } from '@/store/accountStore';
import type { AccountType } from '@/types';

export default function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const existing = useAccountStore((s) => s.accounts.find((a) => a.id === id));
  const { add, edit, setHidden } = useAccountStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [purpose, setPurpose] = useState('');
  const [initialBalance, setInitialBalance] = useState(0);
  const [hidden, setHiddenLocal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setType(existing.type);
    setPurpose(existing.purpose ?? '');
    setInitialBalance(existing.initialBalance);
    setHiddenLocal(existing.isHidden);
  }, [existing]);

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('계좌 이름을 입력해 주세요');
    const input = {
      name: name.trim(),
      type,
      purpose: purpose.trim() || null,
      initialBalance,
    };
    setSaving(true);
    try {
      if (isEdit && id) {
        await edit(id, input);
        if (existing && existing.isHidden !== hidden) await setHidden(id, hidden);
      } else {
        await add(input);
      }
      router.back();
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Field label="이름">
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="예: 생활비 통장"
            placeholderTextColor={Colors.textSecondary}
            autoFocus={!isEdit}
          />
        </Field>

        <Field label="종류">
          <View style={styles.chips}>
            {ACCOUNT_TYPES.map((t) => (
              <Chip
                key={t}
                label={ACCOUNT_TYPE_LABELS[t]}
                selected={t === type}
                onPress={() => setType(t)}
              />
            ))}
          </View>
        </Field>

        <Field label="용도 (선택)">
          <TextInput
            style={inputStyle}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="예: 생활비, 월급, 비상금"
            placeholderTextColor={Colors.textSecondary}
          />
        </Field>

        <Field label="초기 잔액">
          <AmountInput value={initialBalance} onChange={setInitialBalance} />
        </Field>

        {isEdit && (
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>숨김</Text>
              <Text style={styles.switchSub}>입력 화면과 계좌 목록에서 감춥니다</Text>
            </View>
            <Switch value={hidden} onValueChange={setHiddenLocal} />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        >
          <Text style={styles.saveText}>{isEdit ? '수정' : '저장'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  switchSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
