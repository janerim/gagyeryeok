import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

/** 선택된 탭은 채운 아이콘, 나머지는 선 아이콘. 색은 탭바 글자(active/inactive)와 같게 */
const tabIcon =
  (name: 'calendar' | 'receipt' | 'wallet' | 'bar-chart') =>
  ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={size}
      color={focused ? Colors.primary : Colors.textSecondary}
    />
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
      <Tabs.Screen name="index" options={{ title: '캘린더', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="history" options={{ title: '내역', tabBarIcon: tabIcon('receipt') }} />
      <Tabs.Screen name="accounts" options={{ title: '계좌', tabBarIcon: tabIcon('wallet') }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: tabIcon('bar-chart') }} />
    </Tabs>
  );
}
