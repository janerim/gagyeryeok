import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';
import { BackupFormatError, summarizeBackup, type Backup } from '@/domain/backup';
import { useBackupStore } from '@/store/backupStore';

const DATE_FORMAT = 'yyyy.MM.dd HH:mm';

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function BackupScreen() {
  const { safetyBackups, load, exportBackup, pickBackup, readSafetyBackup, restore } =
    useBackupStore();
  const [busy, setBusy] = useState(false);

  useEffect(load, [load]);

  const run = async (task: () => Promise<void>, onError: (e: unknown) => void) => {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      console.error(e);
      onError(e);
    } finally {
      setBusy(false);
    }
  };

  const showReadError = (e: unknown) =>
    Alert.alert(
      '백업 파일을 읽지 못했습니다',
      e instanceof BackupFormatError ? e.message : errorMessage(e)
    );

  const confirmRestore = (backup: Backup) => {
    const s = summarizeBackup(backup);
    Alert.alert(
      '이 백업으로 복원할까요?',
      `${format(new Date(s.exportedAt), DATE_FORMAT)} 백업\n` +
        `거래 ${s.transactions}건 · 계좌 ${s.accounts}개\n` +
        `카테고리 ${s.categories}개 · 자동이체 ${s.recurrings}개\n\n` +
        '지금 데이터는 자동 백업한 뒤 모두 이 내용으로 바뀝니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          style: 'destructive',
          onPress: () =>
            run(
              async () => {
                await restore(backup);
                Alert.alert('복원했습니다');
              },
              (e) =>
                Alert.alert(
                  '복원하지 못했습니다',
                  `기존 데이터는 그대로입니다.\n${errorMessage(e)}`
                )
            ),
        },
      ]
    );
  };

  const onExport = () =>
    run(exportBackup, (e) => Alert.alert('백업 파일을 만들지 못했습니다', errorMessage(e)));

  const onPick = () =>
    run(async () => {
      const backup = await pickBackup();
      if (backup) confirmRestore(backup);
    }, showReadError);

  const onPickSafety = (uri: string) =>
    run(async () => confirmRestore(await readSafetyBackup(uri)), showReadError);

  return (
    <View style={styles.screen}>
      <Row label="백업 파일 만들기" disabled={busy} onPress={onExport} />
      <Row label="백업 파일에서 복원" disabled={busy} onPress={onPick} />
      <Text style={styles.note}>
        백업 파일은 암호화되지 않습니다. 파일 앱이나 iCloud Drive처럼 믿을 수 있는 곳에 보관해 주세요.
      </Text>

      {safetyBackups.length > 0 && (
        <>
          <Text style={styles.section}>복원 전 자동 백업</Text>
          {safetyBackups.map((b) => (
            <Row
              key={b.uri}
              label={format(b.date, DATE_FORMAT)}
              disabled={busy}
              onPress={() => onPickSafety(b.uri)}
            />
          ))}
          <Text style={styles.note}>
            복원 직전의 데이터를 최근 3개까지 이 기기에 보관합니다. 눌러서 되돌릴 수 있어요.
          </Text>
        </>
      )}

      {busy && <ActivityIndicator style={styles.spinner} color={Colors.primary} />}
    </View>
  );
}

function Row({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surface }]}
    >
      <Text style={[styles.label, disabled && { color: Colors.textSecondary }]}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: 16, color: Colors.textPrimary },
  chevron: { fontSize: 20, color: Colors.textSecondary },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  spinner: { marginTop: 24 },
});
