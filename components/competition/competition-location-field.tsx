import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Body, Muted } from '@/components/split-the-g/typography';
import { brandColors } from '@/constants/theme';
import type { PlaceAutocompleteItem } from '@/lib/places/google-places';
import { fetchPlaceAutocomplete, fetchPlaceDetails } from '@/lib/places/google-places';

export interface CompetitionLocationValue {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
}

interface CompetitionLocationFieldProps {
  value: CompetitionLocationValue;
  onChange: (next: CompetitionLocationValue) => void;
  venueNameLabel: string;
  venueNamePlaceholder: string;
  venueAddressLabel: string;
}

export function CompetitionLocationField({
  value,
  onChange,
  venueNamePlaceholder,
  venueAddressLabel,
  venueNameLabel,
}: CompetitionLocationFieldProps) {
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAutocomplete = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const items = await fetchPlaceAutocomplete(q);
      setSuggestions(items);
    }, 280);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const onPickPlace = useCallback(
    async (item: PlaceAutocompleteItem) => {
      setSuggestions([]);
      const details = await fetchPlaceDetails(item.placeId);
      if (!details) {
        onChange({
          ...value,
          name: item.mainText || item.description,
          address: item.secondaryText || item.description,
          placeId: item.placeId,
          lat: null,
          lng: null,
        });
        return;
      }
      onChange({
        name: details.name || item.mainText,
        address: details.formattedAddress || '',
        lat: details.lat,
        lng: details.lng,
        placeId: details.placeId,
      });
    },
    [onChange, value],
  );

  const renderSuggestion: ListRenderItem<PlaceAutocompleteItem> = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.suggestRow}
        onPress={() => void onPickPlace(item)}
        accessibilityRole="button">
        <Body style={styles.suggestMain}>{item.mainText}</Body>
        {item.secondaryText ? <Muted style={styles.suggestSub}>{item.secondaryText}</Muted> : null}
      </Pressable>
    ),
    [onPickPlace],
  );

  const hasMap = value.lat != null && value.lng != null && Number.isFinite(value.lat) && Number.isFinite(value.lng);

  return (
    <View style={styles.wrap}>
      <Muted>{venueNameLabel}</Muted>
      <TextInput
        value={value.name}
        onChangeText={(name) => {
          onChange({ ...value, name, lat: null, lng: null, placeId: null });
          runAutocomplete(name);
        }}
        style={styles.input}
        placeholder={venueNamePlaceholder}
        placeholderTextColor={brandColors.tanMuted}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestBox}>
          <FlatList
            data={suggestions}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.placeId}
            renderItem={renderSuggestion}
            style={styles.suggestList}
          />
        </View>
      ) : null}
      <Muted>{venueAddressLabel}</Muted>
      <TextInput
        value={value.address}
        onChangeText={(address) => onChange({ ...value, address, lat: null, lng: null, placeId: null })}
        style={styles.input}
        placeholderTextColor={brandColors.tanMuted}
      />
      {hasMap ? (
        <MapView
          style={styles.map}
          pointerEvents="none"
          region={{
            latitude: value.lat as number,
            longitude: value.lng as number,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}>
          <Marker coordinate={{ latitude: value.lat as number, longitude: value.lng as number }} />
        </MapView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: brandColors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: brandColors.cream,
    marginBottom: 8,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  suggestBox: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: brandColors.frame,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(11, 11, 11, 0.65)',
  },
  suggestList: { flexGrow: 0 },
  suggestRow: {
    borderBottomWidth: 1,
    borderBottomColor: brandColors.frame,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  suggestMain: { fontWeight: '600', color: brandColors.cream },
  suggestSub: { marginTop: 2, fontSize: 12 },
  map: {
    height: 140,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: brandColors.frame,
    overflow: 'hidden',
  },
});
