import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Chip } from '@/components/common/Chip';
import { Field, inputStyle } from '@/components/common/Field';
import { FormFooter } from '@/components/common/FormFooter';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { useCategoryStore } from '@/store/categoryStore';
import type { CategoryType } from '@/types';

export default function CategoryFormScreen() {
  const { id, type: initialType } = useLocalSearchParams<{ id?: string; type?: CategoryType }>();
  const isEdit = !!id;
  const existing = useCategoryStore((s) => s.categories.find((c) => c.id === id));
  const { add, edit, remove } = useCategoryStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [type, setType] = useState<CategoryType>(initialType ?? 'EXPENSE');
  const [saving, setSaving] = useState(false);
  const keyboard = useKeyboardInset();

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setIcon(existing.icon ?? '');
    setType(existing.type);
  }, [existing]);

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('카테고리 이름을 입력해 주세요');
    const input = { name: name.trim(), type, icon: icon.trim() || null };
    setSaving(true);
    try {
      if (isEdit && id) await edit(id, input);
      else await add(input);
      router.back();
    } catch (e: any) {
      Alert.alert('저장 실패', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert('삭제', '이 카테고리를 삭제할까요? 기존 거래의 기록은 유지됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await remove(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingBottom: keyboard.bottom }]}>
      <ScrollView
        ref={keyboard.scrollRef}
        onScroll={keyboard.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* 유형은 생성 시에만 고른다. 거래가 붙은 뒤 바꾸면 통계가 섞인다. 수정 때는 흐리게 */}
        <Field label="구분">
          <View style={[styles.chips, isEdit && styles.locked]}>
            {(['EXPENSE', 'INCOME'] as CategoryType[]).map((t) => (
              <Chip
                key={t}
                label={t === 'EXPENSE' ? '지출' : '수입'}
                selected={t === type}
                onPress={() => !isEdit && setType(t)}
                color={t === 'EXPENSE' ? Colors.expense : Colors.income}
              />
            ))}
          </View>
        </Field>

        <Field label="이름">
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="예: 식비"
            placeholderTextColor={Colors.textSecondary}
            autoFocus={!isEdit}
          />
        </Field>

        <Field label="아이콘 (선택, 이모지 1개)">
          <TextInput
            style={inputStyle}
            value={icon}
            onChangeText={setIcon}
            placeholder="🍚"
            placeholderTextColor={Colors.textSecondary}
            maxLength={4}
          />
        </Field>
      </ScrollView>

      <FormFooter
        saveLabel={isEdit ? '수정' : '저장'}
        onSave={onSave}
        saving={saving}
        onDelete={isEdit ? onDelete : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, gap: 20 },
  chips: { flexDirection: 'row', gap: 8 },
  locked: { opacity: 0.5 },
});
