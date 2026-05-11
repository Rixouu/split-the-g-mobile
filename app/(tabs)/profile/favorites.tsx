import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/split-the-g/button';
import { Card, Screen } from '@/components/split-the-g/screen';
import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import {
  deleteFavoriteBar,
  fetchFavoriteRows,
  insertFavoriteBar,
} from '@/lib/api/profile';
import { fetchPlaceAutocomplete, fetchPlaceDetails, type PlaceAutocompleteItem } from '@/lib/places/google-places';
import { appConfig } from '@/lib/config';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-context';

export default function ProfileFavoritesScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteItem[]>([]);

  const listQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => fetchFavoriteRows(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    const key = appConfig.googleMapsApiKey?.trim();
    if (!key || name.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const h = setTimeout(() => {
      void fetchPlaceAutocomplete(name).then(setSuggestions);
    }, 280);
    return () => clearTimeout(h);
  }, [name]);

  const addMut = useMutation({
    mutationFn: () => insertFavoriteBar(user!.id, name, address || null),
    onSuccess: async () => {
      setName('');
      setAddress('');
      setSuggestions([]);
      await qc.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFavoriteBar(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  });

  const openMaps = useCallback((q: string) => {
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  }, []);

  const onPick = useCallback(
    async (item: PlaceAutocompleteItem) => {
      setSuggestions([]);
      const d = await fetchPlaceDetails(item.placeId);
      if (d) {
        setName(d.name || item.mainText);
        setAddress(d.formattedAddress || item.secondaryText);
      } else {
        setName(item.mainText);
        setAddress(item.secondaryText);
      }
    },
    [],
  );

  return (
    <Screen>
      {!user ? (
        <Card>
          <Body>{t('signInPrompt')}</Body>
        </Card>
      ) : null}

      {user ? (
        <Card>
          <Body style={{ fontWeight: '700', marginBottom: 8 }}>{t('profileFavoritesTitle')}</Body>
          <Muted style={styles.label}>{t('profileFavoritesName')}</Muted>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('profileFavoritesNamePlaceholder')}
            placeholderTextColor={brandColors.tanMuted}
            style={styles.input}
          />
          {suggestions.length > 0 ? (
            <View style={styles.suggest}>
              {suggestions.map((s) => (
                <Pressable key={s.placeId} onPress={() => void onPick(s)} style={styles.suggestRow}>
                  <Body>{s.mainText}</Body>
                  <Muted numberOfLines={2}>{s.secondaryText}</Muted>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Muted style={styles.label}>{t('profileFavoritesAddress')}</Muted>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="123 High St"
            placeholderTextColor={brandColors.tanMuted}
            style={styles.input}
          />
          <AppButton
            label={t('profileFavoritesAdd')}
            disabled={addMut.isPending || !name.trim()}
            onPress={() => addMut.mutate()}
          />
        </Card>
      ) : null}

      {listQuery.data?.map((f) => (
        <Card key={f.id}>
          <Body>{f.bar_name}</Body>
          {f.bar_address ? <Muted>{f.bar_address}</Muted> : null}
          <AppButton
            label="Open in Maps"
            variant="secondary"
            onPress={() => openMaps([f.bar_name, f.bar_address].filter(Boolean).join(' '))}
          />
          <AppButton
            label="Remove"
            variant="ghost"
            onPress={() => delMut.mutate(f.id)}
            disabled={delMut.isPending}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brandColors.cream,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  suggest: {
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 10,
    marginBottom: 8,
    maxHeight: 160,
    overflow: 'hidden',
  },
  suggestRow: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.borderSubtle,
  },
});
