import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/colors';

const tabIcon =
  (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Colors.border,
          backgroundColor: Colors.background,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '캘린더', tabBarIcon: tabIcon('📅') }} />
      <Tabs.Screen name="history" options={{ title: '내역', tabBarIcon: tabIcon('🧾') }} />
      <Tabs.Screen name="accounts" options={{ title: '계좌', tabBarIcon: tabIcon('🏦') }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: tabIcon('📊') }} />
    </Tabs>
  );
}
