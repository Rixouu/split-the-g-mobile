import { Tabs } from 'expo-router';
import React from 'react';

import { BrandDockTabBar } from '@/components/split-the-g/brand-dock';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BrandDockTabBar {...props} />}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Pour' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="compete" options={{ title: 'Compete' }} />
      <Tabs.Screen name="pubs" options={{ title: 'Pubs' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
