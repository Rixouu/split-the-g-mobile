import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { BrandDockTabBar } from '@/components/split-the-g/brand-dock';
import { fetchPubs, fetchRecentScores } from '@/lib/api/client';
import { fetchProfileHubBundle } from '@/lib/api/profile-hub-data';
import { useAuth } from '@/lib/auth/auth-context';
import { favoriteRowsQueryOptions, pubNotesQueryOptions } from '@/lib/queries/profile';
import { filterBlockedScores } from '@/lib/moderation/content-safety';

/**
 * Bottom tabs default to lazy mount; first open of each tab otherwise waits on cold network.
 * Warm shared lists in the background while the user is on Pour / another tab.
 */
function TabQueryWarmup() {
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    void qc.prefetchQuery({
      queryKey: ['scores', 'recent'],
      queryFn: () => fetchRecentScores(36),
      staleTime: 180_000,
    });
    void qc.prefetchQuery({
      queryKey: ['scores', 'wall'],
      queryFn: async () => filterBlockedScores(await fetchRecentScores(80)),
      staleTime: 180_000,
    });
    void qc.prefetchQuery({
      queryKey: ['pubs'],
      queryFn: () => fetchPubs(50),
      staleTime: 900_000,
    });
  }, [qc]);

  useEffect(() => {
    if (authLoading) return;
    void qc.prefetchQuery(favoriteRowsQueryOptions(user?.id));
    void qc.prefetchQuery(pubNotesQueryOptions(user?.id));
  }, [authLoading, qc, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id || !user.email?.trim()) return;
    void qc.prefetchQuery({
      queryKey: ['profileHub', user.id],
      queryFn: () => fetchProfileHubBundle(user, qc),
      staleTime: 120_000,
    });
  }, [authLoading, qc, user]);

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
        <Tabs.Screen name="journal" options={{ title: 'Notebook' }} />
        <Tabs.Screen name="pubs" options={{ title: 'Pubs' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}
