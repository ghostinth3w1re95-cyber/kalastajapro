import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5dd8e6',
        tabBarInactiveTintColor: '#7896a7',
        tabBarStyle: { backgroundColor: '#102d45', borderTopColor: '#2b526c' },
        headerStyle: { backgroundColor: '#071a2a' },
        headerTintColor: '#f5fbff',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sää',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'sun.max',
                android: 'wb_sunny',
                web: 'cloud',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Kartta',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'map',
                android: 'map',
                web: 'map',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Saalispäiväkirja',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'book',
                android: 'menu_book',
                web: 'book',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
