import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { getDB } from '@/data/db/database';
import { useAccountStore } from '@/store/accountStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useRecurringStore } from '@/store/recurringStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await getDB(); // 마이그레이션 먼저
      await Promise.all([
        useAccountStore.getState().load(),
        useCategoryStore.getState().load(),
        useRecurringStore.getState().load(),
      ]);
      await useRecurringStore.getState().generateDue();
      setReady(true);
    })().catch(console.error);
  }, []);

  // 앱을 켜 둔 채 날짜가 바뀔 수 있으므로, 다시 앞으로 올 때마다 자동이체를 확인한다
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useRecurringStore.getState().generateDue().catch(console.error);
    });
    return () => sub.remove();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.background }} />;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            headerTintColor: Colors.primary,
            headerTitleStyle: { fontSize: 17, fontWeight: '600' },
            headerStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
            headerBackTitle: '뒤로',
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="transaction-form"
            options={{ presentation: 'modal', headerShown: true, title: '거래' }}
          />
          <Stack.Screen
            name="account-form"
            options={{ presentation: 'modal', headerShown: true, title: '계좌' }}
          />
          <Stack.Screen
            name="category-form"
            options={{ presentation: 'modal', headerShown: true, title: '카테고리' }}
          />
          <Stack.Screen
            name="recurring-form"
            options={{ presentation: 'modal', headerShown: true, title: '자동이체' }}
          />
          <Stack.Screen name="recurring" options={{ headerShown: true, title: '자동이체' }} />
          <Stack.Screen
            name="settings/index"
            options={{ headerShown: true, title: '설정' }}
          />
          <Stack.Screen
            name="settings/categories"
            options={{ headerShown: true, title: '카테고리 관리' }}
          />
          <Stack.Screen
            name="settings/accounts"
            options={{ headerShown: true, title: '계좌 관리' }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
