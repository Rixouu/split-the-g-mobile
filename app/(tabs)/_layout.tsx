import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { BrandDockTabBar } from '@/components/split-the-g/brand-dock';
import { fetchCompetitionsCatalog, fetchPubs, fetchRecentScores } from '@/lib/api/client';
import { fetchProfileHubBundle } from '@/lib/api/profile-hub-data';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Bottom tabs default to lazy mount; first open of each tab otherwise waits on cold network.
 * Warm shared lists in the background while the user is on Pour / another tab.
 */
function TabQueryWarmup() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    void qc.prefetchQuery({
      queryKey: ['scores', 'recent'],
      queryFn: () => fetchRecentScores(36),
    });
    void qc.prefetchQuery({
      queryKey: ['scores', 'wall'],
      queryFn: () => fetchRecentScores(80),
    });
    void qc.prefetchQuery({
      queryKey: ['pubs'],
      queryFn: () => fetchPubs(50),
    });
    void qc.prefetchQuery({
      queryKey: ['competitions', 'catalog'],
      queryFn: () => fetchCompetitionsCatalog(40),
    });
  }, [qc]);

  useEffect(() => {
    if (!user?.id || !user.email?.trim()) return;
    void qc.prefetchQuery({
      queryKey: ['profileHub', user.id],
      queryFn: () => fetchProfileHubBundle(user),
    });
  }, [qc, user]);

  return null;
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TabQueryWarmup />
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
    </View>
  );
}
